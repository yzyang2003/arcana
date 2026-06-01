'use client';

import { useMemo, useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import CardBack from './CardBack';
import { playWhoosh, playClick } from '@/src/lib/sounds';

interface CardFanSelectionProps {
  totalCards: number;
  onSelect: (deckIndex: number) => void;
}

interface CardPos {
  index: number;
  x: number;
  y: number;
  rotate: number;
}

export default function CardFanSelection({ totalCards, onSelect }: CardFanSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const selectedSet = useRef(new Set<number>());

  const half = Math.ceil(totalCards / 2);

  const { radius, angleStep, arcStart } = useMemo(() => {
    const totalArc = 60;
    const step = half <= 1 ? 0 : totalArc / (half - 1);
    const start = -totalArc / 2;
    const arcLength = (typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.85;
    const r = arcLength / (totalArc * Math.PI / 180);
    return { radius: r, angleStep: step, arcStart: start };
  }, [half]);

  const calculateFan = useCallback((startIndex: number, count: number): CardPos[] => {
    return Array.from({ length: count }, (_, i) => {
      const angle = arcStart + i * angleStep;
      const rad = (angle * Math.PI) / 180;
      const x = Math.sin(rad) * radius;
      const y = radius - Math.cos(rad) * radius;
      return { index: startIndex + i, x, y, rotate: angle };
    });
  }, [radius, angleStep, arcStart]);

  const topCards = useMemo(() => calculateFan(0, half), [half, calculateFan]);
  const bottomCards = useMemo(() => calculateFan(half, totalCards - half), [half, totalCards, calculateFan]);

  // Entrance — transform-only (P0-1)
  useGSAP(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.fan-card');
    if (cards.length === 0) return;

    const allPositions = [...topCards, ...bottomCards];
    gsap.killTweensOf(cards);
    playWhoosh({ duration: 0.6, pitch: 600 });

    const tl = gsap.timeline();
    cards.forEach((card) => {
      gsap.set(card, {
        xPercent: -50, yPercent: -50,
        x: 0, y: 0,
        rotation: gsap.utils.random(-25, 25),
        scale: 0.5, autoAlpha: 0, rotateX: -30,
      });
    });
    cards.forEach((card, i) => {
      const pos = allPositions[i];
      if (!pos) return;
      tl.to(card, {
        xPercent: -50, yPercent: -50,
        x: `+=${pos.x}`, y: `+=${pos.y}`,
        rotation: pos.rotate, rotateX: 0,
        scale: 1, autoAlpha: 1,
        duration: 0.6, ease: 'back.out(1.2)',
      }, 0.008 * i);
    });
  }, { scope: containerRef });

  // Click
  const handleClick = useCallback((index: number) => {
    if (selectedSet.current.has(index)) return;
    selectedSet.current.add(index);
    playClick();
    const card = cardsRef.current[index];
    if (card) {
      gsap.to(card, {
        scale: 0.5, autoAlpha: 0.1, y: '+=12',
        duration: 0.35, ease: 'back.in(1.5)', overwrite: true,
      });
    }
    onSelect(index);
  }, [onSelect]);

  // Touch support (P2-12)
  const handleTouchStart = useCallback((index: number) => {
    if (selectedSet.current.has(index)) return;
    const card = cardsRef.current[index];
    if (!card || !tooltipRef.current || !containerRef.current) return;
    const rect = card.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    gsap.set(tooltipRef.current, {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 30,
      autoAlpha: 1,
    });
    gsap.to(card, { y: '-=12', scale: 1.08, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  const handleTouchEnd = useCallback((index: number) => {
    if (selectedSet.current.has(index)) return;
    const card = cardsRef.current[index];
    if (card) {
      gsap.to(card, { y: '+=12', scale: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    }
    if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 0, duration: 0.15 });
    handleClick(index);
  }, [handleClick]);

  // Hover
  const handleMouseEnter = useCallback((index: number) => {
    if (selectedSet.current.has(index)) return;
    const card = cardsRef.current[index];
    if (!card) return;
    gsap.to(card, {
      y: '-=18', scale: 1.12, zIndex: 200,
      duration: 0.25, ease: 'back.out(2)', overwrite: 'auto',
    });
    card.classList.add('card-hover-glow');
    if (tooltipRef.current) {
      const rect = card.getBoundingClientRect();
      const containerRect = containerRef.current!.getBoundingClientRect();
      gsap.set(tooltipRef.current, {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 30,
        autoAlpha: 1,
      });
    }
  }, []);

  const handleMouseLeave = useCallback((index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;
    gsap.to(card, {
      y: '+=18', scale: 1,
      zIndex: parseInt(card.dataset.z || '0'),
      duration: 0.2, ease: 'power2.out', overwrite: 'auto',
    });
    card.classList.remove('card-hover-glow');
    if (tooltipRef.current) gsap.to(tooltipRef.current, { autoAlpha: 0, duration: 0.15 });
  }, []);

  const renderFan = (cards: CardPos[], zIndexDir: number) => (
    <div className="relative" style={{ height: 220 }}>
      {cards.map((card) => {
        const z = zIndexDir === 1
          ? card.index
          : (cards.length - 1 - (card.index - cards[0].index));
        return (
          <div
            key={card.index}
            ref={(el) => { cardsRef.current[card.index] = el; }}
            className="fan-card absolute cursor-pointer"
            data-z={z}
            style={{ zIndex: z }}
            onMouseEnter={() => handleMouseEnter(card.index)}
            onMouseLeave={() => handleMouseLeave(card.index)}
            onClick={() => handleClick(card.index)}
            onTouchStart={() => handleTouchStart(card.index)}
            onTouchEnd={() => handleTouchEnd(card.index)}
          >
            <CardBack size="sm" animated={false} minimal />
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex flex-col items-center gap-[18px]">
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute whitespace-nowrap rounded bg-surface/90 px-2 py-0.5 text-[10px] text-accent-soft"
        style={{ opacity: 0, zIndex: 999 }}
      >
        点击选择
      </div>
      <style>{`.card-hover-glow { filter: drop-shadow(0 0 16px rgba(155,140,255,0.7)) brightness(1.05) !important; }`}</style>
      {renderFan(topCards, 1)}
      {renderFan(bottomCards, -1)}
    </div>
  );
}
