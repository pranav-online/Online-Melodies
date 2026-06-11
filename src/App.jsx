import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Home from './components/Home';
import Search from './components/Search';
import Playlists from './components/Playlists';
import Queue from './components/Queue';
import Lyrics from './components/Lyrics';
import Visualizer from './components/Visualizer';
import Equalizer from './components/Equalizer';
import LikeAnimation from './components/LikeAnimation';
import SplashIntro from './components/SplashIntro';

// Helper to parse duration string (e.g. "3:45" or "1:02:14") to seconds
export const parseDurationToSeconds = (durationStr) => {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return Number(durationStr) || 0;
};

// Helper to format seconds to string "M:SS"
export const formatTime = (secs) => {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

import { Menu } from 'lucide-react';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Spotify Authentication states
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [autoOpenSpotifyImport, setAutoOpenSpotifyImport] = useState(false);
  const [pendingPlaylistUrl, setPendingPlaylistUrl] = useState(null);

  // Navigation & Active View Tab
  const [currentTab, setCurrentTab] = useState('home');
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar drawer automatically when switching tabs
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentTab, activePlaylistId]);

  // Player State
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none' | 'all' | 'one'
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [currentVibe, setCurrentVibe] = useState('classic');
  const [sleepTimer, setSleepTimer] = useState(null); // time in seconds

  // Media Playback lists
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [history, setHistory] = useState([]);
  
  // Library collections
  const [likedSongs, setLikedSongs] = useState(() => {
    const local = localStorage.getItem('online_melodies_liked');
    return local ? JSON.parse(local) : [];
  });
  const [playlists, setPlaylists] = useState(() => {
    try {
      const local = localStorage.getItem('online_melodies_playlists');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse playlists:', e);
    }
    return [];
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    const local = localStorage.getItem('online_melodies_recent');
    return local ? JSON.parse(local) : [];
  });

  // Equalizer presets & custom gains
  const [eqPreset, setEqPreset] = useState('flat');
  const [eqGains, setEqGains] = useState({ bass: 0, mid: 0, treble: 0, vocal: 0 });

  // Native HTML5 Audio Player Reference
  const audioRef = useRef(null);

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('online_melodies_liked', JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    localStorage.setItem('online_melodies_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('online_melodies_recent', JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  // Exchange Spotify OAuth Code for Access Token (PKCE flow)
  const fetchSpotifyTokenWithCode = async (code, codeVerifier, clientId) => {
    const redirectUri = window.location.origin + '/';
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      if (data.access_token) {
        setSpotifyToken(data.access_token);
        setAutoOpenSpotifyImport(true);
        
        // Resume pending URL import if exists
        const pendingUrl = localStorage.getItem('online_melodies_pending_url');
        if (pendingUrl) {
          setPendingPlaylistUrl(pendingUrl);
        }
      }
    } catch (err) {
      console.error('Spotify token exchange failed:', err);
    } finally {
      localStorage.removeItem('spotify_code_verifier');
    }
  };

  // Parse Spotify access token from URL hash or authorization code from search query on redirect callback
  useEffect(() => {
    // 1. Try Implicit Grant fallback (from hash)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        setSpotifyToken(token);
        setAutoOpenSpotifyImport(true);
        
        const pendingUrl = localStorage.getItem('online_melodies_pending_url');
        if (pendingUrl) {
          setPendingPlaylistUrl(pendingUrl);
        }
        
        window.history.replaceState(null, null, window.location.pathname);
        return;
      }
    }

    // 2. Try PKCE code exchange (from search query)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      const codeVerifier = localStorage.getItem('spotify_code_verifier');
      const clientId = localStorage.getItem('online_melodies_spotify_client_id');
      if (codeVerifier && clientId) {
        fetchSpotifyTokenWithCode(code, codeVerifier, clientId);
      }
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, []);

  // Sleep Timer countdown loop
  useEffect(() => {
    if (sleepTimer === null) return;

    if (sleepTimer <= 0) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setSleepTimer(null);
      return;
    }

    const interval = setInterval(() => {
      setSleepTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer]);

  // Vibe detection helper
  const detectVibe = (song) => {
    const title = (song.title || '').toLowerCase();
    const artist = (song.channelName || '').toLowerCase();
    
    if (title.includes('remix') || title.includes('mix') || title.includes('dj') || title.includes('dance') || title.includes('beat') || title.includes('edm') || title.includes('party') || title.includes('rap') || title.includes('hip hop') || title.includes('dappu') || title.includes('mass')) {
      return 'neon'; // Neon Synthwave
    } else if (title.includes('lofi') || title.includes('lo-fi') || title.includes('chill') || title.includes('sleep') || title.includes('relax') || title.includes('sad') || title.includes('broken') || title.includes('peace') || title.includes('melody') || title.includes('piano')) {
      return 'chill'; // Chill Lofi
    } else if (title.includes('love') || title.includes('romantic') || title.includes('sweet') || title.includes('dil') || title.includes('pyar') || title.includes('prema') || title.includes('kaadhal') || title.includes('mohabat')) {
      return 'ocean'; // Ocean Wave
    } else if (title.includes('classical') || title.includes('retro') || title.includes('old') || title.includes('gold') || title.includes('bhajan') || title.includes('ghazal') || title.includes('instrumental') || title.includes('90s') || title.includes('80s')) {
      return 'gold'; // Golden Melody
    } else if (title.includes('theme') || title.includes('bgm') || title.includes('cinematic') || title.includes('ost') || title.includes('teaser') || title.includes('trailer') || title.includes('epic') || title.includes('action') || title.includes('mass bgm')) {
      return 'crimson'; // Retro Crimson
    }
    return 'classic'; // Default Spotify Green
  };

  // Apply vibe to DOM
  useEffect(() => {
    document.body.className = `vibe-${currentVibe}`;
  }, [currentVibe]);

  // Sync initial volume and mute preferences on element mount
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Set up Media Session API for lock screen background controls
  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.channelName,
        album: 'Online-Melodies',
        artwork: [
          { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.error(e));
          setIsPlaying(true);
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPreviousSong();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextSong();
      });
    }
  }, [currentSong]);

  // Main playback commands
  const playSong = (song, upcomingQueue = null) => {
    if (!song) return;
    
    // Add to queue if not present, and update queue states
    if (upcomingQueue) {
      setQueue(upcomingQueue);
      const idx = upcomingQueue.findIndex(s => s.id === song.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      // Check if song is in current queue
      const idx = queue.findIndex(s => s.id === song.id);
      if (idx !== -1) {
        setQueueIndex(idx);
      } else {
        // Append and play
        const newQueue = [...queue, song];
        setQueue(newQueue);
        setQueueIndex(newQueue.length - 1);
      }
    }

    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(parseDurationToSeconds(song.duration));
    
    // Set Vibe dynamically
    const vibe = detectVibe(song);
    setCurrentVibe(vibe);

    // Save to recently played
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      return [song, ...filtered].slice(0, 30); // Cap at 30
    });

    if (audioRef.current) {
      try {
        audioRef.current.src = `/api/stream/${song.id}`;
        audioRef.current.play().catch(e => console.error("Playback start failed:", e));
        setIsPlaying(true);
      } catch (err) {
        console.error('Failed to load audio stream:', err);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(e => console.error(e));
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const seekTo = (seconds) => {
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    } catch (e) {
      console.error(e);
    }
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (!audioRef.current) return;
    try {
      audioRef.current.volume = newVolume / 100;
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    try {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      audioRef.current.muted = nextMute;
    } catch (e) {
      console.error(e);
    }
  };

  const playNextSong = () => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        return; // reached end of playlist
      }
    }
    
    setQueueIndex(nextIdx);
    playSong(queue[nextIdx], queue);
  };

  const playPreviousSong = () => {
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    
    if (prevIdx < 0) {
      if (repeatMode === 'all') {
        prevIdx = queue.length - 1;
      } else {
        prevIdx = 0; // hold at first song
      }
    }
    
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx], queue);
  };

  const handlePlaybackEnded = () => {
    if (repeatMode === 'one') {
      if (ytPlayer) {
        ytPlayer.seekTo(0, true);
        ytPlayer.playVideo();
        setIsPlaying(true);
      }
    } else {
      playNextSong();
    }
  };

  // Playlists and Library adjustments
  const toggleLikeSong = (song, e) => {
    const exists = likedSongs.some(s => s.id === song.id);
    if (exists) {
      setLikedSongs(prev => prev.filter(s => s.id !== song.id));
    } else {
      // Dispatch custom event to trigger canvas laser lines & light show animation
      const detail = { song };
      if (e && e.clientX && e.clientY) {
        detail.x = e.clientX;
        detail.y = e.clientY;
      }
      window.dispatchEvent(new CustomEvent('trigger-like-animation', { detail }));
      setLikedSongs(prev => [...prev, song]);
    }
  };

  const createPlaylist = (name, description = '') => {
    const id = Date.now().toString();
    const newPlaylist = { id, name, description, songs: [] };
    setPlaylists(prev => [...prev, newPlaylist]);
    return id;
  };

  const deletePlaylist = (playlistId) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (activePlaylistId === playlistId) {
      setCurrentTab('home');
    }
  };

  const addSongToPlaylist = (playlistId, song) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const alreadyHas = p.songs.some(s => s.id === song.id);
        if (alreadyHas) return p;
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    }));
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.id !== songId) };
      }
      return p;
    }));
  };

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);

  // Renders the specific tab view
  const renderView = () => {
    switch (currentTab) {
      case 'home':
        return (
          <Home 
            playSong={playSong}
            likedSongs={likedSongs}
            toggleLikeSong={toggleLikeSong}
            recentlyPlayed={recentlyPlayed}
            setCurrentTab={setCurrentTab}
            setActivePlaylistId={setActivePlaylistId}
            createPlaylist={createPlaylist}
            playlists={playlists}
            addSongToPlaylist={addSongToPlaylist}
          />
        );
      case 'search':
        return (
          <Search 
            playSong={playSong}
            likedSongs={likedSongs}
            toggleLikeSong={toggleLikeSong}
            playlists={playlists}
            addSongToPlaylist={addSongToPlaylist}
            recentlyPlayed={recentlyPlayed}
          />
        );
      case 'liked':
        return (
          <Playlists
            playlist={{ name: 'Liked Songs', songs: likedSongs, description: 'Your personal collection of favorite tracks.' }}
            playSong={playSong}
            likedSongs={likedSongs}
            toggleLikeSong={toggleLikeSong}
            isLikedFolder={true}
            setCurrentTab={setCurrentTab}
            playlists={playlists}
            addSongToPlaylist={addSongToPlaylist}
          />
        );
      case 'playlist':
        return activePlaylist ? (
          <Playlists
            playlist={activePlaylist}
            playSong={playSong}
            likedSongs={likedSongs}
            toggleLikeSong={toggleLikeSong}
            removeSongFromPlaylist={removeSongFromPlaylist}
            deletePlaylist={deletePlaylist}
            isLikedFolder={false}
            setCurrentTab={setCurrentTab}
            playlists={playlists}
            addSongToPlaylist={addSongToPlaylist}
          />
        ) : (
          <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Playlist not found.</div>
        );
      case 'queue':
        return (
          <Queue 
            queue={queue}
            queueIndex={queueIndex}
            setQueue={setQueue}
            setQueueIndex={setQueueIndex}
            playSong={playSong}
            currentSong={currentSong}
          />
        );
      case 'lyrics':
        return <Lyrics currentSong={currentSong} currentTime={currentTime} isPlaying={isPlaying} />;
      case 'visualizer':
        return (
          <Visualizer 
            isPlaying={isPlaying} 
            currentTime={currentTime} 
            currentVibe={currentVibe} 
            currentSong={currentSong}
            eqGains={eqGains}
          />
        );
      case 'equalizer':
        return (
          <Equalizer 
            eqPreset={eqPreset} 
            setEqPreset={setEqPreset} 
            eqGains={eqGains} 
            setEqGains={setEqGains} 
          />
        );
      default:
        return <Home playSong={playSong} likedSongs={likedSongs} toggleLikeSong={toggleLikeSong} />;
    }
  };

  return (
    <div className="app-container">
      {/* Background glowing spheres */}
      <div className="glow-bg">
        <div className="glow-sphere glow-sphere-1"></div>
        <div className="glow-sphere glow-sphere-2"></div>
      </div>

      {/* Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab}
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        setActivePlaylistId={setActivePlaylistId}
        createPlaylist={createPlaylist}
        addSongToPlaylist={addSongToPlaylist}
        spotifyToken={spotifyToken}
        setSpotifyToken={setSpotifyToken}
        autoOpenSpotifyImport={autoOpenSpotifyImport}
        setAutoOpenSpotifyImport={setAutoOpenSpotifyImport}
        pendingPlaylistUrl={pendingPlaylistUrl}
        setPendingPlaylistUrl={setPendingPlaylistUrl}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="main-view">
        {/* Sticky Mobile Header */}
        <div className="mobile-header">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="btn-icon"
            style={{ color: '#fff' }}
          >
            <Menu size={22} />
          </button>
          <span style={{ fontWeight: '800', fontSize: '18px', fontFamily: 'var(--font-secondary)', color: '#fff' }}>
            Online-Melodies
          </span>
          <div style={{ width: '36px' }}></div>
        </div>
        {renderView()}
      </main>

      {/* Backdrop overlay for mobile sidebar drawer */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/* Native HTML5 Audio Player for background playback */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={handlePlaybackEnded}
      />

      {/* Bottom Playback bar */}
      <Player 
        currentSong={currentSong}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        currentTime={currentTime}
        duration={duration}
        seekTo={seekTo}
        volume={volume}
        changeVolume={changeVolume}
        isMuted={isMuted}
        toggleMute={toggleMute}
        shuffle={shuffle}
        setShuffle={setShuffle}
        repeatMode={repeatMode}
        setRepeatMode={setRepeatMode}
        playNext={playNextSong}
        playPrevious={playPreviousSong}
        showMiniPlayer={showMiniPlayer}
        setShowMiniPlayer={setShowMiniPlayer}
        currentVibe={currentVibe}
        setCurrentVibe={setCurrentVibe}
        likedSongs={likedSongs}
        toggleLikeSong={toggleLikeSong}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        playlists={playlists}
        addSongToPlaylist={addSongToPlaylist}
        sleepTimer={sleepTimer}
        setSleepTimer={setSleepTimer}
      />

      {/* Full-screen Music Laser & Light show animation on Like */}
      <LikeAnimation />

      {/* Cinematic Splash Screen Intro */}
      {showSplash && (
        <SplashIntro onComplete={() => setShowSplash(false)} />
      )}
    </div>
  );
}

export default App;
