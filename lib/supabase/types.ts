import { Database } from '@/types/supabase'

declare module '@supabase/ssr' {
  export interface SupabaseClient extends ReturnType<typeof createClient<Database>> {}
} 