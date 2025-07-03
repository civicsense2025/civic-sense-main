// CivicSense Mobile Guest Access Service
// Mobile-specific guest user implementation

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuestAccessService, type GuestSession } from '@civicsense/business-logic/auth';

export class MobileGuestAccessService extends GuestAccessService {
  private readonly STORAGE_KEY = 'civicsense_guest_token';

  protected async saveGuestSession(session: GuestSession): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Failed to save guest session:', error);
      throw error;
    }
  }

  protected async getGuestSession(): Promise<GuestSession | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get guest session:', error);
      return null;
    }
  }

  async clearGuestSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear guest session:', error);
      throw error;
    }
  }

  // Mobile-specific method to check if device has been used before
  async hasExistingGuestData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.some(key => key.startsWith('civicsense_guest_'));
    } catch {
      return false;
    }
  }

  // Mobile-specific method to migrate guest data
  async migrateGuestDataToUser(guestToken: string, userId: string): Promise<void> {
    try {
      // Get all guest-related keys
      const keys = await AsyncStorage.getAllKeys();
      const guestKeys = keys.filter(key => key.startsWith('civicsense_guest_'));

      // Read all guest data
      const guestData = await AsyncStorage.multiGet(guestKeys);
      
      // Convert guest data to user data and filter out null values
      const userData = guestData
        .filter((entry): entry is [string, string] => entry[1] !== null)
        .map(([key, value]) => [
          key.replace('civicsense_guest_', `civicsense_user_${userId}_`),
          value,
        ] as [string, string]);

      if (userData.length > 0) {
        // Save user data
        await AsyncStorage.multiSet(userData);
      }

      // Clean up guest data
      await AsyncStorage.multiRemove(guestKeys);

      // Call parent implementation for additional migration tasks
      await super.migrateGuestDataToUser(guestToken, userId);
    } catch (error) {
      console.error('Failed to migrate guest data:', error);
      throw error;
    }
  }
} 