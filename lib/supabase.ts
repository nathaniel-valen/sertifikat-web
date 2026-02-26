// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Pastikan variabel environment ini sudah lu setting di .env.local (untuk local)
// dan di Dashboard Vercel (untuk production/hosting)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase Environment Variables! Cek file .env atau Vercel Settings.');
}

// Kita pakai Service Role Key agar server (API Route) punya izin penuh 
// untuk bypass RLS (Row Level Security) saat upload file
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false, // Karena ini dipakai di sisi server (API), kita gak butuh simpan session/cookie
  },
});