/**
 * Feature Flag System for CivicSense
 * 
 * Controls which features are available in different environments
 */

interface FeatureFlags {
  // Multiplayer functionality
  multiplayer: boolean
  
  // Learning pods feature
  learningPods: boolean
  
  // Scenarios feature
  scenarios: boolean
  
  // Debug and test routes
  debugRoutes: boolean
  
  // Admin features
  adminAccess: boolean
  
  // Experimental features
  experimental: boolean
}

class FeatureFlagManager {
  private flags: FeatureFlags
  
  constructor() {
    this.flags = this.loadFlags()
  }
  
  private loadFlags(): FeatureFlags {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isPreview = process.env.VERCEL_ENV === 'preview'
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
    
    return {
      // Multiplayer - only in development for now
      multiplayer: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_MULTIPLAYER === 'true',
      
      // Learning pods - only in development for now  
      learningPods: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_PODS === 'true',
      
      // Scenarios - enabled in development and can be enabled via env var
      scenarios: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_SCENARIOS === 'true',
      
      // Debug routes - only in development
      debugRoutes: isDevelopment,
      
      // Admin access - controlled by environment
      adminAccess: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
      
      // Experimental features - development and preview only
      experimental: (isDevelopment || isPreview) && process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL !== 'false'
    }
  }
  
  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] || false
  }
  
  /**
   * Get all flag statuses
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags }
  }
  
  /**
   * Check if we're in a development environment
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }
  
  /**
   * Check if we're in production
   */
  isProduction(): boolean {
    return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
  }
  
  /**
   * Get environment info
   */
  getEnvironment(): string {
    if (this.isDevelopment()) return 'development'
    if (process.env.VERCEL_ENV === 'preview') return 'preview'
    if (this.isProduction()) return 'production'
    return 'unknown'
  }
}

// Global instance
export const featureFlags = new FeatureFlagManager()

// Convenience functions
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags.isEnabled(feature)
}

export const isDevelopment = (): boolean => {
  return featureFlags.isDevelopment()
}

export const isProduction = (): boolean => {
  return featureFlags.isProduction()
}

// Feature-specific helpers
export const isMultiplayerEnabled = (): boolean => {
  return isFeatureEnabled('multiplayer')
}

export const arePodsEnabled = (): boolean => {
  return isFeatureEnabled('learningPods')
}

export const areDebugRoutesEnabled = (): boolean => {
  return isFeatureEnabled('debugRoutes')
}

export const isAdminAccessEnabled = (): boolean => {
  return isFeatureEnabled('adminAccess')
}

export const areExperimentalFeaturesEnabled = (): boolean => {
  return isFeatureEnabled('experimental')
}

export const areScenariosEnabled = (): boolean => {
  return isFeatureEnabled('scenarios')
} 