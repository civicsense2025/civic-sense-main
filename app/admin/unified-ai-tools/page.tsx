'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Brain, CheckCircle2, Clock, PlayCircle, Settings, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// ============================================================================
// TYPES
// ============================================================================

interface AIWorkflow {
  id: string
  name: string
  description: string
  trigger: 'manual' | 'scheduled' | 'event'
  active: boolean
  steps: AIWorkflowStep[]
}

interface AIWorkflowStep {
  id: string
  name: string
  type: 'congressional_analysis' | 'quiz_generation' | 'photo_processing' | 'content_generation' | 'entity_extraction' | 'fact_checking'
  config: Record<string, any>
  inputs: string[]
  outputs: string[]
  parallel?: boolean
  required?: boolean
}

interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  steps_completed: number
  total_steps: number
  current_step?: string
  results: Record<string, any>
  errors: string[]
  started_at: string
  completed_at?: string
  triggered_by: 'manual' | 'schedule' | 'api' | 'event'
  input_data: any
}

interface WorkflowStats {
  totalExecutions: number
  completedToday: number
  failedToday: number
  avgExecutionTime: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UnifiedAIToolsPage() {
  const [workflows, setWorkflows] = useState<AIWorkflow[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [stats, setStats] = useState<WorkflowStats>({
    totalExecutions: 0,
    completedToday: 0,
    failedToday: 0,
    avgExecutionTime: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<any>(null)
  const [inputData, setInputData] = useState<string>('')

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    loadWorkflowData()
  }, [])

  const loadWorkflowData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/ai-workflows')
      const data = await response.json()

      if (data.success) {
        setWorkflows(data.data.workflows)
        setExecutions(data.data.executions)
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('Error loading workflow data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  const executeWorkflow = async () => {
    if (!selectedWorkflow) return

    try {
      setIsExecuting(true)
      setExecutionResults(null)

      const parsedInput = inputData ? JSON.parse(inputData) : {}

      const response = await fetch('/api/admin/ai-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          workflow_id: selectedWorkflow,
          input_data: parsedInput
        })
      })

      const result = await response.json()
      setExecutionResults(result)

      // Refresh data
      await loadWorkflowData()

    } catch (error) {
      console.error('Error executing workflow:', error)
      setExecutionResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'running': return 'text-blue-600'
      case 'failed': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'running': return <Clock className="h-4 w-4 animate-spin" />
      case 'failed': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'congressional_analysis': return '🏛️'
      case 'quiz_generation': return '📝'
      case 'photo_processing': return '📸'
      case 'content_generation': return '✍️'
      case 'entity_extraction': return '🔍'
      case 'fact_checking': return '✅'
      default: return '⚡'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Unified AI Tools</h1>
            <p className="text-gray-600">Loading AI orchestration system...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Unified AI Tools
          </h1>
          <p className="text-gray-600">
            Orchestrate and combine AI workflows for civic education
          </p>
        </div>
        <Button onClick={loadWorkflowData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-gray-600">All time workflow runs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <p className="text-xs text-gray-600">Successful executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedToday}</div>
            <p className="text-xs text-gray-600">Failed executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgExecutionTime}s</div>
            <p className="text-xs text-gray-600">Average completion time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">AI Workflows</TabsTrigger>
          <TabsTrigger value="execute">Execute Workflow</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <Badge variant={workflow.active ? 'default' : 'secondary'}>
                      {workflow.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>{workflow.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Steps:</span>
                    <span className="font-medium">{workflow.steps.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Trigger:</span>
                    <Badge variant="outline">{workflow.trigger}</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Workflow Steps:</Label>
                    <div className="space-y-1">
                      {workflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                          <span>{getStepTypeIcon(step.type)}</span>
                          <span className="flex-1">{step.name}</span>
                          {step.parallel && <Badge variant="outline" className="text-xs">Parallel</Badge>}
                          {step.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Execute Workflow Tab */}
        <TabsContent value="execute" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execute AI Workflow</CardTitle>
              <CardDescription>
                Select a workflow and provide input data to execute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workflow">Select Workflow</Label>
                    <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a workflow..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workflows.map((workflow) => (
                          <SelectItem key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input">Input Data (JSON)</Label>
                    <Textarea
                      id="input"
                      placeholder={`{
  "bills": [...],
  "members": [...],
  "content": "..."
}`}
                      value={inputData}
                      onChange={(e) => setInputData(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button 
                    onClick={executeWorkflow} 
                    disabled={!selectedWorkflow || isExecuting}
                    className="w-full"
                  >
                    {isExecuting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Execute Workflow
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  {selectedWorkflow && (
                    <div className="space-y-2">
                      <Label>Workflow Preview</Label>
                      <Card className="p-4">
                        {(() => {
                          const workflow = workflows.find(w => w.id === selectedWorkflow)
                          if (!workflow) return null
                          return (
                            <div className="space-y-3">
                              <h4 className="font-medium">{workflow.name}</h4>
                              <p className="text-sm text-gray-600">{workflow.description}</p>
                              <div className="space-y-2">
                                <Label className="text-xs">Steps ({workflow.steps.length}):</Label>
                                {workflow.steps.map((step, index) => (
                                  <div key={step.id} className="flex items-center gap-2 text-xs">
                                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                      {index + 1}
                                    </span>
                                    <span>{getStepTypeIcon(step.type)}</span>
                                    <span className="flex-1">{step.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })()}
                      </Card>
                    </div>
                  )}

                  {executionResults && (
                    <div className="space-y-2">
                      <Label>Execution Results</Label>
                      <Card className="p-4">
                        {executionResults.success ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-medium">Execution Completed</span>
                            </div>
                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                              {JSON.stringify(executionResults.data, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium">Execution Failed</span>
                            </div>
                            <p className="text-sm text-red-600">{executionResults.error}</p>
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution History Tab */}
        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                Recent workflow executions and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No executions found
                  </div>
                ) : (
                  executions.map((execution) => (
                    <Card key={execution.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 ${getStatusColor(execution.status)}`}>
                              {getStatusIcon(execution.status)}
                              <span className="font-medium capitalize">{execution.status}</span>
                            </div>
                            <Badge variant="outline">{execution.workflow_id}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Started: {new Date(execution.started_at).toLocaleString()}
                            {execution.completed_at && (
                              <span> • Completed: {new Date(execution.completed_at).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {execution.steps_completed} / {execution.total_steps} steps
                          </div>
                          <Progress 
                            value={(execution.steps_completed / execution.total_steps) * 100} 
                            className="w-32 mt-1"
                          />
                        </div>
                      </div>
                      
                      {execution.errors.length > 0 && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {execution.errors.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Builder</CardTitle>
              <CardDescription>
                Create custom AI workflows by combining different tools and steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Workflow Builder</h3>
                <p className="text-sm">
                  Custom workflow builder coming soon. This will allow you to create
                  custom AI workflows by drag-and-dropping different components.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 