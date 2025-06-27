"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"

// V2 Quiz Engine
import { QuizEngineV2 } from "@/components/quiz/v2/engine/quiz-engine-v2"
import { QuizResultsSimple } from "@/components/quiz/v2/quiz-results-simple"
import { gameModeRegistry, ensureGameModesInitialized } from "@/components/quiz/v2/modes"
import { EnhancedProgressAdapter } from "@/components/quiz/v2/storage/enhanced-progress-adapter"

// Components
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { usePremium } from "@/hooks/usePremium"
import { PremiumGate } from "@/components/premium-gate"
import { QuizErrorBoundary } from "@/components/analytics-error-boundary"
import { dataService } from "@/lib/data-service"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import { ClassroomShareButton } from "@/components/integrations/google-classroom-share-button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { quizSaveManager } from "@/lib/quiz-save-manager"

// Types
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import type { QuizGameMode, QuizResults } from "@/lib/types/quiz"
import { UserRole } from "@/lib/types/user"

interface QuizPlayClientV2Props {
  topicId: string
  searchParams?: {
    attempt?: string
    podId?: string
    classroomCourseId?: string
    classroomAssignmentId?: string
    cleverSectionId?: string
    mode?: QuizGameMode
  }
}

// Confetti configuration
const confettiConfig = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#E0A63E', '#2E4057', '#6096BA', '#FFF5D9']
}

