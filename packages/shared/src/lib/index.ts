// CivicSense Shared Library Exports
// Only essential, working exports to prevent import errors

// Core utilities - SAFE EXPORTS
export * from './utils'

// Core database and types - SAFE EXPORTS
export * from './supabase'

// UI strings - SAFE EXPORTS
export * from './ui-strings'

// Progress storage - SAFE EXPORTS
export * from './progress-storage'

// Debug configuration
export * from './debug-config'

// Quiz data types - SAFE EXPORTS
export type { CategoryType, TopicMetadata, QuizQuestion } from './quiz-data'
export type { QuizGameMode, QuizModeConfig } from './types/quiz'
export { FULL_MODE_CONFIGS } from './types/quiz'

// Premium types - SAFE EXPORTS
export type { PremiumFeature } from './types/premium'

// Data service - SAFE EXPORTS
export { dataService } from './data-service'

// Quiz database - SAFE EXPORTS
export { enhancedQuizDatabase } from './quiz-database'

// Pending user attribution - SAFE EXPORTS
export { pendingUserAttribution } from './pending-user-attribution'

// Note: Only including modules that compile successfully
// Other exports will be added back once their dependencies are resolved 