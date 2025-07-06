import { supabase } from '../supabase'
import { DB_TABLES } from '../database-constants'
import type { Database } from '../database-types'

type UserCategoryPreference = Database['public']['Tables']['user_category_preferences']['Row']
type UserSkillPreference = Database['public']['Tables']['user_skill_preferences']['Row']
type UserPlatformPreference = Database['public']['Tables']['user_platform_preferences']['Row']

export interface PersonalizationSettings {
  categories: UserCategoryPreference[]
  skills: UserSkillPreference[]
  platformPreferences: UserPlatformPreference | null
  recommendedTopics: string[]
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'adaptive'
  quizLength: number
  learningPace: 'self_paced' | 'structured' | 'intensive'
}

export interface QuizPersonalization {
  preferredCategories: string[]
  preferredSkills: string[]
  difficulty: number
  questionCount: number
  showExplanations: boolean
  showSources: boolean
}

export class PersonalizationService {
  private static cachedSettings: Map<string, PersonalizationSettings> = new Map()

  /**
   * Get comprehensive personalization settings for a user
   */
  static async getPersonalizationSettings(userId: string): Promise<PersonalizationSettings> {
    // Check cache first
    const cached = this.cachedSettings.get(userId)
    if (cached) return cached

    try {
      // Fetch all personalization data in parallel
      const [categories, skills, platformPrefs] = await Promise.all([
        this.getUserCategoryPreferences(userId),
        this.getUserSkillPreferences(userId),
        this.getUserPlatformPreferences(userId),
      ])

      // Generate recommendations based on preferences
      const recommendedTopics = await this.generateTopicRecommendations(userId, categories, skills)

      const settings: PersonalizationSettings = {
        categories,
        skills,
        platformPreferences: platformPrefs,
        recommendedTopics,
        difficultyLevel: platformPrefs?.preferred_difficulty as any || 'medium',
        quizLength: platformPrefs?.preferred_quiz_length || 10,
        learningPace: platformPrefs?.learning_pace as any || 'structured',
      }

      // Cache for 5 minutes
      this.cachedSettings.set(userId, settings)
      setTimeout(() => this.cachedSettings.delete(userId), 5 * 60 * 1000)

      return settings
    } catch (error) {
      console.error('Error getting personalization settings:', error)
      return {
        categories: [],
        skills: [],
        platformPreferences: null,
        recommendedTopics: [],
        difficultyLevel: 'medium',
        quizLength: 10,
        learningPace: 'structured',
      }
    }
  }

  /**
   * Get quiz personalization settings
   */
  static async getQuizPersonalization(userId: string): Promise<QuizPersonalization> {
    const settings = await this.getPersonalizationSettings(userId)
    
    // Get categories with high interest (4-5)
    const preferredCategories = settings.categories
      .filter(c => c.interest_level >= 4)
      .map(c => c.category_id)

    // Get skills with high interest (4-5)
    const preferredSkills = settings.skills
      .filter(s => s.interest_level >= 4)
      .map(s => s.skill_id)

    // Map difficulty level to numeric value
    const difficultyMap = {
      'easy': 1,
      'medium': 2,
      'hard': 3,
      'adaptive': 4,
    }

    return {
      preferredCategories,
      preferredSkills,
      difficulty: difficultyMap[settings.difficultyLevel],
      questionCount: settings.quizLength,
      showExplanations: settings.platformPreferences?.show_explanations ?? true,
      showSources: settings.platformPreferences?.show_sources ?? true,
    }
  }

  /**
   * Get personalized topic recommendations
   */
  static async generateTopicRecommendations(
    userId: string,
    categories: UserCategoryPreference[],
    skills: UserSkillPreference[]
  ): Promise<string[]> {
    try {
      // Get topics based on category preferences
      const highInterestCategories = categories
        .filter(c => c.interest_level >= 4)
        .map(c => c.category_id)

      if (highInterestCategories.length === 0) {
        return []
      }

      // Fetch topics from high-interest categories
      const { data: topics, error } = await supabase
        .from(DB_TABLES.QUESTION_TOPICS)
        .select('topic_id, topic_title')
        .containedBy('categories', highInterestCategories)
        .limit(10)

      if (error || !topics) {
        return []
      }

      return topics.map(t => t.topic_id)
    } catch (error) {
      console.error('Error generating topic recommendations:', error)
      return []
    }
  }

  /**
   * Update personalization based on quiz performance
   */
  static async updatePersonalizationFromPerformance(
    userId: string,
    quizResults: {
      categoryId: string
      accuracy: number
      avgResponseTime: number
    }[]
  ): Promise<void> {
    try {
      // Analyze performance and adjust difficulty
      const avgAccuracy = quizResults.reduce((sum, r) => sum + r.accuracy, 0) / quizResults.length
      
      let newDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive' = 'medium'
      if (avgAccuracy > 0.8) {
        newDifficulty = 'hard'
      } else if (avgAccuracy < 0.5) {
        newDifficulty = 'easy'
      }

      // Update platform preferences
      await supabase
        .from(DB_TABLES.USER_PLATFORM_PREFERENCES)
        .update({
          preferred_difficulty: newDifficulty,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      // Clear cache to force refresh
      this.cachedSettings.delete(userId)
    } catch (error) {
      console.error('Error updating personalization from performance:', error)
    }
  }

  // Private helper methods
  private static async getUserCategoryPreferences(userId: string): Promise<UserCategoryPreference[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_CATEGORY_PREFERENCES)
      .select('*')
      .eq('user_id', userId)
      .order('interest_level', { ascending: false })

    if (error) {
      console.error('Error fetching category preferences:', error)
      return []
    }

    return data || []
  }

  private static async getUserSkillPreferences(userId: string): Promise<UserSkillPreference[]> {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_SKILL_PREFERENCES)
      .select('*')
      .eq('user_id', userId)
      .order('interest_level', { ascending: false })

    if (error) {
      console.error('Error fetching skill preferences:', error)
      return []
    }

    return data || []
  }

  private static async getUserPlatformPreferences(userId: string): Promise<UserPlatformPreference | null> {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_PLATFORM_PREFERENCES)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching platform preferences:', error)
      return null
    }

    return data
  }

  /**
   * Clear cached settings for a user
   */
  static clearCache(userId?: string): void {
    if (userId) {
      this.cachedSettings.delete(userId)
    } else {
      this.cachedSettings.clear()
    }
  }
} 