-- ============================================================================
-- AI AGENT CORRECTED SEED DATA MIGRATION
-- ============================================================================
-- Populates the ai_agent schema with conversational intelligence using CORRECT column names
-- Based on actual database schema from database.types.ts

BEGIN;

-- ============================================================================
-- DEFENSIVE SCHEMA FIX FOR CONVERSATION ANALYTICS
-- ============================================================================
-- This block ensures the conversation_analytics table has the correct schema
-- before attempting to insert data, resolving conflicts from older migrations.

DO $$
BEGIN
  -- Check if the table exists but has the OLD schema (missing conversation_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'ai_agent' AND table_name = 'conversation_analytics')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'ai_agent' AND table_name = 'conversation_analytics' AND column_name = 'conversation_id') THEN
    
    RAISE NOTICE 'Incorrect schema for conversation_analytics detected. Dropping and recreating table.';
    
    -- Drop the old, incorrect table
    DROP TABLE ai_agent.conversation_analytics CASCADE;
    
    -- Recreate it with the CORRECT schema
    CREATE TABLE ai_agent.conversation_analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES ai_agent.conversations(id) ON DELETE CASCADE,
      agent_type VARCHAR(100) NOT NULL,
      total_messages INTEGER DEFAULT 0,
      total_tokens_used INTEGER DEFAULT 0,
      conversation_duration_seconds INTEGER DEFAULT 0,
      user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),
      resolution_status VARCHAR(50) DEFAULT 'unresolved',
      topics_covered TEXT[],
      conversation_outcome VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Re-apply policies and indexes
    ALTER TABLE ai_agent.conversation_analytics ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "conversation_analytics_read" ON ai_agent.conversation_analytics FOR SELECT USING (true);
    CREATE POLICY "conversation_analytics_insert" ON ai_agent.conversation_analytics FOR INSERT WITH CHECK (true);
    RAISE NOTICE 'conversation_analytics table recreated successfully.';
    
  END IF;
END $$;

-- ============================================================================
-- CONVERSATION TEMPLATES FOR DIFFERENT SCENARIOS
-- ============================================================================

-- Note: Using conversation_context instead of context_data (which doesn't exist)
-- Using proper UUIDs for session_id instead of string identifiers
INSERT INTO ai_agent.conversations (
  session_id, 
  agent_type, 
  agent_model, 
  conversation_context,
  conversation_state,
  conversation_mode,
  current_topic,
  conversation_summary
) VALUES

-- Autonomous System Health Template
(gen_random_uuid(), 'autonomous_monitor', 'claude-3-5-sonnet-20241022', 
'{
  "capabilities": ["health_monitoring", "auto_healing", "predictive_alerts"], 
  "triggers": ["performance_degradation", "error_spikes"],
  "response_patterns": ["immediate_action", "escalation", "notification"],
  "template_type": "health_monitoring"
}',
'template', 'autonomous', 'System Health Monitoring', 
'Autonomous system health monitoring with proactive issue resolution'),

-- Congressional Data Management Template
(gen_random_uuid(), 'data_manager', 'claude-3-5-sonnet-20241022',
'{
  "capabilities": ["data_sync", "photo_management", "member_tracking"],
  "specialization": "congressional_data",
  "auto_fixes": ["photo_downloads", "member_updates", "data_validation"],
  "template_type": "congress_management"
}',
'template', 'autonomous', 'Congressional Data Management',
'Manages congressional member data, photos, and synchronization processes'),

-- Content Generation Template
(gen_random_uuid(), 'content_generator', 'claude-3-5-sonnet-20241022',
'{
  "capabilities": ["content_creation", "quality_assurance", "fact_checking"],
  "content_types": ["quiz_questions", "educational_content", "civic_explanations"],
  "quality_standards": ["civic_brand_compliance", "factual_accuracy", "engagement"],
  "template_type": "content_generation"
}',
'template', 'assistant', 'Content Generation',
'Generates high-quality civic education content that meets CivicSense standards'),

-- Problem Solver Template
(gen_random_uuid(), 'problem_solver', 'claude-3-5-sonnet-20241022',
'{
  "capabilities": ["issue_diagnosis", "solution_generation", "implementation_guidance"],
  "problem_domains": ["technical_issues", "data_problems", "system_failures"],
  "approach": ["analyze", "hypothesize", "test", "implement", "verify"],
  "template_type": "problem_solving"
}',
'template', 'assistant', 'Problem Solving',
'Diagnoses and solves technical and operational problems systematically');

