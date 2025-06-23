import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schemas
const ScheduleConfigSchema = z.object({
  interval: z.enum(['every12hours', 'daily', 'weekly', 'monthly']),
  timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  timezone: z.string().default('America/New_York'),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional()
})

const GenerationSettingsSchema = z.object({
  maxArticles: z.number().min(1).max(50).default(10),
  daysSinceCreated: z.number().min(0).max(30).default(7),
  questionsPerTopic: z.number().min(3).max(50).default(6),
  questionTypeDistribution: z.object({
    multipleChoice: z.number().min(0).max(100).default(60),
    trueFalse: z.number().min(0).max(100).default(25),
    shortAnswer: z.number().min(0).max(100).default(15),
    fillInBlank: z.number().min(0).max(100).default(0),
    matching: z.number().min(0).max(100).default(0)
  }).default({}),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(100).default(30),
    medium: z.number().min(0).max(100).default(50),
    hard: z.number().min(0).max(100).default(20)
  }).default({}),
  daysAhead: z.number().min(0).max(7).default(1),
  categories: z.array(z.string()).default([]),
  aiModel: z.enum(['gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219']).default('gpt-4-turbo'),
  temperature: z.number().min(0).max(2).default(0.7),
  autoApprove: z.boolean().default(false)
})

const CreateJobSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  jobType: z.enum(['content_generation', 'quiz_generation', 'survey_optimization']).default('content_generation'),
  scheduleConfig: ScheduleConfigSchema,
  generationSettings: GenerationSettingsSchema,
  maxFailures: z.number().min(1).max(10).default(3)
})

const ActionSchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'run_now', 'toggle_active', 'preview']),
  jobId: z.string().uuid().optional(),
  jobData: CreateJobSchema.optional(),
  userId: z.string().uuid()
})

