"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ExternalLink } from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import { SocialShare } from "@/components/social-share"
import { topicsData } from "@/lib/quiz-data"

interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
}

interface QuizResultsProps {
  userAnswers: UserAnswer[]
  questions: QuizQuestion[]
  onFinish: () => void
  topicId: string
}

export function QuizResults({ userAnswers, questions, onFinish, topicId }: QuizResultsProps) {
  const correctAnswers = userAnswers.filter((answer) => answer.isCorrect).length
  const totalQuestions = questions.length
  const score = Math.round((correctAnswers / totalQuestions) * 100)
  const isPerfectScore = correctAnswers === totalQuestions
  const topicTitle = topicsData[topicId]?.topic_title || "Civic Quiz"

  useEffect(() => {
    // Trigger confetti if score is 70% or higher
    if (score >= 70) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0, 0.2) },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0, 0.2) },
        })
      }, 250)
    }
  }, [score])

  // Helper function to get the text of the selected answer for multiple choice questions
  const getSelectedAnswerText = (question: QuizQuestion, answerKey: string): string => {
    if (question.question_type === "multiple_choice") {
      const optionKey = answerKey as keyof typeof question
      return question[optionKey] as string
    } else if (question.question_type === "true_false") {
      return answerKey
    } else {
      return answerKey
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Quiz Results</h2>
        <div className="text-5xl font-bold mb-4">{score}%</div>
        <p className="text-lg">
          You got {correctAnswers} out of {totalQuestions} questions correct
        </p>

        {isPerfectScore ? (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
            Perfect score! Excellent work! 🎉
          </div>
        ) : score >= 70 ? (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
            Great job! You've mastered this topic! 👏
          </div>
        ) : score >= 50 ? (
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg">
            Good effort! Review the questions you missed and try again.
          </div>
        ) : (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg">
            Keep learning! Review the material and try again.
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <SocialShare title={topicTitle} score={score} totalQuestions={totalQuestions} />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto mb-6">
        <h3 className="font-semibold mb-4">Question Summary</h3>
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = userAnswers.find((a) => a.questionId === question.question_number)
            const isCorrect = userAnswer?.isCorrect || false
            const selectedAnswer = userAnswer?.answer || ""

            return (
              <div key={question.question_number} className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-card">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">{question.question}</p>

                      {/* Show user's answer and correct/incorrect status */}
                      <div className="text-sm mb-3">
                        {isCorrect ? (
                          <p className="text-green-600 dark:text-green-400">
                            <span className="font-medium">Your answer:</span>{" "}
                            {question.question_type === "multiple_choice"
                              ? getSelectedAnswerText(question, selectedAnswer)
                              : selectedAnswer}
                          </p>
                        ) : (
                          <>
                            <p className="text-red-600 dark:text-red-400">
                              <span className="font-medium">Your answer:</span>{" "}
                              {question.question_type === "multiple_choice"
                                ? getSelectedAnswerText(question, selectedAnswer)
                                : selectedAnswer}
                            </p>
                            <p className="text-green-600 dark:text-green-400 mt-1">
                              <span className="font-medium">Correct answer:</span>{" "}
                              {question.question_type === "multiple_choice"
                                ? getSelectedAnswerText(question, question.correct_answer)
                                : question.correct_answer}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Explanation */}
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm mb-3">
                        <p>{question.explanation}</p>
                      </div>

                      {/* Integrated sources */}
                      {question.sources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-2">Learn more:</p>
                          <div className="space-y-1">
                            {question.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-xs text-primary hover:underline"
                              >
                                {source.name}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-auto">
        <Button onClick={onFinish} className="w-full rounded-xl">
          Complete Quiz
        </Button>
      </div>
    </div>
  )
}
