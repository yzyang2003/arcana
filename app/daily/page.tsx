'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import { TAROT_CARDS } from '@/src/data/tarot-cards';
import TarotCard from '@/app/components/tarot/TarotCard';

gsap.registerPlugin(SplitText);

function getDailyCard() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % 78;
  const reversed = dayOfYear % 3 === 0;
  return { card: TAROT_CARDS[index], reversed };
}

export default function DailyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealDetails, setRevealDetails] = useState(false);
  const { card, reversed } = getDailyCard();

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  useGSAP(() => {
    if (!containerRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Header
    tl.fromTo(containerRef.current.querySelector('.daily-header'),
      { autoAlpha: 0, y: 25 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0);

    // Card — scale up from small
    tl.fromTo(containerRef.current.querySelector('.daily-card'),
      { autoAlpha: 0, scale: 0.85 },
      { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }, 0.3);

    // Hint text
    if (!revealed) {
      tl.fromTo(containerRef.current.querySelector('.daily-hint'),
        { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.9);
    }
  }, { scope: containerRef });

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReveal = () => {
    setRevealed(true);
    revealTimerRef.current = setTimeout(() => setRevealDetails(true), 300);
  };

  useEffect(() => {
    return () => { if (revealTimerRef.current) clearTimeout(revealTimerRef.current); };
  }, []);

  return (
    <div ref={containerRef} className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24">
      <div
        className="daily-header text-center"
        style={{ opacity: 0, willChange: 'transform' }}
      >
        <p className="text-xs text-muted">{today}</p>
        <h1 className="font-display-alt mt-2 text-2xl tracking-[0.15em] text-frost">每日一牌</h1>
        <p className="mt-1 text-sm text-muted">今天宇宙想对你说的话</p>
      </div>

      <div className="daily-card cursor-pointer mt-10" style={{ opacity: 0, willChange: 'transform', perspective: '1000px' }} onClick={() => !revealed && handleReveal()}>
        <TarotCard card={card} isRevealed={revealed} isReversed={reversed} size="lg" />
      </div>

      {!revealed && (
        <p
          className="daily-hint mt-6 text-sm text-muted animate-pulse"
          style={{ opacity: 0 }}
        >
          点击翻开今天的牌
        </p>
      )}

      {revealed && revealDetails && (
        <RevealDetails card={card} reversed={reversed} />
      )}
    </div>
  );
}

function RevealDetails({ card, reversed }: { card: (typeof TAROT_CARDS)[number]; reversed: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const splits: InstanceType<typeof SplitText>[] = [];
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(ref.current, { autoAlpha: 0, y: 30, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6 });

    const heading = ref.current.querySelector('.card-title');
    if (heading) {
      const split = SplitText.create(heading, { type: 'chars' });
      splits.push(split);
      tl.from(split.chars, {
        autoAlpha: 0, y: 10, rotationX: -30,
        stagger: 0.03, duration: 0.4, ease: 'back.out(1.5)',
      }, '-=0.3');
    }

    const keywords = ref.current.querySelectorAll('.keyword-tag');
    if (keywords.length > 0) {
      tl.from(keywords, {
        autoAlpha: 0, scale: 0.8,
        stagger: 0.04, duration: 0.3, ease: 'back.out(2)',
      }, '-=0.2');
    }

    return () => splits.forEach(s => s.revert());
  }, { scope: ref });

  return (
    <div ref={ref} className="glass-panel mt-8 max-w-md p-6 text-center" style={{ opacity: 0, willChange: 'transform' }}>
      <h3 className="card-title font-display-alt text-lg tracking-wider text-frost">{card.nameZh}</h3>
      <p className="text-xs text-muted">{card.nameEn}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {card.keywords.map((k: string) => (
          <span key={k} className="keyword-tag rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent-soft">{k}</span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-metal">{card.description}</p>
      <div className="mt-4 border-t border-white/5 pt-3">
        <p className={`text-xs font-medium ${reversed ? 'text-violet-400' : 'text-gold'}`}>
          {reversed ? '逆位' : '正位'}：{reversed ? card.reversed.meaning : card.upright.meaning}
        </p>
        <p className="mt-1 text-xs text-muted">{reversed ? card.reversed.advice : card.upright.advice}</p>
      </div>
    </div>
  );
}
