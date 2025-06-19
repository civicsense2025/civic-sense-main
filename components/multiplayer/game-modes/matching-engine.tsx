"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type BaseMultiplayerEngineProps } from "./base-multiplayer-engine"
import { MatchingQuestion } from "@/components/quiz/question-types/matching"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Puzzle, 
  Users, 
  Clock, 
  Trophy, 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Target,
  Zap,
  Brain,
  Crown,
  Medal,
  Timer
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { useMultiplayerRoom, useMultiplayerQuiz } from "@/lib/multiplayer"
import { multiplayerNPCIntegration } from "@/lib/multiplayer-npc-integration"
import confetti from "canvas-confetti"

// =============================================================================
// MATCHING SPECIFIC TYPES
// =============================================================================

interface MatchingState {
  currentMatches: Record<string, string>
  completedMatches: number
  totalMatches: number
  matchingSpeed: number // matches per minute
  accuracyRate: number
  collaborativeBonus: number
  teamScore: number
  personalScore: number
  hintsUsed: number
  maxHints: number
}

interface PlayerMatchingProgress {
  playerId: string
  playerName: string
  matchesCompleted: number
  accuracy: number
  speed: number
  isActive: boolean
  currentQuestion: number
  totalScore: number
  isUser?: boolean
  collaborativeContributions: number
}

interface MatchingAlert {
  type: 'match_success' | 'speed_bonus' | 'collaboration' | 'hint_used' | 'completion'
  message: string
  show: boolean
  player?: string
  bonus?: number
}

interface CollaborativeHint {
  id: string
  playerId: string
  playerName: string
  hintText: string
  upvotes: number
  timestamp: string
  isUseful?: boolean
}

// =============================================================================
// MATCHING ENGINE COMPONENT
// =============================================================================

