/**
 * News Source Statistics API Route
 * 
 * Provides real-time statistics about news sources being monitored by the AI agent,
 * showing the integration between the news ticker and content generation system.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SourceData {
  domain: string
  credibility_score: number | null
  bias_rating: string | null
  created_at: string
  last_fetched_at: string
}

interface SourceStatistics {
  activeSources: number
  totalArticles: number
  last24Hours: number
  topSources: Array<{
    domain: string
    articleCount: number
    avgCredibilityScore: number
    biasRating: string
  }>
  credibilityDistribution: {
    high: number    // 80-100
    medium: number  // 60-79
    low: number     // below 60
  }
  biasDistribution: Record<string, number>
}

/**
 * GET /api/admin/news-agent/source-stats
 * Get comprehensive statistics about news sources being monitored
 */
export async function GET() {
  try {
    const supabaseClient = await createClient()
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Get active news sources from last 24 hours
    const { data: recentSources, error: sourcesError } = await supabaseClient
      .from('source_metadata')
      .select('domain, credibility_score, bias_rating, created_at, last_fetched_at')
      .gte('last_fetched_at', last24Hours)
      .not('title', 'is', null)
      .not('description', 'is', null)
      .eq('content_type', 'article')

    if (sourcesError) {
      throw new Error(`Failed to fetch source data: ${sourcesError.message}`)
    }

    if (!recentSources || recentSources.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          statistics: {
            activeSources: 0,
            totalArticles: 0,
            last24Hours: 0,
            topSources: [],
            credibilityDistribution: { high: 0, medium: 0, low: 0 },
            biasDistribution: {}
          }
        }
      })
    }

    // Calculate statistics
    const statistics = calculateSourceStatistics(recentSources)

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error getting source statistics:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get source statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate comprehensive statistics from source data
 */
function calculateSourceStatistics(sources: SourceData[]): SourceStatistics {
  // Group by domain
  const domainGroups = sources.reduce((groups, source) => {
    const domain = source.domain || 'unknown'
    if (!groups[domain]) {
      groups[domain] = []
    }
    groups[domain].push(source)
    return groups
  }, {} as Record<string, SourceData[]>)

  // Calculate top sources
  const topSources = Object.entries(domainGroups)
    .map(([domain, articles]) => ({
      domain,
      articleCount: articles.length,
      avgCredibilityScore: Math.round(
        articles.reduce((sum: number, a: SourceData) => sum + (a.credibility_score || 70), 0) / articles.length
      ),
      biasRating: getMostCommonBias(articles.map((a: SourceData) => a.bias_rating).filter(Boolean) as string[])
    }))
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, 10)

  // Calculate credibility distribution
  const credibilityDistribution = sources.reduce(
    (dist, source) => {
      const score = source.credibility_score || 70
      if (score >= 80) dist.high++
      else if (score >= 60) dist.medium++
      else dist.low++
      return dist
    },
    { high: 0, medium: 0, low: 0 }
  )

  // Calculate bias distribution
  const biasDistribution = sources.reduce((dist, source) => {
    const bias = source.bias_rating || 'unknown'
    dist[bias] = (dist[bias] || 0) + 1
    return dist
  }, {} as Record<string, number>)

  return {
    activeSources: Object.keys(domainGroups).length,
    totalArticles: sources.length,
    last24Hours: sources.length,
    topSources,
    credibilityDistribution,
    biasDistribution
  }
}

/**
 * Get the most common bias rating from an array
 */
function getMostCommonBias(biasRatings: string[]): string {
  if (biasRatings.length === 0) return 'unknown'
  
  const counts = biasRatings.reduce((acc, bias) => {
    acc[bias] = (acc[bias] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0][0]
} 