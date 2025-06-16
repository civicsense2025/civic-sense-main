"use client"

import { quizDatabase } from "@/lib/quiz-database"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { QuizResults } from "@/components/quiz/quiz-results"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface ResultsPageProps {
  params: {
    attemptId: string
  }
}

export default function PastResultsPage({ params }: ResultsPageProps) {
  const attemptId = params.attemptId
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<{
    topicId: string
    userAnswers: Array<{
      questionId: number
      answer: string
      isCorrect: boolean
      timeSpent: number
    }>
    questions: any[]
  } | null>(null)

  useEffect(() => {
    if (!attemptId) return
    const load = async () => {
      try {
        setLoading(true)
        const details = await quizDatabase.getQuizAttemptDetails(attemptId)
        if (!details.attempt) {
          setError("Attempt not found")
          return
        }
        const { attempt, userAnswers, questions } = details

        // Convert userAnswers shape to QuizResults expected
        const convertedAnswers = userAnswers.map(ans => ({
          questionId: ans.questionNumber,
          answer: ans.answer,
          isCorrect: ans.isCorrect,
          timeSpent: ans.timeSpent
        }))

        setState({ topicId: attempt.topicId, userAnswers: convertedAnswers, questions })
      } catch (e) {
        console.error(e)
        setError("Failed to load attempt details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [attemptId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center text-center px-4">
        <div className="text-4xl mb-6">😕</div>
        <h1 className="text-2xl font-light text-slate-900 dark:text-white mb-4">
          {error || "Results Not Found"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-light mb-8 max-w-md">
          We couldn't find the quiz results you're looking for. They might have expired or been removed.
        </p>
        <Link 
          href="/dashboard"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Clean header */}
      <div className="border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Clean branding */}
            <Link 
              href="/" 
              className="group hover:opacity-70 transition-opacity"
            >
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                CivicSense
              </h1>
            </Link>
            
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Results content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <QuizResults
          userAnswers={state.userAnswers}
          questions={state.questions as any}
          topicId={state.topicId}
          onFinish={() => router.push("/dashboard")}
        />
      </div>
    </div>
  )
} 