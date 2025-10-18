
import { Platform } from 'react-native';
import { Vocab, Kanji, Grammar, Example, Flashcard } from '@/types/dictionary';

// Conditionally import SQLite only on native platforms
let SQLite: any = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

let db: any = null;

export const initDatabase = async () => {
  // Skip SQLite initialization on web
  if (Platform.OS === 'web') {
    console.log('SQLite not supported on web - using in-memory storage');
    return null;
  }
  
  try {
    db = await SQLite.openDatabaseAsync('mazii.db');
    
    // Create tables
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS cached_vocab (
        id TEXT PRIMARY KEY,
        kanji TEXT,
        kana TEXT NOT NULL,
        meaningVi TEXT NOT NULL,
        meaningEn TEXT,
        jlpt TEXT,
        pos TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS cached_kanji (
        id TEXT PRIMARY KEY,
        char TEXT UNIQUE NOT NULL,
        onyomi TEXT,
        kunyomi TEXT,
        meaningVi TEXT NOT NULL,
        meaningEn TEXT,
        jlpt TEXT,
        radical TEXT,
        strokeCount INTEGER,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS cached_grammar (
        id TEXT PRIMARY KEY,
        pattern TEXT UNIQUE NOT NULL,
        jlpt TEXT,
        descVi TEXT NOT NULL,
        descEn TEXT,
        structure TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS cached_examples (
        id TEXT PRIMARY KEY,
        jp TEXT NOT NULL,
        vi TEXT,
        en TEXT,
        vocabId TEXT,
        kanjiId TEXT,
        grammarId TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        userId TEXT,
        type TEXT NOT NULL,
        targetId TEXT NOT NULL,
        dueAt TEXT NOT NULL,
        interval INTEGER NOT NULL,
        ease INTEGER NOT NULL DEFAULT 250,
        repetitions INTEGER NOT NULL DEFAULT 0,
        lastReviewed TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_vocab_kana ON cached_vocab(kana);
      CREATE INDEX IF NOT EXISTS idx_vocab_kanji ON cached_vocab(kanji);
      CREATE INDEX IF NOT EXISTS idx_kanji_char ON cached_kanji(char);
      CREATE INDEX IF NOT EXISTS idx_grammar_pattern ON cached_grammar(pattern);
      CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(dueAt);
      CREATE INDEX IF NOT EXISTS idx_flashcards_type ON flashcards(type);
    `);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

// Vocab operations
export const cacheVocab = async (vocab: Vocab) => {
  if (Platform.OS === 'web') {
    console.log('Caching not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_vocab (id, kanji, kana, meaningVi, meaningEn, jlpt, pos) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vocab.id, vocab.kanji || null, vocab.kana, vocab.meaningVi, vocab.meaningEn || null, vocab.jlpt || null, vocab.pos || null]
    );
    console.log('Vocab cached:', vocab.id);
  } catch (error) {
    console.error('Error caching vocab:', error);
  }
};

export const searchCachedVocab = async (query: string): Promise<Vocab[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const results = await database.getAllAsync<Vocab>(
      `SELECT * FROM cached_vocab 
       WHERE kana LIKE ? OR kanji LIKE ? OR meaningVi LIKE ?
       LIMIT 50`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return results;
  } catch (error) {
    console.error('Error searching cached vocab:', error);
    return [];
  }
};

export const getVocabById = async (id: string): Promise<Vocab | null> => {
  if (Platform.OS === 'web') {
    return null;
  }
  const database = getDatabase();
  try {
    const result = await database.getFirstAsync<Vocab>(
      'SELECT * FROM cached_vocab WHERE id = ?',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error('Error getting vocab by id:', error);
    return null;
  }
};

// Kanji operations
export const cacheKanji = async (kanji: Kanji) => {
  if (Platform.OS === 'web') {
    console.log('Caching not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_kanji (id, char, onyomi, kunyomi, meaningVi, meaningEn, jlpt, radical, strokeCount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kanji.id, kanji.char, kanji.onyomi || null, kanji.kunyomi || null, kanji.meaningVi, kanji.meaningEn || null, kanji.jlpt || null, kanji.radical || null, kanji.strokeCount || null]
    );
    console.log('Kanji cached:', kanji.id);
  } catch (error) {
    console.error('Error caching kanji:', error);
  }
};

export const searchCachedKanji = async (query: string): Promise<Kanji[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const results = await database.getAllAsync<Kanji>(
      `SELECT * FROM cached_kanji 
       WHERE char LIKE ? OR meaningVi LIKE ?
       LIMIT 50`,
      [`%${query}%`, `%${query}%`]
    );
    return results;
  } catch (error) {
    console.error('Error searching cached kanji:', error);
    return [];
  }
};

export const getKanjiById = async (id: string): Promise<Kanji | null> => {
  if (Platform.OS === 'web') {
    return null;
  }
  const database = getDatabase();
  try {
    const result = await database.getFirstAsync<Kanji>(
      'SELECT * FROM cached_kanji WHERE id = ?',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error('Error getting kanji by id:', error);
    return null;
  }
};

// Grammar operations
export const cacheGrammar = async (grammar: Grammar) => {
  if (Platform.OS === 'web') {
    console.log('Caching not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_grammar (id, pattern, jlpt, descVi, descEn, structure) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [grammar.id, grammar.pattern, grammar.jlpt || null, grammar.descVi, grammar.descEn || null, grammar.structure || null]
    );
    console.log('Grammar cached:', grammar.id);
  } catch (error) {
    console.error('Error caching grammar:', error);
  }
};

export const searchCachedGrammar = async (query: string): Promise<Grammar[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const results = await database.getAllAsync<Grammar>(
      `SELECT * FROM cached_grammar 
       WHERE pattern LIKE ? OR descVi LIKE ?
       LIMIT 50`,
      [`%${query}%`, `%${query}%`]
    );
    return results;
  } catch (error) {
    console.error('Error searching cached grammar:', error);
    return [];
  }
};

export const getGrammarById = async (id: string): Promise<Grammar | null> => {
  if (Platform.OS === 'web') {
    return null;
  }
  const database = getDatabase();
  try {
    const result = await database.getFirstAsync<Grammar>(
      'SELECT * FROM cached_grammar WHERE id = ?',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error('Error getting grammar by id:', error);
    return null;
  }
};

// Example operations
export const cacheExample = async (example: Example) => {
  if (Platform.OS === 'web') {
    console.log('Caching not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_examples (id, jp, vi, en, vocabId, kanjiId, grammarId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [example.id, example.jp, example.vi || null, example.en || null, example.vocabId || null, example.kanjiId || null, example.grammarId || null]
    );
  } catch (error) {
    console.error('Error caching example:', error);
  }
};

export const getExamplesForItem = async (itemId: string, type: 'vocab' | 'kanji' | 'grammar'): Promise<Example[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const column = type === 'vocab' ? 'vocabId' : type === 'kanji' ? 'kanjiId' : 'grammarId';
    const results = await database.getAllAsync<Example>(
      `SELECT * FROM cached_examples WHERE ${column} = ? LIMIT 10`,
      [itemId]
    );
    return results;
  } catch (error) {
    console.error('Error getting examples:', error);
    return [];
  }
};

// Flashcard operations
export const addFlashcard = async (flashcard: Omit<Flashcard, 'id' | 'createdAt'>): Promise<string> => {
  if (Platform.OS === 'web') {
    console.log('Flashcards not available on web');
    throw new Error('Flashcards not available on web platform');
  }
  const database = getDatabase();
  try {
    const id = `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await database.runAsync(
      `INSERT INTO flashcards (id, userId, type, targetId, dueAt, interval, ease, repetitions, lastReviewed) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, flashcard.userId || null, flashcard.type, flashcard.targetId, flashcard.dueAt, flashcard.interval, flashcard.ease, flashcard.repetitions, flashcard.lastReviewed || null]
    );
    console.log('Flashcard added:', id);
    return id;
  } catch (error) {
    console.error('Error adding flashcard:', error);
    throw error;
  }
};

export const getDueFlashcards = async (): Promise<Flashcard[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const now = new Date().toISOString();
    const results = await database.getAllAsync<Flashcard>(
      `SELECT * FROM flashcards WHERE dueAt <= ? ORDER BY dueAt ASC LIMIT 20`,
      [now]
    );
    return results;
  } catch (error) {
    console.error('Error getting due flashcards:', error);
    return [];
  }
};

export const updateFlashcard = async (id: string, updates: Partial<Flashcard>) => {
  if (Platform.OS === 'web') {
    console.log('Flashcards not available on web');
    return;
  }
  const database = getDatabase();
  try {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    await database.runAsync(
      `UPDATE flashcards SET ${fields} WHERE id = ?`,
      values
    );
    console.log('Flashcard updated:', id);
  } catch (error) {
    console.error('Error updating flashcard:', error);
  }
};

export const deleteFlashcard = async (id: string) => {
  if (Platform.OS === 'web') {
    console.log('Flashcards not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync('DELETE FROM flashcards WHERE id = ?', [id]);
    console.log('Flashcard deleted:', id);
  } catch (error) {
    console.error('Error deleting flashcard:', error);
  }
};

export const getAllFlashcards = async (): Promise<Flashcard[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const results = await database.getAllAsync<Flashcard>(
      'SELECT * FROM flashcards ORDER BY createdAt DESC'
    );
    return results;
  } catch (error) {
    console.error('Error getting all flashcards:', error);
    return [];
  }
};

export const getFlashcardByTargetId = async (targetId: string): Promise<Flashcard | null> => {
  if (Platform.OS === 'web') {
    return null;
  }
  const database = getDatabase();
  try {
    const result = await database.getFirstAsync<Flashcard>(
      'SELECT * FROM flashcards WHERE targetId = ?',
      [targetId]
    );
    return result || null;
  } catch (error) {
    console.error('Error getting flashcard by target id:', error);
    return null;
  }
};
