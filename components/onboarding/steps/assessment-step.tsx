'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Check, X, ArrowRight, Loader2, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useStatsig } from '@/components/providers/statsig-provider'

interface AssessmentQuestion {
  id: string
  question: string
  options: Array<{ id: string; text: string }>
  correctAnswer: string
  explanation: string
  friendlyExplanation: string
  difficulty: number
  category: string
  skill_id?: string
}

interface AssessmentStepProps {
  onComplete: (data: any) => void
  onNext: () => void
  onSkip: (reason: string) => void
  onboardingState: any
  userId?: string
}

export function AssessmentStep({ onComplete, onSkip, onboardingState, userId }: AssessmentStepProps) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({})
  const [showResult, setShowResult] = useState(false)
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [categoryPerformance, setCategoryPerformance] = useState<Record<string, { correct: number; total: number }>>({})
  const [adaptiveLoading, setAdaptiveLoading] = useState(false)
  const [adaptiveMode, setAdaptiveMode] = useState(false)
  const [answeredIds, setAnsweredIds] = useState<string[]>([])
  const [weakCategories, setWeakCategories] = useState<string[]>([])
  const [startTime, setStartTime] = useState<number>(Date.now())
  const responseTimes = useRef<{ [questionId: string]: number }>({})
  const { logEvent } = useStatsig();

  // Normalize API question
  function normalizeQuestion(q: any): AssessmentQuestion {
    // Options may be array of strings or array of objects
    let options: Array<{ id: string; text: string }> = []
    if (Array.isArray(q.options)) {
      if (typeof q.options[0] === 'string') {
        options = q.options.map((text: string, idx: number) => ({ id: String.fromCharCode(97 + idx), text }))
      } else if (typeof q.options[0] === 'object') {
        options = q.options.map((opt: any, idx: number) => ({ id: opt.id || String.fromCharCode(97 + idx), text: opt.text || opt.label || '' }))
      }
    }
    return {
      id: q.id,
      question: q.question,
      options,
      correctAnswer: q.correctAnswer || q.correct_answer,
      explanation: q.explanation,
      friendlyExplanation: q.friendlyExplanation || q.friendly_explanation || q.explanation,
      difficulty: q.difficulty,
      category: q.category,
      skill_id: q.skill_id
    }
  }

  // Fetch initial questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      setError(null)
      try {
        const selectedCategories = onboardingState?.categories?.categories || []
        const categoryIds = selectedCategories.map((cat: any) => cat.id).filter(Boolean)
        const params = new URLSearchParams()
        params.set('balanced', 'true')
        params.set('count', '8')
        if (categoryIds.length > 0) {
          params.set('categories', JSON.stringify(categoryIds))
        }
        const res = await fetch(`/api/onboarding/assessment-questions?${params.toString()}`)
        const result = await res.json()
        if (result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
          setQuestions(result.questions.map(normalizeQuestion))
        } else {
          throw new Error('No questions returned')
        }
      } catch (err) {
        setError('Failed to load assessment questions')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [onboardingState])

  // Track response time
  useEffect(() => {
    setStartTime(Date.now())
  }, [currentQuestionIndex])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  // Handle answer selection
  const handleAnswer = async (optionId: string) => {
    if (!currentQuestion) return
    const isCorrect = optionId === currentQuestion.correctAnswer
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }))
    setAnsweredIds(prev => [...prev, currentQuestion.id])
    // Track streak
    setStreak(prev => (isCorrect ? prev + 1 : 0))
    setMaxStreak(prev => (isCorrect && prev + 1 > maxStreak ? prev + 1 : maxStreak))
    // Track response time
    responseTimes.current[currentQuestion.id] = Math.floor((Date.now() - startTime) / 1000)
    // Track category performance
    setCategoryPerformance(prev => {
      const cat = currentQuestion.category
      const prevStats = prev[cat] || { correct: 0, total: 0 }
      return {
        ...prev,
        [cat]: {
          correct: prevStats.correct + (isCorrect ? 1 : 0),
          total: prevStats.total + 1
        }
      }
    })
    setShowResult(true)
    setTimeout(async () => {
      setShowResult(false)
      // If at end, check if adaptive follow-up is needed
      if (currentQuestionIndex === questions.length - 1 && !assessmentComplete) {
        // Identify weak categories
        const weak = Object.entries(categoryPerformance)
          .filter(([_, stats]) => stats.correct / stats.total < 0.6)
          .map(([cat]) => cat)
        setWeakCategories(weak)
        // If user struggled, fetch more questions adaptively
        if (questions.length < 12 && weak.length > 0) {
          setAdaptiveLoading(true)
          setAdaptiveMode(true)
          // Calculate performance
          const correctCount = Object.values(categoryPerformance).reduce((sum, stats) => sum + stats.correct, 0)
          const totalCount = Object.values(categoryPerformance).reduce((sum, stats) => sum + stats.total, 0)
          const performance = totalCount > 0 ? correctCount / totalCount : 0.5
          // Target easier if low, harder if high
          let targetDifficulty = 2
          if (performance >= 0.8) targetDifficulty = 3
          else if (performance <= 0.4) targetDifficulty = 1
          // POST for adaptive question
          const resp = await fetch('/api/onboarding/assessment-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              performance,
              answeredQuestions: answeredIds,
              targetDifficulty,
              categories: weak
            })
          })
          const data = await resp.json()
          if (data.question) {
            setQuestions(prev => [...prev, normalizeQuestion(data.question)])
            setCurrentQuestionIndex(prev => prev + 1)
            setAdaptiveLoading(false)
            return
          }
          setAdaptiveLoading(false)
        }
        setAssessmentComplete(true)
      } else if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        setAssessmentComplete(true)
      }
    }, 1200)
  }

  // Calculate results
  const calculateResults = () => {
    let correct = 0
    let perCategory: Record<string, { correct: number; total: number }> = {}
    questions.forEach(q => {
      const userAnswer = answers[q.id]
      if (!perCategory[q.category]) perCategory[q.category] = { correct: 0, total: 0 }
      perCategory[q.category].total++
      if (userAnswer === q.correctAnswer) {
        correct++
        perCategory[q.category].correct++
      }
    })
    const score = Math.round((correct / questions.length) * 100)
    let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
    if (score >= 80) level = 'advanced'
    else if (score >= 60) level = 'intermediate'
    return { score, correct, total: questions.length, level, perCategory }
  }

  // Personalized message
  const getPersonalizedMessage = (level: string) => {
    if (level === 'advanced') return "You really know your stuff! Ready for complex analysis."
    if (level === 'intermediate') return "You have a solid foundation and are ready to build on it."
    return "Perfect starting point! Everyone begins somewhere."
  }

  // Helper to persist assessment analytics and personalize user
  async function handleAssessmentAnalytics(results: any) {
    try {
      const resolvedUserId = userId || onboardingState?.userId || onboardingState?.user_id || onboardingState?.user?.id;
      if (!resolvedUserId) return;
      const sessionId = `${resolvedUserId}-onboarding-${Date.now()}`;
      // 1. Record assessment_analytics
      await supabase.from('assessment_analytics').insert({
        user_id: resolvedUserId,
        session_id: sessionId,
        event_type: 'completed',
        final_score: results.score,
        timestamp: new Date().toISOString()
      });
      // 2. Store user_assessments
      await supabase.from('user_assessments').insert({
        user_id: resolvedUserId,
        assessment_type: 'onboarding',
        score: results.score,
        level: results.level,
        category_breakdown: results.perCategory,
        answers: answers,
        completed_at: new Date().toISOString()
      });
      // 3. Update user_category_skills for each category
      for (const [category, statsRaw] of Object.entries(results.perCategory)) {
        const stats = statsRaw as { correct: number; total: number };
        let mastery = 'novice';
        const pct = stats.total > 0 ? stats.correct / stats.total : 0;
        if (pct >= 0.9) mastery = 'expert';
        else if (pct >= 0.75) mastery = 'advanced';
        else if (pct >= 0.5) mastery = 'intermediate';
        else if (pct >= 0.25) mastery = 'beginner';
        await supabase.from('user_category_skills').upsert({
          user_id: resolvedUserId,
          category,
          skill_level: Math.round(pct * 100),
          mastery_level: mastery,
          questions_attempted: stats.total,
          questions_correct: stats.correct,
          last_practiced_at: new Date().toISOString()
        }, { onConflict: 'user_id,category' });
      }
      // 4. Fire Statsig events
      logEvent('onboarding_assessment_completed', results.score, {
        level: results.level,
        perCategory: results.perCategory,
        streak: maxStreak,
        total: results.total
      });
      logEvent('onboarding_step_completed', 'assessment', {
        score: results.score,
        level: results.level
      });
    } catch (err) {
      console.error('Assessment analytics/personalization error:', err);
    }
  }

  // Loading state
  if (loading || adaptiveLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700 dark:text-slate-300" />
        <p className="text-slate-600 dark:text-slate-400 font-light">
          {adaptiveLoading ? 'Finding your next question...' : 'Preparing your knowledge assessment...'}
        </p>
      </div>
    )
  }

  // Error state
  if (error || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-4xl">😕</div>
        <h3 className="text-xl font-light text-slate-900 dark:text-white">
          {error || "Couldn't load assessment questions"}
        </h3>
        <div className="space-y-4 pt-4">
          <Button
            onClick={() => onSkip('assessment_error')}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 py-2 rounded-full font-light"
          >
            Skip Assessment
          </Button>
        </div>
      </div>
    )
  }

  if (assessmentComplete) {
    const results = calculateResults()
    return (
      <div className="max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <div className="text-6xl">
            {results.score >= 80 ? '🎯' : results.score >= 60 ? '👍' : '🌱'}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-slate-900 dark:text-white">
              Assessment Complete!
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
              You got {results.correct} out of {results.total} questions right.
            </p>
            <p className="text-slate-600 dark:text-slate-400 font-light">
              {getPersonalizedMessage(results.level)}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center">
          <div className="space-y-8">
            <div className="text-5xl font-light text-slate-900 dark:text-white">
              {results.score}%
            </div>
            <div>
              <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm px-4 py-1 font-light">
                {results.level.charAt(0).toUpperCase() + results.level.slice(1)}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 dark:text-white">Category Breakdown</h4>
              <div className="flex flex-wrap gap-3 justify-center">
                {Object.entries(results.perCategory).map(([cat, stats]) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat.replace(/_/g, ' ')}: {stats.correct}/{stats.total}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="text-center pt-4">
          <Button 
            onClick={async () => {
              await handleAssessmentAnalytics(results);
              onComplete({
                assessmentResults: results,
                answers,
                responseTimes: responseTimes.current,
                completedAt: Date.now(),
                streak: maxStreak
              })
            }}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-3 h-auto rounded-full font-light group"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    )
  }

  // Friendly feedback
  const getFeedback = (isCorrect: boolean) => {
    if (isCorrect) {
      const messages = [
        "Nice! That's correct.",
        "Great job!",
        "You got it!",
        "Well done!",
        "That's right!"
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    } else {
      const messages = [
        "Not quite, but that's okay!",
        "Almost! Keep going.",
        "Good try!",
        "Don't worry, you'll get the next one.",
        "Let's see the explanation."
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    }
  }

  // Main question UI
  return (
    <div className="max-w-2xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white text-center">
          Quick knowledge check
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light text-center">
          Let's see what you already know. No pressure — this helps us personalize your experience.
        </p>
      </div>
      {/* Progress & Streak */}
      <div className="flex items-center justify-between mb-2">
        <Progress value={progress} className="h-1 w-3/4" />
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-orange-500">Streak: {streak}</span>
        </div>
      </div>
      {/* Question */}
      <div className="space-y-8">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="py-6">
            <h3 className="text-xl font-light text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>
          {!showResult ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  className="w-full px-6 py-4 text-left rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-light"
                >
                  {option.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isCorrect = option.id === currentQuestion.correctAnswer
                  const isSelected = answers[currentQuestion.id] === option.id
                  return (
                    <div 
                      key={option.id} 
                      className={`px-6 py-4 rounded-2xl border flex items-center space-x-3 ${
                        isCorrect 
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                          : isSelected && !isCorrect
                            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                            : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {isCorrect ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : isSelected ? (
                        <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="font-light">{option.text}</span>
                    </div>
                  )
                })}
              </div>
              <div className="text-center text-lg font-medium mt-2">
                {getFeedback(answers[currentQuestion.id] === currentQuestion.correctAnswer)}
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-600 dark:text-slate-400 font-light">
                  {currentQuestion.friendlyExplanation || currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      {/* Skip option */}
      <div className="flex justify-center pt-8">
        <Button
          variant="ghost"
          onClick={() => onSkip('assessment_skipped')}
          className="text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-light"
        >
          Skip assessment
        </Button>
      </div>
    </div>
  )
}