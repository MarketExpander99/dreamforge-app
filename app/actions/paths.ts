'use server'

import { createClient } from '@/lib/supabase-server'
import type { GeneratedPath, SavedLearningPath, PathStep, LessonCard } from '@/lib/paths'
import { revalidatePath } from 'next/cache'
import { awardXP, type AwardXpResult } from '@/app/actions/gamification'

/**
 * Saves a generated personalized path for the logged-in user.
 * Uses existing learning_paths table (extended with status + progress).
 * Stores full path data in modules (matches generate-path convention).
 * Phase 6: awards path_generated XP after successful save (non-fatal if gamification fails).
 */
export async function savePersonalizedPath(input: {
  title: string
  description?: string
  pathData: GeneratedPath
}): Promise<{ success: boolean; id?: string; error?: string; xp?: AwardXpResult }> {
  try {
    if (!input.title || !input.pathData || !Array.isArray(input.pathData.path)) {
      return { success: false, error: 'Invalid path data or title' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be signed in to save a path' }
    }

    const now = new Date().toISOString()
    const payload = {
      user_id: user.id,
      title: input.title.trim().slice(0, 200),
      description: input.description?.trim() || `Personalized path saved on ${new Date().toLocaleDateString()}`,
      modules: input.pathData as any,
      generated_at: now,
      status: 'active' as const,
      progress: 0,
    }

    const { data, error } = await supabase
      .from('learning_paths')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('savePersonalizedPath error:', error)
      return { success: false, error: 'Failed to save path. Please try again.' }
    }

    // Phase 6: award XP for successful path save (idempotent on path id; non-fatal)
    let xp: AwardXpResult | undefined
    if (data?.id) {
      try {
        xp = await awardXP('path_generated', data.id)
        if (xp && !xp.success) {
          console.warn('savePersonalizedPath awardXP soft-fail:', xp.errorCode, xp.error)
        }
      } catch (xpErr) {
        console.error('savePersonalizedPath awardXP non-fatal:', xpErr)
      }
    }

    // Revalidate paths-related pages so lists update
    revalidatePath('/paths')
    revalidatePath('/learning')
    revalidatePath('/path')
    revalidatePath('/profile')

    return { success: true, id: data?.id, xp }
  } catch (err) {
    console.error('savePersonalizedPath exception:', err)
    return { success: false, error: 'Unexpected error saving path' }
  }
}

/**
 * Updates basic progress on a saved path (0-100).
 * Only the owner can update (enforced by RLS + user check).
 */
export async function updatePathProgress(pathId: string, progress: number): Promise<{ success: boolean; error?: string }> {
  try {
    if (!pathId) return { success: false, error: 'Missing path id' }
    const pct = Math.max(0, Math.min(100, Math.round(progress)))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Sign in required' }
    }

    const { error } = await supabase
      .from('learning_paths')
      .update({ progress: pct, status: pct >= 100 ? 'completed' : 'active' })
      .eq('id', pathId)
      .eq('user_id', user.id) // belt + suspenders with RLS

    if (error) {
      console.error('updatePathProgress error:', error)
      return { success: false, error: 'Failed to update progress' }
    }

    revalidatePath('/paths')
    revalidatePath(`/paths/${pathId}`)
    revalidatePath('/learning')
    revalidatePath('/path')

    return { success: true }
  } catch (err) {
    console.error('updatePathProgress exception:', err)
    return { success: false, error: 'Unexpected error' }
  }
}

/**
 * Phase 6: Mark a Study path lesson step complete.
 * Updates path progress + awards lesson_completed XP (idempotent per path+step).
 */
