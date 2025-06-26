/**
 * CivicSense Enhanced AI Tools
 * 
 * Unified export of all AI tools with robust JSON parsing,
 * quality validation, and reliable Supabase saves.
 */

// ============================================================================
// BASE CLASS & TYPES
// ============================================================================

export { BaseAITool } from './base-ai-tool'
export type { AIToolConfig, AIToolResult, ParsedContent } from './base-ai-tool'

// ============================================================================
// ENHANCED AI TOOLS
// ============================================================================

export { EnhancedGlossaryGenerator, generateGlossaryTerms } from './enhanced-glossary-generator'
export { EnhancedKeyTakeawaysGenerator, generateKeyTakeaways } from './enhanced-key-takeaways-generator'
export { EnhancedBiasAnalyzer, analyzeBias } from './enhanced-bias-analyzer'

// ============================================================================
// LEGACY TOOLS WITH ENHANCED INTEGRATION
// ============================================================================

export { 
  EnhancedKeyTakeawaysWrapper,
  generateKeyTakeawaysEnhanced,
  generateKeyTakeawaysLegacy,
  KeyTakeawaysGenerator,
  keyTakeawaysGenerator
} from './key-takeaways-generator'

export {
  CivicSenseAIAgent,
  CivicSenseAIAgentBridge,
  type CivicSenseAIConfig,
  type CivicSenseAIOutput,
  type AIGenerationOptions
} from './civic-sense-ai-agent'

export {
  CollectionWorkflowIntegrator,
  CollectionWorkflowIntegratorAI,
  orchestrateCollectionWorkflowEnhanced
} from './collection-workflow-integrator'

// ============================================================================
// TOOL FACTORY
// ============================================================================

import { BaseAITool, type AIToolConfig, type AIToolResult } from './base-ai-tool'
import { EnhancedGlossaryGenerator } from './enhanced-glossary-generator'
import { EnhancedKeyTakeawaysGenerator } from './enhanced-key-takeaways-generator'
import { EnhancedBiasAnalyzer } from './enhanced-bias-analyzer'
import { EnhancedKeyTakeawaysWrapper } from './key-takeaways-generator'
import { CollectionWorkflowIntegratorAI } from './collection-workflow-integrator'
import { ContentQualityGate } from './content-quality-gate'

export type AIToolType = 
  | 'glossary_generator'
  | 'key_takeaways'
  | 'key_takeaways_enhanced'
  | 'bias_analyzer'
  | 'collection_workflow'
  | 'civic_sense_agent'
  | 'fact_checker'
  | 'content_summarizer'
  | 'quiz_generator'

export interface AIToolFactoryConfig extends Partial<AIToolConfig> {
  toolType: AIToolType
}

/**
 * Factory function to create AI tools with consistent configuration
 */
