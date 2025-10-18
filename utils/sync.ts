
import { supabase } from '@/app/integrations/supabase/client';
import { Platform } from 'react-native';
import {
  getAllFlashcards,
  updateFlashcard,
  addFlashcard,
  getHistory,
  addHistory,
  getAllDecks,
  cacheDeck,
} from './database';
import { Flashcard, HistoryEntry, Deck } from '@/types/dictionary';
import NetInfo from '@react-native-community/netinfo';

// Check if device is online
export const isOnline = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return navigator.onLine;
  }
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

// Get current user ID from Supabase
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Get or create user record
  const { data: userData, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  
  if (error || !userData) {
    // Create user record if it doesn't exist
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        auth_id: user.id,
        email: user.email,
      })
      .select('id')
      .single();
    
    if (insertError || !newUser) {
      console.error('Error creating user record:', insertError);
      return null;
    }
    
    return newUser.id;
  }
  
  return userData.id;
};

// Sync decks from Supabase to local
export const syncDecksFromCloud = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('Sync not available on web');
    return;
  }
  
  try {
    const online = await isOnline();
    if (!online) {
      console.log('Device is offline, skipping deck sync');
      return;
    }
    
    // Fetch all decks from Supabase
    const { data: cloudDecks, error } = await supabase
      .from('decks')
      .select('*')
      .order('jlpt_level', { ascending: false });
    
    if (error) {
      console.error('Error fetching decks from cloud:', error);
      return;
    }
    
    if (!cloudDecks || cloudDecks.length === 0) {
      console.log('No decks found in cloud');
      return;
    }
    
    // Cache each deck locally
    for (const cloudDeck of cloudDecks) {
      const deck: Deck = {
        id: cloudDeck.id,
        name: cloudDeck.name,
        jlptLevel: cloudDeck.jlpt_level,
        description: cloudDeck.description || undefined,
        isDefault: cloudDeck.is_default,
        createdAt: cloudDeck.created_at,
        updatedAt: cloudDeck.updated_at,
      };
      await cacheDeck(deck);
    }
    
    console.log(`Synced ${cloudDecks.length} decks from cloud`);
  } catch (error) {
    console.error('Error syncing decks from cloud:', error);
  }
};

// Sync flashcards: two-way sync with conflict resolution
export const syncFlashcards = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('Sync not available on web');
    return;
  }
  
  try {
    const online = await isOnline();
    if (!online) {
      console.log('Device is offline, skipping flashcard sync');
      return;
    }
    
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('User not authenticated, skipping flashcard sync');
      return;
    }
    
    // Get local flashcards
    const localCards = await getAllFlashcards();
    
    // Get cloud flashcards
    const { data: cloudCards, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error('Error fetching flashcards from cloud:', fetchError);
      return;
    }
    
    const cloudCardsMap = new Map(
      (cloudCards || []).map(card => [card.target_id, card])
    );
    
    const localCardsMap = new Map(
      localCards.map(card => [card.targetId, card])
    );
    
    // Sync local to cloud (upload new/updated cards)
    for (const localCard of localCards) {
      const cloudCard = cloudCardsMap.get(localCard.targetId);
      
      if (!cloudCard) {
        // Card doesn't exist in cloud, upload it
        const { error: insertError } = await supabase
          .from('cards')
          .insert({
            user_id: userId,
            deck_id: localCard.deckId || null,
            type: localCard.type,
            target_id: localCard.targetId,
            due_at: localCard.dueAt,
            interval: localCard.interval,
            ease: localCard.ease,
            repetitions: localCard.repetitions,
            last_reviewed: localCard.lastReviewed || null,
            updated_at: localCard.updatedAt || new Date().toISOString(),
          });
        
        if (insertError) {
          console.error('Error uploading flashcard:', insertError);
        } else {
          console.log('Uploaded flashcard:', localCard.id);
        }
      } else {
        // Card exists in both, check which is newer
        const localUpdated = new Date(localCard.updatedAt || localCard.createdAt);
        const cloudUpdated = new Date(cloudCard.updated_at);
        
        if (localUpdated > cloudUpdated) {
          // Local is newer, update cloud
          const { error: updateError } = await supabase
            .from('cards')
            .update({
              deck_id: localCard.deckId || null,
              due_at: localCard.dueAt,
              interval: localCard.interval,
              ease: localCard.ease,
              repetitions: localCard.repetitions,
              last_reviewed: localCard.lastReviewed || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', cloudCard.id);
          
          if (updateError) {
            console.error('Error updating flashcard in cloud:', updateError);
          } else {
            console.log('Updated flashcard in cloud:', localCard.id);
          }
        } else if (cloudUpdated > localUpdated) {
          // Cloud is newer, update local
          await updateFlashcard(localCard.id, {
            deckId: cloudCard.deck_id || undefined,
            dueAt: cloudCard.due_at,
            interval: cloudCard.interval,
            ease: cloudCard.ease,
            repetitions: cloudCard.repetitions,
            lastReviewed: cloudCard.last_reviewed || undefined,
            updatedAt: cloudCard.updated_at,
          });
          console.log('Updated flashcard from cloud:', localCard.id);
        }
      }
    }
    
    // Sync cloud to local (download new cards)
    for (const cloudCard of cloudCards || []) {
      const localCard = localCardsMap.get(cloudCard.target_id);
      
      if (!localCard) {
        // Card doesn't exist locally, download it
        await addFlashcard({
          userId,
          deckId: cloudCard.deck_id || undefined,
          type: cloudCard.type,
          targetId: cloudCard.target_id,
          dueAt: cloudCard.due_at,
          interval: cloudCard.interval,
          ease: cloudCard.ease,
          repetitions: cloudCard.repetitions,
          lastReviewed: cloudCard.last_reviewed || undefined,
          updatedAt: cloudCard.updated_at,
        });
        console.log('Downloaded flashcard:', cloudCard.id);
      }
    }
    
    console.log('Flashcard sync completed');
  } catch (error) {
    console.error('Error syncing flashcards:', error);
  }
};

