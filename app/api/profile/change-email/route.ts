import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { newEmail, password } = body

    if (!newEmail || !password) {
      return NextResponse.json({ error: 'New email and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Verify the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password
    })

    if (signInError) {
      return NextResponse.json({ error: 'Password is incorrect' }, { status: 400 })
    }

    // Note: Supabase will handle email uniqueness validation during the update

    // Update the email
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (updateError) {
      console.error('Error updating email:', updateError)
      return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Email update initiated. Please check both your old and new email for confirmation links.'
    })
  } catch (error) {
    console.error('Error changing email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}