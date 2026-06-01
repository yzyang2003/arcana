'use client';

import { useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import CardBack from './CardBack';
import { playWhoosh } from '@/src/lib/sounds';

interface ShuffleDeckProps {
  duration?: number;
  onComplete?: () => void;
  cardCount?: number;
}

export default function ShuffleDeck({ duration = 2500, onComplete, cardCount = 78 }: ShuffleDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const cardPositions = useMemo(() =>
    Array.from({ length: cardCount }, (_, i) => ({
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 300,
      rotate: (Math.random() - 0.5) * 60,
      rotationX: (Math.random() - 0.5) * 90,
      delay: i * 0.008,
    })),
    [cardCount]
  );

  useGSAP(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.shuffle-card');
    if (cards.length === 0) return;

    const tl = gsap.timeline({
      onComplete: () => onComplete?.(),
    });

    // === ACT 1: Explosive scatter from center ===
    tl.fromTo(cards, {
      x: 0, y: 0, rotation: 0, rotationX: 0, scale: 0.5, autoAlpha: 0, filter: 'blur(0px)',
    }, {
      x: (i) => cardPositions[i].x,
      y: (i) => cardPositions[i].y,
      rotation: (i) => cardPositions[i].rotate,
      rotationX: (i) => cardPositions[i].rotationX,
      scale: 0.85, autoAlpha: 1, filter: 'blur(2px)',
      duration: 0.5,
      stagger: { each: 0.008, from: 'random' },
      ease: 'elastic.out(1, 0.5)',
      onStart: () => playWhoosh({ duration: 0.5, pitch: 700 }),
    });

    // Motion blur clear — sharp focus after scatter
    tl.to(cards, {
      filter: 'blur(0px)',
      duration: 0.2,
      stagger: { each: 0.002, from: 'random' },
    });

    // === ACT 2: Hovering / floating ===
    tl.to(cards, {
      y: (i) => `+=${gsap.utils.random(-18, 18)}`,
      rotation: (i) => `+=${gsap.utils.random(-10, 10)}`,
      duration: 0.4,
      stagger: { each: 0.003, from: 'random' },
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1,
    }, '-=0.2');

    // === ACT 3: Magnet pull back to center ===
    tl.to(cards, {
      x: 0, y: 0, rotation: 0, rotationX: 0, scale: 1,
      duration: 0.5,
      stagger: { each: 0.004, from: 'random' },
      ease: 'back.out(1.7)',
      onStart: () => playWhoosh({ duration: 0.4, pitch: 500 }),
    });

    // Final fade out
    tl.to(cards, {
      autoAlpha: 0, scale: 0.85,
      duration: 0.25,
      stagger: { each: 0.002, from: 'center' },
      ease: 'power3.in',
    }, '-=0.05');

    tlRef.current = tl;
  }, {
    scope: containerRef,
    dependencies: [cardCount, duration],
  });

  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 300 }}>
      {/* Background glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(155,140,255,0.35) 0%, rgba(212,175,55,0.12) 40%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'card-back-moon-pulse 4s ease-in-out infinite',
        }}
      />

      {/* Card stack */}
      <div ref={containerRef} className="relative" style={{ perspective: 800, width: 150, height: 220 }}>
        {cardPositions.map((_, i) => (
          <div
            key={i}
            className="shuffle-card absolute"
            style={{
              zIndex: i,
              transformOrigin: 'center center',

            }}
          >
            <CardBack size="sm" animated={false} minimal />
          </div>
        ))}
      </div>
    </div>
  );
}
