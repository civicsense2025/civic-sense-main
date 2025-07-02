"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type BaseMultiplayerEngineProps } from "./base-multiplayer-engine"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Card, CardContent } from "../ui/card"
import { Zap, Trophy, Clock, TrendingUp, Target, Users, Crown } from "lucide-react"
import { cn } from "../../utils"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { useMultiplayerRoom, useMultiplayerQuiz } from "@civicsense/shared/lib/multiplayer"
import { multiplayerNPCIntegration } from "@civicsense/shared/lib/multiplayer-npc-integration"
import confetti from "canvas-confetti"

// =============================================================================
// SPEED ROUND SPECIFIC TYPES
// =============================================================================

interface SpeedRoundState {
  speedBonus: number
  consecutiveCorrect: number
  lastAnswerSpeed: number | null
  comboMultiplier: number
  pressureLevel: 'low' | 'medium' | 'high' | 'extreme'
  totalScore: number
}

interface SpeedBonusDisplay {
  points: number
  multiplier: number
  reason: string
  show: boolean
}

interface LeaderboardEntry {
  playerId: string
  playerName: string
  score: number
  correctAnswers: number
  averageSpeed: number
  currentStreak: number
  rank: number
  isUser?: boolean
  isNPC?: boolean
}

// =============================================================================
// SPEED ROUND ENGINE COMPONENT
// =============================================================================

