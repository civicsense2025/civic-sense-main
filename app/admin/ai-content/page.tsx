"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Brain, Users, Calendar, Search, Filter, 
  CheckCircle, XCircle, Clock, AlertCircle,
  Eye, Edit, Trash2, ExternalLink, Star,
  TrendingUp, BarChart3, Sparkles, Shield,
  ArrowRight, Plus, Download, Upload,
  Globe, User, BookOpen, Gavel, Vote,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/supabase'
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// Content generation interfaces
interface GenerationSettings {
  maxArticles: number
  daysSinceCreated: number
  categories: string[]
  forceGeneration: boolean
  
  // Source selection
  selectedArticles: string[]
  selectedSources: string[]
  includeTopicsWithoutContent: boolean
  
  // Content generation controls
  questionsPerTopic: number
  questionTypeDistribution: {
    multipleChoice: number
    trueFalse: number
    shortAnswer: number
    fillInBlank: number
    matching: number
  }
  difficultyDistribution: {
    easy: number
    medium: number
    hard: number
  }
  
  // AI Model Configuration
  aiModel: 'gpt-4' | 'gpt-4-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'claude-3-7-sonnet-20250219'
  temperature: number
  enableWebSearch: boolean
  maxTokens: number
  systemPromptOverride?: string
  
  // Execution options
  isDryRun: boolean
  showPreview: boolean
  
  // Scheduling options
  generateForFutureDates: boolean
  startDate: string
  daysToGenerate: number
  scheduleRecurring: boolean
  recurringInterval: 'daily' | 'every12hours' | 'weekly'
  scheduleName?: string
  scheduleDescription?: string
  autoApprove: boolean
}

interface GenerationResult {
  success: boolean
  message: string
  results?: {
    articlesProcessed: number
    topicsGenerated: number
    questionsGenerated: number
    saveResults: {
      topicsSaved: number
      questionsSaved: number
      errors: string[]
    }
    errors?: Array<{ article: string, error: string }>
  }
  error?: string
}

// Use actual database types with optional tracking fields (since migration hasn't run yet)
interface AIExtractedTopic {
  id: string
  topic_id: string
  topic_title: string
  description: string
  why_this_matters: string
  emoji: string
  categories: any // Json type
  source_analysis_id?: string | null
  ai_extraction_metadata?: any
  created_at: string | null
  is_active: boolean | null
  date?: string | null
  day_of_week?: string | null
  is_breaking?: boolean | null
  translations?: any
  updated_at?: string | null
}

interface AIExtractedFigure {
  id: string
  full_name: string
  display_name?: string | null
  slug: string
  primary_role_category?: string | null
  party_affiliation?: string | null
  current_positions?: string[] | null
  source_analysis_id?: string | null
  ai_extraction_metadata?: any
  created_at?: string | null
  content_review_status?: string | null
  // Include other database fields
  bills_sponsored?: number | null
  birth_state?: string | null
  birth_year?: number | null
  civicsense_priority?: number | null
  influence_level?: number | null
  updated_at?: string | null
}

interface AIExtractedEvent {
  topic_id: string
  topic_title: string
  date: string
  description: string
  why_this_matters: string
  source_analysis_id?: string | null
  ai_extraction_metadata?: any
  sources?: any
}

interface AdminStats {
  totalTopics: number
  totalFigures: number
  totalEvents: number
  pendingReview: number
  approvedContent: number
  rejectedContent: number
  extractionSources: number
}

