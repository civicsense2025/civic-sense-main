/**
 * ============================================================================
 * TRANSLATION JOBS API ENDPOINT
 * ============================================================================
 * Handles creation, retrieval, and management of translation jobs.
 * Supports bulk translation job creation and status monitoring.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

interface TranslationJob {
  id: string
  content_type: string
  target_languages: string[]
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  progress: number
  total_items: number
  processed_items: number
  created_at: string
  completed_at?: string
  estimated_cost: number
  actual_cost?: number
  error_message?: string
  created_by: string
  metadata?: Record<string, any>
}

interface CreateJobRequest {
  content_type: string
  target_languages: string[]
  batch_size?: number
  options?: {
    overwrite_existing?: boolean
    priority?: 'low' | 'normal' | 'high'
  }
}

// ============================================================================
// GET HANDLER - Retrieve Translation Jobs
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const content_type = searchParams.get('content_type')

    // Build query
    let query = supabase
      .from('translation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters if provided
    if (status) {
      query = query.eq('status', status)
    }
    if (content_type) {
      query = query.eq('content_type', content_type)
    }

    const { data: jobs, error, count } = await query

    if (error) {
      // If translation_jobs table doesn't exist, return empty results
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          jobs: [],
          total_count: 0,
          has_more: false,
          message: 'Translation jobs table not yet initialized'
        })
      }
      throw new Error(`Database error: ${error.message}`)
    }

    // Format jobs data
    const formattedJobs: TranslationJob[] = (jobs || []).map(job => ({
      id: job.id,
      content_type: job.content_type,
      target_languages: job.target_languages || [],
      status: job.status,
      progress: job.progress || 0,
      total_items: job.total_items || 0,
      processed_items: job.processed_items || 0,
      created_at: job.created_at,
      completed_at: job.completed_at,
      estimated_cost: job.estimated_cost || 0,
      actual_cost: job.actual_cost,
      error_message: job.error_message,
      created_by: job.created_by,
      metadata: job.metadata || {}
    }))

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      total_count: count || 0,
      has_more: (count || 0) > offset + limit,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    console.error('Error fetching translation jobs:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch translation jobs',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

// ============================================================================
// POST HANDLER - Create Translation Job
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateJobRequest = await request.json()
    const { content_type, target_languages, batch_size = 50, options = {} } = body

    // Validate input
    if (!content_type || !target_languages || target_languages.length === 0) {
      return NextResponse.json({
        error: 'Missing required fields: content_type and target_languages',
        success: false
      }, { status: 400 })
    }

    // Validate content type
    const validContentTypes = ['question_topics', 'quiz_questions', 'glossary_terms', 'ui_strings']
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json({
        error: `Invalid content_type. Must be one of: ${validContentTypes.join(', ')}`,
        success: false
      }, { status: 400 })
    }

    // Get content count for cost estimation
    const contentStats = await getContentStats(supabase, content_type)
    const estimatedCost = calculateEstimatedCost(contentStats.total_items, target_languages.length)

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create job record
    const newJob: Partial<TranslationJob> = {
      id: jobId,
      content_type,
      target_languages,
      status: 'pending',
      progress: 0,
      total_items: contentStats.total_items,
      processed_items: 0,
      estimated_cost: estimatedCost,
      created_by: user.id,
      created_at: new Date().toISOString(),
      metadata: {
        batch_size,
        options,
        content_stats: contentStats
      }
    }

    // Insert job into database
    const { data: job, error: insertError } = await supabase
      .from('translation_jobs')
      .insert([newJob])
      .select()
      .single()

    if (insertError) {
      // If table doesn't exist, create it first
      if (insertError.code === '42P01') {
        await createTranslationJobsTable(supabase)
        // Retry insert
        const { data: retryJob, error: retryError } = await supabase
          .from('translation_jobs')
          .insert([newJob])
          .select()
          .single()
          
        if (retryError) {
          throw new Error(`Failed to create job after table creation: ${retryError.message}`)
        }
        
        // Start processing job asynchronously
        processTranslationJobAsync(jobId, supabase)
        
        return NextResponse.json({
          success: true,
          job: retryJob,
          message: `Translation job created for ${content_type} in ${target_languages.length} language(s)`
        })
      }
      
      throw new Error(`Failed to create translation job: ${insertError.message}`)
    }

    // Start processing job asynchronously (don't await)
    processTranslationJobAsync(jobId, supabase)

    return NextResponse.json({
      success: true,
      job,
      message: `Translation job created for ${content_type} in ${target_languages.length} language(s)`
    })

  } catch (error) {
    console.error('Error creating translation job:', error)
    
    return NextResponse.json({ 
      error: 'Failed to create translation job',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getContentStats(supabase: any, contentType: string) {
  try {
    const tableMap = {
      'question_topics': 'question_topics',
      'quiz_questions': 'questions', 
      'glossary_terms': 'glossary_terms',
      'ui_strings': 'translations'
    }

    const tableName = tableMap[contentType as keyof typeof tableMap]
    if (!tableName) {
      return { total_items: 0, table_name: '' }
    }

    const { count, error } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.warn(`Could not get count for ${tableName}:`, error)
      return { total_items: 0, table_name: tableName }
    }

    return {
      total_items: count || 0,
      table_name: tableName
    }
  } catch (error) {
    console.error(`Error getting content stats for ${contentType}:`, error)
    return { total_items: 0, table_name: '' }
  }
}

function calculateEstimatedCost(totalItems: number, languageCount: number): number {
  // Rough cost estimation: ~100 characters per item, $20 per 1M characters
  const avgCharsPerItem = 100
  const totalChars = totalItems * avgCharsPerItem * languageCount
  const costPerChar = 20 / 1000000 // $20 per million characters
  
  return Math.round(totalChars * costPerChar * 100) / 100 // Round to 2 decimal places
}

async function createTranslationJobsTable(supabase: any) {
  // This would typically be done via migration, but for demo purposes:
  console.log('Translation jobs table does not exist - would need to create via migration')
  // In a real implementation, you'd have proper database migrations
}

async function processTranslationJobAsync(jobId: string, supabase: any) {
  // This would be implemented as a background job processor
  // For now, simulate processing with a timeout
  setTimeout(async () => {
    try {
      // Update job status to running
      await supabase
        .from('translation_jobs')
        .update({ 
          status: 'running',
          progress: 10
        })
        .eq('id', jobId)

      // Simulate processing progress
      const progressUpdates = [25, 50, 75, 90, 100]
      for (const progress of progressUpdates) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        
        const isComplete = progress === 100
        await supabase
          .from('translation_jobs')
          .update({ 
            progress,
            status: isComplete ? 'completed' : 'running',
            processed_items: Math.floor((progress / 100) * 100), // Mock processed items
            completed_at: isComplete ? new Date().toISOString() : null,
            actual_cost: isComplete ? Math.random() * 10 : null // Mock cost
          })
          .eq('id', jobId)
      }
      
      console.log(`Translation job ${jobId} completed`)
    } catch (error) {
      console.error(`Error processing translation job ${jobId}:`, error)
      
      // Mark job as failed
      await supabase
        .from('translation_jobs')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Processing failed'
        })
        .eq('id', jobId)
    }
  }, 1000) // Start processing after 1 second
} 