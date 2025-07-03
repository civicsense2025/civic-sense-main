"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  Crown, 
  Smile,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '../../utils'
import { formatDistanceToNow } from 'date-fns'

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  playerEmoji: string
  text: string
  timestamp: string
  isFromNPC?: boolean
  isFromHost?: boolean
  messageType?: 'chat' | 'system' | 'npc_reaction' | 'game_event'
  metadata?: {
    tone?: string
    educationalValue?: string
    triggerType?: string
  }
}

export interface ChatPlayer {
  id: string
  name: string
  emoji: string
  isHost?: boolean
  isNPC?: boolean
  isOnline?: boolean
}

interface ChatFeedProps {
  messages: ChatMessage[]
  players: ChatPlayer[]
  onSendMessage: (message: string) => void
  currentPlayerId: string
  disabled?: boolean
  className?: string
}

export function ChatFeed({ 
  messages, 
  players, 
  onSendMessage, 
  currentPlayerId, 
  disabled = false,
  className 
}: ChatFeedProps) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    const trimmedMessage = inputValue.trim()
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage)
      setInputValue('')
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getPlayerById = (playerId: string) => {
    return players.find(p => p.id === playerId)
  }

  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'just now'
    }
  }

  const getMessageTypeIcon = (message: ChatMessage) => {
    if (message.isFromNPC) {
      return <Bot className="h-3 w-3 text-blue-500" />
    }
    if (message.isFromHost) {
      return <Crown className="h-3 w-3 text-yellow-500" />
    }
    return null
  }

  const getMessageTypeClass = (message: ChatMessage) => {
    if (message.messageType === 'system') {
      return 'chat-message system'
    }
    if (message.isFromNPC) {
      return 'chat-message npc'
    }
    if (message.playerId === currentPlayerId) {
      return 'chat-message own'
    }
    return 'chat-message'
  }

  return (
    <Card className={cn("multiplayer-card flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base multiplayer-text">
          <MessageSquare className="h-4 w-4" />
          Chat
          <Badge variant="secondary" className="text-xs multiplayer-accent-light">
            {players.filter(p => p.isOnline).length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3 max-h-96">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Say hello to get started!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const player = getPlayerById(message.playerId)
                const isOwnMessage = message.playerId === currentPlayerId
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "p-3 rounded-lg transition-all",
                      getMessageTypeClass(message)
                    )}
                  >
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{message.playerEmoji}</span>
                      <span className="font-medium text-sm truncate">
                        {message.playerName}
                        {isOwnMessage && (
                          <span className="text-xs text-muted-foreground ml-1">(You)</span>
                        )}
                      </span>
                      {getMessageTypeIcon(message)}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    
                    {/* Message Content */}
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    
                    {/* NPC Message Metadata */}
                    {message.isFromNPC && message.metadata && (
                      <div className="mt-2 flex gap-1">
                        {message.metadata.tone && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.tone}
                          </Badge>
                        )}
                        {message.metadata.educationalValue === 'high' && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            📚 Educational
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t p-4">
          {disabled ? (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">
                Chat is disabled during the quiz
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
                maxLength={200}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || disabled}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="mt-2 text-xs text-muted-foreground">
              Someone is typing...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// System message helpers
export const createSystemMessage = (text: string): Omit<ChatMessage, 'id'> => ({
  playerId: 'system',
  playerName: 'System',
  playerEmoji: '⚙️',
  text,
  timestamp: new Date().toISOString(),
  messageType: 'system'
})

export const createNPCReactionMessage = (
  npcId: string,
  npcName: string,
  npcEmoji: string,
  text: string,
  metadata?: ChatMessage['metadata']
): Omit<ChatMessage, 'id'> => ({
  playerId: npcId,
  playerName: npcName,
  playerEmoji: npcEmoji,
  text,
  timestamp: new Date().toISOString(),
  isFromNPC: true,
  messageType: 'npc_reaction',
  metadata
})

export const createGameEventMessage = (text: string): Omit<ChatMessage, 'id'> => ({
  playerId: 'game',
  playerName: 'Game',
  playerEmoji: '🎮',
  text,
  timestamp: new Date().toISOString(),
  messageType: 'game_event'
}) 