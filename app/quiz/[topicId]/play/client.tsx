"use client"

import { useState, useEffect, useCallback } from "react"
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
import type { QuizGameMode, QuizResults } from "@/lib/types/quiz"
import { UserRole } from "@/lib/types/user"
import { ClassroomShareButton } from "@/components/integrations/google-classroom-share-button"

import { toast } from "@/components/ui/use-toast"

interface QuizPlayClientProps {
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

export default function QuizPlayClient({ topicId, searchParams }: QuizPlayClientProps) {
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
  const [showResults, setShowResults] = useState(false)
  const [cachedResults, setCachedResults] = useState<QuizResults | null>(null)
  
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

  // Check for recent completion on mount
  useEffect(() => {
    if (!isMounted || !topicId) return

    console.log('🔍 Checking for recent quiz completion for topic:', topicId)

    try {
      let foundRecentCompletion = false
      let completionResults: QuizResults | null = null

      // Method 1: Check latest completion reference (most reliable)
      const completionKey = localStorage.getItem(`latest_quiz_completion_${topicId}`)
      if (completionKey) {
        console.log('📍 Found completion key:', completionKey)
        const completionData = localStorage.getItem(completionKey)
        if (completionData) {
          const completion = JSON.parse(completionData)
          const completedAt = new Date(completion.completedAt).getTime()
          const now = Date.now()
          const fiveMinutesAgo = now - (5 * 60 * 1000)

          if (completedAt > fiveMinutesAgo) {
            console.log('✅ Found recent completion via latest key (method 1)')
            foundRecentCompletion = true
            
            // Extract results from completion data
            completionResults = {
              totalQuestions: completion.totalQuestions || completion.results?.totalQuestions || 0,
              correctAnswers: completion.correctAnswers || completion.results?.correctAnswers || 0,
              incorrectAnswers: (completion.totalQuestions || 0) - (completion.correctAnswers || 0),
              score: completion.score || completion.results?.score || 0,
              timeTaken: completion.results?.timeTaken || 0,
              timeSpentSeconds: completion.results?.timeSpentSeconds || 0,
              questions: completion.results?.questions || []
            }
          }
        }
      }

      // Method 2: Check completed topics list with recent activity
      if (!foundRecentCompletion) {
        const completedTopicsStr = localStorage.getItem("civicAppCompletedTopics_v1")
        if (completedTopicsStr) {
          const completedTopics = JSON.parse(completedTopicsStr)
          if (Array.isArray(completedTopics) && completedTopics.includes(topicId)) {
            const lastActivityStr = localStorage.getItem("civicAppLastActivity")
            if (lastActivityStr) {
              const lastActivity = new Date(lastActivityStr).getTime()
              const now = Date.now()
              const fiveMinutesAgo = now - (5 * 60 * 1000)
              
              if (lastActivity > fiveMinutesAgo) {
                console.log('✅ Found recent completion via completed topics (method 2)')
                foundRecentCompletion = true
                
                // Create basic results since we don't have detailed data
                completionResults = {
                  totalQuestions: 0,
                  correctAnswers: 0,
                  incorrectAnswers: 0,
                  score: 0,
                  timeTaken: 0,
                  timeSpentSeconds: 0,
                  questions: []
                }
              }
            }
          }
        }
      }

      // Method 3: Check for any completion data keys for this topic
      if (!foundRecentCompletion) {
        const allKeys = Object.keys(localStorage)
        const recentCompletionKeys = allKeys.filter(key => 
          key.startsWith(`quiz_completion_${topicId}_`) && 
          key !== `latest_quiz_completion_${topicId}`
        )
        
        for (const key of recentCompletionKeys) {
          try {
            const data = localStorage.getItem(key)
            if (data) {
              const completion = JSON.parse(data)
              const completedAt = new Date(completion.completedAt).getTime()
              const now = Date.now()
              const fiveMinutesAgo = now - (5 * 60 * 1000)

              if (completedAt > fiveMinutesAgo) {
                console.log('✅ Found recent completion via completion key (method 3):', key)
                foundRecentCompletion = true
                
                completionResults = {
                  totalQuestions: completion.totalQuestions || 0,
                  correctAnswers: completion.correctAnswers || 0,
                  incorrectAnswers: (completion.totalQuestions || 0) - (completion.correctAnswers || 0),
                  score: completion.score || 0,
                  timeTaken: 0,
                  timeSpentSeconds: 0,
                  questions: []
                }
                break
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Invalid completion data for key:', key)
          }
        }
      }

      if (foundRecentCompletion && completionResults) {
        console.log('🎉 Found recent quiz completion, showing results instead of fresh quiz')
        setCachedResults(completionResults)
        setShowResults(true)
        setShowLoadingScreen(false)
        return
      } else {
        console.log('📝 No recent completion found, proceeding with normal quiz flow')
      }
    } catch (error) {
      console.warn('⚠️ Error checking for recent completion:', error)
    }
  }, [isMounted, topicId])

  useEffect(() => {
    let isCancelled = false

    const loadQuizData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log(`🎮 QuizPlayClient: Loading quiz data for ${topicId}`)

        // Load topic metadata AND questions together
        const [topicData, questionsData] = await Promise.all([
          dataService.getTopicById(topicId),
          dataService.getQuestionsByTopic(topicId)
        ])
        
        if (isCancelled) return // Prevent state update if component unmounted
        
        if (!topicData) {
          console.error(`❌ QuizPlayClient: Topic not found for ${topicId}`)
          setError("Quiz not found")
          return
        }
        setTopic(topicData)
        
        if (!questionsData || questionsData.length === 0) {
          console.error(`❌ QuizPlayClient: No questions found for ${topicId}`)
          setError("No questions available for this quiz")
          return
        }
        
        setQuestions(questionsData)
        console.log(`✅ QuizPlayClient: Loaded ${questionsData.length} questions for ${topicId}`)
        
        // Record the quiz attempt
        if (!user) {
          recordQuizAttempt()
        }
        await recordQuizAttempt(topicId)
        
        setIsLoading(false)
      } catch (err) {
        if (isCancelled) return // Prevent state update if component unmounted
        
        console.error("❌ QuizPlayClient: Error loading quiz data:", err)
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
  }, [topicId, topic, user, recordQuizAttempt])

  const handleQuizComplete = async (results: QuizResults) => {
    try {
      console.log('🎯 handleQuizComplete ENTRY:', {
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

      // Generate guest token IMMEDIATELY for non-authenticated users
      let guestToken: string | undefined = undefined
      
      if (!user) {
        console.log('👤 User not authenticated, generating guest token...')
        
        // Always create a new token for quiz completion to ensure it's valid
        guestToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('civicapp_guest_token', guestToken)
        console.log('🔑 Generated NEW guest token for quiz completion:', guestToken)
        
        // Double-check it was saved
        const verifyToken = localStorage.getItem('civicapp_guest_token')
        console.log('🔍 Verified saved token:', verifyToken)
        
        if (!verifyToken) {
          console.error('❌ Failed to save guest token to localStorage!')
          // Fallback: use the generated token anyway
          guestToken = `guest_fallback_${Date.now()}`
        }
      } else {
        console.log('👤 User authenticated:', user.id)
      }

      // Prepare the request payload with explicit validation
      const requestPayload = {
        attemptId: searchParams?.attempt || undefined,
        results: {
          totalQuestions: Number(results.totalQuestions) || 0,
          correctAnswers: Number(results.correctAnswers) || 0,
          incorrectAnswers: Number(results.incorrectAnswers) || 0,
          score: Number(results.score) || 0,
          timeTaken: Number(results.timeTaken) || 0,
          timeSpentSeconds: Number(results.timeSpentSeconds || results.timeTaken) || 0,
          questions: results.questions || []
        },
        topicId: String(topicId), // Explicitly convert to string
        mode: String(searchParams?.mode || 'standard'),
        // Add pod-related data
        podId: searchParams?.podId || undefined,
        classroomCourseId: searchParams?.classroomCourseId || undefined,
        classroomAssignmentId: searchParams?.classroomAssignmentId || undefined,
        cleverSectionId: searchParams?.cleverSectionId || undefined,
        // Removed: cleverAssignmentId (not used by Clever)
        // Send guest token for unauthenticated users
        guestToken: guestToken || undefined
      }

      console.log('💾 FINAL REQUEST PAYLOAD:', {
        hasUser: !!user,
        userId: user?.id || 'NOT_AUTHENTICATED',
        hasGuestToken: !!requestPayload.guestToken,
        guestTokenValue: requestPayload.guestToken,
        topicId: requestPayload.topicId,
        score: requestPayload.results.score,
        totalQuestions: requestPayload.results.totalQuestions,
        payloadSizeBytes: JSON.stringify(requestPayload).length,
        mode: requestPayload.mode
      })

      // Save quiz results with required topicId
      const response = await fetch('/api/quiz/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Quiz save failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestPayload: {
            hasResults: !!requestPayload.results,
            hasTopicId: !!requestPayload.topicId,
            hasGuestToken: !!requestPayload.guestToken,
            topicIdValue: requestPayload.topicId,
            guestTokenValue: requestPayload.guestToken
          }
        })
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('✅ Quiz completion saved successfully:', responseData)

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
        
        console.log('✅ Stored completion data for results display on refresh:', {
          completionKey,
          completionData: {
            score: completionData.score,
            totalQuestions: completionData.totalQuestions,
            completedAt: completionData.completedAt
          }
        })
      } catch (completionError) {
        console.warn('⚠️ Failed to store completion data:', completionError)
      }

      // Handle quiz completion (update localStorage, etc.)
      const now = new Date()
      localStorage.setItem("civicAppLastActivity", now.toString())

      // Mark topic as completed
      const savedCompleted = localStorage.getItem("civicAppCompletedTopics_v1")
      const completedTopics = savedCompleted ? JSON.parse(savedCompleted) : []
      if (!completedTopics.includes(topicId)) {
        completedTopics.push(topicId)
        localStorage.setItem("civicAppCompletedTopics_v1", JSON.stringify(completedTopics))
      }

      // If this was a pod/LMS quiz, redirect to the pod page
      if (searchParams?.podId) {
        console.log('🏫 Pod quiz completed, redirecting to pod page')
        router.push(`/pods/${searchParams.podId}`)
        return
      }

      // For regular quizzes, don't redirect here - let the quiz engine show results
      // The QuizResults component will handle the final redirect when user clicks "Continue Learning"
      console.log('🎯 Quiz completion handling finished - QuizEngine should now show results screen')
      console.log('📍 Current URL should remain:', window.location.href)
    } catch (error) {
      console.error('Error completing quiz:', error)
      toast({
        title: "Error",
        description: `Failed to save quiz results: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive"
      })
    }
  }

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false)
  }, [])

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
            onClick={() => router.push(`/quiz/${topicId}`)}
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
              {showResults && cachedResults ? (
                <div className="text-center py-8 space-y-6">
                  <div className="animate-in zoom-in duration-500">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
                    <p className="text-muted-foreground mb-6">
                      You scored {cachedResults.score}% on {topic?.topic_title}
                    </p>
                  </div>
                  
                  <div className="bg-primary/10 rounded-lg p-6 max-w-md mx-auto">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {cachedResults.score}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {cachedResults.correctAnswers} out of {cachedResults.totalQuestions} correct
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push(`/quiz/${topicId}`)}
                      className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Continue Learning
                    </button>
                    
                    <button
                      onClick={() => {
                        // Clear the cached results to allow retaking the quiz
                        const completionKey = localStorage.getItem(`latest_quiz_completion_${topicId}`)
                        if (completionKey) {
                          localStorage.removeItem(completionKey)
                          localStorage.removeItem(`latest_quiz_completion_${topicId}`)
                        }
                        setShowResults(false)
                        setCachedResults(null)
                        // Reload the page to start fresh
                        window.location.reload()
                      }}
                      className="w-full border border-border px-6 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      Take Quiz Again
                    </button>
                  </div>
                </div>
              ) : (
                <QuizEngine
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
                  onComplete={handleQuizComplete}
                  practiceMode={searchParams?.mode === 'practice'}
                  mode={searchParams?.mode as QuizGameMode || 'standard'}
                />
              )}
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

          const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/quiz/${topicId}`
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
            </div>
          )
        })()}
      </div>
    </div>
  )
} 