// lib/feed.ts
// Server-authoritative source of truth for the user's personalized uncompleted feed.
// All feed rendering MUST source the list of visible items from getPersonalizedUncompletedFeed.
// This eliminates reappearance of completed content after refresh/navigation across sessions/devices.
// Hybrid sources (user_explorations + user_progress) are joined here with server-side filtering + dedup.

import { createClient } from '@/lib/supabase-server';

export interface PersonalizedFeedItem {
  id: string;
  type: 'lesson' | 'qa';
  title: string;
  description: string;
  topic: string;
  topicId: string;
  round: number;
  difficulty: number;
  // Note: media, qa payload, etc. are enriched client-side for rich interactions.
  // This keeps the server function lightweight and focused on "what should be visible".
}

export interface FeedLoadResult {
  items: PersonalizedFeedItem[];
  completedIds: string[];
}

/**
 * getPersonalizedUncompletedFeed
 * Single source of truth.
 * - Fetches user's explorations (source of dynamic personalized topics)
 * - Computes deterministic card IDs from stable exploration.id
 * - LEFT-style filter via completed set from user_progress (status or 100%)
 * - Deduplicates by stable id
 * - Returns only items the user should see (never-completed or not 100%)
 */
export async function getPersonalizedUncompletedFeed(
  userId: string,
  limit: number = 50
): Promise<PersonalizedFeedItem[]> {
  if (!userId) return [];

  const supabase = await createClient();

  // 1. Fetch explorations (ordered stably)
  const { data: explorations, error: expError } = await supabase
    .from('user_explorations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (expError || !explorations || explorations.length === 0) {
    return [];
  }

  // 2. Server-authoritative completed set (critical read path fix)
  const { data: progressCompleted } = await supabase
    .from('user_progress')
    .select('content_id, status, progress_percentage')
    .eq('user_id', userId)
    .or('status.eq.completed,progress_percentage.gte.100');

  const completedIds = new Set<string>(
    (progressCompleted || []).map((p: any) => String(p.content_id))
  );

  const items: PersonalizedFeedItem[] = [];
  const seen = new Set<string>();

  explorations.forEach((exp: any, topicIndex: number) => {
    const topicId = exp.id || `topic-${topicIndex}`;
    const topicTitle = exp.label || 'Learning Topic';
    const baseDesc = (exp.short_description || exp.deep_details || `Core ideas around ${topicTitle}.`).trim();

    const numCards = 3 + (topicIndex % 3);

    for (let i = 0; i < numCards; i++) {
      const id = `card-${topicId}-${i}`;
      if (completedIds.has(id) || seen.has(id)) continue;
      seen.add(id);

      const roundNum = Math.floor(i / 2) + 1;

      let description = baseDesc;
      if (i === 1) description = `Practical angle: ${baseDesc}`;
      if (i === 2) description = `Deeper look: How ${baseDesc.toLowerCase().replace(/\.$/, '')} connects to other ideas.`;
      if (i === 3) description = `Real-world example of ${baseDesc.toLowerCase().replace(/\.$/, '')}.`;
      if (i >= 4) description = `Advanced insight: ${baseDesc}`;

      items.push({
        id,
        type: 'lesson',
        title: `${topicTitle} - Insight ${i + 1}`,
        description,
        topic: topicTitle,
        topicId,
        round: roundNum,
        difficulty: roundNum,
      });
    }

    // QA / comprehension check card (always round 1 for topic)
    const qaId = `qa-${topicId}`;
    if (!completedIds.has(qaId) && !seen.has(qaId)) {
      seen.add(qaId);
      items.push({
        id: qaId,
        type: 'qa',
        title: `${topicTitle} - Check Understanding`,
        description: baseDesc.substring(0, 280),
        topic: topicTitle,
        topicId,
        round: 1,
        difficulty: 1,
      });
    }
  });

  // 3. Final server-side dedup + limit (defensive)
  const deduped = items.filter((item, idx, arr) => {
    // Already de-duped in build above via seen, but extra guard
    return arr.findIndex((x) => x.id === item.id) === idx;
  });

  return deduped.slice(0, limit);
}

/**
 * Convenience helper: returns only the ids the user has completed.
 * Useful for client-side cross-checks or other lists.
 */
export async function getCompletedContentIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_progress')
    .select('content_id')
    .eq('user_id', userId)
    .or('status.eq.completed,progress_percentage.gte.100');

  return (data || []).map((r: any) => String(r.content_id));
}
