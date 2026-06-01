'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Draggable } from 'gsap/Draggable';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(
  useGSAP, ScrollTrigger, Flip, SplitText,
  ScrambleTextPlugin, Draggable, MotionPathPlugin, ScrollToPlugin,
);

gsap.defaults({ duration: 0.6, ease: 'power2.out' });

export default function GsapProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // P2-16: prefers-reduced-motion — speed up all animations
    const mm = gsap.matchMedia();
    mm.add(
      { reduceMotion: '(prefers-reduced-motion: reduce)' },
      (context) => {
        const conditions = context.conditions as Record<string, boolean>;
        if (conditions?.reduceMotion) {
          gsap.globalTimeline.timeScale(100);
        }
        return () => { gsap.globalTimeline.timeScale(1); };
      }
    );
  }, { scope: containerRef });

  return <div ref={containerRef}>{children}</div>;
}
