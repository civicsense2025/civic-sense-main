"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useGlobalAudio } from "@/components/global-audio-controls"
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Badge } from './ui/badge'
import { useToast } from "../../components/ui"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { cn } from '@civicsense/business-logic/utils'
import { ChevronLeft, ChevronRight, Save, Send, Star, Upload, Calendar, Phone, Mail, Keyboard } from "lucide-react"
import { 
  useProgressStorage, 
  convertSurveyStateToBaseSurvey, 
  convertBaseSurveyStateToSurvey,
  type SurveyResponse as StorageSurveyResponse 
} from '@civicsense/business-logic/services/progress'
import { MultipleChoice, MultipleSelect, ScaleRating, StarRating, MatrixGrid, TextInput, SliderInput, Ranking, DynamicContent } from "./questions"
import { PostCompletionContent } from "./post-completion-content"

// Survey Types
export interface SurveyQuestion {
  id: string
  type: 'multiple_choice' | 'multiple_select' | 'scale' | 'text' | 'textarea' | 'ranking' | 'likert' | 
        'matrix' | 'slider' | 'date' | 'email' | 'phone' | 'number' | 'dropdown' | 'image_choice' | 
        'file_upload' | 'rating_stars' | 'yes_no' | 'statement' | 'contact_info' | 'dynamic_content'
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
  dynamic_config?: {
    contentType: 'quiz_question' | 'article' | 'topic' | 'custom'
    contentId?: string
    apiEndpoint?: string
    displayFields: string[]
    questionType: 'rating_stars' | 'scale' | 'text' | 'multiple_choice'
    questionPrompt: string
    scaleConfig?: {
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
  post_completion_config?: {
    enabled: boolean
    type: 'redirect' | 'content' | 'recommendations' | 'learning_path' | 'mixed'
    redirect_url?: string
    redirect_delay?: number
    title?: string
    message?: string
    show_recommendations?: boolean
    show_learning_goals?: boolean
    show_related_content?: boolean
    custom_content?: string
    cta_text?: string
    cta_url?: string
    show_stats?: boolean
  }
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
  sessionId?: string
  className?: string
  showCompleted?: boolean // New prop to show completion state
  completedResponses?: SurveyResponse[] // For showing completed survey responses
}

export function SurveyForm({ 
  survey, 
  onComplete, 
  onSaveProgress,
  existingResponses = [],
  sessionId,
  className,
  showCompleted = false,
  completedResponses = []
}: SurveyFormProps) {
  const { toast } = useToast()
  const { 
    readContentWithSettings, 
    autoPlayEnabled,
    playText 
  } = useGlobalAudio()
  const progressStorage = useProgressStorage()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, SurveyResponse>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState(new Date())
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showRequiredFeedback, setShowRequiredFeedback] = useState(false)
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null)
  const [showPostCompletion, setShowPostCompletion] = useState(false)
  const [completionResponses, setCompletionResponses] = useState<SurveyResponse[]>([])

  // Refs for focus management
  const questionCardRef = useRef<HTMLDivElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const currentQuestionRef = useRef<HTMLDivElement>(null)

