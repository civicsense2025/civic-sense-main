import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'active'

    // Build query for survey_summary view
    let query = supabase
      .from('survey_summary')
      .select('*')

    // Only filter by status if not requesting all surveys
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: surveys, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching surveys:', error)
      return NextResponse.json({ error: 'Failed to fetch surveys', details: error.message }, { status: 500 })
    }

    // If no surveys, return empty array
    if (!surveys || surveys.length === 0) {
      return NextResponse.json({ 
        surveys: [],
        message: 'No surveys available'
      })
    }

    // Transform the data to match the expected format for admin panel
    const transformedSurveys = surveys.map(survey => ({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      allow_anonymous: survey.allow_anonymous,
      allow_partial_responses: survey.allow_partial_responses,
      estimated_time: survey.estimated_time,
      created_at: survey.created_at,
      updated_at: survey.created_at, // Using created_at as fallback
      response_count: survey.total_responses || 0,
      completed_responses: survey.completed_responses || 0,
      completion_rate: survey.completion_rate || 0,
      questions_count: survey.question_count || 0,
      avg_rating: null // Not available in current schema
    }))

    return NextResponse.json({ 
      surveys: transformedSurveys,
      total: transformedSurveys.length
    })

  } catch (error) {
    console.error('Error in surveys API:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Unable to fetch surveys at this time' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      title,
      description,
      questions,
      status = 'draft',
      allow_anonymous = true,
      allow_partial_responses = true,
      estimated_time
    } = body

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        title,
        description,
        status,
        allow_anonymous,
        allow_partial_responses,
        estimated_time,
        created_by: user.id,
        published_at: status === 'active' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (surveyError) {
      console.error('Error creating survey:', surveyError)
      return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 })
    }

    // Create questions
    const questionsWithSurveyId = questions.map((q: any, index: number) => ({
      survey_id: survey.id,
      question_order: index + 1,
      question_type: q.type,
      question_text: q.question,
      description: q.description,
      required: q.required || false,
      options: q.options || null,
      scale_config: q.scale_config || null,
      conditional_logic: q.conditional_logic || null
    }))

    const { error: questionsError } = await supabase
      .from('survey_questions')
      .insert(questionsWithSurveyId)

    if (questionsError) {
      console.error('Error creating questions:', questionsError)
      // Clean up survey if questions failed
      await supabase.from('surveys').delete().eq('id', survey.id)
      return NextResponse.json({ error: 'Failed to create survey questions' }, { status: 500 })
    }

    return NextResponse.json({ survey }, { status: 201 })
  } catch (error) {
    console.error('Error in surveys POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 