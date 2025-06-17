'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  LogLevel,
  StatsigProvider as BaseStatsigProvider,
  useStatsigClient,
} from '@statsig/react-bindings'
import { runStatsigAutoCapture } from '@statsig/web-analytics'
import { useAuth } from '@/components/auth/auth-provider'

// Create a singleton instance
let statsigSingleton: any = null;
let isInitializing = false;

// Create a context for Statsig initialization status
type StatsigContextType = {
  isReady: boolean;
  client: any;
  error: Error | null;
};

const StatsigContext = createContext<StatsigContextType>({
  isReady: false,
  client: null,
  error: null,
});

// Hook to use Statsig context
export const useStatsigStatus = () => useContext(StatsigContext);

interface StatsigWrapperProps {
  children: React.ReactNode;
}

export function StatsigProvider({ children }: StatsigWrapperProps) {
  const { user } = useAuth();
  const [client, setClient] = useState<any>(statsigSingleton);
  const [isReady, setIsReady] = useState<boolean>(!!statsigSingleton);
  const [error, setError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Skip if not mounted yet
    if (!isMounted) return;
    
    const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
    
    // Skip if no client key
    if (!clientKey) {
      console.warn('[Statsig] NEXT_PUBLIC_STATSIG_CLIENT_KEY is not configured. Statsig features will be disabled.');
      return;
    }
    
    // If we already have a singleton, use it
    if (statsigSingleton) {
      setClient(statsigSingleton);
      setIsReady(true);
      return;
    }
    
    // Skip if already initializing
    if (isInitializing) return;
    
    // Set initializing flag
    isInitializing = true;
    
    // Create user object for Statsig
    const statsigUser = user ? {
      userID: user.id,
      email: user.email || undefined,
      custom: {
        created_at: user.created_at,
        full_name: user.user_metadata?.full_name || undefined,
        avatar_url: user.user_metadata?.avatar_url || undefined
      }
    } : {
      userID: 'anonymous'
    };
    
    const options = {
      environment: { 
        tier: process.env.NODE_ENV === 'production' ? 'production' : 'development' 
      },
      logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Error,
    };
    
    // Load the Statsig client dynamically
    const loadStatsig = async () => {
      try {
        // Use dynamic import
        const { StatsigClient } = await import('@statsig/js-client');
        
        // Create client instance
        const newClient = new StatsigClient(clientKey, statsigUser, options);
        
        // Initialize client
        await newClient.initializeAsync();
        
        // Set the singleton
        statsigSingleton = newClient;
        
        // Update state
        setClient(newClient);
        setIsReady(true);
        
        // Initialize auto-capture
        if (typeof window !== 'undefined') {
          runStatsigAutoCapture(newClient);
        }
        
        console.log('[Statsig] Client initialized successfully (singleton)');
      } catch (err) {
        console.error('[Statsig] Failed to initialize client:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        isInitializing = false;
      }
    };
    
    // Start loading
    loadStatsig();
    
    // Cleanup function
    return () => {
      // We don't cleanup the singleton on unmount
    };
  }, [user, isMounted]);

  // Don't render provider until mounted to avoid hydration issues
  if (!isMounted) {
    return <>{children}</>;
  }

  // Provide context values
  return (
    <StatsigContext.Provider value={{ isReady, client, error }}>
      {client ? (
        <BaseStatsigProvider client={client}>
          {children}
        </BaseStatsigProvider>
      ) : (
        // Render children without Statsig provider if client isn't ready
        children
      )}
    </StatsigContext.Provider>
  );
}

// Cleanup for hot module reloading
if (typeof window !== 'undefined' && (module as any).hot) {
  (module as any).hot.dispose(() => {
    statsigSingleton = null;
    isInitializing = false;
    console.log('[Statsig] Cleaned up client due to HMR');
  });
}

// Hook to safely use Statsig client with proper error handling
export function useStatsig() {
  const { client, isReady } = useStatsigStatus();
  const statsigClient = useStatsigClient()?.client || client;
  
  return {
    client: statsigClient,
    isReady: !!statsigClient,
    hasError: !statsigClient && isReady,
    
    // Feature Gates
    checkGate: (gateName: string): boolean => {
      if (!statsigClient) {
        console.warn(`[Statsig] Cannot check gate "${gateName}" - client not ready`);
        return false;
      }
      try {
        return statsigClient.checkGate(gateName);
      } catch (error) {
        console.error(`[Statsig] Error checking gate "${gateName}":`, error);
        return false;
      }
    },
    
    // Dynamic Configs
    getConfig: (configName: string): any => {
      if (!statsigClient) {
        console.warn(`[Statsig] Cannot get config "${configName}" - client not ready`);
        return {};
      }
      try {
        return statsigClient.getDynamicConfig(configName);
      } catch (error) {
        console.error(`[Statsig] Error getting config "${configName}":`, error);
        return {};
      }
    },
    
    // Experiments
    getExperiment: (experimentName: string): any => {
      if (!statsigClient) {
        console.warn(`[Statsig] Cannot get experiment "${experimentName}" - client not ready`);
        return {};
      }
      try {
        return statsigClient.getExperiment(experimentName);
      } catch (error) {
        console.error(`[Statsig] Error getting experiment "${experimentName}":`, error);
        return {};
      }
    },
    
    // Event Logging
    logEvent: (eventName: string, value?: string | number, metadata?: Record<string, any>): void => {
      if (!statsigClient) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Statsig] Event logged (no client): ${eventName}`, { value, metadata });
        }
        return;
      }
      
      try {
        statsigClient.logEvent(eventName, value, metadata);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Statsig] Event logged: ${eventName}`, { value, metadata });
        }
      } catch (error) {
        console.error(`[Statsig] Error logging event "${eventName}":`, error);
      }
    }
  };
}

// Convenience hooks for specific use cases
export function useFeatureFlag(gateName: string) {
  const { checkGate, isReady, hasError } = useStatsig();
  
  return {
    isEnabled: checkGate(gateName),
    isReady,
    hasError,
    shouldShow: isReady && checkGate(gateName)
  };
}

export function useStatsigConfig(configName: string) {
  const { getConfig, isReady, hasError } = useStatsig();
  
  return {
    config: getConfig(configName),
    isReady,
    hasError,
    getValue: (key: string, fallback: any = null) => {
      const config = getConfig(configName);
      return config?.get ? config.get(key, fallback) : fallback;
    }
  };
}

export function useStatsigExperiment(experimentName: string) {
  const { getExperiment, isReady, hasError } = useStatsig();
  
  return {
    experiment: getExperiment(experimentName),
    isReady,
    hasError,
    getValue: (key: string, fallback: any = null) => {
      const experiment = getExperiment(experimentName);
      return experiment?.get ? experiment.get(key, fallback) : fallback;
    }
  };
} 