import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { StandardQuestion, StandardTopic } from '../standardized-data-service';
import { GuestLimitService } from '../services/guest-limit-service';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OfflineSession {
  id: string;
  session_type: 'quiz' | 'assessment' | 'civics_test' | 'challenge' | 'practice';
  user_id?: string | null;
  guest_token?: string | null;
  topic_id?: string | null; // Nullable for civics tests and assessments
  
  // Session metadata
  started_at: string;
  last_updated_at: string;
  expires_at: string;
  is_completed: boolean;
  
  // Quiz/Assessment data
  questions: StandardQuestion[] | any[]; // Flexible for different question types
  current_question_index: number;
  answers: Record<number, string>;
  response_times: Record<number, number>;
  
  // Scoring
  score?: number;
  correct_answers?: number;
  total_questions: number;
  time_spent_seconds?: number;
  
  // Progress tracking
  streak: number;
  max_streak: number;
  category_performance?: Record<string, any>;
  
  // Metadata
  game_mode?: string;
  assessment_type?: string;
  test_type?: string;
  metadata?: any;
  
  // Sync status
  synced: boolean;
  sync_attempts: number;
  last_sync_attempt?: string;
  sync_error?: string;
}

export interface OfflineProgressSession {
  id: string;
  session_id: string;
  session_type: string;
  
  // User identification (flexible)
  user_id?: string | null;
  guest_token?: string | null;
  
  // Topic reference (nullable for special session types)
  topic_id?: string | null;
  
  // Questions and answers
  questions: any[];
  answers: Record<string, any>;
  current_question_index: number;
  
  // Timing
  started_at: string;
  last_updated_at: string;
  expires_at: string;
  
  // Performance tracking
  response_times: Record<string, number>;
  streak: number;
  max_streak: number;
  category_performance?: Record<string, any>;
  
  // Completion tracking
  is_completed?: boolean;
  final_score?: number | null;
  time_spent?: number;
  platform?: string;
  sync_status?: 'pending' | 'synced' | 'failed';
  created_offline?: boolean;
  
  // Test-specific fields
  assessment_type?: string;
  test_type?: string;
  metadata?: any;
}

export interface OfflineProgressSessionParams {
  session_id: string;
  session_type: string;
  user_id?: string;
  guest_token?: string;
  topic_id?: string | null;
  questions: any[];
  metadata?: any;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  OFFLINE_SESSIONS: '@offline_sessions',
  OFFLINE_PROGRESS: '@offline_progress',
  SYNC_QUEUE: '@sync_queue',
  OFFLINE_MODE_ENABLED: '@offline_mode_enabled',
};

const SESSION_EXPIRY_HOURS = 24;
const MAX_RETRY_ATTEMPTS = 3;

// ============================================================================
// OFFLINE SESSION MANAGER
// ============================================================================

export class OfflineSessionManager {
  private static instance: OfflineSessionManager;
  
  static getInstance(): OfflineSessionManager {
    if (!this.instance) {
      this.instance = new OfflineSessionManager();
    }
    return this.instance;
  }

  // ============================================================================
  // SESSION CREATION
  // ============================================================================

  async createOfflineSession(params: {
    session_type: OfflineSession['session_type'];
    user_id?: string;
    guest_token?: string;
    topic_id?: string | null;
    questions: any[];
    game_mode?: string;
    assessment_type?: string;
    test_type?: string;
    metadata?: any;
  }): Promise<OfflineSession> {
    console.log('📱 Creating offline session:', params.session_type);
    
    const now = new Date();
    const session: OfflineSession = {
      id: `offline_${uuid.v4()}`,
      session_type: params.session_type,
      user_id: params.user_id || null,
      guest_token: params.guest_token || null,
      topic_id: params.topic_id || null,
      
      started_at: now.toISOString(),
      last_updated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      is_completed: false,
      
      questions: params.questions,
      current_question_index: 0,
      answers: {},
      response_times: {},
      
      total_questions: params.questions.length,
      streak: 0,
      max_streak: 0,
      
      synced: false,
      sync_attempts: 0,
      
      // Only include optional properties if they have values
      ...(params.game_mode && { game_mode: params.game_mode }),
      ...(params.assessment_type && { assessment_type: params.assessment_type }),
      ...(params.test_type && { test_type: params.test_type }),
      ...(params.metadata && { metadata: params.metadata }),
    };
    
    await this.saveSession(session);
    return session;
  }

