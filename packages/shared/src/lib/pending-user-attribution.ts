/**
 * Pending User Attribution System
 * Handles storing and transferring assessment results and XP for users who complete
 * assessments while logged out and then authenticate
 */

export interface PendingAssessmentResult {
  id: string
  type: 'civics_test' | 'onboarding_assessment'
  sessionId: string
  completedAt: number
  results: {
    score: number
    correct: number
    total: number
    level: 'beginner' | 'intermediate' | 'advanced'
    perCategory: Record<string, { correct: number; total: number }>
  }
  answers: Record<string, string>
  responseTimes: Record<string, number>
  streak: number
  testType?: 'quick' | 'full'
  metadata: {
    timeSpentSeconds: number
    questionResponses: Array<{
      questionId: string
      category: string
      isCorrect: boolean
      timeSpent: number
    }>
  }
}

export interface PendingQuizResult {
  id: string
  topicId: string
  sessionId: string
  completedAt: number
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpentSeconds: number
  questionResponses: Array<{
    questionId: string
    category: string
    isCorrect: boolean
    timeSpent: number
  }>
}

export interface PendingUserData {
  assessments: PendingAssessmentResult[]
  quizzes: PendingQuizResult[]
  totalPendingXP: number
  createdAt: number
}

const PENDING_DATA_KEY = 'civicSense_pendingUserData'
const PENDING_DATA_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

