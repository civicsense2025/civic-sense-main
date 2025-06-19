import { NextRequest, NextResponse } from 'next/server'
import { CivicSenseEmailService } from '@/lib/email/mailerlite-service'

const emailService = new CivicSenseEmailService()

/**
 * Test API endpoint for MailerLite email integration
 * Only for development and testing purposes
 */
export async function POST(request: NextRequest) {
  try {
    const { emailType, recipientEmail, recipientName, customMessage } = await request.json()

    // First test the API key
    const apiKeyTest = await emailService.testApiKey()
    console.log('📧 [API_KEY_TEST]', apiKeyTest)
    
    if (!apiKeyTest.success) {
      return NextResponse.json({ 
        error: 'Email service configuration error',
        details: apiKeyTest.message,
        apiKeyStatus: apiKeyTest
      }, { status: 500 })
    }

    // Generate test data based on email type
    const testData = generateTestData(emailType, recipientName, customMessage)
    
    console.log('📧 Sending test email:', {
      type: emailType,
      to: recipientEmail,
      data: testData
    })

    // Send the email
    const result = await emailService.sendTemplateEmail({
      to: recipientEmail,
      template: emailType,
      data: testData,
      emailType: emailType as any
    })

    console.log('📧 Test email sent:', emailType, 'to', recipientEmail, result)

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      testData
    })

  } catch (error) {
    console.error('❌ Test email error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateTestData(emailType: string, recipientName: string, customMessage?: string) {
  const baseData = {
    user_name: recipientName || 'Tan Ho',
    user_first_name: (recipientName || 'Tan Ho').split(' ')[0],
    site_name: 'CivicSense',
    site_url: 'https://civicsense.us',
    support_email: 'support@civicsense.us',
    current_year: new Date().getFullYear(),
    founder_name: 'Tán',
    civic_journey_stage: 'Informed Citizen',
    is_educator: false,
    // Add required body field
    body: 'This is a test email to verify the integration is working correctly.',
    // Add personal touch fields
    personal_note_from_founder: "Thank you for testing the CivicSense email system. This is exactly the kind of attention to detail that democracy needs.",
    // Add pod context (optional)
    primary_pod_name: 'Democracy Learning Pod',
    total_pods: 1,
    is_pod_admin: false
  }

  switch (emailType) {
    case 'welcome':
      return {
        ...baseData,
        body: 'Welcome to CivicSense! We\'re excited to help you understand how power really works in democracy.',
        action_url: 'https://civicsense.us/onboarding',
        action_text: 'Complete Your Setup',
        personal_note_from_founder: "Welcome to the community of people who want to understand how democracy actually works, not how we pretend it works.",
        survey_prompt: {
          question: "What motivated you to join CivicSense?",
          survey_url: "https://civicsense.us/survey/onboarding-motivation?prefill=true"
        }
      }

    case 'achievement':
      return {
        ...baseData,
        body: 'Congratulations! You just unlocked a new achievement on your civic learning journey.',
        achievement_type: 'first_perfect_quiz',
        achievement_title: 'Perfect Score: Constitutional Rights',
        quiz_topic: 'Constitutional Rights',
        civic_insight: 'Understanding constitutional protections gives you the knowledge to recognize when they\'re being violated or undermined.',
        score: 100,
        share_url: 'https://civicsense.us/results/test-123?share=true',
        next_challenge: 'How Congressional Power Really Works',
        next_challenge_url: 'https://civicsense.us/quiz/congressional-power',
        survey_prompt: {
          question: "How valuable was this quiz for your civic understanding?",
          survey_url: "https://civicsense.us/survey/quiz-feedback?quiz=constitutional-rights&score=100&prefill=true",
          quick_rating_urls: {
            very_valuable: "https://civicsense.us/survey/quiz-feedback?quiz=constitutional-rights&score=100&rating=5&submit=true",
            somewhat_valuable: "https://civicsense.us/survey/quiz-feedback?quiz=constitutional-rights&score=100&rating=3&submit=true",
            not_valuable: "https://civicsense.us/survey/quiz-feedback?quiz=constitutional-rights&score=100&rating=1&submit=true"
          }
        }
      }

    case 'level_up':
      return {
        ...baseData,
        body: 'You\'ve reached a new level of civic understanding!',
        new_level: 5,
        level_title: 'Informed Citizen',
        power_unlock_message: 'You can now see through political theater to real policy impacts',
        celebration_image: 'https://civicsense.us/api/generate-image?template=achievement&badge=level-5',
        next_milestone: 'Power Analyst',
        continue_learning_url: 'https://civicsense.us/dashboard',
        personal_note_from_founder: "Reaching Informed Citizen level means you now understand more about democracy than most Americans. Keep building that civic power."
      }

    case 'streak':
      return {
        ...baseData,
        body: 'Seven days in a row! This consistency is exactly how you build real civic power.',
        streak_count: 7,
        civic_power_unlocked: 'You now understand more about democracy than 73% of Americans',
        streak_badge_url: 'https://civicsense.us/api/generate-image?template=achievement&badge=7-day-streak',
        keep_streak_url: 'https://civicsense.us/dashboard',
        personal_note_from_founder: "Seven days of civic learning puts you in rare company. Most people consume political news passively - you're actively building understanding.",
        survey_prompt: {
          question: "How has your daily civic learning affected your understanding of current events?",
          survey_url: "https://civicsense.us/survey/streak-impact?streak=7&prefill=true"
        }
      }

    case 'pod_invitation':
      return {
        ...baseData,
        body: 'John Smith has invited you to join "Classroom Democracy Pod" for collaborative civic learning.',
        invitee_name: baseData.user_name,
        inviter_name: 'John Smith',
        pod_name: 'Classroom Democracy Pod',
        pod_type: 'Educational',
        pod_description: 'A collaborative space for high school students to explore how democracy works in practice',
        join_url: 'https://civicsense.us/join/test-invite-code',
        pod_preview_stats: 'Active group averaging 85% quiz scores',
        why_pods_matter: 'Learning about democracy works best when you can discuss it with others. That\'s how the founders intended civic education to work.',
        personal_note_from_founder: "Learning with others is exactly how democracy is supposed to work. You're building real civic power.",
        survey_prompt: {
          question: "What made you interested in civic learning?",
          survey_url: "https://civicsense.us/survey/civic-motivation?pod=classroom-pod&prefill=true"
        }
      }

    case 'weekly_digest':
      return {
        ...baseData,
        body: 'Your weekly civic learning summary - plus some developments this week that connect to what you\'ve been studying.',
        week_summary: 'This week you completed 3 quizzes and learned about judicial review',
        recommended_topics: [
          'How Your City Council Really Works',
          'Understanding Congressional Committee Power',
          'Local Elections That Actually Matter'
        ],
        local_civic_action: [
          'City Council meeting this Thursday at 7 PM',
          'School board budget hearing next Tuesday'
        ],
        trending_discussions: [
          'How does gerrymandering actually work in practice?',
          'Why local elections have more impact than you think'
        ],
        this_week_in_democracy: 'Congress passed infrastructure funding changes - here\'s what it means for your community',
        preferred_categories: ['Local Government', 'Federal Policy', 'Voting Rights'],
        personal_note_from_founder: "This week's developments show exactly why civic education matters. The news reports what happened, but understanding why it happened requires the knowledge you're building.",
        survey_url: "https://civicsense.us/survey/weekly-digest-feedback?week=current&prefill=true"
      }

    case 're_engagement':
      return {
        ...baseData,
        body: 'We miss you! While you were away for 14 days, some important civic developments happened that connect to what you\'ve been learning.',
        days_away: 14,
        civic_moment_hook: 'While you were away, Congress passed a bill that affects your daily commute. The transportation funding changes mean different things for different communities.',
        personalized_comeback: 'Based on your interest in local government, we think you\'d find the new developments fascinating',
        quick_quiz_url: 'https://civicsense.us/quiz/recommended',
        what_you_missed: [
          'New Supreme Court decision on voting rights',
          'Major infrastructure bill affecting your state',
          'Local election results in your area'
        ],
        personal_note_from_founder: "I get it - life gets busy. But democracy doesn't pause. Even 10 minutes a week makes a difference in your civic understanding."
      }

    case 'civic_news_alert':
      return {
        ...baseData,
        body: 'Breaking: Supreme Court decision on voting rights - this affects you directly based on what you\'ve been learning about democracy.',
        news_headline: 'Supreme Court upholds state voter ID requirements',
        why_this_matters_to_you: 'This decision affects how you and your community vote in upcoming elections',
        action_you_can_take: 'Check your state\'s current voter ID requirements and help others understand them',
        learn_more_quiz: 'voting-rights-fundamentals',
        discussion_url: 'https://civicsense.us/discuss/voting-rights-decision',
        personal_note_from_founder: "This is exactly why civic education matters - understanding the legal framework helps you navigate real changes to democracy."
      }

    default:
      return {
        ...baseData,
        body: customMessage || 'This is a test email to verify our integration is working correctly.',
        message: customMessage || 'Testing email functionality',
        personal_note_from_founder: "Thank you for testing the CivicSense email system."
      }
  }
}

/**
 * Health check for test email endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'CivicSense Test Email API',
    timestamp: new Date().toISOString(),
    availableEmailTypes: [
      'welcome',
      'learning_pod_invitation',
      'quiz_achievement',
      'level_up',
      'gift_claim',
      'educational_access'
    ]
  })
} 