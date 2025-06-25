/**
 * Enhanced Glossary Generator with Robust Error Handling
 * 
 * Features:
 * - Extends BaseAITool for reliable JSON parsing
 * - Implements quality validation for CivicSense standards
 * - Batch saves to Supabase with error recovery
 * - Supports both OpenAI and Anthropic providers
 */

import { BaseAITool, type AIToolConfig, type AIToolResult } from './base-ai-tool'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const GlossaryTermSchema = z.object({
  term: z.string().min(1).max(100),
  definition: z.string().min(50).max(1000),
  why_it_matters: z.string().min(50).max(500),
  common_confusion: z.string().min(20).max(500),
  power_dynamics: z.array(z.string()).min(1).max(5),
  civic_action: z.string().min(20).max(300),
  related_terms: z.array(z.string()).default([]),
  category: z.string().default('general'),
  difficulty_level: z.number().min(1).max(5).default(3),
  quality_score: z.number().min(0).max(100).default(75),
  tags: z.array(z.string()).default([]),
  crossword_clue: z.string().optional()
})

type GlossaryTerm = z.infer<typeof GlossaryTermSchema>

interface GlossaryGenerationInput {
  type: 'extract_from_content' | 'generate_new' | 'optimize_existing'
  content?: string
  topic?: string
  count?: number
  categories?: string[]
  difficulty_level?: number
  include_web_search?: boolean
}

interface GlossaryGenerationOutput {
  terms: GlossaryTerm[]
  metadata: {
    total_generated: number
    valid_terms: number
    saved_to_db: number
    failed_saves: number
    quality_scores: {
      average: number
      min: number
      max: number
    }
  }
}

const GLOSSARY_PROMPT = `Generate glossary terms for civic education following these EXACT requirements:

1. Each term must reveal uncomfortable truths about power
2. Definitions must use active voice and name specific institutions
3. Include real power dynamics, not theoretical concepts
4. Provide actionable civic steps, not vague suggestions
5. Connect to current events and real political actors

Return a JSON array of glossary terms with this EXACT structure:
{
  "terms": [
    {
      "term": "Gerrymandering",
      "definition": "Politicians drawing district maps to choose their voters instead of voters choosing them. Both parties use sophisticated software to pack opposition voters into few districts while spreading their own voters to win more seats.",
      "why_it_matters": "Your vote literally counts less in gerrymandered districts. In 2022, Wisconsin Democrats won 51% of votes but only 35% of legislative seats because Republicans drew the maps.",
      "common_confusion": "People think redistricting is neutral or fair. Reality: The party in power draws maps to stay in power, making most elections predetermined.",
      "power_dynamics": [
        "State legislatures control federal House districts",
        "Courts rarely intervene even in extreme cases",
        "Incumbent protection is bipartisan"
      ],
      "civic_action": "Attend your state's redistricting hearings. Support independent redistricting commissions. Check your district at redistrictingdatahub.org",
      "related_terms": ["redistricting", "packing and cracking", "safe seats"],
      "category": "elections",
      "difficulty_level": 3,
      "quality_score": 85,
      "tags": ["voting", "democracy", "manipulation"],
      "crossword_clue": "Political map manipulation (14)"
    }
  ]
}

Generate exactly ${count} high-quality terms. Each must score >= 70 quality.`

// ============================================================================
// ENHANCED GLOSSARY GENERATOR
// ============================================================================