// GET - List all scheduled jobs for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const includeInactive = url.searchParams.get('includeInactive') === 'true'
    const includeLogs = url.searchParams.get('includeLogs') === 'true'

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from('scheduled_content_jobs')
      .select(`
        *,
        ${includeLogs ? `
        job_execution_logs (
          id,
          started_at,
          completed_at,
          status,
          execution_time_ms,
          content_generated,
          topics_created,
          questions_created,
          error_message
        )
        ` : ''}
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: jobs, error } = await query

    if (error) throw error

    // Calculate job statistics
    const jobsData = jobs as any[] || []
    const statistics = {
      totalJobs: jobsData.length,
      activeJobs: jobsData.filter(job => job.is_active).length,
      totalRuns: jobsData.reduce((sum, job) => sum + (job.total_runs || 0), 0),
      successfulRuns: jobsData.reduce((sum, job) => sum + (job.successful_runs || 0), 0),
      totalContentGenerated: jobsData.reduce((sum, job) => sum + (job.total_content_generated || 0), 0),
      jobsReadyToRun: jobsData.filter(job => 
        job.is_active && 
        new Date(job.next_run_at) <= new Date() &&
        (job.consecutive_failures || 0) < (job.max_failures || 3)
      ).length
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      statistics
    })

  } catch (error) {
    console.error('Error fetching scheduled jobs:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// POST - Handle various job actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ActionSchema.parse(body)
    const { action, jobId, jobData, userId } = validatedData

    switch (action) {
      case 'create':
        return await createScheduledJob(jobData!, userId)
      
      case 'update':
        if (!jobId) throw new Error('Job ID is required for update')
        return await updateScheduledJob(jobId, jobData!, userId)
      
      case 'delete':
        if (!jobId) throw new Error('Job ID is required for delete')
        return await deleteScheduledJob(jobId, userId)
      
      case 'run_now':
        if (!jobId) throw new Error('Job ID is required for run_now')
        return await runJobNow(jobId, userId)
      
      case 'toggle_active':
        if (!jobId) throw new Error('Job ID is required for toggle_active')
        return await toggleJobActive(jobId, userId)
      
      case 'preview':
        return await generatePreview(jobData?.generationSettings!, userId)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing scheduled job:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

async function createScheduledJob(jobData: z.infer<typeof CreateJobSchema>, userId: string) {
  // Calculate next run time using database function
  const { data: nextRunResult } = await supabase
    .rpc('calculate_next_run_time', {
      schedule_config: jobData.scheduleConfig
    })

  if (!nextRunResult) {
    throw new Error('Failed to calculate next run time')
  }

  const { data: job, error } = await supabase
    .from('scheduled_content_jobs')
    .insert({
      name: jobData.name,
      description: jobData.description,
      job_type: jobData.jobType,
      schedule_config: jobData.scheduleConfig,
      generation_settings: jobData.generationSettings,
      max_failures: jobData.maxFailures,
      next_run_at: nextRunResult,
      created_by: userId
    })
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    message: 'Scheduled job created successfully',
    job: job
  })
}

async function updateScheduledJob(jobId: string, jobData: z.infer<typeof CreateJobSchema>, userId: string) {
  // Calculate new next run time
  const { data: nextRunResult } = await supabase
    .rpc('calculate_next_run_time', {
      schedule_config: jobData.scheduleConfig
    })

  if (!nextRunResult) {
    throw new Error('Failed to calculate next run time')
  }

  const { data: job, error } = await supabase
    .from('scheduled_content_jobs')
    .update({
      name: jobData.name,
      description: jobData.description,
      job_type: jobData.jobType,
      schedule_config: jobData.scheduleConfig,
      generation_settings: jobData.generationSettings,
      max_failures: jobData.maxFailures,
      next_run_at: nextRunResult,
      updated_by: userId
    })
    .eq('id', jobId)
    .eq('created_by', userId)
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    message: 'Scheduled job updated successfully',
    job: job
  })
}

async function deleteScheduledJob(jobId: string, userId: string) {
  const { error } = await supabase
    .from('scheduled_content_jobs')
    .delete()
    .eq('id', jobId)
    .eq('created_by', userId)

  if (error) throw error

  return NextResponse.json({
    success: true,
    message: 'Scheduled job deleted successfully'
  })
}

async function toggleJobActive(jobId: string, userId: string) {
  // First get the current status
  const { data: job, error: fetchError } = await supabase
    .from('scheduled_content_jobs')
    .select('is_active')
    .eq('id', jobId)
    .eq('created_by', userId)
    .single()

  if (fetchError) throw fetchError

  // Toggle the status
  const { data: updatedJob, error: updateError } = await supabase
    .from('scheduled_content_jobs')
    .update({ 
      is_active: !job.is_active,
      updated_by: userId
    })
    .eq('id', jobId)
    .eq('created_by', userId)
    .select()
    .single()

  if (updateError) throw updateError

  return NextResponse.json({
    success: true,
    message: `Job ${updatedJob.is_active ? 'activated' : 'deactivated'} successfully`,
    job: updatedJob
  })
}

async function runJobNow(jobId: string, userId: string) {
  // Get job details
  const { data: job, error: jobError } = await supabase
    .from('scheduled_content_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('created_by', userId)
    .single()

  if (jobError) throw jobError

  // Create execution log entry
  const { data: logEntry, error: logError } = await supabase
    .from('job_execution_logs')
    .insert({
      job_id: jobId,
      status: 'running',
      execution_metadata: {
        triggeredBy: 'manual',
        userId: userId,
        settings: job.generation_settings
      }
    })
    .select()
    .single()

  if (logError) throw logError

  try {
    // Execute the content generation
    const generationResult = await triggerContentGeneration(job.generation_settings, userId)

    // Update execution log with success
    await supabase
      .from('job_execution_logs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - new Date(logEntry.started_at).getTime(),
        content_generated: generationResult.results?.topicsGenerated || 0,
        topics_created: generationResult.results?.topicsGenerated || 0,
        questions_created: generationResult.results?.questionsGenerated || 0,
        execution_metadata: {
          ...logEntry.execution_metadata,
          result: generationResult
        }
      })
      .eq('id', logEntry.id)

    // Update job status using database function
    await supabase.rpc('update_job_after_execution', {
      job_id: jobId,
      execution_success: true,
      execution_result: generationResult,
      content_generated: generationResult.results?.topicsGenerated || 0
    })

    return NextResponse.json({
      success: true,
      message: 'Job executed successfully',
      result: generationResult
    })

  } catch (error) {
    // Update execution log with failure
    await supabase
      .from('job_execution_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        execution_time_ms: Date.now() - new Date(logEntry.started_at).getTime(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_details: { error: error instanceof Error ? error.stack : String(error) }
      })
      .eq('id', logEntry.id)

    // Update job status
    await supabase.rpc('update_job_after_execution', {
      job_id: jobId,
      execution_success: false,
      execution_result: { error: error instanceof Error ? error.message : 'Unknown error' },
      content_generated: 0
    })

    throw error
  }
}

async function generatePreview(settings: any, userId: string) {
  try {
    // Create cache key based on settings
    const cacheKey = `preview_${userId}_${Buffer.from(JSON.stringify(settings)).toString('base64').slice(0, 32)}`
    
    // Check if preview exists in cache
    const { data: cachedPreview } = await supabase
      .from('content_preview_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .eq('created_by', userId)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (cachedPreview) {
      // Update access count and return cached preview
      await supabase
        .from('content_preview_cache')
        .update({ 
          access_count: cachedPreview.access_count + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', cachedPreview.id)

      return NextResponse.json({
        success: true,
        preview: cachedPreview.preview_data,
        cached: true,
        generatedAt: cachedPreview.created_at
      })
    }

    // Generate new preview
    const previewData = await generateContentPreview(settings)

    // Cache the preview
    await supabase
      .from('content_preview_cache')
      .insert({
        cache_key: cacheKey,
        cache_type: 'full_content_preview',
        preview_data: previewData,
        generation_settings: settings,
        created_by: userId
      })

    return NextResponse.json({
      success: true,
      preview: previewData,
      cached: false,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Preview generation failed'
    }, { status: 500 })
  }
}

async function triggerContentGeneration(settings: any, userId: string) {
  const generationPayload = {
    ...settings,
    generateForFutureDates: true,
    startDate: new Date(Date.now() + (settings.daysAhead || 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysToGenerate: 1,
    forceGeneration: false,
    userId: userId
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                 (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://civicsense.one')

  const response = await fetch(`${baseUrl}/api/admin/generate-content-from-news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(generationPayload)
  })

  if (!response.ok) {
    throw new Error(`Generation failed: ${response.statusText}`)
  }

  return await response.json()
}

