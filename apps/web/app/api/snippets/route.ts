import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookmarkOperations } from '@/lib/bookmarks'
import type { CreateSnippetRequest } from '@/lib/types/bookmarks'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const snippetRequest: CreateSnippetRequest = body

    // Validate required fields
    if (!snippetRequest.snippet_text) {
      return NextResponse.json(
        { error: 'Missing required field: snippet_text' },
        { status: 400 }
      )
    }

    // Create snippet - this will need to be implemented in bookmarkOperations
    const snippet = await bookmarkOperations.createSnippet(
      snippetRequest.bookmark_id || '',
      {
        snippet_text: snippetRequest.snippet_text,
        user_notes: snippetRequest.user_notes,
        source_type: 'annotation',
        selection_start: snippetRequest.selection_start,
        selection_end: snippetRequest.selection_end,
        highlight_color: snippetRequest.highlight_color
      },
      user.id
    )

    return NextResponse.json({
      success: true,
      data: snippet
    })

  } catch (error) {
    console.error('Error creating snippet:', error)
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookmarkId = searchParams.get('bookmark_id')

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Missing required parameter: bookmark_id' },
        { status: 400 }
      )
    }

    const snippets = await bookmarkOperations.getBookmarkSnippets(bookmarkId, user.id)

    return NextResponse.json({
      success: true,
      data: snippets
    })

  } catch (error) {
    console.error('Error fetching snippets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch snippets' },
      { status: 500 }
    )
  }
} 