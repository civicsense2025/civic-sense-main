'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { QuizQuestion } from '@civicsense/shared/types/lesson-steps'

interface QuizComponentProps {
  questions: QuizQuestion[]
  onComplete?: (score: number, answers: Record<string, any>) => void
  allowReview?: boolean
  className?: string
}

export function QuizComponent({
  questions,
  onComplete,
  allowReview = true,
  className
}: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [showResults, setShowResults] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasAnsweredCurrent = answers[currentQuestion.id] !== undefined

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setShowResults(true)
    
    // Calculate score
    let correctAnswers = 0
    questions.forEach(question => {
      const userAnswer = answers[question.id]
      if (question.correct_answer !== undefined && userAnswer === question.correct_answer) {
        correctAnswers++
      }
    })
    
    const score = Math.round((correctAnswers / questions.length) * 100)
    onComplete?.(score, answers)
  }

  const renderQuestion = (question: QuizQuestion) => {
    const userAnswer = answers[question.id]
    const isCorrect = question.correct_answer !== undefined && 
                     userAnswer === question.correct_answer
    const showAnswer = submitted && question.correct_answer !== undefined

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{question.question}</h3>
        
        {question.type === 'multiple_choice' && question.options && (
          <RadioGroup
            value={userAnswer?.toString() || ''}
            onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
            disabled={submitted}
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={index.toString()} 
                  id={`${question.id}-${index}`}
                />
                <Label 
                  htmlFor={`${question.id}-${index}`}
                  className={`flex-1 ${
                    showAnswer && index === question.correct_answer
                      ? 'text-green-700 font-medium'
                      : showAnswer && userAnswer === index && index !== question.correct_answer
                      ? 'text-red-700'
                      : ''
                  }`}
                >
                  {option}
                  {showAnswer && index === question.correct_answer && (
                    <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />
                  )}
                  {showAnswer && userAnswer === index && index !== question.correct_answer && (
                    <XCircle className="inline h-4 w-4 ml-2 text-red-600" />
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === 'true_false' && (
          <RadioGroup
            value={userAnswer?.toString() || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value === 'true')}
            disabled={submitted}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`}>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`}>False</Label>
            </div>
          </RadioGroup>
        )}

        {question.type === 'short_answer' && (
          <Textarea
            placeholder="Enter your answer..."
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={submitted}
            className="min-h-[100px]"
          />
        )}

        {question.type === 'reflection' && (
          <Textarea
            placeholder="Share your thoughts and reflections..."
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={submitted}
            className="min-h-[120px]"
          />
        )}

        {/* Show explanation after submission */}
        {submitted && question.explanation && (
          <div className={`p-4 rounded-lg ${
            isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-2">
              <HelpCircle className={`h-5 w-5 mt-0.5 ${
                isCorrect ? 'text-green-600' : 'text-blue-600'
              }`} />
              <div>
                <h4 className={`font-medium ${
                  isCorrect ? 'text-green-800' : 'text-blue-800'
                }`}>
                  Explanation
                </h4>
                <p className={`text-sm mt-1 ${
                  isCorrect ? 'text-green-700' : 'text-blue-700'
                }`}>
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (showResults) {
    const correctAnswers = questions.filter(q => 
      q.correct_answer !== undefined && answers[q.id] === q.correct_answer
    ).length
    const score = Math.round((correctAnswers / questions.length) * 100)

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {score}%
            </div>
            <p className="text-gray-600">
              {correctAnswers} out of {questions.length} correct
            </p>
          </div>

          {allowReview && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Review Your Answers</h3>
              {questions.map((question, index) => (
                <div key={question.id} className="border-l-4 border-gray-200 pl-4">
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    Question {index + 1}
                  </div>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quiz</span>
          <span className="text-sm font-normal text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {renderQuestion(currentQuestion)}

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent}
            >
              {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 