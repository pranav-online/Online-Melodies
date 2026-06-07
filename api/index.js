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
