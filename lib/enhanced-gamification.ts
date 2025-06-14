import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type {
  DbUserLearningGoal, DbUserLearningGoalInsert, DbUserLearningGoalUpdate,
  DbUserCustomDeck, DbUserCustomDeckInsert, DbUserCustomDeckUpdate,
  DbUserDeckContent, DbUserDeckContentInsert,
  DbUserCategorySkill, DbUserCategorySkillInsert, DbUserCategorySkillUpdate,
  DbUserAchievement, DbUserAchievementInsert,
  DbUserStreakHistory, DbUserStreakHistoryInsert,
  DbUserQuestionMemory, DbUserQuestionMemoryInsert, DbUserQuestionMemoryUpdate
} from './database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
}

// Achievement definitions - Comprehensive learner achievement system
const ACHIEVEMENT_DEFINITIONS = {
  // First Steps & Onboarding
  first_quiz: {
    title: "First Steps",
    description: "Complete your first civic quiz",
    emoji: "🎯",
    xpReward: 50,
    category: "onboarding"
  },
  first_perfect: {
    title: "Flawless Debut",
    description: "Score 100% on your first quiz",
    emoji: "💯",
    xpReward: 100,
    category: "performance"
  },
  
  // Streak Achievements
  streak_3: {
    title: "Getting Started",
    description: "Maintain a 3-day learning streak",
    emoji: "🔥",
    xpReward: 100,
    category: "consistency"
  },
  streak_7: {
    title: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    emoji: "⚡",
    xpReward: 250,
    isMilestone: true,
    category: "consistency"
  },
  streak_14: {
    title: "Two Week Champion",
    description: "Maintain a 14-day learning streak",
    emoji: "🏃",
    xpReward: 500,
    isMilestone: true,
    category: "consistency"
  },
  streak_30: {
    title: "Month Master",
    description: "Maintain a 30-day learning streak",
    emoji: "🏆",
    xpReward: 1000,
    isMilestone: true,
    category: "consistency"
  },
  streak_100: {
    title: "Centurion",
    description: "Maintain a 100-day learning streak",
    emoji: "👑",
    xpReward: 5000,
    isMilestone: true,
    category: "consistency"
  },

  // Quiz Completion Milestones
  quizzes_5: {
    title: "Getting the Hang of It",
    description: "Complete 5 quizzes",
    emoji: "📝",
    xpReward: 150,
    category: "progress"
  },
  quizzes_10: {
    title: "Knowledge Seeker",
    description: "Complete 10 quizzes",
    emoji: "📚",
    xpReward: 300,
    category: "progress"
  },
  quizzes_25: {
    title: "Civic Enthusiast",
    description: "Complete 25 quizzes",
    emoji: "🎓",
    xpReward: 750,
    isMilestone: true,
    category: "progress"
  },
  quizzes_50: {
    title: "Civic Scholar",
    description: "Complete 50 quizzes",
    emoji: "🎖️",
    xpReward: 1500,
    isMilestone: true,
    category: "progress"
  },
  quizzes_100: {
    title: "Civic Expert",
    description: "Complete 100 quizzes",
    emoji: "🏅",
    xpReward: 3000,
    isMilestone: true,
    category: "progress"
  },
  quizzes_250: {
    title: "Civic Master",
    description: "Complete 250 quizzes",
    emoji: "👑",
    xpReward: 7500,
    isMilestone: true,
    category: "progress"
  },

  // Performance Achievements
  perfect_quiz: {
    title: "Perfect Score",
    description: "Score 100% on a quiz",
    emoji: "💯",
    xpReward: 150,
    category: "performance"
  },
  perfect_streak_3: {
    title: "Triple Perfect",
    description: "Score 100% on 3 consecutive quizzes",
    emoji: "🎯",
    xpReward: 500,
    isMilestone: true,
    category: "performance"
  },
  perfect_streak_5: {
    title: "Perfection Master",
    description: "Score 100% on 5 consecutive quizzes",
    emoji: "⭐",
    xpReward: 1000,
    isMilestone: true,
    category: "performance"
  },
  high_accuracy: {
    title: "Precision Expert",
    description: "Maintain 90%+ accuracy over 20 quizzes",
    emoji: "🎯",
    xpReward: 750,
    isMilestone: true,
    category: "performance"
  },

  // Speed Achievements
  speed_demon: {
    title: "Speed Demon",
    description: "Complete a quiz in under 3 minutes",
    emoji: "⚡",
    xpReward: 200,
    category: "speed"
  },
  lightning_fast: {
    title: "Lightning Fast",
    description: "Complete a quiz in under 2 minutes",
    emoji: "⚡",
    xpReward: 400,
    category: "speed"
  },
  speed_and_accuracy: {
    title: "Quick & Accurate",
    description: "Complete a quiz in under 3 minutes with 100% accuracy",
    emoji: "🚀",
    xpReward: 600,
    isMilestone: true,
    category: "speed"
  },

  // Category Mastery
  category_novice: {
    title: "Category Explorer",
    description: "Reach novice level in any category",
    emoji: "🌱",
    xpReward: 100,
    category: "mastery"
  },
  category_intermediate: {
    title: "Category Specialist",
    description: "Reach intermediate level in any category",
    emoji: "📈",
    xpReward: 300,
    category: "mastery"
  },
  category_advanced: {
    title: "Category Expert",
    description: "Reach advanced level in any category",
    emoji: "🎓",
    xpReward: 500,
    isMilestone: true,
    category: "mastery"
  },
  category_master: {
    title: "Subject Master",
    description: "Reach expert level in any category",
    emoji: "👨‍🎓",
    xpReward: 1000,
    isMilestone: true,
    category: "mastery"
  },
  multi_category_master: {
    title: "Renaissance Scholar",
    description: "Reach expert level in 3 different categories",
    emoji: "🌟",
    xpReward: 2500,
    isMilestone: true,
    category: "mastery"
  },

  // Exploration Achievements
  category_sampler: {
    title: "Curious Mind",
    description: "Try quizzes from 5 different categories",
    emoji: "🔍",
    xpReward: 200,
    category: "exploration"
  },
  well_rounded: {
    title: "Well-Rounded Citizen",
    description: "Complete quizzes in all available categories",
    emoji: "🌐",
    xpReward: 1000,
    isMilestone: true,
    category: "exploration"
  },
  difficulty_challenger: {
    title: "Challenge Seeker",
    description: "Complete quizzes at all difficulty levels",
    emoji: "⛰️",
    xpReward: 500,
    category: "exploration"
  },

  // Social & Engagement
  early_bird: {
    title: "Early Bird",
    description: "Complete a quiz before 8 AM",
    emoji: "🌅",
    xpReward: 100,
    category: "engagement"
  },
  night_owl: {
    title: "Night Owl",
    description: "Complete a quiz after 10 PM",
    emoji: "🦉",
    xpReward: 100,
    category: "engagement"
  },
  weekend_warrior: {
    title: "Weekend Warrior",
    description: "Complete 5 quizzes on weekends",
    emoji: "🏖️",
    xpReward: 300,
    category: "engagement"
  },
  comeback_kid: {
    title: "Comeback Kid",
    description: "Return to learning after a 7+ day break",
    emoji: "🔄",
    xpReward: 200,
    category: "engagement"
  },

  // Special Achievements
  constitution_day: {
    title: "Constitution Day Scholar",
    description: "Complete a Constitutional Law quiz on Constitution Day",
    emoji: "📜",
    xpReward: 500,
    isMilestone: true,
    category: "special"
  },
  election_day: {
    title: "Election Day Participant",
    description: "Complete an Elections quiz on Election Day",
    emoji: "🗳️",
    xpReward: 500,
    isMilestone: true,
    category: "special"
  },
  independence_day: {
    title: "Independence Day Patriot",
    description: "Complete any quiz on July 4th",
    emoji: "🎆",
    xpReward: 300,
    category: "special"
  },

  // Learning Behavior
  mistake_learner: {
    title: "Learning from Mistakes",
    description: "Improve your score by 20+ points on a retaken quiz",
    emoji: "📊",
    xpReward: 250,
    category: "learning"
  },
  persistent_learner: {
    title: "Never Give Up",
    description: "Retake the same quiz 3 times to improve",
    emoji: "💪",
    xpReward: 300,
    category: "learning"
  },
  knowledge_retention: {
    title: "Knowledge Keeper",
    description: "Maintain high performance on review quizzes",
    emoji: "🧠",
    xpReward: 400,
    category: "learning"
  },

  // Level-based Achievements
  level_5: {
    title: "Rising Star",
    description: "Reach level 5",
    emoji: "⭐",
    xpReward: 250,
    category: "levels"
  },
  level_10: {
    title: "Dedicated Learner",
    description: "Reach level 10",
    emoji: "🌟",
    xpReward: 500,
    isMilestone: true,
    category: "levels"
  },
  level_20: {
    title: "Civic Champion",
    description: "Reach level 20",
    emoji: "🏆",
    xpReward: 1000,
    isMilestone: true,
    category: "levels"
  },
  level_50: {
    title: "Legendary Scholar",
    description: "Reach level 50",
    emoji: "👑",
    xpReward: 5000,
    isMilestone: true,
    category: "levels"
  }
} as const

