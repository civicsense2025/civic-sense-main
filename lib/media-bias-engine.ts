/**
 * Media Bias Engine
 * 
 * A comprehensive system for tracking, analyzing, and learning from media bias
 * across different news organizations and articles.
 */

import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/database.types'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Define types directly until database types are generated
export interface MediaOrganization {
  id: string
  name: string
  domain: string | null
  alternate_domains: string[]
  organization_type: string
  founding_year?: number | null
  ownership_structure?: string | null
  parent_organization_id?: string | null
  funding_sources?: any
  editorial_stance?: string | null
  stated_values?: string[] | null
  transparency_score?: number | null
  fact_checking_methodology?: string | null
  corrections_policy?: string | null
  logo_url?: string | null
  description?: string | null
  headquarters_location?: string | null
  website_url?: string | null
  social_media_links?: any
  created_at?: string
  updated_at?: string
}

export interface BiasDimension {
  id: string
  dimension_name: string
  dimension_slug: string
  description?: string | null
  scale_type: string
  scale_values: any
  is_active?: boolean
  display_order?: number
  created_at?: string
}

export interface OrganizationBiasScore {
  id: string
  organization_id: string
  dimension_id: string
  current_score: number
  confidence_level: number
  sample_size: number
  score_history?: any
  last_calculated_at?: string
  calculation_method?: string | null
  created_at?: string
  updated_at?: string
}

export interface ArticleBiasAnalysis {
  id: string
  source_metadata_id?: string | null
  organization_id?: string | null
  article_url: string
  article_title?: string | null
  article_author?: string | null
  published_at?: string | null
  dimension_scores: any
  detected_techniques?: any
  factual_claims?: any
  emotional_language_score?: number | null
  overall_bias_score?: number | null
  factual_accuracy_score?: number | null
  source_diversity_score?: number | null
  emotional_manipulation_score?: number | null
  ai_analysis_version?: string | null
  ai_reasoning?: string | null
  ai_confidence?: number | null
  confidence_level?: number | null
  analyzed_at?: string
  analysis_method?: string
  analyzer_id?: string | null
  created_at?: string
}

export interface BiasFeedback {
  id: string
  user_id?: string | null
  guest_token?: string | null
  feedback_type: string
  article_analysis_id?: string | null
  organization_id?: string | null
  dimension_id?: string | null
  suggested_score?: number | null
  agrees_with_assessment?: boolean | null
  feedback_text?: string | null
  evidence_urls?: string[] | null
  user_expertise_level?: string | null
  user_expertise_areas?: string[] | null
  is_verified?: boolean
  verified_by?: string | null
  verification_notes?: string | null
  is_spam?: boolean
  helpfulness_score?: number
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
  updated_at?: string
}

export interface BiasLearningEvent {
  id: string
  event_type: string
  organization_id?: string | null
  dimension_id?: string | null
  old_score?: number | null
  new_score?: number | null
  confidence_change?: number | null
  trigger_type?: string | null
  trigger_id?: string | null
  learning_algorithm_version?: string | null
  feedback_count?: number | null
  article_count?: number | null
  consensus_strength?: number | null
  created_at?: string
}

export interface SourceCredibilityIndicator {
  id: string
  organization_id: string
  pulitzer_prizes?: number
  major_corrections_count?: number
  fabrication_scandals_count?: number
  transparency_report_url?: string | null
  press_freedom_score?: number | null
  press_associations?: string[] | null
  fact_checking_partnerships?: string[] | null
  verified_scoops_count?: number
  major_misreporting_incidents?: any
  updated_at?: string
  created_at?: string
}

export interface BiasScoreWithDimension extends OrganizationBiasScore {
  dimension?: BiasDimension
}

export interface MediaOrganizationWithScores extends MediaOrganization {
  bias_scores?: BiasScoreWithDimension[]
  credibility?: SourceCredibilityIndicator
}

