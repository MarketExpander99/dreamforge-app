// app/api/learning/latest-path/route.ts
// Lightweight read endpoint for the cached "Learning Journey" (path + suggested courses)
// generated on the Learning page. Uses existing learning_paths table (no schema change).
// Journey rows are identified by title === 'Learning Journey' and modules as object payload.

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch only the dedicated journey cache row (never the curriculum/discovery path rows)
    const { data: journey, error } = await supabase
      .from('learning_paths')
      .select('id, title, description, modules, generated_at, created_at')
      .eq('user_id', user.id)
      .eq('title', 'Learning Journey')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching latest learning journey:', error)
      return NextResponse.json({ error: 'Failed to fetch cached path' }, { status: 500 })
    }

    if (!journey || !journey.modules) {
      return NextResponse.json(null)
    }

    const mods = journey.modules as any

    // Support both legacy array (should not happen for journey) and new object payload
    const path = Array.isArray(mods) ? [] : (mods.path || mods.modules || [])
    const suggestedCourses = Array.isArray(mods) ? [] : (mods.suggestedCourses || mods.courses || [])

    const meta = (mods && !Array.isArray(mods) ? mods._meta : null) || {}

    return NextResponse.json({
      path: Array.isArray(path) ? path : [],
      suggestedCourses: Array.isArray(suggestedCourses) ? suggestedCourses : [],
      exploration_count_at_generation: meta.exploration_count_at_generation ?? 0,
      max_exploration_created_at: meta.max_exploration_created_at || null,
      last_generated_at: meta.last_generated_at || journey.generated_at || journey.created_at,
      source: meta.source || 'auto',
    })
  } catch (error) {
    console.error('Error in latest-path route:', error)
    return NextResponse.json({ error: 'Failed to fetch cached learning path' }, { status: 500 })
  }
}
