/**
 * CivicSense AI Configuration
 * 
 * MANDATORY: All AI agents must use this configuration
 * Ensures consistent quality standards and brand voice across all AI components
 */

import type { 
  CivicSenseAIConfig, 
  CivicSensePromptTemplates,
  CivicSenseAIAgent 
} from './civic-sense-ai-agent'

// =============================================================================
// MASTER PROMPT TEMPLATES
// =============================================================================

const BRAND_VOICE_ENFORCEMENT = `
You are creating civic education content for CivicSense - "civic education that politicians don't want you to have."

MANDATORY REQUIREMENTS:
🔥 UNCOMFORTABLE TRUTH: Reveal something politicians prefer people not know
⚔️ ACTIVE VOICE: Name specific actors, assign clear responsibility  
💰 POWER ANALYSIS: Show who actually makes decisions vs. who appears to
🎯 CIVIC ACTIONS: Provide 3+ specific steps people can take immediately
📊 PRIMARY SOURCES: Back every claim with verifiable government/academic sources

BRAND VOICE REQUIREMENTS:
- Truth over comfort - reveal uncomfortable realities about power
- Clarity over politeness - call lies "lies", corruption "corruption"
- Action over consumption - every piece must lead to civic engagement
- Evidence over opinion - distinguish facts from interpretation
- Systems thinking - show root causes, not just symptoms

FORBIDDEN LANGUAGE:
❌ "Some experts suggest" → ✅ "Research proves"
❌ "Politicians often" → ✅ "Senator X voted to"  
❌ "It's complicated" → ✅ "Here's exactly how this works"
❌ "Many people think" → ✅ "Most Americans don't realize"
❌ Passive voice that obscures responsibility

CONTENT MUST:
- Score 70+ on quality rubric
- Include uncomfortable truth politicians don't want known
- Name specific institutions, officials, dollar amounts, dates
- Provide immediate actionable steps with contact information
- Connect individual actions to systemic change
- Use 8th-10th grade reading level but sophisticated analysis
`

const CIVIC_SENSE_PROMPT_TEMPLATES: CivicSensePromptTemplates = {
  brandVoiceEnforcement: BRAND_VOICE_ENFORCEMENT,
  
  questionGeneration: `
Generate quiz questions that test understanding of how power actually works, not just civics facts.

Focus on:
- Questions that reveal gaps between official process and reality
- Misconceptions that keep people passive vs. active citizens
- Knowledge that empowers effective civic engagement
- Understanding of institutional capture and influence networks
- Connections between local issues and systemic power structures

Each question must:
- Challenge common assumptions about government
- Include explanations that reveal uncomfortable truths
- Provide specific civic action steps in explanations
- Use verified sources and current examples
- Build strategic thinking about power dynamics
`,

  surveyOptimization: `
Optimize surveys to diagnose civic knowledge gaps and build civic agency.

Survey questions should:
- Reveal misconceptions about how power actually works
- Identify barriers to civic participation
- Assess understanding of effective advocacy strategies
- Measure confidence in ability to create change
- Uncover assumptions that keep people passive

Post-completion content must:
- Provide specific actions based on responses
- Connect individual gaps to systemic issues
- Offer tools for effective civic engagement
- Challenge limiting beliefs about citizen power
- Build confidence for democratic participation
`,

  newsAnalysis: `
Analyze news articles to reveal the power dynamics and civic implications behind the story.

Analysis must show:
- What the article doesn't tell you about who benefits
- How this connects to broader patterns of power and influence
- Who actually makes the decisions described vs. who appears to
- What financial interests are at stake
- How citizens can take specific action on this issue
- What questions reporters should have asked but didn't

Connect to CivicSense mission of revealing how power actually works.
`,

  factChecking: `
Verify all factual claims with web search and authoritative sources.

For each claim:
1. Search for primary sources (government docs, congressional records, academic research)
2. Cross-reference with multiple authoritative sources
3. Rate source credibility (Tier 1: .gov, Tier 2: .edu, Tier 3: established journalism)
4. Flag any unverified or contradicted claims
5. Provide alternative sources if originals are insufficient

Prioritize: Congressional voting records > Government reports > Peer-reviewed research > Investigative journalism

Mark confidence level for each verified claim.
`,

  powerDynamicsAnalysis: `
Reveal the actual power structures and decision-making processes behind civic issues.

Analysis must show:
- Who ACTUALLY makes this decision (not who officially makes it)
- What financial interests and lobbying pressure influence outcomes
- How informal networks and relationships shape policy
- What citizens aren't supposed to understand about this process
- Where citizen pressure can actually create change

Use specific names, dollar amounts, institutional relationships, and historical patterns.
Expose the gap between official process and actual power flows.
`,

  civicActionGeneration: `
Generate specific, immediately actionable civic engagement steps.

Each action must include:
- Exact contact information (phone, email, address)
- Specific language to use when contacting officials
- Optimal timing for maximum impact
- Strategic rationale for why this action works
- How to escalate if officials don't respond
- Connection to broader systemic change

Actions must be:
- Doable within 24-48 hours
- Strategically targeted to actual decision-makers
- Designed to create real pressure for change
- Part of a larger civic engagement strategy
- Based on how power actually works, not how it's supposed to work
`
}