export interface ArticleWithBiasAnalysis {
  url: string
  title: string
  organization: MediaOrganization
  analysis?: ArticleBiasAnalysis
  source_metadata?: Tables<'source_metadata'>
}

export interface BiasFeedbackRequest {
  feedback_type: 'article' | 'organization' | 'dimension_score'
  article_analysis_id?: string
  organization_id?: string
  dimension_id?: string
  suggested_score?: number
  agrees_with_assessment?: boolean
  feedback_text?: string
  evidence_urls?: string[]
  user_expertise_level?: 'novice' | 'intermediate' | 'expert' | 'professional'
  user_expertise_areas?: string[]
}

// Bias dimension slugs for easy reference
export const BIAS_DIMENSIONS = {
  POLITICAL_LEAN: 'political-lean',
  FACTUAL_ACCURACY: 'factual-accuracy',
  SENSATIONALISM: 'sensationalism',
  CORPORATE_INFLUENCE: 'corporate-influence',
  ESTABLISHMENT_BIAS: 'establishment-bias'
} as const

// Scale value helpers
export function getBiasLabel(dimension: BiasDimension, score: number): string {
  const scaleValues = dimension.scale_values as any
  if (dimension.scale_type === 'spectrum' && scaleValues.labels) {
    // Find the closest label
    let closestLabel = 'unknown'
    let closestDistance = Infinity
    
    for (const [label, value] of Object.entries(scaleValues.labels)) {
      const distance = Math.abs(score - (value as number))
      if (distance < closestDistance) {
        closestDistance = distance
        closestLabel = label
      }
    }
    
    return closestLabel
  }
  
  return score.toString()
}

export function getBiasColor(dimension: BiasDimension, score: number): string {
  if (dimension.dimension_slug === BIAS_DIMENSIONS.POLITICAL_LEAN) {
    if (score < -66) return '#1e40af' // Far left - blue
    if (score < -33) return '#3b82f6' // Left
    if (score < 33) return '#6b7280' // Center - gray
    if (score < 66) return '#ef4444' // Right
    return '#991b1b' // Far right - red
  }
  
  if (dimension.dimension_slug === BIAS_DIMENSIONS.FACTUAL_ACCURACY) {
    if (score < 25) return '#dc2626' // Very low - red
    if (score < 50) return '#f59e0b' // Low - amber
    if (score < 75) return '#eab308' // Mixed - yellow
    return '#22c55e' // High - green
  }
  
  // Default gradient for other dimensions
  const normalized = Math.max(0, Math.min(100, score))
  const hue = (normalized / 100) * 120 // 0 = red, 120 = green
  return `hsl(${hue}, 70%, 50%)`
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get or create a media organization from a domain
 */
export async function getOrCreateMediaOrganization(
  domain: string,
  name?: string
): Promise<MediaOrganization | null> {
  
  const { data, error } = await supabase.rpc('get_or_create_media_organization', {
    p_domain: domain,
    p_name: name
  })
  
  if (error) {
    console.error('Error getting/creating media organization:', error)
    return null
  }
  
  // Fetch the full organization data
  const { data: org } = await supabase
    .from('media_organizations')
    .select('*')
    .eq('id', data)
    .single()
  
  return org as MediaOrganization | null
}

/**
 * Get media organization with all bias scores
 */
export async function getMediaOrganizationWithScores(
  organizationId: string
): Promise<MediaOrganizationWithScores | null> {
  
  const { data, error } = await supabase
    .from('media_organizations')
    .select(`
      *,
      bias_scores:organization_bias_scores(
        *,
        dimension:bias_dimensions(*)
      ),
      credibility:source_credibility_indicators(*)
    `)
    .eq('id', organizationId)
    .single()
  
  if (error) {
    console.error('Error fetching organization with scores:', error)
    return null
  }
  
  return data as MediaOrganizationWithScores
}

/**
 * Get media organization by domain
 */
export async function getMediaOrganizationByDomain(
  domain: string
): Promise<MediaOrganizationWithScores | null> {
  
  // Clean domain
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '')
  
  const { data, error } = await supabase
    .from('media_organizations')
    .select(`
      *,
      bias_scores:organization_bias_scores(
        *,
        dimension:bias_dimensions(*)
      ),
      credibility:source_credibility_indicators(*)
    `)
    .or(`domain.eq.${cleanDomain},alternate_domains.cs.{${cleanDomain}}`)
    .single()
  
  if (error) {
    console.error('Error fetching organization by domain:', error)
    return null
  }
  
  return data as MediaOrganizationWithScores
}

