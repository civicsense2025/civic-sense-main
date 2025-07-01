"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { MessageCircle, User, Bot, Mic, MicOff } from 'lucide-react'

interface NPCDemoProps {
  characterName?: string
  role?: string
}

export function NPCDemo({ 
  characterName = "Senator Johnson",
  role = "U.S. Senator" 
}: NPCDemoProps) {
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState<Array<{
    speaker: 'user' | 'npc'
    message: string
    timestamp: Date
  }>>([])

  const sampleMessages = [
    "Hello! I'm here to answer questions about the legislative process.",
    "What would you like to know about how bills become laws?",
    "I can explain committee procedures, voting processes, and more.",
  ]

  const handleStartConversation = () => {
    const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)]
    setConversation([
      {
        speaker: 'npc',
        message: randomMessage,
        timestamp: new Date()
      }
    ])
  }

  const handleUserMessage = (message: string) => {
    setConversation(prev => [
      ...prev,
      {
        speaker: 'user',
        message,
        timestamp: new Date()
      },
      {
        speaker: 'npc',
        message: "That's an excellent question! In a real implementation, I would provide detailed, evidence-based information about that topic.",
        timestamp: new Date()
      }
    ])
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            NPC Character Demo
          </CardTitle>
          <p className="text-muted-foreground">
            Interactive civic education with AI-powered characters
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Character Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-bold">{characterName}</div>
                <div className="text-sm text-muted-foreground font-normal">{role}</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="secondary" className="w-fit">
              <Bot className="w-4 h-4 mr-1" />
              AI-Powered
            </Badge>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Expertise Areas:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Legislative Process</Badge>
                <Badge variant="outline">Committee Procedures</Badge>
                <Badge variant="outline">Voting Systems</Badge>
                <Badge variant="outline">Constitutional Law</Badge>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleStartConversation} 
                className="w-full"
                disabled={conversation.length > 0}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Conversation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-lg">
              {conversation.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start a conversation to begin learning!</p>
                </div>
              ) : (
                conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.speaker === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {conversation.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserMessage("How does a bill become a law?")}
                  >
                    Ask about bills
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserMessage("What is the role of committees?")}
                  >
                    Ask about committees
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isListening ? "destructive" : "secondary"}
                    size="sm"
                    onClick={() => setIsListening(!isListening)}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isListening ? 'Stop' : 'Voice Input'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {isListening ? 'Listening...' : 'Click to use voice input'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Demo Features</h3>
            <p className="text-sm text-muted-foreground">
              This demo showcases AI-powered civic education characters that can engage in 
              natural conversations about government processes, providing personalized learning experiences.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 