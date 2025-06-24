"use client"

import React, { useState, useEffect, Component, ReactNode } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  Sparkles, 
  Play, 
  Eye, 
  Settings, 
  FileText,
  Zap,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Target,
  Book,
  Users,
  Clock,
  Award,
  RefreshCw,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  BarChart3,
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

// Error boundary component to catch any runtime errors
class AIContentErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI Content page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simplified interfaces
interface GenerationJob {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  articlesProcessed: number
  topicsGenerated: number
  questionsGenerated: number
  startedAt: string
  completedAt?: string
  error?: string
  results?: any
}

interface QuickStats {
  totalTopics: number
  totalQuestions: number
  recentArticles: number
  pendingReview: number
}

// Preset configurations that integrate all our content rules
const GENERATION_PRESETS = {
  daily_quiz: {
    name: "Daily Quiz",
    description: "Generate 1-2 topics with 6 questions each from today's news",
    icon: Target,
    settings: {
      maxArticles: 3,
      questionsPerTopic: 6,
      focusMode: "current_events",
      difficulty: "mixed",
      aiModel: "claude-3-7-sonnet-20250219",
      enableWebSearch: true
    }
  },
  weekly_deep_dive: {
    name: "Weekly Deep Dive", 
    description: "Generate comprehensive content from this week's top stories",
    icon: Book,
    settings: {
      maxArticles: 10,
      questionsPerTopic: 12,
      focusMode: "comprehensive",
      difficulty: "advanced",
      aiModel: "claude-3-7-sonnet-20250219",
      enableWebSearch: true
    }
  },
  breaking_news: {
    name: "Breaking News",
    description: "Quick content generation from urgent civic developments",
    icon: Zap,
    settings: {
      maxArticles: 2,
      questionsPerTopic: 4,
      focusMode: "breaking",
      difficulty: "accessible",
      aiModel: "gpt-4-turbo",
      enableWebSearch: true
    }
  },
  custom: {
    name: "Custom Generation",
    description: "Full control over all generation parameters",
    icon: Settings,
    settings: {
      maxArticles: 5,
      questionsPerTopic: 6,
      focusMode: "balanced",
      difficulty: "mixed",
      aiModel: "claude-3-7-sonnet-20250219",
      enableWebSearch: true
    }
  }
} as const

