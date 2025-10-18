
import { useState, useEffect, useCallback } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { ttsManager, TTSSettings } from '@/utils/tts';
import * as Speech from 'expo-speech';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settings, setSettings] = useState<TTSSettings>(ttsManager.getSettings());
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    const voices = await ttsManager.getAvailableVoices();
    setAvailableVoices(voices);
  };

  const speak = useCallback(
    async (text: string, announceText?: string) => {
      const textToAnnounce = announceText || 'Đang đọc';

      // Accessibility announcement
      if (Platform.OS !== 'web') {
        AccessibilityInfo.announceForAccessibility(textToAnnounce);
      }

      setIsSpeaking(true);

      await ttsManager.speak(text, {
        onStart: () => {
          setIsSpeaking(true);
        },
        onDone: () => {
          setIsSpeaking(false);
          // Announce completion
          if (Platform.OS !== 'web') {
            AccessibilityInfo.announceForAccessibility('Đã đọc xong');
          }
        },
        onError: (error) => {
          console.error('TTS Error:', error);
          setIsSpeaking(false);
          if (Platform.OS !== 'web') {
            AccessibilityInfo.announceForAccessibility('Lỗi khi đọc');
          }
        },
      });
    },
    []
  );

  const stop = useCallback(async () => {
    await ttsManager.stop();
    setIsSpeaking(false);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<TTSSettings>) => {
    await ttsManager.saveSettings(newSettings);
    setSettings(ttsManager.getSettings());
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    settings,
    updateSettings,
    availableVoices,
  };
};
