'use client';

import { useRef, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Image from 'next/image';
import CardBack from './CardBack';
import { TarotCard as TarotCardType } from '@/src/data/tarot-cards';
import { playFlip, playReveal } from '@/src/lib/sounds';

gsap.registerPlugin(ScrambleTextPlugin);

interface TarotCardProps {
  card: TarotCardType;
  isRevealed?: boolean;
  isReversed?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { width: 120, height: 180 },
  md: { width: 180, height: 270 },
  lg: { width: 240, height: 360 },
};

export default function TarotCard({
  card,
  isRevealed = false,
  isReversed = false,
  onClick,
  size = 'md',
  className = '',
}: TarotCardProps) {
  const { width, height } = sizeConfig[size];
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const prevRevealed = useRef(isRevealed);
  const tiltXTo = useRef<gsap.QuickToFunc | null>(null);
  const tiltYTo = useRef<gsap.QuickToFunc | null>(null);

  useGSAP(() => {
    if (!containerRef.current || !innerRef.current) return;

    tiltXTo.current = gsap.quickTo(innerRef.current, 'rotateY', { duration: 0.4, ease: 'power3' });
    tiltYTo.current = gsap.quickTo(innerRef.current, 'rotateX', { duration: 0.4, ease: 'power3' });

    if (isRevealed === prevRevealed.current) {
      gsap.set(innerRef.current, { rotateY: isRevealed ? 180 : 0 });
      return;
    }
    prevRevealed.current = isRevealed;

    if (isRevealed) {
      playFlip();
      const tl = gsap.timeline();
      tl.to(containerRef.current, { scale: 1.1, y: -8, duration: 0.25, ease: 'power2.out' });
      tl.to(innerRef.current, { rotateY: 180, duration: 0.55, ease: 'back.out(1.4)' }, '-=0.1');
      if (glowRef.current) {
        tl.fromTo(glowRef.current, { scale: 0.2, autoAlpha: 1 },
          { scale: 2.8, autoAlpha: 0, duration: 0.7, ease: 'power2.out', onStart: () => playReveal() }, '-=0.3');
      }
      // Light rays — 4 lines radiate outward from center
      if (raysRef.current) {
        const rays = raysRef.current.querySelectorAll('.glow-ray');
        tl.fromTo(rays,
          { scaleX: 0, autoAlpha: 0.9 },
          { scaleX: 1, autoAlpha: 0, duration: 0.6, stagger: 0.04, ease: 'power2.out' },
          '-=0.55');
      }
      // Border glow — gold outline fades in then out
      if (borderRef.current) {
        tl.fromTo(borderRef.current, { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, '-=0.4');
        tl.to(borderRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, '-=0.1');
      }
      // ScrambleText — card name decode effect
      if (nameRef.current) {
        tl.add(() => {
          gsap.to(nameRef.current!, {
            duration: 0.8,
            scrambleText: {
              text: card.nameZh,
              chars: '塔罗命运星辰月光∞✦✧',
              revealDelay: 0.2,
            },
          });
        }, '-=0.3');
      }
      tl.to(containerRef.current, { scale: 1, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.6)' }, '-=0.25');
    } else {
      gsap.set(innerRef.current, { rotateY: 0, rotateX: 0 });
      gsap.set(containerRef.current, { scale: 1, y: 0 });
    }
  }, { dependencies: [isRevealed] });

  // 3D tilt on mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isRevealed || !containerRef.current || !tiltXTo.current || !tiltYTo.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltXTo.current(x * 25);
    tiltYTo.current(-y * 20);
    // Peek edge glow — shows gold highlight on the tilted side
    if (peekRef.current) {
      peekRef.current.style.opacity = '1';
      peekRef.current.style.background = `linear-gradient(${90 + x * 60}deg, transparent 30%, rgba(212,175,55,0.15) 70%, rgba(212,175,55,0.3) 100%)`;
    }
  }, [isRevealed]);

  const handleMouseLeave = useCallback(() => {
    tiltXTo.current?.(0);
    tiltYTo.current?.(0);
    if (peekRef.current) peekRef.current.style.opacity = '0';
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer ${className}`}
      style={{ width, height, perspective: '1000px' }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: isReversed
            ? 'radial-gradient(circle, rgba(180,80,255,0.5) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(212,175,55,0.6) 0%, rgba(155,140,255,0.2) 40%, transparent 70%)',
          borderRadius: '0.5rem', opacity: 0,
        }}
      />
      {/* Light rays — 4 gradient lines radiating from center */}
      <div ref={raysRef} className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {[0, 45, 90, 135].map(angle => (
          <div
            key={angle}
            className="glow-ray absolute"
            style={{
              left: '50%', top: '50%',
              width: '250%', height: '2px',
              transform: `translate(-50%, -50%) rotate(${angle}deg) scaleX(0)`,
              transformOrigin: 'center',
              background: isReversed
                ? 'linear-gradient(90deg, transparent 0%, rgba(180,80,255,0.5) 25%, rgba(255,255,255,0.7) 50%, rgba(180,80,255,0.5) 75%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.5) 25%, rgba(255,255,255,0.7) 50%, rgba(212,175,55,0.5) 75%, transparent 100%)',
            }}
          />
        ))}
      </div>
      {/* Border glow — gold outline on reveal */}
      <div
        ref={borderRef}
        className="absolute inset-0 pointer-events-none z-20 rounded-lg"
        style={{
          border: '2px solid rgba(212,175,55,0.5)',
          boxShadow: '0 0 16px rgba(212,175,55,0.3), inset 0 0 16px rgba(212,175,55,0.1)',
          opacity: 0,
        }}
      />
      {/* Peek edge glow — gold highlight on hover tilt */}
      <div
        ref={peekRef}
        className="absolute inset-0 pointer-events-none z-20 rounded-lg"
        style={{ opacity: 0, transition: 'opacity 0.2s ease' }}
      />
      <div ref={innerRef} className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
        <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
          <CardBack size={size} />
        </div>
        <div
          className={`absolute inset-0 w-full h-full rounded-lg overflow-hidden ${isRevealed ? 'shadow-[0_0_24px_rgba(212,175,55,0.5)]' : ''}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="relative w-full h-full bg-gray-900">
            <Image src={card.image} alt={card.nameEn} fill
              className={`object-cover transition-transform duration-500 ${isReversed ? 'rotate-180 scale-110' : ''}`}
              sizes={`${width}px`} />
            {/* Front holographic sheen — subtle light reflection */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(212,175,55,0.06) 25%, transparent 45%, rgba(155,140,255,0.05) 65%, transparent 85%)',
                mixBlendMode: 'screen',
              }}
            />
            {isReversed && (
              <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded font-bold shadow-md">REVERSED</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
              <p ref={nameRef} className="text-white text-center font-semibold truncate" style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px' }}>
                {card.nameZh}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
