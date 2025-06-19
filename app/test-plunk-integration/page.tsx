"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Send, CheckCircle, AlertCircle, Users, Gift, GraduationCap, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useEmailEventTriggers, useEmailAnalytics } from '@/hooks/useEmailAnalytics'

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  emailType: string
  recipient: string
  timestamp: number
}

export default function TestPlunkIntegrationPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { trackEmailConversion } = useEmailAnalytics()
  
  // Email test form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('welcome')
  const [recipientEmail, setRecipientEmail] = useState(user?.email || 'tanmho92@gmail.com')
  const [recipientName, setRecipientName] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<EmailResult[]>([])

  // Set default recipient name from user data
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setRecipientName(user.user_metadata.full_name)
    } else if (user?.email) {
      // Extract name from email as fallback
      const emailName = user.email.split('@')[0]
      setRecipientName(emailName.charAt(0).toUpperCase() + emailName.slice(1))
    }
  }, [user])

  const handleSendTestEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailType: selectedTemplate,
          recipientEmail,
          recipientName,
          customMessage,
          testData: generateTestData(selectedTemplate)
        })
      })

      const result = await response.json()
      console.log('📧 Test email sent:', selectedTemplate, 'to', recipientEmail, result)

      if (result.success) {
        const emailResult: EmailResult = {
          success: true,
          messageId: result.messageId,
          emailType: selectedTemplate,
          recipient: recipientEmail,
          timestamp: Date.now()
        }
        setResults(prev => [emailResult, ...prev])

        toast({
          title: "Email sent successfully! 📧",
          description: `${selectedTemplate} email sent to ${recipientEmail}`,
        })

        // Track the test email in analytics
        if (result.messageId) {
          trackEmailConversion(result.messageId, selectedTemplate as any, 'test_email_sent', {
            is_test: true,
            sender_user_id: user?.id
          })
        }
      } else {
        const emailResult: EmailResult = {
          success: false,
          error: result.error,
          emailType: selectedTemplate,
          recipient: recipientEmail,
          timestamp: Date.now()
        }
        setResults(prev => [emailResult, ...prev])

        toast({
          title: "Email failed to send",
          description: result.error || "Unknown error",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      const emailResult: EmailResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        emailType: selectedTemplate,
        recipient: recipientEmail,
        timestamp: Date.now()
      }
      setResults(prev => [emailResult, ...prev])

      toast({
        title: "Network error",
        description: "Failed to send email due to connection issue",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateTestData = (type: string) => {
    const baseData = {
      user_name: 'Tan Ho',
      site_name: 'CivicSense',
      site_url: 'https://civicsense.us',
      support_email: 'support@civicsense.us',
      current_year: new Date().getFullYear()
    }

    switch (type) {
      case 'welcome':
        return {
          ...baseData,
          body: 'Welcome to CivicSense! We\'re excited to help you understand how power really works in democracy.',
          action_url: 'https://civicsense.us/onboarding',
          action_text: 'Complete Your Setup'
        }

      case 'achievement':
        return {
          ...baseData,
          body: 'Congratulations! You just unlocked a new achievement on your civic learning journey.',
          achievement_name: 'Constitutional Scholar',
          achievement_description: 'You now understand more about the Constitution than 85% of Americans',
          quiz_topic: 'Bill of Rights Deep Dive',
          score: 95,
          civic_insight: 'The Bill of Rights wasn\'t just about limiting government - it was about defining what power citizens have that can never be taken away.',
          share_url: 'https://civicsense.us/share/achievement/123',
          next_challenge: 'How Congressional Power Really Works'
        }

      case 'level_up':
        return {
          ...baseData,
          body: 'You\'ve reached a new level! Your civic knowledge is growing stronger.',
          new_level: 7,
          level_title: 'Informed Citizen',
          power_unlock_message: 'You now understand how local government affects your daily life',
          celebration_image: 'https://civicsense.us/api/generate-image?template=achievement&badge=level-7',
          next_milestone: 'Civic Scholar (Level 10)'
        }

      case 'streak':
        return {
          ...baseData,
          body: 'Amazing work keeping up your learning streak! Consistency builds real civic knowledge.',
          streak_count: 7,
          civic_power_unlocked: 'You now understand more about democracy than 73% of Americans',
          streak_badge_url: 'https://civicsense.us/api/generate-image?template=achievement&badge=7-day-streak',
          keep_streak_url: 'https://civicsense.us/dashboard'
        }

      case 'pod_invitation':
        return {
          ...baseData,
          body: 'You\'ve been invited to join a learning pod for collaborative civic education.',
          invitee_name: 'Tan Ho',
          inviter_name: 'Sarah Chen',
          pod_name: 'Democracy Discussions',
          pod_type: 'study_group',
          pod_description: 'Weekly discussions about how government actually works',
          join_url: 'https://civicsense.us/join/ABC123',
          pod_preview_stats: 'Active group with 12 members, averaging 85% quiz scores',
          why_pods_matter: 'Learning about democracy works best when you can discuss it with others.'
        }

      case 'weekly_digest':
        return {
          ...baseData,
          body: 'Your weekly civic learning summary and personalized recommendations.',
          week_summary: 'This week you completed 3 quizzes and learned about judicial review',
          recommended_topics: [
            'How Your City Council Really Works',
            'Understanding Congressional Committee Power',
            'Local Elections That Actually Matter'
          ],
          local_civic_action: [
            'City Council meeting this Thursday at 7 PM',
            'School board budget hearing next Tuesday',
            'County commissioner election filing deadline approaching'
          ],
          trending_discussions: [
            'How does gerrymandering actually work in practice?',
            'Why local elections have more impact than you think'
          ],
          this_week_in_democracy: 'Congress passed a bill affecting infrastructure funding - here\'s what it means for your community',
          preferred_categories: ['government', 'local_politics', 'voting_rights']
        }

      case 're_engagement':
        return {
          ...baseData,
          body: 'We miss you! While you were away, some important civic developments happened.',
          days_away: 14,
          civic_moment_hook: 'While you were away, Congress passed a bill that affects your daily commute. The transportation funding changes mean different things for different communities.',
          personalized_comeback: 'Based on your interest in local government, we think you\'d find the new municipal power dynamics fascinating',
          quick_quiz_url: 'https://civicsense.us/quiz/local-government-power',
          what_you_missed: [
            'New supreme court decision on voting rights',
            'Major infrastructure bill affecting your state',
            'Local election results in your area'
          ]
        }

      case 'civic_news_alert':
        return {
          ...baseData,
          body: 'Breaking: Important civic development that affects you directly.',
          news_headline: 'Supreme Court Decision Affects Voting Access',
          why_this_matters_to_you: 'This ruling changes how voter ID laws work in your state, potentially affecting your voting experience',
          action_you_can_take: 'Check your voter registration and understand the new requirements',
          learn_more_quiz: 'quiz/voting-rights-update',
          discussion_url: 'https://civicsense.us/pods/discuss/supreme-court-voting'
        }

      default:
        return baseData
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-light text-slate-900 dark:text-white">
              Plunk Email Integration Test
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Test the CivicSense email system with real Plunk integration and Statsig analytics tracking.
          </p>
          
          {!user && (
            <Alert className="mt-6 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sign in to test emails with your account context
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Sending Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Send Test Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Type Selection */}
              <div className="space-y-2">
                <Label>Email Type</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose email template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="achievement">Achievement Celebration</SelectItem>
                    <SelectItem value="level_up">Level Up Notification</SelectItem>
                    <SelectItem value="streak">Learning Streak</SelectItem>
                    <SelectItem value="pod_invitation">Pod Invitation</SelectItem>
                    <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                    <SelectItem value="re_engagement">Re-engagement</SelectItem>
                    <SelectItem value="civic_news_alert">Civic News Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Recipient Name</Label>
                  <Input
                    id="name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>

                              {/* Custom Message for testing */}
                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a custom test message..."
                    rows={3}
                  />
                </div>

              {/* Send Button */}
              <Button
                onClick={handleSendTestEmail}
                disabled={isLoading || !recipientEmail || !recipientName}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>

              {/* Environment Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Development Mode:</strong> Emails will be simulated if PLUNK_API_KEY is not configured.
                  Check console logs for email details.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Email Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-slate-600" />
                Email Results ({results.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Mail className="w-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No emails sent yet. Send a test email to see results here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                          : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <Badge variant="outline">
                            {result.emailType}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">
                          To: {result.recipient}
                        </p>
                        
                        {result.success ? (
                          <p className="text-green-700 dark:text-green-300">
                            ✓ Sent successfully
                            {result.messageId && (
                              <span className="text-xs block text-slate-500 mt-1">
                                ID: {result.messageId}
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-red-700 dark:text-red-300">
                            ✗ Failed: {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Analytics Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Email Tracking</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  All emails tracked in Statsig analytics
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-900 dark:text-green-100">Engagement Metrics</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Opens, clicks, and conversions tracked
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <GraduationCap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-purple-900 dark:text-purple-100">Civic Impact</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Democratic engagement attribution
                </p>
              </div>
            </div>

            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                <strong>Webhooks:</strong> Configure Plunk webhooks to track email delivery, opens, and clicks in real-time.
                Webhook URL: <code>/api/email/webhook</code>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 