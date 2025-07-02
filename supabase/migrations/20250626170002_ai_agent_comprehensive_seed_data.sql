-- ============================================================================
-- AI AGENT COMPREHENSIVE SEED DATA MIGRATION
-- ============================================================================
-- Populates the ai_agent schema with conversational intelligence and knowledge base

BEGIN;

-- ============================================================================
-- CONVERSATION TEMPLATES FOR DIFFERENT SCENARIOS
-- ============================================================================

INSERT INTO ai_agent.conversations (session_id, agent_type, agent_model, conversation_state, conversation_mode, current_topic, conversation_summary, context_data) VALUES

-- System Health Template
('template_system_health', 'autonomous_monitor', 'claude-3-7-sonnet-20250219', 'template', 'autonomous', 'System Health & Monitoring', 'Autonomous system health monitoring with proactive issue resolution',
'{"type": "template", "domain": "system_operations", "capabilities": ["health_monitoring", "auto_healing", "predictive_alerts"], "triggers": ["performance_degradation", "error_spikes", "resource_exhaustion"], "response_patterns": ["immediate_action", "escalated_notification", "preventive_measures"]}'),

-- Congressional Data Template  
('template_congressional', 'congressional_agent', 'claude-3-7-sonnet-20250219', 'template', 'assistant', 'Congressional Data Management', 'Specialized agent for congressional data synchronization and photo processing',
'{"type": "template", "domain": "congressional_operations", "data_sources": ["congress_api", "govinfo_api"], "workflows": ["member_sync", "photo_processing", "bill_analysis", "hearing_extraction"], "common_issues": ["schema_mismatches", "api_timeouts", "photo_failures", "rate_limiting"]}'),

-- Debugging Template
('template_debugging', 'diagnostic_agent', 'gpt-4-turbo', 'template', 'assistant', 'System Diagnostics & Troubleshooting', 'Systematic debugging and problem resolution workflows',
'{"type": "template", "domain": "technical_support", "methodologies": ["root_cause_analysis", "systematic_elimination", "performance_profiling"], "tools": ["log_analysis", "database_inspection", "api_testing"], "escalation": ["automated_fixes", "guided_resolution", "manual_intervention"]}'),

-- Content Generation Template
('template_content', 'content_specialist', 'claude-3-7-sonnet-20250219', 'template', 'assistant', 'AI Content Generation', 'CivicSense-compliant content creation and optimization',
'{"type": "template", "domain": "content_operations", "standards": ["civicsense_voice", "uncomfortable_truths", "specific_actors", "actionable_insights"], "content_types": ["quiz_questions", "key_takeaways", "glossary_terms", "civic_events"], "quality_gates": ["fact_verification", "source_validation", "voice_compliance"]}');

-- ============================================================================
-- KNOWLEDGE PATTERNS FOR LEARNING AND ADAPTATION
-- ============================================================================

INSERT INTO ai_agent.patterns (pattern_type, pattern_category, description, confidence, evidence, triggers, outcomes, metadata, model_version, source) VALUES

-- System Health Patterns
('operational_pattern', 'system_health', 'Autonomous health monitoring with graduated response levels based on severity', 0.94,
'[{"metric": "issue_prevention_rate", "value": 0.87, "sample_size": 234}, {"metric": "auto_resolution_success", "value": 0.73, "sample_size": 127}, {"metric": "false_positive_rate", "value": 0.08, "sample_size": 89}]',
'{"conditions": ["error_rate > 0.02", "memory_usage > 0.85", "response_time > 3000ms"], "frequency": "continuous", "auto_trigger": true}',
'{"immediate": ["run_diagnostics", "attempt_auto_fix"], "warning": ["notify_with_context", "suggest_actions"], "critical": ["emergency_procedures", "escalate_immediately"]}',
'{"domain": "system_operations", "automation_level": "high", "human_oversight": "exception_based", "learning_enabled": true}',
'v1.0', 'autonomous_learning'),

