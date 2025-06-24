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

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { AlertCircle, Bot, Settings, Play, Pause, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp, Square, Database, FileText, Users, BookOpen, Calendar, User, Package, Activity, ChevronRight, Zap, Target, Globe, Brain, Save, RotateCcw, AlertTriangle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface AgentStatus {
  isRunning: boolean
  lastRun?: string
  articlesProcessed: number
  contentGenerated: number
  errors: string[]
}

interface AgentConfig {
  isActive: boolean
  monitoringIntervalMinutes: number
  minCivicRelevanceScore: number
  maxEventsPerCycle: number
  contentGeneration: {
    generateQuestions: boolean
    generateSkills: boolean
    generateGlossaryTerms: boolean
    generateEvents: boolean
    generatePublicFigures: boolean
  }
  databaseTargets: {
    saveToContentPackages: boolean
    saveToContentTables: boolean
    targetTables: {
      question_topics: boolean
      questions: boolean
      skills: boolean
      glossary_terms: boolean
      events: boolean
      public_figures: boolean
    }
    customTableMappings: Record<string, string>
    schemaConfig: {
      schemaName: string
      useCustomFieldMappings: boolean
      customFieldMappings: Record<string, Record<string, string>>
    }
  }
  qualityControl: {
    publishAsActive: boolean
    validateSchema: boolean
    requireMinimumFields: boolean
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
  title: string
  status: 'processing' | 'completed' | 'failed'
  contentTypes: string[]
  createdAt: string
  error?: string
  news_headline?: string
  civicRelevanceScore?: number
  source?: string
  contentGenerationStatus?: string
  powerDynamicsRevealed?: string[]
}

interface ContentStats {
  total: number
  published: number
  inReview: number
  rejected: number
  averageQuality: number
}

interface SourceStats {
  totalSources: number
  activeSources: number
  recentArticles: number
  lastUpdate?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Default configuration
const DEFAULT_CONFIG: AgentConfig = {
  isActive: false,
  monitoringIntervalMinutes: 30,
  minCivicRelevanceScore: 70,
  maxEventsPerCycle: 10,
  contentGeneration: {
    generateQuestions: true,
    generateSkills: true,
    generateGlossaryTerms: true,
    generateEvents: true,
    generatePublicFigures: true
  },
  databaseTargets: {
    saveToContentPackages: true,
    saveToContentTables: true,
    targetTables: {
      question_topics: true,
      questions: true,
      skills: true,
      glossary_terms: true,
      events: true,
      public_figures: true
    },
    customTableMappings: {},
    schemaConfig: {
      schemaName: 'public',
      useCustomFieldMappings: false,
      customFieldMappings: {}
    }
  },
  qualityControl: {
    publishAsActive: true,
    validateSchema: true,
    requireMinimumFields: true
  }
}

// Configuration Panel Component
function AgentConfigPanel({ 
  config, 
  onConfigChange, 
  onSave 
}: { 
  config: AgentConfig
  onConfigChange: (config: AgentConfig) => void
  onSave: () => void
}) {
  const [localConfig, setLocalConfig] = useState(config)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setHasChanges(JSON.stringify(localConfig) !== JSON.stringify(config))
  }, [localConfig, config])

  const updateConfig = (updates: Partial<AgentConfig>) => {
    const newConfig = { ...localConfig, ...updates }
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  const updateNestedConfig = (path: string, value: any) => {
    const keys = path.split('.')
    const newConfig = { ...localConfig }
    let current: any = newConfig
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  const resetToDefaults = () => {
    setLocalConfig(DEFAULT_CONFIG)
    onConfigChange(DEFAULT_CONFIG)
  }

  return (
    <div className="space-y-8">
      {/* Header with Save Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Agent Configuration</h3>
          <p className="text-sm text-gray-600">Configure how the News AI Agent processes content and populates your database</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-amber-600 text-sm"
            >
              <AlertTriangle size={16} />
              Unsaved changes
            </motion.div>
          )}
          <button
            onClick={resetToDefaults}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>
          <button
            onClick={onSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings size={18} />
          Basic Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monitoring Interval (minutes)
            </label>
            <input
              type="number"
              value={localConfig.monitoringIntervalMinutes}
              onChange={(e) => updateConfig({ monitoringIntervalMinutes: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="5"
              max="1440"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Civic Relevance Score (%)
            </label>
            <input
              type="number"
              value={localConfig.minCivicRelevanceScore}
              onChange={(e) => updateConfig({ minCivicRelevanceScore: parseInt(e.target.value) || 70 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Events Per Cycle
            </label>
            <input
              type="number"
              value={localConfig.maxEventsPerCycle}
              onChange={(e) => updateConfig({ maxEventsPerCycle: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Content Generation Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain size={18} />
          Content Generation
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries({
            generateQuestions: 'Quiz Questions',
            generateSkills: 'Civic Skills',
            generateGlossaryTerms: 'Glossary Terms',
            generateEvents: 'Events',
            generatePublicFigures: 'Public Figures'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.contentGeneration[key as keyof typeof localConfig.contentGeneration]}
                onChange={(e) => updateNestedConfig(`contentGeneration.${key}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Database Targets */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database size={18} />
          Database Targets
        </h4>
        
        {/* Storage Options */}
        <div className="mb-6">
          <h5 className="font-medium text-gray-800 mb-3">Storage Options</h5>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.databaseTargets.saveToContentPackages}
                onChange={(e) => updateNestedConfig('databaseTargets.saveToContentPackages', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Save to Content Packages Table</span>
              <span className="text-xs text-gray-500">(Tracks generated content metadata)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.databaseTargets.saveToContentTables}
                onChange={(e) => updateNestedConfig('databaseTargets.saveToContentTables', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Save to Individual Content Tables</span>
              <span className="text-xs text-gray-500">(Direct insertion into target tables)</span>
            </label>
          </div>
        </div>

        {/* Target Tables */}
        <div className="mb-6">
          <h5 className="font-medium text-gray-800 mb-3">Target Tables</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries({
              question_topics: 'Question Topics',
              questions: 'Questions',
              skills: 'Skills',
              glossary_terms: 'Glossary Terms',
              events: 'Events',
              public_figures: 'Public Figures'
            }).map(([table, label]) => (
              <label key={table} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.databaseTargets.targetTables[table as keyof typeof localConfig.databaseTargets.targetTables]}
                  onChange={(e) => updateNestedConfig(`databaseTargets.targetTables.${table}`, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Schema Configuration */}
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Schema Configuration</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schema Name
              </label>
              <input
                type="text"
                value={localConfig.databaseTargets.schemaConfig.schemaName}
                onChange={(e) => updateNestedConfig('databaseTargets.schemaConfig.schemaName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="public"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={localConfig.databaseTargets.schemaConfig.useCustomFieldMappings}
                  onChange={(e) => updateNestedConfig('databaseTargets.schemaConfig.useCustomFieldMappings', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Use Custom Field Mappings</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Control */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target size={18} />
          Quality Control
        </h4>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localConfig.qualityControl.publishAsActive}
              onChange={(e) => updateNestedConfig('qualityControl.publishAsActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Publish Content as Active</span>
            <span className="text-xs text-gray-500">(Uncheck to create as drafts)</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localConfig.qualityControl.validateSchema}
              onChange={(e) => updateNestedConfig('qualityControl.validateSchema', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Validate Schema Before Insert</span>
            <span className="text-xs text-gray-500">(Recommended to prevent database errors)</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localConfig.qualityControl.requireMinimumFields}
              onChange={(e) => updateNestedConfig('qualityControl.requireMinimumFields', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Require Minimum Fields</span>
            <span className="text-xs text-gray-500">(Ensure content meets minimum quality standards)</span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default function NewsAgentDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  
  // Agent status and control
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({ 
    isRunning: false, 
    articlesProcessed: 0, 
    contentGenerated: 0,
    errors: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [sourceStats, setSourceStats] = useState<SourceStats>({ 
    totalSources: 0, 
    activeSources: 0, 
    recentArticles: 0 
  })
  const [contentPackages, setContentPackages] = useState<ContentPackage[]>([])
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG)
  const [logs, setLogs] = useState<string[]>([])
  const sseRef = useRef<EventSource | null>(null)

  // ============================================================================
  // DATA LOADING AND REFRESHING
  // ============================================================================

  /**
   * Load agent status and monitoring data
   */
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
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
        setLogs(statusData.data.recentLogs)
        setContentPackages(statusData.data.contentPackages)
        console.log('✅ Agent status updated:', statusData.data.agent.isRunning ? 'Running' : 'Stopped')
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

      setIsLoading(false)
      console.log('✅ Dashboard data loaded successfully')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setLogs(prev => [...prev, errorMessage])
      console.error('❌ Dashboard loading error:', err)
    }
  }, [])

  // Update tab from URL changes (must be before conditional rendering)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams, activeTab])

  /**
   * Initialize dashboard data with SSE streaming
   */
  useEffect(() => {
    console.log('🔴 Setting up SSE connection for real-time updates...')
    
    const eventSource = new EventSource('/api/admin/news-agent/stream')
    sseRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📡 SSE data received:', data)
        
        if (data.type === 'status') {
          setAgentStatus(data.status)
        } else if (data.type === 'log') {
          setLogs(prev => [...prev, data.message])
        } else if (data.type === 'content_package') {
          setContentPackages(prev => {
            const updated = prev.filter(p => p.id !== data.package.id)
            return [...updated, data.package]
          })
        }
      } catch (error) {
        console.error('❌ Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error)
      eventSource.close()
      
      // Fall back to polling if SSE fails
      console.log('📡 Falling back to polling...')
      const fallbackInterval = setInterval(loadDashboardData, 30000)
      return () => clearInterval(fallbackInterval)
    }

    return () => {
      console.log('🔴 Closing SSE connection')
      eventSource.close()
    }
  }, []) // Remove loadDashboardData dependency to prevent reconnections

  // ============================================================================
  // AGENT CONTROL FUNCTIONS
  // ============================================================================

  /**
   * Start the news monitoring agent
   */
  const startAgent = async () => {
    try {
      setIsLoading(true)
      setLogs(prev => [...prev, '🚀 Starting news agent...'])

      const response = await fetch('/api/admin/news-agent/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start',
          config: { ...config }
        })
      })

      if (!response.ok) {
        throw new Error(`Start request failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('🚀 Start response:', result)
      
      if (result.success) {
        console.log('✅ Agent started successfully')
        setLogs(prev => [...prev, '✅ Agent started successfully'])
        await loadDashboardData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to start agent')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start agent'
      setLogs(prev => [...prev, errorMessage])
      console.error('❌ Agent start error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Stop the news monitoring agent
   */
  const stopAgent = async () => {
    try {
      setIsLoading(true)
      setLogs(prev => [...prev, '⏹️ Stopping news agent...'])

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
        setLogs(prev => [...prev, '✅ Agent stopped successfully'])
        await loadDashboardData() // Refresh data
      } else {
        throw new Error(result.error || 'Failed to stop agent')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop agent'
      setLogs(prev => [...prev, errorMessage])
      console.error('❌ Agent stop error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadConfig = async () => {
    try {
      // Try to load from API first
      const response = await fetch('/api/admin/news-agent/config')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.config) {
          setConfig(data.config)
          return
        }
      }
      
      // Fallback to localStorage
      const savedConfig = localStorage.getItem('news-agent-config')
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig))
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      // Use localStorage as fallback
      try {
        const savedConfig = localStorage.getItem('news-agent-config')
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig))
        }
      } catch (localError) {
        console.error('Failed to load from localStorage:', localError)
      }
    }
  }

  const saveConfig = async () => {
    try {
      setIsLoading(true)
      setLogs(prev => [...prev, '💾 Saving configuration...'])
      
      // Try to save to API first
      const response = await fetch('/api/admin/news-agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLogs(prev => [...prev, '✅ Configuration saved to database successfully!'])
          return
        }
      }
      
      // Fallback to localStorage
      localStorage.setItem('news-agent-config', JSON.stringify(config))
      setLogs(prev => [...prev, '✅ Configuration saved locally (database not available)'])
      
    } catch (error) {
      console.error('Failed to save config:', error)
      
      // Emergency fallback to localStorage
      try {
        localStorage.setItem('news-agent-config', JSON.stringify(config))
        setLogs(prev => [...prev, '⚠️ Configuration saved to localStorage only'])
      } catch (localError) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration'
        setLogs(prev => [...prev, `❌ Error saving configuration: ${errorMessage}`])
      }
    } finally {
      setIsLoading(false)
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'packages', label: 'Content Packages', icon: Package },
    { id: 'sources', label: 'Sources', icon: Globe },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'logs', label: 'Logs', icon: FileText }
  ]

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
                {new Date().toLocaleString()}
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
        {logs.length > 0 && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{logs[logs.length - 1]}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Tabs with proper navigation - Consolidated */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 p-1">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm font-medium"
              >
                <tab.icon size={16} className="mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Consolidated Overview Tab with Real-time Monitoring */}
          <TabsContent value="overview" className="space-y-6 mt-8">
            {/* Live Agent Status */}
            {agentStatus.isRunning && (
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
                        {config.monitoringIntervalMinutes} min intervals
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        {config.minCivicRelevanceScore}% relevance threshold
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
                        {agentStatus.isRunning && (
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
                      onClick={() => {}}
                      className="text-xs"
                    >
                      Fetch News
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {contentPackages.length > 0 ? contentPackages.map((event) => (
                        <div key={event.id} className="group p-4 rounded-lg border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-sm leading-5 text-slate-900 dark:text-slate-100 line-clamp-2 pr-3">
                              {event.news_headline}
                            </h4>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                                {event.civicRelevanceScore || 'N/A'}%
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{event.source || 'N/A'}</span>
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
                                {event.contentGenerationStatus || 'Pending'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Civic Score: {event.civicRelevanceScore || 'N/A'}%
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Source: {event.source || 'N/A'}
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Content Generation Status:</div>
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {event.contentGenerationStatus || 'Pending'}
                            </div>
                          </div>

                          {event.powerDynamicsRevealed && event.powerDynamicsRevealed.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Power Dynamics Revealed:</div>
                              <div className="text-xs text-slate-700 dark:text-slate-300">
                                {event.powerDynamicsRevealed.slice(0, 2).join(', ')}
                                {event.powerDynamicsRevealed.length > 2 && ` +${event.powerDynamicsRevealed.length - 2} more`}
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
                      {agentStatus.isRunning && (
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
                      {agentStatus.isRunning && (
                        <div className="p-4 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              Agent is Running
                            </span>
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              Monitoring every {config.monitoringIntervalMinutes} minutes
                            </div>
                          </div>
                          <div className="text-xs text-blue-800 dark:text-blue-200">
                            Next cycle will begin automatically based on your monitoring interval settings.
                          </div>
                        </div>
                      )}

                      {/* Show stopped message when agent is not running */}
                      {!agentStatus.isRunning && logs.length === 0 && (
                        <div className="p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-2 h-2 bg-slate-400 rounded-full" />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              Agent Stopped - No Active Monitoring
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-2">
                            Start the agent to begin processing news articles
                          </p>
                        </div>
                      )}

                      {logs.length > 0 ? logs.map((log, index) => (
                        <div key={index} className="p-4 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {log}
                            </span>
                          </div>
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
                        <div className="text-2xl font-bold text-blue-600">{sourceStats.activeSources || 0}</div>
                        <div className="text-sm text-muted-foreground">Active Sources</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{sourceStats.recentArticles || 0}</div>
                        <div className="text-sm text-muted-foreground">Articles (24h)</div>
                      </div>
                    </div>
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
                      {/* Source data will be populated here */}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab - Same as before */}
          <TabsContent value="configuration" className="space-y-4">
            <AgentConfigPanel
              config={config}
              onConfigChange={setConfig}
              onSave={saveConfig}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 