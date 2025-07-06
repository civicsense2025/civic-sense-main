import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateCollectionRequest } from '@/types/collections'
import { cookies } from 'next/headers'
import type { Collection, CollectionItem } from '@/types/collections'

interface RouteParams {
  params: { slug: string } | Promise<{ slug: string }>
}

// GET /api/collections/[slug] - Get collection with items and lesson steps
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { slug } = await params

    // First get the collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (collectionError || !collection) {
      console.error('Collection not found:', collectionError)
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Get collection items for this collection
    const { data: collectionItems, error: itemsError } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collection.id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (itemsError) {
      console.error('Error fetching collection items:', itemsError)
      return NextResponse.json(
        { error: 'Error fetching collection items' },
        { status: 500 }
      )
    }

    // Get lesson steps for each collection item
    const itemsWithSteps = await Promise.all(
      (collectionItems || []).map(async (item) => {
        const { data: lessonSteps, error: stepsError } = await supabase
          .from('lesson_steps')
          .select('*')
          .eq('collection_item_id', item.id)
          .order('step_number', { ascending: true })

        if (stepsError) {
          console.error(`Error fetching lesson steps for item ${item.id}:`, stepsError)
          return {
            ...item,
            lesson_steps: []
          }
        }

        return {
          ...item,
          lesson_steps: lessonSteps || []
        }
      })
    )

    // Get user progress if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    let userProgress = null

    if (user) {
      const { data: progress } = await supabase
        .from('user_collection_progress')
        .select('*')
        .eq('collection_id', collection.id)
        .eq('user_id', user.id)
        .single()

      userProgress = progress
    }

    const response = {
      ...collection,
      collection_items: itemsWithSteps,
      progress: userProgress,
      items_count: itemsWithSteps.length,
      total_steps: itemsWithSteps.reduce((total, item) => total + (item.lesson_steps?.length || 0), 0)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/collections/[slug]:', error)
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
    const { slug } = await params

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
    const { slug } = await params

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
            if (col.featured_order !== null) {
              await supabase
                .from('collections')
                .update({ featured_order: col.featured_order - 1 })
                .eq('id', col.id)
            }
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