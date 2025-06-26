import { BaseAITool, AIToolConfig, AIToolResult } from './base-ai-tool'
import { CongressionalDocumentQuizGenerator } from '@/lib/services/congressional-document-quiz-generator'
import { CongressionalPhotoServiceLocal } from '@/lib/services/congressional-photo-service-local'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// ============================================================================
// UNIFIED AI WORKFLOW TYPES
// ============================================================================

export interface AIWorkflowStep {
  id: string
  name: string
  type: 'congressional_analysis' | 'quiz_generation' | 'photo_processing' | 'content_generation' | 'entity_extraction' | 'fact_checking'
  config: Record<string, any>
  inputs: string[] // References to previous step outputs
  outputs: string[] // What this step produces
  parallel?: boolean // Can run in parallel with other steps
  required?: boolean // Must complete successfully
}

export interface AIWorkflow {
  id: string
  name: string
  description: string
  steps: AIWorkflowStep[]
  trigger: 'manual' | 'scheduled' | 'event'
  schedule?: string // Cron expression if scheduled
  active: boolean
}

export interface WorkflowExecution {
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

// ============================================================================
// UNIFIED AI ORCHESTRATOR
// ============================================================================

export class UnifiedAIOrchestrator extends BaseAITool<any, any> {
  private openai: OpenAI
  protected supabase: any
  private quizGenerator: CongressionalDocumentQuizGenerator
  private photoService: CongressionalPhotoServiceLocal

  constructor() {
    super({
      name: 'UnifiedAIOrchestrator',
      type: 'content_generator',
          provider: 'openai',
    model: 'gpt-4o',
      maxRetries: 3,
      timeout: 300000 // 5 minutes for complex workflows
    })
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.supabase = createServiceClient()
    this.quizGenerator = new CongressionalDocumentQuizGenerator()
    this.photoService = new CongressionalPhotoServiceLocal()
  }

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  async executeWorkflow(workflow: AIWorkflow, inputData: any): Promise<AIToolResult<WorkflowExecution>> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflow_id: workflow.id,
      status: 'running',
      steps_completed: 0,
      total_steps: workflow.steps.length,
      results: {},
      errors: [],
      started_at: new Date().toISOString(),
      triggered_by: 'manual',
      input_data: inputData
    }