-- Congressional Sync Patterns
('workflow_pattern', 'congressional_sync', 'Multi-congress data synchronization with error recovery and optimization', 0.91,
'[{"congress_numbers": [117, 118, 119], "success_rate": 0.89, "parallel_efficiency": 0.73}, {"photo_processing": {"success_rate": 0.82, "common_failures": ["schema_mismatch", "api_timeout"]}}]',
'{"commands": ["sync congress", "congressional data", "photo processing"], "context": ["data_management", "administrative_tasks"]}',
'{"parallel_processing": true, "error_handling": "graceful_degradation", "progress_tracking": "real_time", "optimization": "adaptive_batching"}',
'{"domain": "data_operations", "complexity": "high", "dependencies": ["external_apis", "database_schema"], "monitoring": "comprehensive"}',
'v1.0', 'workflow_optimization'),

-- Problem Resolution Patterns
('resolution_pattern', 'photo_processing', 'Congressional photo download failure diagnosis and automatic resolution', 0.88,
'[{"schema_issues": {"frequency": 0.34, "resolution_success": 0.92}, "api_timeouts": {"frequency": 0.28, "resolution_success": 0.89}, "storage_issues": {"frequency": 0.15, "resolution_success": 0.95}}]',
'{"error_keywords": ["congress_number column", "photo processing failed", "schema cache"], "context": "congressional_operations"}',
'{"schema_migration": "auto_apply_if_safe", "api_retry": "exponential_backoff", "storage_cleanup": "automatic", "validation": "comprehensive_verification"}',
'{"domain": "error_recovery", "automation_safe": true, "rollback_available": true, "user_notification": "on_completion"}',
'v1.0', 'error_resolution'),

-- Communication Patterns
('communication_pattern', 'user_interaction', 'Adaptive communication based on user preferences and context', 0.86,
'[{"direct_communication": {"preference": 0.78, "satisfaction": 0.91}, "detailed_explanations": {"preference": 0.65, "satisfaction": 0.87}, "autonomous_action": {"preference": 0.82, "satisfaction": 0.89}}]',
'{"user_commands": ["any"], "interaction_history": true, "task_complexity": ["simple", "moderate", "complex"]}',
'{"response_style": "adaptive", "detail_level": "context_appropriate", "action_bias": "proactive_when_safe", "escalation": "transparent"}',
'{"domain": "user_experience", "personalization": true, "learning_rate": "moderate", "privacy_preserving": true}',
'v1.0', 'user_interaction'),

-- Content Quality Patterns
('quality_pattern', 'content_generation', 'CivicSense content standards compliance and quality assurance', 0.93,
'[{"uncomfortable_truths": {"compliance": 0.89, "impact_score": 0.92}, {"specific_actors": {"compliance": 0.91, "clarity_score": 0.88}, {"actionable_insights": {"compliance": 0.87, "usefulness": 0.94}}]',
'{"content_type": ["key_takeaways", "glossary_terms", "quiz_questions"], "generation_request": true}',
'{"standards_validation": "automatic", "fact_checking": "required", "source_verification": "comprehensive", "voice_compliance": "strict"}',
'{"domain": "content_quality", "brand_compliance": "civicsense", "automation_level": "high", "human_review": "quality_gate"}',
'v1.0', 'content_standards');

-- ============================================================================
-- MEMORY CLUSTERS (COMPREHENSIVE KNOWLEDGE BASE)
-- ============================================================================

INSERT INTO ai_agent.memory_clusters (cluster_name, cluster_type, description, related_patterns, knowledge_items, confidence_score, usage_count, metadata) VALUES

