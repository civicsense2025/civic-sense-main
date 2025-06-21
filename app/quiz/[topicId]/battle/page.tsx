import { Metadata } from "next"
import { BattleClient } from "./client"
import { dataService } from "@/lib/data-service"

interface BattlePageProps {
  params: {
    topicId: string
  }
  searchParams: {
    attempt: string
    podId?: string
    classroomCourseId?: string
    classroomAssignmentId?: string
    cleverSectionId?: string
    cleverAssignmentId?: string
  }
}

export async function generateMetadata({ params }: BattlePageProps): Promise<Metadata> {
  const topic = await dataService.getTopicById(params.topicId)
  
  return {
    title: topic ? `${topic.topic_title} - NPC Battle` : 'NPC Battle',
    description: topic?.description || 'Test your knowledge in a battle against an AI opponent!'
  }
}

export default async function BattlePage({ params, searchParams }: BattlePageProps) {
  const topic = await dataService.getTopicById(params.topicId)
  const questions = await dataService.getQuestionsByTopic(params.topicId)

  if (!topic || !questions) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
        <p>Sorry, we couldn't find this quiz. Please try another one.</p>
      </div>
    )
  }

  return (
    <BattleClient
      topic={topic}
      questions={questions}
      params={params}
      searchParams={searchParams}
    />
  )
} 