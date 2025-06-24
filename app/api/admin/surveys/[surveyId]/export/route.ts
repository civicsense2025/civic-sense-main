import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const surveyId = resolvedParams.surveyId

    // Check admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get survey information
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('title')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Get survey responses with answers
    const { data: responses, error: responsesError } = await supabase
      .from('survey_responses')
      .select(`
        id,
        user_id,
        guest_token,
        is_complete,
        started_at,
        completed_at,
        profiles:user_id (email, full_name),
        survey_answers (
          question_id,
          answer_text,
          answer_value,
          survey_questions (
            question_text,
            question_order
          )
        )
      `)
      .eq('survey_id', surveyId)
      .order('started_at', { ascending: false })

    if (responsesError) {
      console.error('Error fetching survey responses for export:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch survey data' }, { status: 500 })
    }

    // Create CSV content
    const csvHeaders = [
      'Response ID',
      'User Email',
      'User Name',
      'Status',
      'Started At',
      'Completed At',
      'Question',
      'Answer'
    ].join(',')

    const csvRows = []
    csvRows.push(csvHeaders)

    if (responses && responses.length > 0) {
      for (const response of responses) {
        const baseInfo = [
          response.id,
          (response.profiles as any)?.email || 'Anonymous',
          (response.profiles as any)?.full_name || 'Anonymous',
          response.is_complete ? 'Complete' : 'Incomplete',
          response.started_at,
          response.completed_at || ''
        ]

        // Add answers
        const answers = (response.survey_answers as any) || []
        if (answers.length > 0) {
          for (const answer of answers) {
            const row = [
              ...baseInfo,
              `"${answer.survey_questions?.question_text || 'Unknown Question'}"`,
              `"${answer.answer_text || answer.answer_value || 'No Answer'}"`
            ].join(',')
            csvRows.push(row)
          }
        } else {
          // No answers yet
          const row = [...baseInfo, 'No Questions Answered', 'No Answers'].join(',')
          csvRows.push(row)
        }
      }
    }

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="survey-${surveyId}-responses.csv"`
      }
    })

  } catch (error) {
    console.error('Error in survey export admin API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 