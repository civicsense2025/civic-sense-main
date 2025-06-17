'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Check, X, ArrowRight, Loader2, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

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

interface CivicsTestAssessmentProps {
  onComplete: (data: any) => void
  onBack: () => void
  testType: 'quick' | 'full'
  userId?: string
  guestToken?: string
}

// Enhanced WordReveal with natural typing animation
function WordReveal({ text, speed = 100, className, onComplete }: { text: string, speed?: number, className?: string, onComplete?: () => void }) {
  const words = text.split(' ')
  const [visibleWords, setVisibleWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setVisibleWords([])
    setCurrentWordIndex(0)
    setIsComplete(false)
    
    if (!text) return

    let cancelled = false
    
    function revealNextWord() {
      if (cancelled) return
      
      setCurrentWordIndex(prevIndex => {
        if (prevIndex < words.length) {
          setVisibleWords(prev => [...prev, words[prevIndex]])
          
          // Schedule next word with slight variation in timing for natural feel
          const nextDelay = speed + (Math.random() * 40 - 20) // ±20ms variation
          setTimeout(revealNextWord, nextDelay)
          
          return prevIndex + 1
        } else {
          setIsComplete(true)
          onComplete?.()
          return prevIndex
        }
      })
    }

    // Small initial delay before starting
    setTimeout(revealNextWord, 300)
    
    return () => { cancelled = true }
  }, [text, speed, onComplete])

  return (
    <span className={className}>
      {visibleWords.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.3,
            ease: "easeOut"
          }}
          style={{ display: 'inline-block', marginRight: '0.25rem' }}
        >
          {word}
        </motion.span>
      ))}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ 
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{ display: 'inline-block', color: '#3b82f6', marginLeft: '0.25rem' }}
        >
          |
        </motion.span>
      )}
    </span>
  )
}

