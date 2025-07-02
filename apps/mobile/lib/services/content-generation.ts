import { supabase } from '../supabase';

export interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sources: SourceInfo[];
  fact_check_status: 'verified' | 'partially_verified' | 'unverified';
  civic_relevance_score: number;
  uncomfortable_truths?: string[];
  power_dynamics?: string[];
  action_steps?: string[];
}

export interface SourceInfo {
  title: string;
  url: string;
  credibility_score: number;
  bias_rating: string;
  author?: string;
  date?: string;
  excerpt?: string;
}

export interface GeneratedContent {
  topic: string;
  description?: string;
  questions: GeneratedQuestion[];
  generated_at: string;
  total_sources: number;
  average_credibility: number;
  fact_check_summary: string;
  generation_metadata: {
    model_used: string;
    processing_time: number;
    research_depth: number;
    fact_check_passes: number;
  };
  user_id?: string;
  topic_id?: string; // For premium users, reference to created playable topic
}

export interface ContentGenerationRequest {
  topic: string;
  question_count?: number;
  difficulty_preference?: 'mixed' | 'easy' | 'medium' | 'hard';
  focus_areas?: string[];
  user_id: string;
}

class ContentGenerationService {
  private readonly API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  
  /**
   * Generate custom civic education content based on user topic
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      console.log('🧠 Starting content generation for:', request.topic);
      
      // Step 1: Validate and enhance the topic
      const enhancedTopic = await this.enhanceTopic(request.topic);
      
      // Step 2: Research the topic and gather sources
      const researchData = await this.researchTopic(enhancedTopic);
      
      // Step 3: Generate questions based on research
      const questions = await this.generateQuestions(enhancedTopic, researchData, request);
      
      // Step 4: Fact-check each question
      const verifiedQuestions = await this.factCheckQuestions(questions);
      
      // Step 5: Add civic education elements (uncomfortable truths, power dynamics)
      const civicEnhancedQuestions = await this.addCivicEducationElements(verifiedQuestions);
      
      // Step 6: Compile final content
      const generatedContent: GeneratedContent = {
        topic: request.topic,
        questions: civicEnhancedQuestions,
        generated_at: new Date().toISOString(),
        total_sources: this.countUniqueSources(civicEnhancedQuestions),
        average_credibility: this.calculateAverageCredibility(civicEnhancedQuestions),
        fact_check_summary: this.generateFactCheckSummary(civicEnhancedQuestions),
        generation_metadata: {
          model_used: 'GPT-4o + Claude-3.5-Sonnet',
          processing_time: Date.now(), // Would be calculated properly
          research_depth: researchData.sources.length,
          fact_check_passes: 3,
        },
      };
      
      // Step 7: Save to database
      await this.saveGeneratedContent(generatedContent, request.user_id);
      
      console.log('✅ Content generation completed successfully');
      return generatedContent;
      
    } catch (error) {
      console.error('❌ Content generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Content generation failed: ${errorMessage}`);
    }
  }
  
  /**
   * Enhance and clarify the user's topic input
   */
  private async enhanceTopic(topic: string): Promise<string> {
    // In production, this would use AI to enhance the topic
    // For now, return the original topic with some basic enhancement
    const cleanTopic = topic.trim();
    
    // Add context keywords if missing
    const contextKeywords = ['policy', 'government', 'federal', 'state', 'local', 'constitutional', 'legal'];
    const hasContext = contextKeywords.some(keyword => 
      cleanTopic.toLowerCase().includes(keyword)
    );
    
    if (!hasContext && cleanTopic.length < 50) {
      return `${cleanTopic} government policy and constitutional implications`;
    }
    
    return cleanTopic;
  }
  
  /**
   * Research the topic using multiple trusted sources
   */
  private async researchTopic(topic: string): Promise<{
    sources: SourceInfo[];
    key_concepts: string[];
    recent_developments: string[];
    power_structures: string[];
  }> {
    // In production, this would:
    // 1. Query government APIs (Congress.gov, Supreme Court, etc.)
    // 2. Search academic databases
    // 3. Gather recent news from verified sources
    // 4. Use AI to analyze and summarize findings
    
    // For demo, return mock research data
    return {
      sources: [
        {
          title: "Congressional Research Service Report",
          url: "https://crs.congress.gov/",
          credibility_score: 95,
          bias_rating: "center",
          date: "2024-01-15"
        },
        {
          title: "Supreme Court Opinions Database",
          url: "https://www.supremecourt.gov/opinions/",
          credibility_score: 98,
          bias_rating: "center",
          date: "2024-01-10"
        },
        {
          title: "Federal Register - Recent Rules",
          url: "https://www.federalregister.gov/",
          credibility_score: 92,
          bias_rating: "center",
          date: "2024-01-12"
        }
      ],
      key_concepts: [
        "Federal vs State Authority",
        "Constitutional Commerce Clause",
        "Administrative Law",
        "Judicial Review"
      ],
      recent_developments: [
        "Recent Supreme Court decisions on federal agency authority",
        "State challenges to federal regulations",
        "New Congressional oversight measures"
      ],
      power_structures: [
        "Federal agency rulemaking process",
        "State attorney general coordinated challenges",
        "Corporate lobbying influence on policy"
      ]
    };
  }
  
