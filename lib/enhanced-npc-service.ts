import { supabase } from './supabase'
import { NPCPersonality, NPC_PERSONALITIES, NPCBehaviorEngine } from './multiplayer-npcs'

// =============================================================================
// TYPES FOR COMPATIBILITY
// =============================================================================

export interface NPCQuizAttempt {
  id: string
  npcId: string
  topicId: string
  totalQuestions: number
  correctAnswers: number
  score: number
  timeSpentSeconds: number
  accuracyPercentage: number
  startedAt: string
  completedAt?: string
  isCompleted: boolean
}

export interface NPCPerformanceStats {
  npcCode: string
  displayName: string
  personalityType: string
  skillLevel: string
  totalQuizzes: number
  avgAccuracy: number
  avgTimePerQuestion: number
  recentPerformance: number
}

// =============================================================================
// OPENAI INTEGRATION FOR DYNAMIC NPC PERSONALITIES
// =============================================================================

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface NPCConversationContext {
  npcId: string
  playerId?: string
  roomId?: string
  quizContext?: {
    topicId: string
    currentQuestion?: any
    userPerformance?: {
      correctAnswers: number
      totalAnswered: number
      averageTime: number
    }
    roomPerformance?: {
      averageScore: number
      playerCount: number
      userRank: number
    }
  }
  conversationHistory?: Array<{
    speaker: 'npc' | 'user' | 'system'
    message: string
    timestamp: string
    context?: string
  }>
  triggerType: 'on_join' | 'on_correct' | 'on_incorrect' | 'on_game_start' | 'on_game_end' | 'on_question_start' | 'on_help_request' | 'on_encouragement_needed'
  userMood?: 'confident' | 'struggling' | 'frustrated' | 'engaged' | 'neutral'
}

interface NPCResponse {
  message: string
  tone: 'supportive' | 'competitive' | 'analytical' | 'casual' | 'formal' | 'encouraging' | 'curious'
  educationalValue: 'high' | 'medium' | 'low'
  followUpSuggestion?: string
  factCheckReference?: string
  personalityTraits: string[]
}

// =============================================================================
// ENHANCED NPC SERVICE WITH OPENAI INTEGRATION
// =============================================================================

export class EnhancedNPCService {
  private openaiApiKey: string | null = null

  constructor() {
    // Initialize OpenAI API key from environment
    this.openaiApiKey = process.env.OPENAI_API_KEY || null
    if (!this.openaiApiKey && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ OpenAI API key not found in development environment. NPCs will use fallback responses.')
      console.info('💡 To enable AI-powered NPCs, add OPENAI_API_KEY to your .env.local file')
    }
  }

  /**
   * Generate dynamic NPC conversation using OpenAI 4o
   */
  async generateNPCMessage(context: NPCConversationContext): Promise<NPCResponse> {
    // Get NPCs from database instead of hardcoded array
    const allNpcs = await this.getAllNPCs()
    const npc = allNpcs.find(n => n.id === context.npcId)
    
    if (!npc) {
      throw new Error(`NPC not found: ${context.npcId}`)
    }

    // If OpenAI is not available, fall back to static messages
    if (!this.openaiApiKey) {
      return this.getFallbackResponse(npc, context)
    }

    try {
      const systemPrompt = this.buildSystemPrompt(npc, context)
      const userPrompt = this.buildUserPrompt(context)
      
      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], npc)

