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

    // Fetch survey responses with user information
    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select(`
        id,
        survey_id,
        user_id,
        guest_token,
        is_complete,
        started_at,
        completed_at,
        session_id,
        profiles:user_id (email, full_name)
      `)
      .eq('survey_id', surveyId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching survey responses:', error)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    // Transform responses to match expected format
    const transformedResponses = (responses || []).map(response => ({
      id: response.id,
      survey_id: response.survey_id,
      user_id: response.user_id,
      guest_token: response.guest_token,
      user_email: (response.profiles as any)?.email || null,
      user_name: (response.profiles as any)?.full_name || null,
      is_complete: response.is_complete,
      started_at: response.started_at,
      completed_at: response.completed_at,
      progress_percentage: response.is_complete ? 100 : 50 // Simplified calculation
    }))

    return NextResponse.json({ 
      responses: transformedResponses,
      total: transformedResponses.length
    })

  } catch (error) {
    console.error('Error in survey responses admin API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 