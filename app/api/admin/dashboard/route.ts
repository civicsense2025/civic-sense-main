import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Dashboard request schema
const dashboardRequestSchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
  includeDetails: z.boolean().optional().default(false)
})

interface DashboardStats {
  users: {
    total: number
    active_last_30_days: number
    new_this_week: number
    verified_count: number
    admin_count: number
  }
  content: {
    total_topics: number
    total_questions: number
    pending_events: number
    ai_generated_today: number
    surveys_active: number
    scenarios_available: number
  }
  engagement: {
    quiz_attempts_today: number
    quiz_attempts_week: number
    survey_responses_today: number
    avg_completion_rate: number
    multiplayer_sessions_active: number
  }
  system: {
    pending_feedback: number
    system_alerts: number
    last_backup: string
    storage_usage: number
    api_calls_today: number
  }
  analytics: {
    civic_engagement_score: number
    knowledge_improvement_rate: number
    content_quality_score: number
    user_satisfaction_rate: number
  }
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'content_created' | 'quiz_completed' | 'event_submitted' | 'feedback_received' | 'survey_completed' | 'multiplayer_session'
  description: string
  timestamp: string
  user_email?: string
  metadata?: Record<string, any>
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  resolved: boolean
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const includeDetails = searchParams.get('includeDetails') === 'true'

    // Calculate date ranges
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Parallel data fetching for performance
    const [
      // User data
      usersResult,
      userRolesResult,
      
      // Content data
      topicsResult,
      questionsResult,
      eventsResult,
      surveysResult,
      scenariosResult,
      
      // Engagement data
      quizAttemptsResult,
      quizAttemptsWeekResult,
      surveyResponsesResult,
      multiplayerSessionsResult,
      
      // System data
      feedbackResult,
      
      // Recent activity data
      recentQuizAttemptsResult,
      recentEventsResult,
      recentFeedbackResult
    ] = await Promise.all([
      // Users
      supabase.from('users').select('id, created_at, last_sign_in_at, email_verified'),
      supabase.from('user_roles').select('user_id, role'),
      
      // Content
      supabase.from('question_topics').select('topic_id, created_at'),
      supabase.from('questions').select('id, created_at'),
      supabase.from('user_events').select('id, status, created_at').eq('status', 'pending'),
      supabase.from('surveys').select('id, status, created_at').eq('status', 'active'),
      supabase.from('scenarios').select('id, created_at'),
      
      // Engagement
      supabase.from('user_quiz_attempts').select('id, completed_at, score').gte('completed_at', oneDayAgo.toISOString()),
      supabase.from('user_quiz_attempts').select('id, completed_at, score').gte('completed_at', oneWeekAgo.toISOString()),
      supabase.from('survey_responses').select('id, created_at').gte('created_at', oneDayAgo.toISOString()),
      supabase.from('multiplayer_rooms').select('id, status, created_at').eq('status', 'active'),
      
      // System
      supabase.from('user_feedback').select('id, status, created_at').eq('status', 'pending'),
      
      // Recent activity
      supabase.from('user_quiz_attempts').select('id, completed_at, score, user_id').order('completed_at', { ascending: false }).limit(10),
      supabase.from('user_events').select('id, created_at, title, user_id').order('created_at', { ascending: false }).limit(10),
      supabase.from('user_feedback').select('id, created_at, subject, user_id').order('created_at', { ascending: false }).limit(10)
    ])

    // Process user data
    const users = usersResult.data || []
    const userRoles = userRolesResult.data || []
    const activeUsers = users.filter(user => 
      user.last_sign_in_at && new Date(user.last_sign_in_at) > thirtyDaysAgo
    )
    const newUsers = users.filter(user => 
      new Date(user.created_at) > oneWeekAgo
    )
    const verifiedUsers = users.filter(user => user.email_verified)
    const adminUsers = userRoles.filter(role => role.role === 'admin')

    // Process content data
    const topics = topicsResult.data || []
    const questions = questionsResult.data || []
    const pendingEvents = eventsResult.data || []
    const activeSurveys = surveysResult.data || []
    const scenarios = scenariosResult.data || []

    // Process engagement data
    const quizAttemptsToday = quizAttemptsResult.data || []
    const quizAttemptsWeek = quizAttemptsWeekResult.data || []
    const surveyResponsesToday = surveyResponsesResult.data || []
    const activeMultiplayerSessions = multiplayerSessionsResult.data || []

    // Calculate completion rate
    const completedQuizzes = quizAttemptsWeek.filter(attempt => attempt.score !== null)
    const avgCompletionRate = quizAttemptsWeek.length > 0 
      ? (completedQuizzes.length / quizAttemptsWeek.length) * 100 
      : 0

    // Process system data
    const pendingFeedback = feedbackResult.data || []

    // Calculate analytics metrics
    const avgScore = quizAttemptsWeek.length > 0 
      ? quizAttemptsWeek.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttemptsWeek.length
      : 0

