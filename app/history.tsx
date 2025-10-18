
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { HistoryEntry, Vocab, Kanji, Grammar } from '@/types/dictionary';
import { getHistory, clearHistory, getVocabById, getKanjiById, getGrammarById } from '@/utils/database';
import * as Haptics from 'expo-haptics';

type HistoryType = 'all' | 'vocab' | 'kanji' | 'grammar';

interface HistoryItemWithData extends HistoryEntry {
  data?: Vocab | Kanji | Grammar;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItemWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<HistoryType>('all');
  const router = useRouter();

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const type = filterType === 'all' ? undefined : filterType;
      const entries = await getHistory(type, 100);
      
      // Load data for each entry
      const entriesWithData = await Promise.all(
        entries.map(async (entry) => {
          let data;
          if (entry.type === 'vocab') {
            data = await getVocabById(entry.targetId);
          } else if (entry.type === 'kanji') {
            data = await getKanjiById(entry.targetId);
          } else if (entry.type === 'grammar') {
            data = await getGrammarById(entry.targetId);
          }
          return { ...entry, data };
        })
      );
      
      setHistory(entriesWithData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClearHistory = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const type = filterType === 'all' ? undefined : filterType;
    await clearHistory(type);
    await loadHistory();
  };

  const handleItemPress = (item: HistoryItemWithData) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (item.type === 'vocab') {
      router.push(`/vocab/${item.targetId}`);
    } else if (item.type === 'kanji') {
      router.push(`/kanji/${item.targetId}`);
    } else if (item.type === 'grammar') {
      router.push(`/grammar/${item.targetId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vocab': return 'Từ vựng';
      case 'kanji': return 'Kanji';
      case 'grammar': return 'Ngữ pháp';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vocab': return colors.primary;
      case 'kanji': return colors.success;
      case 'grammar': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: HistoryItemWithData }) => {
    if (!item.data) return null;
    
    let title = '';
    let subtitle = '';
    
    if ('kana' in item.data) {
      // Vocab
      title = item.data.kanji || item.data.kana;
      subtitle = item.data.meaningVi;
    } else if ('char' in item.data) {
      // Kanji
      title = item.data.char;
      subtitle = item.data.meaningVi;
    } else if ('pattern' in item.data) {
      // Grammar
      title = item.data.pattern;
      subtitle = item.data.descVi;
    }
    
    return (
      <Pressable
        style={styles.historyItem}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.historyItemLeft}>
          <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeTagText}>{getTypeLabel(item.type)}</Text>
          </View>
          <View style={styles.historyItemContent}>
            <Text style={styles.historyItemTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.historyItemSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.historyItemRight}>
          <Text style={styles.historyItemTime}>{formatDate(item.viewedAt)}</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="clock" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Chưa có lịch sử</Text>
      <Text style={styles.emptyText}>
        Lịch sử xem từ vựng, kanji và ngữ pháp sẽ hiển thị ở đây
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Lịch sử',
          headerRight: () => (
            <Pressable onPress={handleClearHistory} style={styles.headerButton}>
              <IconSymbol name="trash" size={20} color={colors.error} />
            </Pressable>
          ),
        }}
      />
      <View style={[commonStyles.container, styles.container]}>
        <View style={styles.filterContainer}>
          {(['all', 'vocab', 'kanji', 'grammar'] as HistoryType[]).map((type) => (
            <Pressable
              key={type}
              style={[
                styles.filterButton,
                filterType === type && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === type && styles.filterButtonTextActive,
                ]}
              >
                {type === 'all' ? 'Tất cả' : getTypeLabel(type)}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={history.length === 0 ? styles.emptyList : undefined}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.card,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  historyItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyItemTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
