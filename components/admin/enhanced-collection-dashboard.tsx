'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  Brain,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  BookOpen,
  MessageCircle
} from 'lucide-react'

interface CollectionSuggestion {
  id: string
  title: string
  description: string
  confidence_score: number
  content_items: string[]
  theme: string
  estimated_engagement: number
  difficulty_range: [number, number]
  skills_acquired: string[]
  source_quality: number
  current_events_relevance: boolean
  ai_generated_metadata: {
    emoji: string
    learning_objectives: string[]
    action_items: string[]
    estimated_time_minutes: number
  }
}

interface AnalyticsData {
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
}

interface EnhancedCollectionDashboardProps {
  suggestions: CollectionSuggestion[]
  analytics: AnalyticsData
  onGenerateSuggestions: () => void
  onCreateCollection: (suggestionId: string, modifications?: any) => void
  onProvideFeedback: (suggestionId: string, rating: number, feedback: string) => void
  isLoading: boolean
}

export function EnhancedCollectionDashboard({
  suggestions,
  analytics,
  onGenerateSuggestions,
  onCreateCollection,
  onProvideFeedback,
  isLoading
}: EnhancedCollectionDashboardProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<CollectionSuggestion | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [feedbackMode, setFeedbackMode] = useState<string | null>(null)

  // Calculate derived metrics
  const dashboardMetrics = useMemo(() => {
    const totalSuggestions = suggestions.length
    const highQualitySuggestions = suggestions.filter(s => s.confidence_score > 0.8).length
    const avgEngagement = suggestions.reduce((sum, s) => sum + s.estimated_engagement, 0) / totalSuggestions || 0
    const uniqueThemes = new Set(suggestions.map(s => s.theme)).size

    return {
      totalSuggestions,
      highQualitySuggestions,
      avgEngagement: Math.round(avgEngagement * 100),
      uniqueThemes,
      qualityRate: Math.round((highQualitySuggestions / totalSuggestions) * 100) || 0
    }
  }, [suggestions])

  // Color palette for charts
  const themeColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions Generated</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalSuggestions}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardMetrics.highQualitySuggestions} high quality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.qualityRate}%</div>
            <Progress value={dashboardMetrics.qualityRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.avgEngagement}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all suggestions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Themes</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.uniqueThemes}</div>
            <p className="text-xs text-muted-foreground">
              Themes identified by AI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theme Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Distribution</CardTitle>
                <CardDescription>
                  Breakdown of identified civic education themes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.theme_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ theme, count }) => `${theme}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.theme_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={themeColors[index % themeColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>
                  AI-generated content quality indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Confidence</span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics.quality_metrics.avg_confidence * 100)}%
                    </span>
                  </div>
                  <Progress value={analytics.quality_metrics.avg_confidence * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Source Reliability</span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics.quality_metrics.source_reliability * 100)}%
                    </span>
                  </div>
                  <Progress value={analytics.quality_metrics.source_reliability * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Content Freshness</span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics.quality_metrics.content_freshness * 100)}%
                    </span>
                  </div>
                  <Progress value={analytics.quality_metrics.content_freshness * 100} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                AI suggestion generation and user engagement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.performance_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="suggestions_generated" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="collections_created" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">AI-Generated Collection Suggestions</h3>
              <p className="text-sm text-muted-foreground">
                Review and approve AI-suggested content collections
              </p>
            </div>
            <Button onClick={onGenerateSuggestions} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate New Suggestions
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>{suggestion.ai_generated_metadata.emoji}</span>
                        {suggestion.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {suggestion.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={suggestion.confidence_score > 0.8 ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {Math.round(suggestion.confidence_score * 100)}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Theme:</span>
                    <Badge variant="outline">{suggestion.theme}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Content Items:</span>
                    <span className="font-medium">{suggestion.content_items.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Engagement:</span>
                    <span className="font-medium">
                      {Math.round(suggestion.estimated_engagement * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <span className="font-medium">
                      {suggestion.difficulty_range[0]}-{suggestion.difficulty_range[1]}/5
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    ~{suggestion.ai_generated_metadata.estimated_time_minutes} min
                    {suggestion.current_events_relevance && (
                      <>
                        <Globe className="h-3 w-3 ml-2" />
                        Current events
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => onCreateCollection(suggestion.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Create Collection
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedSuggestion(suggestion)}
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setFeedbackMode(suggestion.id)}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theme Engagement Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Engagement Analysis</CardTitle>
                <CardDescription>
                  User engagement rates by civic education theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.theme_distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="theme" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="engagement_rate" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Feedback Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>User Feedback Summary</CardTitle>
                <CardDescription>
                  Analysis of user feedback on AI suggestions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.user_feedback.slice(0, 5).map((feedback, index) => (
                  <div key={feedback.suggestion_id} className="border-l-2 border-blue-500 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Rating: {feedback.rating}/5</span>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.processing_stats.total_content_analyzed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Items processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.processing_stats.avg_processing_time.toFixed(1)}s
                </div>
                <p className="text-xs text-muted-foreground">Per suggestion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(analytics.processing_stats.ai_model_performance * 100)}%
                </div>
                <Progress value={analytics.processing_stats.ai_model_performance * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cache Hit Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(analytics.processing_stats.cache_hit_rate * 100)}%
                </div>
                <Progress value={analytics.processing_stats.cache_hit_rate * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* System Health Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Real-time monitoring of AI collection organizer performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold">AI Model</div>
                  <div className="text-sm text-muted-foreground">Operational</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold">Data Pipeline</div>
                  <div className="text-sm text-muted-foreground">Healthy</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="font-semibold">External APIs</div>
                  <div className="text-sm text-muted-foreground">Some delays</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Suggestion Modal (simplified representation) */}
      {selectedSuggestion && (
        <Card className="fixed inset-4 z-50 overflow-auto bg-background border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>{selectedSuggestion.ai_generated_metadata.emoji}</span>
                {selectedSuggestion.title}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedSuggestion(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Learning Objectives</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {selectedSuggestion.ai_generated_metadata.learning_objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Action Items</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {selectedSuggestion.ai_generated_metadata.action_items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Skills Acquired</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSuggestion.skills_acquired.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => onCreateCollection(selectedSuggestion.id)}>
                Create Collection
              </Button>
              <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 