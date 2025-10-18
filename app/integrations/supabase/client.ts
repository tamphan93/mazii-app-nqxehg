import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://rsuokhpbunisxmcpbmum.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzdW9raHBidW5pc3htY3BibXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3Njg4MzcsImV4cCI6MjA3NjM0NDgzN30._8fWiJ44Cm0yAQSm1DF9yAPB8xMRjtJDFuCSUB-jl2c";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