// =============================================================================
// MAIN CONFIGURATION
// =============================================================================

export const CIVIC_SENSE_AI_CONFIG: CivicSenseAIConfig = {
  // Brand voice enforcement (MANDATORY)
  brandVoice: {
    uncomfortableTruthRequired: true,
    activeVoiceMinimum: 80, // percent
    specificActorsRequired: 2, // minimum number
    powerDynamicsRequired: true,
    diplomaticSofteningForbidden: true
  },

  // Quality thresholds (MANDATORY)
  qualityThresholds: {
    minimumOverallScore: 70,
    minimumBrandVoiceScore: 21,
    minimumPowerDynamicsScore: 18,
    minimumCivicEngagementScore: 14,
    minimumAccuracyScore: 12
  },

  // Content requirements (MANDATORY)
  contentRequirements: {
    minimumActionSteps: 3,
    minimumPrimarySources: 2,
    factCheckingRequired: true,
    webSearchVerification: true,
    sourceCredibilityMinimum: 70
  },

  // AI model preferences
  aiProviders: {
    primary: 'anthropic', // Claude for brand voice alignment
    secondary: 'openai',  // GPT-4 for analysis
    factChecking: 'perplexity' // Real-time verification
  },

  // Prompt templates (MANDATORY - use these exact templates)
  promptTemplates: CIVIC_SENSE_PROMPT_TEMPLATES
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * REQUIRED: All AI components must use this factory function
 * Ensures consistent configuration across all agents
 */
export function createCivicSenseAIAgent<T extends CivicSenseAIAgent>(
  AgentClass: new (config: CivicSenseAIConfig) => T
): T {
  return new AgentClass(CIVIC_SENSE_AI_CONFIG)
}

// =============================================================================
// CONFIGURATION VALIDATION
// =============================================================================

/**
 * Validate that an AI agent is properly configured
 */
export function validateAIAgentConfig(agent: CivicSenseAIAgent): void {
  const requiredMethods = [
    'generateQualityContent',
    'generateInitialContent',
    'enforceUncomfortableTruth',
    'addPowerDynamicsAnalysis',
    'ensureActionableSteps'
  ]

  for (const method of requiredMethods) {
    if (typeof (agent as any)[method] !== 'function') {
      throw new Error(`AI Agent missing required method: ${method}`)
    }
  }

  if (!agent.agentType) {
    throw new Error('AI Agent must declare agentType')
  }

  console.log(`✅ AI Agent validated: ${agent.agentType}`)
}

// =============================================================================
// AGENT TYPE DEFINITIONS
// =============================================================================

export const AGENT_TYPES = {
  CONTENT_GENERATOR: 'content-generator',
  SURVEY_OPTIMIZER: 'survey-optimizer', 
  QUESTION_OPTIMIZER: 'question-optimizer',
  NEWS_ANALYZER: 'news-analyzer'
} as const

export type AgentType = typeof AGENT_TYPES[keyof typeof AGENT_TYPES]

// =============================================================================
// QUALITY MONITORING
// =============================================================================

export interface AIAgentMetrics {
  agentType: AgentType
  totalGenerations: number
  averageQualityScore: number
  publicationReadyPercentage: number
  uncomfortableTruthsDetected: number
  powerDynamicsRevealed: number
  civicActionsGenerated: number
  sourceVerificationRate: number
  lastUpdated: Date
}

export class AIConfigMonitor {
  private static metrics: Map<AgentType, AIAgentMetrics> = new Map()

  static updateMetrics(agentType: AgentType, qualityScore: number, warningFlags: string[]): void {
    const current = this.metrics.get(agentType) || {
      agentType,
      totalGenerations: 0,
      averageQualityScore: 0,
      publicationReadyPercentage: 0,
      uncomfortableTruthsDetected: 0,
      powerDynamicsRevealed: 0,
      civicActionsGenerated: 0,
      sourceVerificationRate: 0,
      lastUpdated: new Date()
    }

    current.totalGenerations++
    current.averageQualityScore = (current.averageQualityScore * (current.totalGenerations - 1) + qualityScore) / current.totalGenerations
    current.lastUpdated = new Date()

    // Update specific metrics based on warning flags
    if (!warningFlags.some(flag => flag.includes('UNCOMFORTABLE TRUTH'))) {
      current.uncomfortableTruthsDetected++
    }

    if (!warningFlags.some(flag => flag.includes('POWER ANALYSIS'))) {
      current.powerDynamicsRevealed++
    }

    if (!warningFlags.some(flag => flag.includes('CIVIC ACTIONS'))) {
      current.civicActionsGenerated++
    }

    this.metrics.set(agentType, current)
  }

  static getMetrics(agentType?: AgentType): AIAgentMetrics | AIAgentMetrics[] {
    if (agentType) {
      return this.metrics.get(agentType) || this.createEmptyMetrics(agentType)
    }
    return Array.from(this.metrics.values())
  }

  private static createEmptyMetrics(agentType: AgentType): AIAgentMetrics {
    return {
      agentType,
      totalGenerations: 0,
      averageQualityScore: 0,
      publicationReadyPercentage: 0,
      uncomfortableTruthsDetected: 0,
      powerDynamicsRevealed: 0,
      civicActionsGenerated: 0,
      sourceVerificationRate: 0,
      lastUpdated: new Date()
    }
  }

  static reportQualityTrends(): void {
    console.log('\n📊 CivicSense AI Quality Report')
    console.log('================================')
    
    const allMetrics = this.getMetrics() as AIAgentMetrics[]
    
    allMetrics.forEach(metrics => {
      console.log(`\n${metrics.agentType.toUpperCase()}:`)
      console.log(`  Total Generations: ${metrics.totalGenerations}`)
      console.log(`  Avg Quality Score: ${metrics.averageQualityScore.toFixed(1)}/100`)
      console.log(`  Uncomfortable Truths: ${metrics.uncomfortableTruthsDetected}`)
      console.log(`  Power Dynamics: ${metrics.powerDynamicsRevealed}`)
      console.log(`  Civic Actions: ${metrics.civicActionsGenerated}`)
    })

    const overallAverage = allMetrics.reduce((sum, m) => sum + m.averageQualityScore, 0) / allMetrics.length
    console.log(`\n🎯 Overall Average Quality: ${overallAverage.toFixed(1)}/100`)
    
    if (overallAverage < 70) {
      console.log('⚠️  WARNING: Quality below minimum threshold!')
    } else if (overallAverage >= 85) {
      console.log('✅ EXCELLENT: High quality standards maintained')
    }
  }
}

export default CIVIC_SENSE_AI_CONFIG 