  // Generate sessionId if not provided
  const effectiveSessionId = sessionId || `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Initialize responses from existing data or localStorage
  useEffect(() => {
    if (hasRestoredProgress) return

    // First try to restore from localStorage
    const progressManager = progressStorage.createSurveyProgress(survey.id, effectiveSessionId)
    const savedState = progressManager.load()

    if (savedState) {
      console.log('🔄 Restoring survey progress from localStorage')
      const surveyState = convertBaseSurveyStateToSurvey(savedState)
      setResponses(surveyState.responses)
      setCurrentQuestionIndex(surveyState.currentQuestionIndex)
      setHasRestoredProgress(true)
      
      toast({
        title: "Progress restored",
        description: "Continuing where you left off.",
        duration: 3000
      })
      return
    }

    // Fallback to existing responses from API
    if (existingResponses.length > 0) {
      console.log('🔄 Loading existing responses from API')
      const initialResponses: Record<string, SurveyResponse> = {}
      existingResponses.forEach(response => {
        initialResponses[response.question_id] = response
      })
      setResponses(initialResponses)
    }

    setHasRestoredProgress(true)
  }, [survey.id, effectiveSessionId, existingResponses, hasRestoredProgress, progressStorage, toast])

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
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1
  const answeredQuestions = visibleQuestions.filter((q: SurveyQuestion) => responses[q.id]).length

  // Navigation keyboard shortcuts (only for survey-level navigation, not question-level)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input or if focus is on a question component
      const activeElement = document.activeElement
      const isTyping = activeElement && (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName) ||
        activeElement.hasAttribute('contenteditable')
      )
      
      // Don't interfere with question-level shortcuts - check if focus is within a question component
      const isWithinQuestion = activeElement?.closest('[data-question-id]') !== null

      if (isTyping || isWithinQuestion) {
        // Only handle global shortcuts that don't conflict with question shortcuts
        switch (e.key) {
          case 'Escape':
            e.preventDefault()
            setShowKeyboardShortcuts(false)
            setShowRequiredFeedback(false)
            // Return focus to question if shortcuts were open
            if (showKeyboardShortcuts && currentQuestionRef.current) {
              currentQuestionRef.current.focus()
            }
            break
          case 'F1':
          case '?':
            if (!isTyping) {
              e.preventDefault()
              setShowKeyboardShortcuts(!showKeyboardShortcuts)
            }
            break
        }
        return
      }

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault()
          // Allow advancing if question is answered or not required
          if (!currentQuestion?.required || responses[currentQuestion.id]) {
            handleNext()
          } else {
            // Show visual feedback for required question
            setShowRequiredFeedback(true)
            setTimeout(() => setShowRequiredFeedback(false), 3000)
          }
          break
        case 'p':
        case 'P':
          e.preventDefault()
          handlePrevious()
          break
        case 's':
        case 'S':
          if ((e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            if (survey.allow_partial_responses && onSaveProgress) {
              handleSaveProgress()
            }
          }
          break
        case 'Enter':
          if ((e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            if (isLastQuestion) {
              handleSubmit()
            } else {
              handleNext()
            }
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowKeyboardShortcuts(false)
          setShowRequiredFeedback(false)
          // Return focus to question if shortcuts were open
          if (showKeyboardShortcuts && currentQuestionRef.current) {
            currentQuestionRef.current.focus()
          }
          break
        case 'F1':
        case '?':
          e.preventDefault()
          setShowKeyboardShortcuts(!showKeyboardShortcuts)
          break
        case 'Home':
          e.preventDefault()
          setCurrentQuestionIndex(0)
          break
        case 'End':
          e.preventDefault()
          setCurrentQuestionIndex(visibleQuestions.length - 1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentQuestionIndex, survey.allow_partial_responses, onSaveProgress, isLastQuestion, showKeyboardShortcuts, currentQuestion, visibleQuestions.length, responses])

  // Focus management when questions change
  useEffect(() => {
    if (currentQuestionRef.current) {
      // Small delay to allow question to render
      setTimeout(() => {
        currentQuestionRef.current?.focus()
      }, 100)
    }
  }, [currentQuestionIndex])

  // Enhanced navigation handlers with focus management
  const handleNext = useCallback(() => {
    if (currentQuestion?.required && !responses[currentQuestion.id]) {
      toast({
        title: "Answer required",
        description: "Please answer this question before continuing.",
        variant: "destructive"
      })
      // Focus back to question area for accessibility
      currentQuestionRef.current?.focus()
      return
    }

    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      // Announce progress to screen readers
      setTimeout(() => {
        const progress = Math.round(((currentQuestionIndex + 2) / visibleQuestions.length) * 100)
        announce(`Question ${currentQuestionIndex + 2} of ${visibleQuestions.length}. ${progress}% complete.`)
      }, 200)
    }
  }, [currentQuestion, responses, currentQuestionIndex, visibleQuestions.length, toast])

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      // Announce progress to screen readers
      setTimeout(() => {
        const progress = Math.round((currentQuestionIndex / visibleQuestions.length) * 100)
        announce(`Question ${currentQuestionIndex} of ${visibleQuestions.length}. ${progress}% complete.`)
      }, 200)
    }
  }, [currentQuestionIndex, visibleQuestions.length])

  // Screen reader announcements
  const announce = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  // Save progress to localStorage whenever responses change
  useEffect(() => {
    if (!hasRestoredProgress || Object.keys(responses).length === 0) return

    const surveyState = {
      currentQuestionIndex,
      responses,
      questions: visibleQuestions,
      startTime: startTime.getTime(),
      sessionId: effectiveSessionId
    }

    const baseSurveyState = convertSurveyStateToBaseSurvey(surveyState)
    const progressManager = progressStorage.createSurveyProgress(survey.id, effectiveSessionId)
    progressManager.save(baseSurveyState)

    console.log('💾 Auto-saved survey progress to localStorage')
  }, [responses, currentQuestionIndex, visibleQuestions, startTime, effectiveSessionId, survey.id, hasRestoredProgress, progressStorage])

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

  // Debounced update response to improve responsiveness
  const updateResponse = useCallback((questionId: string, answer: string | string[] | number | Record<string, any>) => {
    const newResponse: SurveyResponse = {
      question_id: questionId,
      answer,
      answered_at: new Date().toISOString()
    }
    
    setResponses(prev => ({
      ...prev,
      [questionId]: newResponse
    }))
  }, [])

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
      
      // Show post-completion content if configured
      if (survey.post_completion_config?.enabled) {
        setCompletionResponses(responseArray)
        setShowPostCompletion(true)
      }
      
      await onComplete(responseArray)
      
      // Clear localStorage progress on successful completion
      const progressManager = progressStorage.createSurveyProgress(survey.id, effectiveSessionId)
      progressManager.clear()
      console.log('🗑️ Cleared survey progress after completion')
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

  // Format answer for display in tooltips and previews
  const formatAnswerForDisplay = (question: SurveyQuestion, response: SurveyResponse) => {
    const { answer } = response
    
    switch (question.type) {
      case 'multiple_choice':
      case 'dropdown':
      case 'yes_no':
        return String(answer)
      
      case 'multiple_select':
        if (Array.isArray(answer)) {
          return answer.join(', ')
        }
        return String(answer)
      
      case 'scale':
      case 'slider':
      case 'number':
        return `${answer}${question.scale_labels ? ` (${question.scale_labels.min} - ${question.scale_labels.max})` : ''}`
      
      case 'rating_stars':
        const rating = Number(answer)
        return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`
      
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
        const text = String(answer)
        return text.length > 100 ? `${text.substring(0, 100)}...` : text
      
