'use server';

import { createClient } from '@/lib/supabase-server';
import {
  getPersonalizedUncompletedFeed,
  PersonalizedFeedItem,
} from '@/lib/feed';

/**
 * Server action: returns the authoritative uncompleted feed for the current authenticated user.
 * Use this from client components (e.g. the main Feed) instead of client-side completed computation.
 * Guarantees completed items are excluded at read time.
 */
export async function getUncompletedFeed(): Promise<PersonalizedFeedItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  return await getPersonalizedUncompletedFeed(user.id);
}

/**
 * Optional: returns completed ids only (for clients that still need to merge local state).
 */
export async function getCompletedIdsForCurrentUser(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Re-export via the lib helper for consistency
  const { getCompletedContentIds } = await import('@/lib/feed');
  return await getCompletedContentIds(user.id);
}
