// Adaptive Learning Engine - Core logic for proficiency calculation and Grok evaluation
import { createClient } from './supabase-server'
import { generateContentWithGrok } from './grok-content'

export interface PerformanceData {
  contentId: string
  score?: number // Quiz score (0-100) or completion percentage
  timeSpent: number // Time spent in minutes
  completedAt: string
  contentType: 'text' | 'text-image' | 'video' | 'quiz' | 'audio'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  category: string
  gradeLevel?: string
}

export interface GrokEvaluationResult {
  score: number // Overall proficiency score (0-100)
  strengths: string[]
  weaknesses: string[]
  nextTopics: string[]
  recommendations: string[]
  gradeReadiness?: boolean // Whether ready to advance to next grade
}

export interface ProficiencyData {
  [topic: string]: number // e.g., { "grade_3_math": 82, "grade_3_science": 65 }
}

/**
 * Evaluate user performance using Grok AI and update proficiency
 */
export async function evaluatePerformance(
  userId: string,
  performanceData: PerformanceData
): Promise<GrokEvaluationResult> {
  const supabase = await createClient()

  try {
    // Get user's current proficiency data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('proficiency, grade_level, assessment_completed')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    const currentProficiency: ProficiencyData = profile.proficiency || {}
    const gradeLevel = profile.grade_level
    const hasCompletedAssessment = profile.assessment_completed

    // Prepare context for Grok evaluation
    const context = {
      currentProficiency,
      gradeLevel,
      performanceData,
      recentHistory: await getRecentPerformanceHistory(userId, 5) // Last 5 completions
    }

    // Call Grok for evaluation
    const grokResult = await evaluateWithGrok(context)

    // Update proficiency in database
    const updatedProficiency = updateProficiency(currentProficiency, grokResult, performanceData)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ proficiency: updatedProficiency })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update proficiency:', updateError)
    }

    // Check for grade advancement
    if (grokResult.gradeReadiness && gradeLevel) {
      await checkGradeAdvancement(userId, gradeLevel, updatedProficiency)
    }

    // Auto-generate content if proficiency is low in current topic
    const topicKey = getTopicKey(performanceData)
    if (updatedProficiency[topicKey] < 70) {
      await generatePersonalizedContent(userId, grokResult.nextTopics, gradeLevel)
    }

    return grokResult

  } catch (error) {
    console.error('Error in evaluatePerformance:', error)
    // Return fallback evaluation
    return {
      score: Math.min(performanceData.score || 50, 100),
      strengths: ['Completed content'],
      weaknesses: ['Performance evaluation unavailable'],
      nextTopics: [performanceData.category],
      recommendations: ['Continue practicing']
    }
  }
}

/**
 * Evaluate performance using Grok AI
 */
async function evaluateWithGrok(context: any): Promise<GrokEvaluationResult> {
  const apiKey = process.env.XAI_API_KEY

  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set')
  }

  const prompt = `You are an expert educational assessment AI. Evaluate this student's performance and provide structured feedback.

Current Context:
- Student Grade Level: ${context.gradeLevel || 'Unknown'}
- Current Proficiency: ${JSON.stringify(context.currentProficiency)}
- Recent Performance History: ${JSON.stringify(context.recentHistory)}

Performance Data to Evaluate:
- Content: ${context.performanceData.category} (${context.performanceData.difficulty})
- Score: ${context.performanceData.score || 'N/A'}%
- Time Spent: ${context.performanceData.timeSpent} minutes
- Content Type: ${context.performanceData.contentType}
- Tags: ${context.performanceData.tags?.join(', ') || 'None'}

Please provide a JSON response with:
1. score: Overall proficiency score (0-100) for this topic area
2. strengths: Array of 2-3 specific strengths demonstrated
3. weaknesses: Array of 1-2 areas needing improvement
4. nextTopics: Array of 3-5 recommended next topics to study
5. recommendations: Array of 2-3 specific learning recommendations
6. gradeReadiness: Boolean indicating if student is ready to advance to next grade (true if overall proficiency >= 85%)

Consider:
- Score accuracy and time efficiency
- Topic mastery and knowledge gaps
- Learning progression and readiness for advancement
- Age-appropriate expectations for grade level

Return only valid JSON.`

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
          name: "performance_evaluation",
          schema: {
            type: "object",
            properties: {
              score: { type: "number", minimum: 0, maximum: 100 },
              strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
              weaknesses: { type: "array", items: { type: "string" }, minItems: 0, maxItems: 2 },
              nextTopics: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
              recommendations: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
              gradeReadiness: { type: "boolean" }
            },
            required: ["score", "strengths", "weaknesses", "nextTopics", "recommendations", "gradeReadiness"]
          },
          strict: true
        }
      },
      temperature: 0.3,
      max_tokens: 1000
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const result = JSON.parse(data.choices[0].message.content)

  return result as GrokEvaluationResult
}

