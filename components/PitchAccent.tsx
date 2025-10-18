
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface PitchAccentProps {
  pitch: string;
  style?: any;
}

/**
 * PitchAccent component displays Japanese pitch accent patterns
 * 
 * Pitch patterns:
 * - 0 (平板): Flat/heiban - low-high-high-high...
 * - 1 (頭高): Atamadaka - high-low-low-low...
 * - 2+ (中高): Nakadaka - low-high-low... (drops after position n)
 */
export default function PitchAccent({ pitch, style }: PitchAccentProps) {
  const [showLegend, setShowLegend] = useState(false);

  const getPitchDescription = (pitchValue: string): string => {
    const num = parseInt(pitchValue, 10);
    if (isNaN(num)) return 'Unknown';

    if (num === 0) {
      return '平板 (Heiban) - Flat accent';
    } else if (num === 1) {
      return '頭高 (Atamadaka) - Initial high';
    } else {
      return `中高 (Nakadaka) - Drop after mora ${num}`;
    }
  };

  const getPitchColor = (pitchValue: string): string => {
    const num = parseInt(pitchValue, 10);
    if (isNaN(num)) return colors.textSecondary;

    if (num === 0) {
      return colors.primary;
    } else if (num === 1) {
      return colors.error;
    } else {
      return colors.secondary;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.pitchContainer}>
        <Text style={styles.label}>Pitch Accent:</Text>
        <View style={[styles.pitchBadge, { backgroundColor: getPitchColor(pitch) }]}>
          <Text style={styles.pitchText}>{pitch}</Text>
        </View>
        <Pressable
          style={styles.infoButton}
          onPress={() => setShowLegend(true)}
        >
          <IconSymbol name="info.circle" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Modal
        visible={showLegend}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLegend(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLegend(false)}
        >
          <View style={styles.legendCard}>
            <View style={styles.legendHeader}>
              <Text style={styles.legendTitle}>Pitch Accent Legend</Text>
              <Pressable onPress={() => setShowLegend(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.legendContent}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.legendBadgeText}>0</Text>
                </View>
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendItemTitle}>平板 (Heiban)</Text>
                  <Text style={styles.legendItemDesc}>
                    Flat accent - starts low, rises on second mora, stays high
                  </Text>
                  <Text style={styles.legendExample}>Example: はし (bridge)</Text>
                </View>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.legendBadgeText}>1</Text>
                </View>
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendItemTitle}>頭高 (Atamadaka)</Text>
                  <Text style={styles.legendItemDesc}>
                    Initial high - starts high, drops on second mora
                  </Text>
                  <Text style={styles.legendExample}>Example: はし (chopsticks)</Text>
                </View>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.legendBadgeText}>2+</Text>
                </View>
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendItemTitle}>中高 (Nakadaka)</Text>
                  <Text style={styles.legendItemDesc}>
                    Middle high - rises on second mora, drops after position n
                  </Text>
                  <Text style={styles.legendExample}>Example: こころ (heart) - pitch 3</Text>
                </View>
              </View>

              <View style={styles.currentPitchInfo}>
                <Text style={styles.currentPitchLabel}>Current word:</Text>
                <Text style={styles.currentPitchDesc}>{getPitchDescription(pitch)}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  pitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 8,
  },
  pitchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  pitchText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
  infoButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  legendCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  legendContent: {
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  legendBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  legendItemDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  legendExample: {
    fontSize: 13,
    color: colors.primary,
    fontStyle: 'italic',
  },
  currentPitchInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  currentPitchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  currentPitchDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
