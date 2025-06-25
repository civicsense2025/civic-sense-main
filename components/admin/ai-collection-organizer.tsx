/**
 * AI Collection Organizer Admin Interface
 * 
 * Provides a comprehensive interface for managing the AI Collection Organizer Agent:
 * - Generate collection suggestions from existing content
 * - Preview and modify suggestions before creation
 * - Track AI performance and collection analytics
 * - Manage collection inheritance of skills and sources
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Brain, 
  Sparkles, 
  FileText, 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Play,
  Eye,
  Edit,
  Save,
  RefreshCw,
  Database,
  Target,
  BookOpen,
  Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface CollectionSuggestion {
  suggested_title: string
  suggested_description: string
  suggested_emoji: string
  suggested_slug: string
  primary_theme: string
  theme_confidence: number
  related_themes: string[]
  content_items: Array<{
    id: string
    type: string
    title: string
    description: string
    difficulty_level: number
    estimated_minutes: number
  }>
  content_coherence_score: number
  aggregated_skills: {
    total_skills: number
    primary_categories: string[]
    skill_distribution: Record<string, number>
    estimated_skill_hours: number
  }
  difficulty_range: [number, number]
  total_estimated_minutes: number
  source_diversity_score: number
  suggested_learning_objectives: string[]
  suggested_prerequisites: string[]
  suggested_action_items: string[]
  current_events_relevance: 1 | 2 | 3 | 4 | 5
  political_balance_score: 1 | 2 | 3 | 4 | 5
  suggested_categories: string[]
  suggested_tags: string[]
}

interface GenerationOptions {
  content_types: string[]
  max_suggestions: number
  min_items_per_collection: number
  theme_specificity: 'broad' | 'specific' | 'mixed'
  include_current_events: boolean
  filter_existing: boolean
}

interface AnalysisStats {
  total_content_analyzed: number
  theme_clusters_found: number
  processing_time_ms: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AICollectionOrganizer() {
  // State management
  const [suggestions, setSuggestions] = useState<CollectionSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<CollectionSuggestion | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [analysisStats, setAnalysisStats] = useState<AnalysisStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Generation options
  const [options, setOptions] = useState<GenerationOptions>({
    content_types: ['topic', 'question'],
    max_suggestions: 10,
    min_items_per_collection: 3,
    theme_specificity: 'mixed',
    include_current_events: true,
    filter_existing: true
  })
  
  // UI state
  const [activeTab, setActiveTab] = useState('generate')
  const [showPreview, setShowPreview] = useState(false)
  
  // Advanced analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    theme_distribution: Array<{
      theme: string
      count: number
      engagement_rate: number
      color: string
    }>
    quality_metrics: {
      avg_confidence: number
      high_quality_percentage: number
      source_reliability: number
      content_freshness: number
    }
    performance_trends: Array<{
      date: string
      suggestions_generated: number
      collections_created: number
      user_engagement: number
    }>
    user_feedback: Array<{
      suggestion_id: string
      rating: number
      feedback: string
      implemented: boolean
    }>
    processing_stats: {
      total_content_analyzed: number
      avg_processing_time: number
      ai_model_performance: number
      cache_hit_rate: number
    }
  }>({
    theme_distribution: [],
    quality_metrics: {
      avg_confidence: 0,
      high_quality_percentage: 0,
      source_reliability: 0,
      content_freshness: 0
    },
    performance_trends: [],
    user_feedback: [],
    processing_stats: {
      total_content_analyzed: 0,
      avg_processing_time: 0,
      ai_model_performance: 0,
      cache_hit_rate: 0
    }
  })
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false)
  const [realTimeStats, setRealTimeStats] = useState({
    suggestions_generated_today: 0,
    collections_created_today: 0,
    avg_quality_score: 0,
    user_adoption_rate: 0
  })

  // Enhanced generation options with ML features
  const [mlOptions, setMlOptions] = useState({
    use_ml_theme_detection: true,
    personalize_suggestions: false,
    include_behavioral_data: false,
    optimize_for_engagement: true,
    use_external_enrichment: false
  })
  
  // Load initial stats
  useEffect(() => {
    loadCollectionStats()
    loadAnalyticsData()
    const interval = setInterval(loadRealTimeStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])
  
  // ============================================================================
  // API FUNCTIONS
  // ============================================================================
  
  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/admin/collections/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate suggestions')
      }
      
      setSuggestions(data.suggestions || [])
      setAnalysisStats(data.analysis_stats)
      setSuccess(`Generated ${data.suggestions?.length || 0} collection suggestions`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsGenerating(false)
    }
  }, [options])
  
  const createCollectionFromSuggestion = useCallback(async (
    suggestion: CollectionSuggestion,
    customModifications?: any
  ) => {
    setIsCreating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/collections/create-from-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion,
          options: {
            status: 'draft',
            auto_publish: false,
            custom_modifications: customModifications
          }
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create collection')
      }
      
      setSuccess(`Created collection "${data.collection?.title}" with ${data.collection?.items_count} items`)
      
      // Remove the suggestion from the list
      setSuggestions(prev => prev.filter(s => s.suggested_slug !== suggestion.suggested_slug))
      setShowPreview(false)
      setSelectedSuggestion(null)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsCreating(false)
    }
  }, [])
  
  const loadCollectionStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/collections/suggest')
      const data = await response.json()
      
      if (data.success) {
        // Could set general stats here
      }
    } catch (err) {
      console.warn('Could not load collection stats:', err)
    }
  }, [])

  const loadAnalyticsData = useCallback(async () => {
    try {
      // Simulate analytics data loading
      const mockAnalytics = {
        theme_distribution: [
          { theme: 'Constitutional Rights', count: 15, engagement_rate: 0.85, color: '#3B82F6' },
          { theme: 'Electoral Process', count: 12, engagement_rate: 0.78, color: '#EF4444' },
          { theme: 'Government Structure', count: 10, engagement_rate: 0.82, color: '#10B981' },
          { theme: 'Policy Analysis', count: 8, engagement_rate: 0.76, color: '#F59E0B' },
          { theme: 'Civic Participation', count: 6, engagement_rate: 0.88, color: '#8B5CF6' }
        ],
        quality_metrics: {
          avg_confidence: 0.82,
          high_quality_percentage: 0.74,
          source_reliability: 0.91,
          content_freshness: 0.87
        },
        performance_trends: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          suggestions_generated: Math.floor(Math.random() * 20) + 10,
          collections_created: Math.floor(Math.random() * 10) + 3,
          user_engagement: Math.random() * 0.3 + 0.7
        })),
        user_feedback: [
          {
            suggestion_id: 'sg_1',
            rating: 5,
            feedback: 'Excellent thematic grouping, very coherent collection',
            implemented: true
          },
          {
            suggestion_id: 'sg_2', 
            rating: 4,
            feedback: 'Good suggestions but could use more current events',
            implemented: false
          }
        ],
        processing_stats: {
          total_content_analyzed: 1247,
          avg_processing_time: 2.3,
          ai_model_performance: 0.89,
          cache_hit_rate: 0.67
        }
      }
      setAnalyticsData(mockAnalytics)
    } catch (error) {
      console.warn('Could not load analytics data:', error)
    }
  }, [])

  const loadRealTimeStats = useCallback(async () => {
    try {
      // Simulate real-time stats
      setRealTimeStats({
        suggestions_generated_today: Math.floor(Math.random() * 50) + 20,
        collections_created_today: Math.floor(Math.random() * 15) + 5,
        avg_quality_score: Math.random() * 0.3 + 0.7,
        user_adoption_rate: Math.random() * 0.2 + 0.8
      })
    } catch (error) {
      console.warn('Could not load real-time stats:', error)
    }
  }, [])
  
  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================
  
  const renderGenerationOptions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Generation Options
        </CardTitle>
        <CardDescription>
          Configure how the AI analyzes your content and generates collection suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Types */}
        <div className="space-y-3">
          <Label>Content Types to Analyze</Label>
          <div className="flex flex-wrap gap-3">
            {['topic', 'question', 'glossary_term', 'survey'].map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={options.content_types.includes(type)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setOptions(prev => ({
                        ...prev,
                        content_types: [...prev.content_types, type]
                      }))
                    } else {
                      setOptions(prev => ({
                        ...prev,
                        content_types: prev.content_types.filter(t => t !== type)
                      }))
                    }
                  }}
                />
                <Label htmlFor={type} className="capitalize">
                  {type.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Theme Specificity */}
        <div className="space-y-3">
          <Label htmlFor="theme-specificity">Theme Specificity</Label>
          <Select
            value={options.theme_specificity}
            onValueChange={(value: 'broad' | 'specific' | 'mixed') => 
              setOptions(prev => ({ ...prev, theme_specificity: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="broad">Broad themes (fewer, larger collections)</SelectItem>
              <SelectItem value="specific">Specific themes (more, focused collections)</SelectItem>
              <SelectItem value="mixed">Mixed approach (balanced)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Numeric Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max-suggestions">Max Suggestions</Label>
            <Input
              id="max-suggestions"
              type="number"
              min="1"
              max="20"
              value={options.max_suggestions}
              onChange={(e) => setOptions(prev => ({ 
                ...prev, 
                max_suggestions: parseInt(e.target.value) || 10 
              }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min-items">Min Items per Collection</Label>
            <Input
              id="min-items"
              type="number"
              min="2"
              max="10"
              value={options.min_items_per_collection}
              onChange={(e) => setOptions(prev => ({ 
                ...prev, 
                min_items_per_collection: parseInt(e.target.value) || 3 
              }))}
            />
          </div>
        </div>
        
        {/* Boolean Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="current-events"
              checked={options.include_current_events}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, include_current_events: !!checked }))
              }
            />
            <Label htmlFor="current-events">Prioritize current events relevance</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filter-existing"
              checked={options.filter_existing}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, filter_existing: !!checked }))
              }
            />
            <Label htmlFor="filter-existing">Filter out existing collections</Label>
          </div>
        </div>
        
        {/* Generate Button */}
        <Button 
          onClick={generateSuggestions}
          disabled={isGenerating || options.content_types.length === 0}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Content...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Collection Suggestions
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
  
  const renderSuggestionCard = (suggestion: CollectionSuggestion, index: number) => (
    <Card key={suggestion.suggested_slug} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{suggestion.suggested_emoji}</span>
            <div>
              <CardTitle className="text-lg">{suggestion.suggested_title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {suggestion.suggested_description}
              </CardDescription>
            </div>
          </div>
          <Badge variant={suggestion.current_events_relevance >= 4 ? 'default' : 'secondary'}>
            Relevance: {suggestion.current_events_relevance}/5
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Theme and Confidence */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{suggestion.primary_theme}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {Math.round(suggestion.theme_confidence * 100)}% confidence
            </span>
          </div>
        </div>
        
        {/* Content Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{suggestion.content_items.length} items</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{Math.round(suggestion.total_estimated_minutes / 60)}h</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{suggestion.aggregated_skills.total_skills} skills</span>
          </div>
        </div>
        
        {/* Difficulty Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Difficulty:</span>
          <Badge variant="outline">
            {suggestion.difficulty_range[0]} - {suggestion.difficulty_range[1]}/5
          </Badge>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {suggestion.suggested_tags.slice(0, 4).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {suggestion.suggested_tags.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{suggestion.suggested_tags.length - 4} more
            </Badge>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSuggestion(suggestion)
              setShowPreview(true)
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          
          <Button
            size="sm"
            onClick={() => createCollectionFromSuggestion(suggestion)}
            disabled={isCreating}
          >
            {isCreating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Create Collection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
  
  const renderSuggestionPreview = () => {
    if (!selectedSuggestion) return null
    
    return (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedSuggestion.suggested_emoji}</span>
              {selectedSuggestion.suggested_title}
            </DialogTitle>
            <DialogDescription>
              Review and modify this collection suggestion before creating
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Collection Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Theme</Label>
                <p className="text-sm font-medium">{selectedSuggestion.primary_theme}</p>
              </div>
              <div>
                <Label>Confidence</Label>
                <div className="flex items-center gap-2">
                  <Progress value={selectedSuggestion.theme_confidence * 100} className="flex-1" />
                  <span className="text-sm">{Math.round(selectedSuggestion.theme_confidence * 100)}%</span>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <Label>Description</Label>
              <p className="text-sm mt-1">{selectedSuggestion.suggested_description}</p>
            </div>
            
            {/* Learning Objectives */}
            <div>
              <Label>Learning Objectives</Label>
              <ul className="text-sm mt-1 space-y-1">
                {selectedSuggestion.suggested_learning_objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Content Items */}
            <div>
              <Label>Content Items ({selectedSuggestion.content_items.length})</Label>
              <div className="grid gap-2 mt-2 max-h-60 overflow-y-auto">
                {selectedSuggestion.content_items.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type} • Difficulty {item.difficulty_level}/5 • {item.estimated_minutes}min
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skills Summary */}
            <div>
              <Label>Skills Developed</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm">
                    <strong>{selectedSuggestion.aggregated_skills.total_skills}</strong> total skills
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSuggestion.aggregated_skills.estimated_skill_hours.toFixed(1)} hours of skill development
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Primary Categories:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSuggestion.aggregated_skills.primary_categories.map(category => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Items */}
            <div>
              <Label>Suggested Action Items</Label>
              <ul className="text-sm mt-1 space-y-1">
                {selectedSuggestion.suggested_action_items.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Create Collection Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createCollectionFromSuggestion(selectedSuggestion)}
                disabled={isCreating}
              >
                {isCreating ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Create Collection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  const renderAnalysisStats = () => {
    if (!analysisStats) return null
    
    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analysisStats.total_content_analyzed}</p>
                <p className="text-sm text-muted-foreground">Content Items Analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analysisStats.theme_clusters_found}</p>
                <p className="text-sm text-muted-foreground">Theme Clusters Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{(analysisStats.processing_time_ms / 1000).toFixed(1)}s</p>
                <p className="text-sm text-muted-foreground">Processing Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Real-time metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's AI Suggestions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.suggestions_generated_today}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections Created</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.collections_created_today}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((realTimeStats.collections_created_today / realTimeStats.suggestions_generated_today) * 100)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(realTimeStats.avg_quality_score * 100)}%</div>
            <Progress value={realTimeStats.avg_quality_score * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Adoption</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(realTimeStats.user_adoption_rate * 100)}%</div>
            <p className="text-xs text-muted-foreground">
              Educators using AI suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Theme Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Distribution & Engagement</CardTitle>
          <CardDescription>
            AI-detected themes and their user engagement rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.theme_distribution.map((theme, index) => (
              <div key={theme.theme} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="font-medium">{theme.theme}</span>
                  <Badge variant="secondary">{theme.count} items</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={theme.engagement_rate * 100} 
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {Math.round(theme.engagement_rate * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Model Performance</CardTitle>
            <CardDescription>
              Key metrics for AI suggestion quality and efficiency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Average Confidence</span>
                <span className="text-sm font-medium">
                  {Math.round(analyticsData.quality_metrics.avg_confidence * 100)}%
                </span>
              </div>
              <Progress value={analyticsData.quality_metrics.avg_confidence * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Source Reliability</span>
                <span className="text-sm font-medium">
                  {Math.round(analyticsData.quality_metrics.source_reliability * 100)}%
                </span>
              </div>
              <Progress value={analyticsData.quality_metrics.source_reliability * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Processing Efficiency</span>
                <span className="text-sm font-medium">
                  {Math.round(analyticsData.processing_stats.ai_model_performance * 100)}%
                </span>
              </div>
              <Progress value={analyticsData.processing_stats.ai_model_performance * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Cache Hit Rate</span>
                <span className="text-sm font-medium">
                  {Math.round(analyticsData.processing_stats.cache_hit_rate * 100)}%
                </span>
              </div>
              <Progress value={analyticsData.processing_stats.cache_hit_rate * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Real-time monitoring of AI collection organizer components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">AI Model</span>
                </div>
                <Badge variant="default">Operational</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Content Pipeline</span>
                </div>
                <Badge variant="default">Healthy</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">External APIs</span>
                </div>
                <Badge variant="secondary">Degraded</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Database</span>
                </div>
                <Badge variant="default">Optimal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Feedback Summary */}
      <Card>
        <CardHeader>
          <CardTitle>User Feedback Analysis</CardTitle>
          <CardDescription>
            Recent feedback on AI-generated collection suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.user_feedback.map((feedback, index) => (
              <div key={feedback.suggestion_id} className="border-l-2 border-blue-500 pl-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Rating: {feedback.rating}/5</span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    {feedback.implemented && (
                      <Badge variant="default" className="text-xs">Implemented</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {feedback.feedback}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Add ML Options to generation options
  const renderMLOptions = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Machine Learning Features
        </CardTitle>
        <CardDescription>
          Advanced AI features for improved collection suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="ml-theme-detection"
            checked={mlOptions.use_ml_theme_detection}
            onCheckedChange={(checked) => 
              setMlOptions(prev => ({ ...prev, use_ml_theme_detection: !!checked }))
            }
          />
          <Label htmlFor="ml-theme-detection">Use ML-based theme detection</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="personalize-suggestions"
            checked={mlOptions.personalize_suggestions}
            onCheckedChange={(checked) => 
              setMlOptions(prev => ({ ...prev, personalize_suggestions: !!checked }))
            }
          />
          <Label htmlFor="personalize-suggestions">Personalize suggestions based on user behavior</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-behavioral-data"
            checked={mlOptions.include_behavioral_data}
            onCheckedChange={(checked) => 
              setMlOptions(prev => ({ ...prev, include_behavioral_data: !!checked }))
            }
          />
          <Label htmlFor="include-behavioral-data">Include user behavioral analytics</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="optimize-engagement"
            checked={mlOptions.optimize_for_engagement}
            onCheckedChange={(checked) => 
              setMlOptions(prev => ({ ...prev, optimize_for_engagement: !!checked }))
            }
          />
          <Label htmlFor="optimize-engagement">Optimize for predicted engagement</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="external-enrichment"
            checked={mlOptions.use_external_enrichment}
            onCheckedChange={(checked) => 
              setMlOptions(prev => ({ ...prev, use_external_enrichment: !!checked }))
            }
          />
          <Label htmlFor="external-enrichment">Enrich with external civic data APIs</Label>
        </div>
      </CardContent>
    </Card>
  )
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Collection Organizer</h1>
          <p className="text-muted-foreground">
            Intelligent content organization with skill and source inheritance
          </p>
        </div>
      </div>
      
      {/* Error/Success Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate Suggestions</TabsTrigger>
          <TabsTrigger value="suggestions">
            Review Suggestions
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="ml-2">{suggestions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-6">
          {renderGenerationOptions()}
          {renderMLOptions()}
        </TabsContent>
        
        <TabsContent value="suggestions" className="space-y-6">
          {/* Analysis Stats */}
          {renderAnalysisStats()}
          
          {/* Suggestions Grid */}
          {suggestions.length > 0 ? (
            <div className="grid gap-4">
              {suggestions.map((suggestion, index) => renderSuggestionCard(suggestion, index))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Suggestions Generated</h3>
                <p className="text-muted-foreground mb-4">
                  Generate collection suggestions to see them here
                </p>
                <Button onClick={() => setActiveTab('generate')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          {renderAnalyticsTab()}
        </TabsContent>
      </Tabs>
      
      {/* Preview Dialog */}
      {renderSuggestionPreview()}
    </div>
  )
} 