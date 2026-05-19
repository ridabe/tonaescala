import { createClient } from '@supabase/supabase-js';
import { appStorage } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => appStorage.getItem(key),
  setItem: (key: string, value: string) => appStorage.setItem(key, value),
  removeItem: (key: string) => appStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
