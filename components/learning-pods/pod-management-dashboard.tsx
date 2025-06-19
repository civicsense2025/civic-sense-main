"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Users, 
  Shield, 
  BarChart3, 
  UserPlus,
  Crown,
  Baby,
  GraduationCap,
  AlertTriangle,
  Copy,
  Check,
  X,
  Edit,
  Save,
  RotateCcw,
  Clock,
  Eye,
  MessageSquare,
  School,
  ArrowLeft,
  Trophy,
  Heart,
  Lightbulb,
  BookOpen,
  Accessibility,
  Sparkles,
  Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { EnhancedPodAnalytics } from './enhanced-pod-analytics'
import Link from 'next/link'

interface PodMember {
  id: string
  user_id: string
  name: string
  email: string
  role: 'admin' | 'parent' | 'organizer' | 'teacher' | 'member' | 'child' | 'student'
  joined_at: string
  last_active?: string
  status: 'active' | 'pending' | 'suspended'
  avatar?: string
  individual_settings?: MemberSettings
}

interface PodSettings {
  pod_name: string
  pod_type: 'family' | 'friends' | 'classroom' | 'study_group' | 'campaign' | 'organization' | 'book_club' | 'debate_team'
  description?: string
  family_name?: string
  content_filter_level: 'none' | 'light' | 'moderate' | 'strict'
  is_public: boolean
  join_code: string
  
  // Enhanced personalization fields
  personality_type?: 'competitive' | 'collaborative' | 'exploratory' | 'structured'
  theme_id?: string
  accessibility_mode?: 'standard' | 'high_contrast' | 'sensory_friendly'
  pod_emoji?: string
  pod_color?: string
  pod_slug?: string
  pod_motto?: string
  
  // Time Management
  daily_time_limit_minutes?: number
  allowed_start_time?: string
  allowed_end_time?: string
  allowed_days?: number[]
  
  // Feature Access
  can_access_multiplayer: boolean
  can_access_chat: boolean
  can_share_progress: boolean
  can_view_leaderboards: boolean
  require_parent_approval_for_friends: boolean
  
  // Monitoring
  send_progress_reports: boolean
  report_frequency: 'daily' | 'weekly' | 'monthly'
  alert_on_inappropriate_content: boolean
  track_detailed_activity: boolean
}

interface MemberSettings {
  // Individual overrides for pod-wide settings
  override_time_limits?: boolean
  daily_time_limit_minutes?: number
  allowed_start_time?: string
  allowed_end_time?: string
  
  // Individual content settings
  override_content_filter?: boolean
  content_filter_level?: 'none' | 'light' | 'moderate' | 'strict'
  blocked_categories?: string[]
  max_difficulty_level?: number
  
  // Individual feature access
  override_feature_access?: boolean
  can_access_multiplayer?: boolean
  can_access_chat?: boolean
  can_share_progress?: boolean
  can_view_leaderboards?: boolean
  
  // Individual monitoring
  override_monitoring?: boolean
  send_progress_reports?: boolean
  report_frequency?: 'daily' | 'weekly' | 'monthly'
  alert_on_inappropriate_content?: boolean
}

interface Pod {
  id: string
  pod_name: string
  pod_type: string
  family_name?: string
  join_code: string
  member_count: number
  user_role: string
  is_admin: boolean
  created_at: string
  settings: PodSettings
  members: PodMember[]
}

interface PodManagementDashboardProps {
  podId: string
}

