import { Metadata, ResolvingMetadata } from 'next'
import { quizDatabase } from "@/lib/quiz-database"
import { dataService } from '@/lib/data-service'

// Define the params type
type Props = {
  params: { attemptId: string }
}

// Generate dynamic metadata based on the quiz attempt
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Get the attempt details
    const details = await quizDatabase.getQuizAttemptDetails(params.attemptId)
    if (!details.attempt) {
      return {
        title: 'Results Not Found | CivicSense',
        description: 'The requested quiz results could not be found.',
      }
    }

    // Get topic information for better metadata
    const topic = await dataService.getTopicById(details.attempt.topicId)
    
    // Calculate score
    const correctAnswers = details.userAnswers.filter(a => a.isCorrect).length
    const totalQuestions = details.userAnswers.length
    const scorePercentage = totalQuestions > 0 
      ? Math.round((correctAnswers / totalQuestions) * 100) 
      : 0
    
    // Format the metadata
    const title = topic 
      ? `${topic.topic_title} Quiz Results | CivicSense` 
      : `Quiz Results (${scorePercentage}%) | CivicSense`
      
    const description = topic
      ? `Check out my score of ${scorePercentage}% on the ${topic.topic_title} quiz on CivicSense.`
      : `I scored ${scorePercentage}% on this CivicSense civic knowledge quiz. How well would you do?`
    
    return {
      title,
      description,
      openGraph: {
        title: topic?.emoji 
          ? `${topic.emoji} ${title}` 
          : title,
        description,
        type: 'article',
        images: [
          {
            url: '/placeholder.jpg',
            width: 1200,
            height: 630,
            alt: 'Quiz Results',
          }
        ],
        siteName: 'CivicSense',
      },
      twitter: {
        card: 'summary_large_image',
        title: topic?.emoji 
          ? `${topic.emoji} ${title}` 
          : title,
        description,
        creator: '@CivicSenseApp',
      },
    }
  } catch (error) {
    console.error('Error generating result page metadata:', error)
    // Fallback metadata
    return {
      title: 'Quiz Results | CivicSense',
      description: 'View your quiz results from CivicSense.',
    }
  }
} 