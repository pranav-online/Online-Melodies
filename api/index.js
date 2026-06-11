import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to fetch and parse HTML to extract ytInitialData
async function searchYouTubeVideos(query) {
  try {
    // Encodes the query and appends the video filter (sp=EgIQAQ%253D%253D is "videos only")
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube request failed with status ${response.status}`);
    }

    const html = await response.text();
    
    // Find ytInitialData script contents
    let jsonStr = '';
    const match = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (match) {
      jsonStr = match[1];
    } else {
      const match2 = html.match(/ytInitialData\s*=\s*({.+?})\s*</);
      if (match2) {
        jsonStr = match2[1];
      } else {
        const match3 = html.match(/window\[['"]ytInitialData['"]\]\s*=\s*({.+?});/);
        if (match3) {
          jsonStr = match3[1];
        }
      }
    }

    if (!jsonStr) {
      console.warn('Could not find ytInitialData script in HTML');
      return [];
    }

    // Clean up potential formatting differences
    const data = JSON.parse(jsonStr);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
    
    const videos = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const vr = item.videoRenderer;
        
        // Skip live stream badge items or unplayable items if possible
        const isLive = vr.badges?.some(badge => badge.metadataBadgeRenderer?.label === 'LIVE') || false;
        if (isLive) continue;

        const videoId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.accessibility?.accessibilityData?.label || '';
        
        // Route thumbnails through the local backend proxy to avoid adblocker blocks
        const thumbnail = `/api/thumbnail/${videoId}`;
        
        const channelName = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || 'Unknown Artist';
        const duration = vr.lengthText?.simpleText || '0:00';
        const views = vr.viewCountText?.simpleText || '';
        const published = vr.publishedTimeText?.simpleText || '';

        videos.push({
          id: videoId,
          title,
          thumbnail,
          channelName,
          duration,
          views,
          published
        });
      }
    }

    return videos;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}

// Search endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  console.log(`Searching for: "${query}"`);
  const results = await searchYouTubeVideos(query);
  res.json(results);
});

// Thumbnail proxy endpoint to bypass client adblockers and privacy shields
app.get('/api/thumbnail/:id', async (req, res) => {
  const { id } = req.params;
  
  // Try resolutions in order of preference
  const resolutions = ['hqdefault', 'mqdefault', 'default'];
  
  for (const resName of resolutions) {
    try {
      const tbUrl = `https://i.ytimg.com/vi/${id}/${resName}.jpg`;
      const response = await fetch(tbUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*'
        }
      });
      
      if (response.ok) {
        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }
    } catch (err) {
      console.error(`Failed to fetch thumbnail for ${id} at ${resName}:`, err);
    }
  }
  
  res.status(404).send('Not Found');
});

// Suggestions autocomplete endpoint (uses FireFox's YouTube suggest queries API)
app.get('/api/suggest', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json([]);
  }

  try {
    const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const response = await fetch(suggestUrl);
    if (!response.ok) {
      throw new Error(`Autocomplete API failed`);
    }
    const data = await response.json();
    // Firefox API response format: [query, [suggestion1, suggestion2, ...]]
    const suggestions = data[1] || [];
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.json([]);
  }
});

// Helper to get Spotify Access Token via Client Credentials flow
async function getSpotifyClientCredentialsToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify Server Credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the .env file.');
  }

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Spotify credentials token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Fetch Spotify Playlist metadata and tracks (Option 1: Server-side Client Credentials)
app.get('/api/spotify/playlist/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const accessToken = await getSpotifyClientCredentialsToken();
    const playlistUrl = `https://api.spotify.com/v1/playlists/${id}`;

    const response = await fetch(playlistUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Playlist not found. Make sure the playlist is set to Public.' });
      }
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData?.error?.message || 'Failed to fetch playlist from Spotify' });
    }

    const data = await response.json();
    const tracksData = data.tracks?.items || [];
    
    // Filter out null tracks and map metadata
    const tracks = tracksData
      .filter(item => item && item.track)
      .map(item => {
        const track = item.track;
        return {
          query: `${track.name} ${track.artists?.[0]?.name || ''}`.trim(),
          title: track.name,
          artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
        };
      })
      .slice(0, 20); // Cap at 20 tracks to prevent YouTube search rate limits

    res.json({
      name: data.name || 'Imported Spotify Playlist',
      description: data.description || 'No description provided.',
      tracks
    });
  } catch (err) {
    console.error('Error in /api/spotify/playlist endpoint:', err);
    res.status(500).json({ error: err.message || 'Server error fetching Spotify playlist' });
  }
});

