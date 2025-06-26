import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'
import OpenAI from 'openai'

// Initialize OpenAI client with error handling
let openai: OpenAI | null = null
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    console.log('✅ OpenAI client initialized')
  } else {
    console.warn('⚠️ OPENAI_API_KEY not found, AI features will use fallback')
  }
} catch (error) {
  console.error('❌ Failed to initialize OpenAI client:', error)
}

/**
 * Intelligent Gap Analysis for Historical Research Agent
 * 
 * Uses OpenAI to analyze the existing database content and
 * discover meaningful research opportunities and content gaps.
 */

interface ContentGap {
  type: 'category_gap' | 'time_period_gap' | 'theme_gap' | 'connection_gap' | 'perspective_gap' | 'depth_gap'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  suggested_research: {
    mode: string
    themes: string[]
    time_period?: { start: number; end: number }
    categories: string[]
  }
  evidence: {
    current_content_count: number
    related_content_found: number
    gap_size_estimate: string
    civic_importance: string
  }
  ai_reasoning: string
}

interface ResearchOpportunity {
  opportunity_id: string
  title: string
  description: string
  priority_score: number
  research_potential: string
  suggested_approach: {
    research_mode: string
    focus_areas: string[]
    expected_events: number
    time_estimate: string
  }
  civic_education_value: string
  ai_insight: string
}

interface GapAnalysisResult {
  analysis_timestamp: string
  database_content_analyzed: {
    total_topics: number
    total_events: number
    total_questions: number
    time_range_covered: { earliest: number; latest: number }
    categories_covered: string[]
    content_quality_assessment: string
  }
  content_gaps: ContentGap[]
  research_opportunities: ResearchOpportunity[]
  priority_recommendations: string[]
  automated_suggestions: {
    immediate_research: ResearchOpportunity[]
    weekly_goals: ResearchOpportunity[]
    monthly_projects: ResearchOpportunity[]
  }
  ai_analysis_summary: string
  ai_powered: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting AI gap analysis...')
    
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { user } = adminCheck
    console.log(`🔍 Admin user ${user?.email} requesting AI-powered gap analysis`)

    const supabase = await createClient()
    
    // Step 1: Get real database diagnostic data
    console.log('📊 Getting database diagnostic data...')
    let dbAnalysis
    
