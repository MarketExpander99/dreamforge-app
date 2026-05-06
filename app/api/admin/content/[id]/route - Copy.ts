import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if user is authenticated and has admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = profile?.role === 'content-creator' || user.email === 'eben.combrinck@proton.me'
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Get content by ID
    const { data: content, error } = await supabase
      .from('content_items')
      .select(`
        *,
        categories (
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching content:', error)
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if user is authenticated and has admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = profile?.role === 'content-creator' || user.email === 'eben.combrinck@proton.me'
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      title,
      content,
      type,
      category,
      difficulty,
      tags,
      readTime,
      isFeatured,
      isPublished,
      imageUrl,
      videoUrl,
      audioUrl,
      quiz
    } = body

    // Validate required fields
    if (!title || !content || !type || !category || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get category ID from category name
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .single()

    if (!categoryData) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Update content item
    const { data: updatedContent, error } = await supabase
      .from('content_items')
      .update({
        title,
        content,
        type,
        category_id: categoryData.id,
        difficulty,
        tags: tags || [],
        read_time: readTime || 5,
        is_featured: isFeatured || false,
        is_published: isPublished || false,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        audio_url: audioUrl || null,
        quiz: quiz || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating content:', error)
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
    }

    return NextResponse.json({ content: updatedContent })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if user is authenticated and has admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const hasAccess = profile?.role === 'content-creator' || user.email === 'eben.combrinck@proton.me'
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Delete content item
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting content:', error)
      return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Content deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
