import { useState, useEffect, memo, useCallback, useMemo } from "react"
import { Button } from "../ui/button"
import { cn } from "../../utils"
import type { QuizQuestion } from '@civicsense/shared/quiz-data'
import { QuestionExplanation } from "./question-explanation"
import { useGlobalAudio } from "@/components/global-audio-controls"

interface QuestionFeedbackDisplayProps {
  question: QuizQuestion
  selectedAnswer: string | null
  timeLeft: number
  isLastQuestion: boolean
  onNextQuestion: () => void
  className?: string
  xpGained?: number
}

export const QuestionFeedbackDisplay = memo(function QuestionFeedbackDisplay({
  question,
  selectedAnswer,
  timeLeft,
  isLastQuestion,
  onNextQuestion,
  className,
  xpGained = 0
}: QuestionFeedbackDisplayProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [canAdvance, setCanAdvance] = useState(false)
  const { autoPlayEnabled, playText, stop } = useGlobalAudio()

  // Countdown state for the "Next Question" button
  // We start at 4 seconds (matches the 4000 ms delay used elsewhere)
  const INITIAL_COUNTDOWN = 4
  const [countdown, setCountdown] = useState<number>(INITIAL_COUNTDOWN)
  
  // Reset and start countdown whenever a new feedback screen is shown
  // (xpGained or selected answer changes) and until the user can advance.
  useEffect(() => {
    // If the button is already enabled we don't need a countdown.
    if (canAdvance) {
      setCountdown(0)
      return
    }

    // Reset countdown to initial value
    setCountdown(INITIAL_COUNTDOWN)

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        // Stop at 0 to avoid negative values
        if (prev <= 1) {
          clearInterval(intervalId)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Cleanup on unmount or when dependencies change
    return () => clearInterval(intervalId)
  }, [question.question, xpGained, canAdvance])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile() // Initial check
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Animate XP gained and control advancement timing
  useEffect(() => {
    if (xpGained > 0) {
      // Reset animation state first
      setShowXpAnimation(false)
      setCanAdvance(false)
      
      // Trigger animation after a short delay
      const animationTimer = setTimeout(() => {
        setShowXpAnimation(true)
      }, 100)

      // Allow advancement after minimum viewing time
      const advanceTimer = setTimeout(() => {
        setCanAdvance(true)
      }, 4000)
      
      return () => {
        clearTimeout(animationTimer)
        clearTimeout(advanceTimer)
      }
    }
  }, [xpGained])

  // Handle next question with timing control - memoized to prevent recreation
  const handleNextWithDelay = useCallback(() => {
    if (!canAdvance) return
    onNextQuestion()
  }, [canAdvance, onNextQuestion])

  // Determine if answer is correct using same logic as quiz engine - memoized
  const isCorrectAnswer = useMemo(() => {
    if (!selectedAnswer) return false
    
    if (question.type === 'short_answer') {
      return selectedAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()
    } else if (question.type === 'true_false') {
      return selectedAnswer.toLowerCase() === question.correct_answer.toLowerCase()
    } else {
      return selectedAnswer === question.correct_answer
    }
  }, [selectedAnswer, question.type, question.correct_answer])

  // Memoize feedback content to prevent recalculation
  const feedback = useMemo(() => {
    if (isCorrectAnswer) {
      return {
        emoji: "🎉",
        title: "Correct!",
        titleClass: "text-green-700 dark:text-green-300",
        bgClass: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        showBonus: timeLeft > 45
      }
    } else {
      const title = (timeLeft === 0 || selectedAnswer === "timeout") ? "Time's up!" : 
                   selectedAnswer === "skipped" ? "Skipped" : 
                   "Not quite right"
      
      return {
        emoji: (timeLeft === 0 || selectedAnswer === "timeout") ? "⏰" : 
               selectedAnswer === "skipped" ? "⏭️" : "💭",
        title,
        titleClass: "text-red-700 dark:text-red-300",
        bgClass: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
        showBonus: false
      }
    }
  }, [isCorrectAnswer, timeLeft, selectedAnswer])

  // Auto-play feedback (correct/incorrect and correct answer) when shown
  useEffect(() => {
    if (!autoPlayEnabled) return
    let feedbackText = feedback.title
    if (!isCorrectAnswer && selectedAnswer !== "skipped") {
      if (selectedAnswer === "timeout") {
        feedbackText += ` Time ran out! The correct answer was: ${question.correct_answer}.`
      } else {
        feedbackText += `. The correct answer was: ${question.correct_answer}.`
      }
    }
    playText(feedbackText, { autoPlay: true })
    // Stop audio if unmounting or skipping
    return () => stop()
  }, [autoPlayEnabled, feedback.title, isCorrectAnswer, selectedAnswer, question.correct_answer, playText, stop])

  return (
    <div className={cn("max-w-3xl mx-auto space-y-6", className)}>
      <div className={cn(
        "p-5 rounded-xl border transition-all duration-300",
        isCorrectAnswer 
          ? "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10" 
          : "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10"
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
              
              {/* XP Gained Animation */}
              {isCorrectAnswer && xpGained > 0 && (
                <div className="mt-2">
                  <div className={cn(
                    "inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 font-medium transition-all duration-700",
                    showXpAnimation 
                      ? "opacity-100 transform scale-110" 
                      : "opacity-0 transform scale-75"
                  )}>
                    <span className="text-lg mr-1">+{xpGained}</span>
                    <span className="text-sm">XP</span>
                    <span className="ml-2 animate-pulse">⚡</span>
                  </div>
                </div>
              )}
              
              {/* Show correct answer if wrong or timed out */}
              {!isCorrectAnswer && selectedAnswer !== "skipped" && (
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                  {selectedAnswer === "timeout" ? "Time ran out! " : ""}
                  The correct answer was: <span className="font-medium">{question.correct_answer}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Explanation and sources - memoized by React.memo on QuestionExplanation */}
          <QuestionExplanation question={question} />
        </div>
      </div>

      {/* Next question button */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={handleNextWithDelay}
          disabled={!canAdvance}
          data-next-question
          className={cn(
            "transition-all duration-300",
            !canAdvance && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
          {/* Countdown timer shown until the button becomes active */}
          {!canAdvance && countdown > 0 && (
            <span className="ml-2 text-sm opacity-75">
              ({countdown}s)
            </span>
          )}
        </Button>
      </div>
    </div>
  )
})

// Add displayName for easier debugging
QuestionFeedbackDisplay.displayName = 'QuestionFeedbackDisplay' 