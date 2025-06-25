"use client"

import { NPCPersonality } from "@/lib/multiplayer-npcs"
import { BattlePlayerPanel } from "@/components/multiplayer/battle-player-panel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, ArrowRight, RotateCw, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Updated interface to match props from base-multiplayer-engine
export interface CompletedPhaseProps {
  onComplete: () => void
}

// Legacy interface for NPC battles (keep for backward compatibility)
export interface NPCCompletedPhaseProps {
  opponent: NPCPersonality
  playerScore: number
  opponentScore: number
  correctAnswers: number
  totalQuestions: number
  onPlayAgain: () => void
  onExit: () => void
}

export function CompletedPhase({ onComplete }: CompletedPhaseProps) {
  return (
    <div className="space-y-8">
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-6xl">
            🎉
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              Game Complete!
            </h2>
            <p className="text-xl text-muted-foreground">
              Great job learning about civic topics together!
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // TODO: Implement share functionality
                console.log('Share results')
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Results
            </Button>
            <Button
              size="lg"
              onClick={onComplete}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Legacy component for NPC battles
export function NPCCompletedPhase({
  opponent,
  playerScore,
  opponentScore,
  correctAnswers,
  totalQuestions,
  onPlayAgain,
  onExit
}: NPCCompletedPhaseProps) {
  const playerWon = playerScore > opponentScore
  const message = playerWon
    ? opponent.chatMessages.onLosing[Math.floor(Math.random() * opponent.chatMessages.onLosing.length)]
    : opponent.chatMessages.onWinning[Math.floor(Math.random() * opponent.chatMessages.onWinning.length)]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <BattlePlayerPanel
          name="You"
          score={playerScore}
          emoji="👤"
        />
        <div className="text-2xl font-bold">VS</div>
        <BattlePlayerPanel
          name={opponent.name}
          score={opponentScore}
          emoji={opponent.emoji}
          isNPC
        />
      </div>

      <Card className="p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-6xl">
            {playerWon ? '🏆' : '🎯'}
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              {playerWon ? 'Victory!' : 'Good Try!'}
            </h2>
            <p className="text-xl text-muted-foreground">
              {message}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 w-full max-w-md">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">
                Correct Answers
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {Math.round((correctAnswers / totalQuestions) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Accuracy
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onPlayAgain}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Play Again
            </Button>
            <Button
              size="lg"
              onClick={onExit}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Exit
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
} 