
# Japanese Deconjugation Feature

## Overview

The deconjugation feature automatically detects conjugated Japanese verbs and adjectives in search queries and attempts to find their dictionary (base) forms. This significantly improves search results when users search for conjugated forms.

## Architecture

### Core Components

1. **`utils/deconjugate.ts`** - Core deconjugation logic
   - `deconjugate(query: string): string[]` - Returns array of possible base forms
   - `deconjugateDetailed(query: string): DeconjugationResult[]` - Returns detailed results with conjugation types and confidence scores

2. **`hooks/useDeconjugationSearch.ts`** - React hook for search with automatic deconjugation
   - Performs initial direct search
   - Falls back to deconjugation if no results found
   - Merges and deduplicates results
   - Returns metadata about whether deconjugation was used

3. **`app/(tabs)/(home)/index.tsx`** - Updated search UI
   - Uses `useDeconjugationSearch` hook
   - Displays deconjugation banner when fallback is used
   - Highlights deconjugated terms with "(đã khử chia)" label

## Supported Conjugations

### Verbs (動詞)

#### Godan Verbs (五段動詞)
- **ます形** (masu form): 書きます → 書く
- **て形** (te form): 書いて → 書く
- **た形** (past): 書いた → 書く
- **ない形** (negative): 書かない → 書く
- **可能形** (potential): 書ける → 書く
- **条件形** (conditional): 書けば → 書く
- **意向形** (volitional): 書こう → 書く

#### Ichidan Verbs (一段動詞)
- **ます形**: 食べます → 食べる
- **て形**: 食べて → 食べる
- **た形**: 食べた → 食べる
- **ない形**: 食べない → 食べる
- **可能形/受身形**: 食べられる → 食べる
- **使役形**: 食べさせる → 食べる
- **条件形**: 食べれば → 食べる
- **意向形**: 食べよう → 食べる

### Adjectives (形容詞)

#### い-Adjectives (い形容詞)
- **くない** (negative): 高くない → 高い
- **かった** (past): 高かった → 高い
- **くて** (te form): 高くて → 高い
- **く** (adverbial): 高く → 高い
- **ければ** (conditional): 高ければ → 高い
- **くなかった** (past negative): 高くなかった → 高い

#### な-Adjectives (な形容詞)
- **じゃない/ではない** (negative): きれいじゃない → きれい
- **だった** (past): きれいだった → きれい

## Usage Examples

### Basic Usage

```typescript
import { deconjugate } from '@/utils/deconjugate';

// Simple deconjugation
const results = deconjugate('食べました');
console.log(results); // ['食べる']

// Multiple possibilities
const results2 = deconjugate('書きます');
console.log(results2); // ['書く', '書る'] (godan and ichidan possibilities)
```

### Detailed Results

```typescript
import { deconjugateDetailed } from '@/utils/deconjugate';

const results = deconjugateDetailed('高くない');
console.log(results);
// [
//   {
//     original: '高くない',
//     base: '高い',
//     conjugationType: 'くない→い',
//     confidence: 0.95
//   }
// ]
```

### Using the Hook

```typescript
import { useDeconjugationSearch } from '@/hooks/useDeconjugationSearch';

function SearchComponent() {
  const { search, isSearching } = useDeconjugationSearch();
  
  const handleSearch = async (query: string) => {
    const result = await search(query);
    
    if (result.usedDeconjugation) {
      console.log('Used deconjugation!');
      console.log('Found base forms:', result.deconjugatedForms);
    }
    
    console.log('Vocab results:', result.vocab);
    console.log('Kanji results:', result.kanji);
    console.log('Grammar results:', result.grammar);
  };
  
  return (
    // ... UI code
  );
}
```

## Algorithm Details

### Confidence Scoring

Each deconjugation result includes a confidence score (0.0 - 1.0):

- **0.95**: Highly confident (e.g., くない → い for adjectives)
- **0.9**: Very confident (e.g., かった → い, specific verb patterns)
- **0.85**: Confident (e.g., られる → る for ichidan verbs)
- **0.8**: Moderately confident (e.g., て form conversions)
- **0.7**: Less confident (e.g., ambiguous godan endings)

### Deduplication

When multiple conjugation rules produce the same base form, only the highest confidence result is kept.

### Search Flow

1. User enters search query (e.g., "食べました")
2. System performs direct search in database
3. If no results found:
   - Apply deconjugation rules
   - Get possible base forms (e.g., ["食べる"])
   - Search database with each base form
   - Merge and deduplicate results
   - Mark results as using deconjugation
4. Display results with appropriate labels

## UI Indicators

### Deconjugation Banner

When deconjugation is used, a banner appears at the top of search results:

```
💡 Đã tự động khử chia động từ/tính từ
   Tìm thấy kết quả cho: 食べる
```

### Highlight Labels

Matched deconjugated terms are highlighted with a label:

```
食べる (đã khử chia)
```

## Testing

Run the test suite:

```bash
npm test utils/__tests__/deconjugate.test.ts
```

Test coverage includes:
- All major verb conjugation patterns
- All adjective conjugation patterns
- Edge cases (empty strings, non-Japanese text)
- Confidence scoring
- Deduplication

## Performance Considerations

- Deconjugation only runs when direct search returns no results
- Results are cached at the database level
- Deduplication prevents redundant database queries
- Confidence scoring prioritizes most likely results

## Future Improvements

Potential enhancements:

1. **Machine Learning**: Train a model on real conjugation data for better accuracy
2. **Context Awareness**: Use surrounding text to disambiguate verb types
3. **Kanji Variants**: Handle different kanji representations of the same word
4. **Compound Verbs**: Support complex verb constructions (e.g., 食べてしまう)
5. **Irregular Verbs**: Add special handling for する, 来る, etc.
6. **User Feedback**: Allow users to report incorrect deconjugations

## Limitations

Current limitations:

- Cannot distinguish between godan and ichidan verbs without context
- Does not handle irregular verbs (する, 来る) specially
- May produce false positives for short queries
- Does not consider kanji/kana variations
- Limited support for compound verb forms

## References

- [Japanese Verb Conjugation Guide](https://www.tofugu.com/japanese-grammar/verb-conjugation-groups/)
- [Japanese Adjective Conjugation](https://www.tofugu.com/japanese-grammar/i-adjectives/)
- [Jisho.org API](https://jisho.org/api) - Inspiration for deconjugation patterns
