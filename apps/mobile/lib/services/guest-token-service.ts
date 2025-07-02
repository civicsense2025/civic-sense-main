import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

// ============================================================================
// GUEST TOKEN MANAGEMENT SERVICE
// ============================================================================

export class GuestTokenService {
  private static readonly GUEST_TOKEN_KEY = 'civicsense_guest_token';
  private static readonly GUEST_SESSION_KEY = 'civicsense_guest_session';
  private static cachedToken: string | null = null;

  /**
   * Get or create a guest token for anonymous user tracking
   */
  static async getOrCreateGuestToken(): Promise<string> {
    try {
      // Return cached token if available
      if (this.cachedToken) {
        return this.cachedToken;
      }

      // Check if token already exists in storage
      let token = await AsyncStorage.getItem(this.GUEST_TOKEN_KEY);
      
      if (!token) {
        // Generate new UUID-based guest token
        token = `guest_${uuid.v4()}`;
        await AsyncStorage.setItem(this.GUEST_TOKEN_KEY, token);
        
        // Track first session creation
        await this.initializeGuestSession(token);
        console.log('🎫 Created new guest token:', token.substring(0, 15) + '...');
      } else {
        console.log('🎫 Retrieved existing guest token:', token.substring(0, 15) + '...');
      }

      // Cache the token
      this.cachedToken = token;
      return token;
    } catch (error) {
      console.error('❌ Error managing guest token:', error);
      // Fallback to temporary session token
      return `guest_temp_${Date.now()}`;
    }
  }

  /**
   * Initialize a new guest session with tracking
   */
  private static async initializeGuestSession(token: string): Promise<void> {
    try {
      const sessionData = {
        token,
        createdAt: new Date().toISOString(),
        firstVisit: true,
        totalSessions: 1,
        deviceInfo: {
          platform: 'mobile',
          userAgent: 'CivicSense-Mobile',
          timestamp: Date.now()
        }
      };

      await AsyncStorage.setItem(this.GUEST_SESSION_KEY, JSON.stringify(sessionData));
      console.log('📊 Initialized guest session tracking');
    } catch (error) {
      console.error('❌ Error initializing guest session:', error);
    }
  }

  /**
   * Get current guest session data
   */
  static async getGuestSession(): Promise<any | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.GUEST_SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('❌ Error retrieving guest session:', error);
      return null;
    }
  }

  /**
   * Update guest session with activity
   */
  static async updateGuestActivity(): Promise<void> {
    try {
      const session = await this.getGuestSession();
      if (session) {
        session.lastActivity = new Date().toISOString();
        session.totalSessions = (session.totalSessions || 1) + 1;
        await AsyncStorage.setItem(this.GUEST_SESSION_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.error('❌ Error updating guest activity:', error);
    }
  }

  /**
   * Clear guest token and session (when user signs up)
   */
  static async clearGuestData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.GUEST_TOKEN_KEY),
        AsyncStorage.removeItem(this.GUEST_SESSION_KEY)
      ]);
      this.cachedToken = null;
      console.log('🧹 Cleared guest token and session data');
    } catch (error) {
      console.error('❌ Error clearing guest data:', error);
    }
  }

  /**
   * Check if current user is a guest
   */
  static isGuestUser(user: any): boolean {
    return !user || !user.id;
  }

  /**
   * Get display name for guest user
   */
  static getGuestDisplayInfo(): { displayName: string; identifier: string } {
    return {
      displayName: 'Guest User',
      identifier: this.cachedToken ? this.cachedToken.substring(0, 8) + '...' : 'anonymous'
    };
  }

  /**
   * Transfer guest progress to user account (called during signup)
   */
  static async transferGuestProgressToUser(userId: string): Promise<boolean> {
    try {
      const guestToken = await this.getOrCreateGuestToken();
      const session = await this.getGuestSession();
      
      // Store transfer metadata for potential recovery
      const transferData = {
        guestToken,
        userId,
        transferredAt: new Date().toISOString(),
        sessionData: session,
        status: 'pending'
      };

      await AsyncStorage.setItem(
        `guest_transfer_${userId}`, 
        JSON.stringify(transferData)
      );

      console.log('📦 Prepared guest progress transfer for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error preparing progress transfer:', error);
      return false;
    }
  }

  /**
   * Confirm successful transfer and cleanup
   */
  static async confirmTransferComplete(userId: string): Promise<void> {
    try {
      // Mark transfer as complete
      const transferKey = `guest_transfer_${userId}`;
      const transferData = await AsyncStorage.getItem(transferKey);
      
      if (transferData) {
        const data = JSON.parse(transferData);
        data.status = 'completed';
        data.completedAt = new Date().toISOString();
        await AsyncStorage.setItem(transferKey, JSON.stringify(data));
      }

      // Clear guest data after successful transfer
      await this.clearGuestData();
      console.log('✅ Guest progress transfer completed for user:', userId);
    } catch (error) {
      console.error('❌ Error confirming transfer complete:', error);
    }
  }

  /**
   * Get analytics about guest usage patterns
   */
  static async getGuestAnalytics(): Promise<{
    daysSinceFirstVisit: number;
    totalSessions: number;
    hasToken: boolean;
    tokenAge: number;
    conversionEligible: boolean;
  }> {
    try {
      const session = await this.getGuestSession();
      const hasToken = Boolean(this.cachedToken || await AsyncStorage.getItem(this.GUEST_TOKEN_KEY));
      
      if (!session) {
        return {
          daysSinceFirstVisit: 0,
          totalSessions: 0,
          hasToken,
          tokenAge: 0,
          conversionEligible: false
        };
      }

      const firstVisit = new Date(session.createdAt);
      const daysSinceFirstVisit = Math.floor(
        (Date.now() - firstVisit.getTime()) / (1000 * 60 * 60 * 24)
      );

      const tokenAge = daysSinceFirstVisit;
      const conversionEligible = daysSinceFirstVisit >= 1 && session.totalSessions >= 2;

      return {
        daysSinceFirstVisit,
        totalSessions: session.totalSessions || 0,
        hasToken,
        tokenAge,
        conversionEligible
      };
    } catch (error) {
      console.error('❌ Error getting guest analytics:', error);
      return {
        daysSinceFirstVisit: 0,
        totalSessions: 0,
        hasToken: false,
        tokenAge: 0,
        conversionEligible: false
      };
    }
  }
} 