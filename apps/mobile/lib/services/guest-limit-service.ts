import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { GUEST_LIMITS, type GuestUsageLimits, type GuestLimitCheckResult } from '../mobile-constants';
import { Alert } from 'react-native';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface GuestUsageRecord {
  guest_token: string;
  date: string;
  quiz_attempts: number;
  assessment_attempts: number;
  civics_test_attempts: number;
  last_attempt_at: string;
  session_start_time?: string;
  questions_in_session: number;
}

interface GuestSessionData {
  startTime: number;
  questionsAnswered: number;
  lastQuizAttempt?: number;
}

// ============================================================================
// GUEST LIMIT ENFORCEMENT SERVICE
// ============================================================================

export class GuestLimitService {
  private static readonly STORAGE_KEY_PREFIX = 'guest_';
  private static readonly SESSION_KEY = 'guest_session_data';

  // ============================================================================
  // MAIN LIMIT CHECKING FUNCTIONS
  // ============================================================================

  /**
   * Check if a guest can start a quiz/assessment
   */
  static async canStartQuiz(
    guestToken: string,
    sessionType: 'quiz' | 'assessment' | 'civics_test',
    gameMode?: string
  ): Promise<GuestLimitCheckResult> {
    try {
      console.log(`🔒 Checking guest limits for ${sessionType}, token: ${guestToken.substring(0, 8)}...`);

      // Check if game mode is restricted for guests
      if (gameMode && GUEST_LIMITS.RESTRICTED_GAME_MODES.includes(gameMode)) {
        return {
          allowed: false,
          reason: 'RESTRICTED_GAME_MODE',
          upgradeMessage: `${gameMode} mode is available for registered users only. Sign up for full access!`
        };
      }

      // Get current usage for today
      const todayUsage = await this.getTodayUsage(guestToken);
      const sessionData = await this.getCurrentSessionData();

      // Check session duration limit
      if (sessionData && this.isSessionTooLong(sessionData)) {
        return {
          allowed: false,
          reason: 'SESSION_TOO_LONG',
          upgradeMessage: `Session limit reached (${GUEST_LIMITS.MAX_SESSION_DURATION_MINUTES} minutes). Sign up for unlimited sessions!`
        };
      }

      // Check session questions limit
      if (sessionData && sessionData.questionsAnswered >= GUEST_LIMITS.MAX_QUESTIONS_PER_SESSION) {
        return {
          allowed: false,
          reason: 'SESSION_QUESTIONS_LIMIT',
          upgradeMessage: `Question limit reached (${GUEST_LIMITS.MAX_QUESTIONS_PER_SESSION} per session). Sign up for unlimited questions!`
        };
      }

      // Check quiz start cooldown
      if (sessionData?.lastQuizAttempt && this.isInCooldown(sessionData.lastQuizAttempt)) {
        const remainingCooldown = this.getRemainingCooldown(sessionData.lastQuizAttempt);
        return {
          allowed: false,
          reason: 'COOLDOWN_ACTIVE',
          upgradeMessage: `Please wait ${remainingCooldown} seconds before starting another quiz. Sign up to remove cooldowns!`
        };
      }

      // Check daily attempt limits based on session type
      const limitCheck = this.checkDailyLimits(todayUsage, sessionType);
      if (!limitCheck.allowed) {
        return limitCheck;
      }

      console.log('✅ Guest limit check passed');
      return { allowed: true };

    } catch (error) {
      console.error('❌ Error checking guest limits:', error);
      // On error, allow the action to prevent blocking users due to technical issues
      return { allowed: true };
    }
  }

  /**
   * Record a quiz/assessment attempt for a guest
   */
  static async recordAttempt(
    guestToken: string,
    sessionType: 'quiz' | 'assessment' | 'civics_test',
    questionsAnswered: number = 0
  ): Promise<void> {
    try {
      console.log(`📊 Recording guest attempt: ${sessionType} for ${guestToken.substring(0, 8)}...`);

      // Update database usage tracking
      await this.updateDatabaseUsage(guestToken, sessionType);

      // Update local session data
      await this.updateSessionData(questionsAnswered);

      console.log('✅ Guest attempt recorded successfully');
    } catch (error) {
      console.error('❌ Error recording guest attempt:', error);
      // Non-blocking error - don't prevent quiz completion
    }
  }

