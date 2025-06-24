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

    // For now, return mock email stats since we don't have email tracking tables yet
    // In the future, these would come from actual email service webhooks/analytics
    const emailStats = {
      total_sent: 0,
      invitations: 0,
      completions: 0,
      reminders: 0,
      bounce_rate: 0,
      open_rate: 0,
      click_rate: 0
    }

    // If we had email tracking tables, we would query them like this:
    // const { data: emailMetrics } = await supabase
    //   .from('email_analytics')
    //   .select('*')
    //   .order('created_at', { ascending: false })

    return NextResponse.json({ 
      stats: emailStats,
      message: 'Email analytics not yet implemented'
    })

  } catch (error) {
    console.error('Error in email stats admin API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 