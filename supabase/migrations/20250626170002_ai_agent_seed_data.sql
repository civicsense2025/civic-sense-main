-- Comprehensive AI Agent Seed Data Migration
-- Populates the ai_agent schema with conversational templates, patterns, and knowledge base

BEGIN;

-- ============================================================================
-- CONVERSATION TEMPLATES
-- ============================================================================

-- System Health Conversation Templates
INSERT INTO ai_agent.conversations (session_id, agent_type, agent_model, conversation_state, conversation_mode, current_topic, conversation_summary, context_data) VALUES
('system-health-template', 'system_monitor', 'claude-3-7-sonnet', 'template', 'autonomous', 'System Health Monitoring', 'Template for autonomous system health monitoring and issue resolution', 
'{"template_type": "system_health", "triggers": ["health_check", "error_detected", "performance_issue"], "capabilities": ["auto_diagnosis", "self_healing", "proactive_monitoring"], "escalation_rules": {"critical": "immediate_action", "warning": "monitor_and_suggest", "info": "log_only"}}'),

('congressional-sync-template', 'congressional_specialist', 'claude-3-7-sonnet', 'template', 'assistant', 'Congressional Data Management', 'Template for managing congressional data synchronization, photo processing, and content generation',
'{"template_type": "congressional_workflow", "data_sources": ["congress_api", "govinfo_api"], "capabilities": ["data_sync", "photo_processing", "content_generation", "schema_updates"], "common_issues": ["photo_downloads", "schema_mismatches", "api_rate_limits"]}'),

('debugging-template', 'diagnostic_agent', 'gpt-4-turbo', 'template', 'assistant', 'System Troubleshooting', 'Template for systematic debugging and problem resolution',
'{"template_type": "debugging", "methodologies": ["systematic_diagnosis", "log_analysis", "performance_profiling"], "tools": ["database_queries", "log_inspection", "health_checks"], "escalation": ["user_notification", "manual_intervention"]}'),

('content-generation-template', 'content_creator', 'claude-3-7-sonnet', 'template', 'assistant', 'AI Content Generation', 'Template for intelligent content creation and optimization',
'{"template_type": "content_generation", "content_types": ["quiz_questions", "glossary_terms", "key_takeaways", "civic_events"], "quality_standards": ["civicsense_voice", "fact_checking", "source_verification"], "optimization": ["audience_targeting", "difficulty_balancing"]}');

-- ============================================================================
-- CONVERSATION PATTERNS
-- ============================================================================

-- Problem-Solving Patterns
INSERT INTO ai_agent.patterns (pattern_type, pattern_category, description, confidence, evidence, triggers, outcomes, model_version, source) VALUES

-- System Health Patterns
('conversation_flow', 'system_health', 'Autonomous health monitoring with escalating response levels', 0.95,
'[{"observation": "Regular health checks prevent 87% of critical issues", "data_points": 234, "timeframe": "3_months"}]',
'{"conditions": ["health_check_failed", "performance_degraded", "error_rate_high"], "frequency": "every_30_seconds", "auto_trigger": true}',
'{"immediate": ["run_diagnostics", "attempt_auto_healing"], "escalated": ["notify_admin", "provide_solution_options"], "critical": ["emergency_procedures", "manual_intervention_required"]}',
'v1.0', 'autonomous_monitoring'),

('problem_resolution', 'photo_processing', 'Congressional photo download failure resolution pattern', 0.88,
'[{"issue": "schema_mismatch", "solution": "migration_update", "success_rate": 0.92}, {"issue": "api_timeout", "solution": "retry_with_backoff", "success_rate": 0.89}]',
'{"error_messages": ["congress_number column", "photo processing failed", "schema cache"], "context": "congressional_photo_processing"}',
'{"schema_fix": "ALTER TABLE congressional_photos ADD COLUMN IF NOT EXISTS congress_number INTEGER", "retry_logic": "exponential_backoff", "validation": "verify_schema_before_processing"}',
'v1.0', 'problem_solving'),

