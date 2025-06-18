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
    console.log(`🤖 Adding NPC ${npcId} to room ${roomCode}`)
    
    // First, verify the room exists and is accessible
    const { data: roomData, error: roomError } = await supabase
      .from('multiplayer_rooms')
      .select('id, room_status, current_players, max_players')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (roomError) {
      console.error('Error fetching room:', roomError)
      return { success: false, error: 'Room not found' }
    }

    if (!roomData) {
      return { success: false, error: 'Room not found' }
    }

    // Check room status and capacity
    if (roomData.room_status !== 'waiting') {
      return { success: false, error: 'Room is not accepting new players' }
    }

    if (roomData.current_players >= roomData.max_players) {
      return { success: false, error: 'Room is full' }
    }

    // Get NPC data from database
    let allNPCs: any[] = []
    try {
      allNPCs = await enhancedNPCService.getAllNPCs()
      console.log(`🤖 Found ${allNPCs.length} NPCs in database:`, allNPCs.map(n => n.id))
    } catch (error) {
      console.error('Failed to load NPCs from database:', error)
      return { success: false, error: 'Failed to load NPCs from database. Please check the database connection.' }
    }

    const npc = allNPCs.find(n => n.id === npcId)
    
    if (!npc) {
      console.error(`NPC "${npcId}" not found in database. Available NPCs:`, allNPCs.map(n => ({ id: n.id, name: n.name })))
      return { success: false, error: `NPC "${npcId}" not found. Available NPCs: ${allNPCs.map(n => n.name).join(', ')}` }
    }

    console.log(`🤖 Found NPC: ${npc.name} (${npc.id})`)

    // Get the NPC personality UUID from the database
    const { data: npcPersonality, error: npcPersonalityError } = await supabase
      .from('npc_personalities')
      .select('id, npc_code, display_name, is_active')
      .eq('npc_code', npcId)
      .eq('is_active', true)
      .single()

    console.log(`🤖 Database lookup for npc_code "${npcId}":`, { npcPersonality, npcPersonalityError })

    if (npcPersonalityError) {
      console.error('Error fetching NPC personality:', npcPersonalityError)
      
      // If the NPC doesn't exist in the database, let's try to create a fallback approach
      if (npcPersonalityError.code === 'PGRST116') {
        // Try to find any active NPC as a fallback for testing
        const { data: fallbackNPC, error: fallbackError } = await supabase
          .from('npc_personalities')
          .select('id, npc_code, display_name')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (fallbackError || !fallbackNPC) {
          console.error('No active NPCs found in database at all:', fallbackError)
          return { success: false, error: 'No NPCs available in database. Please check the database setup.' }
        }

        console.log(`🤖 Using fallback NPC: ${fallbackNPC.display_name} (${fallbackNPC.npc_code})`)
        
        // Update the NPC data to use the fallback
        const fallbackNPCData = allNPCs.find(n => n.id === fallbackNPC.npc_code) || npc
        
        // Use the fallback NPC personality
        const finalNPCPersonality = { id: fallbackNPC.id }
        const finalNPC = fallbackNPCData

        // Get current join order for fallback
        const { data: playersData, error: playersError } = await supabase
          .from('multiplayer_room_players')
          .select('join_order')
          .eq('room_id', roomData.id)
          .order('join_order', { ascending: false })
          .limit(1)

        if (playersError) {
          console.error('Error getting join order:', playersError)
          return { success: false, error: 'Database error' }
        }

        const fallbackJoinOrder = (playersData?.[0]?.join_order || 0) + 1

        return await createNPCPlayer(roomData, finalNPC, finalNPCPersonality, fallbackJoinOrder)
      }
      
      return { success: false, error: 'NPC personality not found in database' }
    }

    if (!npcPersonality) {
      return { success: false, error: 'NPC personality not found in database' }
    }

    console.log(`🤖 Successfully found NPC personality: ${npcPersonality.display_name} (UUID: ${npcPersonality.id})`)

    // Check if NPC is already in the room
    const { data: existingNPC, error: checkError } = await supabase
      .from('multiplayer_room_players')
      .select('id')
      .eq('room_id', roomData.id)
      .eq('guest_token', `npc_${npcId}`)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found, which is what we want
      console.error('Error checking existing NPC:', checkError)
      return { success: false, error: 'Database error checking for existing NPC' }
    }

    if (existingNPC) {
      return { success: false, error: 'NPC already in room' }
    }

    // Get current join order
    const { data: playersData, error: playersError } = await supabase
      .from('multiplayer_room_players')
      .select('join_order')
      .eq('room_id', roomData.id)
      .order('join_order', { ascending: false })
      .limit(1)

    if (playersError) {
      console.error('Error getting join order:', playersError)
      return { success: false, error: 'Database error' }
    }

    const nextJoinOrder = (playersData?.[0]?.join_order || 0) + 1

    return await createNPCPlayer(roomData, npc, npcPersonality, nextJoinOrder)
  } catch (error) {
    console.error('Error adding NPC to room:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }
  }
}

/**
 * Helper function to create the NPC player and related records
 */
async function createNPCPlayer(
  roomData: any, 
  npc: any, 
  npcPersonality: any, 
  nextJoinOrder: number
): Promise<{ success: boolean; playerId?: string; error?: string }> {
  try {
    // Add NPC as a player first (this should work with the RLS policy)
    const { data: newPlayerData, error: playerError } = await supabase
      .from('multiplayer_room_players')
      .insert({
        room_id: roomData.id,
        guest_token: `npc_${npc.id}`,
        player_name: npc.name,
        player_emoji: npc.emoji,
        join_order: nextJoinOrder,
        is_host: false,
        is_ready: true, // NPCs are always ready
        is_connected: true
      })
      .select('id')
      .single()

    if (playerError) {
      console.error('Error creating NPC player:', playerError)
      return { success: false, error: `Failed to create NPC player: ${playerError.message}` }
    }

    if (!newPlayerData) {
      return { success: false, error: 'Failed to create NPC player' }
    }

    // Now try to create the NPC-specific record
    const { data: npcPlayerData, error: npcError } = await supabase
      .from('multiplayer_npc_players')
      .insert({
        room_id: roomData.id,
        npc_id: npcPersonality.id, // Use the UUID from the database
        player_id: newPlayerData.id
      })
      .select('id')
      .single()

    if (npcError) {
      console.error('Error creating NPC record:', npcError)
      
      // Clean up the player record if NPC record creation fails
      await supabase
        .from('multiplayer_room_players')
        .delete()
        .eq('id', newPlayerData.id)
      
      return { success: false, error: `Failed to create NPC record: ${npcError.message}` }
    }

    // Update room player count
    const { error: updateError } = await supabase
      .from('multiplayer_rooms')
      .update({ current_players: roomData.current_players + 1 })
      .eq('id', roomData.id)

    if (updateError) {
      console.error('Error updating room player count:', updateError)
      // Don't fail the operation for this, just log it
    }

    // Send welcome message
    try {
      const welcomeMessages = npc.chatMessages.onJoin
      const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
      
      await supabase
        .from('multiplayer_chat_messages')
        .insert({
          room_id: roomData.id,
          npc_id: npcPersonality.id, // Use the UUID from the database
          message_content: message,
          message_type: 'chat',
          educational_value: 'low'
        })
    } catch (messageError) {
      console.warn('Could not send NPC welcome message:', messageError)
      // Don't fail the whole operation for a message error
    }

    console.log(`🤖 Successfully added NPC ${npc.name} to room`)
    return { success: true, playerId: newPlayerData.id }
  } catch (error) {
    console.error('Error creating NPC player:', error)
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