"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/lib/admin-access"
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  Users, 
  Send, 
  Eye, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Star,
  AlertTriangle,
  Filter,
  Search,
  Download,
  Reply
} from 'lucide-react'
import { toast } from 'sonner'

interface Feedback {
  id: string
  user_id?: string
  user_email?: string
  feedback_type: 'bug' | 'feature' | 'general' | 'complaint' | 'praise'
  title?: string
  message: string
  rating?: number
  status: 'new' | 'in_progress' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  context?: string
  context_id?: string
  created_at: string
  updated_at: string
  admin_notes?: string
  response_sent?: boolean
  response_sent_at?: string
}

interface FeedbackStats {
  total_feedback: number
  new_feedback: number
  resolved_feedback: number
  avg_rating: number
  response_rate: number
  avg_response_time_hours: number
  feedback_by_type: Record<string, number>
  feedback_by_priority: Record<string, number>
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats>({
    total_feedback: 0,
    new_feedback: 0,
    resolved_feedback: 0,
    avg_rating: 0,
    response_rate: 0,
    avg_response_time_hours: 0,
    feedback_by_type: {},
    feedback_by_priority: {}
  })
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [responseModalOpen, setResponseModalOpen] = useState(false)
  const [responseMessage, setResponseMessage] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    if (!adminLoading && !isAdmin) {
      router.push("/dashboard")
      return
    }

    if (isAdmin) {
      loadFeedback()
      loadFeedbackStats()
    }
  }, [user, filterStatus, filterType, isAdmin, adminLoading])

  const loadFeedback = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/feedback?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback || [])
      }
    } catch (error) {
      console.error('Error loading feedback:', error)
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const loadFeedbackStats = async () => {
    try {
      const response = await fetch('/api/admin/feedback/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error loading feedback stats:', error)
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setFeedback(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, status: newStatus as any } : f
        ))
        toast.success('Status updated successfully')
        loadFeedbackStats()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const updateFeedbackPriority = async (feedbackId: string, newPriority: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      })

      if (response.ok) {
        setFeedback(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, priority: newPriority as any } : f
        ))
        toast.success('Priority updated successfully')
        loadFeedbackStats()
      } else {
        toast.error('Failed to update priority')
      }
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('Failed to update priority')
    }
  }

  const sendFeedbackResponse = async () => {
    if (!selectedFeedback || !responseMessage.trim()) {
      toast.error('Please enter a response message')
      return
    }

    try {
      const response = await fetch('/api/admin/feedback/send-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_id: selectedFeedback.id,
          response_message: responseMessage,
          admin_name: 'CivicSense Support Team'
        })
      })

      if (response.ok) {
        toast.success('Response sent successfully!')
        setResponseModalOpen(false)
        setResponseMessage('')
        setSelectedFeedback(null)
        loadFeedback()
        loadFeedbackStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send response')
      }
    } catch (error) {
      console.error('Error sending response:', error)
      toast.error('Failed to send response')
    }
  }

  const exportFeedbackData = async () => {
    try {
      const response = await fetch('/api/admin/feedback/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Feedback data exported successfully')
      } else {
        toast.error('Failed to export feedback data')
      }
    } catch (error) {
      console.error('Error exporting feedback data:', error)
      toast.error('Failed to export feedback data')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'feature': return <Star className="h-4 w-4 text-blue-500" />
      case 'praise': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'complaint': return <XCircle className="h-4 w-4 text-orange-500" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user || adminLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!isAdmin) {
    return <div className="p-8">Unauthorized access</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feedback Management</h1>
          <p className="text-gray-600">Manage user feedback and email responses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2"
                disabled={!selectedFeedback}
              >
                <Reply className="h-4 w-4" />
                Send Response
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Feedback Response</DialogTitle>
                <DialogDescription>
                  Send a personalized response via MailerSend
                </DialogDescription>
              </DialogHeader>
              {selectedFeedback && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">Original Feedback:</h4>
                    <p className="text-sm text-gray-600 mt-1">{selectedFeedback.message}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getStatusColor(selectedFeedback.status)}>
                        {selectedFeedback.status}
                      </Badge>
                      <Badge className={getPriorityColor(selectedFeedback.priority)}>
                        {selectedFeedback.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Response Message</label>
                    <Textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Thank you for your feedback. We appreciate you taking the time to..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={sendFeedbackResponse} className="flex-1">
                      Send Response
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setResponseModalOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={exportFeedbackData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={loadFeedback}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_feedback}</div>
            <p className="text-xs text-muted-foreground">
              All time feedback submissions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Feedback</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new_feedback}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.response_rate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Feedback responded to
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="feature">Feature Request</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="complaint">Complaint</SelectItem>
            <SelectItem value="praise">Praise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="feedback" className="w-full">
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Feedback</CardTitle>
              <CardDescription>
                Manage feedback submissions and email responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.feedback_type)}
                          <span className="capitalize">{item.feedback_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.user_email || 'Anonymous'}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{item.message}</div>
                        {item.title && (
                          <div className="text-xs text-gray-500 truncate">{item.title}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.status} 
                          onValueChange={(value) => updateFeedbackStatus(item.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.priority} 
                          onValueChange={(value) => updateFeedbackPriority(item.id, value)}
                        >
                          <SelectTrigger className="w-24">
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {item.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{item.rating}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedFeedback(item)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!item.response_sent && item.user_email && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedFeedback(item)
                                setResponseModalOpen(true)
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {item.response_sent && (
                            <Badge variant="secondary" className="text-xs">
                              Responded
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Type</CardTitle>
                <CardDescription>
                  Distribution of feedback categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.feedback_by_type).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(type)}
                      <span className="capitalize">{type}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback by Priority</CardTitle>
                <CardDescription>
                  Priority distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(stats.feedback_by_priority).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between items-center">
                    <Badge className={getPriorityColor(priority)}>
                      {priority}
                    </Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Response Performance</CardTitle>
              <CardDescription>
                Email response metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Average Response Time</span>
                <span className="font-semibold">
                  {stats.avg_response_time_hours.toFixed(1)} hours
                </span>
              </div>
              <div className="flex justify-between">
                <span>Response Rate</span>
                <span className="font-semibold">
                  {(stats.response_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Resolved Feedback</span>
                <span className="font-semibold">{stats.resolved_feedback}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 