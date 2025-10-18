
import { Platform } from 'react-native';

/**
 * Extract Japanese text from an image URI
 * This is a placeholder implementation that simulates OCR
 * In production, you would integrate with expo-mlkit-ocr or Google Vision API
 */
export const extractTextFromImage = async (imageUri: string): Promise<string> => {
  console.log('Extracting text from image:', imageUri);
  
  // Placeholder implementation
  // In production, integrate with expo-mlkit-ocr or Vision API
  // For now, return empty string to indicate OCR is not yet implemented
  
  // TODO: Implement actual OCR
  // Option 1: expo-mlkit-ocr (when available)
  // Option 2: Google Cloud Vision API
  // Option 3: Other OCR service
  
  return '';
};

/**
 * Extract Kanji characters from text
 * Prioritizes Kanji over Hiragana/Katakana
 */
export const extractKanji = (text: string): string => {
  // Kanji Unicode range: U+4E00 to U+9FFF
  const kanjiRegex = /[\u4E00-\u9FFF]/g;
  const kanjiChars = text.match(kanjiRegex);
  
  if (kanjiChars && kanjiChars.length > 0) {
    return kanjiChars.join('');
  }
  
  return text;
};

/**
 * Clean and normalize OCR text
 */
export const normalizeOCRText = (text: string): string => {
  // Remove extra whitespace
  let normalized = text.replace(/\s+/g, ' ').trim();
  
  // Remove common OCR artifacts
  normalized = normalized.replace(/[|]/g, '');
  
  return normalized;
};

/**
 * Prioritize Kanji characters in search query
 */
export const prioritizeKanjiForSearch = (text: string): string => {
  const kanji = extractKanji(text);
  
  // If we have kanji, prioritize it
  if (kanji.length > 0) {
    return kanji;
  }
  
  // Otherwise return the full text
  return normalizeOCRText(text);
};
