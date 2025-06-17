"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Save, Send, Star, Upload, Calendar, Phone, Mail } from "lucide-react"

// Survey Types
export interface SurveyQuestion {
  id: string
  type: 'multiple_choice' | 'multiple_select' | 'scale' | 'text' | 'textarea' | 'ranking' | 'likert' | 
        'matrix' | 'slider' | 'date' | 'email' | 'phone' | 'number' | 'dropdown' | 'image_choice' | 
        'file_upload' | 'rating_stars' | 'yes_no' | 'statement' | 'contact_info'
  question: string
  description?: string
  required?: boolean
  options?: string[]
  scale_min?: number
  scale_max?: number
  scale_labels?: { min: string; max: string }
  max_selections?: number
  max_rankings?: number
  matrix_config?: {
    scale: {
      min: number
      max: number
      labels: { min: string; max: string }
    }
  }
  conditional_logic?: {
    show_if: string // question id
    show_when: string | string[] // answer value(s)
  }
}

export interface Survey {
  id: string
  title: string
  description: string
  questions: SurveyQuestion[]
  created_at: string
  status: 'draft' | 'active' | 'closed'
  allow_anonymous: boolean
  allow_partial_responses: boolean
  estimated_time?: number
}

export interface SurveyResponse {
  question_id: string
  answer: string | string[] | number
  answered_at: string
}

interface SurveyFormProps {
  survey: Survey
  onComplete: (responses: SurveyResponse[]) => void
  onSaveProgress?: (responses: SurveyResponse[]) => void
  existingResponses?: SurveyResponse[]
  className?: string
}

