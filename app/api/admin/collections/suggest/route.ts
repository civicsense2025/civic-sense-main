/**
 * API Route: Generate Collection Suggestions
 * 
 * Uses the AI Collection Organizer Agent to analyze existing content
 * and suggest thematic collections with inherited skills and sources.
 * 
 * @route POST /api/admin/collections/suggest
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-access'
import { CollectionOrganizerAgent } from '@/lib/ai/collection-organizer-agent'
import { CollectionWorkflowIntegrator } from '@/lib/ai/collection-workflow-integrator'
import { UserBehaviorAnalyzer } from '@/lib/ai/user-behavior-analyzer'
import { MLThemeDetector } from '@/lib/ai/ml-theme-detector'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface SuggestCollectionsRequest {
  content_types?: string[]
  max_suggestions?: number
  min_items_per_collection?: number
  theme_specificity?: 'broad' | 'specific' | 'mixed'
  include_current_events?: boolean
  filter_existing?: boolean
}

interface SuggestCollectionsResponse {
  success: boolean
  suggestions?: any[]
  analysis_stats?: {
    total_content_analyzed: number
    theme_clusters_found: number
    processing_time_ms: number
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
    console.log('🤖 Starting collection suggestion generation...')
    
    // Parse request body
    const body: SuggestCollectionsRequest = await request.json()
    
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
    
    // Initialize Collection Organizer Agent
    const agent = new CollectionOrganizerAgent()
    
    // Generate collection suggestions
    const suggestions = await agent.suggestCollections({
      content_types: body.content_types || ['topic', 'question'],
      max_suggestions: body.max_suggestions || 10,
      min_items_per_collection: body.min_items_per_collection || 3,
      theme_specificity: body.theme_specificity || 'mixed',
      include_current_events: body.include_current_events ?? true
    })
    
    // Filter out suggestions for collections that already exist
    let filteredSuggestions = suggestions
    if (body.filter_existing) {
      filteredSuggestions = await filterExistingSuggestions(suggestions, supabase)
    }
    
    const processingTime = Date.now() - startTime
    
    // Build response
    const response: SuggestCollectionsResponse = {
      success: true,
      suggestions: filteredSuggestions,
      analysis_stats: {
        total_content_analyzed: getTotalContentCount(filteredSuggestions),
        theme_clusters_found: filteredSuggestions.length,
        processing_time_ms: processingTime
      }
    }
    
    console.log(`✅ Generated ${filteredSuggestions.length} collection suggestions in ${processingTime}ms`)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Error generating collection suggestions:', error)
    
    const processingTime = Date.now() - startTime
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analysis_stats: {
          total_content_analyzed: 0,
          theme_clusters_found: 0,
          processing_time_ms: processingTime
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
 * Filter out suggestions for collections that already exist
 */
async function filterExistingSuggestions(
  suggestions: any[],
  supabase: any
): Promise<any[]> {
  try {
    // Get existing collection titles and slugs
    const { data: existingCollections } = await supabase
      .from('collections')
      .select('title, slug')
    
    if (!existingCollections?.length) {
      return suggestions
    }
    
    const existingTitles = new Set(
      existingCollections.map((c: any) => c.title.toLowerCase())
    )
    const existingSlugs = new Set(
      existingCollections.map((c: any) => c.slug)
    )
    
    // Filter out suggestions with similar titles or slugs
    return suggestions.filter(suggestion => {
      const titleMatch = existingTitles.has(suggestion.suggested_title.toLowerCase())
      const slugMatch = existingSlugs.has(suggestion.suggested_slug)
      
      return !titleMatch && !slugMatch
    })
    
  } catch (error) {
    console.warn('Warning: Could not filter existing collections:', error)
    return suggestions
  }
}

/**
 * Calculate total content count from suggestions
 */
function getTotalContentCount(suggestions: any[]): number {
  const uniqueContentIds = new Set<string>()
  
  suggestions.forEach(suggestion => {
    suggestion.content_items?.forEach((item: any) => {
      uniqueContentIds.add(item.id)
    })
  })
  
  return uniqueContentIds.size
}

/**
 * GET handler for retrieving suggestion generation status
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
    
    // Get collection statistics for context
    const { data: stats } = await supabase
      .from('collections')
      .select('id, status, created_at')
    
    const { data: contentStats } = await supabase
      .from('question_topics')
      .select('topic_id, status')
      .eq('status', 'published')
    
    return NextResponse.json({
      success: true,
      stats: {
        total_collections: stats?.length || 0,
        published_collections: stats?.filter(c => c.status === 'published').length || 0,
        available_content: contentStats?.length || 0,
        last_suggestion_run: null // Could track this in database
      }
    })
    
  } catch (error) {
    console.error('Error getting suggestion stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    )
  }
} 