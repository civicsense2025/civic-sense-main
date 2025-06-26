import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-access'

// ============================================================================
// AI TOOLS MANAGEMENT API
// ============================================================================

interface AIStats {
  total_tools: number
  active_tools: number
  total_requests_today: number
  success_rate: number
  avg_response_time: number
  total_cost_today: number
  total_cost_month: number
  by_provider: Record<string, number>
  by_type: Record<string, number>
  queue_status: {
    pending: number
    running: number
    completed_today: number
    failed_today: number
  }
}

interface AITool {
  id: string
  name: string
  type: 'content_generator' | 'bias_analyzer' | 'fact_checker' | 'summarizer' | 'translator' | 'moderator' | 'congressional_sync' | 'photo_processor' | 'key_takeaways' | 'news_agent'
  provider: 'openai' | 'anthropic' | 'google' | 'custom'
  model: string
  status: 'active' | 'paused' | 'error' | 'maintenance'
  description: string
  created_at: string
  updated_at: string
  config: {
    max_tokens?: number
    temperature?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    rate_limit_per_minute?: number
    cost_per_request?: number
  }
  stats: {
    total_requests: number
    successful_requests: number
    failed_requests: number
    avg_response_time: number
    total_cost: number
    last_used: string | null
  }
}

interface AIJob {
  id: string
  tool_id: string
  tool_name: string
  type: 'generate_content' | 'analyze_bias' | 'fact_check' | 'moderate_content' | 'sync_congress' | 'process_photos' | 'extract_takeaways'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input_data: any
  output_data?: any
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
  processing_time?: number
  cost?: number
  priority: 'low' | 'normal' | 'high' | 'critical'
}

// Create service role client for admin operations
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// Mock AI tools data based on the actual tools in the codebase
const getAITools = (): AITool[] => {
  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  return [
    {
      id: 'key-takeaways-generator',
      name: 'Key Takeaways Generator',
      type: 'key_takeaways',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      status: 'active',
      description: 'Generates CivicSense-style key takeaways from civic topics using truth-over-comfort principles',
      created_at: yesterday,
      updated_at: now,
      config: {
        max_tokens: 2000,
        temperature: 0.1,
        rate_limit_per_minute: 10,
        cost_per_request: 0.05
      },
      stats: {
        total_requests: 145,
        successful_requests: 140,
        failed_requests: 5,
        avg_response_time: 3.2,
        total_cost: 7.25,
        last_used: now
      }
    },
    {
      id: 'content-generator',
      name: 'AI Content Generator',
      type: 'content_generator',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      status: 'active',
      description: 'Generates quiz content, questions, and educational materials from news articles',
      created_at: yesterday,
      updated_at: now,
      config: {
        max_tokens: 4000,
        temperature: 0.3,
        rate_limit_per_minute: 15,
        cost_per_request: 0.08
      },
      stats: {
        total_requests: 89,
        successful_requests: 85,
        failed_requests: 4,
        avg_response_time: 5.1,
        total_cost: 7.12,
        last_used: now
      }
    },
    {
      id: 'congressional-sync',
      name: 'Congressional Data Sync',
      type: 'congressional_sync',
      provider: 'custom',
      model: 'congress-api-v3',
      status: 'active',
      description: 'Syncs congressional data including bills, members, hearings, and committee documents',
      created_at: yesterday,
      updated_at: now,
      config: {
        rate_limit_per_minute: 60,
        cost_per_request: 0.0
      },
      stats: {
        total_requests: 324,
        successful_requests: 320,
        failed_requests: 4,
        avg_response_time: 1.8,
        total_cost: 0,
        last_used: now
      }
    },
    {
      id: 'glossary-generator',
      name: 'Glossary Term Generator',
      type: 'content_generator',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet',
      status: 'active',
      description: 'Generates civic education glossary terms with uncomfortable truths and power dynamics',
      created_at: yesterday,
      updated_at: now,
      config: {
        max_tokens: 5000,
        temperature: 0.7,
        rate_limit_per_minute: 5,
        cost_per_request: 0.12
      },
      stats: {
        total_requests: 67,
        successful_requests: 64,
        failed_requests: 3,
        avg_response_time: 8.4,
        total_cost: 8.04,
        last_used: now
      }
    },
    {
      id: 'bill-analyzer',
      name: 'Bill Analyzer',
      type: 'bias_analyzer',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet',
      status: 'active',
      description: 'Analyzes congressional bills for civic education value and power dynamics',
      created_at: yesterday,
      updated_at: now,
      config: {
        max_tokens: 3000,
        temperature: 0.2,
        rate_limit_per_minute: 8,
        cost_per_request: 0.06
      },
      stats: {
        total_requests: 156,
        successful_requests: 152,
        failed_requests: 4,
        avg_response_time: 4.7,
        total_cost: 9.36,
        last_used: now
      }
    },
    {
      id: 'photo-processor',
      name: 'Congressional Photo Processor',
      type: 'photo_processor',
      provider: 'custom',
      model: 'image-processing-v1',
      status: 'active',
      description: 'Downloads and processes congressional member photos with optimization',
      created_at: yesterday,
      updated_at: now,
      config: {
        rate_limit_per_minute: 30,
        cost_per_request: 0.01
      },
      stats: {
        total_requests: 542,
        successful_requests: 520,
        failed_requests: 22,
        avg_response_time: 2.1,
        total_cost: 5.42,
        last_used: now
      }
    },
    {
      id: 'news-agent',
      name: 'News Monitoring Agent',
      type: 'news_agent',
      provider: 'anthropic',
      model: 'claude-3-haiku',
      status: 'active',
      description: 'Monitors news sources and generates civic education content from current events',
      created_at: yesterday,
      updated_at: now,
      config: {
        max_tokens: 2000,
        temperature: 0.4,
        rate_limit_per_minute: 20,
        cost_per_request: 0.03
      },
      stats: {
        total_requests: 1247,
        successful_requests: 1210,
        failed_requests: 37,
        avg_response_time: 2.8,
        total_cost: 37.41,
        last_used: now
      }
    },
    {
      id: 'ai-command-center',
      name: 'AI Command Center',
      type: 'moderator',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet',
      status: 'active',
      description: 'Autonomous AI assistant for system monitoring and intelligent operations',
      created_at: yesterday,
      updated_at: now,
      config: {
        max_tokens: 4000,
        temperature: 0.1,
        rate_limit_per_minute: 5,
        cost_per_request: 0.15
      },
      stats: {
        total_requests: 78,
        successful_requests: 76,
        failed_requests: 2,
        avg_response_time: 6.2,
        total_cost: 11.70,
        last_used: now
      }
    }
  ]
}

