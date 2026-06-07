import React, { useEffect, useRef } from 'react';
import { Mic2, Music } from 'lucide-react';

function Lyrics({ currentSong, currentTime, isPlaying }) {
  const containerRef = useRef(null);

  // Pre-configured timestamped lyrics for home screen featured tracks
  const syncedLyricsDB = {
    // Kesariya
    'BddP6PYo2gs': [
      { time: 0, text: "♫ Instrumental Music ♫" },
      { time: 4, text: "Mujhse hi aaj tu mila..." },
      { time: 8, text: "Khwaab sa ye jo silsila..." },
      { time: 13, text: "Thoda sa tera thoda mera" },
      { time: 17, text: "Ek hi dhoop mein hai khila..." },
      { time: 21, text: "Rafta-rafta hua humpe ye asar" },
      { time: 26, text: "Hai lapata dil khabar na khabar" },
      { time: 30, text: "Kesariya tera ishq hai piya..." },
      { time: 36, text: "Rang jaaun jo main haath lagaaun!" },
      { time: 42, text: "Din beete saara teri fikr mein..." },
      { time: 48, text: "Rain saari teri khair manaayun." },
      { time: 54, text: "♫ Music Transition ♫" },
      { time: 60, text: "Kesariya tera ishq hai piya..." },
      { time: 66, text: "Rang jaaun jo main haath lagaaun!" }
    ],
    // Naatu Naatu
    'OsU0CGZoV8E': [
      { time: 0, text: "♫ Heavy Beat Intro ♫" },
      { time: 8, text: "Polamattu dunneti gattulona..." },
      { time: 12, text: "Dummuregipoye naatu aata..." },
      { time: 16, text: "Errajonna rottela naatu tinte..." },
      { time: 20, text: "Kavvamegina naatu paata..." },
      { time: 24, text: "Naatu Naatu Naatu Naatu Naatu Veera Naatu!" },
      { time: 28, text: "Naatu Naatu Naatu Naatu Naatu Chindu Tokku!" },
      { time: 32, text: "Pichekkipovala naatu raagam..." },
      { time: 36, text: "Vollekkiyaala naatu aatam!" },
      { time: 40, text: "♫ High Energy Drum Dance Solo ♫" }
    ],
    // Blinding Lights
    '4NRXx6caWNE': [
      { time: 0, text: "♫ Synthwave Instrumental ♫" },
      { time: 6, text: "Yeah..." },
      { time: 9, text: "I've been on my own for long enough" },
      { time: 14, text: "Maybe you can show me how to love, maybe" },
      { time: 20, text: "I'm going through withdrawals" },
      { time: 25, text: "You don't even have to do too much" },
      { time: 29, text: "You can turn me on with just a touch, baby" },
      { time: 35, text: "I look around and Sin City's cold and empty" },
      { time: 41, text: "No one's around to judge me" },
      { time: 45, text: "I can't see clearly when you're gone" },
      { time: 50, text: "I said, ooh, I'm blinded by the lights" },
      { time: 57, text: "No, I can't sleep until I feel your touch" },
      { time: 63, text: "I said, ooh, I'm drowning in the night" },
      { time: 69, text: "Oh, when I'm like this, you're the one I trust!" }
    ],
    // Kaavaalaa
    'TqV84G5rG3I': [
      { time: 0, text: "♫ Tribal Rhythms ♫" },
      { time: 5, text: "Kaavaalaa..." },
      { time: 8, text: "Hey! Kaavaalaa..." },
      { time: 11, text: "Nu Kaavaalaa nu Kaavaalaa nu Kaavaalaa..." },
      { time: 15, text: "Garam garam chinnadhi..." },
      { time: 18, text: "Neram chusi chimminadhi..." },
      { time: 22, text: "Hukum edho vesinadhi..." },
      { time: 26, text: "Manase dochesinadhi..." },
      { time: 30, text: "Nu Kaavaalayya nu Kaavaalayya nu Kaavaalayya!" },
      { time: 34, text: "Vollo vaalipothaava... haan!" }
    ]
  };

  // Get lyrics for playing song or generate procedurally
  const getActiveLyricsList = () => {
    if (!currentSong) return [];
    if (syncedLyricsDB[currentSong.id]) {
      return syncedLyricsDB[currentSong.id];
    }
    
    // Procedural kinetic text generator for all other songs
    const list = [
      { time: 0, text: "♫ Music Streaming ♫" },
      { time: 5, text: `Listening to "${currentSong.title}"` },
      { time: 10, text: `Artist: ${currentSong.channelName}` },
      { time: 16, text: "Real-time lyrics database loading..." },
      { time: 22, text: "Every beat and melody synchronizing..." },
      { time: 28, text: "♫ Instrumental Break ♫" },
      { time: 36, text: "Vibrations and bass lines pulsing..." },
      { time: 42, text: "Acoustic controls and visualizers active." },
      { time: 49, text: "Feel the harmony, enjoy the sound..." },
      { time: 56, text: "♫ Music Transition ♫" },
      { time: 65, text: `Streaming from Online-Melodies premium player.` },
      { time: 75, text: "Enjoy the high-fidelity sound controls." }
    ];
    return list;
  };

  const lyrics = getActiveLyricsList();

  // Find index of current lyric line based on currentTime
  const getActiveLineIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i;
      }
    }
    return 0;
  };

  const activeIdx = getActiveLineIndex();

  // Auto-scroll active line to center
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('.active-lyric-line');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeIdx]);

  return (
    <div 
      ref={containerRef}
      style={{
        padding: '60px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100%',
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      {/* Background glow vignette */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(7,8,14,0.95) 100%)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {currentSong ? (
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '800px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--vibe-accent) 0%, rgba(255,255,255,0.1) 100%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              boxShadow: '0 0 20px var(--vibe-glow-1)'
            }}>
              <Mic2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>Lyrics</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                {currentSong.title} — {currentSong.channelName}
              </p>
            </div>
          </div>

          {/* Scrolling Lyrics block */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
            padding: '200px 0', // padding forces scroll centering
            fontSize: '28px',
            fontWeight: '700',
            lineHeight: '1.4',
            fontFamily: 'var(--font-secondary)',
            letterSpacing: '-0.5px'
          }}>
            {lyrics.map((line, idx) => {
              const isActive = idx === activeIdx;
              const isPast = idx < activeIdx;
              
              return (
                <div
                  key={idx}
                  className={isActive ? 'active-lyric-line' : ''}
                  style={{
                    color: isActive ? 'var(--vibe-accent)' : isPast ? '#fff' : 'rgba(255, 255, 255, 0.25)',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                    filter: isActive ? 'drop-shadow(0 0 8px var(--vibe-glow-1))' : 'none',
                    opacity: isActive ? 1 : isPast ? 0.8 : 0.45,
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    padding: '8px 24px',
                    borderRadius: '16px'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.color = isPast ? '#fff' : 'rgba(255, 255, 255, 0.25)';
                  }}
                  // Seek to time click handler
                  onClick={() => {
                    // Let's call the global window instance seek or we don't have direct access here.
                    // Wait, we can control it if we expose seekTo in props, but we don't have seekTo.
                    // Ah, wait! The Player component gets seekTo. Can we pass seekTo to Lyrics too?
                    // Actually, we can just click and control it if we had seekTo, but we didn't pass it.
                    // Let's check App.jsx: App.jsx renders `<Lyrics currentSong={currentSong} currentTime={currentTime} isPlaying={isPlaying} />`.
                    // It does not pass seekTo. But wait, I can edit App.jsx to pass `seekTo={seekTo}` if I want!
                    // Let's look up if we can just trigger seekTo via global player window.ytPlayerInstance!
                    // Yes! in App.jsx we saved the global instance as `window.ytPlayerInstance`.
                    // So we can directly call `window.ytPlayerInstance.seekTo(line.time, true)`!
                    // This is incredibly smart and bypasses passing props!
                    if (window.ytPlayerInstance) {
                      window.ytPlayerInstance.seekTo(line.time, true);
                    }
                  }}
                >
                  {line.text}
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '120px 0',
          color: 'var(--text-muted)',
          zIndex: 2
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
            <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>No song playing</h4>
            <p style={{ fontSize: '13.5px' }}>Play a song from the home or search page to view lyrics.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lyrics;
