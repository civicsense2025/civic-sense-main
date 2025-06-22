'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Users, 
  Search, 
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Activity,
  TrendingUp,
  Shield,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Ban,
  UserPlus,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  phone: string | null
  user_metadata: any
  app_metadata: any
  email_verified: boolean
  role: 'user' | 'admin' | 'moderator'
  status: 'active' | 'suspended' | 'banned'
  profile?: {
    display_name?: string
    avatar_url?: string
    location?: string
  }
  stats?: {
    quiz_attempts: number
    survey_responses: number
    events_submitted: number
    last_activity: string | null
  }
}

interface UserFilters {
  search: string
  role: 'all' | 'user' | 'admin' | 'moderator'
  status: 'all' | 'active' | 'suspended' | 'banned'
  verified: 'all' | 'verified' | 'unverified'
  activity: 'all' | 'active_7d' | 'active_30d' | 'inactive'
}

interface UserActivity {
  user_id: string
  quiz_attempts: number
  survey_responses: number
  last_activity: string | null
  total_xp: number
}

interface UserStats {
  total_users: number
  active_users_30d: number
  new_users_7d: number
  verified_users: number
  admin_users: number
  user_growth_rate: number
}

const userRoles = [
  { value: 'all', label: 'All Users' },
  { value: 'user', label: 'Users' },
  { value: 'admin', label: 'Admins' },
  { value: 'moderator', label: 'Moderators' }
]

