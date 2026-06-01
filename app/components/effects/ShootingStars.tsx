'use client';

import { useEffect, useRef } from 'react';

export default function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; speed: number; length: number; opacity: number; angle: number }[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn() {
      if (stars.length >= 15) return;
      if (Math.random() > 0.06) return;
      const angle = Math.PI / 4 + Math.random() * 0.3;
      stars.push({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height * 0.3,
        speed: 4 + Math.random() * 6,
        length: 40 + Math.random() * 60,
        opacity: 0.6 + Math.random() * 0.4,
        angle,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.008;

        if (s.opacity <= 0 || s.x > canvas!.width || s.y > canvas!.height) {
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

      spawn();
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ opacity: 0.7, zIndex: 0, willChange: 'transform' }}
    />
  );
}
