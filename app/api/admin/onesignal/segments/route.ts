import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SegmentSchema = z.object({
  segment_name: z.string().min(1),
  description: z.string(),
  criteria: z.record(z.any()),
  segment_type: z.enum(['civic_engagement', 'location', 'quiz_performance', 'voting', 'custom']),
  is_dynamic: z.boolean().default(true)
})

// GET - Fetch all segments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRoles || userRoles.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch segments
    const { data: segments, error } = await supabase
      .from('onesignal_segments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching segments:', error)
      return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      segments: segments || []
    })
  } catch (error) {
    console.error('Error in segments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new segment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRoles || userRoles.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = SegmentSchema.parse(body)

    // Calculate estimated user count based on criteria
    let estimatedUserCount = 0
    try {
      // This is a simplified calculation - in reality you'd run the actual query
      const { count } = await supabase
        .from('onesignal_user_tags')
        .select('*', { count: 'exact', head: true })
      
      estimatedUserCount = count || 0
    } catch (error) {
      console.warn('Error calculating user count:', error)
    }

    // Create segment
    const { data: segment, error } = await supabase
      .from('onesignal_segments')
      .insert({
        ...validatedData,
        estimated_user_count: estimatedUserCount,
        actual_user_count: estimatedUserCount,
        created_by: user.id,
        sync_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating segment:', error)
      return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      segment
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in segments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update segment
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRoles || userRoles.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Segment ID required' }, { status: 400 })
    }

    const validatedData = SegmentSchema.partial().parse(updateData)

    // Update segment
    const { data: segment, error } = await supabase
      .from('onesignal_segments')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating segment:', error)
      return NextResponse.json({ error: 'Failed to update segment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      segment
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in segments PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 