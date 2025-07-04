'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { 
  BarChart3, 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  Zap,
  Trophy,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  BookOpen,
  Award,
  Users,
  Eye,
  Lightbulb,
  Star,
  Calendar,
  Download,
  Share2,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LearningInsight {
  user_id: string
  analysis_timestamp: string
  cognitive_patterns: {
    processing_speed: {
      average_response_time: number
      fast_questions_percentage: number
      slow_questions_percentage: number
      speed_trend: 'improving' | 'declining' | 'stable'
      speed_distribution: Array<{ range: string; count: number; percentage: number }>
    }
    confidence_metrics: {
      quick_correct_percentage: number
      hesitation_index: number
      confidence_trend: 'improving' | 'declining' | 'stable'
      confidence_by_topic: Array<{ topic: string; confidence: number }>
    }
  }
  learning_trajectory: {
    current_level: {
      overall_score: number
      level_name: 'Novice' | 'Developing' | 'Proficient' | 'Advanced'
      percentile_rank: number
      areas_of_strength: string[]
      improvement_areas: string[]
    }
    growth_projection: {
      improvement_rate: number
      trend: 'improving' | 'declining' | 'stable'
      projected_score_in_30_days: number
      time_to_next_level: string
    }
    skill_breakdown: Array<{
      skill_area: string
      current_score: number
      target_score: number
      progress_percentage: number
      recent_trend: 'up' | 'down' | 'stable'
    }>
  }
  personalized_recommendations: {
    immediate_actions: Array<{
      priority: 'high' | 'medium' | 'low'
      action: string
      reason: string
      expected_impact: string
      confidence: number
      timeframe: string
    }>
    intervention_alerts: Array<{
      type: 'warning' | 'opportunity' | 'celebration'
      message: string
      suggested_action: string
      urgency: 'immediate' | 'this_week' | 'this_month'
    }>
  }
  performance_analytics: {
    total_questions_answered: number
    total_time_spent: number
    accuracy_by_topic: Array<{ topic: string; accuracy: number; question_count: number }>
    streak_analytics: { current_streak: number; longest_streak: number; streak_history: number[] }
  }
  comparative_analytics: {
    peer_comparison: {
      percentile_rank: number
      average_peer_score: number
      user_score: number
      performance_gap: number
    }
  }
  real_time_updates: {
    last_activity: string | null
    recent_improvements: string[]
    active_learning_session: boolean
  }
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
)

const TrendIcon = ({ trend }: { trend: 'improving' | 'declining' | 'stable' | 'up' | 'down' }) => {
  if (trend === 'up' || trend === 'improving') {
    return <ArrowUp className="h-4 w-4 text-green-600" />
  } else if (trend === 'down' || trend === 'declining') {
    return <ArrowDown className="h-4 w-4 text-red-600" />
  } else {
    return <Minus className="h-4 w-4 text-gray-600" />
  }
}

const LevelBadge = ({ level }: { level: string }) => {
  const colors = {
    'Novice': 'bg-red-100 text-red-800 border-red-200',
    'Developing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Proficient': 'bg-blue-100 text-blue-800 border-blue-200',
    'Advanced': 'bg-green-100 text-green-800 border-green-200'
  }
  
  return (
    <Badge className={`${colors[level as keyof typeof colors] || colors.Novice} border`}>
      {level}
    </Badge>
  )
}

// ============================================================================
// SPEED DISTRIBUTION CHART
// ============================================================================

