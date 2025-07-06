"use client"

import { NPCPersonality } from "@/lib/multiplayer-npcs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BattlePlayerPanel } from "@/components/multiplayer/battle-player-panel"
import { QuizQuestion } from "@/lib/types/quiz"
// import useUIStrings from "@/hooks/useUIStrings" // Temporarily use static strings

// Temporary static strings for build fix
const uiStrings = {
  multiplayer: {
    getReadyToPlay: "Get Ready to Play",
    questions: "questions",
    gameMode: "Game Mode",
    features: "Features",
    hints: "Hints",
    explanations: "Explanations",
    teamMode: "Team Mode",
    powerUps: "Power-Ups",
    startGame: "Start Game",
    waitingForPlayers: "Waiting for players",
    waitingForHost: "Waiting for host",
    npcBattle: "NPC Battle",
    testYourKnowledge: "Test your knowledge",
    skillLevel: "Skill Level",
    specialties: "Specialties", 
    weaknesses: "Weaknesses",
    startBattle: "Start Battle"
  }
}

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
        <h2 className="text-3xl font-bold">{uiStrings.multiplayer.getReadyToPlay}!</h2>
        <p className="text-xl text-muted-foreground">
          {currentTopic.title} - {config.name}
        </p>
        <p className="text-lg text-muted-foreground">
          {questions.length} {uiStrings.multiplayer.questions} • {Math.round(config.timePerQuestion / 1000)}s per question
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="text-6xl">{currentTopic.emoji}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{currentTopic.title}</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong>{uiStrings.multiplayer.gameMode}:</strong> {config.name}
              </p>
              <p>
                <strong>{uiStrings.multiplayer.questions}:</strong> {questions.length}
              </p>
              <p>
                <strong>{uiStrings.multiplayer.features}:</strong> {[
                  config.allowHints && uiStrings.multiplayer.hints,
                  config.showExplanations && uiStrings.multiplayer.explanations, 
                  config.collaborativeMode && uiStrings.multiplayer.teamMode,
                  config.allowBoosts && uiStrings.multiplayer.powerUps
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
            {allPlayersReady ? uiStrings.multiplayer.startGame : uiStrings.multiplayer.waitingForPlayers + "..."}
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground">{uiStrings.multiplayer.waitingForHost} to start the game...</p>
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
        <h2 className="text-3xl font-bold">{uiStrings.multiplayer.npcBattle}</h2>
        <p className="text-xl text-muted-foreground">
          {uiStrings.multiplayer.testYourKnowledge} against {opponent.name}, a {opponent.skillLevel.toLowerCase()} AI opponent!
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="text-6xl">{opponent.emoji}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{opponent.name}</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong>{uiStrings.multiplayer.skillLevel}:</strong> {opponent.skillLevel}
              </p>
              <p>
                <strong>{uiStrings.multiplayer.specialties}:</strong> {opponent.specialties.join(", ")}
              </p>
              <p>
                <strong>{uiStrings.multiplayer.weaknesses}:</strong> {opponent.weaknesses.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" onClick={onStart}>
          {uiStrings.multiplayer.startBattle}
        </Button>
      </div>
    </div>
  )
} 