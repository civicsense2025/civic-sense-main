/**
 * ============================================================================
 * ADMIN FEEDBACK STATS API ENDPOINT
 * ============================================================================
 * Provides feedback statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'

interface FeedbackStats {
  total_feedback: number
  new_feedback: number
  resolved_feedback: number
  avg_rating: number
  response_rate: number
  avg_response_time_hours: number
  feedback_by_type: Record<string, number>
  feedback_by_priority: Record<string, number>
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { user, response } = await requireAdmin()
    if (response) return response

    // Mock feedback stats
    const stats: FeedbackStats = {
      total_feedback: 47,
      new_feedback: 8,
      resolved_feedback: 32,
      avg_rating: 4.2,
      response_rate: 85.1,
      avg_response_time_hours: 18.5,
      feedback_by_type: {
        bug: 15,
        feature: 12,
        general: 8,
        complaint: 7,
        praise: 5
      },
      feedback_by_priority: {
        low: 18,
        medium: 15,
        high: 10,
        urgent: 4
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching feedback stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback stats' },
      { status: 500 }
    )
  }
} 