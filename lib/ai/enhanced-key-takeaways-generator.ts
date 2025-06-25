/**
 * Enhanced Key Takeaways Generator with Robust Error Handling
 * 
 * Features:
 * - Extends BaseAITool for reliable JSON parsing
 * - Generates high-quality civic education takeaways
 * - Validates against CivicSense quality standards
 * - Saves to question topics with proper error handling
 */

import { BaseAITool, type AIToolConfig } from './base-ai-tool'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const KeyTakeawaySchema = z.object({
  takeaway: z.string().min(50).max(500),
  power_dynamic_revealed: z.string().min(30).max(300),
  uncomfortable_truth: z.string().min(30).max(300),
  specific_example: z.string().min(50).max(400),
  action_step: z.string().min(30).max(300),
  related_concept: z.string().min(10).max(100)
})

const KeyTakeawaysSchema = z.object({
  topic_title: z.string(),
  key_takeaways: z.array(KeyTakeawaySchema).min(3).max(5),
  overarching_theme: z.string().min(50).max(300),
  power_structure_analysis: z.string().min(100).max(500),
  civic_action_summary: z.string().min(50).max(300),
  common_misconception: z.string().min(50).max(300),
  uncomfortable_truth_summary: z.string().min(50).max(300),
  metadata: z.object({
    generation_quality_score: z.number().min(0).max(100),
    uncomfortable_truth_score: z.number().min(0).max(100),
    actionability_score: z.number().min(0).max(100),
    power_dynamics_score: z.number().min(0).max(100)
  })
})

type KeyTakeawaysData = z.infer<typeof KeyTakeawaysSchema>

interface KeyTakeawaysInput {
  topicTitle: string
  topicId?: string
  questionContent?: string[]
  existingContent?: string
  includeCurrentEvents?: boolean
}

interface KeyTakeawaysOutput {
  topicId: string
  keyTakeaways: KeyTakeawaysData
  saved: boolean
  error?: string
}

const KEY_TAKEAWAYS_PROMPT = `Generate key takeaways for civic education that reveal uncomfortable truths about power.

REQUIREMENTS:
1. Each takeaway must expose how power actually works, not textbook theory
2. Include specific examples with real names, dates, and institutions
3. Connect abstract concepts to personal consequences
4. Provide actionable steps that can influence power structures
5. Challenge common assumptions with evidence

Return JSON matching this EXACT structure:
{
  "topic_title": "Topic Name",
  "key_takeaways": [
    {
      "takeaway": "Clear statement revealing how this aspect of government/power actually works",
      "power_dynamic_revealed": "Specific power dynamic or influence mechanism exposed",
      "uncomfortable_truth": "What politicians/institutions don't want citizens to know",
      "specific_example": "Real example with names, dates, and verifiable facts",
      "action_step": "Specific action citizens can take to influence this",
      "related_concept": "Connected civic concept"
    }
  ],
  "overarching_theme": "Main power dynamic or systemic issue revealed across all takeaways",
  "power_structure_analysis": "How power flows in this area vs. how textbooks claim it works",
  "civic_action_summary": "Most effective ways citizens can influence this area",
  "common_misconception": "What most people incorrectly believe about this topic",
  "uncomfortable_truth_summary": "The core uncomfortable truth about power in this area",
  "metadata": {
    "generation_quality_score": 85,
    "uncomfortable_truth_score": 90,
    "actionability_score": 80,
    "power_dynamics_score": 85
  }
}`

// ============================================================================
// ENHANCED KEY TAKEAWAYS GENERATOR
// ============================================================================

export class EnhancedKeyTakeawaysGenerator extends BaseAITool<KeyTakeawaysInput, KeyTakeawaysOutput> {
  private openai?: OpenAI
  private anthropic?: Anthropic

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'Enhanced Key Takeaways Generator',
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

  protected async validateInput(input: KeyTakeawaysInput): Promise<KeyTakeawaysInput> {
    if (!input.topicTitle || input.topicTitle.trim().length === 0) {
      throw new Error('Topic title is required')
    }

    return {
      topicTitle: input.topicTitle.trim(),
      topicId: input.topicId,
      questionContent: input.questionContent || [],
      existingContent: input.existingContent || '',
      includeCurrentEvents: input.includeCurrentEvents ?? true
    }
  }

