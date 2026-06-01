'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { spreads } from '@/src/data/spreads';
import { getCardById } from '@/src/data/tarot-cards';
import { useReadingStore } from '@/src/store/reading-store';
import CardBack from '@/app/components/tarot/CardBack';
import ShuffleDeck from '@/app/components/tarot/ShuffleDeck';
import TarotCard from '@/app/components/tarot/TarotCard';
import CardFanSelection from '@/app/components/tarot/CardFanSelection';
import { playReveal } from '@/src/lib/sounds';

gsap.registerPlugin(SplitText);

// Dynamic layout calculator — works for any spread, prevents overlap
function useSpreadLayout(positions: { x: number; y: number }[], cardCount: number) {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!containerWidth || positions.length === 0) {
      return { cardWidth: 120, cardHeight: 180, height: 400, cardSize: 'sm' as const };
    }

    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spreadXPct = maxX - minX || 1;
    const spreadYPct = maxY - minY || 1;

    let minDist = Infinity;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) minDist = dist;
      }
    }
    minDist = Math.max(minDist, 8);

    const cardAspect = 2 / 3;
    const maxW = containerWidth - 32;
    const maxH = Math.min(window.innerHeight * 0.55, 520);

    const maxCardWFromSpacing = (minDist / 100) * maxW * 0.85;
    const maxCardHFromSpacing = (minDist / 100) * maxH * 0.85;
    const maxCardWFromV = maxCardHFromSpacing * cardAspect;

    let cardW = Math.min(maxCardWFromSpacing, maxCardWFromV);
    cardW = Math.max(70, Math.min(150, cardW));
    const cardH = cardW / cardAspect;

    const neededH = (spreadYPct / 100) * maxH + cardH + 40;
    const height = Math.min(Math.max(300, neededH), 600);

    const cardSize: 'sm' | 'md' = cardW >= 130 ? 'md' : 'sm';

    return { cardWidth: cardW, cardHeight: cardH, height, cardSize };
  }, [containerWidth, positions, cardCount]);

  return { containerRef, layout };
}

