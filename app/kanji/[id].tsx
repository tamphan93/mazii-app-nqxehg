
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Kanji } from '@/types/dictionary';
import { getKanjiById, addFlashcard, getFlashcardByTargetId } from '@/utils/database';

export default function KanjiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [kanji, setKanji] = useState<Kanji | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFlashcard, setHasFlashcard] = useState(false);

  useEffect(() => {
    loadKanjiData();
  }, [id]);

  const loadKanjiData = async () => {
    try {
      setLoading(true);
      const kanjiData = await getKanjiById(id);
      setKanji(kanjiData);

      const flashcard = await getFlashcardByTargetId(id);
      setHasFlashcard(!!flashcard);
    } catch (error) {
      console.error('Error loading kanji:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlashcard = async () => {
    try {
      const dueDate = new Date();
      await addFlashcard({
        type: 'kanji',
        targetId: id,
        dueAt: dueDate.toISOString(),
        interval: 1,
        ease: 250,
        repetitions: 0,
      });
      setHasFlashcard(true);
      Alert.alert('Thành công', 'Đã thêm vào flashcard!');
    } catch (error) {
      console.error('Error adding flashcard:', error);
      Alert.alert('Lỗi', 'Không thể thêm flashcard');
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!kanji) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Không tìm thấy kanji</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: kanji.char,
          headerBackTitle: 'Tìm kiếm',
        }}
      />
      <ScrollView style={[commonStyles.container, styles.container]}>
        <View style={styles.mainCard}>
          <View style={styles.headerSection}>
            <Text style={styles.kanjiChar}>{kanji.char}</Text>
            {kanji.jlpt && (
              <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(kanji.jlpt) }]}>
                <Text style={styles.jlptText}>{kanji.jlpt}</Text>
              </View>
            )}
          </View>

          <View style={styles.meaningSection}>
            <Text style={styles.sectionTitle}>Nghĩa</Text>
            <Text style={styles.meaning}>{kanji.meaningVi}</Text>
            {kanji.meaningEn && <Text style={styles.meaningEn}>{kanji.meaningEn}</Text>}
          </View>

          <View style={styles.readingsSection}>
            {kanji.onyomi && (
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>音読み (Âm Hán)</Text>
                <Text style={styles.readingValue}>{kanji.onyomi}</Text>
              </View>
            )}
            {kanji.kunyomi && (
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>訓読み (Âm Kun)</Text>
                <Text style={styles.readingValue}>{kanji.kunyomi}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoGrid}>
            {kanji.radical && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Bộ thủ</Text>
                <Text style={styles.infoValue}>{kanji.radical}</Text>
              </View>
            )}
            {kanji.strokeCount && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Số nét</Text>
                <Text style={styles.infoValue}>{kanji.strokeCount}</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          style={[styles.flashcardButton, hasFlashcard && styles.flashcardButtonDisabled]}
          onPress={handleAddFlashcard}
          disabled={hasFlashcard}
        >
          <IconSymbol
            name={hasFlashcard ? 'checkmark.circle.fill' : 'plus.circle.fill'}
            size={24}
            color={colors.card}
          />
          <Text style={styles.flashcardButtonText}>
            {hasFlashcard ? 'Đã thêm vào Flashcard' : 'Thêm vào Flashcard'}
          </Text>
        </Pressable>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  headerSection: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  kanjiChar: {
    fontSize: 96,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  jlptBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  jlptText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
  },
  meaningSection: {
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  meaning: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  meaningEn: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  readingsSection: {
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readingItem: {
    marginBottom: 12,
  },
  readingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  readingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  infoGrid: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  infoItem: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  flashcardButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  flashcardButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  flashcardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
  bottomPadding: {
    height: 40,
  },
});
