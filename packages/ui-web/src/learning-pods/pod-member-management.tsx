// ============================================================================
// POD MEMBER MANAGEMENT
// ============================================================================

"use client"

import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { useAuth } from '@/components/auth/auth-provider'
import { 
  Users, 
  UserPlus, 
  Search, 
  Crown, 
  User, 
  ShieldCheck, 
  Settings, 
  MoreVertical,
  Mail,
  UserMinus,
  RefreshCw
} from 'lucide-react'
import { supabase } from "../lib/supabase/client"
import { cn } from '../../utils'
import { useToast } from "../components/ui/use-toast"

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface PodMember {
  user_id: string
  full_name: string
  email: string
  role: 'admin' | 'teacher' | 'parent' | 'student' | 'member' | 'moderator'
  membership_status: 'active' | 'pending' | 'suspended'
  joined_at: string
  last_active?: string
  quiz_count?: number
  accuracy_rate?: number
}

interface PodMemberManagementProps {
  podId: string
  userRole: string
  className?: string
}

interface JoinRequest {
  id: string
  user_id: string
  full_name: string
  email: string
  requested_at: string
  message?: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getRoleColor(role: string): string {
  const colorMap = {
    'admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'teacher': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'parent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'moderator': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'student': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    'member': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
  return colorMap[role as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}

function getRoleIcon(role: string) {
  const iconMap = {
    'admin': <Crown className="h-4 w-4" />,
    'teacher': <ShieldCheck className="h-4 w-4" />,
    'parent': <Users className="h-4 w-4" />,
    'moderator': <Settings className="h-4 w-4" />,
    'student': <User className="h-4 w-4" />,
    'member': <User className="h-4 w-4" />
  }
  return iconMap[role as keyof typeof iconMap] || <User className="h-4 w-4" />
}

function formatDateAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PodMemberManagement({ podId, userRole, className }: PodMemberManagementProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<PodMember[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [isInviting, setIsInviting] = useState(false)

  const canManageMembers = ['admin', 'teacher', 'parent'].includes(userRole)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const loadMembers = async () => {
    try {
      setIsLoading(true)
      // Use the singleton supabase client (already imported above)

      // Get pod members with their user details using the new view
      const { data: membersData, error: membersError } = await supabase
        .from('pod_member_details')
        .select('*')
        .eq('pod_id', podId)
        .order('joined_at', { ascending: false })

      if (membersError) throw membersError

      // Get member analytics for additional stats
      const { data: analyticsData } = await supabase
        .from('pod_member_analytics')
        .select('user_id, quiz_attempts, accuracy_rate, date_recorded')
        .eq('pod_id', podId)
        .gte('date_recorded', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      // Merge members with analytics
      const membersWithStats = membersData?.map((member: any) => {
        const userAnalytics = analyticsData?.filter(a => a.user_id === member.user_id) || []
        const totalQuizzes = userAnalytics.reduce((sum, a) => sum + (a.quiz_attempts || 0), 0)
        const avgAccuracy = userAnalytics.length > 0 
          ? Math.round(userAnalytics.reduce((sum, a) => sum + (a.accuracy_rate || 0), 0) / userAnalytics.length)
          : 0

        return {
          user_id: member.user_id,
          full_name: member.full_name,
          email: member.email,
          role: member.role,
          membership_status: member.membership_status,
          joined_at: member.joined_at,
          quiz_count: totalQuizzes,
          accuracy_rate: avgAccuracy
        }
      }) || []

      setMembers(membersWithStats)

      // Load join requests if user can manage members
      if (canManageMembers) {
        const { data: requestsData, error: requestsError } = await supabase
          .from('pod_join_requests')
          .select('id, user_id, message, created_at, user_email')
          .eq('pod_id', podId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (!requestsError && requestsData) {
          // Get user profiles separately to avoid the problematic join
          const userIds = requestsData.map(r => r.user_id).filter(Boolean)
          let userProfiles: any[] = []
          
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds)
            userProfiles = profilesData || []
          }

          const formattedRequests = requestsData.map(request => {
            const profile = userProfiles.find(p => p.id === request.user_id)
            return {
              id: request.id,
              user_id: request.user_id,
              full_name: profile?.full_name || 'Unknown User',
              email: request.user_email || 'No email provided',
              requested_at: request.created_at,
              message: request.message
            }
          })
          setJoinRequests(formattedRequests)
        }
      }

    } catch (error) {
      console.error('Error loading pod members:', error)
      toast({
        title: "Error",
        description: "Failed to load pod members. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      const response = await fetch(`/api/learning-pods/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        toast({
          title: action === 'approve' ? 'Request approved' : 'Request denied',
          description: `Join request has been ${action}d.`
        })
        loadMembers() // Refresh data
      } else {
        throw new Error(`Failed to ${action} request`)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} join request.`,
        variant: 'destructive'
      })
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive"
      })
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch('/api/learning-pods/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          podId,
          email: inviteEmail.trim(),
          role: inviteRole
        })
      })

      if (response.ok) {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${inviteEmail}`,
        })
        setInviteEmail('')
        setShowInviteDialog(false)
        loadMembers()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive"
      })
    } finally {
      setIsInviting(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [podId])

  // ============================================================================
  // FILTERING AND SEARCH
  // ============================================================================

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-2">Pod Members</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {members.length} member{members.length !== 1 ? 's' : ''} 
            {joinRequests.length > 0 && (
              <span className="ml-2">
                • {joinRequests.length} pending request{joinRequests.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {canManageMembers && (
          <div className="flex items-center gap-2">
            <Button onClick={loadMembers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="invite-email" className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="Enter email address..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="invite-role" className="block text-sm font-medium mb-2">
                      Role
                    </label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        {userRole === 'admin' && (
                          <>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowInviteDialog(false)}
                      disabled={isInviting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleInviteMember} disabled={isInviting}>
                      {isInviting ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Join Requests */}
      {joinRequests.length > 0 && canManageMembers && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
            Pending Join Requests ({joinRequests.length})
          </h3>
          <div className="space-y-3">
            {joinRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {request.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {request.full_name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {request.email} • {formatDateAgo(request.requested_at)}
                    </p>
                    {request.message && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        "{request.message}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleJoinRequest(request.id, 'deny')}
                  >
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleJoinRequest(request.id, 'approve')}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.user_id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {member.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {member.full_name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {member.email}
                  </p>
                </div>
              </div>
              
              {canManageMembers && member.user_id !== user?.id && (
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={getRoleColor(member.role)}>
                  <span className="flex items-center gap-1">
                    {getRoleIcon(member.role)}
                    {member.role}
                  </span>
                </Badge>
                {member.membership_status === 'pending' && (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div>Joined {formatDateAgo(member.joined_at)}</div>
                {member.quiz_count !== undefined && (
                  <div>
                    {member.quiz_count} quiz{member.quiz_count !== 1 ? 'es' : ''} completed
                    {member.accuracy_rate !== undefined && member.accuracy_rate > 0 && (
                      <span> • {member.accuracy_rate}% accuracy</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && searchTerm && (
        <Card className="p-6">
          <div className="text-center space-y-2">
            <Users className="h-12 w-12 mx-auto text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              No members found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              No members match your search criteria.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
} 