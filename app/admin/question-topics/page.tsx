"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Download, 
  Upload,
  BarChart3,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  FileText,
  Settings,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Calendar,
  Tag,
  Users,
  TrendingUp,
  Database,
  Globe,
  MoreVertical,
  Archive,
  Bookmark,
  Star,
  Copy,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from '@/lib/supabase/client'

// Types
interface QuestionTopic {
  id: string
  topic_id: string
  topic_title: string
  description: string
  why_this_matters: string
  emoji: string
  date: string | null
  day_of_week: string | null
  categories: string[]
  is_active: boolean
  is_breaking: boolean
  is_featured: boolean
  key_takeaways: any | null
  created_at: string
  updated_at: string | null
  question_count?: number
  has_questions?: boolean
}

interface AdminStats {
  totalTopics: number
  topicsWithQuestions: number
  topicsWithoutQuestions: number
  topicsWithKeyTakeaways: number
  totalQuestions: number
  avgQuestionsPerTopic: number
  categoryCounts: Record<string, number>
}

interface AIProcessingJob {
  id: string
  type: 'optimization' | 'key_takeaways'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  topicId?: string
  provider?: 'openai' | 'anthropic'
  cost?: number
  startedAt: string
  completedAt?: string
  error?: string
}

// View types
type ViewMode = 'grid' | 'table' | 'compact'
type FilterMode = 'all' | 'with_questions' | 'without_questions' | 'with_key_takeaways' | 'without_key_takeaways' | 'featured' | 'breaking'
type SortMode = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'question_count_desc' | 'question_count_asc'

