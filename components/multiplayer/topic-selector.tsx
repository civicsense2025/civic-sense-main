"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, Clock, Users, Zap, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const limit = 20

  // Search API call
  const searchTopics = useCallback(async (query: string, currentOffset: number, isNewSearch = false) => {
    try {
      setIsLoading(true)
      
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
          difficulty: []
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
    
    if (scrollHeight - scrollTop <= clientHeight + 100) {
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
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
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
            <span className="text-sm">Random Topic</span>
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Sort by:</span>
          {['date', 'questions', 'difficulty'].map((sort) => (
            <button
              key={sort}
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
          ))}
        </div>
      </div>

      {/* Topics List */}
      <div 
        ref={scrollContainerRef}
        className="max-h-80 overflow-y-auto space-y-3 px-1 scroll-smooth"
      >
        {topics.map((topic) => (
          <button
            key={topic.topic_id}
            onClick={() => onTopicSelect(topic.topic_id)}
            className={cn(
              "w-full text-left p-4 rounded-xl transition-all duration-200 border group hover:shadow-sm",
              selectedTopic === topic.topic_id
                ? "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 shadow-sm"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            )}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{topic.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white text-sm leading-tight">
                    {topic.topic_title}
                  </div>
                  {topic.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 line-clamp-2">
                      {topic.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{topic.readingTime}min</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  {/* Question Count */}
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Target className="h-3 w-3" />
                    <span>{topic.questionCount} questions</span>
                  </div>

                  {/* Date */}
                  <div className="text-slate-500 dark:text-slate-500">
                    {new Date(topic.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Categories */}
                  {topic.categoryDetails.slice(0, 2).map((category, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                      {category.emoji} {category.name}
                    </Badge>
                  ))}

                  {/* Difficulty */}
                  <Badge 
                    className={cn(
                      "text-xs px-2 py-0.5 border-0",
                      getDifficultyColor(topic.averageDifficulty)
                    )}
                  >
                    {topic.difficultyLabel}
                  </Badge>
                </div>
              </div>

              {/* Question Types */}
              {Object.keys(topic.questionTypes).length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-500">Types:</span>
                  {Object.entries(topic.questionTypes).map(([type, count]) => (
                    <span key={type} className="text-slate-600 dark:text-slate-400">
                      {type.replace('_', ' ')}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}

        {/* Loading More */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
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
              <ChevronDown className="h-4 w-4" />
              Load More Topics
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
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Selected: <span className="font-medium text-slate-900 dark:text-white">
              {topics.find(t => t.topic_id === selectedTopic)?.topic_title}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 