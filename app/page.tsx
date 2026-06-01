'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import CardBack from './components/tarot/CardBack';
import GlowingEffect from './components/effects/GlowingEffect';

gsap.registerPlugin(SplitText);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const splits: InstanceType<typeof SplitText>[] = [];

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Brand name
    tl.fromTo('.brand-name',
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.7 },
    0.1);

    // Two card backs
    tl.fromTo('.card-left',
      { x: -80, autoAlpha: 0, rotateY: -25, scale: 0.85 },
      { x: 0, autoAlpha: 1, rotateY: -4, scale: 1, duration: 1.0, ease: 'back.out(1.4)' },
    0.4);

    tl.fromTo('.card-right',
      { x: 80, autoAlpha: 0, rotateY: 25, scale: 0.85 },
      { x: 0, autoAlpha: 1, rotateY: 4, scale: 1, duration: 1.0, ease: 'back.out(1.4)' },
    0.5);

    // Title — SplitText char-by-char stagger
    const titleEls = containerRef.current.querySelectorAll('.title-line');
    titleEls.forEach((el, i) => {
      const split = SplitText.create(el, { type: 'chars, words' });
      splits.push(split);
      tl.from(split.chars, {
        autoAlpha: 0, y: 25, rotationX: -40,
        stagger: 0.025, duration: 0.5, ease: 'power3.out',
      }, 0.9 + i * 0.15);
    });

    // Subtitle — word-by-word
    const subtitleEl = containerRef.current.querySelector('.subtitle');
    if (subtitleEl) {
      const subSplit = SplitText.create(subtitleEl, { type: 'words' });
      splits.push(subSplit);
      tl.from(subSplit.words, {
        autoAlpha: 0, y: 15,
        stagger: 0.04, duration: 0.4, ease: 'power2.out',
      }, 1.3);
    }

    // CTA button
    tl.fromTo('.cta-button',
      { autoAlpha: 0, scale: 0.85, y: 10 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' },
    1.6);

    // Bottom decorative line
    tl.fromTo('.deco-line',
      { scaleX: 0, autoAlpha: 0 },
      { scaleX: 1, autoAlpha: 1, duration: 1.0, ease: 'power2.inOut' },
    1.8);

    // Ambient float
    gsap.to('.card-left', {
      y: '-=4', rotation: '-=0.5',
      duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1,
    });
    gsap.to('.card-right', {
      y: '+=4', rotation: '+=0.5',
      duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5,
    });

    // P1-7: Mouse tilt on card pair
    const cardPair = containerRef.current.querySelector('.card-pair');
    if (cardPair) {
      const targets = cardPair.querySelectorAll('.card-tilt-target');
      const tiltXs: gsap.QuickToFunc[] = [];
      const tiltYs: gsap.QuickToFunc[] = [];
      targets.forEach((t) => {
        tiltXs.push(gsap.quickTo(t, 'rotateY', { duration: 0.5, ease: 'power3' }));
        tiltYs.push(gsap.quickTo(t, 'rotateX', { duration: 0.5, ease: 'power3' }));
      });
      const onMove = (e: Event) => {
        const me = e as MouseEvent;
        const rect = cardPair.getBoundingClientRect();
        const nx = ((me.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((me.clientY - rect.top) / rect.height - 0.5) * 2;
        tiltXs.forEach(tx => tx(nx * 12));
        tiltYs.forEach(ty => ty(-ny * 8));
      };
      const onLeave = () => { tiltXs.forEach(tx => tx(0)); tiltYs.forEach(ty => ty(0)); };
      cardPair.addEventListener('mousemove', onMove as EventListener);
      cardPair.addEventListener('mouseleave', onLeave as EventListener);
      return () => {
        cardPair.removeEventListener('mousemove', onMove as EventListener);
        cardPair.removeEventListener('mouseleave', onLeave as EventListener);
        splits.forEach(s => s.revert());
      };
    }

    // Cleanup: revert all SplitText instances
    return () => splits.forEach(s => s.revert());
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="noise-overlay relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Background radial gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 42%, rgba(155,140,255,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Brand name */}
        <p className="brand-name font-display-alt text-xs tracking-[0.4em] uppercase text-gold sm:text-sm">
          Arcana
        </p>

        {/* Two card backs — mouse tilt */}
        <div
          className="card-pair flex items-end justify-center gap-4 sm:gap-8"
          style={{ perspective: '1200px' }}
        >
          <div className="card-left card-tilt-target" style={{ transformStyle: 'preserve-3d' }}>
            <GlowingEffect spread={250}><CardBack size="sm" animated /></GlowingEffect>
          </div>
          <div className="card-right card-tilt-target" style={{ transformStyle: 'preserve-3d' }}>
            <GlowingEffect spread={250}><CardBack size="sm" animated /></GlowingEffect>
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-display-alt flex flex-col items-center gap-1 text-frost"
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 3.5rem)',
            letterSpacing: '0.12em',
            lineHeight: 1.4,
          }}
        >
          <span className="title-line">在静默中</span>
          <span className="title-line gold-shimmer">遇见答案</span>
        </h1>

        {/* Subtitle */}
        <p className="subtitle max-w-md text-sm leading-relaxed text-muted sm:text-base">
          塔罗不是预言，是一面镜子。
          <br />
          在这里，你与自己的直觉对话。
        </p>

        {/* CTA Button */}
        <div className="cta-button">
          <Link
            href="/reading"
            className="glass-panel group relative inline-flex items-center gap-3 px-8 py-3 text-sm font-medium tracking-wider text-frost transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_32px_rgba(155,140,255,0.18)] sm:px-10 sm:py-4 sm:text-base"
          >
            <span className="relative z-10">开始占卜</span>
            <svg
              className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div
        className="deco-line absolute bottom-8 left-1/2 h-px w-32 -translate-x-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(155,140,255,0.3), transparent)',
        }}
      />
    </div>
  );
}
