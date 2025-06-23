"use client"

import { useState, useEffect, useRef } from "react"
import { NPCPersonality } from "@/lib/multiplayer-npcs"
import { Card } from "@/components/ui/card"
import { BattlePlayerPanel } from "@/components/multiplayer/battle-player-panel"

export interface CountdownPhaseProps {
  opponent: NPCPersonality
  onComplete: () => void
}

export function CountdownPhase({ opponent, onComplete }: CountdownPhaseProps) {
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
          <h2 className="text-3xl font-bold">Battle Starting</h2>
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