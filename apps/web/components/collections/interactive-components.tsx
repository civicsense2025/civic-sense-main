'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
// import useUIStrings from '@civicsense/shared/useUIStrings' // Temporarily removed
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  ExternalLink, 
  Clock,
  Target,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  Star,
  Calendar,
  Users,
  Lightbulb,
  AlertTriangle,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

// ============================================================================
// INTRO CARD COMPONENT
// ============================================================================

interface IntroCardProps {
  config: {
    type: 'intro_card'
    emoji: string
    subtitle: string
    background_color: string
    fact?: string
  }
  title: string
  content: string
  onComplete?: () => void
}

export function IntroCard({ config, title, content, onComplete }: IntroCardProps) {
  const { uiStrings } = useUIStrings()
  
  return (
    <Card 
      className="relative overflow-hidden"
      style={{ backgroundColor: config.background_color + '10' }}
    >
      <div 
        className="absolute inset-0 opacity-5"
        style={{ backgroundColor: config.background_color }}
      />
      <CardContent className="relative p-8 text-center">
        <div className="text-6xl mb-4">{config.emoji}</div>
        <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">
          {title}
        </h2>
        <p className="text-lg text-gray-100 mb-4 drop-shadow">
          {config.subtitle}
        </p>
        <div className="text-gray-200 leading-relaxed mb-6 drop-shadow">
          {content}
        </div>
        {config.fact && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
            <div className="text-white font-semibold text-lg">
              {config.fact}
            </div>
          </div>
        )}
        <Button 
          onClick={onComplete}
          className="bg-white text-gray-900 hover:bg-gray-100"
        >
          {uiStrings.collections.continueLearning}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SWIPE CARDS COMPONENT
// ============================================================================

interface SwipeCardsProps {
  config: {
    type: 'swipe_cards'
    cards: Array<{
      title: string
      content: string
    }>
  }
  onComplete?: () => void
}

export function SwipeCards({ config, onComplete }: SwipeCardsProps) {
  const { uiStrings } = useUIStrings()
  const [currentCard, setCurrentCard] = useState(0)
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set([0]))

  const handleNext = () => {
    if (currentCard < config.cards.length - 1) {
      const nextCard = currentCard + 1
      setCurrentCard(nextCard)
      setViewedCards(prev => new Set([...prev, nextCard]))
    }
  }

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
    }
  }

  const allViewed = viewedCards.size === config.cards.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{uiStrings.collections.compareAndContrast}</CardTitle>
          <div className="text-sm text-gray-500">
            {currentCard + 1} of {config.cards.length}
          </div>
        </div>
        <Progress value={((currentCard + 1) / config.cards.length) * 100} />
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {config.cards[currentCard].title}
          </h3>
          <div className="text-gray-700 whitespace-pre-line">
            {config.cards[currentCard].content}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentCard === 0}
          >
            {uiStrings.collections.previousCard}
          </Button>

          <div className="flex gap-2">
            {config.cards.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  viewedCards.has(index) ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentCard < config.cards.length - 1 ? (
            <Button onClick={handleNext}>
              {uiStrings.collections.nextCard}
            </Button>
          ) : (
            <Button 
              onClick={onComplete}
              disabled={!allViewed}
              className={allViewed ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {allViewed ? uiStrings.collections.complete : uiStrings.collections.viewAllCards}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// TIMELINE COMPONENT
// ============================================================================

interface TimelineProps {
  config: {
    type: 'timeline'
    events: Array<{
      date: string
      actor: string
      action: string
      result: string
    }>
  }
  title: string
  content: string
  onComplete?: () => void
}

export function Timeline({ config, title, content, onComplete }: TimelineProps) {
  const { uiStrings } = useUIStrings()
  const [viewedEvents, setViewedEvents] = useState<Set<number>>(new Set())

  const handleEventClick = (index: number) => {
    setViewedEvents(prev => new Set([...prev, index]))
  }

  const allViewed = viewedEvents.size === config.events.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-6">{content}</p>
        
        <div className="space-y-4">
          {config.events.map((event, index) => (
            <div
              key={index}
              className={`border-l-4 pl-4 pb-4 cursor-pointer transition-all ${
                viewedEvents.has(index) 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => handleEventClick(index)}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {event.date}
                </Badge>
                <Badge className="text-xs bg-purple-100 text-purple-800">
                  {event.actor}
                </Badge>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">
                {event.action}
              </h4>
              <p className="text-sm text-gray-600">
                Result: {event.result}
              </p>
              {viewedEvents.has(index) && (
                <CheckCircle className="h-4 w-4 text-blue-600 mt-2" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {uiStrings.collections.clickEachEvent.replace('{current}', viewedEvents.size.toString()).replace('{total}', config.events.length.toString())}
          </div>
          <Button 
            onClick={onComplete}
            disabled={!allViewed}
            className={allViewed ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {allViewed ? uiStrings.actions.continue : uiStrings.collections.exploreAllEvents}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MULTIPLE CHOICE COMPONENT
// ============================================================================

interface MultipleChoiceProps {
  config: {
    type: 'multiple_choice'
    options: string[]
    correct: number
    explanation: string
    hint?: string
  }
  question: string
  onComplete?: (correct: boolean) => void
}

export function MultipleChoice({ config, question, onComplete }: MultipleChoiceProps) {
  const { uiStrings } = useUIStrings()
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      setShowResult(true)
      const isCorrect = selectedAnswer === config.correct
      onComplete?.(isCorrect)
    }
  }

  const isCorrect = selectedAnswer === config.correct

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {uiStrings.collections.quickCheck}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">{question}</h3>

        <RadioGroup
          value={selectedAnswer?.toString() || ''}
          onValueChange={(value) => setSelectedAnswer(parseInt(value))}
          disabled={showResult}
          className="mb-6"
        >
          {config.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label 
                htmlFor={`option-${index}`}
                className={`flex-1 ${
                  showResult && index === config.correct
                    ? 'text-green-700 font-medium'
                    : showResult && selectedAnswer === index && index !== config.correct
                    ? 'text-red-700'
                    : ''
                }`}
              >
                {option}
                {showResult && index === config.correct && (
                  <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />
                )}
                {showResult && selectedAnswer === index && index !== config.correct && (
                  <XCircle className="inline h-4 w-4 ml-2 text-red-600" />
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {!showResult && config.hint && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {showHint ? uiStrings.collections.hideHint : uiStrings.collections.showHint}
            </Button>
            {showHint && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">{config.hint}</p>
              </div>
            )}
          </div>
        )}

        {showResult && (
          <div className={`p-4 rounded-lg mb-4 ${
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
                  {isCorrect ? uiStrings.collections.correct : uiStrings.collections.notQuiteRight}
                </h4>
                <p className={`text-sm mt-1 ${
                  isCorrect ? 'text-green-700' : 'text-blue-700'
                }`}>
                  {config.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-sm text-gray-500">
            {selectedAnswer !== null ? uiStrings.collections.answerSelected : uiStrings.collections.selectAnAnswer}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || showResult}
          >
            {showResult ? uiStrings.collections.complete : uiStrings.collections.submitAnswer}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// DRAG AND DROP COMPONENT
// ============================================================================

interface DragDropProps {
  config: {
    type: 'drag_drop'
    items: Array<{ id: string; text: string }>
    targets: Array<{ id: string; label: string; accepts: string[] }>
    feedback: { correct: string; incorrect: string }
  }
  title: string
  onComplete?: (correct: boolean) => void
}

export function DragDrop({ config, title, onComplete }: DragDropProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDrop = (targetId: string) => {
    if (draggedItem) {
      setAssignments(prev => ({
        ...prev,
        [draggedItem]: targetId
      }))
      setDraggedItem(null)
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    
    // Check if all items are correctly assigned
    const isCorrect = config.items.every(item => {
      const assignedTarget = assignments[item.id]
      if (!assignedTarget) return false
      
      const target = config.targets.find(t => t.id === assignedTarget)
      return target?.accepts.includes(item.id)
    })
    
    onComplete?.(isCorrect)
  }

  const allAssigned = config.items.every(item => assignments[item.id])
  
  const getItemsForTarget = (targetId: string) => {
    return config.items.filter(item => assignments[item.id] === targetId)
  }

  const unassignedItems = config.items.filter(item => !assignments[item.id])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Items to drag */}
          <div>
            <h4 className="font-medium mb-3">Drag these items:</h4>
            <div className="space-y-2">
              {unassignedItems.map(item => (
                <div
                  key={item.id}
                  draggable={!submitted}
                  onDragStart={() => handleDragStart(item.id)}
                  className={`p-3 border rounded cursor-move bg-white hover:bg-gray-50 ${
                    draggedItem === item.id ? 'opacity-50' : ''
                  } ${submitted ? 'cursor-default' : ''}`}
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Drop targets */}
          <div>
            <h4 className="font-medium mb-3">Drop them here:</h4>
            <div className="space-y-3">
              {config.targets.map(target => {
                const assignedItems = getItemsForTarget(target.id)
                return (
                  <div
                    key={target.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(target.id)}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[80px] hover:border-blue-400 transition-colors"
                  >
                    <h5 className="font-medium text-gray-700 mb-2">{target.label}</h5>
                    <div className="space-y-1">
                      {assignedItems.map(item => (
                        <div
                          key={item.id}
                          className={`p-2 rounded text-sm ${
                            submitted
                              ? target.accepts.includes(item.id)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.text}
                          {submitted && (
                            target.accepts.includes(item.id) 
                              ? <CheckCircle className="inline h-3 w-3 ml-1" />
                              : <XCircle className="inline h-3 w-3 ml-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {submitted && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">
              {config.items.every(item => {
                const assignedTarget = assignments[item.id]
                const target = config.targets.find(t => t.id === assignedTarget)
                return target?.accepts.includes(item.id)
              }) ? config.feedback.correct : config.feedback.incorrect}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <div className="text-sm text-gray-500">
            {allAssigned ? 'All items assigned' : `${Object.keys(assignments).length}/${config.items.length} assigned`}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!allAssigned || submitted}
          >
            {submitted ? 'Complete' : 'Check Answers'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// ACTION CHECKLIST COMPONENT
// ============================================================================

interface ActionChecklistProps {
  config: {
    type: 'action_checklist'
    primary_action: {
      task: string
      time_needed: string
      difficulty: string
      verification: 'text_input' | 'checkbox'
      placeholder?: string
    }
    bonus_actions?: string[]
    resources?: Array<{ name: string; url: string }>
  }
  title: string
  content: string
  onComplete?: (completed: boolean, verification?: string) => void
}

export function ActionChecklist({ config, title, content, onComplete }: ActionChecklistProps) {
  const [primaryCompleted, setPrimaryCompleted] = useState(false)
  const [verificationText, setVerificationText] = useState('')
  const [bonusCompleted, setBonusCompleted] = useState<Set<number>>(new Set())

  const handlePrimaryComplete = () => {
    if (config.primary_action.verification === 'checkbox') {
      setPrimaryCompleted(!primaryCompleted)
      onComplete?.(!primaryCompleted, undefined)
    } else if (config.primary_action.verification === 'text_input' && verificationText.trim()) {
      setPrimaryCompleted(true)
      onComplete?.(true, verificationText)
    }
  }

  const handleBonusToggle = (index: number) => {
    const newCompleted = new Set(bonusCompleted)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setBonusCompleted(newCompleted)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-6">{content}</p>

        {/* Primary Action */}
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-green-800 mb-2">Primary Action</h4>
          <p className="text-green-700 mb-3">{config.primary_action.task}</p>
          
          <div className="flex items-center gap-4 mb-3 text-sm text-green-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {config.primary_action.time_needed}
            </div>
            <Badge variant="outline" className="border-green-300 text-green-700">
              {config.primary_action.difficulty}
            </Badge>
          </div>

          {config.primary_action.verification === 'text_input' && (
            <div className="mb-3">
              <Input
                placeholder={config.primary_action.placeholder || 'Enter verification...'}
                value={verificationText}
                onChange={(e) => setVerificationText(e.target.value)}
                className="border-green-300 focus:border-green-500"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              checked={primaryCompleted}
              onCheckedChange={handlePrimaryComplete}
              disabled={config.primary_action.verification === 'text_input' && !verificationText.trim()}
            />
            <Label className="text-green-800 font-medium">
              {primaryCompleted ? 'Completed!' : 'Mark as complete'}
            </Label>
            {primaryCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
          </div>
        </div>

        {/* Bonus Actions */}
        {config.bonus_actions && config.bonus_actions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Bonus Actions (Optional)</h4>
            <div className="space-y-2">
              {config.bonus_actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    checked={bonusCompleted.has(index)}
                    onCheckedChange={() => handleBonusToggle(index)}
                  />
                  <Label className="flex-1 text-gray-700">{action}</Label>
                  {bonusCompleted.has(index) && <CheckCircle className="h-4 w-4 text-blue-600" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {config.resources && config.resources.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Helpful Resources</h4>
            <div className="space-y-2">
              {config.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 hover:text-blue-900">{resource.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Primary: {primaryCompleted ? 'Complete' : 'Pending'}
            {config.bonus_actions && ` • Bonus: ${bonusCompleted.size}/${config.bonus_actions.length}`}
          </div>
          <Badge className={primaryCompleted ? 'bg-green-600' : 'bg-gray-400'}>
            {primaryCompleted ? 'Action Complete' : 'Take Action'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// REFLECTION COMPONENT
// ============================================================================

interface ReflectionProps {
  config: {
    type: 'reflection'
    prompts: string[]
    guidance?: string
  }
  title: string
  onComplete?: (reflection: string) => void
}

export function Reflection({ config, title, onComplete }: ReflectionProps) {
  const [reflection, setReflection] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState(0)

  const handleSubmit = () => {
    if (reflection.trim()) {
      onComplete?.(reflection)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Reflection Prompts</h4>
            <div className="space-y-2">
              {config.prompts.map((prompt, index) => (
                <div
                  key={index}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    currentPrompt === index 
                      ? 'bg-yellow-200 text-yellow-900' 
                      : 'text-yellow-700 hover:bg-yellow-100'
                  }`}
                  onClick={() => setCurrentPrompt(index)}
                >
                  <span className="text-sm font-medium">• </span>
                  {prompt}
                </div>
              ))}
            </div>
          </div>

          {config.guidance && (
            <div className="text-sm text-gray-600 italic">
              {config.guidance}
            </div>
          )}

          <Textarea
            placeholder="Share your thoughts and reflections..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-[150px]"
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {reflection.length} characters
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!reflection.trim()}
            >
              Save Reflection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN INTERACTIVE CONTENT COMPONENT
// ============================================================================

interface InteractiveContentProps {
  step: {
    step_type: string
    title: string
    content: string
    interaction_config?: any
  }
  onComplete?: (data?: any) => void
  className?: string
}

export function InteractiveContent({ step, onComplete, className }: InteractiveContentProps) {
  if (!step.interaction_config) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">{step.title}</h3>
          <div className="prose prose-gray max-w-none">
            <div dangerouslySetInnerHTML={{ __html: step.content }} />
          </div>
        </CardContent>
      </Card>
    )
  }

  const config = step.interaction_config

  switch (config.type) {
    case 'intro_card':
      return (
        <IntroCard
          config={config}
          title={step.title}
          content={step.content}
          onComplete={onComplete}
        />
      )

    case 'swipe_cards':
      return (
        <SwipeCards
          config={config}
          onComplete={onComplete}
        />
      )

    case 'timeline':
      return (
        <Timeline
          config={config}
          title={step.title}
          content={step.content}
          onComplete={onComplete}
        />
      )

    case 'multiple_choice':
      return (
        <MultipleChoice
          config={config}
          question={step.content}
          onComplete={onComplete}
        />
      )

    case 'drag_drop':
      return (
        <DragDrop
          config={config}
          title={step.title}
          onComplete={onComplete}
        />
      )

    case 'action_checklist':
      return (
        <ActionChecklist
          config={config}
          title={step.title}
          content={step.content}
          onComplete={onComplete}
        />
      )

    case 'reflection':
      return (
        <Reflection
          config={config}
          title={step.title}
          onComplete={onComplete}
        />
      )

    default:
      return (
        <Card className={className}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{step.title}</h3>
            <div className="prose prose-gray max-w-none">
              <div dangerouslySetInnerHTML={{ __html: step.content }} />
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Interactive component type "{config.type}" not yet implemented.
              </p>
            </div>
          </CardContent>
        </Card>
      )
  }
} 