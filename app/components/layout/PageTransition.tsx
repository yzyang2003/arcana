'use client';

import { useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

/**
 * Page enter animation — fades in + slides up on route change.
 * Each time the pathname changes, the new page content animates in.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(() => {
    if (!containerRef.current) return;
    // New page enter: fade in + slide up
    gsap.fromTo(
      containerRef.current,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' },
    );
  }, { scope: containerRef, dependencies: [pathname] });

  return <div ref={containerRef}>{children}</div>;
}
