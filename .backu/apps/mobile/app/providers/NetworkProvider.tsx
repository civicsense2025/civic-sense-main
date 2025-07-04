import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
  isOffline: boolean;
  networkState: NetworkState;
  refreshNetworkState: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: 'unknown',
  });

  const checkNetworkState = async (): Promise<NetworkState> => {
    try {
      // Different approaches for different platforms
      if (Platform.OS === 'web') {
        // For web, we'll use the navigator.onLine API and avoid external requests that cause CORS
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        
        if (!isOnline) {
          return {
            isConnected: false,
            isInternetReachable: false,
            type: 'none',
          };
        }

        // For web development, assume connectivity is working if navigator says we're online
        // In production, this could be enhanced with a same-origin connectivity test
        return {
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi', // Simplified for web
        };
      } else {
        // For mobile platforms, we can use external connectivity checks
        // but only if we have proper network detection libraries
        
        // For now, let's assume mobile connectivity and avoid external requests
        // In a real mobile app, you'd use @react-native-community/netinfo
        return {
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        };
      }
    } catch (error) {
      console.log('Network check failed (gracefully handled):', error);
      // Default to assuming connectivity in development
      return {
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      };
    }
  };

  const refreshNetworkState = async () => {
    const newState = await checkNetworkState();
    setNetworkState(newState);
    
    // Cache the network state
    await AsyncStorage.setItem('lastNetworkState', JSON.stringify(newState));
  };

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const initializeNetworkState = async () => {
      try {
        // Try to load cached network state first
        const cachedState = await AsyncStorage.getItem('lastNetworkState');
        if (cachedState && mounted) {
          setNetworkState(JSON.parse(cachedState));
        }

        // Then check current state
        await refreshNetworkState();
      } catch (error) {
        console.error('Error initializing network state:', error);
        // Fallback to assuming connected for web development
        if (Platform.OS === 'web' && mounted) {
          setNetworkState({
            isConnected: true,
            isInternetReachable: true,
            type: 'wifi',
          });
        }
      }
    };

    initializeNetworkState();

    // For web, also listen to online/offline events
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        if (mounted) {
          setNetworkState(prev => ({
            ...prev,
            isConnected: true,
            isInternetReachable: true,
          }));
        }
      };

      const handleOffline = () => {
        if (mounted) {
          setNetworkState(prev => ({
            ...prev,
            isConnected: false,
            isInternetReachable: false,
            type: 'none',
          }));
        }
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        mounted = false;
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }

    // Check network state periodically for mobile platforms
    if (Platform.OS !== 'web') {
      intervalId = setInterval(() => {
        if (mounted) {
          refreshNetworkState();
        }
      }, 30000); // Every 30 seconds for mobile
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const value = {
    isConnected: networkState.isConnected,
    isInternetReachable: networkState.isInternetReachable,
    connectionType: networkState.type,
    isOffline: !networkState.isConnected,
    networkState,
    refreshNetworkState,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

// Add default export
export default NetworkProvider; 