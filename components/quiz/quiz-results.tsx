"use client"

import type { QuizQuestion } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ExternalLink, Trophy, Target, Clock, Zap, Eye, EyeOff, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react"
import { SocialShare } from "@/components/social-share"
import { EnhancedSocialShare } from "@/components/enhanced-social-share"
import { dataService } from "@/lib/data-service"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { QuestionFeedback } from "./question-feedback"
import { AchievementNotification } from "@/components/achievement-notification"
import { useAuth } from "@/components/auth/auth-provider"
import { updateEnhancedProgress, type Achievement } from "@/lib/enhanced-gamification"
import { enhancedQuizDatabase, type EnhancedQuizAttemptData } from "@/lib/quiz-database"
import { useGamification } from "@/hooks/useGamification"
import { progressiveXpOperations } from "@/lib/enhanced-gamification"
import { PremiumDataTeaser } from "@/components/premium-data-teaser"
import { SourceMetadataCard } from "@/components/source-metadata-card"
import { usePremium } from "@/hooks/usePremium"
import { useAnalytics } from "@/utils/analytics"
import { useTopicTitle } from "@/hooks/useTopicTitle"
import { skillOperations } from "@/lib/skill-operations"

interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  timeSpent: number
  hintUsed?: boolean
  boostUsed?: string | null
}

interface QuizResultsProps {
  userAnswers: UserAnswer[]
  questions: QuizQuestion[]
  onFinish: () => void
  topicId: string
  resumedAttemptId?: string | null
}

// Memoized components for performance (keeping existing ones)
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

  const getBadgeTextColor = () => {
    if (score >= 90) return "text-green-700 dark:text-green-300"
    if (score >= 80) return "text-blue-700 dark:text-blue-300"
    if (score >= 70) return "text-yellow-700 dark:text-yellow-300"
    return "text-red-700 dark:text-red-300"
  }

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
      <div className={cn(
        "mt-6 text-2xl font-bold flex items-center justify-center gap-2",
        getBadgeTextColor()
      )}>
        <span className="animate-bounce">{badge.emoji}</span>
        <span>{badge.text}</span>
      </div>
    </>
  )
})

MemoizedScoreDisplay.displayName = 'MemoizedScoreDisplay'

