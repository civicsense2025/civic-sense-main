"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type BaseMultiplayerEngineProps } from "./base-multiplayer-engine"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Skull, Shield, AlertTriangle, Crown, Users, Clock, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { useMultiplayerRoom, useMultiplayerQuiz } from "@/lib/multiplayer"
import { multiplayerNPCIntegration } from "@/lib/multiplayer-npc-integration"
import confetti from "canvas-confetti"

// =============================================================================
// ELIMINATION SPECIFIC TYPES
// =============================================================================

interface EliminationState {
  isPlayerEliminated: boolean
  eliminatedInRound: number | null
  survivalStreak: number
  eliminationThreshold: number
  difficultyMultiplier: number
  totalScore: number
}

interface PlayerStatus {
  playerId: string
  playerName: string
  isEliminated: boolean
  eliminatedInRound?: number
  correctAnswers: number
  survivalRounds: number
  isUser?: boolean
  isNPC?: boolean
  lives: number
  shieldActive: boolean
}

interface EliminationAlert {
  type: 'warning' | 'elimination' | 'survival' | 'final_round'
  message: string
  show: boolean
  player?: string
}

// =============================================================================
// ELIMINATION ENGINE COMPONENT
// =============================================================================

export function EliminationEngine(props: BaseMultiplayerEngineProps) {
  const config = GAME_MODE_CONFIGS.elimination
  const { room, players } = useMultiplayerRoom(props.roomId)
  const { responses, submitResponse } = useMultiplayerQuiz(props.roomId, props.playerId, props.topicId, props.questions.length)

  // Elimination specific state
  const [eliminationState, setEliminationState] = useState<EliminationState>({
    isPlayerEliminated: false,
    eliminatedInRound: null,
    survivalStreak: 0,
    eliminationThreshold: 1, // Start with 1 wrong answer = elimination
    difficultyMultiplier: 1,
    totalScore: 0
  })

  const [eliminationAlert, setEliminationAlert] = useState<EliminationAlert>({
    type: 'warning',
    message: '',
    show: false
  })

  const [showDramaticEffect, setShowDramaticEffect] = useState(false)
  const [answerLocked, setAnswerLocked] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)

  // Animation refs
  const eliminationRef = useRef<HTMLDivElement>(null)

  // =============================================================================
  // ELIMINATION LOGIC
  // =============================================================================

  const checkElimination = useCallback((isCorrect: boolean) => {
    if (eliminationState.isPlayerEliminated) return

    if (!isCorrect) {
      // Player is eliminated!
      setEliminationState(prev => ({
        ...prev,
        isPlayerEliminated: true,
        eliminatedInRound: currentQuestionIndex + 1,
        survivalStreak: 0
      }))

      // Show dramatic elimination effect
      setShowDramaticEffect(true)
      setEliminationAlert({
        type: 'elimination',
        message: 'You have been eliminated! 💀',
        show: true
      })

      // Dramatic screen shake effect
      if (eliminationRef.current) {
        eliminationRef.current.style.animation = 'shake 0.5s ease-in-out'
      }

      setTimeout(() => {
        setShowDramaticEffect(false)
        setEliminationAlert(prev => ({ ...prev, show: false }))
      }, 3000)

    } else {
      // Player survives this round
      setEliminationState(prev => ({
        ...prev,
        survivalStreak: prev.survivalStreak + 1,
        totalScore: prev.totalScore + Math.round(100 * prev.difficultyMultiplier)
      }))

      // Show survival celebration for streaks
      if (eliminationState.survivalStreak >= 3) {
        setEliminationAlert({
          type: 'survival',
          message: `🔥 ${eliminationState.survivalStreak + 1} question survival streak!`,
          show: true
        })

        setTimeout(() => {
          setEliminationAlert(prev => ({ ...prev, show: false }))
        }, 2000)
      }
    }
  }, [eliminationState.isPlayerEliminated, eliminationState.survivalStreak, eliminationState.difficultyMultiplier, currentQuestionIndex])

  // Calculate survival statistics from real player data
  const calculatePlayerStatuses = useMemo(() => {
    const playerStatuses: PlayerStatus[] = players.map(player => {
      const playerResponses = responses.filter(r => r.player_id === player.id)
      const correctAnswers = playerResponses.filter(r => r.is_correct).length
      const wrongAnswers = playerResponses.filter(r => !r.is_correct).length
      
      // In elimination mode, one wrong answer eliminates the player
      const isEliminated = wrongAnswers > 0
      const eliminatedInRound = isEliminated 
        ? playerResponses.findIndex(r => !r.is_correct) + 1 
        : undefined

      return {
        playerId: player.id,
        playerName: player.player_name,
        isEliminated,
        eliminatedInRound,
        correctAnswers,
        survivalRounds: currentQuestionIndex + 1,
        isUser: player.id === props.playerId,
        isNPC: player.player_name.includes('🤖') || player.player_name.includes('AI'),
        lives: isEliminated ? 0 : 1,
        shieldActive: false // Could be enhanced with power-ups
      }
    })

    // Sort by survival status (survivors first), then by correct answers
    return playerStatuses.sort((a, b) => {
      if (a.isEliminated !== b.isEliminated) {
        return a.isEliminated ? 1 : -1
      }
      return b.correctAnswers - a.correctAnswers
    })
  }, [players, responses, currentQuestionIndex, props.playerId])

  const calculateDifficulty = useCallback(() => {
    const survivingCount = calculatePlayerStatuses.filter(p => !p.isEliminated).length
    const totalPlayers = calculatePlayerStatuses.length
    const survivalRatio = totalPlayers > 0 ? survivingCount / totalPlayers : 1
    
    if (survivalRatio <= 0.2) return 'EXTREME' // Final 20%
    if (survivalRatio <= 0.4) return 'HARD'    // Final 40%
    if (survivalRatio <= 0.6) return 'MEDIUM'  // Final 60%
    return 'NORMAL'
  }, [calculatePlayerStatuses])

  // =============================================================================
  // ENHANCED ANSWER HANDLING WITH DATABASE INTEGRATION
  // =============================================================================

  const handleEliminationAnswer = useCallback(async (answer: string, timeSpent: number) => {
    if (answerLocked || eliminationState.isPlayerEliminated) return

    setAnswerLocked(true)
    
    const currentQuestion = props.questions[currentQuestionIndex]
    if (!currentQuestion) return

    const isCorrect = answer === currentQuestion.correct_answer

    try {
      // Submit to database using real multiplayer hook
      const attemptId = `elimination_${props.playerId}_${Date.now()}`
      await submitResponse(
        currentQuestion.question_number,
        currentQuestion.question_number.toString(),
        answer,
        isCorrect,
        timeSpent,
        attemptId
      )

      // Check for elimination
      checkElimination(isCorrect)

      // Add dramatic pause before revealing result
      setTimeout(() => {
        if (isCorrect && !eliminationState.isPlayerEliminated) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#22C55E', '#16A34A', '#15803D']
          })
        }
        setAnswerLocked(false)
        
        // Move to next question after delay
        setTimeout(() => {
          handleNextQuestion()
        }, eliminationState.isPlayerEliminated ? 2000 : 1500)
      }, 1500)

    } catch (error) {
      console.error('Failed to submit elimination answer:', error)
      setAnswerLocked(false)
    }
  }, [answerLocked, eliminationState.isPlayerEliminated, currentQuestionIndex, props.questions, props.playerId, submitResponse, checkElimination])

  // Handle next question navigation
  const handleNextQuestion = useCallback(() => {
    const isLastQuestion = currentQuestionIndex >= props.questions.length - 1
    
    if (isLastQuestion) {
      // Game completed
      setGameCompleted(true)
      props.onComplete()
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }, [currentQuestionIndex, props.questions.length, props.onComplete])

  // =============================================================================
  // NPC INTEGRATION
  // =============================================================================

  useEffect(() => {
    // Add NPCs for elimination gameplay if room has space
    if (room && room.room_code && players.length > 0 && players.length < (room.max_players || 6)) {
      const humanPlayers = players.filter(p => !p.player_name.includes('🤖'))
      if (humanPlayers.length > 0) {
        // Try to add competitive NPCs for elimination mode
        multiplayerNPCIntegration.handleRoomEvent({
          roomId: props.roomId,
          npcId: 'survivor',
          playerId: 'npc_survivor',
          roomState: {
            players,
            currentQuestionIndex,
            totalQuestions: props.questions.length,
            averageScore: 0
          },
          userPerformance: {}
        }, 'player_joined').catch((error: Error) => {
          console.warn('Failed to activate NPCs for elimination mode:', error.message)
        })
      }
    }
  }, [room, players.length, props.roomId, currentQuestionIndex, props.questions.length])

  // =============================================================================
  // UI COMPONENTS
  // =============================================================================

  const renderEliminationHeader = () => (
    <div className="flex items-center justify-between mb-6 relative">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white border-none">
          <Trophy className="h-4 w-4" />
          Elimination
        </Badge>
        <span className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {props.questions.length}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-bold text-red-600">
            {calculatePlayerStatuses.filter(p => !p.isEliminated).length} Survivors
          </div>
          <div className="text-xs text-muted-foreground">
            Difficulty: {calculateDifficulty()}
          </div>
        </div>
        
        {!eliminationState.isPlayerEliminated && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-950/20 rounded-full">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Alive
            </span>
          </div>
        )}
        
        {eliminationState.isPlayerEliminated && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-950/20 rounded-full">
            <Skull className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Eliminated
            </span>
          </div>
        )}
      </div>
    </div>
  )

  const renderSurvivorsPanel = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Survivors ({calculatePlayerStatuses.filter(p => !p.isEliminated).length})
          </h3>
          <div className="text-xs text-muted-foreground">
            {calculatePlayerStatuses.filter(p => p.isEliminated).length} eliminated
          </div>
        </div>
        
        <div className="space-y-2">
          {calculatePlayerStatuses.filter(p => !p.isEliminated).map((survivor, index) => (
            <div
              key={survivor.playerId}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-all",
                survivor.isUser && "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800",
                !survivor.isUser && "bg-slate-50 dark:bg-slate-900",
                index === 0 && "ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
              )}
            >
              <div className="flex items-center gap-3">
                {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {survivor.playerName}
                    {survivor.isNPC && <span className="text-xs">🤖</span>}
                    {survivor.shieldActive && <Shield className="h-3 w-3 text-blue-500" />}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {survivor.correctAnswers} correct • Round {survivor.survivalRounds}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {survivor.lives && survivor.lives > 0 && (
                  <div className="flex gap-1">
                    {Array.from({ length: survivor.lives }).map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-red-500 rounded-full"></div>
                    ))}
                  </div>
                )}
                <div className="text-xs font-bold text-green-600">
                  ALIVE
                </div>
              </div>
            </div>
          ))}
        </div>

        {calculatePlayerStatuses.filter(p => p.isEliminated).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Skull className="h-3 w-3" />
              Recently Eliminated
            </h4>
            <div className="space-y-1">
              {calculatePlayerStatuses.filter(p => p.isEliminated).slice(0, 3).map((eliminated) => (
                <div key={eliminated.playerId} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{eliminated.playerName} {eliminated.isNPC && '🤖'}</span>
                  <span>Round {eliminated.eliminatedInRound}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Check for final round
  useEffect(() => {
    const survivorsCount = calculatePlayerStatuses.filter(p => !p.isEliminated).length
    if (survivorsCount <= 2 && survivorsCount > 0 && !eliminationState.isPlayerEliminated) {
      setEliminationAlert({
        type: 'final_round',
        message: '🏆 FINAL ROUND! Last players standing!',
        show: true
      })

      setTimeout(() => {
        setEliminationAlert(prev => ({ ...prev, show: false }))
      }, 3000)
    }
  }, [calculatePlayerStatuses, eliminationState.isPlayerEliminated])

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  // Show results if quiz is completed
  if (gameCompleted) {
    const userStatus = calculatePlayerStatuses.find(p => p.isUser)
    const survivorsCount = calculatePlayerStatuses.filter(p => !p.isEliminated).length
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-red-600">
              {userStatus?.isEliminated ? 'Eliminated!' : 'Survived!'} 
            </h1>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl mx-auto mb-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className={cn(
                    "text-3xl font-bold",
                    userStatus?.isEliminated ? "text-red-600" : "text-green-600"
                  )}>
                    {userStatus?.isEliminated ? '💀' : '🏆'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {userStatus?.isEliminated ? 'Eliminated' : 'Survivor'}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {userStatus?.correctAnswers || 0}/{currentQuestionIndex + 1}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </div>
              </div>
              
              {userStatus?.isEliminated && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-950/20 rounded-lg">
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">
                    Eliminated in Round {userStatus.eliminatedInRound}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    You survived {eliminationState.survivalStreak} questions!
                  </div>
                </div>
              )}

              {!userStatus?.isEliminated && (
                <div className="mb-4 p-4 bg-green-100 dark:bg-green-950/20 rounded-lg">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    🎉 You're one of {survivorsCount} survivors!
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Perfect survival with {eliminationState.survivalStreak} correct answers!
                  </div>
                </div>
              )}
              
              <Button onClick={props.onComplete} className="w-full bg-red-600 hover:bg-red-700">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen transition-all duration-500",
      eliminationState.isPlayerEliminated 
        ? "bg-gradient-to-br from-red-100 via-red-50 to-orange-50 dark:from-red-950 dark:via-slate-900 dark:to-slate-800"
        : "bg-gradient-to-br from-slate-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800",
      showDramaticEffect && "animate-pulse"
    )}>
      <div className="container mx-auto px-4 py-8">
        {renderEliminationHeader()}
        {renderSurvivorsPanel()}
        
        <div className="mb-8">
          <Progress 
            value={((currentQuestionIndex) + 1) / props.questions.length * 100} 
            className={cn(
              "h-3",
              eliminationState.isPlayerEliminated && "opacity-50"
            )}
          />
        </div>

        {/* Elimination Alert */}
        {eliminationAlert.show && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
            <Alert className={cn(
              "shadow-lg animate-in slide-in-from-top-2 duration-300",
              eliminationAlert.type === 'elimination' && "border-red-500 bg-red-50 dark:bg-red-950/20",
              eliminationAlert.type === 'survival' && "border-green-500 bg-green-50 dark:bg-green-950/20",
              eliminationAlert.type === 'final_round' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
            )}>
              <AlertDescription className="font-medium text-center">
                {eliminationAlert.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Use BaseMultiplayerEngine with elimination modifications */}
        <div ref={eliminationRef}>
          {/* Elimination Warning */}
          {!eliminationState.isPlayerEliminated && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                <strong>Warning:</strong> One wrong answer and you're eliminated! Choose carefully.
              </AlertDescription>
            </Alert>
          )}

          <BaseMultiplayerEngine
            {...props}
            config={{
              ...config,
              onAnswerSubmit: handleEliminationAnswer
            } as any}
          />

          {/* Elimination overlay */}
          {eliminationState.isPlayerEliminated && (
            <div className="fixed inset-0 bg-red-900/50 flex items-center justify-center z-50 animate-in fade-in duration-500">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-2xl text-center max-w-md mx-4">
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">ELIMINATED!</h2>
                <p className="text-muted-foreground mb-4">
                  You answered incorrectly and have been eliminated from the competition.
                </p>
                <p className="text-sm text-muted-foreground">
                  You survived {eliminationState.survivalStreak} questions. Watch the remaining players battle it out!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Elimination tips */}
        {!eliminationState.isPlayerEliminated && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-950/20 rounded-full text-sm text-red-700 dark:text-red-300">
              <Target className="h-4 w-4" />
              High stakes! One wrong answer eliminates you. Think carefully before choosing.
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 