// Helper to extract audio stream URL directly from the YouTube watch page (fallback)
async function getYouTubeAudioUrl(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube page: ${response.status}`);
  }

  const html = await response.text();
  
  let playerResponseStr = '';
  const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (match) {
    playerResponseStr = match[1];
  } else {
    const match2 = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*</);
    if (match2) {
      playerResponseStr = match2[1];
    }
  }

  if (!playerResponseStr) {
    throw new Error('Could not find player response in HTML');
  }

  const playerResponse = JSON.parse(playerResponseStr);
  const streamingData = playerResponse.streamingData;
  if (!streamingData) {
    throw new Error('No streaming data found in player response');
  }

  const formats = [...(streamingData.formats || []), ...(streamingData.adaptiveFormats || [])];
  const audioFormats = formats.filter(f => f.mimeType && f.mimeType.startsWith('audio/'));
  
  if (audioFormats.length === 0) {
    throw new Error('No audio formats found');
  }

  // Sort by bitrate descending to get best quality
  audioFormats.sort((a, b) => (b.averageBitrate || b.bitrate || 0) - (a.averageBitrate || a.bitrate || 0));

  // Find first format with a direct URL
  const formatWithUrl = audioFormats.find(f => f.url);
  if (formatWithUrl) {
    return formatWithUrl.url;
  }

  const cipherFormat = audioFormats.find(f => f.signatureCipher || f.cipher);
  if (cipherFormat) {
    const cipherStr = cipherFormat.signatureCipher || cipherFormat.cipher;
    const params = new URLSearchParams(cipherStr);
    const url = params.get('url');
    if (url) return url;
  }

  throw new Error('Could not find direct audio stream URL');
}

// List of public Piped instances to fetch streams securely
const PIPED_API_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.yt',
  'https://piped-api.lunar.icu',
  'https://pipedapi.privacydev.net',
  'https://piped-api.us.projectsegfau.lt'
];

async function fetchAudioStreamFromPiped(videoId) {
  let lastError = null;

  for (const instance of PIPED_API_INSTANCES) {
    try {
      const url = `${instance}/streams/${videoId}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(3000) // 3-second timeout per instance
      });

      if (!response.ok) {
        throw new Error(`Instance returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.audioStreams || data.audioStreams.length === 0) {
        throw new Error('No audio streams returned by instance');
      }

      const audioStreams = data.audioStreams.filter(s => s.mimeType && s.mimeType.startsWith('audio/'));
      if (audioStreams.length === 0) {
        throw new Error('No audio mime streams returned by instance');
      }

      // Sort by quality
      audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      const bestStream = audioStreams[0];
      
      console.log(`Successfully fetched stream for ${videoId} from ${instance}`);
      return bestStream.url;
    } catch (err) {
      console.warn(`Piped instance ${instance} failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All Piped instances failed to fetch stream for ${videoId}. Last error: ${lastError?.message}`);
}

// Audio Stream Redirect Endpoint
app.get('/api/stream/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Stream request for video ID: ${id}`);

  try {
    const streamUrl = await fetchAudioStreamFromPiped(id);
    return res.redirect(streamUrl);
  } catch (err) {
    console.warn(`Piped stream extraction failed for ${id}, trying native watch scraper fallback...`, err.message);
    try {
      const fallbackUrl = await getYouTubeAudioUrl(id);
      return res.redirect(fallbackUrl);
    } catch (fallbackErr) {
      console.error(`All streaming methods failed for ${id}:`, fallbackErr.message);
      return res.status(500).json({ error: 'Failed to extract playable audio stream: ' + fallbackErr.message });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Serve static assets from the Vite build directory (only when running locally as a standalone server)
if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '../dist')));

  // Fallback all other GET requests to SPA index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Online-Melodies server is running on http://localhost:${PORT}`);
  });
}

export default app;
