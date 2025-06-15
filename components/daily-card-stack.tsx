"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

// More lenient date parsing
const parseTopicDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return null
  
  try {
    if (dateString instanceof Date) {
      if (isNaN(dateString.getTime())) return null
      return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate())
    }
    
    if (typeof dateString === 'string') {
      if (dateString.trim() === '' || dateString === 'null' || dateString === 'undefined') {
        return null
      }
      
      let parsed: Date
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-').map(Number)
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null
        parsed = new Date(year, month - 1, day)
      } else {
        parsed = new Date(dateString)
        if (isNaN(parsed.getTime())) return null
        parsed = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
      }
      
      console.log(`🔍 parseTopicDate: "${dateString}" -> ${parsed ? parsed.toISOString() : 'null'}`)
      return isNaN(parsed.getTime()) ? null : parsed
    }
    
    return null
  } catch (error) {
    console.warn(`parseTopicDate error parsing "${dateString}":`, error)
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
  const [topicsWithoutQuestions, setTopicsWithoutQuestions] = useState<Set<string>>(new Set())

  // Load topics from data service with enhanced debugging
  useEffect(() => {
    const loadTopics = async () => {
      try {
        setIsLoadingTopics(true)
        const topicsData = await dataService.getAllTopics()
        const topicsArray = Object.values(topicsData)
        
        console.log(`=== LOADING TOPICS DEBUG ===`)
        console.log(`Total topics loaded: ${topicsArray.length}`)
        
        // Log first few topics for debugging
        topicsArray.slice(0, 5).forEach((topic, index) => {
          console.log(`🔍 Sample Topic ${index + 1}:`, {
            id: topic.topic_id,
            title: topic.topic_title,
            date: topic.date,
            dateType: typeof topic.date,
            categories: topic.categories
          })
        })
        
        setTopicsList(topicsArray)
        
        // Check which topics have questions - with better error handling
        const topicsWithoutQuestionsSet = new Set<string>()
        
        console.log(`Checking questions for topics...`)
        const questionCheckResults = await Promise.allSettled(
          topicsArray.map(async (topic) => {
            try {
              const questions = await dataService.getQuestionsByTopic(topic.topic_id)
              const hasQuestions = questions.length > 0
              console.log(`Topic "${topic.topic_title}": ${questions.length} questions`)
              
              if (!hasQuestions) {
                topicsWithoutQuestionsSet.add(topic.topic_id)
              }
              
              return { topicId: topic.topic_id, hasQuestions, questionCount: questions.length }
            } catch (error) {
              console.warn(`Error checking questions for topic "${topic.topic_title}":`, error)
              // If we can't check, assume it has questions (don't mark as coming soon)
              return { topicId: topic.topic_id, hasQuestions: true, questionCount: -1, error: true }
            }
          })
        )
        
        console.log(`Question check results:`, questionCheckResults.map(result => 
          result.status === 'fulfilled' ? result.value : { error: result.reason }
        ))
        
        setTopicsWithoutQuestions(topicsWithoutQuestionsSet)
        console.log(`${topicsWithoutQuestionsSet.size} topics marked as coming soon (no questions)`)
        console.log(`Topics available: ${topicsArray.length - topicsWithoutQuestionsSet.size}`)
        
      } catch (error) {
        console.error('Error loading topics:', error)
        setTopicsList([])
      } finally {
        setIsLoadingTopics(false)
      }
    }

    loadTopics()
  }, [])

  // Enhanced filtering with debugging
  const organizedTopics: OrganizedTopics = topicsList
    .filter((topic) => {
      console.log(`🔍 FILTERING TOPIC: "${topic.topic_title}"`)
      console.log(`  Topic date: "${topic.date}"`)
      
      // More lenient date validation
      if (!topic.date) {
        console.warn(`❌ Topic "${topic.topic_title}" has no date, excluding`)
        return false
      }
      
      const parsedDate = parseTopicDate(topic.date)
      console.log(`  Parsed date:`, parsedDate)
      
      if (!parsedDate) {
        console.warn(`❌ Topic "${topic.topic_title}" has unparseable date "${topic.date}", excluding`)
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
        
        if (!matchesCategory) {
          console.log(`❌ Category filter excluding "${topic.topic_title}": selected="${selectedCategory}", topic categories=${JSON.stringify(topicCategories)}`)
        }
      }
      
      // Search filtering
      const matchesSearch =
        searchQuery === "" ||
        topic.topic_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const passes = matchesCategory && matchesSearch
      console.log(`  ✅ Topic "${topic.topic_title}" passes filters: ${passes} (category: ${matchesCategory}, search: ${matchesSearch})`)
      
      return passes
    })
    .reduce((acc, topic) => {
      console.log(`🔍 CATEGORIZING TOPIC: "${topic.topic_title}"`)
      const topicDate = parseTopicDate(topic.date)
      console.log(`  Topic date:`, topicDate)
      console.log(`  Current date:`, currentDate)
      
      if (!topicDate) return acc
      
      const category = getDateCategory(topicDate, currentDate)
      console.log(`  Date category:`, category)
      
      if (category) {
        acc[category].push(topic)
        console.log(`  ✅ Added to ${category} category`)
      }
      return acc
    }, { today: [], future: [], past: [] } as OrganizedTopics)

  // Log final results
  console.log(`=== FINAL FILTERING RESULTS ===`)
  console.log(`Total after filtering: ${organizedTopics.today.length + organizedTopics.future.length + organizedTopics.past.length}`)
  console.log(`Today: ${organizedTopics.today.length}, Future: ${organizedTopics.future.length}, Past: ${organizedTopics.past.length}`)
  console.log(`Selected category: ${selectedCategory}`)
  console.log(`Search query: "${searchQuery}"`)

  // Sort each category - most recent first
  organizedTopics.today.sort((a, b) => {
    const dateA = parseTopicDate(a.date)
    const dateB = parseTopicDate(b.date)
    if (!dateA || !dateB) return 0
    return dateB.getTime() - dateA.getTime() // Most recent first
  })
  organizedTopics.future.sort((a, b) => {
    const dateA = parseTopicDate(a.date)
    const dateB = parseTopicDate(b.date)
    if (!dateA || !dateB) return 0
    return dateB.getTime() - dateA.getTime() // Most recent first
  })
  organizedTopics.past.sort((a, b) => {
    const dateA = parseTopicDate(a.date)
    const dateB = parseTopicDate(b.date)
    if (!dateA || !dateB) return 0
    return dateB.getTime() - dateA.getTime() // Most recent first
  })

  // Combine all topics and sort chronologically - most recent first
  const allFilteredTopics = [
    ...organizedTopics.today,
    ...organizedTopics.future,
    ...organizedTopics.past
  ].sort((a, b) => {
    const dateA = parseTopicDate(a.date)
    const dateB = parseTopicDate(b.date)
    if (!dateA || !dateB) return 0
    
    const dateATime = dateA.getTime()
    const dateBTime = dateB.getTime()
    const todayTime = currentDate.getTime()
    
    // For past dates: most recent first (descending order)
    if (dateATime < todayTime && dateBTime < todayTime) {
      return dateBTime - dateATime
    }
    
    // For future dates: most recent first (descending order)
    if (dateATime > todayTime && dateBTime > todayTime) {
      return dateBTime - dateATime
    }
    
    // Mixed past/future: future dates come first, then past dates
    if (dateATime >= todayTime && dateBTime < todayTime) {
      return -1 // A (future) comes before B (past)
    }
    if (dateATime < todayTime && dateBTime >= todayTime) {
      return 1 // B (future) comes before A (past)
    }
    
    return dateBTime - dateATime // Default: most recent first
  })

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

  // Reset stack index when topics change
  useEffect(() => {
    setCurrentStackIndex(0)
  }, [allFilteredTopics.length, selectedCategory, searchQuery])

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
          setCurrentStackIndex(0)
          break
        case 'End':
          event.preventDefault()
          setCurrentStackIndex(allFilteredTopics.length - 1)
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

  const isTopicLocked = (topic: TopicMetadata) => {
    if (topicsWithoutQuestions.has(topic.topic_id)) {
      return true
    }
    
    const localTopicDate = parseTopicDate(topic.date)
    if (!localTopicDate) {
      return false
    }
    
    return localTopicDate > currentDate && !completedTopics.has(topic.topic_id)
  }

  const isTopicComingSoon = (topicId: string) => {
    return topicsWithoutQuestions.has(topicId)
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
    <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center">
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
                  <DropdownMenuContent align="center" className="w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    {allFilteredTopics.map((topic, index) => {
                      const isLocked = isTopicLocked(topic)
                      const isCompleted = isTopicCompleted(topic.topic_id)
                      const isCurrent = index === currentStackIndex
                      const isComingSoon = isTopicComingSoon(topic.topic_id)
                      
                      return (
                        <DropdownMenuItem
                          key={topic.topic_id}
                          onClick={() => !isLocked && setCurrentStackIndex(index)}
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