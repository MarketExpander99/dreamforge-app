import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateContentWithGrok } from '@/lib/grok-content'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (email check)
    if (user.email !== 'eben.combrinck@proton.me') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { gradeLevel, subject, count = 5 } = body

    if (!gradeLevel || !subject) {
      return NextResponse.json(
        { error: 'gradeLevel and subject are required' },
        { status: 400 }
      )
    }

    if (count < 1 || count > 20) {
      return NextResponse.json(
        { error: 'count must be between 1 and 20' },
        { status: 400 }
      )
    }

    // Generate content with Grok
    const { items } = await generateContentWithGrok({
      gradeLevel,
      subject,
      count,
      style: "fun-gamified"
    })

    // Use service client to bypass RLS for bulk insert
    const serviceSupabase = createServiceClient()

    // Insert generated content
    const { data, error } = await serviceSupabase
      .from('content_items')
      .insert(items)
      .select()

    if (error) {
      console.error('Error inserting generated content:', error)
      return NextResponse.json(
        { error: 'Failed to save generated content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated and saved ${items.length} content items`,
      count: items.length,
      items: data
    })

  } catch (error) {
    console.error('Content generation error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}