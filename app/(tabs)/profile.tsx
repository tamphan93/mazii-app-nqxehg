
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getAllFlashcards, getDueFlashcards } from '@/utils/database';

export default function ProfileScreen() {
  const router = useRouter();
  const [totalCards, setTotalCards] = useState(0);
  const [dueCards, setDueCards] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const all = await getAllFlashcards();
      const due = await getDueFlashcards();
      setTotalCards(all.length);
      setDueCards(due.length);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Xóa cache',
      'Bạn có chắc muốn xóa toàn bộ dữ liệu đã lưu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Thông báo', 'Tính năng đang phát triển');
          },
        },
      ]
    );
  };

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Cài đặt',
          }}
        />
      )}
      <ScrollView style={[commonStyles.container, styles.container]}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.circle.fill" size={80} color={colors.primary} />
          </View>
          <Text style={styles.userName}>Người dùng</Text>
          <Text style={styles.userEmail}>Chưa đăng nhập</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Thống kê học tập</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCards}</Text>
              <Text style={styles.statLabel}>Tổng flashcard</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dueCards}</Text>
              <Text style={styles.statLabel}>Cần ôn tập</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/tts-settings')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="speaker.wave.2" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Giọng đọc (TTS)</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="globe" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Ngôn ngữ</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="bell" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Thông báo</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleClearCache}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="trash" size={24} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Xóa cache</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Về ứng dụng</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="info.circle" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Giới thiệu</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="doc.text" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Điều khoản sử dụng</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Mazii Dictionary v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ for Japanese learners</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsCard: {
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuItem: {
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 20 : 100,
  },
});
