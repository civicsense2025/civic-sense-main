"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type MultiplayerGameState, type BaseMultiplayerEngineProps } from "./base-multiplayer-engine"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Skull, Shield, AlertTriangle, Crown, Users, Clock, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { useMultiplayerRoom } from "@/lib/multiplayer"
import confetti from "canvas-confetti"

// =============================================================================
// ELIMINATION SPECIFIC TYPES
// =============================================================================

interface EliminationState extends Omit<MultiplayerGameState, 'eliminatedPlayers'> {
  survivingPlayers: SurvivingPlayer[]
  eliminatedPlayers: EliminatedPlayer[]
  currentRound: number
  totalRounds: number
  eliminationThreshold: number
  lastEliminationRound: number
  survivalStreak: number
  isPlayerEliminated: boolean
  difficultyMultiplier: number
}

interface SurvivingPlayer {
  playerId: string
  playerName: string
  correctAnswers: number
  survivalRounds: number
  isUser?: boolean
  lives?: number
  shieldActive?: boolean
}

interface EliminatedPlayer {
  playerId: string
  playerName: string
  eliminatedInRound: number
  finalScore: number
  survivalTime: number
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

  // Elimination specific state
  const [eliminationState, setEliminationState] = useState<EliminationState>({
    ...({} as MultiplayerGameState),
    survivingPlayers: [],
    eliminatedPlayers: [],
    currentRound: 1,
    totalRounds: Math.ceil(props.questions.length / 3), // Group questions into rounds
    eliminationThreshold: 1, // Start with 1 wrong answer = elimination
    lastEliminationRound: 0,
    survivalStreak: 0,
    isPlayerEliminated: false,
    difficultyMultiplier: 1
  })

  const [eliminationAlert, setEliminationAlert] = useState<EliminationAlert>({
    type: 'warning',
    message: '',
    show: false
  })

