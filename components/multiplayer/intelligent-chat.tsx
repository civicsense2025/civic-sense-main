"use client"

import { useState, useEffect, useCallback } from 'react'
import { ChatFeed, type ChatMessage, type ChatPlayer, createNPCReactionMessage } from './chat-feed'
import { conversationEngine, type ConversationContext } from '@/lib/multiplayer-conversation-engine'
import { enhancedNPCService } from '@/lib/enhanced-npc-service'
import { NPC_PERSONALITIES } from '@/lib/multiplayer-npcs'

interface IntelligentChatProps {
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
  currentPlayerId: string
  gameState: 'waiting' | 'in_progress' | 'between_questions' | 'completed'
  currentQuestion?: {
    id: string
    category: string
    difficulty: number
    text: string
  }
  onSendMessage: (message: string) => void
  className?: string
}

export function IntelligentChat({
  roomId,
  players,
  currentPlayerId,
  gameState,
  currentQuestion,
  onSendMessage,
  className
}: IntelligentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [lastHumanMessageTime, setLastHumanMessageTime] = useState(Date.now())
  const [isProcessingNPCResponse, setIsProcessingNPCResponse] = useState(false)

  // Convert players to chat players format
  const chatPlayers: ChatPlayer[] = players.map(p => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    isHost: p.isHost,
    isNPC: p.isNPC,
    isOnline: true // Assume all players are online for now
  }))

  // Handle incoming messages (this would be called from parent component)
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message])
    
    // Track human message timing for silence detection
    if (!message.isFromNPC) {
      setLastHumanMessageTime(Date.now())
    }
  }, [])

  // Analyze conversation and trigger NPC responses
  const analyzeAndRespond = useCallback(async () => {
    if (isProcessingNPCResponse) return
    
    const silentDuration = Math.floor((Date.now() - lastHumanMessageTime) / 1000)
    
    const context: ConversationContext = {
      roomId,
      players,
      recentMessages: messages.slice(-10), // Last 10 messages for context
      currentQuestion,
      gameState,
      silentDuration,
      conflictLevel: 'none' // TODO: Implement conflict detection
    }

    try {
      setIsProcessingNPCResponse(true)
      
      // Analyze conversation for triggers
      const triggers = await conversationEngine.analyzeConversation(context)
      
      if (triggers.length > 0) {
        // Execute the highest priority trigger
        const responses = await conversationEngine.executeConversationTriggers(context, triggers.slice(0, 1))
        
        // Add NPC responses to chat
        for (const { npcId, response } of responses) {
          const npc = NPC_PERSONALITIES.find(n => n.id === npcId)
          if (npc) {
            const npcMessage: ChatMessage = {
              id: `npc_${npcId}_${Date.now()}`,
              playerId: npcId,
              playerName: npc.name,
              playerEmoji: npc.emoji,
              text: response.message,
              timestamp: new Date().toISOString(),
              isFromNPC: true,
              messageType: 'npc_reaction',
              metadata: {
                tone: response.tone,
                educationalValue: response.educationalValue,
                triggerType: triggers[0].type
              }
            }
            
            setMessages(prev => [...prev, npcMessage])
            
            // Record the conversation in the NPC service
            await enhancedNPCService.recordConversation(
              npcId,
              roomId,
              currentPlayerId,
              response.message,
              {
                npcId,
                roomId,
                playerId: currentPlayerId,
                triggerType: 'on_help_request', // Simplified
                conversationHistory: context.recentMessages.map(m => ({
                  speaker: m.isFromNPC ? 'npc' : 'user',
                  message: m.text,
                  timestamp: m.timestamp
                }))
              }
            )
          }
        }
      }
    } catch (error) {
      console.error('Error in conversation analysis:', error)
    } finally {
      setIsProcessingNPCResponse(false)
    }
  }, [roomId, players, messages, currentQuestion, gameState, lastHumanMessageTime, currentPlayerId, isProcessingNPCResponse])

  // Trigger analysis when conditions change
  useEffect(() => {
    // Don't analyze too frequently
    const timeoutId = setTimeout(() => {
      if (players.some(p => p.isNPC)) {
        analyzeAndRespond()
      }
    }, 2000) // Wait 2 seconds after last change
    
    return () => clearTimeout(timeoutId)
  }, [messages.length, gameState, analyzeAndRespond])

  // Handle sending messages
  const handleSendMessage = (message: string) => {
    // Create message object
    const currentPlayer = players.find(p => p.id === currentPlayerId)
    if (!currentPlayer) return

    const chatMessage: ChatMessage = {
      id: `msg_${currentPlayerId}_${Date.now()}`,
      playerId: currentPlayerId,
      playerName: currentPlayer.name,
      playerEmoji: currentPlayer.emoji,
      text: message,
      timestamp: new Date().toISOString(),
      isFromHost: currentPlayer.isHost,
      messageType: 'chat'
    }

    // Add to local state
    addMessage(chatMessage)
    
    // Call parent handler
    onSendMessage(message)
  }

  // Add welcome messages when NPCs join
  useEffect(() => {
    const npcPlayers = players.filter(p => p.isNPC)
    const existingNPCMessages = messages.filter(m => m.isFromNPC)
    
    // Add welcome messages for new NPCs
    for (const npcPlayer of npcPlayers) {
      const hasWelcomed = existingNPCMessages.some(m => m.playerId === npcPlayer.id)
      if (!hasWelcomed && npcPlayer.npcId) {
        const npc = NPC_PERSONALITIES.find(n => n.id === npcPlayer.npcId)
        if (npc) {
          const welcomeMessages = npc.chatMessages.onJoin
          const welcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
          
          setTimeout(() => {
            const npcMessage: ChatMessage = {
              id: `welcome_${npcPlayer.id}_${Date.now()}`,
              playerId: npcPlayer.id,
              playerName: npc.name,
              playerEmoji: npc.emoji,
              text: welcomeMessage,
              timestamp: new Date().toISOString(),
              isFromNPC: true,
              messageType: 'npc_reaction',
              metadata: {
                tone: 'casual',
                educationalValue: 'low',
                triggerType: 'welcome'
              }
            }
            setMessages(prev => [...prev, npcMessage])
          }, Math.random() * 3000 + 1000) // Random delay 1-4 seconds
        }
      }
    }
  }, [players, messages])

  return (
    <ChatFeed
      messages={messages}
      players={chatPlayers}
      onSendMessage={handleSendMessage}
      currentPlayerId={currentPlayerId}
      disabled={gameState === 'in_progress'} // Disable during quiz
      className={className}
    />
  )
}

// Export helper for creating system messages
export { createSystemMessage, createNPCReactionMessage, createGameEventMessage } from './chat-feed' 