import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateCollectionRequest } from '@/types/collections'

interface RouteParams {
  params: {
    slug: string
  }
}

// GET /api/collections/[slug] - Get a specific collection with items and progress
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { slug } = params

    // Get collection with items
    const { data: collection, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_items (
          *,
          content:collection_items (
            content_type,
            content_id
          )
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await supabase
      .from('collections')
      .update({ view_count: collection.view_count + 1 })
      .eq('id', collection.id)

    // Get user progress if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    let progress = null

    if (user) {
      const { data: progressData } = await supabase
        .from('user_collection_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('collection_id', collection.id)
        .single()

      progress = progressData
    }

    // Get skills summary for collection
    let skillsSummary = null
    try {
      const { data: skillsData } = await supabase
        .rpc('get_collection_skills_summary', { collection_uuid: collection.id })
        .single()
      skillsSummary = skillsData
    } catch (skillsError) {
      console.warn('Failed to load skills for collection:', skillsError)
    }

    // Get user's skill progress for this collection if authenticated
    let userSkillProgress = null
    if (user) {
      const { data: skillProgressData } = await supabase
        .from('collection_skill_progress')
        .select(`
          *,
          skill:skills (
            skill_name,
            skill_slug,
            category,
            difficulty_level
          )
        `)
        .eq('user_id', user.id)
        .eq('collection_id', collection.id)
      
      userSkillProgress = skillProgressData
    }

    // Get reviews
    const { data: reviews } = await supabase
      .from('collection_reviews')
      .select(`
        *,
        user:profiles!collection_reviews_user_id_fkey (
          email,
          display_name
        )
      `)
      .eq('collection_id', collection.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Populate actual content for each item
    const itemsWithContent = await Promise.all(
      (collection.collection_items || []).map(async (item: any) => {
        let content = null
        
        try {
          switch (item.content_type) {
            case 'topic':
              const { data: topic } = await supabase
                .from('question_topics')
                .select('*')
                .eq('id', item.content_id)
                .single()
              content = topic
              break
            case 'question':
              const { data: question } = await supabase
                .from('questions')
                .select('*')
                .eq('id', item.content_id)
                .single()
              content = question
              break
            case 'glossary_term':
              const { data: term } = await supabase
                .from('glossary_terms')
                .select('*')
                .eq('id', item.content_id)
                .single()
              content = term
              break
            // Add other content types as needed
          }
        } catch (err) {
          console.warn(`Failed to load content for item ${item.id}:`, err)
        }

        return {
          ...item,
          content
        }
      })
    )

    const response = {
      ...collection,
      collection_items: itemsWithContent,
      progress,
      reviews: reviews || [],
      skills_summary: skillsSummary,
      user_skill_progress: userSkillProgress
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/collections/[slug] - Update collection (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { slug } = params

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body: UpdateCollectionRequest = await request.json()

    // Get existing collection
    const { data: existingCollection, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .single()

    if (fetchError || !existingCollection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Handle slug change if title changed
    let newSlug = existingCollection.slug
    if (body.title && body.title !== existingCollection.title) {
      newSlug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Check if new slug already exists
      const { data: duplicateCollection } = await supabase
        .from('collections')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', existingCollection.id)
        .single()

      if (duplicateCollection) {
        return NextResponse.json(
          { error: `A collection with slug "${newSlug}" already exists` },
          { status: 400 }
        )
      }
    }

    // Handle featured ordering
    let featured_order = existingCollection.featured_order
    if (body.is_featured !== undefined) {
      if (body.is_featured && !existingCollection.is_featured) {
        // Adding to featured
        const { data: lastFeatured } = await supabase
          .from('collections')
          .select('featured_order')
          .eq('is_featured', true)
          .order('featured_order', { ascending: false })
          .limit(1)
          .single()

        featured_order = (lastFeatured?.featured_order || 0) + 1
      } else if (!body.is_featured && existingCollection.is_featured) {
        // Removing from featured
        featured_order = null
      }
    }

    // Update collection
    const updateData = {
      ...body,
      slug: newSlug,
      featured_order,
      updated_at: new Date().toISOString(),
      published_at: body.status === 'published' && existingCollection.status !== 'published' 
        ? new Date().toISOString() 
        : existingCollection.published_at
    }

    const { data: updatedCollection, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', existingCollection.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedCollection)

  } catch (error) {
    console.error('Update collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/collections/[slug] - Delete collection (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { slug } = params

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get collection to delete
    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('id, is_featured, featured_order')
      .eq('slug', slug)
      .single()

    if (fetchError || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Delete the collection (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('collections')
      .delete()
      .eq('id', collection.id)

    if (deleteError) {
      console.error('Error deleting collection:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Reorder featured collections if this was featured
    if (collection.is_featured && collection.featured_order) {
      // Get all featured collections with higher order
      const { data: higherOrderCollections } = await supabase
        .from('collections')
        .select('id, featured_order')
        .eq('is_featured', true)
        .gt('featured_order', collection.featured_order)

      // Update each one to decrement order
      if (higherOrderCollections) {
        for (const col of higherOrderCollections) {
          await supabase
            .from('collections')
            .update({ featured_order: col.featured_order - 1 })
            .eq('id', col.id)
        }
      }
    }

    return NextResponse.json({ message: 'Collection deleted successfully' })

  } catch (error) {
    console.error('Delete collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 