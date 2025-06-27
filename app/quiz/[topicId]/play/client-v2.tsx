"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

// Import the V2 engine component
import { QuizEngineV2 } from "@/components/quiz/v2/engine/quiz-engine-v2"
import { QuizResultsSimple } from "@/components/quiz/v2/quiz-results-simple"

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

// Types
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"
import type { QuizGameMode, QuizResults, QuizTopic } from "@/lib/types/quiz"
import { UserRole } from "@/lib/types/user"
import type { StandardModeSettings, AIBattleSettings, PVPSettings } from '@/components/quiz/v2/modes'

interface QuizPlayClientV2Props {
  topicId: string
  topic: TopicMetadata | null
  searchParams?: {
    attempt?: string
    podId?: string
    classroomCourseId?: string
    classroomAssignmentId?: string
    cleverSectionId?: string
    mode?: string
  }
  userId?: string
  guestToken?: string
}

// Helper to convert TopicMetadata to QuizTopic
function topicMetadataToQuizTopic(metadata: TopicMetadata | null): QuizTopic | null {
  if (!metadata) return null
  
  return {
    topic_id: metadata.topic_id,
    topic_title: metadata.topic_title,
    description: metadata.description || '',
    emoji: metadata.emoji || '📚',
    date: metadata.date,
    categories: metadata.categories || [],
    difficulty: metadata.difficulty === 'beginner' ? 'easy' : 
                metadata.difficulty === 'intermediate' ? 'medium' : 
                metadata.difficulty === 'advanced' ? 'hard' : 'medium',
    is_published: true,
    why_this_matters: metadata.why_this_matters,
    is_breaking: metadata.is_breaking,
    is_featured: metadata.is_featured,
    category: metadata.category,
    subcategory: metadata.subcategory,
    tags: metadata.tags,
    source_url: metadata.source_url,
    last_updated: metadata.last_updated
  }
}

