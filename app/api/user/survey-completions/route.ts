import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Create service role client for operations that need elevated permissions
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's completed surveys with survey details
    const { data: completions, error } = await serviceSupabase
      .from('user_survey_completions')
      .select(`
        id,
        survey_id,
        response_id,
        completed_at,
        total_questions,
        questions_answered,
        completion_time_seconds,
        surveys (
          title,
          description,
          post_completion_config,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching survey completions:', error)
      return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 })
    }

    // Transform the data to match expected interface
    const transformedCompletions = completions?.map(completion => ({
      id: completion.id,
      survey_id: completion.survey_id,
      response_id: completion.response_id,
      completed_at: completion.completed_at,
      total_questions: completion.total_questions,
      questions_answered: completion.questions_answered,
      completion_time_seconds: completion.completion_time_seconds,
      survey: completion.surveys
    })) || []

    // Get total count for pagination
    const { count: totalCount } = await serviceSupabase
      .from('user_survey_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({ 
      completions: transformedCompletions,
      total: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0)
    })
  } catch (error) {
    console.error('Error in survey completions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { surveyId, responseId, completionData } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!surveyId || !responseId) {
      return NextResponse.json({ error: 'Survey ID and response ID are required' }, { status: 400 })
    }

    // Get survey and response details to populate completion record
    const [surveyResponse, questionsResponse] = await Promise.all([
      serviceSupabase
        .from('survey_responses')
        .select('*')
        .eq('id', responseId)
        .eq('user_id', user.id)
        .single(),
      serviceSupabase
        .from('survey_questions')
        .select('id')
        .eq('survey_id', surveyId)
    ])

    if (surveyResponse.error || !surveyResponse.data) {
      return NextResponse.json({ error: 'Survey response not found' }, { status: 404 })
    }

    if (questionsResponse.error) {
      return NextResponse.json({ error: 'Failed to fetch question count' }, { status: 500 })
    }

    const totalQuestions = questionsResponse.data?.length || 0
    const response = surveyResponse.data

    // Count answered questions
    const { count: answeredCount } = await serviceSupabase
      .from('survey_answers')
      .select('*', { count: 'exact', head: true })
      .eq('response_id', responseId)

    // Calculate completion time
    const startTime = new Date(response.started_at || response.created_at)
    const endTime = new Date(response.completed_at || new Date())
    const completionTimeSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000)

    // Create or update completion record
    const completionRecord = {
      user_id: user.id,
      survey_id: surveyId,
      response_id: responseId,
      completed_at: response.completed_at || new Date().toISOString(),
      total_questions: totalQuestions,
      questions_answered: answeredCount || 0,
      completion_time_seconds: completionTimeSeconds,
      ...completionData
    }

    const { data: completion, error: completionError } = await serviceSupabase
      .from('user_survey_completions')
      .upsert(completionRecord, {
        onConflict: 'user_id,survey_id'
      })
      .select()
      .single()

    if (completionError) {
      console.error('Error creating completion record:', completionError)
      return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      completion,
      message: 'Survey completion recorded successfully'
    })
  } catch (error) {
    console.error('Error in survey completions POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 