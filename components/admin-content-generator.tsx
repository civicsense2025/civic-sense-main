"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Zap, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  Download, 
  Save,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit,
  ExternalLink,
  Globe,
  Clock,
  Target,
  Shield,
  TrendingUp,
  BookOpen,
  Users,
  Database,
  FileText,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'

// =============================================================================
// INTERFACES
// =============================================================================

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  urlToImage?: string
  publishedAt: string
  source: {
    id: string | null
    name: string
  }
  category?: string
  content?: string
  relevanceScore?: number
  credibilityScore?: number
  biasRating?: string
  domain?: string
  author?: string
}

interface GeneratedQuestion {
  questionNumber: number
  questionType: 'Multiple Choice' | 'True or False' | 'Short Answer' | 'Matching' | 'Fill in Blank' | 'Ordering'
  difficultyLevel: 'Recall' | 'Comprehension' | 'Analysis' | 'Evaluation'
  category: string
  question: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer: string
  hint: string
  explanation: string
  tags: string[]
  sources: Array<{name: string, url: string}>
  matchingPairs?: Array<{ left: string; right: string }>
  fillInBlanks?: Array<{ text: string; answer: string }>
  orderingItems?: Array<{ id: string; content: string; correctOrder: number }>
}

interface GeneratedQuiz {
  topic: string
  issue: string
  description: string
  questions: GeneratedQuestion[]
  metadata?: {
    generated_at: string
    source_article: NewsArticle
    generation_method: string
    ai_model: string
    validation_status: string
  }
}

interface GenerationSettings {
  aiProvider: 'openai' | 'anthropic' | 'perplexity'
  model?: string
  questionCount: number
  enableWebSearch: boolean
  validateSources: boolean
  enforceLimits: boolean
  customPrompt?: string
  categories: string[]
  difficultyDistribution: {
    recall: number
    comprehension: number
    analysis: number
    evaluation: number
  }
  questionTypeDistribution: {
    multipleChoice: number
    trueFalse: number
    shortAnswer: number
    matching: number
    fillInBlank: number
    ordering: number
  }
}

