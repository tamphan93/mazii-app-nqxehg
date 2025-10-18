
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useDatabase } from '@/hooks/useDatabase';
import {
  searchCachedVocab,
  searchCachedKanji,
  searchCachedGrammar,
  cacheVocab,
  cacheKanji,
  cacheGrammar,
} from '@/utils/database';
import { Vocab, Kanji, Grammar, SearchType } from '@/types/dictionary';
import { mockVocabData, mockKanjiData, mockGrammarData } from '@/utils/mockData';

export default function SearchScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchType>('vocab');
  const [vocabResults, setVocabResults] = useState<Vocab[]>([]);
  const [kanjiResults, setKanjiResults] = useState<Kanji[]>([]);
  const [grammarResults, setGrammarResults] = useState<Grammar[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedJLPT, setSelectedJLPT] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      loadMockData();
    }
  }, [isReady]);

  const loadMockData = async () => {
    try {
      for (const vocab of mockVocabData) {
        await cacheVocab(vocab);
      }
      for (const kanji of mockKanjiData) {
        await cacheKanji(kanji);
      }
      for (const grammar of mockGrammarData) {
        await cacheGrammar(grammar);
      }
      console.log('Mock data loaded');
    } catch (error) {
      console.error('Error loading mock data:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() && isReady) {
      performSearch();
    } else {
      setVocabResults([]);
      setKanjiResults([]);
      setGrammarResults([]);
    }
  }, [searchQuery, isReady]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const [vocab, kanji, grammar] = await Promise.all([
        searchCachedVocab(searchQuery),
        searchCachedKanji(searchQuery),
        searchCachedGrammar(searchQuery),
      ]);
      setVocabResults(vocab);
      setKanjiResults(kanji);
      setGrammarResults(grammar);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={index} style={styles.highlight}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const filterByJLPT = <T extends { jlpt?: string }>(items: T[]): T[] => {
    if (!selectedJLPT) return items;
    return items.filter((item) => item.jlpt === selectedJLPT);
  };

  const renderVocabItem = (item: Vocab) => (
    <Pressable
      key={item.id}
      style={styles.resultCard}
      onPress={() => router.push(`/vocab/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultMainInfo}>
          {item.kanji && (
            <Text style={styles.resultKanji}>{highlightText(item.kanji, searchQuery)}</Text>
          )}
          <Text style={styles.resultKana}>{highlightText(item.kana, searchQuery)}</Text>
        </View>
        {item.jlpt && (
          <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(item.jlpt) }]}>
            <Text style={styles.jlptText}>{item.jlpt}</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultMeaning}>{highlightText(item.meaningVi, searchQuery)}</Text>
      {item.pos && <Text style={styles.resultPos}>{item.pos}</Text>}
    </Pressable>
  );

  const renderKanjiItem = (item: Kanji) => (
    <Pressable
      key={item.id}
      style={styles.resultCard}
      onPress={() => router.push(`/kanji/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.kanjiChar}>{item.char}</Text>
        {item.jlpt && (
          <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(item.jlpt) }]}>
            <Text style={styles.jlptText}>{item.jlpt}</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultMeaning}>{item.meaningVi}</Text>
      <View style={styles.kanjiReadings}>
        {item.onyomi && (
          <Text style={styles.reading}>
            音: <Text style={styles.readingValue}>{item.onyomi}</Text>
          </Text>
        )}
        {item.kunyomi && (
          <Text style={styles.reading}>
            訓: <Text style={styles.readingValue}>{item.kunyomi}</Text>
          </Text>
        )}
      </View>
    </Pressable>
  );

  const renderGrammarItem = (item: Grammar) => (
    <Pressable
      key={item.id}
      style={styles.resultCard}
      onPress={() => router.push(`/grammar/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.grammarPattern}>{item.pattern}</Text>
        {item.jlpt && (
          <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(item.jlpt) }]}>
            <Text style={styles.jlptText}>{item.jlpt}</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultMeaning}>{item.descVi}</Text>
    </Pressable>
  );

  const getJLPTColor = (jlpt: string) => {
    switch (jlpt) {
      case 'N5':
        return colors.success;
      case 'N4':
        return colors.primary;
      case 'N3':
        return colors.secondary;
      case 'N2':
        return colors.warning;
      case 'N1':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const getCurrentResults = () => {
    switch (activeTab) {
      case 'vocab':
        return filterByJLPT(vocabResults);
      case 'kanji':
        return filterByJLPT(kanjiResults);
      case 'grammar':
        return filterByJLPT(grammarResults);
      default:
        return [];
    }
  };

  const renderResults = () => {
    const results = getCurrentResults();

    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <View style={styles.centerContainer}>
          <IconSymbol name="magnifyingglass" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nhập từ khóa để tìm kiếm</Text>
          <Text style={styles.emptySubtext}>
            Tìm kiếm từ vựng, kanji hoặc ngữ pháp tiếng Nhật
          </Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
          <Text style={styles.emptySubtext}>Thử tìm kiếm với từ khóa khác</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'vocab' && results.map((item) => renderVocabItem(item as Vocab))}
        {activeTab === 'kanji' && results.map((item) => renderKanjiItem(item as Kanji))}
        {activeTab === 'grammar' && results.map((item) => renderGrammarItem(item as Grammar))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Mazii Dictionary',
            headerLargeTitle: true,
          }}
        />
      )}
      <View style={[commonStyles.container, styles.container]}>
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm từ vựng, kanji, ngữ pháp..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabContainer}
          >
            <Pressable
              style={[styles.tab, activeTab === 'vocab' && styles.activeTab]}
              onPress={() => setActiveTab('vocab')}
            >
              <Text style={[styles.tabText, activeTab === 'vocab' && styles.activeTabText]}>
                Từ vựng ({vocabResults.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'kanji' && styles.activeTab]}
              onPress={() => setActiveTab('kanji')}
            >
              <Text style={[styles.tabText, activeTab === 'kanji' && styles.activeTabText]}>
                Kanji ({kanjiResults.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'grammar' && styles.activeTab]}
              onPress={() => setActiveTab('grammar')}
            >
              <Text style={[styles.tabText, activeTab === 'grammar' && styles.activeTabText]}>
                Ngữ pháp ({grammarResults.length})
              </Text>
            </Pressable>
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.jlptFilterContainer}
          >
            <Pressable
              style={[styles.jlptFilter, !selectedJLPT && styles.jlptFilterActive]}
              onPress={() => setSelectedJLPT(null)}
            >
              <Text
                style={[styles.jlptFilterText, !selectedJLPT && styles.jlptFilterTextActive]}
              >
                Tất cả
              </Text>
            </Pressable>
            {jlptLevels.map((level) => (
              <Pressable
                key={level}
                style={[styles.jlptFilter, selectedJLPT === level && styles.jlptFilterActive]}
                onPress={() => setSelectedJLPT(level)}
              >
                <Text
                  style={[
                    styles.jlptFilterText,
                    selectedJLPT === level && styles.jlptFilterTextActive,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {renderResults()}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  searchSection: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.background,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activeTabText: {
    color: colors.card,
  },
  jlptFilterContainer: {
    flexDirection: 'row',
  },
  jlptFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  jlptFilterActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  jlptFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  jlptFilterTextActive: {
    color: colors.card,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultMainInfo: {
    flex: 1,
  },
  resultKanji: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  resultKana: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultMeaning: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  resultPos: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  jlptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jlptText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.card,
  },
  kanjiChar: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
  },
  kanjiReadings: {
    marginTop: 8,
  },
  reading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  readingValue: {
    color: colors.text,
    fontWeight: '600',
  },
  grammarPattern: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  highlight: {
    backgroundColor: colors.highlight,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 20 : 100,
  },
});
