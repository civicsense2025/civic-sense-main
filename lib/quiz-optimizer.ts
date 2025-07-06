/**
 * Lightweight Quiz Optimization Utility
 * 
 * Uses GPT-4o with web search to optimize civic education quiz content
 * with the latest information, improved clarity, and better sources.
 */

interface OptimizationProgress {
  phase: string;
  message: string;
  progress: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  sources?: string[];
  difficulty?: string;
}

interface QuizOptimizationResult {
  questions: QuizQuestion[];
  suggestions: string[];
  improvements: {
    factualUpdates: number;
    clarityImprovements: number;
    sourceEnhancements: number;
  };
}

export class QuizOptimizer {
  private static async searchWeb(query: string): Promise<string[]> {
    try {
      // Use Serper.dev for lightweight web search
      const response = await fetch('https://api.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.EXPO_PUBLIC_SERPER_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: 5,
          type: 'search',
        }),
      });

      if (!response.ok) {
        console.warn('Web search failed, continuing without recent data');
        return [];
      }

      const data = await response.json();
      return data.organic?.map((result: any) => 
        `${result.title}: ${result.snippet}`
      ).slice(0, 3) || [];
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  static async optimizeQuiz(
    topic: string,
    questions: QuizQuestion[],
    onProgress?: (progress: OptimizationProgress) => void
  ): Promise<QuizOptimizationResult> {
    
    onProgress?.({ 
      phase: 'research', 
      message: 'Searching for latest information...', 
      progress: 10 
    });

    // Search for recent information
    const searchResults = await this.searchWeb(
      `${topic} 2024 latest news facts civic government policy`
    );
    
    onProgress?.({ 
      phase: 'analyze', 
      message: 'Analyzing current content...', 
      progress: 30 
    });

    // Prepare concise optimization prompt
    const prompt = this.buildOptimizationPrompt(topic, questions, searchResults);
    
    onProgress?.({ 
      phase: 'optimize', 
      message: 'Optimizing with GPT-4o...', 
      progress: 60 
    });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a civic education expert. Return only valid JSON that exactly matches the requested format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      onProgress?.({ 
        phase: 'finalize', 
        message: 'Processing results...', 
        progress: 90 
      });

      const result = JSON.parse(content) as QuizOptimizationResult;
      
      // Ensure all questions have valid IDs
      result.questions = result.questions.map((q, index) => ({
        ...q,
        id: q.id || `optimized_${Date.now()}_${index}`,
      }));

      onProgress?.({ 
        phase: 'complete', 
        message: 'Optimization complete!', 
        progress: 100 
      });

      return result;

    } catch (error) {
      console.error('Optimization error:', error);
      throw new Error(
        error instanceof Error 
          ? `Optimization failed: ${error.message}` 
          : 'Optimization failed. Please try again.'
      );
    }
  }

  private static buildOptimizationPrompt(
    topic: string, 
    questions: QuizQuestion[], 
    searchResults: string[]
  ): string {
    return `
Optimize this civic education quiz with the latest information:

TOPIC: ${topic}

CURRENT QUESTIONS:
${JSON.stringify(questions, null, 2)}

RECENT WEB SEARCH RESULTS:
${searchResults.join('\n\n')}

OPTIMIZATION GOALS:
1. Update facts with 2024 information
2. Improve question clarity and civic relevance  
3. Add current examples and recent events
4. Enhance explanations with credible sources
5. Maintain appropriate difficulty

Return optimized content in this EXACT JSON format:
{
  "questions": [
    {
      "id": "string",
      "question": "clear, specific question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correct_answer": 0,
      "explanation": "detailed explanation with context",
      "sources": ["credible source 1", "credible source 2"],
      "difficulty": "easy|medium|hard"
    }
  ],
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"],
  "improvements": {
    "factualUpdates": 0,
    "clarityImprovements": 0, 
    "sourceEnhancements": 0
  }
}

IMPORTANT: Return ONLY the JSON, no other text.
`;
  }

  /**
   * Quick validation of quiz content quality
   */
  static validateQuiz(questions: QuizQuestion[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (questions.length === 0) {
      issues.push('No questions found');
      return { isValid: false, issues, suggestions };
    }

    questions.forEach((q, index) => {
      if (!q.question?.trim()) {
        issues.push(`Question ${index + 1}: Missing question text`);
      }
      
      if (!q.options || q.options.length !== 4) {
        issues.push(`Question ${index + 1}: Must have exactly 4 options`);
      }
      
      if (q.correct_answer < 0 || q.correct_answer > 3) {
        issues.push(`Question ${index + 1}: Invalid correct answer index`);
      }
      
      if (!q.explanation?.trim()) {
        suggestions.push(`Question ${index + 1}: Add explanation for better learning`);
      }
      
      if (!q.sources || q.sources.length === 0) {
        suggestions.push(`Question ${index + 1}: Add credible sources`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}

/**
 * Utility functions for quiz management
 */
export const QuizUtils = {
  /**
   * Generate quiz statistics
   */
  getStats(questions: QuizQuestion[]) {
    const difficulties = questions.map(q => q.difficulty).filter(Boolean);
    const withSources = questions.filter(q => q.sources && q.sources.length > 0);
    const withExplanations = questions.filter(q => q.explanation?.trim());

    return {
      totalQuestions: questions.length,
      difficulties: {
        easy: difficulties.filter(d => d === 'easy').length,
        medium: difficulties.filter(d => d === 'medium').length,
        hard: difficulties.filter(d => d === 'hard').length,
      },
      completeness: {
        withSources: withSources.length,
        withExplanations: withExplanations.length,
        sourcesPercentage: Math.round((withSources.length / questions.length) * 100),
        explanationsPercentage: Math.round((withExplanations.length / questions.length) * 100),
      },
    };
  },

  /**
   * Check if optimization is recommended
   */
  shouldOptimize(questions: QuizQuestion[], createdAt: string): {
    recommended: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const stats = this.getStats(questions);
    const age = Date.now() - new Date(createdAt).getTime();
    const daysSinceCreated = Math.floor(age / (1000 * 60 * 60 * 24));

    if (daysSinceCreated > 30) {
      reasons.push('Quiz is over 30 days old - may need fact updates');
    }

    if (stats.completeness.sourcesPercentage < 50) {
      reasons.push('Less than 50% of questions have sources');
    }

    if (stats.completeness.explanationsPercentage < 70) {
      reasons.push('Less than 70% of questions have explanations');
    }

    if (questions.length < 5) {
      reasons.push('Quiz has fewer than 5 questions');
    }

    return {
      recommended: reasons.length > 0,
      reasons,
    };
  },
}; 