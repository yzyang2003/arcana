'use client';

import CardFanSelection from '@/app/components/tarot/CardFanSelection';
import type { Spread } from '@/src/data/spreads';

interface SelectingViewProps {
  spread: Spread;
  totalCards: number;
  selectedCount: number;
  onSelect: (deckIndex: number) => void;
}

export default function SelectingView({ spread, totalCards, selectedCount, onSelect }: SelectingViewProps) {
  return (
    <div className="mx-auto max-w-5xl flex flex-col justify-center pt-[72px]" style={{ height: 'calc(100dvh - 96px)' }}>
      <CardFanSelection totalCards={totalCards} onSelect={onSelect} />
      <p className="mt-6 text-center text-sm text-muted">
        选择 {spread.cardCount} 张牌 — 已选 {selectedCount}/{spread.cardCount}
      </p>
      <p className="mt-2 text-center text-xs text-muted/60">
        当前位置：{spread.positions[selectedCount]?.nameZh || '选牌完成'}
      </p>
    </div>
  );
}
