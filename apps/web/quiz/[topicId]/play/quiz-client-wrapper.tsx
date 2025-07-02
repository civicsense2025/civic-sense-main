"use client"

import dynamic from "next/dynamic"
import { Suspense, useState, useEffect } from "react"
import { QuizErrorBoundary } from "@civicsense/ui-web/components/analytics-error-boundary"

/**
 * QuizClientWrapper - Loads the V2 quiz engine
 * 
 * The V2 engine handles all quiz modes with different settings:
 * - Standard: Classic quiz experience
 * - Practice: Solo learning with hints and explanations
 * - Timed: Speed challenge with time pressure
 */

// Dynamic import for the V2 quiz client with enhanced error handling
const QuizPlayClientV2 = dynamic(() => {
  console.log('🔄 QuizClientWrapper: Starting dynamic import of V2 client...')
  return import("./client-v2").then(module => {
    console.log('✅ QuizClientWrapper: V2 client imported successfully')
    return module
  }).catch(error => {
    console.error('❌ QuizClientWrapper: Failed to load V2 client:', error)
    console.error('Import error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    throw error
  })
}, {
  ssr: false,
  loading: () => {
    console.log('🔄 QuizClientWrapper: Showing loading component for V2 client...')
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading quiz...</p>
          <p className="text-sm text-muted-foreground mt-2">Initializing V2 Quiz Engine</p>
        </div>
      </div>
    )
  }
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
  topic?: any
  userId?: string
  guestToken?: string
}

export default function QuizClientWrapper(props: QuizClientWrapperProps) {
  console.log('🎯 QuizClientWrapper: Starting component load...', {
    topicId: props.topicId,
    hasInitialTopic: !!props.topic,
    topicTitle: props.topic?.topic_title,
    searchParams: props.searchParams,
    userId: props.userId ? 'provided' : 'none',
    guestToken: props.guestToken ? 'provided' : 'none'
  })
  
  const [QuizClientV2, setQuizClientV2] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 QuizClientWrapper: Starting dynamic import...')
    
    async function loadQuizClient() {
      try {
        console.log('📦 QuizClientWrapper: Importing V2 client...')
        setError(null)
        
        const clientModule = await import('./client-v2')
        console.log('✅ QuizClientWrapper: V2 client imported successfully')
        console.log('📊 QuizClientWrapper: Module contents:', Object.keys(clientModule))
        
        if (clientModule.default) {
          console.log('✅ QuizClientWrapper: Setting V2 client component')
          setQuizClientV2(() => clientModule.default)
        } else {
          console.error('❌ QuizClientWrapper: No default export in client module')
          setError('Quiz client module missing default export')
          return
        }
        
        console.log('🏁 QuizClientWrapper: Dynamic import completed successfully')
      } catch (importError) {
        console.error('❌ QuizClientWrapper: Failed to import V2 client:', importError)
        console.error('❌ QuizClientWrapper: Error details:', {
          name: importError instanceof Error ? importError.name : 'Unknown',
          message: importError instanceof Error ? importError.message : String(importError),
          stack: importError instanceof Error ? importError.stack : undefined
        })
        setError(
          importError instanceof Error 
            ? `Failed to load quiz: ${importError.message}` 
            : 'Failed to load quiz components'
        )
      } finally {
        console.log('🏁 QuizClientWrapper: Setting loading to false')
        setIsLoading(false)
      }
    }

    loadQuizClient()
  }, [])

  // Loading state
  if (isLoading) {
    console.log('⏳ QuizClientWrapper: Showing loading state')
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading quiz engine...</p>
          <p className="text-sm text-muted-foreground mt-2">Preparing V2 experience...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !QuizClientV2) {
    console.error('❌ QuizClientWrapper: Showing error state:', error)
    return (
      <QuizErrorBoundary>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">Quiz Engine Error</h1>
            <p className="text-muted-foreground mb-6">
              {error || "Failed to load the quiz engine. Please try refreshing the page."}
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-all duration-200"
              >
                Reload Page
              </button>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Debug: {QuizClientV2 ? 'Component loaded' : 'Component failed to load'}
            </div>
          </div>
        </div>
      </QuizErrorBoundary>
    )
  }

  // Success state - render the V2 client
  console.log('✅ QuizClientWrapper: Rendering V2 client with props:', {
    topicId: props.topicId,
    hasQuizClient: !!QuizClientV2,
    propsKeys: Object.keys(props)
  })
  
  return (
    <QuizErrorBoundary>
      <QuizClientV2 {...props} />
    </QuizErrorBoundary>
  )
} 