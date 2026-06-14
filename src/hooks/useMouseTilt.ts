'use client';
import { useCallback, useRef } from 'react';
import gsap from 'gsap';

export function useMouseTilt(options?: { maxTilt?: number; scale?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tiltXTo = useRef<gsap.QuickToFunc | null>(null);
  const tiltYTo = useRef<gsap.QuickToFunc | null>(null);
  
  const maxTilt = options?.maxTilt ?? 15;
  const scale = options?.scale ?? 1.02;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    if (!tiltXTo.current) tiltXTo.current = gsap.quickTo(ref.current, 'rotateX', { duration: 0.4 });
    if (!tiltYTo.current) tiltYTo.current = gsap.quickTo(ref.current, 'rotateY', { duration: 0.4 });
    
    tiltXTo.current(-y * maxTilt);
    tiltYTo.current(x * maxTilt);
    gsap.to(ref.current, { scale, duration: 0.3 });
  }, [maxTilt, scale]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    tiltXTo.current?.(0);
    tiltYTo.current?.(0);
    gsap.to(ref.current, { scale: 1, duration: 0.3 });
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}
