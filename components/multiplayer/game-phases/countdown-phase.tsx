import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import type { GamePhaseProps } from "../types/game-types"

interface CountdownPhaseProps extends Pick<GamePhaseProps, 'currentQuestion' | 'countdown'> {}

export function CountdownPhase({
  currentQuestion,
  countdown
}: CountdownPhaseProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Get Ready!
        </h2>
        <div className="text-8xl font-bold text-blue-600 animate-pulse">
          {countdown}
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Game starting in {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>
      </div>

      {/* Preview of first question */}
      {currentQuestion && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border opacity-75">
          <h3 className="text-lg font-semibold mb-4">First Question Preview:</h3>
          <p className="text-slate-700 dark:text-slate-300">
            <GlossaryLinkText text={currentQuestion.question || ''} />
          </p>
        </div>
      )}
    </div>
  )
} 