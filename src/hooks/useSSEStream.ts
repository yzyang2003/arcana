'use client';
import { useState, useCallback, useRef } from 'react';
import { readSSEStream } from '@/src/lib/sse';

export function useSSEStream() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (url: string, body: unknown) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setText('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      await readSSEStream(reader, {
        onChunk: (chunk) => setText((prev) => prev + chunk),
        onDone: () => setIsLoading(false),
        onError: (err) => { setError(err.message); setIsLoading(false); },
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
        setIsLoading(false);
      }
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { text, isLoading, error, start, abort, setText };
}
