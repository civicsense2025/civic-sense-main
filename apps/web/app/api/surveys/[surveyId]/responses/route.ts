import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Create service role client for operations that need elevated permissions
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const surveyId = resolvedParams.surveyId
    const body = await request.json()

    const {
      responses,
      session_id,
      guest_token,
      is_complete = false,
      save_progress = false
    } = body

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: 'Responses are required' }, { status: 400 })
    }

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get current user (might be null for anonymous)
    const { data: { user } } = await supabase.auth.getUser()
    
    // For anonymous responses, require guest_token
    if (!user && !guest_token) {
      return NextResponse.json({ error: 'Guest token required for anonymous responses' }, { status: 400 })
    }

    // Verify survey exists and is active using service role to avoid RLS issues
    const { data: survey, error: surveyError } = await serviceSupabase
      .from('surveys')
      .select('id, status, allow_anonymous')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'Survey is not active' }, { status: 400 })
    }

    if (!user && !survey.allow_anonymous) {
      return NextResponse.json({ error: 'Anonymous responses not allowed for this survey' }, { status: 403 })
    }

    // Get client info
    const ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const user_agent = request.headers.get('user-agent') || null

    // Check if response session already exists using service role
    let surveyResponse: any = null
    const { data: existingResponse } = await serviceSupabase
      .from('survey_responses')
      .select('id, is_complete')
      .eq('survey_id', surveyId)
      .eq('session_id', session_id)
      .single()

    if (existingResponse) {
      if (existingResponse.is_complete && !save_progress) {
        return NextResponse.json({ error: 'Survey already completed' }, { status: 400 })
      }
      surveyResponse = existingResponse
      
      // Update the existing response using service role
      const { error: updateError } = await serviceSupabase
        .from('survey_responses')
        .update({
          is_complete,
          completed_at: is_complete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingResponse.id)

      if (updateError) {
        console.error('Error updating survey response:', updateError)
        return NextResponse.json({ error: 'Failed to update response' }, { status: 500 })
      }
    } else {
      // Create new response session using service role
      const { data: newResponse, error: responseError } = await serviceSupabase
        .from('survey_responses')
        .insert({
          survey_id: surveyId,
          session_id,
          user_id: user?.id || null,
          guest_token: guest_token || null,
          is_complete,
          completed_at: is_complete ? new Date().toISOString() : null,
          ip_address,
          user_agent
        })
        .select()
        .single()

      if (responseError) {
        console.error('Error creating survey response:', responseError)
        return NextResponse.json({ error: 'Failed to create response' }, { status: 500 })
      }

      surveyResponse = newResponse
    }

    // Get all question IDs for this survey to validate responses using service role
    const { data: questions, error: questionsError } = await serviceSupabase
      .from('survey_questions')
      .select('id, question_text')
      .eq('survey_id', surveyId)

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to validate responses' }, { status: 500 })
    }

    const validQuestionIds = new Set(questions?.map(q => q.id) || [])

    // Prepare answers for insertion/update
    const answersToUpsert = responses
      .filter((response: any) => validQuestionIds.has(response.question_id))
      .map((response: any) => ({
        response_id: surveyResponse.id,
        question_id: response.question_id,
        answer_data: { answer: response.answer },
        answered_at: response.answered_at || new Date().toISOString()
      }))

    if (answersToUpsert.length === 0) {
      return NextResponse.json({ error: 'No valid responses to save' }, { status: 400 })
    }

    // Use service role for answers upsert to handle both new and updated answers
    const { error: answersError } = await serviceSupabase
      .from('survey_answers')
      .upsert(answersToUpsert, {
        onConflict: 'response_id,question_id'
      })

    if (answersError) {
      console.error('Error saving answers:', answersError)
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      response_id: surveyResponse.id,
      is_complete,
      saved_answers: answersToUpsert.length
    })
  } catch (error) {
    console.error('Error in survey responses POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const surveyId = resolvedParams.surveyId
    const url = new URL(request.url)
    const session_id = url.searchParams.get('session_id')
    const guest_token = url.searchParams.get('guest_token')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !guest_token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Build query using service role to avoid RLS issues
    let query = serviceSupabase
      .from('survey_responses')
      .select(`
        id,
        session_id,
        started_at,
        completed_at,
        is_complete,
        survey_answers (
          question_id,
          answer_data,
          answered_at
        )
      `)
      .eq('survey_id', surveyId)

    if (session_id) {
      query = query.eq('session_id', session_id)
    }

    if (user) {
      query = query.eq('user_id', user.id)
    } else if (guest_token) {
      query = query.eq('guest_token', guest_token)
    }

    const { data: responses, error } = await query

    if (error) {
      console.error('Error fetching responses:', error)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    // Transform the response data
    const transformedResponses = responses?.map(response => ({
      id: response.id,
      session_id: response.session_id,
      started_at: response.started_at,
      completed_at: response.completed_at,
      is_complete: response.is_complete,
      answers: response.survey_answers?.map((answer: any) => ({
        question_id: answer.question_id,
        answer: answer.answer_data?.answer,
        answered_at: answer.answered_at
      })) || []
    }))

    return NextResponse.json({ responses: transformedResponses })
  } catch (error) {
    console.error('Error in survey responses GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 