import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    console.log('🏛️ Fetching congress sessions...')

    const supabase = await createClient()
    
    // Get available congress sessions from database
    const { data: sessions, error } = await supabase
      .from('congressional_members')
      .select('congress_number')
      .order('congress_number', { ascending: false })

    // Get unique congress numbers
    const uniqueSessions = sessions ? 
      [...new Set(sessions.map(s => s.congress_number))] : []

    const congressSessions = uniqueSessions.map((congressNumber: number) => ({
      number: congressNumber,
      name: `${congressNumber}th Congress`,
      years: getCongressYears(congressNumber),
      active: congressNumber === 119
    }))

    // Fallback if no sessions found
    if (congressSessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [
          { number: 119, name: '119th Congress', years: '2025-2027', active: true },
          { number: 118, name: '118th Congress', years: '2023-2025', active: false },
          { number: 117, name: '117th Congress', years: '2021-2023', active: false }
        ]
      })
    }

    console.log('✅ Congress sessions fetched:', congressSessions.length, 'sessions')

    return NextResponse.json({
      success: true,
      data: congressSessions
    })

  } catch (error) {
    console.error('Error fetching congress sessions:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getCongressYears(congressNumber: number): string {
  const startYear = 1789 + (congressNumber - 1) * 2
  const endYear = startYear + 2
  return `${startYear}-${endYear}`
} 