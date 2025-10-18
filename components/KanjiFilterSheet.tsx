
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Radical } from '@/types/dictionary';

interface KanjiFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  radicals: Radical[];
  selectedRadicalId?: string;
  strokeRange: [number, number];
  onRadicalSelect: (radicalId?: string) => void;
  onStrokeRangeChange: (range: [number, number]) => void;
  onApply: () => void;
}

const KanjiFilterSheet: React.FC<KanjiFilterSheetProps> = ({
  visible,
  onClose,
  radicals,
  selectedRadicalId,
  strokeRange,
  onRadicalSelect,
  onStrokeRangeChange,
  onApply,
}) => {
  const [localStrokeMin, setLocalStrokeMin] = useState(strokeRange[0]);
  const [localStrokeMax, setLocalStrokeMax] = useState(strokeRange[1]);

  useEffect(() => {
    setLocalStrokeMin(strokeRange[0]);
    setLocalStrokeMax(strokeRange[1]);
  }, [strokeRange]);

  const handleApply = () => {
    onStrokeRangeChange([localStrokeMin, localStrokeMax]);
    onApply();
  };

  const handleReset = () => {
    onRadicalSelect(undefined);
    setLocalStrokeMin(1);
    setLocalStrokeMax(30);
    onStrokeRangeChange([1, 30]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Lọc Kanji</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Radical Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn bộ thủ</Text>
              <View style={styles.radicalGrid}>
                <Pressable
                  style={[
                    styles.radicalItem,
                    !selectedRadicalId && styles.radicalItemSelected,
                  ]}
                  onPress={() => onRadicalSelect(undefined)}
                >
                  <Text
                    style={[
                      styles.radicalSymbol,
                      !selectedRadicalId && styles.radicalSymbolSelected,
                    ]}
                  >
                    Tất cả
                  </Text>
                </Pressable>
                {radicals.map((radical) => (
                  <Pressable
                    key={radical.id}
                    style={[
                      styles.radicalItem,
                      selectedRadicalId === radical.id && styles.radicalItemSelected,
                    ]}
                    onPress={() => onRadicalSelect(radical.id)}
                  >
                    <Text
                      style={[
                        styles.radicalSymbol,
                        selectedRadicalId === radical.id && styles.radicalSymbolSelected,
                      ]}
                    >
                      {radical.symbol}
                    </Text>
                    <Text style={styles.radicalName}>{radical.nameVi}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Stroke Count Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Số nét: {localStrokeMin} - {localStrokeMax}
              </Text>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Tối thiểu: {localStrokeMin}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={30}
                  step={1}
                  value={localStrokeMin}
                  onValueChange={setLocalStrokeMin}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
              </View>

              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Tối đa: {localStrokeMax}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={30}
                  step={1}
                  value={localStrokeMax}
                  onValueChange={setLocalStrokeMax}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Đặt lại</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  radicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radicalItem: {
    minWidth: 70,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  radicalItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  radicalSymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  radicalSymbolSelected: {
    color: colors.primary,
  },
  radicalName: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default KanjiFilterSheet;
