// lib/supabase.ts - Client-side Supabase functions
// NOTE: This file and lib/supabase-client.ts both export createBrowserSupabaseClient.
// For auth stability we keep both updated with the singleton pattern.
// Prefer importing from '@/lib/supabase-client' in new code.
import { createBrowserClient } from '@supabase/ssr'

// This creates ONE stable client that we reuse everywhere in the browser.
// This is the recommended pattern for @supabase/ssr and fixes most auth state bugs
// (lost sessions, "Invalid login credentials" loops after signup, random logouts).
// Do NOT create a new client on every render or every call.
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url === 'your_supabase_project_url' || key === 'your_supabase_anon_key') {
    throw new Error('Supabase environment variables not configured')
  }

  // Reuse the same client instead of creating a new one every time
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(url, key)
  }

  return supabaseClient
}
