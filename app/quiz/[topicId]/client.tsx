"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { QuizLoadingScreen } from "@/components/quiz/quiz-loading-screen"
import { TopicInfo } from "@/components/quiz/topic-info"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { usePremium } from "@/hooks/usePremium"
import { dataService } from "@/lib/data-service"
import { useGuestAccess } from "@/hooks/useGuestAccess"
import { useIsMobile } from "@/hooks/useIsMobile"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import type { QuizGameMode, QuizModeConfig } from '@/lib/types/quiz'
import { FULL_MODE_CONFIGS } from '@/lib/types/quiz'
import { cn } from "@/lib/utils"
import { toast } from '@/components/ui/use-toast'
import { useAnalytics } from "@/utils/analytics"
import { useGlobalAudio } from "@/components/global-audio-controls"
import type { PremiumFeature } from "@/lib/types/premium"
import { PvPGameEngine } from "@/components/multiplayer/pvp-game-engine"

interface QuizPageProps {
  params: {
    topicId: string
  }
  searchParams?: {
    mode?: QuizGameMode
    podId?: string
    classroomCourseId?: string
    classroomAssignmentId?: string
    cleverSectionId?: string
    cleverAssignmentId?: string
    practice?: string
    continue?: string
  }
}

export default function QuizPageClient({ params, searchParams = {} }: QuizPageProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const { user } = useAuth()
  const { isPremium, hasFeatureAccess } = usePremium()
  const { trackEvent } = useAnalytics()
  const { autoPlayEnabled, playText } = useGlobalAudio()
  const isMobile = useIsMobile()
  const { recordQuizAttempt, quizAttemptsToday, hasCompletedTopic, GUEST_DAILY_QUIZ_LIMIT } = useGuestAccess()

  // Constants
  const PREMIUM_QUIZ_LIMIT = 20

  // Derived state
  const isPracticeMode = useMemo(() => searchParams.practice === 'true', [searchParams.practice])
  const isGuestMode = useMemo(() => !user, [user])
  const remainingQuizzes = useMemo(() => 
    user ? PREMIUM_QUIZ_LIMIT : Math.max(0, GUEST_DAILY_QUIZ_LIMIT - quizAttemptsToday), 
    [user, quizAttemptsToday]
  )

  // State management
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [showContinueLoading, setShowContinueLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedMode, setSelectedMode] = useState<QuizGameMode>(isPracticeMode ? 'practice' : 'standard')
  const [modeConfig, setModeConfig] = useState(() => FULL_MODE_CONFIGS[searchParams?.mode as QuizGameMode || 'standard'])
  const [showPvPGame, setShowPvPGame] = useState(false)
  
  // Check if quiz is partially completed (placeholder - would need to check localStorage or database)
  const isPartiallyCompleted = false

  // Helper function to convert database questions to QuizQuestion format
  const convertToQuizQuestion = useCallback((dbQuestion: any): QuizQuestion => {
    const converted = { ...dbQuestion }
    
    // Convert question_type to type if needed
    if (dbQuestion.question_type && !dbQuestion.type) {
      converted.type = dbQuestion.question_type
      delete converted.question_type
    }
    
    return converted as QuizQuestion
  }, [])

  // Set mounted state to avoid hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load quiz data
  useEffect(() => {
    // Ensure we have a topicId
    if (!params?.topicId) {
      console.error('❌ QuizPageClient: No topicId provided in params')
      setError("Quiz topic not found")
      setIsLoading(false)
      return
    }

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
            question_type: (q as any).question_type || (q as QuizQuestion).type,
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
          // Convert database format to QuizQuestion format
          const convertedQuestions = questionsData.map(convertToQuizQuestion)
          setQuestions(convertedQuestions)
          console.log(`✅ QuizPageClient: Pre-loaded ${questionsData.length} questions for topic ${params.topicId}`)
          
        } else {
          console.warn(`⚠️ QuizPageClient: No questions found for topic ${params.topicId}`)
        }
        
        // Check if this is a continue request
        const shouldContinue = urlSearchParams?.get('continue') === 'true'
        
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
        
      } catch (error) {
        console.error("❌ QuizPageClient: Error loading quiz data:", error)
        if (!isCancelled) {
          setError("Failed to load quiz data")
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadQuizData()

    return () => {
      isCancelled = true
    }
  }, [params.topicId, urlSearchParams, user, recordQuizAttempt, convertToQuizQuestion])

  // Handle starting quiz by navigating to appropriate quiz page
  const handleStartQuiz = useCallback(async (overrideMode?: QuizGameMode) => {
    try {
      const gameMode = overrideMode || selectedMode
      
      console.log(`🚀 QuizPageClient: Starting quiz for ${params.topicId} with mode ${gameMode}`)
      
      // Track quiz start
      trackEvent('quiz_started', 1, {
        topic_id: params.topicId,
        mode: gameMode,
        user_type: user ? 'authenticated' : 'guest'
      })

      // Build play parameters
      const playParams = new URLSearchParams()
      playParams.set('mode', gameMode)
      
      // Add pod/LMS integration parameters if present
      if (searchParams?.podId) {
        playParams.set('podId', searchParams.podId)
      }
      
      if (searchParams?.classroomCourseId) {
        playParams.set('classroomCourseId', searchParams.classroomCourseId)
        if (searchParams.classroomAssignmentId) {
          playParams.set('classroomAssignmentId', searchParams.classroomAssignmentId)
        }
      }
      
      if (searchParams?.cleverSectionId) {
        playParams.set('cleverSectionId', searchParams.cleverSectionId)
        if (searchParams.cleverAssignmentId) {
          playParams.set('cleverAssignmentId', searchParams.cleverAssignmentId)
        }
      }

      // Navigate to the appropriate quiz page based on mode
      switch (gameMode) {
        case 'npc_battle':
          router.push(`/quiz/${params.topicId}/battle?${playParams.toString()}`)
          break
        case 'classic_quiz':
          // Instead of navigating, show the PvP game engine directly
          setShowPvPGame(true)
          break
        default:
          // For all other modes (standard, practice, assessment, etc.)
          router.push(`/quiz/${params.topicId}/play?${playParams.toString()}`)
          break
      }
    } catch (error) {
      console.error('Error starting quiz:', error)
      toast({
        title: "Error",
        description: "Failed to start the quiz. Please try again.",
        variant: "destructive"
      })
    }
  }, [selectedMode, params.topicId, trackEvent, user, searchParams, router])

  const handleBackToHome = useCallback(() => {
    router.push("/")
  }, [router])

  const handleAuthSuccess = useCallback(() => {
    setIsAuthDialogOpen(false)
  }, [])

  const handleContinueLoadingComplete = useCallback(() => {
    setShowContinueLoading(false)
    // After continue loading, start the quiz
    handleStartQuiz()
  }, [handleStartQuiz])

  // Handle mode selection
  const handleModeSelect = useCallback(async (mode: QuizGameMode) => {
    console.log(`🎯 QuizPageClient: Mode selected: ${mode}`)
    setSelectedMode(mode)
    setModeConfig(FULL_MODE_CONFIGS[mode])
    
    // Navigate immediately to quiz for the selected mode
    await handleStartQuiz(mode)
  }, [handleStartQuiz])

  // Add PvP game exit handler
  const handlePvPGameExit = useCallback(() => {
    setShowPvPGame(false)
  }, [])

  // Show continue loading screen
  if (showContinueLoading) {
    return (
      <QuizLoadingScreen 
        onComplete={handleContinueLoadingComplete}
        duration={3000}
      />
    )
  }

  // Show loading state while component is mounting or data is loading
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header />
        <main className="max-w-4xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <div className="animate-pulse space-y-8">
            <div className="space-y-3">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-4/5"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header />
        <main className="max-w-2xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Quiz Not Found
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
                {error}
              </p>
            </div>
            <Button 
              onClick={handleBackToHome}
              className="px-8 py-3 text-base font-medium"
            >
              Back to Topics
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Show PvP game if active
  if (showPvPGame && topic) {
    return (
      <PvPGameEngine
        questions={questions}
        topicId={params.topicId}
        topicTitle={topic.topic_title}
        onExit={handlePvPGameExit}
      />
    )
  }

  // Main quiz topic information page
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        {/* Navigation */}
        <nav className="mb-8 sm:mb-12">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-light -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
        </nav>

        {/* Topic Information with Quiz Mode Selection */}
        {topic && (
          <div className="space-y-8">
            <TopicInfo
              topicData={topic}
              onStartQuiz={() => handleStartQuiz(selectedMode)}
              requireAuth={!user && !isGuestMode}
              onAuthRequired={() => setIsAuthDialogOpen(true)}
              remainingQuizzes={remainingQuizzes}
              isPartiallyCompleted={isPartiallyCompleted}
              hasCompletedTopic={hasCompletedTopic(params.topicId)}
              questions={questions}
              selectedMode={selectedMode}
              onModeChange={handleModeSelect}
              modeConfig={modeConfig}
              onModeConfigChange={setModeConfig}
              isPremium={isPremium}
              hasFeatureAccess={hasFeatureAccess}
            />
          </div>
        )}

        {/* Auth Dialog */}
        <AuthDialog
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          initialMode="sign-up"
        />
      </main>
    </div>
  )
}  