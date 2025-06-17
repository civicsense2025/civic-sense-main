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


type ViewMode = 'cards' | 'calendar'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [topicsList, setTopicsList] = useState<TopicMetadata[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const { user } = useAuth()
  const router = useRouter()
  const [incompleteAttempts, setIncompleteAttempts] = useState<any[]>([])
  const [incompleteTopics, setIncompleteTopics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [hasLoadedTopics, setHasLoadedTopics] = useState(false)

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadTopics = async () => {
      if (!isMounted || hasLoadedTopics) return
      
      try {
        setIsLoading(true)
        const allTopics = await dataService.getAllTopics()
        if (!isCancelled) {
          setTopicsList(Object.values(allTopics))
          setHasLoadedTopics(true)
        }
      } catch (error) {
        console.error('Failed to load topics:', error)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    if (isMounted) {
      loadTopics()
    }

    return () => {
      isCancelled = true
    }
  }, [isMounted, hasLoadedTopics])

  useEffect(() => {
    let isCancelled = false

    const fetchIncompleteAttempts = async () => {
      if (!user || !isMounted) return
      
      try {
        const attempts = await enhancedQuizDatabase.getUserQuizAttempts(user.id)
        if (isCancelled) return
        
        const incomplete = attempts.filter(a => a.isPartial)
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => setIsAuthDialogOpen(true)} />
    
      
      <main className="w-full py-4 sm:py-6 lg:py-8">
        {/* Main content - use full available width with responsive constraints */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : viewMode === 'cards' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>}>
              <DailyCardStack 
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                requireAuth={false}
                onAuthRequired={handleAuthSuccess}
                showGuestBanner={false}
              />
            </Suspense>
          ) : (
            <div className="py-4 sm:py-8">
              <Calendar 
                topics={topicsList}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-8"
              />
            </div>
          )}

          {/* Continue Where You Left Off Section */}
          {user && incompleteAttempts.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-slate-900 dark:text-slate-100">Continue Where You Left Off</h2>
              <div className="flex flex-col gap-2 sm:gap-3">
                {incompleteAttempts.map((attempt, idx) => {
                  const topic = incompleteTopics[idx]
                  if (!topic) return null
                  return (
                    <div key={attempt.id} className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                      <span className="text-2xl sm:text-3xl mr-3 sm:mr-4">{topic.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">{topic.topic_title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{topic.description}</div>
                      </div>
                      <button
                        className="ml-2 sm:ml-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition"
                        onClick={() => router.push(`/quiz/${topic.topic_id}`)}
                      >
                        Continue
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <AuthDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          initialMode='sign-in'
        />
      </main>
    </div>
  )
}
