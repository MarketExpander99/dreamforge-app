import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    // Get popular curriculum items (based on views, likes, and recency)
    const { data: items, error } = await supabase
      .from('content_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_published', true)
      .order('views', { ascending: false })
      .order('likes', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching popular curriculum items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch curriculum items' },
        { status: 500 }
      )
    }

    return NextResponse.json(items || [])

  } catch (error) {
    console.error('Popular curriculum API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}