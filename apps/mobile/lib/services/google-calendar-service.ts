/**
 * Google Calendar Service for CivicSense Mobile
 * 
 * Handles Google Calendar integration including:
 * - OAuth authentication with calendar scopes
 * - Creating and managing calendar events
 * - Syncing study reminders and sessions
 * - Managing user preferences
 */

import React from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { AuthRequest, ResponseType, makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { fetchTopics, type StandardTopic } from '../standardized-data-service';
import { supabase } from '../supabase';

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

interface SuccessAuthResult {
  success: true;
  accessToken: string;
  refreshToken: string;
}

interface FailureAuthResult {
  success: false;
  error: string;
}

interface CalendarSyncSettings {
  enabled: boolean;
  syncQuizReminders: boolean;
  syncStudySessions: boolean;
  syncAchievements: boolean;
  reminderMinutes: number;
  lastSyncDate: string | null;
}

interface TopicCalendarEvent {
  topic_id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  deeplink: string;
}

// Add type definitions for API responses
interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  error_description?: string;
}

interface CalendarErrorResponse {
  error?: {
    message?: string;
  };
}

interface CalendarEventResponse {
  id: string;
  htmlLink?: string;
}

interface CalendarListResponse {
  items?: Array<{
    id: string;
    summary: string;
  }>;
}

// ============================================================================
// GOOGLE CALENDAR SERVICE
// ============================================================================

class GoogleCalendarServiceImpl {
  private static instance: GoogleCalendarServiceImpl;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private calendarId: string | null = null;