function AIContentAdminPageComponent() {
  const { user } = useAuth()
  const { isAdmin, isLoading: adminLoading } = useAdminAccess()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof GENERATION_PRESETS>('daily_quiz')
  const [showPrompt, setShowPrompt] = useState(false)
  const [customSettings, setCustomSettings] = useState({
    maxArticles: 5,
    questionsPerTopic: 6,
    aiModel: 'claude-3-7-sonnet-20250219' as const,
    enableWebSearch: true,
    customPrompt: ''
  })

  // Since middleware protects admin routes, we can assume user is admin if they reach this page
  useEffect(() => {
    if (user && isAdmin) {
      console.log('✅ Admin access verified for user:', user.email)
      loadStats()
    }
  }, [user, isAdmin])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      
      // Create Supabase client for client-side operations
      const supabase = createClient()
      
      if (!supabase) {
        throw new Error('Failed to create Supabase client')
      }
      
      // Load quick stats with proper error handling
      const statsPromises = [
        supabase.from('question_topics').select('id', { count: 'exact' }),
        supabase.from('questions').select('id', { count: 'exact' }),
        supabase.from('source_metadata').select('id', { count: 'exact' })
          .gte('last_fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]

      const results = await Promise.allSettled(statsPromises)
      
      const topicsCount = results[0].status === 'fulfilled' ? results[0].value.count || 0 : 0
      const questionsCount = results[1].status === 'fulfilled' ? results[1].value.count || 0 : 0
      const articlesCount = results[2].status === 'fulfilled' ? results[2].value.count || 0 : 0

      setStats({
        totalTopics: topicsCount,
        totalQuestions: questionsCount,
        recentArticles: articlesCount,
        pendingReview: 0
      })

    } catch (error) {
      console.error('Error loading stats:', error)
      // Set fallback stats if database queries fail
      setStats({
        totalTopics: 0,
        totalQuestions: 0,
        recentArticles: 0,
        pendingReview: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generatePrompt = (preset: keyof typeof GENERATION_PRESETS) => {
    try {
      const config = GENERATION_PRESETS[preset]
      
      if (!config) {
        throw new Error(`Invalid preset: ${preset}`)
      }
      
      // This integrates all our content rules into a comprehensive prompt
      return `# CivicSense Content Generation System

## Mission
Generate civic education content that politicians don't want people to have - transforming passive observers into confident, effective participants in democracy.

## Core Content Principles (REQUIRED)
- **Truth Over Comfort**: Reveal uncomfortable truths about power structures
- **Clarity Over Politeness**: Use active voice, name specific actors and institutions
- **Action Over Passive Consumption**: Every piece must include actionable civic engagement steps
- **Evidence Over Opinion**: All claims must be backed by verifiable sources

## Brand Voice Requirements
- Write like Tán talking to a smart friend - natural, direct, story-driven
- Lead with "why should I care?" in first paragraph
- Connect abstract concepts to concrete personal consequences
- Challenge assumptions while providing evidence
- Feel authentic and conversational, not corporate or academic

## Content Quality Standards (Must achieve 70+ overall score)
- **Uncomfortable Truth Test**: Would politicians prefer people not know this? (Required)
- **Active Voice Test**: Names specific actors and assigns responsibility (>80% active voice)
- **Power Analysis Test**: Follows money and reveals hidden power dynamics (Required)
- **Actionability Test**: Provides 3+ specific actions people can take in next 24 hours (Required)
- **Accuracy Test**: All claims backed by primary sources (Required)

## Question Generation Rules
- **Distribution**: 70% Multiple Choice, 20% True/False, 10% Short Answer
- **Difficulty**: 20% recall, 40% comprehension, 30% analysis, 10% evaluation
- **Categories**: Government, Elections, Economy, Foreign Policy, Justice, Civil Rights, Environment, Local Issues, Constitutional Law, National Security, Public Policy, Historical Precedent, Civic Action, Electoral Systems, Legislative Process, Judicial Review, Policy Analysis, Civic Participation, Media Literacy
- **Sources**: Minimum 2 primary sources per question with exact URLs

## Generation Settings
- **Preset**: ${config.name}
- **Focus**: ${config.settings.focusMode}
- **Articles**: ${config.settings.maxArticles}
- **Questions per Topic**: ${config.settings.questionsPerTopic}
- **AI Model**: ${config.settings.aiModel}
- **Web Search**: ${config.settings.enableWebSearch ? 'Enabled' : 'Disabled'}

## Success Metrics
Content succeeds when users:
- Take more civic actions after engaging
- Become harder to manipulate
- Gain confidence to challenge power structures
- Connect individual actions to systemic change

Generate content that empowers citizens to win, not feel good about government.`
    } catch (error) {
      console.error('Error generating prompt:', error)
      return 'Error generating prompt. Please try again.'
    }
  }

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate content",
        variant: "destructive"
      })
      return
    }
    
    try {
      const preset = GENERATION_PRESETS[selectedPreset]
      
      if (!preset) {
        throw new Error('Invalid preset selected')
      }
      
      const settings = selectedPreset === 'custom' ? customSettings : preset.settings
      
      setCurrentJob({
        id: `job_${Date.now()}`,
        status: 'pending',
        progress: 0,
        articlesProcessed: 0,
        topicsGenerated: 0,
        questionsGenerated: 0,
        startedAt: new Date().toISOString()
      })

      const response = await fetch('/api/admin/generate-content-from-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          userId: user.id,
          preset: selectedPreset,
          systemPrompt: generatePrompt(selectedPreset)
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Generation failed')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentJob(prev => prev ? {
          ...prev,
          status: 'completed',
          progress: 100,
          articlesProcessed: result.results?.articlesProcessed || 0,
          topicsGenerated: result.results?.topicsGenerated || 0,
          questionsGenerated: result.results?.questionsGenerated || 0,
          completedAt: new Date().toISOString(),
          results: result.results
        } : null)
        
        toast({
          title: "Content Generated Successfully!",
          description: `Created ${result.results?.topicsGenerated || 0} topics with ${result.results?.questionsGenerated || 0} questions`,
        })
        
        // Refresh stats
        setTimeout(() => {
          loadStats()
        }, 1000)
      } else {
        throw new Error(result.error || 'Generation failed')
      }
      
    } catch (error) {
      console.error('Generation error:', error)
      
      setCurrentJob(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString()
      } : null)
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    }
  }

  if (isLoading || adminLoading || !stats || (!isAdmin)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading AI content system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="container mx-auto px-6 py-12 sm:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-light text-slate-900 dark:text-white">
                    AI Content Generator
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-light">
                    Generate civic education content that politicians don't want you to have
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-slate-900 dark:text-white">
                  {stats.totalTopics}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Total Topics</p>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-green-600 dark:text-green-400">
                  {stats.totalQuestions}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Total Questions</p>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-blue-600 dark:text-blue-400">
                  {stats.recentArticles}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Recent Articles</p>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-purple-600 dark:text-purple-400">
                  {stats.pendingReview}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Pending Review</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Job Status */}
          {currentJob && (
            <Card className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {currentJob.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                  {currentJob.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {currentJob.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  
                  Content Generation {currentJob.status === 'running' ? 'In Progress' : 
                                     currentJob.status === 'completed' ? 'Complete' :
                                     currentJob.status === 'failed' ? 'Failed' : 'Starting'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentJob.status === 'running' && (
                  <Progress value={currentJob.progress} className="w-full" />
                )}
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-medium text-slate-900 dark:text-white">
                      {currentJob.articlesProcessed}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Articles Processed</div>
                  </div>
                  <div>
                    <div className="text-lg font-medium text-green-600">
                      {currentJob.topicsGenerated}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Topics Generated</div>
                  </div>
                  <div>
                    <div className="text-lg font-medium text-blue-600">
                      {currentJob.questionsGenerated}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Questions Created</div>
                  </div>
                </div>
                
                {currentJob.error && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {currentJob.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generation Presets */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Choose Generation Type
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Each preset is optimized for different content needs and automatically applies CivicSense quality standards
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(GENERATION_PRESETS).map(([key, preset]) => {
                  const Icon = preset.icon
                  const isSelected = selectedPreset === key
                  
                  return (
                    <Card 
                      key={key}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      )}
                      onClick={() => setSelectedPreset(key as keyof typeof GENERATION_PRESETS)}
                    >
                      <CardContent className="p-4 text-center space-y-3">
                        <div className={cn(
                          "w-12 h-12 mx-auto rounded-lg flex items-center justify-center",
                          isSelected ? "bg-blue-100 dark:bg-blue-900" : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          <Icon className={cn(
                            "h-6 w-6",
                            isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                          )} />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {preset.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {preset.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Custom Settings */}
              {selectedPreset === 'custom' && (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <h4 className="font-medium text-slate-900 dark:text-white">Custom Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Articles</label>
                      <Select
                        value={customSettings.maxArticles.toString()}
                        onValueChange={(value) => setCustomSettings(prev => ({ 
                          ...prev, 
                          maxArticles: parseInt(value) 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 articles</SelectItem>
                          <SelectItem value="5">5 articles</SelectItem>
                          <SelectItem value="10">10 articles</SelectItem>
                          <SelectItem value="20">20 articles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Questions per Topic</label>
                      <Select
                        value={customSettings.questionsPerTopic.toString()}
                        onValueChange={(value) => setCustomSettings(prev => ({ 
                          ...prev, 
                          questionsPerTopic: parseInt(value) 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 questions</SelectItem>
                          <SelectItem value="6">6 questions</SelectItem>
                          <SelectItem value="8">8 questions</SelectItem>
                          <SelectItem value="12">12 questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">AI Model</label>
                      <Select
                        value={customSettings.aiModel}
                        onValueChange={(value: any) => setCustomSettings(prev => ({ 
                          ...prev, 
                          aiModel: value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Recommended)</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* System Prompt Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">System Prompt Preview</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrompt(!showPrompt)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPrompt ? 'Hide' : 'Show'} Prompt
                  </Button>
                </div>
                
                {showPrompt && (
                  <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 text-sm font-mono text-slate-100 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{generatePrompt(selectedPreset)}</pre>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  This will generate civic education content using CivicSense quality standards and brand voice guidelines
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={currentJob?.status === 'running'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {currentJob?.status === 'running' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent generation activity</p>
                <p className="text-sm mt-2">Generated content will appear here</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}

// Export with error boundary wrapper
export default function AIContentAdminPage() {
  return (
    <AIContentErrorBoundary>
      <AIContentAdminPageComponent />
    </AIContentErrorBoundary>
  )
} 