'use client';

import CardBack from '@/app/components/tarot/CardBack';
import type { Spread } from '@/src/data/spreads';

interface IdlePreviewProps {
  spread: Spread;
  onStart: () => void;
}

export default function IdlePreview({ spread, onStart }: IdlePreviewProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="font-display-alt mb-8 text-xl tracking-wider text-frost">{spread.nameZh}</h2>
      <div className="relative mx-auto h-[50vh] w-full max-w-[600px]">
        {spread.positions.map((pos) => (
          <div key={pos.index} className="absolute"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: pos.zIndex }}>
            <CardBack width={120} height={180} animated={false} />
            <p className="mt-1 text-center text-[10px] text-muted">{pos.nameZh}</p>
          </div>
        ))}
      </div>
      <button onClick={onStart} className="accent-button mt-8 px-8 py-3 text-sm">
        开始占卜
      </button>
    </div>
  );
}
