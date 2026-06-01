'use client';

import { useEffect, useRef } from 'react';

/**
 * Unified canvas: Particles + Shooting Stars + Constellation lines
 * Single RAF loop, DPI-aware, visibilitychange pause
 */
export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    const dpr = window.devicePixelRatio || 1;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; opacity: number; baseOpacity: number;
      phase: number; hue: number; // 0=purple, 1=gold
    }

    interface Star {
      x: number; y: number;
      speed: number; length: number;
      opacity: number; angle: number;
    }

    const particles: Particle[] = [];
    const stars: Star[] = [];
    const COUNT = 80;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + 'px';
      canvas!.style.height = h + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    for (let i = 0; i < COUNT; i++) {
      const isGold = Math.random() < 0.15;
      particles.push({
        x: Math.random() * (window.innerWidth || 1920),
        y: Math.random() * (window.innerHeight || 1080),
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: 0.8 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.5,
        baseOpacity: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        hue: isGold ? 1 : 0,
      });
    }

    function onMouse(e: MouseEvent) { mouseX = e.clientX; mouseY = e.clientY; }
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', resize);

    function spawnStar(w: number, h: number) {
      if (stars.length >= 8 || Math.random() > 0.04) return;
      const angle = Math.PI / 4 + Math.random() * 0.3;
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.3,
        speed: 4 + Math.random() * 6,
        length: 40 + Math.random() * 60,
        opacity: 0.6 + Math.random() * 0.4,
        angle,
      });
    }

    function draw() {
      const w = canvas!.width / dpr;
      const h = canvas!.height / dpr;
      ctx!.clearRect(0, 0, w, h);
      const t = Date.now() * 0.001;
      // --- Nebula layer — slow-drifting soft gradients for depth ---
      const nebulae = [
        { baseX: w * 0.25, baseY: h * 0.35, r: w * 0.18, color: [100, 60, 180], speedX: 0.06, speedY: 0.04 },
        { baseX: w * 0.7, baseY: h * 0.25, r: w * 0.14, color: [50, 80, 160], speedX: 0.04, speedY: 0.07 },
        { baseX: w * 0.5, baseY: h * 0.7, r: w * 0.12, color: [80, 40, 120], speedX: 0.05, speedY: 0.03 },
      ];
      for (const n of nebulae) {
        const ox = Math.sin(t * n.speedX) * 30;
        const oy = Math.cos(t * n.speedY) * 20;
        const grad = ctx!.createRadialGradient(
          n.baseX + ox, n.baseY + oy, 0,
          n.baseX + ox, n.baseY + oy, n.r
        );
        grad.addColorStop(0, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},0.025)`);
        grad.addColorStop(0.5, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},0.012)`);
        grad.addColorStop(1, 'transparent');
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, w, h);
      }

      // --- Particles ---
      for (const p of particles) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const proximity = (120 - dist) / 120; // 0 at edge, 1 at center
          if (proximity > 0.6) {
            // Close range: repel
            const force = proximity * 0.9;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          } else {
            // Far range: attract (gentle pull toward cursor)
            const force = proximity * 0.15;
            p.vx -= (dx / dist) * force;
            p.vy -= (dy / dist) * force;
          }
        }
        p.opacity = p.baseOpacity * (0.5 + 0.5 * Math.sin(t * 0.8 + p.phase));
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.985; p.vy *= 0.985;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const color = p.hue === 1
          ? `rgba(212, 175, 55, ${p.opacity})`
          : `rgba(155, 140, 255, ${p.opacity})`;

        if (p.size > 1.5) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx!.fillStyle = p.hue === 1
            ? `rgba(212, 175, 55, ${p.opacity * 0.15})`
            : `rgba(155, 140, 255, ${p.opacity * 0.15})`;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();
      }

      // --- Constellation lines ---
      const LINE_DIST = 130;
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINE_DIST) {
            const alpha = (1 - dist / LINE_DIST) * 0.12;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `rgba(155, 140, 255, ${alpha})`;
            ctx!.stroke();
          }
        }
      }

      // --- Shooting stars ---
      spawnStar(w, h);
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.01;
        if (s.opacity <= 0 || s.x > w || s.y > h) {
          stars.splice(i, 1);
          continue;
        }
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;
        const grad = ctx!.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, `rgba(255,255,255,${s.opacity})`);
        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(s.x, s.y);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(212,175,55,${s.opacity})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    // Pause when tab hidden
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else animId = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', onVis);

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ opacity: 0.8, zIndex: 0 }}
    />
  );
}
