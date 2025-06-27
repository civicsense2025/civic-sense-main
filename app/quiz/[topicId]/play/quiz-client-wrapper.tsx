"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import type { QuizGameMode } from "@/lib/types/quiz"

// Dynamic imports with ssr: false (allowed in client components)
const QuizPlayClientV2 = dynamic(() => import("./client-v2"), {
  ssr: false
})

const QuizPlayClientV1 = dynamic(() => import("./client"), {
  ssr: false
})

// Common search params interface
interface BaseSearchParams {
  attempt?: string
  podId?: string
  classroomCourseId?: string
  classroomAssignmentId?: string
  cleverSectionId?: string
  mode?: string
  v?: string // Version parameter for testing
}

interface QuizClientWrapperProps {
  topicId: string
  searchParams?: BaseSearchParams
}

export default function QuizClientWrapper({ 
  topicId, 
  searchParams 
}: QuizClientWrapperProps) {
  // Simple version detection - default to V2 for new database compatibility
  const useV2 = searchParams?.v !== '1' // Default to V2, use V1 only if explicitly requested
  
  console.log(`🎮 QuizClientWrapper: Using ${useV2 ? 'V2' : 'V1'} engine for topic ${topicId}`)
  
  // Simple loading fallback without QuizLoadingScreen
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Loading quiz...</p>
      </div>
    </div>
  )

  // Valid quiz game modes for type safety
  const validModes: QuizGameMode[] = [
    'standard', 'practice', 'assessment', 'npc_battle', 
    'civics_test_quick', 'civics_test_full',
    'classic_quiz', 'speed_round', 'matching_challenge', 'debate_mode'
  ]
  
  // Safe mode conversion for V1 client
  const getValidMode = (mode?: string): QuizGameMode => {
    if (mode && validModes.includes(mode as QuizGameMode)) {
      return mode as QuizGameMode
    }
    return 'standard' // Default fallback
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {useV2 ? (
        <QuizPlayClientV2 
          topicId={topicId} 
          searchParams={{
            attempt: searchParams?.attempt,
            podId: searchParams?.podId,
            classroomCourseId: searchParams?.classroomCourseId,
            classroomAssignmentId: searchParams?.classroomAssignmentId,
            cleverSectionId: searchParams?.cleverSectionId,
            mode: getValidMode(searchParams?.mode) // Type-safe conversion for V2 too
          }}
        />
      ) : (
        <QuizPlayClientV1 
          topicId={topicId} 
          searchParams={{
            attempt: searchParams?.attempt,
            podId: searchParams?.podId,
            classroomCourseId: searchParams?.classroomCourseId,
            classroomAssignmentId: searchParams?.classroomAssignmentId,
            cleverSectionId: searchParams?.cleverSectionId,
            mode: getValidMode(searchParams?.mode) // Type-safe conversion for V1
          }}
        />
      )}
    </Suspense>
  )
} 