export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Core tables
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          display_name: string | null
          avatar_url: string | null
          settings: Json | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          settings?: Json | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          settings?: Json | null
        }
      }

      // Source metadata table
      source_metadata: {
        Row: {
          id: string
          source_url: string
          title: string
          description: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source_url: string
          title: string
          description?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source_url?: string
          title?: string
          description?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }

      // Quiz system tables
      question_topics: {
        Row: {
          id: string
          topic_id: string
          topic_title: string
          description: string
          why_this_matters: string
          emoji: string
          date: string
          day_of_week: string
          categories: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          topic_title: string
          description: string
          why_this_matters: string
          emoji: string
          date: string
          day_of_week: string
          categories?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          topic_title?: string
          description?: string
          why_this_matters?: string
          emoji?: string
          date?: string
          day_of_week?: string
          categories?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      questions: {
        Row: {
          id: string
          topic_id: string
          question_number: number
          question_type: 'multiple_choice' | 'true_false' | 'short_answer'
          category: string
          question: string
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          correct_answer: string
          hint: string
          explanation: string
          tags: Json
          sources: Json
          difficulty_level: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          question_number: number
          question_type: 'multiple_choice' | 'true_false' | 'short_answer'
          category: string
          question: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          correct_answer: string
          hint: string
          explanation: string
          tags?: Json
          sources?: Json
          difficulty_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          question_number?: number
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer'
          category?: string
          question?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          correct_answer?: string
          hint?: string
          explanation?: string
          tags?: Json
          sources?: Json
          difficulty_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      user_quiz_attempts: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          started_at: string
          completed_at: string | null
          score: number | null
          total_questions: number
          correct_answers: number
          time_spent_seconds: number | null
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          total_questions: number
          correct_answers?: number
          time_spent_seconds?: number | null
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          total_questions?: number
          correct_answers?: number
          time_spent_seconds?: number | null
          is_completed?: boolean
          created_at?: string
        }
      }

      user_progress: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          total_quizzes_completed: number
          total_questions_answered: number
          total_correct_answers: number
          favorite_categories: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          total_quizzes_completed?: number
          total_questions_answered?: number
          total_correct_answers?: number
          favorite_categories?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          total_quizzes_completed?: number
          total_questions_answered?: number
          total_correct_answers?: number
          favorite_categories?: Json
          created_at?: string
          updated_at?: string
        }
      }

      question_feedback: {
        Row: {
          id: string
          question_id: string
          user_id: string
          rating: 'up' | 'down'
          reason: string | null
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          user_id: string
          rating: 'up' | 'down'
          reason?: string | null
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          user_id?: string
          rating?: 'up' | 'down'
          reason?: string | null
          details?: string | null
          created_at?: string
        }
      }

      // Gamification tables
      user_category_skills: {
        Row: {
          id: string
          user_id: string
          category: string
          skill_level: number
          total_questions: number
          correct_answers: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          skill_level?: number
          total_questions?: number
          correct_answers?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          skill_level?: number
          total_questions?: number
          correct_answers?: number
          created_at?: string
          updated_at?: string
        }
      }

      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          unlocked_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
          created_at?: string
        }
      }

      user_custom_decks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      user_deck_content: {
        Row: {
          id: string
          deck_id: string
          question_id: string
          created_at: string
        }
        Insert: {
          id?: string
          deck_id: string
          question_id: string
          created_at?: string
        }
        Update: {
          id?: string
          deck_id?: string
          question_id?: string
          created_at?: string
        }
      }

      user_question_memory: {
        Row: {
          id: string
          user_id: string
          question_id: string
          times_seen: number
          times_correct: number
          last_seen_at: string
          next_review_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          times_seen?: number
          times_correct?: number
          last_seen_at?: string
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          times_seen?: number
          times_correct?: number
          last_seen_at?: string
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      user_streak_history: {
        Row: {
          id: string
          user_id: string
          streak_length: number
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          streak_length: number
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          streak_length?: number
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }

      user_learning_goals: {
        Row: {
          id: string
          user_id: string
          goal_type: string
          target_value: number
          current_value: number
          deadline: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: string
          target_value: number
          current_value?: number
          deadline?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: string
          target_value?: number
          current_value?: number
          deadline?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
