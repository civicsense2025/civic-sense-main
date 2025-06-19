"use client"

import { useState, useEffect, Suspense, lazy } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Users, 
  Search, 
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
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

// Lazy loaded components
const LearningPodManager = lazy(() => import('@/components/learning-pods/family-pod-manager').then(module => ({ default: module.LearningPodManager })))
const PodDiscovery = lazy(() => import('@/components/learning-pods/pod-discovery').then(module => ({ default: module.PodDiscovery })))
const AggregatePodAnalytics = lazy(() => import('@/components/learning-pods/aggregate-pod-analytics').then(module => ({ default: module.AggregatePodAnalytics })))
const LearningPodsErrorBoundary = lazy(() => import('@/components/learning-pods/error-boundary').then(module => ({ default: module.LearningPodsErrorBoundary })))

// Temporary placeholder for notifications - will be implemented separately
const PodNotificationsAndActivity = () => (
  <div className="text-center py-24">
    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
      <Bell className="h-8 w-8 text-slate-400" />
    </div>
    <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Notifications Coming Soon</h3>
    <p className="text-slate-500 dark:text-slate-400 font-light">
      Join request notifications and activity feeds will be available here.
    </p>
  </div>
)

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

// Large Pod Card Component
interface PodCardProps {
  pod: LearningPod
  showDescription?: boolean
  showActivity?: boolean
  showMembers?: boolean
  showRole?: boolean
  showJoinCode?: boolean
  className?: string
}

