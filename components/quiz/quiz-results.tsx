"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ExternalLink, Trophy, Target, Clock, Zap, Eye, EyeOff } from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect, useState } from "react"
import { SocialShare } from "@/components/social-share"
import { dataService } from "@/lib/data-service"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { QuestionFeedback } from "./question-feedback"
import { AchievementNotification } from "@/components/achievement-notification"
import { useAuth } from "@/components/auth/auth-provider"
import { updateEnhancedProgress, type Achievement } from "@/lib/enhanced-gamification"
import { quizDatabase, type QuizAttemptData } from "@/lib/quiz-database"
import { useGamification } from "@/hooks/useGamification"
import { progressiveXpOperations } from "@/lib/enhanced-gamification"
import { PremiumDataTeaser } from "@/components/premium-data-teaser"
import { SourceMetadataCard } from "@/components/source-metadata-card"


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
  const { user } = useAuth()
  const { progress, refreshProgress } = useGamification()
  const correctAnswers = userAnswers.filter((answer) => answer.isCorrect).length
  const totalQuestions = questions.length
  const score = Math.round((correctAnswers / totalQuestions) * 100)
  const isPerfectScore = correctAnswers === totalQuestions
  const [topicTitle, setTopicTitle] = useState("Civic Quiz")
  const [showStats, setShowStats] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; xpGained: number } | undefined>(undefined)
  const [showAchievements, setShowAchievements] = useState(false)
  const [progressUpdated, setProgressUpdated] = useState(false)
  const [showExplanations, setShowExplanations] = useState(true)

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

  // Save quiz results and update progress
  useEffect(() => {
    const saveQuizAndUpdateProgress = async () => {
      if (!user || progressUpdated) return

      try {
        // Prepare quiz attempt data for database
        const quizAttemptData: QuizAttemptData = {
          userId: user.id,
          topicId,
          topicTitle,
          totalQuestions,
          correctAnswers,
          score,
          timeSpentSeconds: totalTime,
          userAnswers: userAnswers.map(answer => ({
            questionId: answer.questionId,
            answer: answer.answer,
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent
          }))
        }

        // Save to database (this also updates user progress)
        const savedAttempt = await quizDatabase.saveQuizAttempt(quizAttemptData)
        console.log('Quiz attempt saved to database:', savedAttempt.id)

        // Also save to localStorage as backup/cache for dashboard
        const quizResult = {
          topicId,
          topicTitle,
          totalQuestions,
          correctAnswers,
          score,
          timeSpent: totalTime,
          completedAt: new Date().toISOString(),
          userAnswers: userAnswers.map(answer => ({
            questionId: answer.questionId,
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent
          }))
        }

        const resultsKey = `civicAppQuizResults_${user.id}_v1`
        const existingResults = localStorage.getItem(resultsKey)
        const savedResults = existingResults ? JSON.parse(existingResults) : []
        savedResults.push(quizResult)
        
        // Keep only the last 50 results to prevent localStorage bloat
        if (savedResults.length > 50) {
          savedResults.splice(0, savedResults.length - 50)
        }
        
        localStorage.setItem(resultsKey, JSON.stringify(savedResults))

        // Clear any partial quiz state since we completed it
        quizDatabase.clearPartialQuizState(user.id, topicId)

        // Note: Enhanced gamification progress is now handled in the QuizEngine component
        // to avoid double-processing. The quiz engine calls updateProgress before showing results.
        console.log('💾 Quiz results saved to database and localStorage')

        // Refresh gamification progress to get updated stats
        if (refreshProgress) {
          await refreshProgress()
        }

        setProgressUpdated(true)

        // Show achievements after a delay to let the score animation finish
        setTimeout(() => {
          // Check if we have any new achievements from the progress data
          if (progress?.currentStreak && progress.currentStreak > 0) {
            // This could trigger achievement notifications based on updated progress
            console.log('🎮 Updated gamification stats available')
          }
        }, 3000)

      } catch (error) {
        console.error('Error updating enhanced progress:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          userId: user.id,
          topicId
        })
        setProgressUpdated(true) // Don't retry on error
      }
    }

    saveQuizAndUpdateProgress()
  }, [user, topicId, topicTitle, correctAnswers, totalQuestions, totalTime, isPerfectScore, userAnswers, questions, progressUpdated])

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
        
        // Trigger confetti for good scores
        if (score >= 80) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            })
          }, 500)
        }
      } else {
        setAnimatedScore(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  // Confetti effect for perfect scores
  useEffect(() => {
    if (isPerfectScore && animatedScore === score) {
      const duration = 3000
      const end = Date.now() + duration

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = end - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.3),
            y: Math.random() - 0.2
          }
        })
        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.7, 0.9),
            y: Math.random() - 0.2
          }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isPerfectScore, animatedScore, score])

  const getSelectedAnswerText = (question: QuizQuestion, answerKey: string): string => {
    const optionMap: Record<string, string> = {
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
    }
    return optionMap[answerKey] || answerKey
  }

  const getScoreColor = () => {
    if (score >= 90) return "text-green-600 dark:text-green-400"
    if (score >= 80) return "text-blue-600 dark:text-blue-400"
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBadge = () => {
    if (score >= 90) return { text: "Excellent!", emoji: "🏆", color: "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" }
    if (score >= 80) return { text: "Great Job!", emoji: "🎉", color: "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" }
    if (score >= 70) return { text: "Good Work!", emoji: "👍", color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" }
    return { text: "Keep Trying!", emoji: "💪", color: "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" }
  }

  const badge = getScoreBadge()

  const getPerformanceMessage = () => {
    if (score >= 90) return "Outstanding performance! You've mastered this topic! 🌟"
    if (score >= 80) return "Excellent work! You have a strong understanding! 🎯"
    if (score >= 70) return "Good job! You're on the right track! 📈"
    return "Keep studying! Practice makes perfect! 💪"
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const handleCloseAchievements = () => {
    setShowAchievements(false)
    setNewAchievements([])
    setLevelUpInfo(undefined)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-light text-slate-900 dark:text-slate-50">
            Quiz Complete! 🎉
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {topicTitle}
          </p>
        </div>

        {/* Score Display - Clean Design */}
        <div className="text-center space-y-6">
          <div className="relative inline-flex items-center justify-center w-32 h-32">
            <div className="absolute inset-0">
              <Progress 
                value={animatedScore} 
                className="w-full h-full rounded-full"
              />
            </div>
            <div className={cn(
              "text-4xl font-light transition-all duration-500",
              getScoreColor(),
              animatedScore === score && "scale-110"
            )}>
              {animatedScore}%
            </div>
          </div>

          <div className={cn(
            "inline-flex items-center px-6 py-3 rounded-full border-2 font-medium text-lg",
            badge.color
          )}>
            <span className="text-2xl mr-3">{badge.emoji}</span>
            {badge.text}
          </div>

          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {getPerformanceMessage()}
          </p>
        </div>

        {/* Stats Cards - Enhanced with gamification data */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-2xl mb-2">⏱️</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Time</div>
              <div className="text-lg font-medium text-slate-900 dark:text-slate-50">{formatTime(averageTime)}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Fastest</div>
              <div className="text-lg font-medium text-slate-900 dark:text-slate-50">{formatTime(fastestAnswer)}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Global Streak</div>
              <div className="text-lg font-medium text-slate-900 dark:text-slate-50">{progress?.currentStreak || 0}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-2xl mb-2">🎚️</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Level</div>
              <div className="text-lg font-medium text-slate-900 dark:text-slate-50">{progress?.currentLevel || 1}</div>
            </div>
          </div>
        )}

        {/* Question Review */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium text-slate-900 dark:text-slate-50">
              Question Review ({correctAnswers}/{totalQuestions} correct)
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanations(!showExplanations)}
              className="flex items-center space-x-2"
            >
              {showExplanations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-sm">
                {showExplanations ? 'Hide' : 'Show'} Explanations
              </span>
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find((a) => a.questionId === question.question_number)
              const isCorrect = userAnswer?.isCorrect || false
              const selectedAnswer = userAnswer?.answer || ""
              const timeSpent = userAnswer?.timeSpent || 0

              return (
                <div 
                  key={question.question_number} 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Question number with keyboard shortcut styling */}
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 text-sm font-bold",
                      isCorrect 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "bg-red-500 border-red-500 text-white"
                    )}>
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-medium text-slate-900 dark:text-slate-50 leading-relaxed">
                          {question.question}
                        </p>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 ml-4 flex-shrink-0">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(timeSpent)}
                        </div>
                      </div>

                      {/* Answer feedback */}
                      <div className="space-y-2 mb-4">
                        {isCorrect ? (
                          <p className="text-green-600 dark:text-green-400 text-sm">
                            <span className="font-medium">Your answer:</span>{" "}
                            {question.question_type === "multiple_choice"
                              ? getSelectedAnswerText(question, selectedAnswer)
                              : selectedAnswer}
                          </p>
                        ) : (
                          <>
                            <p className="text-red-600 dark:text-red-400 text-sm">
                              <span className="font-medium">Your answer:</span>{" "}
                              {question.question_type === "multiple_choice"
                                ? getSelectedAnswerText(question, selectedAnswer)
                                : selectedAnswer || "(no answer)"}
                            </p>
                            <p className="text-green-600 dark:text-green-400 text-sm">
                              <span className="font-medium">Correct answer:</span>{" "}
                              {question.question_type === "multiple_choice"
                                ? getSelectedAnswerText(question, question.correct_answer)
                                : question.correct_answer}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Explanation */}
                      {showExplanations && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm mb-4">
                          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                            {question.explanation}
                          </p>
                        </div>
                      )}

                      {/* Sources using SourceMetadataCard */}
                      {showExplanations && question.sources.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">
                            📚 Learn more:
                          </p>
                          <div className="space-y-3">
                            {question.sources.map((source, idx) => (
                              <SourceMetadataCard
                                key={idx}
                                source={source}
                                showThumbnail={true}
                                compact={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Question Feedback */}
                      <QuestionFeedback 
                        questionId={question.question_number?.toString() || `${question.question_number}`}
                        questionText={question.question}
                        topicId={topicId}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Premium Data Teaser */}
        <PremiumDataTeaser 
          variant="banner"
          className="mb-6"
        />

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <SocialShare title={topicTitle} score={score} totalQuestions={totalQuestions} />
          </div>

          <Button 
            onClick={onFinish} 
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white h-12 text-lg"
          >
            Complete Quiz 🎉
          </Button>
        </div>
      </div>

      {/* Achievement Notifications */}
      {showAchievements && (
        <AchievementNotification
          achievements={newAchievements}
          levelUpInfo={levelUpInfo}
          isOpen={showAchievements}
          onClose={handleCloseAchievements}
        />
      )}
    </div>
  )
}
