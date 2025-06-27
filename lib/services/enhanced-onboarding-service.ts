import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/utils/analytics'

export interface OnboardingAnalytics {
  step_started: string
  step_completed: string
  step_skipped: string
  assessment_type_selected: 'quick' | 'full'
  categories_selected: number
  skills_selected: number
  time_spent_seconds: number
  completion_rate: number
  drop_off_point?: string
}

export interface LearningPath {
  id: string
  name: string
  description: string
  categories: string[]
  skills: string[]
  difficulty_progression: ('beginner' | 'intermediate' | 'advanced')[]
  estimated_weeks: number
  quiz_order: string[]
}

export interface PersonalizedRecommendations {
  learning_paths: LearningPath[]
  suggested_quizzes: Array<{
    topic_id: string
    title: string
    relevance_score: number
    difficulty: string
    estimated_minutes: number
  }>
  skill_gap_analysis: Array<{
    skill_name: string
    current_level: number
    target_level: number
    recommended_actions: string[]
  }>
  social_connections: Array<{
    type: 'study_buddy' | 'mentor' | 'learning_group'
    description: string
    action_url?: string
  }>
}

export interface OnboardingABTest {
  assessment_type: 'quick' | 'full'
  flow_variant: 'standard' | 'gamified' | 'social'
  completion_incentive: 'badge' | 'streak' | 'none'
}

// Platform-agnostic storage interface
interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

// Web localStorage adapter
const webStorageAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('Storage setItem failed:', error)
    }
  },
  removeItem: async (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Storage removeItem failed:', error)
    }
  }
}

class EnhancedOnboardingService {
  private analytics = useAnalytics()
  private sessionStartTime: number = Date.now()
  private storage: StorageAdapter = webStorageAdapter

  // A/B Testing Configuration
  async getABTestConfiguration(userId: string): Promise<OnboardingABTest> {
    try {
      // Check if user already has test assignment
      const cachedConfig = await this.getCachedABTest(userId)
      if (cachedConfig) {
        return cachedConfig
      }

      // Assign to test groups based on user ID hash
      const hash = this.hashUserId(userId)
      
      const config: OnboardingABTest = {
        assessment_type: hash % 2 === 0 ? 'quick' : 'full',
        flow_variant: ['standard', 'gamified', 'social'][hash % 3] as any,
        completion_incentive: ['badge', 'streak', 'none'][Math.floor(hash / 3) % 3] as any
      }

      // Cache the configuration
      await this.cacheABTest(userId, config)
      
      // Track assignment
      this.analytics.trackCustomEvent('onboarding_ab_test_assigned', 1, {
        user_id: userId,
        ...config
      })

      return config
    } catch (error) {
      console.error('Error getting A/B test config:', error)
      // Fallback to standard configuration
      return {
        assessment_type: 'quick',
        flow_variant: 'standard',
        completion_incentive: 'badge'
      }
    }
  }

  // Enhanced Assessment with A/B Testing
  async startAssessment(userId: string, type: 'quick' | 'full'): Promise<any> {
    try {
      this.analytics.trackCustomEvent('onboarding_assessment_started', 1, {
        user_id: userId,
        assessment_type: type,
        timestamp: new Date().toISOString()
      })

      if (type === 'quick') {
        return await this.getQuickAssessment()
      } else {
        return await this.getFullAssessment()
      }
    } catch (error) {
      console.error('Error starting assessment:', error)
      throw error
    }
  }

  private async getQuickAssessment() {
    // 5-minute assessment with core civic knowledge
    return {
      questions: [
        {
          id: 'q1',
          text: 'How many senators does each state have?',
          options: ['1', '2', '3', 'Depends on population'],
          correct: 1,
          category: 'government_structure'
        },
        {
          id: 'q2', 
          text: 'Which amendment protects freedom of speech?',
          options: ['First', 'Second', 'Fourth', 'Fifth'],
          correct: 0,
          category: 'constitutional_rights'
        },
        {
          id: 'q3',
          text: 'Who can declare war?',
          options: ['President', 'Congress', 'Supreme Court', 'Pentagon'],
          correct: 1,
          category: 'separation_of_powers'
        },
        {
          id: 'q4',
          text: 'What is gerrymandering?',
          options: [
            'Voter registration process',
            'Redrawing district boundaries for political advantage', 
            'Campaign finance rule',
            'Legislative procedure'
          ],
          correct: 1,
          category: 'elections'
        },
        {
          id: 'q5',
          text: 'How often are House representatives elected?',
          options: ['Every year', 'Every 2 years', 'Every 4 years', 'Every 6 years'],
          correct: 1,
          category: 'electoral_system'
        }
      ],
      time_limit_minutes: 5,
      description: 'Quick civic knowledge check'
    }
  }

