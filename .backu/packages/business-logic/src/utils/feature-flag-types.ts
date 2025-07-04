// Feature flag type definitions
export interface AllFeatureFlags {
  // Navigation flags
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
  
  // Premium flags
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
  
  // Core flags
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

export type NavigationFeatureFlags = Pick<AllFeatureFlags, 
  'globalSearch' | 'userMenu' | 'civicsTestMenuItem' | 'quizMenuItem' | 
  'scenariosMenuItem' | 'progressMenuItem' | 'learningPodsMenuItem' | 
  'dashboardMenuItem' | 'settingsMenuItem' | 'adminMenuItem' | 
  'themeToggleMenuItem' | 'mobileMenu'
>;

export type PremiumFeatureFlags = Pick<AllFeatureFlags,
  'customDecks' | 'historicalProgress' | 'advancedAnalytics' | 'spacedRepetition' |
  'learningInsights' | 'prioritySupport' | 'offlineMode' | 'dataExport' |
  'premiumBadges' | 'upgradePrompts' | 'premiumOnboarding' | 'billingManagement'
>;

export type CoreFeatureFlags = Pick<AllFeatureFlags,
  'multiplayer' | 'learningPods' | 'scenarios' | 'civicsTest' | 'quizzes' |
  'surveys' | 'adminAccess' | 'debugRoutes' | 'debugPanels' | 'signUpFlow' |
  'socialLogin' | 'guestAccess' | 'notifications' | 'emailMarketing' |
  'chatSupport' | 'analyticsTracking' | 'errorReporting' | 'performanceMonitoring' |
  'experimentalFeatures' | 'betaFeatures' | 'alphaFeatures'
>; 