function NewsArticlesPreview() {
  const [articles, setArticles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('source_metadata')
          .select('title, domain, credibility_score, last_fetched_at, url')
          .gte('credibility_score', 70)
          .not('title', 'is', null)
          .order('last_fetched_at', { ascending: false })
          .limit(10)

        if (error) throw error
        setArticles(data || [])
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentArticles()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No recent news articles found in the database
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {articles.map((article, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">
              {article.title}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {article.domain}
              </span>
              {article.credibility_score && (
                <Badge variant="outline" className="text-xs">
                  {article.credibility_score}% credible
                </Badge>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(article.last_fetched_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(article.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

export default function AIContentAdminPage() {
  const { user } = useAuth()
  const { hasFeatureAccess } = usePremium()
  const { toast } = useToast()
  const { isAdmin, isLoading: adminLoading, error: adminError } = useAdminAccess()
  
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [topics, setTopics] = useState<AIExtractedTopic[]>([])
  const [figures, setFigures] = useState<AIExtractedFigure[]>([])
  const [events, setEvents] = useState<AIExtractedEvent[]>([])
  
  // Content generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  
  // Enhanced features state
  const [availableArticles, setAvailableArticles] = useState<any[]>([])
  const [availableSources, setAvailableSources] = useState<any[]>([])
  const [topicsWithoutContent, setTopicsWithoutContent] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([])
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [isTestingApiKey, setIsTestingApiKey] = useState(false)
  const [apiKeyTestResult, setApiKeyTestResult] = useState<{ success: boolean, message: string } | null>(null)
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    maxArticles: 10,
    daysSinceCreated: 7,
    categories: [],
    forceGeneration: false,
    
    // Source selection
    selectedArticles: [],
    selectedSources: [],
    includeTopicsWithoutContent: false,
    
    // Content generation controls
    questionsPerTopic: 6,
    questionTypeDistribution: {
      multipleChoice: 60,
      trueFalse: 25,
      shortAnswer: 15,
      fillInBlank: 0,
      matching: 0
    },
    difficultyDistribution: {
      easy: 30,
      medium: 50,
      hard: 20
    },
    
    // AI Model Configuration
    aiModel: 'gpt-4-turbo',
    temperature: 0.7,
    enableWebSearch: true,
    maxTokens: 4096,
    systemPromptOverride: undefined,
    
    // Execution options
    isDryRun: false,
    showPreview: false,
    
    // Scheduling options
    generateForFutureDates: false,
    startDate: new Date().toISOString().split('T')[0],
    daysToGenerate: 1,
    scheduleRecurring: false,
    recurringInterval: 'daily',
    scheduleName: undefined,
    scheduleDescription: undefined,
    autoApprove: false
  })
  
  // Check admin access and redirect if unauthorized
  useEffect(() => {
    if (!user) return
    
    if (adminError) {
      toast({
        title: "Access Error",
        description: "Could not verify admin permissions",
        variant: "destructive"
      })
      window.location.href = '/dashboard'
      return
    }
    
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions to access this panel",
        variant: "destructive"
      })
      window.location.href = '/dashboard'
      return
    }
    
    if (!adminLoading && isAdmin) {
      console.log('✅ Admin access verified for user:', user.email)
    }
  }, [user, isAdmin, adminLoading, adminError, toast])

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        
        // Load AI-extracted topics (fallback to all topics if no ai_extracted exist yet)
        let { data: topicsData, error: topicsError } = await supabase
          .from('question_topics')
          .select('*')
          .eq('source_type', 'ai_extracted')
          .order('created_at', { ascending: false })
        
        // If no AI-extracted topics exist yet, show empty array
        if (topicsError || !topicsData || topicsData.length === 0) {
          topicsData = []
        }
        setTopics(topicsData as AIExtractedTopic[])
        
        // Load AI-extracted figures (fallback to empty if none exist)
        let { data: figuresData, error: figuresError } = await supabase
          .from('public_figures')
          .select('*')
          .eq('source_type', 'ai_extracted')
          .order('created_at', { ascending: false })
        
        if (figuresError || !figuresData || figuresData.length === 0) {
          figuresData = []
        }
        setFigures(figuresData as AIExtractedFigure[])
        
        // Load AI-extracted events (fallback to empty if none exist)
        let { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('source_type', 'ai_extracted')
          .order('date', { ascending: false })
        
        if (eventsError || !eventsData || eventsData.length === 0) {
          eventsData = []
        }
        setEvents(eventsData as AIExtractedEvent[])
        
        // Calculate stats
        const pendingFigures = figuresData?.filter(f => f.content_review_status === 'ai_generated').length || 0
        const approvedFigures = figuresData?.filter(f => f.content_review_status === 'approved').length || 0
        const rejectedFigures = figuresData?.filter(f => f.content_review_status === 'rejected').length || 0
        
        // Get unique source analysis IDs (with null checks)
        const sourceIds = new Set([
          ...(topicsData?.map(t => (t as any).source_analysis_id).filter(Boolean) || []),
          ...(figuresData?.map(f => (f as any).source_analysis_id).filter(Boolean) || []),
          ...(eventsData?.map(e => (e as any).source_analysis_id).filter(Boolean) || [])
        ])
        
        const adminStats: AdminStats = {
          totalTopics: topicsData?.length || 0,
          totalFigures: figuresData?.length || 0,
          totalEvents: eventsData?.length || 0,
          pendingReview: pendingFigures,
          approvedContent: approvedFigures,
          rejectedContent: rejectedFigures,
          extractionSources: sourceIds.size
        }
        
        setStats(adminStats)
        
      } catch (error) {
        console.error('Error loading admin data:', error)
        toast({
          title: "Error",
          description: "Failed to load admin data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    const loadEnhancedData = async () => {
      try {
        // Load available articles
        const { data: articlesData } = await supabase
          .from('source_metadata')
          .select('id, title, domain, credibility_score, last_fetched_at, url')
          .gte('credibility_score', 70)
          .not('title', 'is', null)
          .order('last_fetched_at', { ascending: false })
          .limit(50)
        
        setAvailableArticles(articlesData || [])

        // Load available sources with counts (simplified)
        const { data: sourcesData } = await supabase
          .from('source_metadata')
          .select('domain')
          .gte('credibility_score', 70)
          .not('title', 'is', null)
        
        // Group by domain and count
        const sourceCounts = (sourcesData || []).reduce((acc: any, item: any) => {
          acc[item.domain] = (acc[item.domain] || 0) + 1
          return acc
        }, {})
        
        const sourcesWithCounts = Object.entries(sourceCounts).map(([domain, count]) => ({
          domain,
          count
        })).slice(0, 20)
        
        setAvailableSources(sourcesWithCounts)

        // Load topics without content (simplified check)
        const { data: topicsWithoutContentData } = await supabase
          .from('question_topics')
          .select('topic_id, topic_title, categories')
          .eq('is_active', true)
          .limit(50)
        
        setTopicsWithoutContent(topicsWithoutContentData || [])

        // Load scheduled jobs
        loadScheduledJobs()
      } catch (error) {
        console.error('Error loading enhanced data:', error)
      }
    }
    
    loadAdminData()
    loadEnhancedData()
  }, [user, toast])

  const handleApproveContent = async (type: 'topic' | 'figure' | 'event', id: string) => {
    try {
      if (type === 'figure') {
        const { error } = await supabase
          .from('public_figures')
          .update({ content_review_status: 'approved' })
          .eq('id', id)
        
        if (error) throw error
        
        // Update local state
        setFigures(prev => prev.map(f => 
          f.id === id ? { ...f, content_review_status: 'approved' } : f
        ))
      }
      // Add similar logic for topics and events as needed
      
      toast({
        title: "Content Approved",
        description: `${type} has been approved and is now live`,
      })
    } catch (error) {
      console.error('Error approving content:', error)
      toast({
        title: "Error",
        description: "Failed to approve content",
        variant: "destructive"
      })
    }
  }

  const handleRejectContent = async (type: 'topic' | 'figure' | 'event', id: string) => {
    try {
      if (type === 'figure') {
        const { error } = await supabase
          .from('public_figures')
          .update({ content_review_status: 'rejected' })
          .eq('id', id)
        
        if (error) throw error
        
        // Update local state
        setFigures(prev => prev.map(f => 
          f.id === id ? { ...f, content_review_status: 'rejected' } : f
        ))
      }
      
      toast({
        title: "Content Rejected",
        description: `${type} has been rejected and hidden from users`,
      })
    } catch (error) {
      console.error('Error rejecting content:', error)
      toast({
        title: "Error",
        description: "Failed to reject content",
        variant: "destructive"
      })
    }
  }

  const handleGenerateContent = async () => {
    if (!user) return
    
    setIsGenerating(true)
    setGenerationResult(null)
    
    try {
      const response = await fetch('/api/admin/generate-content-from-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...generationSettings,
          userId: user.id
        })
      })
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Server error occurred'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch {
          // If not JSON, use the raw text
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
      
      const result: GenerationResult = await response.json()
      setGenerationResult(result)
      
      if (result.success) {
        toast({
          title: "Content Generation Complete",
          description: result.message,
        })
        
        // Only refresh if we actually generated content
        if (result.results?.topicsGenerated && result.results.topicsGenerated > 0) {
          setTimeout(() => {
            window.location.reload()
          }, 1500) // Give user time to see the success message
        }
      } else {
        // Handle specific error types
        const errorMessage = result.error || 'Unknown error occurred'
        
        if (errorMessage.includes('API key')) {
          toast({
            title: "API Configuration Error",
            description: "OpenAI API key is missing or invalid. Please check your environment variables.",
            variant: "destructive"
          })
        } else if (errorMessage.includes('rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment before trying again.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Generation Failed",
            description: errorMessage,
            variant: "destructive"
          })
        }
      }
      
    } catch (error) {
      console.error('Error generating content:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Handle specific error cases
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        toast({
          title: "API Configuration Error",
          description: "OpenAI API key is missing or invalid. Please check your .env file.",
          variant: "destructive"
        })
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        toast({
          title: "Network Error",
          description: "Failed to connect to the server. Please check your internet connection.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Generation Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGeneratePreview = async () => {
    if (!user) return
    
    setIsLoadingPreview(true)
    setPreviewData(null)
    
    try {
      const response = await fetch('/api/admin/generate-content-from-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...generationSettings,
          isDryRun: true, // Force dry run for preview
          userId: user?.id
        })
      })
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Server error occurred'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      setPreviewData(result)
      
      if (result.success) {
        toast({
          title: "Preview Generated",
          description: "Review the content that would be generated",
        })
      } else {
        const errorMessage = result.error || 'Failed to generate preview'
        
        if (errorMessage.includes('API key')) {
          toast({
            title: "API Configuration Error",
            description: "OpenAI API key is missing or invalid. Cannot generate preview.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Preview Failed",
            description: errorMessage,
            variant: "destructive"
          })
        }
      }
      
    } catch (error) {
      console.error('Error generating preview:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        toast({
          title: "API Configuration Error",
          description: "OpenAI API key is missing or invalid. Please check your .env file.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Preview Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleSaveAsSchedule = () => {
    setShowScheduleDialog(true)
  }

  const handleCreateScheduledJob = async (scheduleData: any) => {
    if (!user) return
    
    try {
      // TODO: Implement actual scheduling API endpoint
      toast({
        title: "Coming Soon",
        description: "Full scheduling functionality will be available soon",
      })
      setShowScheduleDialog(false)
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast({
        title: "Schedule Error",
        description: "Failed to create scheduled job",
        variant: "destructive"
      })
    }
  }

  const loadScheduledJobs = async () => {
    try {
      // Note: scheduled_content_jobs table may not exist yet
      // This will be implemented when the scheduling feature is fully ready
      setScheduledJobs([])
    } catch (error) {
      console.error('Error loading scheduled jobs:', error)
    }
  }

  const handleTestApiKey = async () => {
    setIsTestingApiKey(true)
    setApiKeyTestResult(null)
    
    try {
      const response = await fetch('/api/admin/test-openai', {
        method: 'GET'
      })
      
      const result = await response.json()
      
      setApiKeyTestResult({
        success: result.success,
        message: result.success 
          ? `✅ ${result.message} (${result.model_used})`
          : `❌ ${result.error}: ${result.details}`
      })
      
      if (result.success) {
        toast({
          title: "API Key Test Successful",
          description: "OpenAI API key is working correctly",
        })
      } else {
        toast({
          title: "API Key Test Failed",
          description: result.details || result.error,
          variant: "destructive"
        })
      }
      
    } catch (error) {
      console.error('Error testing API key:', error)
      const errorMessage = error instanceof Error ? error.message : 'Network error'
      
      setApiKeyTestResult({
        success: false,
        message: `❌ Test failed: ${errorMessage}`
      })
      
      toast({
        title: "API Key Test Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsTestingApiKey(false)
    }
  }

  const handlePresetSettings = (preset: 'daily-quiz' | 'weekly-batch') => {
    if (preset === 'daily-quiz') {
      setGenerationSettings(prev => ({
        ...prev,
        maxArticles: 5,
        questionsPerTopic: 6,
        generateForFutureDates: true,
        daysToGenerate: 7,
        questionTypeDistribution: {
          multipleChoice: 70,
          trueFalse: 20,
          shortAnswer: 10,
          fillInBlank: 0,
          matching: 0
        },
        difficultyDistribution: {
          easy: 25,
          medium: 55,
          hard: 20
        }
      }))
      toast({
        title: "Daily Quiz Preset Applied",
        description: "Configured for daily quiz generation with 6 questions per topic",
      })
    } else if (preset === 'weekly-batch') {
      setGenerationSettings(prev => ({
        ...prev,
        maxArticles: 20,
        questionsPerTopic: 8,
        generateForFutureDates: true,
        daysToGenerate: 7,
        questionTypeDistribution: {
          multipleChoice: 60,
          trueFalse: 25,
          shortAnswer: 15,
          fillInBlank: 0,
          matching: 0
        },
        difficultyDistribution: {
          easy: 30,
          medium: 50,
          hard: 20
        }
      }))
      toast({
        title: "Weekly Batch Preset Applied",
        description: "Configured for weekly content generation with 8 questions per topic",
      })
    }
  }

  if (isLoading || adminLoading || !stats || (!isAdmin && !adminError)) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'ai_generated': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
      'approved': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
    }
    
    const variant = variants[status as keyof typeof variants] || variants['ai_generated']
    const Icon = variant.icon
    
    return (
      <Badge className={`${variant.color} border-0 font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'ai_generated' ? 'Pending' : status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      <main className="w-full py-8">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                <Brain className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                AI Content Review
              </h1>
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Review and manage civic education content extracted from news articles
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-light text-slate-900 dark:text-white">
                {stats.totalTopics + stats.totalFigures + stats.totalEvents}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Total Items</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Extracted from {stats.extractionSources} articles
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light text-yellow-600 dark:text-yellow-400">
                {stats.pendingReview}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Pending Review</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Awaiting approval
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light text-green-600 dark:text-green-400">
                {stats.approvedContent}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Approved</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Live content
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-light text-red-600 dark:text-red-400">
                {stats.rejectedContent}
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Rejected</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Hidden content
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 dark:border-slate-700 rounded-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 rounded-full border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ai_generated">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40 rounded-full border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Generation Section */}
          <Card className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                Generate Content from News Articles
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically create civic education topics and questions from recent news articles in your database
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Basic Settings */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Basic Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Articles</label>
                    <Select
                      value={generationSettings.maxArticles.toString()}
                      onValueChange={(value) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        maxArticles: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 articles</SelectItem>
                        <SelectItem value="10">10 articles</SelectItem>
                        <SelectItem value="20">20 articles</SelectItem>
                        <SelectItem value="30">30 articles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time Range</label>
                    <Select
                      value={generationSettings.daysSinceCreated.toString()}
                      onValueChange={(value) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        daysSinceCreated: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Last 24 hours</SelectItem>
                        <SelectItem value="3">Last 3 days</SelectItem>
                        <SelectItem value="7">Last week</SelectItem>
                        <SelectItem value="14">Last 2 weeks</SelectItem>
                        <SelectItem value="30">Last month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="forceGeneration"
                        checked={generationSettings.forceGeneration}
                        onChange={(e) => setGenerationSettings(prev => ({ 
                          ...prev, 
                          forceGeneration: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <label htmlFor="forceGeneration" className="text-sm">
                        Force generation (ignore duplicates)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Configuration */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Content Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Questions Per Topic */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Questions Per Topic</label>
                    <Select
                      value={generationSettings.questionsPerTopic.toString()}
                      onValueChange={(value) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        questionsPerTopic: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 questions</SelectItem>
                        <SelectItem value="4">4 questions</SelectItem>
                        <SelectItem value="5">5 questions</SelectItem>
                        <SelectItem value="6">6 questions (default)</SelectItem>
                        <SelectItem value="7">7 questions</SelectItem>
                        <SelectItem value="8">8 questions</SelectItem>
                        <SelectItem value="10">10 questions</SelectItem>
                        <SelectItem value="12">12 questions</SelectItem>
                        <SelectItem value="15">15 questions</SelectItem>
                        <SelectItem value="20">20 questions</SelectItem>
                        <SelectItem value="25">25 questions</SelectItem>
                        <SelectItem value="30">30 questions</SelectItem>
                        <SelectItem value="35">35 questions</SelectItem>
                        <SelectItem value="40">40 questions</SelectItem>
                        <SelectItem value="50">50 questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question Type Distribution */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Question Type Distribution (%)</label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-xs">Multiple Choice</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={generationSettings.questionTypeDistribution.multipleChoice}
                          onChange={(e) => setGenerationSettings(prev => ({
                            ...prev,
                            questionTypeDistribution: {
                              ...prev.questionTypeDistribution,
                              multipleChoice: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="px-2 py-1 text-xs border rounded"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-xs">True/False</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={generationSettings.questionTypeDistribution.trueFalse}
                          onChange={(e) => setGenerationSettings(prev => ({
                            ...prev,
                            questionTypeDistribution: {
                              ...prev.questionTypeDistribution,
                              trueFalse: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="px-2 py-1 text-xs border rounded"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-xs">Short Answer</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={generationSettings.questionTypeDistribution.shortAnswer}
                          onChange={(e) => setGenerationSettings(prev => ({
                            ...prev,
                            questionTypeDistribution: {
                              ...prev.questionTypeDistribution,
                              shortAnswer: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="px-2 py-1 text-xs border rounded"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Distribution */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Difficulty Distribution (%)</label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-xs">Easy (Recall)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={generationSettings.difficultyDistribution.easy}
                          onChange={(e) => setGenerationSettings(prev => ({
                            ...prev,
                            difficultyDistribution: {
                              ...prev.difficultyDistribution,
                              easy: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="px-2 py-1 text-xs border rounded"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-xs">Medium (Analysis)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={generationSettings.difficultyDistribution.medium}
                          onChange={(e) => setGenerationSettings(prev => ({
                            ...prev,
                            difficultyDistribution: {
                              ...prev.difficultyDistribution,
                              medium: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="px-2 py-1 text-xs border rounded"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-xs">Hard (Evaluation)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={generationSettings.difficultyDistribution.hard}
                          onChange={(e) => setGenerationSettings(prev => ({
                            ...prev,
                            difficultyDistribution: {
                              ...prev.difficultyDistribution,
                              hard: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="px-2 py-1 text-xs border rounded"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Model Configuration */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">AI Model Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">AI Model</label>
                    <Select
                      value={generationSettings.aiModel}
                      onValueChange={(value: any) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        aiModel: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Recommended)</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Latest)</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Temperature: {generationSettings.temperature}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={generationSettings.temperature}
                      onChange={(e) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        temperature: parseFloat(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Tokens</label>
                    <Select
                      value={generationSettings.maxTokens.toString()}
                      onValueChange={(value) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        maxTokens: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2048">2,048 tokens</SelectItem>
                        <SelectItem value="4096">4,096 tokens</SelectItem>
                        <SelectItem value="8192">8,192 tokens</SelectItem>
                        <SelectItem value="16384">16,384 tokens</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableWebSearch"
                      checked={generationSettings.enableWebSearch}
                      onChange={(e) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        enableWebSearch: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="enableWebSearch" className="text-sm font-medium">
                      Enable web search for real-time information
                    </label>
                  </div>
                  


                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom System Prompt (Optional)</label>
                    <textarea
                      value={generationSettings.systemPromptOverride || ''}
                      onChange={(e) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        systemPromptOverride: e.target.value || undefined 
                      }))}
                      placeholder="Override the default system prompt with custom instructions..."
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Source Selection */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Source Selection</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeTopicsWithoutContent"
                      checked={generationSettings.includeTopicsWithoutContent}
                      onChange={(e) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        includeTopicsWithoutContent: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="includeTopicsWithoutContent" className="text-sm font-medium">
                      Prioritize topics without existing content ({topicsWithoutContent.length} found)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Specific Articles</label>
                      <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        {availableArticles.slice(0, 10).map((article, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`article-${index}`}
                              checked={generationSettings.selectedArticles.includes(article.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGenerationSettings(prev => ({
                                    ...prev,
                                    selectedArticles: [...prev.selectedArticles, article.id]
                                  }))
                                } else {
                                  setGenerationSettings(prev => ({
                                    ...prev,
                                    selectedArticles: prev.selectedArticles.filter(id => id !== article.id)
                                  }))
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`article-${index}`} className="text-xs flex-1 truncate">
                              {article.title || 'Untitled Article'}
                            </label>
                          </div>
                        ))}
                        {availableArticles.length === 0 && (
                          <p className="text-xs text-slate-500">Loading articles...</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Select News Sources</label>
                      <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        {availableSources.slice(0, 10).map((source, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`source-${index}`}
                              checked={generationSettings.selectedSources.includes(source.domain)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGenerationSettings(prev => ({
                                    ...prev,
                                    selectedSources: [...prev.selectedSources, source.domain]
                                  }))
                                } else {
                                  setGenerationSettings(prev => ({
                                    ...prev,
                                    selectedSources: prev.selectedSources.filter(domain => domain !== source.domain)
                                  }))
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`source-${index}`} className="text-xs flex-1">
                              {source.domain} ({source.count} articles)
                            </label>
                          </div>
                        ))}
                        {availableSources.length === 0 && (
                          <p className="text-xs text-slate-500">Loading sources...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Options */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Execution Options</h4>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isDryRun"
                        checked={generationSettings.isDryRun}
                        onChange={(e) => setGenerationSettings(prev => ({ 
                          ...prev, 
                          isDryRun: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <label htmlFor="isDryRun" className="text-sm font-medium">
                        Dry run (show what would be generated without saving)
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showPreview"
                        checked={generationSettings.showPreview}
                        onChange={(e) => setGenerationSettings(prev => ({ 
                          ...prev, 
                          showPreview: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <label htmlFor="showPreview" className="text-sm font-medium">
                        Show preview before generating
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoApprove"
                        checked={generationSettings.autoApprove}
                        onChange={(e) => setGenerationSettings(prev => ({ 
                          ...prev, 
                          autoApprove: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <label htmlFor="autoApprove" className="text-sm font-medium">
                        Auto-approve generated content
                      </label>
                    </div>
                  </div>

                  {generationSettings.showPreview && (
                    <div className="pl-6 border-l-2 border-blue-200 dark:border-blue-700">
                      <Button
                        onClick={() => handleGeneratePreview()}
                        disabled={isLoadingPreview}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {isLoadingPreview ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600"></div>
                            Loading Preview...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Generate Preview
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Future Dating & Scheduling */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Scheduling Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="generateForFutureDates"
                      checked={generationSettings.generateForFutureDates}
                      onChange={(e) => setGenerationSettings(prev => ({ 
                        ...prev, 
                        generateForFutureDates: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="generateForFutureDates" className="text-sm font-medium">
                      Generate content for future dates
                    </label>
                  </div>

                  {generationSettings.generateForFutureDates && (
                    <div className="space-y-4 pl-6 border-l-2 border-blue-200 dark:border-blue-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Start Date</label>
                          <input
                            type="date"
                            value={generationSettings.startDate}
                            onChange={(e) => setGenerationSettings(prev => ({ 
                              ...prev, 
                              startDate: e.target.value 
                            }))}
                            className="w-full px-3 py-2 text-sm border rounded"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Days to Generate</label>
                          <Select
                            value={generationSettings.daysToGenerate.toString()}
                            onValueChange={(value) => setGenerationSettings(prev => ({ 
                              ...prev, 
                              daysToGenerate: parseInt(value) 
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 day</SelectItem>
                              <SelectItem value="3">3 days</SelectItem>
                              <SelectItem value="5">5 days</SelectItem>
                              <SelectItem value="7">1 week</SelectItem>
                              <SelectItem value="14">2 weeks</SelectItem>
                              <SelectItem value="30">1 month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Recurring Interval</label>
                          <Select
                            value={generationSettings.recurringInterval}
                            onValueChange={(value: 'daily' | 'every12hours' | 'weekly') => setGenerationSettings(prev => ({ 
                              ...prev, 
                              recurringInterval: value 
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="every12hours">Every 12 hours</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Schedule Name</label>
                          <input
                            type="text"
                            value={generationSettings.scheduleName || ''}
                            onChange={(e) => setGenerationSettings(prev => ({ 
                              ...prev, 
                              scheduleName: e.target.value 
                            }))}
                            placeholder="e.g., Daily Morning News Quiz"
                            className="w-full px-3 py-2 text-sm border rounded"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                          <input
                            type="text"
                            value={generationSettings.scheduleDescription || ''}
                            onChange={(e) => setGenerationSettings(prev => ({ 
                              ...prev, 
                              scheduleDescription: e.target.value 
                            }))}
                            placeholder="Brief description of this scheduled job"
                            className="w-full px-3 py-2 text-sm border rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Scheduled Jobs */}
              {scheduledJobs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Active Scheduled Jobs</h4>
                  <div className="space-y-3">
                    {scheduledJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{job.name}</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {job.interval} • Next run: {new Date(job.next_run).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={job.is_active ? "default" : "secondary"}>
                            {job.is_active ? "Active" : "Paused"}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Schedule Button */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">Quick Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSaveAsSchedule()}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Save as Scheduled Job
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePresetSettings('daily-quiz')}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Daily Quiz Setup
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePresetSettings('weekly-batch')}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Weekly Batch
                  </Button>
                </div>
              </div>
              
              {/* Preview Display */}
              {previewData && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Content Preview</h4>
                  {previewData.success ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{previewData.results?.topicsGenerated || 0}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Topics</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{previewData.results?.questionsGenerated || 0}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Questions</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{previewData.results?.articlesProcessed || 0}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Articles</div>
                        </div>
                      </div>
                      
                      {previewData.results?.previewTopics && (
                        <div>
                          <h5 className="font-medium mb-2">Sample Topics:</h5>
                          <div className="space-y-2">
                            {previewData.results.previewTopics.slice(0, 3).map((topic: any, index: number) => (
                              <div key={index} className="bg-white dark:bg-slate-800 p-3 rounded border">
                                <div className="font-medium text-sm">{topic.title}</div>
                                <div className="text-xs text-slate-500 mt-1">{topic.description}</div>
                                <div className="text-xs text-slate-400 mt-1">{topic.questionCount} questions</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          This is a preview. No content has been saved.
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setPreviewData(null)}
                          >
                            Clear Preview
                          </Button>
                          <Button
                            onClick={() => {
                              setGenerationSettings(prev => ({ ...prev, isDryRun: false }))
                              handleGenerateContent()
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Generate for Real
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600 dark:text-red-400">
                      Preview failed: {previewData.error}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className={cn(
                    "text-white",
                    generationSettings.isDryRun 
                      ? "bg-orange-600 hover:bg-orange-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {generationSettings.isDryRun ? 'Running Dry Run...' : 'Generating Content...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generationSettings.isDryRun ? 'Run Dry Run' : 'Generate Content'}
                    </>
                  )}
                </Button>
                
                {generationResult && (
                  <div className="flex-1">
                    {generationResult.success ? (
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✅ {generationResult.message}
                        {generationResult.results && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {generationResult.results.topicsGenerated} topics, {generationResult.results.questionsGenerated} questions generated
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                        ❌ {generationResult.error || 'Generation failed'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {generationResult?.results?.errors && generationResult.results.errors.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Some articles couldn't be processed:
                  </h4>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    {generationResult.results.errors.slice(0, 3).map((error, idx) => (
                      <li key={idx}>• {error.article}: {error.error}</li>
                    ))}
                    {generationResult.results.errors.length > 3 && (
                      <li>• ... and {generationResult.results.errors.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 rounded-full bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="overview" className="rounded-full">Overview</TabsTrigger>
              <TabsTrigger value="topics" className="rounded-full">
                Topics ({stats.totalTopics})
              </TabsTrigger>
              <TabsTrigger value="figures" className="rounded-full">
                Figures ({stats.totalFigures})
              </TabsTrigger>
              <TabsTrigger value="events" className="rounded-full">
                Events ({stats.totalEvents})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      Question Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                      {stats.totalTopics}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Civic education topics extracted from articles
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <User className="h-5 w-5 text-purple-500" />
                      Public Figures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                      {stats.totalFigures}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Politicians and civic leaders identified
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Calendar className="h-5 w-5 text-green-500" />
                      Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                      {stats.totalEvents}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Important civic events and milestones
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* News Articles Available */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-orange-500" />
                    Available News Articles
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Recent news articles in your database ready for content generation
                  </p>
                </CardHeader>
                <CardContent>
                  <NewsArticlesPreview />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topics" className="space-y-6">
              <div className="space-y-4">
                {topics.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No AI-extracted topics found
                  </div>
                ) : (
                  topics.map((topic) => (
                    <Card key={topic.id} className="border-slate-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{topic.emoji}</span>
                              <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {topic.topic_title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {topic.topic_id}
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                              {topic.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(topic.categories) ? topic.categories.map((category: any) => (
                                <Badge key={category} variant="outline" className="text-xs">
                                  {category}
                                </Badge>
                              )) : null}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span>Created: {topic.created_at ? new Date(topic.created_at).toLocaleDateString() : 'Unknown'}</span>
                              {topic.source_analysis_id && (
                                <span>Analysis ID: {topic.source_analysis_id.slice(0, 8)}...</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge(topic.is_active ? 'approved' : 'ai_generated')}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="figures" className="space-y-6">
              <div className="space-y-4">
                {figures.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No AI-extracted figures found
                  </div>
                ) : (
                  figures.map((figure) => (
                    <Card key={figure.id} className="border-slate-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {figure.full_name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {figure.primary_role_category || 'Unknown role'}
                                  {figure.party_affiliation && ` • ${figure.party_affiliation}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {figure.current_positions?.map((position, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {position}
                                </Badge>
                              )) || null}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <span>Added: {figure.created_at ? new Date(figure.created_at).toLocaleDateString() : 'Unknown'}</span>
                              {figure.source_analysis_id && (
                                <span>Analysis ID: {figure.source_analysis_id.slice(0, 8)}...</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge(figure.content_review_status || 'ai_generated')}
                            <div className="flex gap-1">
                              {figure.content_review_status === 'ai_generated' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleApproveContent('figure', figure.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRejectContent('figure', figure.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No AI-extracted events found
                  </div>
                ) : (
                  events.map((event) => (
                    <Card key={event.topic_id} className="border-slate-200 dark:border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {event.topic_title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {new Date(event.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                              {event.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              {event.source_analysis_id && (
                                <span>Analysis ID: {event.source_analysis_id.slice(0, 8)}...</span>
                              )}
                              {event.ai_extraction_metadata?.significance && (
                                <Badge variant="outline" className="text-xs">
                                  {event.ai_extraction_metadata.significance} significance
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge('approved')}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="text-center py-12 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-4">
              <h3 className="text-xl font-light text-slate-900 dark:text-white">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="outline" className="rounded-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="rounded-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Link href="/test-media-bias-analysis">
                  <Button variant="outline" className="rounded-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test Extraction
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
} 