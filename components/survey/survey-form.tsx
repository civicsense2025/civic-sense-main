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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

  // Helper function to format answer display for popover
  const formatAnswerForDisplay = (question: SurveyQuestion, response: SurveyResponse) => {
    if (!response) return "Not answered"
    
    const { answer } = response
    
    switch (question.type) {
      case 'multiple_choice':
      case 'yes_no':
      case 'dropdown':
        return answer as string
      
      case 'multiple_select':
        const selections = answer as string[]
        return selections.length > 0 ? selections.join(', ') : "None selected"
      
      case 'scale':
      case 'rating_stars':
      case 'number':
        return `${answer}`
      
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'date':
        const textAnswer = answer as string
        return textAnswer.length > 50 ? `${textAnswer.substring(0, 50)}...` : textAnswer
      
      case 'slider':
        return `${answer}${question.scale_labels ? ` (${question.scale_labels.min} - ${question.scale_labels.max})` : ''}`
      
      case 'matrix':
        const matrixData = answer as Record<string, number>
        const answered = Object.keys(matrixData).length
        const total = question.options?.length || 0
        return `${answered}/${total} items rated`
      
      case 'ranking':
        const rankings = answer as string[]
        return rankings.length > 0 ? `${rankings.length} items ranked` : "None ranked"
      
      case 'contact_info':
        const contactData = answer as Record<string, string>
        return contactData.email || contactData.firstName || "Contact info provided"
      
      case 'file_upload':
        return answer as string || "File uploaded"
      
      case 'statement':
        return "Statement viewed"
      
      case 'likert':
        return "Likert scale answered"
      
      default:
        return "Answered"
    }
  }

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
            {question.options?.map((option, index) => {
              const isSelected = (currentResponse?.answer as string) === option
              return (
                <div key={index} className={cn(
                  "relative flex items-center space-x-4 p-6 rounded-2xl transition-all duration-300 cursor-pointer group",
                  "hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50",
                  isSelected 
                    ? "bg-blue-50 dark:bg-blue-950/20 shadow-sm" 
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}>
                  {/* Custom selection indicator */}
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                    isSelected 
                      ? "border-blue-600 bg-blue-600" 
                      : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                  )}>
                    {isSelected && (
                      <div className="w-3 h-3 bg-white rounded-full animate-in zoom-in-50 duration-200" />
                    )}
                  </div>
                  
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} className="sr-only" />
                  <Label htmlFor={`${question.id}-${index}`} className={cn(
                    "flex-1 cursor-pointer transition-colors text-base leading-relaxed",
                    isSelected 
                      ? "text-blue-900 dark:text-blue-100 font-medium" 
                      : "text-slate-700 dark:text-slate-200 font-light group-hover:text-slate-900 dark:group-hover:text-white"
                  )}>
                    {option}
                  </Label>
                  
                  {/* Subtle selection indicator */}
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-in zoom-in-50 duration-200" />
                  )}
                </div>
              )
            })}
          </RadioGroup>
        )

      case 'multiple_select':
        const selectedOptions = (currentResponse?.answer as string[]) || []
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isSelected = selectedOptions.includes(option)
              return (
                <div key={index} className={cn(
                  "relative flex items-center space-x-4 p-6 rounded-2xl transition-all duration-300 cursor-pointer group",
                  "hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50",
                  isSelected 
                    ? "bg-blue-50 dark:bg-blue-950/20 shadow-sm" 
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}>
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={isSelected}
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
                    className={cn(
                      "w-5 h-5 border-2 transition-all duration-200",
                      isSelected 
                        ? "border-blue-600 bg-blue-600" 
                        : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                    )}
                  />
                  <Label htmlFor={`${question.id}-${index}`} className={cn(
                    "flex-1 cursor-pointer transition-colors text-base leading-relaxed",
                    isSelected 
                      ? "text-blue-900 dark:text-blue-100 font-medium" 
                      : "text-slate-700 dark:text-slate-200 font-light group-hover:text-slate-900 dark:group-hover:text-white"
                  )}>
                    {option}
                  </Label>
                  
                  {/* Selection count indicator */}
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-in zoom-in-50 duration-200" />
                  )}
                </div>
              )
            })}
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
          <div className="space-y-8">
            {question.scale_labels && (
              <div className="flex justify-between items-center px-4">
                <div className="text-center">
                  <div className="text-sm font-light text-slate-900 dark:text-white mb-2 font-mono" style={{ fontFamily: 'Space Mono, monospace' }} data-question-content="true">
                    {question.scale_labels.min}
                  </div>
                  <div className="w-12 h-1 bg-red-200 dark:bg-red-800 rounded-full mx-auto"></div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-light text-slate-900 dark:text-white mb-2 font-mono" style={{ fontFamily: 'Space Mono, monospace' }} data-question-content="true">
                    {question.scale_labels.max}
                  </div>
                  <div className="w-12 h-1 bg-green-200 dark:bg-green-800 rounded-full mx-auto"></div>
                </div>
              </div>
            )}
            
            <div className="relative">
              {/* Background progress bar */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-200 dark:bg-slate-700 rounded-full transform -translate-y-1/2"></div>
              
              <div className="flex justify-between relative z-10">
                {Array.from({ length: (question.scale_max || 5) - (question.scale_min || 1) + 1 }, (_, i) => {
                  const value = (question.scale_min || 1) + i
                  const minVal = question.scale_min || 1
                  const maxVal = question.scale_max || 5
                  const range = maxVal - minVal
                  const position = (value - minVal) / range
                  
                  // Determine if this is a low (red) or high (green) value
                  const isLowValue = position <= 0.4
                  const isHighValue = position >= 0.6
                  
                  let selectedColors = "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30 scale-115 ring-4 ring-blue-600/20"
                  let indicatorColor = "bg-blue-500"
                  
                  if (scaleValue === value) {
                    if (isLowValue) {
                      selectedColors = "bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/30 scale-115 ring-4 ring-red-500/20"
                      indicatorColor = "bg-red-400"
                    } else if (isHighValue) {
                      selectedColors = "bg-green-500 border-green-500 text-white shadow-xl shadow-green-500/30 scale-115 ring-4 ring-green-500/20"
                      indicatorColor = "bg-green-400"
                    }
                  }
                  
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => updateResponse(question.id, value)}
                      className={cn(
                        "w-16 h-16 rounded-full font-bold text-lg transition-all duration-300 transform border-2 relative",
                        "hover:scale-110 hover:shadow-lg focus-visible:scale-110 focus-visible:shadow-lg",
                        scaleValue === value 
                          ? selectedColors
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      )}
                    >
                      {value}
                      {scaleValue === value && (
                        <div className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse", indicatorColor)}></div>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
            
            {scaleValue > 0 && (
              <div className="text-center space-y-2">
                {(() => {
                  const minVal = question.scale_min || 1
                  const maxVal = question.scale_max || 5
                  const range = maxVal - minVal
                  const position = (scaleValue - minVal) / range
                  
                  const isLowValue = position <= 0.4
                  const isHighValue = position >= 0.6
                  
                  let bgColor = "bg-blue-50 dark:bg-blue-950/20"
                  let textColor = "text-blue-900 dark:text-blue-100"
                  let subTextColor = "text-blue-700 dark:text-blue-300"
                  
                  if (isLowValue) {
                    bgColor = "bg-red-50 dark:bg-red-950/20"
                    textColor = "text-red-900 dark:text-red-100"
                    subTextColor = "text-red-700 dark:text-red-300"
                  } else if (isHighValue) {
                    bgColor = "bg-green-50 dark:bg-green-950/20"
                    textColor = "text-green-900 dark:text-green-100"
                    subTextColor = "text-green-700 dark:text-green-300"
                  }
                  
                  return (
                    <div className={cn("inline-flex items-center space-x-2 px-4 py-2 rounded-full", bgColor)}>
                      <span className={cn("text-lg font-medium", textColor)}>
                        {scaleValue}
                      </span>
                      <span className={cn("text-sm", subTextColor)}>
                        selected
                      </span>
                    </div>
                  )
                })()}
              </div>
            )}
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
            className="w-full text-base p-6 border-0 bg-slate-50 dark:bg-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300"
          />
        )

      case 'email':
        return (
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="email"
              value={currentResponse?.answer as string || ""}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder="your@email.com"
              className="w-full text-base p-6 pl-14 border-0 bg-slate-50 dark:bg-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300"
            />
          </div>
        )

      case 'phone':
        return (
          <div className="relative">
            <Phone className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="tel"
              value={currentResponse?.answer as string || ""}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full text-base p-6 pl-14 border-0 bg-slate-50 dark:bg-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300"
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
            className="w-full text-base p-6 border-0 bg-slate-50 dark:bg-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300"
          />
        )

      case 'date':
        return (
          <div className="relative">
            <Calendar className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="date"
              value={currentResponse?.answer as string || ""}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              className="w-full text-base p-6 pl-14 border-0 bg-slate-50 dark:bg-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300"
            />
          </div>
        )

      case 'textarea':
        return (
          <Textarea
            value={currentResponse?.answer as string || ""}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[120px] text-base p-6 border-0 bg-slate-50 dark:bg-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300 resize-none"
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
          <div className="space-y-6">
            {/* Enhanced header with Space Mono font */}
            <div className="flex justify-between items-center px-4">
              <div className="text-center">
                <div className="text-sm font-light text-slate-900 dark:text-white mb-2 font-mono" style={{ fontFamily: 'Space Mono, monospace' }} data-question-content="true">
                  {scale.labels.min}
                </div>
                <div className="w-12 h-1 bg-red-200 dark:bg-red-800 rounded-full mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="text-sm font-light text-slate-900 dark:text-white mb-2 font-mono" style={{ fontFamily: 'Space Mono, monospace' }} data-question-content="true">
                  {scale.labels.max}
                </div>
                <div className="w-12 h-1 bg-green-200 dark:bg-green-800 rounded-full mx-auto"></div>
              </div>
            </div>
            
            {/* Enhanced matrix items */}
            <div className="space-y-6">
              {question.options?.map((statement, index) => {
                const isRated = matrixResponses[statement] !== undefined
                return (
                  <div key={index} className={cn(
                    "relative p-6 rounded-2xl transition-all duration-300",
                    "bg-white dark:bg-slate-900 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-800/50",
                    isRated 
                      ? "shadow-sm border border-slate-200 dark:border-slate-700" 
                      : "border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                  )}>
                    {/* Completion indicator */}
                    {isRated && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="font-light text-slate-900 dark:text-white text-base leading-relaxed" data-question-content="true">
                        {statement}
                      </div>
                      
                      <div className="flex justify-between">
                        {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
                          const value = scale.min + i
                          const isSelected = matrixResponses[statement] === value
                          const range = scale.max - scale.min
                          const position = (value - scale.min) / range
                          
                          // Determine color based on position (1=red, 5=green)
                          const isLowValue = position <= 0.25    // 1
                          const isLowMidValue = position <= 0.5   // 2
                          const isMidValue = position <= 0.75     // 3
                          const isHighMidValue = position <= 1.0  // 4
                          const isHighValue = position === 1.0    // 5
                          
                          let selectedColors = "bg-slate-600 border-slate-600 text-white shadow-lg shadow-slate-600/30"
                          let indicatorColor = "bg-slate-500"
                          
                          if (isSelected) {
                            if (isLowValue) {
                              selectedColors = "bg-red-400 border-red-400 text-white shadow-lg shadow-red-400/30"
                              indicatorColor = "bg-red-300"
                            } else if (isLowMidValue) {
                              selectedColors = "bg-orange-400 border-orange-400 text-white shadow-lg shadow-orange-400/30"
                              indicatorColor = "bg-orange-300"
                            } else if (isMidValue) {
                              selectedColors = "bg-yellow-400 border-yellow-400 text-white shadow-lg shadow-yellow-400/30"
                              indicatorColor = "bg-yellow-300"
                            } else if (isHighMidValue && !isHighValue) {
                              selectedColors = "bg-lime-400 border-lime-400 text-white shadow-lg shadow-lime-400/30"
                              indicatorColor = "bg-lime-300"
                            } else if (isHighValue) {
                              selectedColors = "bg-green-400 border-green-400 text-white shadow-lg shadow-green-400/30"
                              indicatorColor = "bg-green-300"
                            }
                          }
                          
                          return (
                            <Button
                              key={value}
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newResponses = { ...matrixResponses, [statement]: value }
                                updateResponse(question.id, newResponses)
                              }}
                              className={cn(
                                "w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 border-2 relative",
                                "hover:scale-110 hover:shadow-lg focus-visible:scale-110",
                                isSelected 
                                  ? selectedColors
                                  : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                              )}
                            >
                              {value}
                              {isSelected && (
                                <div className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse", indicatorColor)}></div>
                              )}
                            </Button>
                          )
                        })}
                      </div>
                      
                      {/* Show selected value */}
                      {matrixResponses[statement] && (
                        <div className="text-center">
                          {(() => {
                            const selectedValue = matrixResponses[statement]
                            const range = scale.max - scale.min
                            const position = (selectedValue - scale.min) / range
                            
                            let bgColor = "bg-slate-50 dark:bg-slate-900/20"
                            let textColor = "text-slate-900 dark:text-slate-100"
                            
                            if (position <= 0.25) {
                              bgColor = "bg-red-50 dark:bg-red-950/20"
                              textColor = "text-red-900 dark:text-red-100"
                            } else if (position <= 0.5) {
                              bgColor = "bg-orange-50 dark:bg-orange-950/20"
                              textColor = "text-orange-900 dark:text-orange-100"
                            } else if (position <= 0.75) {
                              bgColor = "bg-yellow-50 dark:bg-yellow-950/20"
                              textColor = "text-yellow-900 dark:text-yellow-100"
                            } else if (position < 1.0) {
                              bgColor = "bg-lime-50 dark:bg-lime-950/20"
                              textColor = "text-lime-900 dark:text-lime-100"
                            } else {
                              bgColor = "bg-green-50 dark:bg-green-950/20"
                              textColor = "text-green-900 dark:text-green-100"
                            }
                            
                            return (
                              <div className={cn("inline-flex items-center space-x-2 px-3 py-1 rounded-full", bgColor)}>
                                <span className={cn("text-sm font-medium", textColor)}>
                                  Rated: {selectedValue}
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Progress indicator */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Progress: {Object.keys(matrixResponses).length} of {question.options?.length || 0} items rated
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {Math.round((Object.keys(matrixResponses).length / (question.options?.length || 1)) * 100)}%
                </span>
              </div>
            </div>
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
      {/* Clean Progress header */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight" data-question-content="true">
              {survey.title}
            </h1>
            {survey.estimated_time && (
              <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-light">
                Est. {survey.estimated_time} min
              </div>
            )}
          </div>
          {survey.description && (
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed" data-question-content="true">
              {survey.description}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Progress
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {Math.round(progress)}%
            </span>
          </div>
          
          {/* Progress Bar with Clean Notches */}
          <div className="relative">
            <TooltipProvider>
              <div className="flex items-center gap-1 py-2">
                {visibleQuestions.map((question, index) => {
                  const isAnswered = !!responses[question.id]
                  const isCurrent = index === currentQuestionIndex
                  const isPast = index < currentQuestionIndex
                  const questionResponse = responses[question.id]
                  
                  return (
                    <Tooltip key={question.id}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "relative flex-1 h-3 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                            "hover:h-4 hover:shadow-md",
                            isCurrent 
                              ? "bg-blue-500 shadow-sm shadow-blue-500/30" 
                              : isAnswered 
                              ? "bg-green-400 shadow-sm shadow-green-400/20" 
                              : isPast 
                              ? "bg-slate-300 dark:bg-slate-600" 
                              : "bg-slate-200 dark:bg-slate-700"
                          )}
                          onClick={() => {
                            if (index < currentQuestionIndex || (index === currentQuestionIndex)) {
                              setCurrentQuestionIndex(index)
                            }
                          }}
                          disabled={index > currentQuestionIndex}
                        >
                          {/* Completion indicator for answered questions */}
                          {isAnswered && !isCurrent && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Required indicator */}
                          {question.required && !isAnswered && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="max-w-sm p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/20"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-light text-slate-900 dark:text-white">
                              Question {index + 1}
                              {question.required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs px-3 py-1 rounded-full font-light",
                                isAnswered 
                                  ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300 border border-green-200 dark:border-green-800" 
                                  : isCurrent 
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
                                  : "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              )}
                            >
                              {isAnswered ? "Answered" : isCurrent ? "Current" : "Pending"}
                            </Badge>
                          </div>
                          <div className="text-sm font-light leading-relaxed text-slate-700 dark:text-slate-300">
                            {question.question.length > 100 
                              ? `${question.question.substring(0, 100)}...` 
                              : question.question}
                          </div>
                          {questionResponse && (
                            <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                              <div className="text-xs font-medium mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Your answer:
                              </div>
                              <div className="text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 p-3 rounded-xl font-light leading-relaxed border border-slate-200/50 dark:border-slate-700/50">
                                {formatAnswerForDisplay(question, questionResponse)}
                              </div>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>
          </div>
          
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 pt-4">
            <span>{answeredQuestions} of {visibleQuestions.length} answered</span>
            <span>{visibleQuestions.length - answeredQuestions} remaining</span>
          </div>
        </div>
      </div>

      {/* Clean Question card */}
      <Card className="border-0 bg-white dark:bg-slate-950 rounded-3xl overflow-hidden">
        <CardHeader className="pb-8 pt-12 px-12 bg-gradient-to-br from-slate-50/80 to-blue-50/40 dark:from-slate-900/80 dark:to-blue-950/40">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {currentQuestion.required && (
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  )}
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {currentQuestion.type.replace('_', ' ')}
                  </span>
                </div>
                
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
                  className="ml-auto p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800"
                  title="Read question aloud"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.025 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.025l4.358-3.824a1 1 0 011-.1z" clipRule="evenodd" />
                    <path d="M14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.983 3.983 0 0013 10a3.983 3.983 0 00-1.172-2.829 1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
              <CardTitle className="text-3xl font-light text-slate-900 dark:text-white leading-tight tracking-tight mt-6" data-question-content="true">
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
        
        <CardContent className="px-12 pt-8 pb-12 space-y-12">
          <div className="min-h-[250px] flex items-center justify-center">
            <div className="w-full max-w-2xl">
              {renderQuestion(currentQuestion)}
            </div>
          </div>
          
          {/* Clean Navigation */}
          <div className="flex items-center justify-between pt-8">
            <div>
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className={cn(
                  "flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300",
                  isFirstQuestion 
                    ? "opacity-30 cursor-not-allowed" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="font-light">Previous</span>
              </Button>
            </div>
            
            <div className="flex space-x-4">
              {survey.allow_partial_responses && onSaveProgress && (
                <Button
                  variant="ghost"
                  onClick={handleSaveProgress}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-300"
                >
                  <Save className="h-4 w-4" />
                  <span className="font-light">Save Progress</span>
                </Button>
              )}
              
              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "flex items-center space-x-3 px-8 py-4 rounded-full text-base font-light transition-all duration-300",
                    "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900",
                    "text-white hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? "Submitting..." : "Complete Survey"}</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className={cn(
                    "flex items-center space-x-3 px-8 py-4 rounded-full text-base font-light transition-all duration-300",
                    "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900",
                    "text-white hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/20"
                  )}
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clean Survey info footer */}
      <div className="text-center space-y-6 py-8">
        {survey.allow_anonymous && (
          <div className="inline-flex items-center space-x-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 px-6 py-3 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-light">Anonymous Survey - Your identity is protected</span>
          </div>
        )}
        
        <div className="flex justify-center space-x-8 text-sm text-slate-400 dark:text-slate-500 font-light">
          <span>Time elapsed: {Math.floor((Date.now() - startTime.getTime()) / 60000)} minutes</span>
          <span>•</span>
          <span>Questions remaining: {visibleQuestions.length - currentQuestionIndex - 1}</span>
        </div>
      </div>
    </div>
  )
} 