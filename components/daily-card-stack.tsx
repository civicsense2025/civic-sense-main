"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { dataService } from "@/lib/data-service"
import type { CategoryType, TopicMetadata } from "@/lib/quiz-data"
import { CivicCard } from "./civic-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronDown, Lock, Clock, Crown, Star, Check, ChevronLeft, ChevronRight } from "lucide-react"
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

import { UnlockTimer } from "@/components/ui/unlock-timer"
import { DailyCardSkeleton, DailyCardCompactSkeleton, DailyCardTransitionSkeleton } from "@/components/ui/skeleton"

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
  onLoadingStateChange?: (isReady: boolean) => void
  onCurrentTopicChange?: (currentTopic: TopicMetadata | null, allTopics: TopicMetadata[]) => void
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
  onLoadingStateChange,
  onCurrentTopicChange,
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) // Load 5 topics at a time
  const [hasMoreTopics, setHasMoreTopics] = useState(true)
  const [allTopicsLoaded, setAllTopicsLoaded] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownSearch, setDropdownSearch] = useState("")
  const [debouncedDropdownSearch, setDebouncedDropdownSearch] = useState("")
  const [trendingQueries, setTrendingQueries] = useState<string[]>([])
  const prevIndexRef = useRef(0)
  
  // Intersection Observer for navigation visibility
  const [showNavigation, setShowNavigation] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  
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

  // Intersection Observer to control navigation visibility
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        // Show navigation when component is in view, hide when scrolled past
        setShowNavigation(entry.isIntersecting)
      },
      {
        // Trigger when 20% of the component is visible
        threshold: 0.2,
        // Add some margin to the root for better UX
        rootMargin: '-10% 0px -10% 0px'
      }
    )

    observer.observe(container)
    
    return () => {
      observer.disconnect()
    }
  }, [])

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
    }
    
    const sorted = allTopics.sort((a, b) => {
      // First priority: Breaking news (is_breaking = true)
      const aIsBreaking = a.is_breaking === true
      const bIsBreaking = b.is_breaking === true
      
      if (aIsBreaking && !bIsBreaking) return -1
      if (!aIsBreaking && bIsBreaking) return 1
      
      // If neither is breaking, sort by date (most recent first)
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

  // Create navigation topics array
  const navigationTopics = allFilteredTopics.map(topic => ({
    id: topic.topic_id,
    title: topic.topic_title,
    emoji: topic.emoji || '📝', // Provide a default emoji if none exists
    date: topic.date,
    dayOfWeek: parseTopicDate(topic.date)?.toLocaleDateString('en-US', { weekday: 'short' }) || '',
    description: topic.description
  }))

  // Load more topics function
  const loadMoreTopics = useCallback(async () => {
    if (isLoadingMoreTopics || allTopicsLoaded) return
    
    try {
      setIsLoadingMoreTopics(true)
      console.log(`📚 Loading more topics - page ${currentPage + 1}`)
      
      // Calculate offset for pagination
      const offset = currentPage * itemsPerPage
      
      // Load next batch of topics
      const { data: moreTopicsData, error } = await supabase
        .from('question_topics')
        .select('*')
        .eq('is_active', true)
        .not('date', 'is', null)
        .order('date', { ascending: false })
        .range(offset, offset + itemsPerPage - 1)
      
      if (error) {
        console.error('Error loading more topics:', error)
        return
      }
      
      const moreTopics = (moreTopicsData || []).map(topic => ({
        ...topic,
        categories: Array.isArray(topic.categories) ? topic.categories : []
      })) as unknown as TopicMetadata[]
      
      if (moreTopics.length === 0) {
        setAllTopicsLoaded(true)
        setHasMoreTopics(false)
        console.log('📚 No more topics to load')
        return
      }
      
      // Check for duplicates and add new topics
      setTopicsList(prevTopics => {
        const existingIds = new Set(prevTopics.map(t => t.topic_id))
        const newTopics = moreTopics.filter(t => !existingIds.has(t.topic_id))
        
        if (newTopics.length > 0) {
          console.log(`📚 Loaded ${newTopics.length} more topics (page ${currentPage + 1})`)
          return [...prevTopics, ...newTopics]
        }
        return prevTopics
      })
      
      setCurrentPage(prev => prev + 1)
      
      // Check if we've reached the end
      if (moreTopics.length < itemsPerPage) {
        setAllTopicsLoaded(true)
        setHasMoreTopics(false)
      }
      
    } catch (error) {
      console.error('Error in loadMoreTopics:', error)
    } finally {
      setIsLoadingMoreTopics(false)
    }
  }, [currentPage, itemsPerPage, isLoadingMoreTopics, allTopicsLoaded])

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

  // Optimized initial loading - load only the 5 most recent topics
  useEffect(() => {
    let isCancelled = false

    const loadInitialTopics = async () => {
      try {
        setIsLoadingTopics(true)
        console.log('📚 Loading initial 5 most recent topics for fast startup...')
        
        // Get total count for pagination
        const { count, error: countError } = await supabase
          .from('question_topics')
          .select('*', { count: 'exact', head: true })
          .filter('date', 'not.is', null)
          .eq('is_active', true)
        
        if (!countError && count) {
          setTotalTopicsCount(count)
          console.log(`📊 Total topics available: ${count}`)
        }
        
        // Load only the 5 most recent topics initially
        const { data: initialTopicsData, error: topicsError } = await supabase
          .from('question_topics')
          .select('*')
          .eq('is_active', true)
          .not('date', 'is', null)
          .order('date', { ascending: false })
          .limit(itemsPerPage)
        
        if (topicsError) {
          console.error('Error loading initial topics:', topicsError)
          throw topicsError
        }
        
        const initialTopics = (initialTopicsData || []).map(topic => ({
          ...topic,
          categories: Array.isArray(topic.categories) ? topic.categories : []
        })) as unknown as TopicMetadata[]
        
        if (!isCancelled && initialTopics.length > 0) {
          console.log(`📚 Loaded ${initialTopics.length} initial topics`)
          setTopicsList(initialTopics)
          
          // Set pagination state
          setCurrentPage(1)
          setHasMoreTopics(initialTopics.length === itemsPerPage && (count || 0) > itemsPerPage)
          setAllTopicsLoaded(initialTopics.length < itemsPerPage)
          
          // Notify parent that we have content ready
          onLoadingStateChange?.(true)
        } else if (!isCancelled) {
          console.log('📚 No initial topics found')
          setTopicsList([])
          setHasMoreTopics(false)
          setAllTopicsLoaded(true)
          onLoadingStateChange?.(true)
        }
        
      } catch (error) {
        console.error('Error in loadInitialTopics:', error)
        if (!isCancelled) {
          setTopicsList([])
          setTotalTopicsCount(0)
          setHasMoreTopics(false)
          setAllTopicsLoaded(true)
          onLoadingStateChange?.(true)
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
  }, [itemsPerPage, onLoadingStateChange])

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

    // Allow navigation to quiz landing page for most cases, including future-locked topics
    // The quiz landing page will handle the specific access restrictions for starting the quiz
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
          // Allow navigation to quiz landing page for future-locked topics
          // Users can see the topic details but won't be able to start the quiz until the date
          console.log(`Navigating to "${topic.topic_title}" landing page - quiz will be available on its scheduled date`)
          router.push(`/quiz/${topicId}`)
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

  // Add scroll handler for dropdown
  const handleDropdownScroll = useCallback(() => {
    if (debouncedDropdownSearch) return // no progressive loading while searching
    if (!dropdownRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current
    const scrollPosition = scrollTop + clientHeight
    
    // If scrolled to 80% of the way down, load more topics
    if (scrollPosition > scrollHeight * 0.8 && visibleTopicsCount < allFilteredTopics.length) {
      setVisibleTopicsCount(prev => Math.min(prev + 20, allFilteredTopics.length))
      
      // Load more topics through pagination if we're running low
      if (hasMoreTopics && !isLoadingMoreTopics && allFilteredTopics.length < totalTopicsCount) {
        console.log(`📚 Loading more topics through pagination: currently have ${allFilteredTopics.length} of ${totalTopicsCount} total`)
        loadMoreTopics()
      }
    }
  }, [debouncedDropdownSearch, visibleTopicsCount, allFilteredTopics.length, hasMoreTopics, isLoadingMoreTopics, totalTopicsCount, loadMoreTopics])

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
      if (!dropdownOpen || trendingQueries.length > 0) return
      try {
        // TODO: Implement trending_searches table and increment_trending_query function
        // For now, use static trending queries
        const staticTrendingQueries = [
          "Constitution",
          "Voting Rights", 
          "Supreme Court",
          "Congressional Powers",
          "Electoral College"
        ]
        
        if (!isCancelled) {
          setTrendingQueries(staticTrendingQueries)
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
    if (!query) return
    try {
      // TODO: Implement increment_trending_query RPC function
      // For now, just log the search query
      console.log('Search query recorded:', query)
    } catch (err) {
      // Silently ignore
    }
  }, [])

  // Define handleViewportNavigation before any early returns to maintain hook order
  const handleViewportNavigation = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentStackIndex < allFilteredTopics.length - 1) {
      const newIndex = currentStackIndex + 1
      setCurrentStackIndex(newIndex)
      updateUrlWithTopic(newIndex)
    } else if (direction === 'next' && currentStackIndex > 0) {
      const newIndex = currentStackIndex - 1
      setCurrentStackIndex(newIndex)
      updateUrlWithTopic(newIndex)
    }
  }, [currentStackIndex, allFilteredTopics.length, updateUrlWithTopic])

  // Add missing cardBaseHeight constant
  const cardBaseHeight = "min-h-[400px] sm:min-h-[500px]"

  // Ensure we land on the latest (most recent) topic when no explicit topic param
  // Users should be able to see and click through to any topic, but quiz access is controlled separately
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    if (topicParam) return // user explicitly navigated
    if (allFilteredTopics.length === 0) return
    
    // Always land on the latest topic (index 0, since topics are sorted newest first)
    // This allows users to see the latest content and navigate to the quiz landing page
    // The actual quiz start will be controlled by the date-based access logic
    if (currentStackIndex !== 0) {
      setCurrentStackIndex(0)
    }
  }, [allFilteredTopics, searchParams, currentStackIndex])

  // Track previous index to determine animation direction
  useEffect(() => {
    prevIndexRef.current = currentStackIndex
  }, [currentStackIndex])

  // Notify parent of current topic changes
  useEffect(() => {
    if (onCurrentTopicChange) {
      const currentTopic = allFilteredTopics[currentStackIndex] || null
      onCurrentTopicChange(currentTopic, allFilteredTopics)
    }
  }, [onCurrentTopicChange, allFilteredTopics, currentStackIndex])

  // Load more topics when navigating near the edges of available topics
  useEffect(() => {
    if (allFilteredTopics.length === 0 || allTopicsLoaded) return

    // If we're near the end of our loaded topics (within 3 topics of the edge), 
    // preemptively load more through pagination
    const isNearEnd = currentStackIndex >= allFilteredTopics.length - 3

    if (isNearEnd && hasMoreTopics && !isLoadingMoreTopics) {
      console.log('📚 Preloading more topics for navigation...')
      loadMoreTopics()
    }
  }, [currentStackIndex, allFilteredTopics.length, allTopicsLoaded, hasMoreTopics, isLoadingMoreTopics, loadMoreTopics])

  // Keyboard navigation
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
  }, [currentStackIndex, allFilteredTopics.length, getTopicAccessStatus, handleExploreGame, updateUrlWithTopic])

  // Loading state
  if (isLoadingTopics) {
    return <DailyCardSkeleton />
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
  
  // Show transition skeleton if current topic is not available yet
  if (!currentTopic) {
    return <DailyCardTransitionSkeleton />
  }
  
  const currentAccessStatus = getTopicAccessStatus(currentTopic)

  return (
    <div 
      ref={containerRef}
      className="min-h-[50vh] flex flex-col justify-center py-4 sm:py-8 relative"
    >
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

      {/* Viewport Edge Navigation removed - now using StickyQuizNavigation */}

      {/* Single Topic Display */}
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
              
              {/* Topic Title */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-slate-900 dark:text-slate-100 max-w-4xl text-center leading-tight">
                  {currentTopic.topic_title}
                </h2>
              </div>

              {/* Date Selector - Now positioned below the title */}
              {allFilteredTopics.length > 1 && (
                <div className="flex justify-center mb-6">
                  <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center space-x-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
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
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{topic.description}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                                      <span>{topicDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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
              )}

              {/* Topic categories and badges */}
              {((currentTopic.categories && currentTopic.categories.length > 0) || currentTopic.is_breaking || (currentTopic.is_featured && !currentTopic.is_breaking)) && (
                <div className="flex flex-wrap gap-2 justify-center mt-4 py-4 mb-8">
                  {/* Breaking Badge - show first */}
                  {currentTopic.is_breaking && (
                    <div className="badge badge-breaking">
                      Breaking
                    </div>
                  )}
                  
                  {/* Featured Badge - only show if not breaking */}
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
              
              <p className="text-base sm:text-lg md:text-xl lg:text-xl font-light text-slate-800 dark:text-slate-300 max-w-4xl mx-auto">
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
                      <div className="flex flex-col items-center space-y-2">
                        <StartQuizButton
                          label="Preview Topic"
                          onClick={() => handleExploreGame(currentTopic.topic_id)}
                          variant="outline"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 cursor-help">
                                💡 Quiz available on {parseTopicDate(currentTopic.date)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              This quiz will unlock at 12:00&nbsp;AM&nbsp;ET on {parseTopicDate(currentTopic.date)?.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
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
                {!currentAccessStatus.accessible && currentAccessStatus.reason === 'future_locked' && (
                  <UnlockTimer
                    targetDate={parseTopicDate(currentTopic.date) || new Date()}
                    label="Unlocks in:"
                    className="text-amber-700 dark:text-amber-400"
                  />
                )}
                {!currentAccessStatus.accessible && currentAccessStatus.reason !== 'future_locked' && (
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