function SpeedDistributionChart({ data }: { data: Array<{ range: string; count: number; percentage: number }> }) {
  const maxPercentage = Math.max(...data.map(d => d.percentage))
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Response Time Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((bucket, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{bucket.range}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{bucket.count} questions</span>
                  <span className="text-sm font-bold">{bucket.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${(bucket.percentage / maxPercentage) * 100}%`,
                    background: `linear-gradient(90deg, hsl(${220 + index * 20}, 70%, 50%) 0%, hsl(${220 + index * 20}, 70%, 60%) 100%)`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Speed Analysis Insights</h4>
          <p className="text-sm text-blue-700">
            {data[0]?.percentage > 40 
              ? "🚀 You're quick at recognizing familiar concepts! Consider challenging yourself with harder topics."
              : data[3]?.percentage > 30
              ? "🤔 You take time to think through complex questions - this shows careful consideration!"
              : "⚖️ You have a good balance between speed and thoughtfulness in your approach."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CONFIDENCE HEATMAP
// ============================================================================

function ConfidenceHeatmap({ data }: { data: Array<{ topic: string; confidence: number }> }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Confidence Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Answer questions across different topics to see your confidence levels</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'from-green-400 to-green-600'
    if (confidence >= 60) return 'from-yellow-400 to-yellow-600'
    if (confidence >= 40) return 'from-orange-400 to-orange-600'
    return 'from-red-400 to-red-600'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High'
    if (confidence >= 60) return 'Good'
    if (confidence >= 40) return 'Moderate'
    return 'Needs Work'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Confidence by Topic
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.slice(0, 8).map((item, index) => (
            <div 
              key={index} 
              className="group p-4 rounded-lg border-2 border-slate-100 hover:border-slate-200 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-800 truncate max-w-[120px]" title={item.topic}>
                  {item.topic}
                </h4>
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium"
                >
                  {getConfidenceLabel(item.confidence)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${getConfidenceColor(item.confidence)} transition-all duration-1000 ease-out`}
                    style={{ width: `${item.confidence}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Confidence</span>
                  <span className="text-sm font-bold text-slate-800">{item.confidence.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confidence Legend */}
        <div className="mt-6 p-3 bg-slate-50 rounded-lg">
          <h5 className="text-xs font-medium text-slate-600 mb-2">Confidence Levels</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded" />
              <span>High (80%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded" />
              <span>Good (60-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded" />
              <span>Moderate (40-59%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-600 rounded" />
              <span>Needs Work (&lt;40%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// ENHANCED ANALYTICS DASHBOARD PROPS
// ============================================================================

interface EnhancedWebDashboardProps {
  insights: LearningInsight
  onRefresh?: () => void
  isRefreshing?: boolean
}

// ============================================================================
// MAIN ENHANCED WEB DASHBOARD COMPONENT
// ============================================================================

export default function EnhancedWebDashboard({ 
  insights, 
  onRefresh, 
  isRefreshing = false 
}: EnhancedWebDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Real-time updates effect
  useEffect(() => {
    if (insights.real_time_updates.active_learning_session) {
      const interval = setInterval(() => {
        onRefresh?.()
      }, 30000) // Refresh every 30 seconds during active session

      return () => clearInterval(interval)
    }
  }, [insights.real_time_updates.active_learning_session, onRefresh])

  const handleExportData = () => {
    const dataStr = JSON.stringify(insights, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `civicsense-analytics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleShareProgress = async () => {
    const shareData = {
      title: 'My CivicSense Learning Progress',
      text: `I've answered ${insights.performance_analytics.total_questions_answered} civic education questions with ${insights.learning_trajectory.current_level.overall_score}% accuracy!`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      alert('Progress copied to clipboard!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Active Session Alert */}
      {insights.real_time_updates.active_learning_session && (
        <Alert className="border-green-200 bg-green-50">
          <Activity className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <span className="font-medium">Active learning session detected!</span> Your analytics are being updated in real-time.
            <Badge className="ml-2 bg-green-100 text-green-800">Live Updates</Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Achievements */}
      {insights.real_time_updates.recent_improvements.length > 0 && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Star className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.real_time_updates.recent_improvements.map((improvement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-yellow-100">
                  <Trophy className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <span className="text-sm text-yellow-800 font-medium">{improvement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Navigation */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="cognitive" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Cognitive</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 ml-4">
          <Button onClick={handleShareProgress} variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={onRefresh} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Overall Score</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {insights.learning_trajectory.current_level.overall_score}%
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendIcon trend={insights.learning_trajectory.growth_projection.trend} />
                      <span className="text-sm text-blue-600">
                        {insights.learning_trajectory.growth_projection.improvement_rate > 0 ? '+' : ''}
                        {insights.learning_trajectory.growth_projection.improvement_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Trophy className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Current Level</p>
                    <LevelBadge level={insights.learning_trajectory.current_level.level_name} />
                    <p className="text-sm text-green-600 mt-1">
                      {insights.learning_trajectory.current_level.percentile_rank}th percentile
                    </p>
                  </div>
                  <Award className="h-10 w-10 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Questions Answered</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {insights.performance_analytics.total_questions_answered}
                    </p>
                    <p className="text-sm text-purple-600 mt-1">
                      {Math.round(insights.performance_analytics.total_time_spent / 60)}h total time
                    </p>
                  </div>
                  <BookOpen className="h-10 w-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Current Streak</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {insights.performance_analytics.streak_analytics.current_streak}
                    </p>
                    <p className="text-sm text-orange-600 mt-1">
                      Best: {insights.performance_analytics.streak_analytics.longest_streak}
                    </p>
                  </div>
                  <Zap className="h-10 w-10 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Areas of Strength
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.learning_trajectory.current_level.areas_of_strength.length > 0 ? (
                  <div className="space-y-3">
                    {insights.learning_trajectory.current_level.areas_of_strength.map((strength, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                        <Trophy className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-green-800">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">Complete more quizzes to identify your strengths</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Focus Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.learning_trajectory.current_level.improvement_areas.length > 0 ? (
                  <div className="space-y-3">
                    {insights.learning_trajectory.current_level.improvement_areas.map((area, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <Lightbulb className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-orange-800">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">All areas performing well!</p>
                    <p className="text-slate-500 text-sm">Keep up the excellent work</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-2">Your Score</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {insights.comparative_analytics.peer_comparison.user_score}%
                  </p>
                </div>
                
                <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">Average Score</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {insights.comparative_analytics.peer_comparison.average_peer_score}%
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm font-medium text-green-700 mb-2">Percentile Rank</p>
                  <p className="text-3xl font-bold text-green-900">
                    {insights.comparative_analytics.peer_comparison.percentile_rank}th
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Performance vs Peers</span>
                  <span className="text-sm font-bold">
                    {insights.comparative_analytics.peer_comparison.performance_gap > 0 ? '+' : ''}
                    {insights.comparative_analytics.peer_comparison.performance_gap}% difference
                  </span>
                </div>
                <Progress 
                  value={insights.comparative_analytics.peer_comparison.percentile_rank} 
                  className="h-3"
                />
                <p className="text-xs text-slate-500 mt-2">
                  You're performing better than {insights.comparative_analytics.peer_comparison.percentile_rank}% of learners
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-6">
          {/* Processing Speed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Speed Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-lg font-bold text-blue-900">
                      {Math.round(insights.cognitive_patterns.processing_speed.average_response_time / 1000)}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">Fast Questions (&lt;10s)</span>
                    <span className="text-lg font-bold text-green-900">
                      {insights.cognitive_patterns.processing_speed.fast_questions_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="text-sm font-medium">Slow Questions (&gt;60s)</span>
                    <span className="text-lg font-bold text-orange-900">
                      {insights.cognitive_patterns.processing_speed.slow_questions_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-sm font-medium">Speed Trend</span>
                    <div className="flex items-center gap-2">
                      <TrendIcon trend={insights.cognitive_patterns.processing_speed.speed_trend} />
                      <span className="text-lg font-bold text-purple-900 capitalize">
                        {insights.cognitive_patterns.processing_speed.speed_trend}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SpeedDistributionChart data={insights.cognitive_patterns.processing_speed.speed_distribution} />
          </div>

          {/* Confidence Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Confidence Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-purple-100 rounded-lg bg-purple-50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-purple-800">Quick Correct Percentage</span>
                      <span className="text-xl font-bold text-purple-900">
                        {insights.cognitive_patterns.confidence_metrics.quick_correct_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={insights.cognitive_patterns.confidence_metrics.quick_correct_percentage} 
                      className="h-3"
                    />
                    <p className="text-xs text-purple-700 mt-2">
                      Questions answered correctly within 15 seconds
                    </p>
                  </div>

                  <div className="p-4 border border-orange-100 rounded-lg bg-orange-50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-orange-800">Hesitation Index</span>
                      <span className="text-xl font-bold text-orange-900">
                        {insights.cognitive_patterns.confidence_metrics.hesitation_index.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={insights.cognitive_patterns.confidence_metrics.hesitation_index} 
                      className="h-3"
                    />
                    <p className="text-xs text-orange-700 mt-2">
                      Questions that took over 30 seconds
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <span className="text-sm font-medium">Confidence Trend</span>
                    <div className="flex items-center gap-2">
                      <TrendIcon trend={insights.cognitive_patterns.confidence_metrics.confidence_trend} />
                      <span className="text-sm font-bold capitalize">
                        {insights.cognitive_patterns.confidence_metrics.confidence_trend}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ConfidenceHeatmap data={insights.cognitive_patterns.confidence_metrics.confidence_by_topic} />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Skills Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                Skills Development Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.learning_trajectory.skill_breakdown.length > 0 ? (
                <div className="space-y-6">
                  {insights.learning_trajectory.skill_breakdown.map((skill, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-800">{skill.skill_area}</h4>
                        <div className="flex items-center gap-3">
                          <TrendIcon trend={skill.recent_trend} />
                          <span className="text-sm text-slate-600">
                            {skill.current_score}% / {skill.target_score}%
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {skill.progress_percentage}% to target
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Progress value={skill.current_score} className="h-4" />
                        <div 
                          className="absolute top-0 right-0 w-1 h-4 bg-red-400 rounded"
                          style={{ right: `${100 - skill.target_score}%` }}
                          title={`Target: ${skill.target_score}%`}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Current: {skill.current_score}%</span>
                        <span>Target: {skill.target_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">Answer questions across different topics to see your skills breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Topic Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Performance by Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.performance_analytics.accuracy_by_topic.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{topic.topic}</span>
                        <Badge variant="outline" className="text-xs">
                          {topic.question_count} questions
                        </Badge>
                      </div>
                      <span className="text-lg font-bold">{topic.accuracy}%</span>
                    </div>
                    <Progress value={topic.accuracy} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Intervention Alerts */}
          {insights.personalized_recommendations.intervention_alerts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Immediate Attention Required
              </h3>
              {insights.personalized_recommendations.intervention_alerts.map((alert, index) => (
                <Alert key={index} className={
                  alert.type === 'warning' ? 'border-red-200 bg-red-50' :
                  alert.type === 'opportunity' ? 'border-blue-200 bg-blue-50' :
                  'border-green-200 bg-green-50'
                }>
                  {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {alert.type === 'opportunity' && <Lightbulb className="h-4 w-4 text-blue-600" />}
                  {alert.type === 'celebration' && <Trophy className="h-4 w-4 text-green-600" />}
                  <AlertDescription className={
                    alert.type === 'warning' ? 'text-red-800' :
                    alert.type === 'opportunity' ? 'text-blue-800' :
                    'text-green-800'
                  }>
                    <div className="font-medium mb-2">{alert.message}</div>
                    <div className="text-sm mb-3">{alert.suggested_action}</div>
                    <Badge variant="outline" className="text-xs">
                      {alert.urgency.replace('_', ' ')}
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Personalized Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {insights.personalized_recommendations.immediate_actions.map((action, index) => {
                  const priorityColors = {
                    high: 'border-red-200 bg-red-50',
                    medium: 'border-yellow-200 bg-yellow-50',
                    low: 'border-blue-200 bg-blue-50'
                  }
                  
                  const priorityIcons = {
                    high: <AlertTriangle className="h-5 w-5 text-red-600" />,
                    medium: <Clock className="h-5 w-5 text-yellow-600" />,
                    low: <Lightbulb className="h-5 w-5 text-blue-600" />
                  }

                  return (
                    <div key={index} className={`p-6 rounded-lg border-2 ${priorityColors[action.priority]}`}>
                      <div className="flex items-start gap-4">
                        {priorityIcons[action.priority]}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-semibold text-slate-800">{action.action}</h4>
                            <Badge variant="outline" className="text-xs">
                              {action.priority} priority
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {action.confidence}% confidence
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-4">{action.reason}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-white/60 rounded border">
                              <span className="text-xs font-medium text-slate-500 block mb-1">Expected Impact</span>
                              <p className="text-sm font-medium">{action.expected_impact}</p>
                            </div>
                            <div className="p-3 bg-white/60 rounded border">
                              <span className="text-xs font-medium text-slate-500 block mb-1">Timeframe</span>
                              <p className="text-sm font-medium">{action.timeframe}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Future Growth Projection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Growth Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700 mb-1">30-Day Projection</p>
                  <p className="text-2xl font-bold text-green-900">
                    {insights.learning_trajectory.growth_projection.projected_score_in_30_days}%
                  </p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700 mb-1">Growth Trend</p>
                  <div className="flex items-center justify-center gap-2">
                    <TrendIcon trend={insights.learning_trajectory.growth_projection.trend} />
                    <p className="text-xl font-bold text-blue-900 capitalize">
                      {insights.learning_trajectory.growth_projection.trend}
                    </p>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700 mb-1">Time to Next Level</p>
                  <p className="text-lg font-bold text-purple-900">
                    {insights.learning_trajectory.growth_projection.time_to_next_level}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 