import { createClient, SupabaseClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '');
}

const envUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Allow runtime override via localStorage for demo/testing convenience
const customUrl = typeof window !== 'undefined' ? normalizeSupabaseUrl(localStorage.getItem('dvide_supabase_url') || '') : '';
const customKey = typeof window !== 'undefined' ? (localStorage.getItem('dvide_supabase_key') || '').trim() : '';

export const supabaseUrl = customUrl || envUrl;
export const supabaseKey = customKey || envKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    const cleaned = normalizeSupabaseUrl(url);
    localStorage.setItem('dvide_supabase_url', cleaned);
    localStorage.setItem('dvide_supabase_key', key.trim());
    window.location.reload();
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dvide_supabase_url');
    localStorage.removeItem('dvide_supabase_key');
    window.location.reload();
  }
}
