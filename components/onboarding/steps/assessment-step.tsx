'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Brain, CheckCircle, XCircle } from 'lucide-react'

interface AssessmentStepProps {
  onComplete: (data: any) => void
  onNext: () => void
  onSkip: (reason: string) => void
  onboardingState: any
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
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: '1',
    question: 'How many branches of government are there in the United States?',
    options: [
      { id: 'a', text: 'Two', isCorrect: false },
      { id: 'b', text: 'Three', isCorrect: true },
      { id: 'c', text: 'Four', isCorrect: false },
      { id: 'd', text: 'Five', isCorrect: false }
    ],
    category: 'Government Structure',
    difficulty: 'beginner',
    explanation: 'The U.S. government has three branches: executive (President), legislative (Congress), and judicial (Supreme Court).'
  },
  {
    id: '2',
    question: 'What is the minimum age requirement to serve in the U.S. House of Representatives?',
    options: [
      { id: 'a', text: '21', isCorrect: false },
      { id: 'b', text: '25', isCorrect: true },
      { id: 'c', text: '30', isCorrect: false },
      { id: 'd', text: '35', isCorrect: false }
    ],
    category: 'Elections',
    difficulty: 'intermediate',
    explanation: 'Representatives must be at least 25 years old, while Senators must be 30 and the President must be 35.'
  },
  {
    id: '3',
    question: 'Which amendment to the Constitution guarantees freedom of speech?',
    options: [
      { id: 'a', text: 'First Amendment', isCorrect: true },
      { id: 'b', text: 'Second Amendment', isCorrect: false },
      { id: 'c', text: 'Fourth Amendment', isCorrect: false },
      { id: 'd', text: 'Fifth Amendment', isCorrect: false }
    ],
    category: 'Civil Rights',
    difficulty: 'beginner',
    explanation: 'The First Amendment protects freedom of speech, religion, press, assembly, and petition.'
  },
  {
    id: '4',
    question: 'What is the process called when Congress can remove a president from office?',
    options: [
      { id: 'a', text: 'Impeachment', isCorrect: true },
      { id: 'b', text: 'Censure', isCorrect: false },
      { id: 'c', text: 'Recall', isCorrect: false },
      { id: 'd', text: 'Resignation', isCorrect: false }
    ],
    category: 'Government Structure',
    difficulty: 'intermediate',
    explanation: 'Impeachment is the process where the House can charge and the Senate can remove federal officials for "high crimes and misdemeanors."'
  },
  {
    id: '5',
    question: 'How long is a term for a U.S. Senator?',
    options: [
      { id: 'a', text: '2 years', isCorrect: false },
      { id: 'b', text: '4 years', isCorrect: false },
      { id: 'c', text: '6 years', isCorrect: true },
      { id: 'd', text: '8 years', isCorrect: false }
    ],
    category: 'Elections',
    difficulty: 'beginner',
    explanation: 'Senators serve 6-year terms, while House Representatives serve 2-year terms.'
  }
]

export function AssessmentStep({ onComplete }: AssessmentStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({})
  const [showResult, setShowResult] = useState(false)
  const [assessmentComplete, setAssessmentComplete] = useState(false)

  const currentQuestion = assessmentQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / assessmentQuestions.length) * 100

  const handleAnswer = (optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }))
    setShowResult(true)
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentQuestionIndex < assessmentQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setShowResult(false)
      } else {
        setAssessmentComplete(true)
      }
    }, 2000)
  }

  const calculateResults = () => {
    let correct = 0
    let beginnerCorrect = 0
    let intermediateCorrect = 0
    let advancedCorrect = 0
    
    assessmentQuestions.forEach(question => {
      const userAnswer = answers[question.id]
      const correctOption = question.options.find(opt => opt.isCorrect)
      
      if (userAnswer === correctOption?.id) {
        correct++
        switch (question.difficulty) {
          case 'beginner':
            beginnerCorrect++
            break
          case 'intermediate':
            intermediateCorrect++
            break
          case 'advanced':
            advancedCorrect++
            break
        }
      }
    })
    
    return {
      score: Math.round((correct / assessmentQuestions.length) * 100),
      correct,
      total: assessmentQuestions.length,
      skillLevels: {
        beginner: beginnerCorrect,
        intermediate: intermediateCorrect,
        advanced: advancedCorrect
      }
    }
  }

  const handleComplete = () => {
    const results = calculateResults()
    onComplete({
      assessmentResults: results,
      answers,
      completedAt: Date.now()
    })
  }

  if (assessmentComplete) {
    const results = calculateResults()
    
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 text-slate-900 dark:text-white mx-auto" />
          <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
            Assessment Complete!
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
            Great job! Here's how you did on your civic knowledge assessment.
          </p>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="text-center pb-4">
            <div className="text-4xl font-light text-slate-900 dark:text-white mb-2">
              {results.score}%
            </div>
            <CardTitle className="text-xl font-medium text-slate-900 dark:text-white">
              Your Civic Knowledge Score
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
              You got {results.correct} out of {results.total} questions correct
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
              <h4 className="font-medium text-slate-900 dark:text-white mb-4">Skill Level Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-light">Beginner</span>
                  <Badge variant="secondary">{results.skillLevels.beginner}/2 correct</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-light">Intermediate</span>
                  <Badge variant="secondary">{results.skillLevels.intermediate}/2 correct</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-light">Advanced</span>
                  <Badge variant="secondary">{results.skillLevels.advanced}/1 correct</Badge>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">What's Next?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-light mb-4">
                Based on your results, we'll recommend content that matches your current knowledge level and helps you grow.
              </p>
              <div className="flex flex-wrap gap-2">
                {results.score >= 80 && <Badge>Advanced Learner</Badge>}
                {results.score >= 60 && results.score < 80 && <Badge>Intermediate Level</Badge>}
                {results.score < 60 && <Badge>Foundation Building</Badge>}
                <Badge variant="secondary">Personalized Content</Badge>
                <Badge variant="secondary">Adaptive Difficulty</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={handleComplete}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-12 py-3 rounded-full font-light"
          >
            Complete Assessment
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
          Quick Knowledge Check
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
          Let's see what you already know so we can personalize your learning experience.
        </p>
        <div className="flex items-center space-x-2 justify-center">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
            Question {currentQuestionIndex + 1} of {assessmentQuestions.length}
          </span>
          <Badge variant="secondary" className="text-xs">
            {currentQuestion.difficulty}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="text-right">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
            {Math.round(progress)}% complete
          </span>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {currentQuestion.category}
            </Badge>
            {showResult && (
              <div className="flex items-center space-x-2">
                {answers[currentQuestion.id] === currentQuestion.options.find(opt => opt.isCorrect)?.id ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          <CardTitle className="text-xl font-medium text-slate-900 dark:text-white leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showResult ? (
            <RadioGroup 
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label 
                    htmlFor={option.id} 
                    className="flex-1 text-slate-900 dark:text-white font-light cursor-pointer"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <div 
                    key={option.id} 
                    className={`p-3 rounded-lg border ${
                      option.isCorrect 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                        : answers[currentQuestion.id] === option.id 
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                          : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {option.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : answers[currentQuestion.id] === option.id ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <div className="w-5 h-5" />
                      )}
                      <span className="text-slate-900 dark:text-white font-light">
                        {option.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <h5 className="font-medium text-slate-900 dark:text-white mb-2">Explanation</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 