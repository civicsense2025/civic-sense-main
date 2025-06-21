export interface QuizAttempt {
  id: string
  user_id: string | null
  guest_token: string | null
  session_id: string
  game_mode: string
  platform: 'web' | 'mobile'
  streak_count: number
  max_streak: number
  total_time_seconds: number
  correct_count: number
  question_count: number
  category: string | null
  skill_id: string | null
  mode_settings: Record<string, any>
  response_data: Record<string, any>
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      quiz_attempts: {
        Row: QuizAttempt
        Insert: Omit<QuizAttempt, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<QuizAttempt, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: {
      civics_test_attempts: {
        Row: QuizAttempt
      }
      multiplayer_attempts: {
        Row: QuizAttempt
      }
      practice_attempts: {
        Row: QuizAttempt
      }
    }
  }
} 