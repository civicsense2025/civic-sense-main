"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface QuizTopic {
  id: string
  title: string
  emoji: string
  date: string
  dayOfWeek: string
}

interface QuizDateNavigationProps {
  currentTopic: QuizTopic
  previousTopic?: QuizTopic
  nextTopic?: QuizTopic
  availableDates: QuizTopic[]
  onDateSelect: (topicId: string) => void
  onNavigate: (direction: 'prev' | 'next') => void
  className?: string
}

export function QuizDateNavigation({
  currentTopic,
  previousTopic,
  nextTopic,
  availableDates,
  onDateSelect,
  onNavigate,
  className
}: QuizDateNavigationProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [visibleTopics, setVisibleTopics] = useState(20)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle scroll in dropdown to load more topics
  const handleDropdownScroll = useCallback(() => {
    if (!dropdownRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current
    const scrollPosition = scrollTop + clientHeight
    
    // If scrolled to 80% of the way down, load more topics
    if (scrollPosition > scrollHeight * 0.8 && visibleTopics < availableDates.length) {
      setVisibleTopics(prev => Math.min(prev + 20, availableDates.length))
    }
  }, [visibleTopics, availableDates.length])

  // Reset visible topics when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setVisibleTopics(20)
    }
  }, [isDropdownOpen])

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
    return title.slice(0, maxLength) + '...'
  }

  function truncateTitleNav(title: string, maxLength: number = 20) {
    return title.length > maxLength ? title.slice(0, maxLength) + '…' : title;
  }

  const currentDate = formatDate(currentTopic.date, currentTopic.dayOfWeek)

  // Mobile layout - Fixed bottom bar
  if (isMobile) {
    return (
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t",
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

        {/* Current Date Display with Dropdown */}
        <div className="flex-1 px-2">
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-12 p-2 text-center"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{currentTopic.emoji}</span>
                    <Calendar className="h-3 w-3 text-slate-500" />
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                    {currentDate.month} {currentDate.day}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center" 
              className="w-80 max-h-96 overflow-y-auto mb-2"
              ref={dropdownRef}
              onScroll={handleDropdownScroll}
            >
              <div className="p-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 mb-2">
                  Available Quiz Topics
                </div>
                {availableDates.slice(0, visibleTopics).map((topic) => {
                  const topicDate = formatDate(topic.date, topic.dayOfWeek)
                  const isCurrentTopic = topic.id === currentTopic.id
                  
                  return (
                    <DropdownMenuItem
                      key={topic.id}
                      onClick={() => onDateSelect(topic.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer transition-all",
                        "hover:bg-slate-100 dark:hover:bg-slate-800",
                        isCurrentTopic && "bg-slate-50 dark:bg-slate-900 border-l-2 border-blue-500"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm" style={{ fontSize: '1rem', lineHeight: '1rem' }}>{topic.emoji}</span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "font-medium text-sm truncate text-black dark:text-white",
                              isCurrentTopic && "text-blue-600 dark:text-blue-400"
                            )}>
                              {topic.title}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 flex-shrink-0">
                              {topicDate.month} {topicDate.day}, {topicDate.year}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {topicDate.dayOfWeek}
                          </span>
                        </div>
                      </div>
                      {isCurrentTopic && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
                {visibleTopics < availableDates.length && (
                  <div className="text-center py-2 text-xs text-slate-500">
                    Scroll to load more topics...
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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

  // Desktop layout - Top sticky bar (original behavior)
  return (
    <div className={cn(
      "flex items-center justify-between w-full max-w-4xl mx-auto",
      "px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800",
      "sticky top-0 z-20 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95",
      className
    )}>
      {/* Previous Topic Button - Older Topics (Left Arrow) */}
      <Button
        variant="ghost"
        onClick={() => onNavigate('prev')}
        disabled={!previousTopic}
        className={cn(
          "flex items-center gap-2 h-auto p-3 group relative",
          "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
          !previousTopic ? "opacity-40 cursor-not-allowed" : "opacity-40 hover:opacity-100"
        )}
      >
        <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
        <div className="flex flex-col items-start overflow-hidden">
          {previousTopic ? (
            <>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                {formatDate(previousTopic.date, previousTopic.dayOfWeek).month} {formatDate(previousTopic.date, previousTopic.dayOfWeek).day}, {formatDate(previousTopic.date, previousTopic.dayOfWeek).year}
              </div>
              <div className="flex items-center gap-1 font-medium text-sm">
                <span className="text-base">{previousTopic.emoji}</span>
                <span className="text-left transition-all duration-200 group-hover:max-w-[300px] max-w-[120px] whitespace-normal line-clamp-2">
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

      {/* Current Date Dropdown */}
      <DropdownMenu onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-auto p-4 transition-all hover:scale-105 text-slate-900 dark:text-slate-100 font-semibold text-center"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="text-base">{currentTopic.emoji}</span>
                <span className="text-xl font-bold">
                  {currentDate.dayOfWeek}, {currentDate.month} {currentDate.day}, {currentDate.year}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </div>
              <div className="text-slate-600 dark:text-slate-400 mt-1 max-w-[200px] text-center text-xs">
                {truncateTitle(currentTopic.title, 30)}
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="center" 
          className="w-80 max-h-96 overflow-y-auto"
          ref={dropdownRef}
          onScroll={handleDropdownScroll}
        >
          <div className="p-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 mb-2">
              Available Quiz Topics
            </div>
            {availableDates.slice(0, visibleTopics).map((topic) => {
              const topicDate = formatDate(topic.date, topic.dayOfWeek)
              const isCurrentTopic = topic.id === currentTopic.id
              
              return (
                <DropdownMenuItem
                  key={topic.id}
                  onClick={() => onDateSelect(topic.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer transition-all",
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    isCurrentTopic && "bg-slate-50 dark:bg-slate-900 border-l-2 border-blue-500"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm" style={{ fontSize: '1rem', lineHeight: '1rem' }}>{topic.emoji}</span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-medium text-sm truncate text-black dark:text-white",
                          isCurrentTopic && "text-blue-600 dark:text-blue-400"
                        )}>
                          {topic.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 flex-shrink-0">
                          {topicDate.month} {topicDate.day}, {topicDate.year}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {topicDate.dayOfWeek}
                      </span>
                    </div>
                  </div>
                  {isCurrentTopic && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              )
            })}
            {visibleTopics < availableDates.length && (
              <div className="text-center py-2 text-xs text-slate-500">
                Scroll to load more topics...
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Next Topic Button - Newer Topics (Right Arrow) */}
      <Button
        variant="ghost"
        onClick={() => nextTopic && onNavigate('next')}
        disabled={!nextTopic}
        className={cn(
          "flex items-center gap-2 h-auto p-3 group relative",
          "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
          !nextTopic ? "opacity-40 cursor-not-allowed" : "opacity-40 hover:opacity-100"
        )}
      >
        <div className="flex flex-col items-end overflow-hidden">
          {nextTopic ? (
            <>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                {formatDate(nextTopic.date, nextTopic.dayOfWeek).month} {formatDate(nextTopic.date, nextTopic.dayOfWeek).day}, {formatDate(nextTopic.date, nextTopic.dayOfWeek).year}
              </div>
              <div className="flex items-center gap-1 font-medium text-sm">
                <span className="text-right transition-all duration-200 group-hover:max-w-[300px] max-w-[120px] whitespace-normal line-clamp-2">
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
    </div>
  )
}

// Hook for managing quiz navigation state
// NOTE: Topics are in reverse chronological order (newest first)
// Left arrow (←) = previous = older topics (higher index)
// Right arrow (→) = next = newer topics (lower index)
export function useQuizNavigation(topics: QuizTopic[], currentTopicId: string) {
  const currentIndex = topics.findIndex(topic => topic.id === currentTopicId)
  const currentTopic = topics[currentIndex]
  
  // Corrected navigation pattern to match user expectations:
  // previousTopic = older topic (higher index, left arrow ←)
  // nextTopic = newer topic (lower index, right arrow →)
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

// Example usage in your quiz component:
/*
import { QuizDateNavigation, useQuizNavigation } from './quiz-date-navigation'

// Sample data structure you'll need to provide
const sampleTopics: QuizTopic[] = [
  {
    id: '2025_asset_forfeiture_expansion',
    title: 'Trump\'s Strategic Bitcoin Reserve & Asset Forfeiture Expansion',
    emoji: '₿',
    date: '2025-06-15',
    dayOfWeek: 'Sunday'
  },
  {
    id: '2025_federal_ai_oversight',
    title: 'Federal AI Oversight and Ethics Framework',
    emoji: '🤖',
    date: '2025-06-14',
    dayOfWeek: 'Saturday'
  },
  // ... more topics
]

// In your component:
const navigation = useQuizNavigation(sampleTopics, currentTopicId)

<QuizDateNavigation
  currentTopic={navigation.currentTopic}
  previousTopic={navigation.previousTopic}
  nextTopic={navigation.nextTopic}
  availableDates={sampleTopics}
  onDateSelect={(topicId) => {
    // Navigate to selected topic
    router.push(`/quiz/${topicId}`)
  }}
  onNavigate={(direction) => {
    const newTopicId = navigation.navigateToTopic(direction)
    if (newTopicId) {
      router.push(`/quiz/${newTopicId}`)
    }
  }}
/>
*/