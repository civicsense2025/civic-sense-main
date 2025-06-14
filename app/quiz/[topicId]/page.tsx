"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuizEngine } from "@/components/quiz/quiz-engine"
import { TopicInfo } from "@/components/quiz/topic-info"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { dataService } from "@/lib/data-service"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"

interface QuizPageProps {
  params: Promise<{
    topicId: string
  }>
}

export default function QuizPage({ params }: QuizPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTopicInfo, setShowTopicInfo] = useState(true)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [quizAttempts, setQuizAttempts] = useState(0)

  const FREE_QUIZ_LIMIT = 3
  const PREMIUM_QUIZ_LIMIT = 20 // Premium users get more quizzes per day

  useEffect(() => {
    // Load quiz attempts from localStorage
    const savedAttempts = localStorage.getItem("civicAppQuizAttempts")
    if (savedAttempts) {
      setQuizAttempts(Number.parseInt(savedAttempts, 10))
    }
  }, [])

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load topic metadata
        const topicData = await dataService.getTopicById(resolvedParams.topicId)
        if (!topicData) {
          setError("Quiz not found")
          return
        }
        setTopic(topicData)

        // Load questions
        const questionsData = await dataService.getQuestionsByTopic(resolvedParams.topicId)
        if (!questionsData || questionsData.length === 0) {
          setError("No questions found for this quiz")
          return
        }
        setQuestions(questionsData)

      } catch (err) {
        console.error("Error loading quiz data:", err)
        setError("Failed to load quiz data")
      } finally {
        setIsLoading(false)
      }
    }

    loadQuizData()
  }, [resolvedParams.topicId])

  const handleStartQuiz = () => {
    // Check quiz limits based on user tier
    if (!user && quizAttempts >= FREE_QUIZ_LIMIT) {
      setIsAuthDialogOpen(true)
      return
    }
    
    if (user && !isPremium && !isPro && quizAttempts >= FREE_QUIZ_LIMIT) {
      setShowPremiumGate(true)
      return
    }
    
    if (user && (isPremium || isPro) && quizAttempts >= PREMIUM_QUIZ_LIMIT) {
      // Even premium users have some limits to prevent abuse
      alert("You've reached your daily quiz limit. Please try again tomorrow!")
      return
    }

    // Increment quiz attempts
    const newAttempts = quizAttempts + 1
    setQuizAttempts(newAttempts)
    localStorage.setItem("civicAppQuizAttempts", newAttempts.toString())

    setShowTopicInfo(false)
  }

  const handleQuizComplete = () => {
    // Handle quiz completion (update localStorage, etc.)
    const now = new Date()
    localStorage.setItem("civicAppLastActivity", now.toString())

    // Mark topic as completed
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    const completedTopics = savedCompleted ? JSON.parse(savedCompleted) : []
    if (!completedTopics.includes(resolvedParams.topicId)) {
      completedTopics.push(resolvedParams.topicId)
      localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(completedTopics))
    }

    // Update streak logic could go here
    // For now, we'll just redirect back to home after a delay
    setTimeout(() => {
      router.push("/")
    }, 3000)
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
    setShowTopicInfo(false) // Start quiz after successful auth
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The requested quiz could not be found."}</p>
          <Button onClick={handleBackToHome} className="rounded-xl">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8" data-quiz-active={!showTopicInfo}>
      {/* Minimal navigation */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <button
          onClick={handleBackToHome}
          className="text-xs sm:text-sm font-medium tracking-wide transition-opacity opacity-70 hover:opacity-100"
        >
          ← Back to Home
        </button>
        
        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-50 tracking-wide text-center">
          Quiz {user && (isPremium || isPro) ? `(${quizAttempts}/${PREMIUM_QUIZ_LIMIT} today)` : `(${quizAttempts}/${FREE_QUIZ_LIMIT} today)`}
        </div>
        
        <div className="w-20 sm:w-24" /> {/* Spacer for centering */}
      </div>

      {showTopicInfo ? (
        <TopicInfo
          topicData={topic}
          onStartQuiz={handleStartQuiz}
          requireAuth={!user && quizAttempts >= FREE_QUIZ_LIMIT}
          onAuthRequired={() => setIsAuthDialogOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-950">
          <QuizEngine
            questions={questions}
            topicId={resolvedParams.topicId}
            onComplete={handleQuizComplete}
          />
        </div>
      )}

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Premium Gate */}
      <PremiumGate
        feature="advanced_analytics"
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        title="Unlimited Daily Quizzes"
        description="Upgrade to Premium for unlimited daily quizzes and advanced learning features"
      />
    </div>
  )
} 