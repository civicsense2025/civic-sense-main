// Data-Driven AI Command System for CivicSense
// Replaces hardcoded command logic with flexible, database-driven workflows

import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

// Core interfaces for the data-driven system
export interface AICommand {
  id: string
  command_name: string
  display_name: string
  description: string
  category: 'database' | 'content' | 'analytics' | 'ai' | 'system'
  natural_language_patterns: string[]
  example_inputs: string[]
  intent_keywords: string[]
  parameters_schema: any
  timeout_seconds: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AIAction {
  id: string
  action_name: string
  display_name: string
  description: string
  action_type: 'validation' | 'api_call' | 'database_query' | 'ai_generation' | 'file_operation'
  executor_class: string
  executor_method: string
  configuration: any
  input_schema: any
  output_schema: any
  timeout_seconds: number
  retry_count: number
  is_idempotent: boolean
  is_active: boolean
}

export interface AIPrompt {
  id: string
  prompt_name: string
  prompt_template: string
  prompt_type: 'classification' | 'execution' | 'analysis' | 'generation'
  provider: 'openai' | 'anthropic' | 'any'
  model_config: any
  system_message: string
  response_format: 'json' | 'text' | 'structured'
  is_active: boolean
}

export interface CommandWorkflow {
  command: AICommand
  actions: Array<{
    action: AIAction
    execution_order: number
    input_mapping: any
    output_mapping: any
    prompts: AIPrompt[]
  }>
}

export interface CommandExecutionContext {
  command_name: string
  original_input: string
  extracted_parameters: any
  execution_id: string
  user_id?: string
  session_id?: string
  start_time: Date
}

export interface CommandExecutionResult {
  success: boolean
  execution_id: string
  command_name: string
  results: any
  execution_time_ms: number
  actions_completed: number
  total_actions: number
  error?: string
  metadata?: any
}

/**
 * Data-Driven AI Command System
 * 
 * This system replaces hardcoded command logic with a flexible, database-driven approach:
 * 1. Commands are defined in the database with natural language patterns
 * 2. Each command consists of a workflow of actions
 * 3. Actions can use AI prompts for intelligent processing
 * 4. All execution is logged for analytics and improvement
 */
export class DataDrivenCommandSystem {
  private supabase = createClient()
  private commandCache = new Map<string, CommandWorkflow>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Initialize the command system with database-driven workflows
   */
  async initialize(): Promise<void> {
    try {
      await this.loadCommands()
      console.log('✅ Data-driven command system initialized')
    } catch (error) {
      console.error('❌ Failed to initialize command system:', error)
      throw error
    }
  }

  /**
   * Load all active commands and their workflows from the database
   */
  private async loadCommands(): Promise<void> {
    const { data: commands, error } = await this.supabase
      .from('ai_commands')
      .select(`
        *,
        ai_command_actions(
          execution_order,
          input_mapping,
          output_mapping,
          ai_actions(
            *,
            ai_action_prompts(
              usage_context,
              parameter_mapping,
              ai_prompts(*)
            )
          )
        )
      `)
      .eq('is_active', true)
      .order('command_name')

    if (error) {
      throw new Error(`Failed to load commands: ${error.message}`)
    }

    // Build command workflows
    for (const command of commands || []) {
      const workflow: CommandWorkflow = {
        command: command as AICommand,
        actions: (command.ai_command_actions || [])
          .sort((a: any, b: any) => a.execution_order - b.execution_order)
          .map((ca: any) => ({
            action: ca.ai_actions as AIAction,
            execution_order: ca.execution_order,
            input_mapping: ca.input_mapping,
            output_mapping: ca.output_mapping,
            prompts: (ca.ai_actions.ai_action_prompts || [])
              .map((ap: any) => ap.ai_prompts as AIPrompt)
          }))
      }

      this.commandCache.set(command.command_name, workflow)
      this.cacheExpiry.set(command.command_name, Date.now() + this.CACHE_TTL)
    }

    console.log(`📋 Loaded ${commands?.length || 0} commands with workflows`)
  }

  /**
   * Classify a natural language command and map it to a defined command
   */
  async classifyCommand(input: string): Promise<{
    command: AICommand | null
    confidence: number
    extracted_parameters: any
  }> {
    // Try exact pattern matching first
    const exactMatch = await this.findExactPatternMatch(input)
    if (exactMatch) {
      return {
        command: exactMatch.command,
        confidence: 0.95,
        extracted_parameters: exactMatch.parameters
      }
    }

    // Use AI classification for complex or ambiguous inputs
    return await this.aiClassifyCommand(input)
  }

