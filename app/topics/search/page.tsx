'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, ChevronRight, Clock, BarChart, BookOpen, Calendar, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'

interface TopicSearchResult {
  topic_id: string
  topic_title: string
  description: string
  emoji: string
  date: string | null
  categories: any
  why_this_matters: string
  questionCount: number
  questionTypes: Record<string, number>
  categoryDetails: Array<{ id: string; name: string; emoji: string }>
  hasQuestions: boolean
  averageDifficulty: number
  difficultyLabel: string
  readingTime: number
  relevanceScore?: number
}

interface SearchResponse {
  topics: TopicSearchResult[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'advanced', label: 'Advanced', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'expert', label: 'Expert', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'date', label: 'Most Recent' },
  { value: 'questions', label: 'Most Questions' },
  { value: 'difficulty', label: 'Difficulty (Low to High)' },
  { value: 'popularity', label: 'Most Popular' }
]

export default function TopicsSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('relevance')
  const [onlyWithQuestions, setOnlyWithQuestions] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Results state
  const [results, setResults] = useState<TopicSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  
  // Categories for filter
  const [categories, setCategories] = useState<Array<{ id: string; name: string; emoji: string }>>([])
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Debounced search query state
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  
  // Implement debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    loadCategories()
  }, [])

  // Perform search
  const performSearch = useCallback(async (resetOffset = true) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)

    const searchOffset = resetOffset ? 0 : offset

    try {
      const response = await fetch('/api/topics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: debouncedSearchQuery,
          categories: selectedCategories,
          difficulty: selectedDifficulties,
          hasQuestions: onlyWithQuestions ? true : undefined,
          sortBy,
          limit: 20,
          offset: searchOffset
        })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: SearchResponse = await response.json()
      
      if (resetOffset) {
        setResults(data.topics)
        setOffset(0)
      } else {
        setResults(prev => [...prev, ...data.topics])
      }
      
      setTotal(data.total)
      setHasMore(data.hasMore)
      setOffset(searchOffset + data.topics.length)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Failed to search topics. Please try again.')
        console.error('Search error:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, selectedCategories, selectedDifficulties, onlyWithQuestions, sortBy, offset])

  // Trigger search on filter changes
  useEffect(() => {
    performSearch(true)
  }, [debouncedSearchQuery, selectedCategories, selectedDifficulties, onlyWithQuestions, sortBy])

  // Update URL with search query
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set('q', searchQuery)
    } else {
      params.delete('q')
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/topics/search'
    router.replace(newUrl, { scroll: false })
  }, [searchQuery])

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedDifficulties([])
    setOnlyWithQuestions(true)
    setSortBy('relevance')
  }

  const hasActiveFilters = selectedCategories.length > 0 || selectedDifficulties.length > 0 || !onlyWithQuestions

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-4">
            {/* Title and search */}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Search Topics
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2",
                  hasActiveFilters && "border-blue-500 text-blue-600 dark:text-blue-400"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {selectedCategories.length + selectedDifficulties.length + (!onlyWithQuestions ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search topics, events, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {loading ? (
                  <span className="animate-pulse">Searching...</span>
                ) : (
                  <span>{total} topics found</span>
                )}
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="space-y-4">
                {/* Categories */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={() => toggleCategory(category.name)}
                        />
                        <span className="text-sm flex items-center gap-1">
                          <span>{category.emoji}</span>
                          <span>{category.name}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Difficulty */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Difficulty Level</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTY_LEVELS.map(level => (
                      <label
                        key={level.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedDifficulties.includes(level.value)}
                          onCheckedChange={() => toggleDifficulty(level.value)}
                        />
                        <Badge variant="secondary" className={cn("text-xs", level.color)}>
                          {level.label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Other filters */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={onlyWithQuestions}
                      onCheckedChange={(checked) => setOnlyWithQuestions(checked as boolean)}
                    />
                    <span className="text-sm">Only show topics with questions</span>
                  </label>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {loading && results.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No topics found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((topic) => (
              <TopicCard key={topic.topic_id} topic={topic} />
            ))}

            {hasMore && (
              <div className="text-center pt-8">
                <Button
                  variant="outline"
                  onClick={() => performSearch(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    'Load more topics'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TopicCard({ topic }: { topic: TopicSearchResult }) {
  const router = useRouter()
  
  const handleStartQuiz = () => {
    router.push(`/quiz/${topic.topic_id}`)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-3xl">{topic.emoji}</span>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">
                {topic.topic_title}
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {topic.description}
              </p>
            </div>
          </div>
          {topic.hasQuestions && (
            <Button
              onClick={handleStartQuiz}
              size="sm"
              className="shrink-0"
            >
              Start Quiz
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Categories and difficulty */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {topic.categoryDetails.map((cat) => (
            <Badge key={cat.id} variant="secondary" className="text-xs">
              {cat.emoji} {cat.name}
            </Badge>
          ))}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              DIFFICULTY_LEVELS.find(d => d.label === topic.difficultyLabel)?.color
            )}
          >
            {topic.difficultyLabel}
          </Badge>
          {topic.date && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="mr-1 h-3 w-3" />
              {new Date(topic.date).toLocaleDateString()}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{topic.questionCount} questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{topic.readingTime} min</span>
          </div>
          {topic.relevanceScore && topic.relevanceScore > 0 && (
            <div className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              <span>Relevance: {Math.round(topic.relevanceScore)}</span>
            </div>
          )}
        </div>

        {/* Question types breakdown */}
        {topic.questionCount > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Question Types:
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(topic.questionTypes).map(([type, count]) => (
                <span
                  key={type}
                  className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  {type.replace(/_/g, ' ')}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why this matters */}
        {topic.why_this_matters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Why this matters:
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {topic.why_this_matters}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 