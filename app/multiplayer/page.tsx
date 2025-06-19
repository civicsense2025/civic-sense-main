import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { MultiplayerLobby } from '@/components/multiplayer/lobby'
import { isMultiplayerEnabled } from '@/lib/feature-flags'

export default function MultiplayerPage() {
  // Feature flag check - hide multiplayer in production
  if (!isMultiplayerEnabled()) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Use the shared header component */}
      <Header />

      {/* Main Content */}
      <main>
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[60vh] p-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">Loading multiplayer lobby...</p>
            </div>
          </div>
        }>
          <MultiplayerLobby />
        </Suspense>
      </main>
    </div>
  )
} 