"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import { supabase } from "@/lib/supabase/client"
import { StartQuizButton } from "@/components/start-quiz-button"

// Helper to get today's date at midnight in the user's local timezone
// If you need to mock a date for testing, set NEXT_PUBLIC_MOCK_DATE="YYYY-MM-DD"
const getTodayAtMidnight = () => {
  const mock = process.env.NEXT_PUBLIC_MOCK_DATE
  if (mock) {
    const [y, m, d] = mock.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
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
const getDateCategory = (date: string | Date, currentDate: Date): 'today' | 'future' | 'past' | null => {
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
  const [isInitialized, setIsInitialized] = useState(false)

  // Load completed topics from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
      if (savedCompleted) {
        try {
          setCompletedTopics(new Set(JSON.parse(savedCompleted)))
        } catch (error) {
          console.warn('Failed to parse completed topics from localStorage:', error)
        }
      }
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Save completed topics to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && completedTopics.size > 0) {
      try {
        localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(Array.from(completedTopics)))
      } catch (error) {
        console.warn('Failed to save completed topics to localStorage:', error)
      }
    }
  }, [completedTopics, isInitialized])

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

    // BREAKING & FEATURED CONTENT: Always accessible to everyone
    if (topic.is_breaking || topic.is_featured) {
      return { accessible: true, reason: 'breaking_or_featured_content' }
    }

    // If topic date is in the future, lock it for everyone until that day
    if (localTopicDate > currentDate) {
      return { accessible: false, reason: 'future_locked' }
    }

    // Pre-compute commonly used flags
    const isToday = localTopicDate.getTime() === currentDate.getTime()
    const isCompleted = completedTopics.has(topic.topic_id)

    // Guest access logic
    if (!user) {
      const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (localTopicDate < oneWeekAgo) {
        return { accessible: false, reason: 'guest_wants_more' }
      }
      if (hasReachedDailyLimit() && !completedTopics.has(topic.topic_id)) {
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
  showGuestBanner?: boolean
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
              : ``
            }
          </p>
          
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

function truncateTitle(title: string, maxLength: number = 20) {
  return title.length > maxLength ? title.slice(0, maxLength) + '…' : title;
}

export function DailyCardStack({
  selectedCategory,
  searchQuery,
  requireAuth = false,
  onAuthRequired,
  showGuestBanner = true,
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
  const [totalTopicsCount, setTotalTopicsCount] = useState<number>(0)
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)
  const [isLoadingMoreTopics, setIsLoadingMoreTopics] = useState(false)
  const [showInlinePremiumPrompt, setShowInlinePremiumPrompt] = useState(false)
  const [currentStackIndex, setCurrentStackIndex] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(20)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownSearch, setDropdownSearch] = useState("")
  const [debouncedDropdownSearch, setDebouncedDropdownSearch] = useState("")
  const supabaseClientRef = useRef<any>(null)
  const [trendingQueries, setTrendingQueries] = useState<string[]>([])
  const prevIndexRef = useRef(0)
  
  // Touch/swipe handling for mobile
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwipeActive, setIsSwipeActive] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Debounce dropdown search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDropdownSearch(dropdownSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [dropdownSearch])

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
    const allTopics = [
      ...(organizedTopics.today || []),
      ...(organizedTopics.future || []),
      ...(organizedTopics.past || [])
    ]
    
    // Debug logging to see what we're working with
    const breakingTopics = allTopics.filter(t => t.is_breaking === true)
    const featuredTopics = allTopics.filter(t => t.is_featured === true)
    console.log(`🔍 Topic sorting: ${allTopics.length} total, ${breakingTopics.length} breaking, ${featuredTopics.length} featured`)
    
    if (featuredTopics.length > 0) {
      console.log(`🌟 Featured topics:`, featuredTopics.map(t => ({ 
        id: t.topic_id,
        title: t.topic_title.substring(0, 40) + '...', 
        breaking: !!t.is_breaking, 
        featured: !!t.is_featured 
      })))
      
      // Check for duplicates
      const uniqueIds = new Set(featuredTopics.map(t => t.topic_id))
      if (uniqueIds.size !== featuredTopics.length) {
        console.error(`🚨 DUPLICATE FEATURED TOPICS DETECTED! ${featuredTopics.length} topics but only ${uniqueIds.size} unique IDs`)
        console.log(`🔍 Duplicate analysis:`, featuredTopics.map(t => t.topic_id))
      }
    }
    
    const sorted = allTopics.sort((a, b) => {
      // First priority: Breaking news (is_breaking = true)
      const aIsBreaking = a.is_breaking === true
      const bIsBreaking = b.is_breaking === true
      
      if (aIsBreaking && !bIsBreaking) return -1
      if (!aIsBreaking && bIsBreaking) return 1
      
      // Second priority: Featured topics (is_featured = true) - but only if neither is breaking
      if (!aIsBreaking && !bIsBreaking) {
        const aIsFeatured = a.is_featured === true
        const bIsFeatured = b.is_featured === true
        
        if (aIsFeatured && !bIsFeatured) return -1
        if (!aIsFeatured && bIsFeatured) return 1
      }
      
      // Third priority: Date (most recent first)
      const dateA = parseTopicDate(a.date)
      const dateB = parseTopicDate(b.date)
      if (!dateA || !dateB) return 0
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`🎯 Final order (first 10):`, sorted.slice(0, 10).map(t => ({ 
      title: t.topic_title.substring(0, 30) + '...', 
      breaking: t.is_breaking, 
      featured: t.is_featured 
    })))
    
    return sorted
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

  // Touch event handlers for mobile swiping with visual feedback
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    setIsSwipeActive(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !isSwipeActive) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    
    // Only track horizontal movement
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Prevent vertical scrolling when swiping horizontally
      e.preventDefault()
      
      // Apply resistance at the edges - stronger resistance as you go further
      const maxOffset = 100
      const resistance = 0.6
      let adjustedOffset = deltaX
      
      if (Math.abs(deltaX) > maxOffset) {
        const excess = Math.abs(deltaX) - maxOffset
        adjustedOffset = deltaX > 0 
          ? maxOffset + (excess * resistance)
          : -maxOffset - (excess * resistance)
      }
      
      setSwipeOffset(adjustedOffset)
    }
  }, [isSwipeActive])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    
    const touch = e.changedTouches[0]
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    
    const deltaX = touchEndRef.current.x - touchStartRef.current.x
    const deltaY = touchEndRef.current.y - touchStartRef.current.y
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time
    
    // Reset visual state
    setIsSwipeActive(false)
    setSwipeOffset(0)
    
    // Only process swipes that are:
    // - Primarily horizontal (more horizontal than vertical movement)
    // - Fast enough (less than 500ms)
    // - Long enough (at least 80px for better UX)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
    const isFastEnough = deltaTime < 500
    const isLongEnough = Math.abs(deltaX) > 80
    
    if (isHorizontalSwipe && isFastEnough && isLongEnough) {
      if (deltaX > 0) {
        // Swipe right - go to previous item in list
        handlePrevious()
      } else {
        // Swipe left - go to next item in list
        handleNext()
      }
    }
    
    // Reset touch tracking
    touchStartRef.current = null
    touchEndRef.current = null
  }, [handlePrevious, handleNext])

  const handleExploreGame = useCallback(async (topicId: string) => {
    const topic = topicsList.find(t => t.topic_id === topicId)
    if (!topic) return

    const accessStatus = getTopicAccessStatus(topic)

    if (!accessStatus.accessible) {
      switch (accessStatus.reason) {
        case 'coming_soon':
          console.log(`Great news! "${topic.topic_title}" is coming soon to CivicSense!`)
          return
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

    // For breaking/featured content or guest users exploring today, record the attempt
    if (!user && (accessStatus.reason === 'guest_exploring_today' || accessStatus.reason === 'breaking_or_featured_content')) {
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
        // Don't load all questions, just check if they exist
        const hasQuestions = await dataService.checkTopicHasQuestions(topic.topic_id)
        if (!hasQuestions) {
          topicsWithoutQuestionsSet.add(topic.topic_id)
        }
      } catch (error) {
        console.warn(`Error checking questions for topic ${topic.topic_id}:`, error)
        topicsWithoutQuestionsSet.add(topic.topic_id)
      }
    }
    
    setTopicsWithoutQuestions(topicsWithoutQuestionsSet)
  }, [])

  // Keep track of loaded date ranges to avoid duplicate loading
  const [loadedDateRanges, setLoadedDateRanges] = useState<Set<string>>(new Set())

  // Lazy load topics for a specific date range
  const loadTopicsForDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    const rangeKey = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`
    
    // Skip if we've already loaded this range
    if (loadedDateRanges.has(rangeKey)) {
      return
    }

    try {
      setIsLoadingTopics(true)
      
      // Load both date range topics and featured topics (to ensure featured are always available)
      const [topicsData, featuredTopicsData] = await Promise.all([
        dataService.getTopicsInRange(startDate, endDate),
        dataService.getFeaturedTopics()
      ])
      
      let newRangeTopics: TopicMetadata[] = Object.values(topicsData)
      const featuredTopics: TopicMetadata[] = Object.values(featuredTopicsData)
      
      // If range loading didn't give us many new topics, try loading ALL topics
      if (newRangeTopics.length < 50) {
        console.log(`📚 Range lazy load only got ${newRangeTopics.length} topics, trying ALL topics`)
        const allTopicsData = await dataService.getAllTopics()
        newRangeTopics = Object.values(allTopicsData)
      }
      
      // Combine and deduplicate new topics
      const combinedNewTopics = [...newRangeTopics, ...featuredTopics]
      
      // First, deduplicate within the new topics themselves
      const newTopicsSeenIds = new Set<string>()
      const deduplicatedNewTopics = combinedNewTopics.filter(topic => {
        if (!topic?.topic_id) return false
        if (newTopicsSeenIds.has(topic.topic_id)) {
          console.log(`🔍 Removing duplicate in lazy load: ${topic.topic_id}`)
          return false
        }
        newTopicsSeenIds.add(topic.topic_id)
        return true
      })
      
      // Merge with existing topics (avoid duplicates with existing list)
      setTopicsList(prevTopics => {
        const existingIds = new Set(prevTopics.map(t => t.topic_id))
        const uniqueNewTopics = deduplicatedNewTopics.filter(t => !existingIds.has(t.topic_id))
        
        if (uniqueNewTopics.length > 0) {
          console.log(`📚 Lazy loaded ${uniqueNewTopics.length} new unique topics (${combinedNewTopics.length - deduplicatedNewTopics.length} internal dupes removed, ${deduplicatedNewTopics.length - uniqueNewTopics.length} existing dupes filtered)`)
          return [...prevTopics, ...uniqueNewTopics].sort((a, b) => {
            const dateA = new Date(a.date || '').getTime()
            const dateB = new Date(b.date || '').getTime()
            return dateB - dateA // Most recent first
          })
        }
        return prevTopics
      })
      
      // Mark this range as loaded
      setLoadedDateRanges(prev => new Set([...prev, rangeKey]))
      
      // Check questions for new topics (but limit the number to avoid performance issues)
      if (process.env.NODE_ENV !== 'development' && deduplicatedNewTopics.length > 0 && deduplicatedNewTopics.length < 20) {
        await checkTopicsForQuestions(deduplicatedNewTopics)
      }
    } catch (error) {
      console.error('Error lazy loading topics:', error)
    } finally {
      setIsLoadingTopics(false)
    }
  }, [loadedDateRanges, checkTopicsForQuestions])

  // Enhanced loading with lazy loading support
  useEffect(() => {
    let isCancelled = false

    const loadInitialTopics = async () => {
      try {
        setIsLoadingTopics(true)
        
        // First, get the total count of all topics to show correct pagination
        try {
          // Try to get count efficiently from database
          if (!supabaseClientRef.current) {
            supabaseClientRef.current = supabase
          }
          
          // Get count of ALL active topics with valid dates (not just a limited range)
          const { count, error } = await supabaseClientRef.current
            .from('question_topics')
            .select('*', { count: 'exact', head: true })
            .filter('date', 'not.is', null)
            .eq('is_active', true)
          
          if (error) throw error
          
          const totalCount = count || 0
          if (!isCancelled) {
            setTotalTopicsCount(totalCount)
            console.log(`📊 Total active topics available in database: ${totalCount}`)
          }
        } catch (countError) {
          console.warn('Could not get total topics count from database, falling back:', countError)
          // Fallback to loading all topics for count
          try {
            const allTopicsData = await dataService.getAllTopics()
            const totalCount = Object.keys(allTopicsData).length
            if (!isCancelled) {
              setTotalTopicsCount(totalCount)
              console.log(`📊 Total topics available (fallback method): ${totalCount}`)
            }
          } catch (fallbackError) {
            console.warn('Could not get total topics count:', fallbackError)
            setTotalTopicsCount(0)
          }
        }
        
        // First, load priority content: featured topics (always show) and today's topics
        const today = getTodayAtMidnight()
        
        // Load featured topics first (they should always be visible regardless of date)
        const featuredTopicsData = await dataService.getFeaturedTopics()
        const featuredTopics: TopicMetadata[] = Object.values(featuredTopicsData)
        
        // Load today's topics (prioritized with breaking news first)
        const todaysTopicsData = await dataService.getTopicsForDate(today)
        const todaysTopics: TopicMetadata[] = Object.values(todaysTopicsData)
        
        console.log(`📚 Priority load: ${featuredTopics.length} featured topics, ${todaysTopics.length} topics for today (${today.toDateString()})`)
        
        // Then load topics for a much broader range to ensure we get all content
        const startDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000) // 6 months ago  
        const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)    // 3 months ahead
        
        let rangeTopicsData = await dataService.getTopicsInRange(startDate, endDate)
        let rangeTopics: TopicMetadata[] = Object.values(rangeTopicsData)
        
        // If we don't have many topics from the range, load ALL topics as fallback
        if (rangeTopics.length < 100) {
          console.log(`📚 Range only returned ${rangeTopics.length} topics, loading ALL topics as fallback`)
          const allTopicsData = await dataService.getAllTopics()
          rangeTopics = Object.values(allTopicsData)
        }
        
        // Filter out today's topics and featured topics from range to avoid duplicates
        const todayString = today.toISOString().split('T')[0]
        const featuredIds = new Set(featuredTopics.map(t => t.topic_id))
        const todayIds = new Set(todaysTopics.map(t => t.topic_id))
        const otherRangeTopics = rangeTopics.filter(topic => 
          topic.date !== todayString && 
          !featuredIds.has(topic.topic_id) &&
          !todayIds.has(topic.topic_id)
        )
        
        // Combine all topics with deduplication
        const combinedTopics = [
          ...featuredTopics, // Featured topics (will be sorted with breaking featured first)
          ...todaysTopics, // Today's topics (already sorted with breaking news first)
          ...otherRangeTopics.sort((a, b) => {
            const dateA = new Date(a.date || '').getTime()
            const dateB = new Date(b.date || '').getTime()
            return dateB - dateA // Most recent first
          })
        ]
        
        // DEDUPLICATION: Remove duplicate topics by topic_id
        const seenIds = new Set<string>()
        const allTopics = combinedTopics.filter(topic => {
          if (!topic?.topic_id) return false // Filter out topics without IDs
          if (seenIds.has(topic.topic_id)) {
            console.log(`🔍 Removing duplicate topic: ${topic.topic_id} - ${topic.topic_title}`)
            return false
          }
          seenIds.add(topic.topic_id)
          return true
        })
        
        if (isCancelled) return
        
        setTopicsList(allTopics)
        
        console.log(`📚 Initial load complete: ${allTopics.length} loaded topics (${featuredTopics.length} featured, ${todaysTopics.length} for today, ${otherRangeTopics.length} surrounding dates)`)
        console.log(`📊 Database total: ${totalTopicsCount} topics | Range load: ${rangeTopics.length} topics | Successfully loaded: ${allTopics.length}`)
        
        if (allTopics.length < totalTopicsCount) {
          console.log(`⚠️ Note: Only loaded ${allTopics.length} of ${totalTopicsCount} total topics. More will load dynamically as needed.`)
        }
        
        // Mark both today and the range as loaded
        const todayKey = `${todayString}_${todayString}`
        const rangeKey = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`
        setLoadedDateRanges(new Set([todayKey, rangeKey]))
        
        // Only check questions for the initially loaded topics
        if (process.env.NODE_ENV !== 'development' && !isCancelled && allTopics.length < 50) {
          await checkTopicsForQuestions(allTopics)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading initial topics:', error)
          // Fallback to loading all topics if date range fails
          try {
            const allTopicsData = await dataService.getAllTopics()
            if (!isCancelled) {
              const allTopicsArray: TopicMetadata[] = Object.values(allTopicsData)
              setTopicsList(allTopicsArray)
              setTotalTopicsCount(allTopicsArray.length)
              // Mark as "all loaded" so we don't lazy load anymore
              setLoadedDateRanges(new Set(['all_topics_loaded']))
              console.log(`📚 Fallback: Loaded all ${allTopicsArray.length} topics`)
            }
          } catch (fallbackError) {
            console.error('Fallback loading failed:', fallbackError)
            setTopicsList([])
            setTotalTopicsCount(0)
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTopics(false)
        }
      }
    }

    loadInitialTopics()

    return () => {
      isCancelled = true
    }
  }, [])

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
          try {
            await readContentWithSettings(readableContent)
          } catch (error) {
            console.warn('Auto-play failed:', error)
          }
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [currentStackIndex, allFilteredTopics.length, autoPlayEnabled]) // Remove readContentWithSettings dependency

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      
      if (allFilteredTopics.length === 0) return
      
      const currentTopic = allFilteredTopics[currentStackIndex]
      if (!currentTopic) return
      
      const currentAccessStatus = getTopicAccessStatus(currentTopic)
      
      if (e.key === 'ArrowLeft') {
        // Left arrow = Previous = Older topics (higher index)
        const nextIndex = Math.min(allFilteredTopics.length - 1, currentStackIndex + 1)
        console.log(`⬅️ Previous (Older): ${currentStackIndex} -> ${nextIndex} (${allFilteredTopics.length} total)`)
        if (nextIndex < allFilteredTopics.length) {
          setCurrentStackIndex(nextIndex)
          updateUrlWithTopic(nextIndex)
        }
        e.preventDefault()
      } else if (e.key === 'ArrowRight') {
        // Right arrow = Next = Newer topics (lower index)  
        const nextIndex = Math.max(0, currentStackIndex - 1)
        console.log(`➡️ Next (Newer): ${currentStackIndex} -> ${nextIndex} (${allFilteredTopics.length} total)`)
        console.log(`🎯 Current topic: ${currentTopic.topic_title} (breaking: ${currentTopic.is_breaking}, featured: ${currentTopic.is_featured})`)
        if (nextIndex >= 0) {
          const nextTopic = allFilteredTopics[nextIndex]
          console.log(`🎯 Next topic: ${nextTopic.topic_title} (breaking: ${nextTopic.is_breaking}, featured: ${nextTopic.is_featured})`)
          setCurrentStackIndex(nextIndex)
          updateUrlWithTopic(nextIndex)
        }
        e.preventDefault()
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (currentAccessStatus.accessible) {
          handleExploreGame(currentTopic.topic_id)
          e.preventDefault()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStackIndex, allFilteredTopics.length, handlePrevious, handleNext, getTopicAccessStatus, handleExploreGame]) // Include all dependencies

  // Add scroll handler for dropdown with lazy loading
  const handleDropdownScroll = useCallback(() => {
    if (debouncedDropdownSearch) return // no progressive loading while searching
    if (!dropdownRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current
    const scrollPosition = scrollTop + clientHeight
    
    // If scrolled to 80% of the way down, load more topics
    if (scrollPosition > scrollHeight * 0.8 && visibleTopicsCount < allFilteredTopics.length) {
      setVisibleTopicsCount(prev => Math.min(prev + 20, allFilteredTopics.length))
      
      // Also trigger lazy loading for more topics if we're running low and haven't loaded all yet
      if (!loadedDateRanges.has('all_topics_loaded') && allFilteredTopics.length < totalTopicsCount) {
        // Load more topics from database for future navigation with wider range
        const today = getTodayAtMidnight()
        const futureDate = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000) // 6 months ahead
        const pastDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)   // 1 year back
        
        console.log(`📚 Lazy loading more topics: currently have ${allFilteredTopics.length} of ${totalTopicsCount} total`)
        loadTopicsForDateRange(pastDate, futureDate)
      }
    }
  }, [debouncedDropdownSearch, visibleTopicsCount, allFilteredTopics.length, loadedDateRanges, loadTopicsForDateRange])

  // Reset visible topics & search when dropdown opens and scroll to current item
  useEffect(() => {
    if (dropdownOpen) {
      setVisibleTopicsCount(20)
      setDropdownSearch("")
      // Ensure current topic is visible & centered
      setVisibleTopicsCount((prev) => Math.max(prev, currentStackIndex + 1))
      // Scroll after DOM paint
      requestAnimationFrame(() => {
        const container = dropdownRef.current
        if (!container) return
        const currentEl = container.querySelector(`[data-topic-index="${currentStackIndex}"]`) as HTMLElement | null
        if (currentEl) {
          container.scrollTop = currentEl.offsetTop - container.clientHeight / 2
        }
      })
    }
  }, [dropdownOpen, currentStackIndex])

  // Fetch trending queries when dropdown opens
  useEffect(() => {
    let isCancelled = false

    const fetchTrending = async () => {
      if (!dropdownOpen || !supabaseClientRef.current || trendingQueries.length > 0) return
      try {
        const { data, error } = await supabaseClientRef.current
          .from("trending_searches")
          .select("query")
          .order("count", { ascending: false })
          .limit(5)
        if (error) throw error
        if (!isCancelled) {
          setTrendingQueries((data || []).map((d: any) => d.query))
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("Failed to load trending searches", err)
        }
      }
    }
    
    if (dropdownOpen) {
      fetchTrending()
    }

    return () => {
      isCancelled = true
    }
  }, [dropdownOpen, trendingQueries.length])

  // Helper to record the search query (fire and forget)
  const recordSearchQuery = useCallback(async (query: string) => {
    if (!query || !supabaseClientRef.current) return
    try {
      await supabaseClientRef.current.rpc("increment_trending_query", { search_query: query })
    } catch (err) {
      // Silently ignore
    }
  }, [])

  // Add missing cardBaseHeight constant
  const cardBaseHeight = "min-h-[400px] sm:min-h-[500px]"

  // Ensure we land on the first accessible (non future-locked) topic when no explicit topic param
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    if (topicParam) return // user explicitly navigated
    if (allFilteredTopics.length === 0) return
    const firstAccessibleIdx = allFilteredTopics.findIndex(t => getTopicAccessStatus(t).accessible)
    if (firstAccessibleIdx !== -1 && firstAccessibleIdx !== currentStackIndex) {
      setCurrentStackIndex(firstAccessibleIdx)
    }
  }, [allFilteredTopics, searchParams, getTopicAccessStatus, currentStackIndex])

  // Track previous index to determine animation direction
  useEffect(() => {
    prevIndexRef.current = currentStackIndex
  }, [currentStackIndex])

  // Lazy load more topics when navigating near the edges of available topics
  useEffect(() => {
    if (allFilteredTopics.length === 0 || loadedDateRanges.has('all_topics_loaded')) return

    const currentTopic = allFilteredTopics[currentStackIndex]
    if (!currentTopic?.date) return

    const currentDate = parseTopicDate(currentTopic.date)
    if (!currentDate) return

    // If we're near the end of our loaded topics (within 10 topics of the edge), 
    // preemptively load more in that direction
    const isNearEnd = currentStackIndex >= allFilteredTopics.length - 10
    const isNearBeginning = currentStackIndex < 10

    if (isNearEnd || isNearBeginning) {
      const today = getTodayAtMidnight()
      
      if (isNearEnd) {
        // Load older topics (further back in time)
        const startDate = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000) // 60 days back from current
        const endDate = new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000)    // 1 day back from current
        
        console.log('📚 Preloading older topics for navigation...')
        loadTopicsForDateRange(startDate, endDate)
      }
      
      if (isNearBeginning) {
        // Load newer topics (further forward in time)
        const startDate = new Date(currentDate.getTime() + 1 * 24 * 60 * 60 * 1000)  // 1 day ahead from current
        const endDate = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000)   // 60 days ahead from current
        
        console.log('📚 Preloading newer topics for navigation...')
        loadTopicsForDateRange(startDate, endDate)
      }
    }
  }, [currentStackIndex, allFilteredTopics.length, loadedDateRanges, loadTopicsForDateRange, parseTopicDate])

  // Loading state
  if (isLoadingTopics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Preparing your civic learning journey...</p>
          <p className="text-sm text-slate-500 mt-2">
            {totalTopicsCount > 0 
              ? `Loading from our catalog of ${totalTopicsCount} topics...`
              : "Loading today's most important topics..."
            }
          </p>
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
      {showGuestBanner && (
        <GuestAccessBanner 
          user={user}
          IP_TRACKING_ENABLED={IP_TRACKING_ENABLED}
          getSuspiciousActivity={getSuspiciousActivity}
          getGuestAccessSummary={getGuestAccessSummary}
          GUEST_DAILY_QUIZ_LIMIT={GUEST_DAILY_QUIZ_LIMIT}
        />
      )}

      {/* Inline Premium Prompt */}
      <InlinePremiumPrompt 
        showInlinePremiumPrompt={showInlinePremiumPrompt}
        setShowInlinePremiumPrompt={setShowInlinePremiumPrompt}
        router={router}
        onAuthRequired={onAuthRequired}
      />

      {/* Navigation - Mobile-friendly stacked layout */}
      {allFilteredTopics.length > 1 && (
        <div className="mb-6 space-y-4">
          {/* Current date selector - Full width on mobile, centered on desktop */}
          <div className="flex justify-center px-4 sm:px-6 lg:px-8">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 tracking-wide hover:opacity-70 transition-opacity px-3 py-2 border-b-2 border-dashed border-slate-300 dark:border-slate-600 bg-transparent">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{currentTopic.emoji}</span>
                    <span>
                      {parseTopicDate(currentTopic.date)?.toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="w-[90vw] max-w-md max-h-[80vh] overflow-y-auto"
                ref={dropdownRef}
                onScroll={handleDropdownScroll}
              >
                <div className="p-2">
                  <div className="mb-2">
                    <input
                      type="text"
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      placeholder={`Search ${(selectedCategory || searchQuery) ? allFilteredTopics.length : (totalTopicsCount > 0 ? totalTopicsCount : allFilteredTopics.length)} topics...`}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                  {/* Trending searches */}
                  {dropdownSearch === "" && trendingQueries.length > 0 && (
                    <div className="mb-2 px-1">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Trending searches</div>
                      <div className="flex flex-wrap gap-2">
                        {trendingQueries.map((q) => (
                          <button
                            key={q}
                            onClick={() => setDropdownSearch(q)}
                            className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-full px-3 py-1 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Filter topics by search */}
                  {(() => {
                    const filtered = allFilteredTopics.filter(t =>
                      t.topic_title.toLowerCase().includes(debouncedDropdownSearch.toLowerCase()) ||
                      (t.description?.toLowerCase() || "").includes(debouncedDropdownSearch.toLowerCase())
                    )
                    const topicsToRender = debouncedDropdownSearch ? filtered : filtered.slice(0, visibleTopicsCount)
                    return topicsToRender.map((topic, idx) => {
                      const indexInAll = allFilteredTopics.findIndex(tt => tt.topic_id === topic.topic_id)
                      const accessStatus = getTopicAccessStatus(topic)
                      const isCurrent = indexInAll === currentStackIndex
                      const topicDate = parseTopicDate(topic.date)
                      return (
                        <DropdownMenuItem
                          data-topic-index={indexInAll}
                          key={topic.topic_id}
                          onClick={() => {
                            if (accessStatus.accessible) {
                              handleIndexChange(indexInAll)
                              recordSearchQuery(dropdownSearch || topic.topic_title)
                              setDropdownOpen(false)
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between p-3 transition-colors",
                            isCurrent && "bg-primary/10 font-medium",
                            !accessStatus.accessible && "opacity-50 cursor-not-allowed",
                            "hover:text-slate-900 dark:hover:text-white focus:text-slate-900 dark:focus:text-white"
                          )}
                          disabled={!accessStatus.accessible}
                        >
                          <div className="flex items-center space-x-3 flex-grow min-w-0">
                            <span className="text-lg flex-shrink-0">{topic.emoji}</span>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">{topic.topic_title}</div>
                                {topic.is_breaking && (
                                  <span className="inline-block px-1.5 py-0.5 bg-red-600 text-white text-xs font-bold font-space-mono uppercase tracking-wider rounded animate-pulse">
                                    Breaking
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{topic.description}</div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                                <span>{topicDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                {topic.is_featured && !topic.is_breaking && (
                                  <span className="inline-flex items-center px-0.5 py-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[8px] font-bold font-space-mono uppercase tracking-wide rounded-sm">
                                    <Star className="h-1 w-1 mr-0.5" />
                                    <span className="hidden sm:inline">Featured</span>
                                    <span className="inline sm:hidden">★</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {accessStatus.reason === 'coming_soon' && <span className="text-xs text-slate-600 dark:text-slate-400">Coming Soon</span>}
                            {!accessStatus.accessible && accessStatus.reason !== 'coming_soon' && <Lock className="h-3 w-3" />}
                            {isTopicCompleted(topic.topic_id) && <span className="text-xs text-green-600">✓</span>}
                            {isCurrent && <span className="text-xs text-primary">●</span>}
                          </div>
                        </DropdownMenuItem>
                      )
                    })
                  })()}
                  {!debouncedDropdownSearch && visibleTopicsCount < allFilteredTopics.length && (
                    <div className="text-center py-2 text-xs text-slate-500">
                      Scroll to load more topics ({visibleTopicsCount} of {allFilteredTopics.length})...
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Previous/Next navigation */}
          <div className="relative flex items-center px-4 sm:px-6 lg:px-8">
            {/* Previous button - goes to older topics (higher index) */}
            <button
              onClick={currentStackIndex < allFilteredTopics.length - 1 ? () => {
                const newIndex = Math.min(allFilteredTopics.length - 1, currentStackIndex + 1)
                setCurrentStackIndex(newIndex)
                updateUrlWithTopic(newIndex)
              } : undefined}
              disabled={currentStackIndex === allFilteredTopics.length - 1}
              className={cn(
                "text-xs sm:text-sm font-medium tracking-wide transition-opacity min-w-0 flex-shrink-0",
                currentStackIndex === allFilteredTopics.length - 1 ? "opacity-70 cursor-default" : "opacity-70 hover:opacity-100 cursor-pointer"
              )}
            >
              {currentStackIndex < allFilteredTopics.length - 1 ? (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                    ← {parseTopicDate(allFilteredTopics[currentStackIndex + 1].date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1 font-medium text-sm">
                    <span className="text-base">{allFilteredTopics[currentStackIndex + 1].emoji}</span>
                    <span className="text-left max-w-[100px] sm:max-w-[120px] truncate">
                      {truncateTitle(allFilteredTopics[currentStackIndex + 1].topic_title, 15)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                    ← Previous
                  </div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">No more topics</div>
                </div>
              )}
            </button>

            {/* Progress indicator - absolutely centered, hidden on mobile */}
            <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              {currentStackIndex + 1} of {(selectedCategory || searchQuery) ? allFilteredTopics.length : (totalTopicsCount > 0 ? totalTopicsCount : allFilteredTopics.length)}
            </div>

            {/* Next button - goes to newer topics (lower index) */}
            <button
              onClick={currentStackIndex > 0 ? () => {
                const newIndex = Math.max(0, currentStackIndex - 1)
                setCurrentStackIndex(newIndex)
                updateUrlWithTopic(newIndex)
              } : undefined}
              disabled={currentStackIndex === 0}
              className={cn(
                "text-xs sm:text-sm font-medium tracking-wide transition-opacity min-w-0 flex-shrink-0 ml-auto",
                currentStackIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-70 hover:opacity-100"
              )}
            >
              {currentStackIndex > 0 ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                    {parseTopicDate(allFilteredTopics[currentStackIndex - 1].date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →
                  </div>
                  <div className="flex items-center gap-1 font-medium text-sm">
                    <span className="text-right max-w-[100px] sm:max-w-[120px] truncate">
                      {truncateTitle(allFilteredTopics[currentStackIndex - 1].topic_title, 15)}
                    </span>
                    <span className="text-base">{allFilteredTopics[currentStackIndex - 1].emoji}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                    Next →
                  </div>
                  <div className="text-sm font-medium text-slate-400">No more topics</div>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Single Topic Display - cleaner version without card style */}
      <div className="relative">
        <div
          ref={cardRef}
          key={currentTopic.topic_id}
          className={cn(
            "animate-in fade-in duration-500 transition-transform",
            currentStackIndex > prevIndexRef.current ? "slide-in-from-right-4" : "slide-in-from-left-4",
            isSwipeActive ? "duration-75" : "duration-300 ease-out"
          )}
          style={{
            transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.1}deg)`,
            opacity: isSwipeActive ? Math.max(0.7, 1 - Math.abs(swipeOffset) / 200) : 1
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{currentTopic.emoji}</div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <h2 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-slate-900 dark:text-slate-100 max-w-4xl text-center leading-tight">
                  {currentTopic.topic_title}
                </h2>
                
                {/* Breaking News Badge */}
                {currentTopic.is_breaking && (
                  <div className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 bg-red-600 text-white text-xs sm:text-xs font-bold font-space-mono uppercase tracking-wider rounded-full animate-pulse">
                    Breaking
                  </div>
                )}
                

                
                {/* Completed Badge */}
                {isTopicCompleted(currentTopic.topic_id) && (
                  <span className="text-green-600" title="Completed">
                    <svg className="inline h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#bbf7d0" />
                      <path d="M8 12l2 2l4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              {/* Topic categories */}
              {((currentTopic.categories && currentTopic.categories.length > 0) || currentTopic.is_featured) && (
                <div className="flex flex-wrap gap-2 justify-center mt-4 py-4 mb-8">
                  {/* Featured Badge First */}
                  {currentTopic.is_featured && !currentTopic.is_breaking && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold font-space-mono uppercase tracking-wider rounded-full">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  
                  {/* Category Badges */}
                  {currentTopic.categories && currentTopic.categories.map((category) => (
                    <Badge 
                      key={category} 
                      variant="secondary"
                      className="text-xs font-space-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-base sm:text-2xl md:text-3xl lg:text-2xl font-light text-slate-800 dark:text-slate-300 max-w-4xl mx-auto">
                {currentTopic.description}
              </p>
              
              {/* Start Quiz Button - positioned close to description */}
              <div className="flex justify-center mt-10">
                {currentAccessStatus.accessible ? (
                  <StartQuizButton
                    label={isTopicCompleted(currentTopic.topic_id) ? 'Read Again' : 'Read More'}
                    onClick={() => handleExploreGame(currentTopic.topic_id)}
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    {currentAccessStatus.reason === 'future_locked' ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <StartQuizButton
                                label="Available Soon"
                                disabled
                                variant="outline"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            This quiz will unlock at 12:00&nbsp;AM&nbsp;ET on {parseTopicDate(currentTopic.date)?.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <StartQuizButton
                        label={currentAccessStatus.reason === 'coming_soon' ? 'Coming Soon! 🚀' : 
                               currentAccessStatus.reason?.startsWith('guest') ? 'Support CivicSense to Continue' :
                               currentAccessStatus.reason === 'premium_required' ? 'Unlock with Donation' : 
                               'Available Soon'}
                        disabled
                        variant="outline"
                      />
                    )}
                    {currentAccessStatus.reason === 'future_locked' && (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">💡 Tip: Bookmark this page to return when it's ready!</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center justify-center gap-3 mt-6">
                {isTopicCompleted(currentTopic.topic_id) && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-space-mono">
                    Completed
                  </Badge>
                )}
                {!currentAccessStatus.accessible && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-space-mono">
                    {currentAccessStatus.reason === 'coming_soon' ? 'Coming Soon' : 'Premium Content'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}