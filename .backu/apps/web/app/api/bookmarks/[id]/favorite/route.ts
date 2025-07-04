import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookmarkOperations } from '@civicsense/business-logic/services/bookmark-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookmarkId = params.id
    const bookmark = await bookmarkOperations.toggleBookmarkFavorite(bookmarkId, user.id)

    return NextResponse.json({
      success: true,
      data: bookmark
    })

  } catch (error) {
    console.error('Error toggling bookmark favorite:', error)
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    )
  }
} 