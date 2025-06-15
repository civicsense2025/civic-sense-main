"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, Calendar, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TopicMetadata } from "@/lib/quiz-data"
import { useGlobalAudio } from "@/components/global-audio-controls"

interface CivicCardProps {
  topic: TopicMetadata
  baseHeight: string
  onExploreGame: (topicId: string) => void
  isCompleted: boolean
  isLocked: boolean
  isComingSoon?: boolean
  showFloatingKeyboard?: boolean
}

interface CountdownProps {
  targetDate: Date
  isComingSoon?: boolean
}

function Countdown({ targetDate, isComingSoon = false }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

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
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    // Update more frequently - every second for better UX
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return null
    return (
      <span className="inline-flex items-center">
        <span className="font-bold text-2xl text-neutral-900 dark:text-neutral-100">{value}</span>
        <span className="ml-1 text-neutral-600 dark:text-neutral-300 text-sm font-medium">{unit}{value !== 1 ? 's' : ''}</span>
      </span>
    )
  }

  const formatTimeUnitCompact = (value: number, unit: string) => {
    if (value === 0) return null
    return (
      <div className="flex flex-col items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2 min-w-[60px]">
        <span className="font-bold text-xl text-neutral-900 dark:text-neutral-100">{value}</span>
        <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">{unit}{value !== 1 ? 's' : ''}</span>
      </div>
    )
  }

  const { days, hours, minutes, seconds } = timeLeft

  // Check if we're very close (less than 1 hour)
  const isVeryClose = days === 0 && hours === 0
  
  // Check if we're close (less than 24 hours)
  const isClose = days === 0

  if (days > 0) {
    // Show days + hours for >24h away - compact card style
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-lg">
          <Clock className="h-6 w-6 text-blue-500 animate-pulse" />
          <span className="text-neutral-700 dark:text-neutral-300 font-medium">Unlocks in</span>
        </div>
        <div className="flex items-center justify-center space-x-3">
          {formatTimeUnitCompact(days, 'day')}
          {hours > 0 && formatTimeUnitCompact(hours, 'hour')}
        </div>
      </div>
    )
  } else if (hours > 0) {
    // Show hours + minutes for <24h - more prominent
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-lg">
          <Clock className="h-6 w-6 text-orange-500 animate-pulse" />
          <span className="text-neutral-700 dark:text-neutral-300 font-medium">Unlocks in</span>
        </div>
        <div className="flex items-center justify-center space-x-3">
          {formatTimeUnitCompact(hours, 'hour')}
          {minutes > 0 && formatTimeUnitCompact(minutes, 'min')}
        </div>
      </div>
    )
  } else if (minutes > 0) {
    // Show minutes + seconds for <1h - very prominent with animation
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-lg">
          <Clock className="h-6 w-6 text-red-500 animate-bounce" />
          <span className="text-neutral-700 dark:text-neutral-300 font-medium">Almost ready!</span>
        </div>
        
        {/* Circular progress for final countdown */}
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-neutral-200 dark:text-neutral-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - (minutes * 60 + seconds) / 3600)}`}
              className="text-red-500 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{minutes}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">min</div>
            <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{seconds}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">sec</div>
          </div>
        </div>
      </div>
    )
  } else if (seconds > 0) {
    // Show only seconds for <1min - maximum prominence with circular progress
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-lg">
          <Clock className="h-6 w-6 text-green-500 animate-spin" />
          <span className="text-neutral-700 dark:text-neutral-300 font-medium animate-pulse">Unlocking now!</span>
        </div>
        
        {/* Circular progress for final seconds */}
        <div className="relative flex items-center justify-center">
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-neutral-200 dark:text-neutral-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - seconds / 60)}`}
              className="transition-all duration-1000 ease-out animate-pulse"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent animate-pulse">
              {seconds}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">seconds</div>
          </div>
        </div>
      </div>
    )
  } else {
    // Time is up - only show "Quiz Available!" for topics that actually have questions
    // Don't show this for "coming soon" topics
    if (isComingSoon) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-lg">
            <span className="text-2xl">🚧</span>
            <span className="text-amber-700 dark:text-amber-300 font-medium">Still Coming Soon</span>
          </div>
          <div className="text-center">
            <span className="text-sm text-amber-600 dark:text-amber-400">Questions are still being prepared</span>
          </div>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-lg">
          <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-sm">✓</span>
          </div>
          <span className="text-green-600 dark:text-green-400 font-bold animate-pulse">Quiz Available!</span>
        </div>
        <div className="text-center">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Refresh the page to start</span>
        </div>
      </div>
    )
  }
}

