import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { X, Send, MessageCircle, Bot, Crown } from 'lucide-react'
import { cn } from '@civicsense/shared/lib/utils'
import type { MultiplayerPlayer } from '@civicsense/shared/lib/multiplayer'
interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  playerEmoji: string
  isNPC: boolean
  isHost: boolean
  message: string
  timestamp: string
  messageType: 'chat' | 'system' | 'npc_response'
}

interface ChatSidebarProps {
  roomId: string
  playerId: string
  players: MultiplayerPlayer[]
  isHost: boolean
  onClose: () => void
}

export function ChatSidebar({
  roomId,
  playerId,
  players,
  isHost,
  onClose
}: ChatSidebarProps) {
  // Using static strings for now - can be updated to use UI strings later
  const uiStrings = {
    multiplayer: {
      welcomeToQuiz: "Welcome to the quiz",
      roomChat: "Room Chat",
      players: "players",
      ai: "AI",
      host: "Host",
      typeMessage: "Type a message",
      enterToSend: "Press Enter to send",
      beRespectful: "Be respectful"
    }
  }
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mock messages for development
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        playerId: 'system',
        playerName: 'System',
        playerEmoji: '🏛️',
        isNPC: false,
        isHost: false,
        message: uiStrings.multiplayer.welcomeToQuiz + '! Good luck everyone!',
        timestamp: new Date().toISOString(),
        messageType: 'system'
      },
      {
        id: '2',
        playerId: 'npc_news_junkie',
        playerName: 'Sam the News Junkie',
        playerEmoji: '👩🏻‍💻',
        isNPC: true,
        isHost: false,
        message: 'Ready to see who\'s been keeping up with current events! 📱',
        timestamp: new Date().toISOString(),
        messageType: 'npc_response'
      }
    ]
    setMessages(mockMessages)
  }, [uiStrings.multiplayer.welcomeToQuiz])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return

    const currentPlayer = players.find(p => p.id === playerId)
    if (!currentPlayer) return

    setIsLoading(true)

    try {
      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        playerId: playerId,
        playerName: currentPlayer.player_name,
        playerEmoji: currentPlayer.player_emoji || '🎮',
        isNPC: false,
        isHost: currentPlayer.is_host ?? false,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        messageType: 'chat'
      }

      setMessages(prev => [...prev, message])
      setNewMessage('')

      // TODO: Send to Supabase chat table
      console.log('🎮 [ChatSidebar] Sending message:', message)

    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {uiStrings.multiplayer.roomChat}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {players.length} {uiStrings.multiplayer.players}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.messageType === 'system' && "justify-center"
              )}
            >
              {message.messageType !== 'system' && (
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">
                    {message.playerEmoji}
                  </div>
                  {message.isNPC && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                      <Bot className="h-2 w-2 text-white" />
                    </div>
                  )}
                  {message.isHost && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
              )}

              <div className={cn(
                "flex-1",
                message.messageType === 'system' && "text-center"
              )}>
                {message.messageType === 'system' ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 inline-block">
                    {message.message}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {message.playerName}
                      </span>
                      {message.isNPC && (
                        <Badge variant="secondary" className="text-xs">
                          {uiStrings.multiplayer.ai}
                        </Badge>
                      )}
                      {message.isHost && (
                        <Badge variant="outline" className="text-xs">
                          {uiStrings.multiplayer.host}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm text-slate-700 dark:text-slate-300",
                      message.messageType === 'npc_response' && "italic"
                    )}>
                      {message.message}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={uiStrings.multiplayer.typeMessage + '...'}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {uiStrings.multiplayer.enterToSend} • {uiStrings.multiplayer.beRespectful}
        </p>
      </div>
    </div>
  )
} 