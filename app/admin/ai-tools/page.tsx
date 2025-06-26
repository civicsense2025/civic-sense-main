"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Square,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Zap,
  Target,
  Award,
  Activity,
  DollarSign,
  BarChart3,
  FileText,
  MessageSquare,
  Cpu,
  Database,
  Globe,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Key,
  Users,
  Image,
  BookOpen,
  FileSearch,
  Command,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface AITool {
  id: string
  name: string
  type: 'content_generator' | 'bias_analyzer' | 'fact_checker' | 'summarizer' | 'translator' | 'moderator' | 'congressional_sync' | 'photo_processor' | 'key_takeaways' | 'news_agent'
  provider: 'openai' | 'anthropic' | 'google' | 'custom'
  model: string
  status: 'active' | 'paused' | 'error' | 'maintenance'
  description: string
  created_at: string
  updated_at: string
  config: {
    max_tokens?: number
    temperature?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    rate_limit_per_minute?: number
    cost_per_request?: number
  }
  stats: {
    total_requests: number
    successful_requests: number
    failed_requests: number
    avg_response_time: number
    total_cost: number
    last_used: string | null
  }
}

interface AIJob {
  id: string
  tool_id: string
  tool_name: string
  type: 'generate_content' | 'analyze_bias' | 'fact_check' | 'moderate_content' | 'sync_congress' | 'process_photos' | 'extract_takeaways'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input_data: any
  output_data?: any
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
  processing_time?: number
  cost?: number
  priority: 'low' | 'normal' | 'high' | 'critical'
}

interface AIStats {
  total_tools: number
  active_tools: number
  total_requests_today: number
  success_rate: number
  avg_response_time: number
  total_cost_today: number
  total_cost_month: number
  by_provider: Record<string, number>
  by_type: Record<string, number>
  queue_status: {
    pending: number
    running: number
    completed_today: number
    failed_today: number
  }
}

interface AIFilters {
  search: string
  type: 'all' | 'content_generator' | 'bias_analyzer' | 'fact_checker' | 'summarizer' | 'translator' | 'moderator' | 'congressional_sync' | 'photo_processor' | 'key_takeaways' | 'news_agent'
  provider: 'all' | 'openai' | 'anthropic' | 'google' | 'custom'
  status: 'all' | 'active' | 'paused' | 'error' | 'maintenance'
}

const toolTypes = [
  { value: 'all', label: 'All Tools', icon: Brain },
  { value: 'content_generator', label: 'Content Generator', icon: FileText },
  { value: 'bias_analyzer', label: 'Bias Analyzer', icon: BarChart3 },
  { value: 'fact_checker', label: 'Fact Checker', icon: MessageSquare },
  { value: 'summarizer', label: 'Summarizer', icon: Sparkles },
  { value: 'key_takeaways', label: 'Key Takeaways', icon: Key },
  { value: 'congressional_sync', label: 'Congressional Sync', icon: Database },
  { value: 'photo_processor', label: 'Photo Processor', icon: Image },
  { value: 'news_agent', label: 'News Agent', icon: Globe },
  { value: 'moderator', label: 'AI Assistant', icon: Command }
]

const providers = [
  { value: 'all', label: 'All Providers' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'custom', label: 'Custom' }
]

// Quick actions for each tool type
const quickActions: Record<string, { 
  primary?: { label: string; href?: string; action?: string; icon: any };
  secondary?: { label: string; href: string; icon: any };
}> = {
  'key_takeaways': {
    primary: { label: 'Generate Takeaways', href: '/admin/question-topics', icon: Key },
    secondary: { label: 'View Content', href: '/admin/question-topics', icon: Eye }
  },
  'content_generator': {
    primary: { label: 'Generate Content', href: '/admin/ai-content', icon: FileText },
    secondary: { label: 'View Generated', href: '/admin/question-topics', icon: Eye }
  },
  'congressional_sync': {
    primary: { label: 'Sync Congress', href: '/admin/congressional', icon: Database },
    secondary: { label: 'View Data', href: '/admin/congressional', icon: Eye }
  },
  'photo_processor': {
    primary: { label: 'Process Photos', action: 'process_photos', icon: Image },
    secondary: { label: 'View Gallery', href: '/admin/congressional', icon: Eye }
  },
  'news_agent': {
    primary: { label: 'Monitor News', href: '/admin/news-agent', icon: Globe },
    secondary: { label: 'View Events', href: '/admin/events', icon: Eye }
  },
  'moderator': {
    primary: { label: 'AI Command Center', href: '/admin/ai-command-center', icon: Command },
    secondary: { label: 'View Activity', href: '/admin/ai-command-center', icon: Activity }
  },
  'bias_analyzer': {
    primary: { label: 'Analyze Content', action: 'analyze_bias', icon: BarChart3 },
    secondary: { label: 'View Reports', href: '/admin/analytics/content', icon: Eye }
  },
  'fact_checker': {
    primary: { label: 'Check Facts', action: 'fact_check', icon: MessageSquare },
    secondary: { label: 'View Reports', href: '/admin/analytics/content', icon: Eye }
  },
  'summarizer': {
    primary: { label: 'Generate Summary', action: 'summarize', icon: Sparkles },
    secondary: { label: 'View Summaries', href: '/admin/question-topics', icon: Eye }
  },
  'translator': {
    primary: { label: 'Translate Content', action: 'translate', icon: Globe },
    secondary: { label: 'View Translations', href: '/admin/question-topics', icon: Eye }
  }
}

