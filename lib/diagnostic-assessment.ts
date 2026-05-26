// AI-Powered Diagnostic Assessment - Generates and evaluates balanced assessment questions
import { createClient } from './supabase-server'

export interface DiagnosticQuestion {
  id: string
  subject: 'Mathematics' | 'English' | 'Natural Sciences' | 'Life Skills'
  question: string
  options?: string[]
  correct_answer?: string
  question_type: 'multiple_choice' | 'short_answer'
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface DiagnosticResult {
  recommended_grade: string
  subject_proficiency: {
    Mathematics: number
    English: number
    'Natural Sciences': number
    'Life Skills': number
  }
  overall_score: number
  strengths: string[]
  gaps: string[]
  suggested_topics: string[]
  assessment_summary: string
}

export interface AssessmentSubmission {
  userId: string
  age: number
  responses: Array<{
    questionId: string
    question: string
    answer: string
    subject: string
  }>
}

/**
 * Generate diagnostic assessment questions using Grok AI
 */
export async function generateDiagnosticQuestions(userId: string): Promise<DiagnosticQuestion[]> {
  const supabase = await createClient()

  // Get user's age from profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('age')
    .eq('id', userId)
    .single()

  if (error || !profile?.age) {
    throw new Error('User age not found in profile')
  }

  const age = profile.age

  const prompt = `You are an expert educational assessment designer specializing in the South African CAPS (Curriculum and Assessment Policy Statement) curriculum. Create a balanced diagnostic assessment for a ${age}-year-old student aligned with CAPS Foundation Phase (Grades R-3) or Intermediate Phase (Grades 4-6) depending on age.

Requirements:
- Generate exactly 12 questions total (3 from each subject)
- Subjects: Mathematics, English Home Language, Natural Sciences, Life Skills (Social Sciences focus for General Knowledge)
- Mix of multiple choice (8 questions) and short answer (4 questions)
- Age-appropriate difficulty and content based on CAPS curriculum outcomes for the student's estimated grade level
- Questions should assess foundational knowledge, problem-solving skills, and CAPS-specific competencies like critical thinking and application
- Ensure questions reflect South African context where appropriate (e.g., local examples, cultural relevance)

For each question, provide:
- subject: One of "Mathematics", "English", "Natural Sciences", "Life Skills"
- question: Clear, age-appropriate question text aligned with CAPS
- question_type: "multiple_choice" or "short_answer"
- options: For multiple choice, provide exactly 4 options (A, B, C, D) with one correct
- correct_answer: For multiple choice, the correct option letter (A/B/C/D); for short answer, a brief expected response or key concept
- difficulty: "easy", "medium", or "hard" relative to CAPS expectations

Return only valid JSON array of questions.`

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: 'grok-beta',
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "diagnostic_questions",
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                subject: {
                  type: "string",
                  enum: ["Mathematics", "English", "Natural Sciences", "Life Skills"]
                },
                question: { type: "string" },
                question_type: {
                  type: "string",
                  enum: ["multiple_choice", "short_answer"]
                },
                options: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 4,
                  maxItems: 4
                },
                correct_answer: { type: "string" },
                difficulty: {
                  type: "string",
                  enum: ["easy", "medium", "hard"]
                }
              },
              required: ["subject", "question", "question_type", "correct_answer", "difficulty"]
            },
            minItems: 12,
            maxItems: 12
          },
          strict: true
        }
      },
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`)
  }

  const data = await response.json()
  const questions: DiagnosticQuestion[] = JSON.parse(data.choices[0].message.content)

  // Add IDs to questions
  return questions.map((q, index) => ({
    ...q,
    id: `diagnostic-q-${index + 1}`
  }))
}

/**
 * Evaluate diagnostic assessment responses using Grok AI
 */
export async function evaluateDiagnosticAssessment(submission: AssessmentSubmission): Promise<DiagnosticResult> {
  const { responses, age } = submission

  const prompt = `You are an expert educational assessor specializing in South African CAPS curriculum. Evaluate this ${age}-year-old student's diagnostic assessment responses and provide a comprehensive analysis aligned with CAPS expectations.

Assessment Responses:
${responses.map((r, i) => `
Question ${i + 1} (${r.subject}): ${r.question}
Student Answer: ${r.answer}
`).join('\n')}

Based on these responses, provide a detailed evaluation:

1. **recommended_grade**: Recommended CAPS grade level (e.g., "Grade R", "Grade 1", "Grade 2", "Grade 3") based on overall performance and age appropriateness
2. **subject_proficiency**: Proficiency scores (0-100) for each subject: Mathematics, English, Natural Sciences, Life Skills based on accuracy and quality of responses
3. **overall_score**: Average proficiency across all subjects (0-100)
4. **strengths**: Array of 2-4 specific strengths demonstrated, referencing CAPS competencies
5. **gaps**: Array of 2-4 areas needing improvement, aligned with CAPS outcomes
6. **suggested_topics**: Array of 5-8 specific CAPS-aligned topics to focus on initially, prioritized by knowledge gaps
7. **assessment_summary**: A brief 2-3 sentence summary of the student's overall performance and readiness for CAPS curriculum

