import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { 
  getMediaOrganizationByDomain, 
  getBiasDimensions,
  type BiasDimension,
  type MediaOrganizationWithScores 
} from '@civicsense/shared/lib/media-bias-engine'

interface SourceAnalysis {
  url: string
  name: string
  domain: string
  organization?: MediaOrganizationWithScores
  biasScores?: {
    political_lean?: number
    factual_accuracy?: number
    sensationalism?: number
  }
}

interface TopicAnalysis {
  topicId: string
  topicTitle: string
  totalQuestions: number
  sourcedQuestions: number
  uniqueSources: number
  sourceAnalysis: SourceAnalysis[]
  diversityMetrics: {
    politicalBalance: number // 0-100, higher is more balanced
    politicalDiversity: number // Standard deviation of political scores
    factualAccuracyAvg: number // Average factual accuracy
    sensationalismAvg: number // Average sensationalism
  }
  recommendations: string[]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const topicId = searchParams.get('topicId')
  const analyzeAll = searchParams.get('all') === 'true'

  const supabase = await createClient()

  try {
    // Get bias dimensions
    const dimensions = await getBiasDimensions()
    const politicalDimension = dimensions.find(d => d.dimension_slug === 'political_lean')
    const factualDimension = dimensions.find(d => d.dimension_slug === 'factual_accuracy')
    const sensationalismDimension = dimensions.find(d => d.dimension_slug === 'sensationalism')

    if (topicId && !analyzeAll) {
      // Analyze single topic
      const analysis = await analyzeTopicBias(topicId, supabase, {
        politicalDimension,
        factualDimension,
        sensationalismDimension
      })
      
      return NextResponse.json(analysis)
    } else if (analyzeAll) {
      // Analyze all topics
      const { data: topics, error: topicsError } = await supabase
        .from('question_topics')
        .select('topic_id, topic_title')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50)

      if (topicsError) throw topicsError

      const analyses = await Promise.all(
        topics.map((topic: { topic_id: string; topic_title: string }) => 
          analyzeTopicBias(topic.topic_id, supabase, {
            politicalDimension,
            factualDimension,
            sensationalismDimension
          })
        )
      )

      // Sort by least diverse first (needs improvement)
      analyses.sort((a: TopicAnalysis, b: TopicAnalysis) => {
        const aScore = a.diversityMetrics.politicalBalance + a.diversityMetrics.factualAccuracyAvg
        const bScore = b.diversityMetrics.politicalBalance + b.diversityMetrics.factualAccuracyAvg
        return aScore - bScore
      })

      return NextResponse.json({
        totalTopics: analyses.length,
        averageMetrics: {
          politicalBalance: average(analyses.map((a: TopicAnalysis) => a.diversityMetrics.politicalBalance)),
          factualAccuracyAvg: average(analyses.map((a: TopicAnalysis) => a.diversityMetrics.factualAccuracyAvg)),
          uniqueSourcesAvg: average(analyses.map((a: TopicAnalysis) => a.uniqueSources))
        },
        topics: analyses
      })
    } else {
      return NextResponse.json(
        { error: 'Please provide a topicId or set all=true' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error analyzing media bias:', error)
    return NextResponse.json(
      { error: 'Failed to analyze media bias' },
      { status: 500 }
    )
  }
}

async function analyzeTopicBias(
  topicId: string, 
  supabase: any,
  dimensions: {
    politicalDimension?: BiasDimension
    factualDimension?: BiasDimension
    sensationalismDimension?: BiasDimension
  }
): Promise<TopicAnalysis> {
  // Get topic details
  const { data: topic, error: topicError } = await supabase
    .from('question_topics')
    .select('topic_title')
    .eq('topic_id', topicId)
    .single()

  if (topicError) throw topicError

  // Get questions with sources
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('question_number, sources')
    .eq('topic_id', topicId)
    .eq('is_active', true)

  if (questionsError) throw questionsError

  // Extract and analyze sources
  const sourceMap = new Map<string, SourceAnalysis>()
  let sourcedQuestions = 0

  for (const question of questions) {
    if (question.sources && Array.isArray(question.sources) && question.sources.length > 0) {
      sourcedQuestions++
      
      for (const source of question.sources) {
        if (source.url) {
          const domain = extractDomain(source.url)
          
          if (!sourceMap.has(domain)) {
            // Get organization data
            const org = await getMediaOrganizationByDomain(domain)
            
            const analysis: SourceAnalysis = {
              url: source.url,
              name: source.name || domain,
              domain,
              organization: org || undefined
            }

            if (org && org.bias_scores) {
              analysis.biasScores = {}
              
              for (const score of org.bias_scores) {
                if (score.dimension?.dimension_slug === 'political_lean') {
                  analysis.biasScores.political_lean = score.current_score
                } else if (score.dimension?.dimension_slug === 'factual_accuracy') {
                  analysis.biasScores.factual_accuracy = score.current_score
                } else if (score.dimension?.dimension_slug === 'sensationalism') {
                  analysis.biasScores.sensationalism = score.current_score
                }
              }
            }

            sourceMap.set(domain, analysis)
          }
        }
      }
    }
  }

  const sourceAnalyses = Array.from(sourceMap.values())
  
  // Calculate diversity metrics
  const politicalScores = sourceAnalyses
    .map(s => s.biasScores?.political_lean)
    .filter((score): score is number => score !== undefined)
  
  const factualScores = sourceAnalyses
    .map(s => s.biasScores?.factual_accuracy)
    .filter((score): score is number => score !== undefined)
  
  const sensationalismScores = sourceAnalyses
    .map(s => s.biasScores?.sensationalism)
    .filter((score): score is number => score !== undefined)

  const diversityMetrics = {
    politicalBalance: calculatePoliticalBalance(politicalScores),
    politicalDiversity: calculateStandardDeviation(politicalScores),
    factualAccuracyAvg: average(factualScores),
    sensationalismAvg: average(sensationalismScores)
  }

  // Generate recommendations
  const recommendations = generateRecommendations(
    sourceAnalyses,
    diversityMetrics,
    sourcedQuestions,
    questions.length
  )

  return {
    topicId,
    topicTitle: topic.topic_title,
    totalQuestions: questions.length,
    sourcedQuestions,
    uniqueSources: sourceAnalyses.length,
    sourceAnalysis: sourceAnalyses,
    diversityMetrics,
    recommendations
  }
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((a, b) => a + b, 0) / numbers.length
}

function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0
  const avg = average(numbers)
  const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2))
  return Math.sqrt(average(squaredDiffs))
}

