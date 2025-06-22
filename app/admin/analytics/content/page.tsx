"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Star,
  Clock,
  Users,
  Calendar,
  MessageSquare,
  Brain,
  Award,
  Eye,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  Globe,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ContentMetrics {
  topics: {
    total: number
    active: number
    avg_completion_rate: number
    avg_score: number
    total_attempts: number
    quality_score: number
  }
  quizzes: {
    total_attempts: number
    avg_score: number
    completion_rate: number
    popular_topics: Array<{
      topic_id: string
      title: string
      attempts: number
      avg_score: number
    }>
  }
  surveys: {
    total: number
    active: number
    response_rate: number
    completion_rate: number
    avg_response_time: number
  }
  events: {
    total_submitted: number
    approved: number
    pending: number
    rejected: number
    approval_rate: number
  }
  scenarios: {
    total: number
    active: number
    completion_rate: number
    avg_rating: number
  }
}

interface TopicPerformance {
  topic_id: string
  title: string
  emoji: string
  attempts: number
  avg_score: number
  completion_rate: number
  quality_score: number
  last_updated: string
  status: 'active' | 'draft' | 'archived'
}

interface ContentTrend {
  date: string
  quiz_attempts: number
  survey_responses: number
  event_submissions: number
  avg_score: number
}

const timeRanges = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' }
]

