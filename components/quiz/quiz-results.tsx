"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ExternalLink, Trophy, Target, Clock, Zap } from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect, useState } from "react"
import { SocialShare } from "@/components/social-share"
import { dataService } from "@/lib/data-service"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { QuestionFeedback } from "./question-feedback"

interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  timeSpent: number
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
  const [topicTitle, setTopicTitle] = useState("Civic Quiz")
  const [showStats, setShowStats] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

  // Calculate additional stats
  const averageTime = Math.round(userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0) / userAnswers.length)
  const fastestAnswer = Math.min(...userAnswers.map(a => a.timeSpent))
  const streak = calculateLongestStreak(userAnswers)
  const totalTime = userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0)

  function calculateLongestStreak(answers: UserAnswer[]): number {
    let maxStreak = 0
    let currentStreak = 0
    
    answers.forEach(answer => {
      if (answer.isCorrect) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })
    
    return maxStreak
  }

  // Load topic title
  useEffect(() => {
    const loadTopicTitle = async () => {
      try {
        const topic = await dataService.getTopicById(topicId)
        setTopicTitle(topic?.topic_title || "Civic Quiz")
      } catch (error) {
        console.error('Error loading topic title:', error)
        setTopicTitle("Civic Quiz")
      }
    }

    loadTopicTitle()
  }, [topicId])

  // Animate score counter
  useEffect(() => {
    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = score / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
        setShowStats(true)
      } else {
        setAnimatedScore(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  useEffect(() => {
    // Enhanced confetti based on performance
    if (score >= 70) {
      const duration = isPerfectScore ? 5000 : 3000
      const animationEnd = Date.now() + duration
      const defaults = { 
        startVelocity: isPerfectScore ? 45 : 30, 
        spread: 360, 
        ticks: isPerfectScore ? 100 : 60, 
        zIndex: 0 
      }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = (isPerfectScore ? 100 : 50) * (timeLeft / duration)

        // Multiple confetti bursts for perfect score
        if (isPerfectScore) {
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0, 0.2) },
            colors: ['#FFD700', '#FFA500', '#FF6347']
          })
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0, 0.2) },
            colors: ['#32CD32', '#00FF00', '#ADFF2F']
          })
        } else {
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
        }
      }, 250)
    }
  }, [score, isPerfectScore])

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

  const getScoreColor = () => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-blue-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = () => {
    if (isPerfectScore) return { emoji: "🏆", text: "Perfect!", color: "bg-yellow-100 text-yellow-800 border-yellow-300" }
    if (score >= 90) return { emoji: "🌟", text: "Excellent!", color: "bg-green-100 text-green-800 border-green-300" }
    if (score >= 70) return { emoji: "👏", text: "Great job!", color: "bg-blue-100 text-blue-800 border-blue-300" }
    if (score >= 50) return { emoji: "👍", text: "Good effort!", color: "bg-yellow-100 text-yellow-800 border-yellow-300" }
    return { emoji: "📚", text: "Keep learning!", color: "bg-red-100 text-red-800 border-red-300" }
  }

  const badge = getScoreBadge()

  const getPerformanceMessage = () => {
    if (score >= 95) return "🎉 Outstanding! You're a civic expert!"
    if (score >= 90) return "🌟 Excellent work! You really know your stuff!"
    if (score >= 80) return "👏 Great job! You have a solid understanding!"
    if (score >= 70) return "👍 Good work! Keep learning and improving!"
    if (score >= 50) return "📚 Not bad! There's room for improvement!"
    return "💪 Keep practicing! Every expert was once a beginner!"
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-1000">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 animate-in slide-in-from-top duration-500">Quiz Results</h2>
      </div>

      {/* Two-column layout */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Stats and Score */}
        <div className="flex flex-col space-y-6">
          {/* Animated score circle */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
              <div className="absolute inset-0">
                <Progress 
                  value={animatedScore} 
                  className="w-full h-full rounded-full transform rotate-90"
                />
              </div>
              <div className={cn(
                "text-4xl font-bold transition-all duration-500",
                getScoreColor(),
                animatedScore === score && "scale-110"
              )}>
                {animatedScore}%
              </div>
            </div>

            <p className="text-lg mb-4 animate-in slide-in-from-bottom duration-700 delay-300">
              {getPerformanceMessage()}
            </p>

            {/* Score badge */}
            <div className={cn(
              "inline-flex items-center px-4 py-2 rounded-full border-2 font-medium animate-in zoom-in duration-500 delay-500",
              badge.color
            )}>
              <span className="text-2xl mr-2">{badge.emoji}</span>
              {badge.text}
            </div>
          </div>

          {/* Performance message */}
          {isPerfectScore ? (
            <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg animate-in slide-in-from-bottom duration-700 delay-700">
              <div className="flex items-center justify-center">
                <Trophy className="w-6 h-6 mr-2" />
                <span className="font-bold">Perfect score! You're a civic champion! 🎉</span>
              </div>
            </div>
          ) : score >= 70 ? (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg animate-in slide-in-from-bottom duration-700 delay-700">
              Great job! You've mastered this topic! 👏
            </div>
          ) : score >= 50 ? (
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg animate-in slide-in-from-bottom duration-700 delay-700">
              Good effort! Review the questions you missed and try again.
            </div>
          ) : (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg animate-in slide-in-from-bottom duration-700 delay-700">
              Keep learning! Review the material and try again.
            </div>
          )}

          {/* Stats section */}
          {showStats && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom duration-500 delay-1000">
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-sm font-medium">Avg Time</span>
                </div>
                <div className="text-xl font-bold text-blue-600 text-center">{formatTime(averageTime)}</div>
              </div>
              
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 mr-2 text-orange-600" />
                  <span className="text-sm font-medium">Fastest</span>
                </div>
                <div className="text-xl font-bold text-orange-600 text-center">{formatTime(fastestAnswer)}</div>
              </div>
              
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 mr-2 text-green-600" />
                  <span className="text-sm font-medium">Best Streak</span>
                </div>
                <div className="text-xl font-bold text-green-600 text-center">{streak}</div>
              </div>
              
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="text-sm font-medium">Total Time</span>
                </div>
                <div className="text-xl font-bold text-purple-600 text-center">{formatTime(totalTime)}</div>
              </div>
            </div>
          )}

          {/* Social share */}
          <div className="flex justify-center animate-in slide-in-from-bottom duration-500 delay-1200">
            <SocialShare title={topicTitle} score={score} totalQuestions={totalQuestions} />
          </div>

          {/* Finish button */}
          <div className="animate-in slide-in-from-bottom duration-500 delay-1500">
            <Button onClick={onFinish} className="w-full rounded-xl transition-all duration-200 hover:scale-105">
              Complete Quiz
            </Button>
          </div>
        </div>

        {/* Right Column: Question Summary */}
        <div className="flex flex-col min-h-0">
          <h3 className="font-semibold mb-4 animate-in slide-in-from-left duration-500 delay-500">Question Summary</h3>
          <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find((a) => a.questionId === question.question_number)
              const isCorrect = userAnswer?.isCorrect || false
              const selectedAnswer = userAnswer?.answer || ""
              const timeSpent = userAnswer?.timeSpent || 0

              return (
                <div 
                  key={question.question_number} 
                  className="border rounded-lg overflow-hidden animate-in slide-in-from-right duration-300"
                  style={{ animationDelay: `${index * 50 + 800}ms` }}
                >
                  <div className="p-4 bg-card">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 animate-in zoom-in duration-300" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 animate-in zoom-in duration-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm leading-relaxed">{question.question}</p>
                          <div className="flex items-center text-xs text-muted-foreground ml-4 flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(timeSpent)}
                          </div>
                        </div>

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
                              <p className="text-red-600 dark:text-red-400 mb-1">
                                <span className="font-medium">Your answer:</span>{" "}
                                {question.question_type === "multiple_choice"
                                  ? getSelectedAnswerText(question, selectedAnswer)
                                  : selectedAnswer || "(no answer)"}
                              </p>
                              <p className="text-green-600 dark:text-green-400">
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
                          <p className="leading-relaxed">{question.explanation}</p>
                        </div>

                        {/* Integrated sources */}
                        {question.sources.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-2">📚 Learn more:</p>
                            <div className="space-y-1">
                              {question.sources.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-xs text-primary hover:underline transition-all duration-200 hover:scale-105"
                                >
                                  <span className="truncate">{source.name}</span>
                                  <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Question Feedback Component */}
                        <div className="mt-4">
                          <QuestionFeedback 
                            questionId={question.question_number?.toString() || `${question.question_number}`}
                            questionText={question.question}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
