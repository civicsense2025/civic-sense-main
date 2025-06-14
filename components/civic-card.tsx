"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Lock, Clock } from "lucide-react"
import type { TopicMetadata } from "@/lib/quiz-data"
import { useState, useEffect } from "react"

interface CivicCardProps {
  topic: TopicMetadata
  baseHeight: string
  onExploreGame: (topicId: string) => void
  isCompleted: boolean
  isLocked: boolean
}

interface CountdownProps {
  targetDate: Date
}

function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

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
      }
    }

    // Calculate immediately
    calculateTimeLeft()

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) {
    return (
      <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
        <span className="text-sm font-medium tracking-wide">Available Now!</span>
      </div>
    )
  }

  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return null
    return (
      <div className="text-center">
        <div className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {unit}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium tracking-wide">Unlocks in:</span>
      </div>
      
      <div className="flex items-center space-x-4">
        {timeLeft.days > 0 && formatTimeUnit(timeLeft.days, timeLeft.days === 1 ? 'day' : 'days')}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && formatTimeUnit(timeLeft.hours, timeLeft.hours === 1 ? 'hr' : 'hrs')}
        {timeLeft.days === 0 && formatTimeUnit(timeLeft.minutes, timeLeft.minutes === 1 ? 'min' : 'mins')}
      </div>
    </div>
  )
}

export function CivicCard({ topic, baseHeight, onExploreGame, isCompleted, isLocked }: CivicCardProps) {
  const handleClick = () => {
    if (!isLocked) {
      onExploreGame(topic.topic_id)
    }
  }

  // Parse the topic date to get the unlock time (assuming it unlocks at midnight)
  const getUnlockDate = () => {
    const topicDate = new Date(topic.date)
    // Set to midnight of the topic date in local timezone
    return new Date(topicDate.getFullYear(), topicDate.getMonth(), topicDate.getDate())
  }

  return (
    <div 
      className={`
        group cursor-pointer transition-all duration-300
        ${isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'}
        max-w-2xl mx-auto
      `}
      onClick={handleClick}
    >
      {/* Minimal card with tons of whitespace */}
      <div className="py-8 sm:py-16 px-4 sm:px-8 text-center space-y-8 sm:space-y-12">
        
        {/* Large emoji */}
        <div className="text-6xl sm:text-8xl">
          {topic.emoji}
        </div>

        {/* Large, clean typography */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-4xl font-light text-slate-900 dark:text-slate-50 leading-tight tracking-tight px-2">
            {topic.topic_title}
          </h2>
          
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto font-light px-4">
            {topic.description}
          </p>
        </div>

        {/* Minimal CTA */}
        <div className="pt-4 sm:pt-8">
          {isLocked ? (
            <Countdown targetDate={getUnlockDate()} />
          ) : (
            <Button
              className={`
                px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-medium tracking-wide
                ${isCompleted 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900'
                }
                rounded-full transition-all duration-200
                group-hover:scale-105
                ${!isCompleted && !isLocked ? 'animate-breathe-glow' : ''}
              `}
              disabled={isLocked}
            >
              <span>{isCompleted ? 'Review Quiz' : 'Start Quiz'}</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
