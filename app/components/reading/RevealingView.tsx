'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { getCardById } from '@/src/data/tarot-cards';
import TarotCard from '@/app/components/tarot/TarotCard';
import { playReveal } from '@/src/lib/sounds';
import type { Spread } from '@/src/data/spreads';
import type { ReadingCard } from '@/src/types/reading';

function useSpreadLayout(positions: { x: number; y: number }[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!containerWidth || positions.length === 0) {
      return { cardWidth: 120, cardHeight: 180, height: 400, cardSize: 'sm' as const };
    }

    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const maxY = Math.max(...ys);
    const minY = Math.min(...ys);
    const spreadYPct = maxY - minY || 1;

    let minDist = Infinity;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) minDist = dist;
      }
    }
    minDist = Math.max(minDist, 8);

    const cardAspect = 2 / 3;
    const maxW = containerWidth - 32;
    const maxH = Math.min(window.innerHeight * 0.55, 520);

    const maxCardWFromSpacing = (minDist / 100) * maxW * 0.85;
    const maxCardHFromSpacing = (minDist / 100) * maxH * 0.85;
    const maxCardWFromV = maxCardHFromSpacing * cardAspect;

    let cardW = Math.min(maxCardWFromSpacing, maxCardWFromV);
    cardW = Math.max(70, Math.min(150, cardW));
    const cardH = cardW / cardAspect;

    const neededH = (spreadYPct / 100) * maxH + cardH + 40;
    const height = Math.min(Math.max(300, neededH), 600);

    const cardSize: 'sm' | 'md' = cardW >= 130 ? 'md' : 'sm';

    return { cardWidth: cardW, cardHeight: cardH, height, cardSize };
  }, [containerWidth, positions]);

  return { containerRef, layout };
}

interface RevealingViewProps {
  spread: Spread;
  drawnCards: ReadingCard[];
  status: string;
  revealedCount: number;
  onReveal: (positionIndex: number) => void;
  onInterpret: () => void;
}

export default function RevealingView({ spread, drawnCards, status, revealedCount, onReveal, onInterpret }: RevealingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevStatus = useRef(status);

  const { containerRef: layoutContainerRef, layout } = useSpreadLayout(spread.positions);

  useGSAP(() => {
    if (status === 'revealing' && prevStatus.current === 'selecting') {
      if (containerRef.current) {
        const cards = containerRef.current.querySelectorAll('.spread-card-inner');
        gsap.fromTo(cards,
          { autoAlpha: 0, scale: 0.4, rotateX: -30 },
          {
            autoAlpha: 1, scale: 1, rotateX: 0,
            stagger: { each: 0.15, from: 'center' },
            duration: 0.6, ease: 'back.out(1.5)', delay: 0.2,
            onStart: () => playReveal(),
          }
        );
      }
    }
    prevStatus.current = status;
  }, { dependencies: [status] });

  const allRevealed = revealedCount === spread.cardCount;

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl px-4">
      <p className="mb-4 text-center text-sm text-muted">
        点击牌面揭示 ({revealedCount}/{spread.cardCount})
      </p>

      <div
        ref={layoutContainerRef}
        className="relative mx-auto w-full"
        style={{ height: layout.height, maxWidth: '1000px' }}
      >
        {spread.positions.map((pos) => {
          const drawn = drawnCards.find((dc) => dc.positionIndex === pos.index);
          if (!drawn) return null;
          const card = getCardById(drawn.id);
          if (!card) return null;
          return (
            <div
              key={pos.index}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: pos.zIndex,
              }}
            >
              <div className="spread-card-inner">
                <TarotCard
                  card={card}
                  isRevealed={drawn.revealed}
                  isReversed={drawn.reversed}
                  onClick={() => !drawn.revealed && onReveal(pos.index)}
                  size={layout.cardSize}
                />
                <p className="mt-1 text-center text-[10px] text-muted">{drawn.positionName}</p>
              </div>
            </div>
          );
        })}
      </div>

      {allRevealed && (
        <div className="mt-6 text-center">
          <button onClick={onInterpret} className="accent-button px-6 py-2 text-sm">
            查看解读
          </button>
        </div>
      )}
    </div>
  );
}