export function QuizResults({ 
  userAnswers, 
  questions, 
  onFinish, 
  topicId,
  resumedAttemptId
}: QuizResultsProps) {
  const { user } = useAuth()
  const { isPremium, isPro, hasFeatureAccess } = usePremium()
  const { trackQuiz } = useAnalytics()
  const { topicTitle, setTopicTitle } = useTopicTitle(topicId)
  const { progress, refreshProgress } = useGamification()
  
  // State management
  const [showStats, setShowStats] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; xpGained: number } | undefined>(undefined)
  const [showAchievements, setShowAchievements] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'idle'>('idle')
  const [showExplanations, setShowExplanations] = useState(true)
  const [xpGained, setXpGained] = useState(0)
  const [analyticsCreated, setAnalyticsCreated] = useState(false)
  
  // Refs for cleanup
  const savePromiseRef = useRef<Promise<void> | null>(null)
  const hasSavedRef = useRef(false)

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

  // Enhanced session analysis for premium users
  const sessionAnalysis = useMemo(() => {
    if (!hasFeatureAccess('advanced_analytics')) {
      return null
    }

    // Calculate category performance
    const categoryPerformance: Record<string, { correct: number; total: number; avgTime: number }> = {}
    
    userAnswers.forEach((answer, index) => {
      const question = questions[index]
      const category = question?.category || 'General'
      
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = { correct: 0, total: 0, avgTime: 0 }
      }
      
      categoryPerformance[category].total += 1
      if (answer.isCorrect) {
        categoryPerformance[category].correct += 1
      }
      categoryPerformance[category].avgTime += answer.timeSpent
    })

    // Calculate averages
    Object.keys(categoryPerformance).forEach(category => {
      const data = categoryPerformance[category]
      data.avgTime = data.avgTime / data.total
    })

    // Determine time pattern
    const currentHour = new Date().getHours()
    const timePattern = currentHour < 12 ? 'morning' : 
                       currentHour < 17 ? 'afternoon' : 
                       currentHour < 21 ? 'evening' : 'night'

    // Calculate improvement trend (simplified - would use historical data)
    const improvementTrend = score >= 80 ? 0.1 : score >= 60 ? 0.05 : -0.05

    // Calculate consistency score
    const timeVariance = userAnswers.reduce((acc, answer) => {
      const diff = answer.timeSpent - averageTime
      return acc + (diff * diff)
    }, 0) / userAnswers.length
    const consistencyScore = Math.max(0, 1 - (Math.sqrt(timeVariance) / averageTime))

    return {
      categoryPerformance,
      timePattern: timePattern as 'morning' | 'afternoon' | 'evening' | 'night',
      improvementTrend,
      consistencyScore
    }
  }, [userAnswers, questions, averageTime, score, hasFeatureAccess])

  // Helper functions
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
  }, [topicId, setTopicTitle])

  // Enhanced save quiz results function
  const saveQuizResults = useCallback(async () => {
    if (!user || hasSavedRef.current) {
      return
    }

    hasSavedRef.current = true
    setSaveStatus('saving')
    
    try {
      console.log('💾 Starting enhanced quiz save...')
      
      // Prepare enhanced quiz attempt data
      const enhancedAttemptData: EnhancedQuizAttemptData = {
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
          timeSpent: answer.timeSpent,
          hintUsed: answer.hintUsed || false,
          boostUsed: answer.boostUsed || null
        })),
        attemptId: resumedAttemptId,
        sessionData: sessionAnalysis ? {
          difficultyDistribution: { easy: 0, medium: 0, hard: 0 }, // Would be calculated from question data
          categoryPerformance: sessionAnalysis.categoryPerformance,
          timePattern: sessionAnalysis.timePattern,
          improvementTrend: sessionAnalysis.improvementTrend,
          consistencyScore: sessionAnalysis.consistencyScore
        } : undefined
      }

      // Save to enhanced database
      const saveResult = await enhancedQuizDatabase.saveEnhancedQuizAttempt(enhancedAttemptData)
      
      console.log('✅ Enhanced quiz save completed:', {
        attemptId: saveResult.attemptId,
        analyticsCreated: saveResult.analyticsCreated,
        progressUpdated: saveResult.progressUpdated
      })

      setAnalyticsCreated(saveResult.analyticsCreated)
      setSaveStatus('saved')

      // Also update skill progress for this quiz
      try {
        const questionResponses = userAnswers.map(answer => {
          const question = questions.find(q => q.question_number === answer.questionId)
          return {
            questionId: answer.questionId.toString(),
            category: question?.category || 'General',
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent
          }
        })
        
        // Update skill progress
        const skillResults = await enhancedQuizDatabase.updateSkillProgress(
          user.id,
          questionResponses
        )
        
        // If any skills had mastery changes, let's add them to achievements
        const masteryChanges = skillResults.masteryChanges
        if (Object.keys(masteryChanges).length > 0) {
          const newSkillAchievements = await Promise.all(
            Object.entries(masteryChanges).map(async ([skillId, change]) => {
              // Only recognize upgrades, not downgrades
              if (change.from < change.to) {
                // Get the skill name
                const skill = await skillOperations.getSkillBySlug(skillId)
                return {
                  skillId,
                  skillName: skill?.skill_name || 'Skill',
                  oldMastery: change.from,
                  newMastery: change.to
                }
              }
              return null
            })
          ).then(results => results.filter(Boolean))
          
          if (newSkillAchievements.length > 0) {
            // Convert to proper Achievement format
            const skillAchievements: Achievement[] = newSkillAchievements.map(achievement => ({
              id: `skill-${achievement?.skillId}`,
              type: 'skill_mastery',
              data: {
                skillId: achievement?.skillId,
                skillName: achievement?.skillName,
                oldMastery: achievement?.oldMastery,
                newMastery: achievement?.newMastery
              },
              earnedAt: new Date().toISOString(),
              isMilestone: true,
              title: `${achievement?.newMastery} ${achievement?.skillName}`,
              description: `You've reached ${achievement?.newMastery} mastery in ${achievement?.skillName}!`,
              emoji: '🌟'
            } as Achievement))
            
            setNewAchievements(prev => [...prev, ...skillAchievements])
          }
        }
      } catch (skillError) {
        console.error('Error updating skill progress:', skillError)
      }

      // Also save to localStorage as backup/cache (simplified version)
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

      const resultsKey = `civicAppQuizResults_${user.id}_v2` // v2 for enhanced version
      const existingResults = localStorage.getItem(resultsKey)
      const savedResults = existingResults ? JSON.parse(existingResults) : []
      savedResults.push(quizResult)
      
      // Keep only the last 50 results
      if (savedResults.length > 50) {
        savedResults.splice(0, savedResults.length - 50)
      }
      
      localStorage.setItem(resultsKey, JSON.stringify(savedResults))

      // Clear any partial quiz state
      const partialKey = `civicAppPartialQuiz_${user.id}_${topicId}`
      localStorage.removeItem(partialKey)

      // Refresh gamification progress
      if (refreshProgress) {
        await refreshProgress()
      }

      // Calculate XP gained
      const baseXp = correctAnswers * 10
      const timeBonus = totalTime < (totalQuestions * 30) ? Math.floor(correctAnswers * 2) : 0 // Bonus for speed
      const perfectBonus = isPerfectScore ? 20 : 0
      setXpGained(baseXp + timeBonus + perfectBonus)

      console.log('🎮 Quiz save completed successfully')

    } catch (error) {
      console.error('❌ Enhanced quiz save failed:', error)
      setSaveStatus('error')
      
      // Fallback to basic localStorage save
      try {
        const fallbackResult = {
          topicId,
          topicTitle,
          score,
          completedAt: new Date().toISOString(),
          error: 'Database save failed'
        }
        localStorage.setItem(`civicAppQuizFallback_${user.id}_${Date.now()}`, JSON.stringify(fallbackResult))
        console.log('💾 Fallback save completed')
      } catch (fallbackError) {
        console.error('❌ Even fallback save failed:', fallbackError)
      }
    }
  }, [
    user, 
    topicId, 
    topicTitle, 
    totalQuestions, 
    correctAnswers, 
    score, 
    totalTime, 
    userAnswers, 
    resumedAttemptId, 
    sessionAnalysis, 
    refreshProgress,
    isPerfectScore
  ])

  // Save quiz results on mount
  useEffect(() => {
    if (user && !hasSavedRef.current) {
      // Create a promise and store it
      const savePromise = saveQuizResults()
      savePromiseRef.current = savePromise
      
      // Don't await here - let it run in background
      savePromise.catch(error => {
        console.error('Background save failed:', error)
      })
    }

    // Cleanup function
    return () => {
      if (savePromiseRef.current) {
        // The save is running, but we don't need to cancel it
        // Just clear the reference
        savePromiseRef.current = null
      }
    }
  }, [user, saveQuizResults])

  // Score animation (keeping existing logic)
  useEffect(() => {
    const duration = 2000
    const startTime = Date.now()
    const startValue = 0
    const endValue = score

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart)
      
      setAnimatedScore(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setShowStats(true)
        
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

  // Perfect score confetti
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

  const getCompletionMessage = useCallback(() => {
    if (score >= 90) return "Knowledge Unlocked! 🧠"
    if (score >= 80) return "Civic Mission Accomplished! 🎯"
    if (score >= 70) return "Democracy Defended! 🛡️"
    if (score >= 60) return "Civic Journey Complete! 🚀"
    return "Civic Quest Completed! 🔍"
  }, [score])

  // Render save status indicator
  const renderSaveStatus = () => {
    if (saveStatus === 'idle') return null
    
    return (
      <div className={cn(
        "fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        saveStatus === 'saving' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        saveStatus === 'saved' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        saveStatus === 'error' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      )}>
        {saveStatus === 'saving' && "💾 Saving results..."}
        {saveStatus === 'saved' && analyticsCreated && isPremium && "✅ Premium analytics saved"}
        {saveStatus === 'saved' && !analyticsCreated && "✅ Results saved"}
        {saveStatus === 'error' && "⚠️ Save failed (cached locally)"}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {renderSaveStatus()}
      
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

        {/* Score Display */}
        <div className="text-center space-y-8">
          <MemoizedScoreDisplay 
            animatedScore={animatedScore} 
            score={score} 
            badge={badge} 
          />
          
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto font-light">
            {getPerformanceMessage()}
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center transition-all hover:scale-105 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-lg mb-2">⏱️</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Time</div>
              <div className="text-lg font-medium text-slate-900 dark:text-slate-50">{formatTime(averageTime)}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center transition-all hover:scale-105 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
              <div className="text-lg mb-2">⚡</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Fastest</div>
              <div className="text-lg font-medium text-slate-900 dark:text-slate-50">{formatTime(fastestAnswer)}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center transition-all hover:scale-105 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
              <div className="text-lg mb-2">🔥</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Quiz Streak</div>
              <div className="text-lg font-medium text-slate-900 dark:text-slate-50">{streak}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center transition-all hover:scale-105 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
              <div className="text-lg mb-2">✨</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">XP Earned</div>
              <div className="text-lg font-medium text-slate-900 dark:text-slate-50">+{xpGained}</div>
            </div>
          </div>
        )}

        {/* Premium Analytics Preview */}
        {isPremium && analyticsCreated && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 animate-in fade-in duration-500">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                🎯 Premium Analytics Created
              </h3>
              <p className="text-purple-600 dark:text-purple-300 text-sm mb-4">
                Your detailed performance data has been analyzed and is available in your dashboard.
              </p>
              {sessionAnalysis && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-purple-800 dark:text-purple-200">Study Time</div>
                    <div className="text-purple-600 dark:text-purple-300 capitalize">{sessionAnalysis.timePattern}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-800 dark:text-purple-200">Consistency</div>
                    <div className="text-purple-600 dark:text-purple-300">{Math.round(sessionAnalysis.consistencyScore * 100)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-800 dark:text-purple-200">Categories</div>
                    <div className="text-purple-600 dark:text-purple-300">{Object.keys(sessionAnalysis.categoryPerformance).length} analyzed</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Question Review Section */}
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

          <div className="space-y-8">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find((a) => a.questionId === question.question_number)
              const isCorrect = userAnswer?.isCorrect || false
              const selectedAnswer = userAnswer?.answer || ""
              const timeSpent = userAnswer?.timeSpent || 0
              
              return (
                <div 
                  key={question.question_number}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn(
                      "flex items-center justify-center w-6 h-6 flex-shrink-0 text-lg",
                      isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {isCorrect ? "✓" : "✗"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-50 leading-relaxed">
                        {question.question}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(timeSpent)}
                    </div>
                  </div>

                  {/* Answer Section */}
                  <div className="space-y-2 mb-6">
                    {/* Your answer */}
                    <p className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Your answer:</span>{" "}
                      <span className={cn(
                        "font-medium",
                        isCorrect 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400 line-through"
                      )}>
                        {question.question_type === "multiple_choice"
                          ? getSelectedAnswerText(question, selectedAnswer)
                          : selectedAnswer || "(no answer)"}
                      </span>
                    </p>
                    
                    {/* Correct answer (if incorrect) */}
                    {!isCorrect && (
                      <p className="text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Correct answer:</span>{" "}
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {question.question_type === "multiple_choice"
                            ? getSelectedAnswerText(question, question.correct_answer)
                            : question.correct_answer}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>

                  {/* Explanation */}
                  {showExplanations && (
                    <div className="mb-6">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {question.explanation}
                      </p>
                    </div>
                  )}

                  {/* Sources - Always show if available */}
                  {question.sources.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">
                        Sources:
                      </p>
                      <div className="space-y-3">
                        {question.sources.map((source, idx) => (
                          <SourceMetadataCard
                            key={idx}
                            source={source}
                            showThumbnail={true}
                            compact={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Separator */}
                  <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>

                  {/* Question Feedback */}
                  <QuestionFeedback 
                    questionId={question.question_number?.toString() || `${question.question_number}`}
                    questionText={question.question}
                    topicId={topicId}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Premium Data Teaser for free users */}
        {!isPremium && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PremiumDataTeaser 
              variant="banner"
              className="mb-6"
            />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <EnhancedSocialShare 
              title={topicTitle} 
              score={score} 
              totalQuestions={totalQuestions}
              type="result"
              emoji="🏛️"
              showImageOptions={true}
            />
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