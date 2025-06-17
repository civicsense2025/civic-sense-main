'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  LogLevel,
  StatsigProvider as BaseStatsigProvider,
  useClientAsyncInit,
} from '@statsig/react-bindings'
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics'
import { useAuth } from '@/components/auth/auth-provider'

// Create a context for Statsig status
type StatsigContextType = {
  isReady: boolean;
  error: Error | null;
};

const StatsigContext = createContext<StatsigContextType>({
  isReady: false,
  error: null,
});

// Hook to use Statsig context
export const useStatsigStatus = () => useContext(StatsigContext);

interface StatsigWrapperProps {
  children: React.ReactNode;
}

function StatsigClientProvider({ children }: StatsigWrapperProps) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get client key
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;

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

  // Initialize Statsig client only if we have a client key
  const { client, isLoading } = useClientAsyncInit(
    clientKey || 'dummy_key', // Provide dummy key to avoid hook issues
    statsigUser,
    {
      environment: { 
        tier: process.env.NODE_ENV === 'production' ? 'production' : 'development' 
      },
      logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Warn,
      plugins: clientKey ? [new StatsigAutoCapturePlugin()] : [],
    }
  );

  // Update ready state when client is ready
  useEffect(() => {
    if (!clientKey) {
      console.warn('[Statsig] NEXT_PUBLIC_STATSIG_CLIENT_KEY is not configured. Statsig features will be disabled.');
      setError(new Error('Statsig client key not configured'));
      return;
    }

    if (client && !isLoading) {
      setIsReady(true);
      setError(null);
      console.log('[Statsig] Client initialized successfully');
    } else if (!isLoading && !client) {
      setError(new Error('Failed to initialize Statsig client'));
    }
  }, [client, isLoading, clientKey]);

  // Provide context values
  return (
    <StatsigContext.Provider value={{ isReady, error }}>
      <BaseStatsigProvider client={client}>
        {children}
      </BaseStatsigProvider>
    </StatsigContext.Provider>
  );
}

export function StatsigProvider({ children }: StatsigWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render provider until mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <StatsigContext.Provider value={{ isReady: false, error: null }}>
        {children}
      </StatsigContext.Provider>
    );
  }

  return (
    <StatsigClientProvider>
      {children}
    </StatsigClientProvider>
  );
}

// Hook to safely use Statsig with proper error handling
export function useStatsig() {
  const { isReady, error } = useStatsigStatus();
  
  // Import hooks from react-bindings
  let checkGate: (gateName: string) => boolean = () => false;
  let getDynamicConfig: (configName: string) => any = () => ({});
  let getExperiment: (experimentName: string) => any = () => ({});
  let logEvent: (eventName: string, value?: string | number, metadata?: Record<string, any>) => void = () => {};

  try {
    // These hooks must be called unconditionally
    const { useGate, useConfig, useExperiment, useStatsigClient } = require('@statsig/react-bindings');
    
    const gateHook = useGate;
    const configHook = useConfig;
    const experimentHook = useExperiment;
    const clientHook = useStatsigClient;

    checkGate = (gateName: string): boolean => {
      try {
        const gate = gateHook(gateName);
        return gate?.value || false;
      } catch (error) {
        console.warn(`[Statsig] Error checking gate "${gateName}":`, error);
        return false;
      }
    };

    getDynamicConfig = (configName: string): any => {
      try {
        const config = configHook(configName);
        return config?.config || {};
      } catch (error) {
        console.warn(`[Statsig] Error getting config "${configName}":`, error);
        return {};
      }
    };

    getExperiment = (experimentName: string): any => {
      try {
        const experiment = experimentHook(experimentName);
        return experiment?.config || {};
      } catch (error) {
        console.warn(`[Statsig] Error getting experiment "${experimentName}":`, error);
        return {};
      }
    };

    logEvent = (eventName: string, value?: string | number, metadata?: Record<string, any>): void => {
      try {
        const client = clientHook();
        if (client?.client) {
          client.client.logEvent(eventName, value, metadata);
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Statsig] Event logged: ${eventName}`, { value, metadata });
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`[Statsig] Event logged (no client): ${eventName}`, { value, metadata });
        }
      } catch (error) {
        console.warn(`[Statsig] Error logging event "${eventName}":`, error);
      }
    };
  } catch (error) {
    console.warn('[Statsig] React bindings not available:', error);
  }
  
  return {
    isReady,
    hasError: !!error,
    error,
    checkGate,
    getConfig: getDynamicConfig,
    getExperiment,
    logEvent,
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