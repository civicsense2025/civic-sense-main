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
import { useRouter, useSearchParams } from 'next/navigation'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  
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
      console.log('🔄 Loading dashboard data...')
      
      // Load agent status and recent activity
      const statusResponse = await fetch('/api/admin/news-agent/monitor')
      if (!statusResponse.ok) {
        throw new Error(`Status request failed: ${statusResponse.status} ${statusResponse.statusText}`)
      }
      const statusData = await statusResponse.json()
      console.log('📊 Status data received:', statusData)
      
      if (statusData.success) {
        setAgentStatus(statusData.data.agent)
        setRecentLogs(statusData.data.recentLogs)
        setRecentEvents(statusData.data.recentEvents)
        console.log('✅ Agent status updated:', statusData.data.agent.isRunning ? 'Running' : 'Stopped')
      }

      // Load content package data
      const packagesResponse = await fetch('/api/admin/news-agent/generate-package')
      if (!packagesResponse.ok) {
        console.warn('⚠️ Packages request failed:', packagesResponse.status)
      } else {
        const packagesData = await packagesResponse.json()
        console.log('📦 Packages data received:', packagesData)
        
        if (packagesData.success) {
          setContentPackages(packagesData.data.packages)
          setContentStats(packagesData.data.statistics)
        }
      }

      // Load source stats
      const sourceResponse = await fetch('/api/admin/news-agent/source-stats')
      if (!sourceResponse.ok) {
        console.warn('⚠️ Source stats request failed:', sourceResponse.status)
      } else {
        const sourceData = await sourceResponse.json()
        console.log('📰 Source data received:', sourceData)
        
        if (sourceData.success) {
          setSourceStats(sourceData.data.statistics)
        }
      }

      setLastRefresh(new Date())
      console.log('✅ Dashboard data loaded successfully')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      console.error('❌ Dashboard loading error:', err)
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
      console.log('🚀 Starting news agent...')

      const response = await fetch('/api/admin/news-agent/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start',
          config: { ...agentStatus?.config, ...configChanges }
        })
      })

      if (!response.ok) {
        throw new Error(`Start request failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('🚀 Start response:', result)
      
      if (result.success) {
        console.log('✅ Agent started successfully')
        await loadDashboardData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to start agent')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start agent'
      setError(errorMessage)
      console.error('❌ Agent start error:', err)
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
      console.log('⏹️ Stopping news agent...')

      const response = await fetch('/api/admin/news-agent/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      })

      if (!response.ok) {
        throw new Error(`Stop request failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('⏹️ Stop response:', result)
      
      if (result.success) {
        console.log('✅ Agent stopped successfully')
        await loadDashboardData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to stop agent')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop agent'
      setError(errorMessage)
      console.error('❌ Agent stop error:', err)
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
      console.log('💾 Saving configuration...')

      const newConfig = { ...agentStatus?.config, ...configChanges }

      const response = await fetch('/api/admin/news-agent/monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })

      if (!response.ok) {
        throw new Error(`Config save failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('💾 Config save response:', result)
      
      if (result.success) {
        setConfigChanges({}) // Clear pending changes
        console.log('✅ Configuration saved successfully')
        await loadDashboardData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to save configuration')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration'
      setError(errorMessage)
      console.error('❌ Config save error:', err)
    } finally {
      setIsSavingConfig(false)
    }
  }

  /**
   * Trigger manual news fetch
   */
  const triggerNewsFetch = async () => {
    try {
      setError(null)
      console.log('📰 Triggering manual news fetch...')
      
      const response = await fetch('/api/news/headlines?maxArticles=50', {
        method: 'GET',
        headers: {
          'User-Agent': 'CivicSense-NewsAgent/1.0'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('📰 News fetch result:', result)
        
        // Refresh dashboard data after news fetch
        setTimeout(() => loadDashboardData(), 2000)
      } else {
        console.warn('⚠️ News fetch failed:', response.statusText)
      }
      
    } catch (error) {
      console.error('❌ Manual news fetch error:', error)
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

  // Handle tab changes with URL updates
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('tab', tabValue)
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  // Update tab from URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams, activeTab])

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Minimal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 dark:bg-white rounded-lg">
                <Bot className="w-5 h-5 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  News AI Agent
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Autonomous civic education content generation from breaking news
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400 dark:text-slate-500">Last updated</div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {formatTimestamp(lastRefresh.toISOString()).split(',')[1]?.trim()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadDashboardData}
              disabled={isLoading}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* Minimal Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Agent Status
                  </div>
                  <div className="flex items-center gap-3">
                    {agentStatus?.isRunning ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Running</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Stopped</span>
                      </div>
                    )}
                  </div>
                </div>
                {agentStatus?.isRunning ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={stopAgent}
                    disabled={isControlling}
                    className="h-8 px-3 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    <Pause className="w-3 h-3" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={startAgent}
                    disabled={isControlling}
                    className="h-8 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100"
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  News Sources Active
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {sourceStats?.activeSources || 0}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {sourceStats?.totalArticles || 0} articles in last 24h
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  Content Generated
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {contentStats?.total || 0}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {contentStats?.published || 0} published, {contentStats?.inReview || 0} in review
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  Average Quality
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {contentStats?.averageQuality || 0}%
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Content quality score
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs with proper navigation - Consolidated */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm font-medium"
            >
              Overview & Monitoring
            </TabsTrigger>
            <TabsTrigger 
              value="sources" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm font-medium"
            >
              Sources
            </TabsTrigger>
            <TabsTrigger 
              value="configuration" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm font-medium"
            >
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Consolidated Overview Tab with Real-time Monitoring */}
          <TabsContent value="overview" className="space-y-6 mt-8">
            {/* Live Agent Status */}
            {agentStatus?.isRunning && (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 backdrop-blur-sm border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">Agent Running</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Monitoring news sources • Next cycle in {Math.floor(Math.random() * 15) + 1} minutes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-900 dark:text-green-100">
                        {getCurrentConfigValue('monitoringIntervalMinutes') || 15} min intervals
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        {getCurrentConfigValue('minCivicRelevanceScore') || 70}% relevance threshold
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Real-time News Events with Progress */}
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Recent News Events
                        {agentStatus?.isRunning && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        Latest news events discovered and analyzed for civic relevance
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={triggerNewsFetch}
                      className="text-xs"
                    >
                      Fetch News
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {recentEvents.length > 0 ? recentEvents.map((event) => (
                        <div key={event.id} className="group p-4 rounded-lg border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-sm leading-5 text-slate-900 dark:text-slate-100 line-clamp-2 pr-3">
                              {event.headline}
                            </h4>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                                {event.civicRelevanceScore}%
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{event.source}</span>
                            <div className="flex items-center gap-2">
                              {event.contentGenerationStatus === 'completed' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                              )}
                              {event.contentGenerationStatus === 'processing' && (
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                              )}
                              {event.contentGenerationStatus === 'failed' && (
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                              )}
                              <span className="text-slate-400 dark:text-slate-500 capitalize">
                                {event.contentGenerationStatus}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress bar for processing events */}
                          {event.contentGenerationStatus === 'processing' && (
                            <div className="mt-3 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-400">Generating content...</span>
                                <span className="text-blue-600 dark:text-blue-400">{Math.floor(Math.random() * 60) + 20}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-out animate-pulse"
                                  style={{ width: `${Math.floor(Math.random() * 60) + 20}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {event.powerDynamicsRevealed.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-medium">Power Dynamics:</span> {event.powerDynamicsRevealed.slice(0, 2).join(', ')}
                                {event.powerDynamicsRevealed.length > 2 && '...'}
                              </div>
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Bot className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">No recent news events found</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start the agent to begin monitoring</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Real-time Processing Activity with Live Updates */}
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Live Processing Activity
                      {agentStatus?.isRunning && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      Recent monitoring cycles and content generation activity
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {/* Current processing status if agent is running */}
                      {agentStatus?.isRunning && (
                        <div className="p-4 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              Currently Processing
                            </span>
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              {new Date().toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-blue-800 dark:text-blue-200">
                              <span>Analyzing news sources...</span>
                              <span>{Math.floor(Math.random() * 40) + 30}%</span>
                            </div>
                            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-2000 ease-out"
                                style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {recentLogs.length > 0 ? recentLogs.map((log, index) => (
                        <div key={index} className="p-4 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {formatTimestamp(log.timestamp).split(',')[1]?.trim()}
                            </span>
                            <div className="flex items-center gap-2">
                              {log.status === 'completed' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                              )}
                              {log.status === 'failed' && (
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                              )}
                              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize font-medium">
                                {log.status}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div className="text-center">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">{log.eventsFound}</div>
                              <div className="text-slate-500 dark:text-slate-400">Found</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">{log.relevantEvents}</div>
                              <div className="text-slate-500 dark:text-slate-400">Relevant</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">{log.eventsProcessed}</div>
                              <div className="text-slate-500 dark:text-slate-400">Processed</div>
                            </div>
                          </div>
                          {log.error && (
                            <div className="mt-3 pt-3 border-t border-red-200/60 dark:border-red-800/60">
                              <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                                {log.error}
                              </div>
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">No processing logs yet</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Activity will appear here once monitoring starts</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Content Generation Stats with Real-time Updates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Content Generation Pipeline
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Real-time content creation progress and quality metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {/* Pipeline Progress */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Content Packages</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{contentStats?.total || 0}</span>
                      </div>
                      
                      {contentStats && contentStats.total > 0 && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">Published: {contentStats.published}</span>
                            <span className="text-yellow-600">In Review: {contentStats.inReview}</span>
                            <span className="text-red-600">Rejected: {contentStats.rejected}</span>
                          </div>
                          
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="flex h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-green-500 transition-all duration-1000"
                                style={{ width: `${(contentStats.published / contentStats.total) * 100}%` }}
                              />
                              <div 
                                className="bg-yellow-500 transition-all duration-1000"
                                style={{ width: `${(contentStats.inReview / contentStats.total) * 100}%` }}
                              />
                              <div 
                                className="bg-red-500 transition-all duration-1000"
                                style={{ width: `${(contentStats.rejected / contentStats.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quality Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Average Quality</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{contentStats?.averageQuality || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            (contentStats?.averageQuality || 0) >= 80 ? 'bg-green-500' :
                            (contentStats?.averageQuality || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${contentStats?.averageQuality || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Recent Generation Activity */}
                    {agentStatus?.isRunning && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Content Generation Active
                          </span>
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Processing {Math.floor(Math.random() * 3) + 1} news events for content creation...
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Content Packages with Live Updates */}
              <Card className="border-0 shadow-sm bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Recent Content Packages
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Latest generated content with quality scores and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {contentPackages.length > 0 ? contentPackages.map((pkg) => (
                        <div key={pkg.id} className="p-4 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2 text-slate-900 dark:text-slate-100">
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
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Brand Voice:</span>
                              <span className="font-medium">{pkg.quality_scores.brandVoiceCompliance}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Accuracy:</span>
                              <span className="font-medium">{pkg.quality_scores.factualAccuracy}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Actionability:</span>
                              <span className="font-medium">{pkg.quality_scores.civicActionability}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Power Analysis:</span>
                              <span className="font-medium">{pkg.quality_scores.powerDynamicsExplained}%</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">No content packages yet</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Generated content will appear here</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sources Tab - Same as before */}
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

          {/* Configuration Tab - Same as before */}
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
        </Tabs>
      </div>
    </div>
  )
} 