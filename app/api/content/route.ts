import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/content - Fetch content items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const featured = searchParams.get('featured') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    const gradeLevel = searchParams.get('gradeLevel')
    const search = searchParams.get('search')

    let query = supabase
      .from('content_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_published', true)

    if (category) {
      query = query.eq('category_id', category)
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (featured) {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    if (gradeLevel) {
      query = query.contains('tags', [gradeLevel])
    }

    if (limit) {
      query = query.limit(limit)
    }

    query = query.order('created_at', { ascending: false })

    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching content items:', error)
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}