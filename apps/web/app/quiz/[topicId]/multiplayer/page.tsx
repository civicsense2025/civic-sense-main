import { Suspense } from 'react'
import { Metadata } from 'next'
import MultiplayerQuizClient from './client'

export const metadata: Metadata = {
  title: 'Multiplayer Quiz | CivicSense',
  description: 'Join a multiplayer civic knowledge quiz and compete with friends',
}

// Development-only logging utility
const devLog = (component: string, action: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎮 [${component}] ${action}`, data ? data : '')
  }
}

interface PageProps {
  params: Promise<{ topicId: string }>
  searchParams: Promise<{ 
    room?: string
    mode?: string
    player?: string 
  }>
}

export default async function MultiplayerQuizPage({
  params,
  searchParams,
}: PageProps) {
  // Await both params and searchParams (Next.js 15+ behavior)
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  devLog('MultiplayerQuizPage', 'Page loaded', { 
    topicId: resolvedParams.topicId, 
    room: resolvedSearchParams.room, 
    mode: resolvedSearchParams.mode,
    player: resolvedSearchParams.player,
    rawSearchParams: searchParams
  })

  // Extract the actual values to ensure they're simple strings
  const cleanSearchParams = {
    room: resolvedSearchParams.room || undefined,
    mode: resolvedSearchParams.mode || undefined,
    player: resolvedSearchParams.player || undefined
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading multiplayer quiz...</p>
        </div>
      </div>
    }>
      <MultiplayerQuizClient
        params={{ topicId: resolvedParams.topicId }}
        searchParams={cleanSearchParams}
      />
    </Suspense>
  )
} 