import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { BarChart3, ExternalLink, TrendingUp } from 'lucide-react'
import type { 
  QuickPollConfig, 
  SurveyEmbedConfig, 
  OpinionSliderConfig,
  CompletionCallback 
} from './types'

// Quick Poll Component
export function QuickPoll({ config, onComplete }: { config: QuickPollConfig; onComplete: CompletionCallback }) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [hasVoted, setHasVoted] = useState(false)
  const [results, setResults] = useState<Record<string, number>>({})

  const handleVote = () => {
    if (!selectedOption) return
    
    // Simulate vote counting
    const newResults = { ...results }
    newResults[selectedOption] = (newResults[selectedOption] || 0) + 1
    setResults(newResults)
    setHasVoted(true)
    
    onComplete(true, { vote: selectedOption, results: newResults })
  }

  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BarChart3 className="h-5 w-5 inline mr-2" />
          Quick Poll
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">{config.question}</h3>
        
        {!hasVoted ? (
          <div className="space-y-3">
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {config.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            <Button 
              onClick={handleVote}
              disabled={!selectedOption}
              className="w-full"
            >
              Cast Vote
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-green-600 font-medium">Thanks for voting!</p>
            
            {config.show_results && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Results:</h4>
                {config.options.map((option, index) => {
                  const votes = results[option] || 0
                  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={selectedOption === option ? 'font-medium text-blue-600' : ''}>
                          {option}
                        </span>
                        <span>{votes} votes ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Survey Embed Component
export function SurveyEmbed({ config, onComplete }: { config: SurveyEmbedConfig; onComplete: CompletionCallback }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (config.questions && currentQuestionIndex < config.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Survey complete
      onComplete(true, { answers })
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const progress = config.questions 
    ? ((currentQuestionIndex + 1) / config.questions.length) * 100 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <ExternalLink className="h-5 w-5 inline mr-2" />
          Survey
        </CardTitle>
        {config.questions && (
          <Progress value={progress} className="h-2" />
        )}
      </CardHeader>
      
      <CardContent>
        {config.questions && config.questions.length > 0 ? (
          <div className="space-y-6">
            {/* Question Progress */}
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {config.questions.length}
            </div>
            
            {/* Current Question */}
            {(() => {
              const question = config.questions[currentQuestionIndex]
              const questionId = `q-${currentQuestionIndex}`
              
              return (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {question.question}
                  </h3>
                  
                  {question.type === 'text' && (
                    <Textarea
                      placeholder="Your answer..."
                      value={answers[questionId] || ''}
                      onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                      className="min-h-[100px]"
                    />
                  )}
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <RadioGroup 
                      value={answers[questionId] || ''} 
                      onValueChange={(value) => handleAnswerChange(questionId, value)}
                    >
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${questionId}-${index}`} />
                          <Label htmlFor={`${questionId}-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {question.type === 'rating' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>1 (Strongly Disagree)</span>
                        <span>5 (Strongly Agree)</span>
                      </div>
                      <RadioGroup 
                        value={answers[questionId] || ''} 
                        onValueChange={(value) => handleAnswerChange(questionId, value)}
                        className="flex space-x-4"
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex flex-col items-center space-y-1">
                            <RadioGroupItem value={rating.toString()} id={`${questionId}-${rating}`} />
                            <Label htmlFor={`${questionId}-${rating}`} className="text-sm cursor-pointer">
                              {rating}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}
                </div>
              )
            })()}
            
            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!answers[`q-${currentQuestionIndex}`]}
              >
                {currentQuestionIndex === config.questions.length - 1 ? 'Complete Survey' : 'Next'}
              </Button>
            </div>
          </div>
        ) : (
          /* External Survey Embed */
          <div className="space-y-4">
            <p className="text-gray-600">
              This survey is hosted externally. Click the link below to participate.
            </p>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <a
                href={config.survey_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Open Survey
              </a>
            </div>
            
            <Button
              onClick={() => onComplete(true, { external: true })}
              variant="outline"
              className="w-full"
            >
              Mark as Completed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Opinion Slider Component
export function OpinionSlider({ config, onComplete }: { config: OpinionSliderConfig; onComplete: CompletionCallback }) {
  const [value, setValue] = useState(config.default_value || 50)
  const [hasResponded, setHasResponded] = useState(false)

  const handleSubmit = () => {
    setHasResponded(true)
    onComplete(true, { opinion: value })
  }

  const getOpinionText = (val: number) => {
    if (val <= 20) return 'Strongly disagree'
    if (val <= 40) return 'Disagree'
    if (val <= 60) return 'Neutral'
    if (val <= 80) return 'Agree'
    return 'Strongly agree'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <TrendingUp className="h-5 w-5 inline mr-2" />
          Opinion Scale
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {config.statement}
          </h3>
          <p className="text-sm text-gray-600">
            Move the slider to indicate your level of agreement
          </p>
        </div>
        
        {!hasResponded ? (
          <div className="space-y-6">
            {/* Slider */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => setValue(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{config.left_label}</span>
                  <span>{config.right_label}</span>
                </div>
              </div>
              
              {/* Current Value Display */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{value}%</div>
                <div className="text-sm text-gray-600">{getOpinionText(value)}</div>
              </div>
            </div>
            
            <Button onClick={handleSubmit} className="w-full">
              Submit Opinion
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="text-green-600 font-medium">
              Thanks for sharing your opinion!
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-green-800">{value}%</div>
              <div className="text-sm text-green-700">{getOpinionText(value)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 