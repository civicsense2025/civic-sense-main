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

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const allTopics = await dataService.getAllTopics()
        setTopicsList(Object.values(allTopics))
      } catch (error) {
        console.error('Failed to load topics:', error)
      }
    }
    loadTopics()
  }, [])

  useEffect(() => {
    const fetchIncompleteAttempts = async () => {
      if (!user) return
      const attempts = await enhancedQuizDatabase.getUserQuizAttempts(user.id)
      const incomplete = attempts.filter(a => a.isPartial)
      setIncompleteAttempts(incomplete)
      // Fetch topic metadata for each incomplete attempt
      const topics = await Promise.all(
        incomplete.map(a => dataService.getTopicById(a.topicId))
      )
      setIncompleteTopics(topics)
    }
    fetchIncompleteAttempts()
  }, [user])

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      
      {/* Civics Test CTA Banner */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                Test Your Civic Knowledge
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-light">
                Take our comprehensive civics assessment and discover your knowledge level
              </p>
            </div>
            <Link
              href="/civics-test"
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Take Test
              <span className="text-sm opacity-75">• Free • 10 min</span>
            </Link>
          </div>
        </div>
      </div>
      
      <main className="w-full py-8">
        {/* Main content - use full available width with responsive constraints */}
        <div className="w-full px-4 sm:px-8 py-1 sm:py-2">
          {viewMode === 'cards' ? (
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
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Continue Where You Left Off</h2>
              <div className="flex flex-col gap-3">
                {incompleteAttempts.map((attempt, idx) => {
                  const topic = incompleteTopics[idx]
                  if (!topic) return null
                  return (
                    <div key={attempt.id} className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 shadow-sm">
                      <span className="text-3xl mr-4">{topic.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{topic.topic_title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{topic.description}</div>
                      </div>
                      <button
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
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