    try {
      // Save initial execution state
      await this.saveExecutionState(execution)

      // Execute workflow steps
      const results = await this.executeWorkflowSteps(workflow, execution, inputData)
      
      execution.status = 'completed'
      execution.completed_at = new Date().toISOString()
      execution.results = results

      // Save final state
      await this.saveExecutionState(execution)

      return {
        success: true,
        data: execution,
        metadata: {
          toolName: this.config.name,
          provider: this.config.provider,
          model: this.config.model,
          processingTime: Date.now() - new Date(execution.started_at).getTime(),
          retryCount: 0
        }
      }

    } catch (error: any) {
      execution.status = 'failed'
      execution.errors.push(error.message)
      execution.completed_at = new Date().toISOString()
      
      await this.saveExecutionState(execution)

      return {
        success: false,
        error: error.message,
        data: execution,
        metadata: {
          toolName: this.config.name,
          provider: this.config.provider,
          model: this.config.model,
          processingTime: Date.now() - new Date(execution.started_at).getTime(),
          retryCount: 0
        }
      }
    }
  }

  private async executeWorkflowSteps(
    workflow: AIWorkflow, 
    execution: WorkflowExecution, 
    inputData: any
  ): Promise<Record<string, any>> {
    const stepResults: Record<string, any> = { input: inputData }
    const parallelSteps: Array<Promise<void>> = []

    for (const step of workflow.steps) {
      if (step.parallel) {
        // Add to parallel execution queue
        parallelSteps.push(this.executeStep(step, stepResults, execution))
      } else {
        // Wait for any parallel steps to complete first
        if (parallelSteps.length > 0) {
          await Promise.all(parallelSteps)
          parallelSteps.length = 0
        }
        
        // Execute step sequentially
        await this.executeStep(step, stepResults, execution)
      }
    }

    // Wait for any remaining parallel steps
    if (parallelSteps.length > 0) {
      await Promise.all(parallelSteps)
    }

    return stepResults
  }

  private async executeStep(
    step: AIWorkflowStep, 
    stepResults: Record<string, any>,
    execution: WorkflowExecution
  ): Promise<void> {
    try {
      console.log(`🔄 Executing step: ${step.name} (${step.type})`)
      
      // Update current step
      execution.current_step = step.id
      await this.saveExecutionState(execution)

      // Gather inputs for this step
      const inputs = this.gatherStepInputs(step, stepResults)
      
      // Execute based on step type
      let result: any
      
      switch (step.type) {
        case 'congressional_analysis':
          result = await this.executeCongressionalAnalysis(inputs, step.config)
          break
        case 'quiz_generation':
          result = await this.executeQuizGeneration(inputs, step.config)
          break
        case 'photo_processing':
          result = await this.executePhotoProcessing(inputs, step.config)
          break
        case 'content_generation':
          result = await this.executeContentGeneration(inputs, step.config)
          break
        case 'entity_extraction':
          result = await this.executeEntityExtraction(inputs, step.config)
          break
        case 'fact_checking':
          result = await this.executeFactChecking(inputs, step.config)
          break
        default:
          throw new Error(`Unknown step type: ${step.type}`)
      }

      // Store results for subsequent steps
      for (const outputKey of step.outputs) {
        stepResults[outputKey] = result[outputKey] || result
      }

      execution.steps_completed++
      console.log(`✅ Step completed: ${step.name}`)

    } catch (error: any) {
      const errorMessage = `Step ${step.name} failed: ${error.message}`
      execution.errors.push(errorMessage)
      
      if (step.required) {
        throw new Error(errorMessage)
      } else {
        console.warn(`⚠️ Optional step failed: ${errorMessage}`)
      }
    }
  }

  // ============================================================================
  // STEP EXECUTORS
  // ============================================================================

  private async executeCongressionalAnalysis(inputs: any, config: any) {
    // Congressional analysis using OpenAI directly since we don't have the analyzer class
    const prompt = `
    Analyze this congressional content with CivicSense's uncompromising truth-telling approach:
    
    Content: ${JSON.stringify(inputs).substring(0, 4000)}
    
    Provide analysis in JSON format:
    {
      "plainEnglishSummary": "What this actually means for citizens",
      "uncomfortableTruths": ["Truth 1", "Truth 2", "Truth 3"],
      "powerDynamics": ["Who benefits", "Who controls", "Who loses"],
      "actionItems": ["Specific action 1", "Specific action 2"],
      "civicEducationValue": 8
    }
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const parsed = await this.parseJSON(response.choices[0].message.content || '{}')
    return parsed.content
  }

  private async executeQuizGeneration(inputs: any, config: any) {
    const { 
      process_bills = true, 
      process_hearings = true, 
      max_questions = 5 
    } = config

    const results = {
      topics_generated: 0,
      questions_generated: 0,
      bills_processed: 0,
      hearings_processed: 0
    }

    if (inputs.bills && process_bills) {
      for (const bill of inputs.bills) {
        const result = await this.quizGenerator.generateQuizFromBill(bill)
        if (result.success) {
          results.bills_processed++
          if (result.topicGenerated) results.topics_generated++
          results.questions_generated += result.questionsGenerated || 0
        }
      }
    }

    if (inputs.hearings && process_hearings) {
      for (const hearing of inputs.hearings) {
        const result = await this.quizGenerator.generateQuizFromHearing(hearing)
        if (result.success) {
          results.hearings_processed++
          if (result.topicGenerated) results.topics_generated++
          results.questions_generated += result.questionsGenerated || 0
        }
      }
    }

    return results
  }

  private async executePhotoProcessing(inputs: any, config: any) {
    const { congress_number = 119, force_refresh = false } = config
    
    if (inputs.members) {
      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      }

      for (const member of inputs.members) {
        const result = await this.photoService.processPhotosForMember(
          member.bioguide_id,
          congress_number,
          force_refresh
        )
        
        results.processed++
        if (result.success) {
          results.successful++
        } else {
          results.failed++
          results.errors.push(`${member.full_name}: ${result.error}`)
        }
      }

      return results
    } else {
      throw new Error('Photo processing requires members input')
    }
  }

  private async executeContentGeneration(inputs: any, config: any) {
    const { 
      content_type = 'summary',
      tone = 'civic_education',
      max_length = 500 
    } = config

    const prompt = this.buildContentGenerationPrompt(inputs, content_type, tone, max_length)
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: max_length * 2,
      temperature: 0.7
    })

    return {
      generated_content: response.choices[0].message.content,
      content_type,
      tone,
      word_count: response.choices[0].message.content?.split(' ').length || 0
    }
  }

  private async executeEntityExtraction(inputs: any, config: any) {
    const { entity_types = ['person', 'organization', 'legislation'] } = config
    
    const content = inputs.content || inputs.text || JSON.stringify(inputs)
    
    const prompt = `
    Extract entities from the following content. Focus on:
    ${entity_types.map((type: string) => `- ${type.charAt(0).toUpperCase() + type.slice(1)}s`).join('\n')}
    
    Content: ${content.substring(0, 4000)}
    
    Return as JSON:
    {
      "entities": [
        {
          "name": "entity name",
          "type": "person|organization|legislation|location",
          "context": "brief context about the entity",
          "confidence": 0.9
        }
      ]
    }
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const parsed = await this.parseJSON(response.choices[0].message.content || '{}')
    return parsed.content
  }

  private async executeFactChecking(inputs: any, config: any) {
    const { 
      check_claims = true, 
      verify_sources = true,
      political_bias_check = true 
    } = config

    const content = inputs.content || inputs.claims || JSON.stringify(inputs)
    
    const prompt = `
    Fact-check the following content with focus on civic education accuracy:
    
    Content: ${content.substring(0, 4000)}
    
    Analyze for:
    ${check_claims ? '- Factual accuracy of claims' : ''}
    ${verify_sources ? '- Source verification' : ''}
    ${political_bias_check ? '- Political bias detection' : ''}
    
    Return as JSON:
    {
      "fact_check_results": [
        {
          "claim": "specific claim",
          "accuracy": "accurate|misleading|false|unverifiable",
          "confidence": 0.9,
          "sources": ["source1", "source2"],
          "bias_detected": "none|slight|moderate|high",
          "explanation": "detailed explanation"
        }
      ],
      "overall_accuracy_score": 0.85,
      "bias_score": 0.2,
      "recommendations": ["recommendation1", "recommendation2"]
    }
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const parsed = await this.parseJSON(response.choices[0].message.content || '{}')
    return parsed.content
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private gatherStepInputs(step: AIWorkflowStep, stepResults: Record<string, any>): any {
    const inputs: any = {}
    
    for (const inputKey of step.inputs) {
      if (stepResults[inputKey]) {
        inputs[inputKey] = stepResults[inputKey]
      }
    }
    
    return inputs
  }

  private buildContentGenerationPrompt(inputs: any, contentType: string, tone: string, maxLength: number): string {
    const content = JSON.stringify(inputs, null, 2)
    
    return `
    Generate ${contentType} content with a ${tone} tone (max ${maxLength} words):
    
    Input Data: ${content.substring(0, 3000)}
    
    Requirements:
    - Focus on civic education value
    - Use clear, accessible language
    - Include actionable insights where relevant
    - Maintain factual accuracy
    - ${tone === 'civic_education' ? 'Emphasize citizen empowerment and democratic participation' : ''}
    `
  }

  private async saveExecutionState(execution: WorkflowExecution): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_workflow_executions')
        .upsert({
          id: execution.id,
          workflow_id: execution.workflow_id,
          status: execution.status,
          steps_completed: execution.steps_completed,
          total_steps: execution.total_steps,
          current_step: execution.current_step,
          results: execution.results,
          errors: execution.errors,
          started_at: execution.started_at,
          completed_at: execution.completed_at,
          triggered_by: execution.triggered_by,
          input_data: execution.input_data,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to save execution state:', error)
      }
    } catch (error) {
      console.error('Error saving execution state:', error)
    }
  }

  // ============================================================================
  // PREDEFINED WORKFLOWS
  // ============================================================================

  static getPrebuiltWorkflows(): AIWorkflow[] {
    return [
      {
        id: 'comprehensive_congressional_analysis',
        name: 'Comprehensive Congressional Analysis',
        description: 'Analyze congressional documents, generate educational content, and create quizzes',
        trigger: 'manual',
        active: true,
        steps: [
          {
            id: 'analyze_documents',
            name: 'Analyze Congressional Documents',
            type: 'congressional_analysis',
            config: { include_power_dynamics: true, civic_focus: true },
            inputs: ['input'],
            outputs: ['analysis_results'],
            required: true
          },
          {
            id: 'extract_entities',
            name: 'Extract Key Entities',
            type: 'entity_extraction',
            config: { entity_types: ['person', 'organization', 'legislation'] },
            inputs: ['analysis_results'],
            outputs: ['entities'],
            parallel: true
          },
          {
            id: 'generate_quiz',
            name: 'Generate Educational Quiz',
            type: 'quiz_generation',
            config: { max_questions: 5, difficulty_levels: ['beginner', 'intermediate'] },
            inputs: ['analysis_results'],
            outputs: ['quiz_content'],
            parallel: true
          },
          {
            id: 'fact_check',
            name: 'Verify Facts and Claims',
            type: 'fact_checking',
            config: { check_claims: true, political_bias_check: true },
            inputs: ['analysis_results'],
            outputs: ['fact_check_results'],
            parallel: true
          },
          {
            id: 'generate_summary',
            name: 'Generate Citizen Summary',
            type: 'content_generation',
            config: { content_type: 'summary', tone: 'civic_education', max_length: 300 },
            inputs: ['analysis_results', 'entities', 'fact_check_results'],
            outputs: ['citizen_summary']
          }
        ]
      },
      {
        id: 'member_profile_enhancement',
        name: 'Congressional Member Profile Enhancement',
        description: 'Process member photos and generate comprehensive profiles',
        trigger: 'manual',
        active: true,
        steps: [
          {
            id: 'process_photos',
            name: 'Process Member Photos',
            type: 'photo_processing',
            config: { congress_number: 119, force_refresh: false },
            inputs: ['input'],
            outputs: ['photo_results'],
            required: true
          },
          {
            id: 'generate_bio',
            name: 'Generate Member Biography',
            type: 'content_generation',
            config: { content_type: 'biography', tone: 'factual', max_length: 400 },
            inputs: ['input'],
            outputs: ['biography'],
            parallel: true
          },
          {
            id: 'extract_connections',
            name: 'Extract Political Connections',
            type: 'entity_extraction',
            config: { entity_types: ['organization', 'person'] },
            inputs: ['input'],
            outputs: ['connections'],
            parallel: true
          }
        ]
      },
      {
        id: 'quick_bill_analysis',
        name: 'Quick Bill Analysis',
        description: 'Fast analysis of a single bill with key insights',
        trigger: 'manual',
        active: true,
        steps: [
          {
            id: 'analyze_bill',
            name: 'Analyze Bill Content',
            type: 'congressional_analysis',
            config: { focus: 'key_provisions', speed: 'fast' },
            inputs: ['input'],
            outputs: ['analysis'],
            required: true
          },
          {
            id: 'generate_summary',
            name: 'Generate Summary',
            type: 'content_generation',
            config: { content_type: 'summary', tone: 'civic_education', max_length: 200 },
            inputs: ['analysis'],
            outputs: ['summary']
          }
        ]
      }
    ]
  }

  // ============================================================================
  // BASE AI TOOL IMPLEMENTATION
  // ============================================================================

  protected async validateInput(input: any): Promise<any> {
    if (!input.workflow) {
      throw new Error('Workflow configuration is required')
    }
    return input
  }

  protected async processWithAI(input: any): Promise<string> {
    const execution = await this.executeWorkflow(input.workflow, input.data)
    return JSON.stringify(execution)
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<any> {
    const parsed = await this.parseJSON(rawOutput)
    return this.cleanOutput(parsed.content)
  }

  protected async validateOutput(output: any): Promise<any> {
    if (!output.success && !output.data) {
      throw new Error('Invalid workflow execution result')
    }
    return output
  }

  protected async saveToSupabase(data: any): Promise<any> {
    // Execution state is already saved during workflow execution
    return data
  }
} 