
/**
 * Japanese Deconjugation Utility
 * Handles verb and adjective conjugation reversal to improve search results
 */

import { DeconjugationResult } from '@/types/dictionary';

/**
 * Main deconjugation function that returns possible base forms
 * @param query - The conjugated Japanese word
 * @returns Array of possible base forms (dictionary forms)
 */
export function deconjugate(query: string): string[] {
  if (!query || query.length === 0) {
    return [];
  }

  const results: DeconjugationResult[] = [];

  // Apply all deconjugation rules
  results.push(...deconjugateVerbs(query));
  results.push(...deconjugateAdjectives(query));

  // Sort by confidence and remove duplicates
  const uniqueBases = new Set<string>();
  results
    .sort((a, b) => b.confidence - a.confidence)
    .forEach(result => uniqueBases.add(result.base));

  return Array.from(uniqueBases);
}

/**
 * Deconjugate verb forms
 */
function deconjugateVerbs(word: string): DeconjugationResult[] {
  const results: DeconjugationResult[] = [];

  // ます形 (masu form) → dictionary form
  if (word.endsWith('ます')) {
    const stem = word.slice(0, -2);
    // Group 1 verbs (godan)
    results.push({
      original: word,
      base: stem + 'う',
      conjugationType: 'ます形→う',
      confidence: 0.7
    });
    results.push({
      original: word,
      base: stem + 'く',
      conjugationType: 'ます形→く',
      confidence: 0.7
    });
    results.push({
      original: word,
      base: stem + 'ぐ',
      conjugationType: 'ます形→ぐ',
      confidence: 0.7
    });
    results.push({
      original: word,
      base: stem + 'す',
      conjugationType: 'ます形→す',
      confidence: 0.7
    });
    results.push({
      original: word,
      base: stem + 'つ',
      conjugationType: 'ます形→つ',
      confidence: 0.7
    });
    results.push({
      original: word,
      base: stem + 'ぬ',
      conjugationType: 'ます形→ぬ',
      confidence: 0.7
    });
    results.push({
      original: word,
      base: stem + 'ぶ',
      conjugationType: 'ます形→ぶ',
      confidence: 0.7
    });
    results.push({
      original: word,
      base: stem + 'む',
      conjugationType: 'ます形→む',
      confidence: 0.7
    });
    results.push({
      original: word,
      base: stem + 'る',
      conjugationType: 'ます形→る',
      confidence: 0.7
    });
    // Group 2 verbs (ichidan)
    results.push({
      original: word,
      base: stem + 'る',
      conjugationType: 'ます形→る(一段)',
      confidence: 0.8
    });
  }

  // ました (past masu form)
  if (word.endsWith('ました')) {
    const stem = word.slice(0, -3);
    results.push(...deconjugateVerbs(stem + 'ます'));
  }

  // ません (negative masu form)
  if (word.endsWith('ません')) {
    const stem = word.slice(0, -3);
    results.push(...deconjugateVerbs(stem + 'ます'));
  }

  // ませんでした (past negative masu form)
  if (word.endsWith('ませんでした')) {
    const stem = word.slice(0, -6);
    results.push(...deconjugateVerbs(stem + 'ます'));
  }

  // て形 (te form)
  if (word.endsWith('て')) {
    const stem = word.slice(0, -1);
    // いて → く
    if (stem.endsWith('い')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'く',
        conjugationType: 'て形→く',
        confidence: 0.8
      });
    }
    // いで → ぐ
    if (stem.endsWith('い') && word.endsWith('で')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'ぐ',
        conjugationType: 'て形→ぐ',
        confidence: 0.8
      });
    }
    // して → す
    if (stem.endsWith('し')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'す',
        conjugationType: 'て形→す',
        confidence: 0.9
      });
    }
    // って → う/つ/る
    if (stem.endsWith('っ')) {
      const base = stem.slice(0, -1);
      results.push({
        original: word,
        base: base + 'う',
        conjugationType: 'て形→う',
        confidence: 0.7
      });
      results.push({
        original: word,
        base: base + 'つ',
        conjugationType: 'て形→つ',
        confidence: 0.7
      });
      results.push({
        original: word,
        base: base + 'る',
        conjugationType: 'て形→る',
        confidence: 0.7
      });
    }
    // んで → ぬ/ぶ/む
    if (stem.endsWith('ん') && word.endsWith('で')) {
      const base = stem.slice(0, -1);
      results.push({
        original: word,
        base: base + 'ぬ',
        conjugationType: 'て形→ぬ',
        confidence: 0.7
      });
      results.push({
        original: word,
        base: base + 'ぶ',
        conjugationType: 'て形→ぶ',
        confidence: 0.7
      });
      results.push({
        original: word,
        base: base + 'む',
        conjugationType: 'て形→む',
        confidence: 0.7
      });
    }
    // Ichidan verbs
    results.push({
      original: word,
      base: stem + 'る',
      conjugationType: 'て形→る(一段)',
      confidence: 0.8
    });
  }

  // た形 (ta form / past tense)
  if (word.endsWith('た')) {
    const teForm = word.slice(0, -1) + 'て';
    results.push(...deconjugateVerbs(teForm));
  }

  // だ (da form)
  if (word.endsWith('だ')) {
    const deForm = word.slice(0, -1) + 'で';
    results.push(...deconjugateVerbs(deForm));
  }

  // ない形 (negative form)
  if (word.endsWith('ない')) {
    const stem = word.slice(0, -2);
    // あない → う
    if (stem.endsWith('わ')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'う',
        conjugationType: 'ない形→う',
        confidence: 0.9
      });
    }
    // かない → く
    if (stem.endsWith('か')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'く',
        conjugationType: 'ない形→く',
        confidence: 0.9
      });
    }
    // がない → ぐ
    if (stem.endsWith('が')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'ぐ',
        conjugationType: 'ない形→ぐ',
        confidence: 0.9
      });
    }
    // さない → す
    if (stem.endsWith('さ')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'す',
        conjugationType: 'ない形→す',
        confidence: 0.9
      });
    }
    // たない → つ
    if (stem.endsWith('た')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'つ',
        conjugationType: 'ない形→つ',
        confidence: 0.9
      });
    }
    // なない → ぬ
    if (stem.endsWith('な')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'ぬ',
        conjugationType: 'ない形→ぬ',
        confidence: 0.9
      });
    }
    // ばない → ぶ
    if (stem.endsWith('ば')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'ぶ',
        conjugationType: 'ない形→ぶ',
        confidence: 0.9
      });
    }
    // まない → む
    if (stem.endsWith('ま')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'む',
        conjugationType: 'ない形→む',
        confidence: 0.9
      });
    }
    // らない → る
    if (stem.endsWith('ら')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'る',
        conjugationType: 'ない形→る',
        confidence: 0.9
      });
    }
    // Ichidan verbs
    results.push({
      original: word,
      base: stem + 'る',
      conjugationType: 'ない形→る(一段)',
      confidence: 0.8
    });
  }

  // なかった (past negative)
  if (word.endsWith('なかった')) {
    const stem = word.slice(0, -4);
    results.push(...deconjugateVerbs(stem + 'ない'));
  }

  // 可能形 (potential form) - られる/れる
  if (word.endsWith('られる')) {
    const stem = word.slice(0, -3);
    results.push({
      original: word,
      base: stem + 'る',
      conjugationType: '可能形→る',
      confidence: 0.85
    });
  }

  if (word.endsWith('れる')) {
    const stem = word.slice(0, -2);
    // Could be potential form of godan verbs
    results.push({
      original: word,
      base: stem + 'る',
      conjugationType: '可能形→る',
      confidence: 0.7
    });
  }

  // 受身形 (passive form) - られる/れる
  // Same as potential, context dependent

  // 使役形 (causative form) - させる/せる
  if (word.endsWith('させる')) {
    const stem = word.slice(0, -3);
    results.push({
      original: word,
      base: stem + 'る',
      conjugationType: '使役形→る',
      confidence: 0.85
    });
  }

  if (word.endsWith('せる')) {
    const stem = word.slice(0, -2);
    results.push({
      original: word,
      base: stem + 'す',
      conjugationType: '使役形→す',
      confidence: 0.8
    });
  }

  // 条件形 (conditional form) - ば/たら
  if (word.endsWith('ば')) {
    const stem = word.slice(0, -1);
    // えば → う
    if (stem.endsWith('え')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'う',
        conjugationType: '条件形→う',
        confidence: 0.8
      });
    }
    // けば → く
    if (stem.endsWith('け')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'く',
        conjugationType: '条件形→く',
        confidence: 0.8
      });
    }
    // Ichidan
    if (stem.endsWith('れ')) {
      results.push({
        original: word,
        base: stem.slice(0, -1) + 'る',
        conjugationType: '条件形→る',
        confidence: 0.8
      });
    }
  }

  if (word.endsWith('たら')) {
    const stem = word.slice(0, -2);
    results.push(...deconjugateVerbs(stem + 'た'));
  }

  // 意向形 (volitional form) - よう/おう
  if (word.endsWith('よう')) {
    const stem = word.slice(0, -2);
    results.push({
      original: word,
      base: stem + 'る',
      conjugationType: '意向形→る',
      confidence: 0.8
    });
  }

  if (word.endsWith('おう')) {
    const stem = word.slice(0, -2);
    results.push({
      original: word,
      base: stem + 'う',
      conjugationType: '意向形→う',
      confidence: 0.8
    });
  }

  return results;
}

