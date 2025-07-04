// CivicSense Business Logic Package
// Core functionality shared between web and mobile apps

// Utils exports
export * from './utils/feature-flags';
export * from './utils/debug-flags';
export * from './utils/performance';
export * from './utils/cache-debug';
export * from './utils/debug-config';

// Services exports
export * from './services/data-service';
export * from './services/progress-service';
export * from './services/skill-service';
export * from './services/bookmark-service';
export * from './services/premium-service';
export * from './services/content-filter';
export * from './services/card-service';
export * from './services/topic-service';
export * from './services/content-processor';

// Database exports

// Quiz & Game exports
export * from './quiz/quiz-repository';
export * from './multiplayer/multiplayer-service';
export * from './multiplayer/conversation-engine';
export * from './multiplayer/npc-integration';
export * from './multiplayer/npc-service';
export * from './multiplayer/enhanced-npc-service';
export * from './multiplayer/game-boosts';
export * from './multiplayer/host-manager';

// Auth exports
export * from './auth/hooks';
export * from './auth/guest-access.service';

// Integration exports
export * from './integrations/pod-quiz';
export * from './integrations/pod-quiz-server';

// Admin exports
export * from './services/admin-service';

// Re-export commonly used utilities
export { cn } from './utils';

// Export feature flags
export {
  envFeatureFlags,
  isLearningPodsEnabled,
  isMultiplayerEnabled,
  isScenariosEnabled,
  isCivicsTestEnabled,
  isQuizzesEnabled,
  isBetaFeaturesEnabled,
  getFlag
} from './utils/statsig-integration';

// Export quiz operations
export {
  topicOperations,
  questionOperations,
  quizAttemptOperations,
  questionMemoryOperations
} from './quiz/quiz-operations';

// Export database client
export {
  supabase,
  createCustomClient
} from './database/supabase-client';

// Note: Types are now exported from @civicsense/types package 