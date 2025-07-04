/**
 * Supabase Client Singleton
 * 
 * Implements true singleton pattern with proper initialization handling
 * for React Native cross-platform support.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a platform-specific storage adapter with robust error handling
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web platform, with fallback to in-memory storage
    const inMemoryStorage = new Map<string, string>();
    
    // Check if localStorage is available (it might not be in some web environments)
    const isLocalStorageAvailable = (() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const test = '__localStorage_test__';
          window.localStorage.setItem(test, test);
          window.localStorage.removeItem(test);
          return true;
        }
      } catch {
        // localStorage is not available
      }
      return false;
    })();
    
    return {
      getItem: async (key: string): Promise<string | null> => {
        try {
          if (isLocalStorageAvailable) {
            return window.localStorage.getItem(key);
          }
          return inMemoryStorage.get(key) || null;
        } catch (error) {
          console.warn('Storage getItem error:', error);
          return inMemoryStorage.get(key) || null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          if (isLocalStorageAvailable) {
            window.localStorage.setItem(key, value);
          } else {
            inMemoryStorage.set(key, value);
          }
        } catch (error) {
          console.warn('Storage setItem error:', error);
          inMemoryStorage.set(key, value);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          if (isLocalStorageAvailable) {
            window.localStorage.removeItem(key);
          } else {
            inMemoryStorage.delete(key);
          }
        } catch (error) {
          console.warn('Storage removeItem error:', error);
          inMemoryStorage.delete(key);
        }
      },
    };
  } else {
    // React Native: Use SecureStore for auth tokens, AsyncStorage for other data
    return {
      getItem: async (key: string): Promise<string | null> => {
        try {
          // Use SecureStore for sensitive auth data
          if (key.includes('sb-') && key.includes('auth-token')) {
            return await SecureStore.getItemAsync(key);
          }
          // Use AsyncStorage for other data
          return await AsyncStorage.getItem(key);
        } catch (error) {
          console.warn('Storage getItem error:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          // Use SecureStore for sensitive auth data
          if (key.includes('sb-') && key.includes('auth-token')) {
            await SecureStore.setItemAsync(key, value);
          } else {
            // Use AsyncStorage for other data
            await AsyncStorage.setItem(key, value);
          }
        } catch (error) {
          console.warn('Storage setItem error:', error);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          // Use SecureStore for sensitive auth data
          if (key.includes('sb-') && key.includes('auth-token')) {
            await SecureStore.deleteItemAsync(key);
          } else {
            // Use AsyncStorage for other data
            await AsyncStorage.removeItem(key);
          }
        } catch (error) {
          console.warn('Storage removeItem error:', error);
        }
      },
    };
  }
};

class SupabaseSingleton {
  private static instance: SupabaseClient | null = null;
  private static initPromise: Promise<SupabaseClient> | null = null;
  private static isInitializing = false;

  static async getInstance(): Promise<SupabaseClient> {
    // If we already have an instance, return it immediately
    if (this.instance) {
      return this.instance;
    }

    // If we're currently initializing, wait for that to complete
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this.initialize();
    return this.initPromise;
  }

  private static async initialize(): Promise<SupabaseClient> {
    if (this.isInitializing) {
      throw new Error('Supabase is already being initialized');
    }

    this.isInitializing = true;

    try {
      console.log('🔐 Creating Supabase client singleton...');

      const storageAdapter = createStorageAdapter();

      // Create client with minimal configuration to avoid issues
      this.instance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: storageAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false, // Disable for mobile
          // Disable debug mode to reduce console output
          debug: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 2, // Limit realtime events
          }
        },
        global: {
          headers: {
            'X-Client-Info': `civicsense-mobile@${Platform.OS}`,
          },
        },
      });

      console.log('✅ Supabase client singleton created successfully');
      return this.instance;

    } catch (error) {
      console.error('❌ Failed to create Supabase client:', error);
      this.instance = null;
      this.initPromise = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  static get isReady(): boolean {
    return this.instance !== null;
  }



  static get currentInstance(): SupabaseClient | null {
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
    this.initPromise = null;
    this.isInitializing = false;
  }
}

// Create a proxy that ensures singleton access
const supabaseProxy = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    // Suppress warning during app initialization - let the lazy loading work properly
    // Only warn for direct access without proper initialization
    const instance = SupabaseSingleton.currentInstance;
    if (!instance) {
      throw new Error('Supabase client not initialized. Call ensureSupabaseInitialized() first.');
    }
    
    const value = instance[prop as keyof SupabaseClient];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

// Helper function to ensure supabase is initialized
export const ensureSupabaseInitialized = async (): Promise<SupabaseClient> => {
  return SupabaseSingleton.getInstance();
};

// Add a helper function to safely initialize auth with singleton pattern
export const initializeSupabaseAuth = async (): Promise<{
  session: any | null;
  error: Error | null;
}> => {
  try {
    console.log('🔧 Initializing Supabase auth with singleton...');
    
    // Ensure singleton is initialized
    const client = await SupabaseSingleton.getInstance();
    
    // Wait a bit for storage to be ready (especially on web)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Use the optimized auth cache instead of direct auth calls
    const { authCacheHelpers } = await import('./optimized-auth-cache');
    const session = await authCacheHelpers.getSession();
    
    console.log('✅ Supabase auth initialized:', session ? 'Session found' : 'No session');
    return { session, error: null };

  } catch (error) {
    console.error('❌ Failed to initialize Supabase auth:', error);
    return { 
      session: null, 
      error: error instanceof Error ? error : new Error('Unknown auth initialization error') 
    };
  }
};

// Default export uses the proxy to ensure singleton access
export default supabaseProxy;

// Also export the raw singleton for direct access when needed
export { SupabaseSingleton };

// Keep the original supabase export for backward compatibility
export const supabase = supabaseProxy;

// Auth monitoring completely disabled for performance optimization
// The monitoring was contributing to performance issues and console spam

// Basic type definitions for now
export interface DbProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  website: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  state_province: string | null;
  city: string | null;
  updated_at: string | null;
}

export interface DbCategory {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  is_active: boolean | null;
  display_order: number | null;
}

export interface DbQuestionTopic {
  id: string;
  topic_id: string;
  topic_title: string;
  title?: string;
  description: string | null;
  categories: string[] | null; // JSONB field containing array of category IDs
  difficulty_level: number | null;
  is_active: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  emoji?: string;
  why_this_matters?: string;
  is_breaking?: boolean | null;
  is_featured?: boolean | null;
  translations?: any | null;
  date?: string | null;
  day_of_week?: string | null;
}

export interface DbQuestion {
  id: string;
  topic_id: string;
  question: string;
  options: any;
  correct_answer: string;
  explanation: string | null;
  difficulty_level: number;
  is_active: boolean | null;
} 