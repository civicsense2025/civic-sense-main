import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "example-anon-key"

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
