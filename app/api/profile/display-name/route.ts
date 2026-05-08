import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// PUT /api/profile/display-name - Update user's display name with privacy controls
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { displayName } = body

    // Get current profile to check role and consent status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, parent_consent_given')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check privacy constraints for students
    if (profile.role === 'student' && !profile.parent_consent_given) {
      return NextResponse.json({
        error: 'Parent or guardian consent required to set display name',
        code: 'PARENT_CONSENT_REQUIRED'
      }, { status: 403 })
    }

    // Validate display name (optional basic validation)
    if (displayName && (displayName.length < 2 || displayName.length > 50)) {
      return NextResponse.json({
        error: 'Display name must be between 2 and 50 characters'
      }, { status: 400 })
    }

    // Update display name (allow null to clear it)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('display_name, anonymous_id')
      .single()

    if (error) {
      console.error('Error updating display name:', error)
      return NextResponse.json({ error: 'Failed to update display name' }, { status: 500 })
    }

    // Return the public name (display_name || anonymous_id)
    const publicName = data.display_name || data.anonymous_id || 'Anonymous User'

    return NextResponse.json({
      success: true,
      displayName: data.display_name,
      publicName
    })
  } catch (error) {
    console.error('Error updating display name:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/profile/parent-consent - Record parent consent for display name
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { consentGiven, parentEmail } = body

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, parent_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only students can give consent
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can provide consent' }, { status: 403 })
    }

    // Update parent consent
    const { data, error } = await supabase
      .from('profiles')
      .update({
        parent_consent_given: consentGiven,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('parent_consent_given')
      .single()

    if (error) {
      console.error('Error updating parent consent:', error)
      return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 })
    }

    // TODO: Send notification email to parent if parentEmail provided
    // This would integrate with the existing email notification system

    return NextResponse.json({
      success: true,
      parentConsentGiven: data.parent_consent_given
    })
  } catch (error) {
    console.error('Error recording parent consent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}