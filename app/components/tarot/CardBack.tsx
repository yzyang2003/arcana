'use client';

import React, { useRef, useEffect } from 'react';
import { renderCardBack } from '@/src/lib/canvas/card-back-renderer';

interface CardBackProps {
  width: number;
  height: number;
  className?: string;
  animated?: boolean;
  minimal?: boolean;
}

/* ── Floating dot positions & animation configs ── */
const floatDots = [
  { x: 40, y: 35, r: 2, dur: 4.5, dx: 6, dy: 4, color: 'rgba(212,175,55,0.6)' },
  { x: 72, y: 50, r: 1.5, dur: 5.2, dx: -4, dy: 5, color: 'rgba(155,140,255,0.5)' },
  { x: 108, y: 42, r: 1.8, dur: 3.8, dx: 5, dy: -3, color: 'rgba(212,175,55,0.55)' },
  { x: 55, y: 68, r: 1.2, dur: 6.0, dx: -3, dy: -4, color: 'rgba(212,175,55,0.5)' },
  { x: 85, y: 80, r: 1.6, dur: 4.0, dx: 4, dy: 3, color: 'rgba(155,140,255,0.45)' },
  // Inner ring dots
  { x: 48, y: 55, r: 1.0, dur: 5.5, dx: -5, dy: 2, color: 'rgba(212,175,55,0.5)' },
  { x: 95, y: 62, r: 1.3, dur: 3.5, dx: 3, dy: -5, color: 'rgba(155,140,255,0.4)' },
  { x: 62, y: 45, r: 1.1, dur: 4.8, dx: -2, dy: 6, color: 'rgba(212,175,55,0.45)' },
  // Stars near moon area
  { x: 56, y: 38, r: 1.4, dur: 3.2, dx: 2, dy: -3, color: 'rgba(212,175,55,0.7)' },
  { x: 80, y: 35, r: 1.0, dur: 4.2, dx: -3, dy: 2, color: 'rgba(212,175,55,0.6)' },
  { x: 68, y: 48, r: 0.9, dur: 5.0, dx: 4, dy: -2, color: 'rgba(212,175,255,0.5)' },
];

