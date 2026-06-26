'use server'

/**
 * Server Actions for Two-Stage Lecture Generation (v1)
 *
 * Per Developer Spec:
 * - Full master lecture generation (Stage 1) + intelligent progressive split (Stage 2)
 * - Optional persistence to `lectures` + `lecture_sections` tables
 * - Retrieval of full lecture + ordered sections
 *
 * RLS respected: only the owner (auth.uid()) can save/retrieve their lectures.
 */

import { createClient } from '@/lib/supabase-server'
import { generateProgressiveLecture, LectureGenerationParams, GenerateProgressiveLectureResult, LectureSection } from '@/lib/ai/lecture-generation'
import { revalidatePath } from 'next/cache'

export interface SavedLecture {
  id: string
  topic: string
  master_content: string
  metadata: any
  created_at: string
}

export interface SavedLectureSection extends LectureSection {
  id: string
  lecture_id: string
}

export interface FullLecture {
  lecture: SavedLecture
  sections: SavedLectureSection[]
}

// Extended params for actions
export interface GenerateLectureActionParams extends LectureGenerationParams {
  persist?: boolean
  pathId?: string // optional link to a learning path
}

export async function generateProgressiveLectureAction(
  params: GenerateLectureActionParams
): Promise<
  | { success: true; result: GenerateProgressiveLectureResult; lectureId?: string }
  | { success: false; error: string }
> {
  try {
    if (!params.topic || params.topic.trim().length < 3) {
      return { success: false, error: 'Topic is required and must be at least 3 characters.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (params.persist && !user) {
      return { success: false, error: 'Authentication required to save lectures.' }
    }

    // Run the two-stage pipeline
    const result = await generateProgressiveLecture({
      topic: params.topic.trim(),
      learningPathContext: params.learningPathContext,
      targetAudience: params.targetAudience,
      desiredSectionCount: params.desiredSectionCount,
      maxMasterTokens: params.maxMasterTokens
    })

    let lectureId: string | undefined

    if (params.persist && user) {
      try {
        // 1. Insert master lecture
        const { data: lectureRow, error: lectureError } = await supabase
          .from('lectures')
          .insert({
            user_id: user.id,
            topic: result.topic,
            master_content: result.masterLecture,
            metadata: {
              ...result.metadata,
              targetAudience: params.targetAudience,
              sectionCount: result.sections.length,
              source: 'two-stage-generation',
            },
            path_id: params.pathId || null,
          })
          .select('id')
          .single()

        if (lectureError || !lectureRow) {
          console.error('Failed to persist lecture:', lectureError)
          return {
            success: true,
            result,
            // Still return generated content even if save failed
          }
        }

        lectureId = lectureRow.id

        // 2. Insert sections (key_takeaways as JSONB array)
        const sectionsToInsert = result.sections.map((section) => ({
          lecture_id: lectureId,
          section_number: section.section_number,
          title: section.title,
          content: section.content,
          key_takeaways: section.key_takeaways,
          estimated_minutes: section.estimated_minutes,
          prerequisites: section.prerequisites,
          reflection_prompt: section.reflection_prompt || null,
        }))

        const { error: sectionsError } = await supabase
          .from('lecture_sections')
          .insert(sectionsToInsert)

        if (sectionsError) {
          console.error('Failed to persist some lecture sections:', sectionsError)
          // Lecture exists; sections may be partial. Still return success with id.
        }

        // Revalidate any future lecture listing paths
        revalidatePath('/admin')
        revalidatePath('/learning')
      } catch (persistErr) {
        console.error('Persistence error (non-fatal):', persistErr)
        // Return generated result anyway
      }
    }

    return { success: true, result, lectureId }
  } catch (error: any) {
    console.error('[lecture action] Generation failed:', error)
    return {
      success: false,
      error: error?.message || 'Failed to generate progressive lecture. Please try again.'
    }
  }
}

/**
 * Retrieve a full lecture + all its ordered progressive sections.
 * Respects RLS (user must own it).
 */
export async function getLectureWithSections(lectureId: string): Promise<FullLecture | null> {
  const supabase = await createClient()

  const { data: lecture, error: lectureErr } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', lectureId)
    .single()

  if (lectureErr || !lecture) {
    return null
  }

  const { data: sections, error: sectionsErr } = await supabase
    .from('lecture_sections')
    .select('*')
    .eq('lecture_id', lectureId)
    .order('section_number', { ascending: true })

  if (sectionsErr) {
    console.error('Error fetching lecture sections:', sectionsErr)
    return {
      lecture: {
        id: lecture.id,
        topic: lecture.topic,
        master_content: lecture.master_content,
        metadata: lecture.metadata,
        created_at: lecture.created_at,
      },
      sections: [],
    }
  }

  const mappedSections: SavedLectureSection[] = (sections || []).map((s: any) => ({
    id: s.id,
    lecture_id: s.lecture_id,
    section_number: s.section_number,
    title: s.title,
    content: s.content,
    key_takeaways: Array.isArray(s.key_takeaways) ? s.key_takeaways : [],
    estimated_minutes: s.estimated_minutes,
    prerequisites: s.prerequisites,
    reflection_prompt: s.reflection_prompt || undefined,
  }))

  return {
    lecture: {
      id: lecture.id,
      topic: lecture.topic,
      master_content: lecture.master_content,
      metadata: lecture.metadata,
      created_at: lecture.created_at,
    },
    sections: mappedSections,
  }
}

/**
 * Convenience: generate + immediately persist (used by test flows and future UI)
 */
export async function generateAndPersistLecture(params: GenerateLectureActionParams) {
  return generateProgressiveLectureAction({ ...params, persist: true })
}
