import express from 'express';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { registerUser, loginUser, verifySession, logoutUser, syncUserData } from './db.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load env file dynamically if not loaded already (useful for local run without --env-file flag)
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
    console.log('Successfully loaded .env file natively via process.loadEnvFile');
  }
} catch (e) {
  console.warn('Note: process.loadEnvFile not supported or failed to load:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to fetch and parse HTML to extract ytInitialData
let cachedInvidiousInstances = [];
let cacheTime = 0;

async function getInvidiousInstances() {
  const now = Date.now();
  if (cachedInvidiousInstances.length > 0 && (now - cacheTime) < 3600 * 1000) {
    return cachedInvidiousInstances;
  }

  try {
    const res = await fetch('https://api.invidious.io/instances.json?sort_by=type,health', {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      const instances = [];
      for (const [domain, details] of data) {
        if (details.type === 'https' && details.monitor && details.monitor.uptime > 90) {
          instances.push(`https://${domain}`);
        }
      }
      if (instances.length > 0) {
        cachedInvidiousInstances = instances;
        cacheTime = now;
        return instances;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch dynamic Invidious instances list:', err.message);
  }

  return [
    'https://yt.chocolatemoo53.com',
    'https://yewtu.be',
    'https://invidious.flokinet.to',
    'https://inv.nadeko.net'
  ];
}

function formatSeconds(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

let cachedPipedInstances = [];
let pipedCacheTime = 0;

async function getPipedInstances() {
  const now = Date.now();
  if (cachedPipedInstances.length > 0 && (now - pipedCacheTime) < 3600 * 1000) {
    return cachedPipedInstances;
  }

  try {
    const res = await fetch('https://piped-instances.kavin.rocks/', {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      const instances = [];
      for (const item of data) {
        if (item.api_url && item.uptime_24h > 90) {
          instances.push(item.api_url);
        }
      }
      if (instances.length > 0) {
        cachedPipedInstances = instances;
        pipedCacheTime = now;
        return instances;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch dynamic Piped instances list:', err.message);
  }

  return [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks'
  ];
}

async function searchPipedFallback(query) {
  const instances = await getPipedInstances();
  
  for (let i = 0; i < Math.min(instances.length, 5); i++) {
    const instance = instances[i];
    const searchUrl = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
    console.log(`Trying fallback search on Piped instance: ${instance}`);
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const videos = data.items
            .filter(item => item.type === 'stream')
            .map(item => {
              const videoId = item.url ? item.url.split('v=')[1] : '';
              if (!videoId) return null;
              const viewsCount = item.views ? Number(item.views).toLocaleString() : '';
              return {
                id: videoId,
                title: item.title || '',
                thumbnail: `/api/thumbnail/${videoId}`,
                channelName: item.uploaderName || 'Unknown Artist',
                duration: formatSeconds(item.duration),
                views: viewsCount ? `${viewsCount} views` : '',
                published: item.uploadedDate || ''
              };
            })
            .filter(Boolean);
          if (videos.length > 0) return videos;
        }
      }
    } catch (err) {
      console.warn(`Fallback search failed on Piped ${instance}:`, err.message);
    }
  }
  return [];
}

async function searchYouTubeAPI(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    console.log('Using official YouTube Data API for search');
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const errorText = await searchRes.text();
      throw new Error(`YouTube API search failed: ${searchRes.status} - ${errorText}`);
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) return [];

    const videoIds = items.map(item => item.id.videoId).join(',');

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds}&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) {
      return items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title || '',
        thumbnail: `/api/thumbnail/${item.id.videoId}`,
        channelName: item.snippet.channelTitle || 'Unknown Artist',
        duration: '0:00',
        views: '',
        published: item.snippet.publishedAt ? new Date(item.snippet.publishedAt).toLocaleDateString() : ''
      }));
    }

    const detailsData = await detailsRes.json();
    const videoDetails = detailsData.items || [];
    const detailsMap = new Map(videoDetails.map(v => [v.id, v]));

    const parseISO8601Duration = (isoDuration) => {
      if (!isoDuration) return '0:00';
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return '0:00';
      const hours = parseInt(match[1] || 0, 10);
      const minutes = parseInt(match[2] || 0, 10);
      const seconds = parseInt(match[3] || 0, 10);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      return formatSeconds(totalSeconds);
    };

    return items.map(item => {
      const videoId = item.id.videoId;
      const detail = detailsMap.get(videoId);
      
      const duration = detail ? parseISO8601Duration(detail.contentDetails?.duration) : '0:00';
      const viewsRaw = detail ? detail.statistics?.viewCount : null;
      const views = viewsRaw ? `${Number(viewsRaw).toLocaleString()} views` : '';
      
      return {
        id: videoId,
        title: item.snippet.title || '',
        thumbnail: `/api/thumbnail/${videoId}`,
        channelName: item.snippet.channelTitle || 'Unknown Artist',
        duration,
        views,
        published: item.snippet.publishedAt ? new Date(item.snippet.publishedAt).toLocaleDateString() : ''
      };
    });
  } catch (err) {
    console.error('YouTube Data API search failed:', err.message);
    return null;
  }
}

