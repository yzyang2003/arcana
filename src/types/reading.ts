// 占卜相关类型定义

import type { Spread } from '../data/spreads';

export interface ReadingCard {
  id: string;
  positionIndex: number;
  positionName: string;
  reversed: boolean;
  revealed: boolean;
}

export type AIReadingCard = {
  cardId: string;
  positionName: string;
  isReversed: boolean;
  cardNameZh: string;
  cardNameEn?: string;
};

export interface Reading {
  id: string;
  spread: Spread;
  question: string;
  cards: ReadingCard[];
  result: string;
  date: string;
}

export type ReadingStatus =
  | 'idle'
  | 'shuffling'
  | 'selecting'
  | 'revealing'
  | 'interpreting'
  | 'complete'
  | 'error';
