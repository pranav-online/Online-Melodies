import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

function SplashIntro({ onComplete }) {
  const canvasRef = useRef(null);
  const [isFading, setIsFading] = useState(false);
  const animationFrameId = useRef(null);

  // Split title into letters for staggered cinematic entrance
  const titleText = "ONLINE MELODIES";
  const titleChars = Array.from(titleText);

  // Stagger parameters
  const baseStagger = 0.08; // 80ms delay per letter

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle class for cinematic dust/space drift
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = (Math.random() - 0.5) * width;
        this.y = (Math.random() - 0.5) * height;
        this.z = Math.random() * width; // Depth
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 1.5 + 0.5;
        this.color = Math.random() > 0.5 ? '#1db954' : '#6366f1'; // Cyan-indigo theme
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.z -= this.speed;
        if (this.z <= 0) {
          this.reset();
        }
      }

      draw() {
        // Perspective projection
        const px = (this.x / this.z) * width * 0.8 + width / 2;
        const py = (this.y / this.z) * height * 0.8 + height / 2;

        if (px < 0 || px > width || py < 0 || py > height) {
          return;
        }

        const size = (1 - this.z / width) * this.size * 3;
        const opacity = (1 - this.z / width) * this.alpha;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity;
        ctx.fill(); // Removed expensive shadowBlur for performance
      }
    }

    class Shockwave {
      constructor() {
        this.radius = 0;
        this.maxRadius = Math.max(width, height) * 0.7;
        this.speed = 3.5;
        this.alpha = 0.6;
        this.color = 'rgba(29, 185, 84,'; // Lock to green wave only
      }

      update() {
        this.radius += this.speed;
        this.alpha = 1 - this.radius / this.maxRadius;
      }

      draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${this.color} ${this.alpha})`;
        ctx.lineWidth = 2.0; // Slightly thicker stroke to compensate for shadow removal
        ctx.stroke();
        ctx.restore();
      }
    }

    const isMobile = window.innerWidth <= 768;

    // Populate particles (reduced count on mobile for smoother framerate)
    const particleCount = isMobile ? 45 : 120;
    const particles = Array.from({ length: particleCount }, () => new Particle());

    // Shockwave scheduler
    const shockwaves = [];
    let waveTriggered = false;

    // Visualizer bar values (reduced count on mobile for smoother framerate)
    const barCount = isMobile ? 60 : 120;
    const barValues = new Array(barCount).fill(0);
    const targetBarValues = new Array(barCount).fill(0);

    // Audio beat timeline trigger
    let time = 0;

    const animate = (timestamp) => {
      ctx.fillStyle = '#030408';
      ctx.globalAlpha = 0.15; // Trails
      ctx.fillRect(0, 0, width, height);

      time += 0.025;

      // Draw faint background rotating sound waves
      ctx.globalAlpha = 0.05;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(time * 0.05);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const r = 180 + Math.sin(time + i) * 15;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
      }
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Trigger green wave pulse exactly once at 1.5 seconds
      if (!waveTriggered && timestamp > 1500) {
        shockwaves.push(new Shockwave());
        waveTriggered = true;
      }

      // Update & draw shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const wave = shockwaves[i];
        wave.update();
        wave.draw();
        if (wave.alpha <= 0) {
          shockwaves.splice(i, 1);
        }
      }

      // Update & draw space particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Draw premium circular sound wave visualizer around the central text area
      const centerX = width / 2;
      const centerY = height / 2;
      const innerRadius = Math.min(width * 0.35, 240); // Responsive radius
      const outerMax = innerRadius + 60;

      // Slowly mutate visualizer peaks to simulate a live sound spectrum
      for (let i = 0; i < barCount; i++) {
        if (Math.random() < 0.08) {
          targetBarValues[i] = Math.random() * 45 + 5;
        }
        // Smooth interpolation
        barValues[i] += (targetBarValues[i] - barValues[i]) * 0.1;
        // Natural decay
        targetBarValues[i] *= 0.96;
      }

      // Render the audio wave circle
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 + (time * 0.08);
        const val = barValues[i];
        
        // Compute coordinates
        const startX = centerX + Math.cos(angle) * innerRadius;
        const startY = centerY + Math.sin(angle) * innerRadius;
        const endX = centerX + Math.cos(angle) * (innerRadius + val);
        const endY = centerY + Math.sin(angle) * (innerRadius + val);

        // Vibe accent gradient coloring
        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.2)'); // Indigo start
        grad.addColorStop(1, 'rgba(29, 185, 84, 0.7)');  // Accent green end

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    // Auto complete timeline triggers
    // Letter transitions finish around 3s. Let's auto-fade at 4.2 seconds
    const autoCompleteTimer = setTimeout(() => {
      handleSkip();
    }, 4200);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId.current);
      clearTimeout(autoCompleteTimer);
    };
  }, []);

  const handleSkip = () => {
    if (isFading) return;
    setIsFading(true);
    // Transition overlay opacity fades over 1.2s. Then unmount.
    setTimeout(() => {
      onComplete();
    }, 1200);
  };

  return (
    <div className={`splash-overlay ${isFading ? 'fade-out' : ''}`}>
      {/* Background visual effects canvas */}
      <canvas ref={canvasRef} className="splash-canvas" />

      {/* Skip Button */}
      <button onClick={handleSkip} className="splash-skip-btn">
        <span>Skip Intro</span>
        <ChevronRight size={14} />
      </button>

      {/* Cinematic Content Box */}
      <div className="splash-content">
        <div className="splash-title-wrapper">
          {titleChars.map((char, idx) => {
            const isSpace = char === ' ';
            return (
              <span
                key={idx}
                className={`splash-char ${isSpace ? 'space' : ''}`}
                style={{
                  animationDelay: `${idx * baseStagger}s`,
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
        <div className="splash-subtitle">
          Where Music Meets Magic
        </div>
      </div>
    </div>
  );
}

export default SplashIntro;
