/**
 * User Behavior Analysis System for Personalized Collection Recommendations
 * 
 * Analyzes user interactions, learning patterns, and preferences to:
 * - Recommend optimal collections for individual users
 * - Predict content engagement likelihood
 * - Suggest learning paths based on behavior patterns
 * - Optimize collection difficulty and pacing
 */

interface UserInteraction {
  user_id: string
  content_id: string
  content_type: 'topic' | 'question' | 'collection' | 'survey'
  action: 'view' | 'start' | 'complete' | 'skip' | 'bookmark' | 'rate' | 'share'
  timestamp: string
  session_id: string
  duration_seconds?: number
  score?: number
  difficulty_level?: number
  completion_rate?: number
  user_rating?: number
  device_type?: 'mobile' | 'desktop' | 'tablet'
  referrer_source?: string
}

interface LearningPattern {
  user_id: string
  preferred_difficulty: number // 1-5 scale
  learning_velocity: number // content items per session
  optimal_session_length: number // minutes
  preferred_content_types: Record<string, number> // type -> preference score
  peak_activity_hours: number[] // hours of day when most active
  completion_rate_by_category: Record<string, number>
  knowledge_retention_score: number // based on quiz performance over time
  engagement_trend: 'improving' | 'declining' | 'stable'
  learning_style_indicators: {
    visual_preference: number
    text_preference: number
    interactive_preference: number
    sequential_preference: number
  }
}

interface PersonalizedRecommendation {
  collection_id: string
  collection_title: string
  recommendation_reason: string
  confidence_score: number
  expected_engagement: number
  estimated_completion_time: number
  difficulty_match: number
  personalization_factors: string[]
  optimal_timing: {
    best_time_of_day: string
    suggested_session_length: number
    break_recommendations: string[]
  }
  learning_path_position: number
  similar_users_success_rate: number
}

interface BehaviorInsight {
  type: 'strength' | 'opportunity' | 'preference' | 'challenge'
  title: string
  description: string
  data_points: number
  confidence: number
  actionable_suggestions: string[]
  impact_potential: 'high' | 'medium' | 'low'
}

export class UserBehaviorAnalyzer {
  private userPatterns = new Map<string, LearningPattern>()
  private recentInteractions = new Map<string, UserInteraction[]>()
  
  // Analysis configuration
  private readonly ANALYSIS_WINDOW_DAYS = 30
  private readonly MIN_INTERACTIONS_FOR_PATTERN = 10
  private readonly SIMILARITY_THRESHOLD = 0.7
  private readonly CONFIDENCE_THRESHOLD = 0.6

  /**
   * Analyze user behavior and generate personalized collection recommendations
   */
  async generatePersonalizedRecommendations(
    userId: string,
    availableCollections: Array<{
      id: string
      title: string
      difficulty_level: number
      estimated_minutes: number
      categories: string[]
      skills_required: string[]
      completion_rate: number
      avg_rating: number
    }>,
    options: {
      maxRecommendations?: number
      includeChallengingContent?: boolean
      optimizeForEngagement?: boolean
    } = {}
  ): Promise<{
    recommendations: PersonalizedRecommendation[]
    user_insights: BehaviorInsight[]
    learning_path: string[]
    confidence_score: number
  }> {
    const {
      maxRecommendations = 5,
      includeChallengingContent = true,
      optimizeForEngagement = true
    } = options

    console.log(`🎯 Generating personalized recommendations for user ${userId}`)

    // Step 1: Load and analyze user behavior patterns
    const userPattern = await this.analyzeUserPattern(userId)
    const recentActivity = await this.getRecentActivity(userId)

    // Step 2: Score each collection for this user
    const scoredCollections = await this.scoreCollectionsForUser(
      userId,
      availableCollections,
      userPattern,
      { includeChallengingContent, optimizeForEngagement }
    )

    // Step 3: Generate insights about user behavior
    const insights = await this.generateUserInsights(userId, userPattern, recentActivity)

    // Step 4: Create learning path
    const learningPath = this.createOptimalLearningPath(
      scoredCollections,
      userPattern,
      maxRecommendations
    )

    // Step 5: Calculate overall confidence
    const confidenceScore = this.calculateRecommendationConfidence(
      userPattern,
      recentActivity.length,
      scoredCollections
    )

    return {
      recommendations: learningPath.slice(0, maxRecommendations),
      user_insights: insights,
      learning_path: learningPath.map(r => r.collection_id),
      confidence_score: confidenceScore
    }
  }

