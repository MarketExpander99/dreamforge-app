// lib/ai/lecture-generation.ts
// Two-Stage Lecture Generation (Master Document → Progressive Sections)
// Per Developer Spec (Draft v1, 2026-06-26)
//
// Stage 1: One cohesive, high-quality master lecture (no internal sectioning).
// Stage 2: Strict curriculum-designer split with zero-duplication rules.
// 
// This is the canonical service for deep, duplication-free lectures.
// Reuses existing xAI Grok call pattern (no new deps).
// Designed for use from Server Actions / API routes only (server-side).

import { createClient } from '@/lib/supabase-server'

export interface LectureGenerationParams {
  topic: string
  learningPathContext?: string
  targetAudience?: string
  desiredSectionCount?: number // hint only; model decides best
  maxMasterTokens?: number
}

export interface LectureSection {
  section_number: number
  title: string
  content: string
  key_takeaways: string[]
  estimated_minutes: number
  prerequisites: string
  reflection_prompt?: string
}

export interface GenerateProgressiveLectureResult {
  masterLecture: string
  sections: LectureSection[]
  topic: string
  metadata: {
    generatedAt: string
    sectionCount: number
    estimatedTotalMinutes: number
    // Future: tokenUsage, model, etc.
  }
}

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions'
const DEFAULT_MODEL = 'grok-3' // Matches recent high-quality path generation

// ---------- STAGE 1: MASTER LECTURE GENERATION (exact spec prompts) ----------

const STAGE1_SYSTEM_PROMPT = `You are an exceptional educator, curriculum designer, and subject-matter expert. Your task is to create the single highest-quality, most comprehensive, accurate, and engaging master lecture possible on any given topic.

Core principles:
- Depth without unnecessary verbosity.
- Clear explanations that start simple and progressively add complexity.
- Rich, memorable examples and analogies (varied, not repetitive).
- Connections to real-world applications and related concepts.
- Address common misconceptions proactively.
- Conversational yet precise tone suitable for motivated self-learners or students at the specified level.
- Use Markdown for excellent readability (headings, bullet lists, numbered steps, code blocks, tables where helpful). Never use tables for layout.
- Do NOT pre-divide the lecture into numbered "Sections". Produce one cohesive, flowing master document.
- End with a thoughtful summary and suggestions for further exploration or practice.

Write at the depth and length appropriate for a thorough treatment of the topic (typically 1500–4500 words depending on complexity). Prioritize clarity, insight, and pedagogical value above all.`

function buildStage1UserPrompt(params: LectureGenerationParams): string {
  const { topic, learningPathContext = 'General self-directed learning', targetAudience = 'motivated high-school or early university learners' } = params

  return `Create a comprehensive master lecture on the following topic:

**Topic**: ${topic}

**Learning Context** (from the user's current path or profile):
${learningPathContext}

**Target Audience / Level**: ${targetAudience}

**Specific Requirements**:
- Start with a compelling motivation / "why this matters" section.
- Include 4–8 rich, varied examples or worked scenarios.
- Explicitly call out 3–5 common pitfalls or misconceptions.
- Connect to at least 2–3 related or prerequisite topics the learner may already know.
- Finish with a concise summary + 3 recommended next exploration directions.

Output only the master lecture in clean Markdown. Do not add meta commentary.`
}

// ---------- STAGE 2: PROGRESSIVE SPLIT (exact spec prompts + strict JSON) ----------