async function generateContentPreview(settings: any) {
  // Fetch sample recent articles
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - (settings.daysSinceCreated || 7))

  const { data: articles } = await supabase
    .from('source_metadata')
    .select('title, description, domain, credibility_score, published_time')
    .gte('last_fetched_at', cutoffDate.toISOString())
    .gte('credibility_score', 70)
    .not('title', 'is', null)
    .order('credibility_score', { ascending: false })
    .limit(Math.min(settings.maxArticles || 10, 20))

  const sampleTopics = articles?.slice(0, 3).map((article, index) => ({
    id: `preview_topic_${index + 1}`,
    title: `How ${article.title.split(' ').slice(-3).join(' ')} Affects Your Democratic Voice`,
    description: `Understanding the power dynamics behind ${article.title.toLowerCase()}`,
    category: 'Government',
    source: article.domain,
    credibilityScore: article.credibility_score,
    estimatedQuestions: settings.questionsPerTopic || 6,
    difficulty: 'Mixed',
    civicActionSteps: [
      'Contact your representative about this issue',
      'Research local impact and attend town halls',
      'Join advocacy groups working on this topic'
    ]
  })) || []

  const sampleQuestions = [
    {
      id: 'preview_q1',
      type: 'multiple_choice',
      difficulty: 'medium',
      text: 'Which institution has the ACTUAL power to influence this policy decision?',
      options: [
        'Congressional committees (official process)',
        'Lobbyists and special interests (real influence)',
        'Public opinion polls',
        'Media coverage'
      ],
      correctAnswer: 1,
      explanation: 'While Congress officially makes policy, lobbying expenditures of $3.7 billion annually show where real influence lies. This is what they don\'t want you to understand about how decisions actually get made.',
      civicAction: 'Look up your representatives\' donor lists at OpenSecrets.org, then contact them about this specific issue.',
      uncomfortableTruth: 'Most policy decisions are influenced more by lobbyist meetings than constituent calls'
    },
    {
      id: 'preview_q2',
      type: 'true_false',
      difficulty: 'easy',
      text: 'Citizens have meaningful input on this issue through normal voting.',
      options: ['True', 'False'],
      correctAnswer: 1,
      explanation: 'Voting happens every 2-6 years, but lobbying happens every day. Real influence requires strategic engagement between elections.',
      civicAction: 'Find the specific congressional committee handling this issue and contact committee members directly.',
      uncomfortableTruth: 'Your vote matters less than your strategic engagement with power structures'
    }
  ]

  return {
    articlesFound: articles?.length || 0,
    sampleTopics,
    sampleQuestions,
    estimatedOutput: {
      topicsPerRun: Math.min(settings.maxArticles || 10, articles?.length || 0),
      questionsPerRun: (Math.min(settings.maxArticles || 10, articles?.length || 0)) * (settings.questionsPerTopic || 6),
      contentType: 'Civic education that reveals uncomfortable truths about power',
      qualityLevel: 'Meets CivicSense brand standards'
    },
    generationSettings: {
      aiModel: settings.aiModel || 'gpt-4-turbo',
      temperature: settings.temperature || 0.7,
      questionTypes: settings.questionTypeDistribution,
      difficultyLevels: settings.difficultyDistribution,
      daysAhead: settings.daysAhead || 1
    },
    nextRun: 'Based on your schedule configuration',
    warnings: []
  }
} 