/**
 * Power Dynamics Analyzer AI Tool
 * REFACTORED: Now extends BaseAITool for unified workflow integration
 * 
 * Analyzes political content to reveal:
 * - Hidden power structures and influence networks
 * - Beneficiaries vs. those who bear costs
 * - Corporate capture and lobbying influence
 * - Money flows and financial incentives
 * - Decision-making bottlenecks and gatekeepers
 */

import { BaseAITool, type AIToolConfig, type AIToolResult } from './base-ai-tool'
import { OpenAI } from 'openai'
import { z } from 'zod'

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

const PowerAnalysisInputSchema = z.object({
  content: z.string(),
  contentType: z.enum(['bill', 'hearing', 'news_article', 'policy_document', 'speech']),
  title: z.string().optional(),
  metadata: z.object({
    date: z.string().optional(),
    source: z.string().optional(),
    author: z.string().optional(),
    participants: z.array(z.string()).optional()
  }).optional()
})

const PowerAnalysisOutputSchema = z.object({
  powerStructures: z.array(z.object({
    entity: z.string(),
    type: z.enum(['individual', 'corporation', 'organization', 'government_agency', 'lobby_group']),
    powerLevel: z.number().min(1).max(10),
    influenceType: z.enum(['financial', 'regulatory', 'informational', 'access', 'veto_power']),
    description: z.string()
  })),
  beneficiaries: z.array(z.object({
    entity: z.string(),
    benefitType: z.enum(['financial', 'regulatory', 'competitive_advantage', 'access', 'protection']),
    estimatedValue: z.string(),
    hiddenFromPublic: z.boolean(),
    description: z.string()
  })),
  costsAndBurdens: z.array(z.object({
    entity: z.string(),
    costType: z.enum(['financial', 'regulatory', 'opportunity_cost', 'risk', 'exclusion']),
    estimatedImpact: z.string(),
    willingness: z.enum(['voluntary', 'reluctant', 'forced', 'unaware']),
    description: z.string()
  })),
  influenceNetworks: z.array(z.object({
    source: z.string(),
    target: z.string(),
    relationship: z.enum(['funding', 'lobbying', 'revolving_door', 'family', 'business_partnership']),
    strength: z.number().min(1).max(10),
    hiddenFromPublic: z.boolean(),
    description: z.string()
  })),
  gatekeepers: z.array(z.object({
    entity: z.string(),
    chokepoint: z.string(),
    decisionPower: z.number().min(1).max(10),
    accountability: z.enum(['high', 'medium', 'low', 'none']),
    description: z.string()
  })),
  uncomfortableTruths: z.array(z.string()),
  actionableInsights: z.array(z.object({
    insight: z.string(),
    citizenActions: z.array(z.string()),
    leveragePoints: z.array(z.string())
  })),
  overallPowerScore: z.number().min(1).max(100),
  transparencyScore: z.number().min(1).max(100)
})

export type PowerAnalysisInput = z.infer<typeof PowerAnalysisInputSchema>
export type PowerAnalysisOutput = z.infer<typeof PowerAnalysisOutputSchema>

// =============================================================================
// POWER DYNAMICS ANALYZER AI TOOL
// =============================================================================

