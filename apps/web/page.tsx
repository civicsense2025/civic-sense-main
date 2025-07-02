"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import { DailyCardStack } from "@civicsense/ui-web/components/daily-card-stack"
import { Calendar } from "@civicsense/ui-web/components/calendar"
import type { CategoryType, TopicMetadata } from "@civicsense/shared/lib/quiz-data"
import { AuthDialog } from "@civicsense/ui-web/components/auth/auth-dialog"
import { useAuth } from "@civicsense/ui-web/components/auth/auth-provider"
import { UserMenu } from "@civicsense/ui-web/components/auth/user-menu"
import { dataService } from "@civicsense/shared/lib/data-service"
import Link from "next/link"
import { enhancedQuizDatabase } from "@civicsense/shared/lib/quiz-database"
import { useRouter } from "next/navigation"
import { Header } from '@civicsense/ui-web/components/header'
import { ContinueQuizCard } from '@civicsense/ui-web/components/continue-quiz-card'
import dynamic from 'next/dynamic'

// Lazy load FeaturesShowcase only when needed (for non-authenticated users)
const FeaturesShowcase = dynamic(
  () => import('@civicsense/ui-web/components/features-showcase').then(mod => ({ 
    default: mod.FeaturesShowcase || (() => null) 
  })).catch(() => ({ 
    default: () => null 
  })),
  {
    ssr: false,
    loading: () => (
      <section className="py-24 sm:py-32 lg:py-40 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center space-y-8">
            <div className="h-12 w-96 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-6 w-64 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>
      </section>
    )
  }
)

import { supabase } from "@civicsense/shared/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@civicsense/ui-web/components/ui/dialog"
import { Button } from "@civicsense/ui-web/components/ui/button"
import { cn } from "@civicsense/shared/lib/utils"

type ViewMode = 'cards' | 'calendar'

// Optimized batched data fetching
interface HomePageData {
  incompleteAttempts: any[]
  incompleteTopics: TopicMetadata[]
  topicsForCalendar?: TopicMetadata[]
}

