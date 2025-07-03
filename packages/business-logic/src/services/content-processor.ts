import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ScheduledJob {
  id: string
  name: string
  job_type: string
  generation_settings: any
  created_by: string
  next_run_at: string
  schedule_config: any
}

export interface JobExecutionResult {
  success: boolean
  contentGenerated: number
  topicsCreated: number
  questionsCreated: number
  executionTimeMs: number
  error?: string
  result?: any
}

export class ScheduledContentProcessor {
  private isProcessing = false
  private maxConcurrentJobs = 3
  private currentJobs = new Set<string>()
  private workerInstanceId: string

  constructor() {
    this.workerInstanceId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🔧 Initialized ScheduledContentProcessor: ${this.workerInstanceId}`)
  }

  /**
   * Main processing loop - check for jobs and execute them
   */
  async processScheduledJobs(): Promise<void> {
    if (this.isProcessing) {
      console.log('📋 Job processor already running, skipping...')
      return
    }

    this.isProcessing = true
    console.log(`🔄 Starting scheduled job processing cycle: ${new Date().toISOString()}`)

    try {
      // Get jobs ready for execution
      const readyJobs = await this.getJobsReadyForExecution()
      
      if (readyJobs.length === 0) {
        console.log('📭 No scheduled jobs ready for execution')
        return
      }

      console.log(`🎯 Found ${readyJobs.length} job(s) ready for execution`)

      // Process jobs (respecting concurrency limits)
      const jobsToProcess = readyJobs.slice(0, this.maxConcurrentJobs - this.currentJobs.size)
      
      if (jobsToProcess.length === 0) {
        console.log(`⏳ All worker slots busy (${this.currentJobs.size}/${this.maxConcurrentJobs})`)
        return
      }

      // Execute jobs concurrently
      const promises = jobsToProcess.map(job => this.executeJob(job))
      const results = await Promise.allSettled(promises)

      // Log execution summary
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      console.log(`✅ Job processing cycle complete: ${successful} successful, ${failed} failed`)

    } catch (error) {
      console.error('❌ Error in job processing cycle:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Get jobs ready for execution from the database
   */
  private async getJobsReadyForExecution(): Promise<ScheduledJob[]> {
    try {
      const { data: jobs, error } = await supabase
        .rpc('get_jobs_ready_for_execution')

      if (error) {
        console.error('Error fetching ready jobs:', error)
        return []
      }

      return jobs || []
    } catch (error) {
      console.error('Error in getJobsReadyForExecution:', error)
      return []
    }
  }

  /**
   * Execute a single scheduled job
   */
  private async executeJob(job: ScheduledJob): Promise<JobExecutionResult> {
    const startTime = Date.now()
    const jobId = job.id
    
    // Add to current jobs set
    this.currentJobs.add(jobId)
    
    console.log(`🚀 Executing job: ${job.name} (${jobId})`)

    // Create execution log entry
    let logEntryId: string
    try {
      const { data: logEntry, error: logError } = await supabase
        .from('job_execution_logs')
        .insert({
          job_id: jobId,
          status: 'running',
          execution_metadata: {
            triggeredBy: 'scheduler',
            workerInstanceId: this.workerInstanceId,
            userId: job.created_by,
            settings: job.generation_settings,
            startedAt: new Date().toISOString()
          }
        })
        .select('id')
        .single()

      if (logError) throw logError
      logEntryId = logEntry.id

    } catch (error) {
      console.error(`Failed to create execution log for job ${jobId}:`, error)
      this.currentJobs.delete(jobId)
      throw error
    }

    try {
      // Execute the actual content generation
      const result = await this.executeContentGeneration(job)
      
      const executionTime = Date.now() - startTime

      // Update execution log with success
      await supabase
        .from('job_execution_logs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          execution_time_ms: executionTime,
          content_generated: result.contentGenerated,
          topics_created: result.topicsCreated,
          questions_created: result.questionsCreated,
          execution_metadata: {
            triggeredBy: 'scheduler',
            workerInstanceId: this.workerInstanceId,
            userId: job.created_by,
            settings: job.generation_settings,
            result: result.result,
            completedAt: new Date().toISOString()
          }
        })
        .eq('id', logEntryId)

      // Update job status using database function
      await supabase.rpc('update_job_after_execution', {
        job_id: jobId,
        execution_success: true,
        execution_result: result.result,
        content_generated: result.contentGenerated
      })

      console.log(`✅ Job completed successfully: ${job.name} (${executionTime}ms)`)
      console.log(`   📊 Generated: ${result.topicsCreated} topics, ${result.questionsCreated} questions`)

      return {
        success: true,
        executionTimeMs: executionTime,
        ...result
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`❌ Job failed: ${job.name} (${executionTime}ms)`, error)

      // Update execution log with failure
      await supabase
        .from('job_execution_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          execution_time_ms: executionTime,
          error_message: errorMessage,
          error_details: { 
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          }
        })
        .eq('id', logEntryId)

      // Update job status
      await supabase.rpc('update_job_after_execution', {
        job_id: jobId,
        execution_success: false,
        execution_result: { error: errorMessage },
        content_generated: 0
      })

      return {
        success: false,
        executionTimeMs: executionTime,
        contentGenerated: 0,
        topicsCreated: 0,
        questionsCreated: 0,
        error: errorMessage
      }

    } finally {
      this.currentJobs.delete(jobId)
    }
  }

  /**
   * Execute the actual content generation for a job
   */
  private async executeContentGeneration(job: ScheduledJob): Promise<Omit<JobExecutionResult, 'success' | 'executionTimeMs'>> {
    const settings = job.generation_settings

    // Calculate target date based on daysAhead setting
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + (settings.daysAhead || 1))

    const generationPayload = {
      maxArticles: settings.maxArticles || 10,
      daysSinceCreated: settings.daysSinceCreated || 7,
      questionsPerTopic: settings.questionsPerTopic || 6,
      questionTypeDistribution: settings.questionTypeDistribution || {
        multipleChoice: 60,
        trueFalse: 25,
        shortAnswer: 15,
        fillInBlank: 0,
        matching: 0
      },
      difficultyDistribution: settings.difficultyDistribution || {
        easy: 30,
        medium: 50,
        hard: 20
      },
      generateForFutureDates: true,
      startDate: targetDate.toISOString().split('T')[0],
      daysToGenerate: 1,
      forceGeneration: false,
      userId: job.created_by,
      categories: settings.categories || [],
      scheduledJobId: job.id // Track which job generated this content
    }

    console.log(`🎯 Generating content for ${targetDate.toISOString().split('T')[0]}`)

    // Call the main generation endpoint with proper URL handling
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://civicsense.one')
    
    const response = await fetch(`${baseUrl}/api/admin/generate-content-from-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `CivicSense-Scheduler/${this.workerInstanceId}`
      },
      body: JSON.stringify(generationPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Content generation failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(`Content generation failed: ${result.error || 'Unknown error'}`)
    }

