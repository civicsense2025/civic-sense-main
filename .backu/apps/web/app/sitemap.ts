import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

// Ensure we have a proper production URL for crawlers
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.one'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  console.log('🗺️ Generating sitemap.xml...')
  
  try {
    // Create Supabase client for server-side rendering
    const supabase = createClient()
    
    // Static routes with proper priorities and change frequencies
    const staticRoutes: MetadataRoute.Sitemap = [
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
      // Congressional pages
      {
        url: `${SITE_URL}/congress/bills`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      // Civic engagement pages
      {
        url: `${SITE_URL}/glossary`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/donate`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
      {
        url: `${SITE_URL}/multiplayer`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/civics-test`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
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

    // Get all topics for quiz pages with better error handling
    console.log('📝 Fetching topics for sitemap...')
    const { data: topicsData, error: topicsError } = await supabase
      .from('question_topics')
      .select('topic_id, date, updated_at')
      .eq('is_active', true)
      .limit(1000) // Reasonable limit for sitemap

    if (topicsError) {
      console.warn('⚠️ Error fetching topics for sitemap:', topicsError)
    }

    const validTopicsData = topicsData || []
    console.log(`✅ Found ${validTopicsData.length} active topics`)

    // Get unique dates for daily topic pages
    const uniqueDates = [...new Set(validTopicsData
      .filter(topic => topic.date)
      .map(topic => topic.date)
    )]

    console.log(`📅 Found ${uniqueDates.length} unique topic dates`)

    // Create routes for daily topic pages (/topics/YYYY-MM-DD)
    const dailyTopicRoutes: MetadataRoute.Sitemap = uniqueDates.map(date => ({
      url: `${SITE_URL}/topics/${date}`,
      lastModified: new Date(date as string),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))

    // Create routes for individual topic quiz pages
    const topicRoutes: MetadataRoute.Sitemap = validTopicsData.map(topic => {
      // Convert underscores to hyphens for URL compatibility
      const urlSafeTopicId = topic.topic_id.replace(/_/g, '-')
      
      return {
        url: `${SITE_URL}/quiz/${urlSafeTopicId}`,
        lastModified: topic.updated_at ? new Date(topic.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }
    })

    // Get public figures for their pages (includes congressional members!)
    console.log('👤 Fetching public figures for sitemap...')
    const { data: publicFiguresData, error: figuresError } = await supabase
      .from('public_figures')
      .select('slug, updated_at')
      .eq('is_active', true)
      .limit(500) // Reasonable limit

    if (figuresError) {
      console.warn('⚠️ Error fetching public figures for sitemap:', figuresError)
    }

    const publicFigureRoutes: MetadataRoute.Sitemap = publicFiguresData ? publicFiguresData.map(figure => ({
      url: `${SITE_URL}/public-figures/${figure.slug}`,
      lastModified: figure.updated_at ? new Date(figure.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) : []

    console.log(`✅ Found ${publicFigureRoutes.length} public figures`)

    // Get congressional bills for their pages (commented out until table exists)
    // const { data: billsData } = await supabase
    //   .from('congressional_bills')
    //   .select('id, updated_at')
    //   .not('ai_generated_summary', 'is', null)
    //   .limit(1000) // Limit to most recent 1000 bills for sitemap size

    const billRoutes: MetadataRoute.Sitemap = [] // Empty until congressional_bills table is implemented

    // Get skills for their pages
    console.log('🎯 Fetching skills for sitemap...')
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('skill_slug, updated_at')
      .eq('is_active', true)
      .limit(100) // Reasonable limit

    if (skillsError) {
      console.warn('⚠️ Error fetching skills for sitemap:', skillsError)
    }

    const skillRoutes: MetadataRoute.Sitemap = skillsData ? skillsData.map(skill => ({
      url: `${SITE_URL}/skills/${skill.skill_slug}`,
      lastModified: skill.updated_at ? new Date(skill.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) : []

    console.log(`✅ Found ${skillRoutes.length} skills`)

    // Get scenarios for their pages
    console.log('🎬 Fetching scenarios for sitemap...')
    const { data: scenariosData, error: scenariosError } = await supabase
      .from('scenarios')
      .select('id, updated_at')
      .eq('is_active', true)
      .limit(100) // Reasonable limit

    if (scenariosError) {
      console.warn('⚠️ Error fetching scenarios for sitemap:', scenariosError)
    }

    const scenarioRoutes: MetadataRoute.Sitemap = scenariosData ? scenariosData.map(scenario => ({
      url: `${SITE_URL}/scenarios/${scenario.id}`,
      lastModified: scenario.updated_at ? new Date(scenario.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) : []

    console.log(`✅ Found ${scenarioRoutes.length} scenarios`)

    // Get collections for their pages (includes weekly recaps!)
    console.log('📚 Fetching collections for sitemap...')
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('collections')
      .select('slug, updated_at')
      .eq('status', 'published')
      .limit(200) // Reasonable limit

    if (collectionsError) {
      console.warn('⚠️ Error fetching collections for sitemap:', collectionsError)
    }

    const collectionRoutes: MetadataRoute.Sitemap = collectionsData ? collectionsData.map(collection => ({
      url: `${SITE_URL}/collections/${collection.slug}`,
      lastModified: collection.updated_at ? new Date(collection.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) : []

    console.log(`✅ Found ${collectionRoutes.length} collections`)

    // Get glossary terms for their pages (commented out until slug column exists)
    // const { data: glossaryData } = await supabase
    //   .from('glossary_terms')
    //   .select('slug, updated_at')
    //   .eq('is_active', true)

    const glossaryRoutes: MetadataRoute.Sitemap = [] // Empty until glossary_terms has slug column

    // Combine all routes
    const allRoutes = [
      ...staticRoutes, 
      ...dailyTopicRoutes, 
      ...topicRoutes,
      ...publicFigureRoutes,
      ...billRoutes,
      ...skillRoutes,
      ...scenarioRoutes,
      ...collectionRoutes,
      ...glossaryRoutes
    ]

    console.log(`✅ Generated sitemap with ${allRoutes.length} total URLs`)
    console.log(`   📊 Static: ${staticRoutes.length}`)
    console.log(`   📅 Daily topics: ${dailyTopicRoutes.length}`)
    console.log(`   🎯 Topic quizzes: ${topicRoutes.length}`)
    console.log(`   👤 Public figures: ${publicFigureRoutes.length}`)
    console.log(`   📜 Bills: ${billRoutes.length}`)
    console.log(`   🎯 Skills: ${skillRoutes.length}`)
    console.log(`   🎬 Scenarios: ${scenarioRoutes.length}`)
    console.log(`   📚 Collections: ${collectionRoutes.length}`)
    console.log(`   📖 Glossary: ${glossaryRoutes.length}`)

    return allRoutes
  } catch (error) {
    console.error("Error generating sitemap:", error)
    // Return at least the static routes if there's an error
    const fallbackRoutes: MetadataRoute.Sitemap = [
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
        url: `${SITE_URL}/congress/bills`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/glossary`,
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
    
    return fallbackRoutes
  }
} 