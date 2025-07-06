'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Target,
  Lightbulb,
  GripVertical
} from 'lucide-react'
import type { 
  InteractiveComponentProps,
  MultipleChoiceConfig,
  TrueFalseConfig,
  TextInputConfig,
  RankingConfig
} from './types'

// ============================================================================
// MULTIPLE CHOICE COMPONENT
// ============================================================================

interface MultipleChoiceProps extends InteractiveComponentProps {
  config: MultipleChoiceConfig
  question: string
}

export function MultipleChoice({ config, question, onComplete }: MultipleChoiceProps) {
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
          Quick Check
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
              {showHint ? 'Hide Hint' : 'Show Hint'}
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
                  {isCorrect ? 'Correct!' : 'Not quite right'}
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
            {selectedAnswer !== null ? 'Answer selected' : 'Select an answer'}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || showResult}
          >
            {showResult ? 'Complete' : 'Submit Answer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// TRUE/FALSE COMPONENT
// ============================================================================

interface TrueFalseProps extends InteractiveComponentProps {
  config: TrueFalseConfig
  question: string
}

export function TrueFalse({ config, question, onComplete }: TrueFalseProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
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
          True or False?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-6">{question}</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            variant={selectedAnswer === true ? "default" : "outline"}
            onClick={() => setSelectedAnswer(true)}
            disabled={showResult}
            className={`h-16 text-lg ${
              showResult && config.correct === true
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : showResult && selectedAnswer === true && config.correct === false
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : ''
            }`}
          >
            True
            {showResult && config.correct === true && (
              <CheckCircle className="ml-2 h-5 w-5" />
            )}
            {showResult && selectedAnswer === true && config.correct === false && (
              <XCircle className="ml-2 h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant={selectedAnswer === false ? "default" : "outline"}
            onClick={() => setSelectedAnswer(false)}
            disabled={showResult}
            className={`h-16 text-lg ${
              showResult && config.correct === false
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : showResult && selectedAnswer === false && config.correct === true
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : ''
            }`}
          >
            False
            {showResult && config.correct === false && (
              <CheckCircle className="ml-2 h-5 w-5" />
            )}
            {showResult && selectedAnswer === false && config.correct === true && (
              <XCircle className="ml-2 h-5 w-5" />
            )}
          </Button>
        </div>

        {!showResult && config.hint && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
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
                  {isCorrect ? 'Correct!' : 'Not quite right'}
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
            {selectedAnswer !== null ? 'Answer selected' : 'Select True or False'}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || showResult}
          >
            {showResult ? 'Complete' : 'Submit Answer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// TEXT INPUT COMPONENT
// ============================================================================

interface TextInputProps extends InteractiveComponentProps {
  config: TextInputConfig
  question: string
}

export function TextInput({ config, question, onComplete }: TextInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [validationMessage, setValidationMessage] = useState('')

  const validateInput = (value: string): boolean => {
    if (config.required && !value.trim()) {
      setValidationMessage('This field is required')
      return false
    }

    if (config.min_length && value.length < config.min_length) {
      setValidationMessage(`Minimum ${config.min_length} characters required`)
      return false
    }

    if (config.max_length && value.length > config.max_length) {
      setValidationMessage(`Maximum ${config.max_length} characters allowed`)
      return false
    }

    if (config.validation === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setValidationMessage('Please enter a valid email address')
        return false
      }
    }

    if (config.validation === 'url') {
      try {
        new URL(value)
      } catch {
        setValidationMessage('Please enter a valid URL')
        return false
      }
    }

    if (config.validation === 'phone') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        setValidationMessage('Please enter a valid phone number')
        return false
      }
    }

    setValidationMessage('')
    return true
  }

  const handleSubmit = () => {
    const valid = validateInput(inputValue)
    setIsValid(valid)
    
    if (valid) {
      setSubmitted(true)
      onComplete?.(true, { input: inputValue })
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (!isValid) {
      // Re-validate on change if previously invalid
      setIsValid(validateInput(value))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Your Response
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">{question}</h3>

        <div className="mb-4">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={config.placeholder || 'Enter your answer...'}
            disabled={submitted}
            className={!isValid ? 'border-red-500' : ''}
          />
          {!isValid && validationMessage && (
            <p className="text-red-600 text-sm mt-1">{validationMessage}</p>
          )}
          {config.max_length && (
            <p className="text-gray-500 text-sm mt-1">
              {inputValue.length}/{config.max_length} characters
            </p>
          )}
        </div>

        {submitted && (
          <div className="p-4 rounded-lg mb-4 bg-green-50 border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">Response Recorded</h4>
                <p className="text-sm mt-1 text-green-700">
                  Thank you for your input. Your response has been saved.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-sm text-gray-500">
            {inputValue.trim() ? `${inputValue.length} characters` : 'Enter your response'}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || submitted}
          >
            {submitted ? 'Complete' : 'Submit Response'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// RANKING COMPONENT
// ============================================================================

interface RankingProps extends InteractiveComponentProps {
  config: RankingConfig
  question: string
}

export function Ranking({ config, question, onComplete }: RankingProps) {
  const [rankedItems, setRankedItems] = useState(config.items)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetIndex: number) => {
    if (!draggedItem) return

    const draggedIndex = rankedItems.findIndex(item => item.id === draggedItem)
    if (draggedIndex === -1) return

    const newItems = [...rankedItems]
    const [draggedItemObj] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItemObj)

    setRankedItems(newItems)
    setDraggedItem(null)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const userOrder = rankedItems.map(item => item.id)
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(config.correct_order)
    onComplete?.(isCorrect, { ranking: userOrder })
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...rankedItems]
    const [movedItem] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, movedItem)
    setRankedItems(newItems)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Ranking Exercise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">{question}</h3>
        <p className="text-gray-600 mb-6">Drag items to reorder them from most to least important:</p>

        <div className="space-y-2 mb-6">
          {rankedItems.map((item, index) => (
            <div
              key={item.id}
              draggable={!submitted}
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-gray-50 transition-colors ${
                submitted ? 'cursor-default' : ''
              } ${draggedItem === item.id ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700 w-6">{index + 1}.</span>
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                {item.text}
              </div>
              {submitted && (
                <div className="text-sm text-gray-500">
                  {config.correct_order.indexOf(item.id) + 1}
                  {config.correct_order.indexOf(item.id) === index ? (
                    <CheckCircle className="inline h-4 w-4 ml-1 text-green-600" />
                  ) : (
                    <XCircle className="inline h-4 w-4 ml-1 text-red-600" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile-friendly reorder buttons */}
        <div className="md:hidden mb-6">
          <p className="text-sm text-gray-600 mb-2">Use buttons to reorder:</p>
          {rankedItems.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 mb-2">
              <span className="text-sm w-4">{index + 1}.</span>
              <span className="flex-1 text-sm">{item.text}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => moveItem(index, Math.max(0, index - 1))}
                disabled={index === 0 || submitted}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => moveItem(index, Math.min(rankedItems.length - 1, index + 1))}
                disabled={index === rankedItems.length - 1 || submitted}
              >
                ↓
              </Button>
            </div>
          ))}
        </div>

        {submitted && (
          <div className="p-4 rounded-lg mb-4 bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-5 w-5 mt-0.5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-800">Ranking Explanation</h4>
                <p className="text-sm mt-1 text-blue-700">{config.explanation}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-sm text-gray-500">
            {submitted ? 'Ranking complete' : 'Drag to reorder items'}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitted}
          >
            {submitted ? 'Complete' : 'Submit Ranking'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 