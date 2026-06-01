'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { spreads } from '@/src/data/spreads';
import { useReadingStore } from '@/src/store/reading-store';
import { playClick } from '@/src/lib/sounds';

const difficultyColor: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

export default function ReadingPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const startReading = useReadingStore((s) => s.startReading);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Header entrance
    gsap.fromTo(
      containerRef.current.querySelector('.reading-header'),
      { autoAlpha: 0, y: 25 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );

    // Spread cards — stagger from edges
    const cards = containerRef.current.querySelectorAll('.spread-card');
    gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 30, scale: 0.95 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, stagger: { each: 0.08, from: 'edges' }, ease: 'back.out(1.2)' }
    );

    // Bottom section
    gsap.fromTo(
      containerRef.current.querySelector('.bottom-section'),
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.5, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  const handleSelect = (id: string, e: React.MouseEvent) => {
    playClick();
    setSelectedId(id);
    const card = e.currentTarget as HTMLElement;
    gsap.fromTo(card, { scale: 0.97 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
  };

  const handleStart = () => {
    const spread = spreads.find((s) => s.id === selectedId);
    if (!spread || !question.trim()) return;
    playClick();
    startReading(spread, question.trim());
    router.push(`/reading/${spread.id}`);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* 标题 */}
        <div
          className="reading-header mb-10 text-center"
          style={{ opacity: 0, willChange: 'transform' }}
        >
          <h1 className="font-display-alt text-2xl tracking-[0.15em] text-frost sm:text-3xl">
            选择牌阵
          </h1>
          <p className="mt-2 text-sm text-muted">选择一种牌阵，开始你的占卜之旅</p>
        </div>

        {/* 牌阵网格 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spreads.map((spread) => (
            <button
              key={spread.id}
              onClick={(e) => handleSelect(spread.id, e)}
              className={`spread-card glass-panel group relative overflow-hidden p-5 text-left transition-all duration-300 ${
                selectedId === spread.id
                  ? 'border-accent/50 shadow-[0_0_24px_rgba(155,140,255,0.15)]'
                  : 'hover:border-white/15'
              }`}
              style={{ opacity: 0, willChange: 'transform' }}
            >
              {/* Hover glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative mb-3 flex items-center justify-between">
                <h3 className="font-display-alt text-base tracking-wider text-frost">
                  {spread.nameZh}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] tracking-wider ${difficultyColor[spread.difficulty]}`}>
                  {spread.difficulty === 'beginner' ? '入门' : spread.difficulty === 'intermediate' ? '进阶' : '高级'}
                </span>
              </div>
              <p className="relative mb-3 text-xs leading-relaxed text-muted">{spread.description}</p>
              <div className="relative flex items-center gap-2 text-xs text-metal">
                <span>{spread.cardCount}张牌</span>
              </div>

              {/* 位置预览点 */}
              <div className="relative mt-4 h-16 w-full">
                {spread.positions.map((pos) => (
                  <div
                    key={pos.index}
                    className="absolute h-2 w-1.5 rounded-sm bg-accent/30 transition-all duration-300 group-hover:bg-accent/50 group-hover:scale-125"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y * 0.6}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* 问题输入 + 开始按钮 */}
        <div
          className="bottom-section mt-10"
          style={{ opacity: 0, willChange: 'transform' }}
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="输入你的问题..."
            maxLength={200}
            className="input-field w-full"
          />
          <p className="mt-1 text-right text-[10px] text-muted/50">{question.length}/200</p>
          <button
            onClick={handleStart}
            disabled={!selectedId || !question.trim()}
            className="accent-button mt-4 w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            开始占卜
          </button>
        </div>
      </div>
    </div>
  );
}
