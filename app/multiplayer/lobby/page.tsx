import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { isMultiplayerEnabled } from '@/lib/feature-flags'
import { createClient } from '@/lib/supabase/server'
import { MultiplayerLobbyClient } from './lobby-client'

export default async function MultiplayerLobbyPage() {
  // Feature flag check - hide multiplayer in production
  if (!isMultiplayerEnabled()) {
    notFound()
  }

  // Check if user is logged in, redirect to marketing if not
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/multiplayer')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[60vh] p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading lobby...</p>
          </div>
        </div>
      }>
        <MultiplayerLobbyClient />
      </Suspense>
    </div>
  )
} 