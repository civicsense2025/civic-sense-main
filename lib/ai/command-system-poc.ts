// Proof of Concept: Data-Driven AI Command System
// Shows how commands, actions, and prompts work together
// 
// Database Schema: Uses the ai_agent schema for all command system tables:
// - ai_agent.ai_commands
// - ai_agent.ai_actions  
// - ai_agent.ai_prompts
// - ai_agent.ai_command_actions
// - ai_agent.ai_action_prompts
// - ai_agent.ai_command_executions

interface CommandDefinition {
  command_name: string
  display_name: string
  natural_language_patterns: string[]
  example_inputs: string[]
  intent_keywords: string[]
  parameters_schema: any
  category: 'database' | 'content' | 'analytics' | 'ai' | 'system'
}

interface ActionDefinition {
  action_name: string
  display_name: string
  executor_class: string
  executor_method: string
  input_schema: any
  output_schema: any
  timeout_seconds: number
}

interface PromptDefinition {
  prompt_name: string
  prompt_template: string
  provider: 'openai' | 'anthropic' | 'any'
  model_config: any
  response_format: 'json' | 'text'
}

interface WorkflowStep {
  action_name: string
  execution_order: number
  input_mapping: Record<string, string>
  output_mapping: Record<string, string>
  prompts?: string[]
}

// Example: Complete command configuration for "Sync Congress Database"
export const CONGRESS_SYNC_COMMAND: CommandDefinition = {
  command_name: 'sync_congress_database',
  display_name: 'Sync Congress Database',
  natural_language_patterns: [
    'sync congress.*',
    'update congress.*', 
    'refresh congress.*',
    'congress sync.*',
    'congressional sync.*'
  ],
  example_inputs: [
    'sync congress database',
    'update congressional data for 118th congress',
    'refresh congress info with latest data'
  ],
  intent_keywords: ['sync', 'congress', 'congressional', 'database', 'update', 'refresh'],
  parameters_schema: {
    type: 'object',
    properties: {
      congress_number: { type: 'integer', default: 118 },
      limit: { type: 'integer', default: 1000 },
      include_all: { type: 'boolean', default: true }
    }
  },
  category: 'database'
}

export const CONGRESS_SYNC_ACTIONS: ActionDefinition[] = [
  {
    action_name: 'validate_congress_params',
    display_name: 'Validate Congress Sync Parameters',
    executor_class: 'DatabaseCommandExecutor',
    executor_method: 'validateCongressSyncParams',
    input_schema: {
      type: 'object',
      properties: {
        congress_number: { type: 'integer' },
        limit: { type: 'integer' },
        include_all: { type: 'boolean' }
      }
    },
    output_schema: {
      type: 'object',
      properties: {
        validated_params: { type: 'object' },
        validation_errors: { type: 'array' }
      }
    },
    timeout_seconds: 30
  },
  {
    action_name: 'execute_congress_sync',
    display_name: 'Execute Congress Synchronization',
    executor_class: 'DatabaseCommandExecutor', 
    executor_method: 'syncCongress',
    input_schema: {
      type: 'object',
      properties: {
        congress_number: { type: 'integer' },
        limit: { type: 'integer' }
      }
    },
    output_schema: {
      type: 'object',
      properties: {
        synced_counts: { type: 'object' },
        errors: { type: 'array' },
        duration_ms: { type: 'integer' }
      }
    },
    timeout_seconds: 600
  },
  {
    action_name: 'format_success_response',
    display_name: 'Format Success Response',
    executor_class: 'ResponseFormatter',
    executor_method: 'formatSuccess',
    input_schema: {
      type: 'object',
      properties: {
        results: { type: 'object' },
        execution_time: { type: 'integer' }
      }
    },
    output_schema: {
      type: 'object',
      properties: {
        formatted_response: { type: 'string' },
        metadata: { type: 'object' }
      }
    },
    timeout_seconds: 15
  }
]