export function PodManagementDashboard({ podId }: PodManagementDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [pod, setPod] = useState<Pod | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedMember, setSelectedMember] = useState<PodMember | null>(null)
  const [copiedJoinCode, setCopiedJoinCode] = useState(false)

  const [podSettings, setPodSettings] = useState<PodSettings | null>(null)
  const [availableThemes, setAvailableThemes] = useState<PodTheme[]>([])
  const [themesLoading, setThemesLoading] = useState(false)

  // Load themes when component mounts
  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    try {
      setThemesLoading(true)
      // Mock themes for demo - in real app, fetch from API
      const mockThemes: PodTheme[] = [
        {
          id: 'constitution',
          name: 'constitution',
          display_name: 'Constitutional Scholar',
          emoji: '📜',
          primary_color: '#8B4513',
          secondary_color: '#F4E4BC',
          description: 'Classic theme inspired by founding documents',
          is_seasonal: false
        },
        {
          id: 'democracy',
          name: 'democracy',
          display_name: 'Democratic Spirit',
          emoji: '🗳️',
          primary_color: '#1E40AF',
          secondary_color: '#DBEAFE',
          description: 'Modern democracy and voting theme',
          is_seasonal: false
        },
        {
          id: 'justice',
          name: 'justice',
          display_name: 'Justice League',
          emoji: '⚖️',
          primary_color: '#7C2D12',
          secondary_color: '#FED7AA',
          description: 'Justice and law theme',
          is_seasonal: false
        },
        {
          id: 'halloween_democracy',
          name: 'halloween_democracy',
          display_name: 'Spooky Civics',
          emoji: '🎃',
          primary_color: '#EA580C',
          secondary_color: '#000000',
          description: 'Halloween-themed democracy education',
          is_seasonal: true
        }
      ]
      setAvailableThemes(mockThemes)
    } catch (error) {
      console.error('Error loading themes:', error)
    } finally {
      setThemesLoading(false)
    }
  }

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

  useEffect(() => {
    if (user) {
      loadPodDetails()
    } else {
      // Show demo data for non-authenticated users
      setPod(getMockPod())
      setPodSettings(getMockPod().settings)
      setIsLoading(false)
    }
  }, [podId, user])

  const getMockPod = (): Pod => ({
    id: podId,
    pod_name: "Smith Family Learning Pod",
    pod_type: "family",
    family_name: "The Smith Family",
    join_code: "SMITH123",
    member_count: 4,
    user_role: "admin",
    is_admin: true,
    created_at: "2024-01-15T00:00:00Z",
    settings: {
      pod_name: "Smith Family Learning Pod",
      pod_type: "family",
      description: "A safe space for the Smith family to learn about civics together",
      family_name: "The Smith Family",
      content_filter_level: "moderate",
      is_public: false,
      join_code: "SMITH123",
      
      // Enhanced personalization fields with demo data
      personality_type: "collaborative",
      theme_id: "democracy",
      accessibility_mode: "standard",
      pod_emoji: "👨‍👩‍👧‍👦",
      pod_color: "#1E40AF",
      pod_slug: "smith-family-learners",
      pod_motto: "Learning together, growing stronger",
      
      daily_time_limit_minutes: 60,
      allowed_start_time: "15:00",
      allowed_end_time: "20:00",
      allowed_days: [1, 2, 3, 4, 5, 6, 7],
      can_access_multiplayer: true,
      can_access_chat: false,
      can_share_progress: true,
      can_view_leaderboards: true,
      require_parent_approval_for_friends: true,
      send_progress_reports: true,
      report_frequency: "weekly",
      alert_on_inappropriate_content: true,
      track_detailed_activity: true
    },
    members: [
      {
        id: "member-1",
        user_id: "user-1",
        name: "Sarah Smith",
        email: "sarah@smith.com",
        role: "admin",
        joined_at: "2024-01-15T00:00:00Z",
        status: "active",
        last_active: "2024-06-19T10:30:00Z"
      },
      {
        id: "member-2",
        user_id: "user-2",
        name: "John Smith",
        email: "john@smith.com",
        role: "parent",
        joined_at: "2024-01-15T00:00:00Z",
        status: "active",
        last_active: "2024-06-18T18:45:00Z"
      },
      {
        id: "member-3",
        user_id: "user-3",
        name: "Emma Smith",
        email: "emma@smith.com",
        role: "child",
        joined_at: "2024-01-16T00:00:00Z",
        status: "active",
        last_active: "2024-06-19T16:20:00Z",
        individual_settings: {
          override_time_limits: true,
          daily_time_limit_minutes: 45,
          override_content_filter: false,
          override_feature_access: true,
          can_access_chat: false,
          override_monitoring: false
        }
      },
      {
        id: "member-4",
        user_id: "user-4",
        name: "Jake Smith",
        email: "jake@smith.com",
        role: "child",
        joined_at: "2024-01-16T00:00:00Z",
        status: "active",
        last_active: "2024-06-19T14:15:00Z"
      }
    ]
  })

  const loadPodDetails = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/learning-pods/${podId}`, {
        credentials: 'include' // Include authentication cookies
      })
      
      if (!response.ok) {
        // Show mock data if API fails
        setPod(getMockPod())
        setPodSettings(getMockPod().settings)
        toast({
          title: "Using demo data",
          description: "Showing sample pod data for demonstration.",
        })
        return
      }
      
      const data = await response.json()
      
      // Transform API response to match our component interface
      const transformedPod: Pod = {
        id: data.pod.id,
        pod_name: data.pod.pod_name,
        pod_type: data.pod.pod_type,
        family_name: data.pod.family_name,
        join_code: data.pod.join_code,
        member_count: data.pod.member_count,
        user_role: data.pod.user_role,
        is_admin: data.pod.is_admin,
        created_at: data.pod.created_at,
        settings: data.pod.settings,
        members: data.pod.members.map((member: any) => ({
          id: member.id,
          user_id: member.user_id,
          name: member.name,
          email: member.email,
          role: member.role,
          joined_at: member.joined_at,
          status: member.status,
          last_active: member.last_active,
          individual_settings: member.individual_settings
        }))
      }
      
      setPod(transformedPod)
      setPodSettings(data.pod.settings)
    } catch (error) {
      console.error('Error loading pod details:', error)
      setPod(getMockPod())
      setPodSettings(getMockPod().settings)
      toast({
        title: "Using demo data",
        description: "Showing sample pod data for demonstration.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePodSettings = (updates: Partial<PodSettings>) => {
    if (podSettings) {
      setPodSettings({ ...podSettings, ...updates })
      setHasUnsavedChanges(true)
    }
  }

  const updateMemberSettings = (memberId: string, settings: Partial<MemberSettings>) => {
    if (pod) {
      const updatedMembers = pod.members.map(member => 
        member.id === memberId 
          ? { ...member, individual_settings: { ...member.individual_settings, ...settings } }
          : member
      )
      setPod({ ...pod, members: updatedMembers })
      setHasUnsavedChanges(true)
    }
  }

  const savePodSettings = async () => {
    try {
      if (!podSettings || !pod) return

      const response = await fetch(`/api/learning-pods/${podId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pod_settings: podSettings,
          member_settings: pod.members
            .filter(member => member.individual_settings)
            .map(member => ({
              user_id: member.user_id,
              ...member.individual_settings
            }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast({
        title: "Settings saved",
        description: "Pod settings have been updated successfully.",
      })
      setHasUnsavedChanges(false)
      
      // Reload pod details to get the latest data
      await loadPodDetails()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedJoinCode(true)
      toast({
        title: `${type} copied!`,
        description: "Share this with people you want to invite.",
      })
      setTimeout(() => setCopiedJoinCode(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually.",
        variant: "destructive"
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-purple-600" />
      case 'parent': return <Users className="h-4 w-4 text-blue-600" />
      case 'organizer': return <Settings className="h-4 w-4 text-orange-600" />
      case 'teacher': return <School className="h-4 w-4 text-green-600" />
      case 'child': return <Baby className="h-4 w-4 text-pink-600" />
      case 'student': return <GraduationCap className="h-4 w-4 text-indigo-600" />
      default: return <Users className="h-4 w-4 text-slate-600" />
    }
  }

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'admin': 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      'parent': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      'organizer': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      'teacher': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
      'member': 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
      'child': 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
      'student': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
    }
    return colorMap[role] || 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
      case 'pending': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
      case 'suspended': return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
    }
  }

  const getPersonalityIcon = (personality?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'competitive': <Trophy className="h-5 w-5 text-yellow-600" />,
      'collaborative': <Heart className="h-5 w-5 text-pink-600" />,
      'exploratory': <Lightbulb className="h-5 w-5 text-blue-600" />,
      'structured': <BookOpen className="h-5 w-5 text-green-600" />
    }
    return personality ? iconMap[personality] : <Users className="h-5 w-5" />
  }

  const getPersonalityColor = (personality?: string) => {
    switch (personality) {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading pod details...</p>
        </div>
      </div>
    )
  }

  if (!pod || !podSettings) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Pod not found</h3>
        <p className="text-slate-500 dark:text-slate-400 font-light mb-8">
          This pod may have been deleted or you don't have access to it.
        </p>
        <Button asChild>
          <Link href="/pods">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pods
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/pods">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pods
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-light text-slate-900 dark:text-white">
              {pod.pod_name}
            </h1>
            {pod.family_name && (
              <p className="text-lg text-slate-500 dark:text-slate-400 font-light">
                {pod.family_name}
              </p>
            )}
          </div>
        </div>
        
        {hasUnsavedChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={savePodSettings}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-light text-slate-900 dark:text-white">
              {pod.member_count}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Members</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6 text-center">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-light text-slate-900 dark:text-white capitalize">
              {podSettings.content_filter_level}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Filter Level</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6 text-center">
            <code className="text-lg font-mono tracking-wider text-slate-900 dark:text-white">
              {pod.join_code}
            </code>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light mt-2">Join Code</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(pod.join_code, 'Join code')}
              className="mt-2 h-8"
            >
              {copiedJoinCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-light text-slate-900 dark:text-white">
              {pod.members.filter(m => m.status === 'active').length}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-slate-100 dark:bg-slate-800 h-12">
          <TabsTrigger value="members" className="gap-2 font-light">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="personalization" className="gap-2 font-light">
            <Palette className="h-4 w-4" />
            Personalization
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 font-light">
            <Settings className="h-4 w-4" />
            Pod Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 font-light">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="safety" className="gap-2 font-light">
            <Shield className="h-4 w-4" />
            Safety
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Pod Members ({pod.members.length})
            </h2>
                            <div className="flex gap-2">
                  {/* Show classroom sync if pod was created from classroom */}
                  {pod.pod_type === 'classroom' && (
                    <Button variant="outline">
                      <School className="h-4 w-4 mr-2" />
                      Sync from Classroom
                    </Button>
                  )}
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </Button>
                </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pod.members.map((member) => (
              <Card key={member.id} className="border-0 bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {member.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {member.email}
                        </p>
                        {member.last_active && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Last active: {new Date(member.last_active).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={cn(getRoleColor(member.role), "border-0")}>
                        {member.role}
                      </Badge>
                      <Badge className={cn(getStatusColor(member.status), "border-0")}>
                        {member.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMember(member)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                  
                  {member.individual_settings && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Individual Settings Active:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {member.individual_settings.override_time_limits && (
                          <Badge variant="outline" className="text-xs">
                            Custom Time Limits
                          </Badge>
                        )}
                        {member.individual_settings.override_content_filter && (
                          <Badge variant="outline" className="text-xs">
                            Custom Content Filter
                          </Badge>
                        )}
                        {member.individual_settings.override_feature_access && (
                          <Badge variant="outline" className="text-xs">
                            Custom Feature Access
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-6">
          <h2 className="text-2xl font-light text-slate-900 dark:text-white">
            Pod Personalization
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personality & Theme */}
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Personality & Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personality Type Selection */}
                <div className="space-y-4">
                  <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Personality</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Choose how your pod approaches learning</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { 
                        type: 'collaborative', 
                        label: 'Collaborative', 
                        desc: 'Learn together, support each other',
                        icon: <Heart className="h-5 w-5" />,
                        color: 'text-pink-600'
                      },
                      { 
                        type: 'competitive', 
                        label: 'Competitive', 
                        desc: 'Friendly challenges motivate us',
                        icon: <Trophy className="h-5 w-5" />,
                        color: 'text-yellow-600'
                      },
                      { 
                        type: 'exploratory', 
                        label: 'Exploratory', 
                        desc: 'Discover new ideas together',
                        icon: <Lightbulb className="h-5 w-5" />,
                        color: 'text-blue-600'
                      },
                      { 
                        type: 'structured', 
                        label: 'Structured', 
                        desc: 'Step-by-step organized learning',
                        icon: <BookOpen className="h-5 w-5" />,
                        color: 'text-green-600'
                      }
                    ].map((personality) => (
                      <div
                        key={personality.type}
                        onClick={() => updatePodSettings({ personality_type: personality.type as any })}
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer transition-all',
                          podSettings.personality_type === personality.type
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('text-lg', personality.color)}>
                            {personality.icon}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white text-sm">
                              {personality.label}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {personality.desc}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="space-y-4">
                  <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Theme</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Choose a visual theme for your pod</p>
                  {themesLoading ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50"></div>
                      Loading themes...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {availableThemes.map((theme) => (
                        <div
                          key={theme.id}
                          onClick={() => updatePodSettings({ 
                            theme_id: theme.id,
                            pod_emoji: theme.emoji,
                            pod_color: theme.primary_color
                          })}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-all',
                            podSettings.theme_id === theme.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          )}
                          style={{
                            backgroundColor: podSettings.theme_id === theme.id 
                              ? `${theme.primary_color}10` 
                              : undefined
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{theme.emoji}</span>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {theme.display_name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {theme.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visual Customization */}
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-blue-600" />
                  Visual Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pod Emoji */}
                <div className="space-y-3">
                  <Label>Pod Emoji</Label>
                  <Input
                    value={podSettings.pod_emoji || ''}
                    onChange={(e) => updatePodSettings({ pod_emoji: e.target.value })}
                    placeholder="👥"
                    className="text-2xl text-center h-12 border-0 bg-white dark:bg-slate-800"
                    maxLength={2}
                  />
                </div>

                {/* Pod Color */}
                <div className="space-y-3">
                  <Label>Pod Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={podSettings.pod_color || '#3b82f6'}
                      onChange={(e) => updatePodSettings({ pod_color: e.target.value })}
                      className="w-16 h-12 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
                    />
                    <Input
                      value={podSettings.pod_color || ''}
                      onChange={(e) => updatePodSettings({ pod_color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1 font-mono border-0 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Pod Motto */}
                <div className="space-y-3">
                  <Label>Pod Motto</Label>
                  <Input
                    value={podSettings.pod_motto || ''}
                    onChange={(e) => updatePodSettings({ pod_motto: e.target.value })}
                    placeholder="Learning together, growing stronger"
                    className="border-0 bg-white dark:bg-slate-800"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    A short phrase that captures your pod's mission
                  </p>
                </div>

                {/* Pod Slug */}
                <div className="space-y-3">
                  <Label>Custom URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      civicsense.com/pods/
                    </span>
                    <Input
                      value={podSettings.pod_slug || ''}
                      onChange={(e) => updatePodSettings({ pod_slug: e.target.value })}
                      placeholder="my-awesome-pod"
                      className="flex-1 border-0 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Accessibility Mode */}
                <div className="space-y-4">
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
                          onClick={() => updatePodSettings({ accessibility_mode: mode.value as any })}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-all',
                            podSettings.accessibility_mode === mode.value
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn(
                              'h-5 w-5',
                              podSettings.accessibility_mode === mode.value ? 'text-green-600' : 'text-slate-400'
                            )} />
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {mode.label}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {mode.desc}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-2xl font-light text-slate-900 dark:text-white">
            Pod Settings
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Settings */}
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pod Name</Label>
                  <Input
                    value={podSettings.pod_name}
                    onChange={(e) => updatePodSettings({ pod_name: e.target.value })}
                    className="border-0 bg-white dark:bg-slate-800"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={podSettings.description || ''}
                    onChange={(e) => updatePodSettings({ description: e.target.value })}
                    className="border-0 bg-white dark:bg-slate-800"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Content Filter Level</Label>
                  <Select 
                    value={podSettings.content_filter_level} 
                    onValueChange={(value) => updatePodSettings({ content_filter_level: value as any })}
                  >
                    <SelectTrigger className="border-0 bg-white dark:bg-slate-800">
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
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Pod</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Allow others to discover and join
                    </p>
                  </div>
                  <Switch
                    checked={podSettings.is_public}
                    onCheckedChange={(checked) => updatePodSettings({ is_public: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Feature Access */}
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle>Feature Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Multiplayer Quizzes</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Allow members to play together
                    </p>
                  </div>
                  <Switch
                    checked={podSettings.can_access_multiplayer}
                    onCheckedChange={(checked) => updatePodSettings({ can_access_multiplayer: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Chat Features</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Enable messaging between members
                    </p>
                  </div>
                  <Switch
                    checked={podSettings.can_access_chat}
                    onCheckedChange={(checked) => updatePodSettings({ can_access_chat: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Progress Sharing</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Share achievements with pod members
                    </p>
                  </div>
                  <Switch
                    checked={podSettings.can_share_progress}
                    onCheckedChange={(checked) => updatePodSettings({ can_share_progress: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Leaderboards</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Show ranking within the pod
                    </p>
                  </div>
                  <Switch
                    checked={podSettings.can_view_leaderboards}
                    onCheckedChange={(checked) => updatePodSettings({ can_view_leaderboards: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <EnhancedPodAnalytics podId={pod.id} />
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <h2 className="text-2xl font-light text-slate-900 dark:text-white">
            Safety & Monitoring
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle>Monitoring Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Progress Reports</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Receive regular progress updates
                    </p>
                  </div>
                  <Switch
                    checked={podSettings.send_progress_reports}
                    onCheckedChange={(checked) => updatePodSettings({ send_progress_reports: checked })}
                  />
                </div>
                
                {podSettings.send_progress_reports && (
                  <div className="space-y-2">
                    <Label>Report Frequency</Label>
                    <Select 
                      value={podSettings.report_frequency} 
                      onValueChange={(value) => updatePodSettings({ report_frequency: value as any })}
                    >
                      <SelectTrigger className="border-0 bg-white dark:bg-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Content Alerts</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Alert when inappropriate content is accessed
                    </p>
                  </div>
                  <Switch
                    checked={podSettings.alert_on_inappropriate_content}
                    onCheckedChange={(checked) => updatePodSettings({ alert_on_inappropriate_content: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Detailed Activity Tracking</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Track all quiz attempts and time spent
                    </p>
                  </div>
                  <Switch
                    checked={podSettings.track_detailed_activity}
                    onCheckedChange={(checked) => updatePodSettings({ track_detailed_activity: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle>Safety Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pod Safety Recommendations:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Verify all members before allowing access</li>
                      <li>• Monitor chat activity for inappropriate content</li>
                      <li>• Use appropriate content filtering for younger members</li>
                      <li>• Review progress reports regularly</li>
                      <li>• Set individual time limits as needed</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Individual Member Settings Modal (placeholder) */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Individual Settings for {selectedMember.name}
                <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Individual settings override pod-wide settings for this specific member.
              </p>
              
              {/* Time Management Override */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Override Time Limits</Label>
                  <Switch
                    checked={selectedMember.individual_settings?.override_time_limits || false}
                    onCheckedChange={(checked) => 
                      updateMemberSettings(selectedMember.id, { override_time_limits: checked })
                    }
                  />
                </div>
                
                {selectedMember.individual_settings?.override_time_limits && (
                  <div className="ml-4 space-y-2">
                    <Label>Daily Time Limit (minutes)</Label>
                    <Input
                      type="number"
                      value={selectedMember.individual_settings?.daily_time_limit_minutes || 60}
                      onChange={(e) => 
                        updateMemberSettings(selectedMember.id, { 
                          daily_time_limit_minutes: parseInt(e.target.value) 
                        })
                      }
                      className="border-0 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>
              
              {/* Feature Access Override */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Override Feature Access</Label>
                  <Switch
                    checked={selectedMember.individual_settings?.override_feature_access || false}
                    onCheckedChange={(checked) => 
                      updateMemberSettings(selectedMember.id, { override_feature_access: checked })
                    }
                  />
                </div>
                
                {selectedMember.individual_settings?.override_feature_access && (
                  <div className="ml-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Can Access Chat</Label>
                      <Switch
                        checked={selectedMember.individual_settings?.can_access_chat || false}
                        onCheckedChange={(checked) => 
                          updateMemberSettings(selectedMember.id, { can_access_chat: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Can Access Multiplayer</Label>
                      <Switch
                        checked={selectedMember.individual_settings?.can_access_multiplayer || false}
                        onCheckedChange={(checked) => 
                          updateMemberSettings(selectedMember.id, { can_access_multiplayer: checked })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setSelectedMember(null)} className="flex-1">
                  Save Settings
                </Button>
                <Button variant="outline" onClick={() => setSelectedMember(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 