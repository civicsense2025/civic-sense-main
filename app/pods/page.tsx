"use client"

import { useState, useEffect, Suspense, lazy } from 'react'
import { notFound } from 'next/navigation'
import { arePodsEnabled } from '@/lib/feature-flags'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  BarChart3, 
  Star,
  School,
  Plus,
  Bell,
  Activity,
  Settings,
  Crown,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Heart,
  Trophy,
  Lightbulb,
  BookOpen,
  Palette,
  Sparkles,
  Shield,
  Accessibility,
  Copy,
  Check,
  MoreVertical,
  UserPlus,
  CheckCircle,
  XCircle,
  Edit,
  UserX,
  Archive,
  Smile
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { GoogleClassroomSyncDialog } from '@/components/integrations/google-classroom-sync-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EmojiPicker } from '@/components/ui/emoji-picker'

// Atomic components
import { PodHeader } from '@/components/pods/pod-header'
import { PodCard } from '@/components/pods/pod-card'
import { PodCardSkeleton } from '@/components/pods/pod-card-skeleton'
import { PodTabs, TabsContent } from '@/components/pods/pod-tabs'

// Lazy loaded components
const LearningPodManager = lazy(() => import('@/components/learning-pods/family-pod-manager').then(module => ({ default: module.LearningPodManager })))
const AggregatePodAnalytics = lazy(() => import('@/components/learning-pods/aggregate-pod-analytics').then(module => ({ default: module.AggregatePodAnalytics })))
const LearningPodsErrorBoundary = lazy(() => import('@/components/learning-pods/error-boundary').then(module => ({ default: module.LearningPodsErrorBoundary })))

// Join Request Interface
interface JoinRequest {
  id: string
  user_name: string
  user_email: string
  pod_name: string
  pod_id: string
  requested_at: string
  message?: string
}

// Activity Interface
interface PodActivity {
  id: string
  pod_name: string
  activity_type: 'member_joined' | 'quiz_completed' | 'achievement_unlocked' | 'milestone_reached'
  description: string
  created_at: string
  user_name?: string
}

