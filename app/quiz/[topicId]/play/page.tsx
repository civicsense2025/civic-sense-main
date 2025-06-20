import { Metadata } from "next"
import { notFound } from "next/navigation"
import { dataService } from "@/lib/data-service"
import QuizPlayClient from "./client"

interface QuizPlayPageProps {
  params: {
    topicId: string
  }
}

export async function generateMetadata({ params }: QuizPlayPageProps): Promise<Metadata> {
  try {
    const topic = await dataService.getTopicById(params.topicId)
    
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

export default async function QuizPlayPage({ params }: QuizPlayPageProps) {
  try {
    // Fetch topic data to verify it exists
    const topic = await dataService.getTopicById(params.topicId)
    
    if (!topic) {
      notFound()
    }

    return <QuizPlayClient params={params} />
  } catch (error) {
    console.error("Error loading quiz play page:", error)
    notFound()
  }
} 