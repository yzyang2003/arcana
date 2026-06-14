'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { readSSEStream } from '@/src/lib/sse';
import { useReadingStore } from '@/src/store/reading-store';
import { getCardById } from '@/src/data/tarot-cards';
import { shareResult } from '@/src/lib/share';
import dynamic from 'next/dynamic';

const CelebrationParticles = dynamic(() => import('@/app/components/effects/CelebrationParticles'), { ssr: false });
import type { Spread } from '@/src/data/spreads';
import type { ReadingCard } from '@/src/types/reading';

gsap.registerPlugin(SplitText);

interface ResultViewProps {
  spread: Spread;
  drawnCards: ReadingCard[];
  status: string;
  aiResult: string;
  error: string;
  question: string;
}

export default function ResultView({ spread, drawnCards, status, aiResult, error, question }: ResultViewProps) {
  const router = useRouter();
  const { setAIResult, setError, saveToHistory, reset } = useReadingStore();

  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const streamRef = useRef(false);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if ((status === 'interpreting' || status === 'complete') && panelRef.current) {
      const heading = panelRef.current.querySelector('.reading-heading');
      if (heading) {
        const split = SplitText.create(heading, { type: 'chars' });
        gsap.from(split.chars, {
          autoAlpha: 0, y: 10,
          stagger: 0.02,
          duration: 0.3,
          ease: 'power2.out',
        });
        return () => split.revert();
      }
    }
  }, { dependencies: [status] });

  const fetchReading = useCallback(async () => {
    if (!spread || streamRef.current) return;
    streamRef.current = true;
    setIsStreaming(true);

    const cards = drawnCards.map((dc) => {
      const card = getCardById(dc.id);
      return {
        cardId: dc.id,
        positionName: dc.positionName,
        isReversed: dc.reversed,
        cardNameZh: card?.nameZh || dc.id,
      };
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadType: spread.id, cards, question }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('API error');
      const reader = res.body?.getReader();
      let fullText = '';
      if (reader) {
        await readSSEStream(reader, {
          onChunk: (text) => {
            fullText += text;
            setStreamText(fullText);
          },
          onDone: () => {},
          onError: (err) => { throw err; }
        });
      }
      setAIResult(fullText || '解读生成完成。');
      saveToHistory();
      setCelebrating(true);
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = setTimeout(() => setCelebrating(false), 3500);
    } catch {
      setError('AI解读暂时不可用，请稍后重试。');
      useReadingStore.setState({ aiResult: 'AI解读暂时不可用，请稍后重试。' });
      saveToHistory();
    } finally {
      setIsStreaming(false);
      streamRef.current = false;
    }
  }, [spread, drawnCards, question, setAIResult, saveToHistory, setError]);

  useEffect(() => {
    if (status === 'interpreting' && !isStreaming) fetchReading();
  }, [status, isStreaming, fetchReading]);

  useEffect(() => {
    if (!textRef.current || !isStreaming) return;
    textRef.current.scrollTo({
      top: textRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [streamText, isStreaming]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  const handleShare = async () => {
    const text = streamText || aiResult;
    if (!text) return;
    const cardNames = drawnCards.map((dc) => {
      const card = getCardById(dc.id);
      return dc.reversed ? `${card?.nameZh || dc.id}(逆位)` : card?.nameZh || dc.id;
    }).join('、');
    const title = `Arcana 塔罗解读 — ${spread.nameZh}`;
    const body = `${cardNames}\n\n${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`;
    const ok = await shareResult({ title, text: body, url: window.location.origin });
    setShareStatus(ok ? 'shared' : 'copied');
    setTimeout(() => setShareStatus('idle'), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4">
      <CelebrationParticles active={celebrating} />
      <p className="mb-4 text-center text-sm text-muted">
        {status === 'interpreting' && '正在解读...'}
        {status === 'complete' && '解读完成'}
      </p>

      <div ref={panelRef} className="glass-panel-glow glass-dispersion mx-auto mt-6 max-w-3xl p-5">
        <p className="reading-heading mb-3 font-display-alt text-sm tracking-wider text-accent-soft/80">
          ✦ AI 解读
        </p>
        {status === 'error' ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-400 mb-3">{error || 'AI解读暂时不可用'}</p>
            <button
              onClick={() => { setError(''); useReadingStore.setState({ status: 'interpreting' as const }); }}
              className="glass-button px-4 py-2 text-sm"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            <div
              ref={textRef}
              className="max-w-none text-sm leading-relaxed text-frost/90"
              style={{ maxHeight: '35vh', overflowY: 'auto' }}
            >
              {streamText ? (
                <>
                  {streamText.split('\n').map((line, i) => (
                    <div key={i} className="typewriter-line">
                      {line || '\u00A0'}
                    </div>
                  ))}
                  {isStreaming && <span className="streaming-cursor" />}
                </>
              ) : (
                status === 'interpreting' && (
                  <span className="inline-flex items-center gap-2 text-muted">
                    <span className="animate-pulse">正在解读中</span>
                    <span className="flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                  </span>
                )
              )}
            </div>
            {status === 'complete' && (
              <div className="mt-4 flex gap-3">
                <button onClick={() => { reset(); router.push('/reading'); }} className="glass-button flex-1 py-2 text-sm">重新占卜</button>
                <button onClick={handleShare} className="glass-button flex-1 py-2 text-sm">
                  {shareStatus === 'shared' ? '已分享' : shareStatus === 'copied' ? '已复制' : '分享解读'}
                </button>
                <button onClick={() => router.push('/history')} className="accent-button flex-1 py-2 text-sm">查看记录</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
