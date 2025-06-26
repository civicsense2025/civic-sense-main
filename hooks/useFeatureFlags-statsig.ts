import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { envFeatureFlags, type AllFeatureFlags, type PremiumFeatureFlags } from '@/lib/env-feature-flags'
import { useStatsig, useFeatureFlag as useStatsigFeatureFlag } from '@/components/providers/statsig-provider'
import type { User } from 'types'

// Enhanced hook that uses Statsig with fallback to environment flags
export function useFeatureFlags(user?: User | null) {
  const [flags, setFlags] = useState<AllFeatureFlags>(envFeatureFlags.getAllFlags())
  const { isReady: statsigReady, checkGate, logEvent } = useStatsig()

  const applyUserSpecificFlags = useCallback((baseFlags: AllFeatureFlags, user?: User | null): AllFeatureFlags => {
    if (!user) {
      // Guest user - disable premium and admin features
      return {
        ...baseFlags,
        // Premium features
        customDecks: false,
        historicalProgress: false,
        advancedAnalytics: false,
        spacedRepetition: false,
        learningInsights: false,
        prioritySupport: false,
        offlineMode: false,
        dataExport: false,
        premiumBadges: false,
        premiumOnboarding: false,
        billingManagement: false,
        // Admin features
        adminMenuItem: false,
        adminAccess: false,
        // Show upgrade prompts to guests
        upgradePrompts: baseFlags.upgradePrompts
      }
    }

    const hasActivePremium = user.subscription?.status === 'active' && 
                            (user.subscription?.plan === 'premium' || user.subscription?.plan === 'pro')
    
    const isAdmin = user.role === 'admin'

    return {
      ...baseFlags,
      // Premium features - enable if user has active premium subscription
      customDecks: hasActivePremium && baseFlags.customDecks,
      historicalProgress: hasActivePremium && baseFlags.historicalProgress,
      advancedAnalytics: hasActivePremium && baseFlags.advancedAnalytics,
      spacedRepetition: hasActivePremium && baseFlags.spacedRepetition,
      learningInsights: hasActivePremium && baseFlags.learningInsights,
      prioritySupport: hasActivePremium && baseFlags.prioritySupport,
      offlineMode: hasActivePremium && baseFlags.offlineMode,
      dataExport: hasActivePremium && baseFlags.dataExport,
      premiumBadges: hasActivePremium && baseFlags.premiumBadges,
      premiumOnboarding: hasActivePremium && baseFlags.premiumOnboarding,
      billingManagement: hasActivePremium && baseFlags.billingManagement,
      
      // Show upgrade prompts only to free users
      upgradePrompts: !hasActivePremium && baseFlags.upgradePrompts,
      
      // Admin features - enable if user is admin
      adminMenuItem: isAdmin && baseFlags.adminMenuItem,
      adminAccess: isAdmin && baseFlags.adminAccess
    }
  }, [])

  const getStatsigFlags = useCallback((): AllFeatureFlags => {
    if (!statsigReady) {
      return envFeatureFlags.getAllFlags()
    }

    // Get all flags from Statsig
    const statsigFlags = {} as AllFeatureFlags
    const flagKeys = Object.keys(envFeatureFlags.getAllFlags()) as (keyof AllFeatureFlags)[]
    
    for (const flag of flagKeys) {
      try {
        const gateKey = `civicsense_${flag}`
        statsigFlags[flag] = checkGate(gateKey)
      } catch (error) {
        // Fallback to environment flag if Statsig gate doesn't exist
        statsigFlags[flag] = envFeatureFlags.getFlag(flag)
      }
    }
    
    return statsigFlags
  }, [statsigReady, checkGate])

  useEffect(() => {
    // Get base flags (from Statsig if ready, otherwise from environment)
    const baseFlags = statsigReady ? getStatsigFlags() : envFeatureFlags.getAllFlags()
    
    // Apply user-specific overrides
    const userFlags = applyUserSpecificFlags(baseFlags, user)
    
    setFlags(userFlags)

    // Listen for feature flag changes (development only)
    const handleFeatureFlagsChange = () => {
      const newBaseFlags = statsigReady ? getStatsigFlags() : envFeatureFlags.getAllFlags()
      const newUserFlags = applyUserSpecificFlags(newBaseFlags, user)
      setFlags(newUserFlags)
    }

    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('featureFlagsChanged', handleFeatureFlagsChange)
      return () => window.removeEventListener('featureFlagsChanged', handleFeatureFlagsChange)
    }
  }, [user, statsigReady, getStatsigFlags, applyUserSpecificFlags])

  return flags
}

// Enhanced hook for checking a specific feature flag with Statsig analytics
export function useFeatureFlag(flag: keyof AllFeatureFlags, user?: User | null): boolean {
  const flags = useFeatureFlags(user)
  const { logEvent, isReady: statsigReady } = useStatsig()
  
  // Log feature flag usage for analytics (only in production with Statsig)
  useEffect(() => {
    if (statsigReady && flags[flag]) {
      logEvent('feature_flag_usage', 1, {
        flag_name: flag,
        enabled: flags[flag],
        user_type: user ? (user.subscription?.status === 'active' ? 'premium' : 'free') : 'guest',
        source: 'react_hook'
      })
    }
  }, [flag, flags, user, statsigReady, logEvent])
  
  return flags[flag]
}

