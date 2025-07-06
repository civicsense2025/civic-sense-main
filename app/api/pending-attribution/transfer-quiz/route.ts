import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateEnhancedProgress } from '@/lib/enhanced-gamification'
import type { PendingQuizResult } from '@/lib/pending-user-attribution'

export async function POST(request: NextRequest) {
  try {
    const { userId, quiz } = await request.json() as {
      userId: string
      quiz: PendingQuizResult
    }

    if (!userId || !quiz) {
      return NextResponse.json(
        { error: 'Missing userId or quiz data' },
        { status: 400 }
      )
    }

    console.log(`🔄 Transferring quiz ${quiz.id} to user ${userId}`)

    // Verify user exists
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let totalXPAwarded = 0

    try {
      // 1. Save quiz attempt to user_quiz_attempts table
      const { error: quizAttemptError } = await supabase
        .from('user_quiz_attempts')
        .insert({
          user_id: userId,
          topic_id: quiz.topicId,
          score: quiz.score,
          correct_answers: quiz.correctAnswers,
          total_questions: quiz.totalQuestions,
          time_spent_seconds: quiz.timeSpentSeconds,
          is_completed: true,
          completed_at: new Date(quiz.completedAt).toISOString(),
          session_id: quiz.sessionId
        })

      if (quizAttemptError) {
        console.error('Error saving quiz attempt:', quizAttemptError)
        throw quizAttemptError
      }

      // 2. Update enhanced gamification progress
      const quizData = {
        topicId: quiz.topicId,
        totalQuestions: quiz.totalQuestions,
        correctAnswers: quiz.correctAnswers,
        timeSpentSeconds: quiz.timeSpentSeconds,
        questionResponses: quiz.questionResponses
      }

      console.log('🎮 Updating enhanced gamification for transferred quiz:', quizData)
      const gamificationResult = await updateEnhancedProgress(userId, quizData)
      
      console.log('✅ Enhanced gamification updated:', {
        achievements: gamificationResult.newAchievements?.length || 0,
        levelUp: gamificationResult.levelUp || false,
        skillUpdates: gamificationResult.skillUpdates?.length || 0
      })

      // 3. Calculate base XP (10 XP per correct answer)
      const baseXP = quiz.correctAnswers * 10
      totalXPAwarded = baseXP

      // Note: The enhanced gamification system will handle XP awarding with anti-farming measures
      // The XP calculation above is just for reporting purposes

      console.log(`🎉 Successfully transferred quiz ${quiz.id}: ${quiz.correctAnswers}/${quiz.totalQuestions} correct`)

      return NextResponse.json({
        success: true,
        xpAwarded: totalXPAwarded,
        quizId: quiz.id,
        gamificationResult: {
          achievements: gamificationResult.newAchievements?.length || 0,
          levelUp: gamificationResult.levelUp || false,
          skillUpdates: gamificationResult.skillUpdates?.length || 0
        }
      })

    } catch (error) {
      console.error('Error in quiz transfer:', error)
      throw error
    }

  } catch (error) {
    console.error('Error transferring quiz:', error)
    return NextResponse.json(
      { 
        error: 'Failed to transfer quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 