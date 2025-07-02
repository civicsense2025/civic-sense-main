import { NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { enhancedQuizDatabase } from '@civicsense/shared/lib/quiz-database'

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '7')
    const topic = url.searchParams.get('topic') || 'all'
    const difficulty = url.searchParams.get('difficulty') || 'all'

    // Use proper server-side authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's activity data using the authenticated user's ID
    const recentActivity = await enhancedQuizDatabase.getRecentActivity(user.id, 25)

    // Apply filters
    let filteredActivity = recentActivity.filter(activity => {
      const activityDate = new Date(activity.completedAt)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      return activityDate >= cutoffDate
    })

    if (topic !== 'all') {
      filteredActivity = filteredActivity.filter(activity => 
        activity.topicTitle?.toLowerCase().includes(topic.toLowerCase())
      )
    }

    if (difficulty !== 'all') {
      filteredActivity = filteredActivity.filter(activity => 
        activity.level?.toLowerCase() === difficulty.toLowerCase()
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