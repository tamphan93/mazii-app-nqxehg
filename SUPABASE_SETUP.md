
# Supabase Setup Guide

This document explains how the Supabase integration is configured in this app.

## Environment Variables

The app uses environment variables to configure the Supabase connection. These are stored in the `.env` file at the root of the project.

### Required Variables

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public API key

### Setup Steps

1. **Environment File**: The `.env` file has been created with your project's credentials:
   - URL: `https://rsuokhpbunisxmcpbmum.supabase.co`
   - Anon Key: Already configured

2. **Security**: The `.env` file is already listed in `.gitignore` to prevent committing sensitive credentials.

3. **Fallback Configuration**: The Supabase client (`app/integrations/supabase/client.ts`) includes hardcoded fallback values, so the app will work even if environment variables fail to load.

## How It Works

The Supabase client initialization follows this priority:

1. First, tries to read from `Constants.expoConfig.extra` (configured in `app.json`)
2. Then, tries to read from `process.env.EXPO_PUBLIC_*` variables
3. Finally, falls back to hardcoded values

This ensures the app always has valid Supabase credentials.

## Troubleshooting

If you see the error "supabaseKey is required":

1. **Check .env file exists**: Make sure `.env` file is in the project root
2. **Restart Expo**: After creating/modifying `.env`, restart the Expo dev server:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```
3. **Clear cache**: If issues persist, clear the Expo cache:
   ```bash
   npx expo start --clear
   ```

## Database Tables

The app uses the following Supabase tables with Row Level Security (RLS) enabled:

- `users`: User profiles
- `cards`: Flashcards for spaced repetition
- `decks`: JLPT level decks
- `history`: User's search/view history
- `reviews`: Flashcard review history

All tables have RLS policies that ensure users can only access their own data.

## Sync Functionality

The app implements two-way sync between local SQLite and Supabase:

- **Offline-first**: All data is stored locally in SQLite
- **Cloud sync**: When online, data syncs to Supabase
- **Conflict resolution**: Server data wins if `updated_at` is newer

Sync is triggered:
- Manually from the Profile screen
- Automatically when the app comes online (future enhancement)
