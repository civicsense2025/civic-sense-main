"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { 
  Users, 
  Plus, 
  Settings, 
  Shield, 
  Clock, 
  Eye, 
  UserPlus,
  Crown,
  Baby,
  GraduationCap,
  AlertTriangle,
  Copy,
  Check,
  X,
  Share2,
  ExternalLink,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Twitter,
  Facebook,
  Mail,
  Link as LinkIcon
} from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'
import { useAuth } from '@civicsense/ui-web'
import { useToast } from '@civicsense/ui-web'
import { PodAnalytics } from './pod-analytics'
import { LearningPodsErrorBoundary } from './error-boundary'
import Link from 'next/link'

interface LearningPod {
  id: string
  pod_name: string
  pod_type: 'family' | 'friends' | 'classroom' | 'study_group' | 'campaign' | 'organization' | 'book_club' | 'debate_team'
  family_name?: string
  join_code: string
  member_count: number
  user_role: 'admin' | 'parent' | 'child' | 'member'
  is_admin: boolean
  content_filter_level: 'none' | 'light' | 'moderate' | 'strict'
  created_at: string
}

interface InviteLink {
  id: string
  invite_code: string
  invite_url: string
  description: string
  max_uses: number | null
  current_uses: number
  expires_at: string
  is_active: boolean
  created_at: string
}

