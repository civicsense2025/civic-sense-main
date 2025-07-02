"use client"

import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { parseTopicDate } from "../../utils"
import type { TopicMetadata } from "@civicsense/shared/lib/quiz-data"

interface CardNavigationProps {
  currentIndex: number
  highlightedNavIndex?: number // For keyboard navigation highlight
  totalTopics: number
  topics: TopicMetadata[]
  onPrevious: () => void
  onNext: () => void
  onTopicSelect: (index: number) => void
  className?: string
}

export function CardNavigation({
  currentIndex,
  highlightedNavIndex,
  totalTopics,
  topics,
  onPrevious,
  onNext,
  onTopicSelect,
  className
}: CardNavigationProps) {
  const hasOlder = currentIndex < totalTopics - 1  // Can go to older topics (left)
  const hasNewer = currentIndex > 0              // Can go to newer topics (right)
  
  // Calculate how many topics to show based on screen size (responsive)
  const getVisibleCount = () => {
    // This will be handled by CSS grid, but we'll show enough topics to fill largest screen
    return 6 // Show up to 6 topics to cover xl screens
  }
  
  const getStartIndex = () => {
    const visibleCount = getVisibleCount()
    // Try to keep current topic visible, preferably near the start
    const maxStartIndex = Math.max(0, topics.length - visibleCount)
    return Math.min(currentIndex, maxStartIndex)
  }
  
  const getCurrentPageTopics = () => {
    const startIndex = getStartIndex()
    const visibleCount = getVisibleCount()
    const topicsSlice = topics.slice(startIndex, startIndex + visibleCount)
    // Reverse the order so oldest topics appear on the left, newest on the right
    return topicsSlice.reverse()
  }

  const currentTopic = topics[currentIndex]
  const previousTopic = currentIndex < totalTopics - 1 ? topics[currentIndex + 1] : null
  const nextTopic = currentIndex > 0 ? topics[currentIndex - 1] : null
  
  return (
    <div className={`
      flex items-center justify-center gap-2 sm:gap-4 px-2 sm:px-4 
      md:relative md:bottom-auto
      ${className || ''}
    `}>
      {/* Mobile-only Simple Navigation */}
      <div className="flex sm:hidden items-center justify-between w-full max-w-sm gap-4">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={!hasOlder}
          className="h-16 flex-1 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md flex flex-col items-start justify-center gap-1 p-3"
          title={previousTopic ? `Previous: ${previousTopic.topic_title}` : "No previous topics"}
        >
          <div className="flex items-center gap-2 w-full">
            <ChevronLeft className="h-3 w-3 text-slate-500" />
            {previousTopic ? (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {parseTopicDate(previousTopic.date)?.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                No previous
              </span>
            )}
          </div>
          {previousTopic && (
            <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 text-left w-full">
              {previousTopic.topic_title.length > 24 
                ? previousTopic.topic_title.slice(0, 24) + '...' 
                : previousTopic.topic_title}
            </span>
          )}
        </Button>

        {/* Current Topic Indicator */}
        {currentTopic && (
          <div className="flex flex-col items-center justify-center min-w-0 px-2">
            <div className="text-lg">{currentTopic.emoji || '📝'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              {parseTopicDate(currentTopic.date)?.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        )}

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!hasNewer}
          className="h-16 flex-1 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md flex flex-col items-end justify-center gap-1 p-3"
          title={nextTopic ? `Next: ${nextTopic.topic_title}` : "No next topics"}
        >
          <div className="flex items-center gap-2 w-full justify-end">
            {nextTopic ? (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {parseTopicDate(nextTopic.date)?.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                No next
              </span>
            )}
            <ChevronRight className="h-3 w-3 text-slate-500" />
          </div>
          {nextTopic && (
            <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 text-right w-full">
              {nextTopic.topic_title.length > 24 
                ? nextTopic.topic_title.slice(0, 24) + '...' 
                : nextTopic.topic_title}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop Grid Navigation (hidden on mobile) */}
      <div className="hidden sm:flex items-center justify-center gap-2 sm:gap-4">
        {/* Older Topics Arrow (Left) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={!hasOlder}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          title="Older topics"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        
        {/* Topic Cards Grid - Responsive columns */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 w-full max-w-6xl">
            {getCurrentPageTopics().map((topic, pageIndex) => {
              const startIndex = getStartIndex()
              const visibleCount = getVisibleCount()
              // Since we reversed the topics, we need to calculate the actual index differently
              const actualIndex = startIndex + (visibleCount - 1 - pageIndex)
              const isActive = actualIndex === currentIndex
              const isHighlighted = highlightedNavIndex !== undefined && actualIndex === highlightedNavIndex
              const topicDate = parseTopicDate(topic.date)
              
              return (
                <div
                  key={topic.topic_id}
                  onClick={() => onTopicSelect(actualIndex)}
                  className={`
                    relative overflow-hidden rounded-lg transition-all duration-200 cursor-pointer 
                    h-16 sm:h-20 md:h-22 lg:h-24 flex flex-col w-full min-w-0
                    ${isActive 
                      ? 'bg-blue-100/80 dark:bg-blue-900/60 shadow-md scale-105 ring-2 ring-blue-500' 
                      : isHighlighted
                      ? 'bg-slate-200/80 dark:bg-slate-700/80 shadow-md ring-2 ring-slate-400 dark:ring-slate-500'
                      : 'bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:shadow-sm'
                    }
                  `}
                >
                  {/* Pulsing gradient outline for active card */}
                  {isActive && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 rounded-lg blur-sm opacity-75 animate-pulse"></div>
                  )}
                  
                  {/* Keyboard navigation outline for highlighted card */}
                  {isHighlighted && !isActive && (
                    <div className="absolute -inset-0.5 bg-slate-400 dark:bg-slate-500 rounded-lg opacity-50"></div>
                  )}
                  
                  {/* Card content wrapper */}
                  <div className="relative bg-inherit rounded-lg h-full">
                    <div className="flex items-center justify-start p-1.5 sm:p-2 md:p-3 h-full gap-1.5 sm:gap-2 md:gap-3">
                      <div className="text-sm sm:text-lg md:text-xl flex-shrink-0">{topic.emoji || '📝'}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight mb-1">
                          {topic.topic_title}
                        </h3>
                        <div className="text-xs font-space-mono text-slate-500 dark:text-slate-400">
                          {topicDate?.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500"></div>
                    )}
                    {isHighlighted && !isActive && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-400 dark:bg-slate-500"></div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Newer Topics Arrow (Right) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!hasNewer}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          title="Newer topics"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  )
} 