export function SurveyForm({ 
  survey, 
  onComplete, 
  onSaveProgress,
  existingResponses = [],
  className 
}: SurveyFormProps) {
  const { toast } = useToast()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, SurveyResponse>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState(new Date())

  // Initialize responses from existing data
  useEffect(() => {
    const initialResponses: Record<string, SurveyResponse> = {}
    existingResponses.forEach(response => {
      initialResponses[response.question_id] = response
    })
    setResponses(initialResponses)
  }, [existingResponses])

  // Filter questions based on conditional logic
  const getVisibleQuestions = useCallback(() => {
    return survey.questions.filter(question => {
      if (!question.conditional_logic) return true
      
      const { show_if, show_when } = question.conditional_logic
      const dependentResponse = responses[show_if]
      
      if (!dependentResponse) return false
      
      const answer = dependentResponse.answer
      const triggerValues = Array.isArray(show_when) ? show_when : [show_when]
      
      if (Array.isArray(answer)) {
        return answer.some(val => triggerValues.includes(val))
      }
      
      return triggerValues.includes(String(answer))
    })
  }, [survey.questions, responses])

  const visibleQuestions = getVisibleQuestions()
  const currentQuestion = visibleQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100

  const updateResponse = (questionId: string, answer: string | string[] | number) => {
    const newResponse: SurveyResponse = {
      question_id: questionId,
      answer,
      answered_at: new Date().toISOString()
    }
    
    setResponses(prev => ({
      ...prev,
      [questionId]: newResponse
    }))
  }

  const handleNext = () => {
    if (currentQuestion?.required && !responses[currentQuestion.id]) {
      toast({
        title: "Answer required",
        description: "Please answer this question before continuing.",
        variant: "destructive"
      })
      return
    }

    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSaveProgress = async () => {
    if (onSaveProgress) {
      const responseArray = Object.values(responses)
      await onSaveProgress(responseArray)
      toast({
        title: "Progress saved",
        description: "Your responses have been saved. You can return later to complete the survey."
      })
    }
  }

  const handleSubmit = async () => {
    // Check if all required questions are answered
    const unansweredRequired = visibleQuestions.filter(q => 
      q.required && !responses[q.id]
    )

    if (unansweredRequired.length > 0) {
      toast({
        title: "Required questions unanswered",
        description: `Please answer ${unansweredRequired.length} required question(s) before submitting.`,
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const responseArray = Object.values(responses)
      await onComplete(responseArray)
    } catch (error) {
      console.error('Error submitting survey:', error)
      toast({
        title: "Submission failed",
        description: "There was an error submitting your responses. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: SurveyQuestion) => {
    const currentResponse = responses[question.id]
    
    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentResponse?.answer as string || ""}
            onValueChange={(value) => updateResponse(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'multiple_select':
        const selectedOptions = (currentResponse?.answer as string[]) || []
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    let newSelection = [...selectedOptions]
                    if (checked) {
                      if (!question.max_selections || newSelection.length < question.max_selections) {
                        newSelection.push(option)
                      } else {
                        toast({
                          title: "Selection limit reached",
                          description: `You can only select up to ${question.max_selections} options.`,
                          variant: "destructive"
                        })
                        return
                      }
                    } else {
                      newSelection = newSelection.filter(item => item !== option)
                    }
                    updateResponse(question.id, newSelection)
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
            {question.max_selections && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select up to {question.max_selections} options
              </p>
            )}
          </div>
        )

      case 'scale':
        const scaleValue = currentResponse?.answer as number || 0
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {question.scale_labels && (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {question.scale_labels.min}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {question.scale_labels.max}
                  </span>
                </>
              )}
            </div>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: (question.scale_max || 5) - (question.scale_min || 1) + 1 }, (_, i) => {
                const value = (question.scale_min || 1) + i
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={scaleValue === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateResponse(question.id, value)}
                    className={cn(
                      "w-12 h-12 rounded-full",
                      scaleValue === value && "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    {value}
                  </Button>
                )
              })}
            </div>
          </div>
        )

      case 'text':
        return (
          <Input
            value={currentResponse?.answer as string || ""}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={currentResponse?.answer as string || ""}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full min-h-[120px]"
            maxLength={1000}
          />
        )

      case 'ranking':
        // Simple ranking implementation - could be enhanced with drag & drop
        const rankingOptions = question.options || []
        const rankings = (currentResponse?.answer as string[]) || []
        
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rank these options in order of preference (1 = most preferred)
            </p>
            {rankingOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Select
                  value={rankings.indexOf(option) >= 0 ? String(rankings.indexOf(option) + 1) : ""}
                  onValueChange={(value) => {
                    const newRankings = [...rankings]
                    const currentIndex = newRankings.indexOf(option)
                    
                    // Remove from current position
                    if (currentIndex >= 0) {
                      newRankings.splice(currentIndex, 1)
                    }
                    
                    // Insert at new position
                    const newPosition = parseInt(value) - 1
                    newRankings.splice(newPosition, 0, option)
                    
                    updateResponse(question.id, newRankings)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Rank" />
                  </SelectTrigger>
                  <SelectContent>
                    {rankingOptions.map((_, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label className="flex-1">{option}</Label>
              </div>
            ))}
          </div>
        )

      case 'likert':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2 text-center text-sm">
              <div></div>
              <div>Strongly Disagree</div>
              <div>Disagree</div>
              <div>Neutral</div>
              <div>Agree</div>
              <div>Strongly Agree</div>
            </div>
            {question.options?.map((statement, index) => (
              <div key={index} className="grid grid-cols-6 gap-2 items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="text-sm">{statement}</div>
                {[1, 2, 3, 4, 5].map(value => (
                  <div key={value} className="flex justify-center">
                    <RadioGroup
                      value={currentResponse?.answer as string || ""}
                      onValueChange={(val) => updateResponse(question.id, val)}
                    >
                      <RadioGroupItem value={`${statement}-${value}`} />
                    </RadioGroup>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )

      default:
        return <div>Question type not supported</div>
    }
  }

  if (!currentQuestion) {
    return <div>No questions available</div>
  }

  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1
  const answeredQuestions = visibleQuestions.filter(q => responses[q.id]).length

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Progress header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-slate-900 dark:text-white">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {survey.description}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Question {currentQuestionIndex + 1} of {visibleQuestions.length}
            </div>
            {survey.estimated_time && (
              <div className="text-xs text-slate-500 dark:text-slate-500">
                Est. {survey.estimated_time} minutes
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500">
            <span>{answeredQuestions} answered</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>
      </div>

      {/* Question card */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.type.replace('_', ' ')}
                </Badge>
                {currentQuestion.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">
                {currentQuestion.question}
              </CardTitle>
              {currentQuestion.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {currentQuestion.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderQuestion(currentQuestion)}
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              
              {survey.allow_partial_responses && onSaveProgress && (
                <Button
                  variant="ghost"
                  onClick={handleSaveProgress}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Progress</span>
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Survey"}</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Survey info footer */}
      {survey.allow_anonymous && (
        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            This survey is anonymous. Your responses will not be linked to your identity.
          </p>
        </div>
      )}
    </div>
  )
} 