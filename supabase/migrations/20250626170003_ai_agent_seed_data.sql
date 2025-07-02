-- AI Agent Conversational Intelligence Seed Data
-- Provides the AI with templates, patterns, and knowledge for better conversations

BEGIN;

-- Core conversation templates for different operational scenarios
INSERT INTO ai_agent.conversations (session_id, agent_type, agent_model, conversation_state, conversation_mode, current_topic, conversation_summary, context_data) VALUES

-- Autonomous System Health Template
('template_health', 'autonomous_monitor', 'claude-3-7-sonnet-20250219', 'template', 'autonomous', 'System Health Monitoring', 
'Autonomous system health monitoring with proactive issue resolution',
'{"capabilities": ["health_monitoring", "auto_healing", "predictive_alerts"], "triggers": ["performance_degradation", "error_spikes"], "response_patterns": ["immediate_action", "escalated_notification"]}'),

-- Congressional Operations Template  
('template_congress', 'congressional_agent', 'claude-3-7-sonnet-20250219', 'template', 'assistant', 'Congressional Data Operations',
'Congressional data synchronization, photo processing, and content management',
'{"workflows": ["member_sync", "photo_processing", "bill_analysis"], "common_issues": ["schema_mismatches", "api_timeouts", "photo_failures"], "automation_level": "high"}'),

-- Diagnostic and Troubleshooting Template
('template_debug', 'diagnostic_agent', 'gpt-4-turbo', 'template', 'assistant', 'System Diagnostics',
'Systematic problem diagnosis and resolution workflows',
'{"methodologies": ["root_cause_analysis", "systematic_elimination"], "tools": ["log_analysis", "database_inspection"], "escalation": ["automated_fixes", "guided_resolution"]}'),

-- Content Generation Template
('template_content', 'content_specialist', 'claude-3-7-sonnet-20250219', 'template', 'assistant', 'CivicSense Content Generation',
'CivicSense-compliant content creation with brand voice standards',
'{"standards": ["uncomfortable_truths", "specific_actors", "actionable_insights"], "content_types": ["quiz_questions", "key_takeaways", "glossary_terms"], "quality_gates": ["fact_verification", "voice_compliance"]}');

-- Learning patterns for different operational areas
INSERT INTO ai_agent.patterns (pattern_type, pattern_category, description, confidence, evidence, triggers, outcomes, metadata, model_version, source) VALUES

-- System Health Pattern
('operational_pattern', 'system_health', 'Autonomous health monitoring with graduated response levels', 0.94,
'[{"metric": "issue_prevention_rate", "value": 0.87}, {"metric": "auto_resolution_success", "value": 0.73}]',
'{"conditions": ["error_rate > 0.02", "memory_usage > 0.85", "response_time > 3000ms"], "auto_trigger": true}',
'{"immediate": ["run_diagnostics", "attempt_auto_fix"], "warning": ["notify_with_context"], "critical": ["emergency_procedures"]}',
'{"automation_level": "high", "human_oversight": "exception_based"}', 'v1.0', 'autonomous_learning'),

-- Congressional Sync Pattern
('workflow_pattern', 'congressional_sync', 'Multi-congress data synchronization with error recovery', 0.91,
'[{"congress_numbers": [117, 118, 119], "success_rate": 0.89}, {"photo_processing": {"success_rate": 0.82}}]',
'{"commands": ["sync congress", "congressional data", "photo processing"], "context": ["data_management"]}',
'{"parallel_processing": true, "error_handling": "graceful_degradation", "optimization": "adaptive_batching"}',
'{"complexity": "high", "dependencies": ["external_apis", "database_schema"]}', 'v1.0', 'workflow_optimization'),

