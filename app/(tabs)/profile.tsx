
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { getAllFlashcards, getDueFlashcards } from '@/utils/database';
import { performFullSync, isOnline } from '@/utils/sync';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const [totalCards, setTotalCards] = useState(0);
  const [dueCards, setDueCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadStats();
    checkOnlineStatus();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const allCards = await getAllFlashcards();
      const due = await getDueFlashcards();
      setTotalCards(allCards.length);
      setDueCards(due.length);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOnlineStatus = async () => {
    const status = await isOnline();
    setOnline(status);
  };

  const handleClearCache = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      'Xóa cache',
      'Bạn có chắc muốn xóa tất cả dữ liệu đã lưu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement cache clearing
            Alert.alert('Thông báo', 'Chức năng đang phát triển');
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    if (!online) {
      Alert.alert('Lỗi', 'Không có kết nối internet');
      return;
    }
    
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      setSyncing(true);
      await performFullSync();
      await loadStats();
      Alert.alert('Thành công', 'Đã đồng bộ dữ liệu');
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Lỗi', 'Không thể đồng bộ dữ liệu');
    } finally {
      setSyncing(false);
    }
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <View style={styles.statCard}>
                <IconSymbol name="square.stack.3d.up.fill" size={32} color={colors.primary} />
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{totalCards}</Text>
                  <Text style={styles.statLabel}>Tổng số thẻ</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <IconSymbol name="clock.fill" size={32} color={colors.warning} />
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{dueCards}</Text>
                  <Text style={styles.statLabel}>Thẻ cần ôn</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dữ liệu</Text>
          
          <Pressable
            style={styles.menuItem}
            onPress={handleSync}
            disabled={syncing || !online}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol
                name="arrow.triangle.2.circlepath"
                size={24}
                color={online ? colors.primary : colors.textSecondary}
              />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>
                  {syncing ? 'Đang đồng bộ...' : 'Đồng bộ với cloud'}
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  {online ? 'Đã kết nối' : 'Không có kết nối'}
                </Text>
              </View>
            </View>
            {syncing && <ActivityIndicator size="small" color={colors.primary} />}
            {!syncing && <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />}
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/history')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="clock" size={24} color={colors.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Lịch sử</Text>
                <Text style={styles.menuItemSubtitle}>Xem lịch sử tra cứu</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/scan-history')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="camera" size={24} color={colors.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Lịch sử quét</Text>
                <Text style={styles.menuItemSubtitle}>Xem lịch sử quét ảnh</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleClearCache}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="trash" size={24} color={colors.error} />
              <View style={styles.menuItemText}>
                <Text style={[styles.menuItemTitle, { color: colors.error }]}>
                  Xóa cache
                </Text>
                <Text style={styles.menuItemSubtitle}>Xóa dữ liệu đã lưu</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khác</Text>
          
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/tts-settings')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="speaker.wave.2" size={24} color={colors.primary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Cài đặt TTS</Text>
                <Text style={styles.menuItemSubtitle}>Giọng đọc và tốc độ</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statContent: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
