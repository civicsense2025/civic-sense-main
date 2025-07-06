/**
 * Congressional Document Quiz Generator
 * 
 * Transforms congressional documents (bills, hearings, reports) into
 * engaging quiz questions that teach civic knowledge with CivicSense voice.
 * 
 * Features:
 * - Analyzes complex legislative documents
 * - Extracts key civic concepts and power dynamics
 * - Generates multiple-choice questions with explanations
 * - Maintains CivicSense brand voice (direct, evidence-based)
 * - Creates questions that reveal uncomfortable truths about power
 */

// ============================================================================
// CONGRESSIONAL DOCUMENT QUIZ GENERATOR
// ============================================================================
// External dependencies
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'

// Create service role client for admin operations that need to bypass RLS
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

interface DocumentKeyTakeaways {
  main_points: string[];
  uncomfortable_truths: string[];
  power_dynamics: string[];
  action_items: string[];
  civic_education_value: number;
}

interface GeneratedQuestionTopic {
  topic_title: string;
  topic_slug: string;
  category_id: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  civic_focus: string;
  key_takeaways: DocumentKeyTakeaways;
  document_source: {
    type: 'bill' | 'hearing' | 'committee_document';
    id: string;
    title: string;
    congress_number?: number;
  };
}

interface GeneratedQuestion {
  question_text: string;
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  time_limit: number;
  points: number;
  civic_insight: string;
  source_reference: string;
}

/**
 * Congressional Document to Quiz Generator
 * Extracts key takeaways and generates educational content from congressional documents
 */
export class CongressionalDocumentQuizGenerator {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  
  constructor() {
    this.supabase = createServiceClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  /**
   * Process a congressional document and generate quiz content
   */
  async processDocument(params: {
    documentType: 'bill' | 'hearing' | 'committee_document';
    documentId: string;
    documentTitle: string;
    documentContent: string;
    metadata?: any;
  }): Promise<{
    keyTakeaways: DocumentKeyTakeaways;
    questionTopics: GeneratedQuestionTopic[];
    questions: GeneratedQuestion[];
  }> {
    try {
      // 1. Extract key takeaways
      const keyTakeaways = await this.extractKeyTakeaways(params);
      
      // 2. Generate question topics based on takeaways
      const questionTopics = await this.generateQuestionTopics(params, keyTakeaways);
      
      // 3. Generate questions for each topic
      const questions: GeneratedQuestion[] = [];
      for (const topic of questionTopics) {
        const topicQuestions = await this.generateQuestionsForTopic(topic, params);
        questions.push(...topicQuestions);
      }
      
      // 4. Store everything in the database
      await this.storeGeneratedContent({
        documentType: params.documentType,
        documentId: params.documentId,
        keyTakeaways,
        questionTopics,
        questions
      });
      
      return { keyTakeaways, questionTopics, questions };
    } catch (error) {
      console.error('Error processing document for quiz generation:', error);
      throw error;
    }
  }
  
  /**
   * Extract key takeaways from document using AI
   */
  private async extractKeyTakeaways(params: {
    documentTitle: string;
    documentContent: string;
    documentType: string;
  }): Promise<DocumentKeyTakeaways> {
    const prompt = `
      As a CivicSense educator, extract the most important civic education takeaways from this ${params.documentType}.
      
      Document: ${params.documentTitle}
      Content: ${params.documentContent.substring(0, 6000)}
      
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
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });
      
      const takeaways = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        main_points: takeaways.main_points || [],
        uncomfortable_truths: takeaways.uncomfortable_truths || [],
        power_dynamics: takeaways.power_dynamics || [],
        action_items: takeaways.action_items || [],
        civic_education_value: takeaways.civic_education_value || 5
      };
    } catch (error) {
      console.error('Error extracting key takeaways:', error);
      return {
        main_points: [],
        uncomfortable_truths: [],
        power_dynamics: [],
        action_items: [],
        civic_education_value: 5
      };
    }
  }
  
  /**
   * Generate question topics from key takeaways
   */
  private async generateQuestionTopics(
    params: any, 
    keyTakeaways: DocumentKeyTakeaways
  ): Promise<GeneratedQuestionTopic[]> {
    const prompt = `
      Based on these key takeaways from a ${params.documentType}, create 2-3 educational quiz topics.
      
      Document: ${params.documentTitle}
      
      Key Takeaways:
      - Main Points: ${keyTakeaways.main_points.join('; ')}
      - Uncomfortable Truths: ${keyTakeaways.uncomfortable_truths.join('; ')}
      - Power Dynamics: ${keyTakeaways.power_dynamics.join('; ')}
      
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
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      const topics = result.topics || [];
      
      // Get appropriate category for congressional content
      const categoryId = await this.getCategoryId('government-politics');
      
      return topics.map((topic: any) => ({
        topic_title: topic.topic_title,
        topic_slug: topic.topic_slug,
        category_id: categoryId,
        description: topic.description,
        difficulty_level: topic.difficulty_level || 'intermediate',
        civic_focus: topic.civic_focus,
        key_takeaways: keyTakeaways,
        document_source: {
          type: params.documentType,
          id: params.documentId,
          title: params.documentTitle,
          congress_number: params.metadata?.congress_number
        }
      }));
    } catch (error) {
      console.error('Error generating question topics:', error);
      return [];
    }
  }
  
