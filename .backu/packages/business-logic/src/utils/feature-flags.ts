// lib/env-feature-flags.ts
import type { 
  AllFeatureFlags, 
  NavigationFeatureFlags, 
  PremiumFeatureFlags, 
  CoreFeatureFlags,
  FeatureFlagEnvironmentConfig
} from '@civicsense/types';

class EnvironmentFeatureFlags {
  private readonly STORAGE_KEY = 'civicsense-feature-flags-overrides'
  private readonly isDevelopment = process.env.NODE_ENV === 'development'
  
  // Default values for all flags
  private readonly defaults: AllFeatureFlags = {
    // Navigation flags - generally enabled by default
    globalSearch: true,
    userMenu: true,
    civicsTestMenuItem: true,
    quizMenuItem: true,
    scenariosMenuItem: true,
    progressMenuItem: true,
    learningPodsMenuItem: true,
    dashboardMenuItem: true,
    settingsMenuItem: true,
    adminMenuItem: false, // Admin only
    themeToggleMenuItem: true,
    mobileMenu: true,
    
    // Premium flags - disabled by default, enabled by subscription
    customDecks: false,
    historicalProgress: false,
    advancedAnalytics: false,
    spacedRepetition: false,
    learningInsights: false,
    prioritySupport: false,
    offlineMode: false,
    dataExport: false,
    premiumBadges: false,
    upgradePrompts: true, // Show upgrade prompts to free users
    premiumOnboarding: false,
    billingManagement: false,
    
    // Core flags - most enabled by default
    multiplayer: true,
    learningPods: true,
    scenarios: true,
    civicsTest: true,
    quizzes: true,
    surveys: true,
    adminAccess: false, // Admin only
    debugRoutes: false, // Development only
    debugPanels: false, // Development only
    signUpFlow: true,
    socialLogin: true,
    guestAccess: true,
    notifications: true,
    emailMarketing: true,
    chatSupport: true,
    analyticsTracking: true,
    errorReporting: true,
    performanceMonitoring: true,
    experimentalFeatures: false,
    betaFeatures: false,
    alphaFeatures: false
  }

  private getEnvironmentConfig(): FeatureFlagEnvironmentConfig {
    return {
      NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
      VERCEL_ENV: process.env.VERCEL_ENV as 'production' | 'preview' | 'development' | undefined,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    }
  }

  private getOverrides(): Partial<AllFeatureFlags> {
    if (typeof window === 'undefined') return {}
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  public getAllFlags(): AllFeatureFlags {
    const overrides = this.getOverrides()
    return { ...this.defaults, ...overrides }
  }

  public getFlag(flag: keyof AllFeatureFlags): boolean {
    const allFlags = this.getAllFlags()
    return allFlags[flag]
  }

  public getNavigationFlags(): NavigationFeatureFlags {
    const allFlags = this.getAllFlags()
    return {
      globalSearch: allFlags.globalSearch,
      userMenu: allFlags.userMenu,
      civicsTestMenuItem: allFlags.civicsTestMenuItem,
      quizMenuItem: allFlags.quizMenuItem,
      scenariosMenuItem: allFlags.scenariosMenuItem,
      progressMenuItem: allFlags.progressMenuItem,
      learningPodsMenuItem: allFlags.learningPodsMenuItem,
      dashboardMenuItem: allFlags.dashboardMenuItem,
      settingsMenuItem: allFlags.settingsMenuItem,
      adminMenuItem: allFlags.adminMenuItem,
      themeToggleMenuItem: allFlags.themeToggleMenuItem,
      mobileMenu: allFlags.mobileMenu
    }
  }

  public getPremiumFlags(): PremiumFeatureFlags {
    const allFlags = this.getAllFlags()
    return {
      customDecks: allFlags.customDecks,
      historicalProgress: allFlags.historicalProgress,
      advancedAnalytics: allFlags.advancedAnalytics,
      spacedRepetition: allFlags.spacedRepetition,
      learningInsights: allFlags.learningInsights,
      prioritySupport: allFlags.prioritySupport,
      offlineMode: allFlags.offlineMode,
      dataExport: allFlags.dataExport,
      premiumBadges: allFlags.premiumBadges,
      upgradePrompts: allFlags.upgradePrompts,
      premiumOnboarding: allFlags.premiumOnboarding,
      billingManagement: allFlags.billingManagement
    }
  }

  public getCoreFlags(): CoreFeatureFlags {
    const allFlags = this.getAllFlags()
    return {
      multiplayer: allFlags.multiplayer,
      learningPods: allFlags.learningPods,
      scenarios: allFlags.scenarios,
      civicsTest: allFlags.civicsTest,
      quizzes: allFlags.quizzes,
      surveys: allFlags.surveys,
      adminAccess: allFlags.adminAccess,
      debugRoutes: allFlags.debugRoutes,
      debugPanels: allFlags.debugPanels,
      signUpFlow: allFlags.signUpFlow,
      socialLogin: allFlags.socialLogin,
      guestAccess: allFlags.guestAccess,
      notifications: allFlags.notifications,
      emailMarketing: allFlags.emailMarketing,
      chatSupport: allFlags.chatSupport,
      analyticsTracking: allFlags.analyticsTracking,
      errorReporting: allFlags.errorReporting,
      performanceMonitoring: allFlags.performanceMonitoring,
      experimentalFeatures: allFlags.experimentalFeatures,
      betaFeatures: allFlags.betaFeatures,
      alphaFeatures: allFlags.alphaFeatures
    }
  }

  public getEnvironmentSource(flag: keyof AllFeatureFlags): string {
    const envKey = `NEXT_PUBLIC_FEATURE_${String(flag).toUpperCase()}`
    const envValue = process.env[envKey]
    
    if (envValue !== undefined) {
      return `Environment variable ${envKey}`
    }
    
    const override = this.getOverrides()[flag]
    if (override !== undefined) {
      return 'Local storage override'
    }
    
    return 'Default value'
  }
}

// Export singleton instance
export const envFeatureFlags = new EnvironmentFeatureFlags()

// Convenience functions for commonly checked flags
export function arePodsEnabled(): boolean {
  return envFeatureFlags.getFlag('learningPods')
}

export function isMultiplayerEnabled(): boolean {
  return envFeatureFlags.getFlag('multiplayer')
}

export function areScenariosEnabled(): boolean {
  return envFeatureFlags.getFlag('scenarios')
}

export function isCivicsTestEnabled(): boolean {
  return envFeatureFlags.getFlag('civicsTest')
}

export function areQuizzesEnabled(): boolean {
  return envFeatureFlags.getFlag('quizzes')
}

export function isDocumentationSectionEnabled(): boolean {
  // Currently use the betaFeatures flag to gate documentation section.
  // Adjust in future if a dedicated flag is added.
  return envFeatureFlags.getFlag('betaFeatures')
}

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).envFeatureFlags = envFeatureFlags
}