  // OAuth configuration
  private readonly config = {
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    scopes: [
      'openid',
      'profile', 
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
  };

  private constructor() {
    this.loadStoredTokens();
  }

  public static getInstance(): GoogleCalendarServiceImpl {
    if (!GoogleCalendarServiceImpl.instance) {
      GoogleCalendarServiceImpl.instance = new GoogleCalendarServiceImpl();
    }
    return GoogleCalendarServiceImpl.instance;
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  /**
   * Check if user has granted calendar permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // On mobile, this is handled through OAuth scopes
      // On web, we might need additional calendar API permissions
      return true;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  /**
   * Authenticate with Google using direct OAuth flow (non-hook approach)
   */
  async authenticate(): Promise<SuccessAuthResult | FailureAuthResult> {
    try {
      // Create auth request manually using AuthRequest
      const redirectUri = makeRedirectUri({ 
        scheme: 'com.civicsense.app'
      });

      const request = new AuthRequest({
        clientId: Platform.OS === 'ios' ? this.config.iosClientId : this.config.androidClientId,
        scopes: this.config.scopes,
        redirectUri: redirectUri,
        responseType: ResponseType.Code,
      });

      // Open auth session
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
      });

      if (result?.type === 'success' && result.params?.code) {
        // Exchange code for tokens, passing the same redirectUri
        const tokenResult = await this.exchangeCodeForTokens(result.params.code, redirectUri);
        
        if (tokenResult.success && tokenResult.accessToken && tokenResult.refreshToken) {
          await this.storeTokens(tokenResult.accessToken, tokenResult.refreshToken);
          await this.setupCivicSenseCalendar();
          
          return {
            success: true,
            accessToken: tokenResult.accessToken,
            refreshToken: tokenResult.refreshToken,
          };
        } else {
          return { success: false, error: tokenResult.error || 'Token exchange failed' };
        }
      } else if (result?.type === 'cancel') {
        return { success: false, error: 'Authentication cancelled by user' };
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    } catch (error) {
      console.error('Google Calendar authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown authentication error' 
      };
    }
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<AuthResult> {
    try {
      const tokenEndpoint = 'https://oauth2.googleapis.com/token';
      const params = new URLSearchParams();
      params.append('client_id', this.config.webClientId || '');
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', redirectUri);
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json() as TokenResponse;

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
      const params = new URLSearchParams();
      params.append('client_id', this.config.webClientId || '');
      params.append('refresh_token', this.refreshToken);
      params.append('grant_type', 'refresh_token');

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json() as TokenResponse;

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
  async setupCivicSenseCalendar(): Promise<void> {
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

    // Add attendees if specified
    if (event.attendees && event.attendees.length > 0) {
      eventData.attendees = event.attendees.map(email => ({
        email,
        responseStatus: 'needsAction',
      }));
    }

    // Add recurrence if specified
    let eventDataWithRecurrence: any = eventData;
    if (event.recurrence) {
      const recurrenceRule = this.getRecurrenceRule(event.recurrence);
      eventDataWithRecurrence = {
        ...eventData,
        recurrence: [recurrenceRule],
      };
    }

    await this.makeCalendarRequest(
      `/calendars/${encodeURIComponent(this.calendarId!)}/events`,
      'POST',
      eventDataWithRecurrence
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
   * Update calendar sync settings
   */
  async updateSettings(settings: CalendarSyncSettings): Promise<void> {
    // Re-sync events based on new settings
    if (settings.enabled) {
      await this.clearCalendarEvents();
      
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

      await this.createEvents(events);
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
        const errorData = await response.json() as CalendarErrorResponse;
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
  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    await Promise.all([
      PlatformStorage.setItemAsync('google_calendar_access_token', accessToken),
      PlatformStorage.setItemAsync('google_calendar_refresh_token', refreshToken),
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

  /**
   * Sync CivicSense question topics to Google Calendar
   * Creates events for topics with scheduled dates and deeplinks back to app
   */
  async syncTopicsToCalendar(options: {
    includeFutureTopics?: boolean;
    includePastTopics?: boolean;
    dateRange?: { start: Date; end: Date };
  } = {}): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Not authenticated with Google Calendar');
      }

      // Fetch topics with dates from database
      const topicsWithDates = await this.fetchTopicsWithDates(options);
      console.log(`📅 Found ${topicsWithDates.length} topics with scheduled dates`);

      const syncResults = {
        success: true,
        synced: 0,
        errors: [] as string[]
      };

      // Create calendar events for each topic
      for (const topic of topicsWithDates) {
        try {
          await this.createTopicCalendarEvent(topic);
          syncResults.synced++;
          console.log(`✅ Synced topic: ${topic.title}`);
        } catch (error) {
          const errorMsg = `Failed to sync topic "${topic.title}": ${error}`;
          console.error(errorMsg);
          syncResults.errors.push(errorMsg);
        }
      }

      // Store last sync timestamp
      await AsyncStorage.setItem(
        'lastTopicSync',
        new Date().toISOString()
      );

      console.log(`📅 Topic sync complete: ${syncResults.synced} synced, ${syncResults.errors.length} errors`);
      return syncResults;

    } catch (error) {
      console.error('Topic sync failed:', error);
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error']
      };
    }
  }

  /**
   * Fetch topics with scheduled dates from database
   */
  private async fetchTopicsWithDates(options: {
    includeFutureTopics?: boolean;
    includePastTopics?: boolean;
    dateRange?: { start: Date; end: Date };
  }): Promise<TopicCalendarEvent[]> {
    try {
      // Build query for topics with dates
      let query = supabase
        .from('question_topics')
        .select(`
          topic_id,
          topic_title,
          description,
          date,
          emoji,
          is_active,
          categories
        `)
        .eq('is_active', true)
        .not('date', 'is', null);

      // Apply date filters
      const now = new Date();
      const { includeFutureTopics = true, includePastTopics = false, dateRange } = options;

      if (dateRange) {
        query = query
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0]);
      } else {
        if (includeFutureTopics && !includePastTopics) {
          query = query.gte('date', now.toISOString().split('T')[0]);
        } else if (!includeFutureTopics && includePastTopics) {
          query = query.lt('date', now.toISOString().split('T')[0]);
        }
        // If both true or both false, include all dates
      }

      const { data: topics, error } = await query.order('date', { ascending: true });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Transform to calendar events with deeplinks
      return (topics || []).map((topic): TopicCalendarEvent => ({
        topic_id: topic.topic_id,
        title: topic.topic_title,
        description: topic.description || 'Test your knowledge on this important topic',
        date: topic.date,
        deeplink: this.generateTopicDeeplink(topic.topic_id),
      }));

    } catch (error) {
      console.error('Failed to fetch topics with dates:', error);
      throw error;
    }
  }

  /**
   * Generate deeplink URL for a specific topic
   */
  private generateTopicDeeplink(topicId: string): string {
    // Using Expo Linking to create app deeplink
    const scheme = 'civicsense'; // From app.config.ts
    return `${scheme}://quiz/${topicId}`;
  }

  /**
   * Create Google Calendar event for a specific topic
   */
  private async createTopicCalendarEvent(topic: TopicCalendarEvent): Promise<void> {
    const accessToken = await PlatformStorage.getItemAsync('google_calendar_access_token');
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Parse date and set time (default to 9:00 AM if no specific time)
    const eventDate = new Date(topic.date);
    const startTime = new Date(eventDate);
    startTime.setHours(9, 0, 0, 0); // 9:00 AM
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 30); // 30-minute event

    // Create rich event description with deeplink
    const eventDescription = `
📚 ${topic.description}

🎯 Ready to test your knowledge? Tap the link below to start this quiz:
${topic.deeplink}

🏆 Challenge yourself and see how you rank against other CivicSense users!

💡 This quiz will help you understand important civic concepts and current events.

---
Generated by CivicSense Mobile App
`.trim();

    const eventData = {
      summary: `📚 CivicSense Quiz: ${topic.title}`,
      description: eventDescription,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'popup', minutes: 5 },
        ],
      },
      source: {
        title: 'CivicSense',
        url: topic.deeplink,
      },
      // Add custom metadata to identify CivicSense events
      extendedProperties: {
        private: {
          civicsense_topic_id: topic.topic_id,
          civicsense_app: 'mobile',
          deeplink: topic.deeplink,
        },
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json() as CalendarErrorResponse;
      throw new Error(`Calendar API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const eventResult = await response.json() as CalendarEventResponse;
    console.log(`📅 Created calendar event for topic ${topic.topic_id}: ${eventResult.htmlLink || 'No link available'}`);
  }

  /**
   * Remove all CivicSense topic events from calendar
   */
  async clearTopicEvents(): Promise<{ success: boolean; removed: number }> {
    try {
      const accessToken = await PlatformStorage.getItemAsync('google_calendar_access_token');
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Find all CivicSense events
      const events = await this.findCivicSenseEvents();
      let removedCount = 0;

      for (const event of events) {
        try {
          await this.deleteCalendarEvent(event.id);
          removedCount++;
        } catch (error) {
          console.error(`Failed to delete event ${event.id}:`, error);
        }
      }

      return { success: true, removed: removedCount };

    } catch (error) {
      console.error('Failed to clear topic events:', error);
      return { success: false, removed: 0 };
    }
  }

  /**
   * Delete a single calendar event
   */
  private async deleteCalendarEvent(eventId: string): Promise<void> {
    const accessToken = await PlatformStorage.getItemAsync('google_calendar_access_token');
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete event: HTTP ${response.status}`);
    }
  }

  /**
   * Find all CivicSense events in calendar
   */
  private async findCivicSenseEvents(): Promise<Array<{ id: string; summary: string }>> {
    const accessToken = await PlatformStorage.getItemAsync('google_calendar_access_token');
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=CivicSense&maxResults=2500`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search calendar events');
    }

    const data = await response.json() as CalendarListResponse;
    return (data.items || [])
      .filter((event) => 
        event.summary?.includes('CivicSense') || 
        (event as any).extendedProperties?.private?.civicsense_app
      )
      .map((event) => ({
        id: event.id,
        summary: event.summary || '',
      }));
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<{
    lastSync: string | null;
    totalTopicsWithDates: number;
    upcomingTopics: number;
    calendarEventsCreated: number;
  }> {
    try {
      const lastSync = await AsyncStorage.getItem('lastTopicSync');
      
      // Count topics with dates
      const { count: totalTopicsWithDates } = await supabase
        .from('question_topics')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('date', 'is', null);

      // Count upcoming topics
      const { count: upcomingTopics } = await supabase
        .from('question_topics')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('date', new Date().toISOString().split('T')[0]);

      // Count calendar events (would need to query Google Calendar API)
      const calendarEvents = await this.findCivicSenseEvents();

      return {
        lastSync,
        totalTopicsWithDates: totalTopicsWithDates || 0,
        upcomingTopics: upcomingTopics || 0,
        calendarEventsCreated: calendarEvents.length,
      };

    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        lastSync: null,
        totalTopicsWithDates: 0,
        upcomingTopics: 0,
        calendarEventsCreated: 0,
      };
    }
  }

  /**
   * @internal
   * This method is for internal use only and should not be called directly.
   */
  public async ensureCodeIsSetupAsync(): Promise<void> {
    // ... method implementation ...
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const googleCalendarService = GoogleCalendarServiceImpl.getInstance();

// Export type for use in other files
export type GoogleCalendarService = typeof googleCalendarService;

// ============================================================================
// CONVENIENCE HOOKS AND UTILITIES
// ============================================================================

/**
 * React hook for using Google Calendar service
 */
export function useGoogleCalendar() {
  return {
    authenticate: () => googleCalendarService.authenticate(),
    createEvents: (events: CalendarEvent[]) => googleCalendarService.createEvents(events),
    clearEvents: () => googleCalendarService.clearCalendarEvents(),
    updateSettings: (settings: CalendarSyncSettings) => googleCalendarService.updateSettings(settings),
    isAuthenticated: () => googleCalendarService.isAuthenticated(),
    signOut: () => googleCalendarService.signOut(),
    syncTopics: (options?: any) => googleCalendarService.syncTopicsToCalendar(options),
    clearTopicEvents: () => googleCalendarService.clearTopicEvents(),
    getSyncStatus: () => googleCalendarService.getSyncStatus(),
  };
}

/**
 * React hook that provides Google Calendar authentication using proper hooks
 * Use this in components that need authentication UI
 */
export function useGoogleCalendarAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    scopes: [
      'openid',
      'profile', 
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
  });

  const authenticate = React.useCallback(async (): Promise<SuccessAuthResult | FailureAuthResult> => {
    try {
      if (!request) {
        return { success: false, error: 'Auth request not ready' };
      }

      const result = await promptAsync();

      if (result?.type === 'success' && result.params?.code) {
        // Pass the generated redirectUri from the request object to the token exchange function
        const tokenResult = await googleCalendarService.exchangeCodeForTokens(
          result.params.code,
          request.redirectUri
        );
        
        if (tokenResult.success && tokenResult.accessToken && tokenResult.refreshToken) {
          await googleCalendarService.storeTokens(tokenResult.accessToken, tokenResult.refreshToken);
          await googleCalendarService.setupCivicSenseCalendar();
          
          return {
            success: true,
            accessToken: tokenResult.accessToken,
            refreshToken: tokenResult.refreshToken,
          };
        } else {
          return { success: false, error: tokenResult.error || 'Token exchange failed' };
        }
      } else if (result?.type === 'cancel') {
        return { success: false, error: 'Authentication cancelled by user' };
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    } catch (error) {
      console.error('Google Calendar authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown authentication error' 
      };
    }
  }, [request, promptAsync]);

  return {
    authenticate,
    request,
    response,
    isReady: !!request,
  };
}

/**
 * Helper function to create common CivicSense calendar events
 */
export function createCivicSenseEvents(settings: CalendarSyncSettings): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();

  if (settings.syncQuizReminders) {
    // Daily quiz reminder at 7 PM
    const dailyQuiz = new Date(now);
    dailyQuiz.setHours(19, 0, 0, 0);
    if (dailyQuiz <= now) {
      dailyQuiz.setDate(dailyQuiz.getDate() + 1);
    }

    events.push({
      title: '📚 Daily Civic Quiz',
      description: 'Take your daily CivicSense quiz to build your civic knowledge and maintain your streak!',
      startTime: dailyQuiz,
      duration: 15,
      recurrence: 'daily',
      reminderMinutes: settings.reminderMinutes,
    });
  }

  if (settings.syncStudySessions) {
    // Weekly study session on Sunday at 2 PM
    const weeklyStudy = new Date(now);
    const daysUntilSunday = (7 - weeklyStudy.getDay()) % 7 || 7;
    weeklyStudy.setDate(weeklyStudy.getDate() + daysUntilSunday);
    weeklyStudy.setHours(14, 0, 0, 0);

    events.push({
      title: '🎯 Weekly Civic Study Session',
      description: 'Deep dive into civic topics and explore current events to strengthen your democratic understanding.',
      startTime: weeklyStudy,
      duration: 30,
      recurrence: 'weekly',
      reminderMinutes: settings.reminderMinutes,
    });
  }

  return events;
} 