export function LearningPodManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [pods, setPods] = useState<LearningPod[]>([])
  const [selectedPod, setSelectedPod] = useState<LearningPod | null>(null)
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copiedJoinCode, setCopiedJoinCode] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Create pod form state
  const [createForm, setCreateForm] = useState({
    podName: '',
    podType: 'family' as const,
    familyName: '',
    description: '',
    contentFilterLevel: 'moderate' as const
  })

  // Load user's pods
  useEffect(() => {
    if (user) {
      loadUserPods()
    } else {
      // If no user, stop loading and show empty state
      setIsLoading(false)
      setPods([])
    }
  }, [user])

  // Load invite links when a pod is selected
  useEffect(() => {
    if (selectedPod && selectedPod.is_admin) {
      loadInviteLinks()
    }
  }, [selectedPod])

  // Listen for create pod trigger from page header
  useEffect(() => {
    const handleCreatePod = () => {
      if (user) {
        setShowCreateForm(true)
      }
    }

    window.addEventListener('triggerCreatePod', handleCreatePod)
    return () => window.removeEventListener('triggerCreatePod', handleCreatePod)
  }, [user])

  // Mock data for demo purposes
  const getMockPods = (): LearningPod[] => [
    {
      id: 'demo-pod-1',
      pod_name: 'Smith Family Learning Pod',
      pod_type: 'family',
      family_name: 'The Smith Family',
      join_code: 'SMITH123',
      member_count: 4,
      user_role: 'admin',
      is_admin: true,
      content_filter_level: 'moderate',
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'demo-pod-2',
      pod_name: 'Democracy Study Group',
      pod_type: 'study_group',
      join_code: 'STUDY456',
      member_count: 8,
      user_role: 'member',
      is_admin: false,
      content_filter_level: 'light',
      created_at: '2024-02-01T00:00:00Z'
    }
  ]

  const loadUserPods = async () => {
    if (!user) {
      setIsLoading(false)
      setPods([])
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/learning-pods', {
        credentials: 'include' // Include authentication cookies
      })
      
      if (!response.ok) {
        setPods([])
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      
      if (data.pods) {
        setPods(data.pods)
        if (data.pods.length > 0 && !selectedPod) {
          setSelectedPod(data.pods[0])
        }
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

  const loadInviteLinks = async () => {
    if (!selectedPod) return
    
    try {
      const response = await fetch(`/api/learning-pods/${selectedPod.id}/invite`, {
        credentials: 'include' // Include authentication cookies
      })
      const data = await response.json()
      
      if (response.ok) {
        setInviteLinks(data.inviteLinks || [])
      }
    } catch (error) {
      console.error('Failed to load invite links:', error)
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

    try {
      const response = await fetch('/api/learning-pods', {
        method: 'POST',
        credentials: 'include', // Include authentication cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
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
          familyName: '',
          description: '',
          contentFilterLevel: 'moderate'
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

  const createInviteLink = async () => {
    if (!selectedPod) return

    try {
      const response = await fetch(`/api/learning-pods/${selectedPod.id}/invite`, {
        method: 'POST',
        credentials: 'include', // Include authentication cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Join ${selectedPod.pod_name}`,
          maxUses: null,
          expiresInHours: 720, // 30 days
          allowedRoles: ['member'],
          requireApproval: false
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Invite link created!",
          description: "Share this link to invite new members.",
        })
        loadInviteLinks()
      } else {
        toast({
          title: "Error creating invite link",
          description: data.error || "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to create invite link:', error)
      toast({
        title: "Error creating invite link",
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

  const shareViaEmail = (inviteUrl: string, podName: string) => {
    const subject = `Join ${podName} on CivicSense`
    const body = `I'd like to invite you to join our learning pod "${podName}" on CivicSense.\n\nClick here to join: ${inviteUrl}\n\nCivicSense helps us learn about civics together in a safe, collaborative environment.`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const shareViaTwitter = (inviteUrl: string, podName: string) => {
    const text = `Join me in "${podName}" - a learning pod on @CivicSense where we explore civics together! ${inviteUrl}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`)
  }

  const shareViaFacebook = (inviteUrl: string) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`)
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading learning pods...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">

      {/* Create Pod Form - Clean design */}
      {user && showCreateForm && (
        <div className="max-w-2xl mx-auto">
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
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={createPod}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white h-12 font-light"
                >
                  Create Pod
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 h-12 font-light border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pods List - Clean grid layout */}
      {!user ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Sign in required</h3>
          <p className="text-slate-500 dark:text-slate-400 font-light mb-8 max-w-md mx-auto">
            Learning pods are only available to authenticated users. Please sign in to create and manage your learning pods.
          </p>
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
            onClick={() => setShowCreateForm(true)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-full px-8 py-3 h-12 font-light"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Pod
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pods.map((pod) => (
              <Link href={`/pods/${pod.id}`} key={pod.id} className="group block">
                <Card 
                  className={cn(
                    "transition-all duration-200 group-hover:shadow-lg border-0 bg-slate-50 dark:bg-slate-900/50"
                  )}
                >
                  <CardContent className="p-8 relative">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{getPodTypeIcon(pod.pod_type)}</span>
                        {pod.is_admin && <Crown className="h-4 w-4 text-yellow-500" />}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white text-lg">
                          {pod.pod_name}
                        </h3>
                        {pod.family_name && (
                          <p className="text-slate-500 dark:text-slate-400 font-light">
                            {pod.family_name}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-light">
                          {pod.member_count} member{pod.member_count !== 1 ? 's' : ''}
                        </span>
                        <Badge className={cn(getFilterLevelColor(pod.content_filter_level), "border-0")}>
                          {pod.content_filter_level}
                        </Badge>
                      </div>
                      
                      {/* Make the entire card area clickable */}
                      {pod.is_admin && (
                        <div className="absolute top-3 right-3 z-10">
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(pod.join_code, 'Join code')
                            }}
                          >
                            {copiedJoinCode ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick Overview for Selected Pod */}
          {selectedPod && (
            <div className="max-w-2xl mx-auto text-center">
              <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">{getPodTypeIcon(selectedPod.pod_type)}</span>
                      <h3 className="text-xl font-light text-slate-900 dark:text-white">
                        {selectedPod.pod_name}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-light text-slate-900 dark:text-white">
                          {selectedPod.member_count}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Members</p>
                      </div>
                      <div>
                        <div className="text-lg font-light text-slate-900 dark:text-white capitalize">
                          {selectedPod.content_filter_level}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Filter</p>
                      </div>
                      <div>
                        <div className="text-lg font-light text-slate-900 dark:text-white capitalize">
                          {selectedPod.user_role}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Your Role</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button asChild className="flex-1">
                        <Link href={`/pods/${selectedPod.id}`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Pod
                        </Link>
                      </Button>
                      {selectedPod.is_admin && (
                        <Button 
                          variant="outline"
                          onClick={() => copyToClipboard(selectedPod.join_code, 'Join code')}
                          className="px-4"
                        >
                          {copiedJoinCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                      Click "Manage Pod" for detailed settings, analytics, and member management
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 