export class EnhancedGlossaryGenerator extends BaseAITool<GlossaryGenerationInput, GlossaryGenerationOutput> {
  private openai?: OpenAI
  private anthropic?: Anthropic

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'Enhanced Glossary Generator',
      type: 'content_generator',
      provider: config?.provider || 'anthropic',
      model: config?.model || 'claude-3-7-sonnet',
      ...config
    })
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private async initializeProviders() {
    if (this.config.provider === 'openai' && !this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
    
    if (this.config.provider === 'anthropic' && !this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    }
  }

  // ============================================================================
  // IMPLEMENTATION OF ABSTRACT METHODS
  // ============================================================================

  protected async validateInput(input: GlossaryGenerationInput): Promise<GlossaryGenerationInput> {
    // Set defaults
    const validated = {
      type: input.type,
      content: input.content || '',
      topic: input.topic || 'general civic knowledge',
      count: Math.min(Math.max(input.count || 5, 1), 50),
      categories: input.categories || ['general'],
      difficulty_level: Math.min(Math.max(input.difficulty_level || 3, 1), 5),
      include_web_search: input.include_web_search ?? true
    }

    // Validate required fields based on type
    if (validated.type === 'extract_from_content' && !validated.content) {
      throw new Error('Content is required for extraction type')
    }

    return validated
  }

  protected async processWithAI(input: GlossaryGenerationInput): Promise<string> {
    await this.initializeProviders()

    const prompt = this.buildPrompt(input)
    
    if (this.config.provider === 'anthropic' && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: 8000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Anthropic')
      }
      
      return content.text
    }
    
    if (this.config.provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{
          role: 'system',
          content: 'You are an expert civic educator who reveals uncomfortable truths about power. Always return valid JSON.'
        }, {
          role: 'user',
          content: prompt
        }],
        response_format: { type: 'json_object' }
      })

      return response.choices[0]?.message?.content || ''
    }

    throw new Error(`Provider ${this.config.provider} not configured`)
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<GlossaryGenerationOutput> {
    // Use base class JSON parser
    const parsed = await this.parseJSON(rawOutput)
    
    if (!parsed.isValid) {
      throw new Error(`Failed to parse AI output: ${parsed.errors.join(', ')}`)
    }

    // Extract terms array
    const rawTerms = parsed.content.terms || parsed.content || []
    const termsArray = Array.isArray(rawTerms) ? rawTerms : [rawTerms]

    // Validate and clean each term
    const validatedTerms: GlossaryTerm[] = []
    const errors: string[] = []

    for (const rawTerm of termsArray) {
      try {
        // Clean the term data
        const cleanedTerm = this.cleanOutput(rawTerm)
        
        // Validate with schema
        const validatedTerm = GlossaryTermSchema.parse(cleanedTerm)
        
        // Additional quality checks
        if (this.isHighQualityTerm(validatedTerm)) {
          validatedTerms.push(validatedTerm)
        } else {
          errors.push(`Term "${validatedTerm.term}" failed quality checks`)
        }
      } catch (error) {
        errors.push(`Validation error: ${error}`)
      }
    }

    // Calculate quality metrics
    const qualityScores = validatedTerms.map(t => t.quality_score)
    
    return {
      terms: validatedTerms,
      metadata: {
        total_generated: termsArray.length,
        valid_terms: validatedTerms.length,
        saved_to_db: 0, // Will be updated after save
        failed_saves: 0, // Will be updated after save
        quality_scores: {
          average: qualityScores.length > 0 
            ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
            : 0,
          min: qualityScores.length > 0 ? Math.min(...qualityScores) : 0,
          max: qualityScores.length > 0 ? Math.max(...qualityScores) : 0
        }
      }
    }
  }

  protected async validateOutput(output: GlossaryGenerationOutput): Promise<GlossaryGenerationOutput> {
    // Check minimum quality standards
    if (output.terms.length === 0) {
      throw new Error('No valid glossary terms generated')
    }

    if (output.metadata.quality_scores.average < 70) {
      throw new Error(`Average quality score ${output.metadata.quality_scores.average} is below minimum 70`)
    }

    // Remove duplicates
    const uniqueTerms = this.removeDuplicateTerms(output.terms)
    
    return {
      ...output,
      terms: uniqueTerms
    }
  }

  protected async saveToSupabase(output: GlossaryGenerationOutput): Promise<GlossaryGenerationOutput> {
    // Transform terms for database
    const dbTerms = output.terms.map(term => ({
      term: term.term,
      definition: term.definition,
      why_it_matters: term.why_it_matters,
      common_confusion: term.common_confusion,
      power_dynamics_revealed: term.power_dynamics,
      civic_action_step: term.civic_action,
      related_terms: term.related_terms,
      category: term.category,
      difficulty_level: term.difficulty_level,
      quality_score: term.quality_score,
      tags: term.tags,
      
      // Educational context JSONB
      educational_context: {
        power_dynamics: term.power_dynamics,
        action_steps: [term.civic_action],
        learning_objectives: [
          `Understand how ${term.term} affects citizen power`,
          'Apply knowledge to effective democratic participation'
        ],
        civic_category: term.category,
        target_audience: term.difficulty_level >= 4 ? 'advanced learners' : 'general public'
      },
      
      // Source info JSONB
      source_info: {
        provider: this.config.provider,
        model: this.config.model,
        generation_type: 'ai_generated',
        credibility_level: 'ai_generated',
        generated_at: new Date().toISOString()
      },
      
      // Game data JSONB
      game_data: {
        crossword_clue: term.crossword_clue || `A civic concept: ${term.term}`,
        matching_description: term.definition.substring(0, 60) + '...',
        difficulty_hint: term.difficulty_level >= 4 ? 'Advanced civic concept' : 'Fundamental democratic idea'
      },
      
      // Metadata
      ai_generated: true,
      is_verified: false,
      is_active: true,
      created_at: new Date().toISOString()
    }))

    // Batch save to database
    const { saved, failed } = await this.batchSaveToSupabase(
      'glossary_terms',
      dbTerms,
      10 // Batch size
    )

    // Update metadata with save results
    output.metadata.saved_to_db = saved.length
    output.metadata.failed_saves = failed.length

    // Log failed saves
    if (failed.length > 0) {
      await this.logActivity('batch_save_failures', {
        failed_count: failed.length,
        errors: failed.map(f => ({ term: f.item.term, error: f.error }))
      }, false)
    }

    return output
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildPrompt(input: GlossaryGenerationInput): string {
    const count = input.count || 5
    
    if (input.type === 'extract_from_content') {
      return `Extract ${count} glossary terms from this content following CivicSense standards:\n\n${input.content}\n\n${GLOSSARY_PROMPT.replace('${count}', count.toString())}`
    }
    
    if (input.type === 'generate_new') {
      return `Generate ${count} new glossary terms about ${input.topic} following CivicSense standards:\n\n${GLOSSARY_PROMPT.replace('${count}', count.toString())}`
    }
    
    return GLOSSARY_PROMPT.replace('${count}', count.toString())
  }

  private isHighQualityTerm(term: GlossaryTerm): boolean {
    // Check CivicSense quality standards
    const checks = [
      term.quality_score >= 70,
      term.definition.length >= 50,
      term.why_it_matters.length >= 50,
      term.power_dynamics.length >= 1,
      term.civic_action.length >= 20,
      !term.definition.includes('should') || term.definition.includes('actually'),
      term.definition.split(' ').filter(w => w[0] === w[0]?.toUpperCase()).length >= 2 // Has proper nouns
    ]
    
    return checks.filter(Boolean).length >= 6
  }

  private removeDuplicateTerms(terms: GlossaryTerm[]): GlossaryTerm[] {
    const seen = new Set<string>()
    const unique: GlossaryTerm[] = []
    
    for (const term of terms) {
      const key = term.term.toLowerCase().trim()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(term)
      }
    }
    
    return unique
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export async function generateGlossaryTerms(
  input: GlossaryGenerationInput,
  provider: 'openai' | 'anthropic' = 'anthropic'
): Promise<AIToolResult<GlossaryGenerationOutput>> {
  const generator = new EnhancedGlossaryGenerator({ provider })
  return await generator.process(input)
} 