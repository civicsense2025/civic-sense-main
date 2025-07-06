import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateGuestToken } from '../database';

const GUEST_TOKEN_KEY = 'civicsense_guest_token';

interface UseGuestAccessReturn {
  getOrCreateGuestToken: () => string;
  clearGuestToken: () => Promise<void>;
  guestToken: string | null;
}

/**
 * Hook for managing guest user access tokens
 * Provides functionality to create and manage tokens for anonymous users
 */
export const useGuestAccess = (): UseGuestAccessReturn => {
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  /**
   * Get existing guest token or create a new one
   * Caches the token in memory and AsyncStorage for persistence
   */
  const getOrCreateGuestToken = useCallback((): string => {
    // Return cached token if available
    if (tokenRef.current) {
      return tokenRef.current;
    }

    // Create new token
    const newToken = generateGuestToken();
    tokenRef.current = newToken;
    setGuestToken(newToken);

    // Store in AsyncStorage for persistence
    AsyncStorage.setItem(GUEST_TOKEN_KEY, newToken).catch(error => {
      console.warn('Failed to store guest token:', error);
    });

    return newToken;
  }, []);

  /**
   * Clear the guest token from memory and storage
   */
  const clearGuestToken = useCallback(async (): Promise<void> => {
    tokenRef.current = null;
    setGuestToken(null);
    
    try {
      await AsyncStorage.removeItem(GUEST_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to clear guest token from storage:', error);
    }
  }, []);

  return {
    getOrCreateGuestToken,
    clearGuestToken,
    guestToken,
  };
}; 