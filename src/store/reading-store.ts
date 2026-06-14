import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReadingCard, Reading, ReadingStatus } from '../types/reading';
import type { Spread } from '../data/spreads';
import { TAROT_CARDS } from '../data/tarot-cards';

const REVERSED_PROBABILITY = 0.35;
const MAX_HISTORY = 50;

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface ReadingStore {
  status: ReadingStatus;
  spread: Spread | null;
  deck: string[];
  drawnCards: ReadingCard[];
  question: string;
  aiResult: string;
  error: string;
  history: Reading[];

  startReading: (spread: Spread, question: string) => void;
  selectCard: (deckIndex: number) => void;
  revealCard: (positionIndex: number) => void;
  setAIResult: (result: string) => void;
  setError: (error: string) => void;
  saveToHistory: () => void;
  clearHistory: () => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as ReadingStatus,
  spread: null as Spread | null,
  deck: [] as string[],
  drawnCards: [] as ReadingCard[],
  question: '',
  aiResult: '',
  error: '',
};

export const useReadingStore = create<ReadingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      history: [],

      startReading: (spread, question) => {
        const allIds = TAROT_CARDS.map((c) => c.id);
        set({
          ...initialState,
          history: get().history,
          status: 'shuffling',
          spread,
          question,
          deck: fisherYatesShuffle(allIds),
          drawnCards: [],
        });
      },

      // 从扇形牌堆中选一张牌，放到下一个牌阵位置
      selectCard: (deckIndex: number) => {
        const { deck, drawnCards, spread } = get();
        if (!spread) return;
        if (drawnCards.length >= spread.cardCount) return;
        if (deckIndex < 0 || deckIndex >= deck.length) return;

        const cardId = deck[deckIndex];
        // 从deck中移除这张牌
        const newDeck = [...deck];
        newDeck.splice(deckIndex, 1);

        // 下一个牌阵位置
        const nextPos = spread.positions[drawnCards.length];
        const newCard: ReadingCard = {
          id: cardId,
          positionIndex: nextPos.index,
          positionName: nextPos.nameZh,
          reversed: Math.random() < REVERSED_PROBABILITY,
          revealed: false,
        };

        const newDrawn = [...drawnCards, newCard];
        const isFull = newDrawn.length >= spread.cardCount;

        set({
          deck: newDeck,
          drawnCards: newDrawn,
          status: isFull ? 'revealing' : 'selecting',
        });
      },

      revealCard: (positionIndex: number) => {
        const { drawnCards, spread } = get();
        if (!spread) return;
        const card = drawnCards.find((c) => c.positionIndex === positionIndex);
        if (!card || card.revealed) return; // already revealed
        const updated = drawnCards.map((c) =>
          c.positionIndex === positionIndex ? { ...c, revealed: true } : c,
        );
        const allRevealed = updated.length === spread.cardCount && updated.every((c) => c.revealed);
        set({
          drawnCards: updated,
          status: allRevealed ? 'interpreting' : 'revealing',
        });
      },

      setAIResult: (result) => set({ aiResult: result, error: '', status: 'complete' }),

      setError: (error) => set({ error, status: 'error' }),

      saveToHistory: () => {
        const { spread, question, drawnCards, aiResult, history } = get();
        if (!spread) return;
        const reading: Reading = {
          id: uid(),
          spread,
          question,
          cards: drawnCards,
          result: aiResult,
          date: new Date().toISOString(),
        };
        set({ history: [reading, ...history].slice(0, MAX_HISTORY) });
      },

      clearHistory: () => set({ history: [] }),

      reset: () => {
        const { history } = get();
        set({ ...initialState, history });
      },
    }),
    {
      name: 'arcana-history',
      partialize: (state) => ({ history: state.history }),
    },
  ),
);