export const pendingUserAttribution = {
  /**
   * Get all pending user data from localStorage
   */
  getPendingData(): PendingUserData | null {
    try {
      const stored = localStorage.getItem(PENDING_DATA_KEY)
      if (!stored) return null

      const data = JSON.parse(stored) as PendingUserData
      
      // Check if data has expired
      if (Date.now() - data.createdAt > PENDING_DATA_EXPIRY) {
        this.clearPendingData()
        return null
      }

      return data
    } catch (error) {
      console.error('Error reading pending user data:', error)
      return null
    }
  },

  /**
   * Store pending assessment result
   */
  storePendingAssessment(assessment: Omit<PendingAssessmentResult, 'id'>): void {
    try {
      const currentData = this.getPendingData() || {
        assessments: [],
        quizzes: [],
        totalPendingXP: 0,
        createdAt: Date.now()
      }

      const assessmentResult: PendingAssessmentResult = {
        ...assessment,
        id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Calculate XP for this assessment
      const assessmentXP = this.calculateAssessmentXP(assessmentResult)

      currentData.assessments.push(assessmentResult)
      currentData.totalPendingXP += assessmentXP

      localStorage.setItem(PENDING_DATA_KEY, JSON.stringify(currentData))
      
      console.log(`📝 Stored pending assessment: +${assessmentXP} XP, Total pending: ${currentData.totalPendingXP} XP`)
    } catch (error) {
      console.error('Error storing pending assessment:', error)
    }
  },

  /**
   * Store pending quiz result
   */
  storePendingQuiz(quiz: Omit<PendingQuizResult, 'id'>): void {
    try {
      const currentData = this.getPendingData() || {
        assessments: [],
        quizzes: [],
        totalPendingXP: 0,
        createdAt: Date.now()
      }

      const quizResult: PendingQuizResult = {
        ...quiz,
        id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Calculate XP for this quiz (10 XP per correct answer)
      const quizXP = quiz.correctAnswers * 10

      currentData.quizzes.push(quizResult)
      currentData.totalPendingXP += quizXP

      localStorage.setItem(PENDING_DATA_KEY, JSON.stringify(currentData))
      
      console.log(`📝 Stored pending quiz: +${quizXP} XP, Total pending: ${currentData.totalPendingXP} XP`)
    } catch (error) {
      console.error('Error storing pending quiz:', error)
    }
  },

  /**
   * Calculate XP for assessment based on type and performance
   */
  calculateAssessmentXP(assessment: PendingAssessmentResult): number {
    // Base XP: 10 per correct answer
    let baseXP = assessment.results.correct * 10

    // Bonus XP based on assessment type
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

    return baseXP
  },

  /**
   * Transfer all pending data to user account
   */
  async transferPendingDataToUser(userId: string): Promise<{
    success: boolean
    totalXPAwarded: number
    assessmentsTransferred: number
    quizzesTransferred: number
    error?: string
  }> {
    const pendingData = this.getPendingData()
    if (!pendingData) {
      return { success: true, totalXPAwarded: 0, assessmentsTransferred: 0, quizzesTransferred: 0 }
    }

    try {
      console.log(`🔄 Transferring pending data for user ${userId}:`, {
        assessments: pendingData.assessments.length,
        quizzes: pendingData.quizzes.length,
        totalXP: pendingData.totalPendingXP
      })

      let totalXPAwarded = 0
      let assessmentsTransferred = 0
      let quizzesTransferred = 0

      // Transfer assessments
      for (const assessment of pendingData.assessments) {
        try {
          const response = await fetch('/api/pending-attribution/transfer-assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              assessment
            })
          })

          if (response.ok) {
            const result = await response.json()
            totalXPAwarded += result.xpAwarded || 0
            assessmentsTransferred++
            console.log(`✅ Transferred assessment ${assessment.id}: +${result.xpAwarded} XP`)
          } else {
            console.error(`❌ Failed to transfer assessment ${assessment.id}`)
          }
        } catch (error) {
          console.error(`❌ Error transferring assessment ${assessment.id}:`, error)
        }
      }

      // Transfer quizzes
      for (const quiz of pendingData.quizzes) {
        try {
          const response = await fetch('/api/pending-attribution/transfer-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              quiz
            })
          })

          if (response.ok) {
            const result = await response.json()
            totalXPAwarded += result.xpAwarded || 0
            quizzesTransferred++
            console.log(`✅ Transferred quiz ${quiz.id}: +${result.xpAwarded} XP`)
          } else {
            console.error(`❌ Failed to transfer quiz ${quiz.id}`)
          }
        } catch (error) {
          console.error(`❌ Error transferring quiz ${quiz.id}:`, error)
        }
      }

      // Clear pending data after successful transfer
      this.clearPendingData()

      console.log(`🎉 Transfer complete: ${totalXPAwarded} XP, ${assessmentsTransferred} assessments, ${quizzesTransferred} quizzes`)

      return {
        success: true,
        totalXPAwarded,
        assessmentsTransferred,
        quizzesTransferred
      }
    } catch (error) {
      console.error('Error transferring pending data:', error)
      return {
        success: false,
        totalXPAwarded: 0,
        assessmentsTransferred: 0,
        quizzesTransferred: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Get summary of pending data for display
   */
  getPendingSummary(): {
    hasData: boolean
    totalXP: number
    assessmentCount: number
    quizCount: number
    daysSinceCreated: number
  } {
    const data = this.getPendingData()
    if (!data) {
      return { hasData: false, totalXP: 0, assessmentCount: 0, quizCount: 0, daysSinceCreated: 0 }
    }

    const daysSinceCreated = Math.floor((Date.now() - data.createdAt) / (1000 * 60 * 60 * 24))

    return {
      hasData: true,
      totalXP: data.totalPendingXP,
      assessmentCount: data.assessments.length,
      quizCount: data.quizzes.length,
      daysSinceCreated
    }
  },

  /**
   * Clear all pending data
   */
  clearPendingData(): void {
    try {
      localStorage.removeItem(PENDING_DATA_KEY)
      console.log('🗑️ Cleared pending user data')
    } catch (error) {
      console.error('Error clearing pending data:', error)
    }
  },

  /**
   * Check if there's pending data that should be transferred
   */
  hasPendingData(): boolean {
    const data = this.getPendingData()
    return !!(data && (data.assessments.length > 0 || data.quizzes.length > 0))
  }
} 