-- Problem Resolution Pattern
('resolution_pattern', 'photo_processing', 'Congressional photo download failure resolution', 0.88,
'[{"schema_issues": {"frequency": 0.34, "resolution_success": 0.92}}, {"api_timeouts": {"frequency": 0.28, "resolution_success": 0.89}}]',
'{"error_keywords": ["congress_number column", "photo processing failed", "schema cache"]}',
'{"schema_migration": "auto_apply_if_safe", "api_retry": "exponential_backoff", "validation": "comprehensive_verification"}',
'{"automation_safe": true, "rollback_available": true}', 'v1.0', 'error_resolution'),

-- Communication Pattern
('communication_pattern', 'user_interaction', 'Adaptive communication based on user preferences', 0.86,
'[{"direct_communication": {"preference": 0.78, "satisfaction": 0.91}}, {"autonomous_action": {"preference": 0.82, "satisfaction": 0.89}}]',
'{"user_commands": ["any"], "interaction_history": true, "task_complexity": ["simple", "moderate", "complex"]}',
'{"response_style": "adaptive", "detail_level": "context_appropriate", "action_bias": "proactive_when_safe"}',
'{"personalization": true, "learning_rate": "moderate"}', 'v1.0', 'user_interaction'),

-- Content Quality Pattern
('quality_pattern', 'content_generation', 'CivicSense content standards compliance', 0.93,
'[{"uncomfortable_truths": {"compliance": 0.89}}, {"specific_actors": {"compliance": 0.91}}, {"actionable_insights": {"compliance": 0.87}}]',
'{"content_type": ["key_takeaways", "glossary_terms", "quiz_questions"], "generation_request": true}',
'{"standards_validation": "automatic", "fact_checking": "required", "voice_compliance": "strict"}',
'{"brand_compliance": "civicsense", "automation_level": "high"}', 'v1.0', 'content_standards');

-- Knowledge clusters for specialized domains
INSERT INTO ai_agent.memory_clusters (cluster_name, cluster_type, description, related_patterns, knowledge_items, confidence_score, usage_count, metadata) VALUES

-- Congressional Photo System Knowledge
('congressional_photo_system', 'technical_knowledge', 'Congressional photo processing system knowledge base',
'["photo_processing", "congressional_sync"]',
'{"schema_requirements": {"congressional_photos": {"congress_number": "INTEGER NOT NULL", "local_path": "TEXT", "original_path": "TEXT"}}, "common_issues": {"schema_mismatch": {"solution": "Run migration to add missing columns"}, "api_timeout": {"solution": "Implement exponential backoff retry"}}, "processing_workflow": ["validate_schema", "check_existing_photos", "batch_download", "verify_storage"]}',
0.92, 156, '{"expertise_level": "expert", "maintenance_priority": "high"}'),

-- System Health Knowledge
('system_health_monitoring', 'operational_knowledge', 'System health monitoring and autonomous healing procedures',
'["system_health", "operational_pattern"]',
'{"health_indicators": {"database": {"thresholds": {"warning": "connections > 80%", "critical": "connections > 95%"}}, "memory": {"thresholds": {"warning": "usage > 85%", "critical": "usage > 95%"}}}, "auto_healing_procedures": {"high_memory": ["trigger_garbage_collection", "clear_caches"], "database_slow": ["optimize_queries", "increase_pool"]}, "monitoring_schedule": {"health_check_frequency": "30_seconds", "deep_diagnostics": "5_minutes"}}',
0.94, 203, '{"automation_level": "high", "reliability_score": 0.96}'),

-- Congressional Operations Knowledge
('congressional_data_operations', 'workflow_knowledge', 'Congressional data synchronization workflows',
'["congressional_sync", "workflow_pattern"]',
'{"data_sources": {"congress_api": {"base_url": "https://api.congress.gov/v3", "rate_limits": "1_request_per_second"}}, "sync_workflows": {"full_sync": {"duration": "2-4_hours", "recommended": "weekly"}, "incremental_sync": {"duration": "15-30_minutes", "recommended": "daily"}}, "congress_support": {"active": [119], "maintenance": [118], "archive": [117, 116, 115]}}',
0.89, 127, '{"complexity": "high", "dependencies": ["external_apis", "database_schema"]}'),

