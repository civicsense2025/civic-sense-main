"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type BaseMultiplayerEngineProps } from "./base-multiplayer-engine"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Alert, AlertDescription } from "../ui/alert"
import { Textarea } from "../ui/textarea"
import { Brain, Users, MessageCircle, Lightbulb, BookOpen, Target, Clock, Star, ArrowRight, Send } from "lucide-react"
import { cn } from "../../utils"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { useMultiplayerRoom, useMultiplayerQuiz } from '@/lib/multiplayer/operations'
import { multiplayerNPCIntegration } from '@/lib/multiplayer/operations-npc-integration'

// =============================================================================
// LEARNING LAB INTERFACES
// =============================================================================

interface LearningLabState {
  currentPhase: 'study' | 'discuss' | 'practice' | 'reflect'
  aiTeacherActive: boolean
  collaborativeNotes: string[]
  learningObjectives: LearningObjective[]
  completedObjectives: string[]
  discussionPosts: DiscussionPost[]
  reflectionEntries: ReflectionEntry[]
  totalScore: number
}

interface LearningObjective {
  id: string
  text: string
  category: string
  difficulty: number
  completed: boolean
  evidence: string[]
}

interface DiscussionPost {
  id: string
  playerId: string
  playerName: string
  content: string
  timestamp: string
  likes: number
  aiAnalysis?: string
}

interface ReflectionEntry {
  id: string
  playerId: string
  content: string
  timestamp: string
  type: 'insight' | 'connection' | 'question' | 'application'
}

interface AITeacherMessage {
  id: string
  content: string
  type: 'guidance' | 'explanation' | 'encouragement' | 'challenge'
  targetPlayerId?: string
  timestamp: string
}

// =============================================================================
// LEARNING LAB ENGINE COMPONENT
// =============================================================================

