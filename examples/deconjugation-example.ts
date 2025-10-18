
/**
 * Example usage of Japanese deconjugation feature
 * 
 * This file demonstrates how to use the deconjugation utilities
 * in your React Native application.
 */

import { deconjugate, deconjugateDetailed } from '@/utils/deconjugate';

// ============================================================================
// Example 1: Basic Deconjugation
// ============================================================================

console.log('=== Example 1: Basic Deconjugation ===');

// Verb conjugations
console.log('食べました →', deconjugate('食べました')); // ['食べる']
console.log('読めない →', deconjugate('読めない'));     // ['読む', '読める']
console.log('書いて →', deconjugate('書いて'));         // ['書く']
console.log('飲んだ →', deconjugate('飲んだ'));         // ['飲む']

// Adjective conjugations
console.log('高くない →', deconjugate('高くない'));     // ['高い']
console.log('美しかった →', deconjugate('美しかった')); // ['美しい']
console.log('早く →', deconjugate('早く'));             // ['早い']

// ============================================================================
// Example 2: Detailed Results with Confidence Scores
// ============================================================================

console.log('\n=== Example 2: Detailed Results ===');

const detailedResults = deconjugateDetailed('高くない');
console.log('高くない detailed results:');
detailedResults.forEach(result => {
  console.log(`  ${result.base} (${result.conjugationType}) - confidence: ${result.confidence}`);
});

// ============================================================================
// Example 3: Handling Multiple Possibilities
// ============================================================================

console.log('\n=== Example 3: Multiple Possibilities ===');

// Some conjugations can come from multiple base forms
const ambiguous = deconjugate('書きます');
console.log('書きます could be from:', ambiguous);
// Might include: 書く (most likely), 書る (less likely)

// ============================================================================
// Example 4: Integration with Search
// ============================================================================

console.log('\n=== Example 4: Search Integration ===');

async function searchWithDeconjugation(query: string) {
  // First try direct search
  let results = await searchDatabase(query);
  
  if (results.length === 0) {
    console.log(`No direct results for "${query}", trying deconjugation...`);
    
    // Get deconjugated forms
    const baseForms = deconjugate(query);
    console.log('Deconjugated forms:', baseForms);
    
    // Search with each base form
    for (const baseForm of baseForms) {
      const baseResults = await searchDatabase(baseForm);
      results = results.concat(baseResults);
    }
    
    // Remove duplicates
    results = deduplicateResults(results);
  }
  
  return results;
}

// Mock search function (replace with actual database search)
async function searchDatabase(query: string): Promise<any[]> {
  // This would be your actual database search
  console.log(`Searching database for: ${query}`);
  return [];
}

// Mock deduplication function
function deduplicateResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// ============================================================================
// Example 5: React Component Usage
// ============================================================================

console.log('\n=== Example 5: React Component ===');

/*
import React, { useState } from 'react';
import { View, TextInput, Text, FlatList } from 'react-native';
import { useDeconjugationSearch } from '@/hooks/useDeconjugationSearch';

function SearchScreen() {
  const [query, setQuery] = useState('');
  const { search, isSearching } = useDeconjugationSearch();
  const [results, setResults] = useState([]);
  const [usedDeconjugation, setUsedDeconjugation] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    const result = await search(text);
    
    setResults([...result.vocab, ...result.kanji, ...result.grammar]);
    setUsedDeconjugation(result.usedDeconjugation);
    
    if (result.usedDeconjugation) {
      console.log('Deconjugated to:', result.deconjugatedForms);
    }
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={handleSearch}
        placeholder="Search..."
      />
      
      {usedDeconjugation && (
        <Text style={{ color: 'orange' }}>
          Results found using deconjugation
        </Text>
      )}
      
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <Text>{item.kana || item.char || item.pattern}</Text>
        )}
      />
    </View>
  );
}
*/

// ============================================================================
// Example 6: Testing Different Conjugation Types
// ============================================================================

console.log('\n=== Example 6: Testing Conjugation Types ===');

const testCases = [
  // Masu form
  { input: '食べます', expected: '食べる', type: 'ます形' },
  { input: '書きます', expected: '書く', type: 'ます形' },
  
  // Te form
  { input: '食べて', expected: '食べる', type: 'て形' },
  { input: '書いて', expected: '書く', type: 'て形' },
  
  // Negative
  { input: '食べない', expected: '食べる', type: 'ない形' },
  { input: '書かない', expected: '書く', type: 'ない形' },
  
  // Past
  { input: '食べた', expected: '食べる', type: 'た形' },
  { input: '書いた', expected: '書く', type: 'た形' },
  
  // Potential
  { input: '食べられる', expected: '食べる', type: '可能形' },
  { input: '書ける', expected: '書く', type: '可能形' },
  
  // Adjectives
  { input: '高くない', expected: '高い', type: 'くない' },
  { input: '高かった', expected: '高い', type: 'かった' },
];

testCases.forEach(({ input, expected, type }) => {
  const results = deconjugate(input);
  const found = results.includes(expected);
  console.log(`${type}: ${input} → ${expected} ${found ? '✓' : '✗'}`);
});

// ============================================================================
// Example 7: Error Handling
// ============================================================================

console.log('\n=== Example 7: Error Handling ===');

// Empty string
console.log('Empty string:', deconjugate(''));  // []

// Non-Japanese text
console.log('English text:', deconjugate('hello'));  // []

// Already dictionary form
console.log('Dictionary form:', deconjugate('食べる'));  // May return some results

// Very short input
console.log('Single character:', deconjugate('食'));  // []

console.log('\n=== Examples Complete ===');
