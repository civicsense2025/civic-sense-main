/**
 * Collection Workflow Integrator
 * UPDATED: Now includes BaseAITool wrapper for ecosystem integration
 * 
 * Seamlessly integrates AI Collection Organizer with other CivicSense systems:
 * - Progress tracking and storage
 * - Learning path recommendations
 * - User analytics and behavior tracking
 * - Content recommendation engine
 * - Assessment and quiz systems
 * - Multiplayer and social features
 */

import { BaseAITool, type AIToolConfig, type AIToolResult } from './base-ai-tool'
import { UserBehaviorAnalyzer } from './user-behavior-analyzer'
import { CollectionOrganizerAgent } from './collection-organizer-agent'
import { createClient } from '@supabase/supabase-js'
import type { Collection } from '@/types/collections'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

interface CollectionWorkflowContext {
  user_id?: string
  collection_id: string
  source_system: 'ai_organizer' | 'manual_creation' | 'user_request'
  integration_points: Array<{
    system: string
    action: string
    status: 'pending' | 'completed' | 'failed'
    metadata?: any
  }>
  learning_objectives: string[]
  prerequisite_collections: string[]
  recommended_next_steps: string[]
}

interface SystemIntegration {
  system_name: string
  endpoint: string
  trigger_events: string[]
  response_handler: (data: any) => Promise<void>
  retry_config: {
    max_attempts: number
    backoff_multiplier: number
    initial_delay: number
  }
}

export class CollectionWorkflowIntegrator {
  private supabase = createServiceClient()
  private behaviorAnalyzer = new UserBehaviorAnalyzer()
  private collectionAgent = new CollectionOrganizerAgent()
  
  private async getSupabase() {
    return this.supabase
  }
  
  private integrations = new Map<string, SystemIntegration>()
  private activeWorkflows = new Map<string, CollectionWorkflowContext>()

  constructor() {
    this.initializeSystemIntegrations()
  }

