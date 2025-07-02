-- Remove Unused Indexes Migration
-- Removes indexes that have never been used to reduce storage and maintenance overhead
-- Generated: 2024-12-19

BEGIN;

-- ==============================================================================
-- REMOVE UNUSED INDEXES
-- ==============================================================================
-- These indexes have never been used according to pg_stat_user_indexes
-- Removing them will reduce storage overhead and improve write performance

-- Question Feedback Indexes
DROP INDEX IF EXISTS public.idx_question_feedback_type;
DROP INDEX IF EXISTS public.idx_question_feedback_rating;
DROP INDEX IF EXISTS public.idx_question_feedback_report_reason;

-- NPC Related Indexes
DROP INDEX IF EXISTS public.idx_npc_personalities_skill;
DROP INDEX IF EXISTS public.idx_npc_specializations_category;
DROP INDEX IF EXISTS public.idx_npc_quiz_attempts_topic;
DROP INDEX IF EXISTS public.idx_npc_question_responses_category;
DROP INDEX IF EXISTS public.idx_npc_learning_progression_category;
DROP INDEX IF EXISTS public.idx_npc_chat_templates_trigger;
DROP INDEX IF EXISTS public.idx_npc_conversation_history_player;
DROP INDEX IF EXISTS public.idx_npc_conversation_history_trigger;

-- Survey Related Indexes
DROP INDEX IF EXISTS public.idx_user_survey_completions_user_id;
DROP INDEX IF EXISTS public.idx_user_survey_completions_guest_token;
DROP INDEX IF EXISTS public.idx_user_survey_completions_survey_id;
DROP INDEX IF EXISTS public.idx_user_survey_completions_completed_at;
DROP INDEX IF EXISTS public.idx_survey_learning_goals_survey_id;
DROP INDEX IF EXISTS public.idx_survey_learning_goals_skill_id;
DROP INDEX IF EXISTS public.idx_survey_recommendations_user_id;
DROP INDEX IF EXISTS public.idx_survey_recommendations_guest_token;
DROP INDEX IF EXISTS public.idx_survey_recommendations_survey_id;

-- User Deck and Memory Indexes
DROP INDEX IF EXISTS public.idx_user_deck_content_deck;
DROP INDEX IF EXISTS public.idx_user_streak_history_user_active;
DROP INDEX IF EXISTS public.idx_user_question_memory_user;
DROP INDEX IF EXISTS public.idx_user_question_memory_review_date;

-- User Subscription and Feature Usage Indexes
DROP INDEX IF EXISTS public.idx_user_subscriptions_tier;
DROP INDEX IF EXISTS public.idx_user_subscriptions_end_date;
DROP INDEX IF EXISTS public.idx_user_feature_usage_user_feature;
DROP INDEX IF EXISTS public.idx_user_feature_usage_reset_date;

-- User Progress and Analytics Indexes
DROP INDEX IF EXISTS public.idx_user_progress_history_type;
DROP INDEX IF EXISTS public.idx_user_quiz_analytics_created_at;
DROP INDEX IF EXISTS public.idx_user_learning_insights_type;
DROP INDEX IF EXISTS public.idx_user_learning_insights_unread;

-- Translation Related Indexes
DROP INDEX IF EXISTS public.questions_test_category_idx;
DROP INDEX IF EXISTS public.idx_questions_translations;
DROP INDEX IF EXISTS public.idx_assessment_questions_translations;
DROP INDEX IF EXISTS public.idx_question_topics_translations;
DROP INDEX IF EXISTS public.idx_survey_questions_translations;
DROP INDEX IF EXISTS public.idx_surveys_translations;
DROP INDEX IF EXISTS public.idx_categories_translations;

-- Bookmark Snippet Indexes
DROP INDEX IF EXISTS public.idx_snippets_source_type;
DROP INDEX IF EXISTS public.idx_snippets_tags;

-- Multiplayer Related Indexes
DROP INDEX IF EXISTS public.idx_multiplayer_quiz_attempts_game_session;
DROP INDEX IF EXISTS public.idx_multiplayer_rooms_room_code;
DROP INDEX IF EXISTS public.idx_multiplayer_rooms_status_expires;
DROP INDEX IF EXISTS public.idx_multiplayer_room_players_user_id;
DROP INDEX IF EXISTS public.idx_multiplayer_room_players_guest_token;

-- Skills Related Indexes
DROP INDEX IF EXISTS public.idx_skills_active;
DROP INDEX IF EXISTS public.idx_question_skills_question;
DROP INDEX IF EXISTS public.idx_question_skills_skill;
DROP INDEX IF EXISTS public.idx_question_skills_primary;
DROP INDEX IF EXISTS public.idx_user_skill_progress_skill;
DROP INDEX IF EXISTS public.idx_user_skill_progress_review;
DROP INDEX IF EXISTS public.idx_user_skill_progress_mastery;
DROP INDEX IF EXISTS public.idx_skill_prerequisites_skill;
DROP INDEX IF EXISTS public.idx_question_skills_skill_weight;