export default function ContentAnalytics() {
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null)
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockMetrics: ContentMetrics = {
        topics: {
          total: 45,
          active: 42,
          avg_completion_rate: 78,
          avg_score: 82,
          total_attempts: 12847,
          quality_score: 88
        },
        quizzes: {
          total_attempts: 12847,
          avg_score: 82,
          completion_rate: 78,
          popular_topics: [
            { topic_id: 'constitutional-rights', title: 'Constitutional Rights', attempts: 1247, avg_score: 85 },
            { topic_id: 'voting-process', title: 'Voting Process', attempts: 982, avg_score: 79 },
            { topic_id: 'local-government', title: 'Local Government', attempts: 856, avg_score: 81 },
            { topic_id: 'federal-structure', title: 'Federal Structure', attempts: 743, avg_score: 77 },
            { topic_id: 'civic-responsibilities', title: 'Civic Responsibilities', attempts: 689, avg_score: 83 }
          ]
        },
        surveys: {
          total: 12,
          active: 8,
          response_rate: 67,
          completion_rate: 84,
          avg_response_time: 4.2
        },
        events: {
          total_submitted: 156,
          approved: 134,
          pending: 18,
          rejected: 4,
          approval_rate: 86
        },
        scenarios: {
          total: 8,
          active: 6,
          completion_rate: 72,
          avg_rating: 4.3
        }
      }

      const mockTopicPerformance: TopicPerformance[] = [
        {
          topic_id: 'constitutional-rights',
          title: 'Constitutional Rights',
          emoji: '⚖️',
          attempts: 1247,
          avg_score: 85,
          completion_rate: 89,
          quality_score: 92,
          last_updated: '2024-01-15T10:30:00Z',
          status: 'active'
        },
        {
          topic_id: 'voting-process',
          title: 'Voting Process',
          emoji: '🗳️',
          attempts: 982,
          avg_score: 79,
          completion_rate: 82,
          quality_score: 87,
          last_updated: '2024-01-14T14:20:00Z',
          status: 'active'
        },
        {
          topic_id: 'local-government',
          title: 'Local Government',
          emoji: '🏛️',
          attempts: 856,
          avg_score: 81,
          completion_rate: 75,
          quality_score: 85,
          last_updated: '2024-01-13T09:15:00Z',
          status: 'active'
        },
        {
          topic_id: 'federal-structure',
          title: 'Federal Structure',
          emoji: '🇺🇸',
          attempts: 743,
          avg_score: 77,
          completion_rate: 73,
          quality_score: 83,
          last_updated: '2024-01-12T16:45:00Z',
          status: 'active'
        },
        {
          topic_id: 'civic-responsibilities',
          title: 'Civic Responsibilities',
          emoji: '🤝',
          attempts: 689,
          avg_score: 83,
          completion_rate: 80,
          quality_score: 89,
          last_updated: '2024-01-11T11:30:00Z',
          status: 'active'
        }
      ]

      setMetrics(mockMetrics)
      setTopicPerformance(mockTopicPerformance)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Excellent</Badge>
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Good</Badge>
    if (score >= 70) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Fair</Badge>
    return <Badge className="bg-red-100 text-red-700 border-red-200">Needs Work</Badge>
  }

  const getTrendIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) return <ArrowUp className="h-3 w-3 text-emerald-600" />
    if (value < threshold) return <ArrowDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-slate-500" />
  }

  const categories = [
    { value: 'all', label: 'All Content', icon: FileText },
    { value: 'topics', label: 'Topics', icon: Target },
    { value: 'surveys', label: 'Surveys', icon: MessageSquare },
    { value: 'events', label: 'Events', icon: Calendar }
  ]

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-5 w-96 bg-slate-200 rounded animate-pulse"></div>
        </div>
        
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-20 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Content Analytics
          </h1>
          <p className="text-slate-600">
            Monitor content performance and engagement metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className={cn(
              "flex items-center space-x-2",
              selectedCategory === category.value 
                ? "bg-slate-900 text-white" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <category.icon className="h-4 w-4" />
            <span>{category.label}</span>
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Topics</CardTitle>
                <Target className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {metrics.topics.total}
                </div>
                <div className="flex items-center text-xs text-emerald-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {metrics.topics.active} active
                </div>
                <Progress value={(metrics.topics.active / metrics.topics.total) * 100} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Quiz Attempts</CardTitle>
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {metrics.quizzes.total_attempts.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-blue-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {metrics.quizzes.avg_score}% avg score
                </div>
                <Progress value={metrics.quizzes.completion_rate} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Quality Score</CardTitle>
                <Star className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {metrics.topics.quality_score}%
                </div>
                <div className="flex items-center text-xs text-emerald-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  High quality
                </div>
                <Progress value={metrics.topics.quality_score} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Events</CardTitle>
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {metrics.events.total_submitted}
                </div>
                <div className="flex items-center text-xs text-amber-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {metrics.events.pending} pending
                </div>
                <Progress value={metrics.events.approval_rate} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Topic Performance */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Top Performing Topics</CardTitle>
              <CardDescription>Content engagement and learning outcomes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/question-topics">
                View All Topics
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topicPerformance.slice(0, 5).map((topic, index) => (
              <div key={topic.topic_id} className="flex items-center space-x-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-xs font-medium text-slate-500 w-6">
                    #{index + 1}
                  </div>
                  <span className="text-2xl">{topic.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{topic.title}</h4>
                    <p className="text-xs text-slate-500">
                      {topic.attempts.toLocaleString()} attempts • Updated {format(new Date(topic.last_updated), 'MMM d')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{topic.avg_score}%</div>
                    <div className="text-xs text-slate-500">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{topic.completion_rate}%</div>
                    <div className="text-xs text-slate-500">Complete</div>
                  </div>
                  <div className="text-center">
                    {getPerformanceBadge(topic.quality_score)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Breakdown */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Survey Performance */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Survey Performance</CardTitle>
              <CardDescription>Response rates and completion metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-2xl font-semibold text-slate-900">
                    {metrics.surveys.total}
                  </div>
                  <div className="text-xs text-slate-500">Total Surveys</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-semibold text-slate-900">
                    {metrics.surveys.response_rate}%
                  </div>
                  <div className="text-xs text-slate-500">Response Rate</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Completion Rate</span>
                  <span className="font-medium">{metrics.surveys.completion_rate}%</span>
                </div>
                <Progress value={metrics.surveys.completion_rate} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Avg Response Time</span>
                <span className="font-medium">{metrics.surveys.avg_response_time} min</span>
              </div>
            </CardContent>
          </Card>

          {/* Event Submissions */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Event Submissions</CardTitle>
              <CardDescription>User-generated content moderation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-2xl font-semibold text-slate-900">
                    {metrics.events.total_submitted}
                  </div>
                  <div className="text-xs text-slate-500">Total Submitted</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-semibold text-slate-900">
                    {metrics.events.approval_rate}%
                  </div>
                  <div className="text-xs text-slate-500">Approval Rate</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Approved</span>
                  <Badge className="bg-emerald-100 text-emerald-700">{metrics.events.approved}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Pending Review</span>
                  <Badge className="bg-amber-100 text-amber-700">{metrics.events.pending}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Rejected</span>
                  <Badge className="bg-red-100 text-red-700">{metrics.events.rejected}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 
