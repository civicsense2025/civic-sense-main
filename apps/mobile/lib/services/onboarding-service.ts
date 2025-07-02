import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../supabase'
import { DB_TABLES } from '../database-constants'
import type { Database } from '../database-types'

type UserOnboardingState = Database['public']['Tables']['user_onboarding_state']['Row']

export interface OnboardingStatus {
  isCompleted: boolean
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  skippedAt?: string
  completedAt?: string
  status: 'started' | 'in_progress' | 'completed' | 'skipped'
  savedData?: any
}

export interface PersonalizedQuiz {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  category_id: string
  category_name: string
  question_count: number
  relevance_score: number
}

export interface OnboardingCategory {
  id: string
  name: string
  description: string
  emoji: string
  question_count: number
  display_order: number
}

export interface OnboardingSkill {
  id: string
  skill_name: string
  description: string
  emoji: string
  category_id: string
  category_name: string
  difficulty_level: number
  is_core_skill: boolean
  display_order: number
}

export interface SelectedSkill {
  id: string
  skill_name: string
  interest_level: number
  target_mastery_level: string
  learning_timeline: string
}

export interface OnboardingProgress {
  userId: string
  currentStep: string
  stepData: Record<string, any>
  lastUpdated: string
}

// Platform-agnostic storage interface for React Native
const mobileStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.warn('Storage setItem failed:', error)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.warn('Storage removeItem failed:', error)
    }
  }
}

export class EnhancedOnboardingService {
  static readonly ONBOARDING_STEPS = [
    'welcome',
    'categories', 
    'skills',
    'preferences',
    'assessment',
    'completion'
  ]

  private static storage = mobileStorageAdapter

  // Progress Management with Local Storage Backup
  static async saveProgress(userId: string, stepId: string, stepData: any): Promise<boolean> {
    try {
      // Save to local storage first (immediate)
      await this.saveProgressLocal(userId, stepId, stepData)
      
      // Then try to save to database (might fail if offline)
      try {
        await this.saveProgressRemote(userId, stepId, stepData)
      } catch (error) {
        console.warn('Remote save failed, progress saved locally:', error)
      }
      
      return true
    } catch (error) {
      console.error('Error saving progress:', error)
      return false
    }
  }

  private static async saveProgressLocal(userId: string, stepId: string, stepData: any): Promise<void> {
    const progressKey = `onboarding_progress_${userId}`
    
    try {
      const existingProgress = await this.storage.getItem(progressKey)
      const progress: OnboardingProgress = existingProgress 
        ? JSON.parse(existingProgress)
        : { userId, currentStep: stepId, stepData: {}, lastUpdated: new Date().toISOString() }
      
      // Update progress
      progress.currentStep = stepId
      progress.stepData[stepId] = stepData
      progress.lastUpdated = new Date().toISOString()
      
      await this.storage.setItem(progressKey, JSON.stringify(progress))
    } catch (error) {
      console.error('Error saving local progress:', error)
      throw error
    }
  }

  private static async saveProgressRemote(userId: string, stepId: string, stepData: any): Promise<void> {
    const { error } = await supabase.rpc('update_onboarding_progress', {
      p_user_id: userId,
      p_step_name: stepId,
      p_step_data: stepData || {}
    })

    if (error) {
      console.error('Remote progress save error:', error)
      throw error
    }
  }

