import { supabase } from '../supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface QuestionResponseData {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  difficultyLevel?: number;
  
  // Context information
  assessmentType?: 'quiz' | 'practice' | 'civics_test' | 'daily_challenge';
  collectionId?: string;
  topicId?: string;
  skillIds?: string[];
  attemptId?: string; // For linking to quiz attempts
  
  // Optional feedback
  feedback?: {
    clarityRating?: number; // 1-5 scale
    feedbackType?: 'unclear' | 'biased' | 'outdated' | 'incorrect' | 'excellent';
    feedbackText?: string;
  };
  
  // Spaced repetition context
  wasReview?: boolean;
  confidenceLevel?: number; // 1-5 scale (how confident user felt)
}

export interface QuestionResponseResult {
  success: boolean;
  masteryLevel: number;
  nextReviewDate: Date;
  successfulOperations: number;
  totalOperations: number;
  error?: string;
}

// ============================================================================
// SPACED REPETITION ALGORITHM
// ============================================================================

export class SpacedRepetitionAlgorithm {
  static calculateNextReview(
    isCorrect: boolean,
    previousInterval: number,
    easeFactor: number,
    consecutiveCorrect: number,
    confidence: number
  ) {
    let newEaseFactor = easeFactor;
    let nextInterval = previousInterval;

    if (isCorrect) {
      // Successful review
      if (consecutiveCorrect === 0) {
        nextInterval = 1; // First correct answer
      } else if (consecutiveCorrect === 1) {
        nextInterval = 6; // Second correct answer
      } else {
        nextInterval = Math.round(previousInterval * newEaseFactor);
      }

      // Adjust ease factor based on confidence
      const confidenceAdjustment = (confidence - 3) * 0.1; // -0.2 to +0.2
      newEaseFactor = Math.max(1.3, newEaseFactor + confidenceAdjustment);
    } else {
      // Failed review
      nextInterval = 1; // Reset interval
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    return { nextInterval, newEaseFactor, nextReviewDate };
  }

  static calculateMasteryLevel(
    consecutiveCorrect: number,
    totalAttempts: number,
    averageResponseTime: number
  ): number {
    const accuracyWeight = 0.6;
    const consistencyWeight = 0.3;
    const speedWeight = 0.1;

    // Accuracy component (0-100)
    const accuracy = totalAttempts > 0 ? (consecutiveCorrect / totalAttempts) * 100 : 0;

    // Consistency component (based on consecutive correct answers)
    const consistency = Math.min(100, (consecutiveCorrect / 5) * 100);

    // Speed component (faster = better, but capped)
    const targetTime = 15000; // 15 seconds ideal
    const speed = Math.max(0, Math.min(100, 100 - ((averageResponseTime - targetTime) / targetTime) * 50));

    return Math.round(
      accuracy * accuracyWeight +
      consistency * consistencyWeight +
      speed * speedWeight
    );
  }
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class QuestionResponseService {
  /**
   * Main entry point - records user question response using optimized database functions
   */
  static async recordQuestionResponse(
    userId: string,
    responseData: QuestionResponseData
  ): Promise<QuestionResponseResult> {
    try {
      console.log('📝 Recording question response:', {
        userId,
        questionId: responseData.questionId,
        isCorrect: responseData.isCorrect,
        assessmentType: responseData.assessmentType
      });

      // Use the new RPC functions with proper error handling
      const [responseResult, memoryResult] = await Promise.allSettled([
        this.insertQuestionResponseOptimized(userId, responseData),
        this.updateQuestionMemoryOptimized(userId, responseData),
      ]);

      // Check results and calculate success metrics
      const successfulOperations = [responseResult, memoryResult].filter(r => r.status === 'fulfilled').length;
      const totalOperations = 2;

      // Extract memory results if available
      let nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow default
      let masteryLevel = 50;

      if (memoryResult.status === 'fulfilled' && memoryResult.value) {
        nextReviewDate = memoryResult.value.nextReviewDate;
        masteryLevel = memoryResult.value.masteryLevel;
      } else if (memoryResult.status === 'rejected') {
        console.warn('⚠️ Memory update failed:', memoryResult.reason);
      }

      if (responseResult.status === 'rejected') {
        console.warn('⚠️ Response recording failed:', responseResult.reason);
      }

      // Log completion status
      console.log('✅ Question response processing complete:', {
        successfulOperations,
        totalOperations,
        masteryLevel,
        nextReviewDate
      });

      return {
        success: successfulOperations > 0, // Success if at least one operation worked
        masteryLevel,
        nextReviewDate,
        successfulOperations,
        totalOperations
      };

    } catch (error) {
      console.error('❌ Critical error in recordQuestionResponse:', error);
      return {
        success: false,
        masteryLevel: 0,
        nextReviewDate: new Date(),
        successfulOperations: 0,
        totalOperations: 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Optimized question response insertion using RPC function with fallback
   */
  private static async insertQuestionResponseOptimized(
    userId: string,
    responseData: QuestionResponseData
  ) {
    try {
      // Try to use the optimized RPC function first
      const { data, error } = await supabase.rpc('upsert_user_question_response', {
        p_user_id: userId,
        p_question_id: responseData.questionId,
        p_selected_answer: responseData.selectedAnswer,
        p_is_correct: responseData.isCorrect,
        p_response_time_ms: responseData.responseTimeMs,
        p_assessment_type: responseData.assessmentType || 'practice',
        p_attempt_id: responseData.attemptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(responseData.attemptId)
          ? responseData.attemptId
          : null,
        p_topic_id: responseData.topicId,
        p_confidence_level: responseData.confidenceLevel || 3
      });

      if (error) {
        console.warn('⚠️ RPC function failed, trying direct insert:', error.message);
        return await this.insertQuestionResponseDirect(userId, responseData);
      }

      console.log('✅ Question response inserted via RPC function');
      return data;
    } catch (error) {
      console.warn('⚠️ RPC approach failed, falling back to direct insert:', error);
      return await this.insertQuestionResponseDirect(userId, responseData);
    }
  }

  /**
   * Direct insert fallback - works with existing schema
   */
  private static async insertQuestionResponseDirect(
    userId: string,
    responseData: QuestionResponseData
  ) {
    try {
      // Build comprehensive record using all available schema columns
      const fullRecord: any = {
        // Core required fields (original schema)
        question_id: responseData.questionId,
        user_answer: responseData.selectedAnswer,
        is_correct: responseData.isCorrect,
        time_spent_seconds: Math.round(responseData.responseTimeMs / 1000),
        hint_used: false,
        created_at: new Date().toISOString(),
        
        // Enhanced fields (new schema from migration)
        user_id: userId,
        selected_answer: responseData.selectedAnswer,
        response_time_ms: responseData.responseTimeMs,
        assessment_type: responseData.assessmentType || 'practice',
        topic_id: responseData.topicId,
        confidence_level: responseData.confidenceLevel || 3,
        was_review: responseData.wasReview || false,
        updated_at: new Date().toISOString()
      };

      // Only include attempt_id if it's a valid UUID - otherwise let Supabase auto-generate the primary key
      if (responseData.attemptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(responseData.attemptId)) {
        fullRecord.attempt_id = responseData.attemptId;
      }

      const { error } = await supabase
        .from('user_question_responses')
        .insert(fullRecord);

      if (error) {
        // If the enhanced insert fails due to missing columns, try base insert
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.warn('⚠️ Enhanced schema not fully available, using base fields only');
          
          const baseRecord: any = {
            question_id: responseData.questionId,
            user_answer: responseData.selectedAnswer,
            is_correct: responseData.isCorrect,
            time_spent_seconds: Math.round(responseData.responseTimeMs / 1000),
            hint_used: false,
            created_at: new Date().toISOString()
          };

          // Only include attempt_id if it's a valid UUID - otherwise let Supabase auto-generate the primary key
          if (responseData.attemptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(responseData.attemptId)) {
            baseRecord.attempt_id = responseData.attemptId;
          }
          
          const { error: baseError } = await supabase
            .from('user_question_responses')
            .insert(baseRecord);
          
          if (baseError) {
            throw new Error(`Failed to insert question response: ${baseError.message}`);
          }
        } else {
          throw new Error(`Failed to insert question response: ${error.message}`);
        }
      }

      console.log('✅ Question response inserted successfully');
    } catch (error) {
      console.error('❌ Error inserting question response:', error);
      throw error;
    }
  }

  /**
   * Optimized memory update using RPC function with fallback
   */
  private static async updateQuestionMemoryOptimized(
    userId: string,
    responseData: QuestionResponseData
  ): Promise<{ nextReviewDate: Date; masteryLevel: number }> {
    try {
      // Try to use the optimized RPC function first
      const { data, error } = await supabase.rpc('upsert_user_question_memory', {
        p_user_id: userId,
        p_question_id: responseData.questionId,
        p_is_correct: responseData.isCorrect,
        p_response_time_ms: responseData.responseTimeMs,
        p_confidence_level: responseData.confidenceLevel || 3
      });

      if (error) {
        console.warn('⚠️ Memory RPC function failed, trying direct approach:', error.message);
        return await this.updateQuestionMemoryDirect(userId, responseData);
      }

      if (data) {
        return {
          nextReviewDate: new Date(data.next_review_date),
          masteryLevel: data.mastery_level || 50
        };
      }

      // Fallback if no data returned
      return {
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        masteryLevel: 50
      };
    } catch (error) {
      console.warn('⚠️ Memory RPC approach failed, using direct method:', error);
      return await this.updateQuestionMemoryDirect(userId, responseData);
    }
  }

  /**
   * Direct memory update - works with existing schema
   */
  private static async updateQuestionMemoryDirect(
    userId: string,
    responseData: QuestionResponseData
  ): Promise<{ nextReviewDate: Date; masteryLevel: number }> {
    try {
      // Get current memory state
      const { data: currentMemory, error: selectError } = await supabase
        .from('user_question_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('question_id', responseData.questionId)
        .maybeSingle();

      if (selectError) {
        console.warn('⚠️ Memory table access failed:', selectError.message);
        return {
          nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          masteryLevel: 50
        };
      }

      // Use both old and new schema columns with proper fallbacks
      const previousInterval = currentMemory?.interval_days || currentMemory?.review_interval || 1;
      const easeFactor = currentMemory?.easiness_factor || currentMemory?.ease_factor || 2.5;
      const consecutiveCorrect = responseData.isCorrect 
        ? (currentMemory?.consecutive_correct || 0) + 1 
        : 0;
      const totalAttempts = (currentMemory?.total_attempts || 0) + 1;

      // Calculate next review
      const { nextInterval, newEaseFactor, nextReviewDate } = SpacedRepetitionAlgorithm.calculateNextReview(
        responseData.isCorrect,
        previousInterval,
        easeFactor,
        consecutiveCorrect,
        responseData.confidenceLevel || 3
      );

      // Calculate mastery level
      const masteryLevel = SpacedRepetitionAlgorithm.calculateMasteryLevel(
        consecutiveCorrect,
        totalAttempts,
        responseData.responseTimeMs
      );

      // Build comprehensive memory record using all available schema columns
      const fullMemoryRecord = {
        user_id: userId,
        question_id: responseData.questionId,
        consecutive_correct: consecutiveCorrect,
        total_attempts: totalAttempts,
        last_reviewed_at: new Date().toISOString(),
        next_review_date: nextReviewDate.toISOString(),
        repetition_count: (currentMemory?.repetition_count || 0) + 1,
        
        // Old schema columns
        interval_days: nextInterval,
        easiness_factor: newEaseFactor,
        
        // New schema columns (from migration)
        review_interval: nextInterval,
        ease_factor: newEaseFactor,
        mastery_level: masteryLevel,
        average_response_time: responseData.responseTimeMs,
        last_confidence_level: responseData.confidenceLevel || 3,
        last_attempt_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try comprehensive upsert first
      const { error: upsertError } = await supabase
        .from('user_question_memory')
        .upsert(fullMemoryRecord, {
          onConflict: 'user_id,question_id'
        });

      if (upsertError) {
        // Fallback to base schema if enhanced fails
        if (upsertError.message.includes('column') && upsertError.message.includes('does not exist')) {
          console.warn('⚠️ Enhanced memory schema not fully available, using base fields only');
          
          const baseMemoryRecord = {
            user_id: userId,
            question_id: responseData.questionId,
            consecutive_correct: consecutiveCorrect,
            total_attempts: totalAttempts,
            last_reviewed_at: new Date().toISOString(),
            next_review_date: nextReviewDate.toISOString(),
            interval_days: nextInterval,
            easiness_factor: newEaseFactor,
            repetition_count: (currentMemory?.repetition_count || 0) + 1
          };
          
          const { error: baseError } = await supabase
            .from('user_question_memory')
            .upsert(baseMemoryRecord, {
              onConflict: 'user_id,question_id'
            });
          
          if (baseError) {
            console.error('❌ Memory update failed even with base schema:', baseError);
          }
        } else {
          console.error('❌ Memory update failed:', upsertError);
        }
      } else {
        console.log('✅ Question memory updated successfully');
      }

      return { nextReviewDate, masteryLevel };

    } catch (error) {
      console.error('❌ Error in updateQuestionMemoryDirect:', error);
      return {
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        masteryLevel: 50
      };
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper function for React components to record question responses
 */
export const useQuestionResponse = () => {
  const recordResponse = async (
    userId: string,
    responseData: QuestionResponseData
  ): Promise<QuestionResponseResult> => {
    return await QuestionResponseService.recordQuestionResponse(userId, responseData);
  };

  return {
    recordResponse
  };
};

export default QuestionResponseService; 