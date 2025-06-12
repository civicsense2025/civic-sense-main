"use client"

import { useState } from "react"
import { DailyCardStack } from "@/components/daily-card-stack"
import { CategoryCloud } from "@/components/category-cloud"
import { TopicSearch } from "@/components/topic-search"
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
      <Header onSignInClick={() => setIsAuthDialogOpen(true)} />
      <main className="flex flex-col items-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 md:p-8 selection:bg-primary/20 pt-20">
        <div className="w-full max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-center mb-2">
            Civic Spark
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-6 text-center">
            Your daily dose of civic engagement.
          </p>
          <TopicSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <CategoryCloud selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        </div>

        <DailyCardStack
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          requireAuth={!user}
          onAuthRequired={() => setIsAuthDialogOpen(true)}
        />

        <AuthDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </main>
    </>
  )
}
