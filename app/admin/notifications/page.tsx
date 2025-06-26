'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  Send, 
  Users, 
  BarChart3, 
  Settings,
  Clock,
  Target,
  MessageSquare,
  Smartphone,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Eye,
  Star,
  Calendar,
  Filter,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface Campaign {
  id: string
  campaign_name: string
  campaign_type: string
  title: string
  message: string
  status: string
  urgency_level: number
  target_user_count: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  conversion_count: number
  scheduled_at: string | null
  created_at: string
}

interface Segment {
  id: string
  segment_name: string
  description: string
  segment_type: string
  actual_user_count: number
  is_active: boolean
}

interface NotificationTemplate {
  id: string
  template_name: string
  template_type: string
  title_template: string
  message_template: string
  usage_count: number
}

export default function NotificationAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Campaign creation state
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    campaign_type: 'quiz_reminder',
    title: '',
    message: '',
    urgency_level: 1,
    send_push: true,
    send_email: false,
    send_sms: false,
    send_immediately: true,
    scheduled_at: '',
    target_segments: [] as string[],
    civic_action_steps: [] as string[],
    deep_link: '',
    action_url: ''
  })

  // Analytics state
  const [analytics, setAnalytics] = useState({
    total_campaigns: 0,
    active_campaigns: 0,
    total_users: 0,
    subscribed_users: 0,
    total_sent: 0,
    average_open_rate: 0,
    average_click_rate: 0,
    civic_actions_triggered: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock data for development
      setCampaigns([
        {
          id: '1',
          campaign_name: 'Constitutional Quiz Reminder',
          campaign_type: 'quiz_reminder',
          title: 'Time for your civic quiz!',
          message: 'Test your knowledge about constitutional rights and make democracy stronger.',
          status: 'sent',
          urgency_level: 2,
          target_user_count: 1500,
          sent_count: 1450,
          delivered_count: 1425,
          opened_count: 712,
          clicked_count: 234,
          conversion_count: 89,
          scheduled_at: null,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          campaign_name: 'Voting Registration Alert',
          campaign_type: 'voting_alert',
          title: 'Register to vote - 30 days left!',
          message: 'Make your voice heard in democracy. Register now and find your polling location.',
          status: 'scheduled',
          urgency_level: 4,
          target_user_count: 2100,
          sent_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          conversion_count: 0,
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          created_at: new Date().toISOString()
        }
      ])

      setSegments([
        {
          id: '1',
          segment_name: 'Beginner Civic Learners',
          description: 'Users new to civic education',
          segment_type: 'civic_engagement',
          actual_user_count: 850,
          is_active: true
        },
        {
          id: '2',
          segment_name: 'Active Quiz Takers',
          description: 'Users with 70%+ quiz completion',
          segment_type: 'quiz_performance',
          actual_user_count: 423,
          is_active: true
        },
        {
          id: '3',
          segment_name: 'Registered Voters',
          description: 'Users confirmed registered to vote',
          segment_type: 'voting',
          actual_user_count: 1200,
          is_active: true
        }
      ])

      setTemplates([
        {
          id: '1',
          template_name: 'Quiz Reminder',
          template_type: 'quiz_reminder',
          title_template: 'Time for your civic quiz, {user_name}!',
          message_template: 'Test your knowledge on {quiz_topic}. Every question makes you a more informed citizen.',
          usage_count: 24
        },
        {
          id: '2',
          template_name: 'Voting Alert',
          template_type: 'voting_alert',
          title_template: 'Important: Election in {days_until_election} days',
          message_template: 'Make your voice heard, {user_name}. Find your polling location and candidate information.',
          usage_count: 8
        }
      ])

      setAnalytics({
        total_campaigns: 12,
        active_campaigns: 3,
        total_users: 4500,
        subscribed_users: 3200,
        total_sent: 25000,
        average_open_rate: 49.2,
        average_click_rate: 16.4,
        civic_actions_triggered: 892
      })

    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async () => {
    try {
      setError('')
      setSuccess('')
      
      // Mock success for now
      const mockCampaign: Campaign = {
        id: Math.random().toString(),
        ...newCampaign,
        status: 'draft',
        target_user_count: 0,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        conversion_count: 0,
        scheduled_at: newCampaign.send_immediately ? null : newCampaign.scheduled_at,
        created_at: new Date().toISOString()
      }
      
      setCampaigns([mockCampaign, ...campaigns])
      setSuccess('Campaign created successfully!')
      
      // Reset form
      setNewCampaign({
        campaign_name: '',
        campaign_type: 'quiz_reminder',
        title: '',
        message: '',
        urgency_level: 1,
        send_push: true,
        send_email: false,
        send_sms: false,
        send_immediately: true,
        scheduled_at: '',
        target_segments: [],
        civic_action_steps: [],
        deep_link: '',
        action_url: ''
      })
    } catch (error) {
      console.error('Error creating campaign:', error)
      setError('Failed to create campaign')
    }
  }

  const addCivicActionStep = () => {
    setNewCampaign(prev => ({
      ...prev,
      civic_action_steps: [...prev.civic_action_steps, '']
    }))
  }

  const updateCivicActionStep = (index: number, value: string) => {
    setNewCampaign(prev => ({
      ...prev,
      civic_action_steps: prev.civic_action_steps.map((step, i) => 
        i === index ? value : step
      )
    }))
  }

  const removeCivicActionStep = (index: number) => {
    setNewCampaign(prev => ({
      ...prev,
      civic_action_steps: prev.civic_action_steps.filter((_, i) => i !== index)
    }))
  }

  const getCampaignTypeColor = (type: string) => {
    const colors = {
      quiz_reminder: 'bg-blue-100 text-blue-800',
      voting_alert: 'bg-red-100 text-red-800',
      news_update: 'bg-yellow-100 text-yellow-800',
      civic_action: 'bg-green-100 text-green-800',
      educational_content: 'bg-purple-100 text-purple-800',
      breaking_news: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      sending: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%'
    return `${((numerator / denominator) * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Control Center</h1>
          <p className="text-gray-600 mt-1">Manage multi-channel notifications and civic engagement campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_campaigns}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.active_campaigns} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.subscribed_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              of {analytics.total_users.toLocaleString()} total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.average_open_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Click rate: {analytics.average_click_rate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Civic Actions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.civic_actions_triggered}</div>
            <p className="text-xs text-muted-foreground">
              Actions triggered by notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>
                Manage and monitor your notification campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{campaign.campaign_name}</h3>
                        <div className="flex gap-2">
                          <Badge className={getCampaignTypeColor(campaign.campaign_type)}>
                            {campaign.campaign_type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">
                            Urgency: {campaign.urgency_level}/5
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <Button size="sm">
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="font-medium">{campaign.title}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{campaign.message}</p>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Target:</span>
                          <span>{campaign.target_user_count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sent:</span>
                          <span>{campaign.sent_count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Opened:</span>
                          <span>{calculateRate(campaign.opened_count, campaign.sent_count)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Clicked:</span>
                          <span>{calculateRate(campaign.clicked_count, campaign.opened_count)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Actions:</span>
                          <span className="font-semibold text-green-600">{campaign.conversion_count}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Created: {formatDate(campaign.created_at)}
                      {campaign.scheduled_at && (
                        <span className="ml-4">
                          Scheduled: {formatDate(campaign.scheduled_at)}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Campaign Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
              <CardDescription>
                Design a civic engagement notification campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_name">Campaign Name</Label>
                  <Input
                    id="campaign_name"
                    value={newCampaign.campaign_name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, campaign_name: e.target.value }))}
                    placeholder="Quiz Reminder Campaign"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign_type">Campaign Type</Label>
                  <Select 
                    value={newCampaign.campaign_type} 
                    onValueChange={(value) => setNewCampaign(prev => ({ ...prev, campaign_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz_reminder">Quiz Reminder</SelectItem>
                      <SelectItem value="voting_alert">Voting Alert</SelectItem>
                      <SelectItem value="news_update">News Update</SelectItem>
                      <SelectItem value="civic_action">Civic Action</SelectItem>
                      <SelectItem value="educational_content">Educational Content</SelectItem>
                      <SelectItem value="breaking_news">Breaking News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notification Content */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Notification Title</Label>
                  <Input
                    id="title"
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Your civic quiz is ready!"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newCampaign.message}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Test your knowledge about constitutional rights and strengthen democracy..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Urgency and Channels */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level (1-5)</Label>
                  <Select 
                    value={newCampaign.urgency_level.toString()} 
                    onValueChange={(value) => setNewCampaign(prev => ({ ...prev, urgency_level: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Low Priority</SelectItem>
                      <SelectItem value="2">2 - Normal</SelectItem>
                      <SelectItem value="3">3 - Important</SelectItem>
                      <SelectItem value="4">4 - Urgent</SelectItem>
                      <SelectItem value="5">5 - Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Channels</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="push" 
                        checked={newCampaign.send_push}
                        onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, send_push: checked }))}
                      />
                      <Label htmlFor="push">Push Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="email" 
                        checked={newCampaign.send_email}
                        onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, send_email: checked }))}
                      />
                      <Label htmlFor="email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="sms" 
                        checked={newCampaign.send_sms}
                        onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, send_sms: checked }))}
                      />
                      <Label htmlFor="sms">SMS</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions and Links */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deep_link">Deep Link</Label>
                    <Input
                      id="deep_link"
                      value={newCampaign.deep_link}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, deep_link: e.target.value }))}
                      placeholder="/quiz/constitutional-rights"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action_url">Action URL</Label>
                    <Input
                      id="action_url"
                      value={newCampaign.action_url}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, action_url: e.target.value }))}
                      placeholder="https://civicsense.com/quiz/123"
                    />
                  </div>
                </div>

                {/* Civic Action Steps */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Civic Action Steps</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCivicActionStep}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Step
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newCampaign.civic_action_steps.map((step, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={step}
                          onChange={(e) => updateCivicActionStep(index, e.target.value)}
                          placeholder={`Action step ${index + 1}...`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCivicActionStep(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scheduling */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="send_immediately" 
                    checked={newCampaign.send_immediately}
                    onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, send_immediately: checked }))}
                  />
                  <Label htmlFor="send_immediately">Send Immediately</Label>
                </div>
                {!newCampaign.send_immediately && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_at">Schedule For</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={newCampaign.scheduled_at}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setNewCampaign({
                    campaign_name: '',
                    campaign_type: 'quiz_reminder',
                    title: '',
                    message: '',
                    urgency_level: 1,
                    send_push: true,
                    send_email: false,
                    send_sms: false,
                    send_immediately: true,
                    scheduled_at: '',
                    target_segments: [],
                    civic_action_steps: [],
                    deep_link: '',
                    action_url: ''
                  })}
                >
                  Reset
                </Button>
                <Button onClick={createCampaign} disabled={!newCampaign.campaign_name || !newCampaign.title}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Segments</CardTitle>
              <CardDescription>
                Manage targeting segments for civic engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segments.map((segment) => (
                  <Card key={segment.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{segment.segment_name}</h3>
                        <p className="text-sm text-gray-600">{segment.description}</p>
                        <div className="flex gap-2">
                          <Badge className={getCampaignTypeColor(segment.segment_type)}>
                            {segment.segment_type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {segment.actual_user_count.toLocaleString()} users
                          </Badge>
                          {segment.is_active && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Target className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>
                Pre-built templates for common civic engagement scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{template.template_name}</h3>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{template.title_template}</p>
                          <p className="text-sm text-gray-600">{template.message_template}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getCampaignTypeColor(template.template_type)}>
                            {template.template_type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            Used {template.usage_count} times
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Use Template
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 