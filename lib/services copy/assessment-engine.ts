import { supabase } from '../supabase';
import { standardDataService, type StandardQuestion, type StandardResponse, type DataError } from '../standardized-data-service';
import type { DbAssessmentQuestions } from '../database-types';
import { assessmentProgressHandler } from '../assessment-progress-handler';

// Assessment-specific types
export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  friendly_explanation?: string;
  category: string;
  difficulty: number;
  skill_id?: string;
}

export interface AssessmentSession {
  id: string;
  user_id: string;
  assessment_type: 'civics_test' | 'skill_assessment' | 'placement_test';
  questions: AssessmentQuestion[];
  current_question_index: number;
  answers: Record<string, string>;
  started_at: Date;
  completed_at?: Date;
  score?: number;
  category_scores?: Record<string, number>;
}

export interface AssessmentResult {
  session_id: string;
  total_score: number;
  percentage: number;
  category_breakdown: Record<string, {
    correct: number;
    total: number;
    percentage: number;
  }>;
  passed: boolean;
  passing_threshold: number;
  recommendations: string[];
}

export class AssessmentEngine {
  private static readonly CIVICS_TEST_PASSING_SCORE = 70; // 70% to pass
  private static readonly DEFAULT_QUESTION_LIMIT = 50;

  /**
   * Load assessment questions for civics test
   */
  static async loadCivicsTestQuestions(options: {
    limit?: number;
    randomize?: boolean;
    categories?: string[];
  } = {}): Promise<StandardResponse<AssessmentQuestion[]>> {
    const { limit = this.DEFAULT_QUESTION_LIMIT, randomize = true, categories } = options;

    try {
      console.log(`🏛️ Loading civics assessment questions (limit: ${limit}, randomize: ${randomize})`);

      let query = supabase
        .from('user_assessment_questions')
        .select('*')
        .eq('is_active', true);

      // Filter by categories if specified
      if (categories && categories.length > 0) {
        query = query.in('category', categories);
      }

      // Apply limit
      query = query.limit(limit);

      const { data: assessmentQuestions, error } = await query;

      if (error) {
        console.error('❌ Error fetching assessment questions:', error);
        return {
          data: [],
          error: {
            code: 'ASSESSMENT_FETCH_ERROR',
            message: `Failed to load assessment questions: ${error.message}`,
            details: error,
            retryable: true
          },
          metadata: { count: 0, timestamp: Date.now() }
        };
      }

      if (!assessmentQuestions || assessmentQuestions.length === 0) {
        console.warn('⚠️ No assessment questions found');
        return {
          data: [],
          error: {
            code: 'NO_QUESTIONS_FOUND',
            message: 'No assessment questions found',
            retryable: false
          },
          metadata: { count: 0, timestamp: Date.now() }
        };
      }

      // Convert to AssessmentQuestion format
      let questions: AssessmentQuestion[] = assessmentQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer,
        explanation: q.explanation || undefined,
        friendly_explanation: q.friendly_explanation || undefined,
        category: q.category,
        difficulty: q.difficulty,
        skill_id: q.skill_id || undefined,
      }));

      // Randomize if requested
      if (randomize) {
        questions = this.shuffleArray(questions);
      }

      console.log(`✅ Loaded ${questions.length} assessment questions`);

      return {
        data: questions,
        error: null,
        metadata: { 
          count: questions.length, 
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('❌ Error in loadCivicsTestQuestions:', error);
      return {
        data: [],
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Failed to load assessment questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          retryable: true
        },
        metadata: { count: 0, timestamp: Date.now() }
      };
    }
  }

  /**
   * Create a new assessment session
   */
  static async createAssessmentSession(
    userId: string,
    assessmentType: 'civics_test' | 'skill_assessment' | 'placement_test',
    questions: AssessmentQuestion[]
  ): Promise<StandardResponse<AssessmentSession>> {
    try {
      const sessionId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Use the offline-compatible assessment handler
      const result = await assessmentProgressHandler.createAssessmentSession({
        user_id: userId,
        session_id: sessionId,
        session_type: assessmentType === 'civics_test' ? 'civics_test' : 'assessment',
        assessment_type: assessmentType,
        test_type: assessmentType,
        questions: questions,
        metadata: {
          assessment_type: assessmentType,
          started_at: new Date().toISOString(),
        }
      });

      if (result.error) {
        console.error('❌ Error creating assessment session:', result.error);
        return {
          data: null,
          error: {
            code: 'SESSION_CREATE_ERROR',
            message: result.error.message || 'Failed to create assessment session',
            details: result.error,
            retryable: true
          },
          metadata: { timestamp: Date.now() }
        };
      }

      // Convert to AssessmentSession format
      const session: AssessmentSession = {
        id: sessionId,
        user_id: userId,
        assessment_type: assessmentType,
        questions,
        current_question_index: 0,
        answers: {},
        started_at: new Date(),
      };

      console.log(`✅ Created assessment session: ${session.id}`);
      return {
        data: session,
        error: null,
        metadata: { timestamp: Date.now() }
      };
    } catch (error) {
      console.error('❌ Error in createAssessmentSession:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Failed to create assessment session: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          retryable: true
        },
        metadata: { timestamp: Date.now() }
      };
    }
  }

  /**
   * Submit an answer for the current question
   */
  static async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string
  ): Promise<StandardResponse<boolean>> {
    try {
      // Simple update approach - get current answers, add new one, update
      const { data: currentSession } = await supabase
        .from('progress_sessions')
        .select('answers')
        .eq('session_id', sessionId)
        .single();

      const currentAnswers = (currentSession?.answers as Record<string, string>) || {};
      const updatedAnswers = { ...currentAnswers, [questionId]: answer };

      const { error } = await supabase
        .from('progress_sessions')
        .update({
          answers: updatedAnswers,
          last_updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('❌ Error submitting answer:', error);
        return {
          data: false,
          error: {
            code: 'ANSWER_SUBMIT_ERROR',
            message: `Failed to submit answer: ${error.message}`,
            details: error,
            retryable: true
          },
          metadata: { timestamp: Date.now() }
        };
      }

      return {
        data: true,
        error: null,
        metadata: { timestamp: Date.now() }
      };
    } catch (error) {
      console.error('❌ Error in submitAnswer:', error);
      return {
        data: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Failed to submit answer: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          retryable: true
        },
        metadata: { timestamp: Date.now() }
      };
    }
  }

  /**
   * Calculate assessment results
   */
  static calculateResults(
    questions: AssessmentQuestion[],
    answers: Record<string, string>
  ): AssessmentResult {
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    let totalCorrect = 0;

    // Calculate scores by category
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) {
        totalCorrect++;
      }

      // Track by category - fix the undefined issue
      if (!categoryStats[question.category]) {
        categoryStats[question.category] = { correct: 0, total: 0 };
      }
      
      // Now we know it exists, so we can safely access it
      const categoryData = categoryStats[question.category]!;
      categoryData.total++;
      if (isCorrect) {
        categoryData.correct++;
      }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const passed = percentage >= this.CIVICS_TEST_PASSING_SCORE;

    // Convert category stats to breakdown format
    const category_breakdown: Record<string, { correct: number; total: number; percentage: number }> = {};
    Object.entries(categoryStats).forEach(([category, stats]) => {
      category_breakdown[category] = {
        correct: stats.correct,
        total: stats.total,
        percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      };
    });

    // Generate recommendations based on weak areas
    const recommendations: string[] = [];
    Object.entries(category_breakdown).forEach(([category, stats]) => {
      if (stats.percentage < 70) {
        recommendations.push(`Study more about ${category} - you scored ${stats.percentage}%`);
      }
    });

    if (recommendations.length === 0 && passed) {
      recommendations.push('Excellent work! You have a strong understanding of civics.');
    } else if (!passed) {
      recommendations.push(`You need ${this.CIVICS_TEST_PASSING_SCORE}% to pass. Focus on your weak areas and try again.`);
    }

    return {
      session_id: `assessment_${Date.now()}`,
      total_score: totalCorrect,
      percentage,
      category_breakdown,
      passed,
      passing_threshold: this.CIVICS_TEST_PASSING_SCORE,
      recommendations
    };
  }

  /**
   * Complete an assessment session
   */
  static async completeAssessment(
    sessionId: string,
    questions: AssessmentQuestion[],
    answers: Record<string, string>
  ): Promise<StandardResponse<AssessmentResult>> {
    try {
      const results = this.calculateResults(questions, answers);

      // Update the session as completed
      const { error } = await supabase
        .from('progress_sessions')
        .update({
          answers: answers,
          current_question_index: questions.length,
          last_updated_at: new Date().toISOString(),
          metadata: {
            completed: true,
            results: results,
            completed_at: new Date().toISOString()
          }
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('❌ Error completing assessment:', error);
        // Still return results even if DB update fails
      }

      // Track completion analytics
      try {
        await supabase
          .from('assessment_analytics')
          .insert({
            session_id: sessionId,
            event_type: 'assessment_completed',
            final_score: results.percentage,
            metadata: {
              category_breakdown: results.category_breakdown,
              passed: results.passed,
              total_questions: questions.length
            }
          });
      } catch (analyticsError) {
        console.warn('❌ Failed to track assessment analytics:', analyticsError);
        // Don't fail the whole operation for analytics
      }

      console.log(`✅ Assessment completed: ${results.percentage}% (${results.passed ? 'PASSED' : 'FAILED'})`);

      return {
        data: results,
        error: null,
        metadata: { 
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('❌ Error in completeAssessment:', error);
      return {
        data: null,
        error: {
          code: 'ASSESSMENT_COMPLETE_ERROR',
          message: `Failed to complete assessment: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          retryable: true
        },
        metadata: { timestamp: Date.now() }
      };
    }
  }

  /**
   * Convert assessment questions to standard quiz format for compatibility
   */
  static convertToStandardQuestions(assessmentQuestions: AssessmentQuestion[]): StandardQuestion[] {
    return assessmentQuestions.map((q, index) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || q.friendly_explanation || '',
      topic_id: 'civics-comprehensive-test',
      difficulty_level: q.difficulty,
      is_active: true,
      sources: [],
      question_number: index + 1,
    }));
  }

  /**
   * Utility function to shuffle array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Use non-null assertion since we know the indices are valid
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }
    return shuffled;
  }
} 