import React, { useState, useEffect } from 'react';
import { Play, Trash2, Heart, Music, Clock, MoreHorizontal, Check, Plus } from 'lucide-react';

const musicFallbackSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%231e293b'/><circle cx='50' cy='50' r='30' fill='%230f172a'/><circle cx='50' cy='50' r='10' fill='%2338bdf8'/><path d='M50 20 A30 30 0 0 1 80 50' stroke='%2338bdf8' stroke-width='2' fill='none' stroke-dasharray='4,4'/><circle cx='50' cy='50' r='4' fill='%230f172a'/></svg>";

function Playlists({
  playlist,
  playSong,
  likedSongs,
  toggleLikeSong,
  removeSongFromPlaylist,
  deletePlaylist,
  isLikedFolder,
  setCurrentTab,
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
  const hasSongs = playlist?.songs && playlist.songs.length > 0;

  const handlePlayAll = () => {
    if (!hasSongs) return;
    // Play the first song and set the rest as the current queue
    playSong(playlist.songs[0], playlist.songs);
  };

  const handleDeletePlaylist = () => {
    if (window.confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) {
      deletePlaylist(playlist.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Playlist Header Banner */}
      <div className="playlist-header-banner" style={{
        padding: '40px 32px 24px 32px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '24px',
        background: 'linear-gradient(to bottom, var(--vibe-glow-1) 0%, rgba(7, 8, 14, 0) 100%)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        {/* Banner Cover art */}
        <div style={{
          width: '160px',
          height: '160px',
          borderRadius: '24px',
          background: isLikedFolder 
            ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' 
            : 'linear-gradient(135deg, var(--vibe-accent) 0%, #1e3a8a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          flexShrink: 0
        }}>
          {isLikedFolder ? (
            <Heart size={64} fill="#fff" color="#fff" />
          ) : (
            <Music size={64} color="#fff" />
          )}
        </div>

        {/* Metadata Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)' }}>
            Playlist
          </span>
          <h1 style={{
            fontSize: '44px',
            fontWeight: '800',
            fontFamily: 'var(--font-secondary)',
            margin: 0,
            lineHeight: '1.1',
            letterSpacing: '-1px',
            color: '#fff'
          }}>{playlist.name}</h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', margin: '4px 0 0 0' }}>
            {playlist.description || 'Custom playlist created on Online-Melodies.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Online-Melodies</span>
            <span>•</span>
            <span>{playlist.songs?.length || 0} tracks</span>
          </div>
        </div>
      </div>

      {/* Playlist Actions (Play and Delete) */}
      <div className="playlist-actions">
        <button
          onClick={handlePlayAll}
          disabled={!hasSongs}
          className="btn-primary"
          style={{
            padding: '14px 28px',
            fontSize: '15px',
            opacity: hasSongs ? 1 : 0.5,
            cursor: hasSongs ? 'pointer' : 'not-allowed'
          }}
        >
          <Play size={20} fill="#000" />
          Play All
        </button>

        {!isLikedFolder && (
          <button
            onClick={handleDeletePlaylist}
            className="btn-icon"
            style={{
              padding: '10px',
              borderRadius: '50%',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
            title="Delete Playlist"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Tracks Listing */}
      <div className="playlist-tracks-container">
        {hasSongs ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
            {/* Headers row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '8px'
            }}>
              <span className="hide-on-mobile" style={{ width: '30px' }}>#</span>
              <span style={{ flex: 1 }}>Title</span>
              <span className="hide-on-mobile" style={{ width: '60px', textAlign: 'right', marginRight: '52px' }}>
                <Clock size={14} style={{ display: 'inline', transform: 'translateY(2px)' }} />
              </span>
            </div>

            {/* Song rows */}
            {playlist.songs.map((song, index) => {
              const isLiked = likedSongs.some(s => s.id === song.id);
              return (
                <div
                  key={song.id}
                  className="song-list-item-row"
                  onClick={() => playSong(song, playlist.songs)}
                >
                  <span className="hide-on-mobile" style={{ width: '30px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>
                    {index + 1}
                  </span>

                  {/* Thumbnail and Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <img 
                      src={song.thumbnail} 
                      alt={song.title} 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = musicFallbackSVG; }}
                      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: '20px' }}>
                      <span style={{
                        fontSize: '14.5px',
                        fontWeight: '600',
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }} title={song.title}>
                        {song.title}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {song.channelName} <span className="show-on-mobile">• {song.duration}</span>
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <span className="hide-on-mobile" style={{ width: '60px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'right', marginRight: '16px' }}>
                    {song.duration}
                  </span>

                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    {/* Direct Delete/Unlike Button */}
                    <button
                      onClick={(e) => {
                        if (isLikedFolder) {
                          toggleLikeSong(song, e);
                        } else {
                          removeSongFromPlaylist(playlist.id, song.id);
                        }
                      }}
                      className="btn-icon"
                      style={{ padding: '6px', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title={isLikedFolder ? "Remove from Liked" : "Remove from Playlist"}
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="song-dropdown-container" style={{ position: 'relative' }}>
                      <button
                        onClick={() => setActiveSongMenuId(activeSongMenuId === song.id ? null : song.id)}
                        className="btn-icon"
                        style={{ padding: '6px' }}
                        title="Options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {activeSongMenuId === song.id && (
                        <div style={{
                          position: 'absolute',
                          top: '32px',
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
                            onClick={(e) => {
                              toggleLikeSong(song, e);
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

                          {/* 2. Add to Playlist */}
                          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Add to Playlist</span>
                          {playlists.filter(p => p.id !== playlist.id).length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 8px', fontStyle: 'italic' }}>No other playlists</span>
                          ) : (
                            playlists.filter(p => p.id !== playlist.id).map(p => {
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

                          {/* 3. Like & Add to Playlist */}
                          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Like & Add to Playlist</span>
                          {playlists.filter(p => p.id !== playlist.id).length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 8px', fontStyle: 'italic' }}>No other playlists</span>
                          ) : (
                            playlists.filter(p => p.id !== playlist.id).map(p => {
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

                          {/* 4. Remove from this playlist / Liked Songs */}
                          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                          <button
                            onClick={(e) => {
                              if (isLikedFolder) {
                                toggleLikeSong(song, e);
                              } else {
                                removeSongFromPlaylist(playlist.id, song.id);
                              }
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
                              color: '#ef4444',
                              fontFamily: 'var(--font-primary)',
                              fontSize: '13px',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={14} />
                            <span>{isLikedFolder ? 'Remove from Liked' : 'Remove Song'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '80px 0',
            color: 'var(--text-muted)'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Music size={32} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>This playlist is empty</h4>
              <p style={{ fontSize: '13.5px', maxWidth: '300px', margin: '0 auto' }}>
                Go to the <span style={{ color: 'var(--vibe-accent)', fontWeight: '600', cursor: 'pointer' }} onClick={() => setCurrentTab('search')}>Search tab</span> to find tracks and add them here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Playlists;
