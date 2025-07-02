import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { bookmarkOperations } from '@civicsense/shared/lib/bookmarks'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content_type, content_id, content_url } = body

    // Check by content_id first, then content_url
    const identifier = content_id || content_url
    if (!identifier) {
      return NextResponse.json(
        { error: 'Either content_id or content_url is required' },
        { status: 400 }
      )
    }

    // Get the bookmark if it exists
    const bookmark = await bookmarkOperations.getBookmarkByContent(
      content_type,
      identifier,
      user.id
    )

    return NextResponse.json({
      success: true,
      isBookmarked: !!bookmark,
      bookmarkId: bookmark?.id || null
    })

  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return NextResponse.json(
      { error: 'Failed to check bookmark status' },
      { status: 500 }
    )
  }
} 