interface GenerationStatus {
  stage: 'idle' | 'analyzing-article' | 'generating-questions' | 'validating-sources' | 'optimizing-content' | 'complete' | 'error'
  progress: number
  message: string
  currentStep?: string
  error?: string
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getCredibilityBadge(score?: number) {
  if (!score) return null
  
  if (score >= 90) return { variant: 'default' as const, text: 'Excellent', color: 'bg-green-100 text-green-800', icon: Shield }
  if (score >= 75) return { variant: 'secondary' as const, text: 'High', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
  if (score >= 60) return { variant: 'outline' as const, text: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
  return { variant: 'destructive' as const, text: 'Low', color: 'bg-red-100 text-red-800', icon: AlertCircle }
}

function getBiasBadge(rating?: string) {
  if (!rating) return null
  
  const biasMap = {
    'left': { text: 'Left Lean', color: 'bg-blue-100 text-blue-800' },
    'center-left': { text: 'Center-Left', color: 'bg-blue-50 text-blue-700' },
    'center': { text: 'Center', color: 'bg-gray-100 text-gray-800' },
    'center-right': { text: 'Center-Right', color: 'bg-orange-50 text-orange-700' },
    'right': { text: 'Right Lean', color: 'bg-orange-100 text-orange-800' },
    'mixed': { text: 'Mixed', color: 'bg-purple-100 text-purple-800' }
  }
  
  return biasMap[rating as keyof typeof biasMap] || { text: rating, color: 'bg-gray-100 text-gray-800' }
}

// =============================================================================
// NEWS SOURCE CARD
// =============================================================================

function NewsSourceCard({ article, onGenerate, isGenerating }: { 
  article: NewsArticle
  onGenerate: (article: NewsArticle) => void
  isGenerating: boolean
}) {
  const credibilityBadge = getCredibilityBadge(article.credibilityScore)
  const biasBadge = getBiasBadge(article.biasRating)
  
  const timeAgo = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <Card className="h-full hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold line-clamp-2 text-gray-900 dark:text-gray-100 leading-tight">
              {article.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {article.source.name}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</span>
            </div>
          </div>
          {article.urlToImage && (
            <img 
              src={article.urlToImage} 
              alt="" 
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          )}
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
          {article.description}
        </p>
        
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {article.category && (
            <Badge variant="secondary" className="text-xs">
              {article.category}
            </Badge>
          )}
          {credibilityBadge && (
            <Badge variant={credibilityBadge.variant} className="text-xs">
              <credibilityBadge.icon className="w-3 h-3 mr-1" />
              {credibilityBadge.text}
            </Badge>
          )}
          {biasBadge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${biasBadge.color}`}>
              {biasBadge.text}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="text-xs"
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <Eye className="w-3 h-3 mr-1" />
              Read Article
            </a>
          </Button>
          <Button 
            onClick={() => onGenerate(article)}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Generate Quiz
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// GENERATION PROGRESS TRACKER
// =============================================================================

function GenerationProgressTracker({ status }: { status: GenerationStatus }) {
  const getStageIcon = () => {
    switch (status.stage) {
      case 'analyzing-article': return <Globe className="w-4 h-4" />
      case 'generating-questions': return <Sparkles className="w-4 h-4" />
      case 'validating-sources': return <Shield className="w-4 h-4" />
      case 'optimizing-content': return <TrendingUp className="w-4 h-4" />
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStageColor = () => {
    switch (status.stage) {
      case 'complete': return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
      case 'error': return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      default: return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
    }
  }

  return (
    <Card className={`${getStageColor()} transition-colors`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {status.stage === 'analyzing-article' || status.stage === 'generating-questions' || status.stage === 'validating-sources' || status.stage === 'optimizing-content' ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : (
              getStageIcon()
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {status.message}
              </h3>
              {status.currentStep && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {status.currentStep}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium">{status.progress}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>
          
          {status.error && (
            <div className="bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{status.error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// GENERATION SETTINGS PANEL
// =============================================================================

function GenerationSettingsPanel({ 
  settings, 
  onSettingsChange 
}: { 
  settings: GenerationSettings
  onSettingsChange: (settings: GenerationSettings) => void 
}) {
  const updateSettings = (updates: Partial<GenerationSettings>) => {
    onSettingsChange({ ...settings, ...updates })
  }

  const availableCategories = [
    'Government', 'Elections', 'Economy', 'Foreign Policy', 'Justice',
    'Civil Rights', 'Environment', 'Local Issues', 'Constitutional Law',
    'National Security', 'Public Policy', 'Historical Precedent',
    'Civic Action', 'Electoral Systems', 'Legislative Process',
    'Judicial Review', 'Policy Analysis', 'Civic Participation', 'Media Literacy'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Generation Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-provider">AI Provider</Label>
                <Select 
                  value={settings.aiProvider} 
                  onValueChange={(value) => updateSettings({ aiProvider: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic Claude (Balanced)</SelectItem>
                    <SelectItem value="openai">OpenAI GPT-4 (Creative)</SelectItem>
                    <SelectItem value="perplexity">Perplexity (Real-time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="question-count">Question Count</Label>
                <Select 
                  value={settings.questionCount.toString()} 
                  onValueChange={(value) => updateSettings({ questionCount: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Questions (Quick)</SelectItem>
                    <SelectItem value="15">15 Questions (Standard)</SelectItem>
                    <SelectItem value="20">20 Questions (Complete)</SelectItem>
                    <SelectItem value="25">25 Questions (Extended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Categories (Select 2-4)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateSettings({ categories: [...settings.categories, category] })
                        } else {
                          updateSettings({ categories: settings.categories.filter(c => c !== category) })
                        }
                      }}
                      className="rounded"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Web Search</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use real-time web search for current information
                  </p>
                </div>
                <Switch
                  checked={settings.enableWebSearch}
                  onCheckedChange={(checked) => updateSettings({ enableWebSearch: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Validate Sources</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verify all source URLs are accessible
                  </p>
                </div>
                <Switch
                  checked={settings.validateSources}
                  onCheckedChange={(checked) => updateSettings({ validateSources: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enforce Limits</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Strict adherence to CivicSense guidelines
                  </p>
                </div>
                <Switch
                  checked={settings.enforceLimits}
                  onCheckedChange={(checked) => updateSettings({ enforceLimits: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-prompt">Custom Instructions (Optional)</Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="Additional instructions for the AI generator..."
                  value={settings.customPrompt || ''}
                  onChange={(e) => updateSettings({ customPrompt: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Difficulty Distribution</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {Object.entries(settings.difficultyDistribution).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="capitalize">{key}</Label>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => 
                          updateSettings({
                            difficultyDistribution: {
                              ...settings.difficultyDistribution,
                              [key]: newValue
                            }
                          })
                        }
                        max={settings.questionCount}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-base font-medium">Question Type Distribution</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {Object.entries(settings.questionTypeDistribution).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => 
                          updateSettings({
                            questionTypeDistribution: {
                              ...settings.questionTypeDistribution,
                              [key]: newValue
                            }
                          })
                        }
                        max={settings.questionCount}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// QUIZ PREVIEW & EDITOR
// =============================================================================

function QuizPreviewCard({ quiz, onEdit, onSave, onExport }: {
  quiz: GeneratedQuiz
  onEdit: (quiz: GeneratedQuiz) => void
  onSave: (quiz: GeneratedQuiz) => void
  onExport: (quiz: GeneratedQuiz, format: 'sql' | 'csv' | 'json') => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const questionTypeCounts = quiz.questions.reduce((acc, q) => {
    acc[q.questionType] = (acc[q.questionType] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const difficultyCounts = quiz.questions.reduce((acc, q) => {
    acc[q.difficultyLevel] = (acc[q.difficultyLevel] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-green-800 dark:text-green-200 mb-2">
              {quiz.topic}
            </CardTitle>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              {quiz.description}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {quiz.questions.length} Questions
              </Badge>
              {quiz.metadata?.source_article && (
                <Badge variant="outline" className="text-xs">
                  From: {quiz.metadata.source_article.source.name}
                </Badge>
              )}
              {quiz.metadata?.ai_model && (
                <Badge variant="outline" className="text-xs">
                  {quiz.metadata.ai_model}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Question Distribution */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Question Types</h4>
                <div className="space-y-1">
                  {Object.entries(questionTypeCounts).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span>{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Difficulty Levels</h4>
                <div className="space-y-1">
                  {Object.entries(difficultyCounts).map(([difficulty, count]) => (
                    <div key={difficulty} className="flex justify-between text-xs">
                      <span>{difficulty}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Sample Questions */}
            <div>
              <h4 className="font-medium text-sm mb-2">Sample Questions</h4>
              <div className="space-y-2">
                {quiz.questions.slice(0, 3).map((question, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {question.questionType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {question.difficultyLevel}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{question.question}</p>
                    {question.questionType === 'Multiple Choice' && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Options: {[question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean).length}
                      </div>
                    )}
                  </div>
                ))}
                {quiz.questions.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ...and {quiz.questions.length - 3} more questions
                  </p>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onEdit(quiz)} variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Quiz
              </Button>
              <Button onClick={() => onSave(quiz)} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save to Database
              </Button>
              <Button onClick={() => onExport(quiz, 'sql')} variant="outline" size="sm">
                <Database className="w-4 h-4 mr-2" />
                Export SQL
              </Button>
              <Button onClick={() => onExport(quiz, 'csv')} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => onExport(quiz, 'json')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// =============================================================================
// EXPORT FUNCTIONS
// =============================================================================

function generateCSV(quiz: GeneratedQuiz): string {
  const headers = [
    'Question Number', 'Question Type', 'Difficulty Level', 'Category', 'Question',
    'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 
    'Hint', 'Explanation', 'Tags', 'Sources'
  ]
  
  const rows = quiz.questions.map(q => [
    q.questionNumber.toString(),
    q.questionType,
    q.difficultyLevel,
    q.category,
    q.question,
    q.optionA || '',
    q.optionB || '',
    q.optionC || '',
    q.optionD || '',
    q.correctAnswer,
    q.hint,
    q.explanation,
    q.tags.join('; '),
    JSON.stringify(q.sources)
  ])
  
  return [headers.join(','), ...rows.map(row => 
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  )].join('\n')
}

function generateSQL(quiz: GeneratedQuiz): string {
  const topicId = quiz.topic.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + new Date().getFullYear()
  
  const lines = [
    '-- CivicSense Generated Quiz Content',
    `-- Topic: ${quiz.topic}`,
    `-- Generated: ${new Date().toISOString()}`,
    '',
    '-- Insert topic',
    'INSERT INTO question_topics (',
    '    topic_id, topic_title, description, why_this_matters,',
    '    emoji, date, day_of_week, categories, is_active',
    ') VALUES (',
    `    '${topicId}',`,
    `    '${quiz.topic.replace(/'/g, "''")}',`,
    `    '${quiz.description.replace(/'/g, "''")}',`,
    `    '<ul><li><strong>Civic Education:</strong> ${quiz.description}</li></ul>',`,
    `    '📰',`,
    `    '${new Date().toISOString().split('T')[0]}',`,
    `    '${new Date().toLocaleDateString('en-US', { weekday: 'long' })}',`,
    `    '${JSON.stringify(Array.from(new Set(quiz.questions.map(q => q.category))))}',`,
    `    true`,
    ');',
    '',
    '-- Insert questions'
  ]
  
  quiz.questions.forEach(q => {
    lines.push(
      'INSERT INTO questions (',
      '    topic_id, question_number, question_type, category, question,',
      '    option_a, option_b, option_c, option_d, correct_answer,',
      '    hint, explanation, tags, sources, difficulty_level, is_active',
      ') VALUES (',
      `    '${topicId}',`,
      `    ${q.questionNumber},`,
      `    '${q.questionType.toLowerCase().replace(' ', '_')}',`,
      `    '${q.category}',`,
      `    '${q.question.replace(/'/g, "''")}',`,
      `    ${q.optionA ? `'${q.optionA.replace(/'/g, "''")}'` : 'NULL'},`,
      `    ${q.optionB ? `'${q.optionB.replace(/'/g, "''")}'` : 'NULL'},`,
      `    ${q.optionC ? `'${q.optionC.replace(/'/g, "''")}'` : 'NULL'},`,
      `    ${q.optionD ? `'${q.optionD.replace(/'/g, "''")}'` : 'NULL'},`,
      `    '${q.correctAnswer.replace(/'/g, "''")}',`,
      `    '${q.hint.replace(/'/g, "''")}',`,
      `    '${q.explanation.replace(/'/g, "''")}',`,
      `    '${JSON.stringify(q.tags)}',`,
      `    '${JSON.stringify(q.sources)}',`,
      `    ${getDifficultyNumber(q.difficultyLevel)},`,
      `    true`,
      ');',
      ''
    )
  })
  
  return lines.join('\n')
}

