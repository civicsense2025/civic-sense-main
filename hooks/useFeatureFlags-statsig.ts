import { envFeatureFlags, type AllFeatureFlags, type PremiumFeatureFlags } from '@/lib/env-feature-flags'
import type { User } from 'types'

/**
 * EMERGENCY FIX: Completely static implementation to prevent infinite re-renders
 * - NO useState
 * - NO useEffect  
 * - NO complex logic
 * - Just returns static environment flags
 */

// Static flags - no state management to prevent re-renders
const STATIC_FLAGS = envFeatureFlags.getAllFlags()

// Enhanced hook that uses only static environment flags (no Statsig to prevent loops)
export function useFeatureFlags(user?: User | null | undefined): { 
  flags: AllFeatureFlags
  isReady: boolean
  isStatsigReady: boolean
} {
  // Return static flags immediately - no state, no effects, no loops
  return {
    flags: STATIC_FLAGS,
    isReady: true,
    isStatsigReady: false // Always false to prevent any Statsig-related logic
  }
}

// Individual feature flag hook - STATIC
export function useFeatureFlag(flag: keyof AllFeatureFlags, user?: User | null | undefined): boolean {
  return STATIC_FLAGS[flag] || false
}

// Premium feature flag hook - STATIC
export function usePremiumFeatureFlag(flag: keyof PremiumFeatureFlags, user?: User | null | undefined): boolean {
  // For premium flags, check user subscription status
  const isPremium = user?.subscription?.status === 'active' || 
                   user?.subscription?.status === 'trialing' ||
                   user?.subscription?.plan === 'lifetime'
  
  // If user has premium access, return true for all premium features
  if (isPremium) {
    return true
  }
  
  // Otherwise return static environment flag
  return STATIC_FLAGS[flag] || false
}

// Batch feature flag checker - STATIC
export function useBatchFeatureFlags(flagNames: (keyof AllFeatureFlags)[], user?: User | null | undefined): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  flagNames.forEach(flagName => {
    result[flagName] = STATIC_FLAGS[flagName] || false
  })
  return result
}

// Export stable references
export const stableFeatureFlagHooks = {
  useFeatureFlag,
  usePremiumFeatureFlag,
  useBatchFeatureFlags
} as const

// Server-side function to get feature flags for a user (fallback only)
export function getServerSideFeatureFlags(user?: User | null | undefined): AllFeatureFlags {
  const baseFlags = envFeatureFlags.getAllFlags()
  return applyUserSpecificFlagsStandalone(baseFlags, user || null)
}

// Apply user-specific flag overrides based on subscription and role
function applyUserSpecificFlagsStandalone(baseFlags: AllFeatureFlags, user?: User | null): AllFeatureFlags {
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