import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'gramedia_supabase_url';
const STORAGE_KEY_KEY = 'gramedia_supabase_key';

const DEFAULT_SUPABASE_URL = 'https://ojkypldccqkmevdgqhpi.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_sDmt87vrNFM7l5GiWDTdSQ_jDTq0wzM';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  
  const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
  const savedKey = localStorage.getItem(STORAGE_KEY_KEY);

  const url = (savedUrl || envUrl).trim();
  const anonKey = (savedKey || envKey).trim();

  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    !url.includes('your-project') &&
    !anonKey.includes('your-anon-key')
  );
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey && url.startsWith('http') && !url.includes('your-project')) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return clientInstance;
    } catch (e) {
      console.warn('Gagal menginisialisasi Supabase client:', e);
      return null;
    }
  }
  return null;
}

export function resetSupabaseClient() {
  clientInstance = null;
}