  private async getFullAssessment() {
    // 15-minute comprehensive assessment using existing questions
    try {
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .limit(15)

      return {
        questions: questions || [],
        time_limit_minutes: 15,
        description: 'Comprehensive civic knowledge assessment'
      }
    } catch (error) {
      console.error('Error fetching assessment questions:', error)
      // Return fallback questions
      return this.getQuickAssessment()
    }
  }

  // Personalized Learning Path Generation
  async generateLearningPaths(
    userId: string, 
    assessmentResults: any, 
    selectedCategories: string[], 
    selectedSkills: string[]
  ): Promise<PersonalizedRecommendations> {
    try {
      // For now, generate recommendations based on selections
      // This would be enhanced with actual recommendation logic
      const recommendations = await this.generateBasicRecommendations(
        assessmentResults,
        selectedCategories,
        selectedSkills
      )

      return recommendations
    } catch (error) {
      console.error('Error generating learning paths:', error)
      return this.getFallbackRecommendations()
    }
  }

  private async generateBasicRecommendations(
    assessmentResults: any,
    selectedCategories: string[],
    selectedSkills: string[]
  ): Promise<PersonalizedRecommendations> {
    // Get relevant topics based on selected categories
    const { data: topics } = await supabase
      .from('question_topics')
      .select('*')
      .in('category_id', selectedCategories)
      .eq('is_active', true)
      .limit(5)

    const suggested_quizzes = (topics || []).map(topic => ({
      topic_id: topic.topic_id,
      title: topic.topic_title,
      relevance_score: 0.8,
      difficulty: 'beginner',
      estimated_minutes: 8
    }))

    return {
      learning_paths: [
        {
          id: 'personalized_path',
          name: 'Your Civic Learning Path',
          description: 'Customized based on your interests and assessment',
          categories: selectedCategories,
          skills: selectedSkills,
          difficulty_progression: ['beginner', 'intermediate'],
          estimated_weeks: Math.max(2, selectedCategories.length),
          quiz_order: suggested_quizzes.map(q => q.topic_id)
        }
      ],
      suggested_quizzes,
      skill_gap_analysis: selectedSkills.map(skill => ({
        skill_name: skill,
        current_level: 1,
        target_level: 3,
        recommended_actions: ['Complete related quizzes', 'Practice with scenarios']
      })),
      social_connections: [
        {
          type: 'learning_group',
          description: 'Join study groups focused on your interests',
          action_url: '/learning-pods'
        }
      ]
    }
  }

  private getFallbackRecommendations(): PersonalizedRecommendations {
    return {
      learning_paths: [
        {
          id: 'civic_fundamentals',
          name: 'Civic Fundamentals',
          description: 'Build a strong foundation in how American democracy works',
          categories: ['government_structure', 'elections'],
          skills: ['read_legislation', 'research_candidates'],
          difficulty_progression: ['beginner', 'intermediate'],
          estimated_weeks: 4,
          quiz_order: ['constitution-basics', 'three-branches', 'election-process']
        }
      ],
      suggested_quizzes: [
        {
          topic_id: 'constitution-basics',
          title: 'Constitution Fundamentals',
          relevance_score: 0.9,
          difficulty: 'beginner',
          estimated_minutes: 8
        }
      ],
      skill_gap_analysis: [],
      social_connections: []
    }
  }

  // Offline Support
  async syncOfflineProgress(): Promise<boolean> {
    try {
      const offlineData = await this.storage.getItem('onboarding_offline_data')
      if (!offlineData) return true

      const data = JSON.parse(offlineData)
      
      // Sync each step's data
      for (const [stepId, stepData] of Object.entries(data)) {
        if (stepId !== 'userId') {
          await this.saveStepData(data.userId, stepId, stepData)
        }
      }

      // Clear offline data after successful sync
      await this.storage.removeItem('onboarding_offline_data')
      return true
    } catch (error) {
      console.error('Error syncing offline progress:', error)
      return false
    }
  }