  /**
   * Find exact pattern matches for common command formats
   */
  private async findExactPatternMatch(input: string): Promise<{
    command: AICommand
    parameters: any
  } | null> {
    const normalizedInput = input.toLowerCase().trim()

    for (const [commandName, workflow] of this.commandCache) {
      for (const pattern of workflow.command.natural_language_patterns) {
        const regex = new RegExp(pattern.replace('*', '.*'), 'i')
        if (regex.test(normalizedInput)) {
          // Extract parameters based on common patterns
          const parameters = this.extractParametersFromInput(normalizedInput, workflow.command)
          
          return {
            command: workflow.command,
            parameters
          }
        }
      }
    }

    return null
  }

  /**
   * Extract parameters from user input based on command schema
   */
  private extractParametersFromInput(input: string, command: AICommand): any {
    const parameters: any = {}
    const schema = command.parameters_schema

    // Apply default values from schema
    if (schema?.properties) {
      for (const [key, prop] of Object.entries(schema.properties as any)) {
        if ((prop as any).default !== undefined) {
          parameters[key] = (prop as any).default
        }
      }
    }

    // Extract specific parameters from input
    // Congress number extraction
    const congressMatch = input.match(/congress\s+(\d+)/i) || input.match(/(\d+)(?:th|st|nd|rd)?\s+congress/i)
    if (congressMatch && schema?.properties?.congress_number) {
      parameters.congress_number = parseInt(congressMatch[1])
    }

    // Limit/count extraction
    const limitMatch = input.match(/(\d+)\s+(?:bills?|items?|records?)/i) || input.match(/limit\s+(\d+)/i)
    if (limitMatch && schema?.properties?.limit) {
      parameters.limit = parseInt(limitMatch[1])
    }

    // Time range extraction
    const timeMatches = {
      '7_days': /(?:last\s+)?(?:7\s+days?|week)/i,
      '30_days': /(?:last\s+)?(?:30\s+days?|month)/i,
      '90_days': /(?:last\s+)?(?:90\s+days?|quarter)/i,
      '365_days': /(?:last\s+)?(?:365\s+days?|year)/i
    }

    for (const [range, regex] of Object.entries(timeMatches)) {
      if (regex.test(input) && schema?.properties?.time_range) {
        parameters.time_range = range
        break
      }
    }

    // Boolean flags
    if (input.includes('dry run') && schema?.properties?.dry_run) {
      parameters.dry_run = true
    }

    return parameters
  }

  /**
   * Use AI to classify complex or ambiguous commands
   */
  private async aiClassifyCommand(input: string): Promise<{
    command: AICommand | null
    confidence: number
    extracted_parameters: any
  }> {
    try {
      // Get the classification prompt
      const { data: classificationPrompt } = await this.supabase
        .from('ai_prompts')
        .select('*')
        .eq('prompt_name', 'command_classification')
        .eq('is_active', true)
        .single()

      if (!classificationPrompt) {
        throw new Error('Classification prompt not found')
      }

      // Build prompt with available commands
      const availableCommands = Array.from(this.commandCache.values()).map(w => ({
        name: w.command.command_name,
        description: w.command.description,
        category: w.command.category,
        examples: w.command.example_inputs
      }))

      const prompt = classificationPrompt.prompt_template
        .replace('{command}', input)
        .replace('{available_commands}', JSON.stringify(availableCommands, null, 2))

      // Make AI call (this would integrate with your AI service)
      const aiResponse = await this.callAIService(prompt, classificationPrompt)
      
      // Parse AI response
      const result = JSON.parse(aiResponse)
      
      // Find the matching command
      const workflow = this.commandCache.get(result.action)
      
      return {
        command: workflow?.command || null,
        confidence: result.confidence || 0.5,
        extracted_parameters: result.parameters || {}
      }
    } catch (error) {
      console.error('AI classification failed:', error)
      return {
        command: null,
        confidence: 0,
        extracted_parameters: {}
      }
    }
  }

  /**
   * Execute a command workflow
   */
  async executeCommand(
    commandName: string,
    parameters: any,
    context?: Partial<CommandExecutionContext>
  ): Promise<CommandExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = new Date()

