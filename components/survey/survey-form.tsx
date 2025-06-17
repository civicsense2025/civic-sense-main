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
  answer: string | string[] | number | Record<string, any>
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

  const updateResponse = (questionId: string, answer: string | string[] | number | Record<string, any>) => {
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
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer font-light">
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
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer font-light">
                  {option}
                </Label>
              </div>
            ))}
            {question.max_selections && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                Select up to {question.max_selections} options
              </p>
            )}
          </div>
        )

      case 'scale':
        const scaleValue = currentResponse?.answer as number || 0
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              {question.scale_labels && (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
                    {question.scale_labels.min}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
                    {question.scale_labels.max}
                  </span>
                </>
              )}
            </div>
            <div className="flex justify-center space-x-3">
              {Array.from({ length: (question.scale_max || 5) - (question.scale_min || 1) + 1 }, (_, i) => {
                const value = (question.scale_min || 1) + i
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={scaleValue === value ? "default" : "outline"}
                    size="lg"
                    onClick={() => updateResponse(question.id, value)}
                    className={cn(
                      "w-14 h-14 rounded-full font-medium transition-all duration-200",
                      scaleValue === value 
                        ? "bg-blue-600 text-white hover:bg-blue-700 scale-110 shadow-lg" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {value}
                  </Button>
                )
              })}
            </div>
          </div>
        )

      case 'rating_stars':
        const starRating = currentResponse?.answer as number || 0
        return (
          <div className="flex justify-center space-x-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => updateResponse(question.id, i + 1)}
                className="p-2"
              >
                <Star 
                  className={cn(
                    "h-8 w-8 transition-colors",
                    i < starRating 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-slate-300 dark:text-slate-600"
                  )}
                />
              </Button>
            ))}
          </div>
        )

      case 'yes_no':
        return (
          <RadioGroup
            value={currentResponse?.answer as string || ""}
            onValueChange={(value) => updateResponse(question.id, value)}
            className="flex space-x-6 justify-center"
          >
            <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <RadioGroupItem value="yes" id={`${question.id}-yes`} />
              <Label htmlFor={`${question.id}-yes`} className="cursor-pointer font-medium text-green-700 dark:text-green-400">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <RadioGroupItem value="no" id={`${question.id}-no`} />
              <Label htmlFor={`${question.id}-no`} className="cursor-pointer font-medium text-red-700 dark:text-red-400">
                No
              </Label>
            </div>
          </RadioGroup>
        )

      case 'text':
        return (
          <Input
            value={currentResponse?.answer as string || ""}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full text-base p-4 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
          />
        )

      case 'email':
        return (
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="email"
              value={currentResponse?.answer as string || ""}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder="your@email.com"
              className="w-full text-base p-4 pl-12 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
        )

      case 'phone':
        return (
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="tel"
              value={currentResponse?.answer as string || ""}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full text-base p-4 pl-12 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            value={currentResponse?.answer as string || ""}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Enter a number..."
            className="w-full text-base p-4 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
          />
        )

      case 'date':
        return (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="date"
              value={currentResponse?.answer as string || ""}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              className="w-full text-base p-4 pl-12 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
        )

      case 'textarea':
        return (
          <Textarea
            value={currentResponse?.answer as string || ""}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[120px] text-base p-4 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
            maxLength={1000}
          />
        )

      case 'dropdown':
        return (
          <Select
            value={currentResponse?.answer as string || ""}
            onValueChange={(value) => updateResponse(question.id, value)}
          >
            <SelectTrigger className="w-full text-base p-4 h-auto border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Choose an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option} className="text-base p-3">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'slider':
        const sliderValue = currentResponse?.answer as number || (question.scale_min || 0)
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              {question.scale_labels && (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
                    {question.scale_labels.min}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
                    {question.scale_labels.max}
                  </span>
                </>
              )}
            </div>
            <div className="px-3">
              <Slider
                value={[sliderValue]}
                onValueChange={(value) => updateResponse(question.id, value[0])}
                min={question.scale_min || 0}
                max={question.scale_max || 100}
                step={1}
                className="w-full"
              />
              <div className="text-center mt-4">
                <span className="text-2xl font-light text-slate-900 dark:text-white">{sliderValue}</span>
              </div>
            </div>
          </div>
        )

      case 'ranking':
        const rankingOptions = question.options || []
        const rankings = (currentResponse?.answer as string[]) || []
        const maxRankings = question.max_rankings || rankingOptions.length
        
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
              {question.max_rankings 
                ? `Rank your top ${question.max_rankings} preferences (1 = most preferred)`
                : "Rank these options in order of preference (1 = most preferred)"}
            </p>
            {rankingOptions.map((option, index) => {
              const currentRank = rankings.indexOf(option) + 1
              return (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Select
                    value={currentRank > 0 ? String(currentRank) : ""}
                    onValueChange={(value) => {
                      const newRankings = [...rankings]
                      const currentIndex = newRankings.indexOf(option)
                      
                      if (currentIndex >= 0) {
                        newRankings.splice(currentIndex, 1)
                      }
                      
                      if (value) {
                        const newPosition = parseInt(value) - 1
                        newRankings.splice(newPosition, 0, option)
                      }
                      
                      updateResponse(question.id, newRankings.slice(0, maxRankings))
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {Array.from({ length: maxRankings }, (_, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="flex-1 font-light">{option}</Label>
                </div>
              )
            })}
          </div>
        )

      case 'matrix':
        const matrixResponses = (currentResponse?.answer as Record<string, number>) || {}
        const scale = question.matrix_config?.scale || { min: 1, max: 5, labels: { min: "Low", max: "High" } }
        
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
                {scale.labels.min}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400 font-light">
                {scale.labels.max}
              </span>
            </div>
            
            {question.options?.map((statement, index) => (
              <div key={index} className="space-y-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="font-light text-slate-900 dark:text-white">{statement}</div>
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
                    const value = scale.min + i
                    const isSelected = matrixResponses[statement] === value
                    return (
                      <Button
                        key={value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newResponses = { ...matrixResponses, [statement]: value }
                          updateResponse(question.id, newResponses)
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full",
                          isSelected && "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                      >
                        {value}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )

      case 'contact_info':
        const contactData = (currentResponse?.answer as Record<string, string>) || {}
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${question.id}-first`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  First Name
                </Label>
                <Input
                  id={`${question.id}-first`}
                  value={contactData.firstName || ""}
                  onChange={(e) => updateResponse(question.id, { ...contactData, firstName: e.target.value })}
                  placeholder="First name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${question.id}-last`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Last Name
                </Label>
                <Input
                  id={`${question.id}-last`}
                  value={contactData.lastName || ""}
                  onChange={(e) => updateResponse(question.id, { ...contactData, lastName: e.target.value })}
                  placeholder="Last name"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`${question.id}-email`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </Label>
              <Input
                id={`${question.id}-email`}
                type="email"
                value={contactData.email || ""}
                onChange={(e) => updateResponse(question.id, { ...contactData, email: e.target.value })}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${question.id}-phone`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Phone Number (Optional)
              </Label>
              <Input
                id={`${question.id}-phone`}
                type="tel"
                value={contactData.phone || ""}
                onChange={(e) => updateResponse(question.id, { ...contactData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="mt-1"
              />
            </div>
          </div>
        )

      case 'file_upload':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                PNG, JPG, PDF up to 10MB
              </p>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    updateResponse(question.id, file.name)
                  }
                }}
                className="hidden"
                accept=".png,.jpg,.jpeg,.pdf"
              />
            </div>
            {currentResponse?.answer && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Selected: {currentResponse.answer as string}
              </p>
            )}
          </div>
        )

      case 'statement':
        return (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-slate-700 dark:text-slate-300 font-light leading-relaxed">
              {question.question}
            </p>
          </div>
        )

      case 'likert':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2 text-center text-sm mb-6">
              <div></div>
              <div className="text-slate-600 dark:text-slate-400 font-light">Strongly Disagree</div>
              <div className="text-slate-600 dark:text-slate-400 font-light">Disagree</div>
              <div className="text-slate-600 dark:text-slate-400 font-light">Neutral</div>
              <div className="text-slate-600 dark:text-slate-400 font-light">Agree</div>
              <div className="text-slate-600 dark:text-slate-400 font-light">Strongly Agree</div>
            </div>
            {question.options?.map((statement, index) => (
              <div key={index} className="grid grid-cols-6 gap-2 items-center border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
                <div className="text-sm font-light pr-4">{statement}</div>
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
        return (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            Question type "{question.type}" not yet implemented
          </div>
        )
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