export const CONGRESS_SYNC_PROMPTS: PromptDefinition[] = [
  {
    prompt_name: 'congress_sync_execution',
    prompt_template: `Execute a comprehensive synchronization of congressional data from congress.gov and govinfo.

Parameters:
- Congress Number: {congress_number}
- Include All Data: {include_all}
- Limit: {limit}

Provide real-time status updates and detailed results showing what was synchronized.
Focus on accuracy and completeness of the democratic data we're preserving.`,
    provider: 'any',
    model_config: { temperature: 0.2 },
    response_format: 'text'
  },
  {
    prompt_name: 'congress_sync_success_format',
    prompt_template: `Format this congress synchronization result into a clear, encouraging message:

Results: {results}
Execution Time: {execution_time}ms

Create a message that:
1. Celebrates the successful preservation of democratic data
2. Shows specific numbers (members, bills, etc.)
3. Emphasizes the civic importance of this information
4. Maintains CivicSense's direct, action-oriented voice`,
    provider: 'anthropic',
    model_config: { temperature: 0.3, max_tokens: 500 },
    response_format: 'text'
  }
]

export const CONGRESS_SYNC_WORKFLOW: WorkflowStep[] = [
  {
    action_name: 'validate_congress_params',
    execution_order: 1,
    input_mapping: {
      congress_number: '$.congress_number',
      limit: '$.limit', 
      include_all: '$.include_all'
    },
    output_mapping: {
      validated_params: '$.validated_params'
    }
  },
  {
    action_name: 'execute_congress_sync',
    execution_order: 2,
    input_mapping: {
      congress_number: '$.validated_params.congress_number',
      limit: '$.validated_params.limit'
    },
    output_mapping: {
      sync_results: '$.synced_counts',
      duration: '$.duration_ms'
    },
    prompts: ['congress_sync_execution']
  },
  {
    action_name: 'format_success_response', 
    execution_order: 3,
    input_mapping: {
      results: '$.sync_results',
      execution_time: '$.duration'
    },
    output_mapping: {
      response: '$.formatted_response'
    },
    prompts: ['congress_sync_success_format']
  }
]

// =============================================================================
// ADDITIONAL COMMAND EXAMPLES
// =============================================================================

export const QUIZ_GENERATION_COMMAND: CommandDefinition = {
  command_name: 'generate_quiz_from_bills',
  display_name: 'Generate Quiz from Bills',
  natural_language_patterns: [
    'generate quiz.*',
    'create quiz.*',
    'quiz from bills.*',
    'bill quiz.*',
    'make quiz.*'
  ],
  example_inputs: [
    'generate quiz content from recent bills',
    'create quiz from 10 most recent bills',
    'make quiz about latest congressional bills'
  ],
  intent_keywords: ['generate', 'create', 'quiz', 'bills', 'questions', 'content'],
  parameters_schema: {
    type: 'object',
    properties: {
      limit: { type: 'integer', default: 10 },
      categories: { type: 'array', default: ['government', 'politics'] },
      difficulty: { type: 'string', default: 'mixed' }
    }
  },
  category: 'content'
}

export const USER_ANALYTICS_COMMAND: CommandDefinition = {
  command_name: 'user_engagement_analytics',
  display_name: 'User Engagement Analytics',
  natural_language_patterns: [
    'user analytics.*',
    'engagement report.*',
    'user engagement.*',
    'analytics report.*',
    'user behavior.*'
  ],
  example_inputs: [
    'generate user engagement analytics report',
    'user analytics for last 30 days',
    'comprehensive user behavior analysis'
  ],
  intent_keywords: ['user', 'analytics', 'engagement', 'report', 'behavior', 'metrics'],
  parameters_schema: {
    type: 'object',
    properties: {
      time_range: { type: 'string', default: '30_days' },
      include_segments: { type: 'boolean', default: true },
      metrics: { type: 'array', default: ['engagement', 'learning', 'retention'] }
    }
  },
  category: 'analytics'
}

// =============================================================================
// COMMAND REGISTRY (in a real system, this would be in the database)
// =============================================================================

