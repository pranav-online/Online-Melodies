import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, BarChart, Activity, CircleDot, RefreshCw } from 'lucide-react';

function Visualizer({ isPlaying, currentTime, currentVibe, currentSong, eqGains }) {
  const canvasRef = useRef(null);
  const [vizMode, setVizMode] = useState('waves'); // 'waves' | 'circle' | 'bars'
  const animationRef = useRef(null);
  
  // Audio state parameters for procedural animation
  const paramsRef = useRef({
    phase: 0,
    amplitude: 0,
    targetAmplitude: 0,
    noiseOffset: 0
  });

  const cycleMode = () => {
    if (vizMode === 'waves') setVizMode('circle');
    else if (vizMode === 'circle') setVizMode('bars');
    else setVizMode('waves');
  };

  // Helper to hash the song ID to generate a unique seed
  const getSongSeed = (songId) => {
    if (!songId) return 0;
    let hash = 0;
    for (let i = 0; i < songId.length; i++) {
      hash = songId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // Color mapping based on current visual vibe
  const getVibeColors = (vibe) => {
    switch (vibe) {
      case 'neon':
        return { primary: '#f43f5e', secondary: '#a855f7', glow: 'rgba(244, 63, 94, 0.4)', speed: 0.12 };
      case 'chill':
        return { primary: '#8b5cf6', secondary: '#3b82f6', glow: 'rgba(139, 92, 246, 0.3)', speed: 0.03 };
      case 'ocean':
        return { primary: '#06b6d4', secondary: '#10b981', glow: 'rgba(6, 182, 212, 0.35)', speed: 0.06 };
      case 'gold':
        return { primary: '#d97706', secondary: '#ef4444', glow: 'rgba(217, 119, 6, 0.3)', speed: 0.05 };
      case 'crimson':
        return { primary: '#ef4444', secondary: '#991b1b', glow: 'rgba(239, 68, 68, 0.45)', speed: 0.1 };
      default: // classic
        return { primary: '#1db954', secondary: '#10b981', glow: 'rgba(29, 185, 84, 0.3)', speed: 0.07 };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || 400);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 400;
    };
    window.addEventListener('resize', handleResize);

    // Derive song-specific visual parameters using hash seeding
    const seed = getSongSeed(currentSong?.id);
    const songBass = (seed % 10) / 10 * 0.8 + 0.6;      // 0.6x to 1.4x
    const songMid = ((seed >> 4) % 10) / 10 * 0.8 + 0.6; // 0.6x to 1.4x
    const songTreble = ((seed >> 8) % 10) / 10 * 0.8 + 0.6; // 0.6x to 1.4x
    const songTempo = ((seed >> 12) % 10) / 10 * 0.5 + 0.75; // 0.75x to 1.25x

    // Read EQ gains (normalized from dB scale -12..12 to multipliers 0..2)
    const bassGain = eqGains ? (1 + eqGains.bass / 12) : 1;
    const midGain = eqGains ? (1 + (eqGains.mid + eqGains.vocal) / 24) : 1;
    const trebleGain = eqGains ? (1 + eqGains.treble / 12) : 1;

    // Frame loops
    const draw = () => {
      const p = paramsRef.current;
      
      // Update target amplitude based on playing state
      p.targetAmplitude = isPlaying ? 1.0 : 0.0;
      // Interpolate amplitude smoothly for realistic inertia
      p.amplitude += (p.targetAmplitude - p.amplitude) * 0.08;
      
      // Clear canvas with subtle transparency for trails
      ctx.fillStyle = 'rgba(7, 8, 14, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // Setup gradient colors
      const themeColors = getVibeColors(currentVibe);
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, themeColors.primary);
      gradient.addColorStop(0.5, themeColors.secondary);
      gradient.addColorStop(1, themeColors.primary);

      ctx.shadowBlur = isPlaying ? 25 : 5;
      ctx.shadowColor = themeColors.primary;

      // Real-time audio beat simulation variables
      const timeMs = Date.now();
      const bassBeat = isPlaying 
        ? (0.82 + Math.sin(timeMs / 120) * 0.18 + Math.cos(timeMs / 290) * 0.1 + (Math.random() * 0.05)) 
        : 0;
      const midBeat = isPlaying 
        ? (0.86 + Math.cos(timeMs / 200) * 0.14 + Math.sin(timeMs / 380) * 0.06) 
        : 0;
      const trebleBeat = isPlaying 
        ? (0.88 + Math.sin(timeMs / 60) * 0.12 + (Math.random() * 0.12)) 
        : 0;

      if (vizMode === 'waves') {
        // Draw 3 layers of flowing sinewaves
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
          ctx.beginPath();
          ctx.lineWidth = 3 - i * 0.7;
          ctx.strokeStyle = i === 0 ? gradient : `rgba(${hexToRgb(themeColors.secondary)}, ${0.6 - i * 0.15})`;
          
          const speedFactor = themeColors.speed * (1 - i * 0.2) * songTempo;
          p.phase += speedFactor * p.amplitude * 0.08; // increment phase

          for (let x = 0; x < width; x++) {
            // Complex wave superposition
            const angle = (x / width) * Math.PI * (2 + i);
            
            // Adjust wave amplitude based on song profile, EQ gains, and dynamic beats
            let waveAmp = 50 * p.amplitude;
            if (i === 0) waveAmp *= songBass * bassGain * bassBeat;      // Layer 1: Bass
            else if (i === 1) waveAmp *= songMid * midGain * midBeat;    // Layer 2: Mid
            else waveAmp *= songTreble * trebleGain * trebleBeat;        // Layer 3: Treble

            const offset = Math.sin(angle + p.phase + i * 1.5) * waveAmp * Math.sin(x / width * Math.PI);
            const y = height / 2 + offset + Math.cos(angle * 0.5 - p.phase) * 15 * p.amplitude;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (vizMode === 'circle') {
        // Radial Oscilloscope
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.25;
        
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = gradient;

        const points = 120;
        p.phase += themeColors.speed * p.amplitude * 0.15 * songTempo;

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Separate low, mid, and high frequency components reacting to EQ and beats
          const bassSample = Math.sin(angle * 8 + p.phase) * 15 * songBass * bassGain * bassBeat;
          const midSample = Math.sin(angle * 4 - p.phase * 0.5) * 8 * songMid * midGain * midBeat;
          const trebleSample = Math.cos(angle * 16 + p.phase * 1.5) * 6 * songTreble * trebleGain * trebleBeat;
          
          const waveSample = (bassSample + midSample + trebleSample) * p.amplitude;
          const r = baseRadius + waveSample + (isPlaying ? Math.random() * 2 : 0);
          
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw inner pulsing glowing core
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.85 + Math.sin(p.phase) * 5 * p.amplitude * bassGain * bassBeat, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(themeColors.primary)}, ${0.08 * p.amplitude})`;
        ctx.fill();
      } else if (vizMode === 'bars') {
        // Jumping Frequency Bars
        const barWidth = 8;
        const gap = 4;
        const barCount = Math.floor(width / (barWidth + gap));
        const startX = (width - (barCount * (barWidth + gap))) / 2;

        p.phase += themeColors.speed * songTempo;

        ctx.fillStyle = gradient;

        for (let i = 0; i < barCount; i++) {
          // Calculate height with sinewave + noise for organic look
          const sinFactor = Math.sin((i / barCount) * Math.PI * 2 + p.phase * 2) * 0.5 + 0.5;
          const noiseFactor = Math.cos((i / barCount) * Math.PI * 5 - p.phase) * 0.3 + 0.7;
          
          // Determine which EQ band this bar belongs to (Bass, Mid, or Treble) and apply beats
          const pct = i / barCount;
          let bandGain = 1.0;
          let songFreqBias = 1.0;
          let bandBeat = 1.0;
          
          if (pct < 0.25) { // Bass region (Left 25%)
            bandGain = bassGain;
            songFreqBias = songBass;
            bandBeat = bassBeat;
          } else if (pct < 0.75) { // Mid-Range region (Middle 50%)
            bandGain = midGain;
            songFreqBias = songMid;
            bandBeat = midBeat;
          } else { // Treble region (Right 25%)
            bandGain = trebleGain;
            songFreqBias = songTreble;
            bandBeat = trebleBeat;
          }
          
          const heightMultiplier = 160 * p.amplitude * songFreqBias * bandGain * bandBeat;
          const barHeight = Math.max(4, sinFactor * noiseFactor * heightMultiplier + (isPlaying ? Math.random() * 5 : 0));
          
          const x = startX + i * (barWidth + gap);
          const y = height / 2 - barHeight / 2;

          // Round rect
          drawRoundRect(ctx, x, y, barWidth, barHeight, 4);
        }
      }

      // Restore shadows
      ctx.shadowBlur = 0;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, vizMode, currentVibe, currentSong, eqGains]);

  // Canvas utility for rounded columns
  function drawRoundRect(ctx, x, y, width, height, radius) {
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
  }

  // Hex color to RGB string converter
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '29, 185, 84';
  }

  const getModeIcon = () => {
    switch (vizMode) {
      case 'circle': return <CircleDot size={18} />;
      case 'bars': return <BarChart size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const getModeLabel = () => {
    switch (vizMode) {
      case 'circle': return 'Radial Core';
      case 'bars': return 'Spectrum Peaks';
      default: return 'Flowing Waves';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      padding: '32px',
      position: 'relative'
    }}>
      {/* Header Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        zIndex: 5
      }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)', marginBottom: '4px' }}>Acoustic Visualizer</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Current Theme: <span style={{ color: 'var(--vibe-accent)', fontWeight: '600', textTransform: 'capitalize' }}>{currentVibe}</span>
          </p>
        </div>
        
        <button
          onClick={cycleMode}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#fff',
            borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.08)'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--vibe-accent)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        >
          {getModeIcon()}
          <span>Mode: {getModeLabel()}</span>
        </button>
      </div>

      {/* Main Canvas view */}
      <div style={{
        flex: 1,
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        background: 'rgba(7, 8, 14, 0.4)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        
        {/* Floating audio control overlay */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '999px',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isPlaying ? 'var(--vibe-accent)' : '#ef4444',
            boxShadow: isPlaying ? '0 0 10px var(--vibe-accent)' : 'none'
          }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            {isPlaying ? 'Visualizer Sync Active' : 'Playback Paused'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Visualizer;