Consider:
- CAPS curriculum expectations for the estimated grade level
- Age-appropriate benchmarks for South African education
- Accuracy of answers and depth of understanding
- Quality of responses (for short answers)
- Subject-specific CAPS knowledge and skills
- Areas of relative strength and weakness
- Appropriate grade placement for continued CAPS learning

Return only valid JSON.`

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: 'grok-beta',
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "diagnostic_evaluation",
          schema: {
            type: "object",
            properties: {
              recommended_grade: { type: "string" },
              subject_proficiency: {
                type: "object",
                properties: {
                  Mathematics: { type: "number", minimum: 0, maximum: 100 },
                  English: { type: "number", minimum: 0, maximum: 100 },
                  "Natural Sciences": { type: "number", minimum: 0, maximum: 100 },
                  "Life Skills": { type: "number", minimum: 0, maximum: 100 }
                },
                required: ["Mathematics", "English", "Natural Sciences", "Life Skills"]
              },
              overall_score: { type: "number", minimum: 0, maximum: 100 },
              strengths: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 4
              },
              gaps: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 4
              },
              suggested_topics: {
                type: "array",
                items: { type: "string" },
                minItems: 5,
                maxItems: 8
              },
              assessment_summary: { type: "string" }
            },
            required: ["recommended_grade", "subject_proficiency", "overall_score", "strengths", "gaps", "suggested_topics", "assessment_summary"]
          },
          strict: true
        }
      },
      temperature: 0.3,
      max_tokens: 1500
    })
  })

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`)
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content) as DiagnosticResult
}

/**
 * Save diagnostic assessment results to diagnostic_results table
 */
export async function saveDiagnosticResults(userId: string, results: DiagnosticResult): Promise<void> {
  const supabase = await createClient()

  // Save to diagnostic_results table
  const { error: insertError } = await supabase
    .from('diagnostic_results')
    .insert({
      user_id: userId,
      recommended_grade: results.recommended_grade,
      overall_score: results.overall_score,
      subject_proficiency: results.subject_proficiency,
      strengths: results.strengths,
      gaps: results.gaps,
      suggested_topics: results.suggested_topics,
      assessment_summary: results.assessment_summary
    })

  if (insertError) {
    throw new Error(`Failed to save diagnostic results: ${insertError.message}`)
  }

  // Convert subject proficiency to the format expected by adaptive engine
  const proficiencyData = {
    [`${results.recommended_grade.toLowerCase().replace(' ', '_')}_mathematics`]: results.subject_proficiency.Mathematics,
    [`${results.recommended_grade.toLowerCase().replace(' ', '_')}_english`]: results.subject_proficiency.English,
    [`${results.recommended_grade.toLowerCase().replace(' ', '_')}_natural_sciences`]: results.subject_proficiency['Natural Sciences'],
    [`${results.recommended_grade.toLowerCase().replace(' ', '_')}_life_skills`]: results.subject_proficiency['Life Skills']
  }

  // Update profile with diagnostic results
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      grade_level: results.recommended_grade,
      proficiency: proficiencyData,
      assessment_completed: true,
      assessment_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Failed to update profile with diagnostic results:', updateError)
  }
}

/**
 * Trigger initial content generation for recommended grade and weak areas
 */
export async function triggerInitialContentGeneration(userId: string, results: DiagnosticResult): Promise<void> {
  const supabase = await createClient()

  try {
    // Generate content for weak areas (proficiency < 70)
    const weakSubjects = Object.entries(results.subject_proficiency)
      .filter(([, score]) => score < 70)
      .map(([subject]) => {
        if (subject === 'Natural Sciences') return 'science';
        if (subject === 'Life Skills') return 'general_knowledge';
        return subject.toLowerCase().replace(' ', '_');
      });

    // If no weak areas, generate for all subjects
    const subjectsToGenerate = weakSubjects.length > 0 ? weakSubjects : ['mathematics', 'english', 'science', 'general_knowledge']

    // Generate initial content for each weak subject
    for (const subject of subjectsToGenerate.slice(0, 2)) { // Limit to 2 subjects initially
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/content/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gradeLevel: results.recommended_grade,
            subject: subject,
            count: 3,
            style: 'diagnostic-remediation',
            priorityTopics: results.suggested_topics.slice(0, 3)
          })
        })

        if (!response.ok) {
          console.warn(`Failed to generate content for ${subject}`)
        }
      } catch (error) {
        console.warn(`Error generating content for ${subject}:`, error)
      }
    }

    console.log(`Triggered initial content generation for user ${userId} in grade ${results.recommended_grade}`)
  } catch (error) {
    console.error('Error triggering initial content generation:', error)
  }
}