export function LearningLabEngine(props: BaseMultiplayerEngineProps) {
  const { questions, roomId, playerId, onComplete, currentTopic } = props
  const config = GAME_MODE_CONFIGS.learning_lab
  
  const { room, players } = useMultiplayerRoom(roomId)
  const { responses, submitResponse } = useMultiplayerQuiz(roomId, playerId, props.topicId, questions.length)
  
  const [labState, setLabState] = useState<LearningLabState>({
    currentPhase: 'study',
    aiTeacherActive: true,
    collaborativeNotes: [],
    learningObjectives: [],
    completedObjectives: [],
    discussionPosts: [],
    reflectionEntries: [],
    totalScore: 0
  })

  const [discussionInput, setDiscussionInput] = useState("")
  const [noteInput, setNoteInput] = useState("")
  const [reflectionInput, setReflectionInput] = useState("")
  const [showAITeacher, setShowAITeacher] = useState(true)
  const [aiTeacherMessages, setAITeacherMessages] = useState<AITeacherMessage[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)

  // Initialize Learning Lab
  useEffect(() => {
    initializeLearningLab()
  }, [questions, currentTopic])

  const initializeLearningLab = useCallback(async () => {
    if (!questions.length || !currentTopic) return

    // Generate learning objectives from questions
    const objectives = generateLearningObjectives(questions, currentTopic)
    
    setLabState(prev => ({
      ...prev,
      learningObjectives: objectives
    }))

    // Activate AI teacher
    await activateAITeacher()
  }, [questions, currentTopic])

  const generateLearningObjectives = (questions: any[], topic: any): LearningObjective[] => {
    const categories = [...new Set(questions.map(q => q.category || 'General'))]
    return categories.map((category, index) => ({
      id: `obj_${index}`,
      text: `Understand key concepts in ${category} related to ${topic.title}`,
      category,
      difficulty: Math.floor(Math.random() * 3) + 1,
      completed: false,
      evidence: []
    }))
  }

  const activateAITeacher = async () => {
    if (!roomId || !playerId) return

    try {
      // Generate initial AI teacher welcome message
      const welcomeMessage: AITeacherMessage = {
        id: `ai_${Date.now()}`,
        content: `Welcome to the Learning Lab! I'm here to guide your collaborative learning journey. Let's explore ${currentTopic?.title} together and help each other understand these important civic concepts.`,
        type: 'guidance',
        timestamp: new Date().toISOString()
      }
      
      setAITeacherMessages(prev => [...prev, welcomeMessage])
      
      // Activate NPC teacher integration
      multiplayerNPCIntegration.handleRoomEvent({
        roomId,
        npcId: 'ai_teacher',
        playerId: 'npc_teacher',
        roomState: {
          players,
          currentQuestionIndex: 0,
          totalQuestions: questions.length,
          averageScore: 0
        },
        userPerformance: {}
      }, 'player_joined').catch((error: Error) => {
        console.warn('Failed to activate AI teacher:', error.message)
      })
      
    } catch (error) {
      console.error('Error activating AI teacher:', error)
    }
  }

  // =============================================================================
  // COLLABORATIVE FEATURES
  // =============================================================================

  const handleDiscussionSubmit = async () => {
    if (!discussionInput.trim()) return

    const post: DiscussionPost = {
      id: `post_${Date.now()}`,
      playerId,
      playerName: players.find(p => p.id === playerId)?.player_name || 'Player',
      content: discussionInput.trim(),
      timestamp: new Date().toISOString(),
      likes: 0
    }

    setLabState(prev => ({
      ...prev,
      discussionPosts: [...prev.discussionPosts, post]
    }))

    setDiscussionInput("")

    // Generate AI teacher feedback on discussion
    await generateAITeacherResponse(post)
  }

  const generateAITeacherResponse = async (post: DiscussionPost) => {
    try {
      // Simulate AI analysis and response
      const responses = [
        "Excellent insight! How might this connect to what we've learned about civic participation?",
        "That's a thoughtful perspective. Can you think of a real-world example?",
        "Great point! This highlights an important aspect of democratic governance.",
        "Interesting connection! How do you think this affects everyday citizens?"
      ]
      
      const response: AITeacherMessage = {
        id: `ai_${Date.now()}`,
        content: responses[Math.floor(Math.random() * responses.length)],
        type: 'guidance',
        targetPlayerId: post.playerId,
        timestamp: new Date().toISOString()
      }
      
      // Add delay to make it feel more natural
      setTimeout(() => {
        setAITeacherMessages(prev => [...prev, response])
      }, 2000)
      
    } catch (error) {
      console.error('Error generating AI teacher response:', error)
    }
  }

  const handleAddNote = () => {
    if (!noteInput.trim()) return

    setLabState(prev => ({
      ...prev,
      collaborativeNotes: [...prev.collaborativeNotes, noteInput.trim()]
    }))

    setNoteInput("")
  }

  const handleAddReflection = () => {
    if (!reflectionInput.trim()) return

    const reflection: ReflectionEntry = {
      id: `reflection_${Date.now()}`,
      playerId,
      content: reflectionInput.trim(),
      timestamp: new Date().toISOString(),
      type: 'insight'
    }

    setLabState(prev => ({
      ...prev,
      reflectionEntries: [...prev.reflectionEntries, reflection]
    }))

    setReflectionInput("")
  }

  // =============================================================================
  // ENHANCED ANSWER HANDLING
  // =============================================================================

  const handleLearningLabAnswer = useCallback(async (answer: string, timeSpent: number) => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    const isCorrect = answer === currentQuestion.correct_answer

    try {
      // Submit to database using real multiplayer hook
      const attemptId = `learning_lab_${playerId}_${Date.now()}`
      await submitResponse(
        currentQuestion.question_number,
        currentQuestion.question_number.toString(),
        answer,
        isCorrect,
        timeSpent,
        attemptId
      )

      // Update learning objectives and score
      setLabState(prev => ({
        ...prev,
        totalScore: prev.totalScore + (isCorrect ? 100 : 50), // Partial credit in learning mode
        completedObjectives: isCorrect 
          ? [...prev.completedObjectives, currentQuestion.category || 'General']
          : prev.completedObjectives
      }))

      // Generate contextual AI teacher response
      const teacherResponse: AITeacherMessage = {
        id: `ai_${Date.now()}`,
        content: isCorrect 
          ? `Well done! You've grasped this concept well. Let's explore how this applies in real civic situations.`
          : `That's a common misconception. Let's think through this together - what aspects of this topic might we explore further?`,
        type: isCorrect ? 'encouragement' : 'guidance',
        targetPlayerId: playerId,
        timestamp: new Date().toISOString()
      }

      setTimeout(() => {
        setAITeacherMessages(prev => [...prev, teacherResponse])
      }, 1500)

      // Move to next question after delay
      setTimeout(() => {
        handleNextQuestion()
      }, 3000)

    } catch (error) {
      console.error('Failed to submit learning lab answer:', error)
    }
  }, [currentQuestionIndex, questions, playerId, submitResponse])

  // Handle next question navigation
  const handleNextQuestion = useCallback(() => {
    const isLastQuestion = currentQuestionIndex >= questions.length - 1
    
    if (isLastQuestion) {
      // Move to reflection phase
      handlePhaseTransition('reflect')
    } else {
      // Move to next question in practice phase
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }, [currentQuestionIndex, questions.length])

  const handlePhaseTransition = (newPhase: LearningLabState['currentPhase']) => {
    setLabState(prev => ({ ...prev, currentPhase: newPhase }))
    
    // Generate phase-specific AI teacher guidance
    const phaseMessages = {
      study: "Let's begin by reviewing the key concepts we'll be exploring today.",
      discuss: "Now let's share our thoughts and learn from each other's perspectives.",
      practice: "Time to apply what we've learned! Remember, this is about understanding, not just getting the right answer.",
      reflect: "Let's take a moment to reflect on what we've discovered and how it connects to your civic life."
    }
    
    const message: AITeacherMessage = {
      id: `ai_${Date.now()}`,
      content: phaseMessages[newPhase],
      type: 'guidance',
      timestamp: new Date().toISOString()
    }
    
    setAITeacherMessages(prev => [...prev, message])
  }

  const completeGameAfterReflection = () => {
    setGameCompleted(true)
    onComplete()
  }

  // =============================================================================
  // PHASE CONTENT RENDERERS
  // =============================================================================

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
        <p className="text-muted-foreground">Review materials and prepare for collaborative learning</p>
      </div>

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
            Topic Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium">{currentTopic?.title}</h4>
              <p className="text-sm text-muted-foreground mt-2">
                In this collaborative learning session, we'll explore key concepts through discussion, 
                practice, and reflection. Remember, the goal is understanding and application, not just correct answers.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-blue-400 text-blue-400" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Collaborative Learning</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <p className="text-muted-foreground">Share insights and learn from your peers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Group Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                What aspects of {currentTopic?.title} do you find most relevant to your daily life as a citizen?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Share Your Thoughts:</label>
              <Textarea
                value={discussionInput}
                onChange={(e) => setDiscussionInput(e.target.value)}
                placeholder="Share your insights, questions, or connections you've made..."
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleDiscussionSubmit}
                disabled={!discussionInput.trim()}
                size="sm"
              >
                <Send className="mr-2 h-3 w-3" />
                Share Insight
              </Button>
            </div>

            {labState.discussionPosts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Peer Insights:</h4>
                {labState.discussionPosts.map((post) => (
                  <div key={post.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{post.playerName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
        <p className="text-muted-foreground">Apply knowledge through guided questions</p>
      </div>

      <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-900 dark:text-purple-100">
            Learning Focus
          </span>
        </div>
        <p className="text-sm text-purple-800 dark:text-purple-200">
          Remember: In Learning Lab mode, the goal is understanding. Take your time to think through each question,
          and don't worry about speed. Partial credit is given for thoughtful engagement.
        </p>
      </div>

      {/* Use BaseMultiplayerEngine for the actual quiz questions */}
      <BaseMultiplayerEngine
        {...props}
        config={{
          ...config,
          onAnswerSubmit: handleLearningLabAnswer
        } as any}
      />
    </div>
  )

  const renderReflectionPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="h-8 w-8 text-orange-500 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Reflection Phase</h3>
        <p className="text-muted-foreground">Reflect on learning and connect to civic life</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Textarea
                value={reflectionInput}
                onChange={(e) => setReflectionInput(e.target.value)}
                placeholder="What's one key insight you gained? How might you apply this knowledge in your civic life?"
                className="flex-1"
              />
              <Button onClick={handleAddReflection} disabled={!reflectionInput.trim()}>
                Add
              </Button>
            </div>
            
            <div className="space-y-2">
              {labState.reflectionEntries.map((entry) => (
                <div key={entry.id} className="p-2 bg-muted rounded text-sm">
                  <span className="font-medium">{players.find(p => p.id === entry.playerId)?.player_name}: </span>
                  {entry.content}
                </div>
              ))}
            </div>
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
                placeholder="Add a key takeaway or insight for the group..."
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

      <Button 
        onClick={completeGameAfterReflection}
        className="w-full"
        size="lg"
      >
        Complete Learning Lab
      </Button>
    </div>
  )

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  // Show results if completed
  if (gameCompleted) {
    const userResponses = responses.filter(r => r.player_id === playerId)
    const correctAnswers = userResponses.filter(r => r.is_correct).length
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-blue-600">Learning Lab Complete! 🧪</h1>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl mx-auto mb-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {labState.totalScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Learning Points</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {correctAnswers}/{questions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Questions Mastered</div>
                </div>
              </div>
              
              <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-950/20 rounded-lg">
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  🎓 Collaborative Learning Achievements
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  • {labState.discussionPosts.length} discussion contributions
                  • {labState.reflectionEntries.length} reflection insights
                  • {labState.collaborativeNotes.length} shared notes
                </div>
              </div>
              
              <Button onClick={onComplete} className="w-full bg-blue-600 hover:bg-blue-700">
                Continue Your Civic Journey
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          <p className="text-muted-foreground">Explore, discuss, practice, and reflect together</p>
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
          <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-4 max-h-80 overflow-y-auto">
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
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {aiTeacherMessages.slice(-3).map((message) => (
                <div key={message.id} className="text-sm text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                  {message.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 