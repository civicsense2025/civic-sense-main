import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@civicsense/shared/lib/supabase'
import { z } from 'zod'

// Topic suggestion schema
const topicSuggestionSchema = z.object({
  topic_title: z.string().min(1),
  description: z.string().min(1),
  why_this_matters: z.string().min(1),
  source_url: z.string().url().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = topicSuggestionSchema.parse(body)

    // Generate suggestion ID
    const suggestion_id = `${data.topic_title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)}_${data.date}`

    // Store suggestion
    const { error } = await supabase
      .from('topic_suggestions')
      .insert({
        suggestion_id,
        topic_title: data.topic_title,
        description: data.description,
        why_this_matters: data.why_this_matters,
        source_url: data.source_url,
        target_date: data.date,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error storing topic suggestion:', error)
      return NextResponse.json(
        { error: 'Failed to store topic suggestion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { suggestion_id }
    })
  } catch (error) {
    console.error('Error in suggest topic API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    )
  }
} 