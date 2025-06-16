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
import { QuizProgressIndicator } from "@/components/quiz-progress-indicator"
import { QuizLoadingScreen } from "@/components/quiz/quiz-loading-screen"
import { QuizErrorBoundary } from "@/components/analytics-error-boundary"
import { dataService } from "@/lib/data-service"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import { cn } from "@/lib/utils"

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
  const [completedToday, setCompletedToday] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  
  // Use our new guest access hook
  const { 
    quizAttemptsToday, 
    recordQuizAttempt, 
    hasReachedDailyLimit, 
    getRemainingAttempts,
    GUEST_DAILY_QUIZ_LIMIT 
  } = useGuestAccess()

  const PREMIUM_QUIZ_LIMIT = 20 // Premium users get more quizzes per day

  useEffect(() => {
    // Load completed quizzes today
    const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
    if (savedCompleted) {
      const completedTopics = JSON.parse(savedCompleted)
      setCompletedToday(completedTopics.length)
    }

    // Load streak
    const savedStreak = localStorage.getItem("civicAppStreak")
    if (savedStreak) {
      setStreak(Number.parseInt(savedStreak, 10))
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
    if (!user && hasReachedDailyLimit()) {
      setIsAuthDialogOpen(true)
      return
    }
    
    if (user && !isPremium && !isPro && quizAttemptsToday >= GUEST_DAILY_QUIZ_LIMIT) {
      setShowPremiumGate(true)
      return
    }
    
    if (user && (isPremium || isPro) && quizAttemptsToday >= PREMIUM_QUIZ_LIMIT) {
      // Even premium users have some limits to prevent abuse
      alert("You've reached your daily quiz limit. Please try again tomorrow!")
      return
    }

    // Increment quiz attempts for guest users
    if (!user) {
      recordQuizAttempt()
    }

    // Show loading screen first
    setShowLoadingScreen(true)
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

  // Guest Access Banner Component
  const GuestAccessBanner = () => {
    if (!user) {
      const summary = {
        hasReachedLimit: hasReachedDailyLimit(),
        remaining: getRemainingAttempts(),
        total: GUEST_DAILY_QUIZ_LIMIT
      }
      
      return (
        <div className="mb-6 text-center">
          <div className={cn(
            "px-4 py-3 rounded-lg border animate-in fade-in duration-300",
            summary.hasReachedLimit 
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              : "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
          )}>
            <p className="text-sm font-medium">
              {summary.hasReachedLimit 
                ? `Thanks for trying CivicSense! Support our mission to unlock unlimited quizzes`
                : `Free Access: ${summary.remaining} of ${GUEST_DAILY_QUIZ_LIMIT} daily quizzes remaining today`
              }
            </p>
            {!summary.hasReachedLimit && (
              <p className="text-xs mt-1">Love what we're doing? Consider a small donation to keep civic education free for everyone</p>
            )}
            
            {/* Show progress indicator for transparency */}
            <div className="mt-2 w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(summary.total - summary.remaining) / summary.total * 100}%` }}
              />
            </div>
          </div>
        </div>
      )
    }
    return null
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

  // Update the guest access display
  const currentLimit = user && (isPremium || isPro) ? PREMIUM_QUIZ_LIMIT : GUEST_DAILY_QUIZ_LIMIT
  const remainingQuizzes = user && (isPremium || isPro) 
    ? PREMIUM_QUIZ_LIMIT - quizAttemptsToday 
    : getRemainingAttempts()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8" data-quiz-active={!showTopicInfo}>
      {/* Minimal navigation - hide during loading */}
      {!showLoadingScreen && (
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={handleBackToHome}
            className="text-xs sm:text-sm font-medium tracking-wide transition-opacity opacity-70 hover:opacity-100"
          >
            ← Back to Home
          </button>
          
          {/* Enhanced progress indicator */}
          <div className="flex items-center space-x-4">
            <QuizProgressIndicator
              current={quizAttemptsToday}
              limit={currentLimit}
              variant="streak"
              showStreak={streak > 0}
              streak={streak}
              completedToday={completedToday}
              isPremium={isPremium || isPro}
            />
          </div>
          
          <div className="w-20 sm:w-24" /> {/* Spacer for centering */}
        </div>
      )}

      {/* Show guest access banner when viewing topic info */}
      {showTopicInfo && !showLoadingScreen && <GuestAccessBanner />}

      {showLoadingScreen ? (
        <QuizLoadingScreen onComplete={handleLoadingComplete} />
      ) : showTopicInfo ? (
        <TopicInfo
          topicData={topic}
          onStartQuiz={handleStartQuiz}
          requireAuth={!user && quizAttemptsToday >= GUEST_DAILY_QUIZ_LIMIT}
          onAuthRequired={() => setIsAuthDialogOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-950">
          <QuizErrorBoundary>
            <QuizEngine
              questions={questions}
              topicId={resolvedParams.topicId}
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