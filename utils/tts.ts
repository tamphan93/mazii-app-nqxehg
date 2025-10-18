
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export interface TTSSettings {
  voice?: string;
  rate: number;
  pitch: number;
  language: string;
}

const DEFAULT_SETTINGS: TTSSettings = {
  rate: 0.75,
  pitch: 1.0,
  language: 'ja-JP',
};

const TTS_SETTINGS_KEY = '@tts_settings';

export class TTSManager {
  private static instance: TTSManager;
  private settings: TTSSettings = DEFAULT_SETTINGS;
  private isSpeaking = false;

  private constructor() {
    // Only load settings on native platforms
    if (Platform.OS !== 'web') {
      this.loadSettings();
    } else {
      console.warn('TTS: Settings not loaded on web platform');
    }
  }

  static getInstance(): TTSManager {
    if (!TTSManager.instance) {
      TTSManager.instance = new TTSManager();
    }
    return TTSManager.instance;
  }

  async loadSettings(): Promise<void> {
    // Skip loading on web platform
    if (Platform.OS === 'web') {
      console.warn('TTS: Settings not available on web platform');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(TTS_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading TTS settings:', error);
    }
  }

  async saveSettings(settings: Partial<TTSSettings>): Promise<void> {
    // Skip saving on web platform
    if (Platform.OS === 'web') {
      console.warn('TTS: Settings cannot be saved on web platform');
      this.settings = { ...this.settings, ...settings };
      return;
    }

    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving TTS settings:', error);
    }
  }

  getSettings(): TTSSettings {
    return { ...this.settings };
  }

  async speak(
    text: string,
    options?: {
      onStart?: () => void;
      onDone?: () => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    if (!text || text.trim().length === 0) {
      console.warn('TTS: Empty text provided');
      return;
    }

    try {
      // Stop any ongoing speech
      if (this.isSpeaking) {
        await this.stop();
      }

      this.isSpeaking = true;

      // Haptic feedback on start (only on native)
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Announce start for accessibility
      if (options?.onStart) {
        options.onStart();
      }

      console.log('TTS: Speaking:', text, 'with settings:', this.settings);

      await Speech.speak(text, {
        language: this.settings.language,
        pitch: this.settings.pitch,
        rate: this.settings.rate,
        voice: this.settings.voice,
        onStart: () => {
          console.log('TTS: Speech started');
        },
        onDone: () => {
          console.log('TTS: Speech completed');
          this.isSpeaking = false;
          if (options?.onDone) {
            options.onDone();
          }
        },
        onStopped: () => {
          console.log('TTS: Speech stopped');
          this.isSpeaking = false;
        },
        onError: (error) => {
          console.error('TTS: Speech error:', error);
          this.isSpeaking = false;
          if (options?.onError) {
            options.onError(new Error(error));
          }
        },
      });
    } catch (error) {
      console.error('TTS: Error in speak:', error);
      this.isSpeaking = false;
      if (options?.onError) {
        options.onError(error as Error);
      }
    }
  }

  async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.isSpeaking = false;
      console.log('TTS: Stopped');
    } catch (error) {
      console.error('TTS: Error stopping speech:', error);
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      // Filter for Japanese voices
      return voices.filter(
        (voice) =>
          voice.language.startsWith('ja') ||
          voice.language.startsWith('jp')
      );
    } catch (error) {
      console.error('TTS: Error getting voices:', error);
      return [];
    }
  }
}

export const ttsManager = TTSManager.getInstance();
