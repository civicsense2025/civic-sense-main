import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const supabase = createClient()
    const surveyId = params.surveyId

    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Check if survey is accessible (active or user owns it)
    const { data: { user } } = await supabase.auth.getUser()
    const isOwner = user && survey.created_by === user.id
    const isAdmin = user?.email === 'admin@civicsense.app'
    
    if (survey.status !== 'active' && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Survey not accessible' }, { status: 403 })
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
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
      conditional_logic: q.conditional_logic
    }))

    const transformedSurvey = {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      allow_anonymous: survey.allow_anonymous,
      allow_partial_responses: survey.allow_partial_responses,
      estimated_time: survey.estimated_time,
      created_at: survey.created_at,
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
  { params }: { params: { surveyId: string } }
) {
  try {
    const supabase = createClient()
    const surveyId = params.surveyId
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
    const isAdmin = user.email === 'admin@civicsense.app'

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
  { params }: { params: { surveyId: string } }
) {
  try {
    const supabase = createClient()
    const surveyId = params.surveyId

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
    const isAdmin = user.email === 'admin@civicsense.app'

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