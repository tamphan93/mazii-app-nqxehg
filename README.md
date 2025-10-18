
# Mazii - Japanese Dictionary App

A comprehensive Japanese dictionary app with flashcard SRS, offline caching, OCR scanning, and cloud synchronization.

## Features

- **Dictionary Search**: Search for vocabulary, kanji, and grammar patterns
- **Deconjugation**: Automatically deconjugate Japanese verbs and adjectives
- **JLPT Decks**: Pre-configured flashcard decks for N5-N1 levels
- **SRS Flashcards**: Spaced repetition system for effective learning
- **History Tracking**: Track your search history (vocab/kanji/grammar)
- **Cloud Sync**: Two-way synchronization with Supabase
- **OCR Scanning**: Extract Japanese text from images
- **TTS**: Text-to-speech for pronunciation
- **Offline Support**: SQLite caching for offline access
- **Furigana & Pitch Accent**: Display reading aids and pitch patterns

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://rsuokhpbunisxmcpbmum.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Never commit your `.env` file to version control. Add it to `.gitignore`.

### 2. Supabase Configuration

The app uses Supabase for cloud storage and synchronization. The following tables are automatically created with RLS policies:

#### Tables

- **users**: User profiles linked to auth.users
- **decks**: JLPT flashcard decks (N5-N1)
- **cards**: User flashcards with SRS data
- **reviews**: Review history for analytics
- **history**: Search history (vocab/kanji/grammar)

#### RLS Policies

All tables have Row Level Security enabled:

- **users**: Users can only view/update their own profile
- **decks**: Public read access (default decks)
- **cards**: Users can only access their own cards
- **reviews**: Users can only access their own reviews
- **history**: Users can only access their own history

To view RLS policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'cards';
SELECT * FROM pg_policies WHERE tablename = 'history';
SELECT * FROM pg_policies WHERE tablename = 'reviews';
```

### 3. Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on specific platform
npm run ios
npm run android
npm run web
```

## Cloud Synchronization

The app implements two-way sync between local SQLite and Supabase:

### Sync Strategy

- **Conflict Resolution**: Server data wins if `updated_at` is newer
- **Automatic Sync**: Triggered on app launch and manual sync button
- **Offline First**: All operations work offline, sync when online

### Sync Functions

```typescript
import { performFullSync, syncFlashcards, syncHistory } from '@/utils/sync';

// Full sync (decks + flashcards + history)
await performFullSync();

// Sync only flashcards
await syncFlashcards();

// Sync only history
await syncHistory();
```

### Manual Sync

Users can manually trigger sync from the Profile screen:

1. Go to Profile tab
2. Tap "Đồng bộ với cloud"
3. Wait for sync to complete

## JLPT Decks

Default decks are automatically seeded in Supabase:

- **N5**: Basic vocabulary (20-50 words)
- **N4**: Elementary vocabulary
- **N3**: Intermediate vocabulary
- **N2**: Upper-intermediate vocabulary
- **N1**: Advanced vocabulary

### Adding Cards to Decks

When adding a flashcard, users can select which deck to add it to:

1. View vocab/kanji/grammar detail
2. Tap the "+" button
3. Select a deck from the modal
4. Card is added to the selected deck

### Deck Progress

The Study screen shows progress for each deck:

- Total cards in deck
- Cards due for review
- Filter by deck when studying

## History Tracking

The app tracks all viewed items:

### Local History (SQLite)

```typescript
import { addHistory, getHistory, clearHistory } from '@/utils/database';

// Add history entry
await addHistory({
  type: 'vocab',
  targetId: 'v1',
  viewedAt: new Date().toISOString(),
});

// Get history (optional type filter)
const history = await getHistory('vocab', 50);

// Clear history
await clearHistory('vocab'); // or undefined for all
```

### Cloud History (Supabase)

History is automatically synced to Supabase when online. Users can view their history across devices.

### History Screen

Access from Profile > Lịch sử:

- Filter by type (all/vocab/kanji/grammar)
- View timestamp and item details
- Tap to navigate to item detail
- Clear history by type

## Database Schema

### SQLite (Local)

```sql
-- Flashcards with deck support
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  userId TEXT,
  deckId TEXT,
  type TEXT NOT NULL,
  targetId TEXT NOT NULL,
  dueAt TEXT NOT NULL,
  interval INTEGER NOT NULL,
  ease INTEGER NOT NULL DEFAULT 250,
  repetitions INTEGER NOT NULL DEFAULT 0,
  lastReviewed TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- History tracking
CREATE TABLE history (
  id TEXT PRIMARY KEY,
  userId TEXT,
  type TEXT NOT NULL,
  targetId TEXT NOT NULL,
  viewedAt TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Decks
CREATE TABLE decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jlptLevel TEXT NOT NULL,
  description TEXT,
  isDefault INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Supabase (Cloud)

See migration files for complete schema. Key differences:

- UUID primary keys
- Foreign key constraints to users table
- RLS policies for security
- Timestamps with timezone (TIMESTAMPTZ)

## API Integration

### Supabase Client

```typescript
import { supabase } from '@/integrations/supabase/client';

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Query cards
const { data: cards } = await supabase
  .from('cards')
  .select('*')
  .eq('user_id', userId);

// Insert history
const { error } = await supabase
  .from('history')
  .insert({
    user_id: userId,
    type: 'vocab',
    target_id: 'v1',
  });
```

## Development

### Project Structure

```
app/
  ├── (tabs)/
  │   ├── (home)/
  │   │   └── index.tsx       # Search screen
  │   ├── study.tsx           # Flashcard review with deck filtering
  │   └── profile.tsx         # Settings & sync
  ├── vocab/[id].tsx          # Vocab detail with history
  ├── kanji/[id].tsx          # Kanji detail with history
  ├── grammar/[id].tsx        # Grammar detail with history
  ├── history.tsx             # History screen
  ├── scan.tsx                # OCR scanning
  └── integrations/
      └── supabase/
          ├── client.ts       # Supabase client (ENV-based)
          └── types.ts        # Database types

utils/
  ├── database.ts             # SQLite operations
  ├── sync.ts                 # Cloud sync logic
  ├── srs.ts                  # SRS algorithm
  ├── deconjugate.ts          # Deconjugation engine
  ├── ocr.ts                  # OCR utilities
  └── tts.ts                  # Text-to-speech

types/
  └── dictionary.ts           # TypeScript interfaces
```

### Adding New Features

1. **Local-first**: Implement in SQLite first
2. **Cloud sync**: Add Supabase table and sync logic
3. **RLS**: Always enable RLS and create policies
4. **Types**: Update TypeScript interfaces
5. **UI**: Create/update screens and components

## Troubleshooting

### Sync Issues

- Check internet connection
- Verify Supabase credentials in `.env`
- Check RLS policies in Supabase dashboard
- View logs in Profile > Đồng bộ với cloud

### Database Issues

- Clear app data and reinstall
- Check SQLite initialization in `utils/database.ts`
- Verify migrations in Supabase dashboard

### Authentication Issues

- Ensure user is logged in
- Check `users` table has entry for auth user
- Verify RLS policies allow user access

## License

MIT