const STAGE2_SYSTEM_PROMPT = `You are a master instructional designer and learning scientist. You will receive a complete master lecture. Your ONLY job is to divide it into the smallest number of logical, progressive sections that still give excellent scaffolding (typically 4–7 sections).

CRITICAL ANTI-DUPLICATION & PROGRESSION RULES (follow strictly):

1. ZERO REPETITION: Every section must introduce genuinely NEW concepts, depth, examples, or perspectives. NEVER repeat a definition, analogy, explanation, or example that appeared in an earlier section. If something must be referenced, do so with a very brief "as you learned in Section X" and move on.

2. TRUE PROGRESSION: Later sections assume the learner has mastered earlier ones. Build complexity, add nuance, show applications, then extensions.

3. SECTION TITLES: Use clear, descriptive titles that telegraph the learning journey, e.g.:
   - "1. Foundations: Core Definitions & Mental Models"
   - "2. Mechanisms: How It Actually Works Under the Hood"
   - "3. Worked Examples: From Simple to Real-World"
   - "4. Common Pitfalls, Misconceptions & Edge Cases"
   - "5. Advanced Applications & System-Level Thinking"
   - "6. Synthesis, Connections & Your Next Steps"

4. For EVERY section output:
   - section_number (integer)
   - title (string)
   - content (string) — the full readable content for that section, adapted slightly for standalone flow if needed but preserving original insight and voice
   - key_takeaways (array of 3–5 concise bullet strings)
   - estimated_minutes (integer, realistic study + reflection time)
   - prerequisites (string, e.g. "None" or "Section 1 and basic algebra")
   - reflection_prompt (string, optional but recommended — a short question or mini-exercise)

5. Decide the optimal number of sections based on the lecture's natural structure and complexity. Fewer high-quality sections are better than many thin ones.

6. Maintain the original depth, accuracy, examples, and engaging tone. Only reorganize and lightly adapt for section independence.

7. Output MUST be valid JSON (no markdown code fences around the JSON itself). Use this exact schema:
[
  {
    "section_number": 1,
    "title": "Foundations: ...",
    "content": "Full markdown content here...",
    "key_takeaways": ["...", "..."],
    "estimated_minutes": 15,
    "prerequisites": "None",
    "reflection_prompt": "Try explaining ... in your own words before moving on."
  },
  ...
]`

function buildStage2UserPrompt(topic: string, masterLecture: string): string {
  return `Here is the full master lecture on **${topic}**:

---
${masterLecture}
---

Please split this lecture into logical progressive sections following every rule in your system prompt exactly. 

Decide the best number of sections for this topic (aim for quality over quantity). Output ONLY the JSON array — no extra text before or after.`
}

// ---------- GROK CALL HELPERS (match existing codebase patterns) ----------

async function callGrokForText(params: {
  system: string
  user: string
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set')
  }

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user }
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 6000
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Grok API error (master): ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content || typeof content !== 'string') {
    throw new Error('Grok returned empty or invalid master lecture content')
  }

  return content.trim()
}

const SECTION_ARRAY_SCHEMA = {
  type: 'array',
  minItems: 3,
  maxItems: 8,
  items: {
    type: 'object',
    properties: {
      section_number: { type: 'integer', minimum: 1 },
      title: { type: 'string' },
      content: { type: 'string' },
      key_takeaways: {
        type: 'array',
        items: { type: 'string' },
        minItems: 3,
        maxItems: 5
      },
      estimated_minutes: { type: 'integer', minimum: 5, maximum: 90 },
      prerequisites: { type: 'string' },
      reflection_prompt: { type: 'string' }
    },
    required: ['section_number', 'title', 'content', 'key_takeaways', 'estimated_minutes', 'prerequisites'],
    additionalProperties: false
  }
} as const

