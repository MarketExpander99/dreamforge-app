import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
  generateDiagnosticQuestions,
  evaluateDiagnosticAssessment,
  saveDiagnosticResults,
  triggerInitialContentGeneration,
  AssessmentSubmission,
  DiagnosticResult
} from '@/lib/diagnostic-assessment'
import { initializeWithDiagnosticResults } from '@/lib/adaptive-engine'

// GET endpoint to generate diagnostic questions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate diagnostic questions
    const questions = await generateDiagnosticQuestions(user.id)

    return NextResponse.json({ questions })

  } catch (error) {
    console.error('Error generating diagnostic questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate diagnostic questions' },
      { status: 500 }
    )
  }
}

// POST endpoint to evaluate diagnostic assessment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { responses } = body

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: 'Invalid assessment responses' }, { status: 400 })
    }

    // Get user's age from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.age) {
      return NextResponse.json({ error: 'User age not found' }, { status: 400 })
    }

    // Prepare submission for evaluation
    const submission: AssessmentSubmission = {
      userId: user.id,
      age: profile.age,
      responses: responses.map((r: any) => ({
        questionId: r.questionId,
        question: r.question,
        answer: r.answer,
        subject: r.subject
      }))
    }

    // Evaluate assessment with Grok AI
    const results: DiagnosticResult = await evaluateDiagnosticAssessment(submission)

    // Save results to profile
    await saveDiagnosticResults(user.id, results)

    // Initialize adaptive engine with diagnostic results
    await initializeWithDiagnosticResults(user.id, {
      recommended_grade: results.recommended_grade,
      subject_proficiency: results.subject_proficiency,
      suggested_topics: results.suggested_topics
    })

    // Trigger initial content generation
    await triggerInitialContentGeneration(user.id, results)

    // Store assessment data for records
    try {
      await supabase
        .from('grade_assessments')
        .insert({
          user_id: user.id,
          curriculum_id: null, // Diagnostic assessment is curriculum-agnostic
          assessed_grade: results.recommended_grade,
          confidence_score: results.overall_score / 100,
          assessment_data: {
            type: 'diagnostic',
            responses,
            results,
            assessed_at: new Date().toISOString()
          },
          assessment_method: 'ai_diagnostic'
        })
    } catch (assessmentError) {
      console.warn('Failed to save assessment record:', assessmentError)
      // Don't fail the whole process if assessment recording fails
    }

    return NextResponse.json({
      success: true,
      results: {
        recommended_grade: results.recommended_grade,
        subject_proficiency: results.subject_proficiency,
        overall_score: results.overall_score,
        strengths: results.strengths,
        gaps: results.gaps,
        suggested_topics: results.suggested_topics,
        assessment_summary: results.assessment_summary
      }
    })

  } catch (error) {
    console.error('Diagnostic assessment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}