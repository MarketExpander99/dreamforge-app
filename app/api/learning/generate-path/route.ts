import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { queries } = await request.json()

    // For MVP we generate a simple dynamic path based on real saved queries.
    // In a future sprint we can call Grok API here for even smarter recommendations.
    const path = [
      {
        title: "Foundational Concepts",
        description: `Review core ideas from your searches: ${queries.slice(0, 2).map((q: any) => q.shortSearch).join(', ')}`,
        estimatedTime: "20-30 min",
        difficulty: "Beginner" as const,
      },
      {
        title: "Deeper Exploration",
        description: "Build on your full questions with targeted lessons and examples.",
        estimatedTime: "45-60 min",
        difficulty: "Intermediate" as const,
      },
      {
        title: "Advanced Application",
        description: "Apply what you've explored to real-world scenarios and projects.",
        estimatedTime: "1-2 hours",
        difficulty: "Advanced" as const,
      },
    ]

    // Build suggested formal courses from discovery/search history (chatlogs & queries)
    const allText = queries
      .map((q: any) => `${q.shortSearch || ''} ${q.fullQuestion || ''} ${q.gradeLevel || ''}`)
      .join(' ')
      .toLowerCase()

    const suggestedCourses: Array<{
      title: string
      provider: string
      url: string
      estimatedTime: string
      level: string
      reason: string
    }> = []

    // Always include high-value meta course for any learner
    suggestedCourses.push({
      title: "Learning How to Learn: Powerful mental tools to help you master tough subjects",
      provider: "University of California San Diego (Coursera)",
      url: "https://www.coursera.org/learn/learning-how-to-learn",
      estimatedTime: "4 weeks (self-paced)",
      level: "All Levels",
      reason: "Essential for building effective study habits and maximizing your personalized learning path.",
    })

    // AI fundamentals - aligns with platform vision
    if (allText.includes('ai') || allText.includes('artificial') || allText.includes('machine') || allText.includes('future') || suggestedCourses.length < 3) {
      suggestedCourses.push({
        title: "AI For Everyone",
        provider: "DeepLearning.AI (Coursera)",
        url: "https://www.coursera.org/learn/ai-for-everyone",
        estimatedTime: "6 hours (self-paced)",
        level: "Beginner",
        reason: "Understand AI capabilities and limitations to navigate the future of learning and work.",
      })
    }

    // Math foundations
    if (allText.match(/math|algebra|calculus|geometry|numbers|equation/)) {
      suggestedCourses.push({
        title: "Mathematics for Machine Learning: Linear Algebra",
        provider: "Imperial College London (Coursera)",
        url: "https://www.coursera.org/learn/linear-algebra-machine-learning",
        estimatedTime: "6 weeks",
        level: "Intermediate",
        reason: "Strengthen core math foundations that power modern AI, data science, and advanced problem-solving.",
      })
    }

    // Programming / Python
    if (allText.match(/python|code|program|javascript|web|software|develop/)) {
      suggestedCourses.push({
        title: "Python for Everybody Specialization",
        provider: "University of Michigan (Coursera)",
        url: "https://www.coursera.org/specializations/python",
        estimatedTime: "8 weeks (self-paced)",
        level: "Beginner",
        reason: "Learn to code with Python — one of the most versatile languages for AI, automation, and data work.",
      })
    }

    // If very few matches, add a strong general recommendation
    if (suggestedCourses.length < 3) {
      suggestedCourses.push({
        title: "Introduction to Mathematical Thinking",
        provider: "Stanford University (Coursera)",
        url: "https://www.coursera.org/learn/mathematical-thinking",
        estimatedTime: "6 weeks",
        level: "Beginner",
        reason: "Develop rigorous thinking and problem-solving skills that transfer across all subjects.",
      })
    }

    return NextResponse.json({ 
      path, 
      suggestedCourses: suggestedCourses.slice(0, 4) // max 4 high-quality suggestions
    })
  } catch (error) {
    console.error('Error generating learning path:', error)
    return NextResponse.json({ error: 'Failed to generate path' }, { status: 500 })
  }
}