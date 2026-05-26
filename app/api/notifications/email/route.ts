import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { type, recipientEmail, data } = await request.json()

    if (!recipientEmail || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail and type' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user profile to verify they exist
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('email', recipientEmail)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    let emailContent = {
      subject: '',
      html: '',
      text: ''
    }

    // Generate email content based on type
    switch (type) {
      case 'teacher-to-student':
        emailContent = generateTeacherToStudentEmail(data)
        break
      case 'teacher-to-parent':
        emailContent = generateTeacherToParentEmail(data)
        break
      case 'weekly-progress':
        emailContent = generateWeeklyProgressEmail(data)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    // In production, integrate with Resend or Supabase Edge Functions
    // For now, we'll log the email and simulate sending
    console.log('📧 Email to be sent:', {
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    // Store email notification in database for tracking
    const { error: insertError } = await supabase
      .from('email_notifications')
      .insert({
        recipient_id: profile.id,
        type,
        subject: emailContent.subject,
        sent_at: new Date().toISOString(),
        status: 'sent' // In real implementation, this would be 'pending' until confirmed
      })

    if (insertError) {
      console.error('Error storing email notification:', insertError)
    }

    // TODO: Integrate with Resend API
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'Skill Gain <noreply@skillgain.app>',
    //   to: recipientEmail,
    //   subject: emailContent.subject,
    //   html: emailContent.html,
    //   text: emailContent.text,
    // })

    return NextResponse.json({
      success: true,
      message: 'Email notification queued successfully'
    })

  } catch (error) {
    console.error('Error sending email notification:', error)
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    )
  }
}

function generateTeacherToStudentEmail(data: any) {
  const { teacherName, className, message, subject } = data

  return {
    subject: `Message from ${teacherName} - ${className}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Skill Gain</h1>
          <p style="color: #e8eaf6; margin: 10px 0 0 0; font-size: 16px;">Where Learning Feels Like Discovery</p>
        </div>

        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Message from Your Teacher</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;"><strong>From:</strong> ${teacherName}</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Class:</strong> ${className}</p>
            ${subject ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>` : ''}
          </div>

          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://skill-gain.com/learning" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Continue Learning</a>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This message was sent by your teacher through Skill Gain. Please respond through the platform if needed.
          </p>
        </div>
      </div>
    `,
    text: `
Skill Gain - Message from Your Teacher

From: ${teacherName}
Class: ${className}
${subject ? `Subject: ${subject}` : ''}

${message}

Continue your learning journey at: https://skill-gain.com/learning

This message was sent by your teacher through Skill Gain.
    `.trim()
  }
}

function generateTeacherToParentEmail(data: any) {
  const { teacherName, studentName, className, message, subject } = data

  return {
    subject: `Update from ${teacherName} about ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Skill Gain</h1>
          <p style="color: #e8eaf6; margin: 10px 0 0 0; font-size: 16px;">Supporting Your Child's Learning Journey</p>
        </div>

        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Message from Your Child's Teacher</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;"><strong>Teacher:</strong> ${teacherName}</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Student:</strong> ${studentName}</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Class:</strong> ${className}</p>
            ${subject ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>` : ''}
          </div>

          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://skill-gain.com/family" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Family Dashboard</a>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This message was sent by your child's teacher through Skill Gain. You can respond through the family dashboard.
          </p>
        </div>
      </div>
    `,
    text: `
Skill Gain - Message from Your Child's Teacher

Teacher: ${teacherName}
Student: ${studentName}
Class: ${className}
${subject ? `Subject: ${subject}` : ''}

${message}

View your family dashboard at: https://skill-gain.com/family

This message was sent by your child's teacher through Skill Gain.
    `.trim()
  }
}

function generateWeeklyProgressEmail(data: any) {
  const { studentName, className, weekSummary, achievements, recommendations } = data

  return {
    subject: `Weekly Progress Report - ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Skill Gain</h1>
          <p style="color: #e8eaf6; margin: 10px 0 0 0; font-size: 16px;">Weekly Progress Report</p>
        </div>

        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">${studentName}'s Learning Progress</h2>
          <p style="color: #666; margin-bottom: 30px;">Here's how ${studentName} performed this week in ${className}.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">📊 Weekly Summary</h3>
            <p style="margin: 10px 0; line-height: 1.6; color: #555;">${weekSummary.replace(/\n/g, '<br>')}</p>
          </div>

          ${achievements ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h3 style="margin-top: 0; color: #2e7d32;">🏆 Achievements This Week</h3>
            <p style="margin: 10px 0; line-height: 1.6; color: #388e3c;">${achievements.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          ${recommendations ? `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <h3 style="margin-top: 0; color: #e65100;">💡 Recommendations</h3>
            <p style="margin: 10px 0; line-height: 1.6; color: #bf360c;">${recommendations.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://skill-gain.com/family" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Detailed Progress</a>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This weekly progress report was generated automatically by Skill Gain. Contact your child's teacher for additional support.
          </p>
        </div>
      </div>
    `,
    text: `
Skill Gain - Weekly Progress Report

${studentName}'s Learning Progress
Class: ${className}

Weekly Summary:
${weekSummary}

${achievements ? `Achievements This Week:\n${achievements}\n` : ''}${recommendations ? `Recommendations:\n${recommendations}\n` : ''}

View detailed progress at: https://skill-gain.com/family

This weekly progress report was generated automatically by Skill Gain.
    `.trim()
  }
}