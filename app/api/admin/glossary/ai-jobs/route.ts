import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Try to fetch AI generation jobs - gracefully handle if table doesn't exist
    try {
      let query = supabase
        .from('ai_generation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: jobs, error: jobsError } = await query

      if (jobsError) {
        console.warn('AI jobs table may not exist:', jobsError)
        // Return empty jobs list if table doesn't exist
        return NextResponse.json({
          success: true,
          jobs: [],
          total: 0,
          by_status: {
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0
          },
          by_provider: {
            openai: 0,
            anthropic: 0
          },
          message: 'AI jobs tracking not yet configured'
        })
      }

      // Calculate statistics
      const statusCounts = {
        pending: jobs?.filter(j => j.status === 'pending').length || 0,
        running: jobs?.filter(j => j.status === 'running').length || 0,
        completed: jobs?.filter(j => j.status === 'completed').length || 0,
        failed: jobs?.filter(j => j.status === 'failed').length || 0
      }

      const providerCounts = {
        openai: jobs?.filter(j => j.provider === 'openai').length || 0,
        anthropic: jobs?.filter(j => j.provider === 'anthropic').length || 0
      }

      // Transform jobs data for response
      const transformedJobs = jobs?.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress || 0,
        provider: job.provider,
        created_at: job.created_at,
        completed_at: job.completed_at,
        error: job.error,
        cost: job.cost,
        results_count: Array.isArray(job.results) ? job.results.length : 0,
        input_summary: job.input_data ? {
          type: job.input_data.type,
          provider: job.input_data.provider,
          content_sources_count: job.input_data.content_sources?.length || 0,
          custom_content_length: job.input_data.custom_content?.length || 0
        } : null
      })) || []

      return NextResponse.json({
        success: true,
        jobs: transformedJobs,
        total: transformedJobs.length,
        by_status: statusCounts,
        by_provider: providerCounts
      })

    } catch (error) {
      console.warn('Error fetching AI jobs:', error)
      
      // Return mock data structure if table doesn't exist yet
      return NextResponse.json({
        success: true,
        jobs: [],
        total: 0,
        by_status: {
          pending: 0,
          running: 0,
          completed: 0,
          failed: 0
        },
        by_provider: {
          openai: 0,
          anthropic: 0
        },
        message: 'AI jobs tracking will be available after first generation'
      })
    }

  } catch (error) {
    console.error('Error in AI jobs API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch AI jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Create a new AI generation job manually
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const jobData = {
      type: body.type || 'generate_new',
      status: 'pending',
      progress: 0,
      provider: body.provider || 'anthropic',
      input_data: body.input_data || {},
      user_id: user.id,
      created_at: new Date().toISOString()
    }

    try {
      const { data: job, error: jobError } = await supabase
        .from('ai_generation_jobs')
        .insert([jobData])
        .select()
        .single()

      if (jobError) {
        console.warn('Could not create AI job record:', jobError)
        return NextResponse.json({ 
          error: 'AI jobs tracking not available',
          details: 'Database table may not exist yet'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        job,
        message: 'AI generation job created successfully'
      })

    } catch (error) {
      console.warn('AI jobs table may not exist:', error)
      return NextResponse.json({ 
        error: 'AI jobs tracking not configured',
        details: 'Please set up the ai_generation_jobs table'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error creating AI job:', error)
    return NextResponse.json({ 
      error: 'Failed to create AI job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 