/**
 * Get all active bias dimensions
 */
export async function getBiasDimensions(): Promise<BiasDimension[]> {
  
  const { data, error } = await supabase
    .from('bias_dimensions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching bias dimensions:', error)
    return []
  }
  
  return (data || []) as BiasDimension[]
}

/**
 * Analyze article bias using AI
 */
export async function analyzeArticleBias(
  articleUrl: string,
  organizationId: string,
  sourceMetadataId?: string
): Promise<ArticleBiasAnalysis | null> {
  try {
    // Use the API endpoint for comprehensive analysis
    const response = await fetch('/api/analyze-article-bias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        articleUrl,
        organizationId,
        sourceMetadataId
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error analyzing article:', error)
      
      // Fall back to simple database entry if API fails
      const dimensions = await getBiasDimensions()
      const dimensionScores: any = {}
      
      // Create minimal placeholder scores
      dimensions.forEach(dim => {
        dimensionScores[dim.id] = {
          score: 0,
          confidence: 0.1,
          indicators: ['Analysis pending']
        }
      })
      
      const { data, error: dbError } = await supabase
        .from('article_bias_analysis')
        .insert({
          source_metadata_id: sourceMetadataId,
          organization_id: organizationId,
          article_url: articleUrl,
          dimension_scores: dimensionScores,
          analysis_method: 'pending',
          ai_analysis_version: 'fallback_v1',
          ai_confidence: 0.1,
          ai_reasoning: 'Analysis pending - API temporarily unavailable'
        })
        .select()
        .single()
      
      if (dbError) {
        console.error('Error creating fallback analysis:', dbError)
        return null
      }
      
      return data as ArticleBiasAnalysis
    }
    
    const result = await response.json()
    return result.analysis as ArticleBiasAnalysis
    
  } catch (error) {
    console.error('Error in analyzeArticleBias:', error)
    return null
  }
}

/**
 * Submit bias feedback
 */
export async function submitBiasFeedback(
  feedback: BiasFeedbackRequest,
  userId?: string,
  guestToken?: string
): Promise<boolean> {
  
  const { error } = await supabase
    .from('bias_feedback')
    .insert({
      user_id: userId,
      guest_token: guestToken,
      ...feedback,
      ip_address: null, // Will be set server-side
      user_agent: navigator.userAgent
    })
  
  if (error) {
    console.error('Error submitting bias feedback:', error)
    return false
  }
  
  return true
}

/**
 * Get recent bias learning events for an organization
 */
