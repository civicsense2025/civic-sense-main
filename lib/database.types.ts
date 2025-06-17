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
      assessment_analytics: {
        Row: {
          event_type: string | null
          final_score: number | null
          metadata: Json | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event_type?: string | null
          final_score?: number | null
          metadata?: Json | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string | null
          final_score?: number | null
          metadata?: Json | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
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
      category_synonyms: {
        Row: {
          alias: string
          category_id: string | null
        }
        Insert: {
          alias: string
          category_id?: string | null
        }
        Update: {
          alias?: string
          category_id?: string | null
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
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "fact_check_logs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
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
          {
            foreignKeyName: "figure_quiz_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "figure_quiz_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
            referencedColumns: ["topic_identifier"]
          },
          {
            foreignKeyName: "figure_quiz_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_without_questions"
            referencedColumns: ["topic_id"]
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
      glossary_terms: {
        Row: {
          category: string | null
          created_at: string
          definition: string
          examples: Json | null
          id: string
          part_of_speech: string | null
          synonyms: string[] | null
          term: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          definition: string
          examples?: Json | null
          id?: string
          part_of_speech?: string | null
          synonyms?: string[] | null
          term: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          definition?: string
          examples?: Json | null
          id?: string
          part_of_speech?: string | null
          synonyms?: string[] | null
          term?: string
          updated_at?: string
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
      public_figures: {
        Row: {
          bills_sponsored: number | null
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
          is_correct: boolean | null
          question_id: string | null
          selected_answer: string | null
          time_spent_seconds: number | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          is_correct?: boolean | null
          question_id?: string | null
          selected_answer?: string | null
          time_spent_seconds?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
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
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_feedback_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
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
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_skills_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
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
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_source_links_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
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
      question_topics: {
        Row: {
          categories: Json
          created_at: string | null
          date: string | null
          day_of_week: string | null
          description: string
          emoji: string
          id: string
          is_active: boolean | null
          is_breaking: boolean | null
          topic_id: string
          topic_title: string
          updated_at: string | null
          why_this_matters: string
        }
        Insert: {
          categories?: Json
          created_at?: string | null
          date?: string | null
          day_of_week?: string | null
          description: string
          emoji: string
          id?: string
          is_active?: boolean | null
          is_breaking?: boolean | null
          topic_id: string
          topic_title: string
          updated_at?: string | null
          why_this_matters: string
        }
        Update: {
          categories?: Json
          created_at?: string | null
          date?: string | null
          day_of_week?: string | null
          description?: string
          emoji?: string
          id?: string
          is_active?: boolean | null
          is_breaking?: boolean | null
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
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
            referencedColumns: ["topic_identifier"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
        ]
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
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "questions_test_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
            referencedColumns: ["topic_identifier"]
          },
          {
            foreignKeyName: "questions_test_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_without_questions"
            referencedColumns: ["topic_id"]
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
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_deck_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
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
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
            referencedColumns: ["topic_identifier"]
          },
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
        ]
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
      user_onboarding_assessment: {
        Row: {
          assessment_data: Json
          assessment_type: string
          completed_at: string | null
          created_at: string | null
          id: string
          results: Json
          score: number | null
          user_id: string
        }
        Insert: {
          assessment_data?: Json
          assessment_type?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          results?: Json
          score?: number | null
          user_id: string
        }
        Update: {
          assessment_data?: Json
          assessment_type?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          results?: Json
          score?: number | null
          user_id?: string
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
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_question_memory_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
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
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "user_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
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
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_quiz_analytics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
            referencedColumns: ["topic_identifier"]
          },
          {
            foreignKeyName: "user_quiz_analytics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_without_questions"
            referencedColumns: ["topic_id"]
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
          {
            foreignKeyName: "user_quiz_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
            referencedColumns: ["topic_identifier"]
          },
          {
            foreignKeyName: "user_quiz_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_without_questions"
            referencedColumns: ["topic_id"]
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
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
            referencedColumns: ["topic_identifier"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_with_questions"
            referencedColumns: ["topic_identifier"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      question_topics_with_questions: {
        Row: {
          categories: Json | null
          correct_answer: string | null
          date: string | null
          day_of_week: string | null
          description: string | null
          difficulty_level: number | null
          emoji: string | null
          explanation: string | null
          hint: string | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question_active: boolean | null
          question_category: string | null
          question_id: string | null
          question_number: number | null
          question_sources: Json | null
          question_tags: Json | null
          question_text: string | null
          question_type: string | null
          topic_active: boolean | null
          topic_id: string | null
          topic_identifier: string | null
          topic_title: string | null
          why_this_matters: string | null
        }
        Relationships: []
      }
      question_topics_without_questions: {
        Row: {
          categories: Json | null
          created_at: string | null
          date: string | null
          day_of_week: string | null
          description: string | null
          emoji: string | null
          id: string | null
          is_active: boolean | null
          topic_id: string | null
          topic_title: string | null
          updated_at: string | null
          why_this_matters: string | null
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
      check_boost_cooldown: {
        Args: { target_user_id: string; target_boost_type: string }
        Returns: boolean
      }
      check_premium_feature_access: {
        Args: { p_user_id: string; p_feature_name: string }
        Returns: boolean
      }
      cleanup_expired_boosts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_onboarding_step: {
        Args: { target_user_id: string; step_name: string; step_data?: Json }
        Returns: boolean
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
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      track_feature_usage: {
        Args: { p_user_id: string; p_feature_name: string }
        Returns: boolean
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
