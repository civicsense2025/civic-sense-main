/**
 * ============================================================================
 * PAUSE TRANSLATION JOB ENDPOINT
 * ============================================================================
 * Handles pausing active translation jobs with proper status validation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = params.id

    // Get current job status
    const { data: job, error: fetchError } = await supabase
      .from('translation_jobs')
      .select('status, created_by')
      .eq('id', jobId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Translation job not found',
          success: false
        }, { status: 404 })
      }
      throw new Error(`Failed to fetch job: ${fetchError.message}`)
    }

    // Validate job can be paused
    if (job.status !== 'running') {
      return NextResponse.json({
        error: `Job cannot be paused. Current status: ${job.status}`,
        success: false
      }, { status: 400 })
    }

    // Update job status to paused
    const { error: updateError } = await supabase
      .from('translation_jobs')
      .update({ 
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) {
      throw new Error(`Failed to pause job: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Translation job paused successfully',
      job_id: jobId,
      status: 'paused'
    })

  } catch (error) {
    console.error(`Error pausing translation job ${params.id}:`, error)
    
    return NextResponse.json({ 
      error: 'Failed to pause translation job',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
} 