export default function AdminQuestionTopicsPage() {
  const { user } = useAuth()
  const { isAdmin, isLoading: adminLoading, error: adminError } = useAdminAccess()
  const { toast } = useToast()
  
  // Data state
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // AI Processing state
  const [aiJobs, setAiJobs] = useState<AIProcessingJob[]>([])
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic'>('anthropic')
  const [processingType, setProcessingType] = useState<'optimization' | 'key_takeaways'>('key_takeaways')

  // Since middleware protects admin routes, we can assume user is admin if they reach this page
  useEffect(() => {
    if (user && isAdmin) {
      console.log(`✅ Admin user ${user.email} accessed question topics admin`)
    }
  }, [user, isAdmin])

  // Load data
  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Starting admin question topics data load...')
      
      // Create supabase client instance
      const supabase = createClient()
      
      // Load topics and question counts in parallel for better performance
      console.log('📊 Fetching topics and questions data...')
      
      // Simplified approach: Load topics first, then questions separately
      const topicsResult = await supabase
        .from('question_topics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000) // Explicit limit for safety

      const { data: topicsData, error: topicsError } = topicsResult

      console.log('📋 Topics result:', { 
        data: topicsData?.length, 
        error: topicsError 
      })

      if (topicsError) {
        console.error('❌ Topics error:', topicsError)
        throw new Error(`Failed to load topics: ${topicsError.message || 'Unknown database error'}`)
      }

      // Now load questions data with better error handling
      let questionsData: any[] = []
      let totalQuestionsCountValue = 0
      
      try {
        // Try to get question counts per topic
        const questionsResult = await supabase
          .from('questions')
          .select('topic_id')
          .limit(50000) // Explicit high limit to avoid truncation

        if (questionsResult.error) {
          console.warn('⚠️ Questions query error:', {
            message: questionsResult.error.message,
            details: questionsResult.error.details,
            hint: questionsResult.error.hint,
            code: questionsResult.error.code
          })
        } else {
          questionsData = questionsResult.data || []
          console.log('✅ Questions data loaded:', questionsData.length, 'records')
        }

        // Try to get total questions count
        const totalCountResult = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })

        if (totalCountResult.error) {
          console.warn('⚠️ Total count query error:', {
            message: totalCountResult.error.message,
            details: totalCountResult.error.details,
            hint: totalCountResult.error.hint,
            code: totalCountResult.error.code
          })
        } else {
          totalQuestionsCountValue = totalCountResult.count || 0
          console.log('✅ Total questions count:', totalQuestionsCountValue)
        }

      } catch (questionsError) {
        console.warn('⚠️ Questions data loading failed (non-critical):', {
          error: questionsError,
          message: questionsError instanceof Error ? questionsError.message : 'Unknown error',
          stack: questionsError instanceof Error ? questionsError.stack : undefined
        })
        // Continue without question counts - this is non-critical
      }

      // Calculate question counts per topic
      const questionCounts: Record<string, number> = {}
      if (questionsData && Array.isArray(questionsData)) {
        questionsData.forEach((question: any) => {
          if (question.topic_id) {
            questionCounts[question.topic_id] = (questionCounts[question.topic_id] || 0) + 1
          }
        })
        console.log('📊 Question counts calculated:', Object.keys(questionCounts).length, 'topics have questions')
      } else {
        console.log('⚠️ No questions data available - will show topics without question counts')
      }

      // Process topics data with question counts
      const processedTopics = (topicsData || []).map((topic: any) => ({
        ...topic,
        categories: Array.isArray(topic.categories) ? topic.categories : [],
        question_count: questionCounts[topic.topic_id] || 0,
        has_questions: (questionCounts[topic.topic_id] || 0) > 0
      }))

      console.log('✅ Processed topics:', processedTopics.length)
      setTopics(processedTopics)

      // Calculate stats
      const totalTopics = processedTopics.length
      const topicsWithQuestions = processedTopics.filter((t: any) => t.has_questions).length
      const topicsWithoutQuestions = totalTopics - topicsWithQuestions
      const topicsWithKeyTakeaways = processedTopics.filter((t: any) => t.key_takeaways).length
      
      // Use actual total count if available, otherwise sum from topics
      const totalQuestions = totalQuestionsCountValue || 
        processedTopics.reduce((sum: number, t: any) => sum + (t.question_count || 0), 0)
      
      const avgQuestionsPerTopic = totalTopics > 0 ? totalQuestions / totalTopics : 0

      // Category counts
      const categoryCounts: Record<string, number> = {}
      processedTopics.forEach((topic: any) => {
        if (Array.isArray(topic.categories)) {
          topic.categories.forEach((category: string) => {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1
          })
        }
      })

      const calculatedStats = {
        totalTopics,
        topicsWithQuestions,
        topicsWithoutQuestions,
        topicsWithKeyTakeaways,
        totalQuestions,
        avgQuestionsPerTopic,
        categoryCounts
      }

      console.log('📈 Calculated stats:', calculatedStats)
      setStats(calculatedStats)

      // Alert if we hit limits
      if (topicsData && topicsData.length >= 1000) {
        console.warn('⚠️ Topics may be truncated at 1000 limit')
        toast({
          title: "Data Notice",
          description: "Showing first 1000 topics. Use filters to narrow results.",
          variant: "default"
        })
      }

      if (totalQuestions === 1000) {
        console.warn('⚠️ Questions count may be capped at 1000')
        toast({
          title: "Questions Count Notice", 
          description: "Questions count may be limited. Actual count could be higher.",
          variant: "default"
        })
      }

      console.log('✅ Data loading completed successfully')

    } catch (error) {
      console.error('💥 Critical error loading data:', error)
      
      // Show detailed error information
      let errorMessage = 'Unknown error occurred'
      let errorDetails = ''
      
      if (error instanceof Error) {
        errorMessage = error.message
        errorDetails = error.stack || ''
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      } else {
        errorMessage = String(error)
      }
      
      setError(errorMessage)
      
      toast({
        title: "Data Loading Error",
        description: `${errorMessage}${errorDetails ? ` - ${errorDetails.split('\n')[0]}` : ''}`,
        variant: "destructive"
      })
      
      // Set empty state so UI doesn't crash
      setTopics([])
      setStats({
        totalTopics: 0,
        topicsWithQuestions: 0,
        topicsWithoutQuestions: 0,
        topicsWithKeyTakeaways: 0,
        totalQuestions: 0,
        avgQuestionsPerTopic: 0,
        categoryCounts: {}
      })
    } finally {
      setIsLoading(false)
      console.log('🏁 Data loading process finished')
    }
  }

  // Filter and sort topics
  const filteredAndSortedTopics = useMemo(() => {
    let filtered = topics

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(topic => 
        topic.topic_title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.topic_id.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(topic => 
        topic.categories.includes(selectedCategory)
      )
    }

    // Apply filter mode
    switch (filterMode) {
      case 'with_questions':
        filtered = filtered.filter(topic => topic.has_questions)
        break
      case 'without_questions':
        filtered = filtered.filter(topic => !topic.has_questions)
        break
      case 'with_key_takeaways':
        filtered = filtered.filter(topic => topic.key_takeaways)
        break
      case 'without_key_takeaways':
        filtered = filtered.filter(topic => !topic.key_takeaways)
        break
      case 'featured':
        filtered = filtered.filter(topic => topic.is_featured)
        break
      case 'breaking':
        filtered = filtered.filter(topic => topic.is_breaking)
        break
    }

    // Apply sorting
    switch (sortMode) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'title_asc':
        filtered.sort((a, b) => a.topic_title.localeCompare(b.topic_title))
        break
      case 'title_desc':
        filtered.sort((a, b) => b.topic_title.localeCompare(a.topic_title))
        break
      case 'question_count_desc':
        filtered.sort((a, b) => (b.question_count || 0) - (a.question_count || 0))
        break
      case 'question_count_asc':
        filtered.sort((a, b) => (a.question_count || 0) - (b.question_count || 0))
        break
    }

    return filtered
  }, [topics, searchQuery, selectedCategory, filterMode, sortMode])

  // AI Processing functions
  const startAIProcessing = async () => {
    if (selectedTopics.length === 0) {
      toast({
        title: "No Topics Selected",
        description: "Please select at least one topic to process",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/admin/question-topics/ai-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicIds: selectedTopics,
          provider: aiProvider,
          type: processingType
        })
      })

      if (!response.ok) throw new Error('Failed to start AI processing')

      const job = await response.json()
      setAiJobs(prev => [...prev, job])
      
      toast({
        title: "AI Processing Started",
        description: `Processing ${selectedTopics.length} topics with ${aiProvider}`,
      })

      setShowAiDialog(false)
      setSelectedTopics([])
    } catch (error) {
      console.error('Error starting AI processing:', error)
      toast({
        title: "Error",
        description: "Failed to start AI processing",
        variant: "destructive"
      })
    }
  }

  // Batch operation functions
  const handleBatchActivate = async () => {
    if (selectedTopics.length === 0) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('question_topics')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .in('id', selectedTopics)

      if (error) throw error

      toast({
        title: "Success",
        description: `Activated ${selectedTopics.length} topics`
      })
      
      await loadData()
      setSelectedTopics([])
    } catch (error) {
      console.error('Batch activate error:', error)
      toast({
        title: "Error",
        description: "Failed to activate topics",
        variant: "destructive"
      })
    }
  }

  const handleBatchDeactivate = async () => {
    if (selectedTopics.length === 0) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('question_topics')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('id', selectedTopics)

      if (error) throw error

      toast({
        title: "Success", 
        description: `Deactivated ${selectedTopics.length} topics`
      })
      
      await loadData()
      setSelectedTopics([])
    } catch (error) {
      console.error('Batch deactivate error:', error)
      toast({
        title: "Error",
        description: "Failed to deactivate topics",
        variant: "destructive"
      })
    }
  }

  const handleBatchFeature = async () => {
    if (selectedTopics.length === 0) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('question_topics')
        .update({ is_featured: true, updated_at: new Date().toISOString() })
        .in('id', selectedTopics)

      if (error) throw error

      toast({
        title: "Success",
        description: `Featured ${selectedTopics.length} topics`
      })
      
      await loadData()
      setSelectedTopics([])
    } catch (error) {
      console.error('Batch feature error:', error)
      toast({
        title: "Error", 
        description: "Failed to feature topics",
        variant: "destructive"
      })
    }
  }

  const handleBatchUnfeature = async () => {
    if (selectedTopics.length === 0) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('question_topics')
        .update({ is_featured: false, updated_at: new Date().toISOString() })
        .in('id', selectedTopics)

      if (error) throw error

      toast({
        title: "Success",
        description: `Unfeatured ${selectedTopics.length} topics`
      })
      
      await loadData()
      setSelectedTopics([])
    } catch (error) {
      console.error('Batch unfeature error:', error)
      toast({
        title: "Error",
        description: "Failed to unfeature topics", 
        variant: "destructive"
      })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedTopics.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedTopics.length} topics? This action cannot be undone.`)) {
      return
    }
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('question_topics')
        .delete()
        .in('id', selectedTopics)

      if (error) throw error

      toast({
        title: "Success",
        description: `Deleted ${selectedTopics.length} topics`
      })
      
      await loadData()
      setSelectedTopics([])
    } catch (error) {
      console.error('Batch delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete topics",
        variant: "destructive"
      })
    }
  }

  const handleExportSelected = () => {
    if (selectedTopics.length === 0) return
    
    const selectedTopicsData = topics.filter(topic => selectedTopics.includes(topic.id))
    const jsonData = JSON.stringify(selectedTopicsData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `topics-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Success",
      description: `Exported ${selectedTopics.length} topics`
    })
  }

  // Get unique categories
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()
    topics.forEach(topic => {
      topic.categories.forEach(cat => categories.add(cat))
    })
    return Array.from(categories).sort()
  }, [topics])

  // Loading state
  if (isLoading || adminLoading || !stats || (!isAdmin && !adminError)) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading question topics...</p>
        </div>
      </div>
    )
  }

  // Access denied state
  if (!isAdmin && adminError) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-medium text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">You don't have permission to access this admin area.</p>
          <p className="text-sm text-red-600 dark:text-red-400">{adminError}</p>
        </div>
      </div>
    )
  }

  // Error state with retry
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-medium text-slate-900 dark:text-white">Failed to Load Data</h2>
          <p className="text-slate-600 dark:text-slate-400">There was an error loading the question topics data.</p>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={loadData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

      return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <main className="w-full py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                  Question Topics Management
                </h1>
              </div>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-light">
                Manage and optimize civic education question topics with AI-powered tools
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Batch Operations Dropdown */}
              {selectedTopics.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreVertical className="h-4 w-4 mr-2" />
                      Batch Actions ({selectedTopics.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleBatchActivate}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBatchDeactivate}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Deactivate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBatchFeature}>
                      <Star className="h-4 w-4 mr-2" />
                      Feature
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBatchUnfeature}>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Unfeature
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportSelected}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleBatchDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button 
                onClick={() => setShowAiDialog(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={selectedTopics.length === 0}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Processing ({selectedTopics.length})
              </Button>
              <Button asChild>
                <Link href="/admin/question-topics/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Topic
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-slate-900 dark:text-white">
                  {stats.totalTopics}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Total Topics</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-green-600 dark:text-green-400">
                  {stats.topicsWithQuestions}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">With Questions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-red-600 dark:text-red-400">
                  {stats.topicsWithoutQuestions}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Without Questions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-blue-600 dark:text-blue-400">
                  {stats.topicsWithKeyTakeaways}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">With Takeaways</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-purple-600 dark:text-purple-400">
                  {stats.totalQuestions}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Total Questions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-light text-orange-600 dark:text-orange-400">
                  {stats.avgQuestionsPerTopic.toFixed(1)}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Avg per Topic</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category} ({stats.categoryCounts[category] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter Mode */}
              <Select value={filterMode} onValueChange={(value: FilterMode) => setFilterMode(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  <SelectItem value="with_questions">With Questions</SelectItem>
                  <SelectItem value="without_questions">Without Questions</SelectItem>
                  <SelectItem value="with_key_takeaways">With Key Takeaways</SelectItem>
                  <SelectItem value="without_key_takeaways">Without Key Takeaways</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="breaking">Breaking News</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort Mode */}
              <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title_asc">Title A-Z</SelectItem>
                  <SelectItem value="title_desc">Title Z-A</SelectItem>
                  <SelectItem value="question_count_desc">Most Questions</SelectItem>
                  <SelectItem value="question_count_asc">Least Questions</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8"
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                  className="h-8"
                >
                  Compact
                </Button>
              </div>

              <Button
                onClick={loadData}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Active AI Jobs */}
          {aiJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI Processing Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiJobs.map(job => (
                    <div key={job.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                            {job.status}
                          </Badge>
                          <span className="text-sm font-medium">{job.type}</span>
                          <span className="text-sm text-slate-500">via {job.provider}</span>
                        </div>
                        {job.status === 'running' && (
                          <Progress value={job.progress} className="mt-2" />
                        )}
                        {job.cost && (
                          <span className="text-xs text-slate-500">Cost: ${job.cost.toFixed(4)}</span>
                        )}
                      </div>
                      {job.error && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Topics Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Topics ({filteredAndSortedTopics.length})
              </h2>
              {selectedTopics.length > 0 && (
                <Badge variant="secondary">
                  {selectedTopics.length} selected
                </Badge>
              )}
            </div>

            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedTopics.map(topic => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isSelected={selectedTopics.includes(topic.id)}
                    onSelectionChange={(selected) => {
                      if (selected) {
                        setSelectedTopics(prev => [...prev, topic.id])
                      } else {
                        setSelectedTopics(prev => prev.filter(id => id !== topic.id))
                      }
                    }}
                  />
                ))}
              </div>
            )}

            {viewMode === 'table' && (
              <TopicsTable
                topics={filteredAndSortedTopics}
                selectedTopics={selectedTopics}
                onSelectionChange={setSelectedTopics}
              />
            )}

            {viewMode === 'compact' && (
              <TopicsCompactList
                topics={filteredAndSortedTopics}
                selectedTopics={selectedTopics}
                onSelectionChange={setSelectedTopics}
              />
            )}
          </div>

          {/* AI Processing Dialog */}
          <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Processing Options</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Selected {selectedTopics.length} topics for AI processing
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Processing Type</label>
                    <Select value={processingType} onValueChange={(value: 'optimization' | 'key_takeaways') => setProcessingType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="key_takeaways">Generate Key Takeaways</SelectItem>
                        <SelectItem value="optimization">Optimize Content Quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">AI Provider</label>
                    <Select value={aiProvider} onValueChange={(value: 'openai' | 'anthropic') => setAiProvider(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                        <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    AI processing costs will be tracked and displayed. Estimated cost: $0.50-$2.00 per topic depending on complexity.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAiDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={startAIProcessing}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Processing
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}

// Topic Card Component
function TopicCard({ 
  topic, 
  isSelected, 
  onSelectionChange 
}: { 
  topic: QuestionTopic
  isSelected: boolean
  onSelectionChange: (selected: boolean) => void
}) {
  return (
    <Card className={cn(
      "cursor-pointer transition-all duration-200 hover:shadow-lg",
      isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange(e.target.checked)}
              className="rounded border-slate-300"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-2xl">{topic.emoji}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-slate-900 dark:text-white truncate">
                {topic.topic_title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {topic.topic_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {topic.is_featured && <Badge variant="default" className="text-xs">Featured</Badge>}
            {topic.is_breaking && <Badge variant="destructive" className="text-xs">Breaking</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {topic.description}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {topic.categories.slice(0, 3).map(category => (
            <Badge key={category} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
          {topic.categories.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{topic.categories.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {topic.question_count || 0} questions
            </span>
            {topic.key_takeaways && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                Key takeaways
              </span>
            )}
          </div>
          <span>{new Date(topic.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/admin/question-topics/${topic.topic_id}`}>
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Topics Table Component
function TopicsTable({ 
  topics, 
  selectedTopics, 
  onSelectionChange 
}: { 
  topics: QuestionTopic[]
  selectedTopics: string[]
  onSelectionChange: (selected: string[]) => void
}) {
  const toggleAll = () => {
    if (selectedTopics.length === topics.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(topics.map(t => t.id))
    }
  }

  const toggleTopic = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      onSelectionChange(selectedTopics.filter(id => id !== topicId))
    } else {
      onSelectionChange([...selectedTopics, topicId])
    }
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            <th className="text-left p-4 font-medium">
              <input
                type="checkbox"
                checked={selectedTopics.length === topics.length && topics.length > 0}
                onChange={toggleAll}
                className="rounded border-slate-300"
              />
            </th>
            <th className="text-left p-4 font-medium">Topic</th>
            <th className="text-left p-4 font-medium">Categories</th>
            <th className="text-left p-4 font-medium">Questions</th>
            <th className="text-left p-4 font-medium">Status</th>
            <th className="text-left p-4 font-medium">Created</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic, index) => (
            <tr 
              key={topic.id} 
              className={cn(
                "border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900",
                selectedTopics.includes(topic.id) && "bg-blue-50 dark:bg-blue-950/20"
              )}
            >
              <td className="p-4">
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic.id)}
                  onChange={() => toggleTopic(topic.id)}
                  className="rounded border-slate-300"
                />
              </td>
              <td className="p-4">
                <Link href={`/admin/question-topics/${topic.topic_id}`} className="block">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{topic.emoji}</span>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white hover:text-blue-600 transition-colors">
                        {topic.topic_title}
                      </div>
                      <div className="text-sm text-slate-500">{topic.topic_id}</div>
                    </div>
                  </div>
                </Link>
              </td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {topic.categories.slice(0, 2).map(category => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {topic.categories.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{topic.categories.length - 2}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{topic.question_count || 0}</span>
                  {topic.has_questions ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </td>
              <td className="p-4">
                <div className="flex flex-col gap-1">
                  {topic.is_featured && <Badge variant="default" className="text-xs w-fit">Featured</Badge>}
                  {topic.is_breaking && <Badge variant="destructive" className="text-xs w-fit">Breaking</Badge>}
                  {topic.key_takeaways && <Badge variant="outline" className="text-xs w-fit">Key Takeaways</Badge>}
                  {!topic.is_active && <Badge variant="secondary" className="text-xs w-fit">Inactive</Badge>}
                </div>
              </td>
              <td className="p-4 text-sm text-slate-500">
                {new Date(topic.created_at).toLocaleDateString()}
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/question-topics/${topic.topic_id}`}>
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Topics Compact List Component
function TopicsCompactList({ 
  topics, 
  selectedTopics, 
  onSelectionChange 
}: { 
  topics: QuestionTopic[]
  selectedTopics: string[]
  onSelectionChange: (selected: string[]) => void
}) {
  const toggleTopic = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      onSelectionChange(selectedTopics.filter(id => id !== topicId))
    } else {
      onSelectionChange([...selectedTopics, topicId])
    }
  }

  return (
    <div className="space-y-2">
      {topics.map(topic => (
        <div 
          key={topic.id}
          className={cn(
            "flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors",
            selectedTopics.includes(topic.id) && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
          )}
        >
          <input
            type="checkbox"
            checked={selectedTopics.includes(topic.id)}
            onChange={() => toggleTopic(topic.id)}
            className="rounded border-slate-300"
          />
          
          <span className="text-xl">{topic.emoji}</span>
          
          <Link href={`/admin/question-topics/${topic.topic_id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-slate-900 dark:text-white truncate hover:text-blue-600 transition-colors">
                {topic.topic_title}
              </h3>
              {topic.is_featured && <Badge variant="default" className="text-xs">Featured</Badge>}
              {topic.is_breaking && <Badge variant="destructive" className="text-xs">Breaking</Badge>}
            </div>
            <p className="text-sm text-slate-500 truncate">{topic.description}</p>
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{topic.question_count || 0} questions</span>
            {topic.key_takeaways && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span>{new Date(topic.created_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/question-topics/${topic.topic_id}`}>
                <Eye className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
} 