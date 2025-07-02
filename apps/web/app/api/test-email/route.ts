import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@civicsense/shared/lib/email/mailerlite-service'

// Available email types for testing
const EMAIL_TYPES = [
  'welcome',
  'achievement', 
  'level_up',
  'streak',
  'pod_invitation',
  'weekly_digest',
  're_engagement',
  'civic_news_alert'
] as const

type EmailType = typeof EMAIL_TYPES[number]

// Test email subjects that follow CivicSense brand voice
const EMAIL_SUBJECTS: Record<EmailType, string> = {
  welcome: "You just joined something most politicians don't want you to have",
  achievement: "You just mastered something they hoped you'd never understand", 
  level_up: "You've leveled up your civic knowledge",
  streak: "Your civic learning streak is impressive",
  pod_invitation: "You're invited to join a learning pod",
  weekly_digest: "This week in democracy: What they don't want you to know",
  re_engagement: "Your civic education is waiting",
  civic_news_alert: "Breaking: Something they don't want you to understand"
}

// Generate test data for different email types
function generateTestData(emailType: EmailType, recipientEmail: string): Record<string, any> {
  const baseData = {
    user_name: 'CivicSense Tester',
    user_first_name: 'CivicSense',
    site_name: 'CivicSense',
    site_url: 'https://civicsense.us',
    support_email: 'support@civicsense.us',
    current_year: new Date().getFullYear(),
    founder_name: 'Tán',
    email_type: emailType
  }

  switch (emailType) {
    case 'welcome':
      return {
        ...baseData,
        civic_journey_stage: 'Informed Citizen',
        is_educator: false,
        body: "Welcome to CivicSense! We're excited to help you understand how power really works in democracy.",
        personal_note_from_founder: 'Welcome to the community of people who want to understand how democracy actually works, not how we pretend it works.',
        primary_pod_name: 'Democracy Learning Pod',
        total_pods: 1,
        is_pod_admin: false,
        action_url: 'https://civicsense.us/onboarding',
        action_text: 'Complete Your Setup'
      }

    case 'achievement':
      return {
        ...baseData,
        achievement_title: 'Constitutional Rights Expert',
        achievement_description: 'You demonstrated mastery of constitutional protections that most Americans never learn.',
        quiz_topic: 'Constitutional Rights',
        score: 95,
        total_points: 100,
        body: "You just achieved something most Americans never will: true understanding of your constitutional rights.",
        personal_note_from_founder: 'This level of constitutional literacy puts you ahead of 90% of Americans. Use this knowledge.',
        action_url: 'https://civicsense.us/achievements',
        action_text: 'View Your Progress'
      }

    case 'level_up':
      return {
        ...baseData,
        new_level: 5,
        level_title: 'Informed Citizen',
        previous_level: 4,
        xp_gained: 250,
        total_xp: 1250,
        body: "You've reached a level of civic understanding that puts you ahead of most college graduates.",
        personal_note_from_founder: 'Every level you gain is democratic power you can actually use. Keep building.',
        next_milestone: 'Constitutional Scholar',
        action_url: 'https://civicsense.us/progress',
        action_text: 'Continue Learning'
      }

    case 'streak':
      return {
        ...baseData,
        streak_count: 7,
        streak_milestone: 'One Week Warrior',
        longest_streak: 12,
        body: "Seven days of consistent civic learning. This is exactly how you build real democratic power.",
        personal_note_from_founder: 'Consistency beats intensity. You\'re building the civic knowledge that democracy actually requires.',
        action_url: 'https://civicsense.us/streak',
        action_text: 'Keep Your Streak Alive'
      }

    case 'pod_invitation':
      return {
        ...baseData,
        pod_name: 'Local Government Mastery',
        inviter_name: 'Sarah Chen',
        inviter_title: 'Pod Leader',
        pod_description: 'Learn how local government actually works and how to influence it effectively.',
        pod_member_count: 8,
        pod_max_size: 12,
        body: "Sarah Chen thinks you'd be a great addition to the Local Government Mastery learning pod.",
        personal_note_from_founder: 'Learning with others amplifies your civic impact. Join this pod.',
        action_url: 'https://civicsense.us/pods/join/abc123',
        action_text: 'Join the Pod'
      }

    case 'weekly_digest':
      return {
        ...baseData,
        week_number: 42,
        quizzes_completed: 3,
        topics_mastered: ['Federal Budget Process', 'Committee System'],
        current_streak: 5,
        body: "This week you learned how federal spending actually works - knowledge most Americans never get.",
        personal_note_from_founder: 'You\'re building the civic literacy that democracy requires. Keep going.',
        featured_topic: 'How Congressional Committees Really Work',
        action_url: 'https://civicsense.us/weekly-progress',
        action_text: 'See Full Progress'
      }

    case 're_engagement':
      return {
        ...baseData,
        days_away: 14,
        last_quiz_topic: 'Supreme Court Powers',
        missed_opportunities: 2,
        body: "Democracy didn't pause while you were away. Let's get back to building your civic power.",
        personal_note_from_founder: 'The most important civic learning happens when you come back after a break. Welcome back.',
        quick_win_topic: 'Electoral College Explained',
        action_url: 'https://civicsense.us/quick-quiz',
        action_text: 'Take a Quick Quiz'
      }

    case 'civic_news_alert':
      return {
        ...baseData,
        news_headline: 'Supreme Court to Hear Major Voting Rights Case',
        news_summary: 'A case that could reshape voting access is heading to the Supreme Court.',
        civic_impact: 'This decision could directly affect your voting rights and election security.',
        body: "A Supreme Court case is about to impact your voting rights. Here's what you need to know.",
        personal_note_from_founder: 'This is why civic education matters - so you understand what\'s really at stake.',
        explainer_url: 'https://civicsense.us/explainers/voting-rights-case-2024',
        action_url: 'https://civicsense.us/civic-alerts',
        action_text: 'Read the Explainer'
      }

    default:
      return baseData
  }
}

