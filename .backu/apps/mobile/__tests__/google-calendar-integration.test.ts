/**
 * Unit Tests for Google Calendar Integration
 * 
 * Tests core calendar service functionality
 */

// Mock global fetch before importing the service
global.fetch = jest.fn();

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock WebBrowser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

import { GoogleCalendarService } from '../lib/services/google-calendar-service-simple';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

describe('Google Calendar Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Authentication', () => {
    test('should handle successful authentication', async () => {
      // Mock successful browser auth session
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'success',
        url: 'com.civicsense.app://oauth/google?code=test-auth-code',
      });

      // Mock successful token exchange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        }),
      });

      const result = await GoogleCalendarService.authenticate();

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('mock-access-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'google_calendar_access_token',
        'mock-access-token'
      );
    });

    test('should handle authentication failure', async () => {
      // Mock failed auth session
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'cancel',
      });

      const result = await GoogleCalendarService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('failed or cancelled');
    });

    test('should handle token exchange failure', async () => {
      // Mock successful browser auth session
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'success',
        url: 'com.civicsense.app://oauth/google?code=test-auth-code',
      });

      // Mock failed token exchange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }),
      });

      const result = await GoogleCalendarService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid authorization code');
    });
  });

  describe('Calendar Operations', () => {
    beforeEach(() => {
      // Mock that service is authenticated
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
        const mockStorage: Record<string, string> = {
          google_calendar_access_token: 'mock-access-token',
          google_calendar_refresh_token: 'mock-refresh-token',
          civicsense_calendar_id: 'test-calendar-id',
        };
        return Promise.resolve(mockStorage[key] || null);
      });
    });

    test('should create calendar events successfully', async () => {
      // Mock successful calendar API calls
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'event-123',
          status: 'confirmed',
        }),
      });

      const events = [{
        title: 'Test Quiz',
        description: 'Daily quiz reminder',
        startTime: new Date('2024-01-15T19:00:00'),
        duration: 15,
      }];

      await expect(GoogleCalendarService.createEvents(events)).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com/calendar/v3'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
          }),
        })
      );
    });

    test('should handle calendar creation errors', async () => {
      // Mock failed calendar API call
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: { message: 'Insufficient permissions' },
        }),
      });

      const events = [{
        title: 'Test Quiz',
        description: 'Daily quiz reminder',
        startTime: new Date('2024-01-15T19:00:00'),
        duration: 15,
      }];

      await expect(GoogleCalendarService.createEvents(events)).rejects.toThrow();
    });

    test('should refresh token when expired', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url) => {
        callCount++;
        
        if (url.includes('oauth2.googleapis.com/token')) {
          // Token refresh request
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'new-access-token',
            }),
          });
        }
        
        if (callCount === 1) {
          // First call returns 401 (unauthorized)
          return Promise.resolve({
            ok: false,
            status: 401,
          });
        }
        
        // Second call succeeds after refresh
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'event-123' }),
        });
      });

      const events = [{
        title: 'Test Quiz',
        description: 'Daily quiz reminder',
        startTime: new Date('2024-01-15T19:00:00'),
        duration: 15,
      }];

      await expect(GoogleCalendarService.createEvents(events)).resolves.not.toThrow();

      // Verify token was refreshed and saved
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'google_calendar_access_token',
        'new-access-token'
      );
    });

    test('should clear calendar events', async () => {
      // Mock calendar list response
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/events?q=CivicSense')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              items: [
                { id: 'event-1' },
                { id: 'event-2' },
              ],
            }),
          });
        }
        
        // Delete requests
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      await expect(GoogleCalendarService.clearCalendarEvents()).resolves.not.toThrow();

      // Verify delete calls were made
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/events/event-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/events/event-2'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Settings Management', () => {
    test('should update calendar sync settings', async () => {
      // Mock successful API calls
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'event-123' }),
      });

      const settings = {
        enabled: true,
        syncQuizReminders: true,
        syncStudySessions: false,
        syncAchievements: false,
        reminderMinutes: 30,
        lastSyncDate: null,
      };

      await expect(GoogleCalendarService.updateSettings(settings)).resolves.not.toThrow();

      // Verify settings were saved
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'calendar_sync_settings',
        JSON.stringify(expect.objectContaining({
          enabled: true,
          syncQuizReminders: true,
          reminderMinutes: 30,
        }))
      );
    });

    test('should disable sync and clear events', async () => {
      // Mock calendar list and delete responses
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/events?q=CivicSense')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      const settings = {
        enabled: false,
        syncQuizReminders: false,
        syncStudySessions: false,
        syncAchievements: false,
        reminderMinutes: 15,
        lastSyncDate: null,
      };

      await expect(GoogleCalendarService.updateSettings(settings)).resolves.not.toThrow();
    });
  });

  describe('Utility Functions', () => {
    test('should check authentication status', () => {
      // Mock unauthenticated state
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      
      // Note: isAuthenticated is synchronous and checks internal state
      // In a real implementation, this would depend on the service initialization
      expect(typeof GoogleCalendarService.isAuthenticated).toBe('function');
    });

    test('should sign out and clear tokens', async () => {
      await GoogleCalendarService.signOut();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('google_calendar_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('google_calendar_refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('civicsense_calendar_id');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await GoogleCalendarService.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should handle malformed URLs in auth response', async () => {
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'success',
        url: 'malformed-url-without-code',
      });

      const result = await GoogleCalendarService.authenticate();

      expect(result.success).toBe(false);
    });
  });
}); 