  /**
   * Track user interaction and update behavior patterns
   */
  async trackUserInteraction(interaction: UserInteraction): Promise<{
    pattern_updated: boolean
    new_insights: string[]
    recommendation_adjustments: string[]
  }> {
    const userId = interaction.user_id
    
    // Add to recent interactions
    const recent = this.recentInteractions.get(userId) || []
    recent.push(interaction)
    
    // Keep only recent interactions (last 1000 or 30 days)
    const cutoffTime = Date.now() - (this.ANALYSIS_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const filteredRecent = recent
      .filter(i => new Date(i.timestamp).getTime() > cutoffTime)
      .slice(-1000)
    
    this.recentInteractions.set(userId, filteredRecent)

    // Update learning pattern
    const patternUpdated = await this.updateLearningPattern(userId, interaction)
    
    // Generate insights from new interaction
    const newInsights = this.analyzeNewInteraction(interaction)
    
    // Determine recommendation adjustments
    const adjustments = this.determineRecommendationAdjustments(userId, interaction)

    return {
      pattern_updated: patternUpdated,
      new_insights: newInsights,
      recommendation_adjustments: adjustments
    }
  }

  /**
   * Find users with similar behavior patterns for collaborative filtering
   */
  async findSimilarUsers(
    userId: string,
    limit: number = 10
  ): Promise<Array<{
    user_id: string
    similarity_score: number
    similar_behaviors: string[]
    successful_collections: string[]
  }>> {
    const userPattern = this.userPatterns.get(userId)
    if (!userPattern) return []

    const similarUsers: Array<{
      user_id: string
      similarity_score: number
      similar_behaviors: string[]
      successful_collections: string[]
    }> = []

    // Compare with other user patterns
    for (const [otherUserId, otherPattern] of this.userPatterns.entries()) {
      if (otherUserId === userId) continue

      const similarity = this.calculateUserSimilarity(userPattern, otherPattern)
      
      if (similarity > this.SIMILARITY_THRESHOLD) {
        const similarBehaviors = this.identifySimilarBehaviors(userPattern, otherPattern)
        const successfulCollections = await this.getUserSuccessfulCollections(otherUserId)

        similarUsers.push({
          user_id: otherUserId,
          similarity_score: similarity,
          similar_behaviors: similarBehaviors,
          successful_collections: successfulCollections
        })
      }
    }

    return similarUsers
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit)
  }

  /**
   * Predict user engagement for a specific collection
   */
  async predictEngagement(
    userId: string,
    collectionId: string,
    collectionMetadata: {
      difficulty_level: number
      estimated_minutes: number
      categories: string[]
      content_types: string[]
    }
  ): Promise<{
    predicted_completion_rate: number
    predicted_rating: number
    engagement_factors: Array<{
      factor: string
      impact: number
      reasoning: string
    }>
    confidence: number
    recommended_modifications: string[]
  }> {
    const userPattern = this.userPatterns.get(userId)
    if (!userPattern) {
      return {
        predicted_completion_rate: 0.5,
        predicted_rating: 3.0,
        engagement_factors: [],
        confidence: 0.1,
        recommended_modifications: ['Need more user data for accurate prediction']
      }
    }

    // Analyze engagement factors
    const engagementFactors = this.analyzeEngagementFactors(userPattern, collectionMetadata)
    
    // Predict completion rate based on historical patterns
    const predictedCompletion = this.predictCompletionRate(userPattern, collectionMetadata)
    
    // Predict rating based on user preferences
    const predictedRating = this.predictUserRating(userPattern, collectionMetadata)
    
    // Calculate prediction confidence
    const confidence = this.calculatePredictionConfidence(userPattern, engagementFactors)
    
    // Generate recommendations for improving engagement
    const modifications = this.generateEngagementRecommendations(userPattern, collectionMetadata)

    return {
      predicted_completion_rate: predictedCompletion,
      predicted_rating: predictedRating,
      engagement_factors: engagementFactors,
      confidence: confidence,
      recommended_modifications: modifications
    }
  }

  /**
   * Analyze user learning pattern from historical interactions
   */
  private async analyzeUserPattern(userId: string): Promise<LearningPattern> {
    // Check if we have cached pattern
    if (this.userPatterns.has(userId)) {
      return this.userPatterns.get(userId)!
    }

    // Load interactions from database (simulated)
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
      completion_rate_by_category: this.analyzeCompletionRatesByCategory(interactions),
      knowledge_retention_score: this.calculateKnowledgeRetention(interactions),
      engagement_trend: this.determineEngagementTrend(interactions),
      learning_style_indicators: this.analyzeLearningStyle(interactions)
    }