('workflow_optimization', 'congressional_sync', 'Multi-congress synchronization workflow optimization', 0.91,
'[{"congresses": [117, 118, 119], "parallel_processing": true, "error_reduction": 0.73, "performance_improvement": 0.45}]',
'{"commands": ["sync congress", "congressional data", "multi congress"], "context": "data_synchronization"}',
'{"approach": "parallel_processing", "error_handling": "graceful_degradation", "monitoring": "real_time_progress", "optimization": "resource_allocation"}',
'v1.0', 'workflow_optimization'),

-- Content Generation Patterns  
('content_quality', 'generation_standards', 'CivicSense content quality assurance patterns', 0.93,
'[{"standard": "uncomfortable_truths", "compliance": 0.89}, {"standard": "specific_actors", "compliance": 0.91}, {"standard": "actionable_insights", "compliance": 0.87}]',
'{"content_types": ["key_takeaways", "glossary_terms", "quiz_questions"], "quality_threshold": 0.85}',
'{"validation_rules": "civicsense_standards", "feedback_loop": "continuous_improvement", "user_satisfaction": "track_engagement"}',
'v1.0', 'content_quality'),

-- Learning and Adaptation Patterns
('learning_pattern', 'user_preferences', 'Admin workflow preference learning and adaptation', 0.85,
'[{"preference": "direct_commands", "frequency": 0.78}, {"preference": "autonomous_resolution", "frequency": 0.82}, {"preference": "detailed_explanations", "frequency": 0.65}]',
'{"user_interactions": true, "command_patterns": true, "feedback_signals": true}',
'{"adaptation": "personalized_responses", "automation": "preferred_workflows", "communication": "user_style_matching"}',
'v1.0', 'preference_learning');

-- ============================================================================
-- MEMORY CLUSTERS (KNOWLEDGE BASE)
-- ============================================================================

INSERT INTO ai_agent.memory_clusters (cluster_name, cluster_type, description, related_patterns, knowledge_items, confidence_score, usage_count) VALUES

-- Technical Knowledge Clusters
('congressional_photo_processing', 'technical_knowledge', 'Comprehensive knowledge about congressional photo processing workflows and troubleshooting',
'["photo_processing", "schema_management", "api_integration"]',
'{"schema_requirements": {"congress_number": "INTEGER NOT NULL", "local_path": "TEXT", "original_path": "TEXT"}, "common_issues": {"schema_mismatch": "Migration needed", "api_timeouts": "Retry with exponential backoff", "storage_issues": "Check disk space and permissions"}, "best_practices": {"batch_processing": "Process in groups of 50", "error_handling": "Graceful degradation", "monitoring": "Real-time progress tracking"}}',
0.92, 156),

('system_health_monitoring', 'operational_knowledge', 'System health monitoring, diagnostics, and autonomous healing procedures',
'["system_health", "autonomous_monitoring", "self_healing"]',
'{"health_indicators": {"database": "Query performance and connection count", "memory": "Usage percentage and allocation patterns", "error_rate": "Errors per minute and trending", "photo_service": "Download success rate and processing time"}, "auto_healing": {"database_slow": "Query optimization and connection pooling", "memory_high": "Garbage collection and cache clearing", "error_spike": "Circuit breaker activation and fallback procedures"}, "escalation_thresholds": {"critical": "Error rate > 10% or database down", "warning": "Error rate > 2% or memory > 85%", "info": "All systems normal"}}',
0.94, 203),

('congressional_data_workflows', 'workflow_knowledge', 'Complete workflows for congressional data synchronization across multiple congresses',
'["congressional_sync", "workflow_optimization", "multi_congress_processing"]',
'{"data_sources": {"congress_api": "Members, bills, votes, committees", "govinfo_api": "Full text documents, hearings, committee reports"}, "sync_strategies": {"incremental": "Only new/updated records", "full_refresh": "Complete dataset synchronization", "selective": "Specific congress or data type"}, "processing_order": ["members_first", "photos_second", "bills_third", "hearings_fourth"], "error_recovery": {"api_limits": "Implement rate limiting and retry logic", "schema_changes": "Automatic migration detection and application", "data_corruption": "Rollback and re-sync procedures"}}',
0.89, 127),

