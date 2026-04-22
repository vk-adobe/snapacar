const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () =>
  !!(supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co') && supabaseAnonKey.length > 20);

export const getExtra = () => ({ supabaseUrl, supabaseAnonKey });