-- Technical Operations Knowledge
('congressional_photo_system', 'technical_knowledge', 'Complete knowledge base for congressional photo processing system including schemas, APIs, and troubleshooting',
'["photo_processing", "congressional_sync"]',
'{"schema_requirements": {"congressional_photos": {"congress_number": "INTEGER NOT NULL", "local_path": "TEXT", "original_path": "TEXT", "bioguide_id": "VARCHAR NOT NULL", "photo_url": "TEXT"}}, "api_endpoints": {"congress_gov": "https://api.congress.gov/v3/member/{bioguideId}", "image_urls": "https://www.congress.gov/img/member/{bioguideId}_200.jpg"}, "common_issues": {"schema_mismatch": {"cause": "Missing congress_number column", "solution": "Run migration to add column", "prevention": "Schema validation before processing"}, "api_timeout": {"cause": "Network latency or rate limiting", "solution": "Implement exponential backoff retry", "prevention": "Request throttling and connection pooling"}, "storage_failure": {"cause": "Disk space or permissions", "solution": "Check filesystem and permissions", "prevention": "Monitor disk usage and validate permissions"}}, "processing_workflow": ["validate_schema", "check_existing_photos", "batch_download_requests", "process_with_retry", "verify_storage", "update_database"], "performance_optimizations": {"batch_size": 50, "concurrent_requests": 5, "retry_max_attempts": 3, "timeout_seconds": 30}}',
0.92, 156, '{"last_updated": "2025-01-26", "expertise_level": "expert", "maintenance_priority": "high"}'),

-- System Operations Knowledge
('system_health_monitoring', 'operational_knowledge', 'Comprehensive system health monitoring, diagnostics, and autonomous healing procedures',
'["system_health", "operational_pattern"]',
'{"health_indicators": {"database": {"metrics": ["connection_count", "query_performance", "lock_waits", "replication_lag"], "thresholds": {"warning": "connections > 80%", "critical": "connections > 95% OR query_time > 5s"}}, "memory": {"metrics": ["heap_usage", "gc_frequency", "cache_hit_ratio"], "thresholds": {"warning": "usage > 85%", "critical": "usage > 95%"}}, "application": {"metrics": ["error_rate", "response_time", "throughput"], "thresholds": {"warning": "error_rate > 2%", "critical": "error_rate > 10%"}}, "storage": {"metrics": ["disk_usage", "io_wait", "read_write_latency"], "thresholds": {"warning": "usage > 80%", "critical": "usage > 90%"}}}, "auto_healing_procedures": {"high_memory": ["trigger_garbage_collection", "clear_non_essential_caches", "scale_if_available"], "database_slow": ["optimize_active_queries", "increase_connection_pool", "enable_query_cache"], "high_error_rate": ["activate_circuit_breaker", "switch_to_fallback_mode", "investigate_root_cause"], "storage_full": ["cleanup_temp_files", "archive_old_logs", "alert_for_manual_intervention"]}, "monitoring_schedule": {"health_check_frequency": "30_seconds", "deep_diagnostics": "5_minutes", "trend_analysis": "1_hour", "predictive_alerts": "daily"}}',
0.94, 203, '{"last_updated": "2025-01-26", "automation_level": "high", "reliability_score": 0.96}'),

-- Congressional Data Workflows
('congressional_data_operations', 'workflow_knowledge', 'End-to-end congressional data synchronization workflows across multiple congresses',
'["congressional_sync", "workflow_pattern"]',
'{"data_sources": {"congress_api": {"base_url": "https://api.congress.gov/v3", "endpoints": ["member", "bill", "committee", "nomination"], "rate_limits": "1_request_per_second", "authentication": "api_key_required"}, "govinfo_api": {"base_url": "https://api.govinfo.gov", "endpoints": ["packages", "collections", "summary"], "rate_limits": "1000_requests_per_hour", "authentication": "api_key_required"}}, "sync_workflows": {"full_sync": {"steps": ["validate_apis", "sync_members", "process_photos", "sync_bills", "sync_hearings", "generate_content"], "duration": "2-4_hours", "recommended": "weekly"}, "incremental_sync": {"steps": ["check_updates", "sync_changed_records", "update_photos", "refresh_content"], "duration": "15-30_minutes", "recommended": "daily"}, "emergency_sync": {"steps": ["health_check", "target_specific_issue", "minimal_processing", "verify_fix"], "duration": "5-15_minutes", "use_case": "critical_fixes"}}, "congress_support": {"active": [119], "maintenance": [118], "archive": [117, 116, 115]}, "error_handling": {"api_failures": "retry_with_backoff", "data_corruption": "rollback_and_resync", "partial_failures": "continue_and_report", "rate_limiting": "adaptive_throttling"}}',
0.89, 127, '{"last_updated": "2025-01-26", "complexity": "high", "dependencies": ["external_apis", "database_schema"]}'),

