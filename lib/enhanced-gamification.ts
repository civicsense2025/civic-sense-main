"use client"

import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Database } from './database.types'
import { 
  type DbUserProgress, type DbUserProgressInsert, type DbUserProgressUpdate,
  type DbUserLearningGoal, type DbUserLearningGoalInsert, type DbUserLearningGoalUpdate,
  type DbUserCustomDeck, type DbUserCustomDeckInsert, type DbUserCustomDeckUpdate,
  type DbUserDeckContent, type DbUserDeckContentInsert,
  type DbUserCategorySkill, type DbUserCategorySkillInsert, type DbUserCategorySkillUpdate,
  type DbUserAchievement, type DbUserAchievementInsert,
  type DbUserStreakHistory, type DbUserStreakHistoryInsert,
  type DbUserQuestionMemory, type DbUserQuestionMemoryInsert, type DbUserQuestionMemoryUpdate
} from './database'

// Import boost types from the main boost system
import type { BoostType, GameBoost, UserBoostInventory, ActiveBoost } from './game-boosts'
import { BOOST_DEFINITIONS } from './game-boosts'

// Re-export for convenience
export type { BoostType, GameBoost, UserBoostInventory, ActiveBoost }
export { BOOST_DEFINITIONS }

// Use the existing supabase instance instead of creating a new one
const supabaseClient = supabase

// Types for the enhanced gamification system
export interface LearningGoal {
  id: string
  goalType: 'category_mastery' | 'streak_target' | 'weekly_target' | 'skill_building'
  targetValue: number
  category?: string
  difficultyLevel?: number
  isActive: boolean
  targetDate?: string
  progress?: number
}

export interface CustomDeck {
  id: string
  name: string
  description?: string
  type: 'custom' | 'adaptive' | 'review' | 'challenge'
  preferences: {
    categories?: string[]
    difficultyLevels?: number[]
    questionTypes?: string[]
    maxQuestions?: number
    reviewFrequency?: 'daily' | 'weekly' | 'monthly'
  }
  contentCount: number
  lastUsed?: string
}

export interface CategorySkill {
  category: string
  skillLevel: number // 0-100
  questionsAttempted: number
  questionsCorrect: number
  lastPracticed?: string
  masteryLevel: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  accuracyPercentage: number
  progressToNextLevel: number
}

export interface Achievement {
  type: string
  data: Record<string, any>
  earnedAt: string
  isMilestone: boolean
  title: string
  description: string
  emoji: string
}

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
  activeBoosts: ActiveBoost[]
}

// =============================================================================
// ACHIEVEMENT DEFINITIONS
// =============================================================================

export const ACHIEVEMENT_DEFINITIONS = {
  first_quiz: {
    title: "Getting Started",
    description: "Complete your first quiz",
    emoji: "🎯"
  },
  first_perfect: {
    title: "Perfect Start",
    description: "Get a perfect score on your first quiz",
    emoji: "⭐"
  },
  streak_3: {
    title: "On Fire",
    description: "Achieve a 3-day streak",
    emoji: "🔥"
  },
  streak_7: {
    title: "Week Warrior",
    description: "Achieve a 7-day streak",
    emoji: "💪"
  },
  streak_14: {
    title: "Fortnight Champion",
    description: "Achieve a 14-day streak",
    emoji: "👑"
  },
  streak_30: {
    title: "Monthly Master",
    description: "Achieve a 30-day streak",
    emoji: "🏆"
  },
  streak_100: {
    title: "Centurion",
    description: "Achieve a 100-day streak",
    emoji: "💎"
  },
  quizzes_5: {
    title: "Quiz Explorer",
    description: "Complete 5 quizzes",
    emoji: "🗺️"
  },
  quizzes_10: {
    title: "Quiz Enthusiast", 
    description: "Complete 10 quizzes",
    emoji: "📚"
  },
  quizzes_25: {
    title: "Quiz Scholar",
    description: "Complete 25 quizzes",
    emoji: "🎓"
  },
  quizzes_50: {
    title: "Quiz Expert",
    description: "Complete 50 quizzes",
    emoji: "🧠"
  },
  quizzes_100: {
    title: "Quiz Master",
    description: "Complete 100 quizzes",
    emoji: "🏆"
  },
  quizzes_250: {
    title: "Quiz Legend",
    description: "Complete 250 quizzes",
    emoji: "🌟"
  },
  perfect_quiz: {
    title: "Perfectionist",
    description: "Get a perfect score on a quiz",
    emoji: "💯"
  },
  weekly_goal_met: {
    title: "Goal Getter",
    description: "Complete your weekly goal",
    emoji: "🎯"
  }
} as const

// =============================================================================
// PROGRESSIVE XP SYSTEM
// =============================================================================

