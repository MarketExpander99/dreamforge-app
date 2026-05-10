import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { evaluatePerformance, PerformanceData } from '@/lib/adaptive-engine'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      contentId,
      score,
      timeSpent,
      contentType,
      difficulty,
      tags,
      category,
      gradeLevel
    } = body

    // Validate required fields
    if (!contentId || !timeSpent || !contentType || !difficulty || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, timeSpent, contentType, difficulty, category' },
        { status: 400 }
      )
    }

    // Get content details to enrich performance data
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .select('id, title, category_id, difficulty, tags, read_time')
      .eq('id', contentId)
      .single()

    if (contentError || !contentItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    // Get user's current grade level if not provided
    let userGradeLevel = gradeLevel
    if (!userGradeLevel) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', user.id)
        .single()

      userGradeLevel = profile?.grade_level
    }

    // Prepare performance data for evaluation
    const performanceData: PerformanceData = {
      contentId,
      score: score || (contentType === 'quiz' ? 0 : 100), // Default to 100 for non-quiz content
      timeSpent: Math.max(1, Math.min(timeSpent, 300)), // Clamp between 1-300 minutes
      completedAt: new Date().toISOString(),
      contentType,
      difficulty,
      tags: tags || contentItem.tags || [],
      category,
      gradeLevel: userGradeLevel
    }

    // Evaluate performance using adaptive engine
    const evaluationResult = await evaluatePerformance(user.id, performanceData)

    // Return evaluation results
    return NextResponse.json({
      success: true,
      evaluation: evaluationResult,
      message: 'Performance evaluated successfully'
    })

  } catch (error) {
    console.error('Error evaluating performance:', error)

    return NextResponse.json(
      {
        error: 'Failed to evaluate performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check evaluation status (optional)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's current proficiency data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('proficiency, grade_level, updated_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      proficiency: profile.proficiency || {},
      gradeLevel: profile.grade_level,
      lastUpdated: profile.updated_at
    })

  } catch (error) {
    console.error('Error fetching proficiency status:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch proficiency status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}