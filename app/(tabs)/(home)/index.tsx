
import KanjiFilterSheet from '@/components/KanjiFilterSheet';
import { IconSymbol } from '@/components/IconSymbol';
import { Vocab, Kanji, Grammar, SearchType, Radical } from '@/types/dictionary';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { mockVocabData, mockKanjiData, mockGrammarData, mockRadicalData, mockKanjiRadicalLinks } from '@/utils/mockData';
import { useDeconjugationSearch } from '@/hooks/useDeconjugationSearch';
import { useDatabase } from '@/hooks/useDatabase';
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
import {
  cacheVocab,
  cacheKanji,
  cacheGrammar,
  cacheRadical,
  linkKanjiRadical,
  getAllRadicals,
  searchKanjiByRadical,
} from '@/utils/database';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchType>('auto');
  const [vocabResults, setVocabResults] = useState<Vocab[]>([]);
  const [kanjiResults, setKanjiResults] = useState<Kanji[]>([]);
  const [grammarResults, setGrammarResults] = useState<Grammar[]>([]);
  const [jlptFilter, setJlptFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [selectedRadicalId, setSelectedRadicalId] = useState<string | undefined>();
  const [strokeRange, setStrokeRange] = useState<[number, number]>([0, 30]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { searchWithDeconjugation, isSearching, usedDeconjugation } = useDeconjugationSearch();
  const { isReady } = useDatabase();

  useEffect(() => {
    const initMockData = async () => {
      if (!isReady) {
        return;
      }

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
        for (const radical of mockRadicalData) {
          await cacheRadical(radical);
        }
        for (const link of mockKanjiRadicalLinks) {
          await linkKanjiRadical(link.kanjiId, link.radicalId);
        }

        const loadedRadicals = await getAllRadicals();
        setRadicals(loadedRadicals);

        console.log('Mock data initialized');
      } catch (error) {
        console.error('Error initializing mock data:', error);
      }
    };

    initMockData();
  }, [isReady]);

  useEffect(() => {
    if (params.query && typeof params.query === 'string') {
      setSearchQuery(params.query);
      if (params.fromScan === 'true') {
        setActiveTab('auto');
      }
    }
  }, [params.query, params.fromScan]);

  useEffect(() => {
    if (searchQuery.trim() && isReady) {
      performSearch();
    } else {
      setVocabResults([]);
      setKanjiResults([]);
      setGrammarResults([]);
    }
  }, [searchQuery, isReady]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchWithDeconjugation(searchQuery);
      setVocabResults(results.vocab);
      setKanjiResults(results.kanji);
      setGrammarResults(results.grammar);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, searchWithDeconjugation]);

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
    if (!jlptFilter) {
      return items;
    }
    return items.filter((item) => item.jlpt === jlptFilter);
  };

  const renderVocabItem = (item: Vocab) => (
    <Pressable
      key={item.id}
      style={styles.resultItem}
      onPress={() => router.push(`/vocab/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultMainText}>
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
      <Text style={styles.resultMeaning}>{item.meaningVi}</Text>
      {item.pos && <Text style={styles.resultPos}>{item.pos}</Text>}
    </Pressable>
  );

  const renderKanjiItem = (item: Kanji) => (
    <Pressable
      key={item.id}
      style={styles.resultItem}
      onPress={() => router.push(`/kanji/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.kanjiItemHeader}>
          <Text style={styles.kanjiChar}>{item.char}</Text>
          <View style={styles.kanjiReadings}>
            {item.onyomi && (
              <Text style={styles.kanjiReading}>音: {item.onyomi}</Text>
            )}
            {item.kunyomi && (
              <Text style={styles.kanjiReading}>訓: {item.kunyomi}</Text>
            )}
          </View>
        </View>
        {item.jlpt && (
          <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(item.jlpt) }]}>
            <Text style={styles.jlptText}>{item.jlpt}</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultMeaning}>{item.meaningVi}</Text>
      {item.strokeCount && (
        <Text style={styles.strokeCount}>{item.strokeCount} nét</Text>
      )}
    </Pressable>
  );

  const renderGrammarItem = (item: Grammar) => (
    <Pressable
      key={item.id}
      style={styles.resultItem}
      onPress={() => router.push(`/grammar/${item.id}`)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.grammarPattern}>{highlightText(item.pattern, searchQuery)}</Text>
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
    const colors: { [key: string]: string } = {
      N5: '#4CAF50',
      N4: '#8BC34A',
      N3: '#FFC107',
      N2: '#FF9800',
      N1: '#F44336',
    };
    return colors[jlpt] || '#9E9E9E';
  };

  const getCurrentResults = () => {
    switch (activeTab) {
      case 'vocab':
        return filterByJLPT(vocabResults);
      case 'kanji':
        return filterByJLPT(kanjiResults);
      case 'grammar':
        return filterByJLPT(grammarResults);
      default:
        return [
          ...filterByJLPT(vocabResults),
          ...filterByJLPT(kanjiResults),
          ...filterByJLPT(grammarResults),
        ];
    }
  };

  const renderResults = () => {
    if (isLoading || isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="magnifyingglass" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>
            Enter Japanese text or use the scan button to search
          </Text>
        </View>
      );
    }

    const results = getCurrentResults();

    if (results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No results found</Text>
          {usedDeconjugation && (
            <Text style={styles.deconjugationNote}>
              Tried deconjugation but found no matches
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        {usedDeconjugation && (
          <View style={styles.deconjugationBanner}>
            <IconSymbol name="arrow.triangle.branch" size={16} color={colors.primary} />
            <Text style={styles.deconjugationBannerText}>
              Showing results with deconjugation
            </Text>
          </View>
        )}
        {activeTab === 'auto' || activeTab === 'vocab'
          ? filterByJLPT(vocabResults).map(renderVocabItem)
          : null}
        {activeTab === 'auto' || activeTab === 'kanji'
          ? filterByJLPT(kanjiResults).map(renderKanjiItem)
          : null}
        {activeTab === 'auto' || activeTab === 'grammar'
          ? filterByJLPT(grammarResults).map(renderGrammarItem)
          : null}
      </View>
    );
  };

  const handleRadicalFilter = async () => {
    if (activeTab !== 'kanji') {
      setActiveTab('kanji');
    }

    try {
      const results = await searchKanjiByRadical(
        selectedRadicalId,
        strokeRange[0],
        strokeRange[1]
      );
      setKanjiResults(results);
    } catch (error) {
      console.error('Error filtering kanji:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Japanese..."
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
          <Pressable
            style={styles.scanButton}
            onPress={() => router.push('/scan')}
          >
            <IconSymbol name="camera.fill" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}
          contentContainerStyle={styles.tabContent}
        >
          {(['auto', 'vocab', 'kanji', 'grammar'] as SearchType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'auto' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.jlptFilters}
          >
            <Pressable
              style={[styles.jlptFilterButton, !jlptFilter && styles.jlptFilterButtonActive]}
              onPress={() => setJlptFilter('')}
            >
              <Text
                style={[
                  styles.jlptFilterText,
                  !jlptFilter && styles.jlptFilterTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
              <Pressable
                key={level}
                style={[
                  styles.jlptFilterButton,
                  jlptFilter === level && styles.jlptFilterButtonActive,
                ]}
                onPress={() => setJlptFilter(jlptFilter === level ? '' : level)}
              >
                <Text
                  style={[
                    styles.jlptFilterText,
                    jlptFilter === level && styles.jlptFilterTextActive,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {activeTab === 'kanji' && (
            <Pressable
              style={styles.radicalFilterButton}
              onPress={() => setFilterSheetVisible(true)}
            >
              <IconSymbol name="line.3.horizontal.decrease.circle" size={20} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderResults()}
      </ScrollView>

      <KanjiFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        radicals={radicals}
        selectedRadicalId={selectedRadicalId}
        strokeRange={strokeRange}
        onRadicalSelect={setSelectedRadicalId}
        onStrokeRangeChange={setStrokeRange}
        onApply={() => {
          handleRadicalFilter();
          setFilterSheetVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 15,
    paddingBottom: 10,
    ...commonStyles.shadow,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 10,
  },
  scanButton: {
    marginLeft: 10,
    padding: 5,
  },
  tabContainer: {
    marginBottom: 10,
  },
  tabContent: {
    gap: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  jlptFilters: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
  },
  jlptFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jlptFilterButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  jlptFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  jlptFilterTextActive: {
    color: colors.primary,
  },
  radicalFilterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 20,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  deconjugationNote: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  resultsContainer: {
    gap: 12,
  },
  deconjugationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  deconjugationBannerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  resultItem: {
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 12,
    ...commonStyles.shadow,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultMainText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultKanji: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultKana: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  resultMeaning: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  resultPos: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  jlptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jlptText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  kanjiItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  kanjiChar: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
  },
  kanjiReadings: {
    flex: 1,
  },
  kanjiReading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  strokeCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  grammarPattern: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  highlight: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
