import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('content_items')
      .select(`
        *,
        categories (
          name
        )
      `)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }
    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }
    if (status && status !== 'all') {
      if (status === 'published') {
        query = query.eq('is_published', true)
      } else if (status === 'draft') {
        query = query.eq('is_published', false)
      }
    }
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data: content, error } = await query

    if (error) {
      console.error('Error fetching content:', error)
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Create content item
    const { data: newContent, error } = await supabase
      .from('content_items')
      .insert({
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
        quiz: quiz || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating content:', error)
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
    }

    return NextResponse.json({ content: newContent }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}