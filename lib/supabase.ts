import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Clear invalid sessions on startup
supabase.auth.getSession().catch(async (error) => {
  if (error?.message?.includes('Refresh Token')) {
    console.log('Clearing invalid session');
    await AsyncStorage.removeItem('supabase.auth.token');
    await supabase.auth.signOut();
  }
});
