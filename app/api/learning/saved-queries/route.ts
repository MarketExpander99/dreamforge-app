import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_saved_queries')
      .select('id, short_search, full_question, grade_level, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formatted = data.map((q: any) => ({
      id: q.id,
      shortSearch: q.short_search || '',
      fullQuestion: q.full_question || q.short_search || '',
      gradeLevel: q.grade_level,
      createdAt: q.created_at,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching saved queries:', error)
    return NextResponse.json({ error: 'Failed to fetch saved queries' }, { status: 500 })
  }
}