export async function markPathLessonComplete(input: {
  pathId: string
  stepIndex: number
  totalSteps: number
  currentProgress?: number
}): Promise<{
  success: boolean
  progress?: number
  error?: string
  xp?: AwardXpResult
  message?: string
}> {
  try {
    const { pathId, stepIndex, totalSteps } = input
    if (!pathId || stepIndex < 0 || !totalSteps) {
      return { success: false, error: 'Invalid path or step' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sign in required' }

    // Load current progress if not provided
    let current = typeof input.currentProgress === 'number' ? input.currentProgress : 0
    if (input.currentProgress === undefined) {
      const { data: row } = await supabase
        .from('learning_paths')
        .select('progress')
        .eq('id', pathId)
        .eq('user_id', user.id)
        .maybeSingle()
      current = typeof row?.progress === 'number' ? row.progress : 0
    }

    const target = Math.min(
      100,
      Math.max(current, Math.round(((stepIndex + 1) / Math.max(1, totalSteps)) * 100))
    )

    const { error } = await supabase
      .from('learning_paths')
      .update({
        progress: target,
        status: target >= 100 ? 'completed' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pathId)
      .eq('user_id', user.id)

    if (error) {
      console.error('markPathLessonComplete update error:', error)
      return { success: false, error: 'Failed to update progress' }
    }

    // Stable reference for idempotent XP (one award per path step)
    const lessonRef = `path-${pathId}-step-${stepIndex}`
    let xp: AwardXpResult | undefined
    try {
      xp = await awardXP('lesson_completed', lessonRef)
      if (xp && !xp.success) {
        console.warn('markPathLessonComplete awardXP soft-fail:', xp.errorCode, xp.error)
      }
    } catch (xpErr) {
      console.error('markPathLessonComplete awardXP non-fatal:', xpErr)
    }

    revalidatePath('/paths')
    revalidatePath(`/paths/${pathId}`)
    revalidatePath('/learning')
    revalidatePath('/profile')

    const xpGained = xp?.success ? (xp.xpGained ?? 0) : 0
    let message = `Progress updated to ${target}%`
    if (xp?.success && xp.message && (xpGained > 0 || xp.leveledUp || (xp.newAchievements?.length ?? 0) > 0)) {
      message = `Lesson complete! ${xp.message} · Progress ${target}%`
    } else if (xp?.success && xp.skipped && xp.skipReason === 'already_awarded') {
      message = `Already completed · Progress ${target}%`
    } else if (xp?.success && xp.skipped && xp.skipReason === 'daily_cap') {
      message = `Lesson complete · Daily XP limit reached · Progress ${target}%`
    } else if (xp?.errorCode === 'missing_migration') {
      message = `Progress updated to ${target}% (XP tracking not set up yet)`
    }

    return { success: true, progress: target, xp, message }
  } catch (err) {
    console.error('markPathLessonComplete exception:', err)
    return { success: false, error: 'Unexpected error completing lesson' }
  }
}

/**
 * Fetches a single saved path for the current user (used by detail page).
 * Excludes the internal Learning Journey cache row.
 */
export async function getSavedPath(pathId: string): Promise<{ path: SavedLearningPath | null; error?: string }> {
  try {
    if (!pathId) return { path: null, error: 'Missing id' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { path: null, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('id', pathId)
      .eq('user_id', user.id)
      .neq('title', 'Learning Journey')
      .maybeSingle()

    if (error) {
      console.error('getSavedPath error:', error)
      return { path: null, error: 'Failed to load path' }
    }

    if (!data) return { path: null }

    // Map to typed shape (status/progress may be missing pre-migration; defaults applied)
    const saved: SavedLearningPath = {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      description: data.description,
      modules: data.modules,
      status: (data.status as any) || 'active',
      progress: typeof data.progress === 'number' ? data.progress : 0,
      generated_at: data.generated_at,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at,
    }

    return { path: saved }
  } catch (err) {
    console.error('getSavedPath exception:', err)
    return { path: null, error: 'Unexpected error loading path' }
  }
}

/**
 * Lists all non-journey saved paths for current user.
 */
export async function listUserPaths(): Promise<{ paths: SavedLearningPath[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { paths: [], error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('learning_paths')
      .select('id, title, description, status, progress, created_at, updated_at, generated_at')
      .eq('user_id', user.id)
      .neq('title', 'Learning Journey')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('listUserPaths error:', error)
      return { paths: [], error: 'Failed to load paths' }
    }

    const paths: SavedLearningPath[] = (data || []).map((row: any) => ({
      id: row.id,
      user_id: user.id,
      title: row.title,
      description: row.description,
      modules: null as any, // not loaded in list for perf
      status: (row.status as any) || 'active',
      progress: typeof row.progress === 'number' ? row.progress : 0,
      generated_at: row.generated_at,
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
    }))

    return { paths }
  } catch (err) {
    console.error('listUserPaths exception:', err)
    return { paths: [], error: 'Unexpected error' }
  }
}

/* ============================================
   Phase 3: Credit helpers (additive column on profiles)
   - Defaults gracefully if column not yet migrated
   - Deduct only on successful generation
   ============================================ */

export async function getUserCredits(): Promise<{ credits: number; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { credits: 0, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      // Column may not exist yet — return starter default for UX
      console.warn('getUserCredits: falling back to default (migration may be pending):', error.message)
      return { credits: 25 }
    }

    const bal = (data as any)?.credits_balance
    return { credits: typeof bal === 'number' ? bal : 25 }
  } catch (err) {
    console.error('getUserCredits exception:', err)
    return { credits: 25 }
  }
}

export async function deductCredits(amount: number, reason: string): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    if (!amount || amount <= 0) return { success: false, error: 'Invalid amount' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sign in required' }

    // Read current
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', user.id)
      .maybeSingle()

    const current = typeof (profileRow as any)?.credits_balance === 'number'
      ? (profileRow as any).credits_balance
      : 25

    if (current < amount) {
      return { success: false, error: 'Not enough credits', newBalance: current }
    }

    const newBal = current - amount

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ credits_balance: newBal, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateErr) {
      console.error('deductCredits update error:', updateErr)
      return { success: false, error: 'Failed to deduct credits' }
    }

    // Revalidate common places where balance may show
    revalidatePath('/paths')
    revalidatePath('/paths/[id]')
    revalidatePath('/study')
    revalidatePath('/discover')

    return { success: true, newBalance: newBal }
  } catch (err) {
    console.error('deductCredits exception:', err)
    return { success: false, error: 'Unexpected credit error' }
  }
}

/* ============================================
   Phase 3: Generate and persist a Lesson Card for one path step
   - Costs 1 credit
   - Uses Grok (structured) — same pattern as path generation
   - Persists inside modules.lessons (no schema change)
   - Returns card + remaining balance
   ============================================ */

const LESSON_CARD_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Clear, engaging title for this lesson card (based on the step)' },
    content: { type: 'string', description: 'Rich 2-4 paragraph educational explanation. Teach directly with examples and clarity.' },
    keyPoints: {
      type: 'array',
      items: { type: 'string' },
      description: '3-6 concise, actionable key points or takeaways'
    },
    estimatedTime: { type: 'string', description: 'e.g. 15-20 min' },
    difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] }
  },
  required: ['title', 'content', 'keyPoints'],
  additionalProperties: false
}

