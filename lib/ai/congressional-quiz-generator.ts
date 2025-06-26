/**
 * Congressional Quiz Generator - BaseAITool Integration
 * 
 * Transforms congressional documents into engaging quiz questions that teach
 * civic knowledge with CivicSense voice through unified AI tool architecture.
 */

import { BaseAITool, type AIToolConfig, type AIToolResult } from './base-ai-tool'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// =============================================================================
// INPUT/OUTPUT SCHEMAS
// =============================================================================

const DocumentInputSchema = z.object({
  documentType: z.enum(['bill', 'hearing', 'committee_document']),
  documentId: z.string(),
  documentTitle: z.string(),
  documentContent: z.string(),
  metadata: z.object({
    congress_number: z.number().optional(),
    committee: z.string().optional(),
    date: z.string().optional(),
    url: z.string().optional()
  }).optional(),
  // Generation options
  options: z.object({
    questionsPerTopic: z.number().min(3).max(15).default(6),
    includeHints: z.boolean().default(true),
    includeSources: z.boolean().default(true),
    verifySourcesWithWebSearch: z.boolean().default(true),
    difficultyLevel: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
    questionTypes: z.array(z.enum(['multiple_choice', 'true_false', 'short_answer'])).default(['multiple_choice', 'true_false'])
  }).default({
    questionsPerTopic: 6,
    includeHints: true,
    includeSources: true,
    verifySourcesWithWebSearch: true,
    difficultyLevel: 'mixed',
    questionTypes: ['multiple_choice', 'true_false']
  }).optional()
})

const KeyTakeawaysSchema = z.object({
  main_points: z.array(z.string()),
  uncomfortable_truths: z.array(z.string()),
  power_dynamics: z.array(z.string()),
  action_items: z.array(z.string()),
  civic_education_value: z.number().min(1).max(10)
})

const QuestionSchema = z.object({
  question_number: z.number(),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
  category: z.string(),
  question: z.string(), // This is the actual question text
  option_a: z.string().optional(),
  option_b: z.string().optional(),
  option_c: z.string().optional(),
  option_d: z.string().optional(),
  correct_answer: z.string(),
  hint: z.string().optional(),
  explanation: z.string(),
  tags: z.array(z.string()).default([]),
  sources: z.array(z.object({
    url: z.string(),
    title: z.string(),
    verified: z.boolean().default(false),
    excerpt: z.string().optional()
  })).default([]),
  difficulty_level: z.number().min(1).max(5), // 1-5 scale to match existing system
  is_active: z.boolean().default(true)
})

const QuizOutputSchema = z.object({
  keyTakeaways: KeyTakeawaysSchema,
  questionTopics: z.array(z.object({
    topic_id: z.string(), // Must match existing schema format: YYYY-MM-DD-topic-slug
    topic_title: z.string(),
    description: z.string(),
    why_this_matters: z.string(), // HTML formatted explanation
    emoji: z.string(),
    date: z.string(), // YYYY-MM-DD format
    day_of_week: z.string(),
    categories: z.array(z.string()), // JSON array of categories
    is_active: z.boolean().default(true),
    is_breaking: z.boolean().default(false),
    is_featured: z.boolean().default(false),
    key_takeaways: z.any().optional(),
    document_source: z.object({
      type: z.enum(['bill', 'hearing', 'committee_document']),
      id: z.string(),
      title: z.string(),
      congress_number: z.number().optional()
    })
  })),
  questions: z.array(QuestionSchema),
  metadata: z.object({
    processing_time: z.number(),
    questions_generated: z.number(),
    topics_created: z.number(),
    civic_education_score: z.number()
  })
})

// =============================================================================
// TYPES
// =============================================================================

type DocumentInput = z.infer<typeof DocumentInputSchema>
type KeyTakeaways = z.infer<typeof KeyTakeawaysSchema>
type Question = z.infer<typeof QuestionSchema>
type QuizOutput = z.infer<typeof QuizOutputSchema>

// =============================================================================
// CONGRESSIONAL QUIZ GENERATOR AI TOOL
// =============================================================================

export class CongressionalQuizGeneratorAI extends BaseAITool<DocumentInput, QuizOutput> {
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null