-- Communication Intelligence
('admin_interaction_patterns', 'communication_knowledge', 'Patterns for effective communication with administrators including preferences and context adaptation',
'["user_interaction", "communication_pattern"]',
'{"communication_styles": {"direct": {"characteristics": ["minimal_fluff", "action_oriented", "clear_outcomes"], "indicators": ["quick_commands", "status_requests", "problem_reports"], "response_approach": "concise_with_immediate_actions"}, "detailed": {"characteristics": ["comprehensive_explanations", "context_seeking", "learning_oriented"], "indicators": ["why_questions", "how_questions", "background_requests"], "response_approach": "thorough_with_educational_context"}, "autonomous": {"characteristics": ["hands_off_preference", "result_oriented", "efficiency_focused"], "indicators": ["set_and_forget", "status_only", "exception_reporting"], "response_approach": "proactive_with_summary_notifications"}}, "context_adaptation": {"high_pressure": {"indicators": ["urgent_language", "repeated_requests", "time_constraints"], "adjustments": ["prioritize_immediate_action", "minimize_explanation", "provide_eta"]}, "learning_mode": {"indicators": ["exploratory_questions", "tangential_discussions", "tool_discovery"], "adjustments": ["provide_examples", "suggest_alternatives", "educational_context"]}, "troubleshooting": {"indicators": ["error_reports", "system_issues", "help_requests"], "adjustments": ["systematic_approach", "clear_diagnostics", "step_by_step_guidance"]}}, "escalation_triggers": {"frustration_signals": ["repeated_failures", "strong_negative_language", "escalating_urgency"], "complexity_thresholds": ["multi_system_issues", "data_integrity_concerns", "security_implications"], "response_strategies": ["acknowledge_frustration", "provide_clear_timeline", "offer_manual_alternatives"]}}',
0.87, 89, '{"last_updated": "2025-01-26", "personalization_enabled": true, "learning_rate": "continuous"}'),

-- Content Generation Intelligence
('civicsense_content_mastery', 'content_knowledge', 'Deep knowledge of CivicSense content standards, voice, and generation requirements',
'["content_generation", "quality_pattern"]',
'{"brand_voice_principles": {"truth_over_comfort": {"definition": "Reveal uncomfortable truths politicians dont want people to know", "implementation": "expose_hidden_power_dynamics", "examples": ["regulatory_capture", "corporate_influence", "electoral_manipulation"]}, "clarity_over_politeness": {"definition": "Use active voice and name specific actors", "implementation": "no_passive_voice_or_vague_references", "examples": ["CEO_John_Smith_decided vs decisions_were_made", "Congress_voted vs lawmakers_acted"]}, "action_over_consumption": {"definition": "Provide actionable insights for civic engagement", "implementation": "specific_next_steps_with_contacts", "examples": ["call_representative_at_phone", "attend_meeting_at_address", "file_foia_request_with_template"]}}, "content_standards": {"uncomfortable_truths": {"requirement": "must_reveal_hidden_power_dynamics", "validation": "check_for_power_analysis", "examples": ["regulatory_capture_mechanisms", "campaign_finance_influence", "revolving_door_patterns"]}, "specific_actors": {"requirement": "name_institutions_and_officials", "validation": "no_vague_government_references", "examples": ["Senator_Jane_Doe vs lawmakers", "EPA_Administrator vs officials", "Goldman_Sachs vs financial_institutions"]}, "actionable_insights": {"requirement": "provide_concrete_citizen_actions", "validation": "include_contact_info_and_timing", "examples": ["call_202_555_0123_before_friday", "attend_city_council_tuesday_7pm", "submit_comment_by_deadline"]}}, "quality_thresholds": {"minimum_score": 70, "source_requirements": "minimum_2_primary_sources", "fact_checking": "100_percent_verifiable", "voice_compliance": "all_principles_must_be_met"}, "generation_workflows": {"research_phase": ["identify_power_dynamics", "find_specific_actors", "gather_primary_sources"], "drafting_phase": ["apply_voice_principles", "include_action_items", "verify_facts"], "review_phase": ["standards_compliance_check", "fact_verification", "user_impact_assessment"]}}',
0.91, 78, '{"last_updated": "2025-01-26", "brand_compliance": "strict", "quality_gate": "required"}');

