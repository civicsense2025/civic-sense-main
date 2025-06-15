'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { StatsigProvider as BaseStatsigProvider, useStatsigClient } from '@statsig/react-bindings'
import { useAuth } from '@/components/auth/auth-provider'

interface StatsigContextType {
  isReady: boolean
  hasError: boolean
  checkGate: (gateName: string) => boolean
  getConfig: (configName: string) => any
  getExperiment: (experimentName: string) => any
  logEvent: (eventName: string, value?: string | number, metadata?: Record<string, any>) => void
}

const StatsigContext = createContext<StatsigContextType | undefined>(undefined)

interface StatsigProviderProps {
  children: React.ReactNode
}

export function StatsigProvider({ children }: StatsigProviderProps) {
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY
  const { user, isLoading: authLoading } = useAuth()
  const [initError, setInitError] = useState<Error | null>(null)

  // Wait for auth to complete before initializing Statsig
  if (authLoading) {
    return <>{children}</>
  }

  if (!clientKey) {
    console.warn('NEXT_PUBLIC_STATSIG_CLIENT_KEY is not configured. Statsig features will be disabled.')
    return (
      <StatsigContext.Provider value={{
        isReady: false,
        hasError: false,
        checkGate: () => false,
        getConfig: () => ({}),
        getExperiment: () => ({}),
        logEvent: () => {}
      }}>
        {children}
      </StatsigContext.Provider>
    )
  }

  // If there was an initialization error, provide fallback context
  if (initError) {
    console.warn('Statsig failed to initialize, running in fallback mode:', initError.message)
    return (
      <StatsigContext.Provider value={{
        isReady: false,
        hasError: true,
        checkGate: () => false, // Default to false for feature gates
        getConfig: () => ({}), // Return empty config
        getExperiment: () => ({}), // Return empty experiment
        logEvent: (eventName, value, metadata) => {
          // Fallback logging - you could send to another analytics service here
          console.log('Statsig Event (fallback):', { eventName, value, metadata })
        }
      }}>
        {children}
      </StatsigContext.Provider>
    )
  }

  // Create user object for Statsig
  const statsigUser = user ? {
    userID: user.id,
    email: user.email || undefined,
    custom: {
      created_at: user.created_at,
      // Add any other user metadata you want to use for targeting
    }
  } : {
    userID: 'anonymous'
  }

  return (
    <BaseStatsigProvider
      sdkKey={clientKey}
      user={statsigUser}
      options={{
        environment: { tier: process.env.NODE_ENV === 'production' ? 'production' : 'development' },
        // Disable logging in production for better performance
        disableLogging: process.env.NODE_ENV === 'production',
        // Enable compression for smaller payloads
        disableCompression: false,
      }}
    >
      <StatsigInnerProvider onError={setInitError}>
        {children}
      </StatsigInnerProvider>
    </BaseStatsigProvider>
  )
}

function StatsigInnerProvider({ children, onError }: { children: React.ReactNode, onError: (error: Error) => void }) {
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { client } = useStatsigClient()

  useEffect(() => {
    if (client) {
      try {
        // The client should already be initialized when we get it
        setIsReady(true)
        setHasError(false)
      } catch (error) {
        console.error('Error setting up Statsig client:', error)
        setHasError(true)
        onError(error as Error)
      }
    }
  }, [client, onError])

  const checkGate = (gateName: string) => {
    if (!client || !isReady || hasError) return false
    try {
      return client.checkGate(gateName)
    } catch (error) {
      console.error('Error checking gate:', error)
      return false
    }
  }

  const getConfig = (configName: string) => {
    if (!client || !isReady || hasError) return {}
    try {
      return client.getDynamicConfig(configName)
    } catch (error) {
      console.error('Error getting config:', error)
      return {}
    }
  }

  const getExperiment = (experimentName: string) => {
    if (!client || !isReady || hasError) return {}
    try {
      return client.getExperiment(experimentName)
    } catch (error) {
      console.error('Error getting experiment:', error)
      return {}
    }
  }

  const logEvent = (eventName: string, value?: string | number, metadata?: Record<string, any>) => {
    if (!client || !isReady) {
      // Fallback logging when Statsig is not ready
      console.log('Statsig Event (not ready):', { eventName, value, metadata })
      return
    }
    try {
      client.logEvent(eventName, value, metadata)
    } catch (error) {
      console.error('Error logging event:', error)
      // Fallback logging
      console.log('Statsig Event (error fallback):', { eventName, value, metadata })
    }
  }

  return (
    <StatsigContext.Provider value={{
      isReady,
      hasError,
      checkGate,
      getConfig,
      getExperiment,
      logEvent
    }}>
      {children}
    </StatsigContext.Provider>
  )
}

export function useStatsig() {
  const context = useContext(StatsigContext)
  if (context === undefined) {
    throw new Error('useStatsig must be used within a StatsigProvider')
  }
  return context
}

// Convenience hooks for common use cases
export function useFeatureFlag(gateName: string) {
  const { checkGate, isReady, hasError } = useStatsig()
  return {
    isEnabled: checkGate(gateName),
    isReady,
    hasError
  }
}

export function useStatsigConfig(configName: string) {
  const { getConfig, isReady, hasError } = useStatsig()
  return {
    config: getConfig(configName),
    isReady,
    hasError
  }
}

export function useStatsigExperiment(experimentName: string) {
  const { getExperiment, isReady, hasError } = useStatsig()
  return {
    experiment: getExperiment(experimentName),
    isReady,
    hasError
  }
} 