export default function AIToolsManagement() {
  const [tools, setTools] = useState<AITool[]>([])
  const [jobs, setJobs] = useState<AIJob[]>([])
  const [stats, setStats] = useState<AIStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState<AIFilters>({
    search: '',
    type: 'all',
    provider: 'all',
    status: 'all'
  })
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set())
  
  const { toast } = useToast()

  useEffect(() => {
    loadAIData()
    // Set up polling for real-time updates
    const interval = setInterval(loadAIData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadAIData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/ai-tools')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load AI tools data')
      }
      
      const { stats, tools, jobs } = result.data
      
      setStats(stats)
      setTools(tools || [])
      setJobs(jobs || [])
      
      console.log('✅ Loaded AI tools data:', {
        toolsCount: tools?.length || 0,
        jobsCount: jobs?.length || 0,
        statsLoaded: !!stats
      })
      
    } catch (error) {
      console.error('Error loading AI data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load AI tools data')
      
      toast({
        title: 'Error Loading AI Tools',
        description: error instanceof Error ? error.message : 'Failed to load AI tools data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (action: string, toolId?: string, data?: any) => {
    const actionKey = `${action}-${toolId || 'global'}`
    setProcessingActions(prev => new Set([...prev, actionKey]))
    
    try {
      const response = await fetch('/api/admin/ai-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, toolId, data })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Action completed successfully'
        })
        
        // Refresh data after successful action
        setTimeout(loadAIData, 1000)
      } else {
        throw new Error(result.error || 'Action failed')
      }
    } catch (error) {
      console.error('Action failed:', error)
      toast({
        title: 'Action Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      })
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(actionKey)
        return newSet
      })
    }
  }

  const filteredTools = tools.filter(tool => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        tool.name.toLowerCase().includes(searchLower) ||
        tool.description.toLowerCase().includes(searchLower) ||
        tool.model.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Type filter
    if (filters.type !== 'all' && tool.type !== filters.type) return false

    // Provider filter
    if (filters.provider !== 'all' && tool.provider !== filters.provider) return false

    // Status filter
    if (filters.status !== 'all' && tool.status !== filters.status) return false

    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100 border-green-200'
      case 'paused': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'error': return 'text-red-700 bg-red-100 border-red-200'
      case 'maintenance': return 'text-blue-700 bg-blue-100 border-blue-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100 border-green-200'
      case 'running': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'pending': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'failed': return 'text-red-700 bg-red-100 border-red-200'
      case 'cancelled': return 'text-gray-700 bg-gray-100 border-gray-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200'
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'normal': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'low': return 'text-gray-700 bg-gray-100 border-gray-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getToolIcon = (type: string) => {
    const toolType = toolTypes.find(t => t.value === type)
    return toolType ? toolType.icon : Brain
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai': return <Brain className="h-4 w-4" />
      case 'anthropic': return <Cpu className="h-4 w-4" />
      case 'google': return <Globe className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">AI Tools Management</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to Load AI Data</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={loadAIData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">No AI Data Available</h2>
          <p className="text-gray-600">Unable to load AI tools statistics</p>
          <Button onClick={loadAIData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Tools Management</h1>
          <p className="text-gray-600">Monitor and manage CivicSense AI services and processing performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/ai-command-center">
              <Command className="h-4 w-4 mr-2" />
              AI Command Center
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={loadAIData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tools</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_tools}</div>
            <div className="text-xs text-muted-foreground">
              of {stats.total_tools} total tools
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_requests_today.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {stats.success_rate.toFixed(1)}% success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_response_time.toFixed(1)}s</div>
            <div className="text-xs text-muted-foreground">
              Across all active tools
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_cost_today.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              ${stats.total_cost_month.toFixed(2)} this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Status</CardTitle>
          <CardDescription>Current AI processing activity and recent completions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.queue_status.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.queue_status.running}</div>
              <div className="text-sm text-gray-500">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.queue_status.completed_today}</div>
              <div className="text-sm text-gray-500">Completed Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.queue_status.failed_today}</div>
              <div className="text-sm text-gray-500">Failed Today</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tools Overview</TabsTrigger>
          <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Tools Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tools..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {toolTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                <select
                  value={filters.provider}
                  onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {providers.map(provider => (
                    <option key={provider.value} value={provider.value}>{provider.label}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="error">Error</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Tools List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTools.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No AI tools found</h3>
                    <p className="text-gray-600">Try adjusting your filters or check back later.</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredTools.map((tool) => {
                const IconComponent = getToolIcon(tool.type)
                const actions = quickActions[tool.type] || {}
                const isProcessing = processingActions.has(`${tool.id}`) || processingActions.has(`process_photos-${tool.id}`)
                
                return (
                  <Card key={tool.id} className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            {React.createElement(IconComponent, { className: "h-5 w-5 text-blue-600" })}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{tool.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={cn("text-xs", getStatusColor(tool.status))}>
                                {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                {getProviderIcon(tool.provider)}
                                <span className="text-xs text-gray-500">{tool.provider}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {tool.model}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-700">{tool.description}</p>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-blue-600">
                            {tool.stats.total_requests.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Total Requests</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-green-600">
                            {((tool.stats.successful_requests / Math.max(tool.stats.total_requests, 1)) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Success Rate</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-purple-600">
                            {tool.stats.avg_response_time.toFixed(1)}s
                          </div>
                          <div className="text-xs text-gray-500">Avg Response</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-orange-600">
                            ${tool.stats.total_cost.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">Total Cost</div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex space-x-2">
                          {actions.primary && (
                            <>
                              {actions.primary.href ? (
                                <Button size="sm" asChild>
                                  <Link href={actions.primary.href} className="flex items-center">
                                    {React.createElement(actions.primary.icon, { className: "h-4 w-4 mr-1" })}
                                    {actions.primary.label}
                                  </Link>
                                </Button>
                              ) : actions.primary?.action && (
                                <Button 
                                  size="sm" 
                                  onClick={() => actions.primary?.action && executeAction(actions.primary.action, tool.id)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    actions.primary?.icon && React.createElement(actions.primary.icon, { className: "h-4 w-4 mr-1" })
                                  )}
                                  {actions.primary?.label}
                                </Button>
                              )}
                            </>
                          )}
                          
                          {actions.secondary && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={actions.secondary.href} className="flex items-center">
                                {React.createElement(actions.secondary.icon, { className: "h-4 w-4 mr-1" })}
                                {actions.secondary.label}
                              </Link>
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {tool.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => executeAction('stop_tool', tool.id)}
                              disabled={isProcessing}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => executeAction('start_tool', tool.id)}
                              disabled={isProcessing}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Job Queue Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Jobs</CardTitle>
              <CardDescription>Latest AI processing jobs and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recent jobs</h3>
                    <p className="text-gray-600">AI processing jobs will appear here when they start.</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{job.tool_name}</h4>
                              <Badge className={cn("text-xs", getJobStatusColor(job.status))}>
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                              </Badge>
                              <Badge className={cn("text-xs", getPriorityColor(job.priority))}>
                                {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created: {format(new Date(job.created_at), 'MMM d, HH:mm')}
                              {job.completed_at && (
                                <span> • Completed: {format(new Date(job.completed_at), 'MMM d, HH:mm')}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {job.processing_time && (
                            <span className="text-xs text-gray-500">
                              {job.processing_time.toFixed(1)}s
                            </span>
                          )}
                          {job.cost && (
                            <span className="text-xs text-gray-500">
                              ${job.cost.toFixed(3)}
                            </span>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {job.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          Error: {job.error_message}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Usage by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.by_provider).map(([provider, count]) => {
                    const iconElement = getProviderIcon(provider)
                    
                    return (
                      <div key={provider} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {iconElement}
                          <span className="text-sm font-medium capitalize">{provider}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={(count / Math.max(Object.values(stats.by_provider).reduce((a, b) => a + b, 0), 1)) * 100} 
                            className="w-20" 
                          />
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Tools by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.by_type).map(([type, count]) => {
                    const toolType = toolTypes.find(t => t.value === type)
                    const IconComponent = toolType?.icon || Brain
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {toolType?.label || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={(count / stats.total_tools) * 100} className="w-20" />
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 