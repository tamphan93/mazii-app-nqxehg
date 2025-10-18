
export interface Vocab {
  id: string;
  kanji?: string;
  kana: string;
  meaningVi: string;
  meaningEn?: string;
  jlpt?: string;
  pos?: string;
  examples?: Example[];
  createdAt?: string;
}

export interface Kanji {
  id: string;
  char: string;
  onyomi?: string;
  kunyomi?: string;
  meaningVi: string;
  meaningEn?: string;
  jlpt?: string;
  radical?: string;
  strokeCount?: number;
  examples?: Example[];
  createdAt?: string;
}

export interface Grammar {
  id: string;
  pattern: string;
  jlpt?: string;
  descVi: string;
  descEn?: string;
  structure?: string;
  examples?: Example[];
  createdAt?: string;
}

export interface Example {
  id: string;
  jp: string;
  vi?: string;
  en?: string;
  vocabId?: string;
  kanjiId?: string;
  grammarId?: string;
}

export interface Flashcard {
  id: string;
  userId?: string;
  type: 'vocab' | 'kanji' | 'grammar';
  targetId: string;
  dueAt: string;
  interval: number;
  ease: number;
  repetitions: number;
  lastReviewed?: string;
  createdAt: string;
}

export type SearchType = 'auto' | 'vocab' | 'kanji' | 'grammar';

export interface SearchResult {
  type: 'vocab' | 'kanji' | 'grammar';
  data: Vocab | Kanji | Grammar;
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface DeconjugationResult {
  original: string;
  base: string;
  conjugationType: string;
  confidence: number;
}

export interface DeconjugationSearchResult {
  vocab: Vocab[];
  kanji: Kanji[];
  grammar: Grammar[];
  usedDeconjugation: boolean;
  deconjugatedForms: string[];
}
