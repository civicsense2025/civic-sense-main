// ============================================================================
// DISMISS REWARD NOTIFICATION API ROUTE
// ============================================================================
// Allows users to dismiss reward notifications without claiming

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// POST - Dismiss Reward Notification
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { survey_response_id, user_id } = body
    
    if (!survey_response_id) {
      return NextResponse.json(
        { error: 'Survey response ID required' },
        { status: 400 }
      )
    }
    
    // For now, we'll just mark this as "dismissed" in user preferences or localStorage
    // In a more complete implementation, you might want to track dismissals in the database
    
    // You could create a "dismissed_notifications" table to track what users have dismissed:
    /*
    const { error } = await supabase
      .from('dismissed_notifications')
      .insert({
        user_id: user_id,
        notification_type: 'survey_reward',
        reference_id: survey_response_id,
        dismissed_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error storing dismissal:', error)
      return NextResponse.json(
        { error: 'Failed to dismiss notification' },
        { status: 500 }
      )
    }
    */
    
    return NextResponse.json({
      success: true,
      message: 'Notification dismissed'
    })
    
  } catch (error) {
    console.error('Unexpected error in POST /api/surveys/dismiss-reward-notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 