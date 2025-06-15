"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { dataService } from "@/lib/data-service"
import type { CategoryType, TopicMetadata } from "@/lib/quiz-data"
import { CivicCard } from "./civic-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronDown, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGlobalAudio } from "@/components/global-audio-controls"

// Helper to get today's date in user's local timezone
// For demo purposes, we'll use June 14, 2025 as "today" to match the mock data
const getTodayAtMidnight = () => {
  // Use mock date for demo (June 14, 2025)
  const mockToday = new Date(2025, 5, 14) // Month is 0-indexed, so 5 = June
  return mockToday
  
  // Uncomment below for production use with real current date:
  // const today = new Date()
  // const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // return localToday
}

// Optimized date parsing with caching and proper timezone handling
const dateCache = new Map<string, Date | null>()

const parseTopicDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return null
  
  // Use cache for string dates to avoid repeated parsing
  const cacheKey = typeof dateString === 'string' ? dateString : null
  if (cacheKey && dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey)
  }
  
  try {
    let parsed: Date | null = null
    
    if (dateString instanceof Date) {
      if (isNaN(dateString.getTime())) return null
      // Create a new date in local timezone without time component
      parsed = new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate())
    }
    
    if (typeof dateString === 'string') {
      if (dateString.trim() === '' || dateString === 'null' || dateString === 'undefined') {
        parsed = null
      }
      // Handle ISO format (YYYY-MM-DD) - avoid timezone issues
      else if (dateString.includes('-') && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number)
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          parsed = null
        } else {
          // Create date in local timezone to avoid UTC conversion issues
          parsed = new Date(year, month - 1, day)
        }
      } 
      // Handle natural language dates (e.g., "June 14, 2025")
      else {
        const tempDate = new Date(dateString)
        if (isNaN(tempDate.getTime())) {
          console.warn(`Failed to parse date: "${dateString}"`)
          parsed = null
        } else {
          // Normalize to local date (remove time component and timezone issues)
          parsed = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate())
        }
      }
    }
    
    // Cache the result for string inputs
    if (cacheKey) {
      dateCache.set(cacheKey, parsed)
    }
    
    return parsed
  } catch (error) {
    console.warn(`parseTopicDate error parsing "${dateString}":`, error)
    if (cacheKey) {
      dateCache.set(cacheKey, null)
    }
    return null
  }
}

