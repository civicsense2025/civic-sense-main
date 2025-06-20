import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { GamePhaseProps } from "../types/game-types"

interface WaitingPhaseProps extends Pick<GamePhaseProps, 'currentTopic' | 'config' | 'questions' | 'onStartGame' | 'isHost' | 'allPlayersReady'> {}

export function WaitingPhase({
  currentTopic,
  config,
  questions,
  onStartGame,
  isHost,
  allPlayersReady
}: WaitingPhaseProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          {currentTopic.emoji} {currentTopic.title}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Waiting for players to get ready...
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4">Game Settings</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">Mode:</span>
            <span className="ml-2 font-medium">{config.name}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Questions:</span>
            <span className="ml-2 font-medium">{questions.length}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Time per question:</span>
            <span className="ml-2 font-medium">{config.timePerQuestion / 1000}s</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Hints:</span>
            <span className="ml-2 font-medium">{config.allowHints ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </div>

      {isHost && allPlayersReady && (
        <Button
          onClick={onStartGame}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
        >
          <ArrowRight className="mr-2 h-5 w-5" />
          Start Game
        </Button>
      )}

      {isHost && !allPlayersReady && (
        <p className="text-slate-600 dark:text-slate-400">
          Waiting for all players to ready up...
        </p>
      )}
    </div>
  )
} 