"use client"

import { useState, useEffect } from 'react'
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
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AITool {
  id: string
  name: string
  type: 'content_generator' | 'bias_analyzer' | 'fact_checker' | 'summarizer' | 'translator' | 'moderator'
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
  type: 'generate_content' | 'analyze_bias' | 'fact_check' | 'moderate_content'
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
  type: 'all' | 'content_generator' | 'bias_analyzer' | 'fact_checker' | 'summarizer' | 'translator' | 'moderator'
  provider: 'all' | 'openai' | 'anthropic' | 'google' | 'custom'
  status: 'all' | 'active' | 'paused' | 'error' | 'maintenance'
}

interface AIJobQueue {
  id: string
  tool_id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  started_at: string | null
  completed_at: string | null
  progress: number
  result?: any
  error?: string
}

const toolTypes = [
  { value: 'all', label: 'All Tools', icon: Brain },
  { value: 'content_generator', label: 'Content Generator', icon: FileText },
  { value: 'bias_analyzer', label: 'Bias Analyzer', icon: BarChart3 },
  { value: 'fact_checker', label: 'Fact Checker', icon: MessageSquare },
  { value: 'summarizer', label: 'Summarizer', icon: Sparkles }
]

const providers = [
  { value: 'all', label: 'All Providers' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'custom', label: 'Custom' }
]

