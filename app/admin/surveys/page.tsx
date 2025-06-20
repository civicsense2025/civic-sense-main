"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Users, 
  Clock, 
  BarChart3, 
  ExternalLink, 
  Copy,
  Eye,
  Edit,
  Trash2,
  Send,
  Mail,
  CheckCircle,
  XCircle,
  TrendingUp,
  MessageSquare,
  Download
} from "lucide-react"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface SurveySummary {
  id: string
  title: string
  description: string
  status: 'draft' | 'active' | 'closed'
  allow_anonymous: boolean
  allow_partial_responses: boolean
  estimated_time: number
  created_at: string
  published_at: string
  question_count: number
  total_responses: number
  completed_responses: number
  authenticated_responses: number
  anonymous_responses: number
}

interface Survey {
  id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
  estimated_time?: number
  response_count: number
  completed_responses: number
  completion_rate: number
  avg_rating?: number
}

interface SurveyResponse {
  id: string
  survey_id: string
  user_id?: string
  guest_token?: string
  user_email?: string
  is_complete: boolean
  started_at: string
  completed_at?: string
  progress_percentage: number
}

interface EmailStats {
  total_sent: number
  invitations: number
  completions: number
  reminders: number
  bounce_rate: number
  open_rate: number
  click_rate: number
}