    return {
      contentGenerated: result.results?.topicsGenerated || 0,
      topicsCreated: result.results?.topicsGenerated || 0,
      questionsCreated: result.results?.questionsGenerated || 0,
      result: result
    }
  }

  /**
   * Cleanup expired queue items and old logs
   */
  async performMaintenance(): Promise<void> {
    console.log('🧹 Performing maintenance cleanup...')

    try {
      await supabase.rpc('cleanup_old_job_data')
      console.log('✅ Maintenance cleanup completed')
    } catch (error) {
      console.error('❌ Error during maintenance cleanup:', error)
    }
  }

  /**
   * Get current processing status
   */
  getStatus() {
    return {
      workerInstanceId: this.workerInstanceId,
      isProcessing: this.isProcessing,
      currentJobs: Array.from(this.currentJobs),
      activeJobCount: this.currentJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      availableSlots: this.maxConcurrentJobs - this.currentJobs.size
    }
  }

  /**
   * Gracefully shutdown the processor
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down ScheduledContentProcessor...')
    
    this.isProcessing = false
    
    // Wait for current jobs to complete (with timeout)
    const shutdownTimeout = 30000 // 30 seconds
    const startTime = Date.now()
    
    while (this.currentJobs.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      console.log(`⏳ Waiting for ${this.currentJobs.size} job(s) to complete...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    if (this.currentJobs.size > 0) {
      console.warn(`⚠️  Forced shutdown with ${this.currentJobs.size} job(s) still running`)
    }
    
    console.log('✅ ScheduledContentProcessor shutdown complete')
  }
}

// Export singleton instance
export const scheduledContentProcessor = new ScheduledContentProcessor()

// Auto-start processing if we're in a server environment
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Set up periodic processing (every 5 minutes)
  const PROCESSING_INTERVAL = 5 * 60 * 1000 // 5 minutes
  
  setInterval(() => {
    scheduledContentProcessor.processScheduledJobs().catch(error => {
      console.error('Scheduled job processing error:', error)
    })
  }, PROCESSING_INTERVAL)

  // Set up maintenance (every hour)
  const MAINTENANCE_INTERVAL = 60 * 60 * 1000 // 1 hour
  
  setInterval(() => {
    scheduledContentProcessor.performMaintenance().catch(error => {
      console.error('Maintenance error:', error)
    })
  }, MAINTENANCE_INTERVAL)

  // Initial processing run
  setTimeout(() => {
    scheduledContentProcessor.processScheduledJobs().catch(error => {
      console.error('Initial job processing error:', error)
    })
  }, 10000) // Wait 10 seconds after startup

  console.log('🕐 Scheduled content processor initialized with automatic processing')
} 