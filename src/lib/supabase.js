import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { getExtra, isSupabaseConfigured } from '../config';

let client;

export function getSupabase() {
  if (client) return client;
  if (!isSupabaseConfigured()) return null;
  const extra = getExtra();
  client = createClient(extra.supabaseUrl, extra.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
