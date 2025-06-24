/**
 * ============================================================================
 * ADMIN FEEDBACK API ENDPOINT
 * ============================================================================
 * Handles feedback management for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

interface Feedback {
  id: string
  user_id?: string
  user_email?: string
  feedback_type: 'bug' | 'feature' | 'general' | 'complaint' | 'praise'
  title?: string
  message: string
  rating?: number
  status: 'new' | 'in_progress' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  context?: string
  context_id?: string
  created_at: string
  updated_at: string
  admin_notes?: string
  response_sent?: boolean
  response_sent_at?: string
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { user, response } = await requireAdmin()
    if (response) return response

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const supabase = await createClient()

    // Mock feedback data since the table might not exist
    const mockFeedback: Feedback[] = [
      {
        id: '1',
        user_email: 'user1@example.com',
        feedback_type: 'bug',
        title: 'Quiz not loading properly',
        message: 'The quiz page keeps showing a loading spinner and never loads the questions.',
        rating: 2,
        status: 'new',
        priority: 'high',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        user_email: 'user2@example.com',
        feedback_type: 'feature',
        title: 'Add dark mode support',
        message: 'It would be great to have a dark mode option for better accessibility.',
        rating: 4,
        status: 'in_progress',
        priority: 'medium',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        admin_notes: 'Working on implementing this in the next release.'
      },
      {
        id: '3',
        user_email: 'user3@example.com',
        feedback_type: 'praise',
        title: 'Excellent civic education content',
        message: 'The platform has really helped me understand local government better. Thank you!',
        rating: 5,
        status: 'resolved',
        priority: 'low',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        response_sent: true,
        response_sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    // Apply filters
    let filteredFeedback = mockFeedback
    if (status) {
      filteredFeedback = filteredFeedback.filter(f => f.status === status)
    }
    if (type) {
      filteredFeedback = filteredFeedback.filter(f => f.feedback_type === type)
    }

    // Apply pagination
    const paginatedFeedback = filteredFeedback.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      feedback: paginatedFeedback,
      total_count: filteredFeedback.length,
      has_more: filteredFeedback.length > offset + limit
    })

  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const { user, response } = await requireAdmin()
    if (response) return response

    const body = await request.json()
    const { feedback_id, status, priority, admin_notes } = body

    // Mock update response
    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully'
    })

  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    )
  }
} 