// Generate HTML content for test emails
function generateHtmlContent(emailType: EmailType, data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Email - CivicSense</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%); color: white; padding: 32px 24px; text-align: center; }
        .content { padding: 32px 24px; }
        .footer { padding: 24px; background: #f9fafb; text-align: center; color: #6b7280; font-size: 12px; }
        .cta-button { background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 16px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Email - MailerSend Integration</h1>
        <p>CivicSense Email Service Test</p>
    </div>
    
    <div class="content">
        <h2>${EMAIL_SUBJECTS[emailType]}</h2>
        
        <p><strong>Email Type:</strong> ${emailType}</p>
        <p><strong>Test Data Generated:</strong> ${Object.keys(data).length} fields</p>
        
        ${data.body ? `<p>${data.body}</p>` : ''}
        
        ${data.personal_note_from_founder ? `
        <blockquote style="border-left: 4px solid #dc2626; padding-left: 16px; margin: 24px 0; font-style: italic;">
            ${data.personal_note_from_founder}
            <br><br>
            — ${data.founder_name || 'Tán'}
        </blockquote>
        ` : ''}
        
        ${data.action_url ? `
        <div style="text-align: center; margin: 32px 0;">
            <a href="${data.action_url}" class="cta-button">${data.action_text || 'Take Action'}</a>
        </div>
        ` : ''}
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin-top: 0;">Test Data Summary:</h3>
            <ul style="margin-bottom: 0;">
                ${Object.entries(data).slice(0, 5).map(([key, value]) => 
                  `<li><strong>${key}:</strong> ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}</li>`
                ).join('')}
                ${Object.keys(data).length > 5 ? `<li><em>... and ${Object.keys(data).length - 5} more fields</em></li>` : ''}
            </ul>
        </div>
        
        <p><strong>This is a test email from the CivicSense MailerSend integration.</strong></p>
        <p>If you received this email successfully, the integration is working correctly.</p>
    </div>
    
    <div class="footer">
        <p>© ${data.current_year || new Date().getFullYear()} CivicSense</p>
        <p>Test Email - MailerSend Integration</p>
        <p>Generated at: ${new Date().toISOString()}</p>
    </div>
</body>
</html>
  `.trim()
}

export async function GET() {
  try {
    // Test API key connectivity
    const apiTest = await emailService.testApiKey()
    console.log('📧 [API_KEY_TEST]', apiTest)

    return NextResponse.json({
      success: true,
      service: 'MailerSend',
      availableEmailTypes: EMAIL_TYPES,
      apiKeyStatus: apiTest,
      message: 'MailerSend email service is ready. Use POST to send test emails.'
    })
  } catch (error) {
    console.error('❌ [TEST_EMAIL] Error testing API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'MailerSend'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailType = 'welcome', recipientEmail = 'test@example.com' } = body

    // Validate email type
    if (!EMAIL_TYPES.includes(emailType as EmailType)) {
      return NextResponse.json({
        success: false,
        error: `Invalid email type. Must be one of: ${EMAIL_TYPES.join(', ')}`
      }, { status: 400 })
    }

    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email address format'
      }, { status: 400 })
    }

    // Generate test data
    const testData = generateTestData(emailType as EmailType, recipientEmail)
    const subject = EMAIL_SUBJECTS[emailType as EmailType]
    const htmlContent = generateHtmlContent(emailType as EmailType, testData)

    // Add HTML to test data
    testData.html = htmlContent
    testData.subject = subject

    console.log('📧 Sending test email:', {
      type: emailType,
      to: recipientEmail,
      data: {
        ...testData,
        html: '[HTML_CONTENT]' // Don't log full HTML
      }
    })

    // Send the email using the MailerSend service
    const result = await emailService.sendTransactionalEmail(
      recipientEmail,
      subject,
      testData,
      undefined, // no template_id for test emails
      emailType as any // cast to EmailType
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test ${emailType} email sent successfully to ${recipientEmail}`,
        messageId: result.messageId,
        emailType,
        recipientEmail,
        testData: {
          subject,
          dataFieldCount: Object.keys(testData).length,
          sampleFields: Object.keys(testData).slice(0, 5)
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        emailType,
        recipientEmail
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [TEST_EMAIL] Error sending test email:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 