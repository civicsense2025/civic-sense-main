import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { offlineSessionManager } from './offline/offline-session-manager';
import { GuestLimitService } from './services/guest-limit-service';

// ============================================================================
// TYPES
// ============================================================================

export interface AssessmentProgressSession {
  id: string;
  session_id: string;
  session_type: 'assessment' | 'civics_test' | 'challenge';
  user_id?: string | null;
  guest_token?: string | null;
  
  // For assessments/civics tests, topic_id is optional
  topic_id?: string | null;
  assessment_type?: string;
  test_type?: string;
  
  questions: any[];
  answers: Record<string, any>;
  current_question_index: number;
  
  started_at: string;
  last_updated_at: string;
  expires_at: string;
  
  response_times: Record<string, number>;
  streak: number;
  max_streak: number;
  category_performance?: Record<string, any>;
  
  metadata?: any;
}

// ============================================================================
// ASSESSMENT PROGRESS HANDLER
// ============================================================================

export class AssessmentProgressHandler {
  private static instance: AssessmentProgressHandler;
  
  static getInstance(): AssessmentProgressHandler {
    if (!this.instance) {
      this.instance = new AssessmentProgressHandler();
    }
    return this.instance;
  }

  // ============================================================================
  // CREATE ASSESSMENT SESSION (BYPASS FK CONSTRAINTS)
  // ============================================================================

  async createAssessmentSession(params: {
    user_id?: string;
    guest_token?: string;
    session_id: string;
    session_type: 'assessment' | 'civics_test' | 'challenge';
    assessment_type?: string;
    test_type?: string;
    questions: any[];
    metadata?: any;
  }): Promise<{ data: any; error: any }> {
    console.log('🎯 Creating assessment session:', {
      sessionType: params.session_type,
      userId: params.user_id ? 'authenticated' : 'guest',
      assessmentType: params.assessment_type,
    });

    // ============================================================================
    // GUEST LIMIT ENFORCEMENT FOR ASSESSMENTS
    // ============================================================================
    
    // If this is a guest user, check limits before proceeding
    if (!params.user_id && params.guest_token) {
      console.log('🔒 Checking guest limits for assessment session...');
      
      try {
        // Map assessment type to limit category
        const sessionType = this.mapAssessmentTypeForLimits(params.session_type, params.assessment_type);
        const gameMode = params.metadata?.game_mode;
        
        // Check if guest can start this assessment
        const limitCheck = await GuestLimitService.canStartQuiz(
          params.guest_token,
          sessionType,
          gameMode
        );
        
        if (!limitCheck.allowed) {
          console.warn('❌ Guest assessment limit exceeded:', limitCheck.reason);
          
          // Return a structured error
          return {
            data: null,
            error: {
              code: 'GUEST_LIMIT_EXCEEDED',
              message: limitCheck.upgradeMessage || 'Daily assessment limit reached for guest users',
              details: {
                reason: limitCheck.reason,
                attemptsRemaining: limitCheck.attemptsRemaining,
                resetTime: limitCheck.resetTime,
                upgradeMessage: limitCheck.upgradeMessage,
                sessionType: params.session_type,
              }
            }
          };
        }
        
        // Check if we should show a warning (at warning threshold)
        if (limitCheck.attemptsRemaining === 1 && limitCheck.upgradeMessage) {
          console.log('⚠️ Guest at assessment warning threshold');
          // Store warning flag for post-assessment display
          params.metadata = {
            ...params.metadata,
            showGuestWarning: true,
            warningMessage: limitCheck.upgradeMessage,
          };
        }
        
        console.log('✅ Guest assessment limit check passed');
        
      } catch (error) {
        console.error('❌ Error checking guest assessment limits:', error);
        // Don't block assessment creation due to limit checking errors
      }
    }

    // ============================================================================
    // ASSESSMENT SESSION CREATION FLOW
    // ============================================================================

    // Try database creation first (will fail gracefully if constraints violated)
    try {
      const assessmentData = {
        session_id: params.session_id,
        session_type: params.session_type,
        user_id: params.user_id,
        guest_token: params.guest_token,
        topic_id: null, // Assessments don't require topic_id
        questions: Array.isArray(params.questions) ? params.questions : [], // Ensure questions is always a valid array
        answers: {},
        current_question_index: 0,
        response_times: {},
        streak: 0,
        max_streak: 0,
        started_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          ...params.metadata,
          assessment_type: params.assessment_type,
          test_type: params.test_type,
        },
      };

      const { data, error } = await supabase
        .from('progress_sessions')
        .insert(assessmentData)
        .select()
        .single();

      if (!error && data) {
        console.log('✅ Assessment session created in database:', data.id);
        
        // Record attempt for guest tracking
        if (!params.user_id && params.guest_token) {
          const sessionType = this.mapAssessmentTypeForLimits(params.session_type, params.assessment_type);
          await GuestLimitService.recordAttempt(params.guest_token, sessionType, 0);
        }
        
        return { data, error: null };
      }

      console.warn('⚠️ Database constraint violation, switching to offline mode:', error);
      
    } catch (dbError) {
      console.error('❌ Database error during assessment creation:', dbError);
    }

