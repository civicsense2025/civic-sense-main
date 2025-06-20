"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { QuizEngine } from "@/components/quiz/quiz-engine"
import { QuizLoadingScreen } from "@/components/quiz/quiz-loading-screen"
import { TopicInfo } from "@/components/quiz/topic-info"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { QuizErrorBoundary } from "@/components/analytics-error-boundary"
import { dataService } from "@/lib/data-service"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import { cn } from "@/lib/utils"
import { ClassroomShareButton } from "@/components/integrations/google-classroom-share-button"
import { CleverShareButton } from "@/components/integrations/clever-share-button"
import { QuizNavigation } from "@/components/quiz/quiz-navigation"
import { UserRole } from "@/lib/types/user"

interface QuizPageProps {
  params: {
    topicId: string
  }
}

export default function QuizPageClient({ params }: QuizPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [showContinueLoading, setShowContinueLoading] = useState(false)
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
    let isCancelled = false

    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log(`🔍 QuizPageClient: Starting to load data for topic ${params.topicId}`)

        // Load topic metadata AND questions together for better UX
        const [topicData, questionsData] = await Promise.all([
          dataService.getTopicById(params.topicId),
          dataService.getQuestionsByTopic(params.topicId)
        ])
        
        console.log(`📊 QuizPageClient: Loaded data for ${params.topicId}:`, {
          topicFound: !!topicData,
          topicTitle: topicData?.topic_title,
          questionsCount: questionsData?.length || 0,
          questionsPreview: questionsData?.slice(0, 2).map(q => ({
            question_number: q.question_number,
            question_type: q.question_type,
            hasQuestion: !!q.question,
            hasCorrectAnswer: !!q.correct_answer,
            sourcesCount: q.sources?.length || 0
          }))
        })
        
        if (isCancelled) return // Prevent state update if component unmounted
        
        if (!topicData) {
          console.error(`❌ QuizPageClient: Topic not found for ${params.topicId}`)
          setError("Quiz not found")
          return
        }
        setTopic(topicData)
        
        // Always load questions for sources display and better UX
        if (questionsData && questionsData.length > 0) {
          setQuestions(questionsData)
          console.log(`✅ QuizPageClient: Pre-loaded ${questionsData.length} questions for topic ${params.topicId}`)
          
          // Log detailed question analysis
          const questionAnalysis = questionsData.map(q => ({
            number: q.question_number,
            type: q.question_type,
            hasQuestion: !!q.question,
            hasAnswer: !!q.correct_answer,
            sourcesCount: q.sources?.length || 0,
            tagsCount: q.tags?.length || 0,
            hasExplanation: !!q.explanation,
            hasHint: !!q.hint
          }))
          console.log(`📋 QuizPageClient: Question analysis for ${params.topicId}:`, questionAnalysis)
          
        } else {
          console.warn(`⚠️ QuizPageClient: No questions found for topic ${params.topicId}`)
          console.log(`🔍 QuizPageClient: Topic data:`, {
            topic_id: topicData.topic_id,
            topic_title: topicData.topic_title
          })
        }
        
        // Check if this is a continue request
        const shouldContinue = searchParams.get('continue') === 'true'
        
        if (shouldContinue) {
          // Show the witty loading screen for 3 seconds
          setShowContinueLoading(true)
          
          // Record the quiz attempt if questions are available
          if (questionsData && questionsData.length > 0) {
            if (!user) {
              recordQuizAttempt()
            }
            await recordQuizAttempt(params.topicId)
          }
        }
        
        setIsLoading(false)
      } catch (err) {
        if (isCancelled) return // Prevent state update if component unmounted
        
        console.error("❌ QuizPageClient: Error loading quiz data:", err)
        setError("Failed to load quiz data")
        setIsLoading(false)
      }
    }

    // Only load if we have a topicId and haven't loaded yet
    if (params.topicId && !topic) {
      loadQuizData()
    }

    return () => {
      isCancelled = true
    }
  }, [params.topicId, topic, searchParams, user, recordQuizAttempt])

  const handleStartQuiz = async () => {
    // Breaking and featured content is always free to access
    const isBreakingOrFeatured = topic?.is_breaking || topic?.is_featured
    
    // Check quiz limits based on user tier (but skip for breaking/featured content)
    if (!isBreakingOrFeatured && !user && hasReachedDailyLimit()) {
      setIsAuthDialogOpen(true)
      return
    }
    
    // Premium users should have unlimited access (but skip for breaking/featured content)
    if (!isBreakingOrFeatured && user && !isPremium && !isPro && quizAttemptsToday >= GUEST_DAILY_QUIZ_LIMIT) {
      setShowPremiumGate(true)
      return
    }

    // Check if questions are already loaded (they should be from useEffect)
    if (!questions || questions.length === 0) {
      setError("No questions available for this quiz")
      return
    }

    // Redirect to the dedicated play page
    router.push(`/quiz/${params.topicId}/play`)
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
  }

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false)
    setShowTopicInfo(false)
  }

  const handleContinueLoadingComplete = () => {
    setShowContinueLoading(false)
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Main app header */}
      <Header 
        onSignInClick={() => setIsAuthDialogOpen(true)}
        showTopBar={true}
        showMainHeader={true}
      />
      
      {/* Quiz Navigation - Only show on topic info screen, not during gameplay */}
      <QuizNavigation 
        topicId={params.topicId}
        showKeyboardHints={false} // No keyboard hints on landing page
        compact={true} // Use compact mode on topic info screen
        enableKeyboardShortcuts={false} // Disable keyboard shortcuts on landing page
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8">

      {showContinueLoading ? (
        <QuizLoadingScreen onComplete={handleContinueLoadingComplete} />
      ) : showLoadingScreen ? (
        <QuizLoadingScreen onComplete={handleLoadingComplete} />
      ) : (
        <TopicInfo
          topicData={topic}
          onStartQuiz={handleStartQuiz}
          requireAuth={!user && quizAttemptsToday >= GUEST_DAILY_QUIZ_LIMIT}
          onAuthRequired={() => setIsAuthDialogOpen(true)}
          remainingQuizzes={remainingQuizzes}
          isPartiallyCompleted={isPartiallyCompleted}
          hasCompletedTopic={hasCompletedTopic(params.topicId)}
          questions={questions}
        />
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