import React, { useEffect, useRef } from 'react';

function LikeAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let particles = [];
    let lines = [];
    let ripples = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const vibeColors = {
      classic: ['#1db954', '#1ed760', '#ffffff'],
      neon: ['#f43f5e', '#fb7185', '#a855f7', '#ffffff'],
      chill: ['#8b5cf6', '#a78bfa', '#3b82f6', '#ffffff'],
      gold: ['#d97706', '#f59e0b', '#eab308', '#ffffff'],
      ocean: ['#06b6d4', '#22d3ee', '#10b981', '#ffffff'],
      crimson: ['#ef4444', '#f87171', '#7f1d1d', '#ffffff']
    };

    const detectVibe = (song) => {
      const title = (song.title || '').toLowerCase();
      if (title.includes('remix') || title.includes('mix') || title.includes('dj') || title.includes('dance') || title.includes('beat') || title.includes('edm') || title.includes('party') || title.includes('rap') || title.includes('hip hop') || title.includes('dappu') || title.includes('mass')) {
        return 'neon';
      } else if (title.includes('lofi') || title.includes('lo-fi') || title.includes('chill') || title.includes('sleep') || title.includes('relax') || title.includes('sad') || title.includes('broken') || title.includes('peace') || title.includes('melody') || title.includes('piano')) {
        return 'chill';
      } else if (title.includes('love') || title.includes('romantic') || title.includes('sweet') || title.includes('dil') || title.includes('pyar') || title.includes('prema') || title.includes('kaadhal') || title.includes('mohabat')) {
        return 'ocean';
      } else if (title.includes('classical') || title.includes('retro') || title.includes('old') || title.includes('gold') || title.includes('bhajan') || title.includes('ghazal') || title.includes('instrumental') || title.includes('90s') || title.includes('80s')) {
        return 'gold';
      } else if (title.includes('theme') || title.includes('bgm') || title.includes('cinematic') || title.includes('ost') || title.includes('teaser') || title.includes('trailer') || title.includes('epic') || title.includes('action') || title.includes('mass bgm')) {
        return 'crimson';
      }
      return 'classic';
    };

    // Helper to draw a bezier heart path
    const drawHeart = (ctx, x, y, size) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size / 4);
      // Top-left curve
      ctx.bezierCurveTo(x - size / 2, y - size, x - size, y - size / 3, x, y + size * 0.85);
      // Top-right curve
      ctx.bezierCurveTo(x + size, y - size / 3, x + size / 2, y - size, x, y - size / 4);
      ctx.closePath();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw expanding ripples (Soundwaves & Heart Waves)
      ripples.forEach((ripple, index) => {
        ripple.radius += ripple.speed;
        ripple.opacity = 1 - (ripple.radius / ripple.maxRadius);

        if (ripple.opacity <= 0) {
          ripples.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.strokeStyle = ripple.color;
        ctx.lineWidth = ripple.thickness * ripple.opacity;
        ctx.shadowBlur = 25;
        ctx.shadowColor = ripple.color;
        ctx.globalAlpha = ripple.opacity * 0.7;

        if (ripple.isHeart) {
          drawHeart(ctx, ripple.x, ripple.y, ripple.radius);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 2. Draw rising laser lines (Light Streaks)
      lines.forEach((line, index) => {
        line.y -= line.speed;
        line.opacity -= 0.008;

        if (line.y < -150 || line.opacity <= 0) {
          lines.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.beginPath();
        // Dynamic wave bend based on height
        const shiftX = Math.sin(line.y / 40) * 15;
        ctx.moveTo(line.x + shiftX, line.y + line.length);
        ctx.lineTo(line.x + shiftX, line.y);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.thickness;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 22;
        ctx.shadowColor = line.color;
        ctx.globalAlpha = line.opacity;
        ctx.stroke();
        ctx.restore();
      });

      // 3. Draw rising glowing embers (Particles)
      particles.forEach((p, index) => {
        p.y -= p.speedY;
        p.x += Math.sin(p.y / 25) * 1.0;
        p.life -= 1;
        p.opacity = p.life / p.maxLife;

        if (p.life <= 0) {
          particles.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.radius * 3.5;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.opacity * 0.8;
        ctx.fill();
        ctx.restore();
      });

      // Terminate animation loop if idle
      if (particles.length === 0 && lines.length === 0 && ripples.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationId = null;
        return;
      }

      animationId = requestAnimationFrame(animate);
    };

    const triggerAnimation = (e) => {
      const { song, x, y } = e.detail || {};
      if (!song) return;

      const vibe = detectVibe(song);
      const colors = vibeColors[vibe] || vibeColors.classic;

      const clickX = x !== undefined ? x : canvas.width / 2;
      const clickY = y !== undefined ? y : canvas.height - 80;

      // Spawn localized expanding neon heart ripples from click/like position
      ripples.push({
        x: clickX,
        y: clickY,
        radius: 10,
        maxRadius: 160,
        speed: 3.5,
        color: colors[0],
        thickness: 3.5,
        isHeart: true,
        opacity: 1
      });

      // Spawn global concentric sonar soundwaves (from center bottom player)
      const centerBottomX = canvas.width / 2;
      const centerBottomY = canvas.height - 80;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          ripples.push({
            x: centerBottomX,
            y: centerBottomY,
            radius: 10,
            maxRadius: Math.min(canvas.width, canvas.height) * 0.5,
            speed: 4.5 + i * 1.5,
            color: colors[i % colors.length],
            thickness: 3 - i * 0.5,
            isHeart: false,
            opacity: 1
          });
        }, i * 150);
      }

      // Spawn rising neon laser beam light trails
      const lineCount = 14 + Math.floor(Math.random() * 6);
      for (let i = 0; i < lineCount; i++) {
        const xPos = Math.random() * canvas.width;
        lines.push({
          x: xPos,
          y: canvas.height + 100,
          speed: 5 + Math.random() * 7,
          length: 100 + Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          thickness: 1.5 + Math.random() * 2.5,
          opacity: 0.75 + Math.random() * 0.25
        });
      }

      // Spawn floating glowing embers rising upwards
      const particleCount = 45 + Math.floor(Math.random() * 15);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: clickX + (Math.random() - 0.5) * 160,
          y: clickY - 10,
          speedY: 1.5 + Math.random() * 3.5,
          radius: 2.5 + Math.random() * 5.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 90 + Math.random() * 50,
          maxLife: 140,
          opacity: 1
        });
      }

      // Start loop if not active
      if (!animationId) {
        animate();
      }
    };

    window.addEventListener('trigger-like-animation', triggerAnimation);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('trigger-like-animation', triggerAnimation);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999
      }}
    />
  );
}

export default LikeAnimation;
