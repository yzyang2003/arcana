'use client';

import dynamic from 'next/dynamic';

const ShuffleDeck = dynamic(() => import('@/app/components/tarot/ShuffleDeck'), { ssr: false });

interface ShufflingViewProps {
  deckLength: number;
  onComplete: () => void;
}

export default function ShufflingView({ deckLength, onComplete }: ShufflingViewProps) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center">
      <p className="mb-6 text-sm text-muted animate-pulse">洗牌中...</p>
      <div className="w-full flex justify-center">
        <ShuffleDeck cardCount={deckLength} onComplete={onComplete} />
      </div>
    </div>
  );
}
