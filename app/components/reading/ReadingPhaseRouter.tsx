'use client';

import { useRef } from 'react';
import { useReadingStore } from '@/src/store/reading-store';
import IdlePreview from './IdlePreview';
import ShufflingView from './ShufflingView';
import SelectingView from './SelectingView';
import RevealingView from './RevealingView';
import ResultView from './ResultView';
import type { Spread } from '@/src/data/spreads';

interface ReadingPhaseRouterProps {
  spread: Spread;
  question: string;
}

export default function ReadingPhaseRouter({ spread, question }: ReadingPhaseRouterProps) {
  const { status, deck, drawnCards, aiResult, error, selectCard, revealCard, startReading } = useReadingStore();

  const initialDeckLen = useRef(0);
  if (status === 'selecting' && initialDeckLen.current === 0 && deck.length > 0) {
    initialDeckLen.current = deck.length;
  }
  if (status === 'idle') {
    initialDeckLen.current = 0;
  }

  const revealedCount = drawnCards.filter((c) => c.revealed).length;

  return (
    <div className="relative h-[100dvh] overflow-hidden px-4 pt-24">
      {status === 'idle' && (
        <IdlePreview spread={spread} onStart={() => startReading(spread, question)} />
      )}

      {status === 'shuffling' && (
        <ShufflingView
          deckLength={deck.length}
          onComplete={() => useReadingStore.setState({ status: 'selecting' })}
        />
      )}

      {status === 'selecting' && (
        <SelectingView
          spread={spread}
          totalCards={initialDeckLen.current}
          selectedCount={drawnCards.length}
          onSelect={selectCard}
        />
      )}

      {status === 'revealing' && (
        <RevealingView
          spread={spread}
          drawnCards={drawnCards}
          status={status}
          revealedCount={revealedCount}
          onReveal={revealCard}
          onInterpret={() => useReadingStore.setState({ status: 'interpreting' })}
        />
      )}

      {(status === 'interpreting' || status === 'complete' || status === 'error') && (
        <ResultView
          spread={spread}
          drawnCards={drawnCards}
          status={status}
          aiResult={aiResult}
          error={error}
          question={question}
        />
      )}
    </div>
  );
}
