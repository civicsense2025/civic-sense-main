import { Database } from '@/lib/types/database'

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  isUnlocked: boolean
  unlockedAt?: Date
  category: string
  tier: number
  points: number
  requirements: {
    type: string
    value: number
  }[]
}

export type AchievementProgress = {
  userId: string
  achievementId: string
  progress: number
  isUnlocked: boolean
  unlockedAt?: Date
}

export type AchievementCategory = {
  id: string
  name: string
  description: string
  icon: string
}

export type UserProgress = Database['public']['Tables']['user_progress']['Row'] 