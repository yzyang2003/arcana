'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface GlowingEffectProps {
  children: React.ReactNode;
  className?: string;
  spread?: number;
}

export default function GlowingEffect({ children, className = '', spread = 200 }: GlowingEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const xTo = useRef<((value: number) => gsap.core.Tween) | null>(null);
  const yTo = useRef<((value: number) => gsap.core.Tween) | null>(null);

  useEffect(() => {
    if (!glowRef.current) return;

    // Create quickTo for zero-render mouse following
    xTo.current = gsap.quickTo(glowRef.current, 'x', {
      duration: 0.4,
      ease: 'power3',
    });
    yTo.current = gsap.quickTo(glowRef.current, 'y', {
      duration: 0.4,
      ease: 'power3',
    });

    return () => {
      xTo.current = null;
      yTo.current = null;
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !xTo.current || !yTo.current) return;
    xTo.current(e.clientX - rect.left);
    yTo.current(e.clientY - rect.top);
  };

  const handleMouseEnter = () => {
    gsap.to(glowRef.current, { autoAlpha: 1, duration: 0.3 });
  };

  const handleMouseLeave = () => {
    gsap.to(glowRef.current, { autoAlpha: 0, duration: 0.3 });
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(${spread}px circle at 50% 50%, rgba(155,140,255,0.12), transparent 60%)`,
          willChange: 'transform',
        }}
      />
      {children}
    </div>
  );
}
