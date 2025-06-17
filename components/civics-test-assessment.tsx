'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Brain, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'

interface CivicsTestAssessmentProps {
  onComplete: (data: any) => void
  onBack: () => void
  testType: 'quick' | 'full'
  userId?: string
  guestToken?: string
}

interface AssessmentQuestion {
  id: string
  question: string
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
  }>
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  explanation: string
  friendlyExplanation: string
}

// Sample questions for the assessment - these would typically come from the database
const sampleQuestions: AssessmentQuestion[] = [
  {
    id: '1',
    question: 'Which amendment protects freedom of speech?',
    options: [
      { id: 'a', text: 'First Amendment', isCorrect: true },
      { id: 'b', text: 'Second Amendment', isCorrect: false },
      { id: 'c', text: 'Fourth Amendment', isCorrect: false },
      { id: 'd', text: 'Fifth Amendment', isCorrect: false }
    ],
    category: 'constitution',
    difficulty: 'beginner',
    explanation: 'The First Amendment protects freedom of speech, religion, press, assembly, and petition.',
    friendlyExplanation: 'First Amendment! It\'s like the greatest hits album of American freedoms: speech, religion, press, assembly, and petition.'
  },
  {
    id: '2',
    question: 'How many senators does each state have?',
    options: [
      { id: 'a', text: 'One', isCorrect: false },
      { id: 'b', text: 'Two', isCorrect: true },
      { id: 'c', text: 'Depends on population', isCorrect: false },
      { id: 'd', text: 'Three', isCorrect: false }
    ],
    category: 'congress',
    difficulty: 'beginner',
    explanation: 'Each state has exactly two senators, regardless of population size.',
    friendlyExplanation: 'Every state gets exactly two senators - whether you\'re tiny Delaware or massive California. It\'s one of the compromises that made the Constitution possible.'
  },
  {
    id: '3',
    question: 'What is the most effective way to influence your Representative\'s vote on a bill?',
    options: [
      { id: 'a', text: 'Posting on their social media', isCorrect: false },
      { id: 'b', text: 'Calling their office with a specific ask', isCorrect: true },
      { id: 'c', text: 'Sending a form letter email', isCorrect: false },
      { id: 'd', text: 'Protesting outside their house', isCorrect: false }
    ],
    category: 'civic_engagement',
    difficulty: 'intermediate',
    explanation: 'Congressional offices track phone calls and consider them a strong indicator of constituent opinion.',
    friendlyExplanation: 'Phone calls still work! Congressional offices count calls and take them seriously because calling requires more effort than clicking "like".'
  }
]

export function CivicsTestAssessment({ onComplete, onBack, testType, userId, guestToken }: CivicsTestAssessmentProps) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({})

  // Load questions based on test type
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // In a real app, this would fetch from the assessment_questions table
        // For now, we'll use sample questions
        const questionsToUse = testType === 'quick' 
          ? sampleQuestions.slice(0, 5) 
          : sampleQuestions

        setQuestions(questionsToUse)
        setIsLoading(false)
        setStartTime(Date.now())
        setQuestionStartTime(Date.now())
      } catch (error) {
        console.error('Error loading questions:', error)
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [testType])

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId)
  }

  const handleNext = () => {
    if (!selectedAnswer) return

    // Record time spent on this question
    const questionTime = Date.now() - questionStartTime
    setTimeSpent(prev => ({
      ...prev,
      [currentQuestion.id]: questionTime
    }))

    // Save answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }))

    if (isLastQuestion) {
      // Calculate results and complete assessment
      const finalAnswers = { ...answers, [currentQuestion.id]: selectedAnswer }
      const finalTimeSpent = { ...timeSpent, [currentQuestion.id]: questionTime }
      
      const results = calculateResults(finalAnswers, finalTimeSpent)
      
      onComplete({
        answers: finalAnswers,
        timeSpent: finalTimeSpent,
        totalTimeMs: Date.now() - startTime,
        assessmentResults: results,
        testType,
        completedAt: Date.now()
      })
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer('')
      setShowExplanation(false)
      setQuestionStartTime(Date.now())
    }
  }

  const calculateResults = (finalAnswers: Record<string, string>, finalTimeSpent: Record<string, number>) => {
    let correct = 0
    const perCategory: Record<string, { correct: number; total: number }> = {}

    questions.forEach(question => {
      const userAnswer = finalAnswers[question.id]
      const correctOption = question.options.find(opt => opt.isCorrect)
      const isCorrect = correctOption?.id === userAnswer

      if (isCorrect) correct++

      // Track by category
      if (!perCategory[question.category]) {
        perCategory[question.category] = { correct: 0, total: 0 }
      }
      perCategory[question.category].total++
      if (isCorrect) perCategory[question.category].correct++
    })

    const score = Math.round((correct / questions.length) * 100)
    const totalTime = Object.values(finalTimeSpent).reduce((sum, time) => sum + time, 0)
    const averageTime = totalTime / questions.length

    // Determine skill level
    let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
    if (score >= 80) level = 'advanced'
    else if (score >= 60) level = 'intermediate'

    return {
      score,
      correct,
      total: questions.length,
      level,
      perCategory,
      totalTimeMs: totalTime,
      averageTimeMs: averageTime
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.round(ms / 1000)
    return `${seconds}s`
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900 dark:border-white"></div>
              <span className="text-slate-600 dark:text-slate-400">Loading assessment...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">No questions available for this assessment.</p>
            <Button onClick={onBack} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        
        <Badge variant="outline" className="px-3 py-1">
          <Clock className="w-3 h-3 mr-1" />
          {testType === 'quick' ? 'Quick' : 'Full'} Assessment
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {currentQuestion.category.replace('_', ' ').toUpperCase()}
              </Badge>
              <CardTitle className="text-lg font-medium leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
              <div className={`w-2 h-2 rounded-full ${
                currentQuestion.difficulty === 'beginner' ? 'bg-green-500' :
                currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="capitalize">{currentQuestion.difficulty}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Answer Options */}
          <RadioGroup
            value={selectedAnswer}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="flex-shrink-0"
                />
                <Label
                  htmlFor={option.id}
                  className="flex-1 text-sm font-normal leading-relaxed cursor-pointer py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Navigation */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className="px-6"
            >
              {isLastQuestion ? 'Complete Assessment' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 