// Helper to format date for display
const formatDateForDisplay = (date: string | Date) => {
  const today = getTodayAtMidnight()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const localTopicDate = parseTopicDate(date)
  
  if (!localTopicDate) {
    return "Invalid Date"
  }

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
const getDateCategory = (date: string | Date, currentDate: Date) => {
  const localTopicDate = parseTopicDate(date)
  
  if (!localTopicDate) {
    console.warn(`getDateCategory: Could not parse date "${date}"`)
    return null
  }
  
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

const FREE_QUIZ_LIMIT = 2

export function DailyCardStack({
  selectedCategory,
  searchQuery,
  requireAuth = false,
  onAuthRequired,
}: DailyCardStackProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { isPremium, isPro, hasFeatureAccess } = usePremium()
  const { autoPlayEnabled, readContentWithSettings } = useGlobalAudio()
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
  const [topicsWithoutQuestions, setTopicsWithoutQuestions] = useState<Set<string>>(new Set())

  // Load topics from data service with enhanced debugging
  useEffect(() => {
    const loadTopics = async () => {
      try {
        setIsLoadingTopics(true)
        console.log(`🔄 Starting to load topics from data service...`)
        const topicsData = await dataService.getAllTopics()
        console.log(`📦 Raw topics data received:`, topicsData)
        console.log(`📦 Topics data type:`, typeof topicsData)
        console.log(`📦 Topics data keys:`, Object.keys(topicsData || {}))
        
        const topicsArray = Object.values(topicsData)
        
        console.log(`=== LOADING TOPICS DEBUG ===`)
        console.log(`Total topics loaded: ${topicsArray.length}`)
        console.log(`Topics data structure:`, topicsData)
        console.log(`Topics array sample:`, topicsArray.slice(0, 3))
        
        // Log first few topics for debugging
        topicsArray.slice(0, 5).forEach((topic, index) => {
          console.log(`🔍 Sample Topic ${index + 1}:`, {
            id: topic.topic_id,
            title: topic.topic_title,
            date: topic.date,
            dateType: typeof topic.date,
            categories: topic.categories,
            fullTopic: topic
          })
        })
        
        setTopicsList(topicsArray)
        
        // Check which topics have questions - conservative approach
        const topicsWithoutQuestionsSet = new Set<string>()
        
        console.log(`Checking questions for topics...`)
        
        // TEMPORARY: Skip question checking in development to show all topics
        const SKIP_QUESTION_CHECK = process.env.NODE_ENV === 'development'
        
        if (SKIP_QUESTION_CHECK) {
          console.log(`🚧 DEVELOPMENT MODE: Skipping question check - all topics will be available`)
        } else if (topicsArray.length > 50) {
          console.log(`Too many topics (${topicsArray.length}), skipping question check to avoid performance issues`)
        } else {
          const questionCheckResults = await Promise.allSettled(
            topicsArray.map(async (topic) => {
              try {
                const questions = await dataService.getQuestionsByTopic(topic.topic_id)
                const hasQuestions = questions.length > 0
                console.log(`Topic "${topic.topic_title}": ${questions.length} questions`)
                
                // Only mark as coming soon if we're absolutely sure it has no questions
                if (!hasQuestions && questions.length === 0) {
                  topicsWithoutQuestionsSet.add(topic.topic_id)
                  console.log(`❌ Marked "${topic.topic_title}" as coming soon (0 questions)`)
                } else {
                  console.log(`✅ Topic "${topic.topic_title}" has questions or unknown status`)
                }
                
                return { topicId: topic.topic_id, hasQuestions, questionCount: questions.length }
              } catch (error) {
                console.warn(`Error checking questions for topic "${topic.topic_title}":`, error)
                // CONSERVATIVE: If we can't check, assume it has questions (don't mark as coming soon)
                console.log(`✅ Topic "${topic.topic_title}" assumed to have questions (error checking)`)
                return { topicId: topic.topic_id, hasQuestions: true, questionCount: -1, error: true }
              }
            })
          )
          
          console.log(`Question check results:`, questionCheckResults.map(result => 
            result.status === 'fulfilled' ? result.value : { error: result.reason }
          ))
        }
        
        setTopicsWithoutQuestions(topicsWithoutQuestionsSet)
        console.log(`${topicsWithoutQuestionsSet.size} topics marked as coming soon (no questions)`)
        console.log(`Topics available: ${topicsArray.length - topicsWithoutQuestionsSet.size}`)
        
        if (topicsWithoutQuestionsSet.size === topicsArray.length) {
          console.warn(`⚠️ ALL TOPICS MARKED AS COMING SOON - This might indicate an issue with question loading!`)
          console.warn(`Consider checking the database connection or question data.`)
        } else if (topicsWithoutQuestionsSet.size > topicsArray.length * 0.8) {
          console.warn(`⚠️ Most topics (${topicsWithoutQuestionsSet.size}/${topicsArray.length}) marked as coming soon`)
        }
        
      } catch (error) {
        console.error('❌ Error loading topics:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          error
        })
        setTopicsList([])
      } finally {
        setIsLoadingTopics(false)
        console.log(`✅ Topic loading completed. Final topicsList length: ${topicsList.length}`)
      }
    }

    loadTopics()
  }, [])

  // Enhanced filtering with debugging - ensure all variables are initialized
  const organizedTopics: OrganizedTopics = useMemo(() => {
    // If topicsList is not loaded yet, return empty structure
    if (!topicsList || topicsList.length === 0) {
      return { today: [], future: [], past: [] }
    }

    return topicsList
      .filter((topic) => {
        if (!topic) return false
        
        // More lenient date validation
        if (!topic.date) {
          return false
        }
        
        const parsedDate = parseTopicDate(topic.date)
        
        if (!parsedDate) {
          return false
        }
        
        // Category filtering - more flexible approach
        let matchesCategory = true
        if (selectedCategory !== null) {
          // Check if the topic's categories array includes the selected category
          // Handle both string arrays and potential other formats
          const topicCategories = Array.isArray(topic.categories) ? topic.categories : []
          matchesCategory = topicCategories.some(cat => 
            cat === selectedCategory || 
            cat.toLowerCase() === selectedCategory.toLowerCase()
          )
          

        }
        
        // Search filtering
        const matchesSearch =
          searchQuery === "" ||
          (topic.topic_title && topic.topic_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
        
        return matchesCategory && matchesSearch
      })
      .reduce((acc, topic) => {
        if (!topic) return acc
        
        const topicDate = parseTopicDate(topic.date)
        if (!topicDate) return acc
        
        const category = getDateCategory(topicDate, currentDate)
        
        if (category && acc[category]) {
          acc[category].push(topic)
        }
        return acc
      }, { today: [], future: [], past: [] } as OrganizedTopics)
  }, [topicsList, selectedCategory, searchQuery, currentDate])

  // Helper functions that need to be defined before useMemo hooks
  const isTopicLocked = useCallback((topic: TopicMetadata) => {
    // In development, be more permissive - only lock based on date, not question availability
    if (process.env.NODE_ENV === 'development') {
      const localTopicDate = parseTopicDate(topic.date)
      if (!localTopicDate) {
        return false
      }
      // Only lock if date is far in the future (more than 7 days)
      const oneWeekFromNow = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      return localTopicDate > oneWeekFromNow && !completedTopics.has(topic.topic_id)
    }
    
    // Production behavior: lock if no questions or future date
    if (topicsWithoutQuestions.has(topic.topic_id)) {
      return true
    }
    
    const localTopicDate = parseTopicDate(topic.date)
    if (!localTopicDate) {
      return false
    }
    
    return localTopicDate > currentDate && !completedTopics.has(topic.topic_id)
  }, [currentDate, completedTopics, topicsWithoutQuestions])

  const isTopicComingSoon = useCallback((topicId: string) => {
    // In development, never mark topics as coming soon
    if (process.env.NODE_ENV === 'development') {
      return false
    }
    return topicsWithoutQuestions.has(topicId)
  }, [topicsWithoutQuestions])

  const isTopicCompleted = useCallback((topicId: string) => {
    return completedTopics.has(topicId)
  }, [completedTopics])



  // Sort each category - most recent first (with cached parsing)
  const sortByDate = (a: TopicMetadata, b: TopicMetadata) => {
    const dateA = parseTopicDate(a.date)
    const dateB = parseTopicDate(b.date)
    if (!dateA || !dateB) return 0
    return dateB.getTime() - dateA.getTime() // Most recent first
  }
  
  organizedTopics.today.sort(sortByDate)
  organizedTopics.future.sort(sortByDate)
  organizedTopics.past.sort(sortByDate)

  // Combine all topics and sort chronologically - most recent first
  const allFilteredTopics = useMemo(() => {
    if (!organizedTopics || (!organizedTopics.today && !organizedTopics.future && !organizedTopics.past)) {
      return []
    }

    return [
      ...(organizedTopics.today || []),
      ...(organizedTopics.future || []),
      ...(organizedTopics.past || [])
    ].sort(sortByDate)
  }, [organizedTopics, currentDate])

  // Show detailed topic status for debugging
  const availableTopics = useMemo(() => 
    allFilteredTopics.filter(topic => topic && !isTopicLocked(topic) && !isTopicComingSoon(topic.topic_id)), 
    [allFilteredTopics, isTopicLocked, isTopicComingSoon]
  )
  const lockedTopics = useMemo(() => 
    allFilteredTopics.filter(topic => topic && isTopicLocked(topic)), 
    [allFilteredTopics, isTopicLocked]
  )
  const comingSoonTopics = useMemo(() => 
    allFilteredTopics.filter(topic => topic && isTopicComingSoon(topic.topic_id)), 
    [allFilteredTopics, isTopicComingSoon]
  )
  
  if (process.env.NODE_ENV === 'development') {
    if (comingSoonTopics.length > 0) {
      console.log(`Topics that would be marked "coming soon" in production:`, comingSoonTopics.map(t => t.topic_title))
    }
  }

  // Helper function to get navigation display text
  const getNavigationText = (topic: TopicMetadata) => {
    const parsedDate = parseTopicDate(topic.date)
    if (!parsedDate) {
      return 'Invalid'
    }
    return parsedDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Helper function to get center display text
  const getCenterDisplayText = (topic: TopicMetadata) => {
    const parsedDate = parseTopicDate(topic.date)
    if (!parsedDate) {
      return 'Invalid Date'
    }
    return parsedDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Effect to update current date if the component stays mounted across midnight
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(getTodayAtMidnight())
    }, 60000)
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

  // Handle URL parameters for deep linking
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    if (topicParam && allFilteredTopics.length > 0) {
      const topicIndex = allFilteredTopics.findIndex(topic => topic.topic_id === topicParam)
      if (topicIndex !== -1) {
        setCurrentStackIndex(topicIndex)
      }
    }
  }, [searchParams, allFilteredTopics])

  // Reset stack index when topics change (but preserve URL-based navigation)
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    if (!topicParam) {
      setCurrentStackIndex(0)
    }
  }, [allFilteredTopics.length, selectedCategory, searchQuery, searchParams])

  // Auto-read current card when it changes and auto-play is enabled
  useEffect(() => {
    if (autoPlayEnabled && allFilteredTopics.length > 0 && currentStackIndex < allFilteredTopics.length) {
      const currentTopic = allFilteredTopics[currentStackIndex]
      if (currentTopic) {
        // Create readable content from the topic
        const readableContent = `${currentTopic.topic_title}. ${currentTopic.description || ''}`
        
        // Small delay to avoid audio conflicts when navigating quickly
        const timer = setTimeout(async () => {
          await readContentWithSettings(readableContent)
        }, 300)
        
        return () => clearTimeout(timer)
      }
    }
  }, [currentStackIndex, allFilteredTopics, autoPlayEnabled, readContentWithSettings])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'h':
          event.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
        case 'l':
          event.preventDefault()
          handleNext()
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          if (allFilteredTopics[currentStackIndex]) {
            handleExploreGame(allFilteredTopics[currentStackIndex].topic_id)
          }
          break
        case 'Home':
          event.preventDefault()
          handleIndexChange(0)
          break
        case 'End':
          event.preventDefault()
          handleIndexChange(allFilteredTopics.length - 1)
          break
        case '?':
          event.preventDefault()
          // Keyboard shortcuts help removed for daily card stack
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [allFilteredTopics, currentStackIndex])

  const handleExploreGame = (topicId: string) => {
    const topic = topicsList.find(t => t.topic_id === topicId)
    if (!topic) return

    // Check if topic has no questions
    if (topicsWithoutQuestions.has(topicId)) {
      console.log(`Topic "${topic.topic_title}" has no questions yet. Coming soon!`)
      return
    }

    try {
      const localTopicDate = parseTopicDate(topic.date)
      if (localTopicDate && localTopicDate > currentDate && !completedTopics.has(topicId)) {
        console.log(`Topic "${topic.topic_title}" is locked. Available on: ${topic.date}`)
        return
      }
    } catch (error) {
      console.error(`Error parsing date for topic "${topic.topic_title}":`, error)
    }

    // Check authentication and premium limits
    if (!user && quizAttempts >= FREE_QUIZ_LIMIT) {
      onAuthRequired?.()
      return
    }

    if (user && !isPremium && !isPro && quizAttempts >= FREE_QUIZ_LIMIT) {
      setShowPremiumGate(true)
      return
    }

    router.push(`/quiz/${topicId}`)
  }

  const updateUrlWithTopic = (index: number) => {
    if (allFilteredTopics[index]) {
      const topicId = allFilteredTopics[index].topic_id
      const url = new URL(window.location.href)
      url.searchParams.set('topic', topicId)
      window.history.replaceState(null, '', url.toString())
    }
  }

  const handlePrevious = () => {
    const newIndex = Math.max(0, currentStackIndex - 1)
    setCurrentStackIndex(newIndex)
    updateUrlWithTopic(newIndex)
  }

  const handleNext = () => {
    const newIndex = Math.min(allFilteredTopics.length - 1, currentStackIndex + 1)
    setCurrentStackIndex(newIndex)
    updateUrlWithTopic(newIndex)
  }

  const handleIndexChange = (index: number) => {
    setCurrentStackIndex(index)
    updateUrlWithTopic(index)
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
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left text-xs text-slate-500 mt-4 p-4 bg-slate-100 rounded">
              <p><strong>Debug Info:</strong></p>
              <p>Total topics loaded: {topicsList.length}</p>
              <p>Topics without questions: {topicsWithoutQuestions.size}</p>
              <p>Selected category: {selectedCategory || 'None'}</p>
              <p>Search query: "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] flex flex-col justify-center py-4 sm:py-8">
      {/* Navigation */}
      {allFilteredTopics.length > 1 && (
        <div className="mb-8 sm:mb-16">
          <div className="flex items-center justify-between px-2 sm:px-8">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
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
                        ← {getNavigationText(allFilteredTopics[currentStackIndex - 1])}
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {currentStackIndex > 0 && (
                  <TooltipContent>
                    <p>{allFilteredTopics[currentStackIndex - 1].topic_title}</p>
                  </TooltipContent>
                )}
              </Tooltip>
              
              <div className="flex items-center justify-center flex-grow mx-4 sm:mx-8">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50 tracking-wide hover:opacity-70 transition-opacity">
                      <span>{getCenterDisplayText(allFilteredTopics[currentStackIndex])}</span>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-slate-900 dark:text-slate-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="center" 
                    className="w-[90vw] max-w-md max-h-96 overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-slate-200 dark:border-slate-700 shadow-xl"
                    sideOffset={8}
                  >
                    {allFilteredTopics.map((topic, index) => {
                      const isLocked = isTopicLocked(topic)
                      const isCompleted = isTopicCompleted(topic.topic_id)
                      const isCurrent = index === currentStackIndex
                      const isComingSoon = isTopicComingSoon(topic.topic_id)
                      
                      return (
                        <DropdownMenuItem
                          key={topic.topic_id}
                          onClick={() => !isLocked && handleIndexChange(index)}
                          className={cn(
                            "flex items-center justify-between p-3 cursor-pointer text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100",
                            isCurrent && "bg-primary/10 font-medium",
                            isLocked && "opacity-50 cursor-not-allowed",
                            isCompleted && "text-green-600 dark:text-green-400"
                          )}
                          disabled={isLocked}
                        >
                          <div className="flex items-center space-x-3 flex-grow min-w-0">
                            <span className="text-lg flex-shrink-0">{topic.emoji}</span>
                            <div className="flex-grow min-w-0">
                              <div className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                                {topic.topic_title}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {(() => {
                                  const parsedDate = parseTopicDate(topic.date)
                                  if (!parsedDate) {
                                    return 'Invalid Date'
                                  }
                                  return parsedDate.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric' 
                                  })
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {isComingSoon && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Coming Soon</span>}
                            {isLocked && !isComingSoon && <Lock className="h-3 w-3 text-slate-400" />}
                            {isCompleted && <span className="text-xs text-green-600 dark:text-green-400">✓</span>}
                            {isCurrent && <span className="text-xs text-primary">●</span>}
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
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
                        {getNavigationText(allFilteredTopics[currentStackIndex + 1])} →
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {currentStackIndex < allFilteredTopics.length - 1 && (
                  <TooltipContent>
                    <p>{allFilteredTopics[currentStackIndex + 1].topic_title}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
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
              isComingSoon={isTopicComingSoon(allFilteredTopics[currentStackIndex].topic_id)}
              showFloatingKeyboard={false}
            />
        )}
      </div>

      {/* Fixed Start Quiz Button - Safari optimized */}
      {allFilteredTopics.length > 0 && 
       !isTopicLocked(allFilteredTopics[currentStackIndex]) && 
       !isTopicComingSoon(allFilteredTopics[currentStackIndex].topic_id) && (
        <Button 
          size="lg"
          className="fixed bottom-6 left-1/2 z-50 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-black font-medium px-8 sm:px-12 py-3 sm:py-4 rounded-xl shadow-2xl backdrop-blur-sm safari-fixed-button"
          style={{ 
            transform: 'translateX(-50%) translateZ(0)',
            WebkitTransform: 'translateX(-50%) translateZ(0)',
            position: 'fixed',
            willChange: 'auto',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          }}
          onClick={() => handleExploreGame(allFilteredTopics[currentStackIndex].topic_id)}
        >
          {isTopicCompleted(allFilteredTopics[currentStackIndex].topic_id) ? 'Review Quiz' : 'Start Quiz'}
        </Button>
      )}

      <PremiumGate
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="advanced_analytics"
        title="Unlock Unlimited Daily Quizzes"
        description="Continue your civic education journey with unlimited access to all our quizzes and premium features."
      />
    </div>
  )
}