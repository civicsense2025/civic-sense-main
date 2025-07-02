/**
 * Database Constants for CivicSense Mobile App
 * 
 * This file is auto-generated from the main database.types.ts file
 * to ensure consistency between web and mobile apps.
 * 
 * Last updated: 2025-06-20T23:01:27.662Z
 * 
 * DO NOT EDIT MANUALLY - Use 'npm run sync:db-constants' to update
 */

import type { Database, Tables, TablesInsert, TablesUpdate } from './database-types'

// =============================================================================
// TABLE NAMES
// =============================================================================

export const DB_TABLES = {
  ARTICLE_BIAS_ANALYSIS: 'article_bias_analysis' as const,
  ASSESSMENT_ANALYTICS: 'assessment_analytics' as const,
  ASSESSMENT_QUESTIONS: 'user_assessment_questions' as const,
  ASSESSMENT_SCORING: 'assessment_scoring' as const,
  BADGE_REQUIREMENTS: 'badge_requirements' as const,
  BIAS_DETECTION_PATTERNS: 'bias_detection_patterns' as const,
  BIAS_DIMENSIONS: 'bias_dimensions' as const,
  BIAS_FEEDBACK: 'bias_feedback' as const,
  BIAS_LEARNING_EVENTS: 'bias_learning_events' as const,
  BOOKMARK_ANALYTICS: 'bookmark_analytics' as const,
  BOOKMARK_COLLECTIONS: 'bookmark_collections' as const,
  BOOKMARK_SNIPPETS: 'bookmark_snippets' as const,
  BOOKMARK_TAGS: 'bookmark_tags' as const,
  BOOKMARKS: 'bookmarks' as const,
  BOOST_DEFINITIONS: 'boost_definitions' as const,
  CATEGORIES: 'categories' as const,
  CATEGORY_SYNONYMS: 'category_synonyms' as const,
  CIVICS_TEST_ANALYTICS: 'civics_test_analytics' as const,
  CLEVER_USER_MAPPING: 'clever_user_mapping' as const,
  CONTENT_FILTERING_RULES: 'content_filtering_rules' as const,
  CONTENT_GENERATION_QUEUE: 'content_generation_queue' as const,
  CONTENT_PREVIEW_CACHE: 'content_preview_cache' as const,
  EVENTS: 'events' as const,
  FACT_CHECK_LOGS: 'fact_check_logs' as const,
  FIGURE_EVENTS: 'figure_events' as const,
  FIGURE_ORGANIZATIONS: 'figure_organizations' as const,
  FIGURE_POLICY_POSITIONS: 'figure_policy_positions' as const,
  FIGURE_QUIZ_TOPICS: 'figure_quiz_topics' as const,
  FIGURE_RELATIONSHIPS: 'figure_relationships' as const,
  FRIEND_REQUESTS: 'friend_requests' as const,
  GIFT_CREDITS: 'gift_credits' as const,
  GIFT_REDEMPTIONS: 'gift_redemptions' as const,
  GLOSSARY_TERMS: 'glossary_terms' as const,
  GUEST_CIVICS_TEST_RESULTS: 'guest_civics_test_results' as const,
  GUEST_USAGE_ANALYTICS: 'guest_usage_analytics' as const,
  GUEST_USAGE_TRACKING: 'guest_usage_tracking' as const,
  IMAGE_AB_TEST_RESULTS: 'image_ab_test_results' as const,
  IMAGE_GENERATION_ANALYTICS: 'image_generation_analytics' as const,
  JOB_EXECUTION_LOGS: 'job_execution_logs' as const,
  KEY_POLICY_POSITIONS: 'key_policy_positions' as const,
  LEARNING_OBJECTIVES: 'learning_objectives' as const,
  LEARNING_PODS: 'learning_pods' as const,
  MEDIA_ORGANIZATIONS: 'media_organizations' as const,
  MEMBER_INDIVIDUAL_SETTINGS: 'member_individual_settings' as const,
  MULTIPLAYER_CHAT_MESSAGES: 'multiplayer_chat_messages' as const,
  MULTIPLAYER_CONVERSATION_CONTEXT: 'multiplayer_conversation_context' as const,
  MULTIPLAYER_GAME_EVENTS: 'multiplayer_game_events' as const,
  MULTIPLAYER_GAME_SESSIONS: 'multiplayer_game_sessions' as const,
  MULTIPLAYER_NPC_PLAYERS: 'multiplayer_npc_players' as const,
  MULTIPLAYER_QUESTION_RESPONSES: 'multiplayer_question_responses' as const,
  MULTIPLAYER_QUIZ_ATTEMPTS: 'multiplayer_quiz_attempts' as const,
  MULTIPLAYER_ROOM_EVENTS: 'multiplayer_room_events' as const,
  MULTIPLAYER_ROOM_PLAYERS: 'multiplayer_room_players' as const,
  MULTIPLAYER_ROOMS: 'multiplayer_rooms' as const,
  NEWS_CACHE: 'news_cache' as const,
  NPC_CATEGORY_SPECIALIZATIONS: 'npc_category_specializations' as const,
  NPC_CHAT_TEMPLATES: 'npc_chat_templates' as const,
  NPC_CONVERSATION_HISTORY: 'npc_conversation_history' as const,
  NPC_LEARNING_PROGRESSION: 'npc_learning_progression' as const,
  NPC_PERSONALITIES: 'npc_personalities' as const,
  NPC_QUESTION_RESPONSES: 'npc_question_responses' as const,
  NPC_QUIZ_ATTEMPTS: 'npc_quiz_attempts' as const,
  ORGANIZATION_BIAS_SCORES: 'organization_bias_scores' as const,
  ORGANIZATIONS: 'organizations' as const,
  PARENTAL_CONTROLS: 'parental_controls' as const,
  PATHWAY_SKILLS: 'pathway_skills' as const,
  POD_ACHIEVEMENTS: 'pod_achievements' as const,
  POD_ACTIVITIES: 'pod_activities' as const,
  POD_ACTIVITY_LOG: 'pod_activity_log' as const,
  POD_ANALYTICS: 'pod_analytics' as const,
  POD_CHALLENGE_PARTICIPANTS: 'pod_challenge_participants' as const,
  POD_CHALLENGES: 'pod_challenges' as const,
  POD_INVITE_LINKS: 'pod_invite_links' as const,
  POD_JOIN_REQUESTS: 'pod_join_requests' as const,
  POD_MEMBER_ANALYTICS: 'pod_member_analytics' as const,
  POD_MEMBER_SETTINGS: 'pod_member_settings' as const,
  POD_MEMBERSHIPS: 'pod_memberships' as const,
  POD_PARTNERSHIPS: 'pod_partnerships' as const,
  POD_RATINGS: 'pod_ratings' as const,
  POD_SETTINGS: 'pod_settings' as const,
  POD_THEMES: 'pod_themes' as const,
  PROFILES: 'profiles' as const,
  PROGRESS_QUESTION_RESPONSES: 'progress_question_responses' as const,
  PROGRESS_SESSIONS: 'progress_sessions' as const,
  PUBLIC_FIGURES: 'public_figures' as const,
  QUESTION_ANALYTICS: 'question_analytics' as const,
  QUESTION_FEEDBACK: 'question_feedback' as const,
  QUESTION_SKILLS: 'question_skills' as const,
  QUESTION_SOURCE_LINKS: 'question_source_links' as const,
  QUESTION_TOPICS: 'question_topics' as const,
  QUESTIONS: 'questions' as const,
  QUESTIONS_TEST: 'questions_test' as const,
  SCHEDULED_CONTENT_JOBS: 'scheduled_content_jobs' as const,
  SHAREABLE_GIFT_LINKS: 'shareable_gift_links' as const,
  SHAREABLE_LINK_CLAIMS: 'shareable_link_claims' as const,
  SHARED_COLLECTION_ACCESS: 'shared_collection_access' as const,
  SKILL_ASSESSMENT_CRITERIA: 'skill_assessment_criteria' as const,
  SKILL_BADGES: 'skill_badges' as const,
  SKILL_CATEGORIES: 'skill_categories' as const,
  SKILL_LEARNING_OBJECTIVES: 'skill_learning_objectives' as const,
  SKILL_MASTERY_TRACKING: 'skill_mastery_tracking' as const,
  SKILL_PRACTICE_RECOMMENDATIONS: 'skill_practice_recommendations' as const,
  SKILL_PREREQUISITES: 'skill_prerequisites' as const,
  SKILL_PROGRESSION_PATHWAYS: 'skill_progression_pathways' as const,
  SKILL_RELATIONSHIPS: 'skill_relationships' as const,
  SKILLS: 'skills' as const,
  SOURCE_CREDIBILITY_INDICATORS: 'source_credibility_indicators' as const,
  SOURCE_FETCH_QUEUE: 'source_fetch_queue' as const,
  SOURCE_METADATA: 'source_metadata' as const,
  SPACED_REPETITION_SCHEDULE: 'spaced_repetition_schedule' as const,
  SUBSCRIPTION_TIER_LIMITS: 'subscription_tier_limits' as const,
  SURVEY_ANSWERS: 'survey_answers' as const,
  SURVEY_LEARNING_GOALS: 'survey_learning_goals' as const,
  SURVEY_QUESTIONS: 'survey_questions' as const,
  SURVEY_RECOMMENDATIONS: 'survey_recommendations' as const,
  SURVEY_RESPONSES: 'survey_responses' as const,
  SURVEYS: 'surveys' as const,
  SYSTEM_ALERTS: 'system_alerts' as const,
  TRANSLATION_JOBS: 'translation_jobs' as const,
  USER_ACHIEVEMENTS: 'user_achievements' as const,
  USER_ACTIVE_BOOSTS: 'user_active_boosts' as const,
  USER_ASSESSMENT_ATTEMPTS: 'user_assessment_attempts' as const,
  USER_ASSESSMENTS: 'user_assessments' as const,
  USER_BADGES: 'user_badges' as const,
  USER_BOOST_INVENTORY: 'user_boost_inventory' as const,
  USER_CATEGORY_PREFERENCES: 'user_category_preferences' as const,
  USER_CATEGORY_SKILLS: 'user_category_skills' as const,
  USER_CUSTOM_DECKS: 'user_custom_decks' as const,
  USER_DECK_CONTENT: 'user_deck_content' as const,
  USER_EMAIL_PREFERENCES: 'user_email_preferences' as const,
  USER_FEATURE_USAGE: 'user_feature_usage' as const,
  USER_FEEDBACK: 'user_feedback' as const,
  USER_LEARNING_GOALS: 'user_learning_goals' as const,
  USER_LEARNING_INSIGHTS: 'user_learning_insights' as const,
  USER_ONBOARDING_STATE: 'user_onboarding_state' as const,
  USER_PLATFORM_PREFERENCES: 'user_platform_preferences' as const,
  USER_PROGRESS: 'user_progress' as const,
  USER_PROGRESS_HISTORY: 'user_progress_history' as const,
  USER_QUESTION_MEMORY: 'user_question_memory' as const,
  USER_QUESTION_RESPONSES: 'user_question_responses' as const,
  USER_QUIZ_ANALYTICS: 'user_quiz_analytics' as const,
  USER_QUIZ_ATTEMPTS: 'user_quiz_attempts' as const,
  USER_ROLES: 'user_roles' as const,
  USER_SKILL_PREFERENCES: 'user_skill_preferences' as const,
  USER_SKILL_PROGRESS: 'user_skill_progress' as const,
  USER_STREAK_HISTORY: 'user_streak_history' as const,
  USER_SUBSCRIPTIONS: 'user_subscriptions' as const,
  USER_SURVEY_COMPLETIONS: 'user_survey_completions' as const,
} as const;

export type DbTableName = keyof typeof DB_TABLES;

// =============================================================================
// TABLE COLUMNS
// =============================================================================

