'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { StatsigProvider as BaseStatsigProvider, useClientAsyncInit } from '@statsig/react-bindings'
import { debug } from '@civicsense/shared/debug-config'

// Global reference for non-React usage
let globalStatsigClient: any = null

interface StatsigWrapperProps {
  children: ReactNode
}

// Hook to track Statsig status
function useStatsigStatus() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Check if Statsig client is available
    if (globalStatsigClient) {
      setIsReady(true)
      setError(null)
    }
  }, [])

  return { isReady, error }
}

function StatsigClientProvider({ children }: StatsigWrapperProps) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Get client key
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;

  // Disable Statsig in development with dummy key to prevent network errors
  const isDummyKey = clientKey === 'dummy_key' || !clientKey || clientKey.includes('dummy');
  
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

  // Mount check to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Statsig client if not using dummy key
  const { client, isLoading } = useClientAsyncInit(
    isDummyKey ? '' : clientKey || '', // Use empty string if dummy key
    statsigUser,
    {
      environment: { tier: process.env.NODE_ENV === 'production' ? 'production' : 'development' },
    }
  );

  // Handle client initialization
  useEffect(() => {
    if (!isMounted) return;

    if (isDummyKey) {
      // Skip Statsig initialization for dummy keys
      console.log('[Statsig] Skipping initialization with dummy key');
      setIsReady(true);
      return;
    }

    if (client && !isLoading) {
      setIsReady(true);
      setError(null);
      globalStatsigClient = client;
      
      // Expose client globally for feature flag system
      if (typeof window !== 'undefined') {
        (window as any).statsigClient = client;
      }
    }
  }, [client, isLoading, isMounted, isDummyKey]);

  // Don't render anything until mounted
  if (!isMounted) {
    return null;
  }

  // If using dummy key, render children without Statsig provider
  if (isDummyKey) {
    return <>{children}</>;
  }

  // Handle errors
  if (error) {
    console.error('[Statsig] Provider error:', error);
    return <>{children}</>;
  }

  // Wait for client to be ready
  if (!isReady || !client) {
    return <>{children}</>;
  }

  return (
    <BaseStatsigProvider client={client}>
      {children}
    </BaseStatsigProvider>
  );
}

export function StatsigProvider({ children }: StatsigWrapperProps) {
  return (
    <StatsigClientProvider>
      {children}
    </StatsigClientProvider>
  );
}

// Hook to safely use Statsig with proper error handling
export function useStatsig() {
  const { isReady, error } = useStatsigStatus();
  
  // Import hooks from react-bindings (but avoid calling them from outside component bodies)
  let checkGate: (gateName: string) => boolean = () => false;
  let getDynamicConfig: (configName: string) => any = () => ({});
  let getExperiment: (experimentName: string) => any = () => ({});
  let logEvent: (eventName: string, value?: string | number, metadata?: Record<string, any>) => void = () => {};

  try {
    // Use the underlying client directly to avoid hook usage outside React contexts
    checkGate = (gateName: string): boolean => {
      try {
        return globalStatsigClient ? globalStatsigClient.checkGate(gateName) : false;
      } catch (err) {
        console.warn(`[Statsig] Error checking gate "${gateName}":`, err);
        return false;
      }
    };

    getDynamicConfig = (configName: string): any => {
      try {
        return globalStatsigClient ? globalStatsigClient.getConfig(configName) : {};
      } catch (err) {
        console.warn(`[Statsig] Error getting config "${configName}":`, err);
        return {};
      }
    };

    getExperiment = (experimentName: string): any => {
      try {
        return globalStatsigClient ? globalStatsigClient.getExperiment(experimentName) : {};
      } catch (err) {
        console.warn(`[Statsig] Error getting experiment "${experimentName}":`, err);
        return {};
      }
    };

    logEvent = (eventName: string, value?: string | number, metadata?: Record<string, any>): void => {
      try {
        const client = globalStatsigClient;
        if (client) {
          client.logEvent(eventName, value, metadata);
          debug.log('analytics', `Event logged: ${eventName}`, { value, metadata });
        } else {
          debug.log('analytics', `Event queued (client not ready): ${eventName}`, { value, metadata });
        }
      } catch (error) {
        console.warn(`[Statsig] Error logging event "${eventName}":`, error);
      }
    };
  } catch (error) {
    console.warn('[Statsig] Statsig client not available:', error);
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