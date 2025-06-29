import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LessonStep, LessonStepsResponse } from '@/types/lesson-steps'

// GET /api/collections/[slug]/steps - Get lesson steps for a collection
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get collection by slug
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id, status')
      .eq('slug', params.slug)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if collection is published (unless user is admin)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (collection.status !== 'published' && !user) {
      return NextResponse.json(
        { error: 'Collection not available' },
        { status: 403 }
      )
    }

    // If user is authenticated, check if they have admin access for draft collections
    let isAdmin = false
    if (user && collection.status !== 'published') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      isAdmin = profile?.role === 'admin'
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Collection not available' },
          { status: 403 }
        )
      }
    }

    // Get lesson steps with user progress if authenticated
    let stepsData
    if (user) {
      const { data, error } = await supabase
        .rpc('get_lesson_steps_with_progress', {
          p_collection_id: collection.id,
          p_user_id: user.id
        })
      
      if (error) {
        console.error('Error fetching steps with progress:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      stepsData = data
    } else {
      // Get steps without progress for unauthenticated users
      const { data, error } = await supabase
        .from('lesson_steps')
        .select('*')
        .eq('collection_id', collection.id)
        .order('step_number')
      
      if (error) {
        console.error('Error fetching steps:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      stepsData = data
    }

    // Transform the data to match our TypeScript types
    const steps: LessonStep[] = stepsData?.map((step: any) => ({
      id: step.step_id || step.id,
      collection_id: collection.id,
      step_number: step.step_number,
      step_type: step.step_type,
      title: step.title,
      content: step.content,
      summary: step.summary,
      media_url: step.media_url,
      media_type: step.media_type,
      resources: step.resources || [],
      estimated_minutes: step.estimated_minutes || 5,
      difficulty_level: step.difficulty_level || 1,
      learning_objectives: step.learning_objectives || [],
      key_concepts: step.key_concepts || [],
      has_quiz: step.has_quiz || false,
      quiz_questions: step.quiz_questions,
      has_reflection: step.has_reflection || false,
      reflection_prompts: step.reflection_prompts || [],
      action_items: step.action_items || [],
      civic_engagement_opportunities: step.civic_engagement_opportunities || [],
      is_optional: step.is_optional || false,
      prerequisites: step.prerequisites || [],
      created_at: step.created_at,
      updated_at: step.updated_at,
      progress: user ? {
        id: step.progress_id || '',
        user_id: user.id,
        lesson_step_id: step.step_id || step.id,
        collection_id: collection.id,
        status: step.progress_status || 'not_started',
        time_spent_seconds: step.time_spent_seconds || 0,
        started_at: step.started_at,
        completed_at: step.completed_at,
        interactions_count: step.interactions_count || 0,
        quiz_score: step.quiz_score,
        reflection_response: step.reflection_response,
        understanding_rating: step.understanding_rating,
        difficulty_rating: step.difficulty_rating,
        actions_planned: step.actions_planned || [],
        actions_completed: step.actions_completed || [],
        created_at: step.progress_created_at || new Date().toISOString(),
        updated_at: step.progress_updated_at || new Date().toISOString()
      } : undefined
    })) || []

    // Calculate progress metrics
    const totalSteps = steps.filter(step => !step.is_optional).length
    const completedSteps = steps.filter(step => 
      !step.is_optional && step.progress?.status === 'completed'
    ).length
    const progressPercentage = totalSteps > 0 
      ? Math.round((completedSteps / totalSteps) * 100)
      : 0

    // Find current and next available steps
    const currentStep = steps.find(step => 
      step.progress?.status === 'in_progress'
    )
    
    const nextAvailableStep = steps.find(step => {
      if (step.progress?.status === 'completed') return false
      
      // Check if all prerequisites are met
      const prerequisitesMet = step.prerequisites.every(prereqNumber => {
        const prereqStep = steps.find(s => s.step_number === prereqNumber)
        return prereqStep?.progress?.status === 'completed'
      })
      
      return prerequisitesMet
    })

    const estimatedTotalMinutes = steps.reduce((total, step) => 
      total + step.estimated_minutes, 0
    )

    const response: LessonStepsResponse = {
      steps,
      total_steps: totalSteps,
      completed_steps: completedSteps,
      progress_percentage: progressPercentage,
      estimated_total_minutes: estimatedTotalMinutes,
      current_step: currentStep,
      next_available_step: nextAvailableStep || steps[0] // Default to first step
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Lesson steps API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 