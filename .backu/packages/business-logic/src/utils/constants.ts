/**
 * Database Constants for CivicSense
 * 
 * This file is auto-generated from the main database.types.ts file
 * to provide easy access to database schema constants and prevent typos.
 * 
 * Last updated: 2025-06-20T15:55:36.765Z
 * 
 * DO NOT EDIT MANUALLY - Use 'npm run sync:db-constants' to update
 */

import type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'

// =============================================================================
// TABLE NAMES
// =============================================================================

export const DB_TABLES = {
  ARTICLE_BIAS_ANALYSIS: 'article_bias_analysis' as const,
  ASSESSMENT_ANALYTICS: 'assessment_analytics' as const,
  ASSESSMENT_QUESTIONS: 'assessment_questions' as const,
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
  USER_IS_IN_ROOM: 'user_is_in_room' as const,
  VALIDATE_FUNCTION_TABLE_TYPES: 'validate_function_table_types' as const,
  VALIDATE_MIGRATION_SAFETY: 'validate_migration_safety' as const,
  VALIDATE_MULTIPLAYER_HOST_ASSIGNMENTS: 'validate_multiplayer_host_assignments' as const,
  VALIDATE_MULTIPLAYER_SCHEMA: 'validate_multiplayer_schema' as const,
  VALIDATE_MULTIPLAYER_SCHEMA_ALIGNMENT: 'validate_multiplayer_schema_alignment' as const,
  VALIDATE_TRANSLATION_STRUCTURE: 'validate_translation_structure' as const,
} as const;

export type DbFunctionName = keyof typeof DB_FUNCTIONS;

// =============================================================================
// COMMON QUERY PATTERNS
// =============================================================================

