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
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          score: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          score?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          score?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          title: string
          url: string
          description: string | null
          tags: string[]
          created_at: string
          updated_at: string
          is_favorite: boolean
          category: string | null
          source_type: 'article' | 'video' | 'podcast' | 'other'
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          url: string
          description?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          is_favorite?: boolean
          category?: string | null
          source_type?: 'article' | 'video' | 'podcast' | 'other'
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          url?: string
          description?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          is_favorite?: boolean
          category?: string | null
          source_type?: 'article' | 'video' | 'podcast' | 'other'
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
