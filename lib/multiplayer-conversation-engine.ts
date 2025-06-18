"use client"

import { enhancedNPCService, type NPCConversationContext, type NPCResponse } from './enhanced-npc-service'
import { NPC_PERSONALITIES, type NPCPersonality } from './multiplayer-npcs'
import { multiplayerNPCIntegration } from './multiplayer-npc-integration'
import type { ChatMessage } from '@/components/multiplayer/chat-feed'

// =============================================================================
// CONVERSATION INTELLIGENCE SYSTEM
// =============================================================================

export interface ConversationContext {
  roomId: string
  players: Array<{
    id: string
    name: string
    emoji: string
    isNPC: boolean
    npcId?: string
    isHost: boolean
    performance?: {
      correctAnswers: number
      totalAnswered: number
      averageTime: number
    }
  }>
  recentMessages: ChatMessage[]
  currentQuestion?: {
    id: string
    category: string
    difficulty: number
    text: string
  }
  gameState: 'waiting' | 'in_progress' | 'between_questions' | 'completed'
  silentDuration: number // seconds since last human message
  conflictLevel: 'none' | 'mild' | 'moderate' | 'severe'
}

export interface ConversationTrigger {
  type: 'silence_break' | 'conflict_resolution' | 'encouragement' | 'educational_moment' | 'npc_interaction' | 'celebration'
  priority: number // 1-10, higher is more urgent
  targetUserId?: string
  context: string
  suggestedNPCs?: string[] // Which NPCs should respond
}

export class ConversationEngine {
  private lastNPCMessage: Map<string, number> = new Map() // npcId -> timestamp
  private conversationFlow: Map<string, string[]> = new Map() // roomId -> recent speaker order
  private conflictDetection: Map<string, ConflictTracker> = new Map()