      case 'date':
        if (typeof answer === 'string') {
          try {
            return new Date(answer).toLocaleDateString()
          } catch {
            return String(answer)
          }
        }
        return String(answer)
      
      case 'ranking':
        if (Array.isArray(answer)) {
          return answer.map((item, index) => `${index + 1}. ${item}`).join(', ')
        }
        return String(answer)
      
      case 'matrix':
        if (typeof answer === 'object' && answer !== null) {
          return Object.entries(answer)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        }
        return String(answer)
      
      case 'likert':
        return String(answer)
      
      case 'file_upload':
        if (typeof answer === 'object' && answer !== null && 'fileName' in answer) {
          return (answer as any).fileName
        }
        return 'File uploaded'
      
      case 'image_choice':
        return String(answer)
      
      case 'contact_info':
        if (typeof answer === 'object' && answer !== null) {
          const contact = answer as Record<string, string>
          const parts = []
          if (contact.name) parts.push(contact.name)
          if (contact.email) parts.push(contact.email)
          if (contact.phone) parts.push(contact.phone)
          return parts.join(', ')
        }
        return String(answer)
      
            case 'statement':
        return 'Acknowledged'
      
      case 'dynamic_content':
        if (typeof answer === 'number') {
          return `Rating: ${answer}`
        } else if (typeof answer === 'string') {
          return answer.length > 100 ? `${answer.substring(0, 100)}...` : answer
        }
        return 'Response provided'
      
