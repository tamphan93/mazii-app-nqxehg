
import { mockVocabData, mockKanjiData, mockGrammarData, mockRadicalData, mockKanjiRadicalLinks } from '@/utils/mockData';
import { IconSymbol } from '@/components/IconSymbol';
import {
  cacheVocab,
  cacheKanji,
  cacheGrammar,
  cacheRadical,
  linkKanjiRadical,
  getAllRadicals,
  searchKanjiByRadical,
} from '@/utils/database';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Stack, useRouter } from 'expo-router';
import { useDeconjugationSearch } from '@/hooks/useDeconjugationSearch';
import { useDatabase } from '@/hooks/useDatabase';
import KanjiFilterSheet from '@/components/KanjiFilterSheet';
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
import React, { useState, useEffect, useCallback } from 'react';
import { Vocab, Kanji, Grammar, SearchType, Radical } from '@/types/dictionary';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
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
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 6,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  jlptContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  jlptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jlptButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  jlptButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  jlptButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultMain: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  resultReading: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  resultMeaning: {
    fontSize: 15,
    color: colors.text,
  },
  jlptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jlptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  highlight: {
    backgroundColor: colors.primary + '30',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deconjugationBadge: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  kanjiStrokeCount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default function SearchScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const { search: deconjugationSearch } = useDeconjugationSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchType>('auto');
  const [selectedJLPT, setSelectedJLPT] = useState<string>('all');
  const [vocabResults, setVocabResults] = useState<Vocab[]>([]);
  const [kanjiResults, setKanjiResults] = useState<Kanji[]>([]);
  const [grammarResults, setGrammarResults] = useState<Grammar[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usedDeconjugation, setUsedDeconjugation] = useState(false);

  // Kanji filter states
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [selectedRadicalId, setSelectedRadicalId] = useState<string | undefined>();
  const [strokeRange, setStrokeRange] = useState<[number, number]>([1, 30]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadMockData();
      loadRadicals();
    }
  }, [isReady]);

  const loadMockData = useCallback(async () => {
    try {
      // Cache vocab
      for (const vocab of mockVocabData) {
        await cacheVocab(vocab);
      }
      
      // Cache kanji
      for (const kanji of mockKanjiData) {
        await cacheKanji(kanji);
      }
      
      // Cache grammar
      for (const grammar of mockGrammarData) {
        await cacheGrammar(grammar);
      }

      // Cache radicals
      for (const radical of mockRadicalData) {
        await cacheRadical(radical);
      }

      // Link kanji and radicals
      for (const link of mockKanjiRadicalLinks) {
        await linkKanjiRadical(link.kanjiId, link.radicalId);
      }

      console.log('Mock data loaded successfully');
    } catch (error) {
      console.error('Error loading mock data:', error);
    }
  }, []);

  const loadRadicals = useCallback(async () => {
    try {
      const allRadicals = await getAllRadicals();
      setRadicals(allRadicals);
    } catch (error) {
      console.error('Error loading radicals:', error);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      performSearch();
    }
  }, [searchQuery, isReady]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setVocabResults([]);
      setKanjiResults([]);
      setGrammarResults([]);
      setUsedDeconjugation(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await deconjugationSearch(searchQuery);
      setVocabResults(result.vocab);
      setKanjiResults(result.kanji);
      setGrammarResults(result.grammar);
      setUsedDeconjugation(result.usedDeconjugation);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, deconjugationSearch]);

  const applyKanjiFilters = useCallback(async () => {
    setIsSearching(true);
    try {
      const filteredKanji = await searchKanjiByRadical(
        selectedRadicalId,
        strokeRange[0],
        strokeRange[1]
      );
      setKanjiResults(filteredKanji);
      setShowFilterSheet(false);
      
      // Update active filters indicator
      const hasFilters = selectedRadicalId !== undefined || 
                        strokeRange[0] !== 1 || 
                        strokeRange[1] !== 30;
      setHasActiveFilters(hasFilters);
    } catch (error) {
      console.error('Error applying kanji filters:', error);
    } finally {
      setIsSearching(false);
    }
  }, [selectedRadicalId, strokeRange]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) {
      return <Text>{text}</Text>;
    }

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <Text>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={index} style={styles.highlight}>
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const filterByJLPT = <T extends { jlpt?: string }>(items: T[]): T[] => {
    if (selectedJLPT === 'all') {
      return items;
    }
    return items.filter((item) => item.jlpt === selectedJLPT);
  };

  const renderVocabItem = (item: Vocab) => (
    <Pressable
      key={item.id}
      style={styles.resultItem}
      onPress={() => router.push(`/vocab/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultMain}>
            {item.kanji || item.kana}
            {usedDeconjugation && (
              <Text style={styles.deconjugationBadge}> (đã khử chia)</Text>
            )}
          </Text>
          {item.kanji && (
            <Text style={styles.resultReading}>{highlightText(item.kana, searchQuery)}</Text>
          )}
        </View>
        {item.jlpt && (
          <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(item.jlpt) }]}>
            <Text style={styles.jlptText}>{item.jlpt}</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultMeaning}>{item.meaningVi}</Text>
    </Pressable>
  );

  const renderKanjiItem = (item: Kanji) => (
    <Pressable
      key={item.id}
      style={styles.resultItem}
      onPress={() => router.push(`/kanji/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultMain}>{item.char}</Text>
          <Text style={styles.resultReading}>
            音: {item.onyomi || 'なし'} / 訓: {item.kunyomi || 'なし'}
          </Text>
          {item.strokeCount && (
            <Text style={styles.kanjiStrokeCount}>
              Số nét: {item.strokeCount} | Bộ thủ: {item.radical || 'N/A'}
            </Text>
          )}
        </View>
        {item.jlpt && (
          <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(item.jlpt) }]}>
            <Text style={styles.jlptText}>{item.jlpt}</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultMeaning}>{item.meaningVi}</Text>
    </Pressable>
  );

  const renderGrammarItem = (item: Grammar) => (
    <Pressable
      key={item.id}
      style={styles.resultItem}
      onPress={() => router.push(`/grammar/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultMain}>{highlightText(item.pattern, searchQuery)}</Text>
        </View>
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
        return '#4CAF50';
      case 'N4':
        return '#8BC34A';
      case 'N3':
        return '#FFC107';
      case 'N2':
        return '#FF9800';
      case 'N1':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  const getCurrentResults = () => {
    switch (activeTab) {
      case 'vocab':
        return filterByJLPT(vocabResults);
      case 'kanji':
        return filterByJLPT(kanjiResults);
      case 'grammar':
        return filterByJLPT(grammarResults);
      case 'auto':
      default:
        return [
          ...filterByJLPT(vocabResults),
          ...filterByJLPT(kanjiResults),
          ...filterByJLPT(grammarResults),
        ];
    }
  };

  const renderResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    const results = getCurrentResults();

    if (results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="magnifyingglass" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery.trim() || hasActiveFilters
              ? 'Không tìm thấy kết quả'
              : 'Nhập từ khóa để tìm kiếm'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'auto' || activeTab === 'vocab'
          ? filterByJLPT(vocabResults).map(renderVocabItem)
          : null}
        {activeTab === 'auto' || activeTab === 'kanji'
          ? filterByJLPT(kanjiResults).map(renderKanjiItem)
          : null}
        {activeTab === 'auto' || activeTab === 'grammar'
          ? filterByJLPT(grammarResults).map(renderGrammarItem)
          : null}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Tìm kiếm',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm từ, kanji, ngữ pháp..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Tab Selection */}
      <ScrollView
        horizontal
        style={styles.tabContainer}
        showsHorizontalScrollIndicator={false}
      >
        {(['auto', 'vocab', 'kanji', 'grammar'] as SearchType[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'auto'
                ? 'Tất cả'
                : tab === 'vocab'
                ? 'Từ vựng'
                : tab === 'kanji'
                ? 'Kanji'
                : 'Ngữ pháp'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Kanji Filter Button */}
      {activeTab === 'kanji' && (
        <View style={styles.filterContainer}>
          <Pressable
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setShowFilterSheet(true)}
          >
            <IconSymbol
              name="line.3.horizontal.decrease.circle"
              size={18}
              color={hasActiveFilters ? colors.primary : colors.text}
            />
            <Text
              style={[
                styles.filterButtonText,
                hasActiveFilters && styles.filterButtonTextActive,
              ]}
            >
              Lọc theo bộ thủ / số nét
            </Text>
          </Pressable>
        </View>
      )}

      {/* JLPT Filter */}
      <ScrollView
        horizontal
        style={styles.jlptContainer}
        showsHorizontalScrollIndicator={false}
      >
        {['all', 'N5', 'N4', 'N3', 'N2', 'N1'].map((jlpt) => (
          <Pressable
            key={jlpt}
            style={[styles.jlptButton, selectedJLPT === jlpt && styles.jlptButtonActive]}
            onPress={() => setSelectedJLPT(jlpt)}
          >
            <Text
              style={[
                styles.jlptButtonText,
                selectedJLPT === jlpt && styles.jlptButtonTextActive,
              ]}
            >
              {jlpt === 'all' ? 'Tất cả' : jlpt}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results */}
      {renderResults()}

      {/* Kanji Filter Sheet */}
      <KanjiFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        radicals={radicals}
        selectedRadicalId={selectedRadicalId}
        strokeRange={strokeRange}
        onRadicalSelect={setSelectedRadicalId}
        onStrokeRangeChange={setStrokeRange}
        onApply={applyKanjiFilters}
      />
    </View>
  );
}
