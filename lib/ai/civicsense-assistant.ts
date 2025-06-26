/**
 * CivicSense Assistant - Your Personal Civic Education AI
 * 
 * Meet Alex, your direct-talking, no-BS civic education assistant.
 * Alex embodies the CivicSense brand: revealing uncomfortable truths,
 * cutting through political BS, and helping you understand how power actually works.
 * 
 * Features:
 * - Conversational AI with CivicSense personality
 * - Real-time progress streaming
 * - Comprehensive state management
 * - Router for all AI tools
 * - Multi-modal civic education support
 */

import { BaseAITool, type AIToolConfig, type AIToolResult } from './base-ai-tool'
import { UserBehaviorAnalyzerAI } from './user-behavior-analyzer'
import { CivicActionGeneratorAI } from './civic-action-generator'
import { CollectionOrganizerAgent } from './collection-organizer-agent'
import { KeyTakeawaysGenerator } from './key-takeaways-generator'
import { PowerDynamicsAnalyzerAI } from './power-dynamics-analyzer'
import { CivicSenseBillAnalyzer } from './bill-analyzer'
import { EnhancedBiasAnalyzer } from './enhanced-bias-analyzer'
import { MLThemeDetector } from './ml-theme-detector'
import { UnifiedAIOrchestrator } from './unified-ai-orchestrator'
import { getPersonalityManager, type CivicPersonality, type PersonalityMatch } from './personality-manager'
import { createClient } from '@supabase/supabase-js'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface ConversationContext {
  userId?: string
  guestToken?: string
  sessionId: string
  conversationHistory: ConversationTurn[]
  userPreferences: UserPreferences
  currentTopic?: string
  activeTools: string[]
}

interface ConversationTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolsUsed?: string[]
  processingTime?: number
  civicInsights?: string[]
}

interface UserPreferences {
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced'
  interests: string[]
  learningStyle: 'visual' | 'text' | 'interactive' | 'mixed'
  notificationSettings: {
    realTimeUpdates: boolean
    progressAlerts: boolean
    actionReminders: boolean
  }
}

interface AssistantResponse {
  response: string
  confidence: number
  civicInsights: string[]
  actionSuggestions: string[]
  toolsUsed: string[]
  followUpQuestions: string[]
  relatedTopics: string[]
  streamingData?: {
    totalSteps: number
    currentStep: number
    stepDescription: string
    progressPercentage: number
  }
}

interface StreamingUpdate {
  type: 'progress' | 'insight' | 'action' | 'completion'
  data: any
  timestamp: Date
  stepNumber: number
  totalSteps: number
}

// =============================================================================
// CIVICSENSE ASSISTANT CLASS
// =============================================================================

export class CivicSenseAssistant extends BaseAITool<any, AssistantResponse> {
  public userAnalyzer: UserBehaviorAnalyzerAI
  public actionGenerator: CivicActionGeneratorAI
  public collectionOrganizer: CollectionOrganizerAgent
  public takeawaysGenerator: KeyTakeawaysGenerator
  public powerAnalyzer: PowerDynamicsAnalyzerAI
  public billAnalyzer: CivicSenseBillAnalyzer
  public biasAnalyzer: EnhancedBiasAnalyzer
  public themeDetector: MLThemeDetector
  public orchestrator: UnifiedAIOrchestrator
  public personalityManager = getPersonalityManager()