export function CivicsTestAssessment({ onComplete, onBack, testType, userId, guestToken }: CivicsTestAssessmentProps) {
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
  const [startTime, setStartTime] = useState<number>(Date.now())
  const responseTimes = useRef<{ [questionId: string]: number }>({})
  const autoAdvanceTimeout = useRef<NodeJS.Timeout | null>(null)
  const [canAdvance, setCanAdvance] = useState(false)

  // Get dynamic headings based on test type and question count
  const getAssessmentTitle = () => {
    if (testType === 'full') {
      return "The Civic Knowledge Test That Actually Matters"
    } else {
      return "Quick Civic Knowledge Check"
    }
  }

  const getAssessmentDescription = () => {
    if (testType === 'full') {
      return "We're about to test whether you understand how power actually works in America today. No memorized facts—just real-world knowledge."
    } else {
      return "A quick assessment of your civic knowledge. We'll focus on the most important questions about how democracy functions."
    }
  }

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

  // Fetch questions based on test type
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('balanced', 'true')
        const count = testType === 'quick' ? 8 : 20 // 8 for quick, 20 for full
        params.set('count', String(count))
        
        const res = await fetch(`/api/onboarding/assessment-questions?${params.toString()}`)
        const result = await res.json()
        
        if (result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
          setQuestions(result.questions.map(normalizeQuestion))
        } else {
          throw new Error('No questions returned')
        }
      } catch (err) {
        setError('Failed to load assessment questions')
        console.error('Error fetching questions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [testType])

  // Track response time
  useEffect(() => {
    setStartTime(Date.now())
  }, [currentQuestionIndex])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  // Handle answer selection
  const handleAnswer = async (optionId: string) => {
    if (!currentQuestion) return
    
    // Find the correct option's id
    const correctOption = currentQuestion.options.find(
      (opt) => opt.text === currentQuestion.correctAnswer
    )
    const isCorrect = optionId === (correctOption?.id ?? currentQuestion.correctAnswer)
    
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }))
    setStreak(prev => (isCorrect ? prev + 1 : 0))
    setMaxStreak(prev => (isCorrect && prev + 1 > maxStreak ? prev + 1 : maxStreak))
    responseTimes.current[currentQuestion.id] = Math.floor((Date.now() - startTime) / 1000)
    
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
    setCanAdvance(false)
    
    // Start 10s timer for auto-advance
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current)
    autoAdvanceTimeout.current = setTimeout(() => {
      handleAdvance()
    }, 10000)
    
    // Allow manual advance after 2s (give time to read explanation)
    setTimeout(() => setCanAdvance(true), 2000)
  }

  // Manual advance handler
  function handleAdvance() {
    setShowResult(false)
    setCanAdvance(false)
    
    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current)
      autoAdvanceTimeout.current = null
    }
    
    if (currentQuestionIndex === questions.length - 1) {
      setAssessmentComplete(true)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current)
    }
  }, [])

  // Calculate results
  const calculateResults = () => {
    let correct = 0
    let perCategory: Record<string, { correct: number; total: number }> = {}
    
    questions.forEach(q => {
      const userAnswer = answers[q.id]
      const correctOption = q.options.find(opt => opt.text === q.correctAnswer)
      
      if (!perCategory[q.category]) perCategory[q.category] = { correct: 0, total: 0 }
      perCategory[q.category].total++
      
      if (userAnswer === (correctOption?.id ?? q.correctAnswer)) {
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
  const getPersonalizedMessage = (level: string, score: number) => {
    if (level === 'advanced') {
      return "You understand how power actually works. You're in the minority of Americans who grasp the real mechanics of democracy."
    }
    if (level === 'intermediate') {
      return "You have a solid foundation, but there are gaps in your understanding of how the system really operates."
    }
    return `You scored ${score}%, which puts you ahead of many Americans, but there's more to learn about how democracy actually functions.`
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700 dark:text-slate-300" />
        <p className="text-slate-600 dark:text-slate-400 font-light">
          Preparing your civic knowledge assessment...
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
            onClick={onBack}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-6 py-2 rounded-full font-light"
          >
            Go Back
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
              Assessment Complete
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
              You got {results.correct} out of {results.total} questions right.
            </p>
            <p className="text-slate-600 dark:text-slate-400 font-light">
              {getPersonalizedMessage(results.level, results.score)}
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
                {results.level.charAt(0).toUpperCase() + results.level.slice(1)} Level
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 dark:text-white">Knowledge Areas</h4>
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
            onClick={() => {
              onComplete({
                assessmentResults: results,
                answers,
                responseTimes: responseTimes.current,
                completedAt: Date.now(),
                streak: maxStreak,
                testType
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
        "That's right!",
        "Correct!",
        "You got it!",
        "Exactly!",
        "Well done!"
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    } else {
      const messages = [
        "Not quite—here's why:",
        "Close, but here's the reality:",
        "Actually, here's how it works:",
        "That's a common misconception. Here's the truth:",
        "Here's what's really happening:"
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
          {getAssessmentTitle()}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light text-center">
          {getAssessmentDescription()}
        </p>
        <div className="text-center">
          <Badge variant="outline" className="text-sm">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
        </div>
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
                  // Find the correct option's id for highlighting
                  const correctOption = currentQuestion.options.find(
                    (opt) => opt.text === currentQuestion.correctAnswer
                  )
                  const isCorrect = option.id === (correctOption?.id ?? currentQuestion.correctAnswer)
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
                {getFeedback(
                  answers[currentQuestion.id] === (currentQuestion.options.find(opt => opt.text === currentQuestion.correctAnswer)?.id ?? currentQuestion.correctAnswer)
                )}
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                <WordReveal
                  text={currentQuestion.friendlyExplanation || currentQuestion.explanation}
                  speed={120}
                  className="text-slate-600 dark:text-slate-400 font-light leading-relaxed"
                />
              </div>
              
              {canAdvance && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleAdvance}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-8 py-3 h-auto rounded-full font-light"
                  >
                    {currentQuestionIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
                  </Button>
                </div>
              )}
              
              {!canAdvance && (
                <div className="flex justify-center pt-4">
                  <span className="text-xs text-slate-400">Reading explanation...</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Back option */}
      <div className="flex justify-center pt-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-light"
        >
          ← Back to overview
        </Button>
      </div>
    </div>
  )
} 