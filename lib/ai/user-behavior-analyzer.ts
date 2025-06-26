/**
 * User Behavior Analyzer - BaseAITool Integration
 * 
 * Analyzes user learning patterns and generates personalized recommendations
 * through unified AI tool architecture with workflow orchestration capabilities.
 */

import { BaseAITool, type AIToolConfig, type AIToolResult } from './base-ai-tool'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

const UserInteractionSchema = z.object({
  user_id: z.string(),
  content_id: z.string(),
  content_type: z.enum(['topic', 'question', 'collection', 'survey']),
  action: z.enum(['view', 'start', 'complete', 'skip', 'bookmark', 'rate', 'share']),
  timestamp: z.string(),
  session_id: z.string(),
  duration_seconds: z.number().optional(),
  score: z.number().optional(),
  difficulty_level: z.number().optional(),
  completion_rate: z.number().optional(),
  user_rating: z.number().optional(),
  device_type: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  referrer_source: z.string().optional()
})

const LearningPatternSchema = z.object({
  user_id: z.string(),
  preferred_difficulty: z.number().min(1).max(5),
  learning_velocity: z.number(),
  optimal_session_length: z.number(),
  preferred_content_types: z.record(z.number()),
  peak_activity_hours: z.array(z.number()),
  completion_rate_by_category: z.record(z.number()),
  knowledge_retention_score: z.number(),
  engagement_trend: z.enum(['improving', 'declining', 'stable']),
  learning_style_indicators: z.object({
    visual_preference: z.number(),
    text_preference: z.number(),
    interactive_preference: z.number(),
    sequential_preference: z.number()
  })
})

const PersonalizedRecommendationSchema = z.object({
  collection_id: z.string(),
  collection_title: z.string(),
  recommendation_reason: z.string(),
  confidence_score: z.number(),
  expected_engagement: z.number(),
  estimated_completion_time: z.number(),
  difficulty_match: z.number(),
  personalization_factors: z.array(z.string()),
  optimal_timing: z.object({
    best_time_of_day: z.string(),
    suggested_session_length: z.number(),
    break_recommendations: z.array(z.string())
  }),
  learning_path_position: z.number(),
  similar_users_success_rate: z.number()
})

const BehaviorInsightSchema = z.object({
  type: z.enum(['strength', 'opportunity', 'preference', 'challenge']),
  title: z.string(),
  description: z.string(),
  data_points: z.number(),
  confidence: z.number(),
  actionable_suggestions: z.array(z.string()),
  impact_potential: z.enum(['high', 'medium', 'low'])
})

const BehaviorAnalysisInputSchema = z.object({
  userId: z.string(),
  availableCollections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    difficulty_level: z.number(),
    estimated_minutes: z.number(),
    categories: z.array(z.string()),
    skills_required: z.array(z.string()),
    completion_rate: z.number(),
    avg_rating: z.number()
  })),
  options: z.object({
    maxRecommendations: z.number().optional(),
    includeChallengingContent: z.boolean().optional(),
    optimizeForEngagement: z.boolean().optional()
  }).optional()
})

const BehaviorAnalysisOutputSchema = z.object({
  recommendations: z.array(PersonalizedRecommendationSchema),
  user_insights: z.array(BehaviorInsightSchema),
  learning_path: z.array(z.string()),
  confidence_score: z.number(),
  learning_pattern: LearningPatternSchema,
  metadata: z.object({
    interactions_analyzed: z.number(),
    pattern_confidence: z.number(),
    recommendations_generated: z.number(),
    processing_time_ms: z.number()
  })
})

type UserInteraction = z.infer<typeof UserInteractionSchema>
type LearningPattern = z.infer<typeof LearningPatternSchema>
type PersonalizedRecommendation = z.infer<typeof PersonalizedRecommendationSchema>
type BehaviorInsight = z.infer<typeof BehaviorInsightSchema>
type BehaviorAnalysisInput = z.infer<typeof BehaviorAnalysisInputSchema>
type BehaviorAnalysisOutput = z.infer<typeof BehaviorAnalysisOutputSchema>

// =============================================================================
// USER BEHAVIOR ANALYZER AI TOOL
// =============================================================================

export class UserBehaviorAnalyzerAI extends BaseAITool<BehaviorAnalysisInput, BehaviorAnalysisOutput> {
  private openai?: OpenAI
  private anthropic?: Anthropic
  
