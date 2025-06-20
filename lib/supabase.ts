// Re-export the singleton client and helpers from the proper location
export { supabase, authHelpers, createClient } from './supabase/client'

// Re-export types for convenience
export type { Database } from './database.types'