export const QUERY_PATTERNS = {
  // Common select patterns
  SELECT_ACTIVE_CATEGORIES: `SELECT * FROM ${DB_TABLES.CATEGORIES} WHERE is_active = true ORDER BY display_order`,
  SELECT_USER_PROGRESS: `SELECT * FROM ${DB_TABLES.USER_PROGRESS} WHERE user_id = $1`,
  SELECT_RECENT_QUIZ_ATTEMPTS: `SELECT * FROM ${DB_TABLES.USER_QUIZ_ATTEMPTS} WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
  
  // Multiplayer queries
  SELECT_ACTIVE_ROOMS: `SELECT * FROM ${DB_TABLES.MULTIPLAYER_ROOMS} WHERE status = 'waiting' AND expires_at > NOW()`,
  SELECT_ROOM_PLAYERS: `SELECT * FROM ${DB_TABLES.MULTIPLAYER_ROOM_PLAYERS} WHERE room_id = $1 ORDER BY join_order`,
  
  // Assessment queries
  SELECT_ASSESSMENT_QUESTIONS: `SELECT * FROM ${DB_TABLES.ASSESSMENT_QUESTIONS} WHERE category = $1 AND is_active = true ORDER BY difficulty`,
  
  // Skills queries
  SELECT_USER_SKILLS: `SELECT * FROM ${DB_TABLES.USER_SKILL_PROGRESS} WHERE user_id = $1`,
  
  // Learning pods queries
  SELECT_USER_PODS: `SELECT * FROM ${DB_TABLES.LEARNING_PODS} WHERE created_by = $1 OR id IN (SELECT pod_id FROM ${DB_TABLES.POD_MEMBERSHIPS} WHERE user_id = $1)`,
  SELECT_POD_MEMBERS: `SELECT * FROM ${DB_TABLES.POD_MEMBERSHIPS} WHERE pod_id = $1 AND membership_status = 'active'`,
} as const;

// =============================================================================
// REAL-TIME SUBSCRIPTIONS
// =============================================================================

export const REALTIME_CHANNELS = {
  // Multiplayer channels
  MULTIPLAYER_ROOM: 'multiplayer_room',
  MULTIPLAYER_PLAYERS: 'multiplayer_players',
  MULTIPLAYER_CHAT: 'multiplayer_chat',
  MULTIPLAYER_GAME_EVENTS: 'multiplayer_game_events',
  
  // User progress channels
  USER_PROGRESS: 'user_progress',
  USER_QUIZ_ATTEMPTS: 'user_quiz_attempts',
  
  // Learning pod channels
  POD_ACTIVITY: 'pod_activity',
  POD_CHAT: 'pod_chat',
  POD_MEMBERSHIPS: 'pod_memberships',
} as const;

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export const CACHE_CONFIG = {
  // Cache durations (in milliseconds)
  DURATIONS: {
    CATEGORIES: 24 * 60 * 60 * 1000, // 24 hours
    QUESTIONS: 12 * 60 * 60 * 1000, // 12 hours
    USER_PROGRESS: 5 * 60 * 1000, // 5 minutes
    MULTIPLAYER_ROOMS: 30 * 1000, // 30 seconds
    QUIZ_ATTEMPTS: 60 * 60 * 1000, // 1 hour
    SKILLS: 30 * 60 * 1000, // 30 minutes
  },
  
  // Batch sizes for optimization
  BATCH_SIZES: {
    QUESTIONS: 25,
    QUIZ_ATTEMPTS: 50,
    CATEGORIES: 20,
    MULTIPLAYER_MESSAGES: 100,
    SKILLS: 30,
  },
  
  // Application limits
  LIMITS: {
    MAX_CACHED_QUESTIONS: 500,
    MAX_MULTIPLAYER_PLAYERS: 8,
    MAX_CHAT_MESSAGES: 200,
    MAX_POD_MEMBERS: 50,
    MAX_RECENT_ATTEMPTS: 100,
  },
} as const;

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

export const isValidTableName = (tableName: string): tableName is DbTableName => {
  return Object.values(DB_TABLES).includes(tableName as any);
};

export const isValidFunctionName = (functionName: string): functionName is DbFunctionName => {
  return Object.values(DB_FUNCTIONS).includes(functionName as any);
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
// EXPORT ALL CONSTANTS
// =============================================================================

export default {
  TABLES: DB_TABLES,
  ENUMS: DB_ENUMS,
  FUNCTIONS: DB_FUNCTIONS,
  QUERY_PATTERNS,
  REALTIME_CHANNELS,
  CACHE_CONFIG,
  isValidTableName,
  isValidFunctionName,
  getTableConstant,
  getFunctionConstant,
} as const;

// =============================================================================
// TYPE EXPORTS FOR CONVENIENCE
// =============================================================================

export type DatabaseConstants = typeof DB_TABLES;
export type DatabaseEnums = typeof DB_ENUMS;
export type DatabaseFunctions = typeof DB_FUNCTIONS;
export type QueryPatterns = typeof QUERY_PATTERNS;
export type RealtimeChannels = typeof REALTIME_CHANNELS;
export type CacheConfig = typeof CACHE_CONFIG;


// =============================================================================
// CONVENIENT TABLE TYPE EXPORTS
// =============================================================================

export type DbArticleBiasAnalysis = Tables<'article_bias_analysis'>
export type DbArticleBiasAnalysisInsert = TablesInsert<'article_bias_analysis'>
export type DbArticleBiasAnalysisUpdate = TablesUpdate<'article_bias_analysis'>

export type DbAssessmentAnalytics = Tables<'assessment_analytics'>
export type DbAssessmentAnalyticsInsert = TablesInsert<'assessment_analytics'>
export type DbAssessmentAnalyticsUpdate = TablesUpdate<'assessment_analytics'>

export type DbAssessmentQuestions = Tables<'assessment_questions'>
export type DbAssessmentQuestionsInsert = TablesInsert<'assessment_questions'>
export type DbAssessmentQuestionsUpdate = TablesUpdate<'assessment_questions'>

export type DbAssessmentScoring = Tables<'assessment_scoring'>
export type DbAssessmentScoringInsert = TablesInsert<'assessment_scoring'>
export type DbAssessmentScoringUpdate = TablesUpdate<'assessment_scoring'>

export type DbBadgeRequirements = Tables<'badge_requirements'>
export type DbBadgeRequirementsInsert = TablesInsert<'badge_requirements'>
export type DbBadgeRequirementsUpdate = TablesUpdate<'badge_requirements'>

export type DbBiasDetectionPatterns = Tables<'bias_detection_patterns'>
export type DbBiasDetectionPatternsInsert = TablesInsert<'bias_detection_patterns'>
export type DbBiasDetectionPatternsUpdate = TablesUpdate<'bias_detection_patterns'>

export type DbBiasDimensions = Tables<'bias_dimensions'>
export type DbBiasDimensionsInsert = TablesInsert<'bias_dimensions'>
export type DbBiasDimensionsUpdate = TablesUpdate<'bias_dimensions'>

export type DbBiasFeedback = Tables<'bias_feedback'>
export type DbBiasFeedbackInsert = TablesInsert<'bias_feedback'>
export type DbBiasFeedbackUpdate = TablesUpdate<'bias_feedback'>

export type DbBiasLearningEvents = Tables<'bias_learning_events'>
export type DbBiasLearningEventsInsert = TablesInsert<'bias_learning_events'>
export type DbBiasLearningEventsUpdate = TablesUpdate<'bias_learning_events'>

export type DbBookmarkAnalytics = Tables<'bookmark_analytics'>
export type DbBookmarkAnalyticsInsert = TablesInsert<'bookmark_analytics'>
export type DbBookmarkAnalyticsUpdate = TablesUpdate<'bookmark_analytics'>

export type DbBookmarkCollections = Tables<'bookmark_collections'>
export type DbBookmarkCollectionsInsert = TablesInsert<'bookmark_collections'>
export type DbBookmarkCollectionsUpdate = TablesUpdate<'bookmark_collections'>

export type DbBookmarkSnippets = Tables<'bookmark_snippets'>
export type DbBookmarkSnippetsInsert = TablesInsert<'bookmark_snippets'>
export type DbBookmarkSnippetsUpdate = TablesUpdate<'bookmark_snippets'>

export type DbBookmarkTags = Tables<'bookmark_tags'>
export type DbBookmarkTagsInsert = TablesInsert<'bookmark_tags'>
export type DbBookmarkTagsUpdate = TablesUpdate<'bookmark_tags'>

export type DbBookmarks = Tables<'bookmarks'>
export type DbBookmarksInsert = TablesInsert<'bookmarks'>
export type DbBookmarksUpdate = TablesUpdate<'bookmarks'>

export type DbBoostDefinitions = Tables<'boost_definitions'>
export type DbBoostDefinitionsInsert = TablesInsert<'boost_definitions'>
export type DbBoostDefinitionsUpdate = TablesUpdate<'boost_definitions'>

export type DbCategories = Tables<'categories'>
export type DbCategoriesInsert = TablesInsert<'categories'>
export type DbCategoriesUpdate = TablesUpdate<'categories'>

export type DbCategorySynonyms = Tables<'category_synonyms'>
export type DbCategorySynonymsInsert = TablesInsert<'category_synonyms'>
export type DbCategorySynonymsUpdate = TablesUpdate<'category_synonyms'>

export type DbCivicsTestAnalytics = Tables<'civics_test_analytics'>
export type DbCivicsTestAnalyticsInsert = TablesInsert<'civics_test_analytics'>
export type DbCivicsTestAnalyticsUpdate = TablesUpdate<'civics_test_analytics'>

export type DbCleverUserMapping = Tables<'clever_user_mapping'>
export type DbCleverUserMappingInsert = TablesInsert<'clever_user_mapping'>
export type DbCleverUserMappingUpdate = TablesUpdate<'clever_user_mapping'>

export type DbContentFilteringRules = Tables<'content_filtering_rules'>
export type DbContentFilteringRulesInsert = TablesInsert<'content_filtering_rules'>
export type DbContentFilteringRulesUpdate = TablesUpdate<'content_filtering_rules'>

export type DbContentGenerationQueue = Tables<'content_generation_queue'>
export type DbContentGenerationQueueInsert = TablesInsert<'content_generation_queue'>
export type DbContentGenerationQueueUpdate = TablesUpdate<'content_generation_queue'>

export type DbContentPreviewCache = Tables<'content_preview_cache'>
export type DbContentPreviewCacheInsert = TablesInsert<'content_preview_cache'>
export type DbContentPreviewCacheUpdate = TablesUpdate<'content_preview_cache'>

export type DbEvents = Tables<'events'>
export type DbEventsInsert = TablesInsert<'events'>
export type DbEventsUpdate = TablesUpdate<'events'>

export type DbFactCheckLogs = Tables<'fact_check_logs'>
export type DbFactCheckLogsInsert = TablesInsert<'fact_check_logs'>
export type DbFactCheckLogsUpdate = TablesUpdate<'fact_check_logs'>

export type DbFigureEvents = Tables<'figure_events'>
export type DbFigureEventsInsert = TablesInsert<'figure_events'>
export type DbFigureEventsUpdate = TablesUpdate<'figure_events'>

export type DbFigureOrganizations = Tables<'figure_organizations'>
export type DbFigureOrganizationsInsert = TablesInsert<'figure_organizations'>
export type DbFigureOrganizationsUpdate = TablesUpdate<'figure_organizations'>

export type DbFigurePolicyPositions = Tables<'figure_policy_positions'>
export type DbFigurePolicyPositionsInsert = TablesInsert<'figure_policy_positions'>
export type DbFigurePolicyPositionsUpdate = TablesUpdate<'figure_policy_positions'>

export type DbFigureQuizTopics = Tables<'figure_quiz_topics'>
export type DbFigureQuizTopicsInsert = TablesInsert<'figure_quiz_topics'>
export type DbFigureQuizTopicsUpdate = TablesUpdate<'figure_quiz_topics'>

export type DbFigureRelationships = Tables<'figure_relationships'>
export type DbFigureRelationshipsInsert = TablesInsert<'figure_relationships'>
export type DbFigureRelationshipsUpdate = TablesUpdate<'figure_relationships'>

export type DbFriendRequests = Tables<'friend_requests'>
export type DbFriendRequestsInsert = TablesInsert<'friend_requests'>
export type DbFriendRequestsUpdate = TablesUpdate<'friend_requests'>

export type DbGiftCredits = Tables<'gift_credits'>
export type DbGiftCreditsInsert = TablesInsert<'gift_credits'>
export type DbGiftCreditsUpdate = TablesUpdate<'gift_credits'>

export type DbGiftRedemptions = Tables<'gift_redemptions'>
export type DbGiftRedemptionsInsert = TablesInsert<'gift_redemptions'>
export type DbGiftRedemptionsUpdate = TablesUpdate<'gift_redemptions'>

export type DbGlossaryTerms = Tables<'glossary_terms'>
export type DbGlossaryTermsInsert = TablesInsert<'glossary_terms'>
export type DbGlossaryTermsUpdate = TablesUpdate<'glossary_terms'>

export type DbGuestCivicsTestResults = Tables<'guest_civics_test_results'>
export type DbGuestCivicsTestResultsInsert = TablesInsert<'guest_civics_test_results'>
export type DbGuestCivicsTestResultsUpdate = TablesUpdate<'guest_civics_test_results'>

export type DbGuestUsageAnalytics = Tables<'guest_usage_analytics'>
export type DbGuestUsageAnalyticsInsert = TablesInsert<'guest_usage_analytics'>
export type DbGuestUsageAnalyticsUpdate = TablesUpdate<'guest_usage_analytics'>

export type DbGuestUsageTracking = Tables<'guest_usage_tracking'>
export type DbGuestUsageTrackingInsert = TablesInsert<'guest_usage_tracking'>
export type DbGuestUsageTrackingUpdate = TablesUpdate<'guest_usage_tracking'>

export type DbImageAbTestResults = Tables<'image_ab_test_results'>
export type DbImageAbTestResultsInsert = TablesInsert<'image_ab_test_results'>
export type DbImageAbTestResultsUpdate = TablesUpdate<'image_ab_test_results'>

export type DbImageGenerationAnalytics = Tables<'image_generation_analytics'>
export type DbImageGenerationAnalyticsInsert = TablesInsert<'image_generation_analytics'>
export type DbImageGenerationAnalyticsUpdate = TablesUpdate<'image_generation_analytics'>

export type DbJobExecutionLogs = Tables<'job_execution_logs'>
export type DbJobExecutionLogsInsert = TablesInsert<'job_execution_logs'>
export type DbJobExecutionLogsUpdate = TablesUpdate<'job_execution_logs'>

export type DbKeyPolicyPositions = Tables<'key_policy_positions'>
export type DbKeyPolicyPositionsInsert = TablesInsert<'key_policy_positions'>
export type DbKeyPolicyPositionsUpdate = TablesUpdate<'key_policy_positions'>

export type DbLearningObjectives = Tables<'learning_objectives'>
export type DbLearningObjectivesInsert = TablesInsert<'learning_objectives'>
export type DbLearningObjectivesUpdate = TablesUpdate<'learning_objectives'>

export type DbLearningPods = Tables<'learning_pods'>
export type DbLearningPodsInsert = TablesInsert<'learning_pods'>
export type DbLearningPodsUpdate = TablesUpdate<'learning_pods'>

export type DbMediaOrganizations = Tables<'media_organizations'>
export type DbMediaOrganizationsInsert = TablesInsert<'media_organizations'>
export type DbMediaOrganizationsUpdate = TablesUpdate<'media_organizations'>

export type DbMemberIndividualSettings = Tables<'member_individual_settings'>
export type DbMemberIndividualSettingsInsert = TablesInsert<'member_individual_settings'>
export type DbMemberIndividualSettingsUpdate = TablesUpdate<'member_individual_settings'>

export type DbMultiplayerChatMessages = Tables<'multiplayer_chat_messages'>
export type DbMultiplayerChatMessagesInsert = TablesInsert<'multiplayer_chat_messages'>
export type DbMultiplayerChatMessagesUpdate = TablesUpdate<'multiplayer_chat_messages'>

export type DbMultiplayerConversationContext = Tables<'multiplayer_conversation_context'>
export type DbMultiplayerConversationContextInsert = TablesInsert<'multiplayer_conversation_context'>
export type DbMultiplayerConversationContextUpdate = TablesUpdate<'multiplayer_conversation_context'>

export type DbMultiplayerGameEvents = Tables<'multiplayer_game_events'>
export type DbMultiplayerGameEventsInsert = TablesInsert<'multiplayer_game_events'>
export type DbMultiplayerGameEventsUpdate = TablesUpdate<'multiplayer_game_events'>

export type DbMultiplayerGameSessions = Tables<'multiplayer_game_sessions'>
export type DbMultiplayerGameSessionsInsert = TablesInsert<'multiplayer_game_sessions'>
export type DbMultiplayerGameSessionsUpdate = TablesUpdate<'multiplayer_game_sessions'>

export type DbMultiplayerNpcPlayers = Tables<'multiplayer_npc_players'>
export type DbMultiplayerNpcPlayersInsert = TablesInsert<'multiplayer_npc_players'>
export type DbMultiplayerNpcPlayersUpdate = TablesUpdate<'multiplayer_npc_players'>

export type DbMultiplayerQuestionResponses = Tables<'multiplayer_question_responses'>
export type DbMultiplayerQuestionResponsesInsert = TablesInsert<'multiplayer_question_responses'>
export type DbMultiplayerQuestionResponsesUpdate = TablesUpdate<'multiplayer_question_responses'>

export type DbMultiplayerQuizAttempts = Tables<'multiplayer_quiz_attempts'>
export type DbMultiplayerQuizAttemptsInsert = TablesInsert<'multiplayer_quiz_attempts'>
export type DbMultiplayerQuizAttemptsUpdate = TablesUpdate<'multiplayer_quiz_attempts'>

export type DbMultiplayerRoomEvents = Tables<'multiplayer_room_events'>
export type DbMultiplayerRoomEventsInsert = TablesInsert<'multiplayer_room_events'>
export type DbMultiplayerRoomEventsUpdate = TablesUpdate<'multiplayer_room_events'>

export type DbMultiplayerRoomPlayers = Tables<'multiplayer_room_players'>
export type DbMultiplayerRoomPlayersInsert = TablesInsert<'multiplayer_room_players'>
export type DbMultiplayerRoomPlayersUpdate = TablesUpdate<'multiplayer_room_players'>

export type DbMultiplayerRooms = Tables<'multiplayer_rooms'>
export type DbMultiplayerRoomsInsert = TablesInsert<'multiplayer_rooms'>
export type DbMultiplayerRoomsUpdate = TablesUpdate<'multiplayer_rooms'>

export type DbNewsCache = Tables<'news_cache'>
export type DbNewsCacheInsert = TablesInsert<'news_cache'>
export type DbNewsCacheUpdate = TablesUpdate<'news_cache'>

export type DbNpcCategorySpecializations = Tables<'npc_category_specializations'>
export type DbNpcCategorySpecializationsInsert = TablesInsert<'npc_category_specializations'>
export type DbNpcCategorySpecializationsUpdate = TablesUpdate<'npc_category_specializations'>

export type DbNpcChatTemplates = Tables<'npc_chat_templates'>
export type DbNpcChatTemplatesInsert = TablesInsert<'npc_chat_templates'>
export type DbNpcChatTemplatesUpdate = TablesUpdate<'npc_chat_templates'>

export type DbNpcConversationHistory = Tables<'npc_conversation_history'>
export type DbNpcConversationHistoryInsert = TablesInsert<'npc_conversation_history'>
export type DbNpcConversationHistoryUpdate = TablesUpdate<'npc_conversation_history'>

export type DbNpcLearningProgression = Tables<'npc_learning_progression'>
export type DbNpcLearningProgressionInsert = TablesInsert<'npc_learning_progression'>
export type DbNpcLearningProgressionUpdate = TablesUpdate<'npc_learning_progression'>

export type DbNpcPersonalities = Tables<'npc_personalities'>
export type DbNpcPersonalitiesInsert = TablesInsert<'npc_personalities'>
export type DbNpcPersonalitiesUpdate = TablesUpdate<'npc_personalities'>

export type DbNpcQuestionResponses = Tables<'npc_question_responses'>
export type DbNpcQuestionResponsesInsert = TablesInsert<'npc_question_responses'>
export type DbNpcQuestionResponsesUpdate = TablesUpdate<'npc_question_responses'>

export type DbNpcQuizAttempts = Tables<'npc_quiz_attempts'>
export type DbNpcQuizAttemptsInsert = TablesInsert<'npc_quiz_attempts'>
export type DbNpcQuizAttemptsUpdate = TablesUpdate<'npc_quiz_attempts'>

export type DbOrganizationBiasScores = Tables<'organization_bias_scores'>
export type DbOrganizationBiasScoresInsert = TablesInsert<'organization_bias_scores'>
export type DbOrganizationBiasScoresUpdate = TablesUpdate<'organization_bias_scores'>

export type DbOrganizations = Tables<'organizations'>
export type DbOrganizationsInsert = TablesInsert<'organizations'>
export type DbOrganizationsUpdate = TablesUpdate<'organizations'>

export type DbParentalControls = Tables<'parental_controls'>
export type DbParentalControlsInsert = TablesInsert<'parental_controls'>
export type DbParentalControlsUpdate = TablesUpdate<'parental_controls'>

export type DbPathwaySkills = Tables<'pathway_skills'>
export type DbPathwaySkillsInsert = TablesInsert<'pathway_skills'>
export type DbPathwaySkillsUpdate = TablesUpdate<'pathway_skills'>

export type DbPodAchievements = Tables<'pod_achievements'>
export type DbPodAchievementsInsert = TablesInsert<'pod_achievements'>
export type DbPodAchievementsUpdate = TablesUpdate<'pod_achievements'>

export type DbPodActivities = Tables<'pod_activities'>
export type DbPodActivitiesInsert = TablesInsert<'pod_activities'>
export type DbPodActivitiesUpdate = TablesUpdate<'pod_activities'>

export type DbPodActivityLog = Tables<'pod_activity_log'>
export type DbPodActivityLogInsert = TablesInsert<'pod_activity_log'>
export type DbPodActivityLogUpdate = TablesUpdate<'pod_activity_log'>

export type DbPodAnalytics = Tables<'pod_analytics'>
export type DbPodAnalyticsInsert = TablesInsert<'pod_analytics'>
export type DbPodAnalyticsUpdate = TablesUpdate<'pod_analytics'>

export type DbPodChallengeParticipants = Tables<'pod_challenge_participants'>
export type DbPodChallengeParticipantsInsert = TablesInsert<'pod_challenge_participants'>
export type DbPodChallengeParticipantsUpdate = TablesUpdate<'pod_challenge_participants'>

export type DbPodChallenges = Tables<'pod_challenges'>
export type DbPodChallengesInsert = TablesInsert<'pod_challenges'>
export type DbPodChallengesUpdate = TablesUpdate<'pod_challenges'>

export type DbPodInviteLinks = Tables<'pod_invite_links'>
export type DbPodInviteLinksInsert = TablesInsert<'pod_invite_links'>
export type DbPodInviteLinksUpdate = TablesUpdate<'pod_invite_links'>

export type DbPodJoinRequests = Tables<'pod_join_requests'>
export type DbPodJoinRequestsInsert = TablesInsert<'pod_join_requests'>
export type DbPodJoinRequestsUpdate = TablesUpdate<'pod_join_requests'>

export type DbPodMemberAnalytics = Tables<'pod_member_analytics'>
export type DbPodMemberAnalyticsInsert = TablesInsert<'pod_member_analytics'>
export type DbPodMemberAnalyticsUpdate = TablesUpdate<'pod_member_analytics'>

export type DbPodMemberSettings = Tables<'pod_member_settings'>
export type DbPodMemberSettingsInsert = TablesInsert<'pod_member_settings'>
export type DbPodMemberSettingsUpdate = TablesUpdate<'pod_member_settings'>

export type DbPodMemberships = Tables<'pod_memberships'>
export type DbPodMembershipsInsert = TablesInsert<'pod_memberships'>
export type DbPodMembershipsUpdate = TablesUpdate<'pod_memberships'>

export type DbPodPartnerships = Tables<'pod_partnerships'>
export type DbPodPartnershipsInsert = TablesInsert<'pod_partnerships'>
export type DbPodPartnershipsUpdate = TablesUpdate<'pod_partnerships'>

export type DbPodRatings = Tables<'pod_ratings'>
export type DbPodRatingsInsert = TablesInsert<'pod_ratings'>
export type DbPodRatingsUpdate = TablesUpdate<'pod_ratings'>

export type DbPodSettings = Tables<'pod_settings'>
export type DbPodSettingsInsert = TablesInsert<'pod_settings'>
export type DbPodSettingsUpdate = TablesUpdate<'pod_settings'>

export type DbPodThemes = Tables<'pod_themes'>
export type DbPodThemesInsert = TablesInsert<'pod_themes'>
export type DbPodThemesUpdate = TablesUpdate<'pod_themes'>

export type DbProfiles = Tables<'profiles'>
export type DbProfilesInsert = TablesInsert<'profiles'>
export type DbProfilesUpdate = TablesUpdate<'profiles'>

export type DbProgressQuestionResponses = Tables<'progress_question_responses'>
export type DbProgressQuestionResponsesInsert = TablesInsert<'progress_question_responses'>
export type DbProgressQuestionResponsesUpdate = TablesUpdate<'progress_question_responses'>

export type DbProgressSessions = Tables<'progress_sessions'>
export type DbProgressSessionsInsert = TablesInsert<'progress_sessions'>
export type DbProgressSessionsUpdate = TablesUpdate<'progress_sessions'>

export type DbPublicFigures = Tables<'public_figures'>
export type DbPublicFiguresInsert = TablesInsert<'public_figures'>
export type DbPublicFiguresUpdate = TablesUpdate<'public_figures'>

export type DbQuestionAnalytics = Tables<'question_analytics'>
export type DbQuestionAnalyticsInsert = TablesInsert<'question_analytics'>
export type DbQuestionAnalyticsUpdate = TablesUpdate<'question_analytics'>

export type DbQuestionFeedback = Tables<'question_feedback'>
export type DbQuestionFeedbackInsert = TablesInsert<'question_feedback'>
export type DbQuestionFeedbackUpdate = TablesUpdate<'question_feedback'>

export type DbQuestionSkills = Tables<'question_skills'>
export type DbQuestionSkillsInsert = TablesInsert<'question_skills'>
export type DbQuestionSkillsUpdate = TablesUpdate<'question_skills'>

export type DbQuestionSourceLinks = Tables<'question_source_links'>
export type DbQuestionSourceLinksInsert = TablesInsert<'question_source_links'>
export type DbQuestionSourceLinksUpdate = TablesUpdate<'question_source_links'>

export type DbQuestionTopics = Tables<'question_topics'>
export type DbQuestionTopicsInsert = TablesInsert<'question_topics'>
export type DbQuestionTopicsUpdate = TablesUpdate<'question_topics'>

export type DbQuestions = Tables<'questions'>
export type DbQuestionsInsert = TablesInsert<'questions'>
export type DbQuestionsUpdate = TablesUpdate<'questions'>

export type DbQuestionsTest = Tables<'questions_test'>
export type DbQuestionsTestInsert = TablesInsert<'questions_test'>
export type DbQuestionsTestUpdate = TablesUpdate<'questions_test'>

export type DbScheduledContentJobs = Tables<'scheduled_content_jobs'>
export type DbScheduledContentJobsInsert = TablesInsert<'scheduled_content_jobs'>
export type DbScheduledContentJobsUpdate = TablesUpdate<'scheduled_content_jobs'>

export type DbShareableGiftLinks = Tables<'shareable_gift_links'>
export type DbShareableGiftLinksInsert = TablesInsert<'shareable_gift_links'>
export type DbShareableGiftLinksUpdate = TablesUpdate<'shareable_gift_links'>

export type DbShareableLinkClaims = Tables<'shareable_link_claims'>
export type DbShareableLinkClaimsInsert = TablesInsert<'shareable_link_claims'>
export type DbShareableLinkClaimsUpdate = TablesUpdate<'shareable_link_claims'>

export type DbSharedCollectionAccess = Tables<'shared_collection_access'>
export type DbSharedCollectionAccessInsert = TablesInsert<'shared_collection_access'>
export type DbSharedCollectionAccessUpdate = TablesUpdate<'shared_collection_access'>

export type DbSkillAssessmentCriteria = Tables<'skill_assessment_criteria'>
export type DbSkillAssessmentCriteriaInsert = TablesInsert<'skill_assessment_criteria'>
export type DbSkillAssessmentCriteriaUpdate = TablesUpdate<'skill_assessment_criteria'>

export type DbSkillBadges = Tables<'skill_badges'>
export type DbSkillBadgesInsert = TablesInsert<'skill_badges'>
export type DbSkillBadgesUpdate = TablesUpdate<'skill_badges'>

export type DbSkillCategories = Tables<'skill_categories'>
export type DbSkillCategoriesInsert = TablesInsert<'skill_categories'>
export type DbSkillCategoriesUpdate = TablesUpdate<'skill_categories'>

export type DbSkillLearningObjectives = Tables<'skill_learning_objectives'>
export type DbSkillLearningObjectivesInsert = TablesInsert<'skill_learning_objectives'>
export type DbSkillLearningObjectivesUpdate = TablesUpdate<'skill_learning_objectives'>

export type DbSkillMasteryTracking = Tables<'skill_mastery_tracking'>
export type DbSkillMasteryTrackingInsert = TablesInsert<'skill_mastery_tracking'>
export type DbSkillMasteryTrackingUpdate = TablesUpdate<'skill_mastery_tracking'>

export type DbSkillPracticeRecommendations = Tables<'skill_practice_recommendations'>
export type DbSkillPracticeRecommendationsInsert = TablesInsert<'skill_practice_recommendations'>
export type DbSkillPracticeRecommendationsUpdate = TablesUpdate<'skill_practice_recommendations'>

export type DbSkillPrerequisites = Tables<'skill_prerequisites'>
export type DbSkillPrerequisitesInsert = TablesInsert<'skill_prerequisites'>
export type DbSkillPrerequisitesUpdate = TablesUpdate<'skill_prerequisites'>

export type DbSkillProgressionPathways = Tables<'skill_progression_pathways'>
export type DbSkillProgressionPathwaysInsert = TablesInsert<'skill_progression_pathways'>
export type DbSkillProgressionPathwaysUpdate = TablesUpdate<'skill_progression_pathways'>

export type DbSkillRelationships = Tables<'skill_relationships'>
export type DbSkillRelationshipsInsert = TablesInsert<'skill_relationships'>
export type DbSkillRelationshipsUpdate = TablesUpdate<'skill_relationships'>

export type DbSkills = Tables<'skills'>
export type DbSkillsInsert = TablesInsert<'skills'>
export type DbSkillsUpdate = TablesUpdate<'skills'>

export type DbSourceCredibilityIndicators = Tables<'source_credibility_indicators'>
export type DbSourceCredibilityIndicatorsInsert = TablesInsert<'source_credibility_indicators'>
export type DbSourceCredibilityIndicatorsUpdate = TablesUpdate<'source_credibility_indicators'>

export type DbSourceFetchQueue = Tables<'source_fetch_queue'>
export type DbSourceFetchQueueInsert = TablesInsert<'source_fetch_queue'>
export type DbSourceFetchQueueUpdate = TablesUpdate<'source_fetch_queue'>

export type DbSourceMetadata = Tables<'source_metadata'>
export type DbSourceMetadataInsert = TablesInsert<'source_metadata'>
export type DbSourceMetadataUpdate = TablesUpdate<'source_metadata'>

export type DbSpacedRepetitionSchedule = Tables<'spaced_repetition_schedule'>
export type DbSpacedRepetitionScheduleInsert = TablesInsert<'spaced_repetition_schedule'>
export type DbSpacedRepetitionScheduleUpdate = TablesUpdate<'spaced_repetition_schedule'>

export type DbSubscriptionTierLimits = Tables<'subscription_tier_limits'>
export type DbSubscriptionTierLimitsInsert = TablesInsert<'subscription_tier_limits'>
export type DbSubscriptionTierLimitsUpdate = TablesUpdate<'subscription_tier_limits'>

export type DbSurveyAnswers = Tables<'survey_answers'>
export type DbSurveyAnswersInsert = TablesInsert<'survey_answers'>
export type DbSurveyAnswersUpdate = TablesUpdate<'survey_answers'>

export type DbSurveyLearningGoals = Tables<'survey_learning_goals'>
export type DbSurveyLearningGoalsInsert = TablesInsert<'survey_learning_goals'>
export type DbSurveyLearningGoalsUpdate = TablesUpdate<'survey_learning_goals'>

export type DbSurveyQuestions = Tables<'survey_questions'>
export type DbSurveyQuestionsInsert = TablesInsert<'survey_questions'>
export type DbSurveyQuestionsUpdate = TablesUpdate<'survey_questions'>

export type DbSurveyRecommendations = Tables<'survey_recommendations'>
export type DbSurveyRecommendationsInsert = TablesInsert<'survey_recommendations'>
export type DbSurveyRecommendationsUpdate = TablesUpdate<'survey_recommendations'>

export type DbSurveyResponses = Tables<'survey_responses'>
export type DbSurveyResponsesInsert = TablesInsert<'survey_responses'>
export type DbSurveyResponsesUpdate = TablesUpdate<'survey_responses'>

export type DbSurveys = Tables<'surveys'>
export type DbSurveysInsert = TablesInsert<'surveys'>
export type DbSurveysUpdate = TablesUpdate<'surveys'>

export type DbSystemAlerts = Tables<'system_alerts'>
export type DbSystemAlertsInsert = TablesInsert<'system_alerts'>
export type DbSystemAlertsUpdate = TablesUpdate<'system_alerts'>

export type DbTranslationJobs = Tables<'translation_jobs'>
export type DbTranslationJobsInsert = TablesInsert<'translation_jobs'>
export type DbTranslationJobsUpdate = TablesUpdate<'translation_jobs'>

export type DbUserAchievements = Tables<'user_achievements'>
export type DbUserAchievementsInsert = TablesInsert<'user_achievements'>
export type DbUserAchievementsUpdate = TablesUpdate<'user_achievements'>

export type DbUserActiveBoosts = Tables<'user_active_boosts'>
export type DbUserActiveBoostsInsert = TablesInsert<'user_active_boosts'>
export type DbUserActiveBoostsUpdate = TablesUpdate<'user_active_boosts'>

export type DbUserAssessmentAttempts = Tables<'user_assessment_attempts'>
export type DbUserAssessmentAttemptsInsert = TablesInsert<'user_assessment_attempts'>
export type DbUserAssessmentAttemptsUpdate = TablesUpdate<'user_assessment_attempts'>

export type DbUserAssessments = Tables<'user_assessments'>
export type DbUserAssessmentsInsert = TablesInsert<'user_assessments'>
export type DbUserAssessmentsUpdate = TablesUpdate<'user_assessments'>

export type DbUserBadges = Tables<'user_badges'>
export type DbUserBadgesInsert = TablesInsert<'user_badges'>
export type DbUserBadgesUpdate = TablesUpdate<'user_badges'>

export type DbUserBoostInventory = Tables<'user_boost_inventory'>
export type DbUserBoostInventoryInsert = TablesInsert<'user_boost_inventory'>
export type DbUserBoostInventoryUpdate = TablesUpdate<'user_boost_inventory'>

export type DbUserCategoryPreferences = Tables<'user_category_preferences'>
export type DbUserCategoryPreferencesInsert = TablesInsert<'user_category_preferences'>
export type DbUserCategoryPreferencesUpdate = TablesUpdate<'user_category_preferences'>

export type DbUserCategorySkills = Tables<'user_category_skills'>
export type DbUserCategorySkillsInsert = TablesInsert<'user_category_skills'>
export type DbUserCategorySkillsUpdate = TablesUpdate<'user_category_skills'>

export type DbUserCustomDecks = Tables<'user_custom_decks'>
export type DbUserCustomDecksInsert = TablesInsert<'user_custom_decks'>
export type DbUserCustomDecksUpdate = TablesUpdate<'user_custom_decks'>

export type DbUserDeckContent = Tables<'user_deck_content'>
export type DbUserDeckContentInsert = TablesInsert<'user_deck_content'>
export type DbUserDeckContentUpdate = TablesUpdate<'user_deck_content'>

export type DbUserEmailPreferences = Tables<'user_email_preferences'>
export type DbUserEmailPreferencesInsert = TablesInsert<'user_email_preferences'>
export type DbUserEmailPreferencesUpdate = TablesUpdate<'user_email_preferences'>

export type DbUserFeatureUsage = Tables<'user_feature_usage'>
export type DbUserFeatureUsageInsert = TablesInsert<'user_feature_usage'>
export type DbUserFeatureUsageUpdate = TablesUpdate<'user_feature_usage'>

export type DbUserFeedback = Tables<'user_feedback'>
export type DbUserFeedbackInsert = TablesInsert<'user_feedback'>
export type DbUserFeedbackUpdate = TablesUpdate<'user_feedback'>

export type DbUserLearningGoals = Tables<'user_learning_goals'>
export type DbUserLearningGoalsInsert = TablesInsert<'user_learning_goals'>
export type DbUserLearningGoalsUpdate = TablesUpdate<'user_learning_goals'>

export type DbUserLearningInsights = Tables<'user_learning_insights'>
export type DbUserLearningInsightsInsert = TablesInsert<'user_learning_insights'>
export type DbUserLearningInsightsUpdate = TablesUpdate<'user_learning_insights'>

export type DbUserOnboardingState = Tables<'user_onboarding_state'>
export type DbUserOnboardingStateInsert = TablesInsert<'user_onboarding_state'>
export type DbUserOnboardingStateUpdate = TablesUpdate<'user_onboarding_state'>

export type DbUserPlatformPreferences = Tables<'user_platform_preferences'>
export type DbUserPlatformPreferencesInsert = TablesInsert<'user_platform_preferences'>
export type DbUserPlatformPreferencesUpdate = TablesUpdate<'user_platform_preferences'>

export type DbUserProgress = Tables<'user_progress'>
export type DbUserProgressInsert = TablesInsert<'user_progress'>
export type DbUserProgressUpdate = TablesUpdate<'user_progress'>

export type DbUserProgressHistory = Tables<'user_progress_history'>
export type DbUserProgressHistoryInsert = TablesInsert<'user_progress_history'>
export type DbUserProgressHistoryUpdate = TablesUpdate<'user_progress_history'>

export type DbUserQuestionMemory = Tables<'user_question_memory'>
export type DbUserQuestionMemoryInsert = TablesInsert<'user_question_memory'>
export type DbUserQuestionMemoryUpdate = TablesUpdate<'user_question_memory'>

export type DbUserQuestionResponses = Tables<'user_question_responses'>
export type DbUserQuestionResponsesInsert = TablesInsert<'user_question_responses'>
export type DbUserQuestionResponsesUpdate = TablesUpdate<'user_question_responses'>

export type DbUserQuizAnalytics = Tables<'user_quiz_analytics'>
export type DbUserQuizAnalyticsInsert = TablesInsert<'user_quiz_analytics'>
export type DbUserQuizAnalyticsUpdate = TablesUpdate<'user_quiz_analytics'>

export type DbUserQuizAttempts = Tables<'user_quiz_attempts'>
export type DbUserQuizAttemptsInsert = TablesInsert<'user_quiz_attempts'>
export type DbUserQuizAttemptsUpdate = TablesUpdate<'user_quiz_attempts'>

export type DbUserRoles = Tables<'user_roles'>
export type DbUserRolesInsert = TablesInsert<'user_roles'>
export type DbUserRolesUpdate = TablesUpdate<'user_roles'>

export type DbUserSkillPreferences = Tables<'user_skill_preferences'>
export type DbUserSkillPreferencesInsert = TablesInsert<'user_skill_preferences'>
export type DbUserSkillPreferencesUpdate = TablesUpdate<'user_skill_preferences'>

export type DbUserSkillProgress = Tables<'user_skill_progress'>
export type DbUserSkillProgressInsert = TablesInsert<'user_skill_progress'>
export type DbUserSkillProgressUpdate = TablesUpdate<'user_skill_progress'>

export type DbUserStreakHistory = Tables<'user_streak_history'>
export type DbUserStreakHistoryInsert = TablesInsert<'user_streak_history'>
export type DbUserStreakHistoryUpdate = TablesUpdate<'user_streak_history'>

export type DbUserSubscriptions = Tables<'user_subscriptions'>
export type DbUserSubscriptionsInsert = TablesInsert<'user_subscriptions'>
export type DbUserSubscriptionsUpdate = TablesUpdate<'user_subscriptions'>

export type DbUserSurveyCompletions = Tables<'user_survey_completions'>
export type DbUserSurveyCompletionsInsert = TablesInsert<'user_survey_completions'>
export type DbUserSurveyCompletionsUpdate = TablesUpdate<'user_survey_completions'>

// =============================================================================
// CONVENIENT ENUM TYPE EXPORTS
// =============================================================================

export type DbCourseRole = Database['public']['Enums']['course_role']
export type DbEnrollmentStatus = Database['public']['Enums']['enrollment_status']
export type DbSchoolUserRole = Database['public']['Enums']['school_user_role']
export type DbSyncStatus = Database['public']['Enums']['sync_status']
export type DbSyncType = Database['public']['Enums']['sync_type']

// =============================================================================
// CONVENIENT FUNCTION TYPE EXPORTS
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

export type DbUserIsInRoomArgs = Database['public']['Functions']['user_is_in_room']['Args']
export type DbUserIsInRoomReturns = Database['public']['Functions']['user_is_in_room']['Returns']

export type DbValidateFunctionTableTypesArgs = Database['public']['Functions']['validate_function_table_types']['Args']
export type DbValidateFunctionTableTypesReturns = Database['public']['Functions']['validate_function_table_types']['Returns']

export type DbValidateMigrationSafetyArgs = Database['public']['Functions']['validate_migration_safety']['Args']
export type DbValidateMigrationSafetyReturns = Database['public']['Functions']['validate_migration_safety']['Returns']

export type DbValidateMultiplayerHostAssignmentsArgs = Database['public']['Functions']['validate_multiplayer_host_assignments']['Args']
export type DbValidateMultiplayerHostAssignmentsReturns = Database['public']['Functions']['validate_multiplayer_host_assignments']['Returns']

export type DbValidateMultiplayerSchemaArgs = Database['public']['Functions']['validate_multiplayer_schema']['Args']
export type DbValidateMultiplayerSchemaReturns = Database['public']['Functions']['validate_multiplayer_schema']['Returns']

export type DbValidateMultiplayerSchemaAlignmentArgs = Database['public']['Functions']['validate_multiplayer_schema_alignment']['Args']
export type DbValidateMultiplayerSchemaAlignmentReturns = Database['public']['Functions']['validate_multiplayer_schema_alignment']['Returns']

export type DbValidateTranslationStructureArgs = Database['public']['Functions']['validate_translation_structure']['Args']
export type DbValidateTranslationStructureReturns = Database['public']['Functions']['validate_translation_structure']['Returns']


