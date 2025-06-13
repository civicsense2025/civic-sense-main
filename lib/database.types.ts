export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          date: string
          description: string
          sources: Json | null
          topic_id: string
          topic_title: string
          why_this_matters: string
        }
        Insert: {
          date: string
          description: string
          sources?: Json | null
          topic_id: string
          topic_title: string
          why_this_matters: string
        }
        Update: {
          date?: string
          description?: string
          sources?: Json | null
          topic_id?: string
          topic_title?: string
          why_this_matters?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      question_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: string
          question_id: string
          rating: string | null
          report_details: string | null
          report_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: string
          question_id: string
          rating?: string | null
          report_details?: string | null
          report_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: string
          question_id?: string
          rating?: string | null
          report_details?: string | null
          report_reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_feedback_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_feedback_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_topics: {
        Row: {
          categories: Json
          created_at: string | null
          date: string
          day_of_week: string
          description: string
          emoji: string
          id: string
          is_active: boolean | null
          topic_id: string
          topic_title: string
          updated_at: string | null
          why_this_matters: string
        }
        Insert: {
          categories?: Json
          created_at?: string | null
          date: string
          day_of_week: string
          description: string
          emoji: string
          id?: string
          is_active?: boolean | null
          topic_id: string
          topic_title: string
          updated_at?: string | null
          why_this_matters: string
        }
        Update: {
          categories?: Json
          created_at?: string | null
          date?: string
          day_of_week?: string
          description?: string
          emoji?: string
          id?: string
          is_active?: boolean | null
          topic_id?: string
          topic_title?: string
          updated_at?: string | null
          why_this_matters?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string | null
          difficulty_level: number | null
          explanation: string
          hint: string
          id: string
          is_active: boolean | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question: string
          question_number: number
          question_type: string
          sources: Json | null
          tags: Json | null
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty_level?: number | null
          explanation: string
          hint: string
          id?: string
          is_active?: boolean | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question: string
          question_number: number
          question_type: string
          sources?: Json | null
          tags?: Json | null
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty_level?: number | null
          explanation?: string
          hint?: string
          id?: string
          is_active?: boolean | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question?: string
          question_number?: number
          question_type?: string
          sources?: Json | null
          tags?: Json | null
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string | null
          current_streak: number | null
          favorite_categories: Json | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          total_correct_answers: number | null
          total_questions_answered: number | null
          total_quizzes_completed: number | null
          updated_at: string | null
          user_id: string
          weekly_goal: number | null
          weekly_completed: number | null
          week_start_date: string | null
          preferred_categories: Json | null
          adaptive_difficulty: boolean | null
          learning_style: string | null
          total_xp: number | null
          current_level: number | null
          xp_to_next_level: number | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          favorite_categories?: Json | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          total_correct_answers?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          updated_at?: string | null
          user_id: string
          weekly_goal?: number | null
          weekly_completed?: number | null
          week_start_date?: string | null
          preferred_categories?: Json | null
          adaptive_difficulty?: boolean | null
          learning_style?: string | null
          total_xp?: number | null
          current_level?: number | null
          xp_to_next_level?: number | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          favorite_categories?: Json | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          total_correct_answers?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_goal?: number | null
          weekly_completed?: number | null
          week_start_date?: string | null
          preferred_categories?: Json | null
          adaptive_difficulty?: boolean | null
          learning_style?: string | null
          total_xp?: number | null
          current_level?: number | null
          xp_to_next_level?: number | null
        }
        Relationships: []
      }
      user_question_responses: {
        Row: {
          attempt_id: string
          created_at: string | null
          hint_used: boolean | null
          id: string
          is_correct: boolean
          question_id: string
          time_spent_seconds: number | null
          user_answer: string
        }
        Insert: {
          attempt_id: string
          created_at?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct: boolean
          question_id: string
          time_spent_seconds?: number | null
          user_answer: string
        }
        Update: {
          attempt_id?: string
          created_at?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct?: boolean
          question_id?: string
          time_spent_seconds?: number | null
          user_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "user_quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          score: number | null
          started_at: string | null
          time_spent_seconds: number | null
          topic_id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          topic_id: string
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          topic_id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      user_learning_goals: {
        Row: {
          id: string
          user_id: string
          goal_type: string
          target_value: number
          category: string | null
          difficulty_level: number | null
          is_active: boolean | null
          target_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: string
          target_value: number
          category?: string | null
          difficulty_level?: number | null
          is_active?: boolean | null
          target_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: string
          target_value?: number
          category?: string | null
          difficulty_level?: number | null
          is_active?: boolean | null
          target_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_custom_decks: {
        Row: {
          id: string
          user_id: string
          deck_name: string
          description: string | null
          deck_type: string
          preferences: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          deck_name: string
          description?: string | null
          deck_type?: string
          preferences?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          deck_name?: string
          description?: string | null
          deck_type?: string
          preferences?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_deck_content: {
        Row: {
          id: string
          deck_id: string
          topic_id: string | null
          question_id: string | null
          priority_score: number | null
          added_at: string | null
        }
        Insert: {
          id?: string
          deck_id: string
          topic_id?: string | null
          question_id?: string | null
          priority_score?: number | null
          added_at?: string | null
        }
        Update: {
          id?: string
          deck_id?: string
          topic_id?: string | null
          question_id?: string | null
          priority_score?: number | null
          added_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_deck_content_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "user_custom_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_deck_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      user_category_skills: {
        Row: {
          id: string
          user_id: string
          category: string
          skill_level: number | null
          questions_attempted: number | null
          questions_correct: number | null
          last_practiced_at: string | null
          mastery_level: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          skill_level?: number | null
          questions_attempted?: number | null
          questions_correct?: number | null
          last_practiced_at?: string | null
          mastery_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          skill_level?: number | null
          questions_attempted?: number | null
          questions_correct?: number | null
          last_practiced_at?: string | null
          mastery_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_data: Json | null
          earned_at: string | null
          is_milestone: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_data?: Json | null
          earned_at?: string | null
          is_milestone?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_data?: Json | null
          earned_at?: string | null
          is_milestone?: boolean | null
        }
        Relationships: []
      }
      user_streak_history: {
        Row: {
          id: string
          user_id: string
          streak_type: string
          streak_value: number
          category: string | null
          start_date: string
          end_date: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          streak_type: string
          streak_value: number
          category?: string | null
          start_date: string
          end_date?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          streak_type?: string
          streak_value?: number
          category?: string | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_question_memory: {
        Row: {
          id: string
          user_id: string
          question_id: string
          easiness_factor: number | null
          repetition_count: number | null
          interval_days: number | null
          next_review_date: string | null
          last_reviewed_at: string | null
          consecutive_correct: number | null
          total_attempts: number | null
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          easiness_factor?: number | null
          repetition_count?: number | null
          interval_days?: number | null
          next_review_date?: string | null
          last_reviewed_at?: string | null
          consecutive_correct?: number | null
          total_attempts?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          easiness_factor?: number | null
          repetition_count?: number | null
          interval_days?: number | null
          next_review_date?: string | null
          last_reviewed_at?: string | null
          consecutive_correct?: number | null
          total_attempts?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_question_memory_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      question_feedback_stats: {
        Row: {
          category: string | null
          last_feedback_at: string | null
          most_common_report_reason: string | null
          quality_score: number | null
          question_id: string | null
          question_number: number | null
          rating_percentage: number | null
          thumbs_down_count: number | null
          thumbs_up_count: number | null
          topic_id: string | null
          total_ratings: number | null
          total_reports: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Convenient type exports for easier usage
export type DbQuestionTopic = Tables<'question_topics'>
export type DbQuestion = Tables<'questions'>
export type DbQuestionFeedback = Tables<'question_feedback'>
export type DbUserQuizAttempt = Tables<'user_quiz_attempts'>
export type DbUserProgress = Tables<'user_progress'>
export type DbUserQuestionResponse = Tables<'user_question_responses'>
export type DbProfile = Tables<'profiles'>
export type DbCategory = Tables<'categories'>
export type DbEvent = Tables<'events'>

// Insert types
export type DbQuestionTopicInsert = TablesInsert<'question_topics'>
export type DbQuestionInsert = TablesInsert<'questions'>
export type DbQuestionFeedbackInsert = TablesInsert<'question_feedback'>
export type DbUserQuizAttemptInsert = TablesInsert<'user_quiz_attempts'>
export type DbUserProgressInsert = TablesInsert<'user_progress'>
export type DbUserQuestionResponseInsert = TablesInsert<'user_question_responses'>
export type DbProfileInsert = TablesInsert<'profiles'>
export type DbCategoryInsert = TablesInsert<'categories'>
export type DbEventInsert = TablesInsert<'events'>

// Update types
export type DbQuestionTopicUpdate = TablesUpdate<'question_topics'>
export type DbQuestionUpdate = TablesUpdate<'questions'>
export type DbQuestionFeedbackUpdate = TablesUpdate<'question_feedback'>
export type DbUserQuizAttemptUpdate = TablesUpdate<'user_quiz_attempts'>
export type DbUserProgressUpdate = TablesUpdate<'user_progress'>
export type DbUserQuestionResponseUpdate = TablesUpdate<'user_question_responses'>
export type DbProfileUpdate = TablesUpdate<'profiles'>
export type DbCategoryUpdate = TablesUpdate<'categories'>
export type DbEventUpdate = TablesUpdate<'events'>

// Add new type exports for the new tables
export type DbUserLearningGoal = Tables<'user_learning_goals'>
export type DbUserCustomDeck = Tables<'user_custom_decks'>
export type DbUserDeckContent = Tables<'user_deck_content'>
export type DbUserCategorySkill = Tables<'user_category_skills'>
export type DbUserAchievement = Tables<'user_achievements'>
export type DbUserStreakHistory = Tables<'user_streak_history'>
export type DbUserQuestionMemory = Tables<'user_question_memory'>

// Insert types
export type DbUserLearningGoalInsert = TablesInsert<'user_learning_goals'>
export type DbUserCustomDeckInsert = TablesInsert<'user_custom_decks'>
export type DbUserDeckContentInsert = TablesInsert<'user_deck_content'>
export type DbUserCategorySkillInsert = TablesInsert<'user_category_skills'>
export type DbUserAchievementInsert = TablesInsert<'user_achievements'>
export type DbUserStreakHistoryInsert = TablesInsert<'user_streak_history'>
export type DbUserQuestionMemoryInsert = TablesInsert<'user_question_memory'>

// Update types
export type DbUserLearningGoalUpdate = TablesUpdate<'user_learning_goals'>
export type DbUserCustomDeckUpdate = TablesUpdate<'user_custom_decks'>
export type DbUserDeckContentUpdate = TablesUpdate<'user_deck_content'>
export type DbUserCategorySkillUpdate = TablesUpdate<'user_category_skills'>
export type DbUserAchievementUpdate = TablesUpdate<'user_achievements'>
export type DbUserStreakHistoryUpdate = TablesUpdate<'user_streak_history'>
export type DbUserQuestionMemoryUpdate = TablesUpdate<'user_question_memory'>
