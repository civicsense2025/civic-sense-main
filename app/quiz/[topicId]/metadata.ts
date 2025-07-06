import { Metadata, ResolvingMetadata } from 'next'
import { dataService } from '@/lib/data-service'

// Define the params type
type Props = {
  params: { topicId: string }
}

// Generate dynamic metadata based on the topic
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get the topic data
  const topic = await dataService.getTopicById(params.topicId)
  
  // If no topic is found, use fallback metadata
  if (!topic) {
    return {
      title: 'Quiz Not Found | CivicSense',
      description: 'The requested quiz could not be found.',
    }
  }
  
  // Get the parent metadata (to inherit things like template)
  const previousMetadata = await parent
  
  // Format the metadata
  const title = `${topic.topic_title} | CivicSense Quiz`
  const description = topic.description || 'Take this civic knowledge quiz and test your understanding of current political events.'
  
  // Use emoji and title for a clean OpenGraph title
  const ogTitle = topic.emoji ? `${topic.emoji} ${topic.topic_title}` : topic.topic_title
  
  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: 'article',
      // Use existing placeholder image since we don't have a dedicated og-image
      images: [
        {
          url: '/placeholder.jpg',
          width: 1200,
          height: 630,
          alt: topic.topic_title,
        }
      ],
      siteName: 'CivicSense',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      creator: '@CivicSenseApp',
    },
  }
} 