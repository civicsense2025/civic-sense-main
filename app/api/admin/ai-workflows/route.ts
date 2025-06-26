import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UnifiedAIOrchestrator, AIWorkflow } from '@/lib/ai/unified-ai-orchestrator'

// ============================================================================
// AI WORKFLOWS MANAGEMENT API
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'prebuilt') {
      // Get prebuilt workflows
      const workflows = UnifiedAIOrchestrator.getPrebuiltWorkflows()
      
      return NextResponse.json({
        success: true,
        data: { workflows }
      })
    }

    // Get workflow executions
    const { data: executions } = await supabase
      .from('ai_workflow_executions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    // Get custom workflows (if any stored in database)
    const { data: customWorkflows } = await supabase
      .from('ai_workflows')
      .select('*')
      .eq('active', true)

    return NextResponse.json({
      success: true,
      data: {
        workflows: UnifiedAIOrchestrator.getPrebuiltWorkflows(),
        customWorkflows: customWorkflows || [],
        executions: executions || [],
        stats: {
          totalExecutions: executions?.length || 0,
          completedToday: executions?.filter(e => 
            e.status === 'completed' && 
            new Date(e.started_at).toDateString() === new Date().toDateString()
          ).length || 0,
          failedToday: executions?.filter(e => 
            e.status === 'failed' && 
            new Date(e.started_at).toDateString() === new Date().toDateString()
          ).length || 0,
          avgExecutionTime: calculateAvgExecutionTime(executions || [])
        }
      }
    })

  } catch (error) {
    console.error('Error fetching AI workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, workflow_id, input_data } = body

    if (action === 'execute') {
      // Execute a workflow
      const orchestrator = new UnifiedAIOrchestrator()
      
      // Find the workflow
      const workflows = UnifiedAIOrchestrator.getPrebuiltWorkflows()
      const workflow = workflows.find(w => w.id === workflow_id)
      
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }

      console.log(`🚀 Starting workflow execution: ${workflow.name}`)
      
      // Execute the workflow
      const result = await orchestrator.executeWorkflow(workflow, input_data)
      
      return NextResponse.json({
        success: result.success,
        data: result.data,
        metadata: result.metadata,
        ...(result.error && { error: result.error })
      })
    }

    if (action === 'create_custom') {
      // Create a custom workflow
      const { workflow } = body as { workflow: AIWorkflow }
      
      const { data, error } = await supabase
        .from('ai_workflows')
        .insert({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          trigger: workflow.trigger,
          schedule: workflow.schedule,
          active: workflow.active,
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating custom workflow:', error)
        return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: { workflow: data }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in workflow operation:', error)
    return NextResponse.json(
      { error: 'Failed to process workflow operation' },
      { status: 500 }
    )
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateAvgExecutionTime(executions: any[]): number {
  const completed = executions.filter(e => e.status === 'completed' && e.started_at && e.completed_at)
  
  if (completed.length === 0) return 0
  
  const totalTime = completed.reduce((sum, exec) => {
    const startTime = new Date(exec.started_at).getTime()
    const endTime = new Date(exec.completed_at).getTime()
    return sum + (endTime - startTime)
  }, 0)
  
  return Math.round(totalTime / completed.length / 1000) // Convert to seconds
} 