export async function generateLessonCardForStep(input: {
  pathId: string
  stepIndex: number
  step: PathStep
}): Promise<{ success: boolean; lesson?: LessonCard; creditsRemaining?: number; error?: string }> {
  try {
    if (!input.pathId || input.stepIndex === undefined || !input.step?.title) {
      return { success: false, error: 'Invalid step or path' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'You must be signed in' }

    const COST = 1

    // 1. Check credits
    const { data: prof } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', user.id)
      .maybeSingle()

    const currentCredits = typeof (prof as any)?.credits_balance === 'number' ? (prof as any).credits_balance : 25
    if (currentCredits < COST) {
      return { success: false, error: 'Not enough credits to generate a lesson card', creditsRemaining: currentCredits }
    }

    // 2. Call Grok for structured lesson card
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      return { success: false, error: 'AI service unavailable' }
    }

    const prompt = `You are an expert educator creating focused lesson cards for a student following their personalized learning path.

Step title: ${input.step.title}
Step description: ${input.step.description}
Estimated time for step: ${input.step.estimatedTime}
Difficulty: ${input.step.difficulty}

Create ONE high-quality, self-contained lesson card that helps the student actively study and master this specific step.
- Start teaching immediately with clear explanations and relatable examples.
- Include 3-6 memorable key points.
- Keep language encouraging and precise.
- Do not add meta commentary about the path or UI.

Return ONLY the JSON object.`

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [{ role: 'user', content: prompt }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'lesson_card',
            schema: LESSON_CARD_SCHEMA,
            strict: true
          }
        },
        temperature: 0.5,
        max_tokens: 1400
      })
    })

    if (!response.ok) {
      const t = await response.text()
      console.error('Grok lesson card error:', response.status, t)
      return { success: false, error: 'Failed to generate lesson content' }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return { success: false, error: 'Empty AI response' }

    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      return { success: false, error: 'Invalid lesson format from AI' }
    }

    const lessonCard: LessonCard = {
      title: String(parsed.title || input.step.title).trim(),
      content: String(parsed.content || '').trim(),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map((k: any) => String(k)).filter(Boolean) : [],
      estimatedTime: parsed.estimatedTime ? String(parsed.estimatedTime) : input.step.estimatedTime,
      difficulty: (['Beginner', 'Intermediate', 'Advanced'].includes(parsed.difficulty) ? parsed.difficulty : input.step.difficulty) as any,
      generatedAt: new Date().toISOString()
    }

    // 3. Deduct credits
    const deductRes = await deductCredits(COST, `Lesson card: ${input.step.title}`)
    if (!deductRes.success) {
      return { success: false, error: deductRes.error || 'Credit deduction failed', creditsRemaining: deductRes.newBalance }
    }

    // 4. Load current path modules, inject lesson
    const { data: currentPath, error: loadErr } = await supabase
      .from('learning_paths')
      .select('modules')
      .eq('id', input.pathId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (loadErr || !currentPath) {
      // still return the lesson even if we couldn't persist it this time
      return { success: true, lesson: lessonCard, creditsRemaining: deductRes.newBalance }
    }

    const modules: any = currentPath.modules || {}
    const key = `step-${input.stepIndex}`
    const existingLessons = (modules.lessons && typeof modules.lessons === 'object') ? modules.lessons : {}
    modules.lessons = {
      ...existingLessons,
      [key]: lessonCard
    }

    // 5. Persist updated modules (and gently nudge progress if very low)
    const currentProgress = 0 // we don't have it here; detail will refresh
    const { error: saveErr } = await supabase
      .from('learning_paths')
      .update({ modules, updated_at: new Date().toISOString() })
      .eq('id', input.pathId)
      .eq('user_id', user.id)

    if (saveErr) {
      console.error('Failed to save lesson into path modules:', saveErr)
      // Return card anyway — user still sees it this session
    }

    revalidatePath('/paths')
    revalidatePath(`/paths/${input.pathId}`)

    return { success: true, lesson: lessonCard, creditsRemaining: deductRes.newBalance }
  } catch (err) {
    console.error('generateLessonCardForStep exception:', err)
    return { success: false, error: 'Unexpected error generating lesson' }
  }
}

/**
 * Optional helper: fetch a single saved path WITH lessons populated (used by study detail).
 * Reuses core getSavedPath and ensures lessons shape.
 */
export async function getSavedPathWithLessons(pathId: string): Promise<{ path: SavedLearningPath | null; error?: string }> {
  const base = await getSavedPath(pathId)
  if (!base.path) return base

  // Ensure lessons key exists for client convenience (no mutation of stored)
  const mods: any = base.path.modules || {}
  if (!mods.lessons) mods.lessons = {}
  base.path.modules = mods
  return base
}

