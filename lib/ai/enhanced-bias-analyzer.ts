/**
 * Enhanced Bias Analyzer with Robust Error Handling
 * 
 * Features:
 * - Extends BaseAITool for reliable JSON parsing
 * - Analyzes media bias and manipulation techniques
 * - Saves analysis to Supabase with comprehensive metadata
 * - Extracts civic education content from articles
 */

import { BaseAITool, type AIToolConfig } from './base-ai-tool'
import OpenAI from 'openai'
import { z } from 'zod'

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const BiasScoreSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(100)
})

const ManipulationTechniqueSchema = z.object({
  technique: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high'])
})

const FactualClaimSchema = z.object({
  claim: z.string(),
  verifiable: z.boolean(),
  source_cited: z.boolean(),
  verification_status: z.enum(['verified', 'unverified', 'false', 'misleading', 'needs_context']),
  context_needed: z.string().optional()
})

const CivicContentSchema = z.object({
  type: z.enum(['question_topic', 'public_figure', 'event']),
  name: z.string(),
  description: z.string(),
  significance: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string(),
  difficulty: z.number().min(1).max(5)
})

const BiasAnalysisSchema = z.object({
  metadata: z.object({
    title: z.string(),
    author: z.string().optional(),
    published_date: z.string().optional(),
    source_organization: z.string()
  }),
  bias_scores: z.object({
    political_lean: BiasScoreSchema,
    factual_accuracy: BiasScoreSchema,
    emotional_manipulation: BiasScoreSchema,
    cherry_picking: BiasScoreSchema,
    false_balance: BiasScoreSchema
  }),
  manipulation_techniques: z.array(ManipulationTechniqueSchema),
  factual_claims: z.array(FactualClaimSchema),
  emotional_language_score: z.number().min(0).max(100),
  ai_reasoning: z.string(),
  civic_education_content: z.object({
    question_topics: z.array(CivicContentSchema),
    public_figures: z.array(CivicContentSchema),
    events: z.array(CivicContentSchema)
  })
})

type BiasAnalysis = z.infer<typeof BiasAnalysisSchema>

interface BiasAnalysisInput {
  articleUrl: string
  articleContent: string
  sourceMetadataId?: string
  organizationId?: string
}

interface BiasAnalysisOutput {
  analysis: BiasAnalysis
  analysisId?: string
  civicContentSaved: {
    question_topics: { created: number, existing: number }
    public_figures: { created: number, existing: number }
    events: { created: number, existing: number }
  }
  saved: boolean
  error?: string
}

const BIAS_ANALYSIS_PROMPT = `Analyze this article for bias and manipulation techniques.

REQUIREMENTS:
1. Identify specific manipulation techniques with evidence
2. Score each bias dimension from 0-100 with reasoning
3. Extract factual claims and verify their accuracy
4. Identify civic education opportunities in the content
5. Name specific politicians, institutions, and power dynamics

Return JSON matching this EXACT structure:
{
  "metadata": {
    "title": "Article title",
    "author": "Author name or null",
    "published_date": "YYYY-MM-DD or null",
    "source_organization": "Publisher name"
  },
  "bias_scores": {
    "political_lean": {
      "score": 0-100 (0=far left, 50=center, 100=far right),
      "reasoning": "Explanation of political bias",
      "evidence": ["Quote 1", "Quote 2"],
      "confidence": 0-100
    },
    "factual_accuracy": {
      "score": 0-100 (100=completely accurate),
      "reasoning": "Assessment of factual claims",
      "evidence": ["Verified fact", "False claim"],
      "confidence": 0-100
    },
    "emotional_manipulation": {
      "score": 0-100 (100=highly manipulative),
      "reasoning": "Analysis of emotional appeals",
      "evidence": ["Loaded language example"],
      "confidence": 0-100
    },
    "cherry_picking": {
      "score": 0-100 (100=extreme cherry-picking),
      "reasoning": "Evidence of selective facts",
      "evidence": ["Omitted context"],
      "confidence": 0-100
    },
    "false_balance": {
      "score": 0-100 (100=severe false balance),
      "reasoning": "Both-sidesism analysis",
      "evidence": ["False equivalence example"],
      "confidence": 0-100
    }
  },
  "manipulation_techniques": [
    {
      "technique": "Technique name",
      "description": "How it's used in this article",
      "examples": ["Example from article"],
      "severity": "low|medium|high"
    }
  ],
  "factual_claims": [
    {
      "claim": "Specific claim from article",
      "verifiable": true/false,
      "source_cited": true/false,
      "verification_status": "verified|unverified|false|misleading|needs_context",
      "context_needed": "Additional context if needed"
    }
  ],
  "emotional_language_score": 0-100,
  "ai_reasoning": "Overall analysis of bias and manipulation",
  "civic_education_content": {
    "question_topics": [
      {
        "type": "question_topic",
        "name": "Topic name",
        "description": "Why this is important",
        "significance": "low|medium|high|critical",
        "category": "Category name",
        "difficulty": 1-5
      }
    ],
    "public_figures": [],
    "events": []
  }
}`

