import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, 
  Volume2, VolumeX, Heart, Mic2, BarChart2, Sliders, 
  ListMusic, Tv, Sparkles, Plus, Check
} from 'lucide-react';
import { formatTime } from '../App';

const musicFallbackSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%231e293b'/><circle cx='50' cy='50' r='30' fill='%230f172a'/><circle cx='50' cy='50' r='10' fill='%2338bdf8'/><path d='M50 20 A30 30 0 0 1 80 50' stroke='%2338bdf8' stroke-width='2' fill='none' stroke-dasharray='4,4'/><circle cx='50' cy='50' r='4' fill='%230f172a'/></svg>";

function Player({
  currentSong,
  isPlaying,
  togglePlay,
  currentTime,
  duration,
  seekTo,
  volume,
  changeVolume,
  isMuted,
  toggleMute,
  shuffle,
  setShuffle,
  repeatMode,
  setRepeatMode,
  playNext,
  playPrevious,
  showMiniPlayer,
  setShowMiniPlayer,
  currentVibe,
  setCurrentVibe,
  likedSongs,
  toggleLikeSong,
  currentTab,
  setCurrentTab,
  playlists = [],
  addSongToPlaylist
}) {
  const [showVibeMenu, setShowVibeMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const isLiked = currentSong && likedSongs.some(s => s.id === currentSong.id);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showPlaylistMenu && !e.target.closest('.playlist-dropdown-container')) {
        setShowPlaylistMenu(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showPlaylistMenu]);

  const handleSeek = (e) => {
    seekTo(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e) => {
    changeVolume(parseInt(e.target.value));
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  const vibes = [
    { id: 'classic', label: 'Classic Green', color: '#1db954' },
    { id: 'neon', label: 'Neon Dance', color: '#f43f5e' },
    { id: 'chill', label: 'Chill Lofi', color: '#8b5cf6' },
    { id: 'gold', label: 'Bollywood Gold', color: '#d97706' },
    { id: 'ocean', label: 'Ocean Melody', color: '#06b6d4' },
    { id: 'crimson', label: 'Cinematic Epic', color: '#ef4444' }
  ];

  return (
    <footer className="glass-panel app-player-footer">
      {/* Left: Song Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {currentSong ? (
          <>
            <div style={{ position: 'relative', width: '56px', height: '56px' }}>
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = musicFallbackSVG; }}
                className={`spinning-vinyl ${isPlaying ? '' : 'paused'}`}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)'
                }}
              />
              {/* Vinyl center hole mimic */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '12px',
                height: '12px',
                backgroundColor: '#07080e',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '180px' }}>
              <span style={{
                fontSize: '14.5px',
                fontWeight: '600',
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} title={currentSong.title}>
                {currentSong.title}
              </span>
              <span style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentSong.channelName}
              </span>
            </div>
            <button
              onClick={() => toggleLikeSong(currentSong)}
              className="btn-icon"
              style={{ padding: '6px', color: isLiked ? 'var(--vibe-accent)' : 'var(--text-secondary)' }}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={18} fill={isLiked ? 'var(--vibe-accent)' : 'none'} />
            </button>
            
            <div className="playlist-dropdown-container" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="btn-icon"
                style={{ padding: '6px', color: 'var(--text-secondary)' }}
                title="Add to Playlist"
              >
                <Plus size={18} />
              </button>
              
              {showPlaylistMenu && (
                <div style={{
                  position: 'absolute',
                  bottom: '48px',
                  left: '0',
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
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Add to Playlist</span>
                  {playlists.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 8px', fontStyle: 'italic' }}>No custom playlists</span>
                  ) : (
                    playlists.map(p => {
                      const songAlreadyAdded = p.songs.some(s => s.id === currentSong.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            addSongToPlaylist(p.id, currentSong);
                            setShowPlaylistMenu(false);
                          }}
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
          </>
        ) : (
          <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No song selected</span>
        )}
      </div>

      {/* Middle: Controls & Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
        {/* Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`btn-icon ${shuffle ? 'active' : ''}`}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button
            onClick={playPrevious}
            className="btn-icon"
            title="Previous"
            disabled={!currentSong}
            style={{ opacity: currentSong ? 1 : 0.5 }}
          >
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            disabled={!currentSong}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              color: '#000',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: currentSong ? 'pointer' : 'default',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
              opacity: currentSong ? 1 : 0.5,
              transform: 'scale(1)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => currentSong && (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => currentSong && (e.currentTarget.style.transform = 'scale(1)')}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} fill="#000" /> : <Play size={20} fill="#000" style={{ transform: 'translateX(1px)' }} />}
          </button>
          <button
            onClick={playNext}
            className="btn-icon"
            title="Next"
            disabled={!currentSong}
            style={{ opacity: currentSong ? 1 : 0.5 }}
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button
            onClick={cycleRepeatMode}
            className={`btn-icon ${repeatMode !== 'none' ? 'active' : ''}`}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat size={16} />
            {repeatMode === 'one' && (
              <span style={{
                position: 'absolute',
                fontSize: '8px',
                fontWeight: '800',
                backgroundColor: 'var(--vibe-accent)',
                color: '#000',
                borderRadius: '50%',
                width: '10px',
                height: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                top: '4px',
                right: '4px'
              }}>1</span>
            )}
          </button>
        </div>

        {/* Seekbar Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!currentSong}
            style={{ 
              flex: 1,
              background: `linear-gradient(to right, var(--vibe-accent) 0%, var(--vibe-accent) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.15) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.15) 100%)`
            }}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Sub-controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
        {/* Dynamic Vibe Override Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowVibeMenu(!showVibeMenu)}
            className={`btn-icon ${showVibeMenu ? 'active' : ''}`}
            title="Change Visual Theme"
          >
            <Sparkles size={16} />
          </button>
          {showVibeMenu && (
            <div className="glass-panel" style={{
              position: 'absolute',
              bottom: '50px',
              right: '0',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '150px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Select Vibe</span>
              {vibes.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    setCurrentVibe(v.id);
                    setShowVibeMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    background: currentVibe === v.id ? 'var(--bg-surface-hover)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: currentVibe === v.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '13.5px',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: v.color }} />
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sync screen toggles */}
        <button
          onClick={() => setCurrentTab(currentTab === 'lyrics' ? 'home' : 'lyrics')}
          className={`btn-icon ${currentTab === 'lyrics' ? 'active' : ''}`}
          title="Lyrics"
        >
          <Mic2 size={16} />
        </button>

        <button
          onClick={() => setCurrentTab(currentTab === 'visualizer' ? 'home' : 'visualizer')}
          className={`btn-icon ${currentTab === 'visualizer' ? 'active' : ''}`}
          title="Wave Visualizer"
        >
          <BarChart2 size={16} />
        </button>

        <button
          onClick={() => setCurrentTab(currentTab === 'equalizer' ? 'home' : 'equalizer')}
          className={`btn-icon ${currentTab === 'equalizer' ? 'active' : ''}`}
          title="Audio Equalizer"
        >
          <Sliders size={16} />
        </button>

        <button
          onClick={() => setCurrentTab(currentTab === 'queue' ? 'home' : 'queue')}
          className={`btn-icon ${currentTab === 'queue' ? 'active' : ''}`}
          title="Play Queue"
        >
          <ListMusic size={16} />
        </button>

        <button
          onClick={() => setShowMiniPlayer(!showMiniPlayer)}
          className={`btn-icon ${showMiniPlayer ? 'active' : ''}`}
          title="Toggle Video Screen"
        >
          <Tv size={16} />
        </button>

        {/* Volume HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
          <button onClick={toggleMute} className="btn-icon" style={{ padding: '6px' }} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{ 
              width: '70px',
              background: `linear-gradient(to right, var(--vibe-accent) 0%, var(--vibe-accent) ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.15) ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.15) 100%)`
            }}
            title={`Volume: ${volume}%`}
          />
        </div>
      </div>
    </footer>
  );
}

export default Player;
