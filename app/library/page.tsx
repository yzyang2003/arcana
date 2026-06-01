'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TAROT_CARDS } from '@/src/data/tarot-cards';
import type { TarotCard } from '@/src/data/tarot-cards';
import TarotCardComponent from '@/app/components/tarot/TarotCard';

const categories = [
  { id: 'all', label: '全部' },
  { id: 'major', label: '大阿卡纳' },
  { id: 'wands', label: '权杖' },
  { id: 'cups', label: '圣杯' },
  { id: 'swords', label: '宝剑' },
  { id: 'pentacles', label: '星币' },
];

export default function LibraryPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const filtered = TAROT_CARDS.filter((c) => {
    const matchFilter = filter === 'all' || c.type === filter || c.suit === filter;
    const matchSearch = !search || c.nameZh.includes(search) || c.nameEn.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const detail = selectedCard ? TAROT_CARDS.find((c) => c.id === selectedCard) : null;

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelector('.library-header'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  useGSAP(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.grid-card');
    gsap.fromTo(
      cards,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.3, stagger: 0.02, ease: 'power3.out' }
    );
  }, { scope: containerRef, dependencies: [filter, search] });

  return (
    <div ref={containerRef} className="relative min-h-screen px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div
          className="library-header mb-8 text-center"
          style={{ opacity: 0, willChange: 'transform' }}
        >
          <h1 className="font-display-alt text-2xl tracking-[0.15em] text-frost">牌库</h1>
          <p className="mt-2 text-sm text-muted">浏览全部78张塔罗牌</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索牌名..." className="input-field flex-1" />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setFilter(cat.id)} className={`rounded-full px-3 py-1 text-xs transition-all ${filter === cat.id ? 'bg-accent/20 text-accent' : 'text-muted hover:text-frost'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filtered.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedCard(card.id)}
              className="grid-card group transition-transform duration-200 hover:scale-105 hover:drop-shadow-[0_0_12px_rgba(155,140,255,0.4)]"
              style={{ opacity: 0 }}
            >
              <TarotCardComponent card={card} isRevealed={true} size="sm" />
              <p className="mt-1 text-center text-[11px] text-muted group-hover:text-frost">{card.nameZh}</p>
            </button>
          ))}
        </div>

        {detail && (
          <DetailModal detail={detail} onClose={() => setSelectedCard(null)} />
        )}
      </div>
    </div>
  );
}

function DetailModal({ detail, onClose }: { detail: TarotCard; onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useGSAP(() => {
    if (!backdropRef.current || !panelRef.current) return;
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.fromTo(panelRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' });
  }, { scope: backdropRef });

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      style={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`查看${detail.nameZh}详情`}
        className="glass-panel max-w-lg w-full p-6"
        style={{ opacity: 0, willChange: 'transform' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <div className="w-32 flex-shrink-0">
            <TarotCardComponent card={detail} isRevealed={true} size="sm" />
          </div>
          <div className="flex-1">
            <h3 className="font-display-alt text-lg tracking-wider text-frost">{detail.nameZh}</h3>
            <p className="text-xs text-muted">{detail.nameEn}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {detail.keywords.map((k: string) => (
                <span key={k} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent-soft">{k}</span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-metal">{detail.description}</p>
            <div className="mt-3">
              <p className="text-[10px] font-medium text-gold">正位：{detail.upright.meaning}</p>
              <p className="text-[10px] text-muted mt-1">{detail.upright.advice}</p>
            </div>
            <div className="mt-2">
              <p className="text-[10px] font-medium text-violet-400">逆位：{detail.reversed.meaning}</p>
              <p className="text-[10px] text-muted mt-1">{detail.reversed.advice}</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="glass-button mt-4 w-full">关闭</button>
      </div>
    </div>
  );
}
