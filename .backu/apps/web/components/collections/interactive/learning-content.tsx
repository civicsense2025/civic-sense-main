'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { 
  Lightbulb, 
  BookOpen, 
  FileText, 
  Search, 
  Scale, 
  MessageSquare,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Target
} from 'lucide-react'
import type { CompletionCallback } from './types'

// ============================================================================
// CONCEPT COMPONENT
// ============================================================================

interface ConceptConfig {
  type: 'concept'
  key_points: string[]
  definition?: string
  importance?: string
  related_concepts?: string[]
}

export function Concept({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: ConceptConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [hasRead, setHasRead] = useState(false)

  const handleComplete = () => {
    setHasRead(true)
    onComplete(true, { concept_understood: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Key Concept
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        
        {config.definition && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Definition</h4>
            <p className="text-blue-800">{config.definition}</p>
          </div>
        )}

        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700">{content}</p>
        </div>

        {config.key_points && config.key_points.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Key Points</h4>
            <div className="space-y-2">
              {config.key_points.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {config.importance && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">Why This Matters</h4>
            <p className="text-yellow-800 text-sm">{config.importance}</p>
          </div>
        )}

        {config.related_concepts && config.related_concepts.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Related Concepts</h4>
            <div className="flex flex-wrap gap-2">
              {config.related_concepts.map((concept, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {concept}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleComplete} className="w-full">
          <CheckCircle className="h-4 w-4 mr-2" />
          I Understand This Concept
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// EXAMPLE COMPONENT
// ============================================================================

interface ExampleConfig {
  type: 'example'
  examples: Array<{
    title: string
    description: string
    source?: string
    highlight?: string
  }>
  takeaway?: string
}

export function Example({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: ExampleConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [viewedExamples, setViewedExamples] = useState<Set<number>>(new Set())

  const handleExampleView = (index: number) => {
    setViewedExamples(prev => new Set([...prev, index]))
    
    if (viewedExamples.size + 1 === config.examples.length) {
      onComplete(true, { examples_reviewed: config.examples.length })
    }
  }

  const progress = (viewedExamples.size / config.examples.length) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Real-World Examples
        </CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-700">{content}</p>

        <div className="space-y-4">
          {config.examples.map((example, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all hover:shadow-md ${
                viewedExamples.has(index) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleExampleView(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{example.title}</h4>
                  {viewedExamples.has(index) && (
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                
                <p className="text-gray-700 text-sm mb-2">{example.description}</p>
                
                {example.highlight && (
                  <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                    <p className="text-blue-800 text-sm font-medium">{example.highlight}</p>
                  </div>
                )}
                
                {example.source && (
                  <p className="text-gray-500 text-xs mt-2">Source: {example.source}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {config.takeaway && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Key Takeaway</h4>
            <p className="text-green-800 text-sm">{config.takeaway}</p>
          </div>
        )}

        <div className="text-sm text-gray-500 text-center">
          Reviewed {viewedExamples.size} of {config.examples.length} examples
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SUMMARY COMPONENT
// ============================================================================

interface SummaryConfig {
  type: 'summary'
  key_points: string[]
  next_steps?: string[]
  resources?: Array<{ title: string; url: string }>
}

export function Summary({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: SummaryConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [hasReviewed, setHasReviewed] = useState(false)

  const handleComplete = () => {
    setHasReviewed(true)
    onComplete(true, { summary_reviewed: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700">{content}</p>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Key Points to Remember</h4>
          <div className="space-y-3">
            {config.key_points.map((point, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {config.next_steps && config.next_steps.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
            <div className="space-y-2">
              {config.next_steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-green-600" />
                  <p className="text-gray-700 text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {config.resources && config.resources.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Additional Resources</h4>
            <div className="space-y-2">
              {config.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink className="h-3 w-3" />
                  {resource.title}
                </a>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleComplete} className="w-full">
          Complete Summary Review
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CASE STUDY COMPONENT
// ============================================================================

interface CaseStudyConfig {
  type: 'case_study'
  background: string
  challenge: string
  solution?: string
  outcome?: string
  lessons_learned: string[]
  discussion_questions?: string[]
}

export function CaseStudy({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: CaseStudyConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<Record<number, string>>({})

  const sections = [
    { title: 'Background', content: config.background, color: 'blue' },
    { title: 'Challenge', content: config.challenge, color: 'red' },
    ...(config.solution ? [{ title: 'Solution', content: config.solution, color: 'green' }] : []),
    ...(config.outcome ? [{ title: 'Outcome', content: config.outcome, color: 'purple' }] : []),
  ]

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1)
    } else {
      onComplete(true, { case_study_completed: true, responses })
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }

  const handleResponseChange = (questionIndex: number, response: string) => {
    setResponses(prev => ({ ...prev, [questionIndex]: response }))
  }

  const progress = ((currentSection + 1) / sections.length) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Case Study: {title}
        </CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <p className="text-gray-700">{content}</p>

        {/* Case Study Section */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {sections[currentSection].title}
            </h3>
            <Badge variant="outline">
              {currentSection + 1} of {sections.length}
            </Badge>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700">{sections[currentSection].content}</p>
          </div>
        </div>

        {/* Lessons Learned (shown at the end) */}
        {currentSection === sections.length - 1 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-3">Lessons Learned</h4>
            <div className="space-y-2">
              {config.lessons_learned.map((lesson, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-yellow-800 text-sm">{lesson}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discussion Questions */}
        {currentSection === sections.length - 1 && config.discussion_questions && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Reflection Questions</h4>
            <div className="space-y-4">
              {config.discussion_questions.map((question, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {index + 1}. {question}
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                    placeholder="Your thoughts..."
                    value={responses[index] || ''}
                    onChange={(e) => handleResponseChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSection === 0}
          >
            Previous
          </Button>
          
          <Button onClick={handleNext}>
            {currentSection === sections.length - 1 ? 'Complete Case Study' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPARISON COMPONENT
// ============================================================================

interface ComparisonConfig {
  type: 'comparison'
  items: Array<{
    name: string
    features: Record<string, string | boolean>
    description?: string
  }>
  criteria: string[]
}

export function Comparison({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: ComparisonConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  const handleItemClick = (index: number) => {
    setSelectedItems(prev => new Set([...prev, index]))
    
    if (selectedItems.size + 1 === config.items.length) {
      onComplete(true, { comparison_reviewed: true })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Comparison
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700">{content}</p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left font-medium text-gray-900">
                  Feature
                </th>
                {config.items.map((item, index) => (
                  <th 
                    key={index}
                    className={`border border-gray-300 p-3 text-center font-medium cursor-pointer transition-colors ${
                      selectedItems.has(index) ? 'bg-blue-100 text-blue-900' : 'text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => handleItemClick(index)}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {item.name}
                      {selectedItems.has(index) && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.criteria.map((criterion, criterionIndex) => (
                <tr key={criterionIndex} className={criterionIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-3 font-medium text-gray-700">
                    {criterion}
                  </td>
                  {config.items.map((item, itemIndex) => (
                    <td 
                      key={itemIndex}
                      className={`border border-gray-300 p-3 text-center ${
                        selectedItems.has(itemIndex) ? 'bg-blue-50' : ''
                      }`}
                    >
                      {typeof item.features[criterion] === 'boolean' ? (
                        item.features[criterion] ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-700">
                          {item.features[criterion] || '—'}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Item Descriptions */}
        <div className="grid gap-4 md:grid-cols-2">
          {config.items.map((item, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all ${
                selectedItems.has(index) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleItemClick(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  {selectedItems.has(index) && (
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                {item.description && (
                  <p className="text-gray-700 text-sm">{item.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-sm text-gray-500 text-center">
          Reviewed {selectedItems.size} of {config.items.length} items
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// RESEARCH COMPONENT
// ============================================================================

interface ResearchConfig {
  type: 'research'
  research_prompt: string
  suggested_sources?: string[]
  guiding_questions: string[]
  deliverable: 'notes' | 'summary' | 'presentation'
}

export function Research({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: ResearchConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [researchNotes, setResearchNotes] = useState('')
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set())

  const handleQuestionComplete = (index: number) => {
    setCompletedQuestions(prev => new Set([...prev, index]))
  }

  const handleSubmit = () => {
    onComplete(true, { 
      research_notes: researchNotes,
      questions_completed: completedQuestions.size 
    })
  }

  const canSubmit = researchNotes.trim().length > 100 && completedQuestions.size >= config.guiding_questions.length / 2

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Research Activity
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700">{content}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Research Prompt</h4>
          <p className="text-blue-800">{config.research_prompt}</p>
        </div>

        {config.suggested_sources && config.suggested_sources.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Suggested Sources</h4>
            <div className="space-y-2">
              {config.suggested_sources.map((source, index) => (
                <div key={index} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 text-sm">{source}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Guiding Questions</h4>
          <div className="space-y-3">
            {config.guiding_questions.map((question, index) => (
              <div 
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  completedQuestions.has(index) ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleQuestionComplete(index)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    completedQuestions.has(index) ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {completedQuestions.has(index) && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{question}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Research Notes</h4>
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg text-sm"
            rows={8}
            placeholder="Document your research findings here..."
            value={researchNotes}
            onChange={(e) => setResearchNotes(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            {researchNotes.length} characters (minimum 100 required)
          </p>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full"
        >
          Submit Research ({completedQuestions.size}/{config.guiding_questions.length} questions completed)
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// DEBATE COMPONENT
// ============================================================================

interface DebateConfig {
  type: 'debate'
  topic: string
  positions: Array<{
    side: string
    arguments: string[]
    evidence?: string[]
  }>
  reflection_questions: string[]
}

export function Debate({ 
  config, 
  title, 
  content, 
  onComplete 
}: { 
  config: DebateConfig
  title: string
  content: string
  onComplete: CompletionCallback 
}) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [phase, setPhase] = useState<'select' | 'examine' | 'reflect'>('select')

  const handlePositionSelect = (index: number) => {
    setSelectedPosition(index)
    setPhase('examine')
  }

  const handleExamineComplete = () => {
    setPhase('reflect')
  }

  const handleResponseChange = (questionIndex: number, response: string) => {
    setResponses(prev => ({ ...prev, [questionIndex]: response }))
  }

  const handleComplete = () => {
    onComplete(true, { 
      selected_position: selectedPosition,
      responses,
      debate_completed: true 
    })
  }

  const completedResponses = Object.keys(responses).filter(key => responses[parseInt(key)].trim().length > 0).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Debate & Discussion
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700">{content}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-2">Debate Topic</h4>
          <p className="text-purple-800">{config.topic}</p>
        </div>

        {phase === 'select' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Choose a Position to Examine</h4>
            <div className="space-y-4">
              {config.positions.map((position, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handlePositionSelect(index)}
                >
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-900 mb-2">{position.side}</h5>
                    <div className="space-y-1">
                      {position.arguments.slice(0, 2).map((argument, argIndex) => (
                        <p key={argIndex} className="text-gray-700 text-sm">• {argument}</p>
                      ))}
                      {position.arguments.length > 2 && (
                        <p className="text-gray-500 text-xs">...and {position.arguments.length - 2} more arguments</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {phase === 'examine' && selectedPosition !== null && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">
                Examining: {config.positions[selectedPosition].side}
              </h4>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-3">Key Arguments</h5>
              <div className="space-y-2">
                {config.positions[selectedPosition].arguments.map((argument, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700 text-sm">{argument}</p>
                  </div>
                ))}
              </div>
            </div>

            {config.positions[selectedPosition].evidence && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Supporting Evidence</h5>
                <div className="space-y-2">
                  {config.positions[selectedPosition].evidence!.map((evidence, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                      <p className="text-gray-700 text-sm">{evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleExamineComplete} className="w-full">
              Continue to Reflection
            </Button>
          </div>
        )}

        {phase === 'reflect' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 mb-3">Reflection Questions</h4>
            
            <div className="space-y-4">
              {config.reflection_questions.map((question, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {index + 1}. {question}
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                    placeholder="Your thoughts..."
                    value={responses[index] || ''}
                    onChange={(e) => handleResponseChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <Button 
              onClick={handleComplete}
              disabled={completedResponses < config.reflection_questions.length / 2}
              className="w-full"
            >
              Complete Debate Activity ({completedResponses}/{config.reflection_questions.length} responses)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 