  static async loadProgress(userId: string): Promise<OnboardingStatus> {
    try {
      console.log('📖 Loading onboarding progress for user:', userId)
      
      // Always try local storage first (fastest)
      const localProgress = await this.loadProgressLocal(userId)
      console.log('📱 Local progress loaded:', localProgress.currentStep)
      
      // Return local progress immediately if we have it
      if (localProgress.currentStep !== 'welcome' || Object.keys(localProgress.stepData).length > 0) {
        console.log('✅ Using local progress:', localProgress.currentStep)
        return this.formatProgressStatus(localProgress)
      }
      
      // Only try remote if local is empty (new user)
      try {
        console.log('☁️ Checking remote progress...')
        const remoteProgress = await Promise.race([
          this.loadProgressRemote(userId),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Remote timeout')), 2000)
          )
        ])
        
        if (remoteProgress && remoteProgress.currentStep !== 'welcome') {
          console.log('☁️ Using remote progress:', remoteProgress.currentStep)
          // Save to local for next time
          await this.saveProgressLocal(userId, remoteProgress.currentStep, remoteProgress.stepData)
          return this.formatProgressStatus(remoteProgress)
        }
              } catch (error) {
          console.warn('⚠️ Remote progress load failed, using local:', error instanceof Error ? error.message : error)
      }
      
      console.log('📝 Using local/default progress')
      return this.formatProgressStatus(localProgress)
    } catch (error) {
      console.error('❌ Error loading progress, returning default:', error)
      return this.getDefaultProgress()
    }
  }

  private static async loadProgressLocal(userId: string): Promise<OnboardingProgress> {
    const progressKey = `onboarding_progress_${userId}`
    const saved = await this.storage.getItem(progressKey)
    
    if (saved) {
      return JSON.parse(saved)
    }
    
    return {
      userId,
      currentStep: 'welcome',
      stepData: {},
      lastUpdated: new Date().toISOString()
    }
  }

  private static async loadProgressRemote(userId: string): Promise<OnboardingProgress | null> {
    const { data, error } = await supabase
      .from(DB_TABLES.USER_ONBOARDING_STATE)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return {
      userId,
      currentStep: data.current_step || 'welcome',
      stepData: data.onboarding_data || {},
      lastUpdated: data.updated_at || new Date().toISOString()
    }
  }

  private static formatProgressStatus(progress: OnboardingProgress): OnboardingStatus {
    const currentStepIndex = this.ONBOARDING_STEPS.indexOf(progress.currentStep)
    const completedSteps = Object.keys(progress.stepData)
    
    return {
      isCompleted: progress.currentStep === 'completion',
      currentStep: Math.max(0, currentStepIndex),
      totalSteps: this.ONBOARDING_STEPS.length,
      completedSteps,
      status: progress.currentStep === 'completion' ? 'completed' : 'in_progress',
      savedData: progress.stepData
    }
  }

  private static getDefaultProgress(): OnboardingStatus {
    return {
      isCompleted: false,
      currentStep: 0,
      totalSteps: this.ONBOARDING_STEPS.length,
      completedSteps: [],
      status: 'started'
    }
  }

  // Category Management
  static async saveSelectedCategories(userId: string, categories: any[]): Promise<void> {
    const categoriesKey = `selected_categories_${userId}`
    await this.storage.setItem(categoriesKey, JSON.stringify(categories))
    
    // Also save in onboarding progress
    await this.saveProgress(userId, 'categories', { categories })
  }

  static async getSelectedCategories(userId: string): Promise<any[]> {
    try {
      // Try from local storage first
      const categoriesKey = `selected_categories_${userId}`
      const saved = await this.storage.getItem(categoriesKey)
      if (saved) {
        return JSON.parse(saved)
      }
      
      // Fallback to onboarding progress
      const progress = await this.loadProgressLocal(userId)
      return progress.stepData.categories?.categories || []
    } catch (error) {
      console.error('Error loading selected categories:', error)
      return []
    }
  }

  // Database Operations
  static async getOnboardingCategories(): Promise<OnboardingCategory[]> {
    try {
      const { data, error } = await supabase.rpc('get_onboarding_categories')

      if (error) {
        console.error('Error fetching onboarding categories:', error)
        
        // Fallback: fetch categories directly
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(DB_TABLES.CATEGORIES)
          .select('id, name, description, emoji, display_order')
          .eq('is_active', true)
          .order('display_order')

        if (fallbackError) {
          console.error('Fallback categories fetch failed:', fallbackError)
          return []
        }

        return (fallbackData || []).map(cat => ({
          ...cat,
          question_count: 0
        }))
      }

      return data || []
    } catch (error) {
      console.error('Error in getOnboardingCategories:', error)
      return []
    }
  }

  static async getOnboardingSkills(categoryIds?: string[]): Promise<OnboardingSkill[]> {
    try {
      const { data, error } = await supabase.rpc('get_onboarding_skills', {
        p_category_ids: categoryIds && categoryIds.length > 0 ? categoryIds : null
      })

      if (error) {
        console.error('Error fetching onboarding skills:', error)
        
        // Fallback: fetch skills directly
        let query = supabase
          .from(DB_TABLES.SKILLS)
          .select(`
            id,
            skill_name,
            description,
            emoji,
            category_id,
            difficulty_level,
            is_core_skill,
            display_order,
            categories!inner(name)
          `)
          .eq('is_active', true)
          .order('display_order')

        // Filter by categories if provided
        if (categoryIds && categoryIds.length > 0) {
          query = query.in('category_id', categoryIds)
        }

        const { data: fallbackData, error: fallbackError } = await query

        if (fallbackError) {
          console.error('Fallback skills fetch failed:', fallbackError)
          return []
        }

        return (fallbackData || []).map((skill: any) => ({
          id: skill.id,
          skill_name: skill.skill_name,
          description: skill.description || '',
          emoji: skill.emoji || '🎯',
          category_id: skill.category_id,
          category_name: skill.categories?.name || 'General',
          difficulty_level: skill.difficulty_level || 1,
          is_core_skill: skill.is_core_skill || false,
          display_order: skill.display_order || 0
        }))
      }

      return data || []
    } catch (error) {
      console.error('Error in getOnboardingSkills:', error)
      return []
    }
  }

  static async getPersonalizedQuizzes(userId: string, limit: number = 3): Promise<PersonalizedQuiz[]> {
    try {
      // Try to get personalized recommendations based on user's onboarding data
      const { data, error } = await supabase.rpc('get_personalized_quizzes', {
        p_user_id: userId,
        p_limit: limit
      })

      if (error) {
        console.warn('Personalized quizzes RPC failed, using fallback:', error)
        
        // Fallback: Get user's selected categories and find related quizzes
        const progress = await this.loadProgressLocal(userId)
        const selectedCategories = progress.stepData.categories?.categories || []
        
        if (selectedCategories.length > 0) {
          const categoryIds = selectedCategories.map((cat: any) => cat.id)
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from(DB_TABLES.QUESTION_TOPICS)
            .select(`
              topic_id,
              topic_title,
              description,
              emoji,
              category_id,
              categories!inner(id, name)
            `)
            .in('category_id', categoryIds)
            .eq('is_active', true)
            .limit(limit)

          if (fallbackError) {
            console.error('Fallback personalized quizzes failed:', fallbackError)
            return []
          }

          return (fallbackData || []).map((quiz: any) => ({
            topic_id: quiz.topic_id,
            topic_title: quiz.topic_title,
            description: quiz.description || '',
            emoji: quiz.emoji || '🎯',
            category_id: quiz.category_id,
            category_name: quiz.categories?.name || 'General',
            question_count: 10, // Default estimate
            relevance_score: 0.8 // Default high relevance
          }))
        }
        
        // If no categories selected, return empty array
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPersonalizedQuizzes:', error)
      return []
    }
  }

  static async markOnboardingComplete(userId: string): Promise<boolean> {
    try {
      // Save completion locally
      await this.saveProgress(userId, 'completion', { completed: true })
      
      // Save to database
      const { error } = await supabase
        .from(DB_TABLES.USER_ONBOARDING_STATE)
        .upsert({
          user_id: userId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_step: 'completion',
          is_completed: true
        })

      return !error
    } catch (error) {
      console.error('Error marking onboarding complete:', error)
      return false
    }
  }

  static async skipOnboarding(userId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(DB_TABLES.USER_ONBOARDING_STATE)
        .upsert({
          user_id: userId,
          status: 'skipped',
          skipped_at: new Date().toISOString(),
          skip_reason: reason,
        })

      return !error
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      return false
    }
  }

  // Sync offline progress when back online
  static async syncOfflineProgress(userId: string): Promise<boolean> {
    try {
      const progress = await this.loadProgressLocal(userId)
      
      // Sync each step's data to the server
      for (const [stepId, stepData] of Object.entries(progress.stepData)) {
        await this.saveProgressRemote(userId, stepId, stepData)
      }
      
      return true
    } catch (error) {
      console.error('Error syncing offline progress:', error)
      return false
    }
  }
}

// Export alias for consistency with index.ts
export const OnboardingService = EnhancedOnboardingService; 