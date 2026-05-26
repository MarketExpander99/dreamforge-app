import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
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

    return NextResponse.json({ path })
  } catch (error) {
    console.error('Error generating learning path:', error)
    return NextResponse.json({ error: 'Failed to generate path' }, { status: 500 })
  }
}