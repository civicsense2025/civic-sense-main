/**
 * Question Topic Analytics API Route
 * 
 * Provides comprehensive analytics data for individual question topics,
 * including user performance, question analysis, and engagement metrics.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/question-topics/[topicId]/analytics
 * Get comprehensive analytics for a specific topic
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const topicId = params.topicId

    const supabase = await createClient()
    
    // Get date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Generate analytics data
    const questionPerformance = await generateQuestionPerformance(supabase, topicId)
    const dailyAttempts = generateDailyAttempts(days)
    const categoryPerformance = await generateCategoryPerformance(supabase, topicId)
    const difficultyAnalysis = await generateDifficultyAnalysis(supabase, topicId)
    const recentActivity = generateRecentActivity()

    // Mock analytics data for now (in production, this would query actual user data)
    const analytics = {
      total_attempts: Math.floor(Math.random() * 500) + 100,
      unique_users: Math.floor(Math.random() * 200) + 50,
      completion_rate: Math.round((Math.random() * 30 + 65) * 100) / 100,
      avg_score: Math.round((Math.random() * 20 + 70) * 100) / 100,
      avg_time_spent: Math.floor(Math.random() * 300) + 180,

      question_performance: questionPerformance,
      daily_attempts: dailyAttempts,
      user_patterns: {
        repeat_takers: Math.floor(Math.random() * 50) + 10,
        avg_attempts_per_user: Math.round((Math.random() * 2 + 1.2) * 10) / 10,
        improvement_rate: Math.round((Math.random() * 20 + 75) * 100) / 100
      },
      category_performance: categoryPerformance,
      difficulty_analysis: difficultyAnalysis,
      recent_activity: recentActivity
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error fetching topic analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

async function generateQuestionPerformance(supabase: any, topicId: string) {
  try {
    // Get actual questions for this topic
    const { data: questions } = await supabase
      .from('questions')
      .select('id, question_number, question, category, difficulty_level')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('question_number')

    if (!questions || questions.length === 0) {
      return []
    }

    // Generate mock performance data for each question
    return questions.map((question: any) => {
      const totalResponses = Math.floor(Math.random() * 200) + 50
      const correctResponses = Math.floor(totalResponses * (Math.random() * 0.4 + 0.4))
      
      return {
        question_id: question.id,
        question_number: question.question_number,
        question_text: question.question.length > 100 
          ? question.question.substring(0, 100) + '...'
          : question.question,
        category: question.category,
        difficulty_level: question.difficulty_level,
        total_responses: totalResponses,
        correct_responses: correctResponses,
        accuracy_rate: Math.round((correctResponses / totalResponses) * 100 * 100) / 100,
        avg_response_time: Math.round((Math.random() * 30 + 10) * 100) / 100,
        common_wrong_answers: [
          { answer: "Option B", count: Math.floor(totalResponses * 0.2) },
          { answer: "Option C", count: Math.floor(totalResponses * 0.15) }
        ]
      }
    })
  } catch (error) {
    console.error('Error generating question performance:', error)
    return []
  }
}

function generateDailyAttempts(days: number) {
  const attempts = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    
    const attemptsCount = Math.floor(Math.random() * 20) + 5
    
    attempts.push({
      date: date.toISOString().split('T')[0],
      attempts: attemptsCount,
      avg_score: Math.round((Math.random() * 20 + 70) * 100) / 100,
      completion_rate: Math.round((Math.random() * 20 + 75) * 100) / 100
    })
  }
  
  return attempts
}

async function generateCategoryPerformance(supabase: any, topicId: string) {
  try {
    // Get categories for this topic's questions
    const { data: categories } = await supabase
      .from('questions')
      .select('category')
      .eq('topic_id', topicId)
      .eq('is_active', true)

    if (!categories || categories.length === 0) {
      return {}
    }

    const uniqueCategories = [...new Set(categories.map((c: any) => c.category))]
    const performance: Record<string, any> = {}

    uniqueCategories.forEach(category => {
      const questionCount = categories.filter((c: any) => c.category === category).length
      
      performance[category] = {
        total_questions: questionCount,
        avg_accuracy: Math.round((Math.random() * 30 + 60) * 100) / 100,
        avg_time: Math.round((Math.random() * 20 + 15) * 100) / 100
      }
    })

    return performance
  } catch (error) {
    console.error('Error generating category performance:', error)
    return {}
  }
}

async function generateDifficultyAnalysis(supabase: any, topicId: string) {
  try {
    // Get difficulty distribution for this topic
    const { data: questions } = await supabase
      .from('questions')
      .select('difficulty_level')
      .eq('topic_id', topicId)
      .eq('is_active', true)

    if (!questions || questions.length === 0) {
      return {}
    }

    // Count questions by difficulty level
    const difficultyGroups: Record<string, number> = {}
    questions.forEach((q: any) => {
      const level = q.difficulty_level.toString()
      difficultyGroups[level] = (difficultyGroups[level] || 0) + 1
    })

    const analysis: Record<string, any> = {}

    // Generate analysis for each difficulty level
    Object.keys(difficultyGroups).forEach(level => {
      const count = difficultyGroups[level]
      const difficultyMultiplier = parseInt(level) / 3
      const baseAccuracy = 85 - (difficultyMultiplier * 20)
      const baseCompletion = 90 - (difficultyMultiplier * 15)
      
      analysis[level] = {
        question_count: count,
        avg_accuracy: Math.round(Math.max(50, baseAccuracy + (Math.random() * 10 - 5)) * 100) / 100,
        avg_time: Math.round((15 + (difficultyMultiplier * 10) + (Math.random() * 5)) * 100) / 100,
        completion_rate: Math.round(Math.max(60, baseCompletion + (Math.random() * 10 - 5)) * 100) / 100
      }
    })

    return analysis
  } catch (error) {
    console.error('Error generating difficulty analysis:', error)
    return {}
  }
}

function generateRecentActivity() {
  const activity = []
  const now = new Date()
  
  for (let i = 0; i < 10; i++) {
    const completedAt = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000))
    
    activity.push({
      user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
      score: Math.round((Math.random() * 40 + 60) * 100) / 100,
      completed_at: completedAt.toISOString(),
      time_spent: Math.floor(Math.random() * 300) + 120
    })
  }
  
  return activity.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
} 