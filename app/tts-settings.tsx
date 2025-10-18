
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useTTS } from '@/hooks/useTTS';
import Slider from '@react-native-community/slider';
import { IconSymbol } from '@/components/IconSymbol';
import * as Speech from 'expo-speech';

export default function TTSSettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, availableVoices } = useTTS();
  const [rate, setRate] = useState(settings.rate);
  const [pitch, setPitch] = useState(settings.pitch);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(settings.voice);
  const [showVoiceList, setShowVoiceList] = useState(false);

  useEffect(() => {
    setRate(settings.rate);
    setPitch(settings.pitch);
    setSelectedVoice(settings.voice);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      rate,
      pitch,
      voice: selectedVoice,
    });
    router.back();
  };

  const handleTestSpeech = async () => {
    const testText = 'こんにちは。これはテストです。';
    await Speech.speak(testText, {
      language: settings.language,
      rate,
      pitch,
      voice: selectedVoice,
    });
  };

  const getVoiceName = (voice?: string) => {
    if (!voice) return 'Mặc định';
    const voiceObj = availableVoices.find((v) => v.identifier === voice);
    return voiceObj?.name || voice;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cài đặt TTS',
          headerBackTitle: 'Quay lại',
          presentation: 'modal',
        }}
      />
      <ScrollView style={[commonStyles.container, styles.container]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giọng đọc</Text>
          <Pressable
            style={styles.voiceSelector}
            onPress={() => setShowVoiceList(!showVoiceList)}
          >
            <View style={styles.voiceSelectorLeft}>
              <IconSymbol name="person.wave.2" size={24} color={colors.text} />
              <Text style={styles.voiceSelectorText}>{getVoiceName(selectedVoice)}</Text>
            </View>
            <IconSymbol
              name={showVoiceList ? 'chevron.up' : 'chevron.down'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>

          {showVoiceList && (
            <View style={styles.voiceList}>
              <Pressable
                style={[
                  styles.voiceItem,
                  !selectedVoice && styles.voiceItemSelected,
                ]}
                onPress={() => {
                  setSelectedVoice(undefined);
                  setShowVoiceList(false);
                }}
              >
                <Text
                  style={[
                    styles.voiceItemText,
                    !selectedVoice && styles.voiceItemTextSelected,
                  ]}
                >
                  Mặc định
                </Text>
                {!selectedVoice && (
                  <IconSymbol name="checkmark" size={20} color={colors.primary} />
                )}
              </Pressable>
              {availableVoices.map((voice) => (
                <Pressable
                  key={voice.identifier}
                  style={[
                    styles.voiceItem,
                    selectedVoice === voice.identifier && styles.voiceItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedVoice(voice.identifier);
                    setShowVoiceList(false);
                  }}
                >
                  <View>
                    <Text
                      style={[
                        styles.voiceItemText,
                        selectedVoice === voice.identifier && styles.voiceItemTextSelected,
                      ]}
                    >
                      {voice.name}
                    </Text>
                    <Text style={styles.voiceItemSubtext}>
                      {voice.language} • {voice.quality}
                    </Text>
                  </View>
                  {selectedVoice === voice.identifier && (
                    <IconSymbol name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tốc độ đọc</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Chậm</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={2.0}
              value={rate}
              onValueChange={setRate}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={styles.sliderLabel}>Nhanh</Text>
          </View>
          <Text style={styles.sliderValue}>{rate.toFixed(2)}x</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cao độ giọng</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Thấp</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2.0}
              value={pitch}
              onValueChange={setPitch}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={styles.sliderLabel}>Cao</Text>
          </View>
          <Text style={styles.sliderValue}>{pitch.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.testButton} onPress={handleTestSpeech}>
            <IconSymbol name="speaker.wave.2.fill" size={24} color={colors.card} />
            <Text style={styles.testButtonText}>Thử giọng đọc</Text>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu cài đặt</Text>
          </Pressable>
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
  voiceSelector: {
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  voiceSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceSelectorText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  voiceList: {
    backgroundColor: colors.card,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  voiceItemSelected: {
    backgroundColor: colors.background,
  },
  voiceItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  voiceItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  voiceItemSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 50,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  testButton: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 20 : 100,
  },
});
