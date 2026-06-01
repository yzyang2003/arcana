'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Celebration particles — gold + purple dots rise from the bottom
 * Triggered when `active` becomes true. Plays once then hides.
 * GSAP tweens are cleaned up on unmount.
 */
export default function CelebrationParticles({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;
    const el = containerRef.current;
    const particles = el.querySelectorAll('.celeb-particle');
    const tweens: gsap.core.Tween[] = [];

    particles.forEach((p, i) => {
      const x = Math.random() * window.innerWidth;
      const startY = window.innerHeight + 20;
      const endY = -50 - Math.random() * 200;
      const drift = (Math.random() - 0.5) * 150;

      gsap.set(p, {
        x,
        y: startY,
        opacity: 0,
        scale: 0.5 + Math.random() * 0.8,
      });

      const moveTween = gsap.to(p, {
        y: endY,
        x: `+=${drift}`,
        opacity: 1,
        duration: 1.5 + Math.random() * 1.5,
        delay: Math.random() * 0.8,
        ease: 'power1.out',
        onStart: () => {
          const fadeTween = gsap.to(p, { opacity: 0, duration: 0.5, delay: 1.0 + Math.random() * 0.5 });
          tweens.push(fadeTween);
        },
      });
      tweens.push(moveTween);
    });

    return () => {
      tweens.forEach(t => t.kill());
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className="celeb-particle absolute"
          style={{
            width: i % 4 === 0 ? 6 : 4,
            height: i % 4 === 0 ? 6 : 4,
            borderRadius: '50%',
            background: i % 3 === 0
              ? '#d4af37'
              : i % 3 === 1
              ? '#9b8cff'
              : '#f5e6a3',
            boxShadow: `0 0 8px ${i % 3 === 0 ? 'rgba(212,175,55,0.6)' : 'rgba(155,140,255,0.5)'}`,
          }}
        />
      ))}
    </div>
  );
}
