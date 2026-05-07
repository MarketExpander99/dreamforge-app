import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { contentId, status, progressPercentage, timeSpent, userId } = await request.json()

    if (!contentId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Content ID and User ID are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get existing progress
    const { data: existingProgress, error: fetchError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching progress:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch existing progress' },
        { status: 500 }
      )
    }

    const updateData = {
      status: status || existingProgress?.status || 'in_progress',
      progress_percentage: progressPercentage ?? existingProgress?.progress_percentage ?? 0,
      time_spent: (existingProgress?.time_spent || 0) + (timeSpent || 0),
      last_accessed_at: new Date().toISOString(),
      completed_at: status === 'completed' ? new Date().toISOString() : existingProgress?.completed_at
    }

    let result
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('user_progress')
        .update(updateData)
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .select()
        .single()

      if (error) {
        console.error('Error updating progress:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update progress' },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Create new progress
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          content_id: contentId,
          ...updateData
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating progress:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to create progress' },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      progress: result
    })

  } catch (error) {
    console.error('Progress update API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}