-- Admin Communication Intelligence
('admin_interaction_patterns', 'communication_knowledge', 'Administrative communication patterns and preferences',
'["user_interaction", "communication_pattern"]',
'{"communication_styles": {"direct": {"response_approach": "concise_with_immediate_actions"}, "detailed": {"response_approach": "thorough_with_educational_context"}, "autonomous": {"response_approach": "proactive_with_summary_notifications"}}, "context_adaptation": {"high_pressure": {"adjustments": ["prioritize_immediate_action", "minimize_explanation"]}, "troubleshooting": {"adjustments": ["systematic_approach", "step_by_step_guidance"]}}}',
0.87, 89, '{"personalization_enabled": true, "learning_rate": "continuous"}'),

-- CivicSense Content Mastery
('civicsense_content_mastery', 'content_knowledge', 'CivicSense content standards and generation requirements',
'["content_generation", "quality_pattern"]',
'{"brand_voice_principles": {"truth_over_comfort": {"definition": "Reveal uncomfortable truths about power"}, "clarity_over_politeness": {"definition": "Use active voice and name specific actors"}, "action_over_consumption": {"definition": "Provide actionable civic engagement steps"}}, "content_standards": {"uncomfortable_truths": {"requirement": "must_reveal_hidden_power_dynamics"}, "specific_actors": {"requirement": "name_institutions_and_officials"}, "actionable_insights": {"requirement": "provide_concrete_citizen_actions"}}}',
0.91, 78, '{"brand_compliance": "strict", "quality_gate": "required"}');

-- Response templates for different conversation scenarios
INSERT INTO ai_agent.generated_content (generation_type, source_reference, prompt_template, generation_parameters, generated_content, quality_scores, human_review_status, model_used, metadata) VALUES

-- System Health Good Status
('response_template', 'autonomous_health_good', 'system_status_good',
'{"trigger": "health_check_all_green", "tone": "confident_autonomous"}',
'{"template": "🟢 **System Health: All Clear**\\n\\n**Status**: All systems operating normally\\n**Performance**: {performance_summary}\\n**Recent Actions**: {autonomous_actions}\\n**Next Check**: {next_check_time}\\n\\nI will continue monitoring autonomously and alert you if anything needs attention.", "variables": ["performance_summary", "autonomous_actions", "next_check_time"]}',
'{"relevance": 0.94, "clarity": 0.92, "helpfulness": 0.89}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "autonomous_status", "automation_level": "high"}'),

-- System Health Warning
('response_template', 'autonomous_health_warning', 'system_status_warning',
'{"trigger": "health_check_warning", "tone": "alert_but_controlled"}',
'{"template": "🟡 **System Alert: {issue_type} Detected**\\n\\n**Issue**: {issue_description}\\n**Impact**: {impact_assessment}\\n**My Actions**: {auto_actions_taken}\\n**Your Options**: {user_action_options}\\n\\nShould I proceed with automatic resolution or would you prefer manual control?", "variables": ["issue_type", "issue_description", "impact_assessment", "auto_actions_taken", "user_action_options"]}',
'{"relevance": 0.96, "clarity": 0.94, "helpfulness": 0.93}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "warning_with_options", "user_choice": "required"}'),

-- Congressional Sync Progress
('response_template', 'congressional_sync_progress', 'sync_progress',
'{"trigger": "sync_in_progress", "tone": "informative_technical"}',
'{"template": "📊 **Congressional Sync: {operation_name}**\\n\\n**Progress**: {progress_bar} {percentage}% ({completed}/{total})\\n**Current Task**: {current_operation}\\n**Performance**: {processing_stats}\\n**Issues**: {issues_summary}\\n**ETA**: {estimated_completion}\\n\\nContinuing processing... I will update you on significant changes.", "variables": ["operation_name", "progress_bar", "percentage", "completed", "total", "current_operation", "processing_stats", "issues_summary", "estimated_completion"]}',
'{"relevance": 0.91, "clarity": 0.93, "helpfulness": 0.88}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "progress_tracking", "domain": "congressional_ops"}'),

