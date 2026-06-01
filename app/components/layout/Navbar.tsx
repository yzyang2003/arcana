'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: '入口' },
  { href: '/reading', label: '占卜' },
  { href: '/library', label: '牌库' },
  { href: '/daily', label: '每日' },
  { href: '/history', label: '记录' },
  { href: '/settings', label: '设置' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Animate mobile menu open/close
  useEffect(() => {
    if (!mobileMenuRef.current) return;

    if (mobileOpen) {
      // Show the menu element first, then animate in
      mobileMenuRef.current.style.display = 'block';
      gsap.fromTo(
        mobileMenuRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' }
      );
    } else if (mobileMenuRef.current.style.display !== 'none') {
      gsap.to(mobileMenuRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          if (mobileMenuRef.current) {
            mobileMenuRef.current.style.display = 'none';
          }
        },
      });
    }
  }, [mobileOpen]);

  return (
    <nav className="fixed top-0 left-0 z-50 px-4 pt-4" style={{ width: '100vw' }}>
      <div className="mx-auto max-w-2xl">
        <div className="glass-panel rounded-full px-5 py-2.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-accent group-hover:scale-125 transition-transform" />
            <span className="font-display-alt text-sm tracking-[0.2em] text-frost">
              Arcana
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-full text-xs tracking-wider transition-colors duration-200 ${
                  pathname === link.href
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted hover:text-frost hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden p-1 text-muted hover:text-frost transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div
          ref={mobileMenuRef}
          className="glass-panel rounded-2xl mt-2 p-2 md:hidden"
          style={{ display: 'none' }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm tracking-wider transition-all ${
                pathname === link.href
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:text-frost hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