-- ============================================================================
-- CONVERSATION RESPONSE TEMPLATES
-- ============================================================================

INSERT INTO ai_agent.generated_content (generation_type, source_reference, prompt_template, generation_parameters, generated_content, quality_scores, human_review_status, model_used, metadata) VALUES

-- System Health Response Templates
('response_template', 'autonomous_health_good', 'system_status_autonomous_good',
'{"trigger": "health_check_all_green", "tone": "confident_autonomous", "detail_level": "summary"}',
'{"template": "🟢 **System Health: All Clear**\n\n**Status**: All systems operating normally\n**Performance**: {performance_summary}\n**Recent Actions**: {autonomous_actions}\n**Next Check**: {next_check_time}\n\nI''ll continue monitoring autonomously and alert you if anything needs attention.", "variables": ["performance_summary", "autonomous_actions", "next_check_time"], "contexts": ["routine_check", "post_maintenance", "user_request"]}',
'{"relevance": 0.94, "clarity": 0.92, "helpfulness": 0.89}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "autonomous_status", "automation_level": "high", "user_interaction": "minimal"}'),

('response_template', 'autonomous_health_warning', 'system_status_autonomous_warning', 
'{"trigger": "health_check_warning", "tone": "alert_but_controlled", "detail_level": "actionable"}',
'{"template": "🟡 **System Alert: {issue_type} Detected**\n\n**Issue**: {issue_description}\n**Impact**: {impact_assessment}\n**My Actions**: {auto_actions_taken}\n**Your Options**: {user_action_options}\n**Monitoring**: {continued_monitoring}\n\nShould I proceed with automatic resolution or would you prefer manual control?", "variables": ["issue_type", "issue_description", "impact_assessment", "auto_actions_taken", "user_action_options", "continued_monitoring"], "interaction_options": ["auto_proceed", "manual_control", "explain_more"]}',
'{"relevance": 0.96, "clarity": 0.94, "helpfulness": 0.93}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "warning_with_options", "urgency": "medium", "user_choice": "required"}'),

-- Congressional Operations Templates
('response_template', 'congressional_sync_progress', 'sync_operation_progress',
'{"trigger": "sync_in_progress", "tone": "informative_technical", "detail_level": "comprehensive"}',
'{"template": "📊 **Congressional Sync: {operation_name}**\n\n**Progress**: {progress_bar} {percentage}% ({completed}/{total})\n**Current Task**: {current_operation}\n**Performance**: {processing_stats}\n**Issues**: {issues_summary}\n**ETA**: {estimated_completion}\n\n**Details**: {detailed_breakdown}\n\nContinuing processing... I''ll update you on significant changes.", "variables": ["operation_name", "progress_bar", "percentage", "completed", "total", "current_operation", "processing_stats", "issues_summary", "estimated_completion", "detailed_breakdown"], "update_frequency": "significant_progress_or_issues"}',
'{"relevance": 0.91, "clarity": 0.93, "helpfulness": 0.88}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "progress_tracking", "domain": "congressional_ops", "real_time": true}'),