  async createProgressSession(params: OfflineProgressSessionParams): Promise<OfflineProgressSession> {
    console.log('💾 Creating offline progress session:', params.session_type);

    // ============================================================================
    // GUEST LIMIT ENFORCEMENT (Even in offline mode)
    // ============================================================================
    
    if (!params.user_id && params.guest_token) {
      console.log('🔒 Checking guest limits for offline session...');
      
      try {
        // Map session type for limit checking
        const sessionType = this.mapSessionTypeForLimits(params.session_type);
        const gameMode = params.metadata?.game_mode;
        
        // Check if guest can start this type of session
        const limitCheck = await GuestLimitService.canStartQuiz(
          params.guest_token,
          sessionType,
          gameMode
        );
        
        if (!limitCheck.allowed) {
          console.warn('❌ Guest limit exceeded in offline mode:', limitCheck.reason);
          
          // Throw structured error that can be caught by calling code
          const error = new Error(limitCheck.upgradeMessage || 'Daily limit reached for guest users');
          (error as any).code = 'GUEST_LIMIT_EXCEEDED';
          (error as any).details = {
            reason: limitCheck.reason,
            attemptsRemaining: limitCheck.attemptsRemaining,
            resetTime: limitCheck.resetTime,
            upgradeMessage: limitCheck.upgradeMessage,
          };
          throw error;
        }
        
        console.log('✅ Guest limit check passed for offline session');
        
      } catch (error) {
        if ((error as any).code === 'GUEST_LIMIT_EXCEEDED') {
          throw error; // Re-throw guest limit errors
        }
        console.error('❌ Error checking guest limits in offline mode:', error);
        // Don't block for other errors
      }
    }

    // ============================================================================
    // NORMAL OFFLINE SESSION CREATION
    // ============================================================================

    const session: OfflineProgressSession = {
      id: params.session_id,
      session_id: params.session_id,
      session_type: params.session_type,
      user_id: params.user_id || null,
      guest_token: params.guest_token || null,
      topic_id: params.topic_id || null,
      questions: params.questions,
      answers: {},
      current_question_index: 0,
      response_times: {},
      streak: 0,
      max_streak: 0,
      started_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: params.metadata || {},
      is_completed: false,
      final_score: null,
      time_spent: 0,
      platform: 'mobile',
      sync_status: 'pending',
      created_offline: true,
    };

    try {
      // Store in offline storage
      await this.saveProgressSession(session);
      
      // Track guest attempt if applicable
      if (!params.user_id && params.guest_token) {
        const sessionType = this.mapSessionTypeForLimits(params.session_type);
        await GuestLimitService.recordAttempt(params.guest_token, sessionType, 0);
        console.log('📊 Recorded guest attempt for offline session');
      }
      
      console.log('✅ Offline progress session created successfully:', session.id);
      return session;
      
    } catch (error) {
      console.error('❌ Failed to create offline session:', error);
      throw error;
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async saveSession(session: OfflineSession): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      sessions[session.id] = session;
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_SESSIONS, JSON.stringify(sessions));
      console.log('✅ Offline session saved:', session.id);
    } catch (error) {
      console.error('❌ Error saving offline session:', error);
      throw error;
    }
  }

  async saveProgressSession(session: OfflineProgressSession): Promise<void> {
    try {
      const sessions = await this.getAllProgressSessions();
      sessions[session.id] = session;
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_PROGRESS, JSON.stringify(sessions));
      console.log('✅ Offline progress session saved:', session.id);
    } catch (error) {
      console.error('❌ Error saving progress session:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<OfflineSession | null> {
    const sessions = await this.getAllSessions();
    return sessions[sessionId] || null;
  }

  async getProgressSession(sessionId: string): Promise<OfflineProgressSession | null> {
    const sessions = await this.getAllProgressSessions();
    return sessions[sessionId] || null;
  }

  async getAllSessions(): Promise<Record<string, OfflineSession>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_SESSIONS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Error getting offline sessions:', error);
      return {};
    }
  }

  async getAllProgressSessions(): Promise<Record<string, OfflineProgressSession>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Error getting progress sessions:', error);
      return {};
    }
  }

  // ============================================================================
  // SESSION UPDATES
  // ============================================================================

  async updateSession(sessionId: string, updates: Partial<OfflineSession>): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      last_updated_at: new Date().toISOString(),
    };
    
    await this.saveSession(updatedSession);
  }

  async updateProgressSession(sessionId: string, updates: Partial<OfflineProgressSession>): Promise<void> {
    const session = await this.getProgressSession(sessionId);
    if (!session) {
      throw new Error(`Progress session ${sessionId} not found`);
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      last_updated_at: new Date().toISOString(),
    };
    
    await this.saveProgressSession(updatedSession);
  }

  async recordAnswer(sessionId: string, questionIndex: number, answer: string, isCorrect: boolean, timeSpent: number): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Update answers and response times
    session.answers[questionIndex] = answer;
    session.response_times[questionIndex] = timeSpent;
    
    // Update streaks
    if (isCorrect) {
      session.streak++;
      session.max_streak = Math.max(session.max_streak, session.streak);
    } else {
      session.streak = 0;
    }
    
    // Update current question index
    session.current_question_index = questionIndex + 1;
    
    await this.updateSession(sessionId, session);
  }

  async completeSession(sessionId: string, score: number, correctAnswers: number, timeSpentSeconds: number): Promise<void> {
    await this.updateSession(sessionId, {
      is_completed: true,
      score,
      correct_answers: correctAnswers,
      time_spent_seconds: timeSpentSeconds,
    });
    
    // Add to sync queue
    await this.addToSyncQueue(sessionId);
  }

  // ============================================================================
  // SYNC QUEUE MANAGEMENT
  // ============================================================================

  async addToSyncQueue(sessionId: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      if (!queue.includes(sessionId)) {
        queue.push(sessionId);
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
        console.log('📤 Added to sync queue:', sessionId);
      }
    } catch (error) {
      console.error('❌ Error adding to sync queue:', error);
    }
  }

  async getSyncQueue(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error getting sync queue:', error);
      return [];
    }
  }

  async removeFromSyncQueue(sessionId: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filtered = queue.filter(id => id !== sessionId);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
    } catch (error) {
      console.error('❌ Error removing from sync queue:', error);
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async cleanupExpiredSessions(): Promise<void> {
    console.log('🧹 Cleaning up expired offline sessions');
    
    const now = new Date();
    const sessions = await this.getAllSessions();
    const progressSessions = await this.getAllProgressSessions();
    
    // Clean up quiz sessions
    for (const [id, session] of Object.entries(sessions)) {
      if (new Date(session.expires_at) < now) {
        delete sessions[id];
        console.log('🗑️ Removed expired session:', id);
      }
    }
    
    // Clean up progress sessions
    for (const [id, session] of Object.entries(progressSessions)) {
      if (new Date(session.expires_at) < now) {
        delete progressSessions[id];
        console.log('🗑️ Removed expired progress session:', id);
      }
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_SESSIONS, JSON.stringify(sessions));
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_PROGRESS, JSON.stringify(progressSessions));
  }

  async clearAllOfflineData(): Promise<void> {
    console.log('🗑️ Clearing all offline data');
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.OFFLINE_SESSIONS,
      STORAGE_KEYS.OFFLINE_PROGRESS,
      STORAGE_KEYS.SYNC_QUEUE,
      STORAGE_KEYS.OFFLINE_MODE_ENABLED,
    ]);
  }

  // ============================================================================
  // OFFLINE MODE MANAGEMENT
  // ============================================================================

  async isOfflineModeEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE_ENABLED);
      return value === 'true';
    } catch {
      return false;
    }
  }

  async setOfflineMode(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE_ENABLED, enabled.toString());
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
   * Check guest limits for offline sessions (utility method)
   */
  async checkGuestLimitsForOffline(
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
      console.error('Error checking guest limits for offline:', error);
      return { allowed: true }; // Allow on error to prevent blocking
    }
  }

  /**
   * Complete an offline session with guest tracking
   */
  async completeOfflineSession(
    sessionId: string,
    finalAnswers: Record<string, any>,
    finalScore: number,
    questionsAnswered: number
  ): Promise<void> {
    console.log('🏁 Completing offline session:', sessionId);

    try {
      const session = await this.getProgressSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Update session data
      const updatedSession = {
        ...session,
        answers: finalAnswers,
        is_completed: true,
        final_score: finalScore,
        time_spent: Date.now() - new Date(session.started_at).getTime(),
        last_updated_at: new Date().toISOString(),
        sync_status: 'pending' as const,
      };

      await this.saveProgressSession(updatedSession);

      // Track guest completion for limits
      if (!session.user_id && session.guest_token) {
        const sessionType = this.mapSessionTypeForLimits(session.session_type);
        await GuestLimitService.recordAttempt(session.guest_token, sessionType, questionsAnswered);
        console.log('📊 Recorded guest completion for offline session');
      }

      console.log('✅ Offline session completed successfully');
      
    } catch (error) {
      console.error('❌ Failed to complete offline session:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineSessionManager = OfflineSessionManager.getInstance(); 