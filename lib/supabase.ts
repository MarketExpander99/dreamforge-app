// lib/supabase.ts - Client-side Supabase functions
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url === 'your_supabase_project_url' || key === 'your_supabase_anon_key') {
    throw new Error('Supabase environment variables not configured')
  }

  return createBrowserClient(url, key)
}
