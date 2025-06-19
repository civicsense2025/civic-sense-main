"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb,
  BarChart3,
  RefreshCw,
  Wand2,
  Target
} from "lucide-react"

interface Survey {
  id: string
  title: string
  description: string
  questions: any[]
  post_completion_config?: any
}

interface OptimizationSuggestion {
  type: 'question_wording' | 'question_type' | 'survey_flow' | 'completion_settings' | 'bias_detection'
  severity: 'low' | 'medium' | 'high'
  questionId?: string
  title: string
  description: string
  currentValue: string
  suggestedValue: string
  reasoning: string
  impact: string
  confidence: number
}

interface AISurveyOptimizerProps {
  survey: Survey
  onUpdateSurvey: (updates: Partial<Survey>) => void
  className?: string
}

export function AISurveyOptimizer({ survey, onUpdateSurvey, className }: AISurveyOptimizerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('openai')
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'quick' | 'specific'>('comprehensive')
  const [customPrompt, setCustomPrompt] = useState('')

  const analyzeSurvey = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ai-survey-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey,
          provider: selectedProvider,
          analysisType,
          customPrompt: customPrompt.trim() || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        toast({
          title: "Analysis complete",
          description: `Found ${data.suggestions?.length || 0} optimization opportunities.`
        })
      } else {
        throw new Error('Analysis failed')
      }
    } catch (error) {
      console.error('Error analyzing survey:', error)
      toast({
        title: "Analysis failed",
        description: "Failed to analyze survey. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = async (suggestion: OptimizationSuggestion) => {
    try {
      const response = await fetch('/api/admin/apply-survey-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: survey.id,
          suggestion
        })
      })

      if (response.ok) {
        const data = await response.json()
        onUpdateSurvey(data.updatedSurvey)
        
        // Remove applied suggestion
        setSuggestions(prev => prev.filter(s => s !== suggestion))
        
        toast({
          title: "Optimization applied",
          description: suggestion.title
        })
      } else {
        throw new Error('Failed to apply optimization')
      }
    } catch (error) {
      console.error('Error applying suggestion:', error)
      toast({
        title: "Application failed",
        description: "Failed to apply optimization. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question_wording': return <Lightbulb className="w-4 h-4" />
      case 'question_type': return <Target className="w-4 h-4" />
      case 'survey_flow': return <TrendingUp className="w-4 h-4" />
      case 'completion_settings': return <CheckCircle2 className="w-4 h-4" />
      case 'bias_detection': return <AlertTriangle className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  return (
    <Card className={cn("border-slate-200 dark:border-slate-700", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <span>AI Survey Optimizer</span>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze">Analyze & Optimize</TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions ({suggestions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analyze" className="space-y-6">
            {/* Analysis Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  AI Provider
                </label>
                <Select value={selectedProvider} onValueChange={(value: 'openai' | 'anthropic') => setSelectedProvider(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Analysis Type
                </label>
                <Select value={analysisType} onValueChange={(value: 'comprehensive' | 'quick' | 'specific') => setAnalysisType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                    <SelectItem value="quick">Quick Optimization</SelectItem>
                    <SelectItem value="specific">Specific Focus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Analysis Prompt */}
            {analysisType === 'specific' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Custom Analysis Focus
                </label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe what you'd like the AI to focus on (e.g., 'Check for bias in political questions', 'Optimize for mobile users', 'Improve completion rates')"
                  className="min-h-[100px]"
                />
              </div>
            )}

            {/* Survey Overview */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2">
              <h4 className="font-medium text-slate-900 dark:text-white">Survey Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Questions:</span>
                  <span className="ml-2 font-medium">{survey.questions.length}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Types:</span>
                  <span className="ml-2 font-medium">
                    {new Set(survey.questions.map(q => q.type)).size}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Required:</span>
                  <span className="ml-2 font-medium">
                    {survey.questions.filter(q => q.required).length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Enhanced:</span>
                  <span className="ml-2 font-medium">
                    {survey.post_completion_config?.enabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis Button */}
            <Button
              onClick={analyzeSurvey}
              disabled={loading}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Survey...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimize with AI
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="suggestions" className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No Suggestions Yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Run an AI analysis to get optimization suggestions for your survey.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getTypeIcon(suggestion.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-slate-900 dark:text-white">
                                  {suggestion.title}
                                </h4>
                                <Badge className={getSeverityColor(suggestion.severity)}>
                                  {suggestion.severity}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.confidence}% confidence
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {suggestion.description}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Current vs Suggested */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Current
                            </label>
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <p className="text-sm text-slate-900 dark:text-white">
                                {suggestion.currentValue}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Suggested
                            </label>
                            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <p className="text-sm text-slate-900 dark:text-white">
                                {suggestion.suggestedValue}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Reasoning and Impact */}
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                              AI Reasoning
                            </h5>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {suggestion.reasoning}
                            </p>
                          </div>
                          
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                            <h5 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                              Expected Impact
                            </h5>
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              {suggestion.impact}
                            </p>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Type: {suggestion.type.replace('_', ' ')} 
                            {suggestion.questionId && ` • Question ID: ${suggestion.questionId}`}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSuggestions(prev => prev.filter(s => s !== suggestion))}
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => applySuggestion(suggestion)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Wand2 className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 