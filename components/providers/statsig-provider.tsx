'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { StatsigProvider as BaseStatsigProvider, useStatsigClient } from '@statsig/react-bindings'
import { useAuth } from '@/components/auth/auth-provider'

interface StatsigContextType {
  isReady: boolean
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

  // Wait for auth to complete before initializing Statsig
  if (authLoading) {
    return <>{children}</>
  }

  if (!clientKey) {
    console.warn('NEXT_PUBLIC_STATSIG_CLIENT_KEY is not configured. Statsig features will be disabled.')
    return (
      <StatsigContext.Provider value={{
        isReady: false,
        checkGate: () => false,
        getConfig: () => ({}),
        getExperiment: () => ({}),
        logEvent: () => {}
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
        environment: { tier: process.env.NODE_ENV === 'production' ? 'production' : 'development' }
      }}
    >
      <StatsigInnerProvider>
        {children}
      </StatsigInnerProvider>
    </BaseStatsigProvider>
  )
}

function StatsigInnerProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const { client } = useStatsigClient()

  useEffect(() => {
    if (client) {
      // The client should already be initialized when we get it
      setIsReady(true)
    }
  }, [client])

  const checkGate = (gateName: string) => {
    if (!client || !isReady) return false
    try {
      return client.checkGate(gateName)
    } catch (error) {
      console.error('Error checking gate:', error)
      return false
    }
  }

  const getConfig = (configName: string) => {
    if (!client || !isReady) return {}
    try {
      return client.getDynamicConfig(configName)
    } catch (error) {
      console.error('Error getting config:', error)
      return {}
    }
  }

  const getExperiment = (experimentName: string) => {
    if (!client || !isReady) return {}
    try {
      return client.getExperiment(experimentName)
    } catch (error) {
      console.error('Error getting experiment:', error)
      return {}
    }
  }

  const logEvent = (eventName: string, value?: string | number, metadata?: Record<string, any>) => {
    if (!client || !isReady) return
    try {
      client.logEvent(eventName, value, metadata)
    } catch (error) {
      console.error('Error logging event:', error)
    }
  }

  return (
    <StatsigContext.Provider value={{
      isReady,
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
  const { checkGate, isReady } = useStatsig()
  return {
    isEnabled: checkGate(gateName),
    isReady
  }
}

export function useStatsigConfig(configName: string) {
  const { getConfig, isReady } = useStatsig()
  return {
    config: getConfig(configName),
    isReady
  }
}

export function useStatsigExperiment(experimentName: string) {
  const { getExperiment, isReady } = useStatsig()
  return {
    experiment: getExperiment(experimentName),
    isReady
  }
} 