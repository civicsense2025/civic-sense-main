import { createClient } from '@civicsense/shared/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/topics/[topicId]/figures
 * Get all public figures related to a topic
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const supabase = await createClient()
    const { topicId } = params

    // Get the topic with its related figures
    const { data: topic, error: topicError } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, related_figures')
      .eq('topic_id', topicId)
      .single()

    if (topicError) {
      console.error('Topic fetch error:', topicError)
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // If no related figures, return empty array
    if (!topic.related_figures || !Array.isArray(topic.related_figures) || topic.related_figures.length === 0) {
      return NextResponse.json({
        topic: { topic_id: topic.topic_id, topic_title: topic.topic_title },
        figures: [],
        count: 0
      })
    }

    // Get the figure details
    const { data: figures, error: figuresError } = await supabase
      .from('public_figures')
      .select(`
        id,
        full_name,
        display_name,
        image_url,
        party_affiliation,
        office,
        current_state,
        bio,
        is_politician
      `)
      .in('id', topic.related_figures)
      .order('full_name')

    if (figuresError) {
      console.error('Figures fetch error:', figuresError)
      return NextResponse.json(
        { error: 'Failed to fetch figure details' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      topic: { topic_id: topic.topic_id, topic_title: topic.topic_title },
      figures: figures || [],
      count: figures?.length || 0
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/topics/[topicId]/figures
 * Update the figures related to a topic
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const supabase = await createClient()
    const { topicId } = params
    const { figureIds } = await request.json()

    // Validate input
    if (!Array.isArray(figureIds)) {
      return NextResponse.json(
        { error: 'figureIds must be an array' },
        { status: 400 }
      )
    }

    // Validate that all figure IDs exist
    if (figureIds.length > 0) {
      const { data: existingFigures, error: validateError } = await supabase
        .from('public_figures')
        .select('id')
        .in('id', figureIds)

      if (validateError) {
        console.error('Validation error:', validateError)
        return NextResponse.json(
          { error: 'Failed to validate figure IDs' },
          { status: 500 }
        )
      }

      const existingIds = existingFigures?.map(f => f.id) || []
      const invalidIds = figureIds.filter(id => !existingIds.includes(id))
      
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Invalid figure IDs: ${invalidIds.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Update the topic with new figure relationships
    const { error: updateError } = await supabase
      .from('question_topics')
      .update({ related_figures: figureIds })
      .eq('topic_id', topicId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update topic figures' },
        { status: 500 }
      )
    }

    // Return the updated data
    const { data: updatedTopic, error: fetchError } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, related_figures')
      .eq('topic_id', topicId)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch updated topic' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      topic: updatedTopic,
      message: `Updated ${figureIds.length} figure relationships`,
      success: true
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/topics/[topicId]/figures
 * Add a figure to a topic (append to existing)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const supabase = await createClient()
    const { topicId } = params
    const { figureId } = await request.json()

    if (!figureId || typeof figureId !== 'string') {
      return NextResponse.json(
        { error: 'figureId is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate that the figure exists
    const { data: figure, error: figureError } = await supabase
      .from('public_figures')
      .select('id, full_name')
      .eq('id', figureId)
      .single()

    if (figureError || !figure) {
      return NextResponse.json(
        { error: 'Figure not found' },
        { status: 404 }
      )
    }

    // Get current topic
    const { data: topic, error: topicError } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, related_figures')
      .eq('topic_id', topicId)
      .single()

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Check if figure is already related
    const currentFigures = Array.isArray(topic.related_figures) ? topic.related_figures : []
    if (currentFigures.includes(figureId)) {
      return NextResponse.json(
        { error: 'Figure is already related to this topic' },
        { status: 400 }
      )
    }

    // Add the figure
    const updatedFigures = [...currentFigures, figureId]
    const { error: updateError } = await supabase
      .from('question_topics')
      .update({ related_figures: updatedFigures })
      .eq('topic_id', topicId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to add figure to topic' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      topic: { ...topic, related_figures: updatedFigures },
      figure: figure,
      message: `Added ${figure.full_name} to ${topic.topic_title}`,
      success: true
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/topics/[topicId]/figures
 * Remove a figure from a topic
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const supabase = await createClient()
    const { topicId } = params
    const { searchParams } = new URL(request.url)
    const figureId = searchParams.get('figureId')

    if (!figureId) {
      return NextResponse.json(
        { error: 'figureId query parameter is required' },
        { status: 400 }
      )
    }

    // Get current topic
    const { data: topic, error: topicError } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, related_figures')
      .eq('topic_id', topicId)
      .single()

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Remove the figure
    const currentFigures = Array.isArray(topic.related_figures) ? topic.related_figures : []
    const updatedFigures = currentFigures.filter(id => id !== figureId)

    if (updatedFigures.length === currentFigures.length) {
      return NextResponse.json(
        { error: 'Figure was not related to this topic' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('question_topics')
      .update({ related_figures: updatedFigures })
      .eq('topic_id', topicId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove figure from topic' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      topic: { ...topic, related_figures: updatedFigures },
      message: `Removed figure from ${topic.topic_title}`,
      success: true
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 