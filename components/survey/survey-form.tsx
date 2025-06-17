"use client"

import { useState, useEffect, useCallback } from "react"
import { useGlobalAudio } from "@/components/global-audio-controls"
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
  const { 
    readContentWithSettings, 
    autoPlayEnabled,
    playText 
  } = useGlobalAudio()
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

  // Auto-read questions when they change (if audio is enabled)
  useEffect(() => {
    if (currentQuestion && autoPlayEnabled) {
      const questionText = [
        currentQuestion.question,
        currentQuestion.description,
        ...(currentQuestion.options || [])
      ].filter(Boolean).join('. ')
      
      // Small delay to let the UI update
      const timer = setTimeout(() => {
        readContentWithSettings(questionText)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [currentQuestionIndex, currentQuestion, autoPlayEnabled, readContentWithSettings])

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
    <div className={cn("max-w-5xl mx-auto space-y-8", className)} data-audio-content="true">
      {/* Enhanced Progress header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight" data-question-content="true">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed" data-question-content="true">
                {survey.description}
              </p>
            )}
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Question {currentQuestionIndex + 1} of {visibleQuestions.length}
            </div>
            {survey.estimated_time && (
              <div className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                Est. {survey.estimated_time} min
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Progress
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-3" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse opacity-50 rounded-full"></div>
          </div>
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>{answeredQuestions} of {visibleQuestions.length} answered</span>
            <span>{visibleQuestions.length - answeredQuestions} remaining</span>
          </div>
        </div>
      </div>

      {/* Enhanced Question card */}
      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-black/20 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="pb-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                  {currentQuestion.type.replace('_', ' ').toUpperCase()}
                </Badge>
                {currentQuestion.required && (
                  <Badge variant="destructive" className="text-xs font-medium px-3 py-1">
                    REQUIRED
                  </Badge>
                )}
                {/* Audio play button for current question */}
                <button
                  onClick={() => {
                    const questionText = [
                      currentQuestion.question,
                      currentQuestion.description,
                      ...(currentQuestion.options || [])
                    ].filter(Boolean).join('. ')
                    playText(questionText, { forcePlay: true })
                  }}
                  className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                  title="Read question aloud"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.025 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.025l4.358-3.824a1 1 0 011-.1z" clipRule="evenodd" />
                    <path d="M14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.983 3.983 0 0013 10a3.983 3.983 0 00-1.172-2.829 1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
              <CardTitle className="text-2xl font-light text-slate-900 dark:text-white leading-relaxed" data-question-content="true">
                {currentQuestion.question}
              </CardTitle>
              {currentQuestion.description && (
                <p className="text-base text-slate-600 dark:text-slate-400 font-light leading-relaxed" data-question-content="true">
                  {currentQuestion.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 space-y-8">
          <div className="min-h-[300px]">
            {renderQuestion(currentQuestion)}
          </div>
          
          {/* Enhanced Navigation */}
          <div className="flex items-center justify-between pt-8 border-t-2 border-slate-100 dark:border-slate-800">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className={cn(
                  "flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all duration-200",
                  isFirstQuestion 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="font-medium">Previous</span>
              </Button>
              
              {survey.allow_partial_responses && onSaveProgress && (
                <Button
                  variant="ghost"
                  onClick={handleSaveProgress}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800"
                >
                  <Save className="h-4 w-4" />
                  <span className="font-medium">Save Progress</span>
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "flex items-center space-x-3 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300",
                    "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
                    "text-white shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40",
                    "hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  )}
                >
                  <Send className="h-5 w-5" />
                  <span>{isSubmitting ? "Submitting..." : "Complete Survey"}</span>
                  {!isSubmitting && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className={cn(
                    "flex items-center space-x-2 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300",
                    "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
                    "text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40",
                    "hover:scale-105"
                  )}
                >
                  <span>Continue</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Survey info footer */}
      <div className="text-center space-y-4 py-6">
        {survey.allow_anonymous && (
          <div className="inline-flex items-center space-x-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Anonymous Survey - Your identity is protected</span>
          </div>
        )}
        
        <div className="flex justify-center space-x-6 text-xs text-slate-500 dark:text-slate-500">
          <span>Time elapsed: {Math.floor((Date.now() - startTime.getTime()) / 60000)} minutes</span>
          <span>•</span>
          <span>Questions remaining: {visibleQuestions.length - currentQuestionIndex - 1}</span>
        </div>
      </div>
    </div>
  )
} 