      default:
        return String(answer)
    }
  }

  // Render question component based on type
  const renderQuestion = (question: SurveyQuestion) => {
    const currentResponse = responses[question.id]
    const currentValue = currentResponse?.answer

    const handleQuestionChange = (answer: string | string[] | number | Record<string, any>) => {
      updateResponse(question.id, answer)
    }

    switch (question.type) {
      case 'multiple_choice':
        return (
          <MultipleChoice
            questionId={question.id}
            options={question.options || []}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={handleQuestionChange}
          />
        )

      case 'multiple_select': {
        const multiValue = Array.isArray(currentValue) ? currentValue : []
        
        return (
          <MultipleSelect
            questionId={question.id}
            options={question.options || []}
            value={multiValue}
            onChange={handleQuestionChange}
            maxSelections={question.max_selections}
          />
        )
      }

      case 'scale':
        return (
          <ScaleRating
            questionId={question.id}
            min={question.scale_min || 1}
            max={question.scale_max || 5}
            value={typeof currentValue === 'number' ? currentValue : undefined}
            onChange={handleQuestionChange}
            labels={question.scale_labels}
          />
        )

      case 'slider':
        return (
          <SliderInput
            questionId={question.id}
            min={question.scale_min || 0}
            max={question.scale_max || 100}
            value={typeof currentValue === 'number' ? currentValue : question.scale_min || 0}
            onChange={handleQuestionChange}
            labels={question.scale_labels}
          />
        )

      case 'rating_stars':
        return (
          <StarRating
            questionId={question.id}
            value={typeof currentValue === 'number' ? currentValue : 0}
            onChange={handleQuestionChange}
            maxStars={5}
          />
        )

      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'date':
      case 'textarea':
        return (
          <TextInput
            questionId={question.id}
            type={question.type === 'textarea' ? 'textarea' : question.type}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={handleQuestionChange}
            required={question.required}
            maxLength={question.type === 'textarea' ? 1000 : undefined}
          />
        )

      case 'dropdown':
        return (
          <Select value={typeof currentValue === 'string' ? currentValue : ''} onValueChange={handleQuestionChange}>
            <SelectTrigger className="w-full p-4 border-2 rounded-2xl bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option} data-question-content="true">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'yes_no':
        return (
          <div className="flex space-x-4 justify-center">
            {['Yes', 'No'].map((option) => {
              const isSelected = currentValue === option
              return (
                <Button
                  key={option}
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => handleQuestionChange(option)}
                  className={cn(
                    "px-12 py-6 rounded-2xl font-medium text-lg transition-all duration-300 border-2",
                    isSelected 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  )}
                >
                  {option}
                </Button>
              )
            })}
          </div>
        )

      case 'matrix':
        if (question.matrix_config) {
          return (
            <MatrixGrid
              questionId={question.id}
              items={question.options || []}
              scale={question.matrix_config.scale}
              values={typeof currentValue === 'object' && currentValue !== null ? currentValue as Record<string, number> : {}}
              onChange={handleQuestionChange}
            />
          )
        }
        return <div>Matrix configuration missing</div>

      case 'ranking': {
        const rankingValue = Array.isArray(currentValue) ? currentValue : []

        return (
          <Ranking
            questionId={question.id}
            options={question.options || []}
            value={rankingValue}
            onChange={handleQuestionChange}
            maxRankings={question.max_rankings}
          />
        )
      }

      case 'file_upload':
        return (
          <div className="space-y-4" data-audio-content="true">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <div className="space-y-2">
                <div className="text-lg font-medium text-slate-900 dark:text-white">Upload a file</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Drag and drop or click to browse</div>
              </div>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleQuestionChange({
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type
                    })
                  }
                }}
                className="mt-4"
              />
            </div>
            {currentValue && typeof currentValue === 'object' && 'fileName' in currentValue && (
              <div className="text-center text-sm text-green-600 dark:text-green-400">
                ✓ {(currentValue as any).fileName} uploaded
              </div>
            )}
          </div>
        )

      case 'contact_info': {
        const contactValue = typeof currentValue === 'object' && currentValue !== null 
          ? currentValue as Record<string, string>
          : { name: '', email: '', phone: '' }

        return (
          <div className="space-y-6" data-audio-content="true">
            <div className="grid gap-4">
              <div>
                <Label htmlFor={`${question.id}-name`} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Name
                </Label>
                <Input
                  id={`${question.id}-name`}
                  value={contactValue.name || ''}
                  onChange={(e) => handleQuestionChange({ ...contactValue, name: e.target.value })}
                  placeholder="Your full name"
                  className="text-base p-4 border-2 rounded-2xl"
                />
              </div>
              <div>
                <Label htmlFor={`${question.id}-email`} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Email
                </Label>
                <Input
                  id={`${question.id}-email`}
                  type="email"
                  value={contactValue.email || ''}
                  onChange={(e) => handleQuestionChange({ ...contactValue, email: e.target.value })}
                  placeholder="your@email.com"
                  className="text-base p-4 border-2 rounded-2xl"
                />
              </div>
              <div>
                <Label htmlFor={`${question.id}-phone`} className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Phone
                </Label>
                <Input
                  id={`${question.id}-phone`}
                  type="tel"
                  value={contactValue.phone || ''}
                  onChange={(e) => handleQuestionChange({ ...contactValue, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="text-base p-4 border-2 rounded-2xl"
                />
              </div>
            </div>
          </div>
        )
      }

      case 'statement':
        return (
          <div className="space-y-6 text-center" data-audio-content="true">
            <div className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed" data-question-content="true">
              {question.description || "Please read and acknowledge the statement above."}
            </div>
            <Button
              type="button"
              onClick={() => handleQuestionChange('acknowledged')}
              className={cn(
                "px-8 py-4 rounded-2xl font-medium text-lg transition-all duration-300",
                currentValue === 'acknowledged'
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30"
              )}
            >
              {currentValue === 'acknowledged' ? '✓ Acknowledged' : 'I Understand'}
            </Button>
          </div>
        )

      case 'likert':
        const likertOptions = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        return (
          <div className="space-y-6" data-audio-content="true">
            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 px-4">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {likertOptions.map((option, index) => {
                const isSelected = currentValue === option
                return (
                  <Button
                    key={option}
                    type="button"
                    variant="ghost"
                    onClick={() => handleQuestionChange(option)}
                    className={cn(
                      "h-16 text-xs font-medium transition-all duration-300 border-2 rounded-xl",
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30" 
                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                    )}
                  >
                    <span className="text-center leading-tight" data-question-content="true">{option}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        )

      case 'dynamic_content':
        if (question.dynamic_config) {
          return (
            <DynamicContent
              questionId={question.id}
              config={question.dynamic_config}
              value={currentValue}
              onChange={handleQuestionChange}
            />
          )
        }
        return <div>Dynamic content configuration missing</div>

      default:
        return (
          <div className="text-center text-slate-500 dark:text-slate-400">
            Question type "{question.type}" not supported yet.
          </div>
        )
    }
  }

  // Show completed survey responses view
  if (showCompleted && completedResponses.length > 0) {
    return (
      <div className={cn("max-w-5xl mx-auto space-y-8", className)}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-6">📋</div>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white">
            Your Survey Responses
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            You completed "{survey.title}" on {new Date(completedResponses[0]?.answered_at || '').toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          {survey.questions.map((question, index) => {
            const response = completedResponses.find(r => r.question_id === question.id)
            if (!response) return null

            return (
              <Card key={question.id} className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                          Question {index + 1}
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {question.question}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {question.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-r-lg">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Your Answer:
                      </div>
                      <div className="text-slate-900 dark:text-white">
                        {formatAnswerForDisplay(question, response)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="px-8 py-3"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Show post-completion content
  if (showPostCompletion && survey.post_completion_config) {
    return (
      <div className={cn("max-w-5xl mx-auto space-y-8", className)}>
        <PostCompletionContent
          surveyId={survey.id}
          surveyTitle={survey.title}
          responses={completionResponses}
          config={survey.post_completion_config}
          onContinue={() => {
            setShowPostCompletion(false)
            // Optionally redirect to dashboard or show default completion
          }}
        />
      </div>
    )
  }

  if (!currentQuestion) {
    return <div>No questions available</div>
  }

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
            {/* Keyboard shortcuts help indicator */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKeyboardShortcuts(true)}
              className="ml-auto text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="Show keyboard shortcuts help"
              title="Press ? or F1 for keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </Button>
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
            <span className="text-center">{answeredQuestions} of {visibleQuestions.length} answered</span>
            <span className="text-center">{visibleQuestions.length - answeredQuestions} remaining</span>
          </div>
        </div>
      </div>

      {/* Clean Question card */}
      <Card 
        ref={questionCardRef}
        className="border-0 bg-white dark:bg-slate-950 rounded-3xl overflow-hidden"
        role="main"
        aria-labelledby="current-question-title"
        aria-describedby="current-question-description"
      >
        <CardHeader className="pb-8 pt-12 px-12 bg-gradient-to-br from-slate-50/80 to-blue-50/40 dark:from-slate-900/80 dark:to-blue-950/40">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {currentQuestion.required && (
                    <div 
                      className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                      aria-label="Required question"
                    ></div>
                  )}
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {currentQuestion.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Question {currentQuestionIndex + 1} of {visibleQuestions.length}
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
                  aria-label="Play audio for current question"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.025 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.025l4.358-3.824a1 1 0 011-.1z" clipRule="evenodd" />
                    <path d="M14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.983 3.983 0 0013 10a3.983 3.983 0 00-1.172-2.829 1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
              <CardTitle 
                id="current-question-title"
                className="text-3xl font-light text-slate-900 dark:text-white leading-tight tracking-tight mt-6" 
                data-question-content="true"
              >
                {currentQuestion.question}
              </CardTitle>
              {currentQuestion.description && (
                <p 
                  id="current-question-description"
                  className="text-base text-slate-600 dark:text-slate-400 font-light leading-relaxed" 
                  data-question-content="true"
                >
                  {currentQuestion.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-12 pt-8 pb-12 space-y-12">
          <div 
            ref={currentQuestionRef}
            className="min-h-[250px] flex items-center justify-center focus:outline-none"
            tabIndex={-1}
            role="group"
            aria-labelledby="current-question-title"
            aria-describedby={currentQuestion.description ? "current-question-description" : undefined}
          >
            <div className="w-full max-w-2xl">
              {renderQuestion(currentQuestion)}
            </div>
          </div>
          
          {/* Clean Navigation */}
          <div className="flex items-center justify-between pt-8" role="navigation" aria-label="Survey navigation">
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
                aria-label={`Go to previous question. Currently on question ${currentQuestionIndex + 1} of ${visibleQuestions.length}`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="font-light">Previous</span>
              </Button>
            </div>
            
            <div className="flex flex-col items-end space-y-3">
              {/* Required question feedback */}
              {showRequiredFeedback && (
                <div className="animate-in slide-in-from-bottom-2 duration-300 animate-out fade-out-0 duration-3000">
                  <div className="flex items-center space-x-2 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full border border-orange-200 dark:border-orange-800 shadow-lg">
                    <span className="animate-bounce">⚠️</span>
                    <span className="text-sm font-medium">
                      {currentQuestion?.required ? "This question is required!" : "Please answer to continue"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                {survey.allow_partial_responses && onSaveProgress && (
                  <Button
                    variant="ghost"
                    onClick={handleSaveProgress}
                    className="flex items-center space-x-2 px-6 py-3 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-300"
                    aria-label="Save current progress"
                  >
                    <Save className="h-4 w-4" />
                    <span className="font-light">Save Progress</span>
                  </Button>
                )}
                
                {isLastQuestion ? (
                  <Button
                    ref={submitButtonRef}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(
                      "flex items-center space-x-3 px-8 py-4 rounded-full text-base font-light transition-all duration-300 transform hover:scale-105",
                      "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white",
                      "shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                    aria-label="Submit completed survey"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? "Submitting..." : "Complete Survey"}</span>
                    {!isSubmitting && <span className="animate-pulse">🎉</span>}
                  </Button>
                ) : (
                  <Button
                    ref={nextButtonRef}
                    onClick={handleNext}
                    disabled={currentQuestion?.required && !responses[currentQuestion.id]}
                    className={cn(
                      "flex items-center space-x-3 px-8 py-4 rounded-full text-base font-light transition-all duration-300 transform hover:scale-105",
                      "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900",
                      "text-white hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/20",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                    aria-label={`Continue to next question. Currently on question ${currentQuestionIndex + 1} of ${visibleQuestions.length}`}
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-4 w-4" />
                    {responses[currentQuestion.id] && <span className="animate-bounce">✨</span>}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardShortcuts && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="shortcuts-title" className="text-2xl font-light text-slate-900 dark:text-white">
                <Keyboard className="inline w-6 h-6 mr-3" />
                Keyboard Shortcuts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
                aria-label="Close keyboard shortcuts help"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-3">Navigation</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Next question</span>
                    <div className="flex space-x-2">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">→</kbd>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">N</kbd>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Previous question</span>
                    <div className="flex space-x-2">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">←</kbd>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">P</kbd>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">First question</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Home</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Last question</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">End</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-3">Actions</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Submit/Continue</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Ctrl+Enter</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Save Progress</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Ctrl+S</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Show/Hide Help</span>
                    <div className="flex space-x-2">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">?</kbd>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">F1</kbd>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Close dialogs</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Escape</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-3">Multiple Choice</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Select option</span>
                    <div className="flex space-x-2">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">1-9</kbd>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">↑↓</kbd>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Confirm selection</span>
                    <div className="flex space-x-2">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Space</kbd>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Enter</kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Survey progress is automatically saved. You can return later to complete where you left off.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader live region for announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" id="survey-announcements"></div>

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