async function searchInvidiousFallback(query) {
  const instances = await getInvidiousInstances();
  
  for (let i = 0; i < Math.min(instances.length, 5); i++) {
    const instance = instances[i];
    const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
    console.log(`Trying fallback search on Invidious instance: ${instance}`);
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const videos = data.map(item => {
            const videoId = item.videoId;
            const viewsCount = item.viewCount ? Number(item.viewCount).toLocaleString() : '';
            return {
              id: videoId,
              title: item.title || '',
              thumbnail: `/api/thumbnail/${videoId}`,
              channelName: item.author || 'Unknown Artist',
              duration: formatSeconds(item.lengthSeconds),
              views: viewsCount ? `${viewsCount} views` : '',
              published: item.publishedText || ''
            };
          });
          return videos;
        }
      }
    } catch (err) {
      console.warn(`Fallback search failed on ${instance}:`, err.message);
    }
  }
  return [];
}

// Helper to fetch and parse HTML to extract ytInitialData
async function searchYouTubeVideos(query) {
  if (process.env.YOUTUBE_API_KEY) {
    const apiResults = await searchYouTubeAPI(query);
    if (apiResults !== null) {
      return apiResults;
    }
  }

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
      throw new Error('Could not find ytInitialData script in HTML');
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

    if (videos.length === 0) {
      throw new Error('Parsed 0 videos from YouTube results page');
    }

    return videos;
  } catch (error) {
    console.warn(`Primary YouTube scraper failed, trying Piped fallback:`, error.message);
    const pipedResults = await searchPipedFallback(query);
    if (pipedResults && pipedResults.length > 0) {
      return pipedResults;
    }
    console.warn(`Piped fallback failed, trying Invidious fallback`);
    return searchInvidiousFallback(query);
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

const streamCache = new Map();

// Reusable helper to resolve YouTube audio stream URL using ytdl-core and fallbacks
async function resolveAudioStreamUrl(id) {
  // Check cache first
  const cached = streamCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`Using cached stream URL for: ${id}`);
    return cached.url;
  }

  let cleanUrl = null;

  // Try youtube-dl-exec first (natively runs yt-dlp, extremely stable and immune to signature changes)
  try {
    console.log(`Trying youtube-dl-exec (yt-dlp) resolver for: ${id}`);
    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    const audioUrl = await youtubedl(videoUrl, {
      getUrl: true,
      format: 'bestaudio'
    });
    if (audioUrl) {
      cleanUrl = audioUrl.trim();
      console.log(`youtube-dl-exec successfully resolved audio stream!`);
    }
  } catch (err) {
    console.warn(`youtube-dl-exec resolver failed for ${id}:`, err.message);
  }
  
  // Try Cobalt instances fallback
  if (!cleanUrl) {
    const cobaltInstances = [
      'https://api.cobalt.tools/api/json',
      'https://co.wuk.sh/api/json',
      'https://cobalt.api.ryz.cx/api/json'
    ];

    for (const apiOf of cobaltInstances) {
      try {
        console.log(`Trying Cobalt resolver: ${apiOf}`);
        const response = await fetch(apiOf, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://cobalt.tools',
            'Referer': 'https://cobalt.tools/'
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${id}`,
            isAudioOnly: true
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.url) {
            console.log(`Cobalt successfully resolved audio stream!`);
            cleanUrl = data.url;
            break;
          }
        }
      } catch (err) {
        console.warn(`Cobalt resolver ${apiOf} failed:`, err.message);
      }
    }
  }

  // Fallback to Piped API
  if (!cleanUrl) {
    try {
      const pipedInstances = await getPipedInstances();
      for (let i = 0; i < Math.min(pipedInstances.length, 3); i++) {
        const apiOf = pipedInstances[i];
        console.log(`Trying Piped resolver: ${apiOf}`);
        try {
          const response = await fetch(`${apiOf}/streams/${id}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(4000)
          });

          if (response.ok) {
            const data = await response.json();
            // Find first audio stream
            if (data && data.audioStreams && data.audioStreams.length > 0) {
              console.log(`Piped successfully resolved audio stream!`);
              cleanUrl = data.audioStreams[0].url;
              break;
            }
            // Check for muxed video stream containing audio
            if (data && data.videoStreams) {
              const muxed = data.videoStreams.find(v => !v.videoOnly);
              if (muxed && muxed.url) {
                console.log(`Piped successfully resolved muxed stream containing audio!`);
                cleanUrl = muxed.url;
                break;
              }
            }
          }
        } catch (err) {
          console.warn(`Piped resolver ${apiOf} failed:`, err.message);
        }
      }
    } catch (err) {
      console.warn(`Piped check failed:`, err.message);
    }
  }

  // Fallback to Invidious API
  if (!cleanUrl) {
    try {
      const invidiousInstances = await getInvidiousInstances();
      for (let i = 0; i < Math.min(invidiousInstances.length, 3); i++) {
        const apiOf = invidiousInstances[i];
        console.log(`Trying Invidious resolver: ${apiOf}`);
        try {
          const response = await fetch(`${apiOf}/api/v1/videos/${id}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(4000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.adaptiveFormats) {
            const audioStream = data.adaptiveFormats.find(f => f.type && f.type.startsWith('audio'));
            if (audioStream && audioStream.url) {
              console.log(`Invidious successfully resolved audio stream!`);
              cleanUrl = audioStream.url;
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`Invidious resolver ${apiOf} failed:`, err.message);
      }
    }
  } catch (err) {
    console.warn(`Invidious check failed:`, err.message);
  }
  }

  if (cleanUrl) {
    // Cache the resolved URL with expiration
    let expiresAt = Date.now() + 4 * 3600 * 1000; // default 4 hours
    try {
      const urlObj = new URL(cleanUrl);
      const expireParam = urlObj.searchParams.get('expire');
      if (expireParam) {
        expiresAt = Number(expireParam) * 1000 - 60000; // 1 min buffer
      }
    } catch (e) {}
    
    streamCache.set(id, { url: cleanUrl, expiresAt });
    return cleanUrl;
  }

  return null;
}

// Audio stream proxy/redirect resolver JSON endpoint
app.get('/api/stream/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`Resolving stream URL for video: ${id}`);
  const audioUrl = await resolveAudioStreamUrl(id);
  if (audioUrl) {
    return res.json({ url: audioUrl });
  }
  
  res.status(404).json({ error: 'Could not resolve playable audio stream for this video' });
});

// Audio streaming range proxy endpoint
app.get('/api/stream/play/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`Proxying audio stream for video: ${id}`);
  const audioUrl = await resolveAudioStreamUrl(id);
  if (!audioUrl) {
    return res.status(404).json({ error: 'Could not resolve playable audio stream' });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const ytResponse = await fetch(audioUrl, { headers });

    // Forward status code (e.g. 206 for Partial Content, or 200 OK)
    res.status(ytResponse.status);

    // Forward key streaming headers
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control'
    ];
    for (const name of headersToForward) {
      const value = ytResponse.headers.get(name);
      if (value) {
        res.setHeader(name, value);
      }
    }

    // Ensure accept-ranges is set so seeking works in mobile Safari/Chrome
    if (!res.getHeader('accept-ranges')) {
      res.setHeader('accept-ranges', 'bytes');
    }

    // Stream the body chunks
    const body = ytResponse.body;
    if (body) {
      const { Readable } = await import('stream');
      Readable.fromWeb(body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error(`Stream proxy failed for ${id}:`, err.message);
    res.status(500).json({ error: 'Failed to proxy audio stream' });
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

// Expose public Spotify Client ID (used for frontend authentication)
app.get('/api/spotify/config', (req, res) => {
  res.json({
    clientId: process.env.SPOTIFY_CLIENT_ID || null
  });
});

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
      const bodyText = await response.text().catch(() => '');
      let errMsg = '';
      try {
        const json = JSON.parse(bodyText);
        errMsg = json?.error?.message;
      } catch (e) {
        errMsg = bodyText;
      }
      
      if (response.status === 403 && errMsg.includes('premium subscription')) {
        errMsg = 'An active Spotify Premium subscription is required for the Developer App Owner to use direct server-side URL imports. Please click "Spotify Playlist Sync" to connect your personal Spotify account first, which allows importing public playlists via your user session.';
      }
      
      return res.status(response.status).json({ error: errMsg || 'Failed to fetch playlist from Spotify' });
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

// Authentication Endpoints
app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.trim().length < 3 || password.length < 4) {
    return res.status(400).json({ error: 'Username (min 3 characters) and password (min 4 characters) are required' });
  }

  try {
    const result = await registerUser(username.trim(), password);
    res.status(201).json({ message: 'User registered successfully', username: result.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const result = await loginUser(username.trim(), password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const user = await verifySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  res.json(user);
});

app.post('/api/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  await logoutUser(token);
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/sync', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { username, likedSongs, playlists, recentlyPlayed } = req.body;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    await syncUserData(username, token, { likedSongs, playlists, recentlyPlayed });
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(401).json({ error: err.message });
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
