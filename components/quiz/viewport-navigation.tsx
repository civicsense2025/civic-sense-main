"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface NavigationTopic {
  id: string
  title: string
  emoji: string
  date: string
  dayOfWeek: string
}

interface ViewportNavigationProps {
  currentTopic: NavigationTopic
  previousTopic?: NavigationTopic
  nextTopic?: NavigationTopic
  onNavigate: (direction: 'prev' | 'next') => void
  className?: string
  showKeyboardHints?: boolean
  enableKeyboardShortcuts?: boolean
}

export function ViewportNavigation({
  currentTopic,
  previousTopic,
  nextTopic,
  onNavigate,
  className,
  showKeyboardHints = false,
  enableKeyboardShortcuts = true
}: ViewportNavigationProps) {
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

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          if (previousTopic) onNavigate('prev')
          break
        case 'ArrowRight':
          event.preventDefault()
          if (nextTopic) onNavigate('next')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [previousTopic, nextTopic, onNavigate, enableKeyboardShortcuts])

  // Format date for display
  const formatDate = (dateString: string, dayOfWeek: string) => {
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    return { month, day, year, dayOfWeek }
  }

  // Truncate title for mobile
  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (!isMobile || title.length <= maxLength) return title
    return title.slice(0, maxLength) + '…'
  }

  return (
    <div className={cn("fixed inset-y-0 z-30 pointer-events-none", className)}>
      {/* Previous Topic Button - Left Edge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => onNavigate('prev')}
              disabled={!previousTopic}
              className={cn(
                "fixed left-2 top-1/2 -translate-y-1/2 pointer-events-auto",
                "flex items-center gap-2 h-auto p-3 transition-all hover:scale-105",
                "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700",
                "shadow-lg hover:shadow-xl rounded-full",
                !previousTopic && "opacity-40 cursor-not-allowed hover:scale-100",
                isMobile ? "w-12 h-12 p-0" : "min-w-[120px]"
              )}
            >
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              {!isMobile && previousTopic && (
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                    {formatDate(previousTopic.date, previousTopic.dayOfWeek).month} {formatDate(previousTopic.date, previousTopic.dayOfWeek).day}
                  </div>
                  <div className="flex items-center gap-1 font-medium text-sm">
                    <span className="text-base">{previousTopic.emoji}</span>
                    <span className="text-left max-w-[80px] truncate">
                      {truncateTitle(previousTopic.title, 15)}
                    </span>
                  </div>
                </div>
              )}
            </Button>
          </TooltipTrigger>
          {previousTopic && (
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{previousTopic.title}</p>
                <p className="text-xs text-muted-foreground">
                  {previousTopic.dayOfWeek}, {formatDate(previousTopic.date, previousTopic.dayOfWeek).month} {formatDate(previousTopic.date, previousTopic.dayOfWeek).day}, {formatDate(previousTopic.date, previousTopic.dayOfWeek).year}
                </p>
                {showKeyboardHints && (
                  <p className="text-xs text-muted-foreground">Press ← to navigate</p>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* Next Topic Button - Right Edge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => nextTopic && onNavigate('next')}
              disabled={!nextTopic}
              className={cn(
                "fixed right-2 top-1/2 -translate-y-1/2 pointer-events-auto",
                "flex items-center gap-2 h-auto p-3 transition-all",
                "text-slate-600 dark:text-slate-400",
                "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700",
                "shadow-lg rounded-full",
                nextTopic 
                  ? "hover:scale-105 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-xl" 
                  : "opacity-40 cursor-not-allowed",
                isMobile ? "w-12 h-12 p-0" : "min-w-[120px]"
              )}
            >
              {!isMobile && nextTopic && (
                <div className="flex flex-col items-end min-w-0">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                    {formatDate(nextTopic.date, nextTopic.dayOfWeek).month} {formatDate(nextTopic.date, nextTopic.dayOfWeek).day}
                  </div>
                  <div className="flex items-center gap-1 font-medium text-sm">
                    <span className="text-right max-w-[80px] truncate">
                      {truncateTitle(nextTopic.title, 15)}
                    </span>
                    <span className="text-base">{nextTopic.emoji}</span>
                  </div>
                </div>
              )}
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            </Button>
          </TooltipTrigger>
          {nextTopic ? (
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{nextTopic.title}</p>
                <p className="text-xs text-muted-foreground">
                  {nextTopic.dayOfWeek}, {formatDate(nextTopic.date, nextTopic.dayOfWeek).month} {formatDate(nextTopic.date, nextTopic.dayOfWeek).day}, {formatDate(nextTopic.date, nextTopic.dayOfWeek).year}
                </p>
                {showKeyboardHints && (
                  <p className="text-xs text-muted-foreground">Press → to navigate</p>
                )}
              </div>
            </TooltipContent>
          ) : (
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">
                You've reached the end of our current topic collection. 
                New civic education content is added regularly—check back for more!
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// Hook for managing navigation state (similar to quiz navigation)
export function useViewportNavigation(topics: NavigationTopic[], currentTopicId: string) {
  const currentIndex = topics.findIndex(topic => topic.id === currentTopicId)
  const currentTopic = topics[currentIndex]
  
  // Navigation pattern: previous = older topic (higher index), next = newer topic (lower index)
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