export default function QuizPlayClientV2({ topicId, searchParams }: QuizPlayClientV2Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [cachedResults, setCachedResults] = useState<QuizResults | null>(null)
  
  const sessionId = useRef(`quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  // Enhanced progress adapter
  const progressAdapter = useRef<EnhancedProgressAdapter | null>(null)
  
  // Guest access
  const { 
    quizAttemptsToday, 
    recordQuizAttempt, 
    hasReachedDailyLimit, 
    getRemainingAttempts,
    GUEST_DAILY_QUIZ_LIMIT,
    hasCompletedTopic,
    isInitialized,
    getOrCreateGuestToken
  } = useGuestAccess()

  // Initialize progress adapter
  useEffect(() => {
    if (isMounted) {
      progressAdapter.current = new EnhancedProgressAdapter({
        userId: user?.id,
        guestToken: user ? undefined : getOrCreateGuestToken(),
        sessionId: sessionId.current,
        topicId,
        mode: searchParams?.mode || 'standard',
      })
    }
  }, [isMounted, user, topicId, searchParams?.mode, getOrCreateGuestToken])

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
    
    // Safely initialize game modes once when component mounts
    ensureGameModesInitialized()
  }, [])

  // Check for recent completion with progress adapter
  useEffect(() => {
    if (!isMounted || !topicId || !progressAdapter.current) return

    if (EnhancedProgressAdapter.isQuizRecentlyCompleted(topicId)) {
      console.log('🎉 Quiz recently completed, showing celebration!')
      
      // Trigger confetti for returning to completed quiz
      setTimeout(() => {
        confetti(confettiConfig)
      }, 500)
      
      // Load cached results if available
      const completionKey = localStorage.getItem(`latest_quiz_completion_${topicId}`)
      if (completionKey) {
        const completionData = localStorage.getItem(completionKey)
        if (completionData) {
          const completion = JSON.parse(completionData)
          setCachedResults({
            totalQuestions: completion.totalQuestions || 0,
            correctAnswers: completion.correctAnswers || 0,
            incorrectAnswers: (completion.totalQuestions || 0) - (completion.correctAnswers || 0),
            score: completion.score || 0,
            timeTaken: 0,
            timeSpentSeconds: 0,
            questions: []
          })
          setShowResults(true)
        }
      }
    }
  }, [isMounted, topicId])

  // Load quiz data
  useEffect(() => {
    let isCancelled = false

    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load topic and questions
        const [topicData, questionsData] = await Promise.all([
          dataService.getTopicById(topicId),
          dataService.getQuestionsByTopic(topicId)
        ])
        
        if (isCancelled) return
        
        if (!topicData) {
          setError("Quiz not found")
          return
        }
        setTopic(topicData)
        
        if (!questionsData || questionsData.length === 0) {
          setError("No questions available for this quiz")
          return
        }
        
        setQuestions(questionsData)
        
        // Try to restore progress
        if (progressAdapter.current && !showResults) {
          const savedProgress = await progressAdapter.current.loadProgress()
          if (savedProgress) {
            toast({
              title: "Welcome back! 👋",
              description: "We've restored your progress. Let's continue!",
              className: "bg-primary/10 border-primary"
            })
          }
        }
        
        // Record attempt
        if (!user) {
          recordQuizAttempt()
        }
        await recordQuizAttempt(topicId)
        
        setIsLoading(false)
      } catch (err) {
        if (isCancelled) return
        console.error("Error loading quiz data:", err)
        setError("Failed to load quiz data")
        setIsLoading(false)
      }
    }

    if (topicId && !topic) {
      loadQuizData()
    }

    return () => {
      isCancelled = true
    }
  }, [topicId, topic, user, recordQuizAttempt, showResults])

  const handleQuizComplete = async (results: QuizResults) => {
    try {
      console.log('🎯 V2 handleQuizComplete ENTRY:', {
        resultsObject: results,
        topicIdFromProps: topicId,
        topicFromState: topic?.topic_id,
        userExists: !!user,
        searchParams,
        timestampForDebugging: Date.now()
      })

      // Validate required data before proceeding
      if (!results) {
        console.error('❌ No results provided to handleQuizComplete')
        toast({
          title: "Error",
          description: "Quiz results are missing. Please try again.",
          variant: "destructive"
        })
        return
      }

      if (!topicId) {
        console.error('❌ No topicId available in handleQuizComplete')
        toast({
          title: "Error", 
          description: "Topic ID is missing. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Generate guest token for non-authenticated users
      let guestToken: string | undefined = undefined
      
      if (!user) {
        console.log('👤 User not authenticated, generating guest token...')
        
        // Always create a new token for quiz completion to ensure it's valid
        guestToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('civicapp_guest_token', guestToken)
        console.log('🔑 Generated NEW guest token for quiz completion:', guestToken)
      } else {
        console.log('👤 User authenticated:', user.id)
      }

      // Use the bulletproof quiz save manager
      console.log('🛡️ Using bulletproof quiz save manager...')
      const saveResult = await quizSaveManager.saveQuizResults({
        topicId: String(topicId),
        results: {
          totalQuestions: Number(results.totalQuestions) || 0,
          correctAnswers: Number(results.correctAnswers) || 0,
          incorrectAnswers: Number(results.incorrectAnswers) || 0,
          score: Number(results.score) || 0,
          timeTaken: Number(results.timeTaken) || 0,
          timeSpentSeconds: Number(results.timeSpentSeconds || results.timeTaken) || 0,
          questions: results.questions || []
        },
        userId: user?.id,
        guestToken,
        attemptId: searchParams?.attempt,
        searchParams
      })

      if (saveResult.success) {
        console.log('✅ Quiz saved successfully on first attempt!')
        toast({
          title: "Quiz Complete!",
          description: `You scored ${results.score}% - your progress has been saved.`
        })
      } else {
        console.warn('⚠️ Quiz save failed initially, but results are backed up and will retry automatically')
        toast({
          title: "Quiz Complete!",
          description: `You scored ${results.score}% - your results are safely backed up and will be saved automatically.`,
          variant: "default" // Not destructive since results are safe
        })
      }

      // CRITICAL: Clear all progress storage to prevent returning to quiz on refresh
      try {
        // Clear enhanced progress storage
        const storageKey = `enhanced-progress-quiz-${topicId}`
        localStorage.removeItem(storageKey)
        
        // Clear regular progress storage
        const regularStorageKey = `civicSenseQuizProgress_${topicId}`
        localStorage.removeItem(regularStorageKey)
        
        // Clear any session-specific storage
        if (user?.id) {
          const userStorageKey = `civicAppPartialQuiz_${user.id}_${topicId}`
          localStorage.removeItem(userStorageKey)
        }
        
        console.log('✅ Cleared all quiz progress storage to prevent restoration')
      } catch (storageError) {
        console.warn('⚠️ Failed to clear some progress storage:', storageError)
      }

      // Store completion results for showing on refresh
      try {
        const completionData = {
          topicId,
          results,
          completedAt: new Date().toISOString(),
          score: results.score,
          totalQuestions: results.totalQuestions,
          correctAnswers: results.correctAnswers,
          mode: searchParams?.mode || 'standard'
        }
        
        // Store under a completion-specific key
        const completionKey = `quiz_completion_${topicId}_${Date.now()}`
        localStorage.setItem(completionKey, JSON.stringify(completionData))
        
        // Also store the latest completion reference
        localStorage.setItem(`latest_quiz_completion_${topicId}`, completionKey)
        
        console.log('✅ Stored completion data for results display on refresh')
      } catch (completionError) {
        console.warn('⚠️ Failed to store completion data:', completionError)
      }

      // Update localStorage activity markers
      const now = new Date()
      localStorage.setItem("civicAppLastActivity", now.toString())

      // Mark topic as completed
      const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
      const completedTopics = savedCompleted ? JSON.parse(savedCompleted) : []
      if (!completedTopics.includes(topicId)) {
        completedTopics.push(topicId)
        localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(completedTopics))
      }

      // Cache results for immediate display
      setCachedResults(results)
      setShowResults(true)

      console.log('🎯 Quiz completion handling finished - showing results screen')
    } catch (error) {
      console.error('Error completing quiz:', error)
      
      // Even if everything fails, try to save results with the backup manager
      try {
        console.log('🆘 Emergency backup save attempt...')
        const emergencyResult = await quizSaveManager.saveQuizResults({
          topicId: String(topicId),
          results,
          userId: user?.id,
          guestToken: user ? undefined : `emergency_${Date.now()}`,
          attemptId: searchParams?.attempt,
          searchParams
        })
        
        if (emergencyResult.isBackedUp) {
          toast({
            title: "Quiz Complete (Backup Saved)",
            description: "Your results are safely backed up and will be saved automatically.",
            variant: "default"
          })
        }
      } catch (emergencyError) {
        console.error('❌ Emergency save also failed:', emergencyError)
      }
      
      toast({
        title: "Error",
        description: `Failed to complete quiz: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive"
      })
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
    
    // Migrate progress to authenticated user
    if (progressAdapter.current && user?.id) {
      progressAdapter.current.migrateToUser(user.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !topic || !questions.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4 animate-in zoom-in duration-500">
            😔
          </div>
          <h1 className="text-2xl font-bold mb-4">Quiz Not Available</h1>
          <p className="text-muted-foreground mb-6">{error || "The requested quiz could not be loaded."}</p>
          <button 
            onClick={() => router.push(`/quiz/${topicId}`)}
            className={cn(
              "bg-primary text-primary-foreground px-6 py-2 rounded-lg",
              "hover:bg-primary/90 transition-all duration-200",
              "hover:scale-105 active:scale-95"
            )}
          >
            Back to Quiz Info
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 animate-in fade-in duration-500">
      {/* Only show header when not displaying results */}
      {!(showResults && cachedResults) && (
        <Header 
          onSignInClick={() => setIsAuthDialogOpen(true)}
          showTopBar={true}
          showMainHeader={true}
        />
      )}
      
      <div className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200",
        !(showResults && cachedResults) && "max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8"
      )} data-quiz-active="true">
        <div className={cn(
          !(showResults && cachedResults) && "pb-4 sm:pb-8"
        )}>
          <QuizErrorBoundary>
            {showResults && cachedResults ? (
              <QuizResultsSimple
                results={cachedResults}
                topic={{
                  topic_id: topic?.topic_id || "",
                  topic_title: topic?.topic_title || "",
                  description: topic?.description || "",
                  why_this_matters: topic?.why_this_matters || "",
                  emoji: topic?.emoji || "🏛️",
                  date: topic?.date || "",
                  dayOfWeek: topic?.dayOfWeek || "",
                  categories: topic?.categories || [],
                  is_breaking: topic?.is_breaking || false,
                  is_featured: topic?.is_featured || false
                }}
                gameMode={searchParams?.mode as QuizGameMode}
                onRetake={() => {
                  // Clear the cached results to allow retaking the quiz
                  setShowResults(false)
                  setCachedResults(null)
                  // Reload the page to start fresh
                  window.location.reload()
                }}
                onContinue={() => {
                  router.push(`/quiz/${topicId}`)
                }}
              />
            ) : (
              <QuizEngineV2
                questions={questions}
                topicId={topicId}
                currentTopic={{
                  topic_id: topic?.topic_id || "",
                  topic_title: topic?.topic_title || "",
                  emoji: topic?.emoji || "",
                  date: topic?.date || "",
                  description: topic?.description || "",
                  categories: topic?.categories || [],
                  difficulty: (topic?.difficulty === "beginner" ? "easy" : 
                              topic?.difficulty === "intermediate" ? "medium" : 
                              topic?.difficulty === "advanced" ? "hard" : "medium") as "easy" | "medium" | "hard",
                  is_published: true
                }}
                mode={searchParams?.mode as QuizGameMode || 'standard'}
                onComplete={handleQuizComplete}
                userId={user?.id}
                guestToken={user ? undefined : getOrCreateGuestToken()}
                podId={searchParams?.podId}
                classroomCourseId={searchParams?.classroomCourseId}
                classroomAssignmentId={searchParams?.classroomAssignmentId}
                cleverSectionId={searchParams?.cleverSectionId}
              />
            )}
          </QuizErrorBoundary>
        </div>

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

        {/* Share to LMS */}
        {(() => {
          const role = (user?.user_metadata?.role || '') as string
          const allowed = [
            UserRole.Teacher,
            UserRole.Parent,
            UserRole.Admin,
            UserRole.Organizer
          ] as string[]
          if (!role || !allowed.includes(role)) return null

          const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${topicId}`
          const quizTitle = `CivicSense Quiz: ${topic?.topic_title ?? ''}`
          const quizDescription = topic?.description || "Bite-sized civic knowledge from CivicSense"
          
          return (
            <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <ClassroomShareButton
                url={shareUrl}
                title={quizTitle}
                body={quizDescription}
                itemType="assignment"
                size={56}
              />
            </div>
          )
        })()}
      </div>
    </div>
  )
} 