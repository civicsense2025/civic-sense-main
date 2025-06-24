/**
 * News AI Agent Admin Dashboard
 * 
 * Comprehensive admin interface for managing the autonomous news monitoring agent
 * that generates civic education content from breaking news events.
 * 
 * Features:
 * - Agent status monitoring and control
 * - Configuration management
 * - Content generation oversight
 * - Performance analytics
 * - Quality control settings
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Bot, Settings, Play, Pause, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface AgentStatus {
  isRunning: boolean
  config: AgentConfig
}

interface AgentConfig {
  isActive: boolean
  monitoringIntervalMinutes: number
  minCivicRelevanceScore: number
  maxEventsPerCycle: number
  contentGeneration: {
    generateQuestions: boolean
    generateSkills: boolean
    generateGlossary: boolean
    generateEvents: boolean
    generatePublicFigures: boolean
  }
  aiProvider: 'openai' | 'anthropic'
  aiModel: string
  qualityControl: {
    minQualityScore: number
    requireHumanReview: boolean
  }
}

interface NewsEvent {
  id: string
  headline: string
  content: string
  sourceUrl: string
  source: string
  publishedAt: string
  discoveredAt: string
  civicRelevanceScore: number
  powerDynamicsRevealed: string[]
  governmentActorsInvolved: string[]
  policyAreasAffected: string[]
  potentialCivicActions: string[]
  contentGenerationStatus: 'pending' | 'processing' | 'completed' | 'failed'
  contentPackageId?: string
}

interface MonitoringLog {
  timestamp: string
  eventsFound: number
  relevantEvents: number
  eventsProcessed: number
  status: 'completed' | 'failed'
  error?: string
}

interface ContentPackage {
  id: string
  news_event_id: string
  news_headline: string
  generated_content: any
  quality_scores: {
    overall: number
    brandVoiceCompliance: number
    factualAccuracy: number
    civicActionability: number
    uncomfortableTruthsRevealed: number
    powerDynamicsExplained: number
  }
  status: 'draft' | 'review' | 'published' | 'rejected'
  created_at: string
}

interface ContentStats {
  total: number
  published: number
  inReview: number
  rejected: number
  averageQuality: number
}

interface SourceStats {
  activeSources: number
  totalArticles: number
  credibilityDistribution: {
    high: number
    medium: number
    low: number
  }
  topSources: {
    domain: string
    articleCount: number
    avgCredibilityScore: number
    biasRating?: string
  }[]
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewsAgentDashboard() {
  // Agent status and control
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isControlling, setIsControlling] = useState(false)
  
  // Configuration management
  const [configChanges, setConfigChanges] = useState<Partial<AgentConfig>>({})
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  
  // Monitoring data
  const [recentLogs, setRecentLogs] = useState<MonitoringLog[]>([])
  const [recentEvents, setRecentEvents] = useState<NewsEvent[]>([])
  const [contentPackages, setContentPackages] = useState<ContentPackage[]>([])
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  const [sourceStats, setSourceStats] = useState<SourceStats | null>(null)
  
  // UI state
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // ============================================================================
  // DATA LOADING AND REFRESHING
  // ============================================================================

  /**
   * Load agent status and monitoring data
   */
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null)
      
      // Load agent status and recent activity
      const statusResponse = await fetch('/api/admin/news-agent/monitor')
      if (!statusResponse.ok) throw new Error('Failed to load agent status')
      const statusData = await statusResponse.json()
      
      if (statusData.success) {
        setAgentStatus(statusData.data.agent)
        setRecentLogs(statusData.data.recentLogs)
        setRecentEvents(statusData.data.recentEvents)
      }

      // Load content package data
      const packagesResponse = await fetch('/api/admin/news-agent/generate-package')
      if (!packagesResponse.ok) throw new Error('Failed to load content packages')
      const packagesData = await packagesResponse.json()
      
      if (packagesData.success) {
        setContentPackages(packagesData.data.packages)
        setContentStats(packagesData.data.statistics)
      }

      // Load source stats
      const sourceResponse = await fetch('/api/admin/news-agent/source-stats')
      if (!sourceResponse.ok) throw new Error('Failed to load source stats')
      const sourceData = await sourceResponse.json()
      
      if (sourceData.success) {
        setSourceStats(sourceData.data.statistics)
      }

      setLastRefresh(new Date())
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      console.error('Dashboard loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Initialize dashboard data on mount
   */
  useEffect(() => {
    loadDashboardData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [loadDashboardData])

  // ============================================================================
  // AGENT CONTROL FUNCTIONS
  // ============================================================================

  /**
   * Start the news monitoring agent
   */
  const startAgent = async () => {
    try {
      setIsControlling(true)
      setError(null)

      const response = await fetch('/api/admin/news-agent/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start',
          config: { ...agentStatus?.config, ...configChanges }
        })
      })

      if (!response.ok) throw new Error('Failed to start agent')
      
      const result = await response.json()
      if (result.success) {
        await loadDashboardData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to start agent')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start agent')
    } finally {
      setIsControlling(false)
    }
  }

  /**
   * Stop the news monitoring agent
   */
  const stopAgent = async () => {
    try {
      setIsControlling(true)
      setError(null)

      const response = await fetch('/api/admin/news-agent/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      })

      if (!response.ok) throw new Error('Failed to stop agent')
      
      const result = await response.json()
      if (result.success) {
        await loadDashboardData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to stop agent')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop agent')
    } finally {
      setIsControlling(false)
    }
  }

  /**
   * Save configuration changes
   */
  const saveConfiguration = async () => {
    try {
      setIsSavingConfig(true)
      setError(null)

      const newConfig = { ...agentStatus?.config, ...configChanges }

      const response = await fetch('/api/admin/news-agent/monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })

      if (!response.ok) throw new Error('Failed to save configuration')
      
      const result = await response.json()
      if (result.success) {
        setConfigChanges({}) // Clear pending changes
        await loadDashboardData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to save configuration')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setIsSavingConfig(false)
    }
  }

  // ============================================================================
  // CONFIGURATION HELPERS
  // ============================================================================

  /**
   * Update configuration value
   */
  const updateConfig = (path: string, value: any) => {
    setConfigChanges(prev => {
      const newChanges = { ...prev }
      
      // Handle nested paths like 'contentGeneration.generateQuestions'
      const keys = path.split('.')
      let current: any = newChanges
      
      // Navigate to parent object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value
      
      return newChanges
    })
  }

  /**
   * Get current config value (including unsaved changes)
   */
  const getCurrentConfigValue = (path: string): any => {
    const keys = path.split('.')
    
    // Check pending changes first
    let changeValue: any = configChanges
    for (const key of keys) {
      if (changeValue && typeof changeValue === 'object' && key in changeValue) {
        changeValue = changeValue[key]
      } else {
        changeValue = undefined
        break
      }
    }
    
    if (changeValue !== undefined) return changeValue
    
    // Fall back to current config
    let currentValue: any = agentStatus?.config
    for (const key of keys) {
      if (currentValue && typeof currentValue === 'object' && key in currentValue) {
        currentValue = currentValue[key]
      } else {
        return undefined
      }
    }
    
    return currentValue
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusBadge = (status: string, isRunning?: boolean) => {
    if (isRunning !== undefined) {
      return isRunning ? (
        <Badge variant="default" className="bg-green-500">
          <Bot className="w-3 h-3 mr-1" />
          Running
        </Badge>
      ) : (
        <Badge variant="secondary">
          <Bot className="w-3 h-3 mr-1" />
          Stopped
        </Badge>
      )
    }

    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>
      case 'published':
        return <Badge variant="default" className="bg-blue-500">Published</Badge>
      case 'review':
        return <Badge variant="secondary">In Review</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2 text-lg">Loading News AI Agent Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">News AI Agent</h1>
          <p className="text-muted-foreground">
            Autonomous civic education content generation from breaking news
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {formatTimestamp(lastRefresh.toISOString())}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge('', agentStatus?.isRunning)}
              <div className="flex gap-2">
                {agentStatus?.isRunning ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopAgent}
                    disabled={isControlling}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={startAgent}
                    disabled={isControlling}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">News Sources Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sourceStats?.activeSources || 0}</div>
            <p className="text-xs text-muted-foreground">
              {sourceStats?.totalArticles || 0} articles in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {contentStats?.published || 0} published, {contentStats?.inReview || 0} in review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.averageQuality || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Content quality score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">News Sources</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="processing">Processing Log</TabsTrigger>
          <TabsTrigger value="content">Content Stats</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent News Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent News Events</CardTitle>
                <CardDescription>
                  Latest news events discovered and analyzed for civic relevance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {recentEvents.map((event) => (
                      <div key={event.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {event.headline}
                          </h4>
                          <Badge variant="outline" className="ml-2 shrink-0">
                            {event.civicRelevanceScore}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{event.source}</span>
                          {getStatusBadge(event.contentGenerationStatus)}
                        </div>
                        {event.powerDynamicsRevealed.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium">Power Dynamics: </span>
                            <span className="text-xs text-muted-foreground">
                              {event.powerDynamicsRevealed.slice(0, 2).join(', ')}
                              {event.powerDynamicsRevealed.length > 2 && '...'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Processing Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Activity</CardTitle>
                <CardDescription>
                  Recent monitoring cycles and content generation activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {recentLogs.map((log, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          {getStatusBadge(log.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>Found: {log.eventsFound}</div>
                          <div>Relevant: {log.relevantEvents}</div>
                          <div>Processed: {log.eventsProcessed}</div>
                        </div>
                        {log.error && (
                          <div className="mt-2 text-xs text-red-600">
                            Error: {log.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* News Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>News Ticker Integration</CardTitle>
                <CardDescription>
                  Real-time monitoring of news sources feeding the AI agent via source_metadata table
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{sourceStats?.activeSources || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Sources</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{sourceStats?.totalArticles || 0}</div>
                      <div className="text-sm text-muted-foreground">Articles (24h)</div>
                    </div>
                  </div>
                  
                  {sourceStats?.credibilityDistribution && (
                    <div>
                      <h4 className="font-medium mb-2">Source Credibility Distribution</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-bold text-green-700">{sourceStats.credibilityDistribution.high}</div>
                          <div className="text-green-600">High (80+)</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <div className="font-bold text-yellow-700">{sourceStats.credibilityDistribution.medium}</div>
                          <div className="text-yellow-600">Medium (60-79)</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="font-bold text-red-700">{sourceStats.credibilityDistribution.low}</div>
                          <div className="text-red-600">Low (&lt;60)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top News Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Top News Sources</CardTitle>
                <CardDescription>
                  Most active sources in the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {sourceStats?.topSources?.map((source, index) => (
                      <div key={source.domain} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{source.domain}</div>
                          <div className="text-xs text-muted-foreground">
                            {source.articleCount} articles • Credibility: {source.avgCredibilityScore}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {source.biasRating || 'unknown'}
                          </Badge>
                          <div className="text-lg font-bold text-blue-600">#{index + 1}</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        No source data available. The news ticker will populate this when articles are fetched.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>News Ticker → AI Agent Integration</CardTitle>
              <CardDescription>
                How the news ticker feeds articles to the AI agent for content generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-semibold text-blue-600 mb-2">📰 News Ticker</div>
                    <div className="text-sm text-muted-foreground">
                      Fetches articles from RSS feeds and saves to source_metadata table
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-semibold text-purple-600 mb-2">🔍 AI Agent</div>
                    <div className="text-sm text-muted-foreground">
                      Monitors source_metadata for civic-relevant articles
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-semibold text-green-600 mb-2">📚 Content</div>
                    <div className="text-sm text-muted-foreground">
                      Generates quiz questions, skills, and educational content
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">Integration Benefits:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time news monitoring without API rate limits</li>
                    <li>• Credibility scoring and bias analysis for source filtering</li>
                    <li>• Automatic civic relevance detection</li>
                    <li>• Seamless content generation from breaking news</li>
                    <li>• Shared source metadata for consistent quality</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                Configure monitoring settings, content generation options, and quality controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monitoring Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Monitoring Settings</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="monitoring-interval">Monitoring Interval (minutes)</Label>
                    <Input
                      id="monitoring-interval"
                      type="number"
                      min="5"
                      max="120"
                      value={getCurrentConfigValue('monitoringIntervalMinutes') || 15}
                      onChange={(e) => updateConfig('monitoringIntervalMinutes', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relevance-threshold">Min Civic Relevance Score</Label>
                    <Input
                      id="relevance-threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={getCurrentConfigValue('minCivicRelevanceScore') || 70}
                      onChange={(e) => updateConfig('minCivicRelevanceScore', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-events">Max Events Per Cycle</Label>
                    <Input
                      id="max-events"
                      type="number"
                      min="1"
                      max="20"
                      value={getCurrentConfigValue('maxEventsPerCycle') || 5}
                      onChange={(e) => updateConfig('maxEventsPerCycle', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* AI Provider Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">AI Provider</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ai-provider">Provider</Label>
                    <Select 
                      value={getCurrentConfigValue('aiProvider') || 'openai'}
                      onValueChange={(value) => updateConfig('aiProvider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-model">Model</Label>
                    <Input
                      id="ai-model"
                      value={getCurrentConfigValue('aiModel') || 'gpt-4'}
                      onChange={(e) => updateConfig('aiModel', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Content Generation Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Content Generation</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'generateQuestions', label: 'Questions' },
                    { key: 'generateSkills', label: 'Skills' },
                    { key: 'generateGlossary', label: 'Glossary Terms' },
                    { key: 'generateEvents', label: 'Events' },
                    { key: 'generatePublicFigures', label: 'Public Figures' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={getCurrentConfigValue(`contentGeneration.${key}`) ?? true}
                        onCheckedChange={(checked) => updateConfig(`contentGeneration.${key}`, checked)}
                      />
                      <Label htmlFor={key}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Control */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quality Control</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-quality">Min Quality Score for Auto-Publish</Label>
                    <Input
                      id="min-quality"
                      type="number"
                      min="0"
                      max="100"
                      value={getCurrentConfigValue('qualityControl.minQualityScore') || 75}
                      onChange={(e) => updateConfig('qualityControl.minQualityScore', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require-review"
                      checked={getCurrentConfigValue('qualityControl.requireHumanReview') ?? true}
                      onCheckedChange={(checked) => updateConfig('qualityControl.requireHumanReview', checked)}
                    />
                    <Label htmlFor="require-review">Require Human Review</Label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveConfiguration}
                  disabled={isSavingConfig || Object.keys(configChanges).length === 0}
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Log Tab */}
        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Processing Log</CardTitle>
              <CardDescription>
                Complete history of monitoring cycles and content generation attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {recentLogs.map((log, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          {getStatusBadge(log.status)}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Events Found:</span>
                            <div className="text-lg font-bold">{log.eventsFound}</div>
                          </div>
                          <div>
                            <span className="font-medium">Relevant:</span>
                            <div className="text-lg font-bold text-blue-600">{log.relevantEvents}</div>
                          </div>
                          <div>
                            <span className="font-medium">Processed:</span>
                            <div className="text-lg font-bold text-green-600">{log.eventsProcessed}</div>
                          </div>
                          <div>
                            <span className="font-medium">Success Rate:</span>
                            <div className="text-lg font-bold">
                              {log.eventsFound > 0 ? Math.round((log.eventsProcessed / log.eventsFound) * 100) : 0}%
                            </div>
                          </div>
                        </div>

                        {log.error && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Error:</strong> {log.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Stats Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Content Statistics</CardTitle>
                <CardDescription>
                  Overview of generated content packages and quality metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{contentStats?.total || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Packages</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{contentStats?.published || 0}</div>
                      <div className="text-sm text-muted-foreground">Published</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{contentStats?.inReview || 0}</div>
                      <div className="text-sm text-muted-foreground">In Review</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{contentStats?.rejected || 0}</div>
                      <div className="text-sm text-muted-foreground">Rejected</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg bg-slate-50">
                    <div className="text-3xl font-bold">{contentStats?.averageQuality || 0}%</div>
                    <div className="text-sm text-muted-foreground">Average Quality Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Content Packages */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Content Packages</CardTitle>
                <CardDescription>
                  Latest generated content with quality scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {contentPackages.map((pkg) => (
                      <Card key={pkg.id}>
                        <CardContent className="pt-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {pkg.news_headline}
                            </h4>
                            {getStatusBadge(pkg.status)}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>{formatTimestamp(pkg.created_at)}</span>
                            <Badge variant="outline">
                              Quality: {pkg.quality_scores.overall}%
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Brand Voice: {pkg.quality_scores.brandVoiceCompliance}%</div>
                            <div>Accuracy: {pkg.quality_scores.factualAccuracy}%</div>
                            <div>Actionability: {pkg.quality_scores.civicActionability}%</div>
                            <div>Power Analysis: {pkg.quality_scores.powerDynamicsExplained}%</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 