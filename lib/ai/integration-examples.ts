/**
 * CivicSense AI Integration Examples
 * 
 * This file shows how to integrate your existing AI components with 
 * the new CivicSense AI Agent system to ensure consistent quality standards
 */

// =============================================================================
// INTEGRATION PATTERN 1: AI SURVEY OPTIMIZER
// =============================================================================

/**
 * Example: Integrating components/admin/ai-survey-optimizer.tsx
 * 
 * BEFORE: Individual AI calls with inconsistent prompts
 * AFTER: Using CivicSenseAIAgent base class with enforced quality standards
 */

import { CivicSenseAIAgent, type CivicSenseAIConfig, type AIGenerationOptions } from './civic-sense-ai-agent'
import { createCivicSenseAIAgent, CIVIC_SENSE_AI_CONFIG } from './civic-sense-ai-config'

interface Survey {
  id: string
  title: string
  description: string
  questions: any[]
  post_completion_config?: any
}

interface SurveyOptimizationResult {
  optimizedSurvey: Survey
  improvements: string[]
  qualityReport: any
}

export class CivicSenseSurveyOptimizer extends CivicSenseAIAgent {
  readonly agentType = 'survey-optimizer' as const

  /**
   * Main entry point for survey optimization
   * Replaces the existing analyzeSurvey() method in ai-survey-optimizer.tsx
   */
  async optimizeSurvey(
    survey: Survey,
    options: {
      provider?: 'openai' | 'anthropic'
      analysisType?: 'comprehensive' | 'quick' | 'specific'
      customPrompt?: string
    } = {}
  ): Promise<SurveyOptimizationResult> {
    console.log(`🔧 Optimizing survey: ${survey.title}`)

    // Use the enforced quality pipeline
    const result = await this.generateQualityContent(survey, {
      customPromptAddition: options.customPrompt,
      strictMode: options.analysisType === 'comprehensive'
    })

    // Parse the optimized survey from the result
    const optimizedSurvey = this.parseSurveyFromContent(result.content, survey)

    return {
      optimizedSurvey,
      improvements: this.extractImprovements(result),
      qualityReport: {
        qualityScore: result.qualityScore,
        warningFlags: result.warningFlags,
        publishRecommendation: result.publishRecommendation,
        brandVoiceScore: result.brandVoiceScore
      }
    }
  }

  // ==========================================================================
  // REQUIRED IMPLEMENTATIONS
  // ==========================================================================

  protected async generateInitialContent(survey: Survey, options?: AIGenerationOptions): Promise<string> {
    const prompt = `${this.promptTemplates.brandVoiceEnforcement}

SURVEY OPTIMIZATION TASK:
Analyze and optimize this survey to ensure it follows CivicSense standards.

SURVEY DATA:
Title: ${survey.title}
Description: ${survey.description}
Questions: ${JSON.stringify(survey.questions, null, 2)}
Post-completion: ${JSON.stringify(survey.post_completion_config, null, 2)}

${this.promptTemplates.surveyOptimization}

SPECIFIC ANALYSIS:
1. Question Wording: Do questions reveal uncomfortable truths about civic knowledge gaps?
2. Flow: Does the survey build civic agency rather than highlighting deficits?
3. Response Options: Do they capture nuanced understanding vs. binary thinking?
4. Post-completion: Does it drive specific civic action based on responses?
5. Bias Detection: Are there leading questions or assumptions that discourage participation?

Generate an optimized survey with specific improvements and rationale.
Include uncomfortable truths that politicians don't want people to understand about civic participation.

${options?.customPromptAddition || ''}
`

    return await this.callAI(prompt, 1000)
  }

  protected async enforceUncomfortableTruth(content: string, survey?: Survey): Promise<string> {
    const enhancementPrompt = `
The current survey optimization lacks uncomfortable truths about civic participation. 

CURRENT CONTENT: ${content}

Add analysis that reveals:
- How the political establishment benefits from civic ignorance
- Why traditional civics education fails to create effective citizens
- What politicians don't want people to understand about citizen power
- How to diagnose civic knowledge gaps that keep people passive
- Survey questions that reveal misconceptions about how change happens

Enhance the survey optimization to include these uncomfortable truths prominently.
`

    return await this.callAI(enhancementPrompt, 500)
  }

  protected async addPowerDynamicsAnalysis(content: string, survey?: Survey): Promise<string> {
    const enhancementPrompt = `
Enhance this survey optimization to reveal power dynamics in civic education and participation.

CURRENT CONTENT: ${content}

Add analysis showing:
- Who ACTUALLY controls civic education curricula vs. who appears to
- What interests benefit from keeping citizens uninformed and disengaged  
- How survey design can reveal or obscure power dynamics understanding
- Which civic knowledge gaps serve entrenched interests
- How to design surveys that build strategic thinking about power

Use specific examples of how survey design reinforces or challenges power structures.
`

    return await this.callAI(enhancementPrompt, 500)
  }

