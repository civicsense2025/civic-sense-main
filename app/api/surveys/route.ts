import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'active'

    // Get surveys with basic info
    const { data: surveys, error } = await supabase
      .from('survey_summary')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching surveys:', error)
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
    }

    return NextResponse.json({ surveys })
  } catch (error) {
    console.error('Error in surveys GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
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