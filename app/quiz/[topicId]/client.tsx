"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuizEngine } from "@/components/quiz/quiz-engine"
import { TopicInfo } from "@/components/quiz/topic-info"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { QuizLoadingScreen } from "@/components/quiz/quiz-loading-screen"
import { QuizErrorBoundary } from "@/components/analytics-error-boundary"
import { dataService } from "@/lib/data-service"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import { cn } from "@/lib/utils"

interface QuizPageProps {
  params: {
    topicId: string
  }
}

export default function QuizPageClient({ params }: QuizPageProps) {
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
  const [completedToday, setCompletedToday] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Use our new guest access hook
  const { 
    quizAttemptsToday, 
    recordQuizAttempt, 
    hasReachedDailyLimit, 
    getRemainingAttempts,
    GUEST_DAILY_QUIZ_LIMIT,
    hasCompletedTopic,
    isInitialized
  } = useGuestAccess()

  const PREMIUM_QUIZ_LIMIT = 20 // Premium users get more quizzes per day

  // Set mounted state to avoid hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only run client-side code after component has mounted
    if (!isMounted) return

    // Load completed quizzes today
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    if (savedCompleted) {
      try {
        const completedTopics = JSON.parse(savedCompleted)
        setCompletedToday(completedTopics.length)
      } catch (error) {
        console.warn('Error parsing completed topics:', error)
      }
    }

    // Load streak
    const savedStreak = localStorage.getItem("civicAppStreak")
    if (savedStreak) {
      try {
        setStreak(Number.parseInt(savedStreak, 10))
      } catch (error) {
        console.warn('Error parsing streak:', error)
      }
    }
  }, [isMounted])

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load topic metadata
        const topicData = await dataService.getTopicById(params.topicId)
        if (!topicData) {
          setError("Quiz not found")
          return
        }
        setTopic(topicData)
        
        // Don't load questions yet - wait until user starts quiz
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading quiz data:", err)
        setError("Failed to load quiz data")
        setIsLoading(false)
      }
    }

    loadQuizData()
  }, [params.topicId])

  const handleStartQuiz = async () => {
    // Check quiz limits based on user tier
    if (!user && hasReachedDailyLimit()) {
      setIsAuthDialogOpen(true)
      return
    }
    
    // Premium users should have unlimited access
    if (user && !isPremium && !isPro && quizAttemptsToday >= GUEST_DAILY_QUIZ_LIMIT) {
      setShowPremiumGate(true)
      return
    }
    
    // Remove the premium user limit check
    // Premium users should have unlimited access to quizzes

    // Increment quiz attempts for guest users
    if (!user) {
      recordQuizAttempt()
    }

    // Show loading screen first
    setShowLoadingScreen(true)
    
    // Load questions now that the user has started the quiz
    try {
      const questionsData = await dataService.getQuestionsByTopic(params.topicId)
      if (!questionsData || questionsData.length === 0) {
        setError("No questions found for this quiz")
        setShowLoadingScreen(false)
        return
      }
      setQuestions(questionsData)
    } catch (err) {
      console.error("Error loading questions:", err)
      setError("Failed to load quiz questions")
      setShowLoadingScreen(false)
    }

    // Record the quiz attempt with the topic ID
    await recordQuizAttempt(params.topicId)
  }

  const handleQuizComplete = () => {
    // Handle quiz completion (update localStorage, etc.)
    const now = new Date()
    localStorage.setItem("civicAppLastActivity", now.toString())

    // Mark topic as completed
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    const completedTopics = savedCompleted ? JSON.parse(savedCompleted) : []
    if (!completedTopics.includes(params.topicId)) {
      completedTopics.push(params.topicId)
      localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(completedTopics))
      setCompletedToday(completedTopics.length)
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

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false)
    setShowTopicInfo(false)
  }

  // Update the guest access display
  const remainingQuizzes = user && (isPremium || isPro) 
    ? undefined // Premium users don't have a limit to display
    : getRemainingAttempts()
  
  // Check if the user has partially completed this quiz
  const [isPartiallyCompleted, setIsPartiallyCompleted] = useState(false)
  
  useEffect(() => {
    if (isMounted && params.topicId) {
      // Check local storage for partially completed quizzes
      const partialQuizzes = localStorage.getItem("civicAppPartialQuizzes")
      if (partialQuizzes) {
        try {
          const partialQuizzesObj = JSON.parse(partialQuizzes)
          setIsPartiallyCompleted(!!partialQuizzesObj[params.topicId])
        } catch (error) {
          console.warn('Error parsing partial quizzes:', error)
        }
      }
    }
  }, [isMounted, params.topicId])

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
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-2 sm:py-4" data-quiz-active={!showTopicInfo}>
      {/* Minimal navigation - hide during loading */}
      {!showLoadingScreen && (
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={handleBackToHome}
            className="text-xs sm:text-sm font-medium tracking-wide transition-opacity opacity-70 hover:opacity-100"
          >
            ← Back to Home
          </button>
          
          <div className="w-20 sm:w-24" /> {/* Spacer for centering */}
        </div>
      )}

      {showLoadingScreen ? (
        <QuizLoadingScreen onComplete={handleLoadingComplete} />
      ) : showTopicInfo ? (
        <TopicInfo
          topicData={topic}
          onStartQuiz={handleStartQuiz}
          requireAuth={!user && quizAttemptsToday >= GUEST_DAILY_QUIZ_LIMIT}
          onAuthRequired={() => setIsAuthDialogOpen(true)}
          remainingQuizzes={remainingQuizzes}
          isPartiallyCompleted={isPartiallyCompleted}
          hasCompletedTopic={hasCompletedTopic(params.topicId)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-950 pb-4 sm:pb-8">
          <QuizErrorBoundary>
            <QuizEngine
              questions={questions}
              topicId={params.topicId}
              currentTopic={{
                id: topic?.topic_id || "",
                title: topic?.topic_title || "",
                emoji: topic?.emoji || "",
                date: topic?.date || "",
                dayOfWeek: topic?.date ? new Date(topic.date).toLocaleDateString('en-US', { weekday: 'long' }) : ""
              }}
              onComplete={handleQuizComplete}
            />
          </QuizErrorBoundary>
        </div>
      )}

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode='sign-up'
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