// Sync history: two-way sync
export const syncHistory = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('Sync not available on web');
    return;
  }
  
  try {
    const online = await isOnline();
    if (!online) {
      console.log('Device is offline, skipping history sync');
      return;
    }
    
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('User not authenticated, skipping history sync');
      return;
    }
    
    // Get local history
    const localHistory = await getHistory(undefined, 1000);
    
    // Get cloud history
    const { data: cloudHistory, error: fetchError } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(1000);
    
    if (fetchError) {
      console.error('Error fetching history from cloud:', fetchError);
      return;
    }
    
    const cloudHistoryMap = new Map(
      (cloudHistory || []).map(entry => [`${entry.type}_${entry.target_id}_${entry.viewed_at}`, entry])
    );
    
    const localHistoryMap = new Map(
      localHistory.map(entry => [`${entry.type}_${entry.targetId}_${entry.viewedAt}`, entry])
    );
    
    // Upload local history to cloud
    for (const localEntry of localHistory) {
      const key = `${localEntry.type}_${localEntry.targetId}_${localEntry.viewedAt}`;
      const cloudEntry = cloudHistoryMap.get(key);
      
      if (!cloudEntry) {
        // Entry doesn't exist in cloud, upload it
        const { error: insertError } = await supabase
          .from('history')
          .insert({
            user_id: userId,
            type: localEntry.type,
            target_id: localEntry.targetId,
            viewed_at: localEntry.viewedAt,
            updated_at: localEntry.updatedAt || new Date().toISOString(),
          });
        
        if (insertError) {
          console.error('Error uploading history entry:', insertError);
        }
      }
    }
    
    // Download cloud history to local
    for (const cloudEntry of cloudHistory || []) {
      const key = `${cloudEntry.type}_${cloudEntry.target_id}_${cloudEntry.viewed_at}`;
      const localEntry = localHistoryMap.get(key);
      
      if (!localEntry) {
        // Entry doesn't exist locally, download it
        await addHistory({
          userId,
          type: cloudEntry.type,
          targetId: cloudEntry.target_id,
          viewedAt: cloudEntry.viewed_at,
          updatedAt: cloudEntry.updated_at,
        });
      }
    }
    
    console.log('History sync completed');
  } catch (error) {
    console.error('Error syncing history:', error);
  }
};

// Full sync: decks, flashcards, and history
export const performFullSync = async (): Promise<void> => {
  console.log('Starting full sync...');
  await syncDecksFromCloud();
  await syncFlashcards();
  await syncHistory();
  console.log('Full sync completed');
};
