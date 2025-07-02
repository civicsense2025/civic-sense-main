import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// =============================================================================
// GET DECISIONS FOR A SITUATION
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ situationId: string }> }
) {
  try {
    const { situationId } = await params
    const supabase = await createClient()
    
    // Get all decisions for this situation
    const { data: decisions, error } = await supabase
      .from('scenario_decisions')
      .select('*')
      .eq('situation_id', situationId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching decisions:', error)
      return NextResponse.json(
        { error: 'Failed to load decisions' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(decisions || [])
    
  } catch (error) {
    console.error('Unexpected error in decisions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 