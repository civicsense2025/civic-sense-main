import { dataService } from '@/lib/data-service'
import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.one'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Static routes with their last modified date
    const staticRoutes = [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${SITE_URL}/dashboard`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/civics-test`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/glossary`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/donate`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/skills`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/public-figures`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ]

    // Get dynamic quiz routes
    const topicsData = await dataService.getAllTopics()
    const topicRoutes = Object.values(topicsData).map((topic) => {
      // Parse the date from the topic or use current date
      let lastMod: Date
      try {
        lastMod = topic.date ? new Date(topic.date) : new Date()
      } catch {
        lastMod = new Date() // Fallback to current date if parsing fails
      }

      return {
        url: `${SITE_URL}/quiz/${topic.topic_id}`,
        lastModified: lastMod,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      }
    })

    // Combine all routes
    return [...staticRoutes, ...topicRoutes]
  } catch (error) {
    console.error("Error generating sitemap:", error)
    // Return at least the static routes if there's an error
    return [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      }
    ]
  }
} 