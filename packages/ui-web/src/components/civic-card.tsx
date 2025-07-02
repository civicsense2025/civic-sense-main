"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, CheckCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import type { TopicMetadata } from "@civicsense/shared/lib/quiz-data"
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

  const { days, hours, minutes } = timeLeft
  
  const Box = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xl font-semibold min-w-[56px] text-center">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] uppercase tracking-wider mt-1 text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
    </div>
  )

  return (
    <div className="text-center space-y-2">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">Unlocks in</div>
      <div className="flex items-end justify-center gap-3">
        {days > 0 && <Box value={days} label="days" />}
        <Box value={hours} label="hours" />
        <Box value={minutes} label="mins" />
      </div>
    </div>
  )
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
    const origin = new Date(topic.date as string)
    // Start with UTC midnight of that calendar date
    const utcMidnight = new Date(Date.UTC(origin.getUTCFullYear(), origin.getUTCMonth(), origin.getUTCDate(), 0, 0, 0))

    // Determine what hour that UTC time is in New York
    const nyFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hourCycle: 'h23',
      hour: 'numeric'
    })
    const nyHourAtUtcMidnight = Number(nyFormatter.format(utcMidnight))

    // Calculate shift needed so that the New York hour becomes 0 (midnight)
    const shiftHours = (24 - nyHourAtUtcMidnight) % 24
    const unlockUtc = new Date(utcMidnight.getTime() + shiftHours * 60 * 60 * 1000)
    return unlockUtc
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
        isDateLocked ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
      tabIndex={0}
      data-topic-id={topic.topic_id}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
        {/* Card Header */}
        <div className="p-6 sm:p-8 flex-grow">
          {/* Topic Categories */}
          {topic.categories && topic.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {topic.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {topic.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{topic.categories.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Topic Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="text-4xl sm:text-5xl">{topic.emoji}</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 leading-tight">
              {topic.topic_title}
            </h2>
          </div>

          {/* Topic Description */}
          <p className="text-slate-600 dark:text-slate-300 mb-6 text-base">
            {topic.description}
          </p>

          {/* Completion Status */}
          {isCompleted && !isComingSoon && (
            <div className="flex items-center text-green-600 dark:text-green-500 mb-4">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">You've completed this quiz</span>
            </div>
          )}

          {/* Countdown for date-locked content */}
          {isDateLocked && !isComingSoon && (
            <div className="mt-auto">
              <Countdown targetDate={getUnlockDate()} />
            </div>
          )}

          {/* Coming Soon Message */}
          {isComingSoon && (
            <div className="mt-auto text-center space-y-2">
              <div className="inline-block px-4 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium">
                Coming Soon
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We're working on this quiz. Check back soon!
              </p>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            {/* Date Info */}
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(topic.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>

            {/* Action Button */}
            <div>
              {isLocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={!guestLocked}
                >
                  <Lock className="h-4 w-4 mr-1" />
                  <span>{guestLocked ? 'Sign Up to Access' : isComingSoon ? 'Coming Soon' : 'Locked'}</span>
                </Button>
              ) : (
                <Button
                  variant={isCompleted ? "outline" : "default"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {isCompleted ? 'Review Quiz' : 'Start Quiz'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Keyboard Bar */}
      {showFloatingKeyboard && (
        <FloatingKeyboardBar isVisible={true} isComingSoon={!!isComingSoon} />
      )}
    </div>
  )
}
