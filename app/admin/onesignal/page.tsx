'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Bell, 
  Users, 
  Target, 
  Send, 
  BarChart3, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  MessageSquare,
  Mail,
  Smartphone,
  Globe,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Filter,
  Search,
  Download,
  Upload,
  Zap,
  Eye,
  Calendar,
  MapPin,
  Vote,
  BookOpen,
  Award,
  Heart,
  Share2
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface OneSignalConfig {
  app_id: string
  rest_api_key: string
  user_auth_key: string
  is_configured: boolean
  last_sync: string | null
}

interface CivicCampaign {
  id: string
  name: string
  type: 'quiz_reminder' | 'voting_alert' | 'news_update' | 'civic_action' | 'educational_content'
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused'
  title: string
  message: string
  channels: ('push' | 'email' | 'sms')[]
  targeting: {
    segments: string[]
    user_count: number
    filters: any
  }
  scheduling: {
    send_immediately: boolean
    scheduled_at?: string
    timezone?: string
  }
  created_at: string
  sent_at?: string
  results?: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    conversions: number
  }
}

interface CivicSegment {
  id: string
  name: string
  description: string
  user_count: number
  filters: {
    civic_interests?: string[]
    engagement_level?: string[]
    location?: {
      states?: string[]
      districts?: string[]
    }
    quiz_performance?: {
      min_completion_rate?: number
      recent_activity_days?: number
    }
  }
  created_at: string
  last_updated: string
}

interface EngagementMetrics {
  total_users_synced: number
  campaigns_sent_today: number
  avg_open_rate: number
  avg_click_rate: number
  civic_actions_triggered: number
  quiz_completions_from_notifications: number
  trending_segments: Array<{
    segment_name: string
    growth_rate: number
    engagement_score: number
  }>
}

