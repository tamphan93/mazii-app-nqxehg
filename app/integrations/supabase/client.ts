
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js';

// Read from environment variables with fallbacks
const SUPABASE_URL = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  "https://rsuokhpbunisxmcpbmum.supabase.co";

const SUPABASE_ANON_KEY = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdW9raHBidW5pc3htY3BibXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3Njg4MzcsImV4cCI6MjA3NjM0NDgzN30._8fWiJ44Cm0yAQSm1DF9yAPB8xMRjtJDFuCSUB-jl2c";

// Validate that we have the required configuration
if (!SUPABASE_URL || SUPABASE_URL === "your_supabase_url_here") {
  console.error('❌ SUPABASE_URL is not configured properly');
  throw new Error('Supabase URL is required. Please check your .env file.');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "your_anon_key_here") {
  console.error('❌ SUPABASE_ANON_KEY is not configured properly');
  throw new Error('Supabase anon key is required. Please check your .env file.');
}

console.log('✅ Supabase client initialized with URL:', SUPABASE_URL);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