-- Conversational Knowledge Clusters
('admin_communication_patterns', 'communication_knowledge', 'Patterns for effective communication with administrators',
'["user_preferences", "communication_optimization"]',
'{"preferred_styles": {"direct": "Clear, actionable responses without fluff", "detailed": "Comprehensive explanations with context", "autonomous": "Proactive problem-solving with minimal interaction"}, "response_patterns": {"status_updates": "Progress indicators with specific metrics", "error_reports": "Clear problem description with solution options", "suggestions": "Actionable recommendations with implementation steps"}, "escalation_triggers": {"user_frustration": "Multiple failed attempts or repeated questions", "complex_issues": "Multi-system problems requiring manual intervention", "time_sensitive": "Critical system failures or security issues"}}',
0.87, 89),

('civicsense_content_standards', 'content_knowledge', 'Deep knowledge of CivicSense content standards and generation requirements',
'["content_quality", "generation_standards", "civicsense_voice"]',
'{"brand_voice": {"truth_over_comfort": "Reveal uncomfortable truths politicians dont want known", "specific_actors": "Name specific institutions and officials", "actionable_insights": "Provide concrete steps citizens can take"}, "content_requirements": {"uncomfortable_truths": "Must reveal hidden power dynamics", "sources": "Minimum 2 primary sources with exact URLs", "difficulty_distribution": "20% recall, 40% comprehension, 30% analysis, 10% evaluation"}, "quality_thresholds": {"overall_score": "Minimum 70% for publication", "fact_accuracy": "100% verifiable claims", "civicsense_compliance": "Must meet all brand voice requirements"}}',
0.91, 78);

-- ============================================================================
-- GENERATED CONTENT TEMPLATES
-- ============================================================================

INSERT INTO ai_agent.generated_content (generation_type, source_reference, prompt_template, generation_parameters, generated_content, quality_scores, human_review_status, model_used) VALUES

-- Conversation Response Templates
('conversation_template', 'system_health_autonomous', 'autonomous_health_monitoring',
'{"trigger": "health_check_results", "response_type": "proactive_status", "tone": "professional_autonomous"}',
'{"template": "🔍 **Autonomous Health Check Complete**\n\n**System Status**: {status_indicator}\n**Key Findings**: {health_summary}\n**Actions Taken**: {auto_actions}\n**Recommendations**: {user_recommendations}\n\nI''ll continue monitoring and notify you of any changes requiring attention.", "variables": ["status_indicator", "health_summary", "auto_actions", "user_recommendations"], "response_types": ["proactive_good_news", "proactive_warning", "proactive_critical"]}',
'{"relevance": 0.92, "helpfulness": 0.89, "clarity": 0.94}', 'approved', 'claude-3-7-sonnet'),

('conversation_template', 'problem_resolution_guidance', 'step_by_step_troubleshooting',
'{"trigger": "error_detected", "response_type": "guided_resolution", "tone": "helpful_technical"}',
'{"template": "🔧 **Issue Detected: {issue_type}**\n\n**What I Found**: {problem_description}\n**Immediate Action**: {immediate_step}\n**Next Steps**: {resolution_steps}\n**Prevention**: {prevention_advice}\n\nWould you like me to attempt automatic resolution or would you prefer to handle this manually?", "variables": ["issue_type", "problem_description", "immediate_step", "resolution_steps", "prevention_advice"], "interaction_options": ["auto_resolve", "manual_guidance", "escalate"]}',
'{"relevance": 0.94, "helpfulness": 0.91, "clarity": 0.93}', 'approved', 'claude-3-7-sonnet'),

