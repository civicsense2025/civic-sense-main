/**
 * API Route: Create Collection from AI Suggestion
 * 
 * Takes a collection suggestion from the AI agent and creates
 * a full collection with all inherited skills and sources.
 * 
 * @route POST /api/admin/collections/create-from-suggestion
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-access'
import { CollectionOrganizerAgent } from '@/lib/ai/collection-organizer-agent'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { 
  Collection, 
  CollectionItem, 
  CreateCollectionRequest,
  COLLECTION_CATEGORIES 
} from '@/types/collections'

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface CreateFromSuggestionRequest {
  suggestion: {
    suggested_title: string
    suggested_description: string
    suggested_emoji: string
    suggested_slug: string
    primary_theme: string
    theme_confidence: number
    related_themes: string[]
    content_items: Array<{
      id: string
      type: string
      title: string
      description: string
      difficulty_level: number
      estimated_minutes: number
    }>
    content_coherence_score: number
    aggregated_skills: any
    difficulty_range: [number, number]
    total_estimated_minutes: number
    source_diversity_score: number
    suggested_learning_objectives: string[]
    suggested_prerequisites: string[]
    suggested_action_items: string[]
    current_events_relevance: 1 | 2 | 3 | 4 | 5
    political_balance_score: 1 | 2 | 3 | 4 | 5
    suggested_categories: string[]
    suggested_tags: string[]
  }
  options?: {
    status?: 'draft' | 'published'
    auto_publish?: boolean
    custom_modifications?: {
      title?: string
      description?: string
      emoji?: string
      tags?: string[]
      categories?: string[]
    }
  }
}

interface CreateFromSuggestionResponse {
  success: boolean
  collection?: {
    id: string
    title: string
    slug: string
    status: string
    items_count: number
    skills_inherited: number
    estimated_minutes: number
  }
  creation_stats?: {
    processing_time_ms: number
    content_items_added: number
    skills_aggregated: number
    sources_inherited: number
  }
  error?: string
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🏗️ Creating collection from AI suggestion...')
    
    // Parse request body
    const body: CreateFromSuggestionRequest = await request.json()
    
    // Validate request
    if (!body.suggestion) {
      return NextResponse.json(
        { success: false, error: 'Collection suggestion is required' },
        { status: 400 }
      )
    }
    
    // Validate admin access
    const supabase = await createServiceClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check admin permissions
    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()
    
    if (!adminCheck) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    // Check for existing collection with same title or slug
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('id, title, slug')
      .or(`title.eq.${body.suggestion.suggested_title},slug.eq.${body.suggestion.suggested_slug}`)
      .single()
    
    if (existingCollection) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Collection already exists with title "${existingCollection.title}" or slug "${existingCollection.slug}"` 
        },
        { status: 409 }
      )
    }
    
    // Apply custom modifications if provided
    const modifiedSuggestion = applyCustomModifications(body.suggestion, body.options?.custom_modifications)
    
    // Initialize Collection Organizer Agent
    const agent = new CollectionOrganizerAgent()
    
    // Create collection from suggestion
    const collection = await agent.createCollectionFromSuggestion(
      modifiedSuggestion,
      {
        created_by: user.id,
        status: body.options?.status || 'draft',
        auto_publish: body.options?.auto_publish || false
      }
    )
    
    // Get additional stats for response
    const creationStats = await getCreationStats(collection.id, modifiedSuggestion, supabase)
    
    const processingTime = Date.now() - startTime
    
    // Build response
    const response: CreateFromSuggestionResponse = {
      success: true,
      collection: {
        id: collection.id,
        title: collection.title,
        slug: collection.slug,
        status: collection.status,
        items_count: modifiedSuggestion.content_items.length,
        skills_inherited: modifiedSuggestion.aggregated_skills.total_skills || 0,
        estimated_minutes: modifiedSuggestion.total_estimated_minutes
      },
      creation_stats: {
        processing_time_ms: processingTime,
        content_items_added: creationStats.content_items_added,
        skills_aggregated: creationStats.skills_aggregated,
        sources_inherited: creationStats.sources_inherited
      }
    }
    
    console.log(`✅ Created collection "${collection.title}" (${collection.id}) in ${processingTime}ms`)
    
    // Track collection creation analytics
    await trackCollectionCreation(collection, modifiedSuggestion, user.id, supabase)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Error creating collection from suggestion:', error)
    
    const processingTime = Date.now() - startTime
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        creation_stats: {
          processing_time_ms: processingTime,
          content_items_added: 0,
          skills_aggregated: 0,
          sources_inherited: 0
        }
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply custom modifications to the AI suggestion
 */
