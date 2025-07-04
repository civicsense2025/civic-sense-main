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

    const tags = await bookmarkOperations.getBookmarkTags(user.id)

    return NextResponse.json({
      success: true,
      data: tags
    })

  } catch (error) {
    console.error('Error fetching bookmark tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmark tags' },
      { status: 500 }
    )
  }
} 