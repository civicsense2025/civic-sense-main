"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QuizEngine } from "@/components/quiz/quiz-engine"
import { QuizLoadingScreen } from "@/components/quiz/quiz-loading-screen"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { QuizErrorBoundary } from "@/components/analytics-error-boundary"
import { dataService } from "@/lib/data-service"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import { UserRole } from "@/lib/types/user"
import { ClassroomShareButton } from "@/components/integrations/google-classroom-share-button"
import { CleverShareButton } from "@/components/integrations/clever-share-button"

interface QuizPlayClientProps {
  params: {
    topicId: string
  }
}

export default function QuizPlayClient({ params }: QuizPlayClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
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
    let isCancelled = false

    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log(`🎮 QuizPlayClient: Loading quiz data for ${params.topicId}`)

        // Load topic metadata AND questions together
        const [topicData, questionsData] = await Promise.all([
          dataService.getTopicById(params.topicId),
          dataService.getQuestionsByTopic(params.topicId)
        ])
        
        if (isCancelled) return // Prevent state update if component unmounted
        
        if (!topicData) {
          console.error(`❌ QuizPlayClient: Topic not found for ${params.topicId}`)
          setError("Quiz not found")
          return
        }
        setTopic(topicData)
        
        if (!questionsData || questionsData.length === 0) {
          console.error(`❌ QuizPlayClient: No questions found for ${params.topicId}`)
          setError("No questions available for this quiz")
          return
        }
        
        setQuestions(questionsData)
        console.log(`✅ QuizPlayClient: Loaded ${questionsData.length} questions for ${params.topicId}`)
        
        // Record the quiz attempt
        if (!user) {
          recordQuizAttempt()
        }
        await recordQuizAttempt(params.topicId)
        
        setIsLoading(false)
      } catch (err) {
        if (isCancelled) return // Prevent state update if component unmounted
        
        console.error("❌ QuizPlayClient: Error loading quiz data:", err)
        setError("Failed to load quiz data")
        setIsLoading(false)
      }
    }

    if (params.topicId && !topic) {
      loadQuizData()
    }

    return () => {
      isCancelled = true
    }
  }, [params.topicId, topic, user, recordQuizAttempt])

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
    }

    // Redirect to results page (or back to quiz landing)
    setTimeout(() => {
      router.push(`/quiz/${params.topicId}`)
    }, 3000)
  }

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false)
  }

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
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

  if (error || !topic || !questions.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Available</h1>
          <p className="text-muted-foreground mb-6">{error || "The requested quiz could not be loaded."}</p>
          <button 
            onClick={() => router.push(`/quiz/${params.topicId}`)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Quiz Info
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main app header */}
      <Header 
        onSignInClick={() => setIsAuthDialogOpen(true)}
        showTopBar={true}
        showMainHeader={true}
      />
      
      {/* No quiz navigation here - this is pure gameplay */}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8" data-quiz-active="true">
        {showLoadingScreen ? (
          <QuizLoadingScreen onComplete={handleLoadingComplete} />
        ) : (
          <div className="pb-4 sm:pb-8">
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

        {/* Share to LMS (Google Classroom & Clever) - for educators only */}
        {(() => {
          const role = (user?.user_metadata?.role || '') as string
          const allowed = [
            UserRole.Teacher,
            UserRole.Parent,
            UserRole.Admin,
            UserRole.Organizer
          ] as string[]
          if (!role || !allowed.includes(role)) return null

          const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${params.topicId}`
          const quizTitle = `CivicSense Quiz: ${topic?.topic_title ?? ''}`
          const quizDescription = topic?.description || "Bite-sized civic knowledge from CivicSense"
          
          return (
            <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
              {/* Google Classroom Share */}
              <ClassroomShareButton
                url={shareUrl}
                title={quizTitle}
                body={quizDescription}
                itemType="assignment"
                size={56}
              />
              
              {/* Clever Share */}
              <CleverShareButton
                topicId={params.topicId}
                topicTitle={topic?.topic_title ?? ''}
                description={quizDescription}
                size="lg"
                className="shadow-lg"
              />
            </div>
          )
        })()}
      </div>
    </div>
  )
} 