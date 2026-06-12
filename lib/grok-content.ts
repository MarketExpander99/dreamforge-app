// lib/grok-content.ts
// Grok AI Content Generator Helper - Safe for both Server and Client usage
import { ContentItem } from './data'

interface GrokContentRequest {
  gradeLevel: string
  subject: string
  count?: number
  style?: string
  userId?: string
  tier?: 1 | 2 | 3
  pathId?: string
}

interface GrokContentResponse {
  items: ContentItem[]
}

const CONTENT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          content: { type: "string" },
          type: { type: "string", enum: ["text", "text-image", "video", "quiz", "audio"] },
          category_id: { type: "string" },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          tags: { type: "array", items: { type: "string" } },
          read_time: { type: "integer", minimum: 3, maximum: 15 },
          is_featured: { type: "boolean" },
          grade_level: { type: "string" }
        },
        required: ["id", "title", "content", "type", "category_id", "difficulty", "tags", "read_time", "is_featured", "grade_level"]
      }
    }
  },
  required: ["items"]
}

export async function generateContentWithGrok({
  gradeLevel,
  subject,
  count = 4,
  style = "fun-gamified",
  userId,
  tier = 1,
}: GrokContentRequest): Promise<GrokContentResponse> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY environment variable is not set')

  // Only attempt history context if we're running on the server
  let historyContext = ''
  if (userId && typeof window === 'undefined') {
    try {
      // Dynamic import to avoid bundling server code into client
      const { createClient } = await import('./supabase-server')
      const supabase = await createClient()

      const { data: completed } = await supabase
        .from('user_progress')
        .select('content_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .limit(6)

      if (completed && completed.length > 0) {
        const completedIds = completed.map((c: any) => c.content_id).slice(0, 4)
        historyContext = `User has previously completed content related to: ${completedIds.join(', ')}. Build on this knowledge.`
      }
    } catch (err) {
      // Fail silently if server client can't be created from client context
      console.warn('Could not fetch user history for Grok generation:', err)
    }
  }

  const diversityRules = `
STRICT DIVERSITY RULES:
- Generate exactly ${count} DISTINCT cards.
- Each card must cover a different angle of "${subject}".
- Card 1: Core concept + simple example
- Card 2: Practical application or real-world use
- Card 3+: Deeper insight, misconception, or interesting connection
- All titles and content must be unique.
`

  const prompt = `Generate ${count} unique, engaging educational cards for ${gradeLevel} students about "${subject}".

Style: ${style}
Tier: ${tier}

${historyContext}

${diversityRules}

Write rich, article-like explanations. Include real-world connections and light gamification.

Return ONLY valid JSON matching the schema.`

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: { name: "educational_content", schema: CONTENT_SCHEMA, strict: true }
      },
      temperature: 0.82,
      max_tokens: 4500
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Grok API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  try {
    const parsed = JSON.parse(data.choices[0].message.content)

    if (!parsed?.items || !Array.isArray(parsed.items)) {
      throw new Error('Invalid response from Grok')
    }

    const items: ContentItem[] = parsed.items.slice(0, count).map((item: any, index: number) => ({
      ...item,
      id: item.id || `grok-${subject.toLowerCase().replace(/\s+/g, '')}-${Date.now()}-${index}`,
      likes: 0,
      views: 0,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: null,
      video_url: null,
      audio_url: null,
      quiz: null
    }))

    return { items }
  } catch (error) {
    console.error('Failed to parse Grok response:', error)
    throw new Error('Failed to parse content from Grok')
  }
}