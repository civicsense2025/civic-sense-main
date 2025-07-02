"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useGuestAccess } from "@civicsense/shared/hooks/useGuestAccess"
import { useTopicAccess } from "@civicsense/shared/hooks/use-topic-access"
import { supabase } from "@civicsense/shared/lib/supabase/client"
import { parseTopicDate } from "../../utils"
import type { CategoryType, TopicMetadata } from "@civicsense/shared/lib/quiz-data"

// Components
import { TopicCard } from "@/components/daily-card/topic-card"
import { CardNavigation } from "@/components/daily-card/card-navigation"
import { GuestBanner } from "@/components/daily-card/guest-banner"
import { DailyCardSkeleton } from "../ui/skeleton"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Calendar, Crown, Check } from "lucide-react"

interface DailyCardStackProps {
  selectedCategory: CategoryType | null
  searchQuery: string
  requireAuth?: boolean
  onAuthRequired?: () => void
  showGuestBanner?: boolean
  onLoadingStateChange?: (isReady: boolean) => void
  onCurrentTopicChange?: (currentTopic: TopicMetadata | null, allTopics: TopicMetadata[]) => void
}

// Premium Prompt Component
const PremiumPrompt = ({ 
  show, 
  onClose, 
  onDonate, 
  onCreateAccount 
}: { 
  show: boolean
  onClose: () => void
  onDonate: () => void
  onCreateAccount: () => void
}) => {
  if (!show) return null
    
    return (
    <Card className="mb-6 border-2 border-blue-500 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-600">
            <Crown className="h-5 w-5 text-yellow-500" />
            Support CivicSense & Unlock Everything
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            "Unlimited daily quizzes",
            "Advanced progress tracking", 
            "Custom study collections",
            "Priority support"
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button onClick={onDonate} className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Crown className="h-4 w-4 mr-2" />
            Unlock with Donation
          </Button>
          <Button variant="outline" onClick={onCreateAccount} className="flex-1">
            Create Free Account
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function DailyCardStack({
  selectedCategory,
  searchQuery,
  onAuthRequired,
  showGuestBanner = true,
  onLoadingStateChange,
  onCurrentTopicChange,
}: DailyCardStackProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { recordQuizAttempt, getGuestAccessSummary } = useGuestAccess()
  const { getTopicAccessStatus, isTopicCompleted } = useTopicAccess()

  // State
  const [topics, setTopics] = useState<TopicMetadata[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [highlightedNavIndex, setHighlightedNavIndex] = useState(0) // For keyboard navigation in bottom bar
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false)
  const [hasMoreTopics, setHasMoreTopics] = useState(true)
  const [showStickyNav, setShowStickyNav] = useState(true)
  
  // Refs
  const sectionRef = useRef<HTMLDivElement>(null)

    // Load topics
  useEffect(() => {
    let isCancelled = false

    const loadTopics = async () => {
      try {
        setIsLoading(true)
        
        const { data, error } = await supabase
        .from('question_topics')
        .select('*')
        .eq('is_active', true)
        .not('date', 'is', null)
        .order('date', { ascending: false })
          .limit(50)
      
        if (error) throw error
      
        if (!isCancelled) {
          const processedTopics = (data || []).map(topic => ({
        ...topic,
            categories: Array.isArray(topic.categories) ? topic.categories : [],
            dayOfWeek: parseTopicDate(topic.date)?.toLocaleDateString('en-US', { weekday: 'short' }) || ''
      })) as unknown as TopicMetadata[]
      
          setTopics(processedTopics)
          setHasMoreTopics((data || []).length === 50) // Has more if we got full limit
          onLoadingStateChange?.(true)
        }
    } catch (error) {
        console.error('Error loading topics:', error)
        if (!isCancelled) {
          setTopics([])
          onLoadingStateChange?.(true)
        }
    } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadTopics()
    return () => { isCancelled = true }
  }, [onLoadingStateChange])

  // Load more older topics
  const loadMoreTopics = useCallback(async () => {
    if (isLoadingMore || !hasMoreTopics) return

    try {
      setIsLoadingMore(true)
      
      const oldestDate = topics[topics.length - 1]?.date
      if (!oldestDate) return
      
      const { data, error } = await supabase
          .from('question_topics')
          .select('*')
          .eq('is_active', true)
          .not('date', 'is', null)
        .lt('date', oldestDate)
          .order('date', { ascending: false })
        .limit(25)
        
      if (error) throw error
        
      const processedNewTopics = (data || []).map(topic => ({
          ...topic,
        categories: Array.isArray(topic.categories) ? topic.categories : [],
        dayOfWeek: parseTopicDate(topic.date)?.toLocaleDateString('en-US', { weekday: 'short' }) || ''
        })) as unknown as TopicMetadata[]
        
      setTopics(prev => [...prev, ...processedNewTopics])
      setHasMoreTopics((data || []).length === 25) // Has more if we got full limit
        
      } catch (error) {
      console.error('Error loading more topics:', error)
      } finally {
      setIsLoadingMore(false)
    }
  }, [topics, isLoadingMore, hasMoreTopics])

  // Filter topics based on category and search
  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      if (!topic.date) return false
      
      const matchesCategory = !selectedCategory || 
        (topic.categories && topic.categories.some(cat => 
          cat === selectedCategory || cat.toLowerCase() === selectedCategory.toLowerCase()
        ))
      
      const matchesSearch = !searchQuery ||
        topic.topic_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesCategory && matchesSearch
    }).sort((a, b) => {
      // Priority sorting: Breaking > Featured > Date
      if (a.is_breaking && !b.is_breaking) return -1
      if (!a.is_breaking && b.is_breaking) return 1
      
      const dateA = parseTopicDate(a.date)
      const dateB = parseTopicDate(b.date)
      if (!dateA || !dateB) return 0
      
      return dateB.getTime() - dateA.getTime()
    })
  }, [topics, selectedCategory, searchQuery])

  // Handle topic parameter from URL
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    if (topicParam && filteredTopics.length > 0) {
      const index = filteredTopics.findIndex(topic => topic.topic_id === topicParam)
      if (index !== -1) {
        setCurrentIndex(index)
        setHighlightedNavIndex(index) // Keep highlight in sync
      }
    }
  }, [searchParams, filteredTopics])

  // Sync highlighted navigation index with current index on topic changes
  useEffect(() => {
    setHighlightedNavIndex(currentIndex)
  }, [currentIndex])

  // Update URL when index changes
  const updateUrl = useCallback((index: number) => {
    if (filteredTopics[index]) {
      const url = new URL(window.location.href)
      url.searchParams.set('topic', filteredTopics[index].topic_id)
      window.history.replaceState(null, '', url.toString())
    }
  }, [filteredTopics])

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    const newIndex = Math.min(filteredTopics.length - 1, currentIndex + 1)
    setCurrentIndex(newIndex)
    updateUrl(newIndex)
    
    // Lazy load more topics when getting close to the end (within 10 topics)
    if (newIndex >= filteredTopics.length - 10 && hasMoreTopics && !isLoadingMore) {
      loadMoreTopics()
    }
  }, [currentIndex, filteredTopics.length, updateUrl, hasMoreTopics, isLoadingMore, loadMoreTopics])

  const handleNext = useCallback(() => {
    const newIndex = Math.max(0, currentIndex - 1)
    setCurrentIndex(newIndex)
    updateUrl(newIndex)
  }, [currentIndex, updateUrl])

  const handleTopicSelect = useCallback((index: number) => {
    setCurrentIndex(index)
    updateUrl(index)
    
    // Lazy load more topics when selecting an older topic close to the end
    if (index >= filteredTopics.length - 10 && hasMoreTopics && !isLoadingMore) {
      loadMoreTopics()
    }
  }, [updateUrl, filteredTopics.length, hasMoreTopics, isLoadingMore, loadMoreTopics])

  // Start quiz handler
  const handleStartQuiz = useCallback(async (topicId: string) => {
    const topic = filteredTopics.find(t => t.topic_id === topicId)
    if (!topic) return

    const accessStatus = getTopicAccessStatus(topic)

    if (!accessStatus.accessible) {
      if (accessStatus.reason.includes('guest')) {
          onAuthRequired?.()
      } else if (accessStatus.reason === 'premium_required') {
        setShowPremiumPrompt(true)
      }
          return
    }

    // Record attempt for guests
    if (!user) {
      try {
        await recordQuizAttempt()
      } catch (error) {
        console.error('Failed to record quiz attempt:', error)
      }
    }

    router.push(`/quiz/${topicId}`)
  }, [filteredTopics, getTopicAccessStatus, user, recordQuizAttempt, router, onAuthRequired])

  // Helper functions for navigation card visibility
  const getVisibleCount = () => 6 // Match the CardNavigation component
  
  const getVisibleRange = () => {
    const visibleCount = getVisibleCount()
    const maxStartIndex = Math.max(0, filteredTopics.length - visibleCount)
    const startIndex = Math.min(currentIndex, maxStartIndex)
    return {
      startIndex,
      endIndex: startIndex + visibleCount - 1
    }
  }

  // Enhanced keyboard navigation for bottom navigation cards
  const handleKeyboardNavigation = useCallback((direction: 'left' | 'right') => {
    const { startIndex, endIndex } = getVisibleRange()
    
    if (direction === 'left') {
      // Move highlight left (to older topics)
      if (highlightedNavIndex < endIndex && highlightedNavIndex < filteredTopics.length - 1) {
        // Move highlight within visible cards and update current topic
        const newIndex = highlightedNavIndex + 1
        setHighlightedNavIndex(newIndex)
        handleTopicSelect(newIndex)
      } else {
        // Move to older topics and select that topic
        handlePrevious()
      }
    } else {
      // Move highlight right (to newer topics)  
      if (highlightedNavIndex > startIndex && highlightedNavIndex > 0) {
        // Move highlight within visible cards and update current topic
        const newIndex = highlightedNavIndex - 1
        setHighlightedNavIndex(newIndex)
        handleTopicSelect(newIndex)
      } else {
        // Move to newer topics and select that topic
        handleNext()
      }
    }
  }, [highlightedNavIndex, handlePrevious, handleNext, handleTopicSelect, filteredTopics.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      
      switch (e.key) {
        case 'ArrowLeft':
          handleKeyboardNavigation('left')
          e.preventDefault()
          break
        case 'ArrowRight':
          handleKeyboardNavigation('right')
          e.preventDefault()
          break
        case 'Enter':
        case ' ':
          if (filteredTopics[highlightedNavIndex]) {
            handleStartQuiz(filteredTopics[highlightedNavIndex].topic_id)
          } else if (filteredTopics[currentIndex]) {
            handleStartQuiz(filteredTopics[currentIndex].topic_id)
          }
          e.preventDefault()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyboardNavigation, handleStartQuiz, filteredTopics, currentIndex, highlightedNavIndex])

  // Notify parent of current topic changes
  useEffect(() => {
    if (onCurrentTopicChange) {
      const currentTopic = filteredTopics[currentIndex] || null
      onCurrentTopicChange(currentTopic, filteredTopics)
    }
  }, [onCurrentTopicChange, filteredTopics, currentIndex])

  // Scroll detection for sticky navigation on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return

      const sectionRect = sectionRef.current.getBoundingClientRect()
      const isVisible = sectionRect.bottom > 0 && sectionRect.top < window.innerHeight
      
      // Show sticky nav only when section is visible
      setShowStickyNav(isVisible)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Loading state
  if (isLoading) {
    return <DailyCardSkeleton />
  }

  // Empty state
  if (filteredTopics.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto space-y-4">
          <Calendar className="h-16 w-16 mx-auto text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            No topics found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {selectedCategory || searchQuery
              ? "Try adjusting your search or category filter"
              : "Check back soon for new civic education content!"}
          </p>
          {!user && (
            <Button onClick={onAuthRequired} className="mt-4">
                Create Free Account
              </Button>
          )}
        </div>
      </div>
    )
  }

  const currentTopic = filteredTopics[currentIndex]
  if (!currentTopic) return null

  const accessStatus = getTopicAccessStatus(currentTopic)
  const isCompleted = isTopicCompleted(currentTopic.topic_id)

  return (
    <div ref={sectionRef} className="min-h-[50vh] flex flex-col justify-center py-4 sm:py-8 pb-24 md:pb-4 sm:md:pb-8">
      {/* Guest Banner */}
      {showGuestBanner && !user && (
        <GuestBanner summary={getGuestAccessSummary()} />
      )}

      {/* Premium Prompt */}
      <PremiumPrompt
        show={showPremiumPrompt}
        onClose={() => setShowPremiumPrompt(false)}
        onDonate={() => router.push('/donate?source=daily_cards')}
        onCreateAccount={() => onAuthRequired?.()}
      />

            {/* Topic Card */}
      <div className="animate-in fade-in duration-300">
        <TopicCard
          topic={currentTopic}
          accessStatus={accessStatus}
          isCompleted={isCompleted}
          onStartQuiz={() => handleStartQuiz(currentTopic.topic_id)}
                          />
                        </div>

      {/* Navigation Controls - Sticky on mobile */}
      {filteredTopics.length > 1 && showStickyNav && (
        <div className="
          fixed bottom-0 left-0 right-0 z-50 
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm
          border-t border-slate-200 dark:border-slate-700
          py-3 px-4
          md:relative md:bottom-auto md:z-auto 
          md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none
          md:border-t-0 md:py-0 md:px-0
          md:mt-8
          transition-transform duration-300 ease-in-out
        ">
          <CardNavigation
            currentIndex={currentIndex}
            highlightedNavIndex={highlightedNavIndex}
            totalTopics={filteredTopics.length}
            topics={filteredTopics}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onTopicSelect={handleTopicSelect}
          />
                              </div>
      )}
    </div>
  )
}