export const progressiveXpOperations = {
  /**
   * Calculate XP required for a specific level using progressive scaling
   * Formula: baseXP * (level^1.8) to make leveling progressively harder
   */
  calculateXPForLevel(level: number): number {
    if (level <= 1) return 0
    
    // Progressive scaling: gets exponentially harder
    const baseXP = 100
    const scalingFactor = 1.8 // Increase difficulty curve
    
    return Math.floor(baseXP * Math.pow(level - 1, scalingFactor))
  },

  /**
   * Calculate total XP needed from level 1 to reach target level
   */
  calculateTotalXPForLevel(targetLevel: number): number {
    let totalXP = 0
    for (let level = 2; level <= targetLevel; level++) {
      totalXP += this.calculateXPForLevel(level)
    }
    return totalXP
  },

  /**
   * Calculate XP gains with diminishing returns based on current level
   */
  calculateXPGain(baseXP: number, currentLevel: number, bonusMultipliers: Record<string, number> = {}): number {
    // Base XP with level-based diminishing returns
    const levelPenalty = Math.max(0.3, 1 - (currentLevel - 1) * 0.05) // Min 30% XP at high levels
    let adjustedXP = Math.floor(baseXP * levelPenalty)
    
    // Apply bonus multipliers
    Object.values(bonusMultipliers).forEach(multiplier => {
      adjustedXP = Math.floor(adjustedXP * multiplier)
    })
    
    console.log(`🎮 XP Calculation: Base=${baseXP}, Level=${currentLevel}, Penalty=${levelPenalty.toFixed(2)}, Final=${adjustedXP}`)
    
    return Math.max(1, adjustedXP) // Minimum 1 XP per action
  },

  /**
   * Award XP with progressive scaling and level up logic
   */
  async awardXP(userId: string, baseXpAmount: number, bonusMultipliers: Record<string, number> = {}): Promise<{
    xpGained: number
    levelUp: boolean
    newLevel: number
    newTotalXp: number
  }> {
    const { data: progress, error: getError } = await supabaseClient
      .from('user_progress')
      .select('total_xp, current_level')
      .eq('user_id', userId)
      .single()

    if (getError) throw getError

    const currentLevel = progress?.current_level || 1
    const currentTotalXp = progress?.total_xp || 0
    
    // Calculate actual XP to award with progressive scaling
    const xpGained = this.calculateXPGain(baseXpAmount, currentLevel, bonusMultipliers)
    const newTotalXp = currentTotalXp + xpGained

    // Determine new level
    let newLevel = currentLevel
    while (newTotalXp >= this.calculateTotalXPForLevel(newLevel + 1)) {
      newLevel++
    }

    const levelUp = newLevel > currentLevel
    const xpToNextLevel = this.calculateTotalXPForLevel(newLevel + 1) - newTotalXp

    // Update database
    const { error: updateError } = await supabaseClient
      .from('user_progress')
      .update({
        total_xp: newTotalXp,
        current_level: newLevel,
        xp_to_next_level: Math.max(0, xpToNextLevel)
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    console.log(`🎮 XP Awarded: +${xpGained} XP, Level ${currentLevel} → ${newLevel}, Total: ${newTotalXp}`)

    return {
      xpGained,
      levelUp,
      newLevel,
      newTotalXp
    }
  }
}

// =============================================================================
// BOOST OPERATIONS
// =============================================================================

export const boostOperations = {
  /**
   * Get all available boosts for purchase
   */
  getAvailableBoosts(): GameBoost[] {
    return Object.values(BOOST_DEFINITIONS)
  },

  /**
   * Get user's boost inventory
   */
  async getUserBoosts(userId: string): Promise<UserBoostInventory[]> {
    try {
      const { data, error } = await supabaseClient
        .from('user_boost_inventory')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      return data?.map(row => ({
        userId: row.user_id,
        boostType: row.boost_type as BoostType,
        quantity: row.quantity,
        lastPurchased: row.last_purchased || undefined,
        totalPurchased: row.total_purchased
      })) || []
    } catch (error) {
      console.error('Error fetching user boosts:', error)
      return []
    }
  },

  /**
   * Purchase a boost with XP
   */
  async purchaseBoost(userId: string, boostType: BoostType, cost: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has enough XP
      const userProgress = await enhancedProgressOperations.getComprehensiveStats(userId)
      if (userProgress.totalXp < cost) {
        return { success: false, error: 'Insufficient XP' }
      }

      // Start transaction: deduct XP and add boost
      const { error: xpError } = await supabaseClient
        .from('user_progress')
        .update({ total_xp: userProgress.totalXp - cost })
        .eq('user_id', userId)

      if (xpError) throw xpError

      // Add boost to inventory (upsert)
      const { data: existingBoost } = await supabaseClient
        .from('user_boost_inventory')
        .select('quantity, total_purchased')
        .eq('user_id', userId)
        .eq('boost_type', boostType)
        .single()

      const newQuantity = (existingBoost?.quantity || 0) + 1
      const newTotalPurchased = (existingBoost?.total_purchased || 0) + 1

      const { error: boostError } = await supabaseClient
        .from('user_boost_inventory')
        .upsert({
          user_id: userId,
          boost_type: boostType,
          quantity: newQuantity,
          total_purchased: newTotalPurchased,
          last_purchased: new Date().toISOString()
        }, {
          onConflict: 'user_id,boost_type'
        })

      if (boostError) throw boostError

      return { success: true }
    } catch (error) {
      console.error('Error purchasing boost:', error)
      return { success: false, error: 'Failed to purchase boost' }
    }
  },

  /**
   * Activate a boost for use in quiz
   */
  async activateBoost(userId: string, boostType: BoostType): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has this boost in inventory
      const { data: inventory, error: inventoryError } = await supabaseClient
        .from('user_boost_inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('boost_type', boostType)
        .single()

      if (inventoryError || !inventory || inventory.quantity <= 0) {
        return { success: false, error: 'Boost not available in inventory' }
      }

      // Get boost configuration for duration/uses
      const boostConfig = this.getAvailableBoosts().find(b => b.type === boostType)
      const expiresAt = boostConfig?.duration ? 
        new Date(Date.now() + boostConfig.duration * 1000).toISOString() : null

      // Activate boost
      const { error: activateError } = await supabaseClient
        .from('user_active_boosts')
        .upsert({
          user_id: userId,
          boost_type: boostType,
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
          uses_remaining: boostConfig?.maxUses || null,
          boost_data: {}
        }, {
          onConflict: 'user_id,boost_type'
        })

      if (activateError) throw activateError

      // Decrease inventory count
      const { error: decreaseError } = await supabaseClient
        .from('user_boost_inventory')
        .update({ quantity: inventory.quantity - 1 })
        .eq('user_id', userId)
        .eq('boost_type', boostType)

      if (decreaseError) throw decreaseError

      return { success: true }
    } catch (error) {
      console.error('Error activating boost:', error)
      return { success: false, error: 'Failed to activate boost' }
    }
  },

  /**
   * Get user's currently active boosts
   */
  async getActiveBoosts(userId: string): Promise<ActiveBoost[]> {
    try {
      const { data, error } = await supabaseClient
        .from('user_active_boosts')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      return data?.map(row => ({
        type: row.boost_type as BoostType,
        startedAt: row.started_at,
        duration: row.expires_at ? new Date(row.expires_at).getTime() - new Date(row.started_at).getTime() : undefined,
        usesRemaining: row.uses_remaining || undefined,
        data: row.boost_data as Record<string, any> || {}
      })) || []
    } catch (error) {
      console.error('Error fetching active boosts:', error)
      return []
    }
  },

  /**
   * Use a boost (decrease uses or mark as used)
   */
  async useBoost(userId: string, boostType: BoostType): Promise<boolean> {
    try {
      const { data: activeBoost, error } = await supabaseClient
        .from('user_active_boosts')
        .select('uses_remaining')
        .eq('user_id', userId)
        .eq('boost_type', boostType)
        .single()

      if (error || !activeBoost) return false

      if (activeBoost.uses_remaining !== null) {
        if (activeBoost.uses_remaining <= 1) {
          // Remove boost if no uses remaining
          await supabaseClient
            .from('user_active_boosts')
            .delete()
            .eq('user_id', userId)
            .eq('boost_type', boostType)
        } else {
          // Decrease uses remaining
          await supabaseClient
            .from('user_active_boosts')
            .update({ uses_remaining: activeBoost.uses_remaining - 1 })
            .eq('user_id', userId)
            .eq('boost_type', boostType)
        }
      }

      return true
    } catch (error) {
      console.error('Error using boost:', error)
      return false
    }
  },

  /**
   * Clear expired boosts
   */
  async clearExpiredBoosts(userId: string): Promise<void> {
    try {
      await supabaseClient
        .from('user_active_boosts')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      console.error('Error clearing expired boosts:', error)
    }
  }
}

// =============================================================================
// LEARNING GOALS OPERATIONS
// =============================================================================

