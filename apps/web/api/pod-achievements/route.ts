import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// GET /api/pod-achievements - Get available achievements for pods
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Achievements are public, so no auth required
    const { data: achievements, error } = await supabase
      .from('pod_achievements')
      .select('*')
      .order('rarity', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching achievements:', error)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    return NextResponse.json({ achievements: achievements || [] })
  } catch (error) {
    console.error('Error in pod-achievements GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 