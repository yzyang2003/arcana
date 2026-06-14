import { describe, it, expect, beforeEach } from 'vitest';
import { useReadingStore } from '../reading-store';
import type { Spread } from '../../data/spreads';

const testSpread: Spread = {
  id: 'test',
  nameZh: '测试',
  nameEn: 'Test',
  description: '测试牌阵',
  cardCount: 3,
  difficulty: 'beginner',
  positions: [
    { index: 0, nameZh: '过去', nameEn: 'Past', description: '', x: 20, y: 50, rotation: 0, zIndex: 0 },
    { index: 1, nameZh: '现在', nameEn: 'Present', description: '', x: 50, y: 50, rotation: 0, zIndex: 0 },
    { index: 2, nameZh: '未来', nameEn: 'Future', description: '', x: 80, y: 50, rotation: 0, zIndex: 0 },
  ],
};

const singleSpread: Spread = {
  id: 'single',
  nameZh: '单牌',
  nameEn: 'Single',
  description: '',
  cardCount: 1,
  difficulty: 'beginner',
  positions: [
    { index: 0, nameZh: '现在', nameEn: 'Present', description: '', x: 50, y: 50, rotation: 0, zIndex: 0 },
  ],
};

describe('reading-store', () => {
  beforeEach(() => {
    useReadingStore.getState().reset();
  });

  it('starts reading with shuffled deck', () => {
    useReadingStore.getState().startReading(testSpread, '测试问题');

    expect(useReadingStore.getState().status).toBe('shuffling');
    expect(useReadingStore.getState().deck.length).toBe(78);
  });

  it('selects cards and transitions to revealing when full', () => {
    useReadingStore.getState().startReading(singleSpread, '测试问题');
    useReadingStore.setState({ status: 'selecting' });
    useReadingStore.getState().selectCard(0);

    expect(useReadingStore.getState().drawnCards.length).toBe(1);
    expect(useReadingStore.getState().status).toBe('revealing');
  });

  it('saves to history', () => {
    const store = useReadingStore.getState();
    store.startReading(testSpread, '测试问题');
    useReadingStore.setState({
      drawnCards: [
        { id: 'card-0', positionIndex: 0, positionName: '过去', reversed: false, revealed: true },
        { id: 'card-1', positionIndex: 1, positionName: '现在', reversed: true, revealed: true },
        { id: 'card-2', positionIndex: 2, positionName: '未来', reversed: false, revealed: true },
      ],
      aiResult: '测试结果',
    });
    useReadingStore.getState().saveToHistory();

    expect(useReadingStore.getState().history.length).toBeGreaterThan(0);
  });
});
