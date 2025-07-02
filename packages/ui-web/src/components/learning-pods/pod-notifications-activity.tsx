"use client"

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Bell, 
  Check, 
  X, 
  User,
  Clock,
  MessageSquare,
  Activity,
  UserPlus,
  Settings,
  Crown,
  Calendar,
  TrendingUp,
  Users,
  AlertCircle
} from 'lucide-react'
import { cn } from '../../utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@civicsense/shared/hooks/use-toast'
import Link from 'next/link'

interface JoinRequest {
  id: string
  pod_id: string
  requester_id: string
  message: string | null
  requester_age: number | null
  status: 'pending' | 'approved' | 'denied' | 'expired'
  created_at: string
  expires_at: string
  learning_pods: {
    pod_name: string
    pod_type: string
  }
}

interface ActivityItem {
  id: string
  pod_id: string
  pod_name: string
  activity_type: 'joined' | 'left' | 'quiz_completed' | 'achievement_earned' | 'settings_updated'
  user_name: string
  activity_data: any
  created_at: string
}

export default function PodNotificationsAndActivity() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')

  useEffect(() => {
    if (user) {
      loadNotifications()
    } else {
      setIsLoading(false)
      setJoinRequests([])
      setRecentActivity([])
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Load join requests
      const requestsResponse = await fetch('/api/learning-pods/join-requests', {
        credentials: 'include'
      })
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setJoinRequests(requestsData.requests || [])
      }

      // Load recent activity (mock for now)
      setRecentActivity(getMockActivity())
      
    } catch (error) {
      console.error('Failed to load notifications:', error)
      setJoinRequests([])
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }

  const getMockActivity = (): ActivityItem[] => [
    {
      id: '1',
      pod_id: 'pod-1',
      pod_name: 'Smith Family Learning Pod',
      activity_type: 'quiz_completed',
      user_name: 'Emma Smith',
      activity_data: { score: 95, quiz_name: 'Constitutional Rights' },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      pod_id: 'pod-2',
      pod_name: 'Democracy Study Group',
      activity_type: 'joined',
      user_name: 'Jake Wilson',
      activity_data: {},
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      pod_id: 'pod-1',
      pod_name: 'Smith Family Learning Pod',
      activity_type: 'achievement_earned',
      user_name: 'John Smith',
      activity_data: { achievement: 'Civic Scholar' },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      const response = await fetch(`/api/learning-pods/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: `Request ${action}d`,
          description: `The join request has been ${action}d.`,
        })
        loadNotifications()
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} request`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        variant: "destructive"
      })
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'joined': return <UserPlus className="h-4 w-4 text-green-600" />
      case 'left': return <User className="h-4 w-4 text-red-600" />
      case 'quiz_completed': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'achievement_earned': return <Crown className="h-4 w-4 text-yellow-600" />
      case 'settings_updated': return <Settings className="h-4 w-4 text-slate-600" />
      default: return <Activity className="h-4 w-4 text-slate-600" />
    }
  }

  const getActivityMessage = (activity: ActivityItem) => {
    switch (activity.activity_type) {
      case 'joined':
        return `${activity.user_name} joined ${activity.pod_name}`
      case 'left':
        return `${activity.user_name} left ${activity.pod_name}`
      case 'quiz_completed':
        return `${activity.user_name} completed ${activity.activity_data.quiz_name} with ${activity.activity_data.score}% score`
      case 'achievement_earned':
        return `${activity.user_name} earned the "${activity.activity_data.achievement}" achievement`
      case 'settings_updated':
        return `Pod settings were updated in ${activity.pod_name}`
      default:
        return `Activity in ${activity.pod_name}`
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  if (!user) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bell className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Sign in required</h3>
        <p className="text-slate-500 dark:text-slate-400 font-light">
          Please sign in to view your pod notifications and activity.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 font-light">Loading notifications...</p>
      </div>
    )
  }

  const pendingRequestsCount = joinRequests.filter(r => r.status === 'pending').length
  const hasActivity = recentActivity.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-slate-900 dark:text-white">
          Notifications & Activity
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
          Stay updated with join requests, member activity, and important pod updates
        </p>
      </div>

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 dark:bg-slate-800 h-12">
          <TabsTrigger value="requests" className="gap-2 font-light">
            <Bell className="h-4 w-4" />
            Join Requests
            {pendingRequestsCount > 0 && (
              <Badge className="bg-red-500 text-white border-0 text-xs">
                {pendingRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 font-light">
            <Activity className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          {joinRequests.length === 0 ? (
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-light text-slate-900 dark:text-white mb-2">No join requests</h3>
                <p className="text-slate-500 dark:text-slate-400 font-light">
                  When people request to join your pods, they'll appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <Card key={request.id} className="border-0 bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              Join request for {request.learning_pods.pod_name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(request.created_at)}
                              {request.requester_age && (
                                <>
                                  <span>•</span>
                                  <span>Age {request.requester_age}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          className={cn(
                            request.status === 'pending' 
                              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" 
                              : "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300",
                            "border-0"
                          )}
                        >
                          {request.status}
                        </Badge>
                      </div>

                      {request.message && (
                        <div className="flex items-start gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-600 dark:text-slate-400 font-light">
                            "{request.message}"
                          </p>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleJoinRequest(request.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 font-light"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJoinRequest(request.id, 'deny')}
                            className="h-8 px-4 font-light border-slate-200 dark:border-slate-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {!hasActivity ? (
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-light text-slate-900 dark:text-white mb-2">No recent activity</h3>
                <p className="text-slate-500 dark:text-slate-400 font-light">
                  Pod member activity and updates will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <Card key={activity.id} className="border-0 bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 dark:text-white font-light">
                          {getActivityMessage(activity)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                          <span>{formatTimeAgo(activity.created_at)}</span>
                          <span>•</span>
                          <Link 
                            href={`/pods/${activity.pod_id}`}
                            className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            View Pod
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 