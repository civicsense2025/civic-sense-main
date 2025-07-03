import { useState } from 'react'
import { useToast } from './use-toast'

interface AIProcessingJob {
  id: string
  type: 'optimization' | 'key_takeaways'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  topicId?: string
  provider?: 'openai' | 'anthropic'
  cost?: number
  startedAt: string
  completedAt?: string
  error?: string
}

interface UseAIProcessingOptions {
  onSuccess?: (results: any) => void
  onError?: (error: Error) => void
}

export function useAIProcessing(options: UseAIProcessingOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [jobs, setJobs] = useState<AIProcessingJob[]>([])
  const { toast } = useToast()

  const startProcessing = async (
    topicIds: string[],
    processingType: 'optimization' | 'key_takeaways',
    provider: 'openai' | 'anthropic'
  ) => {
    try {
      setIsProcessing(true)

      // Create initial job entries
      const newJobs: AIProcessingJob[] = topicIds.map(topicId => ({
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: processingType,
        status: 'pending',
        progress: 0,
        topicId,
        provider,
        startedAt: new Date().toISOString()
      }))

      setJobs(prev => [...prev, ...newJobs])

      // Start processing
      const response = await fetch('/api/admin/question-topics/ai-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topicIds,
          processingType,
          provider
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process topics')
      }

      const data = await response.json()

      // Update jobs with results
      const updatedJobs = newJobs.map(job => {
        const result = data.results.find((r: any) => r.topic_id === job.topicId)
        const error = data.errors?.find((e: any) => e.topic_id === job.topicId)

        if (error) {
          return {
            ...job,
            status: 'failed' as const,
            error: error.error,
            completedAt: new Date().toISOString(),
            progress: 100
          }
        }

        if (result) {
          return {
            ...job,
            status: 'completed' as const,
            progress: 100,
            completedAt: new Date().toISOString(),
            cost: result.cost
          }
        }

        return {
          ...job,
          status: 'failed' as const,
          error: 'No result found',
          completedAt: new Date().toISOString(),
          progress: 100
        }
      })

      setJobs(prev => {
        const otherJobs = prev.filter(j => !newJobs.find(nj => nj.id === j.id))
        return [...otherJobs, ...updatedJobs]
      })

      // Show success toast
      const successCount = updatedJobs.filter(j => j.status === 'completed').length
      const failureCount = updatedJobs.filter(j => j.status === 'failed').length

      if (successCount > 0) {
        toast({
          title: 'AI Processing Complete',
          description: `Successfully processed ${successCount} topics${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
          variant: failureCount > 0 ? 'destructive' : 'default'
        })
      } else {
        toast({
          title: 'AI Processing Failed',
          description: `Failed to process ${failureCount} topics`,
          variant: 'destructive'
        })
      }

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(data)
      }

    } catch (error) {
      console.error('AI processing error:', error)

      // Update all pending jobs as failed
      setJobs(prev => prev.map(job => 
        job.status === 'pending' ? {
          ...job,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString(),
          progress: 100
        } : job
      ))

      // Show error toast
      toast({
        title: 'AI Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process topics',
        variant: 'destructive'
      })

      // Call error callback
      if (options.onError && error instanceof Error) {
        options.onError(error)
      }

    } finally {
      setIsProcessing(false)
    }
  }

  const clearJobs = () => {
    setJobs([])
  }

  const removeJob = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }

  return {
    isProcessing,
    jobs,
    startProcessing,
    clearJobs,
    removeJob
  }
} 