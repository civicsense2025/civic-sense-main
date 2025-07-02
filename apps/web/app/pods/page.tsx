"use client"

import { useState, useEffect, Suspense, lazy } from 'react'
import { notFound, useRouter, useSearchParams, redirect } from 'next/navigation'
import { arePodsEnabled } from '@civicsense/shared/lib/comprehensive-feature-flags'
import { Button } from '@civicsense/ui-web'
import { Card, CardContent, CardHeader, CardTitle } from '@civicsense/ui-web'
import { Badge } from '@civicsense/ui-web'
import { Input } from '@civicsense/ui-web'
import { Label } from '@civicsense/ui-web'
import { Textarea } from '@civicsense/ui-web'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@civicsense/ui-web'
import { Tabs, TabsList, TabsTrigger } from '@civicsense/ui-web'
import { Switch } from '@civicsense/ui-web'
import { Skeleton } from '@civicsense/ui-web'
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
import { cn } from '@civicsense/shared/lib/utils'
import { useAuth } from '@civicsense/ui-web/components/auth/auth-provider'
import { useToast } from '@civicsense/shared/hooks/use-toast'
import Link from 'next/link'
import { GoogleClassroomSyncDialog } from '@civicsense/ui-web/components/integrations/google-classroom-sync-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@civicsense/ui-web'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@civicsense/ui-web'
import { EmojiPicker } from '@civicsense/ui-web'

// Atomic components
import { PodHeader } from '@civicsense/ui-web/components/pods/pod-header'
import { PodCard } from '@civicsense/ui-web/components/pods/pod-card'
import { PodCardSkeleton } from '@civicsense/ui-web/components/pods/pod-card-skeleton'
import { PodTabs, TabsContent } from '@civicsense/ui-web/components/pods/pod-tabs'

// Lazy loaded components
const LearningPodManager = lazy(() => import('@civicsense/ui-web/components/learning-pods/family-pod-manager').then(module => ({ default: module.LearningPodManager })))
const AggregatePodAnalytics = lazy(() => import('@civicsense/ui-web/components/learning-pods/aggregate-pod-analytics').then(module => ({ default: module.AggregatePodAnalytics })))
const LearningPodsErrorBoundary = lazy(() => import('@civicsense/ui-web/components/learning-pods/error-boundary').then(module => ({ default: module.LearningPodsErrorBoundary })))

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
  pod_id: string
  pod_name: string
  activity_type: string
  user_name: string
  activity_data: {
    message?: string
    achievement_name?: string
    milestone_name?: string
    quiz_name?: string
    score?: number
    [key: string]: any
  }
  created_at: string
}

// Activity and Join Requests Component
import { PodActivityFeed } from '@civicsense/ui-web/components/learning-pods/pod-activity-feed'
import { CreatePodWizard } from '@civicsense/ui-web/components/learning-pods/create-pod-wizard'

import { Header } from '@civicsense/ui-web'

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

interface Pod {
  id: string
  pod_name: string
  pod_type: string
  member_count: number
  user_role: string
  is_admin: boolean
  content_filter_level: string
  recent_activity_count: number
  last_activity_date: string
}

interface PodStats {
  totalPods: number
  activePods: number
  totalMembers: number
  adminPods: number
  recentActivity: number
  topPerformingPod?: {
    name: string
    activityScore: number
  }
}

export default function PodsPage() {
  // Check feature flag first
  if (!arePodsEnabled()) {
    redirect('/')
  }

  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'my-pods')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [pods, setPods] = useState<LearningPod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<PodStats | null>(null)
  
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
  const [timeRange, setTimeRange] = useState('30')
  const [podTypeFilter, setPodTypeFilter] = useState('all')
  const [activityFilter, setActivityFilter] = useState('all')

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

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams?.toString())
    params.set('tab', value)
    router.push(`/pods?${params.toString()}`, { scroll: false })
  }

  // Load analytics data when filters change
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch(
          `/api/learning-pods/aggregate-analytics?days=${timeRange}&podType=${podTypeFilter}&activity=${activityFilter}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to load analytics')
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Error loading analytics:', error)
        toast({
          title: "Error loading analytics",
          description: "Please try again later.",
          variant: "destructive"
        })
      }
    }

    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange, podTypeFilter, activityFilter])

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

          {/* Create Pod Wizard */}
          <CreatePodWizard
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSuccess={(podId) => {
              loadUserPods()
              // Optionally navigate to the new pod
              // router.push(`/pods/${podId}`)
            }}
          />

          <PodTabs activeTab={activeTab} onTabChange={handleTabChange}>
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
                        You haven't created or joined any learning pods yet
                      </p>
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
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-2">Recent Activity</h2>
                    <p className="text-slate-500 dark:text-slate-400">Latest updates from your learning pods</p>
                  </div>

                  <PodActivityFeed 
                    showPodName={true}
                    limit={15}
                    className="lg:col-span-2"
                  />
                </section>
              </LearningPodsErrorBoundary>
            </TabsContent>

            <TabsContent value="analytics">
              <Suspense fallback={
                <div className="space-y-12">
                  {/* Overview Stats */}
                  <div className="space-y-8">
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
                  </div>

                  {/* Performance Charts */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-96" />
                    </div>
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

                  {/* Member Activity */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-96" />
                    </div>
                    <Card className="p-6">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-96 w-full" />
                      </div>
                    </Card>
                  </div>
                </div>
              }>
                <LearningPodsErrorBoundary>
                  <div className="space-y-12">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-light text-slate-900 dark:text-white">Pod Analytics</h2>
                      <div className="flex items-center gap-4">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Time range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={podTypeFilter} onValueChange={setPodTypeFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Pod type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="family">Family Pods</SelectItem>
                            <SelectItem value="friends">Friend Groups</SelectItem>
                            <SelectItem value="classroom">Classrooms</SelectItem>
                            <SelectItem value="study_group">Study Groups</SelectItem>
                            <SelectItem value="campaign">Campaign Groups</SelectItem>
                            <SelectItem value="organization">Organizations</SelectItem>
                            <SelectItem value="book_club">Book Clubs</SelectItem>
                            <SelectItem value="debate_team">Debate Teams</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={activityFilter} onValueChange={setActivityFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Activity status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Pods</SelectItem>
                            <SelectItem value="active">Active Pods</SelectItem>
                            <SelectItem value="inactive">Inactive Pods</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <AggregatePodAnalytics />
                  </div>
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