function calculatePoliticalBalance(scores: number[]): number {
  if (scores.length === 0) return 0
  if (scores.length === 1) return 0 // Single source = no balance
  
  const avg = average(scores)
  const diversity = calculateStandardDeviation(scores)
  
  // Balance is high when average is near center (0) and there's good diversity
  const centeredness = 100 - Math.abs(avg) // 100 at center, 0 at extremes
  const diversityBonus = Math.min(diversity / 2, 25) // Up to 25 bonus points for diversity
  
  return Math.max(0, Math.min(100, centeredness * 0.75 + diversityBonus))
}

function generateRecommendations(
  sources: SourceAnalysis[],
  metrics: TopicAnalysis['diversityMetrics'],
  sourcedQuestions: number,
  totalQuestions: number
): string[] {
  const recommendations: string[] = []

  // Check for missing sources
  if (sourcedQuestions < totalQuestions) {
    recommendations.push(
      `Add sources to ${totalQuestions - sourcedQuestions} questions that currently lack citations`
    )
  }

  // Check for low source diversity
  if (sources.length < 3 && sourcedQuestions > 0) {
    recommendations.push(
      'Increase source diversity by citing at least 3 different news organizations'
    )
  }

  // Check political balance
  if (metrics.politicalBalance < 50) {
    const politicalScores = sources
      .map(s => s.biasScores?.political_lean)
      .filter((s): s is number => s !== undefined)
    
    const avgLean = average(politicalScores)
    
    if (avgLean < -30) {
      recommendations.push(
        'Add sources from center or right-leaning outlets to balance left-leaning coverage'
      )
    } else if (avgLean > 30) {
      recommendations.push(
        'Add sources from center or left-leaning outlets to balance right-leaning coverage'
      )
    } else {
      recommendations.push(
        'Increase political diversity by including sources from across the political spectrum'
      )
    }
  }

  // Check factual accuracy
  if (metrics.factualAccuracyAvg < 80 && metrics.factualAccuracyAvg > 0) {
    recommendations.push(
      'Consider adding sources with higher factual accuracy ratings (e.g., wire services, fact-checking organizations)'
    )
  }

  // Check sensationalism
  if (metrics.sensationalismAvg > 50 && metrics.sensationalismAvg > 0) {
    recommendations.push(
      'Balance sensational sources with more neutral, fact-focused reporting'
    )
  }

  // No bias data available
  const sourcesWithoutBias = sources.filter(s => !s.organization)
  if (sourcesWithoutBias.length > sources.length / 2) {
    recommendations.push(
      `Add bias data for ${sourcesWithoutBias.length} unrecognized sources: ${
        sourcesWithoutBias.slice(0, 3).map(s => s.domain).join(', ')
      }${sourcesWithoutBias.length > 3 ? '...' : ''}`
    )
  }

  if (recommendations.length === 0) {
    recommendations.push('Great source diversity! Consider maintaining this balance in future updates.')
  }

  return recommendations
} 