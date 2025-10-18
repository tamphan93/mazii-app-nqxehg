
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Flashcard, Vocab, Kanji, Grammar, ReviewGrade, Deck } from '@/types/dictionary';
import {
  getDueFlashcards,
  updateFlashcard,
  getVocabById,
  getKanjiById,
  getGrammarById,
  getAllDecks,
  getAllFlashcards,
} from '@/utils/database';
import { calculateSRS } from '@/utils/srs';

export default function StudyScreen() {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [currentItem, setCurrentItem] = useState<Vocab | Kanji | Grammar | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>(undefined);
  const [deckProgress, setDeckProgress] = useState<Map<string, { total: number; due: number }>>(new Map());

  const loadDecks = useCallback(async () => {
    try {
      const allDecks = await getAllDecks();
      setDecks(allDecks);
      
      // Calculate progress for each deck
      const allCards = await getAllFlashcards();
      const now = new Date().toISOString();
      const progressMap = new Map<string, { total: number; due: number }>();
      
      for (const deck of allDecks) {
        const deckCards = allCards.filter(card => card.deckId === deck.id);
        const dueCount = deckCards.filter(card => card.dueAt <= now).length;
        progressMap.set(deck.id, { total: deckCards.length, due: dueCount });
      }
      
      setDeckProgress(progressMap);
    } catch (error) {
      console.error('Error loading decks:', error);
    }
  }, []);

  const loadDueCards = useCallback(async () => {
    try {
      setLoading(true);
      const cards = await getDueFlashcards(selectedDeckId);
      setDueCards(cards);
      if (cards.length > 0) {
        await loadCard(cards[0]);
      } else {
        setCurrentCard(null);
        setCurrentItem(null);
      }
    } catch (error) {
      console.error('Error loading due cards:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDeckId]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  const loadCard = async (card: Flashcard) => {
    try {
      setCurrentCard(card);
      setShowAnswer(false);

      let item: Vocab | Kanji | Grammar | null = null;
      if (card.type === 'vocab') {
        item = await getVocabById(card.targetId);
      } else if (card.type === 'kanji') {
        item = await getKanjiById(card.targetId);
      } else if (card.type === 'grammar') {
        item = await getGrammarById(card.targetId);
      }
      setCurrentItem(item);
    } catch (error) {
      console.error('Error loading card:', error);
    }
  };

  const handleReview = async (grade: ReviewGrade) => {
    if (!currentCard || reviewing) return;

    try {
      setReviewing(true);
      const srsResult = calculateSRS(
        grade,
        currentCard.interval,
        currentCard.ease,
        currentCard.repetitions
      );

      await updateFlashcard(currentCard.id, {
        interval: srsResult.interval,
        ease: srsResult.ease,
        dueAt: srsResult.dueAt,
        repetitions: srsResult.repetitions,
        lastReviewed: new Date().toISOString(),
      });

      // Move to next card
      const remainingCards = dueCards.filter((c) => c.id !== currentCard.id);
      setDueCards(remainingCards);

      if (remainingCards.length > 0) {
        await loadCard(remainingCards[0]);
      } else {
        setCurrentCard(null);
        setCurrentItem(null);
      }
      
      // Reload deck progress
      await loadDecks();
    } catch (error) {
      console.error('Error reviewing card:', error);
    } finally {
      setReviewing(false);
    }
  };

  const renderCardContent = () => {
    if (!currentItem) return null;

    if ('kana' in currentItem) {
      // Vocab
      return (
        <View style={styles.cardContent}>
          <Text style={styles.cardType}>Từ vựng</Text>
          {currentItem.kanji && <Text style={styles.cardKanji}>{currentItem.kanji}</Text>}
          <Text style={styles.cardKana}>{currentItem.kana}</Text>
          {showAnswer && (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Nghĩa:</Text>
              <Text style={styles.answerText}>{currentItem.meaningVi}</Text>
              {currentItem.pos && <Text style={styles.answerPos}>{currentItem.pos}</Text>}
            </View>
          )}
        </View>
      );
    } else if ('char' in currentItem) {
      // Kanji
      return (
        <View style={styles.cardContent}>
          <Text style={styles.cardType}>Kanji</Text>
          <Text style={styles.cardKanjiChar}>{currentItem.char}</Text>
          {showAnswer && (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Nghĩa:</Text>
              <Text style={styles.answerText}>{currentItem.meaningVi}</Text>
              {currentItem.onyomi && (
                <Text style={styles.answerReading}>音: {currentItem.onyomi}</Text>
              )}
              {currentItem.kunyomi && (
                <Text style={styles.answerReading}>訓: {currentItem.kunyomi}</Text>
              )}
            </View>
          )}
        </View>
      );
    } else if ('pattern' in currentItem) {
      // Grammar
      return (
        <View style={styles.cardContent}>
          <Text style={styles.cardType}>Ngữ pháp</Text>
          <Text style={styles.cardPattern}>{currentItem.pattern}</Text>
          {showAnswer && (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Giải thích:</Text>
              <Text style={styles.answerText}>{currentItem.descVi}</Text>
              {currentItem.structure && (
                <Text style={styles.answerStructure}>{currentItem.structure}</Text>
              )}
            </View>
          )}
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show deck selection if no deck is selected
  if (!selectedDeckId && decks.length > 0) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: 'Ôn tập',
            }}
          />
        )}
        <View style={[commonStyles.container, styles.container]}>
          <ScrollView contentContainerStyle={styles.deckListContainer}>
            <Text style={styles.deckListTitle}>Chọn bộ thẻ</Text>
            <Pressable
              style={styles.deckCard}
              onPress={() => setSelectedDeckId(undefined)}
            >
              <View style={styles.deckCardHeader}>
                <Text style={styles.deckCardTitle}>Tất cả</Text>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.deckCardProgress}>
                <Text style={styles.deckCardProgressText}>
                  {Array.from(deckProgress.values()).reduce((sum, p) => sum + p.due, 0)} thẻ cần ôn
                </Text>
                <Text style={styles.deckCardProgressTotal}>
                  / {Array.from(deckProgress.values()).reduce((sum, p) => sum + p.total, 0)} tổng
                </Text>
              </View>
            </Pressable>
            {decks.map((deck) => {
              const progress = deckProgress.get(deck.id) || { total: 0, due: 0 };
              return (
                <Pressable
                  key={deck.id}
                  style={styles.deckCard}
                  onPress={() => setSelectedDeckId(deck.id)}
                >
                  <View style={styles.deckCardHeader}>
                    <View>
                      <Text style={styles.deckCardTitle}>{deck.name}</Text>
                      {deck.description && (
                        <Text style={styles.deckCardDescription}>{deck.description}</Text>
                      )}
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                  </View>
                  <View style={styles.deckCardProgress}>
                    <Text style={styles.deckCardProgressText}>
                      {progress.due} thẻ cần ôn
                    </Text>
                    <Text style={styles.deckCardProgressTotal}>
                      / {progress.total} tổng
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </>
    );
  }

  if (dueCards.length === 0) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: 'Ôn tập',
              headerLeft: () => (
                <Pressable onPress={() => setSelectedDeckId(undefined)} style={styles.headerButton}>
                  <IconSymbol name="chevron.left" size={20} color={colors.primary} />
                </Pressable>
              ),
            }}
          />
        )}
        <View style={[commonStyles.container, styles.centerContainer]}>
          <IconSymbol name="checkmark.circle.fill" size={80} color={colors.success} />
          <Text style={styles.emptyTitle}>Hoàn thành!</Text>
          <Text style={styles.emptyText}>Không có thẻ nào cần ôn tập</Text>
          <Pressable style={styles.refreshButton} onPress={() => setSelectedDeckId(undefined)}>
            <IconSymbol name="arrow.left" size={20} color={colors.card} />
            <Text style={styles.refreshButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Ôn tập',
            headerLeft: () => (
              <Pressable onPress={() => setSelectedDeckId(undefined)} style={styles.headerButton}>
                <IconSymbol name="chevron.left" size={20} color={colors.primary} />
              </Pressable>
            ),
          }}
        />
      )}
      <View style={[commonStyles.container, styles.container]}>
        <View style={styles.header}>
          <Text style={styles.progressText}>
            {dueCards.length} thẻ còn lại
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>{renderCardContent()}</View>
        </View>

        {!showAnswer ? (
          <Pressable style={styles.showAnswerButton} onPress={() => setShowAnswer(true)}>
            <Text style={styles.showAnswerButtonText}>Hiện đáp án</Text>
          </Pressable>
        ) : (
          <View style={styles.reviewButtons}>
            <Pressable
              style={[styles.reviewButton, styles.againButton]}
              onPress={() => handleReview('again')}
              disabled={reviewing}
            >
              <Text style={styles.reviewButtonText}>Lại</Text>
              <Text style={styles.reviewButtonSubtext}>1 ngày</Text>
            </Pressable>
            <Pressable
              style={[styles.reviewButton, styles.hardButton]}
              onPress={() => handleReview('hard')}
              disabled={reviewing}
            >
              <Text style={styles.reviewButtonText}>Khó</Text>
              <Text style={styles.reviewButtonSubtext}>
                {Math.round(currentCard!.interval * 0.8)} ngày
              </Text>
            </Pressable>
            <Pressable
              style={[styles.reviewButton, styles.goodButton]}
              onPress={() => handleReview('good')}
              disabled={reviewing}
            >
              <Text style={styles.reviewButtonText}>Tốt</Text>
              <Text style={styles.reviewButtonSubtext}>{currentCard!.interval} ngày</Text>
            </Pressable>
            <Pressable
              style={[styles.reviewButton, styles.easyButton]}
              onPress={() => handleReview('easy')}
              disabled={reviewing}
            >
              <Text style={styles.reviewButtonText}>Dễ</Text>
              <Text style={styles.reviewButtonSubtext}>
                {Math.round(currentCard!.interval * 1.3)} ngày
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 16,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  headerButton: {
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  deckListContainer: {
    padding: 16,
  },
  deckListTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  deckCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  deckCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deckCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  deckCardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  deckCardProgress: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  deckCardProgressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  deckCardProgressTotal: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    minHeight: 300,
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  cardKanji: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardKana: {
    fontSize: 28,
    color: colors.textSecondary,
  },
  cardKanjiChar: {
    fontSize: 96,
    fontWeight: '700',
    color: colors.text,
  },
  cardPattern: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  answerSection: {
    marginTop: 24,
    width: '100%',
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  answerPos: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  answerReading: {
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
  },
  answerStructure: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  showAnswerButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  showAnswerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.card,
  },
  reviewButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  reviewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  againButton: {
    backgroundColor: colors.error,
  },
  hardButton: {
    backgroundColor: colors.warning,
  },
  goodButton: {
    backgroundColor: colors.success,
  },
  easyButton: {
    backgroundColor: colors.primary,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
    marginBottom: 2,
  },
  reviewButtonSubtext: {
    fontSize: 10,
    color: colors.card,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
});
