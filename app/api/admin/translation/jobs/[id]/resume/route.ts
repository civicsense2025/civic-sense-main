/**
 * ============================================================================
 * RESUME TRANSLATION JOB ENDPOINT
 * ============================================================================
 * Handles resuming paused translation jobs with proper status validation.
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
      .select('status, created_by, progress, processed_items')
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

    // Validate job can be resumed
    if (job.status !== 'paused') {
      return NextResponse.json({
        error: `Job cannot be resumed. Current status: ${job.status}`,
        success: false
      }, { status: 400 })
    }

    // Check if job is already completed
    if (job.progress >= 100) {
      return NextResponse.json({
        error: 'Job is already completed and cannot be resumed',
        success: false
      }, { status: 400 })
    }

    // Update job status to running
    const { error: updateError } = await supabase
      .from('translation_jobs')
      .update({ 
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) {
      throw new Error(`Failed to resume job: ${updateError.message}`)
    }

    // TODO: In a real implementation, restart the background processor
    // restartTranslationProcessor(jobId, job.progress, job.processed_items)

    return NextResponse.json({
      success: true,
      message: 'Translation job resumed successfully',
      job_id: jobId,
      status: 'running',
      resumed_from_progress: job.progress
    })

  } catch (error) {
    console.error(`Error resuming translation job ${params.id}:`, error)
    
    return NextResponse.json({ 
      error: 'Failed to resume translation job',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
} 