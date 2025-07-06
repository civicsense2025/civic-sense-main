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
  const [isTablet, setIsTablet] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  // Enhanced device detection
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 640) // Tailwind sm breakpoint
      setIsTablet(width >= 640 && width < 1024) // Tailwind sm to lg
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
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
    let headerElement = document.getElementById(headerElementId)
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
    if (isMobile) {
      // Shorter format for mobile
      return date.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric' 
      })
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Enhanced title truncation with device-specific lengths
  const truncateTitle = (title: string) => {
    if (isMobile) {
      return title.length <= 12 ? title : title.slice(0, 12) + '…'
    } else if (isTablet) {
      return title.length <= 20 ? title : title.slice(0, 20) + '…'
    } else {
      return title.length <= 30 ? title : title.slice(0, 30) + '…'
    }
  }

  // Dynamically calculate top position based on header visibility
  const getTopPosition = () => {
    if (isHeaderVisible) {
      return 'top-16' // Header height (64px)
    } else {
      return 'top-0' // Flush to top of viewport when header is hidden
    }
  }

  // Enhanced responsive container classes
  const getContainerClasses = () => {
    return cn(
      // Base mobile-first layout
      "flex items-center justify-between",
      // Mobile: smaller height and padding
      "h-14 px-3 py-2",
      // Tablet: medium sizing
      "sm:h-16 sm:px-4 sm:py-3",
      // Desktop: full sizing
      "lg:px-6 lg:py-4"
    )
  }

  // Enhanced responsive button classes
  const getButtonClasses = (disabled: boolean) => {
    return cn(
      // Base mobile-first styling
      "flex items-center gap-2 h-auto group flex-1 transition-all duration-200",
      "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
      // Mobile: smaller padding, touch-friendly
      "p-2 min-h-[44px] active:scale-95",
      // Tablet: medium padding
      "sm:p-3 sm:gap-3",
      // Desktop: full padding
      "lg:p-4",
      // State-dependent styling
      disabled 
        ? "opacity-40 cursor-not-allowed" 
        : "hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700"
    )
  }

  // Enhanced text sizing classes
  const getTextClasses = (type: 'date' | 'title' | 'label') => {
    switch (type) {
      case 'date':
        return cn(
          // Mobile: smaller date text
          "text-xs font-mono text-slate-500 dark:text-slate-400",
          // Desktop: slightly larger
          "lg:text-xs"
        )
      case 'title':
        return cn(
          // Mobile: smaller title
          "text-xs font-medium text-slate-900 dark:text-slate-100 truncate",
          // Tablet: medium
          "sm:text-sm",
          // Desktop: full size
          "lg:text-sm"
        )
      case 'label':
        return cn(
          // Mobile: smaller label
          "text-xs font-medium text-slate-500",
          // Desktop: standard
          "lg:text-sm"
        )
      default:
        return ""
    }
  }

  // Enhanced icon sizing
  const getIconClasses = () => {
    return cn(
      // Mobile: smaller icons
      "h-4 w-4 transition-transform duration-200",
      // Desktop: larger icons
      "lg:h-5 lg:w-5"
    )
  }

  if (!isSticky) return null

  // Enhanced mobile-optimized loading skeleton
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "fixed left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
          "border-b border-slate-200 dark:border-slate-800 shadow-lg",
          "transition-all duration-300 ease-in-out",
          getTopPosition(),
          className
        )}
        {...{
          role: "navigation" as const,
          "aria-label": "Quiz topic navigation (loading)" as const
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className={getContainerClasses()}>
            {/* Loading skeleton - Previous topic */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start">
              <div className="h-4 w-4 lg:h-5 lg:w-5 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              <div className="flex flex-col gap-1 sm:gap-2">
                <div className="h-2 w-8 sm:h-3 sm:w-12 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
                <div className="h-3 w-16 sm:h-4 sm:w-20 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              </div>
            </div>
            
            {/* Loading skeleton - Next topic */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
              <div className="flex flex-col gap-1 sm:gap-2 items-end">
                <div className="h-2 w-8 sm:h-3 sm:w-12 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
                <div className="h-3 w-16 sm:h-4 sm:w-20 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              </div>
              <div className="h-4 w-4 lg:h-5 lg:w-5 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
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
          "transition-all duration-300 ease-in-out",
          getTopPosition(),
          className
        )}
        {...{
          role: "navigation" as const,
          "aria-label": "Quiz topic navigation" as const
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className={getContainerClasses()}>
            
            {/* Previous Topic Button */}
            <Button
              variant="ghost"
              onClick={() => onNavigate('prev')}
              disabled={!previousTopic}
              aria-label={previousTopic ? `Previous topic: ${previousTopic.title}` : 'No previous topic'}
              className={cn(
                getButtonClasses(!previousTopic),
                "justify-start"
              )}
            >
              <ChevronLeft className={cn(
                getIconClasses(),
                "group-hover:-translate-x-1"
              )} />
              <div className="flex flex-col items-start text-left min-w-0 flex-1">
                {previousTopic ? (
                  <>
                    <div className={getTextClasses('date')}>
                      {formatDate(previousTopic.date)}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 min-w-0">
                      <span className="text-xs sm:text-sm flex-shrink-0">
                        {previousTopic.emoji}
                      </span>
                      <span className={cn(
                        getTextClasses('title'),
                        // Responsive max widths
                        "max-w-[80px] sm:max-w-[120px] lg:max-w-[180px]"
                      )}>
                        {truncateTitle(previousTopic.title)}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className={getTextClasses('label')}>
                    {isMobile ? "No older" : "No older topics"}
                  </span>
                )}
              </div>
            </Button>

            {/* Mobile-only current topic indicator */}
            {isMobile && currentTopic && (
              <div className="flex items-center justify-center flex-shrink-0 px-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{currentTopic.emoji}</span>
                  <div className="h-1 w-1 bg-slate-400 rounded-full"></div>
                  <div className="h-1 w-1 bg-slate-400 rounded-full"></div>
                  <div className="h-1 w-1 bg-slate-400 rounded-full"></div>
                </div>
              </div>
            )}

            {/* Next Topic Button */}
            <Button
              variant="ghost"
              onClick={() => onNavigate('next')}
              disabled={!nextTopic}
              aria-label={nextTopic ? `Next topic: ${nextTopic.title}` : 'No next topic'}
              className={cn(
                getButtonClasses(!nextTopic),
                "justify-end"
              )}
            >
              <div className="flex flex-col items-end text-right min-w-0 flex-1">
                {nextTopic ? (
                  <>
                    <div className={getTextClasses('date')}>
                      {formatDate(nextTopic.date)}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 min-w-0">
                      <span className={cn(
                        getTextClasses('title'),
                        // Responsive max widths
                        "max-w-[80px] sm:max-w-[120px] lg:max-w-[180px]"
                      )}>
                        {truncateTitle(nextTopic.title)}
                      </span>
                      <span className="text-xs sm:text-sm flex-shrink-0">
                        {nextTopic.emoji}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className={getTextClasses('label')}>
                    {isMobile ? "No newer" : "No newer topics"}
                  </span>
                )}
              </div>
              <ChevronRight className={cn(
                getIconClasses(),
                "group-hover:translate-x-1"
              )} />
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