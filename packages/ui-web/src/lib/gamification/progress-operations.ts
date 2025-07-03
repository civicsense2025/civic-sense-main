import { supabase } from '@/lib/supabase/client'
import { Achievement, AchievementProgress, UserProgress } from './types'

export const enhancedProgressOperations = {
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user progress:', error)
      return null
    }

    return data
  },

  async updateUserProgress(userId: string, progress: Partial<UserProgress>): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .from('user_progress')
      .update(progress)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user progress:', error)
      return null
    }

    return data
  },

  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const { data, error } = await supabase
      .from('achievement_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching achievement progress:', error)
      return []
    }

    return data || []
  },

  async updateAchievementProgress(
    userId: string,
    achievementId: string,
    progress: number,
    isUnlocked: boolean = false
  ): Promise<AchievementProgress | null> {
    const { data, error } = await supabase
      .from('achievement_progress')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        progress,
        is_unlocked: isUnlocked,
        unlocked_at: isUnlocked ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating achievement progress:', error)
      return null
    }

    return data
  },

  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')

    if (error) {
      console.error('Error fetching achievements:', error)
      return []
    }

    return data || []
  }
} 