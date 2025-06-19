"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { cn } from "@/lib/utils"

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

      // Fetch available surveys
      const surveysResponse = await fetch('/api/surveys?status=active')
      
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

      // Fetch user's survey responses to determine completion status
      // Note: This would need to be implemented in the API to get user's responses across all surveys
      // For now, we'll skip this and just show all available surveys
      setUserResponses([])

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
    // Check if user has completed this survey
    const userResponse = userResponses.find(response => 
      response.survey_id === survey.id && response.is_complete
    )
    return !userResponse
  })

  // Show surveys even if user is not authenticated (for anonymous surveys)
  // Only hide if loading and no surveys found

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

  if (error) {
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
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSurveys}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (availableSurveys.length === 0) {
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
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
            <div>
              <p className="text-slate-900 dark:text-white font-medium mb-1">
                All caught up!
              </p>
              <p className="text-slate-600 dark:text-slate-400 font-light text-sm">
                No new surveys available right now. Thanks for your participation!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium">
                      {availableSurveys.length} Survey{availableSurveys.length !== 1 ? 's' : ''} Available
                    </CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                      Your feedback helps shape the future of civic education
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {availableSurveys.length} new
                  </Badge>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-slate-500 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} />
                </div>
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3">
          {availableSurveys.map((survey) => (
            <Card key={survey.id} className="border border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Survey Header */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {survey.title}
                    </h3>
                    {survey.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {survey.description}
                      </p>
                    )}
                  </div>

                  {/* Survey Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                    {survey.estimated_time && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>~{survey.estimated_time} min</span>
                      </div>
                    )}
                    
                    {survey.questions_count > 0 && (
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{survey.questions_count} questions</span>
                      </div>
                    )}

                    {survey.allow_anonymous && (
                      <div className="flex items-center space-x-1">
                        <Shield className="h-3 w-3" />
                        <span>Anonymous</span>
                      </div>
                    )}

                    {survey.responses_count > 0 && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{survey.responses_count} responses</span>
                      </div>
                    )}
                  </div>

                  {/* Survey Features */}
                  <div className="flex flex-wrap gap-2">
                    {survey.allow_partial_responses && (
                      <Badge variant="outline" className="text-xs">
                        Save progress
                      </Badge>
                    )}
                    {survey.allow_anonymous && (
                      <Badge variant="outline" className="text-xs">
                        No account required
                      </Badge>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <Button asChild size="sm" className="w-full sm:w-auto">
                      <Link 
                        href={`/survey/${survey.id}${user?.email ? `?email=${encodeURIComponent(user.email)}` : ''}`}
                        className="flex items-center space-x-2"
                      >
                        <span>Take Survey</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
} 