    const civicEngagementScore = Math.min(100, Math.max(0, (avgScore * 0.4) + (avgCompletionRate * 0.6)))
    const knowledgeImprovementRate = 85 // TODO: Calculate from historical data
    const contentQualityScore = 90 // TODO: Calculate from content metrics
    const userSatisfactionRate = 88 // TODO: Calculate from feedback data

    // Build dashboard stats
    const stats: DashboardStats = {
      users: {
        total: users.length,
        active_last_30_days: activeUsers.length,
        new_this_week: newUsers.length,
        verified_count: verifiedUsers.length,
        admin_count: adminUsers.length
      },
      content: {
        total_topics: topics.length,
        total_questions: questions.length,
        pending_events: pendingEvents.length,
        ai_generated_today: 0, // TODO: Track AI-generated content
        surveys_active: activeSurveys.length,
        scenarios_available: scenarios.length
      },
      engagement: {
        quiz_attempts_today: quizAttemptsToday.length,
        quiz_attempts_week: quizAttemptsWeek.length,
        survey_responses_today: surveyResponsesToday.length,
        avg_completion_rate: Math.round(avgCompletionRate),
        multiplayer_sessions_active: activeMultiplayerSessions.length
      },
      system: {
        pending_feedback: pendingFeedback.length,
        system_alerts: 0, // TODO: Implement system monitoring
        last_backup: new Date().toISOString(), // TODO: Track actual backup times
        storage_usage: 0, // TODO: Track storage usage
        api_calls_today: 0 // TODO: Track API usage
      },
      analytics: {
        civic_engagement_score: Math.round(civicEngagementScore),
        knowledge_improvement_rate: knowledgeImprovementRate,
        content_quality_score: contentQualityScore,
        user_satisfaction_rate: userSatisfactionRate
      }
    }

    // Generate recent activity
    const recentActivity: RecentActivity[] = []

    // Add recent quiz attempts
    if (recentQuizAttemptsResult.data) {
      recentQuizAttemptsResult.data.forEach(attempt => {
        recentActivity.push({
          id: attempt.id,
          type: 'quiz_completed',
          description: `Quiz completed with score ${attempt.score || 0}%`,
          timestamp: attempt.completed_at,
          user_email: 'user@example.com', // TODO: Join with user data
          metadata: { score: attempt.score }
        })
      })
    }

    // Add recent events
    if (recentEventsResult.data) {
      recentEventsResult.data.forEach(event => {
        recentActivity.push({
          id: event.id,
          type: 'event_submitted',
          description: `New event submitted: ${event.title}`,
          timestamp: event.created_at,
          user_email: 'user@example.com', // TODO: Join with user data
          metadata: { title: event.title }
        })
      })
    }

    // Add recent feedback
    if (recentFeedbackResult.data) {
      recentFeedbackResult.data.forEach(feedback => {
        recentActivity.push({
          id: feedback.id,
          type: 'feedback_received',
          description: `New feedback: ${feedback.subject}`,
          timestamp: feedback.created_at,
          user_email: 'user@example.com', // TODO: Join with user data
          metadata: { subject: feedback.subject }
        })
      })
    }

    // Add new user signups
    newUsers.forEach(user => {
      recentActivity.push({
        id: user.id,
        type: 'user_signup',
        description: 'New user registered',
        timestamp: user.created_at,
        user_email: 'user@example.com', // TODO: Get actual email
        metadata: {}
      })
    })

    // Sort recent activity by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Generate system alerts
    const systemAlerts: SystemAlert[] = []
    
    if (pendingEvents.length > 10) {
      systemAlerts.push({
        id: 'pending-events-high',
        type: 'warning',
        title: 'High Number of Pending Events',
        description: `${pendingEvents.length} events are awaiting review`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    if (pendingFeedback.length > 5) {
      systemAlerts.push({
        id: 'pending-feedback-high',
        type: 'warning',
        title: 'Pending Feedback Requires Attention',
        description: `${pendingFeedback.length} feedback items need review`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    if (avgCompletionRate < 70) {
      systemAlerts.push({
        id: 'low-completion-rate',
        type: 'warning',
        title: 'Low Quiz Completion Rate',
        description: `Completion rate is ${Math.round(avgCompletionRate)}%, below target of 70%`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    // Update system alerts count
    stats.system.system_alerts = systemAlerts.length

    const response = {
      success: true,
      data: {
        stats,
        recentActivity: recentActivity.slice(0, 20),
        systemAlerts,
        ...(includeDetails && {
          details: {
            userGrowth: newUsers.length,
            contentGrowth: topics.filter(t => new Date(t.created_at) > oneWeekAgo).length,
            engagementTrend: quizAttemptsWeek.length > 0 ? 'up' : 'stable'
          }
        })
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Admin dashboard API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params = dashboardRequestSchema.parse(body)
    
    // Reuse GET logic with POST body parameters
    const url = new URL(request.url)
    url.searchParams.set('timeRange', params.timeRange)
    url.searchParams.set('includeDetails', params.includeDetails.toString())
    
    return GET(new NextRequest(url.toString()))
  } catch (error) {
    console.error('Dashboard POST API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid request' 
      },
      { status: 400 }
    )
  }
} 