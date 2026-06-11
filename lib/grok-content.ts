// lib/grok-content.ts
// Grok AI Content Generator Helper - Enhanced with user history, chats, completed items, 3-tier support & continuity
import { ContentItem } from './data'
import { createClient } from './supabase-server'

interface GrokContentRequest {
  gradeLevel: string
  subject: string
  count?: number
  style?: string
  // NEW: Personalization
  userId?: string
  tier?: 1 | 2 | 3 // 1=foundational, 2=intermediate, 3=advanced/synthesis
  pathId?: string
}

interface GrokContentResponse {
  items: ContentItem[]
}

// JSON Schema for structured Grok output (full original schema preserved)
const CONTENT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Unique identifier for the content item (use format: grok-{subject}-{grade}-{timestamp}-{index})"
          },
          title: {
            type: "string",
            description: "Engaging, educational title for the content"
          },
          content: {
            type: "string",
            description: "Rich, educational content with clear explanations and examples"
          },
          type: {
            type: "string",
            enum: ["text", "text-image", "video", "quiz", "audio"],
            description: "Content type - prefer 'text' or 'text-image' for educational content"
          },
          category_id: {
            type: "string",
            description: "Category ID - use appropriate category based on subject (e.g., 'science', 'math', 'history', etc.)"
          },
          difficulty: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
            description: "Difficulty level appropriate for the grade level"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Relevant tags including grade level, subject, and key concepts"
          },
          read_time: {
            type: "integer",
            description: "Estimated reading time in minutes (3-15 range)",
            minimum: 3,
            maximum: 15
          },
          is_featured: {
            type: "boolean",
            description: "Whether this content should be featured (set to false for generated content)"
          },
          grade_level: {
            type: "string",
            description: "Grade level this content is appropriate for"
          }
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
  count = 5,
  style = "fun-gamified",
  userId,
  tier = 1,
  pathId
}: GrokContentRequest): Promise<GrokContentResponse> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set')
  }

  let historyContext = ''
  let continuityPrompt = ''

  // Fetch user history/chats/completed when userId provided (safe, no schema change)
  if (userId) {
    const supabase = await createClient()   // ← FIXED: await added

    const { data: completed } = await supabase
      .from('user_progress')
      .select('content_id, status, progress_percentage, completed_at, time_spent')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(8)

    const { data: recentComments } = await supabase
      .from('content_comments')
      .select('comment, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    const completedTopics: string[] = completed?.map((c: any) => c.content_id) || []
    const avgProgress: number = completed && completed.length > 0
      ? Math.round(completed.reduce((sum: number, c: any) => sum + (c.progress_percentage || 0), 0) / completed.length)
      : 0

    const chatInsights = recentComments?.map((c: any) => c.comment).slice(0, 3).join(' | ') || ''

    historyContext = `User has completed ${completedTopics.length} items (avg progress ${avgProgress}%). Recent themes: ${completedTopics.slice(0, 3).join(', ')}.`

    if (chatInsights) {
      historyContext += ` Recent chat insights: ${chatInsights}.`
    }

    const tierDesc = tier === 1
      ? 'Basic foundational concepts with simple examples and clear explanations.'
      : tier === 2
      ? 'Intermediate with practical applications, exercises, and some challenges.'
      : 'Advanced: edge cases, real-world projects, synthesis across topics, and building directly on user\'s past completions.'

    continuityPrompt = completedTopics.length > 0
      ? `Build continuity and themes from user's past completed items (${completedTopics.slice(0, 3).join(', ')}). Reference and extend where naturally related. Adjust depth to user's avg progress of ${avgProgress}%. ${tierDesc}`
      : `Standard introduction suitable for new learners at ${tierDesc}`
  } else {
    continuityPrompt = tier === 1
      ? 'Basic foundational concepts with simple examples.'
      : tier === 2
      ? 'Intermediate with practical applications and exercises.'
      : 'Advanced concepts, edge cases, and synthesis.'
  }

  const prompt = `Generate ${count} educational content items for ${gradeLevel} grade students studying ${subject}.

Style: ${style} - engaging, fun, gamified with interactive elements, real-world examples, age-appropriate challenges.

${historyContext ? historyContext + '\n\n' : ''}
Personalization requirements:
- ${continuityPrompt}
- Each item should be educational and aligned with ${gradeLevel} curriculum standards
- Include clear learning objectives and key concepts
- Use age-appropriate language and examples
- Make content interactive and engaging
- Include practical applications and real-world connections
- Add elements of gamification (challenges, achievements, progress tracking)
- Tier ${tier} depth: ${tier === 1 ? 'foundational' : tier === 2 ? 'applied' : 'advanced/synthesis with past topics'}

Generate exactly ${count} diverse content items covering different aspects of ${subject} at the ${gradeLevel} level.

Return the content as a JSON array following the specified schema.`

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
        json_schema: {
          name: "educational_content",
          schema: CONTENT_SCHEMA,
          strict: true
        }
      },
      temperature: 0.7,
      max_tokens: 4000
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()

  try {
    const parsedContent = JSON.parse(data.choices[0].message.content)

    if (!parsedContent.items || !Array.isArray(parsedContent.items)) {
      throw new Error('Invalid response structure from Grok API')
    }

    const items: ContentItem[] = parsedContent.items.map((item: any) => ({
      ...item,
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
    console.error('Error parsing Grok response:', error)
    throw new Error('Failed to parse content from Grok API')
  }
}