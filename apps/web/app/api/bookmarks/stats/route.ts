import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookmarkOperations } from '@civicsense/business-logic/services/bookmark-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await bookmarkOperations.getBookmarkStats(user.id)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching bookmark stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmark stats' },
      { status: 500 }
    )
  }
} 