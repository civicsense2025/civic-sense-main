import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

// Create a server-side Supabase client for auth operations
export async function getServerSession() {
  // Get cookies using the correct Next.js App Router approach
  const cookieStore = await cookies();
  
  // Get cookie string for Supabase - avoid using toString()
  const cookieString = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          cookie: cookieString,
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  return session;
} 