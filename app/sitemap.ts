import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Static routes
    const staticRoutes = [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${SITE_URL}/categories`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
    ]

    // Get all topics
    const { data: topicsData } = await supabase
      .from('question_topics')
      .select('topic_id, date, updated_at')
      .eq('is_active', true)

    if (!topicsData) {
      return staticRoutes
    }

    // Get unique dates for daily topic pages
    const uniqueDates = [...new Set(topicsData
      .filter(topic => topic.date)
      .map(topic => topic.date)
    )]

    // Create routes for daily topic pages
    const dailyTopicRoutes = uniqueDates.map(date => ({
      url: `${SITE_URL}/topics/${date}`,
      lastModified: new Date(date as string),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))

    // Create routes for individual topic pages
    const topicRoutes = topicsData.map(topic => ({
      url: `${SITE_URL}/quiz/${topic.topic_id}`,
      lastModified: topic.updated_at ? new Date(topic.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    // Combine all routes
    return [...staticRoutes, ...dailyTopicRoutes, ...topicRoutes]
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