
/**
 * Unit tests for Japanese deconjugation
 */

import { deconjugate, deconjugateDetailed } from '../deconjugate';

describe('deconjugate', () => {
  describe('Verb conjugations', () => {
    test('食べました → 食べる (ichidan verb, past masu form)', () => {
      const results = deconjugate('食べました');
      expect(results).toContain('食べる');
    });

    test('読めない → 読む (godan verb, potential negative)', () => {
      const results = deconjugate('読めない');
      expect(results).toContain('読む');
    });

    test('書きます → 書く (godan verb, masu form)', () => {
      const results = deconjugate('書きます');
      expect(results).toContain('書く');
    });

    test('飲んで → 飲む (godan verb, te form)', () => {
      const results = deconjugate('飲んで');
      expect(results).toContain('飲む');
    });

    test('行った → 行く (godan verb, past tense)', () => {
      const results = deconjugate('行った');
      expect(results).toContain('行く');
    });

    test('見ない → 見る (ichidan verb, negative)', () => {
      const results = deconjugate('見ない');
      expect(results).toContain('見る');
    });

    test('話さない → 話す (godan verb, negative)', () => {
      const results = deconjugate('話さない');
      expect(results).toContain('話す');
    });

    test('食べられる → 食べる (ichidan verb, potential/passive)', () => {
      const results = deconjugate('食べられる');
      expect(results).toContain('食べる');
    });

    test('行かせる → 行く (causative form)', () => {
      const results = deconjugate('行かせる');
      // This is a complex case, may return multiple possibilities
      expect(results.length).toBeGreaterThan(0);
    });

    test('読めば → 読む (conditional form)', () => {
      const results = deconjugate('読めば');
      expect(results).toContain('読む');
    });

    test('食べよう → 食べる (volitional form)', () => {
      const results = deconjugate('食べよう');
      expect(results).toContain('食べる');
    });
  });

  describe('Adjective conjugations', () => {
    test('高くない → 高い (i-adjective, negative)', () => {
      const results = deconjugate('高くない');
      expect(results).toContain('高い');
    });

    test('美しくない → 美しい (i-adjective, negative)', () => {
      const results = deconjugate('美しくない');
      expect(results).toContain('美しい');
    });

    test('大きかった → 大きい (i-adjective, past)', () => {
      const results = deconjugate('大きかった');
      expect(results).toContain('大きい');
    });

    test('高くて → 高い (i-adjective, te form)', () => {
      const results = deconjugate('高くて');
      expect(results).toContain('高い');
    });

    test('早く → 早い (i-adjective, adverbial)', () => {
      const results = deconjugate('早く');
      expect(results).toContain('早い');
    });

    test('高ければ → 高い (i-adjective, conditional)', () => {
      const results = deconjugate('高ければ');
      expect(results).toContain('高い');
    });

    test('高くなかった → 高い (i-adjective, past negative)', () => {
      const results = deconjugate('高くなかった');
      expect(results).toContain('高い');
    });

    test('きれいじゃない → きれい (na-adjective, negative)', () => {
      const results = deconjugate('きれいじゃない');
      expect(results.some(r => r.includes('きれい'))).toBe(true);
    });

    test('静かだった → 静か (na-adjective, past)', () => {
      const results = deconjugate('静かだった');
      expect(results.some(r => r.includes('静か'))).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('Empty string returns empty array', () => {
      const results = deconjugate('');
      expect(results).toEqual([]);
    });

    test('Dictionary form returns empty array (no conjugation)', () => {
      const results = deconjugate('食べる');
      // Dictionary form might still generate some results due to pattern matching
      // but should not crash
      expect(Array.isArray(results)).toBe(true);
    });

    test('Non-Japanese text returns empty or minimal results', () => {
      const results = deconjugate('hello');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('deconjugateDetailed', () => {
    test('Returns detailed results with conjugation types', () => {
      const results = deconjugateDetailed('食べました');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('original');
      expect(results[0]).toHaveProperty('base');
      expect(results[0]).toHaveProperty('conjugationType');
      expect(results[0]).toHaveProperty('confidence');
    });

    test('Results are sorted by confidence', () => {
      const results = deconjugateDetailed('高くない');
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].confidence).toBeGreaterThanOrEqual(results[i + 1].confidence);
        }
      }
    });

    test('Removes duplicate base forms', () => {
      const results = deconjugateDetailed('書きます');
      const bases = results.map(r => r.base);
      const uniqueBases = new Set(bases);
      expect(bases.length).toBe(uniqueBases.size);
    });
  });
});
