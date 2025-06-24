import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Check what's in the surveys table
    const { data: surveys, error: surveysError } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false })

    // Check what's in the survey_summary view
    const { data: surveysSummary, error: summaryError } = await supabase
      .from('survey_summary')
      .select('*')
      .order('created_at', { ascending: false })

    // Check survey questions
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .order('created_at', { ascending: false })

    // Check survey responses
    const { data: responses, error: responsesError } = await supabase
      .from('survey_responses')
      .select('*')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      debug_info: {
        surveys: {
          count: surveys?.length || 0,
          data: surveys,
          error: surveysError?.message
        },
        survey_summary: {
          count: surveysSummary?.length || 0,
          data: surveysSummary,
          error: summaryError?.message
        },
        survey_questions: {
          count: questions?.length || 0,
          data: questions,
          error: questionsError?.message
        },
        survey_responses: {
          count: responses?.length || 0,
          data: responses,
          error: responsesError?.message
        },
        user_info: {
          user_id: user.id,
          email: user.email,
          is_admin: profile?.is_admin
        }
      }
    })

  } catch (error) {
    console.error('Error in surveys debug API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 