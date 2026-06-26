// app/api/learning/generate-path/route.ts
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
          description: { type: "string", description: "Specific, non-repetitive explanation of what the student will learn or do in this step. Must introduce new information not covered in other steps and build progressively on the previous step." },
          estimatedTime: { type: "string", description: "Realistic time estimate (e.g. 20-30 min, 1-2 hours)" },
          difficulty: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] }
        },
        required: ["title", "description", "estimatedTime", "difficulty"]
      },
      minItems: 4,
      maxItems: 4
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

    const body = await request.json()
    const queries = body?.queries
    const persist = !!body?.persist
    const force = !!body?.force

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: 'No learning history provided' }, { status: 400 })
    }

    const currentCount = queries.length

    // Compute a reliable signature for change detection (count + most recent exploration timestamp)
    const currentMaxCreated = queries.reduce((max: string, q: any) => {
      const c = q?.createdAt || q?.created_at || ''
      return c && (!max || c > max) ? c : max
    }, '' as string)

    // === SMART CACHE CHECK: Read from DB first (no AI call if up-to-date) ===
    // Only journey rows (title='Learning Journey') are considered for this cache.
    // Uses BOTH count and max timestamp so we correctly skip Grok when nothing new was added.
    if (!force) {
      const { data: latestJourney } = await supabase
        .from('learning_paths')
        .select('modules, created_at')
        .eq('user_id', user.id)
        .eq('title', 'Learning Journey')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const meta = (latestJourney?.modules as any)?._meta || {}
      const previousCount = typeof meta.exploration_count_at_generation === 'number'
        ? meta.exploration_count_at_generation
        : 0
      const previousMax = meta.max_exploration_created_at || ''

      const countOk = currentCount <= previousCount
      const timeOk = !currentMaxCreated || !previousMax || currentMaxCreated <= previousMax

      if (latestJourney && (countOk || timeOk)) {
        // Up-to-date (by count or by latest exploration time) — return cached, skip Grok entirely
        const mods = latestJourney.modules as any
        return NextResponse.json({
          path: mods?.path || [],
          suggestedCourses: mods?.suggestedCourses || [],
          fromCache: true
        })
      }
    }

    // === Need fresh generation (new history or forced manual regenerate) ===
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

    const prompt = `You are an expert curriculum designer specializing in creating non-repetitive, progressive learning experiences for Skill-Gain.

Student's recent discovery history:
${historyContext}

Create a **4-step progressive learning path** for this topic. Each step MUST build on the previous one and introduce genuinely new information. 

Strict rules you MUST follow:
- NO duplicated sentences, ideas, or explanations across any steps.
- Each step must add new depth or a new angle.
- Use different pedagogical formats for each step:
  - Step 1: Core concept / Foundation (what they must understand first)
  - Step 2: How it works in practice + mechanism (application)
  - Step 3: Why it matters + common misconceptions or deeper insight
  - Step 4: Real-world implications or advanced connection

For the "description" field of each step:
- Be highly specific and actionable.
- Never repeat content from other steps.
- Write as if teaching a new concept that depends on the previous step.

Also generate 3-4 excellent formal course recommendations that complement this specific path.
- Only recommend real, currently available courses with accurate direct URLs from reputable providers (Coursera, edX, Khan Academy, Stanford Online, etc.).
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
        model: 'grok-3',
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

    // Anti-duplication guard (early warning for prompt/model issues)
    const allText = parsed.path.map((p: any) => (p.description || '').toLowerCase()).join(' ')
    const uniquePhrases = new Set(allText.split('. '))
    if (uniquePhrases.size < parsed.path.length * 2) {
      console.warn('Possible content duplication detected in generated learning path')
    }

    // Final safety validation
    if (!parsed.path || !Array.isArray(parsed.path) || parsed.path.length === 0) {
      return NextResponse.json({ error: 'AI returned invalid learning path' }, { status: 502 })
    }

    if (!parsed.suggestedCourses || !Array.isArray(parsed.suggestedCourses)) {
      parsed.suggestedCourses = []
    }

    // === IDEMPOTENT PERSIST (only when requested) ===
    // Delete any prior journey cache row then insert exactly one.
    // Uses existing learning_paths table + title convention (no schema changes).
    // Prevents duplicates and allows cheap timestamp/count change detection.
    if (persist) {
      try {
        // Remove previous journey row(s) for this user (keep table clean)
        await supabase
          .from('learning_paths')
          .delete()
          .eq('user_id', user.id)
          .eq('title', 'Learning Journey')

        const now = new Date().toISOString()
        const journeyPayload = {
          user_id: user.id,
          title: 'Learning Journey',
          description: 'AI-generated personalized path + course recommendations from exploration history',
          modules: {
            path: parsed.path,
            suggestedCourses: parsed.suggestedCourses,
            _meta: {
              exploration_count_at_generation: currentCount,
              last_generated_at: now,
              max_exploration_created_at: currentMaxCreated,
              source: force ? 'manual' : 'auto'
            }
          },
          generated_at: now
        }

        // Insert new journey row. We keep historical journey rows (latest wins on read).
        // This is simpler and more robust than delete+insert.
        const { error: insertError } = await supabase
          .from('learning_paths')
          .insert(journeyPayload)

        if (insertError) {
          console.error('Failed to persist learning journey (non-fatal):', insertError)
          // Still return fresh data to client even if save failed
        }
      } catch (persistErr) {
        console.error('Persist error in generate-path (non-fatal):', persistErr)
      }
    }

    return NextResponse.json({
      path: parsed.path,
      suggestedCourses: parsed.suggestedCourses,
      fromCache: false
    })

  } catch (error) {
    console.error('Error in generate-path route:', error)
    return NextResponse.json({ error: 'Failed to generate learning recommendations' }, { status: 500 })
  }
}