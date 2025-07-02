/**
 * Content Filtering Service for Learning Pods and Group Controls
 * 
 * This service provides content filtering capabilities based on:
 * - User age and grade level
 * - Parental control settings
 * - Content sensitivity levels
 * - Category restrictions
 */

export interface ContentFilterLevel {
  level: 'none' | 'light' | 'moderate' | 'strict'
  description: string
  ageRange: string
  blockedKeywords: string[]
  blockedCategories: string[]
  maxDifficulty: number
}

export interface UserContentProfile {
  userId: string
  age?: number
  gradeLevel?: string
  parentalControls?: ParentalControlSettings
  podMemberships?: PodMembership[]
}

export interface ParentalControlSettings {
  contentFilterLevel: 'none' | 'light' | 'moderate' | 'strict'
  blockedCategories: string[]
  blockedTopics: string[]
  maxDifficultyLevel: number
  allowSensitiveTopics: boolean
  requireParentApproval: boolean
}

export interface PodMembership {
  podId: string
  role: 'admin' | 'parent' | 'child' | 'member'
  birthDate?: string
  parentalConsent: boolean
}

export interface TopicMetadata {
  topic_id: string
  topic_title: string
  description: string
  categories: string[]
  difficulty_level?: number
  sensitivity_level?: 'low' | 'medium' | 'high'
  keywords?: string[]
  age_recommendation?: {
    min_age: number
    max_age?: number
    grade_levels: string[]
  }
}

export interface ContentFilterResult {
  allowed: boolean
  reason?: string
  restrictionType?: 'age' | 'category' | 'difficulty' | 'keyword' | 'parental_control'
  suggestedAlternatives?: string[]
  parentNotificationRequired?: boolean
}

// Predefined content filtering rules
export const CONTENT_FILTER_LEVELS: Record<string, ContentFilterLevel> = {
  none: {
    level: 'none',
    description: 'No content restrictions',
    ageRange: 'all_ages',
    blockedKeywords: [],
    blockedCategories: [],
    maxDifficulty: 5
  },
  light: {
    level: 'light',
    description: 'Basic filtering of inappropriate content',
    ageRange: 'high_school',
    blockedKeywords: ['terrorism', 'extremism'],
    blockedCategories: [],
    maxDifficulty: 5
  },
  moderate: {
    level: 'moderate',
    description: 'Balanced protection with educational focus',
    ageRange: 'middle_school',
    blockedKeywords: ['terrorism', 'extremism', 'violence', 'drugs'],
    blockedCategories: [],
    maxDifficulty: 4
  },
  strict: {
    level: 'strict',
    description: 'Maximum protection for young learners',
    ageRange: 'elementary',
    blockedKeywords: [
      'terrorism', 'extremism', 'violence', 'drugs', 'alcohol', 
      'sexuality', 'abortion', 'controversial', 'war', 'death'
    ],
    blockedCategories: ['National Security', 'Justice'],
    maxDifficulty: 3
  }
}

// Age-based content recommendations
export const AGE_CONTENT_GUIDELINES = {
  elementary: { // Ages 5-11
    maxDifficulty: 3,
    recommendedFilter: 'strict',
    blockedCategories: ['National Security', 'Justice'],
    sensitiveTopicsAllowed: false
  },
  middle_school: { // Ages 12-14
    maxDifficulty: 4,
    recommendedFilter: 'moderate',
    blockedCategories: [],
    sensitiveTopicsAllowed: false
  },
  high_school: { // Ages 15-18
    maxDifficulty: 5,
    recommendedFilter: 'light',
    blockedCategories: [],
    sensitiveTopicsAllowed: true
  },
  adult: { // Ages 18+
    maxDifficulty: 5,
    recommendedFilter: 'none',
    blockedCategories: [],
    sensitiveTopicsAllowed: true
  }
}

export class ContentFilteringService {
  /**
   * Check if content is appropriate for a user based on their profile and parental controls
   */
  static async filterContent(
    content: TopicMetadata, 
    userProfile: UserContentProfile
  ): Promise<ContentFilterResult> {
    // If no parental controls, allow all content for adults
    if (!userProfile.parentalControls && (!userProfile.age || userProfile.age >= 18)) {
      return { allowed: true }
    }

    // Get effective filter level
    const filterLevel = this.getEffectiveFilterLevel(userProfile)
    const filterRules = CONTENT_FILTER_LEVELS[filterLevel]

    // Check difficulty level
    if (content.difficulty_level && content.difficulty_level > filterRules.maxDifficulty) {
      return {
        allowed: false,
        reason: `Content difficulty (${content.difficulty_level}) exceeds maximum allowed (${filterRules.maxDifficulty})`,
        restrictionType: 'difficulty'
      }
    }

    // Check blocked categories
    const blockedCategories = [
      ...filterRules.blockedCategories,
      ...(userProfile.parentalControls?.blockedCategories || [])
    ]
    
    const hasBlockedCategory = content.categories.some(category => 
      blockedCategories.includes(category)
    )
    
    if (hasBlockedCategory) {
      return {
        allowed: false,
        reason: 'Content contains blocked categories',
        restrictionType: 'category',
        parentNotificationRequired: true
      }
    }

    // Check blocked topics
    if (userProfile.parentalControls?.blockedTopics?.includes(content.topic_id)) {
      return {
        allowed: false,
        reason: 'Topic specifically blocked by parent',
        restrictionType: 'parental_control'
      }
    }

    // Check keywords
    const contentText = `${content.topic_title} ${content.description}`.toLowerCase()
    const hasBlockedKeyword = filterRules.blockedKeywords.some(keyword =>
      contentText.includes(keyword.toLowerCase())
    )

    if (hasBlockedKeyword) {
      return {
        allowed: false,
        reason: 'Content contains filtered keywords',
        restrictionType: 'keyword',
        parentNotificationRequired: true
      }
    }

    // Check age appropriateness
    if (content.age_recommendation && userProfile.age) {
      if (userProfile.age < content.age_recommendation.min_age) {
        return {
          allowed: false,
          reason: `Content recommended for ages ${content.age_recommendation.min_age}+`,
          restrictionType: 'age'
        }
      }
    }

    // Check sensitivity level
    if (content.sensitivity_level === 'high' && 
        !userProfile.parentalControls?.allowSensitiveTopics) {
      return {
        allowed: false,
        reason: 'Sensitive content blocked by parental controls',
        restrictionType: 'parental_control'
      }
    }

    return { allowed: true }
  }