export function SpeedRoundEngine(props: BaseMultiplayerEngineProps) {
  const config = GAME_MODE_CONFIGS.speed_round
  const { room, players } = useMultiplayerRoom(props.roomId)
  const { responses, submitResponse } = useMultiplayerQuiz(props.roomId, props.playerId, props.topicId, props.questions.length)

  // Speed Round specific state
  const [speedState, setSpeedState] = useState<SpeedRoundState>({
    speedBonus: 0,
    consecutiveCorrect: 0,
    lastAnswerSpeed: null,
    comboMultiplier: 1,
    pressureLevel: 'low',
    totalScore: 0
  })

  const [speedBonusDisplay, setSpeedBonusDisplay] = useState<SpeedBonusDisplay>({
    points: 0,
    multiplier: 1,
    reason: '',
    show: false
  })

  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [pulseEffect, setPulseEffect] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)

  // Animation refs
  const leaderboardRef = useRef<HTMLDivElement>(null)

  // =============================================================================
  // SPEED ROUND CALCULATIONS
  // =============================================================================

  const calculateSpeedBonus = useCallback((timeSpent: number, isCorrect: boolean) => {
    if (!isCorrect) return { bonus: 0, multiplier: 1, reason: '' }

    const timeLimit = config.timePerQuestion / 1000
    let bonus = 0
    let multiplier = 1
    let reason = ''

    // Lightning fast (0-3 seconds)
    if (timeSpent <= 3) {
      bonus = 50
      multiplier = 3
      reason = 'Lightning Fast! ⚡'
    }
    // Very fast (3-6 seconds)
    else if (timeSpent <= 6) {
      bonus = 30
      multiplier = 2.5
      reason = 'Very Fast! 🚀'
    }
    // Fast (6-10 seconds)
    else if (timeSpent <= 10) {
      bonus = 20
      multiplier = 2
      reason = 'Fast! 💨'
    }
    // Quick (10-15 seconds)
    else if (timeSpent <= 15) {
      bonus = 10
      multiplier = 1.5
      reason = 'Quick! ⏰'
    }

    // Combo multiplier for consecutive correct answers
    if (speedState.consecutiveCorrect >= 2) {
      const comboBonus = Math.min(speedState.consecutiveCorrect * 5, 25)
      bonus += comboBonus
      multiplier += 0.2 * Math.min(speedState.consecutiveCorrect, 5)
      reason += ` ${speedState.consecutiveCorrect}x Combo!`
    }

    return { bonus, multiplier, reason }
  }, [config.timePerQuestion, speedState.consecutiveCorrect])

  const calculatePressureLevel = useCallback((timeLeft: number) => {
    const ratio = timeLeft / (config.timePerQuestion / 1000)
    if (ratio > 0.7) return 'low'
    if (ratio > 0.4) return 'medium'
    if (ratio > 0.2) return 'high'
    return 'extreme'
  }, [config.timePerQuestion])

  // =============================================================================
  // REAL-TIME LEADERBOARD CALCULATION
  // =============================================================================

  const calculateLeaderboard = useMemo(() => {
    // Get current user's data
    const userResponses = responses.filter(r => r.player_id === props.playerId)
    const userCorrect = userResponses.filter(r => r.is_correct).length
    const userAvgTime = userResponses.length > 0 
              ? userResponses.reduce((sum, r) => sum + (r.response_time_ms || 0) / 1000, 0) / userResponses.length 
      : 0

    // Create leaderboard entries from actual players
    const leaderboard: LeaderboardEntry[] = players.map(player => {
      const playerResponses = responses.filter(r => r.player_id === player.id)
      const correctAnswers = playerResponses.filter(r => r.is_correct).length
      const avgTime = playerResponses.length > 0 
        ? playerResponses.reduce((sum, r) => sum + (r.response_time_ms || 0) / 1000, 0) / playerResponses.length 
        : 0
      
      // Calculate speed score: correct answers * 100 + speed bonus
      let score = correctAnswers * 100
      playerResponses.forEach(response => {
        if (response.is_correct) {
          const timeBonus = Math.max(0, (config.timePerQuestion / 1000) - ((response.response_time_ms || 0) / 1000)) * 2
          score += Math.round(timeBonus)
        }
      })

      // Calculate current streak
      let currentStreak = 0
      for (let i = playerResponses.length - 1; i >= 0; i--) {
        if (playerResponses[i].is_correct) {
          currentStreak++
        } else {
          break
        }
      }

      return {
        playerId: player.id,
        playerName: player.player_name,
        score,
        correctAnswers,
        averageSpeed: avgTime,
        currentStreak,
        rank: 0, // Will be set after sorting
        isUser: player.id === props.playerId,
        isNPC: player.player_name.includes('🤖') || player.player_name.includes('AI')
      }
    })

    // Sort by score and assign ranks
    leaderboard.sort((a, b) => b.score - a.score)
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return leaderboard
  }, [players, responses, props.playerId, config.timePerQuestion])

  // =============================================================================
  // ENHANCED ANSWER HANDLING WITH DATABASE INTEGRATION
  // =============================================================================

  const handleSpeedAnswer = useCallback(async (answer: string, timeSpent: number) => {
    const currentQuestion = props.questions[currentQuestionIndex]
    if (!currentQuestion) return

    const isCorrect = answer === currentQuestion.correct_answer
    const speedBonusData = calculateSpeedBonus(timeSpent, isCorrect)

    try {
      // Submit to database using real multiplayer hook
      const attemptId = `speed_${props.playerId}_${Date.now()}`
      await submitResponse(
        currentQuestion.question_number,
        currentQuestion.question_number.toString(),
        answer,
        isCorrect,
        timeSpent,
        attemptId
      )

      // Update speed state
      setSpeedState(prev => ({
        ...prev,
        speedBonus: prev.speedBonus + speedBonusData.bonus,
        consecutiveCorrect: isCorrect ? prev.consecutiveCorrect + 1 : 0,
        lastAnswerSpeed: timeSpent,
        comboMultiplier: speedBonusData.multiplier,
        totalScore: prev.totalScore + (isCorrect ? 100 : 0) + speedBonusData.bonus
      }))

      // Show speed bonus animation
      if (isCorrect && speedBonusData.bonus > 0) {
        setSpeedBonusDisplay({
          points: speedBonusData.bonus,
          multiplier: speedBonusData.multiplier,
          reason: speedBonusData.reason,
          show: true
        })

        // Trigger confetti for great performances
        if (timeSpent <= 3) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6347']
          })
        }

        // Hide bonus display after animation
        setTimeout(() => {
          setSpeedBonusDisplay(prev => ({ ...prev, show: false }))
        }, 2500)
      }

      // Pulse effect for any answer
      setPulseEffect(true)
      setTimeout(() => setPulseEffect(false), 300)

      // Move to next question automatically after a short delay
      setTimeout(() => {
        handleNextQuestion()
      }, 1500)

    } catch (error) {
      console.error('Failed to submit speed round answer:', error)
    }
  }, [currentQuestionIndex, props.questions, props.playerId, calculateSpeedBonus, submitResponse])

  // Handle next question navigation
  const handleNextQuestion = useCallback(() => {
    const isLastQuestion = currentQuestionIndex >= props.questions.length - 1
    
    if (isLastQuestion) {
      // Quiz completed
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
    // Add NPCs for competitive gameplay if room has space
    if (room && room.room_code && players.length > 0 && players.length < (room.max_players || 6)) {
      // Only add NPCs if there are human players and room for more
      const humanPlayers = players.filter(p => !p.player_name.includes('🤖'))
      if (humanPlayers.length > 0) {
        // Try to add a competitive NPC
        multiplayerNPCIntegration.handleRoomEvent({
          roomId: props.roomId,
          npcId: 'speed_demon',
          playerId: 'npc_speed_demon',
          roomState: {
            players,
            currentQuestionIndex,
            totalQuestions: props.questions.length,
            averageScore: 0
          },
          userPerformance: {}
        }, 'player_joined').catch((error: Error) => {
          console.warn('Failed to activate NPCs for speed round:', error.message)
        })
      }
    }
  }, [room, players.length, props.roomId, currentQuestionIndex, props.questions.length])

  // =============================================================================
  // ENHANCED UI COMPONENTS
  // =============================================================================

  const renderSpeedHeader = () => (
    <div className="flex items-center justify-between mb-6 relative">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-none">
          <Zap className="h-4 w-4" />
          Speed Round
        </Badge>
        <span className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {props.questions.length}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-bold text-orange-600">
            {speedState.totalScore} pts
          </div>
          {speedState.consecutiveCorrect > 0 && (
            <div className="text-xs text-orange-500">
              {speedState.consecutiveCorrect}x streak!
            </div>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-2 text-sm px-3 py-1 rounded-full transition-all",
          speedState.pressureLevel === 'extreme' && "bg-red-100 text-red-700 animate-pulse",
          speedState.pressureLevel === 'high' && "bg-orange-100 text-orange-700",
          speedState.pressureLevel === 'medium' && "bg-yellow-100 text-yellow-700",
          speedState.pressureLevel === 'low' && "bg-green-100 text-green-700"
        )}>
          <Clock className="h-4 w-4" />
          Pressure: {speedState.pressureLevel.toUpperCase()}
        </div>
      </div>

      {/* Speed Bonus Display */}
      {speedBonusDisplay.show && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
            <div className="text-center">
              <div className="font-bold">+{speedBonusDisplay.points} pts!</div>
              <div className="text-xs">{speedBonusDisplay.reason}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderLeaderboard = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Live Leaderboard
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            {showLeaderboard ? 'Hide' : 'Show'}
          </Button>
        </div>
        
        {showLeaderboard && (
          <div ref={leaderboardRef} className="space-y-2">
            {calculateLeaderboard.slice(0, 5).map((entry, index) => (
              <div
                key={entry.playerId}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg transition-all",
                  entry.isUser && "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800",
                  !entry.isUser && "bg-slate-50 dark:bg-slate-900",
                  pulseEffect && entry.isUser && "animate-pulse"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 && "bg-yellow-500 text-white",
                    index === 1 && "bg-gray-400 text-white",
                    index === 2 && "bg-orange-500 text-white",
                    index > 2 && "bg-slate-300 text-slate-700"
                  )}>
                    {index === 0 ? <Crown className="h-3 w-3" /> : entry.rank}
                  </div>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1">
                      {entry.playerName}
                      {entry.isNPC && <span className="text-xs">🤖</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.correctAnswers} correct • {entry.averageSpeed.toFixed(1)}s avg
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{entry.score}</div>
                  {entry.currentStreak > 0 && (
                    <div className="text-xs text-orange-500">
                      🔥 {entry.currentStreak}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  // Show results if quiz is completed
  if (gameCompleted) {
    const userLeaderboardEntry = calculateLeaderboard.find(entry => entry.isUser)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-orange-600">Speed Round Complete! ⚡</h1>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-2xl mx-auto mb-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {speedState.totalScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {userLeaderboardEntry?.correctAnswers || 0}/{props.questions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </div>
              </div>
              
              {speedState.consecutiveCorrect > 2 && (
                <div className="mb-4 p-4 bg-orange-100 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    🔥 Best Streak: {speedState.consecutiveCorrect} questions!
                  </div>
                </div>
              )}

              {userLeaderboardEntry && (
                <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-950/20 rounded-lg">
                  <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                    🏆 Final Rank: #{userLeaderboardEntry.rank} of {calculateLeaderboard.length}
                  </div>
                </div>
              )}
              
              <Button onClick={props.onComplete} className="w-full bg-orange-600 hover:bg-orange-700">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Return the enhanced BaseMultiplayerEngine with speed round customizations
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {renderSpeedHeader()}
        {renderLeaderboard()}
        
        <div className="mb-8">
          <Progress 
            value={((currentQuestionIndex) + 1) / props.questions.length * 100} 
            className="h-3"
          />
        </div>

        {/* Use BaseMultiplayerEngine as the foundation */}
        <BaseMultiplayerEngine
          {...props}
          config={config}
        />

        {/* Speed tips */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-950/20 rounded-full text-sm text-orange-700 dark:text-orange-300">
            <TrendingUp className="h-4 w-4" />
            Answer quickly for bonus points! Consecutive correct answers build your combo multiplier.
          </div>
        </div>
      </div>
    </div>
  )
} 