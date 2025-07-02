import { createClient } from '@civicsense/shared/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parse } from 'url'

// Validation schema
const EventSubmissionSchema = z.object({
  url: z.string().url(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Validate request body
    const body = await request.json()
    const result = EventSubmissionSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', issues: result.error.issues },
        { status: 400 }
      )
    }
    
    const { url, eventDate } = result.data
    
    // Parse URL to get basic metadata
    const parsedUrl = parse(url)
    const sourceType = parsedUrl.hostname || 'unknown'
    
    // Insert into user_events table
    const { data: event, error } = await supabase
      .from('user_events')
      .insert({
        user_id: user.id,
        url,
        event_date: eventDate,
        source_type: sourceType,
        source_metadata: {
          hostname: parsedUrl.hostname,
          pathname: parsedUrl.pathname,
          protocol: parsedUrl.protocol
        }
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting event:', error)
      return NextResponse.json(
        { error: 'Failed to save event' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Error in event submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 