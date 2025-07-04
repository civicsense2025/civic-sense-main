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
      ai_action_executions: {
        Row: {
          action_id: string
          ai_tokens_used: number | null
          command_execution_id: string
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          execution_order: number
          execution_time_ms: number | null
          id: string
          inputs: Json | null
          outputs: Json | null
          parallel_group: number | null
          progress: number | null
          retry_count: number | null
          side_effects_log: string[] | null
          started_at: string | null
          status: string
        }
        Insert: {
          action_id: string
          ai_tokens_used?: number | null
          command_execution_id: string
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          execution_order: number
          execution_time_ms?: number | null
          id?: string
          inputs?: Json | null
          outputs?: Json | null
          parallel_group?: number | null
          progress?: number | null
          retry_count?: number | null
          side_effects_log?: string[] | null
          started_at?: string | null
          status?: string
        }
        Update: {
          action_id?: string
          ai_tokens_used?: number | null
          command_execution_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          execution_order?: number
          execution_time_ms?: number | null
          id?: string
          inputs?: Json | null
          outputs?: Json | null
          parallel_group?: number | null
          progress?: number | null
          retry_count?: number | null
          side_effects_log?: string[] | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_executions_command_execution_id_fkey"
            columns: ["command_execution_id"]
            isOneToOne: false
            referencedRelation: "ai_command_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_command_analytics: {
        Row: {
          action_id: string | null
          avg_execution_time_ms: number | null
          command_id: string | null
          created_at: string | null
          date: string
          execution_count: number | null
          failure_count: number | null
          id: string
          p95_execution_time_ms: number | null
          repeat_usage_rate: number | null
          success_count: number | null
          total_ai_cost_usd: number | null
          total_ai_tokens_used: number | null
          unique_users: number | null
        }
        Insert: {
          action_id?: string | null
          avg_execution_time_ms?: number | null
          command_id?: string | null
          created_at?: string | null
          date: string
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          p95_execution_time_ms?: number | null
          repeat_usage_rate?: number | null
          success_count?: number | null
          total_ai_cost_usd?: number | null
          total_ai_tokens_used?: number | null
          unique_users?: number | null
        }
        Update: {
          action_id?: string | null
          avg_execution_time_ms?: number | null
          command_id?: string | null
          created_at?: string | null
          date?: string
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          p95_execution_time_ms?: number | null
          repeat_usage_rate?: number | null
          success_count?: number | null
          total_ai_cost_usd?: number | null
          total_ai_tokens_used?: number | null
          unique_users?: number | null
        }
        Relationships: []
      }
      ai_command_executions: {
        Row: {
          admin_context: Json | null
          ai_cost_usd: number | null
          ai_tokens_used: number | null
          command_id: string
          completed_at: string | null
          created_at: string | null
          current_action_id: string | null
          current_step_description: string | null
          error_details: Json | null
          error_message: string | null
          estimated_duration_seconds: number | null
          execution_plan: Json | null
          execution_time_ms: number | null
          extracted_parameters: Json | null
          failed_action_id: string | null
          id: string
          intermediate_results: Json | null
          original_input: string
          parsed_intent: Json | null
          progress: number | null
          results: Json | null
          retry_count: number | null
          session_id: string | null
          started_at: string | null
          status: string
          success_metrics: Json | null
          user_id: string | null
        }
        Insert: {
          admin_context?: Json | null
          ai_cost_usd?: number | null
          ai_tokens_used?: number | null
          command_id: string
          completed_at?: string | null
          created_at?: string | null
          current_action_id?: string | null
          current_step_description?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_duration_seconds?: number | null
          execution_plan?: Json | null
          execution_time_ms?: number | null
          extracted_parameters?: Json | null
          failed_action_id?: string | null
          id?: string
          intermediate_results?: Json | null
          original_input: string
          parsed_intent?: Json | null
          progress?: number | null
          results?: Json | null
          retry_count?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          success_metrics?: Json | null
          user_id?: string | null
        }
        Update: {
          admin_context?: Json | null
          ai_cost_usd?: number | null
          ai_tokens_used?: number | null
          command_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_action_id?: string | null
          current_step_description?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_duration_seconds?: number | null
          execution_plan?: Json | null
          execution_time_ms?: number | null
          extracted_parameters?: Json | null
          failed_action_id?: string | null
          id?: string
          intermediate_results?: Json | null
          original_input?: string
          parsed_intent?: Json | null
          progress?: number | null
          results?: Json | null
          retry_count?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          success_metrics?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_research_results: {
        Row: {
          ai_model: string | null
          completed_at: string | null
          content_connections_built: number | null
          context: string | null
          cost_usd: number | null
          created_at: string | null
          database_context_analyzed: number | null
          end_year: number | null
          error_message: string | null
          events_found: number | null
          focus_areas: string[] | null
          human_reviewed: boolean | null
          id: string
          knowledge_insights: Json | null
          learning_context: string | null
          max_events: number | null
          mode: string | null
          performance_metrics: Json | null
          processing_time_ms: number | null
          query: string
          research_quality: string | null
          research_timestamp: string | null
          research_type: string | null
          researcher_id: string | null
          results: Json | null
          reviewer_notes: string | null
          significance_threshold: number | null
          start_year: number | null
          status: string | null
          themes: string[] | null
          timeframe: Json | null
          tokens_used: number | null
          validation_score: number | null
        }
        Insert: {
          ai_model?: string | null
          completed_at?: string | null
          content_connections_built?: number | null
          context?: string | null
          cost_usd?: number | null
          created_at?: string | null
          database_context_analyzed?: number | null
          end_year?: number | null
          error_message?: string | null
          events_found?: number | null
          focus_areas?: string[] | null
          human_reviewed?: boolean | null
          id?: string
          knowledge_insights?: Json | null
          learning_context?: string | null
          max_events?: number | null
          mode?: string | null
          performance_metrics?: Json | null
          processing_time_ms?: number | null
          query: string
          research_quality?: string | null
          research_timestamp?: string | null
          research_type?: string | null
          researcher_id?: string | null
          results?: Json | null
          reviewer_notes?: string | null
          significance_threshold?: number | null
          start_year?: number | null
          status?: string | null
          themes?: string[] | null
          timeframe?: Json | null
          tokens_used?: number | null
          validation_score?: number | null
        }
        Update: {
          ai_model?: string | null
          completed_at?: string | null
          content_connections_built?: number | null
          context?: string | null
          cost_usd?: number | null
          created_at?: string | null
          database_context_analyzed?: number | null
          end_year?: number | null
          error_message?: string | null
          events_found?: number | null
          focus_areas?: string[] | null
          human_reviewed?: boolean | null
          id?: string
          knowledge_insights?: Json | null
          learning_context?: string | null
          max_events?: number | null
          mode?: string | null
          performance_metrics?: Json | null
          processing_time_ms?: number | null
          query?: string
          research_quality?: string | null
          research_timestamp?: string | null
          research_type?: string | null
          researcher_id?: string | null
          results?: Json | null
          reviewer_notes?: string | null
          significance_threshold?: number | null
          start_year?: number | null
          status?: string | null
          themes?: string[] | null
          timeframe?: Json | null
          tokens_used?: number | null
          validation_score?: number | null
        }
        Relationships: []
      }
      ai_research_sessions: {
        Row: {
          ai_model_used: string | null
          completed_at: string | null
          connections_discovered: number | null
          content_packages_created: number | null
          cost_usd: number | null
          created_at: string | null
          database_context: Json
          error_message: string | null
          events_generated: number | null
          existing_events_analyzed: number | null
          existing_topics_analyzed: number | null
          focus_areas: string[] | null
          id: string
          overall_quality_score: number | null
          patterns_identified: string[] | null
          processing_time_ms: number | null
          research_config: Json
          research_mode: string
          researcher_id: string
          results_summary: Json | null
          session_name: string | null
          started_at: string | null
          status: string | null
          themes: string[] | null
          time_constraints: Json | null
          tokens_consumed: number | null
          updated_at: string | null
          validation_results: Json | null
        }
        Insert: {
          ai_model_used?: string | null
          completed_at?: string | null
          connections_discovered?: number | null
          content_packages_created?: number | null
          cost_usd?: number | null
          created_at?: string | null
          database_context?: Json
          error_message?: string | null
          events_generated?: number | null
          existing_events_analyzed?: number | null
          existing_topics_analyzed?: number | null
          focus_areas?: string[] | null
          id?: string
          overall_quality_score?: number | null
          patterns_identified?: string[] | null
          processing_time_ms?: number | null
          research_config?: Json
          research_mode: string
          researcher_id: string
          results_summary?: Json | null
          session_name?: string | null
          started_at?: string | null
          status?: string | null
          themes?: string[] | null
          time_constraints?: Json | null
          tokens_consumed?: number | null
          updated_at?: string | null
          validation_results?: Json | null
        }
        Update: {
          ai_model_used?: string | null
          completed_at?: string | null
          connections_discovered?: number | null
          content_packages_created?: number | null
          cost_usd?: number | null
          created_at?: string | null
          database_context?: Json
          error_message?: string | null
          events_generated?: number | null
          existing_events_analyzed?: number | null
          existing_topics_analyzed?: number | null
          focus_areas?: string[] | null
          id?: string
          overall_quality_score?: number | null
          patterns_identified?: string[] | null
          processing_time_ms?: number | null
          research_config?: Json
          research_mode?: string
          researcher_id?: string
          results_summary?: Json | null
          session_name?: string | null
          started_at?: string | null
          status?: string | null
          themes?: string[] | null
          time_constraints?: Json | null
          tokens_consumed?: number | null
          updated_at?: string | null
          validation_results?: Json | null
        }
        Relationships: []
      }
      ai_source_analysis: {
        Row: {
          ai_model_version: string | null
          analysis_confidence: number
          analysis_summary: string
          analyzed_at: string
          created_at: string | null
          domain: string
          expires_at: string
          factual_rating: string
          id: string
          original_url: string
          overall_bias: string
          overall_credibility: number
          recommendations: string[] | null
          red_flags: string[] | null
          strengths: string[] | null
          transparency_score: number | null
          updated_at: string | null
          url_hash: string
          weaknesses: string[] | null
        }
        Insert: {
          ai_model_version?: string | null
          analysis_confidence: number
          analysis_summary: string
          analyzed_at?: string
          created_at?: string | null
          domain: string
          expires_at: string
          factual_rating: string
          id?: string
          original_url: string
          overall_bias: string
          overall_credibility: number
          recommendations?: string[] | null
          red_flags?: string[] | null
          strengths?: string[] | null
          transparency_score?: number | null
          updated_at?: string | null
          url_hash: string
          weaknesses?: string[] | null
        }
        Update: {
          ai_model_version?: string | null
          analysis_confidence?: number
          analysis_summary?: string
          analyzed_at?: string
          created_at?: string | null
          domain?: string
          expires_at?: string
          factual_rating?: string
          id?: string
          original_url?: string
          overall_bias?: string
          overall_credibility?: number
          recommendations?: string[] | null
          red_flags?: string[] | null
          strengths?: string[] | null
          transparency_score?: number | null
          updated_at?: string | null
          url_hash?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      ai_tool_usage: {
        Row: {
          completed_at: string | null
          cost_usd: number | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json | null
          metadata: Json | null
          operation_type: string
          output_data: Json | null
          processing_time_ms: number | null
          provider: string
          started_at: string | null
          status: string | null
          tokens_used: number | null
          tool_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          metadata?: Json | null
          operation_type: string
          output_data?: Json | null
          processing_time_ms?: number | null
          provider: string
          started_at?: string | null
          status?: string | null
          tokens_used?: number | null
          tool_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          metadata?: Json | null
          operation_type?: string
          output_data?: Json | null
          processing_time_ms?: number | null
          provider?: string
          started_at?: string | null
          status?: string | null
          tokens_used?: number | null
          tool_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          action_steps_engaged: number | null
          civic_knowledge_score: number | null
          created_at: string
          device_type: string | null
          event_category: string
          event_data: Json
          event_type: string
          game_mode: string | null
          guest_token: string | null
          id: string
          misconceptions_corrected: number | null
          page_url: string | null
          performance_data: Json | null
          platform: string | null
          question_id: string | null
          quiz_attempt_id: string | null
          referrer_url: string | null
          response_time_ms: number | null
          room_code: string | null
          session_id: string
          social_interaction_type: string | null
          team_id: string | null
          time_since_question_start_ms: number | null
          time_since_quiz_start_ms: number | null
          topic_id: string | null
          uncomfortable_truths_revealed: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_steps_engaged?: number | null
          civic_knowledge_score?: number | null
          created_at?: string
          device_type?: string | null
          event_category: string
          event_data?: Json
          event_type: string
          game_mode?: string | null
          guest_token?: string | null
          id?: string
          misconceptions_corrected?: number | null
          page_url?: string | null
          performance_data?: Json | null
          platform?: string | null
          question_id?: string | null
          quiz_attempt_id?: string | null
          referrer_url?: string | null
          response_time_ms?: number | null
          room_code?: string | null
          session_id: string
          social_interaction_type?: string | null
          team_id?: string | null
          time_since_question_start_ms?: number | null
          time_since_quiz_start_ms?: number | null
          topic_id?: string | null
          uncomfortable_truths_revealed?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_steps_engaged?: number | null
          civic_knowledge_score?: number | null
          created_at?: string
          device_type?: string | null
          event_category?: string
          event_data?: Json
          event_type?: string
          game_mode?: string | null
          guest_token?: string | null
          id?: string
          misconceptions_corrected?: number | null
          page_url?: string | null
          performance_data?: Json | null
          platform?: string | null
          question_id?: string | null
          quiz_attempt_id?: string | null
          referrer_url?: string | null
          response_time_ms?: number | null
          room_code?: string | null
          session_id?: string
          social_interaction_type?: string | null
          team_id?: string | null
          time_since_question_start_ms?: number | null
          time_since_quiz_start_ms?: number | null
          topic_id?: string | null
          uncomfortable_truths_revealed?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "analytics_events_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "user_quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_few_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_translation_coverage_summary"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      apple_iap_transactions: {
        Row: {
          created_at: string
          environment: string
          id: string
          original_transaction_id: string
          product_id: string
          purchase_date: string
          receipt_data: string
          transaction_id: string
          updated_at: string
          user_id: string
          validation_status: string
        }
        Insert: {
          created_at?: string
          environment: string
          id?: string
          original_transaction_id: string
          product_id: string
          purchase_date: string
          receipt_data: string
          transaction_id: string
          updated_at?: string
          user_id: string
          validation_status: string
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          original_transaction_id?: string
          product_id?: string
          purchase_date?: string
          receipt_data?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
          validation_status?: string
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
      auto_generated_events: {
        Row: {
          created_at: string | null
          event_date: string
          event_description: string
          event_title: string
          event_type: string
          id: string
          public_impact_level: string | null
          published_at: string | null
          published_to: string[] | null
          should_publish: boolean | null
          significance_score: number | null
          source_entity_id: string
          source_entity_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_date: string
          event_description: string
          event_title: string
          event_type: string
          id?: string
          public_impact_level?: string | null
          published_at?: string | null
          published_to?: string[] | null
          should_publish?: boolean | null
          significance_score?: number | null
          source_entity_id: string
          source_entity_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_date?: string
          event_description?: string
          event_title?: string
          event_type?: string
          id?: string
          public_impact_level?: string | null
          published_at?: string | null
          published_to?: string[] | null
          should_publish?: boolean | null
          significance_score?: number | null
          source_entity_id?: string
          source_entity_type?: string
          updated_at?: string | null
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
      bill_actions: {
        Row: {
          action_code: string | null
          action_date: string
          action_text: string
          action_type: string | null
          ai_interpretation: string | null
          bill_id: string
          chamber: string | null
          committee_id: string | null
          created_at: string | null
          id: string
          significance_score: number | null
          updated_at: string | null
        }
        Insert: {
          action_code?: string | null
          action_date: string
          action_text: string
          action_type?: string | null
          ai_interpretation?: string | null
          bill_id: string
          chamber?: string | null
          committee_id?: string | null
          created_at?: string | null
          id?: string
          significance_score?: number | null
          updated_at?: string | null
        }
        Update: {
          action_code?: string | null
          action_date?: string
          action_text?: string
          action_type?: string | null
          ai_interpretation?: string | null
          bill_id?: string
          chamber?: string | null
          committee_id?: string | null
          created_at?: string | null
          id?: string
          significance_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_actions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "congressional_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_content_analysis: {
        Row: {
          action_items: string[] | null
          affected_populations: Json | null
          bill_id: string
          content_quality_score: number | null
          created_at: string | null
          economic_impact: Json | null
          fact_check_status: string | null
          id: string
          key_provisions: Json | null
          last_human_review: string | null
          plain_english_summary: string
          power_dynamics: Json | null
          stake_analysis: string
          uncomfortable_truths: string[] | null
          updated_at: string | null
        }
        Insert: {
          action_items?: string[] | null
          affected_populations?: Json | null
          bill_id: string
          content_quality_score?: number | null
          created_at?: string | null
          economic_impact?: Json | null
          fact_check_status?: string | null
          id?: string
          key_provisions?: Json | null
          last_human_review?: string | null
          plain_english_summary: string
          power_dynamics?: Json | null
          stake_analysis: string
          uncomfortable_truths?: string[] | null
          updated_at?: string | null
        }
        Update: {
          action_items?: string[] | null
          affected_populations?: Json | null
          bill_id?: string
          content_quality_score?: number | null
          created_at?: string | null
          economic_impact?: Json | null
          fact_check_status?: string | null
          id?: string
          key_provisions?: Json | null
          last_human_review?: string | null
          plain_english_summary?: string
          power_dynamics?: Json | null
          stake_analysis?: string
          uncomfortable_truths?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_content_analysis_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "congressional_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_cosponsors: {
        Row: {
          bill_id: string
          cosponsor_id: string
          created_at: string | null
          date_cosponsored: string
          id: string
          is_original_cosponsor: boolean | null
        }
        Insert: {
          bill_id: string
          cosponsor_id: string
          created_at?: string | null
          date_cosponsored: string
          id?: string
          is_original_cosponsor?: boolean | null
        }
        Update: {
          bill_id?: string
          cosponsor_id?: string
          created_at?: string | null
          date_cosponsored?: string
          id?: string
          is_original_cosponsor?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_cosponsors_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "congressional_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_cosponsors_cosponsor_id_fkey"
            columns: ["cosponsor_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_relationships: {
        Row: {
          bill_id: string
          created_at: string | null
          id: string
          related_bill_id: string
          relationship_type: string
        }
        Insert: {
          bill_id: string
          created_at?: string | null
          id?: string
          related_bill_id: string
          relationship_type: string
        }
        Update: {
          bill_id?: string
          created_at?: string | null
          id?: string
          related_bill_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_relationships_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "congressional_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_relationships_related_bill_id_fkey"
            columns: ["related_bill_id"]
            isOneToOne: false
            referencedRelation: "congressional_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_subjects: {
        Row: {
          bill_id: string
          created_at: string | null
          id: string
          is_primary_subject: boolean | null
          subject_name: string
        }
        Insert: {
          bill_id: string
          created_at?: string | null
          id?: string
          is_primary_subject?: boolean | null
          subject_name: string
        }
        Update: {
          bill_id?: string
          created_at?: string | null
          id?: string
          is_primary_subject?: boolean | null
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_subjects_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "congressional_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_summaries: {
        Row: {
          action_date: string
          action_description: string
          bill_id: string
          congress_api_last_update: string | null
          created_at: string | null
          id: string
          summary_text: string
          version_code: string
        }
        Insert: {
          action_date: string
          action_description: string
          bill_id: string
          congress_api_last_update?: string | null
          created_at?: string | null
          id?: string
          summary_text: string
          version_code: string
        }
        Update: {
          action_date?: string
          action_description?: string
          bill_id?: string
          congress_api_last_update?: string | null
          created_at?: string | null
          id?: string
          summary_text?: string
          version_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_summaries_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "congressional_bills"
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
      bookmark_collection_items: {
        Row: {
          added_at: string
          collection_id: string
          content_id: string
          content_type: string
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          sort_order: number | null
          title: string | null
          updated_at: string
          user_id: string
          user_notes: string | null
          user_tags: string[] | null
        }
        Insert: {
          added_at?: string
          collection_id: string
          content_id: string
          content_type: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
          user_tags?: string[] | null
        }
        Update: {
          added_at?: string
          collection_id?: string
          content_id?: string
          content_type?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
          user_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
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
      civic_content_analysis: {
        Row: {
          action_items: string[] | null
          affected_populations: Json | null
          content_quality_score: number | null
          created_at: string | null
          economic_impact: Json | null
          entity_id: string
          entity_type: string
          fact_check_status: string | null
          id: string
          last_human_review: string | null
          plain_english_summary: string
          power_dynamics: Json | null
          replaces_analysis_id: string | null
          stake_analysis: string
          uncomfortable_truths: string[] | null
          updated_at: string | null
          version_number: number | null
        }
        Insert: {
          action_items?: string[] | null
          affected_populations?: Json | null
          content_quality_score?: number | null
          created_at?: string | null
          economic_impact?: Json | null
          entity_id: string
          entity_type: string
          fact_check_status?: string | null
          id?: string
          last_human_review?: string | null
          plain_english_summary: string
          power_dynamics?: Json | null
          replaces_analysis_id?: string | null
          stake_analysis: string
          uncomfortable_truths?: string[] | null
          updated_at?: string | null
          version_number?: number | null
        }
        Update: {
          action_items?: string[] | null
          affected_populations?: Json | null
          content_quality_score?: number | null
          created_at?: string | null
          economic_impact?: Json | null
          entity_id?: string
          entity_type?: string
          fact_check_status?: string | null
          id?: string
          last_human_review?: string | null
          plain_english_summary?: string
          power_dynamics?: Json | null
          replaces_analysis_id?: string | null
          stake_analysis?: string
          uncomfortable_truths?: string[] | null
          updated_at?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_content_analysis_replaces_analysis_id_fkey"
            columns: ["replaces_analysis_id"]
            isOneToOne: false
            referencedRelation: "civic_content_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_engagement_events: {
        Row: {
          created_at: string | null
          engagement_score: number | null
          event_data: Json | null
          event_type: string
          id: string
          notification_campaign_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          engagement_score?: number | null
          event_data?: Json | null
          event_type: string
          id?: string
          notification_campaign_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          engagement_score?: number | null
          event_data?: Json | null
          event_type?: string
          id?: string
          notification_campaign_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_engagement_events_notification_campaign_id_fkey"
            columns: ["notification_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "civic_engagement_events_notification_campaign_id_fkey"
            columns: ["notification_campaign_id"]
            isOneToOne: false
            referencedRelation: "civic_engagement_impact"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "civic_engagement_events_notification_campaign_id_fkey"
            columns: ["notification_campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
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
        Relationships: []
      }
      collection_analytics_daily: {
        Row: {
          average_completion_rate: number | null
          average_score: number | null
          average_session_duration_minutes: number | null
          bounce_rate: number | null
          collection_id: string
          completed_plays: number | null
          date: string
          engagement_score: number | null
          id: string
          perfect_scores: number | null
          quality_score: number | null
          total_comments: number | null
          total_likes: number | null
          total_plays: number | null
          total_shares: number | null
          total_time_played_minutes: number | null
          unique_players: number | null
        }
        Insert: {
          average_completion_rate?: number | null
          average_score?: number | null
          average_session_duration_minutes?: number | null
          bounce_rate?: number | null
          collection_id: string
          completed_plays?: number | null
          date: string
          engagement_score?: number | null
          id?: string
          perfect_scores?: number | null
          quality_score?: number | null
          total_comments?: number | null
          total_likes?: number | null
          total_plays?: number | null
          total_shares?: number | null
          total_time_played_minutes?: number | null
          unique_players?: number | null
        }
        Update: {
          average_completion_rate?: number | null
          average_score?: number | null
          average_session_duration_minutes?: number | null
          bounce_rate?: number | null
          collection_id?: string
          completed_plays?: number | null
          date?: string
          engagement_score?: number | null
          id?: string
          perfect_scores?: number | null
          quality_score?: number | null
          total_comments?: number | null
          total_likes?: number | null
          total_plays?: number | null
          total_shares?: number | null
          total_time_played_minutes?: number | null
          unique_players?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_analytics_daily_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "custom_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_analytics_daily_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "discoverable_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_analytics_daily_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "public_collections_with_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_analytics_events: {
        Row: {
          client_timestamp: string | null
          collection_id: string
          event_data: Json | null
          event_timestamp: string
          event_type: string
          id: string
          item_id: string | null
          item_position: number | null
          processing_time_ms: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          client_timestamp?: string | null
          collection_id: string
          event_data?: Json | null
          event_timestamp?: string
          event_type: string
          id?: string
          item_id?: string | null
          item_position?: number | null
          processing_time_ms?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          client_timestamp?: string | null
          collection_id?: string
          event_data?: Json | null
          event_timestamp?: string
          event_type?: string
          id?: string
          item_id?: string | null
          item_position?: number | null
          processing_time_ms?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_analytics_events_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "custom_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_analytics_events_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "discoverable_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_analytics_events_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "public_collections_with_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_analytics_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "custom_collection_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collection_play_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_collaborators: {
        Row: {
          can_delete: boolean | null
          can_edit: boolean | null
          can_invite: boolean | null
          can_publish: boolean | null
          collection_id: string
          contributions_count: number | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          last_viewed_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_invite?: boolean | null
          can_publish?: boolean | null
          collection_id: string
          contributions_count?: number | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_viewed_at?: string | null
          role: string
          status?: string
          user_id: string
        }
        Update: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_invite?: boolean | null
          can_publish?: boolean | null
          collection_id?: string
          contributions_count?: number | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_viewed_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_collaborators_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "custom_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_collaborators_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "discoverable_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_collaborators_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "public_collections_with_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_engagement: {
        Row: {
          best_score: number | null
          collection_id: string
          comment_visibility: string | null
          completion_count: number | null
          has_liked: boolean | null
          has_saved: boolean | null
          has_shared: boolean | null
          id: string
          last_played_at: string | null
          liked_at: string | null
          play_count: number | null
          private_notes: string | null
          public_comment: string | null
          rated_at: string | null
          rating: number | null
          saved_at: string | null
          shared_at: string | null
          total_time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          best_score?: number | null
          collection_id: string
          comment_visibility?: string | null
          completion_count?: number | null
          has_liked?: boolean | null
          has_saved?: boolean | null
          has_shared?: boolean | null
          id?: string
          last_played_at?: string | null
          liked_at?: string | null
          play_count?: number | null
          private_notes?: string | null
          public_comment?: string | null
          rated_at?: string | null
          rating?: number | null
          saved_at?: string | null
          shared_at?: string | null
          total_time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          best_score?: number | null
          collection_id?: string
          comment_visibility?: string | null
          completion_count?: number | null
          has_liked?: boolean | null
          has_saved?: boolean | null
          has_shared?: boolean | null
          id?: string
          last_played_at?: string | null
          liked_at?: string | null
          play_count?: number | null
          private_notes?: string | null
          public_comment?: string | null
          rated_at?: string | null
          rating?: number | null
          saved_at?: string | null
          shared_at?: string | null
          total_time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_engagement_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "custom_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_engagement_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "discoverable_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_engagement_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "public_collections_with_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          category: string | null
          collection_id: string
          content: string | null
          content_id: string | null
          content_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_duration_minutes: number | null
          estimated_minutes: number | null
          external_url: string | null
          id: string
          is_optional: boolean | null
          is_published: boolean | null
          is_required: boolean | null
          key_concepts: Json | null
          learning_objectives: Json | null
          lesson_type: string | null
          metadata: Json | null
          prerequisites: Json | null
          sort_order: number
          summary: string | null
          tags: string[] | null
          title: string | null
          topic_id: string | null
          translations: Json | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          collection_id: string
          content?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          estimated_minutes?: number | null
          external_url?: string | null
          id?: string
          is_optional?: boolean | null
          is_published?: boolean | null
          is_required?: boolean | null
          key_concepts?: Json | null
          learning_objectives?: Json | null
          lesson_type?: string | null
          metadata?: Json | null
          prerequisites?: Json | null
          sort_order?: number
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          topic_id?: string | null
          translations?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          collection_id?: string
          content?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          estimated_minutes?: number | null
          external_url?: string | null
          id?: string
          is_optional?: boolean | null
          is_published?: boolean | null
          is_required?: boolean | null
          key_concepts?: Json | null
          learning_objectives?: Json | null
          lesson_type?: string | null
          metadata?: Json | null
          prerequisites?: Json | null
          sort_order?: number
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          topic_id?: string | null
          translations?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "course_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "published_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_play_sessions: {
        Row: {
          active_time_seconds: number | null
          app_version: string | null
          collection_id: string
          completed_at: string | null
          completion_rate: number | null
          current_item_position: number | null
          device_type: string | null
          final_score_percentage: number | null
          hint_usage_count: number | null
          id: string
          is_completed: boolean | null
          items_completed: number | null
          items_skipped: number | null
          last_activity_at: string | null
          metadata: Json | null
          pause_count: number | null
          play_mode: string | null
          referrer_source: string | null
          session_token: string
          started_at: string
          total_possible_score: number | null
          total_score: number | null
          total_time_seconds: number | null
          user_id: string | null
        }
        Insert: {
          active_time_seconds?: number | null
          app_version?: string | null
          collection_id: string
          completed_at?: string | null
          completion_rate?: number | null
          current_item_position?: number | null
          device_type?: string | null
          final_score_percentage?: number | null
          hint_usage_count?: number | null
          id?: string
          is_completed?: boolean | null
          items_completed?: number | null
          items_skipped?: number | null
          last_activity_at?: string | null
          metadata?: Json | null
          pause_count?: number | null
          play_mode?: string | null
          referrer_source?: string | null
          session_token: string
          started_at?: string
          total_possible_score?: number | null
          total_score?: number | null
          total_time_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          active_time_seconds?: number | null
          app_version?: string | null
          collection_id?: string
          completed_at?: string | null
          completion_rate?: number | null
          current_item_position?: number | null
          device_type?: string | null
          final_score_percentage?: number | null
          hint_usage_count?: number | null
          id?: string
          is_completed?: boolean | null
          items_completed?: number | null
          items_skipped?: number | null
          last_activity_at?: string | null
          metadata?: Json | null
          pause_count?: number | null
          play_mode?: string | null
          referrer_source?: string | null
          session_token?: string
          started_at?: string
          total_possible_score?: number | null
          total_score?: number | null
          total_time_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_play_sessions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "custom_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_play_sessions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "discoverable_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_play_sessions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "public_collections_with_authors"
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
        Relationships: []
      }
      collection_shares: {
        Row: {
          allow_download: boolean | null
          allow_remix: boolean | null
          collection_id: string
          created_at: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          max_uses: number | null
          metadata: Json | null
          password_required: boolean | null
          require_login: boolean | null
          revoked_at: string | null
          share_code: string | null
          share_type: string
          shared_by: string
          unique_users: number | null
          use_count: number | null
        }
        Insert: {
          allow_download?: boolean | null
          allow_remix?: boolean | null
          collection_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          max_uses?: number | null
          metadata?: Json | null
          password_required?: boolean | null
          require_login?: boolean | null
          revoked_at?: string | null
          share_code?: string | null
          share_type: string
          shared_by: string
          unique_users?: number | null
          use_count?: number | null
        }
        Update: {
          allow_download?: boolean | null
          allow_remix?: boolean | null
          collection_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          max_uses?: number | null
          metadata?: Json | null
          password_required?: boolean | null
          require_login?: boolean | null
          revoked_at?: string | null
          share_code?: string | null
          share_type?: string
          shared_by?: string
          unique_users?: number | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_shares_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "custom_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_shares_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "discoverable_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_shares_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "public_collections_with_authors"
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
          categories: string[] | null
          content_type: string | null
          course_category: string | null
          created_at: string
          created_by: string | null
          current_events_relevance: number | null
          description: string | null
          difficulty_level: number | null
          emoji: string | null
          estimated_duration_minutes: number | null
          estimated_minutes: number | null
          featured_order: number | null
          id: string
          internal_notes: string | null
          is_featured: boolean | null
          is_public: boolean | null
          learning_objectives: string[] | null
          metadata: Json | null
          political_balance_score: number | null
          prerequisites: string[] | null
          published_at: string | null
          slug: string
          source_diversity_score: number | null
          status: string | null
          tags: string[] | null
          title: string
          translations: Json | null
          updated_at: string
          version: number | null
        }
        Insert: {
          action_items?: string[] | null
          categories?: string[] | null
          content_type?: string | null
          course_category?: string | null
          created_at?: string
          created_by?: string | null
          current_events_relevance?: number | null
          description?: string | null
          difficulty_level?: number | null
          emoji?: string | null
          estimated_duration_minutes?: number | null
          estimated_minutes?: number | null
          featured_order?: number | null
          id?: string
          internal_notes?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          learning_objectives?: string[] | null
          metadata?: Json | null
          political_balance_score?: number | null
          prerequisites?: string[] | null
          published_at?: string | null
          slug: string
          source_diversity_score?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          translations?: Json | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          action_items?: string[] | null
          categories?: string[] | null
          content_type?: string | null
          course_category?: string | null
          created_at?: string
          created_by?: string | null
          current_events_relevance?: number | null
          description?: string | null
          difficulty_level?: number | null
          emoji?: string | null
          estimated_duration_minutes?: number | null
          estimated_minutes?: number | null
          featured_order?: number | null
          id?: string
          internal_notes?: string | null
          is_featured?: boolean | null
          is_public?: boolean | null
          learning_objectives?: string[] | null
          metadata?: Json | null
          political_balance_score?: number | null
          prerequisites?: string[] | null
          published_at?: string | null
          slug?: string
          source_diversity_score?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          translations?: Json | null
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      committee_memberships: {
        Row: {
          committee_id: string
          created_at: string | null
          end_date: string | null
          id: string
          member_id: string
          role: string | null
          start_date: string
        }
        Insert: {
          committee_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          member_id: string
          role?: string | null
          start_date: string
        }
        Update: {
          committee_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          member_id?: string
          role?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_memberships_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "congressional_committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      congressional_bills: {
        Row: {
          ai_generated_summary: string | null
          bill_number: number
          bill_type: string
          civic_impact_score: number | null
          complexity_score: number | null
          congress_api_id: string
          congress_number: number
          content_quality_score: number | null
          created_at: string | null
          current_status: string
          has_placeholder_text: boolean | null
          id: string
          introduced_date: string | null
          last_action_date: string | null
          last_action_text: string | null
          last_content_update: string | null
          official_title: string | null
          primary_committee_id: string | null
          primary_sponsor_id: string | null
          short_title: string | null
          summary_text: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_generated_summary?: string | null
          bill_number: number
          bill_type: string
          civic_impact_score?: number | null
          complexity_score?: number | null
          congress_api_id: string
          congress_number: number
          content_quality_score?: number | null
          created_at?: string | null
          current_status: string
          has_placeholder_text?: boolean | null
          id?: string
          introduced_date?: string | null
          last_action_date?: string | null
          last_action_text?: string | null
          last_content_update?: string | null
          official_title?: string | null
          primary_committee_id?: string | null
          primary_sponsor_id?: string | null
          short_title?: string | null
          summary_text?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_generated_summary?: string | null
          bill_number?: number
          bill_type?: string
          civic_impact_score?: number | null
          complexity_score?: number | null
          congress_api_id?: string
          congress_number?: number
          content_quality_score?: number | null
          created_at?: string | null
          current_status?: string
          has_placeholder_text?: boolean | null
          id?: string
          introduced_date?: string | null
          last_action_date?: string | null
          last_action_text?: string | null
          last_content_update?: string | null
          official_title?: string | null
          primary_committee_id?: string | null
          primary_sponsor_id?: string | null
          short_title?: string | null
          summary_text?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "congressional_bills_primary_sponsor_id_fkey"
            columns: ["primary_sponsor_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      congressional_committees: {
        Row: {
          bills_advanced_count: number | null
          bills_killed_count: number | null
          chamber: string
          committee_type: string | null
          congress_api_code: string
          created_at: string | null
          id: string
          influence_score: number | null
          name: string
          parent_committee_id: string | null
          updated_at: string | null
        }
        Insert: {
          bills_advanced_count?: number | null
          bills_killed_count?: number | null
          chamber: string
          committee_type?: string | null
          congress_api_code: string
          created_at?: string | null
          id?: string
          influence_score?: number | null
          name: string
          parent_committee_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bills_advanced_count?: number | null
          bills_killed_count?: number | null
          chamber?: string
          committee_type?: string | null
          congress_api_code?: string
          created_at?: string | null
          id?: string
          influence_score?: number | null
          name?: string
          parent_committee_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "congressional_committees_parent_committee_id_fkey"
            columns: ["parent_committee_id"]
            isOneToOne: false
            referencedRelation: "congressional_committees"
            referencedColumns: ["id"]
          },
        ]
      }
      congressional_photos: {
        Row: {
          bioguide_id: string
          congress_number: number
          content_hash: string | null
          created_at: string
          download_attempts: number | null
          downloaded_at: string
          file_size: number | null
          id: string
          image_height: number | null
          image_width: number | null
          large_path: string | null
          last_error: string | null
          local_path: string | null
          medium_path: string | null
          member_id: string
          optimization_complete: boolean | null
          original_path: string | null
          original_url: string
          storage_bucket: string | null
          storage_path: string | null
          thumbnail_path: string | null
          updated_at: string
        }
        Insert: {
          bioguide_id: string
          congress_number: number
          content_hash?: string | null
          created_at?: string
          download_attempts?: number | null
          downloaded_at?: string
          file_size?: number | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          large_path?: string | null
          last_error?: string | null
          local_path?: string | null
          medium_path?: string | null
          member_id: string
          optimization_complete?: boolean | null
          original_path?: string | null
          original_url: string
          storage_bucket?: string | null
          storage_path?: string | null
          thumbnail_path?: string | null
          updated_at?: string
        }
        Update: {
          bioguide_id?: string
          congress_number?: number
          content_hash?: string | null
          created_at?: string
          download_attempts?: number | null
          downloaded_at?: string
          file_size?: number | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          large_path?: string | null
          last_error?: string | null
          local_path?: string | null
          medium_path?: string | null
          member_id?: string
          optimization_complete?: boolean | null
          original_path?: string | null
          original_url?: string
          storage_bucket?: string | null
          storage_path?: string | null
          thumbnail_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "congressional_photos_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      congressional_proceedings: {
        Row: {
          actual_date: string | null
          ai_summary: string | null
          committee_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          proceeding_number: string | null
          proceeding_status: string | null
          proceeding_type: string
          purpose: string | null
          related_document_id: string | null
          scheduled_date: string | null
          significance_score: number | null
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_date?: string | null
          ai_summary?: string | null
          committee_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          proceeding_number?: string | null
          proceeding_status?: string | null
          proceeding_type: string
          purpose?: string | null
          related_document_id?: string | null
          scheduled_date?: string | null
          significance_score?: number | null
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_date?: string | null
          ai_summary?: string | null
          committee_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          proceeding_number?: string | null
          proceeding_status?: string | null
          proceeding_type?: string
          purpose?: string | null
          related_document_id?: string | null
          scheduled_date?: string | null
          significance_score?: number | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "congressional_proceedings_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "congressional_committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congressional_proceedings_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "legislative_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      congressional_sessions: {
        Row: {
          congress_number: number
          created_at: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          session_number: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          congress_number: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          session_number: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          congress_number?: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          session_number?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      congressional_terms: {
        Row: {
          bioguide_id: string
          chamber: string
          congress_number: number
          created_at: string | null
          district: number | null
          end_year: number | null
          id: string
          is_current: boolean | null
          member_id: string
          member_type: string | null
          party_affiliation: string | null
          start_year: number
          state_code: string
          updated_at: string
        }
        Insert: {
          bioguide_id: string
          chamber: string
          congress_number: number
          created_at?: string | null
          district?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean | null
          member_id: string
          member_type?: string | null
          party_affiliation?: string | null
          start_year: number
          state_code: string
          updated_at?: string
        }
        Update: {
          bioguide_id?: string
          chamber?: string
          congress_number?: number
          created_at?: string | null
          district?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean | null
          member_id?: string
          member_type?: string | null
          party_affiliation?: string | null
          start_year?: number
          state_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "congressional_terms_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      congressional_votes: {
        Row: {
          chamber: string
          congress_api_id: string
          congress_number: number
          controversy_score: number | null
          created_at: string | null
          description: string | null
          id: string
          party_line_vote: boolean | null
          question: string
          related_amendment_id: string | null
          related_bill_id: string | null
          result: string
          session_number: number
          updated_at: string | null
          vote_count_no: number | null
          vote_count_not_voting: number | null
          vote_count_present: number | null
          vote_count_yes: number | null
          vote_date: string
          vote_number: number
          vote_type: string
        }
        Insert: {
          chamber: string
          congress_api_id: string
          congress_number: number
          controversy_score?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          party_line_vote?: boolean | null
          question: string
          related_amendment_id?: string | null
          related_bill_id?: string | null
          result: string
          session_number: number
          updated_at?: string | null
          vote_count_no?: number | null
          vote_count_not_voting?: number | null
          vote_count_present?: number | null
          vote_count_yes?: number | null
          vote_date: string
          vote_number: number
          vote_type: string
        }
        Update: {
          chamber?: string
          congress_api_id?: string
          congress_number?: number
          controversy_score?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          party_line_vote?: boolean | null
          question?: string
          related_amendment_id?: string | null
          related_bill_id?: string | null
          result?: string
          session_number?: number
          updated_at?: string | null
          vote_count_no?: number | null
          vote_count_not_voting?: number | null
          vote_count_present?: number | null
          vote_count_yes?: number | null
          vote_date?: string
          vote_number?: number
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "congressional_votes_related_bill_id_fkey"
            columns: ["related_bill_id"]
            isOneToOne: false
            referencedRelation: "congressional_bills"
            referencedColumns: ["id"]
          },
        ]
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
      content_gaps_analysis: {
        Row: {
          addressed_at: string | null
          addressed_by: string | null
          analysis_method: string | null
          confidence_score: number
          created_at: string | null
          description: string
          discovered_at: string | null
          discovered_by: string | null
          evidence: Json
          gap_type: string
          id: string
          impact_potential: number | null
          missing_categories: string[] | null
          missing_themes: string[] | null
          priority_level: string
          status: string | null
          suggested_research: Json
          time_period_end: number | null
          time_period_start: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          addressed_at?: string | null
          addressed_by?: string | null
          analysis_method?: string | null
          confidence_score?: number
          created_at?: string | null
          description: string
          discovered_at?: string | null
          discovered_by?: string | null
          evidence?: Json
          gap_type: string
          id?: string
          impact_potential?: number | null
          missing_categories?: string[] | null
          missing_themes?: string[] | null
          priority_level?: string
          status?: string | null
          suggested_research?: Json
          time_period_end?: number | null
          time_period_start?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          addressed_at?: string | null
          addressed_by?: string | null
          analysis_method?: string | null
          confidence_score?: number
          created_at?: string | null
          description?: string
          discovered_at?: string | null
          discovered_by?: string | null
          evidence?: Json
          gap_type?: string
          id?: string
          impact_potential?: number | null
          missing_categories?: string[] | null
          missing_themes?: string[] | null
          priority_level?: string
          status?: string | null
          suggested_research?: Json
          time_period_end?: number | null
          time_period_start?: number | null
          title?: string
          updated_at?: string | null
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
          ai_model: string | null
          civic_relevance_score: number | null
          content_types: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          generation_config: Json | null
          generation_method: string | null
          id: string
          package_name: string
          published_at: string | null
          published_content: Json | null
          quality_scores: Json | null
          source_article_id: string | null
          source_domain: string | null
          source_headline: string | null
          source_url: string | null
          status: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_model?: string | null
          civic_relevance_score?: number | null
          content_types?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_config?: Json | null
          generation_method?: string | null
          id?: string
          package_name: string
          published_at?: string | null
          published_content?: Json | null
          quality_scores?: Json | null
          source_article_id?: string | null
          source_domain?: string | null
          source_headline?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_model?: string | null
          civic_relevance_score?: number | null
          content_types?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_config?: Json | null
          generation_method?: string | null
          id?: string
          package_name?: string
          published_at?: string | null
          published_content?: Json | null
          quality_scores?: Json | null
          source_article_id?: string | null
          source_domain?: string | null
          source_headline?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
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
        Relationships: []
      }
      content_recommendations: {
        Row: {
          clicked_at: string | null
          clicked_by_user: boolean | null
          completed_at: string | null
          completed_by_user: boolean | null
          content_id: string
          content_title: string
          content_type: string
          created_at: string | null
          expires_at: string | null
          feedback_at: string | null
          generated_at: string | null
          id: string
          reasoning_factors: Json | null
          recommendation_engine_version: string | null
          recommendation_score: number
          recommendation_type: string
          shown_at: string | null
          shown_to_user: boolean | null
          user_feedback: number | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          clicked_by_user?: boolean | null
          completed_at?: string | null
          completed_by_user?: boolean | null
          content_id: string
          content_title: string
          content_type: string
          created_at?: string | null
          expires_at?: string | null
          feedback_at?: string | null
          generated_at?: string | null
          id?: string
          reasoning_factors?: Json | null
          recommendation_engine_version?: string | null
          recommendation_score: number
          recommendation_type: string
          shown_at?: string | null
          shown_to_user?: boolean | null
          user_feedback?: number | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          clicked_by_user?: boolean | null
          completed_at?: string | null
          completed_by_user?: boolean | null
          content_id?: string
          content_title?: string
          content_type?: string
          created_at?: string | null
          expires_at?: string | null
          feedback_at?: string | null
          generated_at?: string | null
          id?: string
          reasoning_factors?: Json | null
          recommendation_engine_version?: string | null
          recommendation_score?: number
          recommendation_type?: string
          shown_at?: string | null
          shown_to_user?: boolean | null
          user_feedback?: number | null
          user_id?: string | null
        }
        Relationships: []
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
      content_reviews: {
        Row: {
          completion_context: Json | null
          content_id: string
          content_title: string
          content_type: string
          created_at: string
          helpful_count: number
          id: string
          is_flagged: boolean
          is_public: boolean
          is_verified_reviewer: boolean
          moderator_notes: string | null
          not_helpful_count: number
          rating: number
          review_text: string | null
          reviewer_expertise_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_context?: Json | null
          content_id: string
          content_title: string
          content_type: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_flagged?: boolean
          is_public?: boolean
          is_verified_reviewer?: boolean
          moderator_notes?: string | null
          not_helpful_count?: number
          rating: number
          review_text?: string | null
          reviewer_expertise_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_context?: Json | null
          content_id?: string
          content_title?: string
          content_type?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_flagged?: boolean
          is_public?: boolean
          is_verified_reviewer?: boolean
          moderator_notes?: string | null
          not_helpful_count?: number
          rating?: number
          review_text?: string | null
          reviewer_expertise_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_reviewer_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "reviewer_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      custom_collection_items: {
        Row: {
          added_at: string
          added_by: string | null
          average_time_seconds: number | null
          collection_id: string
          correct_rate: number | null
          custom_question_data: Json | null
          id: string
          is_required: boolean | null
          notes: string | null
          points_value: number | null
          position: number
          question_id: string | null
          section_name: string | null
          skip_rate: number | null
          time_limit_seconds: number | null
          times_answered: number | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          average_time_seconds?: number | null
          collection_id: string
          correct_rate?: number | null
          custom_question_data?: Json | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          points_value?: number | null
          position: number
          question_id?: string | null
          section_name?: string | null
          skip_rate?: number | null
          time_limit_seconds?: number | null
          times_answered?: number | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          average_time_seconds?: number | null
          collection_id?: string
          correct_rate?: number | null
          custom_question_data?: Json | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          points_value?: number | null
          position?: number
          question_id?: string | null
          section_name?: string | null
          skip_rate?: number | null
          time_limit_seconds?: number | null
          times_answered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "custom_content_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "discoverable_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "public_collections_with_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_collection_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "custom_collection_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "custom_collection_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "custom_collection_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_collection_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
          },
        ]
      }
      custom_content_collections: {
        Row: {
          ai_generation_id: string | null
          allow_remixing: boolean | null
          average_completion_time_seconds: number | null
          average_score: number | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          created_by_ai: boolean | null
          creation_method: string | null
          description: string | null
          difficulty_level: string | null
          emoji: string | null
          engagement_score: number | null
          estimated_duration_minutes: number | null
          id: string
          is_collaborative: boolean | null
          language: string | null
          last_played_at: string | null
          metadata: Json | null
          owner_id: string
          password_hash: string | null
          published_at: string | null
          question_count: number | null
          requires_premium: boolean | null
          slug: string | null
          status: string
          tags: string[] | null
          title: string
          topic_areas: string[] | null
          total_completions: number | null
          total_plays: number | null
          unique_players: number | null
          updated_at: string
          visibility: string
        }
        Insert: {
          ai_generation_id?: string | null
          allow_remixing?: boolean | null
          average_completion_time_seconds?: number | null
          average_score?: number | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          created_by_ai?: boolean | null
          creation_method?: string | null
          description?: string | null
          difficulty_level?: string | null
          emoji?: string | null
          engagement_score?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_collaborative?: boolean | null
          language?: string | null
          last_played_at?: string | null
          metadata?: Json | null
          owner_id: string
          password_hash?: string | null
          published_at?: string | null
          question_count?: number | null
          requires_premium?: boolean | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          title: string
          topic_areas?: string[] | null
          total_completions?: number | null
          total_plays?: number | null
          unique_players?: number | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          ai_generation_id?: string | null
          allow_remixing?: boolean | null
          average_completion_time_seconds?: number | null
          average_score?: number | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          created_by_ai?: boolean | null
          creation_method?: string | null
          description?: string | null
          difficulty_level?: string | null
          emoji?: string | null
          engagement_score?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_collaborative?: boolean | null
          language?: string | null
          last_played_at?: string | null
          metadata?: Json | null
          owner_id?: string
          password_hash?: string | null
          published_at?: string | null
          question_count?: number | null
          requires_premium?: boolean | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          topic_areas?: string[] | null
          total_completions?: number | null
          total_plays?: number | null
          unique_players?: number | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_content_collections_ai_generation_id_fkey"
            columns: ["ai_generation_id"]
            isOneToOne: false
            referencedRelation: "custom_content_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_content_generations: {
        Row: {
          average_credibility: number | null
          civic_standards_score: number | null
          completed_at: string | null
          content: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          fact_check_status: string | null
          generated_at: string | null
          generated_content: Json | null
          generation_completed_at: string | null
          generation_metadata: Json | null
          generation_settings: Json
          generation_started_at: string | null
          guest_token: string | null
          id: string
          is_premium: boolean | null
          is_premium_generation: boolean | null
          is_preview: boolean | null
          is_preview_only: boolean | null
          is_published: boolean | null
          metadata: Json | null
          names_specific_institutions: boolean | null
          premium_features_used: Json | null
          provides_action_steps: boolean | null
          published_at: string | null
          quality_score: number | null
          question_count: number | null
          questions: Json | null
          reveals_uncomfortable_truths: boolean | null
          source_credibility_average: number | null
          status: string | null
          topic: string
          topic_id: string | null
          total_sources: number | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          average_credibility?: number | null
          civic_standards_score?: number | null
          completed_at?: string | null
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          fact_check_status?: string | null
          generated_at?: string | null
          generated_content?: Json | null
          generation_completed_at?: string | null
          generation_metadata?: Json | null
          generation_settings?: Json
          generation_started_at?: string | null
          guest_token?: string | null
          id?: string
          is_premium?: boolean | null
          is_premium_generation?: boolean | null
          is_preview?: boolean | null
          is_preview_only?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          names_specific_institutions?: boolean | null
          premium_features_used?: Json | null
          provides_action_steps?: boolean | null
          published_at?: string | null
          quality_score?: number | null
          question_count?: number | null
          questions?: Json | null
          reveals_uncomfortable_truths?: boolean | null
          source_credibility_average?: number | null
          status?: string | null
          topic: string
          topic_id?: string | null
          total_sources?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          average_credibility?: number | null
          civic_standards_score?: number | null
          completed_at?: string | null
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          fact_check_status?: string | null
          generated_at?: string | null
          generated_content?: Json | null
          generation_completed_at?: string | null
          generation_metadata?: Json | null
          generation_settings?: Json
          generation_started_at?: string | null
          guest_token?: string | null
          id?: string
          is_premium?: boolean | null
          is_premium_generation?: boolean | null
          is_preview?: boolean | null
          is_preview_only?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          names_specific_institutions?: boolean | null
          premium_features_used?: Json | null
          provides_action_steps?: boolean | null
          published_at?: string | null
          quality_score?: number | null
          question_count?: number | null
          questions?: Json | null
          reveals_uncomfortable_truths?: boolean | null
          source_credibility_average?: number | null
          status?: string | null
          topic?: string
          topic_id?: string | null
          total_sources?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      custom_content_questions: {
        Row: {
          action_steps: Json | null
          category: string | null
          civic_relevance_score: number | null
          correct_answer: string
          created_at: string
          difficulty: string | null
          explanation: string | null
          fact_check_status: string | null
          generation_id: string | null
          id: string
          is_active: boolean | null
          options: Json | null
          power_dynamics_revealed: string[] | null
          question_order: number
          question_text: string
          question_type: string | null
          sources: Json | null
          tags: string[] | null
          uncomfortable_truths: string[] | null
          updated_at: string
        }
        Insert: {
          action_steps?: Json | null
          category?: string | null
          civic_relevance_score?: number | null
          correct_answer: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          fact_check_status?: string | null
          generation_id?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json | null
          power_dynamics_revealed?: string[] | null
          question_order: number
          question_text: string
          question_type?: string | null
          sources?: Json | null
          tags?: string[] | null
          uncomfortable_truths?: string[] | null
          updated_at?: string
        }
        Update: {
          action_steps?: Json | null
          category?: string | null
          civic_relevance_score?: number | null
          correct_answer?: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          fact_check_status?: string | null
          generation_id?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json | null
          power_dynamics_revealed?: string[] | null
          question_order?: number
          question_text?: string
          question_type?: string | null
          sources?: Json | null
          tags?: string[] | null
          uncomfortable_truths?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_content_questions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "custom_content_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_content_topics: {
        Row: {
          actionability_score: number | null
          average_score: number | null
          category_name: string | null
          civic_standards_passed: boolean | null
          completion_rate: number | null
          created_at: string
          created_by: string | null
          created_by_user: string | null
          creator_display_name: string | null
          date: string | null
          difficulty_level: string | null
          estimated_time_minutes: number | null
          generation_id: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          is_public: boolean | null
          moderation_notes: string | null
          moderation_status: string | null
          play_count: number | null
          published_at: string | null
          topic_description: string | null
          topic_emoji: string | null
          topic_id: string
          topic_title: string
          uncomfortable_truths_score: number | null
          updated_at: string
          updated_by: string | null
          user_ratings: Json | null
        }
        Insert: {
          actionability_score?: number | null
          average_score?: number | null
          category_name?: string | null
          civic_standards_passed?: boolean | null
          completion_rate?: number | null
          created_at?: string
          created_by?: string | null
          created_by_user?: string | null
          creator_display_name?: string | null
          date?: string | null
          difficulty_level?: string | null
          estimated_time_minutes?: number | null
          generation_id?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          moderation_notes?: string | null
          moderation_status?: string | null
          play_count?: number | null
          published_at?: string | null
          topic_description?: string | null
          topic_emoji?: string | null
          topic_id: string
          topic_title: string
          uncomfortable_truths_score?: number | null
          updated_at?: string
          updated_by?: string | null
          user_ratings?: Json | null
        }
        Update: {
          actionability_score?: number | null
          average_score?: number | null
          category_name?: string | null
          civic_standards_passed?: boolean | null
          completion_rate?: number | null
          created_at?: string
          created_by?: string | null
          created_by_user?: string | null
          creator_display_name?: string | null
          date?: string | null
          difficulty_level?: string | null
          estimated_time_minutes?: number | null
          generation_id?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_public?: boolean | null
          moderation_notes?: string | null
          moderation_status?: string | null
          play_count?: number | null
          published_at?: string | null
          topic_description?: string | null
          topic_emoji?: string | null
          topic_id?: string
          topic_title?: string
          uncomfortable_truths_score?: number | null
          updated_at?: string
          updated_by?: string | null
          user_ratings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_content_topics_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "custom_content_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to: Json
          code: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          source_id: string | null
          source_type: string | null
          updated_at: string | null
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to?: Json
          code: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          source_id?: string | null
          source_type?: string | null
          updated_at?: string | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to?: Json
          code?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          source_id?: string | null
          source_type?: string | null
          updated_at?: string | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      document_actions: {
        Row: {
          action_code: string | null
          action_date: string
          action_text: string
          action_type: string | null
          ai_interpretation: string | null
          chamber: string | null
          committee_id: string | null
          created_at: string | null
          document_id: string
          id: string
          significance_score: number | null
          updated_at: string | null
        }
        Insert: {
          action_code?: string | null
          action_date: string
          action_text: string
          action_type?: string | null
          ai_interpretation?: string | null
          chamber?: string | null
          committee_id?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          significance_score?: number | null
          updated_at?: string | null
        }
        Update: {
          action_code?: string | null
          action_date?: string
          action_text?: string
          action_type?: string | null
          ai_interpretation?: string | null
          chamber?: string | null
          committee_id?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          significance_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_actions_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "congressional_committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_actions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legislative_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_relationships: {
        Row: {
          created_at: string | null
          id: string
          relationship_description: string | null
          relationship_type: string
          source_document_id: string
          target_document_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_description?: string | null
          relationship_type: string
          source_document_id: string
          target_document_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_description?: string | null
          relationship_type?: string
          source_document_id?: string
          target_document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relationships_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "legislative_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relationships_target_document_id_fkey"
            columns: ["target_document_id"]
            isOneToOne: false
            referencedRelation: "legislative_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sources: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          last_sync_at: string | null
          source_id: string
          source_metadata: Json | null
          source_system: string
          source_url: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          last_sync_at?: string | null
          source_id: string
          source_metadata?: Json | null
          source_system: string
          source_url?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          last_sync_at?: string | null
          source_id?: string
          source_metadata?: Json | null
          source_system?: string
          source_url?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_sources_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legislative_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_subjects: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          is_primary_subject: boolean | null
          subject_category: string | null
          subject_name: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          is_primary_subject?: boolean | null
          subject_category?: string | null
          subject_name: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          is_primary_subject?: boolean | null
          subject_category?: string | null
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_subjects_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legislative_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      election_info: {
        Row: {
          ballot_info: Json | null
          candidates: Json | null
          created_at: string | null
          data_source: string | null
          election_date: string
          election_id: string
          election_name: string
          election_type: string | null
          id: string
          is_active: boolean | null
          jurisdiction: string | null
          last_synced: string | null
          ocd_ids: Json | null
          state: string | null
          updated_at: string | null
          voting_locations: Json | null
        }
        Insert: {
          ballot_info?: Json | null
          candidates?: Json | null
          created_at?: string | null
          data_source?: string | null
          election_date: string
          election_id: string
          election_name: string
          election_type?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string | null
          last_synced?: string | null
          ocd_ids?: Json | null
          state?: string | null
          updated_at?: string | null
          voting_locations?: Json | null
        }
        Update: {
          ballot_info?: Json | null
          candidates?: Json | null
          created_at?: string | null
          data_source?: string | null
          election_date?: string
          election_id?: string
          election_name?: string
          election_type?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string | null
          last_synced?: string | null
          ocd_ids?: Json | null
          state?: string | null
          updated_at?: string | null
          voting_locations?: Json | null
        }
        Relationships: []
      }
      event_research_suggestions: {
        Row: {
          admin_notes: string | null
          ai_context: string | null
          confidence_score: number | null
          id: string
          potential_date: string | null
          processed_at: string | null
          processed_by: string | null
          rejected_reason: string | null
          research_query: string
          research_result_id: string | null
          research_status: string | null
          resulting_event_topic_id: string | null
          significance_estimate: number | null
          suggested_at: string | null
          suggested_by_ai: boolean | null
          suggested_title: string
        }
        Insert: {
          admin_notes?: string | null
          ai_context?: string | null
          confidence_score?: number | null
          id?: string
          potential_date?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejected_reason?: string | null
          research_query: string
          research_result_id?: string | null
          research_status?: string | null
          resulting_event_topic_id?: string | null
          significance_estimate?: number | null
          suggested_at?: string | null
          suggested_by_ai?: boolean | null
          suggested_title: string
        }
        Update: {
          admin_notes?: string | null
          ai_context?: string | null
          confidence_score?: number | null
          id?: string
          potential_date?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejected_reason?: string | null
          research_query?: string
          research_result_id?: string | null
          research_status?: string | null
          resulting_event_topic_id?: string | null
          significance_estimate?: number | null
          suggested_at?: string | null
          suggested_by_ai?: boolean | null
          suggested_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_research_suggestions_research_result_id_fkey"
            columns: ["research_result_id"]
            isOneToOne: false
            referencedRelation: "ai_research_results"
            referencedColumns: ["id"]
          },
        ]
      }
      event_timeline_connections: {
        Row: {
          created_at: string | null
          created_by: string | null
          explanation: string | null
          from_event_topic_id: string
          id: string
          relationship_type: string
          time_gap_days: number | null
          to_event_topic_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          explanation?: string | null
          from_event_topic_id: string
          id?: string
          relationship_type: string
          time_gap_days?: number | null
          to_event_topic_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          explanation?: string | null
          from_event_topic_id?: string
          id?: string
          relationship_type?: string
          time_gap_days?: number | null
          to_event_topic_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          ai_generated: boolean | null
          categories: string[] | null
          civic_relevance_score: number | null
          content_generation_status: string | null
          content_package_id: string | null
          content_warnings: string[] | null
          created_at: string | null
          date: string
          description: string
          event_type: string | null
          fact_check_status: string | null
          geographic_scope: string | null
          id: string | null
          impact_summary: string | null
          is_active: boolean | null
          is_featured: boolean | null
          key_figures: string[] | null
          last_fact_checked: string | null
          long_term_consequences: string | null
          news_source_url: string | null
          quiz_potential: Json | null
          related_organizations: string[] | null
          reliability_score: number | null
          research_quality_score: number | null
          significance_level: number | null
          source_type: string | null
          sources: Json | null
          tags: string[] | null
          topic_id: string
          topic_title: string
          updated_at: string | null
          why_this_matters: string
        }
        Insert: {
          ai_generated?: boolean | null
          categories?: string[] | null
          civic_relevance_score?: number | null
          content_generation_status?: string | null
          content_package_id?: string | null
          content_warnings?: string[] | null
          created_at?: string | null
          date: string
          description: string
          event_type?: string | null
          fact_check_status?: string | null
          geographic_scope?: string | null
          id?: string | null
          impact_summary?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          key_figures?: string[] | null
          last_fact_checked?: string | null
          long_term_consequences?: string | null
          news_source_url?: string | null
          quiz_potential?: Json | null
          related_organizations?: string[] | null
          reliability_score?: number | null
          research_quality_score?: number | null
          significance_level?: number | null
          source_type?: string | null
          sources?: Json | null
          tags?: string[] | null
          topic_id: string
          topic_title: string
          updated_at?: string | null
          why_this_matters: string
        }
        Update: {
          ai_generated?: boolean | null
          categories?: string[] | null
          civic_relevance_score?: number | null
          content_generation_status?: string | null
          content_package_id?: string | null
          content_warnings?: string[] | null
          created_at?: string | null
          date?: string
          description?: string
          event_type?: string | null
          fact_check_status?: string | null
          geographic_scope?: string | null
          id?: string | null
          impact_summary?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          key_figures?: string[] | null
          last_fact_checked?: string | null
          long_term_consequences?: string | null
          news_source_url?: string | null
          quiz_potential?: Json | null
          related_organizations?: string[] | null
          reliability_score?: number | null
          research_quality_score?: number | null
          significance_level?: number | null
          source_type?: string | null
          sources?: Json | null
          tags?: string[] | null
          topic_id?: string
          topic_title?: string
          updated_at?: string | null
          why_this_matters?: string
        }
        Relationships: []
      }
      extracted_entities: {
        Row: {
          context_description: string | null
          created_at: string | null
          entity_description: string | null
          entity_name: string
          entity_type: string
          extraction_confidence: number | null
          id: string
          linked_organization_id: string | null
          linked_public_figure_id: string | null
          source_entity_id: string
          source_entity_type: string
          source_text_excerpt: string | null
          updated_at: string | null
        }
        Insert: {
          context_description?: string | null
          created_at?: string | null
          entity_description?: string | null
          entity_name: string
          entity_type: string
          extraction_confidence?: number | null
          id?: string
          linked_organization_id?: string | null
          linked_public_figure_id?: string | null
          source_entity_id: string
          source_entity_type: string
          source_text_excerpt?: string | null
          updated_at?: string | null
        }
        Update: {
          context_description?: string | null
          created_at?: string | null
          entity_description?: string | null
          entity_name?: string
          entity_type?: string
          extraction_confidence?: number | null
          id?: string
          linked_organization_id?: string | null
          linked_public_figure_id?: string | null
          source_entity_id?: string
          source_entity_type?: string
          source_text_excerpt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extracted_entities_linked_public_figure_id_fkey"
            columns: ["linked_public_figure_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_relationships: {
        Row: {
          created_at: string | null
          extraction_confidence: number | null
          human_verified: boolean | null
          id: string
          object_entity_id: string
          relationship_description: string | null
          relationship_type: string
          source_entity_id: string
          source_entity_type: string
          subject_entity_id: string
          updated_at: string | null
          verification_date: string | null
        }
        Insert: {
          created_at?: string | null
          extraction_confidence?: number | null
          human_verified?: boolean | null
          id?: string
          object_entity_id: string
          relationship_description?: string | null
          relationship_type: string
          source_entity_id: string
          source_entity_type: string
          subject_entity_id: string
          updated_at?: string | null
          verification_date?: string | null
        }
        Update: {
          created_at?: string | null
          extraction_confidence?: number | null
          human_verified?: boolean | null
          id?: string
          object_entity_id?: string
          relationship_description?: string | null
          relationship_type?: string
          source_entity_id?: string
          source_entity_type?: string
          subject_entity_id?: string
          updated_at?: string | null
          verification_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extracted_relationships_object_entity_id_fkey"
            columns: ["object_entity_id"]
            isOneToOne: false
            referencedRelation: "extracted_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_relationships_subject_entity_id_fkey"
            columns: ["subject_entity_id"]
            isOneToOne: false
            referencedRelation: "extracted_entities"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "fact_check_logs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
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
      knowledge_connections: {
        Row: {
          admin_notes: string | null
          confidence_score: number | null
          connection_strength: number
          connection_type: string
          created_at: string | null
          discovered_by_ai: boolean | null
          discovery_method: string | null
          evidence_sources: Json | null
          explanation: string
          historical_precedent: string | null
          human_verified: boolean | null
          id: string
          research_session_id: string | null
          source_content_id: string
          source_content_type: string
          source_title: string | null
          target_content_id: string
          target_content_type: string
          target_title: string | null
          updated_at: string | null
          usage_count: number | null
          used_in_explanations: boolean | null
          used_in_questions: boolean | null
        }
        Insert: {
          admin_notes?: string | null
          confidence_score?: number | null
          connection_strength?: number
          connection_type: string
          created_at?: string | null
          discovered_by_ai?: boolean | null
          discovery_method?: string | null
          evidence_sources?: Json | null
          explanation: string
          historical_precedent?: string | null
          human_verified?: boolean | null
          id?: string
          research_session_id?: string | null
          source_content_id: string
          source_content_type: string
          source_title?: string | null
          target_content_id: string
          target_content_type: string
          target_title?: string | null
          updated_at?: string | null
          usage_count?: number | null
          used_in_explanations?: boolean | null
          used_in_questions?: boolean | null
        }
        Update: {
          admin_notes?: string | null
          confidence_score?: number | null
          connection_strength?: number
          connection_type?: string
          created_at?: string | null
          discovered_by_ai?: boolean | null
          discovery_method?: string | null
          evidence_sources?: Json | null
          explanation?: string
          historical_precedent?: string | null
          human_verified?: boolean | null
          id?: string
          research_session_id?: string | null
          source_content_id?: string
          source_content_type?: string
          source_title?: string | null
          target_content_id?: string
          target_content_type?: string
          target_title?: string | null
          updated_at?: string | null
          usage_count?: number | null
          used_in_explanations?: boolean | null
          used_in_questions?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_connections_research_session_id_fkey"
            columns: ["research_session_id"]
            isOneToOne: false
            referencedRelation: "ai_research_sessions"
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
      legislative_documents: {
        Row: {
          ai_summary: string | null
          chamber: string | null
          civic_impact_score: number | null
          complexity_score: number | null
          congress_number: number | null
          content_quality_score: number | null
          created_at: string | null
          current_status: string | null
          document_number: string
          document_type: string
          full_text: string | null
          has_placeholder_content: boolean | null
          id: string
          introduced_date: string | null
          last_action_date: string | null
          last_action_text: string | null
          official_title: string | null
          primary_sponsor_id: string | null
          short_title: string | null
          summary_text: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          chamber?: string | null
          civic_impact_score?: number | null
          complexity_score?: number | null
          congress_number?: number | null
          content_quality_score?: number | null
          created_at?: string | null
          current_status?: string | null
          document_number: string
          document_type: string
          full_text?: string | null
          has_placeholder_content?: boolean | null
          id?: string
          introduced_date?: string | null
          last_action_date?: string | null
          last_action_text?: string | null
          official_title?: string | null
          primary_sponsor_id?: string | null
          short_title?: string | null
          summary_text?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          chamber?: string | null
          civic_impact_score?: number | null
          complexity_score?: number | null
          congress_number?: number | null
          content_quality_score?: number | null
          created_at?: string | null
          current_status?: string | null
          document_number?: string
          document_type?: string
          full_text?: string | null
          has_placeholder_content?: boolean | null
          id?: string
          introduced_date?: string | null
          last_action_date?: string | null
          last_action_text?: string | null
          official_title?: string | null
          primary_sponsor_id?: string | null
          short_title?: string | null
          summary_text?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legislative_documents_primary_sponsor_id_fkey"
            columns: ["primary_sponsor_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_steps: {
        Row: {
          alt_text: string | null
          audio_url: string | null
          auto_advance_seconds: number | null
          can_skip: boolean | null
          collection_item_id: string
          completion_criteria: Json | null
          content: string
          created_at: string
          estimated_duration_minutes: number | null
          estimated_seconds: number | null
          id: string
          image_url: string | null
          interaction_config: Json | null
          key_concepts: Json | null
          media_type: string | null
          media_url: string | null
          next_step_id: string | null
          prerequisites: Json | null
          requires_interaction: boolean | null
          skip_conditions: Json | null
          sources: Json | null
          step_number: number
          step_type: string
          title: string | null
          transcript: string | null
          translations: Json | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          alt_text?: string | null
          audio_url?: string | null
          auto_advance_seconds?: number | null
          can_skip?: boolean | null
          collection_item_id: string
          completion_criteria?: Json | null
          content: string
          created_at?: string
          estimated_duration_minutes?: number | null
          estimated_seconds?: number | null
          id?: string
          image_url?: string | null
          interaction_config?: Json | null
          key_concepts?: Json | null
          media_type?: string | null
          media_url?: string | null
          next_step_id?: string | null
          prerequisites?: Json | null
          requires_interaction?: boolean | null
          skip_conditions?: Json | null
          sources?: Json | null
          step_number: number
          step_type: string
          title?: string | null
          transcript?: string | null
          translations?: Json | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          alt_text?: string | null
          audio_url?: string | null
          auto_advance_seconds?: number | null
          can_skip?: boolean | null
          collection_item_id?: string
          completion_criteria?: Json | null
          content?: string
          created_at?: string
          estimated_duration_minutes?: number | null
          estimated_seconds?: number | null
          id?: string
          image_url?: string | null
          interaction_config?: Json | null
          key_concepts?: Json | null
          media_type?: string | null
          media_url?: string | null
          next_step_id?: string | null
          prerequisites?: Json | null
          requires_interaction?: boolean | null
          skip_conditions?: Json | null
          sources?: Json | null
          step_number?: number
          step_type?: string
          title?: string | null
          transcript?: string | null
          translations?: Json | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_steps_collection_item_id_fkey"
            columns: ["collection_item_id"]
            isOneToOne: false
            referencedRelation: "collection_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_steps_collection_item_id_fkey"
            columns: ["collection_item_id"]
            isOneToOne: false
            referencedRelation: "lesson_structure"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_steps_next_step_id_fkey"
            columns: ["next_step_id"]
            isOneToOne: false
            referencedRelation: "lesson_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      location_coverage: {
        Row: {
          coverage_level: Json
          created_at: string | null
          id: string
          last_updated: string | null
          location_hash: string
          needs_attention: boolean | null
        }
        Insert: {
          coverage_level?: Json
          created_at?: string | null
          id?: string
          last_updated?: string | null
          location_hash: string
          needs_attention?: boolean | null
        }
        Update: {
          coverage_level?: Json
          created_at?: string | null
          id?: string
          last_updated?: string | null
          location_hash?: string
          needs_attention?: boolean | null
        }
        Relationships: []
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
      member_votes: {
        Row: {
          created_at: string | null
          id: string
          member_id: string
          vote_cast: string
          vote_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id: string
          vote_cast: string
          vote_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string
          vote_cast?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_votes_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "congressional_votes"
            referencedColumns: ["id"]
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
      notification_campaigns: {
        Row: {
          action_url: string | null
          campaign_name: string
          campaign_type: string
          civic_action_steps: Json | null
          civic_urgency_level: number | null
          clicked_count: number | null
          conversion_count: number | null
          created_at: string | null
          created_by: string | null
          deep_link: string | null
          delivered_count: number | null
          id: string
          message: string
          opened_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          target_providers: Json | null
          target_segments: Json | null
          target_user_ids: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          campaign_name: string
          campaign_type: string
          civic_action_steps?: Json | null
          civic_urgency_level?: number | null
          clicked_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          created_by?: string | null
          deep_link?: string | null
          delivered_count?: number | null
          id?: string
          message: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_providers?: Json | null
          target_segments?: Json | null
          target_user_ids?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          campaign_name?: string
          campaign_type?: string
          civic_action_steps?: Json | null
          civic_urgency_level?: number | null
          clicked_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          created_by?: string | null
          deep_link?: string | null
          delivered_count?: number | null
          id?: string
          message?: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_providers?: Json | null
          target_segments?: Json | null
          target_user_ids?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          campaign_id: string | null
          civic_action_taken: string | null
          civic_context: Json | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          external_notification_id: string | null
          id: string
          provider_id: string | null
          provider_response: Json | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          civic_action_taken?: string | null
          civic_context?: Json | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          external_notification_id?: string | null
          id?: string
          provider_id?: string | null
          provider_response?: Json | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          civic_action_taken?: string | null
          civic_context?: Json | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          external_notification_id?: string | null
          id?: string
          provider_id?: string | null
          provider_response?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "civic_engagement_impact"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "notification_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "notification_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_providers: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          provider_name: string
          provider_type: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider_name: string
          provider_type: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider_name?: string
          provider_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_segments: {
        Row: {
          calculated_user_count: number | null
          civic_category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          segment_name: string
          targeting_rules: Json
          updated_at: string | null
        }
        Insert: {
          calculated_user_count?: number | null
          civic_category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          segment_name: string
          targeting_rules?: Json
          updated_at?: string | null
        }
        Update: {
          calculated_user_count?: number | null
          civic_category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          segment_name?: string
          targeting_rules?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          civic_focus: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          message_template: string
          provider_specific_config: Json | null
          template_name: string
          template_type: string
          title_template: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          civic_focus?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template: string
          provider_specific_config?: Json | null
          template_name: string
          template_type: string
          title_template: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          civic_focus?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string
          provider_specific_config?: Json | null
          template_name?: string
          template_type?: string
          title_template?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
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
      og_data_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          og_data: Json
          original_url: string
          url_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          og_data?: Json
          original_url: string
          url_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          og_data?: Json
          original_url?: string
          url_hash?: string
        }
        Relationships: []
      }
      onboarding_invites: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          invite_code: string
          invitee_id: string | null
          inviter_id: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_code: string
          invitee_id?: string | null
          inviter_id: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          invitee_id?: string | null
          inviter_id?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: []
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
      pod_analytics_log: {
        Row: {
          created_at: string | null
          operation: string | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          operation?: string | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          operation?: string | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      proceeding_exchanges: {
        Row: {
          created_at: string | null
          exchange_timestamp: string | null
          id: string
          proceeding_id: string
          question_text: string
          questioner_id: string | null
          respondent_id: string | null
          response_text: string | null
          reveals_uncomfortable_truth: boolean | null
          significance_score: number | null
          topic_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exchange_timestamp?: string | null
          id?: string
          proceeding_id: string
          question_text: string
          questioner_id?: string | null
          respondent_id?: string | null
          response_text?: string | null
          reveals_uncomfortable_truth?: boolean | null
          significance_score?: number | null
          topic_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exchange_timestamp?: string | null
          id?: string
          proceeding_id?: string
          question_text?: string
          questioner_id?: string | null
          respondent_id?: string | null
          response_text?: string | null
          reveals_uncomfortable_truth?: boolean | null
          significance_score?: number | null
          topic_tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proceeding_exchanges_proceeding_id_fkey"
            columns: ["proceeding_id"]
            isOneToOne: false
            referencedRelation: "congressional_proceedings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proceeding_exchanges_questioner_id_fkey"
            columns: ["questioner_id"]
            isOneToOne: false
            referencedRelation: "proceeding_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proceeding_exchanges_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "proceeding_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      proceeding_participants: {
        Row: {
          bias_analysis: Json | null
          created_at: string | null
          credibility_score: number | null
          id: string
          participant_id: string | null
          participant_name: string
          participant_organization: string | null
          participant_title: string | null
          participation_type: string
          prepared_statement_url: string | null
          proceeding_id: string
          testimony_text: string | null
          updated_at: string | null
        }
        Insert: {
          bias_analysis?: Json | null
          created_at?: string | null
          credibility_score?: number | null
          id?: string
          participant_id?: string | null
          participant_name: string
          participant_organization?: string | null
          participant_title?: string | null
          participation_type: string
          prepared_statement_url?: string | null
          proceeding_id: string
          testimony_text?: string | null
          updated_at?: string | null
        }
        Update: {
          bias_analysis?: Json | null
          created_at?: string | null
          credibility_score?: number | null
          id?: string
          participant_id?: string | null
          participant_name?: string
          participant_organization?: string | null
          participant_title?: string | null
          participation_type?: string
          prepared_statement_url?: string | null
          proceeding_id?: string
          testimony_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proceeding_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "public_figures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proceeding_participants_proceeding_id_fkey"
            columns: ["proceeding_id"]
            isOneToOne: false
            referencedRelation: "congressional_proceedings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          achievement_badges: Json | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          display_name: string | null
          engagement_level: string | null
          focus_areas: string[] | null
          full_name: string | null
          high_contrast_mode: boolean | null
          id: string
          is_admin: boolean | null
          location: string | null
          preferred_language: string | null
          preferred_pod_personality: string | null
          role: string | null
          sensory_friendly_mode: boolean | null
          state_province: string | null
          total_achievements: number | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          achievement_badges?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          display_name?: string | null
          engagement_level?: string | null
          focus_areas?: string[] | null
          full_name?: string | null
          high_contrast_mode?: boolean | null
          id: string
          is_admin?: boolean | null
          location?: string | null
          preferred_language?: string | null
          preferred_pod_personality?: string | null
          role?: string | null
          sensory_friendly_mode?: boolean | null
          state_province?: string | null
          total_achievements?: number | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          achievement_badges?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          display_name?: string | null
          engagement_level?: string | null
          focus_areas?: string[] | null
          full_name?: string | null
          high_contrast_mode?: boolean | null
          id?: string
          is_admin?: boolean | null
          location?: string | null
          preferred_language?: string | null
          preferred_pod_personality?: string | null
          role?: string | null
          sensory_friendly_mode?: boolean | null
          state_province?: string | null
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
          {
            foreignKeyName: "progress_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
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
          session_type: string | null
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
          session_type?: string | null
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
          session_type?: string | null
          started_at?: string
          streak?: number
          test_type?: string | null
          topic_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_figures: {
        Row: {
          bills_sponsored: number | null
          bio: string | null
          bioguide_id: string | null
          birth_state: string | null
          birth_year: number | null
          book_publications: string[] | null
          career_highlights: string[] | null
          civicsense_priority: number | null
          committee_memberships: string[] | null
          congress_api_last_sync: string | null
          congress_member_type: string | null
          congressional_tenure_end: string | null
          congressional_tenure_start: string | null
          content_difficulty_level: number | null
          content_review_status: string | null
          created_at: string | null
          current_district: number | null
          current_positions: string[] | null
          current_residence_state: string | null
          current_state: string | null
          date_of_birth: string | null
          description: string | null
          display_name: string | null
          education_background: string | null
          fact_check_status: string | null
          financial_interests: string[] | null
          full_name: string
          gender: string | null
          id: string
          image_url: string | null
          influence_level: number | null
          is_active: boolean | null
          is_politician: boolean | null
          key_policies_supported: string[] | null
          key_positions: string[] | null
          key_votes: Json | null
          last_quiz_topic_generated: string | null
          major_speeches: Json | null
          media_appearances_count: number | null
          net_worth_estimate: number | null
          notable_controversies: string[] | null
          office: string | null
          official_photo_url: string | null
          official_website: string | null
          party_affiliation: string | null
          photo_last_updated: string | null
          photo_source: string | null
          policy_flip_flops: Json | null
          primary_role_category: string | null
          quotable_statements: string[] | null
          region: string | null
          scandals_timeline: Json | null
          slug: string
          social_media: Json | null
          social_media_handles: Json | null
          sources: Json | null
          trump_relationship_type: string | null
          updated_at: string | null
          voting_record_url: string | null
        }
        Insert: {
          bills_sponsored?: number | null
          bio?: string | null
          bioguide_id?: string | null
          birth_state?: string | null
          birth_year?: number | null
          book_publications?: string[] | null
          career_highlights?: string[] | null
          civicsense_priority?: number | null
          committee_memberships?: string[] | null
          congress_api_last_sync?: string | null
          congress_member_type?: string | null
          congressional_tenure_end?: string | null
          congressional_tenure_start?: string | null
          content_difficulty_level?: number | null
          content_review_status?: string | null
          created_at?: string | null
          current_district?: number | null
          current_positions?: string[] | null
          current_residence_state?: string | null
          current_state?: string | null
          date_of_birth?: string | null
          description?: string | null
          display_name?: string | null
          education_background?: string | null
          fact_check_status?: string | null
          financial_interests?: string[] | null
          full_name: string
          gender?: string | null
          id?: string
          image_url?: string | null
          influence_level?: number | null
          is_active?: boolean | null
          is_politician?: boolean | null
          key_policies_supported?: string[] | null
          key_positions?: string[] | null
          key_votes?: Json | null
          last_quiz_topic_generated?: string | null
          major_speeches?: Json | null
          media_appearances_count?: number | null
          net_worth_estimate?: number | null
          notable_controversies?: string[] | null
          office?: string | null
          official_photo_url?: string | null
          official_website?: string | null
          party_affiliation?: string | null
          photo_last_updated?: string | null
          photo_source?: string | null
          policy_flip_flops?: Json | null
          primary_role_category?: string | null
          quotable_statements?: string[] | null
          region?: string | null
          scandals_timeline?: Json | null
          slug: string
          social_media?: Json | null
          social_media_handles?: Json | null
          sources?: Json | null
          trump_relationship_type?: string | null
          updated_at?: string | null
          voting_record_url?: string | null
        }
        Update: {
          bills_sponsored?: number | null
          bio?: string | null
          bioguide_id?: string | null
          birth_state?: string | null
          birth_year?: number | null
          book_publications?: string[] | null
          career_highlights?: string[] | null
          civicsense_priority?: number | null
          committee_memberships?: string[] | null
          congress_api_last_sync?: string | null
          congress_member_type?: string | null
          congressional_tenure_end?: string | null
          congressional_tenure_start?: string | null
          content_difficulty_level?: number | null
          content_review_status?: string | null
          created_at?: string | null
          current_district?: number | null
          current_positions?: string[] | null
          current_residence_state?: string | null
          current_state?: string | null
          date_of_birth?: string | null
          description?: string | null
          display_name?: string | null
          education_background?: string | null
          fact_check_status?: string | null
          financial_interests?: string[] | null
          full_name?: string
          gender?: string | null
          id?: string
          image_url?: string | null
          influence_level?: number | null
          is_active?: boolean | null
          is_politician?: boolean | null
          key_policies_supported?: string[] | null
          key_positions?: string[] | null
          key_votes?: Json | null
          last_quiz_topic_generated?: string | null
          major_speeches?: Json | null
          media_appearances_count?: number | null
          net_worth_estimate?: number | null
          notable_controversies?: string[] | null
          office?: string | null
          official_photo_url?: string | null
          official_website?: string | null
          party_affiliation?: string | null
          photo_last_updated?: string | null
          photo_source?: string | null
          policy_flip_flops?: Json | null
          primary_role_category?: string | null
          quotable_statements?: string[] | null
          region?: string | null
          scandals_timeline?: Json | null
          slug?: string
          social_media?: Json | null
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
      question_event_connections: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_text: string | null
          event_topic_id: string
          id: string
          question_id: string
          sort_order: number | null
          usage_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_text?: string | null
          event_topic_id: string
          id?: string
          question_id: string
          sort_order?: number | null
          usage_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_text?: string | null
          event_topic_id?: string
          id?: string
          question_id?: string
          sort_order?: number | null
          usage_type?: string
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
          {
            foreignKeyName: "question_feedback_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
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
            foreignKeyName: "question_skills_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
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
            foreignKeyName: "question_source_links_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
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
          {
            foreignKeyName: "question_topic_categories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_few_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_topic_categories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["topic_internal_id"]
          },
          {
            foreignKeyName: "question_topic_categories_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_without_questions"
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
          difficulty_level: string | null
          emoji: string
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_breaking: boolean | null
          is_featured: boolean | null
          key_takeaways: Json | null
          related_figures: Json | null
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
          difficulty_level?: string | null
          emoji: string
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_breaking?: boolean | null
          is_featured?: boolean | null
          key_takeaways?: Json | null
          related_figures?: Json | null
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
          difficulty_level?: string | null
          emoji?: string
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_breaking?: boolean | null
          is_featured?: boolean | null
          key_takeaways?: Json | null
          related_figures?: Json | null
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
          text: string | null
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
          text?: string | null
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
          text?: string | null
          topic_id?: string
          translations?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
      raffle_entries: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          entry_number: number
          id: string
          is_valid: boolean | null
          is_winner: boolean | null
          prize_claimed: boolean | null
          prize_claimed_at: string | null
          prize_description: string | null
          prize_tier: number | null
          survey_incentive_id: string | null
          survey_response_id: string | null
          ticket_code: string | null
          user_id: string | null
          validation_notes: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          entry_number: number
          id?: string
          is_valid?: boolean | null
          is_winner?: boolean | null
          prize_claimed?: boolean | null
          prize_claimed_at?: string | null
          prize_description?: string | null
          prize_tier?: number | null
          survey_incentive_id?: string | null
          survey_response_id?: string | null
          ticket_code?: string | null
          user_id?: string | null
          validation_notes?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          entry_number?: number
          id?: string
          is_valid?: boolean | null
          is_winner?: boolean | null
          prize_claimed?: boolean | null
          prize_claimed_at?: string | null
          prize_description?: string | null
          prize_tier?: number | null
          survey_incentive_id?: string | null
          survey_response_id?: string | null
          ticket_code?: string | null
          user_id?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffle_entries_survey_incentive_id_fkey"
            columns: ["survey_incentive_id"]
            isOneToOne: false
            referencedRelation: "survey_incentives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_entries_survey_response_id_fkey"
            columns: ["survey_response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_content_mapping: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          last_action_date: string | null
          relevance_reason: string | null
          relevance_score: number | null
          representative_id: string | null
          title: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          last_action_date?: string | null
          relevance_reason?: string | null
          relevance_score?: number | null
          representative_id?: string | null
          title?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          last_action_date?: string | null
          relevance_reason?: string | null
          relevance_score?: number | null
          representative_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_content_mapping_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "user_representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      research_validation: {
        Row: {
          content_id: string
          content_type: string
          content_updated: boolean | null
          corrections_made: Json | null
          created_at: string | null
          evidence_checked: Json | null
          fact_check_results: Json | null
          flagged_for_review: boolean | null
          id: string
          is_valid: boolean | null
          issues_found: string[] | null
          recommendations: string[] | null
          sources_verified: Json | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string
          validation_criteria: Json | null
          validation_method: string | null
          validation_score: number | null
          validation_type: string
        }
        Insert: {
          content_id: string
          content_type: string
          content_updated?: boolean | null
          corrections_made?: Json | null
          created_at?: string | null
          evidence_checked?: Json | null
          fact_check_results?: Json | null
          flagged_for_review?: boolean | null
          id?: string
          is_valid?: boolean | null
          issues_found?: string[] | null
          recommendations?: string[] | null
          sources_verified?: Json | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by: string
          validation_criteria?: Json | null
          validation_method?: string | null
          validation_score?: number | null
          validation_type: string
        }
        Update: {
          content_id?: string
          content_type?: string
          content_updated?: boolean | null
          corrections_made?: Json | null
          created_at?: string | null
          evidence_checked?: Json | null
          fact_check_results?: Json | null
          flagged_for_review?: boolean | null
          id?: string
          is_valid?: boolean | null
          issues_found?: string[] | null
          recommendations?: string[] | null
          sources_verified?: Json | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string
          validation_criteria?: Json | null
          validation_method?: string | null
          validation_score?: number | null
          validation_type?: string
        }
        Relationships: []
      }
      review_analytics: {
        Row: {
          average_rating: number
          average_review_length: number | null
          completion_satisfaction_score: number | null
          content_id: string
          content_type: string
          created_at: string
          difficulty_feedback: Json
          id: string
          improvement_areas: string[] | null
          period_end: string
          period_start: string
          positive_themes: string[] | null
          reviews_with_text_percentage: number | null
          total_reviews: number
        }
        Insert: {
          average_rating?: number
          average_review_length?: number | null
          completion_satisfaction_score?: number | null
          content_id: string
          content_type: string
          created_at?: string
          difficulty_feedback?: Json
          id?: string
          improvement_areas?: string[] | null
          period_end: string
          period_start: string
          positive_themes?: string[] | null
          reviews_with_text_percentage?: number | null
          total_reviews?: number
        }
        Update: {
          average_rating?: number
          average_review_length?: number | null
          completion_satisfaction_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          difficulty_feedback?: Json
          id?: string
          improvement_areas?: string[] | null
          period_end?: string
          period_start?: string
          positive_themes?: string[] | null
          reviews_with_text_percentage?: number | null
          total_reviews?: number
        }
        Relationships: []
      }
      review_flags: {
        Row: {
          created_at: string
          flag_description: string | null
          flag_reason: string
          flagged_by: string
          id: string
          moderator_notes: string | null
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          flag_description?: string | null
          flag_reason: string
          flagged_by: string
          id?: string
          moderator_notes?: string | null
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          flag_description?: string | null
          flag_reason?: string
          flagged_by?: string
          id?: string
          moderator_notes?: string | null
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "content_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_with_reviewer"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpfulness_votes: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfulness_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "content_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpfulness_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_with_reviewer"
            referencedColumns: ["id"]
          },
        ]
      }
      review_summaries: {
        Row: {
          average_rating: number
          content_id: string
          content_type: string
          id: string
          last_updated: string
          rating_distribution: Json
          sentiment_summary: Json | null
          total_reviews: number
        }
        Insert: {
          average_rating?: number
          content_id: string
          content_type: string
          id?: string
          last_updated?: string
          rating_distribution?: Json
          sentiment_summary?: Json | null
          total_reviews?: number
        }
        Update: {
          average_rating?: number
          content_id?: string
          content_type?: string
          id?: string
          last_updated?: string
          rating_distribution?: Json
          sentiment_summary?: Json | null
          total_reviews?: number
        }
        Relationships: []
      }
      reviewer_profiles: {
        Row: {
          avatar_url: string | null
          average_review_quality_score: number
          bio: string | null
          civic_engagement_score: number
          created_at: string
          display_name: string | null
          expertise_areas: string[]
          helpful_votes_received: number
          id: string
          is_verified: boolean
          review_count: number
          updated_at: string
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_review_quality_score?: number
          bio?: string | null
          civic_engagement_score?: number
          created_at?: string
          display_name?: string | null
          expertise_areas?: string[]
          helpful_votes_received?: number
          id?: string
          is_verified?: boolean
          review_count?: number
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_review_quality_score?: number
          bio?: string | null
          civic_engagement_score?: number
          created_at?: string
          display_name?: string | null
          expertise_areas?: string[]
          helpful_votes_received?: number
          id?: string
          is_verified?: boolean
          review_count?: number
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      reward_fulfillments: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          fulfilled_at: string | null
          fulfillment_details: Json | null
          fulfillment_method: string | null
          id: string
          notification_sent: boolean | null
          notification_sent_at: string | null
          processed_by: string | null
          reward_data: Json
          reward_type: string
          status: string | null
          survey_incentive_id: string | null
          survey_response_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          fulfilled_at?: string | null
          fulfillment_details?: Json | null
          fulfillment_method?: string | null
          id?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          processed_by?: string | null
          reward_data: Json
          reward_type: string
          status?: string | null
          survey_incentive_id?: string | null
          survey_response_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          fulfilled_at?: string | null
          fulfillment_details?: Json | null
          fulfillment_method?: string | null
          id?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          processed_by?: string | null
          reward_data?: Json
          reward_type?: string
          status?: string | null
          survey_incentive_id?: string | null
          survey_response_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_fulfillments_survey_incentive_id_fkey"
            columns: ["survey_incentive_id"]
            isOneToOne: false
            referencedRelation: "survey_incentives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_fulfillments_survey_response_id_fkey"
            columns: ["survey_response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
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
      search_analytics_daily: {
        Row: {
          abandoned_searches: number | null
          analytics_date: string
          avg_results_per_search: number | null
          avg_searches_per_user: number | null
          avg_time_to_selection_ms: number | null
          created_at: string | null
          device_breakdown: Json | null
          id: string
          platform_breakdown: Json | null
          search_success_rate: number | null
          searches_with_results: number | null
          searches_with_selection: number | null
          top_search_terms: Json | null
          top_selected_content: Json | null
          total_searches: number | null
          unique_searchers: number | null
          updated_at: string | null
          user_segment: string | null
          zero_result_searches: number | null
        }
        Insert: {
          abandoned_searches?: number | null
          analytics_date: string
          avg_results_per_search?: number | null
          avg_searches_per_user?: number | null
          avg_time_to_selection_ms?: number | null
          created_at?: string | null
          device_breakdown?: Json | null
          id?: string
          platform_breakdown?: Json | null
          search_success_rate?: number | null
          searches_with_results?: number | null
          searches_with_selection?: number | null
          top_search_terms?: Json | null
          top_selected_content?: Json | null
          total_searches?: number | null
          unique_searchers?: number | null
          updated_at?: string | null
          user_segment?: string | null
          zero_result_searches?: number | null
        }
        Update: {
          abandoned_searches?: number | null
          analytics_date?: string
          avg_results_per_search?: number | null
          avg_searches_per_user?: number | null
          avg_time_to_selection_ms?: number | null
          created_at?: string | null
          device_breakdown?: Json | null
          id?: string
          platform_breakdown?: Json | null
          search_success_rate?: number | null
          searches_with_results?: number | null
          searches_with_selection?: number | null
          top_search_terms?: Json | null
          top_selected_content?: Json | null
          total_searches?: number | null
          unique_searchers?: number | null
          updated_at?: string | null
          user_segment?: string | null
          zero_result_searches?: number | null
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
      source_analysis_cache: {
        Row: {
          ai_insights: Json | null
          analysis_data: Json
          analyzed_at: string
          bias_rating: string
          created_at: string
          credibility_score: number
          domain: string
          expires_at: string
          factual_rating: string
          id: string
          original_url: string
          source_metadata: Json | null
          url_hash: string
        }
        Insert: {
          ai_insights?: Json | null
          analysis_data?: Json
          analyzed_at?: string
          bias_rating: string
          created_at?: string
          credibility_score: number
          domain: string
          expires_at: string
          factual_rating: string
          id?: string
          original_url: string
          source_metadata?: Json | null
          url_hash: string
        }
        Update: {
          ai_insights?: Json | null
          analysis_data?: Json
          analyzed_at?: string
          bias_rating?: string
          created_at?: string
          credibility_score?: number
          domain?: string
          expires_at?: string
          factual_rating?: string
          id?: string
          original_url?: string
          source_metadata?: Json | null
          url_hash?: string
        }
        Relationships: []
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
          date_specific: string | null
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
          translations: Json | null
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
          date_specific?: string | null
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
          translations?: Json | null
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
          date_specific?: string | null
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
          translations?: Json | null
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
      step_analytics: {
        Row: {
          avg_time_spent_seconds: number | null
          cards_viewed_avg: number | null
          completions: number | null
          confusing_percentage: number | null
          created_at: string | null
          date: string
          helpful_percentage: number | null
          id: string
          interaction_rate: number | null
          lesson_step_id: string
          quiz_correct_rate: number | null
          skip_rate: number | null
          time_to_reveal_avg: number | null
          views: number | null
        }
        Insert: {
          avg_time_spent_seconds?: number | null
          cards_viewed_avg?: number | null
          completions?: number | null
          confusing_percentage?: number | null
          created_at?: string | null
          date?: string
          helpful_percentage?: number | null
          id?: string
          interaction_rate?: number | null
          lesson_step_id: string
          quiz_correct_rate?: number | null
          skip_rate?: number | null
          time_to_reveal_avg?: number | null
          views?: number | null
        }
        Update: {
          avg_time_spent_seconds?: number | null
          cards_viewed_avg?: number | null
          completions?: number | null
          confusing_percentage?: number | null
          created_at?: string | null
          date?: string
          helpful_percentage?: number | null
          id?: string
          interaction_rate?: number | null
          lesson_step_id?: string
          quiz_correct_rate?: number | null
          skip_rate?: number | null
          time_to_reveal_avg?: number | null
          views?: number | null
        }
        Relationships: []
      }
      step_templates: {
        Row: {
          content_placeholders: Json | null
          created_at: string | null
          default_interaction_config: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          step_type: string
        }
        Insert: {
          content_placeholders?: Json | null
          created_at?: string | null
          default_interaction_config?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          step_type: string
        }
        Update: {
          content_placeholders?: Json | null
          created_at?: string | null
          default_interaction_config?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          step_type?: string
        }
        Relationships: []
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
      survey_incentives: {
        Row: {
          authenticated_only: boolean | null
          completion_required: boolean | null
          created_at: string | null
          created_by: string | null
          credits_config: Json | null
          description: string | null
          discount_config: Json | null
          enabled: boolean | null
          id: string
          incentive_types: Json
          max_rewards: number | null
          premium_config: Json | null
          raffle_config: Json | null
          rewards_given: number | null
          show_on_completion: boolean | null
          show_on_start: boolean | null
          show_progress_reminder: boolean | null
          survey_id: string | null
          title: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          authenticated_only?: boolean | null
          completion_required?: boolean | null
          created_at?: string | null
          created_by?: string | null
          credits_config?: Json | null
          description?: string | null
          discount_config?: Json | null
          enabled?: boolean | null
          id?: string
          incentive_types?: Json
          max_rewards?: number | null
          premium_config?: Json | null
          raffle_config?: Json | null
          rewards_given?: number | null
          show_on_completion?: boolean | null
          show_on_start?: boolean | null
          show_progress_reminder?: boolean | null
          survey_id?: string | null
          title: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          authenticated_only?: boolean | null
          completion_required?: boolean | null
          created_at?: string | null
          created_by?: string | null
          credits_config?: Json | null
          description?: string | null
          discount_config?: Json | null
          enabled?: boolean | null
          id?: string
          incentive_types?: Json
          max_rewards?: number | null
          premium_config?: Json | null
          raffle_config?: Json | null
          rewards_given?: number | null
          show_on_completion?: boolean | null
          show_on_start?: boolean | null
          show_progress_reminder?: boolean | null
          survey_id?: string | null
          title?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_incentives_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_incentives_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
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
          {
            foreignKeyName: "fk_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
          },
        ]
      }
      topic_event_connections: {
        Row: {
          connection_strength: number | null
          connection_type: string
          context_notes: string | null
          created_at: string | null
          created_by: string | null
          display_priority: number | null
          event_topic_id: string
          id: string
          topic_id: string
          used_in_explanations: boolean | null
          used_in_questions: boolean | null
        }
        Insert: {
          connection_strength?: number | null
          connection_type: string
          context_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          display_priority?: number | null
          event_topic_id: string
          id?: string
          topic_id: string
          used_in_explanations?: boolean | null
          used_in_questions?: boolean | null
        }
        Update: {
          connection_strength?: number | null
          connection_type?: string
          context_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          display_priority?: number | null
          event_topic_id?: string
          id?: string
          topic_id?: string
          used_in_explanations?: boolean | null
          used_in_questions?: boolean | null
        }
        Relationships: []
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
      trending_searches: {
        Row: {
          category: string | null
          created_at: string
          id: string
          language: string | null
          last_searched_at: string | null
          search_count: number | null
          search_query: string
          updated_at: string
          user_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          language?: string | null
          last_searched_at?: string | null
          search_count?: number | null
          search_query: string
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          language?: string | null
          last_searched_at?: string | null
          search_count?: number | null
          search_query?: string
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      url_health_status: {
        Row: {
          average_response_time: number
          blacklist_date: string | null
          blacklist_reason: string | null
          created_at: string
          domain: string
          failure_count: number
          id: string
          is_blacklisted: boolean
          last_failure: string | null
          last_status_code: number | null
          last_success: string | null
          reliability_score: number
          success_count: number
          total_checks: number
          updated_at: string
          url: string
        }
        Insert: {
          average_response_time?: number
          blacklist_date?: string | null
          blacklist_reason?: string | null
          created_at?: string
          domain: string
          failure_count?: number
          id?: string
          is_blacklisted?: boolean
          last_failure?: string | null
          last_status_code?: number | null
          last_success?: string | null
          reliability_score?: number
          success_count?: number
          total_checks?: number
          updated_at?: string
          url: string
        }
        Update: {
          average_response_time?: number
          blacklist_date?: string | null
          blacklist_reason?: string | null
          created_at?: string
          domain?: string
          failure_count?: number
          id?: string
          is_blacklisted?: boolean
          last_failure?: string | null
          last_status_code?: number | null
          last_success?: string | null
          reliability_score?: number
          success_count?: number
          total_checks?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      url_validation_cache: {
        Row: {
          content_type: string | null
          created_at: string
          domain: string
          error_message: string | null
          http_status: number | null
          id: string
          is_broken_link: boolean
          is_valid: boolean
          last_checked: string
          page_title: string | null
          redirect_url: string | null
          response_time: number
          updated_at: string
          url: string
          validation_score: number
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          domain: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          is_broken_link?: boolean
          is_valid?: boolean
          last_checked?: string
          page_title?: string | null
          redirect_url?: string | null
          response_time?: number
          updated_at?: string
          url: string
          validation_score?: number
        }
        Update: {
          content_type?: string | null
          created_at?: string
          domain?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          is_broken_link?: boolean
          is_valid?: boolean
          last_checked?: string
          page_title?: string | null
          redirect_url?: string | null
          response_time?: number
          updated_at?: string
          url?: string
          validation_score?: number
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
      user_assessment_analytics: {
        Row: {
          created_at: string | null
          event_type: string | null
          final_score: number | null
          id: number
          metadata: Json | null
          session_id: string | null
          timestamp: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          final_score?: number | null
          id?: number
          metadata?: Json | null
          session_id?: string | null
          timestamp?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          final_score?: number | null
          id?: number
          metadata?: Json | null
          session_id?: string | null
          timestamp?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      user_assessment_engagement: {
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
      user_assessment_questions: {
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
      user_assessment_scoring: {
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
        Relationships: []
      }
      user_content_annotations: {
        Row: {
          content_id: string
          content_title: string
          content_type: string
          created_at: string
          follow_up_questions: string[] | null
          how_it_applies: string | null
          id: string
          key_insights: string[] | null
          last_accessed_at: string | null
          personal_notes: string | null
          personal_rating: number | null
          personal_tags: string[] | null
          reading_progress: number | null
          times_accessed: number | null
          updated_at: string
          user_id: string
          why_saved: string | null
        }
        Insert: {
          content_id: string
          content_title: string
          content_type: string
          created_at?: string
          follow_up_questions?: string[] | null
          how_it_applies?: string | null
          id?: string
          key_insights?: string[] | null
          last_accessed_at?: string | null
          personal_notes?: string | null
          personal_rating?: number | null
          personal_tags?: string[] | null
          reading_progress?: number | null
          times_accessed?: number | null
          updated_at?: string
          user_id: string
          why_saved?: string | null
        }
        Update: {
          content_id?: string
          content_title?: string
          content_type?: string
          created_at?: string
          follow_up_questions?: string[] | null
          how_it_applies?: string | null
          id?: string
          key_insights?: string[] | null
          last_accessed_at?: string | null
          personal_notes?: string | null
          personal_rating?: number | null
          personal_tags?: string[] | null
          reading_progress?: number | null
          times_accessed?: number | null
          updated_at?: string
          user_id?: string
          why_saved?: string | null
        }
        Relationships: []
      }
      user_content_connections: {
        Row: {
          connection_note: string | null
          connection_type: string
          created_at: string
          from_content_id: string
          from_content_type: string
          id: string
          strength: number | null
          to_content_id: string
          to_content_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_note?: string | null
          connection_type?: string
          created_at?: string
          from_content_id: string
          from_content_type: string
          id?: string
          strength?: number | null
          to_content_id: string
          to_content_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_note?: string | null
          connection_type?: string
          created_at?: string
          from_content_id?: string
          from_content_type?: string
          id?: string
          strength?: number | null
          to_content_id?: string
          to_content_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_content_views: {
        Row: {
          app_version: string | null
          completed_at: string | null
          content_id: string
          content_slug: string | null
          content_title: string
          content_type: string
          created_at: string | null
          device_type: string | null
          first_viewed_at: string | null
          guest_token: string | null
          id: string
          interactions_count: number | null
          last_viewed_at: string | null
          platform: string | null
          progress_percentage: number | null
          quiz_score: number | null
          referrer_id: string | null
          referrer_type: string | null
          return_visits: number | null
          scroll_depth_percentage: number | null
          session_id: string
          started_at: string | null
          time_to_first_interaction_ms: number | null
          updated_at: string | null
          user_id: string | null
          view_duration_seconds: number | null
        }
        Insert: {
          app_version?: string | null
          completed_at?: string | null
          content_id: string
          content_slug?: string | null
          content_title: string
          content_type: string
          created_at?: string | null
          device_type?: string | null
          first_viewed_at?: string | null
          guest_token?: string | null
          id?: string
          interactions_count?: number | null
          last_viewed_at?: string | null
          platform?: string | null
          progress_percentage?: number | null
          quiz_score?: number | null
          referrer_id?: string | null
          referrer_type?: string | null
          return_visits?: number | null
          scroll_depth_percentage?: number | null
          session_id: string
          started_at?: string | null
          time_to_first_interaction_ms?: number | null
          updated_at?: string | null
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Update: {
          app_version?: string | null
          completed_at?: string | null
          content_id?: string
          content_slug?: string | null
          content_title?: string
          content_type?: string
          created_at?: string | null
          device_type?: string | null
          first_viewed_at?: string | null
          guest_token?: string | null
          id?: string
          interactions_count?: number | null
          last_viewed_at?: string | null
          platform?: string | null
          progress_percentage?: number | null
          quiz_score?: number | null
          referrer_id?: string | null
          referrer_type?: string | null
          return_visits?: number | null
          scroll_depth_percentage?: number | null
          session_id?: string
          started_at?: string | null
          time_to_first_interaction_ms?: number | null
          updated_at?: string | null
          user_id?: string | null
          view_duration_seconds?: number | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          amount: number
          created_at: string | null
          credit_type: string
          currency: string | null
          expires_at: string | null
          id: string
          redeemed_at: string | null
          redeemed_for: string | null
          redemption_details: Json | null
          source_description: string | null
          source_id: string | null
          source_type: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          credit_type?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          redeemed_for?: string | null
          redemption_details?: Json | null
          source_description?: string | null
          source_id?: string | null
          source_type: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          credit_type?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          redeemed_for?: string | null
          redemption_details?: Json | null
          source_description?: string | null
          source_id?: string | null
          source_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
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
            foreignKeyName: "user_deck_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
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
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_few_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_deck_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_translation_coverage_summary"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      user_discount_usage: {
        Row: {
          discount_amount: number | null
          discount_code_id: string | null
          final_amount: number | null
          id: string
          order_id: string | null
          original_amount: number | null
          survey_response_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          discount_amount?: number | null
          discount_code_id?: string | null
          final_amount?: number | null
          id?: string
          order_id?: string | null
          original_amount?: number | null
          survey_response_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          discount_amount?: number | null
          discount_code_id?: string | null
          final_amount?: number | null
          id?: string
          order_id?: string | null
          original_amount?: number | null
          survey_response_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_discount_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_discount_usage_survey_response_id_fkey"
            columns: ["survey_response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_election_tracking: {
        Row: {
          civic_education_completed: boolean | null
          created_at: string | null
          election_id: string | null
          id: string
          is_registered: boolean | null
          reminder_sent: boolean | null
          researched_candidates: boolean | null
          updated_at: string | null
          user_id: string | null
          viewed_ballot_info: boolean | null
          voted: boolean | null
          voting_location_id: string | null
          voting_method: string | null
          wants_reminders: boolean | null
        }
        Insert: {
          civic_education_completed?: boolean | null
          created_at?: string | null
          election_id?: string | null
          id?: string
          is_registered?: boolean | null
          reminder_sent?: boolean | null
          researched_candidates?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          viewed_ballot_info?: boolean | null
          voted?: boolean | null
          voting_location_id?: string | null
          voting_method?: string | null
          wants_reminders?: boolean | null
        }
        Update: {
          civic_education_completed?: boolean | null
          created_at?: string | null
          election_id?: string | null
          id?: string
          is_registered?: boolean | null
          reminder_sent?: boolean | null
          researched_candidates?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          viewed_ballot_info?: boolean | null
          voted?: boolean | null
          voting_location_id?: string | null
          voting_method?: string | null
          wants_reminders?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_election_tracking_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "election_info"
            referencedColumns: ["id"]
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
      user_generation_usage: {
        Row: {
          created_at: string
          free_generation_limit: number | null
          free_generations_used: number | null
          guest_token: string | null
          has_used_free_trial: boolean | null
          id: string
          last_reset_at: string | null
          premium_generations_used: number | null
          subscription_status: string | null
          total_generations: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          free_generation_limit?: number | null
          free_generations_used?: number | null
          guest_token?: string | null
          has_used_free_trial?: boolean | null
          id?: string
          last_reset_at?: string | null
          premium_generations_used?: number | null
          subscription_status?: string | null
          total_generations?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          free_generation_limit?: number | null
          free_generations_used?: number | null
          guest_token?: string | null
          has_used_free_trial?: boolean | null
          id?: string
          last_reset_at?: string | null
          premium_generations_used?: number | null
          subscription_status?: string | null
          total_generations?: number | null
          updated_at?: string
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
      user_learning_patterns: {
        Row: {
          analysis_date: string | null
          avg_quiz_score: number | null
          avg_searches_per_session: number | null
          avoided_content_types: string[] | null
          completion_rate: number | null
          created_at: string | null
          id: string
          last_calculated_at: string | null
          learning_streak_days: number | null
          peak_activity_days: number[] | null
          peak_activity_hours: number[] | null
          preferred_categories: string[] | null
          preferred_content_types: string[] | null
          preferred_difficulty_levels: string[] | null
          preferred_session_length_minutes: number | null
          recommended_content_ids: string[] | null
          retention_score: number | null
          search_success_rate: number | null
          top_search_terms: string[] | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_date?: string | null
          avg_quiz_score?: number | null
          avg_searches_per_session?: number | null
          avoided_content_types?: string[] | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          learning_streak_days?: number | null
          peak_activity_days?: number[] | null
          peak_activity_hours?: number[] | null
          preferred_categories?: string[] | null
          preferred_content_types?: string[] | null
          preferred_difficulty_levels?: string[] | null
          preferred_session_length_minutes?: number | null
          recommended_content_ids?: string[] | null
          retention_score?: number | null
          search_success_rate?: number | null
          top_search_terms?: string[] | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_date?: string | null
          avg_quiz_score?: number | null
          avg_searches_per_session?: number | null
          avoided_content_types?: string[] | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          learning_streak_days?: number | null
          peak_activity_days?: number[] | null
          peak_activity_hours?: number[] | null
          preferred_categories?: string[] | null
          preferred_content_types?: string[] | null
          preferred_difficulty_levels?: string[] | null
          preferred_session_length_minutes?: number | null
          recommended_content_ids?: string[] | null
          retention_score?: number | null
          search_success_rate?: number | null
          top_search_terms?: string[] | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          formatted_address: string
          id: string
          is_primary: boolean | null
          label: string | null
          latitude: number | null
          location_hash: string | null
          longitude: number | null
          postal_code: string | null
          state: string | null
          street_address: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          formatted_address: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          latitude?: number | null
          location_hash?: string | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          formatted_address?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          latitude?: number | null
          location_hash?: string | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_subscriptions: {
        Row: {
          civic_tags: Json | null
          created_at: string | null
          external_user_id: string | null
          id: string
          is_subscribed: boolean | null
          last_activity_at: string | null
          provider_id: string | null
          subscription_data: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          civic_tags?: Json | null
          created_at?: string | null
          external_user_id?: string | null
          id?: string
          is_subscribed?: boolean | null
          last_activity_at?: string | null
          provider_id?: string | null
          subscription_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          civic_tags?: Json | null
          created_at?: string | null
          external_user_id?: string | null
          id?: string
          is_subscribed?: boolean | null
          last_activity_at?: string | null
          provider_id?: string | null
          subscription_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "notification_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_state: {
        Row: {
          completed_at: string | null
          completed_steps: string[] | null
          created_at: string | null
          current_step: string
          id: string
          is_completed: boolean | null
          last_active_at: string | null
          onboarding_data: Json | null
          skip_reason: string | null
          skipped_at: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string
          id?: string
          is_completed?: boolean | null
          last_active_at?: string | null
          onboarding_data?: Json | null
          skip_reason?: string | null
          skipped_at?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string
          id?: string
          is_completed?: boolean | null
          last_active_at?: string | null
          onboarding_data?: Json | null
          skip_reason?: string | null
          skipped_at?: string | null
          started_at?: string | null
          status?: string | null
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
          average_response_time: number | null
          consecutive_correct: number | null
          ease_factor: number | null
          easiness_factor: number | null
          id: string
          interval_days: number | null
          last_attempt_date: string | null
          last_confidence_level: number | null
          last_reviewed_at: string | null
          mastery_level: number | null
          next_review_date: string | null
          question_id: string
          repetition_count: number | null
          review_interval: number | null
          total_attempts: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_response_time?: number | null
          consecutive_correct?: number | null
          ease_factor?: number | null
          easiness_factor?: number | null
          id?: string
          interval_days?: number | null
          last_attempt_date?: string | null
          last_confidence_level?: number | null
          last_reviewed_at?: string | null
          mastery_level?: number | null
          next_review_date?: string | null
          question_id: string
          repetition_count?: number | null
          review_interval?: number | null
          total_attempts?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_response_time?: number | null
          consecutive_correct?: number | null
          ease_factor?: number | null
          easiness_factor?: number | null
          id?: string
          interval_days?: number | null
          last_attempt_date?: string | null
          last_confidence_level?: number | null
          last_reviewed_at?: string | null
          mastery_level?: number | null
          next_review_date?: string | null
          question_id?: string
          repetition_count?: number | null
          review_interval?: number | null
          total_attempts?: number | null
          updated_at?: string | null
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
          {
            foreignKeyName: "user_question_memory_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
          },
        ]
      }
      user_question_responses: {
        Row: {
          assessment_type: string | null
          attempt_id: string
          confidence_level: number | null
          created_at: string | null
          hint_used: boolean | null
          id: string
          is_correct: boolean
          question_id: string
          response_time_ms: number | null
          selected_answer: string | null
          time_spent_seconds: number | null
          topic_id: string | null
          updated_at: string | null
          user_answer: string
          user_id: string | null
          was_review: boolean | null
        }
        Insert: {
          assessment_type?: string | null
          attempt_id: string
          confidence_level?: number | null
          created_at?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct: boolean
          question_id: string
          response_time_ms?: number | null
          selected_answer?: string | null
          time_spent_seconds?: number | null
          topic_id?: string | null
          updated_at?: string | null
          user_answer: string
          user_id?: string | null
          was_review?: boolean | null
        }
        Update: {
          assessment_type?: string | null
          attempt_id?: string
          confidence_level?: number | null
          created_at?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct?: boolean
          question_id?: string
          response_time_ms?: number | null
          selected_answer?: string | null
          time_spent_seconds?: number | null
          topic_id?: string | null
          updated_at?: string | null
          user_answer?: string
          user_id?: string | null
          was_review?: boolean | null
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
          {
            foreignKeyName: "user_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
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
          {
            foreignKeyName: "user_quiz_analytics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_few_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_quiz_analytics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_quiz_analytics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "user_quiz_analytics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_translation_coverage_summary"
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
          incorrect_answers: number | null
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
          user_id: string | null
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
          incorrect_answers?: number | null
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
          user_id?: string | null
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
          incorrect_answers?: number | null
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
          user_id?: string | null
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
      user_representatives: {
        Row: {
          created_at: string | null
          data_source: string
          district_name: string | null
          email: string | null
          id: string
          jurisdiction: string | null
          last_verified: string | null
          level: string
          name: string
          needs_manual_verification: boolean | null
          ocd_id: string | null
          office: string | null
          office_address: string | null
          party: string | null
          phone: string | null
          source_id: string | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          data_source: string
          district_name?: string | null
          email?: string | null
          id?: string
          jurisdiction?: string | null
          last_verified?: string | null
          level: string
          name: string
          needs_manual_verification?: boolean | null
          ocd_id?: string | null
          office?: string | null
          office_address?: string | null
          party?: string | null
          phone?: string | null
          source_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          data_source?: string
          district_name?: string | null
          email?: string | null
          id?: string
          jurisdiction?: string | null
          last_verified?: string | null
          level?: string
          name?: string
          needs_manual_verification?: boolean | null
          ocd_id?: string | null
          office?: string | null
          office_address?: string | null
          party?: string | null
          phone?: string | null
          source_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
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
      user_search_analytics: {
        Row: {
          created_at: string | null
          guest_token: string | null
          id: string
          results_count: number | null
          search_query: string
          search_timestamp: string | null
          search_type: string | null
          selected_result: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_token?: string | null
          id?: string
          results_count?: number | null
          search_query: string
          search_timestamp?: string | null
          search_type?: string | null
          selected_result?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_token?: string | null
          id?: string
          results_count?: number | null
          search_query?: string
          search_timestamp?: string | null
          search_type?: string | null
          selected_result?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_search_history: {
        Row: {
          app_version: string | null
          created_at: string | null
          device_type: string | null
          guest_token: string | null
          id: string
          platform: string | null
          result_selected: Json | null
          results_count: number | null
          results_preview: Json | null
          search_abandoned: boolean | null
          search_filters: Json | null
          search_query: string
          search_type: string | null
          searched_at: string | null
          session_id: string
          time_to_selection_ms: number | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          device_type?: string | null
          guest_token?: string | null
          id?: string
          platform?: string | null
          result_selected?: Json | null
          results_count?: number | null
          results_preview?: Json | null
          search_abandoned?: boolean | null
          search_filters?: Json | null
          search_query: string
          search_type?: string | null
          searched_at?: string | null
          session_id: string
          time_to_selection_ms?: number | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          device_type?: string | null
          guest_token?: string | null
          id?: string
          platform?: string | null
          result_selected?: Json | null
          results_count?: number | null
          results_preview?: Json | null
          search_abandoned?: boolean | null
          search_filters?: Json | null
          search_query?: string
          search_type?: string | null
          searched_at?: string | null
          session_id?: string
          time_to_selection_ms?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_skill_assessment_criteria: {
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
      user_step_progress: {
        Row: {
          collection_item_id: string
          completed_at: string | null
          created_at: string | null
          found_confusing: boolean | null
          found_helpful: boolean | null
          id: string
          interaction_data: Json | null
          lesson_step_id: string
          notes: string | null
          time_spent_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collection_item_id: string
          completed_at?: string | null
          created_at?: string | null
          found_confusing?: boolean | null
          found_helpful?: boolean | null
          id?: string
          interaction_data?: Json | null
          lesson_step_id: string
          notes?: string | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collection_item_id?: string
          completed_at?: string | null
          created_at?: string | null
          found_confusing?: boolean | null
          found_helpful?: boolean | null
          id?: string
          interaction_data?: Json | null
          lesson_step_id?: string
          notes?: string | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      campaign_performance: {
        Row: {
          campaign_name: string | null
          campaign_type: string | null
          civic_urgency_level: number | null
          click_rate_percent: number | null
          clicked_count: number | null
          conversion_count: number | null
          conversion_rate_percent: number | null
          delivered_count: number | null
          id: string | null
          open_rate_percent: number | null
          opened_count: number | null
          sent_count: number | null
          status: string | null
        }
        Insert: {
          campaign_name?: string | null
          campaign_type?: string | null
          civic_urgency_level?: number | null
          click_rate_percent?: never
          clicked_count?: number | null
          conversion_count?: number | null
          conversion_rate_percent?: never
          delivered_count?: number | null
          id?: string | null
          open_rate_percent?: never
          opened_count?: number | null
          sent_count?: number | null
          status?: string | null
        }
        Update: {
          campaign_name?: string | null
          campaign_type?: string | null
          civic_urgency_level?: number | null
          click_rate_percent?: never
          clicked_count?: number | null
          conversion_count?: number | null
          conversion_rate_percent?: never
          delivered_count?: number | null
          id?: string | null
          open_rate_percent?: never
          opened_count?: number | null
          sent_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      civic_engagement_impact: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          campaign_type: string | null
          civic_actions_triggered: number | null
          total_engagement_score: number | null
          unique_users_engaged: number | null
        }
        Relationships: []
      }
      civic_learning_impact: {
        Row: {
          avg_civic_knowledge_score: number | null
          first_interaction: string | null
          guest_token: string | null
          last_interaction: string | null
          max_civic_knowledge_score: number | null
          quiz_attempt_id: string | null
          session_duration_seconds: number | null
          topic_id: string | null
          total_action_steps_engaged: number | null
          total_events: number | null
          total_misconceptions_corrected: number | null
          total_uncomfortable_truths: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "user_quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_few_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_translation_coverage_summary"
            referencedColumns: ["topic_id"]
          },
        ]
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
      content_performance: {
        Row: {
          average_rating: number | null
          confidence_level: string | null
          content_id: string | null
          content_type: string | null
          last_updated: string | null
          rating_distribution: Json | null
          total_reviews: number | null
        }
        Insert: {
          average_rating?: number | null
          confidence_level?: never
          content_id?: string | null
          content_type?: string | null
          last_updated?: string | null
          rating_distribution?: Json | null
          total_reviews?: number | null
        }
        Update: {
          average_rating?: number | null
          confidence_level?: never
          content_id?: string | null
          content_type?: string | null
          last_updated?: string | null
          rating_distribution?: Json | null
          total_reviews?: number | null
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
      course_structure: {
        Row: {
          course_category: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          emoji: string | null
          estimated_duration_minutes: number | null
          estimated_minutes_calculated: number | null
          featured_order: number | null
          id: string | null
          interactive_steps: number | null
          is_featured: boolean | null
          is_public: boolean | null
          learning_objectives: string[] | null
          lesson_count: number | null
          slug: string | null
          title: string | null
          total_estimated_seconds: number | null
          total_steps: number | null
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
      discoverable_collections: {
        Row: {
          ai_generation_id: string | null
          allow_remixing: boolean | null
          average_completion_time_seconds: number | null
          average_rating: number | null
          average_score: number | null
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          created_by_ai: boolean | null
          creation_method: string | null
          description: string | null
          difficulty_level: string | null
          emoji: string | null
          engagement_score: number | null
          estimated_duration_minutes: number | null
          id: string | null
          is_collaborative: boolean | null
          language: string | null
          last_played_at: string | null
          metadata: Json | null
          owner_id: string | null
          password_hash: string | null
          published_at: string | null
          question_count: number | null
          recent_players: number | null
          requires_premium: boolean | null
          slug: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          topic_areas: string[] | null
          total_completions: number | null
          total_likes: number | null
          total_plays: number | null
          unique_players: number | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_content_collections_ai_generation_id_fkey"
            columns: ["ai_generation_id"]
            isOneToOne: false
            referencedRelation: "custom_content_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_reliability_report: {
        Row: {
          average_response_time: number | null
          domain: string | null
          failure_count: number | null
          is_blacklisted: boolean | null
          last_failure: string | null
          last_success: string | null
          reliability_rating: string | null
          reliability_score: number | null
          success_count: number | null
          total_checks: number | null
          updated_at: string | null
        }
        Insert: {
          average_response_time?: number | null
          domain?: string | null
          failure_count?: number | null
          is_blacklisted?: boolean | null
          last_failure?: string | null
          last_success?: string | null
          reliability_rating?: never
          reliability_score?: number | null
          success_count?: number | null
          total_checks?: number | null
          updated_at?: string | null
        }
        Update: {
          average_response_time?: number | null
          domain?: string | null
          failure_count?: number | null
          is_blacklisted?: boolean | null
          last_failure?: string | null
          last_success?: string | null
          reliability_rating?: never
          reliability_score?: number | null
          success_count?: number | null
          total_checks?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      enhanced_source_analysis: {
        Row: {
          ai_model_version: string | null
          analysis_confidence: number | null
          analysis_summary: string | null
          analyzed_at: string | null
          bias_category: string | null
          credibility_category: string | null
          domain: string | null
          expires_at: string | null
          factual_rating: string | null
          id: string | null
          is_fresh: boolean | null
          is_high_confidence: boolean | null
          is_recent: boolean | null
          overall_bias: string | null
          overall_credibility: number | null
          recommendations: string[] | null
          red_flags: string[] | null
          strengths: string[] | null
          transparency_score: number | null
          url: string | null
          url_hash: string | null
          weaknesses: string[] | null
        }
        Insert: {
          ai_model_version?: string | null
          analysis_confidence?: number | null
          analysis_summary?: string | null
          analyzed_at?: string | null
          bias_category?: never
          credibility_category?: never
          domain?: string | null
          expires_at?: string | null
          factual_rating?: string | null
          id?: string | null
          is_fresh?: never
          is_high_confidence?: never
          is_recent?: never
          overall_bias?: string | null
          overall_credibility?: number | null
          recommendations?: string[] | null
          red_flags?: string[] | null
          strengths?: string[] | null
          transparency_score?: number | null
          url?: string | null
          url_hash?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          ai_model_version?: string | null
          analysis_confidence?: number | null
          analysis_summary?: string | null
          analyzed_at?: string | null
          bias_category?: never
          credibility_category?: never
          domain?: string | null
          expires_at?: string | null
          factual_rating?: string | null
          id?: string | null
          is_fresh?: never
          is_high_confidence?: never
          is_recent?: never
          overall_bias?: string | null
          overall_credibility?: number | null
          recommendations?: string[] | null
          red_flags?: string[] | null
          strengths?: string[] | null
          transparency_score?: number | null
          url?: string | null
          url_hash?: string | null
          weaknesses?: string[] | null
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
      lesson_structure: {
        Row: {
          calculated_duration_minutes: number | null
          collection_id: string | null
          created_at: string | null
          estimated_duration_minutes: number | null
          interactive_step_count: number | null
          is_published: boolean | null
          key_concepts: Json | null
          learning_objectives: Json | null
          lesson_description: string | null
          lesson_id: string | null
          lesson_title: string | null
          lesson_type: string | null
          sort_order: number | null
          step_count: number | null
          total_step_seconds: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "course_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "published_collections"
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
      provider_performance: {
        Row: {
          campaigns_sent: number | null
          id: string | null
          provider_name: string | null
          provider_type: string | null
          total_clicked: number | null
          total_conversions: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
        }
        Relationships: []
      }
      public_collections_with_authors: {
        Row: {
          ai_generation_id: string | null
          allow_remixing: boolean | null
          author_avatar_url: string | null
          author_bio: string | null
          author_display_name: string | null
          author_username: string | null
          average_completion_time_seconds: number | null
          average_score: number | null
          avg_rating: number | null
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          created_by_ai: boolean | null
          creation_method: string | null
          description: string | null
          difficulty_level: string | null
          emoji: string | null
          engagement_score: number | null
          estimated_duration_minutes: number | null
          id: string | null
          is_collaborative: boolean | null
          language: string | null
          last_played_at: string | null
          metadata: Json | null
          owner_id: string | null
          password_hash: string | null
          play_count: number | null
          published_at: string | null
          question_count: number | null
          rating_count: number | null
          requires_premium: boolean | null
          slug: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          topic_areas: string[] | null
          total_completions: number | null
          total_plays: number | null
          unique_players: number | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_content_collections_ai_generation_id_fkey"
            columns: ["ai_generation_id"]
            isOneToOne: false
            referencedRelation: "custom_content_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      published_collections: {
        Row: {
          action_items: string[] | null
          categories: string[] | null
          content_type: string | null
          course_category: string | null
          created_at: string | null
          created_by: string | null
          current_events_relevance: number | null
          description: string | null
          difficulty_level: number | null
          emoji: string | null
          estimated_duration_minutes: number | null
          estimated_minutes: number | null
          featured_order: number | null
          id: string | null
          interactive_steps: number | null
          internal_notes: string | null
          is_featured: boolean | null
          is_public: boolean | null
          learning_objectives: string[] | null
          lesson_count: number | null
          metadata: Json | null
          political_balance_score: number | null
          prerequisites: string[] | null
          published_at: string | null
          slug: string | null
          source_diversity_score: number | null
          status: string | null
          tags: string[] | null
          title: string | null
          total_item_minutes: number | null
          total_step_seconds: number | null
          total_steps: number | null
          updated_at: string | null
          version: number | null
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
      question_topics_few_questions: {
        Row: {
          ai_extraction_metadata: Json | null
          ai_generated: boolean | null
          ai_generation_method: string | null
          ai_model_used: string | null
          ai_quality_score: number | null
          categories: Json | null
          content_package_id: string | null
          created_at: string | null
          date: string | null
          day_of_week: string | null
          description: string | null
          difficulty_level: string | null
          emoji: string | null
          estimated_duration_minutes: number | null
          id: string | null
          is_active: boolean | null
          is_breaking: boolean | null
          is_featured: boolean | null
          key_takeaways: Json | null
          question_count: number | null
          source_analysis_id: string | null
          source_credibility_score: number | null
          topic_id: string | null
          topic_title: string | null
          translations: Json | null
          updated_at: string | null
          why_this_matters: string | null
        }
        Relationships: []
      }
      recent_url_failures: {
        Row: {
          domain: string | null
          error_message: string | null
          http_status: number | null
          last_checked: string | null
          url: string | null
          validation_score: number | null
        }
        Insert: {
          domain?: string | null
          error_message?: string | null
          http_status?: number | null
          last_checked?: string | null
          url?: string | null
          validation_score?: number | null
        }
        Update: {
          domain?: string | null
          error_message?: string | null
          http_status?: number | null
          last_checked?: string | null
          url?: string | null
          validation_score?: number | null
        }
        Relationships: []
      }
      response_time_analytics: {
        Row: {
          avg_response_time_ms: number | null
          game_mode: string | null
          max_response_time_ms: number | null
          median_response_time_ms: number | null
          min_response_time_ms: number | null
          p95_response_time_ms: number | null
          platform: string | null
          question_id: string | null
          response_count: number | null
          response_time_stddev: number | null
          topic_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_feedback_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_response_stats"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_sources_enhanced"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics_few_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_with_questions_and_translations"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_topics_without_questions"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analytics_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "v_translation_coverage_summary"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      reviews_with_reviewer: {
        Row: {
          avatar_url: string | null
          civic_engagement_score: number | null
          completion_context: Json | null
          content_id: string | null
          content_title: string | null
          content_type: string | null
          created_at: string | null
          display_name: string | null
          expertise_areas: string[] | null
          helpful_count: number | null
          id: string | null
          is_flagged: boolean | null
          is_public: boolean | null
          is_verified: boolean | null
          is_verified_reviewer: boolean | null
          moderator_notes: string | null
          not_helpful_count: number | null
          rating: number | null
          review_text: string | null
          reviewer_expertise_level: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_reviewer_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "reviewer_profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      v_topics_with_questions_and_translations: {
        Row: {
          categories: Json | null
          combined_available_languages: string[] | null
          correct_answer: string | null
          date: string | null
          day_of_week: string | null
          description: string | null
          difficulty_level: number | null
          emoji: string | null
          explanation: string | null
          hint: string | null
          is_breaking: boolean | null
          is_featured: boolean | null
          key_takeaways: Json | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question: string | null
          question_available_languages: string[] | null
          question_category: string | null
          question_created_at: string | null
          question_id: string | null
          question_is_active: boolean | null
          question_number: number | null
          question_translations: Json | null
          question_type: string | null
          question_updated_at: string | null
          sources: Json | null
          tags: Json | null
          topic_available_languages: string[] | null
          topic_created_at: string | null
          topic_id: string | null
          topic_internal_id: string | null
          topic_is_active: boolean | null
          topic_title: string | null
          topic_translations: Json | null
          topic_updated_at: string | null
          why_this_matters: string | null
        }
        Relationships: []
      }
      v_topics_without_questions: {
        Row: {
          available_translation_fields: string[] | null
          categories: Json | null
          created_at: string | null
          date: string | null
          day_of_week: string | null
          description: string | null
          emoji: string | null
          id: string | null
          is_active: boolean | null
          is_breaking: boolean | null
          is_featured: boolean | null
          key_takeaways: Json | null
          topic_id: string | null
          topic_title: string | null
          translation_language_count: number | null
          translations: Json | null
          updated_at: string | null
          why_this_matters: string | null
        }
        Relationships: []
      }
      v_translation_coverage_summary: {
        Row: {
          all_available_languages: string[] | null
          question_language_count: number | null
          question_languages: string[] | null
          question_translation_percentage: number | null
          topic_id: string | null
          topic_language_count: number | null
          topic_languages: string[] | null
          topic_title: string | null
          topic_translated_field_count: number | null
          topic_translated_fields: string[] | null
          total_questions: number | null
          translated_questions: number | null
          translation_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_content_to_collection: {
        Args: {
          p_collection_id: string
          p_user_id: string
          p_content_type: string
          p_content_id: string
          p_title?: string
          p_description?: string
          p_image_url?: string
          p_emoji?: string
          p_user_notes?: string
          p_user_tags?: string[]
        }
        Returns: Json
      }
      add_figure_to_topic: {
        Args: { p_topic_id: string; p_figure_id: string }
        Returns: boolean
      }
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
      cache_source_analysis: {
        Args: {
          input_url: string
          input_domain: string
          input_credibility: number
          input_bias: string
          input_factual_rating: string
          input_summary: string
          input_strengths: string[]
          input_weaknesses: string[]
          input_red_flags: string[]
          input_recommendations: string[]
          input_confidence: number
          cache_duration_hours?: number
        }
        Returns: string
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
      calculate_engagement_score: {
        Args: {
          p_play_count: number
          p_completion_rate: number
          p_average_score: number
          p_share_count: number
          p_like_count: number
        }
        Returns: number
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
      can_user_generate_content: {
        Args: { p_user_id?: string; p_guest_token?: string }
        Returns: boolean
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
      check_apple_iap_access: {
        Args: { p_user_id: string; p_product_id: string }
        Returns: boolean
      }
      check_boost_cooldown: {
        Args: { target_user_id: string; target_boost_type: string }
        Returns: boolean
      }
      check_image_generation_performance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_incentive_eligibility: {
        Args: { user_id_param: string; survey_incentive_id_param: string }
        Returns: Json
      }
      check_premium_feature_access: {
        Args:
          | { p_user_id: string; p_feature_name: string }
          | { p_user_id: string; p_feature_name: string }
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
      cleanup_expired_agent_memory: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_ai_analyses: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_boosts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_og_cache: {
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
      cleanup_expired_source_analysis: {
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
      cleanup_old_trending_searches: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_url_validations: {
        Args: Record<PropertyKey, never>
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
      convert_preview_to_topic: {
        Args: { p_generation_id: string; p_user_id: string }
        Returns: string
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
      find_duplicate_public_figures: {
        Args: Record<PropertyKey, never>
        Returns: {
          original_id: string
          duplicate_id: string
          bioguide_id: string
          full_name: string
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
      generate_collection_slug: {
        Args: { p_title: string }
        Returns: string
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
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      generate_ticket_code: {
        Args: { survey_incentive_id: string }
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
      get_category_stats_batch: {
        Args: { category_ids: string[] }
        Returns: {
          category_id: string
          topic_count: number
          question_count: number
          active_topics: number
          avg_difficulty: number
        }[]
      }
      get_collection_contents: {
        Args: { p_collection_id: string; p_user_id: string }
        Returns: {
          id: string
          content_type: string
          content_id: string
          title: string
          description: string
          image_url: string
          emoji: string
          user_notes: string
          user_tags: string[]
          sort_order: number
          added_at: string
          updated_at: string
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
      get_collection_stats: {
        Args: { collection_slug: string }
        Returns: {
          lesson_count: number
          total_steps: number
          estimated_minutes: number
          interactive_steps: number
          completion_rate: number
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
      get_course_structure: {
        Args: { course_slug: string }
        Returns: {
          course_id: string
          course_title: string
          course_description: string
          course_emoji: string
          difficulty_level: number
          course_category: string
          total_lessons: number
          total_steps: number
          estimated_duration_minutes: number
          lessons: Json
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
      get_enhanced_source_analysis: {
        Args: { input_url: string }
        Returns: Json
      }
      get_event_timeline: {
        Args: { p_event_topic_id: string }
        Returns: {
          connected_event_topic_id: string
          connected_event_title: string
          connected_event_date: string
          relationship_type: string
          time_gap_days: number
          explanation: string
          direction: string
        }[]
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
      get_lesson_progress_stats: {
        Args: { lesson_id: string }
        Returns: {
          total_steps: number
          interactive_steps: number
          estimated_duration_minutes: number
          step_types: Json
        }[]
      }
      get_member_photo_urls: {
        Args: { p_bioguide_id: string; p_congress_number?: number }
        Returns: {
          thumbnail_url: string
          medium_url: string
          large_url: string
          original_url: string
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
          description: string
          emoji: string
          question_count: number
          display_order: number
        }[]
      }
      get_onboarding_skills: {
        Args: { p_category_ids?: string[] }
        Returns: {
          id: string
          skill_name: string
          description: string
          emoji: string
          category_id: string
          category_name: string
          difficulty_level: number
          is_core_skill: boolean
          display_order: number
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
      get_or_create_source_analysis: {
        Args: {
          p_url: string
          p_domain?: string
          p_credibility?: number
          p_bias?: string
          p_factual_rating?: string
        }
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
      get_personalized_quizzes: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          topic_id: string
          topic_title: string
          description: string
          emoji: string
          category_id: string
          category_name: string
          question_count: number
          relevance_score: number
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
      get_questions_batch: {
        Args: {
          p_topic_ids: string[]
          p_limit_per_topic?: number
          p_randomize?: boolean
        }
        Returns: {
          topic_id: string
          question_id: string
          question: string
          options: Json
          correct_answer: string
          explanation: string
          difficulty_level: number
          sources: Json
        }[]
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
      get_source_analysis_by_url: {
        Args: { input_url: string }
        Returns: {
          url_hash: string
          overall_credibility: number
          overall_bias: string
          factual_rating: string
          analysis_summary: string
          strengths: string[]
          weaknesses: string[]
          red_flags: string[]
          recommendations: string[]
          analysis_confidence: number
          cached_at: string
        }[]
      }
      get_source_analysis_stats: {
        Args: Record<PropertyKey, never>
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
      get_topic_related_events: {
        Args: { p_topic_id: string }
        Returns: {
          event_topic_id: string
          title: string
          event_date: string
          connection_type: string
          connection_strength: number
          context_notes: string
          significance_level: number
        }[]
      }
      get_topic_translation: {
        Args: {
          translations_jsonb: Json
          field_name: string
          language_code: string
        }
        Returns: string
      }
      get_topics_with_stats_batch: {
        Args: { p_category_id?: string; p_limit?: number; p_offset?: number }
        Returns: {
          topic_id: string
          topic_title: string
          description: string
          categories: Json
          question_count: number
          difficulty_avg: number
          is_active: boolean
          created_at: string
          primary_category_name: string
          primary_category_emoji: string
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
      get_trending_searches: {
        Args: { p_category?: string; p_limit?: number; p_min_count?: number }
        Returns: {
          search_query: string
          search_count: number
          last_searched_at: string
          category: string
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
      get_user_connected_content: {
        Args: {
          p_user_id: string
          p_content_type: string
          p_content_id: string
        }
        Returns: {
          connection_id: string
          connected_content_type: string
          connected_content_id: string
          connection_type: string
          connection_note: string
          strength: number
          created_at: string
        }[]
      }
      get_user_content_annotation: {
        Args: {
          p_user_id: string
          p_content_type: string
          p_content_id: string
        }
        Returns: {
          annotation_id: string
          personal_notes: string
          key_insights: string[]
          personal_rating: number
          why_saved: string
          how_it_applies: string
          follow_up_questions: string[]
          personal_tags: string[]
          reading_progress: number
          last_accessed_at: string
          times_accessed: number
        }[]
      }
      get_user_credits_balance: {
        Args: { user_id_param: string; credit_type_param?: string }
        Returns: number
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
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          current_step: string
          completed_steps: string[]
          status: string
          is_completed: boolean
          onboarding_data: Json
          categories: Json
          skills: Json
          preferences: Json
          assessment: Json
          created_at: string
          updated_at: string
          completed_at: string
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
          session_type: string | null
          started_at: string
          streak: number
          test_type: string | null
          topic_id: string | null
          user_id: string | null
        }[]
      }
      get_user_progress_summary: {
        Args: { p_user_id: string }
        Returns: {
          total_quizzes: number
          avg_score: number
          total_time_minutes: number
          current_streak: number
          max_streak: number
          favorite_categories: Json
          recent_activity: Json
          performance_trend: Json
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
      has_translation: {
        Args: { translations_jsonb: Json; language_code: string }
        Returns: boolean
      }
      identify_content_gaps: {
        Args: { p_analysis_type?: string; p_researcher_id?: string }
        Returns: {
          gap_type: string
          priority_level: string
          title: string
          description: string
          confidence_score: number
        }[]
      }
      increment_generation_usage: {
        Args: {
          p_user_id?: string
          p_guest_token?: string
          p_is_premium?: boolean
        }
        Returns: string
      }
      increment_trending_query: {
        Args: {
          p_search_query: string
          p_category?: string
          p_user_type?: string
        }
        Returns: {
          query_id: string
          search_count: number
          is_new_entry: boolean
        }[]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_user: {
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
      log_quiz_event: {
        Args: {
          p_event_type: string
          p_event_category: string
          p_user_id?: string
          p_guest_token?: string
          p_session_id?: string
          p_topic_id?: string
          p_quiz_attempt_id?: string
          p_question_id?: string
          p_game_mode?: string
          p_event_data?: Json
          p_performance_data?: Json
          p_response_time_ms?: number
          p_time_since_question_start_ms?: number
          p_time_since_quiz_start_ms?: number
          p_platform?: string
          p_device_type?: string
          p_user_agent?: string
          p_referrer_url?: string
          p_page_url?: string
          p_room_code?: string
          p_team_id?: string
          p_social_interaction_type?: string
        }
        Returns: string
      }
      log_research_session_result: {
        Args: {
          p_session_id: string
          p_events_generated?: number
          p_connections_discovered?: number
          p_quality_score?: number
          p_processing_time_ms?: number
          p_status?: string
        }
        Returns: boolean
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
      process_invite_code: {
        Args: { p_invite_code: string; p_invitee_id: string }
        Returns: Json
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
      remove_content_from_collection: {
        Args: {
          p_collection_id: string
          p_user_id: string
          p_content_type: string
          p_content_id: string
        }
        Returns: Json
      }
      remove_figure_from_topic: {
        Args: { p_topic_id: string; p_figure_id: string }
        Returns: boolean
      }
      reorder_collection_items: {
        Args: {
          p_collection_id: string
          p_user_id: string
          p_item_orders: Json[]
        }
        Returns: Json
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
      search_historical_events: {
        Args: {
          p_query: string
          p_event_type?: string
          p_min_significance?: number
          p_limit?: number
        }
        Returns: {
          event_topic_id: string
          title: string
          description: string
          event_date: string
          event_type: string
          significance_level: number
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
      update_domain_reliability_score: {
        Args: { domain_name: string }
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
      update_onboarding_progress: {
        Args: { p_user_id: string; p_step_name: string; p_step_data?: Json }
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
          | { session_id: string }
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
      upsert_congressional_member: {
        Args: {
          p_bioguide_id: string
          p_full_name: string
          p_display_name: string
          p_congress_member_type: string
          p_current_state: string
          p_current_district: number
          p_party_affiliation: string
          p_congressional_tenure_start: string
          p_office: string
          p_current_positions: string[]
          p_bio: string
        }
        Returns: string
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
      upsert_user_question_memory: {
        Args: {
          p_user_id: string
          p_question_id: string
          p_is_correct: boolean
          p_response_time_ms?: number
          p_confidence_level?: number
        }
        Returns: Json
      }
      upsert_user_question_response: {
        Args: {
          p_user_id: string
          p_question_id: string
          p_selected_answer: string
          p_is_correct: boolean
          p_response_time_ms?: number
          p_assessment_type?: string
          p_attempt_id?: string
          p_topic_id?: string
          p_confidence_level?: number
        }
        Returns: string
      }
      user_is_in_room: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_collection_integrity: {
        Args: { collection_id: string }
        Returns: {
          issue_type: string
          issue_description: string
          severity: string
        }[]
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
