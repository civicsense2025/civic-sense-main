// CivicSense Mobile Storage Service
// AsyncStorage implementation for mobile data persistence

import AsyncStorage from '@react-native-async-storage/async-storage';

export class AsyncStorageService {
  constructor(private readonly prefix: string = 'civicsense_') {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(this.getKey(key));
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.getKey(key),
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const prefixedKeys = keys.map(key => this.getKey(key));
      const items = await AsyncStorage.multiGet(prefixedKeys);
      
      return items.reduce((acc, [key, value]) => {
        const originalKey = this.removePrefix(key);
        acc[originalKey] = value ? JSON.parse(value) : null;
        return acc;
      }, {} as Record<string, T | null>);
    } catch (error) {
      console.error('Failed to get multiple items:', error);
      throw error;
    }
  }

  async setMultiple<T>(items: Record<string, T>): Promise<void> {
    try {
      const entries: [string, string][] = Object.entries(items).map(([key, value]) => [
        this.getKey(key),
        JSON.stringify(value),
      ]);
      
      await AsyncStorage.multiSet(entries);
    } catch (error) {
      console.error('Failed to set multiple items:', error);
      throw error;
    }
  }

  async removeMultiple(keys: string[]): Promise<void> {
    try {
      const prefixedKeys = keys.map(key => this.getKey(key));
      await AsyncStorage.multiRemove(prefixedKeys);
    } catch (error) {
      console.error('Failed to remove multiple items:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => this.removePrefix(key));
    } catch (error) {
      console.error('Failed to get all keys:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(prefixedKeys);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  // Helper method to get storage size (iOS only)
  async getSize(): Promise<number | null> {
    try {
      const keys = await this.getAllKeys();
      const items = await AsyncStorage.multiGet(keys.map(key => this.getKey(key)));
      
      return items.reduce((size, [_, value]) => {
        return size + (value?.length || 0);
      }, 0);
    } catch {
      return null;
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private removePrefix(key: string): string {
    return key.replace(this.prefix, '');
  }
} 