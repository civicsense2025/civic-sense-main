import { Suspense } from 'react'
import MultiplayerQuizClient from './client'

// Define the correct type for params
type PageParams = {
  params: Promise<{ topicId: string }>
  searchParams: Promise<{ room?: string; player?: string }>
}

// Server Component that handles async parameter resolution
export default async function MultiplayerQuizPage({ params, searchParams }: PageParams) {
  // Resolve the params and searchParams on the server
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  console.log('🏗️ MultiplayerQuizPage - Server resolved params:', {
    topicId: resolvedParams.topicId,
    room: resolvedSearchParams.room,
    player: resolvedSearchParams.player
  })
  
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading multiplayer quiz...</p>
        </div>
      </div>
    }>
      <MultiplayerQuizClient 
        params={resolvedParams} 
        searchParams={resolvedSearchParams}
      />
    </Suspense>
  )
} 