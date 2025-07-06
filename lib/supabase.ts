// Re-export the singleton client and helpers from the proper location
// Re-export the singleton client and helpers for backwards compatibility
export { supabase, authHelpers } from './supabase/client'

// Don't export createClient to discourage direct usage
// Components should import { supabase } directly instead of calling createClient()

// Re-export types for convenience
export type { Database } from './database.types'