  /**
   * Get current usage limits for a guest
   */
  static async getUsageLimits(guestToken: string): Promise<GuestUsageLimits> {
    try {
      const todayUsage = await this.getTodayUsage(guestToken);
      const sessionData = await this.getCurrentSessionData();
      const nextReset = this.getNextResetTime();

      return {
        dailyQuizAttempts: todayUsage.quiz_attempts,
        dailyAssessmentAttempts: todayUsage.assessment_attempts,
        dailyCivicsTestAttempts: todayUsage.civics_test_attempts,
        currentSessionDuration: sessionData ? this.getSessionDurationMinutes(sessionData) : 0,
        questionsInCurrentSession: sessionData?.questionsAnswered || 0,
        restrictedGameModes: GUEST_LIMITS.RESTRICTED_GAME_MODES,
        canSaveProgress: false, // Guests cannot save progress long-term
        canBookmarkContent: GUEST_LIMITS.MAX_BOOKMARKS > 0,
        canAccessAnalytics: GUEST_LIMITS.ANALYTICS_ACCESS,
        canExportData: GUEST_LIMITS.EXPORT_DATA_ACCESS,
        warningThreshold: GUEST_LIMITS.WARNING_AT_ATTEMPT,
        isAtLimit: todayUsage.quiz_attempts >= GUEST_LIMITS.DAILY_QUIZ_ATTEMPTS,
        nextResetTime: nextReset,
      };
    } catch (error) {
      console.error('❌ Error getting usage limits:', error);
      return this.getDefaultUsageLimits();
    }
  }

