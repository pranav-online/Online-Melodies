import React, { useState, useEffect } from 'react';
import { Home, Search, Heart, Music, Sliders, Mic2, BarChart2, Plus, ListMusic, X, Download, Check, ClipboardList, FileText } from 'lucide-react';

const MOCK_IMPORT_DATA = {
  spotify: [
    {
      name: "Today's Top Hits (Spotify)",
      description: "The biggest hits on Spotify right now.",
      songs: [
        { id: 'H5v3kku4y6Q', title: 'As It Was', channelName: 'Harry Styles', duration: '2:47', thumbnail: '/api/thumbnail/H5v3kku4y6Q' },
        { id: 'G7KNmW9a75Y', title: 'Flowers', channelName: 'Miley Cyrus', duration: '3:20', thumbnail: '/api/thumbnail/G7KNmW9a75Y' },
        { id: 'kTJczUoc26U', title: 'Stay', channelName: 'The Kid LAROI & Justin Bieber', duration: '2:21', thumbnail: '/api/thumbnail/kTJczUoc26U' },
        { id: 'TUVcZfQe-Kw', title: 'Levitating', channelName: 'Dua Lipa', duration: '3:23', thumbnail: '/api/thumbnail/TUVcZfQe-Kw' }
      ]
    },
    {
      name: "Discover Weekly (Spotify)",
      description: "Your weekly mixtape of fresh discoveries.",
      songs: [
        { id: 'orJSJGHjBLI', title: 'Bad Habits', channelName: 'Ed Sheeran', duration: '3:51', thumbnail: '/api/thumbnail/orJSJGHjBLI' },
        { id: 'XXYlFuWEuKI', title: 'Save Your Tears', channelName: 'The Weeknd', duration: '3:11', thumbnail: '/api/thumbnail/XXYlFuWEuKI' },
        { id: 'gdZLi9oWNZg', title: 'Dynamite', channelName: 'BTS', duration: '3:19', thumbnail: '/api/thumbnail/gdZLi9oWNZg' }
      ]
    }
  ],
  apple: [
    {
      name: "A-List Pop (Apple Music)",
      description: "The crown jewels of pop music on Apple Music.",
      songs: [
        { id: '4NRXx6caWNE', title: 'Blinding Lights', channelName: 'The Weeknd', duration: '3:22', thumbnail: '/api/thumbnail/4NRXx6caWNE' },
        { id: 'JGwWNGJdvx8', title: 'Shape of You', channelName: 'Ed Sheeran', duration: '4:24', thumbnail: '/api/thumbnail/JGwWNGJdvx8' },
        { id: '2Vv-BfVoq4g', title: 'Perfect', channelName: 'Ed Sheeran', duration: '4:23', thumbnail: '/api/thumbnail/2Vv-BfVoq4g' }
      ]
    },
    {
      name: "Pure Focus (Apple Music)",
      description: "Ambient and chill pop tracks to keep you concentrated.",
      songs: [
        { id: 'hLQl3WQQoQ0', title: 'Someone Like You', channelName: 'Adele', duration: '4:45', thumbnail: '/api/thumbnail/hLQl3WQQoQ0' },
        { id: '7wtfhZwyrcc', title: 'Believer', channelName: 'Imagine Dragons', duration: '3:24', thumbnail: '/api/thumbnail/7wtfhZwyrcc' }
      ]
    }
  ],
  amazon: [
    {
      name: "All Hits (Amazon Music)",
      description: "Chart-topping hits from Amazon Music.",
      songs: [
        { id: '34Na4j8AVgA', title: 'Starboy', channelName: 'The Weeknd', duration: '3:50', thumbnail: '/api/thumbnail/34Na4j8AVgA' },
        { id: 'Pkh8UtuejGw', title: 'Senorita', channelName: 'Shawn Mendes & Camila Cabello', duration: '3:11', thumbnail: '/api/thumbnail/Pkh8UtuejGw' },
        { id: 'S9bCLPwzSC0', title: 'Mockingbird', channelName: 'Eminem', duration: '4:11', thumbnail: '/api/thumbnail/S9bCLPwzSC0' }
      ]
    }
  ]
};

