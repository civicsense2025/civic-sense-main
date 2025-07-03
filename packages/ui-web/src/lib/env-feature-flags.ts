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

// Simplified environment feature flags for UI
export const envFeatureFlags = {
  getAllFlags(): AllFeatureFlags {
    return {
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
  }
} 