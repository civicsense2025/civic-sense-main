"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type MultiplayerGameState, type BaseMultiplayerEngineProps } from "./base-multiplayer-engine"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Trophy, Clock, TrendingUp, Target, Users, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { useMultiplayerRoom } from "@/lib/multiplayer"
import confetti from "canvas-confetti"

// =============================================================================
// SPEED ROUND SPECIFIC TYPES
// =============================================================================

interface SpeedRoundState extends MultiplayerGameState {
  speedBonus: number
  consecutiveCorrect: number
  leaderboard: LeaderboardEntry[]
  lastAnswerSpeed: number | null
  comboMultiplier: number
  pressureLevel: 'low' | 'medium' | 'high' | 'extreme'
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
}

interface SpeedBonusDisplay {
  points: number
  multiplier: number
  reason: string
  show: boolean
}

// =============================================================================
// SPEED ROUND ENGINE COMPONENT
// =============================================================================

export function SpeedRoundEngine(props: BaseMultiplayerEngineProps) {
  const config = GAME_MODE_CONFIGS.speed_round
  const { room, players } = useMultiplayerRoom(props.roomId)

  // Speed Round specific state
  const [speedState, setSpeedState] = useState<SpeedRoundState>({
    ...({} as MultiplayerGameState),
    speedBonus: 0,
    consecutiveCorrect: 0,
    leaderboard: [],
    lastAnswerSpeed: null,
    comboMultiplier: 1,
    pressureLevel: 'low'
  })

  const [speedBonusDisplay, setSpeedBonusDisplay] = useState<SpeedBonusDisplay>({
    points: 0,
    multiplier: 1,
    reason: '',
    show: false
  })

  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [pulseEffect, setPulseEffect] = useState(false)
  const [answerStartTime, setAnswerStartTime] = useState<number>(Date.now())

  // Animation refs
  const leaderboardRef = useRef<HTMLDivElement>(null)

  // =============================================================================
  // SPEED ROUND CALCULATIONS
  // =============================================================================

  const calculateSpeedBonus = useCallback((timeSpent: number, isCorrect: boolean) => {
    if (!isCorrect) return { bonus: 0, multiplier: 1, reason: '' }

    const timeLimit = config.timePerQuestion
    const speedRatio = (timeLimit - timeSpent) / timeLimit

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
    const ratio = timeLeft / config.timePerQuestion
    if (ratio > 0.7) return 'low'
    if (ratio > 0.4) return 'medium'
    if (ratio > 0.2) return 'high'
    return 'extreme'
  }, [config.timePerQuestion])

  // =============================================================================
  // ENHANCED ANSWER HANDLING
  // =============================================================================

  const handleSpeedAnswer = useCallback(async (answer: string, isCorrect: boolean) => {
    const timeSpent = Math.max(1, (Date.now() - answerStartTime) / 1000)
    const speedBonusData = calculateSpeedBonus(timeSpent, isCorrect)

    // Update speed state
    setSpeedState(prev => ({
      ...prev,
      speedBonus: prev.speedBonus + speedBonusData.bonus,
      consecutiveCorrect: isCorrect ? prev.consecutiveCorrect + 1 : 0,
      lastAnswerSpeed: timeSpent,
      comboMultiplier: speedBonusData.multiplier
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

  }, [answerStartTime, calculateSpeedBonus])

  // =============================================================================
  // REAL-TIME LEADERBOARD
  // =============================================================================

  const updateLeaderboard = useCallback(() => {
    // Mock leaderboard data - in real implementation, this would come from real-time updates
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        playerId: props.playerId,
        playerName: 'You',
        score: speedState.speedBonus + (speedState.userAnswers?.filter(a => a.isCorrect).length || 0) * 10,
        correctAnswers: speedState.userAnswers?.filter(a => a.isCorrect).length || 0,
        averageSpeed: speedState.lastAnswerSpeed || 0,
        currentStreak: speedState.consecutiveCorrect,
        rank: 1,
        isUser: true
      },
      {
        playerId: 'npc1',
        playerName: 'Speed Demon 🔥',
        score: Math.floor(Math.random() * 200) + 150,
        correctAnswers: Math.floor(Math.random() * 8) + 5,
        averageSpeed: Math.random() * 10 + 3,
        currentStreak: Math.floor(Math.random() * 5),
        rank: 2
      },
      {
        playerId: 'npc2',
        playerName: 'Quiz Master ⚡',
        score: Math.floor(Math.random() * 180) + 120,
        correctAnswers: Math.floor(Math.random() * 7) + 4,
        averageSpeed: Math.random() * 12 + 4,
        currentStreak: Math.floor(Math.random() * 3),
        rank: 3
      }
    ].sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, rank: index + 1 }))

    setSpeedState(prev => ({ ...prev, leaderboard: mockLeaderboard }))
  }, [props.playerId, speedState.speedBonus, speedState.userAnswers, speedState.consecutiveCorrect, speedState.lastAnswerSpeed])

  // Update leaderboard periodically
  useEffect(() => {
    const interval = setInterval(updateLeaderboard, 2000)
    return () => clearInterval(interval)
  }, [updateLeaderboard])

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
          Question {speedState.currentQuestionIndex + 1} of {props.questions.length}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-bold text-orange-600">
            {speedState.speedBonus + (speedState.userAnswers?.filter(a => a.isCorrect).length || 0) * 10} pts
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
            {speedState.leaderboard.slice(0, 5).map((entry, index) => (
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
                    <div className="font-medium text-sm">{entry.playerName}</div>
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

  const renderSpeedQuestion = () => {
    const currentQuestion = props.questions[speedState.currentQuestionIndex || 0]
    if (!currentQuestion) return null

    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white leading-tight tracking-tight max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <GlossaryLinkText text={currentQuestion.question} />
        </h1>

        {/* Speed Round specific question rendering */}
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
                className={cn(
                  "w-full text-left justify-start p-6 h-auto transition-all duration-200 hover:scale-[1.02]",
                  "border-2 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                )}
                onClick={() => {
                  const isCorrect = option === currentQuestion.correct_answer
                  handleSpeedAnswer(option, isCorrect)
                }}
              >
                <span className="font-bold mr-3 text-orange-600">
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

  // Track question start time
  useEffect(() => {
    setAnswerStartTime(Date.now())
  }, [speedState.currentQuestionIndex])

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {renderSpeedHeader()}
        {renderLeaderboard()}
        
        <div className="mb-8">
          <Progress 
            value={((speedState.currentQuestionIndex || 0) + 1) / props.questions.length * 100} 
            className="h-3"
          />
        </div>

        {renderSpeedQuestion()}

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