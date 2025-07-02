// ============================================================================
// WEB ANALYTICS DASHBOARD
// ============================================================================
// Comprehensive learning analytics dashboard with advanced visualizations

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Progress, Alert, AlertDescription, Separator } from '@civicsense/ui-web'
import { useAuth } from '@civicsense/ui-web/src/components/auth/auth-provider'
import { 
  BarChart3, 
  Brain, 
  TrendingUp, 
  TrendingDown,
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
  Calendar,
  Users,
  Eye,
  Lightbulb,
  Star,
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
    learning_style: {
      preferred_question_types: Array<{ type: string; accuracy: number; preference_score: number }>
      visual_vs_textual: 'visual' | 'textual' | 'balanced'
      learning_pattern: 'sequential' | 'random' | 'adaptive'
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
    study_plan: {
      recommended_topics: Array<{ topic: string; priority: number; estimated_time: string }>
      optimal_session_length: string
      best_study_times: string[]
      difficulty_progression: string
    }
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
    recent_sessions: Array<{
      date: string
      questions_answered: number
      accuracy: number
      time_spent: number
      topics_covered: string[]
    }>
  }
  comparative_analytics: {
    peer_comparison: {
      percentile_rank: number
      average_peer_score: number
      user_score: number
      performance_gap: number
    }
    historical_comparison: {
      improvement_since_start: number
      best_month_performance: number
      consistency_score: number
    }
  }
  real_time_updates: {
    last_activity: string | null
    recent_improvements: string[]
    active_learning_session: boolean
    session_progress?: {
      questions_in_session: number
      current_accuracy: number
      session_duration: number
    }
  }
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class AnalyticsService {
  private cache = new Map<string, { data: LearningInsight; timestamp: number }>()
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  async getLearningInsights(userId: string): Promise<LearningInsight | null> {
    try {
      // Check cache first
      const cached = this.getCachedInsights(userId)
      if (cached) return cached

      const response = await fetch(`/api/analytics/learning-insights?user_id=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning insights')
      }

      const result = await response.json()
      
      if (result.success) {
        this.cacheInsights(userId, result.data)
        return result.data
      }

      return null
    } catch (error) {
      console.error('Error fetching learning insights:', error)
      return null
    }
  }

  private getCachedInsights(userId: string): LearningInsight | null {
    const cached = this.cache.get(userId)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TIMEOUT
    if (isExpired) {
      this.cache.delete(userId)
      return null
    }

    return cached.data
  }

  private cacheInsights(userId: string, data: LearningInsight): void {
    this.cache.set(userId, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId)
    } else {
      this.cache.clear()
    }
  }
}

const analyticsService = new AnalyticsService()

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
)

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' | 'improving' | 'declining' }) => {
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
    'Novice': 'bg-red-100 text-red-800',
    'Developing': 'bg-yellow-100 text-yellow-800',
    'Proficient': 'bg-blue-100 text-blue-800',
    'Advanced': 'bg-green-100 text-green-800'
  }
  
  return (
    <Badge className={colors[level as keyof typeof colors] || colors.Novice}>
      {level}
    </Badge>
  )
}

// ============================================================================
// OVERVIEW COMPONENT
// ============================================================================

function OverviewTab({ insights }: { insights: LearningInsight }) {
  const { learning_trajectory, performance_analytics, comparative_analytics, real_time_updates } = insights

  return (
    <div className="space-y-6">
      {/* Real-time Status */}
      {real_time_updates.active_learning_session && (
        <Alert className="border-green-200 bg-green-50">
          <Activity className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Active learning session in progress! 
            {real_time_updates.session_progress && (
              <span className="ml-2">
                {real_time_updates.session_progress.questions_in_session} questions answered, 
                {real_time_updates.session_progress.current_accuracy}% accuracy
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Overall Score</p>
                <p className="text-3xl font-bold text-slate-900">
                  {learning_trajectory.current_level.overall_score}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendIcon trend={learning_trajectory.growth_projection.trend} />
                  <span className="text-sm text-slate-500">
                    {learning_trajectory.growth_projection.improvement_rate > 0 ? '+' : ''}
                    {learning_trajectory.growth_projection.improvement_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Current Level</p>
                <LevelBadge level={learning_trajectory.current_level.level_name} />
                <p className="text-sm text-slate-500 mt-1">
                  {learning_trajectory.current_level.percentile_rank}th percentile
                </p>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Questions Answered</p>
                <p className="text-3xl font-bold text-slate-900">
                  {performance_analytics.total_questions_answered}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {Math.round(performance_analytics.total_time_spent / 60)}h total time
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Current Streak</p>
                <p className="text-3xl font-bold text-slate-900">
                  {performance_analytics.streak_analytics.current_streak}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Best: {performance_analytics.streak_analytics.longest_streak}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strengths & Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-green-800 mb-2">Top Strengths</h4>
                {learning_trajectory.current_level.areas_of_strength.length > 0 ? (
                  <div className="space-y-2">
                    {learning_trajectory.current_level.areas_of_strength.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Complete more quizzes to identify strengths</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Focus Areas</h4>
                {learning_trajectory.current_level.improvement_areas.length > 0 ? (
                  <div className="space-y-2">
                    {learning_trajectory.current_level.improvement_areas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">All areas performing well!</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Your Score</span>
                  <span className="text-lg font-bold">
                    {comparative_analytics.peer_comparison.user_score}%
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Average Peer Score</span>
                  <span className="text-sm">
                    {comparative_analytics.peer_comparison.average_peer_score}%
                  </span>
                </div>
                <Progress 
                  value={comparative_analytics.peer_comparison.percentile_rank} 
                  className="h-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  You're performing better than {comparative_analytics.peer_comparison.percentile_rank}% of learners
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Improvement</p>
                  <p className="text-xl font-bold text-blue-900">
                    +{comparative_analytics.historical_comparison.improvement_since_start}%
                  </p>
                  <p className="text-xs text-blue-600">Since start</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Consistency</p>
                  <p className="text-xl font-bold text-green-900">
                    {comparative_analytics.historical_comparison.consistency_score}%
                  </p>
                  <p className="text-xs text-green-600">Reliability</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Improvements */}
      {real_time_updates.recent_improvements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {real_time_updates.recent_improvements.map((improvement, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                  <CheckCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">{improvement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// COGNITIVE PATTERNS COMPONENT
// ============================================================================

function CognitivePatternsTab({ insights }: { insights: LearningInsight }) {
  const { cognitive_patterns } = insights

  return (
    <div className="space-y-6">
      {/* Processing Speed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Processing Speed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Speed Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Response Time</span>
                  <span className="font-medium">
                    {Math.round(cognitive_patterns.processing_speed.average_response_time / 1000)}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fast Questions (&lt;10s)</span>
                  <span className="font-medium">
                    {cognitive_patterns.processing_speed.fast_questions_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Slow Questions (&gt;60s)</span>
                  <span className="font-medium">
                    {cognitive_patterns.processing_speed.slow_questions_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Speed Trend</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={cognitive_patterns.processing_speed.speed_trend} />
                    <span className="font-medium capitalize">
                      {cognitive_patterns.processing_speed.speed_trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Response Time Distribution</h4>
              <div className="space-y-3">
                {cognitive_patterns.processing_speed.speed_distribution.map((bucket, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{bucket.range}</span>
                      <span>{bucket.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={bucket.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Confidence & Learning Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Confidence Metrics</h4>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Quick Correct Percentage</span>
                    <span className="text-lg font-bold">
                      {cognitive_patterns.confidence_metrics.quick_correct_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={cognitive_patterns.confidence_metrics.quick_correct_percentage} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">
                    Percentage of questions answered correctly within 15 seconds
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Hesitation Index</span>
                    <span className="text-lg font-bold">
                      {cognitive_patterns.confidence_metrics.hesitation_index.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={cognitive_patterns.confidence_metrics.hesitation_index} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">
                    Percentage of questions that took over 30 seconds
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">Confidence Trend:</span>
                  <TrendIcon trend={cognitive_patterns.confidence_metrics.confidence_trend} />
                  <span className="text-sm font-medium capitalize">
                    {cognitive_patterns.confidence_metrics.confidence_trend}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Learning Style Profile</h4>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Processing Preference</h5>
                  <div className="flex items-center justify-center p-3 bg-blue-50 rounded">
                    <Eye className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 capitalize">
                      {cognitive_patterns.learning_style.visual_vs_textual} Learner
                    </span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Learning Pattern</h5>
                  <div className="flex items-center justify-center p-3 bg-green-50 rounded">
                    <Lightbulb className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 capitalize">
                      {cognitive_patterns.learning_style.learning_pattern} Approach
                    </span>
                  </div>
                </div>

                {cognitive_patterns.learning_style.preferred_question_types.length > 0 && (
                  <div className="p-4 border rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Preferred Question Types</h5>
                    <div className="space-y-2">
                      {cognitive_patterns.learning_style.preferred_question_types.slice(0, 3).map((type, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{type.type}</span>
                          <span className="text-sm font-medium">{type.accuracy.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confidence by Topic */}
          {cognitive_patterns.confidence_metrics.confidence_by_topic.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Confidence by Topic</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cognitive_patterns.confidence_metrics.confidence_by_topic.slice(0, 6).map((topic, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{topic.topic}</span>
                      <span className="text-sm">{topic.confidence.toFixed(1)}%</span>
                    </div>
                    <Progress value={topic.confidence} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// RECOMMENDATIONS COMPONENT
// ============================================================================

function RecommendationsTab({ insights }: { insights: LearningInsight }) {
  const { personalized_recommendations } = insights

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'low': return <Lightbulb className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Intervention Alerts */}
      {personalized_recommendations.intervention_alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Immediate Attention</h3>
          {personalized_recommendations.intervention_alerts.map((alert, index) => (
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
                <div className="font-medium mb-1">{alert.message}</div>
                <div className="text-sm">{alert.suggested_action}</div>
                <Badge className="mt-2" variant="outline">
                  {alert.urgency.replace('_', ' ')}
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Immediate Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personalized_recommendations.immediate_actions.map((action, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(action.priority)}`}>
                <div className="flex items-start gap-3">
                  {getPriorityIcon(action.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{action.action}</h4>
                      <Badge variant="outline" className="text-xs">
                        {action.priority} priority
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {action.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{action.reason}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs font-medium text-slate-500">Expected Impact:</span>
                        <p className="text-sm">{action.expected_impact}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500">Timeframe:</span>
                        <p className="text-sm">{action.timeframe}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Personalized Study Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Recommended Topics</h4>
              <div className="space-y-3">
                {personalized_recommendations.study_plan.recommended_topics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">{topic.topic}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Priority: {topic.priority}
                        </Badge>
                        <span className="text-xs text-slate-500">{topic.estimated_time}</span>
                      </div>
                    </div>
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Study Recommendations</h4>
              <div className="space-y-4">
                <div className="p-3 border rounded">
                  <h5 className="text-sm font-medium mb-1">Optimal Session Length</h5>
                  <p className="text-sm text-slate-600">
                    {personalized_recommendations.study_plan.optimal_session_length}
                  </p>
                </div>

                <div className="p-3 border rounded">
                  <h5 className="text-sm font-medium mb-1">Best Study Times</h5>
                  <div className="flex flex-wrap gap-1">
                    {personalized_recommendations.study_plan.best_study_times.map((time, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 border rounded">
                  <h5 className="text-sm font-medium mb-1">Difficulty Progression</h5>
                  <p className="text-sm text-slate-600">
                    {personalized_recommendations.study_plan.difficulty_progression}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AnalyticsDashboard() {
  const { user } = useAuth()
  const [insights, setInsights] = useState<LearningInsight | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInsights = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/analytics/learning-insights?user_id=${user.id}`)
        const result = await response.json()
        
        if (result.success) {
          setInsights(result.data)
        }
      } catch (error) {
        console.error('Error loading insights:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInsights()
  }, [user?.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Analytics Data</h2>
          <p className="text-slate-600">Complete some quizzes to see your learning insights!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Learning Analytics
          </h1>
          <p className="text-slate-600 mt-2">
            Comprehensive insights into your civic education journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Overall Score</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {insights.learning_trajectory?.current_level?.overall_score || 0}%
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Questions Answered</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {insights.performance_analytics?.total_questions_answered || 0}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Processing Speed</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {Math.round((insights.cognitive_patterns?.processing_speed?.average_response_time || 0) / 1000)}s
                  </p>
                </div>
                <Brain className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Confidence</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {Math.round(insights.cognitive_patterns?.confidence_metrics?.quick_correct_percentage || 0)}%
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Dashboard Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Current Level</p>
                  <p className="text-lg">{insights.learning_trajectory?.current_level?.level_name || 'Novice'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Improvement Rate</p>
                  <p className="text-lg">{insights.learning_trajectory?.growth_projection?.improvement_rate || 0}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Next Level Timeline</p>
                  <p className="text-lg">{insights.learning_trajectory?.growth_projection?.time_to_next_level || 'Complete more quizzes'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.personalized_recommendations?.immediate_actions?.slice(0, 3).map((action: any, index: number) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{action.action}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        action.priority === 'high' ? 'bg-red-100 text-red-800' :
                        action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {action.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{action.reason}</p>
                    <p className="text-xs text-slate-500 mt-1">Expected: {action.expected_impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-2xl font-bold text-blue-900">
              {Math.round((insights.cognitive_patterns?.processing_speed?.average_response_time || 0) / 1000)}s
            </p>
            <p className="text-sm text-blue-700">Avg Response Time</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-2xl font-bold text-green-900">
              {insights.cognitive_patterns?.confidence_metrics?.quick_correct_percentage?.toFixed(1) || 0}%
            </p>
            <p className="text-sm text-green-700">Quick Correct</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-2xl font-bold text-purple-900">
              {insights.comparative_analytics?.peer_comparison?.percentile_rank || 0}th
            </p>
            <p className="text-sm text-purple-700">Percentile</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <p className="text-2xl font-bold text-orange-900">
              {insights.learning_trajectory?.growth_projection?.improvement_rate?.toFixed(1) || 0}%
            </p>
            <p className="text-sm text-orange-700">Growth Rate</p>
          </div>
        </div>
      </div>
    </div>
  )
} 