import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role client to bypass RLS for public discovery
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/learning-pods/discover - Discover public pods
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const search = searchParams.get('search') || ''
    const podType = searchParams.get('type')
    const ageRange = searchParams.get('ageRange')
    const difficulty = searchParams.get('difficulty')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const featured = searchParams.get('featured') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
      .from('pod_discovery')
      .select(`
        id,
        pod_id,
        display_name,
        short_description,
        banner_image_url,
        target_age_range,
        difficulty_level,
        topics_covered,
        search_tags,
        member_count,
        activity_score,
        average_rating,
        total_ratings,
        is_featured,
        pod_type,
        created_at
      `)

    // Apply filters
    if (featured) {
      query = query.eq('is_featured', true)
    }

    if (podType) {
      query = query.eq('pod_type', podType)
    }

    if (ageRange) {
      query = query.eq('target_age_range', ageRange)
    }

    if (difficulty) {
      query = query.eq('difficulty_level', parseInt(difficulty))
    }

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,short_description.ilike.%${search}%`)
    }

    if (tags.length > 0) {
      query = query.overlaps('search_tags', tags)
    }

    // Apply pagination and ordering
    const { data: pods, error } = await query
      .order('activity_score', { ascending: false })
      .order('member_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching discoverable pods:', error)
      return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 })
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('pod_discovery')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({ 
      pods: pods || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error in pod discovery GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 