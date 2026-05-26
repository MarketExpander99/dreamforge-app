import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // user_saved_queries table does not exist in schema (confirmed via exhaustive search of all *.sql files).
    // Feature is a partial stub with no write path. Returning [] is the smallest safe change
    // that eliminates the 500 while preserving auth guard and response shape.
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching saved queries:', error)
    return NextResponse.json({ error: 'Failed to fetch saved queries' }, { status: 500 })
  }
}
