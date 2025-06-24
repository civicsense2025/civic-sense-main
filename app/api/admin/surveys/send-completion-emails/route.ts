import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

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

    const { survey_id } = body

    if (!survey_id) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })
    }

    // Get completed responses for the survey
    const { data: completedResponses, error } = await supabase
      .from('survey_responses')
      .select(`
        id,
        user_id,
        profiles:user_id (email, full_name)
      `)
      .eq('survey_id', survey_id)
      .eq('is_complete', true)

    if (error) {
      console.error('Error fetching completed responses:', error)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    // For now, return success without actually sending emails
    // In the future, this would integrate with an email service like MailerSend
    const emailCount = completedResponses?.length || 0

    // TODO: Implement actual email sending
    // const emailResults = await Promise.allSettled(
    //   completedResponses.map(response => 
    //     sendCompletionEmail(response.profiles.email, survey_id)
    //   )
    // )

    return NextResponse.json({ 
      sent_count: emailCount,
      message: `Would send completion emails to ${emailCount} users (email service not yet configured)`
    })

  } catch (error) {
    console.error('Error in send completion emails admin API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 