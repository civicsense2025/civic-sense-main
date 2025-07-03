"use client"

import { useState, useEffect, useRef } from "react"
import { NPCPersonality } from '@/lib/multiplayer/operations-npcs'
import { Card } from "../ui/card"
import { BattlePlayerPanel } from "@/components/multiplayer/battle-player-panel"
import { QuizQuestion } from '@civicsense/shared/types/quiz'
// import useUIStrings from '@civicsense/shared/useUIStrings' // Temporarily use static strings

// Temporary static strings for build fix
const uiStrings = {
  multiplayer: {
    getReady: "Get Ready!",
    gameStartingSoon: "Game Starting Soon",
    getReadyFirstQuestion: "Get ready for the first question",
    firstQuestionLoading: "First question loading",
    battleStarting: "Battle Starting"
  }
}

// Updated interface to match props from base-multiplayer-engine
export interface CountdownPhaseProps {
  currentQuestion: QuizQuestion | undefined
  countdown: number
}

// Legacy interface for NPC battles (keep for backward compatibility)
export interface NPCCountdownPhaseProps {
  opponent: NPCPersonality
  onComplete: () => void
}

export function CountdownPhase({ currentQuestion, countdown }: CountdownPhaseProps) {
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">{uiStrings.multiplayer.gameStartingSoon}!</h2>
          {currentQuestion && (
            <p className="text-xl text-muted-foreground">
              {uiStrings.multiplayer.getReadyFirstQuestion}...
            </p>
          )}
        </div>

        <div className="text-7xl font-bold animate-pulse text-center">
          {countdown > 0 ? countdown : "GO!"}
        </div>

        {currentQuestion && countdown <= 0 && (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              {uiStrings.multiplayer.firstQuestionLoading}...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Legacy component for NPC battles
export function NPCCountdownPhase({ opponent, onComplete }: NPCCountdownPhaseProps) {
  const [countdown, setCountdown] = useState(3)
  const hasCompleted = useRef(false)

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Separate effect to handle completion
  useEffect(() => {
    if (countdown === 0 && !hasCompleted.current) {
      hasCompleted.current = true
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        onComplete()
      }, 0)
    }
  }, [countdown, onComplete])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <BattlePlayerPanel
          name="You"
          score={0}
          emoji="👤"
        />
        <div className="text-2xl font-bold">VS</div>
        <BattlePlayerPanel
          name={opponent.name}
          score={0}
          emoji={opponent.emoji}
          isNPC
        />
      </div>

      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">{uiStrings.multiplayer.battleStarting}</h2>
          <p className="text-xl text-muted-foreground">
            {opponent.chatMessages.onGameStart[Math.floor(Math.random() * opponent.chatMessages.onGameStart.length)]}
          </p>
        </div>

        <div className="text-7xl font-bold animate-pulse">
          {countdown}
        </div>
      </div>
    </div>
  )
} 