export default function QuizPlayClientV2({
  topicId,
  topic,
  searchParams,
  userId,
  guestToken
}: QuizPlayClientV2Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [cachedResults, setCachedResults] = useState<QuizResults | null>(null)
  
  // Use guest access hook
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

  // Map old mode parameter to new system
  const getModeSettings = (): { 
    mode: 'standard' | 'ai-battle' | 'pvp', 
    settings?: StandardModeSettings | AIBattleSettings | PVPSettings 
  } => {
    const urlMode = searchParams?.mode?.toLowerCase()
    
    // For now, all modes map to standard with different settings
    // In the future, we'll implement AI Battle and PVP
    switch (urlMode) {
      case 'timed':
        return {
          mode: 'standard',
          settings: {
            timeLimit: 30,
            totalTimeLimit: null,
            allowHints: false,
            allowSkip: false,
            allowReview: true,
            showExplanations: true,
            instantFeedback: false,
            scoringMode: 'speed-bonus',
            streakBonus: true,
            questionCount: undefined,
            shuffleQuestions: false,
            difficulty: 'mixed',
            topics: [topicId],
            mixTopics: false
          } as StandardModeSettings
        }
      
      case 'practice':
        return {
          mode: 'standard',
          settings: {
            timeLimit: null,
            totalTimeLimit: null,
            allowHints: true,
            allowSkip: true,
            allowReview: true,
            showExplanations: true,
            instantFeedback: true,
            scoringMode: 'standard',
            streakBonus: false,
            questionCount: undefined,
            shuffleQuestions: false,
            difficulty: 'mixed',
            topics: [topicId],
            mixTopics: false
          } as StandardModeSettings
        }
      
      case 'survival':
        return {
          mode: 'standard',
          settings: {
            timeLimit: 45,
            totalTimeLimit: null,
            allowHints: false,
            allowSkip: false,
            allowReview: false,
            showExplanations: true,
            instantFeedback: true,
            scoringMode: 'survival',
            streakBonus: true,
            questionCount: undefined,
            shuffleQuestions: false,
            difficulty: 'mixed',
            topics: [topicId],
            mixTopics: false
          } as StandardModeSettings
        }
      
      case 'speed':
        return {
          mode: 'standard',
          settings: {
            timeLimit: 15,
            totalTimeLimit: 300,
            allowHints: false,
            allowSkip: false,
            allowReview: true,
            showExplanations: false,
            instantFeedback: false,
            scoringMode: 'speed-bonus',
            streakBonus: true,
            questionCount: undefined,
            shuffleQuestions: false,
            difficulty: 'mixed',
            topics: [topicId],
            mixTopics: false
          } as StandardModeSettings
        }
      
      // Future modes
      case 'ai-battle':
      case 'npc':
        return {
          mode: 'ai-battle',
          settings: {
            npcId: 'civic-sage',
            npcDifficulty: 'medium',
            timeLimit: 30,
            powerupsEnabled: true,
            topics: [topicId]
          } as AIBattleSettings
        }
      
      case 'pvp':
      case 'multiplayer':
        return {
          mode: 'pvp',
          settings: {
            roomSize: 4,
            timeLimit: 30,
            chatEnabled: true,
            spectatorMode: false,
            topics: [topicId],
            isPrivate: false
          } as PVPSettings
        }
      
      default:
        // Standard mode with default settings
        return {
          mode: 'standard',
          settings: undefined // Use default settings from the mode
        }
    }
  }

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true)
        const questionsData = await dataService.getQuestionsByTopic(topicId)
        
        if (!questionsData || questionsData.length === 0) {
          toast({
            title: "No Questions Available",
            description: "This quiz doesn't have any questions yet.",
            variant: "destructive"
          })
          return
        }
        
        setQuestions(questionsData)
      } catch (error) {
        console.error('Error loading questions:', error)
        toast({
          title: "Error Loading Quiz",
          description: "Failed to load quiz questions. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadQuestions()
  }, [topicId])

  const handleQuizComplete = async (results: QuizResults) => {
    try {
      console.log('🎯 V2 handleQuizComplete called with results:', results)

      // Cache results for immediate display
      setCachedResults(results)
      setShowResults(true)

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
        
        const completionKey = `quiz_completion_${topicId}_${Date.now()}`
        localStorage.setItem(completionKey, JSON.stringify(completionData))
        localStorage.setItem(`latest_quiz_completion_${topicId}`, completionKey)
        
        console.log('✅ V2 Stored completion data for results display')
      } catch (completionError) {
        console.warn('⚠️ V2 Failed to store completion data:', completionError)
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

      console.log('🎯 V2 Quiz completion handling finished')
    } catch (error) {
      console.error('❌ V2 Error completing quiz:', error)
      toast({
        title: "Error",
        description: `Failed to complete quiz: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive"
      })
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading quiz questions...</p>
        </div>
      </div>
    )
  }

  if (error || !topic || !questions.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold mb-4">Quiz Not Available</h1>
          <p className="text-muted-foreground mb-6">{error || "The requested quiz could not be loaded."}</p>
          <button 
            onClick={() => router.push(`/quiz/${topicId}`)}
            className={cn(
              "bg-primary text-primary-foreground px-6 py-2 rounded-lg",
              "hover:bg-primary/90 transition-all duration-200"
            )}
          >
            Back to Quiz Info
          </button>
        </div>
      </div>
    )
  }

  const { mode, settings } = getModeSettings()
  const quizTopic = topicMetadataToQuizTopic(topic)
  
  // Currently only standard mode is fully implemented
  if (mode === 'ai-battle' || mode === 'pvp') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Coming Soon!</p>
          <p className="text-lg text-muted-foreground">
            {mode === 'ai-battle' ? 'AI Battle' : 'PVP'} mode is under development.
          </p>
          <p className="text-sm">Defaulting to Standard mode...</p>
          <div className="mt-8">
            <QuizEngineV2
              topicId={topicId}
              questions={questions}
              currentTopic={quizTopic}
              mode="standard"
              settings={undefined}
              onComplete={handleQuizComplete}
              userId={userId}
              guestToken={guestToken}
              resumedAttemptId={searchParams?.attempt}
              podId={searchParams?.podId}
              classroomCourseId={searchParams?.classroomCourseId}
              classroomAssignmentId={searchParams?.classroomAssignmentId}
              cleverSectionId={searchParams?.cleverSectionId}
            />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Only show header when not displaying results */}
      {!(showResults && cachedResults) && (
        <Header 
          onSignInClick={() => setIsAuthDialogOpen(true)}
          showTopBar={true}
          showMainHeader={true}
        />
      )}
      
      <div className={cn(
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
                  setShowResults(false)
                  setCachedResults(null)
                  window.location.reload()
                }}
                onContinue={() => {
                  router.push(`/quiz/${topicId}`)
                }}
              />
            ) : (
              <QuizEngineV2
                topicId={topicId}
                questions={questions}
                currentTopic={quizTopic}
                mode={mode}
                settings={settings}
                onComplete={handleQuizComplete}
                userId={userId}
                guestToken={guestToken}
                resumedAttemptId={searchParams?.attempt}
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

        {/* Share to LMS for educators */}
        {(() => {
          const role = (user?.user_metadata?.role || '') as string
          const allowed = [UserRole.Teacher, UserRole.Parent, UserRole.Admin, UserRole.Organizer] as string[]
          if (!role || !allowed.includes(role)) return null

          const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${topicId}`
          const quizTitle = `CivicSense Quiz: ${topic?.topic_title ?? ''}`
          const quizDescription = topic?.description || "Bite-sized civic knowledge from CivicSense"
          
          return (
            <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
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