    // Cache the pattern
    this.userPatterns.set(userId, pattern)
    
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
        title: 'Improving Engagement',
        description: 'Your completion rates have been increasing over time',
        data_points: recentActivity.length,
        confidence: 0.8,
        actionable_suggestions: [
          'Continue with current learning pace',
          'Consider slightly more challenging content'
        ],
        impact_potential: 'high'
      })
    }

    // Analyze learning velocity
    if (pattern.learning_velocity > 3) {
      insights.push({
        type: 'strength',
        title: 'Fast Learner',
        description: 'You consistently complete multiple content items per session',
        data_points: recentActivity.filter(i => i.action === 'complete').length,
        confidence: 0.9,
        actionable_suggestions: [
          'Try collections with more advanced content',
          'Consider learning paths with multiple topics'
        ],
        impact_potential: 'high'
      })
    }

    // Analyze difficulty preferences
    if (pattern.preferred_difficulty < 3) {
      insights.push({
        type: 'opportunity',
        title: 'Ready for Challenge',
        description: 'You might benefit from gradually increasing content difficulty',
        data_points: recentActivity.length,
        confidence: 0.7,
        actionable_suggestions: [
          'Try one level higher difficulty',
          'Mix easier and harder content for balanced learning'
        ],
        impact_potential: 'medium'
      })
    }

    // Analyze knowledge retention
    if (pattern.knowledge_retention_score > 0.8) {
      insights.push({
        type: 'strength',
        title: 'Excellent Retention',
        description: 'You demonstrate strong knowledge retention over time',
        data_points: recentActivity.filter(i => i.score !== undefined).length,
        confidence: 0.9,
        actionable_suggestions: [
          'Focus on advanced topics',
          'Consider teaching or sharing knowledge with others'
        ],
        impact_potential: 'high'
      })
    }

    return insights
  }

  // Helper methods for pattern analysis
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

  private analyzeCompletionRatesByCategory(interactions: UserInteraction[]): Record<string, number> {
    // This would require category information from content
    // For now, return a placeholder
    return {
      'Constitutional Law': 0.8,
      'Electoral Process': 0.7,
      'Government Structure': 0.75
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

    const firstHalfCompletions = firstHalf.filter(i => i.action === 'complete').length
    const secondHalfCompletions = secondHalf.filter(i => i.action === 'complete').length

    const firstRate = firstHalfCompletions / firstHalf.length
    const secondRate = secondHalfCompletions / secondHalf.length

    if (secondRate > firstRate * 1.1) return 'improving'
    if (secondRate < firstRate * 0.9) return 'declining'
    return 'stable'
  }

  private analyzeLearningStyle(interactions: UserInteraction[]): LearningPattern['learning_style_indicators'] {
    // Analyze interaction patterns to infer learning style preferences
    // This is a simplified implementation
    return {
      visual_preference: 0.6,
      text_preference: 0.8,
      interactive_preference: 0.7,
      sequential_preference: 0.5
    }
  }

  // Additional helper methods would be implemented here...
  private getDefaultLearningPattern(userId: string): LearningPattern {
    return {
      user_id: userId,
      preferred_difficulty: 3,
      learning_velocity: 2,
      optimal_session_length: 20,
      preferred_content_types: { 'topic': 0.6, 'question': 0.4 },
      peak_activity_hours: [9, 14, 19],
      completion_rate_by_category: {},
      knowledge_retention_score: 0.7,
      engagement_trend: 'stable',
      learning_style_indicators: {
        visual_preference: 0.5,
        text_preference: 0.5,
        interactive_preference: 0.5,
        sequential_preference: 0.5
      }
    }
  }

  private async loadUserInteractions(userId: string): Promise<UserInteraction[]> {
    // Load from database - placeholder implementation
    return this.recentInteractions.get(userId) || []
  }

  // Placeholder implementations for other helper methods
  private calculateDifficultyMatch(collectionDifficulty: number, userPreference: number): number {
    const difference = Math.abs(collectionDifficulty - userPreference)
    return Math.max(0, 1 - (difference / 5))
  }

  private calculateCategoryMatch(categories: string[], userRates: Record<string, number>): number {
    let totalMatch = 0
    let count = 0
    
    for (const category of categories) {
      if (userRates[category] !== undefined) {
        totalMatch += userRates[category]
        count++
      }
    }
    
    return count > 0 ? totalMatch / count : 0.5
  }

  private calculateTimeMatch(estimatedMinutes: number, userOptimal: number): number {
    const ratio = Math.min(estimatedMinutes, userOptimal) / Math.max(estimatedMinutes, userOptimal)
    return ratio
  }

  private predictCollectionEngagement(collection: any, pattern: LearningPattern): number {
    // Simplified engagement prediction
    return 0.7
  }

  private generateRecommendationReason(collection: any, pattern: LearningPattern, score: number): string {
    return `This collection matches your preferred difficulty level and has high completion rates among similar users`
  }

  private estimateCompletionTime(collection: any, pattern: LearningPattern): number {
    return collection.estimated_minutes * (1 / pattern.learning_velocity)
  }

  private getPersonalizationFactors(collection: any, pattern: LearningPattern): string[] {
    return ['difficulty_preference', 'category_performance', 'learning_velocity']
  }

  private calculateOptimalTiming(pattern: LearningPattern): any {
    return {
      best_time_of_day: pattern.peak_activity_hours.length > 0 ? `${pattern.peak_activity_hours[0]}:00` : '14:00',
      suggested_session_length: pattern.optimal_session_length,
      break_recommendations: ['Take 5-minute breaks every 25 minutes']
    }
  }

  private async getSimilarUsersSuccessRate(userId: string, collectionId: string): Promise<number> {
    // Find similar users and their success rate with this collection
    return 0.75
  }

  private createOptimalLearningPath(recommendations: PersonalizedRecommendation[], pattern: LearningPattern, maxItems: number): PersonalizedRecommendation[] {
    // Sort and assign learning path positions
    const sortedRecs = recommendations.sort((a, b) => b.confidence_score - a.confidence_score)
    
    for (let i = 0; i < sortedRecs.length; i++) {
      sortedRecs[i].learning_path_position = i + 1
    }
    
    return sortedRecs.slice(0, maxItems)
  }

  private calculateRecommendationConfidence(pattern: LearningPattern, interactionCount: number, recommendations: PersonalizedRecommendation[]): number {
    const dataConfidence = Math.min(interactionCount / this.MIN_INTERACTIONS_FOR_PATTERN, 1)
    const avgRecommendationScore = recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length || 0
    
    return (dataConfidence + avgRecommendationScore) / 2
  }

  private async updateLearningPattern(userId: string, interaction: UserInteraction): Promise<boolean> {
    // Update existing pattern with new interaction data
    return true
  }

  private analyzeNewInteraction(interaction: UserInteraction): string[] {
    return [`User completed ${interaction.content_type} in ${interaction.duration_seconds}s`]
  }

  private determineRecommendationAdjustments(userId: string, interaction: UserInteraction): string[] {
    return ['Consider increasing difficulty based on quick completion']
  }

  private calculateUserSimilarity(pattern1: LearningPattern, pattern2: LearningPattern): number {
    // Calculate similarity between two user patterns
    return 0.8
  }

  private identifySimilarBehaviors(pattern1: LearningPattern, pattern2: LearningPattern): string[] {
    return ['similar_difficulty_preference', 'similar_learning_velocity']
  }

  private async getUserSuccessfulCollections(userId: string): Promise<string[]> {
    return ['collection_1', 'collection_2']
  }

  private analyzeEngagementFactors(pattern: LearningPattern, metadata: any): Array<{ factor: string; impact: number; reasoning: string }> {
    return [
      {
        factor: 'difficulty_match',
        impact: 0.8,
        reasoning: 'Collection difficulty aligns well with user preference'
      }
    ]
  }

  private predictCompletionRate(pattern: LearningPattern, metadata: any): number {
    return 0.75
  }

  private predictUserRating(pattern: LearningPattern, metadata: any): number {
    return 4.2
  }

  private calculatePredictionConfidence(pattern: LearningPattern, factors: any[]): number {
    return 0.8
  }

  private generateEngagementRecommendations(pattern: LearningPattern, metadata: any): string[] {
    return ['Break content into smaller segments', 'Add interactive elements']
  }

  private async getRecentActivity(userId: string): Promise<UserInteraction[]> {
    return this.recentInteractions.get(userId) || []
  }
} 