export class PowerDynamicsAnalyzerAI extends BaseAITool<PowerAnalysisInput, PowerAnalysisOutput> {
  private openai: OpenAI

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'Power Dynamics Analyzer',
      type: 'bias_analyzer',
      provider: config?.provider || 'openai',
      model: config?.model || 'gpt-4o',
      maxRetries: 3,
      retryDelay: 1500,
      ...config
    })

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // =============================================================================
  // BASE AI TOOL IMPLEMENTATION
  // =============================================================================

  protected async validateInput(input: PowerAnalysisInput): Promise<PowerAnalysisInput> {
    return PowerAnalysisInputSchema.parse(input)
  }

  protected async processWithAI(input: PowerAnalysisInput): Promise<string> {
    const prompt = this.buildAnalysisPrompt(input)
    
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response content received from AI')
    }

    return content
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<PowerAnalysisOutput> {
    const parsed = await this.parseJSON(rawOutput)
    if (!parsed.isValid) {
      throw new Error('Failed to parse power dynamics analysis output')
    }

    const cleaned = this.cleanOutput(parsed.content)
    return cleaned as PowerAnalysisOutput
  }

  protected async validateOutput(output: PowerAnalysisOutput): Promise<PowerAnalysisOutput> {
    try {
      const validated = PowerAnalysisOutputSchema.parse(output)
      
      // Additional quality checks
      if (validated.powerStructures.length === 0) {
        throw new Error('No power structures identified')
      }
      
      if (validated.uncomfortableTruths.length === 0) {
        throw new Error('No uncomfortable truths identified')
      }

      if (validated.overallPowerScore < 1 || validated.overallPowerScore > 100) {
        throw new Error('Invalid overall power score')
      }

      return validated
    } catch (error) {
      throw new Error(`Output validation failed: ${error}`)
    }
  }

  protected async saveToSupabase(data: PowerAnalysisOutput): Promise<PowerAnalysisOutput> {
    try {
      // Store power analysis results
      const { data: analysis, error } = await this.supabase
        .from('power_dynamics_analyses')
        .insert({
          power_structures: data.powerStructures,
          beneficiaries: data.beneficiaries,
          costs_and_burdens: data.costsAndBurdens,
          influence_networks: data.influenceNetworks,
          gatekeepers: data.gatekeepers,
          uncomfortable_truths: data.uncomfortableTruths,
          actionable_insights: data.actionableInsights,
          overall_power_score: data.overallPowerScore,
          transparency_score: data.transparencyScore,
          ai_tool_used: this.config.name,
          ai_model: this.config.model
        })
        .select()
        .single()

      if (error) throw error

      await this.logActivity('power_dynamics_analyzed', {
        power_structures_found: data.powerStructures.length,
        influence_networks_mapped: data.influenceNetworks.length,
        uncomfortable_truths_revealed: data.uncomfortableTruths.length,
        overall_power_score: data.overallPowerScore,
        transparency_score: data.transparencyScore
      })

      return data
    } catch (error) {
      throw new Error(`Failed to save power analysis: ${error}`)
    }
  }

  // =============================================================================
  // PROMPT BUILDERS
  // =============================================================================

  private getSystemPrompt(): string {
    return `
You are a power dynamics analyst for CivicSense, specializing in revealing how power actually works in politics and policy.

Your mission is to:
1. Identify who REALLY holds power (often hidden from public view)
2. Map influence networks and money flows
3. Reveal who benefits vs. who pays the costs
4. Expose uncomfortable truths about power concentration
5. Find specific leverage points for citizen action

ALWAYS BE SPECIFIC:
- Name actual people, companies, and organizations
- Quantify power relationships (1-10 scale)
- Identify concrete financial flows and incentives
- Reveal hidden connections and conflicts of interest
- Show how decisions get made behind closed doors

CivicSense Voice Standards:
- Direct, evidence-based analysis
- No diplomatic softening of uncomfortable truths
- Active voice that assigns responsibility
- Focus on actionable citizen leverage points
- Reveal systemic dysfunction, not just individual bad actors
    `
  }

  private buildAnalysisPrompt(input: PowerAnalysisInput): string {
    return `
Analyze the power dynamics in this ${input.contentType} and provide a comprehensive breakdown:

Title: ${input.title || 'Untitled'}
Content: ${input.content.substring(0, 8000)}

${input.metadata ? `
Metadata:
- Date: ${input.metadata.date || 'Unknown'}
- Source: ${input.metadata.source || 'Unknown'}
- Author: ${input.metadata.author || 'Unknown'}
- Participants: ${input.metadata.participants?.join(', ') || 'Unknown'}
` : ''}

Provide analysis in this JSON format:
{
  "powerStructures": [
    {
      "entity": "Specific person/organization name",
      "type": "individual|corporation|organization|government_agency|lobby_group",
      "powerLevel": 8,
      "influenceType": "financial|regulatory|informational|access|veto_power",
      "description": "How they wield power in this situation"
    }
  ],
  "beneficiaries": [
    {
      "entity": "Who benefits",
      "benefitType": "financial|regulatory|competitive_advantage|access|protection",
      "estimatedValue": "$X million/regulatory protection/market advantage",
      "hiddenFromPublic": true,
      "description": "What they gain and how"
    }
  ],
  "costsAndBurdens": [
    {
      "entity": "Who pays the price",
      "costType": "financial|regulatory|opportunity_cost|risk|exclusion",
      "estimatedImpact": "Specific cost description",
      "willingness": "voluntary|reluctant|forced|unaware",
      "description": "What they lose and how"
    }
  ],
  "influenceNetworks": [
    {
      "source": "Influencer name",
      "target": "Decision maker name",
      "relationship": "funding|lobbying|revolving_door|family|business_partnership",
      "strength": 7,
      "hiddenFromPublic": false,
      "description": "How influence flows between them"
    }
  ],
  "gatekeepers": [
    {
      "entity": "Key decision maker",
      "chokepoint": "Specific decision/approval they control",
      "decisionPower": 9,
      "accountability": "high|medium|low|none",
      "description": "Why they're a critical bottleneck"
    }
  ],
  "uncomfortableTruths": [
    "Truth #1 that politicians/powerful interests don't want public to know",
    "Truth #2 about how this system really works",
    "Truth #3 about who's being served vs. who's being excluded"
  ],
  "actionableInsights": [
    {
      "insight": "Specific insight about power vulnerability",
      "citizenActions": ["Action 1", "Action 2"],
      "leveragePoints": ["Pressure point 1", "Pressure point 2"]
    }
  ],
  "overallPowerScore": 75,
  "transparencyScore": 30
}

Focus on:
- SPECIFIC names and organizations (not vague "special interests")
- QUANTIFIED relationships and influence levels
- HIDDEN connections the public doesn't see
- MONEY FLOWS and financial incentives
- CONCRETE actions citizens can take to create accountability
    `
  }

  // =============================================================================
  // WORKFLOW HELPERS
  // =============================================================================

  /**
   * Analyze multiple pieces of content in batch
   */
  async analyzeBatch(contents: PowerAnalysisInput[]): Promise<AIToolResult<PowerAnalysisOutput[]>> {
    const results = await Promise.allSettled(
      contents.map(content => this.process(content))
    )

    const successful = results
      .filter((r): r is PromiseFulfilledResult<AIToolResult<PowerAnalysisOutput>> => r.status === 'fulfilled')
      .map(r => r.value.data!)
      .filter(Boolean)

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason)

    return {
      success: failed.length === 0,
      data: successful,
      error: failed.length > 0 ? `${failed.length} analyses failed (${successful.length}/${contents.length} succeeded)` : undefined,
      metadata: {
        toolName: this.config.name,
        provider: this.config.provider,
        model: this.config.model,
        processingTime: 0,
        retryCount: 0
      }
    }
  }

  /**
   * Get workflow step configuration for orchestration
   */
  static getWorkflowStepConfig() {
    return {
      id: 'power_dynamics_analysis',
      name: 'Analyze Power Dynamics',
      type: 'power_analysis',
      inputs: ['content'],
      outputs: ['power_analysis'],
      config: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        maxRetries: 3
      }
    }
  }

  /**
   * Create analysis for Congressional content
   */
  static createCongressionalAnalysis(billData: any): PowerAnalysisInput {
    return {
      content: billData.summary || billData.full_text || billData.title,
      contentType: 'bill',
      title: billData.title,
      metadata: {
        date: billData.introduced_date,
        source: 'Congress.gov',
        author: billData.sponsor_name,
        participants: billData.cosponsors?.map((c: any) => c.name) || []
      }
    }
  }
} 