const fetchHomePageData = async (userId?: string, needsCalendarData: boolean = false): Promise<HomePageData> => {
  try {
    // Batch all API calls into a single Promise.all to prevent waterfall loading
    const promises: Promise<any>[] = []
    
    // Only fetch user-specific data if user exists
    if (userId) {
      promises.push(enhancedQuizDatabase.getUserQuizAttempts(userId))
    } else {
      promises.push(Promise.resolve([]))
    }
    
    // Only fetch calendar topics if needed
    if (needsCalendarData) {
      promises.push(dataService.getAllTopics())
    } else {
      promises.push(Promise.resolve({}))
    }
    
    const [userAttempts, allTopics] = await Promise.all(promises)
    
    // Process incomplete attempts
    let incompleteAttempts: any[] = []
    let incompleteTopics: TopicMetadata[] = []
    
    if (userId && userAttempts?.length > 0) {
      // Get dismissed quiz IDs from localStorage
      const dismissedQuizzes = JSON.parse(localStorage.getItem('dismissedQuizzes') || '[]')
      
      // Filter out dismissed quizzes
      const incomplete = userAttempts.filter((a: any) => a.isPartial && !dismissedQuizzes.includes(a.id))
      incompleteAttempts = incomplete
      
      // Batch fetch topic metadata for incomplete attempts
      if (incomplete.length > 0) {
        const topicPromises = incomplete.map((a: any) => dataService.getTopicById(a.topicId))
        incompleteTopics = (await Promise.all(topicPromises)).filter(Boolean) as TopicMetadata[]
      }
    }
    
    return {
      incompleteAttempts,
      incompleteTopics,
      topicsForCalendar: needsCalendarData ? Object.values(allTopics) : undefined
    }
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return {
      incompleteAttempts: [],
      incompleteTopics: [],
      topicsForCalendar: undefined
    }
  }
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [quizToDismiss, setQuizToDismiss] = useState<{attemptId: string, topicId: string, title: string} | null>(null)
  
  // Optimized state management
  const [homePageData, setHomePageData] = useState<HomePageData>({
    incompleteAttempts: [],
    incompleteTopics: []
  })
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [topicsForCalendar, setTopicsForCalendar] = useState<TopicMetadata[]>([])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Optimized data fetching with batching
  useEffect(() => {
    let isCancelled = false

    const loadHomePageData = async () => {
      if (!isMounted) return
      
      setIsLoadingData(true)
      
      try {
        const data = await fetchHomePageData(user?.id, viewMode === 'calendar')
        
        if (!isCancelled) {
          setHomePageData(data)
          if (data.topicsForCalendar) {
            setTopicsForCalendar(data.topicsForCalendar)
          }
        }
      } catch (error) {
        console.error('Failed to load homepage data:', error)
      } finally {
        if (!isCancelled) {
          setIsLoadingData(false)
        }
      }
    }

    loadHomePageData()

    return () => {
      isCancelled = true
    }
  }, [user?.id, isMounted, viewMode])

  // Load calendar topics only when switching to calendar view
  useEffect(() => {
    let isCancelled = false

    const loadCalendarTopics = async () => {
      if (viewMode !== 'calendar' || topicsForCalendar.length > 0) return
      
      try {
        const allTopics = await dataService.getAllTopics()
        if (!isCancelled) {
          setTopicsForCalendar(Object.values(allTopics))
        }
      } catch (error) {
        console.error('Failed to load calendar topics:', error)
      }
    }

    if (isMounted) {
      loadCalendarTopics()
    }

    return () => {
      isCancelled = true
    }
  }, [viewMode, isMounted, topicsForCalendar.length])

  const handleAuthSuccess = useCallback(() => {
    setIsAuthDialogOpen(false)
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const handleDismissClick = useCallback((attemptId: string, topicId: string, title: string) => {
    setQuizToDismiss({ attemptId, topicId, title })
    setDismissModalOpen(true)
  }, [])

  const handleDismissConfirm = useCallback(() => {
    if (!quizToDismiss) return
    
    try {
      // Store dismissed quiz IDs in localStorage (preserves progress but hides from view)
      const dismissedQuizzes = JSON.parse(localStorage.getItem('dismissedQuizzes') || '[]')
      dismissedQuizzes.push(quizToDismiss.attemptId)
      localStorage.setItem('dismissedQuizzes', JSON.stringify(dismissedQuizzes))
      
      // Update local state to remove the dismissed item
      setHomePageData(prev => ({
        ...prev,
        incompleteAttempts: prev.incompleteAttempts.filter(attempt => attempt.id !== quizToDismiss.attemptId),
        incompleteTopics: prev.incompleteTopics.filter((_, index) => {
          const attemptIndex = prev.incompleteAttempts.findIndex(a => a.id === quizToDismiss.attemptId)
          return index !== attemptIndex
        })
      }))
      
      setDismissModalOpen(false)
      setQuizToDismiss(null)
    } catch (error) {
      console.error('Failed to dismiss quiz:', error)
    }
  }, [quizToDismiss])

  const handleDismissCancel = useCallback(() => {
    setDismissModalOpen(false)
    setQuizToDismiss(null)
  }, [])

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-white dark:bg-slate-950",
      // Add bottom padding on mobile to account for bottom navigation bars
      isMobile && "pb-20"
    )}>
      <Header onSignInClick={() => setIsAuthDialogOpen(true)} />
    
      {/* Continue Where You Left Off - Fixed at top */}
      {user && homePageData.incompleteAttempts.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 md:py-4">
          <div className="w-full max-w-8xl mx-auto px-3 sm:px-4 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-sm font-medium mb-3 text-slate-900 dark:text-slate-100">Continue where you left off</h2>
            
            {/* Single quiz or horizontal scroll for multiple */}
            {homePageData.incompleteAttempts.length === 1 ? (
              // Single quiz - full width
              (() => {
                const attempt = homePageData.incompleteAttempts[0]
                const topic = homePageData.incompleteTopics[0]
                if (!topic) return null
                
                return (
                  <ContinueQuizCard
                    key={attempt.id}
                    attemptId={attempt.id}
                    topicId={topic.topic_id}
                    title={topic.topic_title}
                    description={topic.description}
                    emoji={topic.emoji}
                    onDismiss={handleDismissClick}
                  />
                )
              })()
            ) : (
              // Multiple quizzes - horizontal scroll
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {homePageData.incompleteAttempts.map((attempt, idx) => {
                  const topic = homePageData.incompleteTopics[idx]
                  if (!topic) return null
                  
                  return (
                    <ContinueQuizCard
                      key={attempt.id}
                      attemptId={attempt.id}
                      topicId={topic.topic_id}
                      title={topic.topic_title}
                      description={topic.description}
                      emoji={topic.emoji}
                      onDismiss={handleDismissClick}
                      className={cn(
                        "flex-shrink-0",
                        isMobile ? "w-72" : "w-80"
                      )}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
      <main className={cn(
        "w-full",
        // Mobile-first responsive padding
        "py-3 sm:py-4 md:py-6 lg:py-8"
      )}>
        {/* Main content - mobile-first responsive design */}
        <div className={cn(
          "w-full max-w-8xl mx-auto",
          // Mobile-first responsive padding - increased for wider layout
          "px-3 sm:px-4 md:px-8 lg:px-12 xl:px-16",
          "py-1 sm:py-2"
        )}>
          {viewMode === 'cards' ? (
            <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
              {/* Daily Card Stack with optimized loading */}
              <Suspense fallback={
                <div className="min-h-[50vh] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              }>
                <DailyCardStack 
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                  requireAuth={false}
                  onAuthRequired={handleAuthSuccess}
                  showGuestBanner={false}
                />
              </Suspense>
              

            </div>
          ) : (
            <div className="py-4 sm:py-8">
              <Calendar 
                topics={topicsForCalendar}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                className={cn(
                  "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg",
                  // Mobile-first responsive padding
                  "p-3 sm:p-4 md:p-6 lg:p-8"
                )}
              />
            </div>
          )}
        </div>

        {/* Features Showcase Section - Only show for non-authenticated users */}
        {!user && !isLoadingData && <FeaturesShowcase />}

        <AuthDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          initialMode='sign-in'
        />
      </main>

      {/* Dismiss Quiz Modal */}
      <Dialog open={dismissModalOpen} onOpenChange={setDismissModalOpen}>
        <DialogContent className="max-w-md mx-3 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Hide Quiz from Continue List?</DialogTitle>
            <DialogDescription>
              "{quizToDismiss?.title}" will be hidden from your continue list. Your progress will be saved and you can still access the quiz directly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={cn(
            "gap-2",
            // Stack buttons vertically on mobile
            isMobile ? "flex-col" : "flex-row"
          )}>
            <Button 
              variant="outline" 
              onClick={handleDismissCancel}
              className={isMobile ? "w-full" : ""}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDismissConfirm} 
              className={cn(
                "bg-slate-600 hover:bg-slate-700 dark:bg-slate-300 dark:hover:bg-slate-200 dark:text-slate-900",
                isMobile && "w-full"
              )}
            >
              Hide Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