export const COMMAND_REGISTRY = {
  commands: [
    CONGRESS_SYNC_COMMAND,
    QUIZ_GENERATION_COMMAND, 
    USER_ANALYTICS_COMMAND
  ],
  actions: [
    ...CONGRESS_SYNC_ACTIONS,
    // Additional actions would be added here
  ],
  prompts: [
    ...CONGRESS_SYNC_PROMPTS,
    // Additional prompts would be added here
  ],
  workflows: {
    [CONGRESS_SYNC_COMMAND.command_name]: CONGRESS_SYNC_WORKFLOW,
    // Additional workflows would be added here
  }
}

// =============================================================================
// SIMPLE COMMAND CLASSIFIER (proof of concept)
// =============================================================================

export class SimpleCommandClassifier {
  static classifyCommand(input: string): {
    command: CommandDefinition | null
    confidence: number
    extracted_parameters: any
  } {
    const normalizedInput = input.toLowerCase().trim()
    
    for (const command of COMMAND_REGISTRY.commands) {
      // Check natural language patterns
      for (const pattern of command.natural_language_patterns) {
        const regex = new RegExp(pattern, 'i')
        if (regex.test(normalizedInput)) {
          return {
            command,
            confidence: 0.9,
            extracted_parameters: this.extractParameters(normalizedInput, command)
          }
        }
      }
      
      // Check intent keywords
      const matchingKeywords = command.intent_keywords.filter(keyword => 
        normalizedInput.includes(keyword.toLowerCase())
      )
      
      if (matchingKeywords.length >= 2) {
        return {
          command,
          confidence: 0.7,
          extracted_parameters: this.extractParameters(normalizedInput, command)
        }
      }
    }
    
    return { command: null, confidence: 0, extracted_parameters: {} }
  }
  
  private static extractParameters(input: string, command: CommandDefinition): any {
    const parameters: any = {}
    const schema = command.parameters_schema
    
    // Apply defaults
    if (schema?.properties) {
      for (const [key, prop] of Object.entries(schema.properties as any)) {
        if ((prop as any).default !== undefined) {
          parameters[key] = (prop as any).default
        }
      }
    }
    
    // Extract specific values from input
    // Congress number
    const congressMatch = input.match(/congress\s+(\d+)/i) || input.match(/(\d+)(?:th|st|nd|rd)?\s+congress/i)
    if (congressMatch && schema?.properties?.congress_number) {
      parameters.congress_number = parseInt(congressMatch[1])
    }
    
    // Limit/count
    const limitMatch = input.match(/(\d+)\s+(?:bills?|items?|records?)/i)
    if (limitMatch && schema?.properties?.limit) {
      parameters.limit = parseInt(limitMatch[1])
    }
    
    // Time range
    if (input.includes('last 7 days') || input.includes('week')) {
      parameters.time_range = '7_days'
    } else if (input.includes('last 30 days') || input.includes('month')) {
      parameters.time_range = '30_days'
    }
    
    return parameters
  }
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

export function demonstrateCommandSystem() {
  const examples = [
    'sync congress database for 118th congress',
    'generate quiz from 5 recent bills',
    'user analytics for last 30 days',
    'update congressional data',
    'create quiz content'
  ]
  
  console.log('🤖 Data-Driven Command System Demo\n')
  
  for (const input of examples) {
    const result = SimpleCommandClassifier.classifyCommand(input)
    
    console.log(`Input: "${input}"`)
    if (result.command) {
      console.log(`✅ Matched: ${result.command.display_name}`)
      console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(0)}%`)
      console.log(`⚙️ Parameters:`, result.extracted_parameters)
      console.log(`🔧 Workflow: ${COMMAND_REGISTRY.workflows[result.command.command_name]?.length || 0} steps`)
    } else {
      console.log('❌ No matching command found')
    }
    console.log('---')
  }
}

// Run the demo
if (require.main === module) {
  demonstrateCommandSystem()
} 