function getDifficultyNumber(difficulty: string): number {
  const map = { 'Recall': 1, 'Comprehension': 2, 'Analysis': 3, 'Evaluation': 4 }
  return map[difficulty as keyof typeof map] || 2
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AdminContentGenerator() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to generate content'
  })
  const [generatedQuizzes, setGeneratedQuizzes] = useState<GeneratedQuiz[]>([])
  const [settings, setSettings] = useState<GenerationSettings>({
    aiProvider: 'anthropic',
    questionCount: 20,
    enableWebSearch: true,
    validateSources: true,
    enforceLimits: true,
    categories: ['Government', 'Elections', 'Civil Rights'],
    difficultyDistribution: {
      recall: 4,
      comprehension: 8,
      analysis: 6,
      evaluation: 2
    },
    questionTypeDistribution: {
      multipleChoice: 10,
      trueFalse: 3,
      shortAnswer: 2,
      matching: 2,
      fillInBlank: 2,
      ordering: 1
    }
  })
  
  // Load news articles on mount
  useEffect(() => {
    loadLatestNews()
  }, [])
  
  const loadLatestNews = async () => {
    setIsLoadingNews(true)
    try {
      const response = await fetch('/api/news/headlines?maxArticles=12')
      if (!response.ok) throw new Error('Failed to fetch news')
      
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Error loading news:', error)
    } finally {
      setIsLoadingNews(false)
    }
  }
  
  const generateQuizFromArticle = async (article: NewsArticle) => {
    setGenerationStatus({
      stage: 'analyzing-article',
      progress: 10,
      message: 'Analyzing article content...',
      currentStep: `Processing: ${article.title.substring(0, 50)}...`
    })
    
    try {
      const response = await fetch('/api/admin/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article,
          settings,
          user_id: user?.id
        })
      })
      
      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`)
      }
      
      // Stream the response for real-time updates
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')
      
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += new TextDecoder().decode(value)
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.status) {
                setGenerationStatus(data.status)
              }
              if (data.quiz) {
                const quiz: GeneratedQuiz = {
                  ...data.quiz,
                  metadata: {
                    generated_at: new Date().toISOString(),
                    source_article: article,
                    generation_method: 'news-ticker-integration',
                    ai_model: settings.aiProvider,
                    validation_status: 'pending'
                  }
                }
                setGeneratedQuizzes(prev => [...prev, quiz])
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', e)
            }
          }
        }
      }
      
      setGenerationStatus({
        stage: 'complete',
        progress: 100,
        message: 'Quiz generated successfully!'
      })
      
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationStatus({
        stage: 'error',
        progress: 0,
        message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }
  
  const handleEditQuiz = (quiz: GeneratedQuiz) => {
    // Open quiz editor modal
    console.log('Edit quiz:', quiz.topic)
  }
  
  const handleSaveQuiz = async (quiz: GeneratedQuiz) => {
    try {
      const response = await fetch('/api/admin/save-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz,
          user_id: user?.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save quiz')
      }
      
      console.log('Quiz saved successfully')
    } catch (error) {
      console.error('Save error:', error)
    }
  }
  
  const handleExportQuiz = (quiz: GeneratedQuiz, format: 'sql' | 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${quiz.topic.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}`
    
    switch (format) {
      case 'sql':
        downloadFile(generateSQL(quiz), `${filename}.sql`, 'text/sql')
        break
      case 'csv':
        downloadFile(generateCSV(quiz), `${filename}.csv`, 'text/csv')
        break
      case 'json':
        downloadFile(JSON.stringify(quiz, null, 2), `${filename}.json`, 'application/json')
        break
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Zap className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CivicSense Content Generator
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Transform current news into high-quality civic education quizzes with AI-powered content generation that follows CivicSense guidelines
        </p>
      </div>
      
      {/* Settings Panel */}
      <GenerationSettingsPanel 
        settings={settings} 
        onSettingsChange={setSettings} 
      />
      
      {/* Generation Status */}
      {generationStatus.stage !== 'idle' && (
        <GenerationProgressTracker status={generationStatus} />
      )}
      
      {/* Generated Quizzes */}
      {generatedQuizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Generated Quizzes</h2>
          {generatedQuizzes.map((quiz, index) => (
            <QuizPreviewCard
              key={index}
              quiz={quiz}
              onEdit={handleEditQuiz}
              onSave={handleSaveQuiz}
              onExport={handleExportQuiz}
            />
          ))}
        </div>
      )}
      
      {/* News Sources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current News Sources</h2>
          <Button onClick={loadLatestNews} disabled={isLoadingNews}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingNews ? 'animate-spin' : ''}`} />
            Refresh News
          </Button>
        </div>
        
        {isLoadingNews ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <NewsSourceCard
                key={article.id}
                article={article}
                onGenerate={generateQuizFromArticle}
                isGenerating={generationStatus.stage !== 'idle' && generationStatus.stage !== 'complete' && generationStatus.stage !== 'error'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 