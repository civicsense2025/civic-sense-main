import { enhancedNPCService, type NPCConversationContext, type NPCResponse } from './enhanced-npc-service'
import { multiplayerOperations, type MultiplayerRoom, type MultiplayerPlayer } from './multiplayer'
import { supabase } from './supabase'

// =============================================================================
// MULTIPLAYER NPC INTEGRATION WITH OPENAI
// =============================================================================

export interface NPCMultiplayerContext {
  roomId: string
  npcId: string
  playerId: string // The NPC's player ID in the room
  currentQuestion?: {
    id: string
    category: string
    difficulty: number
    text: string
  }
  roomState: {
    players: MultiplayerPlayer[]
    currentQuestionIndex: number
    totalQuestions: number
    averageScore: number
    timeRemaining?: number
  }
  userPerformance: Record<string, {
    correctAnswers: number
    totalAnswered: number
    averageTime: number
    lastAnswerCorrect?: boolean
  }>
}

export interface NPCBehaviorTrigger {
  type: NPCConversationContext['triggerType']
  targetUserId?: string
  questionData?: any
  performanceData?: any
  roomEvent?: 'player_joined' | 'player_left' | 'question_answered' | 'quiz_completed'
}

export class MultiplayerNPCIntegration {
  private conversationCache = new Map<string, NPCConversationContext['conversationHistory']>()
  private npcStates = new Map<string, {
    lastMessageTime: number
    messageCount: number
    currentMood: 'engaged' | 'supportive' | 'competitive' | 'analytical'
  }>()

  /**
   * Handle NPC behavior triggers in multiplayer context
   */
  async handleNPCTrigger(
    context: NPCMultiplayerContext,
    trigger: NPCBehaviorTrigger
  ): Promise<NPCResponse | null> {
    try {
      // Rate limiting: Don't spam messages
      if (!this.shouldNPCRespond(context.npcId, trigger.type)) {
        return null
      }

      // Build conversation context
      const conversationContext = await this.buildConversationContext(context, trigger)
      
      // Generate NPC response using OpenAI
      const response = await enhancedNPCService.generateNPCMessage(conversationContext)
      
      // Record the conversation for continuity
      await this.recordConversation(context, response, conversationContext)
      
      // Update NPC state
      this.updateNPCState(context.npcId, response)
      
      return response
    } catch (error) {
      console.error('Error handling NPC trigger:', error)
      return null
    }
  }

  /**
   * Simulate NPC answering a quiz question
   */
  async simulateNPCQuizAnswer(
    context: NPCMultiplayerContext,
    question: any
  ): Promise<{
    answer: string
    isCorrect: boolean
    responseTime: number
    chatMessage?: NPCResponse
  }> {
    try {
      // Generate the quiz answer
      const answerResult = await enhancedNPCService.generateNPCAnswer(
        context.npcId,
        question,
        this.getHumanPerformanceContext(context)
      )

      // Generate a chat message based on the answer
      const chatTrigger: NPCBehaviorTrigger = {
        type: answerResult.isCorrect ? 'on_correct' : 'on_incorrect',
        questionData: question,
        performanceData: answerResult
      }

      const chatMessage = await this.handleNPCTrigger(context, chatTrigger)

      return {
        answer: answerResult.answer,
        isCorrect: answerResult.isCorrect,
        responseTime: answerResult.responseTimeSeconds,
        chatMessage: chatMessage || undefined
      }
    } catch (error) {
      console.error('Error simulating NPC quiz answer:', error)
      throw error
    }
  }

  /**
   * Handle room events that might trigger NPC responses
   */
  async handleRoomEvent(
    context: NPCMultiplayerContext,
    event: NPCBehaviorTrigger['roomEvent'],
    eventData?: any
  ): Promise<NPCResponse[]> {
    const responses: NPCResponse[] = []

    try {
      switch (event) {
        case 'player_joined':
          if (eventData?.playerId !== context.playerId) { // Don't respond to self
            const trigger: NPCBehaviorTrigger = {
              type: 'on_join',
              targetUserId: eventData?.playerId,
              roomEvent: event
            }
            const response = await this.handleNPCTrigger(context, trigger)
            if (response) responses.push(response)
          }
          break

        case 'question_answered':
          // React to other players' answers
          if (eventData?.playerId !== context.playerId) {
            const trigger: NPCBehaviorTrigger = {
              type: eventData?.isCorrect ? 'on_correct' : 'on_incorrect',
              targetUserId: eventData?.playerId,
              questionData: eventData?.question,
              performanceData: eventData?.performance,
              roomEvent: event
            }
            
            // Only respond sometimes to avoid spam
            if (Math.random() < 0.3) { // 30% chance to react to others' answers
              const response = await this.handleNPCTrigger(context, trigger)
              if (response) responses.push(response)
            }
          }
          break

        case 'quiz_completed':
          const trigger: NPCBehaviorTrigger = {
            type: 'on_game_end',
            roomEvent: event
          }
          const response = await this.handleNPCTrigger(context, trigger)
          if (response) responses.push(response)
          break
      }
    } catch (error) {
      console.error('Error handling room event:', error)
    }

    return responses
  }

