/**
 * Simplified Google Calendar Service for CivicSense Mobile
 * 
 * This version uses a simpler authentication approach to avoid TypeScript issues
 * while maintaining full functionality for calendar integration.
 */

import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete the auth session properly
WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// PLATFORM-AWARE STORAGE UTILITY
// ============================================================================

class PlatformStorage {
  /**
   * Get item from secure storage (native) or AsyncStorage (web)
   */
  static async getItemAsync(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Use AsyncStorage on web since SecureStore isn't available
        return await AsyncStorage.getItem(key);
      } else {
        // Use SecureStore on native platforms for better security
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in secure storage (native) or AsyncStorage (web)
   */
  static async setItemAsync(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete item from secure storage (native) or AsyncStorage (web)
   */
  static async deleteItemAsync(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error deleting item ${key}:`, error);
      // Don't throw on delete errors to avoid breaking cleanup flows
    }
  }
}

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  duration: number; // in minutes
  recurrence?: 'daily' | 'weekly' | 'monthly';
  location?: string;
  reminderMinutes?: number;
  attendees?: string[];
  metadata?: Record<string, any>;
}

interface AuthResult {
  success: boolean;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface CalendarSyncSettings {
  enabled: boolean;
  syncQuizReminders: boolean;
  syncStudySessions: boolean;
  syncAchievements: boolean;
  reminderMinutes: number;
  lastSyncDate: string | null;
}

// ============================================================================
// GOOGLE CALENDAR SERVICE CLASS
// ============================================================================

class GoogleCalendarServiceClass {
  private static instance: GoogleCalendarServiceClass;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private calendarId: string | null = null;

  // OAuth configuration
  private readonly config = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  };

  constructor() {
    this.loadStoredTokens();
  }

  public static getInstance(): GoogleCalendarServiceClass {
    if (!GoogleCalendarServiceClass.instance) {
      GoogleCalendarServiceClass.instance = new GoogleCalendarServiceClass();
    }
    return GoogleCalendarServiceClass.instance;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  /**
   * Request calendar permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // On mobile, this is handled through OAuth scopes
      return true;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  /**
   * Authenticate with Google using web browser flow
   */
  async authenticate(): Promise<AuthResult> {
    try {
      const authUrl = this.buildAuthUrl();
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'com.civicsense.app://oauth/google'
      );

      if (result.type === 'success' && result.url) {
        const urlParams = new URLSearchParams(result.url.split('?')[1]);
        const code = urlParams.get('code');
        
        if (code) {
          const tokenResult = await this.exchangeCodeForTokens(code);
          
          if (tokenResult.success && tokenResult.accessToken) {
            await this.storeTokens(tokenResult.accessToken, tokenResult.refreshToken || '');
            await this.setupCivicSenseCalendar();
            
            return {
              success: true,
              accessToken: tokenResult.accessToken,
              refreshToken: tokenResult.refreshToken,
            };
          }
        }
      }

      return { success: false, error: 'Authentication failed or cancelled' };
    } catch (error) {
      console.error('Google Calendar authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  /**
   * Build OAuth authorization URL
   */
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.webClientId || '',
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      redirect_uri: 'com.civicsense.app://oauth/google',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<AuthResult> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.webClientId || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: 'com.civicsense.app://oauth/google',
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        return {
          success: true,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };
      } else {
        return {
          success: false,
          error: data.error_description || 'Failed to exchange code for tokens',
        };
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed',
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.webClientId || '',
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        await PlatformStorage.setItemAsync('google_calendar_access_token', data.access_token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // ============================================================================
  // CALENDAR MANAGEMENT
  // ============================================================================

  /**
   * Set up or find the CivicSense calendar
   */
  private async setupCivicSenseCalendar(): Promise<void> {
    try {
      // First, try to find existing CivicSense calendar
      const calendars = await this.makeCalendarRequest('/users/me/calendarList');
      
      const civicSenseCalendar = calendars.items?.find(
        (cal: any) => cal.summary === 'CivicSense Study Schedule'
      );

      if (civicSenseCalendar) {
        this.calendarId = civicSenseCalendar.id;
        await PlatformStorage.setItemAsync('civicsense_calendar_id', civicSenseCalendar.id);
      } else {
        // Create new calendar
        const newCalendar = await this.makeCalendarRequest('/calendars', 'POST', {
          summary: 'CivicSense Study Schedule',
          description: 'Your personalized civic education study schedule and quiz reminders',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        this.calendarId = newCalendar.id;
        await PlatformStorage.setItemAsync('civicsense_calendar_id', newCalendar.id);
      }
    } catch (error) {
      console.error('Error setting up CivicSense calendar:', error);
      // Fallback to primary calendar
      this.calendarId = 'primary';
    }
  }

  /**
   * Create calendar events
   */
  async createEvents(events: CalendarEvent[]): Promise<void> {
    if (!this.accessToken || !this.calendarId) {
      throw new Error('Not authenticated or calendar not set up');
    }

    try {
      for (const event of events) {
        await this.createSingleEvent(event);
      }
    } catch (error) {
      console.error('Error creating calendar events:', error);
      throw error;
    }
  }

  /**
   * Create a single calendar event
   */
  private async createSingleEvent(event: CalendarEvent): Promise<void> {
    const endTime = new Date(event.startTime.getTime() + event.duration * 60000);
    
    const eventData: any = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'popup',
            minutes: event.reminderMinutes || 15,
          },
        ],
      },
      colorId: '9', // Blue color for CivicSense events
      source: {
        title: 'CivicSense',
        url: 'https://civicsense.com',
      },
    };

    // Add recurrence if specified
    if (event.recurrence) {
      const recurrenceRule = this.getRecurrenceRule(event.recurrence);
      eventData.recurrence = [recurrenceRule];
    }

    // Add attendees if specified
    if (event.attendees && event.attendees.length > 0) {
      eventData.attendees = event.attendees.map(email => ({
        email,
        responseStatus: 'needsAction',
      }));
    }

    await this.makeCalendarRequest(
      `/calendars/${encodeURIComponent(this.calendarId!)}/events`,
      'POST',
      eventData
    );
  }

  /**
   * Get recurrence rule for events
   */
  private getRecurrenceRule(recurrence: 'daily' | 'weekly' | 'monthly'): string {
    switch (recurrence) {
      case 'daily':
        return 'RRULE:FREQ=DAILY;COUNT=30'; // 30 days
      case 'weekly':
        return 'RRULE:FREQ=WEEKLY;COUNT=12'; // 12 weeks
      case 'monthly':
        return 'RRULE:FREQ=MONTHLY;COUNT=6'; // 6 months
      default:
        return 'RRULE:FREQ=DAILY;COUNT=1'; // One-time event
    }
  }

  /**
   * Clear all CivicSense calendar events
   */
  async clearCalendarEvents(): Promise<void> {
    if (!this.accessToken || !this.calendarId) return;

    try {
      // Get all events from CivicSense calendar
      const events = await this.makeCalendarRequest(
        `/calendars/${encodeURIComponent(this.calendarId)}/events?q=CivicSense`
      );

      // Delete each event
      if (events.items && events.items.length > 0) {
        for (const event of events.items) {
          await this.makeCalendarRequest(
            `/calendars/${encodeURIComponent(this.calendarId)}/events/${event.id}`,
            'DELETE'
          );
        }
      }
    } catch (error) {
      console.error('Error clearing calendar events:', error);
    }
  }

  /**
   * Sync calendar events based on current settings
   */
  async syncCalendarEvents(): Promise<void> {
    // Load current settings
    const settingsJson = await PlatformStorage.getItemAsync('calendar_sync_settings');
    if (!settingsJson) return;

    const settings: CalendarSyncSettings = JSON.parse(settingsJson);
    if (!settings.enabled) return;

    // Clear existing events first
    await this.clearCalendarEvents();

    // Create new events based on settings
    const events: CalendarEvent[] = [];

    if (settings.syncQuizReminders) {
      events.push({
        title: '📚 CivicSense Daily Quiz',
        description: 'Complete your daily civic education quiz to maintain your learning streak!',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 15,
        recurrence: 'daily',
        reminderMinutes: settings.reminderMinutes,
      });
    }

    if (settings.syncStudySessions) {
      events.push({
        title: '🎯 CivicSense Study Session',
        description: 'Dive deeper into civic topics and strengthen your understanding of democracy.',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 30,
        recurrence: 'weekly',
        reminderMinutes: settings.reminderMinutes,
      });
    }

    if (events.length > 0) {
      await this.createEvents(events);
    }

    // Update last sync date
    settings.lastSyncDate = new Date().toISOString();
    await PlatformStorage.setItemAsync('calendar_sync_settings', JSON.stringify(settings));
  }

  /**
   * Update calendar sync settings
   */
  async updateSettings(settings: CalendarSyncSettings): Promise<void> {
    // Save settings
    await PlatformStorage.setItemAsync('calendar_sync_settings', JSON.stringify(settings));

    // Re-sync events if enabled
    if (settings.enabled) {
      await this.syncCalendarEvents();
    } else {
      await this.clearCalendarEvents();
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Make authenticated request to Google Calendar API
   */
  private async makeCalendarRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
    
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request
          return this.makeCalendarRequest(endpoint, method, body);
        } else {
          throw new Error('Authentication expired. Please re-authenticate.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      if (method === 'DELETE') {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error('Calendar API request failed:', error);
      throw error;
    }
  }

  /**
   * Store authentication tokens securely
   */
  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    await Promise.all([
      PlatformStorage.setItemAsync('google_calendar_access_token', accessToken),
      refreshToken ? PlatformStorage.setItemAsync('google_calendar_refresh_token', refreshToken) : Promise.resolve(),
    ]);
  }

  /**
   * Load stored authentication tokens
   */
  private async loadStoredTokens(): Promise<void> {
    try {
      const [accessToken, refreshToken, calendarId] = await Promise.all([
        PlatformStorage.getItemAsync('google_calendar_access_token'),
        PlatformStorage.getItemAsync('google_calendar_refresh_token'),
        PlatformStorage.getItemAsync('civicsense_calendar_id'),
      ]);

      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.calendarId = calendarId || 'primary';
    } catch (error) {
      console.error('Error loading stored tokens:', error);
    }
  }

  /**
   * Check if user is authenticated for calendar access
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Sign out and clear stored tokens
   */
  async signOut(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.calendarId = null;

    await Promise.all([
      PlatformStorage.deleteItemAsync('google_calendar_access_token').catch(() => {}),
      PlatformStorage.deleteItemAsync('google_calendar_refresh_token').catch(() => {}),
      PlatformStorage.deleteItemAsync('civicsense_calendar_id').catch(() => {}),
    ]);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const GoogleCalendarService = GoogleCalendarServiceClass.getInstance();

// ============================================================================
// CONVENIENCE HOOKS AND UTILITIES
// ============================================================================

/**
 * React hook for using Google Calendar service
 */
export function useGoogleCalendar() {
  return {
    authenticate: () => GoogleCalendarService.authenticate(),
    createEvents: (events: CalendarEvent[]) => GoogleCalendarService.createEvents(events),
    clearEvents: () => GoogleCalendarService.clearCalendarEvents(),
    syncEvents: () => GoogleCalendarService.syncCalendarEvents(),
    updateSettings: (settings: CalendarSyncSettings) => GoogleCalendarService.updateSettings(settings),
    isAuthenticated: () => GoogleCalendarService.isAuthenticated(),
    signOut: () => GoogleCalendarService.signOut(),
  };
}

// Export types for use in other files
export type { CalendarEvent, AuthResult, CalendarSyncSettings }; 