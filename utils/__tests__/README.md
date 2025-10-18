
# Japanese Deconjugation Tests

This directory contains unit tests for the Japanese deconjugation utility.

## Running Tests

To run the tests, you'll need to set up Jest in your project:

```bash
npm install --save-dev jest @types/jest ts-jest
```

Then add to your package.json:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ]
  }
}
```

Run tests:
```bash
npm test
```

## Test Coverage

The tests cover:

- **Verb Conjugations**: ます形, て形, た形, ない形, 可能形, 受身形, 使役形, 条件形, 意向形
- **Adjective Conjugations**: い-adjectives (くない, かった, くて, く, ければ) and な-adjectives
- **Edge Cases**: Empty strings, dictionary forms, non-Japanese text

## Example Test Cases

- 食べました → 食べる (ichidan verb, past masu form)
- 読めない → 読む (godan verb, potential negative)
- 高くない → 高い (i-adjective, negative)
