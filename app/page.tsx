"use client"

import { useState, useEffect, Suspense } from "react"
import { DailyCardStack } from "@/components/daily-card-stack"
import { Calendar } from "@/components/calendar"
import type { CategoryType, TopicMetadata } from "@/lib/quiz-data"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useAuth } from "@/components/auth/auth-provider"
import { UserMenu } from "@/components/auth/user-menu"
import { dataService } from "@/lib/data-service"
import Link from "next/link"
import { enhancedQuizDatabase } from "@/lib/quiz-database"
import { useRouter } from "next/navigation"
import { Header } from '@/components/header'
import { CategoryCloud } from '@/components/category-cloud'
import { ContinueQuizCard } from '@/components/continue-quiz-card'
import { FeaturesShowcase } from '@/components/features-showcase'
import { StickyQuizNavigation, useStickyQuizNavigation } from '@/components/quiz/sticky-quiz-navigation'

import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


type ViewMode = 'cards' | 'calendar'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [topicsList, setTopicsList] = useState<TopicMetadata[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const [incompleteAttempts, setIncompleteAttempts] = useState<any[]>([])
  const [incompleteTopics, setIncompleteTopics] = useState<any[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [dismissModalOpen, setDismissModalOpen] = useState(false)
  const [quizToDismiss, setQuizToDismiss] = useState<{attemptId: string, topicId: string, title: string} | null>(null)
  
  // Coordinated loading states to prevent layout shift
  const [isDailyCardStackReady, setIsDailyCardStackReady] = useState(false)
  const [isCategoryCloudReady, setIsCategoryCloudReady] = useState(false)
  
  // Both components are ready when neither is loading
  const areBothComponentsReady = isDailyCardStackReady && isCategoryCloudReady

  // Sticky navigation state
  const [currentTopic, setCurrentTopic] = useState<TopicMetadata | null>(null)
  const [allTopics, setAllTopics] = useState<TopicMetadata[]>([])

  // Convert topics to navigation format
  const navigationTopics = allTopics.map(topic => ({
    id: topic.topic_id,
    title: topic.topic_title,
    emoji: topic.emoji || '📝',
    date: topic.date,
    dayOfWeek: new Date(topic.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))

  const currentTopicId = currentTopic?.topic_id || ''
  const stickyNavigation = useStickyQuizNavigation(navigationTopics, currentTopicId)

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



  useEffect(() => {
    let isCancelled = false

    const fetchIncompleteAttempts = async () => {
      if (!user || !isMounted) return
      
      try {
        const attempts = await enhancedQuizDatabase.getUserQuizAttempts(user.id)
        if (isCancelled) return
        
        // Get dismissed quiz IDs from localStorage
        const dismissedQuizzes = JSON.parse(localStorage.getItem('dismissedQuizzes') || '[]')
        
        // Filter out dismissed quizzes
        const incomplete = attempts.filter(a => a.isPartial && !dismissedQuizzes.includes(a.id))
        setIncompleteAttempts(incomplete)
        
        // Fetch topic metadata for each incomplete attempt
        const topics = await Promise.all(
          incomplete.map(a => dataService.getTopicById(a.topicId))
        )
        
        if (!isCancelled) {
          setIncompleteTopics(topics)
        }
      } catch (error) {
        console.error('Failed to fetch incomplete attempts:', error)
      }
    }

    if (isMounted) {
      fetchIncompleteAttempts()
    }

    return () => {
      isCancelled = true
    }
  }, [user, isMounted])

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleDismissClick = (attemptId: string, topicId: string, title: string) => {
    setQuizToDismiss({ attemptId, topicId, title })
    setDismissModalOpen(true)
  }

  const handleDismissConfirm = () => {
    if (!quizToDismiss) return
    
    try {
      // Store dismissed quiz IDs in localStorage (preserves progress but hides from view)
      const dismissedQuizzes = JSON.parse(localStorage.getItem('dismissedQuizzes') || '[]')
      dismissedQuizzes.push(quizToDismiss.attemptId)
      localStorage.setItem('dismissedQuizzes', JSON.stringify(dismissedQuizzes))
      
      // Update local state to remove the dismissed item
      setIncompleteAttempts(prev => prev.filter(attempt => attempt.id !== quizToDismiss.attemptId))
      setIncompleteTopics(prev => {
        const attemptIndex = incompleteAttempts.findIndex(a => a.id === quizToDismiss.attemptId)
        if (attemptIndex >= 0) {
          return prev.filter((_, index) => index !== attemptIndex)
        }
        return prev
      })
      
      setDismissModalOpen(false)
      setQuizToDismiss(null)
    } catch (error) {
      console.error('Failed to dismiss quiz:', error)
    }
  }

  const handleDismissCancel = () => {
    setDismissModalOpen(false)
    setQuizToDismiss(null)
  }

  // Sticky navigation handlers
  const handleCurrentTopicChange = (newCurrentTopic: TopicMetadata | null, newAllTopics: TopicMetadata[]) => {
    setCurrentTopic(newCurrentTopic)
    setAllTopics(newAllTopics)
  }

  const handleStickyNavigation = (direction: 'prev' | 'next') => {
    const newTopicId = stickyNavigation.navigateToTopic(direction)
    if (newTopicId) {
      router.push(`/?topic=${newTopicId}`)
    }
  }

  const handleTopicSelect = (topicId: string) => {
    router.push(`/?topic=${topicId}`)
  }

  // Load topics only when needed for calendar view - DailyCardStack loads its own topics
  useEffect(() => {
    let isCancelled = false

    const loadTopicsForCalendar = async () => {
      if (!isMounted || viewMode !== 'calendar') return
      
      try {
        const allTopics = await dataService.getAllTopics()
        if (!isCancelled) {
          setTopicsList(Object.values(allTopics))
        }
      } catch (error) {
        console.error('Failed to load topics for calendar:', error)
      }
    }

    if (isMounted && viewMode === 'calendar') {
      loadTopicsForCalendar()
    }

    return () => {
      isCancelled = true
    }
  }, [isMounted, viewMode]) // Only load when calendar view is needed

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

      {/* News Ticker moved to search dialog */}
    
      {/* Continue Where You Left Off - Fixed at top */}
      {user && incompleteAttempts.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 md:py-4">
          <div className="w-full max-w-8xl mx-auto px-3 sm:px-4 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-sm font-medium mb-3 text-slate-900 dark:text-slate-100">Continue where you left off</h2>
            
            {/* Single quiz or horizontal scroll for multiple */}
            {incompleteAttempts.length === 1 ? (
              // Single quiz - full width
              (() => {
                const attempt = incompleteAttempts[0]
                const topic = incompleteTopics[0]
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
                {incompleteAttempts.map((attempt, idx) => {
                  const topic = incompleteTopics[idx]
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
            <>
              {/* Show coordinated skeleton loaders until both components are ready */}
              {!areBothComponentsReady && (
                <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
                  {/* Daily Card Stack Skeleton */}
                  <div className="min-h-[50vh]">
                    <div className="animate-pulse">
                      <div className="min-h-[50vh] flex flex-col justify-center py-4 sm:py-8">
                        <div className="text-center mb-6">
                          <div className="h-4 w-16 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded mx-auto mb-6"></div>
                        </div>
                        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
                          <div className="text-center mb-6">
                            <div className="h-16 w-16 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded-full mx-auto mb-4"></div>
                            <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded-lg w-3/4 max-w-2xl mx-auto mb-4"></div>
                            <div className="space-y-2 max-w-2xl mx-auto mb-6">
                              <div className="h-5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded w-full"></div>
                              <div className="h-5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded w-2/3 mx-auto"></div>
                            </div>
                            <div className="h-12 w-32 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded-lg mx-auto"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Category Cloud Skeleton */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-4 sm:px-0">
                      <div className="h-8 w-48 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded"></div>
                      <div className="h-6 w-20 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded"></div>
                    </div>
                    <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded-xl"></div>
                      ))}
                    </div>
                    <div className="flex gap-3 px-4 sm:hidden">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 w-32 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] rounded-xl flex-shrink-0"></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hidden components loading in background */}
              <div className="opacity-0 pointer-events-none absolute">
                <Suspense fallback={null}>
                  <DailyCardStack 
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    requireAuth={false}
                    onAuthRequired={handleAuthSuccess}
                    showGuestBanner={false}
                    onLoadingStateChange={setIsDailyCardStackReady}
                    onCurrentTopicChange={handleCurrentTopicChange}
                  />
                </Suspense>
                <CategoryCloud 
                  limit={6} 
                  showViewAll={true} 
                  onLoadingStateChange={setIsCategoryCloudReady}
                />
              </div>
              
              {/* Show actual components when both are ready */}
              {areBothComponentsReady && (
                <div className="animate-in fade-in duration-300">
                                  <Suspense fallback={null}>
                  <DailyCardStack 
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    requireAuth={false}
                    onAuthRequired={handleAuthSuccess}
                    showGuestBanner={false}
                    onCurrentTopicChange={handleCurrentTopicChange}
                  />
                </Suspense>
                  
                  {/* Categories Section - Mobile optimized */}
                  <div className={cn(
                    // Mobile-first responsive margins
                    "mt-6 sm:mt-8 md:mt-10 lg:mt-12",
                    // Extra bottom margin on mobile for bottom navigation
                    isMobile && "mb-6"
                  )}>
                    <CategoryCloud limit={6} showViewAll={true} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 sm:py-8">
              <Calendar 
                topics={topicsList}
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

        {/* Features Showcase Section */}
        <FeaturesShowcase />

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

      {/* Sticky Quiz Navigation */}
      {currentTopic && stickyNavigation.currentTopic && (
        <StickyQuizNavigation
          currentTopic={stickyNavigation.currentTopic}
          previousTopic={stickyNavigation.previousTopic}
          nextTopic={stickyNavigation.nextTopic}
          onNavigate={handleStickyNavigation}
          onTopicSelect={handleTopicSelect}
          isLoading={!areBothComponentsReady}
          triggerElementId="democracy-decoded-section"
        />
      )}
    </div>
  )
}