  /**
   * Main conversation analysis - determines if and how NPCs should engage
   */
  async analyzeConversation(context: ConversationContext): Promise<ConversationTrigger[]> {
    const triggers: ConversationTrigger[] = []

    // 1. Detect silence and encourage participation
    if (context.silentDuration > 30 && context.gameState === 'waiting') {
      triggers.push({
        type: 'silence_break',
        priority: 6,
        context: 'Room has been quiet, NPCs should break the ice',
        suggestedNPCs: this.selectEngagingNPCs(context.players)
      })
    }

    // 2. Detect and resolve conflicts
    const conflictTrigger = this.detectConflict(context)
    if (conflictTrigger) {
      triggers.push(conflictTrigger)
    }

    // 3. Educational opportunities
    const educationalTrigger = this.detectEducationalMoment(context)
    if (educationalTrigger) {
      triggers.push(educationalTrigger)
    }

    // 4. NPC-to-NPC interactions
    const npcInteractionTrigger = this.detectNPCInteractionOpportunity(context)
    if (npcInteractionTrigger) {
      triggers.push(npcInteractionTrigger)
    }

    // 5. Encouragement for struggling players
    const encouragementTrigger = this.detectEncouragementNeeds(context)
    if (encouragementTrigger) {
      triggers.push(encouragementTrigger)
    }

    // Sort by priority
    return triggers.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Execute conversation triggers with multiple NPCs
   */
  async executeConversationTriggers(
    context: ConversationContext,
    triggers: ConversationTrigger[]
  ): Promise<Array<{ npcId: string; response: NPCResponse }>> {
    const responses: Array<{ npcId: string; response: NPCResponse }> = []

    for (const trigger of triggers.slice(0, 2)) { // Max 2 concurrent responses
      const npcIds = trigger.suggestedNPCs || this.selectAppropriateNPCs(context, trigger)
      
      for (const npcId of npcIds.slice(0, trigger.type === 'conflict_resolution' ? 1 : 2)) {
        // Avoid NPCs responding too frequently
        if (this.shouldNPCRespond(npcId, trigger.type)) {
          const response = await this.generateContextualResponse(context, trigger, npcId)
          if (response) {
            responses.push({ npcId, response })
            this.lastNPCMessage.set(npcId, Date.now())
          }
        }
      }
    }

    return responses
  }

  // =============================================================================
  // CONFLICT DETECTION & RESOLUTION
  // =============================================================================

  private detectConflict(context: ConversationContext): ConversationTrigger | null {
    const recentMessages = context.recentMessages.slice(-5)
    const conflictKeywords = [
      'wrong', 'stupid', 'dumb', 'idiot', 'hate', 'shut up', 
      'you\'re an', 'that\'s ridiculous', 'obviously', 'clearly you'
    ]
    
    const personalAttacks = [
      'you always', 'you never', 'typical', 'people like you'
    ]

    let conflictScore = 0
    let hasPersonalAttack = false
    
    for (const message of recentMessages) {
      if (!message.isFromNPC) {
        const text = message.text.toLowerCase()
        
        // Check for conflict keywords
        for (const keyword of conflictKeywords) {
          if (text.includes(keyword)) {
            conflictScore += 2
          }
        }
        
        // Check for personal attacks (more severe)
        for (const attack of personalAttacks) {
          if (text.includes(attack)) {
            conflictScore += 5
            hasPersonalAttack = true
          }
        }
        
        // Check for ALL CAPS (shouting)
        if (text === text.toUpperCase() && text.length > 10) {
          conflictScore += 3
        }
      }
    }

    if (conflictScore >= 5 || hasPersonalAttack) {
      return {
        type: 'conflict_resolution',
        priority: 10, // Highest priority
        context: hasPersonalAttack ? 
          'Personal attacks detected - immediate de-escalation needed' :
          'Conflict detected - NPCs should model respectful discourse',
        suggestedNPCs: this.selectDiplomaticNPCs(context.players)
      }
    }

    return null
  }

  private selectDiplomaticNPCs(players: ConversationContext['players']): string[] {
    const diplomaticNPCs = ['retired_teacher', 'local_activist', 'civic_scholar']
    const availableNPCs = players
      .filter(p => p.isNPC && diplomaticNPCs.includes(p.npcId!))
      .map(p => p.npcId!)
    
    return availableNPCs.length > 0 ? [availableNPCs[0]] : []
  }

  // =============================================================================
  // EDUCATIONAL MOMENT DETECTION
  // =============================================================================

  private detectEducationalMoment(context: ConversationContext): ConversationTrigger | null {
    const recentMessages = context.recentMessages.slice(-3)
    
    // Look for questions or misconceptions
    const questionIndicators = ['how does', 'what is', 'why do', 'i don\'t understand', 'confused']
    const misconceptionIndicators = ['i thought', 'isn\'t it true that', 'but i heard']
    
    for (const message of recentMessages) {
      if (!message.isFromNPC) {
        const text = message.text.toLowerCase()
        
        for (const indicator of questionIndicators) {
          if (text.includes(indicator)) {
            return {
              type: 'educational_moment',
              priority: 7,
              targetUserId: message.playerId,
              context: 'User asked a question - educational opportunity',
              suggestedNPCs: this.selectEducationalNPCs(context.players, text)
            }
          }
        }
        
        for (const indicator of misconceptionIndicators) {
          if (text.includes(indicator)) {
            return {
              type: 'educational_moment',
              priority: 8,
              targetUserId: message.playerId,
              context: 'Potential misconception detected - gentle correction needed',
              suggestedNPCs: this.selectEducationalNPCs(context.players, text)
            }
          }
        }
      }
    }
    
    return null
  }

  private selectEducationalNPCs(players: ConversationContext['players'], messageText: string): string[] {
    // Match NPC expertise to topic
    const topicMap: Record<string, string[]> = {
      'constitution': ['civic_scholar', 'judge_thompson', 'retired_teacher'],
      'voting': ['local_activist', 'young_voter', 'news_junkie'],
      'government': ['civic_scholar', 'retired_teacher', 'policy_analyst'],
      'news': ['news_junkie', 'campaign_veteran'],
      'local': ['local_activist', 'retired_teacher']
    }
    
    for (const [topic, npcIds] of Object.entries(topicMap)) {
      if (messageText.includes(topic)) {
        const availableNPCs = players
          .filter(p => p.isNPC && npcIds.includes(p.npcId!))
          .map(p => p.npcId!)
        
        if (availableNPCs.length > 0) {
          return [availableNPCs[0]]
        }
      }
    }
    
    // Default to most knowledgeable NPCs
    const knowledgeableNPCs = ['civic_scholar', 'retired_teacher', 'judge_thompson']
    return players
      .filter(p => p.isNPC && knowledgeableNPCs.includes(p.npcId!))
      .map(p => p.npcId!)
      .slice(0, 1)
  }

  // =============================================================================
  // NPC-TO-NPC INTERACTIONS
  // =============================================================================

  private detectNPCInteractionOpportunity(context: ConversationContext): ConversationTrigger | null {
    const npcPlayers = context.players.filter(p => p.isNPC)
    if (npcPlayers.length < 2) return null

    const lastNPCMessage = context.recentMessages
      .reverse()
      .find(m => m.isFromNPC)

    if (lastNPCMessage && this.shouldNPCsInteract(context, lastNPCMessage)) {
      return {
        type: 'npc_interaction',
        priority: 4,
        context: 'NPCs should build on each other\'s comments',
        suggestedNPCs: this.selectComplementaryNPCs(lastNPCMessage.playerId, npcPlayers)
      }
    }

    return null
  }

  private shouldNPCsInteract(context: ConversationContext, lastNPCMessage: ChatMessage): boolean {
    // Don't let NPCs dominate conversation
    const recentNPCMessages = context.recentMessages
      .slice(-3)
      .filter(m => m.isFromNPC)
    
    return recentNPCMessages.length < 2
  }

  private selectComplementaryNPCs(lastNPCId: string, npcPlayers: ConversationContext['players']): string[] {
    // Personality complementarity matrix
    const complementarity: Record<string, string[]> = {
      'news_junkie': ['civic_scholar', 'retired_teacher'], // Sam pairs well with academics
      'civic_scholar': ['local_activist', 'news_junkie'], // Dr. Martinez with practitioners
      'curious_newcomer': ['retired_teacher', 'local_activist'], // Riley needs mentors
      'retired_teacher': ['curious_newcomer', 'young_voter'], // Ms. Chen mentors newcomers
      'local_activist': ['civic_scholar', 'campaign_veteran'], // Jordan with strategists
      'judge_thompson': ['civic_scholar', 'policy_analyst'] // Judge with other experts
    }

    const complementaryIds = complementarity[lastNPCId] || []
    return npcPlayers
      .filter(p => p.npcId !== lastNPCId && complementaryIds.includes(p.npcId!))
      .map(p => p.npcId!)
      .slice(0, 1)
  }

  // =============================================================================
  // SILENCE BREAKING & ENCOURAGEMENT
  // =============================================================================

  private selectEngagingNPCs(players: ConversationContext['players']): string[] {
    const chattierNPCs = ['news_junkie', 'young_voter', 'local_activist', 'curious_newcomer']
    return players
      .filter(p => p.isNPC && chattierNPCs.includes(p.npcId!))
      .map(p => p.npcId!)
      .slice(0, 1)
  }

  private detectEncouragementNeeds(context: ConversationContext): ConversationTrigger | null {
    // Look for players who might need encouragement
    const strugglingPlayers = context.players.filter(p => 
      !p.isNPC && 
      p.performance && 
      p.performance.correctAnswers / Math.max(p.performance.totalAnswered, 1) < 0.4
    )

    if (strugglingPlayers.length > 0) {
      return {
        type: 'encouragement',
        priority: 6,
        targetUserId: strugglingPlayers[0].id,
        context: 'Player may need encouragement',
        suggestedNPCs: this.selectSupportiveNPCs(context.players)
      }
    }

    return null
  }

  private selectSupportiveNPCs(players: ConversationContext['players']): string[] {
    const supportiveNPCs = ['retired_teacher', 'local_activist', 'curious_newcomer']
    return players
      .filter(p => p.isNPC && supportiveNPCs.includes(p.npcId!))
      .map(p => p.npcId!)
      .slice(0, 1)
  }

  // =============================================================================
  // RESPONSE GENERATION
  // =============================================================================

  private async generateContextualResponse(
    context: ConversationContext,
    trigger: ConversationTrigger,
    npcId: string
  ): Promise<NPCResponse | null> {
    const npc = NPC_PERSONALITIES.find(n => n.id === npcId)
    if (!npc) return null

    // Build specialized conversation context based on trigger
    const conversationContext: NPCConversationContext = {
      npcId,
      roomId: context.roomId,
      playerId: trigger.targetUserId,
      triggerType: this.mapTriggerToNPCTrigger(trigger.type),
      userMood: this.analyzeUserMood(context, trigger.targetUserId),
      conversationHistory: this.buildConversationHistory(context),
      quizContext: {
        topicId: context.currentQuestion?.category || 'general',
        currentQuestion: context.currentQuestion,
        userPerformance: trigger.targetUserId ? 
          context.players.find(p => p.id === trigger.targetUserId)?.performance :
          undefined,
        roomPerformance: this.calculateRoomPerformance(context)
      }
    }

    // Add trigger-specific context
    if (trigger.type === 'conflict_resolution') {
      conversationContext.specialInstructions = CONFLICT_RESOLUTION_PROMPTS[npcId] || DEFAULT_CONFLICT_RESOLUTION
    } else if (trigger.type === 'educational_moment') {
      conversationContext.specialInstructions = EDUCATIONAL_PROMPTS[npcId] || DEFAULT_EDUCATIONAL_PROMPT
    }

    return await enhancedNPCService.generateNPCMessage(conversationContext)
  }

  private mapTriggerToNPCTrigger(triggerType: ConversationTrigger['type']): NPCConversationContext['triggerType'] {
    const mapping: Record<ConversationTrigger['type'], NPCConversationContext['triggerType']> = {
      'silence_break': 'on_encouragement_needed',
      'conflict_resolution': 'on_help_request',
      'encouragement': 'on_encouragement_needed',
      'educational_moment': 'on_help_request',
      'npc_interaction': 'on_correct',
      'celebration': 'on_correct'
    }
    return mapping[triggerType] || 'on_help_request'
  }

  private shouldNPCRespond(npcId: string, triggerType: ConversationTrigger['type']): boolean {
    const lastMessage = this.lastNPCMessage.get(npcId) || 0
    const timeSinceLastMessage = Date.now() - lastMessage

    // Conflict resolution can interrupt more frequently
    if (triggerType === 'conflict_resolution') {
      return timeSinceLastMessage > 5000 // 5 seconds
    }

    // Other triggers need more spacing
    return timeSinceLastMessage > 15000 // 15 seconds
  }

  private selectAppropriateNPCs(context: ConversationContext, trigger: ConversationTrigger): string[] {
    // Default selection logic
    return context.players
      .filter(p => p.isNPC)
      .map(p => p.npcId!)
      .slice(0, 1)
  }

  // Helper methods
  private buildConversationHistory(context: ConversationContext) {
    return context.recentMessages.slice(-5).map(msg => ({
      speaker: msg.isFromNPC ? 'npc' : 'user',
      message: msg.text,
      timestamp: msg.timestamp,
      context: msg.messageType
    }))
  }

  private analyzeUserMood(context: ConversationContext, userId?: string): NPCConversationContext['userMood'] {
    if (!userId) return 'neutral'
    
    const player = context.players.find(p => p.id === userId)
    if (!player?.performance) return 'neutral'
    
    const accuracy = player.performance.correctAnswers / Math.max(player.performance.totalAnswered, 1)
    
    if (accuracy < 0.3) return 'frustrated'
    if (accuracy < 0.5) return 'struggling'
    if (accuracy > 0.8) return 'confident'
    return 'neutral'
  }

  private calculateRoomPerformance(context: ConversationContext) {
    const humanPlayers = context.players.filter(p => !p.isNPC && p.performance)
    if (humanPlayers.length === 0) return { averageScore: 0, playerCount: 0, userRank: 1 }
    
    const totalScore = humanPlayers.reduce((sum, p) => {
      const accuracy = p.performance!.correctAnswers / Math.max(p.performance!.totalAnswered, 1)
      return sum + (accuracy * 100)
    }, 0)
    
    return {
      averageScore: totalScore / humanPlayers.length,
      playerCount: humanPlayers.length,
      userRank: 1 // Simplified
    }
  }
}

// =============================================================================
// SPECIALIZED PROMPTS FOR DIFFERENT SITUATIONS
// =============================================================================

const CONFLICT_RESOLUTION_PROMPTS: Record<string, string> = {
  'retired_teacher': `You're Ms. Chen, a retired civics teacher. Someone in the room is being disrespectful or argumentative. Use your classroom management skills to redirect the conversation toward learning and mutual respect. Reference how democracy requires listening to different viewpoints.`,
  
  'local_activist': `You're Jordan, a community organizer. There's tension in the room. Draw on your experience building coalitions with people who disagree. Emphasize finding common ground and working together for positive change.`,
  
  'civic_scholar': `You're Dr. Martinez. There's conflict happening. Use your academic perspective to reframe the disagreement as an opportunity to examine different viewpoints critically and respectfully, as scholars do.`
}

const DEFAULT_CONFLICT_RESOLUTION = `There seems to be some tension here. In democracy, we need to be able to discuss difficult topics respectfully. Let's focus on understanding each other's perspectives rather than winning arguments.`

const EDUCATIONAL_PROMPTS: Record<string, string> = {
  'civic_scholar': `Someone has asked a question or expressed a misconception. This is a perfect teaching moment. Provide accurate information while encouraging critical thinking. Reference credible sources when possible.`,
  
  'retired_teacher': `A student needs help understanding something. Use your teaching experience to break down complex concepts into understandable parts. Be patient and encouraging.`,
  
  'news_junkie': `Someone needs clarification about current events or recent political developments. Share your knowledge while encouraging media literacy and fact-checking.`
}

const DEFAULT_EDUCATIONAL_PROMPT = `This is a great learning opportunity. Share accurate information while encouraging the person to think critically about the topic.`

// =============================================================================
// CONVERSATION TRACKER
// =============================================================================

interface ConflictTracker {
  level: number
  lastIncident: number
  participants: string[]
}

// Singleton instance
export const conversationEngine = new ConversationEngine() 