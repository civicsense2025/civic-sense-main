"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Search, ChevronDown, Clock, Users, Zap, Target, MoreHorizontal } from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

interface TopicData {
  topic_id: string
  topic_title: string
  description?: string
  emoji: string
  date: string
  questionCount: number
  questionTypes: Record<string, number>
  categoryDetails: Array<{ name: string; emoji: string }>
  hasQuestions: boolean
  averageDifficulty: number
  difficultyLabel: string
  readingTime: number
}

interface TopicSelectorProps {
  selectedTopic: string | null
  onTopicSelect: (topicId: string | null) => void
  className?: string
}

export function TopicSelector({ selectedTopic, onTopicSelect, className }: TopicSelectorProps) {
  const [topics, setTopics] = useState<TopicData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'questions' | 'difficulty' | 'relevance'>('date')
  const [error, setError] = useState<string | null>(null)
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const limit = 24 // Increased for grid layout

  // Search API call
  const searchTopics = useCallback(async (query: string, currentOffset: number, isNewSearch = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/topics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          offset: currentOffset,
          limit,
          sortBy: query.trim() ? 'relevance' : sortBy,
          hasQuestions: true, // Only show topics with questions for multiplayer
          categories: [],
          difficulty: [],
          includeAll: true // Add this to ensure we get all topics
        })
      })

      if (!response.ok) {
        throw new Error('Failed to search topics')
      }

      const data = await response.json()
      
      if (isNewSearch) {
        setTopics(data.topics)
      } else {
        setTopics(prev => [...prev, ...data.topics])
      }
      
      setHasMore(data.hasMore)
      setOffset(currentOffset + limit)
      
    } catch (error) {
      console.error('Error searching topics:', error)
      setError('Failed to load topics. Please try again.')
    } finally {
      setIsLoading(false)
      setIsInitialLoading(false)
    }
  }, [limit, sortBy])

  // Initial load
  useEffect(() => {
    searchTopics('', 0, true)
  }, [searchTopics])

  // Search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setOffset(0)
      searchTopics(searchQuery, 0, true)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchTopics])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoading || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    
    if (scrollHeight - scrollTop <= clientHeight + 200) { // Trigger earlier for grid
      searchTopics(searchQuery, offset, false)
    }
  }, [searchQuery, offset, isLoading, hasMore, searchTopics])

  // Attach scroll listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 1.5) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    if (difficulty <= 2.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    if (difficulty <= 3.5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  if (isInitialLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search and Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-600"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTopicSelect(null)}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-all flex items-center gap-2 whitespace-nowrap",
                    !selectedTopic 
                      ? "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white" 
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  )}
                >
                  <span className="text-base">🎲</span>
                  <span className="text-sm">Random</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose a random topic</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Sort:</span>
          {['date', 'questions', 'difficulty'].map((sort) => (
            <TooltipProvider key={sort}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSortBy(sort as any)}
                    className={cn(
                      "px-3 py-1 rounded-full border transition-colors capitalize",
                      sortBy === sort
                        ? "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    {sort}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {sort === 'date' && 'Sort by newest first'}
                    {sort === 'questions' && 'Sort by number of questions'}
                    {sort === 'difficulty' && 'Sort by difficulty level'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button
            onClick={() => searchTopics(searchQuery, 0, true)}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Topics Grid */}
      <div 
        ref={scrollContainerRef}
        className="max-h-96 overflow-y-auto scroll-smooth"
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
          {topics.map((topic) => (
            <TooltipProvider key={topic.topic_id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onTopicSelect(topic.topic_id)}
                    className={cn(
                      "text-left p-4 rounded-xl transition-all duration-200 border group hover:shadow-sm w-full",
                      selectedTopic === topic.topic_id
                        ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/50 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0 mt-0.5">{topic.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white text-sm leading-tight line-clamp-2">
                            {topic.topic_title}
                          </div>
                        </div>
                      </div>

                      {/* Compact Metadata */}
                      <div className="flex items-center justify-between text-xs">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <Target className="h-3 w-3" />
                                <span>{topic.questionCount}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{topic.questionCount} questions available</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="flex items-center gap-2">
                          {/* Category badge - only show first one */}
                          {topic.categoryDetails[0] && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                    {topic.categoryDetails[0].emoji}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{topic.categoryDetails[0].name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {/* Difficulty */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  className={cn(
                                    "text-xs px-1.5 py-0.5 border-0",
                                    getDifficultyColor(topic.averageDifficulty)
                                  )}
                                >
                                  {topic.difficultyLabel.charAt(0)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{topic.difficultyLabel} Difficulty</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{topic.description || topic.topic_title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Loading More */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && hasMore && topics.length > 0 && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => searchTopics(searchQuery, offset, false)}
              className="flex items-center gap-2"
            >
              <MoreHorizontal className="h-4 w-4" />
              Load More
            </Button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && topics.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-500">
            {searchQuery ? `No topics found for "${searchQuery}"` : 'No topics available'}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedTopic && (
        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Selected: <span className="font-medium">
              {topics.find(t => t.topic_id === selectedTopic)?.topic_title}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 