/**
 * Update proficiency data based on evaluation
 */
function updateProficiency(
  currentProficiency: ProficiencyData,
  evaluation: GrokEvaluationResult,
  performanceData: PerformanceData
): ProficiencyData {
  const topicKey = getTopicKey(performanceData)
  const currentScore = currentProficiency[topicKey] || 0

  // Weighted average: 70% current proficiency, 30% new evaluation
  const newScore = Math.round((currentScore * 0.7) + (evaluation.score * 0.3))

  return {
    ...currentProficiency,
    [topicKey]: Math.min(100, Math.max(0, newScore))
  }
}

/**
 * Generate a topic key for proficiency tracking
 */
function getTopicKey(performanceData: PerformanceData): string {
  const grade = performanceData.gradeLevel || 'unknown'
  const subject = performanceData.category.toLowerCase().replace(/\s+/g, '_')
  return `${grade}_${subject}`
}

/**
 * Get recent performance history for context
 */
async function getRecentPerformanceHistory(userId: string, limit: number = 5): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_progress')
    .select(`
      content_id,
      status,
      progress_percentage,
      time_spent,
      completed_at,
      content:content_items(title, category_id, difficulty, tags)
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching performance history:', error)
    return []
  }

  return data || []
}

/**
 * Check if user should advance to next grade
 */
async function checkGradeAdvancement(
  userId: string,
  currentGrade: string,
  proficiency: ProficiencyData
): Promise<void> {
  const supabase = await createClient()

  // Calculate average proficiency for current grade topics
  const currentGradeTopics = Object.keys(proficiency).filter(key => key.startsWith(`${currentGrade}_`))
  if (currentGradeTopics.length === 0) return

  const averageProficiency = currentGradeTopics.reduce((sum, key) => sum + proficiency[key], 0) / currentGradeTopics.length

  // Advance if average proficiency >= 85%
  if (averageProficiency >= 85) {
    const nextGrade = getNextGrade(currentGrade)

    const { error } = await supabase
      .from('profiles')
      .update({
        grade_level: nextGrade,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update grade level:', error)
    } else {
      // Send grade advancement notification
      await sendGradeAdvancementNotification(userId, currentGrade, nextGrade)
    }
  }
}

/**
 * Get next grade level
 */
function getNextGrade(currentGrade: string): string {
  const gradeNumbers: { [key: string]: string } = {
    'grade_1': 'grade_2',
    'grade_2': 'grade_3',
    'grade_3': 'grade_4',
    'grade_4': 'grade_5',
    'grade_5': 'grade_6',
    'grade_6': 'grade_7',
    'grade_7': 'grade_8',
    'grade_8': 'grade_9',
    'grade_9': 'grade_10',
    'grade_10': 'grade_11',
    'grade_11': 'grade_12'
  }

  return gradeNumbers[currentGrade] || currentGrade
}

/**
 * Send grade advancement notification
 */
async function sendGradeAdvancementNotification(
  userId: string,
  fromGrade: string,
  toGrade: string
): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'grade_advancement',
        data: {
          fromGrade: fromGrade.replace('_', ' ').toUpperCase(),
          toGrade: toGrade.replace('_', ' ').toUpperCase(),
          message: `Congratulations! You've advanced from ${fromGrade.replace('_', ' ').toUpperCase()} to ${toGrade.replace('_', ' ').toUpperCase()}!`
        }
      })
    })

    if (!response.ok) {
      console.error('Failed to send grade advancement notification')
    }
  } catch (error) {
    console.error('Error sending grade advancement notification:', error)
  }
}

/**
 * Auto-generate personalized content for weak areas
 */
async function generatePersonalizedContent(
  userId: string,
  nextTopics: string[],
  gradeLevel?: string
): Promise<void> {
  if (!gradeLevel || nextTopics.length === 0) return

  try {
    // Generate 3-5 personalized items
    const count = Math.min(Math.max(nextTopics.length, 3), 5)

    // Pick random topics from recommendations
    const selectedTopics = nextTopics
      .sort(() => Math.random() - 0.5)
      .slice(0, count)

    for (const topic of selectedTopics) {
      await generateContentWithGrok({
        gradeLevel,
        subject: topic,
        count: 1,
        style: 'adaptive-remediation'
      })
    }

    console.log(`Generated ${count} personalized content items for user ${userId}`)
  } catch (error) {
    console.error('Error generating personalized content:', error)
  }
}

/**
 * Get next recommended content based on proficiency gaps
 */
