import { createClient } from '@supabase/supabase-js';

// Nilai ini dibaca dari Environment Variables di Vercel
// (VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Dipakai App.tsx untuk menampilkan pesan yang jelas kalau konfigurasi belum terbaca,
// supaya halaman tidak blank putih.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
