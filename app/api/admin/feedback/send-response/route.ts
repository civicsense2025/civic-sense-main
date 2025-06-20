import { NextRequest, NextResponse } from 'next/server'
import { surveyEmailIntegration } from '@/lib/email/survey-email-integration'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { feedback_id, response_message, admin_name } = await request.json()

    if (!feedback_id || !response_message) {
      return NextResponse.json(
        { error: 'Feedback ID and response message are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get feedback details
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('id', feedback_id)
      .single()

    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    if (!feedback.user_email) {
      return NextResponse.json(
        { error: 'No email address available for this feedback' },
        { status: 400 }
      )
    }

    // Send feedback response email
    const result = await surveyEmailIntegration.sendFeedbackAcknowledgment(
      feedback.user_email,
      feedback.feedback_type,
      feedback_id
    )

    // Update feedback record to mark response as sent
    const { error: updateError } = await supabase
      .from('user_feedback')
      .update({
        response_sent: true,
        response_sent_at: new Date().toISOString(),
        admin_notes: response_message,
        status: 'resolved'
      })
      .eq('id', feedback_id)

    if (updateError) {
      console.error('Error updating feedback record:', updateError)
      // Don't fail the request if the email was sent successfully
    }

    return NextResponse.json({
      success: true,
      message_id: result.messageId,
      message: 'Feedback response sent successfully'
    })
  } catch (error) {
    console.error('Error sending feedback response:', error)
    return NextResponse.json(
      { error: 'Failed to send feedback response' },
      { status: 500 }
    )
  }
} 