import React, { useState } from 'react';
import { Home, Search, Heart, Music, Sliders, Mic2, BarChart2, Plus, ListMusic, X } from 'lucide-react';

function Sidebar({ currentTab, setCurrentTab, playlists, activePlaylistId, setActivePlaylistId, createPlaylist, isOpen, onClose }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

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
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-icon" 
            style={{ padding: '4px' }}
            title="Create Playlist"
          >
            <Plus size={16} />
          </button>
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
    </aside>
  );
}

export default Sidebar;