export default function AIToolsManagement() {
  const [tools, setTools] = useState<AITool[]>([])
  const [jobs, setJobs] = useState<AIJob[]>([])
  const [stats, setStats] = useState<AIStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState<AIFilters>({
    search: '',
    type: 'all',
    provider: 'all',
    status: 'all'
  })
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [jobQueue, setJobQueue] = useState<AIJobQueue[]>([])
  const [selectedType, setSelectedType] = useState('all')
  const [selectedProvider, setSelectedProvider] = useState('all')

  useEffect(() => {
    loadAIData()
    // Set up polling for real-time updates
    const interval = setInterval(loadAIData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadAIData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration
      const mockStats: AIStats = {
        total_tools: 12,
        active_tools: 9,
        total_requests_today: 1847,
        success_rate: 94.2,
        avg_response_time: 2.3,
        total_cost_today: 47.82,
        total_cost_month: 1234.56,
        by_provider: {
          openai: 7,
          anthropic: 3,
          google: 1,
          custom: 1
        },
        by_type: {
          content_generator: 4,
          bias_analyzer: 2,
          fact_checker: 2,
          summarizer: 2,
          translator: 1,
          moderator: 1
        },
        queue_status: {
          pending: 23,
          running: 5,
          completed_today: 1819,
          failed_today: 28
        }
      }

      const mockTools: AITool[] = [
        {
          id: '1',
          name: 'Content Generator Pro',
          type: 'content_generator',
          provider: 'openai',
          model: 'gpt-4-turbo',
          status: 'active',
          description: 'Advanced content generation for civic education topics',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T15:30:00Z',
          config: {
            max_tokens: 2000,
            temperature: 0.7,
            top_p: 0.9,
            rate_limit_per_minute: 60,
            cost_per_request: 0.03
          },
          stats: {
            total_requests: 12847,
            successful_requests: 12098,
            failed_requests: 749,
            avg_response_time: 2.1,
            total_cost: 385.41,
            last_used: '2024-01-20T15:30:00Z'
          }
        },
        {
          id: '2',
          name: 'Bias Analyzer',
          type: 'bias_analyzer',
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          status: 'active',
          description: 'Analyzes political bias in news articles and content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T14:15:00Z',
          config: {
            max_tokens: 1000,
            temperature: 0.3,
            rate_limit_per_minute: 30,
            cost_per_request: 0.02
          },
          stats: {
            total_requests: 8934,
            successful_requests: 8756,
            failed_requests: 178,
            avg_response_time: 1.8,
            total_cost: 178.68,
            last_used: '2024-01-20T14:15:00Z'
          }
        },
        {
          id: '3',
          name: 'Fact Checker',
          type: 'fact_checker',
          provider: 'openai',
          model: 'gpt-4',
          status: 'active',
          description: 'Verifies factual accuracy of statements and claims',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T16:45:00Z',
          config: {
            max_tokens: 1500,
            temperature: 0.2,
            rate_limit_per_minute: 40,
            cost_per_request: 0.04
          },
          stats: {
            total_requests: 5623,
            successful_requests: 5445,
            failed_requests: 178,
            avg_response_time: 3.2,
            total_cost: 224.92,
            last_used: '2024-01-20T16:45:00Z'
          }
        },
        {
          id: '4',
          name: 'Content Moderator',
          type: 'moderator',
          provider: 'google',
          model: 'gemini-pro',
          status: 'paused',
          description: 'Moderates user-generated content for inappropriate material',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T12:30:00Z',
          config: {
            max_tokens: 500,
            temperature: 0.1,
            rate_limit_per_minute: 100,
            cost_per_request: 0.01
          },
          stats: {
            total_requests: 15672,
            successful_requests: 15234,
            failed_requests: 438,
            avg_response_time: 1.2,
            total_cost: 156.72,
            last_used: '2024-01-19T18:20:00Z'
          }
        },
        {
          id: '5',
          name: 'Quiz Generator',
          type: 'content_generator',
          provider: 'anthropic',
          model: 'claude-3-haiku',
          status: 'error',
          description: 'Generates quiz questions from educational content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T11:20:00Z',
          config: {
            max_tokens: 1000,
            temperature: 0.8,
            rate_limit_per_minute: 50,
            cost_per_request: 0.015
          },
          stats: {
            total_requests: 3456,
            successful_requests: 3201,
            failed_requests: 255,
            avg_response_time: 1.5,
            total_cost: 51.84,
            last_used: '2024-01-20T10:15:00Z'
          }
        }
      ]

      const mockJobs: AIJob[] = [
        {
          id: '1',
          tool_id: '1',
          tool_name: 'Content Generator Pro',
          type: 'generate_content',
          status: 'running',
          input_data: { topic: 'voting_rights', length: 'medium' },
          created_at: '2024-01-20T16:45:00Z',
          started_at: '2024-01-20T16:45:30Z',
          priority: 'normal'
        },
        {
          id: '2',
          tool_id: '2',
          tool_name: 'Bias Analyzer',
          type: 'analyze_bias',
          status: 'completed',
          input_data: { article_url: 'https://example.com/article' },
          output_data: { bias_score: -15, confidence: 0.87 },
          created_at: '2024-01-20T16:40:00Z',
          started_at: '2024-01-20T16:40:15Z',
          completed_at: '2024-01-20T16:41:23Z',
          processing_time: 68,
          cost: 0.02,
          priority: 'high'
        },
        {
          id: '3',
          tool_id: '3',
          tool_name: 'Fact Checker',
          type: 'fact_check',
          status: 'failed',
          input_data: { claim: 'The Constitution has 27 amendments' },
          error_message: 'Rate limit exceeded',
          created_at: '2024-01-20T16:35:00Z',
          started_at: '2024-01-20T16:35:10Z',
          priority: 'normal'
        },
        {
          id: '4',
          tool_id: '1',
          tool_name: 'Content Generator Pro',
          type: 'generate_content',
          status: 'pending',
          input_data: { topic: 'constitutional_law', length: 'long' },
          created_at: '2024-01-20T16:50:00Z',
          priority: 'low'
        }
      ]

      const mockJobQueue: AIJobQueue[] = [
        {
          id: '1',
          tool_id: '1',
          type: 'generate_topic',
          status: 'running',
          priority: 'high',
          created_at: '2024-01-20T18:30:00Z',
          started_at: '2024-01-20T18:31:00Z',
          completed_at: null,
          progress: 65
        },
        {
          id: '2',
          tool_id: '2',
          type: 'generate_questions',
          status: 'pending',
          priority: 'medium',
          created_at: '2024-01-20T18:32:00Z',
          started_at: null,
          completed_at: null,
          progress: 0
        },
        {
          id: '3',
          tool_id: '3',
          type: 'moderate_content',
          status: 'pending',
          priority: 'low',
          created_at: '2024-01-20T18:33:00Z',
          started_at: null,
          completed_at: null,
          progress: 0
        }
      ]

      setStats(mockStats)
      setTools(mockTools)
      setJobs(mockJobs)
      setJobQueue(mockJobQueue)
      
    } catch (error) {
      console.error('Error loading AI data:', error)
    } finally {
      setLoading(false)
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
      case 'active': return 'text-green-700 bg-green-100'
      case 'paused': return 'text-yellow-700 bg-yellow-100'
      case 'error': return 'text-red-700 bg-red-100'
      case 'maintenance': return 'text-blue-700 bg-blue-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100'
      case 'running': return 'text-blue-700 bg-blue-100'
      case 'pending': return 'text-yellow-700 bg-yellow-100'
      case 'failed': return 'text-red-700 bg-red-100'
      case 'cancelled': return 'text-gray-700 bg-gray-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-100'
      case 'high': return 'text-orange-700 bg-orange-100'
      case 'normal': return 'text-blue-700 bg-blue-100'
      case 'low': return 'text-gray-700 bg-gray-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const handleToolAction = async (toolId: string, action: string) => {
    console.log(`Performing action ${action} on tool ${toolId}`)
    await loadAIData()
  }

  const handleJobAction = async (jobId: string, action: string) => {
    console.log(`Performing action ${action} on job ${jobId}`)
    await loadAIData()
  }

  if (loading) {
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load AI Data</h2>
          <p className="text-gray-600 mb-4">Unable to fetch AI tools data</p>
          <Button onClick={loadAIData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Tools Management</h1>
          <p className="text-gray-600">Manage AI services and monitor job processing</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Tool
          </Button>
          <Button variant="outline" size="sm" onClick={loadAIData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
            <div className="text-2xl font-bold">{stats.avg_response_time}s</div>
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
          <CardTitle>Job Queue Status</CardTitle>
          <CardDescription>Current processing queue and recent activity</CardDescription>
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
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
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
                  <option value="all">All Types</option>
                  <option value="content_generator">Content Generator</option>
                  <option value="bias_analyzer">Bias Analyzer</option>
                  <option value="fact_checker">Fact Checker</option>
                  <option value="summarizer">Summarizer</option>
                  <option value="translator">Translator</option>
                  <option value="moderator">Moderator</option>
                </select>

                <select
                  value={filters.provider}
                  onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Providers</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="custom">Custom</option>
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
          <Card>
            <CardHeader>
              <CardTitle>AI Tools ({filteredTools.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTools.map((tool) => (
                  <div key={tool.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{tool.name}</h3>
                          <Badge className={cn("text-xs", getStatusColor(tool.status))}>
                            {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tool.provider.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {tool.model}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4">{tool.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {tool.stats.total_requests.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Total Requests</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {((tool.stats.successful_requests / tool.stats.total_requests) * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Success Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {tool.stats.avg_response_time.toFixed(1)}s
                            </div>
                            <div className="text-xs text-gray-500">Avg Response</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                              ${tool.stats.total_cost.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">Total Cost</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-600">
                              {tool.stats.last_used 
                                ? format(new Date(tool.stats.last_used), 'MMM d')
                                : 'Never'
                              }
                            </div>
                            <div className="text-xs text-gray-500">Last Used</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {tool.status === 'active' ? (
                          <Button size="sm" variant="ghost" onClick={() => handleToolAction(tool.id, 'pause')}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleToolAction(tool.id, 'start')}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleToolAction(tool.id, 'settings')}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToolAction(tool.id, 'view')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToolAction(tool.id, 'edit')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Queue Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Latest AI processing jobs and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => (
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
                            {job.processing_time}s
                          </span>
                        )}
                        {job.cost && (
                          <span className="text-xs text-gray-500">
                            ${job.cost.toFixed(3)}
                          </span>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleJobAction(job.id, 'view')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {job.status === 'pending' && (
                          <Button size="sm" variant="ghost" onClick={() => handleJobAction(job.id, 'cancel')}>
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {job.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        Error: {job.error_message}
                      </div>
                    )}
                  </div>
                ))}
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
                <CardTitle>Tools by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.by_provider).map(([provider, count]) => (
                    <div key={provider} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{provider}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(count / stats.total_tools) * 100} className="w-20" />
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
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
                  {Object.entries(stats.by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(count / stats.total_tools) * 100} className="w-20" />
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 