import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// GET /api/pod-themes - Get available themes for pod customization
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Themes are public, so no auth required
    const { data: themes, error } = await supabase
      .from('pod_themes')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching themes:', error)
      return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
    }

    return NextResponse.json({ themes: themes || [] })
  } catch (error) {
    console.error('Error in pod-themes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 