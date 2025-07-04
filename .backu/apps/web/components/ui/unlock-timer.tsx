"use client"

import { useState, useEffect } from 'react'
import { cn } from '@civicsense/business-logic/utils'

interface UnlockTimerProps {
  targetDate: Date
  className?: string
  label?: string
  showIcon?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function UnlockTimer({ 
  targetDate, 
  className, 
  label = "Unlocks in:",
  showIcon = true 
}: UnlockTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft(null)
        // Trigger a refresh when the timer expires
        window.location.reload()
      }
    }

    // Calculate immediately
    calculateTimeLeft()

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) {
    return null
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0')

  return (
    <div className={cn("flex items-center gap-2 text-sm font-mono", className)}>
      {showIcon && <span className="text-xs text-slate-500">🔒</span>}
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold">
            {formatTime(timeLeft.days)}d
          </span>
        )}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold">
            {formatTime(timeLeft.hours)}h
          </span>
        )}
        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold">
          {formatTime(timeLeft.minutes)}m
        </span>
        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold">
          {formatTime(timeLeft.seconds)}s
        </span>
      </div>
    </div>
  )
} 