import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { LessonStepViewer } from '@civicsense/ui-web/components/collections/lesson-step-viewer'
import { LessonStepsResponse } from '@civicsense/shared/types/lesson-steps'
import { Collection } from '@civicsense/shared/types/collections'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface LearnPageProps {
  params: { slug: string }
}

// Generate metadata for the page
export async function generateMetadata({ params }: LearnPageProps) {
  const supabase = await createClient()
  
  const { data: collection } = await supabase
    .from('collections')
    .select('title, description')
    .eq('slug', params.slug)
    .single()

  if (!collection) {
    return {
      title: 'Collection Not Found | CivicSense',
      description: 'The requested collection could not be found.'
    }
  }

  return {
    title: `Learn: ${collection.title} | CivicSense`,
    description: `Interactive lesson steps for ${collection.title}. ${collection.description}`,
    openGraph: {
      title: `Learn: ${collection.title}`,
      description: collection.description,
      type: 'article'
    }
  }
}

async function getCollectionAndSteps(slug: string): Promise<{
  collection: Collection | null
  stepsData: LessonStepsResponse | null
}> {
  const supabase = await createClient()
  
  // Get collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .single()

  if (collectionError || !collection) {
    return { collection: null, stepsData: null }
  }

  // Check if collection is published (unless user is admin)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (collection.status !== 'published' && !user) {
    return { collection: null, stepsData: null }
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
      return { collection: null, stepsData: null }
    }
  }

  // Get lesson steps with user progress if authenticated
  let stepsData = null
  if (user) {
    const { data, error } = await supabase
      .rpc('get_lesson_steps_with_progress', {
        p_collection_id: collection.id,
        p_user_id: user.id
      })
    
    if (!error && data) {
      // Transform the data to match our TypeScript types
      const steps = data.map((step: any) => ({
        id: step.step_id,
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
        progress: step.progress_status ? {
          id: step.progress_id || '',
          user_id: user.id,
          lesson_step_id: step.step_id,
          collection_id: collection.id,
          status: step.progress_status,
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
      }))

      // Calculate progress metrics
      const totalSteps = steps.filter((step: any) => !step.is_optional).length
      const completedSteps = steps.filter((step: any) => 
        !step.is_optional && step.progress?.status === 'completed'
      ).length
      const progressPercentage = totalSteps > 0 
        ? Math.round((completedSteps / totalSteps) * 100)
        : 0

      // Find current and next available steps
      const currentStep = steps.find((step: any) => 
        step.progress?.status === 'in_progress'
      )
      
      const nextAvailableStep = steps.find((step: any) => {
        if (step.progress?.status === 'completed') return false
        
        // Check if all prerequisites are met
        const prerequisitesMet = step.prerequisites.every((prereqNumber: number) => {
          const prereqStep = steps.find((s: any) => s.step_number === prereqNumber)
          return prereqStep?.progress?.status === 'completed'
        })
        
        return prerequisitesMet
      })

      const estimatedTotalMinutes = steps.reduce((total: number, step: any) => 
        total + step.estimated_minutes, 0
      )

      stepsData = {
        steps,
        total_steps: totalSteps,
        completed_steps: completedSteps,
        progress_percentage: progressPercentage,
        estimated_total_minutes: estimatedTotalMinutes,
        current_step: currentStep,
        next_available_step: nextAvailableStep || steps[0] // Default to first step
      }
    }
  } else {
    // Get steps without progress for unauthenticated users
    const { data, error } = await supabase
      .from('lesson_steps')
      .select('*')
      .eq('collection_id', collection.id)
      .order('step_number')
    
    if (!error && data) {
      const steps = data.map((step: any) => ({
        id: step.id,
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
        updated_at: step.updated_at
      }))

      const estimatedTotalMinutes = steps.reduce((total: number, step: any) => 
        total + step.estimated_minutes, 0
      )

      stepsData = {
        steps,
        total_steps: steps.filter((step: any) => !step.is_optional).length,
        completed_steps: 0,
        progress_percentage: 0,
        estimated_total_minutes: estimatedTotalMinutes,
        next_available_step: steps[0]
      }
    }
  }

  return { collection, stepsData }
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BookOpen className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading lesson steps...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { collection, stepsData } = await getCollectionAndSteps(params.slug)

  if (!collection) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/collections/${params.slug}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collection
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{collection.emoji}</span>
            <h1 className="text-3xl font-bold text-gray-900">
              {collection.title}
            </h1>
          </div>
          
          <p className="text-lg text-gray-600 max-w-3xl">
            {collection.description}
          </p>
        </div>

        {/* Lesson Step Viewer */}
        <Suspense fallback={<LoadingState />}>
          <LessonStepViewer
            collectionSlug={params.slug}
            initialData={stepsData || undefined}
          />
        </Suspense>
      </div>
    </div>
  )
} 