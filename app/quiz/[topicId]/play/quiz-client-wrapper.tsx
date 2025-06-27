"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { QuizErrorBoundary } from "@/components/analytics-error-boundary"

/**
 * QuizClientWrapper - Loads the V2 quiz engine
 * 
 * The V2 engine handles all quiz modes with different settings:
 * - Standard: Classic quiz experience
 * - Practice: Solo learning with hints and explanations
 * - Timed: Speed challenge with time pressure
 */

// Dynamic import for the V2 quiz client
const QuizPlayClientV2 = dynamic(() => import("./client-v2").catch(error => {
  console.error('❌ Failed to load quiz client:', error)
  throw error
}), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Loading quiz...</p>
      </div>
    </div>
  )
})

// Search params interface
interface SearchParams {
  attempt?: string
  podId?: string
  classroomCourseId?: string
  classroomAssignmentId?: string
  cleverSectionId?: string
  mode?: string
}

interface QuizClientWrapperProps {
  topicId: string
  searchParams?: SearchParams
}

export default function QuizClientWrapper({ 
  topicId, 
  searchParams 
}: QuizClientWrapperProps) {
  console.log(`🎮 Loading V2 quiz engine for topic: ${topicId}, mode: ${searchParams?.mode || 'standard'}`)
  
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Loading quiz...</p>
      </div>
    </div>
  )

  return (
    <Suspense fallback={<LoadingFallback />}>
      <QuizErrorBoundary>
        <QuizPlayClientV2 
          topicId={topicId} 
          topic={null} // Will be loaded by the client
          searchParams={searchParams}
          userId={undefined} // Will be determined by the client
          guestToken={undefined} // Will be determined by the client
        />
      </QuizErrorBoundary>
    </Suspense>
  )
} 