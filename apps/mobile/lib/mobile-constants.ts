/**
 * Mobile-Specific Constants for CivicSense Mobile App
 * 
 * This file contains mobile-specific settings, game configurations,
 * and other constants that are NOT auto-generated from the database.
 * 
 * Safe to edit - this file is NOT overwritten by sync scripts.
 */

// =============================================================================
// MOBILE OPTIMIZATION CONSTANTS
// =============================================================================

export const MOBILE_CONSTANTS = {
  // Offline sync priorities
  SYNC_PRIORITIES: {
    HIGH: ['user_progress', 'user_quiz_attempts', 'categories'],
    MEDIUM: ['questions', 'question_topics', 'user_assessments'],
    LOW: ['events', 'public_figures', 'organizations'],
  },
  
  // Cache durations (in milliseconds)
  CACHE_DURATIONS: {
    CATEGORIES: 24 * 60 * 60 * 1000, // 24 hours
    TOPICS: 24 * 60 * 60 * 1000, // 24 hours
    QUESTIONS: 24 * 60 * 60 * 1000, // 24 hours
    USER_PROGRESS: 5 * 60 * 1000, // 5 minutes
    MULTIPLAYER_ROOMS: 60 * 1000, // 1 minute
  },
  
  // Batch sizes for mobile optimization
  BATCH_SIZES: {
    QUESTIONS: 25,
    QUIZ_ATTEMPTS: 50,
    CATEGORIES: 20,
    MULTIPLAYER_MESSAGES: 100,
  },
  
  // Mobile-specific limits
  LIMITS: {
    MAX_OFFLINE_ATTEMPTS: 100,
    MAX_CACHED_QUESTIONS: 500,
    MAX_MULTIPLAYER_PLAYERS: 8,
    MAX_CHAT_MESSAGES: 200,
  },
} as const;

// =============================================================================
// GUEST USER LIMITS (matching web version restrictions)
// =============================================================================

export const GUEST_LIMITS = {
  // Daily quiz attempt limits
  DAILY_QUIZ_ATTEMPTS: 3,               // Maximum quiz attempts per day for guests
  DAILY_ASSESSMENT_ATTEMPTS: 1,         // Maximum assessment attempts per day
  DAILY_CIVICS_TEST_ATTEMPTS: 1,        // Maximum civics test attempts per day
  
  // Session limits
  MAX_SESSION_DURATION_MINUTES: 60,     // Maximum session length in minutes
  MAX_QUESTIONS_PER_SESSION: 15,        // Maximum questions per quiz session
  
  // Feature restrictions
  MAX_PROGRESS_STORAGE_DAYS: 7,         // How long to store guest progress
  MAX_SAVED_ITEMS: 0,                   // Guests cannot save items
  MAX_BOOKMARKS: 0,                     // Guests cannot bookmark content
  
  // Content access limits
  RESTRICTED_GAME_MODES: [              // Game modes guests cannot access
    'multiplayer_ranked',
    'tournament', 
    'team_vs_team',
    'debate_mode'
  ],
  
  // Analytics and insights
  ANALYTICS_ACCESS: false,              // Guests cannot access detailed analytics
  LEARNING_INSIGHTS_ACCESS: false,     // Guests cannot access AI insights
  EXPORT_DATA_ACCESS: false,           // Guests cannot export their data
  
  // Rate limiting
  REQUESTS_PER_MINUTE: 60,              // API rate limit for guests
  QUIZ_START_COOLDOWN_SECONDS: 30,     // Cooldown between quiz starts
  
  // Warning thresholds
  WARNING_AT_ATTEMPT: 2,               // Show signup prompt at 2nd attempt
  HARD_LIMIT_MESSAGE: "You've reached the daily limit for guest users. Sign up for unlimited access!",
  SOFT_LIMIT_MESSAGE: "You have 1 quiz remaining today. Sign up for unlimited access!",
} as const;

// =============================================================================
// GUEST LIMIT ENFORCEMENT TYPES
// =============================================================================

export interface GuestUsageLimits {
  dailyQuizAttempts: number;
  dailyAssessmentAttempts: number;
  dailyCivicsTestAttempts: number;
  currentSessionDuration: number;
  questionsInCurrentSession: number;
  restrictedGameModes: readonly string[];
  canSaveProgress: boolean;
  canBookmarkContent: boolean;
  canAccessAnalytics: boolean;
  canExportData: boolean;
  warningThreshold: number;
  isAtLimit: boolean;
  nextResetTime: Date;
}

export interface GuestLimitCheckResult {
  allowed: boolean;
  reason?: string;
  attemptsRemaining?: number;
  upgradeMessage?: string;
  resetTime?: Date;
}

// =============================================================================
// GAME SETTINGS & CONFIGURATION
// =============================================================================

export const GAME_SETTINGS = {
  DEFAULT_QUESTIONS_PER_DECK: 15,
  MULTIPLAYER_MAX_PLAYERS: 6,
  SINGLE_PLAYER_TIME_LIMIT: 30, // seconds per question
  MULTIPLAYER_TIME_LIMIT: 20, // seconds per question
  HINT_COOLDOWN: 60, // seconds
  BOOST_COOLDOWN: 300, // 5 minutes
  
  // Difficulty settings
  DIFFICULTY_LEVELS: {
    EASY: 'easy',
    MEDIUM: 'medium', 
    HARD: 'hard',
    EXPERT: 'expert',
  },
  
  // Game modes
  GAME_MODES: {
    STANDARD: 'standard',
    SPEED_ROUND: 'speed_round',
    SURVIVAL: 'survival',
    PRACTICE: 'practice',
  },
} as const;