  const [showDramaticEffect, setShowDramaticEffect] = useState(false)
  const [answerLocked, setAnswerLocked] = useState(false)
  const [roundTransition, setRoundTransition] = useState(false)

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
        survivalStreak: prev.survivalStreak + 1
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
  }, [eliminationState.isPlayerEliminated, eliminationState.survivalStreak])

  const calculateDifficulty = useCallback(() => {
    // Difficulty increases as fewer players remain
    const survivingCount = eliminationState.survivingPlayers.length
    const totalPlayers = survivingCount + eliminationState.eliminatedPlayers.length
    const survivalRatio = survivingCount / Math.max(totalPlayers, 1)
    
    if (survivalRatio <= 0.2) return 'EXTREME' // Final 20%
    if (survivalRatio <= 0.4) return 'HARD'    // Final 40%
    if (survivalRatio <= 0.6) return 'MEDIUM'  // Final 60%
    return 'NORMAL'
  }, [eliminationState.survivingPlayers.length, eliminationState.eliminatedPlayers.length])

  const updateSurvivors = useCallback(() => {
    // Mock survivor data - in real implementation, this would come from real-time updates
    const mockSurvivors: SurvivingPlayer[] = [
      {
        playerId: props.playerId,
        playerName: 'You',
        correctAnswers: eliminationState.userAnswers?.filter(a => a.isCorrect).length || 0,
        survivalRounds: eliminationState.currentRound,
        isUser: true,
        lives: eliminationState.isPlayerEliminated ? 0 : 1,
        shieldActive: false
      },
      {
        playerId: 'survivor1',
        playerName: 'The Survivor 🛡️',
        correctAnswers: Math.floor(Math.random() * 8) + 4,
        survivalRounds: eliminationState.currentRound,
        lives: 1
      },
      {
        playerId: 'survivor2',
        playerName: 'Last Stand 💪',
        correctAnswers: Math.floor(Math.random() * 7) + 3,
        survivalRounds: eliminationState.currentRound,
        lives: 1
      }
    ].filter(player => {
      if (player.isUser) return !eliminationState.isPlayerEliminated
      return Math.random() > 0.1 // 10% chance NPCs get eliminated each update
    })

    // Mock eliminated players
    const mockEliminated: EliminatedPlayer[] = [
      {
        playerId: 'eliminated1',
        playerName: 'Quiz Veteran 😵',
        eliminatedInRound: Math.floor(Math.random() * eliminationState.currentRound) + 1,
        finalScore: Math.floor(Math.random() * 100) + 50,
        survivalTime: Math.floor(Math.random() * 300) + 120
      }
    ]

    setEliminationState(prev => ({
      ...prev,
      survivingPlayers: mockSurvivors,
      eliminatedPlayers: mockEliminated
    }))
  }, [props.playerId, eliminationState.currentRound, eliminationState.isPlayerEliminated, eliminationState.userAnswers])

  // Update survivors periodically
  useEffect(() => {
    const interval = setInterval(updateSurvivors, 3000)
    return () => clearInterval(interval)
  }, [updateSurvivors])

  // =============================================================================
  // ENHANCED ANSWER HANDLING
  // =============================================================================

  const handleEliminationAnswer = useCallback(async (answer: string, isCorrect: boolean) => {
    if (answerLocked || eliminationState.isPlayerEliminated) return

    setAnswerLocked(true)
    
    // Check for elimination
    checkElimination(isCorrect)

    // Add dramatic pause before revealing result
    setTimeout(() => {
      if (isCorrect) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#22C55E', '#16A34A', '#15803D']
        })
      }
      setAnswerLocked(false)
    }, 1500)

  }, [answerLocked, eliminationState.isPlayerEliminated, checkElimination])

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
          Round {eliminationState.currentRound} of {eliminationState.totalRounds}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-bold text-red-600">
            {eliminationState.survivingPlayers.length} Survivors
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
            Survivors ({eliminationState.survivingPlayers.length})
          </h3>
          <div className="text-xs text-muted-foreground">
            {eliminationState.eliminatedPlayers.length} eliminated
          </div>
        </div>
        
        <div className="space-y-2">
          {eliminationState.survivingPlayers.map((survivor, index) => (
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

        {eliminationState.eliminatedPlayers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Skull className="h-3 w-3" />
              Recently Eliminated
            </h4>
            <div className="space-y-1">
              {eliminationState.eliminatedPlayers.slice(0, 3).map((eliminated) => (
                <div key={eliminated.playerId} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{eliminated.playerName}</span>
                  <span>Round {eliminated.eliminatedInRound}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderEliminationQuestion = () => {
    const currentQuestion = props.questions[eliminationState.currentQuestionIndex || 0]
    if (!currentQuestion) return null

    return (
      <div className="space-y-6" ref={eliminationRef}>
        {/* Elimination Warning */}
        {!eliminationState.isPlayerEliminated && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              <strong>Warning:</strong> One wrong answer and you're eliminated! Choose carefully.
            </AlertDescription>
          </Alert>
        )}

        <h1 className={cn(
          "text-2xl sm:text-3xl font-light leading-tight tracking-tight max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300",
          eliminationState.isPlayerEliminated ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
        )}>
          <GlossaryLinkText text={currentQuestion.question} />
        </h1>

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

        {/* Question options - disabled if eliminated */}
        {currentQuestion.question_type === 'multiple_choice' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              currentQuestion.option_a,
              currentQuestion.option_b,
              currentQuestion.option_c,
              currentQuestion.option_d
            ].filter((option): option is string => Boolean(option)).map((option, index) => (
              <Button
                key={index}
                variant="outline"
                disabled={eliminationState.isPlayerEliminated || answerLocked}
                className={cn(
                  "w-full text-left justify-start p-6 h-auto transition-all duration-200",
                  !eliminationState.isPlayerEliminated && !answerLocked && "hover:scale-[1.02] hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
                  eliminationState.isPlayerEliminated && "opacity-50 cursor-not-allowed",
                  answerLocked && "opacity-75"
                )}
                onClick={() => {
                  if (!eliminationState.isPlayerEliminated && !answerLocked) {
                    const isCorrect = option === currentQuestion.correct_answer
                    handleEliminationAnswer(option, isCorrect)
                  }
                }}
              >
                <span className={cn(
                  "font-bold mr-3",
                  eliminationState.isPlayerEliminated ? "text-red-400" : "text-red-600"
                )}>
                  {String.fromCharCode(65 + index)}.
                </span>
                <GlossaryLinkText text={option} />
              </Button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Check for final round
  useEffect(() => {
    if (eliminationState.survivingPlayers.length <= 2 && eliminationState.survivingPlayers.length > 0) {
      setEliminationAlert({
        type: 'final_round',
        message: '🏆 FINAL ROUND! Last players standing!',
        show: true
      })

      setTimeout(() => {
        setEliminationAlert(prev => ({ ...prev, show: false }))
      }, 3000)
    }
  }, [eliminationState.survivingPlayers.length])

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

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
            value={((eliminationState.currentQuestionIndex || 0) + 1) / props.questions.length * 100} 
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

        {renderEliminationQuestion()}

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