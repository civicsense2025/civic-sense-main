import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/learning-pods/[podId]/analytics - Get analytics for a pod
export async function GET(
  request: NextRequest,
  { params }: { params: { podId: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a member of this pod
    const { data: membership } = await supabase
      .from('pod_memberships')
      .select('role')
      .eq('pod_id', params.podId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get pod basic info
    const { data: pod } = await supabase
      .from('learning_pods')
      .select('pod_name, pod_type, created_at')
      .eq('id', params.podId)
      .single()

    // Get member count and recent activity
    const { data: members } = await supabase
      .from('pod_memberships')
      .select('user_id, role, joined_at')
      .eq('pod_id', params.podId)
      .eq('membership_status', 'active')

    // Get analytics from user_progress and user_quiz_attempts
    const { data: progressData } = await supabase
      .from('user_progress')
      .select(`
        user_id,
        total_questions_answered,
        total_correct_answers,
        current_streak,
        longest_streak,
        updated_at
      `)
      .in('user_id', members?.map(m => m.user_id) || [])
      .gte('updated_at', startDate)

    // Get quiz attempts for time data
    const { data: quizAttempts } = await supabase
      .from('user_quiz_attempts')
      .select(`
        user_id,
        time_spent_seconds,
        created_at
      `)
      .in('user_id', members?.map(m => m.user_id) || [])
      .gte('created_at', startDate)

    // Calculate aggregate metrics
    const totalMembers = members?.length || 0
    const activeMembers = new Set(progressData?.map(p => p.user_id) || []).size
    const totalQuestions = progressData?.reduce((sum, p) => sum + (p.total_questions_answered || 0), 0) || 0
    const totalCorrect = progressData?.reduce((sum, p) => sum + (p.total_correct_answers || 0), 0) || 0
    const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0
    const totalTimeSpent = quizAttempts?.reduce((sum, q) => sum + (q.time_spent_seconds || 0), 0) || 0

    // Member performance breakdown
    const memberPerformance = members?.map(member => {
      const progress = progressData?.find(p => p.user_id === member.user_id)
      const memberQuizzes = quizAttempts?.filter(q => q.user_id === member.user_id) || []
      const memberQuestions = progress?.total_questions_answered || 0
      const memberCorrect = progress?.total_correct_answers || 0
      const memberTime = memberQuizzes.reduce((sum, q) => sum + (q.time_spent_seconds || 0), 0)
      const bestStreak = progress?.longest_streak || 0

      return {
        userId: member.user_id,
        role: member.role,
        questionsAttempted: memberQuestions,
        accuracy: memberQuestions > 0 ? (memberCorrect / memberQuestions) * 100 : 0,
        timeSpent: memberTime,
        bestStreak,
        isActive: !!progress && memberQuizzes.length > 0
      }
    }) || []

    // Time series data for charts (daily aggregates)
    const timeSeriesData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayProgress = progressData?.filter(p => 
        p.updated_at?.startsWith(dateStr)
      ) || []
      
      const dayQuizzes = quizAttempts?.filter(q => 
        q.created_at?.startsWith(dateStr)
      ) || []
      
      timeSeriesData.push({
        date: dateStr,
        activeMembers: new Set([...dayProgress.map(p => p.user_id), ...dayQuizzes.map(q => q.user_id)]).size,
        questionsAnswered: dayProgress.reduce((sum, p) => sum + (p.total_questions_answered || 0), 0),
        averageAccuracy: dayProgress.length > 0 
          ? dayProgress.reduce((sum, p) => {
              const accuracy = (p.total_correct_answers || 0) / Math.max(p.total_questions_answered || 1, 1)
              return sum + accuracy
            }, 0) / dayProgress.length * 100
          : 0
      })
    }

    const analytics = {
      pod: {
        id: params.podId,
        name: pod?.pod_name,
        type: pod?.pod_type,
        createdAt: pod?.created_at
      },
      overview: {
        totalMembers,
        activeMembers,
        activeMembersPercentage: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0,
        totalQuestions,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        totalTimeSpent,
        averageTimePerMember: totalMembers > 0 ? Math.round(totalTimeSpent / totalMembers) : 0
      },
      memberPerformance: memberPerformance
        .sort((a, b) => b.questionsAttempted - a.questionsAttempted)
        .slice(0, 10), // Top 10 most active members
      timeSeriesData,
      insights: {
        mostActiveDay: timeSeriesData.reduce((max, day) => 
          day.activeMembers > max.activeMembers ? day : max
        , timeSeriesData[0]),
        bestAccuracyDay: timeSeriesData.reduce((max, day) => 
          day.averageAccuracy > max.averageAccuracy ? day : max
        , timeSeriesData[0]),
        engagementTrend: timeSeriesData.length > 7 
          ? timeSeriesData.slice(-7).reduce((sum, day) => sum + day.activeMembers, 0) / 7
          : 0
      }
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error in pod analytics GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 