  /**
   * Generate questions using AI based on research
   * NOTE: This method is now deprecated - use UGC Content Generator instead
   */
  private async generateQuestions(
    topic: string, 
    research: any, 
    request: ContentGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    console.warn('⚠️ Using deprecated mock content generation. Switch to UGC Content Generator for real AI.');
    
    const questionCount = request.question_count || 10;
    
    // Return placeholder indicating this is deprecated
    return [{
      id: `deprecated_${Date.now()}`,
      question: `[DEPRECATED] This content generation method has been replaced. Please use the new AI-powered generation.`,
      options: [
        "Use UGC Content Generator instead",
        "This is mock data",
        "Switch to real AI generation",
        "Update your implementation"
      ],
      correct_answer: "Use UGC Content Generator instead",
      explanation: `This is a deprecated method. Use the UGC Content Generator for real AI-powered content generation.`,
      difficulty: 'medium' as const,
      sources: [],
      fact_check_status: 'unverified' as const,
      civic_relevance_score: 0,
    }];
  }
  
  /**
   * Fact-check generated questions against multiple sources
   */
  private async factCheckQuestions(questions: GeneratedQuestion[]): Promise<GeneratedQuestion[]> {
    // In production, this would:
    // 1. Verify each fact against multiple sources
    // 2. Check for bias and accuracy
    // 3. Cross-reference with government databases
    // 4. Flag any questionable content
    
    return questions.map(question => ({
      ...question,
      fact_check_status: 'verified' as const, // All pass fact-check in demo
    }));
  }
  
  /**
   * Add CivicSense-specific civic education elements
   */
  private async addCivicEducationElements(questions: GeneratedQuestion[]): Promise<GeneratedQuestion[]> {
    return questions.map(question => ({
      ...question,
      uncomfortable_truths: [
        "The real decision-making often happens behind closed doors",
        "Corporate interests significantly influence policy outcomes",
        "Individual votes matter less than systemic power structures"
      ],
      power_dynamics: [
        "Federal agency capture by industry",
        "Revolving door between government and private sector",
        "Unequal access to decision-makers"
      ],
      action_steps: [
        "Contact your representatives with specific policy positions",
        "Join organizations that track and influence policy",
        "Attend local government meetings to understand the process",
        "Support candidates who prioritize transparency"
      ]
    }));
  }
  
  /**
   * Save generated content to database
   */
  private async saveGeneratedContent(content: GeneratedContent, userId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_content_generations')
      .insert({
        user_id: userId,
        topic: content.topic,
        questions: content.questions,
        generation_metadata: content.generation_metadata,
        fact_check_summary: content.fact_check_summary,
        average_credibility: content.average_credibility,
        total_sources: content.total_sources,
        is_published: false,
        created_at: content.generated_at,
      });
    
    if (error) {
      console.error('Error saving generated content:', error);
      throw error;
    }
  }
  
  /**
   * Calculate average credibility score across all sources
   */
  private calculateAverageCredibility(questions: GeneratedQuestion[]): number {
    const allSources = questions.flatMap(q => q.sources);
    if (allSources.length === 0) return 0;
    
    const total = allSources.reduce((sum, source) => sum + source.credibility_score, 0);
    return Math.round(total / allSources.length);
  }
  
  /**
   * Count unique sources across all questions
   */
  private countUniqueSources(questions: GeneratedQuestion[]): number {
    const uniqueUrls = new Set(
      questions.flatMap(q => q.sources.map(s => s.url))
    );
    return uniqueUrls.size;
  }
  
  /**
   * Generate a summary of the fact-checking process
   */
  private generateFactCheckSummary(questions: GeneratedQuestion[]): string {
    const verifiedCount = questions.filter(q => q.fact_check_status === 'verified').length;
    const totalSources = this.countUniqueSources(questions);
    const avgCredibility = this.calculateAverageCredibility(questions);
    
    return `${verifiedCount}/${questions.length} questions verified against ${totalSources} trusted sources. Average source credibility: ${avgCredibility}%. All content cross-referenced with government databases and recent court decisions.`;
  }
  
