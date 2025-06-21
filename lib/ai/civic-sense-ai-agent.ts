/**
 * CivicSense AI Agent Base Class
 * 
 * This is the mandatory base class that ALL AI agents must extend.
 * It enforces our content quality rubric and brand voice standards.
 */

import { ContentQualityGate, type ContentQualityAssessment } from './content-quality-gate'
import { SourceVerificationEngine, type FactVerificationResult } from './source-verification-engine'
import { BrandVoiceValidator } from './brand-voice-validator'
import { CivicActionGenerator } from './civic-action-generator'
import { PowerDynamicsAnalyzer } from './power-dynamics-analyzer'

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface CivicSenseAIConfig {
  // Brand voice enforcement (MANDATORY)
  brandVoice: {
    uncomfortableTruthRequired: true
    activeVoiceMinimum: 80 // percent
    specificActorsRequired: 2 // minimum number
    powerDynamicsRequired: true
    diplomaticSofteningForbidden: true
  }
  
  // Quality thresholds (MANDATORY)
  qualityThresholds: {
    minimumOverallScore: 70
    minimumBrandVoiceScore: 21
    minimumPowerDynamicsScore: 18
    minimumCivicEngagementScore: 14
    minimumAccuracyScore: 12
  }
  
  // Content requirements (MANDATORY)
  contentRequirements: {
    minimumActionSteps: 3
    minimumPrimarySources: 2
    factCheckingRequired: true
    webSearchVerification: true
    sourceCredibilityMinimum: 70
  }
  
  // AI model preferences
  aiProviders: {
    primary: 'anthropic' // Claude for brand voice alignment
    secondary: 'openai'  // GPT-4 for analysis
    factChecking: 'perplexity' // Real-time verification
  }
  
  // Prompt templates (MANDATORY - use these exact templates)
  promptTemplates: CivicSensePromptTemplates
}

export interface CivicSensePromptTemplates {
  brandVoiceEnforcement: string
  questionGeneration: string
  surveyOptimization: string
  newsAnalysis: string
  factChecking: string
  powerDynamicsAnalysis: string
  civicActionGeneration: string
}

export interface CivicSenseAIOutput {
  content: string
  qualityScore: ContentQualityAssessment
  brandVoiceScore: number
  factCheckResults: FactVerificationResult[]
  sourceUrls: string[]
  warningFlags: string[]
  civicActionSteps: string[]
  powerDynamicsRevealed: string[]
  uncomfortableTruthsExposed: string[]
  publishRecommendation: 'publish' | 'revise' | 'enhance' | 'reject'
  confidenceLevel: number
  processingMetadata: {
    agentType: string
    modelUsed: string
    iterationsRequired: number
    qualityGatesPassed: string[]
    qualityGatesFailed: string[]
    processingTimeMs: number
  }
}

export interface AIGenerationOptions {
  maxIterations?: number
  strictMode?: boolean
  customPromptAddition?: string
  skipFactChecking?: boolean
  requiredSources?: string[]
}

export type AgentType = 'content-generator' | 'survey-optimizer' | 'question-optimizer' | 'news-analyzer'

// =============================================================================
// QUALITY ENFORCEMENT PROMPTS
// =============================================================================