export default function OneSignalAdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [config, setConfig] = useState<OneSignalConfig | null>(null)
  const [campaigns, setCampaigns] = useState<CivicCampaign[]>([])
  const [segments, setSegments] = useState<CivicSegment[]>([])
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<CivicCampaign | null>(null)
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  // Form states for campaign creation
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'educational_content' as CivicCampaign['type'],
    title: '',
    message: '',
    channels: ['push'] as ('push' | 'email' | 'sms')[],
    target_segments: [] as string[],
    send_immediately: true,
    scheduled_at: ''
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock data for development
      setConfig({
        app_id: 'your-app-id',
        rest_api_key: 'your-rest-api-key',
        user_auth_key: 'your-user-auth-key',
        is_configured: true,
        last_sync: new Date().toISOString()
      })

      setCampaigns([
        {
          id: '1',
          name: 'Weekly Constitutional Quiz',
          type: 'quiz_reminder',
          status: 'completed',
          title: '📚 New Constitutional Quiz Available!',
          message: 'Test your knowledge of the Bill of Rights and earn civic points!',
          channels: ['push', 'email'],
          targeting: { segments: ['high-engagement'], user_count: 1247, filters: {} },
          scheduling: { send_immediately: false },
          created_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          results: { sent: 1247, delivered: 1198, opened: 892, clicked: 267, conversions: 145 }
        },
        {
          id: '2',
          name: 'Election Day Reminder',
          type: 'voting_alert',
          status: 'scheduled',
          title: '🗳️ Election Day is Tomorrow!',
          message: 'Don\'t forget to vote! Find your polling location and make your voice heard.',
          channels: ['push', 'email', 'sms'],
          targeting: { segments: ['all-users'], user_count: 5432, filters: {} },
          scheduling: { send_immediately: false, scheduled_at: '2024-11-05T07:00:00Z' },
          created_at: new Date().toISOString()
        }
      ])

      setSegments([
        {
          id: '1',
          name: 'High Engagement Users',
          description: 'Users with 80%+ quiz completion rate and frequent app usage',
          user_count: 1247,
          filters: {
            engagement_level: ['high'],
            quiz_performance: { min_completion_rate: 80, recent_activity_days: 7 }
          },
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Swing State Voters',
          description: 'Users in key swing states during election periods',
          user_count: 892,
          filters: {
            location: { states: ['PA', 'MI', 'WI', 'AZ', 'NV'] }
          },
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }
      ])

      setMetrics({
        total_users_synced: 12847,
        campaigns_sent_today: 3,
        avg_open_rate: 24.8,
        avg_click_rate: 8.2,
        civic_actions_triggered: 156,
        quiz_completions_from_notifications: 89,
        trending_segments: [
          { segment_name: 'High Engagement Users', growth_rate: 12.5, engagement_score: 89.2 },
          { segment_name: 'New Civic Learners', growth_rate: 8.7, engagement_score: 67.4 },
          { segment_name: 'Swing State Voters', growth_rate: 15.2, engagement_score: 82.1 }
        ]
      })

    } catch (error) {
      console.error('Failed to load OneSignal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      setIsTestingConnection(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('✅ OneSignal connection successful!')
    } catch (error) {
      alert(`❌ Connection failed: ${error}`)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const sendTestNotification = async () => {
    try {
      // Simulate sending test notification
      await new Promise(resolve => setTimeout(resolve, 500))
      alert('✅ Test notification sent!')
    } catch (error) {
      alert(`❌ Failed to send: ${error}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'sending': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'quiz_reminder': return <BookOpen className="h-4 w-4" />
      case 'voting_alert': return <Vote className="h-4 w-4" />
      case 'news_update': return <Globe className="h-4 w-4" />
      case 'civic_action': return <Zap className="h-4 w-4" />
      case 'educational_content': return <Award className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OneSignal Integration</h1>
          <p className="text-gray-600 mt-1">
            Civic engagement through multi-channel messaging
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {config?.is_configured ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Configured
            </Badge>
          )}
          
          <Button
            onClick={testConnection}
            disabled={isTestingConnection}
            variant="outline"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Button>

          <Button onClick={() => setIsCreateCampaignOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={sendTestNotification}>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium">Send Test</p>
            <p className="text-xs text-gray-500">Test notification</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium">Sync Users</p>
            <p className="text-xs text-gray-500">Update user data</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium">Create Segment</p>
            <p className="text-xs text-gray-500">Target specific users</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="font-medium">View Analytics</p>
            <p className="text-xs text-gray-500">Campaign performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Synced Users</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{metrics.total_users_synced.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Connected to OneSignal
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Campaigns Today</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{metrics.campaigns_sent_today}</div>
              <div className="text-xs text-gray-500 mt-1">Notifications sent</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Open Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{metrics.avg_open_rate.toFixed(1)}%</div>
              <Progress value={metrics.avg_open_rate} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Click Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{metrics.avg_click_rate.toFixed(1)}%</div>
              <Progress value={metrics.avg_click_rate} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Civic Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{metrics.civic_actions_triggered}</div>
              <div className="text-xs text-gray-500 mt-1">Triggered this week</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Latest civic engagement campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map(campaign => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getCampaignIcon(campaign.type)}
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-gray-500">{campaign.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        {campaign.results && (
                          <span className="text-xs text-gray-500">
                            {campaign.results.sent} sent
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Segments</CardTitle>
                <CardDescription>Highest engagement civic segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.trending_segments.map(segment => (
                    <div key={segment.segment_name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{segment.segment_name}</p>
                        <p className="text-xs text-gray-500">
                          {segment.growth_rate > 0 ? '+' : ''}{segment.growth_rate}% growth
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {segment.engagement_score}%
                        </div>
                        <p className="text-xs text-gray-500">Engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Civic Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Civic Impact This Month</CardTitle>
              <CardDescription>How OneSignal messaging drives civic engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{metrics?.quiz_completions_from_notifications || 0}</div>
                  <p className="text-sm text-gray-600">Quiz Completions from Notifications</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{metrics?.civic_actions_triggered || 0}</div>
                  <p className="text-sm text-gray-600">Civic Actions Triggered</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {((metrics?.avg_open_rate || 0) + (metrics?.avg_click_rate || 0) / 2).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Overall Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Campaigns</h3>
            <Button onClick={() => setIsCreateCampaignOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <div className="grid gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getCampaignIcon(campaign.type)}
                      <div>
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">{campaign.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {campaign.channels.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {campaign.results && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {campaign.results.sent.toLocaleString()} sent
                          </div>
                          <div className="text-xs text-gray-500">
                            {campaign.results.opened} opened • {campaign.results.clicked} clicked
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Civic Segments</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Segment
            </Button>
          </div>

          <div className="grid gap-4">
            {segments.map(segment => (
              <Card key={segment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{segment.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{segment.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{segment.user_count.toLocaleString()} users</span>
                        <span>Updated {format(new Date(segment.last_updated), 'MMM d')}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Analytics</CardTitle>
              <CardDescription>Detailed civic engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4" />
                <p>Detailed analytics coming soon</p>
                <p className="text-sm mt-2">Track civic engagement, quiz completions, and voter participation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OneSignal Configuration</CardTitle>
              <CardDescription>Configure your OneSignal integration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">App ID</label>
                    <Input value={config.app_id} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">REST API Key</label>
                    <Input value="••••••••••••••••" readOnly className="bg-gray-50" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={config.is_configured ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {config.is_configured ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  {config.last_sync && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Sync</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(config.last_sync), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">OneSignal not configured</p>
                  <Button>Configure OneSignal</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Modal */}
      {isCreateCampaignOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create Civic Campaign</h3>
              <Button variant="ghost" onClick={() => setIsCreateCampaignOpen(false)}>
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Campaign Name</label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekly Quiz Reminder"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Campaign Type</label>
                <Select value={newCampaign.type} onValueChange={(value: any) => setNewCampaign(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz_reminder">📚 Quiz Reminder</SelectItem>
                    <SelectItem value="voting_alert">🗳️ Voting Alert</SelectItem>
                    <SelectItem value="news_update">📰 News Update</SelectItem>
                    <SelectItem value="civic_action">⚡ Civic Action</SelectItem>
                    <SelectItem value="educational_content">🎓 Educational Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message content"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Channels</label>
                <div className="flex space-x-2">
                  {['push', 'email', 'sms'].map(channel => (
                    <label key={channel} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newCampaign.channels.includes(channel as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCampaign(prev => ({ ...prev, channels: [...prev.channels, channel as any] }))
                          } else {
                            setNewCampaign(prev => ({ ...prev, channels: prev.channels.filter(c => c !== channel) }))
                          }
                        }}
                      />
                      <span className="capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newCampaign.send_immediately}
                  onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, send_immediately: checked }))}
                />
                <label className="text-sm font-medium">Send Immediately</label>
              </div>

              {!newCampaign.send_immediately && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Schedule For</label>
                  <Input
                    type="datetime-local"
                    value={newCampaign.scheduled_at}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button onClick={() => {}} className="flex-1">
                  Create Campaign
                </Button>
                <Button variant="outline" onClick={() => setIsCreateCampaignOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 