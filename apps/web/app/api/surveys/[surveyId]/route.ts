import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Create service role client for operations that need elevated permissions
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const surveyId = resolvedParams.surveyId

    // First check if survey exists and is accessible via survey_summary view
    const { data: surveyOverview, error: overviewError } = await supabase
      .from('survey_summary')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (overviewError || !surveyOverview) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Check if survey is accessible (active or allow anonymous)
    if (surveyOverview.status !== 'active' && !surveyOverview.allow_anonymous) {
      const { data: { user } } = await supabase.auth.getUser()
      const isOwner = user && surveyOverview.created_by === user.id
      const isAdmin = user?.email === 'admin@civicsense.one'
      
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Survey not accessible' }, { status: 403 })
      }
    }

    // Get questions using service role client to bypass RLS issues
    // The RLS policies reference auth.users table which anonymous users can't access
    const { data: questions, error: questionsError } = await serviceSupabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('question_order')

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Transform questions to match the frontend interface
    const transformedQuestions = questions.map(q => ({
      id: q.id,
      type: q.question_type,
      question: q.question_text,
      description: q.description,
      required: q.required,
      options: q.options,
      scale_min: q.scale_config?.min,
      scale_max: q.scale_config?.max,
      scale_labels: q.scale_config?.labels,
      max_selections: q.scale_config?.max_selections,
      max_rankings: q.scale_config?.max_rankings,
      matrix_config: q.scale_config?.scale ? { scale: q.scale_config.scale } : undefined,
      conditional_logic: q.conditional_logic
    }))

    const transformedSurvey = {
      id: surveyOverview.id,
      title: surveyOverview.title,
      description: surveyOverview.description,
      status: surveyOverview.status,
      allow_anonymous: surveyOverview.allow_anonymous,
      allow_partial_responses: surveyOverview.allow_partial_responses,
      estimated_time: surveyOverview.estimated_time,
      created_at: surveyOverview.created_at,
      questions: transformedQuestions
    }

    return NextResponse.json({ survey: transformedSurvey })
  } catch (error) {
    console.error('Error in survey GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const surveyId = resolvedParams.surveyId
    const body = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns survey or is admin
    const { data: survey } = await supabase
      .from('surveys')
      .select('created_by, published_at')
      .eq('id', surveyId)
      .single()

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    const isOwner = survey.created_by === user.id
    const isAdmin = user.email === 'admin@civicsense.one'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      title,
      description,
      status,
      allow_anonymous,
      allow_partial_responses,
      estimated_time
    } = body

    // Update survey
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) {
      updateData.status = status
      if (status === 'active' && !survey.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (allow_anonymous !== undefined) updateData.allow_anonymous = allow_anonymous
    if (allow_partial_responses !== undefined) updateData.allow_partial_responses = allow_partial_responses
    if (estimated_time !== undefined) updateData.estimated_time = estimated_time

    const { data: updatedSurvey, error: updateError } = await supabase
      .from('surveys')
      .update(updateData)
      .eq('id', surveyId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating survey:', updateError)
      return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 })
    }

    return NextResponse.json({ survey: updatedSurvey })
  } catch (error) {
    console.error('Error in survey PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const surveyId = resolvedParams.surveyId

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns survey or is admin
    const { data: survey } = await supabase
      .from('surveys')
      .select('created_by')
      .eq('id', surveyId)
      .single()

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    const isOwner = survey.created_by === user.id
    const isAdmin = user.email === 'admin@civicsense.one'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete survey (cascade will handle questions, responses, and answers)
    const { error: deleteError } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId)

    if (deleteError) {
      console.error('Error deleting survey:', deleteError)
      return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in survey DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 