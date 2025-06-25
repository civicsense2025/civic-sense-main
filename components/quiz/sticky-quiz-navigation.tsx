"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface QuizTopic {
  id: string
  title: string
  emoji: string
  date: string
  dayOfWeek: string
}

interface StickyQuizNavigationProps {
  currentTopic: QuizTopic
  previousTopic?: QuizTopic
  nextTopic?: QuizTopic
  onNavigate: (direction: 'prev' | 'next') => void
  onTopicSelect?: (topicId: string) => void
  triggerElementId?: string // ID of element to observe for sticky behavior
  headerElementId?: string // ID of header element to track visibility
  className?: string
  isLoading?: boolean // Add loading state support
}

export function StickyQuizNavigation({
  currentTopic,
  previousTopic,
  nextTopic,
  onNavigate,
  onTopicSelect,
  triggerElementId = "democracy-decoded-section",
  headerElementId = "main-header", // Default header ID
  className,
  isLoading
}: StickyQuizNavigationProps) {
  const [isSticky, setIsSticky] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Intersection Observer to track when to show sticky navigation
  useEffect(() => {
    const triggerElement = document.getElementById(triggerElementId)
    if (!triggerElement) {
      console.warn(`StickyQuizNavigation: Element with ID "${triggerElementId}" not found`)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        // Show sticky nav when the trigger element is out of view (scrolled past)
        setIsSticky(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -80px 0px' // Better trigger point - when element is 80px out of view
      }
    )

    observer.observe(triggerElement)
    
    return () => {
      observer.disconnect()
    }
  }, [triggerElementId])

  // Intersection Observer to track header visibility
  useEffect(() => {
    const headerElement = document.getElementById(headerElementId)
    if (!headerElement) {
      // Try common header selectors as fallback
      const fallbackHeader = document.querySelector('header') || 
                           document.querySelector('[role="banner"]') ||
                           document.querySelector('.header')
      if (!fallbackHeader) {
        console.warn(`StickyQuizNavigation: Header element with ID "${headerElementId}" not found`)
        return
      }
      headerElement = fallbackHeader as HTMLElement
    }

    const headerObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        // Header is visible when it's intersecting with the viewport
        setIsHeaderVisible(entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px' // Trigger exactly when header enters/exits viewport
      }
    )

    headerObserver.observe(headerElement)
    
    return () => {
      headerObserver.disconnect()
    }
  }, [headerElementId])

  // Keyboard navigation for left/right topic navigation
  useEffect(() => {
    if (!isSticky) return // Only enable keyboard shortcuts when sticky nav is visible

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return
      }

      // Don't trigger if modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (previousTopic) {
            event.preventDefault()
            onNavigate('prev')
          }
          break
        case 'ArrowRight':
          if (nextTopic) {
            event.preventDefault()
            onNavigate('next')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSticky, previousTopic, nextTopic, onNavigate])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Truncate title for mobile
  const truncateTitle = (title: string) => {
    const maxLength = isMobile ? 15 : 25 // Much shorter on mobile
    if (title.length <= maxLength) return title
    return title.slice(0, maxLength) + '…'
  }

  // Dynamically calculate top position based on header visibility
  const getTopPosition = () => {
    if (isHeaderVisible) {
      return 'top-16' // Header height (64px)
    } else {
      return 'top-0' // Flush to top of viewport when header is hidden
    }
  }

  if (!isSticky) return null

  // Show loading skeleton if topics are still being fetched
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "fixed left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
          "border-b border-slate-200 dark:border-slate-800 shadow-lg",
          "transition-all duration-300 ease-in-out", // Smooth transition for position changes
          getTopPosition(),
          className
        )}
        {...{
          role: "navigation" as const,
          "aria-label": "Quiz topic navigation (loading)" as const
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Loading skeleton - Previous topic */}
            <div className="flex items-center gap-3 p-3 flex-1 justify-start">
              <div className="h-5 w-5 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-16 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              </div>
            </div>
            
            {/* Loading skeleton - Next topic */}
            <div className="flex items-center gap-3 p-3 flex-1 justify-end">
              <div className="flex flex-col gap-2 items-end">
                <div className="h-3 w-16 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              </div>
              <div className="h-5 w-5 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "fixed left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
          "border-b border-slate-200 dark:border-slate-800 shadow-lg",
          "transition-all duration-300 ease-in-out", // Smooth transition for position changes
          getTopPosition(),
          className
        )}
        {...{
          role: "navigation" as const,
          "aria-label": "Quiz topic navigation" as const
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Previous Topic Button */}
            <Button
              variant="ghost"
              onClick={() => onNavigate('prev')}
              disabled={!previousTopic}
              aria-label={previousTopic ? `Previous topic: ${previousTopic.title}` : 'No previous topic'}
              className={cn(
                "flex items-center gap-3 h-auto p-3 group flex-1 justify-start",
                "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                "transition-all duration-200",
                !previousTopic ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <ChevronLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
              <div className="flex flex-col items-start text-left min-w-0">
                {previousTopic ? (
                  <>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {formatDate(previousTopic.date)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">{previousTopic.emoji}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px]">
                        {truncateTitle(previousTopic.title)}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-500">No older topics</span>
                )}
              </div>
            </Button>

            {/* Next Topic Button */}
            <Button
              variant="ghost"
              onClick={() => onNavigate('next')}
              disabled={!nextTopic}
              aria-label={nextTopic ? `Next topic: ${nextTopic.title}` : 'No next topic'}
              className={cn(
                "flex items-center gap-3 h-auto p-3 group flex-1 justify-end",
                "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                "transition-all duration-200",
                !nextTopic ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <div className="flex flex-col items-end text-right min-w-0">
                {nextTopic ? (
                  <>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {formatDate(nextTopic.date)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px]">
                        {truncateTitle(nextTopic.title)}
                      </span>
                      <span className="text-sm">{nextTopic.emoji}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-500">No newer topics</span>
                )}
              </div>
              <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for managing sticky quiz navigation data
export function useStickyQuizNavigation(topics: QuizTopic[], currentTopicId: string) {
  const currentIndex = topics.findIndex(topic => topic.id === currentTopicId)
  const currentTopic = topics[currentIndex]
  
  // Note: Topics are in reverse chronological order (newest first)
  // Previous = older topic (higher index)
  // Next = newer topic (lower index)
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