export async function getNextRecommendedContent(userId: string, limit: number = 5): Promise<any[]> {
  const supabase = await createClient()

  try {
    // Get user proficiency
    const { data: profile } = await supabase
      .from('profiles')
      .select('proficiency, grade_level')
      .eq('id', userId)
      .single()

    if (!profile?.proficiency) return []

    const proficiency = profile.proficiency as ProficiencyData
    const gradeLevel = profile.grade_level

    // Find topics with lowest proficiency
    const topicScores = Object.entries(proficiency)
      .filter(([key]) => gradeLevel ? key.startsWith(`${gradeLevel}_`) : true)
      .sort(([, a], [, b]) => a - b) // Sort by lowest proficiency first

    if (topicScores.length === 0) return []

    // Get content for weak topics
    const weakTopics = topicScores.slice(0, 3).map(([key]) => key.split('_').slice(1).join('_'))

    const { data: content } = await supabase
      .from('content_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_published', true)
      .or(weakTopics.map(topic => `tags.cs.{${topic}}`).join(','))
      .order('created_at', { ascending: false })
      .limit(limit)

    return content || []

  } catch (error) {
    console.error('Error getting next recommended content:', error)
    return []
  }
}

/**
 * Check if user is ready for grade advancement
 */
export async function checkGradeAdvancementReadiness(userId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('proficiency, grade_level')
      .eq('id', userId)
      .single()

    if (!profile?.proficiency || !profile.grade_level) return false

    const proficiency = profile.proficiency as ProficiencyData
    const gradeLevel = profile.grade_level

    // Calculate average proficiency for current grade
    const gradeTopics = Object.keys(proficiency).filter(key => key.startsWith(`${gradeLevel}_`))
    if (gradeTopics.length === 0) return false

    const averageProficiency = gradeTopics.reduce((sum, key) => sum + proficiency[key], 0) / gradeTopics.length

    return averageProficiency >= 85

  } catch (error) {
    console.error('Error checking grade advancement readiness:', error)
    return false
  }
}

/**
 * Initialize adaptive engine with diagnostic assessment results
 * This should be called after a user completes their diagnostic assessment
 */
export async function initializeWithDiagnosticResults(
  userId: string,
  diagnosticResults: {
    recommended_grade: string
    subject_proficiency: {
      Mathematics: number
      English: number
      'Natural Sciences': number
      'Life Skills': number
    }
    suggested_topics: string[]
  }
): Promise<void> {
  const supabase = await createClient()

  try {
    // Convert diagnostic results to proficiency format
    const proficiencyData: ProficiencyData = {
      [`${diagnosticResults.recommended_grade.toLowerCase().replace(' ', '_')}_mathematics`]: diagnosticResults.subject_proficiency.Mathematics,
      [`${diagnosticResults.recommended_grade.toLowerCase().replace(' ', '_')}_english`]: diagnosticResults.subject_proficiency.English,
      [`${diagnosticResults.recommended_grade.toLowerCase().replace(' ', '_')}_natural_sciences`]: diagnosticResults.subject_proficiency['Natural Sciences'],
      [`${diagnosticResults.recommended_grade.toLowerCase().replace(' ', '_')}_life_skills`]: diagnosticResults.subject_proficiency['Life Skills']
    }

    // Update profile with diagnostic-based proficiency
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        proficiency: proficiencyData,
        grade_level: diagnosticResults.recommended_grade,
        assessment_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to initialize with diagnostic results:', updateError)
      return
    }

    // Generate initial personalized content based on weak areas
    const weakSubjects = Object.entries(diagnosticResults.subject_proficiency)
      .filter(([, score]) => score < 70)
      .map(([subject]) => subject.toLowerCase().replace(' ', '_'))

    // If no weak areas, generate for all subjects
    const subjectsToGenerate = weakSubjects.length > 0 ? weakSubjects : ['mathematics', 'english', 'science', 'general_knowledge']

    // Generate initial content for each subject (limited to avoid overwhelming)
    for (const subject of subjectsToGenerate.slice(0, 2)) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/content/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gradeLevel: diagnosticResults.recommended_grade,
            subject: subject,
            count: 2, // Start with 2 items per subject
            style: 'diagnostic-remediation',
            priorityTopics: diagnosticResults.suggested_topics.slice(0, 3)
          })
        })

        if (!response.ok) {
          console.warn(`Failed to generate initial content for ${subject}`)
        }
      } catch (error) {
        console.warn(`Error generating initial content for ${subject}:`, error)
      }
    }

    console.log(`Initialized adaptive engine for user ${userId} with diagnostic results`)

  } catch (error) {
    console.error('Error initializing with diagnostic results:', error)
  }
}