  constructor(config?: Partial<AIToolConfig>) {
    super({
      name: 'Congressional Quiz Generator',
      type: 'content_generator',
          provider: 'openai',
    model: 'gpt-4o',
      maxRetries: 3,
      ...config
    })
  }

  // =============================================================================
  // BASE AI TOOL IMPLEMENTATION
  // =============================================================================

  protected async validateInput(input: DocumentInput): Promise<DocumentInput> {
    return DocumentInputSchema.parse(input)
  }

  protected async processWithAI(input: DocumentInput): Promise<string> {
    await this.initializeProviders()

    const startTime = Date.now()
    
    // Step 1: Extract key takeaways
    const keyTakeaways = await this.extractKeyTakeaways(input)
    
    // Step 2: Generate question topics
    const questionTopics = await this.generateQuestionTopics(input, keyTakeaways)
    
    // Step 3: Generate questions for each topic
    const questions: Question[] = []
    for (const topic of questionTopics) {
      const topicQuestions = await this.generateQuestionsForTopic(topic, input)
      questions.push(...topicQuestions)
    }

    const processingTime = Date.now() - startTime
    
    const result: QuizOutput = {
      keyTakeaways,
      questionTopics,
      questions,
      metadata: {
        processing_time: processingTime,
        questions_generated: questions.length,
        topics_created: questionTopics.length,
        civic_education_score: keyTakeaways.civic_education_value
      }
    }

    return JSON.stringify(result)
  }

  protected async parseAndCleanOutput(rawOutput: string): Promise<QuizOutput> {
    const parsed = await this.parseJSON(rawOutput)
    
    if (!parsed.isValid) {
      throw new Error(`Failed to parse quiz generation output: ${parsed.errors.join(', ')}`)
    }

    return QuizOutputSchema.parse(parsed.content)
  }

  protected async validateOutput(output: QuizOutput): Promise<QuizOutput> {
    // Validate civic education quality
    if (output.metadata.civic_education_score < 6) {
      throw new Error('Generated content does not meet CivicSense educational standards')
    }

    if (output.questions.length === 0) {
      throw new Error('No questions were generated from the document')
    }

    if (output.keyTakeaways.uncomfortable_truths.length === 0) {
      throw new Error('Failed to extract uncomfortable truths - content may not reveal power dynamics')
    }

    return output
  }

  protected async saveToSupabase(output: QuizOutput): Promise<QuizOutput> {
    try {
      // Save each question topic
      for (const topic of output.questionTopics) {
        const { data: savedTopic, error: topicError } = await this.supabase
          .from('question_topics')
          .insert({
            topic_id: topic.topic_id,
            topic_title: topic.topic_title,
            description: topic.description,
            why_this_matters: topic.why_this_matters,
            emoji: topic.emoji,
            date: topic.date,
            day_of_week: topic.day_of_week,
            categories: topic.categories,
            is_active: topic.is_active,
            is_breaking: topic.is_breaking,
            is_featured: topic.is_featured,
            key_takeaways: topic.key_takeaways || output.keyTakeaways
          })
          .select()
          .single()

        if (topicError) {
          console.error('Error saving topic:', topicError)
          continue
        }

        // Save questions for this topic
        const topicQuestions = output.questions

        for (let i = 0; i < topicQuestions.length; i++) {
          const question = topicQuestions[i]
          await this.supabase
            .from('questions')
            .insert({
              topic_id: savedTopic.id,
              question_number: question.question_number,
              question_type: question.question_type,
              category: question.category,
              question: question.question,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              correct_answer: question.correct_answer,
              hint: question.hint,
              explanation: question.explanation,
              tags: question.tags,
              sources: question.sources,
              difficulty_level: question.difficulty_level,
              is_active: question.is_active
            })
        }
      }

      // Update source document
      const documentTable = this.getDocumentTable(output.questionTopics[0]?.document_source.type)
      if (documentTable) {
        await this.supabase
          .from(documentTable)
          .update({
            quiz_content_generated: true,
            quiz_generation_date: new Date().toISOString(),
            key_takeaways_extracted: output.keyTakeaways
          })
          .eq('id', output.questionTopics[0]?.document_source.id)
      }

      return output
    } catch (error) {
      console.error('Error saving quiz content to Supabase:', error)
      throw error
    }
  }