// Activity and Join Requests Component
const PodNotificationsAndActivity = () => {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [activities, setActivities] = useState<PodActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadActivityData()
  }, [])

  const loadActivityData = async () => {
    try {
      setIsLoading(true)
      
      // Load join requests
      const joinRequestsResponse = await fetch('/api/learning-pods/join-requests')
      if (joinRequestsResponse.ok) {
        const joinRequestsData = await joinRequestsResponse.json()
        setJoinRequests(joinRequestsData.requests || [])
      }

      // Load recent activities
      const activitiesResponse = await fetch('/api/learning-pods/activities')
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      }
    } catch (error) {
      console.error('Failed to load activity data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      const response = await fetch(`/api/learning-pods/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        toast({
          title: action === 'approve' ? 'Request approved' : 'Request denied',
          description: `Join request has been ${action}d.`
        })
        loadActivityData() // Refresh data
      } else {
        throw new Error('Failed to process request')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process join request.',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasJoinRequests = joinRequests.length > 0
  const hasActivities = activities.length > 0

  if (!hasJoinRequests && !hasActivities) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bell className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">No activity yet</h3>
        <p className="text-slate-500 dark:text-slate-400 font-light">
          Join requests and pod activities will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Join Requests */}
      {hasJoinRequests && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Join Requests ({joinRequests.length})
          </h3>
          <div className="space-y-3">
            {joinRequests.map((request) => (
              <Card key={request.id} className="p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {request.user_name} wants to join {request.pod_name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {request.user_email} • {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                    {request.message && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">
                        "{request.message}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJoinRequest(request.id, 'deny')}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Deny
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleJoinRequest(request.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {hasActivities && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {activities.map((activity) => (
              <Card key={activity.id} className="p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    {activity.activity_type === 'member_joined' && <UserPlus className="h-4 w-4 text-blue-600" />}
                    {activity.activity_type === 'quiz_completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {activity.activity_type === 'achievement_unlocked' && <Trophy className="h-4 w-4 text-yellow-600" />}
                    {activity.activity_type === 'milestone_reached' && <Target className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {activity.pod_name} • {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { Header } from '@/components/header'

// Interfaces for enhanced features
interface PodTheme {
  id: string
  name: string
  display_name: string
  emoji: string
  primary_color: string
  secondary_color?: string
  description: string
  unlock_condition?: string
  is_seasonal: boolean
}

interface PodAchievement {
  id: string
  name: string
  display_name: string
  description: string
  emoji: string
  unlock_condition: Record<string, any>
  reward_type: 'theme' | 'emoji' | 'badge' | 'feature'
  reward_data: Record<string, any>
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface LearningPod {
  id: string
  pod_name: string
  pod_type: string
  custom_type_label?: string
  family_name?: string
  join_code: string
  member_count: number
  user_role: string
  is_admin: boolean
  content_filter_level: string
  pod_emoji?: string
  pod_color?: string
  pod_slug?: string
  pod_motto?: string
  banner_image_url?: string
  created_at: string
  description?: string
  last_activity?: string
  active_members?: number
  // Enhanced features from migration
  personality_type?: 'competitive' | 'collaborative' | 'exploratory' | 'structured'
  theme_id?: string
  theme?: {
    name: string
    display_name: string
    emoji: string
    primary_color: string
    secondary_color?: string
    description: string
  }
  accessibility_mode?: 'standard' | 'high_contrast' | 'sensory_friendly'
  unlocked_features: string[]
  milestone_data: Record<string, any>
  challenge_participation: string[]
  partnership_status?: 'open' | 'closed' | 'invite_only'
}



export default function PodsPage() {
  // Feature flag check - hide pods in production
  if (!arePodsEnabled()) {
    notFound()
  }

  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('my-pods')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [pods, setPods] = useState<LearningPod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [editTitleDialog, setEditTitleDialog] = useState<{ open: boolean; podId: string; currentTitle: string }>({
    open: false,
    podId: '',
    currentTitle: ''
  })
  const [transferDialog, setTransferDialog] = useState<{ open: boolean; podId: string; podName: string }>({
    open: false,
    podId: '',
    podName: ''
  })
  const [newTitle, setNewTitle] = useState('')
  const [transferEmail, setTransferEmail] = useState('')

  // Create pod form state with enhanced features
  const [createForm, setCreateForm] = useState({
    podName: '',
    podType: 'family' as 'family' | 'friends' | 'classroom' | 'study_group' | 'campaign' | 'organization' | 'book_club' | 'debate_team' | 'custom',
    customTypeLabel: '',
    familyName: '',
    description: '',
    contentFilterLevel: 'moderate' as 'none' | 'light' | 'moderate' | 'strict',
    podEmoji: '',
    podColor: '#3b82f6',
    podSlug: '',
    podMotto: '',
    // Enhanced customization fields
    personalityType: '' as '' | 'competitive' | 'collaborative' | 'exploratory' | 'structured',
    themeId: '',
    accessibilityMode: 'standard' as 'standard' | 'high_contrast' | 'sensory_friendly'
  })

  // State for loading themes and achievements
  const [availableThemes, setAvailableThemes] = useState<PodTheme[]>([])
  const [availableAchievements, setAvailableAchievements] = useState<PodAchievement[]>([])
  const [themesLoading, setThemesLoading] = useState(false)

  // Load themes and achievements when component mounts
  useEffect(() => {
    loadThemes()
    loadAchievements()
  }, [])

  // Listen for create pod trigger from header
  useEffect(() => {
    const handleCreatePod = () => {
      if (user) {
        setShowCreateForm(true)
      }
    }

    window.addEventListener('triggerCreatePod', handleCreatePod)
    return () => window.removeEventListener('triggerCreatePod', handleCreatePod)
  }, [user])

  // Load user's pods
  useEffect(() => {
    if (user) {
      loadUserPods()
    } else {
      setIsLoading(false)
      setPods([])
    }
  }, [user])

  const loadThemes = async () => {
    try {
      setThemesLoading(true)
      const response = await fetch('/api/pod-themes')
      if (response.ok) {
        const data = await response.json()
        setAvailableThemes(data.themes || [])
      }
    } catch (error) {
      console.error('Failed to load themes:', error)
    } finally {
      setThemesLoading(false)
    }
  }

  const loadAchievements = async () => {
    try {
      const response = await fetch('/api/pod-achievements')
      if (response.ok) {
        const data = await response.json()
        setAvailableAchievements(data.achievements || [])
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
    }
  }

  const loadUserPods = async () => {
    if (!user) {
      setIsLoading(false)
      setPods([])
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/learning-pods', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        setPods([])
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      
      if (data.pods) {
        setPods(data.pods)
      } else {
        setPods([])
      }
    } catch (error) {
      console.error('Failed to load pods:', error)
      setPods([])
    } finally {
      setIsLoading(false)
    }
  }

  const createPod = async () => {
    if (!createForm.podName.trim()) {
      toast({
        title: "Pod name required",
        description: "Please enter a name for your pod.",
        variant: "destructive"
      })
      return
    }

    if (createForm.podType === 'custom' && !createForm.customTypeLabel.trim()) {
      toast({
        title: "Custom type label required",
        description: "Please enter a label for your custom pod type.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/learning-pods', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          customTypeLabel: createForm.podType === 'custom' ? createForm.customTypeLabel : undefined,
          podEmoji: createForm.podEmoji || undefined,
          podColor: createForm.podColor,
          podSlug: createForm.podSlug || undefined,
          podMotto: createForm.podMotto || undefined,
          // Enhanced customization fields
          personalityType: createForm.personalityType || undefined,
          themeId: createForm.themeId || undefined,
          accessibilityMode: createForm.accessibilityMode
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Pod created successfully!",
          description: `${createForm.podName} is ready for group learning.`,
        })
        setShowCreateForm(false)
        setCreateForm({
          podName: '',
          podType: 'family',
          customTypeLabel: '',
          familyName: '',
          description: '',
          contentFilterLevel: 'moderate',
          podEmoji: '',
          podColor: '#3b82f6',
          podSlug: '',
          podMotto: '',
          personalityType: '',
          themeId: '',
          accessibilityMode: 'standard'
        })
        loadUserPods()
      } else {
        toast({
          title: "Error creating pod",
          description: data.error || "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to create pod:', error)
      toast({
        title: "Error creating pod",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  // Handler functions for pod actions
  const handleEmojiChange = async (podId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/learning-pods/${podId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_emoji', emoji })
      })

      if (response.ok) {
        toast({
          title: "Emoji updated",
          description: `Pod emoji changed to ${emoji}`,
        })
        loadUserPods() // Refresh pods
      } else {
        throw new Error('Failed to update emoji')
      }
    } catch (error) {
      toast({
        title: "Error updating emoji",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleEditTitle = (podId: string, currentTitle: string) => {
    setEditTitleDialog({ open: true, podId, currentTitle })
    setNewTitle(currentTitle)
  }

  const handleSaveTitle = async () => {
    if (!newTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a pod title.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/learning-pods/${editTitleDialog.podId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_title', title: newTitle.trim() })
      })

      if (response.ok) {
        toast({
          title: "Title updated",
          description: `Pod renamed to "${newTitle.trim()}"`,
        })
        setEditTitleDialog({ open: false, podId: '', currentTitle: '' })
        setNewTitle('')
        loadUserPods() // Refresh pods
      } else {
        throw new Error('Failed to update title')
      }
    } catch (error) {
      toast({
        title: "Error updating title",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleTransferPod = (podId: string, podName: string) => {
    setTransferDialog({ open: true, podId, podName })
    setTransferEmail('')
  }

  const handleConfirmTransfer = async () => {
    if (!transferEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the new owner's email.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/learning-pods/${transferDialog.podId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerEmail: transferEmail.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Pod transferred",
          description: data.message,
        })
        setTransferDialog({ open: false, podId: '', podName: '' })
        setTransferEmail('')
        loadUserPods() // Refresh pods
      } else {
        toast({
          title: "Transfer failed",
          description: data.error || "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error transferring pod",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const handleArchivePod = async (podId: string) => {
    if (!confirm('Are you sure you want to archive this pod? It will no longer be visible to members.')) {
      return
    }

    try {
      const response = await fetch(`/api/learning-pods/${podId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' })
      })

      if (response.ok) {
        toast({
          title: "Pod archived",
          description: "The pod has been archived and is no longer visible to members.",
        })
        loadUserPods() // Refresh pods
      } else {
        throw new Error('Failed to archive pod')
      }
    } catch (error) {
      toast({
        title: "Error archiving pod",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      
      <main className="container mx-auto px-6 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <PodHeader 
            onCreatePod={() => setShowCreateForm(true)}
            onPodCreated={(podId) => {
              loadUserPods()
            }}
          />

          {/* Create Pod Form */}
          {user && showCreateForm && (
            <div className="max-w-2xl mx-auto mb-16">
              <Card className="border-0 shadow-sm bg-slate-50 dark:bg-slate-900/50">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-light text-slate-900 dark:text-white">
                    Create New Pod
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Name</Label>
                      <Input
                        value={createForm.podName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, podName: e.target.value }))}
                        placeholder="Smith Family Learning Pod"
                        className="border-0 bg-white dark:bg-slate-800 h-12 text-lg font-light"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Type</Label>
                        <Select 
                          value={createForm.podType} 
                          onValueChange={(value) => setCreateForm(prev => ({ ...prev, podType: value as any }))}
                        >
                          <SelectTrigger className="border-0 bg-white dark:bg-slate-800 h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="family">👨‍👩‍👧‍👦 Family</SelectItem>
                            <SelectItem value="friends">👥 Friends</SelectItem>
                            <SelectItem value="classroom">🏫 Classroom</SelectItem>
                            <SelectItem value="study_group">📚 Study Group</SelectItem>
                            <SelectItem value="campaign">🗳️ Political Campaign</SelectItem>
                            <SelectItem value="organization">🏢 Organization</SelectItem>
                            <SelectItem value="book_club">📖 Book Club</SelectItem>
                            <SelectItem value="debate_team">⚖️ Debate Team</SelectItem>
                            <SelectItem value="custom">⭐ Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-light">Content Filter</Label>
                        <Select 
                          value={createForm.contentFilterLevel} 
                          onValueChange={(value) => setCreateForm(prev => ({ ...prev, contentFilterLevel: value as any }))}
                        >
                          <SelectTrigger className="border-0 bg-white dark:bg-slate-800 h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">🔓 None</SelectItem>
                            <SelectItem value="light">🟡 Light</SelectItem>
                            <SelectItem value="moderate">🔵 Moderate</SelectItem>
                            <SelectItem value="strict">🟢 Strict</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Custom Type Label */}
                    {createForm.podType === 'custom' && (
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-light">Custom Type Label</Label>
                        <Input
                          value={createForm.customTypeLabel}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, customTypeLabel: e.target.value }))}
                          placeholder="e.g., Community Group, Club, etc."
                          className="border-0 bg-white dark:bg-slate-800 h-12 font-light"
                        />
                      </div>
                    )}

                    {createForm.podType === 'family' && (
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 font-light">Family Name</Label>
                        <Input
                          value={createForm.familyName}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, familyName: e.target.value }))}
                          placeholder="The Smith Family"
                          className="border-0 bg-white dark:bg-slate-800 h-12 font-light"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-light">Description (Optional)</Label>
                      <Textarea
                        value={createForm.description}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this pod is for..."
                        className="border-0 bg-white dark:bg-slate-800 font-light resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Enhanced Customization Options */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                      <h4 className="text-lg font-light text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        Enhanced Personalization
                      </h4>

                      {/* Personality Type Selection */}
                      <div className="space-y-4 mb-6">
                        <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Personality</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Choose how your pod approaches learning</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { value: 'competitive', icon: Trophy, label: 'Competitive', desc: 'Leaderboards and challenges' },
                            { value: 'collaborative', icon: Heart, label: 'Collaborative', desc: 'Team learning and sharing' },
                            { value: 'exploratory', icon: Lightbulb, label: 'Exploratory', desc: 'Discovery-based learning' },
                            { value: 'structured', icon: BookOpen, label: 'Structured', desc: 'Organized and systematic' }
                          ].map((type) => {
                            const Icon = type.icon
                            return (
                              <div
                                key={type.value}
                                onClick={() => setCreateForm(prev => ({ ...prev, personalityType: type.value as any }))}
                                className={cn(
                                  'p-3 rounded-lg border cursor-pointer transition-all',
                                  createForm.personalityType === type.value
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className={cn(
                                    'h-5 w-5',
                                    createForm.personalityType === type.value ? 'text-purple-600' : 'text-slate-400'
                                  )} />
                                  <div>
                                    <div className="font-medium text-slate-900 dark:text-white">{type.label}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{type.desc}</div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Theme Selection */}
                      <div className="space-y-4 mb-6">
                        <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Theme</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Choose a visual theme for your pod</p>
                        {themesLoading ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-5 w-5 rounded-full" />
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-3 w-32" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div
                              onClick={() => setCreateForm(prev => ({ ...prev, themeId: '' }))}
                              className={cn(
                                'p-3 rounded-lg border cursor-pointer transition-all',
                                !createForm.themeId
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Palette className={cn(
                                  'h-5 w-5',
                                  !createForm.themeId ? 'text-blue-600' : 'text-slate-400'
                                )} />
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white">Default</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">Clean, simple design</div>
                                </div>
                              </div>
                            </div>
                            {availableThemes.map((theme) => (
                              <div
                                key={theme.id}
                                onClick={() => setCreateForm(prev => ({ ...prev, themeId: theme.id }))}
                                className={cn(
                                  'p-3 rounded-lg border cursor-pointer transition-all',
                                  createForm.themeId === theme.id
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                )}
                                style={{
                                  backgroundColor: createForm.themeId === theme.id 
                                    ? `${theme.primary_color}10` 
                                    : undefined
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{theme.emoji}</span>
                                  <div>
                                    <div className="font-medium text-slate-900 dark:text-white">{theme.display_name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{theme.description}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Accessibility Mode */}
                      <div className="space-y-4 mb-6">
                        <Label className="text-slate-700 dark:text-slate-300 font-light">Accessibility Mode</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Choose accessibility settings for your pod</p>
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            { value: 'standard', icon: Shield, label: 'Standard', desc: 'Default accessibility features' },
                            { value: 'high_contrast', icon: Accessibility, label: 'High Contrast', desc: 'Enhanced visual contrast' },
                            { value: 'sensory_friendly', icon: Heart, label: 'Sensory Friendly', desc: 'Reduced animations and effects' }
                          ].map((mode) => {
                            const Icon = mode.icon
                            return (
                              <div
                                key={mode.value}
                                onClick={() => setCreateForm(prev => ({ ...prev, accessibilityMode: mode.value as any }))}
                                className={cn(
                                  'p-3 rounded-lg border cursor-pointer transition-all',
                                  createForm.accessibilityMode === mode.value
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className={cn(
                                    'h-5 w-5',
                                    createForm.accessibilityMode === mode.value ? 'text-green-600' : 'text-slate-400'
                                  )} />
                                  <div>
                                    <div className="font-medium text-slate-900 dark:text-white">{mode.label}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{mode.desc}</div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <h4 className="text-lg font-light text-slate-900 dark:text-white mb-4 border-t border-slate-200 dark:border-slate-700 pt-6">Basic Customization</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Emoji</Label>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg w-12 h-12 flex items-center justify-center">
                              {createForm.podEmoji || 
                                (createForm.podType === 'family' ? '👨‍👩‍👧‍👦' : 
                                 createForm.podType === 'friends' ? '👥' :
                                 createForm.podType === 'classroom' ? '🏫' :
                                 createForm.podType === 'study_group' ? '📚' :
                                 createForm.podType === 'campaign' ? '🗳️' :
                                 createForm.podType === 'organization' ? '🏢' :
                                 createForm.podType === 'book_club' ? '📖' :
                                 createForm.podType === 'debate_team' ? '⚖️' :
                                 createForm.podType === 'custom' ? '✨' : '👥')
                              }
                            </div>
                            <Input
                              value={createForm.podEmoji}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, podEmoji: e.target.value.slice(0, 2) }))}
                              placeholder="Choose an emoji..."
                              className="border-0 bg-white dark:bg-slate-800 h-12 font-light flex-1"
                              maxLength={2}
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Leave empty to use default emoji for pod type</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Color</Label>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                              style={{ backgroundColor: createForm.podColor }}
                              onClick={() => document.getElementById('color-picker')?.click()}
                            />
                            <input
                              id="color-picker"
                              type="color"
                              value={createForm.podColor}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, podColor: e.target.value }))}
                              className="sr-only"
                            />
                            <div className="flex-1">
                              <Input
                                value={createForm.podColor}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, podColor: e.target.value }))}
                                placeholder="#3b82f6"
                                className="border-0 bg-white dark:bg-slate-800 h-12 font-light font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-light">Custom URL Slug (Optional)</Label>
                          <div className="flex items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 px-3 h-12 flex items-center rounded-l-lg">
                              civicsense.org/pods/
                            </span>
                            <Input
                              value={createForm.podSlug}
                              onChange={(e) => setCreateForm(prev => ({ 
                                ...prev, 
                                podSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') 
                              }))}
                              placeholder="my-awesome-pod"
                              className="border-0 bg-white dark:bg-slate-800 h-12 font-light font-mono rounded-l-none"
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">If empty, we'll generate one from your pod name</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Motto (Optional)</Label>
                          <Input
                            value={createForm.podMotto}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, podMotto: e.target.value }))}
                            placeholder="Learning together, growing stronger"
                            className="border-0 bg-white dark:bg-slate-800 h-12 font-light"
                            maxLength={100}
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">A short inspiring phrase for your pod</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="ghost" onClick={() => setShowCreateForm(false)} className="flex-1 h-12 font-light">
                      Cancel
                    </Button>
                    <Button onClick={createPod} className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white h-12 font-light">
                      Create Pod
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <PodTabs activeTab={activeTab} onTabChange={setActiveTab}>

            <TabsContent value="my-pods">
              <Suspense fallback={
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <PodCardSkeleton key={i} />
                  ))}
                </div>
              }>
                <LearningPodsErrorBoundary>
                  {!user ? (
                    <div className="text-center py-24">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Sign in required</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-light mb-8 max-w-md mx-auto">
                        Learning pods are only available to authenticated users. Please sign in to create and manage your learning pods.
                      </p>
                    </div>
                  ) : isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <PodCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : pods.length === 0 ? (
                    <div className="text-center py-24">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">No pods yet</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-light mb-8 max-w-md mx-auto">
                        Create your first learning pod to start learning together safely
                      </p>
                      <Button 
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-full px-8 py-3 h-12 font-light"
                        onClick={() => {
                          // Switch to my-pods tab and trigger create pod
                          const createEvent = new CustomEvent('triggerCreatePod')
                          window.dispatchEvent(createEvent)
                        }}
                      >
                        Create Your First Pod
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {pods.map((pod) => (
                        <PodCard 
                          key={pod.id} 
                          pod={pod}
                          showDescription={true}
                          showActivity={true}
                          showMembers={true}
                          showRole={true}
                          showJoinCode={false}
                          onEmojiClick={(podId, emoji) => {
                            handleEmojiChange(podId, emoji)
                          }}
                          onManageClick={(podId) => {
                            window.location.href = `/pods/${podId}`
                          }}
                          onEditTitle={handleEditTitle}
                          onTransferPod={(podId) => {
                            const pod = pods.find(p => p.id === podId)
                            if (pod) handleTransferPod(podId, pod.pod_name)
                          }}
                          onArchivePod={handleArchivePod}
                        />
                      ))}
                    </div>
                  )}
                </LearningPodsErrorBoundary>
              </Suspense>
            </TabsContent>



            <TabsContent value="notifications">
              <LearningPodsErrorBoundary>
                <PodNotificationsAndActivity />
              </LearningPodsErrorBoundary>
            </TabsContent>

            <TabsContent value="analytics">
              <Suspense fallback={
                <div className="space-y-8">
                  {/* Header */}
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                          </div>
                          <Skeleton className="h-8 w-12" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="p-6">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                    </Card>
                  </div>
                </div>
              }>
                <LearningPodsErrorBoundary>
                  <AggregatePodAnalytics />
                </LearningPodsErrorBoundary>
              </Suspense>
            </TabsContent>
          </PodTabs>
        </div>
      </main>

      {/* Edit Title Dialog */}
      <Dialog open={editTitleDialog.open} onOpenChange={(open) => {
        setEditTitleDialog({ open, podId: '', currentTitle: '' })
        if (!open) setNewTitle('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pod Title</DialogTitle>
            <DialogDescription>
              Change the name of your learning pod.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-title">Pod Title</Label>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter new pod title"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditTitleDialog({ open: false, podId: '', currentTitle: '' })
              setNewTitle('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveTitle}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Pod Dialog */}
      <Dialog open={transferDialog.open} onOpenChange={(open) => {
        setTransferDialog({ open, podId: '', podName: '' })
        if (!open) setTransferEmail('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Pod Ownership</DialogTitle>
            <DialogDescription>
              Transfer ownership of "{transferDialog.podName}" to another user. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-email">New Owner's Email</Label>
              <Input
                id="transfer-email"
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                The user must already have a CivicSense account.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTransferDialog({ open: false, podId: '', podName: '' })
              setTransferEmail('')
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmTransfer}>
              Transfer Ownership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 