import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

// Types for AI agent memory
export interface AgentConversation {
  sessionId: string
  agentType: string
  agentModel?: string
  context?: Record<string, any>
}

export interface AgentMessage {
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, any>
  tokensUsed?: number
}

export interface LearnedPattern {
  patternType: string
  patternCategory: string
  description: string
  confidence: number
  evidence: any[]
  source: string
}

export interface ContentAnalysis {
  contentType: string
  contentId: string
  analysisType: string
  result: any
  modelVersion?: string
  confidence?: number
  expiresAt?: Date
}

export interface GeneratedContent {
  generationType: string
  sourceReference?: string
  promptTemplate?: string
  parameters?: Record<string, any>
  content: any
  qualityScores?: Record<string, number>
  modelUsed?: string
}

class AIAgentMemory {
  private supabase: SupabaseClient
  private conversationCache = new Map<string, string>() // sessionId -> conversationId
  private patternCache = new Map<string, LearnedPattern[]>() // patternType -> patterns
  private analysisCache = new Map<string, any>() // cacheKey -> analysis
  
  constructor() {
    this.supabase = createClient()
    this.loadPatternCache()
  }

  // Conversation management
  async startConversation(conversation: AgentConversation): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent.conversations')
        .insert({
          session_id: conversation.sessionId,
          agent_type: conversation.agentType,
          agent_model: conversation.agentModel,
          conversation_context: conversation.context || {}
        })
        .select('id')
        .single()

      if (error) {
        console.error('Failed to start conversation:', error)
        return null
      }

