export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  admin_panel: {
    Tables: {
      activity_logs: {
        Row: {
          action_category: string
          action_details: Json
          action_type: string
          admin_user_id: string
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          action_category: string
          action_details?: Json
          action_type: string
          admin_user_id: string
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          action_category?: string
          action_details?: Json
          action_type?: string
          admin_user_id?: string
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      bulk_operations: {
        Row: {
          admin_user_id: string
          completed_at: string | null
          created_at: string
          error_summary: Json | null
          failed_items: number | null
          id: string
          operation_type: string
          processed_items: number | null
          started_at: string | null
          status: string
          successful_items: number | null
          total_items: number
        }
        Insert: {
          admin_user_id: string
          completed_at?: string | null
          created_at?: string
          error_summary?: Json | null
          failed_items?: number | null
          id?: string
          operation_type: string
          processed_items?: number | null
          started_at?: string | null
          status?: string
          successful_items?: number | null
          total_items: number
        }
        Update: {
          admin_user_id?: string
          completed_at?: string | null
          created_at?: string
          error_summary?: Json | null
          failed_items?: number | null
          id?: string
          operation_type?: string
          processed_items?: number | null
          started_at?: string | null
          status?: string
          successful_items?: number | null
          total_items?: number
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          admin_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          unit: string
          value: number
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          unit: string
          value: number
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          unit?: string
          value?: number
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_category: string
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: number
          title: string
        }
        Insert: {
          alert_category: string
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          title: string
        }
        Update: {
          alert_category?: string
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          title?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          admin_user_id: string
          created_at: string
          dashboard_layout: Json | null
          last_viewed_items: Json | null
          notification_settings: Json | null
          preferences: Json
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          dashboard_layout?: Json | null
          last_viewed_items?: Json | null
          notification_settings?: Json | null
          preferences?: Json
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          dashboard_layout?: Json | null
          last_viewed_items?: Json | null
          notification_settings?: Json | null
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_activity: {
        Args: {
          p_action_type: string
          p_action_category: string
          p_resource_type?: string
          p_resource_id?: string
          p_action_details?: Json
          p_status?: string
          p_error_message?: string
          p_duration_ms?: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  ai_agent: {
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
            foreignKeyName: "ai_action_executions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "ai_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_executions_command_execution_id_fkey"
            columns: ["command_execution_id"]
            isOneToOne: false
            referencedRelation: "ai_command_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_action_prompts: {
        Row: {
          action_id: string
          condition_logic: Json | null
          created_at: string | null
          fallback_order: number | null
          id: string
          is_active: boolean | null
          parameter_mapping: Json | null
          prompt_id: string
          usage_context: string
        }
        Insert: {
          action_id: string
          condition_logic?: Json | null
          created_at?: string | null
          fallback_order?: number | null
          id?: string
          is_active?: boolean | null
          parameter_mapping?: Json | null
          prompt_id: string
          usage_context: string
        }
        Update: {
          action_id?: string
          condition_logic?: Json | null
          created_at?: string | null
          fallback_order?: number | null
          id?: string
          is_active?: boolean | null
          parameter_mapping?: Json | null
          prompt_id?: string
          usage_context?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_prompts_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "ai_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_actions: {
        Row: {
          action_name: string
          action_type: string
          avg_execution_time_ms: number | null
          complexity_score: number | null
          configuration: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          estimated_cost_usd: number | null
          executor_class: string
          executor_method: string | null
          fallback_action_id: string | null
          id: string
          input_schema: Json | null
          is_active: boolean | null
          is_async: boolean | null
          is_idempotent: boolean | null
          max_concurrent_executions: number | null
          output_schema: Json | null
          quality_gates: string[] | null
          required_integrations: string[] | null
          resource_requirements: Json | null
          retry_backoff_ms: number | null
          retry_count: number | null
          side_effects: string[] | null
          success_rate: number | null
          tags: string[] | null
          timeout_seconds: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          action_name: string
          action_type: string
          avg_execution_time_ms?: number | null
          complexity_score?: number | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          estimated_cost_usd?: number | null
          executor_class: string
          executor_method?: string | null
          fallback_action_id?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean | null
          is_async?: boolean | null
          is_idempotent?: boolean | null
          max_concurrent_executions?: number | null
          output_schema?: Json | null
          quality_gates?: string[] | null
          required_integrations?: string[] | null
          resource_requirements?: Json | null
          retry_backoff_ms?: number | null
          retry_count?: number | null
          side_effects?: string[] | null
          success_rate?: number | null
          tags?: string[] | null
          timeout_seconds?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          action_name?: string
          action_type?: string
          avg_execution_time_ms?: number | null
          complexity_score?: number | null
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          estimated_cost_usd?: number | null
          executor_class?: string
          executor_method?: string | null
          fallback_action_id?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean | null
          is_async?: boolean | null
          is_idempotent?: boolean | null
          max_concurrent_executions?: number | null
          output_schema?: Json | null
          quality_gates?: string[] | null
          required_integrations?: string[] | null
          resource_requirements?: Json | null
          retry_backoff_ms?: number | null
          retry_count?: number | null
          side_effects?: string[] | null
          success_rate?: number | null
          tags?: string[] | null
          timeout_seconds?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_fallback_action_id_fkey"
            columns: ["fallback_action_id"]
            isOneToOne: false
            referencedRelation: "ai_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_memory: {
        Row: {
          access_count: number | null
          agent_type: string
          confidence_score: number | null
          context_data: Json | null
          created_at: string | null
          expires_at: string | null
          global_memory: boolean | null
          id: string
          last_accessed_at: string | null
          memory_key: string
          memory_type: string
          memory_value: Json
          relevance_score: number | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_count?: number | null
          agent_type: string
          confidence_score?: number | null
          context_data?: Json | null
          created_at?: string | null
          expires_at?: string | null
          global_memory?: boolean | null
          id?: string
          last_accessed_at?: string | null
          memory_key: string
          memory_type: string
          memory_value: Json
          relevance_score?: number | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_count?: number | null
          agent_type?: string
          confidence_score?: number | null
          context_data?: Json | null
          created_at?: string | null
          expires_at?: string | null
          global_memory?: boolean | null
          id?: string
          last_accessed_at?: string | null
          memory_key?: string
          memory_type?: string
          memory_value?: Json
          relevance_score?: number | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_command_actions: {
        Row: {
          action_id: string
          command_id: string
          condition_logic: Json | null
          created_at: string | null
          depends_on_actions: string[] | null
          execution_order: number
          id: string
          input_mapping: Json | null
          is_active: boolean | null
          output_mapping: Json | null
          parallel_group: number | null
          parameter_overrides: Json | null
          required_for_success: boolean | null
          skip_on_failure: boolean | null
        }
        Insert: {
          action_id: string
          command_id: string
          condition_logic?: Json | null
          created_at?: string | null
          depends_on_actions?: string[] | null
          execution_order: number
          id?: string
          input_mapping?: Json | null
          is_active?: boolean | null
          output_mapping?: Json | null
          parallel_group?: number | null
          parameter_overrides?: Json | null
          required_for_success?: boolean | null
          skip_on_failure?: boolean | null
        }
        Update: {
          action_id?: string
          command_id?: string
          condition_logic?: Json | null
          created_at?: string | null
          depends_on_actions?: string[] | null
          execution_order?: number
          id?: string
          input_mapping?: Json | null
          is_active?: boolean | null
          output_mapping?: Json | null
          parallel_group?: number | null
          parameter_overrides?: Json | null
          required_for_success?: boolean | null
          skip_on_failure?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_command_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "ai_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_command_actions_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "ai_commands"
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
        Relationships: [
          {
            foreignKeyName: "ai_command_analytics_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "ai_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_command_analytics_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "ai_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_command_executions: {
        Row: {
          admin_context: Json | null
          ai_cost_usd: number | null
          ai_tokens_used: number | null
          batch_execution_id: string | null
          command_id: string
          completed_at: string | null
          created_at: string | null
          current_action_id: string | null
          current_step_description: string | null
          device_context: Json | null
          error_details: Json | null
          error_message: string | null
          estimated_duration_seconds: number | null
          execution_plan: Json | null
          execution_time_ms: number | null
          extracted_parameters: Json | null
          failed_action_id: string | null
          fallback_used: boolean | null
          id: string
          intermediate_results: Json | null
          original_input: string
          parsed_intent: Json | null
          progress: number | null
          quality_score: number | null
          results: Json | null
          retry_count: number | null
          session_id: string | null
          started_at: string | null
          status: string
          stream_id: string | null
          success_metrics: Json | null
          user_id: string | null
          user_location: Json | null
          user_satisfaction: number | null
        }
        Insert: {
          admin_context?: Json | null
          ai_cost_usd?: number | null
          ai_tokens_used?: number | null
          batch_execution_id?: string | null
          command_id: string
          completed_at?: string | null
          created_at?: string | null
          current_action_id?: string | null
          current_step_description?: string | null
          device_context?: Json | null
          error_details?: Json | null
          error_message?: string | null
          estimated_duration_seconds?: number | null
          execution_plan?: Json | null
          execution_time_ms?: number | null
          extracted_parameters?: Json | null
          failed_action_id?: string | null
          fallback_used?: boolean | null
          id?: string
          intermediate_results?: Json | null
          original_input: string
          parsed_intent?: Json | null
          progress?: number | null
          quality_score?: number | null
          results?: Json | null
          retry_count?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          stream_id?: string | null
          success_metrics?: Json | null
          user_id?: string | null
          user_location?: Json | null
          user_satisfaction?: number | null
        }
        Update: {
          admin_context?: Json | null
          ai_cost_usd?: number | null
          ai_tokens_used?: number | null
          batch_execution_id?: string | null
          command_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_action_id?: string | null
          current_step_description?: string | null
          device_context?: Json | null
          error_details?: Json | null
          error_message?: string | null
          estimated_duration_seconds?: number | null
          execution_plan?: Json | null
          execution_time_ms?: number | null
          extracted_parameters?: Json | null
          failed_action_id?: string | null
          fallback_used?: boolean | null
          id?: string
          intermediate_results?: Json | null
          original_input?: string
          parsed_intent?: Json | null
          progress?: number | null
          quality_score?: number | null
          results?: Json | null
          retry_count?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          stream_id?: string | null
          success_metrics?: Json | null
          user_id?: string | null
          user_location?: Json | null
          user_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_command_executions_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "ai_commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_command_executions_current_action_id_fkey"
            columns: ["current_action_id"]
            isOneToOne: false
            referencedRelation: "ai_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_command_executions_failed_action_id_fkey"
            columns: ["failed_action_id"]
            isOneToOne: false
            referencedRelation: "ai_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_command_executions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "ai_command_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_command_permissions: {
        Row: {
          allowed_hours_utc: number[] | null
          allowed_locations: Json | null
          can_execute: boolean | null
          can_modify_parameters: boolean | null
          can_schedule: boolean | null
          can_view_results: boolean | null
          command_id: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string
          id: string
          max_executions_per_day: number | null
          max_executions_per_hour: number | null
          permission_target: string
          permission_type: string
          required_conditions: Json | null
        }
        Insert: {
          allowed_hours_utc?: number[] | null
          allowed_locations?: Json | null
          can_execute?: boolean | null
          can_modify_parameters?: boolean | null
          can_schedule?: boolean | null
          can_view_results?: boolean | null
          command_id?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by: string
          id?: string
          max_executions_per_day?: number | null
          max_executions_per_hour?: number | null
          permission_target: string
          permission_type: string
          required_conditions?: Json | null
        }
        Update: {
          allowed_hours_utc?: number[] | null
          allowed_locations?: Json | null
          can_execute?: boolean | null
          can_modify_parameters?: boolean | null
          can_schedule?: boolean | null
          can_view_results?: boolean | null
          command_id?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string
          id?: string
          max_executions_per_day?: number | null
          max_executions_per_hour?: number | null
          permission_target?: string
          permission_type?: string
          required_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_command_permissions_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "ai_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_command_streams: {
        Row: {
          client_connections: number | null
          command_execution_id: string
          completed_steps: number | null
          connection_timeout_seconds: number | null
          current_step_name: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          max_connections: number | null
          progress_percentage: number | null
          stream_ended_at: string | null
          stream_messages: Json[] | null
          stream_started_at: string | null
          stream_type: string
          supports_sse: boolean | null
          supports_websocket: boolean | null
          total_steps: number | null
        }
        Insert: {
          client_connections?: number | null
          command_execution_id: string
          completed_steps?: number | null
          connection_timeout_seconds?: number | null
          current_step_name?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          max_connections?: number | null
          progress_percentage?: number | null
          stream_ended_at?: string | null
          stream_messages?: Json[] | null
          stream_started_at?: string | null
          stream_type?: string
          supports_sse?: boolean | null
          supports_websocket?: boolean | null
          total_steps?: number | null
        }
        Update: {
          client_connections?: number | null
          command_execution_id?: string
          completed_steps?: number | null
          connection_timeout_seconds?: number | null
          current_step_name?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          max_connections?: number | null
          progress_percentage?: number | null
          stream_ended_at?: string | null
          stream_messages?: Json[] | null
          stream_started_at?: string | null
          stream_type?: string
          supports_sse?: boolean | null
          supports_websocket?: boolean | null
          total_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_command_streams_command_execution_id_fkey"
            columns: ["command_execution_id"]
            isOneToOne: false
            referencedRelation: "ai_command_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_commands: {
        Row: {
          allows_batch_processing: boolean | null
          category: string
          command_name: string
          complexity_score: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          estimated_cost_usd: number | null
          example_inputs: string[] | null
          fallback_command_id: string | null
          id: string
          intent_keywords: string[] | null
          is_active: boolean | null
          max_batch_size: number | null
          max_parallel_executions: number | null
          natural_language_patterns: string[] | null
          parameters_schema: Json | null
          required_integrations: string[] | null
          requires_admin: boolean | null
          requires_streaming: boolean | null
          tags: string[] | null
          timeout_seconds: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          allows_batch_processing?: boolean | null
          category: string
          command_name: string
          complexity_score?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          estimated_cost_usd?: number | null
          example_inputs?: string[] | null
          fallback_command_id?: string | null
          id?: string
          intent_keywords?: string[] | null
          is_active?: boolean | null
          max_batch_size?: number | null
          max_parallel_executions?: number | null
          natural_language_patterns?: string[] | null
          parameters_schema?: Json | null
          required_integrations?: string[] | null
          requires_admin?: boolean | null
          requires_streaming?: boolean | null
          tags?: string[] | null
          timeout_seconds?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          allows_batch_processing?: boolean | null
          category?: string
          command_name?: string
          complexity_score?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          estimated_cost_usd?: number | null
          example_inputs?: string[] | null
          fallback_command_id?: string | null
          id?: string
          intent_keywords?: string[] | null
          is_active?: boolean | null
          max_batch_size?: number | null
          max_parallel_executions?: number | null
          natural_language_patterns?: string[] | null
          parameters_schema?: Json | null
          required_integrations?: string[] | null
          requires_admin?: boolean | null
          requires_streaming?: boolean | null
          tags?: string[] | null
          timeout_seconds?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_commands_fallback_command_id_fkey"
            columns: ["fallback_command_id"]
            isOneToOne: false
            referencedRelation: "ai_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_sources: {
        Row: {
          connection_config: Json
          consecutive_failures: number | null
          content_types: string[] | null
          created_at: string | null
          created_by: string | null
          display_name: string
          health_check_interval_hours: number | null
          id: string
          is_active: boolean | null
          is_healthy: boolean | null
          items_failed_last_run: number | null
          items_synced_last_run: number | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          max_items_per_sync: number | null
          processing_pipeline: Json | null
          quality_filters: Json | null
          source_name: string
          source_type: string
          sync_frequency_hours: number | null
          updated_at: string | null
        }
        Insert: {
          connection_config: Json
          consecutive_failures?: number | null
          content_types?: string[] | null
          created_at?: string | null
          created_by?: string | null
          display_name: string
          health_check_interval_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_healthy?: boolean | null
          items_failed_last_run?: number | null
          items_synced_last_run?: number | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          max_items_per_sync?: number | null
          processing_pipeline?: Json | null
          quality_filters?: Json | null
          source_name: string
          source_type: string
          sync_frequency_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          connection_config?: Json
          consecutive_failures?: number | null
          content_types?: string[] | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          health_check_interval_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_healthy?: boolean | null
          items_failed_last_run?: number | null
          items_synced_last_run?: number | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          max_items_per_sync?: number | null
          processing_pipeline?: Json | null
          quality_filters?: Json | null
          source_name?: string
          source_type?: string
          sync_frequency_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_content_sync_logs: {
        Row: {
          api_calls_made: number | null
          completed_at: string | null
          data_transferred_bytes: number | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          failed_items: Json | null
          id: string
          items_failed: number | null
          items_processed: number | null
          items_skipped: number | null
          items_succeeded: number | null
          source_id: string
          started_at: string | null
          status: string
          sync_type: string
        }
        Insert: {
          api_calls_made?: number | null
          completed_at?: string | null
          data_transferred_bytes?: number | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          failed_items?: Json | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          items_skipped?: number | null
          items_succeeded?: number | null
          source_id: string
          started_at?: string | null
          status: string
          sync_type?: string
        }
        Update: {
          api_calls_made?: number | null
          completed_at?: string | null
          data_transferred_bytes?: number | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          failed_items?: Json | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          items_skipped?: number | null
          items_succeeded?: number | null
          source_id?: string
          started_at?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_sync_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ai_content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_integration_logs: {
        Row: {
          command_execution_id: string | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          integration_id: string
          operation_type: string
          request_method: string | null
          request_payload: Json | null
          request_url: string | null
          response_body: Json | null
          response_status: number | null
          response_time_ms: number | null
          success: boolean
          triggered_by: string | null
        }
        Insert: {
          command_execution_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          integration_id: string
          operation_type: string
          request_method?: string | null
          request_payload?: Json | null
          request_url?: string | null
          response_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success: boolean
          triggered_by?: string | null
        }
        Update: {
          command_execution_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string
          operation_type?: string
          request_method?: string | null
          request_payload?: Json | null
          request_url?: string | null
          response_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_integration_logs_command_execution_id_fkey"
            columns: ["command_execution_id"]
            isOneToOne: false
            referencedRelation: "ai_command_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "ai_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_integrations: {
        Row: {
          auth_config: Json | null
          auth_type: string | null
          avg_response_time_ms: number | null
          connection_config: Json | null
          consecutive_failures: number | null
          created_at: string | null
          data_types: string[] | null
          display_name: string
          endpoint_url: string | null
          health_check_interval_minutes: number | null
          health_check_url: string | null
          health_status: string | null
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean | null
          is_critical: boolean | null
          last_health_check: string | null
          last_used_at: string | null
          rate_limits: Json | null
          supported_operations: string[] | null
          total_failures: number | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: string | null
          avg_response_time_ms?: number | null
          connection_config?: Json | null
          consecutive_failures?: number | null
          created_at?: string | null
          data_types?: string[] | null
          display_name: string
          endpoint_url?: string | null
          health_check_interval_minutes?: number | null
          health_check_url?: string | null
          health_status?: string | null
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean | null
          is_critical?: boolean | null
          last_health_check?: string | null
          last_used_at?: string | null
          rate_limits?: Json | null
          supported_operations?: string[] | null
          total_failures?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          auth_config?: Json | null
          auth_type?: string | null
          avg_response_time_ms?: number | null
          connection_config?: Json | null
          consecutive_failures?: number | null
          created_at?: string | null
          data_types?: string[] | null
          display_name?: string
          endpoint_url?: string | null
          health_check_interval_minutes?: number | null
          health_check_url?: string | null
          health_status?: string | null
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean | null
          is_critical?: boolean | null
          last_health_check?: string | null
          last_used_at?: string | null
          rate_limits?: Json | null
          supported_operations?: string[] | null
          total_failures?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_learned_patterns: {
        Row: {
          confidence_score: number
          created_at: string | null
          evidence_count: number | null
          id: string
          is_active: boolean | null
          last_evidence_date: string | null
          learned_from_source: string | null
          pattern_category: string
          pattern_data: Json
          pattern_description: string
          pattern_type: string
          success_rate: number | null
          supporting_executions: string[] | null
          times_applied: number | null
          times_successful: number | null
          updated_at: string | null
        }
        Insert: {
          confidence_score: number
          created_at?: string | null
          evidence_count?: number | null
          id?: string
          is_active?: boolean | null
          last_evidence_date?: string | null
          learned_from_source?: string | null
          pattern_category: string
          pattern_data: Json
          pattern_description: string
          pattern_type: string
          success_rate?: number | null
          supporting_executions?: string[] | null
          times_applied?: number | null
          times_successful?: number | null
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          evidence_count?: number | null
          id?: string
          is_active?: boolean | null
          last_evidence_date?: string | null
          learned_from_source?: string | null
          pattern_category?: string
          pattern_data?: Json
          pattern_description?: string
          pattern_type?: string
          success_rate?: number | null
          supporting_executions?: string[] | null
          times_applied?: number | null
          times_successful?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          avg_response_time_ms: number | null
          context_length: number | null
          created_at: string | null
          deprecation_date: string | null
          description: string | null
          display_name: string | null
          id: string
          input_cost_per_1k_tokens: number | null
          is_active: boolean | null
          is_deprecated: boolean | null
          max_tokens: number | null
          model_name: string
          model_type: string
          output_cost_per_1k_tokens: number | null
          provider_id: string
          quality_score: number | null
          reliability_score: number | null
          supports_json_mode: boolean | null
          supports_tools: boolean | null
          total_cost_usd: number | null
          total_requests: number | null
          total_tokens_processed: number | null
          training_cutoff_date: string | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          context_length?: number | null
          created_at?: string | null
          deprecation_date?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          input_cost_per_1k_tokens?: number | null
          is_active?: boolean | null
          is_deprecated?: boolean | null
          max_tokens?: number | null
          model_name: string
          model_type: string
          output_cost_per_1k_tokens?: number | null
          provider_id: string
          quality_score?: number | null
          reliability_score?: number | null
          supports_json_mode?: boolean | null
          supports_tools?: boolean | null
          total_cost_usd?: number | null
          total_requests?: number | null
          total_tokens_processed?: number | null
          training_cutoff_date?: string | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_ms?: number | null
          context_length?: number | null
          created_at?: string | null
          deprecation_date?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          input_cost_per_1k_tokens?: number | null
          is_active?: boolean | null
          is_deprecated?: boolean | null
          max_tokens?: number | null
          model_name?: string
          model_type?: string
          output_cost_per_1k_tokens?: number | null
          provider_id?: string
          quality_score?: number | null
          reliability_score?: number | null
          supports_json_mode?: boolean | null
          supports_tools?: boolean | null
          total_cost_usd?: number | null
          total_requests?: number | null
          total_tokens_processed?: number | null
          training_cutoff_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance_metrics: {
        Row: {
          aggregation_type: string | null
          command_id: string | null
          component: string | null
          id: string
          measured_at: string | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          provider_id: string | null
          sample_count: number | null
          time_window_minutes: number | null
        }
        Insert: {
          aggregation_type?: string | null
          command_id?: string | null
          component?: string | null
          id?: string
          measured_at?: string | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          provider_id?: string | null
          sample_count?: number | null
          time_window_minutes?: number | null
        }
        Update: {
          aggregation_type?: string | null
          command_id?: string | null
          component?: string | null
          id?: string
          measured_at?: string | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          provider_id?: string | null
          sample_count?: number | null
          time_window_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_performance_metrics_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "ai_commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_performance_metrics_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          avg_execution_time_ms: number | null
          bad_examples: Json | null
          cost_per_execution: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string | null
          fallback_prompt_id: string | null
          good_examples: Json | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model_config: Json | null
          parameters: string[] | null
          parameters_schema: Json | null
          prompt_name: string
          prompt_template: string
          prompt_type: string
          provider: string | null
          required_model_capabilities: string[] | null
          response_format: string | null
          success_rate: number | null
          system_message: string | null
          tags: string[] | null
          temperature: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          avg_execution_time_ms?: number | null
          bad_examples?: Json | null
          cost_per_execution?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          fallback_prompt_id?: string | null
          good_examples?: Json | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_config?: Json | null
          parameters?: string[] | null
          parameters_schema?: Json | null
          prompt_name: string
          prompt_template: string
          prompt_type: string
          provider?: string | null
          required_model_capabilities?: string[] | null
          response_format?: string | null
          success_rate?: number | null
          system_message?: string | null
          tags?: string[] | null
          temperature?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          avg_execution_time_ms?: number | null
          bad_examples?: Json | null
          cost_per_execution?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          fallback_prompt_id?: string | null
          good_examples?: Json | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_config?: Json | null
          parameters?: string[] | null
          parameters_schema?: Json | null
          prompt_name?: string
          prompt_template?: string
          prompt_type?: string
          provider?: string | null
          required_model_capabilities?: string[] | null
          response_format?: string | null
          success_rate?: number | null
          system_message?: string | null
          tags?: string[] | null
          temperature?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_fallback_prompt_id_fkey"
            columns: ["fallback_prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          auth_config: Json | null
          auth_type: string
          base_url: string | null
          created_at: string | null
          description: string | null
          display_name: string
          health_status: string | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          max_context_length: number | null
          max_output_tokens: number | null
          provider_name: string
          requests_per_day: number | null
          requests_per_minute: number | null
          supports_embeddings: boolean | null
          supports_function_calling: boolean | null
          supports_streaming: boolean | null
          supports_vision: boolean | null
          tokens_per_minute: number | null
          updated_at: string | null
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: string
          base_url?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          max_context_length?: number | null
          max_output_tokens?: number | null
          provider_name: string
          requests_per_day?: number | null
          requests_per_minute?: number | null
          supports_embeddings?: boolean | null
          supports_function_calling?: boolean | null
          supports_streaming?: boolean | null
          supports_vision?: boolean | null
          tokens_per_minute?: number | null
          updated_at?: string | null
        }
        Update: {
          auth_config?: Json | null
          auth_type?: string
          base_url?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          max_context_length?: number | null
          max_output_tokens?: number | null
          provider_name?: string
          requests_per_day?: number | null
          requests_per_minute?: number | null
          supports_embeddings?: boolean | null
          supports_function_calling?: boolean | null
          supports_streaming?: boolean | null
          supports_vision?: boolean | null
          tokens_per_minute?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_quality_gates: {
        Row: {
          auto_retry: boolean | null
          cache_duration_hours: number | null
          cache_results: boolean | null
          content_types: string[]
          created_at: string | null
          description: string | null
          display_name: string
          execution_order: number | null
          external_validators: string[] | null
          gate_name: string
          id: string
          is_active: boolean | null
          is_blocking: boolean | null
          max_retries: number | null
          threshold_config: Json | null
          timeout_seconds: number | null
          updated_at: string | null
          validation_rules: Json
          validator_class: string | null
        }
        Insert: {
          auto_retry?: boolean | null
          cache_duration_hours?: number | null
          cache_results?: boolean | null
          content_types: string[]
          created_at?: string | null
          description?: string | null
          display_name: string
          execution_order?: number | null
          external_validators?: string[] | null
          gate_name: string
          id?: string
          is_active?: boolean | null
          is_blocking?: boolean | null
          max_retries?: number | null
          threshold_config?: Json | null
          timeout_seconds?: number | null
          updated_at?: string | null
          validation_rules: Json
          validator_class?: string | null
        }
        Update: {
          auto_retry?: boolean | null
          cache_duration_hours?: number | null
          cache_results?: boolean | null
          content_types?: string[]
          created_at?: string | null
          description?: string | null
          display_name?: string
          execution_order?: number | null
          external_validators?: string[] | null
          gate_name?: string
          id?: string
          is_active?: boolean | null
          is_blocking?: boolean | null
          max_retries?: number | null
          threshold_config?: Json | null
          timeout_seconds?: number | null
          updated_at?: string | null
          validation_rules?: Json
          validator_class?: string | null
        }
        Relationships: []
      }
      ai_quality_validations: {
        Row: {
          auto_fixes_applied: string[] | null
          brand_voice_score: number | null
          civic_engagement_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          external_calls_made: number | null
          factual_accuracy_score: number | null
          gate_id: string
          id: string
          issues_found: string[] | null
          overall_score: number | null
          passed: boolean
          readability_score: number | null
          recommendations: string[] | null
          validation_input: Json | null
          validation_result: Json
          validation_time_ms: number | null
        }
        Insert: {
          auto_fixes_applied?: string[] | null
          brand_voice_score?: number | null
          civic_engagement_score?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          external_calls_made?: number | null
          factual_accuracy_score?: number | null
          gate_id: string
          id?: string
          issues_found?: string[] | null
          overall_score?: number | null
          passed: boolean
          readability_score?: number | null
          recommendations?: string[] | null
          validation_input?: Json | null
          validation_result: Json
          validation_time_ms?: number | null
        }
        Update: {
          auto_fixes_applied?: string[] | null
          brand_voice_score?: number | null
          civic_engagement_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          external_calls_made?: number | null
          factual_accuracy_score?: number | null
          gate_id?: string
          id?: string
          issues_found?: string[] | null
          overall_score?: number | null
          passed?: boolean
          readability_score?: number | null
          recommendations?: string[] | null
          validation_input?: Json | null
          validation_result?: Json
          validation_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_quality_validations_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "ai_quality_gates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_security_audit_log: {
        Row: {
          automated_response: string | null
          command_id: string | null
          created_at: string | null
          event_data: Json | null
          event_description: string
          event_type: string
          id: string
          ip_address: unknown | null
          review_notes: string | null
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_score: number | null
          session_id: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          automated_response?: string | null
          command_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          review_notes?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number | null
          session_id?: string | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          automated_response?: string | null
          command_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          review_notes?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_security_audit_log_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "ai_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_stream_messages: {
        Row: {
          action_id: string | null
          created_at: string | null
          id: string
          message_content: Json
          message_type: string
          processing_time_ms: number | null
          sequence_number: number
          step_name: string | null
          stream_id: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          message_content: Json
          message_type: string
          processing_time_ms?: number | null
          sequence_number: number
          step_name?: string | null
          stream_id: string
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          id?: string
          message_content?: Json
          message_type?: string
          processing_time_ms?: number | null
          sequence_number?: number
          step_name?: string | null
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_stream_messages_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "ai_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_stream_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "ai_command_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_system_alerts: {
        Row: {
          alert_level: string
          alert_type: string
          assigned_to: string | null
          component: string | null
          description: string
          escalation_level: number | null
          first_detected_at: string | null
          id: string
          last_occurrence_at: string | null
          metric_name: string | null
          metric_value: number | null
          notification_channels: string[] | null
          notification_sent: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          threshold_value: number | null
          title: string
        }
        Insert: {
          alert_level: string
          alert_type: string
          assigned_to?: string | null
          component?: string | null
          description: string
          escalation_level?: number | null
          first_detected_at?: string | null
          id?: string
          last_occurrence_at?: string | null
          metric_name?: string | null
          metric_value?: number | null
          notification_channels?: string[] | null
          notification_sent?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          threshold_value?: number | null
          title: string
        }
        Update: {
          alert_level?: string
          alert_type?: string
          assigned_to?: string | null
          component?: string | null
          description?: string
          escalation_level?: number | null
          first_detected_at?: string | null
          id?: string
          last_occurrence_at?: string | null
          metric_name?: string | null
          metric_value?: number | null
          notification_channels?: string[] | null
          notification_sent?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          threshold_value?: number | null
          title?: string
        }
        Relationships: []
      }
      ai_user_command_history: {
        Row: {
          command_category: string | null
          command_execution_id: string | null
          command_intent: string | null
          created_at: string | null
          device_context: Json | null
          followed_up: boolean | null
          id: string
          original_input: string | null
          session_context: Json | null
          shared_result: boolean | null
          time_to_execute_ms: number | null
          user_feedback: string | null
          user_id: string
          user_location_at_time: Json | null
          user_modified_output: boolean | null
          user_satisfaction_score: number | null
        }
        Insert: {
          command_category?: string | null
          command_execution_id?: string | null
          command_intent?: string | null
          created_at?: string | null
          device_context?: Json | null
          followed_up?: boolean | null
          id?: string
          original_input?: string | null
          session_context?: Json | null
          shared_result?: boolean | null
          time_to_execute_ms?: number | null
          user_feedback?: string | null
          user_id: string
          user_location_at_time?: Json | null
          user_modified_output?: boolean | null
          user_satisfaction_score?: number | null
        }
        Update: {
          command_category?: string | null
          command_execution_id?: string | null
          command_intent?: string | null
          created_at?: string | null
          device_context?: Json | null
          followed_up?: boolean | null
          id?: string
          original_input?: string | null
          session_context?: Json | null
          shared_result?: boolean | null
          time_to_execute_ms?: number | null
          user_feedback?: string | null
          user_id?: string
          user_location_at_time?: Json | null
          user_modified_output?: boolean | null
          user_satisfaction_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_user_command_history_command_execution_id_fkey"
            columns: ["command_execution_id"]
            isOneToOne: false
            referencedRelation: "ai_command_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_user_preferences: {
        Row: {
          allow_data_collection: boolean | null
          allow_personalization: boolean | null
          allow_usage_analytics: boolean | null
          city: string | null
          congressional_district: string | null
          content_difficulty_preference: string | null
          created_at: string | null
          enable_streaming: boolean | null
          id: string
          language_preference: string | null
          learning_style: string | null
          max_response_time_seconds: number | null
          pace_preference: string | null
          preferred_ai_provider: string | null
          preferred_content_types: string[] | null
          preferred_response_style: string | null
          state: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          allow_data_collection?: boolean | null
          allow_personalization?: boolean | null
          allow_usage_analytics?: boolean | null
          city?: string | null
          congressional_district?: string | null
          content_difficulty_preference?: string | null
          created_at?: string | null
          enable_streaming?: boolean | null
          id?: string
          language_preference?: string | null
          learning_style?: string | null
          max_response_time_seconds?: number | null
          pace_preference?: string | null
          preferred_ai_provider?: string | null
          preferred_content_types?: string[] | null
          preferred_response_style?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          allow_data_collection?: boolean | null
          allow_personalization?: boolean | null
          allow_usage_analytics?: boolean | null
          city?: string | null
          congressional_district?: string | null
          content_difficulty_preference?: string | null
          created_at?: string | null
          enable_streaming?: boolean | null
          id?: string
          language_preference?: string | null
          learning_style?: string | null
          max_response_time_seconds?: number | null
          pace_preference?: string | null
          preferred_ai_provider?: string | null
          preferred_content_types?: string[] | null
          preferred_response_style?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      ai_workflow_instances: {
        Row: {
          created_at: string | null
          custom_config: Json | null
          id: string
          instance_name: string | null
          last_execution_id: string | null
          last_run_at: string | null
          last_run_status: string | null
          next_run_at: string | null
          owner_id: string
          parameters: Json | null
          schedule_expression: string | null
          schedule_timezone: string | null
          shared_with_users: string[] | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          instance_name?: string | null
          last_execution_id?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          next_run_at?: string | null
          owner_id: string
          parameters?: Json | null
          schedule_expression?: string | null
          schedule_timezone?: string | null
          shared_with_users?: string[] | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          instance_name?: string | null
          last_execution_id?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          next_run_at?: string | null
          owner_id?: string
          parameters?: Json | null
          schedule_expression?: string | null
          schedule_timezone?: string | null
          shared_with_users?: string[] | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_workflow_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflow_templates: {
        Row: {
          author_id: string | null
          avg_execution_time_ms: number | null
          avg_success_rate: number | null
          category: string
          created_at: string | null
          description: string | null
          display_name: string
          estimated_duration_seconds: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_template: boolean | null
          output_schema: Json | null
          parameter_schema: Json | null
          required_integrations: string[] | null
          required_permissions: string[] | null
          resource_requirements: Json | null
          tags: string[] | null
          template_config: Json
          template_name: string
          updated_at: string | null
          usage_count: number | null
          version: string | null
        }
        Insert: {
          author_id?: string | null
          avg_execution_time_ms?: number | null
          avg_success_rate?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          display_name: string
          estimated_duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_template?: boolean | null
          output_schema?: Json | null
          parameter_schema?: Json | null
          required_integrations?: string[] | null
          required_permissions?: string[] | null
          resource_requirements?: Json | null
          tags?: string[] | null
          template_config: Json
          template_name: string
          updated_at?: string | null
          usage_count?: number | null
          version?: string | null
        }
        Update: {
          author_id?: string | null
          avg_execution_time_ms?: number | null
          avg_success_rate?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          estimated_duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_template?: boolean | null
          output_schema?: Json | null
          parameter_schema?: Json | null
          required_integrations?: string[] | null
          required_permissions?: string[] | null
          resource_requirements?: Json | null
          tags?: string[] | null
          template_config?: Json
          template_name?: string
          updated_at?: string | null
          usage_count?: number | null
          version?: string | null
        }
        Relationships: []
      }
      content_analysis_cache: {
        Row: {
          analysis_result: Json
          analysis_type: string
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string
          expires_at: string | null
          id: string
          model_version: string | null
        }
        Insert: {
          analysis_result: Json
          analysis_type: string
          confidence_score?: number | null
          content_id: string
          content_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          model_version?: string | null
        }
        Update: {
          analysis_result?: Json
          analysis_type?: string
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          model_version?: string | null
        }
        Relationships: []
      }
      conversation_analysis: {
        Row: {
          analysis_results: Json
          analysis_timestamp: string | null
          analysis_type: string
          applied_improvements: boolean | null
          confidence_score: number | null
          conversation_id: string
          created_at: string | null
          id: string
          improvement_suggestions: string[] | null
          insights_generated: string[] | null
          metadata: Json | null
        }
        Insert: {
          analysis_results?: Json
          analysis_timestamp?: string | null
          analysis_type: string
          applied_improvements?: boolean | null
          confidence_score?: number | null
          conversation_id: string
          created_at?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          insights_generated?: string[] | null
          metadata?: Json | null
        }
        Update: {
          analysis_results?: Json
          analysis_timestamp?: string | null
          analysis_type?: string
          applied_improvements?: boolean | null
          confidence_score?: number | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          insights_generated?: string[] | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analysis_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_analytics: {
        Row: {
          agent_type: string
          conversation_duration_seconds: number | null
          conversation_id: string
          conversation_outcome: string | null
          created_at: string | null
          id: string
          resolution_status: string | null
          topics_covered: string[] | null
          total_messages: number | null
          total_tokens_used: number | null
          user_satisfaction_score: number | null
        }
        Insert: {
          agent_type: string
          conversation_duration_seconds?: number | null
          conversation_id: string
          conversation_outcome?: string | null
          created_at?: string | null
          id?: string
          resolution_status?: string | null
          topics_covered?: string[] | null
          total_messages?: number | null
          total_tokens_used?: number | null
          user_satisfaction_score?: number | null
        }
        Update: {
          agent_type?: string
          conversation_duration_seconds?: number | null
          conversation_id?: string
          conversation_outcome?: string | null
          created_at?: string | null
          id?: string
          resolution_status?: string | null
          topics_covered?: string[] | null
          total_messages?: number | null
          total_tokens_used?: number | null
          user_satisfaction_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_context: {
        Row: {
          context_key: string
          context_value: Json
          conversation_id: string
          created_at: string
          expires_at: string | null
          id: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          context_key: string
          context_value: Json
          conversation_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          context_key?: string
          context_value?: Json
          conversation_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_context_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_flow_instances: {
        Row: {
          completed_at: string | null
          conversation_id: string
          current_step: number | null
          flow_id: string
          flow_state: string | null
          id: string
          satisfaction_score: number | null
          started_at: string
          step_data: Json | null
        }
        Insert: {
          completed_at?: string | null
          conversation_id: string
          current_step?: number | null
          flow_id: string
          flow_state?: string | null
          id?: string
          satisfaction_score?: number | null
          started_at?: string
          step_data?: Json | null
        }
        Update: {
          completed_at?: string | null
          conversation_id?: string
          current_step?: number | null
          flow_id?: string
          flow_state?: string | null
          id?: string
          satisfaction_score?: number | null
          started_at?: string
          step_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_flow_instances_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_flow_instances_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "conversation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_flows: {
        Row: {
          created_at: string
          expected_outcomes: Json | null
          flow_description: string | null
          flow_name: string
          flow_steps: Json
          id: string
          is_active: boolean | null
          success_criteria: Json | null
          success_rate: number | null
          trigger_conditions: Json
          typical_duration_minutes: number | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          expected_outcomes?: Json | null
          flow_description?: string | null
          flow_name: string
          flow_steps: Json
          id?: string
          is_active?: boolean | null
          success_criteria?: Json | null
          success_rate?: number | null
          trigger_conditions: Json
          typical_duration_minutes?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          expected_outcomes?: Json | null
          flow_description?: string | null
          flow_name?: string
          flow_steps?: Json
          id?: string
          is_active?: boolean | null
          success_criteria?: Json | null
          success_rate?: number | null
          trigger_conditions?: Json
          typical_duration_minutes?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_model: string | null
          agent_type: string
          conversation_context: Json
          conversation_mode: string | null
          conversation_state: string | null
          conversation_summary: string | null
          created_at: string
          current_topic: string | null
          ended_at: string | null
          id: string
          next_suggested_actions: Json | null
          session_id: string
          started_at: string
          total_messages: number | null
          total_tokens_used: number | null
          user_id: string | null
          user_satisfaction_score: number | null
        }
        Insert: {
          agent_model?: string | null
          agent_type: string
          conversation_context?: Json
          conversation_mode?: string | null
          conversation_state?: string | null
          conversation_summary?: string | null
          created_at?: string
          current_topic?: string | null
          ended_at?: string | null
          id?: string
          next_suggested_actions?: Json | null
          session_id: string
          started_at?: string
          total_messages?: number | null
          total_tokens_used?: number | null
          user_id?: string | null
          user_satisfaction_score?: number | null
        }
        Update: {
          agent_model?: string | null
          agent_type?: string
          conversation_context?: Json
          conversation_mode?: string | null
          conversation_state?: string | null
          conversation_summary?: string | null
          created_at?: string
          current_topic?: string | null
          ended_at?: string | null
          id?: string
          next_suggested_actions?: Json | null
          session_id?: string
          started_at?: string
          total_messages?: number | null
          total_tokens_used?: number | null
          user_id?: string | null
          user_satisfaction_score?: number | null
        }
        Relationships: []
      }
      database_context: {
        Row: {
          analysis_summary: string | null
          context_data: Json
          context_type: string
          created_at: string
          id: string
          insights: Json | null
          is_current: boolean | null
          version: number
        }
        Insert: {
          analysis_summary?: string | null
          context_data: Json
          context_type: string
          created_at?: string
          id?: string
          insights?: Json | null
          is_current?: boolean | null
          version?: number
        }
        Update: {
          analysis_summary?: string | null
          context_data?: Json
          context_type?: string
          created_at?: string
          id?: string
          insights?: Json | null
          is_current?: boolean | null
          version?: number
        }
        Relationships: []
      }
      fallback_responses: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_used: string | null
          response_data: Json | null
          response_template: string
          response_type: string
          trigger_pattern: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          response_data?: Json | null
          response_template: string
          response_type: string
          trigger_pattern: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          response_data?: Json | null
          response_template?: string
          response_type?: string
          trigger_pattern?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          approval_status: string | null
          content_category: string | null
          created_at: string
          created_by: string | null
          generated_content: Json
          generation_parameters: Json | null
          generation_time_ms: number | null
          generation_type: string
          human_feedback: string | null
          human_review_status: string | null
          id: string
          model_used: string | null
          prompt_template: string | null
          published: boolean | null
          published_id: string | null
          quality_scores: Json | null
          source_reference: string | null
        }
        Insert: {
          approval_status?: string | null
          content_category?: string | null
          created_at?: string
          created_by?: string | null
          generated_content: Json
          generation_parameters?: Json | null
          generation_time_ms?: number | null
          generation_type: string
          human_feedback?: string | null
          human_review_status?: string | null
          id?: string
          model_used?: string | null
          prompt_template?: string | null
          published?: boolean | null
          published_id?: string | null
          quality_scores?: Json | null
          source_reference?: string | null
        }
        Update: {
          approval_status?: string | null
          content_category?: string | null
          created_at?: string
          created_by?: string | null
          generated_content?: Json
          generation_parameters?: Json | null
          generation_time_ms?: number | null
          generation_type?: string
          human_feedback?: string | null
          human_review_status?: string | null
          id?: string
          model_used?: string | null
          prompt_template?: string | null
          published?: boolean | null
          published_id?: string | null
          quality_scores?: Json | null
          source_reference?: string | null
        }
        Relationships: []
      }
      intent_patterns: {
        Row: {
          confidence_threshold: number | null
          created_at: string
          id: string
          intent_name: string
          is_active: boolean | null
          pattern_text: string
          pattern_type: string
          required_context: Json | null
          success_rate: number | null
          suggested_actions: Json | null
          typical_responses: Json | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          confidence_threshold?: number | null
          created_at?: string
          id?: string
          intent_name: string
          is_active?: boolean | null
          pattern_text: string
          pattern_type: string
          required_context?: Json | null
          success_rate?: number | null
          suggested_actions?: Json | null
          typical_responses?: Json | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          confidence_threshold?: number | null
          created_at?: string
          id?: string
          intent_name?: string
          is_active?: boolean | null
          pattern_text?: string
          pattern_type?: string
          required_context?: Json | null
          success_rate?: number | null
          suggested_actions?: Json | null
          typical_responses?: Json | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      knowledge_graph: {
        Row: {
          created_at: string
          discovered_by: string | null
          id: string
          metadata: Json | null
          relationship_strength: number | null
          relationship_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          discovered_by?: string | null
          id?: string
          metadata?: Json | null
          relationship_strength?: number | null
          relationship_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          discovered_by?: string | null
          id?: string
          metadata?: Json | null
          relationship_strength?: number | null
          relationship_type?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      learned_patterns: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          is_active: boolean | null
          last_applied: string | null
          learned_from_source: string | null
          pattern_category: string
          pattern_description: string
          pattern_type: string
          supporting_evidence: Json
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          confidence_score: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_applied?: string | null
          learned_from_source?: string | null
          pattern_category: string
          pattern_description: string
          pattern_type: string
          supporting_evidence?: Json
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_applied?: string | null
          learned_from_source?: string | null
          pattern_category?: string
          pattern_description?: string
          pattern_type?: string
          supporting_evidence?: Json
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      memory_clusters: {
        Row: {
          cluster_name: string
          cluster_type: string
          confidence_score: number | null
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          knowledge_items: Json
          last_accessed: string | null
          metadata: Json | null
          related_patterns: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          cluster_name: string
          cluster_type: string
          confidence_score?: number | null
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          knowledge_items?: Json
          last_accessed?: string | null
          metadata?: Json | null
          related_patterns?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          cluster_name?: string
          cluster_type?: string
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          knowledge_items?: Json
          last_accessed?: string | null
          metadata?: Json | null
          related_patterns?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      memory_consolidation: {
        Row: {
          cleanup_actions_taken: Json | null
          completed_at: string | null
          consolidation_date: string
          consolidation_type: string
          created_at: string
          id: string
          insights_generated: Json | null
          items_processed: number | null
          patterns_discovered: number | null
          processing_time_ms: number | null
          status: string | null
        }
        Insert: {
          cleanup_actions_taken?: Json | null
          completed_at?: string | null
          consolidation_date: string
          consolidation_type: string
          created_at?: string
          id?: string
          insights_generated?: Json | null
          items_processed?: number | null
          patterns_discovered?: number | null
          processing_time_ms?: number | null
          status?: string | null
        }
        Update: {
          cleanup_actions_taken?: Json | null
          completed_at?: string | null
          consolidation_date?: string
          consolidation_type?: string
          created_at?: string
          id?: string
          insights_generated?: Json | null
          items_processed?: number | null
          patterns_discovered?: number | null
          processing_time_ms?: number | null
          status?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          action_completed: boolean | null
          confidence_score: number | null
          content: string
          conversation_id: string
          created_at: string
          error_details: Json | null
          id: string
          intent_detected: string | null
          message_type: string | null
          metadata: Json | null
          parent_message_id: string | null
          processing_time_ms: number | null
          related_messages: string[] | null
          requires_action: boolean | null
          role: string
          tokens_used: number | null
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          action_completed?: boolean | null
          confidence_score?: number | null
          content: string
          conversation_id: string
          created_at?: string
          error_details?: Json | null
          id?: string
          intent_detected?: string | null
          message_type?: string | null
          metadata?: Json | null
          parent_message_id?: string | null
          processing_time_ms?: number | null
          related_messages?: string[] | null
          requires_action?: boolean | null
          role: string
          tokens_used?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          action_completed?: boolean | null
          confidence_score?: number | null
          content?: string
          conversation_id?: string
          created_at?: string
          error_details?: Json | null
          id?: string
          intent_detected?: string | null
          message_type?: string | null
          metadata?: Json | null
          parent_message_id?: string | null
          processing_time_ms?: number | null
          related_messages?: string[] | null
          requires_action?: boolean | null
          role?: string
          tokens_used?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      patterns: {
        Row: {
          confidence: number | null
          created_at: string | null
          description: string
          evidence: Json | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          model_version: string
          outcomes: Json | null
          pattern_category: string
          pattern_type: string
          source: string
          success_rate: number | null
          triggers: Json | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          description: string
          evidence?: Json | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          model_version: string
          outcomes?: Json | null
          pattern_category: string
          pattern_type: string
          source: string
          success_rate?: number | null
          triggers?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          description?: string
          evidence?: Json | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          model_version?: string
          outcomes?: Json | null
          pattern_category?: string
          pattern_type?: string
          source?: string
          success_rate?: number | null
          triggers?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          agent_type: string
          avg_response_time_ms: number | null
          failed_requests: number | null
          fallback_requests: number | null
          id: string
          metric_date: string
          quality_metrics: Json | null
          successful_requests: number | null
          total_cost_usd: number | null
          total_requests: number | null
          total_tokens_used: number | null
        }
        Insert: {
          agent_type: string
          avg_response_time_ms?: number | null
          failed_requests?: number | null
          fallback_requests?: number | null
          id?: string
          metric_date: string
          quality_metrics?: Json | null
          successful_requests?: number | null
          total_cost_usd?: number | null
          total_requests?: number | null
          total_tokens_used?: number | null
        }
        Update: {
          agent_type?: string
          avg_response_time_ms?: number | null
          failed_requests?: number | null
          fallback_requests?: number | null
          id?: string
          metric_date?: string
          quality_metrics?: Json | null
          successful_requests?: number | null
          total_cost_usd?: number | null
          total_requests?: number | null
          total_tokens_used?: number | null
        }
        Relationships: []
      }
      response_templates: {
        Row: {
          agent_type: string | null
          complexity_level: number | null
          created_at: string
          effectiveness_score: number | null
          id: string
          is_active: boolean | null
          template_category: string
          template_content: string
          template_name: string
          template_variables: Json | null
          tone: string | null
          trigger_conditions: Json
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          agent_type?: string | null
          complexity_level?: number | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          template_category: string
          template_content: string
          template_name: string
          template_variables?: Json | null
          tone?: string | null
          trigger_conditions?: Json
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          agent_type?: string | null
          complexity_level?: number | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          template_category?: string
          template_content?: string
          template_name?: string
          template_variables?: Json | null
          tone?: string | null
          trigger_conditions?: Json
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      system_health: {
        Row: {
          checked_at: string | null
          component: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          status: string | null
        }
        Insert: {
          checked_at?: string | null
          component: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          status?: string | null
        }
        Update: {
          checked_at?: string | null
          component?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          status?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          component: string
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_timestamp: string | null
          metric_unit: string | null
          metric_value: number
        }
        Insert: {
          component: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_timestamp?: string | null
          metric_unit?: string | null
          metric_value: number
        }
        Update: {
          component?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_timestamp?: string | null
          metric_unit?: string | null
          metric_value?: number
        }
        Relationships: []
      }
      tool_usage_patterns: {
        Row: {
          created_at: string
          execution_time_avg_ms: number | null
          id: string
          is_recommended: boolean | null
          last_used: string | null
          learned_optimizations: Json | null
          success_indicators: Json | null
          success_rate: number | null
          tool_name: string
          typical_parameters: Json | null
          updated_at: string
          usage_context: Json
          usage_count: number | null
          user_satisfaction_avg: number | null
        }
        Insert: {
          created_at?: string
          execution_time_avg_ms?: number | null
          id?: string
          is_recommended?: boolean | null
          last_used?: string | null
          learned_optimizations?: Json | null
          success_indicators?: Json | null
          success_rate?: number | null
          tool_name: string
          typical_parameters?: Json | null
          updated_at?: string
          usage_context: Json
          usage_count?: number | null
          user_satisfaction_avg?: number | null
        }
        Update: {
          created_at?: string
          execution_time_avg_ms?: number | null
          id?: string
          is_recommended?: boolean | null
          last_used?: string | null
          learned_optimizations?: Json | null
          success_indicators?: Json | null
          success_rate?: number | null
          tool_name?: string
          typical_parameters?: Json | null
          updated_at?: string
          usage_context?: Json
          usage_count?: number | null
          user_satisfaction_avg?: number | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          last_confirmed_at: string | null
          learned_from_interactions: number | null
          preference_type: string
          preference_value: Json
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          last_confirmed_at?: string | null
          learned_from_interactions?: number | null
          preference_type: string
          preference_value: Json
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          last_confirmed_at?: string | null
          learned_from_interactions?: number | null
          preference_type?: string
          preference_value?: Json
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_resolve_issues: {
        Args: Record<PropertyKey, never>
        Returns: {
          issue_resolved: string
          resolution_details: string
          confidence_score: number
        }[]
      }
      check_system_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          status: string
          details: Json
        }[]
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_intent: {
        Args: { p_message_content: string; p_context?: Json }
        Returns: {
          intent_name: string
          confidence_score: number
          suggested_actions: Json
        }[]
      }
      get_conversation_context: {
        Args: { p_conversation_id: string; p_context_keys?: string[] }
        Returns: Json
      }
      get_proactive_suggestions: {
        Args: Record<PropertyKey, never>
        Returns: {
          suggestion: string
          reasoning: string
          action_command: string
          priority: number
        }[]
      }
      get_relevant_patterns: {
        Args: { p_context_type: string; p_context_data: Json; p_limit?: number }
        Returns: {
          pattern_id: string
          pattern_description: string
          confidence_score: number
          usage_count: number
        }[]
      }
      get_response_template: {
        Args: {
          p_category: string
          p_agent_type: string
          p_context?: Json
          p_user_preferences?: Json
        }
        Returns: {
          template_content: string
          template_variables: Json
          tone: string
        }[]
      }
      learn_user_preference: {
        Args: {
          p_user_id: string
          p_session_id: string
          p_preference_type: string
          p_preference_value: Json
          p_confidence?: number
        }
        Returns: undefined
      }
      record_learning: {
        Args: {
          p_pattern_type: string
          p_pattern_category: string
          p_description: string
          p_confidence: number
          p_evidence: Json
          p_source: string
        }
        Returns: string
      }
      record_tool_usage: {
        Args: {
          p_tool_name: string
          p_context: Json
          p_parameters: Json
          p_execution_time_ms: number
          p_success: boolean
          p_user_satisfaction?: number
        }
        Returns: undefined
      }
      update_conversation_context: {
        Args: {
          p_conversation_id: string
          p_context_key: string
          p_context_value: Json
          p_priority?: number
          p_expires_at?: string
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
          visibility: string | null
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
          visibility?: string | null
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
          visibility?: string | null
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
          created_at: string | null
          download_success: boolean
          downloaded_at: string
          file_size: number
          id: string
          image_height: number | null
          image_width: number | null
          large_path: string | null
          local_path: string | null
          medium_path: string | null
          member_id: string
          optimization_complete: boolean | null
          original_path: string | null
          original_url: string
          source_last_modified: string | null
          storage_path: string
          thumbnail_path: string | null
          updated_at: string | null
        }
        Insert: {
          bioguide_id: string
          congress_number: number
          content_hash?: string | null
          created_at?: string | null
          download_success?: boolean
          downloaded_at?: string
          file_size: number
          id?: string
          image_height?: number | null
          image_width?: number | null
          large_path?: string | null
          local_path?: string | null
          medium_path?: string | null
          member_id: string
          optimization_complete?: boolean | null
          original_path?: string | null
          original_url: string
          source_last_modified?: string | null
          storage_path: string
          thumbnail_path?: string | null
          updated_at?: string | null
        }
        Update: {
          bioguide_id?: string
          congress_number?: number
          content_hash?: string | null
          created_at?: string | null
          download_success?: boolean
          downloaded_at?: string
          file_size?: number
          id?: string
          image_height?: number | null
          image_width?: number | null
          large_path?: string | null
          local_path?: string | null
          medium_path?: string | null
          member_id?: string
          optimization_complete?: boolean | null
          original_path?: string | null
          original_url?: string
          source_last_modified?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          updated_at?: string | null
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
          lms_platform: Database["school"]["Enums"]["lms_platform"] | null
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
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
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
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
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
      check_incentive_eligibility: {
        Args: { user_id_param: string; survey_incentive_id_param: string }
        Returns: Json
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
      cleanup_old_trending_searches: {
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
        Args: { check_user_id: string }
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
      is_super_admin_user: {
        Args: { check_user_id: string }
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
  school: {
    Tables: {
      assignments: {
        Row: {
          clever_assignment_id: string | null
          course_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          external_url: string | null
          google_classroom_assignment_id: string | null
          id: string
          lms_platform: Database["school"]["Enums"]["lms_platform"] | null
          max_points: number
          quiz_type: string | null
          section_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          clever_assignment_id?: string | null
          course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          external_url?: string | null
          google_classroom_assignment_id?: string | null
          id?: string
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
          max_points?: number
          quiz_type?: string | null
          section_id?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          clever_assignment_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          external_url?: string | null
          google_classroom_assignment_id?: string | null
          id?: string
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
          max_points?: number
          quiz_type?: string | null
          section_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_pod_links: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          grade_passback_enabled: boolean
          id: string
          pod_id: string
          sync_enabled: boolean
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          grade_passback_enabled?: boolean
          id?: string
          pod_id: string
          sync_enabled?: boolean
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          grade_passback_enabled?: boolean
          id?: string
          pod_id?: string
          sync_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_pod_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_year: string
          clever_section_id: string | null
          created_at: string
          description: string | null
          external_course_id: string | null
          google_classroom_id: string | null
          grade: string | null
          grade_level: string | null
          id: string
          is_active: boolean
          lms_platform: Database["school"]["Enums"]["lms_platform"] | null
          name: string
          school_id: string
          section: string | null
          semester: string | null
          settings: Json | null
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          clever_section_id?: string | null
          created_at?: string
          description?: string | null
          external_course_id?: string | null
          google_classroom_id?: string | null
          grade?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
          name: string
          school_id: string
          section?: string | null
          semester?: string | null
          settings?: Json | null
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          clever_section_id?: string | null
          created_at?: string
          description?: string | null
          external_course_id?: string | null
          google_classroom_id?: string | null
          grade?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
          name?: string
          school_id?: string
          section?: string | null
          semester?: string | null
          settings?: Json | null
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          code: string
          contact_email: string | null
          created_at: string
          domain: string | null
          id: string
          name: string
          settings: Json | null
          state: string
          updated_at: string
        }
        Insert: {
          code: string
          contact_email?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          settings?: Json | null
          state: string
          updated_at?: string
        }
        Update: {
          code?: string
          contact_email?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          settings?: Json | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          clever_user_id: string | null
          course_id: string
          created_at: string
          email: string | null
          enrollment_date: string
          first_name: string | null
          grade_override: string | null
          id: string
          last_name: string | null
          lms_platform: Database["school"]["Enums"]["lms_platform"] | null
          role: Database["public"]["Enums"]["course_role"]
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          clever_user_id?: string | null
          course_id: string
          created_at?: string
          email?: string | null
          enrollment_date?: string
          first_name?: string | null
          grade_override?: string | null
          id?: string
          last_name?: string | null
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
          role?: Database["public"]["Enums"]["course_role"]
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          clever_user_id?: string | null
          course_id?: string
          created_at?: string
          email?: string | null
          enrollment_date?: string
          first_name?: string | null
          grade_override?: string | null
          id?: string
          last_name?: string | null
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
          role?: Database["public"]["Enums"]["course_role"]
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: Json | null
          code: string
          created_at: string
          district_id: string
          id: string
          name: string
          principal_email: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          code: string
          created_at?: string
          district_id: string
          id?: string
          name: string
          principal_email?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          code?: string
          created_at?: string
          district_id?: string
          id?: string
          name?: string
          principal_email?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          assignment_id: string
          created_at: string
          grade: number
          id: string
          lms_platform: Database["school"]["Enums"]["lms_platform"]
          max_points: number
          recorded_at: string
          section_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          grade: number
          id?: string
          lms_platform: Database["school"]["Enums"]["lms_platform"]
          max_points?: number
          recorded_at?: string
          section_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          grade?: number
          id?: string
          lms_platform?: Database["school"]["Enums"]["lms_platform"]
          max_points?: number
          recorded_at?: string
          section_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          grade_synced_at: string | null
          graded_at: string | null
          id: string
          max_score: number | null
          quiz_attempt_id: string | null
          score: number | null
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          grade_synced_at?: string | null
          graded_at?: string | null
          id?: string
          max_score?: number | null
          quiz_attempt_id?: string | null
          score?: number | null
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          grade_synced_at?: string | null
          graded_at?: string | null
          id?: string
          max_score?: number | null
          quiz_attempt_id?: string | null
          score?: number | null
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          course_id: string | null
          error_details: Json | null
          id: string
          lms_platform: Database["school"]["Enums"]["lms_platform"] | null
          pod_id: string | null
          records_failed: number | null
          records_processed: number | null
          records_successful: number | null
          started_at: string
          started_by: string | null
          sync_status: Database["public"]["Enums"]["sync_status"]
          sync_type: Database["public"]["Enums"]["sync_type"]
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          error_details?: Json | null
          id?: string
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
          pod_id?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_successful?: number | null
          started_at?: string
          started_by?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"]
          sync_type: Database["public"]["Enums"]["sync_type"]
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          error_details?: Json | null
          id?: string
          lms_platform?: Database["school"]["Enums"]["lms_platform"] | null
          pod_id?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_successful?: number | null
          started_at?: string
          started_by?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"]
          sync_type?: Database["public"]["Enums"]["sync_type"]
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          emergency_contact: Json | null
          employee_id: string | null
          grade_level: string | null
          graduation_year: number | null
          id: string
          parent_email: string | null
          role: Database["public"]["Enums"]["school_user_role"]
          school_district_id: string | null
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_contact?: Json | null
          employee_id?: string | null
          grade_level?: string | null
          graduation_year?: number | null
          id?: string
          parent_email?: string | null
          role?: Database["public"]["Enums"]["school_user_role"]
          school_district_id?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_contact?: Json | null
          employee_id?: string | null
          grade_level?: string | null
          graduation_year?: number | null
          id?: string
          parent_email?: string | null
          role?: Database["public"]["Enums"]["school_user_role"]
          school_district_id?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_school_district_id_fkey"
            columns: ["school_district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_lms_integration_status: {
        Args: { p_pod_id: string }
        Returns: Json
      }
      get_user_school_context: {
        Args: { user_id?: string }
        Returns: Json
      }
      log_sync_activity: {
        Args: {
          p_course_id?: string
          p_pod_id?: string
          p_sync_type?: Database["public"]["Enums"]["sync_type"]
          p_records_processed?: number
          p_records_successful?: number
          p_error_details?: Json
        }
        Returns: string
      }
      switch_pod_lms_platform: {
        Args: {
          p_pod_id: string
          p_new_platform: Database["school"]["Enums"]["lms_platform"]
          p_external_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      lms_platform: "google_classroom" | "clever"
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
  admin_panel: {
    Enums: {},
  },
  ai_agent: {
    Enums: {},
  },
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
  school: {
    Enums: {
      lms_platform: ["google_classroom", "clever"],
    },
  },
} as const

// =============================================================================
// CONVENIENT TYPE EXPORTS FOR EASIER USAGE
// =============================================================================

// =============================================================================
// PUBLIC SCHEMA TYPES
// =============================================================================

// public Tables
export type DbAiActionExecutions = Database['public']['Tables']['ai_action_executions']['Row']
export type DbAiCommandAnalytics = Database['public']['Tables']['ai_command_analytics']['Row']
export type DbAiCommandExecutions = Database['public']['Tables']['ai_command_executions']['Row']
export type DbAiResearchResults = Database['public']['Tables']['ai_research_results']['Row']
export type DbAiResearchSessions = Database['public']['Tables']['ai_research_sessions']['Row']
export type DbAiToolUsage = Database['public']['Tables']['ai_tool_usage']['Row']
export type DbArticleBiasAnalysis = Database['public']['Tables']['article_bias_analysis']['Row']
export type DbAssessedEntities = Database['public']['Tables']['assessed_entities']['Row']
export type DbAssessmentAnalytics = Database['public']['Tables']['assessment_analytics']['Row']
export type DbAssessmentEngagement = Database['public']['Tables']['assessment_engagement']['Row']
export type DbAssessmentEvidence = Database['public']['Tables']['assessment_evidence']['Row']
export type DbAssessmentFrameworks = Database['public']['Tables']['assessment_frameworks']['Row']
export type DbAssessmentQuestions = Database['public']['Tables']['assessment_questions']['Row']
export type DbAssessmentScoring = Database['public']['Tables']['assessment_scoring']['Row']
export type DbAssessmentSummaries = Database['public']['Tables']['assessment_summaries']['Row']
export type DbAssessments = Database['public']['Tables']['assessments']['Row']
export type DbAutoGeneratedEvents = Database['public']['Tables']['auto_generated_events']['Row']
export type DbBadgeRequirements = Database['public']['Tables']['badge_requirements']['Row']
export type DbBiasDetectionPatterns = Database['public']['Tables']['bias_detection_patterns']['Row']
export type DbBiasDimensions = Database['public']['Tables']['bias_dimensions']['Row']
export type DbBiasFeedback = Database['public']['Tables']['bias_feedback']['Row']
export type DbBiasLearningEvents = Database['public']['Tables']['bias_learning_events']['Row']
export type DbBillActions = Database['public']['Tables']['bill_actions']['Row']
export type DbBillContentAnalysis = Database['public']['Tables']['bill_content_analysis']['Row']
export type DbBillCosponsors = Database['public']['Tables']['bill_cosponsors']['Row']
export type DbBillRelationships = Database['public']['Tables']['bill_relationships']['Row']
export type DbBillSubjects = Database['public']['Tables']['bill_subjects']['Row']
export type DbBillSummaries = Database['public']['Tables']['bill_summaries']['Row']
export type DbBookmarkAnalytics = Database['public']['Tables']['bookmark_analytics']['Row']
export type DbBookmarkCollections = Database['public']['Tables']['bookmark_collections']['Row']
export type DbBookmarkSnippets = Database['public']['Tables']['bookmark_snippets']['Row']
export type DbBookmarkTags = Database['public']['Tables']['bookmark_tags']['Row']
export type DbBookmarks = Database['public']['Tables']['bookmarks']['Row']
export type DbBoostDefinitions = Database['public']['Tables']['boost_definitions']['Row']
export type DbCalendarSyncLogs = Database['public']['Tables']['calendar_sync_logs']['Row']
export type DbCategories = Database['public']['Tables']['categories']['Row']
export type DbCategorySynonyms = Database['public']['Tables']['category_synonyms']['Row']
export type DbCivicContentAnalysis = Database['public']['Tables']['civic_content_analysis']['Row']
export type DbCivicEngagementEvents = Database['public']['Tables']['civic_engagement_events']['Row']
export type DbCivicsTestAnalytics = Database['public']['Tables']['civics_test_analytics']['Row']
export type DbCleverUserMapping = Database['public']['Tables']['clever_user_mapping']['Row']
export type DbCollectionAnalytics = Database['public']['Tables']['collection_analytics']['Row']
export type DbCollectionItems = Database['public']['Tables']['collection_items']['Row']
export type DbCollectionReviews = Database['public']['Tables']['collection_reviews']['Row']
export type DbCollectionSkillProgress = Database['public']['Tables']['collection_skill_progress']['Row']
export type DbCollections = Database['public']['Tables']['collections']['Row']
export type DbCommitteeMemberships = Database['public']['Tables']['committee_memberships']['Row']
export type DbCongressionalBills = Database['public']['Tables']['congressional_bills']['Row']
export type DbCongressionalCommittees = Database['public']['Tables']['congressional_committees']['Row']
export type DbCongressionalPhotos = Database['public']['Tables']['congressional_photos']['Row']
export type DbCongressionalProceedings = Database['public']['Tables']['congressional_proceedings']['Row']
export type DbCongressionalSessions = Database['public']['Tables']['congressional_sessions']['Row']
export type DbCongressionalTerms = Database['public']['Tables']['congressional_terms']['Row']
export type DbCongressionalVotes = Database['public']['Tables']['congressional_votes']['Row']
export type DbContentDuplicationWarnings = Database['public']['Tables']['content_duplication_warnings']['Row']
export type DbContentFilteringRules = Database['public']['Tables']['content_filtering_rules']['Row']
export type DbContentGapsAnalysis = Database['public']['Tables']['content_gaps_analysis']['Row']
export type DbContentGenerationQueue = Database['public']['Tables']['content_generation_queue']['Row']
export type DbContentItemSkills = Database['public']['Tables']['content_item_skills']['Row']
export type DbContentPackages = Database['public']['Tables']['content_packages']['Row']
export type DbContentPreviewCache = Database['public']['Tables']['content_preview_cache']['Row']
export type DbContentPublicationLog = Database['public']['Tables']['content_publication_log']['Row']
export type DbContentRelationships = Database['public']['Tables']['content_relationships']['Row']
export type DbDiscountCodes = Database['public']['Tables']['discount_codes']['Row']
export type DbDocumentActions = Database['public']['Tables']['document_actions']['Row']
export type DbDocumentRelationships = Database['public']['Tables']['document_relationships']['Row']
export type DbDocumentSources = Database['public']['Tables']['document_sources']['Row']
export type DbDocumentSubjects = Database['public']['Tables']['document_subjects']['Row']
export type DbElectionInfo = Database['public']['Tables']['election_info']['Row']
export type DbEventResearchSuggestions = Database['public']['Tables']['event_research_suggestions']['Row']
export type DbEventTimelineConnections = Database['public']['Tables']['event_timeline_connections']['Row']
export type DbEvents = Database['public']['Tables']['events']['Row']
export type DbExtractedEntities = Database['public']['Tables']['extracted_entities']['Row']
export type DbExtractedRelationships = Database['public']['Tables']['extracted_relationships']['Row']
export type DbFactCheckLogs = Database['public']['Tables']['fact_check_logs']['Row']
export type DbFigureEvents = Database['public']['Tables']['figure_events']['Row']
export type DbFigureOrganizations = Database['public']['Tables']['figure_organizations']['Row']
export type DbFigurePolicyPositions = Database['public']['Tables']['figure_policy_positions']['Row']
export type DbFigureQuizTopics = Database['public']['Tables']['figure_quiz_topics']['Row']
export type DbFigureRelationships = Database['public']['Tables']['figure_relationships']['Row']
export type DbFriendRequests = Database['public']['Tables']['friend_requests']['Row']
export type DbGiftCredits = Database['public']['Tables']['gift_credits']['Row']
export type DbGiftRedemptions = Database['public']['Tables']['gift_redemptions']['Row']
export type DbGlossaryContentReferences = Database['public']['Tables']['glossary_content_references']['Row']
export type DbGlossaryGameSessions = Database['public']['Tables']['glossary_game_sessions']['Row']
export type DbGlossaryGames = Database['public']['Tables']['glossary_games']['Row']
export type DbGlossaryTermCategories = Database['public']['Tables']['glossary_term_categories']['Row']
export type DbGlossaryTermRelationships = Database['public']['Tables']['glossary_term_relationships']['Row']
export type DbGlossaryTerms = Database['public']['Tables']['glossary_terms']['Row']
export type DbGlossaryUsageAnalytics = Database['public']['Tables']['glossary_usage_analytics']['Row']
export type DbGuestCivicsTestResults = Database['public']['Tables']['guest_civics_test_results']['Row']
export type DbGuestUsageAnalytics = Database['public']['Tables']['guest_usage_analytics']['Row']
export type DbGuestUsageTracking = Database['public']['Tables']['guest_usage_tracking']['Row']
export type DbImageAbTestResults = Database['public']['Tables']['image_ab_test_results']['Row']
export type DbImageGenerationAnalytics = Database['public']['Tables']['image_generation_analytics']['Row']
export type DbIndicatorActions = Database['public']['Tables']['indicator_actions']['Row']
export type DbIndicatorAssessments = Database['public']['Tables']['indicator_assessments']['Row']
export type DbIndicatorCategories = Database['public']['Tables']['indicator_categories']['Row']
export type DbIndicatorContentLinks = Database['public']['Tables']['indicator_content_links']['Row']
export type DbIndicators = Database['public']['Tables']['indicators']['Row']
export type DbJobExecutionLogs = Database['public']['Tables']['job_execution_logs']['Row']
export type DbKeyPolicyPositions = Database['public']['Tables']['key_policy_positions']['Row']
export type DbKnowledgeConnections = Database['public']['Tables']['knowledge_connections']['Row']
export type DbLearningObjectives = Database['public']['Tables']['learning_objectives']['Row']
export type DbLearningPods = Database['public']['Tables']['learning_pods']['Row']
export type DbLegislativeDocuments = Database['public']['Tables']['legislative_documents']['Row']
export type DbLocationCoverage = Database['public']['Tables']['location_coverage']['Row']
export type DbMediaOrganizations = Database['public']['Tables']['media_organizations']['Row']
export type DbMemberIndividualSettings = Database['public']['Tables']['member_individual_settings']['Row']
export type DbMemberVotes = Database['public']['Tables']['member_votes']['Row']
export type DbMultiplayerChatMessages = Database['public']['Tables']['multiplayer_chat_messages']['Row']
export type DbMultiplayerConversationContext = Database['public']['Tables']['multiplayer_conversation_context']['Row']
export type DbMultiplayerGameEvents = Database['public']['Tables']['multiplayer_game_events']['Row']
export type DbMultiplayerGameSessions = Database['public']['Tables']['multiplayer_game_sessions']['Row']
export type DbMultiplayerNpcPlayers = Database['public']['Tables']['multiplayer_npc_players']['Row']
export type DbMultiplayerQuestionResponses = Database['public']['Tables']['multiplayer_question_responses']['Row']
export type DbMultiplayerQuizAttempts = Database['public']['Tables']['multiplayer_quiz_attempts']['Row']
export type DbMultiplayerRoomEvents = Database['public']['Tables']['multiplayer_room_events']['Row']
export type DbMultiplayerRoomPlayers = Database['public']['Tables']['multiplayer_room_players']['Row']
export type DbMultiplayerRooms = Database['public']['Tables']['multiplayer_rooms']['Row']
export type DbNewsAgentConfig = Database['public']['Tables']['news_agent_config']['Row']
export type DbNewsAgentLogs = Database['public']['Tables']['news_agent_logs']['Row']
export type DbNewsCache = Database['public']['Tables']['news_cache']['Row']
export type DbNewsEvents = Database['public']['Tables']['news_events']['Row']
export type DbNotificationCampaigns = Database['public']['Tables']['notification_campaigns']['Row']
export type DbNotificationEvents = Database['public']['Tables']['notification_events']['Row']
export type DbNotificationProviders = Database['public']['Tables']['notification_providers']['Row']
export type DbNotificationSegments = Database['public']['Tables']['notification_segments']['Row']
export type DbNotificationTemplates = Database['public']['Tables']['notification_templates']['Row']
export type DbNpcCategorySpecializations = Database['public']['Tables']['npc_category_specializations']['Row']
export type DbNpcChatTemplates = Database['public']['Tables']['npc_chat_templates']['Row']
export type DbNpcConversationHistory = Database['public']['Tables']['npc_conversation_history']['Row']
export type DbNpcLearningProgression = Database['public']['Tables']['npc_learning_progression']['Row']
export type DbNpcPersonalities = Database['public']['Tables']['npc_personalities']['Row']
export type DbNpcQuestionResponses = Database['public']['Tables']['npc_question_responses']['Row']
export type DbNpcQuizAttempts = Database['public']['Tables']['npc_quiz_attempts']['Row']
export type DbOrganizationBiasScores = Database['public']['Tables']['organization_bias_scores']['Row']
export type DbOrganizations = Database['public']['Tables']['organizations']['Row']
export type DbParentalControls = Database['public']['Tables']['parental_controls']['Row']
export type DbPathwaySkills = Database['public']['Tables']['pathway_skills']['Row']
export type DbPodAchievements = Database['public']['Tables']['pod_achievements']['Row']
export type DbPodActivities = Database['public']['Tables']['pod_activities']['Row']
export type DbPodActivityLog = Database['public']['Tables']['pod_activity_log']['Row']
export type DbPodAnalytics = Database['public']['Tables']['pod_analytics']['Row']
export type DbPodAnalyticsLog = Database['public']['Tables']['pod_analytics_log']['Row']
export type DbPodChallengeParticipants = Database['public']['Tables']['pod_challenge_participants']['Row']
export type DbPodChallenges = Database['public']['Tables']['pod_challenges']['Row']
export type DbPodInviteLinks = Database['public']['Tables']['pod_invite_links']['Row']
export type DbPodJoinRequests = Database['public']['Tables']['pod_join_requests']['Row']
export type DbPodMemberAnalytics = Database['public']['Tables']['pod_member_analytics']['Row']
export type DbPodMemberSettings = Database['public']['Tables']['pod_member_settings']['Row']
export type DbPodMemberships = Database['public']['Tables']['pod_memberships']['Row']
export type DbPodPartnerships = Database['public']['Tables']['pod_partnerships']['Row']
export type DbPodRatings = Database['public']['Tables']['pod_ratings']['Row']
export type DbPodSettings = Database['public']['Tables']['pod_settings']['Row']
export type DbPodThemes = Database['public']['Tables']['pod_themes']['Row']
export type DbProceedingExchanges = Database['public']['Tables']['proceeding_exchanges']['Row']
export type DbProceedingParticipants = Database['public']['Tables']['proceeding_participants']['Row']
export type DbProfiles = Database['public']['Tables']['profiles']['Row']
export type DbProgressQuestionResponses = Database['public']['Tables']['progress_question_responses']['Row']
export type DbProgressSessions = Database['public']['Tables']['progress_sessions']['Row']
export type DbPublicFigures = Database['public']['Tables']['public_figures']['Row']
export type DbQuestionAnalytics = Database['public']['Tables']['question_analytics']['Row']
export type DbQuestionEventConnections = Database['public']['Tables']['question_event_connections']['Row']
export type DbQuestionFeedback = Database['public']['Tables']['question_feedback']['Row']
export type DbQuestionSkills = Database['public']['Tables']['question_skills']['Row']
export type DbQuestionSourceLinks = Database['public']['Tables']['question_source_links']['Row']
export type DbQuestionTopicCategories = Database['public']['Tables']['question_topic_categories']['Row']
export type DbQuestionTopics = Database['public']['Tables']['question_topics']['Row']
export type DbQuestions = Database['public']['Tables']['questions']['Row']
export type DbQuestionsTest = Database['public']['Tables']['questions_test']['Row']
export type DbQuizAttempts = Database['public']['Tables']['quiz_attempts']['Row']
export type DbRaffleEntries = Database['public']['Tables']['raffle_entries']['Row']
export type DbRepresentativeContentMapping = Database['public']['Tables']['representative_content_mapping']['Row']
export type DbResearchValidation = Database['public']['Tables']['research_validation']['Row']
export type DbRewardFulfillments = Database['public']['Tables']['reward_fulfillments']['Row']
export type DbScenarioCharacters = Database['public']['Tables']['scenario_characters']['Row']
export type DbScenarioDecisions = Database['public']['Tables']['scenario_decisions']['Row']
export type DbScenarioOutcomes = Database['public']['Tables']['scenario_outcomes']['Row']
export type DbScenarioResources = Database['public']['Tables']['scenario_resources']['Row']
export type DbScenarioSituations = Database['public']['Tables']['scenario_situations']['Row']
export type DbScenarios = Database['public']['Tables']['scenarios']['Row']
export type DbScheduledContentJobs = Database['public']['Tables']['scheduled_content_jobs']['Row']
export type DbShareableGiftLinks = Database['public']['Tables']['shareable_gift_links']['Row']
export type DbShareableLinkClaims = Database['public']['Tables']['shareable_link_claims']['Row']
export type DbSharedCollectionAccess = Database['public']['Tables']['shared_collection_access']['Row']
export type DbSkillAssessmentCriteria = Database['public']['Tables']['skill_assessment_criteria']['Row']
export type DbSkillBadges = Database['public']['Tables']['skill_badges']['Row']
export type DbSkillCategories = Database['public']['Tables']['skill_categories']['Row']
export type DbSkillLearningObjectives = Database['public']['Tables']['skill_learning_objectives']['Row']
export type DbSkillMasteryTracking = Database['public']['Tables']['skill_mastery_tracking']['Row']
export type DbSkillPracticeRecommendations = Database['public']['Tables']['skill_practice_recommendations']['Row']
export type DbSkillPrerequisites = Database['public']['Tables']['skill_prerequisites']['Row']
export type DbSkillProgressionPathways = Database['public']['Tables']['skill_progression_pathways']['Row']
export type DbSkillRelationships = Database['public']['Tables']['skill_relationships']['Row']
export type DbSkills = Database['public']['Tables']['skills']['Row']
export type DbSourceCredibilityIndicators = Database['public']['Tables']['source_credibility_indicators']['Row']
export type DbSourceFetchQueue = Database['public']['Tables']['source_fetch_queue']['Row']
export type DbSourceMetadata = Database['public']['Tables']['source_metadata']['Row']
export type DbSpacedRepetitionSchedule = Database['public']['Tables']['spaced_repetition_schedule']['Row']
export type DbSubscriptionTierLimits = Database['public']['Tables']['subscription_tier_limits']['Row']
export type DbSurveyAnswers = Database['public']['Tables']['survey_answers']['Row']
export type DbSurveyIncentives = Database['public']['Tables']['survey_incentives']['Row']
export type DbSurveyLearningGoals = Database['public']['Tables']['survey_learning_goals']['Row']
export type DbSurveyQuestions = Database['public']['Tables']['survey_questions']['Row']
export type DbSurveyRecommendations = Database['public']['Tables']['survey_recommendations']['Row']
export type DbSurveyResponses = Database['public']['Tables']['survey_responses']['Row']
export type DbSurveys = Database['public']['Tables']['surveys']['Row']
export type DbSystemAlerts = Database['public']['Tables']['system_alerts']['Row']
export type DbTags = Database['public']['Tables']['tags']['Row']
export type DbTopicEventConnections = Database['public']['Tables']['topic_event_connections']['Row']
export type DbTranslationJobs = Database['public']['Tables']['translation_jobs']['Row']
export type DbTrendingSearches = Database['public']['Tables']['trending_searches']['Row']
export type DbUserAchievements = Database['public']['Tables']['user_achievements']['Row']
export type DbUserActiveBoosts = Database['public']['Tables']['user_active_boosts']['Row']
export type DbUserAssessmentAttempts = Database['public']['Tables']['user_assessment_attempts']['Row']
export type DbUserAssessments = Database['public']['Tables']['user_assessments']['Row']
export type DbUserBadges = Database['public']['Tables']['user_badges']['Row']
export type DbUserBoostInventory = Database['public']['Tables']['user_boost_inventory']['Row']
export type DbUserCategoryPreferences = Database['public']['Tables']['user_category_preferences']['Row']
export type DbUserCategorySkills = Database['public']['Tables']['user_category_skills']['Row']
export type DbUserCollectionProgress = Database['public']['Tables']['user_collection_progress']['Row']
export type DbUserCredits = Database['public']['Tables']['user_credits']['Row']
export type DbUserCustomDecks = Database['public']['Tables']['user_custom_decks']['Row']
export type DbUserDeckContent = Database['public']['Tables']['user_deck_content']['Row']
export type DbUserDiscountUsage = Database['public']['Tables']['user_discount_usage']['Row']
export type DbUserElectionTracking = Database['public']['Tables']['user_election_tracking']['Row']
export type DbUserEmailPreferences = Database['public']['Tables']['user_email_preferences']['Row']
export type DbUserEvents = Database['public']['Tables']['user_events']['Row']
export type DbUserFeatureUsage = Database['public']['Tables']['user_feature_usage']['Row']
export type DbUserFeedback = Database['public']['Tables']['user_feedback']['Row']
export type DbUserIntegrations = Database['public']['Tables']['user_integrations']['Row']
export type DbUserLearningGoals = Database['public']['Tables']['user_learning_goals']['Row']
export type DbUserLearningInsights = Database['public']['Tables']['user_learning_insights']['Row']
export type DbUserLocations = Database['public']['Tables']['user_locations']['Row']
export type DbUserNotificationSubscriptions = Database['public']['Tables']['user_notification_subscriptions']['Row']
export type DbUserOnboardingState = Database['public']['Tables']['user_onboarding_state']['Row']
export type DbUserPlatformPreferences = Database['public']['Tables']['user_platform_preferences']['Row']
export type DbUserProgress = Database['public']['Tables']['user_progress']['Row']
export type DbUserProgressHistory = Database['public']['Tables']['user_progress_history']['Row']
export type DbUserQuestionMemory = Database['public']['Tables']['user_question_memory']['Row']
export type DbUserQuestionResponses = Database['public']['Tables']['user_question_responses']['Row']
export type DbUserQuizAnalytics = Database['public']['Tables']['user_quiz_analytics']['Row']
export type DbUserQuizAttempts = Database['public']['Tables']['user_quiz_attempts']['Row']
export type DbUserRepresentatives = Database['public']['Tables']['user_representatives']['Row']
export type DbUserRoles = Database['public']['Tables']['user_roles']['Row']
export type DbUserScenarioAttempts = Database['public']['Tables']['user_scenario_attempts']['Row']
export type DbUserScenarioDecisions = Database['public']['Tables']['user_scenario_decisions']['Row']
export type DbUserSkillPreferences = Database['public']['Tables']['user_skill_preferences']['Row']
export type DbUserSkillProgress = Database['public']['Tables']['user_skill_progress']['Row']
export type DbUserStreakHistory = Database['public']['Tables']['user_streak_history']['Row']
export type DbUserSubscriptions = Database['public']['Tables']['user_subscriptions']['Row']
export type DbUserSurveyCompletions = Database['public']['Tables']['user_survey_completions']['Row']
export type DbWeeklyContentMetrics = Database['public']['Tables']['weekly_content_metrics']['Row']
export type DbWeeklyRecapCollections = Database['public']['Tables']['weekly_recap_collections']['Row']
export type DbWeeklyRecapConfigs = Database['public']['Tables']['weekly_recap_configs']['Row']

// public Insert Types
export type DbAiActionExecutionsInsert = Database['public']['Tables']['ai_action_executions']['Insert']
export type DbAiCommandAnalyticsInsert = Database['public']['Tables']['ai_command_analytics']['Insert']
export type DbAiCommandExecutionsInsert = Database['public']['Tables']['ai_command_executions']['Insert']
export type DbAiResearchResultsInsert = Database['public']['Tables']['ai_research_results']['Insert']
export type DbAiResearchSessionsInsert = Database['public']['Tables']['ai_research_sessions']['Insert']
export type DbAiToolUsageInsert = Database['public']['Tables']['ai_tool_usage']['Insert']
export type DbArticleBiasAnalysisInsert = Database['public']['Tables']['article_bias_analysis']['Insert']
export type DbAssessedEntitiesInsert = Database['public']['Tables']['assessed_entities']['Insert']
export type DbAssessmentAnalyticsInsert = Database['public']['Tables']['assessment_analytics']['Insert']
export type DbAssessmentEngagementInsert = Database['public']['Tables']['assessment_engagement']['Insert']
export type DbAssessmentEvidenceInsert = Database['public']['Tables']['assessment_evidence']['Insert']
export type DbAssessmentFrameworksInsert = Database['public']['Tables']['assessment_frameworks']['Insert']
export type DbAssessmentQuestionsInsert = Database['public']['Tables']['assessment_questions']['Insert']
export type DbAssessmentScoringInsert = Database['public']['Tables']['assessment_scoring']['Insert']
export type DbAssessmentSummariesInsert = Database['public']['Tables']['assessment_summaries']['Insert']
export type DbAssessmentsInsert = Database['public']['Tables']['assessments']['Insert']
export type DbAutoGeneratedEventsInsert = Database['public']['Tables']['auto_generated_events']['Insert']
export type DbBadgeRequirementsInsert = Database['public']['Tables']['badge_requirements']['Insert']
export type DbBiasDetectionPatternsInsert = Database['public']['Tables']['bias_detection_patterns']['Insert']
export type DbBiasDimensionsInsert = Database['public']['Tables']['bias_dimensions']['Insert']
export type DbBiasFeedbackInsert = Database['public']['Tables']['bias_feedback']['Insert']
export type DbBiasLearningEventsInsert = Database['public']['Tables']['bias_learning_events']['Insert']
export type DbBillActionsInsert = Database['public']['Tables']['bill_actions']['Insert']
export type DbBillContentAnalysisInsert = Database['public']['Tables']['bill_content_analysis']['Insert']
export type DbBillCosponsorsInsert = Database['public']['Tables']['bill_cosponsors']['Insert']
export type DbBillRelationshipsInsert = Database['public']['Tables']['bill_relationships']['Insert']
export type DbBillSubjectsInsert = Database['public']['Tables']['bill_subjects']['Insert']
export type DbBillSummariesInsert = Database['public']['Tables']['bill_summaries']['Insert']
export type DbBookmarkAnalyticsInsert = Database['public']['Tables']['bookmark_analytics']['Insert']
export type DbBookmarkCollectionsInsert = Database['public']['Tables']['bookmark_collections']['Insert']
export type DbBookmarkSnippetsInsert = Database['public']['Tables']['bookmark_snippets']['Insert']
export type DbBookmarkTagsInsert = Database['public']['Tables']['bookmark_tags']['Insert']
export type DbBookmarksInsert = Database['public']['Tables']['bookmarks']['Insert']
export type DbBoostDefinitionsInsert = Database['public']['Tables']['boost_definitions']['Insert']
export type DbCalendarSyncLogsInsert = Database['public']['Tables']['calendar_sync_logs']['Insert']
export type DbCategoriesInsert = Database['public']['Tables']['categories']['Insert']
export type DbCategorySynonymsInsert = Database['public']['Tables']['category_synonyms']['Insert']
export type DbCivicContentAnalysisInsert = Database['public']['Tables']['civic_content_analysis']['Insert']
export type DbCivicEngagementEventsInsert = Database['public']['Tables']['civic_engagement_events']['Insert']
export type DbCivicsTestAnalyticsInsert = Database['public']['Tables']['civics_test_analytics']['Insert']
export type DbCleverUserMappingInsert = Database['public']['Tables']['clever_user_mapping']['Insert']
export type DbCollectionAnalyticsInsert = Database['public']['Tables']['collection_analytics']['Insert']
export type DbCollectionItemsInsert = Database['public']['Tables']['collection_items']['Insert']
export type DbCollectionReviewsInsert = Database['public']['Tables']['collection_reviews']['Insert']
export type DbCollectionSkillProgressInsert = Database['public']['Tables']['collection_skill_progress']['Insert']
export type DbCollectionsInsert = Database['public']['Tables']['collections']['Insert']
export type DbCommitteeMembershipsInsert = Database['public']['Tables']['committee_memberships']['Insert']
export type DbCongressionalBillsInsert = Database['public']['Tables']['congressional_bills']['Insert']
export type DbCongressionalCommitteesInsert = Database['public']['Tables']['congressional_committees']['Insert']
export type DbCongressionalPhotosInsert = Database['public']['Tables']['congressional_photos']['Insert']
export type DbCongressionalProceedingsInsert = Database['public']['Tables']['congressional_proceedings']['Insert']
export type DbCongressionalSessionsInsert = Database['public']['Tables']['congressional_sessions']['Insert']
export type DbCongressionalTermsInsert = Database['public']['Tables']['congressional_terms']['Insert']
export type DbCongressionalVotesInsert = Database['public']['Tables']['congressional_votes']['Insert']
export type DbContentDuplicationWarningsInsert = Database['public']['Tables']['content_duplication_warnings']['Insert']
export type DbContentFilteringRulesInsert = Database['public']['Tables']['content_filtering_rules']['Insert']
export type DbContentGapsAnalysisInsert = Database['public']['Tables']['content_gaps_analysis']['Insert']
export type DbContentGenerationQueueInsert = Database['public']['Tables']['content_generation_queue']['Insert']
export type DbContentItemSkillsInsert = Database['public']['Tables']['content_item_skills']['Insert']
export type DbContentPackagesInsert = Database['public']['Tables']['content_packages']['Insert']
export type DbContentPreviewCacheInsert = Database['public']['Tables']['content_preview_cache']['Insert']
export type DbContentPublicationLogInsert = Database['public']['Tables']['content_publication_log']['Insert']
export type DbContentRelationshipsInsert = Database['public']['Tables']['content_relationships']['Insert']
export type DbDiscountCodesInsert = Database['public']['Tables']['discount_codes']['Insert']
export type DbDocumentActionsInsert = Database['public']['Tables']['document_actions']['Insert']
export type DbDocumentRelationshipsInsert = Database['public']['Tables']['document_relationships']['Insert']
export type DbDocumentSourcesInsert = Database['public']['Tables']['document_sources']['Insert']
export type DbDocumentSubjectsInsert = Database['public']['Tables']['document_subjects']['Insert']
export type DbElectionInfoInsert = Database['public']['Tables']['election_info']['Insert']
export type DbEventResearchSuggestionsInsert = Database['public']['Tables']['event_research_suggestions']['Insert']
export type DbEventTimelineConnectionsInsert = Database['public']['Tables']['event_timeline_connections']['Insert']
export type DbEventsInsert = Database['public']['Tables']['events']['Insert']
export type DbExtractedEntitiesInsert = Database['public']['Tables']['extracted_entities']['Insert']
export type DbExtractedRelationshipsInsert = Database['public']['Tables']['extracted_relationships']['Insert']
export type DbFactCheckLogsInsert = Database['public']['Tables']['fact_check_logs']['Insert']
export type DbFigureEventsInsert = Database['public']['Tables']['figure_events']['Insert']
export type DbFigureOrganizationsInsert = Database['public']['Tables']['figure_organizations']['Insert']
export type DbFigurePolicyPositionsInsert = Database['public']['Tables']['figure_policy_positions']['Insert']
export type DbFigureQuizTopicsInsert = Database['public']['Tables']['figure_quiz_topics']['Insert']
export type DbFigureRelationshipsInsert = Database['public']['Tables']['figure_relationships']['Insert']
export type DbFriendRequestsInsert = Database['public']['Tables']['friend_requests']['Insert']
export type DbGiftCreditsInsert = Database['public']['Tables']['gift_credits']['Insert']
export type DbGiftRedemptionsInsert = Database['public']['Tables']['gift_redemptions']['Insert']
export type DbGlossaryContentReferencesInsert = Database['public']['Tables']['glossary_content_references']['Insert']
export type DbGlossaryGameSessionsInsert = Database['public']['Tables']['glossary_game_sessions']['Insert']
export type DbGlossaryGamesInsert = Database['public']['Tables']['glossary_games']['Insert']
export type DbGlossaryTermCategoriesInsert = Database['public']['Tables']['glossary_term_categories']['Insert']
export type DbGlossaryTermRelationshipsInsert = Database['public']['Tables']['glossary_term_relationships']['Insert']
export type DbGlossaryTermsInsert = Database['public']['Tables']['glossary_terms']['Insert']
export type DbGlossaryUsageAnalyticsInsert = Database['public']['Tables']['glossary_usage_analytics']['Insert']
export type DbGuestCivicsTestResultsInsert = Database['public']['Tables']['guest_civics_test_results']['Insert']
export type DbGuestUsageAnalyticsInsert = Database['public']['Tables']['guest_usage_analytics']['Insert']
export type DbGuestUsageTrackingInsert = Database['public']['Tables']['guest_usage_tracking']['Insert']
export type DbImageAbTestResultsInsert = Database['public']['Tables']['image_ab_test_results']['Insert']
export type DbImageGenerationAnalyticsInsert = Database['public']['Tables']['image_generation_analytics']['Insert']
export type DbIndicatorActionsInsert = Database['public']['Tables']['indicator_actions']['Insert']
export type DbIndicatorAssessmentsInsert = Database['public']['Tables']['indicator_assessments']['Insert']
export type DbIndicatorCategoriesInsert = Database['public']['Tables']['indicator_categories']['Insert']
export type DbIndicatorContentLinksInsert = Database['public']['Tables']['indicator_content_links']['Insert']
export type DbIndicatorsInsert = Database['public']['Tables']['indicators']['Insert']
export type DbJobExecutionLogsInsert = Database['public']['Tables']['job_execution_logs']['Insert']
export type DbKeyPolicyPositionsInsert = Database['public']['Tables']['key_policy_positions']['Insert']
export type DbKnowledgeConnectionsInsert = Database['public']['Tables']['knowledge_connections']['Insert']
export type DbLearningObjectivesInsert = Database['public']['Tables']['learning_objectives']['Insert']
export type DbLearningPodsInsert = Database['public']['Tables']['learning_pods']['Insert']
export type DbLegislativeDocumentsInsert = Database['public']['Tables']['legislative_documents']['Insert']
export type DbLocationCoverageInsert = Database['public']['Tables']['location_coverage']['Insert']
export type DbMediaOrganizationsInsert = Database['public']['Tables']['media_organizations']['Insert']
export type DbMemberIndividualSettingsInsert = Database['public']['Tables']['member_individual_settings']['Insert']
export type DbMemberVotesInsert = Database['public']['Tables']['member_votes']['Insert']
export type DbMultiplayerChatMessagesInsert = Database['public']['Tables']['multiplayer_chat_messages']['Insert']
export type DbMultiplayerConversationContextInsert = Database['public']['Tables']['multiplayer_conversation_context']['Insert']
export type DbMultiplayerGameEventsInsert = Database['public']['Tables']['multiplayer_game_events']['Insert']
export type DbMultiplayerGameSessionsInsert = Database['public']['Tables']['multiplayer_game_sessions']['Insert']
export type DbMultiplayerNpcPlayersInsert = Database['public']['Tables']['multiplayer_npc_players']['Insert']
export type DbMultiplayerQuestionResponsesInsert = Database['public']['Tables']['multiplayer_question_responses']['Insert']
export type DbMultiplayerQuizAttemptsInsert = Database['public']['Tables']['multiplayer_quiz_attempts']['Insert']
export type DbMultiplayerRoomEventsInsert = Database['public']['Tables']['multiplayer_room_events']['Insert']
export type DbMultiplayerRoomPlayersInsert = Database['public']['Tables']['multiplayer_room_players']['Insert']
export type DbMultiplayerRoomsInsert = Database['public']['Tables']['multiplayer_rooms']['Insert']
export type DbNewsAgentConfigInsert = Database['public']['Tables']['news_agent_config']['Insert']
export type DbNewsAgentLogsInsert = Database['public']['Tables']['news_agent_logs']['Insert']
export type DbNewsCacheInsert = Database['public']['Tables']['news_cache']['Insert']
export type DbNewsEventsInsert = Database['public']['Tables']['news_events']['Insert']
export type DbNotificationCampaignsInsert = Database['public']['Tables']['notification_campaigns']['Insert']
export type DbNotificationEventsInsert = Database['public']['Tables']['notification_events']['Insert']
export type DbNotificationProvidersInsert = Database['public']['Tables']['notification_providers']['Insert']
export type DbNotificationSegmentsInsert = Database['public']['Tables']['notification_segments']['Insert']
export type DbNotificationTemplatesInsert = Database['public']['Tables']['notification_templates']['Insert']
export type DbNpcCategorySpecializationsInsert = Database['public']['Tables']['npc_category_specializations']['Insert']
export type DbNpcChatTemplatesInsert = Database['public']['Tables']['npc_chat_templates']['Insert']
export type DbNpcConversationHistoryInsert = Database['public']['Tables']['npc_conversation_history']['Insert']
export type DbNpcLearningProgressionInsert = Database['public']['Tables']['npc_learning_progression']['Insert']
export type DbNpcPersonalitiesInsert = Database['public']['Tables']['npc_personalities']['Insert']
export type DbNpcQuestionResponsesInsert = Database['public']['Tables']['npc_question_responses']['Insert']
export type DbNpcQuizAttemptsInsert = Database['public']['Tables']['npc_quiz_attempts']['Insert']
export type DbOrganizationBiasScoresInsert = Database['public']['Tables']['organization_bias_scores']['Insert']
export type DbOrganizationsInsert = Database['public']['Tables']['organizations']['Insert']
export type DbParentalControlsInsert = Database['public']['Tables']['parental_controls']['Insert']
export type DbPathwaySkillsInsert = Database['public']['Tables']['pathway_skills']['Insert']
export type DbPodAchievementsInsert = Database['public']['Tables']['pod_achievements']['Insert']
export type DbPodActivitiesInsert = Database['public']['Tables']['pod_activities']['Insert']
export type DbPodActivityLogInsert = Database['public']['Tables']['pod_activity_log']['Insert']
export type DbPodAnalyticsInsert = Database['public']['Tables']['pod_analytics']['Insert']
export type DbPodAnalyticsLogInsert = Database['public']['Tables']['pod_analytics_log']['Insert']
export type DbPodChallengeParticipantsInsert = Database['public']['Tables']['pod_challenge_participants']['Insert']
export type DbPodChallengesInsert = Database['public']['Tables']['pod_challenges']['Insert']
export type DbPodInviteLinksInsert = Database['public']['Tables']['pod_invite_links']['Insert']
export type DbPodJoinRequestsInsert = Database['public']['Tables']['pod_join_requests']['Insert']
export type DbPodMemberAnalyticsInsert = Database['public']['Tables']['pod_member_analytics']['Insert']
export type DbPodMemberSettingsInsert = Database['public']['Tables']['pod_member_settings']['Insert']
export type DbPodMembershipsInsert = Database['public']['Tables']['pod_memberships']['Insert']
export type DbPodPartnershipsInsert = Database['public']['Tables']['pod_partnerships']['Insert']
export type DbPodRatingsInsert = Database['public']['Tables']['pod_ratings']['Insert']
export type DbPodSettingsInsert = Database['public']['Tables']['pod_settings']['Insert']
export type DbPodThemesInsert = Database['public']['Tables']['pod_themes']['Insert']
export type DbProceedingExchangesInsert = Database['public']['Tables']['proceeding_exchanges']['Insert']
export type DbProceedingParticipantsInsert = Database['public']['Tables']['proceeding_participants']['Insert']
export type DbProfilesInsert = Database['public']['Tables']['profiles']['Insert']
export type DbProgressQuestionResponsesInsert = Database['public']['Tables']['progress_question_responses']['Insert']
export type DbProgressSessionsInsert = Database['public']['Tables']['progress_sessions']['Insert']
export type DbPublicFiguresInsert = Database['public']['Tables']['public_figures']['Insert']
export type DbQuestionAnalyticsInsert = Database['public']['Tables']['question_analytics']['Insert']
export type DbQuestionEventConnectionsInsert = Database['public']['Tables']['question_event_connections']['Insert']
export type DbQuestionFeedbackInsert = Database['public']['Tables']['question_feedback']['Insert']
export type DbQuestionSkillsInsert = Database['public']['Tables']['question_skills']['Insert']
export type DbQuestionSourceLinksInsert = Database['public']['Tables']['question_source_links']['Insert']
export type DbQuestionTopicCategoriesInsert = Database['public']['Tables']['question_topic_categories']['Insert']
export type DbQuestionTopicsInsert = Database['public']['Tables']['question_topics']['Insert']
export type DbQuestionsInsert = Database['public']['Tables']['questions']['Insert']
export type DbQuestionsTestInsert = Database['public']['Tables']['questions_test']['Insert']
export type DbQuizAttemptsInsert = Database['public']['Tables']['quiz_attempts']['Insert']
export type DbRaffleEntriesInsert = Database['public']['Tables']['raffle_entries']['Insert']
export type DbRepresentativeContentMappingInsert = Database['public']['Tables']['representative_content_mapping']['Insert']
export type DbResearchValidationInsert = Database['public']['Tables']['research_validation']['Insert']
export type DbRewardFulfillmentsInsert = Database['public']['Tables']['reward_fulfillments']['Insert']
export type DbScenarioCharactersInsert = Database['public']['Tables']['scenario_characters']['Insert']
export type DbScenarioDecisionsInsert = Database['public']['Tables']['scenario_decisions']['Insert']
export type DbScenarioOutcomesInsert = Database['public']['Tables']['scenario_outcomes']['Insert']
export type DbScenarioResourcesInsert = Database['public']['Tables']['scenario_resources']['Insert']
export type DbScenarioSituationsInsert = Database['public']['Tables']['scenario_situations']['Insert']
export type DbScenariosInsert = Database['public']['Tables']['scenarios']['Insert']
export type DbScheduledContentJobsInsert = Database['public']['Tables']['scheduled_content_jobs']['Insert']
export type DbShareableGiftLinksInsert = Database['public']['Tables']['shareable_gift_links']['Insert']
export type DbShareableLinkClaimsInsert = Database['public']['Tables']['shareable_link_claims']['Insert']
export type DbSharedCollectionAccessInsert = Database['public']['Tables']['shared_collection_access']['Insert']
export type DbSkillAssessmentCriteriaInsert = Database['public']['Tables']['skill_assessment_criteria']['Insert']
export type DbSkillBadgesInsert = Database['public']['Tables']['skill_badges']['Insert']
export type DbSkillCategoriesInsert = Database['public']['Tables']['skill_categories']['Insert']
export type DbSkillLearningObjectivesInsert = Database['public']['Tables']['skill_learning_objectives']['Insert']
export type DbSkillMasteryTrackingInsert = Database['public']['Tables']['skill_mastery_tracking']['Insert']
export type DbSkillPracticeRecommendationsInsert = Database['public']['Tables']['skill_practice_recommendations']['Insert']
export type DbSkillPrerequisitesInsert = Database['public']['Tables']['skill_prerequisites']['Insert']
export type DbSkillProgressionPathwaysInsert = Database['public']['Tables']['skill_progression_pathways']['Insert']
export type DbSkillRelationshipsInsert = Database['public']['Tables']['skill_relationships']['Insert']
export type DbSkillsInsert = Database['public']['Tables']['skills']['Insert']
export type DbSourceCredibilityIndicatorsInsert = Database['public']['Tables']['source_credibility_indicators']['Insert']
export type DbSourceFetchQueueInsert = Database['public']['Tables']['source_fetch_queue']['Insert']
export type DbSourceMetadataInsert = Database['public']['Tables']['source_metadata']['Insert']
export type DbSpacedRepetitionScheduleInsert = Database['public']['Tables']['spaced_repetition_schedule']['Insert']
export type DbSubscriptionTierLimitsInsert = Database['public']['Tables']['subscription_tier_limits']['Insert']
export type DbSurveyAnswersInsert = Database['public']['Tables']['survey_answers']['Insert']
export type DbSurveyIncentivesInsert = Database['public']['Tables']['survey_incentives']['Insert']
export type DbSurveyLearningGoalsInsert = Database['public']['Tables']['survey_learning_goals']['Insert']
export type DbSurveyQuestionsInsert = Database['public']['Tables']['survey_questions']['Insert']
export type DbSurveyRecommendationsInsert = Database['public']['Tables']['survey_recommendations']['Insert']
export type DbSurveyResponsesInsert = Database['public']['Tables']['survey_responses']['Insert']
export type DbSurveysInsert = Database['public']['Tables']['surveys']['Insert']
export type DbSystemAlertsInsert = Database['public']['Tables']['system_alerts']['Insert']
export type DbTagsInsert = Database['public']['Tables']['tags']['Insert']
export type DbTopicEventConnectionsInsert = Database['public']['Tables']['topic_event_connections']['Insert']
export type DbTranslationJobsInsert = Database['public']['Tables']['translation_jobs']['Insert']
export type DbTrendingSearchesInsert = Database['public']['Tables']['trending_searches']['Insert']
export type DbUserAchievementsInsert = Database['public']['Tables']['user_achievements']['Insert']
export type DbUserActiveBoostsInsert = Database['public']['Tables']['user_active_boosts']['Insert']
export type DbUserAssessmentAttemptsInsert = Database['public']['Tables']['user_assessment_attempts']['Insert']
export type DbUserAssessmentsInsert = Database['public']['Tables']['user_assessments']['Insert']
export type DbUserBadgesInsert = Database['public']['Tables']['user_badges']['Insert']
export type DbUserBoostInventoryInsert = Database['public']['Tables']['user_boost_inventory']['Insert']
export type DbUserCategoryPreferencesInsert = Database['public']['Tables']['user_category_preferences']['Insert']
export type DbUserCategorySkillsInsert = Database['public']['Tables']['user_category_skills']['Insert']
export type DbUserCollectionProgressInsert = Database['public']['Tables']['user_collection_progress']['Insert']
export type DbUserCreditsInsert = Database['public']['Tables']['user_credits']['Insert']
export type DbUserCustomDecksInsert = Database['public']['Tables']['user_custom_decks']['Insert']
export type DbUserDeckContentInsert = Database['public']['Tables']['user_deck_content']['Insert']
export type DbUserDiscountUsageInsert = Database['public']['Tables']['user_discount_usage']['Insert']
export type DbUserElectionTrackingInsert = Database['public']['Tables']['user_election_tracking']['Insert']
export type DbUserEmailPreferencesInsert = Database['public']['Tables']['user_email_preferences']['Insert']
export type DbUserEventsInsert = Database['public']['Tables']['user_events']['Insert']
export type DbUserFeatureUsageInsert = Database['public']['Tables']['user_feature_usage']['Insert']
export type DbUserFeedbackInsert = Database['public']['Tables']['user_feedback']['Insert']
export type DbUserIntegrationsInsert = Database['public']['Tables']['user_integrations']['Insert']
export type DbUserLearningGoalsInsert = Database['public']['Tables']['user_learning_goals']['Insert']
export type DbUserLearningInsightsInsert = Database['public']['Tables']['user_learning_insights']['Insert']
export type DbUserLocationsInsert = Database['public']['Tables']['user_locations']['Insert']
export type DbUserNotificationSubscriptionsInsert = Database['public']['Tables']['user_notification_subscriptions']['Insert']
export type DbUserOnboardingStateInsert = Database['public']['Tables']['user_onboarding_state']['Insert']
export type DbUserPlatformPreferencesInsert = Database['public']['Tables']['user_platform_preferences']['Insert']
export type DbUserProgressInsert = Database['public']['Tables']['user_progress']['Insert']
export type DbUserProgressHistoryInsert = Database['public']['Tables']['user_progress_history']['Insert']
export type DbUserQuestionMemoryInsert = Database['public']['Tables']['user_question_memory']['Insert']
export type DbUserQuestionResponsesInsert = Database['public']['Tables']['user_question_responses']['Insert']
export type DbUserQuizAnalyticsInsert = Database['public']['Tables']['user_quiz_analytics']['Insert']
export type DbUserQuizAttemptsInsert = Database['public']['Tables']['user_quiz_attempts']['Insert']
export type DbUserRepresentativesInsert = Database['public']['Tables']['user_representatives']['Insert']
export type DbUserRolesInsert = Database['public']['Tables']['user_roles']['Insert']
export type DbUserScenarioAttemptsInsert = Database['public']['Tables']['user_scenario_attempts']['Insert']
export type DbUserScenarioDecisionsInsert = Database['public']['Tables']['user_scenario_decisions']['Insert']
export type DbUserSkillPreferencesInsert = Database['public']['Tables']['user_skill_preferences']['Insert']
export type DbUserSkillProgressInsert = Database['public']['Tables']['user_skill_progress']['Insert']
export type DbUserStreakHistoryInsert = Database['public']['Tables']['user_streak_history']['Insert']
export type DbUserSubscriptionsInsert = Database['public']['Tables']['user_subscriptions']['Insert']
export type DbUserSurveyCompletionsInsert = Database['public']['Tables']['user_survey_completions']['Insert']
export type DbWeeklyContentMetricsInsert = Database['public']['Tables']['weekly_content_metrics']['Insert']
export type DbWeeklyRecapCollectionsInsert = Database['public']['Tables']['weekly_recap_collections']['Insert']
export type DbWeeklyRecapConfigsInsert = Database['public']['Tables']['weekly_recap_configs']['Insert']

// public Update Types
export type DbAiActionExecutionsUpdate = Database['public']['Tables']['ai_action_executions']['Update']
export type DbAiCommandAnalyticsUpdate = Database['public']['Tables']['ai_command_analytics']['Update']
export type DbAiCommandExecutionsUpdate = Database['public']['Tables']['ai_command_executions']['Update']
export type DbAiResearchResultsUpdate = Database['public']['Tables']['ai_research_results']['Update']
export type DbAiResearchSessionsUpdate = Database['public']['Tables']['ai_research_sessions']['Update']
export type DbAiToolUsageUpdate = Database['public']['Tables']['ai_tool_usage']['Update']
export type DbArticleBiasAnalysisUpdate = Database['public']['Tables']['article_bias_analysis']['Update']
export type DbAssessedEntitiesUpdate = Database['public']['Tables']['assessed_entities']['Update']
export type DbAssessmentAnalyticsUpdate = Database['public']['Tables']['assessment_analytics']['Update']
export type DbAssessmentEngagementUpdate = Database['public']['Tables']['assessment_engagement']['Update']
export type DbAssessmentEvidenceUpdate = Database['public']['Tables']['assessment_evidence']['Update']
export type DbAssessmentFrameworksUpdate = Database['public']['Tables']['assessment_frameworks']['Update']
export type DbAssessmentQuestionsUpdate = Database['public']['Tables']['assessment_questions']['Update']
export type DbAssessmentScoringUpdate = Database['public']['Tables']['assessment_scoring']['Update']
export type DbAssessmentSummariesUpdate = Database['public']['Tables']['assessment_summaries']['Update']
export type DbAssessmentsUpdate = Database['public']['Tables']['assessments']['Update']
export type DbAutoGeneratedEventsUpdate = Database['public']['Tables']['auto_generated_events']['Update']
export type DbBadgeRequirementsUpdate = Database['public']['Tables']['badge_requirements']['Update']
export type DbBiasDetectionPatternsUpdate = Database['public']['Tables']['bias_detection_patterns']['Update']
export type DbBiasDimensionsUpdate = Database['public']['Tables']['bias_dimensions']['Update']
export type DbBiasFeedbackUpdate = Database['public']['Tables']['bias_feedback']['Update']
export type DbBiasLearningEventsUpdate = Database['public']['Tables']['bias_learning_events']['Update']
export type DbBillActionsUpdate = Database['public']['Tables']['bill_actions']['Update']
export type DbBillContentAnalysisUpdate = Database['public']['Tables']['bill_content_analysis']['Update']
export type DbBillCosponsorsUpdate = Database['public']['Tables']['bill_cosponsors']['Update']
export type DbBillRelationshipsUpdate = Database['public']['Tables']['bill_relationships']['Update']
export type DbBillSubjectsUpdate = Database['public']['Tables']['bill_subjects']['Update']
export type DbBillSummariesUpdate = Database['public']['Tables']['bill_summaries']['Update']
export type DbBookmarkAnalyticsUpdate = Database['public']['Tables']['bookmark_analytics']['Update']
export type DbBookmarkCollectionsUpdate = Database['public']['Tables']['bookmark_collections']['Update']
export type DbBookmarkSnippetsUpdate = Database['public']['Tables']['bookmark_snippets']['Update']
export type DbBookmarkTagsUpdate = Database['public']['Tables']['bookmark_tags']['Update']
export type DbBookmarksUpdate = Database['public']['Tables']['bookmarks']['Update']
export type DbBoostDefinitionsUpdate = Database['public']['Tables']['boost_definitions']['Update']
export type DbCalendarSyncLogsUpdate = Database['public']['Tables']['calendar_sync_logs']['Update']
export type DbCategoriesUpdate = Database['public']['Tables']['categories']['Update']
export type DbCategorySynonymsUpdate = Database['public']['Tables']['category_synonyms']['Update']
export type DbCivicContentAnalysisUpdate = Database['public']['Tables']['civic_content_analysis']['Update']
export type DbCivicEngagementEventsUpdate = Database['public']['Tables']['civic_engagement_events']['Update']
export type DbCivicsTestAnalyticsUpdate = Database['public']['Tables']['civics_test_analytics']['Update']
export type DbCleverUserMappingUpdate = Database['public']['Tables']['clever_user_mapping']['Update']
export type DbCollectionAnalyticsUpdate = Database['public']['Tables']['collection_analytics']['Update']
export type DbCollectionItemsUpdate = Database['public']['Tables']['collection_items']['Update']
export type DbCollectionReviewsUpdate = Database['public']['Tables']['collection_reviews']['Update']
export type DbCollectionSkillProgressUpdate = Database['public']['Tables']['collection_skill_progress']['Update']
export type DbCollectionsUpdate = Database['public']['Tables']['collections']['Update']
export type DbCommitteeMembershipsUpdate = Database['public']['Tables']['committee_memberships']['Update']
export type DbCongressionalBillsUpdate = Database['public']['Tables']['congressional_bills']['Update']
export type DbCongressionalCommitteesUpdate = Database['public']['Tables']['congressional_committees']['Update']
export type DbCongressionalPhotosUpdate = Database['public']['Tables']['congressional_photos']['Update']
export type DbCongressionalProceedingsUpdate = Database['public']['Tables']['congressional_proceedings']['Update']
export type DbCongressionalSessionsUpdate = Database['public']['Tables']['congressional_sessions']['Update']
export type DbCongressionalTermsUpdate = Database['public']['Tables']['congressional_terms']['Update']
export type DbCongressionalVotesUpdate = Database['public']['Tables']['congressional_votes']['Update']
export type DbContentDuplicationWarningsUpdate = Database['public']['Tables']['content_duplication_warnings']['Update']
export type DbContentFilteringRulesUpdate = Database['public']['Tables']['content_filtering_rules']['Update']
export type DbContentGapsAnalysisUpdate = Database['public']['Tables']['content_gaps_analysis']['Update']
export type DbContentGenerationQueueUpdate = Database['public']['Tables']['content_generation_queue']['Update']
export type DbContentItemSkillsUpdate = Database['public']['Tables']['content_item_skills']['Update']
export type DbContentPackagesUpdate = Database['public']['Tables']['content_packages']['Update']
export type DbContentPreviewCacheUpdate = Database['public']['Tables']['content_preview_cache']['Update']
export type DbContentPublicationLogUpdate = Database['public']['Tables']['content_publication_log']['Update']
export type DbContentRelationshipsUpdate = Database['public']['Tables']['content_relationships']['Update']
export type DbDiscountCodesUpdate = Database['public']['Tables']['discount_codes']['Update']
export type DbDocumentActionsUpdate = Database['public']['Tables']['document_actions']['Update']
export type DbDocumentRelationshipsUpdate = Database['public']['Tables']['document_relationships']['Update']
export type DbDocumentSourcesUpdate = Database['public']['Tables']['document_sources']['Update']
export type DbDocumentSubjectsUpdate = Database['public']['Tables']['document_subjects']['Update']
export type DbElectionInfoUpdate = Database['public']['Tables']['election_info']['Update']
export type DbEventResearchSuggestionsUpdate = Database['public']['Tables']['event_research_suggestions']['Update']
export type DbEventTimelineConnectionsUpdate = Database['public']['Tables']['event_timeline_connections']['Update']
export type DbEventsUpdate = Database['public']['Tables']['events']['Update']
export type DbExtractedEntitiesUpdate = Database['public']['Tables']['extracted_entities']['Update']
export type DbExtractedRelationshipsUpdate = Database['public']['Tables']['extracted_relationships']['Update']
export type DbFactCheckLogsUpdate = Database['public']['Tables']['fact_check_logs']['Update']
export type DbFigureEventsUpdate = Database['public']['Tables']['figure_events']['Update']
export type DbFigureOrganizationsUpdate = Database['public']['Tables']['figure_organizations']['Update']
export type DbFigurePolicyPositionsUpdate = Database['public']['Tables']['figure_policy_positions']['Update']
export type DbFigureQuizTopicsUpdate = Database['public']['Tables']['figure_quiz_topics']['Update']
export type DbFigureRelationshipsUpdate = Database['public']['Tables']['figure_relationships']['Update']
export type DbFriendRequestsUpdate = Database['public']['Tables']['friend_requests']['Update']
export type DbGiftCreditsUpdate = Database['public']['Tables']['gift_credits']['Update']
export type DbGiftRedemptionsUpdate = Database['public']['Tables']['gift_redemptions']['Update']
export type DbGlossaryContentReferencesUpdate = Database['public']['Tables']['glossary_content_references']['Update']
export type DbGlossaryGameSessionsUpdate = Database['public']['Tables']['glossary_game_sessions']['Update']
export type DbGlossaryGamesUpdate = Database['public']['Tables']['glossary_games']['Update']
export type DbGlossaryTermCategoriesUpdate = Database['public']['Tables']['glossary_term_categories']['Update']
export type DbGlossaryTermRelationshipsUpdate = Database['public']['Tables']['glossary_term_relationships']['Update']
export type DbGlossaryTermsUpdate = Database['public']['Tables']['glossary_terms']['Update']
export type DbGlossaryUsageAnalyticsUpdate = Database['public']['Tables']['glossary_usage_analytics']['Update']
export type DbGuestCivicsTestResultsUpdate = Database['public']['Tables']['guest_civics_test_results']['Update']
export type DbGuestUsageAnalyticsUpdate = Database['public']['Tables']['guest_usage_analytics']['Update']
export type DbGuestUsageTrackingUpdate = Database['public']['Tables']['guest_usage_tracking']['Update']
export type DbImageAbTestResultsUpdate = Database['public']['Tables']['image_ab_test_results']['Update']
export type DbImageGenerationAnalyticsUpdate = Database['public']['Tables']['image_generation_analytics']['Update']
export type DbIndicatorActionsUpdate = Database['public']['Tables']['indicator_actions']['Update']
export type DbIndicatorAssessmentsUpdate = Database['public']['Tables']['indicator_assessments']['Update']
export type DbIndicatorCategoriesUpdate = Database['public']['Tables']['indicator_categories']['Update']
export type DbIndicatorContentLinksUpdate = Database['public']['Tables']['indicator_content_links']['Update']
export type DbIndicatorsUpdate = Database['public']['Tables']['indicators']['Update']
export type DbJobExecutionLogsUpdate = Database['public']['Tables']['job_execution_logs']['Update']
export type DbKeyPolicyPositionsUpdate = Database['public']['Tables']['key_policy_positions']['Update']
export type DbKnowledgeConnectionsUpdate = Database['public']['Tables']['knowledge_connections']['Update']
export type DbLearningObjectivesUpdate = Database['public']['Tables']['learning_objectives']['Update']
export type DbLearningPodsUpdate = Database['public']['Tables']['learning_pods']['Update']
export type DbLegislativeDocumentsUpdate = Database['public']['Tables']['legislative_documents']['Update']
export type DbLocationCoverageUpdate = Database['public']['Tables']['location_coverage']['Update']
export type DbMediaOrganizationsUpdate = Database['public']['Tables']['media_organizations']['Update']
export type DbMemberIndividualSettingsUpdate = Database['public']['Tables']['member_individual_settings']['Update']
export type DbMemberVotesUpdate = Database['public']['Tables']['member_votes']['Update']
export type DbMultiplayerChatMessagesUpdate = Database['public']['Tables']['multiplayer_chat_messages']['Update']
export type DbMultiplayerConversationContextUpdate = Database['public']['Tables']['multiplayer_conversation_context']['Update']
export type DbMultiplayerGameEventsUpdate = Database['public']['Tables']['multiplayer_game_events']['Update']
export type DbMultiplayerGameSessionsUpdate = Database['public']['Tables']['multiplayer_game_sessions']['Update']
export type DbMultiplayerNpcPlayersUpdate = Database['public']['Tables']['multiplayer_npc_players']['Update']
export type DbMultiplayerQuestionResponsesUpdate = Database['public']['Tables']['multiplayer_question_responses']['Update']
export type DbMultiplayerQuizAttemptsUpdate = Database['public']['Tables']['multiplayer_quiz_attempts']['Update']
export type DbMultiplayerRoomEventsUpdate = Database['public']['Tables']['multiplayer_room_events']['Update']
export type DbMultiplayerRoomPlayersUpdate = Database['public']['Tables']['multiplayer_room_players']['Update']
export type DbMultiplayerRoomsUpdate = Database['public']['Tables']['multiplayer_rooms']['Update']
export type DbNewsAgentConfigUpdate = Database['public']['Tables']['news_agent_config']['Update']
export type DbNewsAgentLogsUpdate = Database['public']['Tables']['news_agent_logs']['Update']
export type DbNewsCacheUpdate = Database['public']['Tables']['news_cache']['Update']
export type DbNewsEventsUpdate = Database['public']['Tables']['news_events']['Update']
export type DbNotificationCampaignsUpdate = Database['public']['Tables']['notification_campaigns']['Update']
export type DbNotificationEventsUpdate = Database['public']['Tables']['notification_events']['Update']
export type DbNotificationProvidersUpdate = Database['public']['Tables']['notification_providers']['Update']
export type DbNotificationSegmentsUpdate = Database['public']['Tables']['notification_segments']['Update']
export type DbNotificationTemplatesUpdate = Database['public']['Tables']['notification_templates']['Update']
export type DbNpcCategorySpecializationsUpdate = Database['public']['Tables']['npc_category_specializations']['Update']
export type DbNpcChatTemplatesUpdate = Database['public']['Tables']['npc_chat_templates']['Update']
export type DbNpcConversationHistoryUpdate = Database['public']['Tables']['npc_conversation_history']['Update']
export type DbNpcLearningProgressionUpdate = Database['public']['Tables']['npc_learning_progression']['Update']
export type DbNpcPersonalitiesUpdate = Database['public']['Tables']['npc_personalities']['Update']
export type DbNpcQuestionResponsesUpdate = Database['public']['Tables']['npc_question_responses']['Update']
export type DbNpcQuizAttemptsUpdate = Database['public']['Tables']['npc_quiz_attempts']['Update']
export type DbOrganizationBiasScoresUpdate = Database['public']['Tables']['organization_bias_scores']['Update']
export type DbOrganizationsUpdate = Database['public']['Tables']['organizations']['Update']
export type DbParentalControlsUpdate = Database['public']['Tables']['parental_controls']['Update']
export type DbPathwaySkillsUpdate = Database['public']['Tables']['pathway_skills']['Update']
export type DbPodAchievementsUpdate = Database['public']['Tables']['pod_achievements']['Update']
export type DbPodActivitiesUpdate = Database['public']['Tables']['pod_activities']['Update']
export type DbPodActivityLogUpdate = Database['public']['Tables']['pod_activity_log']['Update']
export type DbPodAnalyticsUpdate = Database['public']['Tables']['pod_analytics']['Update']
export type DbPodAnalyticsLogUpdate = Database['public']['Tables']['pod_analytics_log']['Update']
export type DbPodChallengeParticipantsUpdate = Database['public']['Tables']['pod_challenge_participants']['Update']
export type DbPodChallengesUpdate = Database['public']['Tables']['pod_challenges']['Update']
export type DbPodInviteLinksUpdate = Database['public']['Tables']['pod_invite_links']['Update']
export type DbPodJoinRequestsUpdate = Database['public']['Tables']['pod_join_requests']['Update']
export type DbPodMemberAnalyticsUpdate = Database['public']['Tables']['pod_member_analytics']['Update']
export type DbPodMemberSettingsUpdate = Database['public']['Tables']['pod_member_settings']['Update']
export type DbPodMembershipsUpdate = Database['public']['Tables']['pod_memberships']['Update']
export type DbPodPartnershipsUpdate = Database['public']['Tables']['pod_partnerships']['Update']
export type DbPodRatingsUpdate = Database['public']['Tables']['pod_ratings']['Update']
export type DbPodSettingsUpdate = Database['public']['Tables']['pod_settings']['Update']
export type DbPodThemesUpdate = Database['public']['Tables']['pod_themes']['Update']
export type DbProceedingExchangesUpdate = Database['public']['Tables']['proceeding_exchanges']['Update']
export type DbProceedingParticipantsUpdate = Database['public']['Tables']['proceeding_participants']['Update']
export type DbProfilesUpdate = Database['public']['Tables']['profiles']['Update']
export type DbProgressQuestionResponsesUpdate = Database['public']['Tables']['progress_question_responses']['Update']
export type DbProgressSessionsUpdate = Database['public']['Tables']['progress_sessions']['Update']
export type DbPublicFiguresUpdate = Database['public']['Tables']['public_figures']['Update']
export type DbQuestionAnalyticsUpdate = Database['public']['Tables']['question_analytics']['Update']
export type DbQuestionEventConnectionsUpdate = Database['public']['Tables']['question_event_connections']['Update']
export type DbQuestionFeedbackUpdate = Database['public']['Tables']['question_feedback']['Update']
export type DbQuestionSkillsUpdate = Database['public']['Tables']['question_skills']['Update']
export type DbQuestionSourceLinksUpdate = Database['public']['Tables']['question_source_links']['Update']
export type DbQuestionTopicCategoriesUpdate = Database['public']['Tables']['question_topic_categories']['Update']
export type DbQuestionTopicsUpdate = Database['public']['Tables']['question_topics']['Update']
export type DbQuestionsUpdate = Database['public']['Tables']['questions']['Update']
export type DbQuestionsTestUpdate = Database['public']['Tables']['questions_test']['Update']
export type DbQuizAttemptsUpdate = Database['public']['Tables']['quiz_attempts']['Update']
export type DbRaffleEntriesUpdate = Database['public']['Tables']['raffle_entries']['Update']
export type DbRepresentativeContentMappingUpdate = Database['public']['Tables']['representative_content_mapping']['Update']
export type DbResearchValidationUpdate = Database['public']['Tables']['research_validation']['Update']
export type DbRewardFulfillmentsUpdate = Database['public']['Tables']['reward_fulfillments']['Update']
export type DbScenarioCharactersUpdate = Database['public']['Tables']['scenario_characters']['Update']
export type DbScenarioDecisionsUpdate = Database['public']['Tables']['scenario_decisions']['Update']
export type DbScenarioOutcomesUpdate = Database['public']['Tables']['scenario_outcomes']['Update']
export type DbScenarioResourcesUpdate = Database['public']['Tables']['scenario_resources']['Update']
export type DbScenarioSituationsUpdate = Database['public']['Tables']['scenario_situations']['Update']
export type DbScenariosUpdate = Database['public']['Tables']['scenarios']['Update']
export type DbScheduledContentJobsUpdate = Database['public']['Tables']['scheduled_content_jobs']['Update']
export type DbShareableGiftLinksUpdate = Database['public']['Tables']['shareable_gift_links']['Update']
export type DbShareableLinkClaimsUpdate = Database['public']['Tables']['shareable_link_claims']['Update']
export type DbSharedCollectionAccessUpdate = Database['public']['Tables']['shared_collection_access']['Update']
export type DbSkillAssessmentCriteriaUpdate = Database['public']['Tables']['skill_assessment_criteria']['Update']
export type DbSkillBadgesUpdate = Database['public']['Tables']['skill_badges']['Update']
export type DbSkillCategoriesUpdate = Database['public']['Tables']['skill_categories']['Update']
export type DbSkillLearningObjectivesUpdate = Database['public']['Tables']['skill_learning_objectives']['Update']
export type DbSkillMasteryTrackingUpdate = Database['public']['Tables']['skill_mastery_tracking']['Update']
export type DbSkillPracticeRecommendationsUpdate = Database['public']['Tables']['skill_practice_recommendations']['Update']
export type DbSkillPrerequisitesUpdate = Database['public']['Tables']['skill_prerequisites']['Update']
export type DbSkillProgressionPathwaysUpdate = Database['public']['Tables']['skill_progression_pathways']['Update']
export type DbSkillRelationshipsUpdate = Database['public']['Tables']['skill_relationships']['Update']
export type DbSkillsUpdate = Database['public']['Tables']['skills']['Update']
export type DbSourceCredibilityIndicatorsUpdate = Database['public']['Tables']['source_credibility_indicators']['Update']
export type DbSourceFetchQueueUpdate = Database['public']['Tables']['source_fetch_queue']['Update']
export type DbSourceMetadataUpdate = Database['public']['Tables']['source_metadata']['Update']
export type DbSpacedRepetitionScheduleUpdate = Database['public']['Tables']['spaced_repetition_schedule']['Update']
export type DbSubscriptionTierLimitsUpdate = Database['public']['Tables']['subscription_tier_limits']['Update']
export type DbSurveyAnswersUpdate = Database['public']['Tables']['survey_answers']['Update']
export type DbSurveyIncentivesUpdate = Database['public']['Tables']['survey_incentives']['Update']
export type DbSurveyLearningGoalsUpdate = Database['public']['Tables']['survey_learning_goals']['Update']
export type DbSurveyQuestionsUpdate = Database['public']['Tables']['survey_questions']['Update']
export type DbSurveyRecommendationsUpdate = Database['public']['Tables']['survey_recommendations']['Update']
export type DbSurveyResponsesUpdate = Database['public']['Tables']['survey_responses']['Update']
export type DbSurveysUpdate = Database['public']['Tables']['surveys']['Update']
export type DbSystemAlertsUpdate = Database['public']['Tables']['system_alerts']['Update']
export type DbTagsUpdate = Database['public']['Tables']['tags']['Update']
export type DbTopicEventConnectionsUpdate = Database['public']['Tables']['topic_event_connections']['Update']
export type DbTranslationJobsUpdate = Database['public']['Tables']['translation_jobs']['Update']
export type DbTrendingSearchesUpdate = Database['public']['Tables']['trending_searches']['Update']
export type DbUserAchievementsUpdate = Database['public']['Tables']['user_achievements']['Update']
export type DbUserActiveBoostsUpdate = Database['public']['Tables']['user_active_boosts']['Update']
export type DbUserAssessmentAttemptsUpdate = Database['public']['Tables']['user_assessment_attempts']['Update']
export type DbUserAssessmentsUpdate = Database['public']['Tables']['user_assessments']['Update']
export type DbUserBadgesUpdate = Database['public']['Tables']['user_badges']['Update']
export type DbUserBoostInventoryUpdate = Database['public']['Tables']['user_boost_inventory']['Update']
export type DbUserCategoryPreferencesUpdate = Database['public']['Tables']['user_category_preferences']['Update']
export type DbUserCategorySkillsUpdate = Database['public']['Tables']['user_category_skills']['Update']
export type DbUserCollectionProgressUpdate = Database['public']['Tables']['user_collection_progress']['Update']
export type DbUserCreditsUpdate = Database['public']['Tables']['user_credits']['Update']
export type DbUserCustomDecksUpdate = Database['public']['Tables']['user_custom_decks']['Update']
export type DbUserDeckContentUpdate = Database['public']['Tables']['user_deck_content']['Update']
export type DbUserDiscountUsageUpdate = Database['public']['Tables']['user_discount_usage']['Update']
export type DbUserElectionTrackingUpdate = Database['public']['Tables']['user_election_tracking']['Update']
export type DbUserEmailPreferencesUpdate = Database['public']['Tables']['user_email_preferences']['Update']
export type DbUserEventsUpdate = Database['public']['Tables']['user_events']['Update']
export type DbUserFeatureUsageUpdate = Database['public']['Tables']['user_feature_usage']['Update']
export type DbUserFeedbackUpdate = Database['public']['Tables']['user_feedback']['Update']
export type DbUserIntegrationsUpdate = Database['public']['Tables']['user_integrations']['Update']
export type DbUserLearningGoalsUpdate = Database['public']['Tables']['user_learning_goals']['Update']
export type DbUserLearningInsightsUpdate = Database['public']['Tables']['user_learning_insights']['Update']
export type DbUserLocationsUpdate = Database['public']['Tables']['user_locations']['Update']
export type DbUserNotificationSubscriptionsUpdate = Database['public']['Tables']['user_notification_subscriptions']['Update']
export type DbUserOnboardingStateUpdate = Database['public']['Tables']['user_onboarding_state']['Update']
export type DbUserPlatformPreferencesUpdate = Database['public']['Tables']['user_platform_preferences']['Update']
export type DbUserProgressUpdate = Database['public']['Tables']['user_progress']['Update']
export type DbUserProgressHistoryUpdate = Database['public']['Tables']['user_progress_history']['Update']
export type DbUserQuestionMemoryUpdate = Database['public']['Tables']['user_question_memory']['Update']
export type DbUserQuestionResponsesUpdate = Database['public']['Tables']['user_question_responses']['Update']
export type DbUserQuizAnalyticsUpdate = Database['public']['Tables']['user_quiz_analytics']['Update']
export type DbUserQuizAttemptsUpdate = Database['public']['Tables']['user_quiz_attempts']['Update']
export type DbUserRepresentativesUpdate = Database['public']['Tables']['user_representatives']['Update']
export type DbUserRolesUpdate = Database['public']['Tables']['user_roles']['Update']
export type DbUserScenarioAttemptsUpdate = Database['public']['Tables']['user_scenario_attempts']['Update']
export type DbUserScenarioDecisionsUpdate = Database['public']['Tables']['user_scenario_decisions']['Update']
export type DbUserSkillPreferencesUpdate = Database['public']['Tables']['user_skill_preferences']['Update']
export type DbUserSkillProgressUpdate = Database['public']['Tables']['user_skill_progress']['Update']
export type DbUserStreakHistoryUpdate = Database['public']['Tables']['user_streak_history']['Update']
export type DbUserSubscriptionsUpdate = Database['public']['Tables']['user_subscriptions']['Update']
export type DbUserSurveyCompletionsUpdate = Database['public']['Tables']['user_survey_completions']['Update']
export type DbWeeklyContentMetricsUpdate = Database['public']['Tables']['weekly_content_metrics']['Update']
export type DbWeeklyRecapCollectionsUpdate = Database['public']['Tables']['weekly_recap_collections']['Update']
export type DbWeeklyRecapConfigsUpdate = Database['public']['Tables']['weekly_recap_configs']['Update']

// public Views
export type DbAiGeneratedTopicsView = Database['public']['Views']['ai_generated_topics']['Row']
export type DbAssessmentQuestionStatsView = Database['public']['Views']['assessment_question_stats']['Row']
export type DbCampaignPerformanceView = Database['public']['Views']['campaign_performance']['Row']
export type DbCivicEngagementImpactView = Database['public']['Views']['civic_engagement_impact']['Row']
export type DbCivicsTestAttemptsView = Database['public']['Views']['civics_test_attempts']['Row']
export type DbCivicsTestMetricsView = Database['public']['Views']['civics_test_metrics']['Row']
export type DbContentRelationshipAnalysisView = Database['public']['Views']['content_relationship_analysis']['Row']
export type DbCurrentAssessmentStatusView = Database['public']['Views']['current_assessment_status']['Row']
export type DbFunctionTypeValidationView = Database['public']['Views']['function_type_validation']['Row']
export type DbFunctionValidationSummaryView = Database['public']['Views']['function_validation_summary']['Row']
export type DbIndicatorTrendsView = Database['public']['Views']['indicator_trends']['Row']
export type DbMultiplayerAttemptsView = Database['public']['Views']['multiplayer_attempts']['Row']
export type DbMultiplayerRoomFunctionValidationView = Database['public']['Views']['multiplayer_room_function_validation']['Row']
export type DbMultiplayerRoomsViewView = Database['public']['Views']['multiplayer_rooms_view']['Row']
export type DbNewsAgentPerformanceView = Database['public']['Views']['news_agent_performance']['Row']
export type DbNpcVsHumanAnalyticsView = Database['public']['Views']['npc_vs_human_analytics']['Row']
export type DbPodActivityView = Database['public']['Views']['pod_activity']['Row']
export type DbPodActivityDetailsView = Database['public']['Views']['pod_activity_details']['Row']
export type DbPodDiscoveryView = Database['public']['Views']['pod_discovery']['Row']
export type DbPodMemberDetailsView = Database['public']['Views']['pod_member_details']['Row']
export type DbPracticeAttemptsView = Database['public']['Views']['practice_attempts']['Row']
export type DbProviderPerformanceView = Database['public']['Views']['provider_performance']['Row']
export type DbQuestionFeedbackStatsView = Database['public']['Views']['question_feedback_stats']['Row']
export type DbQuestionResponseStatsView = Database['public']['Views']['question_response_stats']['Row']
export type DbQuestionSourcesEnhancedView = Database['public']['Views']['question_sources_enhanced']['Row']
export type DbSurveySummaryView = Database['public']['Views']['survey_summary']['Row']
export type DbTranslationJobStatsView = Database['public']['Views']['translation_job_stats']['Row']
export type DbUserComprehensiveStatsView = Database['public']['Views']['user_comprehensive_stats']['Row']
export type DbUserComprehensiveStatsPremiumView = Database['public']['Views']['user_comprehensive_stats_premium']['Row']
export type DbUserSkillAnalyticsView = Database['public']['Views']['user_skill_analytics']['Row']

// public Enums
export type DbCourseRoleEnum = Database['public']['Enums']['course_role']
export type DbEnrollmentStatusEnum = Database['public']['Enums']['enrollment_status']
export type DbQuizGameModeEnum = Database['public']['Enums']['quiz_game_mode']
export type DbSchoolUserRoleEnum = Database['public']['Enums']['school_user_role']
export type DbSyncStatusEnum = Database['public']['Enums']['sync_status']
export type DbSyncTypeEnum = Database['public']['Enums']['sync_type']

// public Functions
export type DbAddNpcToMultiplayerRoomFunction = Database['public']['Functions']['add_npc_to_multiplayer_room']
export type DbAddNpcToMultiplayerRoomArgs = Database['public']['Functions']['add_npc_to_multiplayer_room']['Args']
export type DbAddNpcToMultiplayerRoomReturns = Database['public']['Functions']['add_npc_to_multiplayer_room']['Returns']
export type DbAddSourceToGlossaryTermFunction = Database['public']['Functions']['add_source_to_glossary_term']
export type DbAddSourceToGlossaryTermArgs = Database['public']['Functions']['add_source_to_glossary_term']['Args']
export type DbAddSourceToGlossaryTermReturns = Database['public']['Functions']['add_source_to_glossary_term']['Returns']
export type DbAnalyzeImageAbTestFunction = Database['public']['Functions']['analyze_image_ab_test']
export type DbAnalyzeImageAbTestArgs = Database['public']['Functions']['analyze_image_ab_test']['Args']
export type DbAnalyzeImageAbTestReturns = Database['public']['Functions']['analyze_image_ab_test']['Returns']
export type DbCalculateAssessmentScoreFunction = Database['public']['Functions']['calculate_assessment_score']
export type DbCalculateAssessmentScoreArgs = Database['public']['Functions']['calculate_assessment_score']['Args']
export type DbCalculateAssessmentScoreReturns = Database['public']['Functions']['calculate_assessment_score']['Returns']
export type DbCalculateBiasConsensusFunction = Database['public']['Functions']['calculate_bias_consensus']
export type DbCalculateBiasConsensusArgs = Database['public']['Functions']['calculate_bias_consensus']['Args']
export type DbCalculateBiasConsensusReturns = Database['public']['Functions']['calculate_bias_consensus']['Returns']
export type DbCalculateGiftCreditsFunction = Database['public']['Functions']['calculate_gift_credits']
export type DbCalculateGiftCreditsArgs = Database['public']['Functions']['calculate_gift_credits']['Args']
export type DbCalculateGiftCreditsReturns = Database['public']['Functions']['calculate_gift_credits']['Returns']
export type DbCalculateNextRunTimeFunction = Database['public']['Functions']['calculate_next_run_time']
export type DbCalculateNextRunTimeArgs = Database['public']['Functions']['calculate_next_run_time']['Args']
export type DbCalculateNextRunTimeReturns = Database['public']['Functions']['calculate_next_run_time']['Returns']
export type DbCalculatePodAnalyticsFunction = Database['public']['Functions']['calculate_pod_analytics']
export type DbCalculatePodAnalyticsArgs = Database['public']['Functions']['calculate_pod_analytics']['Args']
export type DbCalculatePodAnalyticsReturns = Database['public']['Functions']['calculate_pod_analytics']['Returns']
export type DbCalculateScenarioCompletionFunction = Database['public']['Functions']['calculate_scenario_completion']
export type DbCalculateScenarioCompletionArgs = Database['public']['Functions']['calculate_scenario_completion']['Args']
export type DbCalculateScenarioCompletionReturns = Database['public']['Functions']['calculate_scenario_completion']['Returns']
export type DbCalculateWeeklyContentScoreFunction = Database['public']['Functions']['calculate_weekly_content_score']
export type DbCalculateWeeklyContentScoreArgs = Database['public']['Functions']['calculate_weekly_content_score']['Args']
export type DbCalculateWeeklyContentScoreReturns = Database['public']['Functions']['calculate_weekly_content_score']['Returns']
export type DbCanAccessRoomFunction = Database['public']['Functions']['can_access_room']
export type DbCanAccessRoomArgs = Database['public']['Functions']['can_access_room']['Args']
export type DbCanAccessRoomReturns = Database['public']['Functions']['can_access_room']['Returns']
export type DbCanJoinPodViaInviteFunction = Database['public']['Functions']['can_join_pod_via_invite']
export type DbCanJoinPodViaInviteArgs = Database['public']['Functions']['can_join_pod_via_invite']['Args']
export type DbCanJoinPodViaInviteReturns = Database['public']['Functions']['can_join_pod_via_invite']['Returns']
export type DbCheckAllPlayersReadyFunction = Database['public']['Functions']['check_all_players_ready']
export type DbCheckAllPlayersReadyArgs = Database['public']['Functions']['check_all_players_ready']['Args']
export type DbCheckAllPlayersReadyReturns = Database['public']['Functions']['check_all_players_ready']['Returns']
export type DbCheckAndAwardAchievementsFunction = Database['public']['Functions']['check_and_award_achievements']
export type DbCheckAndAwardAchievementsArgs = Database['public']['Functions']['check_and_award_achievements']['Args']
export type DbCheckAndAwardAchievementsReturns = Database['public']['Functions']['check_and_award_achievements']['Returns']
export type DbCheckBoostCooldownFunction = Database['public']['Functions']['check_boost_cooldown']
export type DbCheckBoostCooldownArgs = Database['public']['Functions']['check_boost_cooldown']['Args']
export type DbCheckBoostCooldownReturns = Database['public']['Functions']['check_boost_cooldown']['Returns']
export type DbCheckImageGenerationPerformanceFunction = Database['public']['Functions']['check_image_generation_performance']
export type DbCheckImageGenerationPerformanceArgs = Database['public']['Functions']['check_image_generation_performance']['Args']
export type DbCheckImageGenerationPerformanceReturns = Database['public']['Functions']['check_image_generation_performance']['Returns']
export type DbCheckIncentiveEligibilityFunction = Database['public']['Functions']['check_incentive_eligibility']
export type DbCheckIncentiveEligibilityArgs = Database['public']['Functions']['check_incentive_eligibility']['Args']
export type DbCheckIncentiveEligibilityReturns = Database['public']['Functions']['check_incentive_eligibility']['Returns']
export type DbCheckPremiumFeatureAccessFunction = Database['public']['Functions']['check_premium_feature_access']
export type DbCheckPremiumFeatureAccessArgs = Database['public']['Functions']['check_premium_feature_access']['Args']
export type DbCheckPremiumFeatureAccessReturns = Database['public']['Functions']['check_premium_feature_access']['Returns']
export type DbCheckSilenceInterventionFunction = Database['public']['Functions']['check_silence_intervention']
export type DbCheckSilenceInterventionArgs = Database['public']['Functions']['check_silence_intervention']['Args']
export type DbCheckSilenceInterventionReturns = Database['public']['Functions']['check_silence_intervention']['Returns']
export type DbClaimShareableGiftLinkFunction = Database['public']['Functions']['claim_shareable_gift_link']
export type DbClaimShareableGiftLinkArgs = Database['public']['Functions']['claim_shareable_gift_link']['Args']
export type DbClaimShareableGiftLinkReturns = Database['public']['Functions']['claim_shareable_gift_link']['Returns']
export type DbCleanupExpiredAgentMemoryFunction = Database['public']['Functions']['cleanup_expired_agent_memory']
export type DbCleanupExpiredAgentMemoryArgs = Database['public']['Functions']['cleanup_expired_agent_memory']['Args']
export type DbCleanupExpiredAgentMemoryReturns = Database['public']['Functions']['cleanup_expired_agent_memory']['Returns']
export type DbCleanupExpiredBoostsFunction = Database['public']['Functions']['cleanup_expired_boosts']
export type DbCleanupExpiredBoostsArgs = Database['public']['Functions']['cleanup_expired_boosts']['Args']
export type DbCleanupExpiredBoostsReturns = Database['public']['Functions']['cleanup_expired_boosts']['Returns']
export type DbCleanupExpiredProgressSessionsFunction = Database['public']['Functions']['cleanup_expired_progress_sessions']
export type DbCleanupExpiredProgressSessionsArgs = Database['public']['Functions']['cleanup_expired_progress_sessions']['Args']
export type DbCleanupExpiredProgressSessionsReturns = Database['public']['Functions']['cleanup_expired_progress_sessions']['Returns']
export type DbCleanupExpiredRoomsFunction = Database['public']['Functions']['cleanup_expired_rooms']
export type DbCleanupExpiredRoomsArgs = Database['public']['Functions']['cleanup_expired_rooms']['Args']
export type DbCleanupExpiredRoomsReturns = Database['public']['Functions']['cleanup_expired_rooms']['Returns']
export type DbCleanupInactivePlayersFunction = Database['public']['Functions']['cleanup_inactive_players']
export type DbCleanupInactivePlayersArgs = Database['public']['Functions']['cleanup_inactive_players']['Args']
export type DbCleanupInactivePlayersReturns = Database['public']['Functions']['cleanup_inactive_players']['Returns']
export type DbCleanupOldJobDataFunction = Database['public']['Functions']['cleanup_old_job_data']
export type DbCleanupOldJobDataArgs = Database['public']['Functions']['cleanup_old_job_data']['Args']
export type DbCleanupOldJobDataReturns = Database['public']['Functions']['cleanup_old_job_data']['Returns']
export type DbCleanupOldTranslationJobsFunction = Database['public']['Functions']['cleanup_old_translation_jobs']
export type DbCleanupOldTranslationJobsArgs = Database['public']['Functions']['cleanup_old_translation_jobs']['Args']
export type DbCleanupOldTranslationJobsReturns = Database['public']['Functions']['cleanup_old_translation_jobs']['Returns']
export type DbCleanupOldTrendingSearchesFunction = Database['public']['Functions']['cleanup_old_trending_searches']
export type DbCleanupOldTrendingSearchesArgs = Database['public']['Functions']['cleanup_old_trending_searches']['Args']
export type DbCleanupOldTrendingSearchesReturns = Database['public']['Functions']['cleanup_old_trending_searches']['Returns']
export type DbCompleteOnboardingStepFunction = Database['public']['Functions']['complete_onboarding_step']
export type DbCompleteOnboardingStepArgs = Database['public']['Functions']['complete_onboarding_step']['Args']
export type DbCompleteOnboardingStepReturns = Database['public']['Functions']['complete_onboarding_step']['Returns']
export type DbConvertGuestCivicsResultsFunction = Database['public']['Functions']['convert_guest_civics_results']
export type DbConvertGuestCivicsResultsArgs = Database['public']['Functions']['convert_guest_civics_results']['Args']
export type DbConvertGuestCivicsResultsReturns = Database['public']['Functions']['convert_guest_civics_results']['Returns']
export type DbCreateGiftRedemptionFunction = Database['public']['Functions']['create_gift_redemption']
export type DbCreateGiftRedemptionArgs = Database['public']['Functions']['create_gift_redemption']['Args']
export type DbCreateGiftRedemptionReturns = Database['public']['Functions']['create_gift_redemption']['Returns']
export type DbCreateLearningPodFunction = Database['public']['Functions']['create_learning_pod']
export type DbCreateLearningPodArgs = Database['public']['Functions']['create_learning_pod']['Args']
export type DbCreateLearningPodReturns = Database['public']['Functions']['create_learning_pod']['Returns']
export type DbCreateMultiplayerRoomFunction = Database['public']['Functions']['create_multiplayer_room']
export type DbCreateMultiplayerRoomArgs = Database['public']['Functions']['create_multiplayer_room']['Args']
export type DbCreateMultiplayerRoomReturns = Database['public']['Functions']['create_multiplayer_room']['Returns']
export type DbCreatePodInviteLinkFunction = Database['public']['Functions']['create_pod_invite_link']
export type DbCreatePodInviteLinkArgs = Database['public']['Functions']['create_pod_invite_link']['Args']
export type DbCreatePodInviteLinkReturns = Database['public']['Functions']['create_pod_invite_link']['Returns']
export type DbCreateScenarioRoomFunction = Database['public']['Functions']['create_scenario_room']
export type DbCreateScenarioRoomArgs = Database['public']['Functions']['create_scenario_room']['Args']
export type DbCreateScenarioRoomReturns = Database['public']['Functions']['create_scenario_room']['Returns']
export type DbCreateShareableGiftLinkFunction = Database['public']['Functions']['create_shareable_gift_link']
export type DbCreateShareableGiftLinkArgs = Database['public']['Functions']['create_shareable_gift_link']['Args']
export type DbCreateShareableGiftLinkReturns = Database['public']['Functions']['create_shareable_gift_link']['Returns']
export type DbDetectAllTypeMismatchesFunction = Database['public']['Functions']['detect_all_type_mismatches']
export type DbDetectAllTypeMismatchesArgs = Database['public']['Functions']['detect_all_type_mismatches']['Args']
export type DbDetectAllTypeMismatchesReturns = Database['public']['Functions']['detect_all_type_mismatches']['Returns']
export type DbFindDuplicatePublicFiguresFunction = Database['public']['Functions']['find_duplicate_public_figures']
export type DbFindDuplicatePublicFiguresArgs = Database['public']['Functions']['find_duplicate_public_figures']['Args']
export type DbFindDuplicatePublicFiguresReturns = Database['public']['Functions']['find_duplicate_public_figures']['Returns']
export type DbFindPotentialFriendsFunction = Database['public']['Functions']['find_potential_friends']
export type DbFindPotentialFriendsArgs = Database['public']['Functions']['find_potential_friends']['Args']
export type DbFindPotentialFriendsReturns = Database['public']['Functions']['find_potential_friends']['Returns']
export type DbGenerateInviteCodeFunction = Database['public']['Functions']['generate_invite_code']
export type DbGenerateInviteCodeArgs = Database['public']['Functions']['generate_invite_code']['Args']
export type DbGenerateInviteCodeReturns = Database['public']['Functions']['generate_invite_code']['Returns']
export type DbGeneratePodSlugFunction = Database['public']['Functions']['generate_pod_slug']
export type DbGeneratePodSlugArgs = Database['public']['Functions']['generate_pod_slug']['Args']
export type DbGeneratePodSlugReturns = Database['public']['Functions']['generate_pod_slug']['Returns']
export type DbGenerateRoomCodeFunction = Database['public']['Functions']['generate_room_code']
export type DbGenerateRoomCodeArgs = Database['public']['Functions']['generate_room_code']['Args']
export type DbGenerateRoomCodeReturns = Database['public']['Functions']['generate_room_code']['Returns']
export type DbGenerateRoomSlugFunction = Database['public']['Functions']['generate_room_slug']
export type DbGenerateRoomSlugArgs = Database['public']['Functions']['generate_room_slug']['Args']
export type DbGenerateRoomSlugReturns = Database['public']['Functions']['generate_room_slug']['Returns']
export type DbGenerateSlugFunction = Database['public']['Functions']['generate_slug']
export type DbGenerateSlugArgs = Database['public']['Functions']['generate_slug']['Args']
export type DbGenerateSlugReturns = Database['public']['Functions']['generate_slug']['Returns']
export type DbGenerateTicketCodeFunction = Database['public']['Functions']['generate_ticket_code']
export type DbGenerateTicketCodeArgs = Database['public']['Functions']['generate_ticket_code']['Args']
export type DbGenerateTicketCodeReturns = Database['public']['Functions']['generate_ticket_code']['Returns']
export type DbGetActiveGameSessionFunction = Database['public']['Functions']['get_active_game_session']
export type DbGetActiveGameSessionArgs = Database['public']['Functions']['get_active_game_session']['Args']
export type DbGetActiveGameSessionReturns = Database['public']['Functions']['get_active_game_session']['Returns']
export type DbGetActiveMultiplayerRoomsFunction = Database['public']['Functions']['get_active_multiplayer_rooms']
export type DbGetActiveMultiplayerRoomsArgs = Database['public']['Functions']['get_active_multiplayer_rooms']['Args']
export type DbGetActiveMultiplayerRoomsReturns = Database['public']['Functions']['get_active_multiplayer_rooms']['Returns']
export type DbGetAssessmentQuestionSocialProofStatsFunction = Database['public']['Functions']['get_assessment_question_social_proof_stats']
export type DbGetAssessmentQuestionSocialProofStatsArgs = Database['public']['Functions']['get_assessment_question_social_proof_stats']['Args']
export type DbGetAssessmentQuestionSocialProofStatsReturns = Database['public']['Functions']['get_assessment_question_social_proof_stats']['Returns']
export type DbGetAvailableBoostsForUserFunction = Database['public']['Functions']['get_available_boosts_for_user']
export type DbGetAvailableBoostsForUserArgs = Database['public']['Functions']['get_available_boosts_for_user']['Args']
export type DbGetAvailableBoostsForUserReturns = Database['public']['Functions']['get_available_boosts_for_user']['Returns']
export type DbGetCategoryStatsBatchFunction = Database['public']['Functions']['get_category_stats_batch']
export type DbGetCategoryStatsBatchArgs = Database['public']['Functions']['get_category_stats_batch']['Args']
export type DbGetCategoryStatsBatchReturns = Database['public']['Functions']['get_category_stats_batch']['Returns']
export type DbGetCollectionSkillsFunction = Database['public']['Functions']['get_collection_skills']
export type DbGetCollectionSkillsArgs = Database['public']['Functions']['get_collection_skills']['Args']
export type DbGetCollectionSkillsReturns = Database['public']['Functions']['get_collection_skills']['Returns']
export type DbGetCollectionsWithSkillCategoriesFunction = Database['public']['Functions']['get_collections_with_skill_categories']
export type DbGetCollectionsWithSkillCategoriesArgs = Database['public']['Functions']['get_collections_with_skill_categories']['Args']
export type DbGetCollectionsWithSkillCategoriesReturns = Database['public']['Functions']['get_collections_with_skill_categories']['Returns']
export type DbGetCollectionsWithSkillsFunction = Database['public']['Functions']['get_collections_with_skills']
export type DbGetCollectionsWithSkillsArgs = Database['public']['Functions']['get_collections_with_skills']['Args']
export type DbGetCollectionsWithSkillsReturns = Database['public']['Functions']['get_collections_with_skills']['Returns']
export type DbGetContentRelationshipsFunction = Database['public']['Functions']['get_content_relationships']
export type DbGetContentRelationshipsArgs = Database['public']['Functions']['get_content_relationships']['Args']
export type DbGetContentRelationshipsReturns = Database['public']['Functions']['get_content_relationships']['Returns']
export type DbGetContentTranslationStatsFunction = Database['public']['Functions']['get_content_translation_stats']
export type DbGetContentTranslationStatsArgs = Database['public']['Functions']['get_content_translation_stats']['Args']
export type DbGetContentTranslationStatsReturns = Database['public']['Functions']['get_content_translation_stats']['Returns']
export type DbGetDetailedGiftCreditsFunction = Database['public']['Functions']['get_detailed_gift_credits']
export type DbGetDetailedGiftCreditsArgs = Database['public']['Functions']['get_detailed_gift_credits']['Args']
export type DbGetDetailedGiftCreditsReturns = Database['public']['Functions']['get_detailed_gift_credits']['Returns']
export type DbGetEffectiveMemberSettingsFunction = Database['public']['Functions']['get_effective_member_settings']
export type DbGetEffectiveMemberSettingsArgs = Database['public']['Functions']['get_effective_member_settings']['Args']
export type DbGetEffectiveMemberSettingsReturns = Database['public']['Functions']['get_effective_member_settings']['Returns']
export type DbGetEventTimelineFunction = Database['public']['Functions']['get_event_timeline']
export type DbGetEventTimelineArgs = Database['public']['Functions']['get_event_timeline']['Args']
export type DbGetEventTimelineReturns = Database['public']['Functions']['get_event_timeline']['Returns']
export type DbGetFunctionReturnInfoFunction = Database['public']['Functions']['get_function_return_info']
export type DbGetFunctionReturnInfoArgs = Database['public']['Functions']['get_function_return_info']['Args']
export type DbGetFunctionReturnInfoReturns = Database['public']['Functions']['get_function_return_info']['Returns']
export type DbGetGiftAnalyticsSummaryFunction = Database['public']['Functions']['get_gift_analytics_summary']
export type DbGetGiftAnalyticsSummaryArgs = Database['public']['Functions']['get_gift_analytics_summary']['Args']
export type DbGetGiftAnalyticsSummaryReturns = Database['public']['Functions']['get_gift_analytics_summary']['Returns']
export type DbGetGlossaryTermWithSourcesFunction = Database['public']['Functions']['get_glossary_term_with_sources']
export type DbGetGlossaryTermWithSourcesArgs = Database['public']['Functions']['get_glossary_term_with_sources']['Args']
export type DbGetGlossaryTermWithSourcesReturns = Database['public']['Functions']['get_glossary_term_with_sources']['Returns']
export type DbGetGuestTestSummaryFunction = Database['public']['Functions']['get_guest_test_summary']
export type DbGetGuestTestSummaryArgs = Database['public']['Functions']['get_guest_test_summary']['Args']
export type DbGetGuestTestSummaryReturns = Database['public']['Functions']['get_guest_test_summary']['Returns']
export type DbGetJobsReadyForExecutionFunction = Database['public']['Functions']['get_jobs_ready_for_execution']
export type DbGetJobsReadyForExecutionArgs = Database['public']['Functions']['get_jobs_ready_for_execution']['Args']
export type DbGetJobsReadyForExecutionReturns = Database['public']['Functions']['get_jobs_ready_for_execution']['Returns']
export type DbGetNpcCategoryPerformanceFunction = Database['public']['Functions']['get_npc_category_performance']
export type DbGetNpcCategoryPerformanceArgs = Database['public']['Functions']['get_npc_category_performance']['Args']
export type DbGetNpcCategoryPerformanceReturns = Database['public']['Functions']['get_npc_category_performance']['Returns']
export type DbGetOnboardingCategoriesFunction = Database['public']['Functions']['get_onboarding_categories']
export type DbGetOnboardingCategoriesArgs = Database['public']['Functions']['get_onboarding_categories']['Args']
export type DbGetOnboardingCategoriesReturns = Database['public']['Functions']['get_onboarding_categories']['Returns']
export type DbGetOnboardingSkillsFunction = Database['public']['Functions']['get_onboarding_skills']
export type DbGetOnboardingSkillsArgs = Database['public']['Functions']['get_onboarding_skills']['Args']
export type DbGetOnboardingSkillsReturns = Database['public']['Functions']['get_onboarding_skills']['Returns']
export type DbGetOrCreateMediaOrganizationFunction = Database['public']['Functions']['get_or_create_media_organization']
export type DbGetOrCreateMediaOrganizationArgs = Database['public']['Functions']['get_or_create_media_organization']['Args']
export type DbGetOrCreateMediaOrganizationReturns = Database['public']['Functions']['get_or_create_media_organization']['Returns']
export type DbGetOrCreatePodAnalyticsTodayFunction = Database['public']['Functions']['get_or_create_pod_analytics_today']
export type DbGetOrCreatePodAnalyticsTodayArgs = Database['public']['Functions']['get_or_create_pod_analytics_today']['Args']
export type DbGetOrCreatePodAnalyticsTodayReturns = Database['public']['Functions']['get_or_create_pod_analytics_today']['Returns']
export type DbGetOrCreateSourceMetadataFunction = Database['public']['Functions']['get_or_create_source_metadata']
export type DbGetOrCreateSourceMetadataArgs = Database['public']['Functions']['get_or_create_source_metadata']['Args']
export type DbGetOrCreateSourceMetadataReturns = Database['public']['Functions']['get_or_create_source_metadata']['Returns']
export type DbGetOrCreateTagFunction = Database['public']['Functions']['get_or_create_tag']
export type DbGetOrCreateTagArgs = Database['public']['Functions']['get_or_create_tag']['Args']
export type DbGetOrCreateTagReturns = Database['public']['Functions']['get_or_create_tag']['Returns']
export type DbGetPeopleHelpedByDonorFunction = Database['public']['Functions']['get_people_helped_by_donor']
export type DbGetPeopleHelpedByDonorArgs = Database['public']['Functions']['get_people_helped_by_donor']['Args']
export type DbGetPeopleHelpedByDonorReturns = Database['public']['Functions']['get_people_helped_by_donor']['Returns']
export type DbGetPodAnalyticsFunction = Database['public']['Functions']['get_pod_analytics']
export type DbGetPodAnalyticsArgs = Database['public']['Functions']['get_pod_analytics']['Args']
export type DbGetPodAnalyticsReturns = Database['public']['Functions']['get_pod_analytics']['Returns']
export type DbGetQuestionSocialProofStatsFunction = Database['public']['Functions']['get_question_social_proof_stats']
export type DbGetQuestionSocialProofStatsArgs = Database['public']['Functions']['get_question_social_proof_stats']['Args']
export type DbGetQuestionSocialProofStatsReturns = Database['public']['Functions']['get_question_social_proof_stats']['Returns']
export type DbGetQuestionsBatchFunction = Database['public']['Functions']['get_questions_batch']
export type DbGetQuestionsBatchArgs = Database['public']['Functions']['get_questions_batch']['Args']
export type DbGetQuestionsBatchReturns = Database['public']['Functions']['get_questions_batch']['Returns']
export type DbGetRecommendedSkillsForUserFunction = Database['public']['Functions']['get_recommended_skills_for_user']
export type DbGetRecommendedSkillsForUserArgs = Database['public']['Functions']['get_recommended_skills_for_user']['Args']
export type DbGetRecommendedSkillsForUserReturns = Database['public']['Functions']['get_recommended_skills_for_user']['Returns']
export type DbGetRoomMembersFunction = Database['public']['Functions']['get_room_members']
export type DbGetRoomMembersArgs = Database['public']['Functions']['get_room_members']['Args']
export type DbGetRoomMembersReturns = Database['public']['Functions']['get_room_members']['Returns']
export type DbGetScenarioCharactersFunction = Database['public']['Functions']['get_scenario_characters']
export type DbGetScenarioCharactersArgs = Database['public']['Functions']['get_scenario_characters']['Args']
export type DbGetScenarioCharactersReturns = Database['public']['Functions']['get_scenario_characters']['Returns']
export type DbGetScenarioRoomStatusFunction = Database['public']['Functions']['get_scenario_room_status']
export type DbGetScenarioRoomStatusArgs = Database['public']['Functions']['get_scenario_room_status']['Args']
export type DbGetScenarioRoomStatusReturns = Database['public']['Functions']['get_scenario_room_status']['Returns']
export type DbGetShareableLinkInfoFunction = Database['public']['Functions']['get_shareable_link_info']
export type DbGetShareableLinkInfoArgs = Database['public']['Functions']['get_shareable_link_info']['Args']
export type DbGetShareableLinkInfoReturns = Database['public']['Functions']['get_shareable_link_info']['Returns']
export type DbGetSkillsNeedingReviewFunction = Database['public']['Functions']['get_skills_needing_review']
export type DbGetSkillsNeedingReviewArgs = Database['public']['Functions']['get_skills_needing_review']['Args']
export type DbGetSkillsNeedingReviewReturns = Database['public']['Functions']['get_skills_needing_review']['Returns']
export type DbGetSocialProofMessageFunction = Database['public']['Functions']['get_social_proof_message']
export type DbGetSocialProofMessageArgs = Database['public']['Functions']['get_social_proof_message']['Args']
export type DbGetSocialProofMessageReturns = Database['public']['Functions']['get_social_proof_message']['Returns']
export type DbGetTableColumnInfoFunction = Database['public']['Functions']['get_table_column_info']
export type DbGetTableColumnInfoArgs = Database['public']['Functions']['get_table_column_info']['Args']
export type DbGetTableColumnInfoReturns = Database['public']['Functions']['get_table_column_info']['Returns']
export type DbGetTableSchemasFunction = Database['public']['Functions']['get_table_schemas']
export type DbGetTableSchemasArgs = Database['public']['Functions']['get_table_schemas']['Args']
export type DbGetTableSchemasReturns = Database['public']['Functions']['get_table_schemas']['Returns']
export type DbGetTermTranslationFunction = Database['public']['Functions']['get_term_translation']
export type DbGetTermTranslationArgs = Database['public']['Functions']['get_term_translation']['Args']
export type DbGetTermTranslationReturns = Database['public']['Functions']['get_term_translation']['Returns']
export type DbGetTermTranslationLanguagesFunction = Database['public']['Functions']['get_term_translation_languages']
export type DbGetTermTranslationLanguagesArgs = Database['public']['Functions']['get_term_translation_languages']['Args']
export type DbGetTermTranslationLanguagesReturns = Database['public']['Functions']['get_term_translation_languages']['Returns']
export type DbGetTermsByCategoryFunction = Database['public']['Functions']['get_terms_by_category']
export type DbGetTermsByCategoryArgs = Database['public']['Functions']['get_terms_by_category']['Args']
export type DbGetTermsByCategoryReturns = Database['public']['Functions']['get_terms_by_category']['Returns']
export type DbGetTermsBySourceCredibilityFunction = Database['public']['Functions']['get_terms_by_source_credibility']
export type DbGetTermsBySourceCredibilityArgs = Database['public']['Functions']['get_terms_by_source_credibility']['Args']
export type DbGetTermsBySourceCredibilityReturns = Database['public']['Functions']['get_terms_by_source_credibility']['Returns']
export type DbGetTermsWithCategoriesFunction = Database['public']['Functions']['get_terms_with_categories']
export type DbGetTermsWithCategoriesArgs = Database['public']['Functions']['get_terms_with_categories']['Args']
export type DbGetTermsWithCategoriesReturns = Database['public']['Functions']['get_terms_with_categories']['Returns']
export type DbGetTopicRelatedEventsFunction = Database['public']['Functions']['get_topic_related_events']
export type DbGetTopicRelatedEventsArgs = Database['public']['Functions']['get_topic_related_events']['Args']
export type DbGetTopicRelatedEventsReturns = Database['public']['Functions']['get_topic_related_events']['Returns']
export type DbGetTopicsWithStatsBatchFunction = Database['public']['Functions']['get_topics_with_stats_batch']
export type DbGetTopicsWithStatsBatchArgs = Database['public']['Functions']['get_topics_with_stats_batch']['Args']
export type DbGetTopicsWithStatsBatchReturns = Database['public']['Functions']['get_topics_with_stats_batch']['Returns']
export type DbGetTranslatableContentSummaryFunction = Database['public']['Functions']['get_translatable_content_summary']
export type DbGetTranslatableContentSummaryArgs = Database['public']['Functions']['get_translatable_content_summary']['Args']
export type DbGetTranslatableContentSummaryReturns = Database['public']['Functions']['get_translatable_content_summary']['Returns']
export type DbGetTranslationFunction = Database['public']['Functions']['get_translation']
export type DbGetTranslationArgs = Database['public']['Functions']['get_translation']['Args']
export type DbGetTranslationReturns = Database['public']['Functions']['get_translation']['Returns']
export type DbGetTrendingSearchesFunction = Database['public']['Functions']['get_trending_searches']
export type DbGetTrendingSearchesArgs = Database['public']['Functions']['get_trending_searches']['Args']
export type DbGetTrendingSearchesReturns = Database['public']['Functions']['get_trending_searches']['Returns']
export type DbGetUserBoostSummaryFunction = Database['public']['Functions']['get_user_boost_summary']
export type DbGetUserBoostSummaryArgs = Database['public']['Functions']['get_user_boost_summary']['Args']
export type DbGetUserBoostSummaryReturns = Database['public']['Functions']['get_user_boost_summary']['Returns']
export type DbGetUserCreditsBalanceFunction = Database['public']['Functions']['get_user_credits_balance']
export type DbGetUserCreditsBalanceArgs = Database['public']['Functions']['get_user_credits_balance']['Args']
export type DbGetUserCreditsBalanceReturns = Database['public']['Functions']['get_user_credits_balance']['Returns']
export type DbGetUserEmailPreferencesFunction = Database['public']['Functions']['get_user_email_preferences']
export type DbGetUserEmailPreferencesArgs = Database['public']['Functions']['get_user_email_preferences']['Args']
export type DbGetUserEmailPreferencesReturns = Database['public']['Functions']['get_user_email_preferences']['Returns']
export type DbGetUserFeatureLimitsFunction = Database['public']['Functions']['get_user_feature_limits']
export type DbGetUserFeatureLimitsArgs = Database['public']['Functions']['get_user_feature_limits']['Args']
export type DbGetUserFeatureLimitsReturns = Database['public']['Functions']['get_user_feature_limits']['Returns']
export type DbGetUserGiftCreditsFunction = Database['public']['Functions']['get_user_gift_credits']
export type DbGetUserGiftCreditsArgs = Database['public']['Functions']['get_user_gift_credits']['Args']
export type DbGetUserGiftCreditsReturns = Database['public']['Functions']['get_user_gift_credits']['Returns']
export type DbGetUserOnboardingProgressFunction = Database['public']['Functions']['get_user_onboarding_progress']
export type DbGetUserOnboardingProgressArgs = Database['public']['Functions']['get_user_onboarding_progress']['Args']
export type DbGetUserOnboardingProgressReturns = Database['public']['Functions']['get_user_onboarding_progress']['Returns']
export type DbGetUserPodMembershipsFunction = Database['public']['Functions']['get_user_pod_memberships']
export type DbGetUserPodMembershipsArgs = Database['public']['Functions']['get_user_pod_memberships']['Args']
export type DbGetUserPodMembershipsReturns = Database['public']['Functions']['get_user_pod_memberships']['Returns']
export type DbGetUserProgressSessionsFunction = Database['public']['Functions']['get_user_progress_sessions']
export type DbGetUserProgressSessionsArgs = Database['public']['Functions']['get_user_progress_sessions']['Args']
export type DbGetUserProgressSessionsReturns = Database['public']['Functions']['get_user_progress_sessions']['Returns']
export type DbGetUserProgressSummaryFunction = Database['public']['Functions']['get_user_progress_summary']
export type DbGetUserProgressSummaryArgs = Database['public']['Functions']['get_user_progress_summary']['Args']
export type DbGetUserProgressSummaryReturns = Database['public']['Functions']['get_user_progress_summary']['Returns']
export type DbGetUserRoomsFunction = Database['public']['Functions']['get_user_rooms']
export type DbGetUserRoomsArgs = Database['public']['Functions']['get_user_rooms']['Args']
export type DbGetUserRoomsReturns = Database['public']['Functions']['get_user_rooms']['Returns']
export type DbGetUserScenarioProgressFunction = Database['public']['Functions']['get_user_scenario_progress']
export type DbGetUserScenarioProgressArgs = Database['public']['Functions']['get_user_scenario_progress']['Args']
export type DbGetUserScenarioProgressReturns = Database['public']['Functions']['get_user_scenario_progress']['Returns']
export type DbGetUserShareableLinksFunction = Database['public']['Functions']['get_user_shareable_links']
export type DbGetUserShareableLinksArgs = Database['public']['Functions']['get_user_shareable_links']['Args']
export type DbGetUserShareableLinksReturns = Database['public']['Functions']['get_user_shareable_links']['Returns']
export type DbGetWeeklyTopThemesFunction = Database['public']['Functions']['get_weekly_top_themes']
export type DbGetWeeklyTopThemesArgs = Database['public']['Functions']['get_weekly_top_themes']['Args']
export type DbGetWeeklyTopThemesReturns = Database['public']['Functions']['get_weekly_top_themes']['Returns']
export type DbGtrgmCompressFunction = Database['public']['Functions']['gtrgm_compress']
export type DbGtrgmCompressArgs = Database['public']['Functions']['gtrgm_compress']['Args']
export type DbGtrgmCompressReturns = Database['public']['Functions']['gtrgm_compress']['Returns']
export type DbGtrgmDecompressFunction = Database['public']['Functions']['gtrgm_decompress']
export type DbGtrgmDecompressArgs = Database['public']['Functions']['gtrgm_decompress']['Args']
export type DbGtrgmDecompressReturns = Database['public']['Functions']['gtrgm_decompress']['Returns']
export type DbGtrgmInFunction = Database['public']['Functions']['gtrgm_in']
export type DbGtrgmInArgs = Database['public']['Functions']['gtrgm_in']['Args']
export type DbGtrgmInReturns = Database['public']['Functions']['gtrgm_in']['Returns']
export type DbGtrgmOptionsFunction = Database['public']['Functions']['gtrgm_options']
export type DbGtrgmOptionsArgs = Database['public']['Functions']['gtrgm_options']['Args']
export type DbGtrgmOptionsReturns = Database['public']['Functions']['gtrgm_options']['Returns']
export type DbGtrgmOutFunction = Database['public']['Functions']['gtrgm_out']
export type DbGtrgmOutArgs = Database['public']['Functions']['gtrgm_out']['Args']
export type DbGtrgmOutReturns = Database['public']['Functions']['gtrgm_out']['Returns']
export type DbIdentifyContentGapsFunction = Database['public']['Functions']['identify_content_gaps']
export type DbIdentifyContentGapsArgs = Database['public']['Functions']['identify_content_gaps']['Args']
export type DbIdentifyContentGapsReturns = Database['public']['Functions']['identify_content_gaps']['Returns']
export type DbIncrementTrendingQueryFunction = Database['public']['Functions']['increment_trending_query']
export type DbIncrementTrendingQueryArgs = Database['public']['Functions']['increment_trending_query']['Args']
export type DbIncrementTrendingQueryReturns = Database['public']['Functions']['increment_trending_query']['Returns']
export type DbIsAdminFunction = Database['public']['Functions']['is_admin']
export type DbIsAdminArgs = Database['public']['Functions']['is_admin']['Args']
export type DbIsAdminReturns = Database['public']['Functions']['is_admin']['Returns']
export type DbIsAdminUserFunction = Database['public']['Functions']['is_admin_user']
export type DbIsAdminUserArgs = Database['public']['Functions']['is_admin_user']['Args']
export type DbIsAdminUserReturns = Database['public']['Functions']['is_admin_user']['Returns']
export type DbIsContentAppropriateForUserFunction = Database['public']['Functions']['is_content_appropriate_for_user']
export type DbIsContentAppropriateForUserArgs = Database['public']['Functions']['is_content_appropriate_for_user']['Args']
export type DbIsContentAppropriateForUserReturns = Database['public']['Functions']['is_content_appropriate_for_user']['Returns']
export type DbIsEducationalEmailFunction = Database['public']['Functions']['is_educational_email']
export type DbIsEducationalEmailArgs = Database['public']['Functions']['is_educational_email']['Args']
export type DbIsEducationalEmailReturns = Database['public']['Functions']['is_educational_email']['Returns']
export type DbIsSuperAdminUserFunction = Database['public']['Functions']['is_super_admin_user']
export type DbIsSuperAdminUserArgs = Database['public']['Functions']['is_super_admin_user']['Args']
export type DbIsSuperAdminUserReturns = Database['public']['Functions']['is_super_admin_user']['Returns']
export type DbJoinMultiplayerRoomFunction = Database['public']['Functions']['join_multiplayer_room']
export type DbJoinMultiplayerRoomArgs = Database['public']['Functions']['join_multiplayer_room']['Args']
export type DbJoinMultiplayerRoomReturns = Database['public']['Functions']['join_multiplayer_room']['Returns']
export type DbJoinPodViaInviteFunction = Database['public']['Functions']['join_pod_via_invite']
export type DbJoinPodViaInviteArgs = Database['public']['Functions']['join_pod_via_invite']['Args']
export type DbJoinPodViaInviteReturns = Database['public']['Functions']['join_pod_via_invite']['Returns']
export type DbJoinScenarioRoomFunction = Database['public']['Functions']['join_scenario_room']
export type DbJoinScenarioRoomArgs = Database['public']['Functions']['join_scenario_room']['Args']
export type DbJoinScenarioRoomReturns = Database['public']['Functions']['join_scenario_room']['Returns']
export type DbLeaveMultiplayerRoomFunction = Database['public']['Functions']['leave_multiplayer_room']
export type DbLeaveMultiplayerRoomArgs = Database['public']['Functions']['leave_multiplayer_room']['Args']
export type DbLeaveMultiplayerRoomReturns = Database['public']['Functions']['leave_multiplayer_room']['Returns']
export type DbLinkQuestionToSourceFunction = Database['public']['Functions']['link_question_to_source']
export type DbLinkQuestionToSourceArgs = Database['public']['Functions']['link_question_to_source']['Args']
export type DbLinkQuestionToSourceReturns = Database['public']['Functions']['link_question_to_source']['Returns']
export type DbLogPodActivityFunction = Database['public']['Functions']['log_pod_activity']
export type DbLogPodActivityArgs = Database['public']['Functions']['log_pod_activity']['Args']
export type DbLogPodActivityReturns = Database['public']['Functions']['log_pod_activity']['Returns']
export type DbLogResearchSessionResultFunction = Database['public']['Functions']['log_research_session_result']
export type DbLogResearchSessionResultArgs = Database['public']['Functions']['log_research_session_result']['Args']
export type DbLogResearchSessionResultReturns = Database['public']['Functions']['log_research_session_result']['Returns']
export type DbMigrateProgressSessionToCompletionFunction = Database['public']['Functions']['migrate_progress_session_to_completion']
export type DbMigrateProgressSessionToCompletionArgs = Database['public']['Functions']['migrate_progress_session_to_completion']['Args']
export type DbMigrateProgressSessionToCompletionReturns = Database['public']['Functions']['migrate_progress_session_to_completion']['Returns']
export type DbPopulateHistoricalAnalyticsFunction = Database['public']['Functions']['populate_historical_analytics']
export type DbPopulateHistoricalAnalyticsArgs = Database['public']['Functions']['populate_historical_analytics']['Args']
export type DbPopulateHistoricalAnalyticsReturns = Database['public']['Functions']['populate_historical_analytics']['Returns']
export type DbProcessDonationGiftCreditsFunction = Database['public']['Functions']['process_donation_gift_credits']
export type DbProcessDonationGiftCreditsArgs = Database['public']['Functions']['process_donation_gift_credits']['Args']
export type DbProcessDonationGiftCreditsReturns = Database['public']['Functions']['process_donation_gift_credits']['Returns']
export type DbRecordGameEventFunction = Database['public']['Functions']['record_game_event']
export type DbRecordGameEventArgs = Database['public']['Functions']['record_game_event']['Args']
export type DbRecordGameEventReturns = Database['public']['Functions']['record_game_event']['Returns']
export type DbRecordRoomEventFunction = Database['public']['Functions']['record_room_event']
export type DbRecordRoomEventArgs = Database['public']['Functions']['record_room_event']['Args']
export type DbRecordRoomEventReturns = Database['public']['Functions']['record_room_event']['Returns']
export type DbRedeemGiftCodeFunction = Database['public']['Functions']['redeem_gift_code']
export type DbRedeemGiftCodeArgs = Database['public']['Functions']['redeem_gift_code']['Args']
export type DbRedeemGiftCodeReturns = Database['public']['Functions']['redeem_gift_code']['Returns']
export type DbRepairRoomsWithoutHostsFunction = Database['public']['Functions']['repair_rooms_without_hosts']
export type DbRepairRoomsWithoutHostsArgs = Database['public']['Functions']['repair_rooms_without_hosts']['Args']
export type DbRepairRoomsWithoutHostsReturns = Database['public']['Functions']['repair_rooms_without_hosts']['Returns']
export type DbResetIsBreakingStatusFunction = Database['public']['Functions']['reset_is_breaking_status']
export type DbResetIsBreakingStatusArgs = Database['public']['Functions']['reset_is_breaking_status']['Args']
export type DbResetIsBreakingStatusReturns = Database['public']['Functions']['reset_is_breaking_status']['Returns']
export type DbSearchBookmarksFunction = Database['public']['Functions']['search_bookmarks']
export type DbSearchBookmarksArgs = Database['public']['Functions']['search_bookmarks']['Args']
export type DbSearchBookmarksReturns = Database['public']['Functions']['search_bookmarks']['Returns']
export type DbSearchHistoricalEventsFunction = Database['public']['Functions']['search_historical_events']
export type DbSearchHistoricalEventsArgs = Database['public']['Functions']['search_historical_events']['Args']
export type DbSearchHistoricalEventsReturns = Database['public']['Functions']['search_historical_events']['Returns']
export type DbSendNpcMessageFunction = Database['public']['Functions']['send_npc_message']
export type DbSendNpcMessageArgs = Database['public']['Functions']['send_npc_message']['Args']
export type DbSendNpcMessageReturns = Database['public']['Functions']['send_npc_message']['Returns']
export type DbSetLimitFunction = Database['public']['Functions']['set_limit']
export type DbSetLimitArgs = Database['public']['Functions']['set_limit']['Args']
export type DbSetLimitReturns = Database['public']['Functions']['set_limit']['Returns']
export type DbSetTranslationFunction = Database['public']['Functions']['set_translation']
export type DbSetTranslationArgs = Database['public']['Functions']['set_translation']['Args']
export type DbSetTranslationReturns = Database['public']['Functions']['set_translation']['Returns']
export type DbShowLimitFunction = Database['public']['Functions']['show_limit']
export type DbShowLimitArgs = Database['public']['Functions']['show_limit']['Args']
export type DbShowLimitReturns = Database['public']['Functions']['show_limit']['Returns']
export type DbShowTrgmFunction = Database['public']['Functions']['show_trgm']
export type DbShowTrgmArgs = Database['public']['Functions']['show_trgm']['Args']
export type DbShowTrgmReturns = Database['public']['Functions']['show_trgm']['Returns']
export type DbStartMultiplayerGameFunction = Database['public']['Functions']['start_multiplayer_game']
export type DbStartMultiplayerGameArgs = Database['public']['Functions']['start_multiplayer_game']['Args']
export type DbStartMultiplayerGameReturns = Database['public']['Functions']['start_multiplayer_game']['Returns']
export type DbTestMultiplayerOperationsFunction = Database['public']['Functions']['test_multiplayer_operations']
export type DbTestMultiplayerOperationsArgs = Database['public']['Functions']['test_multiplayer_operations']['Args']
export type DbTestMultiplayerOperationsReturns = Database['public']['Functions']['test_multiplayer_operations']['Returns']
export type DbTrackFeatureUsageFunction = Database['public']['Functions']['track_feature_usage']
export type DbTrackFeatureUsageArgs = Database['public']['Functions']['track_feature_usage']['Args']
export type DbTrackFeatureUsageReturns = Database['public']['Functions']['track_feature_usage']['Returns']
export type DbUpdateBookmarkAccessFunction = Database['public']['Functions']['update_bookmark_access']
export type DbUpdateBookmarkAccessArgs = Database['public']['Functions']['update_bookmark_access']['Args']
export type DbUpdateBookmarkAccessReturns = Database['public']['Functions']['update_bookmark_access']['Returns']
export type DbUpdateConversationContextFunction = Database['public']['Functions']['update_conversation_context']
export type DbUpdateConversationContextArgs = Database['public']['Functions']['update_conversation_context']['Args']
export type DbUpdateConversationContextReturns = Database['public']['Functions']['update_conversation_context']['Returns']
export type DbUpdateJobAfterExecutionFunction = Database['public']['Functions']['update_job_after_execution']
export type DbUpdateJobAfterExecutionArgs = Database['public']['Functions']['update_job_after_execution']['Args']
export type DbUpdateJobAfterExecutionReturns = Database['public']['Functions']['update_job_after_execution']['Returns']
export type DbUpdateMemberAnalyticsFunction = Database['public']['Functions']['update_member_analytics']
export type DbUpdateMemberAnalyticsArgs = Database['public']['Functions']['update_member_analytics']['Args']
export type DbUpdateMemberAnalyticsReturns = Database['public']['Functions']['update_member_analytics']['Returns']
export type DbUpdateNpcLearningFunction = Database['public']['Functions']['update_npc_learning']
export type DbUpdateNpcLearningArgs = Database['public']['Functions']['update_npc_learning']['Args']
export type DbUpdateNpcLearningReturns = Database['public']['Functions']['update_npc_learning']['Returns']
export type DbUpdateOrganizationBiasFromArticlesFunction = Database['public']['Functions']['update_organization_bias_from_articles']
export type DbUpdateOrganizationBiasFromArticlesArgs = Database['public']['Functions']['update_organization_bias_from_articles']['Args']
export type DbUpdateOrganizationBiasFromArticlesReturns = Database['public']['Functions']['update_organization_bias_from_articles']['Returns']
export type DbUpdatePlayerCharacterFunction = Database['public']['Functions']['update_player_character']
export type DbUpdatePlayerCharacterArgs = Database['public']['Functions']['update_player_character']['Args']
export type DbUpdatePlayerCharacterReturns = Database['public']['Functions']['update_player_character']['Returns']
export type DbUpdatePlayerReadyStatusFunction = Database['public']['Functions']['update_player_ready_status']
export type DbUpdatePlayerReadyStatusArgs = Database['public']['Functions']['update_player_ready_status']['Args']
export type DbUpdatePlayerReadyStatusReturns = Database['public']['Functions']['update_player_ready_status']['Returns']
export type DbUpdatePodAnalyticsFunction = Database['public']['Functions']['update_pod_analytics']
export type DbUpdatePodAnalyticsArgs = Database['public']['Functions']['update_pod_analytics']['Args']
export type DbUpdatePodAnalyticsReturns = Database['public']['Functions']['update_pod_analytics']['Returns']
export type DbUpdateUserSkillProgressFunction = Database['public']['Functions']['update_user_skill_progress']
export type DbUpdateUserSkillProgressArgs = Database['public']['Functions']['update_user_skill_progress']['Args']
export type DbUpdateUserSkillProgressReturns = Database['public']['Functions']['update_user_skill_progress']['Returns']
export type DbUpdateWeeklyContentMetricsFunction = Database['public']['Functions']['update_weekly_content_metrics']
export type DbUpdateWeeklyContentMetricsArgs = Database['public']['Functions']['update_weekly_content_metrics']['Args']
export type DbUpdateWeeklyContentMetricsReturns = Database['public']['Functions']['update_weekly_content_metrics']['Returns']
export type DbUpsertCongressionalMemberFunction = Database['public']['Functions']['upsert_congressional_member']
export type DbUpsertCongressionalMemberArgs = Database['public']['Functions']['upsert_congressional_member']['Args']
export type DbUpsertCongressionalMemberReturns = Database['public']['Functions']['upsert_congressional_member']['Returns']
export type DbUpsertUserEmailPreferencesFunction = Database['public']['Functions']['upsert_user_email_preferences']
export type DbUpsertUserEmailPreferencesArgs = Database['public']['Functions']['upsert_user_email_preferences']['Args']
export type DbUpsertUserEmailPreferencesReturns = Database['public']['Functions']['upsert_user_email_preferences']['Returns']
export type DbUserIsInRoomFunction = Database['public']['Functions']['user_is_in_room']
export type DbUserIsInRoomArgs = Database['public']['Functions']['user_is_in_room']['Args']
export type DbUserIsInRoomReturns = Database['public']['Functions']['user_is_in_room']['Returns']
export type DbValidateFunctionTableTypesFunction = Database['public']['Functions']['validate_function_table_types']
export type DbValidateFunctionTableTypesArgs = Database['public']['Functions']['validate_function_table_types']['Args']
export type DbValidateFunctionTableTypesReturns = Database['public']['Functions']['validate_function_table_types']['Returns']
export type DbValidateMigrationSafetyFunction = Database['public']['Functions']['validate_migration_safety']
export type DbValidateMigrationSafetyArgs = Database['public']['Functions']['validate_migration_safety']['Args']
export type DbValidateMigrationSafetyReturns = Database['public']['Functions']['validate_migration_safety']['Returns']
export type DbValidateMultiplayerHostAssignmentsFunction = Database['public']['Functions']['validate_multiplayer_host_assignments']
export type DbValidateMultiplayerHostAssignmentsArgs = Database['public']['Functions']['validate_multiplayer_host_assignments']['Args']
export type DbValidateMultiplayerHostAssignmentsReturns = Database['public']['Functions']['validate_multiplayer_host_assignments']['Returns']
export type DbValidateMultiplayerSchemaFunction = Database['public']['Functions']['validate_multiplayer_schema']
export type DbValidateMultiplayerSchemaArgs = Database['public']['Functions']['validate_multiplayer_schema']['Args']
export type DbValidateMultiplayerSchemaReturns = Database['public']['Functions']['validate_multiplayer_schema']['Returns']
export type DbValidateMultiplayerSchemaAlignmentFunction = Database['public']['Functions']['validate_multiplayer_schema_alignment']
export type DbValidateMultiplayerSchemaAlignmentArgs = Database['public']['Functions']['validate_multiplayer_schema_alignment']['Args']
export type DbValidateMultiplayerSchemaAlignmentReturns = Database['public']['Functions']['validate_multiplayer_schema_alignment']['Returns']
export type DbValidateTranslationStructureFunction = Database['public']['Functions']['validate_translation_structure']
export type DbValidateTranslationStructureArgs = Database['public']['Functions']['validate_translation_structure']['Args']
export type DbValidateTranslationStructureReturns = Database['public']['Functions']['validate_translation_structure']['Returns']

// =============================================================================
// AI AGENT SCHEMA TYPES
// =============================================================================

// ai_agent Tables
export type DbAiAgentAiActionExecutions = Database['ai_agent']['Tables']['ai_action_executions']['Row']
export type DbAiAgentAiActionPrompts = Database['ai_agent']['Tables']['ai_action_prompts']['Row']
export type DbAiAgentAiActions = Database['ai_agent']['Tables']['ai_actions']['Row']
export type DbAiAgentAiAgentMemory = Database['ai_agent']['Tables']['ai_agent_memory']['Row']
export type DbAiAgentAiCommandActions = Database['ai_agent']['Tables']['ai_command_actions']['Row']
export type DbAiAgentAiCommandAnalytics = Database['ai_agent']['Tables']['ai_command_analytics']['Row']
export type DbAiAgentAiCommandExecutions = Database['ai_agent']['Tables']['ai_command_executions']['Row']
export type DbAiAgentAiCommandPermissions = Database['ai_agent']['Tables']['ai_command_permissions']['Row']
export type DbAiAgentAiCommandStreams = Database['ai_agent']['Tables']['ai_command_streams']['Row']
export type DbAiAgentAiCommands = Database['ai_agent']['Tables']['ai_commands']['Row']
export type DbAiAgentAiContentSources = Database['ai_agent']['Tables']['ai_content_sources']['Row']
export type DbAiAgentAiContentSyncLogs = Database['ai_agent']['Tables']['ai_content_sync_logs']['Row']
export type DbAiAgentAiIntegrationLogs = Database['ai_agent']['Tables']['ai_integration_logs']['Row']
export type DbAiAgentAiIntegrations = Database['ai_agent']['Tables']['ai_integrations']['Row']
export type DbAiAgentAiLearnedPatterns = Database['ai_agent']['Tables']['ai_learned_patterns']['Row']
export type DbAiAgentAiModels = Database['ai_agent']['Tables']['ai_models']['Row']
export type DbAiAgentAiPerformanceMetrics = Database['ai_agent']['Tables']['ai_performance_metrics']['Row']
export type DbAiAgentAiPrompts = Database['ai_agent']['Tables']['ai_prompts']['Row']
export type DbAiAgentAiProviders = Database['ai_agent']['Tables']['ai_providers']['Row']
export type DbAiAgentAiQualityGates = Database['ai_agent']['Tables']['ai_quality_gates']['Row']
export type DbAiAgentAiQualityValidations = Database['ai_agent']['Tables']['ai_quality_validations']['Row']
export type DbAiAgentAiSecurityAuditLog = Database['ai_agent']['Tables']['ai_security_audit_log']['Row']
export type DbAiAgentAiStreamMessages = Database['ai_agent']['Tables']['ai_stream_messages']['Row']
export type DbAiAgentAiSystemAlerts = Database['ai_agent']['Tables']['ai_system_alerts']['Row']
export type DbAiAgentAiUserCommandHistory = Database['ai_agent']['Tables']['ai_user_command_history']['Row']
export type DbAiAgentAiUserPreferences = Database['ai_agent']['Tables']['ai_user_preferences']['Row']
export type DbAiAgentAiWorkflowInstances = Database['ai_agent']['Tables']['ai_workflow_instances']['Row']
export type DbAiAgentAiWorkflowTemplates = Database['ai_agent']['Tables']['ai_workflow_templates']['Row']
export type DbAiAgentContentAnalysisCache = Database['ai_agent']['Tables']['content_analysis_cache']['Row']
export type DbAiAgentConversationAnalysis = Database['ai_agent']['Tables']['conversation_analysis']['Row']
export type DbAiAgentConversationAnalytics = Database['ai_agent']['Tables']['conversation_analytics']['Row']
export type DbAiAgentConversationContext = Database['ai_agent']['Tables']['conversation_context']['Row']
export type DbAiAgentConversationFlowInstances = Database['ai_agent']['Tables']['conversation_flow_instances']['Row']
export type DbAiAgentConversationFlows = Database['ai_agent']['Tables']['conversation_flows']['Row']
export type DbAiAgentConversations = Database['ai_agent']['Tables']['conversations']['Row']
export type DbAiAgentDatabaseContext = Database['ai_agent']['Tables']['database_context']['Row']
export type DbAiAgentFallbackResponses = Database['ai_agent']['Tables']['fallback_responses']['Row']
export type DbAiAgentGeneratedContent = Database['ai_agent']['Tables']['generated_content']['Row']
export type DbAiAgentIntentPatterns = Database['ai_agent']['Tables']['intent_patterns']['Row']
export type DbAiAgentKnowledgeGraph = Database['ai_agent']['Tables']['knowledge_graph']['Row']
export type DbAiAgentLearnedPatterns = Database['ai_agent']['Tables']['learned_patterns']['Row']
export type DbAiAgentMemoryClusters = Database['ai_agent']['Tables']['memory_clusters']['Row']
export type DbAiAgentMemoryConsolidation = Database['ai_agent']['Tables']['memory_consolidation']['Row']
export type DbAiAgentMessages = Database['ai_agent']['Tables']['messages']['Row']
export type DbAiAgentPatterns = Database['ai_agent']['Tables']['patterns']['Row']
export type DbAiAgentPerformanceMetrics = Database['ai_agent']['Tables']['performance_metrics']['Row']
export type DbAiAgentResponseTemplates = Database['ai_agent']['Tables']['response_templates']['Row']
export type DbAiAgentSystemHealth = Database['ai_agent']['Tables']['system_health']['Row']
export type DbAiAgentSystemMetrics = Database['ai_agent']['Tables']['system_metrics']['Row']
export type DbAiAgentToolUsagePatterns = Database['ai_agent']['Tables']['tool_usage_patterns']['Row']
export type DbAiAgentUserPreferences = Database['ai_agent']['Tables']['user_preferences']['Row']

// ai_agent Insert Types
export type DbAiAgentAiActionExecutionsInsert = Database['ai_agent']['Tables']['ai_action_executions']['Insert']
export type DbAiAgentAiActionPromptsInsert = Database['ai_agent']['Tables']['ai_action_prompts']['Insert']
export type DbAiAgentAiActionsInsert = Database['ai_agent']['Tables']['ai_actions']['Insert']
export type DbAiAgentAiAgentMemoryInsert = Database['ai_agent']['Tables']['ai_agent_memory']['Insert']
export type DbAiAgentAiCommandActionsInsert = Database['ai_agent']['Tables']['ai_command_actions']['Insert']
export type DbAiAgentAiCommandAnalyticsInsert = Database['ai_agent']['Tables']['ai_command_analytics']['Insert']
export type DbAiAgentAiCommandExecutionsInsert = Database['ai_agent']['Tables']['ai_command_executions']['Insert']
export type DbAiAgentAiCommandPermissionsInsert = Database['ai_agent']['Tables']['ai_command_permissions']['Insert']
export type DbAiAgentAiCommandStreamsInsert = Database['ai_agent']['Tables']['ai_command_streams']['Insert']
export type DbAiAgentAiCommandsInsert = Database['ai_agent']['Tables']['ai_commands']['Insert']
export type DbAiAgentAiContentSourcesInsert = Database['ai_agent']['Tables']['ai_content_sources']['Insert']
export type DbAiAgentAiContentSyncLogsInsert = Database['ai_agent']['Tables']['ai_content_sync_logs']['Insert']
export type DbAiAgentAiIntegrationLogsInsert = Database['ai_agent']['Tables']['ai_integration_logs']['Insert']
export type DbAiAgentAiIntegrationsInsert = Database['ai_agent']['Tables']['ai_integrations']['Insert']
export type DbAiAgentAiLearnedPatternsInsert = Database['ai_agent']['Tables']['ai_learned_patterns']['Insert']
export type DbAiAgentAiModelsInsert = Database['ai_agent']['Tables']['ai_models']['Insert']
export type DbAiAgentAiPerformanceMetricsInsert = Database['ai_agent']['Tables']['ai_performance_metrics']['Insert']
export type DbAiAgentAiPromptsInsert = Database['ai_agent']['Tables']['ai_prompts']['Insert']
export type DbAiAgentAiProvidersInsert = Database['ai_agent']['Tables']['ai_providers']['Insert']
export type DbAiAgentAiQualityGatesInsert = Database['ai_agent']['Tables']['ai_quality_gates']['Insert']
export type DbAiAgentAiQualityValidationsInsert = Database['ai_agent']['Tables']['ai_quality_validations']['Insert']
export type DbAiAgentAiSecurityAuditLogInsert = Database['ai_agent']['Tables']['ai_security_audit_log']['Insert']
export type DbAiAgentAiStreamMessagesInsert = Database['ai_agent']['Tables']['ai_stream_messages']['Insert']
export type DbAiAgentAiSystemAlertsInsert = Database['ai_agent']['Tables']['ai_system_alerts']['Insert']
export type DbAiAgentAiUserCommandHistoryInsert = Database['ai_agent']['Tables']['ai_user_command_history']['Insert']
export type DbAiAgentAiUserPreferencesInsert = Database['ai_agent']['Tables']['ai_user_preferences']['Insert']
export type DbAiAgentAiWorkflowInstancesInsert = Database['ai_agent']['Tables']['ai_workflow_instances']['Insert']
export type DbAiAgentAiWorkflowTemplatesInsert = Database['ai_agent']['Tables']['ai_workflow_templates']['Insert']
export type DbAiAgentContentAnalysisCacheInsert = Database['ai_agent']['Tables']['content_analysis_cache']['Insert']
export type DbAiAgentConversationAnalysisInsert = Database['ai_agent']['Tables']['conversation_analysis']['Insert']
export type DbAiAgentConversationAnalyticsInsert = Database['ai_agent']['Tables']['conversation_analytics']['Insert']
export type DbAiAgentConversationContextInsert = Database['ai_agent']['Tables']['conversation_context']['Insert']
export type DbAiAgentConversationFlowInstancesInsert = Database['ai_agent']['Tables']['conversation_flow_instances']['Insert']
export type DbAiAgentConversationFlowsInsert = Database['ai_agent']['Tables']['conversation_flows']['Insert']
export type DbAiAgentConversationsInsert = Database['ai_agent']['Tables']['conversations']['Insert']
export type DbAiAgentDatabaseContextInsert = Database['ai_agent']['Tables']['database_context']['Insert']
export type DbAiAgentFallbackResponsesInsert = Database['ai_agent']['Tables']['fallback_responses']['Insert']
export type DbAiAgentGeneratedContentInsert = Database['ai_agent']['Tables']['generated_content']['Insert']
export type DbAiAgentIntentPatternsInsert = Database['ai_agent']['Tables']['intent_patterns']['Insert']
export type DbAiAgentKnowledgeGraphInsert = Database['ai_agent']['Tables']['knowledge_graph']['Insert']
export type DbAiAgentLearnedPatternsInsert = Database['ai_agent']['Tables']['learned_patterns']['Insert']
export type DbAiAgentMemoryClustersInsert = Database['ai_agent']['Tables']['memory_clusters']['Insert']
export type DbAiAgentMemoryConsolidationInsert = Database['ai_agent']['Tables']['memory_consolidation']['Insert']
export type DbAiAgentMessagesInsert = Database['ai_agent']['Tables']['messages']['Insert']
export type DbAiAgentPatternsInsert = Database['ai_agent']['Tables']['patterns']['Insert']
export type DbAiAgentPerformanceMetricsInsert = Database['ai_agent']['Tables']['performance_metrics']['Insert']
export type DbAiAgentResponseTemplatesInsert = Database['ai_agent']['Tables']['response_templates']['Insert']
export type DbAiAgentSystemHealthInsert = Database['ai_agent']['Tables']['system_health']['Insert']
export type DbAiAgentSystemMetricsInsert = Database['ai_agent']['Tables']['system_metrics']['Insert']
export type DbAiAgentToolUsagePatternsInsert = Database['ai_agent']['Tables']['tool_usage_patterns']['Insert']
export type DbAiAgentUserPreferencesInsert = Database['ai_agent']['Tables']['user_preferences']['Insert']

// ai_agent Update Types
export type DbAiAgentAiActionExecutionsUpdate = Database['ai_agent']['Tables']['ai_action_executions']['Update']
export type DbAiAgentAiActionPromptsUpdate = Database['ai_agent']['Tables']['ai_action_prompts']['Update']
export type DbAiAgentAiActionsUpdate = Database['ai_agent']['Tables']['ai_actions']['Update']
export type DbAiAgentAiAgentMemoryUpdate = Database['ai_agent']['Tables']['ai_agent_memory']['Update']
export type DbAiAgentAiCommandActionsUpdate = Database['ai_agent']['Tables']['ai_command_actions']['Update']
export type DbAiAgentAiCommandAnalyticsUpdate = Database['ai_agent']['Tables']['ai_command_analytics']['Update']
export type DbAiAgentAiCommandExecutionsUpdate = Database['ai_agent']['Tables']['ai_command_executions']['Update']
export type DbAiAgentAiCommandPermissionsUpdate = Database['ai_agent']['Tables']['ai_command_permissions']['Update']
export type DbAiAgentAiCommandStreamsUpdate = Database['ai_agent']['Tables']['ai_command_streams']['Update']
export type DbAiAgentAiCommandsUpdate = Database['ai_agent']['Tables']['ai_commands']['Update']
export type DbAiAgentAiContentSourcesUpdate = Database['ai_agent']['Tables']['ai_content_sources']['Update']
export type DbAiAgentAiContentSyncLogsUpdate = Database['ai_agent']['Tables']['ai_content_sync_logs']['Update']
export type DbAiAgentAiIntegrationLogsUpdate = Database['ai_agent']['Tables']['ai_integration_logs']['Update']
export type DbAiAgentAiIntegrationsUpdate = Database['ai_agent']['Tables']['ai_integrations']['Update']
export type DbAiAgentAiLearnedPatternsUpdate = Database['ai_agent']['Tables']['ai_learned_patterns']['Update']
export type DbAiAgentAiModelsUpdate = Database['ai_agent']['Tables']['ai_models']['Update']
export type DbAiAgentAiPerformanceMetricsUpdate = Database['ai_agent']['Tables']['ai_performance_metrics']['Update']
export type DbAiAgentAiPromptsUpdate = Database['ai_agent']['Tables']['ai_prompts']['Update']
export type DbAiAgentAiProvidersUpdate = Database['ai_agent']['Tables']['ai_providers']['Update']
export type DbAiAgentAiQualityGatesUpdate = Database['ai_agent']['Tables']['ai_quality_gates']['Update']
export type DbAiAgentAiQualityValidationsUpdate = Database['ai_agent']['Tables']['ai_quality_validations']['Update']
export type DbAiAgentAiSecurityAuditLogUpdate = Database['ai_agent']['Tables']['ai_security_audit_log']['Update']
export type DbAiAgentAiStreamMessagesUpdate = Database['ai_agent']['Tables']['ai_stream_messages']['Update']
export type DbAiAgentAiSystemAlertsUpdate = Database['ai_agent']['Tables']['ai_system_alerts']['Update']
export type DbAiAgentAiUserCommandHistoryUpdate = Database['ai_agent']['Tables']['ai_user_command_history']['Update']
export type DbAiAgentAiUserPreferencesUpdate = Database['ai_agent']['Tables']['ai_user_preferences']['Update']
export type DbAiAgentAiWorkflowInstancesUpdate = Database['ai_agent']['Tables']['ai_workflow_instances']['Update']
export type DbAiAgentAiWorkflowTemplatesUpdate = Database['ai_agent']['Tables']['ai_workflow_templates']['Update']
export type DbAiAgentContentAnalysisCacheUpdate = Database['ai_agent']['Tables']['content_analysis_cache']['Update']
export type DbAiAgentConversationAnalysisUpdate = Database['ai_agent']['Tables']['conversation_analysis']['Update']
export type DbAiAgentConversationAnalyticsUpdate = Database['ai_agent']['Tables']['conversation_analytics']['Update']
export type DbAiAgentConversationContextUpdate = Database['ai_agent']['Tables']['conversation_context']['Update']
export type DbAiAgentConversationFlowInstancesUpdate = Database['ai_agent']['Tables']['conversation_flow_instances']['Update']
export type DbAiAgentConversationFlowsUpdate = Database['ai_agent']['Tables']['conversation_flows']['Update']
export type DbAiAgentConversationsUpdate = Database['ai_agent']['Tables']['conversations']['Update']
export type DbAiAgentDatabaseContextUpdate = Database['ai_agent']['Tables']['database_context']['Update']
export type DbAiAgentFallbackResponsesUpdate = Database['ai_agent']['Tables']['fallback_responses']['Update']
export type DbAiAgentGeneratedContentUpdate = Database['ai_agent']['Tables']['generated_content']['Update']
export type DbAiAgentIntentPatternsUpdate = Database['ai_agent']['Tables']['intent_patterns']['Update']
export type DbAiAgentKnowledgeGraphUpdate = Database['ai_agent']['Tables']['knowledge_graph']['Update']
export type DbAiAgentLearnedPatternsUpdate = Database['ai_agent']['Tables']['learned_patterns']['Update']
export type DbAiAgentMemoryClustersUpdate = Database['ai_agent']['Tables']['memory_clusters']['Update']
export type DbAiAgentMemoryConsolidationUpdate = Database['ai_agent']['Tables']['memory_consolidation']['Update']
export type DbAiAgentMessagesUpdate = Database['ai_agent']['Tables']['messages']['Update']
export type DbAiAgentPatternsUpdate = Database['ai_agent']['Tables']['patterns']['Update']
export type DbAiAgentPerformanceMetricsUpdate = Database['ai_agent']['Tables']['performance_metrics']['Update']
export type DbAiAgentResponseTemplatesUpdate = Database['ai_agent']['Tables']['response_templates']['Update']
export type DbAiAgentSystemHealthUpdate = Database['ai_agent']['Tables']['system_health']['Update']
export type DbAiAgentSystemMetricsUpdate = Database['ai_agent']['Tables']['system_metrics']['Update']
export type DbAiAgentToolUsagePatternsUpdate = Database['ai_agent']['Tables']['tool_usage_patterns']['Update']
export type DbAiAgentUserPreferencesUpdate = Database['ai_agent']['Tables']['user_preferences']['Update']

// ai_agent Functions
export type DbAiAgentAutoResolveIssuesFunction = Database['ai_agent']['Functions']['auto_resolve_issues']
export type DbAiAgentAutoResolveIssuesArgs = Database['ai_agent']['Functions']['auto_resolve_issues']['Args']
export type DbAiAgentAutoResolveIssuesReturns = Database['ai_agent']['Functions']['auto_resolve_issues']['Returns']
export type DbAiAgentCheckSystemHealthFunction = Database['ai_agent']['Functions']['check_system_health']
export type DbAiAgentCheckSystemHealthArgs = Database['ai_agent']['Functions']['check_system_health']['Args']
export type DbAiAgentCheckSystemHealthReturns = Database['ai_agent']['Functions']['check_system_health']['Returns']
export type DbAiAgentCleanupExpiredCacheFunction = Database['ai_agent']['Functions']['cleanup_expired_cache']
export type DbAiAgentCleanupExpiredCacheArgs = Database['ai_agent']['Functions']['cleanup_expired_cache']['Args']
export type DbAiAgentCleanupExpiredCacheReturns = Database['ai_agent']['Functions']['cleanup_expired_cache']['Returns']
export type DbAiAgentDetectIntentFunction = Database['ai_agent']['Functions']['detect_intent']
export type DbAiAgentDetectIntentArgs = Database['ai_agent']['Functions']['detect_intent']['Args']
export type DbAiAgentDetectIntentReturns = Database['ai_agent']['Functions']['detect_intent']['Returns']
export type DbAiAgentGetConversationContextFunction = Database['ai_agent']['Functions']['get_conversation_context']
export type DbAiAgentGetConversationContextArgs = Database['ai_agent']['Functions']['get_conversation_context']['Args']
export type DbAiAgentGetConversationContextReturns = Database['ai_agent']['Functions']['get_conversation_context']['Returns']
export type DbAiAgentGetProactiveSuggestionsFunction = Database['ai_agent']['Functions']['get_proactive_suggestions']
export type DbAiAgentGetProactiveSuggestionsArgs = Database['ai_agent']['Functions']['get_proactive_suggestions']['Args']
export type DbAiAgentGetProactiveSuggestionsReturns = Database['ai_agent']['Functions']['get_proactive_suggestions']['Returns']
export type DbAiAgentGetRelevantPatternsFunction = Database['ai_agent']['Functions']['get_relevant_patterns']
export type DbAiAgentGetRelevantPatternsArgs = Database['ai_agent']['Functions']['get_relevant_patterns']['Args']
export type DbAiAgentGetRelevantPatternsReturns = Database['ai_agent']['Functions']['get_relevant_patterns']['Returns']
export type DbAiAgentGetResponseTemplateFunction = Database['ai_agent']['Functions']['get_response_template']
export type DbAiAgentGetResponseTemplateArgs = Database['ai_agent']['Functions']['get_response_template']['Args']
export type DbAiAgentGetResponseTemplateReturns = Database['ai_agent']['Functions']['get_response_template']['Returns']
export type DbAiAgentLearnUserPreferenceFunction = Database['ai_agent']['Functions']['learn_user_preference']
export type DbAiAgentLearnUserPreferenceArgs = Database['ai_agent']['Functions']['learn_user_preference']['Args']
export type DbAiAgentLearnUserPreferenceReturns = Database['ai_agent']['Functions']['learn_user_preference']['Returns']
export type DbAiAgentRecordLearningFunction = Database['ai_agent']['Functions']['record_learning']
export type DbAiAgentRecordLearningArgs = Database['ai_agent']['Functions']['record_learning']['Args']
export type DbAiAgentRecordLearningReturns = Database['ai_agent']['Functions']['record_learning']['Returns']
export type DbAiAgentRecordToolUsageFunction = Database['ai_agent']['Functions']['record_tool_usage']
export type DbAiAgentRecordToolUsageArgs = Database['ai_agent']['Functions']['record_tool_usage']['Args']
export type DbAiAgentRecordToolUsageReturns = Database['ai_agent']['Functions']['record_tool_usage']['Returns']
export type DbAiAgentUpdateConversationContextFunction = Database['ai_agent']['Functions']['update_conversation_context']
export type DbAiAgentUpdateConversationContextArgs = Database['ai_agent']['Functions']['update_conversation_context']['Args']
export type DbAiAgentUpdateConversationContextReturns = Database['ai_agent']['Functions']['update_conversation_context']['Returns']

// =============================================================================
// SCHOOL SCHEMA TYPES
// =============================================================================

// school Tables
export type DbSchoolAssignments = Database['school']['Tables']['assignments']['Row']
export type DbSchoolCoursePodLinks = Database['school']['Tables']['course_pod_links']['Row']
export type DbSchoolCourses = Database['school']['Tables']['courses']['Row']
export type DbSchoolDistricts = Database['school']['Tables']['districts']['Row']
export type DbSchoolEnrollments = Database['school']['Tables']['enrollments']['Row']
export type DbSchoolSchools = Database['school']['Tables']['schools']['Row']
export type DbSchoolStudentGrades = Database['school']['Tables']['student_grades']['Row']
export type DbSchoolSubmissions = Database['school']['Tables']['submissions']['Row']
export type DbSchoolSyncLogs = Database['school']['Tables']['sync_logs']['Row']
export type DbSchoolUserProfiles = Database['school']['Tables']['user_profiles']['Row']

// school Insert Types
export type DbSchoolAssignmentsInsert = Database['school']['Tables']['assignments']['Insert']
export type DbSchoolCoursePodLinksInsert = Database['school']['Tables']['course_pod_links']['Insert']
export type DbSchoolCoursesInsert = Database['school']['Tables']['courses']['Insert']
export type DbSchoolDistrictsInsert = Database['school']['Tables']['districts']['Insert']
export type DbSchoolEnrollmentsInsert = Database['school']['Tables']['enrollments']['Insert']
export type DbSchoolSchoolsInsert = Database['school']['Tables']['schools']['Insert']
export type DbSchoolStudentGradesInsert = Database['school']['Tables']['student_grades']['Insert']
export type DbSchoolSubmissionsInsert = Database['school']['Tables']['submissions']['Insert']
export type DbSchoolSyncLogsInsert = Database['school']['Tables']['sync_logs']['Insert']
export type DbSchoolUserProfilesInsert = Database['school']['Tables']['user_profiles']['Insert']

// school Update Types
export type DbSchoolAssignmentsUpdate = Database['school']['Tables']['assignments']['Update']
export type DbSchoolCoursePodLinksUpdate = Database['school']['Tables']['course_pod_links']['Update']
export type DbSchoolCoursesUpdate = Database['school']['Tables']['courses']['Update']
export type DbSchoolDistrictsUpdate = Database['school']['Tables']['districts']['Update']
export type DbSchoolEnrollmentsUpdate = Database['school']['Tables']['enrollments']['Update']
export type DbSchoolSchoolsUpdate = Database['school']['Tables']['schools']['Update']
export type DbSchoolStudentGradesUpdate = Database['school']['Tables']['student_grades']['Update']
export type DbSchoolSubmissionsUpdate = Database['school']['Tables']['submissions']['Update']
export type DbSchoolSyncLogsUpdate = Database['school']['Tables']['sync_logs']['Update']
export type DbSchoolUserProfilesUpdate = Database['school']['Tables']['user_profiles']['Update']

// school Enums
export type DbSchoolLmsPlatformEnum = Database['school']['Enums']['lms_platform']

// school Functions
export type DbSchoolGetLmsIntegrationStatusFunction = Database['school']['Functions']['get_lms_integration_status']
export type DbSchoolGetLmsIntegrationStatusArgs = Database['school']['Functions']['get_lms_integration_status']['Args']
export type DbSchoolGetLmsIntegrationStatusReturns = Database['school']['Functions']['get_lms_integration_status']['Returns']
export type DbSchoolGetUserSchoolContextFunction = Database['school']['Functions']['get_user_school_context']
export type DbSchoolGetUserSchoolContextArgs = Database['school']['Functions']['get_user_school_context']['Args']
export type DbSchoolGetUserSchoolContextReturns = Database['school']['Functions']['get_user_school_context']['Returns']
export type DbSchoolLogSyncActivityFunction = Database['school']['Functions']['log_sync_activity']
export type DbSchoolLogSyncActivityArgs = Database['school']['Functions']['log_sync_activity']['Args']
export type DbSchoolLogSyncActivityReturns = Database['school']['Functions']['log_sync_activity']['Returns']
export type DbSchoolSwitchPodLmsPlatformFunction = Database['school']['Functions']['switch_pod_lms_platform']
export type DbSchoolSwitchPodLmsPlatformArgs = Database['school']['Functions']['switch_pod_lms_platform']['Args']
export type DbSchoolSwitchPodLmsPlatformReturns = Database['school']['Functions']['switch_pod_lms_platform']['Returns']

// =============================================================================
// ADMIN PANEL SCHEMA TYPES
// =============================================================================

// admin_panel Tables
export type DbAdminPanelActivityLogs = Database['admin_panel']['Tables']['activity_logs']['Row']
export type DbAdminPanelBulkOperations = Database['admin_panel']['Tables']['bulk_operations']['Row']
export type DbAdminPanelPerformanceMetrics = Database['admin_panel']['Tables']['performance_metrics']['Row']
export type DbAdminPanelSystemAlerts = Database['admin_panel']['Tables']['system_alerts']['Row']
export type DbAdminPanelUserPreferences = Database['admin_panel']['Tables']['user_preferences']['Row']

// admin_panel Insert Types
export type DbAdminPanelActivityLogsInsert = Database['admin_panel']['Tables']['activity_logs']['Insert']
export type DbAdminPanelBulkOperationsInsert = Database['admin_panel']['Tables']['bulk_operations']['Insert']
export type DbAdminPanelPerformanceMetricsInsert = Database['admin_panel']['Tables']['performance_metrics']['Insert']
export type DbAdminPanelSystemAlertsInsert = Database['admin_panel']['Tables']['system_alerts']['Insert']
export type DbAdminPanelUserPreferencesInsert = Database['admin_panel']['Tables']['user_preferences']['Insert']

// admin_panel Update Types
export type DbAdminPanelActivityLogsUpdate = Database['admin_panel']['Tables']['activity_logs']['Update']
export type DbAdminPanelBulkOperationsUpdate = Database['admin_panel']['Tables']['bulk_operations']['Update']
export type DbAdminPanelPerformanceMetricsUpdate = Database['admin_panel']['Tables']['performance_metrics']['Update']
export type DbAdminPanelSystemAlertsUpdate = Database['admin_panel']['Tables']['system_alerts']['Update']
export type DbAdminPanelUserPreferencesUpdate = Database['admin_panel']['Tables']['user_preferences']['Update']

// admin_panel Functions
export type DbAdminPanelLogActivityFunction = Database['admin_panel']['Functions']['log_activity']
export type DbAdminPanelLogActivityArgs = Database['admin_panel']['Functions']['log_activity']['Args']
export type DbAdminPanelLogActivityReturns = Database['admin_panel']['Functions']['log_activity']['Returns']

// =============================================================================
// SCHEMA-SPECIFIC TYPE HELPERS
// =============================================================================

// Helper types for working with specific schemas
export type PublicSchema = Database['public']
export type AiAgentSchema = Database['ai_agent']
export type SchoolSchema = Database['school']
export type AdminPanelSchema = Database['admin_panel']

// Helper for getting all tables from a schema
export type PublicTables = Database['public']['Tables']
export type AiAgentTables = Database['ai_agent']['Tables']
export type SchoolTables = Database['school']['Tables']
export type AdminPanelTables = Database['admin_panel']['Tables']
