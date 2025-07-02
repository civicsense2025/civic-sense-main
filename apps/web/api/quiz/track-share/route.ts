import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

interface ShareTrackingRequest {
  quizAttemptId: string
  platform: string
  shareData: {
    platform: string
    url: string
    text: string
    hashtags?: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: ShareTrackingRequest = await request.json()
    
    const { quizAttemptId, platform, shareData } = body
    
    if (!quizAttemptId || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: quizAttemptId and platform' },
        { status: 400 }
      )
    }

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Update the quiz attempt with sharing information
    const { error: updateError } = await supabase
      .rpc('track_quiz_share', {
        p_quiz_attempt_id: quizAttemptId,
        p_platform: platform,
        p_share_metadata: shareData
      })
    
    if (updateError) {
      console.error('Error tracking quiz share:', updateError)
      return NextResponse.json(
        { error: 'Failed to track sharing event' },
        { status: 500 }
      )
    }

    // Log analytics event for comprehensive tracking
    const { error: analyticsError } = await supabase
      .rpc('log_quiz_event', {
        p_event_type: 'social_interaction',
        p_event_category: 'social',
        p_user_id: user?.id || null,
        p_quiz_attempt_id: quizAttemptId,
        p_event_data: {
          action: 'share',
          platform: platform,
          share_data: shareData,
          timestamp: new Date().toISOString()
        },
        p_social_interaction_type: 'share',
        p_platform: 'web'
      })

    if (analyticsError) {
      console.warn('Analytics logging failed, but share tracking succeeded:', analyticsError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Share tracked successfully' 
    })

  } catch (error) {
    console.error('Error in track-share API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 