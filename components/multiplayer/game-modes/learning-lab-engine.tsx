"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type MultiplayerGameState, type BaseMultiplayerEngineProps } from "./base-multiplayer-engine"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Users, MessageCircle, Lightbulb, BookOpen, Target, Clock, Star, ArrowRight, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { useMultiplayerRoom } from "@/lib/multiplayer"
import { multiplayerNPCIntegration } from "@/lib/multiplayer-npc-integration"

// =============================================================================
// LEARNING LAB INTERFACES
// =============================================================================

interface LearningLabState extends MultiplayerGameState {
  currentPhase: 'study' | 'discuss' | 'practice' | 'reflect'
  aiTeacherActive: boolean
  discussionPrompts: DiscussionPrompt[]
  currentPrompt: DiscussionPrompt | null
  groupActivities: GroupActivity[]
  currentActivity: GroupActivity | null
  collaborativeNotes: string[]
  learningObjectives: LearningObjective[]
  completedObjectives: string[]
  peerFeedback: PeerFeedback[]
  aiInsights: AIInsight[]
  studyMaterials: StudyMaterial[]
}

interface DiscussionPrompt {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
  responses: PromptResponse[]
  aiModeration: boolean
}

interface PromptResponse {
  playerId: string
  playerName: string
  response: string
  timestamp: string
  likes: number
  aiScore: number
}

interface GroupActivity {
  id: string
  type: 'debate' | 'case_study' | 'role_play' | 'problem_solving'
  title: string
  description: string
  roles: ActivityRole[]
  timeLimit: number
  status: 'pending' | 'active' | 'completed'
  outcome: string | null
}

interface ActivityRole {
  id: string
  name: string
  description: string
  assignedPlayerId: string | null
  guidelines: string[]
}

interface LearningObjective {
  id: string
  text: string
  category: string
  difficulty: number
  completed: boolean
  evidence: string[]
}

interface PeerFeedback {
  fromPlayerId: string
  toPlayerId: string
  feedback: string
  rating: number
  category: 'participation' | 'insight' | 'collaboration'
  timestamp: string
}

interface AIInsight {
  id: string
  type: 'misconception' | 'strength' | 'suggestion' | 'connection'
  content: string
  targetPlayerId: string | null
  relevantQuestion: string | null
  confidence: number
  timestamp: string
}

interface StudyMaterial {
  id: string
  title: string
  type: 'article' | 'video' | 'infographic' | 'simulation'
  url: string
  summary: string
  relevantTopics: string[]
  difficulty: number
}

// =============================================================================
// LEARNING LAB ENGINE COMPONENT
// =============================================================================