export const QUALITY_ENFORCEMENT_PROMPTS = {
  uncomfortableTruthDetection: `
Analyze this content for uncomfortable truths politicians don't want people to know:

CONTENT: {content}

Does this reveal information that:
- Challenges how people think government actually works?
- Exposes gaps between official narrative and reality?
- Shows hidden power dynamics or decision-making processes?
- Reveals financial interests or conflicts that aren't obvious?
- Makes politicians/officials uncomfortable if widely known?

If NO uncomfortable truth detected, generate one specific to this topic.
Return the enhanced content with the uncomfortable truth prominently featured.
`,

  powerDynamicsEnhancement: `
Enhance this content to reveal actual power dynamics:

CONTENT: {content}

Add analysis showing:
- Who ACTUALLY makes this decision vs. who APPEARS to make it
- What financial interests are at stake and who benefits
- What informal power networks influence the outcome
- How the official process differs from the actual process
- What citizens aren't supposed to understand about this

Use specific names, dollar amounts, and institutional relationships.
Return the enhanced content with power dynamics clearly explained.
`,

  civicActionGeneration: `
Generate specific, actionable civic engagement steps:

CONTENT: {content}

Provide 3-5 specific actions citizens can take, using DIRECT IMPERATIVE LANGUAGE:
- Use action verbs: "Contact", "Call", "Write", "Track", "Monitor", "Attend"
- NEVER use "You can", "You should", "You must", "You need to"
- Include exact contact information (phone numbers, addresses, emails)
- Provide specific language to use when contacting officials
- Specify optimal timing for maximum impact
- Connect each action to broader systemic change
- Include escalation steps if officials don't respond appropriately

Examples of CORRECT language:
- "Call Senator Smith at (202) 224-XXXX to demand transparency on healthcare votes"
- "Contact the Transportation Committee at committee@house.gov before Tuesday's vote"
- "Track lobbying registrations at senate.gov/legislative/lobbying to spot influence patterns"

Make each action immediately doable within 24-48 hours.
Return the content with action steps integrated naturally.
`,

  sourceVerification: `
Verify all factual claims and enhance with authoritative sources:

CONTENT: {content}

For each factual claim:
1. Identify if it's verifiable
2. Find primary sources (government docs, academic research, official records)
3. Rate source credibility (tier 1: .gov, tier 2: .edu, tier 3: established journalism)
4. Flag any unverified or questionable claims
5. Suggest authoritative sources to strengthen weak claims

Prioritize: Congressional records > Government reports > Academic research > Journalism
Return the content with proper source citations integrated.
`
}

// =============================================================================
// BASE AI AGENT CLASS
// =============================================================================

export abstract class CivicSenseAIAgent {
  protected config: CivicSenseAIConfig
  protected qualityGate: ContentQualityGate
  protected sourceVerifier: SourceVerificationEngine
  protected brandVoiceValidator: BrandVoiceValidator
  protected civicActionGenerator: CivicActionGenerator
  protected powerDynamicsAnalyzer: PowerDynamicsAnalyzer
  protected promptTemplates: CivicSensePromptTemplates

  // MANDATORY: All subclasses must declare their type
  abstract readonly agentType: AgentType

  constructor(config: CivicSenseAIConfig) {
    this.config = config
    this.qualityGate = new ContentQualityGate(config.qualityThresholds)
    this.sourceVerifier = new SourceVerificationEngine()
    this.brandVoiceValidator = new BrandVoiceValidator(config.brandVoice)
    this.civicActionGenerator = new CivicActionGenerator()
    this.powerDynamicsAnalyzer = new PowerDynamicsAnalyzer()
    this.promptTemplates = config.promptTemplates
  }

  // ==========================================================================
  // PUBLIC API - REQUIRED ENTRY POINT
  // ==========================================================================