  /**
   * Show appropriate limit warning to user
   */
  static async showLimitWarning(
    sessionType: 'quiz' | 'assessment' | 'civics_test',
    guestToken: string,
    onSignUp: () => void
  ): Promise<void> {
    try {
      const usage = await this.getTodayUsage(guestToken);
      const limit = this.getDailyLimit(sessionType);
      const remaining = limit - this.getCurrentAttempts(usage, sessionType);

      if (remaining === 1) {
        // Soft warning - 1 attempt remaining
        Alert.alert(
          'Almost at your daily limit',
          GUEST_LIMITS.SOFT_LIMIT_MESSAGE,
          [
            { text: 'Continue', style: 'default' },
            { text: 'Sign Up', onPress: onSignUp, style: 'default' }
          ]
        );
      } else if (remaining <= 0) {
        // Hard limit reached
        Alert.alert(
          'Daily limit reached',
          GUEST_LIMITS.HARD_LIMIT_MESSAGE,
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Sign Up Now', onPress: onSignUp, style: 'default' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error showing limit warning:', error);
    }
  }

  /**
   * Start a new guest session
   */
  static async startSession(): Promise<void> {
    try {
      const sessionData: GuestSessionData = {
        startTime: Date.now(),
        questionsAnswered: 0,
      };

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      console.log('🎯 Guest session started');
    } catch (error) {
      console.error('❌ Error starting guest session:', error);
    }
  }

  /**
   * End the current guest session
   */
  static async endSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_KEY);
      console.log('🏁 Guest session ended');
    } catch (error) {
      console.error('❌ Error ending guest session:', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static async getTodayUsage(guestToken: string): Promise<GuestUsageRecord> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Try to get from database first
      const { data, error } = await supabase
        .from('guest_usage_tracking')
        .select('*')
        .eq('tokens', [guestToken])
        .eq('date', today)
        .single();

      if (!error && data) {
        return {
          guest_token: guestToken,
          date: today,
          quiz_attempts: data.attempts || 0,
          assessment_attempts: 0, // Will be tracked in metadata
          civics_test_attempts: 0, // Will be tracked in metadata
          last_attempt_at: data.lastSeen || new Date().toISOString(),
          questions_in_session: 0,
        };
      }
    } catch (error) {
      console.warn('Could not fetch usage from database:', error);
    }

    // Fallback to local storage
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEY_PREFIX}${today}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Could not fetch usage from local storage:', error);
    }

    // Return default empty usage
    return {
      guest_token: guestToken,
      date: today,
      quiz_attempts: 0,
      assessment_attempts: 0,
      civics_test_attempts: 0,
      last_attempt_at: new Date().toISOString(),
      questions_in_session: 0,
    };
  }

  private static async updateDatabaseUsage(
    guestToken: string,
    sessionType: 'quiz' | 'assessment' | 'civics_test'
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Try to update existing record
      const { data: existing } = await supabase
        .from('guest_usage_tracking')
        .select('*')
        .eq('tokens', [guestToken])
        .eq('date', today)
        .single();

      if (existing) {
        // Update existing record
        const newAttempts = (existing.attempts || 0) + 1;
        await supabase
          .from('guest_usage_tracking')
          .update({
            attempts: newAttempts,
            lastSeen: new Date().toISOString(),
            metadata: {
              ...existing.metadata,
              [sessionType]: ((existing.metadata as any)?.[sessionType] || 0) + 1,
              platform: 'mobile',
            }
          })
          .eq('id', existing.id);
      } else {
        // Create new record
        await supabase
          .from('guest_usage_tracking')
          .insert({
            ip: 'mobile-app', // Placeholder for mobile
            date: today,
            tokens: [guestToken],
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            attempts: 1,
            metadata: {
              [sessionType]: 1,
              platform: 'mobile',
            }
          });
      }
    } catch (error) {
      console.warn('Could not update database usage:', error);
      // Fallback to local storage
      await this.updateLocalUsage(guestToken, sessionType);
    }
  }

  private static async updateLocalUsage(
    guestToken: string,
    sessionType: 'quiz' | 'assessment' | 'civics_test'
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${this.STORAGE_KEY_PREFIX}${today}`;

    try {
      const existing = await this.getTodayUsage(guestToken);
      
      const updated: GuestUsageRecord = {
        ...existing,
        last_attempt_at: new Date().toISOString(),
      };

      // Increment the appropriate counter
      switch (sessionType) {
        case 'quiz':
          updated.quiz_attempts++;
          break;
        case 'assessment':
          updated.assessment_attempts++;
          break;
        case 'civics_test':
          updated.civics_test_attempts++;
          break;
      }

      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating local usage:', error);
    }
  }

  private static async getCurrentSessionData(): Promise<GuestSessionData | null> {
    try {
      const stored = await AsyncStorage.getItem(this.SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Could not get session data:', error);
      return null;
    }
  }

  private static async updateSessionData(questionsAnswered: number): Promise<void> {
    try {
      const existing = await this.getCurrentSessionData();
      if (!existing) {
        await this.startSession();
        return;
      }

      const updated: GuestSessionData = {
        ...existing,
        questionsAnswered: existing.questionsAnswered + questionsAnswered,
        lastQuizAttempt: Date.now(),
      };

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating session data:', error);
    }
  }

  private static checkDailyLimits(
    usage: GuestUsageRecord,
    sessionType: 'quiz' | 'assessment' | 'civics_test'
  ): GuestLimitCheckResult {
    const currentAttempts = this.getCurrentAttempts(usage, sessionType);
    const limit = this.getDailyLimit(sessionType);
    const remaining = limit - currentAttempts;

    if (remaining <= 0) {
      return {
        allowed: false,
        reason: 'DAILY_LIMIT_REACHED',
        attemptsRemaining: 0,
        upgradeMessage: GUEST_LIMITS.HARD_LIMIT_MESSAGE,
        resetTime: this.getNextResetTime(),
      };
    }

    if (remaining === 1) {
      return {
        allowed: true,
        attemptsRemaining: remaining,
        upgradeMessage: GUEST_LIMITS.SOFT_LIMIT_MESSAGE,
      };
    }

    return {
      allowed: true,
      attemptsRemaining: remaining,
    };
  }

  private static getCurrentAttempts(
    usage: GuestUsageRecord,
    sessionType: 'quiz' | 'assessment' | 'civics_test'
  ): number {
    switch (sessionType) {
      case 'quiz':
        return usage.quiz_attempts;
      case 'assessment':
        return usage.assessment_attempts;
      case 'civics_test':
        return usage.civics_test_attempts;
      default:
        return 0;
    }
  }

  private static getDailyLimit(sessionType: 'quiz' | 'assessment' | 'civics_test'): number {
    switch (sessionType) {
      case 'quiz':
        return GUEST_LIMITS.DAILY_QUIZ_ATTEMPTS;
      case 'assessment':
        return GUEST_LIMITS.DAILY_ASSESSMENT_ATTEMPTS;
      case 'civics_test':
        return GUEST_LIMITS.DAILY_CIVICS_TEST_ATTEMPTS;
      default:
        return 0;
    }
  }

  private static isSessionTooLong(sessionData: GuestSessionData): boolean {
    const durationMinutes = this.getSessionDurationMinutes(sessionData);
    return durationMinutes >= GUEST_LIMITS.MAX_SESSION_DURATION_MINUTES;
  }

  private static getSessionDurationMinutes(sessionData: GuestSessionData): number {
    return Math.floor((Date.now() - sessionData.startTime) / (1000 * 60));
  }

  private static isInCooldown(lastAttemptTime: number): boolean {
    const cooldownMs = GUEST_LIMITS.QUIZ_START_COOLDOWN_SECONDS * 1000;
    return (Date.now() - lastAttemptTime) < cooldownMs;
  }

  private static getRemainingCooldown(lastAttemptTime: number): number {
    const cooldownMs = GUEST_LIMITS.QUIZ_START_COOLDOWN_SECONDS * 1000;
    const elapsed = Date.now() - lastAttemptTime;
    return Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
  }

  private static getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private static getDefaultUsageLimits(): GuestUsageLimits {
    return {
      dailyQuizAttempts: 0,
      dailyAssessmentAttempts: 0,
      dailyCivicsTestAttempts: 0,
      currentSessionDuration: 0,
      questionsInCurrentSession: 0,
      restrictedGameModes: GUEST_LIMITS.RESTRICTED_GAME_MODES,
      canSaveProgress: false,
      canBookmarkContent: false,
      canAccessAnalytics: false,
      canExportData: false,
      warningThreshold: GUEST_LIMITS.WARNING_AT_ATTEMPT,
      isAtLimit: true,
      nextResetTime: this.getNextResetTime(),
    };
  }

  // ============================================================================
  // UTILITY METHODS FOR COMPONENTS
  // ============================================================================

  /**
   * Check if guest can access a specific feature
   */
  static canAccessFeature(feature: 'analytics' | 'export' | 'bookmarks' | 'multiplayer'): boolean {
    switch (feature) {
      case 'analytics':
        return GUEST_LIMITS.ANALYTICS_ACCESS;
      case 'export':
        return GUEST_LIMITS.EXPORT_DATA_ACCESS;
      case 'bookmarks':
        return GUEST_LIMITS.MAX_BOOKMARKS > 0;
      case 'multiplayer':
        return false; // Most multiplayer features are restricted
      default:
        return false;
    }
  }

  /**
   * Get upgrade message for a specific feature
   */
  static getUpgradeMessage(feature: string): string {
    return `${feature} is available for registered users only. Sign up for full access to CivicSense!`;
  }

  /**
   * Clean up old guest data (call periodically)
   */
  static async cleanupOldData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - GUEST_LIMITS.MAX_PROGRESS_STORAGE_DAYS);
      
      // Clean up local storage
      const keys = await AsyncStorage.getAllKeys();
      const guestKeys = keys.filter(key => 
        key.startsWith(this.STORAGE_KEY_PREFIX) && 
        key !== this.SESSION_KEY
      );

      for (const key of guestKeys) {
        const dateStr = key.replace(this.STORAGE_KEY_PREFIX, '');
        const keyDate = new Date(dateStr);
        
        if (keyDate < cutoffDate) {
          await AsyncStorage.removeItem(key);
        }
      }

      console.log(`🧹 Cleaned up ${guestKeys.length} old guest data entries`);
    } catch (error) {
      console.warn('Error cleaning up guest data:', error);
    }
  }
} 