    try {
      // Try to get database diagnostic data directly from database
      dbAnalysis = await analyzeExistingContent(supabase)
      console.log(`✅ Database analysis complete: ${dbAnalysis.categories_covered.length} categories, ${dbAnalysis.total_topics + dbAnalysis.total_events + dbAnalysis.total_questions} total items`)
    } catch (error) {
      console.error('❌ Error analyzing database content:', error)
      throw new Error(`Database analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Step 2: AI-powered content gap analysis (with fallback)
    console.log('🤖 Running content gap analysis...')
    let aiAnalysis
    
    try {
      if (openai) {
        console.log('🤖 Using OpenAI for gap analysis...')
        aiAnalysis = await runAIGapAnalysis(dbAnalysis)
      } else {
        console.log('📊 Using fallback gap analysis...')
        aiAnalysis = await fallbackGapAnalysisComplete(dbAnalysis)
      }
    } catch (error) {
      console.error('❌ AI analysis failed, using fallback:', error)
      aiAnalysis = await fallbackGapAnalysisComplete(dbAnalysis)
    }
    
    // Step 3: Generate research opportunities
    console.log('💡 Generating research opportunities...')
    let researchOpportunities
    
    try {
      if (openai) {
        researchOpportunities = await generateAIResearchOpportunities(aiAnalysis, dbAnalysis)
      } else {
        researchOpportunities = await generateFallbackResearchOpportunities(aiAnalysis, dbAnalysis)
      }
    } catch (error) {
      console.error('❌ Research opportunities generation failed, using fallback:', error)
      researchOpportunities = await generateFallbackResearchOpportunities(aiAnalysis, dbAnalysis)
    }
    
    // Step 4: Create recommendations
    console.log('📋 Creating recommendations...')
    let recommendations
    
    try {
      if (openai) {
        recommendations = await createAIPriorityRecommendations(researchOpportunities, aiAnalysis.content_gaps)
      } else {
        recommendations = createFallbackRecommendations(researchOpportunities, aiAnalysis.content_gaps)
      }
    } catch (error) {
      console.error('❌ Recommendations generation failed, using fallback:', error)
      recommendations = createFallbackRecommendations(researchOpportunities, aiAnalysis.content_gaps)
    }
    
    // Step 5: Generate automated suggestions
    console.log('🎯 Generating research suggestions...')
    const automatedSuggestions = generateAutomatedSuggestions(researchOpportunities)

    const result: GapAnalysisResult = {
      analysis_timestamp: new Date().toISOString(),
      database_content_analyzed: dbAnalysis,
      content_gaps: aiAnalysis.content_gaps,
      research_opportunities: researchOpportunities,
      priority_recommendations: recommendations,
      automated_suggestions: automatedSuggestions,
      ai_analysis_summary: aiAnalysis.summary,
      ai_powered: !!openai
    }

    console.log(`✅ Gap analysis complete: ${aiAnalysis.content_gaps.length} gaps, ${researchOpportunities.length} opportunities, AI: ${!!openai}`)

    return NextResponse.json({
      success: true,
      data: result,
      summary: {
        total_gaps_identified: aiAnalysis.content_gaps.length,
        high_priority_gaps: aiAnalysis.content_gaps.filter(g => g.priority === 'high').length,
        research_opportunities: researchOpportunities.length,
        immediate_actions: automatedSuggestions.immediate_research.length,
        weekly_goals: automatedSuggestions.weekly_goals.length,
        monthly_projects: automatedSuggestions.monthly_projects.length,
        ai_powered: !!openai,
        database_categories: dbAnalysis.categories_covered.length,
        content_quality: dbAnalysis.content_quality_assessment
      }
    })

  } catch (error) {
    console.error('❌ Critical error in gap analysis:', error)
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      hasOpenAI: !!openai,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: false,
      error: 'AI gap analysis failed',
      details: errorMessage,
      fallback_available: true,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ============================================================================
// AI-POWERED GAP ANALYSIS
// ============================================================================

async function runAIGapAnalysis(dbAnalysis: any): Promise<{ content_gaps: ContentGap[], summary: string }> {
  if (!openai) {
    throw new Error('OpenAI client not available')
  }

  try {
    const prompt = `You are an expert civic education analyst. Analyze this civic education database and identify content gaps.

DATABASE ANALYSIS:
- Total Topics: ${dbAnalysis.total_topics}
- Total Events: ${dbAnalysis.total_events}  
- Total Questions: ${dbAnalysis.total_questions}
- Categories Covered: ${dbAnalysis.categories_covered.slice(0, 50).join(', ')}${dbAnalysis.categories_covered.length > 50 ? '...' : ''}
- Content Quality: ${dbAnalysis.content_quality_assessment}

TASK: Identify 5-8 specific content gaps that would most improve civic education. Focus on essential civic concepts that are missing or underrepresented.

Return ONLY a valid JSON object with this exact structure:
{
  "content_gaps": [
    {
      "type": "category_gap",
      "priority": "high",
      "title": "Gap Title",
      "description": "Clear description of the gap",
      "suggested_research": {
        "mode": "thematic_research",
        "themes": ["Theme 1", "Theme 2"],
        "categories": ["Category 1"]
      },
      "evidence": {
        "current_content_count": 0,
        "related_content_found": 0,
        "gap_size_estimate": "significant",
        "civic_importance": "essential for democracy"
      },
      "ai_reasoning": "Why this gap matters"
    }
  ],
  "summary": "Brief analysis summary"
}`

    console.log('🤖 Sending request to OpenAI...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    })

    const aiResponse = response.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('🤖 AI Response received, parsing...')
    
    // Clean the response to ensure it's valid JSON
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '')
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(cleanedResponse)
    
    // Validate and ensure proper structure
    if (!parsed.content_gaps || !Array.isArray(parsed.content_gaps)) {
      throw new Error('Invalid AI response structure')
    }

    const content_gaps: ContentGap[] = parsed.content_gaps.map((gap: any, index: number) => ({
      type: gap.type || 'theme_gap',
      priority: gap.priority || 'medium',
      title: gap.title || `Gap ${index + 1}`,
      description: gap.description || 'AI-identified content gap',
      suggested_research: {
        mode: gap.suggested_research?.mode || 'thematic_research',
        themes: gap.suggested_research?.themes || [gap.title],
        time_period: gap.suggested_research?.time_period,
        categories: gap.suggested_research?.categories || ['General']
      },
      evidence: {
        current_content_count: gap.evidence?.current_content_count || 0,
        related_content_found: gap.evidence?.related_content_found || 0,
        gap_size_estimate: gap.evidence?.gap_size_estimate || 'significant',
        civic_importance: gap.evidence?.civic_importance || 'important for civic understanding'
      },
      ai_reasoning: gap.ai_reasoning || 'AI-identified based on content analysis'
    }))

    return {
      content_gaps,
      summary: parsed.summary || 'AI analysis completed successfully'
    }

  } catch (error) {
    console.error('❌ Error in AI gap analysis:', error)
    throw error
  }
}

// ============================================================================
// AI-POWERED RESEARCH OPPORTUNITIES
// ============================================================================

async function generateAIResearchOpportunities(aiAnalysis: any, dbAnalysis: any): Promise<ResearchOpportunity[]> {
  if (!openai) {
    throw new Error('OpenAI client not available')
  }

  try {
    const prompt = `Based on the identified content gaps, generate specific research opportunities.

IDENTIFIED GAPS:
${aiAnalysis.content_gaps.map((gap: any, i: number) => 
  `${i + 1}. ${gap.title} (${gap.priority}): ${gap.description}`
).join('\n')}

Generate 6-8 specific research opportunities. Return ONLY valid JSON:
[
  {
    "opportunity_id": "unique_id",
    "title": "Research Title",
    "description": "What to research",
    "priority_score": 75,
    "research_potential": "High potential",
    "suggested_approach": {
      "research_mode": "thematic_research",
      "focus_areas": ["Area 1", "Area 2"],
      "expected_events": 8,
      "time_estimate": "20 minutes"
    },
    "civic_education_value": "Why this matters",
    "ai_insight": "AI reasoning"
  }
]`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1500
    })

    const aiResponse = response.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from OpenAI for research opportunities')
    }

    // Clean and parse response
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '')
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    const opportunities = JSON.parse(cleanedResponse)
    
    // Ensure proper structure
    return opportunities.map((opp: any, index: number) => ({
      opportunity_id: opp.opportunity_id || `ai_opportunity_${index}`,
      title: opp.title || `Research Opportunity ${index + 1}`,
      description: opp.description || 'AI-generated research opportunity',
      priority_score: opp.priority_score || 50,
      research_potential: opp.research_potential || 'Medium potential',
      suggested_approach: {
        research_mode: opp.suggested_approach?.research_mode || 'thematic_research',
        focus_areas: opp.suggested_approach?.focus_areas || ['General Research'],
        expected_events: opp.suggested_approach?.expected_events || 8,
        time_estimate: opp.suggested_approach?.time_estimate || '20 minutes'
      },
      civic_education_value: opp.civic_education_value || 'Enhances civic understanding',
      ai_insight: opp.ai_insight || 'AI-identified research opportunity'
    }))

  } catch (error) {
    console.error('❌ Error generating AI research opportunities:', error)
    throw error
  }
}

// ============================================================================
// AI-POWERED RECOMMENDATIONS
// ============================================================================

async function createAIPriorityRecommendations(opportunities: ResearchOpportunity[], gaps: ContentGap[]): Promise<string[]> {
  if (!openai) {
    throw new Error('OpenAI client not available')
  }

  try {
    const prompt = `Create 5 priority recommendations for a civic education admin.

RESEARCH OPPORTUNITIES: ${opportunities.length} total
TOP OPPORTUNITIES:
${opportunities.slice(0, 3).map(opp => 
  `- ${opp.title} (Score: ${opp.priority_score})`
).join('\n')}

GAPS SUMMARY:
- High priority: ${gaps.filter(g => g.priority === 'high').length}
- Medium priority: ${gaps.filter(g => g.priority === 'medium').length}
- Low priority: ${gaps.filter(g => g.priority === 'low').length}

Return ONLY a JSON array of 5 recommendation strings:
["Recommendation 1", "Recommendation 2", ...]`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800
    })

    const aiResponse = response.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from AI for recommendations')
    }

    // Clean and parse response
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '')
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    return JSON.parse(cleanedResponse)

  } catch (error) {
    console.error('❌ Error creating AI recommendations:', error)
    throw error
  }
}

// ============================================================================
// FALLBACK FUNCTIONS (when AI is not available)
// ============================================================================

async function fallbackGapAnalysisComplete(dbAnalysis: any): Promise<{ content_gaps: ContentGap[], summary: string }> {
  const gaps: ContentGap[] = []

  // Essential categories check
  const essentialCategories = [
    'Constitutional Law', 'Voting Rights', 'Civil Rights', 'Government Structure',
    'Legislative Process', 'Judicial Review', 'Elections', 'Civic Participation'
  ]

  const missingCategories = essentialCategories.filter(cat => 
    !dbAnalysis.categories_covered.includes(cat)
  )

  missingCategories.forEach((category, index) => {
    gaps.push({
      type: 'category_gap',
      priority: index < 3 ? 'high' : 'medium',
      title: `Missing ${category} Content`,
      description: `Essential civic education category "${category}" appears to be underrepresented in the database.`,
      suggested_research: {
        mode: 'thematic_research',
        themes: [category],
        categories: [category]
      },
      evidence: {
        current_content_count: 0,
        related_content_found: 0,
        gap_size_estimate: 'significant',
        civic_importance: 'essential for civic understanding'
      },
      ai_reasoning: `Category analysis shows insufficient coverage of ${category}`
    })
  })

  // Content depth analysis
  if (dbAnalysis.total_topics < 50) {
    gaps.push({
      type: 'depth_gap',
      priority: 'high',
      title: 'Insufficient Topic Depth',
      description: 'Database has fewer than 50 topics, indicating need for more comprehensive content coverage.',
      suggested_research: {
        mode: 'systematic_survey',
        themes: ['General Civic Education'],
        categories: ['Government', 'Elections', 'Civil Rights']
      },
      evidence: {
        current_content_count: dbAnalysis.total_topics,
        related_content_found: dbAnalysis.total_events + dbAnalysis.total_questions,
        gap_size_estimate: 'large',
        civic_importance: 'foundational for civic education'
      },
      ai_reasoning: 'Statistical analysis shows insufficient content depth'
    })
  }

  // Time period gaps (if we can detect them)
  if (dbAnalysis.time_range_covered.latest - dbAnalysis.time_range_covered.earliest < 50) {
    gaps.push({
      type: 'time_period_gap',
      priority: 'medium',
      title: 'Limited Historical Coverage',
      description: 'Content appears to focus on a narrow time period, missing important historical context.',
      suggested_research: {
        mode: 'period_focus',
        themes: ['Historical Context'],
        time_period: { start: 1900, end: 2024 },
        categories: ['Historical Precedent']
      },
      evidence: {
        current_content_count: dbAnalysis.total_events,
        related_content_found: 0,
        gap_size_estimate: 'moderate',
        civic_importance: 'important for understanding democratic evolution'
      },
      ai_reasoning: 'Time range analysis shows limited historical span'
    })
  }

  return {
    content_gaps: gaps.slice(0, 8), // Limit to reasonable number
    summary: `Fallback analysis identified ${gaps.length} content gaps based on statistical analysis of ${dbAnalysis.categories_covered.length} categories and ${dbAnalysis.total_topics + dbAnalysis.total_events + dbAnalysis.total_questions} total content items.`
  }
}

async function generateFallbackResearchOpportunities(aiAnalysis: any, dbAnalysis: any): Promise<ResearchOpportunity[]> {
  return aiAnalysis.content_gaps.slice(0, 8).map((gap: any, index: number) => ({
    opportunity_id: `fallback_${index}`,
    title: gap.title,
    description: gap.description,
    priority_score: gap.priority === 'high' ? 85 : gap.priority === 'medium' ? 65 : 45,
    research_potential: 'Systematic analysis opportunity',
    suggested_approach: {
      research_mode: gap.suggested_research.mode,
      focus_areas: gap.suggested_research.themes,
      expected_events: 8,
      time_estimate: '20 minutes'
    },
    civic_education_value: gap.evidence.civic_importance,
    ai_insight: `Fallback analysis: ${gap.ai_reasoning}`
  }))
}

function createFallbackRecommendations(opportunities: ResearchOpportunity[], gaps: ContentGap[]): string[] {
  const highPriorityGaps = gaps.filter(g => g.priority === 'high')
  return [
    `📊 Analysis Complete: Found ${gaps.length} content gaps in your civic education database`,
    `🔥 High Priority: ${highPriorityGaps.length} critical gaps need immediate attention`,
    `🎯 Research Ready: ${opportunities.length} specific research opportunities identified`,
    `⭐ Start with: "${opportunities[0]?.title}" (Top priority based on analysis)`,
    `💡 Focus Areas: Complete high-priority research first for maximum civic education impact`
  ]
}

function generateAutomatedSuggestions(opportunities: ResearchOpportunity[]) {
  const sorted = opportunities.sort((a, b) => b.priority_score - a.priority_score)

  return {
    immediate_research: sorted.slice(0, 3).map(opp => ({
      ...opp,
      timing: 'Next 30 minutes - Start with these high-impact opportunities'
    })),
    weekly_goals: sorted.slice(3, 6).map(opp => ({
      ...opp,
      timing: 'This week - Build foundational content in key areas'
    })),
    monthly_projects: sorted.slice(6, 10).map(opp => ({
      ...opp,
      timing: 'This month - Comprehensive coverage expansion'
    }))
  }
}

// ============================================================================
// DATABASE ANALYSIS
// ============================================================================

async function analyzeExistingContent(supabase: any) {
  const analysis = {
    total_topics: 0,
    total_events: 0,
    total_questions: 0,
    time_range_covered: { earliest: 2024, latest: 2024 },
    categories_covered: [] as string[],
    content_quality_assessment: 'Unknown'
  }

  try {
    console.log('📊 Analyzing database content...')
    
    // Get actual counts with error handling
    const [topicsResult, eventsResult, questionsResult] = await Promise.allSettled([
      supabase.from('question_topics').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true })
    ])

    if (topicsResult.status === 'fulfilled') {
      analysis.total_topics = topicsResult.value.count || 0
    }
    if (eventsResult.status === 'fulfilled') {
      analysis.total_events = eventsResult.value.count || 0
    }
    if (questionsResult.status === 'fulfilled') {
      analysis.total_questions = questionsResult.value.count || 0
    }

    // Get sample of categories (limited to prevent memory issues)
    const categorySet = new Set<string>()
    
    try {
      const { data: sampleTopics } = await supabase
        .from('question_topics')
        .select('categories')
        .not('categories', 'is', null)
        .limit(100)

      sampleTopics?.forEach((topic: any) => {
        if (Array.isArray(topic.categories)) {
          topic.categories.forEach((cat: string) => categorySet.add(cat))
        }
      })
    } catch (error) {
      console.warn('Error fetching topic categories:', error)
    }
    
    try {
      const { data: sampleEvents } = await supabase
        .from('events')
        .select('categories')
        .not('categories', 'is', null)
        .limit(100)

      sampleEvents?.forEach((event: any) => {
        if (Array.isArray(event.categories)) {
          event.categories.forEach((cat: string) => categorySet.add(cat))
        }
      })
    } catch (error) {
      console.warn('Error fetching event categories:', error)
    }
    
    try {
      const { data: sampleQuestions } = await supabase
        .from('questions')
        .select('category')
        .not('category', 'is', null)
        .limit(100)

      sampleQuestions?.forEach((question: any) => {
        if (question.category) {
          categorySet.add(question.category)
        }
      })
    } catch (error) {
      console.warn('Error fetching question categories:', error)
    }

    analysis.categories_covered = Array.from(categorySet).sort()
    const totalContent = analysis.total_topics + analysis.total_events + analysis.total_questions
    
    if (totalContent > 500) {
      analysis.content_quality_assessment = 'HAS_SUBSTANTIAL_CONTENT'
    } else if (totalContent > 100) {
      analysis.content_quality_assessment = 'HAS_MODERATE_CONTENT'
    } else if (totalContent > 20) {
      analysis.content_quality_assessment = 'HAS_BASIC_CONTENT'
    } else {
      analysis.content_quality_assessment = 'NEEDS_MORE_CONTENT'
    }

    console.log(`✅ Database analysis: ${totalContent} items, ${analysis.categories_covered.length} categories, ${analysis.content_quality_assessment}`)

  } catch (error) {
    console.error('❌ Error analyzing content:', error)
    analysis.content_quality_assessment = 'ANALYSIS_ERROR'
  }

  return analysis
} 