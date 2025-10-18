
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Vocab, Example } from '@/types/dictionary';
import { getVocabById, getExamplesForItem, addFlashcard, getFlashcardByTargetId } from '@/utils/database';
import { mockExamples, cacheExample } from '@/utils/mockData';
import FuriganaText from '@/components/FuriganaText';
import PitchAccent from '@/components/PitchAccent';
import TTSButton from '@/components/TTSButton';

export default function VocabDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vocab, setVocab] = useState<Vocab | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFlashcard, setHasFlashcard] = useState(false);
  const [showFurigana, setShowFurigana] = useState(false);

  const loadVocabData = useCallback(async () => {
    try {
      setLoading(true);
      const vocabData = await getVocabById(id);
      setVocab(vocabData);

      // Load examples
      const examplesData = await getExamplesForItem(id, 'vocab');
      if (examplesData.length === 0) {
        // Load mock examples
        const mockExamplesForVocab = mockExamples.filter((ex) => ex.vocabId === id);
        for (const example of mockExamplesForVocab) {
          await cacheExample(example);
        }
        setExamples(mockExamplesForVocab);
      } else {
        setExamples(examplesData);
      }

      // Check if flashcard exists
      const flashcard = await getFlashcardByTargetId(id);
      setHasFlashcard(!!flashcard);
    } catch (error) {
      console.error('Error loading vocab:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVocabData();
  }, [loadVocabData]);

  const handleAddFlashcard = async () => {
    try {
      const dueDate = new Date();
      await addFlashcard({
        type: 'vocab',
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

  if (!vocab) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Không tìm thấy từ vựng</Text>
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
          title: vocab.kanji || vocab.kana,
          headerBackTitle: 'Tìm kiếm',
        }}
      />
      <ScrollView style={[commonStyles.container, styles.container]}>
        <View style={styles.mainCard}>
          <View style={styles.headerSection}>
            <View style={styles.wordContainer}>
              {vocab.kanji && (
                <>
                  {showFurigana && vocab.readingFurigana ? (
                    <FuriganaText
                      text={vocab.kanji}
                      furigana={vocab.readingFurigana}
                      style={styles.furiganaContainer}
                      kanjiStyle={styles.kanji}
                      furiganaStyle={styles.furiganaText}
                    />
                  ) : (
                    <Text style={styles.kanji}>{vocab.kanji}</Text>
                  )}
                </>
              )}
              <View style={styles.kanaRow}>
                <Text style={styles.kana}>{vocab.kana}</Text>
                <TTSButton
                  text={vocab.kana}
                  announceText={`Đang đọc ${vocab.kanji || vocab.kana}`}
                  size={20}
                  color={colors.primary}
                />
              </View>
            </View>
            
            {vocab.jlpt && (
              <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(vocab.jlpt) }]}>
                <Text style={styles.jlptText}>{vocab.jlpt}</Text>
              </View>
            )}

            {vocab.readingFurigana && (
              <View style={styles.furiganaToggle}>
                <Text style={styles.toggleLabel}>Furigana</Text>
                <Switch
                  value={showFurigana}
                  onValueChange={setShowFurigana}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            )}
          </View>

          {vocab.pitch && (
            <View style={styles.pitchSection}>
              <PitchAccent pitch={vocab.pitch} />
            </View>
          )}

          <View style={styles.meaningSection}>
            <Text style={styles.sectionTitle}>Nghĩa</Text>
            <Text style={styles.meaning}>{vocab.meaningVi}</Text>
            {vocab.meaningEn && <Text style={styles.meaningEn}>{vocab.meaningEn}</Text>}
          </View>

          {vocab.pos && (
            <View style={styles.posSection}>
              <Text style={styles.sectionTitle}>Từ loại</Text>
              <Text style={styles.pos}>{vocab.pos}</Text>
            </View>
          )}
        </View>

        {examples.length > 0 && (
          <View style={styles.examplesCard}>
            <Text style={styles.cardTitle}>Ví dụ</Text>
            {examples.map((example) => (
              <View key={example.id} style={styles.exampleItem}>
                <View style={styles.exampleHeader}>
                  <Text style={styles.exampleJp}>{example.jp}</Text>
                  <TTSButton
                    text={example.jp}
                    announceText="Đang đọc ví dụ"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
                {example.vi && <Text style={styles.exampleVi}>{example.vi}</Text>}
                {example.en && <Text style={styles.exampleEn}>{example.en}</Text>}
              </View>
            ))}
          </View>
        )}

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
  wordContainer: {
    alignItems: 'center',
    width: '100%',
  },
  furiganaContainer: {
    marginBottom: 8,
  },
  kanji: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  furiganaText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  kanaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  kana: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  jlptBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  jlptText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
  },
  furiganaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pitchSection: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  meaningSection: {
    marginTop: 20,
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
  posSection: {
    marginTop: 16,
  },
  pos: {
    fontSize: 16,
    color: colors.text,
    fontStyle: 'italic',
  },
  examplesCard: {
    backgroundColor: colors.card,
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  exampleItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exampleJp: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  exampleVi: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  exampleEn: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