    try {
      // Get workflow
      await this.ensureCommandCached(commandName)
      const workflow = this.commandCache.get(commandName)
      
      if (!workflow) {
        throw new Error(`Command not found: ${commandName}`)
      }

      // Log execution start
      await this.logExecution(executionId, commandName, 'started', {
        parameters,
        context: context || {}
      })

      // Execute workflow steps
      let workflowContext = { ...parameters }
      let actionsCompleted = 0

      for (const actionStep of workflow.actions) {
        try {
          // Map inputs for this action
          const actionInputs = this.mapActionInputs(workflowContext, actionStep.input_mapping)
          
          // Execute the action
          const actionResult = await this.executeAction(
            actionStep.action,
            actionInputs,
            actionStep.prompts,
            executionId
          )

          // Map outputs to workflow context
          workflowContext = this.mapActionOutputs(workflowContext, actionResult, actionStep.output_mapping)
          
          actionsCompleted++
        } catch (actionError) {
          throw new Error(`Action ${actionStep.action.action_name} failed: ${actionError}`)
        }
      }

      const executionTime = Date.now() - startTime.getTime()

      // Log successful completion
      await this.logExecution(executionId, commandName, 'completed', {
        results: workflowContext,
        execution_time_ms: executionTime,
        actions_completed: actionsCompleted
      })

      // Update analytics
      await this.updateCommandAnalytics(commandName, true, executionTime)

      return {
        success: true,
        execution_id: executionId,
        command_name: commandName,
        results: workflowContext,
        execution_time_ms: executionTime,
        actions_completed: actionsCompleted,
        total_actions: workflow.actions.length
      }

    } catch (error) {
      const executionTime = Date.now() - startTime.getTime()
      
      // Log failure
      await this.logExecution(executionId, commandName, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: executionTime
      })

      // Update analytics
      await this.updateCommandAnalytics(commandName, false, executionTime)

