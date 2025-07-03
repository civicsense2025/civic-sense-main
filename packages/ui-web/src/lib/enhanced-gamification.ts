"use client"

// Types for the enhanced gamification system
export interface EnhancedUserProgress {
  // Existing fields
  currentStreak: number
  longestStreak: number
  totalQuizzesCompleted: number
  totalQuestionsAnswered: number
  totalCorrectAnswers: number
  
  // Enhanced fields
  totalXp: number
  currentLevel: number
  xpToNextLevel: number
  weeklyGoal: number
  weeklyCompleted: number
  weekStartDate?: string
  preferredCategories: string[]
  adaptiveDifficulty: boolean
  learningStyle: 'visual' | 'reading' | 'mixed' | 'challenge'
  
  // Computed stats
  accuracyPercentage: number
  categoriesMastered: number
  categoriesAttempted: number
  activeGoals: number
  customDecksCount: number
  achievementsThisWeek: number
  
  // Boost-related fields
  availableXpForBoosts: number
  totalBoostsPurchased: number
  activeBoosts: any[]
}

// Simplified operations for UI
export const enhancedProgressOperations = {
  calculateProgressToNextLevel(currentLevel: number): number {
    const baseXP = 100
    const scalingFactor = 1.8
    return Math.floor(baseXP * Math.pow(currentLevel - 1, scalingFactor))
  },

  // Mock implementation for UI development
  async getComprehensiveStats(userId: string): Promise<EnhancedUserProgress> {
    // Return mock data for now
    return {
      currentStreak: 3,
      longestStreak: 5,
      totalQuizzesCompleted: 10,
      totalQuestionsAnswered: 50,
      totalCorrectAnswers: 40,
      totalXp: 1000,
      currentLevel: 5,
      xpToNextLevel: 500,
      weeklyGoal: 10,
      weeklyCompleted: 3,
      weekStartDate: new Date().toISOString(),
      preferredCategories: ['civics', 'history'],
      adaptiveDifficulty: true,
      learningStyle: 'mixed',
      accuracyPercentage: 80,
      categoriesMastered: 2,
      categoriesAttempted: 5,
      activeGoals: 3,
      customDecksCount: 1,
      achievementsThisWeek: 2,
      availableXpForBoosts: 100,
      totalBoostsPurchased: 1,
      activeBoosts: []
    }
  }
} 