// Hook specifically for premium features with subscription checking
export function usePremiumFeatureFlag(flag: keyof PremiumFeatureFlags, user?: User | null): boolean {
  const flags = useFeatureFlags(user)
  const { logEvent, isReady: statsigReady } = useStatsig()
  
  // Log premium feature access attempts
  useEffect(() => {
    if (statsigReady) {
      logEvent('premium_feature_check', 1, {
        flag_name: flag,
        enabled: flags[flag],
        user_has_premium: user?.subscription?.status === 'active',
        user_plan: user?.subscription?.plan || 'none'
      })
    }
  }, [flag, flags, user, statsigReady, logEvent])
  
  return flags[flag]
}

// Server-side function to get feature flags for a user (fallback only)
export function getServerSideFeatureFlags(user?: User | null): AllFeatureFlags {
  const baseFlags = envFeatureFlags.getAllFlags()
  return applyUserSpecificFlags(baseFlags, user)
}

// Apply user-specific flag overrides based on subscription and role
function applyUserSpecificFlags(baseFlags: AllFeatureFlags, user?: User | null): AllFeatureFlags {
  if (!user) {
    // Guest user - disable premium and admin features
    return {
      ...baseFlags,
      // Premium features
      customDecks: false,
      historicalProgress: false,
      advancedAnalytics: false,
      spacedRepetition: false,
      learningInsights: false,
      prioritySupport: false,
      offlineMode: false,
      dataExport: false,
      premiumBadges: false,
      premiumOnboarding: false,
      billingManagement: false,
      // Admin features
      adminMenuItem: false,
      adminAccess: false,
      // Show upgrade prompts to guests
      upgradePrompts: baseFlags.upgradePrompts
    }
  }

  const hasActivePremium = user.subscription?.status === 'active' && 
                          (user.subscription?.plan === 'premium' || user.subscription?.plan === 'pro')
  
  const isAdmin = user.role === 'admin'

  return {
    ...baseFlags,
    // Premium features - enable if user has active premium subscription
    customDecks: hasActivePremium && baseFlags.customDecks,
    historicalProgress: hasActivePremium && baseFlags.historicalProgress,
    advancedAnalytics: hasActivePremium && baseFlags.advancedAnalytics,
    spacedRepetition: hasActivePremium && baseFlags.spacedRepetition,
    learningInsights: hasActivePremium && baseFlags.learningInsights,
    prioritySupport: hasActivePremium && baseFlags.prioritySupport,
    offlineMode: hasActivePremium && baseFlags.offlineMode,
    dataExport: hasActivePremium && baseFlags.dataExport,
    premiumBadges: hasActivePremium && baseFlags.premiumBadges,
    premiumOnboarding: hasActivePremium && baseFlags.premiumOnboarding,
    billingManagement: hasActivePremium && baseFlags.billingManagement,
    
    // Show upgrade prompts only to free users
    upgradePrompts: !hasActivePremium && baseFlags.upgradePrompts,
    
    // Admin features - enable if user is admin
    adminMenuItem: isAdmin && baseFlags.adminMenuItem,
    adminAccess: isAdmin && baseFlags.adminAccess
  }
}

// Utility function to check if a feature is enabled
export function isFeatureEnabled(flag: keyof AllFeatureFlags, user?: User | null): boolean {
  const flags = getServerSideFeatureFlags(user)
  return flags[flag]
}

// Higher-order component to conditionally render based on feature flags
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flag: keyof AllFeatureFlags,
  fallback?: React.ComponentType<P> | null
) {
  return function FeatureFlaggedComponent(props: P & { user?: User | null }) {
    const { user, ...componentProps } = props
    const isEnabled = useFeatureFlag(flag, user)
    
    if (!isEnabled) {
      return fallback ? React.createElement(fallback, componentProps as P) : null
    }
    
    return React.createElement(Component, componentProps as P)
  }
}

// Component wrapper for feature flags
interface FeatureFlagProps {
  flag: keyof AllFeatureFlags
  user?: User | null
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureFlag({ flag, user, children, fallback = null }: FeatureFlagProps): React.ReactElement | null {
  const isEnabled = useFeatureFlag(flag, user)
  
  if (!isEnabled) {
    return React.createElement(React.Fragment, {}, fallback)
  }
  
  return React.createElement(React.Fragment, {}, children)
}

// Premium feature wrapper component
interface PremiumFeatureProps {
  flag: keyof PremiumFeatureFlags
  user?: User | null
  children: React.ReactNode
  upgradePrompt?: React.ReactNode
}

export function PremiumFeature({ flag, user, children, upgradePrompt }: PremiumFeatureProps): React.ReactElement | null {
  const isEnabled = usePremiumFeatureFlag(flag, user)
  const showUpgradePrompts = useFeatureFlag('upgradePrompts', user)
  
  if (!isEnabled) {
    if (showUpgradePrompts && upgradePrompt) {
      return React.createElement(React.Fragment, {}, upgradePrompt)
    }
    return null
  }
  
  return React.createElement(React.Fragment, {}, children)
}

// Development hook to see flag sources
export function useFeatureFlagDebug(flag: keyof AllFeatureFlags) {
  const { isReady: statsigReady, checkGate } = useStatsig()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  const envValue = envFeatureFlags.getFlag(flag)
  let statsigValue = false
  let statsigError = null
  
  try {
    if (statsigReady) {
      statsigValue = checkGate(`civicsense_${flag}`)
    }
  } catch (error) {
    statsigError = error
  }
  
  return {
    flag,
    sources: {
      env: envValue,
      statsig: statsigReady ? statsigValue : 'not_ready',
      error: statsigError
    },
    active: statsigReady ? statsigValue : envValue
  }
} 