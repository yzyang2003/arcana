import { describe, it, expect } from 'vitest';
import { readSSEStream } from '../sse';

function createMockReader(chunks: string[]) {
  let i = 0;
  return {
    read() {
      if (i >= chunks.length) return Promise.resolve({ done: true, value: undefined });
      const chunk = new TextEncoder().encode(chunks[i++]);
      return Promise.resolve({ done: false, value: chunk });
    },
  } as ReadableStreamDefaultReader<Uint8Array>;
}

describe('readSSEStream', () => {
  it('parses SSE chunks correctly', async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: {"choices":[{"delta":{"content":" World"}}]}\n\ndata: [DONE]\n',
    ];
    const results: string[] = [];
    let done = false;

    await readSSEStream(createMockReader(chunks), {
      onChunk: (text) => results.push(text),
      onDone: () => {
        done = true;
      },
      onError: () => {},
    });

    expect(results).toEqual(['Hello', ' World']);
    expect(done).toBe(true);
  });

  it('handles empty stream', async () => {
    const results: string[] = [];
    let done = false;

    await readSSEStream(createMockReader([]), {
      onChunk: (text) => results.push(text),
      onDone: () => {
        done = true;
      },
      onError: () => {},
    });

    expect(results).toEqual([]);
    expect(done).toBe(true);
  });
});