export async function getOrganizationLearningEvents(
  organizationId: string,
  limit = 10
): Promise<BiasLearningEvent[]> {
  
  const { data, error } = await supabase
    .from('bias_learning_events')
    .select(`
      *,
      dimension:bias_dimensions(*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching learning events:', error)
    return []
  }
  
  return (data || []) as BiasLearningEvent[]
}

/**
 * Vote on bias feedback helpfulness
 */
export async function voteFeedbackHelpfulness(
  feedbackId: string,
  isHelpful: boolean
): Promise<boolean> {
  
  const { error } = await supabase.rpc('increment', {
    table_name: 'bias_feedback',
    column_name: 'helpfulness_score',
    row_id: feedbackId,
    increment_by: isHelpful ? 1 : -1
  })
  
  if (error) {
    console.error('Error voting on feedback:', error)
    return false
  }
  
  return true
}

/**
 * Get bias consensus for an organization
 */
export async function getBiasConsensus(
  organizationId: string,
  dimensionId: string,
  timeWindow = '30 days'
): Promise<{
  consensus_score: number
  confidence_level: number
  sample_size: number
  agreement_rate: number
} | null> {
  
  const { data, error } = await supabase.rpc('calculate_bias_consensus', {
    p_organization_id: organizationId,
    p_dimension_id: dimensionId,
    p_time_window: timeWindow
  })
  
  if (error) {
    console.error('Error calculating bias consensus:', error)
    return null
  }
  
  return data?.[0] || null
}

/**
 * Search media organizations
 */
export async function searchMediaOrganizations(
  query: string
): Promise<MediaOrganization[]> {
  
  const { data, error } = await supabase
    .from('media_organizations')
    .select('*')
    .or(`name.ilike.%${query}%,domain.ilike.%${query}%`)
    .limit(10)
  
  if (error) {
    console.error('Error searching organizations:', error)
    return []
  }
  
  return (data || []) as MediaOrganization[]
}

/**
 * Get article bias analysis by URL
 */
export async function getArticleBiasAnalysis(
  articleUrl: string
): Promise<ArticleBiasAnalysis | null> {
  
  const { data, error } = await supabase
    .from('article_bias_analysis')
    .select(`
      *,
      organization:media_organizations(*)
    `)
    .eq('article_url', articleUrl)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    console.error('Error fetching article analysis:', error)
    return null
  }
  
  return data as ArticleBiasAnalysis
}

/**
 * Update organization bias scores from articles
 */
export async function updateOrganizationBiasFromArticles(
  organizationId: string
): Promise<boolean> {
  
  const { error } = await supabase.rpc('update_organization_bias_from_articles', {
    p_organization_id: organizationId
  })
  
  if (error) {
    console.error('Error updating organization bias:', error)
    return false
  }
  
  return true
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format bias score for display
 */
export function formatBiasScore(score: number, dimension: BiasDimension): string {
  const label = getBiasLabel(dimension, score)
  
  if (dimension.dimension_slug === BIAS_DIMENSIONS.POLITICAL_LEAN) {
    return `${label} (${score > 0 ? '+' : ''}${score.toFixed(0)})`
  }
  
  return `${label} (${score.toFixed(0)}%)`
}

/**
 * Get credibility level from score
 */
export function getCredibilityLevel(score?: number): {
  level: string
  color: string
  description: string
} {
  if (!score) {
    return {
      level: 'Unknown',
      color: 'gray',
      description: 'No credibility data available'
    }
  }
  
  if (score >= 90) {
    return {
      level: 'Very High',
      color: 'green',
      description: 'Exceptional track record of accuracy'
    }
  } else if (score >= 80) {
    return {
      level: 'High',
      color: 'blue',
      description: 'Generally reliable and accurate'
    }
  } else if (score >= 70) {
    return {
      level: 'Mixed',
      color: 'yellow',
      description: 'Some credibility concerns'
    }
  } else if (score >= 60) {
    return {
      level: 'Low',
      color: 'orange',
      description: 'Significant credibility issues'
    }
  }
  
  return {
    level: 'Very Low',
    color: 'red',
    description: 'Serious credibility problems'
  }
}

/**
 * Check if bias score indicates significant bias
 */
export function hasSignificantBias(
  score: number,
  dimension: BiasDimension,
  threshold = 33
): boolean {
  if (dimension.dimension_slug === BIAS_DIMENSIONS.POLITICAL_LEAN) {
    return Math.abs(score) > threshold
  }
  
  // For other dimensions, higher scores indicate more bias
  return score > threshold
}

/**
 * Get organization type display name
 */
export function getOrganizationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    news_outlet: 'News Outlet',
    independent_journalist: 'Independent Journalist',
    think_tank: 'Think Tank',
    government: 'Government Source',
    advocacy_group: 'Advocacy Group'
  }
  
  return labels[type] || type
} 