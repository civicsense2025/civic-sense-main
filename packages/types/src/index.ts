// CivicSense Types Package
// Shared type definitions between web and mobile apps

// Core types - explicit type exports
export type { User } from './user';
export type { PlayerStatus, MultiplayerRoom, MultiplayerPlayer } from './multiplayer';
export type { Collection, CompletionCriteria } from './collections';
export type { Skill } from './skills';
export type { LessonStep } from './lesson-steps';
export type { Incentive } from './incentives';
export type { Assessment } from './assessment';
export type { AIResponse } from './ai';
export type { EnvironmentVariable } from './env';

// Localization types
export type { SupportedLanguage, TranslationStrings, UIStringPath } from './localization';

// Database types
export type { Database, Json } from './database';

// Service types
export type {
  StandardResponse,
  DataServiceConfig,
  ProgressData,
  BookmarkData,
  PremiumFeature,
  ContentFilter,
} from './services';

// Auth types
export type {
  AuthState,
  User as AuthUser,
  AuthProvider,
  AuthMethods,
  GuestSession,
} from './auth';

// UI types (shared only)
export type {
  ThemeColors,
  TypographyScale,
  SpacingScale,
  BorderRadius,
  BaseComponentProps,
  AnimationConfig,
} from './ui-shared';

// Analytics types
export type {
  AnalyticsEvent,
  UserAnalytics,
  DeviceInfo,
  ScreenView,
  PerformanceMetrics,
} from './analytics';

// API types
export type {
  ApiResponse,
  ApiError,
  ApiMeta,
  PaginatedResponse,
  ApiEndpoint,
  HttpMethod,
} from './api';

// Integration types
export type {
  PodQuizConfig,
  PodQuizResponse,
  PodQuizQuestion,
  PodQuizMetadata,
  ServerConfig,
  ServerResponse,
} from './integrations';

// Export feature flag types
export type {
  AllFeatureFlags,
  NavigationFeatureFlags,
  PremiumFeatureFlags,
  CoreFeatureFlags,
  FeatureFlagEnvironmentConfig
} from './feature-flags';

// Export quiz types
export type {
  TopicMetadata,
  QuestionType,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  QuizAttempt,
  QuizAnswer,
  QuizProgress,
  QuizStats
} from './quiz';

export { getQuestionOptions, calculateQuizScore } from './quiz';

// Note: Platform-specific types should be defined in their respective apps

// Re-export all types
export * from './database'
export * from './quiz'

// Export specific types that should be available at the root level if not already covered by wildcard exports can be added here in future, but avoid duplications.

export * from './translations';
export * from './ui-strings';
export * from './subscriptions';
