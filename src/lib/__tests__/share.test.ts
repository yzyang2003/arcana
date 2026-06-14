import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shareResult } from '../share';

describe('shareResult', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses navigator.share when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true });

    const result = await shareResult({ title: 'Test', text: 'Hello' });
    expect(result).toBe(true);
    expect(mockShare).toHaveBeenCalledWith({ title: 'Test', text: 'Hello' });
  });

  it('falls back to clipboard when share unavailable', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    });

    const result = await shareResult({ title: 'Test', text: 'Hello', url: 'https://example.com' });
    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('Test\nHello\nhttps://example.com');
  });

  it('returns false when both share and clipboard fail', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });

    const result = await shareResult({ title: 'Test', text: 'Hello' });
    expect(result).toBe(false);
  });
});