  protected async processWithAI(input: KeyTakeawaysInput): Promise<string> {
    await this.initializeProviders()

    const prompt = this.buildPrompt(input)
    
    if (this.config.provider === 'anthropic' && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: 4000,
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
          content: 'You are a civic educator who reveals uncomfortable truths about how power actually works. Always return valid JSON.'
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

  protected async parseAndCleanOutput(rawOutput: string): Promise<KeyTakeawaysOutput> {
    // Use base class JSON parser
    const parsed = await this.parseJSON(rawOutput)
    
    if (!parsed.isValid) {
      throw new Error(`Failed to parse AI output: ${parsed.errors.join(', ')}`)
    }

    // Clean the output
    const cleaned = this.cleanOutput(parsed.content)
    
    // Validate with schema
    const validated = KeyTakeawaysSchema.parse(cleaned)
    
    // Generate or use provided topic ID
    const topicId = this.generateTopicId(validated.topic_title)
    
    return {
      topicId,
      keyTakeaways: validated,
      saved: false
    }
  }

  protected async validateOutput(output: KeyTakeawaysOutput): Promise<KeyTakeawaysOutput> {
    const { keyTakeaways } = output
    
    // Check quality scores
    const { metadata } = keyTakeaways
    const overallScore = (
      metadata.generation_quality_score +
      metadata.uncomfortable_truth_score +
      metadata.actionability_score +
      metadata.power_dynamics_score
    ) / 4

    if (overallScore < 70) {
      throw new Error(`Overall quality score ${overallScore} is below minimum 70`)
    }

    // Verify uncomfortable truths are present
    const hasUncomfortableTruths = keyTakeaways.key_takeaways.every(
      takeaway => takeaway.uncomfortable_truth.length > 30
    )
    
    if (!hasUncomfortableTruths) {
      throw new Error('Not all takeaways include uncomfortable truths')
    }

    // Verify specific examples are included
    const hasSpecificExamples = keyTakeaways.key_takeaways.every(
      takeaway => takeaway.specific_example.includes(' ') && 
                 takeaway.specific_example.length > 50
    )
    
    if (!hasSpecificExamples) {
      throw new Error('Not all takeaways include specific examples')
    }

    return output
  }

  protected async saveToSupabase(output: KeyTakeawaysOutput): Promise<KeyTakeawaysOutput> {
    const { topicId, keyTakeaways } = output
    
    try {
      // Check if topic exists
      const { data: existingTopic, error: fetchError } = await this.supabase
        .from('question_topics')
        .select('topic_id, ai_key_takeaways')
        .eq('topic_id', topicId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // Not found is ok
        throw fetchError
      }

      // Prepare the key takeaways data
      const keyTakeawaysData = {
        generated_at: new Date().toISOString(),
        provider: this.config.provider,
        model: this.config.model,
        content: keyTakeaways,
        quality_scores: keyTakeaways.metadata
      }

      if (existingTopic) {
        // Update existing topic
        const { error: updateError } = await this.supabase
          .from('question_topics')
          .update({
            ai_key_takeaways: keyTakeawaysData,
            updated_at: new Date().toISOString()
          })
          .eq('topic_id', topicId)

        if (updateError) {
          throw updateError
        }
      } else {
        // Create new topic with key takeaways
        const { error: insertError } = await this.supabase
          .from('question_topics')
          .insert({
            topic_id: topicId,
            topic_title: keyTakeaways.topic_title,
            description: keyTakeaways.overarching_theme,
            why_this_matters: keyTakeaways.uncomfortable_truth_summary,
            ai_key_takeaways: keyTakeawaysData,
            categories: ['ai_generated'],
            date: new Date().toISOString().split('T')[0],
            day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            emoji: '🎯',
            is_active: false, // Start inactive for review
            ai_generated: true,
            created_at: new Date().toISOString()
          })

        if (insertError) {
          throw insertError
        }
      }

      // Log successful save
      await this.logActivity('key_takeaways_saved', {
        topic_id: topicId,
        topic_title: keyTakeaways.topic_title,
        quality_scores: keyTakeaways.metadata
      })

      return {
        ...output,
        saved: true
      }
      
    } catch (error) {
      console.error('Failed to save key takeaways:', error)
      return {
        ...output,
        saved: false,
        error: error instanceof Error ? error.message : 'Unknown save error'
      }
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildPrompt(input: KeyTakeawaysInput): string {
    let prompt = `Generate key takeaways for the topic: "${input.topicTitle}"\n\n`
    
    if (input.questionContent && input.questionContent.length > 0) {
      prompt += `Based on these quiz questions:\n${input.questionContent.join('\n')}\n\n`
    }
    
    if (input.existingContent) {
      prompt += `Additional context:\n${input.existingContent}\n\n`
    }
    
    if (input.includeCurrentEvents) {
      prompt += `Include references to current events and recent political developments.\n\n`
    }
    
    prompt += KEY_TAKEAWAYS_PROMPT
    
    return prompt
  }

  private generateTopicId(topicTitle: string): string {
    const timestamp = Date.now()
    const slug = topicTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
    
    return `ai_kt_${timestamp}_${slug}`
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export async function generateKeyTakeaways(
  input: KeyTakeawaysInput,
  provider: 'openai' | 'anthropic' = 'anthropic'
) {
  const generator = new EnhancedKeyTakeawaysGenerator({ provider })
  return await generator.process(input)
} 