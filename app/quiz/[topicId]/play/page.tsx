import { Metadata } from "next"
import { notFound } from "next/navigation"
import { dataService } from "@/lib/data-service"
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
    const topic = await dataService.getTopicById(topicId)
    
    if (!topic) {
      return {
        title: "Quiz Not Found - CivicSense",
        description: "The requested quiz could not be found."
      }
    }

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
    console.error("Error generating metadata:", error)
    return {
      title: "Quiz - CivicSense",
      description: "Learn how power actually works in America."
    }
  }
}

export default async function QuizPlayPage({ params, searchParams }: QuizPlayPageProps) {
  const { topicId } = await params
  const resolvedSearchParams = await searchParams
  
  return (
    <QuizClientWrapper 
      topicId={topicId} 
      searchParams={resolvedSearchParams} 
    />
  )
} 