import { envFeatureFlags, type AllFeatureFlags } from './comprehensive-feature-flags'

// Import Statsig hooks from our provider
let globalStatsigClient: any = null

// Set up global client reference (this gets set by the provider)
if (typeof window !== 'undefined') {
  // Listen for Statsig client to be available
  const checkForStatsigClient = () => {
    if ((window as any).statsigClient) {
      globalStatsigClient = (window as any).statsigClient
    }
  }
  
  // Check immediately and set up interval
  checkForStatsigClient()
  setInterval(checkForStatsigClient, 1000)
}

/**
 * Enhanced feature flag system that uses Statsig when available,
 * falls back to environment-based flags, with compatibility for existing API
 */
class StatsigFeatureFlags {
  private readonly STATSIG_GATE_PREFIX = 'civicsense_'
  
  /**
   * Check if a feature flag is enabled, using Statsig first, then env fallback
   */
  private checkFlag(flag: keyof AllFeatureFlags): boolean {
    // Try Statsig first
    if (this.isStatsigAvailable()) {
      try {
        const gateKey = this.getStatsigGateKey(flag)
        const statsigResult = globalStatsigClient.checkGate(gateKey)
        
        // Log for debugging in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[FeatureFlags] ${flag}: Statsig(${statsigResult}) | Env(${envFeatureFlags.getFlag(flag)})`)
        }
        
        return statsigResult
      } catch (error) {
        console.warn(`[FeatureFlags] Statsig error for ${flag}, falling back to env:`, error)
      }
    }
    
    // Fallback to environment-based flags
    return envFeatureFlags.getFlag(flag)
  }
  
  /**
   * Check if Statsig client is available and ready
   */
  private isStatsigAvailable(): boolean {
    return globalStatsigClient && typeof globalStatsigClient.checkGate === 'function'
  }
  
  /**
   * Convert our flag names to Statsig gate keys
   */
  private getStatsigGateKey(flag: keyof AllFeatureFlags): string {
    return `${this.STATSIG_GATE_PREFIX}${flag}`
  }
  
  /**
   * Get a specific feature flag value
   */
  public getFlag(flag: keyof AllFeatureFlags): boolean {
    return this.checkFlag(flag)
  }
  
  /**
   * Get all feature flags (maintains compatibility with existing API)
   */
  public getAllFlags(): AllFeatureFlags {
    const flags = {} as AllFeatureFlags
    
    // Get all flag keys from the original defaults
    const flagKeys = Object.keys(envFeatureFlags.getAllFlags()) as (keyof AllFeatureFlags)[]
    
    for (const flag of flagKeys) {
      flags[flag] = this.checkFlag(flag)
    }
    
    return flags
  }
  
  /**
   * Get navigation flags (maintains compatibility)
   */
  public getNavigationFlags() {
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
  
  /**
   * Get premium flags (maintains compatibility)
   */
  public getPremiumFlags() {
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
  
  /**
   * Get core flags (maintains compatibility)
   */
  public getCoreFlags() {
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
  
  /**
   * Log feature flag usage to Statsig for analytics
   */
  public logFeatureUsage(flag: keyof AllFeatureFlags, action: string = 'accessed') {
    if (this.isStatsigAvailable()) {
      try {
        globalStatsigClient.logEvent('feature_flag_usage', 1, {
          flag_name: flag,
          action,
          source: 'civicsense_app',
          enabled: this.getFlag(flag)
        })
      } catch (error) {
        console.warn(`[FeatureFlags] Failed to log usage for ${flag}:`, error)
      }
    }
  }
  
  /**
   * Get information about which system provided a flag value
   */
  public getSource(flag: keyof AllFeatureFlags): 'statsig' | 'env' | 'unknown' {
    if (this.isStatsigAvailable()) {
      try {
        globalStatsigClient.checkGate(this.getStatsigGateKey(flag))
        return 'statsig'
      } catch {
        return 'env'
      }
    }
    return 'env'
  }
  
  /**
   * Development-only method to list all Statsig gates that should be created
   */
  public getRequiredStatsigGates(): string[] {
    if (process.env.NODE_ENV !== 'development') {
      return []
    }
    
    const flagKeys = Object.keys(envFeatureFlags.getAllFlags()) as (keyof AllFeatureFlags)[]
    return flagKeys.map(flag => this.getStatsigGateKey(flag))
  }
}

// Export singleton instance
export const statsigFeatureFlags = new StatsigFeatureFlags()

// Maintain compatibility with existing convenience functions
export function arePodsEnabled(): boolean {
  const result = statsigFeatureFlags.getFlag('learningPods')
  statsigFeatureFlags.logFeatureUsage('learningPods', 'checked')
  return result
}

export function isMultiplayerEnabled(): boolean {
  const result = statsigFeatureFlags.getFlag('multiplayer')
  statsigFeatureFlags.logFeatureUsage('multiplayer', 'checked')
  return result
}

export function areScenariosEnabled(): boolean {
  const result = statsigFeatureFlags.getFlag('scenarios')
  statsigFeatureFlags.logFeatureUsage('scenarios', 'checked')
  return result
}

export function isCivicsTestEnabled(): boolean {
  const result = statsigFeatureFlags.getFlag('civicsTest')
  statsigFeatureFlags.logFeatureUsage('civicsTest', 'checked')
  return result
}

export function areQuizzesEnabled(): boolean {
  const result = statsigFeatureFlags.getFlag('quizzes')
  statsigFeatureFlags.logFeatureUsage('quizzes', 'checked')
  return result
}

export function isDocumentationSectionEnabled(): boolean {
  const result = statsigFeatureFlags.getFlag('betaFeatures')
  statsigFeatureFlags.logFeatureUsage('betaFeatures', 'documentation_check')
  return result
}

// Export the instance methods for component usage
export const getFlag = (flag: keyof AllFeatureFlags) => statsigFeatureFlags.getFlag(flag)
export const getAllFlags = () => statsigFeatureFlags.getAllFlags()
export const getNavigationFlags = () => statsigFeatureFlags.getNavigationFlags()
export const getPremiumFlags = () => statsigFeatureFlags.getPremiumFlags()
export const getCoreFlags = () => statsigFeatureFlags.getCoreFlags()

// Development helper to see what gates need to be created in Statsig
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).statsigFeatureFlags = statsigFeatureFlags
  
  // Log required gates for easy copying to Statsig
  console.log('[FeatureFlags] Required Statsig Gates:', statsigFeatureFlags.getRequiredStatsigGates())
} 