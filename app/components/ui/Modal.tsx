'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export default function Modal({ isOpen, onClose, children, className, 'aria-label': ariaLabel }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useGSAP(() => {
    if (!isOpen || !backdropRef.current || !panelRef.current) return;
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.fromTo(panelRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' });
  }, { scope: backdropRef, dependencies: [isOpen] });

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4'}
      style={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label={ariaLabel}
        className={className}
        style={{ opacity: 0, willChange: 'transform' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
