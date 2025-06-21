import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KeyTakeaways, validateKeyTakeaways } from '@/lib/types/key-takeaways'

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const supabase = await createClient()
    const topicId = params.topicId

    const { data, error } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, emoji, key_takeaways')
      .eq('topic_id', topicId)
      .single()

    if (error) {
      console.error('Failed to fetch topic key takeaways:', error)
      return NextResponse.json(
        { error: 'Failed to fetch topic key takeaways' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        topic_id: data.topic_id,
        topic_title: data.topic_title,
        emoji: data.emoji,
        key_takeaways: data.key_takeaways,
        has_key_takeaways: !!data.key_takeaways
      }
    })

  } catch (error) {
    console.error('API error in key-takeaways GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const supabase = await createClient()
    const topicId = params.topicId

    // Check authentication for updates
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // TODO: Add admin check here
    // For now, any authenticated user can update key takeaways
    // In production, you'd want to restrict this to admins

    const body = await request.json()
    const { key_takeaways } = body

    // Validate the key takeaways structure
    if (!validateKeyTakeaways(key_takeaways)) {
      return NextResponse.json(
        { error: 'Invalid key takeaways structure' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('question_topics')
      .update({ key_takeaways })
      .eq('topic_id', topicId)
      .select('topic_id, topic_title, emoji, key_takeaways')
      .single()

    if (error) {
      console.error('Failed to update topic key takeaways:', error)
      return NextResponse.json(
        { error: 'Failed to update topic key takeaways' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        topic_id: data.topic_id,
        topic_title: data.topic_title,
        emoji: data.emoji,
        key_takeaways: data.key_takeaways
      }
    })

  } catch (error) {
    console.error('API error in key-takeaways PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 