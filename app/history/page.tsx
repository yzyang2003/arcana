'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReadingStore } from '@/src/store/reading-store';
import { getCardById } from '@/src/data/tarot-cards';
import CardBack from '@/app/components/tarot/CardBack';

export default function HistoryPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { history, clearHistory } = useReadingStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const panelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelector('.history-header'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
    const items = containerRef.current.querySelectorAll('.history-item');
    gsap.fromTo(
      items,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      // Collapse
      const panel = panelRefs.current.get(id);
      if (panel) {
        gsap.to(panel, {
          height: 0, opacity: 0, duration: 0.3, ease: 'power2.in',
          onComplete: () => setExpandedId(null),
        });
      } else {
        setExpandedId(null);
      }
    } else {
      // Collapse old if any
      if (expandedId) {
        const oldPanel = panelRefs.current.get(expandedId);
        if (oldPanel) {
          gsap.to(oldPanel, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
        }
      }
      setExpandedId(id);
      // Animate in after React renders
      requestAnimationFrame(() => {
        const panel = panelRefs.current.get(id);
        if (panel) {
          gsap.fromTo(panel,
            { height: 0, opacity: 0 },
            { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
          );
        }
      });
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div
          className="history-header mb-8 flex items-center justify-between"
          style={{ opacity: 0, willChange: 'transform' }}
        >
          <div>
            <h1 className="font-display-alt text-2xl tracking-[0.15em] text-frost">历史记录</h1>
            <p className="mt-1 text-sm text-muted">回顾你的每一次占卜</p>
          </div>
          {history.length > 0 && (
            <button onClick={() => setShowConfirm(true)} className="glass-button text-xs">清空</button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <CardBack size="sm" animated={false} />
            <p className="text-sm text-muted">还没有占卜记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((reading) => (
              <div
                key={reading.id}
                className="history-item glass-panel overflow-hidden"
                style={{ opacity: 0, willChange: 'transform' }}
              >
                <button
                  onClick={() => handleExpand(reading.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted">{new Date(reading.date).toLocaleDateString('zh-CN')}</p>
                      <p className="mt-1 text-sm text-frost">{reading.spread.nameZh} · {reading.question}</p>
                    </div>
                    <svg className={`h-4 w-4 text-muted transition-transform ${expandedId === reading.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {reading.cards.slice(0, 5).map((dc, j) => {
                      const card = getCardById(dc.id);
                      return (
                        <div key={j} className="h-8 w-5 overflow-hidden rounded-sm bg-surface">
                          {card && <img src={card.image} alt={card.nameZh} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                        </div>
                      );
                    })}
                    {reading.cards.length > 5 && <span className="text-[10px] text-muted">+{reading.cards.length - 5}</span>}
                  </div>
                </button>

                {/* Expandable panel — uses ref instead of getElementById */}
                <div
                  ref={(el) => { if (el) panelRefs.current.set(reading.id, el); }}
                  className="overflow-hidden border-t border-white/5"
                  style={{ height: expandedId === reading.id ? 'auto' : 0, opacity: expandedId === reading.id ? 1 : 0 }}
                >
                  <div className="p-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {reading.cards.map((dc, j) => {
                        const card = getCardById(dc.id);
                        if (!card) return null;
                        return (
                          <div key={j} className="flex-shrink-0 text-center">
                            <div className="h-16 w-11 overflow-hidden rounded">
                              <img src={card.image} alt={card.nameZh} loading="lazy" decoding="async" className={`h-full w-full object-cover ${dc.reversed ? 'rotate-180' : ''}`} />
                            </div>
                            <p className="mt-1 text-[9px] text-muted">{card.nameZh}{dc.reversed ? '逆' : ''}</p>
                          </div>
                        );
                      })}
                    </div>
                    {reading.result && (
                      <p className="mt-3 text-xs leading-relaxed text-metal whitespace-pre-wrap">{reading.result}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showConfirm && (
          <ConfirmDialog onClose={() => setShowConfirm(false)} onConfirm={() => { clearHistory(); setShowConfirm(false); }} />
        )}
      </div>
    </div>
  );
}

function ConfirmDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      style={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="glass-panel p-6 text-center"
        style={{ opacity: 0, willChange: 'transform' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-frost">确定要清空所有记录吗？</p>
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="glass-button flex-1">取消</button>
          <button onClick={onConfirm} className="accent-button flex-1">清空</button>
        </div>
      </div>
    </div>
  );
}
