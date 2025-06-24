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
      ai_generation_jobs: {
        Row: {
          completed_at: string | null
          cost: number | null
          created_at: string
          error: string | null
          id: string
          input_data: Json | null
          progress: number | null
          provider: string
          results: Json | null
          status: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_data?: Json | null
          progress?: number | null
          provider: string
          results?: Json | null
          status?: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_data?: Json | null
          progress?: number | null
          provider?: string
          results?: Json | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      article_bias_analysis: {
        Row: {
          ai_analysis_version: string | null
          ai_confidence: number | null
          ai_reasoning: string | null
          analysis_method: string | null
          analyzed_at: string | null
          analyzer_id: string | null
          article_author: string | null
          article_title: string | null
          article_url: string
          confidence_level: number | null
          created_at: string | null
          detected_techniques: Json | null
          dimension_scores: Json
          emotional_language_score: number | null
          emotional_manipulation_score: number | null
          factual_accuracy_score: number | null
          factual_claims: Json | null
          id: string
          organization_id: string | null
          overall_bias_score: number | null
          published_at: string | null
          source_diversity_score: number | null
          source_metadata_id: string | null
        }
        Insert: {
          ai_analysis_version?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          analysis_method?: string | null
          analyzed_at?: string | null
          analyzer_id?: string | null
          article_author?: string | null
          article_title?: string | null
          article_url: string
          confidence_level?: number | null
          created_at?: string | null
          detected_techniques?: Json | null
          dimension_scores?: Json
          emotional_language_score?: number | null
          emotional_manipulation_score?: number | null
          factual_accuracy_score?: number | null
          factual_claims?: Json | null
          id?: string
          organization_id?: string | null
          overall_bias_score?: number | null
          published_at?: string | null
          source_diversity_score?: number | null
          source_metadata_id?: string | null
        }
        Update: {
          ai_analysis_version?: string | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          analysis_method?: string | null
          analyzed_at?: string | null
          analyzer_id?: string | null
          article_author?: string | null
          article_title?: string | null
          article_url?: string
          confidence_level?: number | null
          created_at?: string | null
          detected_techniques?: Json | null
          dimension_scores?: Json
          emotional_language_score?: number | null
          emotional_manipulation_score?: number | null
          factual_accuracy_score?: number | null
          factual_claims?: Json | null
          id?: string
          organization_id?: string | null
          overall_bias_score?: number | null
          published_at?: string | null
          source_diversity_score?: number | null
          source_metadata_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_bias_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "media_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_bias_analysis_source_metadata_id_fkey"
            columns: ["source_metadata_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "article_bias_analysis_source_metadata_id_fkey"
            columns: ["source_metadata_id"]
            isOneToOne: false
            referencedRelation: "source_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      assessed_entities: {
        Row: {
          created_at: string | null
          entity_name: string
          entity_slug: string
          entity_type: string
          id: string
          is_active: boolean | null
          iso_code: string | null
          metadata: Json | null
          parent_entity_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_name: string
          entity_slug: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          iso_code?: string | null
          metadata?: Json | null
          parent_entity_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_name?: string
          entity_slug?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          iso_code?: string | null
          metadata?: Json | null
          parent_entity_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessed_entities_parent_entity_id_fkey"
            columns: ["parent_entity_id"]
            isOneToOne: false
            referencedRelation: "assessed_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_analytics: {
        Row: {
          event_type: string | null
          final_score: number | null
          id: number
          metadata: Json | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event_type?: string | null
          final_score?: number | null
          id?: number
          metadata?: Json | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string | null
          final_score?: number | null
          id?: number
          metadata?: Json | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assessment_engagement: {
        Row: {
          assessment_id: string
          created_at: string | null
          engagement_data: Json | null
          engagement_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          engagement_data?: Json | null
          engagement_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          engagement_data?: Json | null
          engagement_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_engagement_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_evidence: {
        Row: {
          created_at: string | null
          credibility_score: number | null
          evidence_type: string
          excerpt: string | null
          id: string
          indicator_assessment_id: string
          relevance_notes: string | null
          source_date: string | null
          source_organization: string | null
          source_title: string
          source_url: string | null
        }
        Insert: {
          created_at?: string | null
          credibility_score?: number | null
          evidence_type: string
          excerpt?: string | null
          id?: string
          indicator_assessment_id: string
          relevance_notes?: string | null
          source_date?: string | null
          source_organization?: string | null
          source_title: string
          source_url?: string | null
        }
        Update: {
          created_at?: string | null
          credibility_score?: number | null
          evidence_type?: string
          excerpt?: string | null
          id?: string
          indicator_assessment_id?: string
          relevance_notes?: string | null
          source_date?: string | null
          source_organization?: string | null
          source_title?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_evidence_indicator_assessment_id_fkey"
            columns: ["indicator_assessment_id"]
            isOneToOne: false
            referencedRelation: "indicator_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_frameworks: {
        Row: {
          academic_sources: Json | null
          created_at: string | null
          created_by: string | null
          description: string
          framework_name: string
          framework_slug: string
          framework_type: string
          id: string
          is_active: boolean | null
          methodology_url: string | null
          scoring_system: Json
          updated_at: string | null
          version: string | null
        }
        Insert: {
          academic_sources?: Json | null
          created_at?: string | null
          created_by?: string | null
          description: string
          framework_name: string
          framework_slug: string
          framework_type: string
          id?: string
          is_active?: boolean | null
          methodology_url?: string | null
          scoring_system: Json
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          academic_sources?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          framework_name?: string
          framework_slug?: string
          framework_type?: string
          id?: string
          is_active?: boolean | null
          methodology_url?: string | null
          scoring_system?: Json
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string | null
          difficulty: number
          explanation: string | null
          friendly_explanation: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
          skill_id: string | null
          translations: Json | null
          updated_at: string | null
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty: number
          explanation?: string | null
          friendly_explanation?: string | null
          id?: string
          is_active?: boolean | null
          options: Json
          question: string
          skill_id?: string | null
          translations?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: number
          explanation?: string | null
          friendly_explanation?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
          skill_id?: string | null
          translations?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_scoring: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          recommended_content: string[] | null
          score_range_max: number
          score_range_min: number
          skill_level: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          recommended_content?: string[] | null
          score_range_max: number
          score_range_min: number
          skill_level: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          recommended_content?: string[] | null
          score_range_max?: number
          score_range_min?: number
          skill_level?: string
        }
        Relationships: []
      }
      assessment_summaries: {
        Row: {
          assessment_count: number | null
          average_score: number | null
          created_at: string | null
          data_quality_score: number | null
          end_date: string
          entity_id: string
          framework_id: string
          highest_score: number | null
          id: string
          indicators_improved: number | null
          indicators_triggered: number | null
          indicators_worsened: number | null
          lowest_score: number | null
          most_concerning_indicators: Json | null
          score_trend: string | null
          start_date: string
          summary_period: string
        }
        Insert: {
          assessment_count?: number | null
          average_score?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          end_date: string
          entity_id: string
          framework_id: string
          highest_score?: number | null
          id?: string
          indicators_improved?: number | null
          indicators_triggered?: number | null
          indicators_worsened?: number | null
          lowest_score?: number | null
          most_concerning_indicators?: Json | null
          score_trend?: string | null
          start_date: string
          summary_period: string
        }
        Update: {
          assessment_count?: number | null
          average_score?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          end_date?: string
          entity_id?: string
          framework_id?: string
          highest_score?: number | null
          id?: string
          indicators_improved?: number | null
          indicators_triggered?: number | null
          indicators_worsened?: number | null
          lowest_score?: number | null
          most_concerning_indicators?: Json | null
          score_trend?: string | null
          start_date?: string
          summary_period?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_summaries_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "assessed_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_summaries_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_date: string
          assessment_period: string | null
          assessor_name: string | null
          confidence_level: number | null
          created_at: string | null
          entity_id: string
          framework_id: string
          id: string
          methodology_notes: string | null
          overall_score: number | null
          overall_status: string | null
          published_at: string | null
          review_status: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_date: string
          assessment_period?: string | null
          assessor_name?: string | null
          confidence_level?: number | null
          created_at?: string | null
          entity_id: string
          framework_id: string
          id?: string
          methodology_notes?: string | null
          overall_score?: number | null
          overall_status?: string | null
          published_at?: string | null
          review_status?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string
          assessment_period?: string | null
          assessor_name?: string | null
          confidence_level?: number | null
          created_at?: string | null
          entity_id?: string
          framework_id?: string
          id?: string
          methodology_notes?: string | null
          overall_score?: number | null
          overall_status?: string | null
          published_at?: string | null
          review_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "assessed_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_requirements: {
        Row: {
          badge_id: string | null
          created_at: string | null
          id: string
          requirement_type: string
          requirement_value: Json
          updated_at: string | null
        }
        Insert: {
          badge_id?: string | null
          created_at?: string | null
          id?: string
          requirement_type: string
          requirement_value: Json
          updated_at?: string | null
        }
        Update: {
          badge_id?: string | null
          created_at?: string | null
          id?: string
          requirement_type?: string
          requirement_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badge_requirements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "skill_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_detection_patterns: {
        Row: {
          created_at: string | null
          dimension_id: string | null
          false_positive_rate: number | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          last_updated: string | null
          pattern_name: string
          pattern_regex: string | null
          pattern_type: string
          phrase_patterns: Json | null
          severity_weight: number | null
          times_detected: number | null
        }
        Insert: {
          created_at?: string | null
          dimension_id?: string | null
          false_positive_rate?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          last_updated?: string | null
          pattern_name: string
          pattern_regex?: string | null
          pattern_type: string
          phrase_patterns?: Json | null
          severity_weight?: number | null
          times_detected?: number | null
        }
        Update: {
          created_at?: string | null
          dimension_id?: string | null
          false_positive_rate?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          last_updated?: string | null
          pattern_name?: string
          pattern_regex?: string | null
          pattern_type?: string
          phrase_patterns?: Json | null
          severity_weight?: number | null
          times_detected?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bias_detection_patterns_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "bias_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_dimensions: {
        Row: {
          created_at: string | null
          description: string | null
          dimension_name: string
          dimension_slug: string
          display_order: number | null
          id: string
          is_active: boolean | null
          scale_type: string
          scale_values: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dimension_name: string
          dimension_slug: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          scale_type?: string
          scale_values: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dimension_name?: string
          dimension_slug?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          scale_type?: string
          scale_values?: Json
        }
        Relationships: []
      }
      bias_feedback: {
        Row: {
          agrees_with_assessment: boolean | null
          article_analysis_id: string | null
          created_at: string | null
          dimension_id: string | null
          evidence_urls: string[] | null
          feedback_text: string | null
          feedback_type: string
          guest_token: string | null
          helpfulness_score: number | null
          id: string
          ip_address: unknown | null
          is_spam: boolean | null
          is_verified: boolean | null
          organization_id: string | null
          suggested_score: number | null
          updated_at: string | null
          user_agent: string | null
          user_expertise_areas: string[] | null
          user_expertise_level: string | null
          user_id: string | null
          verification_notes: string | null
          verified_by: string | null
        }
        Insert: {
          agrees_with_assessment?: boolean | null
          article_analysis_id?: string | null
          created_at?: string | null
          dimension_id?: string | null
          evidence_urls?: string[] | null
          feedback_text?: string | null
          feedback_type: string
          guest_token?: string | null
          helpfulness_score?: number | null
          id?: string
          ip_address?: unknown | null
          is_spam?: boolean | null
          is_verified?: boolean | null
          organization_id?: string | null
          suggested_score?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_expertise_areas?: string[] | null
          user_expertise_level?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verified_by?: string | null
        }
        Update: {
          agrees_with_assessment?: boolean | null
          article_analysis_id?: string | null
          created_at?: string | null
          dimension_id?: string | null
          evidence_urls?: string[] | null
          feedback_text?: string | null
          feedback_type?: string
          guest_token?: string | null
          helpfulness_score?: number | null
          id?: string
          ip_address?: unknown | null
          is_spam?: boolean | null
          is_verified?: boolean | null
          organization_id?: string | null
          suggested_score?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_expertise_areas?: string[] | null
          user_expertise_level?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bias_feedback_article_analysis_id_fkey"
            columns: ["article_analysis_id"]
            isOneToOne: false
            referencedRelation: "article_bias_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bias_feedback_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "bias_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bias_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "media_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_learning_events: {
        Row: {
          article_count: number | null
          confidence_change: number | null
          consensus_strength: number | null
          created_at: string | null
          dimension_id: string | null
          event_type: string
          feedback_count: number | null
          id: string
          learning_algorithm_version: string | null
          new_score: number | null
          old_score: number | null
          organization_id: string | null
          trigger_id: string | null
          trigger_type: string | null
        }
        Insert: {
          article_count?: number | null
          confidence_change?: number | null
          consensus_strength?: number | null
          created_at?: string | null
          dimension_id?: string | null
          event_type: string
          feedback_count?: number | null
          id?: string
          learning_algorithm_version?: string | null
          new_score?: number | null
          old_score?: number | null
          organization_id?: string | null
          trigger_id?: string | null
          trigger_type?: string | null
        }
        Update: {
          article_count?: number | null
          confidence_change?: number | null
          consensus_strength?: number | null
          created_at?: string | null
          dimension_id?: string | null
          event_type?: string
          feedback_count?: number | null
          id?: string
          learning_algorithm_version?: string | null
          new_score?: number | null
          old_score?: number | null
          organization_id?: string | null
          trigger_id?: string | null
          trigger_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bias_learning_events_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "bias_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bias_learning_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "media_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_analytics: {
        Row: {
          bookmark_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          snippet_id: string | null
          user_id: string
        }
        Insert: {
          bookmark_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          snippet_id?: string | null
          user_id: string
        }
        Update: {
          bookmark_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          snippet_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_analytics_bookmark_id_fkey"
            columns: ["bookmark_id"]
            isOneToOne: false
            referencedRelation: "bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmark_analytics_snippet_id_fkey"
            columns: ["snippet_id"]
            isOneToOne: false
            referencedRelation: "bookmark_snippets"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          emoji: string | null
          id: string
          is_public: boolean | null
          is_smart: boolean | null
          name: string
          parent_collection_id: string | null
          smart_criteria: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_public?: boolean | null
          is_smart?: boolean | null
          name: string
          parent_collection_id?: string | null
          smart_criteria?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_public?: boolean | null
          is_smart?: boolean | null
          name?: string
          parent_collection_id?: string | null
          smart_criteria?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_collections_parent_collection_id_fkey"
            columns: ["parent_collection_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_snippets: {
        Row: {
          ai_summary: string | null
          ai_tags: string[] | null
          bookmark_id: string | null
          collection_id: string | null
          created_at: string
          full_context: string | null
          highlight_color: string | null
          id: string
          paragraph_index: number | null
          selection_end: number | null
          selection_start: number | null
          snippet_text: string
          source_id: string | null
          source_title: string | null
          source_type: string | null
          source_url: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          bookmark_id?: string | null
          collection_id?: string | null
          created_at?: string
          full_context?: string | null
          highlight_color?: string | null
          id?: string
          paragraph_index?: number | null
          selection_end?: number | null
          selection_start?: number | null
          snippet_text: string
          source_id?: string | null
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          bookmark_id?: string | null
          collection_id?: string | null
          created_at?: string
          full_context?: string | null
          highlight_color?: string | null
          id?: string
          paragraph_index?: number | null
          selection_end?: number | null
          selection_start?: number | null
          snippet_text?: string
          source_id?: string | null
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_snippets_bookmark_id_fkey"
            columns: ["bookmark_id"]
            isOneToOne: false
            referencedRelation: "bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmark_snippets_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          tag_name: string
          tag_slug: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          tag_name: string
          tag_slug: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          tag_name?: string
          tag_slug?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          access_count: number | null
          collection_id: string | null
          content_id: string | null
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          id: string
          is_favorite: boolean | null
          last_accessed_at: string | null
          source_domain: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          access_count?: number | null
          collection_id?: string | null
          content_id?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          last_accessed_at?: string | null
          source_domain?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          access_count?: number | null
          collection_id?: string | null
          content_id?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          last_accessed_at?: string | null
          source_domain?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      boost_definitions: {
        Row: {
          boost_type: string
          category: string
          cooldown_hours: number | null
          created_at: string | null
          description: string
          duration: number | null
          emoji: string
          icon: string
          is_active: boolean | null
          level_requirement: number | null
          max_uses: number | null
          name: string
          rarity: string
          tags: string[] | null
          updated_at: string | null
          xp_cost: number
        }
        Insert: {
          boost_type: string
          category: string
          cooldown_hours?: number | null
          created_at?: string | null
          description: string
          duration?: number | null
          emoji: string
          icon: string
          is_active?: boolean | null
          level_requirement?: number | null
          max_uses?: number | null
          name: string
          rarity: string
          tags?: string[] | null
          updated_at?: string | null
          xp_cost: number
        }
        Update: {
          boost_type?: string
          category?: string
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string
          duration?: number | null
          emoji?: string
          icon?: string
          is_active?: boolean | null
          level_requirement?: number | null
          max_uses?: number | null
          name?: string
          rarity?: string
          tags?: string[] | null
          updated_at?: string | null
          xp_cost?: number
        }
        Relationships: []
      }
      calendar_sync_logs: {
        Row: {
          calendar_id: string
          created_at: string
          errors: Json | null
          id: string
          skipped_count: number
          sync_options: Json | null
          synced_at: string
          synced_count: number
          user_id: string
        }
        Insert: {
          calendar_id: string
          created_at?: string
          errors?: Json | null
          id?: string
          skipped_count?: number
          sync_options?: Json | null
          synced_at?: string
          synced_count?: number
          user_id: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          errors?: Json | null
          id?: string
          skipped_count?: number
          sync_options?: Json | null
          synced_at?: string
          synced_count?: number
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string
          id: string
          is_active: boolean | null
          name: string
          translations: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji: string
          id?: string
          is_active?: boolean | null
          name: string
          translations?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
          translations?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      category_synonyms: {
        Row: {
          alias: string
          category_id: string | null
          is_active: boolean | null
        }
        Insert: {
          alias: string
          category_id?: string | null
          is_active?: boolean | null
        }
        Update: {
          alias?: string
          category_id?: string | null
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "category_synonyms_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      civics_test_analytics: {
        Row: {
          event_type: string
          guest_token: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          score: number | null
          session_id: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          event_type: string
          guest_token?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          score?: number | null
          session_id: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string
          guest_token?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          score?: number | null
          session_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clever_user_mapping: {
        Row: {
          civicsense_user_id: string | null
          clever_email: string | null
          clever_user_id: string
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          school_id: string | null
        }
        Insert: {
          civicsense_user_id?: string | null
          clever_email?: string | null
          clever_user_id: string
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          school_id?: string | null
        }
        Update: {
          civicsense_user_id?: string | null
          clever_email?: string | null
          clever_user_id?: string
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          school_id?: string | null
        }
        Relationships: []
      }
      collection_analytics: {
        Row: {
          avg_completion_time_minutes: number | null
          avg_session_time_minutes: number | null
          biggest_drop_off_item_id: string | null
          collection_id: string | null
          completions: number | null
          created_at: string | null
          date: string
          id: string
          most_popular_item_id: string | null
          starts: number | null
          views: number | null
        }
        Insert: {
          avg_completion_time_minutes?: number | null
          avg_session_time_minutes?: number | null
          biggest_drop_off_item_id?: string | null
          collection_id?: string | null
          completions?: number | null
          created_at?: string | null
          date: string
          id?: string
          most_popular_item_id?: string | null
          starts?: number | null
          views?: number | null
        }
        Update: {
          avg_completion_time_minutes?: number | null
          avg_session_time_minutes?: number | null
          biggest_drop_off_item_id?: string | null
          collection_id?: string | null
          completions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          most_popular_item_id?: string | null
          starts?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_analytics_biggest_drop_off_item_id_fkey"
            columns: ["biggest_drop_off_item_id"]
            isOneToOne: false
            referencedRelation: "collection_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_analytics_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_analytics_most_popular_item_id_fkey"
            columns: ["most_popular_item_id"]
            isOneToOne: false
            referencedRelation: "collection_items"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          category: string | null
          collection_id: string | null
          content_id: string
          content_type: string
          created_at: string | null
          description_override: string | null
          id: string
          is_featured: boolean | null
          notes: string | null
          sort_order: number
          title_override: string | null
        }
        Insert: {
          category?: string | null
          collection_id?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          description_override?: string | null
          id?: string
          is_featured?: boolean | null
          notes?: string | null
          sort_order: number
          title_override?: string | null
        }
        Update: {
          category?: string | null
          collection_id?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          description_override?: string | null
          id?: string
          is_featured?: boolean | null
          notes?: string | null
          sort_order?: number
          title_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_reviews: {
        Row: {
          collection_id: string | null
          created_at: string | null
          helpful_votes: number | null
          id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_reviews_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_skill_progress: {
        Row: {
          collection_id: string
          created_at: string | null
          earned_at: string | null
          id: string
          items_completed: number | null
          progress_percentage: number | null
          skill_id: string
          total_items_in_collection: number | null
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          items_completed?: number | null
          progress_percentage?: number | null
          skill_id: string
          total_items_in_collection?: number | null
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          items_completed?: number | null
          progress_percentage?: number | null
          skill_id?: string
          total_items_in_collection?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_skill_progress_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_skill_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          action_items: string[] | null
          avg_rating: number | null
          categories: string[] | null
          completion_count: number | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          current_events_relevance: number | null
          description: string
          difficulty_level: number | null
          emoji: string
          estimated_minutes: number | null
          featured_order: number | null
          id: string
          is_featured: boolean | null
          learning_objectives: string[] | null
          political_balance_score: number | null
          prerequisites: string[] | null
          published_at: string | null
          slug: string
          source_diversity_score: number | null
          status: string | null
          tags: string[] | null
          title: string
          total_ratings: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          action_items?: string[] | null
          avg_rating?: number | null
          categories?: string[] | null
          completion_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          current_events_relevance?: number | null
          description: string
          difficulty_level?: number | null
          emoji: string
          estimated_minutes?: number | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          learning_objectives?: string[] | null
          political_balance_score?: number | null
          prerequisites?: string[] | null
          published_at?: string | null
          slug: string
          source_diversity_score?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          total_ratings?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          action_items?: string[] | null
          avg_rating?: number | null
          categories?: string[] | null
          completion_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          current_events_relevance?: number | null
          description?: string
          difficulty_level?: number | null
          emoji?: string
          estimated_minutes?: number | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          learning_objectives?: string[] | null
          political_balance_score?: number | null
          prerequisites?: string[] | null
          published_at?: string | null
          slug?: string
          source_diversity_score?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          total_ratings?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      content_duplication_warnings: {
        Row: {
          admin_notes: string | null
          analysis_method: string | null
          content_id: string
          content_overlap_details: Json | null
          content_title: string
          content_type: string
          created_at: string | null
          id: string
          keyword_overlap: string[] | null
          recommendation: string
          resolved_at: string | null
          reviewed_at: string | null
          similar_content_id: string
          similar_content_title: string
          similar_content_type: string
          similarity_score: number
          status: string | null
          suggested_action: string
          warning_level: string
        }
        Insert: {
          admin_notes?: string | null
          analysis_method?: string | null
          content_id: string
          content_overlap_details?: Json | null
          content_title: string
          content_type: string
          created_at?: string | null
          id?: string
          keyword_overlap?: string[] | null
          recommendation: string
          resolved_at?: string | null
          reviewed_at?: string | null
          similar_content_id: string
          similar_content_title: string
          similar_content_type: string
          similarity_score: number
          status?: string | null
          suggested_action: string
          warning_level: string
        }
        Update: {
          admin_notes?: string | null
          analysis_method?: string | null
          content_id?: string
          content_overlap_details?: Json | null
          content_title?: string
          content_type?: string
          created_at?: string | null
          id?: string
          keyword_overlap?: string[] | null
          recommendation?: string
          resolved_at?: string | null
          reviewed_at?: string | null
          similar_content_id?: string
          similar_content_title?: string
          similar_content_type?: string
          similarity_score?: number
          status?: string | null
          suggested_action?: string
          warning_level?: string
        }
        Relationships: []
      }
      content_filtering_rules: {
        Row: {
          age_range: string
          blocked_categories: string[] | null
          blocked_keywords: string[] | null
          blocked_topics: string[] | null
          created_at: string | null
          filter_level: string
          id: string
          is_active: boolean | null
          max_difficulty_level: number | null
          rule_name: string
          sensitive_topics: Json | null
        }
        Insert: {
          age_range: string
          blocked_categories?: string[] | null
          blocked_keywords?: string[] | null
          blocked_topics?: string[] | null
          created_at?: string | null
          filter_level: string
          id?: string
          is_active?: boolean | null
          max_difficulty_level?: number | null
          rule_name: string
          sensitive_topics?: Json | null
        }
        Update: {
          age_range?: string
          blocked_categories?: string[] | null
          blocked_keywords?: string[] | null
          blocked_topics?: string[] | null
          created_at?: string | null
          filter_level?: string
          id?: string
          is_active?: boolean | null
          max_difficulty_level?: number | null
          rule_name?: string
          sensitive_topics?: Json | null
        }
        Relationships: []
      }
      content_generation_queue: {
        Row: {
          assigned_worker: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          estimated_duration_ms: number | null
          execution_log_id: string | null
          expires_at: string
          generation_params: Json
          generation_type: string
          id: string
          max_retries: number
          priority: number
          process_after: string
          result_data: Json | null
          retry_count: number
          scheduled_job_id: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_worker?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          estimated_duration_ms?: number | null
          execution_log_id?: string | null
          expires_at?: string
          generation_params: Json
          generation_type: string
          id?: string
          max_retries?: number
          priority?: number
          process_after?: string
          result_data?: Json | null
          retry_count?: number
          scheduled_job_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_worker?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          estimated_duration_ms?: number | null
          execution_log_id?: string | null
          expires_at?: string
          generation_params?: Json
          generation_type?: string
          id?: string
          max_retries?: number
          priority?: number
          process_after?: string
          result_data?: Json | null
          retry_count?: number
          scheduled_job_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_generation_queue_execution_log_id_fkey"
            columns: ["execution_log_id"]
            isOneToOne: false
            referencedRelation: "job_execution_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_generation_queue_scheduled_job_id_fkey"
            columns: ["scheduled_job_id"]
            isOneToOne: false
            referencedRelation: "scheduled_content_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      content_item_skills: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          proficiency_level: number | null
          skill_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          proficiency_level?: number | null
          skill_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          proficiency_level?: number | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_item_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      content_packages: {
        Row: {
          created_at: string
          generated_content: Json
          id: string
          news_event_id: string
          news_headline: string
          published_at: string | null
          quality_scores: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          generated_content?: Json
          id: string
          news_event_id: string
          news_headline: string
          published_at?: string | null
          quality_scores?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          generated_content?: Json
          id?: string
          news_event_id?: string
          news_headline?: string
          published_at?: string | null
          quality_scores?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_packages_news_event_id_fkey"
            columns: ["news_event_id"]
            isOneToOne: false
            referencedRelation: "news_events"
            referencedColumns: ["id"]
          },
        ]
      }
      content_preview_cache: {
        Row: {
          access_count: number
          cache_key: string
          cache_type: string
          created_at: string
          created_by: string | null
          expires_at: string
          generation_settings: Json
          id: string
          last_accessed_at: string
          preview_data: Json
        }
        Insert: {
          access_count?: number
          cache_key: string
          cache_type: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          generation_settings: Json
          id?: string
          last_accessed_at?: string
          preview_data: Json
        }
        Update: {
          access_count?: number
          cache_key?: string
          cache_type?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          generation_settings?: Json
          id?: string
          last_accessed_at?: string
          preview_data?: Json
        }
        Relationships: []
      }
      content_publication_log: {
        Row: {
          content_package_id: string
          content_type: string
          created_at: string
          error_message: string | null
          id: string
          publication_status: string
          published_at: string | null
          target_record_id: string
          target_table: string
        }
        Insert: {
          content_package_id: string
          content_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          publication_status?: string
          published_at?: string | null
          target_record_id: string
          target_table: string
        }
        Update: {
          content_package_id?: string
          content_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          publication_status?: string
          published_at?: string | null
          target_record_id?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_publication_log_content_package_id_fkey"
            columns: ["content_package_id"]
            isOneToOne: false
            referencedRelation: "content_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      content_relationships: {
        Row: {
          admin_notes: string | null
          ai_discovered: boolean | null
          confidence_score: number | null
          created_at: string | null
          discovery_method: string | null
          human_verified: boolean | null
          id: string
          relationship_type: string
          source_content_id: string
          source_content_type: string
          strength: number
          target_content_id: string
          target_content_type: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          ai_discovered?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          discovery_method?: string | null
          human_verified?: boolean | null
          id?: string
          relationship_type: string
          source_content_id: string
          source_content_type: string
          strength?: number
          target_content_id: string
          target_content_type: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          ai_discovered?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          discovery_method?: string | null
          human_verified?: boolean | null
          id?: string
          relationship_type?: string
          source_content_id?: string
          source_content_type?: string
          strength?: number
          target_content_id?: string
          target_content_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          civic_relevance_score: number | null
          content_generation_status: string | null
          content_package_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string | null
          is_active: boolean | null
          news_source_url: string | null
          source_type: string | null
          sources: Json | null
          topic_id: string
          topic_title: string
          updated_at: string | null
          why_this_matters: string
        }
        Insert: {
          civic_relevance_score?: number | null
          content_generation_status?: string | null
          content_package_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string | null
          is_active?: boolean | null
          news_source_url?: string | null
          source_type?: string | null
          sources?: Json | null
          topic_id: string
          topic_title: string
          updated_at?: string | null
          why_this_matters: string
        }
        Update: {
          civic_relevance_score?: number | null
          content_generation_status?: string | null
          content_package_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string | null
          is_active?: boolean | null
          news_source_url?: string | null
          source_type?: string | null
          sources?: Json | null
          topic_id?: string
          topic_title?: string
          updated_at?: string | null
          why_this_matters?: string
        }
        Relationships: []
      }
      fact_check_logs: {
        Row: {
          ai_reasoning: string | null
          changes_applied: boolean | null
          check_date: string | null
          confidence_score: number | null
          created_at: string | null
          human_reviewer: string | null
          id: string
          issues_found: string[] | null
          question_id: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          changes_applied?: boolean | null
          check_date?: string | null
          confidence_score?: number | null
          created_at?: string | null
          human_reviewer?: string | null
          id?: string
          issues_found?: string[] | null
          question_id?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          changes_applied?: boolean | null
          check_date?: string | null
          confidence_score?: number | null
          created_at?: string | null
          human_reviewer?: string | null
          id?: string
          issues_found?: string[] | null
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_check_logs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "fact_check_logs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "fact_check_logs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "fact_check_logs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_events: {
        Row: {
          created_at: string | null
          event_date: string
          event_description: string | null
          event_title: string
          event_type: string
          figure_id: string | null
          id: string
          media_coverage_scale: string | null
          policy_areas: string[] | null
          quiz_potential: number | null
          related_figures: string[] | null
          significance_level: number | null
          sources: Json | null
        }
        Insert: {
          created_at?: string | null
          event_date: string
          event_description?: string | null
          event_title: string
          event_type: string
          figure_id?: string | null
          id?: string
          media_coverage_scale?: string | null
          policy_areas?: string[] | null
          quiz_potential?: number | null
          related_figures?: string[] | null
          significance_level?: number | null
          sources?: Json | null
        }
        Update: {
          created_at?: string | null
          event_date?: string
          event_description?: string | null
          event_title?: string
          event_type?: string
          figure_id?: string | null
          id?: string
          media_coverage_scale?: string | null
          policy_areas?: string[] | null
          quiz_potential?: number | null
          related_figures?: string[] | null
          significance_level?: number | null
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "figure_events_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_organizations: {
        Row: {
          appointment_announcement_url: string | null
          compensation_type: string | null
          created_at: string | null
          end_date: string | null
          figure_id: string | null
          id: string
          influence_within_org: number | null
          is_active: boolean | null
          organization_id: string | null
          public_visibility: string | null
          role_description: string | null
          role_title: string | null
          role_type: string | null
          sources: Json | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_announcement_url?: string | null
          compensation_type?: string | null
          created_at?: string | null
          end_date?: string | null
          figure_id?: string | null
          id?: string
          influence_within_org?: number | null
          is_active?: boolean | null
          organization_id?: string | null
          public_visibility?: string | null
          role_description?: string | null
          role_title?: string | null
          role_type?: string | null
          sources?: Json | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_announcement_url?: string | null
          compensation_type?: string | null
          created_at?: string | null
          end_date?: string | null
          figure_id?: string | null
          id?: string
          influence_within_org?: number | null
          is_active?: boolean | null
          organization_id?: string | null
          public_visibility?: string | null
          role_description?: string | null
          role_title?: string | null
          role_type?: string | null
          sources?: Json | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "figure_organizations_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_policy_positions: {
        Row: {
          certainty_level: string | null
          consistency_score: number | null
          created_at: string | null
          figure_id: string | null
          id: string
          policy_area: string
          position_date: string | null
          position_description: string
          public_statement_url: string | null
          sources: Json | null
          specific_policy: string | null
          updated_at: string | null
          voting_record_evidence: Json | null
        }
        Insert: {
          certainty_level?: string | null
          consistency_score?: number | null
          created_at?: string | null
          figure_id?: string | null
          id?: string
          policy_area: string
          position_date?: string | null
          position_description: string
          public_statement_url?: string | null
          sources?: Json | null
          specific_policy?: string | null
          updated_at?: string | null
          voting_record_evidence?: Json | null
        }
        Update: {
          certainty_level?: string | null
          consistency_score?: number | null
          created_at?: string | null
          figure_id?: string | null
          id?: string
          policy_area?: string
          position_date?: string | null
          position_description?: string
          public_statement_url?: string | null
          sources?: Json | null
          specific_policy?: string | null
          updated_at?: string | null
          voting_record_evidence?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "figure_policy_positions_figure_id_fkey"
            columns: ["figure_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_quiz_topics: {
        Row: {
          content_themes: string[] | null
          created_at: string | null
          difficulty_distribution: Json | null
          featured_figures: string[] | null
          focus_type: string
          id: string
          network_depth: number | null
          performance_metrics: Json | null
          primary_figure_id: string | null
          topic_id: string | null
        }
        Insert: {
          content_themes?: string[] | null
          created_at?: string | null
          difficulty_distribution?: Json | null
          featured_figures?: string[] | null
          focus_type: string
          id?: string
          network_depth?: number | null
          performance_metrics?: Json | null
          primary_figure_id?: string | null
          topic_id?: string | null
        }
        Update: {
          content_themes?: string[] | null
          created_at?: string | null
          difficulty_distribution?: Json | null
          featured_figures?: string[] | null
          focus_type?: string
          id?: string
          network_depth?: number | null
          performance_metrics?: Json | null
          primary_figure_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "figure_quiz_topics_primary_figure_id_fkey"
            columns: ["primary_figure_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_relationships: {
        Row: {
          created_at: string | null
          description: string | null
          evidence_sources: Json | null
          figure_a_id: string | null
          figure_b_id: string | null
          financial_connections: Json | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          key_interactions: Json | null
          policy_alignments: string[] | null
          relationship_direction: string | null
          relationship_end_date: string | null
          relationship_start_date: string | null
          relationship_strength: number | null
          relationship_type: string
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          evidence_sources?: Json | null
          figure_a_id?: string | null
          figure_b_id?: string | null
          financial_connections?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          key_interactions?: Json | null
          policy_alignments?: string[] | null
          relationship_direction?: string | null
          relationship_end_date?: string | null
          relationship_start_date?: string | null
          relationship_strength?: number | null
          relationship_type: string
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          evidence_sources?: Json | null
          figure_a_id?: string | null
          figure_b_id?: string | null
          financial_connections?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          key_interactions?: Json | null
          policy_alignments?: string[] | null
          relationship_direction?: string | null
          relationship_end_date?: string | null
          relationship_start_date?: string | null
          relationship_strength?: number | null
          relationship_type?: string
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "figure_relationships_figure_a_id_fkey"
            columns: ["figure_a_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "figure_relationships_figure_b_id_fkey"
            columns: ["figure_b_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          parent_approved_at: string | null
          pod_id: string | null
          recipient_id: string
          request_type: string | null
          requester_id: string
          requires_parental_approval: boolean | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          parent_approved_at?: string | null
          pod_id?: string | null
          recipient_id: string
          request_type?: string | null
          requester_id: string
          requires_parental_approval?: boolean | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          parent_approved_at?: string | null
          pod_id?: string | null
          recipient_id?: string
          request_type?: string | null
          requester_id?: string
          requires_parental_approval?: boolean | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      gift_credits: {
        Row: {
          created_at: string | null
          credit_type: string
          credits_available: number
          credits_used: number
          donor_user_id: string
          id: string
          source_donation_amount: number
          source_stripe_session_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_type: string
          credits_available?: number
          credits_used?: number
          donor_user_id: string
          id?: string
          source_donation_amount: number
          source_stripe_session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_type?: string
          credits_available?: number
          credits_used?: number
          donor_user_id?: string
          id?: string
          source_donation_amount?: number
          source_stripe_session_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_redemptions: {
        Row: {
          access_type: string
          claimed_at: string | null
          created_at: string | null
          donor_user_id: string
          expires_at: string | null
          gift_credit_id: string
          gift_message: string | null
          id: string
          recipient_email: string
          recipient_user_id: string | null
          redemption_code: string
          redemption_status: string
          updated_at: string | null
        }
        Insert: {
          access_type: string
          claimed_at?: string | null
          created_at?: string | null
          donor_user_id: string
          expires_at?: string | null
          gift_credit_id: string
          gift_message?: string | null
          id?: string
          recipient_email: string
          recipient_user_id?: string | null
          redemption_code: string
          redemption_status?: string
          updated_at?: string | null
        }
        Update: {
          access_type?: string
          claimed_at?: string | null
          created_at?: string | null
          donor_user_id?: string
          expires_at?: string | null
          gift_credit_id?: string
          gift_message?: string | null
          id?: string
          recipient_email?: string
          recipient_user_id?: string | null
          redemption_code?: string
          redemption_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_redemptions_gift_credit_id_fkey"
            columns: ["gift_credit_id"]
            isOneToOne: false
            referencedRelation: "gift_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_content_references: {
        Row: {
          auto_generated: boolean | null
          content_id: string
          content_table: string | null
          content_type: string
          context_snippet: string | null
          created_at: string
          id: string
          reference_type: string | null
          relevance_score: number | null
          term_id: string
          verified: boolean | null
        }
        Insert: {
          auto_generated?: boolean | null
          content_id: string
          content_table?: string | null
          content_type: string
          context_snippet?: string | null
          created_at?: string
          id?: string
          reference_type?: string | null
          relevance_score?: number | null
          term_id: string
          verified?: boolean | null
        }
        Update: {
          auto_generated?: boolean | null
          content_id?: string
          content_table?: string | null
          content_type?: string
          context_snippet?: string | null
          created_at?: string
          id?: string
          reference_type?: string | null
          relevance_score?: number | null
          term_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "glossary_content_references_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_game_sessions: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          game_data: Json | null
          game_id: string
          guest_token: string | null
          hints_used: number | null
          id: string
          incorrect_answers: number | null
          max_score: number | null
          score: number | null
          session_token: string
          started_at: string
          status: string | null
          terms_used: Json | null
          time_spent_seconds: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          game_data?: Json | null
          game_id: string
          guest_token?: string | null
          hints_used?: number | null
          id?: string
          incorrect_answers?: number | null
          max_score?: number | null
          score?: number | null
          session_token: string
          started_at?: string
          status?: string | null
          terms_used?: Json | null
          time_spent_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          game_data?: Json | null
          game_id?: string
          guest_token?: string | null
          hints_used?: number | null
          id?: string
          incorrect_answers?: number | null
          max_score?: number | null
          score?: number | null
          session_token?: string
          started_at?: string
          status?: string | null
          terms_used?: Json | null
          time_spent_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "glossary_game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "glossary_games"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_games: {
        Row: {
          category_filters: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          game_config: Json | null
          game_type: string
          id: string
          is_active: boolean | null
          max_attempts: number | null
          max_terms: number | null
          min_terms: number | null
          term_filters: Json | null
          time_limit_seconds: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category_filters?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          game_config?: Json | null
          game_type: string
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          max_terms?: number | null
          min_terms?: number | null
          term_filters?: Json | null
          time_limit_seconds?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category_filters?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          game_config?: Json | null
          game_type?: string
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          max_terms?: number | null
          min_terms?: number | null
          term_filters?: Json | null
          time_limit_seconds?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      glossary_term_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          relevance_score: number | null
          term_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          relevance_score?: number | null
          term_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          relevance_score?: number | null
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_term_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glossary_term_categories_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_term_relationships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          notes: string | null
          relationship_type: string
          source_term_id: string
          strength: number | null
          target_term_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          notes?: string | null
          relationship_type: string
          source_term_id: string
          strength?: number | null
          target_term_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          notes?: string | null
          relationship_type?: string
          source_term_id?: string
          strength?: number | null
          target_term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_term_relationships_source_term_id_fkey"
            columns: ["source_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glossary_term_relationships_target_term_id_fkey"
            columns: ["target_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          ai_generated: boolean | null
          created_at: string
          definition: string
          difficulty_level: number | null
          educational_context: Json | null
          examples: Json | null
          game_data: Json | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          part_of_speech: string | null
          primary_source_id: string | null
          quality_score: number | null
          source_info: Json | null
          supporting_source_ids: string[] | null
          synonyms: string[] | null
          term: string
          translations: Json | null
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string
          definition: string
          difficulty_level?: number | null
          educational_context?: Json | null
          examples?: Json | null
          game_data?: Json | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          part_of_speech?: string | null
          primary_source_id?: string | null
          quality_score?: number | null
          source_info?: Json | null
          supporting_source_ids?: string[] | null
          synonyms?: string[] | null
          term: string
          translations?: Json | null
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string
          definition?: string
          difficulty_level?: number | null
          educational_context?: Json | null
          examples?: Json | null
          game_data?: Json | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          part_of_speech?: string | null
          primary_source_id?: string | null
          quality_score?: number | null
          source_info?: Json | null
          supporting_source_ids?: string[] | null
          synonyms?: string[] | null
          term?: string
          translations?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_terms_primary_source_id_fkey"
            columns: ["primary_source_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "glossary_terms_primary_source_id_fkey"
            columns: ["primary_source_id"]
            isOneToOne: false
            referencedRelation: "source_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_usage_analytics: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string
          duration_seconds: number | null
          guest_token: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          term_id: string
          usage_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          duration_seconds?: number | null
          guest_token?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          term_id: string
          usage_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          duration_seconds?: number | null
          guest_token?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          term_id?: string
          usage_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "glossary_usage_analytics_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_civics_test_results: {
        Row: {
          answers: Json | null
          category_breakdown: Json | null
          completed_at: string
          converted_at: string | null
          converted_user_id: string | null
          guest_token: string
          id: string
          ip_address: unknown | null
          level: string
          score: number
          session_id: string
          test_type: string
          user_agent: string | null
        }
        Insert: {
          answers?: Json | null
          category_breakdown?: Json | null
          completed_at?: string
          converted_at?: string | null
          converted_user_id?: string | null
          guest_token: string
          id?: string
          ip_address?: unknown | null
          level: string
          score: number
          session_id: string
          test_type: string
          user_agent?: string | null
        }
        Update: {
          answers?: Json | null
          category_breakdown?: Json | null
          completed_at?: string
          converted_at?: string | null
          converted_user_id?: string | null
          guest_token?: string
          id?: string
          ip_address?: unknown | null
          level?: string
          score?: number
          session_id?: string
          test_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      guest_usage_analytics: {
        Row: {
          attempts: number
          created_at: string | null
          date: string
          guest_token: string
          id: string
          ip: string
          timestamp: string
        }
        Insert: {
          attempts?: number
          created_at?: string | null
          date: string
          guest_token: string
          id?: string
          ip: string
          timestamp?: string
        }
        Update: {
          attempts?: number
          created_at?: string | null
          date?: string
          guest_token?: string
          id?: string
          ip?: string
          timestamp?: string
        }
        Relationships: []
      }
      guest_usage_tracking: {
        Row: {
          attempts: number
          created_at: string | null
          date: string
          firstSeen: string
          id: string
          ip: string
          lastSeen: string
          tokens: string[]
          updated_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string | null
          date: string
          firstSeen?: string
          id?: string
          ip: string
          lastSeen?: string
          tokens?: string[]
          updated_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string | null
          date?: string
          firstSeen?: string
          id?: string
          ip?: string
          lastSeen?: string
          tokens?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      image_ab_test_results: {
        Row: {
          created_at: string
          engagement_type: string | null
          engagement_value: number | null
          id: string
          image_id: string | null
          session_id: string | null
          test_name: string
          user_id: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          engagement_type?: string | null
          engagement_value?: number | null
          id?: string
          image_id?: string | null
          session_id?: string | null
          test_name: string
          user_id?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          engagement_type?: string | null
          engagement_value?: number | null
          id?: string
          image_id?: string | null
          session_id?: string | null
          test_name?: string
          user_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_ab_test_results_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_generation_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      image_generation_analytics: {
        Row: {
          content_type: string
          created_at: string
          error_message: string | null
          generation_time_ms: number
          id: string
          session_id: string | null
          success: boolean
          template: string
          theme: string
          user_id: string | null
          variant: string
        }
        Insert: {
          content_type: string
          created_at?: string
          error_message?: string | null
          generation_time_ms: number
          id?: string
          session_id?: string | null
          success?: boolean
          template: string
          theme?: string
          user_id?: string | null
          variant?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          error_message?: string | null
          generation_time_ms?: number
          id?: string
          session_id?: string | null
          success?: boolean
          template?: string
          theme?: string
          user_id?: string | null
          variant?: string
        }
        Relationships: []
      }
      indicator_actions: {
        Row: {
          action_description: string | null
          action_title: string
          action_type: string
          created_at: string | null
          difficulty_level: number | null
          effectiveness_notes: string | null
          id: string
          indicator_id: string
          is_active: boolean | null
          resources_needed: string | null
          success_examples: string | null
          target_audience: string | null
          time_commitment: string | null
        }
        Insert: {
          action_description?: string | null
          action_title: string
          action_type: string
          created_at?: string | null
          difficulty_level?: number | null
          effectiveness_notes?: string | null
          id?: string
          indicator_id: string
          is_active?: boolean | null
          resources_needed?: string | null
          success_examples?: string | null
          target_audience?: string | null
          time_commitment?: string | null
        }
        Update: {
          action_description?: string | null
          action_title?: string
          action_type?: string
          created_at?: string | null
          difficulty_level?: number | null
          effectiveness_notes?: string | null
          id?: string
          indicator_id?: string
          is_active?: boolean | null
          resources_needed?: string | null
          success_examples?: string | null
          target_audience?: string | null
          time_commitment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_actions_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_assessments: {
        Row: {
          analyst_notes: string | null
          assessment_id: string
          change_from_previous: Json | null
          confidence_level: number | null
          created_at: string | null
          id: string
          indicator_id: string
          measured_value: Json
          status: string | null
          updated_at: string | null
        }
        Insert: {
          analyst_notes?: string | null
          assessment_id: string
          change_from_previous?: Json | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          indicator_id: string
          measured_value: Json
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          analyst_notes?: string | null
          assessment_id?: string
          change_from_previous?: Json | null
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          indicator_id?: string
          measured_value?: Json
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_assessments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_assessments_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_categories: {
        Row: {
          category_name: string
          category_slug: string
          color_code: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          framework_id: string
          icon: string | null
          id: string
          severity_level: number | null
          threshold_description: string | null
        }
        Insert: {
          category_name: string
          category_slug: string
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          framework_id: string
          icon?: string | null
          id?: string
          severity_level?: number | null
          threshold_description?: string | null
        }
        Update: {
          category_name?: string
          category_slug?: string
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          framework_id?: string
          icon?: string | null
          id?: string
          severity_level?: number | null
          threshold_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_categories_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_content_links: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          indicator_id: string
          relationship_type: string | null
          relevance_score: number | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          indicator_id: string
          relationship_type?: string | null
          relevance_score?: number | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          indicator_id?: string
          relationship_type?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_content_links_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          category_id: string | null
          civic_education_angle: string | null
          created_at: string | null
          description: string
          display_order: number | null
          evidence_threshold: string | null
          framework_id: string
          historical_context: string | null
          id: string
          indicator_name: string
          indicator_slug: string
          is_active: boolean | null
          measurement_config: Json | null
          measurement_type: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          category_id?: string | null
          civic_education_angle?: string | null
          created_at?: string | null
          description: string
          display_order?: number | null
          evidence_threshold?: string | null
          framework_id: string
          historical_context?: string | null
          id?: string
          indicator_name: string
          indicator_slug: string
          is_active?: boolean | null
          measurement_config?: Json | null
          measurement_type: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          category_id?: string | null
          civic_education_angle?: string | null
          created_at?: string | null
          description?: string
          display_order?: number | null
          evidence_threshold?: string | null
          framework_id?: string
          historical_context?: string | null
          id?: string
          indicator_name?: string
          indicator_slug?: string
          is_active?: boolean | null
          measurement_config?: Json | null
          measurement_type?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indicators_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "indicator_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      job_execution_logs: {
        Row: {
          completed_at: string | null
          content_generated: number | null
          created_at: string
          error_details: Json | null
          error_message: string | null
          execution_metadata: Json | null
          execution_time_ms: number | null
          id: string
          job_id: string
          questions_created: number | null
          stack_trace: string | null
          started_at: string
          status: string
          topics_created: number | null
        }
        Insert: {
          completed_at?: string | null
          content_generated?: number | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          execution_metadata?: Json | null
          execution_time_ms?: number | null
          id?: string
          job_id: string
          questions_created?: number | null
          stack_trace?: string | null
          started_at?: string
          status?: string
          topics_created?: number | null
        }
        Update: {
          completed_at?: string | null
          content_generated?: number | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          execution_metadata?: Json | null
          execution_time_ms?: number | null
          id?: string
          job_id?: string
          questions_created?: number | null
          stack_trace?: string | null
          started_at?: string
          status?: string
          topics_created?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_execution_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scheduled_content_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      key_policy_positions: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean | null
          spectrum: string
          stance_label: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          display_order?: never
          id?: string
          is_active?: boolean | null
          spectrum: string
          stance_label: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: never
          id?: string
          is_active?: boolean | null
          spectrum?: string
          stance_label?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_policy_positions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_objectives: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          mastery_level_required: string | null
          objective_text: string
          objective_type: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          mastery_level_required?: string | null
          objective_text: string
          objective_type?: string
          skill_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          mastery_level_required?: string | null
          objective_text?: string
          objective_type?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_objectives_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_pods: {
        Row: {
          accessibility_mode: string | null
          activity_score: number | null
          alert_on_inappropriate_content: boolean | null
          allow_sensitive_topics: boolean | null
          allowed_age_range: string | null
          allowed_days: number[] | null
          allowed_end_time: string | null
          allowed_start_time: string | null
          archived_at: string | null
          archived_by: string | null
          average_rating: number | null
          banner_image_url: string | null
          blocked_categories: string[] | null
          can_access_chat: boolean | null
          can_access_multiplayer: boolean | null
          can_share_progress: boolean | null
          can_view_leaderboards: boolean | null
          challenge_participation: Json | null
          classroom_course_id: string | null
          classroom_integration_enabled: boolean | null
          clever_last_sync: string | null
          clever_section_id: string | null
          clever_sync_enabled: boolean
          clever_sync_errors: Json | null
          content_filter_level: string | null
          created_at: string | null
          created_by: string
          custom_type_label: string | null
          daily_time_limit_minutes: number | null
          description: string | null
          display_name: string | null
          family_name: string | null
          grade_passback_enabled: boolean | null
          id: string
          is_featured: boolean | null
          is_private: boolean | null
          is_public: boolean | null
          join_code: string | null
          lms_platform: "google_classroom" | "clever" | null
          max_difficulty_level: number | null
          max_members: number | null
          milestone_data: Json | null
          parent_email: string | null
          partnership_status: string | null
          personality_type: string | null
          pod_color: string | null
          pod_description: string | null
          pod_emoji: string | null
          pod_motto: string | null
          pod_name: string
          pod_slug: string | null
          pod_type: string
          report_frequency: string | null
          require_parent_approval_for_friends: boolean | null
          roster_last_synced: string | null
          search_tags: string[] | null
          send_progress_reports: boolean | null
          short_description: string | null
          target_age_range: string | null
          theme_id: string | null
          topics_covered: string[] | null
          total_ratings: number | null
          track_detailed_activity: boolean | null
          unlocked_features: Json | null
          updated_at: string | null
        }
        Insert: {
          accessibility_mode?: string | null
          activity_score?: number | null
          alert_on_inappropriate_content?: boolean | null
          allow_sensitive_topics?: boolean | null
          allowed_age_range?: string | null
          allowed_days?: number[] | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          archived_at?: string | null
          archived_by?: string | null
          average_rating?: number | null
          banner_image_url?: string | null
          blocked_categories?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          challenge_participation?: Json | null
          classroom_course_id?: string | null
          classroom_integration_enabled?: boolean | null
          clever_last_sync?: string | null
          clever_section_id?: string | null
          clever_sync_enabled?: boolean
          clever_sync_errors?: Json | null
          content_filter_level?: string | null
          created_at?: string | null
          created_by: string
          custom_type_label?: string | null
          daily_time_limit_minutes?: number | null
          description?: string | null
          display_name?: string | null
          family_name?: string | null
          grade_passback_enabled?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_private?: boolean | null
          is_public?: boolean | null
          join_code?: string | null
          lms_platform?: "google_classroom" | "clever" | null
          max_difficulty_level?: number | null
          max_members?: number | null
          milestone_data?: Json | null
          parent_email?: string | null
          partnership_status?: string | null
          personality_type?: string | null
          pod_color?: string | null
          pod_description?: string | null
          pod_emoji?: string | null
          pod_motto?: string | null
          pod_name: string
          pod_slug?: string | null
          pod_type?: string
          report_frequency?: string | null
          require_parent_approval_for_friends?: boolean | null
          roster_last_synced?: string | null
          search_tags?: string[] | null
          send_progress_reports?: boolean | null
          short_description?: string | null
          target_age_range?: string | null
          theme_id?: string | null
          topics_covered?: string[] | null
          total_ratings?: number | null
          track_detailed_activity?: boolean | null
          unlocked_features?: Json | null
          updated_at?: string | null
        }
        Update: {
          accessibility_mode?: string | null
          activity_score?: number | null
          alert_on_inappropriate_content?: boolean | null
          allow_sensitive_topics?: boolean | null
          allowed_age_range?: string | null
          allowed_days?: number[] | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          archived_at?: string | null
          archived_by?: string | null
          average_rating?: number | null
          banner_image_url?: string | null
          blocked_categories?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          challenge_participation?: Json | null
          classroom_course_id?: string | null
          classroom_integration_enabled?: boolean | null
          clever_last_sync?: string | null
          clever_section_id?: string | null
          clever_sync_enabled?: boolean
          clever_sync_errors?: Json | null
          content_filter_level?: string | null
          created_at?: string | null
          created_by?: string
          custom_type_label?: string | null
          daily_time_limit_minutes?: number | null
          description?: string | null
          display_name?: string | null
          family_name?: string | null
          grade_passback_enabled?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_private?: boolean | null
          is_public?: boolean | null
          join_code?: string | null
          lms_platform?: "google_classroom" | "clever" | null
          max_difficulty_level?: number | null
          max_members?: number | null
          milestone_data?: Json | null
          parent_email?: string | null
          partnership_status?: string | null
          personality_type?: string | null
          pod_color?: string | null
          pod_description?: string | null
          pod_emoji?: string | null
          pod_motto?: string | null
          pod_name?: string
          pod_slug?: string | null
          pod_type?: string
          report_frequency?: string | null
          require_parent_approval_for_friends?: boolean | null
          roster_last_synced?: string | null
          search_tags?: string[] | null
          send_progress_reports?: boolean | null
          short_description?: string | null
          target_age_range?: string | null
          theme_id?: string | null
          topics_covered?: string[] | null
          total_ratings?: number | null
          track_detailed_activity?: boolean | null
          unlocked_features?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_pods_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "pod_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      media_organizations: {
        Row: {
          alternate_domains: string[] | null
          corrections_policy: string | null
          created_at: string | null
          credibility_rating: number | null
          description: string | null
          domain: string | null
          editorial_stance: string | null
          fact_checking_methodology: string | null
          founding_year: number | null
          funding_sources: Json | null
          headquarters_location: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          organization_type: string
          ownership_structure: string | null
          parent_organization_id: string | null
          social_media_links: Json | null
          stated_values: string[] | null
          transparency_score: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          alternate_domains?: string[] | null
          corrections_policy?: string | null
          created_at?: string | null
          credibility_rating?: number | null
          description?: string | null
          domain?: string | null
          editorial_stance?: string | null
          fact_checking_methodology?: string | null
          founding_year?: number | null
          funding_sources?: Json | null
          headquarters_location?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          organization_type?: string
          ownership_structure?: string | null
          parent_organization_id?: string | null
          social_media_links?: Json | null
          stated_values?: string[] | null
          transparency_score?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          alternate_domains?: string[] | null
          corrections_policy?: string | null
          created_at?: string | null
          credibility_rating?: number | null
          description?: string | null
          domain?: string | null
          editorial_stance?: string | null
          fact_checking_methodology?: string | null
          founding_year?: number | null
          funding_sources?: Json | null
          headquarters_location?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          organization_type?: string
          ownership_structure?: string | null
          parent_organization_id?: string | null
          social_media_links?: Json | null
          stated_values?: string[] | null
          transparency_score?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "media_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_individual_settings: {
        Row: {
          alert_on_inappropriate_content: boolean | null
          allowed_days: number[] | null
          allowed_end_time: string | null
          allowed_start_time: string | null
          blocked_categories: string[] | null
          can_access_chat: boolean | null
          can_access_multiplayer: boolean | null
          can_share_progress: boolean | null
          can_view_leaderboards: boolean | null
          content_filter_level: string | null
          created_at: string
          daily_time_limit_minutes: number | null
          id: string
          max_difficulty_level: number | null
          override_content_filter: boolean | null
          override_feature_access: boolean | null
          override_monitoring: boolean | null
          override_time_limits: boolean | null
          pod_id: string
          report_frequency: string | null
          send_progress_reports: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_on_inappropriate_content?: boolean | null
          allowed_days?: number[] | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          blocked_categories?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          content_filter_level?: string | null
          created_at?: string
          daily_time_limit_minutes?: number | null
          id?: string
          max_difficulty_level?: number | null
          override_content_filter?: boolean | null
          override_feature_access?: boolean | null
          override_monitoring?: boolean | null
          override_time_limits?: boolean | null
          pod_id: string
          report_frequency?: string | null
          send_progress_reports?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_on_inappropriate_content?: boolean | null
          allowed_days?: number[] | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          blocked_categories?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          content_filter_level?: string | null
          created_at?: string
          daily_time_limit_minutes?: number | null
          id?: string
          max_difficulty_level?: number | null
          override_content_filter?: boolean | null
          override_feature_access?: boolean | null
          override_monitoring?: boolean | null
          override_time_limits?: boolean | null
          pod_id?: string
          report_frequency?: string | null
          send_progress_reports?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_individual_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_individual_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_individual_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "member_settings_membership_fkey"
            columns: ["pod_id", "user_id"]
            isOneToOne: true
            referencedRelation: "pod_member_details"
            referencedColumns: ["pod_id", "user_id"]
          },
          {
            foreignKeyName: "member_settings_membership_fkey"
            columns: ["pod_id", "user_id"]
            isOneToOne: true
            referencedRelation: "pod_memberships"
            referencedColumns: ["pod_id", "user_id"]
          },
        ]
      }
      multiplayer_chat_messages: {
        Row: {
          created_at: string | null
          id: string
          is_from_host: boolean | null
          is_from_npc: boolean | null
          message_text: string
          message_type: string
          metadata: Json | null
          player_id: string
          reply_to_message_id: string | null
          room_id: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_from_host?: boolean | null
          is_from_npc?: boolean | null
          message_text: string
          message_type?: string
          metadata?: Json | null
          player_id: string
          reply_to_message_id?: string | null
          room_id: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_from_host?: boolean | null
          is_from_npc?: boolean | null
          message_text?: string
          message_type?: string
          metadata?: Json | null
          player_id?: string
          reply_to_message_id?: string | null
          room_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_chat_messages_reply_to_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_conversation_context: {
        Row: {
          conversation_history: Json | null
          created_at: string | null
          educational_goals: Json | null
          id: string
          last_interaction_at: string | null
          npc_player_id: string
          personality_state: Json | null
          room_id: string
          updated_at: string | null
        }
        Insert: {
          conversation_history?: Json | null
          created_at?: string | null
          educational_goals?: Json | null
          id?: string
          last_interaction_at?: string | null
          npc_player_id: string
          personality_state?: Json | null
          room_id: string
          updated_at?: string | null
        }
        Update: {
          conversation_history?: Json | null
          created_at?: string | null
          educational_goals?: Json | null
          id?: string
          last_interaction_at?: string | null
          npc_player_id?: string
          personality_state?: Json | null
          room_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      multiplayer_game_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          player_id: string
          question_number: number | null
          room_id: string
          session_id: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          player_id: string
          question_number?: number | null
          room_id: string
          session_id: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          player_id?: string
          question_number?: number | null
          room_id?: string
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_game_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_game_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_question_number: number | null
          final_scores: Json | null
          game_mode: string
          id: string
          performance_stats: Json | null
          room_id: string
          session_config: Json | null
          session_number: number
          session_status: string
          started_at: string | null
          topic_id: string
          total_questions: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_question_number?: number | null
          final_scores?: Json | null
          game_mode?: string
          id?: string
          performance_stats?: Json | null
          room_id: string
          session_config?: Json | null
          session_number?: number
          session_status?: string
          started_at?: string | null
          topic_id: string
          total_questions?: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_question_number?: number | null
          final_scores?: Json | null
          game_mode?: string
          id?: string
          performance_stats?: Json | null
          room_id?: string
          session_config?: Json | null
          session_number?: number
          session_status?: string
          started_at?: string | null
          topic_id?: string
          total_questions?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      multiplayer_npc_players: {
        Row: {
          ai_behavior_config: Json | null
          created_at: string | null
          difficulty_level: number | null
          id: string
          is_active: boolean | null
          npc_id: string
          personality_type: string | null
          player_emoji: string
          player_name: string
          questions_answered: number | null
          questions_correct: number | null
          room_id: string
          score: number | null
          updated_at: string | null
        }
        Insert: {
          ai_behavior_config?: Json | null
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          is_active?: boolean | null
          npc_id: string
          personality_type?: string | null
          player_emoji: string
          player_name: string
          questions_answered?: number | null
          questions_correct?: number | null
          room_id: string
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_behavior_config?: Json | null
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          is_active?: boolean | null
          npc_id?: string
          personality_type?: string | null
          player_emoji?: string
          player_name?: string
          questions_answered?: number | null
          questions_correct?: number | null
          room_id?: string
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_npc_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_npc_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms_view"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_question_responses: {
        Row: {
          boosts_used: number | null
          created_at: string | null
          hints_used: number | null
          id: string
          is_correct: boolean | null
          npc_player_id: string | null
          player_id: string | null
          points_earned: number | null
          question_id: string
          question_number: number
          response_metadata: Json | null
          response_time_ms: number | null
          room_id: string
          selected_answer: string | null
          submitted_at: string | null
          topic_id: string
        }
        Insert: {
          boosts_used?: number | null
          created_at?: string | null
          hints_used?: number | null
          id?: string
          is_correct?: boolean | null
          npc_player_id?: string | null
          player_id?: string | null
          points_earned?: number | null
          question_id: string
          question_number: number
          response_metadata?: Json | null
          response_time_ms?: number | null
          room_id: string
          selected_answer?: string | null
          submitted_at?: string | null
          topic_id: string
        }
        Update: {
          boosts_used?: number | null
          created_at?: string | null
          hints_used?: number | null
          id?: string
          is_correct?: boolean | null
          npc_player_id?: string | null
          player_id?: string | null
          points_earned?: number | null
          question_id?: string
          question_number?: number
          response_metadata?: Json | null
          response_time_ms?: number | null
          room_id?: string
          selected_answer?: string | null
          submitted_at?: string | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_question_responses_npc_player_id_fkey"
            columns: ["npc_player_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_npc_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_question_responses_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_room_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_question_responses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_question_responses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms_view"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_quiz_attempts: {
        Row: {
          attempt_data: Json | null
          completed_at: string | null
          created_at: string | null
          final_score: number | null
          id: string
          player_id: string
          questions_correct: number | null
          questions_total: number | null
          room_id: string
          session_id: string
          time_spent_seconds: number | null
          topic_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempt_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          final_score?: number | null
          id?: string
          player_id: string
          questions_correct?: number | null
          questions_total?: number | null
          room_id: string
          session_id: string
          time_spent_seconds?: number | null
          topic_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          final_score?: number | null
          id?: string
          player_id?: string
          questions_correct?: number | null
          questions_total?: number | null
          room_id?: string
          session_id?: string
          time_spent_seconds?: number | null
          topic_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_quiz_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_room_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          player_id: string | null
          room_id: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          player_id?: string | null
          room_id: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          player_id?: string | null
          room_id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      multiplayer_room_players: {
        Row: {
          character_resources: Json | null
          created_at: string | null
          guest_token: string | null
          id: string
          is_connected: boolean | null
          is_host: boolean | null
          is_ready: boolean | null
          join_order: number | null
          last_activity_at: string | null
          player_emoji: string | null
          player_name: string
          questions_answered: number | null
          questions_correct: number | null
          room_id: string
          score: number | null
          selected_character_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          character_resources?: Json | null
          created_at?: string | null
          guest_token?: string | null
          id?: string
          is_connected?: boolean | null
          is_host?: boolean | null
          is_ready?: boolean | null
          join_order?: number | null
          last_activity_at?: string | null
          player_emoji?: string | null
          player_name: string
          questions_answered?: number | null
          questions_correct?: number | null
          room_id: string
          score?: number | null
          selected_character_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          character_resources?: Json | null
          created_at?: string | null
          guest_token?: string | null
          id?: string
          is_connected?: boolean | null
          is_host?: boolean | null
          is_ready?: boolean | null
          join_order?: number | null
          last_activity_at?: string | null
          player_emoji?: string | null
          player_name?: string
          questions_answered?: number | null
          questions_correct?: number | null
          room_id?: string
          score?: number | null
          selected_character_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_room_players_selected_character_id_fkey"
            columns: ["selected_character_id"]
            isOneToOne: false
            referencedRelation: "scenario_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_rooms: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_players: number | null
          expires_at: string | null
          game_mode: string | null
          game_type: string | null
          host_display_name: string | null
          host_user_id: string | null
          id: string
          max_players: number | null
          room_code: string
          room_name: string | null
          room_status: string | null
          scenario_id: string | null
          scenario_settings: Json | null
          settings: Json | null
          started_at: string | null
          status: string | null
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_players?: number | null
          expires_at?: string | null
          game_mode?: string | null
          game_type?: string | null
          host_display_name?: string | null
          host_user_id?: string | null
          id?: string
          max_players?: number | null
          room_code: string
          room_name?: string | null
          room_status?: string | null
          scenario_id?: string | null
          scenario_settings?: Json | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_players?: number | null
          expires_at?: string | null
          game_mode?: string | null
          game_type?: string | null
          host_display_name?: string | null
          host_user_id?: string | null
          id?: string
          max_players?: number | null
          room_code?: string
          room_name?: string | null
          room_status?: string | null
          scenario_id?: string | null
          scenario_settings?: Json | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_rooms_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      news_agent_config: {
        Row: {
          config: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_agent_logs: {
        Row: {
          config_snapshot: Json | null
          created_at: string
          error: string | null
          events_found: number
          events_processed: number
          id: string
          memory_usage_mb: number | null
          processing_time_ms: number | null
          relevant_events: number
          status: string
          timestamp: string
        }
        Insert: {
          config_snapshot?: Json | null
          created_at?: string
          error?: string | null
          events_found?: number
          events_processed?: number
          id?: string
          memory_usage_mb?: number | null
          processing_time_ms?: number | null
          relevant_events?: number
          status: string
          timestamp: string
        }
        Update: {
          config_snapshot?: Json | null
          created_at?: string
          error?: string | null
          events_found?: number
          events_processed?: number
          id?: string
          memory_usage_mb?: number | null
          processing_time_ms?: number | null
          relevant_events?: number
          status?: string
          timestamp?: string
        }
        Relationships: []
      }
      news_cache: {
        Row: {
          articles_data: Json
          cache_key: string
          created_at: string
          id: string
          source_info: string | null
        }
        Insert: {
          articles_data: Json
          cache_key: string
          created_at?: string
          id?: string
          source_info?: string | null
        }
        Update: {
          articles_data?: Json
          cache_key?: string
          created_at?: string
          id?: string
          source_info?: string | null
        }
        Relationships: []
      }
      news_events: {
        Row: {
          civic_relevance_score: number
          content: string
          content_generation_status: string
          content_package_id: string | null
          created_at: string
          discovered_at: string
          government_actors_involved: string[] | null
          headline: string
          id: string
          policy_areas_affected: string[] | null
          potential_civic_actions: string[] | null
          power_dynamics_revealed: string[] | null
          published_at: string
          source: string
          source_url: string
          updated_at: string
        }
        Insert: {
          civic_relevance_score: number
          content: string
          content_generation_status?: string
          content_package_id?: string | null
          created_at?: string
          discovered_at?: string
          government_actors_involved?: string[] | null
          headline: string
          id: string
          policy_areas_affected?: string[] | null
          potential_civic_actions?: string[] | null
          power_dynamics_revealed?: string[] | null
          published_at: string
          source: string
          source_url: string
          updated_at?: string
        }
        Update: {
          civic_relevance_score?: number
          content?: string
          content_generation_status?: string
          content_package_id?: string | null
          created_at?: string
          discovered_at?: string
          government_actors_involved?: string[] | null
          headline?: string
          id?: string
          policy_areas_affected?: string[] | null
          potential_civic_actions?: string[] | null
          power_dynamics_revealed?: string[] | null
          published_at?: string
          source?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      npc_category_specializations: {
        Row: {
          category: string
          confidence_modifier: number
          created_at: string
          id: string
          modifier_percentage: number
          npc_id: string
          specialization_type: string
        }
        Insert: {
          category: string
          confidence_modifier?: number
          created_at?: string
          id?: string
          modifier_percentage?: number
          npc_id: string
          specialization_type: string
        }
        Update: {
          category?: string
          confidence_modifier?: number
          created_at?: string
          id?: string
          modifier_percentage?: number
          npc_id?: string
          specialization_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "npc_category_specializations_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npc_personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      npc_chat_templates: {
        Row: {
          context_filter: Json | null
          created_at: string
          id: string
          is_active: boolean
          last_used_at: string | null
          message_template: string
          mood_tags: string[] | null
          npc_id: string
          skill_level_tags: string[] | null
          trigger_type: string
          usage_count: number
          variables: Json | null
        }
        Insert: {
          context_filter?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          message_template: string
          mood_tags?: string[] | null
          npc_id: string
          skill_level_tags?: string[] | null
          trigger_type: string
          usage_count?: number
          variables?: Json | null
        }
        Update: {
          context_filter?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          message_template?: string
          mood_tags?: string[] | null
          npc_id?: string
          skill_level_tags?: string[] | null
          trigger_type?: string
          usage_count?: number
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "npc_chat_templates_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npc_personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      npc_conversation_history: {
        Row: {
          context_data: Json | null
          created_at: string
          educational_value: string | null
          follow_up_generated: boolean | null
          id: string
          message: string
          npc_id: string
          openai_metadata: Json | null
          personality_traits: string[] | null
          player_id: string | null
          response_to_user_id: string | null
          room_id: string | null
          tone: string | null
          trigger_type: string
          user_reactions: Json | null
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          educational_value?: string | null
          follow_up_generated?: boolean | null
          id?: string
          message: string
          npc_id: string
          openai_metadata?: Json | null
          personality_traits?: string[] | null
          player_id?: string | null
          response_to_user_id?: string | null
          room_id?: string | null
          tone?: string | null
          trigger_type: string
          user_reactions?: Json | null
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          educational_value?: string | null
          follow_up_generated?: boolean | null
          id?: string
          message?: string
          npc_id?: string
          openai_metadata?: Json | null
          personality_traits?: string[] | null
          player_id?: string | null
          response_to_user_id?: string | null
          room_id?: string | null
          tone?: string | null
          trigger_type?: string
          user_reactions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "npc_conversation_history_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npc_personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      npc_learning_progression: {
        Row: {
          avg_human_accuracy: number | null
          category: string
          confidence_trend: number
          correct_responses: number
          current_accuracy: number
          id: string
          last_updated: string
          learning_velocity: number
          npc_id: string
          percentile_rank: number | null
          plateau_indicator: number
          questions_seen: number
          total_response_time: number
          vs_humans_win_rate: number
        }
        Insert: {
          avg_human_accuracy?: number | null
          category: string
          confidence_trend?: number
          correct_responses?: number
          current_accuracy?: number
          id?: string
          last_updated?: string
          learning_velocity?: number
          npc_id: string
          percentile_rank?: number | null
          plateau_indicator?: number
          questions_seen?: number
          total_response_time?: number
          vs_humans_win_rate?: number
        }
        Update: {
          avg_human_accuracy?: number | null
          category?: string
          confidence_trend?: number
          correct_responses?: number
          current_accuracy?: number
          id?: string
          last_updated?: string
          learning_velocity?: number
          npc_id?: string
          percentile_rank?: number | null
          plateau_indicator?: number
          questions_seen?: number
          total_response_time?: number
          vs_humans_win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "npc_learning_progression_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npc_personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      npc_personalities: {
        Row: {
          adaptation_rate: number
          age_range: string | null
          background_story: string | null
          base_accuracy_max: number
          base_accuracy_min: number
          base_skill_level: string
          byline: string | null
          chattiness_level: number
          communication_style: string | null
          confidence_level: number
          consistency_factor: number
          created_at: string
          description: string | null
          display_name: string
          emoji: string
          encouragement_style: string
          first_name: string | null
          humor_level: number
          id: string
          is_active: boolean
          last_name: string | null
          learning_enabled: boolean
          learning_motivation: string | null
          location: string | null
          max_skill_drift: number
          npc_code: string
          personality_type: string
          political_engagement_level: string | null
          preferred_topics: string[] | null
          profession: string | null
          response_time_max: number
          response_time_min: number
          updated_at: string
        }
        Insert: {
          adaptation_rate?: number
          age_range?: string | null
          background_story?: string | null
          base_accuracy_max?: number
          base_accuracy_min?: number
          base_skill_level?: string
          byline?: string | null
          chattiness_level?: number
          communication_style?: string | null
          confidence_level?: number
          consistency_factor?: number
          created_at?: string
          description?: string | null
          display_name: string
          emoji?: string
          encouragement_style?: string
          first_name?: string | null
          humor_level?: number
          id?: string
          is_active?: boolean
          last_name?: string | null
          learning_enabled?: boolean
          learning_motivation?: string | null
          location?: string | null
          max_skill_drift?: number
          npc_code: string
          personality_type: string
          political_engagement_level?: string | null
          preferred_topics?: string[] | null
          profession?: string | null
          response_time_max?: number
          response_time_min?: number
          updated_at?: string
        }
        Update: {
          adaptation_rate?: number
          age_range?: string | null
          background_story?: string | null
          base_accuracy_max?: number
          base_accuracy_min?: number
          base_skill_level?: string
          byline?: string | null
          chattiness_level?: number
          communication_style?: string | null
          confidence_level?: number
          consistency_factor?: number
          created_at?: string
          description?: string | null
          display_name?: string
          emoji?: string
          encouragement_style?: string
          first_name?: string | null
          humor_level?: number
          id?: string
          is_active?: boolean
          last_name?: string | null
          learning_enabled?: boolean
          learning_motivation?: string | null
          location?: string | null
          max_skill_drift?: number
          npc_code?: string
          personality_type?: string
          political_engagement_level?: string | null
          preferred_topics?: string[] | null
          profession?: string | null
          response_time_max?: number
          response_time_min?: number
          updated_at?: string
        }
        Relationships: []
      }
      npc_question_responses: {
        Row: {
          answered_at: string
          attempt_id: string
          base_accuracy_used: number
          category_modifier_applied: number
          confidence_level: number
          correct_answer: string
          difficulty_modifier_applied: number
          human_responses_seen: number
          id: string
          is_correct: boolean
          learning_weight: number
          npc_id: string
          question_category: string | null
          question_difficulty: number | null
          question_id: string
          random_variance_applied: number
          response_time_seconds: number
          selected_answer: string | null
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          base_accuracy_used: number
          category_modifier_applied?: number
          confidence_level?: number
          correct_answer: string
          difficulty_modifier_applied?: number
          human_responses_seen?: number
          id?: string
          is_correct: boolean
          learning_weight?: number
          npc_id: string
          question_category?: string | null
          question_difficulty?: number | null
          question_id: string
          random_variance_applied?: number
          response_time_seconds: number
          selected_answer?: string | null
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          base_accuracy_used?: number
          category_modifier_applied?: number
          confidence_level?: number
          correct_answer?: string
          difficulty_modifier_applied?: number
          human_responses_seen?: number
          id?: string
          is_correct?: boolean
          learning_weight?: number
          npc_id?: string
          question_category?: string | null
          question_difficulty?: number | null
          question_id?: string
          random_variance_applied?: number
          response_time_seconds?: number
          selected_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "npc_question_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "npc_quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npc_question_responses_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npc_personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      npc_quiz_attempts: {
        Row: {
          accuracy_percentage: number | null
          average_human_score: number | null
          completed_at: string | null
          confidence_average: number
          correct_answers: number
          difficulty_adjustment: number
          human_opponents_count: number
          id: string
          is_completed: boolean
          learning_points_gained: number
          multiplayer_room_id: string | null
          npc_id: string
          placement_rank: number | null
          score: number
          started_at: string
          time_spent_seconds: number
          topic_id: string
          total_questions: number
        }
        Insert: {
          accuracy_percentage?: number | null
          average_human_score?: number | null
          completed_at?: string | null
          confidence_average?: number
          correct_answers?: number
          difficulty_adjustment?: number
          human_opponents_count?: number
          id?: string
          is_completed?: boolean
          learning_points_gained?: number
          multiplayer_room_id?: string | null
          npc_id: string
          placement_rank?: number | null
          score?: number
          started_at?: string
          time_spent_seconds?: number
          topic_id: string
          total_questions: number
        }
        Update: {
          accuracy_percentage?: number | null
          average_human_score?: number | null
          completed_at?: string | null
          confidence_average?: number
          correct_answers?: number
          difficulty_adjustment?: number
          human_opponents_count?: number
          id?: string
          is_completed?: boolean
          learning_points_gained?: number
          multiplayer_room_id?: string | null
          npc_id?: string
          placement_rank?: number | null
          score?: number
          started_at?: string
          time_spent_seconds?: number
          topic_id?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "npc_quiz_attempts_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npc_personalities"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_bias_scores: {
        Row: {
          calculation_method: string | null
          confidence_level: number
          created_at: string | null
          current_score: number
          dimension_id: string
          id: string
          last_calculated_at: string | null
          organization_id: string
          sample_size: number
          score_history: Json | null
          updated_at: string | null
        }
        Insert: {
          calculation_method?: string | null
          confidence_level?: number
          created_at?: string | null
          current_score: number
          dimension_id: string
          id?: string
          last_calculated_at?: string | null
          organization_id: string
          sample_size?: number
          score_history?: Json | null
          updated_at?: string | null
        }
        Update: {
          calculation_method?: string | null
          confidence_level?: number
          created_at?: string | null
          current_score?: number
          dimension_id?: string
          id?: string
          last_calculated_at?: string | null
          organization_id?: string
          sample_size?: number
          score_history?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_bias_scores_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "bias_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_bias_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "media_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          annual_budget: number | null
          civicsense_priority: number | null
          content_review_status: string | null
          created_at: string | null
          description: string | null
          employee_count: number | null
          founding_date: string | null
          headquarters_location: string | null
          id: string
          influence_level: number | null
          is_active: boolean | null
          key_focus_areas: string[] | null
          media_mentions_count: number | null
          name: string
          organization_type: string
          policy_impact_score: number | null
          political_leaning: string | null
          slug: string
          social_media_handles: Json | null
          sources: Json | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          annual_budget?: number | null
          civicsense_priority?: number | null
          content_review_status?: string | null
          created_at?: string | null
          description?: string | null
          employee_count?: number | null
          founding_date?: string | null
          headquarters_location?: string | null
          id?: string
          influence_level?: number | null
          is_active?: boolean | null
          key_focus_areas?: string[] | null
          media_mentions_count?: number | null
          name: string
          organization_type: string
          policy_impact_score?: number | null
          political_leaning?: string | null
          slug: string
          social_media_handles?: Json | null
          sources?: Json | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          annual_budget?: number | null
          civicsense_priority?: number | null
          content_review_status?: string | null
          created_at?: string | null
          description?: string | null
          employee_count?: number | null
          founding_date?: string | null
          headquarters_location?: string | null
          id?: string
          influence_level?: number | null
          is_active?: boolean | null
          key_focus_areas?: string[] | null
          media_mentions_count?: number | null
          name?: string
          organization_type?: string
          policy_impact_score?: number | null
          political_leaning?: string | null
          slug?: string
          social_media_handles?: Json | null
          sources?: Json | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      parental_controls: {
        Row: {
          alert_on_inappropriate_content: boolean | null
          allowed_days: number[] | null
          allowed_difficulty_max: number | null
          allowed_end_time: string | null
          allowed_start_time: string | null
          blocked_categories: string[] | null
          blocked_topics: string[] | null
          can_access_chat: boolean | null
          can_access_multiplayer: boolean | null
          can_share_progress: boolean | null
          can_view_leaderboards: boolean | null
          child_user_id: string
          content_filter_level: string | null
          created_at: string | null
          daily_time_limit_minutes: number | null
          id: string
          is_active: boolean | null
          parent_user_id: string
          pod_id: string
          report_frequency: string | null
          require_parent_approval_for_friends: boolean | null
          send_progress_reports: boolean | null
          updated_at: string | null
        }
        Insert: {
          alert_on_inappropriate_content?: boolean | null
          allowed_days?: number[] | null
          allowed_difficulty_max?: number | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          blocked_categories?: string[] | null
          blocked_topics?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          child_user_id: string
          content_filter_level?: string | null
          created_at?: string | null
          daily_time_limit_minutes?: number | null
          id?: string
          is_active?: boolean | null
          parent_user_id: string
          pod_id: string
          report_frequency?: string | null
          require_parent_approval_for_friends?: boolean | null
          send_progress_reports?: boolean | null
          updated_at?: string | null
        }
        Update: {
          alert_on_inappropriate_content?: boolean | null
          allowed_days?: number[] | null
          allowed_difficulty_max?: number | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          blocked_categories?: string[] | null
          blocked_topics?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          child_user_id?: string
          content_filter_level?: string | null
          created_at?: string | null
          daily_time_limit_minutes?: number | null
          id?: string
          is_active?: boolean | null
          parent_user_id?: string
          pod_id?: string
          report_frequency?: string | null
          require_parent_approval_for_friends?: boolean | null
          send_progress_reports?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parental_controls_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_controls_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_controls_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pathway_skills: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          pathway_id: string | null
          sequence_order: number
          skill_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          pathway_id?: string | null
          sequence_order: number
          skill_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          pathway_id?: string | null
          sequence_order?: number
          skill_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pathway_skills_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "skill_progression_pathways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_achievements: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          emoji: string
          id: string
          name: string
          rarity: string | null
          reward_data: Json | null
          reward_type: string | null
          unlock_condition: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          emoji: string
          id?: string
          name: string
          rarity?: string | null
          reward_data?: Json | null
          reward_type?: string | null
          unlock_condition: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          emoji?: string
          id?: string
          name?: string
          rarity?: string | null
          reward_data?: Json | null
          reward_type?: string | null
          unlock_condition?: Json
        }
        Relationships: []
      }
      pod_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          is_shared_publicly: boolean | null
          is_visible_to_pod: boolean | null
          pod_id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_shared_publicly?: boolean | null
          is_visible_to_pod?: boolean | null
          pod_id: string
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_shared_publicly?: boolean | null
          is_visible_to_pod?: boolean | null
          pod_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "pod_activities_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_activity_log: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          pod_id: string
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          pod_id: string
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          pod_id?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_activity_log_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_activity_log_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_activity_log_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_analytics: {
        Row: {
          active_members_today: number | null
          active_members_week: number | null
          average_accuracy: number | null
          average_session_length_minutes: number | null
          category_performance: Json | null
          created_at: string | null
          date_recorded: string
          difficulty_distribution: Json | null
          friend_requests_sent: number | null
          id: string
          messages_sent: number | null
          most_popular_topics: Json | null
          multiplayer_sessions: number | null
          new_members_today: number | null
          pod_id: string
          total_achievements_earned: number | null
          total_correct_answers: number | null
          total_members: number | null
          total_questions_answered: number | null
          total_quiz_attempts: number | null
          total_streaks_started: number | null
          total_time_spent_minutes: number | null
        }
        Insert: {
          active_members_today?: number | null
          active_members_week?: number | null
          average_accuracy?: number | null
          average_session_length_minutes?: number | null
          category_performance?: Json | null
          created_at?: string | null
          date_recorded?: string
          difficulty_distribution?: Json | null
          friend_requests_sent?: number | null
          id?: string
          messages_sent?: number | null
          most_popular_topics?: Json | null
          multiplayer_sessions?: number | null
          new_members_today?: number | null
          pod_id: string
          total_achievements_earned?: number | null
          total_correct_answers?: number | null
          total_members?: number | null
          total_questions_answered?: number | null
          total_quiz_attempts?: number | null
          total_streaks_started?: number | null
          total_time_spent_minutes?: number | null
        }
        Update: {
          active_members_today?: number | null
          active_members_week?: number | null
          average_accuracy?: number | null
          average_session_length_minutes?: number | null
          category_performance?: Json | null
          created_at?: string | null
          date_recorded?: string
          difficulty_distribution?: Json | null
          friend_requests_sent?: number | null
          id?: string
          messages_sent?: number | null
          most_popular_topics?: Json | null
          multiplayer_sessions?: number | null
          new_members_today?: number | null
          pod_id?: string
          total_achievements_earned?: number | null
          total_correct_answers?: number | null
          total_members?: number | null
          total_questions_answered?: number | null
          total_quiz_attempts?: number | null
          total_streaks_started?: number | null
          total_time_spent_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_analytics_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_analytics_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_analytics_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_progress: Json | null
          final_score: number | null
          id: string
          joined_at: string | null
          rank_position: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_progress?: Json | null
          final_score?: number | null
          id?: string
          joined_at?: string | null
          rank_position?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_progress?: Json | null
          final_score?: number | null
          id?: string
          joined_at?: string | null
          rank_position?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "pod_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_challenges: {
        Row: {
          challenge_description: string | null
          challenge_name: string
          challenge_type: string
          created_at: string | null
          created_by: string
          end_date: string | null
          id: string
          is_active: boolean | null
          pod_id: string
          reward_data: Json | null
          reward_type: string | null
          start_date: string | null
          target_metric: Json
        }
        Insert: {
          challenge_description?: string | null
          challenge_name: string
          challenge_type: string
          created_at?: string | null
          created_by: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          pod_id: string
          reward_data?: Json | null
          reward_type?: string | null
          start_date?: string | null
          target_metric: Json
        }
        Update: {
          challenge_description?: string | null
          challenge_name?: string
          challenge_type?: string
          created_at?: string | null
          created_by?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          pod_id?: string
          reward_data?: Json | null
          reward_type?: string | null
          start_date?: string | null
          target_metric?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pod_challenges_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_challenges_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_challenges_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_invite_links: {
        Row: {
          age_restrictions: Json | null
          allowed_roles: string[] | null
          created_at: string | null
          created_by: string
          current_uses: number | null
          description: string | null
          expires_at: string | null
          id: string
          invite_code: string
          invite_url: string
          is_active: boolean | null
          max_uses: number | null
          pod_id: string
          require_approval: boolean | null
        }
        Insert: {
          age_restrictions?: Json | null
          allowed_roles?: string[] | null
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          invite_code: string
          invite_url: string
          is_active?: boolean | null
          max_uses?: number | null
          pod_id: string
          require_approval?: boolean | null
        }
        Update: {
          age_restrictions?: Json | null
          allowed_roles?: string[] | null
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          invite_url?: string
          is_active?: boolean | null
          max_uses?: number | null
          pod_id?: string
          require_approval?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_invite_links_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_invite_links_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_invite_links_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_join_requests: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          invite_link_id: string | null
          message: string | null
          pod_id: string
          requested_role: string | null
          requester_age: number | null
          requester_id: string
          review_message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_link_id?: string | null
          message?: string | null
          pod_id: string
          requested_role?: string | null
          requester_age?: number | null
          requester_id: string
          review_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_link_id?: string | null
          message?: string | null
          pod_id?: string
          requested_role?: string | null
          requester_age?: number | null
          requester_id?: string
          review_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_join_requests_invite_link_id_fkey"
            columns: ["invite_link_id"]
            isOneToOne: false
            referencedRelation: "pod_invite_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_join_requests_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_join_requests_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_join_requests_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_member_analytics: {
        Row: {
          accuracy_rate: number | null
          achievements_earned: number | null
          average_difficulty: number | null
          correct_answers: number | null
          created_at: string | null
          current_streak: number | null
          date_recorded: string
          difficulty_progression: Json | null
          help_provided: number | null
          help_requests_sent: number | null
          id: string
          longest_session_minutes: number | null
          longest_streak: number | null
          messages_sent: number | null
          multiplayer_participations: number | null
          pod_id: string
          questions_answered: number | null
          quiz_attempts: number | null
          sessions_count: number | null
          time_spent_minutes: number | null
          topics_completed: number | null
          user_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          achievements_earned?: number | null
          average_difficulty?: number | null
          correct_answers?: number | null
          created_at?: string | null
          current_streak?: number | null
          date_recorded?: string
          difficulty_progression?: Json | null
          help_provided?: number | null
          help_requests_sent?: number | null
          id?: string
          longest_session_minutes?: number | null
          longest_streak?: number | null
          messages_sent?: number | null
          multiplayer_participations?: number | null
          pod_id: string
          questions_answered?: number | null
          quiz_attempts?: number | null
          sessions_count?: number | null
          time_spent_minutes?: number | null
          topics_completed?: number | null
          user_id: string
        }
        Update: {
          accuracy_rate?: number | null
          achievements_earned?: number | null
          average_difficulty?: number | null
          correct_answers?: number | null
          created_at?: string | null
          current_streak?: number | null
          date_recorded?: string
          difficulty_progression?: Json | null
          help_provided?: number | null
          help_requests_sent?: number | null
          id?: string
          longest_session_minutes?: number | null
          longest_streak?: number | null
          messages_sent?: number | null
          multiplayer_participations?: number | null
          pod_id?: string
          questions_answered?: number | null
          quiz_attempts?: number | null
          sessions_count?: number | null
          time_spent_minutes?: number | null
          topics_completed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_member_analytics_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_member_analytics_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_member_analytics_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "pod_member_analytics_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_member_settings: {
        Row: {
          alert_on_inappropriate_content: boolean | null
          allow_sensitive_topics: boolean | null
          allowed_days: number[] | null
          allowed_end_time: string | null
          allowed_start_time: string | null
          blocked_categories: string[] | null
          can_access_chat: boolean | null
          can_access_multiplayer: boolean | null
          can_share_progress: boolean | null
          can_view_leaderboards: boolean | null
          content_filter_level: string | null
          created_at: string | null
          daily_time_limit_minutes: number | null
          id: string
          max_difficulty_level: number | null
          override_content_filter: boolean | null
          override_feature_access: boolean | null
          override_monitoring: boolean | null
          override_time_limits: boolean | null
          pod_id: string
          report_frequency: string | null
          send_progress_reports: boolean | null
          track_detailed_activity: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_on_inappropriate_content?: boolean | null
          allow_sensitive_topics?: boolean | null
          allowed_days?: number[] | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          blocked_categories?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          content_filter_level?: string | null
          created_at?: string | null
          daily_time_limit_minutes?: number | null
          id?: string
          max_difficulty_level?: number | null
          override_content_filter?: boolean | null
          override_feature_access?: boolean | null
          override_monitoring?: boolean | null
          override_time_limits?: boolean | null
          pod_id: string
          report_frequency?: string | null
          send_progress_reports?: boolean | null
          track_detailed_activity?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_on_inappropriate_content?: boolean | null
          allow_sensitive_topics?: boolean | null
          allowed_days?: number[] | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          blocked_categories?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          content_filter_level?: string | null
          created_at?: string | null
          daily_time_limit_minutes?: number | null
          id?: string
          max_difficulty_level?: number | null
          override_content_filter?: boolean | null
          override_feature_access?: boolean | null
          override_monitoring?: boolean | null
          override_time_limits?: boolean | null
          pod_id?: string
          report_frequency?: string | null
          send_progress_reports?: boolean | null
          track_detailed_activity?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_member_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_member_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_member_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_memberships: {
        Row: {
          birth_date: string | null
          can_invite_members: boolean | null
          can_message: boolean | null
          can_modify_settings: boolean | null
          can_view_progress: boolean | null
          created_at: string | null
          grade_level: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          membership_status: string | null
          parental_consent: boolean | null
          pod_id: string
          role: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          can_invite_members?: boolean | null
          can_message?: boolean | null
          can_modify_settings?: boolean | null
          can_view_progress?: boolean | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          membership_status?: string | null
          parental_consent?: boolean | null
          pod_id: string
          role?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          can_invite_members?: boolean | null
          can_message?: boolean | null
          can_modify_settings?: boolean | null
          can_view_progress?: boolean | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          membership_status?: string | null
          parental_consent?: boolean | null
          pod_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_memberships_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_memberships_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_memberships_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "pod_memberships_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_partnerships: {
        Row: {
          created_at: string | null
          id: string
          initiated_by: string
          partnership_data: Json | null
          partnership_type: string | null
          pod_1_id: string
          pod_2_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          initiated_by: string
          partnership_data?: Json | null
          partnership_type?: string | null
          pod_1_id: string
          pod_2_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          initiated_by?: string
          partnership_data?: Json | null
          partnership_type?: string | null
          pod_1_id?: string
          pod_2_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_partnerships_pod_1_id_fkey"
            columns: ["pod_1_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_partnerships_pod_1_id_fkey"
            columns: ["pod_1_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_partnerships_pod_1_id_fkey"
            columns: ["pod_1_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "pod_partnerships_pod_2_id_fkey"
            columns: ["pod_2_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_partnerships_pod_2_id_fkey"
            columns: ["pod_2_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_partnerships_pod_2_id_fkey"
            columns: ["pod_2_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_ratings: {
        Row: {
          community_rating: number | null
          content_quality_rating: number | null
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          is_public: boolean | null
          organization_rating: number | null
          pod_id: string
          rating: number
          review: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_rating?: number | null
          content_quality_rating?: number | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_public?: boolean | null
          organization_rating?: number | null
          pod_id: string
          rating: number
          review?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_rating?: number | null
          content_quality_rating?: number | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_public?: boolean | null
          organization_rating?: number | null
          pod_id?: string
          rating?: number
          review?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_ratings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_ratings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_ratings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_settings: {
        Row: {
          alert_on_inappropriate_content: boolean | null
          allow_sensitive_topics: boolean | null
          allowed_days: number[] | null
          allowed_end_time: string | null
          allowed_start_time: string | null
          blocked_categories: string[] | null
          can_access_chat: boolean | null
          can_access_multiplayer: boolean | null
          can_share_progress: boolean | null
          can_view_leaderboards: boolean | null
          created_at: string
          daily_time_limit_minutes: number | null
          description: string | null
          id: string
          is_public: boolean | null
          max_difficulty_level: number | null
          pod_id: string
          report_frequency: string | null
          require_parent_approval_for_friends: boolean | null
          send_progress_reports: boolean | null
          track_detailed_activity: boolean | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          alert_on_inappropriate_content?: boolean | null
          allow_sensitive_topics?: boolean | null
          allowed_days?: number[] | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          blocked_categories?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          created_at?: string
          daily_time_limit_minutes?: number | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_difficulty_level?: number | null
          pod_id: string
          report_frequency?: string | null
          require_parent_approval_for_friends?: boolean | null
          send_progress_reports?: boolean | null
          track_detailed_activity?: boolean | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          alert_on_inappropriate_content?: boolean | null
          allow_sensitive_topics?: boolean | null
          allowed_days?: number[] | null
          allowed_end_time?: string | null
          allowed_start_time?: string | null
          blocked_categories?: string[] | null
          can_access_chat?: boolean | null
          can_access_multiplayer?: boolean | null
          can_share_progress?: boolean | null
          can_view_leaderboards?: boolean | null
          created_at?: string
          daily_time_limit_minutes?: number | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_difficulty_level?: number | null
          pod_id?: string
          report_frequency?: string | null
          require_parent_approval_for_friends?: boolean | null
          send_progress_reports?: boolean | null
          track_detailed_activity?: boolean | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: true
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: true
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_settings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: true
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_themes: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          emoji: string
          id: string
          is_seasonal: boolean | null
          name: string
          primary_color: string
          season_end: string | null
          season_start: string | null
          secondary_color: string | null
          unlock_condition: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          emoji: string
          id?: string
          is_seasonal?: boolean | null
          name: string
          primary_color: string
          season_end?: string | null
          season_start?: string | null
          secondary_color?: string | null
          unlock_condition?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          emoji?: string
          id?: string
          is_seasonal?: boolean | null
          name?: string
          primary_color?: string
          season_end?: string | null
          season_start?: string | null
          secondary_color?: string | null
          unlock_condition?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievement_badges: Json | null
          avatar_url: string | null
          display_name: string | null
          engagement_level: string | null
          focus_areas: string[] | null
          full_name: string | null
          high_contrast_mode: boolean | null
          id: string
          is_admin: boolean | null
          preferred_language: string | null
          preferred_pod_personality: string | null
          role: string | null
          sensory_friendly_mode: boolean | null
          total_achievements: number | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          achievement_badges?: Json | null
          avatar_url?: string | null
          display_name?: string | null
          engagement_level?: string | null
          focus_areas?: string[] | null
          full_name?: string | null
          high_contrast_mode?: boolean | null
          id: string
          is_admin?: boolean | null
          preferred_language?: string | null
          preferred_pod_personality?: string | null
          role?: string | null
          sensory_friendly_mode?: boolean | null
          total_achievements?: number | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          achievement_badges?: Json | null
          avatar_url?: string | null
          display_name?: string | null
          engagement_level?: string | null
          focus_areas?: string[] | null
          full_name?: string | null
          high_contrast_mode?: boolean | null
          id?: string
          is_admin?: boolean | null
          preferred_language?: string | null
          preferred_pod_personality?: string | null
          role?: string | null
          sensory_friendly_mode?: boolean | null
          total_achievements?: number | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      progress_question_responses: {
        Row: {
          answered_at: string
          attempt_number: number | null
          boost_used: string | null
          hint_used: boolean | null
          id: string
          is_correct: boolean
          progress_session_id: string
          question_id: string | null
          question_index: number
          time_spent_seconds: number | null
          user_answer: string
        }
        Insert: {
          answered_at?: string
          attempt_number?: number | null
          boost_used?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct: boolean
          progress_session_id: string
          question_id?: string | null
          question_index: number
          time_spent_seconds?: number | null
          user_answer: string
        }
        Update: {
          answered_at?: string
          attempt_number?: number | null
          boost_used?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct?: boolean
          progress_session_id?: string
          question_id?: string | null
          question_index?: number
          time_spent_seconds?: number | null
          user_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_question_responses_progress_session_id_fkey"
            columns: ["progress_session_id"]
            isOneToOne: false
            referencedRelation: "progress_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "progress_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "progress_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "progress_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_sessions: {
        Row: {
          answers: Json
          assessment_type: string | null
          category_performance: Json | null
          classroom_assignment_id: string | null
          classroom_course_id: string | null
          clever_assignment_id: string | null
          clever_section_id: string | null
          current_question_index: number
          expires_at: string
          guest_token: string | null
          id: string
          last_updated_at: string
          max_streak: number
          metadata: Json | null
          questions: Json
          response_times: Json
          session_id: string
          session_type: string
          started_at: string
          streak: number
          test_type: string | null
          topic_id: string | null
          user_id: string | null
        }
        Insert: {
          answers?: Json
          assessment_type?: string | null
          category_performance?: Json | null
          classroom_assignment_id?: string | null
          classroom_course_id?: string | null
          clever_assignment_id?: string | null
          clever_section_id?: string | null
          current_question_index?: number
          expires_at?: string
          guest_token?: string | null
          id?: string
          last_updated_at?: string
          max_streak?: number
          metadata?: Json | null
          questions: Json
          response_times?: Json
          session_id: string
          session_type: string
          started_at?: string
          streak?: number
          test_type?: string | null
          topic_id?: string | null
          user_id?: string | null
        }
        Update: {
          answers?: Json
          assessment_type?: string | null
          category_performance?: Json | null
          classroom_assignment_id?: string | null
          classroom_course_id?: string | null
          clever_assignment_id?: string | null
          clever_section_id?: string | null
          current_question_index?: number
          expires_at?: string
          guest_token?: string | null
          id?: string
          last_updated_at?: string
          max_streak?: number
          metadata?: Json | null
          questions?: Json
          response_times?: Json
          session_id?: string
          session_type?: string
          started_at?: string
          streak?: number
          test_type?: string | null
          topic_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "progress_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      public_figures: {
        Row: {
          bills_sponsored: number | null
          bio: string | null
          birth_state: string | null
          birth_year: number | null
          book_publications: string[] | null
          career_highlights: string[] | null
          civicsense_priority: number | null
          committee_memberships: string[] | null
          content_difficulty_level: number | null
          content_review_status: string | null
          created_at: string | null
          current_positions: string[] | null
          current_residence_state: string | null
          display_name: string | null
          education_background: string | null
          fact_check_status: string | null
          financial_interests: string[] | null
          full_name: string
          id: string
          influence_level: number | null
          is_active: boolean | null
          key_policies_supported: string[] | null
          key_positions: string[] | null
          key_votes: Json | null
          last_quiz_topic_generated: string | null
          major_speeches: Json | null
          media_appearances_count: number | null
          net_worth_estimate: number | null
          notable_controversies: string[] | null
          party_affiliation: string | null
          policy_flip_flops: Json | null
          primary_role_category: string | null
          quotable_statements: string[] | null
          region: string | null
          scandals_timeline: Json | null
          slug: string
          social_media_handles: Json | null
          sources: Json | null
          trump_relationship_type: string | null
          updated_at: string | null
          voting_record_url: string | null
        }
        Insert: {
          bills_sponsored?: number | null
          bio?: string | null
          birth_state?: string | null
          birth_year?: number | null
          book_publications?: string[] | null
          career_highlights?: string[] | null
          civicsense_priority?: number | null
          committee_memberships?: string[] | null
          content_difficulty_level?: number | null
          content_review_status?: string | null
          created_at?: string | null
          current_positions?: string[] | null
          current_residence_state?: string | null
          display_name?: string | null
          education_background?: string | null
          fact_check_status?: string | null
          financial_interests?: string[] | null
          full_name: string
          id?: string
          influence_level?: number | null
          is_active?: boolean | null
          key_policies_supported?: string[] | null
          key_positions?: string[] | null
          key_votes?: Json | null
          last_quiz_topic_generated?: string | null
          major_speeches?: Json | null
          media_appearances_count?: number | null
          net_worth_estimate?: number | null
          notable_controversies?: string[] | null
          party_affiliation?: string | null
          policy_flip_flops?: Json | null
          primary_role_category?: string | null
          quotable_statements?: string[] | null
          region?: string | null
          scandals_timeline?: Json | null
          slug: string
          social_media_handles?: Json | null
          sources?: Json | null
          trump_relationship_type?: string | null
          updated_at?: string | null
          voting_record_url?: string | null
        }
        Update: {
          bills_sponsored?: number | null
          bio?: string | null
          birth_state?: string | null
          birth_year?: number | null
          book_publications?: string[] | null
          career_highlights?: string[] | null
          civicsense_priority?: number | null
          committee_memberships?: string[] | null
          content_difficulty_level?: number | null
          content_review_status?: string | null
          created_at?: string | null
          current_positions?: string[] | null
          current_residence_state?: string | null
          display_name?: string | null
          education_background?: string | null
          fact_check_status?: string | null
          financial_interests?: string[] | null
          full_name?: string
          id?: string
          influence_level?: number | null
          is_active?: boolean | null
          key_policies_supported?: string[] | null
          key_positions?: string[] | null
          key_votes?: Json | null
          last_quiz_topic_generated?: string | null
          major_speeches?: Json | null
          media_appearances_count?: number | null
          net_worth_estimate?: number | null
          notable_controversies?: string[] | null
          party_affiliation?: string | null
          policy_flip_flops?: Json | null
          primary_role_category?: string | null
          quotable_statements?: string[] | null
          region?: string | null
          scandals_timeline?: Json | null
          slug?: string
          social_media_handles?: Json | null
          sources?: Json | null
          trump_relationship_type?: string | null
          updated_at?: string | null
          voting_record_url?: string | null
        }
        Relationships: []
      }
      question_analytics: {
        Row: {
          id: number
          is_correct: boolean | null
          question_id: string | null
          selected_answer: string | null
          time_spent_seconds: number | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          is_correct?: boolean | null
          question_id?: string | null
          selected_answer?: string | null
          time_spent_seconds?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          is_correct?: boolean | null
          question_id?: string | null
          selected_answer?: string | null
          time_spent_seconds?: number | null
          timestamp?: string | null
          user_id?: string | null
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
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_feedback_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
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
      question_skills: {
        Row: {
          created_at: string | null
          id: string
          is_primary_skill: boolean | null
          question_id: string
          skill_id: string
          skill_weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary_skill?: boolean | null
          question_id: string
          skill_id: string
          skill_weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary_skill?: boolean | null
          question_id?: string
          skill_id?: string
          skill_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_skills_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_skills_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_skills_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_skills_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      question_source_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_primary_source: boolean | null
          question_id: string
          relevance_score: number | null
          show_thumbnail: boolean | null
          source_metadata_id: string
          source_name: string | null
          source_type: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_primary_source?: boolean | null
          question_id: string
          relevance_score?: number | null
          show_thumbnail?: boolean | null
          source_metadata_id: string
          source_name?: string | null
          source_type?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_primary_source?: boolean | null
          question_id?: string
          relevance_score?: number | null
          show_thumbnail?: boolean | null
          source_metadata_id?: string
          source_name?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_source_links_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_source_links_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_source_links_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_source_links_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_source_links_source_metadata_id_fkey"
            columns: ["source_metadata_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "question_source_links_source_metadata_id_fkey"
            columns: ["source_metadata_id"]
            isOneToOne: false
            referencedRelation: "source_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      question_topic_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          topic_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          topic_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_topic_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_topic_categories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      question_topics: {
        Row: {
          ai_extraction_metadata: Json | null
          ai_generated: boolean | null
          ai_generation_method: string | null
          ai_model_used: string | null
          ai_quality_score: number | null
          categories: Json
          content_package_id: string | null
          created_at: string | null
          date: string | null
          day_of_week: string | null
          description: string
          emoji: string
          id: string
          is_active: boolean | null
          is_breaking: boolean | null
          is_featured: boolean | null
          key_takeaways: Json | null
          source_analysis_id: string | null
          source_credibility_score: number | null
          topic_id: string
          topic_title: string
          translations: Json | null
          updated_at: string | null
          why_this_matters: string
        }
        Insert: {
          ai_extraction_metadata?: Json | null
          ai_generated?: boolean | null
          ai_generation_method?: string | null
          ai_model_used?: string | null
          ai_quality_score?: number | null
          categories?: Json
          content_package_id?: string | null
          created_at?: string | null
          date?: string | null
          day_of_week?: string | null
          description: string
          emoji: string
          id?: string
          is_active?: boolean | null
          is_breaking?: boolean | null
          is_featured?: boolean | null
          key_takeaways?: Json | null
          source_analysis_id?: string | null
          source_credibility_score?: number | null
          topic_id: string
          topic_title: string
          translations?: Json | null
          updated_at?: string | null
          why_this_matters: string
        }
        Update: {
          ai_extraction_metadata?: Json | null
          ai_generated?: boolean | null
          ai_generation_method?: string | null
          ai_model_used?: string | null
          ai_quality_score?: number | null
          categories?: Json
          content_package_id?: string | null
          created_at?: string | null
          date?: string | null
          day_of_week?: string | null
          description?: string
          emoji?: string
          id?: string
          is_active?: boolean | null
          is_breaking?: boolean | null
          is_featured?: boolean | null
          key_takeaways?: Json | null
          source_analysis_id?: string | null
          source_credibility_score?: number | null
          topic_id?: string
          topic_title?: string
          translations?: Json | null
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
          fact_check_notes: Json | null
          fact_check_status: string | null
          hint: string
          id: string
          is_active: boolean | null
          last_fact_check: string | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question: string
          question_number: number | null
          question_type: string
          sources: Json | null
          tags: Json | null
          topic_id: string
          translations: Json | null
          updated_at: string | null
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty_level?: number | null
          explanation: string
          fact_check_notes?: Json | null
          fact_check_status?: string | null
          hint: string
          id?: string
          is_active?: boolean | null
          last_fact_check?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question: string
          question_number?: number | null
          question_type: string
          sources?: Json | null
          tags?: Json | null
          topic_id: string
          translations?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty_level?: number | null
          explanation?: string
          fact_check_notes?: Json | null
          fact_check_status?: string | null
          hint?: string
          id?: string
          is_active?: boolean | null
          last_fact_check?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question?: string
          question_number?: number | null
          question_type?: string
          sources?: Json | null
          tags?: Json | null
          topic_id?: string
          translations?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      questions_test: {
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
            foreignKeyName: "questions_test_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "questions_test_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          category: string | null
          correct_count: number | null
          created_at: string | null
          game_mode: string
          guest_token: string | null
          id: string
          max_streak: number | null
          mode_settings: Json | null
          platform: string
          question_count: number | null
          response_data: Json | null
          session_id: string
          skill_id: string | null
          streak_count: number | null
          total_time_seconds: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          correct_count?: number | null
          created_at?: string | null
          game_mode?: string
          guest_token?: string | null
          id?: string
          max_streak?: number | null
          mode_settings?: Json | null
          platform?: string
          question_count?: number | null
          response_data?: Json | null
          session_id: string
          skill_id?: string | null
          streak_count?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          correct_count?: number | null
          created_at?: string | null
          game_mode?: string
          guest_token?: string | null
          id?: string
          max_streak?: number | null
          mode_settings?: Json | null
          platform?: string
          question_count?: number | null
          response_data?: Json | null
          session_id?: string
          skill_id?: string | null
          streak_count?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      scenario_characters: {
        Row: {
          character_constraints: string[] | null
          character_emoji: string | null
          character_name: string
          character_title: string | null
          character_type: string | null
          created_at: string | null
          id: string
          inspired_by_figure_id: string | null
          represents_stakeholder_group: string | null
          starting_resources: Json | null
          usable_in_scenario_types: string[] | null
          victory_conditions: string[] | null
        }
        Insert: {
          character_constraints?: string[] | null
          character_emoji?: string | null
          character_name: string
          character_title?: string | null
          character_type?: string | null
          created_at?: string | null
          id?: string
          inspired_by_figure_id?: string | null
          represents_stakeholder_group?: string | null
          starting_resources?: Json | null
          usable_in_scenario_types?: string[] | null
          victory_conditions?: string[] | null
        }
        Update: {
          character_constraints?: string[] | null
          character_emoji?: string | null
          character_name?: string
          character_title?: string | null
          character_type?: string | null
          created_at?: string | null
          id?: string
          inspired_by_figure_id?: string | null
          represents_stakeholder_group?: string | null
          starting_resources?: Json | null
          usable_in_scenario_types?: string[] | null
          victory_conditions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_characters_inspired_by_figure_id_fkey"
            columns: ["inspired_by_figure_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_decisions: {
        Row: {
          created_at: string | null
          decision_description: string | null
          decision_order: number
          decision_text: string
          democratic_health_impact: number | null
          id: string
          immediate_effects: Json | null
          leads_to_situation_id: string | null
          real_world_precedent: string | null
          resource_costs: Json | null
          situation_id: string | null
          teaches_concepts: string[] | null
        }
        Insert: {
          created_at?: string | null
          decision_description?: string | null
          decision_order: number
          decision_text: string
          democratic_health_impact?: number | null
          id?: string
          immediate_effects?: Json | null
          leads_to_situation_id?: string | null
          real_world_precedent?: string | null
          resource_costs?: Json | null
          situation_id?: string | null
          teaches_concepts?: string[] | null
        }
        Update: {
          created_at?: string | null
          decision_description?: string | null
          decision_order?: number
          decision_text?: string
          democratic_health_impact?: number | null
          id?: string
          immediate_effects?: Json | null
          leads_to_situation_id?: string | null
          real_world_precedent?: string | null
          resource_costs?: Json | null
          situation_id?: string | null
          teaches_concepts?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_decisions_leads_to_situation_id_fkey"
            columns: ["leads_to_situation_id"]
            isOneToOne: false
            referencedRelation: "scenario_situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_decisions_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "scenario_situations"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_outcomes: {
        Row: {
          created_at: string | null
          democratic_health_impact: number | null
          discussion_questions: string[] | null
          expert_commentary: string | null
          historical_examples: string[] | null
          id: string
          key_lessons: string[] | null
          outcome_description: string
          outcome_title: string
          outcome_type: string | null
          probability_assessment: string | null
          recommended_reading: Json | null
          related_quiz_topics: string[] | null
          scenario_id: string | null
          stakeholder_satisfaction: Json | null
          suggested_actions: string[] | null
        }
        Insert: {
          created_at?: string | null
          democratic_health_impact?: number | null
          discussion_questions?: string[] | null
          expert_commentary?: string | null
          historical_examples?: string[] | null
          id?: string
          key_lessons?: string[] | null
          outcome_description: string
          outcome_title: string
          outcome_type?: string | null
          probability_assessment?: string | null
          recommended_reading?: Json | null
          related_quiz_topics?: string[] | null
          scenario_id?: string | null
          stakeholder_satisfaction?: Json | null
          suggested_actions?: string[] | null
        }
        Update: {
          created_at?: string | null
          democratic_health_impact?: number | null
          discussion_questions?: string[] | null
          expert_commentary?: string | null
          historical_examples?: string[] | null
          id?: string
          key_lessons?: string[] | null
          outcome_description?: string
          outcome_title?: string
          outcome_type?: string | null
          probability_assessment?: string | null
          recommended_reading?: Json | null
          related_quiz_topics?: string[] | null
          scenario_id?: string | null
          stakeholder_satisfaction?: Json | null
          suggested_actions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_outcomes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_resources: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          default_starting_amount: number | null
          description: string | null
          display_name: string
          examples_in_politics: string[] | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          maximum_amount: number | null
          real_world_explanation: string | null
          resource_name: string
          resource_type: string
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          default_starting_amount?: number | null
          description?: string | null
          display_name: string
          examples_in_politics?: string[] | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          real_world_explanation?: string | null
          resource_name: string
          resource_type: string
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          default_starting_amount?: number | null
          description?: string | null
          display_name?: string
          examples_in_politics?: string[] | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          real_world_explanation?: string | null
          resource_name?: string
          resource_type?: string
        }
        Relationships: []
      }
      scenario_situations: {
        Row: {
          available_to_characters: string[] | null
          background_context: string | null
          created_at: string | null
          id: string
          prerequisites: Json | null
          pressure_level: number | null
          scenario_id: string | null
          situation_description: string
          situation_order: number
          situation_title: string
          time_limit_seconds: number | null
        }
        Insert: {
          available_to_characters?: string[] | null
          background_context?: string | null
          created_at?: string | null
          id?: string
          prerequisites?: Json | null
          pressure_level?: number | null
          scenario_id?: string | null
          situation_description: string
          situation_order: number
          situation_title: string
          time_limit_seconds?: number | null
        }
        Update: {
          available_to_characters?: string[] | null
          background_context?: string | null
          created_at?: string | null
          id?: string
          prerequisites?: Json | null
          pressure_level?: number | null
          scenario_id?: string | null
          situation_description?: string
          situation_order?: number
          situation_title?: string
          time_limit_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_situations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          civic_categories: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          key_concepts: string[] | null
          learning_objectives: string[] | null
          max_players: number | null
          quiz_topic_connections: string[] | null
          scenario_slug: string
          scenario_title: string
          scenario_type: string | null
          updated_at: string | null
        }
        Insert: {
          civic_categories?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          key_concepts?: string[] | null
          learning_objectives?: string[] | null
          max_players?: number | null
          quiz_topic_connections?: string[] | null
          scenario_slug: string
          scenario_title: string
          scenario_type?: string | null
          updated_at?: string | null
        }
        Update: {
          civic_categories?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          key_concepts?: string[] | null
          learning_objectives?: string[] | null
          max_players?: number | null
          quiz_topic_connections?: string[] | null
          scenario_slug?: string
          scenario_title?: string
          scenario_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_content_jobs: {
        Row: {
          avg_execution_time_ms: number | null
          consecutive_failures: number
          created_at: string
          created_by: string
          description: string | null
          generation_settings: Json
          id: string
          is_active: boolean
          job_type: string
          last_run_at: string | null
          last_run_result: Json | null
          last_run_status: string | null
          max_failures: number
          name: string
          next_run_at: string
          schedule_config: Json
          successful_runs: number
          total_content_generated: number
          total_runs: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avg_execution_time_ms?: number | null
          consecutive_failures?: number
          created_at?: string
          created_by: string
          description?: string | null
          generation_settings: Json
          id?: string
          is_active?: boolean
          job_type?: string
          last_run_at?: string | null
          last_run_result?: Json | null
          last_run_status?: string | null
          max_failures?: number
          name: string
          next_run_at: string
          schedule_config: Json
          successful_runs?: number
          total_content_generated?: number
          total_runs?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avg_execution_time_ms?: number | null
          consecutive_failures?: number
          created_at?: string
          created_by?: string
          description?: string | null
          generation_settings?: Json
          id?: string
          is_active?: boolean
          job_type?: string
          last_run_at?: string | null
          last_run_result?: Json | null
          last_run_status?: string | null
          max_failures?: number
          name?: string
          next_run_at?: string
          schedule_config?: Json
          successful_runs?: number
          total_content_generated?: number
          total_runs?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shareable_gift_links: {
        Row: {
          access_type: string
          created_at: string | null
          custom_slug: string | null
          donor_user_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          link_code: string
          max_uses_per_email: number | null
          message: string | null
          source_donation_amount: number | null
          source_stripe_session_id: string | null
          title: string | null
          total_credits: number
          updated_at: string | null
          used_credits: number
        }
        Insert: {
          access_type: string
          created_at?: string | null
          custom_slug?: string | null
          donor_user_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          link_code: string
          max_uses_per_email?: number | null
          message?: string | null
          source_donation_amount?: number | null
          source_stripe_session_id?: string | null
          title?: string | null
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
        }
        Update: {
          access_type?: string
          created_at?: string | null
          custom_slug?: string | null
          donor_user_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          link_code?: string
          max_uses_per_email?: number | null
          message?: string | null
          source_donation_amount?: number | null
          source_stripe_session_id?: string | null
          title?: string | null
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
        }
        Relationships: []
      }
      shareable_link_claims: {
        Row: {
          access_type: string
          claimed_at: string | null
          claimer_email: string
          claimer_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          shareable_link_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          claimed_at?: string | null
          claimer_email: string
          claimer_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          shareable_link_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          claimed_at?: string | null
          claimer_email?: string
          claimer_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          shareable_link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shareable_link_claims_shareable_link_id_fkey"
            columns: ["shareable_link_id"]
            isOneToOne: false
            referencedRelation: "shareable_gift_links"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_collection_access: {
        Row: {
          collection_id: string
          created_at: string
          expires_at: string | null
          id: string
          permission_level: string
          share_code: string | null
          shared_by_user_id: string
          shared_with_email: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          permission_level?: string
          share_code?: string | null
          shared_by_user_id: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          permission_level?: string
          share_code?: string | null
          shared_by_user_id?: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_collection_access_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessment_criteria: {
        Row: {
          assessment_method: string
          created_at: string | null
          id: string
          passing_criteria: string
          proficiency_level: string
          skill_id: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_method: string
          created_at?: string | null
          id?: string
          passing_criteria: string
          proficiency_level: string
          skill_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_method?: string
          created_at?: string | null
          id?: string
          passing_criteria?: string
          proficiency_level?: string
          skill_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessment_criteria_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_badges: {
        Row: {
          badge_description: string
          badge_icon: string
          badge_level: string
          badge_name: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          badge_description: string
          badge_icon: string
          badge_level: string
          badge_name: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          badge_description?: string
          badge_icon?: string
          badge_level?: string
          badge_name?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          display_name: string
          display_order: number | null
          emoji: string | null
          id: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          display_name: string
          display_order?: number | null
          emoji?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          display_name?: string
          display_order?: number | null
          emoji?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      skill_learning_objectives: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          mastery_level_required: string | null
          objective_text: string
          objective_type: string | null
          skill_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          mastery_level_required?: string | null
          objective_text: string
          objective_type?: string | null
          skill_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          mastery_level_required?: string | null
          objective_text?: string
          objective_type?: string | null
          skill_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_learning_objectives_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_mastery_tracking: {
        Row: {
          completed_objectives: Json | null
          created_at: string | null
          current_mastery_level: string
          id: string
          last_activity_date: string | null
          progress_percentage: number
          skill_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_objectives?: Json | null
          created_at?: string | null
          current_mastery_level?: string
          id?: string
          last_activity_date?: string | null
          progress_percentage?: number
          skill_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_objectives?: Json | null
          created_at?: string | null
          current_mastery_level?: string
          id?: string
          last_activity_date?: string | null
          progress_percentage?: number
          skill_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_mastery_tracking_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_practice_recommendations: {
        Row: {
          created_at: string | null
          difficulty_level: string
          estimated_minutes: number
          id: string
          practice_description: string
          practice_type: string
          skill_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level: string
          estimated_minutes: number
          id?: string
          practice_description: string
          practice_type: string
          skill_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string
          estimated_minutes?: number
          id?: string
          practice_description?: string
          practice_type?: string
          skill_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_practice_recommendations_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_prerequisites: {
        Row: {
          created_at: string | null
          id: string
          is_strict_requirement: boolean | null
          prerequisite_skill_id: string
          required_mastery_level: string | null
          skill_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_strict_requirement?: boolean | null
          prerequisite_skill_id: string
          required_mastery_level?: string | null
          skill_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_strict_requirement?: boolean | null
          prerequisite_skill_id?: string
          required_mastery_level?: string | null
          skill_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_prerequisites_prerequisite_skill_id_fkey"
            columns: ["prerequisite_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_prerequisites_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_progression_pathways: {
        Row: {
          created_at: string | null
          difficulty_level: string
          estimated_hours: number
          id: string
          pathway_description: string
          pathway_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level: string
          estimated_hours: number
          id?: string
          pathway_description: string
          pathway_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string
          estimated_hours?: number
          id?: string
          pathway_description?: string
          pathway_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_relationships: {
        Row: {
          created_at: string
          id: string
          is_strict_requirement: boolean | null
          relationship_type: string
          required_mastery_level: string | null
          source_skill_id: string
          target_skill_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_strict_requirement?: boolean | null
          relationship_type?: string
          required_mastery_level?: string | null
          source_skill_id: string
          target_skill_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_strict_requirement?: boolean | null
          relationship_type?: string
          required_mastery_level?: string | null
          source_skill_id?: string
          target_skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_relationships_source_skill_id_fkey"
            columns: ["source_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_relationships_target_skill_id_fkey"
            columns: ["target_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          display_order: number | null
          emoji: string | null
          id: string
          is_active: boolean | null
          is_core_skill: boolean | null
          parent_skill_id: string | null
          skill_name: string
          skill_slug: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_core_skill?: boolean | null
          parent_skill_id?: string | null
          skill_name: string
          skill_slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_core_skill?: boolean | null
          parent_skill_id?: string | null
          skill_name?: string
          skill_slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_parent_skill_id_fkey"
            columns: ["parent_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      source_credibility_indicators: {
        Row: {
          created_at: string | null
          fabrication_scandals_count: number | null
          fact_checking_partnerships: string[] | null
          id: string
          major_corrections_count: number | null
          major_misreporting_incidents: Json | null
          organization_id: string | null
          press_associations: string[] | null
          press_freedom_score: number | null
          pulitzer_prizes: number | null
          transparency_report_url: string | null
          updated_at: string | null
          verified_scoops_count: number | null
        }
        Insert: {
          created_at?: string | null
          fabrication_scandals_count?: number | null
          fact_checking_partnerships?: string[] | null
          id?: string
          major_corrections_count?: number | null
          major_misreporting_incidents?: Json | null
          organization_id?: string | null
          press_associations?: string[] | null
          press_freedom_score?: number | null
          pulitzer_prizes?: number | null
          transparency_report_url?: string | null
          updated_at?: string | null
          verified_scoops_count?: number | null
        }
        Update: {
          created_at?: string | null
          fabrication_scandals_count?: number | null
          fact_checking_partnerships?: string[] | null
          id?: string
          major_corrections_count?: number | null
          major_misreporting_incidents?: Json | null
          organization_id?: string | null
          press_associations?: string[] | null
          press_freedom_score?: number | null
          pulitzer_prizes?: number | null
          transparency_report_url?: string | null
          updated_at?: string | null
          verified_scoops_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "source_credibility_indicators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "media_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      source_fetch_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          fetch_type: string | null
          id: string
          last_attempt_at: string | null
          max_retries: number | null
          priority: number | null
          retry_count: number | null
          scheduled_for: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          fetch_type?: string | null
          id?: string
          last_attempt_at?: string | null
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          fetch_type?: string | null
          id?: string
          last_attempt_at?: string | null
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          url?: string
        }
        Relationships: []
      }
      source_metadata: {
        Row: {
          author: string | null
          bias_rating: string | null
          canonical_url: string | null
          content_type: string | null
          created_at: string | null
          credibility_score: number | null
          description: string | null
          domain: string
          favicon_url: string | null
          fetch_error: string | null
          fetch_status: string | null
          has_https: boolean | null
          has_valid_ssl: boolean | null
          id: string
          is_accessible: boolean | null
          is_active: boolean | null
          language: string | null
          last_fetched_at: string | null
          modified_time: string | null
          og_description: string | null
          og_image: string | null
          og_site_name: string | null
          og_title: string | null
          og_type: string | null
          published_time: string | null
          response_time_ms: number | null
          title: string
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          author?: string | null
          bias_rating?: string | null
          canonical_url?: string | null
          content_type?: string | null
          created_at?: string | null
          credibility_score?: number | null
          description?: string | null
          domain: string
          favicon_url?: string | null
          fetch_error?: string | null
          fetch_status?: string | null
          has_https?: boolean | null
          has_valid_ssl?: boolean | null
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          modified_time?: string | null
          og_description?: string | null
          og_image?: string | null
          og_site_name?: string | null
          og_title?: string | null
          og_type?: string | null
          published_time?: string | null
          response_time_ms?: number | null
          title: string
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          author?: string | null
          bias_rating?: string | null
          canonical_url?: string | null
          content_type?: string | null
          created_at?: string | null
          credibility_score?: number | null
          description?: string | null
          domain?: string
          favicon_url?: string | null
          fetch_error?: string | null
          fetch_status?: string | null
          has_https?: boolean | null
          has_valid_ssl?: boolean | null
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          modified_time?: string | null
          og_description?: string | null
          og_image?: string | null
          og_site_name?: string | null
          og_title?: string | null
          og_type?: string | null
          published_time?: string | null
          response_time_ms?: number | null
          title?: string
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      spaced_repetition_schedule: {
        Row: {
          created_at: string
          easiness_factor: number | null
          id: string
          interval_days: number | null
          next_review_date: string
          repetition_count: number | null
          skill_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          easiness_factor?: number | null
          id?: string
          interval_days?: number | null
          next_review_date: string
          repetition_count?: number | null
          skill_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          easiness_factor?: number | null
          id?: string
          interval_days?: number | null
          next_review_date?: string
          repetition_count?: number | null
          skill_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaced_repetition_schedule_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tier_limits: {
        Row: {
          advanced_analytics: boolean | null
          created_at: string | null
          custom_decks_limit: number | null
          export_data: boolean | null
          historical_months_limit: number | null
          learning_insights: boolean | null
          offline_mode: boolean | null
          priority_support: boolean | null
          spaced_repetition: boolean | null
          tier: string
        }
        Insert: {
          advanced_analytics?: boolean | null
          created_at?: string | null
          custom_decks_limit?: number | null
          export_data?: boolean | null
          historical_months_limit?: number | null
          learning_insights?: boolean | null
          offline_mode?: boolean | null
          priority_support?: boolean | null
          spaced_repetition?: boolean | null
          tier: string
        }
        Update: {
          advanced_analytics?: boolean | null
          created_at?: string | null
          custom_decks_limit?: number | null
          export_data?: boolean | null
          historical_months_limit?: number | null
          learning_insights?: boolean | null
          offline_mode?: boolean | null
          priority_support?: boolean | null
          spaced_repetition?: boolean | null
          tier?: string
        }
        Relationships: []
      }
      survey_answers: {
        Row: {
          answer_data: Json
          answered_at: string
          id: string
          question_id: string
          response_id: string
        }
        Insert: {
          answer_data: Json
          answered_at?: string
          id?: string
          question_id: string
          response_id: string
        }
        Update: {
          answer_data?: Json
          answered_at?: string
          id?: string
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_learning_goals: {
        Row: {
          created_at: string | null
          id: string
          question_mappings: Json | null
          skill_id: string | null
          survey_id: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_mappings?: Json | null
          skill_id?: string | null
          survey_id?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          question_mappings?: Json | null
          skill_id?: string | null
          survey_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_learning_goals_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_learning_goals_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_learning_goals_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          conditional_logic: Json | null
          created_at: string
          description: string | null
          id: string
          options: Json | null
          question_order: number
          question_text: string
          question_type: string
          required: boolean
          scale_config: Json | null
          survey_id: string
          translations: Json | null
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          options?: Json | null
          question_order: number
          question_text: string
          question_type: string
          required?: boolean
          scale_config?: Json | null
          survey_id: string
          translations?: Json | null
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          options?: Json | null
          question_order?: number
          question_text?: string
          question_type?: string
          required?: boolean
          scale_config?: Json | null
          survey_id?: string
          translations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_recommendations: {
        Row: {
          based_on_responses: Json
          clicked_items: Json | null
          generated_at: string | null
          guest_token: string | null
          id: string
          recommended_content: Json
          survey_id: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          based_on_responses: Json
          clicked_items?: Json | null
          generated_at?: string | null
          guest_token?: string | null
          id?: string
          recommended_content: Json
          survey_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          based_on_responses?: Json
          clicked_items?: Json | null
          generated_at?: string | null
          guest_token?: string | null
          id?: string
          recommended_content?: Json
          survey_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_recommendations_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_recommendations_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          guest_token: string | null
          id: string
          ip_address: unknown | null
          is_complete: boolean
          session_id: string
          started_at: string
          survey_id: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          guest_token?: string | null
          id?: string
          ip_address?: unknown | null
          is_complete?: boolean
          session_id: string
          started_at?: string
          survey_id: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          guest_token?: string | null
          id?: string
          ip_address?: unknown | null
          is_complete?: boolean
          session_id?: string
          started_at?: string
          survey_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          allow_anonymous: boolean
          allow_partial_responses: boolean
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_time: number | null
          id: string
          post_completion_config: Json | null
          published_at: string | null
          status: string
          title: string
          translations: Json | null
          updated_at: string
        }
        Insert: {
          allow_anonymous?: boolean
          allow_partial_responses?: boolean
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_time?: number | null
          id?: string
          post_completion_config?: Json | null
          published_at?: string | null
          status?: string
          title: string
          translations?: Json | null
          updated_at?: string
        }
        Update: {
          allow_anonymous?: boolean
          allow_partial_responses?: boolean
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_time?: number | null
          id?: string
          post_completion_config?: Json | null
          published_at?: string | null
          status?: string
          title?: string
          translations?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          entity_type: string
          id: number
          question_id: string
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          entity_type?: string
          id?: never
          question_id: string
          tag_name: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          id?: never
          question_id?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "fk_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "fk_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "fk_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_jobs: {
        Row: {
          character_count: number | null
          completed_at: string | null
          content_id: string
          content_type: string
          created_at: string
          error: string | null
          estimated_completion: string | null
          id: string
          priority: string
          progress: number
          queue_for_review: boolean
          retry_count: number
          started_at: string | null
          status: string
          target_language: string
          updated_at: string
        }
        Insert: {
          character_count?: number | null
          completed_at?: string | null
          content_id: string
          content_type: string
          created_at?: string
          error?: string | null
          estimated_completion?: string | null
          id?: string
          priority?: string
          progress?: number
          queue_for_review?: boolean
          retry_count?: number
          started_at?: string | null
          status?: string
          target_language: string
          updated_at?: string
        }
        Update: {
          character_count?: number | null
          completed_at?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          error?: string | null
          estimated_completion?: string | null
          id?: string
          priority?: string
          progress?: number
          queue_for_review?: boolean
          retry_count?: number
          started_at?: string | null
          status?: string
          target_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          earned_at: string | null
          id: string
          is_milestone: boolean | null
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          earned_at?: string | null
          id?: string
          is_milestone?: boolean | null
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          earned_at?: string | null
          id?: string
          is_milestone?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_active_boosts: {
        Row: {
          boost_data: Json | null
          boost_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          started_at: string
          user_id: string
          uses_remaining: number | null
        }
        Insert: {
          boost_data?: Json | null
          boost_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string
          user_id: string
          uses_remaining?: number | null
        }
        Update: {
          boost_data?: Json | null
          boost_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
          uses_remaining?: number | null
        }
        Relationships: []
      }
      user_assessment_attempts: {
        Row: {
          assessment_type: string
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          level_achieved: string | null
          score: number
          time_spent_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_type?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          level_achieved?: string | null
          score?: number
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          level_achieved?: string | null
          score?: number
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_assessments: {
        Row: {
          answers: Json | null
          assessment_type: string
          category_breakdown: Json | null
          completed_at: string | null
          id: string
          level: string
          metadata: Json | null
          score: number
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          assessment_type?: string
          category_breakdown?: Json | null
          completed_at?: string | null
          id?: string
          level: string
          metadata?: Json | null
          score: number
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          assessment_type?: string
          category_breakdown?: Json | null
          completed_at?: string | null
          id?: string
          level?: string
          metadata?: Json | null
          score?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string | null
          created_at: string | null
          earned_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_id?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "skill_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_boost_inventory: {
        Row: {
          boost_type: string
          created_at: string | null
          id: string
          last_cooldown_used: string | null
          last_purchased: string | null
          quantity: number
          total_purchased: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          boost_type: string
          created_at?: string | null
          id?: string
          last_cooldown_used?: string | null
          last_purchased?: string | null
          quantity?: number
          total_purchased?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          boost_type?: string
          created_at?: string | null
          id?: string
          last_cooldown_used?: string | null
          last_purchased?: string | null
          quantity?: number
          total_purchased?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_category_preferences: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          interest_level: number
          learning_goal: string | null
          priority_rank: number | null
          selected_during_onboarding: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          interest_level?: number
          learning_goal?: string | null
          priority_rank?: number | null
          selected_during_onboarding?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          interest_level?: number
          learning_goal?: string | null
          priority_rank?: number | null
          selected_during_onboarding?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_category_preferences_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_category_skills: {
        Row: {
          category: string
          created_at: string | null
          id: string
          last_practiced_at: string | null
          mastery_level: string | null
          questions_attempted: number | null
          questions_correct: number | null
          skill_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery_level?: string | null
          questions_attempted?: number | null
          questions_correct?: number | null
          skill_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery_level?: string | null
          questions_attempted?: number | null
          questions_correct?: number | null
          skill_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_collection_progress: {
        Row: {
          collection_id: string | null
          completed_at: string | null
          completed_items: string[] | null
          current_item_id: string | null
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
          started_at: string | null
          total_time_spent_minutes: number | null
          user_feedback: string | null
          user_id: string | null
          user_rating: number | null
        }
        Insert: {
          collection_id?: string | null
          completed_at?: string | null
          completed_items?: string[] | null
          current_item_id?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          total_time_spent_minutes?: number | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
        }
        Update: {
          collection_id?: string | null
          completed_at?: string | null
          completed_items?: string[] | null
          current_item_id?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          total_time_spent_minutes?: number | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_collection_progress_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_collection_progress_current_item_id_fkey"
            columns: ["current_item_id"]
            isOneToOne: false
            referencedRelation: "collection_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_decks: {
        Row: {
          created_at: string | null
          deck_name: string
          deck_type: string
          description: string | null
          id: string
          is_active: boolean | null
          preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deck_name: string
          deck_type?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deck_name?: string
          deck_type?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_deck_content: {
        Row: {
          added_at: string | null
          deck_id: string
          id: string
          priority_score: number | null
          question_id: string | null
          topic_id: string | null
        }
        Insert: {
          added_at?: string | null
          deck_id: string
          id?: string
          priority_score?: number | null
          question_id?: string | null
          topic_id?: string | null
        }
        Update: {
          added_at?: string | null
          deck_id?: string
          id?: string
          priority_score?: number | null
          question_id?: string | null
          topic_id?: string | null
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
            foreignKeyName: "user_deck_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_deck_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_deck_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_deck_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      user_email_preferences: {
        Row: {
          achievement_alerts: boolean | null
          allow_data_analytics: boolean | null
          allow_personalization: boolean | null
          auto_share_achievements: boolean | null
          civic_news_alerts: boolean | null
          community_digest: boolean | null
          created_at: string
          data_retention_period: string | null
          email_delivery_frequency: string | null
          email_format: string | null
          email_notifications: boolean | null
          export_format: string | null
          id: string
          integration_sync: boolean | null
          marketing_emails: boolean | null
          notification_channels: Json | null
          product_updates: boolean | null
          re_engagement_emails: boolean | null
          social_sharing_enabled: boolean | null
          survey_invitations: boolean | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          achievement_alerts?: boolean | null
          allow_data_analytics?: boolean | null
          allow_personalization?: boolean | null
          auto_share_achievements?: boolean | null
          civic_news_alerts?: boolean | null
          community_digest?: boolean | null
          created_at?: string
          data_retention_period?: string | null
          email_delivery_frequency?: string | null
          email_format?: string | null
          email_notifications?: boolean | null
          export_format?: string | null
          id?: string
          integration_sync?: boolean | null
          marketing_emails?: boolean | null
          notification_channels?: Json | null
          product_updates?: boolean | null
          re_engagement_emails?: boolean | null
          social_sharing_enabled?: boolean | null
          survey_invitations?: boolean | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          achievement_alerts?: boolean | null
          allow_data_analytics?: boolean | null
          allow_personalization?: boolean | null
          auto_share_achievements?: boolean | null
          civic_news_alerts?: boolean | null
          community_digest?: boolean | null
          created_at?: string
          data_retention_period?: string | null
          email_delivery_frequency?: string | null
          email_format?: string | null
          email_notifications?: boolean | null
          export_format?: string | null
          id?: string
          integration_sync?: boolean | null
          marketing_emails?: boolean | null
          notification_channels?: Json | null
          product_updates?: boolean | null
          re_engagement_emails?: boolean | null
          social_sharing_enabled?: boolean | null
          survey_invitations?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          event_date: string
          event_description: string | null
          event_title: string | null
          id: string
          source_metadata: Json | null
          source_type: string | null
          status: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          event_date: string
          event_description?: string | null
          event_title?: string | null
          id?: string
          source_metadata?: Json | null
          source_type?: string | null
          status?: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          event_date?: string
          event_description?: string | null
          event_title?: string | null
          id?: string
          source_metadata?: Json | null
          source_type?: string | null
          status?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feature_usage: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          last_used_at: string | null
          monthly_limit: number | null
          reset_date: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          last_used_at?: string | null
          monthly_limit?: number | null
          reset_date?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          last_used_at?: string | null
          monthly_limit?: number | null
          reset_date?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          context_id: string | null
          context_type: string
          created_at: string
          feedback_text: string
          feedback_type: string
          id: string
          path: string | null
          rating: number | null
          status: string
          submitted_at: string
          updated_at: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          context_id?: string | null
          context_type: string
          created_at?: string
          feedback_text: string
          feedback_type: string
          id?: string
          path?: string | null
          rating?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          feedback_text?: string
          feedback_type?: string
          id?: string
          path?: string | null
          rating?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          provider_email: string | null
          provider_name: string | null
          provider_user_id: string | null
          refresh_token: string | null
          scopes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          provider_email?: string | null
          provider_name?: string | null
          provider_user_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          provider_email?: string | null
          provider_name?: string | null
          provider_user_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_goals: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty_level: number | null
          goal_type: string
          id: string
          is_active: boolean | null
          target_date: string | null
          target_value: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty_level?: number | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          target_date?: string | null
          target_value: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty_level?: number | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          target_date?: string | null
          target_value?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_learning_insights: {
        Row: {
          action_items: Json | null
          confidence_score: number | null
          created_at: string | null
          description: string
          id: string
          insight_category: string | null
          insight_type: string
          is_dismissed: boolean | null
          is_read: boolean | null
          priority_level: number | null
          title: string
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          action_items?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description: string
          id?: string
          insight_category?: string | null
          insight_type: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority_level?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          action_items?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          id?: string
          insight_category?: string | null
          insight_type?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority_level?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      user_onboarding_state: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: string
          id: string
          is_completed: boolean | null
          onboarding_data: Json | null
          skip_reason: string | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: string
          id?: string
          is_completed?: boolean | null
          onboarding_data?: Json | null
          skip_reason?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: string
          id?: string
          is_completed?: boolean | null
          onboarding_data?: Json | null
          skip_reason?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_platform_preferences: {
        Row: {
          achievement_notifications: boolean | null
          competitive_mode: boolean | null
          created_at: string | null
          daily_reminder: boolean | null
          email_notifications: boolean | null
          font_size: string | null
          high_contrast: boolean | null
          id: string
          learning_pace: string | null
          preferred_content_types: string[] | null
          preferred_difficulty: string | null
          preferred_quiz_length: number | null
          push_notifications: boolean | null
          reduced_motion: boolean | null
          screen_reader_mode: boolean | null
          show_achievements: boolean | null
          show_difficulty_indicators: boolean | null
          show_explanations: boolean | null
          show_leaderboards: boolean | null
          show_sources: boolean | null
          show_streaks: boolean | null
          study_time_preference: string | null
          updated_at: string | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          achievement_notifications?: boolean | null
          competitive_mode?: boolean | null
          created_at?: string | null
          daily_reminder?: boolean | null
          email_notifications?: boolean | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          learning_pace?: string | null
          preferred_content_types?: string[] | null
          preferred_difficulty?: string | null
          preferred_quiz_length?: number | null
          push_notifications?: boolean | null
          reduced_motion?: boolean | null
          screen_reader_mode?: boolean | null
          show_achievements?: boolean | null
          show_difficulty_indicators?: boolean | null
          show_explanations?: boolean | null
          show_leaderboards?: boolean | null
          show_sources?: boolean | null
          show_streaks?: boolean | null
          study_time_preference?: string | null
          updated_at?: string | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          achievement_notifications?: boolean | null
          competitive_mode?: boolean | null
          created_at?: string | null
          daily_reminder?: boolean | null
          email_notifications?: boolean | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          learning_pace?: string | null
          preferred_content_types?: string[] | null
          preferred_difficulty?: string | null
          preferred_quiz_length?: number | null
          push_notifications?: boolean | null
          reduced_motion?: boolean | null
          screen_reader_mode?: boolean | null
          show_achievements?: boolean | null
          show_difficulty_indicators?: boolean | null
          show_explanations?: boolean | null
          show_leaderboards?: boolean | null
          show_sources?: boolean | null
          show_streaks?: boolean | null
          study_time_preference?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          adaptive_difficulty: boolean | null
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          favorite_categories: Json | null
          id: string
          last_activity_date: string | null
          learning_style: string | null
          longest_streak: number | null
          preferred_categories: Json | null
          total_correct_answers: number | null
          total_questions_answered: number | null
          total_quizzes_completed: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
          week_start_date: string | null
          weekly_completed: number | null
          weekly_goal: number | null
          xp_to_next_level: number | null
        }
        Insert: {
          adaptive_difficulty?: boolean | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          favorite_categories?: Json | null
          id?: string
          last_activity_date?: string | null
          learning_style?: string | null
          longest_streak?: number | null
          preferred_categories?: Json | null
          total_correct_answers?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
          week_start_date?: string | null
          weekly_completed?: number | null
          weekly_goal?: number | null
          xp_to_next_level?: number | null
        }
        Update: {
          adaptive_difficulty?: boolean | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          favorite_categories?: Json | null
          id?: string
          last_activity_date?: string | null
          learning_style?: string | null
          longest_streak?: number | null
          preferred_categories?: Json | null
          total_correct_answers?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
          week_start_date?: string | null
          weekly_completed?: number | null
          weekly_goal?: number | null
          xp_to_next_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress_history: {
        Row: {
          accuracy_percentage: number | null
          category_stats: Json | null
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          id: string
          longest_streak: number | null
          period_correct_answers: number | null
          period_questions_answered: number | null
          period_quizzes_completed: number | null
          period_xp_gained: number | null
          snapshot_date: string
          snapshot_type: string
          total_correct_answers: number | null
          total_questions_answered: number | null
          total_quizzes_completed: number | null
          total_xp: number | null
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number | null
          category_stats?: Json | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          longest_streak?: number | null
          period_correct_answers?: number | null
          period_questions_answered?: number | null
          period_quizzes_completed?: number | null
          period_xp_gained?: number | null
          snapshot_date: string
          snapshot_type: string
          total_correct_answers?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          total_xp?: number | null
          user_id: string
        }
        Update: {
          accuracy_percentage?: number | null
          category_stats?: Json | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          longest_streak?: number | null
          period_correct_answers?: number | null
          period_questions_answered?: number | null
          period_quizzes_completed?: number | null
          period_xp_gained?: number | null
          snapshot_date?: string
          snapshot_type?: string
          total_correct_answers?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          total_xp?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_question_memory: {
        Row: {
          consecutive_correct: number | null
          easiness_factor: number | null
          id: string
          interval_days: number | null
          last_reviewed_at: string | null
          next_review_date: string | null
          question_id: string
          repetition_count: number | null
          total_attempts: number | null
          user_id: string
        }
        Insert: {
          consecutive_correct?: number | null
          easiness_factor?: number | null
          id?: string
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          question_id: string
          repetition_count?: number | null
          total_attempts?: number | null
          user_id: string
        }
        Update: {
          consecutive_correct?: number | null
          easiness_factor?: number | null
          id?: string
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          question_id?: string
          repetition_count?: number | null
          total_attempts?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_memory_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_question_memory_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_question_memory_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_question_memory_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
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
      user_quiz_analytics: {
        Row: {
          average_time_per_question: number | null
          category_performance: Json | null
          completion_rate: number | null
          consistency_score: number | null
          created_at: string | null
          difficulty_performance: Json | null
          fastest_question_time: number | null
          hint_usage_rate: number | null
          id: string
          improvement_trend: number | null
          optimal_study_time: string | null
          question_type_performance: Json | null
          quiz_attempt_id: string | null
          retry_rate: number | null
          slowest_question_time: number | null
          time_distribution: Json | null
          topic_id: string | null
          total_time_seconds: number
          user_id: string
        }
        Insert: {
          average_time_per_question?: number | null
          category_performance?: Json | null
          completion_rate?: number | null
          consistency_score?: number | null
          created_at?: string | null
          difficulty_performance?: Json | null
          fastest_question_time?: number | null
          hint_usage_rate?: number | null
          id?: string
          improvement_trend?: number | null
          optimal_study_time?: string | null
          question_type_performance?: Json | null
          quiz_attempt_id?: string | null
          retry_rate?: number | null
          slowest_question_time?: number | null
          time_distribution?: Json | null
          topic_id?: string | null
          total_time_seconds: number
          user_id: string
        }
        Update: {
          average_time_per_question?: number | null
          category_performance?: Json | null
          completion_rate?: number | null
          consistency_score?: number | null
          created_at?: string | null
          difficulty_performance?: Json | null
          fastest_question_time?: number | null
          hint_usage_rate?: number | null
          id?: string
          improvement_trend?: number | null
          optimal_study_time?: string | null
          question_type_performance?: Json | null
          quiz_attempt_id?: string | null
          retry_rate?: number | null
          slowest_question_time?: number | null
          time_distribution?: Json | null
          topic_id?: string | null
          total_time_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_analytics_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "user_quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_analytics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_quiz_analytics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          classroom_assignment_id: string | null
          classroom_course_id: string | null
          clever_section_id: string | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          game_metadata: Json | null
          game_mode: string | null
          grade_post_error: string | null
          grade_post_timestamp: string | null
          grade_posted_to_lms: boolean | null
          guest_token: string | null
          id: string
          is_completed: boolean | null
          max_streak: number | null
          mode_settings: Json | null
          participants: Json | null
          platform: string | null
          pod_id: string | null
          response_data: Json | null
          score: number | null
          session_id: string | null
          social_interactions: Json | null
          started_at: string | null
          streak_count: number | null
          team_id: string | null
          team_role: string | null
          time_spent_seconds: number | null
          topic_id: string
          total_questions: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          classroom_assignment_id?: string | null
          classroom_course_id?: string | null
          clever_section_id?: string | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          game_metadata?: Json | null
          game_mode?: string | null
          grade_post_error?: string | null
          grade_post_timestamp?: string | null
          grade_posted_to_lms?: boolean | null
          guest_token?: string | null
          id?: string
          is_completed?: boolean | null
          max_streak?: number | null
          mode_settings?: Json | null
          participants?: Json | null
          platform?: string | null
          pod_id?: string | null
          response_data?: Json | null
          score?: number | null
          session_id?: string | null
          social_interactions?: Json | null
          started_at?: string | null
          streak_count?: number | null
          team_id?: string | null
          team_role?: string | null
          time_spent_seconds?: number | null
          topic_id: string
          total_questions: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          classroom_assignment_id?: string | null
          classroom_course_id?: string | null
          clever_section_id?: string | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          game_metadata?: Json | null
          game_mode?: string | null
          grade_post_error?: string | null
          grade_post_timestamp?: string | null
          grade_posted_to_lms?: boolean | null
          guest_token?: string | null
          id?: string
          is_completed?: boolean | null
          max_streak?: number | null
          mode_settings?: Json | null
          participants?: Json | null
          platform?: string | null
          pod_id?: string | null
          response_data?: Json | null
          score?: number | null
          session_id?: string | null
          social_interactions?: Json | null
          started_at?: string | null
          streak_count?: number | null
          team_id?: string | null
          team_role?: string | null
          time_spent_seconds?: number | null
          topic_id?: string
          total_questions?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permissions?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_scenario_attempts: {
        Row: {
          attempt_number: number
          character_id: string | null
          completed_at: string | null
          completion_percentage: number | null
          concepts_demonstrated: string[] | null
          created_at: string | null
          current_resources: Json | null
          current_situation_id: string | null
          decisions_made: Json | null
          democratic_values_score: number | null
          difficulty_rating: number | null
          final_outcome: string | null
          final_resources: Json | null
          guest_token: string | null
          id: string
          learning_objectives_met: string[] | null
          scenario_id: string | null
          session_metadata: Json | null
          started_at: string | null
          total_time_spent: unknown | null
          total_time_spent_seconds: number | null
          user_id: string | null
        }
        Insert: {
          attempt_number?: number
          character_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          concepts_demonstrated?: string[] | null
          created_at?: string | null
          current_resources?: Json | null
          current_situation_id?: string | null
          decisions_made?: Json | null
          democratic_values_score?: number | null
          difficulty_rating?: number | null
          final_outcome?: string | null
          final_resources?: Json | null
          guest_token?: string | null
          id?: string
          learning_objectives_met?: string[] | null
          scenario_id?: string | null
          session_metadata?: Json | null
          started_at?: string | null
          total_time_spent?: unknown | null
          total_time_spent_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          attempt_number?: number
          character_id?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          concepts_demonstrated?: string[] | null
          created_at?: string | null
          current_resources?: Json | null
          current_situation_id?: string | null
          decisions_made?: Json | null
          democratic_values_score?: number | null
          difficulty_rating?: number | null
          final_outcome?: string | null
          final_resources?: Json | null
          guest_token?: string | null
          id?: string
          learning_objectives_met?: string[] | null
          scenario_id?: string | null
          session_metadata?: Json | null
          started_at?: string | null
          total_time_spent?: unknown | null
          total_time_spent_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_scenario_attempts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "scenario_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scenario_attempts_current_situation_id_fkey"
            columns: ["current_situation_id"]
            isOneToOne: false
            referencedRelation: "scenario_situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scenario_attempts_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_scenario_decisions: {
        Row: {
          attempt_id: string | null
          created_at: string | null
          decision_id: string | null
          decision_order: number
          decision_time_seconds: number | null
          id: string
          resource_state_after: Json | null
          resource_state_before: Json | null
          situation_id: string | null
          time_taken_seconds: number | null
          timestamp: string | null
        }
        Insert: {
          attempt_id?: string | null
          created_at?: string | null
          decision_id?: string | null
          decision_order?: number
          decision_time_seconds?: number | null
          id?: string
          resource_state_after?: Json | null
          resource_state_before?: Json | null
          situation_id?: string | null
          time_taken_seconds?: number | null
          timestamp?: string | null
        }
        Update: {
          attempt_id?: string | null
          created_at?: string | null
          decision_id?: string | null
          decision_order?: number
          decision_time_seconds?: number | null
          id?: string
          resource_state_after?: Json | null
          resource_state_before?: Json | null
          situation_id?: string | null
          time_taken_seconds?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_scenario_decisions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "user_scenario_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scenario_decisions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "scenario_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scenario_decisions_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "scenario_situations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_preferences: {
        Row: {
          created_at: string | null
          id: string
          interest_level: number
          learning_timeline: string | null
          priority_rank: number | null
          selected_during_onboarding: boolean | null
          skill_id: string
          target_mastery_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_level?: number
          learning_timeline?: string | null
          priority_rank?: number | null
          selected_during_onboarding?: boolean | null
          skill_id: string
          target_mastery_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_level?: number
          learning_timeline?: string | null
          priority_rank?: number | null
          selected_during_onboarding?: boolean | null
          skill_id?: string
          target_mastery_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_preferences_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_progress: {
        Row: {
          average_time_per_question: number | null
          confidence_level: number | null
          consecutive_correct: number | null
          created_at: string | null
          id: string
          improvement_rate: number | null
          last_practiced_at: string | null
          mastery_achieved_at: string | null
          mastery_level: string | null
          next_review_date: string | null
          questions_attempted: number | null
          questions_correct: number | null
          review_interval_days: number | null
          skill_id: string
          skill_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_time_per_question?: number | null
          confidence_level?: number | null
          consecutive_correct?: number | null
          created_at?: string | null
          id?: string
          improvement_rate?: number | null
          last_practiced_at?: string | null
          mastery_achieved_at?: string | null
          mastery_level?: string | null
          next_review_date?: string | null
          questions_attempted?: number | null
          questions_correct?: number | null
          review_interval_days?: number | null
          skill_id: string
          skill_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_time_per_question?: number | null
          confidence_level?: number | null
          consecutive_correct?: number | null
          created_at?: string | null
          id?: string
          improvement_rate?: number | null
          last_practiced_at?: string | null
          mastery_achieved_at?: string | null
          mastery_level?: string | null
          next_review_date?: string | null
          questions_attempted?: number | null
          questions_correct?: number | null
          review_interval_days?: number | null
          skill_id?: string
          skill_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streak_history: {
        Row: {
          category: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string
          streak_type: string
          streak_value: number
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date: string
          streak_type: string
          streak_value: number
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string
          streak_type?: string
          streak_value?: number
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount_cents: number | null
          billing_cycle: string | null
          created_at: string | null
          currency: string | null
          external_subscription_id: string | null
          id: string
          last_payment_date: string | null
          next_billing_date: string | null
          payment_provider: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string
          subscription_tier: string
          trial_end_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          external_subscription_id?: string | null
          id?: string
          last_payment_date?: string | null
          next_billing_date?: string | null
          payment_provider?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_end_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          external_subscription_id?: string | null
          id?: string
          last_payment_date?: string | null
          next_billing_date?: string | null
          payment_provider?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_end_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_survey_completions: {
        Row: {
          completed_at: string
          completion_time_seconds: number | null
          created_at: string | null
          guest_token: string | null
          id: string
          questions_answered: number
          response_id: string | null
          survey_id: string | null
          total_questions: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string
          completion_time_seconds?: number | null
          created_at?: string | null
          guest_token?: string | null
          id?: string
          questions_answered: number
          response_id?: string | null
          survey_id?: string | null
          total_questions: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          completion_time_seconds?: number | null
          created_at?: string | null
          guest_token?: string | null
          id?: string
          questions_answered?: number
          response_id?: string | null
          survey_id?: string | null
          total_questions?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_survey_completions_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_survey_completions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_survey_completions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_content_metrics: {
        Row: {
          avg_score: number | null
          civic_importance_score: number | null
          completion_rate: number | null
          content_id: string
          content_type: string
          created_at: string | null
          discussions_started: number | null
          follow_up_actions: number | null
          id: string
          news_mentions: number | null
          shares_count: number | null
          total_completions: number | null
          total_views: number | null
          trending_score: number | null
          user_ratings_avg: number | null
          user_ratings_count: number | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          avg_score?: number | null
          civic_importance_score?: number | null
          completion_rate?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          discussions_started?: number | null
          follow_up_actions?: number | null
          id?: string
          news_mentions?: number | null
          shares_count?: number | null
          total_completions?: number | null
          total_views?: number | null
          trending_score?: number | null
          user_ratings_avg?: number | null
          user_ratings_count?: number | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          avg_score?: number | null
          civic_importance_score?: number | null
          completion_rate?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          discussions_started?: number | null
          follow_up_actions?: number | null
          id?: string
          news_mentions?: number | null
          shares_count?: number | null
          total_completions?: number | null
          total_views?: number | null
          trending_score?: number | null
          user_ratings_avg?: number | null
          user_ratings_count?: number | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
      }
      weekly_recap_collections: {
        Row: {
          avg_engagement_score: number | null
          collection_id: string
          completions_count: number | null
          config_used: string | null
          content_selected: number | null
          created_at: string | null
          generation_timestamp: string | null
          id: string
          top_themes: string[] | null
          total_content_analyzed: number | null
          user_feedback_avg: number | null
          views_count: number | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          avg_engagement_score?: number | null
          collection_id: string
          completions_count?: number | null
          config_used?: string | null
          content_selected?: number | null
          created_at?: string | null
          generation_timestamp?: string | null
          id?: string
          top_themes?: string[] | null
          total_content_analyzed?: number | null
          user_feedback_avg?: number | null
          views_count?: number | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          avg_engagement_score?: number | null
          collection_id?: string
          completions_count?: number | null
          config_used?: string | null
          content_selected?: number | null
          created_at?: string | null
          generation_timestamp?: string | null
          id?: string
          top_themes?: string[] | null
          total_content_analyzed?: number | null
          user_feedback_avg?: number | null
          views_count?: number | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_recap_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_recap_collections_config_used_fkey"
            columns: ["config_used"]
            isOneToOne: false
            referencedRelation: "weekly_recap_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_recap_configs: {
        Row: {
          civic_action_weight: number | null
          config_name: string
          created_at: string | null
          current_events_weight: number | null
          description_template: string | null
          emoji_pool: string | null
          engagement_weight: number | null
          glossary_percentage: number | null
          id: string
          is_active: boolean | null
          max_items_per_collection: number | null
          min_completion_rate: number | null
          min_engagement_threshold: number | null
          questions_percentage: number | null
          title_template: string | null
          topics_percentage: number | null
          updated_at: string | null
          user_rating_weight: number | null
        }
        Insert: {
          civic_action_weight?: number | null
          config_name: string
          created_at?: string | null
          current_events_weight?: number | null
          description_template?: string | null
          emoji_pool?: string | null
          engagement_weight?: number | null
          glossary_percentage?: number | null
          id?: string
          is_active?: boolean | null
          max_items_per_collection?: number | null
          min_completion_rate?: number | null
          min_engagement_threshold?: number | null
          questions_percentage?: number | null
          title_template?: string | null
          topics_percentage?: number | null
          updated_at?: string | null
          user_rating_weight?: number | null
        }
        Update: {
          civic_action_weight?: number | null
          config_name?: string
          created_at?: string | null
          current_events_weight?: number | null
          description_template?: string | null
          emoji_pool?: string | null
          engagement_weight?: number | null
          glossary_percentage?: number | null
          id?: string
          is_active?: boolean | null
          max_items_per_collection?: number | null
          min_completion_rate?: number | null
          min_engagement_threshold?: number | null
          questions_percentage?: number | null
          title_template?: string | null
          topics_percentage?: number | null
          updated_at?: string | null
          user_rating_weight?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      ai_generated_topics: {
        Row: {
          accuracy_score: string | null
          actionability_score: string | null
          ai_generation_method: string | null
          ai_model_used: string | null
          ai_quality_score: number | null
          brand_voice_score: string | null
          categories: Json | null
          content_package_id: string | null
          created_at: string | null
          date: string | null
          description: string | null
          emoji: string | null
          generated_at: string | null
          overall_quality: string | null
          source_credibility_score: number | null
          source_domain: string | null
          source_url: string | null
          topic_id: string | null
          topic_title: string | null
          updated_at: string | null
          why_this_matters: string | null
        }
        Insert: {
          accuracy_score?: never
          actionability_score?: never
          ai_generation_method?: string | null
          ai_model_used?: string | null
          ai_quality_score?: number | null
          brand_voice_score?: never
          categories?: Json | null
          content_package_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          emoji?: string | null
          generated_at?: never
          overall_quality?: never
          source_credibility_score?: number | null
          source_domain?: never
          source_url?: never
          topic_id?: string | null
          topic_title?: string | null
          updated_at?: string | null
          why_this_matters?: string | null
        }
        Update: {
          accuracy_score?: never
          actionability_score?: never
          ai_generation_method?: string | null
          ai_model_used?: string | null
          ai_quality_score?: number | null
          brand_voice_score?: never
          categories?: Json | null
          content_package_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          emoji?: string | null
          generated_at?: never
          overall_quality?: never
          source_credibility_score?: number | null
          source_domain?: never
          source_url?: never
          topic_id?: string | null
          topic_title?: string | null
          updated_at?: string | null
          why_this_matters?: string | null
        }
        Relationships: []
      }
      assessment_question_stats: {
        Row: {
          category: string | null
          difficulty: number | null
          difficulty_level: string | null
          last_attempted_at: string | null
          question_id: string | null
          total_users_attempted: number | null
        }
        Relationships: []
      }
      civics_test_attempts: {
        Row: {
          category: string | null
          correct_count: number | null
          created_at: string | null
          game_mode: string | null
          guest_token: string | null
          id: string | null
          max_streak: number | null
          mode_settings: Json | null
          platform: string | null
          question_count: number | null
          response_data: Json | null
          session_id: string | null
          skill_id: string | null
          streak_count: number | null
          total_time_seconds: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          correct_count?: number | null
          created_at?: string | null
          game_mode?: string | null
          guest_token?: string | null
          id?: string | null
          max_streak?: number | null
          mode_settings?: Json | null
          platform?: string | null
          question_count?: number | null
          response_data?: Json | null
          session_id?: string | null
          skill_id?: string | null
          streak_count?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          correct_count?: number | null
          created_at?: string | null
          game_mode?: string | null
          guest_token?: string | null
          id?: string | null
          max_streak?: number | null
          mode_settings?: Json | null
          platform?: string | null
          question_count?: number | null
          response_data?: Json | null
          session_id?: string | null
          skill_id?: string | null
          streak_count?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      civics_test_metrics: {
        Row: {
          abandonments: number | null
          avg_score: number | null
          completions: number | null
          day: string | null
          signups: number | null
          starts: number | null
          unique_guests: number | null
          unique_sessions: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      content_relationship_analysis: {
        Row: {
          avg_relationship_strength: number | null
          categories: string[] | null
          content: string | null
          content_id: string | null
          content_type: string | null
          created_at: string | null
          relationship_count: number | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      current_assessment_status: {
        Row: {
          assessment_date: string | null
          entity_name: string | null
          framework_name: string | null
          overall_score: number | null
          overall_status: string | null
          partial_indicators: number | null
          total_indicators: number | null
          triggered_indicators: number | null
        }
        Relationships: []
      }
      function_type_validation: {
        Row: {
          column_types: string[] | null
          function_name: string | null
          validation_status: string | null
        }
        Relationships: []
      }
      function_validation_summary: {
        Row: {
          matching_columns: number | null
          mismatched_columns: number | null
          total_columns: number | null
          validation_status: string | null
          validation_target: string | null
        }
        Relationships: []
      }
      indicator_trends: {
        Row: {
          assessment_date: string | null
          entity_id: string | null
          framework_id: string | null
          indicator_id: string | null
          indicator_name: string | null
          measured_value: Json | null
          previous_status: string | null
          status: string | null
          trend: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "assessed_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_assessments_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_attempts: {
        Row: {
          category: string | null
          correct_count: number | null
          created_at: string | null
          game_mode: string | null
          guest_token: string | null
          id: string | null
          max_streak: number | null
          mode_settings: Json | null
          platform: string | null
          question_count: number | null
          response_data: Json | null
          session_id: string | null
          skill_id: string | null
          streak_count: number | null
          total_time_seconds: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          correct_count?: number | null
          created_at?: string | null
          game_mode?: string | null
          guest_token?: string | null
          id?: string | null
          max_streak?: number | null
          mode_settings?: Json | null
          platform?: string | null
          question_count?: number | null
          response_data?: Json | null
          session_id?: string | null
          skill_id?: string | null
          streak_count?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          correct_count?: number | null
          created_at?: string | null
          game_mode?: string | null
          guest_token?: string | null
          id?: string | null
          max_streak?: number | null
          mode_settings?: Json | null
          platform?: string | null
          question_count?: number | null
          response_data?: Json | null
          session_id?: string | null
          skill_id?: string | null
          streak_count?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      multiplayer_room_function_validation: {
        Row: {
          column_position: number | null
          function_data_type: string | null
          function_parameter_name: string | null
          mismatch_details: string | null
          table_column_name: string | null
          table_data_type: string | null
          types_match: boolean | null
        }
        Relationships: []
      }
      multiplayer_rooms_view: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_players: number | null
          expires_at: string | null
          game_mode: string | null
          host_display_name: string | null
          host_user_id: string | null
          id: string | null
          max_players: number | null
          room_code: string | null
          room_name: string | null
          settings: Json | null
          started_at: string | null
          status: string | null
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_players?: number | null
          expires_at?: string | null
          game_mode?: string | null
          host_display_name?: string | null
          host_user_id?: string | null
          id?: string | null
          max_players?: number | null
          room_code?: string | null
          room_name?: string | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_players?: number | null
          expires_at?: string | null
          game_mode?: string | null
          host_display_name?: string | null
          host_user_id?: string | null
          id?: string | null
          max_players?: number | null
          room_code?: string | null
          room_name?: string | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      news_agent_analytics: {
        Row: {
          avg_accuracy_score: number | null
          avg_actionability_score: number | null
          avg_brand_voice_score: number | null
          avg_civic_relevance: number | null
          avg_quality_score: number | null
          date: string | null
          news_sources: string[] | null
          packages_in_review: number | null
          published_packages: number | null
          rejected_packages: number | null
          total_packages: number | null
        }
        Relationships: []
      }
      news_agent_performance: {
        Row: {
          date: string | null
          failed_cycles: number | null
          monitoring_cycles: number | null
          processing_success_rate: number | null
          relevance_detection_rate: number | null
          successful_cycles: number | null
          total_events_found: number | null
          total_events_processed: number | null
          total_relevant_events: number | null
        }
        Relationships: []
      }
      npc_vs_human_analytics: {
        Row: {
          accuracy_improvement: number | null
          avg_accuracy: number | null
          avg_human_opponent_score: number | null
          avg_placement: number | null
          avg_time_per_question: number | null
          base_skill_level: string | null
          consistency_score: number | null
          display_name: string | null
          human_win_rate: number | null
          npc_code: string | null
          personality_type: string | null
          recent_accuracy: number | null
          recent_quiz_count: number | null
          total_quizzes: number | null
        }
        Relationships: []
      }
      pod_activity: {
        Row: {
          accuracy: number | null
          pod_id: string | null
          questions_answered: number | null
          time_spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
        ]
      }
      pod_activity_details: {
        Row: {
          activity_data: Json | null
          activity_type: string | null
          created_at: string | null
          id: string | null
          pod_id: string | null
          pod_name: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_activities_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "pod_activities_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_discovery: {
        Row: {
          activity_score: number | null
          average_rating: number | null
          banner_image_url: string | null
          created_at: string | null
          difficulty_level: number | null
          difficulty_level_numeric: string | null
          display_name: string | null
          id: string | null
          is_featured: boolean | null
          member_count: number | null
          pod_id: string | null
          pod_type: string | null
          search_tags: string[] | null
          short_description: string | null
          target_age_range: string | null
          topics_covered: string[] | null
          total_ratings: number | null
        }
        Insert: {
          activity_score?: number | null
          average_rating?: number | null
          banner_image_url?: string | null
          created_at?: string | null
          difficulty_level?: never
          difficulty_level_numeric?: string | null
          display_name?: never
          id?: string | null
          is_featured?: boolean | null
          member_count?: never
          pod_id?: string | null
          pod_type?: string | null
          search_tags?: string[] | null
          short_description?: never
          target_age_range?: string | null
          topics_covered?: string[] | null
          total_ratings?: number | null
        }
        Update: {
          activity_score?: number | null
          average_rating?: number | null
          banner_image_url?: string | null
          created_at?: string | null
          difficulty_level?: never
          difficulty_level_numeric?: string | null
          display_name?: never
          id?: string | null
          is_featured?: boolean | null
          member_count?: never
          pod_id?: string | null
          pod_type?: string | null
          search_tags?: string[] | null
          short_description?: never
          target_age_range?: string | null
          topics_covered?: string[] | null
          total_ratings?: number | null
        }
        Relationships: []
      }
      pod_member_details: {
        Row: {
          avatar_url: string | null
          can_invite_members: boolean | null
          can_message: boolean | null
          can_modify_settings: boolean | null
          can_view_progress: boolean | null
          email: string | null
          full_name: string | null
          joined_at: string | null
          membership_status: string | null
          pod_id: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_memberships_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "learning_pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_memberships_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pod_memberships_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod_discovery"
            referencedColumns: ["pod_id"]
          },
          {
            foreignKeyName: "pod_memberships_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_attempts: {
        Row: {
          category: string | null
          correct_count: number | null
          created_at: string | null
          game_mode: string | null
          guest_token: string | null
          id: string | null
          max_streak: number | null
          mode_settings: Json | null
          platform: string | null
          question_count: number | null
          response_data: Json | null
          session_id: string | null
          skill_id: string | null
          streak_count: number | null
          total_time_seconds: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          correct_count?: number | null
          created_at?: string | null
          game_mode?: string | null
          guest_token?: string | null
          id?: string | null
          max_streak?: number | null
          mode_settings?: Json | null
          platform?: string | null
          question_count?: number | null
          response_data?: Json | null
          session_id?: string | null
          skill_id?: string | null
          streak_count?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          correct_count?: number | null
          created_at?: string | null
          game_mode?: string | null
          guest_token?: string | null
          id?: string | null
          max_streak?: number | null
          mode_settings?: Json | null
          platform?: string | null
          question_count?: number | null
          response_data?: Json | null
          session_id?: string | null
          skill_id?: string | null
          streak_count?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
        Relationships: []
      }
      question_response_stats: {
        Row: {
          accuracy_rate: number | null
          avg_time_spent: number | null
          category: string | null
          correct_attempts: number | null
          difficulty_level: string | null
          last_attempted_at: string | null
          most_common_wrong_answer: string | null
          question_id: string | null
          question_number: number | null
          question_type: string | null
          topic_id: string | null
          total_attempts: number | null
          wrong_attempts: number | null
        }
        Relationships: []
      }
      question_sources_enhanced: {
        Row: {
          author: string | null
          credibility_score: number | null
          description: string | null
          display_order: number | null
          domain: string | null
          is_primary_source: boolean | null
          modified_time: string | null
          og_description: string | null
          og_image: string | null
          og_site_name: string | null
          og_title: string | null
          published_time: string | null
          question: string | null
          question_id: string | null
          source_id: string | null
          source_name: string | null
          source_type: string | null
          title: string | null
          topic_id: string | null
          url: string | null
        }
        Relationships: []
      }
      survey_summary: {
        Row: {
          allow_anonymous: boolean | null
          allow_partial_responses: boolean | null
          anonymous_responses: number | null
          authenticated_responses: number | null
          completed_responses: number | null
          completion_rate: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_time: number | null
          id: string | null
          post_completion_config: Json | null
          published_at: string | null
          question_count: number | null
          status: string | null
          title: string | null
          total_responses: number | null
        }
        Relationships: []
      }
      translation_job_stats: {
        Row: {
          avg_progress: number | null
          content_type: string | null
          job_count: number | null
          latest_update: string | null
          oldest_job: string | null
          status: string | null
          target_language: string | null
        }
        Relationships: []
      }
      user_comprehensive_stats: {
        Row: {
          accuracy_percentage: number | null
          achievements_this_week: number | null
          active_goals: number | null
          categories_attempted: number | null
          categories_mastered: number | null
          current_level: number | null
          current_streak: number | null
          custom_decks_count: number | null
          longest_streak: number | null
          preferred_categories: Json | null
          total_correct_answers: number | null
          total_questions_answered: number | null
          total_quizzes_completed: number | null
          total_xp: number | null
          user_id: string | null
          weekly_completed: number | null
          weekly_goal: number | null
        }
        Insert: {
          accuracy_percentage?: never
          achievements_this_week?: never
          active_goals?: never
          categories_attempted?: never
          categories_mastered?: never
          current_level?: number | null
          current_streak?: number | null
          custom_decks_count?: never
          longest_streak?: number | null
          preferred_categories?: Json | null
          total_correct_answers?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          total_xp?: number | null
          user_id?: string | null
          weekly_completed?: number | null
          weekly_goal?: number | null
        }
        Update: {
          accuracy_percentage?: never
          achievements_this_week?: never
          active_goals?: never
          categories_attempted?: never
          categories_mastered?: never
          current_level?: number | null
          current_streak?: number | null
          custom_decks_count?: never
          longest_streak?: number | null
          preferred_categories?: Json | null
          total_correct_answers?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          total_xp?: number | null
          user_id?: string | null
          weekly_completed?: number | null
          weekly_goal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_comprehensive_stats_premium: {
        Row: {
          accuracy_percentage: number | null
          achievements_this_week: number | null
          active_goals: number | null
          categories_attempted: number | null
          categories_mastered: number | null
          current_level: number | null
          current_streak: number | null
          custom_decks_count: number | null
          has_advanced_analytics_access: boolean | null
          has_custom_decks_access: boolean | null
          has_historical_progress_access: boolean | null
          has_learning_insights_access: boolean | null
          has_spaced_repetition_access: boolean | null
          longest_streak: number | null
          preferred_categories: Json | null
          subscription_end_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          total_correct_answers: number | null
          total_questions_answered: number | null
          total_quizzes_completed: number | null
          total_xp: number | null
          user_id: string | null
          weekly_completed: number | null
          weekly_goal: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_analytics: {
        Row: {
          accuracy_percentage: number | null
          category_name: string | null
          confidence_level: number | null
          days_since_practice: number | null
          is_core_skill: boolean | null
          last_practiced_at: string | null
          mastery_level: string | null
          needs_practice: boolean | null
          next_review_date: string | null
          questions_attempted: number | null
          questions_correct: number | null
          skill_difficulty: number | null
          skill_level: number | null
          skill_name: string | null
          skill_slug: string | null
          skill_strength: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_npc_to_multiplayer_room: {
        Args: { p_room_code: string; p_npc_code: string }
        Returns: {
          success: boolean
          message: string
          npc_player_id: string
          room_id: string
        }[]
      }
      add_source_to_glossary_term: {
        Args: { term_id: string; source_id: string; is_primary?: boolean }
        Returns: boolean
      }
      analyze_image_ab_test: {
        Args: { test_name_param: string }
        Returns: {
          variant: string
          total_views: number
          total_engagements: number
          engagement_rate: number
          avg_generation_time: number
        }[]
      }
      calculate_assessment_score: {
        Args: { assessment_id_param: string }
        Returns: number
      }
      calculate_bias_consensus: {
        Args: {
          p_organization_id: string
          p_dimension_id: string
          p_time_window?: unknown
        }
        Returns: {
          consensus_score: number
          confidence_level: number
          sample_size: number
          agreement_rate: number
        }[]
      }
      calculate_gift_credits: {
        Args: { donation_amount_cents: number }
        Returns: {
          annual_credits: number
          lifetime_credits: number
          donor_access_type: string
        }[]
      }
      calculate_next_run_time: {
        Args: { schedule_config: Json; from_time?: string }
        Returns: string
      }
      calculate_pod_analytics: {
        Args: { p_pod_id: string; p_date?: string }
        Returns: undefined
      }
      calculate_scenario_completion: {
        Args: { p_scenario_id: string; p_decisions_made: Json }
        Returns: number
      }
      calculate_weekly_content_score: {
        Args: {
          engagement_score: number
          current_events_score: number
          user_rating_score: number
          civic_action_score: number
          config_id: string
        }
        Returns: number
      }
      can_access_room: {
        Args: {
          room_uuid: string
          check_user_id?: string
          check_guest_token?: string
        }
        Returns: boolean
      }
      can_join_pod_via_invite: {
        Args: { p_invite_code: string; p_user_id: string; p_user_age?: number }
        Returns: Json
      }
      check_all_players_ready: {
        Args: { p_room_id: string }
        Returns: boolean
      }
      check_and_award_achievements: {
        Args: {
          p_user_id: string
          p_pod_id: string
          p_trigger_type: string
          p_trigger_data?: Json
        }
        Returns: number
      }
      check_boost_cooldown: {
        Args: { target_user_id: string; target_boost_type: string }
        Returns: boolean
      }
      check_image_generation_performance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_premium_feature_access: {
        Args: { p_user_id: string; p_feature_name: string }
        Returns: boolean
      }
      check_silence_intervention: {
        Args: { p_room_id: string }
        Returns: {
          needs_intervention: boolean
          silence_duration: number
          last_message_at: string
          participant_count: number
        }[]
      }
      check_user_role: {
        Args: { user_id: string; required_role: string }
        Returns: boolean
      }
      claim_shareable_gift_link: {
        Args: {
          p_link_code: string
          p_claimer_email: string
          p_claimer_user_id?: string
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: {
          success: boolean
          access_type: string
          message: string
          subscription_created: boolean
        }[]
      }
      cleanup_expired_boosts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_progress_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_rooms: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_inactive_players: {
        Args: { inactive_threshold_minutes?: number; dry_run?: boolean }
        Returns: {
          room_id: string
          player_count: number
          action: string
        }[]
      }
      cleanup_old_job_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_translation_jobs: {
        Args: { days_old?: number }
        Returns: number
      }
      complete_onboarding_step: {
        Args: { target_user_id: string; step_name: string; step_data?: Json }
        Returns: boolean
      }
      convert_guest_civics_results: {
        Args: { p_guest_token: string; p_user_id: string }
        Returns: number
      }
      create_gift_redemption: {
        Args: {
          p_donor_user_id: string
          p_recipient_email: string
          p_access_type: string
          p_gift_message?: string
        }
        Returns: {
          redemption_id: string
          redemption_code: string
          success: boolean
          error_message: string
        }[]
      }
      create_learning_pod: {
        Args: {
          p_creator_id: string
          p_pod_name: string
          p_pod_type?: string
          p_family_name?: string
          p_content_filter_level?: string
        }
        Returns: string
      }
      create_multiplayer_room: {
        Args: {
          p_topic_id: string
          p_host_user_id?: string
          p_host_guest_token?: string
          p_room_name?: string
          p_max_players?: number
          p_game_mode?: string
        }
        Returns: {
          id: string
          room_code: string
          room_name: string
          topic_id: string
          host_user_id: string
          host_display_name: string
          max_players: number
          current_players: number
          room_status: string
          game_mode: string
          created_at: string
        }[]
      }
      create_pod_invite_link: {
        Args: {
          p_pod_id: string
          p_creator_id: string
          p_description?: string
          p_max_uses?: number
          p_expires_hours?: number
          p_allowed_roles?: string[]
          p_require_approval?: boolean
        }
        Returns: {
          invite_code: string
          invite_url: string
          link_id: string
        }[]
      }
      create_scenario_room: {
        Args: {
          p_scenario_id: string
          p_host_user_id: string
          p_room_name?: string
          p_max_players?: number
          p_scenario_settings?: Json
        }
        Returns: {
          room_id: string
          room_code: string
        }[]
      }
      create_shareable_gift_link: {
        Args: {
          p_donor_user_id: string
          p_access_type: string
          p_credits_to_use: number
          p_title?: string
          p_message?: string
          p_custom_slug?: string
        }
        Returns: {
          link_id: string
          link_code: string
          success: boolean
          error_message: string
        }[]
      }
      detect_all_type_mismatches: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          table_name: string
          mismatch_count: number
          mismatch_details: string[]
        }[]
      }
      find_potential_friends: {
        Args: { p_user_id: string }
        Returns: {
          friend_id: string
          interaction_count: number
          last_played_together: string
          shared_games: Json
        }[]
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_pod_slug: {
        Args: { pod_name: string; pod_id?: string }
        Returns: string
      }
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_room_slug: {
        Args: { room_name: string }
        Returns: string
      }
      get_active_game_session: {
        Args: { room_uuid: string }
        Returns: {
          session_id: string
          session_number: number
          topic_id: string
          game_mode: string
          session_status: string
          current_question_number: number
          total_questions: number
          started_at: string
        }[]
      }
      get_active_multiplayer_rooms: {
        Args: { room_limit?: number }
        Returns: {
          id: string
          room_code: string
          room_name: string
          status: string
          current_players: number
          max_players: number
          topic_id: string
          host_user_id: string
          host_display_name: string
          game_mode: string
          created_at: string
        }[]
      }
      get_assessment_question_social_proof_stats: {
        Args: { p_question_id: string; p_assessment_type?: string }
        Returns: Json
      }
      get_available_boosts_for_user: {
        Args: { target_user_id: string; user_level?: number }
        Returns: {
          boost_type: string
          name: string
          description: string
          emoji: string
          xp_cost: number
          category: string
          rarity: string
          level_requirement: number
          tags: string[]
        }[]
      }
      get_collection_skills: {
        Args: { collection_uuid: string }
        Returns: {
          skill_id: string
          skill_name: string
          skill_slug: string
          description: string
          category: string
          difficulty_level: number
          total_items: number
          primary_items: number
          avg_proficiency: number
          source_table: string
        }[]
      }
      get_collections_with_skill_categories: {
        Args: { categories: string[] }
        Returns: {
          collection_id: string
        }[]
      }
      get_collections_with_skills: {
        Args: { skill_ids: string[] }
        Returns: {
          collection_id: string
        }[]
      }
      get_content_relationships: {
        Args: { p_content_type: string; p_content_id: string; p_limit?: number }
        Returns: {
          related_content_type: string
          related_content_id: string
          related_title: string
          relationship_type: string
          strength: number
        }[]
      }
      get_content_translation_stats: {
        Args: { content_type_param: string }
        Returns: {
          content_type: string
          total_items: number
          translated_items: Json
          pending_items: Json
          in_progress_items: Json
          error_items: Json
        }[]
      }
      get_detailed_gift_credits: {
        Args: { p_user_id: string }
        Returns: {
          credit_id: string
          credit_type: string
          credits_available: number
          credits_used: number
          source_donation_amount: number
          source_stripe_session_id: string
          created_at: string
          individual_claims: Json
          shareable_links: Json
        }[]
      }
      get_effective_member_settings: {
        Args: { p_pod_id: string; p_user_id: string }
        Returns: Json
      }
      get_function_return_info: {
        Args: { function_name_param: string }
        Returns: {
          parameter_name: string
          data_type: string
          ordinal_position: number
        }[]
      }
      get_gift_analytics_summary: {
        Args: { p_user_id: string }
        Returns: {
          total_donated_amount: number
          total_gift_credits_earned: number
          total_gift_credits_used: number
          total_people_helped: number
          unique_emails_helped: number
          active_shareable_links: number
          expired_shareable_links: number
          pending_individual_gifts: number
          claimed_individual_gifts: number
          most_recent_claim_date: string
          conversion_rate: number
        }[]
      }
      get_glossary_term_with_sources: {
        Args: { term_id: string }
        Returns: Json
      }
      get_guest_test_summary: {
        Args: { p_guest_token: string }
        Returns: {
          total_tests: number
          average_score: number
          latest_score: number
          latest_level: string
          has_converted: boolean
          converted_user_id: string
        }[]
      }
      get_jobs_ready_for_execution: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          generation_settings: Json
          created_by: string
        }[]
      }
      get_npc_category_performance: {
        Args: { p_npc_id: string; p_category: string }
        Returns: {
          current_accuracy: number
          questions_answered: number
          vs_human_winrate: number
          improvement_trend: number
        }[]
      }
      get_onboarding_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          emoji: string
          description: string
          display_order: number
          question_count: number
        }[]
      }
      get_onboarding_skills: {
        Args: { category_ids?: string[] }
        Returns: {
          id: string
          skill_name: string
          skill_slug: string
          category_id: string
          category_name: string
          description: string
          difficulty_level: number
          is_core_skill: boolean
        }[]
      }
      get_or_create_media_organization: {
        Args: { p_domain: string; p_name?: string }
        Returns: string
      }
      get_or_create_pod_analytics_today: {
        Args: { p_pod_id: string }
        Returns: string
      }
      get_or_create_source_metadata: {
        Args:
          | {
              p_url: string
              p_title?: string
              p_description?: string
              p_domain?: string
            }
          | {
              p_url: string
              p_title?: string
              p_description?: string
              p_domain?: string
              p_author?: string
              p_published_time?: string
              p_modified_time?: string
            }
        Returns: string
      }
      get_or_create_tag: {
        Args: { p_user_id: string; p_tag_name: string }
        Returns: string
      }
      get_people_helped_by_donor: {
        Args: { p_user_id: string }
        Returns: {
          email: string
          access_type: string
          claim_method: string
          claimed_at: string
          gift_message: string
          redemption_code: string
          link_title: string
          ip_address: unknown
        }[]
      }
      get_pod_analytics: {
        Args: { p_pod_id: string; p_days?: number }
        Returns: Json
      }
      get_question_social_proof_stats: {
        Args: { p_question_id: string }
        Returns: Json
      }
      get_recommended_skills_for_user: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          skill_id: string
          skill_name: string
          category_name: string
          recommendation_reason: string
          priority_score: number
        }[]
      }
      get_room_members: {
        Args: { room_uuid: string }
        Returns: {
          player_id: string
          user_id: string
          guest_token: string
          player_name: string
          player_emoji: string
          is_host: boolean
          is_ready: boolean
          is_connected: boolean
        }[]
      }
      get_scenario_characters: {
        Args: { p_scenario_id: string }
        Returns: {
          character_id: string
          character_name: string
          character_title: string
          character_type: string
          starting_resources: Json
          is_available: boolean
        }[]
      }
      get_scenario_room_status: {
        Args: { p_room_id: string }
        Returns: {
          room_info: Json
          players: Json
          scenario_info: Json
        }[]
      }
      get_shareable_link_info: {
        Args: { p_link_code: string }
        Returns: {
          link_id: string
          title: string
          message: string
          access_type: string
          total_credits: number
          used_credits: number
          available_credits: number
          expires_at: string
          is_active: boolean
          is_valid: boolean
        }[]
      }
      get_skills_needing_review: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          skill_id: string
          skill_name: string
          skill_slug: string
          category_name: string
          description: string
          difficulty_level: number
          is_core_skill: boolean
          mastery_level: string
          days_since_practice: number
          needs_practice: boolean
          priority_score: number
        }[]
      }
      get_social_proof_message: {
        Args: {
          p_accuracy_rate: number
          p_total_attempts: number
          p_difficulty_level: string
        }
        Returns: Json
      }
      get_table_column_info: {
        Args: { table_name_param: string }
        Returns: {
          column_name: string
          data_type: string
          character_maximum_length: number
          is_nullable: string
          column_default: string
          ordinal_position: number
        }[]
      }
      get_table_schemas: {
        Args: { table_names: string[] }
        Returns: {
          table_name: string
          column_name: string
          data_type: string
          is_nullable: boolean
          column_default: string
        }[]
      }
      get_term_translation: {
        Args: { term_id: string; language_code: string }
        Returns: Json
      }
      get_term_translation_languages: {
        Args: { term_id: string }
        Returns: string[]
      }
      get_terms_by_category: {
        Args: { category_name_param: string }
        Returns: {
          term_id: string
          term: string
          definition: string
          difficulty_level: number
          is_primary: boolean
          category_name: string
          category_emoji: string
        }[]
      }
      get_terms_by_source_credibility: {
        Args: { min_credibility?: number }
        Returns: {
          term_id: string
          term_text: string
          definition: string
          source_count: number
          avg_credibility: number
        }[]
      }
      get_terms_with_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          term_id: string
          term: string
          definition: string
          difficulty_level: number
          categories: Json
        }[]
      }
      get_translatable_content_summary: {
        Args: {
          search_term?: string
          status_filter?: string
          language_filter?: string
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          type: string
          word_count: number
          languages: string[]
          last_updated: string
          priority: string
          status: string
        }[]
      }
      get_translation: {
        Args: {
          translations: Json
          field_name: string
          language_code: string
          fallback_language?: string
        }
        Returns: string
      }
      get_user_boost_summary: {
        Args: { target_user_id: string }
        Returns: {
          boost_type: string
          name: string
          emoji: string
          quantity: number
          is_active: boolean
          uses_remaining: number
          expires_at: string
          cooldown_ready: boolean
          level_requirement: number
          category: string
          rarity: string
        }[]
      }
      get_user_email_preferences: {
        Args: { p_user_id: string }
        Returns: {
          email_notifications: boolean
          weekly_digest: boolean
          achievement_alerts: boolean
          email_delivery_frequency: string
          email_format: string
          marketing_emails: boolean
          product_updates: boolean
          community_digest: boolean
          survey_invitations: boolean
          civic_news_alerts: boolean
          re_engagement_emails: boolean
          social_sharing_enabled: boolean
          auto_share_achievements: boolean
          allow_data_analytics: boolean
          allow_personalization: boolean
          export_format: string
          integration_sync: boolean
          notification_channels: Json
          data_retention_period: string
        }[]
      }
      get_user_feature_limits: {
        Args: { p_user_id: string }
        Returns: {
          tier: string
          custom_decks_limit: number
          historical_months_limit: number
          advanced_analytics: boolean
          spaced_repetition: boolean
          learning_insights: boolean
          priority_support: boolean
          offline_mode: boolean
          export_data: boolean
        }[]
      }
      get_user_gift_credits: {
        Args: { p_user_id: string }
        Returns: {
          credit_type: string
          total_credits: number
          used_credits: number
          available_credits: number
          total_donation_amount: number
        }[]
      }
      get_user_onboarding_progress: {
        Args: { target_user_id: string }
        Returns: {
          onboarding_step: string
          is_completed: boolean
          selected_categories: Json
          selected_skills: Json
          platform_preferences: Json
          assessment_results: Json
        }[]
      }
      get_user_pod_memberships: {
        Args: { p_user_id: string }
        Returns: {
          pod_id: string
          pod_name: string
          pod_type: string
          user_role: string
          member_count: number
          is_admin: boolean
        }[]
      }
      get_user_progress_sessions: {
        Args: { p_user_id?: string; p_guest_token?: string }
        Returns: {
          answers: Json
          assessment_type: string | null
          category_performance: Json | null
          classroom_assignment_id: string | null
          classroom_course_id: string | null
          clever_assignment_id: string | null
          clever_section_id: string | null
          current_question_index: number
          expires_at: string
          guest_token: string | null
          id: string
          last_updated_at: string
          max_streak: number
          metadata: Json | null
          questions: Json
          response_times: Json
          session_id: string
          session_type: string
          started_at: string
          streak: number
          test_type: string | null
          topic_id: string | null
          user_id: string | null
        }[]
      }
      get_user_rooms: {
        Args: { p_user_id: string }
        Returns: {
          room_id: string
        }[]
      }
      get_user_scenario_progress: {
        Args: { p_user_id: string }
        Returns: {
          scenario_id: string
          scenario_title: string
          character_name: string
          completion_percentage: number
          last_played: string
          is_completed: boolean
        }[]
      }
      get_user_shareable_links: {
        Args: { p_user_id: string }
        Returns: {
          link_id: string
          link_code: string
          title: string
          message: string
          access_type: string
          total_credits: number
          used_credits: number
          available_credits: number
          expires_at: string
          is_active: boolean
          created_at: string
          claims_count: number
        }[]
      }
      get_weekly_top_themes: {
        Args: { week_start: string; week_end: string; max_themes?: number }
        Returns: string[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_content_appropriate_for_user: {
        Args: {
          p_user_id: string
          p_topic_id: string
          p_category: string
          p_difficulty?: number
          p_keywords?: string[]
        }
        Returns: boolean
      }
      is_educational_email: {
        Args: { email_address: string }
        Returns: boolean
      }
      join_multiplayer_room: {
        Args:
          | {
              p_room_code: string
              p_player_name: string
              p_player_emoji?: string
            }
          | {
              p_room_code: string
              p_player_name: string
              p_user_id?: string
              p_guest_token?: string
              p_player_emoji?: string
            }
        Returns: Json
      }
      join_pod_via_invite: {
        Args: { p_invite_code: string; p_user_id: string; p_user_age?: number }
        Returns: {
          success: boolean
          message: string
          requires_approval: boolean
          pod_id: string
        }[]
      }
      join_scenario_room: {
        Args: {
          p_room_code: string
          p_user_id: string
          p_player_name: string
          p_character_id?: string
        }
        Returns: {
          success: boolean
          room_id: string
          player_id: string
          message: string
        }[]
      }
      leave_multiplayer_room: {
        Args: { p_room_id: string; p_player_id: string }
        Returns: {
          success: boolean
          message: string
          new_host_player_id: string
        }[]
      }
      link_question_to_source: {
        Args: {
          p_question_id: string
          p_url: string
          p_source_name?: string
          p_source_type?: string
          p_is_primary?: boolean
        }
        Returns: string
      }
      log_pod_activity: {
        Args: {
          p_pod_id: string
          p_user_id: string
          p_activity_type: string
          p_activity_data?: Json
        }
        Returns: string
      }
      migrate_progress_session_to_completion: {
        Args: { p_session_id: string }
        Returns: {
          success: boolean
          final_attempt_id: string
          migration_type: string
          error_message: string
        }[]
      }
      populate_historical_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_donation_gift_credits: {
        Args: {
          p_user_id: string
          p_donation_amount_cents: number
          p_stripe_session_id: string
        }
        Returns: {
          donor_access_type: string
          annual_credits_granted: number
          lifetime_credits_granted: number
        }[]
      }
      record_game_event: {
        Args: {
          p_session_id: string
          p_room_id: string
          p_player_id: string
          p_event_type: string
          p_event_data?: Json
          p_question_number?: number
        }
        Returns: string
      }
      record_room_event: {
        Args: {
          p_room_id: string
          p_event_type: string
          p_player_id?: string
          p_event_data?: Json
        }
        Returns: string
      }
      redeem_gift_code: {
        Args: { p_redemption_code: string; p_recipient_user_id: string }
        Returns: {
          success: boolean
          access_type: string
          error_message: string
        }[]
      }
      repair_rooms_without_hosts: {
        Args: Record<PropertyKey, never>
        Returns: {
          room_id: string
          room_code: string
          action_taken: string
          new_host_player_id: string
        }[]
      }
      reset_is_breaking_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_bookmarks: {
        Args: {
          p_user_id: string
          p_query: string
          p_content_types?: string[]
          p_tags?: string[]
          p_collection_id?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          bookmark_id: string
          title: string
          description: string
          content_type: string
          tags: string[]
          relevance_score: number
        }[]
      }
      send_npc_message: {
        Args: {
          p_room_id: string
          p_npc_id: string
          p_message_content: string
          p_message_type?: string
          p_trigger_type?: string
          p_trigger_context?: Json
          p_educational_value?: string
          p_confidence_score?: number
        }
        Returns: string
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      set_translation: {
        Args: {
          translations: Json
          field_name: string
          language_code: string
          translation_text: string
          auto_translated?: boolean
          reviewed_by?: string
        }
        Returns: Json
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      start_multiplayer_game: {
        Args: { p_room_id: string }
        Returns: boolean
      }
      test_multiplayer_operations: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          status: string
          details: string
        }[]
      }
      track_feature_usage: {
        Args: { p_user_id: string; p_feature_name: string }
        Returns: boolean
      }
      update_bookmark_access: {
        Args: { p_bookmark_id: string; p_user_id: string }
        Returns: undefined
      }
      update_conversation_context: {
        Args: {
          p_room_id: string
          p_player_message?: boolean
          p_mood?: string
          p_conflict_detected?: boolean
        }
        Returns: undefined
      }
      update_job_after_execution: {
        Args: {
          job_id: string
          execution_success: boolean
          execution_result?: Json
          content_generated?: number
        }
        Returns: undefined
      }
      update_member_analytics: {
        Args: { pod_uuid: string; member_user_id: string }
        Returns: undefined
      }
      update_npc_learning: {
        Args: {
          p_npc_id: string
          p_category: string
          p_accuracy: number
          p_response_time: number
          p_vs_human_performance?: number
        }
        Returns: undefined
      }
      update_organization_bias_from_articles: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      update_player_character: {
        Args: { p_room_id: string; p_player_id: string; p_character_id: string }
        Returns: boolean
      }
      update_player_ready_status: {
        Args: { p_room_id: string; p_player_id: string; p_is_ready: boolean }
        Returns: boolean
      }
      update_pod_analytics: {
        Args:
          | {
              p_pod_id: string
              p_questions_answered?: number
              p_correct_answers?: number
              p_quiz_attempts?: number
              p_time_spent_minutes?: number
            }
          | { pod_uuid: string }
        Returns: undefined
      }
      update_user_skill_progress: {
        Args: {
          p_user_id: string
          p_question_id: string
          p_is_correct: boolean
          p_time_spent?: number
        }
        Returns: undefined
      }
      update_weekly_content_metrics: {
        Args: { target_week_start?: string }
        Returns: number
      }
      upsert_user_email_preferences: {
        Args: {
          p_user_id: string
          p_email_notifications?: boolean
          p_weekly_digest?: boolean
          p_achievement_alerts?: boolean
          p_email_delivery_frequency?: string
          p_email_format?: string
          p_marketing_emails?: boolean
          p_product_updates?: boolean
          p_community_digest?: boolean
          p_survey_invitations?: boolean
          p_civic_news_alerts?: boolean
          p_re_engagement_emails?: boolean
          p_social_sharing_enabled?: boolean
          p_auto_share_achievements?: boolean
          p_allow_data_analytics?: boolean
          p_allow_personalization?: boolean
          p_export_format?: string
          p_integration_sync?: boolean
          p_notification_channels?: Json
          p_data_retention_period?: string
        }
        Returns: {
          achievement_alerts: boolean | null
          allow_data_analytics: boolean | null
          allow_personalization: boolean | null
          auto_share_achievements: boolean | null
          civic_news_alerts: boolean | null
          community_digest: boolean | null
          created_at: string
          data_retention_period: string | null
          email_delivery_frequency: string | null
          email_format: string | null
          email_notifications: boolean | null
          export_format: string | null
          id: string
          integration_sync: boolean | null
          marketing_emails: boolean | null
          notification_channels: Json | null
          product_updates: boolean | null
          re_engagement_emails: boolean | null
          social_sharing_enabled: boolean | null
          survey_invitations: boolean | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
      }
      user_is_in_room: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_function_table_types: {
        Args: { function_name_param: string; table_name_param: string }
        Returns: {
          column_position: number
          table_column_name: string
          table_data_type: string
          function_parameter_name: string
          function_data_type: string
          types_match: boolean
          mismatch_details: string
        }[]
      }
      validate_migration_safety: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: string
        }[]
      }
      validate_multiplayer_host_assignments: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_rooms: number
          rooms_without_hosts: number
          rooms_with_multiple_hosts: number
          success_rate: number
        }[]
      }
      validate_multiplayer_schema: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          table_exists: boolean
          rls_enabled: boolean
          policy_count: number
        }[]
      }
      validate_multiplayer_schema_alignment: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          column_name: string
          expected_type: string
          actual_type: string
          status: string
        }[]
      }
      validate_translation_structure: {
        Args: { translations: Json }
        Returns: boolean
      }
    }
    Enums: {
      course_role: "student" | "teacher" | "teaching_assistant" | "observer"
      enrollment_status: "active" | "dropped" | "completed" | "transferred"
      quiz_game_mode:
        | "standard"
        | "practice"
        | "challenge"
        | "assessment"
        | "multiplayer"
        | "npc_battle"
      school_user_role:
        | "student"
        | "teacher"
        | "administrator"
        | "counselor"
        | "parent"
        | "district_admin"
      sync_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "failed"
        | "cancelled"
      sync_type:
        | "roster_import"
        | "grade_export"
        | "assignment_create"
        | "enrollment_sync"
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
    Enums: {
      course_role: ["student", "teacher", "teaching_assistant", "observer"],
      enrollment_status: ["active", "dropped", "completed", "transferred"],
      quiz_game_mode: [
        "standard",
        "practice",
        "challenge",
        "assessment",
        "multiplayer",
        "npc_battle",
      ],
      school_user_role: [
        "student",
        "teacher",
        "administrator",
        "counselor",
        "parent",
        "district_admin",
      ],
      sync_status: [
        "pending",
        "in_progress",
        "completed",
        "failed",
        "cancelled",
      ],
      sync_type: [
        "roster_import",
        "grade_export",
        "assignment_create",
        "enrollment_sync",
      ],
    },
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

// Assessment and onboarding types
export type DbAssessmentQuestion = Tables<'assessment_questions'>
export type DbAssessmentAnalytics = Tables<'assessment_analytics'>
export type DbAssessmentScoring = Tables<'assessment_scoring'>
export type DbUserAssessment = Tables<'user_assessments'>
export type DbUserOnboardingState = Tables<'user_onboarding_state'>

// Skills and learning types
export type DbSkill = Tables<'skills'>
export type DbSkillRelationship = Tables<'skill_relationships'>
export type DbUserSkillProgress = Tables<'user_skill_progress'>
export type DbUserSkillPreference = Tables<'user_skill_preferences'>
export type DbLearningObjective = Tables<'learning_objectives'>

// Premium and subscription types
export type DbUserSubscription = Tables<'user_subscriptions'>

// Guest access types
export type DbGuestUsageTracking = Tables<'guest_usage_tracking'>
export type DbGuestUsageAnalytics = Tables<'guest_usage_analytics'>
export type DbGuestCivicsTestResult = Tables<'guest_civics_test_results'>

// Civics test analytics
export type DbCivicsTestAnalytics = Tables<'civics_test_analytics'>

// Public figures and organizations
export type DbPublicFigure = Tables<'public_figures'>
export type DbOrganization = Tables<'organizations'>
export type DbFigureEvent = Tables<'figure_events'>
export type DbFigureRelationship = Tables<'figure_relationships'>

// Multiplayer types
export type DbMultiplayerRoom = Tables<'multiplayer_rooms'>
export type DbMultiplayerRoomPlayer = Tables<'multiplayer_room_players'>
export type DbMultiplayerQuizAttempt = Tables<'multiplayer_quiz_attempts'>
export type DbMultiplayerQuestionResponse = Tables<'multiplayer_question_responses'>
export type DbMultiplayerGameEvent = Tables<'multiplayer_game_events'>
export type DbMultiplayerChatMessage = Tables<'multiplayer_chat_messages'>
export type DbMultiplayerConversationContext = Tables<'multiplayer_conversation_context'>
export type DbMultiplayerNpcPlayer = Tables<'multiplayer_npc_players'>

// Survey types
export type DbSurvey = Tables<'surveys'>
export type DbSurveyQuestion = Tables<'survey_questions'>
export type DbSurveyResponse = Tables<'survey_responses'>
export type DbSurveyAnswer = Tables<'survey_answers'>

// Bookmark types
export type DbBookmark = Tables<'bookmarks'>
export type DbBookmarkCollection = Tables<'bookmark_collections'>
export type DbBookmarkSnippet = Tables<'bookmark_snippets'>
export type DbBookmarkTag = Tables<'bookmark_tags'>

// Media bias types
export type DbMediaOrganization = Tables<'media_organizations'>
export type DbBiasDimension = Tables<'bias_dimensions'>
export type DbOrganizationBiasScore = Tables<'organization_bias_scores'>
export type DbArticleBiasAnalysis = Tables<'article_bias_analysis'>
export type DbBiasFeedback = Tables<'bias_feedback'>
export type DbSourceMetadata = Tables<'source_metadata'>

// NPC types
export type DbNpcPersonality = Tables<'npc_personalities'>
export type DbNpcQuizAttempt = Tables<'npc_quiz_attempts'>
export type DbNpcQuestionResponse = Tables<'npc_question_responses'>
export type DbNpcConversationHistory = Tables<'npc_conversation_history'>

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

// Assessment insert types
export type DbAssessmentQuestionInsert = TablesInsert<'assessment_questions'>
export type DbAssessmentAnalyticsInsert = TablesInsert<'assessment_analytics'>
export type DbUserAssessmentInsert = TablesInsert<'user_assessments'>
export type DbUserOnboardingStateInsert = TablesInsert<'user_onboarding_state'>

// Skills insert types
export type DbUserSkillProgressInsert = TablesInsert<'user_skill_progress'>
export type DbUserSkillPreferenceInsert = TablesInsert<'user_skill_preferences'>

// Guest access insert types
export type DbGuestUsageTrackingInsert = TablesInsert<'guest_usage_tracking'>
export type DbGuestCivicsTestResultInsert = TablesInsert<'guest_civics_test_results'>
export type DbCivicsTestAnalyticsInsert = TablesInsert<'civics_test_analytics'>

// Multiplayer insert types
export type DbMultiplayerRoomInsert = TablesInsert<'multiplayer_rooms'>
export type DbMultiplayerRoomPlayerInsert = TablesInsert<'multiplayer_room_players'>
export type DbMultiplayerQuizAttemptInsert = TablesInsert<'multiplayer_quiz_attempts'>
export type DbMultiplayerQuestionResponseInsert = TablesInsert<'multiplayer_question_responses'>
export type DbMultiplayerGameEventInsert = TablesInsert<'multiplayer_game_events'>
export type DbMultiplayerChatMessageInsert = TablesInsert<'multiplayer_chat_messages'>

// Survey insert types
export type DbSurveyInsert = TablesInsert<'surveys'>
export type DbSurveyQuestionInsert = TablesInsert<'survey_questions'>
export type DbSurveyResponseInsert = TablesInsert<'survey_responses'>
export type DbSurveyAnswerInsert = TablesInsert<'survey_answers'>

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

// Assessment update types
export type DbAssessmentQuestionUpdate = TablesUpdate<'assessment_questions'>
export type DbUserAssessmentUpdate = TablesUpdate<'user_assessments'>
export type DbUserOnboardingStateUpdate = TablesUpdate<'user_onboarding_state'>

// Skills update types
export type DbUserSkillProgressUpdate = TablesUpdate<'user_skill_progress'>
export type DbUserSkillPreferenceUpdate = TablesUpdate<'user_skill_preferences'>

// Guest access update types
export type DbGuestUsageTrackingUpdate = TablesUpdate<'guest_usage_tracking'>
export type DbGuestCivicsTestResultUpdate = TablesUpdate<'guest_civics_test_results'>

// Subscription update types
export type DbUserSubscriptionUpdate = TablesUpdate<'user_subscriptions'>

// Multiplayer update types
export type DbMultiplayerRoomUpdate = TablesUpdate<'multiplayer_rooms'>
export type DbMultiplayerRoomPlayerUpdate = TablesUpdate<'multiplayer_room_players'>
export type DbMultiplayerQuizAttemptUpdate = TablesUpdate<'multiplayer_quiz_attempts'>

// Survey update types
export type DbSurveyUpdate = TablesUpdate<'surveys'>
export type DbSurveyQuestionUpdate = TablesUpdate<'survey_questions'>
export type DbSurveyResponseUpdate = TablesUpdate<'survey_responses'>

// Enum types (add as needed)
// Example: export type DbUserRole = Database['public']['Enums']['user_role']
// Example: export type DbQuestionType = Database['public']['Enums']['question_type']
