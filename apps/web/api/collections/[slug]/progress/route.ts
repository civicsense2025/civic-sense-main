import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

interface RouteParams {
  params: {
    slug: string
  }
}

// GET /api/collections/[slug]/progress - Get user's progress for a collection
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { slug } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', slug)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Get or create progress record
    let { data: progress, error: progressError } = await supabase
      .from('user_collection_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
      .single()

    if (progressError && progressError.code === 'PGRST116') {
      // No progress record exists, create one
      const { data: newProgress, error: createError } = await supabase
        .from('user_collection_progress')
        .insert({
          user_id: user.id,
          collection_id: collection.id,
          items_completed: [],
          total_time_spent: 0,
          last_accessed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating progress:', createError)
        return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 })
      }

      progress = newProgress
    } else if (progressError) {
      console.error('Error fetching progress:', progressError)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    return NextResponse.json(progress)

  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/collections/[slug]/progress - Update user's progress
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { slug } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      item_id, 
      action, // 'complete', 'start', 'view'
      time_spent = 0,
      score = null,
      metadata = {}
    } = body

    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', slug)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Get current progress
    let { data: progress, error: progressError } = await supabase
      .from('user_collection_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
      .single()

    if (progressError && progressError.code === 'PGRST116') {
      // Create new progress record
      const { data: newProgress, error: createError } = await supabase
        .from('user_collection_progress')
        .insert({
          user_id: user.id,
          collection_id: collection.id,
          items_completed: [],
          total_time_spent: 0,
          last_accessed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating progress:', createError)
        return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 })
      }

      progress = newProgress
    } else if (progressError) {
      console.error('Error fetching progress:', progressError)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Update progress based on action
    let updatedItemsCompleted = [...(progress.items_completed || [])]
    let updatedTotalTime = progress.total_time_spent + time_spent
    let isCompleted = progress.is_completed

    if (action === 'complete' && item_id) {
      // Add item to completed if not already there
      if (!updatedItemsCompleted.includes(item_id)) {
        updatedItemsCompleted.push(item_id)
      }

      // Record the completion in item progress
      await supabase
        .from('user_collection_item_progress')
        .upsert({
          user_id: user.id,
          collection_id: collection.id,
          item_id,
          is_completed: true,
          completed_at: new Date().toISOString(),
          time_spent,
          score,
          metadata
        })

      // Check if collection is now complete
      const { data: collectionItems } = await supabase
        .from('collection_items')
        .select('id')
        .eq('collection_id', collection.id)

      if (collectionItems && updatedItemsCompleted.length >= collectionItems.length) {
        isCompleted = true
      }
    } else if (action === 'start' && item_id) {
      // Record item start
      await supabase
        .from('user_collection_item_progress')
        .upsert({
          user_id: user.id,
          collection_id: collection.id,
          item_id,
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })
    }

    // Update main progress record
    const updateData = {
      items_completed: updatedItemsCompleted,
      total_time_spent: updatedTotalTime,
      is_completed: isCompleted,
      last_accessed_at: new Date().toISOString(),
      ...(isCompleted && !progress.completed_at && { 
        completed_at: new Date().toISOString() 
      })
    }

    const { data: updatedProgress, error: updateError } = await supabase
      .from('user_collection_progress')
      .update(updateData)
      .eq('id', progress.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating progress:', updateError)
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    // Update collection completion count if just completed
    if (isCompleted && !progress.is_completed) {
      const { data: currentCollection } = await supabase
        .from('collections')
        .select('completion_count')
        .eq('id', collection.id)
        .single()

      if (currentCollection) {
        await supabase
          .from('collections')
          .update({ 
            completion_count: currentCollection.completion_count + 1
          })
          .eq('id', collection.id)
      }
    }

    return NextResponse.json(updatedProgress)

  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 