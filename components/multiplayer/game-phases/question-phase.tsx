import { Button } from "@/components/ui/button"
import { GlossaryLinkText } from "@/components/glossary/glossary-link-text"
import { Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuestionPhaseProps } from "../types/game-types"
import { getQuestionOptions } from "../utils/game-utils"

export function QuestionPhase({
  currentQuestion,
  gameState,
  config,
  onAnswerSelect,
  onSubmitAnswer,
  onShowHint,
  isAnswerSubmitted,
  showHint
}: QuestionPhaseProps) {
  const questionOptions = getQuestionOptions(currentQuestion)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-relaxed">
          <GlossaryLinkText text={currentQuestion.question || ''} />
        </h2>

        {showHint && currentQuestion.hint && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-0.5">
                <Lightbulb className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Hint:</strong> <GlossaryLinkText text={currentQuestion.hint} />
              </p>
            </div>
          </div>
        )}
      </div>

      {currentQuestion.question_type === 'multiple_choice' && (
        <div className="grid gap-3">
          {questionOptions.map((option) => {
            const isSelected = gameState.selectedAnswer === option.text
            const isCorrect = option.text === currentQuestion.correct_answer
            const showResult = gameState.showFeedback

            return (
              <button
                key={option.key}
                onClick={() => !isAnswerSubmitted && onAnswerSelect(option.text!)}
                disabled={isAnswerSubmitted}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                  "hover:border-blue-300 dark:hover:border-blue-600",
                  "disabled:cursor-not-allowed",
                  {
                    "border-blue-500 bg-blue-50 dark:bg-blue-950/30": isSelected && !showResult,
                    "border-green-500 bg-green-50 dark:bg-green-950/30": showResult && isCorrect,
                    "border-red-500 bg-red-50 dark:bg-red-950/30": showResult && isSelected && !isCorrect,
                    "border-slate-200 dark:border-slate-700": !isSelected && (!showResult || !isCorrect)
                  }
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold",
                    {
                      "border-blue-500 bg-blue-500 text-white": isSelected && !showResult,
                      "border-green-500 bg-green-500 text-white": showResult && isCorrect,
                      "border-red-500 bg-red-500 text-white": showResult && isSelected && !isCorrect,
                      "border-slate-300 dark:border-slate-600": !isSelected && (!showResult || !isCorrect)
                    }
                  )}>
                    {option.key}
                  </div>
                  <span className="text-slate-900 dark:text-white">
                    <GlossaryLinkText text={option.text!} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Action buttons */}
      {!isAnswerSubmitted && (
        <div className="flex items-center justify-center gap-4">
          {config.allowHints && !showHint && currentQuestion.hint && (
            <Button
              onClick={onShowHint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Show Hint for Everyone
            </Button>
          )}
          
          <Button
            onClick={() => gameState.selectedAnswer && onSubmitAnswer(gameState.selectedAnswer)}
            disabled={!gameState.selectedAnswer}
            className={cn(
              "px-8 py-3 font-medium transition-all duration-200",
              gameState.selectedAnswer 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            Submit Answer
          </Button>
        </div>
      )}

      {/* Show explanation when feedback is visible */}
      {gameState.showFeedback && config.showExplanations && currentQuestion.explanation && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Explanation:</h3>
          <p className="text-slate-700 dark:text-slate-300">
            <GlossaryLinkText text={currentQuestion.explanation} />
          </p>
        </div>
      )}
    </div>
  )
} 