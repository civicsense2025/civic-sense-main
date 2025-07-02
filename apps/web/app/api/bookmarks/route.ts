import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { bookmarkOperations } from '@civicsense/shared/lib/bookmarks'
import type { CreateBookmarkRequest, BookmarkSearchFilters, ContentType } from '@civicsense/shared/lib/types/bookmarks'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters from query params
    const filters: BookmarkSearchFilters = {
      collection_id: searchParams.get('collection_id') || undefined,
      content_types: searchParams.get('content_types')?.split(',') as ContentType[] || undefined,
      is_favorite: searchParams.get('is_favorite') === 'true' ? true : 
                   searchParams.get('is_favorite') === 'false' ? false : undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      query: searchParams.get('query') || undefined
    }

    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const result = await bookmarkOperations.getUserBookmarks(user.id, filters, limit, page)

    return NextResponse.json({
      success: true,
      data: result
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