import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface QuestionTimerProps {
  initialTime: number
  isActive: boolean
  onTimeUp: () => void
  className?: string
}

export function QuestionTimer({ 
  initialTime, 
  isActive, 
  onTimeUp, 
  className 
}: QuestionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const hasCalledTimeUp = useRef(false)

  // Reset timer when initialTime changes
  useEffect(() => {
    setTimeLeft(initialTime)
    hasCalledTimeUp.current = false
  }, [initialTime])

  // Timer effect - only updates timeLeft
  useEffect(() => {
    if (!isActive) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive])

  // Separate effect to handle time up callback
  useEffect(() => {
    if (timeLeft === 0 && isActive && !hasCalledTimeUp.current) {
      hasCalledTimeUp.current = true
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        onTimeUp()
      }, 0)
    }
  }, [timeLeft, isActive, onTimeUp])

  const getTimerColor = () => {
    if (timeLeft <= 10) return "text-red-600 dark:text-red-400"
    if (timeLeft <= 30) return "text-amber-600 dark:text-amber-400"
    return "text-slate-600 dark:text-slate-400"
  }

  const getTimerBgColor = () => {
    if (timeLeft <= 10) return "bg-red-50 dark:bg-red-950/20"
    if (timeLeft <= 30) return "bg-amber-50 dark:bg-amber-950/20"
    return "bg-slate-50 dark:bg-slate-900"
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 text-sm",
      getTimerBgColor(),
      getTimerColor(),
      className
    )}>
      <span className="text-xs">⏱</span>
      <span className="text-sm font-mono font-light">
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </span>
    </div>
  )
}

// Hook to use timer state
export function useQuestionTimer(initialTime: number = 60) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isActive, setIsActive] = useState(true)

  const resetTimer = () => {
    setTimeLeft(initialTime)
    setIsActive(true)
  }

  const stopTimer = () => {
    setIsActive(false)
  }

  const startTimer = () => {
    setIsActive(true)
  }

  return {
    timeLeft,
    isActive,
    resetTimer,
    stopTimer,
    startTimer,
    setTimeLeft
  }
} 