-- ============================================================================
-- SAMPLE CONVERSATION ANALYTICS (only if table exists)
-- ============================================================================

-- Check if conversation_analytics table exists and insert sample data
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'ai_agent' 
             AND table_name = 'conversation_analytics') THEN
    
    INSERT INTO ai_agent.conversation_analytics (
      conversation_id,
      agent_type,
      total_messages,
      total_tokens_used,
      conversation_duration_seconds,
      resolution_status,
      topics_covered,
      conversation_outcome
    ) VALUES

    -- Get template conversation IDs and create analytics for them
    ((SELECT id FROM ai_agent.conversations WHERE conversation_context->>'template_type' = 'health_monitoring' LIMIT 1), 
    'autonomous_monitor', 0, 0, 0, 'template', 
    ARRAY['system_health', 'monitoring', 'auto_healing'], 'template_created'),

    ((SELECT id FROM ai_agent.conversations WHERE conversation_context->>'template_type' = 'congress_management' LIMIT 1), 
    'data_manager', 0, 0, 0, 'template',
    ARRAY['congressional_data', 'photo_management', 'member_tracking'], 'template_created'),

    ((SELECT id FROM ai_agent.conversations WHERE conversation_context->>'template_type' = 'content_generation' LIMIT 1), 
    'content_generator', 0, 0, 0, 'template',
    ARRAY['content_generation', 'civic_education', 'quality_assurance'], 'template_created'),

    ((SELECT id FROM ai_agent.conversations WHERE conversation_context->>'template_type' = 'problem_solving' LIMIT 1), 
    'problem_solver', 0, 0, 0, 'template',
    ARRAY['problem_solving', 'technical_support', 'system_diagnosis'], 'template_created');

  END IF;
END $$;

-- ============================================================================
-- SYSTEM HEALTH METRICS FOR MONITORING (only if table exists)
-- ============================================================================

-- Check if system_metrics table exists and insert sample data
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'ai_agent' 
             AND table_name = 'system_metrics') THEN

    INSERT INTO ai_agent.system_metrics (
      metric_name,
      metric_value,
      metric_unit,
      component,
      metadata
    ) VALUES

    -- Database health metrics
    ('database_response_time', 0.05, 'seconds', 'database', 
    '{"baseline": 0.05, "warning_threshold": 0.1, "critical_threshold": 0.5}'),

    ('database_connection_count', 10, 'connections', 'database',
    '{"max_connections": 100, "warning_threshold": 80, "current": 10}'),

    -- Congressional photo system metrics
    ('photo_download_success_rate', 95.0, 'percentage', 'congressional_photos',
    '{"total_photos": 535, "successful": 508, "failed": 27}'),

    ('photo_storage_usage', 2.1, 'GB', 'congressional_photos',
    '{"total_capacity": 10, "used": 2.1, "available": 7.9}'),

    -- AI service metrics
    ('ai_response_time', 1.2, 'seconds', 'ai_services',
    '{"average_last_24h": 1.2, "p95": 2.5, "model": "claude-3-5-sonnet"}'),

    ('ai_token_usage', 45000, 'tokens', 'ai_services',
    '{"daily_limit": 100000, "used_today": 45000, "remaining": 55000}'),

    -- Memory and performance metrics
    ('memory_usage', 68.5, 'percentage', 'system',
    '{"total_mb": 8192, "used_mb": 5612, "available_mb": 2580}'),

    ('error_rate', 0.2, 'percentage', 'system',
    '{"errors_last_hour": 3, "requests_last_hour": 1500, "rate": 0.2}');

  END IF;
END $$;

-- ============================================================================
-- LEARNING PATTERNS (using existing learned_patterns table)
-- ============================================================================

INSERT INTO ai_agent.learned_patterns (
  pattern_type,
  pattern_category,
  pattern_description,
  confidence_score,
  supporting_evidence
) VALUES

-- Congressional photo management patterns
('photo_download_failure', 'congressional_data',
'Photo downloads fail when congress_number column is missing from database schema',
0.95,
'{"occurrences": 15, "fix_success_rate": 100, "pattern_confirmed": true}'),

