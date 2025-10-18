
# Japanese Deconjugation - Quick Reference

## Quick Start

### Import and Use

```typescript
import { deconjugate } from '@/utils/deconjugate';

// Get possible base forms
const baseForms = deconjugate('食べました');
console.log(baseForms); // ['食べる']
```

### Use in React Component

```typescript
import { useDeconjugationSearch } from '@/hooks/useDeconjugationSearch';

function MyComponent() {
  const { search, isSearching } = useDeconjugationSearch();
  
  const handleSearch = async (query: string) => {
    const result = await search(query);
    // result.vocab, result.kanji, result.grammar
    // result.usedDeconjugation, result.deconjugatedForms
  };
}
```

## Common Conjugation Patterns

### Verbs

| Conjugation | Example | Base Form | Pattern |
|-------------|---------|-----------|---------|
| ます形 | 食べます | 食べる | -ます → -る |
| て形 | 食べて | 食べる | -て → -る |
| た形 | 食べた | 食べる | -た → -る |
| ない形 | 食べない | 食べる | -ない → -る |
| 可能形 | 食べられる | 食べる | -られる → -る |
| 使役形 | 食べさせる | 食べる | -させる → -る |
| 条件形 | 食べれば | 食べる | -れば → -る |
| 意向形 | 食べよう | 食べる | -よう → -る |

### Adjectives

| Conjugation | Example | Base Form | Pattern |
|-------------|---------|-----------|---------|
| くない | 高くない | 高い | -くない → -い |
| かった | 高かった | 高い | -かった → -い |
| くて | 高くて | 高い | -くて → -い |
| く | 高く | 高い | -く → -い |
| ければ | 高ければ | 高い | -ければ → -い |

## API Reference

### `deconjugate(query: string): string[]`

Returns array of possible base forms.

**Parameters:**
- `query` - Conjugated Japanese word

**Returns:**
- Array of possible dictionary forms (deduplicated, sorted by confidence)

**Example:**
```typescript
deconjugate('食べました') // ['食べる']
deconjugate('高くない')   // ['高い']
deconjugate('書きます')   // ['書く', '書る']
```

### `deconjugateDetailed(query: string): DeconjugationResult[]`

Returns detailed results with conjugation type and confidence.

**Parameters:**
- `query` - Conjugated Japanese word

**Returns:**
- Array of `DeconjugationResult` objects

**Example:**
```typescript
const results = deconjugateDetailed('高くない');
// [
//   {
//     original: '高くない',
//     base: '高い',
//     conjugationType: 'くない→い',
//     confidence: 0.95
//   }
// ]
```

### `useDeconjugationSearch()`

React hook for search with automatic deconjugation.

**Returns:**
- `search(query: string): Promise<DeconjugationSearchResult>`
- `isSearching: boolean`

**Example:**
```typescript
const { search, isSearching } = useDeconjugationSearch();

const result = await search('食べました');
// {
//   vocab: [...],
//   kanji: [...],
//   grammar: [...],
//   usedDeconjugation: true,
//   deconjugatedForms: ['食べる']
// }
```

## Type Definitions

```typescript
interface DeconjugationResult {
  original: string;        // Original conjugated form
  base: string;           // Dictionary form
  conjugationType: string; // e.g., "ます形→る"
  confidence: number;     // 0.0 - 1.0
}

interface DeconjugationSearchResult {
  vocab: Vocab[];
  kanji: Kanji[];
  grammar: Grammar[];
  usedDeconjugation: boolean;
  deconjugatedForms: string[];
}
```

## Confidence Levels

| Score | Meaning | Example |
|-------|---------|---------|
| 0.95 | Highly confident | くない → い |
| 0.9 | Very confident | かった → い |
| 0.85 | Confident | られる → る (ichidan) |
| 0.8 | Moderately confident | て form |
| 0.7 | Less confident | Ambiguous godan |

## Testing

```typescript
import { deconjugate } from '@/utils/deconjugate';

describe('My tests', () => {
  test('deconjugates correctly', () => {
    expect(deconjugate('食べました')).toContain('食べる');
  });
});
```

## Common Issues

### Issue: No results for conjugated form
**Solution:** The deconjugation hook automatically handles this. Use `useDeconjugationSearch` instead of direct database queries.

### Issue: Multiple possible base forms
**Solution:** This is expected for ambiguous conjugations. The system searches all possibilities and merges results.

### Issue: False positives
**Solution:** Check the confidence score. Lower confidence results may be false positives.

## Performance Tips

1. **Use the hook**: `useDeconjugationSearch` is optimized
2. **Lazy evaluation**: Deconjugation only runs when needed
3. **Caching**: Results are cached at database level
4. **Parallel searches**: Multiple base forms searched simultaneously

## Examples

### Example 1: Basic Search
```typescript
const results = deconjugate('食べました');
// ['食べる']
```

### Example 2: Multiple Possibilities
```typescript
const results = deconjugate('書きます');
// ['書く', '書る'] - godan and ichidan possibilities
```

### Example 3: Adjective
```typescript
const results = deconjugate('高くない');
// ['高い']
```

### Example 4: Complex Conjugation
```typescript
const results = deconjugate('食べなかった');
// ['食べる'] - past negative
```

### Example 5: React Component
```typescript
function SearchComponent() {
  const { search } = useDeconjugationSearch();
  const [results, setResults] = useState([]);
  
  const handleSearch = async (query: string) => {
    const result = await search(query);
    setResults(result.vocab);
    
    if (result.usedDeconjugation) {
      console.log('Found via deconjugation:', result.deconjugatedForms);
    }
  };
  
  return (/* ... */);
}
```

## Resources

- Full Documentation: `docs/DECONJUGATION.md`
- Implementation Details: `docs/IMPLEMENTATION_SUMMARY.md`
- Test Examples: `utils/__tests__/deconjugate.test.ts`
- Usage Examples: `examples/deconjugation-example.ts`