// Floating Keyboard Command Bar Component
function FloatingKeyboardBar({ isVisible, isComingSoon }: { isVisible: boolean; isComingSoon: boolean }) {
  if (isComingSoon) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out hidden md:block">
      <div className={`
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg 
        border border-slate-200/80 dark:border-slate-700/80 
        rounded-2xl px-4 sm:px-6 py-3 shadow-xl
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
      `}>
        <div className="flex items-center space-x-3 sm:space-x-6 text-sm">
          {/* Start Quiz */}
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-600">
              Enter
            </kbd>
            <span className="text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">Start Quiz</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium sm:hidden">Start</span>
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
          
          {/* Back to Home */}
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-600">
              Esc
            </kbd>
            <span className="text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">Back</span>
          </div>
          
          {/* Help - Desktop only */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-600">
              ?
            </kbd>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Help</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CivicCard({ topic, baseHeight, onExploreGame, isCompleted, isLocked, isComingSoon, showFloatingKeyboard }: CivicCardProps) {
  const router = useRouter()
  
  // Global audio integration
  const { autoPlayEnabled, playText } = useGlobalAudio()
  
  // Auto-play topic content when autoplay is enabled and card is displayed
  useEffect(() => {
    if (autoPlayEnabled && topic.topic_title && !isComingSoon) {
      // Build comprehensive text to read
      let textToRead = `${topic.topic_title}. `
      
      if (topic.description) {
        textToRead += `${topic.description}. `
      }
      
      if (topic.categories && topic.categories.length > 0) {
        textToRead += `Categories: ${topic.categories.slice(0, 2).join(', ')}. `
      }
      
      if (isLocked) {
        textToRead += `This quiz will unlock on ${new Date(topic.date).toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })}.`
      } else if (isCompleted) {
        textToRead += "You have completed this quiz."
      } else {
        textToRead += "This quiz is available to start now."
      }
      
      // Delay to ensure UI is ready and avoid conflicts
      setTimeout(() => {
        playText(textToRead, { autoPlay: true })
      }, 1200)
    }
  }, [autoPlayEnabled, topic, isLocked, isCompleted, isComingSoon, playText])
  
  const handleClick = () => {
    // Don't allow clicks if coming soon (no questions available)
    if (isComingSoon) {
      return
    }
    
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

  // Keyboard event handling for the floating bar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          if (!isLocked && !isComingSoon) {
            router.push(`/quiz/${topic.topic_id}`)
          }
          break
        case 'Escape':
          event.preventDefault()
          router.push('/')
          break
        case '?':
          event.preventDefault()
          // Could show help modal in the future
          console.log('Help requested')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [topic.topic_id, isLocked, isComingSoon, router])

  // Determine the actual display state
  const isDateLocked = isLocked && !isComingSoon
  const isAvailable = !isLocked && !isComingSoon

  return (
    <div 
      className={`relative w-full ${baseHeight} cursor-pointer group transition-all duration-300 hover:scale-[1.02] focus-within:scale-[1.02] ${
        isLocked ? 'opacity-90' : ''
      }`}
      onClick={handleClick}
      tabIndex={0}
      data-topic-id={topic.topic_id}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="h-full flex flex-col justify-center text-center space-y-8 px-4">
        {/* Status indicators */}
        <div className="flex justify-center">
          {isLocked && !isComingSoon && (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full border bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Unlocks Soon</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full border bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Completed</span>
            </div>
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
          {isComingSoon ? (
            /* Coming Soon message for topics without questions */
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-700 shadow-lg">
              <div className="text-center">
                <div className="text-2xl mb-3">🚧</div>
                <p className="text-amber-700 dark:text-amber-300 font-medium text-lg">
                  Questions still in committee
                </p>
              </div>
            </div>
          ) : isDateLocked ? (
            /* Regular countdown for date-locked topics */
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                <Countdown targetDate={getUnlockDate()} isComingSoon={isComingSoon} />
              </div>
              
              {/* Unlock information with better formatting */}
              <div className="space-y-4">
                <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl mx-auto">
                  This quiz will unlock at <span className="font-semibold text-neutral-800 dark:text-neutral-200">6:00 AM</span> on{' '}
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {new Date(topic.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </p>
                
                {/* Add notification option and refresh button */}
                <div className="space-y-3">
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    💡 Tip: Bookmark this page to return when it's ready!
                  </div>
                  
                  {/* Manual refresh button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.reload()
                    }}
                    className="text-xs px-4 py-2 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    🔄 Check if Available
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Available quiz - show start button */
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

      {/* Floating Keyboard Command Bar */}
      {showFloatingKeyboard && <FloatingKeyboardBar isVisible={true} isComingSoon={isComingSoon || false} />}
    </div>
  )
}
