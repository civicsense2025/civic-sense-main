"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useAdmin } from "@/lib/admin-access"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  Calendar, 
  Tag, 
  BookOpen, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  BarChart,
  Zap,
  Target,
  FileText,
  Globe,
  Brain,
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Timer,
  UserCheck,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface Question {
  id: string
  topic_id: string
  question_number: number
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  category: string
  question: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_answer: string
  hint?: string
  explanation: string
  tags: string[]
  sources: any[]
  difficulty_level: number
  is_active: boolean
  created_at: string
  updated_at: string
}

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
}

interface TopicStats {
  total_questions: number
  questions_by_type: Record<string, number>
  questions_by_difficulty: Record<string, number>
  avg_difficulty: number
  completion_rate: number
  avg_score: number
  total_attempts: number
  last_attempt: string | null
}

interface TopicAnalytics {
  total_attempts: number
  unique_users: number
  completion_rate: number
  avg_score: number
  avg_time_spent: number
  question_performance: Array<{
    question_id: string
    question_number: number
    question_text: string
    category: string
    difficulty_level: number
    total_responses: number
    correct_responses: number
    accuracy_rate: number
    avg_response_time: number
    common_wrong_answers: Array<{ answer: string; count: number }>
  }>
  daily_attempts: Array<{
    date: string
    attempts: number
    avg_score: number
    completion_rate: number
  }>
  user_patterns: {
    repeat_takers: number
    avg_attempts_per_user: number
    improvement_rate: number
  }
  category_performance: Record<string, {
    total_questions: number
    avg_accuracy: number
    avg_time: number
  }>
  difficulty_analysis: Record<string, {
    question_count: number
    avg_accuracy: number
    avg_time: number
    completion_rate: number
  }>
  recent_activity: Array<{
    user_id: string
    score: number
    completed_at: string
    time_spent: number
  }>
}

