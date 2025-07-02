"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

// Import the V2 engine component
import { QuizEngineV2 } from "@civicsense/ui-web/components/quiz/v2/engine/quiz-engine-v2"
import { QuizResultsSimple } from "@civicsense/ui-web/components/quiz/v2/quiz-results-simple"

// Components
import { Header } from "@civicsense/ui-web/components/header"
import { useAuth } from "@civicsense/ui-web/components/auth/auth-provider"
import { AuthDialog } from "@civicsense/ui-web/components/auth/auth-dialog"
import { usePremium } from "@civicsense/shared/hooks/usePremium"
import { PremiumGate } from "@civicsense/ui-web/components/premium-gate"
import { QuizErrorBoundary } from "@civicsense/ui-web/components/analytics-error-boundary"
import { dataService } from "@civicsense/shared/lib/data-service"
import { useGuestAccess } from "@civicsense/shared/hooks/useGuestAccess"
import { ClassroomShareButton } from "@civicsense/ui-web/components/integrations/google-classroom-share-button"
import { toast } from "@civicsense/ui-web/components/ui/use-toast"
import { cn } from "@civicsense/shared/lib/utils"

// Types
import type { TopicMetadata, QuizQuestion } from "@civicsense/shared/lib/quiz-data"
import type { QuizGameMode, QuizResults, QuizTopic } from "@civicsense/shared/lib/types/quiz"
import { UserRole } from "@civicsense/shared/lib/types/user"
import type { StandardModeSettings, AIBattleSettings, PVPSettings } from '@civicsense/ui-web/components/quiz/v2/modes'

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
  topic: initialTopic,
  searchParams,
  userId,
  guestToken
}: QuizPlayClientV2Props) {
  console.log('🎯 V2 Client: Component mounting with props:', { topicId, initialTopic, searchParams })
  
  const router = useRouter()
  const { user } = useAuth()
  const { hasFeatureAccess, isPremium, isPro } = usePremium()
  const [topic, setTopic] = useState<TopicMetadata | null>(initialTopic)
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
  const getModeSettings = useCallback(() => {
    const mode = searchParams?.mode || 'standard'
    
    switch (mode) {
      case 'practice':
        // Solo Practice: Learn at your pace with hints and instant feedback
        return {
          mode: 'standard' as const,
          settings: {
            timeLimit: null,              // No time pressure
            totalTimeLimit: null,         // No overall limit
            allowHints: true,             // Enable hints for learning
            allowSkip: true,              // Allow skipping questions
            allowReview: true,            // Can review at end
            showExplanations: true,       // Show explanations
            instantFeedback: true,        // Immediate feedback
            scoringMode: 'standard',      // Regular scoring
            streakBonus: false,           // No streak pressure
            questionCount: undefined,     // All questions
            shuffleQuestions: false,      // Keep original order
            difficulty: 'mixed',          // All difficulties
            topics: [],                   // Single topic
            mixTopics: false              // Don't mix topics
          } as StandardModeSettings
        }
        
      case 'speed_round':
      case 'timed':
        // Timed Challenge: Test your speed with time pressure
        return {
          mode: 'standard' as const,
          settings: {
            timeLimit: 30,                // 30 seconds per question
            totalTimeLimit: 300,          // 5 minutes total
            allowHints: false,            // No hints in timed mode
            allowSkip: false,             // Can't skip in timed mode
            allowReview: true,            // Can review at end
            showExplanations: true,       // Show explanations after
            instantFeedback: false,       // Wait until end
            scoringMode: 'speed-bonus',   // Speed bonus scoring
            streakBonus: true,            // Streak bonus for speed
            questionCount: undefined,     // All questions
            shuffleQuestions: false,      // Keep original order
            difficulty: 'mixed',          // All difficulties
            topics: [],                   // Single topic
            mixTopics: false              // Don't mix topics
          } as StandardModeSettings
        }
        
      case 'npc_battle':
        // AI Battle mode (future)
        return {
          mode: 'ai-battle' as const,
          settings: undefined // Use default AI battle settings
        }
        
      case 'classic_quiz':
      case 'pvp':
        // PVP Battle mode (future)  
        return {
          mode: 'pvp' as const,
          settings: undefined // Use default PVP settings
        }
        
      case 'standard':
      default:
        // Standard Quiz: Classic quiz experience
        return {
          mode: 'standard' as const,
          settings: {
            timeLimit: null,              // No time pressure
            totalTimeLimit: null,         // No overall limit
            allowHints: false,            // No hints
            allowSkip: false,             // Can't skip questions
            allowReview: true,            // Can review at end
            showExplanations: true,       // Show explanations after
            instantFeedback: false,       // Wait until end for feedback
            scoringMode: 'standard',      // Regular scoring
            streakBonus: true,            // Bonus for consecutive correct
            questionCount: undefined,     // All questions
            shuffleQuestions: false,      // Keep original order
            difficulty: 'mixed',          // All difficulties
            topics: [],                   // Single topic
            mixTopics: false              // Don't mix topics
          } as StandardModeSettings
        }
    }
  }, [searchParams?.mode])

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('🔍 V2 Client: Starting quiz data load for topic:', topicId)
        console.log('🔍 V2 Client: Initial topic provided:', !!initialTopic, initialTopic?.topic_title)
        
        // Load both topic and questions in parallel
        console.log('🔄 V2 Client: Executing parallel data load...')
        const [topicData, questionsData] = await Promise.all([
          initialTopic ? 
            Promise.resolve(initialTopic) : 
            dataService.getTopicById(topicId).then(result => {
              console.log('📊 V2 Client: Topic load result:', !!result, result?.topic_title)
              return result
            }),
          dataService.getQuestionsByTopic(topicId).then(result => {
            console.log('📊 V2 Client: Questions load result:', result?.length || 0, 'questions')
            return result
          })
        ])
        
        console.log('📊 V2 Client: Data load completed:', {
          topicFound: !!topicData,
          topicTitle: topicData?.topic_title,
          questionsCount: questionsData?.length || 0,
          questionsValid: Array.isArray(questionsData)
        })
        
        if (!topicData) {
          console.error('❌ V2 Client: No topic data found')
          setError("Quiz topic not found")
          return
        }
        
        if (!questionsData || questionsData.length === 0) {
          console.error('❌ V2 Client: No questions data found')
          setError("This quiz doesn't have any questions yet")
          return
        }
        
        console.log('✅ V2 Client: Setting data state...')
        setTopic(topicData)
        setQuestions(questionsData)
        
        console.log('✅ V2 Client: Quiz data loaded successfully')
      } catch (error) {
        console.error('❌ V2 Client: Error in loadQuizData:', error)
        console.error('❌ V2 Client: Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
        setError(error instanceof Error ? error.message : "Failed to load quiz data")
      } finally {
        console.log('🏁 V2 Client: Setting loading to false')
        setIsLoading(false)
      }
    }
    
    console.log('🚀 V2 Client: useEffect triggered, calling loadQuizData')
    loadQuizData()
  }, [topicId, initialTopic])

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
        !(showResults && cachedResults) && "max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-8"
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