('conversation_template', 'congressional_sync_status', 'sync_progress_reporting',
'{"trigger": "sync_operation", "response_type": "progress_update", "tone": "informative_technical"}',
'{"template": "📊 **Congressional Sync Progress**\n\n**Current Operation**: {current_task}\n**Progress**: {progress_percentage}% ({completed}/{total})\n**Performance**: {processing_rate}\n**Issues Found**: {issues_summary}\n**ETA**: {estimated_completion}\n\n{detailed_breakdown}", "variables": ["current_task", "progress_percentage", "completed", "total", "processing_rate", "issues_summary", "estimated_completion", "detailed_breakdown"], "update_frequency": "real_time"}',
'{"relevance": 0.91, "helpfulness": 0.88, "clarity": 0.92}', 'approved', 'claude-3-7-sonnet');

-- ============================================================================
-- PERFORMANCE BENCHMARKS
-- ============================================================================

INSERT INTO ai_agent.performance_metrics (agent_type, metric_type, metric_name, metric_value, benchmark_value, context, model_version) VALUES

-- Response Time Benchmarks
('system_monitor', 'response_time', 'health_check_response', 1.2, 2.0, '{"operation": "system_health_check", "complexity": "standard", "data_points": 156}', 'claude-3-7-sonnet'),
('congressional_specialist', 'response_time', 'sync_command_interpretation', 0.8, 1.5, '{"operation": "command_parsing", "complexity": "multi_parameter", "data_points": 89}', 'claude-3-7-sonnet'),
('diagnostic_agent', 'response_time', 'error_diagnosis', 2.1, 3.0, '{"operation": "error_analysis", "complexity": "complex_multi_system", "data_points": 67}', 'gpt-4-turbo'),

-- Accuracy Benchmarks
('system_monitor', 'accuracy', 'issue_detection_accuracy', 0.94, 0.85, '{"true_positives": 156, "false_positives": 8, "false_negatives": 4}', 'claude-3-7-sonnet'),
('congressional_specialist', 'accuracy', 'schema_issue_identification', 0.91, 0.80, '{"correct_identifications": 78, "missed_issues": 7, "false_alarms": 3}', 'claude-3-7-sonnet'),
('content_creator', 'accuracy', 'civicsense_compliance', 0.87, 0.75, '{"compliant_content": 234, "non_compliant": 35, "borderline": 12}', 'claude-3-7-sonnet'),

-- Efficiency Benchmarks
('system_monitor', 'efficiency', 'auto_resolution_rate', 0.73, 0.60, '{"auto_resolved": 127, "manual_required": 47, "escalated": 12}', 'claude-3-7-sonnet'),
('congressional_specialist', 'efficiency', 'batch_processing_rate', 0.89, 0.70, '{"successful_batches": 89, "failed_batches": 11, "partial_failures": 8}', 'claude-3-7-sonnet');

-- ============================================================================
-- CONVERSATION ANALYSIS PATTERNS
-- ============================================================================

INSERT INTO ai_agent.conversation_analysis (conversation_id, analysis_type, analysis_results, insights_generated, improvement_suggestions, analysis_timestamp, confidence_score) VALUES

-- Template Analysis for Future Learning
(currval('ai_agent.conversations_id_seq'), 'effectiveness_analysis', 
'{"response_quality": 0.89, "user_satisfaction": 0.92, "problem_resolution": 0.86, "efficiency": 0.78}',
'["Users prefer direct action over explanation when issues are critical", "Autonomous resolution increases satisfaction when successful", "Context awareness significantly improves response relevance"]',
'["Implement more granular autonomous decision-making", "Develop better context switching between technical and conversational modes", "Add predictive problem identification"]',
CURRENT_TIMESTAMP, 0.88),