export function MatchingEngine(props: BaseMultiplayerEngineProps) {
  const config = GAME_MODE_CONFIGS.matching
  const { room, players } = useMultiplayerRoom(props.roomId)
  const { responses, submitResponse } = useMultiplayerQuiz(props.roomId, props.playerId, props.topicId, props.questions.length)

  // Matching specific state
  const [matchingState, setMatchingState] = useState<MatchingState>({
    currentMatches: {},
    completedMatches: 0,
    totalMatches: 0,
    matchingSpeed: 0,
    accuracyRate: 100,
    collaborativeBonus: 0,
    teamScore: 0,
    personalScore: 0,
    hintsUsed: 0,
    maxHints: 3
  })

  const [matchingAlert, setMatchingAlert] = useState<MatchingAlert>({
    type: 'match_success',
    message: '',
    show: false
  })

  const [collaborativeHints, setCollaborativeHints] = useState<CollaborativeHint[]>([])
  const [showHintInput, setShowHintInput] = useState(false)
  const [hintInput, setHintInput] = useState("")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null)
  const [showCollaborativeView, setShowCollaborativeView] = useState(false)

  // Timer refs for performance tracking
  const matchTimerRef = useRef<NodeJS.Timeout>()
  const questionTimerRef = useRef<number>(Date.now())

  // =============================================================================
  // MATCHING LOGIC & PROGRESS TRACKING
  // =============================================================================

  const initializeMatching = useCallback(() => {
    const currentQuestion = props.questions[currentQuestionIndex]
    if (!currentQuestion || !currentQuestion.matching_pairs) return

    const totalPairs = currentQuestion.matching_pairs.length
    setMatchingState(prev => ({
      ...prev,
      totalMatches: totalPairs,
      completedMatches: 0,
      currentMatches: {}
    }))

    setQuestionStartTime(Date.now())
    questionTimerRef.current = Date.now()
  }, [props.questions, currentQuestionIndex])

  const calculateMatchingSpeed = useCallback((timeElapsed: number, matchesCompleted: number) => {
    if (timeElapsed === 0) return 0
    return Math.round((matchesCompleted / (timeElapsed / 60000)) * 100) / 100 // matches per minute
  }, [])

  const calculatePlayerProgress = useMemo(() => {
    const playerProgress: PlayerMatchingProgress[] = players.map(player => {
      const playerResponses = responses.filter(r => r.player_id === player.id)
      const completedQuestions = playerResponses.length
      const correctAnswers = playerResponses.filter(r => r.is_correct).length
      const accuracy = completedQuestions > 0 ? Math.round((correctAnswers / completedQuestions) * 100) : 100
      
      // Calculate speed based on response times
      const avgResponseTime = playerResponses.length > 0 
        ? playerResponses.reduce((sum, r) => sum + (r.response_time || 30), 0) / playerResponses.length
        : 30
      const speed = Math.max(0, Math.round(100 - (avgResponseTime * 2))) // Lower time = higher speed

      return {
        playerId: player.id,
        playerName: player.player_name,
        matchesCompleted: completedQuestions,
        accuracy,
        speed,
        isActive: completedQuestions === currentQuestionIndex,
        currentQuestion: Math.min(completedQuestions, currentQuestionIndex),
        totalScore: correctAnswers * 100,
        isUser: player.id === props.playerId,
        collaborativeContributions: collaborativeHints.filter(h => h.playerId === player.id).length
      }
    })

    return playerProgress.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return b.totalScore - a.totalScore
    })
  }, [players, responses, currentQuestionIndex, props.playerId, collaborativeHints])

  // =============================================================================
  // COLLABORATIVE FEATURES
  // =============================================================================

  const handleAddCollaborativeHint = useCallback(() => {
    if (!hintInput.trim()) return

    const hint: CollaborativeHint = {
      id: `hint_${Date.now()}`,
      playerId: props.playerId,
      playerName: players.find(p => p.id === props.playerId)?.player_name || 'Player',
      hintText: hintInput.trim(),
      upvotes: 0,
      timestamp: new Date().toISOString()
    }

    setCollaborativeHints(prev => [...prev, hint])
    setHintInput("")
    setShowHintInput(false)

    // Award collaboration points
    setMatchingState(prev => ({
      ...prev,
      collaborativeBonus: prev.collaborativeBonus + 25
    }))

    showAlert('collaboration', `🤝 Shared helpful hint with team (+25 bonus!)`)
  }, [hintInput, props.playerId, players])

  const handleUpvoteHint = useCallback((hintId: string) => {
    setCollaborativeHints(prev => 
      prev.map(hint => 
        hint.id === hintId 
          ? { ...hint, upvotes: hint.upvotes + 1 }
          : hint
      )
    )
  }, [])

  const showAlert = (type: MatchingAlert['type'], message: string, player?: string, bonus?: number) => {
    setMatchingAlert({
      type,
      message,
      show: true,
      player,
      bonus
    })

    setTimeout(() => {
      setMatchingAlert(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // =============================================================================
  // ENHANCED ANSWER HANDLING
  // =============================================================================

  const handleMatchingAnswer = useCallback(async (answer: string, isCorrect: boolean) => {
    const currentQuestion = props.questions[currentQuestionIndex]
    if (!currentQuestion || !questionStartTime) return

    const timeElapsed = Date.now() - questionStartTime
    const timeSpent = Math.round(timeElapsed / 1000)

    try {
      // Parse matching results from answer string
      const correctMatches = answer.match(/(\d+)\/(\d+)/)?.[1] || '0'
      const totalMatches = answer.match(/(\d+)\/(\d+)/)?.[2] || '1'
      const matchesCompleted = parseInt(correctMatches)
      const totalPairs = parseInt(totalMatches)
      const accuracy = Math.round((matchesCompleted / totalPairs) * 100)
      
      // Calculate speed bonus
      const speed = calculateMatchingSpeed(timeElapsed, totalPairs)
      const speedBonus = speed > 5 ? Math.round(speed * 10) : 0 // Bonus for completing quickly
      
      // Calculate collaborative bonus if hints were used
      const hintsFromOthers = collaborativeHints.filter(h => h.playerId !== props.playerId).length
      const collaborationBonus = hintsFromOthers > 0 ? 50 : 0
      
      const totalScore = (matchesCompleted * 100) + speedBonus + collaborationBonus

      // Submit to database
      const attemptId = `matching_${props.playerId}_${Date.now()}`
      await submitResponse(
        currentQuestion.question_number,
        currentQuestion.question_number.toString(),
        answer,
        isCorrect,
        timeSpent,
        attemptId
      )

      // Update local state
      setMatchingState(prev => ({
        ...prev,
        completedMatches: matchesCompleted,
        accuracyRate: accuracy,
        matchingSpeed: speed,
        personalScore: prev.personalScore + totalScore
      }))

      // Show appropriate feedback
      if (isCorrect) {
        showAlert('match_success', `🎯 Perfect matching! All ${totalPairs} pairs correct!`)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22C55E', '#16A34A', '#15803D']
        })
      } else if (matchesCompleted > totalPairs / 2) {
        showAlert('match_success', `Good effort! ${matchesCompleted}/${totalPairs} matches correct`)
      }

      if (speedBonus > 0) {
        setTimeout(() => {
          showAlert('speed_bonus', `⚡ Speed bonus: +${speedBonus} points!`, undefined, speedBonus)
        }, 1500)
      }

      if (collaborationBonus > 0) {
        setTimeout(() => {
          showAlert('collaboration', `🤝 Team collaboration bonus: +${collaborationBonus} points!`, undefined, collaborationBonus)
        }, 2000)
      }

      // Move to next question after delays
      setTimeout(() => {
        handleNextQuestion()
      }, 3500)

    } catch (error) {
      console.error('Failed to submit matching answer:', error)
    }
  }, [props.questions, currentQuestionIndex, questionStartTime, props.playerId, calculateMatchingSpeed, collaborativeHints, submitResponse])

  const handleNextQuestion = useCallback(() => {
    const isLastQuestion = currentQuestionIndex >= props.questions.length - 1
    
    if (isLastQuestion) {
      setGameCompleted(true)
      props.onComplete()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      // Reset hints for next question
      setCollaborativeHints([])
      setQuestionStartTime(Date.now())
    }
  }, [currentQuestionIndex, props.questions.length, props.onComplete])

  // Initialize matching when question changes
  useEffect(() => {
    initializeMatching()
  }, [initializeMatching, currentQuestionIndex])

  // =============================================================================
  // NPC INTEGRATION
  // =============================================================================

  useEffect(() => {
    // Add helpful NPCs for matching mode
    if (room && room.room_code && players.length > 0 && players.length < (room.max_players || 6)) {
      const humanPlayers = players.filter(p => !p.player_name.includes('🤖'))
      if (humanPlayers.length > 0) {
        multiplayerNPCIntegration.handleRoomEvent({
          roomId: props.roomId,
          npcId: 'puzzle_master',
          playerId: 'npc_puzzle_master',
          roomState: {
            players,
            currentQuestionIndex,
            totalQuestions: props.questions.length,
            averageScore: 0
          },
          userPerformance: {}
        }, 'player_joined').catch((error: Error) => {
          console.warn('Failed to activate puzzle master NPC:', error.message)
        })
      }
    }
  }, [room, players.length, props.roomId, currentQuestionIndex, props.questions.length])

  // =============================================================================
  // UI COMPONENTS
  // =============================================================================

  const renderMatchingHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none">
          <Puzzle className="h-4 w-4" />
          Matching Challenge
        </Badge>
        <span className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {props.questions.length}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-bold text-purple-600">
            {matchingState.personalScore} pts
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {matchingState.matchingSpeed.toFixed(1)}/min
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCollaborativeView(!showCollaborativeView)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Team View
          </Button>
        </div>
      </div>
    </div>
  )

  const renderProgressPanel = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{calculatePlayerProgress.filter(p => p.isActive).length}</div>
            <div className="text-sm text-muted-foreground">Active Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{matchingState.accuracyRate}%</div>
            <div className="text-sm text-muted-foreground">Your Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{collaborativeHints.length}</div>
            <div className="text-sm text-muted-foreground">Team Hints</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Question Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1}/{props.questions.length}
            </span>
          </div>
          <Progress value={((currentQuestionIndex + 1) / props.questions.length) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )

  const renderTeamPanel = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Team Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {calculatePlayerProgress.slice(0, 5).map((player, index) => (
            <div
              key={player.playerId}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all",
                player.isUser && "bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800",
                !player.isUser && "bg-slate-50 dark:bg-slate-900",
                index === 0 && "ring-2 ring-yellow-400"
              )}
            >
              <div className="flex items-center gap-3">
                {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {player.playerName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {player.playerName}
                    {player.isActive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Target className="h-3 w-3" />
                    {player.accuracy}% accuracy
                    <Clock className="h-3 w-3 ml-2" />
                    Speed: {player.speed}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">{player.totalScore} pts</div>
                <div className="text-xs text-muted-foreground">
                  Q{player.currentQuestion + 1}/{props.questions.length}
                </div>
              </div>
            </div>
          ))}
        </div>

        {collaborativeHints.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Team Hints
            </h4>
            <div className="space-y-2">
              {collaborativeHints.slice(-3).map((hint) => (
                <div key={hint.id} className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      {hint.playerName}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpvoteHint(hint.id)}
                      className="h-6 px-2 text-xs"
                    >
                      👍 {hint.upvotes}
                    </Button>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">{hint.hintText}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderCollaborativeFeatures = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-green-500" />
          Collaboration Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Help your team with hints</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHintInput(!showHintInput)}
            disabled={matchingState.hintsUsed >= matchingState.maxHints}
          >
            <Lightbulb className="mr-2 h-3 w-3" />
            Share Hint ({matchingState.maxHints - matchingState.hintsUsed} left)
          </Button>
        </div>

        {showHintInput && (
          <div className="space-y-2">
            <input
              type="text"
              value={hintInput}
              onChange={(e) => setHintInput(e.target.value)}
              placeholder="Share a helpful hint with your team..."
              className="w-full p-2 border rounded-md text-sm"
              maxLength={100}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCollaborativeHint} disabled={!hintInput.trim()}>
                Share Hint
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowHintInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          💡 Giving helpful hints earns you bonus points and helps your team succeed!
        </div>
      </CardContent>
    </Card>
  )

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  // Show results if quiz is completed
  if (gameCompleted) {
    const userProgress = calculatePlayerProgress.find(p => p.isUser)
    const teamAverageScore = calculatePlayerProgress.reduce((sum, p) => sum + p.totalScore, 0) / calculatePlayerProgress.length
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-purple-600">
              Matching Challenge Complete! 
            </h1>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl mx-auto mb-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {userProgress?.totalScore || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Your Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {userProgress?.accuracy || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
              
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg">
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  🧩 Puzzle Master Achievement!
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Team average: {Math.round(teamAverageScore)} points
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Collaborative bonus: +{matchingState.collaborativeBonus} points
                </div>
              </div>
              
              <Button onClick={props.onComplete} className="w-full bg-purple-600 hover:bg-purple-700">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = props.questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {renderMatchingHeader()}
        {renderProgressPanel()}
        
        {showCollaborativeView && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              {renderTeamPanel()}
            </div>
            <div>
              {renderCollaborativeFeatures()}
            </div>
          </div>
        )}
        
        {/* Alert System */}
        {matchingAlert.show && (
          <Alert className="mb-6 border-purple-200 bg-purple-50 dark:bg-purple-950/20">
            <Puzzle className="h-4 w-4" />
            <AlertDescription className="text-purple-800 dark:text-purple-200">
              {matchingAlert.message}
              {matchingAlert.bonus && (
                <span className="ml-2 font-bold">+{matchingAlert.bonus} pts</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Matching Question */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {currentQuestion && currentQuestion.matching_pairs ? (
              <MatchingQuestion
                question={currentQuestion}
                onAnswer={handleMatchingAnswer}
                showHint={matchingState.hintsUsed < matchingState.maxHints}
                disabled={false}
              />
            ) : (
              <div className="text-center py-8">
                <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading matching challenge...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 