      return {
        success: false,
        execution_id: executionId,
        command_name: commandName,
        results: null,
        execution_time_ms: executionTime,
        actions_completed: 0,
        total_actions: this.commandCache.get(commandName)?.actions.length || 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Execute a single action with its associated prompts
   */
  private async executeAction(
    action: AIAction,
    inputs: any,
    prompts: AIPrompt[],
    executionId: string
  ): Promise<any> {
    console.log(`🔧 Executing action: ${action.action_name}`)

    // Find the right executor and method
    const executor = await this.getActionExecutor(action.executor_class)
    const method = executor[action.executor_method]

    if (!method) {
      throw new Error(`Method ${action.executor_method} not found on ${action.executor_class}`)
    }

    // If action uses AI prompts, process them first
    if (prompts.length > 0) {
      for (const prompt of prompts) {
        const processedPrompt = await this.processPrompt(prompt, inputs)
        inputs._processed_prompts = inputs._processed_prompts || []
        inputs._processed_prompts.push({
          prompt_name: prompt.prompt_name,
          processed_content: processedPrompt
        })
      }
    }

    // Execute the action with timeout
    const timeoutMs = action.timeout_seconds * 1000
    const actionPromise = method.call(executor, inputs)
    
    const result = await Promise.race([
      actionPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Action timeout after ${action.timeout_seconds}s`)), timeoutMs)
      )
    ])

    return result
  }

  /**
   * Process an AI prompt with given inputs
   */
  private async processPrompt(prompt: AIPrompt, inputs: any): Promise<string> {
    let processedTemplate = prompt.prompt_template

    // Replace placeholders in template
    for (const [key, value] of Object.entries(inputs)) {
      const placeholder = `{${key}}`
      if (processedTemplate.includes(placeholder)) {
        processedTemplate = processedTemplate.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          JSON.stringify(value)
        )
      }
    }

    // Call AI service
    return await this.callAIService(processedTemplate, prompt)
  }

  /**
   * Map action inputs using JSONPath-like syntax
   */
  private mapActionInputs(context: any, mapping: any): any {
    const mapped: any = {}

    for (const [outputKey, inputPath] of Object.entries(mapping)) {
      if (typeof inputPath === 'string' && inputPath.startsWith('$.')) {
        const path = inputPath.substring(2)
        mapped[outputKey] = this.getValueFromPath(context, path)
      } else {
        mapped[outputKey] = inputPath
      }
    }

    return mapped
  }

  /**
   * Map action outputs back to workflow context
   */
  private mapActionOutputs(context: any, actionResult: any, mapping: any): any {
    const newContext = { ...context }

    for (const [contextKey, resultPath] of Object.entries(mapping)) {
      if (typeof resultPath === 'string' && resultPath.startsWith('$.')) {
        const path = resultPath.substring(2)
        newContext[contextKey] = this.getValueFromPath(actionResult, path)
      } else {
        newContext[contextKey] = resultPath
      }
    }

    return newContext
  }

  /**
   * Get value from object using dot notation path
   */
  private getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Ensure command is cached, refresh if needed
   */
  private async ensureCommandCached(commandName: string): Promise<void> {
    const expiry = this.cacheExpiry.get(commandName)
    
    if (!this.commandCache.has(commandName) || (expiry && Date.now() > expiry)) {
      await this.loadCommands()
    }
  }

  /**
   * Get action executor instance
   */
  private async getActionExecutor(executorClass: string): Promise<any> {
    // This would dynamically import and instantiate the executor
    // For now, return a mock that logs the action
    return {
      validateCongressSyncParams: async (inputs: any) => ({ validated_params: inputs }),
      syncCongress: async (inputs: any) => ({ synced_counts: { members: 50, bills: 100 }, duration_ms: 5000 }),
      generateQuizContent: async (inputs: any) => ({ generated_count: inputs.limit || 10, quality_scores: { avg: 85 } }),
      formatSuccess: async (inputs: any) => ({ formatted_response: `✅ Success: ${JSON.stringify(inputs.results)}` }),
      formatError: async (inputs: any) => ({ formatted_response: `❌ Error: ${inputs.error}` })
    }
  }

  /**
   * Call AI service (placeholder for actual implementation)
   */
  private async callAIService(prompt: string, promptConfig: AIPrompt): Promise<string> {
    // This would integrate with your actual AI service
    console.log('🤖 AI Service Call:', { prompt, config: promptConfig })
    
    // Mock response for now
    if (promptConfig.prompt_name === 'command_classification') {
      return JSON.stringify({
        category: 'database',
        action: 'sync_congress_database',
        parameters: { congress_number: 118 },
        confidence: 0.9,
        description: 'Sync congressional database'
      })
    }
    
    return `AI response for prompt: ${promptConfig.prompt_name}`
  }

  /**
   * Log command execution to database
   */
  private async logExecution(
    executionId: string,
    commandName: string,
    status: 'started' | 'completed' | 'failed',
    metadata: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_interactions')
        .insert({
          id: executionId,
          interaction_type: 'command_execution',
          input_text: commandName,
          ai_response: JSON.stringify(metadata),
          success: status === 'completed',
          response_time_ms: metadata.execution_time_ms || 0,
          metadata: {
            command_name: commandName,
            status,
            ...metadata
          }
        })
    } catch (error) {
      console.error('Failed to log execution:', error)
    }
  }

  /**
   * Update command analytics
   */
  private async updateCommandAnalytics(
    commandName: string,
    success: boolean,
    executionTimeMs: number
  ): Promise<void> {
    try {
      const command = this.commandCache.get(commandName)
      if (!command) return

      const today = new Date().toISOString().split('T')[0]

      // Upsert analytics record
      await this.supabase
        .from('ai_command_analytics')
        .upsert({
          date: today,
          command_id: command.command.id,
          execution_count: 1,
          success_count: success ? 1 : 0,
          failure_count: success ? 0 : 1,
          avg_execution_time_ms: executionTimeMs
        }, {
          onConflict: 'date,command_id'
        })
    } catch (error) {
      console.error('Failed to update analytics:', error)
    }
  }

  /**
   * Get available commands for display
   */
  async getAvailableCommands(): Promise<AICommand[]> {
    await this.ensureCommandCached('_refresh')
    return Array.from(this.commandCache.values()).map(w => w.command)
  }

  /**
   * Get command analytics and success rates
   */
  async getCommandAnalytics(days: number = 30): Promise<any> {
    const { data, error } = await this.supabase
      .from('ai_command_success_rates')
      .select('*')

    if (error) {
      console.error('Failed to get analytics:', error)
      return []
    }

    return data
  }

  /**
   * Search commands by natural language
   */
  async searchCommands(query: string): Promise<AICommand[]> {
    const normalizedQuery = query.toLowerCase()
    const commands = await this.getAvailableCommands()

    return commands.filter(command => 
      command.natural_language_patterns.some(pattern => 
        new RegExp(pattern.replace('*', '.*'), 'i').test(normalizedQuery)
      ) ||
      command.intent_keywords.some(keyword => 
        normalizedQuery.includes(keyword.toLowerCase())
      ) ||
      command.description.toLowerCase().includes(normalizedQuery)
    )
  }
}

// Export singleton instance
export const commandSystem = new DataDrivenCommandSystem()

// Helper functions for migration from hardcoded system
export async function migrateToDataDrivenSystem(): Promise<void> {
  console.log('🔄 Migrating to data-driven command system...')
  
  try {
    await commandSystem.initialize()
    console.log('✅ Migration completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

export async function executeDataDrivenCommand(
  input: string,
  context?: any
): Promise<CommandExecutionResult> {
  // Classify the command
  const classification = await commandSystem.classifyCommand(input)
  
  if (!classification.command) {
    return {
      success: false,
      execution_id: 'no_command',
      command_name: 'unknown',
      results: null,
      execution_time_ms: 0,
      actions_completed: 0,
      total_actions: 0,
      error: 'Could not understand the command'
    }
  }

  // Execute the command
  return await commandSystem.executeCommand(
    classification.command.command_name,
    classification.extracted_parameters,
    context
  )
} 