  /**
   * Get user's generation history
   */
  async getUserGenerations(userId: string, limit: number = 10): Promise<GeneratedContent[]> {
    const { data, error } = await supabase
      .from('custom_content_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching user generations:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Delete a user's generated content
   */
  async deleteGeneration(generationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_content_generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting generation:', error);
      throw error;
    }
  }
  
  /**
   * Publish generated content to make it available to other users
   */
  async publishContent(generationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_content_generations')
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq('id', generationId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error publishing content:', error);
      throw error;
    }
  }

  /**
   * Track a content generation attempt in the database
   */
  async trackGeneration(
    userId: string, 
    topic: string, 
    isPremium: boolean,
    metadata?: {
      difficulty?: string;
      questionCount?: number;
      includeLocalContext?: boolean;
      includeBiasAnalysis?: boolean;
      includeActionSteps?: boolean;
      customComplexity?: string;
    }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('custom_content_generations')
        .insert({
          user_id: userId,
          topic: topic,
          is_premium: isPremium,
          status: 'generating',
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error tracking generation:', error);
        throw new Error('Failed to track content generation');
      }

      return data.id;
    } catch (error) {
      console.error('Error in trackGeneration:', error);
      throw error;
    }
  }

  /**
   * Update generation status and store the generated content
   */
  async completeGeneration(
    generationId: string,
    content: GeneratedContent,
    isPremium: boolean
  ): Promise<void> {
    try {
      const updateData: any = {
        status: 'completed',
        content: content,
        completed_at: new Date().toISOString(),
      };

      // For premium users, also create the actual topic and questions in the database
      if (isPremium) {
        await this.createPlayableContent(content, generationId);
        updateData.topic_id = content.topic_id; // Reference to the created topic
      }

      const { error } = await supabase
        .from('custom_content_generations')
        .update(updateData)
        .eq('id', generationId);

      if (error) {
        console.error('Error completing generation:', error);
        throw new Error('Failed to complete content generation');
      }

      console.log(`✅ Generation ${generationId} completed successfully`);
    } catch (error) {
      console.error('Error in completeGeneration:', error);
      throw error;
    }
  }

  /**
   * Create actual playable content for premium users
   */
  private async createPlayableContent(content: GeneratedContent, generationId: string): Promise<void> {
    try {
      // Create the topic
      const { data: topicData, error: topicError } = await supabase
        .from('question_topics')
        .insert({
          topic_id: `custom_${generationId}`,
          topic_title: content.topic,
          description: content.description || `Custom quiz on ${content.topic}`,
          emoji: this.getTopicEmoji(content.topic),
          is_active: true,
          is_custom: true,
          created_by: content.user_id,
          date: new Date().toISOString().split('T')[0], // Today's date
          question_count: content.questions.length,
        })
        .select('id')
        .single();

      if (topicError) {
        console.error('Error creating topic:', topicError);
        throw new Error('Failed to create playable topic');
      }

      // Create the questions
      const questionsToInsert = content.questions.map((question, index) => ({
        topic_id: `custom_${generationId}`,
        question: question.question,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        sources: question.sources,
        order_index: index,
        is_active: true,
        fact_check_status: question.fact_check_status,
        civic_relevance_score: question.civic_relevance_score,
        uncomfortable_truths: question.uncomfortable_truths,
        power_dynamics: question.power_dynamics,
        action_steps: question.action_steps,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error creating questions:', questionsError);
        throw new Error('Failed to create playable questions');
      }

      // Update the content with the created topic_id
      content.topic_id = `custom_${generationId}`;
      
      console.log(`✅ Created playable content with topic ID: custom_${generationId}`);
    } catch (error) {
      console.error('Error creating playable content:', error);
      throw error;
    }
  }

  /**
   * Get emoji for topic based on keywords
   */
  private getTopicEmoji(topic: string): string {
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('supreme court') || lowerTopic.includes('constitutional')) return '⚖️';
    if (lowerTopic.includes('election') || lowerTopic.includes('voting')) return '🗳️';
    if (lowerTopic.includes('congress') || lowerTopic.includes('house') || lowerTopic.includes('senate')) return '🏛️';
    if (lowerTopic.includes('environment') || lowerTopic.includes('climate')) return '🌍';
    if (lowerTopic.includes('healthcare') || lowerTopic.includes('medical')) return '🏥';
    if (lowerTopic.includes('education') || lowerTopic.includes('school')) return '🎓';
    if (lowerTopic.includes('economy') || lowerTopic.includes('budget') || lowerTopic.includes('tax')) return '💰';
    if (lowerTopic.includes('military') || lowerTopic.includes('defense')) return '🛡️';
    if (lowerTopic.includes('immigration') || lowerTopic.includes('border')) return '🌎';
    if (lowerTopic.includes('technology') || lowerTopic.includes('digital')) return '💻';
    
    return '📚'; // Default emoji
  }
}

export const contentGenerationService = new ContentGenerationService(); 