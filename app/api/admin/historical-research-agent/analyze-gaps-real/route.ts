import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-middleware'

/**
 * REAL Gap Analysis for Historical Research Agent
 * 
 * This version analyzes ACTUAL database content patterns, not hardcoded fallbacks.
 * Only identifies genuine gaps based on real content distribution.
 */

interface ContentGap {
  type: 'category_underrepresented' | 'time_period_sparse' | 'theme_imbalance' | 'content_connection_missing'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  evidence: {
    current_content_count: number
    expected_content_count: number
    gap_percentage: number
    related_content_available: number
  }
  suggested_research: {
    mode: string
    themes: string[]
    time_period?: { start: number; end: number }
    categories: string[]
    research_effort_estimate: string
  }
}

interface RealGapAnalysis {
  analysis_timestamp: string
  database_stats: {
    total_topics: number
    total_events: number
    total_questions: number
    unique_real_categories: number
    time_span_years: number
    content_density_score: number
  }
  real_content_gaps: ContentGap[]
  content_distribution_analysis: {
    category_frequency: Record<string, number>
    time_period_distribution: Array<{ year: number; count: number }>
    most_covered_categories: string[]
    least_covered_categories: string[]
  }
  genuine_research_opportunities: Array<{
    opportunity_type: string
    description: string
    data_backed_reasoning: string
    expected_impact: string
    research_priority: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { user } = adminCheck
    console.log(`🔍 Admin user ${user.email} requesting REAL gap analysis`)

    const supabase = await createClient()
    
    // Step 1: Get actual database content
    console.log('📊 Analyzing REAL database content...')
    const realDbStats = await analyzeRealDatabaseContent(supabase)
    
    if (realDbStats.total_topics < 5 && realDbStats.total_events < 5) {
      return NextResponse.json({
        success: true,
        data: {
          analysis_timestamp: new Date().toISOString(),
          database_stats: realDbStats,
          real_content_gaps: [],
          content_distribution_analysis: {
            category_frequency: {},
            time_period_distribution: [],
            most_covered_categories: [],
            least_covered_categories: []
          },
          genuine_research_opportunities: [{
            opportunity_type: 'database_bootstrap',
            description: 'Database needs initial content before gap analysis is meaningful',
            data_backed_reasoning: `Only ${realDbStats.total_topics} topics and ${realDbStats.total_events} events found. Need at least 20+ pieces of content to identify genuine gaps.`,
            expected_impact: 'Foundation for all future civic education content',
            research_priority: 100
          }]
        },
        summary: {
          verdict: 'INSUFFICIENT_DATA',
          total_real_gaps: 0,
          database_readiness: 'needs_bootstrap_content'
        }
      })
    }
    
    // Step 2: Analyze content distribution patterns
    console.log('📈 Analyzing real content distribution...')
    const distributionAnalysis = await analyzeContentDistribution(supabase, realDbStats)
    
    // Step 3: Identify genuine gaps based on real data patterns
    console.log('🎯 Identifying genuine content gaps...')
    const realGaps = await identifyRealContentGaps(distributionAnalysis, realDbStats)
    
    // Step 4: Generate data-backed research opportunities
    console.log('💡 Generating data-backed research opportunities...')
    const realOpportunities = await generateRealResearchOpportunities(realGaps, distributionAnalysis)

    const result: RealGapAnalysis = {
      analysis_timestamp: new Date().toISOString(),
      database_stats: realDbStats,
      real_content_gaps: realGaps,
      content_distribution_analysis: distributionAnalysis,
      genuine_research_opportunities: realOpportunities
    }

    console.log(`✅ REAL gap analysis complete: ${realGaps.length} genuine gaps identified`)

    return NextResponse.json({
      success: true,
      data: result,
      summary: {
        verdict: 'REAL_ANALYSIS_COMPLETE',
        total_real_gaps: realGaps.length,
        high_priority_gaps: realGaps.filter(g => g.priority === 'high').length,
        database_readiness: realDbStats.total_topics > 20 ? 'ready_for_analysis' : 'limited_data',
        confidence_level: realDbStats.total_topics > 50 ? 'high' : realDbStats.total_topics > 20 ? 'medium' : 'low'
      }
    })

  } catch (error) {
    console.error('Error in REAL gap analysis:', error)
    return NextResponse.json({
      error: 'Real gap analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// ============================================================================
// REAL DATABASE CONTENT ANALYSIS
// ============================================================================

async function analyzeRealDatabaseContent(supabase: any) {
  const stats = {
    total_topics: 0,
    total_events: 0,
    total_questions: 0,
    unique_real_categories: 0,
    time_span_years: 0,
    content_density_score: 0
  }

  try {
    // Get actual topics
    const { data: topics } = await supabase
      .from('question_topics')
      .select('*')
    
    stats.total_topics = topics?.length || 0

    // Get actual events
    const { data: events } = await supabase
      .from('events')
      .select('*')
    
    stats.total_events = events?.length || 0

    // Get actual questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
    
    stats.total_questions = questions?.length || 0

    // Count ONLY real categories (not hardcoded fallbacks)
    const realCategories = new Set<string>()
    
    topics?.forEach((topic: any) => {
      if (Array.isArray(topic.categories)) {
        topic.categories.forEach((cat: string) => realCategories.add(cat))
      }
    })
    
    events?.forEach((event: any) => {
      if (Array.isArray(event.categories)) {
        event.categories.forEach((cat: string) => realCategories.add(cat))
      }
    })
    
    questions?.forEach((question: any) => {
      if (question.category) {
        realCategories.add(question.category)
      }
    })

    stats.unique_real_categories = realCategories.size

    // Calculate time span from actual events
    if (events && events.length > 0) {
      const eventDates = events
        .map((e: any) => e.date ? new Date(e.date).getFullYear() : null)
        .filter((year: any) => year && year > 1600 && year <= 2024)
      
      if (eventDates.length > 0) {
        const minYear = Math.min(...eventDates)
        const maxYear = Math.max(...eventDates)
        stats.time_span_years = maxYear - minYear
      }
    }

    // Calculate content density (content per category)
    stats.content_density_score = stats.unique_real_categories > 0 
      ? Math.round((stats.total_topics + stats.total_events + stats.total_questions) / stats.unique_real_categories)
      : 0

  } catch (error) {
    console.warn('Error analyzing real database content:', error)
  }

  return stats
}

// ============================================================================
// CONTENT DISTRIBUTION ANALYSIS
// ============================================================================

async function analyzeContentDistribution(supabase: any, stats: any) {
  const analysis = {
    category_frequency: {} as Record<string, number>,
    time_period_distribution: [] as Array<{ year: number; count: number }>,
    most_covered_categories: [] as string[],
    least_covered_categories: [] as string[]
  }

  try {
    // Analyze category frequency from REAL content
    const categoryCount = new Map<string, number>()
    
    // Count from topics
    const { data: topics } = await supabase.from('question_topics').select('categories')
    topics?.forEach((topic: any) => {
      if (Array.isArray(topic.categories)) {
        topic.categories.forEach((cat: string) => {
          categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1)
        })
      }
    })
    
    // Count from events
    const { data: events } = await supabase.from('events').select('categories, date')
    events?.forEach((event: any) => {
      if (Array.isArray(event.categories)) {
        event.categories.forEach((cat: string) => {
          categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1)
        })
      }
    })
    
    // Count from questions
    const { data: questions } = await supabase.from('questions').select('category')
    questions?.forEach((question: any) => {
      if (question.category) {
        categoryCount.set(question.category, (categoryCount.get(question.category) || 0) + 1)
      }
    })

    analysis.category_frequency = Object.fromEntries(categoryCount)
    
    // Sort categories by frequency
    const sortedCategories = Array.from(categoryCount.entries())
      .sort(([,a], [,b]) => b - a)
    
    analysis.most_covered_categories = sortedCategories.slice(0, 5).map(([cat]) => cat)
    analysis.least_covered_categories = sortedCategories.slice(-5).map(([cat]) => cat)
    
    // Analyze time distribution
    if (events && events.length > 0) {
      const yearCount = new Map<number, number>()
      events.forEach((event: any) => {
        if (event.date) {
          const year = new Date(event.date).getFullYear()
          if (year > 1600 && year <= 2024) {
            yearCount.set(year, (yearCount.get(year) || 0) + 1)
          }
        }
      })
      
      analysis.time_period_distribution = Array.from(yearCount.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year)
    }

  } catch (error) {
    console.warn('Error analyzing content distribution:', error)
  }

  return analysis
}

// ============================================================================
// REAL GAP IDENTIFICATION
// ============================================================================

async function identifyRealContentGaps(distribution: any, stats: any): Promise<ContentGap[]> {
  const gaps: ContentGap[] = []

  // Only proceed if we have meaningful data
  if (stats.unique_real_categories < 3) {
    return gaps // Not enough data for meaningful gap analysis
  }

  // Identify underrepresented categories (those with significantly less content)
  const categoryFreq = distribution.category_frequency
  const avgContentPerCategory = Object.values(categoryFreq).reduce((a: any, b: any) => a + b, 0) / Object.keys(categoryFreq).length
  
  Object.entries(categoryFreq).forEach(([category, count]: [string, any]) => {
    if (count < avgContentPerCategory * 0.5 && count > 0) { // 50% below average
      gaps.push({
        type: 'category_underrepresented',
        priority: count < avgContentPerCategory * 0.25 ? 'high' : 'medium',
        title: `${category} is underrepresented`,
        description: `${category} has only ${count} pieces of content compared to average of ${Math.round(avgContentPerCategory)} across all categories.`,
        evidence: {
          current_content_count: count,
          expected_content_count: Math.round(avgContentPerCategory),
          gap_percentage: Math.round(((avgContentPerCategory - count) / avgContentPerCategory) * 100),
          related_content_available: Object.values(categoryFreq).reduce((a: any, b: any) => a + b, 0)
        },
        suggested_research: {
          mode: 'thematic_research',
          themes: [category],
          categories: [category],
          research_effort_estimate: count < 2 ? 'High - foundational content needed' : 'Medium - expand existing content'
        }
      })
    }
  })

  // Identify sparse time periods
  if (distribution.time_period_distribution.length > 5) {
    const timeDistribution = distribution.time_period_distribution
    const avgEventsPerYear = timeDistribution.reduce((sum, period) => sum + period.count, 0) / timeDistribution.length
    
    // Find consecutive years with significantly below-average content
    for (let i = 0; i < timeDistribution.length - 2; i++) {
      const period = timeDistribution.slice(i, i + 3) // 3-year windows
      const avgInPeriod = period.reduce((sum, year) => sum + year.count, 0) / 3
      
      if (avgInPeriod < avgEventsPerYear * 0.3) { // 70% below average
        gaps.push({
          type: 'time_period_sparse',
          priority: 'medium',
          title: `${period[0].year}-${period[2].year} period is sparse`,
          description: `This time period averages only ${Math.round(avgInPeriod)} events per year, compared to overall average of ${Math.round(avgEventsPerYear)}.`,
          evidence: {
            current_content_count: period.reduce((sum, year) => sum + year.count, 0),
            expected_content_count: Math.round(avgEventsPerYear * 3),
            gap_percentage: Math.round(((avgEventsPerYear - avgInPeriod) / avgEventsPerYear) * 100),
            related_content_available: timeDistribution.reduce((sum, year) => sum + year.count, 0)
          },
          suggested_research: {
            mode: 'period_focus',
            themes: ['Historical Events', 'Political Developments'],
            time_period: { start: period[0].year, end: period[2].year },
            categories: distribution.most_covered_categories.slice(0, 3),
            research_effort_estimate: 'Medium - fill historical gaps'
          }
        })
        break // Only suggest one time period gap to avoid overwhelming
      }
    }
  }

  return gaps.slice(0, 8) // Limit to most important gaps
}

// ============================================================================
// REAL RESEARCH OPPORTUNITIES
// ============================================================================

async function generateRealResearchOpportunities(gaps: ContentGap[], distribution: any) {
  const opportunities = []

  // Convert gaps to opportunities
  gaps.forEach((gap, index) => {
    opportunities.push({
      opportunity_type: gap.type,
      description: gap.title,
      data_backed_reasoning: `Based on analysis of actual database content: ${gap.description}. Evidence shows ${gap.evidence.gap_percentage}% gap in this area.`,
      expected_impact: gap.priority === 'high' ? 'High - addresses major content imbalance' : 'Medium - improves content coverage',
      research_priority: gap.priority === 'high' ? 90 - index : 60 - index
    })
  })

  // Add content connection opportunities if we have enough categories
  if (distribution.most_covered_categories.length >= 3) {
    opportunities.push({
      opportunity_type: 'content_connections',
      description: 'Build connections between existing well-covered categories',
      data_backed_reasoning: `Categories like ${distribution.most_covered_categories.slice(0, 3).join(', ')} have good coverage but could be better connected to create learning pathways.`,
      expected_impact: 'Medium - leverages existing content effectively',
      research_priority: 50
    })
  }

  return opportunities.sort((a, b) => b.research_priority - a.research_priority)
} 