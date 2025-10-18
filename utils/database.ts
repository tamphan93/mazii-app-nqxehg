
import { Platform } from 'react-native';
import { Vocab, Kanji, Grammar, Example, Flashcard, Radical, KanjiRadical, ScanHistory, HistoryEntry, Deck } from '@/types/dictionary';
import * as SQLite from 'expo-sqlite';

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
      
      CREATE TABLE IF NOT EXISTS radicals (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        nameVi TEXT NOT NULL,
        strokeCount INTEGER,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS kanji_radical (
        kanjiId TEXT NOT NULL,
        radicalId TEXT NOT NULL,
        PRIMARY KEY (kanjiId, radicalId),
        FOREIGN KEY (kanjiId) REFERENCES cached_kanji(id) ON DELETE CASCADE,
        FOREIGN KEY (radicalId) REFERENCES radicals(id) ON DELETE CASCADE
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
      
      CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        jlptLevel TEXT NOT NULL,
        description TEXT,
        isDefault INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        userId TEXT,
        deckId TEXT,
        type TEXT NOT NULL,
        targetId TEXT NOT NULL,
        dueAt TEXT NOT NULL,
        interval INTEGER NOT NULL,
        ease INTEGER NOT NULL DEFAULT 250,
        repetitions INTEGER NOT NULL DEFAULT 0,
        lastReviewed TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deckId) REFERENCES decks(id) ON DELETE SET NULL
      );
      
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        userId TEXT,
        type TEXT NOT NULL,
        targetId TEXT NOT NULL,
        viewedAt TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS scan_history (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        imageUri TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_vocab_kana ON cached_vocab(kana);
      CREATE INDEX IF NOT EXISTS idx_vocab_kanji ON cached_vocab(kanji);
      CREATE INDEX IF NOT EXISTS idx_kanji_char ON cached_kanji(char);
      CREATE INDEX IF NOT EXISTS idx_kanji_strokeCount ON cached_kanji(strokeCount);
      CREATE INDEX IF NOT EXISTS idx_grammar_pattern ON cached_grammar(pattern);
      CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(dueAt);
      CREATE INDEX IF NOT EXISTS idx_flashcards_type ON flashcards(type);
      CREATE INDEX IF NOT EXISTS idx_flashcards_deckId ON flashcards(deckId);
      CREATE INDEX IF NOT EXISTS idx_flashcards_updatedAt ON flashcards(updatedAt);
      CREATE INDEX IF NOT EXISTS idx_kanji_radical_kanjiId ON kanji_radical(kanjiId);
      CREATE INDEX IF NOT EXISTS idx_kanji_radical_radicalId ON kanji_radical(radicalId);
      CREATE INDEX IF NOT EXISTS idx_scan_history_timestamp ON scan_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_history_type ON history(type);
      CREATE INDEX IF NOT EXISTS idx_history_viewedAt ON history(viewedAt DESC);
      CREATE INDEX IF NOT EXISTS idx_history_updatedAt ON history(updatedAt);
      CREATE INDEX IF NOT EXISTS idx_decks_jlptLevel ON decks(jlptLevel);
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

// Deck operations
export const cacheDeck = async (deck: Deck) => {
  if (Platform.OS === 'web') {
    console.log('Caching not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT OR REPLACE INTO decks (id, name, jlptLevel, description, isDefault, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deck.id, deck.name, deck.jlptLevel, deck.description || null, deck.isDefault ? 1 : 0, new Date().toISOString()]
    );
    console.log('Deck cached:', deck.id);
  } catch (error) {
    console.error('Error caching deck:', error);
  }
};

export const getAllDecks = async (): Promise<Deck[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const results = await database.getAllAsync<any>(
      'SELECT * FROM decks ORDER BY jlptLevel DESC'
    );
    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      jlptLevel: row.jlptLevel,
      description: row.description,
      isDefault: row.isDefault === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    console.error('Error getting all decks:', error);
    return [];
  }
};