/* ── Dot ring: 3 concentric rings of tiny rotating dots ── */
function DotRings({ sx, sy }: { sx: number; sy: number }) {
  const rings = [
    { cx: 150, cy: 220, r: 42, count: 12, dotR: 1.5 },
    { cx: 150, cy: 220, r: 76, count: 20, dotR: 1.2 },
    { cx: 150, cy: 220, r: 108, count: 28, dotR: 0.9 },
  ];

  return (
    <>
      {rings.map((ring, ri) => (
        <div
          key={`ring-${ri}`}
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            animation: `dot-ring-rotate ${120 + ri * 30}s linear infinite`,
          }}
        >
          {Array.from({ length: ring.count }).map((_, i) => {
            const angle = (2 * Math.PI * i) / ring.count;
            const x = ring.cx * sx + ring.r * sx * Math.cos(angle);
            const y = ring.cy * sy + ring.r * sy * Math.sin(angle);
            return (
              <div
                key={`dot-${ri}-${i}`}
                className="absolute rounded-full"
                style={{
                  left: x - ring.dotR * sx,
                  top: y - ring.dotR * sx,
                  width: ring.dotR * sx * 2,
                  height: ring.dotR * sx * 2,
                  backgroundColor: 'rgba(212,175,55,0.6)',
                  boxShadow: `0 0 ${ring.dotR * sx}px rgba(212,175,55,0.4)`,
                }}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}

const CardBack = React.memo(function CardBack({
  width,
  height,
  className = '',
  animated = false,
  minimal = false,
}: CardBackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const source = renderCardBack(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }, [width, height]);

  // Holographic refraction — ambient slow rotation
  useEffect(() => {
    if (minimal || !holoRef.current) return;
    const el = holoRef.current;
    let angle = 0;
    let animId: number;
    const rotate = () => {
      angle += 0.3;
      el.style.setProperty('--holo-angle', `${angle}deg`);
      animId = requestAnimationFrame(rotate);
    };
    animId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animId);
  }, [minimal]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const sx = width / 300;
  const sy = height / 440;

  return (
    <>
      <style jsx global>{`
        @keyframes card-back-holo-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes card-back-glow-pulse {
          0%, 100% { filter: drop-shadow(0 4px 12px rgba(155, 140, 255, 0.2)); }
          50% { filter: drop-shadow(0 4px 20px rgba(155, 140, 255, 0.4)); }
        }
        @keyframes dot-float-1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.5; }
          25% { transform: translate(5px, -3px); opacity: 0.8; }
          50% { transform: translate(-2px, -6px); opacity: 0.4; }
          75% { transform: translate(-5px, 2px); opacity: 0.7; }
        }
        @keyframes dot-float-2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          33% { transform: translate(-4px, 5px); opacity: 0.3; }
          66% { transform: translate(6px, -2px); opacity: 0.8; }
        }
        @keyframes dot-float-3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(3px, 4px); opacity: 0.9; }
        }
        @keyframes dot-float-4 {
          0%, 100% { transform: translate(0, 0); opacity: 0.7; }
          25% { transform: translate(-3px, -5px); opacity: 0.4; }
          75% { transform: translate(4px, 3px); opacity: 0.8; }
        }
        @keyframes dot-float-5 {
          0%, 100% { transform: translate(0, 0); opacity: 0.5; }
          40% { transform: translate(5px, 2px); opacity: 0.9; }
          80% { transform: translate(-4px, -3px); opacity: 0.3; }
        }
        @keyframes dot-ring-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes dot-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
      `}</style>

      <div
        className={`relative inline-block ${className}`}
        style={{
          width,
          height,
          borderRadius: '0.75rem',
          overflow: 'hidden',
          ...(!minimal
            ? { filter: 'drop-shadow(0 4px 12px rgba(155, 140, 255, 0.2))' }
            : {}),
          ...(animated
            ? { animation: 'card-back-glow-pulse 3s ease-in-out infinite' }
            : {}),
        }}
      >
        {/* Static canvas base */}
        <canvas
          ref={canvasRef}
          width={width * dpr}
          height={height * dpr}
          style={{ width, height, borderRadius: '0.75rem' }}
        />

        {/* ── Animated floating dots layer ── */}
        {animated && !minimal && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Floating light particles */}
            {floatDots.map((dot, i) => (
              <div
                key={`float-${i}`}
                className="absolute rounded-full"
                style={{
                  left: dot.x * sx - dot.r,
                  top: dot.y * sy - dot.r,
                  width: dot.r * 2,
                  height: dot.r * 2,
                  backgroundColor: dot.color,
                  boxShadow: `0 0 ${dot.r * 3}px ${dot.color}`,
                  animation: `dot-float-${(i % 5) + 1} ${dot.dur}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}

            {/* Rotating dot rings */}
            <DotRings sx={sx} sy={sy} />

            {/* Twinkling stars near moon */}
            {[
              { x: 120, y: 155, r: 0.8, dur: 3.0 },
              { x: 178, y: 160, r: 0.6, dur: 3.7 },
              { x: 135, y: 205, r: 0.7, dur: 4.2 },
              { x: 168, y: 200, r: 0.5, dur: 2.8 },
              { x: 145, y: 148, r: 0.5, dur: 3.5 },
            ].map((star, i) => (
              <div
                key={`star-${i}`}
                className="absolute rounded-full"
                style={{
                  left: star.x * sx - star.r,
                  top: star.y * sy - star.r,
                  width: star.r * 2,
                  height: star.r * 2,
                  backgroundColor: 'rgba(212,175,55,0.7)',
                  boxShadow: `0 0 ${star.r * 4}px rgba(212,175,55,0.5)`,
                  animation: `dot-twinkle ${star.dur}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Holographic refraction overlay — conic-gradient that rotates */}
        {!minimal && (
          <div
            ref={holoRef}
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              '--holo-angle': '0deg',
              background: `conic-gradient(
                from var(--holo-angle, 0deg),
                transparent 0%,
                rgba(155,140,255,0.07) 12%,
                transparent 20%,
                rgba(212,175,55,0.05) 35%,
                transparent 45%,
                rgba(255,100,200,0.04) 60%,
                transparent 70%,
                rgba(100,200,255,0.05) 85%,
                transparent 100%
              )`,
              mixBlendMode: 'screen' as const,
              opacity: 0.8,
            } as React.CSSProperties}
          />
        )}

        {/* Animated shimmer sweep */}
        {animated && !minimal && (
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background: `linear-gradient(
                105deg,
                transparent 0%,
                rgba(155,140,255,0.08) 20%,
                rgba(212,175,55,0.06) 40%,
                rgba(155,140,255,0.04) 60%,
                transparent 80%
              )`,
              animation: 'card-back-holo-sweep 6s ease-in-out infinite',
            }}
          />
        )}
      </div>
    </>
  );
});

export default CardBack;
