/**
 * CivicSense Feature Flags Types
 * Types for managing feature flags and toggles
 */

export interface CoreFeatureFlags {
  enableNewQuizEngine: boolean
  enableProgressTracking: boolean
  enableGamification: boolean
  enableAIFeatures: boolean
}

export interface NavigationFeatureFlags {
  enableNewNavigation: boolean
  enableSidebarNav: boolean
  enableMobileNav: boolean
}

export interface PremiumFeatureFlags {
  enablePremiumFeatures: boolean
  enableTeamFeatures: boolean
  enableAdvancedAnalytics: boolean
}

export type AllFeatureFlags = CoreFeatureFlags & NavigationFeatureFlags & PremiumFeatureFlags

export interface FeatureFlagService {
  isEnabled(flag: keyof AllFeatureFlags): boolean
  setFlag(flag: keyof AllFeatureFlags, value: boolean): void
  getFlags(): AllFeatureFlags
} 