('member_data_sync', 'congressional_data',
'Congressional member sync requires both bioguide_id and display_name validation',
0.90,
'{"sync_successes": 450, "failures": 25, "validation_fixes": 23}'),

-- System health patterns
('database_performance', 'system_health',
'Database response time increases when connection pool exceeds 80% capacity',
0.85,
'{"observations": 12, "correlation": 0.85, "preventive_actions": 8}'),

('ai_token_optimization', 'ai_services',
'Conversation context truncation at 4000 tokens maintains quality while reducing costs',
0.88,
'{"cost_savings": 25, "quality_maintained": true, "user_satisfaction": 4.2}'),

-- Problem solving patterns
('schema_migration_issues', 'technical_problems',
'Missing column errors typically resolved by checking actual schema vs expected schema',
0.93,
'{"schema_fixes": 8, "success_rate": 100, "time_to_resolution": "5 minutes"}'),

('autonomous_healing', 'system_operations',
'System issues detected through metrics monitoring can be auto-resolved 70% of the time',
0.75,
'{"auto_fixes": 28, "total_issues": 40, "success_rate": 70, "manual_intervention": 12}');

-- ============================================================================
-- PERFORMANCE METRICS BASELINE
-- ============================================================================

-- Note: ai_agent.performance_metrics table structure from database.types.ts:
-- agent_type, avg_response_time_ms, failed_requests, fallback_requests, 
-- metric_date, quality_metrics, successful_requests, total_cost_usd, 
-- total_requests, total_tokens_used

INSERT INTO ai_agent.performance_metrics (
  agent_type,
  metric_date,
  total_requests,
  successful_requests,
  failed_requests,
  fallback_requests,
  avg_response_time_ms,
  total_tokens_used,
  total_cost_usd,
  quality_metrics
) VALUES

-- Autonomous monitor performance
('autonomous_monitor', CURRENT_DATE,
10, 9, 1, 0, 1200, 15000, 0.75,
'{"accuracy": 0.95, "user_satisfaction": 4.2, "response_quality": 0.88}'),

-- Data manager performance  
('data_manager', CURRENT_DATE,
25, 23, 2, 0, 800, 8500, 0.42,
'{"data_accuracy": 0.98, "sync_success_rate": 0.92, "error_recovery": 0.85}'),

-- Content generator performance
('content_generator', CURRENT_DATE,
15, 14, 1, 0, 2500, 45000, 2.25,
'{"content_quality": 0.91, "brand_compliance": 0.96, "engagement_score": 0.83}'),

-- Problem solver performance
('problem_solver', CURRENT_DATE,
8, 7, 1, 0, 1800, 22000, 1.10,
'{"resolution_rate": 0.87, "time_to_solution": 300, "user_satisfaction": 4.5}');

-- ============================================================================
-- FALLBACK RESPONSES FOR COMMON SCENARIOS
-- ============================================================================

INSERT INTO ai_agent.fallback_responses (
  trigger_pattern,
  response_type,
  response_template,
  response_data,
  is_active
) VALUES

-- System health fallbacks
('system.*health.*check', 'diagnostic',
'I''m running a comprehensive system health check. Current status: {status}. Would you like me to investigate any specific component?',
'{"components": ["database", "ai_services", "congressional_data", "storage"], "health_levels": ["healthy", "warning", "critical"]}',
true),

-- Congressional data fallbacks
('congress.*photo.*fail', 'troubleshooting',
'I detected congressional photo download issues. This usually happens when the database schema is missing required columns. I can fix this automatically.',
'{"common_fixes": ["add_congress_number_column", "update_photo_service", "restart_sync"], "success_rate": 95}',
true),

-- Problem solving fallbacks
('error.*column.*not.*exist', 'schema_fix',
'I see a database schema issue - column "{column_name}" doesn''t exist in table "{table_name}". I can analyze the expected schema and create a migration to fix this.',
'{"fix_types": ["add_column", "alter_table", "create_table"], "typical_resolution_time": "2-5 minutes"}',
true),

-- General assistance fallbacks
('help.*autonomous', 'guidance',
'I''m your autonomous AI assistant for CivicSense administration. I can monitor system health, fix data issues, generate content, and solve problems. What would you like me to help with?',
'{"capabilities": ["health_monitoring", "data_management", "content_generation", "problem_solving"], "interaction_modes": ["autonomous", "collaborative", "supervised"]}',
true);

COMMIT; 