    // ============================================================================
    // OFFLINE FALLBACK FOR ASSESSMENTS
    // ============================================================================
    
    // Fallback to offline mode for assessments
    try {
      const offlineParams = {
        session_id: params.session_id,
        session_type: params.session_type,
        questions: params.questions,
        metadata: {
          ...params.metadata,
          assessment_type: params.assessment_type,
          test_type: params.test_type,
        },
        topic_id: null, // Assessments don't require topic_id
        // Include user identifiers if present
        ...(params.user_id && { user_id: params.user_id }),
        ...(params.guest_token && { guest_token: params.guest_token }),
      };

      const offlineSession = await offlineSessionManager.createProgressSession(offlineParams);

      console.log('✅ Created offline assessment session:', offlineSession.id);
      
      // Record attempt for guest tracking even in offline mode
      if (!params.user_id && params.guest_token) {
        const sessionType = this.mapAssessmentTypeForLimits(params.session_type, params.assessment_type);
        await GuestLimitService.recordAttempt(params.guest_token, sessionType, 0);
      }
      
      return { data: offlineSession, error: null };
      
    } catch (offlineError) {
      console.error('❌ Offline assessment creation failed:', offlineError);
      
      // Check if this is a guest limit error
      if ((offlineError as any).code === 'GUEST_LIMIT_EXCEEDED') {
        return {
          data: null,
          error: {
            code: 'GUEST_LIMIT_EXCEEDED',
            message: (offlineError as any).message,
            details: (offlineError as any).details,
          }
        };
      }
      
      return {
        data: null,
        error: {
          code: 'ASSESSMENT_CREATE_ERROR',
          message: 'Failed to create assessment session',
          details: offlineError,
        }
      };
    }
  }

  // ============================================================================
  // SAVE PROGRESS (WITH OFFLINE SUPPORT)
  // ============================================================================

  async saveProgress(sessionId: string, progressData: any): Promise<{ data: any; error: any }> {
    try {
      // First try database
      const { data, error } = await supabase
        .from('progress_sessions')
        .update({
          ...progressData,
          last_updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (!error) {
        return { data, error: null };
      }

      console.warn('⚠️ Database save failed, using offline:', error);
      
    } catch (dbError) {
      console.error('❌ Database error during save:', dbError);
    }

    // Fallback to offline
    try {
      await offlineSessionManager.updateProgressSession(sessionId, progressData);
      return { 
        data: { ...progressData, offline: true }, 
        error: null 
      };
    } catch (offlineError) {
      return {
        data: null,
        error: {
          message: 'Failed to save progress',
          details: offlineError,
        },
      };
    }
  }

  // ============================================================================
  // LOAD PROGRESS (WITH OFFLINE SUPPORT)
  // ============================================================================

  async loadProgress(sessionId: string): Promise<{ data: any; error: any }> {
    try {
      // First check database
      const { data, error } = await supabase
        .from('progress_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (data && !error) {
        return { data, error: null };
      }
      
    } catch (dbError) {
      console.log('Database load failed, checking offline:', dbError);
    }

    // Check offline storage
    try {
      const offlineSession = await offlineSessionManager.getProgressSession(sessionId);
      if (offlineSession) {
        return { data: offlineSession, error: null };
      }
    } catch (offlineError) {
      console.error('Offline load error:', offlineError);
    }

    return {
      data: null,
      error: {
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND',
      },
    };
  }

  // ============================================================================
  // GET ALL INCOMPLETE ASSESSMENTS
  // ============================================================================

  async getIncompleteAssessments(userId?: string, guestToken?: string): Promise<any[]> {
    const assessments: any[] = [];
    
    // Get from database if user is authenticated
    if (userId) {
      try {
        const { data } = await supabase
          .from('progress_sessions')
          .select('*')
          .eq('user_id', userId)
          .in('session_type', ['assessment', 'civics_test', 'challenge'])
          .is('completed_at', null)
          .order('last_updated_at', { ascending: false });

        if (data) {
          assessments.push(...data);
        }
      } catch (error) {
        console.error('Database fetch error:', error);
      }
    }

    // Always check offline storage
    try {
      const allOfflineSessions = await offlineSessionManager.getAllProgressSessions();
      const relevantSessions = Object.values(allOfflineSessions).filter(session => {
        const matchesUser = userId ? session.user_id === userId : session.guest_token === guestToken;
        const isAssessment = ['assessment', 'civics_test', 'challenge'].includes(session.session_type);
        return matchesUser && isAssessment;
      });
      
      assessments.push(...relevantSessions);
    } catch (error) {
      console.error('Offline fetch error:', error);
    }

    // Remove duplicates based on session_id
    const uniqueAssessments = assessments.reduce((acc: any[], curr: any) => {
      if (!acc.find((a: any) => a.session_id === curr.session_id)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    return uniqueAssessments;
  }

  // ============================================================================
  // CIVICS TEST SPECIFIC HANDLER
  // ============================================================================

  async createCivicsTestSession(params: {
    user_id?: string;
    guest_token?: string;
    session_id: string;
    test_type: string;
    questions: any[];
    metadata?: any;
  }): Promise<{ data: any; error: any }> {
    return this.createAssessmentSession({
      ...params,
      session_type: 'civics_test',
      assessment_type: 'civics_knowledge',
    });
  }

  // ============================================================================
  // SYNC OFFLINE SESSIONS
  // ============================================================================

  async syncOfflineSessions(): Promise<void> {
    console.log('🔄 Starting offline session sync...');
    
    const syncQueue = await offlineSessionManager.getSyncQueue();
    
    for (const sessionId of syncQueue) {
      try {
        const offlineSession = await offlineSessionManager.getSession(sessionId);
        if (!offlineSession || !offlineSession.is_completed) {
          continue;
        }

        // Try to sync to database
        const { error } = await supabase
          .from('user_quiz_attempts')
          .insert({
            user_id: offlineSession.user_id,
            topic_id: offlineSession.topic_id,
            total_questions: offlineSession.total_questions,
            correct_answers: offlineSession.correct_answers,
            score: offlineSession.score,
            time_spent_seconds: offlineSession.time_spent_seconds,
            started_at: offlineSession.started_at,
            completed_at: offlineSession.last_updated_at,
            is_completed: true,
          });

        if (!error) {
          await offlineSessionManager.removeFromSyncQueue(sessionId);
          console.log('✅ Synced session:', sessionId);
        } else {
          console.error('❌ Sync failed for session:', sessionId, error);
        }
        
      } catch (error) {
        console.error('❌ Error syncing session:', sessionId, error);
      }
    }
  }

  /**
   * Map assessment types to guest limit categories
   */
  private mapAssessmentTypeForLimits(sessionType: string, assessmentType?: string): 'quiz' | 'assessment' | 'civics_test' {
    // Handle civics tests specifically
    if (sessionType === 'civics_test' || assessmentType === 'civics_knowledge') {
      return 'civics_test';
    }
    
    // Handle general assessments
    if (sessionType === 'assessment') {
      return 'assessment';
    }
    
    // Default to quiz category for other types
    return 'quiz';
  }

  /**
   * Check guest limits for assessments (utility method for UI)
   */
  async checkGuestAssessmentLimits(
    guestToken: string,
    sessionType: string,
    assessmentType?: string,
    gameMode?: string
  ): Promise<{ allowed: boolean; message?: string; attemptsRemaining?: number }> {
    try {
      const limitSessionType = this.mapAssessmentTypeForLimits(sessionType, assessmentType);
      const result = await GuestLimitService.canStartQuiz(guestToken, limitSessionType, gameMode);
      
      const response: { allowed: boolean; message?: string; attemptsRemaining?: number } = {
        allowed: result.allowed,
      };
      
      if (result.upgradeMessage) {
        response.message = result.upgradeMessage;
      }
      
      if (result.attemptsRemaining !== undefined) {
        response.attemptsRemaining = result.attemptsRemaining;
      }
      
      return response;
    } catch (error) {
      console.error('Error checking guest assessment limits:', error);
      return { allowed: true }; // Allow on error to prevent blocking
    }
  }

  /**
   * Show guest limit warning for assessments
   */
  async showGuestAssessmentWarning(
    guestToken: string,
    sessionType: string,
    assessmentType: string,
    onSignUp: () => void
  ): Promise<void> {
    try {
      const limitSessionType = this.mapAssessmentTypeForLimits(sessionType, assessmentType);
      await GuestLimitService.showLimitWarning(limitSessionType, guestToken, onSignUp);
    } catch (error) {
      console.error('Error showing guest assessment warning:', error);
    }
  }

  /**
   * Record completed assessment for guest tracking
   */
  async recordGuestAssessmentCompletion(
    guestToken: string,
    sessionType: string,
    assessmentType: string,
    questionsAnswered: number
  ): Promise<void> {
    try {
      const limitSessionType = this.mapAssessmentTypeForLimits(sessionType, assessmentType);
      await GuestLimitService.recordAttempt(guestToken, limitSessionType, questionsAnswered);
    } catch (error) {
      console.error('Error recording guest assessment completion:', error);
      // Non-blocking error
    }
  }
}

// Export singleton instance
export const assessmentProgressHandler = AssessmentProgressHandler.getInstance(); 