export default function SpreadReadingPage() {
  const params = useParams();
  const router = useRouter();
  const spreadId = params.spreadId as string;
  const spread = spreads.find((s) => s.id === spreadId);

  const { status, deck, drawnCards, aiResult, selectCard, revealCard, setAIResult, saveToHistory, reset } =
    useReadingStore();

  const initialDeckLen = useRef(0);
  if (status === 'selecting' && initialDeckLen.current === 0 && deck.length > 0) {
    initialDeckLen.current = deck.length;
  }
  if (status === 'idle') {
    initialDeckLen.current = 0;
  }

  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const prevStatus = useRef(status);

  const { containerRef: layoutContainerRef, layout } = useSpreadLayout(
    spread?.positions || [],
    spread?.cardCount || 0
  );

  // Card entrance animation — cinematic stagger with sound
  useGSAP(() => {
    if (status === 'revealing' && prevStatus.current === 'selecting') {
      if (containerRef.current) {
        const cards = containerRef.current.querySelectorAll('.spread-card-inner');
        gsap.fromTo(cards,
          { autoAlpha: 0, scale: 0.4, rotateX: -30 },
          {
            autoAlpha: 1, scale: 1, rotateX: 0,
            stagger: { each: 0.15, from: 'center' },
            duration: 0.6, ease: 'back.out(1.5)', delay: 0.2,
            onStart: () => playReveal(),
          }
        );
      }
    }
    prevStatus.current = status;
  }, { dependencies: [status] });

  // AI reading panel entrance — SplitText word reveal
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

  // Auto-fetch AI reading
  const fetchReading = useCallback(async () => {
    if (!spread || streamRef.current) return;
    streamRef.current = true;
    setIsStreaming(true);
    useReadingStore.setState({ status: 'interpreting' });

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
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadType: spread.id, cards, question: useReadingStore.getState().question }),
      });

      if (!res.ok) throw new Error('API error');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) { fullText += delta; setStreamText(fullText); }
              } catch { /* skip */ }
            }
          }
        }
      }
      setAIResult(fullText || '解读生成完成。');
      saveToHistory();
    } catch {
      setAIResult('AI解读暂时不可用，请稍后重试。');
      saveToHistory();
    } finally {
      setIsStreaming(false);
      streamRef.current = false;
    }
  }, [spread, drawnCards, setAIResult, saveToHistory]);

  useEffect(() => {
    if (status === 'interpreting' && !isStreaming) fetchReading();
  }, [status, isStreaming, fetchReading]);

  // Auto-scroll during streaming — smooth
  useEffect(() => {
    if (!textRef.current || !isStreaming) return;
    textRef.current.scrollTo({
      top: textRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [streamText, isStreaming]);

  if (!spread) {
    return <div className="flex min-h-screen items-center justify-center text-muted">牌阵不存在</div>;
  }

  const revealedCount = drawnCards.filter((c) => c.revealed).length;

  return (
    <div className="relative min-h-screen px-4 py-20">
      {/* IDLE — position preview */}
      {status === 'idle' && (
        <div ref={containerRef} className="mx-auto max-w-3xl text-center">
          <h2 className="font-display-alt mb-8 text-xl tracking-wider text-frost">{spread.nameZh}</h2>
          <div className="relative mx-auto h-[50vh] w-full max-w-[600px]">
            {spread.positions.map((pos) => (
              <div key={pos.index} className="absolute"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: pos.zIndex }}>
                <CardBack size="sm" animated={false} />
                <p className="mt-1 text-center text-[10px] text-muted">{pos.nameZh}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHUFFLING */}
      {status === 'shuffling' && (
        <div ref={containerRef} className="flex min-h-[60vh] flex-col items-center justify-center">
          <p className="mb-6 text-sm text-muted animate-pulse">洗牌中...</p>
          <ShuffleDeck cardCount={deck.length} onComplete={() => useReadingStore.setState({ status: 'selecting' })} />
        </div>
      )}

      {/* SELECTING */}
      {status === 'selecting' && (
        <div ref={containerRef} className="mx-auto max-w-5xl">
          <CardFanSelection totalCards={initialDeckLen.current} onSelect={selectCard} />
          <p className="mt-6 text-center text-sm text-muted">
            选择 {spread.cardCount} 张牌 — 已选 {drawnCards.length}/{spread.cardCount}
          </p>
          <p className="mt-2 text-center text-xs text-muted/60">
            当前位置：{spread.positions[drawnCards.length]?.nameZh || '选牌完成'}
          </p>
        </div>
      )}

      {/* REVEALING / INTERPRETING / COMPLETE */}
      {(status === 'revealing' || status === 'interpreting' || status === 'complete') && (
        <div ref={containerRef} className="mx-auto max-w-6xl px-4">
          <p className="mb-4 text-center text-sm text-muted">
            {status === 'revealing' && `点击牌面揭示 (${revealedCount}/${spread.cardCount})`}
            {status === 'interpreting' && '正在解读...'}
            {status === 'complete' && '解读完成'}
          </p>

          {/* Dynamic spread layout */}
          <div
            ref={layoutContainerRef}
            className="relative mx-auto w-full"
            style={{ height: layout.height, maxWidth: '1000px' }}
          >
            {spread.positions.map((pos) => {
              const drawn = drawnCards.find((dc) => dc.positionIndex === pos.index);
              if (!drawn) return null;
              const card = getCardById(drawn.id);
              if (!card) return null;
              return (
                <div
                  key={pos.index}
                  className="absolute"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: pos.zIndex,
                  }}
                >
                  <div className="spread-card-inner">
                    <TarotCard
                      card={card}
                      isRevealed={drawn.revealed}
                      isReversed={drawn.reversed}
                      onClick={() => !drawn.revealed && revealCard(pos.index)}
                      size={layout.cardSize}
                    />
                    <p className="mt-1 text-center text-[10px] text-muted">{drawn.positionName}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI reading — with SplitText heading animation */}
          {(status === 'interpreting' || status === 'complete') && (
            <div ref={panelRef} className="glass-panel mx-auto mt-6 max-w-3xl p-5">
              <p className="reading-heading mb-3 font-display-alt text-sm tracking-wider text-accent-soft/80">
                ✦ AI 解读
              </p>
              <div
                ref={textRef}
                className="max-w-none text-sm leading-relaxed text-frost/90 whitespace-pre-wrap"
                style={{ maxHeight: '35vh', overflowY: 'auto' }}
              >
                {streamText || (status === 'interpreting' && (
                  <span className="inline-flex items-center gap-2 text-muted">
                    <span className="animate-pulse">正在解读中</span>
                    <span className="flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                  </span>
                ))}
              </div>
              {status === 'complete' && (
                <div className="mt-4 flex gap-3">
                  <button onClick={() => { reset(); router.push('/reading'); }} className="glass-button flex-1 py-2 text-sm">重新占卜</button>
                  <button onClick={() => router.push('/history')} className="accent-button flex-1 py-2 text-sm">查看记录</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
