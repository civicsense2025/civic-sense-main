"use client"

import { useState } from "react"
import { DailyCardStack } from "@/components/daily-card-stack"
import { CategoryCloud } from "@/components/category-cloud"
import { TopicSearch } from "@/components/topic-search"
import { DashboardStats } from "@/components/dashboard-stats"
import type { CategoryType } from "@/lib/quiz-data"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useAuth } from "@/components/auth/auth-provider"
import { Header } from "@/components/header"

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const { user } = useAuth()

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
  }

  return (
    <>
      <main className="flex flex-col items-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 md:p-8 selection:bg-primary/20">
        <div className="w-full max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                CivicSense
              </h1>
              <p className="text-lg text-slate-700 dark:text-slate-300">
                Your daily dose of civic engagement.
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              {user && (
                <DashboardStats className="animate-in slide-in-from-right duration-500" />
              )}
            </div>
          </div>
          <TopicSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </div>

        <DailyCardStack
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          requireAuth={!user}
          onAuthRequired={() => setIsAuthDialogOpen(true)}
        />

        <div className="w-full max-w-3xl mx-auto mt-8">
          <CategoryCloud
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            className="flex justify-center"
          />
        </div>

        <div className="w-full max-w-3xl mx-auto mt-8 flex justify-center">
          <Header onSignInClick={() => setIsAuthDialogOpen(true)} />
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
