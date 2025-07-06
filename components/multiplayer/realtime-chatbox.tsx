"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, Lightbulb, ThumbsUp, Heart, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { NPCPersonality } from "@/lib/multiplayer-npcs"

interface ChatMessage {
  id: string
  sender: 'player' | 'npc' | 'system'
  message: string
  timestamp: Date
  emoji?: string
  messageType?: 'chat' | 'hint' | 'encouragement' | 'celebration'
}

interface RealtimeChatboxProps {
  opponent: NPCPersonality
  isVisible: boolean
  onToggle: () => void
  gamePhase: 'npc_selection' | 'waiting' | 'countdown' | 'question' | 'completed'
  className?: string
}

export function RealtimeChatbox({
  opponent,
  isVisible,
  onToggle,
  gamePhase,
  className
}: RealtimeChatboxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add welcome message when component mounts
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      sender: 'npc',
      message: opponent.chatMessages.onGameStart[0] || `Hi! I'm ${opponent.name}. Ready to test your civic knowledge?`,
      timestamp: new Date(),
      emoji: opponent.emoji,
      messageType: 'chat'
    }
    setMessages([welcomeMessage])
  }, [opponent])

  // Add contextual messages based on game phase
  useEffect(() => {
    let timeoutId: number

    switch (gamePhase) {
      case 'countdown':
        timeoutId = window.setTimeout(() => {
          addNPCMessage("Here we go! Let's see what you know! 🚀", 'encouragement')
        }, 1000)
        break
      case 'question':
        timeoutId = window.setTimeout(() => {
          const hints = [
            "Think about the key principles here... 🤔",
            "Consider the context of democratic processes 🗳️",
            "Remember what we've learned about civic responsibility 📚",
            "Don't rush - take your time to think it through! ⏰"
          ]
          const randomHint = hints[Math.floor(Math.random() * hints.length)]
          addNPCMessage(randomHint, 'hint')
        }, 10000) // Show hint after 10 seconds
        break
      case 'completed':
        timeoutId = window.setTimeout(() => {
          addNPCMessage("Great game! What did you think was the most interesting question? 🎯", 'chat')
        }, 2000)
        break
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [gamePhase])

  const addNPCMessage = (message: string, type: ChatMessage['messageType'] = 'chat') => {
    const npcMessage: ChatMessage = {
      id: 'npc-' + Date.now(),
      sender: 'npc',
      message,
      timestamp: new Date(),
      emoji: opponent.emoji,
      messageType: type
    }
    setMessages(prev => [...prev, npcMessage])
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const playerMessage: ChatMessage = {
      id: 'player-' + Date.now(),
      sender: 'player',
      message: newMessage,
      timestamp: new Date(),
      messageType: 'chat'
    }

    setMessages(prev => [...prev, playerMessage])
    setNewMessage("")

    // Simulate NPC typing and response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      
      // Generate contextual NPC response
      const responses = [
        "That's an interesting perspective! 🤔",
        "I hadn't thought of it that way before! 💭",
        "Good point! This is why I love learning with others 📚",
        "You're really making me think here! 🧠",
        "That's exactly the kind of critical thinking we need! ⭐"
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      addNPCMessage(randomResponse, 'chat')
    }, 1500 + Math.random() * 1000) // Random delay between 1.5-2.5 seconds
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMessageIcon = (type: ChatMessage['messageType']) => {
    switch (type) {
      case 'hint':
        return <Lightbulb className="h-3 w-3 text-yellow-500" />
      case 'encouragement':
        return <ThumbsUp className="h-3 w-3 text-green-500" />
      case 'celebration':
        return <Star className="h-3 w-3 text-purple-500" />
      default:
        return null
    }
  }

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className={cn("fixed bottom-4 right-4 z-40 shadow-lg", className)}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat with {opponent.name}
      </Button>
    )
  }

  return (
    <Card className={cn("fixed bottom-4 right-4 w-80 h-96 z-40 shadow-xl", className)}>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-xl">{opponent.emoji}</span>
          <div>
            <h4 className="font-medium text-sm">{opponent.name}</h4>
            <Badge variant="secondary" className="text-xs">
              {opponent.skillLevel}
            </Badge>
          </div>
        </div>
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          ×
        </Button>
      </div>

      <CardContent className="p-0 flex flex-col h-[calc(100%-60px)]">
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2 text-sm",
                  message.sender === 'player' ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === 'npc' && (
                  <div className="flex flex-col items-center">
                    <span className="text-lg">{message.emoji}</span>
                    {getMessageIcon(message.messageType)}
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2",
                    message.sender === 'player'
                      ? "bg-blue-600 text-white"
                      : message.messageType === 'hint'
                        ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                        : message.messageType === 'encouragement'
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : "bg-slate-100 text-slate-900"
                  )}
                >
                  <p>{message.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-2 text-sm">
                <span className="text-lg">{opponent.emoji}</span>
                <div className="bg-slate-100 rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Input
              ref={chatInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Chat with ${opponent.name}...`}
              className="flex-1 text-sm"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              disabled={!newMessage.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Share thoughts, ask questions, or discuss the quiz!
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 