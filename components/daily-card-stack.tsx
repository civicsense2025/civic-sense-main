"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { dataService } from "@/lib/data-service"
import type { CategoryType, TopicMetadata } from "@/lib/quiz-data"
import { CivicCard } from "./civic-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronDown, Lock, Clock, Crown, Star, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { quizDatabase, type QuizAttempt } from "@/lib/quiz-database"
import { useGuestAccess } from "@/hooks/useGuestAccess"

// Helper to get today's date in user's local timezone
const getTodayAtMidnight = () => {
  // Use mock date for demo (June 14, 2025)
  const mockToday = new Date(2025, 5, 14) // Month is 0-indexed, so 5 = June
  return mockToday
}

// Optimized date parsing with caching
const dateCache = new Map<string, Date | null>()

const parseTopicDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return null
  
  const cacheKey = typeof dateString === 'string' ? dateString : null
  if (cacheKey && dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey)
  }
  
  try {
    let parsed: Date | null = null
    
    if (dateString instanceof Date) {
      if (isNaN(dateString.getTime())) return null
      parsed = new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate())
    }
    
    if (typeof dateString === 'string') {
      if (dateString.trim() === '' || dateString === 'null' || dateString === 'undefined') {
        parsed = null
      } else if (dateString.includes('-') && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number)
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          parsed = null
        } else {
          parsed = new Date(year, month - 1, day)
        }
      } else {
        const tempDate = new Date(dateString)
        if (isNaN(tempDate.getTime())) {
          console.warn(`Failed to parse date: "${dateString}"`)
          parsed = null
        } else {
          parsed = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate())
        }
      }
    }
    
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

// Helper to get relative date category
const getDateCategory = (date: string | Date, currentDate: Date) => {
  const localTopicDate = parseTopicDate(date)
  if (!localTopicDate) return null
  
  const localCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  const diffTime = localTopicDate.getTime() - localCurrentDate.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays > 0) return 'future'
  return 'past'
}

// Custom hook for topic access logic
const useTopicAccess = () => {
  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { hasReachedDailyLimit, GUEST_DAILY_QUIZ_LIMIT } = useGuestAccess()
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())
  const [topicsWithoutQuestions, setTopicsWithoutQuestions] = useState<Set<string>>(new Set())

  // Load completed topics from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    if (savedCompleted) {
      setCompletedTopics(new Set(JSON.parse(savedCompleted)))
    }
  }, [])

  // Save completed topics to localStorage
  useEffect(() => {
    localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(Array.from(completedTopics)))
  }, [completedTopics])

  const getTopicAccessStatus = useCallback((topic: TopicMetadata) => {
    const currentDate = getTodayAtMidnight()
    const localTopicDate = parseTopicDate(topic.date)
  
    if (!localTopicDate) {
      return { accessible: false, reason: 'invalid_date' }
    }

    // Check if topic has no questions
    if (topicsWithoutQuestions.has(topic.topic_id)) {
      return { accessible: false, reason: 'coming_soon' }
    }

    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      const oneWeekFromNow = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      if (localTopicDate > oneWeekFromNow && !completedTopics.has(topic.topic_id)) {
        return { accessible: false, reason: 'future_locked' }
      }
      return { accessible: true, reason: 'available' }
    }

    const today = getTodayAtMidnight()
    const isToday = localTopicDate.getTime() === today.getTime()
    const isCompleted = completedTopics.has(topic.topic_id)

    // Guest access logic
    if (!user) {
      if (!isToday) {
        return { accessible: false, reason: 'guest_wants_more' }
      }
      if (hasReachedDailyLimit() && !isCompleted) {
        return { accessible: false, reason: 'guest_loving_content' }
      }
      return { accessible: true, reason: 'guest_exploring_today' }
    }

    // Authenticated user logic
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Premium/Pro users have full access
    if (isPremium || isPro) {
      return { accessible: true, reason: 'premium_access' }
    }

    // Free users: today + completed + 1 week back
    if (isToday || isCompleted || localTopicDate >= oneWeekAgo) {
      return { accessible: true, reason: 'free_user_allowed' }
    }

    // Older content requires premium
    return { accessible: false, reason: 'premium_required' }
  }, [user, isPremium, isPro, hasReachedDailyLimit, completedTopics, topicsWithoutQuestions])

  return {
    getTopicAccessStatus,
    completedTopics,
    setCompletedTopics,
    topicsWithoutQuestions,
    setTopicsWithoutQuestions,
    isTopicCompleted: useCallback((topicId: string) => completedTopics.has(topicId), [completedTopics])
  }
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