  /**
   * Generate questions for a specific topic
   */
  private async generateQuestionsForTopic(
    topic: GeneratedQuestionTopic,
    documentParams: any
  ): Promise<GeneratedQuestion[]> {
    const prompt = `
      Create 5 educational quiz questions for this topic based on the congressional document.
      
      Topic: ${topic.topic_title}
      Focus: ${topic.civic_focus}
      Document: ${documentParams.documentTitle}
      Key Points: ${topic.key_takeaways.main_points.join('; ')}
      
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
      
      Make questions:
      - Test practical understanding, not memorization
      - Reveal how power actually works
      - Connect to real civic engagement
      - Include explanations that teach, not just correct
      - Use scenarios when possible
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      const questions = result.questions || [];
      
      return questions.map((q: any) => ({
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level || 'medium',
        time_limit: this.getTimeLimit(q.difficulty_level),
        points: this.getPoints(q.difficulty_level),
        civic_insight: q.civic_insight,
        source_reference: q.source_reference || documentParams.documentTitle
      }));
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  }
  
  /**
   * Store generated content in database
   */
  private async storeGeneratedContent(content: {
    documentType: string;
    documentId: string;
    keyTakeaways: DocumentKeyTakeaways;
    questionTopics: GeneratedQuestionTopic[];
    questions: GeneratedQuestion[];
  }): Promise<void> {
    try {
      // Store each question topic
      for (const topic of content.questionTopics) {
        const { data: savedTopic, error: topicError } = await this.supabase
          .from('question_topics')
          .insert({
            topic_title: topic.topic_title,
            topic_slug: topic.topic_slug,
            category_id: topic.category_id,
            description: topic.description,
            difficulty_level: topic.difficulty_level,
            civic_focus: topic.civic_focus,
            key_takeaways: topic.key_takeaways,
            document_source: topic.document_source,
            is_active: true,
            auto_generated: true,
            generation_source: `${content.documentType}_${content.documentId}`
          })
          .select()
          .single();
        
        if (topicError) {
          console.error('Error saving topic:', topicError);
          continue;
        }
        
        // Store questions for this topic
        const topicQuestions = content.questions.filter(q => 
          q.source_reference.includes(topic.topic_title) || 
          q.civic_insight.includes(topic.civic_focus)
        );
        
        for (const question of topicQuestions) {
          await this.supabase
            .from('questions')
            .insert({
              topic_id: savedTopic.id,
              question_text: question.question_text,
              correct_answer: question.correct_answer,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              explanation: question.explanation,
              difficulty_level: question.difficulty_level,
              time_limit: question.time_limit,
              points: question.points,
              civic_insight: question.civic_insight,
              source_reference: question.source_reference,
              is_active: true,
              auto_generated: true
            });
        }
      }
      
      // Update the source document to indicate quiz content was generated
      const updateTable = this.getDocumentTable(content.documentType);
      if (updateTable) {
        await this.supabase
          .from(updateTable)
          .update({
            quiz_content_generated: true,
            quiz_generation_date: new Date().toISOString(),
            key_takeaways_extracted: content.keyTakeaways
          })
          .eq('id', content.documentId);
      }
      
    } catch (error) {
      console.error('Error storing generated content:', error);
      throw error;
    }
  }
  
  /**
   * Get category ID for a category slug
   */
  private async getCategoryId(categorySlug: string): Promise<string> {
    const { data } = await this.supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    
    return data?.id || 'default-category-id';
  }
  
  /**
   * Get time limit based on difficulty
   */
  private getTimeLimit(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 30;
      case 'medium': return 45;
      case 'hard': return 60;
      default: return 45;
    }
  }
  
  /**
   * Get points based on difficulty
   */
  private getPoints(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 10;
      case 'medium': return 20;
      case 'hard': return 30;
      default: return 20;
    }
  }
  
  /**
   * Get document table name
   */
  private getDocumentTable(documentType: string): string | null {
    switch (documentType) {
      case 'bill': return 'congressional_bills';
      case 'hearing': return 'congressional_hearings';
      case 'committee_document': return 'committee_documents';
      default: return null;
    }
  }
  
  /**
   * Generate quiz content from a bill
   */
  async generateQuizFromBill(bill: any): Promise<{
    success: boolean;
    error?: string;
    topicGenerated?: boolean;
    questionsGenerated?: number;
  }> {
    try {
      if (!bill.summary && !bill.full_text) {
        return { success: false, error: 'No content available for quiz generation' };
      }

      const content = bill.summary || bill.full_text || '';
      
      const result = await this.processDocument({
        documentType: 'bill',
        documentId: bill.id,
        documentTitle: bill.title || `${bill.bill_type} ${bill.bill_number}`,
        documentContent: content,
        metadata: { congress_number: bill.congress_number }
      });

      return {
        success: true,
        topicGenerated: result.questionTopics.length > 0,
        questionsGenerated: result.questions.length
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate quiz content from a hearing
   */
  async generateQuizFromHearing(hearing: any): Promise<{
    success: boolean;
    error?: string;
    topicGenerated?: boolean;
    questionsGenerated?: number;
  }> {
    try {
      if (!hearing.transcript && !hearing.summary) {
        return { success: false, error: 'No content available for quiz generation' };
      }

      const content = hearing.transcript || hearing.summary || '';
      
      const result = await this.processDocument({
        documentType: 'hearing',
        documentId: hearing.id,
        documentTitle: hearing.title,
        documentContent: content,
        metadata: { congress_number: hearing.congress_number }
      });

      return {
        success: true,
        topicGenerated: result.questionTopics.length > 0,
        questionsGenerated: result.questions.length
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate quiz content from a committee document
   */
  async generateQuizFromCommitteeDocument(doc: any): Promise<{
    success: boolean;
    error?: string;
    topicGenerated?: boolean;
    questionsGenerated?: number;
  }> {
    try {
      if (!doc.full_text && !doc.summary) {
        return { success: false, error: 'No content available for quiz generation' };
      }

      const content = doc.full_text || doc.summary || '';
      
      const result = await this.processDocument({
        documentType: 'committee_document',
        documentId: doc.id,
        documentTitle: doc.title,
        documentContent: content,
        metadata: { congress_number: doc.congress_number }
      });

      return {
        success: true,
        topicGenerated: result.questionTopics.length > 0,
        questionsGenerated: result.questions.length
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update generation statistics
   */
  async updateGenerationStats(stats: {
    congress_number: number;
    total_documents_processed: number;
    topics_generated: number;
    questions_generated: number;
    bills_processed: number;
    hearings_processed: number;
    committee_docs_processed: number;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('quiz_generation_stats')
        .upsert({
          congress_number: stats.congress_number,
          total_documents_processed: stats.total_documents_processed,
          topics_generated: stats.topics_generated,
          questions_generated: stats.questions_generated,
          bills_processed: stats.bills_processed,
          hearings_processed: stats.hearings_processed,
          committee_docs_processed: stats.committee_docs_processed,
          last_generation: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'congress_number'
        });

      if (error) {
        console.error('Error updating generation stats:', error);
      }
    } catch (error) {
      console.error('Error in updateGenerationStats:', error);
    }
  }

  /**
   * Process all documents of a specific type
   */
  async processAllDocuments(
    documentType: 'bill' | 'hearing' | 'committee_document',
    limit: number = 10
  ): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    try {
      const tableName = this.getDocumentTable(documentType);
      if (!tableName) {
        throw new Error(`Invalid document type: ${documentType}`);
      }
      
      // Get unprocessed documents
      const { data: documents } = await this.supabase
        .from(tableName)
        .select('id, title, content, congress_number')
        .is('quiz_content_generated', null)
        .limit(limit);
      
      for (const doc of documents || []) {
        results.processed++;
        
        try {
          await this.processDocument({
            documentType,
            documentId: doc.id,
            documentTitle: doc.title,
            documentContent: doc.content || '',
            metadata: { congress_number: doc.congress_number }
          });
          
          results.succeeded++;
        } catch (error) {
          results.failed++;
          results.errors.push(`${doc.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error processing documents:', error);
      throw error;
    }
  }
} 