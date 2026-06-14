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

  // 3 rings of decorative dots (matching canvas renderer positions)
  const dotRings = [
    { cx: 150, cy: 220, r: 42, count: 12, dotR: 1.5 },
    { cx: 150, cy: 220, r: 76, count: 20, dotR: 1.2 },
    { cx: 150, cy: 220, r: 108, count: 28, dotR: 0.9 },
  ];

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
        @keyframes card-back-dot-drift {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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

        {/* ── Animated dot rings overlay — slow rotation ── */}
        {animated && !minimal && dotRings.map((ring, ri) => (
          <div
            key={`dot-ring-${ri}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              animation: `card-back-dot-drift ${120 + ri * 30}s linear infinite`,
              transformOrigin: 'center center',
            }}
          >
            {Array.from({ length: ring.count }).map((_, i) => {
              const angle = (2 * Math.PI * i) / ring.count;
              const x = ring.cx * sx + ring.r * sx * Math.cos(angle);
              const y = ring.cy * sy + ring.r * sy * Math.sin(angle);
              const dotSize = ring.dotR * sx;
              return (
                <div
                  key={`dot-${ri}-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: x - dotSize,
                    top: y - dotSize,
                    width: dotSize * 2,
                    height: dotSize * 2,
                    backgroundColor: 'rgba(212,175,55,0.6)',
                    boxShadow: `0 0 ${dotSize * 2}px rgba(212,175,55,0.3)`,
                  }}
                />
              );
            })}
          </div>
        ))}

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
