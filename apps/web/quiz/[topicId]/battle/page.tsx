import { Metadata } from "next"
import { BattleClient } from "./client"
import { dataService } from "@civicsense/shared/lib/data-service"

interface BattlePageProps {
  params: Promise<{
    topicId: string
  }>
  searchParams: Promise<{
    attempt: string
    difficulty?: 'easy' | 'medium' | 'hard'
    podId?: string
    classroomCourseId?: string
    classroomAssignmentId?: string
    cleverSectionId?: string
    cleverAssignmentId?: string
  }>
}

export async function generateMetadata({ params }: BattlePageProps): Promise<Metadata> {
  const { topicId } = await params
  const topic = await dataService.getTopicById(topicId)
  
  return {
    title: topic ? `${topic.topic_title} - NPC Battle` : 'NPC Battle',
    description: topic?.description || 'Test your knowledge in a battle against an AI opponent!'
  }
}

export default async function BattlePage({ params, searchParams }: BattlePageProps) {
  const { topicId } = await params
  const resolvedSearchParams = await searchParams
  const topic = await dataService.getTopicById(topicId)
  const questions = await dataService.getQuestionsByTopic(topicId)

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
      params={{ topicId }}
      searchParams={resolvedSearchParams}
    />
  )
} 