  // Analysis configuration
  private readonly ANALYSIS_WINDOW_DAYS = 30
  private readonly MIN_INTERACTIONS_FOR_PATTERN = 10
  private readonly SIMILARITY_THRESHOLD = 0.7
  private readonly CONFIDENCE_THRESHOLD = 0.6

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'User Behavior Analyzer',
      type: 'bias_analyzer',
      provider: config?.provider || 'anthropic',
      model: config?.model || 'claude-3-7-sonnet',
      maxRetries: 3,
      retryDelay: 1500,
      timeout: 90000, // 1.5 minutes for behavior analysis
      ...config
    })
  }

  // =============================================================================
  // BASE AI TOOL IMPLEMENTATION
  // =============================================================================

  protected async validateInput(input: BehaviorAnalysisInput): Promise<BehaviorAnalysisInput> {
    return BehaviorAnalysisInputSchema.parse(input)
  }

  protected async processWithAI(input: BehaviorAnalysisInput): Promise<string> {
    await this.initializeProviders()
    
    const startTime = Date.now()
    
    // Step 1: Load and analyze user behavior patterns
    const userPattern = await this.analyzeUserPattern(input.userId)
    const recentActivity = await this.getRecentActivity(input.userId)

    // Step 2: Score each collection for this user
    const scoredCollections = await this.scoreCollectionsForUser(
      input.userId,
      input.availableCollections,
      userPattern,
      input.options || {}
    )

    // Step 3: Generate insights about user behavior
    const insights = await this.generateUserInsights(input.userId, userPattern, recentActivity)

    // Step 4: Create learning path
    const learningPath = this.createOptimalLearningPath(
      scoredCollections,
      userPattern,
      input.options?.maxRecommendations || 5
    )

    // Step 5: Calculate overall confidence
    const confidenceScore = this.calculateRecommendationConfidence(
      userPattern,
      recentActivity.length,
      scoredCollections
    )

    const processingTime = Date.now() - startTime

    return JSON.stringify({
      recommendations: learningPath.slice(0, input.options?.maxRecommendations || 5),
      user_insights: insights,
      learning_path: learningPath.map(r => r.collection_id),
      confidence_score: confidenceScore,
      learning_pattern: userPattern,
      metadata: {
        interactions_analyzed: recentActivity.length,
        pattern_confidence: this.calculatePatternConfidence(userPattern, recentActivity.length),
        recommendations_generated: learningPath.length,
        processing_time_ms: processingTime
      }
    })
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<BehaviorAnalysisOutput> {
    const parsed = await this.parseJSON(rawOutput)
    return this.cleanOutput(parsed.content || parsed)
  }

  protected async validateOutput(output: BehaviorAnalysisOutput): Promise<BehaviorAnalysisOutput> {
    const validated = BehaviorAnalysisOutputSchema.parse(output)
    
    // Quality validation
    if (validated.recommendations.length === 0) {
      throw new Error('No recommendations were generated for the user')
    }
    
    if (validated.confidence_score < 0.1) {
      throw new Error('Confidence score too low - insufficient data for reliable recommendations')
    }
    
    // Ensure recommendations have proper civic focus
    for (const recommendation of validated.recommendations) {
      if (!recommendation.recommendation_reason || recommendation.recommendation_reason.length < 20) {
        throw new Error(`Recommendation "${recommendation.collection_title}" lacks proper reasoning`)
      }
    }
    
    return validated
  }

  protected async saveToSupabase(data: BehaviorAnalysisOutput): Promise<BehaviorAnalysisOutput> {
    try {
      const supabase = createServiceClient()

      // Save user learning pattern
      const { error: patternError } = await supabase
        .from('user_learning_patterns')
        .upsert({
          user_id: data.learning_pattern.user_id,
          preferred_difficulty: data.learning_pattern.preferred_difficulty,
          learning_velocity: data.learning_pattern.learning_velocity,
          optimal_session_length: data.learning_pattern.optimal_session_length,
          preferred_content_types: data.learning_pattern.preferred_content_types,
          peak_activity_hours: data.learning_pattern.peak_activity_hours,
          completion_rate_by_category: data.learning_pattern.completion_rate_by_category,
          knowledge_retention_score: data.learning_pattern.knowledge_retention_score,
          engagement_trend: data.learning_pattern.engagement_trend,
          learning_style_indicators: data.learning_pattern.learning_style_indicators,
          updated_at: new Date().toISOString()
        })

      if (patternError) {
        console.error('Error saving learning pattern:', patternError)
      }

      // Save personalized recommendations
      for (const recommendation of data.recommendations) {
        const { error: recError } = await supabase
          .from('personalized_recommendations')
          .insert({
            user_id: data.learning_pattern.user_id,
            collection_id: recommendation.collection_id,
            recommendation_reason: recommendation.recommendation_reason,
            confidence_score: recommendation.confidence_score,
            expected_engagement: recommendation.expected_engagement,
            estimated_completion_time: recommendation.estimated_completion_time,
            difficulty_match: recommendation.difficulty_match,
            personalization_factors: recommendation.personalization_factors,
            optimal_timing: recommendation.optimal_timing,
            learning_path_position: recommendation.learning_path_position,
            similar_users_success_rate: recommendation.similar_users_success_rate,
            generated_at: new Date().toISOString(),
            is_active: true
          })

        if (recError) {
          console.error('Error saving recommendation:', recError)
        }
      }

      // Log analysis activity
      await this.logActivity('behavior_analysis_completed', {
        user_id: data.learning_pattern.user_id,
        recommendations_generated: data.recommendations.length,
        insights_generated: data.user_insights.length,
        confidence_score: data.confidence_score,
        interactions_analyzed: data.metadata.interactions_analyzed
      })

      return data

    } catch (error) {
      console.error('Error saving behavior analysis to Supabase:', error)
      throw new Error(`Failed to save behavior analysis: ${error}`)
    }
  }

  // =============================================================================
  // USER BEHAVIOR ANALYSIS
  // =============================================================================

  private async initializeProviders() {
    if (this.config.provider === 'openai' && !this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
    
    if (this.config.provider === 'anthropic' && !this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    }
  }

  /**
   * Analyze user learning pattern from historical interactions
   */
  private async analyzeUserPattern(userId: string): Promise<LearningPattern> {
    // Load interactions from database
    const interactions = await this.loadUserInteractions(userId)
    
    if (interactions.length < this.MIN_INTERACTIONS_FOR_PATTERN) {
      // Return default pattern for new users
      return this.getDefaultLearningPattern(userId)
    }

    // Analyze patterns from interactions
    const pattern: LearningPattern = {
      user_id: userId,
      preferred_difficulty: this.calculatePreferredDifficulty(interactions),
      learning_velocity: this.calculateLearningVelocity(interactions),
      optimal_session_length: this.calculateOptimalSessionLength(interactions),
      preferred_content_types: this.analyzeContentTypePreferences(interactions),
      peak_activity_hours: this.identifyPeakActivityHours(interactions),
      completion_rate_by_category: await this.analyzeCompletionRatesByCategory(interactions),
      knowledge_retention_score: this.calculateKnowledgeRetention(interactions),
      engagement_trend: this.determineEngagementTrend(interactions),
      learning_style_indicators: await this.analyzeLearningStyle(interactions)
    }

    return pattern
  }

  /**
   * Score collections for a specific user
   */
  private async scoreCollectionsForUser(
    userId: string,
    collections: any[],
    userPattern: LearningPattern,
    options: any
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = []

    for (const collection of collections) {
      // Calculate various scoring factors
      const difficultyMatch = this.calculateDifficultyMatch(collection.difficulty_level, userPattern.preferred_difficulty)
      const categoryMatch = this.calculateCategoryMatch(collection.categories, userPattern.completion_rate_by_category)
      const timeMatch = this.calculateTimeMatch(collection.estimated_minutes, userPattern.optimal_session_length)
      const engagementPrediction = this.predictCollectionEngagement(collection, userPattern)

      // Combine scores with weights
      const overallScore = (
        difficultyMatch * 0.25 +
        categoryMatch * 0.25 +
        timeMatch * 0.20 +
        engagementPrediction * 0.30
      )

      if (overallScore > this.CONFIDENCE_THRESHOLD) {
        const recommendation: PersonalizedRecommendation = {
          collection_id: collection.id,
          collection_title: collection.title,
          recommendation_reason: this.generateRecommendationReason(collection, userPattern, overallScore),
          confidence_score: overallScore,
          expected_engagement: engagementPrediction,
          estimated_completion_time: this.estimateCompletionTime(collection, userPattern),
          difficulty_match: difficultyMatch,
          personalization_factors: this.getPersonalizationFactors(collection, userPattern),
          optimal_timing: this.calculateOptimalTiming(userPattern),
          learning_path_position: 0, // Will be set in learning path creation
          similar_users_success_rate: await this.getSimilarUsersSuccessRate(userId, collection.id)
        }

        recommendations.push(recommendation)
      }
    }

    return recommendations.sort((a, b) => b.confidence_score - a.confidence_score)
  }

  /**
   * Generate insights about user behavior patterns
   */
  private async generateUserInsights(
    userId: string,
    pattern: LearningPattern,
    recentActivity: UserInteraction[]
  ): Promise<BehaviorInsight[]> {
    const insights: BehaviorInsight[] = []

    // Analyze completion rate trends
    if (pattern.engagement_trend === 'improving') {
      insights.push({
        type: 'strength',
        title: 'Improving Civic Engagement',
        description: 'Your civic learning completion rates have been increasing over time',
        data_points: recentActivity.length,
        confidence: 0.8,
        actionable_suggestions: [
          'Continue with current learning pace',
          'Consider slightly more challenging civic content',
          'Explore advanced topics in government and policy'
        ],
        impact_potential: 'high'
      })
    }

    // Analyze learning velocity
    if (pattern.learning_velocity > 3) {
      insights.push({
        type: 'strength',
        title: 'Fast Civic Learner',
        description: 'You consistently complete multiple civic education items per session',
        data_points: recentActivity.filter(i => i.action === 'complete').length,
        confidence: 0.9,
        actionable_suggestions: [
          'Try collections with more advanced civic content',
          'Consider learning paths covering complex government topics',
          'Explore in-depth policy analysis materials'
        ],
        impact_potential: 'high'
      })
    }

    // Analyze difficulty preferences
    if (pattern.preferred_difficulty < 3) {
      insights.push({
        type: 'opportunity',
        title: 'Ready for Civic Challenge',
        description: 'You might benefit from gradually increasing civic content difficulty',
        data_points: recentActivity.length,
        confidence: 0.7,
        actionable_suggestions: [
          'Try one level higher difficulty in government topics',
          'Mix easier and harder civic content for balanced learning',
          'Challenge yourself with constitutional law or policy analysis'
        ],
        impact_potential: 'medium'
      })
    }

    // Analyze knowledge retention
    if (pattern.knowledge_retention_score > 0.8) {
      insights.push({
        type: 'strength',
        title: 'Excellent Civic Knowledge Retention',
        description: 'You demonstrate strong retention of civic knowledge over time',
        data_points: recentActivity.filter(i => i.score !== undefined).length,
        confidence: 0.9,
        actionable_suggestions: [
          'Focus on advanced civic topics',
          'Consider teaching or sharing civic knowledge with others',
          'Engage in civic action and community organizing'
        ],
        impact_potential: 'high'
      })
    }

    return insights
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private calculatePreferredDifficulty(interactions: UserInteraction[]): number {
    const completedItems = interactions.filter(i => i.action === 'complete' && i.difficulty_level)
    if (completedItems.length === 0) return 3 // Default medium difficulty

    const avgDifficulty = completedItems.reduce((sum, i) => sum + (i.difficulty_level || 3), 0) / completedItems.length
    return Math.round(avgDifficulty)
  }

  private calculateLearningVelocity(interactions: UserInteraction[]): number {
    // Group interactions by session
    const sessions = new Map<string, UserInteraction[]>()
    for (const interaction of interactions) {
      const sessionInteractions = sessions.get(interaction.session_id) || []
      sessionInteractions.push(interaction)
      sessions.set(interaction.session_id, sessionInteractions)
    }

    // Calculate average completions per session
    const completionsPerSession = Array.from(sessions.values()).map(
      sessionInteractions => sessionInteractions.filter(i => i.action === 'complete').length
    )

    return completionsPerSession.length > 0 
      ? completionsPerSession.reduce((a, b) => a + b, 0) / completionsPerSession.length
      : 1
  }

  private calculateOptimalSessionLength(interactions: UserInteraction[]): number {
    const sessionDurations = interactions
      .filter(i => i.duration_seconds && i.duration_seconds > 60) // Filter out very short sessions
      .map(i => i.duration_seconds! / 60) // Convert to minutes

    return sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 20 // Default 20 minutes
  }

  private analyzeContentTypePreferences(interactions: UserInteraction[]): Record<string, number> {
    const typeInteractions = interactions.filter(i => i.action === 'complete')
    const typeCounts = new Map<string, number>()
    
    for (const interaction of typeInteractions) {
      const count = typeCounts.get(interaction.content_type) || 0
      typeCounts.set(interaction.content_type, count + 1)
    }

    const total = typeInteractions.length || 1
    const preferences: Record<string, number> = {}
    
    for (const [type, count] of typeCounts.entries()) {
      preferences[type] = count / total
    }

    return preferences
  }

  private identifyPeakActivityHours(interactions: UserInteraction[]): number[] {
    const hourCounts = new Array(24).fill(0)
    
    for (const interaction of interactions) {
      const hour = new Date(interaction.timestamp).getHours()
      hourCounts[hour]++
    }

    // Find hours with above-average activity
    const avgActivity = hourCounts.reduce((a, b) => a + b, 0) / 24
    const peakHours: number[] = []
    
    for (let hour = 0; hour < 24; hour++) {
      if (hourCounts[hour] > avgActivity * 1.5) {
        peakHours.push(hour)
      }
    }

    return peakHours.length > 0 ? peakHours : [9, 14, 19] // Default peak hours
  }

  private async analyzeCompletionRatesByCategory(interactions: UserInteraction[]): Promise<Record<string, number>> {
    try {
      const supabase = createServiceClient()
      const categoryStats: Record<string, { completed: number; started: number }> = {}

      // Group interactions by category
      for (const interaction of interactions) {
        if (interaction.content_type === 'topic') {
          // Get category for this topic
          const { data: topicData } = await supabase
            .from('question_topics')
            .select(`
              category_id,
              categories(name)
            `)
            .eq('topic_id', interaction.content_id)
            .single()

          if (topicData?.categories) {
            const categoryName = topicData.categories[0]?.name
            
            if (!categoryStats[categoryName]) {
              categoryStats[categoryName] = { completed: 0, started: 0 }
            }

            if (interaction.action === 'complete') {
              categoryStats[categoryName].completed++
              categoryStats[categoryName].started++
            } else if (interaction.action === 'start') {
              categoryStats[categoryName].started++
            }
          }
        }
      }

      // Calculate completion rates
      const completionRates: Record<string, number> = {}
      for (const [category, stats] of Object.entries(categoryStats)) {
        if (stats.started > 0) {
          completionRates[category] = stats.completed / stats.started
        }
      }

      // If no data, provide civic education defaults
      if (Object.keys(completionRates).length === 0) {
    return {
          'Constitutional Foundations': 0.7,
          'Electoral Process': 0.65,
      'Government Structure': 0.75,
          'Policy & Legislation': 0.6,
          'Civic Engagement': 0.8,
          'Rights & Responsibilities': 0.7
        }
      }

      return completionRates

    } catch (error) {
      console.error('Error analyzing completion rates by category:', error)
      return { 'general': 0.7 }
    }
  }

  private calculateKnowledgeRetention(interactions: UserInteraction[]): number {
    const scoredInteractions = interactions.filter(i => i.score !== undefined)
    if (scoredInteractions.length === 0) return 0.7 // Default

    // Calculate trend in scores over time
    const scores = scoredInteractions.map(i => i.score!)
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    return Math.min(avgScore / 100, 1.0) // Normalize to 0-1
  }

  private determineEngagementTrend(interactions: UserInteraction[]): 'improving' | 'declining' | 'stable' {
    if (interactions.length < 10) return 'stable'

    // Split interactions into first and second half
    const midpoint = Math.floor(interactions.length / 2)
    const firstHalf = interactions.slice(0, midpoint)
    const secondHalf = interactions.slice(midpoint)

    const firstHalfCompletions = firstHalf.filter(i => i.action === 'complete').length / firstHalf.length
    const secondHalfCompletions = secondHalf.filter(i => i.action === 'complete').length / secondHalf.length

    const difference = secondHalfCompletions - firstHalfCompletions
    
    if (difference > 0.1) return 'improving'
    if (difference < -0.1) return 'declining'
    return 'stable'
  }

  private async analyzeLearningStyle(interactions: UserInteraction[]): Promise<LearningPattern['learning_style_indicators']> {
    try {
      const styleMetrics = {
        visual_interactions: 0,
        text_interactions: 0,
        interactive_interactions: 0,
        sequential_patterns: 0,
        total_interactions: interactions.length
      }

      // Analyze interaction patterns to infer learning style preferences
      for (const interaction of interactions) {
        // Visual preference: longer engagement with visual content
        if (interaction.duration_seconds && interaction.duration_seconds > 300) { // 5+ minutes
          styleMetrics.visual_interactions++
        }

        // Text preference: completion of reading-heavy content
        if (interaction.content_type === 'topic' && interaction.action === 'complete') {
          styleMetrics.text_interactions++
        }

        // Interactive preference: quiz completions and high engagement
        if (interaction.action === 'complete' && interaction.score !== undefined) {
          styleMetrics.interactive_interactions++
        }
      }

      // Sequential preference: analyze if user follows recommended learning paths
      const sessionOrder = this.analyzeSessionSequentiality(interactions)
      styleMetrics.sequential_patterns = sessionOrder

      // Calculate preferences as ratios
      const total = Math.max(styleMetrics.total_interactions, 1)
      
    return {
        visual_preference: Math.min(styleMetrics.visual_interactions / total * 2, 1), // Scale up visual signals
        text_preference: Math.min(styleMetrics.text_interactions / total * 1.5, 1),
        interactive_preference: Math.min(styleMetrics.interactive_interactions / total * 1.8, 1),
        sequential_preference: sessionOrder
      }

    } catch (error) {
      console.error('Error analyzing learning style:', error)
      return {
        visual_preference: 0.6,
        text_preference: 0.7,
        interactive_preference: 0.8,
        sequential_preference: 0.5
      }
    }
  }

  /**
   * Analyze if user follows sequential learning patterns
   */
  private analyzeSessionSequentiality(interactions: UserInteraction[]): number {
    if (interactions.length < 3) return 0.5 // Default for insufficient data

    // Group interactions by session
    const sessions = new Map<string, UserInteraction[]>()
    for (const interaction of interactions) {
      const sessionInteractions = sessions.get(interaction.session_id) || []
      sessionInteractions.push(interaction)
      sessions.set(interaction.session_id, sessionInteractions)
    }

    let sequentialSessions = 0
    let totalSessions = 0

    for (const sessionInteractions of sessions.values()) {
      if (sessionInteractions.length < 2) continue

      totalSessions++
      
      // Sort by timestamp to check sequence
      const sortedInteractions = sessionInteractions.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Check if interactions follow a logical progression
      let isSequential = true
      for (let i = 1; i < sortedInteractions.length; i++) {
        const prev = sortedInteractions[i - 1]
        const curr = sortedInteractions[i]

        // Sequential if: start -> view -> complete pattern
        // Or if difficulty levels progress logically
        if (prev.action === 'start' && curr.action === 'complete') {
          continue // Good sequence
        } else if (prev.difficulty_level && curr.difficulty_level) {
          if (curr.difficulty_level > prev.difficulty_level + 1) {
            isSequential = false // Skipped difficulty levels
            break
          }
        }
      }

      if (isSequential) {
        sequentialSessions++
      }
    }

    return totalSessions > 0 ? sequentialSessions / totalSessions : 0.5
  }

  /**
   * Infer the primary content type of a collection
   */
  private inferCollectionContentType(collection: any): string {
    // Check collection metadata for content type hints
    if (collection.skills_required && collection.skills_required.length > 0) {
      return 'collection' // Skill-based collections
    }
    
    if (collection.title) {
      const title = collection.title.toLowerCase()
      if (title.includes('quiz') || title.includes('test') || title.includes('assessment')) {
        return 'question'
      }
      if (title.includes('survey') || title.includes('poll')) {
        return 'survey'
      }
    }

    // Default to topic for general content
    return 'topic'
  }

  /**
   * Estimate content complexity based on collection metadata
   */
  private estimateContentComplexity(collection: any): number {
    let complexity = 0.5 // Base complexity

    // Factor in difficulty level
    if (collection.difficulty_level) {
      complexity = collection.difficulty_level / 5 // Normalize to 0-1
    }

    // Factor in estimated time (longer = more complex)
    if (collection.estimated_minutes) {
      const timeComplexity = Math.min(collection.estimated_minutes / 60, 1) // Cap at 1 hour
      complexity = (complexity + timeComplexity) / 2
    }

    // Factor in skills required
    if (collection.skills_required && collection.skills_required.length > 0) {
      const skillComplexity = Math.min(collection.skills_required.length / 5, 1) // Cap at 5 skills
      complexity = (complexity + skillComplexity) / 2
    }

    return Math.max(0.1, Math.min(1.0, complexity))
  }

  /**
   * Calculate similarity between two user learning patterns
   */
  private calculateUserSimilarity(pattern1: LearningPattern, pattern2: any): number {
    let similarity = 0
    let factors = 0

    // Compare difficulty preferences (30% weight)
    const difficultyDiff = Math.abs(pattern1.preferred_difficulty - pattern2.preferred_difficulty)
    const difficultySim = Math.max(0, 1 - (difficultyDiff / 5)) // Normalize by max difference
    similarity += difficultySim * 0.3
    factors++

    // Compare learning velocity (25% weight)
    const velocityRatio = Math.min(pattern1.learning_velocity, pattern2.learning_velocity) / 
                         Math.max(pattern1.learning_velocity, pattern2.learning_velocity)
    similarity += velocityRatio * 0.25
    factors++

    // Compare session length preferences (20% weight)
    const sessionRatio = Math.min(pattern1.optimal_session_length, pattern2.optimal_session_length) / 
                        Math.max(pattern1.optimal_session_length, pattern2.optimal_session_length)
    similarity += sessionRatio * 0.2
    factors++

    // Compare category completion rates (25% weight)
    if (pattern2.completion_rate_by_category) {
      let categorySimTotal = 0
      let categoryComparisons = 0

      for (const category in pattern1.completion_rate_by_category) {
        if (pattern2.completion_rate_by_category[category] !== undefined) {
          const rate1 = pattern1.completion_rate_by_category[category]
          const rate2 = pattern2.completion_rate_by_category[category]
          const categoryDiff = Math.abs(rate1 - rate2)
          categorySimTotal += Math.max(0, 1 - categoryDiff)
          categoryComparisons++
        }
      }

      if (categoryComparisons > 0) {
        similarity += (categorySimTotal / categoryComparisons) * 0.25
        factors++
      }
    }

    return factors > 0 ? similarity / factors : 0
  }

  /**
   * Get success rate for similar collections when no direct data exists
   */
  private async getSimilarCollectionSuccessRate(similarUsers: string[], collectionId: string): Promise<number> {
    try {
      const supabase = createServiceClient()

      // Get the target collection's categories and difficulty
      const { data: targetCollection } = await supabase
        .from('collections')
        .select('categories, difficulty_level, estimated_minutes')
        .eq('id', collectionId)
        .single()

      if (!targetCollection) return 0.65

      // Find collections with similar characteristics
      const { data: similarCollections } = await supabase
        .from('collections')
        .select('id')
        .eq('difficulty_level', targetCollection.difficulty_level)
        .overlaps('categories', targetCollection.categories || [])
        .neq('id', collectionId)
        .limit(10)

      if (!similarCollections || similarCollections.length === 0) return 0.65

      const similarCollectionIds = similarCollections.map(c => c.id)

      // Get success rates for similar collections among similar users
      const { data: attempts } = await supabase
        .from('user_collection_progress')
        .select('completion_percentage, completed')
        .in('user_id', similarUsers)
        .in('collection_id', similarCollectionIds)

      if (!attempts || attempts.length === 0) return 0.65

      const successfulAttempts = attempts.filter(
        attempt => attempt.completed || (attempt.completion_percentage && attempt.completion_percentage >= 80)
      ).length

      return successfulAttempts / attempts.length

    } catch (error) {
      console.error('Error getting similar collection success rate:', error)
      return 0.65
    }
  }

  private getDefaultLearningPattern(userId: string): LearningPattern {
    return {
      user_id: userId,
      preferred_difficulty: 3,
      learning_velocity: 2,
      optimal_session_length: 20,
      preferred_content_types: { 'topic': 0.4, 'question': 0.3, 'collection': 0.2, 'survey': 0.1 },
      peak_activity_hours: [9, 14, 19],
      completion_rate_by_category: { 'general': 0.7 },
      knowledge_retention_score: 0.7,
      engagement_trend: 'stable',
      learning_style_indicators: {
        visual_preference: 0.6,
        text_preference: 0.7,
        interactive_preference: 0.8,
        sequential_preference: 0.5
      }
    }
  }

  private async loadUserInteractions(userId: string): Promise<UserInteraction[]> {
    try {
      const supabase = createServiceClient()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.ANALYSIS_WINDOW_DAYS)

      // Load user quiz attempts
      const { data: quizAttempts } = await supabase
        .from('user_quiz_attempts')
        .select(`
          id,
          topic_id,
          score,
          completed_at,
          time_spent_seconds,
          question_topics!inner(
            category_id,
            difficulty_level,
            categories(name)
          )
        `)
        .eq('user_id', userId)
        .gte('completed_at', cutoffDate.toISOString())
        .order('completed_at', { ascending: false })

      // Load user content interactions
      const { data: contentViews } = await supabase
        .from('user_content_interactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })

      // Load bookmark actions
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select(`
          id,
          content_id,
          content_type,
          created_at
        `)
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())

      const interactions: UserInteraction[] = []

      // Convert quiz attempts to interactions
      if (quizAttempts) {
        for (const attempt of quizAttempts) {
          interactions.push({
            user_id: userId,
            content_id: attempt.topic_id,
            content_type: 'topic',
            action: 'complete',
            timestamp: attempt.completed_at,
            session_id: attempt.id,
            duration_seconds: attempt.time_spent_seconds || undefined,
            score: attempt.score || undefined,
            difficulty_level: attempt.question_topics?.[0]?.difficulty_level || undefined,
            completion_rate: attempt.score ? attempt.score / 100 : undefined
          })
        }
      }

      // Convert content views to interactions
      if (contentViews) {
        for (const view of contentViews) {
          interactions.push({
            user_id: userId,
            content_id: view.content_id,
            content_type: view.content_type as any,
            action: view.interaction_type as any,
            timestamp: view.created_at,
            session_id: view.session_id || view.id,
            duration_seconds: view.duration_seconds,
            device_type: view.device_type as any,
            referrer_source: view.referrer_source
          })
        }
      }

      // Convert bookmarks to interactions
      if (bookmarks) {
        for (const bookmark of bookmarks) {
          interactions.push({
            user_id: userId,
            content_id: bookmark.content_id,
            content_type: bookmark.content_type as any,
            action: 'bookmark',
            timestamp: bookmark.created_at,
            session_id: bookmark.id
          })
        }
      }

      return interactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    } catch (error) {
      console.error('Error loading user interactions:', error)
    return []
    }
  }

  private calculateDifficultyMatch(collectionDifficulty: number, userPreference: number): number {
    const diff = Math.abs(collectionDifficulty - userPreference)
    return Math.max(0, 1 - (diff / 5)) // Scale difference to 0-1
  }

  private calculateCategoryMatch(categories: string[], userRates: Record<string, number>): number {
    let totalMatch = 0
    let categoryCount = 0

    for (const category of categories) {
      const rate = userRates[category] || 0.5 // Default if no data
      totalMatch += rate
      categoryCount++
    }

    return categoryCount > 0 ? totalMatch / categoryCount : 0.5
  }

  private calculateTimeMatch(estimatedMinutes: number, userOptimal: number): number {
    const ratio = estimatedMinutes / userOptimal
    return Math.max(0, 1 - Math.abs(1 - ratio)) // Best match when ratio is 1
  }

  private predictCollectionEngagement(collection: any, pattern: LearningPattern): number {
    try {
      let engagementScore = 0.5 // Base score
      let factors = 0

      // Factor 1: Difficulty alignment (25% weight)
      const difficultyAlignment = this.calculateDifficultyMatch(collection.difficulty_level, pattern.preferred_difficulty)
      engagementScore += difficultyAlignment * 0.25
      factors++

      // Factor 2: Category preference (20% weight)
      if (collection.categories && Array.isArray(collection.categories)) {
        let categoryScore = 0
        for (const category of collection.categories) {
          const categoryRate = pattern.completion_rate_by_category[category] || 0.5
          categoryScore += categoryRate
        }
        categoryScore = categoryScore / collection.categories.length
        engagementScore += categoryScore * 0.20
        factors++
      }

      // Factor 3: Time commitment match (15% weight)
      const timeRatio = collection.estimated_minutes / pattern.optimal_session_length
      let timeScore = 1.0
      if (timeRatio > 1.5) timeScore = 0.6 // Too long
      else if (timeRatio < 0.3) timeScore = 0.7 // Too short
      else timeScore = 1.0 - Math.abs(1 - timeRatio) * 0.5 // Optimal around 1.0

      engagementScore += timeScore * 0.15
      factors++

      // Factor 4: Content type preference (15% weight)
      const primaryType = this.inferCollectionContentType(collection)
      const typePreference = pattern.preferred_content_types[primaryType] || 0.5
      engagementScore += typePreference * 0.15
      factors++

      // Factor 5: User's learning velocity match (10% weight)
      // Collections with more content suit users with higher velocity
      const contentComplexity = this.estimateContentComplexity(collection)
      const velocityMatch = Math.min(pattern.learning_velocity / 3, 1.0) // Normalize to 0-1
      const velocityScore = contentComplexity <= velocityMatch ? 1.0 : 0.6
      engagementScore += velocityScore * 0.10
      factors++

      // Factor 6: Retention score influence (10% weight)
      const retentionBonus = pattern.knowledge_retention_score > 0.8 ? 0.1 : 0
      engagementScore += retentionBonus * 0.10
      factors++

      // Factor 7: Engagement trend (5% weight)
      let trendMultiplier = 1.0
      if (pattern.engagement_trend === 'improving') trendMultiplier = 1.1
      else if (pattern.engagement_trend === 'declining') trendMultiplier = 0.9
      
      engagementScore *= trendMultiplier

      // Ensure score is between 0 and 1
      return Math.max(0.1, Math.min(1.0, engagementScore))

    } catch (error) {
      console.error('Error predicting collection engagement:', error)
      return 0.5 // Safe default
    }
  }

  private generateRecommendationReason(collection: any, pattern: LearningPattern, score: number): string {
    return `Recommended based on your civic learning preferences (${Math.round(score * 100)}% match)`
  }

  private estimateCompletionTime(collection: any, pattern: LearningPattern): number {
    return collection.estimated_minutes * (1 / pattern.learning_velocity)
  }

  private getPersonalizationFactors(collection: any, pattern: LearningPattern): string[] {
    return ['Difficulty match', 'Time preference', 'Content type preference']
  }

  private calculateOptimalTiming(pattern: LearningPattern): any {
    return {
      best_time_of_day: pattern.peak_activity_hours[0] ? `${pattern.peak_activity_hours[0]}:00` : '14:00',
      suggested_session_length: pattern.optimal_session_length,
      break_recommendations: ['Take breaks every 25 minutes', 'Review previous content before starting']
    }
  }

  private async getSimilarUsersSuccessRate(userId: string, collectionId: string): Promise<number> {
    try {
      const supabase = createServiceClient()

      // Get current user's learning pattern characteristics
      const currentUserPattern = await this.analyzeUserPattern(userId)

      // Find users with similar patterns
      const { data: similarPatterns } = await supabase
        .from('user_learning_patterns')
        .select('user_id, preferred_difficulty, learning_velocity, completion_rate_by_category')
        .neq('user_id', userId)

      if (!similarPatterns || similarPatterns.length === 0) {
        return 0.65 // Default when no similar users found
      }

      // Calculate similarity scores for each user
      const similarUsers: string[] = []
      
      for (const pattern of similarPatterns) {
        const similarity = this.calculateUserSimilarity(currentUserPattern, pattern)
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          similarUsers.push(pattern.user_id)
        }
      }

      if (similarUsers.length === 0) {
        return 0.65 // Default when no sufficiently similar users
      }

      // Get success rates for this collection among similar users
      const { data: collectionAttempts } = await supabase
        .from('user_collection_progress')
        .select('user_id, completion_percentage, completed')
        .in('user_id', similarUsers)
        .eq('collection_id', collectionId)

      if (!collectionAttempts || collectionAttempts.length === 0) {
        // No data for this collection, check similar collections in same categories
        return await this.getSimilarCollectionSuccessRate(similarUsers, collectionId)
      }

      // Calculate success rate (users who completed >= 80% of collection)
      const successfulCompletions = collectionAttempts.filter(
        attempt => attempt.completed || (attempt.completion_percentage && attempt.completion_percentage >= 80)
      ).length

      const successRate = successfulCompletions / collectionAttempts.length

      // Adjust for civic engagement context (be slightly optimistic to encourage civic participation)
      return Math.min(successRate * 1.1, 0.95)

    } catch (error) {
      console.error('Error calculating similar users success rate:', error)
      return 0.65 // Conservative default
    }
  }

  private createOptimalLearningPath(recommendations: PersonalizedRecommendation[], pattern: LearningPattern, maxItems: number): PersonalizedRecommendation[] {
    // Sort by confidence and set learning path positions
    const sorted = recommendations.slice(0, maxItems)
    return sorted.map((rec, index) => ({
      ...rec,
      learning_path_position: index + 1
    }))
  }

  private calculateRecommendationConfidence(pattern: LearningPattern, interactionCount: number, recommendations: PersonalizedRecommendation[]): number {
    // Base confidence on interaction count and average recommendation scores
    const dataConfidence = Math.min(interactionCount / 50, 1.0) // Full confidence at 50+ interactions
    const avgRecScore = recommendations.length > 0 
      ? recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length 
      : 0.5
    
    return (dataConfidence * 0.6) + (avgRecScore * 0.4)
  }

  private calculatePatternConfidence(pattern: LearningPattern, interactionCount: number): number {
    return Math.min(interactionCount / this.MIN_INTERACTIONS_FOR_PATTERN, 1.0)
  }

  private async getRecentActivity(userId: string): Promise<UserInteraction[]> {
    try {
      const supabase = createServiceClient()
      const recentCutoff = new Date()
      recentCutoff.setDate(recentCutoff.getDate() - 7) // Last 7 days

      // Get recent quiz attempts
      const { data: recentQuizzes } = await supabase
        .from('user_quiz_attempts')
        .select(`
          id,
          topic_id,
          score,
          completed_at,
          time_spent_seconds,
          question_topics!inner(
            difficulty_level,
            category_id,
            categories(name)
          )
        `)
        .eq('user_id', userId)
        .gte('completed_at', recentCutoff.toISOString())
        .order('completed_at', { ascending: false })
        .limit(20)

      // Get recent content interactions
      const { data: recentContent } = await supabase
        .from('user_content_interactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', recentCutoff.toISOString())
        .order('created_at', { ascending: false })
        .limit(30)

      // Get recent bookmarks
      const { data: recentBookmarks } = await supabase
        .from('bookmarks')
        .select('id, content_id, content_type, created_at')
        .eq('user_id', userId)
        .gte('created_at', recentCutoff.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      const recentInteractions: UserInteraction[] = []

      // Convert recent quiz attempts
      if (recentQuizzes) {
        for (const quiz of recentQuizzes) {
          recentInteractions.push({
            user_id: userId,
            content_id: quiz.topic_id,
            content_type: 'topic',
            action: 'complete',
            timestamp: quiz.completed_at,
            session_id: quiz.id,
            duration_seconds: quiz.time_spent_seconds || undefined,
            score: quiz.score || undefined,
            difficulty_level: quiz.question_topics?.[0]?.difficulty_level || undefined
          })
        }
      }

      // Convert recent content interactions
      if (recentContent) {
        for (const content of recentContent) {
          recentInteractions.push({
            user_id: userId,
            content_id: content.content_id,
            content_type: content.content_type as any,
            action: content.interaction_type as any,
            timestamp: content.created_at,
            session_id: content.session_id || content.id,
            duration_seconds: content.duration_seconds,
            device_type: content.device_type as any
          })
        }
      }

      // Convert recent bookmarks
      if (recentBookmarks) {
        for (const bookmark of recentBookmarks) {
          recentInteractions.push({
            user_id: userId,
            content_id: bookmark.content_id,
            content_type: bookmark.content_type as any,
            action: 'bookmark',
            timestamp: bookmark.created_at,
            session_id: bookmark.id
          })
        }
      }

      return recentInteractions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

    } catch (error) {
      console.error('Error loading recent activity:', error)
    return []
    }
  }

  // =============================================================================
  // WORKFLOW ORCHESTRATION METHODS
  // =============================================================================

  /**
   * Analyze multiple users in batch
   */
  async analyzeBatch(analyses: BehaviorAnalysisInput[]): Promise<AIToolResult<BehaviorAnalysisOutput[]>> {
    const results: BehaviorAnalysisOutput[] = []
    const errors: string[] = []

    for (const analysis of analyses) {
      try {
        const result = await this.process(analysis)
        if (result.success && result.data) {
          results.push(result.data)
        } else {
          errors.push(`User ${analysis.userId}: ${result.error}`)
        }
      } catch (error) {
        errors.push(`User ${analysis.userId}: ${error}`)
      }
    }

    // Log batch analysis
    await this.logActivity('batch_analysis_completed', {
      users_analyzed: analyses.length,
      successful_analyses: results.length,
      failed_analyses: errors.length
    })

    return {
      success: errors.length === 0,
      data: results,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      metadata: {
        toolName: this.config.name,
        provider: this.config.provider,
        model: this.config.model,
        processingTime: 0,
        retryCount: 0
      }
    }
  }

  /**
   * Get workflow step configuration for orchestration
   */
  static getWorkflowStepConfig() {
    return {
      id: 'user_behavior_analysis',
      name: 'Analyze User Learning Behavior',
      type: 'behavior_analysis',
      inputs: ['user_data', 'available_collections'],
      outputs: ['personalized_recommendations', 'learning_insights'],
      config: {
        batch_processing: true,
        max_users_per_batch: 10,
        include_learning_path: true,
        generate_insights: true
      }
    }
  }

  /**
   * Track user interaction for real-time pattern updates
   */
  async trackInteraction(interaction: UserInteraction): Promise<{
    pattern_updated: boolean
    new_insights: string[]
    recommendation_adjustments: string[]
  }> {
    try {
      // Validate interaction
      const validatedInteraction = UserInteractionSchema.parse(interaction)
      
      // Store interaction in database
      const supabase = createServiceClient()
      await supabase
        .from('user_interactions')
        .insert(validatedInteraction)

      // Analyze new interaction for insights
      const newInsights = this.analyzeNewInteraction(validatedInteraction)
      
      // Determine recommendation adjustments
      const adjustments = this.determineRecommendationAdjustments(validatedInteraction)

      return {
        pattern_updated: true,
        new_insights: newInsights,
        recommendation_adjustments: adjustments
      }
    } catch (error) {
      console.error('Error tracking user interaction:', error)
      return {
        pattern_updated: false,
        new_insights: [],
        recommendation_adjustments: []
      }
    }
  }

  private analyzeNewInteraction(interaction: UserInteraction): string[] {
    const insights: string[] = []

    try {
      // Analyze performance indicators
      if (interaction.score !== undefined) {
        if (interaction.score >= 90) {
          insights.push('Excellent civic knowledge demonstration - ready for advanced content')
          insights.push('Consider challenging constitutional law or policy analysis topics')
        } else if (interaction.score >= 70) {
          insights.push('Solid civic understanding - continue building knowledge systematically')
          insights.push('Focus on connecting different areas of government and policy')
        } else if (interaction.score < 50) {
          insights.push('Foundational civic concepts need reinforcement')
          insights.push('Recommend reviewing basic government structure and functions')
        }
      }

      // Analyze engagement duration
      if (interaction.duration_seconds) {
        if (interaction.duration_seconds > 600) { // 10+ minutes
          insights.push('Deep engagement with civic content - highly motivated learner')
          insights.push('Ready for comprehensive civic education materials')
        } else if (interaction.duration_seconds < 60) { // Less than 1 minute
          insights.push('Brief engagement - may need more compelling civic content')
          insights.push('Consider interactive or scenario-based learning approaches')
        }
      }

      // Analyze content type patterns
      if (interaction.content_type === 'topic' && interaction.action === 'complete') {
        insights.push('Successfully completing civic topics - building democratic knowledge')
      } else if (interaction.content_type === 'survey' && interaction.action === 'complete') {
        insights.push('Engaged with civic surveys - shows commitment to participation')
      } else if (interaction.action === 'bookmark') {
        insights.push('Saving civic content for review - indicates thoughtful engagement')
      }

      // Time-based insights
      const hour = new Date(interaction.timestamp).getHours()
      if (hour >= 22 || hour <= 6) {
        insights.push('Late-night civic learning - highly dedicated to democratic education')
      } else if (hour >= 9 && hour <= 17) {
        insights.push('Daytime civic engagement - integrating learning with daily routine')
      }

      return insights.length > 0 ? insights : [`New ${interaction.action} action recorded for ${interaction.content_type}`]

    } catch (error) {
      console.error('Error analyzing new interaction:', error)
      return [`Recorded ${interaction.action} for ${interaction.content_type} content`]
    }
  }

  private determineRecommendationAdjustments(interaction: UserInteraction): string[] {
    const adjustments: string[] = []

    try {
      // Performance-based adjustments
      if (interaction.score !== undefined) {
        if (interaction.score >= 85) {
          adjustments.push('Increase difficulty level for next recommendations')
          adjustments.push('Include more complex policy analysis and constitutional law')
          adjustments.push('Add advanced civic engagement scenarios')
        } else if (interaction.score < 60) {
          adjustments.push('Focus on foundational civic concepts')
          adjustments.push('Recommend remedial government structure content')
          adjustments.push('Include more basic rights and responsibilities materials')
        }
      }

      // Content type preferences
      if (interaction.action === 'complete') {
        adjustments.push(`Prioritize ${interaction.content_type} content in future recommendations`)
        
        if (interaction.content_type === 'question') {
          adjustments.push('User engages well with interactive quiz format')
        } else if (interaction.content_type === 'topic') {
          adjustments.push('User completes reading-based civic content effectively')
        }
      } else if (interaction.action === 'skip') {
        adjustments.push(`Reduce ${interaction.content_type} content frequency`)
        adjustments.push('Consider alternative content formats for this topic area')
      }

      // Engagement duration adjustments
      if (interaction.duration_seconds) {
        if (interaction.duration_seconds > 900) { // 15+ minutes
          adjustments.push('User can handle longer-form civic content')
          adjustments.push('Recommend comprehensive policy analysis and legislative deep-dives')
        } else if (interaction.duration_seconds < 180) { // Less than 3 minutes
          adjustments.push('Recommend shorter, more focused civic content pieces')
          adjustments.push('Break complex topics into digestible segments')
        }
      }

      // Device-based adjustments
      if (interaction.device_type === 'mobile') {
        adjustments.push('Optimize for mobile-friendly civic content')
        adjustments.push('Prioritize interactive and visual learning materials')
      } else if (interaction.device_type === 'desktop') {
        adjustments.push('Can recommend text-heavy and detailed civic analysis')
        adjustments.push('Include complex charts and policy documents')
      }

      // Difficulty level adjustments
      if (interaction.difficulty_level !== undefined) {
        if (interaction.score !== undefined && interaction.score >= 80 && interaction.difficulty_level < 4) {
          adjustments.push(`Increase difficulty from level ${interaction.difficulty_level} to ${interaction.difficulty_level + 1}`)
        } else if (interaction.score !== undefined && interaction.score < 60 && interaction.difficulty_level > 2) {
          adjustments.push(`Decrease difficulty from level ${interaction.difficulty_level} to ${interaction.difficulty_level - 1}`)
        }
      }

      return adjustments.length > 0 ? adjustments : ['Consider similar content types', 'Adjust based on engagement patterns']

    } catch (error) {
      console.error('Error determining recommendation adjustments:', error)
      return ['Monitor user preferences', 'Adjust content recommendations based on engagement']
    }
  }
} 