// =============================================================================
// SCORING SYSTEM
// =============================================================================

export const SCORING = {
  CORRECT_ANSWER_BASE: 100,
  DIFFICULTY_MULTIPLIERS: {
    easy: 1.0,
    medium: 1.2,
    hard: 1.5,
    expert: 2.0,
  },
  STREAK_MULTIPLIER: 1.1,
  PERFECT_SCORE_BONUS: 500,
  TIME_BONUS_THRESHOLD: 10, // seconds
  TIME_BONUS_MULTIPLIER: 1.05,
  
  // Multiplayer bonuses
  MULTIPLAYER_BONUSES: {
    FIRST_PLACE: 200,
    SECOND_PLACE: 100,
    THIRD_PLACE: 50,
    PARTICIPATION: 25,
  },
} as const;

// =============================================================================
// GAME TABLE GROUPS (for organization and caching)
// =============================================================================

export const GAME_TABLE_GROUPS = {
  CORE_GAME: [
    'categories',
    'question_topics', 
    'questions',
    'assessment_questions',
  ],
  USER_PROGRESS: [
    'user_progress',
    'user_quiz_attempts',
    'user_question_responses',
    'user_assessments',
    'user_skill_progress',
  ],
  MULTIPLAYER: [
    'multiplayer_rooms',
    'multiplayer_room_players',
    'multiplayer_quiz_attempts',
    'multiplayer_question_responses',
    'multiplayer_chat_messages',
    'multiplayer_game_events',
    'multiplayer_npc_players',
  ],
  ANALYTICS: [
    'civics_test_analytics',
    'user_quiz_analytics',
    'question_analytics',
    'assessment_analytics',
  ],
  SOCIAL: [
    'learning_pods',
    'pod_memberships',
    'friend_requests',
    'shared_collection_access',
  ],
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
} as const;

// =============================================================================
// COMMON QUERY PATTERNS
// =============================================================================

export const QUERY_PATTERNS = {
  // Common select patterns
  SELECT_ACTIVE_CATEGORIES: `SELECT * FROM categories WHERE is_active = true ORDER BY display_order`,
  SELECT_USER_PROGRESS: `SELECT * FROM user_progress WHERE user_id = $1`,
  SELECT_RECENT_QUIZ_ATTEMPTS: `SELECT * FROM user_quiz_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
  
  // Multiplayer queries
  SELECT_ACTIVE_ROOMS: `SELECT * FROM multiplayer_rooms WHERE status = 'waiting' AND expires_at > NOW()`,
  SELECT_ROOM_PLAYERS: `SELECT * FROM multiplayer_room_players WHERE room_id = $1 ORDER BY join_order`,
  
  // Assessment queries
  SELECT_ASSESSMENT_QUESTIONS: `SELECT * FROM assessment_questions WHERE category = $1 AND is_active = true ORDER BY difficulty`,
  
  // Skills queries
  SELECT_USER_SKILLS: `SELECT * FROM user_skill_progress WHERE user_id = $1`,
} as const;

// =============================================================================
// UI/UX CONSTANTS
// =============================================================================

export const UI_CONSTANTS = {
  // Animation durations (in milliseconds)
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000,
  },
  
  // Loading states
  LOADING_DELAYS: {
    MINIMUM_LOADING_TIME: 500, // Prevent flash of loading
    SKELETON_TIMEOUT: 5000, // Show error after 5s
  },
  
  // Toast/notification durations
  NOTIFICATIONS: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },
  
  // Haptic feedback patterns
  HAPTICS: {
    LIGHT: 'light',
    MEDIUM: 'medium',
    HEAVY: 'heavy',
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
  },
} as const;

// =============================================================================
// PLATFORM-SPECIFIC CONSTANTS
// =============================================================================

export const PLATFORM_CONSTANTS = {
  // iOS specific
  IOS: {
    MIN_VERSION: '13.0',
    SAFE_AREA_INSETS: {
      TOP: 44,
      BOTTOM: 34,
    },
  },
  
  // Android specific
  ANDROID: {
    MIN_SDK: 21,
    TARGET_SDK: 34,
  },
  
  // Screen sizes
  SCREEN_BREAKPOINTS: {
    SMALL: 375, // iPhone SE
    MEDIUM: 414, // iPhone 11 Pro Max
    LARGE: 768, // iPad Mini
    EXTRA_LARGE: 1024, // iPad
  },
} as const;

// =============================================================================
// EXPORT ALL MOBILE CONSTANTS
// =============================================================================

export default {
  MOBILE_CONSTANTS,
  GAME_SETTINGS,
  SCORING,
  GAME_TABLE_GROUPS,
  REALTIME_CHANNELS,
  QUERY_PATTERNS,
  UI_CONSTANTS,
  PLATFORM_CONSTANTS,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type MobileConstants = typeof MOBILE_CONSTANTS;
export type GameSettings = typeof GAME_SETTINGS;
export type ScoringSystem = typeof SCORING;
export type GameTableGroups = typeof GAME_TABLE_GROUPS;
export type RealtimeChannels = typeof REALTIME_CHANNELS;
export type QueryPatterns = typeof QUERY_PATTERNS;
export type UIConstants = typeof UI_CONSTANTS;
export type PlatformConstants = typeof PLATFORM_CONSTANTS; 