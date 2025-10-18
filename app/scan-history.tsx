
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { ScanHistory } from '@/types/dictionary';
import { getScanHistory, deleteScanHistory, clearAllScanHistory } from '@/utils/database';
import * as Haptics from 'expo-haptics';

export default function ScanHistoryScreen() {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadHistory = useCallback(async () => {
    if (Platform.OS === 'web') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getScanHistory(100);
      setHistory(data);
    } catch (error) {
      console.error('Error loading scan history:', error);
      Alert.alert('Error', 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearch = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(tabs)/(home)/',
      params: { query: text, fromScan: 'true' },
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteScanHistory(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting scan history:', error);
      Alert.alert('Error', 'Failed to delete scan history');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all scan history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await clearAllScanHistory();
              setHistory([]);
            } catch (error) {
              console.error('Error clearing scan history:', error);
              Alert.alert('Error', 'Failed to clear scan history');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderItem = ({ item }: { item: ScanHistory }) => (
    <Pressable
      style={styles.historyItem}
      onPress={() => handleSearch(item.text)}
      onLongPress={() => {
        Alert.alert('Delete', 'Delete this scan from history?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDelete(item.id),
          },
        ]);
      }}
    >
      <View style={styles.historyItemContent}>
        <View style={styles.historyItemIcon}>
          <IconSymbol name="doc.text.fill" size={24} color={colors.primary} />
        </View>
        <View style={styles.historyItemText}>
          <Text style={styles.historyItemTitle} numberOfLines={2}>
            {item.text}
          </Text>
          <Text style={styles.historyItemDate}>{formatDate(item.timestamp)}</Text>
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="trash.fill" size={20} color={colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="camera.fill" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Scan History</Text>
      <Text style={styles.emptyText}>
        Scanned text will appear here. Start scanning Japanese text to build your history.
      </Text>
      <Pressable
        style={styles.scanButton}
        onPress={() => router.push('/scan')}
      >
        <IconSymbol name="camera.fill" size={20} color="#fff" />
        <Text style={styles.scanButtonText}>Start Scanning</Text>
      </Pressable>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Scan History',
            headerShown: true,
          }}
        />
        <View style={styles.webNotSupported}>
          <IconSymbol name="camera.fill" size={64} color={colors.textSecondary} />
          <Text style={styles.webNotSupportedText}>
            Scan history is not available on web.
          </Text>
          <Text style={styles.webNotSupportedSubtext}>
            Please use the mobile app to access scan history.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Scan History',
          headerShown: true,
          headerRight: () =>
            history.length > 0 ? (
              <Pressable onPress={handleClearAll} style={styles.headerButton}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </Pressable>
            ) : null,
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            history.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 15,
  },
  emptyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    ...commonStyles.shadow,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  historyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyItemText: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    marginRight: 10,
  },
  clearAllText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  webNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webNotSupportedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  webNotSupportedSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
