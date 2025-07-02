import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { envFeatureFlags } from '@civicsense/shared/lib/env-feature-flags'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import MultiplayerMarketing from './marketing-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multiplayer | CivicSense',
  description: 'Challenge friends and test your civic knowledge in real-time multiplayer quizzes.',
  robots: 'noindex, nofollow',
}

// Replace isMultiplayerEnabled with direct usage
const isMultiplayerEnabled = envFeatureFlags.getFlag('multiplayer')

export default async function MultiplayerMarketingPage() {
  // Feature flag check
  if (!isMultiplayerEnabled) {
    notFound()
  }

  // Check if user is logged in and redirect to lobby
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/multiplayer/lobby')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[60vh] p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading multiplayer...</p>
          </div>
        </div>
      }>
        <MultiplayerMarketing />
      </Suspense>
    </div>
  )
} 