
import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator, View } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTTS } from '@/hooks/useTTS';

interface TTSButtonProps {
  text: string;
  announceText?: string;
  size?: number;
  color?: string;
  style?: any;
}

export default function TTSButton({
  text,
  announceText,
  size = 24,
  color = colors.primary,
  style,
}: TTSButtonProps) {
  const { speak, stop, isSpeaking } = useTTS();

  const handlePress = async () => {
    if (isSpeaking) {
      await stop();
    } else {
      await speak(text, announceText);
    }
  };

  return (
    <Pressable
      style={[styles.button, style]}
      onPress={handlePress}
      accessibilityLabel={isSpeaking ? 'Dừng đọc' : 'Đọc văn bản'}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        {isSpeaking ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <IconSymbol
            name="speaker.wave.2.fill"
            size={size}
            color={color}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
