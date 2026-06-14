import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read from the real table that Discover writes to
    const { data, error } = await supabase
      .from('user_explorations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching user explorations:', error)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    // Map the fields to what the Learning page expects
    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      shortSearch: row.label || 'Exploration',
      fullQuestion: row.short_description || row.main_function || '',
      gradeLevel: undefined,
      createdAt: row.created_at,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Error in saved-queries route:', error)
    return NextResponse.json({ error: 'Failed to fetch saved queries' }, { status: 500 })
  }
}