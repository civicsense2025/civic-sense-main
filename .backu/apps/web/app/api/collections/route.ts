import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Collection, CollectionFilters, CreateCollectionRequest } from '@/types/collections'

// GET /api/collections - List collections with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = await createClient()
    
    // Parse filters from query params
    const filters: CollectionFilters = {
      status: searchParams.get('status') as any || 'published',
      is_featured: searchParams.get('featured') === 'true' ? true : undefined,
      difficulty_level: searchParams.get('difficulty')?.split(',').map(Number) || undefined,
      categories: searchParams.get('categories')?.split(',') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') as any || 'created_at',
      sort_order: searchParams.get('sort_order') as any || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      skills: searchParams.get('skills')?.split(',') || undefined,
      skill_categories: searchParams.get('skill_categories')?.split(',') || undefined,
      include_skills: searchParams.get('include_skills') === 'true'
    }

    // Build query
    let query = supabase
      .from('collections')
      .select(`
        *,
        items_count:collection_items(count)
      `)

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.is_featured) {
      query = query.eq('is_featured', filters.is_featured)
    }

    if (filters.difficulty_level && filters.difficulty_level.length > 0) {
      query = query.in('difficulty_level', filters.difficulty_level)
    }

    if (filters.categories && filters.categories.length > 0) {
      query = query.overlaps('categories', filters.categories)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Filter by skills - need to use RPC function for this
    let skillFilteredIds: string[] | null = null
    if (filters.skills && filters.skills.length > 0) {
      // Get collections that have these skills
      const { data: skillCollections } = await supabase
        .rpc('get_collections_with_skills', { 
          skill_ids: filters.skills 
        })
      
      if (skillCollections) {
        skillFilteredIds = skillCollections.map((c: any) => c.collection_id)
        if (skillFilteredIds && skillFilteredIds.length > 0) {
          query = query.in('id', skillFilteredIds)
        } else {
          // No collections match the skill filter
          return NextResponse.json({
            collections: [],
            total: 0,
            page: 1,
            pages: 0
          })
        }
      }
    }

    // Filter by skill categories
    if (filters.skill_categories && filters.skill_categories.length > 0) {
      // Get collections that have skills in these categories
      const { data: categoryCollections } = await supabase
        .rpc('get_collections_with_skill_categories', { 
          categories: filters.skill_categories 
        })
      
      if (categoryCollections) {
        const categoryFilteredIds = categoryCollections.map((c: any) => c.collection_id)
        if (skillFilteredIds && skillFilteredIds.length > 0) {
          // Intersect with existing skill filter
          skillFilteredIds = skillFilteredIds.filter(id => categoryFilteredIds.includes(id))
        } else {
          skillFilteredIds = categoryFilteredIds
        }
        
        if (skillFilteredIds && skillFilteredIds.length > 0) {
          query = query.in('id', skillFilteredIds)
        } else {
          // No collections match the combined filters
          return NextResponse.json({
            collections: [],
            total: 0,
            page: 1,
            pages: 0
          })
        }
      }
    }

    // Apply sorting
    if (filters.is_featured) {
      query = query.order('featured_order', { ascending: true })
    } else {
      const ascending = filters.sort_order === 'asc'
      query = query.order(filters.sort_by || 'created_at', { ascending })
    }

    // Apply pagination
    if (filters.limit) {
      query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1)
    }

    const { data: collections, error, count } = await query

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user progress if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    let collectionsWithProgress = collections

    if (user && collections) {
      const collectionIds = collections.map((c: any) => c.id)
      const { data: progressData } = await supabase
        .from('user_collection_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('collection_id', collectionIds)

      const progressMap = new Map(progressData?.map((p: any) => [p.collection_id, p]) || [])

      collectionsWithProgress = collections.map((collection: any) => ({
        ...collection,
        items_count: collection.items_count?.[0]?.count || 0,
        progress: progressMap.get(collection.id)
      }))
    }

    // Include skills summary if requested
    if (filters.include_skills && collectionsWithProgress) {
      const collectionsWithSkills = await Promise.all(
        collectionsWithProgress.map(async (collection: any) => {
          try {
            const { data: skillsSummary } = await supabase
              .rpc('get_collection_skills_summary', { collection_uuid: collection.id })
              .single()
            
            return {
              ...collection,
              skills_summary: skillsSummary
            }
          } catch (skillsError) {
            console.warn(`Failed to load skills for collection ${collection.id}:`, skillsError)
            return collection
          }
        })
      )
      collectionsWithProgress = collectionsWithSkills
    }

    return NextResponse.json({
      collections: collectionsWithProgress,
      total: count,
      page: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
      pages: Math.ceil((count || 0) / (filters.limit || 20))
    })

  } catch (error) {
    console.error('Collections API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/collections - Create new collection (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body: CreateCollectionRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.emoji) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, emoji' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug already exists
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCollection) {
      return NextResponse.json(
        { error: `A collection with slug "${slug}" already exists` },
        { status: 400 }
      )
    }

    // Handle featured ordering
    let featured_order = null
    if (body.is_featured) {
      const { data: lastFeatured } = await supabase
        .from('collections')
        .select('featured_order')
        .eq('is_featured', true)
        .order('featured_order', { ascending: false })
        .limit(1)
        .single()

      featured_order = (lastFeatured?.featured_order || 0) + 1
    }

    // Create collection
    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        title: body.title,
        description: body.description,
        emoji: body.emoji,
        slug,
        difficulty_level: body.difficulty_level || 1,
        estimated_minutes: body.estimated_minutes || 30,
        prerequisites: body.prerequisites || [],
        learning_objectives: body.learning_objectives || [],
        action_items: body.action_items || [],
        current_events_relevance: body.current_events_relevance || 3,
        tags: body.tags || [],
        categories: body.categories || [],
        cover_image_url: body.cover_image_url,
        status: body.status || 'draft',
        is_featured: body.is_featured || false,
        featured_order,
        created_by: user.id,
        published_at: body.status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(collection, { status: 201 })

  } catch (error) {
    console.error('Create collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 