// =============================================================================
// LEARNING GOALS OPERATIONS
// =============================================================================

export const learningGoalOperations = {
  async create(userId: string, goal: Omit<LearningGoal, 'id'>): Promise<DbUserLearningGoal> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase
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
    const { error } = await supabase
      .from('user_deck_content')
      .delete()
      .eq('deck_id', deckId)
      .eq('id', contentId)

    if (error) throw error
  },

  async generateAdaptiveDeck(userId: string, preferences: CustomDeck['preferences']): Promise<any[]> {
    // Get user's skill levels and performance history
    const { data: skills } = await supabase
      .from('user_category_skills')
      .select('*')
      .eq('user_id', userId)

    const { data: questionMemory } = await supabase
      .from('user_question_memory')
      .select('*')
      .eq('user_id', userId)
      .lt('next_review_date', new Date().toISOString())

    // Complex algorithm to select optimal questions based on:
    // 1. Spaced repetition needs
    // 2. Skill level gaps
    // 3. User preferences
    // 4. Difficulty progression
    
    // This is a simplified version - real implementation would be more sophisticated
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        *,
        question_topics(*)
      `)
      .in('category', preferences.categories || [])
      .in('difficulty_level', preferences.difficultyLevels || [1, 2, 3, 4])
      .limit(preferences.maxQuestions || 20)

    if (error) throw error
    return questions || []
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
    let { data: skill, error } = await supabase
      .from('user_category_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single()

    if (error && error.code === 'PGRST116') {
      // Create new skill record
      const { data: newSkill, error: createError } = await supabase
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

      const { data: updatedSkill, error: updateError } = await supabase
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
    const { data, error } = await supabase
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
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_type', achievementType)
      .single()

    if (existing) return null // Already awarded

    const definition = ACHIEVEMENT_DEFINITIONS[achievementType as keyof typeof ACHIEVEMENT_DEFINITIONS]
    if (!definition) return null

    // Award the achievement
    const { data: achievement, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: achievementType,
        achievement_data: data,
        is_milestone: definition.isMilestone || false
      })
      .select()
      .single()

    if (error) throw error

    // Award XP
    await this.awardXP(userId, definition.xpReward)

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

  async awardXP(userId: string, xpAmount: number): Promise<void> {
    const { data: progress, error: getError } = await supabase
      .from('user_progress')
      .select('total_xp, current_level, xp_to_next_level')
      .eq('user_id', userId)
      .single()

    if (getError) throw getError

    const newTotalXp = (progress.total_xp || 0) + xpAmount
    let newLevel = progress.current_level || 1
    let xpToNext = progress.xp_to_next_level || 100

    // Level up logic
    while (newTotalXp >= xpToNext) {
      newLevel++
      xpToNext = this.calculateXPForLevel(newLevel + 1) - newTotalXp
    }

    const { error: updateError } = await supabase
      .from('user_progress')
      .update({
        total_xp: newTotalXp,
        current_level: newLevel,
        xp_to_next_level: xpToNext
      })
      .eq('user_id', userId)

    if (updateError) throw updateError
  },

  calculateXPForLevel(level: number): number {
    // XP required increases exponentially
    return Math.floor(100 * Math.pow(1.5, level - 1))
  },

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
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
    let { data: memory, error } = await supabase
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

      const { error: createError } = await supabase
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
      const { newEasiness, newInterval, newRepetitions } = this.calculateSM2(
        memory.easiness_factor || 2.5,
        memory.repetition_count || 0,
        isCorrect,
        responseTime
      )

      const nextReview = new Date()
      nextReview.setDate(nextReview.getDate() + newInterval)

      const { error: updateError } = await supabase
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
    
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('user_comprehensive_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Fallback to basic progress if view doesn't exist or user not found
      const { data: basicProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

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
        achievementsThisWeek: 0
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
      xpToNextLevel: data.xp_to_next_level || 100,
      weeklyGoal: data.weekly_goal || 3,
      weeklyCompleted: data.weekly_completed || 0,
      weekStartDate: data.week_start_date || undefined,
      preferredCategories: (data.preferred_categories as string[]) || [],
      adaptiveDifficulty: data.adaptive_difficulty || true,
      learningStyle: (data.learning_style as EnhancedUserProgress['learningStyle']) || 'mixed',
      accuracyPercentage: data.accuracy_percentage || 0,
      categoriesMastered: data.categories_mastered || 0,
      categoriesAttempted: data.categories_attempted || 0,
      activeGoals: data.active_goals || 0,
      customDecksCount: data.custom_decks_count || 0,
      achievementsThisWeek: data.achievements_this_week || 0
    }
  },

  async updateWeeklyProgress(userId: string): Promise<void> {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    startOfWeek.setHours(0, 0, 0, 0)

    const { data: progress } = await supabase
      .from('user_progress')
      .select('week_start_date, weekly_completed, weekly_goal')
      .eq('user_id', userId)
      .single()

    const currentWeekStart = progress?.week_start_date ? new Date(progress.week_start_date) : null
    const isNewWeek = !currentWeekStart || currentWeekStart < startOfWeek

    if (isNewWeek) {
      // Reset weekly progress
      await supabase
        .from('user_progress')
        .update({
          week_start_date: startOfWeek.toISOString().split('T')[0],
          weekly_completed: 1
        })
        .eq('user_id', userId)
    } else {
      // Increment weekly progress
      await supabase
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
    // 1. Update basic progress (existing system)
    const { userProgressOperations } = await import('./database')
    await userProgressOperations.updateAfterQuiz(userId, quizData.correctAnswers, quizData.totalQuestions)

    // 2. Update weekly progress
    await enhancedProgressOperations.updateWeeklyProgress(userId)

    // 3. Get comprehensive stats for achievement checking
    const beforeStats = await enhancedProgressOperations.getComprehensiveStats(userId)
    const afterStats = await enhancedProgressOperations.getComprehensiveStats(userId)
    
    // 4. Check for achievements based on quiz completion
    const isFirstQuiz = beforeStats.totalQuizzesCompleted === 0
    const isPerfectScore = quizData.correctAnswers === quizData.totalQuestions
    const isFastCompletion = quizData.timeSpentSeconds < 180 // 3 minutes
    const isVeryFastCompletion = quizData.timeSpentSeconds < 120 // 2 minutes
    const accuracyPercentage = (quizData.correctAnswers / quizData.totalQuestions) * 100
    
    // First quiz achievements
    if (isFirstQuiz) {
      const achievement = await achievementOperations.checkAndAward(userId, 'first_quiz')
      if (achievement) results.newAchievements.push(achievement)
      
      if (isPerfectScore) {
        const perfectAchievement = await achievementOperations.checkAndAward(userId, 'first_perfect')
        if (perfectAchievement) results.newAchievements.push(perfectAchievement)
      }
    }

    // Quiz completion milestones
    const totalCompleted = afterStats.totalQuizzesCompleted
    const milestones = [5, 10, 25, 50, 100, 250]
    for (const milestone of milestones) {
      if (totalCompleted === milestone) {
        const achievement = await achievementOperations.checkAndAward(userId, `quizzes_${milestone}`)
        if (achievement) results.newAchievements.push(achievement)
      }
    }

    // Streak achievements
    const currentStreak = afterStats.currentStreak
    const streakMilestones = [3, 7, 14, 30, 100]
    for (const milestone of streakMilestones) {
      if (currentStreak === milestone) {
        const achievement = await achievementOperations.checkAndAward(userId, `streak_${milestone}`)
        if (achievement) results.newAchievements.push(achievement)
      }
    }

    // Performance achievements
    if (isPerfectScore) {
      const achievement = await achievementOperations.checkAndAward(userId, 'perfect_quiz')
      if (achievement) results.newAchievements.push(achievement)
      
      // Check for perfect streaks (would need to track consecutive perfect scores)
      // This would require additional database tracking
    }

    // Speed achievements
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

    // Time-based achievements
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

    // Special date achievements
    const today = now.toISOString().split('T')[0]
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

    // Level-based achievements
    const currentLevel = afterStats.currentLevel
    const levelMilestones = [5, 10, 20, 50]
    for (const milestone of levelMilestones) {
      if (currentLevel === milestone) {
        const achievement = await achievementOperations.checkAndAward(userId, `level_${milestone}`)
        if (achievement) results.newAchievements.push(achievement)
      }
    }

    // 5. Update category skills and check for mastery achievements
    const categoryUpdates = new Map<string, { correct: number; total: number }>()
    const categoriesInQuiz = new Set<string>()
    
    for (const response of quizData.questionResponses) {
      categoriesInQuiz.add(response.category)
      
      // Update spaced repetition
      await spacedRepetitionOperations.updateQuestionMemory(
        userId,
        response.questionId,
        response.isCorrect,
        response.timeSpent * 1000 // Convert to milliseconds
      )

      // Aggregate category performance
      const current = categoryUpdates.get(response.category) || { correct: 0, total: 0 }
      categoryUpdates.set(response.category, {
        correct: current.correct + (response.isCorrect ? 1 : 0),
        total: current.total + 1
      })
    }

    // Update skills for each category and check for mastery achievements
    for (const [category, stats] of categoryUpdates) {
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
        const achievement = await achievementOperations.checkAndAward(userId, achievementType, { category })
        if (achievement) results.newAchievements.push(achievement)
      }
    }

    // Check for exploration achievements
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

    // Check for high accuracy achievement
    if (afterStats.totalQuizzesCompleted >= 20 && afterStats.accuracyPercentage >= 90) {
      const achievement = await achievementOperations.checkAndAward(userId, 'high_accuracy')
      if (achievement) results.newAchievements.push(achievement)
    }

    // 6. Check for level up
    results.levelUp = afterStats.currentLevel > beforeStats.currentLevel

    // Award XP for achievements
    for (const achievement of results.newAchievements) {
      const definition = ACHIEVEMENT_DEFINITIONS[achievement.type as keyof typeof ACHIEVEMENT_DEFINITIONS]
      if (definition?.xpReward) {
        await achievementOperations.awardXP(userId, definition.xpReward)
      }
    }

    return results

  } catch (error) {
    console.error('Error updating enhanced progress:', error)
    return results
  }
} 