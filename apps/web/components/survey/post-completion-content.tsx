"use client"

import { useState, useEffect } from "react"
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@civicsense/business-logic/utils'
import { ExternalLink, BookOpen, Target, TrendingUp, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

interface PostCompletionConfig {
  enabled: boolean
  type: 'redirect' | 'content' | 'recommendations' | 'learning_path' | 'mixed'
  redirect_url?: string
  redirect_delay?: number // seconds
  title?: string
  message?: string
  show_recommendations?: boolean
  show_learning_goals?: boolean
  show_related_content?: boolean
  custom_content?: string
  cta_text?: string
  cta_url?: string
  show_stats?: boolean
}

interface SurveyResponse {
  question_id: string
  answer: any
  answered_at: string
}

interface RecommendedContent {
  id: string
  title: string
  description: string
  type: 'quiz' | 'article' | 'topic' | 'skill'
  url: string
  difficulty?: string
  estimatedTime?: number
  relevanceScore: number
}

interface PostCompletionContentProps {
  surveyId: string
  surveyTitle: string
  responses: SurveyResponse[]
  config: PostCompletionConfig
  className?: string
  onContinue?: () => void
}

export function PostCompletionContent({
  surveyId,
  surveyTitle,
  responses,
  config,
  className,
  onContinue
}: PostCompletionContentProps) {
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([])
  const [learningGoals, setLearningGoals] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redirectCountdown, setRedirectCountdown] = useState(config.redirect_delay || 0)

  useEffect(() => {
    const fetchPersonalizedContent = async () => {
      try {
        // Fetch recommendations based on survey responses
        if (config.show_recommendations) {
          const recommendationsResponse = await fetch('/api/surveys/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              surveyId,
              responses
            })
          })
          
          if (recommendationsResponse.ok) {
            const data = await recommendationsResponse.json()
            setRecommendations(data.recommendations || [])
          }
        }

        // Fetch updated learning goals
        if (config.show_learning_goals) {
          const goalsResponse = await fetch('/api/learning-goals/survey-impact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              surveyId,
              responses
            })
          })
          
          if (goalsResponse.ok) {
            const data = await goalsResponse.json()
            setLearningGoals(data.goals || [])
          }
        }

        // Fetch completion stats
        if (config.show_stats) {
          const statsResponse = await fetch(`/api/surveys/${surveyId}/stats`)
          if (statsResponse.ok) {
            const data = await statsResponse.json()
            setStats(data.stats)
          }
        }
      } catch (error) {
        console.error('Error fetching personalized content:', error)
      } finally {
        setLoading(false)
      }
    }

    if (config.enabled) {
      fetchPersonalizedContent()
    }
  }, [surveyId, responses, config])

  // Handle redirect countdown
  useEffect(() => {
    if (config.type === 'redirect' && config.redirect_url && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (config.type === 'redirect' && config.redirect_url && redirectCountdown === 0) {
      window.location.href = config.redirect_url
    }
  }, [redirectCountdown, config])

  if (!config.enabled) {
    return null
  }

  if (config.type === 'redirect' && config.redirect_url) {
    return (
      <div className={cn("text-center space-y-6", className)}>
        <div className="space-y-4">
          <div className="text-2xl">🚀</div>
          <h3 className="text-xl font-medium text-slate-900 dark:text-white">
            Redirecting you now...
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            You'll be automatically redirected in {redirectCountdown} seconds
          </p>
          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((config.redirect_delay || 5) - redirectCountdown) / (config.redirect_delay || 5) * 100}%` }}
            />
          </div>
          <Button
            onClick={() => window.location.href = config.redirect_url!}
            className="mt-4"
          >
            Continue Now <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Custom Title and Message */}
      {(config.title || config.message) && (
        <div className="text-center space-y-4">
          {config.title && (
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              {config.title}
            </h2>
          )}
          {config.message && (
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              {config.message}
            </p>
          )}
        </div>
      )}

      {/* Stats Display */}
      {config.show_stats && stats && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Your Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{responses.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Questions Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalResponses || 0}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.completionRate || '0'}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">#{stats.yourRank || '—'}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Your Ranking</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Goals Progress */}
      {config.show_learning_goals && learningGoals.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Updated Learning Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {learningGoals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white">{goal.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{goal.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {goal.progressChange > 0 && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        +{goal.progressChange}% progress
                      </Badge>
                    )}
                    <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {config.show_recommendations && recommendations.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Recommended for You</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.slice(0, 4).map((item) => (
                <Link key={item.id} href={item.url}>
                  <div className="group p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.difficulty && (
                        <Badge className={cn(
                          "text-xs",
                          item.difficulty === 'beginner' ? "bg-green-100 text-green-800" :
                          item.difficulty === 'intermediate' ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {item.difficulty}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-slate-500">
                        {item.relevanceScore}% match
                      </div>
                      {item.estimatedTime && (
                        <div className="text-xs text-slate-500">
                          {item.estimatedTime} min
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Content */}
      {config.custom_content && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div 
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: config.custom_content }}
            />
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <div className="text-center space-y-4">
        {config.cta_text && config.cta_url && (
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={config.cta_url}>
              {config.cta_text}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
        
        {onContinue && (
          <Button variant="outline" onClick={onContinue} className="ml-4">
            Continue to Dashboard
          </Button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Loading personalized content...</p>
        </div>
      )}
    </div>
  )
} 