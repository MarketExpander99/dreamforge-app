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

  function mapExplorationToLessonCard(exploration: any, index: number) {
    // Surgical mapping: convert raw exploration (label + short_description) into clean lesson card fields.
    // Also defensively unwraps cases where short_description (or the row) was stored as the raw JSON object string
    // e.g. `{ "label": "...", "short_description": "..." }` — this was the root cause of raw JSON appearing in cards.
    let label = exploration?.label;
    let shortDesc = exploration?.short_description;

    const tryUnwrap = (val: any): { label?: string; short_description?: string } | null => {
      if (!val) return null;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('{') && trimmed.includes('"label"') && trimmed.includes('short_description')) {
          try {
            const obj = JSON.parse(trimmed);
            if (obj && typeof obj === 'object' && obj.label && obj.short_description !== undefined) {
              return { label: obj.label, short_description: obj.short_description };
            }
          } catch {}
          // Robust fallback for truncated JSON strings that were stored as the raw object (parse fails but pattern matches)
          // Does not split lesson text on internal commas.
          const key = '"short_description": "';
          const idx = trimmed.indexOf(key);
          if (idx !== -1) {
            let rest = trimmed.substring(idx + key.length);
            const closingPatterns = ['", "', '"}', '",', '"}', '"'];
            let endPos = rest.length;
            for (const p of closingPatterns) {
              const pIdx = rest.indexOf(p);
              if (pIdx !== -1 && pIdx < endPos) endPos = pIdx;
            }
            let extracted = rest.substring(0, endPos).trim();
            if (extracted.includes('",') || extracted.includes('"}')) {
              extracted = extracted.split('",')[0].split('"}')[0];
            }
            if (extracted.length > 3) {
              return { label: label || 'unwrapped', short_description: extracted.replace(/\\"/g, '"') };
            }
          }
        }
        return null;
      }
      if (typeof val === 'object' && val.label && val.short_description !== undefined) {
        return { label: val.label, short_description: val.short_description };
      }
      return null;
    };

    const unwrapped = tryUnwrap(shortDesc) || tryUnwrap(exploration);
    if (unwrapped) {
      if (unwrapped.label) label = unwrapped.label;
      if (unwrapped.short_description !== undefined) shortDesc = unwrapped.short_description;
    }

    return {
      title: label || 'Learning Topic',
      content: (typeof shortDesc === 'string' ? shortDesc : '') || '',
    };
  }

  explorations.forEach((exp: any, topicIndex: number) => {
    const lessonCard = mapExplorationToLessonCard(exp, topicIndex);
    const topicId = exp.id || `topic-${topicIndex}`;
    const topicTitle = lessonCard.title;

    // Topic-level completion marker support (for "Topic completed" final-round flow + red Complete button)
    // If the user has explicitly completed the whole topic, skip generating any cards for it.
    // This ensures completed topics are reliably excluded by the authoritative source of truth on refresh.
    const topicCompleteMarker = `topic-complete-${topicId}`;
    if (completedIds.has(topicCompleteMarker)) {
      return; // entire topic hidden (satisfies spec: hide on final round complete, same as red button)
    }

    const baseDesc = (lessonCard.content || exp.deep_details || `Core ideas around ${topicTitle}.`).trim();

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