async function callGrokForSections(params: {
  system: string
  user: string
}): Promise<LectureSection[]> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set')
  }

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'progressive_lecture_sections',
          schema: SECTION_ARRAY_SCHEMA,
          strict: true
        }
      },
      temperature: 0.4, // lower for precise restructuring
      max_tokens: 8000
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Grok API error (split): ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content

  if (!raw) {
    throw new Error('Grok returned empty content for sections')
  }

  let parsed: any
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    throw new Error('Failed to parse sections JSON from Grok')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array of sections from Grok')
  }

  // Basic normalization + validation
  const sections: LectureSection[] = parsed.map((s: any, idx: number) => ({
    section_number: Number(s.section_number) || idx + 1,
    title: String(s.title || `Section ${idx + 1}`).trim(),
    content: String(s.content || '').trim(),
    key_takeaways: Array.isArray(s.key_takeaways) ? s.key_takeaways.map((t: any) => String(t).trim()) : [],
    estimated_minutes: Number(s.estimated_minutes) || 15,
    prerequisites: String(s.prerequisites || 'None').trim(),
    reflection_prompt: s.reflection_prompt ? String(s.reflection_prompt).trim() : undefined
  }))

  // Enforce strict anti-duplication sanity at runtime (warn only)
  const allLower = sections.map(s => s.content.toLowerCase()).join('\n\n')
  const sentenceSet = new Set(allLower.split(/[.!?]\s+/).filter(Boolean))
  if (sentenceSet.size < (sections.length * 4)) {
    console.warn('[lecture-generation] Possible duplication detected across sections (low unique sentence count). Review prompt or output.')
  }

  // Ensure ordering
  sections.sort((a, b) => a.section_number - b.section_number)

  return sections
}

// ---------- PUBLIC API ----------

/**
 * Stage 1 only: Generate the single cohesive master lecture.
 * Returns clean Markdown. No sectioning.
 */
export async function generateMasterLecture(
  params: LectureGenerationParams
): Promise<string> {
  const system = STAGE1_SYSTEM_PROMPT
  const user = buildStage1UserPrompt(params)

  const master = await callGrokForText({
    system,
    user,
    maxTokens: params.maxMasterTokens ?? 6500,
    temperature: 0.72
  })

  return master
}

/**
 * Stage 2 only: Take a full master lecture and split it into progressive sections.
 * Enforces zero repetition + true scaffolding.
 */
export async function splitMasterIntoProgressiveSections(
  masterLecture: string,
  topic: string,
  desiredCount?: number
): Promise<LectureSection[]> {
  if (!masterLecture || masterLecture.trim().length < 200) {
    throw new Error('Master lecture too short to split reliably')
  }

  const system = STAGE2_SYSTEM_PROMPT
  const user = buildStage2UserPrompt(topic, masterLecture)

  const sections = await callGrokForSections({ system, user })

  // Optional desired count hint check (we don't force, per spec)
  if (desiredCount && sections.length !== desiredCount) {
    console.log(`[lecture-generation] Model chose ${sections.length} sections (hint was ${desiredCount})`)
  }

  return sections
}

/**
 * Full two-stage orchestrator.
 * 1. Produce master lecture (source of truth).
 * 2. Split with strict anti-duplication + progressive rules.
 *
 * Does NOT persist. Caller (Server Action / route) decides persistence.
 */
export async function generateProgressiveLecture(
  params: LectureGenerationParams
): Promise<GenerateProgressiveLectureResult> {
  const { topic } = params

  // STAGE 1
  const masterLecture = await generateMasterLecture(params)

  // Guard for trivially short topics (open question in spec — here we proceed but log)
  const wordCount = masterLecture.split(/\s+/).length
  if (wordCount < 600) {
    console.warn(`[lecture-generation] Short master lecture for "${topic}" (${wordCount} words). Consider single-stage fallback for very narrow topics.`)
  }

  // STAGE 2
  const sections = await splitMasterIntoProgressiveSections(
    masterLecture,
    topic,
    params.desiredSectionCount
  )

  const totalMinutes = sections.reduce((sum, s) => sum + (s.estimated_minutes || 0), 0)

  return {
    masterLecture,
    sections,
    topic,
    metadata: {
      generatedAt: new Date().toISOString(),
      sectionCount: sections.length,
      estimatedTotalMinutes: totalMinutes
    }
  }
}

// Optional helper for future admin/test usage (no persistence yet)
export async function generateAndReturnOnly(params: LectureGenerationParams) {
  return generateProgressiveLecture(params)
}
