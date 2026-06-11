import React, { useState } from 'react';
import { Home, Search, Heart, Music, Sliders, Mic2, BarChart2, Plus, ListMusic, X, Download, Check } from 'lucide-react';

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

function Sidebar({ currentTab, setCurrentTab, playlists, activePlaylistId, setActivePlaylistId, createPlaylist, addSongToPlaylist, isOpen, onClose }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // Import Playlist wizard states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState('select-source'); // 'select-source' | 'connecting' | 'select-playlists' | 'syncing' | 'complete'
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]); // Array of indices
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncingText, setSyncingText] = useState('');

  const handleOpenImport = () => {
    setImportStep('select-source');
    setSelectedSource(null);
    setSelectedPlaylists([]);
    setSyncProgress(0);
    setSyncingText('');
    setShowImportModal(true);
  };

  const handleSelectSource = (source) => {
    setSelectedSource(source);
    setImportStep('connecting');
    
    // Simulate connection lag (1.5 seconds)
    setTimeout(() => {
      setImportStep('select-playlists');
      // Auto-check all playlists by default
      const defaultIndices = MOCK_IMPORT_DATA[source].map((_, i) => i);
      setSelectedPlaylists(defaultIndices);
    }, 1500);
  };

  const handleTogglePlaylistSelection = (index) => {
    setSelectedPlaylists(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleStartSync = () => {
    if (selectedPlaylists.length === 0) return;
    setImportStep('syncing');
    setSyncProgress(0);
    
    const playlistsToImport = selectedPlaylists.map(idx => MOCK_IMPORT_DATA[selectedSource][idx]);
    let currentPlaylistIndex = 0;
    let currentSongIndex = 0;
    
    const totalPlaylists = playlistsToImport.length;
    const totalSongs = playlistsToImport.reduce((sum, p) => sum + p.songs.length, 0);
    let songsProcessed = 0;

    const runSyncTick = () => {
      if (currentPlaylistIndex >= totalPlaylists) {
        setSyncProgress(100);
        setSyncingText("All playlists successfully imported!");
        setTimeout(() => {
          setImportStep('complete');
        }, 500);
        return;
      }

      const playlist = playlistsToImport[currentPlaylistIndex];
      const song = playlist.songs[currentSongIndex];
      
      setSyncingText(`Importing "${playlist.name}" - Resolving: ${song.title}...`);

      setTimeout(() => {
        songsProcessed++;
        const progress = Math.round((songsProcessed / totalSongs) * 100);
        setSyncProgress(progress);

        currentSongIndex++;
        if (currentSongIndex >= playlist.songs.length) {
          // Finished this playlist, create it in parent app!
          const playlistId = createPlaylist(playlist.name, playlist.description);
          // Add all songs
          playlist.songs.forEach(s => {
            addSongToPlaylist(playlistId, s);
          });
          
          currentPlaylistIndex++;
          currentSongIndex = 0;
        }
        
        runSyncTick();
      }, 350);
    };

    runSyncTick();
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
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  Select the external music service you want to import your playlists from:
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
                </div>
              </>
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
                    Initializing mock secure OAuth handshake & fetching library metadata...
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
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  We discovered the following playlists on your account. Select which ones to import:
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {MOCK_IMPORT_DATA[selectedSource].map((playlist, idx) => {
                    const isChecked = selectedPlaylists.includes(idx);
                    return (
                      <div 
                        key={idx}
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
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playlist.songs.length} songs • {playlist.description}</span>
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
                  })}
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
                    onClick={handleStartSync}
                    className="btn-primary"
                    disabled={selectedPlaylists.length === 0}
                    style={{ padding: '10px 24px', fontSize: '14px', opacity: selectedPlaylists.length === 0 ? 0.5 : 1 }}
                  >
                    Import Selected ({selectedPlaylists.length})
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
                    Successfully imported {selectedPlaylists.length} playlists directly into your Online-Melodies library.
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
