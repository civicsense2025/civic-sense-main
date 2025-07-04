"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useToast } from "../../components/ui"
import { cn } from '@civicsense/business-logic/utils'
import { Calendar, Clock, Eye, BarChart3, TrendingUp, CheckCircle2, FileText } from "lucide-react"
import Link from "next/link"

interface CompletedSurvey {
  id: string
  survey_id: string
  response_id: string
  completed_at: string
  total_questions: number
  questions_answered: number
  completion_time_seconds: number
  survey: {
    title: string
    description: string
    post_completion_config?: any
  }
}

interface SurveyCompletionSectionProps {
  className?: string
}

export function SurveyCompletionSection({ className }: SurveyCompletionSectionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [completedSurveys, setCompletedSurveys] = useState<CompletedSurvey[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalQuestions: 0,
    averageTime: 0,
    completionRate: 100
  })

  useEffect(() => {
    const fetchCompletedSurveys = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user/survey-completions')
        if (response.ok) {
          const data = await response.json()
          setCompletedSurveys(data.completions || [])
          
          // Calculate stats
          const completions = data.completions || []
          const totalQuestions = completions.reduce((sum: number, c: CompletedSurvey) => sum + c.questions_answered, 0)
          const totalTime = completions.reduce((sum: number, c: CompletedSurvey) => sum + (c.completion_time_seconds || 0), 0)
          const avgTime = completions.length > 0 ? totalTime / completions.length : 0
          
          setStats({
            totalSurveys: completions.length,
            totalQuestions,
            averageTime: Math.round(avgTime / 60), // Convert to minutes
            completionRate: 100 // They're all completed if they're in this list
          })
        } else {
          throw new Error('Failed to fetch completions')
        }
      } catch (error) {
        console.error('Error fetching completed surveys:', error)
        toast({
          title: "Error loading surveys",
          description: "Failed to load your completed surveys. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCompletedSurveys()
  }, [user, toast])

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (!user) {
    return (
      <Card className={cn("border-slate-200 dark:border-slate-700", className)}>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Survey History
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Sign in to view your completed surveys and track your civic engagement progress.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={cn("border-slate-200 dark:border-slate-700", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Your Survey History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (completedSurveys.length === 0) {
    return (
      <Card className={cn("border-slate-200 dark:border-slate-700", className)}>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No Completed Surveys
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Complete your first survey to track your civic engagement journey.
          </p>
          <Button asChild>
            <Link href="/categories">
              Browse Surveys
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-slate-200 dark:border-slate-700", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Your Survey History</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {stats.totalSurveys} completed
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSurveys}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Surveys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalQuestions}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.averageTime}m</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Avg Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.completionRate}%</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Complete</div>
          </div>
        </div>

        {/* Completed Surveys List */}
        <div className="space-y-3">
          {completedSurveys.map((completion) => (
            <div 
              key={completion.id} 
              className="group p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                      {completion.survey.title}
                    </h4>
                  </div>
                  
                  {completion.survey.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {completion.survey.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(completion.completed_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="w-3 h-3" />
                      <span>{completion.questions_answered} questions</span>
                    </div>
                    {completion.completion_time_seconds > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(completion.completion_time_seconds)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {completion.survey.post_completion_config?.enabled && (
                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300">
                      Enhanced
                    </Badge>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Link href={`/survey/${completion.survey_id}?completed=true&response_id=${completion.response_id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Responses
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        {completedSurveys.length > 5 && (
          <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" asChild>
              <Link href="/dashboard/surveys">
                View All Completed Surveys
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 