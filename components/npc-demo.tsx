"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { enhancedNPCService, type NPCConversationContext, type NPCResponse } from '@/lib/enhanced-npc-service'
import { NPC_PERSONALITIES, type NPCPersonality } from '@/lib/multiplayer-npcs'
import { Bot, Brain, Clock, Target, MessageCircle, Play, BarChart3, Zap } from 'lucide-react'

// Sample quiz question for demo
const SAMPLE_QUESTION = {
  topic_id: "demo",
  question_number: 1,
  question: "Which branch of government is responsible for interpreting laws?",
  question_type: "multiple_choice" as const,
  correct_answer: "Judicial",
  option_a: "Executive",
  option_b: "Legislative", 
  option_c: "Judicial",
  option_d: "Administrative",
  category: "government_structure",
  difficulty: 2,
  hint: "Think about the Supreme Court's role",
  explanation: "The judicial branch, headed by the Supreme Court, interprets laws and ensures they comply with the Constitution."
}

export function NPCDemo() {
  const [npcs, setNPCs] = useState<NPCPersonality[]>([])
  const [selectedNPC, setSelectedNPC] = useState<NPCPersonality | null>(null)
  const [npcResponse, setNPCResponse] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatResponse, setChatResponse] = useState<NPCResponse | null>(null)
  const [analytics, setAnalytics] = useState<any[]>([])
  const [selectedTrigger, setSelectedTrigger] = useState<NPCConversationContext['triggerType']>('on_correct')

  // Load NPCs on component mount
  useEffect(() => {
    const loadNPCs = async () => {
      try {
        const allNPCs = await enhancedNPCService.getAllNPCs()
        setNPCs(allNPCs)
        if (allNPCs.length > 0) {
          setSelectedNPC(allNPCs[0])
        }
      } catch (error) {
        console.error('Error loading NPCs:', error)
      }
    }

    loadNPCs()
  }, [])

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analyticsData = await enhancedNPCService.getNPCVsHumanAnalytics()
        setAnalytics(analyticsData)
      } catch (error) {
        console.error('Error loading analytics:', error)
      }
    }

    loadAnalytics()
  }, [])

  const handleGenerateResponse = async () => {
    if (!selectedNPC) return

    setIsGenerating(true)
    setNPCResponse(null)
    setChatResponse(null)

    try {
      // Generate NPC response to the sample question
      const response = await enhancedNPCService.generateNPCAnswer(
        selectedNPC.id,
        SAMPLE_QUESTION
      )

      setNPCResponse(response)

      // Generate a chat message using the new OpenAI system
      const context: NPCConversationContext = {
        npcId: selectedNPC.id,
        triggerType: response.isCorrect ? 'on_correct' : 'on_incorrect',
        roomId: 'demo_room',
        playerId: 'demo_user',
        userMood: response.isCorrect ? 'confident' : 'struggling',
        quizContext: {
          topicId: 'government_structure',
          currentQuestion: SAMPLE_QUESTION,
          userPerformance: {
            correctAnswers: response.isCorrect ? 1 : 0,
            totalAnswered: 1,
            averageTime: response.responseTimeSeconds
          }
        }
      }

      const chatMessage = await enhancedNPCService.generateNPCMessage(context)
      setChatResponse(chatMessage)

    } catch (error) {
      console.error('Error generating NPC response:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateChatOnly = async () => {
    if (!selectedNPC) return

    setIsGenerating(true)
    setChatResponse(null)

    try {
      const context: NPCConversationContext = {
        npcId: selectedNPC.id,
        triggerType: selectedTrigger,
        roomId: 'demo_room',
        playerId: 'demo_user',
        userMood: 'neutral',
        quizContext: {
          topicId: 'government_structure',
          userPerformance: {
            correctAnswers: 3,
            totalAnswered: 5,
            averageTime: 12
          },
          roomPerformance: {
            averageScore: 68,
            playerCount: 4,
            userRank: 2
          }
        }
      }

      const chatMessage = await enhancedNPCService.generateNPCMessage(context)
      setChatResponse(chatMessage)

    } catch (error) {
      console.error('Error generating chat message:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🤖 OpenAI NPC System Demo</h1>
        <p className="text-muted-foreground">
          Experience how AI personalities bring civic education to life with dynamic conversations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NPC Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Choose an NPC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {NPC_PERSONALITIES.map((npc) => (
                <div
                  key={npc.id}
                  onClick={() => setSelectedNPC(npc)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedNPC?.id === npc.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{npc.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{npc.name}</h3>
                      <Badge className={`text-xs ${getSkillLevelColor(npc.skillLevel)}`}>
                        {npc.skillLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* NPC Details & Demo */}
        <div className="lg:col-span-2 space-y-6">
          {selectedNPC && (
            <>
              {/* NPC Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-3xl">{selectedNPC.emoji}</span>
                    <div>
                      <h2 className="text-xl">{selectedNPC.name}</h2>
                      <Badge className={getSkillLevelColor(selectedNPC.skillLevel)}>
                        {selectedNPC.skillLevel}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{selectedNPC.description}</p>
                  
                  {/* NPC Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4" />
                        Accuracy Range
                      </div>
                      <div className="text-lg font-medium">
                        {selectedNPC.accuracyRange[0]}% - {selectedNPC.accuracyRange[1]}%
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        Response Time
                      </div>
                      <div className="text-lg font-medium">
                        {selectedNPC.responseTimeRange[0]}s - {selectedNPC.responseTimeRange[1]}s
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Specialties
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNPC.traits.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Weaknesses</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNPC.traits.weaknesses.map((weakness) => (
                        <Badge key={weakness} variant="secondary" className="text-xs">
                          {weakness.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Demo Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Test Quiz Response
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Sample Question:</h3>
                    <p className="text-sm">{SAMPLE_QUESTION.question}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>A) {SAMPLE_QUESTION.option_a}</div>
                      <div>B) {SAMPLE_QUESTION.option_b}</div>
                      <div>C) {SAMPLE_QUESTION.option_c}</div>
                      <div>D) {SAMPLE_QUESTION.option_d}</div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateResponse} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Generate Quiz Response + Chat
                      </>
                    )}
                  </Button>

                  {/* NPC Response */}
                  {npcResponse && (
                    <div className="space-y-3">
                      <div className={`p-4 rounded-lg border ${
                        npcResponse.isCorrect 
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{selectedNPC.emoji}</span>
                          <span className="font-medium">{selectedNPC.name}</span>
                          <Badge variant={npcResponse.isCorrect ? "default" : "destructive"}>
                            {npcResponse.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div><strong>Answer:</strong> {npcResponse.answer}</div>
                          <div><strong>Response Time:</strong> {npcResponse.responseTimeSeconds}s</div>
                          <div><strong>Confidence:</strong> {Math.round(npcResponse.confidence * 100)}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chat Demo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Test OpenAI Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Conversation Trigger:</label>
                    <select 
                      value={selectedTrigger} 
                      onChange={(e) => setSelectedTrigger(e.target.value as NPCConversationContext['triggerType'])}
                      className="w-full p-2 border rounded-lg bg-background"
                    >
                      <option value="on_join">Player Joins Room</option>
                      <option value="on_correct">Player Answers Correctly</option>
                      <option value="on_incorrect">Player Answers Incorrectly</option>
                      <option value="on_game_start">Game Starting</option>
                      <option value="on_game_end">Game Ending</option>
                      <option value="on_encouragement_needed">Player Needs Encouragement</option>
                    </select>
                  </div>

                  <Button 
                    onClick={handleGenerateChatOnly} 
                    disabled={isGenerating}
                    className="w-full"
                    variant="outline"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate OpenAI Chat Response
                      </>
                    )}
                  </Button>

                  {/* Chat Response */}
                  {chatResponse && (
                    <div className="p-4 bg-muted rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{selectedNPC.emoji}</span>
                        <span className="font-medium">{selectedNPC.name}</span>
                        <Badge className={getToneColor(chatResponse.tone)}>
                          {chatResponse.tone}
                        </Badge>
                        <Badge variant="outline">
                          {chatResponse.educationalValue} educational value
                        </Badge>
                      </div>
                      
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded border-l-4 border-primary">
                        <p className="text-sm leading-relaxed">"{chatResponse.message}"</p>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {chatResponse.personalityTraits.map(trait => (
                          <Badge key={trait} variant="secondary" className="text-xs">
                            {trait.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      {analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              NPC Performance Analytics (Mock Data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.slice(0, 6).map((npc) => (
                <div key={npc.npcCode} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {NPC_PERSONALITIES.find(n => n.id === npc.npcCode)?.emoji || '🤖'}
                    </span>
                    <h3 className="font-medium text-sm">{npc.displayName}</h3>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Avg Accuracy:</span>
                      <span className="font-medium">{npc.avgAccuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response:</span>
                      <span className="font-medium">{npc.avgTimePerQuestion.toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Quizzes:</span>
                      <span className="font-medium">{npc.totalQuizzes}</span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Performance</span>
                        <span>{npc.recentPerformance.toFixed(0)}%</span>
                      </div>
                      <Progress value={npc.recentPerformance} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 