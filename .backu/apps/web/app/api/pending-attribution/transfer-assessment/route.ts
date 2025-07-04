import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateEnhancedProgress } from '@/lib/enhanced-gamification'
import type { PendingAssessmentResult } from '@/lib/pending-user-attribution'

export async function POST(request: NextRequest) {
  try {
    const { userId, assessment } = await request.json() as {
      userId: string
      assessment: PendingAssessmentResult
    }

    if (!userId || !assessment) {
      return NextResponse.json(
        { error: 'Missing userId or assessment data' },
        { status: 400 }
      )
    }

    console.log(`🔄 Transferring assessment ${assessment.id} to user ${userId}`)

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
      // 1. Save assessment to user_assessments table
      const { error: assessmentError } = await supabase
        .from('user_assessments')
        .insert({
          user_id: userId,
          assessment_type: assessment.type === 'civics_test' ? 'civics_test' : 'onboarding',
          score: assessment.results.score,
          level: assessment.results.level,
          category_breakdown: assessment.results.perCategory,
          answers: assessment.answers,
          mode: assessment.testType || 'quick',
          completed_at: new Date(assessment.completedAt).toISOString(),
          session_id: assessment.sessionId
        })

      if (assessmentError) {
        console.error('Error saving assessment:', assessmentError)
        throw assessmentError
      }

      // 2. Update enhanced gamification progress
      if (assessment.metadata.questionResponses?.length > 0) {
        const quizData = {
          topicId: `${assessment.type}_${assessment.testType || 'quick'}`,
          totalQuestions: assessment.results.total,
          correctAnswers: assessment.results.correct,
          timeSpentSeconds: assessment.metadata.timeSpentSeconds,
          questionResponses: assessment.metadata.questionResponses
        }

        console.log('🎮 Updating enhanced gamification for transferred assessment:', quizData)
        const gamificationResult = await updateEnhancedProgress(userId, quizData)
        
        console.log('✅ Enhanced gamification updated:', {
          achievements: gamificationResult.newAchievements?.length || 0,
          levelUp: gamificationResult.levelUp || false,
          skillUpdates: gamificationResult.skillUpdates?.length || 0
        })
      }

      // 3. Calculate and award base XP for the assessment
      let baseXP = assessment.results.correct * 10

      // Assessment completion bonuses
      if (assessment.type === 'civics_test') {
        if (assessment.testType === 'full') {
          baseXP += 500 // Bonus for completing full civics test
        } else {
          baseXP += 100 // Bonus for completing quick civics test
        }
      } else if (assessment.type === 'onboarding_assessment') {
        baseXP += 200 // Bonus for completing onboarding assessment
      }

      // Performance bonus
      const scorePercentage = (assessment.results.correct / assessment.results.total) * 100
      if (scorePercentage >= 90) {
        baseXP = Math.floor(baseXP * 1.2) // 20% bonus for excellent performance
      } else if (scorePercentage >= 80) {
        baseXP = Math.floor(baseXP * 1.1) // 10% bonus for good performance
      }

      // Award XP directly to user_progress
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('total_xp, current_level')
        .eq('user_id', userId)
        .single()

      if (currentProgress) {
        const newTotalXp = (currentProgress.total_xp || 0) + baseXP
        
        // Simple level calculation (can be enhanced later)
        let newLevel = currentProgress.current_level || 1
        while (newTotalXp >= (newLevel * 100)) {
          newLevel++
        }

        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            total_xp: newTotalXp,
            current_level: newLevel
          })
          .eq('user_id', userId)

        if (!updateError) {
          totalXPAwarded = baseXP
          console.log(`✅ Awarded ${baseXP} XP for transferred assessment`)
        }
      }

      // 4. Record the attribution in assessment_analytics
      await supabase
        .from('assessment_analytics')
        .insert({
          user_id: userId,
          session_id: assessment.sessionId,
          event_type: 'transferred_from_pending',
          final_score: assessment.results.score,
          timestamp: new Date().toISOString(),
          metadata: {
            original_completion_time: assessment.completedAt,
            transfer_time: Date.now(),
            assessment_type: assessment.type,
            test_type: assessment.testType
          }
        })

      console.log(`🎉 Successfully transferred assessment ${assessment.id}: +${totalXPAwarded} XP`)

      return NextResponse.json({
        success: true,
        xpAwarded: totalXPAwarded,
        assessmentId: assessment.id
      })

    } catch (error) {
      console.error('Error in assessment transfer:', error)
      throw error
    }

  } catch (error) {
    console.error('Error transferring assessment:', error)
    return NextResponse.json(
      { 
        error: 'Failed to transfer assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 