"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ExternalLink, Trophy, Target, Clock, Zap, Eye, EyeOff, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react"
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
import { usePremium } from "@/hooks/usePremium"
import { useAnalytics } from "@/utils/analytics"
import { useTopicTitle } from "@/hooks/useTopicTitle"

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
  resumedAttemptId?: string | null
}

// Memoized components for performance
const MemoizedScoreDisplay = memo(({ 
  animatedScore, 
  score, 
  badge 
}: { 
  animatedScore: number
  score: number
  badge: { text: string; emoji: string; color: string }
}) => {
  const getScoreColor = useCallback(() => {
    if (score >= 90) return "text-green-600 dark:text-green-400"
    if (score >= 80) return "text-blue-600 dark:text-blue-400"
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }, [score])

  return (
    <>
      <div className="relative inline-flex items-center justify-center w-32 h-32 animate-in zoom-in duration-500">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(animatedScore / 100) * 377} 377`}
            className={cn("transition-all duration-1000 ease-out", getScoreColor())}
          />
        </svg>
        <div className={cn(
          "text-4xl font-light transition-all duration-500",
          getScoreColor(),
          animatedScore === score && "scale-110"
        )}>
          {animatedScore}%
        </div>
      </div>
    </>
  )
})

MemoizedScoreDisplay.displayName = 'MemoizedScoreDisplay'

const MemoizedStatCard = memo(({ 
  icon, 
  label, 
  value, 
  delay = 0 
}: { 
  icon: string
  label: string
  value: string | number
  delay?: number
}) => (
  <div 
    className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center transition-all hover:scale-105 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">{label}</div>
    <div className="text-lg font-medium text-slate-900 dark:text-slate-50">{value}</div>
  </div>
))

MemoizedStatCard.displayName = 'MemoizedStatCard'

const MemoizedQuestionReview = memo(({ 
  question, 
  userAnswer, 
  index,
  showExplanations,
  topicId,
  formatTime,
  getSelectedAnswerText
}: {
  question: QuizQuestion
  userAnswer: UserAnswer | undefined
  index: number
  showExplanations: boolean
  topicId: string
  formatTime: (seconds: number) => string
  getSelectedAnswerText: (question: QuizQuestion, answerKey: string) => string
}) => {
  const isCorrect = userAnswer?.isCorrect || false
  const selectedAnswer = userAnswer?.answer || ""
  const timeSpent = userAnswer?.timeSpent || 0
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div 
      className={cn(
        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 transition-all duration-300",
        "hover:shadow-lg animate-in fade-in slide-in-from-bottom-4",
        isExpanded && "scale-[1.02]"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Question number with enhanced styling */}
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 text-sm font-bold transition-all duration-300",
          isCorrect 
            ? "bg-green-500 border-green-500 text-white animate-in zoom-in duration-300" 
            : "bg-red-500 border-red-500 text-white animate-in zoom-in duration-300 animate-pulse"
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

          {/* Answer feedback with smooth transitions */}
          <div className="space-y-2 mb-4">
            {isCorrect ? (
              <p className="text-green-600 dark:text-green-400 text-sm animate-in fade-in duration-300">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                <span className="font-medium">Your answer:</span>{" "}
                <span className="font-semibold">
                  {question.question_type === "multiple_choice"
                    ? getSelectedAnswerText(question, selectedAnswer)
                    : selectedAnswer}
                </span>
              </p>
            ) : (
              <>
                <p className="text-red-600 dark:text-red-400 text-sm animate-in fade-in duration-300">
                  <XCircle className="inline h-4 w-4 mr-1" />
                  <span className="font-medium">Your answer:</span>{" "}
                  <span className="line-through opacity-75">
                    {question.question_type === "multiple_choice"
                      ? getSelectedAnswerText(question, selectedAnswer)
                      : selectedAnswer || "(no answer)"}
                  </span>
                </p>
                <p className="text-green-600 dark:text-green-400 text-sm animate-in fade-in duration-300 delay-100">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  <span className="font-medium">Correct answer:</span>{" "}
                  <span className="font-semibold">
                    {question.question_type === "multiple_choice"
                      ? getSelectedAnswerText(question, question.correct_answer)
                      : question.correct_answer}
                  </span>
                </p>
              </>
            )}
          </div>

          {/* Explanation with smooth expand/collapse */}
          {showExplanations && (
            <div 
              className={cn(
                "overflow-hidden transition-all duration-500",
                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm mb-4">
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                  {question.explanation}
                </p>
              </div>

              {/* Sources using SourceMetadataCard */}
              {question.sources.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-mono font-medium text-slate-900 dark:text-slate-50 mb-3">
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
            </div>
          )}

          {/* Expand/Collapse button */}
          {showExplanations && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
            >
              {isExpanded ? "Hide details" : "Show details"}
              <Sparkles className="h-3 w-3 ml-1" />
            </Button>
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
})

MemoizedQuestionReview.displayName = 'MemoizedQuestionReview'

export function QuizResults({ 
  userAnswers, 
  questions, 
  onFinish, 
  topicId,
  resumedAttemptId
}: QuizResultsProps) {
  const { user } = useAuth()
  const { isPremium, isPro } = usePremium()
  const { trackQuiz } = useAnalytics()
  const { topicTitle, setTopicTitle } = useTopicTitle(topicId)
  const { progress, refreshProgress } = useGamification()
  const [showStats, setShowStats] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; xpGained: number } | undefined>(undefined)
  const [showAchievements, setShowAchievements] = useState(false)
  const [progressUpdated, setProgressUpdated] = useState(false)
  const [showExplanations, setShowExplanations] = useState(true)
  const [xpGained, setXpGained] = useState(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoized calculations
  const { correctAnswers, totalQuestions, score, isPerfectScore } = useMemo(() => {
    const correct = userAnswers.filter((answer) => answer.isCorrect).length
    const total = questions.length
    const scorePercent = Math.round((correct / total) * 100)
    return {
      correctAnswers: correct,
      totalQuestions: total,
      score: scorePercent,
      isPerfectScore: correct === total
    }
  }, [userAnswers, questions])

  // Memoized stats calculations
  const { averageTime, fastestAnswer, streak, totalTime } = useMemo(() => {
    const times = userAnswers.map(a => a.timeSpent)
    const total = times.reduce((sum, time) => sum + time, 0)
    const avg = Math.round(total / userAnswers.length)
    const fastest = Math.min(...times)
    
    // Calculate longest streak
    let maxStreak = 0
    let currentStreak = 0
    userAnswers.forEach(answer => {
      if (answer.isCorrect) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })
    
    return {
      averageTime: avg,
      fastestAnswer: fastest,
      streak: maxStreak,
      totalTime: total
    }
  }, [userAnswers])

  // Memoized helper functions
  const formatTime = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }, [])

  const getSelectedAnswerText = useCallback((question: QuizQuestion, answerKey: string): string => {
    const optionMap: Record<string, string> = {
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
    }
    return optionMap[answerKey] || answerKey
  }, [])

  const getScoreBadge = useCallback(() => {
    if (score >= 90) return { text: "Excellent!", emoji: "🏆", color: "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" }
    if (score >= 80) return { text: "Great Job!", emoji: "🎉", color: "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" }
    if (score >= 70) return { text: "Good Work!", emoji: "👍", color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" }
    return { text: "Keep Trying!", emoji: "💪", color: "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" }
  }, [score])

  const getPerformanceMessage = useCallback(() => {
    if (score >= 90) return "Outstanding performance! You've mastered this topic! 🌟"
    if (score >= 80) return "Excellent work! You have a strong understanding! 🎯"
    if (score >= 70) return "Good job! You're on the right track! 📈"
    return "Keep studying! Practice makes perfect! 💪"
  }, [score])

  const badge = getScoreBadge()

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

  // Debounced save quiz results
  const saveQuizResults = useCallback(async () => {
    if (!user || progressUpdated) return

    try {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Debounce the save operation
      saveTimeoutRef.current = setTimeout(async () => {
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
          })),
          attemptId: resumedAttemptId // Add the attemptId if it exists
        }

        // Save to database
        const savedAttempt = await quizDatabase.saveQuizAttempt(quizAttemptData)
        console.log('Quiz attempt saved to database:', savedAttempt.id)

        // Also save to localStorage as backup/cache
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
        
        // Keep only the last 50 results
        if (savedResults.length > 50) {
          savedResults.splice(0, savedResults.length - 50)
        }
        
        localStorage.setItem(resultsKey, JSON.stringify(savedResults))

        // Clear any partial quiz state
        quizDatabase.clearPartialQuizState(user.id, topicId)

        console.log('💾 Quiz results saved')

        // Refresh gamification progress
        if (refreshProgress) {
          await refreshProgress()
        }

        setProgressUpdated(true)

        // Show achievements after a delay
        setTimeout(() => {
          if (progress?.currentStreak && progress.currentStreak > 0) {
            console.log('🎮 Updated gamification stats available')
          }
        }, 3000)

      }, 500) // 500ms debounce

    } catch (error) {
      console.error('Error saving quiz results:', error)
      setProgressUpdated(true)
    }
  }, [user, progressUpdated, topicId, topicTitle, totalQuestions, correctAnswers, score, totalTime, userAnswers, refreshProgress, progress, resumedAttemptId])

  // Save quiz results
  useEffect(() => {
    saveQuizResults()
    
    // Simulate XP gained (10 XP per correct answer)
    setXpGained(correctAnswers * 10)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [saveQuizResults, correctAnswers])

  // Optimized score animation with requestAnimationFrame
  useEffect(() => {
    const duration = 2000
    const startTime = Date.now()
    const startValue = 0
    const endValue = score

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart)
      
      setAnimatedScore(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setShowStats(true)
        
        // Trigger confetti for good scores
        if (score >= 80) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            })
          }, 300)
        }
      }
    }

    requestAnimationFrame(animate)
  }, [score])

  // Optimized confetti effect for perfect scores
  useEffect(() => {
    if (!isPerfectScore || animatedScore !== score) return

    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      // Shoot confetti from different sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [isPerfectScore, animatedScore, score])

  const handleCloseAchievements = useCallback(() => {
    setShowAchievements(false)
    setNewAchievements([])
    setLevelUpInfo(undefined)
  }, [])

  // Get a witty completion message based on score
  const getCompletionMessage = useCallback(() => {
    if (score >= 90) return "Knowledge Unlocked! 🧠"
    if (score >= 80) return "Civic Mission Accomplished! 🎯"
    if (score >= 70) return "Democracy Defended! 🛡️"
    if (score >= 60) return "Civic Journey Complete! 🚀"
    return "Civic Quest Completed! 🔍"
  }, [score])

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Clean header with lots of whitespace */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
            {getCompletionMessage()}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
            {topicTitle}
          </p>
        </div>

        {/* Score Display - Clean Design */}
        <div className="text-center space-y-8">
          <MemoizedScoreDisplay 
            animatedScore={animatedScore} 
            score={score} 
            badge={badge} 
          />
          
          <div className={cn(
            "inline-flex items-center px-6 py-3 rounded-full border-2 font-medium text-lg transition-all duration-500 hover:scale-105",
            badge.color,
            "animate-in slide-in-from-bottom-4 duration-700 delay-300"
          )}>
            <span className="text-2xl mr-3 animate-bounce">{badge.emoji}</span>
            {badge.text}
          </div>

          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto font-light">
            {getPerformanceMessage()}
          </p>
        </div>

        {/* Stats Cards - Enhanced with staggered animations */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MemoizedStatCard 
              icon="⏱️" 
              label="Avg Time" 
              value={formatTime(averageTime)} 
              delay={0}
            />
            <MemoizedStatCard 
              icon="⚡" 
              label="Fastest" 
              value={formatTime(fastestAnswer)} 
              delay={100}
            />
            <MemoizedStatCard 
              icon="🔥" 
              label="Global Streak" 
              value={progress?.currentStreak || 0} 
              delay={200}
            />
            <MemoizedStatCard 
              icon="✨" 
              label="XP Earned" 
              value={`+${xpGained}`} 
              delay={300}
            />
          </div>
        )}

        {/* Question Review */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-light text-slate-900 dark:text-slate-50">
              Question Review
              <span className="ml-2 text-sm font-mono text-slate-500 dark:text-slate-400">
                ({correctAnswers}/{totalQuestions} correct)
              </span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanations(!showExplanations)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              {showExplanations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showExplanations ? 'Hide' : 'Show'} Explanations</span>
            </Button>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find((a) => a.questionId === question.question_number)
              
              return (
                <MemoizedQuestionReview
                  key={question.question_number}
                  question={question}
                  userAnswer={userAnswer}
                  index={index}
                  showExplanations={showExplanations}
                  topicId={topicId}
                  formatTime={formatTime}
                  getSelectedAnswerText={getSelectedAnswerText}
                />
              )
            })}
          </div>
        </div>

        {/* Premium Data Teaser */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PremiumDataTeaser 
            variant="banner"
            className="mb-6"
          />
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <SocialShare title={topicTitle} score={score} totalQuestions={totalQuestions} />
          </div>

          <Button 
            onClick={onFinish} 
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white h-12 text-lg font-light transition-all hover:scale-[1.02]"
          >
            Return to Dashboard
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