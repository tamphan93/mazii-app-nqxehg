
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Grammar, Deck } from '@/types/dictionary';
import { getGrammarById, addFlashcard, getFlashcardByTargetId, addHistory, getAllDecks } from '@/utils/database';
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

export default function GrammarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [grammar, setGrammar] = useState<Grammar | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFlashcard, setHasFlashcard] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);

  const loadGrammarData = useCallback(async () => {
    try {
      setLoading(true);
      const grammarData = await getGrammarById(id);
      setGrammar(grammarData);

      const flashcard = await getFlashcardByTargetId(id);
      setHasFlashcard(!!flashcard);
      
      // Add to history
      await addHistory({
        type: 'grammar',
        targetId: id,
        viewedAt: new Date().toISOString(),
      });
      
      // Load decks
      const allDecks = await getAllDecks();
      setDecks(allDecks);
    } catch (error) {
      console.error('Error loading grammar data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGrammarData();
  }, [loadGrammarData]);

  const handleAddFlashcard = async (deckId?: string) => {
    try {
      if (hasFlashcard) {
        Alert.alert('Thông báo', 'Ngữ pháp này đã có trong bộ thẻ của bạn');
        return;
      }

      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 1);

      await addFlashcard({
        type: 'grammar',
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

  if (!grammar) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Không tìm thấy ngữ pháp</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chi tiết ngữ pháp',
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
          {grammar.jlpt && (
            <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(grammar.jlpt) }]}>
              <Text style={styles.jlptText}>{grammar.jlpt}</Text>
            </View>
          )}

          <View style={styles.patternRow}>
            <Text style={styles.grammarPattern}>{grammar.pattern}</Text>
            <TTSButton text={grammar.pattern} />
          </View>

          <Text style={styles.grammarDesc}>{grammar.descVi}</Text>

          {grammar.structure && (
            <View style={styles.structureCard}>
              <Text style={styles.structureLabel}>Cấu trúc:</Text>
              <Text style={styles.structureText}>{grammar.structure}</Text>
            </View>
          )}
        </View>
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
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  grammarPattern: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  grammarDesc: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 26,
  },
  structureCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  structureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  structureText: {
    fontSize: 16,
    color: colors.text,
    fontStyle: 'italic',
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
