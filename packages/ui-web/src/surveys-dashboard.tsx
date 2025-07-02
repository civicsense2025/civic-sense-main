"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { 
  ChevronDown, 
  FileText, 
  Clock, 
  Users, 
  Shield, 
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { cn } from "@civicsense/shared/lib/utils"

interface Survey {
  id: string
  title: string
  description: string
  status: 'active' | 'draft' | 'closed'
  allow_anonymous: boolean
  allow_partial_responses: boolean
  estimated_time: number | null
  created_at: string
  questions_count: number
  responses_count: number
}

interface SurveyResponse {
  id: string
  survey_id: string
  is_complete: boolean
  completed_at: string | null
  started_at: string
}

interface SurveysDashboardProps {
  className?: string
}

export function SurveysDashboard({ className }: SurveysDashboardProps) {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [userResponses, setUserResponses] = useState<SurveyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSurveys = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch available surveys and user's responses in parallel
      const [surveysResponse, userResponsesResponse] = await Promise.all([
        fetch('/api/surveys?status=active'),
        user ? fetch('/api/user/survey-completions') : Promise.resolve({ ok: true, json: () => ({ completions: [] }) })
      ])
      
      if (!surveysResponse.ok) {
        // Handle different error types
        if (surveysResponse.status === 500) {
          console.error('Server error fetching surveys')
          setError('Service temporarily unavailable')
        } else if (surveysResponse.status === 401) {
          // User not authenticated - surveys might still be available for anonymous users
          console.log('User not authenticated, checking for anonymous surveys')
          setSurveys([])
          return
        } else {
          throw new Error(`HTTP ${surveysResponse.status}`)
        }
        setSurveys([])
        return
      }

      const surveysData = await surveysResponse.json()
      
      // Filter surveys based on authentication status
      let availableSurveys = surveysData.surveys || []
      
      // If user is not authenticated, only show surveys that allow anonymous responses
      if (!user) {
        availableSurveys = availableSurveys.filter((survey: Survey) => survey.allow_anonymous)
      }
      
      setSurveys(availableSurveys)

      // Set user's completed surveys if available
      if (userResponsesResponse.ok) {
        const userResponsesData = await userResponsesResponse.json()
        setUserResponses(userResponsesData.completions || [])
      } else if (user && 'text' in userResponsesResponse) {
        // Only log error if user is authenticated and we expected to get completions
        console.error('Error fetching user responses:', await userResponsesResponse.text())
      }

    } catch (error) {
      console.error('Error loading surveys:', error)
      setError('Unable to load surveys')
      setSurveys([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSurveys()
  }, [user])

  // Filter surveys to show only those the user hasn't completed
  const availableSurveys = surveys.filter(survey => {
    // If user is not authenticated, show all available anonymous surveys
    if (!user) return survey.allow_anonymous

    // Check if user has completed this survey
    const userResponse = userResponses.find(response => 
      response.survey_id === survey.id && response.is_complete
    )
    return !userResponse
  })

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
            Available Surveys
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-light">
            Help improve CivicSense by sharing your insights
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50"></div>
              <span className="text-slate-600 dark:text-slate-400 text-sm">Loading surveys...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
            Available Surveys
          </h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-slate-600 dark:text-slate-400">{error}</p>
              <Button onClick={loadSurveys} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show empty state if no surveys available
  if (availableSurveys.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
            Available Surveys
          </h2>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {user ? 
                "You've completed all available surveys. Check back later for new ones!" :
                "Sign in to access more surveys and track your progress."
              }
            </p>
            {!user && (
              <Button asChild>
                <Link href="/auth/sign-in">
                  Sign In
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show available surveys
  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
          Available Surveys
        </h2>
        <p className="text-slate-600 dark:text-slate-400 font-light">
          Help improve CivicSense by sharing your insights
        </p>
      </div>
      <div className="grid gap-4">
        {availableSurveys.map((survey) => (
          <Card key={survey.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Link href={`/survey/${survey.id}`} className="block">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      {survey.title}
                    </h3>
                    {survey.description && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                        {survey.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                      {survey.estimated_time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{survey.estimated_time} min</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{survey.questions_count} questions</span>
                      </div>
                      {!user && survey.allow_anonymous && (
                        <Badge variant="outline" className="text-xs">
                          No sign-in required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
} 