  /**
   * Orchestrate collection creation workflow across all systems
   */
  async orchestrateCollectionWorkflow(
    collectionData: {
      id: string
      title: string
      description: string
      content_items: string[]
      difficulty_level: number
      estimated_minutes: number
      learning_objectives: string[]
      skills_required: string[]
    },
    options: {
      user_id?: string
      auto_enroll?: boolean
      create_learning_path?: boolean
      enable_analytics?: boolean
      trigger_recommendations?: boolean
    } = {}
  ): Promise<{
    workflow_id: string
    collection_created: boolean
    integrations_completed: string[]
    integrations_failed: string[]
    next_steps: string[]
  }> {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🔄 Starting collection workflow: ${workflowId}`)

    // Initialize workflow context
    const context: CollectionWorkflowContext = {
      user_id: options.user_id,
      collection_id: collectionData.id,
      source_system: 'ai_organizer',
      integration_points: [],
      learning_objectives: collectionData.learning_objectives,
      prerequisite_collections: [],
      recommended_next_steps: []
    }

    this.activeWorkflows.set(workflowId, context)

    const results = {
      workflow_id: workflowId,
      collection_created: false,
      integrations_completed: [] as string[],
      integrations_failed: [] as string[],
      next_steps: [] as string[]
    }

    try {
      // Step 1: Create the collection in the database
      results.collection_created = await this.createCollectionRecord(collectionData)
      
      if (!results.collection_created) {
        throw new Error('Failed to create collection record')
      }

      // Step 2: Progress tracking integration
      if (options.user_id && options.auto_enroll) {
        try {
          await this.integrateProgressTracking(collectionData.id, options.user_id, collectionData)
          results.integrations_completed.push('progress_tracking')
        } catch (error) {
          console.warn('Progress tracking integration failed:', error)
          results.integrations_failed.push('progress_tracking')
        }
      }

      // Step 3: Learning path integration
      if (options.create_learning_path && options.user_id) {
        try {
          const learningPath = await this.integrateLearningPaths(
            collectionData.id, 
            options.user_id, 
            collectionData
          )
          context.recommended_next_steps = learningPath.next_collections
          results.integrations_completed.push('learning_paths')
        } catch (error) {
          console.warn('Learning path integration failed:', error)
          results.integrations_failed.push('learning_paths')
        }
      }

      // Step 4: Analytics integration
      if (options.enable_analytics) {
        try {
          await this.integrateAnalytics(collectionData.id, collectionData, options.user_id)
          results.integrations_completed.push('analytics')
        } catch (error) {
          console.warn('Analytics integration failed:', error)
          results.integrations_failed.push('analytics')
        }
      }

      // Step 5: Content recommendation integration
      if (options.trigger_recommendations && options.user_id) {
        try {
          const recommendations = await this.integrateRecommendations(
            collectionData.id,
            options.user_id,
            collectionData
          )
          results.next_steps = recommendations.action_items
          results.integrations_completed.push('recommendations')
        } catch (error) {
          console.warn('Recommendations integration failed:', error)
          results.integrations_failed.push('recommendations')
        }
      }

      // Step 6: Assessment system integration
      try {
        await this.integrateAssessments(collectionData.id, collectionData)
        results.integrations_completed.push('assessments')
      } catch (error) {
        console.warn('Assessment integration failed:', error)
        results.integrations_failed.push('assessments')
      }

      // Step 7: Social features integration
      if (options.user_id) {
        try {
          await this.integrateSocialFeatures(collectionData.id, options.user_id, collectionData)
          results.integrations_completed.push('social_features')
        } catch (error) {
          console.warn('Social features integration failed:', error)
          results.integrations_failed.push('social_features')
        }
      }

      // Step 8: Update workflow context with results
      context.integration_points = [
        ...results.integrations_completed.map(system => ({
          system,
          action: 'integrate',
          status: 'completed' as const
        })),
        ...results.integrations_failed.map(system => ({
          system,
          action: 'integrate',
          status: 'failed' as const
        }))
      ]

      // Step 9: Generate next steps
      results.next_steps = await this.generateNextSteps(context, collectionData)

      return results

    } catch (error) {
      console.error('Collection workflow failed:', error)
      throw error
    } finally {
      // Clean up workflow context
      setTimeout(() => {
        this.activeWorkflows.delete(workflowId)
      }, 300000) // Clean up after 5 minutes
    }
  }

  /**
   * Integrate with progress tracking system
   */
  private async integrateProgressTracking(
    collectionId: string,
    userId: string,
    collectionData: any
  ): Promise<void> {
    // Initialize progress tracking for the collection
    const { error } = await this.supabase
      .from('user_collection_progress')
      .insert({
        user_id: userId,
        collection_id: collectionId,
        progress_percentage: 0,
        items_completed: 0,
        total_items: collectionData.content_items.length,
        estimated_completion_time: collectionData.estimated_minutes,
        started_at: new Date().toISOString(),
        metadata: {
          difficulty_level: collectionData.difficulty_level,
          learning_objectives: collectionData.learning_objectives,
          auto_enrolled: true
        }
      })

    if (error) {
      throw new Error(`Progress tracking integration failed: ${error.message}`)
    }

    console.log(`✅ Progress tracking initialized for collection ${collectionId}`)
  }

  /**
   * Integrate with learning paths system
   */
  private async integrateLearningPaths(
    collectionId: string,
    userId: string,
    collectionData: any
  ): Promise<{
    learning_path_id: string
    next_collections: string[]
    prerequisite_check: boolean
  }> {
    // Get user's current learning path or create new one
    const { data: existingPath } = await this.supabase
      .from('user_learning_paths')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    let learningPathId: string

    if (existingPath) {
      learningPathId = existingPath.id
      
      // Add collection to existing path
      await this.supabase
        .from('learning_path_collections')
        .insert({
          learning_path_id: learningPathId,
          collection_id: collectionId,
          sequence_order: existingPath.collections_count + 1,
          is_required: false,
          added_by_ai: true
        })
    } else {
      // Create new learning path
      const { data: newPath, error: pathError } = await this.supabase
        .from('user_learning_paths')
        .insert({
          user_id: userId,
          title: `AI-Generated Learning Path`,
          description: `Personalized learning path starting with ${collectionData.title}`,
          difficulty_level: collectionData.difficulty_level,
          estimated_total_minutes: collectionData.estimated_minutes,
          status: 'active',
          created_by_ai: true
        })
        .select()
        .single()

      if (pathError) {
        throw new Error(`Learning path creation failed: ${pathError.message}`)
      }

      learningPathId = newPath.id

      // Add initial collection
      await this.supabase
        .from('learning_path_collections')
        .insert({
          learning_path_id: learningPathId,
          collection_id: collectionId,
          sequence_order: 1,
          is_required: true,
          added_by_ai: true
        })
    }

    // Generate next collection recommendations
    const nextCollections = await this.recommendNextCollections(userId, collectionData)

    console.log(`✅ Learning path integration completed: ${learningPathId}`)

    return {
      learning_path_id: learningPathId,
      next_collections: nextCollections.map(c => c.id),
      prerequisite_check: true
    }
  }

  /**
   * Integrate with analytics system
   */
  private async integrateAnalytics(
    collectionId: string,
    collectionData: any,
    userId?: string
  ): Promise<void> {
    // Track collection creation event
    const analyticsEvent = {
      event_type: 'collection_created',
      collection_id: collectionId,
      user_id: userId,
      properties: {
        source: 'ai_organizer',
        title: collectionData.title,
        content_count: collectionData.content_items.length,
        difficulty_level: collectionData.difficulty_level,
        estimated_minutes: collectionData.estimated_minutes,
        learning_objectives_count: collectionData.learning_objectives.length,
        skills_count: collectionData.skills_required.length
      },
      timestamp: new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('analytics_events')
      .insert(analyticsEvent)

    if (error) {
      throw new Error(`Analytics integration failed: ${error.message}`)
    }

    // If user provided, update their behavior profile
    if (userId) {
      await this.behaviorAnalyzer.trackUserInteraction({
        user_id: userId,
        content_id: collectionId,
        content_type: 'collection',
        action: 'start',
        timestamp: new Date().toISOString(),
        session_id: `session_${Date.now()}`,
        duration_seconds: 0,
        difficulty_level: collectionData.difficulty_level
      })
    }

    console.log(`✅ Analytics integration completed for collection ${collectionId}`)
  }

  /**
   * Integrate with content recommendation system
   */
  private async integrateRecommendations(
    collectionId: string,
    userId: string,
    collectionData: any
  ): Promise<{
    recommended_collections: string[]
    action_items: string[]
    personalization_applied: boolean
  }> {
    // Get personalized recommendations based on this collection
    const recommendations = await this.behaviorAnalyzer.generatePersonalizedRecommendations(
      userId,
      [collectionData], // Use current collection as context
      {
        maxRecommendations: 5,
        includeChallengingContent: true,
        optimizeForEngagement: true
      }
    )

    // Store recommendations for future retrieval
    const recommendationEntries = recommendations.recommendations.map((rec: any) => ({
      user_id: userId,
      collection_id: rec.collection_id,
      recommendation_type: 'post_completion',
      confidence_score: rec.confidence_score,
      reasoning: rec.recommendation_reason,
      triggered_by_collection: collectionId,
      created_at: new Date().toISOString()
    }))

    if (recommendationEntries.length > 0) {
      const { error } = await this.supabase
        .from('user_recommendations')
        .insert(recommendationEntries)

      if (error) {
        console.warn('Failed to store recommendations:', error)
      }
    }

    const actionItems = [
      `Complete ${collectionData.title} to unlock advanced topics`,
      `Join study groups discussing ${collectionData.learning_objectives[0]}`,
      `Practice your knowledge with related quiz topics`,
      ...recommendations.recommendations.slice(0, 2).map((r: any) => 
        `Continue learning with: ${r.collection_title}`
      )
    ]

    console.log(`✅ Recommendations integration completed with ${recommendations.recommendations.length} suggestions`)

    return {
      recommended_collections: recommendations.recommendations.map((r: any) => r.collection_id),
      action_items: actionItems,
      personalization_applied: recommendations.confidence_score > 0.7
    }
  }

  /**
   * Integrate with assessment system
   */
  private async integrateAssessments(
    collectionId: string,
    collectionData: any
  ): Promise<void> {
    // Create pre and post assessments for the collection
    const assessments = [
      {
        collection_id: collectionId,
        assessment_type: 'pre_collection',
        title: `Pre-Assessment: ${collectionData.title}`,
        description: `Assess your current knowledge before starting ${collectionData.title}`,
        questions_count: Math.min(5, collectionData.content_items.length),
        time_limit_minutes: 10,
        auto_generated: true,
        learning_objectives: collectionData.learning_objectives
      },
      {
        collection_id: collectionId,
        assessment_type: 'post_collection',
        title: `Assessment: ${collectionData.title}`,
        description: `Test your understanding of ${collectionData.title}`,
        questions_count: Math.min(10, collectionData.content_items.length * 2),
        time_limit_minutes: 20,
        auto_generated: true,
        learning_objectives: collectionData.learning_objectives
      }
    ]

    const { error } = await this.supabase
      .from('collection_assessments')
      .insert(assessments)

    if (error) {
      throw new Error(`Assessment integration failed: ${error.message}`)
    }

    console.log(`✅ Assessment integration completed with ${assessments.length} assessments`)
  }

  /**
   * Integrate with social features system
   */
  private async integrateSocialFeatures(
    collectionId: string,
    userId: string,
    collectionData: any
  ): Promise<void> {
    // Create study group opportunity
    const studyGroup = {
      collection_id: collectionId,
      creator_id: userId,
      title: `Study Group: ${collectionData.title}`,
      description: `Collaborative learning for ${collectionData.title}`,
      max_participants: 8,
      difficulty_level: collectionData.difficulty_level,
      estimated_duration: collectionData.estimated_minutes,
      is_public: true,
      auto_created: true,
      learning_objectives: collectionData.learning_objectives
    }

    const { error: groupError } = await this.supabase
      .from('study_groups')
      .insert(studyGroup)

    if (groupError) {
      console.warn('Study group creation failed:', groupError)
    }

    // Create discussion forum for the collection
    const forum = {
      collection_id: collectionId,
      title: `Discussion: ${collectionData.title}`,
      description: `Ask questions and share insights about ${collectionData.title}`,
      created_by: userId,
      is_moderated: true,
      auto_created: true
    }

    const { error: forumError } = await this.supabase
      .from('collection_forums')
      .insert(forum)

    if (forumError) {
      console.warn('Forum creation failed:', forumError)
    }

    console.log(`✅ Social features integration completed`)
  }

  // Helper methods
  private async createCollectionRecord(collectionData: any): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('collections')
        .insert({
          id: collectionData.id,
          title: collectionData.title,
          description: collectionData.description,
          difficulty_level: collectionData.difficulty_level,
          estimated_minutes: collectionData.estimated_minutes,
          learning_objectives: collectionData.learning_objectives,
          skills_required: collectionData.skills_required,
          content_items: collectionData.content_items,
          created_by_ai: true,
          status: 'active'
        })

      return !error
    } catch (error) {
      console.error('Collection creation failed:', error)
      return false
    }
  }

  private async recommendNextCollections(
    userId: string,
    currentCollection: any
  ): Promise<Array<{ id: string; title: string; relevance: number }>> {
    // Use AI to recommend next collections based on current one
    try {
      const suggestions = await this.collectionAgent.suggestCollections({
        content_types: ['topic', 'question'],
        max_suggestions: 3,
        min_items_per_collection: 3,
        theme_specificity: 'specific',
        include_current_events: true
      })

      return suggestions.slice(0, 3).map((s: any) => ({
        id: s.suggested_slug,
        title: s.suggested_title,
        relevance: s.theme_confidence
      }))
    } catch (error) {
      console.warn('Next collection recommendation failed:', error)
      return []
    }
  }

  private async generateNextSteps(
    context: CollectionWorkflowContext,
    collectionData: any
  ): Promise<string[]> {
    const nextSteps: string[] = []

    // Add basic next steps
    nextSteps.push(`Start learning with "${collectionData.title}"`)
    
    if (context.user_id) {
      nextSteps.push('Track your progress as you complete each item')
      nextSteps.push('Take the pre-assessment to gauge your starting knowledge')
    }

    // Add integration-specific next steps
    const completedIntegrations = context.integration_points
      .filter(point => point.status === 'completed')
      .map(point => point.system)

    if (completedIntegrations.includes('learning_paths')) {
      nextSteps.push('Review your personalized learning path for next collections')
    }

    if (completedIntegrations.includes('social_features')) {
      nextSteps.push('Join the study group to learn with others')
      nextSteps.push('Participate in collection discussions')
    }

    if (completedIntegrations.includes('recommendations')) {
      nextSteps.push('Check out personalized recommendations for similar topics')
    }

    // Add learning objective-specific steps
    collectionData.learning_objectives.slice(0, 2).forEach((objective: string) => {
      nextSteps.push(`Master: ${objective}`)
    })

    return nextSteps
  }

  private initializeSystemIntegrations(): void {
    // Progress tracking integration
    this.integrations.set('progress_tracking', {
      system_name: 'Progress Tracking',
      endpoint: '/api/progress/track',
      trigger_events: ['collection_start', 'item_complete', 'collection_complete'],
      response_handler: async (data) => {
        console.log('Progress tracking updated:', data)
      },
      retry_config: {
        max_attempts: 3,
        backoff_multiplier: 2,
        initial_delay: 1000
      }
    })

    // Learning paths integration
    this.integrations.set('learning_paths', {
      system_name: 'Learning Paths',
      endpoint: '/api/learning-paths/update',
      trigger_events: ['collection_complete', 'difficulty_change'],
      response_handler: async (data) => {
        console.log('Learning path updated:', data)
      },
      retry_config: {
        max_attempts: 3,
        backoff_multiplier: 2,
        initial_delay: 1000
      }
    })

    // Add other system integrations...
  }

  /**
   * Monitor workflow health and retry failed integrations
   */
  async monitorWorkflowHealth(): Promise<{
    active_workflows: number
    failed_integrations: Array<{
      workflow_id: string
      system: string
      error: string
      retry_attempts: number
    }>
    system_health: Record<string, number>
  }> {
    const failedIntegrations: any[] = []
    const systemHealth: Record<string, number> = {}

    // Check active workflows for failures
    for (const [workflowId, context] of this.activeWorkflows.entries()) {
      const failedPoints = context.integration_points.filter(point => point.status === 'failed')
      
      failedPoints.forEach(point => {
        failedIntegrations.push({
          workflow_id: workflowId,
          system: point.system,
          error: point.metadata?.error || 'Unknown error',
          retry_attempts: point.metadata?.retry_attempts || 0
        })
      })
    }

    // Calculate system health scores
    for (const [systemName] of this.integrations.entries()) {
      const totalAttempts = this.activeWorkflows.size
      const failures = failedIntegrations.filter(f => f.system === systemName).length
      systemHealth[systemName] = totalAttempts > 0 ? (totalAttempts - failures) / totalAttempts : 1
    }

    return {
      active_workflows: this.activeWorkflows.size,
      failed_integrations: failedIntegrations,
      system_health: systemHealth
    }
  }
}

// ============================================================================
// BASEAITOOL WRAPPER
// ============================================================================

interface CollectionWorkflowInput {
  collectionData: {
    id: string
    title: string
    description: string
    content_items: string[]
    difficulty_level: number
    estimated_minutes: number
    learning_objectives: string[]
    skills_required: string[]
  }
  options: {
    user_id?: string
    auto_enroll?: boolean
    create_learning_path?: boolean
    enable_analytics?: boolean
    trigger_recommendations?: boolean
  }
}

interface CollectionWorkflowOutput {
  workflow_id: string
  collection_created: boolean
  integrations_completed: string[]
  integrations_failed: string[]
  next_steps: string[]
}

/**
 * BaseAITool wrapper for Collection Workflow Integrator
 */
export class CollectionWorkflowIntegratorAI extends BaseAITool<CollectionWorkflowInput, CollectionWorkflowOutput> {
  private workflowIntegrator: CollectionWorkflowIntegrator

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'Collection Workflow Integrator AI',
      type: 'content_generator',
      provider: 'openai',
      model: 'gpt-4o-mini',
      maxRetries: 2,
      ...config
    })
    
    this.workflowIntegrator = new CollectionWorkflowIntegrator()
  }

  protected async validateInput(input: CollectionWorkflowInput): Promise<CollectionWorkflowInput> {
    if (!input.collectionData?.id) {
      throw new Error('Collection ID is required')
    }
    if (!input.collectionData?.title) {
      throw new Error('Collection title is required')
    }
    return input
  }

  protected async processWithAI(input: CollectionWorkflowInput): Promise<string> {
    // Delegate to the actual workflow integrator
    const result = await this.workflowIntegrator.orchestrateCollectionWorkflow(
      input.collectionData,
      input.options
    )
    
    return JSON.stringify(result)
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<CollectionWorkflowOutput> {
    const parsed = await this.parseJSON(rawOutput)
    
    if (!parsed.isValid) {
      throw new Error(`Failed to parse workflow output: ${parsed.errors.join(', ')}`)
    }

    return parsed.content as CollectionWorkflowOutput
  }

  protected async validateOutput(output: CollectionWorkflowOutput): Promise<CollectionWorkflowOutput> {
    if (!output.workflow_id) {
      throw new Error('Invalid workflow output: missing workflow_id')
    }
    return output
  }

  protected async saveToSupabase(output: CollectionWorkflowOutput): Promise<CollectionWorkflowOutput> {
    // Workflow integrator handles its own Supabase operations
    return output
  }
}

/**
 * Factory function for creating collection workflow with BaseAITool integration
 */
export async function orchestrateCollectionWorkflowEnhanced(
  input: CollectionWorkflowInput
): Promise<AIToolResult<CollectionWorkflowOutput>> {
  const integrator = new CollectionWorkflowIntegratorAI()
  return await integrator.process(input)
} 