  async saveOfflineProgress(userId: string, stepId: string, stepData: any): Promise<void> {
    try {
      const existing = await this.storage.getItem('onboarding_offline_data')
      const offlineData = existing ? JSON.parse(existing) : { userId }
      
      offlineData[stepId] = {
        ...stepData,
        timestamp: Date.now(),
        offline: true
      }

      await this.storage.setItem('onboarding_offline_data', JSON.stringify(offlineData))
    } catch (error) {
      console.error('Error saving offline progress:', error)
    }
  }

  // Social Onboarding Features
  async generateInviteLink(userId: string): Promise<string> {
    try {
      // Generate a simple invite code
      const inviteCode = `${userId.slice(0, 8)}_${Date.now().toString(36)}`
      
      // Try to store in database - handle gracefully if table doesn't exist yet
      try {
        const { error } = await supabase
          .from('onboarding_invites' as any) // Cast to any to bypass TypeScript check
          .insert({
            invite_code: inviteCode,
            inviter_id: userId,
            created_at: new Date().toISOString()
          })

        if (error) {
          console.warn('Could not save invite to database (table may not exist yet):', error)
          // Continue with invite link generation even if DB save fails
        }
      } catch (dbError) {
        console.warn('Database operation failed for invite storage:', dbError)
        // Continue even if database operation fails
      }

      // Return invite link regardless of database storage success
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://civicsense.com'
      
      return `${baseUrl}/join?invite=${inviteCode}`
    } catch (error) {
      console.error('Error generating invite link:', error)
      
      // Fallback: generate a simple invite link without database storage
      const fallbackCode = `temp_${userId.slice(0, 6)}_${Date.now().toString(36)}`
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://civicsense.com'
      
      return `${baseUrl}/join?invite=${fallbackCode}`
    }
  }

  // Analytics & Tracking
  trackStepStart(stepId: string, userId: string): void {
    this.analytics.trackCustomEvent('onboarding_step_started', 1, {
      step_id: stepId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      session_duration: Date.now() - this.sessionStartTime
    })
  }

  trackStepComplete(stepId: string, userId: string, stepData: any): void {
    this.analytics.trackCustomEvent('onboarding_step_completed', 1, {
      step_id: stepId,
      user_id: userId,
      step_data: stepData,
      timestamp: new Date().toISOString(),
      session_duration: Date.now() - this.sessionStartTime
    })
  }

  trackDropOff(stepId: string, userId: string, reason?: string): void {
    this.analytics.trackCustomEvent('onboarding_drop_off', 1, {
      step_id: stepId,
      user_id: userId,
      reason: reason || 'unknown',
      timestamp: new Date().toISOString(),
      session_duration: Date.now() - this.sessionStartTime
    })
  }

  // Helper Methods
  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  private async getCachedABTest(userId: string): Promise<OnboardingABTest | null> {
    try {
      const cached = await this.storage.getItem(`ab_test_${userId}`)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  private async cacheABTest(userId: string, config: OnboardingABTest): Promise<void> {
    try {
      await this.storage.setItem(`ab_test_${userId}`, JSON.stringify(config))
    } catch (error) {
      console.error('Error caching A/B test config:', error)
    }
  }

  private async saveStepData(userId: string, stepId: string, stepData: any): Promise<void> {
    const { error } = await supabase
      .from('user_onboarding_state')
      .upsert({
        user_id: userId,
        current_step: stepId,
        onboarding_data: { [stepId]: stepData },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Error saving step data:', error)
      throw error
    }
  }

  // Performance Monitoring
  async getOnboardingMetrics(timeframe: 'day' | 'week' | 'month' = 'week') {
    try {
      // Query actual metrics from database
      const { data, error } = await supabase
        .from('user_onboarding_state')
        .select('*')
        .gte('created_at', this.getTimeframeStart(timeframe))

      if (error) throw error

      const total = data?.length || 0
      const completed = data?.filter(d => d.is_completed).length || 0
      
      return {
        completion_rate: total > 0 ? completed / total : 0,
        average_time_minutes: 12, // Placeholder
        drop_off_points: [],
        ab_test_results: {}
      }
    } catch (error) {
      console.error('Error getting onboarding metrics:', error)
      return null
    }
  }

  private getTimeframeStart(timeframe: 'day' | 'week' | 'month'): string {
    const now = new Date()
    switch (timeframe) {
      case 'day':
        now.setDate(now.getDate() - 1)
        break
      case 'week':
        now.setDate(now.getDate() - 7)
        break
      case 'month':
        now.setMonth(now.getMonth() - 1)
        break
    }
    return now.toISOString()
  }
}

export const enhancedOnboardingService = new EnhancedOnboardingService() 