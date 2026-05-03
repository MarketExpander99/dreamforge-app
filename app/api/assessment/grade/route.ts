import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GrokAI integration for grade assessment
async function analyzeWithGrokAI(responses: any[], curriculum: string = 'CAPS') {
  try {
    // Prepare the assessment data for GrokAI analysis
    const assessmentPrompt = `
You are an expert educational assessor. Based on the following student responses to assessment questions,
determine their appropriate grade level for the ${curriculum} curriculum.

Assessment Responses:
${responses.map((r, i) => `
Question ${i + 1}: ${r.question}
Student Answer: ${r.answer}
Correct Answer: ${r.correctAnswer}
Subject: ${r.subject}
`).join('\n')}

Please analyze these responses and provide:
1. Recommended grade level (e.g., "Grade 3", "Grade 4")
2. Confidence score (0.0 to 1.0)
3. Brief reasoning for your assessment
4. Areas of strength and weakness

Format your response as JSON:
{
  "grade": "Grade X",
  "confidence": 0.85,
  "reasoning": "Brief explanation",
  "strengths": ["area1", "area2"],
  "weaknesses": ["area1", "area2"]
}
`

    // Call GrokAI API (xAI)
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: assessmentPrompt
          }
        ],
        model: 'grok-beta',
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!grokResponse.ok) {
      throw new Error(`GrokAI API error: ${grokResponse.status}`)
    }

    const grokData = await grokResponse.json()
    const analysisText = grokData.choices[0]?.message?.content

    if (!analysisText) {
      throw new Error('No response from GrokAI')
    }

    // Parse the JSON response from GrokAI
    try {
      const analysis = JSON.parse(analysisText)
      return {
        grade: analysis.grade || 'Grade 3',
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        reasoning: analysis.reasoning || 'Assessment completed',
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || []
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.warn('Failed to parse GrokAI response as JSON, using fallback')
      return {
        grade: 'Grade 3',
        confidence: 0.5,
        reasoning: 'Assessment completed with AI assistance',
        strengths: [],
        weaknesses: []
      }
    }

  } catch (error) {
    console.error('GrokAI analysis error:', error)
    // Fallback assessment based on simple scoring
    return fallbackGradeAssessment(responses)
  }
}

// Fallback assessment when GrokAI is unavailable
function fallbackGradeAssessment(responses: any[]) {
  let totalScore = 0
  let maxScore = 0

  responses.forEach(response => {
    maxScore += response.points || 1
    if (response.isCorrect) {
      totalScore += response.points || 1
    }
  })

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

  // Simple grade determination based on percentage
  let grade = 'Grade 3' // Default
  if (percentage >= 90) grade = 'Grade 4'
  else if (percentage >= 75) grade = 'Grade 3'
  else if (percentage >= 60) grade = 'Grade 2'
  else grade = 'Grade 1'

  return {
    grade,
    confidence: 0.7,
    reasoning: `Assessment based on ${totalScore}/${maxScore} correct answers (${percentage.toFixed(1)}%)`,
    strengths: percentage >= 75 ? ['Good understanding of core concepts'] : [],
    weaknesses: percentage < 75 ? ['May need additional support in some areas'] : []
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { responses, curriculum = 'CAPS' } = body

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: 'Invalid assessment responses' }, { status: 400 })
    }

    // Get curriculum ID
    const { data: curriculumData, error: curriculumError } = await supabase
      .from('curriculums')
      .select('id')
      .eq('name', curriculum)
      .single()

    if (curriculumError || !curriculumData) {
      return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })
    }

    // Analyze responses with GrokAI
    const analysis = await analyzeWithGrokAI(responses, curriculum)

    // Store assessment result
    const { data: assessment, error: assessmentError } = await supabase
      .from('grade_assessments')
      .upsert({
        user_id: user.id,
        curriculum_id: curriculumData.id,
        assessed_grade: analysis.grade,
        confidence_score: analysis.confidence,
        assessment_data: {
          responses,
          analysis,
          assessed_at: new Date().toISOString()
        },
        assessment_method: 'ai_assessment'
      })
      .select()
      .single()

    if (assessmentError) {
      console.error('Error saving assessment:', assessmentError)
      return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 })
    }

    // Update user profile with recommended grade
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        grade_level: analysis.grade,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.warn('Failed to update user profile grade:', profileError)
    }

    return NextResponse.json({
      success: true,
      assessment: {
        grade: analysis.grade,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses
      }
    })

  } catch (error) {
    console.error('Grade assessment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to retrieve assessment questions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const curriculum = searchParams.get('curriculum') || 'CAPS'
    const grade = searchParams.get('grade') // Optional: filter by grade
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('assessment_questions')
      .select(`
        *,
        curriculums!inner(name)
      `)
      .eq('curriculums.name', curriculum)
      .eq('is_active', true)
      .limit(limit)

    if (grade) {
      query = query.eq('grade_level', grade)
    }

    const { data: questions, error } = await query

    if (error) {
      console.error('Error fetching assessment questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({ questions: questions || [] })

  } catch (error) {
    console.error('Get assessment questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}