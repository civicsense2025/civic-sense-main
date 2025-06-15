import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/lib/quiz-data"
import { QuestionExplanation } from "./question-explanation"

interface QuestionFeedbackDisplayProps {
  question: QuizQuestion
  selectedAnswer: string | null
  timeLeft: number
  isLastQuestion: boolean
  onNextQuestion: () => void
  className?: string
}

export function QuestionFeedbackDisplay({
  question,
  selectedAnswer,
  timeLeft,
  isLastQuestion,
  onNextQuestion,
  className
}: QuestionFeedbackDisplayProps) {
  // Determine if answer is correct using same logic as quiz engine
  const isCorrectAnswer = (() => {
    if (!selectedAnswer) return false
    
    if (question.question_type === 'short_answer') {
      return selectedAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()
    } else if (question.question_type === 'true_false') {
      return selectedAnswer.toLowerCase() === question.correct_answer.toLowerCase()
    } else {
      return selectedAnswer === question.correct_answer
    }
  })()

  const getFeedbackContent = () => {
    if (isCorrectAnswer) {
      return {
        emoji: "🎉",
        title: "Correct!",
        titleClass: "text-green-700 dark:text-green-300",
        bgClass: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        showBonus: timeLeft > 45
      }
    } else {
      const title = timeLeft === 0 ? "Time's up!" : 
                   selectedAnswer === "skipped" ? "Skipped" : 
                   "Not quite right"
      
      return {
        emoji: "💭",
        title,
        titleClass: "text-red-700 dark:text-red-300",
        bgClass: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
        showBonus: false
      }
    }
  }

  const feedback = getFeedbackContent()

  return (
    <div className={cn("max-w-3xl mx-auto space-y-8", className)}>
      <div className={cn(
        "p-8 rounded-xl border transition-all duration-300",
        feedback.bgClass
      )}>
        <div className="text-center space-y-6">
          {/* Result emoji and text */}
          <div className="space-y-4">
            <div className="text-4xl">
              {feedback.emoji}
            </div>
            <div className="space-y-2">
              <h2 className={cn("text-2xl font-light", feedback.titleClass)}>
                {feedback.title}
                {feedback.showBonus && <span className="text-lg ml-2">⚡</span>}
              </h2>
              
              {/* Show correct answer if wrong */}
              {!isCorrectAnswer && selectedAnswer !== "skipped" && (
                <p className="text-slate-600 dark:text-slate-400 font-light">
                  The correct answer was: <span className="font-medium">{question.correct_answer}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Explanation and sources */}
          <QuestionExplanation question={question} />
          
          {/* Next question button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={onNextQuestion} 
              className="rounded-full px-8 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-light"
            >
              {isLastQuestion ? "See Results" : "Next Question"} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 