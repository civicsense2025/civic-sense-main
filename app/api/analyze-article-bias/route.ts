import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { getBiasDimensions } from '@/lib/media-bias-engine'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Server-side Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BIAS_ANALYSIS_PROMPT = `You are CivicSense's media bias analyst. We tell uncomfortable truths about how power actually works in America.

Analyze this article with our brand voice:
- Uncompromisingly honest about bias and manipulation techniques
- Urgently direct about why this matters for democracy
- Confidently accessible - translate complexity without dumbing down
- Relentlessly practical - what can readers DO with this knowledge
- Evidence over opinion - cite specific examples from the article

Your analysis should:
1. Extract all article metadata (title, author, published date, key claims)
2. Identify bias across these dimensions:
   - Political Lean: Where on the spectrum (-100 far left to +100 far right)
   - Factual Accuracy: How committed to facts vs speculation (0-100)
   - Sensationalism: Emotional manipulation vs sober analysis (0-100)
   - Corporate Influence: Independence vs corporate capture (0-100)
   - Establishment Bias: Anti-establishment (-100) to pro-establishment (+100)

3. Detect manipulation techniques and extract civic education content:
   - Loaded language and emotional triggers
   - Cherry-picked statistics
   - False equivalencies
   - Missing context that changes the story
   - Sources with undisclosed conflicts of interest

4. Extract civic education content:
   - Question topics for quiz generation (government processes, policies, institutions mentioned)
   - Public figures mentioned (politicians, officials, activists, judges, etc.)
   - Important events (elections, legislation, court cases, protests, policy changes)

5. Identify factual claims and verify what can be checked
6. Calculate emotional language score (0-100)

Remember: We're not afraid to call out bias from ANY source. If the New York Times is carrying water for the establishment, we say so. If Fox News is spreading demonstrable lies, we document it.

Be specific. Name names. Show receipts. This is civic education for people who want to understand power, not just consume news.`

interface BiasAnalysisRequest {
  articleUrl: string
  organizationId: string
  sourceMetadataId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { articleUrl, organizationId, sourceMetadataId }: BiasAnalysisRequest = await request.json()
    
