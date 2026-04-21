import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const isSupabaseConfigured = () => {
  const url = extra.supabaseUrl || '';
  const key = extra.supabaseAnonKey || '';
  return !!(url.startsWith('https://') && url.includes('.supabase.co') && key.length > 20);
};

export const getExtra = () => extra;
