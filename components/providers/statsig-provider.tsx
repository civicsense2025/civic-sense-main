'use client'

import React, { useEffect } from 'react'
import {
  LogLevel,
  StatsigProvider as BaseStatsigProvider,
  useClientAsyncInit,
  useStatsigClient
} from '@statsig/react-bindings'
import { runStatsigAutoCapture } from '@statsig/web-analytics'
import { useAuth } from '@/components/auth/auth-provider'

interface StatsigWrapperProps {
  children: React.ReactNode
}

function StatsigContent({ children }: StatsigWrapperProps) {
  const { user, isLoading: authLoading } = useAuth()
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY

  // Create user object for Statsig following their documentation
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
  }

  // Use the official useClientAsyncInit pattern from Statsig docs
  const { client } = useClientAsyncInit(
    clientKey || '',
    statsigUser,
    {
      environment: { 
        tier: process.env.NODE_ENV === 'production' ? 'production' : 'development' 
      },
      logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Error,
    }
  )

  // Initialize auto-capture when client is ready (following docs exactly)
  useEffect(() => {
    if (client) {
      runStatsigAutoCapture(client)
      console.log('[Statsig] Client initialized and auto-capture started')
    }
  }, [client])

  return (
    <BaseStatsigProvider client={client}>
      {children}
    </BaseStatsigProvider>
  )
}

export function StatsigProvider({ children }: StatsigWrapperProps) {
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY

  // If no client key, render children without Statsig
  if (!clientKey) {
    console.warn('[Statsig] NEXT_PUBLIC_STATSIG_CLIENT_KEY is not configured. Statsig features will be disabled.')
    return <>{children}</>
  }

  return (
    <StatsigContent>
      {children}
    </StatsigContent>
  )
}

// Hook to safely use Statsig client with proper error handling
export function useStatsig() {
  try {
    const { client } = useStatsigClient()
    
    return {
      client,
      isReady: !!client,
      hasError: false,
      
      // Feature Gates
      checkGate: (gateName: string): boolean => {
        if (!client) {
          console.warn(`[Statsig] Cannot check gate "${gateName}" - client not ready`)
          return false
        }
        try {
          return client.checkGate(gateName)
        } catch (error) {
          console.error(`[Statsig] Error checking gate "${gateName}":`, error)
          return false
        }
      },
      
      // Dynamic Configs
      getConfig: (configName: string): any => {
        if (!client) {
          console.warn(`[Statsig] Cannot get config "${configName}" - client not ready`)
          return {}
        }
        try {
          return client.getDynamicConfig(configName)
        } catch (error) {
          console.error(`[Statsig] Error getting config "${configName}":`, error)
          return {}
        }
      },
      
      // Experiments
      getExperiment: (experimentName: string): any => {
        if (!client) {
          console.warn(`[Statsig] Cannot get experiment "${experimentName}" - client not ready`)
          return {}
        }
        try {
          return client.getExperiment(experimentName)
        } catch (error) {
          console.error(`[Statsig] Error getting experiment "${experimentName}":`, error)
          return {}
        }
      },
      
      // Event Logging (following docs pattern exactly)
      logEvent: (eventName: string, value?: string | number, metadata?: Record<string, any>): void => {
        if (!client) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Statsig] Event logged (no client): ${eventName}`, { value, metadata })
          }
          return
        }
        
        try {
          client.logEvent(eventName, value, metadata)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Statsig] Event logged: ${eventName}`, { value, metadata })
          }
        } catch (error) {
          console.error(`[Statsig] Error logging event "${eventName}":`, error)
          // Fallback logging for development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Statsig] Event logged (fallback): ${eventName}`, { value, metadata })
          }
        }
      }
    }
  } catch (error) {
    // This happens when useStatsigClient is called outside of StatsigProvider
    console.warn('[Statsig] useStatsig called outside of StatsigProvider context:', error)
    
    return {
      client: null,
      isReady: false,
      hasError: true,
      checkGate: () => false,
      getConfig: () => ({}),
      getExperiment: () => ({}),
      logEvent: (eventName: string, value?: string | number, metadata?: Record<string, any>) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Statsig] Event logged (no provider): ${eventName}`, { value, metadata })
        }
      }
    }
  }
}

// Convenience hooks for specific use cases
export function useFeatureFlag(gateName: string) {
  const { checkGate, isReady, hasError } = useStatsig()
  
  return {
    isEnabled: checkGate(gateName),
    isReady,
    hasError,
    // Helper to check if we should show the feature
    shouldShow: isReady && checkGate(gateName)
  }
}

export function useStatsigConfig(configName: string) {
  const { getConfig, isReady, hasError } = useStatsig()
  
  return {
    config: getConfig(configName),
    isReady,
    hasError,
    // Helper to get config value with fallback
    getValue: (key: string, fallback: any = null) => {
      const config = getConfig(configName)
      return config?.get ? config.get(key, fallback) : fallback
    }
  }
}

export function useStatsigExperiment(experimentName: string) {
  const { getExperiment, isReady, hasError } = useStatsig()
  
  return {
    experiment: getExperiment(experimentName),
    isReady,
    hasError,
    // Helper to get experiment value with fallback
    getValue: (key: string, fallback: any = null) => {
      const experiment = getExperiment(experimentName)
      return experiment?.get ? experiment.get(key, fallback) : fallback
    }
  }
} 