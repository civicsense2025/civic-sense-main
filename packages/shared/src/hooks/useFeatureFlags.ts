// DEPRECATED: This file is being replaced by useFeatureFlags-statsig.ts
// TODO: Remove this file after migration is complete
import React from 'react'
import { useState, useEffect } from 'react'
import { envFeatureFlags, type AllFeatureFlags, type PremiumFeatureFlags } from '../lib/env-feature-flags'
import type { User } from 'types'

console.warn('useFeatureFlags.ts is deprecated. Please import from useFeatureFlags-statsig.ts')

export function useFeatureFlags(user?: User | null) {
  const [flags, setFlags] = useState<AllFeatureFlags>(envFeatureFlags.getAllFlags())

  useEffect(() => {
    // Get base flags from environment
    const baseFlags = envFeatureFlags.getAllFlags()
    
    // Apply user-specific overrides
    const userFlags = applyUserSpecificFlags(baseFlags, user)
    
    setFlags(userFlags)

    // Listen for feature flag changes (development only)
    const handleFeatureFlagsChange = () => {
      const newBaseFlags = envFeatureFlags.getAllFlags()
      const newUserFlags = applyUserSpecificFlags(newBaseFlags, user)
      setFlags(newUserFlags)
    }

    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('featureFlagsChanged', handleFeatureFlagsChange)
      return () => window.removeEventListener('featureFlagsChanged', handleFeatureFlagsChange)
    }
  }, [user])

  return flags
}

// Hook for checking a specific feature flag
export function useFeatureFlag(flag: keyof AllFeatureFlags, user?: User | null): boolean {
  const flags = useFeatureFlags(user)
  return flags[flag]
}

// Hook specifically for premium features with subscription checking
export function usePremiumFeatureFlag(flag: keyof PremiumFeatureFlags, user?: User | null): boolean {
  const flags = useFeatureFlags(user)
  return flags[flag]
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

// Server-side function to get feature flags for a user
export function getServerSideFeatureFlags(user?: User | null): AllFeatureFlags {
  const baseFlags = envFeatureFlags.getAllFlags()
  return applyUserSpecificFlags(baseFlags, user)
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