import { NextRequest, NextResponse } from 'next/server'
import { surveyEmailIntegration } from '@/lib/email/survey-email-integration'

export async function POST(request: NextRequest) {
  try {
    const { survey_id, email, custom_message, inviter_name } = await request.json()

    if (!survey_id || !email) {
      return NextResponse.json(
        { error: 'Survey ID and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const result = await surveyEmailIntegration.sendSurveyInvitation(
      email,
      survey_id,
      inviter_name,
      custom_message
    )

    return NextResponse.json({
      success: true,
      message_id: result.messageId,
      message: 'Survey invitation sent successfully'
    })
  } catch (error) {
    console.error('Error sending survey invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send survey invitation' },
      { status: 500 }
    )
  }
} 