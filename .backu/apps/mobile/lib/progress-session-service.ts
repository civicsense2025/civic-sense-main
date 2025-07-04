import { supabase } from './supabase';
import { offlineSessionManager } from './offline/offline-session-manager';
import { assessmentProgressHandler } from './assessment-progress-handler';
import { GuestLimitService } from './services/guest-limit-service';
import { Alert } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export interface ProgressSessionParams {
  session_id: string;
  session_type: 'quiz' | 'assessment' | 'civics_test' | 'challenge';
  user_id?: string | null;
  guest_token?: string | null;
  topic_id?: string | null; // Nullable for assessments/civics tests
  questions: any[] | null; // Allow null but will be converted to empty array
  assessment_type?: string;
  test_type?: string;
  metadata?: any;
}

// ============================================================================
// PROGRESS SESSION SERVICE
// ============================================================================

export class ProgressSessionService {
  private static instance: ProgressSessionService;
  
  static getInstance(): ProgressSessionService {
    if (!this.instance) {
      this.instance = new ProgressSessionService();
    }
    return this.instance;
  }

  // ============================================================================
  // CREATE SESSION (HANDLES ALL TYPES WITH OFFLINE FALLBACK)
  // ============================================================================

  async createSession(params: ProgressSessionParams): Promise<{ data: any; error: any }> {
    console.log('🚀 Creating progress session:', {
      sessionType: params.session_type,
      userId: params.user_id ? 'authenticated' : 'guest',
      topicId: params.topic_id,
    });

    // ============================================================================
    // GUEST LIMIT ENFORCEMENT
    // ============================================================================
    
    // If this is a guest user, check limits before proceeding
    if (!params.user_id && params.guest_token) {
      console.log('🔒 Checking guest limits before session creation...');
      
      try {
        // Determine session type for limit checking
        const sessionType = this.mapSessionTypeForLimits(params.session_type);
        const gameMode = params.metadata?.game_mode;
        
        // Check if guest can start this type of session
        const limitCheck = await GuestLimitService.canStartQuiz(
          params.guest_token,
          sessionType,
          gameMode
        );
        
        if (!limitCheck.allowed) {
          console.warn('❌ Guest limit exceeded:', limitCheck.reason);
          
          // Return a structured error that components can handle
          return {
            data: null,
            error: {
              code: 'GUEST_LIMIT_EXCEEDED',
              message: limitCheck.upgradeMessage || 'Daily limit reached for guest users',
              details: {
                reason: limitCheck.reason,
                attemptsRemaining: limitCheck.attemptsRemaining,
                resetTime: limitCheck.resetTime,
                upgradeMessage: limitCheck.upgradeMessage,
              }
            }
          };
        }
        
        // Check if we should show a warning (at warning threshold)
        if (limitCheck.attemptsRemaining === 1 && limitCheck.upgradeMessage) {
          console.log('⚠️ Guest at warning threshold, will show prompt after session');
          // Store warning flag for post-session display
          params.metadata = {
            ...params.metadata,
            showGuestWarning: true,
            warningMessage: limitCheck.upgradeMessage,
          };
        }
        
        // Start guest session tracking
        await GuestLimitService.startSession();
        
        console.log('✅ Guest limit check passed, proceeding with session creation');
        
      } catch (error) {
        console.error('❌ Error checking guest limits:', error);
        // Don't block session creation due to limit checking errors
        // Fall through to normal session creation flow
      }
    }

    // ============================================================================
    // NORMAL SESSION CREATION FLOW
    // ============================================================================
    
    // For quiz and challenge sessions, try database first
    try {
      const progressData = {
        session_id: params.session_id,
        session_type: params.session_type,
        user_id: params.user_id,
        guest_token: params.guest_token,
        topic_id: params.topic_id,
        questions: Array.isArray(params.questions) ? params.questions : [], // Ensure questions is always a valid array
        answers: {},
        current_question_index: 0,
        response_times: {},
        streak: 0,
        max_streak: 0,
        started_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: params.metadata,
      };

      const { data, error } = await supabase
        .from('progress_sessions')
        .insert(progressData)
        .select()
        .single();

      if (!error) {
        console.log('✅ Progress session created in database:', data.id);
        
        // Record attempt for guest tracking (if guest)
        if (!params.user_id && params.guest_token) {
          const sessionType = this.mapSessionTypeForLimits(params.session_type);
          await GuestLimitService.recordAttempt(params.guest_token, sessionType, 0);
        }
        
        return { data, error: null };
      }

      // Log the error but continue to offline mode
      console.warn('⚠️ Database error, switching to offline mode:', error);
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
    }

    // ============================================================================
    // OFFLINE FALLBACK WITH GUEST LIMITS
    // ============================================================================
    
    // Fallback to offline mode
    try {
      const offlineSessionParams = {
        session_id: params.session_id,
        session_type: params.session_type,
        questions: Array.isArray(params.questions) ? params.questions : [], // Ensure questions is always a valid array
        metadata: params.metadata,
        // Handle topic_id: convert undefined to null to match expected type
        topic_id: params.topic_id ?? null,
        // Only include user_id and guest_token if they have values
        ...(params.user_id && { user_id: params.user_id }),
        ...(params.guest_token && { guest_token: params.guest_token }),
      };

      const offlineSession = await offlineSessionManager.createProgressSession(offlineSessionParams);

      console.log('✅ Created offline progress session:', offlineSession.id);
      
      // Record attempt for guest tracking (if guest) even in offline mode
      if (!params.user_id && params.guest_token) {
        const sessionType = this.mapSessionTypeForLimits(params.session_type);
        await GuestLimitService.recordAttempt(params.guest_token, sessionType, 0);
      }
      
      return { data: offlineSession, error: null };
      
    } catch (offlineError) {
      console.error('❌ Offline session creation failed:', offlineError);
      return {
        data: null,
        error: {
          code: 'SESSION_CREATE_ERROR',
          message: 'Failed to create progress session',
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
  // DELETE PROGRESS
  // ============================================================================

  async deleteProgress(sessionId: string): Promise<{ error: any }> {
    let dbError = null;
    let offlineError = null;
    
    // Try to delete from database
    try {
      const { error } = await supabase
        .from('progress_sessions')
        .delete()
        .eq('session_id', sessionId);
      
      if (error) {
        dbError = error;
      }
    } catch (error) {
      dbError = error;
    }
    
    // Always try to delete from offline storage too
    try {
      const sessions = await offlineSessionManager.getAllProgressSessions();
      const sessionToDelete = Object.entries(sessions).find(([_, s]) => s.session_id === sessionId);
      
      if (sessionToDelete) {
        // Mark as expired instead of deleted
        await offlineSessionManager.updateProgressSession(sessionToDelete[0], {
          expires_at: new Date(0).toISOString(), // Set to past date
        });
      }
    } catch (error) {
      offlineError = error;
    }
    
    // If both failed, return error
    if (dbError && offlineError) {
      return {
        error: {
          message: 'Failed to delete progress',
          dbError,
          offlineError,
        },
      };
    }
    
    return { error: null };
  }

  // ============================================================================
  // CHECK IF PROGRESS EXISTS
  // ============================================================================

  async hasProgress(sessionId: string): Promise<boolean> {
    // Check database
    try {
      const { data } = await supabase
        .from('progress_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();
      
      if (data) return true;
    } catch (error) {
      // Continue to offline check
    }
    
    // Check offline
    try {
      const offlineSession = await offlineSessionManager.getProgressSession(sessionId);
      return !!offlineSession;
    } catch (error) {
      return false;
    }
  }

  /**
   * Map session types to guest limit categories
   */
  private mapSessionTypeForLimits(sessionType: string): 'quiz' | 'assessment' | 'civics_test' {
    switch (sessionType) {
      case 'assessment':
        return 'assessment';
      case 'civics_test':
        return 'civics_test';
      case 'quiz':
      case 'practice':
      case 'challenge':
      default:
        return 'quiz';
    }
  }

  /**
   * Check guest limits without creating a session (for UI validation)
   */
  async checkGuestLimits(
    guestToken: string,
    sessionType: string,
    gameMode?: string
  ): Promise<{ allowed: boolean; message?: string; attemptsRemaining?: number }> {
    try {
      const limitSessionType = this.mapSessionTypeForLimits(sessionType);
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
      console.error('Error checking guest limits:', error);
      return { allowed: true }; // Allow on error to prevent blocking
    }
  }

  /**
   * Show guest limit warning to user
   */
  async showGuestLimitWarning(
    guestToken: string,
    sessionType: string,
    onSignUp: () => void
  ): Promise<void> {
    try {
      const limitSessionType = this.mapSessionTypeForLimits(sessionType);
      await GuestLimitService.showLimitWarning(limitSessionType, guestToken, onSignUp);
    } catch (error) {
      console.error('Error showing guest limit warning:', error);
    }
  }

  /**
   * Record a completed quiz session for guest tracking
   */
  async recordGuestCompletion(
    guestToken: string,
    sessionType: string,
    questionsAnswered: number
  ): Promise<void> {
    try {
      const limitSessionType = this.mapSessionTypeForLimits(sessionType);
      await GuestLimitService.recordAttempt(guestToken, limitSessionType, questionsAnswered);
    } catch (error) {
      console.error('Error recording guest completion:', error);
      // Non-blocking error
    }
  }
}

// Export singleton instance
export const progressSessionService = ProgressSessionService.getInstance(); 