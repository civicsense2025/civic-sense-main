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

  // Update gamification progress
  useEffect(() => {
    const updateProgress = async () => {
      if (!user || progressUpdated) return

      try {
        // Prepare question responses for gamification system
        const questionResponses = userAnswers.map(answer => {
          const question = questions.find(q => q.question_number === answer.questionId)
          return {
            questionId: answer.questionId.toString(),
            category: question?.category || 'General',
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent
          }
        })

        const quizData = {
          topicId,
          totalQuestions,
          correctAnswers,
          timeSpentSeconds: totalTime,
          questionResponses
        }

        const results = await updateEnhancedProgress(user.id, quizData)
        
        if (results.newAchievements.length > 0) {
          setNewAchievements(results.newAchievements)
        }

        if (results.levelUp) {
          // Calculate XP gained (this would come from the actual system)
          const xpGained = correctAnswers * 10 + (isPerfectScore ? 50 : 0) + (totalTime < 300 ? 25 : 0)
          setLevelUpInfo({ newLevel: results.levelUp ? 1 : 1, xpGained }) // This would be actual new level
        }

        setProgressUpdated(true)

        // Show achievements after a delay to let the score animation finish
        setTimeout(() => {
          if (results.newAchievements.length > 0 || results.levelUp) {
            setShowAchievements(true)
          }
        }, 3000)

      } catch (error) {
        console.error('Error updating gamification progress:', error)
        setProgressUpdated(true) // Don't retry on error
      }
    }

    updateProgress()
  }, [user, topicId, correctAnswers, totalQuestions, totalTime, isPerfectScore, userAnswers, questions, progressUpdated])

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
            origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
            colors: ['#3B82F6', '#10B981', '#F59E0B']
          })
        }
      }, 250)

      return () => clearInterval(interval)
    }
  }, [score, isPerfectScore])

  const getSelectedAnswerText = (question: QuizQuestion, answerKey: string): string => {
    const options = [
      { key: 'option_a', value: question.option_a },
      { key: 'option_b', value: question.option_b },
      { key: 'option_c', value: question.option_c },
      { key: 'option_d', value: question.option_d },
    ]
    
    const selectedOption = options.find(opt => opt.key === answerKey)
    return selectedOption?.value || answerKey
  }

  const getScoreColor = () => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = () => {
    if (isPerfectScore) return { emoji: '🏆', text: 'Perfect!', color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700' }
    if (score >= 80) return { emoji: '🎯', text: 'Excellent', color: 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700' }
    if (score >= 60) return { emoji: '📈', text: 'Good Job', color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700' }
    if (score >= 40) return { emoji: '📚', text: 'Keep Learning', color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700' }
    return { emoji: '💪', text: 'Try Again', color: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700' }
  }

  const badge = getScoreBadge()

  const getPerformanceMessage = () => {
    if (isPerfectScore) return "Outstanding! You've mastered this topic completely! 🌟"
    if (score >= 80) return "Excellent work! You have a strong understanding! 👏"
    if (score >= 60) return "Good job! You're on the right track! 📈"
    if (score >= 40) return "Not bad! Review the material and try again! 📚"
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
    <div className="flex flex-col max-h-screen overflow-hidden animate-in fade-in duration-1000">
      {/* Compact Header */}
      <div className="text-center py-4 border-b bg-white dark:bg-slate-900 z-10">
        <h2 className="text-xl font-bold animate-in slide-in-from-top duration-500">Quiz Complete! 🎉</h2>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 max-w-6xl">
          {/* Compact Score Section */}
          <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Display */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-3">
                  <div className="absolute inset-0">
                    <Progress 
                      value={animatedScore} 
                      className="w-full h-full rounded-full transform rotate-90"
                    />
                  </div>
                  <div className={cn(
                    "text-2xl font-bold transition-all duration-500",
                    getScoreColor(),
                    animatedScore === score && "scale-110"
                  )}>
                    {animatedScore}%
                  </div>
                </div>

                <div className={cn(
                  "inline-flex items-center px-3 py-2 rounded-full border-2 font-medium animate-in zoom-in duration-500 delay-500 text-sm",
                  badge.color
                )}>
                  <span className="text-lg mr-2">{badge.emoji}</span>
                  {badge.text}
                </div>

                <p className="text-sm text-muted-foreground mt-2 animate-in slide-in-from-bottom duration-700 delay-300">
                  {getPerformanceMessage()}
                </p>
              </div>

              {/* Compact Stats */}
              {showStats && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom duration-500 delay-1000">
                  <div className="bg-card p-3 rounded-lg border text-center">
                    <div className="text-lg mb-1">⏱️</div>
                    <div className="text-xs text-muted-foreground">Avg Time</div>
                    <div className="text-sm font-bold text-blue-600">{formatTime(averageTime)}</div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-lg border text-center">
                    <div className="text-lg mb-1">⚡</div>
                    <div className="text-xs text-muted-foreground">Fastest</div>
                    <div className="text-sm font-bold text-orange-600">{formatTime(fastestAnswer)}</div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-lg border text-center">
                    <div className="text-lg mb-1">🎯</div>
                    <div className="text-xs text-muted-foreground">Best Streak</div>
                    <div className="text-sm font-bold text-green-600">{streak}</div>
                  </div>
                  
                  <div className="bg-card p-3 rounded-lg border text-center">
                    <div className="text-lg mb-1">🏆</div>
                    <div className="text-xs text-muted-foreground">Total Time</div>
                    <div className="text-sm font-bold text-purple-600">{formatTime(totalTime)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question Summary with Explanation Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold animate-in slide-in-from-left duration-500 delay-500">
                Question Review ({correctAnswers}/{totalQuestions} correct)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanations(!showExplanations)}
                className="flex items-center space-x-2"
              >
                {showExplanations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="text-xs">
                  {showExplanations ? 'Hide' : 'Show'} Explanations
                </span>
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
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
                    <div className="p-3 bg-card">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 text-lg">
                          {isCorrect ? '✅' : '❌'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm leading-relaxed">{question.question}</p>
                            <div className="flex items-center text-xs text-muted-foreground ml-4 flex-shrink-0">
                              <span className="mr-1">⏱️</span>
                              {formatTime(timeSpent)}
                            </div>
                          </div>

                          {/* Show user's answer and correct/incorrect status */}
                          <div className="text-sm mb-2">
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

                          {/* Conditional Explanation */}
                          {showExplanations && (
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm mb-3">
                              <p className="leading-relaxed">{question.explanation}</p>
                            </div>
                          )}

                          {/* Sources */}
                          {showExplanations && question.sources.length > 0 && (
                            <div className="mb-3">
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
                          <div>
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

          {/* Bottom Actions */}
          <div className="mt-6 space-y-4">
            <div className="flex justify-center animate-in slide-in-from-bottom duration-500 delay-1200">
              <SocialShare title={topicTitle} score={score} totalQuestions={totalQuestions} />
            </div>

            <div className="animate-in slide-in-from-bottom duration-500 delay-1500">
              <Button onClick={onFinish} className="w-full rounded-xl transition-all duration-200 hover:scale-105">
                Complete Quiz 🎉
              </Button>
            </div>
          </div>
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