(currval('ai_agent.conversations_id_seq'), 'learning_optimization',
'{"pattern_recognition": 0.91, "adaptation_speed": 0.83, "knowledge_retention": 0.94, "transfer_learning": 0.76}',
'["Congressional sync patterns are highly transferable to other data sync operations", "Error pattern recognition improves significantly with more examples", "User workflow preferences are consistent across similar administrative tasks"]',
'["Create more cross-domain pattern templates", "Implement incremental learning for new error types", "Develop user-specific workflow optimization"]',
CURRENT_TIMESTAMP, 0.85);

-- ============================================================================
-- KNOWLEDGE GRAPH RELATIONSHIPS
-- ============================================================================

-- Create connections between patterns, memory clusters, and templates
UPDATE ai_agent.patterns 
SET related_clusters = ARRAY[
    (SELECT id FROM ai_agent.memory_clusters WHERE cluster_name = 'congressional_photo_processing'),
    (SELECT id FROM ai_agent.memory_clusters WHERE cluster_name = 'system_health_monitoring')
] 
WHERE pattern_category = 'photo_processing';

UPDATE ai_agent.patterns 
SET related_clusters = ARRAY[
    (SELECT id FROM ai_agent.memory_clusters WHERE cluster_name = 'system_health_monitoring'),
    (SELECT id FROM ai_agent.memory_clusters WHERE cluster_name = 'admin_communication_patterns')
] 
WHERE pattern_category = 'system_health';

UPDATE ai_agent.patterns 
SET related_clusters = ARRAY[
    (SELECT id FROM ai_agent.memory_clusters WHERE cluster_name = 'congressional_data_workflows'),
    (SELECT id FROM ai_agent.memory_clusters WHERE cluster_name = 'admin_communication_patterns')
] 
WHERE pattern_category = 'congressional_sync';

-- ============================================================================
-- USAGE STATISTICS INITIALIZATION
-- ============================================================================

-- Initialize usage counters for monitoring system adoption
UPDATE ai_agent.memory_clusters SET usage_count = usage_count + 25 WHERE cluster_name = 'system_health_monitoring';
UPDATE ai_agent.memory_clusters SET usage_count = usage_count + 18 WHERE cluster_name = 'congressional_photo_processing';
UPDATE ai_agent.memory_clusters SET usage_count = usage_count + 15 WHERE cluster_name = 'congressional_data_workflows';
UPDATE ai_agent.memory_clusters SET usage_count = usage_count + 12 WHERE cluster_name = 'admin_communication_patterns';
UPDATE ai_agent.memory_clusters SET usage_count = usage_count + 8 WHERE cluster_name = 'civicsense_content_standards';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify seed data was inserted correctly
DO $$
DECLARE
    conversation_count INTEGER;
    pattern_count INTEGER;
    cluster_count INTEGER;
    template_count INTEGER;
    metric_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conversation_count FROM ai_agent.conversations WHERE conversation_state = 'template';
    SELECT COUNT(*) INTO pattern_count FROM ai_agent.patterns;
    SELECT COUNT(*) INTO cluster_count FROM ai_agent.memory_clusters;
    SELECT COUNT(*) INTO template_count FROM ai_agent.generated_content WHERE generation_type = 'conversation_template';
    SELECT COUNT(*) INTO metric_count FROM ai_agent.performance_metrics;
    
    RAISE NOTICE 'AI Agent Seed Data Summary:';
    RAISE NOTICE '- Conversation Templates: %', conversation_count;
    RAISE NOTICE '- Patterns: %', pattern_count;
    RAISE NOTICE '- Memory Clusters: %', cluster_count;
    RAISE NOTICE '- Response Templates: %', template_count;
    RAISE NOTICE '- Performance Benchmarks: %', metric_count;
    
    IF conversation_count < 4 OR pattern_count < 5 OR cluster_count < 5 THEN
        RAISE WARNING 'Some seed data may not have been inserted correctly. Please review the migration logs.';
    ELSE
        RAISE NOTICE '✅ All seed data successfully inserted!';
    END IF;
END $$; 