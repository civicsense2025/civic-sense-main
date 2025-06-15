"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { 
  enhancedProgressOperations, 
  updateEnhancedProgress,
  type EnhancedUserProgress,
  type Achievement 
} from "@/lib/enhanced-gamification"

interface GamificationState {
  progress: EnhancedUserProgress | null
  isLoading: boolean
  error: string | null
}

interface QuizCompletionData {
  topicId: string
  totalQuestions: number
  correctAnswers: number
  timeSpentSeconds: number
  questionResponses: Array<{
    questionId: string
    category: string
    isCorrect: boolean
    timeSpent: number
  }>
}

export function useGamification() {
  const { user } = useAuth()
  const [state, setState] = useState<GamificationState>({
    progress: null,
    isLoading: false,
    error: null
  })

  // Load initial progress data
  const loadProgress = useCallback(async () => {
    if (!user) {
      setState({ progress: null, isLoading: false, error: null })
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const progress = await enhancedProgressOperations.getComprehensiveStats(user.id)
      setState({ progress, isLoading: false, error: null })
    } catch (error) {
      console.error('Error loading gamification progress:', error)
      setState({ 
        progress: null, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load progress' 
      })
    }
  }, [user])

  // Update progress after quiz completion
  const updateProgress = useCallback(async (quizData: QuizCompletionData) => {
    if (!user) return { newAchievements: [], levelUp: false, skillUpdates: [] }

    try {
      const results = await updateEnhancedProgress(user.id, quizData)
      
      // Refresh progress data after update
      await loadProgress()
      
      return results
    } catch (error) {
      console.error('Error updating gamification progress:', error)
      return { newAchievements: [], levelUp: false, skillUpdates: [] }
    }
  }, [user, loadProgress])

  // Refresh progress data
  const refreshProgress = useCallback(() => {
    loadProgress()
  }, [loadProgress])

  // Load progress when user changes
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  return {
    // State
    progress: state.progress,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    updateProgress,
    refreshProgress,
    
    // Computed values
    currentLevel: state.progress?.currentLevel || 1,
    currentStreak: state.progress?.currentStreak || 0,
    totalXP: state.progress?.totalXp || 0,
    accuracyPercentage: state.progress?.accuracyPercentage || 0,
    weeklyProgress: {
      completed: state.progress?.weeklyCompleted || 0,
      goal: state.progress?.weeklyGoal || 3
    }
  }
} 