function PodCard({ 
  pod, 
  showDescription = true, 
  showActivity = true, 
  showMembers = true, 
  showRole = true,
  showJoinCode = false,
  className 
}: PodCardProps) {
  const getPodTypeIcon = (type: string) => {
    switch (type) {
      case 'family': return '👨‍👩‍👧‍👦'
      case 'friends': return '👥'
      case 'classroom': return '🏫'
      case 'study_group': return '📚'
      case 'campaign': return '🗳️'
      case 'organization': return '🏢'
      case 'book_club': return '📖'
      case 'debate_team': return '⚖️'
      case 'custom': return '⭐'
      default: return '👥'
    }
  }

  const getFilterLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
      case 'light': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
      case 'moderate': return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'strict': return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
    }
  }

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'admin': 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      'parent': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      'organizer': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      'teacher': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
      'member': 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
    }
    return colorMap[role] || 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
  }

  const getPersonalityIcon = (type?: string) => {
    switch (type) {
      case 'competitive': return <Trophy className="h-4 w-4" />
      case 'collaborative': return <Heart className="h-4 w-4" />
      case 'exploratory': return <Lightbulb className="h-4 w-4" />
      case 'structured': return <BookOpen className="h-4 w-4" />
      default: return null
    }
  }

  const getPersonalityColor = (type?: string) => {
    switch (type) {
      case 'competitive': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20'
      case 'collaborative': return 'text-pink-600 bg-pink-50 dark:bg-pink-950/20'
      case 'exploratory': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
      case 'structured': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-950/20'
    }
  }

  const getAccessibilityIcon = (mode?: string) => {
    switch (mode) {
      case 'high_contrast': return <Accessibility className="h-4 w-4" />
      case 'sensory_friendly': return <Heart className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  // Use theme colors if available
  const themeColors = pod.theme ? {
    backgroundColor: `${pod.theme.primary_color}15`,
    borderColor: pod.theme.primary_color
  } : pod.pod_color ? {
    backgroundColor: `${pod.pod_color}15`,
    borderColor: pod.pod_color
  } : undefined

  return (
    <Link href={`/pods/${pod.id}`} className="group block">
      <Card className={cn(
        "transition-all duration-200 group-hover:shadow-lg border-0 bg-white dark:bg-slate-900",
        className
      )}>
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl border-2"
                  style={themeColors || { 
                    backgroundColor: pod.pod_color ? `${pod.pod_color}15` : '#f1f5f9',
                    borderColor: pod.pod_color || '#e2e8f0'
                  }}
                >
                  {pod.theme?.emoji || pod.pod_emoji || getPodTypeIcon(pod.pod_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-medium text-slate-900 dark:text-white">
                      {pod.pod_name}
                    </h3>
                    {pod.theme && (
                      <Badge 
                        className="border-0 text-xs px-2 py-1"
                        style={{ 
                          backgroundColor: `${pod.theme.primary_color}20`,
                          color: pod.theme.primary_color
                        }}
                      >
                        {pod.theme.display_name}
                      </Badge>
                    )}
                  </div>
                  {pod.pod_motto && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light italic mb-1 line-clamp-1">
                      "{pod.pod_motto}"
                    </p>
                  )}
                  {pod.family_name && (
                    <p className="text-slate-500 dark:text-slate-400 font-light">
                      {pod.family_name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      className="border-0 text-xs"
                      style={{ 
                        backgroundColor: pod.pod_color ? `${pod.pod_color}15` : undefined,
                        color: pod.pod_color || undefined,
                        borderColor: pod.pod_color || undefined
                      }}
                    >
                      {pod.pod_type === 'custom' && pod.custom_type_label ? pod.custom_type_label : pod.pod_type}
                    </Badge>
                    {showRole && (
                      <Badge className={cn(getRoleColor(pod.user_role), "border-0 text-xs")}>
                        {pod.user_role}
                      </Badge>
                    )}
                    {pod.is_admin && <Crown className="h-4 w-4 text-yellow-500" />}
                    
                    {/* Personality Type Badge */}
                    {pod.personality_type && (
                      <Badge className={cn(getPersonalityColor(pod.personality_type), "border-0 text-xs flex items-center gap-1")}>
                        {getPersonalityIcon(pod.personality_type)}
                        {pod.personality_type}
                      </Badge>
                    )}
                    
                    {/* Accessibility Mode Badge */}
                    {pod.accessibility_mode && pod.accessibility_mode !== 'standard' && (
                      <Badge className="border-0 text-xs flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300">
                        {getAccessibilityIcon(pod.accessibility_mode)}
                        A11y
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {showJoinCode && pod.is_admin && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Join Code</p>
                  <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {pod.join_code}
                  </code>
                </div>
              )}
            </div>

            {/* Description */}
            {showDescription && pod.description && (
              <p className="text-slate-600 dark:text-slate-400 font-light line-clamp-2">
                {pod.description}
              </p>
            )}

            {/* Enhanced Features Display */}
            {(pod.unlocked_features?.length > 0 || Object.keys(pod.milestone_data || {}).length > 0) && (
              <div className="space-y-2">
                {pod.unlocked_features?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {pod.unlocked_features.length} unlocked feature{pod.unlocked_features.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {Object.keys(pod.milestone_data || {}).length > 0 && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Milestones achieved
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
              {showMembers && (
                <div className="text-center">
                  <div className="text-2xl font-light text-slate-900 dark:text-white">
                    {pod.member_count}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                    Member{pod.member_count !== 1 ? 's' : ''}
                  </p>
                  {pod.active_members && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {pod.active_members} active
                    </p>
                  )}
                </div>
              )}
              
              <div className="text-center">
                <div className="text-2xl font-light text-slate-900 dark:text-white capitalize">
                  {pod.content_filter_level}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Filter</p>
              </div>
              
              {showActivity && (
                <div className="text-center">
                  <div className="text-2xl font-light text-slate-900 dark:text-white">
                    {pod.last_activity 
                      ? new Date(pod.last_activity).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : new Date(pod.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                    {pod.last_activity ? 'Last Activity' : 'Created'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(pod.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  Manage
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function PodsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('my-pods')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [pods, setPods] = useState<LearningPod[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      
      <main className="container mx-auto px-6 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Pods-specific header with create pod action */}
          <div className="text-center space-y-6 mb-16 sm:mb-20">
            <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-white tracking-tight">
              My Learning Pods
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-3xl mx-auto">
              Create and manage safe learning spaces for families, friends, classrooms, and organizations
            </p>
            
            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-4 pt-4">
              <Button 
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-full px-8 py-3 h-12 font-light"
                onClick={() => {
                  if (user) {
                    setShowCreateForm(true)
                  } else {
                    toast({
                      title: "Sign in required",
                      description: "Please sign in to create learning pods.",
                      variant: "destructive"
                    })
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Pod
              </Button>
              
              <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full px-6 py-3 h-12 font-light border border-slate-200 dark:border-slate-700">
                <Link href="/create-pod-from-classroom">
                  <School className="h-4 w-4 mr-2" />
                  Sync with Google Classroom
                </Link>
              </Button>
            </div>
          </div>

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
                          <div className="flex items-center gap-2 text-slate-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50"></div>
                            Loading themes...
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

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-12 bg-slate-100 dark:bg-slate-800 h-12">
              <TabsTrigger value="my-pods" className="gap-2 font-light">
                <Users className="h-4 w-4" />
                My Pods
              </TabsTrigger>
              <TabsTrigger value="discover" className="gap-2 font-light">
                <Search className="h-4 w-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 font-light">
                <Bell className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 font-light">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-pods">
              <Suspense fallback={
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400 font-light">Loading your pods...</p>
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
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto mb-4"></div>
                      <p className="text-slate-600 dark:text-slate-400 font-light">Loading your pods...</p>
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
                        />
                      ))}
                    </div>
                  )}
                </LearningPodsErrorBoundary>
              </Suspense>
            </TabsContent>

            <TabsContent value="discover">
              <Suspense fallback={
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400 font-light">Loading discoverable pods...</p>
                </div>
              }>
                <LearningPodsErrorBoundary>
                  <PodDiscovery />
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
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400 font-light">Loading analytics...</p>
                </div>
              }>
                <LearningPodsErrorBoundary>
                  <AggregatePodAnalytics />
                </LearningPodsErrorBoundary>
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 