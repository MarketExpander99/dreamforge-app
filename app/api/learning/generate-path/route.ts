import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Production-grade Grok-powered learning path + formal course recommendations
// Replaces all MVP hardcoded logic. Uses real Grok API with structured output.

interface LearningPathItem {
  title: string
  description: string
  estimatedTime: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

interface SuggestedCourse {
  title: string
  provider: string
  url: string
  estimatedTime: string
  level: string
  reason: string
}

interface GrokLearningResponse {
  path: LearningPathItem[]
  suggestedCourses: SuggestedCourse[]
}

const LEARNING_SCHEMA = {
  type: "object",
  properties: {
    path: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Clear, engaging title for this learning step" },
          description: { type: "string", description: "Detailed explanation of what the student should focus on in this step" },
          estimatedTime: { type: "string", description: "Realistic time estimate (e.g. 20-30 min, 1-2 hours)" },
          difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] }
        },
        required: ["title", "description", "estimatedTime", "difficulty"]
      },
      minItems: 3,
      maxItems: 5
    },
    suggestedCourses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Full official course title" },
          provider: { type: "string", description: "Provider name (e.g. Coursera, edX, Khan Academy)" },
          url: { type: "string", description: "Direct enrollment or course page URL (must be real and working)" },
          estimatedTime: { type: "string", description: "Duration of the course" },
          level: { type: "string", description: "Difficulty level of the course" },
          reason: { type: "string", description: "Why this course is recommended based on the student's history" }
        },
        required: ["title", "provider", "url", "estimatedTime", "level", "reason"]
      },
      minItems: 3,
      maxItems: 4
    }
  },
  required: ["path", "suggestedCourses"],
  additionalProperties: false
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { queries } = await request.json()

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: 'No learning history provided' }, { status: 400 })
    }

    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      console.error('XAI_API_KEY is not configured')
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 503 })
    }

    // Build rich context from the student's real discovery + chat history
    const historyContext = queries
      .map((q: any, index: number) => 
        `${index + 1}. Search: "${q.shortSearch}" | Question: "${q.fullQuestion}"${q.gradeLevel ? ` | Grade: ${q.gradeLevel}` : ''}`
      )
      .join('\n')

    const prompt = `You are an expert personalized learning coach for Skill-Gain, a gamified AI learning platform.

A student has the following recent search and question history from our discovery experience and AI chat interactions:

${historyContext}

Based ONLY on this real history, generate a highly personalized response with TWO parts:

1. **path**: A 3-5 step progressive learning path. Each step must feel directly connected to what the student has been exploring. Make descriptions specific and actionable.

2. **suggestedCourses**: 3-4 excellent formal online courses from reputable providers (Coursera, edX, Khan Academy, Stanford Online, etc.). 
   - Only recommend real, currently available courses with accurate direct URLs.
   - Prioritize courses that complement the student's demonstrated interests and questions.
   - Include a clear, specific "reason" explaining why it fits THIS student's history.

Return ONLY valid JSON matching the required schema. No extra text.`

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "learning_path_and_courses",
            schema: LEARNING_SCHEMA,
            strict: true
          }
        },
        temperature: 0.4,
        max_tokens: 3000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grok API error in generate-path:', response.status, errorText)
      return NextResponse.json({ error: 'Failed to generate personalized recommendations' }, { status: 502 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 })
    }

    let parsed: GrokLearningResponse
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse Grok JSON:', parseError)
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 })
    }

    // Final safety validation
    if (!parsed.path || !Array.isArray(parsed.path) || parsed.path.length === 0) {
      return NextResponse.json({ error: 'AI returned invalid learning path' }, { status: 502 })
    }

    if (!parsed.suggestedCourses || !Array.isArray(parsed.suggestedCourses)) {
      parsed.suggestedCourses = []
    }

    return NextResponse.json({
      path: parsed.path,
      suggestedCourses: parsed.suggestedCourses
    })

  } catch (error) {
    console.error('Error in generate-path route:', error)
    return NextResponse.json({ error: 'Failed to generate learning recommendations' }, { status: 500 })
  }
}
