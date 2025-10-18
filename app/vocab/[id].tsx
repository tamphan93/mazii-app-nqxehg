
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
  Modal,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Vocab, Example, Deck } from '@/types/dictionary';
import { getVocabById, getExamplesForItem, addFlashcard, getFlashcardByTargetId, addHistory, getAllDecks } from '@/utils/database';
import { mockExamples, cacheExample } from '@/utils/mockData';
import FuriganaText from '@/components/FuriganaText';
import PitchAccent from '@/components/PitchAccent';
import TTSButton from '@/components/TTSButton';

function getJLPTColor(jlpt: string): string {
  switch (jlpt) {
    case 'N5': return colors.success;
    case 'N4': return colors.primary;
    case 'N3': return colors.warning;
    case 'N2': return '#FF6B6B';
    case 'N1': return colors.error;
    default: return colors.textSecondary;
  }
}

export default function VocabDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vocab, setVocab] = useState<Vocab | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFlashcard, setHasFlashcard] = useState(false);
  const [showFurigana, setShowFurigana] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);

  const loadVocabData = useCallback(async () => {
    try {
      setLoading(true);
      const vocabData = await getVocabById(id);
      setVocab(vocabData);

      const examplesData = await getExamplesForItem(id, 'vocab');
      if (examplesData.length === 0) {
        const mockExamplesForVocab = mockExamples.filter(e => e.vocabId === id);
        for (const example of mockExamplesForVocab) {
          await cacheExample(example);
        }
        setExamples(mockExamplesForVocab);
      } else {
        setExamples(examplesData);
      }

      const flashcard = await getFlashcardByTargetId(id);
      setHasFlashcard(!!flashcard);
      
      // Add to history
      await addHistory({
        type: 'vocab',
        targetId: id,
        viewedAt: new Date().toISOString(),
      });
      
      // Load decks
      const allDecks = await getAllDecks();
      setDecks(allDecks);
    } catch (error) {
      console.error('Error loading vocab data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVocabData();
  }, [loadVocabData]);

  const handleAddFlashcard = async (deckId?: string) => {
    try {
      if (hasFlashcard) {
        Alert.alert('Thông báo', 'Từ này đã có trong bộ thẻ của bạn');
        return;
      }

      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 1);

      await addFlashcard({
        type: 'vocab',
        targetId: id,
        deckId,
        dueAt: dueAt.toISOString(),
        interval: 1,
        ease: 250,
        repetitions: 0,
      });

      setHasFlashcard(true);
      setShowDeckModal(false);
      Alert.alert('Thành công', 'Đã thêm vào bộ thẻ');
    } catch (error) {
      console.error('Error adding flashcard:', error);
      Alert.alert('Lỗi', 'Không thể thêm vào bộ thẻ');
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
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chi tiết từ vựng',
          headerRight: () => (
            <Pressable
              onPress={() => setShowDeckModal(true)}
              style={styles.headerButton}
              disabled={hasFlashcard}
            >
              <IconSymbol
                name={hasFlashcard ? 'checkmark.circle.fill' : 'plus.circle'}
                size={24}
                color={hasFlashcard ? colors.success : colors.primary}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={[commonStyles.container, styles.container]}>
        <View style={styles.mainCard}>
          {vocab.jlpt && (
            <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(vocab.jlpt) }]}>
              <Text style={styles.jlptText}>{vocab.jlpt}</Text>
            </View>
          )}

          <View style={styles.furiganaToggle}>
            <Text style={styles.furiganaLabel}>Hiện Furigana</Text>
            <Switch
              value={showFurigana}
              onValueChange={setShowFurigana}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>

          {showFurigana && vocab.readingFurigana ? (
            <FuriganaText text={vocab.readingFurigana} style={styles.vocabKanji} />
          ) : (
            vocab.kanji && <Text style={styles.vocabKanji}>{vocab.kanji}</Text>
          )}

          <View style={styles.kanaRow}>
            <Text style={styles.vocabKana}>{vocab.kana}</Text>
            <TTSButton text={vocab.kana} />
          </View>

          {vocab.pitch && <PitchAccent pitch={vocab.pitch} style={styles.pitchAccent} />}

          <Text style={styles.vocabMeaning}>{vocab.meaningVi}</Text>

          {vocab.pos && (
            <View style={styles.posTag}>
              <Text style={styles.posText}>{vocab.pos}</Text>
            </View>
          )}
        </View>

        {examples.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ví dụ</Text>
            {examples.map((example) => (
              <View key={example.id} style={styles.exampleCard}>
                <View style={styles.exampleRow}>
                  <Text style={styles.exampleJp}>{example.jp}</Text>
                  <TTSButton text={example.jp} size={18} />
                </View>
                {example.vi && <Text style={styles.exampleVi}>{example.vi}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showDeckModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeckModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeckModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn bộ thẻ</Text>
            <ScrollView style={styles.deckList}>
              <Pressable
                style={styles.deckOption}
                onPress={() => handleAddFlashcard(undefined)}
              >
                <Text style={styles.deckOptionText}>Không chọn bộ thẻ</Text>
              </Pressable>
              {decks.map((deck) => (
                <Pressable
                  key={deck.id}
                  style={styles.deckOption}
                  onPress={() => handleAddFlashcard(deck.id)}
                >
                  <Text style={styles.deckOptionText}>{deck.name}</Text>
                  {deck.description && (
                    <Text style={styles.deckOptionDescription}>{deck.description}</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalCloseButton} onPress={() => setShowDeckModal(false)}>
              <Text style={styles.modalCloseButtonText}>Hủy</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  mainCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  jlptBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  jlptText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
  furiganaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  furiganaLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  vocabKanji: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  kanaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  vocabKana: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  pitchAccent: {
    marginBottom: 16,
  },
  vocabMeaning: {
    fontSize: 20,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  posTag: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  posText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  exampleCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exampleJp: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  exampleVi: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  deckList: {
    maxHeight: 300,
  },
  deckOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  deckOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deckOptionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modalCloseButton: {
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
});