  /**
   * Filter a list of topics based on user profile
   */
  static async filterTopicList(
    topics: TopicMetadata[], 
    userProfile: UserContentProfile
  ): Promise<TopicMetadata[]> {
    const filteredTopics: TopicMetadata[] = []
    
    for (const topic of topics) {
      const result = await this.filterContent(topic, userProfile)
      if (result.allowed) {
        filteredTopics.push(topic)
      }
    }
    
    return filteredTopics
  }

  /**
   * Get effective filter level based on user profile
   */
  private static getEffectiveFilterLevel(userProfile: UserContentProfile): string {
    // Use explicit parental control setting if available
    if (userProfile.parentalControls?.contentFilterLevel) {
      return userProfile.parentalControls.contentFilterLevel
    }

    // Use age-based recommendation
    if (userProfile.age) {
      if (userProfile.age <= 11) return 'strict'
      if (userProfile.age <= 14) return 'moderate'
      if (userProfile.age <= 17) return 'light'
    }

    return 'none'
  }

  /**
   * Get age-appropriate content recommendations
   */
  static getAgeRecommendations(age: number) {
    if (age <= 11) return AGE_CONTENT_GUIDELINES.elementary
    if (age <= 14) return AGE_CONTENT_GUIDELINES.middle_school
    if (age <= 17) return AGE_CONTENT_GUIDELINES.high_school
    return AGE_CONTENT_GUIDELINES.adult
  }

  /**
   * Check if user needs parental approval for an action
   */
  static requiresParentalApproval(
    action: 'friend_request' | 'multiplayer_join' | 'content_access',
    userProfile: UserContentProfile
  ): boolean {
    if (!userProfile.parentalControls) return false
    
    switch (action) {
      case 'friend_request':
        return userProfile.parentalControls.requireParentApproval || false
      case 'multiplayer_join':
        return userProfile.age ? userProfile.age < 13 : false
      case 'content_access':
        return userProfile.parentalControls.contentFilterLevel === 'strict'
      default:
        return false
    }
  }

  /**
   * Generate content filter summary for parents
   */
  static generateFilterSummary(userProfile: UserContentProfile) {
    const filterLevel = this.getEffectiveFilterLevel(userProfile)
    const rules = CONTENT_FILTER_LEVELS[filterLevel]
    const ageRec = userProfile.age ? this.getAgeRecommendations(userProfile.age) : null

    return {
      filterLevel,
      description: rules.description,
      maxDifficulty: rules.maxDifficulty,
      blockedCategories: rules.blockedCategories.length,
      blockedKeywords: rules.blockedKeywords.length,
      ageAppropriate: ageRec ? filterLevel === ageRec.recommendedFilter : true,
      recommendations: ageRec
    }
  }

  /**
   * Suggest alternative content when something is blocked
   */
  static async suggestAlternatives(
    blockedContent: TopicMetadata,
    userProfile: UserContentProfile,
    allTopics: TopicMetadata[]
  ): Promise<TopicMetadata[]> {
    // Find similar topics that are allowed
    const alternatives: TopicMetadata[] = []
    
    for (const topic of allTopics) {
      if (topic.topic_id === blockedContent.topic_id) continue
      
      // Check if topic is allowed
      const result = await this.filterContent(topic, userProfile)
      if (!result.allowed) continue
      
      // Check for similar categories
      const hasSharedCategory = topic.categories.some(cat => 
        blockedContent.categories.includes(cat)
      )
      
      if (hasSharedCategory) {
        alternatives.push(topic)
      }
    }
    
    // Return up to 3 alternatives, sorted by difficulty (easiest first)
    return alternatives
      .sort((a, b) => (a.difficulty_level || 1) - (b.difficulty_level || 1))
      .slice(0, 3)
  }
}

/**
 * Hook to integrate content filtering with existing components
 */
export function useContentFiltering(userProfile: UserContentProfile) {
  const filterContent = async (content: TopicMetadata) => {
    return ContentFilteringService.filterContent(content, userProfile)
  }

  const filterTopics = async (topics: TopicMetadata[]) => {
    return ContentFilteringService.filterTopicList(topics, userProfile)
  }

  const getFilterSummary = () => {
    return ContentFilteringService.generateFilterSummary(userProfile)
  }

  const requiresApproval = (action: 'friend_request' | 'multiplayer_join' | 'content_access') => {
    return ContentFilteringService.requiresParentalApproval(action, userProfile)
  }

  return {
    filterContent,
    filterTopics,
    getFilterSummary,
    requiresApproval
  }
}

// Types and constants are already exported above 