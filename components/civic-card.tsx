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
  guestLocked?: boolean
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
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  const { days, hours, minutes, seconds } = timeLeft
  
  // Simplified time display in Apple style
  if (days > 0) {
    return (
      <div className="text-center">
        <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Unlocks in</div>
        <div className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
          {days}d {hours}h
        </div>
      </div>
    )
  } else if (hours > 0) {
    return (
      <div className="text-center">
        <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Unlocks in</div>
        <div className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
          {hours}h {minutes}m
        </div>
      </div>
    )
  } else if (minutes > 0 || seconds > 0) {
    return (
      <div className="text-center">
        <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Unlocks in</div>
        <div className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
          {minutes}m {seconds}s
        </div>
        <div className="w-32 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-3 mx-auto">
          <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ 
              width: `${(1 - (minutes * 60 + seconds) / 3600) * 100}%`,
              transition: "width 1s linear"
            }}
          ></div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="text-center">
        <div className="text-sm text-green-500 animate-pulse">
          Ready now
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

export function CivicCard({ 
  topic, 
  baseHeight, 
  onExploreGame, 
  isCompleted, 
  isLocked, 
  isComingSoon, 
  showFloatingKeyboard = false,
  guestLocked = false 
}: CivicCardProps) {
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
  
  // Determine if the topic is locked due to date (future content)
  const isDateLocked = isLocked && !isComingSoon
  
  // Determine if the content is currently available
  const isAvailable = !isLocked && !isComingSoon

  const handleClick = () => {
    if (isLocked || isComingSoon) {
      // If the content is locked due to guest access, we don't navigate but onExploreGame will handle auth
      if (guestLocked) {
        onExploreGame(topic.topic_id)
      }
      return
    }
    
    onExploreGame(topic.topic_id)
  }

  const getUnlockDate = () => {
    try {
      return new Date(topic.date)
    } catch (e) {
      return new Date()
    }
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

  return (
    <div 
      className={`relative w-full ${baseHeight} cursor-pointer ${
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
        {/* Status indicators - Smaller, cleaner badges */}
        <div className="flex justify-center">
          {isLocked && !isComingSoon && !guestLocked && (
            <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Unlocking soon</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">Completed</span>
            </div>
          )}
          {!isLocked && !isComingSoon && !isCompleted && !guestLocked && (
            <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-green-700 dark:text-green-300">Available now</span>
            </div>
          )}
        </div>

        {/* Emoji */}
        <div className="text-8xl">{topic.emoji}</div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 leading-tight">
            {topic.topic_title}
          </h1>
          
          {/* Categories as badges with Space Mono font */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {(topic.categories?.slice(0, 2) || ['Civic Education']).map((category, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="font-mono font-light text-xs px-3 py-1 rounded-full border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900"
                style={{ fontFamily: 'Space Mono, monospace' }}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          {/* Description capped at 250 chars */}
          <p className="text-lg md:text-xl text-neutral-700 dark:text-neutral-200 leading-relaxed max-w-4xl mx-auto font-light">
            {topic.description && topic.description.length > 250
              ? topic.description.slice(0, 247) + '...'
              : topic.description}
          </p>
          
          {/* Unlock info as plain text if locked by date */}
          {isDateLocked && (
            <div className="space-y-1 text-center mt-4">
              <div className="text-base text-neutral-600 dark:text-neutral-300">
                This quiz will unlock at <span className="font-semibold text-neutral-800 dark:text-neutral-200">6:00 AM</span> on{' '}
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {new Date(topic.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">💡 Tip: Bookmark this page to return when it's ready!</div>
            </div>
          )}
        </div>

        {/* Countdown or Actions - Simplified with cleaner styling */}
        <div className="space-y-6">
          {isComingSoon ? (
            /* Coming Soon message for topics without questions - Simplified */
            <div className="inline-block px-5 py-3 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <div className="flex items-center space-x-2">
                <div>🚧</div>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Coming soon
                </span>
              </div>
            </div>
          ) : guestLocked ? (
            // Show a prominent sign-in button instead of a badge
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-full shadow-lg px-8 py-4 min-w-[220px] text-base"
              onClick={(e) => {
                e.stopPropagation()
                onExploreGame(topic.topic_id)
              }}
            >
              <Lock className="h-5 w-5 mr-2" /> Sign in to access
            </Button>
          ) : isDateLocked ? (
            /* Clean countdown for date-locked topics */
            <div className="space-y-3">
              <div className="inline-block px-5 py-3 rounded-full bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <Countdown targetDate={getUnlockDate()} isComingSoon={isComingSoon} />
              </div>
              {/* Simple unlock time */}
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {new Date(topic.date).toLocaleDateString('en-US', { 
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Floating Keyboard Command Bar */}
      {showFloatingKeyboard && <FloatingKeyboardBar isVisible={true} isComingSoon={isComingSoon || false} />}
    </div>
  )
}
