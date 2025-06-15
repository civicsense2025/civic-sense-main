import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/lib/quiz-data"
import { QuestionExplanation } from "./question-explanation"
import { useGlobalAudio } from "@/components/global-audio-controls"

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
  const [isMobile, setIsMobile] = useState(false)
  const { autoPlayEnabled, playText, stop } = useGlobalAudio()

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile() // Initial check
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Auto-play feedback (correct/incorrect and correct answer) when shown
  useEffect(() => {
    if (!autoPlayEnabled) return
    let feedbackText = feedback.title
    if (!isCorrectAnswer && selectedAnswer !== "skipped") {
      feedbackText += `. The correct answer was: ${question.correct_answer}.`
    }
    playText(feedbackText, { autoPlay: true })
    // Stop audio if unmounting or skipping
    return () => stop()
  }, [autoPlayEnabled, feedback.title, isCorrectAnswer, selectedAnswer, question.correct_answer, playText, stop])

  return (
    <div className={cn("max-w-3xl mx-auto space-y-6", className)}>
      <div className={cn(
        "p-5 rounded-xl border transition-all duration-300",
        feedback.bgClass
      )}
        data-audio-content="true"
      >
        <div className="text-center space-y-4">
          {/* Result emoji and text */}
          <div className="space-y-3">
            <div className="text-3xl">
              {feedback.emoji}
            </div>
            <div className="space-y-2">
              <h2 className={cn("text-xl font-light", feedback.titleClass)}>
                {feedback.title}
                {feedback.showBonus && <span className="text-base ml-2">⚡</span>}
              </h2>
              
              {/* Show correct answer if wrong */}
              {!isCorrectAnswer && selectedAnswer !== "skipped" && (
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                  The correct answer was: <span className="font-medium">{question.correct_answer}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Explanation and sources */}
          <QuestionExplanation question={question} />
          
          {/* Next question button (desktop only) */}
          {!isMobile && (
            <div className="flex justify-center pt-3">
              <Button 
                onClick={() => {
                  stop();
                  onNextQuestion();
                }} 
                className="rounded-full px-6 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-light text-sm"
              >
                {isLastQuestion ? "See Results" : "Next Question"} →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 