export default function TopicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const { toast } = useToast()
  
  const [topic, setTopic] = useState<QuestionTopic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<TopicStats | null>(null)
  const [analytics, setAnalytics] = useState<TopicAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editedTopic, setEditedTopic] = useState<Partial<QuestionTopic>>({})

  const topicId = params.topicId as string

  useEffect(() => {
    if (isAdmin && topicId) {
      loadTopicData()
      loadAnalyticsData()
    }
  }, [isAdmin, topicId])

  const loadTopicData = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Load topic details
      const { data: topicData, error: topicError } = await supabase
        .from('question_topics')
        .select('*')
        .eq('topic_id', topicId)
        .maybeSingle()

      if (topicError) throw new Error(`Failed to load topic: ${topicError.message}`)
      if (!topicData) throw new Error(`Topic with ID "${topicId}" not found`)

      // Load questions with explicit limit and better error handling
      console.log(`🔍 Loading questions for topic: ${topicId}`)
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_active', true) // Only load active questions
        .order('question_number', { ascending: true })
        .limit(1000) // Explicit limit

      if (questionsError) {
        console.error('❌ Error loading questions:', questionsError)
        toast({
          title: "Warning",
          description: `Could not load questions: ${questionsError.message}`,
          variant: "default"
        })
      } else {
        console.log(`✅ Loaded ${questionsData?.length || 0} questions for topic ${topicId}`)
      }

      // Calculate stats
      const totalQuestions = questionsData?.length || 0
      const questionsByType = questionsData?.reduce((acc, q) => {
        acc[q.question_type] = (acc[q.question_type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const questionsByDifficulty = questionsData?.reduce((acc, q) => {
        const level = q.difficulty_level.toString()
        acc[level] = (acc[level] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const avgDifficulty = questionsData?.length 
        ? questionsData.reduce((sum, q) => sum + q.difficulty_level, 0) / questionsData.length
        : 0

      setTopic(topicData)
      setQuestions(questionsData || [])
      setStats({
        total_questions: totalQuestions,
        questions_by_type: questionsByType,
        questions_by_difficulty: questionsByDifficulty,
        avg_difficulty: avgDifficulty,
        completion_rate: 0, // TODO: Get from analytics
        avg_score: 0, // TODO: Get from analytics
        total_attempts: 0, // TODO: Get from analytics
        last_attempt: null // TODO: Get from analytics
      })

    } catch (error) {
      console.error('Error loading topic data:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load topic",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      setIsAnalyticsLoading(true)
      const response = await fetch(`/api/admin/question-topics/${topicId}/analytics?days=30`)
      
      if (response.ok) {
        const analyticsData = await response.json()
        setAnalytics(analyticsData)
        
        // Update stats with real analytics data
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            completion_rate: analyticsData.completion_rate,
            avg_score: analyticsData.avg_score,
            total_attempts: analyticsData.total_attempts
          } : null)
        }
      } else {
        console.warn('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsAnalyticsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!topic || !editedTopic) return

    try {
      setIsSaving(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('question_topics')
        .update({
          ...editedTopic,
          updated_at: new Date().toISOString()
        })
        .eq('topic_id', topicId)

      if (error) throw new Error(`Failed to save: ${error.message}`)

      setTopic({ ...topic, ...editedTopic })
      setIsEditing(false)
      setEditedTopic({})

      toast({
        title: "Success",
        description: "Topic updated successfully"
      })

    } catch (error) {
      console.error('Error saving topic:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save topic",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedTopic({ ...topic })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedTopic({})
  }

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner'
      case 2: return 'Intermediate'
      case 3: return 'Advanced'
      case 4: return 'Expert'
      default: return 'Unknown'
    }
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-700'
      case 2: return 'bg-blue-100 text-blue-700'
      case 3: return 'bg-orange-100 text-orange-700'
      case 4: return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice'
      case 'true_false': return 'True/False'
      case 'short_answer': return 'Short Answer'
      default: return type
    }
  }

  if (isLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading topic details...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-medium text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">You don't have permission to access this admin area.</p>
        </div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
          <h2 className="text-xl font-medium text-slate-900 dark:text-white">Topic Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400">The requested topic could not be found.</p>
          <Button asChild>
            <Link href="/admin/question-topics">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Topics
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <main className="w-full py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/admin/question-topics">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Topics
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <span className="text-3xl">{topic.emoji}</span>
                <div>
                  <h1 className="text-2xl font-light text-slate-900 dark:text-white">
                    {topic.topic_title}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {topic.topic_id}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Topic
                </Button>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <Badge variant={topic.is_active ? "default" : "secondary"}>
              {topic.is_active ? "Active" : "Inactive"}
            </Badge>
            {topic.is_featured && (
              <Badge className="bg-purple-100 text-purple-700">Featured</Badge>
            )}
            {topic.is_breaking && (
              <Badge className="bg-red-100 text-red-700">Breaking News</Badge>
            )}
            {topic.date && (
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(topic.date), 'MMM d, yyyy')}
              </Badge>
            )}
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-light text-slate-900 dark:text-white">
                    {stats.total_questions}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Questions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-light text-blue-600 dark:text-blue-400">
                    {stats.avg_difficulty.toFixed(1)}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Avg Difficulty</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-light text-green-600 dark:text-green-400">
                    {stats.completion_rate}%
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Completion Rate</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-light text-purple-600 dark:text-purple-400">
                    {stats.total_attempts}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-light text-sm">Total Attempts</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview & Content</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            {/* Overview & Content Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Title</label>
                          <Input
                            value={editedTopic.topic_title || ''}
                            onChange={(e) => setEditedTopic(prev => ({ ...prev, topic_title: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Description</label>
                          <Textarea
                            value={editedTopic.description || ''}
                            onChange={(e) => setEditedTopic(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Emoji</label>
                          <Input
                            value={editedTopic.emoji || ''}
                            onChange={(e) => setEditedTopic(prev => ({ ...prev, emoji: e.target.value }))}
                            className="w-20"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Description</h4>
                          <p className="text-slate-600 dark:text-slate-400">{topic.description}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Why This Matters</h4>
                          <div className="text-slate-600 dark:text-slate-400" 
                               dangerouslySetInnerHTML={{ __html: topic.why_this_matters }} />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Categories & Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Categories & Content Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {topic.categories.map((category, index) => (
                          <Badge key={index} variant="secondary">
                            <Tag className="h-3 w-3 mr-1" />
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Question Statistics */}
                    <div className="space-y-3 border-t pt-4">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Question Statistics</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Total Questions</span>
                            <Badge variant="outline" className="font-medium">
                              {questions.length}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Active Questions</span>
                            <Badge className="bg-green-100 text-green-700 font-medium">
                              {questions.filter(q => q.is_active).length}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">With Sources</span>
                            <Badge variant="secondary" className="font-medium">
                              {questions.filter(q => q.sources && q.sources.length > 0).length}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">With Hints</span>
                            <Badge variant="secondary" className="font-medium">
                              {questions.filter(q => q.hint).length}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Avg Difficulty</span>
                            <Badge variant="outline" className="font-medium">
                              {stats?.avg_difficulty.toFixed(1) || '0.0'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Question Types</span>
                            <Badge variant="outline" className="font-medium">
                              {Object.keys(stats?.questions_by_type || {}).length}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Question Type Distribution */}
                      {stats && Object.keys(stats.questions_by_type).length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Type Distribution</span>
                          {Object.entries(stats.questions_by_type).map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-xs text-slate-600 dark:text-slate-400">{getTypeLabel(type)}</span>
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Difficulty Distribution */}
                      {stats && Object.keys(stats.questions_by_difficulty).length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty Distribution</span>
                          {Object.entries(stats.questions_by_difficulty).map(([level, count]) => (
                            <div key={level} className="flex justify-between items-center">
                              <span className="text-xs text-slate-600 dark:text-slate-400">{getDifficultyLabel(parseInt(level))}</span>
                              <Badge className={cn("text-xs", getDifficultyColor(parseInt(level)))}>
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Settings</h4>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Active</label>
                          <Switch
                            checked={editedTopic.is_active ?? topic.is_active}
                            onCheckedChange={(checked) => setEditedTopic(prev => ({ ...prev, is_active: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Featured</label>
                          <Switch
                            checked={editedTopic.is_featured ?? topic.is_featured}
                            onCheckedChange={(checked) => setEditedTopic(prev => ({ ...prev, is_featured: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Breaking News</label>
                          <Switch
                            checked={editedTopic.is_breaking ?? topic.is_breaking}
                            onCheckedChange={(checked) => setEditedTopic(prev => ({ ...prev, is_breaking: checked }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 border-t pt-4">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Status & Metadata</h4>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                          <Badge variant={topic.is_active ? "default" : "secondary"}>
                            {topic.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Day of Week</span>
                          <span className="text-sm">{topic.day_of_week || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Created</span>
                          <span className="text-sm">{format(new Date(topic.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {topic.updated_at && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Updated</span>
                            <span className="text-sm">{format(new Date(topic.updated_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Questions Section */}
              {questions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Questions Yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      This topic doesn't have any questions yet.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Questions List */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Questions ({questions.length})</CardTitle>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {questions.slice(0, 10).map((question) => (
                          <div key={question.id} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">
                                  #{question.question_number}
                                </Badge>
                                <Badge className={getDifficultyColor(question.difficulty_level)}>
                                  {getDifficultyLabel(question.difficulty_level)}
                                </Badge>
                                <Badge variant="secondary">
                                  {getTypeLabel(question.question_type)}
                                </Badge>
                                {!question.is_active && (
                                  <Badge variant="destructive">Inactive</Badge>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                              {question.question}
                            </h4>
                            
                            {question.question_type === 'multiple_choice' && (
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {[question.option_a, question.option_b, question.option_c, question.option_d].map((option, index) => (
                                  option && (
                                    <div key={index} className={cn(
                                      "text-sm p-2 rounded border",
                                      question.correct_answer === String.fromCharCode(97 + index) 
                                        ? "bg-green-50 border-green-200 text-green-800" 
                                        : "bg-slate-50 border-slate-200"
                                    )}>
                                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Category: {question.category}</span>
                              <span>Updated: {format(new Date(question.updated_at), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        ))}
                        {questions.length > 10 && (
                          <div className="text-center pt-4">
                            <Button variant="outline">
                              View All {questions.length} Questions
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Key Takeaways */}
              {topic.key_takeaways && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Takeaways</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
                      {JSON.stringify(topic.key_takeaways, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>



            {/* Metadata Tab */}
            <TabsContent value="metadata" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(topic, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {isAnalyticsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading analytics data...</p>
                </div>
              ) : analytics ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Attempts</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {analytics.total_attempts.toLocaleString()}
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Unique Users</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {analytics.unique_users.toLocaleString()}
                            </p>
                          </div>
                          <UserCheck className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Avg Score</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {analytics.avg_score.toFixed(1)}%
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              {analytics.completion_rate.toFixed(1)}%
                            </p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Daily Activity Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Daily Activity (Last 30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-end justify-between gap-1">
                        {analytics.daily_attempts.map((day, index) => {
                          const maxAttempts = Math.max(...analytics.daily_attempts.map(d => d.attempts))
                          const height = maxAttempts > 0 ? (day.attempts / maxAttempts) * 200 : 0
                          
                          return (
                            <div key={index} className="flex flex-col items-center flex-1">
                              <div 
                                className="bg-blue-500 hover:bg-blue-600 transition-colors w-full rounded-t cursor-pointer"
                                style={{ height: `${height}px` }}
                                title={`${day.attempts} attempts on ${day.date}`}
                              />
                              <span className="text-xs text-slate-500 mt-1">
                                {format(new Date(day.date), 'dd')}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Question Performance Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Question Performance Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.question_performance.slice(0, 10).map((question) => (
                          <div key={question.question_id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    Q{question.question_number}
                                  </Badge>
                                  <Badge className={getDifficultyColor(question.difficulty_level)}>
                                    {getDifficultyLabel(question.difficulty_level)}
                                  </Badge>
                                  <Badge variant="secondary">{question.category}</Badge>
                                </div>
                                <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2">
                                  {question.question_text}
                                </h4>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-lg font-bold text-slate-900 dark:text-white">
                                  {question.accuracy_rate.toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500">
                                  {question.total_responses} responses
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <span className="text-xs text-slate-600 dark:text-slate-400">Accuracy</span>
                                <Progress 
                                  value={question.accuracy_rate} 
                                  className="h-2 mt-1"
                                />
                              </div>
                              <div>
                                <span className="text-xs text-slate-600 dark:text-slate-400">Response Time</span>
                                <div className="text-sm font-medium">{question.avg_response_time.toFixed(1)}s</div>
                              </div>
                              <div>
                                <span className="text-xs text-slate-600 dark:text-slate-400">Common Wrong Answers</span>
                                <div className="text-xs">
                                  {question.common_wrong_answers.slice(0, 2).map((wrong, i) => (
                                    <div key={i} className="text-slate-500">
                                      "{wrong.answer}" ({wrong.count})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category & Difficulty Performance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Category Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(analytics.category_performance).map(([category, perf]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{category}</span>
                              <span className="font-medium">{perf.avg_accuracy.toFixed(1)}%</span>
                            </div>
                            <Progress value={perf.avg_accuracy} className="h-2" />
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>{perf.total_questions} questions</span>
                              <span>Avg: {perf.avg_time.toFixed(1)}s</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Difficulty Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(analytics.difficulty_analysis).map(([level, analysis]) => (
                          <div key={level} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{getDifficultyLabel(parseInt(level))}</span>
                              <span className="font-medium">{analysis.avg_accuracy.toFixed(1)}%</span>
                            </div>
                            <Progress value={analysis.avg_accuracy} className="h-2" />
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>{analysis.question_count} questions</span>
                              <span>{analysis.completion_rate.toFixed(1)}% completion</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* User Patterns & Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">User Patterns</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Repeat Takers</span>
                          <span className="font-medium">{analytics.user_patterns.repeat_takers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Avg Attempts/User</span>
                          <span className="font-medium">{analytics.user_patterns.avg_attempts_per_user.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Improvement Rate</span>
                          <span className="font-medium">{analytics.user_patterns.improvement_rate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Avg Time Spent</span>
                          <span className="font-medium">{Math.round(analytics.avg_time_spent / 60)}m</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analytics.recent_activity.slice(0, 5).map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">User {activity.user_id.slice(-8)}</div>
                                  <div className="text-xs text-slate-500">
                                    {format(new Date(activity.completed_at), 'MMM d, h:mm a')}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{activity.score}%</div>
                                <div className="text-xs text-slate-500">{Math.round(activity.time_spent / 60)}m</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BarChart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Analytics Data</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Analytics data will appear here once users start taking quizzes on this topic.
                    </p>
                    <Button variant="outline" onClick={() => loadAnalyticsData()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Analytics
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  )
} 