// Move GuestAccessBanner outside of DailyCardStack
interface GuestAccessBannerProps {
  user: any;
  IP_TRACKING_ENABLED: boolean;
  getSuspiciousActivity: () => Promise<any>;
  getGuestAccessSummary: () => {
    hasReachedLimit: boolean;
    remaining: number;
    total: number;
  };
  GUEST_DAILY_QUIZ_LIMIT: number;
}

function GuestAccessBanner({ 
  user, 
  IP_TRACKING_ENABLED, 
  getSuspiciousActivity, 
  getGuestAccessSummary, 
  GUEST_DAILY_QUIZ_LIMIT 
}: GuestAccessBannerProps) {
  const [suspiciousActivity, setSuspiciousActivity] = useState<any>(null);
  
  useEffect(() => {
    if (!user && IP_TRACKING_ENABLED) {
      const checkActivity = async () => {
        try {
          const result = await getSuspiciousActivity();
          if (result && result.suspicious) {
            setSuspiciousActivity(result);
          }
        } catch (error) {
          console.warn('Error checking suspicious activity:', error);
        }
      };
      checkActivity();
    }
  }, [user, IP_TRACKING_ENABLED, getSuspiciousActivity]);

  if (!user) {
    const summary = getGuestAccessSummary();
    
    return (
      <div className="mb-4 text-center space-y-2">
        <div className={cn(
          "px-4 py-2 rounded-lg border animate-in fade-in duration-300",
          summary.hasReachedLimit 
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            : "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
        )}>
          <p className="text-sm font-medium">
            {summary.hasReachedLimit 
              ? `Thanks for trying CivicSense! Support our mission to unlock unlimited quizzes`
              : `Free Access: ${summary.remaining} of ${GUEST_DAILY_QUIZ_LIMIT} daily quizzes remaining today`
            }
          </p>
          {!summary.hasReachedLimit && (
            <p className="text-xs mt-1">Love what we're doing? Consider a small donation to keep civic education free for everyone</p>
          )}
          
          {IP_TRACKING_ENABLED && !summary.hasReachedLimit && (
            <div className="mt-2 w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(summary.total - summary.remaining) / summary.total * 100}%` }}
              />
            </div>
          )}
        </div>

        {suspiciousActivity && (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium">
              Welcome back! We see you're really enjoying our civic education content 🎉
            </p>
            <p className="text-xs mt-1">
              Help us keep this free for everyone with a small donation or create a free account for unlimited access
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Move InlinePremiumPrompt outside of DailyCardStack
interface InlinePremiumPromptProps {
  showInlinePremiumPrompt: boolean;
  setShowInlinePremiumPrompt: (show: boolean) => void;
  router: any;
  onAuthRequired?: () => void;
}

function InlinePremiumPrompt({ 
  showInlinePremiumPrompt, 
  setShowInlinePremiumPrompt, 
  router, 
  onAuthRequired 
}: InlinePremiumPromptProps) {
  if (!showInlinePremiumPrompt) return null;

  return (
    <Card className="mb-6 border-2 border-blue-500 shadow-xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-xl text-blue-600">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span>Support CivicSense & Unlock Everything</span>
            <Badge className="bg-blue-500 text-white">Best Value</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInlinePremiumPrompt(false)}
            className="h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>
        <CardDescription className="text-base">
          Help us keep civic education free for everyone while getting unlimited access to all our quizzes and features.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Unlimited daily quizzes",
            "Advanced progress tracking", 
            "Custom study collections",
            "Priority support",
            "Offline quiz access",
            "Detailed analytics"
          ].map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={() => router.push('/donate?source=daily_cards')}
            className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Unlock with Donation
          </Button>
          <Button
            variant="outline"
            onClick={() => onAuthRequired?.()}
            className="flex-1 h-12 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Create Free Account
          </Button>
        </div>
        
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <p>Donate $25+ for annual access • $50+ for lifetime access</p>
          <p className="text-xs mt-1">Or create a free account for limited daily access</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyCardStack({
  selectedCategory,
  searchQuery,
  requireAuth = false,
  onAuthRequired,
}: DailyCardStackProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { autoPlayEnabled, readContentWithSettings } = useGlobalAudio()
  const { 
    recordQuizAttempt,
    hasReachedDailyLimit, 
    getRemainingAttempts,
    getGuestAccessSummary,
    getSuspiciousActivity,
    GUEST_DAILY_QUIZ_LIMIT,
    IP_TRACKING_ENABLED,
    serverLimitReached
  } = useGuestAccess()
  
  const {
    getTopicAccessStatus,
    completedTopics,
    setCompletedTopics,
    topicsWithoutQuestions,
    setTopicsWithoutQuestions,
    isTopicCompleted
  } = useTopicAccess()

  // All useState hooks at the top
  const [currentDate, setCurrentDate] = useState(getTodayAtMidnight())
  const [topicsList, setTopicsList] = useState<TopicMetadata[]>([])
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)
  const [showInlinePremiumPrompt, setShowInlinePremiumPrompt] = useState(false)
  const [currentStackIndex, setCurrentStackIndex] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(20)

  // Move all useMemo hooks here BEFORE useCallback hooks
  const organizedTopics = useMemo(() => {
    if (!topicsList || topicsList.length === 0) {
      return { today: [], future: [], past: [] }
    }

    return topicsList
      .filter((topic) => {
        if (!topic || !topic.date) return false
        
        const parsedDate = parseTopicDate(topic.date)
        if (!parsedDate) return false
        
        let matchesCategory = true
        if (selectedCategory !== null) {
          const topicCategories = Array.isArray(topic.categories) ? topic.categories : []
          matchesCategory = topicCategories.some(cat => 
            cat === selectedCategory || 
            cat.toLowerCase() === selectedCategory.toLowerCase()
          )
        }
        
        const matchesSearch =
          searchQuery === "" ||
          (topic.topic_title && topic.topic_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()))
        
        return matchesCategory && matchesSearch
      })
      .reduce((acc, topic) => {
        const topicDate = parseTopicDate(topic.date)
        if (!topicDate) return acc
        
        const category = getDateCategory(topicDate, currentDate)
        if (category && acc[category]) {
          acc[category].push(topic)
        }
        return acc
      }, { today: [], future: [], past: [] } as OrganizedTopics)
  }, [topicsList, selectedCategory, searchQuery, currentDate])

  const allFilteredTopics = useMemo(() => {
    return [
      ...(organizedTopics.today || []),
      ...(organizedTopics.future || []),
      ...(organizedTopics.past || [])
    ].sort((a, b) => {
      const dateA = parseTopicDate(a.date)
      const dateB = parseTopicDate(b.date)
      if (!dateA || !dateB) return 0
      return dateB.getTime() - dateA.getTime()
    })
  }, [organizedTopics])

  // Now all useCallback hooks that depend on allFilteredTopics
  const updateUrlWithTopic = useCallback((index: number) => {
    if (allFilteredTopics[index]) {
      const topicId = allFilteredTopics[index].topic_id
      const url = new URL(window.location.href)
      url.searchParams.set('topic', topicId)
      window.history.replaceState(null, '', url.toString())
    }
  }, [allFilteredTopics])

  const handlePrevious = useCallback(() => {
    const newIndex = Math.max(0, currentStackIndex - 1)
    setCurrentStackIndex(newIndex)
    updateUrlWithTopic(newIndex)
  }, [currentStackIndex, updateUrlWithTopic])

  const handleNext = useCallback(() => {
    const newIndex = Math.min(allFilteredTopics.length - 1, currentStackIndex + 1)
    setCurrentStackIndex(newIndex)
    updateUrlWithTopic(newIndex)
  }, [currentStackIndex, allFilteredTopics.length, updateUrlWithTopic])

  const handleIndexChange = useCallback((index: number) => {
    setCurrentStackIndex(index)
    updateUrlWithTopic(index)
  }, [updateUrlWithTopic])

  const handleExploreGame = useCallback(async (topicId: string) => {
    const topic = topicsList.find(t => t.topic_id === topicId)
    if (!topic) return

    const accessStatus = getTopicAccessStatus(topic)

    if (!accessStatus.accessible) {
      switch (accessStatus.reason) {
        case 'coming_soon':
          console.log(`Great news! "${topic.topic_title}" is coming soon to CivicSense!`)
          return
        case 'guest_wants_more':
        case 'guest_loving_content':
          console.log('Thanks for trying CivicSense! Create a free account or consider supporting us for unlimited access.')
          onAuthRequired?.()
          return
        case 'premium_required':
          setShowInlinePremiumPrompt(true)
          return
        case 'future_locked':
          console.log(`"${topic.topic_title}" will be available soon. Check back later!`)
          return
        default:
          return
      }
    }

    if (!user && accessStatus.reason === 'guest_exploring_today') {
      try {
        await recordQuizAttempt()
      } catch (error) {
        console.error('Failed to record quiz attempt:', error)
      }
    }

    router.push(`/quiz/${topicId}`)
  }, [topicsList, getTopicAccessStatus, user, recordQuizAttempt, router, onAuthRequired])

  // Helper function to check for topics without questions
  const checkTopicsForQuestions = useCallback(async (topics: TopicMetadata[]) => {
    const topicsWithoutQuestionsSet = new Set<string>()
    
    for (const topic of topics) {
      try {
        const questions = await dataService.getQuestionsByTopic(topic.topic_id)
        if (!questions || Object.keys(questions).length === 0) {
          topicsWithoutQuestionsSet.add(topic.topic_id)
        }
      } catch (error) {
        console.warn(`Error checking questions for topic ${topic.topic_id}:`, error)
        topicsWithoutQuestionsSet.add(topic.topic_id)
      }
    }
    
    setTopicsWithoutQuestions(topicsWithoutQuestionsSet)
  }, [])

  // All useEffect hooks last
  useEffect(() => {
    const loadInitialTopics = async () => {
      try {
        setIsLoadingTopics(true)
        const today = getTodayAtMidnight()
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 3)
        const endDate = new Date(today)
        endDate.setDate(today.getDate() + 3)
        
        const topicsData = await dataService.getTopicsInRange(startDate, endDate)
        const topicsArray = Object.values(topicsData)
        setTopicsList(topicsArray)
        
        if (process.env.NODE_ENV !== 'development') {
          await checkTopicsForQuestions(topicsArray)
        }
      } catch (error) {
        console.error('Error loading initial topics:', error)
        setTopicsList([])
      } finally {
        setIsLoadingTopics(false)
      }
    }

    loadInitialTopics()
  }, [checkTopicsForQuestions])

  useEffect(() => {
    const topicParam = searchParams.get('topic')
    if (topicParam && allFilteredTopics.length > 0) {
      const topicIndex = allFilteredTopics.findIndex(topic => topic.topic_id === topicParam)
      if (topicIndex !== -1) {
        setCurrentStackIndex(topicIndex)
      }
    }
  }, [searchParams, allFilteredTopics])

  useEffect(() => {
    if (autoPlayEnabled && allFilteredTopics.length > 0 && currentStackIndex < allFilteredTopics.length) {
      const currentTopic = allFilteredTopics[currentStackIndex]
      if (currentTopic) {
        const readableContent = `${currentTopic.topic_title}. ${currentTopic.description || ''}`
        const timer = setTimeout(async () => {
          await readContentWithSettings(readableContent)
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [currentStackIndex, allFilteredTopics, autoPlayEnabled, readContentWithSettings])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      
      if (allFilteredTopics.length === 0) return
      
      const currentTopic = allFilteredTopics[currentStackIndex]
      if (!currentTopic) return
      
      const currentAccessStatus = getTopicAccessStatus(currentTopic)
      
      if (e.key === 'ArrowLeft') {
        handlePrevious()
        e.preventDefault()
      } else if (e.key === 'ArrowRight') {
        handleNext()
        e.preventDefault()
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (currentAccessStatus.accessible) {
          handleExploreGame(currentTopic.topic_id)
          e.preventDefault()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStackIndex, allFilteredTopics, getTopicAccessStatus, handlePrevious, handleNext, handleExploreGame])

  // Add missing cardBaseHeight constant
  const cardBaseHeight = "h-[500px]"

  // Loading state
  if (isLoadingTopics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Preparing your civic learning journey...</p>
          <p className="text-sm text-slate-500 mt-2">Loading today's most important topics</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (allFilteredTopics.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <Calendar className="h-16 w-16 mx-auto text-slate-400 mb-6" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Looking for more civic content?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {selectedCategory || searchQuery
              ? "Try adjusting your search - we're always adding new content!"
              : "We're working hard to bring you fresh civic education content. Check back soon!"}
          </p>
          {!user && (
            <div className="mt-4">
              <Button 
                onClick={onAuthRequired}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full px-6 py-3"
              >
                Create Free Account
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Get notified when new content is available
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentTopic = allFilteredTopics[currentStackIndex]
  const currentAccessStatus = getTopicAccessStatus(currentTopic)

  return (
    <div className="min-h-[50vh] flex flex-col justify-center py-4 sm:py-8">
      {/* Enhanced Guest Access Banner */}
      <GuestAccessBanner 
        user={user}
        IP_TRACKING_ENABLED={IP_TRACKING_ENABLED}
        getSuspiciousActivity={getSuspiciousActivity}
        getGuestAccessSummary={getGuestAccessSummary}
        GUEST_DAILY_QUIZ_LIMIT={GUEST_DAILY_QUIZ_LIMIT}
      />

      {/* Inline Premium Prompt */}
      <InlinePremiumPrompt 
        showInlinePremiumPrompt={showInlinePremiumPrompt}
        setShowInlinePremiumPrompt={setShowInlinePremiumPrompt}
        router={router}
        onAuthRequired={onAuthRequired}
      />

      {/* Navigation - Simplified for readability */}
      {allFilteredTopics.length > 1 && (
        <div className="mb-8 sm:mb-16">
          <div className="flex items-center justify-between px-2 sm:px-8">
            {/* Previous button */}
            <button
              onClick={handlePrevious}
              disabled={currentStackIndex === 0}
              className={cn(
                "text-xs sm:text-sm font-medium tracking-wide transition-opacity min-w-0 flex-shrink-0",
                currentStackIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-70 hover:opacity-100"
              )}
            >
              {currentStackIndex > 0 && `← ${parseTopicDate(allFilteredTopics[currentStackIndex - 1].date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </button>

            {/* Current date dropdown */}
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50 tracking-wide hover:opacity-70 transition-opacity">
                  <span>
                    {parseTopicDate(currentTopic.date)?.toLocaleDateString('en-US', { 
                      weekday: 'short', month: 'short', day: 'numeric' 
                    })}
                  </span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[90vw] max-w-md max-h-96 overflow-y-auto">
                {allFilteredTopics.slice(0, visibleTopicsCount).map((topic, idx) => {
                  const accessStatus = getTopicAccessStatus(topic)
                  const isCurrent = idx === currentStackIndex
                              
                  return (
                    <DropdownMenuItem
                      key={topic.topic_id}
                      onClick={() => {
                        if (accessStatus.accessible) {
                          handleIndexChange(idx)
                          setDropdownOpen(false)
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between p-3",
                        isCurrent && "bg-primary/10 font-medium",
                        !accessStatus.accessible && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!accessStatus.accessible}
                    >
                      <div className="flex items-center space-x-3 flex-grow min-w-0">
                        <span className="text-lg flex-shrink-0">{topic.emoji}</span>
                        <div className="flex-grow min-w-0">
                          <div className="text-sm font-medium truncate">{topic.topic_title}</div>
                          <div className="text-xs text-slate-500">
                            {parseTopicDate(topic.date)?.toLocaleDateString('en-US', { 
                              weekday: 'short', month: 'short', day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {accessStatus.reason === 'coming_soon' && <span className="text-xs text-amber-600">Coming Soon</span>}
                        {!accessStatus.accessible && accessStatus.reason !== 'coming_soon' && <Lock className="h-3 w-3" />}
                        {isTopicCompleted(topic.topic_id) && <span className="text-xs text-green-600">✓</span>}
                        {isCurrent && <span className="text-xs text-primary">●</span>}
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Next button */}
            <button
              onClick={handleNext}
              disabled={currentStackIndex === allFilteredTopics.length - 1}
              className={cn(
                "text-xs sm:text-sm font-medium tracking-wide transition-opacity min-w-0 flex-shrink-0",
                currentStackIndex === allFilteredTopics.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-70 hover:opacity-100"
              )}
            >
              {currentStackIndex < allFilteredTopics.length - 1 && `${parseTopicDate(allFilteredTopics[currentStackIndex + 1].date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →`}
            </button>
          </div>
        </div>
      )}

      {/* Single Card Display */}
      <div className="relative">
        <CivicCard
          topic={currentTopic}
          baseHeight={cardBaseHeight}
          onExploreGame={handleExploreGame}
          isCompleted={isTopicCompleted(currentTopic.topic_id)}
          isLocked={!currentAccessStatus.accessible}
          isComingSoon={currentAccessStatus.reason === 'coming_soon'}
          showFloatingKeyboard={false}
          guestLocked={!user && currentAccessStatus.reason?.startsWith('guest')}
        />
      </div>

      {/* Fixed Start Quiz Button */}
      <div className="h-24 w-full relative">
        <div className="fixed-bottom-button max-w-lg w-full flex items-center justify-center">
          {currentAccessStatus.accessible ? (
            <Button 
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full shadow-lg px-8 py-4 min-w-[240px]"
              onClick={() => handleExploreGame(currentTopic.topic_id)}
            >
              {isTopicCompleted(currentTopic.topic_id) ? 'Review Quiz' : 'Start Quiz'}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="rounded-full shadow-lg px-8 py-4 min-w-[240px] cursor-not-allowed opacity-50"
              disabled
            >
              {currentAccessStatus.reason === 'coming_soon' ? 'Coming Soon! 🚀' : 
               currentAccessStatus.reason?.startsWith('guest') ? 'Support CivicSense to Continue' :
               currentAccessStatus.reason === 'premium_required' ? 'Unlock with Donation' : 
               'Available Soon'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}