// Re-export database types from shared package
export type { Database } from '@/lib/types/database'

// Export specific table types for convenience
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Common table types
export type User = Tables['users']['Row']
export type Profile = Tables['profiles']['Row']
export type UserProgress = Tables['user_progress']['Row']
export type QuizProgress = Tables['quiz_progress']['Row']
export type AchievementProgress = Tables['achievement_progress']['Row'] 