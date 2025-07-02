import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { bookmarkOperations } from '@civicsense/shared/lib/bookmarks'

export async function GET(
  request: NextRequest,
  { params }: { params: { bookmarkId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookmark = await bookmarkOperations.getBookmark(params.bookmarkId, user.id)

    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: bookmark
    })

  } catch (error) {
    console.error('Error fetching bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmark' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookmarkId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates = body

    const bookmark = await bookmarkOperations.updateBookmark(
      params.bookmarkId,
      updates,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: bookmark
    })

  } catch (error) {
    console.error('Error updating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookmarkId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await bookmarkOperations.deleteBookmark(params.bookmarkId, user.id)

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    )
  }
} 