  /**
   * Generate content with quality enforcement (REQUIRED entry point)
   * All AI content generation must go through this method
   */
  public async generateQualityContent(
    input: any, 
    options: AIGenerationOptions = {}
  ): Promise<CivicSenseAIOutput> {
    const startTime = Date.now()
    console.log(`🤖 ${this.agentType}: Starting quality content generation`)

    try {
      // Step 1: Generate initial content
      const initialContent = await this.generateInitialContent(input, options)
      
      // Step 2: Enforce quality standards (MANDATORY)
      const result = await this.enforceQualityStandards(initialContent, input, options)
      
      // Step 3: Add processing metadata
      result.processingMetadata = {
        agentType: this.agentType,
        modelUsed: this.config.aiProviders.primary,
        iterationsRequired: result.processingMetadata?.iterationsRequired || 1,
        qualityGatesPassed: result.processingMetadata?.qualityGatesPassed || [],
        qualityGatesFailed: result.processingMetadata?.qualityGatesFailed || [],
        processingTimeMs: Date.now() - startTime
      }

      // Step 4: Log the generation for monitoring
      await this.logGeneration(input, result)

      console.log(`✅ ${this.agentType}: Quality content generated (${result.confidenceLevel}/100)`)
      return result

    } catch (error) {
      console.error(`❌ ${this.agentType}: Content generation failed:`, error)
      throw new Error(`AI content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ==========================================================================
  // QUALITY ENFORCEMENT - MANDATORY PIPELINE
  // ==========================================================================

  /**
   * MANDATORY: All subclasses must call this before returning content
   * This enforces our quality standards and brand voice
   */
  protected async enforceQualityStandards(
    content: string, 
    context?: any,
    options: AIGenerationOptions = {}
  ): Promise<CivicSenseAIOutput> {
    console.log(`🔍 ${this.agentType}: Enforcing CivicSense quality standards...`)
    
    const maxIterations = options.maxIterations || 3
    let currentContent = content
    let iteration = 0
    const qualityGatesPassed: string[] = []
    const qualityGatesFailed: string[] = []

    while (iteration < maxIterations) {
      iteration++
      console.log(`   Iteration ${iteration}/${maxIterations}`)

      // Step 1: Initial quality assessment
      let qualityScore = await this.qualityGate.assessContent(currentContent)
      
      // Step 2: Enforce uncomfortable truth requirement
      if (!qualityScore.uncomfortable_truth_detected) {
        console.log('   🔥 Adding uncomfortable truth...')
        qualityGatesFailed.push('uncomfortable_truth')
        currentContent = await this.enforceUncomfortableTruth(currentContent, context)
        qualityScore = await this.qualityGate.assessContent(currentContent)
        if (qualityScore.uncomfortable_truth_detected) {
          qualityGatesPassed.push('uncomfortable_truth')
        }
      } else {
        qualityGatesPassed.push('uncomfortable_truth')
      }

      // Step 3: Enhance power dynamics if missing
      if (qualityScore.power_dynamics_score < this.config.qualityThresholds.minimumPowerDynamicsScore) {
        console.log('   💰 Enhancing power dynamics analysis...')
        qualityGatesFailed.push('power_dynamics')
        currentContent = await this.addPowerDynamicsAnalysis(currentContent, context)
        qualityScore = await this.qualityGate.assessContent(currentContent)
        if (qualityScore.power_dynamics_score >= this.config.qualityThresholds.minimumPowerDynamicsScore) {
          qualityGatesPassed.push('power_dynamics')
        }
      } else {
        qualityGatesPassed.push('power_dynamics')
      }

      // Step 4: Add civic action steps if insufficient
      if (qualityScore.action_steps_count < this.config.contentRequirements.minimumActionSteps) {
        console.log('   🎯 Adding civic action steps...')
        qualityGatesFailed.push('civic_actions')
        currentContent = await this.ensureActionableSteps(currentContent, context)
        qualityScore = await this.qualityGate.assessContent(currentContent)
        if (qualityScore.action_steps_count >= this.config.contentRequirements.minimumActionSteps) {
          qualityGatesPassed.push('civic_actions')
        }
      } else {
        qualityGatesPassed.push('civic_actions')
      }

      // Step 5: Check if we meet minimum standards
      if (this.meetsPublicationStandards(qualityScore)) {
        console.log(`   ✅ Quality standards met after ${iteration} iterations`)
        break
      }

      if (iteration === maxIterations) {
        console.warn(`   ⚠️ Max iterations reached, proceeding with current quality`)
      }
    }

    // Step 6: Verify and enhance sources (if not skipped)
    let factCheckResults: FactVerificationResult[] = []
    if (!options.skipFactChecking && this.config.contentRequirements.factCheckingRequired) {
      console.log('   📊 Verifying sources and facts...')
      factCheckResults = await this.verifyFactualClaims(currentContent)
    }

    const sourceUrls = factCheckResults
      .flatMap(fc => fc.supportingEvidence)
      .map(evidence => evidence.url)

    // Step 7: Final quality check
    const finalQualityScore = await this.qualityGate.assessContent(currentContent)
    
    // Step 8: Generate warnings and recommendations
    const warningFlags = this.generateWarningFlags(finalQualityScore, factCheckResults)
    const publishRecommendation = this.determinePublishRecommendation(finalQualityScore, warningFlags)

    return {
      content: currentContent,
      qualityScore: finalQualityScore,
      brandVoiceScore: finalQualityScore.brand_voice_score,
      factCheckResults,
      sourceUrls,
      warningFlags,
      civicActionSteps: this.extractActionSteps(currentContent),
      powerDynamicsRevealed: this.extractPowerDynamics(currentContent),
      uncomfortableTruthsExposed: this.extractUncomfortableTruths(currentContent),
      publishRecommendation,
      confidenceLevel: finalQualityScore.overall_score,
      processingMetadata: {
        agentType: this.agentType,
        modelUsed: this.config.aiProviders.primary,
        iterationsRequired: iteration,
        qualityGatesPassed,
        qualityGatesFailed,
        processingTimeMs: 0 // Will be set by caller
      }
    }
  }

  // ==========================================================================
  // ABSTRACT METHODS - MUST BE IMPLEMENTED BY SUBCLASSES
  // ==========================================================================

  /**
   * Generate initial content - implement in each AI agent
   */
  protected abstract generateInitialContent(
    input: any, 
    options?: AIGenerationOptions
  ): Promise<string>

  /**
   * Enforce uncomfortable truth requirement - implement in each AI agent
   */
  protected abstract enforceUncomfortableTruth(
    content: string, 
    context?: any
  ): Promise<string>

  /**
   * Add power dynamics analysis - implement in each AI agent
   */
  protected abstract addPowerDynamicsAnalysis(
    content: string, 
    context?: any
  ): Promise<string>

  /**
   * Ensure actionable civic steps - implement in each AI agent
   */
  protected abstract ensureActionableSteps(
    content: string, 
    context?: any
  ): Promise<string>

  /**
   * Call AI with agent-specific configuration - implement in each AI agent
   */
  protected abstract callAI(
    prompt: string, 
    maxTokens?: number,
    temperature?: number
  ): Promise<string>

  // ==========================================================================
  // SHARED IMPLEMENTATIONS
  // ==========================================================================

  /**
   * Verify factual claims using source verification engine
   */
  protected async verifyFactualClaims(content: string): Promise<FactVerificationResult[]> {
    return await this.sourceVerifier.verifyContent(content)
  }

  /**
   * Check if content meets publication standards
   */
  protected meetsPublicationStandards(qualityScore: ContentQualityAssessment): boolean {
    return (
      qualityScore.overall_score >= this.config.qualityThresholds.minimumOverallScore &&
      qualityScore.brand_voice_score >= this.config.qualityThresholds.minimumBrandVoiceScore &&
      qualityScore.power_dynamics_score >= this.config.qualityThresholds.minimumPowerDynamicsScore &&
      qualityScore.civic_engagement_score >= this.config.qualityThresholds.minimumCivicEngagementScore &&
      qualityScore.accuracy_score >= this.config.qualityThresholds.minimumAccuracyScore &&
      qualityScore.uncomfortable_truth_detected &&
      qualityScore.action_steps_count >= this.config.contentRequirements.minimumActionSteps &&
      qualityScore.primary_sources_count >= this.config.contentRequirements.minimumPrimarySources
    )
  }

  /**
   * Generate warning flags based on quality assessment
   */
  protected generateWarningFlags(
    qualityScore: ContentQualityAssessment, 
    factCheckResults: FactVerificationResult[]
  ): string[] {
    const flags: string[] = []

    if (!qualityScore.uncomfortable_truth_detected) {
      flags.push('🚨 NO UNCOMFORTABLE TRUTH - Required for CivicSense brand')
    }

    if (qualityScore.power_dynamics_score < this.config.qualityThresholds.minimumPowerDynamicsScore) {
      flags.push('⚠️ INSUFFICIENT POWER ANALYSIS - Must reveal who actually decides')
    }

    if (qualityScore.action_steps_count < this.config.contentRequirements.minimumActionSteps) {
      flags.push('🎯 LACKS CIVIC ACTIONS - Must provide specific steps citizens can take')
    }

    if (qualityScore.primary_sources_count < this.config.contentRequirements.minimumPrimarySources) {
      flags.push('📊 WEAK SOURCE VERIFICATION - Need more authoritative sources')
    }

    const unverifiedClaims = factCheckResults.filter(fc => !fc.isVerified && fc.confidence < 60)
    if (unverifiedClaims.length > 0) {
      flags.push(`❌ ${unverifiedClaims.length} UNVERIFIED CLAIMS - May contain misinformation`)
    }

    const contradictedClaims = factCheckResults.filter(fc => 
      fc.contradictingEvidence.length > fc.supportingEvidence.length
    )
    if (contradictedClaims.length > 0) {
      flags.push(`🔍 ${contradictedClaims.length} CONTRADICTED CLAIMS - Evidence conflicts detected`)
    }

    if (qualityScore.brand_voice_score < this.config.qualityThresholds.minimumBrandVoiceScore) {
      flags.push('🗣️ WEAK BRAND VOICE - Must be more direct and uncompromising')
    }

    return flags
  }

  /**
   * Determine publication recommendation
   */
  protected determinePublishRecommendation(
    qualityScore: ContentQualityAssessment, 
    warningFlags: string[]
  ): 'publish' | 'revise' | 'enhance' | 'reject' {
    // Critical issues that require rejection
    const criticalFlags = warningFlags.filter(flag => 
      flag.includes('🚨') || flag.includes('❌') || flag.includes('CONTRADICTED')
    )
    
    if (criticalFlags.length > 0) {
      return 'reject'
    }

    // High priority issues that need significant revision
    const highPriorityFlags = warningFlags.filter(flag => 
      flag.includes('POWER ANALYSIS') || flag.includes('CIVIC ACTIONS')
    )
    
    if (highPriorityFlags.length > 0 || qualityScore.overall_score < 70) {
      return 'revise'
    }

    // Minor issues that can be enhanced
    if (warningFlags.length > 0 || qualityScore.overall_score < 85) {
      return 'enhance'
    }

    // High quality content ready for publication
    return 'publish'
  }

  /**
   * Extract action steps from content
   */
  protected extractActionSteps(content: string): string[] {
    const actionPatterns = [
      /call\s+(?:your\s+)?(?:representative|senator|congressman)/gi,
      /contact\s+[^\s]+\s+at\s+\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi,
      /email\s+[^\s]+@[^\s]+\.(gov|org|com)/gi,
      /attend\s+[^.!?]+(?:meeting|hearing|session)/gi,
      /join\s+[^.!?]+organization/gi,
      /vote\s+(?:in|for|against|on)\s+[^.!?]+/gi
    ]
    
    const steps: string[] = []
    actionPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        steps.push(...matches)
      }
    })
    
    return [...new Set(steps)] // Remove duplicates
  }

  /**
   * Extract power dynamics revelations from content
   */
  protected extractPowerDynamics(content: string): string[] {
    const powerPatterns = [
      /who actually (?:decides|controls|makes|determines)[^.!?]*/gi,
      /real power (?:lies|flows|rests) (?:with|in|through)[^.!?]*/gi,
      /behind the scenes[^.!?]*/gi,
      /follow the money[^.!?]*/gi,
      /who benefits (?:financially|from)[^.!?]*/gi,
      /hidden (?:stakeholders|interests|influence)[^.!?]*/gi,
      /actual process.*different.*official[^.!?]*/gi
    ]
    
    const dynamics: string[] = []
    powerPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        dynamics.push(...matches)
      }
    })
    
    return [...new Set(dynamics)]
  }

  /**
   * Extract uncomfortable truths from content
   */
  protected extractUncomfortableTruths(content: string): string[] {
    const truthPatterns = [
      /here's what they don't want you to know[^.!?]*/gi,
      /politicians (?:don't want|prefer) people (?:not )?(?:to )?(?:know|understand)[^.!?]*/gi,
      /the real reason[^.!?]*is[^.!?]*/gi,
      /behind the political theater[^.!?]*/gi,
      /what.*actually happening[^.!?]*/gi,
      /how.*actually works[^.!?]*/gi,
      /while officials claim.*they actually[^.!?]*/gi
    ]
    
    const truths: string[] = []
    truthPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        truths.push(...matches)
      }
    })
    
    return [...new Set(truths)]
  }

  /**
   * Log generation for monitoring and analytics
   */
  protected async logGeneration(input: any, output: CivicSenseAIOutput): Promise<void> {
    try {
      // This would integrate with your analytics system
      console.log(`📊 ${this.agentType}: Logging generation`, {
        qualityScore: output.qualityScore.overall_score,
        brandVoiceScore: output.brandVoiceScore,
        warningFlags: output.warningFlags.length,
        publishRecommendation: output.publishRecommendation
      })

      // TODO: Implement actual logging to database
      // await analyticsService.logAIGeneration({
      //   agentType: this.agentType,
      //   input,
      //   output,
      //   timestamp: new Date()
      // })
    } catch (error) {
      console.warn('Failed to log AI generation:', error)
    }
  }
}

// =============================================================================
// QUALITY VALIDATION RESULT
// =============================================================================

export interface QualityValidationResult {
  passed: boolean
  score: number
  requiredImprovements: string[]
  criticalIssues: string[]
  publishReady: boolean
  agentType: string
  recommendations: string[]
}

// =============================================================================
// AI QUALITY GATE INTEGRATION
// =============================================================================

export class AIQualityGateIntegration {
  static async validateAIOutput(
    output: CivicSenseAIOutput,
    agentType: string
  ): Promise<QualityValidationResult> {
    const validation: QualityValidationResult = {
      passed: false,
      score: output.qualityScore.overall_score,
      requiredImprovements: [],
      criticalIssues: [],
      publishReady: false,
      agentType,
      recommendations: []
    }

    // Check minimum thresholds
    if (output.qualityScore.overall_score < 70) {
      validation.criticalIssues.push(`Overall score ${output.qualityScore.overall_score} below minimum 70`)
    }

    if (!output.qualityScore.uncomfortable_truth_detected) {
      validation.criticalIssues.push('No uncomfortable truth detected - Required for CivicSense brand')
    }

    if (output.qualityScore.action_steps_count < 3) {
      validation.requiredImprovements.push('Need at least 3 specific action steps with contact information')
    }

    if (output.qualityScore.primary_sources_count < 2) {
      validation.requiredImprovements.push('Need at least 2 primary sources (.gov, .edu, congressional records)')
    }

    // Agent-specific validation
    switch (agentType) {
      case 'content-generator':
        if (output.qualityScore.power_dynamics_score < 18) {
          validation.criticalIssues.push('Insufficient power dynamics analysis for content generation')
        }
        validation.recommendations.push('Focus on revealing who actually makes decisions vs. who appears to')
        break
      
      case 'survey-optimizer':
        if (output.qualityScore.civic_engagement_score < 14) {
          validation.criticalIssues.push('Survey must better promote civic engagement and action')
        }
        validation.recommendations.push('Ensure questions build civic agency rather than passive knowledge')
        break
        
      case 'question-optimizer':
        if (output.qualityScore.accuracy_score < 12) {
          validation.criticalIssues.push('Question optimization requires higher factual accuracy')
        }
        validation.recommendations.push('Verify all claims with web search and primary sources')
        break
        
      case 'news-analyzer':
        if (output.qualityScore.power_dynamics_score < 20) {
          validation.criticalIssues.push('News analysis must reveal power dynamics behind the story')
        }
        validation.recommendations.push('Show what the article doesn\'t tell you about who benefits')
        break
    }

    // Additional recommendations based on scores
    if (output.qualityScore.brand_voice_score < 25) {
      validation.recommendations.push('Strengthen brand voice: be more direct, call lies "lies", name specific actors')
    }

    if (output.factCheckResults.some(fc => !fc.isVerified)) {
      validation.recommendations.push('Verify or remove unsubstantiated claims before publication')
    }

    validation.passed = validation.criticalIssues.length === 0
    validation.publishReady = validation.passed && validation.requiredImprovements.length === 0

    return validation
  }
}

export default CivicSenseAIAgent 