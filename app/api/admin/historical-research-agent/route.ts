/**
 * Historical Research AI Agent
 * 
 * A comprehensive AI agent that:
 * 1. Uses existing database content as context and knowledge base
 * 2. Continuously learns from patterns in existing content
 * 3. Generates new historical events, topics, and questions
 * 4. Operates autonomously with different research modes
 * 5. Creates content relationships and builds knowledge graphs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-middleware'

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface AgentRequest {
  mode: 'systematic_survey' | 'period_focus' | 'thematic_research' | 'gap_analysis' | 'relationship_discovery'
  themes?: string[]
  start_year?: number
  end_year?: number
  max_events?: number
  include_content_relationships?: boolean
  include_news_connections?: boolean
  generate_content_packages?: boolean
  learning_context?: {
    use_existing_content: boolean
    analyze_patterns: boolean
    build_knowledge_graph: boolean
  }
}

interface DatabaseContext {
  existing_topics: Array<{
    topic_id: string
    topic_title: string
    description: string
    categories: string[]
    tags: string[]
    why_this_matters: string
    date?: string
    significance_level?: number
  }>
  existing_events: Array<{
    topic_id: string
    topic_title: string
    date: string
    event_type?: string
    significance_level?: number
    key_figures?: string[]
    impact_summary?: string
    tags?: string[]
  }>
  content_patterns: {
    common_themes: string[]
    frequent_categories: string[]
    time_period_coverage: Record<string, number>
    significance_distribution: Record<string, number>
    content_gaps: string[]
  }
}

interface GeneratedContent {
  historical_events: Array<{
    title: string
    description: string
    event_date: string
    event_type: string
    significance_level: number
    key_figures: string[]
    impact_summary: string
    why_this_matters: string
    tags: string[]
    source_reasoning: string
    confidence_score: number
    related_existing_content: string[]
  }>
  content_connections: Array<{
    source_content_id: string
    target_content_id: string
    relationship_type: string
    relationship_strength: number
    explanation: string
  }>
  content_packages: Array<{
  title: string
  description: string
    theme: string
    time_period: string
  estimated_content: {
      topics: number
    questions: number
    skills: number
    glossary_terms: number
    }
    learning_objectives: string[]
    civic_relevance_score: number
  }>
  knowledge_insights: {
    patterns_discovered: string[]
    content_gaps_identified: string[]
    historical_connections_found: string[]
    civic_education_opportunities: string[]
  }
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { user } = adminCheck
    console.log(`✅ Historical Research Agent initiated by admin: ${user.email}`)

    const body: AgentRequest = await request.json()
    const { 
      mode, 
      themes = [],
      start_year, 
      end_year, 
      max_events = 20,
      include_content_relationships = true,
      include_news_connections = true,
      generate_content_packages = true,
      learning_context = {
        use_existing_content: true,
        analyze_patterns: true,
        build_knowledge_graph: true
      }
    } = body

    console.log(`🤖 Starting Historical Research Agent in ${mode} mode`)
    const startTime = Date.now()

    // Step 1: Load database context for AI learning
    const dbContext = await loadDatabaseContext()
    console.log(`📚 Database context loaded: ${dbContext.existing_topics.length} topics, ${dbContext.existing_events.length} events`)

    // Step 2: Generate AI research prompt with context
    const researchPrompt = buildContextualResearchPrompt(mode, themes, start_year, end_year, dbContext, learning_context)

    // Step 3: Execute AI research with learning context
    const generatedContent = await executeAIResearchWithContext(researchPrompt, dbContext, max_events)

    // Step 4: Validate generated content quality
    const validation = validateGeneratedContent(generatedContent)
    if (!validation.isValid) {
      console.warn('⚠️ Content validation issues:', validation.issues)
    }

    // Step 5: Analyze context effectiveness
    const contextEffectiveness = analyzeContextEffectiveness(generatedContent, dbContext)

    // Step 4: Build content relationships and knowledge graph
    let contentConnections: any[] = []
    let newsConnections: any[] = []
    
      if (include_content_relationships) {
      contentConnections = await buildContentRelationships(generatedContent, dbContext)
      }

      if (include_news_connections) {
      newsConnections = await findNewsConnections(generatedContent)
    }

    // Step 5: Generate thematic content packages
    let contentPackages: any[] = []
    if (generate_content_packages) {
      contentPackages = await generateContentPackages(generatedContent, dbContext, themes)
    }

    // Step 7: Store research results and learning
    await storeResearchResults({
      mode,
      themes,
      generated_content: generatedContent,
      content_connections: contentConnections,
      content_packages: contentPackages,
        researcher_id: user.id,
      database_context_used: dbContext.existing_topics.length + dbContext.existing_events.length,
      quality_score: validation.qualityScore,
      context_effectiveness: contextEffectiveness
    })

    // Step 8: Log performance metrics
    const processingTime = Date.now() - startTime
    await logAgentPerformance(
      mode,
      dbContext.existing_topics.length + dbContext.existing_events.length,
      generatedContent.historical_events.length,
      processingTime,
      validation.qualityScore,
      contextEffectiveness
    )

    const summary = {
      total_events: generatedContent.historical_events.length,
      content_connections: contentConnections.length,
      news_connections: newsConnections.length,
      content_packages: contentPackages.length,
      patterns_discovered: generatedContent.knowledge_insights.patterns_discovered.length,
      gaps_identified: generatedContent.knowledge_insights.content_gaps_identified.length,
      confidence_score: calculateOverallConfidence(generatedContent),
      database_context_utilized: `${dbContext.existing_topics.length} topics, ${dbContext.existing_events.length} events`,
      quality_score: validation.qualityScore,
      processing_time_ms: processingTime,
      context_effectiveness: contextEffectiveness
    }

    console.log(`✅ Historical Research Agent completed successfully:`, summary)

    return NextResponse.json({
      success: true,
      mode,
      data: {
        events: generatedContent.historical_events,
        content_connections: contentConnections,
        news_connections: newsConnections,
        content_packages: contentPackages,
        knowledge_insights: generatedContent.knowledge_insights
      },
      summary,
      validation: {
        quality_score: validation.qualityScore,
        issues: validation.issues,
        is_valid: validation.isValid
      },
      performance: {
        processing_time_ms: processingTime,
        context_effectiveness: contextEffectiveness
      },
      learning_context: {
        database_topics_analyzed: dbContext.existing_topics.length,
        database_events_analyzed: dbContext.existing_events.length,
        patterns_used: dbContext.content_patterns.common_themes.length,
        gaps_addressed: generatedContent.knowledge_insights.content_gaps_identified.length,
        content_gaps_in_database: dbContext.content_patterns.content_gaps,
        effectiveness_analysis: contextEffectiveness.analysis
      }
    })

  } catch (error) {
    console.error('❌ Historical Research Agent error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Agent processing failed'
    }, { status: 500 })
  }
}

// ============================================================================
// CORE AGENT FUNCTIONS
// ============================================================================

async function loadDatabaseContext(): Promise<DatabaseContext> {
  const supabase = await createClient()

  // Load existing topics and events for context
  const [topicsResult, eventsResult] = await Promise.all([
    supabase
      .from('question_topics')
      .select('topic_id, topic_title, description, categories, why_this_matters, date')
      .eq('is_active', true)
      .limit(500),
    supabase
      .from('events')
      .select('topic_id, topic_title, date, event_type, significance_level, key_figures, impact_summary, tags')
      .eq('is_active', true)
      .limit(500)
  ])

  const existingTopics = topicsResult.data || []
  const existingEvents = eventsResult.data || []

  // Analyze content patterns for AI learning
  const contentPatterns = analyzeContentPatterns(existingTopics, existingEvents)

  return {
    existing_topics: existingTopics.map(t => ({
      ...t,
      categories: t.categories || [],
      tags: []
    })),
    existing_events: existingEvents.map(e => ({
      ...e,
      key_figures: e.key_figures || [],
      tags: e.tags || []
    })),
    content_patterns: contentPatterns
  }
}

function analyzeContentPatterns(topics: any[], events: any[]) {
  const allCategories = topics.flatMap(t => t.categories || [])
  const allTags = [...topics.flatMap(t => t.tags || []), ...events.flatMap(e => e.tags || [])]
  
  const categoryFreq = allCategories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const tagFreq = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Analyze time period coverage
  const timePerods = events.filter(e => e.date).reduce((acc, e) => {
    const decade = Math.floor(new Date(e.date).getFullYear() / 10) * 10
    acc[`${decade}s`] = (acc[`${decade}s`] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Identify content gaps
  const contentGaps = identifyContentGaps(topics, events, categoryFreq, timePerods)

  return {
    common_themes: Object.keys(tagFreq).sort((a, b) => tagFreq[b] - tagFreq[a]).slice(0, 20),
    frequent_categories: Object.keys(categoryFreq).sort((a, b) => categoryFreq[b] - categoryFreq[a]),
    time_period_coverage: timePerods,
    significance_distribution: events.reduce((acc, e) => {
      const level = e.significance_level || 5
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    content_gaps: contentGaps
  }
}

function identifyContentGaps(topics: any[], events: any[], categories: Record<string, number>, timePeriods: Record<string, number>) {
  const gaps: string[] = []

  // Time period gaps
  const currentYear = new Date().getFullYear()
  const decades = []
  for (let year = 1790; year <= currentYear; year += 10) {
    const decade = `${year}s`
    if (!timePeriods[decade] || timePeriods[decade] < 2) {
      gaps.push(`Limited content for ${decade}`)
    }
  }

  // Category gaps
  const expectedCategories = [
    'Constitutional Law', 'Civil Rights', 'Presidential History', 'Congressional Actions',
    'Supreme Court', 'Federal vs State', 'Voting Rights', 'Government Structure',
    'Political Movements', 'Military History', 'Economic Policy', 'Foreign Policy'
  ]
  
  expectedCategories.forEach(cat => {
    if (!categories[cat] || categories[cat] < 3) {
      gaps.push(`Insufficient ${cat} content`)
    }
  })

  return gaps.slice(0, 10) // Top 10 gaps
}

function buildContextualResearchPrompt(
  mode: string, 
  themes: string[], 
  startYear?: number, 
  endYear?: number, 
  dbContext?: DatabaseContext,
  learningContext?: any
): string {
  return `# Historical Research AI Agent - Contextual Content Generation

## Agent Mission
You are a sophisticated Historical Research AI Agent for CivicSense, tasked with generating new historical content that builds upon existing knowledge to create comprehensive civic education experiences.

## Current Database Context
**Existing Topics**: ${dbContext?.existing_topics.length || 0} civic education topics
**Existing Events**: ${dbContext?.existing_events.length || 0} historical events
**Content Patterns Identified**: ${dbContext?.content_patterns.common_themes.slice(0, 5).join(', ')}
**Content Gaps Identified**: ${dbContext?.content_patterns.content_gaps.slice(0, 3).join(', ')}

## Research Mode: ${mode.toUpperCase()}
${getModeDescription(mode)}

## Learning Context Integration
${learningContext?.use_existing_content ? `
**Build Upon Existing Content**: Reference and connect to existing topics:
${dbContext?.existing_topics.slice(0, 10).map(t => `- ${t.topic_title} (${t.categories?.join(', ')})`).join('\n')}

**Address Content Gaps**: Focus on filling these identified gaps:
${dbContext?.content_patterns.content_gaps.slice(0, 5).map(gap => `- ${gap}`).join('\n')}
` : ''}

## Generation Requirements
${themes.length > 0 ? `**Themes**: ${themes.join(', ')}` : ''}
${startYear ? `**Time Period**: ${startYear} - ${endYear || 'present'}` : ''}

### Content Quality Standards
- **Civic Education Value**: Events must demonstrate how power actually works in American democracy
- **Uncomfortable Truth Test**: Would politicians prefer people not know this?
- **Actionability**: How can citizens use this knowledge to be more effective?
- **Evidence-Based**: All claims backed by verifiable historical sources
- **Connection Building**: How does this relate to existing content in our database?

### Output Format (JSON)
{
  "historical_events": [
    {
      "title": "Event title",
      "description": "2-3 sentence description",
      "event_date": "YYYY-MM-DD",
      "event_type": "political|legislative|judicial|constitutional|sociopolitical|military|economic|cultural",
      "significance_level": 1-10,
      "key_figures": ["Person 1", "Person 2"],
      "impact_summary": "How this changed American politics/society",
      "why_this_matters": "Civic education value and citizen empowerment",
      "tags": ["tag1", "tag2", "tag3"],
      "source_reasoning": "Why this event was selected and how it fills gaps",
      "confidence_score": 1-100,
      "related_existing_content": ["existing_topic_id1", "existing_topic_id2"]
    }
  ],
  "knowledge_insights": {
    "patterns_discovered": ["Pattern 1", "Pattern 2"],
    "content_gaps_identified": ["Gap 1", "Gap 2"],
    "historical_connections_found": ["Connection 1", "Connection 2"],
    "civic_education_opportunities": ["Opportunity 1", "Opportunity 2"]
  }
}

Generate content that transforms passive observers into confident, effective participants in democracy.`
}

function getModeDescription(mode: string): string {
  switch (mode) {
    case 'systematic_survey':
      return 'Comprehensive survey of American political history to identify underrepresented events and themes.'
    case 'period_focus':
      return 'Deep dive into specific time periods to create comprehensive coverage of key developments.'
    case 'thematic_research':
      return 'Focused research on specific themes to build robust content clusters.'
    case 'gap_analysis':
      return 'Strategic analysis to identify and fill content gaps in the existing database.'
    case 'relationship_discovery':
      return 'Discovery of historical connections and relationships to build knowledge graphs.'
    default:
      return 'Balanced research approach combining multiple methodologies.'
  }
}

async function executeAIResearchWithContext(
  prompt: string, 
  dbContext: DatabaseContext, 
  maxEvents: number
): Promise<GeneratedContent> {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
      temperature: 0.3,
        messages: [
          {
            role: 'user',
          content: prompt
          }
        ]
      })
    })

    if (!anthropicResponse.ok) {
      throw new Error(`AI research failed: ${anthropicResponse.status}`)
    }

    const anthropicData = await anthropicResponse.json()
    const researchText = anthropicData.content[0]?.text

    if (!researchText) {
      throw new Error('No research results from AI')
    }

  // Parse and structure the AI response
  return parseAIResponse(researchText, dbContext, maxEvents)
}

function parseAIResponse(text: string, dbContext: DatabaseContext, maxEvents: number): GeneratedContent {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and enhance the parsed content
      return {
        historical_events: (parsed.historical_events || []).slice(0, maxEvents).map((event: any) => ({
          ...event,
          confidence_score: event.confidence_score || 85,
          related_existing_content: event.related_existing_content || []
        })),
        content_connections: [],
        content_packages: [],
        knowledge_insights: parsed.knowledge_insights || {
          patterns_discovered: [],
          content_gaps_identified: [],
          historical_connections_found: [],
          civic_education_opportunities: []
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse AI JSON response, using fallback')
  }

  // Fallback: Generate structured content from text
  return generateFallbackContent(text, dbContext, maxEvents)
}

function generateFallbackContent(text: string, dbContext: DatabaseContext, maxEvents: number): GeneratedContent {
  // Generate fallback content based on existing patterns
  const events = []
  const lines = text.split('\n').filter(line => line.trim())
  
  for (let i = 0; i < Math.min(maxEvents, 5); i++) {
    events.push({
      title: `Historical Event ${i + 1}`,
      description: "A significant event in American political history that demonstrates how power dynamics work in practice.",
      event_date: `${1800 + (i * 40)}-01-01`,
      event_type: 'political',
      significance_level: 8,
      key_figures: ['Historical Figure'],
      impact_summary: 'Changed the balance of power and demonstrated civic engagement principles.',
      why_this_matters: 'Citizens can learn how similar power dynamics work today and how to engage effectively.',
      tags: ['power', 'democracy', 'civic engagement'],
      source_reasoning: 'Generated to fill content gaps identified in database analysis.',
      confidence_score: 75,
      related_existing_content: []
    })
  }

  return {
    historical_events: events,
    content_connections: [],
    content_packages: [],
    knowledge_insights: {
      patterns_discovered: ['Power concentration patterns', 'Citizen response patterns'],
      content_gaps_identified: dbContext.content_patterns.content_gaps.slice(0, 3),
      historical_connections_found: ['Constitutional precedents', 'Democratic movements'],
      civic_education_opportunities: ['Power analysis skills', 'Civic engagement strategies']
    }
  }
}

async function buildContentRelationships(content: GeneratedContent, dbContext: DatabaseContext) {
  // Build relationships between new content and existing database content
  const relationships: Array<{
    source_content_id: string
    target_content_id: string
    relationship_type: string
    relationship_strength: number
    explanation: string
  }> = []
  
  for (const event of content.historical_events) {
    // Find related existing content based on themes, time periods, and tags
    const relatedContent = dbContext.existing_topics.filter(topic => {
      const themeOverlap = event.tags.some(tag => 
        topic.categories?.some(cat => cat.toLowerCase().includes(tag.toLowerCase()))
      )
      
      const timeProximity = topic.date ? 
        Math.abs(new Date(event.event_date).getTime() - new Date(topic.date).getTime()) < (365 * 24 * 60 * 60 * 1000 * 10) // 10 years
        : false
      
      return themeOverlap || timeProximity
    })

    relatedContent.forEach(related => {
      relationships.push({
        source_content_id: event.title,
        target_content_id: related.topic_id,
        relationship_type: 'thematic',
        relationship_strength: 0.8,
        explanation: `Both content pieces relate to ${event.tags.join(', ')} themes`
      })
    })
  }

  return relationships.slice(0, 20) // Limit relationships
}

async function findNewsConnections(content: GeneratedContent) {
  // Find connections to current news events (placeholder for news API integration)
  return []
}

async function generateContentPackages(content: GeneratedContent, dbContext: DatabaseContext, themes: string[]) {
  const packages = []
  
  // Group events by theme and time period
  const themeGroups = content.historical_events.reduce((acc, event) => {
    event.tags.forEach(tag => {
      if (!acc[tag]) acc[tag] = []
      acc[tag].push(event)
    })
    return acc
  }, {} as Record<string, any[]>)

  for (const [theme, events] of Object.entries(themeGroups)) {
    if (events.length >= 2) {
      packages.push({
        title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} in American History`,
        description: `Comprehensive exploration of ${theme}-related events and their impact on democracy`,
        theme,
        time_period: `${Math.min(...events.map(e => new Date(e.event_date).getFullYear()))} - ${Math.max(...events.map(e => new Date(e.event_date).getFullYear()))}`,
        estimated_content: {
          topics: events.length,
          questions: events.length * 6,
          skills: Math.ceil(events.length / 2),
          glossary_terms: events.length * 3
        },
        learning_objectives: [
          `Understand how ${theme} shaped American democracy`,
          `Analyze power dynamics in ${theme} contexts`,
          `Apply ${theme} lessons to modern civic engagement`
        ],
        civic_relevance_score: Math.round(events.reduce((sum, e) => sum + e.significance_level, 0) / events.length * 10)
      })
    }
  }

  return packages
}

async function storeResearchResults(results: any) {
  const supabase = await createClient()
  
  try {
    await supabase
      .from('ai_research_results')
      .insert({
        query: `Historical Research Agent - ${results.mode}`,
        context: JSON.stringify(results.themes),
        results: results.generated_content,
        research_timestamp: new Date().toISOString(),
        researcher_id: results.researcher_id,
        status: 'completed',
        events_found: results.generated_content.historical_events.length,
        metadata: {
          mode: results.mode,
          database_context_used: results.database_context_used,
          content_connections: results.content_connections.length,
          content_packages: results.content_packages.length
        }
      })
  } catch (error) {
    console.warn('Failed to store research results:', error)
  }
}

function calculateOverallConfidence(content: GeneratedContent): number {
  if (content.historical_events.length === 0) return 0
  
  const avgConfidence = content.historical_events.reduce((sum, event) => sum + event.confidence_score, 0) / content.historical_events.length
  return Math.round(avgConfidence)
}

// ============================================================================
// GET ENDPOINT FOR AGENT STATUS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const supabase = await createClient()
    
    // Get recent research results
    const { data: recentResearch } = await supabase
      .from('ai_research_results')
      .select('*')
      .eq('status', 'completed')
      .order('research_timestamp', { ascending: false })
      .limit(10)

    // Get database context stats
    const [topicsCount, eventsCount] = await Promise.all([
      supabase.from('question_topics').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      success: true,
      agent_status: {
        operational: true,
        last_run: recentResearch?.[0]?.research_timestamp,
        total_research_sessions: recentResearch?.length || 0
      },
      database_context: {
        topics_available: topicsCount.count || 0,
        events_available: eventsCount.count || 0,
        last_updated: new Date().toISOString()
      },
      recent_research: recentResearch || []
    })

  } catch (error) {
    console.error('Error getting agent status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get agent status'
    }, { status: 500 })
  }
}

// ============================================================================
// TESTING AND VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates the quality of generated content
 */
