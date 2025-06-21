import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { enhancedQuizDatabase } from '@/lib/enhanced-quiz'

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '7')
    const topic = url.searchParams.get('topic') || 'all'
    const difficulty = url.searchParams.get('difficulty') || 'all'

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authHeader.replace('Bearer ', '')
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 401 })
    }

    // Get user's activity data
    const recentActivity = await enhancedQuizDatabase.getRecentActivity(userId, 25)

    // Apply filters
    let filteredActivity = recentActivity.filter(activity => {
      const activityDate = new Date(activity.timestamp)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      return activityDate >= cutoffDate
    })

    if (topic !== 'all') {
      filteredActivity = filteredActivity.filter(activity => 
        activity.topic?.toLowerCase() === topic.toLowerCase()
      )
    }

    if (difficulty !== 'all') {
      filteredActivity = filteredActivity.filter(activity => 
        activity.difficulty?.toLowerCase() === difficulty.toLowerCase()
      )
    }

    return NextResponse.json({ activities: filteredActivity })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    )
  }
} 