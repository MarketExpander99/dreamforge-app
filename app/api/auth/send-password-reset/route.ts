import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      )
    }

    // Call Supabase resetPasswordForEmail to trigger default email with reset URL
    const supabase = await createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
    })

    if (resetError) {
      console.error('Supabase reset error:', resetError)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    // Send branded notification email via Resend (like confirmation route)
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Skill Gain <noreply@skillgain.app>',
      to: email,
      subject: 'Reset Your Skill Gain Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Skill Gain</h1>
            <p style="color: #e8eaf6; margin: 10px 0 0 0; font-size: 16px;">Where Learning Feels Like Discovery</p>
          </div>

          <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              You requested to reset your password for your Skill Gain account. If you didn't make this request, you can safely ignore this email.
            </p>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              We've sent a secure password reset link to your email address. Please check your inbox (including spam/junk folder) to complete the process.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Go to Reset Password
              </a>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
              If you don't see the email within a few minutes, check your spam folder or try requesting a new reset.
            </p>

            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              The reset link will expire in 1 hour. For security, please do not share this information.
            </p>
          </div>
        </div>
      `,
      text: `
Skill Gain - Reset Your Password

You requested to reset your password for your Skill Gain account.

We've sent a secure password reset link to your email address.

Please check your inbox (including spam) to complete the process. The link expires in 1 hour.

If you didn't request this, please ignore this email.

Where Learning Feels Like Discovery
      `.trim()
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    })

  } catch (error) {
    console.error('Error sending password reset email:', error)
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}
