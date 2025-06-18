import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Gamepad2, Brain } from 'lucide-react'
import Link from 'next/link'
import { MultiplayerLobby } from '@/components/multiplayer/lobby'

export default function MultiplayerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back Navigation */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              
              <div className="hidden sm:block h-6 w-px bg-slate-300 dark:bg-slate-600" />
              
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Multiplayer</h1>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Learn Together</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span>AI Companions</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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