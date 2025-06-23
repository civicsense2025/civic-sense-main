import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Static routes with proper priorities and change frequencies
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
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/schools`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/changelog`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/collections`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      // Legal and policy pages
      {
        url: `${SITE_URL}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
      {
        url: `${SITE_URL}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
    ]

    // Get all topics for quiz pages
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

    // Create routes for daily topic pages (/topics/YYYY-MM-DD)
    const dailyTopicRoutes = uniqueDates.map(date => ({
      url: `${SITE_URL}/topics/${date}`,
      lastModified: new Date(date as string),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))

    // Create routes for individual topic quiz pages
    const topicRoutes = topicsData.map(topic => ({
      url: `${SITE_URL}/quiz/${topic.topic_id}`,
      lastModified: topic.updated_at ? new Date(topic.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    // Get public figures for their pages
    const { data: publicFiguresData } = await supabase
      .from('public_figures')
      .select('slug, updated_at')
      .eq('is_active', true)

    const publicFigureRoutes = publicFiguresData ? publicFiguresData.map(figure => ({
      url: `${SITE_URL}/public-figures/${figure.slug}`,
      lastModified: figure.updated_at ? new Date(figure.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) : []

    // Get skills for their pages
    const { data: skillsData } = await supabase
      .from('skills')
      .select('skill_slug, updated_at')
      .eq('is_active', true)

    const skillRoutes = skillsData ? skillsData.map(skill => ({
      url: `${SITE_URL}/skills/${skill.skill_slug}`,
      lastModified: skill.updated_at ? new Date(skill.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) : []

    // Get scenarios for their pages
    const { data: scenariosData } = await supabase
      .from('scenarios')
      .select('id, updated_at')
      .eq('is_active', true)

    const scenarioRoutes = scenariosData ? scenariosData.map(scenario => ({
      url: `${SITE_URL}/scenarios/${scenario.id}`,
      lastModified: scenario.updated_at ? new Date(scenario.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) : []

    // Get collections for their pages (includes weekly recaps!)
    const { data: collectionsData } = await supabase
      .from('collections')
      .select('slug, updated_at')
      .eq('status', 'published')

    const collectionRoutes = collectionsData ? collectionsData.map(collection => ({
      url: `${SITE_URL}/collections/${collection.slug}`,
      lastModified: collection.updated_at ? new Date(collection.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) : []

    // Combine all routes
    return [
      ...staticRoutes, 
      ...dailyTopicRoutes, 
      ...topicRoutes,
      ...publicFigureRoutes,
      ...skillRoutes,
      ...scenarioRoutes,
      ...collectionRoutes
    ]
  } catch (error) {
    console.error("Error generating sitemap:", error)
    // Return at least the static routes if there's an error
    return [
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
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/schools`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/changelog`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      },
      {
        url: `${SITE_URL}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
      }
    ]
  }
} 