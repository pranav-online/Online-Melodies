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

const SILENT_AUDIO_URI = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV";

function App() {
  const silentAudioRef = useRef(null);
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

  // YouTube IFrame Player References
  const [ytPlayer, setYtPlayer] = useState(null);
  const playerReadyRef = useRef(false);
  const lastAutoResumeRef = useRef(0);

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
      if (codeVerifier) {
        if (clientId) {
          fetchSpotifyTokenWithCode(code, codeVerifier, clientId);
        } else {
          // Fetch from backend configuration if local storage is cleared
          fetch('/api/spotify/config')
            .then(res => res.json())
            .then(data => {
              if (data.clientId) {
                localStorage.setItem('online_melodies_spotify_client_id', data.clientId);
                fetchSpotifyTokenWithCode(code, codeVerifier, data.clientId);
              }
            })
            .catch(err => console.error('Error fetching Spotify config during callback:', err));
        }
      }
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, []);

  // Load YouTube Player API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initYTPlayer();
      };
    } else {
      initYTPlayer();
    }

    return () => {
      // clean up global callback
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  // Refs to avoid stale closures in YouTube Player callbacks
  const onStateChangeRef = useRef();
  const onErrorRef = useRef();

  // Keep references up to date with every render
  useEffect(() => {
    onStateChangeRef.current = (state) => {
      if (state === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        if (ytPlayer) {
          const dur = ytPlayer.getDuration();
          if (dur) setDuration(dur);
        }
      } else if (state === window.YT.PlayerState.PAUSED) {
        if (isPlaying && document.visibilityState === 'hidden') {
          // Automatic pause due to tab backgrounding / screen lock.
          // Keep isPlaying as true, and keep the unmuted silent audio active.
          if (silentAudioRef.current) {
            silentAudioRef.current.play().catch(() => {});
          }
          const now = Date.now();
          if (now - lastAutoResumeRef.current > 5000) {
            lastAutoResumeRef.current = now;
            if (ytPlayer && playerReadyRef.current) {
              try {
                ytPlayer.playVideo();
              } catch (e) {
                console.warn('Failed to force resume background playback:', e);
              }
            }
          }
        } else {
          setIsPlaying(false);
        }
      } else if (state === window.YT.PlayerState.ENDED) {
        setIsPlaying(false);
        handlePlaybackEnded();
      }
    };
  });

  useEffect(() => {
    onErrorRef.current = (event) => {
      console.error('YouTube Player Error:', event.data);
      setIsPlaying(false);
      playNextSong();
    };
  });

  const initYTPlayer = () => {
    if (playerReadyRef.current) return;
    try {
      window.ytPlayerInstance = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          playsinline: 1
        },
        events: {
          onReady: (event) => {
            setYtPlayer(event.target);
            playerReadyRef.current = true;
            event.target.setVolume(volume);
          },
          onStateChange: (event) => {
            if (onStateChangeRef.current) {
              onStateChangeRef.current(event.data);
            }
          },
          onError: (event) => {
            if (onErrorRef.current) {
              onErrorRef.current(event);
            }
          }
        }
      });
    } catch (err) {
      console.error('Failed to initialize YouTube IFrame Player:', err);
    }
  };

  // Poll current time while playing
  useEffect(() => {
    let interval;
    if (isPlaying && ytPlayer) {
      interval = setInterval(() => {
        try {
          const time = ytPlayer.getCurrentTime();
          setCurrentTime(time);
        } catch (e) {
          // ignore transient player errors
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, ytPlayer]);

  // Sleep Timer countdown loop
  useEffect(() => {
    if (sleepTimer === null) return;

    if (sleepTimer <= 0) {
      if (ytPlayer && playerReadyRef.current) {
        try {
          ytPlayer.pauseVideo();
        } catch (e) {
          console.error('Failed to pause player on sleep timer completion:', e);
        }
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
  }, [sleepTimer, ytPlayer]);

  // Synchronize silent audio with isPlaying (fallback / state keep-alive)
  useEffect(() => {
    const silentAudio = silentAudioRef.current;
    if (!silentAudio) return;

    if (isPlaying) {
      silentAudio.play().catch((err) => {
        console.warn('Silent audio play failed in effect:', err);
      });
    } else {
      silentAudio.pause();
    }
  }, [isPlaying]);

  // Keep references updated to avoid stale closures in Media Session handlers
  const mediaActionsRef = useRef({});
  useEffect(() => {
    mediaActionsRef.current = { togglePlay, playNextSong, playPreviousSong, seekTo };
  });

  // Synchronize Media Session metadata
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || 'Unknown Song',
        artist: currentSong.channelName || 'Unknown Artist',
        album: 'Online-Melodies',
        artwork: [
          { src: currentSong.thumbnail || '', sizes: '96x96', type: 'image/jpeg' },
          { src: currentSong.thumbnail || '', sizes: '128x128', type: 'image/jpeg' },
          { src: currentSong.thumbnail || '', sizes: '192x192', type: 'image/jpeg' },
          { src: currentSong.thumbnail || '', sizes: '256x256', type: 'image/jpeg' },
          { src: currentSong.thumbnail || '', sizes: '384x384', type: 'image/jpeg' },
          { src: currentSong.thumbnail || '', sizes: '512x512', type: 'image/jpeg' },
        ]
      });
    } catch (e) {
      console.error('Failed to set Media Session metadata:', e);
    }
  }, [currentSong]);

  // Synchronize Media Session playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Register Media Session action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (ytPlayer && playerReadyRef.current) {
          try {
            ytPlayer.playVideo();
            setIsPlaying(true);
            if (silentAudioRef.current) {
              silentAudioRef.current.play().catch(() => {});
            }
          } catch (e) {
            console.error('Media Session Play handler failed:', e);
          }
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (ytPlayer && playerReadyRef.current) {
          try {
            ytPlayer.pauseVideo();
            setIsPlaying(false);
            if (silentAudioRef.current) {
              silentAudioRef.current.pause();
            }
          } catch (e) {
            console.error('Media Session Pause handler failed:', e);
          }
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        mediaActionsRef.current.playPreviousSong();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        mediaActionsRef.current.playNextSong();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          mediaActionsRef.current.seekTo(details.seekTime);
        }
      });
    } catch (error) {
      console.warn('Failed to register Media Session handlers:', error);
    }

    return () => {
      if (!('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch (e) {}
    };
  }, [ytPlayer]);

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

  // Ensure background playback is kept alive if the app is hidden
  useEffect(() => {
    const attemptBackgroundKeepAlive = () => {
      if (!isPlaying) return;
      if (silentAudioRef.current) {
        silentAudioRef.current.play().catch((err) => {
          console.warn('Failed to keep silent audio alive on background:', err);
        });
      }
      if (ytPlayer && playerReadyRef.current) {
        try {
          ytPlayer.playVideo();
        } catch (err) {
          console.warn('Failed to resume YT playback on background:', err);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        attemptBackgroundKeepAlive();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', attemptBackgroundKeepAlive);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', attemptBackgroundKeepAlive);
    };
  }, [isPlaying, ytPlayer]);

  useEffect(() => {
    const ensureAppHistoryState = () => {
      if (!window.history.state || !window.history.state.onlineMelodiesApp) {
        window.history.replaceState({ onlineMelodiesApp: true }, '');
        window.history.pushState({ onlineMelodiesApp: true }, '');
      }
    };

    const handlePopState = (event) => {
      if (isPlaying && event.state && event.state.onlineMelodiesApp) {
        window.history.pushState({ onlineMelodiesApp: true }, '');
        if (silentAudioRef.current) {
          silentAudioRef.current.play().catch(() => {});
        }
        if (ytPlayer && playerReadyRef.current) {
          try {
            ytPlayer.playVideo();
          } catch (err) {
            console.warn('Failed to resume YT playback on popstate:', err);
          }
        }
      }
    };

    const handleBeforeUnload = (event) => {
      if (!isPlaying) return;
      event.preventDefault();
      event.returnValue = '';
    };

    ensureAppHistoryState();
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPlaying, ytPlayer]);

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

    if (ytPlayer && playerReadyRef.current) {
      try {
        ytPlayer.loadVideoById(song.id);
        ytPlayer.playVideo();
        setIsPlaying(true);
        if (silentAudioRef.current) {
          silentAudioRef.current.play().catch(e => console.warn('Silent audio play failed:', e));
        }
      } catch (err) {
        console.error('Failed to load video on YT Player:', err);
      }
    }
  };

  const togglePlay = () => {
    if (!ytPlayer || !currentSong) return;
    try {
      if (isPlaying) {
        ytPlayer.pauseVideo();
        setIsPlaying(false);
        if (silentAudioRef.current) {
          silentAudioRef.current.pause();
        }
      } else {
        ytPlayer.playVideo();
        setIsPlaying(true);
        if (silentAudioRef.current) {
          silentAudioRef.current.play().catch(e => console.warn('Silent audio play failed:', e));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const seekTo = (seconds) => {
    if (!ytPlayer) return;
    try {
      ytPlayer.seekTo(seconds, true);
      setCurrentTime(seconds);
    } catch (e) {
      console.error(e);
    }
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (!ytPlayer) return;
    try {
      ytPlayer.setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        ytPlayer.unMute();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMute = () => {
    if (!ytPlayer) return;
    try {
      if (isMuted) {
        setIsMuted(false);
        ytPlayer.unMute();
        ytPlayer.setVolume(volume);
      } else {
        setIsMuted(true);
        ytPlayer.mute();
      }
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

      {/* Floating mini-video player (required for YouTube IFrame rendering) */}
      <div 
        id="yt-player-container" 
        style={{
          position: 'fixed',
          bottom: showMiniPlayer && currentSong ? '110px' : 'auto',
          right: showMiniPlayer && currentSong ? '20px' : 'auto',
          left: showMiniPlayer && currentSong ? 'auto' : '-9999px',
          top: showMiniPlayer && currentSong ? 'auto' : '-9999px',
          width: '280px',
          height: '160px',
          zIndex: 1000,
          overflow: 'hidden',
          borderRadius: '16px',
          border: showMiniPlayer && currentSong ? '1px solid rgba(255, 255, 255, 0.1)' : '0',
          boxShadow: showMiniPlayer && currentSong ? '0 20px 40px rgba(0, 0, 0, 0.6)' : 'none',
          background: '#000',
          opacity: showMiniPlayer && currentSong ? 1 : 0,
          pointerEvents: showMiniPlayer && currentSong ? 'auto' : 'none'
        }}
        aria-hidden={!(showMiniPlayer && currentSong)}
      >
        <div id="yt-player" style={{ width: '100%', height: '100%' }}></div>
      </div>

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

      {/* Silent audio for background play keep-alive */}
      <audio 
        ref={silentAudioRef} 
        src={SILENT_AUDIO_URI} 
        loop 
        playsInline 
        preload="auto"
        style={{ display: 'none' }} 
      />

      {/* Cinematic Splash Screen Intro */}
      {showSplash && (
        <SplashIntro onComplete={() => setShowSplash(false)} />
      )}
    </div>
  );
}

export default App;
