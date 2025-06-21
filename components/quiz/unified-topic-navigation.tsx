"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Home, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

interface TopicData {
  id: string
  title: string
  emoji: string
  date: string
  dayOfWeek?: string
  description?: string
}

interface UnifiedTopicNavigationProps {
  currentTopic: TopicData
  allTopics: TopicData[]
  onNavigate: (direction: 'prev' | 'next') => void
  onHome?: () => void // Optional home navigation
  className?: string
  showKeyboardHints?: boolean
  enableKeyboardShortcuts?: boolean
  variant?: 'viewport' | 'header' | 'auto' // auto will choose based on screen size
}

export function UnifiedTopicNavigation({
  currentTopic,
  allTopics,
  onNavigate,
  onHome,
  className,
  showKeyboardHints = false,
  enableKeyboardShortcuts = true,
  variant = 'auto'
}: UnifiedTopicNavigationProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Find current topic index and adjacent topics
  const currentIndex = allTopics.findIndex(topic => topic.id === currentTopic.id)
  
  // Navigation logic: topics are in reverse chronological order (newest first)
  // Previous = older topic (higher index, left arrow ←)
  // Next = newer topic (lower index, right arrow →)
  const previousTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : undefined
  const nextTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : undefined

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'h':
          e.preventDefault()
          if (previousTopic) onNavigate('prev')
          break
        case 'ArrowRight':
        case 'l':
          e.preventDefault()
          if (nextTopic) onNavigate('next')
          break
        case 'Escape':
          e.preventDefault()
          if (onHome) onHome()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previousTopic, nextTopic, onNavigate, onHome, enableKeyboardShortcuts])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    return { month, day, year }
  }

  // Truncate title for display
  const truncateTitle = (title: string, maxLength: number = 20) => {
    return title.length > maxLength ? title.slice(0, maxLength) + '…' : title
  }

  // Determine which variant to use
  const effectiveVariant = variant === 'auto' ? (isMobile ? 'bottom-bar' : 'viewport') : variant

  // Mobile bottom bar variant
  if (effectiveVariant === 'bottom-bar' || (variant === 'auto' && isMobile)) {
    return (
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t",
        "px-3 py-2 flex items-center justify-between",
        className
      )}>
        {/* Previous Topic Button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate('prev')}
          disabled={!previousTopic}
          className={cn(
            "flex-1 h-12 px-2 flex flex-col items-center justify-center",
            "text-slate-600 dark:text-slate-400",
            previousTopic 
              ? "hover:text-slate-900 dark:hover:text-slate-100" 
              : "opacity-40 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs">Older</span>
        </Button>

        {/* Current Topic Display */}
        <div className="flex-1 px-2 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <span className="text-sm">{currentTopic.emoji}</span>
              <Calendar className="h-3 w-3 text-slate-500" />
            </div>
            <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
              {(() => {
                const date = formatDate(currentTopic.date)
                return `${date.month} ${date.day}`
              })()}
            </div>
          </div>
        </div>

        {/* Home Button (if provided) */}
        {onHome && (
          <Button
            variant="ghost"
            onClick={onHome}
            className="h-12 px-3 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Home className="h-4 w-4" />
            <span className="text-xs">Home</span>
          </Button>
        )}

        {/* Next Topic Button */}
        <Button
          variant="ghost"
          onClick={() => nextTopic && onNavigate('next')}
          disabled={!nextTopic}
          className={cn(
            "flex-1 h-12 px-2 flex flex-col items-center justify-center",
            "text-slate-600 dark:text-slate-400",
            nextTopic 
              ? "hover:text-slate-900 dark:hover:text-slate-100" 
              : "opacity-40 cursor-not-allowed"
          )}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="text-xs">Newer</span>
        </Button>
      </div>
    )
  }

  if (effectiveVariant === 'header') {
    // Header variant for quiz topic pages (desktop)
    return (
      <div className={cn(
        "flex items-center justify-between w-full max-w-4xl mx-auto",
        "px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800",
        "sticky top-0 z-20 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95",
        className
      )}>
        {/* Previous Topic Button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate('prev')}
          disabled={!previousTopic}
          className={cn(
            "flex items-center gap-2 h-auto p-3 group relative",
            "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
            !previousTopic && "opacity-40 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <div className="flex flex-col items-start overflow-hidden">
            {previousTopic ? (
              <>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  {(() => {
                    const date = formatDate(previousTopic.date)
                    return `${date.month} ${date.day}, ${date.year}`
                  })()}
                </div>
                <div className="flex items-center gap-1 font-medium text-sm">
                  <span className="text-base">{previousTopic.emoji}</span>
                  <span className="text-left transition-all duration-200 group-hover:max-w-[300px] max-w-[120px] truncate">
                    {previousTopic.title}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm font-medium">
                Older Topics
              </div>
            )}
          </div>
        </Button>

        {/* Current Topic Display */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-base">{currentTopic.emoji}</span>
            <span className="text-xl font-bold">
              {(() => {
                const date = formatDate(currentTopic.date)
                const dayOfWeek = currentTopic.dayOfWeek || new Date(currentTopic.date).toLocaleDateString('en-US', { weekday: 'long' })
                return `${dayOfWeek}, ${date.month} ${date.day}, ${date.year}`
              })()}
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-400 mt-1 max-w-[200px] text-center text-xs">
            {truncateTitle(currentTopic.title, 30)}
          </div>
        </div>

        {/* Next Topic Button */}
        <Button
          variant="ghost"
          onClick={() => nextTopic && onNavigate('next')}
          disabled={!nextTopic}
          className={cn(
            "flex items-center gap-2 h-auto p-3 group relative",
            "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
            !nextTopic && "opacity-40 cursor-not-allowed"
          )}
        >
          <div className="flex flex-col items-end overflow-hidden">
            {nextTopic ? (
              <>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  {(() => {
                    const date = formatDate(nextTopic.date)
                    return `${date.month} ${date.day}, ${date.year}`
                  })()}
                </div>
                <div className="flex items-center gap-1 font-medium text-sm">
                  <span className="text-right transition-all duration-200 group-hover:max-w-[300px] max-w-[120px] truncate">
                    {nextTopic.title}
                  </span>
                  <span className="text-base">{nextTopic.emoji}</span>
                </div>
              </>
            ) : (
              <div className="text-sm font-medium">
                Newer Topics
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>

        {/* Keyboard hints */}
        {showKeyboardHints && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 hidden md:block">
            Use ← → arrow keys to navigate
          </div>
        )}
      </div>
    )
  }

  // Viewport variant for desktop - floating side buttons (original)
  return (
    <>
      {/* Previous Topic - Left Viewport Edge */}
      {previousTopic && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <button
            onClick={() => onNavigate('prev')}
            className="group relative h-auto py-3 pl-4 pr-4 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 hover:border-primary/20 rounded-lg flex items-center gap-3 overflow-hidden transition-all duration-500 ease-out opacity-40 hover:opacity-100"
            style={{
              width: 'auto',
              minWidth: '160px',
              maxWidth: '160px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.maxWidth = '400px'
              e.currentTarget.style.paddingRight = '24px'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.maxWidth = '160px'
              e.currentTarget.style.paddingRight = '16px'
            }}
            aria-label={`Previous topic: ${previousTopic.title}`}
          >
            <ChevronLeft className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors duration-300 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <span className="text-lg flex-shrink-0">{previousTopic.emoji}</span>
              <div className="flex flex-col items-start min-w-0 overflow-hidden">
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {(() => {
                    const date = formatDate(previousTopic.date)
                    return `${date.month} ${date.day}, ${date.year}`
                  })()}
                </div>
                <div className="text-sm font-medium text-slate-900 text-left whitespace-normal">
                  <span className="inline-block transition-all duration-500 ease-out line-clamp-2">
                    {previousTopic.title}
                  </span>
                </div>
                {/* Description that slides in smoothly */}
                {previousTopic.description && (
                  <div className="text-xs text-slate-600 text-left max-h-0 group-hover:max-h-10 overflow-hidden transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 mt-0 group-hover:mt-1">
                    <div className="whitespace-normal line-clamp-2">
                      {previousTopic.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Next Topic - Right Viewport Edge */}
      {nextTopic && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <button
            onClick={() => onNavigate('next')}
            className="group relative h-auto py-3 pl-4 pr-4 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 hover:border-primary/20 rounded-lg flex items-center gap-3 overflow-hidden transition-all duration-500 ease-out opacity-40 hover:opacity-100"
            style={{
              width: 'auto',
              minWidth: '160px',
              maxWidth: '160px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.maxWidth = '400px'
              e.currentTarget.style.paddingLeft = '24px'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.maxWidth = '160px'
              e.currentTarget.style.paddingLeft = '16px'
            }}
            aria-label={`Next topic: ${nextTopic.title}`}
          >
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <div className="flex flex-col items-start min-w-0 overflow-hidden">
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {(() => {
                    const date = formatDate(nextTopic.date)
                    return `${date.month} ${date.day}, ${date.year}`
                  })()}
                </div>
                <div className="text-sm font-medium text-slate-900 text-left whitespace-normal">
                  <span className="inline-block transition-all duration-500 ease-out line-clamp-2">
                    {nextTopic.title}
                  </span>
                </div>
                {/* Description that slides in smoothly */}
                {nextTopic.description && (
                  <div className="text-xs text-slate-600 text-left max-h-0 group-hover:max-h-10 overflow-hidden transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 mt-0 group-hover:mt-1">
                    <div className="whitespace-normal line-clamp-2">
                      {nextTopic.description}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-lg flex-shrink-0">{nextTopic.emoji}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors duration-300 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Keyboard shortcuts hint for desktop viewport */}
      {showKeyboardHints && !isMobile && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
            Use ← → arrow keys or H/L to navigate{onHome && ' • ESC for home'}
          </div>
        </div>
      )}
    </>
  )
}

// Hook for managing navigation state
export function useTopicNavigation(topics: TopicData[], currentTopicId: string) {
  const currentIndex = topics.findIndex(topic => topic.id === currentTopicId)
  const currentTopic = topics[currentIndex]
  
  // Navigation logic: topics are in reverse chronological order (newest first)
  // Previous = older topic (higher index, left arrow ←)  
  // Next = newer topic (lower index, right arrow →)
  const previousTopic = currentIndex < topics.length - 1 ? topics[currentIndex + 1] : undefined
  const nextTopic = currentIndex > 0 ? topics[currentIndex - 1] : undefined

  const navigateToTopic = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && previousTopic) {
      return previousTopic.id
    }
    if (direction === 'next' && nextTopic) {
      return nextTopic.id
    }
    return null
  }

  return {
    currentTopic,
    previousTopic,
    nextTopic,
    navigateToTopic,
    currentIndex,
    totalTopics: topics.length
  }
} 