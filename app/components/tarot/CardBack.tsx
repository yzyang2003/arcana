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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const source = renderCardBack(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }, [width, height]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return (
    <canvas
      ref={canvasRef}
      width={width * dpr}
      height={height * dpr}
      className={className}
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
    />
  );
});

export default CardBack;
