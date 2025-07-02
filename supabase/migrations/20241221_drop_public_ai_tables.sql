-- Drop AI tables from public schema
-- These tables should now be in the ai_agent schema

-- Drop tables in reverse dependency order to avoid foreign key issues

-- AI workflow and execution tables
DROP TABLE IF EXISTS public.ai_workflow_executions CASCADE;
DROP TABLE IF EXISTS public.ai_workflow_steps CASCADE;
DROP TABLE IF EXISTS public.ai_workflows CASCADE;

-- AI content and analysis tables
DROP TABLE IF EXISTS public.ai_generated_content CASCADE;
DROP TABLE IF EXISTS public.ai_content_analysis_cache CASCADE;
DROP TABLE IF EXISTS public.ai_content_quality_scores CASCADE;

-- AI conversation and memory tables
DROP TABLE IF EXISTS public.ai_conversation_context CASCADE;
DROP TABLE IF EXISTS public.ai_message_attachments CASCADE;
DROP TABLE IF EXISTS public.ai_messages CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;

-- AI learning and patterns tables
DROP TABLE IF EXISTS public.ai_knowledge_graph CASCADE;
DROP TABLE IF EXISTS public.ai_fallback_responses CASCADE;
DROP TABLE IF EXISTS public.ai_performance_metrics CASCADE;
DROP TABLE IF EXISTS public.ai_learned_patterns CASCADE;
DROP TABLE IF EXISTS public.ai_database_context CASCADE;

-- AI command system tables (if they exist in public)
DROP TABLE IF EXISTS public.ai_action_prompts CASCADE;
DROP TABLE IF EXISTS public.ai_command_actions CASCADE;
DROP TABLE IF EXISTS public.ai_execution_logs CASCADE;
DROP TABLE IF EXISTS public.ai_analytics CASCADE;
DROP TABLE IF EXISTS public.ai_prompts CASCADE;
DROP TABLE IF EXISTS public.ai_actions CASCADE;
DROP TABLE IF EXISTS public.ai_commands CASCADE;

-- AI provider and model tables
DROP TABLE IF EXISTS public.ai_model_capabilities CASCADE;
DROP TABLE IF EXISTS public.ai_models CASCADE;
DROP TABLE IF EXISTS public.ai_providers CASCADE;

-- AI integration and workflow tables
DROP TABLE IF EXISTS public.ai_integration_logs CASCADE;
DROP TABLE IF EXISTS public.ai_integrations CASCADE;
DROP TABLE IF EXISTS public.ai_quality_gates CASCADE;
DROP TABLE IF EXISTS public.ai_workflow_templates CASCADE;
DROP TABLE IF EXISTS public.ai_content_sources CASCADE;

-- AI security and audit tables
DROP TABLE IF EXISTS public.ai_security_audit_log CASCADE;
DROP TABLE IF EXISTS public.ai_rate_limits CASCADE;
DROP TABLE IF EXISTS public.ai_api_keys CASCADE;

-- Admin panel AI tables (if they exist)
DROP TABLE IF EXISTS public.admin_ai_operations CASCADE;
DROP TABLE IF EXISTS public.admin_ai_logs CASCADE;

-- Legacy AI tables that might exist
DROP TABLE IF EXISTS public.ai_tool_results CASCADE;
DROP TABLE IF EXISTS public.ai_tool_configs CASCADE;
DROP TABLE IF EXISTS public.ai_generation_jobs CASCADE;
DROP TABLE IF EXISTS public.ai_processing_queue CASCADE;

-- Drop any remaining AI-related types or functions
DROP TYPE IF EXISTS public.ai_provider_type CASCADE;
DROP TYPE IF EXISTS public.ai_model_type CASCADE;
DROP TYPE IF EXISTS public.ai_execution_status CASCADE;
DROP TYPE IF EXISTS public.ai_workflow_status CASCADE;
DROP TYPE IF EXISTS public.ai_quality_level CASCADE;

-- Drop AI-related functions
DROP FUNCTION IF EXISTS public.update_ai_metrics(text, text, boolean, integer, integer, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.record_learning(text, text, text, decimal, jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_relevant_patterns(text, jsonb, integer) CASCADE;

COMMENT ON SCHEMA public IS 'All AI tables moved to ai_agent schema - public schema cleaned'; 