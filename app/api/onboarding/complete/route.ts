import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ No authenticated user:', userError)
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('📝 Completing onboarding for user:', user.id)

    // Update the profile to mark onboarding as completed
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ teacher_onboarding_completed: true })
      .eq('id', user.id)
      .select()

    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Profile updated successfully:', data)

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data
    })

  } catch (error) {
    console.error('❌ Unexpected error in onboarding completion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}