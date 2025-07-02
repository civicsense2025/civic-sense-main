"use client"

import { useState } from 'react'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web/components/ui/card'
import { Badge } from '@civicsense/ui-web/components/ui/badge'
import { Textarea } from '@civicsense/ui-web/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@civicsense/ui-web/components/ui/select'
import { enhancedNPCService, type NPCConversationContext, type NPCResponse } from '@civicsense/shared/lib/enhanced-npc-service'
import { NPC_PERSONALITIES } from '@civicsense/shared/lib/multiplayer-npcs'
import { Loader2, MessageSquare, Zap, Brain, Heart, Target } from 'lucide-react'

export default function TestNPCIntegrationPage() {
  const [selectedNPC, setSelectedNPC] = useState<string>('news_junkie')
  const [triggerType, setTriggerType] = useState<NPCConversationContext['triggerType']>('on_join')
  const [userMood, setUserMood] = useState<NPCConversationContext['userMood']>('neutral')
  const [isGenerating, setIsGenerating] = useState(false)
  const [responses, setResponses] = useState<Array<{
    npc: string
    trigger: string
    response: NPCResponse
    timestamp: string
  }>>([])
  const [conversationHistory, setConversationHistory] = useState<string>('')

  const handleGenerateResponse = async () => {
    if (!selectedNPC || !triggerType) return

    setIsGenerating(true)
    try {
      // Build conversation context
      const context: NPCConversationContext = {
        npcId: selectedNPC,
        triggerType,
        userMood,
        roomId: 'demo_room',
        playerId: 'demo_user',
        conversationHistory: conversationHistory ? [{
          speaker: 'user',
          message: conversationHistory,
          timestamp: new Date().toISOString()
        }] : undefined,
        quizContext: {
          topicId: 'constitutional_law',
          userPerformance: {
            correctAnswers: 3,
            totalAnswered: 5,
            averageTime: 15
          },
          roomPerformance: {
            averageScore: 68,
            playerCount: 4,
            userRank: 2
          }
        }
      }

      const response = await enhancedNPCService.generateNPCMessage(context)
      
      setResponses(prev => [{
        npc: selectedNPC,
        trigger: triggerType,
        response,
        timestamp: new Date().toISOString()
      }, ...prev])

    } catch (error) {
      console.error('Error generating NPC response:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedNPCData = NPC_PERSONALITIES.find(npc => npc.id === selectedNPC)

  const getTriggerDescription = (trigger: string) => {
    const descriptions = {
      'on_join': 'Player joins the room',
      'on_correct': 'Player answers correctly',
      'on_incorrect': 'Player answers incorrectly', 
      'on_game_start': 'Quiz is starting',
      'on_game_end': 'Quiz has ended',
      'on_question_start': 'New question appears',
      'on_help_request': 'Player asks for help',
      'on_encouragement_needed': 'Player seems frustrated'
    }
    return descriptions[trigger as keyof typeof descriptions] || trigger
  }

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'confident': return <Target className="h-4 w-4 text-green-500" />
      case 'struggling': return <Brain className="h-4 w-4 text-yellow-500" />
      case 'frustrated': return <Zap className="h-4 w-4 text-red-500" />
      case 'engaged': return <Heart className="h-4 w-4 text-blue-500" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'supportive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'encouraging': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'competitive': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'analytical': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'formal': return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">🤖 NPC Integration Demo</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Test the OpenAI-powered NPC personalities that follow CivicSense's core educational principles.
          Each NPC has unique knowledge, personality traits, and conversation styles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🎭 NPC Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NPC Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Choose NPC Personality</label>
                <Select value={selectedNPC} onValueChange={setSelectedNPC}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NPC_PERSONALITIES.map(npc => (
                      <SelectItem key={npc.id} value={npc.id}>
                        {npc.emoji} {npc.name} ({npc.skillLevel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedNPCData && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{selectedNPCData.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">{selectedNPCData.skillLevel}</Badge>
                      {selectedNPCData.traits.specialties.slice(0, 2).map(specialty => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Trigger Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Conversation Trigger</label>
                <Select value={triggerType} onValueChange={(value) => setTriggerType(value as NPCConversationContext['triggerType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_join">🚪 Player Joins</SelectItem>
                    <SelectItem value="on_correct">✅ Correct Answer</SelectItem>
                    <SelectItem value="on_incorrect">❌ Wrong Answer</SelectItem>
                    <SelectItem value="on_game_start">🎮 Game Starting</SelectItem>
                    <SelectItem value="on_game_end">🏁 Game Ending</SelectItem>
                    <SelectItem value="on_question_start">❓ New Question</SelectItem>
                    <SelectItem value="on_help_request">🆘 Help Request</SelectItem>
                    <SelectItem value="on_encouragement_needed">💪 Needs Encouragement</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getTriggerDescription(triggerType)}
                </p>
              </div>

              {/* User Mood */}
              <div>
                <label className="text-sm font-medium mb-2 block">User Mood Context</label>
                <Select value={userMood || 'neutral'} onValueChange={(value) => setUserMood(value as NPCConversationContext['userMood'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">😐 Neutral</SelectItem>
                    <SelectItem value="confident">😎 Confident</SelectItem>
                    <SelectItem value="struggling">😰 Struggling</SelectItem>
                    <SelectItem value="frustrated">😤 Frustrated</SelectItem>
                    <SelectItem value="engaged">🤔 Engaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conversation History */}
              <div>
                <label className="text-sm font-medium mb-2 block">Previous Conversation (Optional)</label>
                <Textarea
                  placeholder="Add context from previous messages..."
                  value={conversationHistory}
                  onChange={(e) => setConversationHistory(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleGenerateResponse} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Response...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Generate NPC Response
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Core Principles */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Core Principles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">📚 Civic Education Above Entertainment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">🤝 Authentic Uncertainty & Growth</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">🗳️ Inclusive Democratic Values</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">🔍 Information Literacy Champions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Display */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>💬 Generated Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {responses.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generate your first NPC response to see the magic! ✨</p>
                  </div>
                ) : (
                  responses.map((item, index) => {
                    const npcData = NPC_PERSONALITIES.find(npc => npc.id === item.npc)
                    return (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{npcData?.emoji}</span>
                            <span className="font-medium">{npcData?.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getTriggerDescription(item.trigger)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {getMoodIcon(userMood || 'neutral')}
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        {/* Message */}
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm leading-relaxed">{item.response.message}</p>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-xs">
                          <Badge className={getToneColor(item.response.tone)}>
                            {item.response.tone}
                          </Badge>
                          <Badge variant="outline">
                            {item.response.educationalValue} educational value
                          </Badge>
                          {item.response.personalityTraits.map(trait => (
                            <Badge key={trait} variant="secondary" className="text-xs">
                              {trait.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 