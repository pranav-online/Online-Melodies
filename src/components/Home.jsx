import React, { useState, useEffect } from 'react';
import { Play, Heart, Plus, Library, Compass, MoreHorizontal, Check } from 'lucide-react';

const musicFallbackSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%231e293b'/><circle cx='50' cy='50' r='30' fill='%230f172a'/><circle cx='50' cy='50' r='10' fill='%2338bdf8'/><path d='M50 20 A30 30 0 0 1 80 50' stroke='%2338bdf8' stroke-width='2' fill='none' stroke-dasharray='4,4'/><circle cx='50' cy='50' r='4' fill='%230f172a'/></svg>";

function Home({ 
  playSong, 
  likedSongs, 
  toggleLikeSong, 
  recentlyPlayed, 
  setCurrentTab, 
  setActivePlaylistId,
  createPlaylist,
  playlists = [],
  addSongToPlaylist
}) {
  const [activeSongMenuId, setActiveSongMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeSongMenuId && !e.target.closest('.song-dropdown-container')) {
        setActiveSongMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activeSongMenuId]);

  const handleAddToPlaylist = (playlistId, song) => {
    addSongToPlaylist(playlistId, song);
    setActiveSongMenuId(null);
  };

  const handleLikeAndAddToPlaylist = (playlistId, song) => {
    const isLiked = likedSongs.some(s => s.id === song.id);
    if (!isLiked) {
      toggleLikeSong(song);
    }
    addSongToPlaylist(playlistId, song);
    setActiveSongMenuId(null);
  };
  
  // Dynamic Greeting based on time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Pre-configured premium songs with valid YouTube IDs
  const featuredLanguageTracks = {
    telugu: {
      title: 'Telugu Cinema Hits',
      songs: [
        { id: 'OsU0CGZoV8E', title: 'Naatu Naatu', channelName: 'Lahari Music | RRR', duration: '4:35', thumbnail: '/api/thumbnail/OsU0CGZoV8E' },
        { id: 'oyGOMVbQc9s', title: 'Samajavaragamana', channelName: 'Aditya Music | Ala Vaikunthapurramuloo', duration: '3:41', thumbnail: '/api/thumbnail/oyGOMVbQc9s' },
        { id: '2m1R21598nE', title: 'Butta Bomma', channelName: 'Aditya Music | Ala Vaikunthapurramuloo', duration: '3:33', thumbnail: '/api/thumbnail/2m1R21598nE' },
        { id: '1_A1tA2w06E', title: 'Oo Antava Mava Oo Oo Antava', channelName: 'Aditya Music | Pushpa', duration: '3:49', thumbnail: '/api/thumbnail/1_A1tA2w06E' }
      ]
    },
    hindi: {
      title: 'Bollywood Melodies',
      songs: [
        { id: 'BddP6PYo2gs', title: 'Kesariya', channelName: 'Sony Music India | Brahmastra', duration: '2:52', thumbnail: '/api/thumbnail/BddP6PYo2gs' },
        { id: 'VAdGW7QDJiU', title: 'Chaleya', channelName: 'T-Series | Jawan', duration: '3:20', thumbnail: '/api/thumbnail/VAdGW7QDJiU' },
        { id: 'ElZfdU54Es4', title: 'Apna Bana Le', channelName: 'Zee Music Company | Bhediya', duration: '4:21', thumbnail: '/api/thumbnail/ElZfdU54Es4' },
        { id: 'Umqb9gpm32c', title: 'Tum Hi Ho', channelName: 'T-Series | Aashiqui 2', duration: '4:22', thumbnail: '/api/thumbnail/Umqb9gpm32c' }
      ]
    },
    tamil: {
      title: 'Kollywood Beats',
      songs: [
        { id: 'TqV84G5rG3I', title: 'Kaavaalaa', channelName: 'Sun TV | Jailer', duration: '3:10', thumbnail: '/api/thumbnail/TqV84G5rG3I' },
        { id: '1F3hm6MfR1k', title: 'Hukum - Thalaivar Alappara', channelName: 'Sony Music South | Jailer', duration: '3:27', thumbnail: '/api/thumbnail/1F3hm6MfR1k' },
        { id: 'KUN5Uf9mObQ', title: 'Arabic Kuthu - Halamithi Habibo', channelName: 'Sun TV | Beast', duration: '4:40', thumbnail: '/api/thumbnail/KUN5Uf9mObQ' },
        { id: 'x6Q7c9RyMzk', title: 'Rowdy Baby', channelName: 'Wunderbar Studios | Maari 2', duration: '4:43', thumbnail: '/api/thumbnail/x6Q7c9RyMzk' }
      ]
    },
    english: {
      title: 'Global Pop Hits',
      songs: [
        { id: '4NRXx6caWNE', title: 'Blinding Lights', channelName: 'The Weeknd', duration: '3:22', thumbnail: '/api/thumbnail/4NRXx6caWNE' },
        { id: 'JGwWNGJdvx8', title: 'Shape of You', channelName: 'Ed Sheeran', duration: '4:24', thumbnail: '/api/thumbnail/JGwWNGJdvx8' },
        { id: 'kTJczUoc26U', title: 'Stay', channelName: 'The Kid LAROI & Justin Bieber', duration: '2:21', thumbnail: '/api/thumbnail/kTJczUoc26U' },
        { id: '34Na4j8AVgA', title: 'Starboy', channelName: 'The Weeknd', duration: '3:50', thumbnail: '/api/thumbnail/34Na4j8AVgA' }
      ]
    }
  };

  const handleQuickPlay = (song, playlist) => {
    playSong(song, playlist);
  };

  const createQuickPlaylist = () => {
    const name = prompt('Enter Playlist Name:');
    if (name) {
      createPlaylist(name);
    }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Header Panel */}
      <header className="home-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}>
        <div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            fontFamily: 'var(--font-secondary)',
            marginBottom: '8px',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>{getGreeting()}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Welcome to <span style={{ color: 'var(--vibe-accent)', fontWeight: '600' }}>Online-Melodies</span>. Access premium player tools and stream any movie song for free.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setCurrentTab('search')}
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: '14px' }}
          >
            <Compass size={18} />
            Browse Songs
          </button>
          <button 
            onClick={createQuickPlaylist}
            className="glass-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 20px', 
              fontSize: '14px', 
              cursor: 'pointer',
              borderRadius: '999px',
              fontFamily: 'var(--font-primary)',
              color: '#fff',
              backgroundColor: 'transparent',
              borderColor: 'rgba(255,255,255,0.1)'
            }}
          >
            <Plus size={18} />
            New Playlist
          </button>
        </div>
      </header>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>Recently Played</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {recentlyPlayed.slice(0, 6).map((song, i) => (
              <div
                key={`${song.id}-${i}`}
                className="song-card-horizontal"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => playSong(song)}
              >
                <img 
                  src={song.thumbnail} 
                  alt={song.title} 
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = musicFallbackSVG; }}
                  style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.channelName}</span>
                </div>
                <div style={{
                  padding: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--vibe-accent)',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.9
                }}>
                  <Play size={16} fill="#000" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Language Tracks */}
      {Object.keys(featuredLanguageTracks).map(langKey => {
        const row = featuredLanguageTracks[langKey];
        return (
          <section key={langKey} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>{row.title}</h2>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {row.songs.map(song => {
                const isLiked = likedSongs.some(s => s.id === song.id);
                return (
                  <div
                    key={song.id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => handleQuickPlay(song, row.songs)}
                  >
                    {/* Thumbnail Image Wrapper */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '12px' }}>
                      <img 
                        src={song.thumbnail} 
                        alt={song.title}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = musicFallbackSVG; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {/* Favorite button overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeSong(song);
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(5px)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isLiked ? 'var(--vibe-accent)' : '#fff',
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                        title={isLiked ? 'Unlike' : 'Like'}
                      >
                        <Heart size={14} fill={isLiked ? 'var(--vibe-accent)' : 'none'} />
                      </button>

                      {/* Options button overlay */}
                      <div className="song-dropdown-container" style={{ position: 'absolute', top: '8px', right: '44px', zIndex: 10 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveSongMenuId(activeSongMenuId === song.id ? null : song.id)}
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(5px)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                          title="Options"
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {activeSongMenuId === song.id && (
                          <div style={{
                            position: 'absolute',
                            top: '36px',
                            right: '0',
                            borderRadius: '12px',
                            padding: '6px',
                            minWidth: '180px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            backgroundColor: '#12131a',
                            border: '1px solid rgba(255,255,255,0.15)'
                          }}>
                            {/* 1. Toggle Like */}
                            <button
                              onClick={() => {
                                toggleLikeSong(song);
                                setActiveSongMenuId(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                color: isLiked ? 'var(--vibe-accent)' : 'var(--text-secondary)',
                                fontFamily: 'var(--font-primary)',
                                fontSize: '13px',
                                textAlign: 'left'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Heart size={14} fill={isLiked ? 'var(--vibe-accent)' : 'none'} />
                              <span>{isLiked ? 'Unlike Song' : 'Like Song'}</span>
                            </button>

                            {/* Divider */}
                            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

                            {/* 2. Add to Playlist */}
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Add to Playlist</span>
                            {playlists.length === 0 ? (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 8px', fontStyle: 'italic' }}>No custom playlists</span>
                            ) : (
                              playlists.map(p => {
                                const songAlreadyAdded = p.songs.some(s => s.id === song.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => handleAddToPlaylist(p.id, song)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      width: '100%',
                                      background: 'transparent',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '8px',
                                      cursor: 'pointer',
                                      color: 'var(--text-secondary)',
                                      fontFamily: 'var(--font-primary)',
                                      fontSize: '13px',
                                      textAlign: 'left'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{p.name}</span>
                                    {songAlreadyAdded && <Check size={12} color="var(--vibe-accent)" />}
                                  </button>
                                );
                              })
                            )}

                            {/* Divider */}
                            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

                            {/* 3. Like & Add to Playlist */}
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Like & Add to Playlist</span>
                            {playlists.length === 0 ? (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 8px', fontStyle: 'italic' }}>No custom playlists</span>
                            ) : (
                              playlists.map(p => {
                                const songAlreadyAdded = p.songs.some(s => s.id === song.id);
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => handleLikeAndAddToPlaylist(p.id, song)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      width: '100%',
                                      background: 'transparent',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '8px',
                                      cursor: 'pointer',
                                      color: 'var(--text-secondary)',
                                      fontFamily: 'var(--font-primary)',
                                      fontSize: '13px',
                                      textAlign: 'left'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{p.name}</span>
                                    {songAlreadyAdded && <Check size={12} color="var(--vibe-accent)" />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h4 style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#fff',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>{song.title}</h4>
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>{song.channelName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

    </div>
  );
}

export default Home;
