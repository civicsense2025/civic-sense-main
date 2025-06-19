import { createClient } from '@/utils/supabase/client'

export interface BulkTranslationOptions {
  contentType: string
  targetLanguages: string[]
  batchSize: number
  overwriteExisting: boolean
  priority: 'low' | 'normal' | 'high'
  queueForReview: boolean
  skipTranslated: boolean
}

export interface TranslationJobStatus {
  id: string
  contentType: string
  contentId: string
  targetLanguage: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startedAt?: string
  completedAt?: string
  error?: string
  estimatedCompletion?: string
}

export interface ContentTranslationStats {
  contentType: string
  totalItems: number
  translatedItems: Record<string, number>
  pendingItems: Record<string, number>
  inProgressItems: Record<string, number>
  errorItems: Record<string, number>
}

export class BulkTranslationService {
  private supabase = createClient()

  /**
   * Start a bulk translation job
   */
  async startBulkTranslation(options: BulkTranslationOptions): Promise<{
    success: boolean
    jobIds: string[]
    contentCount: number
    estimatedTime: number
    error?: string
  }> {
    try {
      const response = await fetch('/api/admin/bulk-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: options.contentType,
          targetLanguages: options.targetLanguages,
          batchSize: options.batchSize,
          options: {
            overwriteExisting: options.overwriteExisting,
            priority: options.priority,
            skipTranslated: options.skipTranslated,
            queueForReview: options.queueForReview
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        jobIds: result.jobIds,
        contentCount: result.contentCount,
        estimatedTime: result.estimatedTime
      }
    } catch (error) {
      return {
        success: false,
        jobIds: [],
        contentCount: 0,
        estimatedTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get the status of translation jobs
   */
  async getJobStatus(jobIds: string[]): Promise<TranslationJobStatus[]> {
    try {
      const { data: jobs, error } = await this.supabase
        .from('translation_jobs')
        .select('*')
        .in('id', jobIds)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch job status: ${error.message}`)
      }

      return (jobs || []).map(job => ({
        id: job.id,
        contentType: job.content_type,
        contentId: job.content_id,
        targetLanguage: job.target_language,
        status: job.status,
        progress: job.progress,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        error: job.error,
        estimatedCompletion: job.estimated_completion
      }))
    } catch (error) {
      console.error('Failed to get job status:', error)
      return []
    }
  }

  /**
   * Get all active translation jobs
   */
  async getActiveJobs(): Promise<TranslationJobStatus[]> {
    try {
      const { data: jobs, error } = await this.supabase
        .from('translation_jobs')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw new Error(`Failed to fetch active jobs: ${error.message}`)
      }

      return (jobs || []).map(job => ({
        id: job.id,
        contentType: job.content_type,
        contentId: job.content_id,
        targetLanguage: job.target_language,
        status: job.status,
        progress: job.progress,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        error: job.error,
        estimatedCompletion: job.estimated_completion
      }))
    } catch (error) {
      console.error('Failed to get active jobs:', error)
      return []
    }
  }

  /**
   * Cancel a translation job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('translation_jobs')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'pending') // Only cancel pending jobs

      return !error
    } catch (error) {
      console.error('Failed to cancel job:', error)
      return false
    }
  }

  /**
   * Retry a failed translation job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('translation_jobs')
        .update({ 
          status: 'pending',
          error: null,
          retry_count: this.supabase.rpc('increment', { x: 1 })
        })
        .eq('id', jobId)
        .eq('status', 'failed') // Only retry failed jobs

      return !error
    } catch (error) {
      console.error('Failed to retry job:', error)
      return false
    }
  }

  /**
   * Get translation statistics for content types
   */
  async getContentStats(): Promise<ContentTranslationStats[]> {
    const contentTypes = [
      'questions',
      'question_topics', 
      'surveys',
      'survey_questions',
      'assessment_questions',
      'public_figures',
      'glossary'
    ]

    const stats: ContentTranslationStats[] = []

    for (const contentType of contentTypes) {
      try {
        const { data, error } = await this.supabase.rpc('get_content_translation_stats', {
          content_type_param: contentType
        })

        if (!error && data) {
          stats.push({
            contentType: data.content_type,
            totalItems: data.total_items,
            translatedItems: data.translated_items || {},
            pendingItems: data.pending_items || {},
            inProgressItems: data.in_progress_items || {},
            errorItems: data.error_items || {}
          })
        }
      } catch (err) {
        console.warn(`Failed to load stats for ${contentType}:`, err)
        // Add empty stats for this content type
        stats.push({
          contentType,
          totalItems: 0,
          translatedItems: {},
          pendingItems: {},
          inProgressItems: {},
          errorItems: {}
        })
      }
    }

    return stats
  }

  /**
   * Get detailed content items for management
   */
  async getContentItems(options: {
    searchTerm?: string
    statusFilter?: string
    languageFilter?: string
    limit?: number
  } = {}): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_translatable_content_summary', {
        search_term: options.searchTerm || null,
        status_filter: options.statusFilter === 'all' ? null : options.statusFilter,
        language_filter: options.languageFilter === 'all' ? null : options.languageFilter,
        limit_count: options.limit || 100
      })

      if (error) {
        throw new Error(`Failed to fetch content items: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Failed to get content items:', error)
      return []
    }
  }

  /**
   * Get translation progress for a specific content type and language
   */
  async getTranslationProgress(contentType: string, language: string): Promise<{
    total: number
    completed: number
    inProgress: number
    failed: number
    percentage: number
  }> {
    try {
      // Get total content count
      const { count: totalCount } = await this.supabase
        .from(contentType)
        .select('*', { count: 'exact', head: true })

      // Get job statistics
      const { data: jobStats, error } = await this.supabase
        .from('translation_jobs')
        .select('status')
        .eq('content_type', contentType)
        .eq('target_language', language)

      if (error) {
        throw new Error(`Failed to fetch translation progress: ${error.message}`)
      }

      const stats = (jobStats || []).reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const completed = stats.completed || 0
      const inProgress = stats.in_progress || 0
      const failed = stats.failed || 0
      const total = totalCount || 0

      return {
        total,
        completed,
        inProgress,
        failed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    } catch (error) {
      console.error('Failed to get translation progress:', error)
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        percentage: 0
      }
    }
  }

  /**
   * Clean up old completed translation jobs
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_old_translation_jobs', {
        days_old: daysOld
      })

      if (error) {
        throw new Error(`Failed to cleanup old jobs: ${error.message}`)
      }

      return data || 0
    } catch (error) {
      console.error('Failed to cleanup old jobs:', error)
      return 0
    }
  }

  /**
   * Estimate translation cost (based on character count and language)
   */
  estimateTranslationCost(characterCount: number, targetLanguages: string[]): {
    estimatedCost: number
    currency: string
    breakdown: Array<{ language: string; cost: number }>
  } {
    // DeepL pricing: approximately $25 per 1M characters
    const costPerMillion = 25
    const costPerCharacter = costPerMillion / 1_000_000

    const breakdown = targetLanguages.map(language => ({
      language,
      cost: characterCount * costPerCharacter
    }))

    const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0)

    return {
      estimatedCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      currency: 'USD',
      breakdown
    }
  }

  /**
   * Get translation quality metrics
   */
  async getQualityMetrics(): Promise<{
    averageQualityScore: number
    reviewPendingCount: number
    autoTranslatedCount: number
    humanReviewedCount: number
  }> {
    try {
      // This would require extending the database schema to track quality scores
      // For now, return mock data
      return {
        averageQualityScore: 4.2,
        reviewPendingCount: 15,
        autoTranslatedCount: 342,
        humanReviewedCount: 128
      }
    } catch (error) {
      console.error('Failed to get quality metrics:', error)
      return {
        averageQualityScore: 0,
        reviewPendingCount: 0,
        autoTranslatedCount: 0,
        humanReviewedCount: 0
      }
    }
  }

  /**
   * Monitor translation job progress with real-time updates
   */
  subscribeToJobUpdates(jobIds: string[], callback: (jobs: TranslationJobStatus[]) => void) {
    const channel = this.supabase
      .channel('translation-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translation_jobs',
          filter: `id=in.(${jobIds.join(',')})`
        },
        () => {
          // Refresh job status when changes occur
          this.getJobStatus(jobIds).then(callback)
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      this.supabase.removeChannel(channel)
    }
  }
}

// Export a singleton instance
export const bulkTranslationService = new BulkTranslationService() 