// CivicSense Shared Business Logic Package
// Exports all shared functionality between web and mobile apps

// Core business logic - only safe exports
export * from './lib/utils'
export * from './lib/ui-strings'
export * from './lib/progress-storage'
export * from './lib/debug-config'

// Types - only working ones
export type { CategoryType, TopicMetadata, QuizQuestion } from './lib/quiz-data'
export type { QuizGameMode, QuizModeConfig } from './lib/types/quiz'
export type { PremiumFeature } from './lib/types/premium'

// Data service - if it exists and works
export { dataService } from './lib/data-service'

// Re-export commonly used utilities for convenience
export { cn } from './lib/utils'

// Re-export authentication clients - only if they work
export { createClient } from './lib/supabase/client'
// Note: server client excluded due to Next.js dependency

// Re-export database types - only if they exist
export type { Database } from './lib/database.types'