  protected async ensureActionableSteps(content: string, survey?: Survey): Promise<string> {
    const enhancementPrompt = `
Add specific, actionable civic engagement steps to this survey optimization.

CURRENT CONTENT: ${content}

Include 3-5 specific actions administrators can take:
1. Contact information for civic education boards and officials
2. Specific language for advocating for improved civic education
3. How to implement survey findings in institutional settings
4. Strategies for connecting survey data to policy change
5. Next steps for building civic agency in educational institutions

Each action must be immediately doable with exact contact information and timing.
`

    return await this.callAI(enhancementPrompt, 400)
  }

  // ==========================================================================
  // AI PROVIDER INTEGRATION
  // ==========================================================================

  protected async callAI(prompt: string, maxTokens = 500, temperature = 0.1): Promise<string> {
    // This integrates with your existing AI calling logic
    const provider = this.config.aiProviders.primary

    try {
      if (provider === 'anthropic') {
        return await this.callClaude(prompt, maxTokens, temperature)
      } else if (provider === 'openai') {
        return await this.callOpenAI(prompt, maxTokens, temperature)
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`)
      }
    } catch (error) {
      console.error(`AI call failed for ${this.agentType}:`, error)
      throw error
    }
  }

  private async callClaude(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    // Integrate with your existing Claude calling logic from ai-survey-optimizer.tsx
    const response = await fetch('/api/ai/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: maxTokens,
        temperature,
        system: "You are a CivicSense content expert focused on revealing uncomfortable truths about power and civic education."
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content || data.completion || ''
  }

  private async callOpenAI(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    // Integrate with your existing OpenAI calling logic
    const response = await fetch('/api/ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a CivicSense content expert focused on revealing uncomfortable truths about power and civic education.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private parseSurveyFromContent(content: string, originalSurvey: Survey): Survey {
    // Parse the AI-generated content to extract the optimized survey
    // This would implement your specific parsing logic
    try {
      const optimizedSurvey = { ...originalSurvey }
      
      // Extract optimized questions, descriptions, etc. from the AI content
      // Implementation depends on how your AI structures the response
      
      return optimizedSurvey
    } catch (error) {
      console.warn('Failed to parse optimized survey, returning original with improvements')
      return originalSurvey
    }
  }

  private extractImprovements(result: any): string[] {
    const improvements: string[] = []
    
    // Extract improvement suggestions from the AI result
    if (result.warningFlags) {
      improvements.push(...result.warningFlags)
    }
    
    if (result.civicActionSteps) {
      improvements.push(...result.civicActionSteps)
    }

    return improvements
  }
}

// =============================================================================
// INTEGRATION PATTERN 2: ADMIN CONTENT GENERATOR
// =============================================================================

/**
 * Example: Integrating components/admin-content-generator.tsx
 * 
 * Shows how to use the CivicSense AI system for news-to-quiz generation
 */

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: { name: string }
  publishedAt: string
}

interface GeneratedQuiz {
  topic: string
  description: string
  questions: any[]
  metadata?: any
}

export class CivicSenseContentGenerator extends CivicSenseAIAgent {
  readonly agentType = 'content-generator' as const

  /**
   * Main entry point for content generation
   * Replaces generateQuizFromArticle() in admin-content-generator.tsx
   */
  async generateQuizFromNews(
    article: NewsArticle,
    settings: {
      questionCount: number
      categories: string[]
      difficultyDistribution: any
    }
  ): Promise<GeneratedQuiz> {
    console.log(`📰 Generating quiz from: ${article.title}`)

    const result = await this.generateQualityContent({ article, settings })

    return this.parseQuizFromContent(result.content, article, settings)
  }

  // ==========================================================================
  // REQUIRED IMPLEMENTATIONS
  // ==========================================================================

  protected async generateInitialContent(input: { article: NewsArticle, settings: any }): Promise<string> {
    const { article, settings } = input

    const prompt = `${this.promptTemplates.brandVoiceEnforcement}

NEWS ARTICLE ANALYSIS TASK:
Transform this news article into CivicSense educational content that reveals power dynamics.

ARTICLE:
Title: ${article.title}
Description: ${article.description}
Source: ${article.source.name}
URL: ${article.url}

GENERATION SETTINGS:
- Question Count: ${settings.questionCount}
- Categories: ${settings.categories.join(', ')}
- Focus: Power dynamics and civic action

${this.promptTemplates.newsAnalysis}

Requirements:
1. Generate quiz questions that reveal the power dynamics BEHIND this news story
2. Show how this affects citizens' daily lives and power
3. Provide specific actions people can take related to this issue
4. Connect to broader systemic issues and patterns
5. Use only verifiable facts with primary sources
6. Include uncomfortable truths about who benefits from the status quo

Focus on what the article DOESN'T tell you about power and decision-making.
`

    return await this.callAI(prompt, 1200)
  }

  protected async enforceUncomfortableTruth(content: string, input?: any): Promise<string> {
    const article = input?.article
    
    const enhancementPrompt = `
This news-based educational content lacks uncomfortable truths. Enhance it to reveal what politicians don't want people to understand.

CURRENT CONTENT: ${content}
ORIGINAL ARTICLE: ${article?.title}

Add uncomfortable truths about:
- Who actually benefits from the situation described in the news
- What the article doesn't tell you about power dynamics
- Why this story is being covered now (and what it's distracting from)
- How this connects to larger patterns of institutional capture
- What citizens aren't supposed to understand about this issue

Make these truths prominent in quiz questions and explanations.
`

    return await this.callAI(enhancementPrompt, 600)
  }

  protected async addPowerDynamicsAnalysis(content: string, input?: any): Promise<string> {
    const article = input?.article

    const enhancementPrompt = `
Enhance this content to reveal the actual power dynamics behind the news story.

CURRENT CONTENT: ${content}
ORIGINAL ARTICLE: ${article?.title}

Add power analysis showing:
- Who ACTUALLY makes the decisions described vs. who appears to make them
- What financial interests and lobbying shaped this outcome
- How informal networks and relationships influenced this story
- What citizens aren't supposed to understand about these power dynamics
- Where citizen pressure could actually create change on this issue

Use specific names, dollar amounts, and institutional relationships from recent news.
`

    return await this.callAI(enhancementPrompt, 600)
  }

  protected async ensureActionableSteps(content: string, input?: any): Promise<string> {
    const article = input?.article

    const enhancementPrompt = `
Add specific, actionable civic engagement steps related to this news story.

CURRENT CONTENT: ${content}
NEWS TOPIC: ${article?.title}

Include 3-5 specific actions citizens can take:
1. Contact information for relevant officials (phone, email, address)
2. Specific language to use when contacting them about this issue
3. Timing advice for maximum impact
4. How to escalate if officials don't respond
5. Connection to broader advocacy and systemic change

Actions must be doable within 24-48 hours and strategically targeted.
`

    return await this.callAI(enhancementPrompt, 500)
  }

  protected async callAI(prompt: string, maxTokens = 500, temperature = 0.1): Promise<string> {
    // Same implementation as SurveyOptimizer above
    return await this.callClaude(prompt, maxTokens, temperature)
  }

  private async callClaude(prompt: string, maxTokens: number, temperature: number): Promise<string> {
    // Your existing Claude integration logic
    const response = await fetch('/api/ai/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens: maxTokens, temperature })
    })

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`)
    const data = await response.json()
    return data.content || ''
  }

  private parseQuizFromContent(content: string, article: NewsArticle, settings: any): GeneratedQuiz {
    // Parse the AI-generated content into quiz format
    return {
      topic: `Power Dynamics: ${article.title}`,
      description: `Revealing the uncomfortable truths behind: ${article.title}`,
      questions: this.extractQuestions(content),
      metadata: {
        sourceArticle: article,
        generatedAt: new Date().toISOString(),
        qualityEnforced: true
      }
    }
  }

  private extractQuestions(content: string): any[] {
    // Extract and format questions from the AI-generated content
    // Implementation depends on your specific question format
    return []
  }
}

// =============================================================================
// FACTORY FUNCTIONS FOR EASY INTEGRATION
// =============================================================================

/**
 * Factory functions to create properly configured AI agents
 * Use these in your existing components instead of direct instantiation
 */

export function createSurveyOptimizer(): CivicSenseSurveyOptimizer {
  return createCivicSenseAIAgent(CivicSenseSurveyOptimizer)
}

export function createContentGenerator(): CivicSenseContentGenerator {
  return createCivicSenseAIAgent(CivicSenseContentGenerator)
}

// =============================================================================
// INTEGRATION HELPER FOR EXISTING COMPONENTS
// =============================================================================

/**
 * Helper class to integrate with existing React components
 * Provides status updates and progress tracking
 */

export class AIIntegrationHelper {
  static async withProgressTracking<T>(
    operation: () => Promise<T>,
    onProgress: (status: { stage: string, progress: number, message: string }) => void
  ): Promise<T> {
    try {
      onProgress({ stage: 'initializing', progress: 10, message: 'Starting AI generation...' })
      
      const result = await operation()
      
      onProgress({ stage: 'complete', progress: 100, message: 'Content generated successfully!' })
      return result
      
    } catch (error) {
      onProgress({ 
        stage: 'error', 
        progress: 0, 
        message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      throw error
    }
  }

  /**
   * Validate AI output meets CivicSense standards
   * Use this before displaying results to users
   */
  static validateOutput(result: any): { valid: boolean, issues: string[] } {
    const issues: string[] = []

    if (!result.qualityScore || result.qualityScore.overall_score < 70) {
      issues.push('Quality score below minimum threshold')
    }

    if (!result.qualityScore?.uncomfortable_truth_detected) {
      issues.push('No uncomfortable truth detected')
    }

    if (!result.civicActionSteps || result.civicActionSteps.length < 3) {
      issues.push('Insufficient civic action steps')
    }

    if (result.warningFlags && result.warningFlags.length > 0) {
      issues.push(`Warning flags: ${result.warningFlags.join(', ')}`)
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }
}

export default {
  CivicSenseSurveyOptimizer,
  CivicSenseContentGenerator,
  createSurveyOptimizer,
  createContentGenerator,
  AIIntegrationHelper
} 