// Mock AI jobs data
const getAIJobs = (): AIJob[] => {
  const now = new Date().toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  
  return [
    {
      id: 'job-1',
      tool_id: 'content-generator',
      tool_name: 'AI Content Generator',
      type: 'generate_content',
      status: 'completed',
      input_data: { topic: 'Voting Rights', articles: 3 },
      output_data: { topics: 2, questions: 12 },
      created_at: twoHoursAgo,
      started_at: twoHoursAgo,
      completed_at: oneHourAgo,
      processing_time: 45.2,
      cost: 0.24,
      priority: 'normal'
    },
    {
      id: 'job-2',
      tool_id: 'congressional-sync',
      tool_name: 'Congressional Data Sync',
      type: 'sync_congress',
      status: 'running',
      input_data: { congress: 118, limit: 50 },
      created_at: oneHourAgo,
      started_at: oneHourAgo,
      processing_time: 12.5,
      priority: 'high'
    },
    {
      id: 'job-3',
      tool_id: 'key-takeaways-generator',
      tool_name: 'Key Takeaways Generator',
      type: 'extract_takeaways',
      status: 'pending',
      input_data: { topicId: 'constitutional-rights' },
      created_at: now,
      priority: 'normal'
    }
  ]
}

// Calculate stats from tools and jobs
const calculateStats = (tools: AITool[], jobs: AIJob[]): AIStats => {
  const activeTools = tools.filter(t => t.status === 'active').length
  const totalRequests = tools.reduce((sum, t) => sum + t.stats.total_requests, 0)
  const successfulRequests = tools.reduce((sum, t) => sum + t.stats.successful_requests, 0)
  const totalCost = tools.reduce((sum, t) => sum + t.stats.total_cost, 0)
  const avgResponseTime = tools.length > 0 
    ? tools.reduce((sum, t) => sum + t.stats.avg_response_time, 0) / tools.length 
    : 0

  const byProvider: Record<string, number> = {}
  const byType: Record<string, number> = {}
  
  tools.forEach(tool => {
    byProvider[tool.provider] = (byProvider[tool.provider] || 0) + 1
    byType[tool.type] = (byType[tool.type] || 0) + 1
  })

  const today = new Date().toDateString()
  const completedToday = jobs.filter(j => 
    j.status === 'completed' && 
    j.completed_at && 
    new Date(j.completed_at).toDateString() === today
  ).length
  
  const failedToday = jobs.filter(j => 
    j.status === 'failed' && 
    j.completed_at && 
    new Date(j.completed_at).toDateString() === today
  ).length

  return {
    total_tools: tools.length,
    active_tools: activeTools,
    total_requests_today: Math.floor(totalRequests * 0.1), // Estimate today's requests
    success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avg_response_time: avgResponseTime,
    total_cost_today: Math.floor(totalCost * 0.1), // Estimate today's cost
    total_cost_month: totalCost,
    by_provider: byProvider,
    by_type: byType,
    queue_status: {
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed_today: completedToday,
      failed_today: failedToday
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get mock data (in a real implementation, this would come from database)
    const tools = getAITools()
    const jobs = getAIJobs()
    const stats = calculateStats(tools, jobs)

    return NextResponse.json({
      success: true,
      data: {
        tools,
        jobs,
        stats
      }
    })

  } catch (error) {
    console.error('Error loading AI tools data:', error)
    return NextResponse.json({ 
      error: 'Failed to load AI tools data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint for managing AI tools
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return adminCheck.response || NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, toolId, data } = body

    switch (action) {
      case 'start_tool':
        // Start an AI tool
        return NextResponse.json({
          success: true,
          message: `Started tool ${toolId}`,
          tool_status: 'active'
        })

      case 'stop_tool':
        // Stop an AI tool
        return NextResponse.json({
          success: true,
          message: `Stopped tool ${toolId}`,
          tool_status: 'paused'
        })

      case 'run_job':
        // Run a specific AI job
        const jobId = `job-${Date.now()}`
        return NextResponse.json({
          success: true,
          message: `Started job ${jobId} for tool ${toolId}`,
          job_id: jobId,
          status: 'pending'
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing AI tools:', error)
    return NextResponse.json({ 
      error: 'Failed to manage AI tools',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 