import React from 'react';
import { Sliders, Sparkles, AudioLines, RefreshCw } from 'lucide-react';

function Equalizer({ eqPreset, setEqPreset, eqGains, setEqGains }) {
  
  // Pre-configured EQ profile configurations (gain in dB from -12 to +12)
  const presets = [
    { id: 'flat', label: 'Flat / Off', gains: { bass: 0, mid: 0, treble: 0, vocal: 0 } },
    { id: 'bass', label: 'Bass Boost', gains: { bass: 10, mid: -1, treble: -2, vocal: 1 } },
    { id: 'vocal', label: 'Vocal Focus', gains: { bass: -4, mid: 4, treble: 2, vocal: 10 } },
    { id: 'acoustic', label: 'Acoustic', gains: { bass: 4, mid: 2, treble: 5, vocal: 3 } },
    { id: 'party', label: 'Club / Party', gains: { bass: 8, mid: -2, treble: 8, vocal: 0 } },
    { id: 'lofi', label: 'Lofi Ambient', gains: { bass: 6, mid: 1, treble: -8, vocal: -3 } }
  ];

  const handleSliderChange = (band, val) => {
    setEqPreset('custom');
    setEqGains(prev => ({ ...prev, [band]: val }));
  };

  const handleApplyPreset = (preset) => {
    setEqPreset(preset.id);
    setEqGains(preset.gains);
  };

  const handleReset = () => {
    setEqPreset('flat');
    setEqGains({ bass: 0, mid: 0, treble: 0, vocal: 0 });
  };

  // Helper to calculate height coordinates for the graphic visual EQ curve
  const getCurvePath = () => {
    const scale = (val) => 120 - (val / 12) * 80; // maps -12..12 dB to height coordinates 40..200
    const bY = scale(eqGains.bass);
    const mY = scale(eqGains.mid);
    const vY = scale(eqGains.vocal);
    const tY = scale(eqGains.treble);
    
    return `M 40 ${bY} C 120 ${bY}, 180 ${mY}, 260 ${mY} C 340 ${mY}, 380 ${vY}, 440 ${vY} C 500 ${vY}, 560 ${tY}, 640 ${tY}`;
  };

  // Helper to compute percentage fill for vertical slider background gradients
  const getFillPercent = (val) => {
    // Maps -12..12 to 0..100%
    return ((val + 12) / 24) * 100;
  };

  return (
    <div style={{ 
      padding: '32px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '32px', 
      minHeight: '100%', 
      overflowY: 'auto' 
    }}>
      
      {/* Header Panel with Reset button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)', marginBottom: '4px' }}>Equalizer</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Calibrate frequency responses to enhance bass depth, vocal clarity, or acoustic balance.
          </p>
        </div>
        
        <button
          onClick={handleReset}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            borderRadius: '999px',
            borderColor: 'rgba(255,255,255,0.08)'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--vibe-accent)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        >
          <RefreshCw size={14} className="spinning-vinyl" style={{ animationDuration: '4s' }} />
          Reset to Flat
        </button>
      </div>

      {/* Preset selections */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Presets</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {presets.map(p => {
            const isActive = eqPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--vibe-accent)' : 'rgba(255,255,255,0.06)',
                  backgroundColor: isActive ? 'var(--vibe-accent)' : 'rgba(255,255,255,0.02)',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  fontSize: '13.5px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-primary)',
                  transition: 'all 0.2s'
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Curves visual graphic */}
      <section className="glass-panel" style={{
        borderRadius: '24px',
        padding: '24px',
        height: '240px',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(7, 8, 14, 0.4)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Grid lines background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          padding: '20px 0',
          opacity: 0.05,
          pointerEvents: 'none'
        }}>
          <div style={{ borderBottom: '1px solid #fff', width: '100%' }} />
          <div style={{ borderBottom: '1px dashed #fff', width: '100%' }} />
          <div style={{ borderBottom: '1px solid #fff', width: '100%' }} />
          <div style={{ borderBottom: '1px dashed #fff', width: '100%' }} />
          <div style={{ borderBottom: '1px solid #fff', width: '100%' }} />
        </div>

        {/* Dynamic SVG Spline */}
        <div style={{ flex: 1, position: 'relative' }}>
          <svg style={{ width: '100%', height: '100%', minHeight: '160px' }} viewBox="0 0 680 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="eqGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--vibe-accent)" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            {/* Draw curve path */}
            <path
              d={getCurvePath()}
              fill="none"
              stroke="url(#eqGlow)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 8px var(--vibe-accent))', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', zIndex: 2 }}>
          <span>60Hz (Bass)</span>
          <span>1kHz (Mid)</span>
          <span>3kHz (Vocal)</span>
          <span>6kHz (Treble)</span>
        </div>
      </section>

      {/* Sliders console */}
      <section className="glass-panel" style={{
        borderRadius: '24px',
        padding: '32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        border: '1px solid var(--border-light)',
        alignItems: 'center',
        justifyItems: 'center',
        minHeight: '260px',
        flexShrink: 0
      }}>
        {/* Bass band */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', height: '100%' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Bass</span>
          <div style={{ height: '150px', display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={-12}
              max={12}
              value={eqGains.bass}
              onChange={(e) => handleSliderChange('bass', parseInt(e.target.value))}
              style={{
                WebkitAppearance: 'slider-vertical',
                width: '8px',
                height: '140px',
                background: `linear-gradient(to top, var(--vibe-accent) 0%, var(--vibe-accent) ${getFillPercent(eqGains.bass)}%, rgba(255, 255, 255, 0.08) ${getFillPercent(eqGains.bass)}%, rgba(255, 255, 255, 0.08) 100%)`
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {eqGains.bass > 0 ? `+${eqGains.bass}` : eqGains.bass} dB
          </span>
        </div>

        {/* Mid band */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', height: '100%' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Mid-Range</span>
          <div style={{ height: '150px', display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={-12}
              max={12}
              value={eqGains.mid}
              onChange={(e) => handleSliderChange('mid', parseInt(e.target.value))}
              style={{
                WebkitAppearance: 'slider-vertical',
                width: '8px',
                height: '140px',
                background: `linear-gradient(to top, var(--vibe-accent) 0%, var(--vibe-accent) ${getFillPercent(eqGains.mid)}%, rgba(255, 255, 255, 0.08) ${getFillPercent(eqGains.mid)}%, rgba(255, 255, 255, 0.08) 100%)`
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {eqGains.mid > 0 ? `+${eqGains.mid}` : eqGains.mid} dB
          </span>
        </div>

        {/* Vocal band */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', height: '100%' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Vocal Focus</span>
          <div style={{ height: '150px', display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={-12}
              max={12}
              value={eqGains.vocal}
              onChange={(e) => handleSliderChange('vocal', parseInt(e.target.value))}
              style={{
                WebkitAppearance: 'slider-vertical',
                width: '8px',
                height: '140px',
                background: `linear-gradient(to top, var(--vibe-accent) 0%, var(--vibe-accent) ${getFillPercent(eqGains.vocal)}%, rgba(255, 255, 255, 0.08) ${getFillPercent(eqGains.vocal)}%, rgba(255, 255, 255, 0.08) 100%)`
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {eqGains.vocal > 0 ? `+${eqGains.vocal}` : eqGains.vocal} dB
          </span>
        </div>

        {/* Treble band */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', height: '100%' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Treble</span>
          <div style={{ height: '150px', display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={-12}
              max={12}
              value={eqGains.treble}
              onChange={(e) => handleSliderChange('treble', parseInt(e.target.value))}
              style={{
                WebkitAppearance: 'slider-vertical',
                width: '8px',
                height: '140px',
                background: `linear-gradient(to top, var(--vibe-accent) 0%, var(--vibe-accent) ${getFillPercent(eqGains.treble)}%, rgba(255, 255, 255, 0.08) ${getFillPercent(eqGains.treble)}%, rgba(255, 255, 255, 0.08) 100%)`
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {eqGains.treble > 0 ? `+${eqGains.treble}` : eqGains.treble} dB
          </span>
        </div>
      </section>

      {/* Floating dynamic info banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0
      }}>
        <AudioLines size={18} color="var(--vibe-accent)" />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          *Note: Equalizer adjustments manipulate visual frequency feedback and shape software gains to adjust acoustic outputs.
        </span>
      </div>

    </div>
  );
}

export default Equalizer;
