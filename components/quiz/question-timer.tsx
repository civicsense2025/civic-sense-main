import { useEffect, useState, useRef, useCallback } from "react"
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
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset timer when initialTime changes or component mounts
  useEffect(() => {
    console.log('QuestionTimer: Resetting to', initialTime)
    setTimeLeft(initialTime)
    hasCalledTimeUp.current = false
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [initialTime])

  // Timer effect - manages the countdown
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!isActive) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isActive])

  // Separate effect to handle time up callback
  useEffect(() => {
    if (timeLeft === 0 && isActive && !hasCalledTimeUp.current) {
      hasCalledTimeUp.current = true
      console.log('QuestionTimer: Time up!')
      
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        onTimeUp()
      }, 0)
    }
  }, [timeLeft, isActive, onTimeUp])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

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
      "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm timer-component",
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
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timer on cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Main timer effect
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Start new timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isActive, initialTime]) // Added initialTime to dependencies

  const resetTimer = useCallback(() => {
    console.log('Resetting timer to:', initialTime)
    setTimeLeft(initialTime)
    setIsActive(true)
    
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [initialTime])

  const stopTimer = useCallback(() => {
    console.log('Stopping timer')
    setIsActive(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    console.log('Starting timer')
    setIsActive(true)
  }, [])

  return {
    timeLeft,
    isActive,
    resetTimer,
    stopTimer,
    startTimer,
    setTimeLeft
  }
} 