import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export interface CivicsTestCompletion {
  userId: string;
  sessionId: string;
  completedAt: string;
  score: number;
  wrongAnswers: Record<string, { question: any; userAnswer: string; correctAnswer: string }>;
  cooldownExpiresAt: string; // Date when they can take the test again
}

export interface CooldownStatus {
  isInCooldown: boolean;
  canRetake: boolean;
  cooldownExpiresAt?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  lastScore?: number;
}

export class CivicsTestCooldownService {
  private static readonly COOLDOWN_DURATION_DAYS = 7;
  private static readonly STORAGE_KEY = '@civics_test_cooldown_';
  private static readonly DB_TABLE = 'civics_test_completions';

  /**
   * Record a civics test completion and start the cooldown period
   */
  static async recordCompletion(completion: {
    userId: string;
    sessionId: string;
    score: number;
    wrongAnswers: Record<string, any>;
  }): Promise<{ success: boolean; cooldownExpiresAt: string; error?: string }> {
    try {
      const now = new Date();
      const cooldownExpiresAt = new Date(now.getTime() + (this.COOLDOWN_DURATION_DAYS * 24 * 60 * 60 * 1000));

      const completionRecord: CivicsTestCompletion = {
        userId: completion.userId,
        sessionId: completion.sessionId,
        completedAt: now.toISOString(),
        score: completion.score,
        wrongAnswers: completion.wrongAnswers,
        cooldownExpiresAt: cooldownExpiresAt.toISOString(),
      };

      // Store in database
      try {
        const { error: dbError } = await supabase
          .from('user_assessment_attempts')
          .update({
            cooldown_expires_at: cooldownExpiresAt.toISOString(),
            wrong_answers_for_review: completion.wrongAnswers,
            is_completed: true,
            completed_at: now.toISOString()
          })
          .eq('session_id', completion.sessionId)
          .eq('user_id', completion.userId);

        if (dbError) {
          console.warn('⚠️ Failed to store cooldown in database:', dbError);
        } else {
          console.log('✅ Cooldown period stored in database');
        }
      } catch (dbError) {
        console.warn('⚠️ Database error storing cooldown:', dbError);
      }

      // Store locally as backup
      const storageKey = `${this.STORAGE_KEY}${completion.userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(completionRecord));

      console.log(`🕐 Civics test cooldown started. Can retake after: ${cooldownExpiresAt.toLocaleDateString()}`);

      return {
        success: true,
        cooldownExpiresAt: cooldownExpiresAt.toISOString()
      };
    } catch (error) {
      console.error('❌ Error recording civics test completion:', error);
      return {
        success: false,
        cooldownExpiresAt: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user is in cooldown period
   */
  static async checkCooldownStatus(userId: string): Promise<CooldownStatus> {
    try {
      // First check database
      const dbStatus = await this.checkDatabaseCooldown(userId);
      if (dbStatus.isInCooldown) {
        return dbStatus;
      }

      // Fallback to local storage
      const localStatus = await this.checkLocalCooldown(userId);
      return localStatus;
    } catch (error) {
      console.error('❌ Error checking cooldown status:', error);
      return {
        isInCooldown: false,
        canRetake: true
      };
    }
  }

  /**
   * Check cooldown status from database
   */
  private static async checkDatabaseCooldown(userId: string): Promise<CooldownStatus> {
    try {
      const { data, error } = await supabase
        .from('user_assessment_attempts')
        .select('cooldown_expires_at, score, completed_at')
        .eq('user_id', userId)
        .eq('assessment_type', 'civics_test')
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Database error checking cooldown:', error);
        return { isInCooldown: false, canRetake: true };
      }

      if (!data || !data.cooldown_expires_at) {
        return { isInCooldown: false, canRetake: true };
      }

      const cooldownExpires = new Date(data.cooldown_expires_at);
      const now = new Date();
      const isInCooldown = now < cooldownExpires;

      if (isInCooldown) {
        const timeDiff = cooldownExpires.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
        const hoursRemaining = Math.ceil(timeDiff / (60 * 60 * 1000));

        return {
          isInCooldown: true,
          canRetake: false,
          cooldownExpiresAt: data.cooldown_expires_at,
          daysRemaining,
          hoursRemaining,
          lastScore: data.score
        };
      }

      return {
        isInCooldown: false,
        canRetake: true,
        lastScore: data.score
      };
    } catch (error) {
      console.error('❌ Error checking database cooldown:', error);
      return { isInCooldown: false, canRetake: true };
    }
  }

  /**
   * Check cooldown status from local storage
   */
  private static async checkLocalCooldown(userId: string): Promise<CooldownStatus> {
    try {
      const storageKey = `${this.STORAGE_KEY}${userId}`;
      const storedData = await AsyncStorage.getItem(storageKey);

      if (!storedData) {
        return { isInCooldown: false, canRetake: true };
      }

      const completion: CivicsTestCompletion = JSON.parse(storedData);
      const cooldownExpires = new Date(completion.cooldownExpiresAt);
      const now = new Date();
      const isInCooldown = now < cooldownExpires;

      if (isInCooldown) {
        const timeDiff = cooldownExpires.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
        const hoursRemaining = Math.ceil(timeDiff / (60 * 60 * 1000));

        return {
          isInCooldown: true,
          canRetake: false,
          cooldownExpiresAt: completion.cooldownExpiresAt,
          daysRemaining,
          hoursRemaining,
          lastScore: completion.score
        };
      }

      return {
        isInCooldown: false,
        canRetake: true,
        lastScore: completion.score
      };
    } catch (error) {
      console.error('❌ Error checking local cooldown:', error);
      return { isInCooldown: false, canRetake: true };
    }
  }

  /**
   * Get wrong answers for review (if available)
   */
  static async getWrongAnswersForReview(userId: string): Promise<{
    wrongAnswers: Record<string, any> | null;
    canReview: boolean;
  }> {
    try {
      // Check database first
      const { data, error } = await supabase
        .from('user_assessment_attempts')
        .select('wrong_answers_for_review')
        .eq('user_id', userId)
        .eq('assessment_type', 'civics_test')
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.wrong_answers_for_review) {
        return {
          wrongAnswers: data.wrong_answers_for_review,
          canReview: true
        };
      }

      // Fallback to local storage
      const storageKey = `${this.STORAGE_KEY}${userId}`;
      const storedData = await AsyncStorage.getItem(storageKey);

      if (storedData) {
        const completion: CivicsTestCompletion = JSON.parse(storedData);
        return {
          wrongAnswers: completion.wrongAnswers,
          canReview: true
        };
      }

      return {
        wrongAnswers: null,
        canReview: false
      };
    } catch (error) {
      console.error('❌ Error getting wrong answers for review:', error);
      return {
        wrongAnswers: null,
        canReview: false
      };
    }
  }

  /**
   * Clear cooldown (admin function or for testing)
   */
  static async clearCooldown(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear from database
      await supabase
        .from('user_assessment_attempts')
        .update({ cooldown_expires_at: null })
        .eq('user_id', userId)
        .eq('assessment_type', 'civics_test');

      // Clear from local storage
      const storageKey = `${this.STORAGE_KEY}${userId}`;
      await AsyncStorage.removeItem(storageKey);

      console.log('✅ Civics test cooldown cleared for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing cooldown:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get cooldown duration in days
   */
  static getCooldownDurationDays(): number {
    return this.COOLDOWN_DURATION_DAYS;
  }

  /**
   * Format time remaining for display
   */
  static formatTimeRemaining(daysRemaining?: number, hoursRemaining?: number): string {
    if (!daysRemaining && !hoursRemaining) {
      return 'Available now';
    }

    if (daysRemaining && daysRemaining > 0) {
      return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`;
    }

    if (hoursRemaining && hoursRemaining > 0) {
      return `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} remaining`;
    }

    return 'Available soon';
  }
} 