export default function SurveysAdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin, isLoading: adminLoading } = useAdminAccess()
  
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [emailStats, setEmailStats] = useState<EmailStats>({
    total_sent: 0,
    invitations: 0,
    completions: 0,
    reminders: 0,
    bounce_rate: 0,
    open_rate: 0,
    click_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (!user) return

    if (!adminLoading && !isAdmin) {
      router.push('/dashboard')
      return
    }
  }, [user, isAdmin, adminLoading, router])

  // Fetch surveys
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await fetch('/api/admin/surveys')
        
        if (response.ok) {
          const data = await response.json()
          setSurveys(data.surveys || [])
        } else {
          throw new Error('Failed to fetch surveys')
        }
      } catch (error) {
        console.error('Error fetching surveys:', error)
        toast({
          title: "Error loading surveys",
          description: "Failed to load surveys. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      fetchSurveys()
    }
  }, [isAdmin, toast])

  const loadSurveyResponses = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/admin/surveys/${surveyId}/responses`)
      if (response.ok) {
        const data = await response.json()
        setResponses(data.responses || [])
      }
    } catch (error) {
      console.error('Error loading survey responses:', error)
      toast({
        title: "Error loading responses",
        description: "Failed to load survey responses. Please try again.",
        variant: "destructive"
      })
    }
  }

  const loadEmailStats = async () => {
    try {
      const response = await fetch('/api/admin/surveys/email-stats')
      if (response.ok) {
        const data = await response.json()
        setEmailStats(data.stats || emailStats)
      }
    } catch (error) {
      console.error('Error loading email stats:', error)
    }
  }

  const sendSurveyInvitation = async () => {
    if (!selectedSurvey || !inviteEmail) {
      toast({
        title: "Missing information",
        description: "Please select a survey and enter an email address",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/admin/surveys/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: selectedSurvey,
          email: inviteEmail,
          custom_message: inviteMessage,
          inviter_name: 'CivicSense Admin'
        })
      })

      if (response.ok) {
        toast({
          title: "Invitation sent",
          description: "Survey invitation sent successfully!",
        })
        setEmailModalOpen(false)
        setInviteEmail('')
        setInviteMessage('')
        loadEmailStats()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to send invitation",
          description: error.error || 'Failed to send invitation',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Error sending invitation",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      })
    }
  }

  const sendCompletionEmails = async (surveyId: string) => {
    try {
      const response = await fetch('/api/admin/surveys/send-completion-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey_id: surveyId })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Completion emails sent",
          description: `Sent ${data.sent_count} completion emails`,
        })
        loadEmailStats()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to send emails",
          description: error.error || 'Failed to send completion emails',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending completion emails:', error)
      toast({
        title: "Error sending emails",
        description: "Failed to send completion emails. Please try again.",
        variant: "destructive"
      })
    }
  }

  const exportSurveyData = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/admin/surveys/${surveyId}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `survey-${surveyId}-responses.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: "Export successful",
          description: "Survey data exported successfully",
        })
      } else {
        toast({
          title: "Export failed",
          description: "Failed to export survey data. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error exporting survey data:', error)
      toast({
        title: "Export error",
        description: "Failed to export survey data. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (!user || adminLoading) {
    return null
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-slate-900 dark:text-white">
              Survey Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Create and manage surveys for CivicSense users
            </p>
          </div>
          
          <Button
            onClick={() => router.push('/admin/surveys/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Survey
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Surveys
                  </p>
                  <p className="text-2xl font-light text-slate-900 dark:text-white">
                    {surveys.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Responses
                  </p>
                  <p className="text-2xl font-light text-slate-900 dark:text-white">
                    {surveys.reduce((sum, s) => sum + s.response_count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Active Surveys
                  </p>
                  <p className="text-2xl font-light text-slate-900 dark:text-white">
                    {surveys.filter(s => s.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-light text-slate-900 dark:text-white">
                    {surveys.length > 0 
                      ? Math.round((surveys.reduce((sum, s) => sum + s.completed_responses, 0) / 
                         Math.max(1, surveys.reduce((sum, s) => sum + s.response_count, 0))) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="surveys" className="w-full">
          <TabsList>
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="email-analytics">Email Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Surveys</CardTitle>
                <CardDescription>
                  Manage survey status and email communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responses</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surveys.map((survey) => (
                      <TableRow key={survey.id}>
                        <TableCell className="font-medium">{survey.title}</TableCell>
                        <TableCell>
                          <Badge variant={
                            survey.status === 'active' ? 'default' :
                            survey.status === 'completed' ? 'secondary' :
                            survey.status === 'draft' ? 'outline' : 'destructive'
                          }>
                            {survey.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{survey.response_count}</TableCell>
                        <TableCell>{(survey.completion_rate * 100).toFixed(1)}%</TableCell>
                        <TableCell>{new Date(survey.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSurvey(survey.id)
                                loadSurveyResponses(survey.id)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendCompletionEmails(survey.id)}
                              disabled={survey.status !== 'active'}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportSurveyData(survey.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            {selectedSurvey ? (
              <Card>
                <CardHeader>
                  <CardTitle>Survey Responses</CardTitle>
                  <CardDescription>
                    Individual response tracking and email status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responses.map((response) => (
                        <TableRow key={response.id}>
                          <TableCell>
                            {response.user_email || response.user_id || 'Anonymous'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={response.is_complete ? 'default' : 'secondary'}>
                              {response.is_complete ? 'Complete' : 'In Progress'}
                            </Badge>
                          </TableCell>
                          <TableCell>{response.progress_percentage}%</TableCell>
                          <TableCell>{new Date(response.started_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {response.completed_at 
                              ? new Date(response.completed_at).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {response.is_complete && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    // Send completion email for this specific response
                                    fetch('/api/admin/surveys/send-completion-email', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ response_id: response.id })
                                    })
                                    .then(() => toast({
                                      title: "Email sent",
                                      description: "Completion email sent successfully",
                                    }))
                                    .catch(() => toast({
                                      title: "Email failed",
                                      description: "Failed to send email. Please try again.",
                                      variant: "destructive"
                                    }))
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertDescription>
                  Select a survey from the Surveys tab to view its responses.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="email-analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance</CardTitle>
                  <CardDescription>
                    MailerSend delivery and engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Delivery Rate</span>
                    <span className="font-semibold">
                      {((1 - emailStats.bounce_rate) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Open Rate</span>
                    <span className="font-semibold">
                      {(emailStats.open_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Click Rate</span>
                    <span className="font-semibold">
                      {(emailStats.click_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bounce Rate</span>
                    <span className="font-semibold text-red-600">
                      {(emailStats.bounce_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Types Sent</CardTitle>
                  <CardDescription>
                    Breakdown by email category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Invitations</span>
                    <span className="font-semibold">{emailStats.invitations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completions</span>
                    <span className="font-semibold">{emailStats.completions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reminders</span>
                    <span className="font-semibold">{emailStats.reminders}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{emailStats.total_sent}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Email Integration Status</CardTitle>
                <CardDescription>
                  MailerSend service health and configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>MailerSend integration active</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  All survey emails are being sent via MailerSend transactional API
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 