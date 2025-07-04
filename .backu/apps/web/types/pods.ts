export interface JoinRequest {
  id: string
  user_name: string
  user_email: string
  pod_name: string
  pod_id: string
  requested_at: string
  message?: string
}

export interface PodActivity {
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

export interface PodTheme {
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

export interface PodAchievement {
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

export interface LearningPod {
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

export interface Pod {
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

export interface PodStats {
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