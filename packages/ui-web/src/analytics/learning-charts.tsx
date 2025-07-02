'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  Brain,
  Target,
  Trophy,
  Activity
} from 'lucide-react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ChartData {
  label: string
  value: number
  color?: string
  trend?: 'up' | 'down' | 'stable'
}

interface ProgressBarChartProps {
  title: string
  data: ChartData[]
  showTrends?: boolean
  maxValue?: number
}

interface SpeedDistributionChartProps {
  data: Array<{ range: string; count: number; percentage: number }>
}

interface PerformanceTimelineProps {
  data: Array<{
    date: string
    accuracy: number
    questions_answered: number
    time_spent: number
  }>
}

interface SkillRadarProps {
  skills: Array<{
    skill_area: string
    current_score: number
    target_score: number
    progress_percentage: number
  }>
}

// ============================================================================
// CHART COMPONENTS
// ============================================================================

const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-gray-500" />
}

export function ProgressBarChart({ title, data, showTrends = false, maxValue = 100 }: ProgressBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  {showTrends && item.trend && <TrendIcon trend={item.trend} />}
                </div>
                <span className="text-sm font-bold">{item.value.toFixed(1)}%</span>
              </div>
              <Progress 
                value={(item.value / maxValue) * 100} 
                className="h-2"
                style={{
                  '--progress-color': item.color || 'hsl(var(--primary))'
                } as any}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SpeedDistributionChart({ data }: SpeedDistributionChartProps) {
  const maxPercentage = Math.max(...data.map(d => d.percentage))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
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
              <div className="relative">
                <Progress value={(bucket.percentage / maxPercentage) * 100} className="h-3" />
                <div 
                  className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                  style={{ width: `${(bucket.percentage / maxPercentage) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Insights</h4>
          <p className="text-xs text-blue-700">
            {data[0]?.percentage > 40 
              ? "You're quick at recognizing familiar concepts!"
              : data[3]?.percentage > 30
              ? "Take time to think through complex questions - accuracy matters more than speed."
              : "Good balance between speed and thoughtfulness."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function PerformanceTimeline({ data }: PerformanceTimelineProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Complete more quizzes to see your progress timeline</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxAccuracy = Math.max(...data.map(d => d.accuracy))
  const minAccuracy = Math.min(...data.map(d => d.accuracy))
  const trend = data.length > 1 ? 
    (data[0].accuracy > data[data.length - 1].accuracy ? 'improving' : 
     data[0].accuracy < data[data.length - 1].accuracy ? 'declining' : 'stable') : 'stable'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Timeline
          <Badge variant={trend === 'improving' ? 'default' : trend === 'declining' ? 'destructive' : 'secondary'}>
            {trend}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple visual timeline */}
          <div className="relative">
            <div className="flex justify-between items-end h-32 border-b border-slate-200">
              {data.slice(-10).map((point, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-4 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                    style={{ 
                      height: `${(point.accuracy / 100) * 120}px`,
                      minHeight: '8px'
                    }}
                    title={`${point.accuracy}% accuracy on ${new Date(point.date).toLocaleDateString()}`}
                  />
                  <span className="text-xs text-slate-500 mt-1 rotate-45 origin-left">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance metrics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Best Performance</p>
              <p className="text-lg font-bold text-green-900">{maxAccuracy.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Latest Session</p>
              <p className="text-lg font-bold text-blue-900">{data[0]?.accuracy.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-800">Improvement</p>
              <p className="text-lg font-bold text-purple-900">
                +{(maxAccuracy - minAccuracy).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SkillRadarChart({ skills }: SkillRadarProps) {
  if (skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Skills Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Answer questions across different topics to see your skills breakdown</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Skills Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {skills.map((skill, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{skill.skill_area}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {skill.current_score}% / {skill.target_score}%
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {skill.progress_percentage}% to target
                  </Badge>
                </div>
              </div>
              
              {/* Current vs Target visualization */}
              <div className="relative">
                <Progress value={skill.current_score} className="h-3" />
                <div 
                  className="absolute top-0 right-0 w-0.5 h-3 bg-red-400 rounded"
                  style={{ right: `${100 - skill.target_score}%` }}
                  title={`Target: ${skill.target_score}%`}
                />
              </div>
              
              <div className="flex justify-between text-xs text-slate-500">
                <span>Current: {skill.current_score}%</span>
                <span>Target: {skill.target_score}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Skill Development Insights
          </h4>
          <div className="space-y-1 text-xs text-blue-700">
            {skills.length > 0 && (
              <>
                <p>• <strong>{skills[0].skill_area}</strong> is your strongest area</p>
                <p>• Focus on <strong>{skills[skills.length - 1].skill_area}</strong> for biggest impact</p>
                <p>• Average progress toward targets: <strong>{Math.round(skills.reduce((sum, s) => sum + s.progress_percentage, 0) / skills.length)}%</strong></p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ConfidenceHeatmap({ 
  data 
}: { 
  data: Array<{ topic: string; confidence: number }> 
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Confidence Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Answer questions to see your confidence levels by topic</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500'
    if (confidence >= 60) return 'bg-yellow-500'
    if (confidence >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High'
    if (confidence >= 60) return 'Medium'
    if (confidence >= 40) return 'Low'
    return 'Very Low'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Confidence Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((item, index) => (
            <div 
              key={index} 
              className="p-3 rounded-lg border-2 border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate">{item.topic}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getConfidenceColor(item.confidence)} text-white border-none`}
                >
                  {getConfidenceLabel(item.confidence)}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <Progress value={item.confidence} className="h-2" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Confidence</span>
                  <span>{item.confidence.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <span className="text-slate-600">Confidence Levels:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>High (80%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>Medium (60-79%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span>Low (40-59%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Very Low (&lt;40%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LearningMetrics({ 
  totalQuestions, 
  totalTime, 
  currentStreak, 
  longestStreak 
}: {
  totalQuestions: number
  totalTime: number
  currentStreak: number
  longestStreak: number
}) {
  const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{totalQuestions}</p>
          <p className="text-sm text-slate-600">Questions Answered</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{Math.round(totalTime / 60)}m</p>
          <p className="text-sm text-slate-600">Total Study Time</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{currentStreak}</p>
          <p className="text-sm text-slate-600">Current Streak</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{Math.round(avgTimePerQuestion)}s</p>
          <p className="text-sm text-slate-600">Avg. per Question</p>
        </CardContent>
      </Card>
    </div>
  )
} 