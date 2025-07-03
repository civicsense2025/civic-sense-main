import { Metadata } from "next"
import { notFound } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { createClient } from "@/lib/supabase/server"
import QuizClientWrapper from "./quiz-client-wrapper"

interface QuizPlayPageProps {
  params: Promise<{ topicId: string }>
  searchParams: Promise<{
    attempt?: string
    podId?: string
    classroomCourseId?: string
    classroomAssignmentId?: string
    cleverSectionId?: string
    mode?: string
    v?: string // Version parameter for testing
  }>
}

export async function generateMetadata({ params }: QuizPlayPageProps): Promise<Metadata> {
  const { topicId } = await params
  
  try {
    console.log(`🔍 Quiz Play: Generating metadata for topic ${topicId}`)
    const topic = await dataService.getTopicById(topicId)
    
    if (!topic) {
      console.warn(`⚠️ Quiz Play: Topic ${topicId} not found for metadata`)
      return {
        title: "Quiz Not Found - CivicSense",
        description: "The requested quiz could not be found."
      }
    }

    console.log(`✅ Quiz Play: Metadata generated for ${topic.topic_title}`)
    return {
      title: `Playing: ${topic.topic_title} - CivicSense`,
      description: `Take the quiz on ${topic.topic_title}. Learn how power actually works in America.`,
      robots: "noindex, nofollow", // Don't index gameplay pages
      openGraph: {
        title: `Playing: ${topic.topic_title}`,
        description: `Take the quiz on ${topic.topic_title}. Learn how power actually works in America.`,
        type: "website",
      },
    }
  } catch (error) {
    console.error("❌ Quiz Play: Error generating metadata:", error)
    return {
      title: "Quiz - CivicSense",
      description: "Learn how power actually works in America."
    }
  }
}

export default async function QuizPlayPage({ params, searchParams }: QuizPlayPageProps) {
  try {
    const { topicId } = await params
    const resolvedSearchParams = await searchParams
    
    console.log(`🎮 Quiz Play: Loading page for topic ${topicId}`, {
      mode: resolvedSearchParams.mode || 'standard',
      hasAttempt: !!resolvedSearchParams.attempt,
      hasPodId: !!resolvedSearchParams.podId
    })
    
    // Load topic data and auth state in parallel
    const [topic, { data: { user } }] = await Promise.all([
      dataService.getTopicById(topicId).catch((error: any) => {
        console.error(`❌ Quiz Play: Error loading topic ${topicId}:`, error)
        return null
      }),
      (async () => {
        const supabase = await createClient()
        return await supabase.auth.getUser()
      })().catch((error: any) => {
        console.error(`❌ Quiz Play: Error loading auth state:`, error)
        return { data: { user: null } }
      })
    ])
    
    if (!topic) {
      console.error(`❌ Quiz Play: Topic ${topicId} not found`)
      notFound()
    }
    
    console.log(`✅ Quiz Play: Topic ${topic.topic_title} found, proceeding to client`)
    console.log(`🔐 Quiz Play: Auth state:`, { hasUser: !!user, userId: user?.id })
    
    // Generate guest token for non-authenticated users
    const guestToken = !user ? `guest_${topicId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined
    
    console.log(`🎯 Quiz Play: Passing data to wrapper:`, {
      topicId,
      hasTopicData: !!topic,
      topicTitle: topic.topic_title,
      hasUser: !!user,
      hasGuestToken: !!guestToken,
      searchParamsKeys: Object.keys(resolvedSearchParams)
    })
    
    return (
      <QuizClientWrapper 
        topicId={topicId} 
        topic={topic}
        userId={user?.id}
        guestToken={guestToken}
        searchParams={resolvedSearchParams} 
      />
    )
  } catch (error) {
    console.error("❌ Quiz Play: Critical error in page component:", error)
    console.error("❌ Quiz Play: Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold">Unable to Load Quiz</h1>
          <p className="text-muted-foreground">
            There was a problem loading this quiz. Please try again by refreshing the page.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }
} 