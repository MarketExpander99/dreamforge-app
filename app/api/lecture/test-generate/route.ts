import { NextRequest, NextResponse } from 'next/server'
import { generateProgressiveLectureAction } from '@/app/actions/lecture'

// Admin-only test endpoint for two-stage lecture generation (v1)
// Allows developers to run end-to-end tests without UI.
//
// POST body:
// {
//   "topic": "string (required)",
//   "targetAudience": "string (optional)",
//   "persist": true | false   // if true, saves to DB (requires tables applied)
// }
//
// Response includes lectureId + persisted flag when saved.
//
// Usage (after running the migration SQL):
//   curl -X POST http://localhost:3000/api/lecture/test-generate \
//     -H "Content-Type: application/json" \
//     -d '{"topic":"Binary Search Trees","targetAudience":"Grade 11-12 IT students","persist":true}'
//
// Security: restricted to the canonical admin email.

export async function POST(request: NextRequest) {
  try {
    // NOTE: For a true server action call from API we re-auth here.
    // In a real flow the action also checks, but we do explicit admin gate.
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.email !== 'eben.combrinck@proton.me') {
      return NextResponse.json({ error: 'Admin access required for lecture test generation' }, { status: 403 })
    }

    const body = await request.json()
    const { topic, learningPathContext, targetAudience, desiredSectionCount, persist = false } = body

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'topic (string) is required' }, { status: 400 })
    }

    const actionResult = await generateProgressiveLectureAction({
      topic,
      learningPathContext,
      targetAudience: targetAudience || 'motivated learners',
      desiredSectionCount: desiredSectionCount || undefined,
      persist: !!persist,
    })

    if (!actionResult.success) {
      return NextResponse.json({ error: actionResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      topic: actionResult.result.topic,
      masterLecture: actionResult.result.masterLecture,
      sections: actionResult.result.sections,
      metadata: actionResult.result.metadata,
      lectureId: actionResult.lectureId || null,
      persisted: !!actionResult.lectureId,
    })
  } catch (error: any) {
    console.error('Lecture test generation error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal error during two-stage generation' },
      { status: 500 }
    )
  }
}
