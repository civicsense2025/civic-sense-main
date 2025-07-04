import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateLessonStepProgressRequest } from '@/types/lesson-steps'

// POST /api/collections/[slug]/steps/progress - Update lesson step progress
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient()
    const { slug } = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get collection by slug
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id, status')
      .eq('slug', slug)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    const body: UpdateLessonStepProgressRequest = await request.json()

    // Validate required fields
    if (!body.lesson_step_id) {
      return NextResponse.json(
        { error: 'Missing required field: lesson_step_id' },
        { status: 400 }
      )
    }

    // Verify the lesson step exists and belongs to this collection
    const { data: lessonStep, error: stepError } = await supabase
      .from('lesson_steps')
      .select('id, collection_id, step_number')
      .eq('id', body.lesson_step_id)
      .eq('collection_id', collection.id)
      .single()

    if (stepError || !lessonStep) {
      return NextResponse.json(
        { error: 'Lesson step not found' },
        { status: 404 }
      )
    }

    // Update progress using the database function
    // Using cast to any because custom RPC function isn't in generated types
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { error: updateError } = await (supabase as any)
      .rpc('update_lesson_step_progress', {
        p_user_id: user.id,
        p_lesson_step_id: body.lesson_step_id,
        p_status: body.status || null,
        p_time_spent_seconds: body.time_spent_seconds || null,
        p_quiz_score: body.quiz_score || null,
        p_reflection_response: body.reflection_response || null,
        p_understanding_rating: body.understanding_rating || null,
        p_difficulty_rating: body.difficulty_rating || null,
        p_actions_planned: body.actions_planned || null,
        p_actions_completed: body.actions_completed || null
      })

    if (updateError) {
      console.error('Error updating lesson step progress:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Get the updated progress
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { data: updatedProgress, error: progressError } = await (supabase as any)
      .from('user_lesson_step_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_step_id', body.lesson_step_id)
      .single()

    if (progressError) {
      console.error('Error fetching updated progress:', progressError)
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    // Also return updated collection progress
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { data: collectionProgress } = await (supabase as any)
      .from('user_collection_progress')
      .select('progress_percentage, completed_at')
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
      .single()

    return NextResponse.json({
      step_progress: updatedProgress,
      collection_progress: collectionProgress,
      message: 'Progress updated successfully'
    })

  } catch (error) {
    console.error('Update lesson step progress error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/collections/[slug]/steps/progress - Get user's progress for all steps in collection
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient()
    const { slug } = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get collection by slug
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

    // Get all progress for this user and collection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { data: progressData, error: progressError } = await (supabase as any)
      .from('user_lesson_step_progress')
      .select(`
        *,
        lesson_steps!inner(step_number, title, step_type)
      `)
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
      .order('lesson_steps.step_number')

    if (progressError) {
      console.error('Error fetching progress:', progressError)
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    // Get collection progress summary
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { data: collectionProgress } = await (supabase as any)
      .from('user_collection_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
      .single()

    return NextResponse.json({
      step_progress: progressData || [],
      collection_progress: collectionProgress,
      total_steps: progressData?.length || 0
    })

  } catch (error) {
    console.error('Get lesson step progress error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 