-- Problem Resolution Templates
('response_template', 'problem_resolution_guided', 'step_by_step_resolution',
'{"trigger": "error_requiring_guidance", "tone": "helpful_technical", "detail_level": "step_by_step"}',
'{"template": "🔧 **Problem Resolution: {problem_type}**\n\n**What Happened**: {problem_explanation}\n**Root Cause**: {root_cause_analysis}\n**Solution Strategy**: {solution_approach}\n\n**Step-by-Step Fix**:\n{resolution_steps}\n\n**Verification**: {verification_steps}\n**Prevention**: {prevention_measures}\n\nWould you like me to execute these steps automatically or guide you through manual resolution?", "variables": ["problem_type", "problem_explanation", "root_cause_analysis", "solution_approach", "resolution_steps", "verification_steps", "prevention_measures"], "execution_options": ["auto_execute", "guided_manual", "explain_details"]}',
'{"relevance": 0.93, "clarity": 0.95, "helpfulness": 0.94}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "guided_resolution", "complexity": "medium", "automation_available": true}'),

-- Content Generation Templates
('response_template', 'content_generation_complete', 'content_delivery_summary',
'{"trigger": "content_generation_finished", "tone": "professional_summary", "detail_level": "results_focused"}',
'{"template": "✨ **Content Generation Complete**\n\n**Generated**: {content_summary}\n**Quality Scores**: {quality_breakdown}\n**CivicSense Compliance**: {standards_compliance}\n**Sources Used**: {source_verification}\n\n**Highlights**: {content_highlights}\n**Recommendations**: {usage_recommendations}\n\nContent is ready for review and publication. Would you like me to schedule it or make any adjustments?", "variables": ["content_summary", "quality_breakdown", "standards_compliance", "source_verification", "content_highlights", "usage_recommendations"], "next_actions": ["schedule_content", "request_changes", "approve_and_publish"]}',
'{"relevance": 0.90, "clarity": 0.89, "helpfulness": 0.92}', 'approved', 'claude-3-7-sonnet-20250219',
'{"template_type": "completion_summary", "domain": "content_ops", "quality_gate": "included"}');

-- ============================================================================
-- PERFORMANCE BASELINES AND BENCHMARKS
-- ============================================================================

INSERT INTO ai_agent.performance_metrics (agent_type, metric_type, metric_name, metric_value, benchmark_value, context, model_version, metadata) VALUES

-- Response Performance
('autonomous_monitor', 'response_time', 'health_check_analysis', 1.2, 2.0, '{"operation_complexity": "standard", "data_points_analyzed": 15, "actions_considered": 8}', 'claude-3-7-sonnet-20250219', '{"optimization_target": 1.0, "current_trend": "improving"}'),
('congressional_agent', 'response_time', 'sync_command_parsing', 0.8, 1.5, '{"command_complexity": "multi_parameter", "context_awareness": true, "workflow_selection": "automatic"}', 'claude-3-7-sonnet-20250219', '{"optimization_target": 0.6, "bottlenecks": ["context_loading"]}'),
('diagnostic_agent', 'response_time', 'error_root_cause_analysis', 2.1, 3.0, '{"error_complexity": "multi_system", "diagnostic_depth": "comprehensive", "solution_generation": true}', 'gpt-4-turbo', '{"optimization_target": 1.8, "accuracy_priority": "high"}'),