    if (!articleUrl || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Step 1: Use OpenAI to fetch and analyze the article
    const searchResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: BIAS_ANALYSIS_PROMPT
        },
        {
          role: "user",
          content: `Analyze this article for bias: ${articleUrl}

Use web search to read the full article and extract:
1. Complete metadata (title, author, publication date)
2. Main claims and arguments
3. Sources cited and their credibility
4. Bias indicators across all dimensions
5. Specific manipulation techniques with quoted examples

Format your response as JSON with these exact fields:
{
  "metadata": {
    "title": "exact article title",
    "author": "author name or null",
    "published_date": "ISO date or null",
    "main_claims": ["claim 1", "claim 2"],
    "word_count": estimated number
  },
  "bias_scores": {
    "political_lean": { "score": -100 to 100, "confidence": 0-1, "evidence": ["specific quotes"] },
    "factual_accuracy": { "score": 0-100, "confidence": 0-1, "evidence": ["specific examples"] },
    "sensationalism": { "score": 0-100, "confidence": 0-1, "evidence": ["loaded language examples"] },
    "corporate_influence": { "score": 0-100, "confidence": 0-1, "evidence": ["funding/ad considerations"] },
    "establishment_bias": { "score": -100 to 100, "confidence": 0-1, "evidence": ["power dynamics"] }
  },
  "manipulation_techniques": [
    { "technique": "name", "severity": "low/medium/high", "example": "specific quote" }
  ],
  "civic_education_content": {
    "question_topics": [
      { "name": "topic name", "description": "what this covers", "category": "Government|Elections|Policy|Rights", "difficulty": "beginner|intermediate|advanced", "level": "local|state|federal|international" }
    ],
    "public_figures": [
      { "name": "full name", "role": "position/title", "party": "political party or null", "level": "local|state|federal|international", "description": "brief description of relevance" }
    ],
    "events": [
      { "name": "event name", "date": "ISO date or null", "type": "election|legislation|court_case|protest|policy_change|other", "significance": "low|medium|high|critical", "description": "why this matters" }
    ]
  },
  "civic_education_content": {
    "question_topics": [
      { "name": "topic name", "description": "what this teaches", "category": "government/policy/elections", "difficulty": "beginner/intermediate/advanced", "level": "local/state/federal/international" }
    ],
    "public_figures": [
      { "name": "full name", "role": "position/title", "party": "party or null", "level": "local/state/federal/international", "description": "why they matter" }
    ],
    "events": [
      { "name": "event name", "date": "date or null", "type": "election/legislation/court_case/protest/policy_change/other", "significance": "low/medium/high/critical", "description": "impact and importance" }
    ]
  },
  "factual_claims": [
    { "claim": "specific claim", "verifiable": true/false, "verification": "how to check" }
  ],
  "emotional_language_score": 0-100,
  "ai_reasoning": "Detailed explanation in CivicSense voice about what's really going on",
  "civic_action": "What readers should DO with this information"
}`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 8000
    })

    const analysisText = searchResponse.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis returned from OpenAI')
    }

    // Parse the JSON response
    let analysis
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      analysis = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', analysisText)
      throw new Error('Invalid response format from OpenAI')
    }

    // Step 2: Get bias dimensions from database
    const dimensions = await getBiasDimensions()
    const dimensionMap = new Map(dimensions.map(d => [d.dimension_slug, d]))

    // Step 3: Format dimension scores for database
    const dimensionScores: Record<string, any> = {}
    
    // Map analysis scores to dimension IDs
    const scoreMappings = [
      { slug: 'political-lean', key: 'political_lean' },
      { slug: 'factual-accuracy', key: 'factual_accuracy' },
      { slug: 'sensationalism', key: 'sensationalism' },
      { slug: 'corporate-influence', key: 'corporate_influence' },
      { slug: 'establishment-bias', key: 'establishment_bias' }
    ]

    for (const mapping of scoreMappings) {
      const dimension = dimensionMap.get(mapping.slug)
      if (dimension && analysis.bias_scores[mapping.key]) {
        dimensionScores[dimension.id] = {
          score: analysis.bias_scores[mapping.key].score,
          confidence: analysis.bias_scores[mapping.key].confidence,
          indicators: analysis.bias_scores[mapping.key].evidence
        }
      }
    }

    // Step 4: Calculate overall bias metrics
    const overallBiasScore = calculateOverallBias(analysis.bias_scores)
    const factualAccuracyScore = analysis.bias_scores.factual_accuracy.score
    const sourceDiversityScore = calculateSourceDiversity(analysis.factual_claims)
    const emotionalManipulationScore = analysis.emotional_language_score

    // Step 5: Save to database
    const { data, error } = await supabase
      .from('article_bias_analysis')
      .insert({
        source_metadata_id: sourceMetadataId,
        organization_id: organizationId,
        article_url: articleUrl,
        article_title: analysis.metadata.title,
        article_author: analysis.metadata.author,
        published_at: analysis.metadata.published_date,
        dimension_scores: dimensionScores,
        detected_techniques: analysis.manipulation_techniques,
        factual_claims: analysis.factual_claims,
        emotional_language_score: analysis.emotional_language_score,
        overall_bias_score: overallBiasScore,
        factual_accuracy_score: factualAccuracyScore,
        source_diversity_score: sourceDiversityScore,
        emotional_manipulation_score: emotionalManipulationScore,
        ai_analysis_version: 'openai_gpt4o_v1',
        ai_reasoning: analysis.ai_reasoning,
        ai_confidence: calculateOverallConfidence(analysis.bias_scores),
        confidence_level: calculateOverallConfidence(analysis.bias_scores),
        analysis_method: 'ai_enhanced'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to save analysis to database')
    }

    // Step 6: Return enhanced response with civic action
    return NextResponse.json({
      success: true,
      analysis: data,
      insights: {
        overall_bias: overallBiasScore > 33 ? 'significant' : 'moderate',
        primary_concern: identifyPrimaryConcern(analysis),
        civic_action: analysis.civic_action,
        share_message: generateShareMessage(analysis)
      }
    })

  } catch (error) {
    console.error('Error analyzing article bias:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze article', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateOverallBias(biasScores: any): number {
  // Weight different bias types
  const weights = {
    political_lean: 0.3,
    factual_accuracy: 0.3,
    sensationalism: 0.2,
    corporate_influence: 0.1,
    establishment_bias: 0.1
  }
  
  let totalBias = 0
  totalBias += Math.abs(biasScores.political_lean.score) * weights.political_lean
  totalBias += (100 - biasScores.factual_accuracy.score) * weights.factual_accuracy
  totalBias += biasScores.sensationalism.score * weights.sensationalism
  totalBias += biasScores.corporate_influence.score * weights.corporate_influence
  totalBias += Math.abs(biasScores.establishment_bias.score) * weights.establishment_bias
  
  return Math.round(totalBias)
}

function calculateOverallConfidence(biasScores: any): number {
  const scores = Object.values(biasScores).map((s: any) => s.confidence)
  return scores.reduce((a: number, b: number) => a + b, 0) / scores.length
}

function calculateSourceDiversity(factualClaims: any[]): number {
  if (!factualClaims || factualClaims.length === 0) return 0
  
  const verifiableClaims = factualClaims.filter(c => c.verifiable)
  const diversityScore = (verifiableClaims.length / factualClaims.length) * 100
  
  return Math.round(diversityScore)
}

function identifyPrimaryConcern(analysis: any): string {
  const concerns = []
  
  if (Math.abs(analysis.bias_scores.political_lean.score) > 66) {
    concerns.push('extreme political bias')
  }
  if (analysis.bias_scores.factual_accuracy.score < 50) {
    concerns.push('factual accuracy issues')
  }
  if (analysis.bias_scores.sensationalism.score > 70) {
    concerns.push('emotional manipulation')
  }
  if (analysis.bias_scores.corporate_influence.score > 70) {
    concerns.push('corporate capture')
  }
  
  return concerns[0] || 'moderate bias detected'
}

function generateShareMessage(analysis: any): string {
  const concern = identifyPrimaryConcern(analysis)
  return `This article shows ${concern}. Here's what they don't want you to know: ${analysis.metadata.title.substring(0, 50)}...`
} 