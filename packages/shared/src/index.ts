// CivicSense Shared Business Logic Package
// Exports all shared functionality between web and mobile apps

// Safe core utilities
export { cn } from './lib/utils'

// Safe type exports
export type { Database } from './lib/database.types'

// Working client exports
export { createClient } from './lib/supabase/client'

// Quiz database exports
export { enhancedQuizDatabase } from './lib/quiz-database'

// Essential hook exports
export { useTranslation } from './hooks/useTranslation'
export { useTopicTitle } from './hooks/useTopicTitle'
export { useIsMobile } from './hooks/useIsMobile'

// Database types export
export type { Json } from './lib/database.types'

// Additional exports from lib
export * from './lib'

// Essential exports only
export { supabase } from './lib/supabase'
export { authHelpers } from './lib/supabase/client'
export { dataService } from './lib/data-service'
export { debug } from './lib/debug-config'
export { bookmarkOperations } from './lib/bookmarks'