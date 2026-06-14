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
      angle += 0.3; // ~120s per full rotation
      el.style.setProperty('--holo-angle', `${angle}deg`);
      animId = requestAnimationFrame(rotate);
    };
    animId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animId);
  }, [minimal]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return (
    <>
      {/* Keyframes for animated effects */}
      {animated && (
        <style jsx global>{`
          @keyframes card-back-holo-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes card-back-moon-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
          @keyframes card-back-star-twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }
          @keyframes card-back-glow-pulse {
            0%, 100% { filter: drop-shadow(0 4px 12px rgba(155, 140, 255, 0.2)); }
            50% { filter: drop-shadow(0 4px 20px rgba(155, 140, 255, 0.4)); }
          }
        `}</style>
      )}

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

        {/* Animated shimmer sweep — only when animated */}
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
