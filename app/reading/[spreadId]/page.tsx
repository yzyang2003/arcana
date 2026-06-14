'use client';

import { useParams } from 'next/navigation';
import { spreads } from '@/src/data/spreads';
import { useReadingStore } from '@/src/store/reading-store';
import ReadingPhaseRouter from '@/app/components/reading/ReadingPhaseRouter';

export default function SpreadReadingPage() {
  const params = useParams();
  const spreadId = params.spreadId as string;
  const spread = spreads.find((s) => s.id === spreadId);
  const question = useReadingStore((s) => s.question);

  if (!spread) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        牌阵不存在
      </div>
    );
  }

  return <ReadingPhaseRouter spread={spread} question={question} />;
}
