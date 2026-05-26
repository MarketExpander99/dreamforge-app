import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, confirmationUrl } = await request.json()

    if (!email || !confirmationUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: email and confirmationUrl' },
        { status: 400 }
      )
    }

    // Send branded confirmation email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Skill Gain <noreply@skillgain.app>',
      to: email,
      subject: 'Welcome to Skill Gain - Confirm Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Skill Gain</h1>
            <p style="color: #e8eaf6; margin: 10px 0 0 0; font-size: 16px;">Where Learning Feels Like Discovery</p>
          </div>

          <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Welcome to Skill Gain!</h2>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Thank you for joining Skill Gain. We're excited to help you on your learning journey!
            </p>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              To get started, please confirm your email address by clicking the button below:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Confirm Your Email
              </a>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>

            <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; font-size: 12px; color: #666; word-break: break-all; margin: 20px 0;">
              ${confirmationUrl}
            </p>

            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              This confirmation link will expire in 24 hours. If you didn't create an account with Skill Gain, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `
Skill Gain - Confirm Your Email

Welcome to Skill Gain! We're excited to help you on your learning journey.

To get started, please confirm your email address by visiting this link:
${confirmationUrl}

This confirmation link will expire in 24 hours. If you didn't create an account with Skill Gain, please ignore this email.

Where Learning Feels Like Discovery
      `.trim()
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully'
    })

  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    )
  }
}