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
  { params }: { params: Promise<{ surveyId: string; responseId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const { surveyId, responseId } = resolvedParams

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch the specific survey response and its answers
    const { data: response, error: responseError } = await serviceSupabase
      .from('survey_responses')
      .select(`
        id,
        survey_id,
        user_id,
        guest_token,
        started_at,
        completed_at,
        is_complete,
        survey_answers (
          question_id,
          answer_data,
          answered_at
        )
      `)
      .eq('id', responseId)
      .eq('survey_id', surveyId)
      .single()

    if (responseError || !response) {
      return NextResponse.json({ error: 'Survey response not found' }, { status: 404 })
    }

    // Check if user has permission to view this response
    if (response.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Transform the response data
    const transformedResponse = {
      id: response.id,
      survey_id: response.survey_id,
      started_at: response.started_at,
      completed_at: response.completed_at,
      is_complete: response.is_complete,
      answers: response.survey_answers?.map((answer: any) => ({
        question_id: answer.question_id,
        answer: answer.answer_data?.answer,
        answered_at: answer.answered_at
      })) || []
    }

    return NextResponse.json(transformedResponse)
  } catch (error) {
    console.error('Error fetching survey response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string; responseId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const { surveyId, responseId } = resolvedParams
    const body = await request.json()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { answers, metadata } = body

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers array is required' }, { status: 400 })
    }

    // Verify user owns this response
    const { data: response, error: responseError } = await serviceSupabase
      .from('survey_responses')
      .select('user_id, is_complete')
      .eq('id', responseId)
      .eq('survey_id', surveyId)
      .single()

    if (responseError || !response) {
      return NextResponse.json({ error: 'Survey response not found' }, { status: 404 })
    }

    if (response.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (response.is_complete) {
      return NextResponse.json({ error: 'Cannot modify completed survey' }, { status: 400 })
    }

    // Update the answers
    const answersToUpsert = answers.map((answer: any) => ({
      response_id: responseId,
      question_id: answer.question_id,
      answer_data: { answer: answer.answer },
      answered_at: answer.answered_at || new Date().toISOString()
    }))

    const { error: answersError } = await serviceSupabase
      .from('survey_answers')
      .upsert(answersToUpsert, {
        onConflict: 'response_id,question_id'
      })

    if (answersError) {
      console.error('Error updating answers:', answersError)
      return NextResponse.json({ error: 'Failed to update answers' }, { status: 500 })
    }

    // Update response metadata if provided
    if (metadata) {
      const { error: metadataError } = await serviceSupabase
        .from('survey_responses')
        .update({
          updated_at: new Date().toISOString(),
          ...metadata
        })
        .eq('id', responseId)

      if (metadataError) {
        console.error('Error updating response metadata:', metadataError)
        return NextResponse.json({ error: 'Failed to update response metadata' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      updated_answers: answersToUpsert.length
    })
  } catch (error) {
    console.error('Error updating survey response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string; responseId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const { surveyId, responseId } = resolvedParams

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify user owns this response
    const { data: response, error: responseError } = await serviceSupabase
      .from('survey_responses')
      .select('user_id')
      .eq('id', responseId)
      .eq('survey_id', surveyId)
      .single()

    if (responseError || !response) {
      return NextResponse.json({ error: 'Survey response not found' }, { status: 404 })
    }

    if (response.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the response (cascade will handle answers and completion records)
    const { error: deleteError } = await serviceSupabase
      .from('survey_responses')
      .delete()
      .eq('id', responseId)

    if (deleteError) {
      console.error('Error deleting survey response:', deleteError)
      return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting survey response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 