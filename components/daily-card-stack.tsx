"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { dataService } from "@/lib/data-service"
import type { CategoryType, TopicMetadata } from "@/lib/quiz-data"
import { CivicCard } from "./civic-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"

// Helper to get today's date in user's local timezone
const getTodayAtMidnight = () => {
  const today = new Date()
  // Use local timezone, not UTC
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return localToday
}

// Helper to format date for display
const formatDateForDisplay = (date: Date) => {
  const today = getTodayAtMidnight()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Parse the topic date properly in local timezone
  const topicDate = new Date(date)
  const localTopicDate = new Date(topicDate.getFullYear(), topicDate.getMonth(), topicDate.getDate())

  if (localTopicDate.getTime() === today.getTime()) {
    return "Today"
  } else if (localTopicDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow"
  } else if (localTopicDate.getTime() === yesterday.getTime()) {
    return "Yesterday"
  } else {
    return localTopicDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

// Helper to get relative date category
const getDateCategory = (date: Date, currentDate: Date) => {
  // Parse dates in local timezone for proper comparison
  const topicDate = new Date(date)
  const localTopicDate = new Date(topicDate.getFullYear(), topicDate.getMonth(), topicDate.getDate())
  const localCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  
  const diffTime = localTopicDate.getTime() - localCurrentDate.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays > 0) return 'future'
  return 'past'
}



interface DailyCardStackProps {
  selectedCategory: CategoryType | null
  searchQuery: string
  requireAuth?: boolean
  onAuthRequired?: () => void
}

interface OrganizedTopics {
  today: TopicMetadata[]
  future: TopicMetadata[]
  past: TopicMetadata[]
}

const FREE_QUIZ_LIMIT = 2 // Number of quizzes allowed without authentication

export function DailyCardStack({
  selectedCategory,
  searchQuery,
  requireAuth = false,
  onAuthRequired,
}: DailyCardStackProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { isPremium, isPro, hasFeatureAccess } = usePremium()
  const cardBaseHeight = "h-[500px]"
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())
  const [currentDate, setCurrentDate] = useState(getTodayAtMidnight())
  const [quizAttempts, setQuizAttempts] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)
  const [topicsList, setTopicsList] = useState<TopicMetadata[]>([])
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [currentStackIndex, setCurrentStackIndex] = useState(0)


  // Load topics from data service
  useEffect(() => {
    const loadTopics = async () => {
      try {
        setIsLoadingTopics(true)
        const topicsData = await dataService.getAllTopics()
        setTopicsList(Object.values(topicsData))
      } catch (error) {
        console.error('Error loading topics:', error)
        setTopicsList([])
      } finally {
        setIsLoadingTopics(false)
      }
    }

    loadTopics()
  }, [])

  // Filter and organize topics by date
  const organizedTopics: OrganizedTopics = topicsList
    .filter((topic) => {
      const matchesCategory = selectedCategory === null || topic.categories.includes(selectedCategory)
      const matchesSearch =
        searchQuery === "" ||
        topic.topic_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .reduce((acc, topic) => {
      const topicDate = new Date(topic.date)
      const category = getDateCategory(topicDate, currentDate)
      acc[category].push(topic)
      return acc
    }, { today: [], future: [], past: [] } as OrganizedTopics)

  // Sort each category
  organizedTopics.today.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  organizedTopics.future.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  organizedTopics.past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first

  // Combine all topics and sort chronologically
  const allFilteredTopics = [
    ...organizedTopics.today,
    ...organizedTopics.future,
    ...organizedTopics.past
  ].sort((a, b) => {
    // Sort all topics chronologically: past dates in descending order, then today, then future dates in ascending order
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    const todayTime = currentDate.getTime()
    
    // If both are past dates, sort in descending order (most recent first)
    if (dateA < todayTime && dateB < todayTime) {
      return dateB - dateA
    }
    
    // If both are future dates, sort in ascending order (earliest first)
    if (dateA > todayTime && dateB > todayTime) {
      return dateA - dateB
    }
    
    // Mixed case: past dates come first, then today, then future
    return dateA - dateB
  })



  // Effect to update current date if the component stays mounted across midnight
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(getTodayAtMidnight())
    }, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  // Load completed topics, quiz attempts, streak, and last activity from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    if (savedCompleted) {
      setCompletedTopics(new Set(JSON.parse(savedCompleted)))
    }

    const savedAttempts = localStorage.getItem("civicAppQuizAttempts")
    if (savedAttempts) {
      setQuizAttempts(Number.parseInt(savedAttempts, 10))
    }

    const savedStreak = localStorage.getItem("civicAppStreak")
    if (savedStreak) {
      setStreak(Number.parseInt(savedStreak, 10))
    }

    const savedLastActivity = localStorage.getItem("civicAppLastActivity")
    if (savedLastActivity) {
      setLastActivity(new Date(savedLastActivity))
    }
  }, [])

  // Save completed topics and quiz attempts to localStorage
  useEffect(() => {
    localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(Array.from(completedTopics)))
  }, [completedTopics])

  useEffect(() => {
    localStorage.setItem("civicAppQuizAttempts", quizAttempts.toString())
  }, [quizAttempts])

  // Reset stack index when topics change
  useEffect(() => {
    setCurrentStackIndex(0)
  }, [allFilteredTopics.length, selectedCategory, searchQuery])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with form inputs or if modifiers are pressed
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'h': // Vim-style navigation
          event.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
        case 'l': // Vim-style navigation
          event.preventDefault()
          handleNext()
          break
        case ' ': // Spacebar
        case 'Enter':
          event.preventDefault()
          if (allFilteredTopics[currentStackIndex]) {
            handleExploreGame(allFilteredTopics[currentStackIndex].topic_id)
          }
          break
        case 'Home':
          event.preventDefault()
          setCurrentStackIndex(0)
          break
        case 'End':
          event.preventDefault()
          setCurrentStackIndex(allFilteredTopics.length - 1)
          break
        case '?':
          event.preventDefault()
          // Show keyboard shortcuts help
          alert(`Keyboard Shortcuts:
← / h: Previous card
→ / l: Next card
Space / Enter: Start quiz
Home: First card
End: Last card
?: Show this help`)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [allFilteredTopics, currentStackIndex])

  const handleExploreGame = (topicId: string) => {
    const topic = topicsList.find(t => t.topic_id === topicId)
    if (!topic) return

    const topicDate = new Date(topic.date)
    const localTopicDate = new Date(topicDate.getFullYear(), topicDate.getMonth(), topicDate.getDate())

    if (localTopicDate > currentDate && !completedTopics.has(topicId)) {
      console.log(`Topic "${topic.topic_title}" is locked. Available on: ${topic.date}`)
      return
    }

    // Check if user needs to authenticate or upgrade
    if (!user && quizAttempts >= FREE_QUIZ_LIMIT) {
      onAuthRequired?.()
      return
    }

    // Check premium limits for authenticated users
    if (user && !isPremium && !isPro && quizAttempts >= FREE_QUIZ_LIMIT) {
      setShowPremiumGate(true)
      return
    }

    // Navigate to quiz page
    router.push(`/quiz/${topicId}`)
  }

  const isTopicLocked = (topic: TopicMetadata) => {
    const topicDate = new Date(topic.date)
    const localTopicDate = new Date(topicDate.getFullYear(), topicDate.getMonth(), topicDate.getDate())
    return localTopicDate > currentDate && !completedTopics.has(topic.topic_id)
  }

  const isTopicCompleted = (topicId: string) => {
    return completedTopics.has(topicId)
  }

  const handlePrevious = () => {
    setCurrentStackIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentStackIndex(prev => Math.min(allFilteredTopics.length - 1, prev + 1))
  }

  if (isLoadingTopics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading today's civic challenges...</p>
        </div>
      </div>
    )
  }

  if (allFilteredTopics.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <Calendar className="h-16 w-16 mx-auto text-slate-400 mb-6" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No quizzes found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {selectedCategory || searchQuery
              ? "Try adjusting your filters to see more content."
              : "Check back soon for new civic education content."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center">
      {/* Clean navigation - single row on mobile */}
      {allFilteredTopics.length > 1 && (
        <div className="mb-8 sm:mb-16">
          {/* Mobile & Desktop: improved spacing navigation */}
          <div className="flex items-center justify-between px-2 sm:px-8">
            {/* Previous button - far left */}
            <button
              onClick={handlePrevious}
              disabled={currentStackIndex === 0}
              className={`
                text-xs sm:text-sm font-medium tracking-wide transition-opacity min-w-0 flex-shrink-0
                ${currentStackIndex === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'opacity-70 hover:opacity-100'
                }
              `}
            >
              {currentStackIndex > 0 && (
                <>
                  ← {new Date(allFilteredTopics[currentStackIndex - 1].date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </>
              )}
            </button>
            
            {/* Current date - center with breathing room */}
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50 tracking-wide text-center flex-grow mx-4 sm:mx-8">
              {new Date(allFilteredTopics[currentStackIndex].date).toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })}
            </div>

            {/* Next button - far right */}
            <button
              onClick={handleNext}
              disabled={currentStackIndex === allFilteredTopics.length - 1}
              className={`
                text-xs sm:text-sm font-medium tracking-wide transition-opacity min-w-0 flex-shrink-0
                ${currentStackIndex === allFilteredTopics.length - 1
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'opacity-70 hover:opacity-100'
                }
              `}
            >
              {currentStackIndex < allFilteredTopics.length - 1 && (
                <>
                  {new Date(allFilteredTopics[currentStackIndex + 1].date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })} →
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Single Card Display */}
      <div className="relative">
        {allFilteredTopics.length > 0 && (
          <CivicCard
            topic={allFilteredTopics[currentStackIndex]}
            baseHeight={cardBaseHeight}
            onExploreGame={handleExploreGame}
            isCompleted={isTopicCompleted(allFilteredTopics[currentStackIndex].topic_id)}
            isLocked={isTopicLocked(allFilteredTopics[currentStackIndex])}
          />
        )}
      </div>

      <PremiumGate 
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="advanced_analytics"
        title="Unlock Unlimited Daily Quizzes"
        description="Continue your civic education journey with unlimited access to all our quizzes and premium features."
      />

      {/* Keyboard shortcuts hint */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-300 dark:text-slate-600">
          Use <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">←</kbd> <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">→</kbd> to navigate, <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">Space</kbd> to start quiz, <kbd className="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded">?</kbd> for help
        </p>
      </div>
    </div>
  )
}
