"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Users, 
  Clock, 
  BarChart3, 
  ExternalLink, 
  Copy,
  Eye,
  Edit,
  Trash2
} from "lucide-react"

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

export default function SurveysAdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [surveys, setSurveys] = useState<SurveySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'active' | 'closed'>('all')

  // Check if user is admin
  useEffect(() => {
    if (user && user.email !== 'admin@civicsense.app') {
      router.push('/dashboard')
      return
    }
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  // Fetch surveys
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const params = selectedStatus !== 'all' ? `?status=${selectedStatus}` : ''
        const response = await fetch(`/api/surveys${params}`)
        
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

    if (user?.email === 'admin@civicsense.app') {
      fetchSurveys()
    }
  }, [user, selectedStatus, toast])

  const handleCopyLink = (surveyId: string) => {
    const url = `${window.location.origin}/survey/${surveyId}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Survey link has been copied to clipboard."
    })
  }

  const handleStatusChange = async (surveyId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setSurveys(prev => prev.map(survey => 
          survey.id === surveyId 
            ? { ...survey, status: newStatus as any }
            : survey
        ))
        toast({
          title: "Status updated",
          description: `Survey is now ${newStatus}.`
        })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error updating status",
        description: "Failed to update survey status.",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user || user.email !== 'admin@civicsense.app') {
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
                    {surveys.reduce((sum, s) => sum + s.total_responses, 0)}
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
                         Math.max(1, surveys.reduce((sum, s) => sum + s.total_responses, 0))) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          {(['all', 'draft', 'active', 'closed'] as const).map(status => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {/* Surveys Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 dark:text-slate-400 mt-4">Loading surveys...</p>
              </div>
            ) : surveys.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">No surveys found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {survey.title}
                          </div>
                          {survey.description && (
                            <div className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                              {survey.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(survey.status)}>
                          {survey.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{survey.question_count}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{survey.total_responses}</div>
                          <div className="text-xs text-slate-500">
                            {survey.authenticated_responses} auth • {survey.anonymous_responses} anon
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {survey.total_responses > 0 
                          ? `${Math.round((survey.completed_responses / survey.total_responses) * 100)}%`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(survey.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/survey/${survey.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(survey.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          {survey.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(survey.id, 'active')}
                              className="text-green-600 hover:text-green-700"
                            >
                              Publish
                            </Button>
                          )}

                          {survey.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(survey.id, 'closed')}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 