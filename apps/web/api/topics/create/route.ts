import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@civicsense/shared/lib/supabase'
import { z } from 'zod'

// Topic creation schema
const createTopicSchema = z.object({
  topic_title: z.string(),
  description: z.string(),
  why_this_matters: z.string(),
  emoji: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categories: z.array(z.string()),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_breaking: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTopicSchema.parse(body)

    // Generate topic ID from title and date
    const topic_id = `${data.topic_title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)}_${data.date}`

    // Create topic
    const { data: topic, error } = await supabase
      .from('question_topics')
      .insert({
        ...data,
        topic_id,
        day_of_week: new Date(data.date).toLocaleDateString('en-US', { weekday: 'long' })
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating topic:', error)
      return NextResponse.json(
        { error: 'Failed to create topic' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: topic
    })
  } catch (error) {
    console.error('Error in create topic API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    )
  }
} 