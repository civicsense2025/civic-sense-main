"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { 
  Crown, 
  Calendar, 
  Settings, 
  Trophy, 
  Heart, 
  Lightbulb, 
  BookOpen,
  Sparkles,
  Shield,
  Accessibility,
  Target,
  Users,
  Activity,
  TrendingUp,
  MoreHorizontal,
  Edit,
  UserX,
  Archive,
  Smile
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

interface PodCardProps {
  pod: LearningPod
  showDescription?: boolean
  showActivity?: boolean
  showMembers?: boolean
  showRole?: boolean
  showJoinCode?: boolean
  className?: string
  onEmojiClick?: (podId: string, emoji: string) => void
  onManageClick?: (podId: string) => void
  onEditTitle?: (podId: string, currentTitle: string) => void
  onTransferPod?: (podId: string) => void
  onArchivePod?: (podId: string) => void
}

export function PodCard({ 
  pod, 
  showDescription = true, 
  showActivity = true, 
  showMembers = true, 
  showRole = true,
  showJoinCode = false,
  className,
  onEmojiClick,
  onManageClick,
  onEditTitle,
  onTransferPod,
  onArchivePod
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
      case 'competitive': return <Trophy className="h-3 w-3" />
      case 'collaborative': return <Heart className="h-3 w-3" />
      case 'exploratory': return <Lightbulb className="h-3 w-3" />
      case 'structured': return <BookOpen className="h-3 w-3" />
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
      case 'high_contrast': return <Accessibility className="h-3 w-3" />
      case 'sensory_friendly': return <Heart className="h-3 w-3" />
      default: return <Shield className="h-3 w-3" />
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

  // Calculate meaningful stats
  const completionRate = pod.active_members && pod.member_count 
    ? Math.round((pod.active_members / pod.member_count) * 100) 
    : 0

  const unlockedFeatures = pod.unlocked_features?.length || 0
  const milestonesAchieved = Object.keys(pod.milestone_data || {}).length

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg border-0 bg-white dark:bg-slate-900",
      className
    )}>
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Emoji Button */}
              <EmojiPicker
                value={pod.theme?.emoji || pod.pod_emoji}
                onChange={(emoji) => onEmojiClick?.(pod.id, emoji)}
              >
                <button
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base sm:text-lg border-2 hover:scale-105 transition-transform flex-shrink-0"
                  style={themeColors || { 
                    backgroundColor: pod.pod_color ? `${pod.pod_color}15` : '#f1f5f9',
                    borderColor: pod.pod_color || '#e2e8f0'
                  }}
                  title="Click to change emoji"
                >
                  {pod.theme?.emoji || pod.pod_emoji || getPodTypeIcon(pod.pod_type)}
                </button>
              </EmojiPicker>
              
              {/* Pod Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/pods/${pod.id}`} className="block group">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                      {pod.pod_name}
                    </h3>
                    {pod.is_admin && (
                      <div className="relative group/crown">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/crown:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          Pod Admin • Manage members, settings & content
                        </div>
                      </div>
                    )}
                    {pod.theme && (
                      <Badge 
                        className="border-0 text-xs px-1.5 py-0.5 hidden sm:inline-flex"
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-light italic mb-1 line-clamp-1">
                      "{pod.pod_motto}"
                    </p>
                  )}
                  
                  {pod.family_name && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-light mb-2">
                      {pod.family_name}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge 
                      className="border-0 text-xs px-1.5 py-0.5"
                      style={{ 
                        backgroundColor: pod.pod_color ? `${pod.pod_color}15` : undefined,
                        color: pod.pod_color || undefined,
                        borderColor: pod.pod_color || undefined
                      }}
                    >
                      {pod.pod_type === 'custom' && pod.custom_type_label ? pod.custom_type_label : pod.pod_type}
                    </Badge>
                    
                    {showRole && (
                      <Badge className={cn(getRoleColor(pod.user_role), "border-0 text-xs px-1.5 py-0.5")}>
                        {pod.user_role}
                      </Badge>
                    )}
                    
                    {pod.personality_type && (
                      <Badge className={cn(getPersonalityColor(pod.personality_type), "border-0 text-xs px-1.5 py-0.5 hidden sm:flex items-center gap-1")}>
                        {getPersonalityIcon(pod.personality_type)}
                        <span className="hidden md:inline">{pod.personality_type}</span>
                      </Badge>
                    )}
                    
                    {pod.accessibility_mode && pod.accessibility_mode !== 'standard' && (
                      <Badge className="border-0 text-xs px-1.5 py-0.5 hidden sm:flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300">
                        {getAccessibilityIcon(pod.accessibility_mode)}
                        A11y
                      </Badge>
                    )}
                  </div>
                </Link>
              </div>
            </div>
            
            {/* More Menu & Join Code */}
            <div className="flex items-start gap-2 flex-shrink-0">
              {/* More Menu (only for admins) */}
              {pod.is_admin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="p-1">
                      <EmojiPicker
                        value={pod.theme?.emoji || pod.pod_emoji}
                        onChange={(emoji) => onEmojiClick?.(pod.id, emoji)}
                      >
                        <div className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">
                          <Smile className="h-4 w-4" />
                          Change Emoji
                        </div>
                      </EmojiPicker>
                    </div>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTitle?.(pod.id, pod.pod_name)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Title
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onTransferPod?.(pod.id)
                      }}
                      className="flex items-center gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Transfer Pod
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onArchivePod?.(pod.id)
                      }}
                      className="flex items-center gap-2 text-red-600 dark:text-red-400"
                    >
                      <Archive className="h-4 w-4" />
                      Archive Pod
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Join Code */}
              {showJoinCode && pod.is_admin && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Join Code</p>
                  <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {pod.join_code}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {showDescription && pod.description && (
            <Link href={`/pods/${pod.id}`} className="block">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-light line-clamp-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                {pod.description}
              </p>
            </Link>
          )}

          {/* Enhanced Features Display */}
          {(unlockedFeatures > 0 || milestonesAchieved > 0) && (
            <div className="flex items-center gap-3 text-xs">
              {unlockedFeatures > 0 && (
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    {unlockedFeatures} feature{unlockedFeatures !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {milestonesAchieved > 0 && (
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-green-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    {milestonesAchieved} milestone{milestonesAchieved !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Stats Grid - More Meaningful Pod Progress Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {showMembers && (
              <div className="text-center">
                <div className="text-lg sm:text-xl font-light text-slate-900 dark:text-white">
                  {pod.member_count}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                  Member{pod.member_count !== 1 ? 's' : ''}
                </p>
                {pod.active_members && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Users className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {pod.active_members} active
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-center">
              <div className="text-lg sm:text-xl font-light text-slate-900 dark:text-white">
                {completionRate}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light">Engagement</p>
                              <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">Active</span>
                </div>
            </div>
            
            {showActivity && (
              <div className="text-center">
                <div className="text-lg sm:text-xl font-light text-slate-900 dark:text-white">
                  {unlockedFeatures + milestonesAchieved}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-light">Progress</p>
                                 <div className="flex items-center justify-center gap-1 mt-1">
                   <Activity className="h-3 w-3 text-purple-600" />
                   <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                     {pod.last_activity ? 'Recent' : 'New'}
                   </span>
                 </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(pod.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onManageClick?.(pod.id)
              }}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Settings className="h-3 w-3" />
              <span>Manage</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 