      return this.parseOpenAIResponse(response, npc, context)
    } catch (error) {
      console.error('Error generating NPC message:', error)
      return this.getFallbackResponse(npc, context)
    }
  }

  /**
   * Build personality-specific system prompt
   */
  private buildSystemPrompt(npc: NPCPersonality, context: NPCConversationContext): string {
    const personalityTraits = {
      confidenceLevel: npc.traits.confidenceLevel,
      consistency: npc.traits.consistency,
      specialties: npc.traits.specialties.join(', '),
      weaknesses: npc.traits.weaknesses.join(', ')
    }

    return `You are ${npc.name}, a ${npc.skillLevel}-level civic learner in a multiplayer quiz game called CivicSense.

CORE IDENTITY:
- Personality: ${npc.description}
- Skill Level: ${npc.skillLevel} (accuracy range: ${npc.accuracyRange[0]}-${npc.accuracyRange[1]}%)
- Confidence: ${npc.traits.confidenceLevel}/1.0
- Specialties: ${personalityTraits.specialties}
- Weaknesses: ${personalityTraits.weaknesses}

CORE VALUES YOU MUST EMBODY:
1. CIVIC EDUCATION ABOVE ENTERTAINMENT - Every interaction should enhance learning, not just provide companionship
2. AUTHENTIC UNCERTAINTY & GROWTH - Model intellectual humility, admit when you don't know something
3. INCLUSIVE DEMOCRATIC VALUES - Respect all perspectives, focus on process over partisan outcomes
4. INFORMATION LITERACY - Reference sources, distinguish facts from opinions, ask clarifying questions

PERSONALITY GUIDELINES:
- Speak naturally as ${npc.name} would, incorporating your background and knowledge level
- Show genuine curiosity about civic topics, especially in your specialty areas
- Admit uncertainty in your weak areas: "${personalityTraits.weaknesses}"
- Reference where you learned information when relevant
- Model good democratic participation and respectful discourse
- Encourage others while staying true to your personality

CONVERSATION STYLE:
- Keep responses conversational and authentic (2-3 sentences max unless explaining something complex)
- Use your emoji ${npc.emoji} sparingly and naturally
- Avoid lecturing or being preachy
- Show genuine reactions to quiz events and other players' performance
- Build on shared learning experiences

EDUCATIONAL APPROACH:
- When someone gets something right, celebrate specifically what they understood well
- When someone struggles, offer help without making them feel stupid
- Share your own learning journey and mistakes
- Ask follow-up questions that deepen understanding
- Model fact-checking and source evaluation

Remember: You're a fellow learner, not a teacher. Your personality quirks should enhance learning, not distract from it.`
  }

  /**
   * Build context-specific user prompt
   */
  private buildUserPrompt(context: NPCConversationContext): string {
    let prompt = `SITUATION: ${context.triggerType.replace('_', ' ')}\n`

    // Add quiz context
    if (context.quizContext) {
      prompt += `\nQUIZ CONTEXT:
- Topic: ${context.quizContext.topicId}
- User Performance: ${context.quizContext.userPerformance?.correctAnswers || 0}/${context.quizContext.userPerformance?.totalAnswered || 0} correct`

      if (context.quizContext.roomPerformance) {
        prompt += `
- Room Average: ${context.quizContext.roomPerformance.averageScore}%
- User Rank: ${context.quizContext.roomPerformance.userRank}/${context.quizContext.roomPerformance.playerCount}`
      }
    }

    // Add user mood context
    if (context.userMood && context.userMood !== 'neutral') {
      prompt += `\nUSER MOOD: The user seems ${context.userMood}`
    }

    // Add conversation history for continuity
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += `\nRECENT CONVERSATION:`
      context.conversationHistory.slice(-3).forEach(msg => {
        prompt += `\n- ${msg.speaker}: ${msg.message}`
      })
    }

    // Add specific trigger instructions
    const triggerInstructions = {
      'on_join': 'You just joined the multiplayer room. Greet everyone authentically based on your personality.',
      'on_correct': 'A user just answered a question correctly. React genuinely based on the difficulty and your knowledge level.',
      'on_incorrect': 'A user just got a question wrong. Be supportive while staying true to your personality.',
      'on_game_start': 'The quiz is about to begin. Express excitement/readiness in your characteristic way.',
      'on_game_end': 'The quiz just finished. Reflect on the experience and what was learned.',
      'on_question_start': 'A new question just appeared. React based on whether it\'s in your specialty area.',
      'on_help_request': 'Someone asked for help or seems confused. Offer assistance in your characteristic way.',
      'on_encouragement_needed': 'Someone seems frustrated or is struggling. Provide encouragement that fits your personality.'
    }

    prompt += `\n\nYOUR TASK: ${triggerInstructions[context.triggerType] || 'Respond appropriately to the situation.'}`

    prompt += `\n\nGenerate a natural, authentic response that:
1. Stays true to your personality and knowledge level
2. Enhances civic learning in some way
3. Feels genuine and conversational
4. Models good democratic participation
5. Is 1-2 sentences unless explanation is needed

Response format: Just the message content, no quotes or formatting.`

    return prompt
  }

  /**
   * Call OpenAI API with proper configuration
   */
  private async callOpenAI(messages: OpenAIMessage[], npc: NPCPersonality): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not available')
    }

    // Adjust temperature based on NPC confidence and consistency
    const temperature = npc.traits.confidenceLevel > 0.7 ? 0.7 : 0.9
    const maxTokens = 150 // Keep responses concise

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature,
        max_tokens: maxTokens,
        presence_penalty: 0.6, // Encourage varied responses
        frequency_penalty: 0.3 // Reduce repetition
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * Parse OpenAI response and add metadata
   */
  private parseOpenAIResponse(message: string, npc: NPCPersonality, context: NPCConversationContext): NPCResponse {
    // Determine tone based on message content and NPC personality
    let tone: NPCResponse['tone'] = 'casual'
    
    if (message.toLowerCase().includes('great') || message.toLowerCase().includes('excellent')) {
      tone = 'encouraging'
    } else if (npc.id === 'judge_thompson') {
      tone = 'formal'
    } else if (npc.id === 'civic_scholar') {
      tone = 'analytical'
    } else if (context.triggerType === 'on_incorrect') {
      tone = 'supportive'
    } else if (npc.id === 'news_junkie') {
      tone = 'competitive'
    }

    // Assess educational value
    let educationalValue: NPCResponse['educationalValue'] = 'medium'
    if (message.includes('Constitution') || message.includes('source') || message.includes('because')) {
      educationalValue = 'high'
    } else if (context.triggerType === 'on_join' || context.triggerType === 'on_game_start') {
      educationalValue = 'low'
    }

    return {
      message: message.trim(),
      tone,
      educationalValue,
      personalityTraits: [npc.skillLevel, ...npc.traits.specialties.slice(0, 2)]
    }
  }

  /**
   * Fallback to static responses when OpenAI is unavailable
   */
  private getFallbackResponse(npc: NPCPersonality, context: NPCConversationContext): NPCResponse {
    // Map trigger types to chat message keys
    const triggerToMessageKey: Record<string, keyof NPCPersonality['chatMessages']> = {
      'on_join': 'onJoin',
      'on_correct': 'onCorrect', 
      'on_incorrect': 'onIncorrect',
      'on_game_start': 'onGameStart',
      'on_game_end': 'onGameEnd'
    }
    
    const messageKey = triggerToMessageKey[context.triggerType] || 'onJoin'
    const messages = npc.chatMessages[messageKey]
    const message = messages[Math.floor(Math.random() * messages.length)]

    return {
      message,
      tone: 'casual',
      educationalValue: 'medium',
      personalityTraits: [npc.skillLevel]
    }
  }

  /**
   * Store conversation in database for continuity
   */
  async recordConversation(
    npcId: string,
    roomId: string,
    playerId: string,
    message: string,
    context: NPCConversationContext
  ): Promise<void> {
    try {
      // Store conversation data (will work once migration 019 is run)
      console.log(`🤖 NPC Conversation: ${npcId} in room ${roomId}: "${message}"`)
      
      // TODO: Implement database storage once migration 019 is run
      // This is a placeholder to avoid type errors until then
    } catch (error) {
      console.warn('Error recording NPC conversation:', error)
    }
  }

  /**
   * Get conversation history for context
   */
  async getConversationHistory(
    npcId: string,
    roomId: string,
    limit: number = 10
  ): Promise<NPCConversationContext['conversationHistory']> {
    try {
      // Return empty array for now - will be implemented once migration 019 is run
      console.log(`🤖 Getting conversation history for NPC ${npcId} in room ${roomId} (not yet implemented)`)
      
      // TODO: Implement database retrieval once migration 019 is run
      return []
    } catch (error) {
      console.warn('Error fetching conversation history:', error)
      return []
    }
  }

  /**
   * Analyze user mood based on performance and behavior
   */
  analyzeUserMood(context: NPCConversationContext): NPCConversationContext['userMood'] {
    if (!context.quizContext?.userPerformance) return 'neutral'

    const { correctAnswers, totalAnswered, averageTime } = context.quizContext.userPerformance
    const accuracy = totalAnswered > 0 ? correctAnswers / totalAnswered : 0

    // Struggling indicators
    if (accuracy < 0.3 && totalAnswered >= 3) return 'frustrated'
    if (accuracy < 0.5 && averageTime > 20) return 'struggling'
    
    // Positive indicators  
    if (accuracy > 0.8 && totalAnswered >= 3) return 'confident'
    if (accuracy > 0.6 && averageTime < 10) return 'engaged'

    return 'neutral'
  }

  // =============================================================================
  // EXISTING METHODS (Updated for compatibility)
  // =============================================================================

  /**
   * Get all NPCs from database instead of hardcoded array
   */
  async getAllNPCs(): Promise<NPCPersonality[]> {
    try {
      const { data: npcs, error } = await supabase
        .from('npc_personalities')
        .select(`
          *,
          npc_category_specializations (
            category,
            specialization_type,
            modifier_percentage,
            confidence_modifier
          )
        `)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching NPCs from database:', error)
        throw new Error(`Failed to fetch NPCs from database: ${error.message}`)
      }

      if (!npcs || npcs.length === 0) {
        console.warn('No active NPCs found in database')
        return []
      }

      console.log(`📊 Loaded ${npcs.length} NPCs from database:`, npcs.map(npc => ({ 
        code: npc.npc_code, 
        name: npc.display_name,
        active: npc.is_active 
      })))

      // Convert database NPCs to NPCPersonality format
      return npcs.map(npc => this.convertDatabaseNPCToPersonality(npc))
    } catch (error) {
      console.error('Error in getAllNPCs:', error)
      throw error
    }
  }

  /**
   * Convert database NPC record to NPCPersonality format
   */
  private convertDatabaseNPCToPersonality(dbNpc: any): NPCPersonality {
    // Convert specializations to the expected format
    const specialties: string[] = []
    const weaknesses: string[] = []
    
    if (dbNpc.npc_category_specializations) {
      dbNpc.npc_category_specializations.forEach((spec: any) => {
        if (spec.specialization_type === 'strength') {
          specialties.push(spec.category)
        } else if (spec.specialization_type === 'weakness') {
          weaknesses.push(spec.category)
        }
      })
    }

    // Generate chat messages based on personality
    const chatMessages = this.generateChatMessagesForNPC(dbNpc)

    return {
      id: dbNpc.npc_code,
      name: dbNpc.display_name,
      emoji: dbNpc.emoji || '🤖',
      description: dbNpc.description || 'A helpful civic learning companion',
      skillLevel: dbNpc.base_skill_level as 'beginner' | 'intermediate' | 'advanced' | 'expert',
      accuracyRange: [dbNpc.base_accuracy_min, dbNpc.base_accuracy_max],
      responseTimeRange: [dbNpc.response_time_min, dbNpc.response_time_max],
      traits: {
        confidenceLevel: dbNpc.confidence_level,
        consistency: dbNpc.consistency_factor,
        specialties,
        weaknesses
      },
      chatMessages
    }
  }

  /**
   * Generate appropriate chat messages based on NPC personality
   */
  private generateChatMessagesForNPC(dbNpc: any): NPCPersonality['chatMessages'] {
    const name = dbNpc.first_name || dbNpc.display_name
    const profession = dbNpc.profession || 'civic learner'
    const style = dbNpc.communication_style || 'conversational'
    
    // Base messages that work for any NPC
    const baseMessages = {
      onJoin: [
        `Hi everyone! ${name} here, ready to learn some civics! ${dbNpc.emoji}`,
        `Hey! Looking forward to this quiz - ${profession} perspective here!`,
        `${name} joining in! Let's see what we can learn together.`
      ],
      onCorrect: [
        `Nice work! That's exactly right.`,
        `Great answer! I learned something too.`,
        `Excellent! You really know your stuff.`
      ],
      onIncorrect: [
        `No worries, that's a tricky one!`,
        `I've gotten that wrong before too.`,
        `These questions can be really challenging.`
      ],
      onGameStart: [
        `Let's do this! Ready to learn.`,
        `Game time! May the best civic knowledge win.`,
        `Here we go! Good luck everyone.`
      ],
      onGameEnd: [
        `Great game everyone! Learned a lot.`,
        `Thanks for playing! That was educational.`,
        `Fun quiz! Always good to brush up on civics.`
      ]
    }

    // Customize based on personality traits
    if (style === 'formal' || dbNpc.profession?.includes('Judge') || dbNpc.profession?.includes('Professor')) {
      baseMessages.onJoin = [
        `Good day. ${name} here, pleased to participate in this educational exercise.`,
        `Greetings. I look forward to a substantive discussion of civic matters.`,
        `Hello everyone. ${name}, ${profession}. Shall we begin?`
      ]
    } else if (style === 'casual' || dbNpc.age_range?.startsWith('18-') || dbNpc.profession?.includes('Student')) {
      baseMessages.onJoin = [
        `Hey everyone! ${name} here - let's crush this quiz! ${dbNpc.emoji}`,
        `What's up! Ready to learn some cool civic stuff!`,
        `Hi hi! ${name} in the house! This is gonna be fun!`
      ]
    }

    return baseMessages
  }

  async getNPCsByFilter(filters: {
    skillLevel?: string[]
    personalityType?: string[]
    count?: number
  }): Promise<NPCPersonality[]> {
    try {
      // Get NPCs from database
      const allNpcs = await this.getAllNPCs()
      let filtered = allNpcs

      if (filters.skillLevel && filters.skillLevel.length > 0) {
        filtered = filtered.filter(npc => filters.skillLevel!.includes(npc.skillLevel))
      }

      if (filters.personalityType && filters.personalityType.length > 0) {
        filtered = filtered.filter(npc => 
          filters.personalityType!.some(type => 
            npc.description.toLowerCase().includes(type.toLowerCase())
          )
        )
      }

      if (filters.count) {
        filtered = filtered.slice(0, filters.count)
      }

      return filtered
    } catch (error) {
      console.error('Error in getNPCsByFilter:', error)
      return []
    }
  }

  async getBalancedNPCMix(
    count: number, 
    difficulty: 'easy' | 'mixed' | 'hard' = 'mixed'
  ): Promise<NPCPersonality[]> {
    try {
      const filters: { skillLevel?: string[] } = {}

      if (difficulty === 'easy') {
        filters.skillLevel = ['beginner', 'intermediate']
      } else if (difficulty === 'hard') {
        filters.skillLevel = ['advanced', 'expert']
      }

      const availableNPCs = await this.getNPCsByFilter(filters)
      const shuffled = availableNPCs.sort(() => Math.random() - 0.5)
      return shuffled.slice(0, Math.min(count, availableNPCs.length))
    } catch (error) {
      console.error('Error in getBalancedNPCMix:', error)
      return []
    }
  }

  async generateNPCAnswer(
    npcId: string,
    question: any,
    humanResponsesContext?: { averageTime: number; correctCount: number; totalCount: number }
  ): Promise<{
    answer: string
    isCorrect: boolean
    responseTimeSeconds: number
    confidence: number
    reasoning: string
  }> {
    try {
      // Get NPCs from database
      const allNpcs = await this.getAllNPCs()
      const npc = allNpcs.find(n => n.id === npcId)
      
      if (!npc) {
        throw new Error(`NPC not found: ${npcId}. Available NPCs: ${allNpcs.map(n => n.id).join(', ')}`)
      }

      const engine = new NPCBehaviorEngine(npc)
      const result = await engine.generateAnswer(question)

      return {
        answer: result.answer,
        isCorrect: result.isCorrect,
        responseTimeSeconds: result.responseTimeSeconds,
        confidence: result.confidence,
        reasoning: `${npc.name} analyzed this ${question.category} question with ${npc.skillLevel} expertise`
      }
    } catch (error) {
      console.error('Error in generateNPCAnswer:', error)
      throw error
    }
  }

  /**
   * Record NPC quiz attempt (simplified version)
   */
  async recordNPCQuizAttempt(
    npcId: string,
    topicId: string,
    questions: any[],
    responses: any[],
    multiplayerRoomId?: string,
    humanPerformanceContext?: {
      averageScore: number
      humanCount: number
      npcPlacement: number
    }
  ): Promise<NPCQuizAttempt> {
    const correctAnswers = responses.filter(r => r.isCorrect).length
    const totalTime = responses.reduce((sum, r) => sum + r.responseTimeSeconds, 0)
    const score = (correctAnswers / questions.length) * 100

    // For now, just return a mock attempt object
    // Once the migration is run, this will save to the database
    const attempt: NPCQuizAttempt = {
      id: `npc_attempt_${Date.now()}`,
      npcId,
      topicId,
      totalQuestions: questions.length,
      correctAnswers,
      score,
      timeSpentSeconds: totalTime,
      accuracyPercentage: (correctAnswers / questions.length) * 100,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      isCompleted: true
    }

    console.log(`🤖 NPC ${npcId} completed quiz: ${correctAnswers}/${questions.length} correct (${score.toFixed(1)}%)`)

    return attempt
  }

  /**
   * Get NPC vs Human analytics (simplified)
   */
  async getNPCVsHumanAnalytics(): Promise<NPCPerformanceStats[]> {
    try {
      // Get NPCs from database
      const allNpcs = await this.getAllNPCs()
      
      // Return mock data for now
      return allNpcs.map(npc => ({
        npcCode: npc.id,
        displayName: npc.name,
        personalityType: npc.description.includes('scholar') ? 'scholar' : 
                        npc.description.includes('news') ? 'enthusiast' : 'general',
        skillLevel: npc.skillLevel,
        totalQuizzes: Math.floor(Math.random() * 50) + 10,
        avgAccuracy: (npc.accuracyRange[0] + npc.accuracyRange[1]) / 2,
        avgTimePerQuestion: (npc.responseTimeRange[0] + npc.responseTimeRange[1]) / 2,
        recentPerformance: Math.random() * 100
      }))
    } catch (error) {
      console.error('Error in getNPCVsHumanAnalytics:', error)
      return []
    }
  }

  /**
   * Get user vs NPC comparison (simplified)
   */
  async getUserVsNPCComparison(
    userId: string,
    categories: string[]
  ): Promise<{
    userStats: Record<string, { accuracy: number; totalQuizzes: number }>
    npcComparisons: Record<string, { 
      npcName: string
      npcAccuracy: number
      userRank: 'better' | 'similar' | 'worse'
      improvementSuggestion: string
    }[]>
  }> {
    try {
      // Get NPCs from database
      const allNpcs = await this.getAllNPCs()
      
      // Return mock comparison data
      const userStats: Record<string, { accuracy: number; totalQuizzes: number }> = {}
      const npcComparisons: Record<string, any[]> = {}

      categories.forEach(category => {
        userStats[category] = {
          accuracy: Math.random() * 100,
          totalQuizzes: Math.floor(Math.random() * 20) + 5
        }

        npcComparisons[category] = allNpcs.slice(0, 3).map(npc => {
          const npcAccuracy = (npc.accuracyRange[0] + npc.accuracyRange[1]) / 2
          const userAccuracy = userStats[category].accuracy
          
          let userRank: 'better' | 'similar' | 'worse'
          let improvementSuggestion: string

          if (userAccuracy > npcAccuracy + 5) {
            userRank = 'better'
            improvementSuggestion = `You're performing better than ${npc.name}! Try challenging yourself with harder questions.`
          } else if (userAccuracy < npcAccuracy - 5) {
            userRank = 'worse'
            improvementSuggestion = `${npc.name} is stronger in this area. Focus on ${category} topics to improve.`
          } else {
            userRank = 'similar'
            improvementSuggestion = `You're performing similarly to ${npc.name}. Keep practicing to pull ahead!`
          }

          return {
            npcName: npc.name,
            npcAccuracy,
            userRank,
            improvementSuggestion
          }
        })
      })

      return { userStats, npcComparisons }
    } catch (error) {
      console.error('Error in getUserVsNPCComparison:', error)
      return {
        userStats: {},
        npcComparisons: {}
      }
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const enhancedNPCService = new EnhancedNPCService() 

// Export types for use in other components
export type { NPCConversationContext, NPCResponse } 