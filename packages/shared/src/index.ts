// CivicSense Shared Business Logic Package
// Exports all shared functionality between web and mobile apps

// Core business logic
export * from './lib'

// React hooks
export * from './hooks'

// TypeScript types
export * from './types'

// Utility functions  
export * from './utils'

// Database related (if present)
export * from './database'

// Re-export commonly used utilities for convenience
export { cn } from './lib/utils'

// Re-export common types
export type { Database } from './lib/supabase/types'

// Re-export authentication
export { createClient } from './lib/supabase/client'
export { createServerClient } from './lib/supabase/server' 