  /**
   * Check if user needs encouragement and trigger supportive NPC response
   */
  async checkForEncouragementNeeded(
    context: NPCMultiplayerContext,
    userId: string
  ): Promise<NPCResponse | null> {
    const userPerf = context.userPerformance[userId]
    if (!userPerf) return null

    // Detect struggling user
    const accuracy = userPerf.totalAnswered > 0 ? userPerf.correctAnswers / userPerf.totalAnswered : 0
    const needsEncouragement = accuracy < 0.4 && userPerf.totalAnswered >= 3

    if (needsEncouragement) {
      const trigger: NPCBehaviorTrigger = {
        type: 'on_encouragement_needed',
        targetUserId: userId,
        performanceData: userPerf
      }
      
      return await this.handleNPCTrigger(context, trigger)
    }

    return null
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async buildConversationContext(
    context: NPCMultiplayerContext,
    trigger: NPCBehaviorTrigger
  ): Promise<NPCConversationContext> {
    // Get conversation history
    const history = await this.getConversationHistory(context.roomId, context.npcId)
    
    // Analyze user mood if targeting specific user
    let userMood: NPCConversationContext['userMood'] = 'neutral'
    if (trigger.targetUserId && context.userPerformance[trigger.targetUserId]) {
      userMood = this.analyzeUserMood(context.userPerformance[trigger.targetUserId])
    }

    // Calculate room performance for context
    const roomPerformance = this.calculateRoomPerformance(context)

    return {
      npcId: context.npcId,
      playerId: trigger.targetUserId,
      roomId: context.roomId,
      triggerType: trigger.type,
      userMood,
      conversationHistory: history,
      quizContext: {
        topicId: 'multiplayer_quiz', // Could be more specific
        currentQuestion: context.currentQuestion,
        userPerformance: trigger.targetUserId ? context.userPerformance[trigger.targetUserId] : undefined,
        roomPerformance
      }
    }
  }

  private shouldNPCRespond(npcId: string, triggerType: string): boolean {
    const state = this.npcStates.get(npcId)
    const now = Date.now()
    
    if (!state) {
      this.npcStates.set(npcId, {
        lastMessageTime: now,
        messageCount: 1,
        currentMood: 'engaged'
      })
      return true
    }

    // Rate limiting: Max 1 message per 10 seconds
    if (now - state.lastMessageTime < 10000) {
      return false
    }

    // Special cases where NPC should always respond
    const alwaysRespond = ['on_join', 'on_game_start', 'on_game_end', 'on_encouragement_needed']
    if (alwaysRespond.includes(triggerType)) {
      return true
    }

    // Limit chattiness based on message count
    const maxMessagesPerMinute = 6
    if (state.messageCount > maxMessagesPerMinute) {
      return false
    }

    return true
  }

  private updateNPCState(npcId: string, response: NPCResponse): void {
    const state = this.npcStates.get(npcId)
    const now = Date.now()
    
    if (state) {
      // Reset message count if it's been more than a minute
      if (now - state.lastMessageTime > 60000) {
        state.messageCount = 1
      } else {
        state.messageCount++
      }
      
      state.lastMessageTime = now
      state.currentMood = this.mapToneToMood(response.tone)
    }
  }

  private mapToneToMood(tone: NPCResponse['tone']): 'engaged' | 'supportive' | 'competitive' | 'analytical' {
    switch (tone) {
      case 'supportive':
      case 'encouraging': return 'supportive'
      case 'competitive': return 'competitive'
      case 'analytical':
      case 'formal': return 'analytical'
      default: return 'engaged'
    }
  }

  private analyzeUserMood(userPerf: NPCMultiplayerContext['userPerformance'][string]): NPCConversationContext['userMood'] {
    const accuracy = userPerf.totalAnswered > 0 ? userPerf.correctAnswers / userPerf.totalAnswered : 0
    
    if (accuracy < 0.3 && userPerf.totalAnswered >= 3) return 'frustrated'
    if (accuracy < 0.5 && userPerf.averageTime > 20) return 'struggling'
    if (accuracy > 0.8 && userPerf.totalAnswered >= 3) return 'confident'
    if (accuracy > 0.6 && userPerf.averageTime < 10) return 'engaged'
    
    return 'neutral'
  }

  private calculateRoomPerformance(context: NPCMultiplayerContext) {
    const humanPlayers = context.roomState.players.filter(p => !p.guest_token?.startsWith('npc_'))
    const totalScore = Object.values(context.userPerformance).reduce((sum, perf) => {
      const accuracy = perf.totalAnswered > 0 ? perf.correctAnswers / perf.totalAnswered : 0
      return sum + (accuracy * 100)
    }, 0)

    return {
      averageScore: humanPlayers.length > 0 ? totalScore / humanPlayers.length : 0,
      playerCount: humanPlayers.length,
      userRank: 1 // Would need more complex calculation
    }
  }

  private getHumanPerformanceContext(context: NPCMultiplayerContext) {
    const humanPerfs = Object.values(context.userPerformance)
    if (humanPerfs.length === 0) return undefined

    const totalAnswered = humanPerfs.reduce((sum, perf) => sum + perf.totalAnswered, 0)
    const totalCorrect = humanPerfs.reduce((sum, perf) => sum + perf.correctAnswers, 0)
    const avgTime = humanPerfs.reduce((sum, perf) => sum + perf.averageTime, 0) / humanPerfs.length

    return {
      averageTime: avgTime,
      correctCount: totalCorrect,
      totalCount: totalAnswered
    }
  }

  private async getConversationHistory(
    roomId: string,
    npcId: string
  ): Promise<NPCConversationContext['conversationHistory']> {
    // Check cache first
    const cacheKey = `${roomId}-${npcId}`
    if (this.conversationCache.has(cacheKey)) {
      return this.conversationCache.get(cacheKey)!
    }

    // Fetch from database
    const history = await enhancedNPCService.getConversationHistory(npcId, roomId, 5)
    this.conversationCache.set(cacheKey, history)
    
    return history
  }

  private async recordConversation(
    context: NPCMultiplayerContext,
    response: NPCResponse,
    conversationContext: NPCConversationContext
  ): Promise<void> {
    try {
      await enhancedNPCService.recordConversation(
        context.npcId,
        context.roomId,
        context.playerId,
        response.message,
        conversationContext
      )

      // Update cache
      const cacheKey = `${context.roomId}-${context.npcId}`
      const history = this.conversationCache.get(cacheKey) || []
      history.unshift({
        speaker: 'npc',
        message: response.message,
        timestamp: new Date().toISOString(),
        context: conversationContext.triggerType
      })

      // Keep only last 10 messages in cache
      if (history.length > 10) {
        history.splice(10)
      }
      
      this.conversationCache.set(cacheKey, history)
    } catch (error) {
      console.error('Error recording conversation:', error)
    }
  }

  /**
   * Clear cache when room ends
   */
  clearRoomCache(roomId: string): void {
    for (const [key] of this.conversationCache) {
      if (key.startsWith(roomId)) {
        this.conversationCache.delete(key)
      }
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const multiplayerNPCIntegration = new MultiplayerNPCIntegration()

// =============================================================================
// UTILITY FUNCTIONS FOR MULTIPLAYER INTEGRATION
// =============================================================================

/**
 * Add an NPC to a multiplayer room with proper initialization
 */
export async function addNPCToRoom(
  roomCode: string,
  npcId: string
): Promise<{ success: boolean; playerId?: string; error?: string }> {
  try {
    // Use the new database function for adding NPCs (with type assertion for now)
    const { data, error } = await supabase.rpc('add_npc_to_multiplayer_room' as any, {
      p_room_code: roomCode.toUpperCase(),
      p_npc_code: npcId
    })

    if (error) {
      console.error('Database error adding NPC:', error)
      return { success: false, error: error.message }
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'Failed to add NPC' }
    }

    const result = data[0] as any
    if (!result.success) {
      return { success: false, error: result.message }
    }

    // Get the NPC player data
    const { data: npcPlayerData, error: playerError } = await supabase
      .from('multiplayer_room_players')
      .select('*')
      .eq('guest_token', `npc_${npcId}`)
      .single()

    if (playerError) {
      console.warn('Could not fetch NPC player data:', playerError)
      return { success: false, error: 'Failed to get NPC player data' }
    }

    // Get room data
    const { data: roomData, error: roomError } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (roomError) {
      console.warn('Could not fetch room data:', roomError)
    }

    // Initialize NPC state
    const context: NPCMultiplayerContext = {
      roomId: roomData?.id || result.room_id,
      npcId,
      playerId: npcPlayerData.id,
      roomState: {
        players: [],
        currentQuestionIndex: 0,
        totalQuestions: 0,
        averageScore: 0
      },
      userPerformance: {}
    }

    // Send join message using the new database function
    try {
      const npc = await enhancedNPCService.getAllNPCs().then(npcs => npcs.find(n => n.id === npcId))
      if (npc) {
        const joinMessages = npc.chatMessages.onJoin
        const message = joinMessages[Math.floor(Math.random() * joinMessages.length)]
        
        await supabase.rpc('send_npc_message' as any, {
          p_room_id: context.roomId,
          p_npc_id: result.npc_player_id, // This should be the NPC personality ID
          p_message_content: message,
          p_message_type: 'chat',
          p_trigger_type: 'on_join',
          p_educational_value: 'low'
        })
      }
    } catch (messageError) {
      console.warn('Could not send NPC join message:', messageError)
      // Don't fail the whole operation for a message error
    }

    return { success: true, playerId: npcPlayerData.id }
  } catch (error) {
    console.error('Error adding NPC to room:', error)
    return { success: false, error: 'Internal error' }
  }
}

/**
 * Remove NPC from room and clean up
 */
 export async function removeNPCFromRoom(
   roomId: string,
   npcPlayerId: string
 ): Promise<void> {
   try {
     await multiplayerOperations.leaveRoom(roomId, npcPlayerId)
     multiplayerNPCIntegration.clearRoomCache(roomId)
  } catch (error) {
     console.error('Error removing NPC from room:', error)
  }
} 