  private conversations: Map<string, ConversationContext> = new Map()
  private streamingCallbacks: Map<string, (update: StreamingUpdate) => void> = new Map()
  private personalityCache: Map<string, CivicPersonality[]> = new Map()

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'CivicSense Assistant (Alex)',
      type: 'content_generator', // Using valid type from BaseAITool
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 45000,
      ...config
    })

    // Initialize all AI tools
    this.userAnalyzer = new UserBehaviorAnalyzerAI()
    this.actionGenerator = new CivicActionGeneratorAI()
    this.collectionOrganizer = new CollectionOrganizerAgent()
    this.takeawaysGenerator = new KeyTakeawaysGenerator()
    this.powerAnalyzer = new PowerDynamicsAnalyzerAI()
    this.billAnalyzer = new CivicSenseBillAnalyzer()
    this.biasAnalyzer = new EnhancedBiasAnalyzer()
    this.themeDetector = new MLThemeDetector()
    this.orchestrator = new UnifiedAIOrchestrator()
  }

  // =============================================================================
  // MAIN CONVERSATION INTERFACE
  // =============================================================================

  /**
   * Main conversation handler with real-time streaming
   */
  async chat(
    message: string, 
    context: Partial<ConversationContext>,
    onStream?: (update: StreamingUpdate) => void
  ): Promise<AIToolResult<AssistantResponse>> {
    const startTime = Date.now()
    const sessionId = context.sessionId || this.generateSessionId()
    
    try {
      // Set up streaming if callback provided
      if (onStream) {
        this.streamingCallbacks.set(sessionId, onStream)
      }

      // Initialize or update conversation context
      const conversationContext = this.getOrCreateContext(sessionId, context)
      
      // Stream progress: Starting analysis
      this.emitStream(sessionId, {
        type: 'progress',
        data: { step: 'Analyzing your question with civic perspective...', progress: 10 },
        timestamp: new Date(),
        stepNumber: 1,
        totalSteps: 6
      })

      // Analyze user intent and determine appropriate tools
      const intentAnalysis = await this.analyzeUserIntent(message, conversationContext)
      
      // Stream progress: Intent understood
      this.emitStream(sessionId, {
        type: 'insight',
        data: { insight: intentAnalysis.primaryIntent, confidence: intentAnalysis.confidence },
        timestamp: new Date(),
        stepNumber: 2,
        totalSteps: 6
      })

      // Route to appropriate AI tools based on intent
      const toolResults = await this.routeToTools(intentAnalysis, message, conversationContext)
      
      // Stream progress: Tools processing
      this.emitStream(sessionId, {
        type: 'progress',
        data: { step: 'Processing with civic education tools...', progress: 60 },
        timestamp: new Date(),
        stepNumber: 4,
        totalSteps: 6
      })

      // Generate response with Alex's personality
      const response = await this.generatePersonalizedResponse(
        message, 
        toolResults, 
        conversationContext
      )

      // Update conversation history
      this.updateConversationHistory(sessionId, message, response, toolResults)

      // Stream completion
      this.emitStream(sessionId, {
        type: 'completion',
        data: response,
        timestamp: new Date(),
        stepNumber: 6,
        totalSteps: 6
      })

      return {
        success: true,
        data: response,
        metadata: {
          toolName: this.config.name,
          processingTime: Date.now() - startTime,
          provider: this.config.provider,
          model: this.config.model,
          retryCount: 0
        }
      }

    } catch (error) {
      console.error('CivicSense Assistant error:', error)
      
      const fallbackResponse: AssistantResponse = {
        response: "I'm having trouble processing that right now, but I'm still here to help you understand how power works. Can you try rephrasing your question?",
        confidence: 30,
        civicInsights: ["Technical difficulties don't stop civic engagement"],
        actionSuggestions: ["Try asking about a specific civic topic", "Check our knowledge base"],
        toolsUsed: [],
        followUpQuestions: ["What specific aspect of government are you curious about?"],
        relatedTopics: []
      }

      return {
        success: false,
        data: fallbackResponse,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          toolName: this.config.name,
          processingTime: Date.now() - startTime,
          provider: this.config.provider,
          model: this.config.model,
          retryCount: 0
        }
      }
    } finally {
      // Clean up streaming callback
      this.streamingCallbacks.delete(sessionId)
    }
  }

  // =============================================================================
  // INTENT ANALYSIS & ROUTING
  // =============================================================================

  private async analyzeUserIntent(
    message: string, 
    context: ConversationContext
  ): Promise<{
    primaryIntent: string
    confidence: number
    toolsNeeded: string[]
    urgency: 'low' | 'medium' | 'high'
    civicArea: string[]
  }> {
    // Analyze message for civic education intent
    const civicKeywords = {
      'action': ['what can I do', 'how to help', 'take action', 'get involved'],
      'analysis': ['explain', 'analyze', 'understand', 'how does', 'why'],
      'news': ['latest', 'current', 'today', 'recent', 'news'],
      'power': ['power', 'influence', 'control', 'decision', 'behind the scenes'],
      'voting': ['vote', 'election', 'candidate', 'ballot', 'democracy'],
      'rights': ['rights', 'constitutional', 'amendment', 'freedom', 'liberty']
    }

    let primaryIntent = 'general_inquiry'
    let confidence = 50
    const toolsNeeded: string[] = []
    const civicAreas: string[] = []

    // Analyze message content
    const lowerMessage = message.toLowerCase()
    
    for (const [area, keywords] of Object.entries(civicKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        civicAreas.push(area)
        confidence += 15
        
        // Determine primary intent
        if (area === 'action') {
          primaryIntent = 'action_guidance'
          toolsNeeded.push('actionGenerator', 'powerAnalyzer')
        } else if (area === 'analysis') {
          primaryIntent = 'civic_analysis'
          toolsNeeded.push('powerAnalyzer', 'biasAnalyzer')
        } else if (area === 'news') {
          primaryIntent = 'current_events'
          toolsNeeded.push('biasAnalyzer', 'takeawaysGenerator')
        }
      }
    }

    // Determine urgency based on language
    const urgencyIndicators = {
      high: ['urgent', 'crisis', 'emergency', 'now', 'immediately'],
      medium: ['soon', 'important', 'need to', 'should'],
      low: ['general', 'curious', 'interested', 'wonder']
    }

    let urgency: 'low' | 'medium' | 'high' = 'low'
    for (const [level, indicators] of Object.entries(urgencyIndicators)) {
      if (indicators.some(indicator => lowerMessage.includes(indicator))) {
        urgency = level as 'low' | 'medium' | 'high'
        break
      }
    }

    return {
      primaryIntent,
      confidence: Math.min(confidence, 95),
      toolsNeeded: toolsNeeded.length > 0 ? toolsNeeded : ['general'],
      urgency,
      civicArea: civicAreas
    }
  }

  private async routeToTools(
    intent: any,
    message: string,
    context: ConversationContext
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>()

    // Stream progress: Routing to tools
    this.emitStream(context.sessionId, {
      type: 'progress',
      data: { step: 'Consulting civic education experts...', progress: 30 },
      timestamp: new Date(),
      stepNumber: 3,
      totalSteps: 6
    })

    try {
      // Route based on intent
      if (intent.toolsNeeded.includes('actionGenerator')) {
        const actionResult = await this.actionGenerator.process({
          topic: message,
          content: `User inquiry: ${message}`,
          config: {
            userCapacity: context.userPreferences.preferredDifficulty,
            preferredActionTypes: ['contact', 'educate', 'advocate'],
            timeAvailable: 'moderate',
            issueUrgency: intent.urgency === 'high' ? 'crisis' : 'routine',
            userLocation: { state: 'Unknown' } // Would get from user profile
          }
        })
        results.set('actions', actionResult)
      }

      if (intent.toolsNeeded.includes('powerAnalyzer')) {
        const powerResult = await this.powerAnalyzer.process({
          content: message,
          contentType: 'policy_document', // Inferred type
          title: 'User Inquiry Analysis',
          metadata: {
            date: new Date().toISOString(),
            source: 'user_query'
          }
        })
        results.set('powerDynamics', powerResult)
      }

      if (intent.toolsNeeded.includes('biasAnalyzer')) {
        const biasResult = await this.biasAnalyzer.process({
          articleUrl: 'user_query',
          articleContent: message
        })
        results.set('biasAnalysis', biasResult)
      }

      // Always get user behavior insights for personalization
      if (context.userId) {
        const behaviorResult = await this.userAnalyzer.process({
          userId: context.userId,
          availableCollections: [], // Would load real collections
          options: {
            maxRecommendations: 5,
            includeChallengingContent: true,
            optimizeForEngagement: true
          }
        })
        results.set('userBehavior', behaviorResult)
      }

    } catch (error) {
      console.error('Tool routing error:', error)
      // Continue with available results
    }

    return results
  }

  // =============================================================================
  // RESPONSE GENERATION
  // =============================================================================

  private async generatePersonalizedResponse(
    userMessage: string,
    toolResults: Map<string, any>,
    context: ConversationContext
  ): Promise<AssistantResponse> {
    // Stream progress: Generating response
    this.emitStream(context.sessionId, {
      type: 'progress',
      data: { step: 'Crafting response with CivicSense insights...', progress: 80 },
      timestamp: new Date(),
      stepNumber: 5,
      totalSteps: 6
    })

    // Extract insights from tool results
    const civicInsights: string[] = []
    const actionSuggestions: string[] = []
    const toolsUsed: string[] = []

    for (const [toolName, result] of toolResults.entries()) {
      toolsUsed.push(toolName)
      
      if (result.success && result.data) {
        // Extract civic insights based on tool type
        if (toolName === 'actions' && result.data.immediateActions) {
          result.data.immediateActions.forEach((action: any) => {
            actionSuggestions.push(action.title)
            civicInsights.push(...(action.leverage_points || []))
          })
        }
        
        if (toolName === 'powerDynamics' && result.data.powerStructures) {
          civicInsights.push(...result.data.uncomfortableTruths)
          civicInsights.push(...result.data.leveragePoints)
        }
      }
    }

    // Generate Alex's personality-driven response
    const alexResponse = this.generateAlexResponse(
      userMessage, 
      civicInsights, 
      actionSuggestions,
      context
    )

    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(userMessage, civicInsights)
    
    // Suggest related topics
    const relatedTopics = this.suggestRelatedTopics(userMessage, civicInsights)

    return {
      response: alexResponse,
      confidence: Math.min(85 + (civicInsights.length * 2), 95),
      civicInsights: civicInsights.slice(0, 5), // Top 5 insights
      actionSuggestions: actionSuggestions.slice(0, 3), // Top 3 actions
      toolsUsed,
      followUpQuestions,
      relatedTopics
    }
  }

  private generateAlexResponse(
    userMessage: string,
    insights: string[],
    actions: string[],
    context: ConversationContext
  ): string {
    // Alex's voice: direct, uncompromising, evidence-based
    const responses = []

    // Opening acknowledgment
    responses.push("Here's what you need to know about how power actually works:")

    // Share insights with Alex's perspective
    if (insights.length > 0) {
      responses.push("\n**The uncomfortable truth:**")
      insights.slice(0, 3).forEach(insight => {
        responses.push(`• ${insight}`)
      })
    }

    // Actionable next steps
    if (actions.length > 0) {
      responses.push("\n**What you can do right now:**")
      actions.slice(0, 3).forEach(action => {
        responses.push(`• ${action}`)
      })
    }

    // Alex's signature closing
    responses.push("\nRemember: They're counting on you not understanding this. Prove them wrong.")

    return responses.join('\n')
  }

  private generateFollowUpQuestions(message: string, insights: string[]): string[] {
    const questions = [
      "Want to know who's really making these decisions?",
      "Should we look at what actions you can take today?",
      "Curious about how this affects your community specifically?"
    ]

    // Add context-specific questions based on insights
    if (insights.some(insight => insight.includes('vote') || insight.includes('election'))) {
      questions.push("Want to see how your representatives actually voted on this?")
    }

    if (insights.some(insight => insight.includes('lobby') || insight.includes('influence'))) {
      questions.push("Should we trace the money behind these decisions?")
    }

    return questions.slice(0, 3)
  }

  private suggestRelatedTopics(message: string, insights: string[]): string[] {
    const topics = [
      "Constitutional Rights",
      "Electoral Systems", 
      "Government Structure",
      "Policy Making Process"
    ]

    // Add relevant topics based on message content
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('vote') || lowerMessage.includes('election')) {
      topics.unshift("Voting Rights", "Election Security")
    }
    
    if (lowerMessage.includes('congress') || lowerMessage.includes('senate')) {
      topics.unshift("Congressional Power", "Legislative Process")
    }

    return topics.slice(0, 4)
  }

  // =============================================================================
  // CONTEXT MANAGEMENT
  // =============================================================================

  private getOrCreateContext(
    sessionId: string, 
    partialContext: Partial<ConversationContext>
  ): ConversationContext {
    if (this.conversations.has(sessionId)) {
      const existing = this.conversations.get(sessionId)!
      // Update with new information
      Object.assign(existing, partialContext)
      return existing
    }

    const newContext: ConversationContext = {
      sessionId,
      conversationHistory: [],
      userPreferences: {
        preferredDifficulty: 'intermediate',
        interests: [],
        learningStyle: 'mixed',
        notificationSettings: {
          realTimeUpdates: true,
          progressAlerts: true,
          actionReminders: true
        }
      },
      activeTools: [],
      ...partialContext
    }

    this.conversations.set(sessionId, newContext)
    return newContext
  }

  private updateConversationHistory(
    sessionId: string,
    userMessage: string,
    response: AssistantResponse,
    toolResults: Map<string, any>
  ): void {
    const context = this.conversations.get(sessionId)
    if (!context) return

    // Add user turn
    context.conversationHistory.push({
      id: this.generateTurnId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    })

    // Add assistant turn
    context.conversationHistory.push({
      id: this.generateTurnId(),
      role: 'assistant',
      content: response.response,
      timestamp: new Date(),
      toolsUsed: response.toolsUsed,
      civicInsights: response.civicInsights
    })

    // Keep only last 20 turns for memory efficiency
    if (context.conversationHistory.length > 20) {
      context.conversationHistory = context.conversationHistory.slice(-20)
    }
  }

  // =============================================================================
  // STREAMING SUPPORT
  // =============================================================================

  private emitStream(sessionId: string, update: StreamingUpdate): void {
    const callback = this.streamingCallbacks.get(sessionId)
    if (callback) {
      callback(update)
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTurnId(): string {
    return `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // =============================================================================
  // BASE AI TOOL IMPLEMENTATION
  // =============================================================================

  protected async validateInput(input: any): Promise<any> {
    // Flexible input validation for conversational AI
    if (typeof input === 'string') {
      return { message: input }
    }
    return input
  }

  protected async processWithAI(input: any): Promise<string> {
    // This would use the main chat method for processing
    const result = await this.chat(input.message || input, {})
    return JSON.stringify(result.data)
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<AssistantResponse> {
    try {
      return JSON.parse(rawOutput)
    } catch {
      // Fallback for non-JSON responses
      return {
        response: rawOutput,
        confidence: 70,
        civicInsights: [],
        actionSuggestions: [],
        toolsUsed: [],
        followUpQuestions: [],
        relatedTopics: []
      }
    }
  }

  protected async validateOutput(output: AssistantResponse): Promise<AssistantResponse> {
    // Ensure response has required CivicSense characteristics
    if (!output.response || output.response.length < 10) {
      throw new Error('Response too short for meaningful civic education')
    }

    if (output.confidence < 30) {
      throw new Error('Response confidence too low for reliable civic guidance')
    }

    return output
  }

  protected async saveToSupabase(data: AssistantResponse): Promise<AssistantResponse> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabase
        .from('assistant_interactions')
        .insert({
          response_content: data.response,
          confidence_score: data.confidence,
          civic_insights: data.civicInsights,
          action_suggestions: data.actionSuggestions,
          tools_used: data.toolsUsed,
          follow_up_questions: data.followUpQuestions,
          related_topics: data.relatedTopics,
          created_at: new Date().toISOString()
        })

      return data
    } catch (error) {
      console.error('Error saving assistant interaction:', error)
      // Non-blocking error for user experience
      return data
    }
  }

  // =============================================================================
  // PUBLIC METHODS FOR ACCESSING TOOLS
  // =============================================================================

  /**
   * Generate quick actions for a topic
   */
  async generateQuickActions(topic: string, urgency: 'routine' | 'urgent' | 'crisis' = 'routine'): Promise<any[]> {
    const result = await this.actionGenerator.process({
      topic,
      content: `User topic: ${topic}`,
      config: {
        userCapacity: 'intermediate',
        preferredActionTypes: ['contact', 'educate', 'advocate'],
        timeAvailable: 'moderate',
        issueUrgency: urgency,
        userLocation: { state: 'Unknown' }
      }
    })
    
    if (result.success && result.data?.immediateActions) {
      return result.data.immediateActions
    }
    return []
  }

  /**
   * Analyze power dynamics in content
   */
  async analyzePowerDynamics(content: string, contentType: "bill" | "hearing" | "news_article" | "policy_document" | "speech" = 'policy_document', title: string = 'Analysis'): Promise<any> {
    return await this.powerAnalyzer.process({
      content,
      contentType,
      title,
      metadata: {
        date: new Date().toISOString(),
        source: 'user_query'
      }
    })
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get singleton instance of CivicSense Assistant
 */
let assistantInstance: CivicSenseAssistant | null = null

export function getCivicSenseAssistant(): CivicSenseAssistant {
  if (!assistantInstance) {
    assistantInstance = new CivicSenseAssistant()
  }
  return assistantInstance
}

/**
 * Quick chat interface for simple queries
 */
export async function askAlex(
  message: string, 
  context?: Partial<ConversationContext>
): Promise<string> {
  const assistant = getCivicSenseAssistant()
  const result = await assistant.chat(message, context || {})
  return result.data?.response || "I'm having trouble with that right now. Can you try again?"
}

/**
 * Generate civic actions for a topic
 */
export async function getCivicActions(
  topic: string,
  urgency: 'routine' | 'urgent' | 'crisis' = 'routine'
): Promise<string[]> {
  const assistant = getCivicSenseAssistant()
  const actions = await assistant.actionGenerator.generateQuickActions(topic, urgency)
  return actions.map(action => action.title)
}

/**
 * Analyze power dynamics in content
 */
export async function analyzePower(content: string): Promise<{
  powerStructures: string[]
  leveragePoints: string[]
  uncomfortableTruths: string[]
}> {
  const assistant = getCivicSenseAssistant()
  const result = await assistant.powerAnalyzer.process({
    content,
    contentType: 'policy_document',
    title: 'Power Analysis Request'
  })

  if (result.success && result.data) {
    // Convert complex power structures to simple strings for the return type
    const powerStructures = (result.data.powerStructures || []).map((ps: any) => 
      typeof ps === 'string' ? ps : `${ps.entity}: ${ps.description}`
    )
    
    // Safely extract properties that might exist
    const leveragePoints = (result.data as any)?.keyLeveragePoints || (result.data as any)?.leveragePoints || []
    const uncomfortableTruths = (result.data as any)?.uncomfortableTruths || []
    
    return {
      powerStructures,
      leveragePoints,
      uncomfortableTruths
    }
  }

  return { powerStructures: [], leveragePoints: [], uncomfortableTruths: [] }
}

export default CivicSenseAssistant 