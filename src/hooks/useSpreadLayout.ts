'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Spread } from '@/src/data/spreads';

interface LayoutConfig {
  cardWidth: number;
  cardHeight: number;
  gap: number;
}

export function useSpreadLayout(spread: Spread | undefined) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!spread) return { positions: [], config: { cardWidth: 0, cardHeight: 0, gap: 0 } };
    
    const { width, height } = containerSize;
    const cardWidth = Math.min(120, width / 4);
    const cardHeight = cardWidth * 1.5;
    const gap = cardWidth * 0.15;

    const positions = spread.positions.map((pos) => ({
      ...pos,
      pixelX: (pos.x / 100) * width - cardWidth / 2,
      pixelY: (pos.y / 100) * height - cardHeight / 2,
    }));

    return { positions, config: { cardWidth, cardHeight, gap } };
  }, [spread, containerSize]);

  return { containerRef, ...layout };
}