const userStatuses = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' }
]

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [userActivities, setUserActivities] = useState<Record<string, UserActivity>>({})
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'last_sign_in_at' | 'email'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    verified: 'all',
    activity: 'all'
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  const loadUsers = async () => {
    try {
      const supabase = createClient()
      
      // Note: In production, you'd need to use the Supabase Admin API or a server-side function
      // to access auth.users table. For now, we'll use a simplified approach.
      
      // Load user data from public tables that reference users
      const { data: userAttempts } = await supabase
        .from('user_quiz_attempts')
        .select('user_id, completed_at, score')
      
      const { data: surveyResponses } = await supabase
        .from('survey_responses')
        .select('user_id, created_at')
      
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('*')
      
      // Aggregate user activity data
      const activityMap: Record<string, UserActivity> = {}
      
      userAttempts?.forEach(attempt => {
        if (!activityMap[attempt.user_id]) {
          activityMap[attempt.user_id] = {
            user_id: attempt.user_id,
            quiz_attempts: 0,
            survey_responses: 0,
            last_activity: null,
            total_xp: 0
          }
        }
        activityMap[attempt.user_id].quiz_attempts++
        if (!activityMap[attempt.user_id].last_activity || 
            new Date(attempt.completed_at) > new Date(activityMap[attempt.user_id].last_activity!)) {
          activityMap[attempt.user_id].last_activity = attempt.completed_at
        }
        activityMap[attempt.user_id].total_xp += attempt.score || 0
      })
      
      surveyResponses?.forEach(response => {
        if (!activityMap[response.user_id]) {
          activityMap[response.user_id] = {
            user_id: response.user_id,
            quiz_attempts: 0,
            survey_responses: 0,
            last_activity: null,
            total_xp: 0
          }
        }
        activityMap[response.user_id].survey_responses++
        if (!activityMap[response.user_id].last_activity || 
            new Date(response.created_at) > new Date(activityMap[response.user_id].last_activity!)) {
          activityMap[response.user_id].last_activity = response.created_at
        }
      })
      
      setUserActivities(activityMap)
      
      // For demo purposes, create mock user data
      // In production, you'd fetch this from auth.users via server-side function
      const mockUsers: User[] = Object.keys(activityMap).map(userId => ({
        id: userId,
        email: `user${userId.slice(-4)}@example.com`,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: activityMap[userId].last_activity,
        email_confirmed_at: new Date().toISOString(),
        phone: null,
        user_metadata: {},
        app_metadata: {},
        email_verified: true,
        role: 'user',
        status: 'active',
        profile: {
          display_name: `User ${userId.slice(-4)}`,
          location: 'New York, NY'
        },
        stats: {
          quiz_attempts: activityMap[userId].quiz_attempts,
          survey_responses: activityMap[userId].survey_responses,
          events_submitted: 0,
          last_activity: activityMap[userId].last_activity
        }
      }))
      
      setUsers(mockUsers)
      
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const supabase = createClient()
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      // Calculate stats from available data
      const stats: UserStats = {
        total_users: users.length,
        active_users_30d: Object.values(userActivities).filter(activity => 
          activity.last_activity && new Date(activity.last_activity) > new Date(thirtyDaysAgo)
        ).length,
        new_users_7d: users.filter(user => 
          new Date(user.created_at) > new Date(oneWeekAgo)
        ).length,
        verified_users: users.filter(user => user.email_confirmed_at).length,
        admin_users: users.filter(user => user.role === 'admin').length,
        user_growth_rate: 18.5
      }
      
      setStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        user.email.toLowerCase().includes(searchLower) ||
        user.profile?.display_name?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Role filter
    if (filters.role !== 'all' && user.role !== filters.role) return false

    // Status filter
    if (filters.status !== 'all' && user.status !== filters.status) return false

    // Verified filter
    if (filters.verified === 'verified' && !user.email_verified) return false
    if (filters.verified === 'unverified' && user.email_verified) return false

    // Activity filter
    if (filters.activity !== 'all') {
      const now = new Date()
      const lastActivity = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null
      
      if (filters.activity === 'active_7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (!lastActivity || lastActivity < sevenDaysAgo) return false
      } else if (filters.activity === 'active_30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (!lastActivity || lastActivity < thirtyDaysAgo) return false
      } else if (filters.activity === 'inactive') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (lastActivity && lastActivity > thirtyDaysAgo) return false
      }
    }

    return true
  }).sort((a, b) => {
    const aValue = a[sortBy] || ''
    const bValue = b[sortBy] || ''
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue)
    } else {
      return bValue.localeCompare(aValue)
    }
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>
      case 'moderator':
        return <Badge className="bg-blue-100 text-blue-800">Moderator</Badge>
      default:
        return <Badge variant="secondary">User</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>
      case 'banned':
        return <Badge className="bg-red-100 text-red-800">Banned</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) return 'Never'
    
    const now = new Date()
    const activity = new Date(lastActivity)
    const daysDiff = Math.floor((now.getTime() - activity.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) return 'Today'
    if (daysDiff === 1) return 'Yesterday'
    if (daysDiff < 7) return `${daysDiff} days ago`
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`
    return `${Math.floor(daysDiff / 30)} months ago`
  }

  const handleUserAction = async (userId: string, action: string) => {
    // In a real implementation, you'd call the appropriate API
    console.log(`Performing action ${action} on user ${userId}`)
    // Reload users after action
    await loadUsers()
  }

  const handleBulkAction = async (action: string) => {
    // In a real implementation, you'd call the appropriate API for bulk actions
    console.log(`Performing bulk action ${action} on users:`, selectedUsers)
    setSelectedUsers([])
    await loadUsers()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Users</h2>
          <p className="text-gray-600 mb-4">Unable to fetch user data</p>
          <Button onClick={loadUsers}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          User Management
        </h1>
        <p className="text-slate-600">
          Manage user accounts, permissions, and activity
        </p>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {stats.total_users.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-emerald-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{Math.round(stats.active_users_30d / stats.total_users * 100)}% growth
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {stats.active_users_30d.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  Last 30 days
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">New Users</CardTitle>
                <UserCheck className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {stats.new_users_7d}
                </div>
                <div className="text-xs text-slate-500">
                  Last 7 days
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Verified</CardTitle>
                <CheckCircle className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {Math.round((stats.verified_users / stats.total_users) * 100)}%
                </div>
                <div className="text-xs text-slate-500">
                  {stats.verified_users.toLocaleString()} users
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            {userRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            {userStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="created_at">Newest First</option>
            <option value="last_sign_in_at">Recent Activity</option>
            <option value="email">Email A-Z</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Users</CardTitle>
              <CardDescription>
                {filteredUsers.length} of {users.length} users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.profile?.display_name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-slate-900 truncate">
                      {user.profile?.display_name || user.email}
                    </h4>
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Active {getActivityStatus(user.last_sign_in_at)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{user.stats?.quiz_attempts || 0}</div>
                    <div className="text-xs text-slate-500">Quizzes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{user.stats?.survey_responses || 0}</div>
                    <div className="text-xs text-slate-500">Surveys</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{user.stats?.events_submitted || 0}</div>
                    <div className="text-xs text-slate-500">Events</div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleUserAction(user.id, user.status === 'active' ? 'suspend' : 'activate')}>
                      {user.status === 'active' ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Suspend
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    {!user.email_confirmed_at && (
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'verify')}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Verification
                      </DropdownMenuItem>
                    )}
                    {user.role === 'user' && (
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'promote')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Promote to Moderator
                      </DropdownMenuItem>
                    )}
                    {user.role === 'moderator' && (
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'demote')}>
                        <Users className="mr-2 h-4 w-4" />
                        Demote to User
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
                <p className="text-slate-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 