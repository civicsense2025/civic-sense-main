"use client"

import { useState, useEffect } from "react"
import { DailyCardStack } from "@/components/daily-card-stack"
import { Calendar } from "@/components/calendar"
import type { CategoryType, TopicMetadata } from "@/lib/quiz-data"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useAuth } from "@/components/auth/auth-provider"
import { UserMenu } from "@/components/auth/user-menu"
import { dataService } from "@/lib/data-service"
import Link from "next/link"
import { PremiumDataTeaser } from "@/components/premium-data-teaser"


type ViewMode = 'cards' | 'calendar'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [topicsList, setTopicsList] = useState<TopicMetadata[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const { user } = useAuth()

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

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <>      
      <main className="min-h-screen bg-white dark:bg-slate-950">
        {/* Minimal header */}
        <div className="border-b border-slate-100 dark:border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Clean branding */}
                  <Link 
                    href="/" 
                className="group hover:opacity-70 transition-opacity"
                  >
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                      CivicSense
                </h1>
                  </Link>
                
              {/* Minimal user menu */}
                  <UserMenu 
                    onSignInClick={() => setIsAuthDialogOpen(true)} 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
            </div>
          </div>
        </div>

        {/* Data Teaser - Show value proposition to all users */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
          <PremiumDataTeaser 
            variant="banner"
          />
        </div>

        {/* Main content with tons of whitespace */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
                {viewMode === 'cards' ? (
                  <DailyCardStack 
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    requireAuth={false}
                    onAuthRequired={handleAuthSuccess}
                  />
                ) : (
            <div className="py-8 sm:py-16">
                  <Calendar 
                    topics={topicsList}
                    onDateSelect={handleDateSelect}
                    selectedDate={selectedDate}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-8"
              />
            </div>
          )}
        </div>

        <AuthDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </main>
    </>
  )
}
