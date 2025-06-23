// lib/env-feature-flags.ts
export interface AllFeatureFlags {
    // Navigation flags
    globalSearch: boolean
    userMenu: boolean
    civicsTestMenuItem: boolean
    quizMenuItem: boolean
    scenariosMenuItem: boolean
    progressMenuItem: boolean
    learningPodsMenuItem: boolean
    dashboardMenuItem: boolean
    settingsMenuItem: boolean
    adminMenuItem: boolean
    themeToggleMenuItem: boolean
    mobileMenu: boolean
    
    // Premium flags
    customDecks: boolean
    historicalProgress: boolean
    advancedAnalytics: boolean
    spacedRepetition: boolean
    learningInsights: boolean
    prioritySupport: boolean
    offlineMode: boolean
    dataExport: boolean
    premiumBadges: boolean
    upgradePrompts: boolean
    premiumOnboarding: boolean
    billingManagement: boolean
    
    // Core flags
    multiplayer: boolean
    learningPods: boolean
    scenarios: boolean
    civicsTest: boolean
    quizzes: boolean
    surveys: boolean
    adminAccess: boolean
    debugRoutes: boolean
    debugPanels: boolean
    signUpFlow: boolean
    socialLogin: boolean
    guestAccess: boolean
    notifications: boolean
    emailMarketing: boolean
    chatSupport: boolean
    analyticsTracking: boolean
    errorReporting: boolean
    performanceMonitoring: boolean
    experimentalFeatures: boolean
    betaFeatures: boolean
    alphaFeatures: boolean
  }
  
  export type NavigationFeatureFlags = Pick<AllFeatureFlags, 
    'globalSearch' | 'userMenu' | 'civicsTestMenuItem' | 'quizMenuItem' | 
    'scenariosMenuItem' | 'progressMenuItem' | 'learningPodsMenuItem' | 
    'dashboardMenuItem' | 'settingsMenuItem' | 'adminMenuItem' | 
    'themeToggleMenuItem' | 'mobileMenu'
  >
  
  export type PremiumFeatureFlags = Pick<AllFeatureFlags,
    'customDecks' | 'historicalProgress' | 'advancedAnalytics' | 'spacedRepetition' |
    'learningInsights' | 'prioritySupport' | 'offlineMode' | 'dataExport' |
    'premiumBadges' | 'upgradePrompts' | 'premiumOnboarding' | 'billingManagement'
  >
  
  export type CoreFeatureFlags = Pick<AllFeatureFlags,
    'multiplayer' | 'learningPods' | 'scenarios' | 'civicsTest' | 'quizzes' |
    'surveys' | 'adminAccess' | 'debugRoutes' | 'debugPanels' | 'signUpFlow' |
    'socialLogin' | 'guestAccess' | 'notifications' | 'emailMarketing' |
    'chatSupport' | 'analyticsTracking' | 'errorReporting' | 'performanceMonitoring' |
    'experimentalFeatures' | 'betaFeatures' | 'alphaFeatures'
  >
  
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
  
    private getEnvValue(key: string): boolean {
      const envKey = `NEXT_PUBLIC_FEATURE_${key.toUpperCase()}`
      const envValue = process.env[envKey]
      
      if (envValue === undefined) {
        return this.defaults[key as keyof AllFeatureFlags]
      }
      
      return envValue === 'true' || envValue === '1'
    }
  
    private getDevOverrides(): Partial<AllFeatureFlags> {
      if (!this.isDevelopment || typeof window === 'undefined') {
        return {}
      }
      
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY)
        return stored ? JSON.parse(stored) : {}
      } catch (error) {
        console.warn('Failed to parse feature flag overrides:', error)
        return {}
      }
    }
  
    private setDevOverride(flag: keyof AllFeatureFlags, value: boolean): void {
      if (!this.isDevelopment || typeof window === 'undefined') {
        return
      }
      
      try {
        const overrides = this.getDevOverrides()
        overrides[flag] = value
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(overrides))
        
        // Dispatch custom event for listeners
        window.dispatchEvent(new CustomEvent('featureFlagsChanged', { 
          detail: { flag, value } 
        }))
      } catch (error) {
        console.warn('Failed to save feature flag override:', error)
      }
    }
  
    private removeDevOverride(flag: keyof AllFeatureFlags): void {
      if (!this.isDevelopment || typeof window === 'undefined') {
        return
      }
      
      try {
        const overrides = this.getDevOverrides()
        delete overrides[flag]
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(overrides))
        
        // Dispatch custom event for listeners
        window.dispatchEvent(new CustomEvent('featureFlagsChanged', { 
          detail: { flag, value: this.getEnvValue(flag) } 
        }))
      } catch (error) {
        console.warn('Failed to remove feature flag override:', error)
      }
    }
  
    public getFlag(flag: keyof AllFeatureFlags): boolean {
      // In development, check for localStorage overrides first
      if (this.isDevelopment) {
        const overrides = this.getDevOverrides()
        if (flag in overrides) {
          return overrides[flag]!
        }
      }
      
      // Otherwise use environment variable or default
      return this.getEnvValue(flag)
    }
  
    public getAllFlags(): AllFeatureFlags {
      const flags = {} as AllFeatureFlags
      
      for (const flag in this.defaults) {
        flags[flag as keyof AllFeatureFlags] = this.getFlag(flag as keyof AllFeatureFlags)
      }
      
      return flags
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
  
    // Development-only methods for the debug panel
    public setFlag(flag: keyof AllFeatureFlags, value: boolean): void {
      if (!this.isDevelopment) {
        console.warn('setFlag is only available in development mode')
        return
      }
      this.setDevOverride(flag, value)
    }
  
    public resetFlag(flag: keyof AllFeatureFlags): void {
      if (!this.isDevelopment) {
        console.warn('resetFlag is only available in development mode')
        return
      }
      this.removeDevOverride(flag)
    }
  
    public resetToDefaults(): void {
      if (!this.isDevelopment) {
        console.warn('resetToDefaults is only available in development mode')
        return
      }
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY)
        window.dispatchEvent(new CustomEvent('featureFlagsChanged', { 
          detail: { reset: true } 
        }))
      }
    }
  
    public clearCache(): void {
      if (!this.isDevelopment) {
        console.warn('clearCache is only available in development mode')
        return
      }
      this.resetToDefaults()
    }
  
    public refreshFromStorage(): void {
      if (!this.isDevelopment) {
        return
      }
      // This method exists for compatibility with the existing debug panel
      // The actual refresh happens automatically when localStorage changes
    }
  
    public getOverrides(): Partial<AllFeatureFlags> {
      return this.getDevOverrides()
    }
  
    public getEnvironmentSource(flag: keyof AllFeatureFlags): 'env' | 'default' | 'override' {
      if (this.isDevelopment) {
        const overrides = this.getDevOverrides()
        if (flag in overrides) {
          return 'override'
        }
      }
      
      const envKey = `NEXT_PUBLIC_FEATURE_${flag.toUpperCase()}`
      return process.env[envKey] !== undefined ? 'env' : 'default'
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
  
  // Make available globally in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).envFeatureFlags = envFeatureFlags
  }