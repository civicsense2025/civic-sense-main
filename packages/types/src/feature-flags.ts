/**
 * CivicSense Feature Flags Types
 * Types for managing feature flags and toggles
 */

export interface NavigationFeatureFlags {
  globalSearch: boolean;
  userMenu: boolean;
  civicsTestMenuItem: boolean;
  quizMenuItem: boolean;
  scenariosMenuItem: boolean;
  progressMenuItem: boolean;
  learningPodsMenuItem: boolean;
  dashboardMenuItem: boolean;
  settingsMenuItem: boolean;
  adminMenuItem: boolean;
  themeToggleMenuItem: boolean;
  mobileMenu: boolean;
}

export interface PremiumFeatureFlags {
  customDecks: boolean;
  historicalProgress: boolean;
  advancedAnalytics: boolean;
  spacedRepetition: boolean;
  learningInsights: boolean;
  prioritySupport: boolean;
  offlineMode: boolean;
  dataExport: boolean;
  premiumBadges: boolean;
  upgradePrompts: boolean;
  premiumOnboarding: boolean;
  billingManagement: boolean;
}

export interface CoreFeatureFlags {
  multiplayer: boolean;
  learningPods: boolean;
  scenarios: boolean;
  civicsTest: boolean;
  quizzes: boolean;
  surveys: boolean;
  adminAccess: boolean;
  debugRoutes: boolean;
  debugPanels: boolean;
  signUpFlow: boolean;
  socialLogin: boolean;
  guestAccess: boolean;
  notifications: boolean;
  emailMarketing: boolean;
  chatSupport: boolean;
  analyticsTracking: boolean;
  errorReporting: boolean;
  performanceMonitoring: boolean;
  experimentalFeatures: boolean;
  betaFeatures: boolean;
  alphaFeatures: boolean;
}

export interface AllFeatureFlags extends NavigationFeatureFlags, PremiumFeatureFlags, CoreFeatureFlags {}

// Environment configuration for feature flags
export interface FeatureFlagEnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  VERCEL_ENV?: 'production' | 'preview' | 'development';
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

export interface FeatureFlagService {
  isEnabled(flag: keyof AllFeatureFlags): boolean
  setFlag(flag: keyof AllFeatureFlags, value: boolean): void
  getFlags(): AllFeatureFlags
} 