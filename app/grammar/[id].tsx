
import React, { useEffect, useState, useCallback } from 'react';
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
import { Grammar } from '@/types/dictionary';
import { getGrammarById, addFlashcard, getFlashcardByTargetId } from '@/utils/database';

export default function GrammarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [grammar, setGrammar] = useState<Grammar | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFlashcard, setHasFlashcard] = useState(false);

  const loadGrammarData = useCallback(async () => {
    try {
      setLoading(true);
      const grammarData = await getGrammarById(id);
      setGrammar(grammarData);

      const flashcard = await getFlashcardByTargetId(id);
      setHasFlashcard(!!flashcard);
    } catch (error) {
      console.error('Error loading grammar:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGrammarData();
  }, [loadGrammarData]);

  const handleAddFlashcard = async () => {
    try {
      const dueDate = new Date();
      await addFlashcard({
        type: 'grammar',
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

  if (!grammar) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Không tìm thấy ngữ pháp</Text>
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
          title: grammar.pattern,
          headerBackTitle: 'Tìm kiếm',
        }}
      />
      <ScrollView style={[commonStyles.container, styles.container]}>
        <View style={styles.mainCard}>
          <View style={styles.headerSection}>
            <Text style={styles.pattern}>{grammar.pattern}</Text>
            {grammar.jlpt && (
              <View style={[styles.jlptBadge, { backgroundColor: getJLPTColor(grammar.jlpt) }]}>
                <Text style={styles.jlptText}>{grammar.jlpt}</Text>
              </View>
            )}
          </View>

          {grammar.structure && (
            <View style={styles.structureSection}>
              <Text style={styles.sectionTitle}>Cấu trúc</Text>
              <Text style={styles.structure}>{grammar.structure}</Text>
            </View>
          )}

          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>Giải thích</Text>
            <Text style={styles.desc}>{grammar.descVi}</Text>
            {grammar.descEn && <Text style={styles.descEn}>{grammar.descEn}</Text>}
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
  pattern: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
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
  structureSection: {
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
  structure: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  descSection: {
    marginTop: 20,
  },
  desc: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  descEn: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
