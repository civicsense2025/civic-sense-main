// CivicSense Mobile Secure Storage Service
// SecureStore implementation for sensitive data

import * as SecureStore from 'expo-secure-store';

export class SecureStorageService {
  constructor(private readonly prefix: string = 'civicsense_secure_') {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = await SecureStore.getItemAsync(this.getKey(key));
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`Failed to get secure item ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.getKey(key),
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(`Failed to set secure item ${key}:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.getKey(key));
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      throw error;
    }
  }

  // Helper method to check if secure storage is available
  async isAvailable(): Promise<boolean> {
    try {
      // Try to store and retrieve a test value
      const testKey = `${this.prefix}test`;
      const testValue = 'test';
      
      await SecureStore.setItemAsync(testKey, testValue);
      const retrieved = await SecureStore.getItemAsync(testKey);
      await SecureStore.deleteItemAsync(testKey);
      
      return retrieved === testValue;
    } catch {
      return false;
    }
  }

  // Helper method to migrate data from AsyncStorage to SecureStore
  async migrateFromAsyncStorage(keys: string[]): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Get all values from AsyncStorage
      const items = await AsyncStorage.multiGet(keys);
      
      // Store each value in SecureStore
      await Promise.all(
        items
          .filter((entry): entry is [string, string] => entry[1] !== null)
          .map(async ([key, value]) => {
            await this.set(key, JSON.parse(value));
            await AsyncStorage.removeItem(key);
          })
      );
    } catch (error) {
      console.error('Failed to migrate to secure storage:', error);
      throw error;
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
} 