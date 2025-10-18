
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { initDatabase } from '@/utils/database';
import { syncDecksFromCloud } from '@/utils/sync';
import {
  mockVocabData,
  mockKanjiData,
  mockGrammarData,
  mockRadicalData,
  mockKanjiRadicalLinks,
} from '@/utils/mockData';
import {
  cacheVocab,
  cacheKanji,
  cacheGrammar,
  cacheRadical,
  linkKanjiRadical,
} from '@/utils/database';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await initDatabase();
        console.log('Database initialized');

        // Cache mock data
        for (const vocab of mockVocabData) {
          await cacheVocab(vocab);
        }
        for (const kanji of mockKanjiData) {
          await cacheKanji(kanji);
        }
        for (const grammar of mockGrammarData) {
          await cacheGrammar(grammar);
        }
        for (const radical of mockRadicalData) {
          await cacheRadical(radical);
        }
        for (const link of mockKanjiRadicalLinks) {
          await linkKanjiRadical(link.kanjiId, link.radicalId);
        }
        console.log('Mock data cached');

        // Sync decks from cloud
        await syncDecksFromCloud();
        console.log('Decks synced from cloud');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="vocab/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="kanji/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="grammar/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="history" options={{ headerShown: true }} />
        <Stack.Screen name="scan" options={{ headerShown: true, title: 'Quét ảnh' }} />
        <Stack.Screen name="scan-history" options={{ headerShown: true, title: 'Lịch sử quét' }} />
        <Stack.Screen name="tts-settings" options={{ headerShown: true, title: 'Cài đặt TTS' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="formsheet" options={{ presentation: 'formSheet' }} />
        <Stack.Screen name="transparent-modal" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
