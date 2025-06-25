"use client"

import { NPCPersonality } from "@/lib/multiplayer-npcs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BattlePlayerPanel } from "@/components/multiplayer/battle-player-panel"
import { QuizQuestion } from "@/lib/types/quiz"

// Updated interface to match props from base-multiplayer-engine
export interface WaitingPhaseProps {
  currentTopic: {
    id: string
    title: string
    emoji: string
    date: string
    dayOfWeek: string
  }
  config: {
    name: string
    timePerQuestion: number
    showExplanations: boolean
    allowHints: boolean
    allowBoosts: boolean
    showRealTimeScores?: boolean
    speedBonusEnabled?: boolean
    eliminationMode?: boolean
    collaborativeMode?: boolean
    countdownDuration?: number
  }
  questions: QuizQuestion[]
  onStartGame: () => Promise<void>
  isHost: boolean
  allPlayersReady: boolean
}

// Legacy interface for NPC battles (keep for backward compatibility)
export interface NPCWaitingPhaseProps {
  opponent: NPCPersonality
  onStart: () => void
}

export function WaitingPhase({ 
  currentTopic, 
  config, 
  questions, 
  onStartGame, 
  isHost, 
  allPlayersReady 
}: WaitingPhaseProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Get Ready to Play!</h2>
        <p className="text-xl text-muted-foreground">
          {currentTopic.title} - {config.name}
        </p>
        <p className="text-lg text-muted-foreground">
          {questions.length} questions • {Math.round(config.timePerQuestion / 1000)}s per question
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="text-6xl">{currentTopic.emoji}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{currentTopic.title}</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong>Game Mode:</strong> {config.name}
              </p>
              <p>
                <strong>Questions:</strong> {questions.length}
              </p>
              <p>
                <strong>Features:</strong> {[
                  config.allowHints && "Hints",
                  config.showExplanations && "Explanations", 
                  config.collaborativeMode && "Team Mode",
                  config.allowBoosts && "Power-ups"
                ].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        {isHost ? (
          <Button 
            size="lg" 
            onClick={onStartGame}
            disabled={!allPlayersReady}
          >
            {allPlayersReady ? "Start Game" : "Waiting for Players..."}
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground">Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Legacy component for NPC battles
export function NPCWaitingPhase({ opponent, onStart }: NPCWaitingPhaseProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">NPC Battle</h2>
        <p className="text-xl text-muted-foreground">
          Test your knowledge against {opponent.name}, a {opponent.skillLevel.toLowerCase()} AI opponent!
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="text-6xl">{opponent.emoji}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{opponent.name}</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong>Skill Level:</strong> {opponent.skillLevel}
              </p>
              <p>
                <strong>Specialties:</strong> {opponent.specialties.join(", ")}
              </p>
              <p>
                <strong>Weaknesses:</strong> {opponent.weaknesses.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" onClick={onStart}>
          Start Battle
        </Button>
      </div>
    </div>
  )
} 