      this.conversationCache.set(conversation.sessionId, data.id)
      return data.id
    } catch (err) {
      console.error('Error starting conversation:', err)
      return null
    }
  }

  async addMessage(message: AgentMessage): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_agent.messages')
        .insert({
          conversation_id: message.conversationId,
          role: message.role,
          content: message.content,
          metadata: message.metadata || {},
          tokens_used: message.tokensUsed
        })

      if (error) {
        console.error('Failed to add message:', error)
      }

      // Update conversation stats
      await this.supabase.rpc('increment', {
        table_name: 'ai_agent.conversations',
        column_name: 'total_messages',
        row_id: message.conversationId,
        increment_by: 1
      })

      if (message.tokensUsed) {
        await this.supabase.rpc('increment', {
          table_name: 'ai_agent.conversations',
          column_name: 'total_tokens_used',
          row_id: message.conversationId,
          increment_by: message.tokensUsed
        })
      }
    } catch (err) {
      console.error('Error adding message:', err)
    }
  }

  // Pattern learning
  async recordLearning(pattern: LearnedPattern): Promise<void> {
    try {
      const { data, error } = await this.supabase.rpc('record_learning', {
        p_pattern_type: pattern.patternType,
        p_pattern_category: pattern.patternCategory,
        p_description: pattern.description,
        p_confidence: pattern.confidence,
        p_evidence: pattern.evidence,
        p_source: pattern.source
      })

      if (error) {
        console.error('Failed to record learning:', error)
      } else {
        // Update local cache
        const patterns = this.patternCache.get(pattern.patternType) || []
        patterns.push(pattern)
        this.patternCache.set(pattern.patternType, patterns)
      }
    } catch (err) {
      console.error('Error recording learning:', err)
    }
  }

  async getRelevantPatterns(
    patternType: string, 
    context?: Record<string, any>, 
    limit: number = 10
  ): Promise<LearnedPattern[]> {
    // Check cache first
    const cached = this.patternCache.get(patternType)
    if (cached && cached.length > 0) {
      return cached.slice(0, limit)
    }

    try {
      const { data, error } = await this.supabase.rpc('get_relevant_patterns', {
        p_context_type: patternType,
        p_context_data: context || {},
        p_limit: limit
      })

      if (error) {
        console.error('Failed to get patterns:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error getting patterns:', err)
      return []
    }
  }

  // Content analysis caching
  async getCachedAnalysis(
    contentType: string, 
    contentId: string, 
    analysisType: string
  ): Promise<any | null> {
    const cacheKey = `${contentType}:${contentId}:${analysisType}`
    
    // Check memory cache first
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)
    }

    try {
      const { data, error } = await this.supabase
        .from('ai_agent.content_analysis_cache')
        .select('analysis_result')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('analysis_type', analysisType)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Failed to get cached analysis:', error)
        return null
      }

      if (data) {
        this.analysisCache.set(cacheKey, data.analysis_result)
        return data.analysis_result
      }

      return null
    } catch (err) {
      console.error('Error getting cached analysis:', err)
      return null
    }
  }

  async cacheAnalysis(analysis: ContentAnalysis): Promise<void> {
    const cacheKey = `${analysis.contentType}:${analysis.contentId}:${analysis.analysisType}`
    
    // Update memory cache
    this.analysisCache.set(cacheKey, analysis.result)

    try {
      const { error } = await this.supabase
        .from('ai_agent.content_analysis_cache')
        .upsert({
          content_type: analysis.contentType,
          content_id: analysis.contentId,
          analysis_type: analysis.analysisType,
          analysis_result: analysis.result,
          model_version: analysis.modelVersion,
          confidence_score: analysis.confidence,
          expires_at: analysis.expiresAt
        })

      if (error) {
        console.error('Failed to cache analysis:', error)
      }
    } catch (err) {
      console.error('Error caching analysis:', err)
    }
  }

  // Database context learning
  async updateDatabaseContext(
    contextType: string, 
    contextData: any, 
    insights?: any[]
  ): Promise<void> {
    try {
      // Mark previous contexts as not current
      await this.supabase
        .from('ai_agent.database_context')
        .update({ is_current: false })
        .eq('context_type', contextType)
        .eq('is_current', true)

      // Insert new context
      const { error } = await this.supabase
        .from('ai_agent.database_context')
        .insert({
          context_type: contextType,
          context_data: contextData,
          insights: insights || [],
          is_current: true
        })

      if (error) {
        console.error('Failed to update database context:', error)
      }
    } catch (err) {
      console.error('Error updating database context:', err)
    }
  }

  async getCurrentContext(contextType: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent.database_context')
        .select('context_data, insights')
        .eq('context_type', contextType)
        .eq('is_current', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to get current context:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Error getting current context:', err)
      return null
    }
  }

  // Generated content tracking
  async trackGeneratedContent(content: GeneratedContent): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent.generated_content')
        .insert({
          generation_type: content.generationType,
          source_reference: content.sourceReference,
          prompt_template: content.promptTemplate,
          generation_parameters: content.parameters || {},
          generated_content: content.content,
          quality_scores: content.qualityScores || {},
          model_used: content.modelUsed
        })
        .select('id')
        .single()

      if (error) {
        console.error('Failed to track generated content:', error)
        return null
      }

      return data?.id
    } catch (err) {
      console.error('Error tracking generated content:', err)
      return null
    }
  }

  // Fallback responses for offline mode
  async getFallbackResponse(userInput: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent.fallback_responses')
        .select('response_template, response_data')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Failed to get fallback responses:', error)
        return null
      }

      // Simple pattern matching (could be enhanced)
      for (const response of data || []) {
        // For now, return the most used response
        // In production, implement proper pattern matching
        return response.response_template
      }

      return null
    } catch (err) {
      console.error('Error getting fallback response:', err)
      return null
    }
  }

  // Knowledge graph operations
  async addKnowledgeRelationship(
    source: { type: string; id: string },
    target: { type: string; id: string },
    relationshipType: string,
    strength: number = 0.5,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_agent.knowledge_graph')
        .insert({
          source_type: source.type,
          source_id: source.id,
          target_type: target.type,
          target_id: target.id,
          relationship_type: relationshipType,
          relationship_strength: strength,
          metadata: metadata || {}
        })

      if (error) {
        console.error('Failed to add knowledge relationship:', error)
      }
    } catch (err) {
      console.error('Error adding knowledge relationship:', err)
    }
  }

  // Performance tracking
  async trackPerformance(
    agentType: string,
    metrics: {
      success: boolean
      responseTimeMs?: number
      tokensUsed?: number
      fallbackUsed?: boolean
    }
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Upsert today's metrics
      const { error } = await this.supabase.rpc('update_agent_metrics', {
        p_metric_date: today,
        p_agent_type: agentType,
        p_success: metrics.success,
        p_response_time: metrics.responseTimeMs,
        p_tokens_used: metrics.tokensUsed || 0,
        p_fallback_used: metrics.fallbackUsed || false
      })

      if (error) {
        console.error('Failed to track performance:', error)
      }
    } catch (err) {
      console.error('Error tracking performance:', err)
    }
  }

  // Load pattern cache on initialization
  private async loadPatternCache(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent.learned_patterns')
        .select('*')
        .eq('is_active', true)
        .gte('confidence_score', 0.7)
        .order('confidence_score', { ascending: false })

      if (error) {
        console.error('Failed to load pattern cache:', error)
        return
      }

      // Group patterns by type
      for (const pattern of data || []) {
        const patterns = this.patternCache.get(pattern.pattern_type) || []
        patterns.push({
          patternType: pattern.pattern_type,
          patternCategory: pattern.pattern_category,
          description: pattern.pattern_description,
          confidence: pattern.confidence_score,
          evidence: pattern.supporting_evidence,
          source: pattern.learned_from_source
        })
        this.patternCache.set(pattern.pattern_type, patterns)
      }
    } catch (err) {
      console.error('Error loading pattern cache:', err)
    }
  }
}

// Singleton instance
let aiMemory: AIAgentMemory | null = null

export function getAIMemory(): AIAgentMemory {
  if (!aiMemory) {
    aiMemory = new AIAgentMemory()
  }
  return aiMemory
}

// React hook for AI agent memory
export function useAIMemory() {
  const memory = getAIMemory()
  
  return {
    startConversation: memory.startConversation.bind(memory),
    addMessage: memory.addMessage.bind(memory),
    recordLearning: memory.recordLearning.bind(memory),
    getRelevantPatterns: memory.getRelevantPatterns.bind(memory),
    getCachedAnalysis: memory.getCachedAnalysis.bind(memory),
    cacheAnalysis: memory.cacheAnalysis.bind(memory),
    updateDatabaseContext: memory.updateDatabaseContext.bind(memory),
    getCurrentContext: memory.getCurrentContext.bind(memory),
    trackGeneratedContent: memory.trackGeneratedContent.bind(memory),
    getFallbackResponse: memory.getFallbackResponse.bind(memory),
    addKnowledgeRelationship: memory.addKnowledgeRelationship.bind(memory),
    trackPerformance: memory.trackPerformance.bind(memory)
  }
} 