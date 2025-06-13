"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuizEngine } from "@/components/quiz/quiz-engine"
import { TopicInfo } from "@/components/quiz/topic-info"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { dataService } from "@/lib/data-service"
import type { TopicMetadata, QuizQuestion } from "@/lib/quiz-data"

interface QuizPageProps {
  params: Promise<{
    topicId: string
  }>
}

export default function QuizPage({ params }: QuizPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [topic, setTopic] = useState<TopicMetadata | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTopicInfo, setShowTopicInfo] = useState(true)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [quizAttempts, setQuizAttempts] = useState(0)

  const FREE_QUIZ_LIMIT = 3

  useEffect(() => {
    // Load quiz attempts from localStorage
    const savedAttempts = localStorage.getItem("civicAppQuizAttempts")
    if (savedAttempts) {
      setQuizAttempts(Number.parseInt(savedAttempts, 10))
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
    // Check if user needs to authenticate
    if (!user && quizAttempts >= FREE_QUIZ_LIMIT) {
      setIsAuthDialogOpen(true)
      return
    }

    // Increment quiz attempts if not authenticated
    if (!user) {
      const newAttempts = quizAttempts + 1
      setQuizAttempts(newAttempts)
      localStorage.setItem("civicAppQuizAttempts", newAttempts.toString())
    }

    setShowTopicInfo(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              CivicSense Quiz
            </h1>
            <p className="text-sm text-muted-foreground">
              {topic.topic_title}
            </p>
          </div>
          
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {showTopicInfo ? (
          <TopicInfo
            topicData={topic}
            onStartQuiz={handleStartQuiz}
            requireAuth={!user && quizAttempts >= FREE_QUIZ_LIMIT}
            onAuthRequired={() => setIsAuthDialogOpen(true)}
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8">
            <QuizEngine
              questions={questions}
              topicId={resolvedParams.topicId}
              onComplete={handleQuizComplete}
            />
          </div>
        )}
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
} 