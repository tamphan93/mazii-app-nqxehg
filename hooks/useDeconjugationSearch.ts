
/**
 * Custom hook for search with automatic deconjugation fallback
 */

import { useState, useCallback } from 'react';
import { deconjugate } from '@/utils/deconjugate';
import {
  searchCachedVocab,
  searchCachedKanji,
  searchCachedGrammar,
} from '@/utils/database';
import { DeconjugationSearchResult } from '@/types/dictionary';

export function useDeconjugationSearch() {
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string): Promise<DeconjugationSearchResult> => {
    if (!query.trim()) {
      return {
        vocab: [],
        kanji: [],
        grammar: [],
        usedDeconjugation: false,
        deconjugatedForms: [],
      };
    }

    setIsSearching(true);

    try {
      // First, try direct search
      const [vocab, kanji, grammar] = await Promise.all([
        searchCachedVocab(query),
        searchCachedKanji(query),
        searchCachedGrammar(query),
      ]);

      // If we have results, return them
      if (vocab.length > 0 || kanji.length > 0 || grammar.length > 0) {
        return {
          vocab,
          kanji,
          grammar,
          usedDeconjugation: false,
          deconjugatedForms: [],
        };
      }

      // No results found, try deconjugation
      console.log('No direct results found, attempting deconjugation...');
      const deconjugatedForms = deconjugate(query);

      if (deconjugatedForms.length === 0) {
        console.log('No deconjugated forms found');
        return {
          vocab: [],
          kanji: [],
          grammar: [],
          usedDeconjugation: false,
          deconjugatedForms: [],
        };
      }

      console.log('Deconjugated forms:', deconjugatedForms);

      // Search with all deconjugated forms
      const deconjugatedResults = await Promise.all(
        deconjugatedForms.map(async (form) => {
          const [v, k, g] = await Promise.all([
            searchCachedVocab(form),
            searchCachedKanji(form),
            searchCachedGrammar(form),
          ]);
          return { vocab: v, kanji: k, grammar: g };
        })
      );

      // Merge and deduplicate results
      const mergedVocab = deduplicateById(
        deconjugatedResults.flatMap(r => r.vocab)
      );
      const mergedKanji = deduplicateById(
        deconjugatedResults.flatMap(r => r.kanji)
      );
      const mergedGrammar = deduplicateById(
        deconjugatedResults.flatMap(r => r.grammar)
      );

      return {
        vocab: mergedVocab,
        kanji: mergedKanji,
        grammar: mergedGrammar,
        usedDeconjugation: true,
        deconjugatedForms,
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        vocab: [],
        kanji: [],
        grammar: [],
        usedDeconjugation: false,
        deconjugatedForms: [],
      };
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    search,
    isSearching,
  };
}

/**
 * Deduplicate array of objects by id
 */
function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}