function applyCustomModifications(
  suggestion: any,
  modifications?: {
    title?: string
    description?: string
    emoji?: string
    tags?: string[]
    categories?: string[]
  }
): any {
  if (!modifications) return suggestion
  
  return {
    ...suggestion,
    ...(modifications.title && { suggested_title: modifications.title }),
    ...(modifications.description && { suggested_description: modifications.description }),
    ...(modifications.emoji && { suggested_emoji: modifications.emoji }),
    ...(modifications.tags && { suggested_tags: modifications.tags }),
    ...(modifications.categories && { suggested_categories: modifications.categories })
  }
}

/**
 * Get detailed creation statistics
 */
async function getCreationStats(
  collectionId: string,
  suggestion: any,
  supabase: any
): Promise<{
  content_items_added: number
  skills_aggregated: number
  sources_inherited: number
}> {
  try {
    // Get collection items count
    const { data: collectionItems } = await supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', collectionId)
    
    // Calculate skills from suggestion
    const skillsCount = suggestion.aggregated_skills?.total_skills || 0
    
    // Estimate sources (would need to implement source tracking)
    const sourcesCount = Math.floor(suggestion.content_items.length * 1.5) // Rough estimate
    
    return {
      content_items_added: collectionItems?.length || 0,
      skills_aggregated: skillsCount,
      sources_inherited: sourcesCount
    }
    
  } catch (error) {
    console.warn('Could not get detailed creation stats:', error)
    return {
      content_items_added: suggestion.content_items.length,
      skills_aggregated: suggestion.aggregated_skills?.total_skills || 0,
      sources_inherited: 0
    }
  }
}

/**
 * Track collection creation for analytics
 */
async function trackCollectionCreation(
  collection: any,
  suggestion: any,
  userId: string,
  supabase: any
): Promise<void> {
  try {
    // Track in collection analytics (if table exists)
    await supabase
      .from('collection_analytics')
      .insert({
        collection_id: collection.id,
        date: new Date().toISOString().split('T')[0],
        views: 0,
        starts: 0,
        completions: 0,
        avg_completion_time_minutes: 0,
        avg_session_time_minutes: 0,
        created_at: new Date().toISOString()
      })
      .single()
    
    // Track AI creation event (if events table exists)
    await supabase
      .from('events')
      .insert({
        event_type: 'ai_collection_created',
        user_id: userId,
        event_data: {
          collection_id: collection.id,
          collection_title: collection.title,
          primary_theme: suggestion.primary_theme,
          theme_confidence: suggestion.theme_confidence,
          content_items_count: suggestion.content_items.length,
          skills_inherited: suggestion.aggregated_skills?.total_skills || 0,
          current_events_relevance: suggestion.current_events_relevance,
          ai_generated: true
        },
        created_at: new Date().toISOString()
      })
    
    console.log(`📊 Tracked creation of AI-generated collection: ${collection.id}`)
    
  } catch (error) {
    // Don't fail the main operation if analytics fail
    console.warn('Could not track collection creation analytics:', error)
  }
}

/**
 * Validate collection suggestion structure
 */
function validateSuggestion(suggestion: any): string | null {
  const required = [
    'suggested_title',
    'suggested_description', 
    'suggested_emoji',
    'suggested_slug',
    'content_items',
    'current_events_relevance'
  ]
  
  for (const field of required) {
    if (!suggestion[field]) {
      return `Missing required field: ${field}`
    }
  }
  
  if (!Array.isArray(suggestion.content_items) || suggestion.content_items.length === 0) {
    return 'Suggestion must include at least one content item'
  }
  
  if (suggestion.current_events_relevance < 1 || suggestion.current_events_relevance > 5) {
    return 'Current events relevance must be between 1 and 5'
  }
  
  return null
}

/**
 * GET handler for retrieving creation statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get recent AI-created collections
    const { data: aiCollections } = await supabase
      .from('collections')
      .select('id, title, created_at, status, view_count, completion_count')
      .order('created_at', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      success: true,
      recent_ai_collections: aiCollections || [],
      stats: {
        total_ai_collections: aiCollections?.length || 0,
        avg_completion_rate: calculateAverageCompletionRate(aiCollections || [])
      }
    })
    
  } catch (error) {
    console.error('Error getting creation stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}

/**
 * Calculate average completion rate for collections
 */
function calculateAverageCompletionRate(collections: any[]): number {
  if (collections.length === 0) return 0
  
  const totalRate = collections.reduce((sum, collection) => {
    const rate = collection.view_count > 0 
      ? (collection.completion_count / collection.view_count) * 100
      : 0
    return sum + rate
  }, 0)
  
  return Math.round(totalRate / collections.length)
} 