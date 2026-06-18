'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

/**
 * markCardComplete
 * Phase 1 implementation per Skill Gain feed spec.
 * - 1-tap completion (X-style)
 * - Supports optional qaAnswer for QA cards (effort-based scoring)
 * - Idempotent
 * - Uses existing user_progress (content_id) and maps to progress_percentage
 * - No new DB columns touched in Phase 1
 */
export async function markCardComplete(
  cardId: string,
  qaAnswer?: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Idempotency check
  const { data: existing } = await supabase
    .from('user_progress')
    .select('id, status, progress_percentage')
    .eq('user_id', user.id)
    .eq('content_id', cardId)
    .single()

  if (existing?.status === 'completed' || existing?.progress_percentage === 100) {
    return { success: true, alreadyCompleted: true, xpAwarded: 0 }
  }

  // 2. Optional lightweight QA evaluation (Phase 1: any non-empty = 80 effort)
  let progressPercentage: number = qaAnswer ? 80 : 100
  let evalNote = ''

  if (qaAnswer) {
    const trimmed = qaAnswer.trim()
    if (trimmed.length > 0) {
      progressPercentage = 85 // bonus for real attempt
      evalNote = 'QA answer recorded (effort)'
    } else {
      progressPercentage = 60
    }
  }

  // 3. Ensure placeholder content_item exists (safe for dynamic synthetic card ids)
  // (re-uses logic pattern from lib/progress-utils)
  const { data: contentExists } = await supabase
    .from('content_items')
    .select('id')
    .eq('id', cardId)
    .single()

  if (!contentExists) {
    const placeholderTitle = cardId.startsWith('test-') || cardId.startsWith('qa-')
      ? `QA Card • ${cardId.split('-').pop()}`
      : `Lesson Card • ${cardId}`
    try {
      await supabase.from('content_items').insert({
        id: cardId,
        title: placeholderTitle,
        content: 'Dynamically generated feed card for Skill Gain X-style completion.',
        type: qaAnswer ? 'quiz' : 'text',
        difficulty: 'beginner',
        tags: ['feed', qaAnswer ? 'qa' : 'lesson'],
        read_time: 3,
        is_published: true,
        likes: 0,
        views: 0,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        quiz: qaAnswer ? { question: 'Inline QA', options: [], correctAnswer: 0, explanation: evalNote } : null
      })
    } catch {
      // ignore duplicate key or placeholder race — safe
    }
  }

  // 4. Upsert progress (adapted to existing schema: content_id + progress_percentage)
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      content_id: cardId,
      status: 'completed',
      progress_percentage: progressPercentage,
      time_spent: qaAnswer ? 4 : 2,
      last_accessed_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,content_id' })

  if (error) {
    console.error('markCardComplete upsert error', error)
    throw error
  }

  // 5. Award XP (client-facing only for Phase 1; no dedicated XP table yet)
  const xpAwarded = qaAnswer ? 20 : 15

  // 6. Revalidate relevant paths (discover hosts the main feed)
  revalidatePath('/discover')
  revalidatePath('/learning')
  revalidatePath('/profile')

  return {
    success: true,
    xpAwarded,
    message: qaAnswer
      ? `Great effort on the question! +${xpAwarded} XP`
      : `Card completed! +${xpAwarded} XP`,
    score: progressPercentage,
  }
}