// ============================================================================
// ENHANCED BIAS ANALYZER
// ============================================================================

export class EnhancedBiasAnalyzer extends BaseAITool<BiasAnalysisInput, BiasAnalysisOutput> {
  private openai?: OpenAI

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'Enhanced Bias Analyzer',
      type: 'bias_analyzer',
      provider: config?.provider || 'openai',
      model: config?.model || 'gpt-4o',
      ...config
    })
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private async initializeProviders() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }

  // ============================================================================
  // IMPLEMENTATION OF ABSTRACT METHODS
  // ============================================================================

  protected async validateInput(input: BiasAnalysisInput): Promise<BiasAnalysisInput> {
    if (!input.articleUrl || !input.articleUrl.startsWith('http')) {
      throw new Error('Valid article URL is required')
    }

    if (!input.articleContent || input.articleContent.trim().length < 100) {
      throw new Error('Article content must be at least 100 characters')
    }

    return {
      articleUrl: input.articleUrl.trim(),
      articleContent: input.articleContent.trim(),
      sourceMetadataId: input.sourceMetadataId,
      organizationId: input.organizationId
    }
  }

  protected async processWithAI(input: BiasAnalysisInput): Promise<string> {
    await this.initializeProviders()

    if (!this.openai) {
      throw new Error('OpenAI client not initialized')
    }

    const prompt = this.buildPrompt(input)
    
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      max_tokens: 4000,
      temperature: 0.3, // Lower temperature for more consistent analysis
      messages: [{
        role: 'system',
        content: 'You are an expert media bias analyst. Analyze articles objectively, identifying manipulation techniques and extracting civic education opportunities. Always return valid JSON.'
      }, {
        role: 'user',
        content: prompt
      }],
      response_format: { type: 'json_object' }
    })

    return response.choices[0]?.message?.content || ''
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<BiasAnalysisOutput> {
    // Use base class JSON parser
    const parsed = await this.parseJSON(rawOutput)
    
    if (!parsed.isValid) {
      throw new Error(`Failed to parse AI output: ${parsed.errors.join(', ')}`)
    }

    // Clean the output
    const cleaned = this.cleanOutput(parsed.content)
    
    // Validate with schema
    const analysis = BiasAnalysisSchema.parse(cleaned)
    
    return {
      analysis,
      civicContentSaved: {
        question_topics: { created: 0, existing: 0 },
        public_figures: { created: 0, existing: 0 },
        events: { created: 0, existing: 0 }
      },
      saved: false
    }
  }

  protected async validateOutput(output: BiasAnalysisOutput): Promise<BiasAnalysisOutput> {
    const { analysis } = output
    
    // Calculate overall bias score
    const biasScores = Object.values(analysis.bias_scores)
    const avgConfidence = biasScores.reduce((sum, score) => sum + score.confidence, 0) / biasScores.length
    
    if (avgConfidence < 50) {
      throw new Error(`Average confidence ${avgConfidence} is too low for reliable analysis`)
    }

    // Ensure we have some manipulation techniques identified
    if (analysis.manipulation_techniques.length === 0) {
      console.warn('No manipulation techniques identified - article may be high quality')
    }

    // Verify civic content extraction
    const totalCivicContent = 
      analysis.civic_education_content.question_topics.length +
      analysis.civic_education_content.public_figures.length +
      analysis.civic_education_content.events.length

    if (totalCivicContent === 0) {
      console.warn('No civic education content extracted from article')
    }

    return output
  }

  protected async saveToSupabase(output: BiasAnalysisOutput): Promise<BiasAnalysisOutput> {
    const { analysis } = output
    
    try {
      // Calculate dimension scores
      const dimensionScores = {
        political_lean: analysis.bias_scores.political_lean.score,
        factual_accuracy: analysis.bias_scores.factual_accuracy.score,
        emotional_manipulation: analysis.bias_scores.emotional_manipulation.score,
        cherry_picking: analysis.bias_scores.cherry_picking.score,
        false_balance: analysis.bias_scores.false_balance.score
      }

      // Calculate overall bias score (weighted average)
      const overallBiasScore = (
        dimensionScores.political_lean * 0.2 +
        (100 - dimensionScores.factual_accuracy) * 0.3 + // Invert accuracy
        dimensionScores.emotional_manipulation * 0.2 +
        dimensionScores.cherry_picking * 0.15 +
        dimensionScores.false_balance * 0.15
      )

      // Save main analysis
      const { data: savedAnalysis, error: saveError } = await this.supabase
        .from('article_bias_analysis')
        .insert({
          source_metadata_id: output.analysisId,
          organization_id: output.analysisId,
          article_url: output.analysisId || '',
          article_title: analysis.metadata.title,
          article_author: analysis.metadata.author,
          published_at: analysis.metadata.published_date,
          dimension_scores: dimensionScores,
          detected_techniques: analysis.manipulation_techniques,
          factual_claims: analysis.factual_claims,
          emotional_language_score: analysis.emotional_language_score,
          overall_bias_score: overallBiasScore,
          factual_accuracy_score: analysis.bias_scores.factual_accuracy.score,
          source_diversity_score: 0, // Calculate based on sources cited
          emotional_manipulation_score: analysis.bias_scores.emotional_manipulation.score,
          ai_analysis_version: `${this.config.provider}_${this.config.model}_v1`,
          ai_reasoning: analysis.ai_reasoning,
          ai_confidence: Object.values(analysis.bias_scores)
            .reduce((sum, score) => sum + score.confidence, 0) / 5,
          confidence_level: Object.values(analysis.bias_scores)
            .reduce((sum, score) => sum + score.confidence, 0) / 5,
          analysis_method: 'ai_enhanced',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (saveError) {
        throw saveError
      }

      // Save civic education content
      const civicResults = await this.saveCivicEducationContent(
        analysis.civic_education_content,
        savedAnalysis.id
      )

      // Log successful save
      await this.logActivity('bias_analysis_saved', {
        analysis_id: savedAnalysis.id,
        article_title: analysis.metadata.title,
        overall_bias_score: overallBiasScore,
        civic_content_extracted: civicResults
      })

      return {
        ...output,
        analysisId: savedAnalysis.id,
        civicContentSaved: civicResults,
        saved: true
      }
      
    } catch (error) {
      console.error('Failed to save bias analysis:', error)
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

  private buildPrompt(input: BiasAnalysisInput): string {
    return `Analyze this article for bias and manipulation techniques:

URL: ${input.articleUrl}

ARTICLE CONTENT:
${input.articleContent.substring(0, 10000)} // Limit for token constraints

${BIAS_ANALYSIS_PROMPT}`
  }

  private async saveCivicEducationContent(
    civicContent: BiasAnalysis['civic_education_content'],
    analysisId: string
  ): Promise<BiasAnalysisOutput['civicContentSaved']> {
    const results = {
      question_topics: { created: 0, existing: 0 },
      public_figures: { created: 0, existing: 0 },
      events: { created: 0, existing: 0 }
    }

    // Save question topics
    for (const topic of civicContent.question_topics) {
      try {
        const topicId = `ai_bias_${Date.now()}_${topic.name.toLowerCase().replace(/\s+/g, '-')}`
        
        const { data: existing } = await this.supabase
          .from('question_topics')
          .select('topic_id')
          .eq('topic_title', topic.name)
          .single()

        if (existing) {
          results.question_topics.existing++
        } else {
          const { error } = await this.supabase
            .from('question_topics')
            .insert({
              topic_id: topicId,
              topic_title: topic.name,
              description: topic.description,
              why_this_matters: `Understanding ${topic.name} is crucial for civic participation.`,
              emoji: '🏛️',
              categories: [topic.category],
              is_active: false,
              source_type: 'ai_extracted',
              source_analysis_id: analysisId,
              ai_extraction_metadata: {
                difficulty: topic.difficulty,
                significance: topic.significance,
                extraction_date: new Date().toISOString()
              }
            })

          if (!error) {
            results.question_topics.created++
          }
        }
      } catch (error) {
        console.error('Error saving question topic:', error)
      }
    }

    // Similar logic for public_figures and events...
    
    return results
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export async function analyzeBias(
  input: BiasAnalysisInput,
  provider: 'openai' | 'anthropic' = 'openai'
) {
  const analyzer = new EnhancedBiasAnalyzer({ provider })
  return await analyzer.process(input)
} 