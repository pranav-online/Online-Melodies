import React from 'react';
import { Play, Trash2, ArrowUp, ArrowDown, ListX, Music } from 'lucide-react';

const musicFallbackSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%231e293b'/><circle cx='50' cy='50' r='30' fill='%230f172a'/><circle cx='50' cy='50' r='10' fill='%2338bdf8'/><path d='M50 20 A30 30 0 0 1 80 50' stroke='%2338bdf8' stroke-width='2' fill='none' stroke-dasharray='4,4'/><circle cx='50' cy='50' r='4' fill='%230f172a'/></svg>";

function Queue({
  queue,
  queueIndex,
  setQueue,
  setQueueIndex,
  playSong,
  currentSong
}) {
  const currentTrack = currentSong || (queueIndex !== -1 ? queue[queueIndex] : null);
  const hasQueue = queue.length > 0;

  // Move a song up in the queue sequence
  const moveUp = (index, e) => {
    e.stopPropagation();
    if (index <= 0) return;
    const newQueue = [...queue];
    // Swap items
    const temp = newQueue[index];
    newQueue[index] = newQueue[index - 1];
    newQueue[index - 1] = temp;
    
    // Adjust queueIndex if needed
    if (queueIndex === index) setQueueIndex(index - 1);
    else if (queueIndex === index - 1) setQueueIndex(index);
    
    setQueue(newQueue);
  };

  // Move a song down in the queue sequence
  const moveDown = (index, e) => {
    e.stopPropagation();
    if (index >= queue.length - 1) return;
    const newQueue = [...queue];
    // Swap items
    const temp = newQueue[index];
    newQueue[index] = newQueue[index + 1];
    newQueue[index + 1] = temp;
    
    // Adjust queueIndex if needed
    if (queueIndex === index) setQueueIndex(index + 1);
    else if (queueIndex === index + 1) setQueueIndex(index);

    setQueue(newQueue);
  };

  // Remove song from queue
  const removeFromQueue = (index, e) => {
    e.stopPropagation();
    const newQueue = queue.filter((_, i) => i !== index);
    
    // Adjust queue index
    if (queueIndex === index) {
      // playing song was removed
      setQueue(newQueue);
      if (newQueue.length > 0) {
        const nextIdx = index >= newQueue.length ? newQueue.length - 1 : index;
        setQueueIndex(nextIdx);
        playSong(newQueue[nextIdx], newQueue);
      } else {
        setQueueIndex(-1);
        // let it play out or stop, we don't have to crash
      }
    } else {
      if (queueIndex > index) {
        setQueueIndex(queueIndex - 1);
      }
      setQueue(newQueue);
    }
  };

  // Clear all items except currently playing
  const handleClearQueue = () => {
    if (!currentTrack) {
      setQueue([]);
      setQueueIndex(-1);
      return;
    }
    setQueue([currentTrack]);
    setQueueIndex(0);
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      
      {/* Header and Clear action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)', marginBottom: '4px' }}>Play Queue</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage the list of upcoming tracks.</p>
        </div>
        {hasQueue && (
          <button
            onClick={handleClearQueue}
            className="glass-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent',
              borderRadius: '999px',
              borderColor: 'rgba(255,255,255,0.08)'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <ListX size={16} />
            Clear Queue
          </button>
        )}
      </div>

      {/* Now Playing section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-secondary)' }}>Now Playing</h3>
        {currentTrack ? (
          <div className="glass-panel" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            borderRadius: '20px',
            border: '1px solid var(--vibe-accent)'
          }}>
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = musicFallbackSVG; }}
              style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.title}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--vibe-accent)', fontWeight: '600', marginTop: '2px' }}>
                {currentTrack.channelName}
              </span>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', paddingRight: '8px' }}>
              {currentTrack.duration}
            </span>
          </div>
        ) : (
          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '14px' }}>No track is currently playing.</span>
        )}
      </section>

      {/* Up Next section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-secondary)' }}>Up Next</h3>
        
        {hasQueue && queue.length > 1 ? (
          <div className="glass-panel" style={{ borderRadius: '20px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {queue.map((song, idx) => {
              // skip currently playing song in the "Up Next" display list if it matches queueIndex
              const isCurrent = idx === queueIndex;
              if (isCurrent) return null;

              return (
                <div
                  key={`${song.id}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => playSong(song, queue)}
                >
                  {/* index label */}
                  <span style={{ width: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {idx + 1}
                  </span>

                  {/* Thumbnail and Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = musicFallbackSVG; }}
                      style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: '20px' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {song.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {song.channelName}
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <span style={{ width: '50px', color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'right', marginRight: '16px' }}>
                    {song.duration}
                  </span>

                  {/* Move Up/Down/Delete actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => moveUp(idx, e)}
                      disabled={idx === 0 || (queueIndex === 0 && idx === 1)}
                      className="btn-icon"
                      style={{ padding: '4px', opacity: (idx === 0 || (queueIndex === 0 && idx === 1)) ? 0.3 : 1 }}
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    
                    <button
                      onClick={(e) => moveDown(idx, e)}
                      disabled={idx === queue.length - 1 || (queueIndex === queue.length - 1 && idx === queue.length - 2)}
                      className="btn-icon"
                      style={{ padding: '4px', opacity: (idx === queue.length - 1 || (queueIndex === queue.length - 1 && idx === queue.length - 2)) ? 0.3 : 1 }}
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </button>

                    <button
                      onClick={(e) => removeFromQueue(idx, e)}
                      className="btn-icon"
                      style={{ padding: '4px' }}
                      title="Remove from Queue"
                    >
                      <Trash2 size={14} />
                    </button>
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
            gap: '12px',
            padding: '40px 0',
            color: 'var(--text-muted)'
          }}>
            <Music size={24} />
            <span style={{ fontSize: '13.5px' }}>Queue is empty. Find a song to play!</span>
          </div>
        )}
      </section>

    </div>
  );
}

export default Queue;