export const learningGoalOperations = {
  async create(userId: string, goal: Omit<LearningGoal, 'id'>): Promise<DbUserLearningGoal> {
    const { data, error } = await supabaseClient
      .from('user_learning_goals')
      .insert({
        user_id: userId,
        goal_type: goal.goalType,
        target_value: goal.targetValue,
        category: goal.category,
        difficulty_level: goal.difficultyLevel,
        is_active: goal.isActive,
        target_date: goal.targetDate
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getByUser(userId: string): Promise<LearningGoal[]> {
    const { data, error } = await supabaseClient
      .from('user_learning_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return data.map(goal => ({
      id: goal.id,
      goalType: goal.goal_type as LearningGoal['goalType'],
      targetValue: goal.target_value,
      category: goal.category || undefined,
      difficultyLevel: goal.difficulty_level || undefined,
      isActive: goal.is_active || false,
      targetDate: goal.target_date || undefined
    }))
  },

  async updateProgress(userId: string, goalId: string, progress: number): Promise<void> {
    // This would involve complex logic to calculate progress based on goal type
    // Implementation depends on specific goal tracking requirements
  },

  async complete(goalId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('user_learning_goals')
      .update({ is_active: false })
      .eq('id', goalId)

    if (error) throw error
  }
}

// =============================================================================
// CUSTOM DECK OPERATIONS
// =============================================================================

export const customDeckOperations = {
  async create(userId: string, deck: Omit<CustomDeck, 'id' | 'contentCount' | 'lastUsed'>): Promise<DbUserCustomDeck> {
    const { data, error } = await supabaseClient
      .from('user_custom_decks')
      .insert({
        user_id: userId,
        deck_name: deck.name,
        description: deck.description,
        deck_type: deck.type,
        preferences: deck.preferences
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getByUser(userId: string): Promise<CustomDeck[]> {
    const { data, error } = await supabaseClient
      .from('user_custom_decks')
      .select(`
        *,
        user_deck_content(count)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    if (error) throw error
    
    return data.map(deck => ({
      id: deck.id,
      name: deck.deck_name,
      description: deck.description || undefined,
      type: deck.deck_type as CustomDeck['type'],
      preferences: (deck.preferences as any) || {},
      contentCount: Array.isArray(deck.user_deck_content) ? deck.user_deck_content.length : 0,
      lastUsed: deck.updated_at || undefined
    }))
  },

  async addContent(deckId: string, content: { topicId?: string; questionId?: string; priorityScore?: number }): Promise<void> {
    const { error } = await supabaseClient
      .from('user_deck_content')
      .insert({
        deck_id: deckId,
        topic_id: content.topicId,
        question_id: content.questionId,
        priority_score: content.priorityScore || 1.0
      })

    if (error) throw error
  },

  async removeContent(deckId: string, contentId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('user_deck_content')
      .delete()
      .eq('deck_id', deckId)
      .eq('id', contentId)

    if (error) throw error
  },

  async generateAdaptiveDeck(userId: string, preferences: CustomDeck['preferences']): Promise<any[]> {
    try {
      let questions: any[] = []
      
      // First check if junction table exists and has data
      const { data: junctionExists } = await supabaseClient
        .from('question_topic_categories')
        .select('category_id')
        .limit(1)
      
      if (junctionExists && junctionExists.length > 0 && preferences.categories && preferences.categories.length > 0) {
        // Use optimized junction table approach
        const { data: topicIds } = await supabaseClient
          .from('question_topic_categories')
          .select('topic_id')
          .in('category_id', preferences.categories)
        
        if (topicIds && topicIds.length > 0) {
          const { data, error } = await supabaseClient
            .from('questions')
            .select(`
              *,
              question_topics(*)
            `)
            .in('topic_id', topicIds.map(row => row.topic_id))
            .in('difficulty_level', preferences.difficultyLevels || [1, 2, 3, 4])
            .limit(preferences.maxQuestions || 20)

          if (error) throw error
          questions = data || []
        }
      } else {
        // Fallback to JSONB approach if junction table not populated yet or no category filter
        let query = supabaseClient
          .from('questions')
          .select(`
            *,
            question_topics(*)
          `)
          .in('difficulty_level', preferences.difficultyLevels || [1, 2, 3, 4])
          .limit(preferences.maxQuestions || 20)

        if (preferences.categories && preferences.categories.length > 0) {
          query = query.in('category', preferences.categories)
        }

        const { data, error } = await query
        if (error) throw error
        questions = data || []
      }

      return questions
    } catch (error) {
      console.error('Error generating adaptive deck:', error)
      return []
    }
  }
}

// =============================================================================
// SKILL TRACKING OPERATIONS
// =============================================================================

export const skillTrackingOperations = {
  async updateCategorySkill(
    userId: string, 
    category: string, 
    isCorrect: boolean, 
    timeSpent?: number
  ): Promise<CategorySkill> {
    // Get or create skill record
    let { data: skill, error } = await supabaseClient
      .from('user_category_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single()

    if (error && error.code === 'PGRST116') {
      // Create new skill record
      const { data: newSkill, error: createError } = await supabaseClient
        .from('user_category_skills')
        .insert({
          user_id: userId,
          category: category,
          questions_attempted: 1,
          questions_correct: isCorrect ? 1 : 0,
          skill_level: isCorrect ? 5.0 : 0.0,
          last_practiced_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError
      skill = newSkill
    } else if (error) {
      throw error
    } else {
      // Update existing skill
      if (!skill) {
        throw new Error('Skill data is null')
      }
      
      const questionsAttempted = (skill.questions_attempted || 0) + 1
      const questionsCorrect = (skill.questions_correct || 0) + (isCorrect ? 1 : 0)
      const accuracyRate = questionsCorrect / questionsAttempted
      
      // Calculate new skill level using a learning algorithm
      let newSkillLevel = skill.skill_level || 0
      if (isCorrect) {
        newSkillLevel = Math.min(100, newSkillLevel + (5 * (1 - newSkillLevel / 100)))
      } else {
        newSkillLevel = Math.max(0, newSkillLevel - (3 * (newSkillLevel / 100)))
      }

      // Determine mastery level
      let masteryLevel = 'novice'
      if (newSkillLevel >= 90) masteryLevel = 'expert'
      else if (newSkillLevel >= 70) masteryLevel = 'advanced'
      else if (newSkillLevel >= 50) masteryLevel = 'intermediate'
      else if (newSkillLevel >= 25) masteryLevel = 'beginner'

      const { data: updatedSkill, error: updateError } = await supabaseClient
        .from('user_category_skills')
        .update({
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          skill_level: newSkillLevel,
          mastery_level: masteryLevel,
          last_practiced_at: new Date().toISOString()
        })
        .eq('id', skill.id)
        .select()
        .single()

      if (updateError) throw updateError
      skill = updatedSkill
    }

    // Check for mastery achievement
    if (skill.mastery_level === 'expert') {
      await achievementOperations.checkAndAward(userId, 'category_mastery', { category })
    }

    const accuracyPercentage = Math.round((skill.questions_correct || 0) / (skill.questions_attempted || 1) * 100)
    const progressToNextLevel = this.calculateProgressToNextLevel(skill.skill_level || 0)

    return {
      category: skill.category,
      skillLevel: skill.skill_level || 0,
      questionsAttempted: skill.questions_attempted || 0,
      questionsCorrect: skill.questions_correct || 0,
      lastPracticed: skill.last_practiced_at || undefined,
      masteryLevel: skill.mastery_level as CategorySkill['masteryLevel'] || 'novice',
      accuracyPercentage,
      progressToNextLevel
    }
  },

  calculateProgressToNextLevel(currentLevel: number): number {
    const thresholds = [25, 50, 70, 90, 100]
    const currentThresholdIndex = thresholds.findIndex(threshold => currentLevel < threshold)
    
    if (currentThresholdIndex === -1) return 100 // Already at max level
    
    const nextThreshold = thresholds[currentThresholdIndex]
    const prevThreshold = currentThresholdIndex > 0 ? thresholds[currentThresholdIndex - 1] : 0
    
    return Math.round((currentLevel - prevThreshold) / (nextThreshold - prevThreshold) * 100)
  },

  async getCategorySkills(userId: string): Promise<CategorySkill[]> {
    const { data, error } = await supabaseClient
      .from('user_category_skills')
      .select('*')
      .eq('user_id', userId)
      .order('skill_level', { ascending: false })

    if (error) throw error

    return data.map(skill => ({
      category: skill.category,
      skillLevel: skill.skill_level || 0,
      questionsAttempted: skill.questions_attempted || 0,
      questionsCorrect: skill.questions_correct || 0,
      lastPracticed: skill.last_practiced_at || undefined,
      masteryLevel: skill.mastery_level as CategorySkill['masteryLevel'] || 'novice',
      accuracyPercentage: Math.round((skill.questions_correct || 0) / (skill.questions_attempted || 1) * 100),
      progressToNextLevel: this.calculateProgressToNextLevel(skill.skill_level || 0)
    }))
  }
}

// =============================================================================
// ACHIEVEMENT OPERATIONS
// =============================================================================

export const achievementOperations = {
  async checkAndAward(userId: string, achievementType: string, data: Record<string, any> = {}): Promise<Achievement | null> {
    // Check if achievement already exists
    const { data: existing } = await supabaseClient
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_type', achievementType)
      .single()

    if (existing) return null // Already awarded

    const definition = ACHIEVEMENT_DEFINITIONS[achievementType as keyof typeof ACHIEVEMENT_DEFINITIONS]
    if (!definition) return null

    // Award the achievement
    const { data: achievement, error } = await supabaseClient
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: achievementType,
        achievement_data: data,
        is_milestone: false // Remove the undefined property access
      })
      .select()
      .single()

    if (error) throw error

    // Award XP (using a default value since xpReward property doesn't exist)
    await this.awardXP(userId, 50) // Default XP reward

          return {
        type: achievementType,
        data: achievement.achievement_data as Record<string, any>,
        earnedAt: achievement.earned_at!,
        isMilestone: achievement.is_milestone || false,
        title: definition.title,
        description: definition.description,
      emoji: definition.emoji
    }
  },

  async awardXP(userId: string, baseXpAmount: number, bonusMultipliers: Record<string, number> = {}): Promise<{
    xpGained: number
    levelUp: boolean
    newLevel: number
    newTotalXp: number
  }> {
    const { data: progress, error: getError } = await supabaseClient
      .from('user_progress')
      .select('total_xp, current_level')
      .eq('user_id', userId)
      .single()

    if (getError) throw getError

    const currentLevel = progress?.current_level || 1
    const currentTotalXp = progress?.total_xp || 0
    
    // Calculate actual XP to award with progressive scaling
    const xpGained = this.calculateXPGain(baseXpAmount, currentLevel, bonusMultipliers)
    const newTotalXp = currentTotalXp + xpGained

    // Determine new level
    let newLevel = currentLevel
    while (newTotalXp >= this.calculateTotalXPForLevel(newLevel + 1)) {
      newLevel++
    }

    const levelUp = newLevel > currentLevel
    const xpToNextLevel = this.calculateTotalXPForLevel(newLevel + 1) - newTotalXp

    // Update database
    const { error: updateError } = await supabaseClient
      .from('user_progress')
      .update({
        total_xp: newTotalXp,
        current_level: newLevel,
        xp_to_next_level: Math.max(0, xpToNextLevel)
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    console.log(`🎮 XP Awarded: +${xpGained} XP, Level ${currentLevel} → ${newLevel}, Total: ${newTotalXp}`)

    return {
      xpGained,
      levelUp,
      newLevel,
      newTotalXp
    }
  },

  calculateXPForLevel(level: number): number {
    if (level <= 1) return 0
    
    // Progressive scaling: gets exponentially harder
    const baseXP = 100
    const scalingFactor = 1.8 // Increase difficulty curve
    
    return Math.floor(baseXP * Math.pow(level - 1, scalingFactor))
  },

  calculateTotalXPForLevel(targetLevel: number): number {
    let totalXP = 0
    for (let level = 2; level <= targetLevel; level++) {
      totalXP += this.calculateXPForLevel(level)
    }
    return totalXP
  },

  calculateXPGain(baseXP: number, currentLevel: number, bonusMultipliers: Record<string, number> = {}): number {
    // Base XP with level-based diminishing returns
    const levelPenalty = Math.max(0.3, 1 - (currentLevel - 1) * 0.05) // Min 30% XP at high levels
    let adjustedXP = Math.floor(baseXP * levelPenalty)
    
    // Apply bonus multipliers
    Object.values(bonusMultipliers).forEach(multiplier => {
      adjustedXP = Math.floor(adjustedXP * multiplier)
    })
    
    console.log(`🎮 XP Calculation: Base=${baseXP}, Level=${currentLevel}, Penalty=${levelPenalty.toFixed(2)}, Final=${adjustedXP}`)
    
    return Math.max(1, adjustedXP) // Minimum 1 XP per action
  },

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabaseClient
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) throw error

    return data.map(achievement => {
      const definition = ACHIEVEMENT_DEFINITIONS[achievement.achievement_type as keyof typeof ACHIEVEMENT_DEFINITIONS]
      return {
        type: achievement.achievement_type,
        data: achievement.achievement_data as Record<string, any>,
        earnedAt: achievement.earned_at!,
        isMilestone: achievement.is_milestone || false,
        title: definition?.title || achievement.achievement_type,
        description: definition?.description || '',
        emoji: definition?.emoji || '🏆'
      }
    })
  }
}

// =============================================================================
// SPACED REPETITION OPERATIONS
// =============================================================================

export const spacedRepetitionOperations = {
  async updateQuestionMemory(
    userId: string,
    questionId: string,
    isCorrect: boolean,
    responseTime?: number
  ): Promise<void> {
    let { data: memory, error } = await supabaseClient
      .from('user_question_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Create new memory record
      const easiness = 2.5
      const interval = isCorrect ? 1 : 0
      const nextReview = new Date()
      nextReview.setDate(nextReview.getDate() + interval)

      const { error: createError } = await supabaseClient
        .from('user_question_memory')
        .insert({
          user_id: userId,
          question_id: questionId,
          easiness_factor: easiness,
          repetition_count: 1,
          interval_days: interval,
          next_review_date: nextReview.toISOString().split('T')[0],
          last_reviewed_at: new Date().toISOString(),
          consecutive_correct: isCorrect ? 1 : 0,
          total_attempts: 1
        })

      if (createError) throw createError
    } else if (error) {
      throw error
    } else {
      // Update existing memory using SM-2 algorithm
      if (!memory) {
        throw new Error('Memory data is null')
      }
      
      const { newEasiness, newInterval, newRepetitions } = this.calculateSM2(
        memory.easiness_factor || 2.5,
        memory.repetition_count || 0,
        isCorrect,
        responseTime
      )

      const nextReview = new Date()
      nextReview.setDate(nextReview.getDate() + newInterval)

      const { error: updateError } = await supabaseClient
        .from('user_question_memory')
        .update({
          easiness_factor: newEasiness,
          repetition_count: newRepetitions,
          interval_days: newInterval,
          next_review_date: nextReview.toISOString().split('T')[0],
          last_reviewed_at: new Date().toISOString(),
          consecutive_correct: isCorrect ? (memory.consecutive_correct || 0) + 1 : 0,
          total_attempts: (memory.total_attempts || 0) + 1
        })
        .eq('id', memory.id)

      if (updateError) throw updateError
    }
  },

  calculateSM2(easiness: number, repetitions: number, isCorrect: boolean, responseTime?: number): {
    newEasiness: number
    newInterval: number
    newRepetitions: number
  } {
    let quality = isCorrect ? 4 : 2 // Basic quality score
    
    // Adjust quality based on response time if provided
    if (responseTime && isCorrect) {
      if (responseTime < 5000) quality = 5 // Very fast
      else if (responseTime < 10000) quality = 4 // Fast
      else if (responseTime < 20000) quality = 3 // Normal
    }

    let newEasiness = easiness
    let newRepetitions = repetitions
    let newInterval = 1

    if (quality >= 3) {
      if (repetitions === 0) {
        newInterval = 1
      } else if (repetitions === 1) {
        newInterval = 6
      } else {
        newInterval = Math.round(repetitions * easiness)
      }
      newRepetitions = repetitions + 1
    } else {
      newRepetitions = 0
      newInterval = 1
    }

    newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (newEasiness < 1.3) newEasiness = 1.3

    return { newEasiness, newInterval, newRepetitions }
  },

  async getQuestionsForReview(userId: string, limit: number = 20): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabaseClient
      .from('user_question_memory')
      .select(`
        *,
        questions(*)
      `)
      .eq('user_id', userId)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

// =============================================================================
// ENHANCED PROGRESS OPERATIONS
// =============================================================================

export const enhancedProgressOperations = {
  async getComprehensiveStats(userId: string): Promise<EnhancedUserProgress> {
    try {
      const { data, error } = await supabaseClient
        .from('user_comprehensive_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.warn('user_comprehensive_stats view not available, trying fallback:', error.message)
        
        // Fallback to basic progress if view doesn't exist or user not found
        try {
          const { data: basicProgress, error: basicError } = await supabaseClient
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (basicError) {
            console.warn('user_progress table not available, using defaults:', basicError.message)
            
            // Return complete default values if both tables fail
            return {
              currentStreak: 0,
              longestStreak: 0,
              totalQuizzesCompleted: 0,
              totalQuestionsAnswered: 0,
              totalCorrectAnswers: 0,
              totalXp: 0,
              currentLevel: 1,
              xpToNextLevel: 100,
              weeklyGoal: 3,
              weeklyCompleted: 0,
              weekStartDate: undefined,
              preferredCategories: [],
              adaptiveDifficulty: true,
              learningStyle: 'mixed',
              accuracyPercentage: 0,
              categoriesMastered: 0,
              categoriesAttempted: 0,
              activeGoals: 0,
              customDecksCount: 0,
              achievementsThisWeek: 0,
              availableXpForBoosts: 0,
              totalBoostsPurchased: 0,
              activeBoosts: []
            }
          }

          return {
            currentStreak: basicProgress?.current_streak || 0,
            longestStreak: basicProgress?.longest_streak || 0,
            totalQuizzesCompleted: basicProgress?.total_quizzes_completed || 0,
            totalQuestionsAnswered: basicProgress?.total_questions_answered || 0,
            totalCorrectAnswers: basicProgress?.total_correct_answers || 0,
            totalXp: basicProgress?.total_xp || 0,
            currentLevel: basicProgress?.current_level || 1,
            xpToNextLevel: basicProgress?.xp_to_next_level || 100,
            weeklyGoal: basicProgress?.weekly_goal || 3,
            weeklyCompleted: basicProgress?.weekly_completed || 0,
            weekStartDate: basicProgress?.week_start_date || undefined,
            preferredCategories: (basicProgress?.preferred_categories as string[]) || [],
            adaptiveDifficulty: basicProgress?.adaptive_difficulty || true,
            learningStyle: (basicProgress?.learning_style as EnhancedUserProgress['learningStyle']) || 'mixed',
            accuracyPercentage: 0,
            categoriesMastered: 0,
            categoriesAttempted: 0,
            activeGoals: 0,
            customDecksCount: 0,
            achievementsThisWeek: 0,
            availableXpForBoosts: 0,
            totalBoostsPurchased: 0,
            activeBoosts: []
          }
        } catch (fallbackError) {
          console.warn('All database queries failed, using complete defaults:', fallbackError)
          
          // Return complete default values if all database access fails
          return {
            currentStreak: 0,
            longestStreak: 0,
            totalQuizzesCompleted: 0,
            totalQuestionsAnswered: 0,
            totalCorrectAnswers: 0,
            totalXp: 0,
            currentLevel: 1,
            xpToNextLevel: 100,
            weeklyGoal: 3,
            weeklyCompleted: 0,
            weekStartDate: undefined,
            preferredCategories: [],
            adaptiveDifficulty: true,
            learningStyle: 'mixed',
            accuracyPercentage: 0,
            categoriesMastered: 0,
            categoriesAttempted: 0,
            activeGoals: 0,
            customDecksCount: 0,
            achievementsThisWeek: 0,
            availableXpForBoosts: 0,
            totalBoostsPurchased: 0,
            activeBoosts: []
          }
        }
      }

      return {
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        totalQuizzesCompleted: data.total_quizzes_completed || 0,
        totalQuestionsAnswered: data.total_questions_answered || 0,
        totalCorrectAnswers: data.total_correct_answers || 0,
        totalXp: data.total_xp || 0,
        currentLevel: data.current_level || 1,
        xpToNextLevel: 100, // Default value since property doesn't exist
        weeklyGoal: data.weekly_goal || 3,
        weeklyCompleted: data.weekly_completed || 0,
        weekStartDate: undefined, // Property doesn't exist in database
        preferredCategories: (data.preferred_categories as string[]) || [],
        adaptiveDifficulty: true, // Default value since property doesn't exist
        learningStyle: 'mixed' as EnhancedUserProgress['learningStyle'], // Default value
        accuracyPercentage: data.accuracy_percentage || 0,
        categoriesMastered: data.categories_mastered || 0,
        categoriesAttempted: data.categories_attempted || 0,
        activeGoals: data.active_goals || 0,
        customDecksCount: data.custom_decks_count || 0,
        achievementsThisWeek: data.achievements_this_week || 0,
        availableXpForBoosts: 0, // Default value since property doesn't exist
        totalBoostsPurchased: 0, // Default value since property doesn't exist
        activeBoosts: [] // Default value since property doesn't exist
      }
    } catch (error) {
      console.warn('Error getting comprehensive stats, using defaults:', error)
      
      // Return complete default values if any error occurs
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalQuizzesCompleted: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        weeklyGoal: 3,
        weeklyCompleted: 0,
        weekStartDate: undefined,
        preferredCategories: [],
        adaptiveDifficulty: true,
        learningStyle: 'mixed',
        accuracyPercentage: 0,
        categoriesMastered: 0,
        categoriesAttempted: 0,
        activeGoals: 0,
        customDecksCount: 0,
        achievementsThisWeek: 0,
        availableXpForBoosts: 0,
        totalBoostsPurchased: 0,
        activeBoosts: []
      }
    }
  },

  async updateWeeklyProgress(userId: string): Promise<void> {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    startOfWeek.setHours(0, 0, 0, 0)

    const { data: progress } = await supabaseClient
      .from('user_progress')
      .select('week_start_date, weekly_completed, weekly_goal')
      .eq('user_id', userId)
      .single()

    const currentWeekStart = progress?.week_start_date ? new Date(progress.week_start_date) : null
    const isNewWeek = !currentWeekStart || currentWeekStart < startOfWeek

    if (isNewWeek) {
      // Reset weekly progress
      await supabaseClient
        .from('user_progress')
        .update({
          week_start_date: startOfWeek.toISOString().split('T')[0],
          weekly_completed: 1
        })
        .eq('user_id', userId)
    } else {
      // Increment weekly progress
      await supabaseClient
        .from('user_progress')
        .update({
          weekly_completed: (progress?.weekly_completed || 0) + 1
        })
        .eq('user_id', userId)
    }

    // Check for weekly goal achievement
    const newCompleted = isNewWeek ? 1 : (progress?.weekly_completed || 0) + 1
    if (newCompleted >= (progress?.weekly_goal || 3)) {
      await achievementOperations.checkAndAward(userId, 'weekly_goal_met', {
        week: startOfWeek.toISOString().split('T')[0],
        completed: newCompleted,
        goal: progress?.weekly_goal || 3
      })
    }
  },

  /**
   * Calculate XP required for a specific level
   */
  calculateXPForLevel(level: number): number {
    // Progressive XP formula: baseXP * (level^1.8)
    const baseXP = 100
    return Math.floor(baseXP * Math.pow(level, 1.8))
  },

  /**
   * Calculate total XP required to reach a specific level
   */
  calculateTotalXPForLevel(targetLevel: number): number {
    let totalXP = 0
    for (let level = 1; level < targetLevel; level++) {
      totalXP += this.calculateXPForLevel(level)
    }
    return totalXP
  },

  /**
   * Calculate XP gain with level scaling and bonuses
   */
  calculateXPGain(baseXP: number, currentLevel: number, bonusMultipliers: Record<string, number> = {}): number {
    // Apply level-based diminishing returns (minimum 30% retention)
    const levelPenalty = Math.max(0.3, 1 - (currentLevel - 1) * 0.05)
    let adjustedXP = Math.floor(baseXP * levelPenalty)

    // Apply bonus multipliers
    Object.values(bonusMultipliers).forEach(multiplier => {
      adjustedXP = Math.floor(adjustedXP * multiplier)
    })

    return Math.max(1, adjustedXP) // Minimum 1 XP
  },

  /**
   * Calculate XP with anti-farming measures
   * Uses existing user_quiz_attempts table to track topic completion history
   */
  async calculateXPWithDiminishingReturns(
    userId: string, 
    topicId: string, 
    baseXpAmount: number, 
    bonusMultipliers: Record<string, number> = {}
  ): Promise<{
    xpGained: number
    completionCount: number
    xpMultiplier: number
    reason: string
  }> {
    // Get completion history for this topic
    const { data: completionHistory, error } = await supabaseClient
      .from('user_quiz_attempts')
      .select('id, score, completed_at, correct_answers, total_questions')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })

    if (error) throw error

    const completionCount = completionHistory?.length || 0
    
    // Calculate XP multiplier based on completion history
    let xpMultiplier = 1.0
    let reason = "First completion - full XP!"

    if (completionCount === 0) {
      // First time - full XP
      xpMultiplier = 1.0
      reason = "First completion - full XP!"
    } else if (completionCount === 1) {
      // Second time - 70% XP (learning/improvement)
      xpMultiplier = 0.7
      reason = "Second attempt - 70% XP for improvement"
    } else if (completionCount === 2) {
      // Third time - 40% XP (review/practice)
      xpMultiplier = 0.4
      reason = "Third attempt - 40% XP for practice"
    } else if (completionCount <= 5) {
      // 4th-6th time - 20% XP (spaced repetition benefit)
      xpMultiplier = 0.2
      reason = "Review attempt - 20% XP for reinforcement"
    } else {
      // More than 6 times - minimal XP (prevent farming but still encourage practice)
      xpMultiplier = 0.05
      reason = "Repeated practice - minimal XP awarded"
    }

    // Check for time-based bonus (if it's been a while since last attempt)
    if (completionCount > 0 && completionHistory?.[0]?.completed_at) {
      const lastCompletionDate = new Date(completionHistory[0].completed_at)
      const daysSinceLastCompletion = Math.floor(
        (Date.now() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Bonus for returning after time gap (spaced learning)
      if (daysSinceLastCompletion >= 30) {
        xpMultiplier = Math.min(xpMultiplier * 1.5, 1.0) // Max 1.0
        reason += " + spacing bonus"
      } else if (daysSinceLastCompletion >= 7) {
        xpMultiplier = Math.min(xpMultiplier * 1.2, 0.8) // Max 0.8
        reason += " + weekly review bonus"
      }
    }

    // Get current level for progressive scaling
    const { data: progress } = await supabaseClient
      .from('user_progress')
      .select('current_level')
      .eq('user_id', userId)
      .single()

    const currentLevel = progress?.current_level || 1
    
    // Apply all multipliers: anti-farming, bonuses, and level scaling
    const levelScaledXP = enhancedProgressOperations.calculateXPGain(baseXpAmount, currentLevel, bonusMultipliers)
    const finalXP = Math.floor(levelScaledXP * xpMultiplier)

    console.log(`🛡️ Anti-Farm XP: Topic=${topicId}, Completions=${completionCount}, Multiplier=${xpMultiplier.toFixed(2)}, Final=${finalXP}`)

    return {
      xpGained: Math.max(1, finalXP), // Minimum 1 XP
      completionCount,
      xpMultiplier,
      reason
    }
  },

  /**
   * Enhanced XP awarding with anti-farming and improvement tracking
   */
  async awardXPWithAntifarming(
    userId: string, 
    topicId: string, 
    baseXpAmount: number, 
    currentQuizScore: number,
    bonusMultipliers: Record<string, number> = {}
  ): Promise<{
    xpGained: number
    levelUp: boolean
    newLevel: number
    newTotalXp: number
    completionCount: number
    xpMultiplier: number
    reason: string
    improvementBonus?: number
  }> {
    // Calculate base XP with diminishing returns
    const antiFarmResult = await this.calculateXPWithDiminishingReturns(
      userId, 
      topicId, 
      baseXpAmount, 
      bonusMultipliers
    )

    let finalXP = antiFarmResult.xpGained
    let finalReason = antiFarmResult.reason
    let improvementBonus = 0

    // Check for improvement bonus if this isn't the first attempt
    if (antiFarmResult.completionCount > 0) {
      const { data: previousAttempts } = await supabaseClient
        .from('user_quiz_attempts')
        .select('score')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (previousAttempts?.length) {
        const bestPreviousScore = Math.max(...previousAttempts.map(a => a.score || 0))
        
        if (currentQuizScore > bestPreviousScore) {
          // Improvement bonus: 25% of original XP (encourages genuine improvement)
          improvementBonus = Math.floor(baseXpAmount * 0.25)
          finalXP += improvementBonus
          finalReason += ` + improvement bonus (+${improvementBonus} XP)`
        }
      }
    }

    // Apply the XP to user's progress
    const { data: progress, error: getError } = await supabaseClient
      .from('user_progress')
      .select('total_xp, current_level')
      .eq('user_id', userId)
      .single()

    if (getError) throw getError

    const currentLevel = progress?.current_level || 1
    const currentTotalXp = progress?.total_xp || 0
    const newTotalXp = currentTotalXp + finalXP

    // Determine new level
    let newLevel = currentLevel
    while (newTotalXp >= this.calculateTotalXPForLevel(newLevel + 1)) {
      newLevel++
    }

    const levelUp = newLevel > currentLevel
    const xpToNextLevel = this.calculateTotalXPForLevel(newLevel + 1) - newTotalXp

    // Update database
    const { error: updateError } = await supabaseClient
      .from('user_progress')
      .update({
        total_xp: newTotalXp,
        current_level: newLevel,
        xp_to_next_level: Math.max(0, xpToNextLevel)
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    console.log(`🎮 Final XP Award: +${finalXP} XP (${finalReason}), Level ${currentLevel} → ${newLevel}`)

    return {
      xpGained: finalXP,
      levelUp,
      newLevel,
      newTotalXp,
      completionCount: antiFarmResult.completionCount,
      xpMultiplier: antiFarmResult.xpMultiplier,
      reason: finalReason,         
      improvementBonus: improvementBonus > 0 ? improvementBonus : undefined
    }
  }
}

// Main enhanced progress update function that coordinates all systems
export async function updateEnhancedProgress(
  userId: string,
  quizData: {
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
): Promise<{
  newAchievements: Achievement[]
  levelUp: boolean
  skillUpdates: CategorySkill[]
}> {
  const results = {
    newAchievements: [] as Achievement[],
    levelUp: false,
    skillUpdates: [] as CategorySkill[]
  }

  try {
    // IMPORTANT: We now track EVERYTHING for EVERYONE, regardless of subscription tier
    // This creates better marketing opportunities and prevents data loss
    
    // 1. Update basic progress (existing system)
    try {
      const { userProgressOperations } = await import('./database')
      await userProgressOperations.updateAfterQuiz(userId, quizData.correctAnswers, quizData.totalQuestions)
    } catch (error) {
      console.error('Error updating basic progress:', error)
      // Continue despite error
    }

    // 2. Update weekly progress - TRACK FOR EVERYONE
    try {
      await enhancedProgressOperations.updateWeeklyProgress(userId)
    } catch (error) {
      console.error('Error updating weekly progress:', error)
      // Continue despite error
    }

    // 3. ALWAYS save detailed analytics to user_quiz_analytics table
    try {
      await saveDetailedQuizAnalytics(userId, quizData)
    } catch (error) {
      console.error('Error saving detailed quiz analytics:', error)
      // Continue despite error
    }

    // 4. ALWAYS save progress history snapshot
    try {
      await saveProgressHistorySnapshot(userId, 'daily')
    } catch (error) {
      console.error('Error saving progress history snapshot:', error)
      // Continue despite error
    }

    // 5. Get comprehensive stats for achievement checking
    let beforeStats: EnhancedUserProgress;
    let afterStats: EnhancedUserProgress;
    let xpResult: {
      xpGained: number
      levelUp: boolean
      newLevel: number
      newTotalXp: number
      completionCount: number
      xpMultiplier: number
      reason: string
      improvementBonus?: number
    };
    
    try {
      beforeStats = await enhancedProgressOperations.getComprehensiveStats(userId)
      
      // Award XP based on quiz performance - 10 XP per correct answer
      const baseXpAmount = quizData.correctAnswers * 10
      const scorePercentage = (quizData.correctAnswers / quizData.totalQuestions) * 100
      xpResult = await enhancedProgressOperations.awardXPWithAntifarming(
        userId,
        quizData.topicId,
        baseXpAmount,
        scorePercentage
      )
      console.log(`🎮 XP Awarded: +${xpResult.xpGained} XP (${xpResult.reason})`)
      
      // Get updated stats after XP award
      afterStats = await enhancedProgressOperations.getComprehensiveStats(userId)
      
      // Set level up flag for result
      results.levelUp = xpResult.levelUp
    } catch (error) {
      console.error('Error processing XP and stats:', error)
      // Use fallback values if stats can't be fetched
      beforeStats = {
        currentStreak: 0,
        longestStreak: 0,
        totalQuizzesCompleted: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        weeklyGoal: 3,
        weeklyCompleted: 0,
        preferredCategories: [],
        adaptiveDifficulty: true,
        learningStyle: 'mixed',
        accuracyPercentage: 0,
        categoriesMastered: 0,
        categoriesAttempted: 0,
        activeGoals: 0,
        customDecksCount: 0,
        achievementsThisWeek: 0,
        availableXpForBoosts: 0,
        totalBoostsPurchased: 0,
        activeBoosts: []
      }
      afterStats = { ...beforeStats }
      xpResult = {
        xpGained: 0,
        levelUp: false,
        newLevel: 1,
        newTotalXp: 0,
        completionCount: 0,
        xpMultiplier: 1,
        reason: "Error calculating XP"
      }
    }

    // 6. Check for achievements based on quiz completion
    try {
      const isFirstQuiz = beforeStats.totalQuizzesCompleted === 0
      const isPerfectScore = quizData.correctAnswers === quizData.totalQuestions
      const isFastCompletion = quizData.timeSpentSeconds < 180 // 3 minutes
      const isVeryFastCompletion = quizData.timeSpentSeconds < 120 // 2 minutes
      const accuracyPercentage = (quizData.correctAnswers / quizData.totalQuestions) * 100
      
      // First quiz achievements
      if (isFirstQuiz) {
        try {
          const achievement = await achievementOperations.checkAndAward(userId, 'first_quiz')
          if (achievement) results.newAchievements.push(achievement)
          
          if (isPerfectScore) {
            const perfectAchievement = await achievementOperations.checkAndAward(userId, 'first_perfect')
            if (perfectAchievement) results.newAchievements.push(perfectAchievement)
          }
        } catch (error) {
          console.error('Error processing first quiz achievements:', error)
        }
      }

      // Quiz completion milestones
      try {
        const totalCompleted = afterStats.totalQuizzesCompleted
        const milestones = [5, 10, 25, 50, 100, 250]
        for (const milestone of milestones) {
          if (totalCompleted === milestone) {
            const achievement = await achievementOperations.checkAndAward(userId, `quizzes_${milestone}`)
            if (achievement) results.newAchievements.push(achievement)
          }
        }
      } catch (error) {
        console.error('Error processing quiz milestone achievements:', error)
      }

      // Streak achievements
      try {
        const currentStreak = afterStats.currentStreak
        const streakMilestones = [3, 7, 14, 30, 100]
        for (const milestone of streakMilestones) {
          if (currentStreak === milestone) {
            const achievement = await achievementOperations.checkAndAward(userId, `streak_${milestone}`)
            if (achievement) results.newAchievements.push(achievement)
          }
        }
      } catch (error) {
        console.error('Error processing streak achievements:', error)
      }

      // Performance achievements
      try {
        if (isPerfectScore) {
          const achievement = await achievementOperations.checkAndAward(userId, 'perfect_quiz')
          if (achievement) results.newAchievements.push(achievement)
        }
      } catch (error) {
        console.error('Error processing performance achievements:', error)
      }

      // Speed achievements
      try {
        if (isFastCompletion) {
          const achievement = await achievementOperations.checkAndAward(userId, 'speed_demon')
          if (achievement) results.newAchievements.push(achievement)
        }
        
        if (isVeryFastCompletion) {
          const achievement = await achievementOperations.checkAndAward(userId, 'lightning_fast')
          if (achievement) results.newAchievements.push(achievement)
        }
        
        if (isFastCompletion && isPerfectScore) {
          const achievement = await achievementOperations.checkAndAward(userId, 'speed_and_accuracy')
          if (achievement) results.newAchievements.push(achievement)
        }
      } catch (error) {
        console.error('Error processing speed achievements:', error)
      }

      // Time-based achievements
      try {
        const now = new Date()
        const hour = now.getHours()
        const isWeekend = now.getDay() === 0 || now.getDay() === 6
        
        if (hour < 8) {
          const achievement = await achievementOperations.checkAndAward(userId, 'early_bird')
          if (achievement) results.newAchievements.push(achievement)
        }
        
        if (hour >= 22) {
          const achievement = await achievementOperations.checkAndAward(userId, 'night_owl')
          if (achievement) results.newAchievements.push(achievement)
        }
      } catch (error) {
        console.error('Error processing time-based achievements:', error)
      }

      // Special date achievements
      try {
        const now = new Date()
        const month = now.getMonth() + 1
        const day = now.getDate()
        
        if (month === 7 && day === 4) {
          const achievement = await achievementOperations.checkAndAward(userId, 'independence_day')
          if (achievement) results.newAchievements.push(achievement)
        }
        
        if (month === 9 && day === 17) { // Constitution Day
          const hasConstitutionalCategory = quizData.questionResponses.some(q => 
            q.category.toLowerCase().includes('constitutional') || 
            q.category.toLowerCase().includes('constitution')
          )
          if (hasConstitutionalCategory) {
            const achievement = await achievementOperations.checkAndAward(userId, 'constitution_day')
            if (achievement) results.newAchievements.push(achievement)
          }
        }
      } catch (error) {
        console.error('Error processing date-based achievements:', error)
      }

      // Level-based achievements
      try {
        const currentLevel = afterStats.currentLevel
        const levelMilestones = [5, 10, 20, 50]
        for (const milestone of levelMilestones) {
          if (currentLevel === milestone) {
            const achievement = await achievementOperations.checkAndAward(userId, `level_${milestone}`)
            if (achievement) results.newAchievements.push(achievement)
          }
        }
      } catch (error) {
        console.error('Error processing level-based achievements:', error)
      }
    } catch (error) {
      console.error('Error processing achievements:', error)
    }

    // 7. ALWAYS update category skills and spaced repetition - track for everyone
    try {
      const categoryUpdates = new Map<string, { correct: number; total: number }>()
      const categoriesInQuiz = new Set<string>()
      
      // Process each question response
      for (const response of quizData.questionResponses) {
        categoriesInQuiz.add(response.category)
        
        // ALWAYS update spaced repetition for everyone
        try {
          await spacedRepetitionOperations.updateQuestionMemory(
            userId,
            response.questionId,
            response.isCorrect,
            response.timeSpent * 1000 // Convert to milliseconds
          )
        } catch (error) {
          console.error(`Error updating question memory for question ${response.questionId}:`, error)
        }

        // Aggregate category performance
        const current = categoryUpdates.get(response.category) || { correct: 0, total: 0 }
        categoryUpdates.set(response.category, {
          correct: current.correct + (response.isCorrect ? 1 : 0),
          total: current.total + 1
        })
      }

      // ALWAYS update skills for each category - track for everyone
      for (const [category, stats] of categoryUpdates) {
        try {
          const isCorrect = stats.correct > stats.total / 2 // Majority correct
          const skillUpdate = await skillTrackingOperations.updateCategorySkill(
            userId,
            category,
            isCorrect
          )
          results.skillUpdates.push(skillUpdate)
          
          // Check for category mastery achievements
          const masteryAchievements = {
            'novice': 'category_novice',
            'intermediate': 'category_intermediate', 
            'advanced': 'category_advanced',
            'expert': 'category_master'
          }
          
          const achievementType = masteryAchievements[skillUpdate.masteryLevel as keyof typeof masteryAchievements]
          if (achievementType) {
            try {
              const achievement = await achievementOperations.checkAndAward(userId, achievementType, { category })
              if (achievement) results.newAchievements.push(achievement)
            } catch (error) {
              console.error(`Error awarding mastery achievement for ${category}:`, error)
            }
          }
        } catch (error) {
          console.error(`Error updating skill for category ${category}:`, error)
        }
      }
    } catch (error) {
      console.error('Error updating category skills:', error)
    }

    // 8. ALWAYS generate learning insights for everyone
    try {
      await generateLearningInsights(userId, quizData, afterStats)
    } catch (error) {
      console.error('Error generating learning insights:', error)
    }

    // Check for exploration achievements
    try {
      const allSkills = await skillTrackingOperations.getCategorySkills(userId)
      const categoriesAttempted = allSkills.length
      const expertCategories = allSkills.filter(skill => skill.masteryLevel === 'expert').length
      
      if (categoriesAttempted === 5) {
        const achievement = await achievementOperations.checkAndAward(userId, 'category_sampler')
        if (achievement) results.newAchievements.push(achievement)
      }
      
      if (expertCategories === 3) {
        const achievement = await achievementOperations.checkAndAward(userId, 'multi_category_master')
        if (achievement) results.newAchievements.push(achievement)
      }
    } catch (error) {
      console.error('Error processing exploration achievements:', error)
    }

    return results

  } catch (error) {
    console.error('Error updating enhanced progress:', error)
    return results
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR UNIVERSAL TRACKING
// =============================================================================

/**
 * Save detailed quiz analytics for ALL users (not just premium)
 * This data will be gated by visibility, not collection
 */
async function saveDetailedQuizAnalytics(
  userId: string,
  quizData: {
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
): Promise<void> {
  try {
    // Calculate detailed analytics
    const timeDistribution = quizData.questionResponses.map(q => q.timeSpent)
    const averageTime = timeDistribution.reduce((a, b) => a + b, 0) / timeDistribution.length
    const fastestTime = Math.min(...timeDistribution)
    const slowestTime = Math.max(...timeDistribution)
    
    // Category performance breakdown
    const categoryPerformance: Record<string, { correct: number; total: number; avgTime: number }> = {}
    quizData.questionResponses.forEach(response => {
      if (!categoryPerformance[response.category]) {
        categoryPerformance[response.category] = { correct: 0, total: 0, avgTime: 0 }
      }
      categoryPerformance[response.category].total++
      if (response.isCorrect) {
        categoryPerformance[response.category].correct++
      }
      categoryPerformance[response.category].avgTime += response.timeSpent
    })
    
    // Calculate averages
    Object.keys(categoryPerformance).forEach(category => {
      const perf = categoryPerformance[category]
      perf.avgTime = perf.avgTime / perf.total
    })

    // Determine optimal study time based on current hour
    const hour = new Date().getHours()
    let optimalStudyTime = 'afternoon'
    if (hour < 12) optimalStudyTime = 'morning'
    else if (hour < 17) optimalStudyTime = 'afternoon'
    else if (hour < 21) optimalStudyTime = 'evening'
    else optimalStudyTime = 'night'

    // Save to database
    try {
      const { error } = await supabaseClient
        .from('user_quiz_analytics')
        .insert({
          user_id: userId,
          topic_id: quizData.topicId,
          total_time_seconds: quizData.timeSpentSeconds,
          average_time_per_question: averageTime,
          fastest_question_time: fastestTime,
          slowest_question_time: slowestTime,
          time_distribution: timeDistribution,
          category_performance: categoryPerformance,
          optimal_study_time: optimalStudyTime,
          completion_rate: 1.0, // They completed the quiz
          consistency_score: calculateConsistencyScore(timeDistribution),
          improvement_trend: 0.0 // Would need historical data to calculate
        })

      if (error) {
        console.error('Error saving quiz analytics:', error.message, error.details, error.hint)
      }
    } catch (dbError) {
      console.error('Database error in saveDetailedQuizAnalytics:', dbError)
      // Continue execution despite database errors
    }
  } catch (error) {
    console.error('Error in saveDetailedQuizAnalytics:', error)
    // Function will continue and return normally despite errors
  }
}

/**
 * Save progress history snapshot for ALL users
 */
async function saveProgressHistorySnapshot(userId: string, snapshotType: 'daily' | 'weekly' | 'monthly'): Promise<void> {
  try {
    let stats: EnhancedUserProgress;
    
    try {
      stats = await enhancedProgressOperations.getComprehensiveStats(userId)
    } catch (statsError) {
      console.error('Error fetching user stats for progress snapshot:', statsError)
      // Use default values if stats can't be fetched
      stats = {
        currentStreak: 0,
        longestStreak: 0,
        totalQuizzesCompleted: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        weeklyGoal: 3,
        weeklyCompleted: 0,
        preferredCategories: [],
        adaptiveDifficulty: true,
        learningStyle: 'mixed',
        accuracyPercentage: 0,
        categoriesMastered: 0,
        categoriesAttempted: 0,
        activeGoals: 0,
        customDecksCount: 0,
        achievementsThisWeek: 0,
        availableXpForBoosts: 0,
        totalBoostsPurchased: 0,
        activeBoosts: []
      }
    }
    
    const today = new Date().toISOString().split('T')[0]

    // Check if we already have a snapshot for today
    try {
      const { data: existing, error: selectError } = await supabaseClient
        .from('user_progress_history')
        .select('id')
        .eq('user_id', userId)
        .eq('snapshot_date', today)
        .eq('snapshot_type', snapshotType)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        // Log error but continue (PGRST116 is "no rows returned" which is expected)
        console.error('Error checking for existing progress snapshot:', selectError.message, selectError.details)
      }

      if (existing) {
        // Update existing snapshot
        const { error: updateError } = await supabaseClient
          .from('user_progress_history')
          .update({
            total_quizzes_completed: stats.totalQuizzesCompleted,
            total_questions_answered: stats.totalQuestionsAnswered,
            total_correct_answers: stats.totalCorrectAnswers,
            current_streak: stats.currentStreak,
            longest_streak: stats.longestStreak,
            total_xp: stats.totalXp,
            current_level: stats.currentLevel,
            accuracy_percentage: stats.accuracyPercentage
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating progress history:', updateError.message, updateError.details, updateError.hint)
        }
      } else {
        // Create new snapshot
        const { error: insertError } = await supabaseClient
          .from('user_progress_history')
          .insert({
            user_id: userId,
            snapshot_date: today,
            snapshot_type: snapshotType,
            total_quizzes_completed: stats.totalQuizzesCompleted,
            total_questions_answered: stats.totalQuestionsAnswered,
            total_correct_answers: stats.totalCorrectAnswers,
            current_streak: stats.currentStreak,
            longest_streak: stats.longestStreak,
            total_xp: stats.totalXp,
            current_level: stats.currentLevel,
            accuracy_percentage: stats.accuracyPercentage
          })

        if (insertError) {
          console.error('Error creating progress history:', insertError.message, insertError.details, insertError.hint)
        }
      }
    } catch (dbError) {
      console.error('Database error in saveProgressHistorySnapshot:', dbError)
      // Continue execution despite database errors
    }
  } catch (error) {
    console.error('Error in saveProgressHistorySnapshot:', error)
    // Function will continue and return normally despite errors
  }
}

/**
 * Generate learning insights for ALL users
 */
async function generateLearningInsights(
  userId: string,
  quizData: {
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
  },
  userStats: EnhancedUserProgress
): Promise<void> {
  try {
    const insights: Array<{
      type: string
      category?: string
      title: string
      description: string
      actionItems: string[]
      confidence: number
      priority: number
    }> = []

    // Performance insights
    const accuracy = (quizData.correctAnswers / quizData.totalQuestions) * 100
    if (accuracy >= 90) {
      insights.push({
        type: 'strength',
        title: 'Excellent Performance!',
        description: `You scored ${accuracy.toFixed(0)}% on this quiz, showing strong understanding of the material.`,
        actionItems: ['Try a more challenging topic', 'Help others by sharing your knowledge'],
        confidence: 0.9,
        priority: 2
      })
    } else if (accuracy < 60) {
      insights.push({
        type: 'weakness',
        title: 'Room for Improvement',
        description: `Your ${accuracy.toFixed(0)}% score suggests this topic needs more practice.`,
        actionItems: ['Review the explanations for missed questions', 'Try this topic again tomorrow', 'Focus on understanding concepts rather than memorizing'],
        confidence: 0.8,
        priority: 4
      })
    }

    // Speed insights
    const avgTimePerQuestion = quizData.timeSpentSeconds / quizData.totalQuestions
    if (avgTimePerQuestion < 30) {
      insights.push({
        type: 'recommendation',
        title: 'Speed Reader',
        description: 'You complete questions quickly. Consider slowing down to improve accuracy.',
        actionItems: ['Take time to read questions carefully', 'Double-check your answers'],
        confidence: 0.7,
        priority: 3
      })
    } else if (avgTimePerQuestion > 90) {
      insights.push({
        type: 'recommendation',
        title: 'Thoughtful Approach',
        description: 'You take time to consider each question carefully, which often leads to better accuracy.',
        actionItems: ['Continue your thoughtful approach', 'Practice with timed quizzes occasionally'],
        confidence: 0.8,
        priority: 2
      })
    }

    // Category-specific insights
    const categoryPerformance = new Map<string, { correct: number; total: number }>()
    quizData.questionResponses.forEach(response => {
      const current = categoryPerformance.get(response.category) || { correct: 0, total: 0 }
      categoryPerformance.set(response.category, {
        correct: current.correct + (response.isCorrect ? 1 : 0),
        total: current.total + 1
      })
    })

    categoryPerformance.forEach((performance, category) => {
      const categoryAccuracy = (performance.correct / performance.total) * 100
      if (categoryAccuracy >= 80) {
        insights.push({
          type: 'strength',
          category,
          title: `Strong in ${category}`,
          description: `You excel in ${category} with ${categoryAccuracy.toFixed(0)}% accuracy.`,
          actionItems: [`Explore advanced ${category} topics`, 'Consider teaching others this subject'],
          confidence: 0.85,
          priority: 2
        })
      } else if (categoryAccuracy < 50) {
        insights.push({
          type: 'weakness',
          category,
          title: `Focus on ${category}`,
          description: `${category} appears to be challenging for you (${categoryAccuracy.toFixed(0)}% accuracy).`,
          actionItems: [`Study ${category} fundamentals`, `Practice more ${category} questions`, 'Seek additional resources'],
          confidence: 0.9,
          priority: 5
        })
      }
    })

    // Save insights to database
    for (const insight of insights) {
      const { error } = await supabaseClient
        .from('user_learning_insights')
        .insert({
          user_id: userId,
          insight_type: insight.type,
          insight_category: insight.category,
          title: insight.title,
          description: insight.description,
          action_items: insight.actionItems,
          confidence_score: insight.confidence,
          priority_level: insight.priority,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days
        })

      if (error) {
        console.error('Error saving learning insight:', error)
      }
    }
  } catch (error) {
    console.error('Error in generateLearningInsights:', error)
  }
}

/**
 * Calculate consistency score based on time distribution
 */
function calculateConsistencyScore(timeDistribution: number[]): number {
  if (timeDistribution.length < 2) return 1.0
  
  const mean = timeDistribution.reduce((a, b) => a + b, 0) / timeDistribution.length
  const variance = timeDistribution.reduce((acc, time) => acc + Math.pow(time - mean, 2), 0) / timeDistribution.length
  const standardDeviation = Math.sqrt(variance)
  
  // Lower standard deviation = higher consistency
  // Normalize to 0-1 scale (assuming max reasonable std dev of 60 seconds)
  return Math.max(0, 1 - (standardDeviation / 60))
}

// Anti-farming XP functions to be added to enhancedProgressOperations object