export function createAITool(config: AIToolFactoryConfig): BaseAITool {
  const { toolType, ...toolConfig } = config
  
  switch (toolType) {
    case 'glossary_generator':
      return new EnhancedGlossaryGenerator(toolConfig)
    
    case 'key_takeaways':
      return new EnhancedKeyTakeawaysGenerator(toolConfig)
    
    case 'key_takeaways_enhanced':
      return new EnhancedKeyTakeawaysWrapper(toolConfig)
    
    case 'bias_analyzer':
      return new EnhancedBiasAnalyzer(toolConfig)
    
    case 'collection_workflow':
      return new CollectionWorkflowIntegratorAI(toolConfig)
    
    default:
      throw new Error(`Unknown tool type: ${toolType}`)
  }
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

export interface BatchProcessingOptions {
  concurrency?: number
  continueOnError?: boolean
  progressCallback?: (completed: number, total: number) => void
}

/**
 * Process multiple items with an AI tool in batches
 */
export async function batchProcess<TInput, TOutput>(
  tool: BaseAITool<TInput, TOutput>,
  items: TInput[],
  options: BatchProcessingOptions = {}
): Promise<{
  successful: Array<{ input: TInput; output: AIToolResult<TOutput> }>
  failed: Array<{ input: TInput; error: string }>
}> {
  const {
    concurrency = 3,
    continueOnError = true,
    progressCallback
  } = options
  
  const successful: Array<{ input: TInput; output: AIToolResult<TOutput> }> = []
  const failed: Array<{ input: TInput; error: string }> = []
  
  // Process in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    
    const batchPromises = batch.map(async (input) => {
      try {
        const output = await tool.process(input)
        return { input, output }
      } catch (error) {
        if (!continueOnError) {
          throw error
        }
        return { 
          input, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    })
    
    const results = await Promise.all(batchPromises)
    
    // Sort results
    for (const result of results) {
      if ('output' in result) {
        successful.push(result as any)
      } else {
        failed.push(result as any)
      }
    }
    
    // Report progress
    if (progressCallback) {
      progressCallback(i + batch.length, items.length)
    }
    
    // Add delay between batches to avoid rate limits
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return { successful, failed }
}

// ============================================================================
// QUALITY VALIDATION
// ============================================================================

export interface QualityMetrics {
  overall_score: number
  brand_voice_score: number
  accuracy_score: number
  actionability_score: number
  uncomfortable_truth_score: number
  passes_minimum: boolean
}

/**
 * Validate content quality against CivicSense standards
 */
export function validateContentQuality(content: any): QualityMetrics {
  let scores = {
    brand_voice: 0,
    accuracy: 0,
    actionability: 0,
    uncomfortable_truth: 0
  }
  
  // Check for brand voice elements
  if (content.power_dynamics || content.power_dynamic_revealed) {
    scores.brand_voice += 25
  }
  if (content.uncomfortable_truth) {
    scores.brand_voice += 25
    scores.uncomfortable_truth = 100
  }
  if (content.specific_example || content.specific_actors_named) {
    scores.brand_voice += 25
  }
  if (content.challenges_assumptions) {
    scores.brand_voice += 25
  }
  
  // Check accuracy
  if (content.sources || content.primary_sources || content.factual_claims) {
    scores.accuracy = 80
  }
  if (content.credibility_score && content.credibility_score > 70) {
    scores.accuracy = content.credibility_score
  }
  
  // Check actionability
  if (content.action_step || content.civic_action || content.immediate_actions) {
    scores.actionability = 100
  } else if (content.leverage_points) {
    scores.actionability = 75
  }
  
  // Calculate overall score
  const overall_score = (
    scores.brand_voice * 0.3 +
    scores.accuracy * 0.3 +
    scores.actionability * 0.2 +
    scores.uncomfortable_truth * 0.2
  )
  
  return {
    overall_score,
    brand_voice_score: scores.brand_voice,
    accuracy_score: scores.accuracy,
    actionability_score: scores.actionability,
    uncomfortable_truth_score: scores.uncomfortable_truth,
    passes_minimum: overall_score >= 70
  }
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

export interface AIToolUsage {
  tool_name: string
  tool_type: string
  provider: string
  model: string
  tokens_used?: number
  cost?: number
  processing_time: number
  success: boolean
  error?: string
}

/**
 * Track AI tool usage for analytics and cost management
 */
export async function trackToolUsage(usage: AIToolUsage): Promise<void> {
  try {
    // Use service role client to bypass RLS for AI analytics
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // TODO: Create ai_tool_usage table in database
    // For now, just log the usage instead of inserting to non-existent table
    console.log('AI Tool Usage:', {
      ...usage,
      created_at: new Date().toISOString()
    })
    
    /* 
    // Uncomment when ai_tool_usage table is created
    await supabase
      .from('ai_tool_usage')
      .insert({
        ...usage,
        created_at: new Date().toISOString()
      })
    */
  } catch (error) {
    console.error('Failed to track tool usage:', error)
  }
}

// ============================================================================
// ERROR RECOVERY
// ============================================================================

export class AIToolError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public stage: 'validation' | 'processing' | 'parsing' | 'saving',
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AIToolError'
  }
}

/**
 * Wrap AI tool operations with enhanced error handling
 */
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  context: { toolName: string; stage: string }
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const enhancedError = new AIToolError(
      `${context.toolName} failed at ${context.stage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      context.toolName,
      context.stage as any,
      error instanceof Error ? error : undefined
    )
    
    // Log to monitoring service
    console.error(enhancedError)
    
    throw enhancedError
  }
}

// ============================================================================
// UTILITY TOOLS (SUPPORTING COMPONENTS)
// ============================================================================

export { UserBehaviorAnalyzer } from './user-behavior-analyzer'
export { PowerDynamicsAnalyzer } from './power-dynamics-analyzer'
export { BrandVoiceValidator } from './brand-voice-validator'
export { ContentQualityGate } from './content-quality-gate'
export { SourceVerificationEngine } from './source-verification-engine'
export { WebSearchService } from './web-search-service'

// ============================================================================
// COMPREHENSIVE USAGE EXAMPLES
// ============================================================================

/**
 * Example: Process content with multiple AI tools in parallel
 */
export async function processContentWithAllTools(
  content: string,
  options: {
    generateGlossary?: boolean
    extractTakeaways?: boolean
    analyzeBias?: boolean
    createWorkflow?: boolean
  } = {}
): Promise<{
  glossary?: any
  takeaways?: any
  biasAnalysis?: any
  workflow?: any
  errors: string[]
}> {
  const results: any = { errors: [] }
  const promises: Promise<void>[] = []

  // Glossary generation
  if (options.generateGlossary) {
    promises.push(
      createAITool({ toolType: 'glossary_generator' })
        .process({
          type: 'extract_from_content',
          content,
          count: 5
        })
        .then((result: any) => { results.glossary = result })
        .catch((error: any) => results.errors.push(`Glossary: ${error.message}`))
    )
  }

  // Key takeaways extraction
  if (options.extractTakeaways) {
    promises.push(
      createAITool({ toolType: 'key_takeaways_enhanced' })
        .process({
          topicId: 'content-analysis',
          topicTitle: 'Content Analysis',
          content,
          existingContent: ''
        })
        .then((result: any) => { results.takeaways = result })
        .catch((error: any) => results.errors.push(`Takeaways: ${error.message}`))
    )
  }

  // Bias analysis
  if (options.analyzeBias) {
    promises.push(
      createAITool({ toolType: 'bias_analyzer' })
        .process({
          content,
          source_url: '',
          analyze_power_dynamics: true,
          extract_civic_content: true
        })
        .then((result: any) => { results.biasAnalysis = result })
        .catch((error: any) => results.errors.push(`Bias Analysis: ${error.message}`))
    )
  }

  // Collection workflow
  if (options.createWorkflow) {
    promises.push(
      createAITool({ toolType: 'collection_workflow' })
        .process({
          collectionData: {
            id: `collection_${Date.now()}`,
            title: 'AI-Generated Collection',
            description: 'Collection created from content analysis',
            content_items: [content],
            difficulty_level: 2,
            estimated_minutes: 15,
            learning_objectives: ['Understanding content themes'],
            skills_required: ['Critical thinking']
          },
          options: {
            auto_enroll: false,
            create_learning_path: true,
            enable_analytics: true,
            trigger_recommendations: false
          }
        })
        .then((result: any) => { results.workflow = result })
        .catch((error: any) => results.errors.push(`Workflow: ${error.message}`))
    )
  }

  await Promise.all(promises)
  return results
}

/**
 * Example: Quality validation pipeline for AI output
 */
export async function validateAIOutput(
  content: string,
  requiredQuality: {
    minimumScore: number
    requireUncomfortableTruth: boolean
    requireActionSteps: boolean
    requireSources: boolean
  }
): Promise<{
  isValid: boolean
  qualityScore: number
  issues: string[]
  recommendations: string[]
}> {
  const validation = {
    isValid: false,
    qualityScore: 0,
    issues: [] as string[],
    recommendations: [] as string[]
  }

  try {
    // Use content quality gate for validation
    const qualityGate = new ContentQualityGate({
      minimumOverallScore: requiredQuality.minimumScore,
      minimumBrandVoiceScore: 70,
      minimumPowerDynamicsScore: 60,
      minimumCivicEngagementScore: 50,
      minimumAccuracyScore: 80
    })

    const assessment = await qualityGate.assessContentQuality(content)
    validation.qualityScore = assessment.overall_score

    // Check specific requirements
    if (requiredQuality.requireUncomfortableTruth && !assessment.has_uncomfortable_truth) {
      validation.issues.push('Content lacks uncomfortable truth about power structures')
      validation.recommendations.push('Add specific revelations about how power actually works')
    }

    if (requiredQuality.requireActionSteps && assessment.action_steps_count < 3) {
      validation.issues.push('Insufficient actionable civic engagement steps')
      validation.recommendations.push('Add specific contact information and action steps')
    }

    if (requiredQuality.requireSources && assessment.primary_sources_count < 2) {
      validation.issues.push('Weak source verification')
      validation.recommendations.push('Add more authoritative primary sources')
    }

    validation.isValid = validation.issues.length === 0 && 
                        validation.qualityScore >= requiredQuality.minimumScore

    return validation

  } catch (error) {
    validation.issues.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return validation
  }
} 