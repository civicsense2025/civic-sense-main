import type { AllFeatureFlags } from '@civicsense/types';
import { envFeatureFlags } from './feature-flags';
export { envFeatureFlags } from './feature-flags';

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
  private readonly isDevelopment = process.env.NODE_ENV === 'development'
  
  public getFlag(flag: keyof AllFeatureFlags): boolean {
    // In development, use environment flags
    if (this.isDevelopment) {
      return envFeatureFlags.getFlag(flag)
    }
    
    // In production, use Statsig
    try {
      const statsigResult = this.getStatsigValue(flag)
      console.log(`[FeatureFlags] ${flag}: Statsig(${statsigResult}) | Env(${envFeatureFlags.getFlag(flag)})`)
      return statsigResult
    } catch (error) {
      // Fallback to environment flags on error
      console.warn('[FeatureFlags] Statsig error:', error)
      return envFeatureFlags.getFlag(flag)
    }
  }
  
  private getStatsigValue(flag: keyof AllFeatureFlags): boolean {
    // TODO: Implement Statsig integration
    return envFeatureFlags.getFlag(flag)
  }
  
  public getAllFlags(): AllFeatureFlags {
    return envFeatureFlags.getAllFlags()
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
    if (typeof globalStatsigClient === 'object' && typeof globalStatsigClient.logEvent === 'function') {
      globalStatsigClient.logEvent('feature_flag_usage', 1, {
        flag_name: flag,
        action,
        source: 'civicsense_app',
        enabled: this.getFlag(flag)
      })
    }
  }
  
  /**
   * Get information about which system provided a flag value
   */
  public getSource(flag: keyof AllFeatureFlags): 'statsig' | 'env' | 'unknown' {
    if (typeof globalStatsigClient === 'object' && typeof globalStatsigClient.checkGate === 'function') {
      try {
        globalStatsigClient.checkGate(flag)
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
    return flagKeys.map(flag => flag)
  }
}

// Export singleton instance
export const statsigFeatureFlags = new StatsigFeatureFlags()

// Helper functions for common flags
export const isLearningPodsEnabled = () => statsigFeatureFlags.getFlag('learningPods')
export const isMultiplayerEnabled = () => statsigFeatureFlags.getFlag('multiplayer')
export const isScenariosEnabled = () => statsigFeatureFlags.getFlag('scenarios')
export const isCivicsTestEnabled = () => statsigFeatureFlags.getFlag('civicsTest')
export const isQuizzesEnabled = () => statsigFeatureFlags.getFlag('quizzes')
export const isBetaFeaturesEnabled = () => statsigFeatureFlags.getFlag('betaFeatures')

// Export main function for getting flags
export const getFlag = (flag: keyof AllFeatureFlags) => statsigFeatureFlags.getFlag(flag)

// Development helper to see what gates need to be created in Statsig
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).statsigFeatureFlags = statsigFeatureFlags
  
  // Log required gates for easy copying to Statsig
  console.log('[FeatureFlags] Required Statsig Gates:', statsigFeatureFlags.getRequiredStatsigGates())
} 