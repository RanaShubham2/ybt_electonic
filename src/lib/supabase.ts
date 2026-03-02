import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn('Supabase is not fully configured. Authentication and Support Form will use local fallback.');
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);

export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured) return false;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase connection check failed:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Supabase connection check error:', e.message);
    return false;
  }
};

export const testSupabaseRead = async () => {
  if (!isSupabaseConfigured) return { success: false, message: 'Supabase not configured' };
  try {
    // Try to fetch from any table, or just check auth again
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      // If table doesn't exist, that's fine, it means we connected but schema is different
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
          return { success: true, message: 'Connected! (Schema needs setup)' };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected and verified!' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const submitSupportRequest = async (name: string, email: string, message: string) => {
  if (!isSupabaseConfigured) return { fallback: true };
  
  try {
    const { error } = await supabase
      .from('support_requests')
      .insert([{ name, email, message }]);
      
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Supabase support submission failed:', e.message);
    return { success: false, error: e.message };
  }
};