-- Accuracy Metrics
('autonomous_monitor', 'accuracy', 'issue_detection_precision', 0.94, 0.85, '{"true_positives": 156, "false_positives": 8, "false_negatives": 4, "total_evaluations": 168}', 'claude-3-7-sonnet-20250219', '{"target_precision": 0.95, "critical_threshold": 0.90}'),
('congressional_agent', 'accuracy', 'schema_issue_identification', 0.91, 0.80, '{"correct_diagnoses": 78, "missed_issues": 7, "false_alarms": 3, "schema_versions": 12}', 'claude-3-7-sonnet-20250219', '{"improvement_trend": "positive", "focus_area": "edge_cases"}'),
('content_specialist', 'accuracy', 'civicsense_standards_compliance', 0.87, 0.75, '{"compliant_generations": 234, "non_compliant": 35, "borderline_cases": 12, "standards_checked": 8}', 'claude-3-7-sonnet-20250219', '{"target_compliance": 0.92, "training_focus": "uncomfortable_truths"}'),

-- Efficiency Benchmarks
('autonomous_monitor', 'efficiency', 'autonomous_resolution_rate', 0.73, 0.60, '{"auto_resolved": 127, "manual_escalation": 47, "failed_attempts": 12, "resolution_types": 15}', 'claude-3-7-sonnet-20250219', '{"target_rate": 0.80, "safe_automation_boundary": 0.85}'),
('congressional_agent', 'efficiency', 'batch_processing_optimization', 0.89, 0.70, '{"successful_batches": 89, "partial_failures": 8, "complete_failures": 3, "average_batch_size": 150}', 'claude-3-7-sonnet-20250219', '{"optimization_opportunities": ["retry_logic", "batch_sizing"]}'),

-- User Satisfaction
('all_agents', 'satisfaction', 'user_interaction_quality', 0.91, 0.80, '{"positive_feedback": 145, "neutral": 23, "negative": 8, "total_interactions": 176}', 'claude-3-7-sonnet-20250219', '{"satisfaction_drivers": ["response_speed", "accuracy", "proactive_help"]}');

-- ============================================================================
-- LEARNING AND ADAPTATION PATTERNS
-- ============================================================================

INSERT INTO ai_agent.conversation_analysis (conversation_id, analysis_type, analysis_results, insights_generated, improvement_suggestions, analysis_timestamp, confidence_score, metadata) VALUES

-- Create sample analysis entries for learning
((SELECT id FROM ai_agent.conversations WHERE session_id = 'template_system_health'), 'effectiveness_pattern',
'{"response_relevance": 0.92, "user_satisfaction": 0.89, "problem_resolution_rate": 0.86, "interaction_efficiency": 0.84}',
'["Autonomous actions increase satisfaction when clearly communicated", "Users prefer immediate status over detailed explanations during critical issues", "Preventive alerts reduce emergency escalations by 34%"]',
'["Enhance communication of autonomous actions with more context", "Develop urgency-aware response adaptation", "Implement predictive issue identification"]',
CURRENT_TIMESTAMP, 0.88, '{"learning_priority": "high", "actionable_insights": 3}'),

((SELECT id FROM ai_agent.conversations WHERE session_id = 'template_congressional'), 'workflow_optimization',
'{"task_completion_rate": 0.91, "error_recovery_success": 0.87, "user_guidance_effectiveness": 0.93, "automation_acceptance": 0.78}',
'["Congressional sync workflows benefit from parallel processing", "Photo processing errors are predictable and automatically recoverable", "Users prefer progress updates during long-running operations"]',
'["Implement more granular progress tracking", "Enhance automatic error recovery for photo processing", "Add workflow customization based on user preferences"]',
CURRENT_TIMESTAMP, 0.85, '{"workflow_domain": "congressional_ops", "optimization_potential": "high"}'),