  // =============================================================================
  // AI PROCESSING METHODS
  // =============================================================================

  private async extractKeyTakeaways(input: DocumentInput): Promise<KeyTakeaways> {
    const prompt = this.buildKeyTakeawaysPrompt(input)
    
    const response = await this.openai!.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const rawContent = response.choices[0].message.content || '{}'
    const parsed = await this.parseJSON(rawContent)
    
    if (!parsed.isValid) {
      throw new Error('Failed to extract key takeaways')
    }

    return KeyTakeawaysSchema.parse(parsed.content)
  }

  private async generateQuestionTopics(input: DocumentInput, keyTakeaways: KeyTakeaways) {
    const prompt = this.buildTopicsPrompt(input, keyTakeaways)
    
    const response = await this.openai!.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5
    })

    const rawContent = response.choices[0].message.content || '{}'
    const parsed = await this.parseJSON(rawContent)
    
    if (!parsed.isValid) {
      throw new Error('Failed to generate question topics')
    }

    const result = parsed.content as any
    const topics = result.topics || []
    
    return topics.map((topic: any) => ({
      topic_id: this.generateTopicId(topic.topic_title, input.metadata?.date),
      topic_title: topic.topic_title,
      description: topic.description,
      why_this_matters: topic.why_this_matters || this.generateWhyThisMatters(topic, keyTakeaways),
      emoji: topic.emoji || this.selectEmojiForTopic(input.documentType),
      date: input.metadata?.date || new Date().toISOString().split('T')[0],
      day_of_week: this.getDayOfWeek(input.metadata?.date),
      categories: topic.categories || this.getDefaultCategories(input.documentType),
      is_active: true,
      is_breaking: this.isBreakingTopic(input, topic),
      is_featured: false,
      key_takeaways: keyTakeaways,
      document_source: {
        type: input.documentType,
        id: input.documentId,
        title: input.documentTitle,
        congress_number: input.metadata?.congress_number
      }
    }))
  }

  private async generateQuestionsForTopic(topic: any, documentParams: DocumentInput): Promise<Question[]> {
    const options = documentParams.options || {
      questionsPerTopic: 6,
      includeHints: true,
      includeSources: true,
      verifySourcesWithWebSearch: true,
      difficultyLevel: 'mixed' as const,
      questionTypes: ['multiple_choice', 'true_false'] as const
    }
    const prompt = this.buildQuestionsPrompt(topic, documentParams)
    
    const response = await this.openai!.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })

    const rawContent = response.choices[0].message.content || '{}'
    const parsed = await this.parseJSON(rawContent)
    
    if (!parsed.isValid) {
      throw new Error('Failed to generate questions')
    }

    const result = parsed.content as any
    const questions = result.questions || []
    
    // Process questions with web search for sources if enabled
    const processedQuestions = []
    for (let i = 0; i < Math.min(questions.length, options.questionsPerTopic || 6); i++) {
      const q = questions[i]
      let sources = q.sources || []
      
      // Add web search for sources if enabled
      if (options.includeSources && options.verifySourcesWithWebSearch) {
        const webSources = await this.searchAndVerifySources(q.question, documentParams)
        sources = [...sources, ...webSources]
      }
      
      processedQuestions.push({
        question_number: i + 1,
        question_type: this.selectQuestionType(options.questionTypes || ['multiple_choice']),
        category: q.category || this.getCategoryFromContent(documentParams),
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        hint: options.includeHints ? q.hint : undefined,
        explanation: q.explanation,
        tags: this.generateQuestionTags(q, documentParams),
        sources: sources.slice(0, 3), // Limit to top 3 sources
        difficulty_level: this.mapDifficultyToNumber(q.difficulty_level || 'medium'),
        is_active: true
      })
    }
    
    return processedQuestions
  }

  // =============================================================================
  // PROMPT BUILDERS
  // =============================================================================

  private buildKeyTakeawaysPrompt(input: DocumentInput): string {
    return `
As a CivicSense educator, extract the most important civic education takeaways from this ${input.documentType}.

Document: ${input.documentTitle}
Content: ${input.documentContent.substring(0, 6000)}

CivicSense Brand Voice Requirements:
- Reveal uncomfortable truths about how power actually works
- Use active voice and name specific institutions/officials
- Connect to citizens' real experiences and daily lives
- Provide actionable insights for civic engagement
- Challenge assumptions about government and democracy

Provide takeaways in this JSON format:
{
  "main_points": [
    "Core point 1 that citizens need to understand",
    "Core point 2 that citizens need to understand", 
    "Core point 3 that citizens need to understand"
  ],
  "uncomfortable_truths": [
    "Truth politicians don't want revealed",
    "Hidden power dynamic exposed",
    "Systemic issue uncovered"
  ],
  "power_dynamics": [
    "Who really controls this process",
    "How influence actually flows",
    "Which interests are being served"
  ],
  "action_items": [
    "Specific action citizens can take",
    "How to engage with this issue",
    "Where to get more information"
  ],
  "civic_education_value": 8
}

Focus on:
- What citizens absolutely need to know
- How this reveals government's actual workings
- Specific examples of power in action
- Concrete ways citizens can respond
- Clear, direct language without jargon
`
  }

  private buildTopicsPrompt(input: DocumentInput, keyTakeaways: KeyTakeaways): string {
    return `
Based on these key takeaways from a ${input.documentType}, create 2-3 educational quiz topics that embody CivicSense's mission.

Document: ${input.documentTitle}

Key Takeaways:
- Main Points: ${keyTakeaways.main_points.join('; ')}
- Uncomfortable Truths: ${keyTakeaways.uncomfortable_truths.join('; ')}
- Power Dynamics: ${keyTakeaways.power_dynamics.join('; ')}

CivicSense Brand Voice:
- Truth over comfort - reveal uncomfortable realities
- Clarity over politeness - direct, actionable insights
- Action over passive consumption - empower civic engagement
- Evidence over opinion - fact-based analysis

Generate topics in this JSON format:
{
  "topics": [
    {
      "topic_title": "Clear, engaging title for the quiz topic",
      "topic_slug": "url-friendly-slug",
      "description": "What citizens will learn from this quiz",
      "difficulty_level": "beginner|intermediate|advanced",
      "civic_focus": "The specific civic skill or knowledge being taught",
      "emoji": "📜"
    }
  ]
}

Make topics:
- Focused on practical civic knowledge
- Revealing about how power actually works
- Connected to citizens' daily lives
- Educational but not boring
- Challenge assumptions about how government works
`
  }

  private buildQuestionsPrompt(topic: any, documentParams: DocumentInput): string {
    return `
Create 5 educational quiz questions for this topic based on the congressional document.

Topic: ${topic.topic_title}
Focus: ${topic.civic_focus}  
Document: ${documentParams.documentTitle}

CivicSense Question Requirements:
- Test practical understanding, not memorization
- Reveal how power actually works
- Connect to real civic engagement opportunities
- Challenge common assumptions
- Include explanations that teach, not just correct
- Use scenarios when possible

Generate questions in this JSON format:
{
  "questions": [
    {
      "question_text": "Clear question that tests understanding",
      "correct_answer": "The right answer",
      "option_a": "First option",
      "option_b": "Second option",
      "option_c": "Third option", 
      "option_d": "Fourth option",
      "explanation": "Why this answer matters for civic engagement",
      "difficulty_level": "easy|medium|hard",
      "civic_insight": "What this teaches about how government works",
      "source_reference": "Specific part of the document this is based on"
    }
  ]
}

Focus on:
- Uncomfortable truths about power and influence
- How citizens can take specific action
- Real-world applications of civic knowledge
- Connections between policy and daily life
- Ways to hold officials accountable
`
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async getCategoryId(categorySlug: string): Promise<string> {
    const { data } = await this.supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    
    return data?.id || 'default-category-id'
  }

  private getCategoryFromContent(documentParams: DocumentInput): string {
    // Extract category from document type and content
    if (documentParams.documentType === 'bill') {
      return 'Legislative Process'
    } else if (documentParams.documentType === 'hearing') {
      return 'Congressional Oversight'
    } else if (documentParams.documentType === 'committee_document') {
      return 'Committee Work'
    }
    return 'Government'
  }

  private mapDifficultyToNumber(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 2
      case 'medium': return 3
      case 'hard': return 4
      case 'advanced': return 5
      default: return 3
    }
  }

  private generateTopicId(title: string, date?: string): string {
    const topicDate = date || new Date().toISOString().split('T')[0]
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      .substring(0, 50)
    return `${topicDate}-${slug}`
  }

  private generateWhyThisMatters(topic: any, keyTakeaways: KeyTakeaways): string {
    // Generate HTML formatted explanation based on uncomfortable truths and power dynamics
    const points = [
      ...keyTakeaways.uncomfortable_truths.slice(0, 2),
      ...keyTakeaways.power_dynamics.slice(0, 2)
    ]
    
    const listItems = points.map(point => `<li><strong>Civic Impact</strong>: ${point}</li>`).join('')
    return `<ul>${listItems}</ul>`
  }

  private selectEmojiForTopic(documentType: string): string {
    switch (documentType) {
      case 'bill': return '📜'
      case 'hearing': return '🎤'
      case 'committee_document': return '📋'
      default: return '🏛️'
    }
  }

  private getDayOfWeek(date?: string): string {
    const targetDate = date ? new Date(date) : new Date()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[targetDate.getDay()]
  }

  private getDefaultCategories(documentType: string): string[] {
    switch (documentType) {
      case 'bill': return ['Government', 'Legislative Process', 'Public Policy']
      case 'hearing': return ['Government', 'Congressional Oversight', 'Public Policy']
      case 'committee_document': return ['Government', 'Committee Work', 'Policy Analysis']
      default: return ['Government', 'Civic Education']
    }
  }

  private isBreakingTopic(input: DocumentInput, topic: any): boolean {
    // Mark as breaking if document is very recent or contains urgent keywords
    const urgentKeywords = ['emergency', 'crisis', 'urgent', 'breaking', 'immediate']
    const titleLower = (input.documentTitle + ' ' + topic.topic_title).toLowerCase()
    
    if (urgentKeywords.some(keyword => titleLower.includes(keyword))) {
      return true
    }

    // Check if document is from last 24 hours
    if (input.metadata?.date) {
      const docDate = new Date(input.metadata.date)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return docDate > yesterday
    }

    return false
  }

  private async searchAndVerifySources(question: string, documentParams: DocumentInput): Promise<Array<{url: string; title: string; verified: boolean; excerpt?: string}>> {
    // Mock web search implementation - would integrate with actual search API
    // For now, return some relevant government sources based on document type
    const sources = []
    
    if (documentParams.documentType === 'bill') {
      sources.push({
        url: `https://www.congress.gov/bill/${documentParams.metadata?.congress_number}th-congress/${documentParams.documentTitle}`,
        title: `${documentParams.documentTitle} - Congress.gov`,
        verified: true,
        excerpt: 'Official congressional record of the bill'
      })
    } else if (documentParams.documentType === 'hearing') {
      sources.push({
        url: `https://www.govinfo.gov/app/details/CHRG-${documentParams.metadata?.congress_number}`,
        title: `${documentParams.documentTitle} - GovInfo`,
        verified: true,
        excerpt: 'Official hearing transcript and proceedings'
      })
    }
    
    // Add Constitution.org for constitutional questions
    if (question.toLowerCase().includes('constitution') || question.toLowerCase().includes('amendment')) {
      sources.push({
        url: 'https://www.constitution.org',
        title: 'U.S. Constitution - Constitution.org',
        verified: true,
        excerpt: 'Official text and annotations of the U.S. Constitution'
      })
    }
    
    return sources
  }

  private selectQuestionType(allowedTypes: string[]): 'multiple_choice' | 'true_false' | 'short_answer' {
    if (allowedTypes.length === 0) return 'multiple_choice'
    const randomIndex = Math.floor(Math.random() * allowedTypes.length)
    return allowedTypes[randomIndex] as 'multiple_choice' | 'true_false' | 'short_answer'
  }

  private generateQuestionTags(question: any, documentParams: DocumentInput): string[] {
    const tags = []
    
    // Add document type tag
    tags.push(documentParams.documentType)
    
    // Add congressional tags
    if (documentParams.metadata?.congress_number) {
      tags.push(`congress-${documentParams.metadata.congress_number}`)
    }
    
    // Add subject-based tags
    const questionText = question.question.toLowerCase()
    if (questionText.includes('amendment') || questionText.includes('constitution')) {
      tags.push('constitutional-law')
    }
    if (questionText.includes('vote') || questionText.includes('election')) {
      tags.push('elections')
    }
    if (questionText.includes('committee')) {
      tags.push('committee-process')
    }
    if (questionText.includes('president') || questionText.includes('executive')) {
      tags.push('executive-branch')
    }
    
    return tags
  }

  private getDocumentTable(documentType: string): string | null {
    switch (documentType) {
      case 'bill': return 'congressional_bills'
      case 'hearing': return 'congressional_hearings'
      case 'committee_document': return 'congressional_committee_documents'
      default: return null
    }
  }

  private async initializeProviders(): Promise<void> {
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

  // =============================================================================
  // WORKFLOW ORCHESTRATION METHODS
  // =============================================================================

  /**
   * Process multiple documents in batch
   */
  static async processBatch(documents: DocumentInput[]): Promise<AIToolResult<QuizOutput>[]> {
    const results: AIToolResult<QuizOutput>[] = []
    
    for (const doc of documents) {
      const generator = new CongressionalQuizGeneratorAI()
      const result = await generator.process(doc)
      results.push(result)
    }
    
    return results
  }

  /**
   * Get workflow step configuration for Congressional content analysis
   */
  static getWorkflowStepConfig() {
    return {
      id: 'congressional_quiz_generation',
      name: 'Congressional Quiz Generation',
      type: 'content_generator',
      description: 'Generate educational quiz content from congressional documents',
      inputs: ['document_data'],
      outputs: ['quiz_content', 'key_takeaways', 'questions'],
      config: {
        max_questions_per_topic: 5,
        civic_education_minimum_score: 6,
        require_uncomfortable_truths: true,
        require_power_dynamics: true
      },
      parallel: false,
      required: true
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create Congressional Quiz Generator for workflow integration
 */
export function createCongressionalQuizGenerator(config?: Partial<AIToolConfig>): CongressionalQuizGeneratorAI {
  return new CongressionalQuizGeneratorAI(config)
}

/**
 * Process congressional document and generate quiz content
 */
export async function generateCongressionalQuiz(input: DocumentInput): Promise<AIToolResult<QuizOutput>> {
  const generator = new CongressionalQuizGeneratorAI()
  return await generator.process(input)
}

/**
 * Process bill and generate quiz content
 */
export async function generateQuizFromBill(bill: any, options?: Partial<DocumentInput['options']>): Promise<AIToolResult<QuizOutput>> {
  const input: DocumentInput = {
    documentType: 'bill',
    documentId: bill.id,
    documentTitle: bill.title || `${bill.bill_type} ${bill.bill_number}`,
    documentContent: bill.summary || bill.full_text || '',
    metadata: { congress_number: bill.congress_number },
    options: {
      questionsPerTopic: 6,
      includeHints: true,
      includeSources: true,
      verifySourcesWithWebSearch: true,
      difficultyLevel: 'mixed',
      questionTypes: ['multiple_choice', 'true_false'],
      ...options
    }
  }
  
  return await generateCongressionalQuiz(input)
}

/**
 * Process hearing and generate quiz content
 */
export async function generateQuizFromHearing(hearing: any, options?: Partial<DocumentInput['options']>): Promise<AIToolResult<QuizOutput>> {
  const input: DocumentInput = {
    documentType: 'hearing',
    documentId: hearing.id,
    documentTitle: hearing.title,
    documentContent: hearing.transcript || hearing.summary || '',
    metadata: { 
      congress_number: hearing.congress_number,
      committee: hearing.committee_name,
      date: hearing.hearing_date 
    },
    options: {
      questionsPerTopic: 6,
      includeHints: true,
      includeSources: true,
      verifySourcesWithWebSearch: true,
      difficultyLevel: 'mixed',
      questionTypes: ['multiple_choice', 'true_false'],
      ...options
    }
  }
  
  return await generateCongressionalQuiz(input)
} 