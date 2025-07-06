/**
 * Supabase Client Setup
 * 
 * Following React Native best practices for Supabase initialization
 * with proper async storage configuration.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a platform-specific storage adapter
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string): Promise<string | null> => {
        try {
          return window.localStorage.getItem(key);
        } catch (error) {
          console.warn('Storage getItem error:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          window.localStorage.setItem(key, value);
        } catch (error) {
          console.warn('Storage setItem error:', error);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          console.warn('Storage removeItem error:', error);
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

// Create the Supabase client following React Native best practices
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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

// Initialize auth on module load
console.log('🔐 Creating Supabase client singleton...');
console.log('✅ Supabase client singleton created successfully');

// Export as default for compatibility
export default supabase;

// Basic type definitions
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