export const DB_COLUMNS = {
  ARTICLE_BIAS_ANALYSIS: {
    AI_ANALYSIS_VERSION: 'ai_analysis_version' as const,
    AI_CONFIDENCE: 'ai_confidence' as const,
    AI_REASONING: 'ai_reasoning' as const,
    ANALYSIS_METHOD: 'analysis_method' as const,
    ANALYZED_AT: 'analyzed_at' as const,
    ANALYZER_ID: 'analyzer_id' as const,
    ARTICLE_AUTHOR: 'article_author' as const,
    ARTICLE_TITLE: 'article_title' as const,
    ARTICLE_URL: 'article_url' as const,
    CONFIDENCE_LEVEL: 'confidence_level' as const,
    CREATED_AT: 'created_at' as const,
    DETECTED_TECHNIQUES: 'detected_techniques' as const,
    DIMENSION_SCORES: 'dimension_scores' as const,
    EMOTIONAL_LANGUAGE_SCORE: 'emotional_language_score' as const,
    EMOTIONAL_MANIPULATION_SCORE: 'emotional_manipulation_score' as const,
    FACTUAL_ACCURACY_SCORE: 'factual_accuracy_score' as const,
    FACTUAL_CLAIMS: 'factual_claims' as const,
    ID: 'id' as const,
    ORGANIZATION_ID: 'organization_id' as const,
    OVERALL_BIAS_SCORE: 'overall_bias_score' as const,
    PUBLISHED_AT: 'published_at' as const,
    SOURCE_DIVERSITY_SCORE: 'source_diversity_score' as const,
    SOURCE_METADATA_ID: 'source_metadata_id' as const,
  } as const,

  ASSESSMENT_ANALYTICS: {
    EVENT_TYPE: 'event_type' as const,
    FINAL_SCORE: 'final_score' as const,
    ID: 'id' as const,
    METADATA: 'metadata' as const,
    SESSION_ID: 'session_id' as const,
    TIMESTAMP: 'timestamp' as const,
    USER_ID: 'user_id' as const,
  } as const,

  ASSESSMENT_QUESTIONS: {
    CATEGORY: 'category' as const,
    CORRECT_ANSWER: 'correct_answer' as const,
    CREATED_AT: 'created_at' as const,
    DIFFICULTY: 'difficulty' as const,
    EXPLANATION: 'explanation' as const,
    FRIENDLY_EXPLANATION: 'friendly_explanation' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    OPTIONS: 'options' as const,
    QUESTION: 'question' as const,
    SKILL_ID: 'skill_id' as const,
    TRANSLATIONS: 'translations' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  ASSESSMENT_SCORING: {
    CATEGORY: 'category' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    ID: 'id' as const,
    RECOMMENDED_CONTENT: 'recommended_content' as const,
    SCORE_RANGE_MAX: 'score_range_max' as const,
    SCORE_RANGE_MIN: 'score_range_min' as const,
    SKILL_LEVEL: 'skill_level' as const,
  } as const,

  BADGE_REQUIREMENTS: {
    BADGE_ID: 'badge_id' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    REQUIREMENT_TYPE: 'requirement_type' as const,
    REQUIREMENT_VALUE: 'requirement_value' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  BIAS_DETECTION_PATTERNS: {
    CREATED_AT: 'created_at' as const,
    DIMENSION_ID: 'dimension_id' as const,
    FALSE_POSITIVE_RATE: 'false_positive_rate' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    KEYWORDS: 'keywords' as const,
    LAST_UPDATED: 'last_updated' as const,
    PATTERN_NAME: 'pattern_name' as const,
    PATTERN_REGEX: 'pattern_regex' as const,
    PATTERN_TYPE: 'pattern_type' as const,
    PHRASE_PATTERNS: 'phrase_patterns' as const,
    SEVERITY_WEIGHT: 'severity_weight' as const,
    TIMES_DETECTED: 'times_detected' as const,
  } as const,

  BIAS_DIMENSIONS: {
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DIMENSION_NAME: 'dimension_name' as const,
    DIMENSION_SLUG: 'dimension_slug' as const,
    DISPLAY_ORDER: 'display_order' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    SCALE_TYPE: 'scale_type' as const,
    SCALE_VALUES: 'scale_values' as const,
  } as const,

  BIAS_FEEDBACK: {
    AGREES_WITH_ASSESSMENT: 'agrees_with_assessment' as const,
    ARTICLE_ANALYSIS_ID: 'article_analysis_id' as const,
    CREATED_AT: 'created_at' as const,
    DIMENSION_ID: 'dimension_id' as const,
    EVIDENCE_URLS: 'evidence_urls' as const,
    FEEDBACK_TEXT: 'feedback_text' as const,
    FEEDBACK_TYPE: 'feedback_type' as const,
    GUEST_TOKEN: 'guest_token' as const,
    HELPFULNESS_SCORE: 'helpfulness_score' as const,
    ID: 'id' as const,
    IP_ADDRESS: 'ip_address' as const,
    IS_SPAM: 'is_spam' as const,
    IS_VERIFIED: 'is_verified' as const,
    ORGANIZATION_ID: 'organization_id' as const,
    SUGGESTED_SCORE: 'suggested_score' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_AGENT: 'user_agent' as const,
    USER_EXPERTISE_AREAS: 'user_expertise_areas' as const,
    USER_EXPERTISE_LEVEL: 'user_expertise_level' as const,
    USER_ID: 'user_id' as const,
    VERIFICATION_NOTES: 'verification_notes' as const,
    VERIFIED_BY: 'verified_by' as const,
  } as const,

  BIAS_LEARNING_EVENTS: {
    ARTICLE_COUNT: 'article_count' as const,
    CONFIDENCE_CHANGE: 'confidence_change' as const,
    CONSENSUS_STRENGTH: 'consensus_strength' as const,
    CREATED_AT: 'created_at' as const,
    DIMENSION_ID: 'dimension_id' as const,
    EVENT_TYPE: 'event_type' as const,
    FEEDBACK_COUNT: 'feedback_count' as const,
    ID: 'id' as const,
    LEARNING_ALGORITHM_VERSION: 'learning_algorithm_version' as const,
    NEW_SCORE: 'new_score' as const,
    OLD_SCORE: 'old_score' as const,
    ORGANIZATION_ID: 'organization_id' as const,
    TRIGGER_ID: 'trigger_id' as const,
    TRIGGER_TYPE: 'trigger_type' as const,
  } as const,

  BOOKMARK_ANALYTICS: {
    BOOKMARK_ID: 'bookmark_id' as const,
    CREATED_AT: 'created_at' as const,
    EVENT_DATA: 'event_data' as const,
    EVENT_TYPE: 'event_type' as const,
    ID: 'id' as const,
    SNIPPET_ID: 'snippet_id' as const,
    USER_ID: 'user_id' as const,
  } as const,

  BOOKMARK_COLLECTIONS: {
    COLOR: 'color' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DISPLAY_ORDER: 'display_order' as const,
    EMOJI: 'emoji' as const,
    ID: 'id' as const,
    IS_PUBLIC: 'is_public' as const,
    IS_SMART: 'is_smart' as const,
    NAME: 'name' as const,
    PARENT_COLLECTION_ID: 'parent_collection_id' as const,
    SMART_CRITERIA: 'smart_criteria' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  BOOKMARK_SNIPPETS: {
    AI_SUMMARY: 'ai_summary' as const,
    AI_TAGS: 'ai_tags' as const,
    BOOKMARK_ID: 'bookmark_id' as const,
    COLLECTION_ID: 'collection_id' as const,
    CREATED_AT: 'created_at' as const,
    FULL_CONTEXT: 'full_context' as const,
    HIGHLIGHT_COLOR: 'highlight_color' as const,
    ID: 'id' as const,
    PARAGRAPH_INDEX: 'paragraph_index' as const,
    SELECTION_END: 'selection_end' as const,
    SELECTION_START: 'selection_start' as const,
    SNIPPET_TEXT: 'snippet_text' as const,
    SOURCE_ID: 'source_id' as const,
    SOURCE_TITLE: 'source_title' as const,
    SOURCE_TYPE: 'source_type' as const,
    SOURCE_URL: 'source_url' as const,
    TAGS: 'tags' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
    USER_NOTES: 'user_notes' as const,
  } as const,

  BOOKMARK_TAGS: {
    COLOR: 'color' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    TAG_NAME: 'tag_name' as const,
    TAG_SLUG: 'tag_slug' as const,
    USAGE_COUNT: 'usage_count' as const,
    USER_ID: 'user_id' as const,
  } as const,

  BOOKMARKS: {
    ACCESS_COUNT: 'access_count' as const,
    COLLECTION_ID: 'collection_id' as const,
    CONTENT_ID: 'content_id' as const,
    CONTENT_TYPE: 'content_type' as const,
    CONTENT_URL: 'content_url' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    ID: 'id' as const,
    IS_FAVORITE: 'is_favorite' as const,
    LAST_ACCESSED_AT: 'last_accessed_at' as const,
    SOURCE_DOMAIN: 'source_domain' as const,
    TAGS: 'tags' as const,
    THUMBNAIL_URL: 'thumbnail_url' as const,
    TITLE: 'title' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
    USER_NOTES: 'user_notes' as const,
  } as const,

  BOOST_DEFINITIONS: {
    BOOST_TYPE: 'boost_type' as const,
    CATEGORY: 'category' as const,
    COOLDOWN_HOURS: 'cooldown_hours' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DURATION: 'duration' as const,
    EMOJI: 'emoji' as const,
    ICON: 'icon' as const,
    IS_ACTIVE: 'is_active' as const,
    LEVEL_REQUIREMENT: 'level_requirement' as const,
    MAX_USES: 'max_uses' as const,
    NAME: 'name' as const,
    RARITY: 'rarity' as const,
    TAGS: 'tags' as const,
    UPDATED_AT: 'updated_at' as const,
    XP_COST: 'xp_cost' as const,
  } as const,

  CATEGORIES: {
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DISPLAY_ORDER: 'display_order' as const,
    EMOJI: 'emoji' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    NAME: 'name' as const,
    TRANSLATIONS: 'translations' as const,
  } as const,

  CATEGORY_SYNONYMS: {
    ALIAS: 'alias' as const,
    CATEGORY_ID: 'category_id' as const,
    IS_ACTIVE: 'is_active' as const,
  } as const,

  CIVICS_TEST_ANALYTICS: {
    EVENT_TYPE: 'event_type' as const,
    GUEST_TOKEN: 'guest_token' as const,
    ID: 'id' as const,
    IP_ADDRESS: 'ip_address' as const,
    METADATA: 'metadata' as const,
    SCORE: 'score' as const,
    SESSION_ID: 'session_id' as const,
    TIMESTAMP: 'timestamp' as const,
    USER_AGENT: 'user_agent' as const,
    USER_ID: 'user_id' as const,
  } as const,

  CLEVER_USER_MAPPING: {
    CIVICSENSE_USER_ID: 'civicsense_user_id' as const,
    CLEVER_EMAIL: 'clever_email' as const,
    CLEVER_USER_ID: 'clever_user_id' as const,
    CREATED_AT: 'created_at' as const,
    FIRST_NAME: 'first_name' as const,
    ID: 'id' as const,
    LAST_NAME: 'last_name' as const,
    ROLE: 'role' as const,
    SCHOOL_ID: 'school_id' as const,
  } as const,

  CONTENT_FILTERING_RULES: {
    AGE_RANGE: 'age_range' as const,
    BLOCKED_CATEGORIES: 'blocked_categories' as const,
    BLOCKED_KEYWORDS: 'blocked_keywords' as const,
    BLOCKED_TOPICS: 'blocked_topics' as const,
    CREATED_AT: 'created_at' as const,
    FILTER_LEVEL: 'filter_level' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    MAX_DIFFICULTY_LEVEL: 'max_difficulty_level' as const,
    RULE_NAME: 'rule_name' as const,
    SENSITIVE_TOPICS: 'sensitive_topics' as const,
  } as const,

  CONTENT_GENERATION_QUEUE: {
    ASSIGNED_WORKER: 'assigned_worker' as const,
    COMPLETED_AT: 'completed_at' as const,
    CREATED_AT: 'created_at' as const,
    ERROR_MESSAGE: 'error_message' as const,
    ESTIMATED_DURATION_MS: 'estimated_duration_ms' as const,
    EXECUTION_LOG_ID: 'execution_log_id' as const,
    EXPIRES_AT: 'expires_at' as const,
    GENERATION_PARAMS: 'generation_params' as const,
    GENERATION_TYPE: 'generation_type' as const,
    ID: 'id' as const,
    MAX_RETRIES: 'max_retries' as const,
    PRIORITY: 'priority' as const,
    PROCESS_AFTER: 'process_after' as const,
    RESULT_DATA: 'result_data' as const,
    RETRY_COUNT: 'retry_count' as const,
    SCHEDULED_JOB_ID: 'scheduled_job_id' as const,
    STARTED_AT: 'started_at' as const,
    STATUS: 'status' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  CONTENT_PREVIEW_CACHE: {
    ACCESS_COUNT: 'access_count' as const,
    CACHE_KEY: 'cache_key' as const,
    CACHE_TYPE: 'cache_type' as const,
    CREATED_AT: 'created_at' as const,
    CREATED_BY: 'created_by' as const,
    EXPIRES_AT: 'expires_at' as const,
    GENERATION_SETTINGS: 'generation_settings' as const,
    ID: 'id' as const,
    LAST_ACCESSED_AT: 'last_accessed_at' as const,
    PREVIEW_DATA: 'preview_data' as const,
  } as const,

  EVENTS: {
    CREATED_AT: 'created_at' as const,
    DATE: 'date' as const,
    DESCRIPTION: 'description' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    SOURCES: 'sources' as const,
    TOPIC_ID: 'topic_id' as const,
    TOPIC_TITLE: 'topic_title' as const,
    UPDATED_AT: 'updated_at' as const,
    WHY_THIS_MATTERS: 'why_this_matters' as const,
  } as const,

  FACT_CHECK_LOGS: {
    AI_REASONING: 'ai_reasoning' as const,
    CHANGES_APPLIED: 'changes_applied' as const,
    CHECK_DATE: 'check_date' as const,
    CONFIDENCE_SCORE: 'confidence_score' as const,
    CREATED_AT: 'created_at' as const,
    HUMAN_REVIEWER: 'human_reviewer' as const,
    ID: 'id' as const,
    ISSUES_FOUND: 'issues_found' as const,
    QUESTION_ID: 'question_id' as const,
  } as const,

  FIGURE_EVENTS: {
    CREATED_AT: 'created_at' as const,
    EVENT_DATE: 'event_date' as const,
    EVENT_DESCRIPTION: 'event_description' as const,
    EVENT_TITLE: 'event_title' as const,
    EVENT_TYPE: 'event_type' as const,
    FIGURE_ID: 'figure_id' as const,
    ID: 'id' as const,
    MEDIA_COVERAGE_SCALE: 'media_coverage_scale' as const,
    POLICY_AREAS: 'policy_areas' as const,
    QUIZ_POTENTIAL: 'quiz_potential' as const,
    RELATED_FIGURES: 'related_figures' as const,
    SIGNIFICANCE_LEVEL: 'significance_level' as const,
    SOURCES: 'sources' as const,
  } as const,

  FIGURE_ORGANIZATIONS: {
    APPOINTMENT_ANNOUNCEMENT_URL: 'appointment_announcement_url' as const,
    COMPENSATION_TYPE: 'compensation_type' as const,
    CREATED_AT: 'created_at' as const,
    END_DATE: 'end_date' as const,
    FIGURE_ID: 'figure_id' as const,
    ID: 'id' as const,
    INFLUENCE_WITHIN_ORG: 'influence_within_org' as const,
    IS_ACTIVE: 'is_active' as const,
    ORGANIZATION_ID: 'organization_id' as const,
    PUBLIC_VISIBILITY: 'public_visibility' as const,
    ROLE_DESCRIPTION: 'role_description' as const,
    ROLE_TITLE: 'role_title' as const,
    ROLE_TYPE: 'role_type' as const,
    SOURCES: 'sources' as const,
    START_DATE: 'start_date' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  FIGURE_POLICY_POSITIONS: {
    CERTAINTY_LEVEL: 'certainty_level' as const,
    CONSISTENCY_SCORE: 'consistency_score' as const,
    CREATED_AT: 'created_at' as const,
    FIGURE_ID: 'figure_id' as const,
    ID: 'id' as const,
    POLICY_AREA: 'policy_area' as const,
    POSITION_DATE: 'position_date' as const,
    POSITION_DESCRIPTION: 'position_description' as const,
    PUBLIC_STATEMENT_URL: 'public_statement_url' as const,
    SOURCES: 'sources' as const,
    SPECIFIC_POLICY: 'specific_policy' as const,
    UPDATED_AT: 'updated_at' as const,
    VOTING_RECORD_EVIDENCE: 'voting_record_evidence' as const,
  } as const,

  FIGURE_QUIZ_TOPICS: {
    CONTENT_THEMES: 'content_themes' as const,
    CREATED_AT: 'created_at' as const,
    DIFFICULTY_DISTRIBUTION: 'difficulty_distribution' as const,
    FEATURED_FIGURES: 'featured_figures' as const,
    FOCUS_TYPE: 'focus_type' as const,
    ID: 'id' as const,
    NETWORK_DEPTH: 'network_depth' as const,
    PERFORMANCE_METRICS: 'performance_metrics' as const,
    PRIMARY_FIGURE_ID: 'primary_figure_id' as const,
    TOPIC_ID: 'topic_id' as const,
  } as const,

  FIGURE_RELATIONSHIPS: {
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    EVIDENCE_SOURCES: 'evidence_sources' as const,
    FIGURE_A_ID: 'figure_a_id' as const,
    FIGURE_B_ID: 'figure_b_id' as const,
    FINANCIAL_CONNECTIONS: 'financial_connections' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    IS_PUBLIC: 'is_public' as const,
    KEY_INTERACTIONS: 'key_interactions' as const,
    POLICY_ALIGNMENTS: 'policy_alignments' as const,
    RELATIONSHIP_DIRECTION: 'relationship_direction' as const,
    RELATIONSHIP_END_DATE: 'relationship_end_date' as const,
    RELATIONSHIP_START_DATE: 'relationship_start_date' as const,
    RELATIONSHIP_STRENGTH: 'relationship_strength' as const,
    RELATIONSHIP_TYPE: 'relationship_type' as const,
    UPDATED_AT: 'updated_at' as const,
    VERIFICATION_STATUS: 'verification_status' as const,
  } as const,

  FRIEND_REQUESTS: {
    APPROVED_BY: 'approved_by' as const,
    CREATED_AT: 'created_at' as const,
    EXPIRES_AT: 'expires_at' as const,
    ID: 'id' as const,
    MESSAGE: 'message' as const,
    PARENT_APPROVED_AT: 'parent_approved_at' as const,
    POD_ID: 'pod_id' as const,
    RECIPIENT_ID: 'recipient_id' as const,
    REQUEST_TYPE: 'request_type' as const,
    REQUESTER_ID: 'requester_id' as const,
    REQUIRES_PARENTAL_APPROVAL: 'requires_parental_approval' as const,
    RESPONDED_AT: 'responded_at' as const,
    STATUS: 'status' as const,
  } as const,

  GIFT_CREDITS: {
    CREATED_AT: 'created_at' as const,
    CREDIT_TYPE: 'credit_type' as const,
    CREDITS_AVAILABLE: 'credits_available' as const,
    CREDITS_USED: 'credits_used' as const,
    DONOR_USER_ID: 'donor_user_id' as const,
    ID: 'id' as const,
    SOURCE_DONATION_AMOUNT: 'source_donation_amount' as const,
    SOURCE_STRIPE_SESSION_ID: 'source_stripe_session_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  GIFT_REDEMPTIONS: {
    ACCESS_TYPE: 'access_type' as const,
    CLAIMED_AT: 'claimed_at' as const,
    CREATED_AT: 'created_at' as const,
    DONOR_USER_ID: 'donor_user_id' as const,
    EXPIRES_AT: 'expires_at' as const,
    GIFT_CREDIT_ID: 'gift_credit_id' as const,
    GIFT_MESSAGE: 'gift_message' as const,
    ID: 'id' as const,
    RECIPIENT_EMAIL: 'recipient_email' as const,
    RECIPIENT_USER_ID: 'recipient_user_id' as const,
    REDEMPTION_CODE: 'redemption_code' as const,
    REDEMPTION_STATUS: 'redemption_status' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  GLOSSARY_TERMS: {
    CATEGORY: 'category' as const,
    CREATED_AT: 'created_at' as const,
    DEFINITION: 'definition' as const,
    EXAMPLES: 'examples' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    PART_OF_SPEECH: 'part_of_speech' as const,
    SYNONYMS: 'synonyms' as const,
    TERM: 'term' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  GUEST_CIVICS_TEST_RESULTS: {
    ANSWERS: 'answers' as const,
    CATEGORY_BREAKDOWN: 'category_breakdown' as const,
    COMPLETED_AT: 'completed_at' as const,
    CONVERTED_AT: 'converted_at' as const,
    CONVERTED_USER_ID: 'converted_user_id' as const,
    GUEST_TOKEN: 'guest_token' as const,
    ID: 'id' as const,
    IP_ADDRESS: 'ip_address' as const,
    LEVEL: 'level' as const,
    SCORE: 'score' as const,
    SESSION_ID: 'session_id' as const,
    TEST_TYPE: 'test_type' as const,
    USER_AGENT: 'user_agent' as const,
  } as const,

  GUEST_USAGE_ANALYTICS: {
    ATTEMPTS: 'attempts' as const,
    CREATED_AT: 'created_at' as const,
    DATE: 'date' as const,
    GUEST_TOKEN: 'guest_token' as const,
    ID: 'id' as const,
    IP: 'ip' as const,
    TIMESTAMP: 'timestamp' as const,
  } as const,

  GUEST_USAGE_TRACKING: {
    ATTEMPTS: 'attempts' as const,
    CREATED_AT: 'created_at' as const,
    DATE: 'date' as const,
    FIRSTSEEN: 'firstSeen' as const,
    ID: 'id' as const,
    IP: 'ip' as const,
    LASTSEEN: 'lastSeen' as const,
    TOKENS: 'tokens' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  IMAGE_AB_TEST_RESULTS: {
    CREATED_AT: 'created_at' as const,
    ENGAGEMENT_TYPE: 'engagement_type' as const,
    ENGAGEMENT_VALUE: 'engagement_value' as const,
    ID: 'id' as const,
    IMAGE_ID: 'image_id' as const,
    SESSION_ID: 'session_id' as const,
    TEST_NAME: 'test_name' as const,
    USER_ID: 'user_id' as const,
    VARIANT: 'variant' as const,
  } as const,

  IMAGE_GENERATION_ANALYTICS: {
    CONTENT_TYPE: 'content_type' as const,
    CREATED_AT: 'created_at' as const,
    ERROR_MESSAGE: 'error_message' as const,
    GENERATION_TIME_MS: 'generation_time_ms' as const,
    ID: 'id' as const,
    SESSION_ID: 'session_id' as const,
    SUCCESS: 'success' as const,
    TEMPLATE: 'template' as const,
    THEME: 'theme' as const,
    USER_ID: 'user_id' as const,
    VARIANT: 'variant' as const,
  } as const,

  JOB_EXECUTION_LOGS: {
    COMPLETED_AT: 'completed_at' as const,
    CONTENT_GENERATED: 'content_generated' as const,
    CREATED_AT: 'created_at' as const,
    ERROR_DETAILS: 'error_details' as const,
    ERROR_MESSAGE: 'error_message' as const,
    EXECUTION_METADATA: 'execution_metadata' as const,
    EXECUTION_TIME_MS: 'execution_time_ms' as const,
    ID: 'id' as const,
    JOB_ID: 'job_id' as const,
    QUESTIONS_CREATED: 'questions_created' as const,
    STACK_TRACE: 'stack_trace' as const,
    STARTED_AT: 'started_at' as const,
    STATUS: 'status' as const,
    TOPICS_CREATED: 'topics_created' as const,
  } as const,

  KEY_POLICY_POSITIONS: {
    CATEGORY_ID: 'category_id' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DISPLAY_ORDER: 'display_order' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    SPECTRUM: 'spectrum' as const,
    STANCE_LABEL: 'stance_label' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  LEARNING_OBJECTIVES: {
    CREATED_AT: 'created_at' as const,
    DISPLAY_ORDER: 'display_order' as const,
    ID: 'id' as const,
    MASTERY_LEVEL_REQUIRED: 'mastery_level_required' as const,
    OBJECTIVE_TEXT: 'objective_text' as const,
    OBJECTIVE_TYPE: 'objective_type' as const,
    SKILL_ID: 'skill_id' as const,
  } as const,

  LEARNING_PODS: {
    ACCESSIBILITY_MODE: 'accessibility_mode' as const,
    ACTIVITY_SCORE: 'activity_score' as const,
    ALERT_ON_INAPPROPRIATE_CONTENT: 'alert_on_inappropriate_content' as const,
    ALLOW_SENSITIVE_TOPICS: 'allow_sensitive_topics' as const,
    ALLOWED_AGE_RANGE: 'allowed_age_range' as const,
    ALLOWED_DAYS: 'allowed_days' as const,
    ALLOWED_END_TIME: 'allowed_end_time' as const,
    ALLOWED_START_TIME: 'allowed_start_time' as const,
    ARCHIVED_AT: 'archived_at' as const,
    ARCHIVED_BY: 'archived_by' as const,
    AVERAGE_RATING: 'average_rating' as const,
    BANNER_IMAGE_URL: 'banner_image_url' as const,
    BLOCKED_CATEGORIES: 'blocked_categories' as const,
    CAN_ACCESS_CHAT: 'can_access_chat' as const,
    CAN_ACCESS_MULTIPLAYER: 'can_access_multiplayer' as const,
    CAN_SHARE_PROGRESS: 'can_share_progress' as const,
    CAN_VIEW_LEADERBOARDS: 'can_view_leaderboards' as const,
    CHALLENGE_PARTICIPATION: 'challenge_participation' as const,
    CLASSROOM_COURSE_ID: 'classroom_course_id' as const,
    CLASSROOM_INTEGRATION_ENABLED: 'classroom_integration_enabled' as const,
    CLEVER_LAST_SYNC: 'clever_last_sync' as const,
    CLEVER_SECTION_ID: 'clever_section_id' as const,
    CLEVER_SYNC_ENABLED: 'clever_sync_enabled' as const,
    CLEVER_SYNC_ERRORS: 'clever_sync_errors' as const,
    CONTENT_FILTER_LEVEL: 'content_filter_level' as const,
    CREATED_AT: 'created_at' as const,
    CREATED_BY: 'created_by' as const,
    CUSTOM_TYPE_LABEL: 'custom_type_label' as const,
    DAILY_TIME_LIMIT_MINUTES: 'daily_time_limit_minutes' as const,
    DESCRIPTION: 'description' as const,
    DISPLAY_NAME: 'display_name' as const,
    FAMILY_NAME: 'family_name' as const,
    GRADE_PASSBACK_ENABLED: 'grade_passback_enabled' as const,
    ID: 'id' as const,
    IS_FEATURED: 'is_featured' as const,
    IS_PRIVATE: 'is_private' as const,
    IS_PUBLIC: 'is_public' as const,
    JOIN_CODE: 'join_code' as const,
    LMS_PLATFORM: 'lms_platform' as const,
    MAX_DIFFICULTY_LEVEL: 'max_difficulty_level' as const,
    MAX_MEMBERS: 'max_members' as const,
    MILESTONE_DATA: 'milestone_data' as const,
    PARENT_EMAIL: 'parent_email' as const,
    PARTNERSHIP_STATUS: 'partnership_status' as const,
    PERSONALITY_TYPE: 'personality_type' as const,
    POD_COLOR: 'pod_color' as const,
    POD_DESCRIPTION: 'pod_description' as const,
    POD_EMOJI: 'pod_emoji' as const,
    POD_MOTTO: 'pod_motto' as const,
    POD_NAME: 'pod_name' as const,
    POD_SLUG: 'pod_slug' as const,
    POD_TYPE: 'pod_type' as const,
    REPORT_FREQUENCY: 'report_frequency' as const,
    REQUIRE_PARENT_APPROVAL_FOR_FRIENDS: 'require_parent_approval_for_friends' as const,
    ROSTER_LAST_SYNCED: 'roster_last_synced' as const,
    SEARCH_TAGS: 'search_tags' as const,
    SEND_PROGRESS_REPORTS: 'send_progress_reports' as const,
    SHORT_DESCRIPTION: 'short_description' as const,
    TARGET_AGE_RANGE: 'target_age_range' as const,
    THEME_ID: 'theme_id' as const,
    TOPICS_COVERED: 'topics_covered' as const,
    TOTAL_RATINGS: 'total_ratings' as const,
    TRACK_DETAILED_ACTIVITY: 'track_detailed_activity' as const,
    UNLOCKED_FEATURES: 'unlocked_features' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  MEDIA_ORGANIZATIONS: {
    ALTERNATE_DOMAINS: 'alternate_domains' as const,
    CORRECTIONS_POLICY: 'corrections_policy' as const,
    CREATED_AT: 'created_at' as const,
    CREDIBILITY_RATING: 'credibility_rating' as const,
    DESCRIPTION: 'description' as const,
    DOMAIN: 'domain' as const,
    EDITORIAL_STANCE: 'editorial_stance' as const,
    FACT_CHECKING_METHODOLOGY: 'fact_checking_methodology' as const,
    FOUNDING_YEAR: 'founding_year' as const,
    FUNDING_SOURCES: 'funding_sources' as const,
    HEADQUARTERS_LOCATION: 'headquarters_location' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    LOGO_URL: 'logo_url' as const,
    NAME: 'name' as const,
    ORGANIZATION_TYPE: 'organization_type' as const,
    OWNERSHIP_STRUCTURE: 'ownership_structure' as const,
    PARENT_ORGANIZATION_ID: 'parent_organization_id' as const,
    SOCIAL_MEDIA_LINKS: 'social_media_links' as const,
    STATED_VALUES: 'stated_values' as const,
    TRANSPARENCY_SCORE: 'transparency_score' as const,
    UPDATED_AT: 'updated_at' as const,
    WEBSITE_URL: 'website_url' as const,
  } as const,

  MEMBER_INDIVIDUAL_SETTINGS: {
    ALERT_ON_INAPPROPRIATE_CONTENT: 'alert_on_inappropriate_content' as const,
    ALLOWED_DAYS: 'allowed_days' as const,
    ALLOWED_END_TIME: 'allowed_end_time' as const,
    ALLOWED_START_TIME: 'allowed_start_time' as const,
    BLOCKED_CATEGORIES: 'blocked_categories' as const,
    CAN_ACCESS_CHAT: 'can_access_chat' as const,
    CAN_ACCESS_MULTIPLAYER: 'can_access_multiplayer' as const,
    CAN_SHARE_PROGRESS: 'can_share_progress' as const,
    CAN_VIEW_LEADERBOARDS: 'can_view_leaderboards' as const,
    CONTENT_FILTER_LEVEL: 'content_filter_level' as const,
    CREATED_AT: 'created_at' as const,
    DAILY_TIME_LIMIT_MINUTES: 'daily_time_limit_minutes' as const,
    ID: 'id' as const,
    MAX_DIFFICULTY_LEVEL: 'max_difficulty_level' as const,
    OVERRIDE_CONTENT_FILTER: 'override_content_filter' as const,
    OVERRIDE_FEATURE_ACCESS: 'override_feature_access' as const,
    OVERRIDE_MONITORING: 'override_monitoring' as const,
    OVERRIDE_TIME_LIMITS: 'override_time_limits' as const,
    POD_ID: 'pod_id' as const,
    REPORT_FREQUENCY: 'report_frequency' as const,
    SEND_PROGRESS_REPORTS: 'send_progress_reports' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  MULTIPLAYER_CHAT_MESSAGES: {
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_FROM_HOST: 'is_from_host' as const,
    IS_FROM_NPC: 'is_from_npc' as const,
    MESSAGE_TEXT: 'message_text' as const,
    MESSAGE_TYPE: 'message_type' as const,
    METADATA: 'metadata' as const,
    PLAYER_ID: 'player_id' as const,
    REPLY_TO_MESSAGE_ID: 'reply_to_message_id' as const,
    ROOM_ID: 'room_id' as const,
    TIMESTAMP: 'timestamp' as const,
  } as const,

  MULTIPLAYER_CONVERSATION_CONTEXT: {
    CONVERSATION_HISTORY: 'conversation_history' as const,
    CREATED_AT: 'created_at' as const,
    EDUCATIONAL_GOALS: 'educational_goals' as const,
    ID: 'id' as const,
    LAST_INTERACTION_AT: 'last_interaction_at' as const,
    NPC_PLAYER_ID: 'npc_player_id' as const,
    PERSONALITY_STATE: 'personality_state' as const,
    ROOM_ID: 'room_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  MULTIPLAYER_GAME_EVENTS: {
    CREATED_AT: 'created_at' as const,
    EVENT_DATA: 'event_data' as const,
    EVENT_TYPE: 'event_type' as const,
    ID: 'id' as const,
    PLAYER_ID: 'player_id' as const,
    QUESTION_NUMBER: 'question_number' as const,
    ROOM_ID: 'room_id' as const,
    SESSION_ID: 'session_id' as const,
    TIMESTAMP: 'timestamp' as const,
  } as const,

  MULTIPLAYER_GAME_SESSIONS: {
    COMPLETED_AT: 'completed_at' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_QUESTION_NUMBER: 'current_question_number' as const,
    FINAL_SCORES: 'final_scores' as const,
    GAME_MODE: 'game_mode' as const,
    ID: 'id' as const,
    PERFORMANCE_STATS: 'performance_stats' as const,
    ROOM_ID: 'room_id' as const,
    SESSION_CONFIG: 'session_config' as const,
    SESSION_NUMBER: 'session_number' as const,
    SESSION_STATUS: 'session_status' as const,
    STARTED_AT: 'started_at' as const,
    TOPIC_ID: 'topic_id' as const,
    TOTAL_QUESTIONS: 'total_questions' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  MULTIPLAYER_NPC_PLAYERS: {
    AI_BEHAVIOR_CONFIG: 'ai_behavior_config' as const,
    CREATED_AT: 'created_at' as const,
    DIFFICULTY_LEVEL: 'difficulty_level' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    NPC_ID: 'npc_id' as const,
    PERSONALITY_TYPE: 'personality_type' as const,
    PLAYER_EMOJI: 'player_emoji' as const,
    PLAYER_NAME: 'player_name' as const,
    QUESTIONS_ANSWERED: 'questions_answered' as const,
    QUESTIONS_CORRECT: 'questions_correct' as const,
    ROOM_ID: 'room_id' as const,
    SCORE: 'score' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  MULTIPLAYER_QUESTION_RESPONSES: {
    BOOSTS_USED: 'boosts_used' as const,
    CREATED_AT: 'created_at' as const,
    HINTS_USED: 'hints_used' as const,
    ID: 'id' as const,
    IS_CORRECT: 'is_correct' as const,
    NPC_PLAYER_ID: 'npc_player_id' as const,
    PLAYER_ID: 'player_id' as const,
    POINTS_EARNED: 'points_earned' as const,
    QUESTION_ID: 'question_id' as const,
    QUESTION_NUMBER: 'question_number' as const,
    RESPONSE_METADATA: 'response_metadata' as const,
    RESPONSE_TIME_MS: 'response_time_ms' as const,
    ROOM_ID: 'room_id' as const,
    SELECTED_ANSWER: 'selected_answer' as const,
    SUBMITTED_AT: 'submitted_at' as const,
    TOPIC_ID: 'topic_id' as const,
  } as const,

  MULTIPLAYER_QUIZ_ATTEMPTS: {
    ATTEMPT_DATA: 'attempt_data' as const,
    COMPLETED_AT: 'completed_at' as const,
    CREATED_AT: 'created_at' as const,
    FINAL_SCORE: 'final_score' as const,
    ID: 'id' as const,
    PLAYER_ID: 'player_id' as const,
    QUESTIONS_CORRECT: 'questions_correct' as const,
    QUESTIONS_TOTAL: 'questions_total' as const,
    ROOM_ID: 'room_id' as const,
    SESSION_ID: 'session_id' as const,
    TIME_SPENT_SECONDS: 'time_spent_seconds' as const,
    TOPIC_ID: 'topic_id' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  MULTIPLAYER_ROOM_EVENTS: {
    CREATED_AT: 'created_at' as const,
    EVENT_DATA: 'event_data' as const,
    EVENT_TYPE: 'event_type' as const,
    ID: 'id' as const,
    PLAYER_ID: 'player_id' as const,
    ROOM_ID: 'room_id' as const,
    TIMESTAMP: 'timestamp' as const,
  } as const,

  MULTIPLAYER_ROOM_PLAYERS: {
    CREATED_AT: 'created_at' as const,
    GUEST_TOKEN: 'guest_token' as const,
    ID: 'id' as const,
    IS_CONNECTED: 'is_connected' as const,
    IS_HOST: 'is_host' as const,
    IS_READY: 'is_ready' as const,
    JOIN_ORDER: 'join_order' as const,
    LAST_ACTIVITY_AT: 'last_activity_at' as const,
    PLAYER_EMOJI: 'player_emoji' as const,
    PLAYER_NAME: 'player_name' as const,
    QUESTIONS_ANSWERED: 'questions_answered' as const,
    QUESTIONS_CORRECT: 'questions_correct' as const,
    ROOM_ID: 'room_id' as const,
    SCORE: 'score' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  MULTIPLAYER_ROOMS: {
    COMPLETED_AT: 'completed_at' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_PLAYERS: 'current_players' as const,
    EXPIRES_AT: 'expires_at' as const,
    GAME_MODE: 'game_mode' as const,
    HOST_USER_ID: 'host_user_id' as const,
    ID: 'id' as const,
    MAX_PLAYERS: 'max_players' as const,
    ROOM_CODE: 'room_code' as const,
    ROOM_NAME: 'room_name' as const,
    ROOM_STATUS: 'room_status' as const,
    SETTINGS: 'settings' as const,
    STARTED_AT: 'started_at' as const,
    TOPIC_ID: 'topic_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  NEWS_CACHE: {
    ARTICLES_DATA: 'articles_data' as const,
    CACHE_KEY: 'cache_key' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    SOURCE_INFO: 'source_info' as const,
  } as const,

  NPC_CATEGORY_SPECIALIZATIONS: {
    CATEGORY: 'category' as const,
    CONFIDENCE_MODIFIER: 'confidence_modifier' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    MODIFIER_PERCENTAGE: 'modifier_percentage' as const,
    NPC_ID: 'npc_id' as const,
    SPECIALIZATION_TYPE: 'specialization_type' as const,
  } as const,

  NPC_CHAT_TEMPLATES: {
    CONTEXT_FILTER: 'context_filter' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    LAST_USED_AT: 'last_used_at' as const,
    MESSAGE_TEMPLATE: 'message_template' as const,
    MOOD_TAGS: 'mood_tags' as const,
    NPC_ID: 'npc_id' as const,
    SKILL_LEVEL_TAGS: 'skill_level_tags' as const,
    TRIGGER_TYPE: 'trigger_type' as const,
    USAGE_COUNT: 'usage_count' as const,
    VARIABLES: 'variables' as const,
  } as const,

  NPC_CONVERSATION_HISTORY: {
    CONTEXT_DATA: 'context_data' as const,
    CREATED_AT: 'created_at' as const,
    EDUCATIONAL_VALUE: 'educational_value' as const,
    FOLLOW_UP_GENERATED: 'follow_up_generated' as const,
    ID: 'id' as const,
    MESSAGE: 'message' as const,
    NPC_ID: 'npc_id' as const,
    OPENAI_METADATA: 'openai_metadata' as const,
    PERSONALITY_TRAITS: 'personality_traits' as const,
    PLAYER_ID: 'player_id' as const,
    RESPONSE_TO_USER_ID: 'response_to_user_id' as const,
    ROOM_ID: 'room_id' as const,
    TONE: 'tone' as const,
    TRIGGER_TYPE: 'trigger_type' as const,
    USER_REACTIONS: 'user_reactions' as const,
  } as const,

  NPC_LEARNING_PROGRESSION: {
    AVG_HUMAN_ACCURACY: 'avg_human_accuracy' as const,
    CATEGORY: 'category' as const,
    CONFIDENCE_TREND: 'confidence_trend' as const,
    CORRECT_RESPONSES: 'correct_responses' as const,
    CURRENT_ACCURACY: 'current_accuracy' as const,
    ID: 'id' as const,
    LAST_UPDATED: 'last_updated' as const,
    LEARNING_VELOCITY: 'learning_velocity' as const,
    NPC_ID: 'npc_id' as const,
    PERCENTILE_RANK: 'percentile_rank' as const,
    PLATEAU_INDICATOR: 'plateau_indicator' as const,
    QUESTIONS_SEEN: 'questions_seen' as const,
    TOTAL_RESPONSE_TIME: 'total_response_time' as const,
    VS_HUMANS_WIN_RATE: 'vs_humans_win_rate' as const,
  } as const,

  NPC_PERSONALITIES: {
    ADAPTATION_RATE: 'adaptation_rate' as const,
    AGE_RANGE: 'age_range' as const,
    BACKGROUND_STORY: 'background_story' as const,
    BASE_ACCURACY_MAX: 'base_accuracy_max' as const,
    BASE_ACCURACY_MIN: 'base_accuracy_min' as const,
    BASE_SKILL_LEVEL: 'base_skill_level' as const,
    BYLINE: 'byline' as const,
    CHATTINESS_LEVEL: 'chattiness_level' as const,
    COMMUNICATION_STYLE: 'communication_style' as const,
    CONFIDENCE_LEVEL: 'confidence_level' as const,
    CONSISTENCY_FACTOR: 'consistency_factor' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DISPLAY_NAME: 'display_name' as const,
    EMOJI: 'emoji' as const,
    ENCOURAGEMENT_STYLE: 'encouragement_style' as const,
    FIRST_NAME: 'first_name' as const,
    HUMOR_LEVEL: 'humor_level' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    LAST_NAME: 'last_name' as const,
    LEARNING_ENABLED: 'learning_enabled' as const,
    LEARNING_MOTIVATION: 'learning_motivation' as const,
    LOCATION: 'location' as const,
    MAX_SKILL_DRIFT: 'max_skill_drift' as const,
    NPC_CODE: 'npc_code' as const,
    PERSONALITY_TYPE: 'personality_type' as const,
    POLITICAL_ENGAGEMENT_LEVEL: 'political_engagement_level' as const,
    PREFERRED_TOPICS: 'preferred_topics' as const,
    PROFESSION: 'profession' as const,
    RESPONSE_TIME_MAX: 'response_time_max' as const,
    RESPONSE_TIME_MIN: 'response_time_min' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  NPC_QUESTION_RESPONSES: {
    ANSWERED_AT: 'answered_at' as const,
    ATTEMPT_ID: 'attempt_id' as const,
    BASE_ACCURACY_USED: 'base_accuracy_used' as const,
    CATEGORY_MODIFIER_APPLIED: 'category_modifier_applied' as const,
    CONFIDENCE_LEVEL: 'confidence_level' as const,
    CORRECT_ANSWER: 'correct_answer' as const,
    DIFFICULTY_MODIFIER_APPLIED: 'difficulty_modifier_applied' as const,
    HUMAN_RESPONSES_SEEN: 'human_responses_seen' as const,
    ID: 'id' as const,
    IS_CORRECT: 'is_correct' as const,
    LEARNING_WEIGHT: 'learning_weight' as const,
    NPC_ID: 'npc_id' as const,
    QUESTION_CATEGORY: 'question_category' as const,
    QUESTION_DIFFICULTY: 'question_difficulty' as const,
    QUESTION_ID: 'question_id' as const,
    RANDOM_VARIANCE_APPLIED: 'random_variance_applied' as const,
    RESPONSE_TIME_SECONDS: 'response_time_seconds' as const,
    SELECTED_ANSWER: 'selected_answer' as const,
  } as const,

  NPC_QUIZ_ATTEMPTS: {
    ACCURACY_PERCENTAGE: 'accuracy_percentage' as const,
    AVERAGE_HUMAN_SCORE: 'average_human_score' as const,
    COMPLETED_AT: 'completed_at' as const,
    CONFIDENCE_AVERAGE: 'confidence_average' as const,
    CORRECT_ANSWERS: 'correct_answers' as const,
    DIFFICULTY_ADJUSTMENT: 'difficulty_adjustment' as const,
    HUMAN_OPPONENTS_COUNT: 'human_opponents_count' as const,
    ID: 'id' as const,
    IS_COMPLETED: 'is_completed' as const,
    LEARNING_POINTS_GAINED: 'learning_points_gained' as const,
    MULTIPLAYER_ROOM_ID: 'multiplayer_room_id' as const,
    NPC_ID: 'npc_id' as const,
    PLACEMENT_RANK: 'placement_rank' as const,
    SCORE: 'score' as const,
    STARTED_AT: 'started_at' as const,
    TIME_SPENT_SECONDS: 'time_spent_seconds' as const,
    TOPIC_ID: 'topic_id' as const,
    TOTAL_QUESTIONS: 'total_questions' as const,
  } as const,

  ORGANIZATION_BIAS_SCORES: {
    CALCULATION_METHOD: 'calculation_method' as const,
    CONFIDENCE_LEVEL: 'confidence_level' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_SCORE: 'current_score' as const,
    DIMENSION_ID: 'dimension_id' as const,
    ID: 'id' as const,
    LAST_CALCULATED_AT: 'last_calculated_at' as const,
    ORGANIZATION_ID: 'organization_id' as const,
    SAMPLE_SIZE: 'sample_size' as const,
    SCORE_HISTORY: 'score_history' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  ORGANIZATIONS: {
    ANNUAL_BUDGET: 'annual_budget' as const,
    CIVICSENSE_PRIORITY: 'civicsense_priority' as const,
    CONTENT_REVIEW_STATUS: 'content_review_status' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    EMPLOYEE_COUNT: 'employee_count' as const,
    FOUNDING_DATE: 'founding_date' as const,
    HEADQUARTERS_LOCATION: 'headquarters_location' as const,
    ID: 'id' as const,
    INFLUENCE_LEVEL: 'influence_level' as const,
    IS_ACTIVE: 'is_active' as const,
    KEY_FOCUS_AREAS: 'key_focus_areas' as const,
    MEDIA_MENTIONS_COUNT: 'media_mentions_count' as const,
    NAME: 'name' as const,
    ORGANIZATION_TYPE: 'organization_type' as const,
    POLICY_IMPACT_SCORE: 'policy_impact_score' as const,
    POLITICAL_LEANING: 'political_leaning' as const,
    SLUG: 'slug' as const,
    SOCIAL_MEDIA_HANDLES: 'social_media_handles' as const,
    SOURCES: 'sources' as const,
    UPDATED_AT: 'updated_at' as const,
    WEBSITE_URL: 'website_url' as const,
  } as const,

  PARENTAL_CONTROLS: {
    ALERT_ON_INAPPROPRIATE_CONTENT: 'alert_on_inappropriate_content' as const,
    ALLOWED_DAYS: 'allowed_days' as const,
    ALLOWED_DIFFICULTY_MAX: 'allowed_difficulty_max' as const,
    ALLOWED_END_TIME: 'allowed_end_time' as const,
    ALLOWED_START_TIME: 'allowed_start_time' as const,
    BLOCKED_CATEGORIES: 'blocked_categories' as const,
    BLOCKED_TOPICS: 'blocked_topics' as const,
    CAN_ACCESS_CHAT: 'can_access_chat' as const,
    CAN_ACCESS_MULTIPLAYER: 'can_access_multiplayer' as const,
    CAN_SHARE_PROGRESS: 'can_share_progress' as const,
    CAN_VIEW_LEADERBOARDS: 'can_view_leaderboards' as const,
    CHILD_USER_ID: 'child_user_id' as const,
    CONTENT_FILTER_LEVEL: 'content_filter_level' as const,
    CREATED_AT: 'created_at' as const,
    DAILY_TIME_LIMIT_MINUTES: 'daily_time_limit_minutes' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    PARENT_USER_ID: 'parent_user_id' as const,
    POD_ID: 'pod_id' as const,
    REPORT_FREQUENCY: 'report_frequency' as const,
    REQUIRE_PARENT_APPROVAL_FOR_FRIENDS: 'require_parent_approval_for_friends' as const,
    SEND_PROGRESS_REPORTS: 'send_progress_reports' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  PATHWAY_SKILLS: {
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_REQUIRED: 'is_required' as const,
    PATHWAY_ID: 'pathway_id' as const,
    SEQUENCE_ORDER: 'sequence_order' as const,
    SKILL_ID: 'skill_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  POD_ACHIEVEMENTS: {
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DISPLAY_NAME: 'display_name' as const,
    EMOJI: 'emoji' as const,
    ID: 'id' as const,
    NAME: 'name' as const,
    RARITY: 'rarity' as const,
    REWARD_DATA: 'reward_data' as const,
    REWARD_TYPE: 'reward_type' as const,
    UNLOCK_CONDITION: 'unlock_condition' as const,
  } as const,

  POD_ACTIVITIES: {
    ACTIVITY_DATA: 'activity_data' as const,
    ACTIVITY_TYPE: 'activity_type' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_SHARED_PUBLICLY: 'is_shared_publicly' as const,
    IS_VISIBLE_TO_POD: 'is_visible_to_pod' as const,
    POD_ID: 'pod_id' as const,
    USER_ID: 'user_id' as const,
  } as const,

  POD_ACTIVITY_LOG: {
    ACTIVITY_DATA: 'activity_data' as const,
    ACTIVITY_TYPE: 'activity_type' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IP_ADDRESS: 'ip_address' as const,
    POD_ID: 'pod_id' as const,
    SESSION_ID: 'session_id' as const,
    USER_AGENT: 'user_agent' as const,
    USER_ID: 'user_id' as const,
  } as const,

  POD_ANALYTICS: {
    ACTIVE_MEMBERS_TODAY: 'active_members_today' as const,
    ACTIVE_MEMBERS_WEEK: 'active_members_week' as const,
    AVERAGE_ACCURACY: 'average_accuracy' as const,
    AVERAGE_SESSION_LENGTH_MINUTES: 'average_session_length_minutes' as const,
    CATEGORY_PERFORMANCE: 'category_performance' as const,
    CREATED_AT: 'created_at' as const,
    DATE_RECORDED: 'date_recorded' as const,
    DIFFICULTY_DISTRIBUTION: 'difficulty_distribution' as const,
    FRIEND_REQUESTS_SENT: 'friend_requests_sent' as const,
    ID: 'id' as const,
    MESSAGES_SENT: 'messages_sent' as const,
    MOST_POPULAR_TOPICS: 'most_popular_topics' as const,
    MULTIPLAYER_SESSIONS: 'multiplayer_sessions' as const,
    NEW_MEMBERS_TODAY: 'new_members_today' as const,
    POD_ID: 'pod_id' as const,
    TOTAL_ACHIEVEMENTS_EARNED: 'total_achievements_earned' as const,
    TOTAL_CORRECT_ANSWERS: 'total_correct_answers' as const,
    TOTAL_MEMBERS: 'total_members' as const,
    TOTAL_QUESTIONS_ANSWERED: 'total_questions_answered' as const,
    TOTAL_QUIZ_ATTEMPTS: 'total_quiz_attempts' as const,
    TOTAL_STREAKS_STARTED: 'total_streaks_started' as const,
    TOTAL_TIME_SPENT_MINUTES: 'total_time_spent_minutes' as const,
  } as const,

  POD_CHALLENGE_PARTICIPANTS: {
    CHALLENGE_ID: 'challenge_id' as const,
    COMPLETED_AT: 'completed_at' as const,
    CURRENT_PROGRESS: 'current_progress' as const,
    FINAL_SCORE: 'final_score' as const,
    ID: 'id' as const,
    JOINED_AT: 'joined_at' as const,
    RANK_POSITION: 'rank_position' as const,
    USER_ID: 'user_id' as const,
  } as const,

  POD_CHALLENGES: {
    CHALLENGE_DESCRIPTION: 'challenge_description' as const,
    CHALLENGE_NAME: 'challenge_name' as const,
    CHALLENGE_TYPE: 'challenge_type' as const,
    CREATED_AT: 'created_at' as const,
    CREATED_BY: 'created_by' as const,
    END_DATE: 'end_date' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    POD_ID: 'pod_id' as const,
    REWARD_DATA: 'reward_data' as const,
    REWARD_TYPE: 'reward_type' as const,
    START_DATE: 'start_date' as const,
    TARGET_METRIC: 'target_metric' as const,
  } as const,

  POD_INVITE_LINKS: {
    AGE_RESTRICTIONS: 'age_restrictions' as const,
    ALLOWED_ROLES: 'allowed_roles' as const,
    CREATED_AT: 'created_at' as const,
    CREATED_BY: 'created_by' as const,
    CURRENT_USES: 'current_uses' as const,
    DESCRIPTION: 'description' as const,
    EXPIRES_AT: 'expires_at' as const,
    ID: 'id' as const,
    INVITE_CODE: 'invite_code' as const,
    INVITE_URL: 'invite_url' as const,
    IS_ACTIVE: 'is_active' as const,
    MAX_USES: 'max_uses' as const,
    POD_ID: 'pod_id' as const,
    REQUIRE_APPROVAL: 'require_approval' as const,
  } as const,

  POD_JOIN_REQUESTS: {
    CREATED_AT: 'created_at' as const,
    EXPIRES_AT: 'expires_at' as const,
    ID: 'id' as const,
    INVITE_LINK_ID: 'invite_link_id' as const,
    MESSAGE: 'message' as const,
    POD_ID: 'pod_id' as const,
    REQUESTED_ROLE: 'requested_role' as const,
    REQUESTER_AGE: 'requester_age' as const,
    REQUESTER_ID: 'requester_id' as const,
    REVIEW_MESSAGE: 'review_message' as const,
    REVIEWED_AT: 'reviewed_at' as const,
    REVIEWED_BY: 'reviewed_by' as const,
    STATUS: 'status' as const,
  } as const,

  POD_MEMBER_ANALYTICS: {
    ACCURACY_RATE: 'accuracy_rate' as const,
    ACHIEVEMENTS_EARNED: 'achievements_earned' as const,
    AVERAGE_DIFFICULTY: 'average_difficulty' as const,
    CORRECT_ANSWERS: 'correct_answers' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_STREAK: 'current_streak' as const,
    DATE_RECORDED: 'date_recorded' as const,
    DIFFICULTY_PROGRESSION: 'difficulty_progression' as const,
    HELP_PROVIDED: 'help_provided' as const,
    HELP_REQUESTS_SENT: 'help_requests_sent' as const,
    ID: 'id' as const,
    LONGEST_SESSION_MINUTES: 'longest_session_minutes' as const,
    LONGEST_STREAK: 'longest_streak' as const,
    MESSAGES_SENT: 'messages_sent' as const,
    MULTIPLAYER_PARTICIPATIONS: 'multiplayer_participations' as const,
    POD_ID: 'pod_id' as const,
    QUESTIONS_ANSWERED: 'questions_answered' as const,
    QUIZ_ATTEMPTS: 'quiz_attempts' as const,
    SESSIONS_COUNT: 'sessions_count' as const,
    TIME_SPENT_MINUTES: 'time_spent_minutes' as const,
    TOPICS_COMPLETED: 'topics_completed' as const,
    USER_ID: 'user_id' as const,
  } as const,

  POD_MEMBER_SETTINGS: {
    ALERT_ON_INAPPROPRIATE_CONTENT: 'alert_on_inappropriate_content' as const,
    ALLOW_SENSITIVE_TOPICS: 'allow_sensitive_topics' as const,
    ALLOWED_DAYS: 'allowed_days' as const,
    ALLOWED_END_TIME: 'allowed_end_time' as const,
    ALLOWED_START_TIME: 'allowed_start_time' as const,
    BLOCKED_CATEGORIES: 'blocked_categories' as const,
    CAN_ACCESS_CHAT: 'can_access_chat' as const,
    CAN_ACCESS_MULTIPLAYER: 'can_access_multiplayer' as const,
    CAN_SHARE_PROGRESS: 'can_share_progress' as const,
    CAN_VIEW_LEADERBOARDS: 'can_view_leaderboards' as const,
    CONTENT_FILTER_LEVEL: 'content_filter_level' as const,
    CREATED_AT: 'created_at' as const,
    DAILY_TIME_LIMIT_MINUTES: 'daily_time_limit_minutes' as const,
    ID: 'id' as const,
    MAX_DIFFICULTY_LEVEL: 'max_difficulty_level' as const,
    OVERRIDE_CONTENT_FILTER: 'override_content_filter' as const,
    OVERRIDE_FEATURE_ACCESS: 'override_feature_access' as const,
    OVERRIDE_MONITORING: 'override_monitoring' as const,
    OVERRIDE_TIME_LIMITS: 'override_time_limits' as const,
    POD_ID: 'pod_id' as const,
    REPORT_FREQUENCY: 'report_frequency' as const,
    SEND_PROGRESS_REPORTS: 'send_progress_reports' as const,
    TRACK_DETAILED_ACTIVITY: 'track_detailed_activity' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  POD_MEMBERSHIPS: {
    BIRTH_DATE: 'birth_date' as const,
    CAN_INVITE_MEMBERS: 'can_invite_members' as const,
    CAN_MESSAGE: 'can_message' as const,
    CAN_MODIFY_SETTINGS: 'can_modify_settings' as const,
    CAN_VIEW_PROGRESS: 'can_view_progress' as const,
    CREATED_AT: 'created_at' as const,
    GRADE_LEVEL: 'grade_level' as const,
    ID: 'id' as const,
    INVITED_BY: 'invited_by' as const,
    JOINED_AT: 'joined_at' as const,
    MEMBERSHIP_STATUS: 'membership_status' as const,
    PARENTAL_CONSENT: 'parental_consent' as const,
    POD_ID: 'pod_id' as const,
    ROLE: 'role' as const,
    USER_ID: 'user_id' as const,
  } as const,

  POD_PARTNERSHIPS: {
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    INITIATED_BY: 'initiated_by' as const,
    PARTNERSHIP_DATA: 'partnership_data' as const,
    PARTNERSHIP_TYPE: 'partnership_type' as const,
    POD_1_ID: 'pod_1_id' as const,
    POD_2_ID: 'pod_2_id' as const,
    STATUS: 'status' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  POD_RATINGS: {
    COMMUNITY_RATING: 'community_rating' as const,
    CONTENT_QUALITY_RATING: 'content_quality_rating' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_ANONYMOUS: 'is_anonymous' as const,
    IS_PUBLIC: 'is_public' as const,
    ORGANIZATION_RATING: 'organization_rating' as const,
    POD_ID: 'pod_id' as const,
    RATING: 'rating' as const,
    REVIEW: 'review' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  POD_SETTINGS: {
    ALERT_ON_INAPPROPRIATE_CONTENT: 'alert_on_inappropriate_content' as const,
    ALLOW_SENSITIVE_TOPICS: 'allow_sensitive_topics' as const,
    ALLOWED_DAYS: 'allowed_days' as const,
    ALLOWED_END_TIME: 'allowed_end_time' as const,
    ALLOWED_START_TIME: 'allowed_start_time' as const,
    BLOCKED_CATEGORIES: 'blocked_categories' as const,
    CAN_ACCESS_CHAT: 'can_access_chat' as const,
    CAN_ACCESS_MULTIPLAYER: 'can_access_multiplayer' as const,
    CAN_SHARE_PROGRESS: 'can_share_progress' as const,
    CAN_VIEW_LEADERBOARDS: 'can_view_leaderboards' as const,
    CREATED_AT: 'created_at' as const,
    DAILY_TIME_LIMIT_MINUTES: 'daily_time_limit_minutes' as const,
    DESCRIPTION: 'description' as const,
    ID: 'id' as const,
    IS_PUBLIC: 'is_public' as const,
    MAX_DIFFICULTY_LEVEL: 'max_difficulty_level' as const,
    POD_ID: 'pod_id' as const,
    REPORT_FREQUENCY: 'report_frequency' as const,
    REQUIRE_PARENT_APPROVAL_FOR_FRIENDS: 'require_parent_approval_for_friends' as const,
    SEND_PROGRESS_REPORTS: 'send_progress_reports' as const,
    TRACK_DETAILED_ACTIVITY: 'track_detailed_activity' as const,
    UPDATED_AT: 'updated_at' as const,
    WELCOME_MESSAGE: 'welcome_message' as const,
  } as const,

  POD_THEMES: {
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DISPLAY_NAME: 'display_name' as const,
    EMOJI: 'emoji' as const,
    ID: 'id' as const,
    IS_SEASONAL: 'is_seasonal' as const,
    NAME: 'name' as const,
    PRIMARY_COLOR: 'primary_color' as const,
    SEASON_END: 'season_end' as const,
    SEASON_START: 'season_start' as const,
    SECONDARY_COLOR: 'secondary_color' as const,
    UNLOCK_CONDITION: 'unlock_condition' as const,
  } as const,

  PROFILES: {
    ACHIEVEMENT_BADGES: 'achievement_badges' as const,
    AVATAR_URL: 'avatar_url' as const,
    ENGAGEMENT_LEVEL: 'engagement_level' as const,
    FOCUS_AREAS: 'focus_areas' as const,
    FULL_NAME: 'full_name' as const,
    HIGH_CONTRAST_MODE: 'high_contrast_mode' as const,
    ID: 'id' as const,
    IS_ADMIN: 'is_admin' as const,
    PREFERRED_LANGUAGE: 'preferred_language' as const,
    PREFERRED_POD_PERSONALITY: 'preferred_pod_personality' as const,
    SENSORY_FRIENDLY_MODE: 'sensory_friendly_mode' as const,
    TOTAL_ACHIEVEMENTS: 'total_achievements' as const,
    UPDATED_AT: 'updated_at' as const,
    USERNAME: 'username' as const,
    WEBSITE: 'website' as const,
  } as const,

  PROGRESS_QUESTION_RESPONSES: {
    ANSWERED_AT: 'answered_at' as const,
    ATTEMPT_NUMBER: 'attempt_number' as const,
    BOOST_USED: 'boost_used' as const,
    HINT_USED: 'hint_used' as const,
    ID: 'id' as const,
    IS_CORRECT: 'is_correct' as const,
    PROGRESS_SESSION_ID: 'progress_session_id' as const,
    QUESTION_ID: 'question_id' as const,
    QUESTION_INDEX: 'question_index' as const,
    TIME_SPENT_SECONDS: 'time_spent_seconds' as const,
    USER_ANSWER: 'user_answer' as const,
  } as const,

  PROGRESS_SESSIONS: {
    ANSWERS: 'answers' as const,
    ASSESSMENT_TYPE: 'assessment_type' as const,
    CATEGORY_PERFORMANCE: 'category_performance' as const,
    CLASSROOM_ASSIGNMENT_ID: 'classroom_assignment_id' as const,
    CLASSROOM_COURSE_ID: 'classroom_course_id' as const,
    CLEVER_ASSIGNMENT_ID: 'clever_assignment_id' as const,
    CLEVER_SECTION_ID: 'clever_section_id' as const,
    CURRENT_QUESTION_INDEX: 'current_question_index' as const,
    EXPIRES_AT: 'expires_at' as const,
    GUEST_TOKEN: 'guest_token' as const,
    ID: 'id' as const,
    LAST_UPDATED_AT: 'last_updated_at' as const,
    MAX_STREAK: 'max_streak' as const,
    METADATA: 'metadata' as const,
    QUESTIONS: 'questions' as const,
    RESPONSE_TIMES: 'response_times' as const,
    SESSION_ID: 'session_id' as const,
    SESSION_TYPE: 'session_type' as const,
    STARTED_AT: 'started_at' as const,
    STREAK: 'streak' as const,
    TEST_TYPE: 'test_type' as const,
    TOPIC_ID: 'topic_id' as const,
    USER_ID: 'user_id' as const,
  } as const,

  PUBLIC_FIGURES: {
    BILLS_SPONSORED: 'bills_sponsored' as const,
    BIRTH_STATE: 'birth_state' as const,
    BIRTH_YEAR: 'birth_year' as const,
    BOOK_PUBLICATIONS: 'book_publications' as const,
    CAREER_HIGHLIGHTS: 'career_highlights' as const,
    CIVICSENSE_PRIORITY: 'civicsense_priority' as const,
    COMMITTEE_MEMBERSHIPS: 'committee_memberships' as const,
    CONTENT_DIFFICULTY_LEVEL: 'content_difficulty_level' as const,
    CONTENT_REVIEW_STATUS: 'content_review_status' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_POSITIONS: 'current_positions' as const,
    CURRENT_RESIDENCE_STATE: 'current_residence_state' as const,
    DISPLAY_NAME: 'display_name' as const,
    EDUCATION_BACKGROUND: 'education_background' as const,
    FACT_CHECK_STATUS: 'fact_check_status' as const,
    FINANCIAL_INTERESTS: 'financial_interests' as const,
    FULL_NAME: 'full_name' as const,
    ID: 'id' as const,
    INFLUENCE_LEVEL: 'influence_level' as const,
    IS_ACTIVE: 'is_active' as const,
    KEY_POLICIES_SUPPORTED: 'key_policies_supported' as const,
    KEY_POSITIONS: 'key_positions' as const,
    KEY_VOTES: 'key_votes' as const,
    LAST_QUIZ_TOPIC_GENERATED: 'last_quiz_topic_generated' as const,
    MAJOR_SPEECHES: 'major_speeches' as const,
    MEDIA_APPEARANCES_COUNT: 'media_appearances_count' as const,
    NET_WORTH_ESTIMATE: 'net_worth_estimate' as const,
    NOTABLE_CONTROVERSIES: 'notable_controversies' as const,
    PARTY_AFFILIATION: 'party_affiliation' as const,
    POLICY_FLIP_FLOPS: 'policy_flip_flops' as const,
    PRIMARY_ROLE_CATEGORY: 'primary_role_category' as const,
    QUOTABLE_STATEMENTS: 'quotable_statements' as const,
    REGION: 'region' as const,
    SCANDALS_TIMELINE: 'scandals_timeline' as const,
    SLUG: 'slug' as const,
    SOCIAL_MEDIA_HANDLES: 'social_media_handles' as const,
    SOURCES: 'sources' as const,
    TRUMP_RELATIONSHIP_TYPE: 'trump_relationship_type' as const,
    UPDATED_AT: 'updated_at' as const,
    VOTING_RECORD_URL: 'voting_record_url' as const,
  } as const,

  QUESTION_ANALYTICS: {
    ID: 'id' as const,
    IS_CORRECT: 'is_correct' as const,
    QUESTION_ID: 'question_id' as const,
    SELECTED_ANSWER: 'selected_answer' as const,
    TIME_SPENT_SECONDS: 'time_spent_seconds' as const,
    TIMESTAMP: 'timestamp' as const,
    USER_ID: 'user_id' as const,
  } as const,

  QUESTION_FEEDBACK: {
    CREATED_AT: 'created_at' as const,
    FEEDBACK_TYPE: 'feedback_type' as const,
    ID: 'id' as const,
    QUESTION_ID: 'question_id' as const,
    RATING: 'rating' as const,
    REPORT_DETAILS: 'report_details' as const,
    REPORT_REASON: 'report_reason' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  QUESTION_SKILLS: {
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_PRIMARY_SKILL: 'is_primary_skill' as const,
    QUESTION_ID: 'question_id' as const,
    SKILL_ID: 'skill_id' as const,
    SKILL_WEIGHT: 'skill_weight' as const,
  } as const,

  QUESTION_SOURCE_LINKS: {
    CREATED_AT: 'created_at' as const,
    DISPLAY_ORDER: 'display_order' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    IS_PRIMARY_SOURCE: 'is_primary_source' as const,
    QUESTION_ID: 'question_id' as const,
    RELEVANCE_SCORE: 'relevance_score' as const,
    SHOW_THUMBNAIL: 'show_thumbnail' as const,
    SOURCE_METADATA_ID: 'source_metadata_id' as const,
    SOURCE_NAME: 'source_name' as const,
    SOURCE_TYPE: 'source_type' as const,
  } as const,

  QUESTION_TOPICS: {
    CATEGORIES: 'categories' as const,
    CREATED_AT: 'created_at' as const,
    DATE: 'date' as const,
    DAY_OF_WEEK: 'day_of_week' as const,
    DESCRIPTION: 'description' as const,
    EMOJI: 'emoji' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    IS_BREAKING: 'is_breaking' as const,
    IS_FEATURED: 'is_featured' as const,
    TOPIC_ID: 'topic_id' as const,
    TOPIC_TITLE: 'topic_title' as const,
    TRANSLATIONS: 'translations' as const,
    UPDATED_AT: 'updated_at' as const,
    WHY_THIS_MATTERS: 'why_this_matters' as const,
  } as const,

  QUESTIONS: {
    CATEGORY: 'category' as const,
    CORRECT_ANSWER: 'correct_answer' as const,
    CREATED_AT: 'created_at' as const,
    DIFFICULTY_LEVEL: 'difficulty_level' as const,
    EXPLANATION: 'explanation' as const,
    FACT_CHECK_NOTES: 'fact_check_notes' as const,
    FACT_CHECK_STATUS: 'fact_check_status' as const,
    HINT: 'hint' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    LAST_FACT_CHECK: 'last_fact_check' as const,
    OPTION_A: 'option_a' as const,
    OPTION_B: 'option_b' as const,
    OPTION_C: 'option_c' as const,
    OPTION_D: 'option_d' as const,
    QUESTION: 'question' as const,
    QUESTION_NUMBER: 'question_number' as const,
    QUESTION_TYPE: 'question_type' as const,
    SOURCES: 'sources' as const,
    TAGS: 'tags' as const,
    TOPIC_ID: 'topic_id' as const,
    TRANSLATIONS: 'translations' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  QUESTIONS_TEST: {
    CATEGORY: 'category' as const,
    CORRECT_ANSWER: 'correct_answer' as const,
    CREATED_AT: 'created_at' as const,
    DIFFICULTY_LEVEL: 'difficulty_level' as const,
    EXPLANATION: 'explanation' as const,
    HINT: 'hint' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    OPTION_A: 'option_a' as const,
    OPTION_B: 'option_b' as const,
    OPTION_C: 'option_c' as const,
    OPTION_D: 'option_d' as const,
    QUESTION: 'question' as const,
    QUESTION_NUMBER: 'question_number' as const,
    QUESTION_TYPE: 'question_type' as const,
    SOURCES: 'sources' as const,
    TAGS: 'tags' as const,
    TOPIC_ID: 'topic_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SCHEDULED_CONTENT_JOBS: {
    AVG_EXECUTION_TIME_MS: 'avg_execution_time_ms' as const,
    CONSECUTIVE_FAILURES: 'consecutive_failures' as const,
    CREATED_AT: 'created_at' as const,
    CREATED_BY: 'created_by' as const,
    DESCRIPTION: 'description' as const,
    GENERATION_SETTINGS: 'generation_settings' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    JOB_TYPE: 'job_type' as const,
    LAST_RUN_AT: 'last_run_at' as const,
    LAST_RUN_RESULT: 'last_run_result' as const,
    LAST_RUN_STATUS: 'last_run_status' as const,
    MAX_FAILURES: 'max_failures' as const,
    NAME: 'name' as const,
    NEXT_RUN_AT: 'next_run_at' as const,
    SCHEDULE_CONFIG: 'schedule_config' as const,
    SUCCESSFUL_RUNS: 'successful_runs' as const,
    TOTAL_CONTENT_GENERATED: 'total_content_generated' as const,
    TOTAL_RUNS: 'total_runs' as const,
    UPDATED_AT: 'updated_at' as const,
    UPDATED_BY: 'updated_by' as const,
  } as const,

  SHAREABLE_GIFT_LINKS: {
    ACCESS_TYPE: 'access_type' as const,
    CREATED_AT: 'created_at' as const,
    CUSTOM_SLUG: 'custom_slug' as const,
    DONOR_USER_ID: 'donor_user_id' as const,
    EXPIRES_AT: 'expires_at' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    LINK_CODE: 'link_code' as const,
    MAX_USES_PER_EMAIL: 'max_uses_per_email' as const,
    MESSAGE: 'message' as const,
    SOURCE_DONATION_AMOUNT: 'source_donation_amount' as const,
    SOURCE_STRIPE_SESSION_ID: 'source_stripe_session_id' as const,
    TITLE: 'title' as const,
    TOTAL_CREDITS: 'total_credits' as const,
    UPDATED_AT: 'updated_at' as const,
    USED_CREDITS: 'used_credits' as const,
  } as const,

  SHAREABLE_LINK_CLAIMS: {
    ACCESS_TYPE: 'access_type' as const,
    CLAIMED_AT: 'claimed_at' as const,
    CLAIMER_EMAIL: 'claimer_email' as const,
    CLAIMER_USER_ID: 'claimer_user_id' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IP_ADDRESS: 'ip_address' as const,
    SHAREABLE_LINK_ID: 'shareable_link_id' as const,
    USER_AGENT: 'user_agent' as const,
  } as const,

  SHARED_COLLECTION_ACCESS: {
    COLLECTION_ID: 'collection_id' as const,
    CREATED_AT: 'created_at' as const,
    EXPIRES_AT: 'expires_at' as const,
    ID: 'id' as const,
    PERMISSION_LEVEL: 'permission_level' as const,
    SHARE_CODE: 'share_code' as const,
    SHARED_BY_USER_ID: 'shared_by_user_id' as const,
    SHARED_WITH_EMAIL: 'shared_with_email' as const,
    SHARED_WITH_USER_ID: 'shared_with_user_id' as const,
  } as const,

  SKILL_ASSESSMENT_CRITERIA: {
    ASSESSMENT_METHOD: 'assessment_method' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    PASSING_CRITERIA: 'passing_criteria' as const,
    PROFICIENCY_LEVEL: 'proficiency_level' as const,
    SKILL_ID: 'skill_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SKILL_BADGES: {
    BADGE_DESCRIPTION: 'badge_description' as const,
    BADGE_ICON: 'badge_icon' as const,
    BADGE_LEVEL: 'badge_level' as const,
    BADGE_NAME: 'badge_name' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SKILL_CATEGORIES: {
    CATEGORY_NAME: 'category_name' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DISPLAY_NAME: 'display_name' as const,
    DISPLAY_ORDER: 'display_order' as const,
    EMOJI: 'emoji' as const,
    ID: 'id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SKILL_LEARNING_OBJECTIVES: {
    CREATED_AT: 'created_at' as const,
    DISPLAY_ORDER: 'display_order' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    MASTERY_LEVEL_REQUIRED: 'mastery_level_required' as const,
    OBJECTIVE_TEXT: 'objective_text' as const,
    OBJECTIVE_TYPE: 'objective_type' as const,
    SKILL_ID: 'skill_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SKILL_MASTERY_TRACKING: {
    COMPLETED_OBJECTIVES: 'completed_objectives' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_MASTERY_LEVEL: 'current_mastery_level' as const,
    ID: 'id' as const,
    LAST_ACTIVITY_DATE: 'last_activity_date' as const,
    PROGRESS_PERCENTAGE: 'progress_percentage' as const,
    SKILL_ID: 'skill_id' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  SKILL_PRACTICE_RECOMMENDATIONS: {
    CREATED_AT: 'created_at' as const,
    DIFFICULTY_LEVEL: 'difficulty_level' as const,
    ESTIMATED_MINUTES: 'estimated_minutes' as const,
    ID: 'id' as const,
    PRACTICE_DESCRIPTION: 'practice_description' as const,
    PRACTICE_TYPE: 'practice_type' as const,
    SKILL_ID: 'skill_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SKILL_PREREQUISITES: {
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_STRICT_REQUIREMENT: 'is_strict_requirement' as const,
    PREREQUISITE_SKILL_ID: 'prerequisite_skill_id' as const,
    REQUIRED_MASTERY_LEVEL: 'required_mastery_level' as const,
    SKILL_ID: 'skill_id' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SKILL_PROGRESSION_PATHWAYS: {
    CREATED_AT: 'created_at' as const,
    DIFFICULTY_LEVEL: 'difficulty_level' as const,
    ESTIMATED_HOURS: 'estimated_hours' as const,
    ID: 'id' as const,
    PATHWAY_DESCRIPTION: 'pathway_description' as const,
    PATHWAY_NAME: 'pathway_name' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SKILL_RELATIONSHIPS: {
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_STRICT_REQUIREMENT: 'is_strict_requirement' as const,
    RELATIONSHIP_TYPE: 'relationship_type' as const,
    REQUIRED_MASTERY_LEVEL: 'required_mastery_level' as const,
    SOURCE_SKILL_ID: 'source_skill_id' as const,
    TARGET_SKILL_ID: 'target_skill_id' as const,
  } as const,

  SKILLS: {
    CATEGORY_ID: 'category_id' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    DIFFICULTY_LEVEL: 'difficulty_level' as const,
    DISPLAY_ORDER: 'display_order' as const,
    EMOJI: 'emoji' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    IS_CORE_SKILL: 'is_core_skill' as const,
    PARENT_SKILL_ID: 'parent_skill_id' as const,
    SKILL_NAME: 'skill_name' as const,
    SKILL_SLUG: 'skill_slug' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SOURCE_CREDIBILITY_INDICATORS: {
    CREATED_AT: 'created_at' as const,
    FABRICATION_SCANDALS_COUNT: 'fabrication_scandals_count' as const,
    FACT_CHECKING_PARTNERSHIPS: 'fact_checking_partnerships' as const,
    ID: 'id' as const,
    MAJOR_CORRECTIONS_COUNT: 'major_corrections_count' as const,
    MAJOR_MISREPORTING_INCIDENTS: 'major_misreporting_incidents' as const,
    ORGANIZATION_ID: 'organization_id' as const,
    PRESS_ASSOCIATIONS: 'press_associations' as const,
    PRESS_FREEDOM_SCORE: 'press_freedom_score' as const,
    PULITZER_PRIZES: 'pulitzer_prizes' as const,
    TRANSPARENCY_REPORT_URL: 'transparency_report_url' as const,
    UPDATED_AT: 'updated_at' as const,
    VERIFIED_SCOOPS_COUNT: 'verified_scoops_count' as const,
  } as const,

  SOURCE_FETCH_QUEUE: {
    CREATED_AT: 'created_at' as const,
    ERROR_MESSAGE: 'error_message' as const,
    FETCH_TYPE: 'fetch_type' as const,
    ID: 'id' as const,
    LAST_ATTEMPT_AT: 'last_attempt_at' as const,
    MAX_RETRIES: 'max_retries' as const,
    PRIORITY: 'priority' as const,
    RETRY_COUNT: 'retry_count' as const,
    SCHEDULED_FOR: 'scheduled_for' as const,
    URL: 'url' as const,
  } as const,

  SOURCE_METADATA: {
    AUTHOR: 'author' as const,
    BIAS_RATING: 'bias_rating' as const,
    CANONICAL_URL: 'canonical_url' as const,
    CONTENT_TYPE: 'content_type' as const,
    CREATED_AT: 'created_at' as const,
    CREDIBILITY_SCORE: 'credibility_score' as const,
    DESCRIPTION: 'description' as const,
    DOMAIN: 'domain' as const,
    FAVICON_URL: 'favicon_url' as const,
    FETCH_ERROR: 'fetch_error' as const,
    FETCH_STATUS: 'fetch_status' as const,
    HAS_HTTPS: 'has_https' as const,
    HAS_VALID_SSL: 'has_valid_ssl' as const,
    ID: 'id' as const,
    IS_ACCESSIBLE: 'is_accessible' as const,
    IS_ACTIVE: 'is_active' as const,
    LANGUAGE: 'language' as const,
    LAST_FETCHED_AT: 'last_fetched_at' as const,
    MODIFIED_TIME: 'modified_time' as const,
    OG_DESCRIPTION: 'og_description' as const,
    OG_IMAGE: 'og_image' as const,
    OG_SITE_NAME: 'og_site_name' as const,
    OG_TITLE: 'og_title' as const,
    OG_TYPE: 'og_type' as const,
    PUBLISHED_TIME: 'published_time' as const,
    RESPONSE_TIME_MS: 'response_time_ms' as const,
    TITLE: 'title' as const,
    TWITTER_DESCRIPTION: 'twitter_description' as const,
    TWITTER_IMAGE: 'twitter_image' as const,
    TWITTER_TITLE: 'twitter_title' as const,
    UPDATED_AT: 'updated_at' as const,
    URL: 'url' as const,
  } as const,

  SPACED_REPETITION_SCHEDULE: {
    CREATED_AT: 'created_at' as const,
    EASINESS_FACTOR: 'easiness_factor' as const,
    ID: 'id' as const,
    INTERVAL_DAYS: 'interval_days' as const,
    NEXT_REVIEW_DATE: 'next_review_date' as const,
    REPETITION_COUNT: 'repetition_count' as const,
    SKILL_ID: 'skill_id' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  SUBSCRIPTION_TIER_LIMITS: {
    ADVANCED_ANALYTICS: 'advanced_analytics' as const,
    CREATED_AT: 'created_at' as const,
    CUSTOM_DECKS_LIMIT: 'custom_decks_limit' as const,
    EXPORT_DATA: 'export_data' as const,
    HISTORICAL_MONTHS_LIMIT: 'historical_months_limit' as const,
    LEARNING_INSIGHTS: 'learning_insights' as const,
    OFFLINE_MODE: 'offline_mode' as const,
    PRIORITY_SUPPORT: 'priority_support' as const,
    SPACED_REPETITION: 'spaced_repetition' as const,
    TIER: 'tier' as const,
  } as const,

  SURVEY_ANSWERS: {
    ANSWER_DATA: 'answer_data' as const,
    ANSWERED_AT: 'answered_at' as const,
    ID: 'id' as const,
    QUESTION_ID: 'question_id' as const,
    RESPONSE_ID: 'response_id' as const,
  } as const,

  SURVEY_LEARNING_GOALS: {
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    QUESTION_MAPPINGS: 'question_mappings' as const,
    SKILL_ID: 'skill_id' as const,
    SURVEY_ID: 'survey_id' as const,
    WEIGHT: 'weight' as const,
  } as const,

  SURVEY_QUESTIONS: {
    CONDITIONAL_LOGIC: 'conditional_logic' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    ID: 'id' as const,
    OPTIONS: 'options' as const,
    QUESTION_ORDER: 'question_order' as const,
    QUESTION_TEXT: 'question_text' as const,
    QUESTION_TYPE: 'question_type' as const,
    REQUIRED: 'required' as const,
    SCALE_CONFIG: 'scale_config' as const,
    SURVEY_ID: 'survey_id' as const,
    TRANSLATIONS: 'translations' as const,
  } as const,

  SURVEY_RECOMMENDATIONS: {
    BASED_ON_RESPONSES: 'based_on_responses' as const,
    CLICKED_ITEMS: 'clicked_items' as const,
    GENERATED_AT: 'generated_at' as const,
    GUEST_TOKEN: 'guest_token' as const,
    ID: 'id' as const,
    RECOMMENDED_CONTENT: 'recommended_content' as const,
    SURVEY_ID: 'survey_id' as const,
    USER_ID: 'user_id' as const,
    VIEWED_AT: 'viewed_at' as const,
  } as const,

  SURVEY_RESPONSES: {
    COMPLETED_AT: 'completed_at' as const,
    CREATED_AT: 'created_at' as const,
    GUEST_TOKEN: 'guest_token' as const,
    ID: 'id' as const,
    IP_ADDRESS: 'ip_address' as const,
    IS_COMPLETE: 'is_complete' as const,
    SESSION_ID: 'session_id' as const,
    STARTED_AT: 'started_at' as const,
    SURVEY_ID: 'survey_id' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_AGENT: 'user_agent' as const,
    USER_ID: 'user_id' as const,
  } as const,

  SURVEYS: {
    ALLOW_ANONYMOUS: 'allow_anonymous' as const,
    ALLOW_PARTIAL_RESPONSES: 'allow_partial_responses' as const,
    CLOSED_AT: 'closed_at' as const,
    CREATED_AT: 'created_at' as const,
    CREATED_BY: 'created_by' as const,
    DESCRIPTION: 'description' as const,
    ESTIMATED_TIME: 'estimated_time' as const,
    ID: 'id' as const,
    POST_COMPLETION_CONFIG: 'post_completion_config' as const,
    PUBLISHED_AT: 'published_at' as const,
    STATUS: 'status' as const,
    TITLE: 'title' as const,
    TRANSLATIONS: 'translations' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  SYSTEM_ALERTS: {
    ALERT_TYPE: 'alert_type' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    MESSAGE: 'message' as const,
    METADATA: 'metadata' as const,
    RESOLVED: 'resolved' as const,
    RESOLVED_AT: 'resolved_at' as const,
    SEVERITY: 'severity' as const,
  } as const,

  TRANSLATION_JOBS: {
    CHARACTER_COUNT: 'character_count' as const,
    COMPLETED_AT: 'completed_at' as const,
    CONTENT_ID: 'content_id' as const,
    CONTENT_TYPE: 'content_type' as const,
    CREATED_AT: 'created_at' as const,
    ERROR: 'error' as const,
    ESTIMATED_COMPLETION: 'estimated_completion' as const,
    ID: 'id' as const,
    PRIORITY: 'priority' as const,
    PROGRESS: 'progress' as const,
    QUEUE_FOR_REVIEW: 'queue_for_review' as const,
    RETRY_COUNT: 'retry_count' as const,
    STARTED_AT: 'started_at' as const,
    STATUS: 'status' as const,
    TARGET_LANGUAGE: 'target_language' as const,
    UPDATED_AT: 'updated_at' as const,
  } as const,

  USER_ACHIEVEMENTS: {
    ACHIEVEMENT_DATA: 'achievement_data' as const,
    ACHIEVEMENT_TYPE: 'achievement_type' as const,
    EARNED_AT: 'earned_at' as const,
    ID: 'id' as const,
    IS_MILESTONE: 'is_milestone' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_ACTIVE_BOOSTS: {
    BOOST_DATA: 'boost_data' as const,
    BOOST_TYPE: 'boost_type' as const,
    CREATED_AT: 'created_at' as const,
    EXPIRES_AT: 'expires_at' as const,
    ID: 'id' as const,
    STARTED_AT: 'started_at' as const,
    USER_ID: 'user_id' as const,
    USES_REMAINING: 'uses_remaining' as const,
  } as const,

  USER_ASSESSMENT_ATTEMPTS: {
    ASSESSMENT_TYPE: 'assessment_type' as const,
    COMPLETED_AT: 'completed_at' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IS_COMPLETED: 'is_completed' as const,
    LEVEL_ACHIEVED: 'level_achieved' as const,
    SCORE: 'score' as const,
    TIME_SPENT_SECONDS: 'time_spent_seconds' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_ASSESSMENTS: {
    ANSWERS: 'answers' as const,
    ASSESSMENT_TYPE: 'assessment_type' as const,
    CATEGORY_BREAKDOWN: 'category_breakdown' as const,
    COMPLETED_AT: 'completed_at' as const,
    ID: 'id' as const,
    LEVEL: 'level' as const,
    METADATA: 'metadata' as const,
    SCORE: 'score' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_BADGES: {
    BADGE_ID: 'badge_id' as const,
    CREATED_AT: 'created_at' as const,
    EARNED_AT: 'earned_at' as const,
    ID: 'id' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_BOOST_INVENTORY: {
    BOOST_TYPE: 'boost_type' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    LAST_COOLDOWN_USED: 'last_cooldown_used' as const,
    LAST_PURCHASED: 'last_purchased' as const,
    QUANTITY: 'quantity' as const,
    TOTAL_PURCHASED: 'total_purchased' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_CATEGORY_PREFERENCES: {
    CATEGORY_ID: 'category_id' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    INTEREST_LEVEL: 'interest_level' as const,
    LEARNING_GOAL: 'learning_goal' as const,
    PRIORITY_RANK: 'priority_rank' as const,
    SELECTED_DURING_ONBOARDING: 'selected_during_onboarding' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_CATEGORY_SKILLS: {
    CATEGORY: 'category' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    LAST_PRACTICED_AT: 'last_practiced_at' as const,
    MASTERY_LEVEL: 'mastery_level' as const,
    QUESTIONS_ATTEMPTED: 'questions_attempted' as const,
    QUESTIONS_CORRECT: 'questions_correct' as const,
    SKILL_LEVEL: 'skill_level' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_CUSTOM_DECKS: {
    CREATED_AT: 'created_at' as const,
    DECK_NAME: 'deck_name' as const,
    DECK_TYPE: 'deck_type' as const,
    DESCRIPTION: 'description' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    PREFERENCES: 'preferences' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_DECK_CONTENT: {
    ADDED_AT: 'added_at' as const,
    DECK_ID: 'deck_id' as const,
    ID: 'id' as const,
    PRIORITY_SCORE: 'priority_score' as const,
    QUESTION_ID: 'question_id' as const,
    TOPIC_ID: 'topic_id' as const,
  } as const,

  USER_EMAIL_PREFERENCES: {
    ACHIEVEMENT_ALERTS: 'achievement_alerts' as const,
    ALLOW_DATA_ANALYTICS: 'allow_data_analytics' as const,
    ALLOW_PERSONALIZATION: 'allow_personalization' as const,
    AUTO_SHARE_ACHIEVEMENTS: 'auto_share_achievements' as const,
    CIVIC_NEWS_ALERTS: 'civic_news_alerts' as const,
    COMMUNITY_DIGEST: 'community_digest' as const,
    CREATED_AT: 'created_at' as const,
    DATA_RETENTION_PERIOD: 'data_retention_period' as const,
    EMAIL_DELIVERY_FREQUENCY: 'email_delivery_frequency' as const,
    EMAIL_FORMAT: 'email_format' as const,
    EMAIL_NOTIFICATIONS: 'email_notifications' as const,
    EXPORT_FORMAT: 'export_format' as const,
    ID: 'id' as const,
    INTEGRATION_SYNC: 'integration_sync' as const,
    MARKETING_EMAILS: 'marketing_emails' as const,
    NOTIFICATION_CHANNELS: 'notification_channels' as const,
    PRODUCT_UPDATES: 'product_updates' as const,
    RE_ENGAGEMENT_EMAILS: 're_engagement_emails' as const,
    SOCIAL_SHARING_ENABLED: 'social_sharing_enabled' as const,
    SURVEY_INVITATIONS: 'survey_invitations' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
    WEEKLY_DIGEST: 'weekly_digest' as const,
  } as const,

  USER_FEATURE_USAGE: {
    CREATED_AT: 'created_at' as const,
    FEATURE_NAME: 'feature_name' as const,
    ID: 'id' as const,
    LAST_USED_AT: 'last_used_at' as const,
    MONTHLY_LIMIT: 'monthly_limit' as const,
    RESET_DATE: 'reset_date' as const,
    UPDATED_AT: 'updated_at' as const,
    USAGE_COUNT: 'usage_count' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_FEEDBACK: {
    CONTEXT_ID: 'context_id' as const,
    CONTEXT_TYPE: 'context_type' as const,
    CREATED_AT: 'created_at' as const,
    FEEDBACK_TEXT: 'feedback_text' as const,
    FEEDBACK_TYPE: 'feedback_type' as const,
    ID: 'id' as const,
    PATH: 'path' as const,
    RATING: 'rating' as const,
    STATUS: 'status' as const,
    SUBMITTED_AT: 'submitted_at' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_AGENT: 'user_agent' as const,
    USER_EMAIL: 'user_email' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_LEARNING_GOALS: {
    CATEGORY: 'category' as const,
    CREATED_AT: 'created_at' as const,
    DIFFICULTY_LEVEL: 'difficulty_level' as const,
    GOAL_TYPE: 'goal_type' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    TARGET_DATE: 'target_date' as const,
    TARGET_VALUE: 'target_value' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_LEARNING_INSIGHTS: {
    ACTION_ITEMS: 'action_items' as const,
    CONFIDENCE_SCORE: 'confidence_score' as const,
    CREATED_AT: 'created_at' as const,
    DESCRIPTION: 'description' as const,
    ID: 'id' as const,
    INSIGHT_CATEGORY: 'insight_category' as const,
    INSIGHT_TYPE: 'insight_type' as const,
    IS_DISMISSED: 'is_dismissed' as const,
    IS_READ: 'is_read' as const,
    PRIORITY_LEVEL: 'priority_level' as const,
    TITLE: 'title' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
    VALID_UNTIL: 'valid_until' as const,
  } as const,

  USER_ONBOARDING_STATE: {
    COMPLETED_AT: 'completed_at' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_STEP: 'current_step' as const,
    ID: 'id' as const,
    IS_COMPLETED: 'is_completed' as const,
    ONBOARDING_DATA: 'onboarding_data' as const,
    SKIP_REASON: 'skip_reason' as const,
    STARTED_AT: 'started_at' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_PLATFORM_PREFERENCES: {
    ACHIEVEMENT_NOTIFICATIONS: 'achievement_notifications' as const,
    COMPETITIVE_MODE: 'competitive_mode' as const,
    CREATED_AT: 'created_at' as const,
    DAILY_REMINDER: 'daily_reminder' as const,
    EMAIL_NOTIFICATIONS: 'email_notifications' as const,
    FONT_SIZE: 'font_size' as const,
    HIGH_CONTRAST: 'high_contrast' as const,
    ID: 'id' as const,
    LEARNING_PACE: 'learning_pace' as const,
    PREFERRED_CONTENT_TYPES: 'preferred_content_types' as const,
    PREFERRED_DIFFICULTY: 'preferred_difficulty' as const,
    PREFERRED_QUIZ_LENGTH: 'preferred_quiz_length' as const,
    PUSH_NOTIFICATIONS: 'push_notifications' as const,
    REDUCED_MOTION: 'reduced_motion' as const,
    SCREEN_READER_MODE: 'screen_reader_mode' as const,
    SHOW_ACHIEVEMENTS: 'show_achievements' as const,
    SHOW_DIFFICULTY_INDICATORS: 'show_difficulty_indicators' as const,
    SHOW_EXPLANATIONS: 'show_explanations' as const,
    SHOW_LEADERBOARDS: 'show_leaderboards' as const,
    SHOW_SOURCES: 'show_sources' as const,
    SHOW_STREAKS: 'show_streaks' as const,
    STUDY_TIME_PREFERENCE: 'study_time_preference' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
    WEEKLY_SUMMARY: 'weekly_summary' as const,
  } as const,

  USER_PROGRESS: {
    ADAPTIVE_DIFFICULTY: 'adaptive_difficulty' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_LEVEL: 'current_level' as const,
    CURRENT_STREAK: 'current_streak' as const,
    FAVORITE_CATEGORIES: 'favorite_categories' as const,
    ID: 'id' as const,
    LAST_ACTIVITY_DATE: 'last_activity_date' as const,
    LEARNING_STYLE: 'learning_style' as const,
    LONGEST_STREAK: 'longest_streak' as const,
    PREFERRED_CATEGORIES: 'preferred_categories' as const,
    TOTAL_CORRECT_ANSWERS: 'total_correct_answers' as const,
    TOTAL_QUESTIONS_ANSWERED: 'total_questions_answered' as const,
    TOTAL_QUIZZES_COMPLETED: 'total_quizzes_completed' as const,
    TOTAL_XP: 'total_xp' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
    WEEK_START_DATE: 'week_start_date' as const,
    WEEKLY_COMPLETED: 'weekly_completed' as const,
    WEEKLY_GOAL: 'weekly_goal' as const,
    XP_TO_NEXT_LEVEL: 'xp_to_next_level' as const,
  } as const,

  USER_PROGRESS_HISTORY: {
    ACCURACY_PERCENTAGE: 'accuracy_percentage' as const,
    CATEGORY_STATS: 'category_stats' as const,
    CREATED_AT: 'created_at' as const,
    CURRENT_LEVEL: 'current_level' as const,
    CURRENT_STREAK: 'current_streak' as const,
    ID: 'id' as const,
    LONGEST_STREAK: 'longest_streak' as const,
    PERIOD_CORRECT_ANSWERS: 'period_correct_answers' as const,
    PERIOD_QUESTIONS_ANSWERED: 'period_questions_answered' as const,
    PERIOD_QUIZZES_COMPLETED: 'period_quizzes_completed' as const,
    PERIOD_XP_GAINED: 'period_xp_gained' as const,
    SNAPSHOT_DATE: 'snapshot_date' as const,
    SNAPSHOT_TYPE: 'snapshot_type' as const,
    TOTAL_CORRECT_ANSWERS: 'total_correct_answers' as const,
    TOTAL_QUESTIONS_ANSWERED: 'total_questions_answered' as const,
    TOTAL_QUIZZES_COMPLETED: 'total_quizzes_completed' as const,
    TOTAL_XP: 'total_xp' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_QUESTION_MEMORY: {
    CONSECUTIVE_CORRECT: 'consecutive_correct' as const,
    EASINESS_FACTOR: 'easiness_factor' as const,
    ID: 'id' as const,
    INTERVAL_DAYS: 'interval_days' as const,
    LAST_REVIEWED_AT: 'last_reviewed_at' as const,
    NEXT_REVIEW_DATE: 'next_review_date' as const,
    QUESTION_ID: 'question_id' as const,
    REPETITION_COUNT: 'repetition_count' as const,
    TOTAL_ATTEMPTS: 'total_attempts' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_QUESTION_RESPONSES: {
    ATTEMPT_ID: 'attempt_id' as const,
    CREATED_AT: 'created_at' as const,
    HINT_USED: 'hint_used' as const,
    ID: 'id' as const,
    IS_CORRECT: 'is_correct' as const,
    QUESTION_ID: 'question_id' as const,
    TIME_SPENT_SECONDS: 'time_spent_seconds' as const,
    USER_ANSWER: 'user_answer' as const,
  } as const,

  USER_QUIZ_ANALYTICS: {
    AVERAGE_TIME_PER_QUESTION: 'average_time_per_question' as const,
    CATEGORY_PERFORMANCE: 'category_performance' as const,
    COMPLETION_RATE: 'completion_rate' as const,
    CONSISTENCY_SCORE: 'consistency_score' as const,
    CREATED_AT: 'created_at' as const,
    DIFFICULTY_PERFORMANCE: 'difficulty_performance' as const,
    FASTEST_QUESTION_TIME: 'fastest_question_time' as const,
    HINT_USAGE_RATE: 'hint_usage_rate' as const,
    ID: 'id' as const,
    IMPROVEMENT_TREND: 'improvement_trend' as const,
    OPTIMAL_STUDY_TIME: 'optimal_study_time' as const,
    QUESTION_TYPE_PERFORMANCE: 'question_type_performance' as const,
    QUIZ_ATTEMPT_ID: 'quiz_attempt_id' as const,
    RETRY_RATE: 'retry_rate' as const,
    SLOWEST_QUESTION_TIME: 'slowest_question_time' as const,
    TIME_DISTRIBUTION: 'time_distribution' as const,
    TOPIC_ID: 'topic_id' as const,
    TOTAL_TIME_SECONDS: 'total_time_seconds' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_QUIZ_ATTEMPTS: {
    CLEVER_ASSIGNMENT_ID: 'clever_assignment_id' as const,
    CLEVER_SECTION_ID: 'clever_section_id' as const,
    COMPLETED_AT: 'completed_at' as const,
    CORRECT_ANSWERS: 'correct_answers' as const,
    CREATED_AT: 'created_at' as const,
    GAME_MODE: 'game_mode' as const,
    GAME_METADATA: 'game_metadata' as const,
    GRADE_POST_ERROR: 'grade_post_error' as const,
    GRADE_POST_TIMESTAMP: 'grade_post_timestamp' as const,
    GRADE_POSTED_TO_LMS: 'grade_posted_to_lms' as const,
    ID: 'id' as const,
    IS_COMPLETED: 'is_completed' as const,
    SCORE: 'score' as const,
    STARTED_AT: 'started_at' as const,
    TIME_SPENT_SECONDS: 'time_spent_seconds' as const,
    TOPIC_ID: 'topic_id' as const,
    TOTAL_QUESTIONS: 'total_questions' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_ROLES: {
    CREATED_AT: 'created_at' as const,
    GRANTED_AT: 'granted_at' as const,
    GRANTED_BY: 'granted_by' as const,
    ID: 'id' as const,
    PERMISSIONS: 'permissions' as const,
    ROLE: 'role' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_SKILL_PREFERENCES: {
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    INTEREST_LEVEL: 'interest_level' as const,
    LEARNING_TIMELINE: 'learning_timeline' as const,
    PRIORITY_RANK: 'priority_rank' as const,
    SELECTED_DURING_ONBOARDING: 'selected_during_onboarding' as const,
    SKILL_ID: 'skill_id' as const,
    TARGET_MASTERY_LEVEL: 'target_mastery_level' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_SKILL_PROGRESS: {
    AVERAGE_TIME_PER_QUESTION: 'average_time_per_question' as const,
    CONFIDENCE_LEVEL: 'confidence_level' as const,
    CONSECUTIVE_CORRECT: 'consecutive_correct' as const,
    CREATED_AT: 'created_at' as const,
    ID: 'id' as const,
    IMPROVEMENT_RATE: 'improvement_rate' as const,
    LAST_PRACTICED_AT: 'last_practiced_at' as const,
    MASTERY_ACHIEVED_AT: 'mastery_achieved_at' as const,
    MASTERY_LEVEL: 'mastery_level' as const,
    NEXT_REVIEW_DATE: 'next_review_date' as const,
    QUESTIONS_ATTEMPTED: 'questions_attempted' as const,
    QUESTIONS_CORRECT: 'questions_correct' as const,
    REVIEW_INTERVAL_DAYS: 'review_interval_days' as const,
    SKILL_ID: 'skill_id' as const,
    SKILL_LEVEL: 'skill_level' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_STREAK_HISTORY: {
    CATEGORY: 'category' as const,
    CREATED_AT: 'created_at' as const,
    END_DATE: 'end_date' as const,
    ID: 'id' as const,
    IS_ACTIVE: 'is_active' as const,
    START_DATE: 'start_date' as const,
    STREAK_TYPE: 'streak_type' as const,
    STREAK_VALUE: 'streak_value' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_SUBSCRIPTIONS: {
    AMOUNT_CENTS: 'amount_cents' as const,
    BILLING_CYCLE: 'billing_cycle' as const,
    CREATED_AT: 'created_at' as const,
    CURRENCY: 'currency' as const,
    EXTERNAL_SUBSCRIPTION_ID: 'external_subscription_id' as const,
    ID: 'id' as const,
    LAST_PAYMENT_DATE: 'last_payment_date' as const,
    NEXT_BILLING_DATE: 'next_billing_date' as const,
    PAYMENT_PROVIDER: 'payment_provider' as const,
    SUBSCRIPTION_END_DATE: 'subscription_end_date' as const,
    SUBSCRIPTION_START_DATE: 'subscription_start_date' as const,
    SUBSCRIPTION_STATUS: 'subscription_status' as const,
    SUBSCRIPTION_TIER: 'subscription_tier' as const,
    TRIAL_END_DATE: 'trial_end_date' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

  USER_SURVEY_COMPLETIONS: {
    COMPLETED_AT: 'completed_at' as const,
    COMPLETION_TIME_SECONDS: 'completion_time_seconds' as const,
    CREATED_AT: 'created_at' as const,
    GUEST_TOKEN: 'guest_token' as const,
    ID: 'id' as const,
    QUESTIONS_ANSWERED: 'questions_answered' as const,
    RESPONSE_ID: 'response_id' as const,
    SURVEY_ID: 'survey_id' as const,
    TOTAL_QUESTIONS: 'total_questions' as const,
    UPDATED_AT: 'updated_at' as const,
    USER_ID: 'user_id' as const,
  } as const,

} as const;

export const getTableColumns = (tableName: string): string[] => {
  const tableKey = tableName.toUpperCase() as keyof typeof DB_COLUMNS;
  const columns = DB_COLUMNS[tableKey];
  return columns ? Object.values(columns) : [];
};

export const DB_COLUMN_TYPES = {
  ARTICLE_BIAS_ANALYSIS: {
    AI_ANALYSIS_VERSION: 'string | null' as const,
    AI_CONFIDENCE: 'number | null' as const,
    AI_REASONING: 'string | null' as const,
    ANALYSIS_METHOD: 'string | null' as const,
    ANALYZED_AT: 'string | null' as const,
    ANALYZER_ID: 'string | null' as const,
    ARTICLE_AUTHOR: 'string | null' as const,
    ARTICLE_TITLE: 'string | null' as const,
    ARTICLE_URL: 'string' as const,
    CONFIDENCE_LEVEL: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    DETECTED_TECHNIQUES: 'Json | null' as const,
    DIMENSION_SCORES: 'Json' as const,
    EMOTIONAL_LANGUAGE_SCORE: 'number | null' as const,
    EMOTIONAL_MANIPULATION_SCORE: 'number | null' as const,
    FACTUAL_ACCURACY_SCORE: 'number | null' as const,
    FACTUAL_CLAIMS: 'Json | null' as const,
    ID: 'string' as const,
    ORGANIZATION_ID: 'string | null' as const,
    OVERALL_BIAS_SCORE: 'number | null' as const,
    PUBLISHED_AT: 'string | null' as const,
    SOURCE_DIVERSITY_SCORE: 'number | null' as const,
    SOURCE_METADATA_ID: 'string | null' as const,
  } as const,

  ASSESSMENT_ANALYTICS: {
    EVENT_TYPE: 'string | null' as const,
    FINAL_SCORE: 'number | null' as const,
    ID: 'number' as const,
    METADATA: 'Json | null' as const,
    SESSION_ID: 'string | null' as const,
    TIMESTAMP: 'string | null' as const,
    USER_ID: 'string | null' as const,
  } as const,

  ASSESSMENT_QUESTIONS: {
    CATEGORY: 'string' as const,
    CORRECT_ANSWER: 'string' as const,
    CREATED_AT: 'string | null' as const,
    DIFFICULTY: 'number' as const,
    EXPLANATION: 'string | null' as const,
    FRIENDLY_EXPLANATION: 'string | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    OPTIONS: 'Json' as const,
    QUESTION: 'string' as const,
    SKILL_ID: 'string | null' as const,
    TRANSLATIONS: 'Json | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  ASSESSMENT_SCORING: {
    CATEGORY: 'string' as const,
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string' as const,
    ID: 'string' as const,
    RECOMMENDED_CONTENT: 'string[] | null' as const,
    SCORE_RANGE_MAX: 'number' as const,
    SCORE_RANGE_MIN: 'number' as const,
    SKILL_LEVEL: 'string' as const,
  } as const,

  BADGE_REQUIREMENTS: {
    BADGE_ID: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    REQUIREMENT_TYPE: 'string' as const,
    REQUIREMENT_VALUE: 'Json' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  BIAS_DETECTION_PATTERNS: {
    CREATED_AT: 'string | null' as const,
    DIMENSION_ID: 'string | null' as const,
    FALSE_POSITIVE_RATE: 'number | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    KEYWORDS: 'string[] | null' as const,
    LAST_UPDATED: 'string | null' as const,
    PATTERN_NAME: 'string' as const,
    PATTERN_REGEX: 'string | null' as const,
    PATTERN_TYPE: 'string' as const,
    PHRASE_PATTERNS: 'Json | null' as const,
    SEVERITY_WEIGHT: 'number | null' as const,
    TIMES_DETECTED: 'number | null' as const,
  } as const,

  BIAS_DIMENSIONS: {
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    DIMENSION_NAME: 'string' as const,
    DIMENSION_SLUG: 'string' as const,
    DISPLAY_ORDER: 'number | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    SCALE_TYPE: 'string' as const,
    SCALE_VALUES: 'Json' as const,
  } as const,

  BIAS_FEEDBACK: {
    AGREES_WITH_ASSESSMENT: 'boolean | null' as const,
    ARTICLE_ANALYSIS_ID: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    DIMENSION_ID: 'string | null' as const,
    EVIDENCE_URLS: 'string[] | null' as const,
    FEEDBACK_TEXT: 'string | null' as const,
    FEEDBACK_TYPE: 'string' as const,
    GUEST_TOKEN: 'string | null' as const,
    HELPFULNESS_SCORE: 'number | null' as const,
    ID: 'string' as const,
    IP_ADDRESS: 'unknown | null' as const,
    IS_SPAM: 'boolean | null' as const,
    IS_VERIFIED: 'boolean | null' as const,
    ORGANIZATION_ID: 'string | null' as const,
    SUGGESTED_SCORE: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_AGENT: 'string | null' as const,
    USER_EXPERTISE_AREAS: 'string[] | null' as const,
    USER_EXPERTISE_LEVEL: 'string | null' as const,
    USER_ID: 'string | null' as const,
    VERIFICATION_NOTES: 'string | null' as const,
    VERIFIED_BY: 'string | null' as const,
  } as const,

  BIAS_LEARNING_EVENTS: {
    ARTICLE_COUNT: 'number | null' as const,
    CONFIDENCE_CHANGE: 'number | null' as const,
    CONSENSUS_STRENGTH: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    DIMENSION_ID: 'string | null' as const,
    EVENT_TYPE: 'string' as const,
    FEEDBACK_COUNT: 'number | null' as const,
    ID: 'string' as const,
    LEARNING_ALGORITHM_VERSION: 'string | null' as const,
    NEW_SCORE: 'number | null' as const,
    OLD_SCORE: 'number | null' as const,
    ORGANIZATION_ID: 'string | null' as const,
    TRIGGER_ID: 'string | null' as const,
    TRIGGER_TYPE: 'string | null' as const,
  } as const,

  BOOKMARK_ANALYTICS: {
    BOOKMARK_ID: 'string | null' as const,
    CREATED_AT: 'string' as const,
    EVENT_DATA: 'Json | null' as const,
    EVENT_TYPE: 'string' as const,
    ID: 'string' as const,
    SNIPPET_ID: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  BOOKMARK_COLLECTIONS: {
    COLOR: 'string | null' as const,
    CREATED_AT: 'string' as const,
    DESCRIPTION: 'string | null' as const,
    DISPLAY_ORDER: 'number | null' as const,
    EMOJI: 'string | null' as const,
    ID: 'string' as const,
    IS_PUBLIC: 'boolean | null' as const,
    IS_SMART: 'boolean | null' as const,
    NAME: 'string' as const,
    PARENT_COLLECTION_ID: 'string | null' as const,
    SMART_CRITERIA: 'Json | null' as const,
    UPDATED_AT: 'string' as const,
    USER_ID: 'string' as const,
  } as const,

  BOOKMARK_SNIPPETS: {
    AI_SUMMARY: 'string | null' as const,
    AI_TAGS: 'string[] | null' as const,
    BOOKMARK_ID: 'string | null' as const,
    COLLECTION_ID: 'string | null' as const,
    CREATED_AT: 'string' as const,
    FULL_CONTEXT: 'string | null' as const,
    HIGHLIGHT_COLOR: 'string | null' as const,
    ID: 'string' as const,
    PARAGRAPH_INDEX: 'number | null' as const,
    SELECTION_END: 'number | null' as const,
    SELECTION_START: 'number | null' as const,
    SNIPPET_TEXT: 'string' as const,
    SOURCE_ID: 'string | null' as const,
    SOURCE_TITLE: 'string | null' as const,
    SOURCE_TYPE: 'string | null' as const,
    SOURCE_URL: 'string | null' as const,
    TAGS: 'string[] | null' as const,
    UPDATED_AT: 'string' as const,
    USER_ID: 'string' as const,
    USER_NOTES: 'string | null' as const,
  } as const,

  BOOKMARK_TAGS: {
    COLOR: 'string | null' as const,
    CREATED_AT: 'string' as const,
    ID: 'string' as const,
    TAG_NAME: 'string' as const,
    TAG_SLUG: 'string' as const,
    USAGE_COUNT: 'number | null' as const,
    USER_ID: 'string' as const,
  } as const,

  BOOKMARKS: {
    ACCESS_COUNT: 'number | null' as const,
    COLLECTION_ID: 'string | null' as const,
    CONTENT_ID: 'string | null' as const,
    CONTENT_TYPE: 'string' as const,
    CONTENT_URL: 'string | null' as const,
    CREATED_AT: 'string' as const,
    DESCRIPTION: 'string | null' as const,
    ID: 'string' as const,
    IS_FAVORITE: 'boolean | null' as const,
    LAST_ACCESSED_AT: 'string | null' as const,
    SOURCE_DOMAIN: 'string | null' as const,
    TAGS: 'string[] | null' as const,
    THUMBNAIL_URL: 'string | null' as const,
    TITLE: 'string' as const,
    UPDATED_AT: 'string' as const,
    USER_ID: 'string' as const,
    USER_NOTES: 'string | null' as const,
  } as const,

  BOOST_DEFINITIONS: {
    BOOST_TYPE: 'string' as const,
    CATEGORY: 'string' as const,
    COOLDOWN_HOURS: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string' as const,
    DURATION: 'number | null' as const,
    EMOJI: 'string' as const,
    ICON: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    LEVEL_REQUIREMENT: 'number | null' as const,
    MAX_USES: 'number | null' as const,
    NAME: 'string' as const,
    RARITY: 'string' as const,
    TAGS: 'string[] | null' as const,
    UPDATED_AT: 'string | null' as const,
    XP_COST: 'number' as const,
  } as const,

  CATEGORIES: {
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    DISPLAY_ORDER: 'number | null' as const,
    EMOJI: 'string' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    NAME: 'string' as const,
    TRANSLATIONS: 'Json | null' as const,
  } as const,

  CATEGORY_SYNONYMS: {
    ALIAS: 'string' as const,
    CATEGORY_ID: 'string | null' as const,
    IS_ACTIVE: 'boolean | null' as const,
  } as const,

  CIVICS_TEST_ANALYTICS: {
    EVENT_TYPE: 'string' as const,
    GUEST_TOKEN: 'string | null' as const,
    ID: 'string' as const,
    IP_ADDRESS: 'unknown | null' as const,
    METADATA: 'Json | null' as const,
    SCORE: 'number | null' as const,
    SESSION_ID: 'string' as const,
    TIMESTAMP: 'string' as const,
    USER_AGENT: 'string | null' as const,
    USER_ID: 'string | null' as const,
  } as const,

  CLEVER_USER_MAPPING: {
    CIVICSENSE_USER_ID: 'string | null' as const,
    CLEVER_EMAIL: 'string | null' as const,
    CLEVER_USER_ID: 'string' as const,
    CREATED_AT: 'string' as const,
    FIRST_NAME: 'string | null' as const,
    ID: 'string' as const,
    LAST_NAME: 'string | null' as const,
    ROLE: 'string | null' as const,
    SCHOOL_ID: 'string | null' as const,
  } as const,

  CONTENT_FILTERING_RULES: {
    AGE_RANGE: 'string' as const,
    BLOCKED_CATEGORIES: 'string[] | null' as const,
    BLOCKED_KEYWORDS: 'string[] | null' as const,
    BLOCKED_TOPICS: 'string[] | null' as const,
    CREATED_AT: 'string | null' as const,
    FILTER_LEVEL: 'string' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    MAX_DIFFICULTY_LEVEL: 'number | null' as const,
    RULE_NAME: 'string' as const,
    SENSITIVE_TOPICS: 'Json | null' as const,
  } as const,

  CONTENT_GENERATION_QUEUE: {
    ASSIGNED_WORKER: 'string | null' as const,
    COMPLETED_AT: 'string | null' as const,
    CREATED_AT: 'string' as const,
    ERROR_MESSAGE: 'string | null' as const,
    ESTIMATED_DURATION_MS: 'number | null' as const,
    EXECUTION_LOG_ID: 'string | null' as const,
    EXPIRES_AT: 'string' as const,
    GENERATION_PARAMS: 'Json' as const,
    GENERATION_TYPE: 'string' as const,
    ID: 'string' as const,
    MAX_RETRIES: 'number' as const,
    PRIORITY: 'number' as const,
    PROCESS_AFTER: 'string' as const,
    RESULT_DATA: 'Json | null' as const,
    RETRY_COUNT: 'number' as const,
    SCHEDULED_JOB_ID: 'string | null' as const,
    STARTED_AT: 'string | null' as const,
    STATUS: 'string' as const,
    UPDATED_AT: 'string' as const,
  } as const,

  CONTENT_PREVIEW_CACHE: {
    ACCESS_COUNT: 'number' as const,
    CACHE_KEY: 'string' as const,
    CACHE_TYPE: 'string' as const,
    CREATED_AT: 'string' as const,
    CREATED_BY: 'string | null' as const,
    EXPIRES_AT: 'string' as const,
    GENERATION_SETTINGS: 'Json' as const,
    ID: 'string' as const,
    LAST_ACCESSED_AT: 'string' as const,
    PREVIEW_DATA: 'Json' as const,
  } as const,

  EVENTS: {
    CREATED_AT: 'string | null' as const,
    DATE: 'string' as const,
    DESCRIPTION: 'string' as const,
    ID: 'string | null' as const,
    IS_ACTIVE: 'boolean | null' as const,
    SOURCES: 'Json | null' as const,
    TOPIC_ID: 'string' as const,
    TOPIC_TITLE: 'string' as const,
    UPDATED_AT: 'string | null' as const,
    WHY_THIS_MATTERS: 'string' as const,
  } as const,

  FACT_CHECK_LOGS: {
    AI_REASONING: 'string | null' as const,
    CHANGES_APPLIED: 'boolean | null' as const,
    CHECK_DATE: 'string | null' as const,
    CONFIDENCE_SCORE: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    HUMAN_REVIEWER: 'string | null' as const,
    ID: 'string' as const,
    ISSUES_FOUND: 'string[] | null' as const,
    QUESTION_ID: 'string | null' as const,
  } as const,

  FIGURE_EVENTS: {
    CREATED_AT: 'string | null' as const,
    EVENT_DATE: 'string' as const,
    EVENT_DESCRIPTION: 'string | null' as const,
    EVENT_TITLE: 'string' as const,
    EVENT_TYPE: 'string' as const,
    FIGURE_ID: 'string | null' as const,
    ID: 'string' as const,
    MEDIA_COVERAGE_SCALE: 'string | null' as const,
    POLICY_AREAS: 'string[] | null' as const,
    QUIZ_POTENTIAL: 'number | null' as const,
    RELATED_FIGURES: 'string[] | null' as const,
    SIGNIFICANCE_LEVEL: 'number | null' as const,
    SOURCES: 'Json | null' as const,
  } as const,

  FIGURE_ORGANIZATIONS: {
    APPOINTMENT_ANNOUNCEMENT_URL: 'string | null' as const,
    COMPENSATION_TYPE: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    END_DATE: 'string | null' as const,
    FIGURE_ID: 'string | null' as const,
    ID: 'string' as const,
    INFLUENCE_WITHIN_ORG: 'number | null' as const,
    IS_ACTIVE: 'boolean | null' as const,
    ORGANIZATION_ID: 'string | null' as const,
    PUBLIC_VISIBILITY: 'string | null' as const,
    ROLE_DESCRIPTION: 'string | null' as const,
    ROLE_TITLE: 'string | null' as const,
    ROLE_TYPE: 'string | null' as const,
    SOURCES: 'Json | null' as const,
    START_DATE: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  FIGURE_POLICY_POSITIONS: {
    CERTAINTY_LEVEL: 'string | null' as const,
    CONSISTENCY_SCORE: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    FIGURE_ID: 'string | null' as const,
    ID: 'string' as const,
    POLICY_AREA: 'string' as const,
    POSITION_DATE: 'string | null' as const,
    POSITION_DESCRIPTION: 'string' as const,
    PUBLIC_STATEMENT_URL: 'string | null' as const,
    SOURCES: 'Json | null' as const,
    SPECIFIC_POLICY: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    VOTING_RECORD_EVIDENCE: 'Json | null' as const,
  } as const,

  FIGURE_QUIZ_TOPICS: {
    CONTENT_THEMES: 'string[] | null' as const,
    CREATED_AT: 'string | null' as const,
    DIFFICULTY_DISTRIBUTION: 'Json | null' as const,
    FEATURED_FIGURES: 'string[] | null' as const,
    FOCUS_TYPE: 'string' as const,
    ID: 'string' as const,
    NETWORK_DEPTH: 'number | null' as const,
    PERFORMANCE_METRICS: 'Json | null' as const,
    PRIMARY_FIGURE_ID: 'string | null' as const,
    TOPIC_ID: 'string | null' as const,
  } as const,

  FIGURE_RELATIONSHIPS: {
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    EVIDENCE_SOURCES: 'Json | null' as const,
    FIGURE_A_ID: 'string | null' as const,
    FIGURE_B_ID: 'string | null' as const,
    FINANCIAL_CONNECTIONS: 'Json | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    IS_PUBLIC: 'boolean | null' as const,
    KEY_INTERACTIONS: 'Json | null' as const,
    POLICY_ALIGNMENTS: 'string[] | null' as const,
    RELATIONSHIP_DIRECTION: 'string | null' as const,
    RELATIONSHIP_END_DATE: 'string | null' as const,
    RELATIONSHIP_START_DATE: 'string | null' as const,
    RELATIONSHIP_STRENGTH: 'number | null' as const,
    RELATIONSHIP_TYPE: 'string' as const,
    UPDATED_AT: 'string | null' as const,
    VERIFICATION_STATUS: 'string | null' as const,
  } as const,

  FRIEND_REQUESTS: {
    APPROVED_BY: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    EXPIRES_AT: 'string | null' as const,
    ID: 'string' as const,
    MESSAGE: 'string | null' as const,
    PARENT_APPROVED_AT: 'string | null' as const,
    POD_ID: 'string | null' as const,
    RECIPIENT_ID: 'string' as const,
    REQUEST_TYPE: 'string | null' as const,
    REQUESTER_ID: 'string' as const,
    REQUIRES_PARENTAL_APPROVAL: 'boolean | null' as const,
    RESPONDED_AT: 'string | null' as const,
    STATUS: 'string | null' as const,
  } as const,

  GIFT_CREDITS: {
    CREATED_AT: 'string | null' as const,
    CREDIT_TYPE: 'string' as const,
    CREDITS_AVAILABLE: 'number' as const,
    CREDITS_USED: 'number' as const,
    DONOR_USER_ID: 'string' as const,
    ID: 'string' as const,
    SOURCE_DONATION_AMOUNT: 'number' as const,
    SOURCE_STRIPE_SESSION_ID: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  GIFT_REDEMPTIONS: {
    ACCESS_TYPE: 'string' as const,
    CLAIMED_AT: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    DONOR_USER_ID: 'string' as const,
    EXPIRES_AT: 'string | null' as const,
    GIFT_CREDIT_ID: 'string' as const,
    GIFT_MESSAGE: 'string | null' as const,
    ID: 'string' as const,
    RECIPIENT_EMAIL: 'string' as const,
    RECIPIENT_USER_ID: 'string | null' as const,
    REDEMPTION_CODE: 'string' as const,
    REDEMPTION_STATUS: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  GLOSSARY_TERMS: {
    CATEGORY: 'string | null' as const,
    CREATED_AT: 'string' as const,
    DEFINITION: 'string' as const,
    EXAMPLES: 'Json | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    PART_OF_SPEECH: 'string | null' as const,
    SYNONYMS: 'string[] | null' as const,
    TERM: 'string' as const,
    UPDATED_AT: 'string' as const,
  } as const,

  GUEST_CIVICS_TEST_RESULTS: {
    ANSWERS: 'Json | null' as const,
    CATEGORY_BREAKDOWN: 'Json | null' as const,
    COMPLETED_AT: 'string' as const,
    CONVERTED_AT: 'string | null' as const,
    CONVERTED_USER_ID: 'string | null' as const,
    GUEST_TOKEN: 'string' as const,
    ID: 'string' as const,
    IP_ADDRESS: 'unknown | null' as const,
    LEVEL: 'string' as const,
    SCORE: 'number' as const,
    SESSION_ID: 'string' as const,
    TEST_TYPE: 'string' as const,
    USER_AGENT: 'string | null' as const,
  } as const,

  GUEST_USAGE_ANALYTICS: {
    ATTEMPTS: 'number' as const,
    CREATED_AT: 'string | null' as const,
    DATE: 'string' as const,
    GUEST_TOKEN: 'string' as const,
    ID: 'string' as const,
    IP: 'string' as const,
    TIMESTAMP: 'string' as const,
  } as const,

  GUEST_USAGE_TRACKING: {
    ATTEMPTS: 'number' as const,
    CREATED_AT: 'string | null' as const,
    DATE: 'string' as const,
    FIRSTSEEN: 'string' as const,
    ID: 'string' as const,
    IP: 'string' as const,
    LASTSEEN: 'string' as const,
    TOKENS: 'string[]' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  IMAGE_AB_TEST_RESULTS: {
    CREATED_AT: 'string' as const,
    ENGAGEMENT_TYPE: 'string | null' as const,
    ENGAGEMENT_VALUE: 'number | null' as const,
    ID: 'string' as const,
    IMAGE_ID: 'string | null' as const,
    SESSION_ID: 'string | null' as const,
    TEST_NAME: 'string' as const,
    USER_ID: 'string | null' as const,
    VARIANT: 'string' as const,
  } as const,

  IMAGE_GENERATION_ANALYTICS: {
    CONTENT_TYPE: 'string' as const,
    CREATED_AT: 'string' as const,
    ERROR_MESSAGE: 'string | null' as const,
    GENERATION_TIME_MS: 'number' as const,
    ID: 'string' as const,
    SESSION_ID: 'string | null' as const,
    SUCCESS: 'boolean' as const,
    TEMPLATE: 'string' as const,
    THEME: 'string' as const,
    USER_ID: 'string | null' as const,
    VARIANT: 'string' as const,
  } as const,

  JOB_EXECUTION_LOGS: {
    COMPLETED_AT: 'string | null' as const,
    CONTENT_GENERATED: 'number | null' as const,
    CREATED_AT: 'string' as const,
    ERROR_DETAILS: 'Json | null' as const,
    ERROR_MESSAGE: 'string | null' as const,
    EXECUTION_METADATA: 'Json | null' as const,
    EXECUTION_TIME_MS: 'number | null' as const,
    ID: 'string' as const,
    JOB_ID: 'string' as const,
    QUESTIONS_CREATED: 'number | null' as const,
    STACK_TRACE: 'string | null' as const,
    STARTED_AT: 'string' as const,
    STATUS: 'string' as const,
    TOPICS_CREATED: 'number | null' as const,
  } as const,

  KEY_POLICY_POSITIONS: {
    CATEGORY_ID: 'string' as const,
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    DISPLAY_ORDER: 'number' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    SPECTRUM: 'string' as const,
    STANCE_LABEL: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  LEARNING_OBJECTIVES: {
    CREATED_AT: 'string' as const,
    DISPLAY_ORDER: 'number | null' as const,
    ID: 'string' as const,
    MASTERY_LEVEL_REQUIRED: 'string | null' as const,
    OBJECTIVE_TEXT: 'string' as const,
    OBJECTIVE_TYPE: 'string' as const,
    SKILL_ID: 'string' as const,
  } as const,

  LEARNING_PODS: {
    ACCESSIBILITY_MODE: 'string | null' as const,
    ACTIVITY_SCORE: 'number | null' as const,
    ALERT_ON_INAPPROPRIATE_CONTENT: 'boolean | null' as const,
    ALLOW_SENSITIVE_TOPICS: 'boolean | null' as const,
    ALLOWED_AGE_RANGE: 'string | null' as const,
    ALLOWED_DAYS: 'number[] | null' as const,
    ALLOWED_END_TIME: 'string | null' as const,
    ALLOWED_START_TIME: 'string | null' as const,
    ARCHIVED_AT: 'string | null' as const,
    ARCHIVED_BY: 'string | null' as const,
    AVERAGE_RATING: 'number | null' as const,
    BANNER_IMAGE_URL: 'string | null' as const,
    BLOCKED_CATEGORIES: 'string[] | null' as const,
    CAN_ACCESS_CHAT: 'boolean | null' as const,
    CAN_ACCESS_MULTIPLAYER: 'boolean | null' as const,
    CAN_SHARE_PROGRESS: 'boolean | null' as const,
    CAN_VIEW_LEADERBOARDS: 'boolean | null' as const,
    CHALLENGE_PARTICIPATION: 'Json | null' as const,
    CLASSROOM_COURSE_ID: 'string | null' as const,
    CLASSROOM_INTEGRATION_ENABLED: 'boolean | null' as const,
    CLEVER_LAST_SYNC: 'string | null' as const,
    CLEVER_SECTION_ID: 'string | null' as const,
    CLEVER_SYNC_ENABLED: 'boolean' as const,
    CLEVER_SYNC_ERRORS: 'Json | null' as const,
    CONTENT_FILTER_LEVEL: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    CREATED_BY: 'string' as const,
    CUSTOM_TYPE_LABEL: 'string | null' as const,
    DAILY_TIME_LIMIT_MINUTES: 'number | null' as const,
    DESCRIPTION: 'string | null' as const,
    DISPLAY_NAME: 'string | null' as const,
    FAMILY_NAME: 'string | null' as const,
    GRADE_PASSBACK_ENABLED: 'boolean | null' as const,
    ID: 'string' as const,
    IS_FEATURED: 'boolean | null' as const,
    IS_PRIVATE: 'boolean | null' as const,
    IS_PUBLIC: 'boolean | null' as const,
    JOIN_CODE: 'string | null' as const,
    LMS_PLATFORM: '"google_classroom" | "clever" | null' as const,
    MAX_DIFFICULTY_LEVEL: 'number | null' as const,
    MAX_MEMBERS: 'number | null' as const,
    MILESTONE_DATA: 'Json | null' as const,
    PARENT_EMAIL: 'string | null' as const,
    PARTNERSHIP_STATUS: 'string | null' as const,
    PERSONALITY_TYPE: 'string | null' as const,
    POD_COLOR: 'string | null' as const,
    POD_DESCRIPTION: 'string | null' as const,
    POD_EMOJI: 'string | null' as const,
    POD_MOTTO: 'string | null' as const,
    POD_NAME: 'string' as const,
    POD_SLUG: 'string | null' as const,
    POD_TYPE: 'string' as const,
    REPORT_FREQUENCY: 'string | null' as const,
    REQUIRE_PARENT_APPROVAL_FOR_FRIENDS: 'boolean | null' as const,
    ROSTER_LAST_SYNCED: 'string | null' as const,
    SEARCH_TAGS: 'string[] | null' as const,
    SEND_PROGRESS_REPORTS: 'boolean | null' as const,
    SHORT_DESCRIPTION: 'string | null' as const,
    TARGET_AGE_RANGE: 'string | null' as const,
    THEME_ID: 'string | null' as const,
    TOPICS_COVERED: 'string[] | null' as const,
    TOTAL_RATINGS: 'number | null' as const,
    TRACK_DETAILED_ACTIVITY: 'boolean | null' as const,
    UNLOCKED_FEATURES: 'Json | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  MEDIA_ORGANIZATIONS: {
    ALTERNATE_DOMAINS: 'string[] | null' as const,
    CORRECTIONS_POLICY: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    CREDIBILITY_RATING: 'number | null' as const,
    DESCRIPTION: 'string | null' as const,
    DOMAIN: 'string | null' as const,
    EDITORIAL_STANCE: 'string | null' as const,
    FACT_CHECKING_METHODOLOGY: 'string | null' as const,
    FOUNDING_YEAR: 'number | null' as const,
    FUNDING_SOURCES: 'Json | null' as const,
    HEADQUARTERS_LOCATION: 'string | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    LOGO_URL: 'string | null' as const,
    NAME: 'string' as const,
    ORGANIZATION_TYPE: 'string' as const,
    OWNERSHIP_STRUCTURE: 'string | null' as const,
    PARENT_ORGANIZATION_ID: 'string | null' as const,
    SOCIAL_MEDIA_LINKS: 'Json | null' as const,
    STATED_VALUES: 'string[] | null' as const,
    TRANSPARENCY_SCORE: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
    WEBSITE_URL: 'string | null' as const,
  } as const,

  MEMBER_INDIVIDUAL_SETTINGS: {
    ALERT_ON_INAPPROPRIATE_CONTENT: 'boolean | null' as const,
    ALLOWED_DAYS: 'number[] | null' as const,
    ALLOWED_END_TIME: 'string | null' as const,
    ALLOWED_START_TIME: 'string | null' as const,
    BLOCKED_CATEGORIES: 'string[] | null' as const,
    CAN_ACCESS_CHAT: 'boolean | null' as const,
    CAN_ACCESS_MULTIPLAYER: 'boolean | null' as const,
    CAN_SHARE_PROGRESS: 'boolean | null' as const,
    CAN_VIEW_LEADERBOARDS: 'boolean | null' as const,
    CONTENT_FILTER_LEVEL: 'string | null' as const,
    CREATED_AT: 'string' as const,
    DAILY_TIME_LIMIT_MINUTES: 'number | null' as const,
    ID: 'string' as const,
    MAX_DIFFICULTY_LEVEL: 'number | null' as const,
    OVERRIDE_CONTENT_FILTER: 'boolean | null' as const,
    OVERRIDE_FEATURE_ACCESS: 'boolean | null' as const,
    OVERRIDE_MONITORING: 'boolean | null' as const,
    OVERRIDE_TIME_LIMITS: 'boolean | null' as const,
    POD_ID: 'string' as const,
    REPORT_FREQUENCY: 'string | null' as const,
    SEND_PROGRESS_REPORTS: 'boolean | null' as const,
    UPDATED_AT: 'string' as const,
    USER_ID: 'string' as const,
  } as const,

  MULTIPLAYER_CHAT_MESSAGES: {
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_FROM_HOST: 'boolean | null' as const,
    IS_FROM_NPC: 'boolean | null' as const,
    MESSAGE_TEXT: 'string' as const,
    MESSAGE_TYPE: 'string' as const,
    METADATA: 'Json | null' as const,
    PLAYER_ID: 'string' as const,
    REPLY_TO_MESSAGE_ID: 'string | null' as const,
    ROOM_ID: 'string' as const,
    TIMESTAMP: 'string | null' as const,
  } as const,

  MULTIPLAYER_CONVERSATION_CONTEXT: {
    CONVERSATION_HISTORY: 'Json | null' as const,
    CREATED_AT: 'string | null' as const,
    EDUCATIONAL_GOALS: 'Json | null' as const,
    ID: 'string' as const,
    LAST_INTERACTION_AT: 'string | null' as const,
    NPC_PLAYER_ID: 'string' as const,
    PERSONALITY_STATE: 'Json | null' as const,
    ROOM_ID: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  MULTIPLAYER_GAME_EVENTS: {
    CREATED_AT: 'string | null' as const,
    EVENT_DATA: 'Json | null' as const,
    EVENT_TYPE: 'string' as const,
    ID: 'string' as const,
    PLAYER_ID: 'string' as const,
    QUESTION_NUMBER: 'number | null' as const,
    ROOM_ID: 'string' as const,
    SESSION_ID: 'string' as const,
    TIMESTAMP: 'string | null' as const,
  } as const,

  MULTIPLAYER_GAME_SESSIONS: {
    COMPLETED_AT: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    CURRENT_QUESTION_NUMBER: 'number | null' as const,
    FINAL_SCORES: 'Json | null' as const,
    GAME_MODE: 'string' as const,
    ID: 'string' as const,
    PERFORMANCE_STATS: 'Json | null' as const,
    ROOM_ID: 'string' as const,
    SESSION_CONFIG: 'Json | null' as const,
    SESSION_NUMBER: 'number' as const,
    SESSION_STATUS: 'string' as const,
    STARTED_AT: 'string | null' as const,
    TOPIC_ID: 'string' as const,
    TOTAL_QUESTIONS: 'number' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  MULTIPLAYER_NPC_PLAYERS: {
    AI_BEHAVIOR_CONFIG: 'Json | null' as const,
    CREATED_AT: 'string | null' as const,
    DIFFICULTY_LEVEL: 'number | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    NPC_ID: 'string' as const,
    PERSONALITY_TYPE: 'string | null' as const,
    PLAYER_EMOJI: 'string' as const,
    PLAYER_NAME: 'string' as const,
    QUESTIONS_ANSWERED: 'number | null' as const,
    QUESTIONS_CORRECT: 'number | null' as const,
    ROOM_ID: 'string' as const,
    SCORE: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  MULTIPLAYER_QUESTION_RESPONSES: {
    BOOSTS_USED: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    HINTS_USED: 'number | null' as const,
    ID: 'string' as const,
    IS_CORRECT: 'boolean | null' as const,
    NPC_PLAYER_ID: 'string | null' as const,
    PLAYER_ID: 'string | null' as const,
    POINTS_EARNED: 'number | null' as const,
    QUESTION_ID: 'string' as const,
    QUESTION_NUMBER: 'number' as const,
    RESPONSE_METADATA: 'Json | null' as const,
    RESPONSE_TIME_MS: 'number | null' as const,
    ROOM_ID: 'string' as const,
    SELECTED_ANSWER: 'string | null' as const,
    SUBMITTED_AT: 'string | null' as const,
    TOPIC_ID: 'string' as const,
  } as const,

  MULTIPLAYER_QUIZ_ATTEMPTS: {
    ATTEMPT_DATA: 'Json | null' as const,
    COMPLETED_AT: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    FINAL_SCORE: 'number | null' as const,
    ID: 'string' as const,
    PLAYER_ID: 'string' as const,
    QUESTIONS_CORRECT: 'number | null' as const,
    QUESTIONS_TOTAL: 'number | null' as const,
    ROOM_ID: 'string' as const,
    SESSION_ID: 'string' as const,
    TIME_SPENT_SECONDS: 'number | null' as const,
    TOPIC_ID: 'string' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string | null' as const,
  } as const,

  MULTIPLAYER_ROOM_EVENTS: {
    CREATED_AT: 'string | null' as const,
    EVENT_DATA: 'Json | null' as const,
    EVENT_TYPE: 'string' as const,
    ID: 'string' as const,
    PLAYER_ID: 'string | null' as const,
    ROOM_ID: 'string' as const,
    TIMESTAMP: 'string | null' as const,
  } as const,

  MULTIPLAYER_ROOM_PLAYERS: {
    CREATED_AT: 'string | null' as const,
    GUEST_TOKEN: 'string | null' as const,
    ID: 'string' as const,
    IS_CONNECTED: 'boolean | null' as const,
    IS_HOST: 'boolean | null' as const,
    IS_READY: 'boolean | null' as const,
    JOIN_ORDER: 'number | null' as const,
    LAST_ACTIVITY_AT: 'string | null' as const,
    PLAYER_EMOJI: 'string | null' as const,
    PLAYER_NAME: 'string' as const,
    QUESTIONS_ANSWERED: 'number | null' as const,
    QUESTIONS_CORRECT: 'number | null' as const,
    ROOM_ID: 'string' as const,
    SCORE: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string | null' as const,
  } as const,

  MULTIPLAYER_ROOMS: {
    COMPLETED_AT: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    CURRENT_PLAYERS: 'number | null' as const,
    EXPIRES_AT: 'string | null' as const,
    GAME_MODE: 'string | null' as const,
    HOST_USER_ID: 'string | null' as const,
    ID: 'string' as const,
    MAX_PLAYERS: 'number | null' as const,
    ROOM_CODE: 'string' as const,
    ROOM_NAME: 'string | null' as const,
    ROOM_STATUS: 'string | null' as const,
    SETTINGS: 'Json | null' as const,
    STARTED_AT: 'string | null' as const,
    TOPIC_ID: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  NEWS_CACHE: {
    ARTICLES_DATA: 'Json' as const,
    CACHE_KEY: 'string' as const,
    CREATED_AT: 'string' as const,
    ID: 'string' as const,
    SOURCE_INFO: 'string | null' as const,
  } as const,

  NPC_CATEGORY_SPECIALIZATIONS: {
    CATEGORY: 'string' as const,
    CONFIDENCE_MODIFIER: 'number' as const,
    CREATED_AT: 'string' as const,
    ID: 'string' as const,
    MODIFIER_PERCENTAGE: 'number' as const,
    NPC_ID: 'string' as const,
    SPECIALIZATION_TYPE: 'string' as const,
  } as const,

  NPC_CHAT_TEMPLATES: {
    CONTEXT_FILTER: 'Json | null' as const,
    CREATED_AT: 'string' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean' as const,
    LAST_USED_AT: 'string | null' as const,
    MESSAGE_TEMPLATE: 'string' as const,
    MOOD_TAGS: 'string[] | null' as const,
    NPC_ID: 'string' as const,
    SKILL_LEVEL_TAGS: 'string[] | null' as const,
    TRIGGER_TYPE: 'string' as const,
    USAGE_COUNT: 'number' as const,
    VARIABLES: 'Json | null' as const,
  } as const,

  NPC_CONVERSATION_HISTORY: {
    CONTEXT_DATA: 'Json | null' as const,
    CREATED_AT: 'string' as const,
    EDUCATIONAL_VALUE: 'string | null' as const,
    FOLLOW_UP_GENERATED: 'boolean | null' as const,
    ID: 'string' as const,
    MESSAGE: 'string' as const,
    NPC_ID: 'string' as const,
    OPENAI_METADATA: 'Json | null' as const,
    PERSONALITY_TRAITS: 'string[] | null' as const,
    PLAYER_ID: 'string | null' as const,
    RESPONSE_TO_USER_ID: 'string | null' as const,
    ROOM_ID: 'string | null' as const,
    TONE: 'string | null' as const,
    TRIGGER_TYPE: 'string' as const,
    USER_REACTIONS: 'Json | null' as const,
  } as const,

  NPC_LEARNING_PROGRESSION: {
    AVG_HUMAN_ACCURACY: 'number | null' as const,
    CATEGORY: 'string' as const,
    CONFIDENCE_TREND: 'number' as const,
    CORRECT_RESPONSES: 'number' as const,
    CURRENT_ACCURACY: 'number' as const,
    ID: 'string' as const,
    LAST_UPDATED: 'string' as const,
    LEARNING_VELOCITY: 'number' as const,
    NPC_ID: 'string' as const,
    PERCENTILE_RANK: 'number | null' as const,
    PLATEAU_INDICATOR: 'number' as const,
    QUESTIONS_SEEN: 'number' as const,
    TOTAL_RESPONSE_TIME: 'number' as const,
    VS_HUMANS_WIN_RATE: 'number' as const,
  } as const,

  NPC_PERSONALITIES: {
    ADAPTATION_RATE: 'number' as const,
    AGE_RANGE: 'string | null' as const,
    BACKGROUND_STORY: 'string | null' as const,
    BASE_ACCURACY_MAX: 'number' as const,
    BASE_ACCURACY_MIN: 'number' as const,
    BASE_SKILL_LEVEL: 'string' as const,
    BYLINE: 'string | null' as const,
    CHATTINESS_LEVEL: 'number' as const,
    COMMUNICATION_STYLE: 'string | null' as const,
    CONFIDENCE_LEVEL: 'number' as const,
    CONSISTENCY_FACTOR: 'number' as const,
    CREATED_AT: 'string' as const,
    DESCRIPTION: 'string | null' as const,
    DISPLAY_NAME: 'string' as const,
    EMOJI: 'string' as const,
    ENCOURAGEMENT_STYLE: 'string' as const,
    FIRST_NAME: 'string | null' as const,
    HUMOR_LEVEL: 'number' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean' as const,
    LAST_NAME: 'string | null' as const,
    LEARNING_ENABLED: 'boolean' as const,
    LEARNING_MOTIVATION: 'string | null' as const,
    LOCATION: 'string | null' as const,
    MAX_SKILL_DRIFT: 'number' as const,
    NPC_CODE: 'string' as const,
    PERSONALITY_TYPE: 'string' as const,
    POLITICAL_ENGAGEMENT_LEVEL: 'string | null' as const,
    PREFERRED_TOPICS: 'string[] | null' as const,
    PROFESSION: 'string | null' as const,
    RESPONSE_TIME_MAX: 'number' as const,
    RESPONSE_TIME_MIN: 'number' as const,
    UPDATED_AT: 'string' as const,
  } as const,

  NPC_QUESTION_RESPONSES: {
    ANSWERED_AT: 'string' as const,
    ATTEMPT_ID: 'string' as const,
    BASE_ACCURACY_USED: 'number' as const,
    CATEGORY_MODIFIER_APPLIED: 'number' as const,
    CONFIDENCE_LEVEL: 'number' as const,
    CORRECT_ANSWER: 'string' as const,
    DIFFICULTY_MODIFIER_APPLIED: 'number' as const,
    HUMAN_RESPONSES_SEEN: 'number' as const,
    ID: 'string' as const,
    IS_CORRECT: 'boolean' as const,
    LEARNING_WEIGHT: 'number' as const,
    NPC_ID: 'string' as const,
    QUESTION_CATEGORY: 'string | null' as const,
    QUESTION_DIFFICULTY: 'number | null' as const,
    QUESTION_ID: 'string' as const,
    RANDOM_VARIANCE_APPLIED: 'number' as const,
    RESPONSE_TIME_SECONDS: 'number' as const,
    SELECTED_ANSWER: 'string | null' as const,
  } as const,

  NPC_QUIZ_ATTEMPTS: {
    ACCURACY_PERCENTAGE: 'number | null' as const,
    AVERAGE_HUMAN_SCORE: 'number | null' as const,
    COMPLETED_AT: 'string | null' as const,
    CONFIDENCE_AVERAGE: 'number' as const,
    CORRECT_ANSWERS: 'number' as const,
    DIFFICULTY_ADJUSTMENT: 'number' as const,
    HUMAN_OPPONENTS_COUNT: 'number' as const,
    ID: 'string' as const,
    IS_COMPLETED: 'boolean' as const,
    LEARNING_POINTS_GAINED: 'number' as const,
    MULTIPLAYER_ROOM_ID: 'string | null' as const,
    NPC_ID: 'string' as const,
    PLACEMENT_RANK: 'number | null' as const,
    SCORE: 'number' as const,
    STARTED_AT: 'string' as const,
    TIME_SPENT_SECONDS: 'number' as const,
    TOPIC_ID: 'string' as const,
    TOTAL_QUESTIONS: 'number' as const,
  } as const,

  ORGANIZATION_BIAS_SCORES: {
    CALCULATION_METHOD: 'string | null' as const,
    CONFIDENCE_LEVEL: 'number' as const,
    CREATED_AT: 'string | null' as const,
    CURRENT_SCORE: 'number' as const,
    DIMENSION_ID: 'string' as const,
    ID: 'string' as const,
    LAST_CALCULATED_AT: 'string | null' as const,
    ORGANIZATION_ID: 'string' as const,
    SAMPLE_SIZE: 'number' as const,
    SCORE_HISTORY: 'Json | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  ORGANIZATIONS: {
    ANNUAL_BUDGET: 'number | null' as const,
    CIVICSENSE_PRIORITY: 'number | null' as const,
    CONTENT_REVIEW_STATUS: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    EMPLOYEE_COUNT: 'number | null' as const,
    FOUNDING_DATE: 'string | null' as const,
    HEADQUARTERS_LOCATION: 'string | null' as const,
    ID: 'string' as const,
    INFLUENCE_LEVEL: 'number | null' as const,
    IS_ACTIVE: 'boolean | null' as const,
    KEY_FOCUS_AREAS: 'string[] | null' as const,
    MEDIA_MENTIONS_COUNT: 'number | null' as const,
    NAME: 'string' as const,
    ORGANIZATION_TYPE: 'string' as const,
    POLICY_IMPACT_SCORE: 'number | null' as const,
    POLITICAL_LEANING: 'string | null' as const,
    SLUG: 'string' as const,
    SOCIAL_MEDIA_HANDLES: 'Json | null' as const,
    SOURCES: 'Json | null' as const,
    UPDATED_AT: 'string | null' as const,
    WEBSITE_URL: 'string | null' as const,
  } as const,

  PARENTAL_CONTROLS: {
    ALERT_ON_INAPPROPRIATE_CONTENT: 'boolean | null' as const,
    ALLOWED_DAYS: 'number[] | null' as const,
    ALLOWED_DIFFICULTY_MAX: 'number | null' as const,
    ALLOWED_END_TIME: 'string | null' as const,
    ALLOWED_START_TIME: 'string | null' as const,
    BLOCKED_CATEGORIES: 'string[] | null' as const,
    BLOCKED_TOPICS: 'string[] | null' as const,
    CAN_ACCESS_CHAT: 'boolean | null' as const,
    CAN_ACCESS_MULTIPLAYER: 'boolean | null' as const,
    CAN_SHARE_PROGRESS: 'boolean | null' as const,
    CAN_VIEW_LEADERBOARDS: 'boolean | null' as const,
    CHILD_USER_ID: 'string' as const,
    CONTENT_FILTER_LEVEL: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    DAILY_TIME_LIMIT_MINUTES: 'number | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    PARENT_USER_ID: 'string' as const,
    POD_ID: 'string' as const,
    REPORT_FREQUENCY: 'string | null' as const,
    REQUIRE_PARENT_APPROVAL_FOR_FRIENDS: 'boolean | null' as const,
    SEND_PROGRESS_REPORTS: 'boolean | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  PATHWAY_SKILLS: {
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_REQUIRED: 'boolean | null' as const,
    PATHWAY_ID: 'string | null' as const,
    SEQUENCE_ORDER: 'number' as const,
    SKILL_ID: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  POD_ACHIEVEMENTS: {
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    DISPLAY_NAME: 'string' as const,
    EMOJI: 'string' as const,
    ID: 'string' as const,
    NAME: 'string' as const,
    RARITY: 'string | null' as const,
    REWARD_DATA: 'Json | null' as const,
    REWARD_TYPE: 'string | null' as const,
    UNLOCK_CONDITION: 'Json' as const,
  } as const,

  POD_ACTIVITIES: {
    ACTIVITY_DATA: 'Json | null' as const,
    ACTIVITY_TYPE: 'string' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_SHARED_PUBLICLY: 'boolean | null' as const,
    IS_VISIBLE_TO_POD: 'boolean | null' as const,
    POD_ID: 'string' as const,
    USER_ID: 'string' as const,
  } as const,

  POD_ACTIVITY_LOG: {
    ACTIVITY_DATA: 'Json | null' as const,
    ACTIVITY_TYPE: 'string' as const,
    CREATED_AT: 'string' as const,
    ID: 'string' as const,
    IP_ADDRESS: 'unknown | null' as const,
    POD_ID: 'string' as const,
    SESSION_ID: 'string | null' as const,
    USER_AGENT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  POD_ANALYTICS: {
    ACTIVE_MEMBERS_TODAY: 'number | null' as const,
    ACTIVE_MEMBERS_WEEK: 'number | null' as const,
    AVERAGE_ACCURACY: 'number | null' as const,
    AVERAGE_SESSION_LENGTH_MINUTES: 'number | null' as const,
    CATEGORY_PERFORMANCE: 'Json | null' as const,
    CREATED_AT: 'string | null' as const,
    DATE_RECORDED: 'string' as const,
    DIFFICULTY_DISTRIBUTION: 'Json | null' as const,
    FRIEND_REQUESTS_SENT: 'number | null' as const,
    ID: 'string' as const,
    MESSAGES_SENT: 'number | null' as const,
    MOST_POPULAR_TOPICS: 'Json | null' as const,
    MULTIPLAYER_SESSIONS: 'number | null' as const,
    NEW_MEMBERS_TODAY: 'number | null' as const,
    POD_ID: 'string' as const,
    TOTAL_ACHIEVEMENTS_EARNED: 'number | null' as const,
    TOTAL_CORRECT_ANSWERS: 'number | null' as const,
    TOTAL_MEMBERS: 'number | null' as const,
    TOTAL_QUESTIONS_ANSWERED: 'number | null' as const,
    TOTAL_QUIZ_ATTEMPTS: 'number | null' as const,
    TOTAL_STREAKS_STARTED: 'number | null' as const,
    TOTAL_TIME_SPENT_MINUTES: 'number | null' as const,
  } as const,

  POD_CHALLENGE_PARTICIPANTS: {
    CHALLENGE_ID: 'string' as const,
    COMPLETED_AT: 'string | null' as const,
    CURRENT_PROGRESS: 'Json | null' as const,
    FINAL_SCORE: 'number | null' as const,
    ID: 'string' as const,
    JOINED_AT: 'string | null' as const,
    RANK_POSITION: 'number | null' as const,
    USER_ID: 'string' as const,
  } as const,

  POD_CHALLENGES: {
    CHALLENGE_DESCRIPTION: 'string | null' as const,
    CHALLENGE_NAME: 'string' as const,
    CHALLENGE_TYPE: 'string' as const,
    CREATED_AT: 'string | null' as const,
    CREATED_BY: 'string' as const,
    END_DATE: 'string | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    POD_ID: 'string' as const,
    REWARD_DATA: 'Json | null' as const,
    REWARD_TYPE: 'string | null' as const,
    START_DATE: 'string | null' as const,
    TARGET_METRIC: 'Json' as const,
  } as const,

  POD_INVITE_LINKS: {
    AGE_RESTRICTIONS: 'Json | null' as const,
    ALLOWED_ROLES: 'string[] | null' as const,
    CREATED_AT: 'string | null' as const,
    CREATED_BY: 'string' as const,
    CURRENT_USES: 'number | null' as const,
    DESCRIPTION: 'string | null' as const,
    EXPIRES_AT: 'string | null' as const,
    ID: 'string' as const,
    INVITE_CODE: 'string' as const,
    INVITE_URL: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    MAX_USES: 'number | null' as const,
    POD_ID: 'string' as const,
    REQUIRE_APPROVAL: 'boolean | null' as const,
  } as const,

  POD_JOIN_REQUESTS: {
    CREATED_AT: 'string | null' as const,
    EXPIRES_AT: 'string | null' as const,
    ID: 'string' as const,
    INVITE_LINK_ID: 'string | null' as const,
    MESSAGE: 'string | null' as const,
    POD_ID: 'string' as const,
    REQUESTED_ROLE: 'string | null' as const,
    REQUESTER_AGE: 'number | null' as const,
    REQUESTER_ID: 'string' as const,
    REVIEW_MESSAGE: 'string | null' as const,
    REVIEWED_AT: 'string | null' as const,
    REVIEWED_BY: 'string | null' as const,
    STATUS: 'string | null' as const,
  } as const,

  POD_MEMBER_ANALYTICS: {
    ACCURACY_RATE: 'number | null' as const,
    ACHIEVEMENTS_EARNED: 'number | null' as const,
    AVERAGE_DIFFICULTY: 'number | null' as const,
    CORRECT_ANSWERS: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    CURRENT_STREAK: 'number | null' as const,
    DATE_RECORDED: 'string' as const,
    DIFFICULTY_PROGRESSION: 'Json | null' as const,
    HELP_PROVIDED: 'number | null' as const,
    HELP_REQUESTS_SENT: 'number | null' as const,
    ID: 'string' as const,
    LONGEST_SESSION_MINUTES: 'number | null' as const,
    LONGEST_STREAK: 'number | null' as const,
    MESSAGES_SENT: 'number | null' as const,
    MULTIPLAYER_PARTICIPATIONS: 'number | null' as const,
    POD_ID: 'string' as const,
    QUESTIONS_ANSWERED: 'number | null' as const,
    QUIZ_ATTEMPTS: 'number | null' as const,
    SESSIONS_COUNT: 'number | null' as const,
    TIME_SPENT_MINUTES: 'number | null' as const,
    TOPICS_COMPLETED: 'number | null' as const,
    USER_ID: 'string' as const,
  } as const,

  POD_MEMBER_SETTINGS: {
    ALERT_ON_INAPPROPRIATE_CONTENT: 'boolean | null' as const,
    ALLOW_SENSITIVE_TOPICS: 'boolean | null' as const,
    ALLOWED_DAYS: 'number[] | null' as const,
    ALLOWED_END_TIME: 'string | null' as const,
    ALLOWED_START_TIME: 'string | null' as const,
    BLOCKED_CATEGORIES: 'string[] | null' as const,
    CAN_ACCESS_CHAT: 'boolean | null' as const,
    CAN_ACCESS_MULTIPLAYER: 'boolean | null' as const,
    CAN_SHARE_PROGRESS: 'boolean | null' as const,
    CAN_VIEW_LEADERBOARDS: 'boolean | null' as const,
    CONTENT_FILTER_LEVEL: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    DAILY_TIME_LIMIT_MINUTES: 'number | null' as const,
    ID: 'string' as const,
    MAX_DIFFICULTY_LEVEL: 'number | null' as const,
    OVERRIDE_CONTENT_FILTER: 'boolean | null' as const,
    OVERRIDE_FEATURE_ACCESS: 'boolean | null' as const,
    OVERRIDE_MONITORING: 'boolean | null' as const,
    OVERRIDE_TIME_LIMITS: 'boolean | null' as const,
    POD_ID: 'string' as const,
    REPORT_FREQUENCY: 'string | null' as const,
    SEND_PROGRESS_REPORTS: 'boolean | null' as const,
    TRACK_DETAILED_ACTIVITY: 'boolean | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  POD_MEMBERSHIPS: {
    BIRTH_DATE: 'string | null' as const,
    CAN_INVITE_MEMBERS: 'boolean | null' as const,
    CAN_MESSAGE: 'boolean | null' as const,
    CAN_MODIFY_SETTINGS: 'boolean | null' as const,
    CAN_VIEW_PROGRESS: 'boolean | null' as const,
    CREATED_AT: 'string | null' as const,
    GRADE_LEVEL: 'string | null' as const,
    ID: 'string' as const,
    INVITED_BY: 'string | null' as const,
    JOINED_AT: 'string | null' as const,
    MEMBERSHIP_STATUS: 'string | null' as const,
    PARENTAL_CONSENT: 'boolean | null' as const,
    POD_ID: 'string' as const,
    ROLE: 'string' as const,
    USER_ID: 'string' as const,
  } as const,

  POD_PARTNERSHIPS: {
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    INITIATED_BY: 'string' as const,
    PARTNERSHIP_DATA: 'Json | null' as const,
    PARTNERSHIP_TYPE: 'string | null' as const,
    POD_1_ID: 'string' as const,
    POD_2_ID: 'string' as const,
    STATUS: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  POD_RATINGS: {
    COMMUNITY_RATING: 'number | null' as const,
    CONTENT_QUALITY_RATING: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_ANONYMOUS: 'boolean | null' as const,
    IS_PUBLIC: 'boolean | null' as const,
    ORGANIZATION_RATING: 'number | null' as const,
    POD_ID: 'string' as const,
    RATING: 'number' as const,
    REVIEW: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  POD_SETTINGS: {
    ALERT_ON_INAPPROPRIATE_CONTENT: 'boolean | null' as const,
    ALLOW_SENSITIVE_TOPICS: 'boolean | null' as const,
    ALLOWED_DAYS: 'number[] | null' as const,
    ALLOWED_END_TIME: 'string | null' as const,
    ALLOWED_START_TIME: 'string | null' as const,
    BLOCKED_CATEGORIES: 'string[] | null' as const,
    CAN_ACCESS_CHAT: 'boolean | null' as const,
    CAN_ACCESS_MULTIPLAYER: 'boolean | null' as const,
    CAN_SHARE_PROGRESS: 'boolean | null' as const,
    CAN_VIEW_LEADERBOARDS: 'boolean | null' as const,
    CREATED_AT: 'string' as const,
    DAILY_TIME_LIMIT_MINUTES: 'number | null' as const,
    DESCRIPTION: 'string | null' as const,
    ID: 'string' as const,
    IS_PUBLIC: 'boolean | null' as const,
    MAX_DIFFICULTY_LEVEL: 'number | null' as const,
    POD_ID: 'string' as const,
    REPORT_FREQUENCY: 'string | null' as const,
    REQUIRE_PARENT_APPROVAL_FOR_FRIENDS: 'boolean | null' as const,
    SEND_PROGRESS_REPORTS: 'boolean | null' as const,
    TRACK_DETAILED_ACTIVITY: 'boolean | null' as const,
    UPDATED_AT: 'string' as const,
    WELCOME_MESSAGE: 'string | null' as const,
  } as const,

  POD_THEMES: {
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    DISPLAY_NAME: 'string' as const,
    EMOJI: 'string' as const,
    ID: 'string' as const,
    IS_SEASONAL: 'boolean | null' as const,
    NAME: 'string' as const,
    PRIMARY_COLOR: 'string' as const,
    SEASON_END: 'string | null' as const,
    SEASON_START: 'string | null' as const,
    SECONDARY_COLOR: 'string | null' as const,
    UNLOCK_CONDITION: 'string | null' as const,
  } as const,

  PROFILES: {
    ACHIEVEMENT_BADGES: 'Json | null' as const,
    AVATAR_URL: 'string | null' as const,
    ENGAGEMENT_LEVEL: 'string | null' as const,
    FOCUS_AREAS: 'string[] | null' as const,
    FULL_NAME: 'string | null' as const,
    HIGH_CONTRAST_MODE: 'boolean | null' as const,
    ID: 'string' as const,
    IS_ADMIN: 'boolean | null' as const,
    PREFERRED_LANGUAGE: 'string | null' as const,
    PREFERRED_POD_PERSONALITY: 'string | null' as const,
    SENSORY_FRIENDLY_MODE: 'boolean | null' as const,
    TOTAL_ACHIEVEMENTS: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
    USERNAME: 'string | null' as const,
    WEBSITE: 'string | null' as const,
  } as const,

  PROGRESS_QUESTION_RESPONSES: {
    ANSWERED_AT: 'string' as const,
    ATTEMPT_NUMBER: 'number | null' as const,
    BOOST_USED: 'string | null' as const,
    HINT_USED: 'boolean | null' as const,
    ID: 'string' as const,
    IS_CORRECT: 'boolean' as const,
    PROGRESS_SESSION_ID: 'string' as const,
    QUESTION_ID: 'string | null' as const,
    QUESTION_INDEX: 'number' as const,
    TIME_SPENT_SECONDS: 'number | null' as const,
    USER_ANSWER: 'string' as const,
  } as const,

  QUESTION_ANALYTICS: {
    ID: 'number' as const,
    IS_CORRECT: 'boolean | null' as const,
    QUESTION_ID: 'string | null' as const,
    SELECTED_ANSWER: 'string | null' as const,
    TIME_SPENT_SECONDS: 'number | null' as const,
    TIMESTAMP: 'string | null' as const,
    USER_ID: 'string | null' as const,
  } as const,

  QUESTION_FEEDBACK: {
    CREATED_AT: 'string | null' as const,
    FEEDBACK_TYPE: 'string' as const,
    ID: 'string' as const,
    QUESTION_ID: 'string' as const,
    RATING: 'string | null' as const,
    REPORT_DETAILS: 'string | null' as const,
    REPORT_REASON: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  QUESTION_SKILLS: {
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_PRIMARY_SKILL: 'boolean | null' as const,
    QUESTION_ID: 'string' as const,
    SKILL_ID: 'string' as const,
    SKILL_WEIGHT: 'number | null' as const,
  } as const,

  QUESTION_SOURCE_LINKS: {
    CREATED_AT: 'string | null' as const,
    DISPLAY_ORDER: 'number | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    IS_PRIMARY_SOURCE: 'boolean | null' as const,
    QUESTION_ID: 'string' as const,
    RELEVANCE_SCORE: 'number | null' as const,
    SHOW_THUMBNAIL: 'boolean | null' as const,
    SOURCE_METADATA_ID: 'string' as const,
    SOURCE_NAME: 'string | null' as const,
    SOURCE_TYPE: 'string | null' as const,
  } as const,

  QUESTION_TOPICS: {
    CATEGORIES: 'Json' as const,
    CREATED_AT: 'string | null' as const,
    DATE: 'string | null' as const,
    DAY_OF_WEEK: 'string | null' as const,
    DESCRIPTION: 'string' as const,
    EMOJI: 'string' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    IS_BREAKING: 'boolean | null' as const,
    IS_FEATURED: 'boolean | null' as const,
    TOPIC_ID: 'string' as const,
    TOPIC_TITLE: 'string' as const,
    TRANSLATIONS: 'Json | null' as const,
    UPDATED_AT: 'string | null' as const,
    WHY_THIS_MATTERS: 'string' as const,
  } as const,

  QUESTIONS: {
    CATEGORY: 'string' as const,
    CORRECT_ANSWER: 'string' as const,
    CREATED_AT: 'string | null' as const,
    DIFFICULTY_LEVEL: 'number | null' as const,
    EXPLANATION: 'string' as const,
    FACT_CHECK_NOTES: 'Json | null' as const,
    FACT_CHECK_STATUS: 'string | null' as const,
    HINT: 'string' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    LAST_FACT_CHECK: 'string | null' as const,
    OPTION_A: 'string | null' as const,
    OPTION_B: 'string | null' as const,
    OPTION_C: 'string | null' as const,
    OPTION_D: 'string | null' as const,
    QUESTION: 'string' as const,
    QUESTION_NUMBER: 'number' as const,
    QUESTION_TYPE: 'string' as const,
    SOURCES: 'Json | null' as const,
    TAGS: 'Json | null' as const,
    TOPIC_ID: 'string' as const,
    TRANSLATIONS: 'Json | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  QUESTIONS_TEST: {
    CATEGORY: 'string' as const,
    CORRECT_ANSWER: 'string' as const,
    CREATED_AT: 'string | null' as const,
    DIFFICULTY_LEVEL: 'number | null' as const,
    EXPLANATION: 'string' as const,
    HINT: 'string' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    OPTION_A: 'string | null' as const,
    OPTION_B: 'string | null' as const,
    OPTION_C: 'string | null' as const,
    OPTION_D: 'string | null' as const,
    QUESTION: 'string' as const,
    QUESTION_NUMBER: 'number' as const,
    QUESTION_TYPE: 'string' as const,
    SOURCES: 'Json | null' as const,
    TAGS: 'Json | null' as const,
    TOPIC_ID: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  SCHEDULED_CONTENT_JOBS: {
    AVG_EXECUTION_TIME_MS: 'number | null' as const,
    CONSECUTIVE_FAILURES: 'number' as const,
    CREATED_AT: 'string' as const,
    CREATED_BY: 'string' as const,
    DESCRIPTION: 'string | null' as const,
    GENERATION_SETTINGS: 'Json' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean' as const,
    JOB_TYPE: 'string' as const,
    LAST_RUN_AT: 'string | null' as const,
    LAST_RUN_RESULT: 'Json | null' as const,
    LAST_RUN_STATUS: 'string | null' as const,
    MAX_FAILURES: 'number' as const,
    NAME: 'string' as const,
    NEXT_RUN_AT: 'string' as const,
    SCHEDULE_CONFIG: 'Json' as const,
    SUCCESSFUL_RUNS: 'number' as const,
    TOTAL_CONTENT_GENERATED: 'number' as const,
    TOTAL_RUNS: 'number' as const,
    UPDATED_AT: 'string' as const,
    UPDATED_BY: 'string | null' as const,
  } as const,

  SHAREABLE_GIFT_LINKS: {
    ACCESS_TYPE: 'string' as const,
    CREATED_AT: 'string | null' as const,
    CUSTOM_SLUG: 'string | null' as const,
    DONOR_USER_ID: 'string' as const,
    EXPIRES_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    LINK_CODE: 'string' as const,
    MAX_USES_PER_EMAIL: 'number | null' as const,
    MESSAGE: 'string | null' as const,
    SOURCE_DONATION_AMOUNT: 'number | null' as const,
    SOURCE_STRIPE_SESSION_ID: 'string | null' as const,
    TITLE: 'string | null' as const,
    TOTAL_CREDITS: 'number' as const,
    UPDATED_AT: 'string | null' as const,
    USED_CREDITS: 'number' as const,
  } as const,

  SHAREABLE_LINK_CLAIMS: {
    ACCESS_TYPE: 'string' as const,
    CLAIMED_AT: 'string | null' as const,
    CLAIMER_EMAIL: 'string' as const,
    CLAIMER_USER_ID: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IP_ADDRESS: 'unknown | null' as const,
    SHAREABLE_LINK_ID: 'string' as const,
    USER_AGENT: 'string | null' as const,
  } as const,

  SHARED_COLLECTION_ACCESS: {
    COLLECTION_ID: 'string' as const,
    CREATED_AT: 'string' as const,
    EXPIRES_AT: 'string | null' as const,
    ID: 'string' as const,
    PERMISSION_LEVEL: 'string' as const,
    SHARE_CODE: 'string | null' as const,
    SHARED_BY_USER_ID: 'string' as const,
    SHARED_WITH_EMAIL: 'string | null' as const,
    SHARED_WITH_USER_ID: 'string | null' as const,
  } as const,

  SKILL_ASSESSMENT_CRITERIA: {
    ASSESSMENT_METHOD: 'string' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    PASSING_CRITERIA: 'string' as const,
    PROFICIENCY_LEVEL: 'string' as const,
    SKILL_ID: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  SKILL_BADGES: {
    BADGE_DESCRIPTION: 'string' as const,
    BADGE_ICON: 'string' as const,
    BADGE_LEVEL: 'string' as const,
    BADGE_NAME: 'string' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  SKILL_CATEGORIES: {
    CATEGORY_NAME: 'string' as const,
    CREATED_AT: 'string' as const,
    DESCRIPTION: 'string | null' as const,
    DISPLAY_NAME: 'string' as const,
    DISPLAY_ORDER: 'number | null' as const,
    EMOJI: 'string | null' as const,
    ID: 'string' as const,
    UPDATED_AT: 'string' as const,
  } as const,

  SKILL_LEARNING_OBJECTIVES: {
    CREATED_AT: 'string | null' as const,
    DISPLAY_ORDER: 'number | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    MASTERY_LEVEL_REQUIRED: 'string | null' as const,
    OBJECTIVE_TEXT: 'string' as const,
    OBJECTIVE_TYPE: 'string | null' as const,
    SKILL_ID: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  SKILL_MASTERY_TRACKING: {
    COMPLETED_OBJECTIVES: 'Json | null' as const,
    CREATED_AT: 'string | null' as const,
    CURRENT_MASTERY_LEVEL: 'string' as const,
    ID: 'string' as const,
    LAST_ACTIVITY_DATE: 'string | null' as const,
    PROGRESS_PERCENTAGE: 'number' as const,
    SKILL_ID: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  SKILL_PRACTICE_RECOMMENDATIONS: {
    CREATED_AT: 'string | null' as const,
    DIFFICULTY_LEVEL: 'string' as const,
    ESTIMATED_MINUTES: 'number' as const,
    ID: 'string' as const,
    PRACTICE_DESCRIPTION: 'string' as const,
    PRACTICE_TYPE: 'string' as const,
    SKILL_ID: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  SKILL_PREREQUISITES: {
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_STRICT_REQUIREMENT: 'boolean | null' as const,
    PREREQUISITE_SKILL_ID: 'string' as const,
    REQUIRED_MASTERY_LEVEL: 'string | null' as const,
    SKILL_ID: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  SKILL_PROGRESSION_PATHWAYS: {
    CREATED_AT: 'string | null' as const,
    DIFFICULTY_LEVEL: 'string' as const,
    ESTIMATED_HOURS: 'number' as const,
    ID: 'string' as const,
    PATHWAY_DESCRIPTION: 'string' as const,
    PATHWAY_NAME: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  SKILL_RELATIONSHIPS: {
    CREATED_AT: 'string' as const,
    ID: 'string' as const,
    IS_STRICT_REQUIREMENT: 'boolean | null' as const,
    RELATIONSHIP_TYPE: 'string' as const,
    REQUIRED_MASTERY_LEVEL: 'string | null' as const,
    SOURCE_SKILL_ID: 'string' as const,
    TARGET_SKILL_ID: 'string' as const,
  } as const,

  SKILLS: {
    CATEGORY_ID: 'string' as const,
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    DIFFICULTY_LEVEL: 'number | null' as const,
    DISPLAY_ORDER: 'number | null' as const,
    EMOJI: 'string | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    IS_CORE_SKILL: 'boolean | null' as const,
    PARENT_SKILL_ID: 'string | null' as const,
    SKILL_NAME: 'string' as const,
    SKILL_SLUG: 'string' as const,
    UPDATED_AT: 'string | null' as const,
  } as const,

  SOURCE_CREDIBILITY_INDICATORS: {
    CREATED_AT: 'string | null' as const,
    FABRICATION_SCANDALS_COUNT: 'number | null' as const,
    FACT_CHECKING_PARTNERSHIPS: 'string[] | null' as const,
    ID: 'string' as const,
    MAJOR_CORRECTIONS_COUNT: 'number | null' as const,
    MAJOR_MISREPORTING_INCIDENTS: 'Json | null' as const,
    ORGANIZATION_ID: 'string | null' as const,
    PRESS_ASSOCIATIONS: 'string[] | null' as const,
    PRESS_FREEDOM_SCORE: 'number | null' as const,
    PULITZER_PRIZES: 'number | null' as const,
    TRANSPARENCY_REPORT_URL: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    VERIFIED_SCOOPS_COUNT: 'number | null' as const,
  } as const,

  SOURCE_FETCH_QUEUE: {
    CREATED_AT: 'string | null' as const,
    ERROR_MESSAGE: 'string | null' as const,
    FETCH_TYPE: 'string | null' as const,
    ID: 'string' as const,
    LAST_ATTEMPT_AT: 'string | null' as const,
    MAX_RETRIES: 'number | null' as const,
    PRIORITY: 'number | null' as const,
    RETRY_COUNT: 'number | null' as const,
    SCHEDULED_FOR: 'string | null' as const,
    URL: 'string' as const,
  } as const,

  SOURCE_METADATA: {
    AUTHOR: 'string | null' as const,
    BIAS_RATING: 'string | null' as const,
    CANONICAL_URL: 'string | null' as const,
    CONTENT_TYPE: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    CREDIBILITY_SCORE: 'number | null' as const,
    DESCRIPTION: 'string | null' as const,
    DOMAIN: 'string' as const,
    FAVICON_URL: 'string | null' as const,
    FETCH_ERROR: 'string | null' as const,
    FETCH_STATUS: 'string | null' as const,
    HAS_HTTPS: 'boolean | null' as const,
    HAS_VALID_SSL: 'boolean | null' as const,
    ID: 'string' as const,
    IS_ACCESSIBLE: 'boolean | null' as const,
    IS_ACTIVE: 'boolean | null' as const,
    LANGUAGE: 'string | null' as const,
    LAST_FETCHED_AT: 'string | null' as const,
    MODIFIED_TIME: 'string | null' as const,
    OG_DESCRIPTION: 'string | null' as const,
    OG_IMAGE: 'string | null' as const,
    OG_SITE_NAME: 'string | null' as const,
    OG_TITLE: 'string | null' as const,
    OG_TYPE: 'string | null' as const,
    PUBLISHED_TIME: 'string | null' as const,
    RESPONSE_TIME_MS: 'number | null' as const,
    TITLE: 'string' as const,
    TWITTER_DESCRIPTION: 'string | null' as const,
    TWITTER_IMAGE: 'string | null' as const,
    TWITTER_TITLE: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    URL: 'string' as const,
  } as const,

  SPACED_REPETITION_SCHEDULE: {
    CREATED_AT: 'string' as const,
    EASINESS_FACTOR: 'number | null' as const,
    ID: 'string' as const,
    INTERVAL_DAYS: 'number | null' as const,
    NEXT_REVIEW_DATE: 'string' as const,
    REPETITION_COUNT: 'number | null' as const,
    SKILL_ID: 'string' as const,
    UPDATED_AT: 'string' as const,
    USER_ID: 'string' as const,
  } as const,

  SUBSCRIPTION_TIER_LIMITS: {
    ADVANCED_ANALYTICS: 'boolean | null' as const,
    CREATED_AT: 'string | null' as const,
    CUSTOM_DECKS_LIMIT: 'number | null' as const,
    EXPORT_DATA: 'boolean | null' as const,
    HISTORICAL_MONTHS_LIMIT: 'number | null' as const,
    LEARNING_INSIGHTS: 'boolean | null' as const,
    OFFLINE_MODE: 'boolean | null' as const,
    PRIORITY_SUPPORT: 'boolean | null' as const,
    SPACED_REPETITION: 'boolean | null' as const,
    TIER: 'string' as const,
  } as const,

  SURVEY_ANSWERS: {
    ANSWER_DATA: 'Json' as const,
    ANSWERED_AT: 'string' as const,
    ID: 'string' as const,
    QUESTION_ID: 'string' as const,
    RESPONSE_ID: 'string' as const,
  } as const,

  SURVEY_LEARNING_GOALS: {
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    QUESTION_MAPPINGS: 'Json | null' as const,
    SKILL_ID: 'string | null' as const,
    SURVEY_ID: 'string | null' as const,
    WEIGHT: 'number | null' as const,
  } as const,

  SURVEY_QUESTIONS: {
    CONDITIONAL_LOGIC: 'Json | null' as const,
    CREATED_AT: 'string' as const,
    DESCRIPTION: 'string | null' as const,
    ID: 'string' as const,
    OPTIONS: 'Json | null' as const,
    QUESTION_ORDER: 'number' as const,
    QUESTION_TEXT: 'string' as const,
    QUESTION_TYPE: 'string' as const,
    REQUIRED: 'boolean' as const,
    SCALE_CONFIG: 'Json | null' as const,
    SURVEY_ID: 'string' as const,
    TRANSLATIONS: 'Json | null' as const,
  } as const,

  SURVEY_RECOMMENDATIONS: {
    BASED_ON_RESPONSES: 'Json' as const,
    CLICKED_ITEMS: 'Json | null' as const,
    GENERATED_AT: 'string | null' as const,
    GUEST_TOKEN: 'string | null' as const,
    ID: 'string' as const,
    RECOMMENDED_CONTENT: 'Json' as const,
    SURVEY_ID: 'string | null' as const,
    USER_ID: 'string | null' as const,
    VIEWED_AT: 'string | null' as const,
  } as const,

  SURVEY_RESPONSES: {
    COMPLETED_AT: 'string | null' as const,
    CREATED_AT: 'string' as const,
    GUEST_TOKEN: 'string | null' as const,
    ID: 'string' as const,
    IP_ADDRESS: 'unknown | null' as const,
    IS_COMPLETE: 'boolean' as const,
    SESSION_ID: 'string' as const,
    STARTED_AT: 'string' as const,
    SURVEY_ID: 'string' as const,
    UPDATED_AT: 'string' as const,
    USER_AGENT: 'string | null' as const,
    USER_ID: 'string | null' as const,
  } as const,

  SURVEYS: {
    ALLOW_ANONYMOUS: 'boolean' as const,
    ALLOW_PARTIAL_RESPONSES: 'boolean' as const,
    CLOSED_AT: 'string | null' as const,
    CREATED_AT: 'string' as const,
    CREATED_BY: 'string | null' as const,
    DESCRIPTION: 'string | null' as const,
    ESTIMATED_TIME: 'number | null' as const,
    ID: 'string' as const,
    POST_COMPLETION_CONFIG: 'Json | null' as const,
    PUBLISHED_AT: 'string | null' as const,
    STATUS: 'string' as const,
    TITLE: 'string' as const,
    TRANSLATIONS: 'Json | null' as const,
    UPDATED_AT: 'string' as const,
  } as const,

  SYSTEM_ALERTS: {
    ALERT_TYPE: 'string' as const,
    CREATED_AT: 'string' as const,
    ID: 'string' as const,
    MESSAGE: 'string' as const,
    METADATA: 'Json | null' as const,
    RESOLVED: 'boolean | null' as const,
    RESOLVED_AT: 'string | null' as const,
    SEVERITY: 'string' as const,
  } as const,

  TRANSLATION_JOBS: {
    CHARACTER_COUNT: 'number | null' as const,
    COMPLETED_AT: 'string | null' as const,
    CONTENT_ID: 'string' as const,
    CONTENT_TYPE: 'string' as const,
    CREATED_AT: 'string' as const,
    ERROR: 'string | null' as const,
    ESTIMATED_COMPLETION: 'string | null' as const,
    ID: 'string' as const,
    PRIORITY: 'string' as const,
    PROGRESS: 'number' as const,
    QUEUE_FOR_REVIEW: 'boolean' as const,
    RETRY_COUNT: 'number' as const,
    STARTED_AT: 'string | null' as const,
    STATUS: 'string' as const,
    TARGET_LANGUAGE: 'string' as const,
    UPDATED_AT: 'string' as const,
  } as const,

  USER_ACHIEVEMENTS: {
    ACHIEVEMENT_DATA: 'Json | null' as const,
    ACHIEVEMENT_TYPE: 'string' as const,
    EARNED_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_MILESTONE: 'boolean | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_ACTIVE_BOOSTS: {
    BOOST_DATA: 'Json | null' as const,
    BOOST_TYPE: 'string' as const,
    CREATED_AT: 'string | null' as const,
    EXPIRES_AT: 'string | null' as const,
    ID: 'string' as const,
    STARTED_AT: 'string' as const,
    USER_ID: 'string' as const,
    USES_REMAINING: 'number | null' as const,
  } as const,

  USER_ASSESSMENT_ATTEMPTS: {
    ASSESSMENT_TYPE: 'string' as const,
    COMPLETED_AT: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IS_COMPLETED: 'boolean | null' as const,
    LEVEL_ACHIEVED: 'string | null' as const,
    SCORE: 'number' as const,
    TIME_SPENT_SECONDS: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_ASSESSMENTS: {
    ANSWERS: 'Json | null' as const,
    ASSESSMENT_TYPE: 'string' as const,
    CATEGORY_BREAKDOWN: 'Json | null' as const,
    COMPLETED_AT: 'string | null' as const,
    ID: 'string' as const,
    LEVEL: 'string' as const,
    METADATA: 'Json | null' as const,
    SCORE: 'number' as const,
    USER_ID: 'string | null' as const,
  } as const,

  USER_BADGES: {
    BADGE_ID: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    EARNED_AT: 'string | null' as const,
    ID: 'string' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_BOOST_INVENTORY: {
    BOOST_TYPE: 'string' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    LAST_COOLDOWN_USED: 'string | null' as const,
    LAST_PURCHASED: 'string | null' as const,
    QUANTITY: 'number' as const,
    TOTAL_PURCHASED: 'number' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_CATEGORY_PREFERENCES: {
    CATEGORY_ID: 'string' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    INTEREST_LEVEL: 'number' as const,
    LEARNING_GOAL: 'string | null' as const,
    PRIORITY_RANK: 'number | null' as const,
    SELECTED_DURING_ONBOARDING: 'boolean | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_CATEGORY_SKILLS: {
    CATEGORY: 'string' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    LAST_PRACTICED_AT: 'string | null' as const,
    MASTERY_LEVEL: 'string | null' as const,
    QUESTIONS_ATTEMPTED: 'number | null' as const,
    QUESTIONS_CORRECT: 'number | null' as const,
    SKILL_LEVEL: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_CUSTOM_DECKS: {
    CREATED_AT: 'string | null' as const,
    DECK_NAME: 'string' as const,
    DECK_TYPE: 'string' as const,
    DESCRIPTION: 'string | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    PREFERENCES: 'Json | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_DECK_CONTENT: {
    ADDED_AT: 'string | null' as const,
    DECK_ID: 'string' as const,
    ID: 'string' as const,
    PRIORITY_SCORE: 'number | null' as const,
    QUESTION_ID: 'string | null' as const,
    TOPIC_ID: 'string | null' as const,
  } as const,

  USER_EMAIL_PREFERENCES: {
    ACHIEVEMENT_ALERTS: 'boolean | null' as const,
    ALLOW_DATA_ANALYTICS: 'boolean | null' as const,
    ALLOW_PERSONALIZATION: 'boolean | null' as const,
    AUTO_SHARE_ACHIEVEMENTS: 'boolean | null' as const,
    CIVIC_NEWS_ALERTS: 'boolean | null' as const,
    COMMUNITY_DIGEST: 'boolean | null' as const,
    CREATED_AT: 'string' as const,
    DATA_RETENTION_PERIOD: 'string | null' as const,
    EMAIL_DELIVERY_FREQUENCY: 'string | null' as const,
    EMAIL_FORMAT: 'string | null' as const,
    EMAIL_NOTIFICATIONS: 'boolean | null' as const,
    EXPORT_FORMAT: 'string | null' as const,
    ID: 'string' as const,
    INTEGRATION_SYNC: 'boolean | null' as const,
    MARKETING_EMAILS: 'boolean | null' as const,
    NOTIFICATION_CHANNELS: 'Json | null' as const,
    PRODUCT_UPDATES: 'boolean | null' as const,
    RE_ENGAGEMENT_EMAILS: 'boolean | null' as const,
    SOCIAL_SHARING_ENABLED: 'boolean | null' as const,
    SURVEY_INVITATIONS: 'boolean | null' as const,
    UPDATED_AT: 'string' as const,
    USER_ID: 'string' as const,
    WEEKLY_DIGEST: 'boolean | null' as const,
  } as const,

  USER_FEATURE_USAGE: {
    CREATED_AT: 'string | null' as const,
    FEATURE_NAME: 'string' as const,
    ID: 'string' as const,
    LAST_USED_AT: 'string | null' as const,
    MONTHLY_LIMIT: 'number | null' as const,
    RESET_DATE: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    USAGE_COUNT: 'number | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_FEEDBACK: {
    CONTEXT_ID: 'string | null' as const,
    CONTEXT_TYPE: 'string' as const,
    CREATED_AT: 'string' as const,
    FEEDBACK_TEXT: 'string' as const,
    FEEDBACK_TYPE: 'string' as const,
    ID: 'string' as const,
    PATH: 'string | null' as const,
    RATING: 'number | null' as const,
    STATUS: 'string' as const,
    SUBMITTED_AT: 'string' as const,
    UPDATED_AT: 'string' as const,
    USER_AGENT: 'string | null' as const,
    USER_EMAIL: 'string | null' as const,
    USER_ID: 'string | null' as const,
  } as const,

  USER_LEARNING_GOALS: {
    CATEGORY: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    DIFFICULTY_LEVEL: 'number | null' as const,
    GOAL_TYPE: 'string' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    TARGET_DATE: 'string | null' as const,
    TARGET_VALUE: 'number' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_LEARNING_INSIGHTS: {
    ACTION_ITEMS: 'Json | null' as const,
    CONFIDENCE_SCORE: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    DESCRIPTION: 'string' as const,
    ID: 'string' as const,
    INSIGHT_CATEGORY: 'string | null' as const,
    INSIGHT_TYPE: 'string' as const,
    IS_DISMISSED: 'boolean | null' as const,
    IS_READ: 'boolean | null' as const,
    PRIORITY_LEVEL: 'number | null' as const,
    TITLE: 'string' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
    VALID_UNTIL: 'string | null' as const,
  } as const,

  USER_ONBOARDING_STATE: {
    COMPLETED_AT: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    CURRENT_STEP: 'string' as const,
    ID: 'string' as const,
    IS_COMPLETED: 'boolean | null' as const,
    ONBOARDING_DATA: 'Json | null' as const,
    SKIP_REASON: 'string | null' as const,
    STARTED_AT: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_PLATFORM_PREFERENCES: {
    ACHIEVEMENT_NOTIFICATIONS: 'boolean | null' as const,
    COMPETITIVE_MODE: 'boolean | null' as const,
    CREATED_AT: 'string | null' as const,
    DAILY_REMINDER: 'boolean | null' as const,
    EMAIL_NOTIFICATIONS: 'boolean | null' as const,
    FONT_SIZE: 'string | null' as const,
    HIGH_CONTRAST: 'boolean | null' as const,
    ID: 'string' as const,
    LEARNING_PACE: 'string | null' as const,
    PREFERRED_CONTENT_TYPES: 'string[] | null' as const,
    PREFERRED_DIFFICULTY: 'string | null' as const,
    PREFERRED_QUIZ_LENGTH: 'number | null' as const,
    PUSH_NOTIFICATIONS: 'boolean | null' as const,
    REDUCED_MOTION: 'boolean | null' as const,
    SCREEN_READER_MODE: 'boolean | null' as const,
    SHOW_ACHIEVEMENTS: 'boolean | null' as const,
    SHOW_DIFFICULTY_INDICATORS: 'boolean | null' as const,
    SHOW_EXPLANATIONS: 'boolean | null' as const,
    SHOW_LEADERBOARDS: 'boolean | null' as const,
    SHOW_SOURCES: 'boolean | null' as const,
    SHOW_STREAKS: 'boolean | null' as const,
    STUDY_TIME_PREFERENCE: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
    WEEKLY_SUMMARY: 'boolean | null' as const,
  } as const,

  USER_PROGRESS: {
    ADAPTIVE_DIFFICULTY: 'boolean | null' as const,
    CREATED_AT: 'string | null' as const,
    CURRENT_LEVEL: 'number | null' as const,
    CURRENT_STREAK: 'number | null' as const,
    FAVORITE_CATEGORIES: 'Json | null' as const,
    ID: 'string' as const,
    LAST_ACTIVITY_DATE: 'string | null' as const,
    LEARNING_STYLE: 'string | null' as const,
    LONGEST_STREAK: 'number | null' as const,
    PREFERRED_CATEGORIES: 'Json | null' as const,
    TOTAL_CORRECT_ANSWERS: 'number | null' as const,
    TOTAL_QUESTIONS_ANSWERED: 'number | null' as const,
    TOTAL_QUIZZES_COMPLETED: 'number | null' as const,
    TOTAL_XP: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
    WEEK_START_DATE: 'string | null' as const,
    WEEKLY_COMPLETED: 'number | null' as const,
    WEEKLY_GOAL: 'number | null' as const,
    XP_TO_NEXT_LEVEL: 'number | null' as const,
  } as const,

  USER_PROGRESS_HISTORY: {
    ACCURACY_PERCENTAGE: 'number | null' as const,
    CATEGORY_STATS: 'Json | null' as const,
    CREATED_AT: 'string | null' as const,
    CURRENT_LEVEL: 'number | null' as const,
    CURRENT_STREAK: 'number | null' as const,
    ID: 'string' as const,
    LONGEST_STREAK: 'number | null' as const,
    PERIOD_CORRECT_ANSWERS: 'number | null' as const,
    PERIOD_QUESTIONS_ANSWERED: 'number | null' as const,
    PERIOD_QUIZZES_COMPLETED: 'number | null' as const,
    PERIOD_XP_GAINED: 'number | null' as const,
    SNAPSHOT_DATE: 'string' as const,
    SNAPSHOT_TYPE: 'string' as const,
    TOTAL_CORRECT_ANSWERS: 'number | null' as const,
    TOTAL_QUESTIONS_ANSWERED: 'number | null' as const,
    TOTAL_QUIZZES_COMPLETED: 'number | null' as const,
    TOTAL_XP: 'number | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_QUESTION_MEMORY: {
    CONSECUTIVE_CORRECT: 'number | null' as const,
    EASINESS_FACTOR: 'number | null' as const,
    ID: 'string' as const,
    INTERVAL_DAYS: 'number | null' as const,
    LAST_REVIEWED_AT: 'string | null' as const,
    NEXT_REVIEW_DATE: 'string | null' as const,
    QUESTION_ID: 'string' as const,
    REPETITION_COUNT: 'number | null' as const,
    TOTAL_ATTEMPTS: 'number | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_QUESTION_RESPONSES: {
    ATTEMPT_ID: 'string' as const,
    CREATED_AT: 'string | null' as const,
    HINT_USED: 'boolean | null' as const,
    ID: 'string' as const,
    IS_CORRECT: 'boolean' as const,
    QUESTION_ID: 'string' as const,
    TIME_SPENT_SECONDS: 'number | null' as const,
    USER_ANSWER: 'string' as const,
  } as const,

  USER_QUIZ_ANALYTICS: {
    AVERAGE_TIME_PER_QUESTION: 'number | null' as const,
    CATEGORY_PERFORMANCE: 'Json | null' as const,
    COMPLETION_RATE: 'number | null' as const,
    CONSISTENCY_SCORE: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    DIFFICULTY_PERFORMANCE: 'Json | null' as const,
    FASTEST_QUESTION_TIME: 'number | null' as const,
    HINT_USAGE_RATE: 'number | null' as const,
    ID: 'string' as const,
    IMPROVEMENT_TREND: 'number | null' as const,
    OPTIMAL_STUDY_TIME: 'string | null' as const,
    QUESTION_TYPE_PERFORMANCE: 'Json | null' as const,
    QUIZ_ATTEMPT_ID: 'string | null' as const,
    RETRY_RATE: 'number | null' as const,
    SLOWEST_QUESTION_TIME: 'number | null' as const,
    TIME_DISTRIBUTION: 'Json | null' as const,
    TOPIC_ID: 'string | null' as const,
    TOTAL_TIME_SECONDS: 'number' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_QUIZ_ATTEMPTS: {
    CLEVER_ASSIGNMENT_ID: 'string | null' as const,
    CLEVER_SECTION_ID: 'string | null' as const,
    COMPLETED_AT: 'string | null' as const,
    CORRECT_ANSWERS: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    GAME_MODE: 'string | null' as const,
    GAME_METADATA: 'Json | null' as const,
    GRADE_POST_ERROR: 'string | null' as const,
    GRADE_POST_TIMESTAMP: 'string | null' as const,
    GRADE_POSTED_TO_LMS: 'boolean | null' as const,
    ID: 'string' as const,
    IS_COMPLETED: 'boolean | null' as const,
    SCORE: 'number | null' as const,
    STARTED_AT: 'string | null' as const,
    TIME_SPENT_SECONDS: 'number | null' as const,
    TOPIC_ID: 'string' as const,
    TOTAL_QUESTIONS: 'number' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_ROLES: {
    CREATED_AT: 'string | null' as const,
    GRANTED_AT: 'string | null' as const,
    GRANTED_BY: 'string | null' as const,
    ID: 'string' as const,
    PERMISSIONS: 'Json | null' as const,
    ROLE: 'string' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_SKILL_PREFERENCES: {
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    INTEREST_LEVEL: 'number' as const,
    LEARNING_TIMELINE: 'string | null' as const,
    PRIORITY_RANK: 'number | null' as const,
    SELECTED_DURING_ONBOARDING: 'boolean | null' as const,
    SKILL_ID: 'string' as const,
    TARGET_MASTERY_LEVEL: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_SKILL_PROGRESS: {
    AVERAGE_TIME_PER_QUESTION: 'number | null' as const,
    CONFIDENCE_LEVEL: 'number | null' as const,
    CONSECUTIVE_CORRECT: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    ID: 'string' as const,
    IMPROVEMENT_RATE: 'number | null' as const,
    LAST_PRACTICED_AT: 'string | null' as const,
    MASTERY_ACHIEVED_AT: 'string | null' as const,
    MASTERY_LEVEL: 'string | null' as const,
    NEXT_REVIEW_DATE: 'string | null' as const,
    QUESTIONS_ATTEMPTED: 'number | null' as const,
    QUESTIONS_CORRECT: 'number | null' as const,
    REVIEW_INTERVAL_DAYS: 'number | null' as const,
    SKILL_ID: 'string' as const,
    SKILL_LEVEL: 'number | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_STREAK_HISTORY: {
    CATEGORY: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    END_DATE: 'string | null' as const,
    ID: 'string' as const,
    IS_ACTIVE: 'boolean | null' as const,
    START_DATE: 'string' as const,
    STREAK_TYPE: 'string' as const,
    STREAK_VALUE: 'number' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_SUBSCRIPTIONS: {
    AMOUNT_CENTS: 'number | null' as const,
    BILLING_CYCLE: 'string | null' as const,
    CREATED_AT: 'string | null' as const,
    CURRENCY: 'string | null' as const,
    EXTERNAL_SUBSCRIPTION_ID: 'string | null' as const,
    ID: 'string' as const,
    LAST_PAYMENT_DATE: 'string | null' as const,
    NEXT_BILLING_DATE: 'string | null' as const,
    PAYMENT_PROVIDER: 'string | null' as const,
    SUBSCRIPTION_END_DATE: 'string | null' as const,
    SUBSCRIPTION_START_DATE: 'string | null' as const,
    SUBSCRIPTION_STATUS: 'string' as const,
    SUBSCRIPTION_TIER: 'string' as const,
    TRIAL_END_DATE: 'string | null' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string' as const,
  } as const,

  USER_SURVEY_COMPLETIONS: {
    COMPLETED_AT: 'string' as const,
    COMPLETION_TIME_SECONDS: 'number | null' as const,
    CREATED_AT: 'string | null' as const,
    GUEST_TOKEN: 'string | null' as const,
    ID: 'string' as const,
    QUESTIONS_ANSWERED: 'number' as const,
    RESPONSE_ID: 'string | null' as const,
    SURVEY_ID: 'string | null' as const,
    TOTAL_QUESTIONS: 'number' as const,
    UPDATED_AT: 'string | null' as const,
    USER_ID: 'string | null' as const,
  } as const,

} as const;

// =============================================================================
// DATABASE ENUMS
// =============================================================================

export const DB_ENUMS = {
  COURSE_ROLE: {
    STUDENT: 'student' as const,
    TEACHER: 'teacher' as const,
    TEACHING_ASSISTANT: 'teaching_assistant' as const,
    OBSERVER: 'observer' as const,
  } as const,

  ENROLLMENT_STATUS: {
    ACTIVE: 'active' as const,
    DROPPED: 'dropped' as const,
    COMPLETED: 'completed' as const,
    TRANSFERRED: 'transferred' as const,
  } as const,

  SCHOOL_USER_ROLE: {
    STUDENT: 'student' as const,
    TEACHER: 'teacher' as const,
    ADMINISTRATOR: 'administrator' as const,
    COUNSELOR: 'counselor' as const,
    PARENT: 'parent' as const,
    DISTRICT_ADMIN: 'district_admin' as const,
  } as const,

  SYNC_STATUS: {
    PENDING: 'pending' as const,
    IN_PROGRESS: 'in_progress' as const,
    COMPLETED: 'completed' as const,
    FAILED: 'failed' as const,
    CANCELLED: 'cancelled' as const,
  } as const,

  SYNC_TYPE: {
    ROSTER_IMPORT: 'roster_import' as const,
    GRADE_EXPORT: 'grade_export' as const,
    ASSIGNMENT_CREATE: 'assignment_create' as const,
    ENROLLMENT_SYNC: 'enrollment_sync' as const,
  } as const,

} as const;

export type DbEnumName = keyof typeof DB_ENUMS;

// =============================================================================
// ENUM UTILITY FUNCTIONS
// =============================================================================

export const isValidEnumValue = (enumName: string, value: string): boolean => {
  const enumKey = enumName.toUpperCase() as keyof typeof DB_ENUMS;
  const enumValues = DB_ENUMS[enumKey];
  return enumValues ? Object.values(enumValues).includes(value as any) : false;
};

export const getEnumValues = (enumName: string): string[] => {
  const enumKey = enumName.toUpperCase() as keyof typeof DB_ENUMS;
  const enumValues = DB_ENUMS[enumKey];
  return enumValues ? Object.values(enumValues) : [];
};

export const getAllEnumSchemas = () => {
  return Object.keys(DB_ENUMS).map(enumKey => ({
    enumName: enumKey.toLowerCase(),
    values: Object.values(DB_ENUMS[enumKey as keyof typeof DB_ENUMS])
  }));
};

// =============================================================================
// DATABASE FUNCTIONS
// =============================================================================

export const DB_FUNCTIONS = {
  ADD_NPC_TO_MULTIPLAYER_ROOM: 'add_npc_to_multiplayer_room' as const,
  ANALYZE_IMAGE_AB_TEST: 'analyze_image_ab_test' as const,
  CALCULATE_BIAS_CONSENSUS: 'calculate_bias_consensus' as const,
  CALCULATE_GIFT_CREDITS: 'calculate_gift_credits' as const,
  CALCULATE_NEXT_RUN_TIME: 'calculate_next_run_time' as const,
  CALCULATE_POD_ANALYTICS: 'calculate_pod_analytics' as const,
  CAN_ACCESS_ROOM: 'can_access_room' as const,
  CAN_JOIN_POD_VIA_INVITE: 'can_join_pod_via_invite' as const,
  CHECK_ALL_PLAYERS_READY: 'check_all_players_ready' as const,
  CHECK_AND_AWARD_ACHIEVEMENTS: 'check_and_award_achievements' as const,
  CHECK_BOOST_COOLDOWN: 'check_boost_cooldown' as const,
  CHECK_IMAGE_GENERATION_PERFORMANCE: 'check_image_generation_performance' as const,
  CHECK_PREMIUM_FEATURE_ACCESS: 'check_premium_feature_access' as const,
  CHECK_SILENCE_INTERVENTION: 'check_silence_intervention' as const,
  CLAIM_SHAREABLE_GIFT_LINK: 'claim_shareable_gift_link' as const,
  CLEANUP_EXPIRED_BOOSTS: 'cleanup_expired_boosts' as const,
  CLEANUP_EXPIRED_PROGRESS_SESSIONS: 'cleanup_expired_progress_sessions' as const,
  CLEANUP_EXPIRED_ROOMS: 'cleanup_expired_rooms' as const,
  CLEANUP_INACTIVE_PLAYERS: 'cleanup_inactive_players' as const,
  CLEANUP_OLD_JOB_DATA: 'cleanup_old_job_data' as const,
  CLEANUP_OLD_TRANSLATION_JOBS: 'cleanup_old_translation_jobs' as const,
  COMPLETE_ONBOARDING_STEP: 'complete_onboarding_step' as const,
  CONVERT_GUEST_CIVICS_RESULTS: 'convert_guest_civics_results' as const,
  CREATE_GIFT_REDEMPTION: 'create_gift_redemption' as const,
  CREATE_LEARNING_POD: 'create_learning_pod' as const,
  CREATE_MULTIPLAYER_ROOM: 'create_multiplayer_room' as const,
  CREATE_POD_INVITE_LINK: 'create_pod_invite_link' as const,
  CREATE_SHAREABLE_GIFT_LINK: 'create_shareable_gift_link' as const,
  DETECT_ALL_TYPE_MISMATCHES: 'detect_all_type_mismatches' as const,
  GENERATE_INVITE_CODE: 'generate_invite_code' as const,
  GENERATE_POD_SLUG: 'generate_pod_slug' as const,
  GENERATE_ROOM_CODE: 'generate_room_code' as const,
  GENERATE_ROOM_SLUG: 'generate_room_slug' as const,
  GET_ACTIVE_GAME_SESSION: 'get_active_game_session' as const,
  GET_ASSESSMENT_QUESTION_SOCIAL_PROOF_STATS: 'get_assessment_question_social_proof_stats' as const,
  GET_AVAILABLE_BOOSTS_FOR_USER: 'get_available_boosts_for_user' as const,
  GET_CONTENT_TRANSLATION_STATS: 'get_content_translation_stats' as const,
  GET_DETAILED_GIFT_CREDITS: 'get_detailed_gift_credits' as const,
  GET_EFFECTIVE_MEMBER_SETTINGS: 'get_effective_member_settings' as const,
  GET_FUNCTION_RETURN_INFO: 'get_function_return_info' as const,
  GET_GIFT_ANALYTICS_SUMMARY: 'get_gift_analytics_summary' as const,
  GET_GUEST_TEST_SUMMARY: 'get_guest_test_summary' as const,
  GET_JOBS_READY_FOR_EXECUTION: 'get_jobs_ready_for_execution' as const,
  GET_NPC_CATEGORY_PERFORMANCE: 'get_npc_category_performance' as const,
  GET_ONBOARDING_CATEGORIES: 'get_onboarding_categories' as const,
  GET_ONBOARDING_SKILLS: 'get_onboarding_skills' as const,
  GET_OR_CREATE_MEDIA_ORGANIZATION: 'get_or_create_media_organization' as const,
  GET_OR_CREATE_SOURCE_METADATA: 'get_or_create_source_metadata' as const,
  GET_OR_CREATE_TAG: 'get_or_create_tag' as const,
  GET_PEOPLE_HELPED_BY_DONOR: 'get_people_helped_by_donor' as const,
  GET_POD_ANALYTICS: 'get_pod_analytics' as const,
  GET_QUESTION_SOCIAL_PROOF_STATS: 'get_question_social_proof_stats' as const,
  GET_RECOMMENDED_SKILLS_FOR_USER: 'get_recommended_skills_for_user' as const,
  GET_ROOM_MEMBERS: 'get_room_members' as const,
  GET_SHAREABLE_LINK_INFO: 'get_shareable_link_info' as const,
  GET_SKILLS_NEEDING_REVIEW: 'get_skills_needing_review' as const,
  GET_SOCIAL_PROOF_MESSAGE: 'get_social_proof_message' as const,
  GET_TABLE_COLUMN_INFO: 'get_table_column_info' as const,
  GET_TRANSLATABLE_CONTENT_SUMMARY: 'get_translatable_content_summary' as const,
  GET_TRANSLATION: 'get_translation' as const,
  GET_USER_BOOST_SUMMARY: 'get_user_boost_summary' as const,
  GET_USER_EMAIL_PREFERENCES: 'get_user_email_preferences' as const,
  GET_USER_FEATURE_LIMITS: 'get_user_feature_limits' as const,
  GET_USER_GIFT_CREDITS: 'get_user_gift_credits' as const,
  GET_USER_ONBOARDING_PROGRESS: 'get_user_onboarding_progress' as const,
  GET_USER_POD_MEMBERSHIPS: 'get_user_pod_memberships' as const,
  GET_USER_PROGRESS_SESSIONS: 'get_user_progress_sessions' as const,
  GET_USER_ROOMS: 'get_user_rooms' as const,
  GET_USER_SHAREABLE_LINKS: 'get_user_shareable_links' as const,
  GTRGM_COMPRESS: 'gtrgm_compress' as const,
  GTRGM_DECOMPRESS: 'gtrgm_decompress' as const,
  GTRGM_IN: 'gtrgm_in' as const,
  GTRGM_OPTIONS: 'gtrgm_options' as const,
  GTRGM_OUT: 'gtrgm_out' as const,
  IS_ADMIN: 'is_admin' as const,
  IS_CONTENT_APPROPRIATE_FOR_USER: 'is_content_appropriate_for_user' as const,
  IS_EDUCATIONAL_EMAIL: 'is_educational_email' as const,
  JOIN_MULTIPLAYER_ROOM: 'join_multiplayer_room' as const,
  JOIN_POD_VIA_INVITE: 'join_pod_via_invite' as const,
  LEAVE_MULTIPLAYER_ROOM: 'leave_multiplayer_room' as const,
  LINK_QUESTION_TO_SOURCE: 'link_question_to_source' as const,
  LOG_POD_ACTIVITY: 'log_pod_activity' as const,
  MIGRATE_PROGRESS_SESSION_TO_COMPLETION: 'migrate_progress_session_to_completion' as const,
  POPULATE_HISTORICAL_ANALYTICS: 'populate_historical_analytics' as const,
  PROCESS_DONATION_GIFT_CREDITS: 'process_donation_gift_credits' as const,
  RECORD_GAME_EVENT: 'record_game_event' as const,
  RECORD_ROOM_EVENT: 'record_room_event' as const,
  REDEEM_GIFT_CODE: 'redeem_gift_code' as const,
  REPAIR_ROOMS_WITHOUT_HOSTS: 'repair_rooms_without_hosts' as const,
  SEARCH_BOOKMARKS: 'search_bookmarks' as const,
  SEND_NPC_MESSAGE: 'send_npc_message' as const,
  SET_LIMIT: 'set_limit' as const,
  SET_TRANSLATION: 'set_translation' as const,
  SHOW_LIMIT: 'show_limit' as const,
  SHOW_TRGM: 'show_trgm' as const,
  START_MULTIPLAYER_GAME: 'start_multiplayer_game' as const,
  TEST_MULTIPLAYER_OPERATIONS: 'test_multiplayer_operations' as const,
  TRACK_FEATURE_USAGE: 'track_feature_usage' as const,
  UPDATE_BOOKMARK_ACCESS: 'update_bookmark_access' as const,
  UPDATE_CONVERSATION_CONTEXT: 'update_conversation_context' as const,
  UPDATE_JOB_AFTER_EXECUTION: 'update_job_after_execution' as const,
  UPDATE_MEMBER_ANALYTICS: 'update_member_analytics' as const,
  UPDATE_NPC_LEARNING: 'update_npc_learning' as const,
  UPDATE_ORGANIZATION_BIAS_FROM_ARTICLES: 'update_organization_bias_from_articles' as const,
  UPDATE_PLAYER_READY_STATUS: 'update_player_ready_status' as const,
  UPDATE_POD_ANALYTICS: 'update_pod_analytics' as const,
  UPDATE_USER_SKILL_PROGRESS: 'update_user_skill_progress' as const,
  UPSERT_USER_EMAIL_PREFERENCES: 'upsert_user_email_preferences' as const,
} as const;

export type DbFunctionName = keyof typeof DB_FUNCTIONS;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const isValidTableName = (tableName: string): tableName is DbTableName => {
  return Object.values(DB_TABLES).includes(tableName as any);
};

export const isValidFunctionName = (functionName: string): functionName is DbFunctionName => {
  return Object.values(DB_FUNCTIONS).includes(functionName as any);
};

export const isValidEnumName = (enumName: string): enumName is DbEnumName => {
  return Object.keys(DB_ENUMS).includes(enumName.toUpperCase());
};

export const getTableConstant = (tableName: string): string | undefined => {
  const tableKey = Object.keys(DB_TABLES).find(
    key => DB_TABLES[key as keyof typeof DB_TABLES] === tableName
  );
  return tableKey ? DB_TABLES[tableKey as keyof typeof DB_TABLES] : undefined;
};

export const getFunctionConstant = (functionName: string): string | undefined => {
  const functionKey = Object.keys(DB_FUNCTIONS).find(
    key => DB_FUNCTIONS[key as keyof typeof DB_FUNCTIONS] === functionName
  );
  return functionKey ? DB_FUNCTIONS[functionKey as keyof typeof DB_FUNCTIONS] : undefined;
};

// =============================================================================
// SCHEMA DISCOVERY UTILITIES
// =============================================================================

export const discoverTableSchema = (tableName: string) => {
  const columns = getTableColumns(tableName);
  const tableKey = tableName.toUpperCase() as keyof typeof DB_COLUMN_TYPES;
  const columnTypes = DB_COLUMN_TYPES[tableKey];
  
  return {
    tableName,
    columns,
    columnTypes: columnTypes ? Object.entries(columnTypes).map(([key, type]) => ({
      name: key.toLowerCase(),
      type
    })) : []
  };
};

export const getAllTableSchemas = () => {
  return Object.values(DB_TABLES).map(tableName => discoverTableSchema(tableName));
};

// =============================================================================
// QUERY PATTERN HELPERS
// =============================================================================

export const QUERY_PATTERNS = {
  SELECT_ALL: (tableName: string) => `SELECT * FROM ${tableName}`,
  SELECT_BY_ID: (tableName: string) => `SELECT * FROM ${tableName} WHERE id = $1`,
  INSERT: (tableName: string, columns: string[]) => 
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})`,
  UPDATE_BY_ID: (tableName: string, columns: string[]) => 
    `UPDATE ${tableName} SET ${columns.map((col, i) => `${col} = $${i + 1}`).join(', ')} WHERE id = $${columns.length + 1}`,
  DELETE_BY_ID: (tableName: string) => `DELETE FROM ${tableName} WHERE id = $1`,
} as const;

// =============================================================================
// REALTIME CHANNEL HELPERS
// =============================================================================

export const REALTIME_CHANNELS = {
  TABLE_CHANGES: (tableName: string) => `table-db-changes:${tableName}`,
  USER_CHANGES: (userId: string) => `user-changes:${userId}`,
  MULTIPLAYER_ROOM: (roomId: string) => `multiplayer-room:${roomId}`,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type DatabaseConstants = typeof DB_TABLES;
export type DatabaseColumns = typeof DB_COLUMNS;
export type DatabaseColumnTypes = typeof DB_COLUMN_TYPES;
export type DatabaseEnums = typeof DB_ENUMS;
export type DatabaseFunctions = typeof DB_FUNCTIONS;
export type QueryPatterns = typeof QUERY_PATTERNS;
export type RealtimeChannels = typeof REALTIME_CHANNELS;

// =============================================================================
// TABLE TYPE EXPORTS
// =============================================================================

// article_bias_analysis types
export type DbArticleBiasAnalysis = Tables<'article_bias_analysis'>
export type DbArticleBiasAnalysisInsert = TablesInsert<'article_bias_analysis'>
export type DbArticleBiasAnalysisUpdate = TablesUpdate<'article_bias_analysis'>

// assessment_analytics types
export type DbAssessmentAnalytics = Tables<'assessment_analytics'>
export type DbAssessmentAnalyticsInsert = TablesInsert<'assessment_analytics'>
export type DbAssessmentAnalyticsUpdate = TablesUpdate<'assessment_analytics'>

// user_assessment_questions types
export type DbAssessmentQuestions = Tables<'user_assessment_questions'>
export type DbAssessmentQuestionsInsert = TablesInsert<'user_assessment_questions'>
export type DbAssessmentQuestionsUpdate = TablesUpdate<'user_assessment_questions'>

// assessment_scoring types
export type DbAssessmentScoring = Tables<'assessment_scoring'>
export type DbAssessmentScoringInsert = TablesInsert<'assessment_scoring'>
export type DbAssessmentScoringUpdate = TablesUpdate<'assessment_scoring'>

// badge_requirements types
export type DbBadgeRequirements = Tables<'badge_requirements'>
export type DbBadgeRequirementsInsert = TablesInsert<'badge_requirements'>
export type DbBadgeRequirementsUpdate = TablesUpdate<'badge_requirements'>

// bias_detection_patterns types
export type DbBiasDetectionPatterns = Tables<'bias_detection_patterns'>
export type DbBiasDetectionPatternsInsert = TablesInsert<'bias_detection_patterns'>
export type DbBiasDetectionPatternsUpdate = TablesUpdate<'bias_detection_patterns'>

// bias_dimensions types
export type DbBiasDimensions = Tables<'bias_dimensions'>
export type DbBiasDimensionsInsert = TablesInsert<'bias_dimensions'>
export type DbBiasDimensionsUpdate = TablesUpdate<'bias_dimensions'>

// bias_feedback types
export type DbBiasFeedback = Tables<'bias_feedback'>
export type DbBiasFeedbackInsert = TablesInsert<'bias_feedback'>
export type DbBiasFeedbackUpdate = TablesUpdate<'bias_feedback'>

// bias_learning_events types
export type DbBiasLearningEvents = Tables<'bias_learning_events'>
export type DbBiasLearningEventsInsert = TablesInsert<'bias_learning_events'>
export type DbBiasLearningEventsUpdate = TablesUpdate<'bias_learning_events'>

// bookmark_analytics types
export type DbBookmarkAnalytics = Tables<'bookmark_analytics'>
export type DbBookmarkAnalyticsInsert = TablesInsert<'bookmark_analytics'>
export type DbBookmarkAnalyticsUpdate = TablesUpdate<'bookmark_analytics'>

// bookmark_collections types
export type DbBookmarkCollections = Tables<'bookmark_collections'>
export type DbBookmarkCollectionsInsert = TablesInsert<'bookmark_collections'>
export type DbBookmarkCollectionsUpdate = TablesUpdate<'bookmark_collections'>

// bookmark_snippets types
export type DbBookmarkSnippets = Tables<'bookmark_snippets'>
export type DbBookmarkSnippetsInsert = TablesInsert<'bookmark_snippets'>
export type DbBookmarkSnippetsUpdate = TablesUpdate<'bookmark_snippets'>

// bookmark_tags types
export type DbBookmarkTags = Tables<'bookmark_tags'>
export type DbBookmarkTagsInsert = TablesInsert<'bookmark_tags'>
export type DbBookmarkTagsUpdate = TablesUpdate<'bookmark_tags'>

// bookmarks types
export type DbBookmarks = Tables<'bookmarks'>
export type DbBookmarksInsert = TablesInsert<'bookmarks'>
export type DbBookmarksUpdate = TablesUpdate<'bookmarks'>

// boost_definitions types
export type DbBoostDefinitions = Tables<'boost_definitions'>
export type DbBoostDefinitionsInsert = TablesInsert<'boost_definitions'>
export type DbBoostDefinitionsUpdate = TablesUpdate<'boost_definitions'>

// categories types
export type DbCategories = Tables<'categories'>
export type DbCategoriesInsert = TablesInsert<'categories'>
export type DbCategoriesUpdate = TablesUpdate<'categories'>

// category_synonyms types
export type DbCategorySynonyms = Tables<'category_synonyms'>
export type DbCategorySynonymsInsert = TablesInsert<'category_synonyms'>
export type DbCategorySynonymsUpdate = TablesUpdate<'category_synonyms'>

// civics_test_analytics types
export type DbCivicsTestAnalytics = Tables<'civics_test_analytics'>
export type DbCivicsTestAnalyticsInsert = TablesInsert<'civics_test_analytics'>
export type DbCivicsTestAnalyticsUpdate = TablesUpdate<'civics_test_analytics'>

// clever_user_mapping types
export type DbCleverUserMapping = Tables<'clever_user_mapping'>
export type DbCleverUserMappingInsert = TablesInsert<'clever_user_mapping'>
export type DbCleverUserMappingUpdate = TablesUpdate<'clever_user_mapping'>

// content_filtering_rules types
export type DbContentFilteringRules = Tables<'content_filtering_rules'>
export type DbContentFilteringRulesInsert = TablesInsert<'content_filtering_rules'>
export type DbContentFilteringRulesUpdate = TablesUpdate<'content_filtering_rules'>

// content_generation_queue types
export type DbContentGenerationQueue = Tables<'content_generation_queue'>
export type DbContentGenerationQueueInsert = TablesInsert<'content_generation_queue'>
export type DbContentGenerationQueueUpdate = TablesUpdate<'content_generation_queue'>

// content_preview_cache types
export type DbContentPreviewCache = Tables<'content_preview_cache'>
export type DbContentPreviewCacheInsert = TablesInsert<'content_preview_cache'>
export type DbContentPreviewCacheUpdate = TablesUpdate<'content_preview_cache'>

// events types
export type DbEvents = Tables<'events'>
export type DbEventsInsert = TablesInsert<'events'>
export type DbEventsUpdate = TablesUpdate<'events'>

// fact_check_logs types
export type DbFactCheckLogs = Tables<'fact_check_logs'>
export type DbFactCheckLogsInsert = TablesInsert<'fact_check_logs'>
export type DbFactCheckLogsUpdate = TablesUpdate<'fact_check_logs'>

// figure_events types
export type DbFigureEvents = Tables<'figure_events'>
export type DbFigureEventsInsert = TablesInsert<'figure_events'>
export type DbFigureEventsUpdate = TablesUpdate<'figure_events'>

// figure_organizations types
export type DbFigureOrganizations = Tables<'figure_organizations'>
export type DbFigureOrganizationsInsert = TablesInsert<'figure_organizations'>
export type DbFigureOrganizationsUpdate = TablesUpdate<'figure_organizations'>

// figure_policy_positions types
export type DbFigurePolicyPositions = Tables<'figure_policy_positions'>
export type DbFigurePolicyPositionsInsert = TablesInsert<'figure_policy_positions'>
export type DbFigurePolicyPositionsUpdate = TablesUpdate<'figure_policy_positions'>

// figure_quiz_topics types
export type DbFigureQuizTopics = Tables<'figure_quiz_topics'>
export type DbFigureQuizTopicsInsert = TablesInsert<'figure_quiz_topics'>
export type DbFigureQuizTopicsUpdate = TablesUpdate<'figure_quiz_topics'>

// figure_relationships types
export type DbFigureRelationships = Tables<'figure_relationships'>
export type DbFigureRelationshipsInsert = TablesInsert<'figure_relationships'>
export type DbFigureRelationshipsUpdate = TablesUpdate<'figure_relationships'>

// friend_requests types
export type DbFriendRequests = Tables<'friend_requests'>
export type DbFriendRequestsInsert = TablesInsert<'friend_requests'>
export type DbFriendRequestsUpdate = TablesUpdate<'friend_requests'>

// gift_credits types
export type DbGiftCredits = Tables<'gift_credits'>
export type DbGiftCreditsInsert = TablesInsert<'gift_credits'>
export type DbGiftCreditsUpdate = TablesUpdate<'gift_credits'>

// gift_redemptions types
export type DbGiftRedemptions = Tables<'gift_redemptions'>
export type DbGiftRedemptionsInsert = TablesInsert<'gift_redemptions'>
export type DbGiftRedemptionsUpdate = TablesUpdate<'gift_redemptions'>

// glossary_terms types
export type DbGlossaryTerms = Tables<'glossary_terms'>
export type DbGlossaryTermsInsert = TablesInsert<'glossary_terms'>
export type DbGlossaryTermsUpdate = TablesUpdate<'glossary_terms'>

// guest_civics_test_results types
export type DbGuestCivicsTestResults = Tables<'guest_civics_test_results'>
export type DbGuestCivicsTestResultsInsert = TablesInsert<'guest_civics_test_results'>
export type DbGuestCivicsTestResultsUpdate = TablesUpdate<'guest_civics_test_results'>

// guest_usage_analytics types
export type DbGuestUsageAnalytics = Tables<'guest_usage_analytics'>
export type DbGuestUsageAnalyticsInsert = TablesInsert<'guest_usage_analytics'>
export type DbGuestUsageAnalyticsUpdate = TablesUpdate<'guest_usage_analytics'>

// guest_usage_tracking types
export type DbGuestUsageTracking = Tables<'guest_usage_tracking'>
export type DbGuestUsageTrackingInsert = TablesInsert<'guest_usage_tracking'>
export type DbGuestUsageTrackingUpdate = TablesUpdate<'guest_usage_tracking'>

// image_ab_test_results types
export type DbImageAbTestResults = Tables<'image_ab_test_results'>
export type DbImageAbTestResultsInsert = TablesInsert<'image_ab_test_results'>
export type DbImageAbTestResultsUpdate = TablesUpdate<'image_ab_test_results'>

// image_generation_analytics types
export type DbImageGenerationAnalytics = Tables<'image_generation_analytics'>
export type DbImageGenerationAnalyticsInsert = TablesInsert<'image_generation_analytics'>
export type DbImageGenerationAnalyticsUpdate = TablesUpdate<'image_generation_analytics'>

// job_execution_logs types
export type DbJobExecutionLogs = Tables<'job_execution_logs'>
export type DbJobExecutionLogsInsert = TablesInsert<'job_execution_logs'>
export type DbJobExecutionLogsUpdate = TablesUpdate<'job_execution_logs'>

// key_policy_positions types
export type DbKeyPolicyPositions = Tables<'key_policy_positions'>
export type DbKeyPolicyPositionsInsert = TablesInsert<'key_policy_positions'>
export type DbKeyPolicyPositionsUpdate = TablesUpdate<'key_policy_positions'>

// learning_objectives types
export type DbLearningObjectives = Tables<'learning_objectives'>
export type DbLearningObjectivesInsert = TablesInsert<'learning_objectives'>
export type DbLearningObjectivesUpdate = TablesUpdate<'learning_objectives'>

// learning_pods types
export type DbLearningPods = Tables<'learning_pods'>
export type DbLearningPodsInsert = TablesInsert<'learning_pods'>
export type DbLearningPodsUpdate = TablesUpdate<'learning_pods'>

// media_organizations types
export type DbMediaOrganizations = Tables<'media_organizations'>
export type DbMediaOrganizationsInsert = TablesInsert<'media_organizations'>
export type DbMediaOrganizationsUpdate = TablesUpdate<'media_organizations'>

// member_individual_settings types
export type DbMemberIndividualSettings = Tables<'member_individual_settings'>
export type DbMemberIndividualSettingsInsert = TablesInsert<'member_individual_settings'>
export type DbMemberIndividualSettingsUpdate = TablesUpdate<'member_individual_settings'>

// multiplayer_chat_messages types
export type DbMultiplayerChatMessages = Tables<'multiplayer_chat_messages'>
export type DbMultiplayerChatMessagesInsert = TablesInsert<'multiplayer_chat_messages'>
export type DbMultiplayerChatMessagesUpdate = TablesUpdate<'multiplayer_chat_messages'>

// multiplayer_conversation_context types
export type DbMultiplayerConversationContext = Tables<'multiplayer_conversation_context'>
export type DbMultiplayerConversationContextInsert = TablesInsert<'multiplayer_conversation_context'>
export type DbMultiplayerConversationContextUpdate = TablesUpdate<'multiplayer_conversation_context'>

// multiplayer_game_events types
export type DbMultiplayerGameEvents = Tables<'multiplayer_game_events'>
export type DbMultiplayerGameEventsInsert = TablesInsert<'multiplayer_game_events'>
export type DbMultiplayerGameEventsUpdate = TablesUpdate<'multiplayer_game_events'>

// multiplayer_game_sessions types
export type DbMultiplayerGameSessions = Tables<'multiplayer_game_sessions'>
export type DbMultiplayerGameSessionsInsert = TablesInsert<'multiplayer_game_sessions'>
export type DbMultiplayerGameSessionsUpdate = TablesUpdate<'multiplayer_game_sessions'>

// multiplayer_npc_players types
export type DbMultiplayerNpcPlayers = Tables<'multiplayer_npc_players'>
export type DbMultiplayerNpcPlayersInsert = TablesInsert<'multiplayer_npc_players'>
export type DbMultiplayerNpcPlayersUpdate = TablesUpdate<'multiplayer_npc_players'>

// multiplayer_question_responses types
export type DbMultiplayerQuestionResponses = Tables<'multiplayer_question_responses'>
export type DbMultiplayerQuestionResponsesInsert = TablesInsert<'multiplayer_question_responses'>
export type DbMultiplayerQuestionResponsesUpdate = TablesUpdate<'multiplayer_question_responses'>

// multiplayer_quiz_attempts types
export type DbMultiplayerQuizAttempts = Tables<'multiplayer_quiz_attempts'>
export type DbMultiplayerQuizAttemptsInsert = TablesInsert<'multiplayer_quiz_attempts'>
export type DbMultiplayerQuizAttemptsUpdate = TablesUpdate<'multiplayer_quiz_attempts'>

// multiplayer_room_events types
export type DbMultiplayerRoomEvents = Tables<'multiplayer_room_events'>
export type DbMultiplayerRoomEventsInsert = TablesInsert<'multiplayer_room_events'>
export type DbMultiplayerRoomEventsUpdate = TablesUpdate<'multiplayer_room_events'>

// multiplayer_room_players types
export type DbMultiplayerRoomPlayers = Tables<'multiplayer_room_players'>
export type DbMultiplayerRoomPlayersInsert = TablesInsert<'multiplayer_room_players'>
export type DbMultiplayerRoomPlayersUpdate = TablesUpdate<'multiplayer_room_players'>

// multiplayer_rooms types
export type DbMultiplayerRooms = Tables<'multiplayer_rooms'>
export type DbMultiplayerRoomsInsert = TablesInsert<'multiplayer_rooms'>
export type DbMultiplayerRoomsUpdate = TablesUpdate<'multiplayer_rooms'>

// news_cache types
export type DbNewsCache = Tables<'news_cache'>
export type DbNewsCacheInsert = TablesInsert<'news_cache'>
export type DbNewsCacheUpdate = TablesUpdate<'news_cache'>

// npc_category_specializations types
export type DbNpcCategorySpecializations = Tables<'npc_category_specializations'>
export type DbNpcCategorySpecializationsInsert = TablesInsert<'npc_category_specializations'>
export type DbNpcCategorySpecializationsUpdate = TablesUpdate<'npc_category_specializations'>

// npc_chat_templates types
export type DbNpcChatTemplates = Tables<'npc_chat_templates'>
export type DbNpcChatTemplatesInsert = TablesInsert<'npc_chat_templates'>
export type DbNpcChatTemplatesUpdate = TablesUpdate<'npc_chat_templates'>

// npc_conversation_history types
export type DbNpcConversationHistory = Tables<'npc_conversation_history'>
export type DbNpcConversationHistoryInsert = TablesInsert<'npc_conversation_history'>
export type DbNpcConversationHistoryUpdate = TablesUpdate<'npc_conversation_history'>

// npc_learning_progression types
export type DbNpcLearningProgression = Tables<'npc_learning_progression'>
export type DbNpcLearningProgressionInsert = TablesInsert<'npc_learning_progression'>
export type DbNpcLearningProgressionUpdate = TablesUpdate<'npc_learning_progression'>

// npc_personalities types
export type DbNpcPersonalities = Tables<'npc_personalities'>
export type DbNpcPersonalitiesInsert = TablesInsert<'npc_personalities'>
export type DbNpcPersonalitiesUpdate = TablesUpdate<'npc_personalities'>

// npc_question_responses types
export type DbNpcQuestionResponses = Tables<'npc_question_responses'>
export type DbNpcQuestionResponsesInsert = TablesInsert<'npc_question_responses'>
export type DbNpcQuestionResponsesUpdate = TablesUpdate<'npc_question_responses'>

// npc_quiz_attempts types
export type DbNpcQuizAttempts = Tables<'npc_quiz_attempts'>
export type DbNpcQuizAttemptsInsert = TablesInsert<'npc_quiz_attempts'>
export type DbNpcQuizAttemptsUpdate = TablesUpdate<'npc_quiz_attempts'>

// organization_bias_scores types
export type DbOrganizationBiasScores = Tables<'organization_bias_scores'>
export type DbOrganizationBiasScoresInsert = TablesInsert<'organization_bias_scores'>
export type DbOrganizationBiasScoresUpdate = TablesUpdate<'organization_bias_scores'>

// organizations types
export type DbOrganizations = Tables<'organizations'>
export type DbOrganizationsInsert = TablesInsert<'organizations'>
export type DbOrganizationsUpdate = TablesUpdate<'organizations'>

// parental_controls types
export type DbParentalControls = Tables<'parental_controls'>
export type DbParentalControlsInsert = TablesInsert<'parental_controls'>
export type DbParentalControlsUpdate = TablesUpdate<'parental_controls'>

// pathway_skills types
export type DbPathwaySkills = Tables<'pathway_skills'>
export type DbPathwaySkillsInsert = TablesInsert<'pathway_skills'>
export type DbPathwaySkillsUpdate = TablesUpdate<'pathway_skills'>

// pod_achievements types
export type DbPodAchievements = Tables<'pod_achievements'>
export type DbPodAchievementsInsert = TablesInsert<'pod_achievements'>
export type DbPodAchievementsUpdate = TablesUpdate<'pod_achievements'>

// pod_activities types
export type DbPodActivities = Tables<'pod_activities'>
export type DbPodActivitiesInsert = TablesInsert<'pod_activities'>
export type DbPodActivitiesUpdate = TablesUpdate<'pod_activities'>

// pod_activity_log types
export type DbPodActivityLog = Tables<'pod_activity_log'>
export type DbPodActivityLogInsert = TablesInsert<'pod_activity_log'>
export type DbPodActivityLogUpdate = TablesUpdate<'pod_activity_log'>

// pod_analytics types
export type DbPodAnalytics = Tables<'pod_analytics'>
export type DbPodAnalyticsInsert = TablesInsert<'pod_analytics'>
export type DbPodAnalyticsUpdate = TablesUpdate<'pod_analytics'>

// pod_challenge_participants types
export type DbPodChallengeParticipants = Tables<'pod_challenge_participants'>
export type DbPodChallengeParticipantsInsert = TablesInsert<'pod_challenge_participants'>
export type DbPodChallengeParticipantsUpdate = TablesUpdate<'pod_challenge_participants'>

// pod_challenges types
export type DbPodChallenges = Tables<'pod_challenges'>
export type DbPodChallengesInsert = TablesInsert<'pod_challenges'>
export type DbPodChallengesUpdate = TablesUpdate<'pod_challenges'>

// pod_invite_links types
export type DbPodInviteLinks = Tables<'pod_invite_links'>
export type DbPodInviteLinksInsert = TablesInsert<'pod_invite_links'>
export type DbPodInviteLinksUpdate = TablesUpdate<'pod_invite_links'>

// pod_join_requests types
export type DbPodJoinRequests = Tables<'pod_join_requests'>
export type DbPodJoinRequestsInsert = TablesInsert<'pod_join_requests'>
export type DbPodJoinRequestsUpdate = TablesUpdate<'pod_join_requests'>

// pod_member_analytics types
export type DbPodMemberAnalytics = Tables<'pod_member_analytics'>
export type DbPodMemberAnalyticsInsert = TablesInsert<'pod_member_analytics'>
export type DbPodMemberAnalyticsUpdate = TablesUpdate<'pod_member_analytics'>

// pod_member_settings types
export type DbPodMemberSettings = Tables<'pod_member_settings'>
export type DbPodMemberSettingsInsert = TablesInsert<'pod_member_settings'>
export type DbPodMemberSettingsUpdate = TablesUpdate<'pod_member_settings'>

// pod_memberships types
export type DbPodMemberships = Tables<'pod_memberships'>
export type DbPodMembershipsInsert = TablesInsert<'pod_memberships'>
export type DbPodMembershipsUpdate = TablesUpdate<'pod_memberships'>

// pod_partnerships types
export type DbPodPartnerships = Tables<'pod_partnerships'>
export type DbPodPartnershipsInsert = TablesInsert<'pod_partnerships'>
export type DbPodPartnershipsUpdate = TablesUpdate<'pod_partnerships'>

// pod_ratings types
export type DbPodRatings = Tables<'pod_ratings'>
export type DbPodRatingsInsert = TablesInsert<'pod_ratings'>
export type DbPodRatingsUpdate = TablesUpdate<'pod_ratings'>

// pod_settings types
export type DbPodSettings = Tables<'pod_settings'>
export type DbPodSettingsInsert = TablesInsert<'pod_settings'>
export type DbPodSettingsUpdate = TablesUpdate<'pod_settings'>

// pod_themes types
export type DbPodThemes = Tables<'pod_themes'>
export type DbPodThemesInsert = TablesInsert<'pod_themes'>
export type DbPodThemesUpdate = TablesUpdate<'pod_themes'>

// profiles types
export type DbProfiles = Tables<'profiles'>
export type DbProfilesInsert = TablesInsert<'profiles'>
export type DbProfilesUpdate = TablesUpdate<'profiles'>

// progress_question_responses types
export type DbProgressQuestionResponses = Tables<'progress_question_responses'>
export type DbProgressQuestionResponsesInsert = TablesInsert<'progress_question_responses'>
export type DbProgressQuestionResponsesUpdate = TablesUpdate<'progress_question_responses'>

// progress_sessions types
export type DbProgressSessions = Tables<'progress_sessions'>
export type DbProgressSessionsInsert = TablesInsert<'progress_sessions'>
export type DbProgressSessionsUpdate = TablesUpdate<'progress_sessions'>

// public_figures types
export type DbPublicFigures = Tables<'public_figures'>
export type DbPublicFiguresInsert = TablesInsert<'public_figures'>
export type DbPublicFiguresUpdate = TablesUpdate<'public_figures'>

// question_analytics types
export type DbQuestionAnalytics = Tables<'question_analytics'>
export type DbQuestionAnalyticsInsert = TablesInsert<'question_analytics'>
export type DbQuestionAnalyticsUpdate = TablesUpdate<'question_analytics'>

// question_feedback types
export type DbQuestionFeedback = Tables<'question_feedback'>
export type DbQuestionFeedbackInsert = TablesInsert<'question_feedback'>
export type DbQuestionFeedbackUpdate = TablesUpdate<'question_feedback'>

// question_skills types
export type DbQuestionSkills = Tables<'question_skills'>
export type DbQuestionSkillsInsert = TablesInsert<'question_skills'>
export type DbQuestionSkillsUpdate = TablesUpdate<'question_skills'>

// question_source_links types
export type DbQuestionSourceLinks = Tables<'question_source_links'>
export type DbQuestionSourceLinksInsert = TablesInsert<'question_source_links'>
export type DbQuestionSourceLinksUpdate = TablesUpdate<'question_source_links'>

// question_topics types
export type DbQuestionTopics = Tables<'question_topics'>
export type DbQuestionTopicsInsert = TablesInsert<'question_topics'>
export type DbQuestionTopicsUpdate = TablesUpdate<'question_topics'>

// questions types
export type DbQuestions = Tables<'questions'>
export type DbQuestionsInsert = TablesInsert<'questions'>
export type DbQuestionsUpdate = TablesUpdate<'questions'>

// questions_test types
export type DbQuestionsTest = Tables<'questions_test'>
export type DbQuestionsTestInsert = TablesInsert<'questions_test'>
export type DbQuestionsTestUpdate = TablesUpdate<'questions_test'>

// scheduled_content_jobs types
export type DbScheduledContentJobs = Tables<'scheduled_content_jobs'>
export type DbScheduledContentJobsInsert = TablesInsert<'scheduled_content_jobs'>
export type DbScheduledContentJobsUpdate = TablesUpdate<'scheduled_content_jobs'>

// shareable_gift_links types
export type DbShareableGiftLinks = Tables<'shareable_gift_links'>
export type DbShareableGiftLinksInsert = TablesInsert<'shareable_gift_links'>
export type DbShareableGiftLinksUpdate = TablesUpdate<'shareable_gift_links'>

// shareable_link_claims types
export type DbShareableLinkClaims = Tables<'shareable_link_claims'>
export type DbShareableLinkClaimsInsert = TablesInsert<'shareable_link_claims'>
export type DbShareableLinkClaimsUpdate = TablesUpdate<'shareable_link_claims'>

// shared_collection_access types
export type DbSharedCollectionAccess = Tables<'shared_collection_access'>
export type DbSharedCollectionAccessInsert = TablesInsert<'shared_collection_access'>
export type DbSharedCollectionAccessUpdate = TablesUpdate<'shared_collection_access'>

// skill_assessment_criteria types
export type DbSkillAssessmentCriteria = Tables<'skill_assessment_criteria'>
export type DbSkillAssessmentCriteriaInsert = TablesInsert<'skill_assessment_criteria'>
export type DbSkillAssessmentCriteriaUpdate = TablesUpdate<'skill_assessment_criteria'>

// skill_badges types
export type DbSkillBadges = Tables<'skill_badges'>
export type DbSkillBadgesInsert = TablesInsert<'skill_badges'>
export type DbSkillBadgesUpdate = TablesUpdate<'skill_badges'>

// skill_categories types
export type DbSkillCategories = Tables<'skill_categories'>
export type DbSkillCategoriesInsert = TablesInsert<'skill_categories'>
export type DbSkillCategoriesUpdate = TablesUpdate<'skill_categories'>

// skill_learning_objectives types
export type DbSkillLearningObjectives = Tables<'skill_learning_objectives'>
export type DbSkillLearningObjectivesInsert = TablesInsert<'skill_learning_objectives'>
export type DbSkillLearningObjectivesUpdate = TablesUpdate<'skill_learning_objectives'>

// skill_mastery_tracking types
export type DbSkillMasteryTracking = Tables<'skill_mastery_tracking'>
export type DbSkillMasteryTrackingInsert = TablesInsert<'skill_mastery_tracking'>
export type DbSkillMasteryTrackingUpdate = TablesUpdate<'skill_mastery_tracking'>

// skill_practice_recommendations types
export type DbSkillPracticeRecommendations = Tables<'skill_practice_recommendations'>
export type DbSkillPracticeRecommendationsInsert = TablesInsert<'skill_practice_recommendations'>
export type DbSkillPracticeRecommendationsUpdate = TablesUpdate<'skill_practice_recommendations'>

// skill_prerequisites types
export type DbSkillPrerequisites = Tables<'skill_prerequisites'>
export type DbSkillPrerequisitesInsert = TablesInsert<'skill_prerequisites'>
export type DbSkillPrerequisitesUpdate = TablesUpdate<'skill_prerequisites'>

// skill_progression_pathways types
export type DbSkillProgressionPathways = Tables<'skill_progression_pathways'>
export type DbSkillProgressionPathwaysInsert = TablesInsert<'skill_progression_pathways'>
export type DbSkillProgressionPathwaysUpdate = TablesUpdate<'skill_progression_pathways'>

// skill_relationships types
export type DbSkillRelationships = Tables<'skill_relationships'>
export type DbSkillRelationshipsInsert = TablesInsert<'skill_relationships'>
export type DbSkillRelationshipsUpdate = TablesUpdate<'skill_relationships'>

// skills types
export type DbSkills = Tables<'skills'>
export type DbSkillsInsert = TablesInsert<'skills'>
export type DbSkillsUpdate = TablesUpdate<'skills'>

// source_credibility_indicators types
export type DbSourceCredibilityIndicators = Tables<'source_credibility_indicators'>
export type DbSourceCredibilityIndicatorsInsert = TablesInsert<'source_credibility_indicators'>
export type DbSourceCredibilityIndicatorsUpdate = TablesUpdate<'source_credibility_indicators'>

// source_fetch_queue types
export type DbSourceFetchQueue = Tables<'source_fetch_queue'>
export type DbSourceFetchQueueInsert = TablesInsert<'source_fetch_queue'>
export type DbSourceFetchQueueUpdate = TablesUpdate<'source_fetch_queue'>

// source_metadata types
export type DbSourceMetadata = Tables<'source_metadata'>
export type DbSourceMetadataInsert = TablesInsert<'source_metadata'>
export type DbSourceMetadataUpdate = TablesUpdate<'source_metadata'>

// spaced_repetition_schedule types
export type DbSpacedRepetitionSchedule = Tables<'spaced_repetition_schedule'>
export type DbSpacedRepetitionScheduleInsert = TablesInsert<'spaced_repetition_schedule'>
export type DbSpacedRepetitionScheduleUpdate = TablesUpdate<'spaced_repetition_schedule'>

// subscription_tier_limits types
export type DbSubscriptionTierLimits = Tables<'subscription_tier_limits'>
export type DbSubscriptionTierLimitsInsert = TablesInsert<'subscription_tier_limits'>
export type DbSubscriptionTierLimitsUpdate = TablesUpdate<'subscription_tier_limits'>

// survey_answers types
export type DbSurveyAnswers = Tables<'survey_answers'>
export type DbSurveyAnswersInsert = TablesInsert<'survey_answers'>
export type DbSurveyAnswersUpdate = TablesUpdate<'survey_answers'>

// survey_learning_goals types
export type DbSurveyLearningGoals = Tables<'survey_learning_goals'>
export type DbSurveyLearningGoalsInsert = TablesInsert<'survey_learning_goals'>
export type DbSurveyLearningGoalsUpdate = TablesUpdate<'survey_learning_goals'>

// survey_questions types
export type DbSurveyQuestions = Tables<'survey_questions'>
export type DbSurveyQuestionsInsert = TablesInsert<'survey_questions'>
export type DbSurveyQuestionsUpdate = TablesUpdate<'survey_questions'>

// survey_recommendations types
export type DbSurveyRecommendations = Tables<'survey_recommendations'>
export type DbSurveyRecommendationsInsert = TablesInsert<'survey_recommendations'>
export type DbSurveyRecommendationsUpdate = TablesUpdate<'survey_recommendations'>

// survey_responses types
export type DbSurveyResponses = Tables<'survey_responses'>
export type DbSurveyResponsesInsert = TablesInsert<'survey_responses'>
export type DbSurveyResponsesUpdate = TablesUpdate<'survey_responses'>

// surveys types
export type DbSurveys = Tables<'surveys'>
export type DbSurveysInsert = TablesInsert<'surveys'>
export type DbSurveysUpdate = TablesUpdate<'surveys'>

// system_alerts types
export type DbSystemAlerts = Tables<'system_alerts'>
export type DbSystemAlertsInsert = TablesInsert<'system_alerts'>
export type DbSystemAlertsUpdate = TablesUpdate<'system_alerts'>

// translation_jobs types
export type DbTranslationJobs = Tables<'translation_jobs'>
export type DbTranslationJobsInsert = TablesInsert<'translation_jobs'>
export type DbTranslationJobsUpdate = TablesUpdate<'translation_jobs'>

// user_achievements types
export type DbUserAchievements = Tables<'user_achievements'>
export type DbUserAchievementsInsert = TablesInsert<'user_achievements'>
export type DbUserAchievementsUpdate = TablesUpdate<'user_achievements'>

// user_active_boosts types
export type DbUserActiveBoosts = Tables<'user_active_boosts'>
export type DbUserActiveBoostsInsert = TablesInsert<'user_active_boosts'>
export type DbUserActiveBoostsUpdate = TablesUpdate<'user_active_boosts'>

// user_assessment_attempts types
export type DbUserAssessmentAttempts = Tables<'user_assessment_attempts'>
export type DbUserAssessmentAttemptsInsert = TablesInsert<'user_assessment_attempts'>
export type DbUserAssessmentAttemptsUpdate = TablesUpdate<'user_assessment_attempts'>

// user_assessments types
export type DbUserAssessments = Tables<'user_assessments'>
export type DbUserAssessmentsInsert = TablesInsert<'user_assessments'>
export type DbUserAssessmentsUpdate = TablesUpdate<'user_assessments'>

// user_badges types
export type DbUserBadges = Tables<'user_badges'>
export type DbUserBadgesInsert = TablesInsert<'user_badges'>
export type DbUserBadgesUpdate = TablesUpdate<'user_badges'>

// user_boost_inventory types
export type DbUserBoostInventory = Tables<'user_boost_inventory'>
export type DbUserBoostInventoryInsert = TablesInsert<'user_boost_inventory'>
export type DbUserBoostInventoryUpdate = TablesUpdate<'user_boost_inventory'>

// user_category_preferences types
export type DbUserCategoryPreferences = Tables<'user_category_preferences'>
export type DbUserCategoryPreferencesInsert = TablesInsert<'user_category_preferences'>
export type DbUserCategoryPreferencesUpdate = TablesUpdate<'user_category_preferences'>

// user_category_skills types
export type DbUserCategorySkills = Tables<'user_category_skills'>
export type DbUserCategorySkillsInsert = TablesInsert<'user_category_skills'>
export type DbUserCategorySkillsUpdate = TablesUpdate<'user_category_skills'>

// user_custom_decks types
export type DbUserCustomDecks = Tables<'user_custom_decks'>
export type DbUserCustomDecksInsert = TablesInsert<'user_custom_decks'>
export type DbUserCustomDecksUpdate = TablesUpdate<'user_custom_decks'>

// user_deck_content types
export type DbUserDeckContent = Tables<'user_deck_content'>
export type DbUserDeckContentInsert = TablesInsert<'user_deck_content'>
export type DbUserDeckContentUpdate = TablesUpdate<'user_deck_content'>

// user_email_preferences types
export type DbUserEmailPreferences = Tables<'user_email_preferences'>
export type DbUserEmailPreferencesInsert = TablesInsert<'user_email_preferences'>
export type DbUserEmailPreferencesUpdate = TablesUpdate<'user_email_preferences'>

// user_feature_usage types
export type DbUserFeatureUsage = Tables<'user_feature_usage'>
export type DbUserFeatureUsageInsert = TablesInsert<'user_feature_usage'>
export type DbUserFeatureUsageUpdate = TablesUpdate<'user_feature_usage'>

// user_feedback types
export type DbUserFeedback = Tables<'user_feedback'>
export type DbUserFeedbackInsert = TablesInsert<'user_feedback'>
export type DbUserFeedbackUpdate = TablesUpdate<'user_feedback'>

// user_learning_goals types
export type DbUserLearningGoals = Tables<'user_learning_goals'>
export type DbUserLearningGoalsInsert = TablesInsert<'user_learning_goals'>
export type DbUserLearningGoalsUpdate = TablesUpdate<'user_learning_goals'>

// user_learning_insights types
export type DbUserLearningInsights = Tables<'user_learning_insights'>
export type DbUserLearningInsightsInsert = TablesInsert<'user_learning_insights'>
export type DbUserLearningInsightsUpdate = TablesUpdate<'user_learning_insights'>

// user_onboarding_state types
export type DbUserOnboardingState = Tables<'user_onboarding_state'>
export type DbUserOnboardingStateInsert = TablesInsert<'user_onboarding_state'>
export type DbUserOnboardingStateUpdate = TablesUpdate<'user_onboarding_state'>

// user_platform_preferences types
export type DbUserPlatformPreferences = Tables<'user_platform_preferences'>
export type DbUserPlatformPreferencesInsert = TablesInsert<'user_platform_preferences'>
export type DbUserPlatformPreferencesUpdate = TablesUpdate<'user_platform_preferences'>

// user_progress types
export type DbUserProgress = Tables<'user_progress'>
export type DbUserProgressInsert = TablesInsert<'user_progress'>
export type DbUserProgressUpdate = TablesUpdate<'user_progress'>

// user_progress_history types
export type DbUserProgressHistory = Tables<'user_progress_history'>
export type DbUserProgressHistoryInsert = TablesInsert<'user_progress_history'>
export type DbUserProgressHistoryUpdate = TablesUpdate<'user_progress_history'>

// user_question_memory types
export type DbUserQuestionMemory = Tables<'user_question_memory'>
export type DbUserQuestionMemoryInsert = TablesInsert<'user_question_memory'>
export type DbUserQuestionMemoryUpdate = TablesUpdate<'user_question_memory'>

// user_question_responses types
export type DbUserQuestionResponses = Tables<'user_question_responses'>
export type DbUserQuestionResponsesInsert = TablesInsert<'user_question_responses'>
export type DbUserQuestionResponsesUpdate = TablesUpdate<'user_question_responses'>

// user_quiz_analytics types
export type DbUserQuizAnalytics = Tables<'user_quiz_analytics'>
export type DbUserQuizAnalyticsInsert = TablesInsert<'user_quiz_analytics'>
export type DbUserQuizAnalyticsUpdate = TablesUpdate<'user_quiz_analytics'>

// user_quiz_attempts types
export type DbUserQuizAttempts = Tables<'user_quiz_attempts'>
export type DbUserQuizAttemptsInsert = TablesInsert<'user_quiz_attempts'>
export type DbUserQuizAttemptsUpdate = TablesUpdate<'user_quiz_attempts'>

// user_roles types
export type DbUserRoles = Tables<'user_roles'>
export type DbUserRolesInsert = TablesInsert<'user_roles'>
export type DbUserRolesUpdate = TablesUpdate<'user_roles'>

// user_skill_preferences types
export type DbUserSkillPreferences = Tables<'user_skill_preferences'>
export type DbUserSkillPreferencesInsert = TablesInsert<'user_skill_preferences'>
export type DbUserSkillPreferencesUpdate = TablesUpdate<'user_skill_preferences'>

// user_skill_progress types
export type DbUserSkillProgress = Tables<'user_skill_progress'>
export type DbUserSkillProgressInsert = TablesInsert<'user_skill_progress'>
export type DbUserSkillProgressUpdate = TablesUpdate<'user_skill_progress'>

// user_streak_history types
export type DbUserStreakHistory = Tables<'user_streak_history'>
export type DbUserStreakHistoryInsert = TablesInsert<'user_streak_history'>
export type DbUserStreakHistoryUpdate = TablesUpdate<'user_streak_history'>

// user_subscriptions types
export type DbUserSubscriptions = Tables<'user_subscriptions'>
export type DbUserSubscriptionsInsert = TablesInsert<'user_subscriptions'>
export type DbUserSubscriptionsUpdate = TablesUpdate<'user_subscriptions'>

// user_survey_completions types
export type DbUserSurveyCompletions = Tables<'user_survey_completions'>
export type DbUserSurveyCompletionsInsert = TablesInsert<'user_survey_completions'>
export type DbUserSurveyCompletionsUpdate = TablesUpdate<'user_survey_completions'>



// =============================================================================
// ENUM TYPE EXPORTS
// =============================================================================

export type DbCourseRole = Database['public']['Enums']['course_role']
export type DbEnrollmentStatus = Database['public']['Enums']['enrollment_status']
export type DbSchoolUserRole = Database['public']['Enums']['school_user_role']
export type DbSyncStatus = Database['public']['Enums']['sync_status']
export type DbSyncType = Database['public']['Enums']['sync_type']



// =============================================================================
// FUNCTION TYPE EXPORTS
// =============================================================================

export type DbAddNpcToMultiplayerRoomArgs = Database['public']['Functions']['add_npc_to_multiplayer_room']['Args']
export type DbAddNpcToMultiplayerRoomReturns = Database['public']['Functions']['add_npc_to_multiplayer_room']['Returns']

export type DbAnalyzeImageAbTestArgs = Database['public']['Functions']['analyze_image_ab_test']['Args']
export type DbAnalyzeImageAbTestReturns = Database['public']['Functions']['analyze_image_ab_test']['Returns']

export type DbCalculateBiasConsensusArgs = Database['public']['Functions']['calculate_bias_consensus']['Args']
export type DbCalculateBiasConsensusReturns = Database['public']['Functions']['calculate_bias_consensus']['Returns']

export type DbCalculateGiftCreditsArgs = Database['public']['Functions']['calculate_gift_credits']['Args']
export type DbCalculateGiftCreditsReturns = Database['public']['Functions']['calculate_gift_credits']['Returns']

export type DbCalculateNextRunTimeArgs = Database['public']['Functions']['calculate_next_run_time']['Args']
export type DbCalculateNextRunTimeReturns = Database['public']['Functions']['calculate_next_run_time']['Returns']

export type DbCalculatePodAnalyticsArgs = Database['public']['Functions']['calculate_pod_analytics']['Args']
export type DbCalculatePodAnalyticsReturns = Database['public']['Functions']['calculate_pod_analytics']['Returns']

export type DbCanAccessRoomArgs = Database['public']['Functions']['can_access_room']['Args']
export type DbCanAccessRoomReturns = Database['public']['Functions']['can_access_room']['Returns']

export type DbCanJoinPodViaInviteArgs = Database['public']['Functions']['can_join_pod_via_invite']['Args']
export type DbCanJoinPodViaInviteReturns = Database['public']['Functions']['can_join_pod_via_invite']['Returns']

export type DbCheckAllPlayersReadyArgs = Database['public']['Functions']['check_all_players_ready']['Args']
export type DbCheckAllPlayersReadyReturns = Database['public']['Functions']['check_all_players_ready']['Returns']

export type DbCheckAndAwardAchievementsArgs = Database['public']['Functions']['check_and_award_achievements']['Args']
export type DbCheckAndAwardAchievementsReturns = Database['public']['Functions']['check_and_award_achievements']['Returns']

export type DbCheckBoostCooldownArgs = Database['public']['Functions']['check_boost_cooldown']['Args']
export type DbCheckBoostCooldownReturns = Database['public']['Functions']['check_boost_cooldown']['Returns']

export type DbCheckImageGenerationPerformanceArgs = Database['public']['Functions']['check_image_generation_performance']['Args']
export type DbCheckImageGenerationPerformanceReturns = Database['public']['Functions']['check_image_generation_performance']['Returns']

export type DbCheckPremiumFeatureAccessArgs = Database['public']['Functions']['check_premium_feature_access']['Args']
export type DbCheckPremiumFeatureAccessReturns = Database['public']['Functions']['check_premium_feature_access']['Returns']

export type DbCheckSilenceInterventionArgs = Database['public']['Functions']['check_silence_intervention']['Args']
export type DbCheckSilenceInterventionReturns = Database['public']['Functions']['check_silence_intervention']['Returns']

export type DbClaimShareableGiftLinkArgs = Database['public']['Functions']['claim_shareable_gift_link']['Args']
export type DbClaimShareableGiftLinkReturns = Database['public']['Functions']['claim_shareable_gift_link']['Returns']

export type DbCleanupExpiredBoostsArgs = Database['public']['Functions']['cleanup_expired_boosts']['Args']
export type DbCleanupExpiredBoostsReturns = Database['public']['Functions']['cleanup_expired_boosts']['Returns']

export type DbCleanupExpiredProgressSessionsArgs = Database['public']['Functions']['cleanup_expired_progress_sessions']['Args']
export type DbCleanupExpiredProgressSessionsReturns = Database['public']['Functions']['cleanup_expired_progress_sessions']['Returns']

export type DbCleanupExpiredRoomsArgs = Database['public']['Functions']['cleanup_expired_rooms']['Args']
export type DbCleanupExpiredRoomsReturns = Database['public']['Functions']['cleanup_expired_rooms']['Returns']

export type DbCleanupInactivePlayersArgs = Database['public']['Functions']['cleanup_inactive_players']['Args']
export type DbCleanupInactivePlayersReturns = Database['public']['Functions']['cleanup_inactive_players']['Returns']

export type DbCleanupOldJobDataArgs = Database['public']['Functions']['cleanup_old_job_data']['Args']
export type DbCleanupOldJobDataReturns = Database['public']['Functions']['cleanup_old_job_data']['Returns']

export type DbCleanupOldTranslationJobsArgs = Database['public']['Functions']['cleanup_old_translation_jobs']['Args']
export type DbCleanupOldTranslationJobsReturns = Database['public']['Functions']['cleanup_old_translation_jobs']['Returns']

export type DbCompleteOnboardingStepArgs = Database['public']['Functions']['complete_onboarding_step']['Args']
export type DbCompleteOnboardingStepReturns = Database['public']['Functions']['complete_onboarding_step']['Returns']

export type DbConvertGuestCivicsResultsArgs = Database['public']['Functions']['convert_guest_civics_results']['Args']
export type DbConvertGuestCivicsResultsReturns = Database['public']['Functions']['convert_guest_civics_results']['Returns']

export type DbCreateGiftRedemptionArgs = Database['public']['Functions']['create_gift_redemption']['Args']
export type DbCreateGiftRedemptionReturns = Database['public']['Functions']['create_gift_redemption']['Returns']

export type DbCreateLearningPodArgs = Database['public']['Functions']['create_learning_pod']['Args']
export type DbCreateLearningPodReturns = Database['public']['Functions']['create_learning_pod']['Returns']

export type DbCreateMultiplayerRoomArgs = Database['public']['Functions']['create_multiplayer_room']['Args']
export type DbCreateMultiplayerRoomReturns = Database['public']['Functions']['create_multiplayer_room']['Returns']

export type DbCreatePodInviteLinkArgs = Database['public']['Functions']['create_pod_invite_link']['Args']
export type DbCreatePodInviteLinkReturns = Database['public']['Functions']['create_pod_invite_link']['Returns']

export type DbCreateShareableGiftLinkArgs = Database['public']['Functions']['create_shareable_gift_link']['Args']
export type DbCreateShareableGiftLinkReturns = Database['public']['Functions']['create_shareable_gift_link']['Returns']

export type DbDetectAllTypeMismatchesArgs = Database['public']['Functions']['detect_all_type_mismatches']['Args']
export type DbDetectAllTypeMismatchesReturns = Database['public']['Functions']['detect_all_type_mismatches']['Returns']

export type DbGenerateInviteCodeArgs = Database['public']['Functions']['generate_invite_code']['Args']
export type DbGenerateInviteCodeReturns = Database['public']['Functions']['generate_invite_code']['Returns']

export type DbGeneratePodSlugArgs = Database['public']['Functions']['generate_pod_slug']['Args']
export type DbGeneratePodSlugReturns = Database['public']['Functions']['generate_pod_slug']['Returns']

export type DbGenerateRoomCodeArgs = Database['public']['Functions']['generate_room_code']['Args']
export type DbGenerateRoomCodeReturns = Database['public']['Functions']['generate_room_code']['Returns']

export type DbGenerateRoomSlugArgs = Database['public']['Functions']['generate_room_slug']['Args']
export type DbGenerateRoomSlugReturns = Database['public']['Functions']['generate_room_slug']['Returns']

export type DbGetActiveGameSessionArgs = Database['public']['Functions']['get_active_game_session']['Args']
export type DbGetActiveGameSessionReturns = Database['public']['Functions']['get_active_game_session']['Returns']

export type DbGetAssessmentQuestionSocialProofStatsArgs = Database['public']['Functions']['get_assessment_question_social_proof_stats']['Args']
export type DbGetAssessmentQuestionSocialProofStatsReturns = Database['public']['Functions']['get_assessment_question_social_proof_stats']['Returns']

export type DbGetAvailableBoostsForUserArgs = Database['public']['Functions']['get_available_boosts_for_user']['Args']
export type DbGetAvailableBoostsForUserReturns = Database['public']['Functions']['get_available_boosts_for_user']['Returns']

export type DbGetContentTranslationStatsArgs = Database['public']['Functions']['get_content_translation_stats']['Args']
export type DbGetContentTranslationStatsReturns = Database['public']['Functions']['get_content_translation_stats']['Returns']

export type DbGetDetailedGiftCreditsArgs = Database['public']['Functions']['get_detailed_gift_credits']['Args']
export type DbGetDetailedGiftCreditsReturns = Database['public']['Functions']['get_detailed_gift_credits']['Returns']

export type DbGetEffectiveMemberSettingsArgs = Database['public']['Functions']['get_effective_member_settings']['Args']
export type DbGetEffectiveMemberSettingsReturns = Database['public']['Functions']['get_effective_member_settings']['Returns']

export type DbGetFunctionReturnInfoArgs = Database['public']['Functions']['get_function_return_info']['Args']
export type DbGetFunctionReturnInfoReturns = Database['public']['Functions']['get_function_return_info']['Returns']

export type DbGetGiftAnalyticsSummaryArgs = Database['public']['Functions']['get_gift_analytics_summary']['Args']
export type DbGetGiftAnalyticsSummaryReturns = Database['public']['Functions']['get_gift_analytics_summary']['Returns']

export type DbGetGuestTestSummaryArgs = Database['public']['Functions']['get_guest_test_summary']['Args']
export type DbGetGuestTestSummaryReturns = Database['public']['Functions']['get_guest_test_summary']['Returns']

export type DbGetJobsReadyForExecutionArgs = Database['public']['Functions']['get_jobs_ready_for_execution']['Args']
export type DbGetJobsReadyForExecutionReturns = Database['public']['Functions']['get_jobs_ready_for_execution']['Returns']

export type DbGetNpcCategoryPerformanceArgs = Database['public']['Functions']['get_npc_category_performance']['Args']
export type DbGetNpcCategoryPerformanceReturns = Database['public']['Functions']['get_npc_category_performance']['Returns']

export type DbGetOnboardingCategoriesArgs = Database['public']['Functions']['get_onboarding_categories']['Args']
export type DbGetOnboardingCategoriesReturns = Database['public']['Functions']['get_onboarding_categories']['Returns']

export type DbGetOnboardingSkillsArgs = Database['public']['Functions']['get_onboarding_skills']['Args']
export type DbGetOnboardingSkillsReturns = Database['public']['Functions']['get_onboarding_skills']['Returns']

export type DbGetOrCreateMediaOrganizationArgs = Database['public']['Functions']['get_or_create_media_organization']['Args']
export type DbGetOrCreateMediaOrganizationReturns = Database['public']['Functions']['get_or_create_media_organization']['Returns']

export type DbGetOrCreateSourceMetadataArgs = Database['public']['Functions']['get_or_create_source_metadata']['Args']
export type DbGetOrCreateSourceMetadataReturns = Database['public']['Functions']['get_or_create_source_metadata']['Returns']

export type DbGetOrCreateTagArgs = Database['public']['Functions']['get_or_create_tag']['Args']
export type DbGetOrCreateTagReturns = Database['public']['Functions']['get_or_create_tag']['Returns']

export type DbGetPeopleHelpedByDonorArgs = Database['public']['Functions']['get_people_helped_by_donor']['Args']
export type DbGetPeopleHelpedByDonorReturns = Database['public']['Functions']['get_people_helped_by_donor']['Returns']

export type DbGetPodAnalyticsArgs = Database['public']['Functions']['get_pod_analytics']['Args']
export type DbGetPodAnalyticsReturns = Database['public']['Functions']['get_pod_analytics']['Returns']

export type DbGetQuestionSocialProofStatsArgs = Database['public']['Functions']['get_question_social_proof_stats']['Args']
export type DbGetQuestionSocialProofStatsReturns = Database['public']['Functions']['get_question_social_proof_stats']['Returns']

export type DbGetRecommendedSkillsForUserArgs = Database['public']['Functions']['get_recommended_skills_for_user']['Args']
export type DbGetRecommendedSkillsForUserReturns = Database['public']['Functions']['get_recommended_skills_for_user']['Returns']

export type DbGetRoomMembersArgs = Database['public']['Functions']['get_room_members']['Args']
export type DbGetRoomMembersReturns = Database['public']['Functions']['get_room_members']['Returns']

export type DbGetShareableLinkInfoArgs = Database['public']['Functions']['get_shareable_link_info']['Args']
export type DbGetShareableLinkInfoReturns = Database['public']['Functions']['get_shareable_link_info']['Returns']

export type DbGetSkillsNeedingReviewArgs = Database['public']['Functions']['get_skills_needing_review']['Args']
export type DbGetSkillsNeedingReviewReturns = Database['public']['Functions']['get_skills_needing_review']['Returns']

export type DbGetSocialProofMessageArgs = Database['public']['Functions']['get_social_proof_message']['Args']
export type DbGetSocialProofMessageReturns = Database['public']['Functions']['get_social_proof_message']['Returns']

export type DbGetTableColumnInfoArgs = Database['public']['Functions']['get_table_column_info']['Args']
export type DbGetTableColumnInfoReturns = Database['public']['Functions']['get_table_column_info']['Returns']

export type DbGetTranslatableContentSummaryArgs = Database['public']['Functions']['get_translatable_content_summary']['Args']
export type DbGetTranslatableContentSummaryReturns = Database['public']['Functions']['get_translatable_content_summary']['Returns']

export type DbGetTranslationArgs = Database['public']['Functions']['get_translation']['Args']
export type DbGetTranslationReturns = Database['public']['Functions']['get_translation']['Returns']

export type DbGetUserBoostSummaryArgs = Database['public']['Functions']['get_user_boost_summary']['Args']
export type DbGetUserBoostSummaryReturns = Database['public']['Functions']['get_user_boost_summary']['Returns']

export type DbGetUserEmailPreferencesArgs = Database['public']['Functions']['get_user_email_preferences']['Args']
export type DbGetUserEmailPreferencesReturns = Database['public']['Functions']['get_user_email_preferences']['Returns']

export type DbGetUserFeatureLimitsArgs = Database['public']['Functions']['get_user_feature_limits']['Args']
export type DbGetUserFeatureLimitsReturns = Database['public']['Functions']['get_user_feature_limits']['Returns']

export type DbGetUserGiftCreditsArgs = Database['public']['Functions']['get_user_gift_credits']['Args']
export type DbGetUserGiftCreditsReturns = Database['public']['Functions']['get_user_gift_credits']['Returns']

export type DbGetUserOnboardingProgressArgs = Database['public']['Functions']['get_user_onboarding_progress']['Args']
export type DbGetUserOnboardingProgressReturns = Database['public']['Functions']['get_user_onboarding_progress']['Returns']

export type DbGetUserPodMembershipsArgs = Database['public']['Functions']['get_user_pod_memberships']['Args']
export type DbGetUserPodMembershipsReturns = Database['public']['Functions']['get_user_pod_memberships']['Returns']

export type DbGetUserProgressSessionsArgs = Database['public']['Functions']['get_user_progress_sessions']['Args']
export type DbGetUserProgressSessionsReturns = Database['public']['Functions']['get_user_progress_sessions']['Returns']

export type DbGetUserRoomsArgs = Database['public']['Functions']['get_user_rooms']['Args']
export type DbGetUserRoomsReturns = Database['public']['Functions']['get_user_rooms']['Returns']

export type DbGetUserShareableLinksArgs = Database['public']['Functions']['get_user_shareable_links']['Args']
export type DbGetUserShareableLinksReturns = Database['public']['Functions']['get_user_shareable_links']['Returns']

export type DbGtrgmCompressArgs = Database['public']['Functions']['gtrgm_compress']['Args']
export type DbGtrgmCompressReturns = Database['public']['Functions']['gtrgm_compress']['Returns']

export type DbGtrgmDecompressArgs = Database['public']['Functions']['gtrgm_decompress']['Args']
export type DbGtrgmDecompressReturns = Database['public']['Functions']['gtrgm_decompress']['Returns']

export type DbGtrgmInArgs = Database['public']['Functions']['gtrgm_in']['Args']
export type DbGtrgmInReturns = Database['public']['Functions']['gtrgm_in']['Returns']

export type DbGtrgmOptionsArgs = Database['public']['Functions']['gtrgm_options']['Args']
export type DbGtrgmOptionsReturns = Database['public']['Functions']['gtrgm_options']['Returns']

export type DbGtrgmOutArgs = Database['public']['Functions']['gtrgm_out']['Args']
export type DbGtrgmOutReturns = Database['public']['Functions']['gtrgm_out']['Returns']

export type DbIsAdminArgs = Database['public']['Functions']['is_admin']['Args']
export type DbIsAdminReturns = Database['public']['Functions']['is_admin']['Returns']

export type DbIsContentAppropriateForUserArgs = Database['public']['Functions']['is_content_appropriate_for_user']['Args']
export type DbIsContentAppropriateForUserReturns = Database['public']['Functions']['is_content_appropriate_for_user']['Returns']

export type DbIsEducationalEmailArgs = Database['public']['Functions']['is_educational_email']['Args']
export type DbIsEducationalEmailReturns = Database['public']['Functions']['is_educational_email']['Returns']

export type DbJoinMultiplayerRoomArgs = Database['public']['Functions']['join_multiplayer_room']['Args']
export type DbJoinMultiplayerRoomReturns = Database['public']['Functions']['join_multiplayer_room']['Returns']

export type DbJoinPodViaInviteArgs = Database['public']['Functions']['join_pod_via_invite']['Args']
export type DbJoinPodViaInviteReturns = Database['public']['Functions']['join_pod_via_invite']['Returns']

export type DbLeaveMultiplayerRoomArgs = Database['public']['Functions']['leave_multiplayer_room']['Args']
export type DbLeaveMultiplayerRoomReturns = Database['public']['Functions']['leave_multiplayer_room']['Returns']

export type DbLinkQuestionToSourceArgs = Database['public']['Functions']['link_question_to_source']['Args']
export type DbLinkQuestionToSourceReturns = Database['public']['Functions']['link_question_to_source']['Returns']

export type DbLogPodActivityArgs = Database['public']['Functions']['log_pod_activity']['Args']
export type DbLogPodActivityReturns = Database['public']['Functions']['log_pod_activity']['Returns']

export type DbMigrateProgressSessionToCompletionArgs = Database['public']['Functions']['migrate_progress_session_to_completion']['Args']
export type DbMigrateProgressSessionToCompletionReturns = Database['public']['Functions']['migrate_progress_session_to_completion']['Returns']

export type DbPopulateHistoricalAnalyticsArgs = Database['public']['Functions']['populate_historical_analytics']['Args']
export type DbPopulateHistoricalAnalyticsReturns = Database['public']['Functions']['populate_historical_analytics']['Returns']

export type DbProcessDonationGiftCreditsArgs = Database['public']['Functions']['process_donation_gift_credits']['Args']
export type DbProcessDonationGiftCreditsReturns = Database['public']['Functions']['process_donation_gift_credits']['Returns']

export type DbRecordGameEventArgs = Database['public']['Functions']['record_game_event']['Args']
export type DbRecordGameEventReturns = Database['public']['Functions']['record_game_event']['Returns']

export type DbRecordRoomEventArgs = Database['public']['Functions']['record_room_event']['Args']
export type DbRecordRoomEventReturns = Database['public']['Functions']['record_room_event']['Returns']

export type DbRedeemGiftCodeArgs = Database['public']['Functions']['redeem_gift_code']['Args']
export type DbRedeemGiftCodeReturns = Database['public']['Functions']['redeem_gift_code']['Returns']

export type DbRepairRoomsWithoutHostsArgs = Database['public']['Functions']['repair_rooms_without_hosts']['Args']
export type DbRepairRoomsWithoutHostsReturns = Database['public']['Functions']['repair_rooms_without_hosts']['Returns']

export type DbSearchBookmarksArgs = Database['public']['Functions']['search_bookmarks']['Args']
export type DbSearchBookmarksReturns = Database['public']['Functions']['search_bookmarks']['Returns']

export type DbSendNpcMessageArgs = Database['public']['Functions']['send_npc_message']['Args']
export type DbSendNpcMessageReturns = Database['public']['Functions']['send_npc_message']['Returns']

export type DbSetLimitArgs = Database['public']['Functions']['set_limit']['Args']
export type DbSetLimitReturns = Database['public']['Functions']['set_limit']['Returns']

export type DbSetTranslationArgs = Database['public']['Functions']['set_translation']['Args']
export type DbSetTranslationReturns = Database['public']['Functions']['set_translation']['Returns']

export type DbShowLimitArgs = Database['public']['Functions']['show_limit']['Args']
export type DbShowLimitReturns = Database['public']['Functions']['show_limit']['Returns']

export type DbShowTrgmArgs = Database['public']['Functions']['show_trgm']['Args']
export type DbShowTrgmReturns = Database['public']['Functions']['show_trgm']['Returns']

export type DbStartMultiplayerGameArgs = Database['public']['Functions']['start_multiplayer_game']['Args']
export type DbStartMultiplayerGameReturns = Database['public']['Functions']['start_multiplayer_game']['Returns']

export type DbTestMultiplayerOperationsArgs = Database['public']['Functions']['test_multiplayer_operations']['Args']
export type DbTestMultiplayerOperationsReturns = Database['public']['Functions']['test_multiplayer_operations']['Returns']

export type DbTrackFeatureUsageArgs = Database['public']['Functions']['track_feature_usage']['Args']
export type DbTrackFeatureUsageReturns = Database['public']['Functions']['track_feature_usage']['Returns']

export type DbUpdateBookmarkAccessArgs = Database['public']['Functions']['update_bookmark_access']['Args']
export type DbUpdateBookmarkAccessReturns = Database['public']['Functions']['update_bookmark_access']['Returns']

export type DbUpdateConversationContextArgs = Database['public']['Functions']['update_conversation_context']['Args']
export type DbUpdateConversationContextReturns = Database['public']['Functions']['update_conversation_context']['Returns']

export type DbUpdateJobAfterExecutionArgs = Database['public']['Functions']['update_job_after_execution']['Args']
export type DbUpdateJobAfterExecutionReturns = Database['public']['Functions']['update_job_after_execution']['Returns']

export type DbUpdateMemberAnalyticsArgs = Database['public']['Functions']['update_member_analytics']['Args']
export type DbUpdateMemberAnalyticsReturns = Database['public']['Functions']['update_member_analytics']['Returns']

export type DbUpdateNpcLearningArgs = Database['public']['Functions']['update_npc_learning']['Args']
export type DbUpdateNpcLearningReturns = Database['public']['Functions']['update_npc_learning']['Returns']

export type DbUpdateOrganizationBiasFromArticlesArgs = Database['public']['Functions']['update_organization_bias_from_articles']['Args']
export type DbUpdateOrganizationBiasFromArticlesReturns = Database['public']['Functions']['update_organization_bias_from_articles']['Returns']

export type DbUpdatePlayerReadyStatusArgs = Database['public']['Functions']['update_player_ready_status']['Args']
export type DbUpdatePlayerReadyStatusReturns = Database['public']['Functions']['update_player_ready_status']['Returns']

export type DbUpdatePodAnalyticsArgs = Database['public']['Functions']['update_pod_analytics']['Args']
export type DbUpdatePodAnalyticsReturns = Database['public']['Functions']['update_pod_analytics']['Returns']

export type DbUpdateUserSkillProgressArgs = Database['public']['Functions']['update_user_skill_progress']['Args']
export type DbUpdateUserSkillProgressReturns = Database['public']['Functions']['update_user_skill_progress']['Returns']

export type DbUpsertUserEmailPreferencesArgs = Database['public']['Functions']['upsert_user_email_preferences']['Args']
export type DbUpsertUserEmailPreferencesReturns = Database['public']['Functions']['upsert_user_email_preferences']['Returns']

// =============================================================================
// CUSTOM CONSTANTS (NOT AUTO-GENERATED)
// =============================================================================

/**
 * Valid session types for progress_sessions table
 * These match the database constraint: progress_sessions_session_type_check
 * Updated: 2025-01-27 to include 'assessment' and 'civics_test' session types
 */
export const SESSION_TYPES = {
  REGULAR_QUIZ: 'regular_quiz',
  REINFORCEMENT: 'reinforcement', 
  REVIEW: 'review',
  CHALLENGE: 'challenge',
  ASSESSMENT: 'assessment',
  CIVICS_TEST: 'civics_test',
} as const;

export type SessionType = typeof SESSION_TYPES[keyof typeof SESSION_TYPES];

/**
 * Helper function to validate session type
 */
export const isValidSessionType = (type: string): type is SessionType => {
  return Object.values(SESSION_TYPES).includes(type as SessionType);
};

/**
 * Get all valid session types as an array
 */
export const getValidSessionTypes = (): SessionType[] => {
  return Object.values(SESSION_TYPES);
};

// =============================================================================
// RELATIONSHIP TYPE EXPORTS
// =============================================================================

export const DB_RELATIONSHIPS = {
  ARTICLE_BIAS_ANALYSIS: [
    {
      foreignKeyName: 'article_bias_analysis_organization_id_fkey',
      columns: ['organization_id'],
      referencedRelation: 'media_organizations',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'article_bias_analysis_source_metadata_id_fkey',
      columns: ['source_metadata_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['source_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'article_bias_analysis_source_metadata_id_fkey',
      columns: ['source_metadata_id'],
      referencedRelation: 'source_metadata',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  ASSESSMENT_QUESTIONS: [
    {
      foreignKeyName: 'assessment_questions_skill_id_fkey',
      columns: ['skill_id'],
      referencedRelation: 'skills',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  BADGE_REQUIREMENTS: [
    {
      foreignKeyName: 'badge_requirements_badge_id_fkey',
      columns: ['badge_id'],
      referencedRelation: 'skill_badges',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  BIAS_DETECTION_PATTERNS: [
    {
      foreignKeyName: 'bias_detection_patterns_dimension_id_fkey',
      columns: ['dimension_id'],
      referencedRelation: 'bias_dimensions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  BIAS_FEEDBACK: [
    {
      foreignKeyName: 'bias_feedback_article_analysis_id_fkey',
      columns: ['article_analysis_id'],
      referencedRelation: 'article_bias_analysis',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'bias_feedback_dimension_id_fkey',
      columns: ['dimension_id'],
      referencedRelation: 'bias_dimensions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'bias_feedback_organization_id_fkey',
      columns: ['organization_id'],
      referencedRelation: 'media_organizations',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  BIAS_LEARNING_EVENTS: [
    {
      foreignKeyName: 'bias_learning_events_dimension_id_fkey',
      columns: ['dimension_id'],
      referencedRelation: 'bias_dimensions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'bias_learning_events_organization_id_fkey',
      columns: ['organization_id'],
      referencedRelation: 'media_organizations',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  BOOKMARK_ANALYTICS: [
    {
      foreignKeyName: 'bookmark_analytics_bookmark_id_fkey',
      columns: ['bookmark_id'],
      referencedRelation: 'bookmarks',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'bookmark_analytics_snippet_id_fkey',
      columns: ['snippet_id'],
      referencedRelation: 'bookmark_snippets',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  BOOKMARK_COLLECTIONS: [
    {
      foreignKeyName: 'bookmark_collections_parent_collection_id_fkey',
      columns: ['parent_collection_id'],
      referencedRelation: 'bookmark_collections',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  BOOKMARK_SNIPPETS: [
    {
      foreignKeyName: 'bookmark_snippets_bookmark_id_fkey',
      columns: ['bookmark_id'],
      referencedRelation: 'bookmarks',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'bookmark_snippets_collection_id_fkey',
      columns: ['collection_id'],
      referencedRelation: 'bookmark_collections',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  BOOKMARKS: [
    {
      foreignKeyName: 'bookmarks_collection_id_fkey',
      columns: ['collection_id'],
      referencedRelation: 'bookmark_collections',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  CATEGORY_SYNONYMS: [
    {
      foreignKeyName: 'category_synonyms_category_id_fkey',
      columns: ['category_id'],
      referencedRelation: 'categories',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  CONTENT_GENERATION_QUEUE: [
    {
      foreignKeyName: 'content_generation_queue_execution_log_id_fkey',
      columns: ['execution_log_id'],
      referencedRelation: 'job_execution_logs',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'content_generation_queue_scheduled_job_id_fkey',
      columns: ['scheduled_job_id'],
      referencedRelation: 'scheduled_content_jobs',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  FACT_CHECK_LOGS: [
    {
      foreignKeyName: 'fact_check_logs_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_feedback_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'fact_check_logs_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_response_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'fact_check_logs_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'fact_check_logs_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'fact_check_logs_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'questions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  FIGURE_EVENTS: [
    {
      foreignKeyName: 'figure_events_figure_id_fkey',
      columns: ['figure_id'],
      referencedRelation: 'public_figures',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  FIGURE_ORGANIZATIONS: [
    {
      foreignKeyName: 'figure_organizations_figure_id_fkey',
      columns: ['figure_id'],
      referencedRelation: 'public_figures',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'figure_organizations_organization_id_fkey',
      columns: ['organization_id'],
      referencedRelation: 'organizations',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  FIGURE_POLICY_POSITIONS: [
    {
      foreignKeyName: 'figure_policy_positions_figure_id_fkey',
      columns: ['figure_id'],
      referencedRelation: 'public_figures',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  FIGURE_QUIZ_TOPICS: [
    {
      foreignKeyName: 'figure_quiz_topics_primary_figure_id_fkey',
      columns: ['primary_figure_id'],
      referencedRelation: 'public_figures',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'figure_quiz_topics_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'figure_quiz_topics_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['topic_identifier'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'figure_quiz_topics_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_without_questions',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
  ],
  FIGURE_RELATIONSHIPS: [
    {
      foreignKeyName: 'figure_relationships_figure_a_id_fkey',
      columns: ['figure_a_id'],
      referencedRelation: 'public_figures',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'figure_relationships_figure_b_id_fkey',
      columns: ['figure_b_id'],
      referencedRelation: 'public_figures',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  FRIEND_REQUESTS: [
    {
      foreignKeyName: 'friend_requests_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'friend_requests_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'friend_requests_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  GIFT_REDEMPTIONS: [
    {
      foreignKeyName: 'gift_redemptions_gift_credit_id_fkey',
      columns: ['gift_credit_id'],
      referencedRelation: 'gift_credits',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  IMAGE_AB_TEST_RESULTS: [
    {
      foreignKeyName: 'image_ab_test_results_image_id_fkey',
      columns: ['image_id'],
      referencedRelation: 'image_generation_analytics',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  JOB_EXECUTION_LOGS: [
    {
      foreignKeyName: 'job_execution_logs_job_id_fkey',
      columns: ['job_id'],
      referencedRelation: 'scheduled_content_jobs',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  KEY_POLICY_POSITIONS: [
    {
      foreignKeyName: 'key_policy_positions_category_id_fkey',
      columns: ['category_id'],
      referencedRelation: 'categories',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  LEARNING_OBJECTIVES: [
    {
      foreignKeyName: 'learning_objectives_skill_id_fkey',
      columns: ['skill_id'],
      referencedRelation: 'skills',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  LEARNING_PODS: [
    {
      foreignKeyName: 'learning_pods_theme_id_fkey',
      columns: ['theme_id'],
      referencedRelation: 'pod_themes',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  MEDIA_ORGANIZATIONS: [
    {
      foreignKeyName: 'media_organizations_parent_organization_id_fkey',
      columns: ['parent_organization_id'],
      referencedRelation: 'media_organizations',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  MEMBER_INDIVIDUAL_SETTINGS: [
    {
      foreignKeyName: 'member_individual_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'member_individual_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'member_individual_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'member_settings_membership_fkey',
      columns: ['pod_id', 'user_id'],
      referencedRelation: 'pod_memberships',
      referencedColumns: ['pod_id', 'user_id'],
      isOneToOne: true,
    },
  ],
  MULTIPLAYER_CHAT_MESSAGES: [
    {
      foreignKeyName: 'multiplayer_chat_messages_reply_to_fkey',
      columns: ['reply_to_message_id'],
      referencedRelation: 'multiplayer_chat_messages',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  MULTIPLAYER_GAME_EVENTS: [
    {
      foreignKeyName: 'multiplayer_game_events_session_id_fkey',
      columns: ['session_id'],
      referencedRelation: 'multiplayer_game_sessions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  MULTIPLAYER_NPC_PLAYERS: [
    {
      foreignKeyName: 'multiplayer_npc_players_room_id_fkey',
      columns: ['room_id'],
      referencedRelation: 'multiplayer_rooms',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  MULTIPLAYER_QUESTION_RESPONSES: [
    {
      foreignKeyName: 'multiplayer_question_responses_npc_player_id_fkey',
      columns: ['npc_player_id'],
      referencedRelation: 'multiplayer_npc_players',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'multiplayer_question_responses_player_id_fkey',
      columns: ['player_id'],
      referencedRelation: 'multiplayer_room_players',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'multiplayer_question_responses_room_id_fkey',
      columns: ['room_id'],
      referencedRelation: 'multiplayer_rooms',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  MULTIPLAYER_QUIZ_ATTEMPTS: [
    {
      foreignKeyName: 'multiplayer_quiz_attempts_session_id_fkey',
      columns: ['session_id'],
      referencedRelation: 'multiplayer_game_sessions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  MULTIPLAYER_ROOM_PLAYERS: [
    {
      foreignKeyName: 'multiplayer_room_players_room_id_fkey',
      columns: ['room_id'],
      referencedRelation: 'multiplayer_rooms',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  NPC_CATEGORY_SPECIALIZATIONS: [
    {
      foreignKeyName: 'npc_category_specializations_npc_id_fkey',
      columns: ['npc_id'],
      referencedRelation: 'npc_personalities',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  NPC_CHAT_TEMPLATES: [
    {
      foreignKeyName: 'npc_chat_templates_npc_id_fkey',
      columns: ['npc_id'],
      referencedRelation: 'npc_personalities',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  NPC_CONVERSATION_HISTORY: [
    {
      foreignKeyName: 'npc_conversation_history_npc_id_fkey',
      columns: ['npc_id'],
      referencedRelation: 'npc_personalities',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  NPC_LEARNING_PROGRESSION: [
    {
      foreignKeyName: 'npc_learning_progression_npc_id_fkey',
      columns: ['npc_id'],
      referencedRelation: 'npc_personalities',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  NPC_QUESTION_RESPONSES: [
    {
      foreignKeyName: 'npc_question_responses_attempt_id_fkey',
      columns: ['attempt_id'],
      referencedRelation: 'npc_quiz_attempts',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'npc_question_responses_npc_id_fkey',
      columns: ['npc_id'],
      referencedRelation: 'npc_personalities',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  NPC_QUIZ_ATTEMPTS: [
    {
      foreignKeyName: 'npc_quiz_attempts_npc_id_fkey',
      columns: ['npc_id'],
      referencedRelation: 'npc_personalities',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  ORGANIZATION_BIAS_SCORES: [
    {
      foreignKeyName: 'organization_bias_scores_dimension_id_fkey',
      columns: ['dimension_id'],
      referencedRelation: 'bias_dimensions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'organization_bias_scores_organization_id_fkey',
      columns: ['organization_id'],
      referencedRelation: 'media_organizations',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  PARENTAL_CONTROLS: [
    {
      foreignKeyName: 'parental_controls_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'parental_controls_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'parental_controls_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  PATHWAY_SKILLS: [
    {
      foreignKeyName: 'pathway_skills_pathway_id_fkey',
      columns: ['pathway_id'],
      referencedRelation: 'skill_progression_pathways',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pathway_skills_skill_id_fkey',
      columns: ['skill_id'],
      referencedRelation: 'skills',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  POD_ACTIVITIES: [
    {
      foreignKeyName: 'pod_activities_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_activities_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_activities_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_ACTIVITY_LOG: [
    {
      foreignKeyName: 'pod_activity_log_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_activity_log_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_activity_log_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_ANALYTICS: [
    {
      foreignKeyName: 'pod_analytics_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_analytics_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_analytics_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_CHALLENGE_PARTICIPANTS: [
    {
      foreignKeyName: 'pod_challenge_participants_challenge_id_fkey',
      columns: ['challenge_id'],
      referencedRelation: 'pod_challenges',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  POD_CHALLENGES: [
    {
      foreignKeyName: 'pod_challenges_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_challenges_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_challenges_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_INVITE_LINKS: [
    {
      foreignKeyName: 'pod_invite_links_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_invite_links_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_invite_links_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_JOIN_REQUESTS: [
    {
      foreignKeyName: 'pod_join_requests_invite_link_id_fkey',
      columns: ['invite_link_id'],
      referencedRelation: 'pod_invite_links',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_join_requests_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_join_requests_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_join_requests_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_MEMBER_ANALYTICS: [
    {
      foreignKeyName: 'pod_member_analytics_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_member_analytics_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_member_analytics_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_MEMBER_SETTINGS: [
    {
      foreignKeyName: 'pod_member_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_member_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_member_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_MEMBERSHIPS: [
    {
      foreignKeyName: 'pod_memberships_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_memberships_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_memberships_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_PARTNERSHIPS: [
    {
      foreignKeyName: 'pod_partnerships_pod_1_id_fkey',
      columns: ['pod_1_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_partnerships_pod_1_id_fkey',
      columns: ['pod_1_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_partnerships_pod_1_id_fkey',
      columns: ['pod_1_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_partnerships_pod_2_id_fkey',
      columns: ['pod_2_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_partnerships_pod_2_id_fkey',
      columns: ['pod_2_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_partnerships_pod_2_id_fkey',
      columns: ['pod_2_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_RATINGS: [
    {
      foreignKeyName: 'pod_ratings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_ratings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'pod_ratings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: false,
    },
  ],
  POD_SETTINGS: [
    {
      foreignKeyName: 'pod_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'learning_pods',
      referencedColumns: ['id'],
      isOneToOne: true,
    },
    {
      foreignKeyName: 'pod_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['id'],
      isOneToOne: true,
    },
    {
      foreignKeyName: 'pod_settings_pod_id_fkey',
      columns: ['pod_id'],
      referencedRelation: 'pod_discovery',
      referencedColumns: ['pod_id'],
      isOneToOne: true,
    },
  ],
  PROGRESS_QUESTION_RESPONSES: [
    {
      foreignKeyName: 'progress_question_responses_progress_session_id_fkey',
      columns: ['progress_session_id'],
      referencedRelation: 'progress_sessions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'progress_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_feedback_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'progress_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_response_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'progress_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'progress_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'progress_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'questions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  PROGRESS_SESSIONS: [
    {
      foreignKeyName: 'progress_sessions_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'progress_sessions_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['topic_identifier'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'progress_sessions_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_without_questions',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
  ],
  QUESTION_FEEDBACK: [
    {
      foreignKeyName: 'question_feedback_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_feedback_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_feedback_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_response_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_feedback_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_feedback_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_feedback_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'questions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  QUESTION_SKILLS: [
    {
      foreignKeyName: 'question_skills_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_feedback_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_skills_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_response_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_skills_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_skills_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_skills_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'questions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_skills_skill_id_fkey',
      columns: ['skill_id'],
      referencedRelation: 'skills',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  QUESTION_SOURCE_LINKS: [
    {
      foreignKeyName: 'question_source_links_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_feedback_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_source_links_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_response_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_source_links_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_source_links_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_source_links_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'questions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_source_links_source_metadata_id_fkey',
      columns: ['source_metadata_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['source_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'question_source_links_source_metadata_id_fkey',
      columns: ['source_metadata_id'],
      referencedRelation: 'source_metadata',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  QUESTIONS_TEST: [
    {
      foreignKeyName: 'questions_test_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'questions_test_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['topic_identifier'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'questions_test_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_without_questions',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
  ],
  SHAREABLE_LINK_CLAIMS: [
    {
      foreignKeyName: 'shareable_link_claims_shareable_link_id_fkey',
      columns: ['shareable_link_id'],
      referencedRelation: 'shareable_gift_links',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  SHARED_COLLECTION_ACCESS: [
    {
      foreignKeyName: 'shared_collection_access_collection_id_fkey',
      columns: ['collection_id'],
      referencedRelation: 'bookmark_collections',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  SKILL_ASSESSMENT_CRITERIA: [
    {
      foreignKeyName: 'skill_assessment_criteria_skill_id_fkey',
      columns: ['skill_id'],
      referencedRelation: 'skills',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  SKILL_LEARNING_OBJECTIVES: [
    {
      foreignKeyName: 'skill_learning_objectives_skill_id_fkey',
      columns: ['skill_id'],
      referencedRelation: 'skills',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  SURVEY_QUESTIONS: [
    {
      foreignKeyName: 'survey_questions_survey_id_fkey',
      columns: ['survey_id'],
      referencedRelation: 'survey_summary',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'survey_questions_survey_id_fkey',
      columns: ['survey_id'],
      referencedRelation: 'surveys',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  SURVEY_RECOMMENDATIONS: [
    {
      foreignKeyName: 'survey_recommendations_survey_id_fkey',
      columns: ['survey_id'],
      referencedRelation: 'survey_summary',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'survey_recommendations_survey_id_fkey',
      columns: ['survey_id'],
      referencedRelation: 'surveys',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  SURVEY_RESPONSES: [
    {
      foreignKeyName: 'survey_responses_survey_id_fkey',
      columns: ['survey_id'],
      referencedRelation: 'survey_summary',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'survey_responses_survey_id_fkey',
      columns: ['survey_id'],
      referencedRelation: 'surveys',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  USER_BADGES: [
    {
      foreignKeyName: 'user_badges_badge_id_fkey',
      columns: ['badge_id'],
      referencedRelation: 'skill_badges',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  USER_CATEGORY_PREFERENCES: [
    {
      foreignKeyName: 'user_category_preferences_category_id_fkey',
      columns: ['category_id'],
      referencedRelation: 'categories',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  USER_DECK_CONTENT: [
    {
      foreignKeyName: 'user_deck_content_deck_id_fkey',
      columns: ['deck_id'],
      referencedRelation: 'user_custom_decks',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_deck_content_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_feedback_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_deck_content_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_response_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_deck_content_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_deck_content_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_deck_content_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'questions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_deck_content_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_deck_content_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['topic_identifier'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_deck_content_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_without_questions',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
  ],
  USER_PROGRESS: [
    {
      foreignKeyName: 'user_progress_user_id_fkey',
      columns: ['user_id'],
      referencedRelation: 'profiles',
      referencedColumns: ['id'],
      isOneToOne: true,
    },
  ],
  USER_QUESTION_MEMORY: [
    {
      foreignKeyName: 'user_question_memory_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_feedback_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_memory_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_response_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_memory_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_memory_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_memory_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'questions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  USER_QUESTION_RESPONSES: [
    {
      foreignKeyName: 'user_question_responses_attempt_id_fkey',
      columns: ['attempt_id'],
      referencedRelation: 'user_quiz_attempts',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_feedback_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_response_stats',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_sources_enhanced',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['question_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_question_responses_question_id_fkey',
      columns: ['question_id'],
      referencedRelation: 'questions',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  USER_QUIZ_ANALYTICS: [
    {
      foreignKeyName: 'user_quiz_analytics_quiz_attempt_id_fkey',
      columns: ['quiz_attempt_id'],
      referencedRelation: 'user_quiz_attempts',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_quiz_analytics_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_quiz_analytics_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_with_questions',
      referencedColumns: ['topic_identifier'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_quiz_analytics_topic_id_fkey',
      columns: ['topic_id'],
      referencedRelation: 'question_topics_without_questions',
      referencedColumns: ['topic_id'],
      isOneToOne: false,
    },
  ],
  USER_ROLES: [
    {
      foreignKeyName: 'user_roles_granted_by_fkey',
      columns: ['granted_by'],
      referencedRelation: 'profiles',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_roles_user_id_fkey',
      columns: ['user_id'],
      referencedRelation: 'profiles',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  USER_SKILL_PREFERENCES: [
    {
      foreignKeyName: 'user_skill_preferences_skill_id_fkey',
      columns: ['skill_id'],
      referencedRelation: 'skills',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  USER_SKILL_PROGRESS: [
    {
      foreignKeyName: 'user_skill_progress_skill_id_fkey',
      columns: ['skill_id'],
      referencedRelation: 'skills',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
  USER_SURVEY_COMPLETIONS: [
    {
      foreignKeyName: 'user_survey_completions_response_id_fkey',
      columns: ['response_id'],
      referencedRelation: 'survey_responses',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_survey_completions_survey_id_fkey',
      columns: ['survey_id'],
      referencedRelation: 'survey_summary',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
    {
      foreignKeyName: 'user_survey_completions_survey_id_fkey',
      columns: ['survey_id'],
      referencedRelation: 'surveys',
      referencedColumns: ['id'],
      isOneToOne: false,
    },
  ],
} as const;