function Sidebar({
  currentTab,
  setCurrentTab,
  playlists,
  activePlaylistId,
  setActivePlaylistId,
  createPlaylist,
  addSongToPlaylist,
  spotifyToken,
  setSpotifyToken,
  autoOpenSpotifyImport,
  setAutoOpenSpotifyImport,
  pendingPlaylistUrl,
  setPendingPlaylistUrl,
  isOpen,
  onClose
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // Import Playlist wizard states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState('select-source'); // 'select-source' | 'spotify-config' | 'text-config' | 'connecting' | 'select-playlists' | 'syncing' | 'complete'
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]); // Array of indices
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncingText, setSyncingText] = useState('');

  // Real Spotify credentials & data
  const [spotifyClientId, setSpotifyClientId] = useState(() => localStorage.getItem('online_melodies_spotify_client_id') || '');
  const [tempClientId, setTempClientId] = useState(spotifyClientId);
  const [backendClientId, setBackendClientId] = useState('');
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Text & CSV Import states
  const [textImportMode, setTextImportMode] = useState('file'); // 'file' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedTracks, setParsedTracks] = useState([]);

  // Spotify Playlist URL Import states
  const [pastedPlaylistUrl, setPastedPlaylistUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchedPlaylistInfo, setFetchedPlaylistInfo] = useState(null);

  // Fetch Spotify configuration from backend on mount
  useEffect(() => {
    const fetchSpotifyConfig = async () => {
      try {
        const response = await fetch('/api/spotify/config');
        if (response.ok) {
          const data = await response.json();
          if (data.clientId) {
            setBackendClientId(data.clientId);
            // Pre-fill setup Client ID if the user hasn't stored one locally yet
            if (!localStorage.getItem('online_melodies_spotify_client_id')) {
              setTempClientId(data.clientId);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch Spotify client configuration:', err);
      }
    };
    fetchSpotifyConfig();
  }, []);

  // Watch for Spotify Redirect parameters on mount/reload
  useEffect(() => {
    if (autoOpenSpotifyImport && spotifyToken) {
      setSelectedSource('spotify');
      setImportStep('connecting');
      setShowImportModal(true);
      setAutoOpenSpotifyImport(false);
      
      const pendingUrl = localStorage.getItem('online_melodies_pending_url');
      if (pendingUrl) {
        setPendingPlaylistUrl(pendingUrl);
      } else {
        fetchRealSpotifyPlaylists(spotifyToken);
      }
    }
  }, [autoOpenSpotifyImport, spotifyToken]);

  // Watch for pending URL to resume fetching after redirect loop
  useEffect(() => {
    if (pendingPlaylistUrl && spotifyToken) {
      const url = pendingPlaylistUrl;
      setPendingPlaylistUrl(null);
      localStorage.removeItem('online_melodies_pending_url');
      handleUrlImport(url);
    }
  }, [pendingPlaylistUrl, spotifyToken]);

  const handleUrlImport = async (urlToParse) => {
    const url = urlToParse || pastedPlaylistUrl;
    if (!url) return;
    
    setErrorMessage('');
    setIsFetchingUrl(true);
    
    const match = url.match(/playlist\/([a-zA-Z0-9]{22})/);
    if (!match) {
      setErrorMessage('Invalid Spotify playlist URL. Please check the link.');
      setIsFetchingUrl(false);
      return;
    }
    
    const playlistId = match[1];
    setImportStep('connecting');
    setSelectedSource('spotify');
    
    try {
      let data;
      if (spotifyToken) {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 403) {
            setSpotifyToken(null);
          }
          throw new Error(errData?.error?.message || `Spotify API returned status ${response.status}`);
        }
        const playlistData = await response.json();
        const tracksData = playlistData.tracks?.items || [];
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
          .slice(0, 20); // limit to first 20 tracks
        data = {
          name: playlistData.name,
          description: playlistData.description || 'No description provided.',
          tracks
        };
      } else {
        const response = await fetch(`/api/spotify/playlist/${playlistId}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error || `Server failed to fetch playlist (status: ${response.status})`);
        }
        data = await response.json();
      }
      
      if (!data.tracks || data.tracks.length === 0) {
        throw new Error('No tracks found in this Spotify playlist.');
      }
      
      setFetchedPlaylistInfo({
        name: data.name,
        description: data.description,
        tracks: data.tracks
      });
      setPastedPlaylistUrl('');
      setImportStep('preview-playlist');
    } catch (err) {
      console.error(err);
      setErrorMessage(`Error fetching Spotify playlist by URL: ${err.message}`);
      setImportStep('select-source');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const fetchRealSpotifyPlaylists = async (token) => {
    setErrorMessage('');
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401) {
        setSpotifyToken(null);
        setImportStep('select-source');
        setErrorMessage('Spotify session expired. Please connect again.');
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let errMsg = errData?.error?.message || `Failed to fetch playlists (status: ${response.status})`;
        if (response.status === 403) {
          setSpotifyToken(null); // Clear invalid token so we can request a fresh one
          errMsg = 'Failed to fetch playlists (status: 403). Your Spotify account must be added to the "User Management" list in the Spotify Developer Dashboard for this Client ID. Ensure you have registered your email under Developer Settings.';
        }
        throw new Error(errMsg);
      }
      const data = await response.json();
      const items = data.items || [];
      const formatted = items.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || 'No description provided.',
        tracksCount: p.tracks?.total || 0,
        images: p.images
      }));
      setSpotifyPlaylists(formatted);
      setImportStep('select-playlists');
      // Auto-check all playlists by default
      const defaultIndices = formatted.map((_, i) => i);
      setSelectedPlaylists(defaultIndices);
    } catch (err) {
      console.error(err);
      setErrorMessage(`Error fetching Spotify playlists: ${err.message}`);
      setImportStep('select-source');
    }
  };

// Helper to generate a random string for PKCE verifier
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Helper to hash and base64-url encode PKCE code verifier
const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

  const triggerSpotifyRedirect = async (clientId) => {
    try {
      const redirectUri = window.location.origin + '/';
      const scope = 'playlist-read-private playlist-read-collaborative';
      
      const verifier = generateRandomString(64);
      localStorage.setItem('spotify_code_verifier', verifier);
      
      const challenge = await generateCodeChallenge(verifier);
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&code_challenge_method=S256&code_challenge=${challenge}`;
      
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to trigger Spotify PKCE redirect:', err);
      setErrorMessage('Security configuration error while setting up secure Spotify handshake.');
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!tempClientId.trim()) return;
    const cleanId = tempClientId.trim();
    localStorage.setItem('online_melodies_spotify_client_id', cleanId);
    setSpotifyClientId(cleanId);
    triggerSpotifyRedirect(cleanId);
  };

  const handleResetSpotify = () => {
    localStorage.removeItem('online_melodies_spotify_client_id');
    setSpotifyClientId('');
    setTempClientId('');
    setSpotifyToken(null);
    setSpotifyPlaylists([]);
    setSelectedPlaylists([]);
    setImportStep('select-source');
  };

  const handleOpenImport = () => {
    setImportStep('select-source');
    setSelectedSource(null);
    setSelectedPlaylists([]);
    setSyncProgress(0);
    setSyncingText('');
    setErrorMessage('');
    setFetchedPlaylistInfo(null);
    setShowImportModal(true);
  };

  const handleSelectSource = (source) => {
    setSelectedSource(source);
    setErrorMessage('');
    
    if (source === 'spotify') {
      if (spotifyToken) {
        setImportStep('connecting');
        fetchRealSpotifyPlaylists(spotifyToken);
      } else if (backendClientId) {
        // Skip setup screen entirely and redirect using the server-configured client ID
        localStorage.setItem('online_melodies_spotify_client_id', backendClientId);
        setSpotifyClientId(backendClientId);
        setTempClientId(backendClientId);
        setImportStep('connecting');
        triggerSpotifyRedirect(backendClientId);
      } else {
        setImportStep('spotify-config');
      }
    } else if (source === 'text') {
      setPastedText('');
      setUploadedFileName('');
      setParsedTracks([]);
      setImportStep('text-config');
    } else {
      setImportStep('connecting');
      setTimeout(() => {
        setImportStep('select-playlists');
        const defaultIndices = (MOCK_IMPORT_DATA[source] || []).map((_, i) => i);
        setSelectedPlaylists(defaultIndices);
      }, 1500);
    }
  };

  const parseTextPlaylist = (rawText) => {
    const lines = rawText.split('\n');
    const tracks = [];
    let isCsv = false;
    let headers = null;
    
    // Check if it looks like a CSV (contains commas and multiple lines)
    const firstLine = lines[0] || '';
    if (firstLine.includes(',') && lines.length > 1) {
      isCsv = true;
      const cols = firstLine.split(',').map(c => c.trim().toLowerCase());
      const titleIdx = cols.findIndex(c => c.includes('title') || c.includes('track') || c.includes('name'));
      const artistIdx = cols.findIndex(c => c.includes('artist') || c.includes('singer') || c.includes('band'));
      if (titleIdx !== -1 || artistIdx !== -1) {
        headers = { titleIdx, artistIdx };
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (isCsv && headers && i === 0) {
        continue; // skip header line
      }
      
      if (isCsv && headers) {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim());
        const title = headers.titleIdx !== -1 && headers.titleIdx < parts.length ? parts[headers.titleIdx] : '';
        const artist = headers.artistIdx !== -1 && headers.artistIdx < parts.length ? parts[headers.artistIdx] : '';
        if (title || artist) {
          tracks.push({
            query: `${title} ${artist}`.trim(),
            title: title || 'Unknown Title',
            artist: artist || 'Unknown Artist'
          });
          continue;
        }
      }

      if (line.includes(',')) {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const title = parts[0].trim();
          const artist = parts[1].trim();
          tracks.push({
            query: `${title} ${artist}`,
            title,
            artist
          });
          continue;
        }
      }

      if (line.includes(' - ')) {
        const parts = line.split(' - ');
        const title = parts[0].trim();
        const artist = parts[1].trim();
        tracks.push({
          query: line,
          title,
          artist
        });
      } else if (line.includes(' by ')) {
        const parts = line.split(' by ');
        const title = parts[0].trim();
        const artist = parts[1].trim();
        tracks.push({
          query: line,
          title,
          artist
        });
      } else {
        tracks.push({
          query: line,
          title: line,
          artist: 'Unknown Artist'
        });
      }
    }
    return tracks;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadedFileName(file.name.replace(/\.[^/.]+$/, ""));
    setErrorMessage('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const tracks = parseTextPlaylist(text);
      setParsedTracks(tracks);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleTextImportSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    let tracks = [];
    let playlistName = 'Imported Text Playlist';
    
    if (textImportMode === 'file') {
      if (parsedTracks.length === 0) {
        setErrorMessage('Please upload a valid text or CSV file first.');
        return;
      }
      tracks = parsedTracks;
      playlistName = uploadedFileName || 'Imported File Playlist';
    } else {
      if (!pastedText.trim()) {
        setErrorMessage('Please paste some songs in the text box.');
        return;
      }
      tracks = parseTextPlaylist(pastedText);
      playlistName = 'Imported List Playlist';
    }
    
    if (tracks.length === 0) {
      setErrorMessage('No tracks found to parse. Please check your format.');
      return;
    }
    
    const limitedTracks = tracks.slice(0, 20);
    setParsedTracks(limitedTracks);
    setUploadedFileName(playlistName);
    
    handleStartSync(limitedTracks, playlistName);
  };

  const handleTogglePlaylistSelection = (index) => {
    setSelectedPlaylists(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleStartSync = async (optionalTracks = null, optionalName = null) => {
    const activeSource = selectedSource;
    const tracksToSync = optionalTracks || parsedTracks;
    const playlistName = optionalName || uploadedFileName || 'Imported Playlist';

    if (activeSource !== 'text' && selectedPlaylists.length === 0) return;
    setImportStep('syncing');
    setSyncProgress(0);
    setErrorMessage('');

    try {
      if (activeSource === 'spotify') {
        const playlistsToImport = selectedPlaylists.map(idx => spotifyPlaylists[idx]);
        
        let totalTracksCount = 0;
        const playlistTracks = {};
        
        setSyncingText('Fetching tracks from Spotify playlists...');
        
        for (const playlist of playlistsToImport) {
          const res = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=20`, {
            headers: {
              'Authorization': `Bearer ${spotifyToken}`
            }
          });
          if (res.status === 401) {
            setSpotifyToken(null);
            throw new Error('Spotify session expired. Please connect again.');
          }
          if (!res.ok) {
            throw new Error(`Failed to fetch tracks for playlist "${playlist.name}"`);
          }
          const tracksData = await res.json();
          const items = (tracksData.items || []).filter(item => item && item.track);
          playlistTracks[playlist.id] = items;
          totalTracksCount += items.length;
        }

        if (totalTracksCount === 0) {
          setSyncProgress(100);
          setSyncingText('No tracks found to import.');
          setImportStep('complete');
          return;
        }

        let tracksProcessed = 0;
        
        for (const playlist of playlistsToImport) {
          const items = playlistTracks[playlist.id] || [];
          if (items.length === 0) continue;
          
          const melodiesPlaylistId = createPlaylist(playlist.name, playlist.description);
          
          for (const item of items) {
            const track = item.track;
            const trackName = track.name;
            const artistName = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
            const searchQuery = `${trackName} ${track.artists?.[0]?.name || ''}`;
            
            setSyncingText(`Importing "${playlist.name}" - Resolving: ${trackName} by ${artistName}...`);
            
            try {
              const searchRes = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
              if (searchRes.ok) {
                const results = await searchRes.json();
                if (results && results.length > 0) {
                  const match = results[0];
                  const song = {
                    id: match.id,
                    title: trackName,
                    channelName: artistName,
                    duration: match.duration,
                    thumbnail: match.thumbnail
                  };
                  addSongToPlaylist(melodiesPlaylistId, song);
                }
              }
            } catch (err) {
              console.error(`Search failed for track: ${searchQuery}`, err);
            }
            
            tracksProcessed++;
            setSyncProgress(Math.round((tracksProcessed / totalTracksCount) * 100));
            await new Promise(resolve => setTimeout(resolve, 350));
          }
        }
        
        setSyncProgress(100);
        setSyncingText('All playlists successfully imported!');
        setImportStep('complete');
        
      } else if (activeSource === 'text') {
        const totalTracks = tracksToSync.length;
        if (totalTracks === 0) {
          setSyncProgress(100);
          setSyncingText('No tracks found to import.');
          setImportStep('complete');
          return;
        }

        const melodiesPlaylistId = createPlaylist(playlistName, 'Imported from a local file or text list.');
        
        let tracksProcessed = 0;
        for (const track of tracksToSync) {
          setSyncingText(`Resolving track: ${track.title} by ${track.artist}...`);
          
          try {
            const searchRes = await fetch(`/api/search?q=${encodeURIComponent(track.query)}`);
            if (searchRes.ok) {
              const results = await searchRes.json();
              if (results && results.length > 0) {
                const match = results[0];
                const song = {
                  id: match.id,
                  title: track.title,
                  channelName: track.artist,
                  duration: match.duration,
                  thumbnail: match.thumbnail
                };
                addSongToPlaylist(melodiesPlaylistId, song);
              }
            }
          } catch (err) {
            console.error(`Search failed for track: ${track.query}`, err);
          }
          
          tracksProcessed++;
          setSyncProgress(Math.round((tracksProcessed / totalTracks) * 100));
          await new Promise(resolve => setTimeout(resolve, 350));
        }
        
        setSyncProgress(100);
        setSyncingText('Playlist successfully imported!');
        setImportStep('complete');
      } else {
        const playlistsToImport = selectedPlaylists.map(idx => MOCK_IMPORT_DATA[activeSource][idx]);
        const totalSongs = playlistsToImport.reduce((sum, p) => sum + p.songs.length, 0);
        let songsProcessed = 0;
        
        for (const playlist of playlistsToImport) {
          const melodiesPlaylistId = createPlaylist(playlist.name, playlist.description);
          
          for (const song of playlist.songs) {
            setSyncingText(`Importing "${playlist.name}" - Resolving: ${song.title}...`);
            
            await new Promise(resolve => setTimeout(resolve, 350));
            
            addSongToPlaylist(melodiesPlaylistId, song);
            songsProcessed++;
            setSyncProgress(Math.round((songsProcessed / totalSongs) * 100));
          }
        }
        
        setSyncProgress(100);
        setSyncingText('All playlists successfully imported!');
        setImportStep('complete');
      }
    } catch (err) {
      console.error('Sync Error:', err);
      setErrorMessage(err.message || 'An error occurred during sync.');
      setImportStep('select-source');
    }
  };

  const handleFinishImport = () => {
    setShowImportModal(false);
    if (playlists.length > 0) {
      const lastPlaylist = playlists[playlists.length - 1];
      setActivePlaylistId(lastPlaylist.id);
      setCurrentTab('playlist');
    }
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const id = createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
    
    // Auto redirect to new playlist
    setActivePlaylistId(id);
    setCurrentTab('playlist');
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'liked', label: 'Liked Songs', icon: Heart },
  ];

  const toolsItems = [
    { id: 'lyrics', label: 'Lyrics', icon: Mic2 },
    { id: 'visualizer', label: 'Wave Visualizer', icon: BarChart2 },
    { id: 'equalizer', label: 'Audio Equalizer', icon: Sliders },
  ];

  return (
    <aside className={`glass-panel app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Logo & Close Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        padding: '0 8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--vibe-accent) 0%, #3b82f6 100%)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--vibe-glow-1)'
          }}>
            <Music size={18} color="#000" strokeWidth={2.5} />
          </div>
          <span style={{
            fontSize: '22px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-secondary)'
          }}>Online-Melodies</span>
        </div>

        {/* Mobile close drawer button */}
        <button 
          onClick={onClose}
          className="btn-icon mobile-only-close"
          style={{ padding: '6px', color: 'var(--text-secondary)' }}
          title="Close Menu"
        >
          <X size={20} />
        </button>
      </div>


      {/* Main Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '28px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          letterSpacing: '1px',
          padding: '0 8px',
          marginBottom: '8px'
        }}>Menu</span>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setActivePlaylistId(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                color: isActive ? 'var(--vibe-accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '15px',
                fontFamily: 'var(--font-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={20} color={isActive ? 'var(--vibe-accent)' : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Premium Tools */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '28px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          letterSpacing: '1px',
          padding: '0 8px',
          marginBottom: '8px'
        }}>Premium Tools</span>
        {toolsItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setActivePlaylistId(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                color: isActive ? 'var(--vibe-accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '15px',
                fontFamily: 'var(--font-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={20} color={isActive ? 'var(--vibe-accent)' : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Playlists */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            letterSpacing: '1px'
          }}>Playlists</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleOpenImport}
              className="btn-icon" 
              style={{ padding: '4px' }}
              title="Import Playlist"
            >
              <Download size={15} />
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-icon" 
              style={{ padding: '4px' }}
              title="Create Playlist"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          maxHeight: '220px'
        }}>
          {playlists.length === 0 ? (
            <span style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              padding: '8px 12px',
              fontStyle: 'italic'
            }}>No playlists created</span>
          ) : (
            playlists.map(playlist => {
              const isActive = currentTab === 'playlist' && activePlaylistId === playlist.id;
              return (
                <button
                  key={playlist.id}
                  onClick={() => {
                    setActivePlaylistId(playlist.id);
                    setCurrentTab('playlist');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? '600' : '450',
                    fontSize: '14px',
                    fontFamily: 'var(--font-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s'
                  }}
                >
                  <ListMusic size={16} color={isActive ? 'var(--vibe-accent)' : 'var(--text-muted)'} />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{playlist.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Create Playlist Modal (Overlay) */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <form 
            onSubmit={handleCreatePlaylist}
            className="glass-card" 
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Create Playlist</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Playlist Name</label>
              <input 
                type="text" 
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                placeholder="My Awesome Hits" 
                required
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  padding: '10px 14px',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'var(--font-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Description (Optional)</label>
              <textarea 
                value={newPlaylistDesc}
                onChange={e => setNewPlaylistDesc(e.target.value)}
                placeholder="A collection of tracks for studying..." 
                rows={3}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  padding: '10px 14px',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'var(--font-primary)',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                  setNewPlaylistDesc('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '14px' }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Playlist Modal (Overlay) */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Step 1: Select Source */}
            {importStep === 'select-source' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#fff' }}>Import Playlist</h3>
                  <button onClick={() => setShowImportModal(false)} className="btn-icon" style={{ padding: '4px' }}><X size={18} /></button>
                </div>
                {errorMessage && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {errorMessage}
                  </div>
                )}

                {/* Spotify Link Paste Input */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginTop: '4px'
                }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Paste Spotify Playlist Link:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={pastedPlaylistUrl}
                      onChange={e => setPastedPlaylistUrl(e.target.value)}
                      placeholder="https://open.spotify.com/playlist/..."
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '8px 12px',
                        outline: 'none',
                        fontSize: '13px',
                        fontFamily: 'var(--font-primary)'
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => handleUrlImport()}
                      disabled={!pastedPlaylistUrl.trim() || isFetchingUrl}
                      className="btn-primary"
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        borderRadius: '8px',
                        opacity: (!pastedPlaylistUrl.trim() || isFetchingUrl) ? 0.5 : 1
                      }}
                    >
                      {isFetchingUrl ? 'Fetching...' : 'Import'}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Or select the external music service to browse your library:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    onClick={() => handleSelectSource('spotify')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(25, 20, 20, 0.4)',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-primary)',
                      fontSize: '15px',
                      fontWeight: '700',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#1DB954'; e.currentTarget.style.boxShadow = '0 0 15px rgba(29,185,84,0.15)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1DB954', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#000' }}>S</span>
                    </div>
                    <span>Spotify Playlist Sync</span>
                  </button>

                  <button 
                    onClick={() => handleSelectSource('apple')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(250, 36, 60, 0.04)',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-primary)',
                      fontSize: '15px',
                      fontWeight: '700',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#FA243C'; e.currentTarget.style.boxShadow = '0 0 15px rgba(250,36,60,0.15)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FA243C', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>A</span>
                    </div>
                    <span>Apple Music Sync</span>
                  </button>

                  <button 
                    onClick={() => handleSelectSource('amazon')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(0, 168, 225, 0.04)',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-primary)',
                      fontSize: '15px',
                      fontWeight: '700',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#00A8E1'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,168,225,0.15)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#00A8E1', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>a</span>
                    </div>
                    <span>Amazon Music Sync</span>
                  </button>

                  <button 
                    onClick={() => handleSelectSource('text')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(139, 92, 246, 0.04)',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-primary)',
                      fontSize: '15px',
                      fontWeight: '700',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 15px rgba(139,92,246,0.15)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <ClipboardList size={15} color="#fff" />
                    </div>
                    <span>Text / CSV File Sync</span>
                  </button>
                </div>
              </>
            )}

            {/* Step 1.5: Spotify Configuration Form */}
            {importStep === 'spotify-config' && (
              <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#fff' }}>Spotify Setup</h3>
                  <button type="button" onClick={() => setShowImportModal(false)} className="btn-icon" style={{ padding: '4px' }}><X size={18} /></button>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  To securely fetch your real Spotify playlists, you need to create a Spotify developer client ID.
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <strong style={{ color: '#fff' }}>Quick Instructions:</strong>
                  <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Go to the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#1DB954', textDecoration: 'underline' }}>Spotify Developer Dashboard</a> and log in.</li>
                    <li>Click <strong>Create App</strong>. Set App Name/Description, and add the Redirect URI: <code style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>{window.location.origin + '/'}</code></li>
                    <li>Go to settings of your created app, copy the <strong>Client ID</strong>, and paste it below.</li>
                  </ol>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Spotify Client ID</label>
                  <input 
                    type="text" 
                    value={tempClientId}
                    onChange={e => setTempClientId(e.target.value)}
                    placeholder="Enter your 32-character Client ID" 
                    required
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      padding: '10px 14px',
                      outline: 'none',
                      fontSize: '14px',
                      fontFamily: 'var(--font-primary)'
                    }}
                  />
                  {backendClientId && tempClientId === backendClientId && (
                    <span style={{ fontSize: '11.5px', color: '#1DB954', marginTop: '2px', fontWeight: '600' }}>
                      ✓ Pre-configured by server. You can click Connect directly!
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  {spotifyClientId && (
                    <button 
                      type="button"
                      onClick={handleResetSpotify}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textDecoration: 'underline',
                        padding: '6px 0',
                        fontWeight: '500'
                      }}
                    >
                      Clear Client ID
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                    <button 
                      type="button" 
                      onClick={() => setImportStep('select-source')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      style={{ padding: '8px 20px', fontSize: '14px' }}
                    >
                      Connect & Authorize
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 1.7: Text / CSV Configuration Form */}
            {importStep === 'text-config' && (
              <form onSubmit={handleTextImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#fff' }}>Text / CSV Import</h3>
                  <button type="button" onClick={() => setShowImportModal(false)} className="btn-icon" style={{ padding: '4px' }}><X size={18} /></button>
                </div>
                {errorMessage && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {errorMessage}
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <button
                    type="button"
                    onClick={() => setTextImportMode('file')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: textImportMode === 'file' ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: textImportMode === 'file' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextImportMode('paste')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: textImportMode === 'paste' ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: textImportMode === 'paste' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Paste List
                  </button>
                </div>

                {textImportMode === 'file' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px',
                      border: '2px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--vibe-accent)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    >
                      <FileText size={32} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', textAlign: 'center' }}>
                        {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Choose .txt or .csv File'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                        {parsedTracks.length > 0 ? `Parsed ${parsedTracks.length} tracks (First 20 will import)` : 'Supports comma-separated or dashed listings'}
                      </span>
                      <input 
                        type="file" 
                        accept=".txt,.csv" 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea 
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      placeholder="Paste your tracklist here (one song per line):&#13;Blinding Lights - The Weeknd&#13;Flowers - Miley Cyrus&#13;Shape of You" 
                      rows={6}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        color: '#fff',
                        padding: '12px 14px',
                        outline: 'none',
                        fontSize: '13.5px',
                        fontFamily: 'var(--font-primary)',
                        resize: 'none',
                        width: '100%',
                        lineHeight: '1.4'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                  <button 
                    type="button" 
                    onClick={() => setImportStep('select-source')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={textImportMode === 'file' ? !uploadedFileName : !pastedText.trim()}
                    style={{
                      padding: '8px 20px',
                      fontSize: '14px',
                      opacity: (textImportMode === 'file' ? !uploadedFileName : !pastedText.trim()) ? 0.5 : 1
                    }}
                  >
                    Parse & Import
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Connecting */}
            {importStep === 'connecting' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: '20px', textAlign: 'center' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderTopColor: selectedSource === 'spotify' ? '#1DB954' : selectedSource === 'apple' ? '#FA243C' : '#00A8E1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#fff' }}>
                    Connecting to {selectedSource === 'spotify' ? 'Spotify' : selectedSource === 'apple' ? 'Apple Music' : 'Amazon Music'}...
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    {selectedSource === 'spotify' ? 'Fetching your library and public playlists from Spotify API...' : 'Initializing mock secure OAuth handshake & fetching library metadata...'}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Select Playlists */}
            {importStep === 'select-playlists' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#fff' }}>Select Playlists</h3>
                  <button onClick={() => setShowImportModal(false)} className="btn-icon" style={{ padding: '4px' }}><X size={18} /></button>
                </div>

                {/* Spotify Link Paste Input (Alternative) */}
                {selectedSource === 'spotify' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '4px'
                  }}>
                    <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      Or paste a public Spotify Playlist Link:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={pastedPlaylistUrl}
                        onChange={e => setPastedPlaylistUrl(e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
                        style={{
                          flex: 1,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '8px 12px',
                          outline: 'none',
                          fontSize: '13px',
                          fontFamily: 'var(--font-primary)'
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => handleUrlImport()}
                        disabled={!pastedPlaylistUrl.trim() || isFetchingUrl}
                        className="btn-primary"
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          borderRadius: '8px',
                          opacity: (!pastedPlaylistUrl.trim() || isFetchingUrl) ? 0.5 : 1
                        }}
                      >
                        {isFetchingUrl ? 'Fetching...' : 'Import'}
                      </button>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  We discovered the following playlists on your account. Select which ones to import:
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {selectedSource === 'spotify' && spotifyPlaylists.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                      No playlists found in your Spotify account.
                    </div>
                  ) : (
                    (selectedSource === 'spotify' ? spotifyPlaylists : MOCK_IMPORT_DATA[selectedSource]).map((playlist, idx) => {
                      const isChecked = selectedPlaylists.includes(idx);
                      return (
                        <div 
                          key={playlist.id || idx}
                          onClick={() => handleTogglePlaylistSelection(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            border: isChecked ? '1px solid var(--vibe-accent)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1, paddingRight: '12px' }}>
                            <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playlist.name}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {selectedSource === 'spotify' ? `${playlist.tracksCount} tracks` : `${playlist.songs.length} songs`} • {playlist.description}
                            </span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {}} // handled by div click
                            style={{
                              width: '18px',
                              height: '18px',
                              accentColor: 'var(--vibe-accent)',
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  {selectedSource === 'spotify' && (
                    <button 
                      type="button"
                      onClick={handleResetSpotify}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textDecoration: 'underline',
                        padding: '6px 0',
                        fontWeight: '500'
                      }}
                    >
                      Disconnect Spotify
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                    <button 
                      onClick={() => setImportStep('select-source')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleStartSync}
                      className="btn-primary"
                      disabled={selectedPlaylists.length === 0}
                      style={{ padding: '10px 24px', fontSize: '14px', opacity: selectedPlaylists.length === 0 ? 0.5 : 1 }}
                    >
                      Import Selected ({selectedPlaylists.length})
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 3.5: Preview URL Playlist */}
            {importStep === 'preview-playlist' && fetchedPlaylistInfo && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#fff' }}>Preview Playlist</h3>
                  <button onClick={() => setShowImportModal(false)} className="btn-icon" style={{ padding: '4px' }}><X size={18} /></button>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fetchedPlaylistInfo.name}
                  </span>
                  <span 
                    style={{ fontSize: '12.5px', color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} 
                    dangerouslySetInnerHTML={{ __html: fetchedPlaylistInfo.description }} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {fetchedPlaylistInfo.tracks.map((track, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)'
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '20px', textAlign: 'center' }}>
                        {idx + 1}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {track.title}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {track.artist}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button 
                    onClick={() => setImportStep('select-source')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedSource('text'); // Reuse the track list sync engine
                      handleStartSync(fetchedPlaylistInfo.tracks, fetchedPlaylistInfo.name);
                    }}
                    className="btn-primary"
                    style={{ padding: '10px 24px', fontSize: '14px' }}
                  >
                    Import Playlist
                  </button>
                </div>
              </>
            )}

            {/* Step 4: Syncing */}
            {importStep === 'syncing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#fff' }}>Syncing Playlists...</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>{syncingText}</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${syncProgress}%`,
                      backgroundColor: 'var(--vibe-accent)',
                      borderRadius: '999px',
                      transition: 'width 0.2s ease-out'
                    }} />
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                  Matching songs to high-fidelity audio streams. Please do not close the window.
                </p>
              </div>
            )}

            {/* Step 5: Complete */}
            {importStep === 'complete' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0', gap: '22px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(29, 185, 84, 0.15)',
                  border: '2px solid #1DB954',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1DB954',
                  boxShadow: '0 0 20px rgba(29, 185, 84, 0.2)'
                }}>
                  <Check size={28} strokeWidth={3} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#fff' }}>Sync Complete!</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    {selectedSource === 'text' || fetchedPlaylistInfo
                      ? 'Successfully imported the playlist directly into your Online-Melodies library.'
                      : `Successfully imported ${selectedPlaylists.length} playlists directly into your Online-Melodies library.`}
                  </p>
                </div>
                <button 
                  onClick={handleFinishImport}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '14.5px', fontWeight: '700' }}
                >
                  Done & Go to Playlists
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
