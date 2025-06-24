import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Server-side Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema
const AIProcessRequestSchema = z.object({
  topicIds: z.array(z.string()).min(1).max(50),
  provider: z.enum(['openai', 'anthropic']),
  type: z.enum(['optimization', 'key_takeaways'])
})

interface AIProcessingJob {
  id: string
  type: 'optimization' | 'key_takeaways'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  topicsTotal: number
  topicsCompleted: number
  provider: 'openai' | 'anthropic'
  cost: number
  startedAt: string
  completedAt?: string
  error?: string
  results: any[]
  user_id: string
}

// Simple in-memory job store (in production, use Redis or database)
const jobStore = new Map<string, AIProcessingJob>()

// Cost tracking per token/request (approximate costs)
const COST_ESTIMATES = {
  anthropic: {
    input_per_1k_tokens: 0.003,
    output_per_1k_tokens: 0.015,
    avg_tokens_per_topic: 8000 // Estimated average
  },
  openai: {
    input_per_1k_tokens: 0.01,
    output_per_1k_tokens: 0.03,
    avg_tokens_per_topic: 6000 // Estimated average
  }
}

function estimateCost(provider: 'openai' | 'anthropic', topicCount: number): number {
  const costs = COST_ESTIMATES[provider]
  const totalTokens = costs.avg_tokens_per_topic * topicCount
  return (totalTokens / 1000) * (costs.input_per_1k_tokens + costs.output_per_1k_tokens)
}

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Note: This route is a placeholder for future AI processing features
// The actual implementation will be added when the required AI modules are available

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topicIds, provider, type } = AIProcessRequestSchema.parse(body)

    // Get user from auth header (implement proper auth check)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, extract user ID from session (implement proper session validation)
    const userId = 'admin_user' // Replace with actual user ID from session

    // Validate topics exist
    const { data: topics, error: topicsError } = await supabase
      .from('question_topics')
      .select('id, topic_id, topic_title')
      .in('topic_id', topicIds)
      .eq('is_active', true)

    if (topicsError || !topics || topics.length === 0) {
      return NextResponse.json(
        { error: 'No valid topics found' },
        { status: 400 }
      )
    }

    // Create job
    const jobId = generateJobId()
    const estimatedCost = estimateCost(provider, topics.length)
    
    const job: AIProcessingJob = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      topicsTotal: topics.length,
      topicsCompleted: 0,
      provider,
      cost: 0,
      startedAt: new Date().toISOString(),
      results: [],
      user_id: userId
    }

    jobStore.set(jobId, job)

    // Start background processing
    processTopicsInBackground(jobId, topics, provider, type)

    return NextResponse.json({
      jobId,
      status: 'pending',
      estimatedCost,
      topicsCount: topics.length,
      message: `Started ${type} processing for ${topics.length} topics using ${provider}`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const jobId = url.searchParams.get('jobId')

    if (!jobId) {
      // Return all jobs summary
      const jobs = Array.from(jobStore.values()).map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        topicsTotal: job.topicsTotal,
        topicsCompleted: job.topicsCompleted,
        provider: job.provider,
        cost: job.cost,
        startedAt: job.startedAt,
        completedAt: job.completedAt
      }))

      return NextResponse.json({ jobs })
    }

    // Return specific job status
    const job = jobStore.get(jobId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      topicsTotal: job.topicsTotal,
      topicsCompleted: job.topicsCompleted,
      provider: job.provider,
      cost: job.cost,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      results: job.results
    })

  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}

async function processTopicsInBackground(
  jobId: string,
  topics: any[],
  provider: 'openai' | 'anthropic',
  type: 'optimization' | 'key_takeaways'
) {
  const job = jobStore.get(jobId)
  if (!job) return

  try {
    job.status = 'running'
    jobStore.set(jobId, job)

    if (type === 'key_takeaways') {
      await processKeyTakeaways(jobId, topics, provider)
    } else if (type === 'optimization') {
      await processOptimization(jobId, topics, provider)
    }

    // Mark job as completed
    job.status = 'completed'
    job.completedAt = new Date().toISOString()
    job.progress = 100
    jobStore.set(jobId, job)

  } catch (error) {
    console.error('Background processing error:', error)
    job.status = 'failed'
    job.error = error instanceof Error ? error.message : 'Unknown error'
    job.completedAt = new Date().toISOString()
    jobStore.set(jobId, job)
  }
}

async function processKeyTakeaways(
  jobId: string,
  topics: any[],
  provider: 'openai' | 'anthropic'
) {
  const job = jobStore.get(jobId)!
  let totalCost = 0

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    
    try {
      // Update progress
      job.progress = Math.round((i / topics.length) * 100)
      job.topicsCompleted = i
      jobStore.set(jobId, job)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Estimate cost (simplified)
      const estimatedTopicCost = estimateCost(provider, 1)
      totalCost += estimatedTopicCost

      // For now, just mark as completed without actual AI processing
      job.results.push({
        topic_id: topic.topic_id,
        topic_title: topic.topic_title,
        status: 'success',
        cost: estimatedTopicCost,
        message: 'Key takeaways generation not yet implemented'
      })

    } catch (error) {
      console.error(`Error processing topic ${topic.topic_id}:`, error)
      job.results.push({
        topic_id: topic.topic_id,
        topic_title: topic.topic_title,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0
      })
    }

    // Update job cost
    job.cost = totalCost
    jobStore.set(jobId, job)
  }

  job.topicsCompleted = topics.length
  jobStore.set(jobId, job)
}

async function processOptimization(
  jobId: string,
  topics: any[],
  provider: 'openai' | 'anthropic'
) {
  const job = jobStore.get(jobId)!
  let totalCost = 0

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    
    try {
      // Update progress
      job.progress = Math.round((i / topics.length) * 100)
      job.topicsCompleted = i
      jobStore.set(jobId, job)

      // Get questions for this topic
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topic.topic_id)
        .eq('is_active', true)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const estimatedTopicCost = estimateCost(provider, 1)
      totalCost += estimatedTopicCost

      job.results.push({
        topic_id: topic.topic_id,
        topic_title: topic.topic_title,
        status: 'success',
        cost: estimatedTopicCost,
        questions_optimized: questions?.length || 0,
        message: 'Content optimization not yet implemented'
      })

    } catch (error) {
      console.error(`Error optimizing topic ${topic.topic_id}:`, error)
      job.results.push({
        topic_id: topic.topic_id,
        topic_title: topic.topic_title,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0
      })
    }

    // Update job cost
    job.cost = totalCost
    jobStore.set(jobId, job)
  }

  job.topicsCompleted = topics.length
  jobStore.set(jobId, job)
} 