export function LearningLabEngine(props: BaseMultiplayerEngineProps) {
  const { questions, roomId, playerId, onComplete, currentTopic } = props
  
  const [labState, setLabState] = useState<LearningLabState>({
    ...{} as MultiplayerGameState,
    currentPhase: 'study',
    aiTeacherActive: true,
    discussionPrompts: [],
    currentPrompt: null,
    groupActivities: [],
    currentActivity: null,
    collaborativeNotes: [],
    learningObjectives: [],
    completedObjectives: [],
    peerFeedback: [],
    aiInsights: [],
    studyMaterials: []
  })

  const [discussionInput, setDiscussionInput] = useState("")
  const [noteInput, setNoteInput] = useState("")
  const [showAITeacher, setShowAITeacher] = useState(true)

  const { room, players } = useMultiplayerRoom(roomId)
  const config = GAME_MODE_CONFIGS.learning_lab

  // Initialize Learning Lab
  useEffect(() => {
    initializeLearningLab()
  }, [questions, currentTopic])

  const initializeLearningLab = useCallback(async () => {
    if (!questions.length || !currentTopic) return

    // Generate learning objectives from questions
    const objectives = generateLearningObjectives(questions, currentTopic)
    
    // Create discussion prompts
    const prompts = generateDiscussionPrompts(questions)
    
    // Generate study materials
    const materials = generateStudyMaterials(currentTopic, questions)
    
    // Create group activities
    const activities = generateGroupActivities(questions, players)

    setLabState(prev => ({
      ...prev,
      learningObjectives: objectives,
      discussionPrompts: prompts,
      studyMaterials: materials,
      groupActivities: activities,
      currentPrompt: prompts[0] || null
    }))

    // Activate AI teacher
    await activateAITeacher()
  }, [questions, currentTopic, players])

  const generateLearningObjectives = (questions: any[], topic: any): LearningObjective[] => {
    const categories = [...new Set(questions.map(q => q.category))]
    return categories.map((category, index) => ({
      id: `obj_${index}`,
      text: `Understand key concepts in ${category} related to ${topic.title}`,
      category,
      difficulty: Math.floor(Math.random() * 3) + 1,
      completed: false,
      evidence: []
    }))
  }

  const generateDiscussionPrompts = (questions: any[]): DiscussionPrompt[] => {
    return questions.slice(0, 3).map((q, index) => ({
      id: `prompt_${index}`,
      question: `How does "${q.question}" relate to your daily life as a citizen?`,
      category: q.category,
      difficulty: q.difficulty_level || 'medium',
      timeLimit: 300, // 5 minutes
      responses: [],
      aiModeration: true
    }))
  }

  const generateStudyMaterials = (topic: any, questions: any[]): StudyMaterial[] => {
    return [
      {
        id: 'material_1',
        title: `Understanding ${topic.title}`,
        type: 'article',
        url: '#',
        summary: `Comprehensive overview of ${topic.title} and its civic implications`,
        relevantTopics: [topic.title],
        difficulty: 2
      },
      {
        id: 'material_2',
        title: 'Interactive Civic Simulation',
        type: 'simulation',
        url: '#',
        summary: 'Practice applying civic knowledge in realistic scenarios',
        relevantTopics: questions.map(q => q.category),
        difficulty: 3
      }
    ]
  }

  const generateGroupActivities = (questions: any[], players: any[]): GroupActivity[] => {
    if (!players || players.length < 2) return []

    return [
      {
        id: 'activity_1',
        type: 'debate',
        title: 'Civic Responsibility Debate',
        description: 'Debate different perspectives on civic engagement and responsibility',
        roles: [
          {
            id: 'role_1',
            name: 'Advocate',
            description: 'Argue for increased civic participation',
            assignedPlayerId: null,
            guidelines: ['Present evidence for your position', 'Respond respectfully to counterarguments']
          },
          {
            id: 'role_2',
            name: 'Skeptic',
            description: 'Question the effectiveness of traditional civic engagement',
            assignedPlayerId: null,
            guidelines: ['Challenge assumptions', 'Propose alternative approaches']
          }
        ],
        timeLimit: 600, // 10 minutes
        status: 'pending',
        outcome: null
      }
    ]
  }

  const activateAITeacher = async () => {
    if (!roomId || !playerId) return

    try {
      // This would integrate with the NPC system to provide AI teacher responses
      console.log('🧠 Activating AI Teacher for Learning Lab')
    } catch (error) {
      console.error('Error activating AI teacher:', error)
    }
  }

  const handleDiscussionSubmit = async () => {
    if (!discussionInput.trim() || !labState.currentPrompt) return

    const response: PromptResponse = {
      playerId,
      playerName: players.find(p => p.id === playerId)?.player_name || 'Player',
      response: discussionInput.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      aiScore: Math.random() * 100 // Would be calculated by AI
    }

    setLabState(prev => ({
      ...prev,
      discussionPrompts: prev.discussionPrompts.map(prompt =>
        prompt.id === prev.currentPrompt?.id
          ? { ...prompt, responses: [...prompt.responses, response] }
          : prompt
      )
    }))

    setDiscussionInput("")

    // Generate AI feedback
    await generateAIFeedback(response)
  }

  const generateAIFeedback = async (response: PromptResponse) => {
    // This would use the NPC system to generate contextual feedback
    const insight: AIInsight = {
      id: `insight_${Date.now()}`,
      type: 'suggestion',
      content: `Great insight! Consider also exploring how this connects to local government structures.`,
      targetPlayerId: response.playerId,
      relevantQuestion: labState.currentPrompt?.question || null,
      confidence: 85,
      timestamp: new Date().toISOString()
    }

    setLabState(prev => ({
      ...prev,
      aiInsights: [...prev.aiInsights, insight]
    }))
  }

  const handleAddNote = () => {
    if (!noteInput.trim()) return

    setLabState(prev => ({
      ...prev,
      collaborativeNotes: [...prev.collaborativeNotes, noteInput.trim()]
    }))

    setNoteInput("")
  }

  const handlePhaseTransition = (newPhase: LearningLabState['currentPhase']) => {
    setLabState(prev => ({ ...prev, currentPhase: newPhase }))
  }

  const renderPhaseContent = () => {
    switch (labState.currentPhase) {
      case 'study':
        return renderStudyPhase()
      case 'discuss':
        return renderDiscussionPhase()
      case 'practice':
        return renderPracticePhase()
      case 'reflect':
        return renderReflectionPhase()
      default:
        return renderStudyPhase()
    }
  }

  const renderStudyPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Study Phase</h3>
        <p className="text-muted-foreground">Review materials and prepare for discussion</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {labState.learningObjectives.map((objective) => (
                <div key={objective.id} className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2",
                    objective.completed ? "bg-green-500 border-green-500" : "border-gray-300"
                  )} />
                  <span className={cn(
                    "text-sm",
                    objective.completed ? "line-through text-muted-foreground" : ""
                  )}>
                    {objective.text}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Study Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {labState.studyMaterials.map((material) => (
                <div key={material.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{material.title}</h4>
                    <Badge variant="outline">{material.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{material.summary}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: material.difficulty }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">Difficulty</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={() => handlePhaseTransition('discuss')}
        className="w-full"
        size="lg"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Start Discussion Phase
      </Button>
    </div>
  )

  const renderDiscussionPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <MessageCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Discussion Phase</h3>
        <p className="text-muted-foreground">Engage with peers and share insights</p>
      </div>

      {labState.currentPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Discussion Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {labState.currentPrompt.question}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{labState.currentPrompt.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {Math.floor(labState.currentPrompt.timeLimit / 60)} min
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Response:</label>
                <Textarea
                  value={discussionInput}
                  onChange={(e) => setDiscussionInput(e.target.value)}
                  placeholder="Share your thoughts and insights..."
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleDiscussionSubmit}
                  disabled={!discussionInput.trim()}
                  size="sm"
                >
                  <Send className="mr-2 h-3 w-3" />
                  Submit Response
                </Button>
              </div>

              {labState.currentPrompt.responses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Peer Responses:</h4>
                  {labState.currentPrompt.responses.map((response, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{response.playerName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            AI Score: {Math.round(response.aiScore)}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm">{response.response}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={() => handlePhaseTransition('practice')}
        className="w-full"
        size="lg"
      >
        <Users className="mr-2 h-4 w-4" />
        Start Practice Phase
      </Button>
    </div>
  )

  const renderPracticePhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Practice Phase</h3>
        <p className="text-muted-foreground">Apply knowledge through interactive activities</p>
      </div>

      {/* This would render the actual quiz questions in a collaborative format */}
      <BaseMultiplayerEngine {...props} />

      <Button 
        onClick={() => handlePhaseTransition('reflect')}
        className="w-full"
        size="lg"
      >
        <Brain className="mr-2 h-4 w-4" />
        Start Reflection Phase
      </Button>
    </div>
  )

  const renderReflectionPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="h-8 w-8 text-orange-500 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Reflection Phase</h3>
        <p className="text-muted-foreground">Reflect on learning and provide feedback</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {labState.aiInsights.map((insight) => (
                <Alert key={insight.id}>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}:</strong> {insight.content}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaborative Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a key insight or takeaway..."
                  className="flex-1"
                />
                <Button onClick={handleAddNote} disabled={!noteInput.trim()}>
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {labState.collaborativeNotes.map((note, index) => (
                  <div key={index} className="p-2 bg-muted rounded text-sm">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={onComplete}
        className="w-full"
        size="lg"
      >
        Complete Learning Lab
      </Button>
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-950/20 rounded-full text-sm text-blue-700 dark:text-blue-300 mb-4">
            <Brain className="h-4 w-4" />
            Learning Lab Mode - Collaborative Learning with AI Teachers
          </div>
          <h1 className="text-3xl font-bold mb-2">{currentTopic?.title}</h1>
          <p className="text-muted-foreground">{currentTopic?.description}</p>
        </div>

        {/* Phase Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            {(['study', 'discuss', 'practice', 'reflect'] as const).map((phase, index) => (
              <div key={phase} className="flex items-center gap-2">
                <button
                  onClick={() => handlePhaseTransition(phase)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    labState.currentPhase === phase
                      ? "bg-blue-500 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </button>
                {index < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Phase Content */}
        <div className="max-w-4xl mx-auto">
          {renderPhaseContent()}
        </div>

        {/* AI Teacher Panel */}
        {showAITeacher && labState.aiTeacherActive && (
          <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <span className="font-medium">AI Teacher</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAITeacher(false)}
              >
                ×
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              I'm here to help guide your learning journey. Feel free to ask questions or request clarification on any topic!
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 