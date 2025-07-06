import { supabase } from '../supabase';
import { EnhancedAssessmentProgressStorage } from '../enhanced-progress-storage';

export interface AssessmentCleanupOptions {
  userId: string;
  assessmentType?: 'civics_test' | 'skill_assessment' | 'placement_test';
  sessionId?: string; // Optional - if we want to keep a specific session
}

export class AssessmentCleanupService {
  /**
   * Clean up all user assessment data for a fresh start
   * This includes attempts, analytics, engagement, and local progress
   */
  static async cleanupUserAssessmentData(options: AssessmentCleanupOptions): Promise<{
    success: boolean;
    error?: string;
    cleanedTables: string[];
  }> {
    const { userId, assessmentType, sessionId } = options;
    const cleanedTables: string[] = [];

    try {
      console.log(`🧹 Starting assessment cleanup for user: ${userId}`);

      // Build base query conditions
      let baseConditions: any = { user_id: userId };
      
      // Filter by assessment type if specified
      if (assessmentType) {
        baseConditions = { ...baseConditions, assessment_type: assessmentType };
      }

      // 1. Clean up user_assessment_attempts
      try {
        let attemptQuery = supabase
          .from('user_assessment_attempts')
          .delete()
          .eq('user_id', userId);

        if (assessmentType) {
          attemptQuery = attemptQuery.eq('assessment_type', assessmentType);
        }

        // Keep the current session if specified
        if (sessionId) {
          attemptQuery = attemptQuery.neq('session_id', sessionId);
        }

        const { error: attemptsError } = await attemptQuery;
        
        if (attemptsError) {
          console.warn('⚠️ Failed to clean user_assessment_attempts:', attemptsError);
        } else {
          cleanedTables.push('user_assessment_attempts');
          console.log('✅ Cleaned user_assessment_attempts');
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning user_assessment_attempts:', error);
      }

      // 2. Clean up user_assessment_analytics
      try {
        let analyticsQuery = supabase
          .from('user_assessment_analytics')
          .delete()
          .eq('user_id', userId);

        if (sessionId) {
          analyticsQuery = analyticsQuery.neq('session_id', sessionId);
        }

        const { error: analyticsError } = await analyticsQuery;
        
        if (analyticsError) {
          console.warn('⚠️ Failed to clean user_assessment_analytics:', analyticsError);
        } else {
          cleanedTables.push('user_assessment_analytics');
          console.log('✅ Cleaned user_assessment_analytics');
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning user_assessment_analytics:', error);
      }

      // 3. Clean up user_assessment_engagement
      try {
        let engagementQuery = supabase
          .from('user_assessment_engagement')
          .delete()
          .eq('user_id', userId);

        if (sessionId) {
          engagementQuery = engagementQuery.neq('session_id', sessionId);
        }

        const { error: engagementError } = await engagementQuery;
        
        if (engagementError) {
          console.warn('⚠️ Failed to clean user_assessment_engagement:', engagementError);
        } else {
          cleanedTables.push('user_assessment_engagement');
          console.log('✅ Cleaned user_assessment_engagement');
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning user_assessment_engagement:', error);
      }

      // 4. Clean up local progress storage
      try {
        const incompleteAssessments = await EnhancedAssessmentProgressStorage.getIncompleteAssessments(userId);
        
        for (const assessment of incompleteAssessments) {
          // Skip the current session if specified
          if (sessionId && assessment.sessionId === sessionId) {
            continue;
          }

          // Filter by assessment type if specified
          if (assessmentType && assessment.assessmentType !== assessmentType) {
            continue;
          }

          await EnhancedAssessmentProgressStorage.clearProgress(assessment.sessionId, 'abandoned');
        }

        cleanedTables.push('local_progress_storage');
        console.log('✅ Cleaned local progress storage');
      } catch (error) {
        console.warn('⚠️ Error cleaning local progress storage:', error);
      }

      // 5. Clean up progress_sessions table (if exists)
      try {
        let progressQuery = supabase
          .from('progress_sessions')
          .delete()
          .eq('user_id', userId)
          .in('session_type', ['assessment', 'civics_test']);

        if (sessionId) {
          progressQuery = progressQuery.neq('session_id', sessionId);
        }

        const { error: progressError } = await progressQuery;
        
        if (progressError) {
          console.warn('⚠️ Failed to clean progress_sessions:', progressError);
        } else {
          cleanedTables.push('progress_sessions');
          console.log('✅ Cleaned progress_sessions');
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning progress_sessions:', error);
      }

      console.log(`🎯 Assessment cleanup completed. Cleaned tables: ${cleanedTables.join(', ')}`);

      return {
        success: true,
        cleanedTables
      };

    } catch (error) {
      console.error('❌ Critical error during assessment cleanup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown cleanup error',
        cleanedTables
      };
    }
  }

  /**
   * Clean up only civics test data specifically
   */
  static async cleanupCivicsTestData(userId: string, keepSessionId?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const cleanupOptions: AssessmentCleanupOptions = {
      userId,
      assessmentType: 'civics_test',
      ...(keepSessionId && { sessionId: keepSessionId })
    };

    const result = await this.cleanupUserAssessmentData(cleanupOptions);

    return {
      success: result.success,
      ...(result.error && { error: result.error })
    };
  }

  /**
   * Verify cleanup was successful
   */
  static async verifyCleanup(userId: string, assessmentType?: string): Promise<{
    remainingAttempts: number;
    remainingAnalytics: number;
    remainingEngagement: number;
    remainingProgress: number;
  }> {
    try {
      // Count remaining records
      const results = await Promise.allSettled([
        // Count user_assessment_attempts
        supabase
          .from('user_assessment_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('assessment_type', assessmentType || 'civics_test'),

        // Count user_assessment_analytics  
        supabase
          .from('user_assessment_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),

        // Count user_assessment_engagement
        supabase
          .from('user_assessment_engagement')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),

        // Count progress_sessions
        supabase
          .from('progress_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('session_type', ['assessment', 'civics_test'])
      ]);

      return {
        remainingAttempts: results[0].status === 'fulfilled' ? (results[0].value.count || 0) : 0,
        remainingAnalytics: results[1].status === 'fulfilled' ? (results[1].value.count || 0) : 0,
        remainingEngagement: results[2].status === 'fulfilled' ? (results[2].value.count || 0) : 0,
        remainingProgress: results[3].status === 'fulfilled' ? (results[3].value.count || 0) : 0,
      };
    } catch (error) {
      console.error('❌ Error verifying cleanup:', error);
      return {
        remainingAttempts: -1,
        remainingAnalytics: -1, 
        remainingEngagement: -1,
        remainingProgress: -1,
      };
    }
  }
} 