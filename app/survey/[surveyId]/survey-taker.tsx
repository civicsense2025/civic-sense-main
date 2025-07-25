"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SurveyForm, Survey, SurveyResponse } from "@/components/survey/survey-form"
import { Header } from "@/components/header"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { useGuestAccess } from "@/hooks/use-guest-access"
import { useToast } from "@/components/ui/use-toast"
import { Clock, Users, Shield, Play, CheckCircle2 } from "lucide-react"
import { SurveyIncentiveDisplay } from "@/components/survey/survey-incentive-display"
import { SurveyRewardsCompletion } from "@/components/survey/survey-rewards-completion"
import { UnclaimedRewardsNotification } from "@/components/survey/unclaimed-rewards-notification"
import { useSurveyIncentive } from "@/hooks/use-survey-incentives"

interface SurveyTakerProps {
  survey: Survey
}

export function SurveyTaker({ survey }: SurveyTakerProps) {
  const { user } = useAuth()
  const { guestToken } = useGuestAccess()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { incentive } = useSurveyIncentive(survey.id)
  
  const [showSurvey, setShowSurvey] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [surveyResponseId, setSurveyResponseId] = useState<string | null>(null)
  const [sessionId] = useState(() => `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [existingResponses, setExistingResponses] = useState<SurveyResponse[]>([])
  const [completedResponses, setCompletedResponses] = useState<SurveyResponse[]>([])

  // Extract URL parameters
  const emailFromUrl = searchParams.get('email')
  const isViewingCompleted = searchParams.get('completed') === 'true'
  const responseId = searchParams.get('response_id')

  // Check for existing responses on mount
  useEffect(() => {
    const checkExistingResponses = async () => {
      if (!user && !guestToken) return

      // If viewing completed survey, fetch specific response
      if (isViewingCompleted && responseId) {
        try {
          const response = await fetch(`/api/surveys/${survey.id}/responses/${responseId}`)
          if (response.ok) {
            const data = await response.json()
            setCompletedResponses(data.answers || [])
            return
          }
        } catch (error) {
          console.error('Error fetching completed response:', error)
          toast({
            title: "Error loading responses",
            description: "Failed to load your survey responses.",
            variant: "destructive"
          })
        }
        return
      }

      try {
        const params = new URLSearchParams({
          session_id: sessionId
        })
        
        if (guestToken) {
          params.append('guest_token', guestToken)
        }

        const response = await fetch(`/api/surveys/${survey.id}/responses?${params}`)
        if (response.ok) {
          const data = await response.json()
          if (data.responses?.length > 0) {
            const latestResponse = data.responses[0]
            if (latestResponse.is_complete) {
              setIsCompleted(true)
            } else {
              // Pre-fill email if provided in URL and not already answered
              let responses = latestResponse.answers || []
              
              if (emailFromUrl && !responses.some((r: SurveyResponse) => 
                survey.questions.find(q => q.id === r.question_id)?.type === 'email' ||
                survey.questions.find(q => q.id === r.question_id)?.type === 'contact_info'
              )) {
                // Find email questions and pre-fill them
                const emailQuestions = survey.questions.filter(q => 
                  q.type === 'email' || q.type === 'contact_info'
                )
                
                emailQuestions.forEach(question => {
                  if (question.type === 'email') {
                    responses.push({
                      question_id: question.id,
                      answer: emailFromUrl,
                      answered_at: new Date().toISOString()
                    })
                  } else if (question.type === 'contact_info') {
                    responses.push({
                      question_id: question.id,
                      answer: { email: emailFromUrl },
                      answered_at: new Date().toISOString()
                    })
                  }
                })
              }
              
              setExistingResponses(responses)
            }
          } else if (emailFromUrl) {
            // No existing responses but email provided - pre-fill email questions
            const emailResponses: SurveyResponse[] = []
            const emailQuestions = survey.questions.filter(q => 
              q.type === 'email' || q.type === 'contact_info'
            )
            
            emailQuestions.forEach(question => {
              if (question.type === 'email') {
                emailResponses.push({
                  question_id: question.id,
                  answer: emailFromUrl,
                  answered_at: new Date().toISOString()
                })
              } else if (question.type === 'contact_info') {
                emailResponses.push({
                  question_id: question.id,
                  answer: { email: emailFromUrl },
                  answered_at: new Date().toISOString()
                })
              }
            })
            
            setExistingResponses(emailResponses)
          }
        }
      } catch (error) {
        console.error('Error checking existing responses:', error)
      }
    }

    checkExistingResponses()
  }, [survey.id, survey.questions, sessionId, user, guestToken, emailFromUrl, isViewingCompleted, responseId, toast])

  const handleStartSurvey = () => {
    setShowSurvey(true)
  }

  const handleSaveProgress = async (responses: SurveyResponse[]) => {
    try {
      await fetch(`/api/surveys/${survey.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          session_id: sessionId,
          guest_token: guestToken,
          is_complete: false,
          save_progress: true
        })
      })
    } catch (error) {
      console.error('Error saving progress:', error)
      toast({
        title: "Error saving progress",
        description: "Your progress couldn't be saved. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleComplete = async (responses: SurveyResponse[]) => {
    setIsSubmitting(true)
    try {
      // Submit survey responses
      const response = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          session_id: sessionId,
          guest_token: guestToken,
          is_complete: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit survey')
      }

      const responseData = await response.json()

      // Store response ID for rewards claiming
      if (responseData.response_id) {
        setSurveyResponseId(responseData.response_id)
      }

      // Create completion record if user is authenticated
      if (user && responseData.response_id) {
        const completionResponse = await fetch('/api/user/survey-completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surveyId: survey.id,
            responseId: responseData.response_id
          })
        })

        if (!completionResponse.ok) {
          console.error('Failed to create completion record:', await completionResponse.text())
          throw new Error('Failed to create completion record')
        }
      }

      // Only mark as completed after both operations succeed
      setIsCompleted(true)
      toast({
        title: "Survey completed!",
        description: "Thank you for your responses. Your input helps improve CivicSense."
      })
    } catch (error) {
      console.error('Error submitting survey:', error)
      toast({
        title: "Submission failed",
        description: "There was an error submitting your responses. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header onSignInClick={() => setShowAuthDialog(true)} />
        <main className="w-full py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-8">
              <div className="text-6xl mb-6">🎉</div>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <h1 className="text-3xl font-light text-slate-900 dark:text-white">
                    Survey Completed
                  </h1>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Thank you for taking the time to complete "{survey.title}". Your responses help us improve civic education for everyone.
                </p>
              </div>
            </div>

            {/* Survey Rewards Section */}
            {incentive && surveyResponseId && (
              <SurveyRewardsCompletion
                surveyId={survey.id}
                surveyTitle={survey.title}
                surveyResponseId={surveyResponseId}
                onRewardsClaimed={(result) => {
                  toast({
                    title: "Rewards claimed!",
                    description: result.messages.join(" "),
                  })
                }}
              />
            )}
            
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  What happens next?
                </h3>
                <div className="text-left space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <p>• Your responses are being analyzed to identify trends and insights</p>
                  <p>• Results will help shape new civic education content and features</p>
                  <p>• We'll share key findings with the community (anonymously)</p>
                  {!user && (
                    <p>• Create an account to see how your responses compare to others</p>
                  )}
                </div>
                
                <div className="flex justify-center space-x-4 pt-4">
                  <Button 
                    onClick={() => router.push('/')}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white"
                  >
                    Return to CivicSense
                  </Button>
                  {!user && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAuthDialog(true)}
                    >
                      Create Account
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onAuthSuccess={() => setShowAuthDialog(false)}
          initialMode="sign-up"
        />
      </div>
    )
  }

  if (showSurvey || isViewingCompleted) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header onSignInClick={() => setShowAuthDialog(true)} />
        <main className="w-full py-8">
          <SurveyForm
            survey={survey}
            onComplete={handleComplete}
            onSaveProgress={survey.allow_partial_responses ? handleSaveProgress : undefined}
            existingResponses={existingResponses}
            sessionId={sessionId}
            className="px-4 sm:px-6 lg:px-8"
            showCompleted={isViewingCompleted}
            completedResponses={completedResponses}
          />
        </main>
        
        <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onAuthSuccess={() => setShowAuthDialog(false)}
          initialMode="sign-in"
        />
      </div>
    )
  }

  // Survey landing/intro screen
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => setShowAuthDialog(true)} />
      
      <main className="w-full py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Survey Header */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0 px-4 py-1 font-medium">
                CivicSense Survey
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 dark:text-white tracking-tight leading-tight">
                {survey.title}
              </h1>
              
              {survey.description && (
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed max-w-3xl mx-auto">
                  {survey.description}
                </p>
              )}
            </div>
          </div>

          {/* Survey Incentives (if available) */}
          {incentive && incentive.show_on_start && (
            <div className="max-w-2xl mx-auto">
              <SurveyIncentiveDisplay
                incentive={incentive}
                showDetails={true}
                showClaimButton={false}
              />
            </div>
          )}

          {/* Survey Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 text-center space-y-3">
                <Clock className="h-8 w-8 text-blue-600 mx-auto" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {survey.estimated_time ? `~${survey.estimated_time} minutes` : 'Quick Survey'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {survey.questions.length} questions
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 text-center space-y-3">
                <Users className="h-8 w-8 text-green-600 mx-auto" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    Community Impact
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Help improve civic education
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 text-center space-y-3">
                <Shield className="h-8 w-8 text-purple-600 mx-auto" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {survey.allow_anonymous ? 'Anonymous' : 'Secure'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {survey.allow_anonymous ? 'No personal data required' : 'Your privacy protected'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-6">
            <Button
              size="lg"
              onClick={handleStartSurvey}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium group"
            >
              <Play className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
              Start Survey
            </Button>
            
            {existingResponses.length > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {emailFromUrl ? 'Your email has been pre-filled. ' : ''}
                {existingResponses.some(r => r.question_id && survey.questions.find(q => q.id === r.question_id && (q.type === 'email' || q.type === 'contact_info'))) ? '' : 'You have a saved response. '}
                Continue where you left off.
              </p>
            )}
            
            {emailFromUrl && existingResponses.length === 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your email will be pre-filled to save you time.
              </p>
            )}

            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-500">
              {survey.allow_partial_responses && (
                <p>• You can save your progress and return later</p>
              )}
              {survey.allow_anonymous && (
                <p>• No account required - completely anonymous</p>
              )}
              <p>• Your responses help improve CivicSense for everyone</p>
            </div>
          </div>
        </div>
      </main>
      
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onAuthSuccess={() => setShowAuthDialog(false)}
        initialMode="sign-in"
      />
    </div>
  )
} 