/**
 * Deconjugate adjective forms
 */
function deconjugateAdjectives(word: string): DeconjugationResult[] {
  const results: DeconjugationResult[] = [];

  // い-adjectives
  // くない (negative)
  if (word.endsWith('くない')) {
    const stem = word.slice(0, -3);
    results.push({
      original: word,
      base: stem + 'い',
      conjugationType: 'くない→い',
      confidence: 0.95
    });
  }

  // くなかった (past negative)
  if (word.endsWith('くなかった')) {
    const stem = word.slice(0, -6);
    results.push({
      original: word,
      base: stem + 'い',
      conjugationType: 'くなかった→い',
      confidence: 0.95
    });
  }

  // かった (past)
  if (word.endsWith('かった')) {
    const stem = word.slice(0, -3);
    results.push({
      original: word,
      base: stem + 'い',
      conjugationType: 'かった→い',
      confidence: 0.9
    });
  }

  // くて (te form)
  if (word.endsWith('くて')) {
    const stem = word.slice(0, -2);
    results.push({
      original: word,
      base: stem + 'い',
      conjugationType: 'くて→い',
      confidence: 0.9
    });
  }

  // く (adverbial)
  if (word.endsWith('く') && word.length > 1) {
    const stem = word.slice(0, -1);
    results.push({
      original: word,
      base: stem + 'い',
      conjugationType: 'く→い',
      confidence: 0.7
    });
  }

  // ければ (conditional)
  if (word.endsWith('ければ')) {
    const stem = word.slice(0, -3);
    results.push({
      original: word,
      base: stem + 'い',
      conjugationType: 'ければ→い',
      confidence: 0.9
    });
  }

  // な-adjectives
  // じゃない/ではない (negative)
  if (word.endsWith('じゃない') || word.endsWith('ではない')) {
    const stem = word.endsWith('じゃない') 
      ? word.slice(0, -4) 
      : word.slice(0, -4);
    results.push({
      original: word,
      base: stem + 'だ',
      conjugationType: 'じゃない→だ',
      confidence: 0.85
    });
    results.push({
      original: word,
      base: stem,
      conjugationType: 'じゃない→な形容詞',
      confidence: 0.85
    });
  }

  // だった (past)
  if (word.endsWith('だった')) {
    const stem = word.slice(0, -3);
    results.push({
      original: word,
      base: stem + 'だ',
      conjugationType: 'だった→だ',
      confidence: 0.85
    });
    results.push({
      original: word,
      base: stem,
      conjugationType: 'だった→な形容詞',
      confidence: 0.85
    });
  }

  return results;
}

/**
 * Get detailed deconjugation results with conjugation type information
 */
export function deconjugateDetailed(query: string): DeconjugationResult[] {
  if (!query || query.length === 0) {
    return [];
  }

  const results: DeconjugationResult[] = [];
  results.push(...deconjugateVerbs(query));
  results.push(...deconjugateAdjectives(query));

  // Remove duplicates and sort by confidence
  const uniqueResults = new Map<string, DeconjugationResult>();
  results.forEach(result => {
    const existing = uniqueResults.get(result.base);
    if (!existing || existing.confidence < result.confidence) {
      uniqueResults.set(result.base, result);
    }
  });

  return Array.from(uniqueResults.values())
    .sort((a, b) => b.confidence - a.confidence);
}
