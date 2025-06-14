"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TopicMetadata } from "@/lib/quiz-data"

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
  }>({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

        setTimeLeft({ days, hours, minutes })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [targetDate])

  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return null
    return (
      <span className="inline-flex items-center">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{value}</span>
        <span className="ml-1 text-neutral-600 dark:text-neutral-300 text-sm">{unit}{value !== 1 ? 's' : ''}</span>
      </span>
    )
  }

  const { days, hours, minutes } = timeLeft

  // Smart display logic
  if (days > 0) {
    // Show days + hours for >24h away
    return (
      <div className="flex items-center justify-center space-x-2 text-lg">
        <Clock className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        <div className="flex space-x-2">
          {formatTimeUnit(days, 'day')}
          {hours > 0 && formatTimeUnit(hours, 'hour')}
        </div>
      </div>
    )
  } else if (hours > 0) {
    // Show hours + minutes for <24h
    return (
      <div className="flex items-center justify-center space-x-2 text-lg">
        <Clock className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        <div className="flex space-x-2">
          {formatTimeUnit(hours, 'hour')}
          {minutes > 0 && formatTimeUnit(minutes, 'minute')}
        </div>
      </div>
    )
  } else {
    // Show only minutes for <1h
    return (
      <div className="flex items-center justify-center space-x-2 text-lg">
        <Clock className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        {formatTimeUnit(Math.max(minutes, 1), 'minute')}
      </div>
    )
  }
}

export function CivicCard({ topic, baseHeight, onExploreGame, isCompleted, isLocked }: CivicCardProps) {
  const router = useRouter()
  
  const handleClick = () => {
    if (!isLocked) {
      router.push(`/quiz/${topic.topic_id}`)
    }
  }

  const getUnlockDate = () => {
    const topicDate = new Date(topic.date)
    // Set to 6 AM on the topic date
    topicDate.setHours(6, 0, 0, 0)
    return topicDate
  }

  return (
    <div className={`${baseHeight} group relative`}>
      <div 
        className={`
          h-full transition-all duration-300 cursor-pointer
          ${!isLocked ? 'hover:scale-[1.02]' : ''}
        `}
        onClick={handleClick}
      >
        <div className="h-full flex flex-col justify-center text-center space-y-8 px-4">
          {/* Status indicators */}
          <div className="flex justify-center">
            {isLocked && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                <Lock className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                <span className="text-sm text-neutral-600 dark:text-neutral-300">Locked</span>
              </div>
            )}
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                ✓ Complete
              </Badge>
            )}
          </div>

          {/* Emoji */}
          <div className="text-8xl">{topic.emoji}</div>

          {/* Main Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-light text-neutral-900 dark:text-neutral-100 leading-tight">
              {topic.topic_title}
            </h1>
            
            {/* Categories moved under title */}
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {topic.categories?.slice(0, 2).join(' • ') || 'Civic Education'}
            </div>
            
            <p className="text-lg md:text-xl text-neutral-700 dark:text-neutral-200 leading-relaxed max-w-4xl mx-auto">
              {topic.description}
            </p>
          </div>

          {/* Countdown or Actions */}
          <div className="space-y-6">
            {isLocked ? (
              <div className="space-y-6">
                <Countdown targetDate={getUnlockDate()} />
                <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl mx-auto">
                  This quiz will unlock at 6 AM on {new Date(topic.date).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <Button 
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-black font-medium px-12 py-4 rounded-xl transition-all duration-200 hover:shadow-lg text-xl animate-breathe-glow"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
              >
                {isCompleted ? 'Review Quiz' : 'Start Quiz'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