-- Problem Resolution Guide
('response_template', 'problem_resolution_guided', 'step_by_step_resolution',
'{"trigger": "error_requiring_guidance", "tone": "helpful_technical"}',
'{"template": "🔧 **Problem Resolution: {problem_type}**\\n\\n**What Happened**: {problem_explanation}\\n**Root Cause**: {root_cause_analysis}\\n**Solution Strategy**: {solution_approach}\\n\\n**Step-by-Step Fix**:\\n{resolution_steps}\\n\\n**Verification**: {verification_steps}\\n\\nWould you like me to execute these steps automatically or guide you through manual resolution?", "variables": ["problem_type", "problem_explanation", "root_cause_analysis", "solution_approach", "resolution_steps", "verification_steps"]}',
'{"relevance": 0.93, "clarity": 0.95, "helpfulness": 0.94}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "guided_resolution", "automation_available": true}'),

-- Content Generation Complete
('response_template', 'content_generation_complete', 'content_delivery',
'{"trigger": "content_generation_finished", "tone": "professional_summary"}',
'{"template": "✨ **Content Generation Complete**\\n\\n**Generated**: {content_summary}\\n**Quality Scores**: {quality_breakdown}\\n**CivicSense Compliance**: {standards_compliance}\\n**Sources Used**: {source_verification}\\n\\n**Highlights**: {content_highlights}\\n\\nContent is ready for review and publication. Would you like me to schedule it or make any adjustments?", "variables": ["content_summary", "quality_breakdown", "standards_compliance", "source_verification", "content_highlights"]}',
'{"relevance": 0.90, "clarity": 0.89, "helpfulness": 0.92}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "completion_summary", "domain": "content_ops"});

-- Performance benchmarks for continuous improvement
INSERT INTO ai_agent.performance_metrics (agent_type, metric_type, metric_name, metric_value, benchmark_value, context, model_version, metadata) VALUES

-- Response Time Benchmarks
('autonomous_monitor', 'response_time', 'health_check_analysis', 1.2, 2.0, '{"operation_complexity": "standard", "data_points_analyzed": 15}', 'claude-3-7-sonnet-20250219', '{"optimization_target": 1.0}'),
('congressional_agent', 'response_time', 'sync_command_parsing', 0.8, 1.5, '{"command_complexity": "multi_parameter", "context_awareness": true}', 'claude-3-7-sonnet-20250219', '{"optimization_target": 0.6}'),
('diagnostic_agent', 'response_time', 'error_root_cause_analysis', 2.1, 3.0, '{"error_complexity": "multi_system", "diagnostic_depth": "comprehensive"}', 'gpt-4-turbo', '{"optimization_target": 1.8}'),

-- Accuracy Metrics
('autonomous_monitor', 'accuracy', 'issue_detection_precision', 0.94, 0.85, '{"true_positives": 156, "false_positives": 8, "false_negatives": 4}', 'claude-3-7-sonnet-20250219', '{"target_precision": 0.95}'),
('congressional_agent', 'accuracy', 'schema_issue_identification', 0.91, 0.80, '{"correct_diagnoses": 78, "missed_issues": 7, "false_alarms": 3}', 'claude-3-7-sonnet-20250219', '{"improvement_trend": "positive"}'),
('content_specialist', 'accuracy', 'civicsense_standards_compliance', 0.87, 0.75, '{"compliant_generations": 234, "non_compliant": 35, "borderline_cases": 12}', 'claude-3-7-sonnet-20250219', '{"target_compliance": 0.92}'),

-- Efficiency Benchmarks
('autonomous_monitor', 'efficiency', 'autonomous_resolution_rate', 0.73, 0.60, '{"auto_resolved": 127, "manual_escalation": 47, "failed_attempts": 12}', 'claude-3-7-sonnet-20250219', '{"target_rate": 0.80}'),
('congressional_agent', 'efficiency', 'batch_processing_optimization', 0.89, 0.70, '{"successful_batches": 89, "partial_failures": 8, "complete_failures": 3}', 'claude-3-7-sonnet-20250219', '{"optimization_opportunities": ["retry_logic", "batch_sizing"]}'),

-- User Satisfaction
('all_agents', 'satisfaction', 'user_interaction_quality', 0.91, 0.80, '{"positive_feedback": 145, "neutral": 23, "negative": 8}', 'claude-3-7-sonnet-20250219', '{"satisfaction_drivers": ["response_speed", "accuracy", "proactive_help"]});

-- Learning analysis for pattern improvement
INSERT INTO ai_agent.conversation_analysis (conversation_id, analysis_type, analysis_results, insights_generated, improvement_suggestions, analysis_timestamp, confidence_score, metadata) VALUES

-- Health Monitoring Analysis
((SELECT id FROM ai_agent.conversations WHERE session_id = 'template_health'), 'effectiveness_pattern',
'{"response_relevance": 0.92, "user_satisfaction": 0.89, "problem_resolution_rate": 0.86}',
'["Autonomous actions increase satisfaction when clearly communicated", "Users prefer immediate status over detailed explanations during critical issues", "Preventive alerts reduce emergency escalations by 34%"]',
'["Enhance communication of autonomous actions with more context", "Develop urgency-aware response adaptation", "Implement predictive issue identification"]',
CURRENT_TIMESTAMP, 0.88, '{"learning_priority": "high", "actionable_insights": 3}'),

-- Congressional Workflow Analysis
((SELECT id FROM ai_agent.conversations WHERE session_id = 'template_congress'), 'workflow_optimization',
'{"task_completion_rate": 0.91, "error_recovery_success": 0.87, "user_guidance_effectiveness": 0.93}',
'["Congressional sync workflows benefit from parallel processing", "Photo processing errors are predictable and automatically recoverable", "Users prefer progress updates during long-running operations"]',
'["Implement more granular progress tracking", "Enhance automatic error recovery for photo processing", "Add workflow customization based on user preferences"]',
CURRENT_TIMESTAMP, 0.85, '{"workflow_domain": "congressional_ops", "optimization_potential": "high"}'),

-- Content Quality Analysis
((SELECT id FROM ai_agent.conversations WHERE session_id = 'template_content'), 'content_quality_analysis',
'{"standards_compliance": 0.87, "generation_efficiency": 0.82, "user_acceptance": 0.89, "revision_requirements": 0.23}',
'["CivicSense voice compliance improves with specific actor identification", "Uncomfortable truths resonate when supported by concrete examples", "Action items effectiveness correlates with specificity and timeliness"]',
'["Enhance specific actor database for better name recognition", "Develop uncomfortable truth validation pipeline", "Implement action item feasibility scoring"]',
CURRENT_TIMESTAMP, 0.83, '{"content_domain": "civicsense", "brand_alignment": "high"});

-- Summary notification
DO $$
DECLARE
    template_count INTEGER;
    pattern_count INTEGER;
    cluster_count INTEGER;
    response_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM ai_agent.conversations WHERE conversation_state = 'template';
    SELECT COUNT(*) INTO pattern_count FROM ai_agent.patterns;
    SELECT COUNT(*) INTO cluster_count FROM ai_agent.memory_clusters;
    SELECT COUNT(*) INTO response_count FROM ai_agent.generated_content WHERE generation_type = 'response_template';
    
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'AI AGENT SEED DATA INSTALLATION COMPLETE';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Conversation Templates: %', template_count;
    RAISE NOTICE 'Learning Patterns: %', pattern_count;
    RAISE NOTICE 'Knowledge Clusters: %', cluster_count;
    RAISE NOTICE 'Response Templates: %', response_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Your AI agent now has comprehensive conversational';
    RAISE NOTICE 'intelligence and can handle complex administrative';
    RAISE NOTICE 'workflows with context awareness and learning.';
    RAISE NOTICE '=================================================';
END $$;

COMMIT; 