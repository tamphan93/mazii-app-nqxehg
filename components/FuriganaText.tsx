
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface FuriganaSegment {
  kanji: string;
  furigana: string;
}

interface FuriganaTextProps {
  text: string;
  furigana: string;
  style?: any;
  kanjiStyle?: any;
  furiganaStyle?: any;
}

/**
 * FuriganaText component renders Japanese text with furigana (ruby) annotations
 * 
 * Format: "漢字[かんじ]" or "食[た]べる"
 * Example: "食[た]べる" will render "食" with "た" above it
 */
export default function FuriganaText({
  text,
  furigana,
  style,
  kanjiStyle,
  furiganaStyle,
}: FuriganaTextProps) {
  const parseSegments = (): (FuriganaSegment | string)[] => {
    const segments: (FuriganaSegment | string)[] = [];
    const regex = /([^\[]+)\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(furigana)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        segments.push(furigana.substring(lastIndex, match.index));
      }

      // Add the furigana segment
      segments.push({
        kanji: match[1],
        furigana: match[2],
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < furigana.length) {
      segments.push(furigana.substring(lastIndex));
    }

    // If no furigana markup found, just return the text
    if (segments.length === 0) {
      segments.push(text);
    }

    return segments;
  };

  const segments = parseSegments();

  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => {
        if (typeof segment === 'string') {
          // Plain text without furigana
          return (
            <Text key={index} style={[styles.kanji, kanjiStyle]}>
              {segment}
            </Text>
          );
        } else {
          // Text with furigana
          return (
            <View key={index} style={styles.rubyContainer}>
              <Text style={[styles.furigana, furiganaStyle]}>
                {segment.furigana}
              </Text>
              <Text style={[styles.kanji, kanjiStyle]}>
                {segment.kanji}
              </Text>
            </View>
          );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  rubyContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  furigana: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 14,
    textAlign: 'center',
  },
  kanji: {
    fontSize: 24,
    color: colors.text,
    lineHeight: 28,
  },
});