export const getDeckById = async (id: string): Promise<Deck | null> => {
  if (Platform.OS === 'web') {
    return null;
  }
  const database = getDatabase();
  try {
    const result = await database.getFirstAsync<any>(
      'SELECT * FROM decks WHERE id = ?',
      [id]
    );
    if (!result) return null;
    return {
      id: result.id,
      name: result.name,
      jlptLevel: result.jlptLevel,
      description: result.description,
      isDefault: result.isDefault === 1,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error) {
    console.error('Error getting deck by id:', error);
    return null;
  }
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

// Radical operations
export const cacheRadical = async (radical: Radical) => {
  if (Platform.OS === 'web') {
    console.log('Caching not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT OR REPLACE INTO radicals (id, symbol, nameVi, strokeCount) 
       VALUES (?, ?, ?, ?)`,
      [radical.id, radical.symbol, radical.nameVi, radical.strokeCount || null]
    );
    console.log('Radical cached:', radical.id);
  } catch (error) {
    console.error('Error caching radical:', error);
  }
};

export const getAllRadicals = async (): Promise<Radical[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const results = await database.getAllAsync<Radical>(
      'SELECT * FROM radicals ORDER BY strokeCount ASC, symbol ASC'
    );
    return results;
  } catch (error) {
    console.error('Error getting all radicals:', error);
    return [];
  }
};

// Kanji-Radical linking operations
export const linkKanjiRadical = async (kanjiId: string, radicalId: string) => {
  if (Platform.OS === 'web') {
    console.log('Linking not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync(
      `INSERT OR IGNORE INTO kanji_radical (kanjiId, radicalId) VALUES (?, ?)`,
      [kanjiId, radicalId]
    );
    console.log('Kanji-Radical linked:', kanjiId, radicalId);
  } catch (error) {
    console.error('Error linking kanji-radical:', error);
  }
};

export const getRadicalsForKanji = async (kanjiId: string): Promise<Radical[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const results = await database.getAllAsync<Radical>(
      `SELECT r.* FROM radicals r
       INNER JOIN kanji_radical kr ON r.id = kr.radicalId
       WHERE kr.kanjiId = ?`,
      [kanjiId]
    );
    return results;
  } catch (error) {
    console.error('Error getting radicals for kanji:', error);
    return [];
  }
};

// Search kanji by radical and stroke count
export const searchKanjiByRadical = async (
  radicalId?: string,
  strokesMin?: number,
  strokesMax?: number
): Promise<Kanji[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    let query = 'SELECT DISTINCT k.* FROM cached_kanji k';
    const params: any[] = [];
    const conditions: string[] = [];

    if (radicalId) {
      query += ' INNER JOIN kanji_radical kr ON k.id = kr.kanjiId';
      conditions.push('kr.radicalId = ?');
      params.push(radicalId);
    }

    if (strokesMin !== undefined && strokesMin > 0) {
      conditions.push('k.strokeCount >= ?');
      params.push(strokesMin);
    }

    if (strokesMax !== undefined && strokesMax > 0) {
      conditions.push('k.strokeCount <= ?');
      params.push(strokesMax);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY k.strokeCount ASC, k.char ASC LIMIT 100';

    const results = await database.getAllAsync<Kanji>(query, params);
    return results;
  } catch (error) {
    console.error('Error searching kanji by radical:', error);
    return [];
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
    const now = new Date().toISOString();
    await database.runAsync(
      `INSERT INTO flashcards (id, userId, deckId, type, targetId, dueAt, interval, ease, repetitions, lastReviewed, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, flashcard.userId || null, flashcard.deckId || null, flashcard.type, flashcard.targetId, flashcard.dueAt, flashcard.interval, flashcard.ease, flashcard.repetitions, flashcard.lastReviewed || null, now]
    );
    console.log('Flashcard added:', id);
    return id;
  } catch (error) {
    console.error('Error adding flashcard:', error);
    throw error;
  }
};

export const getDueFlashcards = async (deckId?: string): Promise<Flashcard[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const now = new Date().toISOString();
    let query = `SELECT * FROM flashcards WHERE dueAt <= ?`;
    const params: any[] = [now];
    
    if (deckId) {
      query += ` AND deckId = ?`;
      params.push(deckId);
    }
    
    query += ` ORDER BY dueAt ASC LIMIT 20`;
    
    const results = await database.getAllAsync<any>(query, params);
    return results.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      deckId: row.deckId,
      type: row.type,
      targetId: row.targetId,
      dueAt: row.dueAt,
      interval: row.interval,
      ease: row.ease,
      repetitions: row.repetitions,
      lastReviewed: row.lastReviewed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
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
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
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

export const getAllFlashcards = async (deckId?: string): Promise<Flashcard[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    let query = 'SELECT * FROM flashcards';
    const params: any[] = [];
    
    if (deckId) {
      query += ' WHERE deckId = ?';
      params.push(deckId);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const results = await database.getAllAsync<any>(query, params);
    return results.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      deckId: row.deckId,
      type: row.type,
      targetId: row.targetId,
      dueAt: row.dueAt,
      interval: row.interval,
      ease: row.ease,
      repetitions: row.repetitions,
      lastReviewed: row.lastReviewed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
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
    const result = await database.getFirstAsync<any>(
      'SELECT * FROM flashcards WHERE targetId = ?',
      [targetId]
    );
    if (!result) return null;
    return {
      id: result.id,
      userId: result.userId,
      deckId: result.deckId,
      type: result.type,
      targetId: result.targetId,
      dueAt: result.dueAt,
      interval: result.interval,
      ease: result.ease,
      repetitions: result.repetitions,
      lastReviewed: result.lastReviewed,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  } catch (error) {
    console.error('Error getting flashcard by target id:', error);
    return null;
  }
};

// History operations
export const addHistory = async (history: Omit<HistoryEntry, 'id' | 'createdAt'>): Promise<string> => {
  if (Platform.OS === 'web') {
    console.log('History not available on web');
    return '';
  }
  const database = getDatabase();
  try {
    const id = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    await database.runAsync(
      `INSERT INTO history (id, userId, type, targetId, viewedAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, history.userId || null, history.type, history.targetId, history.viewedAt, now]
    );
    console.log('History added:', id);
    return id;
  } catch (error) {
    console.error('Error adding history:', error);
    return '';
  }
};

export const getHistory = async (type?: 'vocab' | 'kanji' | 'grammar', limit: number = 50): Promise<HistoryEntry[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    let query = 'SELECT * FROM history';
    const params: any[] = [];
    
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY viewedAt DESC LIMIT ?';
    params.push(limit);
    
    const results = await database.getAllAsync<any>(query, params);
    return results.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      targetId: row.targetId,
      viewedAt: row.viewedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

export const clearHistory = async (type?: 'vocab' | 'kanji' | 'grammar') => {
  if (Platform.OS === 'web') {
    console.log('History not available on web');
    return;
  }
  const database = getDatabase();
  try {
    if (type) {
      await database.runAsync('DELETE FROM history WHERE type = ?', [type]);
    } else {
      await database.runAsync('DELETE FROM history');
    }
    console.log('History cleared');
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};

// Scan History operations
export const saveScanHistory = async (text: string, imageUri?: string): Promise<string> => {
  if (Platform.OS === 'web') {
    console.log('Scan history not available on web');
    throw new Error('Scan history not available on web platform');
  }
  const database = getDatabase();
  try {
    const id = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    await database.runAsync(
      `INSERT INTO scan_history (id, text, timestamp, imageUri) VALUES (?, ?, ?, ?)`,
      [id, text, timestamp, imageUri || null]
    );
    console.log('Scan history saved:', id);
    return id;
  } catch (error) {
    console.error('Error saving scan history:', error);
    throw error;
  }
};

export const getScanHistory = async (limit: number = 50): Promise<ScanHistory[]> => {
  if (Platform.OS === 'web') {
    return [];
  }
  const database = getDatabase();
  try {
    const results = await database.getAllAsync<ScanHistory>(
      `SELECT * FROM scan_history ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
    return results;
  } catch (error) {
    console.error('Error getting scan history:', error);
    return [];
  }
};

export const deleteScanHistory = async (id: string) => {
  if (Platform.OS === 'web') {
    console.log('Scan history not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync('DELETE FROM scan_history WHERE id = ?', [id]);
    console.log('Scan history deleted:', id);
  } catch (error) {
    console.error('Error deleting scan history:', error);
  }
};

export const clearAllScanHistory = async () => {
  if (Platform.OS === 'web') {
    console.log('Scan history not available on web');
    return;
  }
  const database = getDatabase();
  try {
    await database.runAsync('DELETE FROM scan_history');
    console.log('All scan history cleared');
  } catch (error) {
    console.error('Error clearing scan history:', error);
  }
};