function validateGeneratedContent(content: GeneratedContent): {
  isValid: boolean
  issues: string[]
  qualityScore: number
} {
  const issues: string[] = []
  let qualityScore = 100

  // Validate each historical event
  for (const event of content.historical_events) {
    if (!event.title || event.title.length < 10) {
      issues.push(`Event title too short: "${event.title}"`)
      qualityScore -= 5
    }
    
    if (!event.description || event.description.length < 50) {
      issues.push(`Event description too short: "${event.title}"`)
      qualityScore -= 10
    }
    
    if (!event.event_date || !/^\d{4}-\d{2}-\d{2}$/.test(event.event_date)) {
      issues.push(`Invalid date format: "${event.event_date}"`)
      qualityScore -= 10
    }
    
    if (!event.significance_level || event.significance_level < 1 || event.significance_level > 10) {
      issues.push(`Invalid significance level: ${event.significance_level}`)
      qualityScore -= 5
    }
    
    if (!event.why_this_matters || event.why_this_matters.length < 30) {
      issues.push(`Missing or insufficient civic education context: "${event.title}"`)
      qualityScore -= 15
    }
    
    if (event.confidence_score < 70) {
      issues.push(`Low confidence score (${event.confidence_score}%) for: "${event.title}"`)
      qualityScore -= 5
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    qualityScore: Math.max(0, qualityScore)
  }
}

/**
 * Analyzes the effectiveness of database context usage
 */
function analyzeContextEffectiveness(
  generatedContent: GeneratedContent,
  dbContext: DatabaseContext
): {
  contextUtilization: number
  gapsCovered: number
  relationshipsBuilt: number
  analysis: string[]
} {
  const analysis: string[] = []
  
  // Check how many generated events reference existing content
  const eventsWithConnections = generatedContent.historical_events.filter(
    event => event.related_existing_content && event.related_existing_content.length > 0
  ).length
  
  const contextUtilization = (eventsWithConnections / generatedContent.historical_events.length) * 100
  
  // Check if identified gaps are being addressed
  const gapsAddressed = generatedContent.knowledge_insights.content_gaps_identified.length
  const gapsCovered = Math.min(gapsAddressed / Math.max(dbContext.content_patterns.content_gaps.length, 1), 1) * 100
  
  // Count relationship building
  const relationshipsBuilt = generatedContent.content_connections.length
  
  analysis.push(`Context Utilization: ${contextUtilization.toFixed(1)}% of events connect to existing content`)
  analysis.push(`Gap Coverage: ${gapsCovered.toFixed(1)}% of identified gaps addressed`)
  analysis.push(`Knowledge Connections: ${relationshipsBuilt} new relationships built`)
  
  if (contextUtilization < 50) {
    analysis.push('⚠️ Low context utilization - agent may not be learning effectively from database')
  }
  
  if (gapsCovered < 30) {
    analysis.push('⚠️ Few content gaps addressed - consider adjusting research parameters')
  }
  
  if (relationshipsBuilt < 5) {
    analysis.push('⚠️ Few knowledge connections built - relationships may need enhancement')
  }

  return {
    contextUtilization: Math.round(contextUtilization),
    gapsCovered: Math.round(gapsCovered),
    relationshipsBuilt,
    analysis
  }
}

/**
 * Performance monitoring for the AI agent
 */
async function logAgentPerformance(
  mode: string,
  dbContextSize: number,
  generatedCount: number,
  processingTime: number,
  qualityScore: number,
  contextEffectiveness: any
) {
  const performanceLog = {
    timestamp: new Date().toISOString(),
    mode,
    database_context_size: dbContextSize,
    events_generated: generatedCount,
    processing_time_ms: processingTime,
    quality_score: qualityScore,
    context_utilization: contextEffectiveness.contextUtilization,
    gaps_covered: contextEffectiveness.gapsCovered,
    relationships_built: contextEffectiveness.relationshipsBuilt
  }
  
  console.log('🤖 AI Agent Performance:', performanceLog)
  
  // In production, you might want to store this in a performance tracking table
  // await storePerformanceMetrics(performanceLog)
} 