-- Civics Test Analytics
DROP INDEX IF EXISTS public.idx_guest_civics_test_results_completed_at;
DROP INDEX IF EXISTS public.idx_civics_test_analytics_session_id;

-- Learning Pods Indexes
DROP INDEX IF EXISTS public.idx_learning_pods_lms_platform;
DROP INDEX IF EXISTS public.idx_learning_pods_clever_section_id;
DROP INDEX IF EXISTS public.idx_learning_pods_is_public;
DROP INDEX IF EXISTS public.idx_learning_pods_pod_type;
DROP INDEX IF EXISTS public.idx_learning_pods_target_age_range;
DROP INDEX IF EXISTS public.idx_learning_pods_activity_score;
DROP INDEX IF EXISTS public.idx_learning_pods_classroom_course;
DROP INDEX IF EXISTS public.idx_learning_pods_updated_at;
DROP INDEX IF EXISTS public.idx_learning_pods_custom_type_label;
DROP INDEX IF EXISTS public.idx_learning_pods_pod_slug;
DROP INDEX IF EXISTS public.idx_learning_pods_pod_emoji;

-- Pod Related Indexes
DROP INDEX IF EXISTS public.idx_pod_memberships_pod_role_status;
DROP INDEX IF EXISTS public.idx_pod_member_settings_pod_id;
DROP INDEX IF EXISTS public.idx_pod_member_settings_user_id;
DROP INDEX IF EXISTS public.idx_pod_invite_links_invite_code;
DROP INDEX IF EXISTS public.idx_pod_invite_links_created_by;
DROP INDEX IF EXISTS public.idx_pod_invite_links_expires_at;
DROP INDEX IF EXISTS public.idx_invite_links_code;
DROP INDEX IF EXISTS public.idx_join_requests_requester;
DROP INDEX IF EXISTS public.idx_activity_log_pod_time;
DROP INDEX IF EXISTS public.idx_activity_log_user_time;

-- Image Analytics Indexes
DROP INDEX IF EXISTS public.idx_image_analytics_created_at;
DROP INDEX IF EXISTS public.idx_image_analytics_template_success;
DROP INDEX IF EXISTS public.idx_image_analytics_user_created;
DROP INDEX IF EXISTS public.idx_image_analytics_performance;
DROP INDEX IF EXISTS public.idx_ab_test_results_test_variant;

-- System and Profile Indexes
DROP INDEX IF EXISTS public.idx_system_alerts_severity_created;
DROP INDEX IF EXISTS public.idx_profiles_full_name;
DROP INDEX IF EXISTS public.idx_profiles_is_admin;
DROP INDEX IF EXISTS public.idx_profiles_personality;
DROP INDEX IF EXISTS public.idx_profiles_focus_areas;

-- User Email Preferences
DROP INDEX IF EXISTS public.idx_user_email_preferences_user_id;
DROP INDEX IF EXISTS public.idx_user_email_preferences_updated_at;

-- Progress Sessions
DROP INDEX IF EXISTS public.idx_progress_sessions_user_type;
DROP INDEX IF EXISTS public.idx_progress_sessions_guest_type;
DROP INDEX IF EXISTS public.idx_progress_sessions_session_id;
DROP INDEX IF EXISTS public.idx_progress_sessions_expires_at;
DROP INDEX IF EXISTS public.idx_progress_sessions_topic;
DROP INDEX IF EXISTS public.idx_progress_responses_session;
DROP INDEX IF EXISTS public.idx_progress_responses_question;
DROP INDEX IF EXISTS public.idx_progress_responses_session_index;

-- Clever Integration Indexes
DROP INDEX IF EXISTS public.idx_clever_user_mapping_user_id;
DROP INDEX IF EXISTS public.idx_quiz_attempts_clever_section;

-- School Schema Indexes
DROP INDEX IF EXISTS school.idx_school_sync_logs_course;
DROP INDEX IF EXISTS school.idx_school_sync_logs_status;
DROP INDEX IF EXISTS school.idx_courses_lms_platform;
DROP INDEX IF EXISTS school.idx_courses_clever_section_id;
DROP INDEX IF EXISTS school.idx_student_grades_section_assignment;

COMMIT;

-- Add comment explaining the cleanup
COMMENT ON SCHEMA public IS 'Removed 80+ unused indexes to improve storage efficiency and write performance';

-- Log the cleanup for monitoring (using correct system_alerts schema)
INSERT INTO public.system_alerts (alert_type, severity, message, metadata, created_at)
VALUES (
    'database_optimization',
    'info',
    'Database optimization: Removed unused indexes',
    '{"details": "Removed 80+ unused indexes identified by database linter to improve storage efficiency and write performance"}'::jsonb,
    NOW()
) ON CONFLICT DO NOTHING; 