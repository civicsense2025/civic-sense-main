// CivicSense Shared Business Logic Package
// Exports all shared functionality between web and mobile apps

// Core business logic
export * from './lib'

// React hooks
export * from './hooks'

// Utility functions  
export * from './utils'


// Re-export commonly used utilities for convenience
export { cn } from './lib/utils'

// Re-export authentication clients
export { createClient } from './lib/supabase/client'
export { createClient as createServerClient } from './lib/supabase/server' 
// Re-export database types
export type { Database } from './lib/types/supabase'