((SELECT id FROM ai_agent.conversations WHERE session_id = 'template_content'), 'content_quality_analysis',
'{"standards_compliance": 0.87, "generation_efficiency": 0.82, "user_acceptance": 0.89, "revision_requirements": 0.23}',
'["CivicSense voice compliance improves with specific actor identification", "Uncomfortable truths resonate when supported by concrete examples", "Action items effectiveness correlates with specificity and timeliness"]',
'["Enhance specific actor database for better name recognition", "Develop uncomfortable truth validation pipeline", "Implement action item feasibility scoring"]',
CURRENT_TIMESTAMP, 0.83, '{"content_domain": "civicsense", "brand_alignment": "high"});

-- ============================================================================
-- FINAL VALIDATION AND SUMMARY
-- ============================================================================

-- Verify all seed data was inserted correctly
DO $$
DECLARE
    conversation_count INTEGER;
    pattern_count INTEGER;
    cluster_count INTEGER;
    template_count INTEGER;
    metric_count INTEGER;
    analysis_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conversation_count FROM ai_agent.conversations WHERE conversation_state = 'template';
    SELECT COUNT(*) INTO pattern_count FROM ai_agent.patterns;
    SELECT COUNT(*) INTO cluster_count FROM ai_agent.memory_clusters;
    SELECT COUNT(*) INTO template_count FROM ai_agent.generated_content WHERE generation_type = 'response_template';
    SELECT COUNT(*) INTO metric_count FROM ai_agent.performance_metrics;
    SELECT COUNT(*) INTO analysis_count FROM ai_agent.conversation_analysis;
    
    RAISE NOTICE '========================================================================================';
    RAISE NOTICE 'AI AGENT COMPREHENSIVE SEED DATA - INSTALLATION COMPLETE';
    RAISE NOTICE '========================================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'CONVERSATION INTELLIGENCE:';
    RAISE NOTICE '  • Conversation Templates: % (System Health, Congressional, Debugging, Content)', conversation_count;
    RAISE NOTICE '  • Response Templates: % (Status, Progress, Resolution, Content)', template_count;
    RAISE NOTICE '';
    RAISE NOTICE 'KNOWLEDGE BASE:';
    RAISE NOTICE '  • Learning Patterns: % (Operational, Workflow, Resolution, Communication, Quality)', pattern_count;
    RAISE NOTICE '  • Memory Clusters: % (Technical, Operational, Workflow, Communication, Content)', cluster_count;
    RAISE NOTICE '';
    RAISE NOTICE 'PERFORMANCE FRAMEWORK:';
    RAISE NOTICE '  • Performance Benchmarks: % (Response Time, Accuracy, Efficiency, Satisfaction)', metric_count;
    RAISE NOTICE '  • Learning Analysis: % (Effectiveness, Optimization, Quality)', analysis_count;
    RAISE NOTICE '';
    
    IF conversation_count >= 4 AND pattern_count >= 5 AND cluster_count >= 5 AND template_count >= 4 THEN
        RAISE NOTICE '✅ SUCCESS: All seed data successfully installed!';
        RAISE NOTICE '';
        RAISE NOTICE 'Your AI Agent now has:';
        RAISE NOTICE '  🧠 Comprehensive conversational intelligence';
        RAISE NOTICE '  📚 Deep knowledge base for administrative workflows';
        RAISE NOTICE '  🎯 Performance benchmarks and continuous learning';
        RAISE NOTICE '  🔄 Adaptive patterns for different scenarios';
        RAISE NOTICE '  💬 Context-aware response templates';
        RAISE NOTICE '';
        RAISE NOTICE 'The AI can now handle complex administrative conversations with full context,';
        RAISE NOTICE 'remember successful problem-solving patterns, and continuously improve based';
        RAISE NOTICE 'on user interactions and system performance.';
    ELSE
        RAISE WARNING 'INCOMPLETE INSTALLATION: Some seed data may be missing. Please review the migration logs.';
        RAISE WARNING 'Expected: Templates=4, Patterns=5, Clusters=5, Response Templates=4';
        RAISE WARNING 'Found: Templates=%, Patterns=%, Clusters=%, Response Templates=%', conversation_count, pattern_count, cluster_count, template_count;
    END IF;
    
    RAISE NOTICE '========================================================================================';
END $$;

COMMIT; 