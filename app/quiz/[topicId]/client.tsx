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
import { useIsMobile } from "@/hooks/useIsMobile"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import { cn } from "@/lib/utils"
import { ClassroomShareButton } from "@/components/integrations/google-classroom-share-button"
import { QuizNavigation } from "@/components/quiz/quiz-navigation"
import { UserRole } from "@/lib/types/user"
import { QuizGameMode, QuizModeConfig, FULL_MODE_CONFIGS, createModeConfig } from '@/lib/types/quiz'
import { toast } from '@/components/ui/use-toast'
import { Badge } from "@/components/ui/badge"

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
  }
}

interface QuizResults {
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpentSeconds: number
  answers: Array<{
    questionId: number
    answer: string
    isCorrect: boolean
    timeSpent: number
  }>
}

export default function QuizPageClient({ params, searchParams = {} }: QuizPageProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const { user } = useAuth()
  const { isPremium, hasFeatureAccess } = usePremium()
  const isMobile = useIsMobile()
  const { recordQuizAttempt, quizAttemptsToday, hasCompletedTopic, GUEST_DAILY_QUIZ_LIMIT, getRemainingAttempts } = useGuestAccess()
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [completedToday, setCompletedToday] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  const [showContinueLoading, setShowContinueLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedMode, setSelectedMode] = useState<QuizGameMode>(searchParams?.mode as QuizGameMode || 'standard')
  const [modeConfig, setModeConfig] = useState(() => FULL_MODE_CONFIGS[searchParams?.mode as QuizGameMode || 'standard'])
  
  const PREMIUM_QUIZ_LIMIT = 20 // Premium users get more quizzes per day

  // Helper function to check if user is in guest mode
  const isGuestMode = !user

  // Calculate remaining quizzes for guest users
  const remainingQuizzes = user ? PREMIUM_QUIZ_LIMIT : Math.max(0, GUEST_DAILY_QUIZ_LIMIT - quizAttemptsToday)
  
  // Check if quiz is partially completed (placeholder - would need to check localStorage or database)
  const isPartiallyCompleted = false

  // Helper function to convert database questions to QuizQuestion format
  const convertToQuizQuestion = (dbQuestion: any): QuizQuestion => {
    const converted = { ...dbQuestion }
    
    // Convert question_type to type if needed
    if (dbQuestion.question_type && !dbQuestion.type) {
      converted.type = dbQuestion.question_type
      delete converted.question_type
    }
    
    return converted as QuizQuestion
  }

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
          
          // Log detailed question analysis
          const questionAnalysis = convertedQuestions.map(q => ({
            number: q.question_number,
            type: q.type,
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
  }, [params.topicId, topic, urlSearchParams, user, recordQuizAttempt])

  const handleStartQuiz = async () => {
    if (!user && !isGuestMode) {
      setIsAuthDialogOpen(true);
      return;
    }

    // Check premium access for NPC battle mode
    if (selectedMode === 'npc_battle' && !isPremium) {
      setShowPremiumGate(true);
      return;
    }

    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: params.topicId,
          gameMode: selectedMode,
          modeSettings: modeConfig,
          platform: 'web',
          // Add pod-related data
          podId: searchParams?.podId,
          classroomCourseId: searchParams?.classroomCourseId,
          classroomAssignmentId: searchParams?.classroomAssignmentId,
          cleverSectionId: searchParams?.cleverSectionId,
          cleverAssignmentId: searchParams?.cleverAssignmentId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start quiz');
      }

      const data = await response.json();
      
      // If this is a pod/LMS quiz, include those params in the URL
      const playParams = new URLSearchParams({
        attempt: data.attemptId
      });
      
      if (searchParams?.podId) {
        playParams.set('podId', searchParams.podId);
      }
      
      if (searchParams?.classroomCourseId) {
        playParams.set('classroomCourseId', searchParams.classroomCourseId);
        if (searchParams.classroomAssignmentId) {
          playParams.set('classroomAssignmentId', searchParams.classroomAssignmentId);
        }
      }
      
      if (searchParams?.cleverSectionId) {
        playParams.set('cleverSectionId', searchParams.cleverSectionId);
        if (searchParams.cleverAssignmentId) {
          playParams.set('cleverAssignmentId', searchParams.cleverAssignmentId);
        }
      }

      // For NPC battle mode, redirect to the battle page
      if (selectedMode === 'npc_battle') {
        router.push(`/quiz/${params.topicId}/battle?${playParams.toString()}`);
      } else {
        router.push(`/quiz/${params.topicId}/play?${playParams.toString()}`);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to start the quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

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

    // If this was a pod/LMS quiz, redirect to the pod page
    if (searchParams?.podId) {
      router.push(`/pods/${searchParams.podId}`)
      return
    }

    // If this was a classroom quiz, show success message
    if (searchParams?.classroomCourseId) {
      // Could redirect back to classroom or show success
      return
    }

    // Navigate to results page
    router.push(`/results`)
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
  }

  const handleContinueLoadingComplete = () => {
    setShowContinueLoading(false)
    setShowLoadingScreen(true)
  }

  // Show loading state while component is mounting or data is loading
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mode selector component
  const renderModeSelector = () => {
    const availableModes: QuizGameMode[] = ['standard', 'practice']
    
    // Add NPC battle mode if user has premium access
    if (isPremium || hasFeatureAccess('spaced_repetition')) {
      availableModes.push('npc_battle')
    }

    // Mode display information (since QuizModeConfig doesn't have these)
    const modeDisplayInfo: Record<QuizGameMode, { name: string; description: string; features: string[] }> = {
      standard: {
        name: 'Standard Quiz',
        description: 'Regular quiz with scoring and time limits',
        features: ['Timed questions', 'Score tracking']
      },
      practice: {
        name: 'Practice Mode',
        description: 'Learn at your own pace with hints and explanations',
        features: ['No time limit', 'Hints available', 'Detailed explanations']
      },
      assessment: {
        name: 'Assessment Mode',
        description: 'Formal assessment with strict timing',
        features: ['Timed assessment', 'No hints', 'Formal scoring']
      },
      npc_battle: {
        name: 'NPC Battle',
        description: 'Challenge AI opponents with different personalities',
        features: ['AI opponents', 'Power-ups', 'Competitive scoring']
      },
      civics_test_quick: {
        name: 'Quick Civics Test',
        description: 'Short civics assessment',
        features: ['Quick test', 'Focused questions']
      },
      civics_test_full: {
        name: 'Full Civics Test',
        description: 'Comprehensive civics assessment',
        features: ['Full assessment', 'All topics']
      },
      classic_quiz: {
        name: 'Classic Quiz',
        description: 'Traditional multiplayer quiz',
        features: ['Multiplayer', 'Classic format']
      },
      speed_round: {
        name: 'Speed Round',
        description: 'Fast-paced competitive mode',
        features: ['Speed focus', 'Quick answers']
      },
      matching_challenge: {
        name: 'Matching Challenge',
        description: 'Team-based matching game',
        features: ['Team play', 'Matching format']
      },
      debate_mode: {
        name: 'Debate Mode',
        description: 'Discussion-based learning',
        features: ['Discussion', 'Evidence required']
      }
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Choose Game Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {availableModes.map((mode) => {
            const config = FULL_MODE_CONFIGS[mode]
            const displayInfo = modeDisplayInfo[mode]
            const isSelected = selectedMode === mode
            const isPremiumMode = mode === 'npc_battle'
            const hasAccess = !isPremiumMode || isPremium || hasFeatureAccess('spaced_repetition')
            
            return (
              <button
                key={mode}
                onClick={() => {
                  if (hasAccess) {
                    setSelectedMode(mode)
                    setModeConfig(config)
                  } else {
                    setShowPremiumGate(true)
                  }
                }}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  isSelected 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-200 hover:border-gray-300",
                  !hasAccess && "opacity-50 cursor-not-allowed"
                )}
                disabled={!hasAccess}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{displayInfo.name}</h4>
                  {isPremiumMode && (
                    <Badge variant="secondary" className="text-xs">
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {displayInfo.description}
                </p>
                {displayInfo.features && (
                  <ul className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    {displayInfo.features.slice(0, 2).map((feature: string, idx: number) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Button onClick={handleBackToHome}>
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show continue loading screen
  if (showContinueLoading) {
    return (
      <QuizLoadingScreen 
        onComplete={handleContinueLoadingComplete}
      />
    )
  }

  // Show quiz loading screen when starting quiz
  if (showLoadingScreen) {
    return (
      <QuizLoadingScreen 
        onComplete={() => setShowLoadingScreen(false)}
      />
    )
  }

  // Main quiz page content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
          
          <QuizNavigation 
            topicId={params.topicId}
            showKeyboardHints={false}
            compact={true}
            enableKeyboardShortcuts={false}
          />
        </div>

        {/* Topic Information */}
        {topic && (
          <TopicInfo 
            topicData={topic}
            questions={questions}
            onStartQuiz={handleStartQuiz}
            requireAuth={!user && quizAttemptsToday >= GUEST_DAILY_QUIZ_LIMIT}
            onAuthRequired={() => setIsAuthDialogOpen(true)}
            remainingQuizzes={remainingQuizzes}
            isPartiallyCompleted={isPartiallyCompleted}
            hasCompletedTopic={hasCompletedTopic(params.topicId)}
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            modeConfig={modeConfig}
            onModeConfigChange={setModeConfig}
            isPremium={isPremium}
          />
        )}

        {/* Mode Selector */}
        {renderModeSelector()}

        {/* Classroom Integration */}
        {searchParams?.classroomCourseId && topic && (
          <div className="mt-6">
            <ClassroomShareButton
              url={`${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${params.topicId}`}
              title={topic.topic_title}
              body={topic.description || "Civic education quiz from CivicSense"}
              itemType="assignment"
            />
          </div>
        )}
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode="sign-up"
      />

      {/* Premium Gate */}
      <PremiumGate
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="advanced_analytics"
        title="Premium Feature"
        description="Upgrade to access NPC Battle Mode and challenge AI opponents."
      />
    </div>
  )
}  