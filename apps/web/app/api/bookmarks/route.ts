import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookmarkOperations } from '@civicsense/business-logic/services/bookmark-service'
import type { CreateBookmarkRequest, BookmarkSearchFilters, ContentType } from '@/lib/types/bookmarks'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filters: BookmarkSearchFilters = {
      query: searchParams.get('query') || undefined,
      content_types: searchParams.get('content_types')?.split(',') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      is_favorite: searchParams.get('is_favorite') === 'true' ? true : undefined
    }

    const { bookmarks, total } = await bookmarkOperations.listBookmarks(user.id, filters)

    return NextResponse.json({
      success: true,
      data: {
        bookmarks,
        total
      }
    })

  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const bookmarkRequest: CreateBookmarkRequest = body

    // Validate required fields
    if (!bookmarkRequest.content_type || !bookmarkRequest.title) {
      return NextResponse.json(
        { error: 'Missing required fields: content_type, title' },
        { status: 400 }
      )
    }

    const bookmark = await bookmarkOperations.createBookmark(bookmarkRequest, user.id)

    return NextResponse.json({
      success: true,
      data: bookmark
    })

  } catch (error) {
    console.error('Error creating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    )
  }
} 