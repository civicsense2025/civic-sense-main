"use client"

import { useMemo } from "react"
import { BaseMultiplayerEngine, GAME_MODE_CONFIGS, type BaseMultiplayerEngineProps } from "./game-modes/base-multiplayer-engine"
import { SpeedRoundEngine } from "./game-modes/speed-round-engine"
import { EliminationEngine } from "./game-modes/elimination-engine"
import { LearningLabEngine } from "./game-modes/learning-lab-engine"
import { QuizEngine } from "@/components/quiz/quiz-engine"
import { useMultiplayerRoom } from "@/lib/multiplayer"
import type { QuizQuestion } from "@/lib/quiz-data"

// =============================================================================
// MULTIPLAYER QUIZ ROUTER COMPONENT
// =============================================================================

interface MultiplayerQuizRouterProps {
  questions: QuizQuestion[]
  topicId: string
  roomId: string
  playerId: string
  onComplete: () => void
  currentTopic: {
    id: string
    title: string
    emoji: string
    date: string
    dayOfWeek: string
  }
}

export function MultiplayerQuizRouter({
  questions,
  topicId,
  roomId,
  playerId,
  onComplete,
  currentTopic
}: MultiplayerQuizRouterProps) {
  const { room, isLoading, error } = useMultiplayerRoom(roomId)

  // Determine game mode from room settings
  const gameMode = useMemo(() => {
    return room?.game_mode || 'classic'
  }, [room?.game_mode])

  // Prepare props for game mode engines
  const engineProps: BaseMultiplayerEngineProps = useMemo(() => ({
    questions,
    topicId,
    roomId,
    playerId,
    gameMode,
    onComplete,
    config: GAME_MODE_CONFIGS[gameMode] || GAME_MODE_CONFIGS.classic,
    currentTopic
  }), [questions, topicId, roomId, playerId, gameMode, onComplete, currentTopic])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading multiplayer quiz...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Preparing {gameMode.replace('_', ' ')} mode...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Room Not Available</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The multiplayer room could not be loaded."}
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  // Route to appropriate game mode engine
  switch (gameMode as string) {
    case 'speed_round':
      return <SpeedRoundEngine {...engineProps} />
    
    case 'elimination':
      return <EliminationEngine {...engineProps} />
    
    case 'learning_lab':
      return <LearningLabEngine {...engineProps} />
    
    case 'classic':
    default:
      return <BaseMultiplayerEngine {...engineProps} />
  }
}

// =============================================================================
// GAME MODE DISPLAY HELPERS
// =============================================================================

export function getGameModeDisplayName(gameMode: string): string {
  const config = GAME_MODE_CONFIGS[gameMode]
  return config?.name || 'Classic Quiz'
}

export function getGameModeDescription(gameMode: string): string {
  switch (gameMode) {
    case 'classic':
      return 'Traditional quiz format with detailed explanations and balanced pacing'
    case 'speed_round':
      return 'Fast-paced competitive quiz with real-time leaderboards and speed bonuses'
    case 'elimination':
      return 'High-stakes survival mode where wrong answers eliminate players'
    case 'learning_lab':
      return 'Collaborative learning with AI teachers and group discussion features'
    default:
      return 'Multiplayer quiz experience'
  }
}

export function getGameModeIcon(gameMode: string): string {
  switch (gameMode) {
    case 'classic':
      return '📚'
    case 'speed_round':
      return '⚡'
    case 'elimination':
      return '🏆'
    case 'learning_lab':
      return '🧪'
    default:
      return '🎮'
  }
} 