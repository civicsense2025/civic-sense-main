"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, X, RotateCcw, Bug, Flag, Terminal, Navigation, Crown, Cog, Info, Activity } from "lucide-react"
import { debug } from "@/lib/debug-config"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { envFeatureFlags, type AllFeatureFlags, type NavigationFeatureFlags, type PremiumFeatureFlags, type CoreFeatureFlags } from '@/lib/env-feature-flags'
import { debugFeatureFlags } from "@/lib/debug-feature-flags"
import { CoreWebVitalsTracker, usePerformanceOptimizations } from "@/components/core-web-vitals-tracker"

interface DebugSettingsPanelProps {
  className?: string
}

type DebugCategory = 'quiz' | 'multiplayer' | 'pwa' | 'storage' | 'analytics' | 'auth' | 'api' | 'premium' | 'general'

type FlagCategory = 'navigation' | 'premium' | 'core'

type FlagCategoryMap = {
  navigation: NavigationFeatureFlags;
  premium: PremiumFeatureFlags;
  core: CoreFeatureFlags;
}

export function DebugSettingsPanel({ className }: DebugSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState(debug.getConfig())
  const [flags, setFlags] = useState<AllFeatureFlags>(envFeatureFlags.getAllFlags())
  const [overrides, setOverrides] = useState(envFeatureFlags.getOverrides())
  const [activeTab, setActiveTab] = useState('features')
  const [selectedFlagCategory, setSelectedFlagCategory] = useState<FlagCategory>('navigation')
  const [mounted, setMounted] = useState(false)
  const performanceOptimizations = usePerformanceOptimizations()

  const updateConfig = () => {
    setConfig(debug.getConfig())
  }

  const updateFlags = () => {
    setFlags(envFeatureFlags.getAllFlags())
    setOverrides(envFeatureFlags.getOverrides())
  }

  const handleToggleCategory = (category: DebugCategory) => {
    debug.toggle(category)
    updateConfig()
  }

  const handleToggleMinimized = () => {
    debug.toggleMinimized()
    updateConfig()
  }

  const handleToggleFeature = (feature: keyof AllFeatureFlags) => {
    envFeatureFlags.setFlag(feature, !flags[feature])
    setFlags(envFeatureFlags.getAllFlags())
  }

  const handleResetFlag = (feature: keyof AllFeatureFlags) => {
    envFeatureFlags.resetFlag(feature)
    setFlags(envFeatureFlags.getAllFlags())
  }

  const handleReset = () => {
    // Only reset if user confirms
    if (!confirm('Are you sure you want to reset all feature flags and debug settings to defaults?')) {
      return
    }
    
    envFeatureFlags.resetToDefaults()
    setFlags(envFeatureFlags.getAllFlags())
    
    // Reset debug categories
    debug.enable()
    debug.enable('quiz')
    debug.enable('multiplayer')
    debug.enable('premium')
    debug.enable('general')
    debug.disable('pwa')
    debug.disable('storage')
    debug.disable('analytics')
    debug.disable('auth')
    debug.disable('api')
    updateConfig()
  }

  const handleClearCache = () => {
    envFeatureFlags.clearCache()
    setFlags(envFeatureFlags.getAllFlags())
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Initialize flags when component mounts and handle localStorage changes
  useEffect(() => {
    setMounted(true)
    updateFlags()

    // Set up storage event listener for feature flag changes
    const handleFeatureFlagsChange = () => {
      updateFlags()
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'civicsense-feature-flags-overrides') {
        updateFlags()
      }
    }

    window.addEventListener('featureFlagsChanged', handleFeatureFlagsChange)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('featureFlagsChanged', handleFeatureFlagsChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) return null

  const categoryDescriptions = {
    quiz: "Quiz engine, question processing, and quiz flow",
    multiplayer: "Multiplayer rooms, game modes, and real-time updates",
    pwa: "Progressive Web App registration and caching",
    storage: "LocalStorage operations and state persistence",
    analytics: "User tracking and performance metrics",
    auth: "Authentication and user management",
    api: "API calls and server communications",
    premium: "Premium subscriptions, feature access, and billing",
    general: "General application debug messages"
  }

  const flagCategoryDescriptions: Record<FlagCategory, string> = {
    navigation: "Control visibility and access to navigation items and menus",
    premium: "Toggle premium features and subscription-related functionality",
    core: "Manage core application features and system capabilities"
  }

  const getFlagDescription = (flag: keyof AllFeatureFlags): string => {
    const descriptions: Record<string, string> = {
      // Navigation flags
      globalSearch: "Global search functionality",
      userMenu: "User dropdown menu in header",
      civicsTestMenuItem: "Civics test menu item",
      quizMenuItem: "Quiz menu item",
      scenariosMenuItem: "Scenarios menu item",
      progressMenuItem: "Progress menu item",
      learningPodsMenuItem: "Learning pods menu item",
      dashboardMenuItem: "Dashboard menu item",
      settingsMenuItem: "Settings menu item",
      adminMenuItem: "Admin menu item",
      themeToggleMenuItem: "Theme toggle menu item",
      mobileMenu: "Mobile navigation menu",
      
      // Premium flags
      customDecks: "Create and manage custom question decks",
      historicalProgress: "View detailed historical progress",
      advancedAnalytics: "Advanced analytics and insights",
      spacedRepetition: "Spaced repetition learning system",
      learningInsights: "Personalized learning insights",
      prioritySupport: "Priority customer support",
      offlineMode: "Offline access to content",
      dataExport: "Export learning data",
      premiumBadges: "Premium user badges",
      upgradePrompts: "Premium upgrade prompts",
      premiumOnboarding: "Premium user onboarding",
      billingManagement: "Billing and subscription management",
      
      // Core flags
      multiplayer: "Multiplayer quiz modes",
      learningPods: "Learning pods feature",
      scenarios: "Interactive scenarios",
      civicsTest: "Civics test module",
      quizzes: "Quiz system",
      surveys: "User surveys",
      adminAccess: "Admin panel access",
      debugRoutes: "Debug routes",
      debugPanels: "Debug panels",
      signUpFlow: "User registration flow",
      socialLogin: "Social media login",
      guestAccess: "Guest user access",
      notifications: "User notifications",
      emailMarketing: "Email marketing",
      chatSupport: "Chat support system",
      analyticsTracking: "Analytics tracking",
      errorReporting: "Error reporting",
      performanceMonitoring: "Performance monitoring",
      experimentalFeatures: "Experimental features",
      betaFeatures: "Beta features",
      alphaFeatures: "Alpha features"
    }
    
    return descriptions[flag] || "No description available"
  }

  const getFlagSource = (flag: keyof AllFeatureFlags): 'env' | 'default' | 'override' => {
    return envFeatureFlags.getEnvironmentSource(flag)
  }

  const getSourceBadge = (source: 'env' | 'default' | 'override') => {
    switch (source) {
      case 'env':
        return <Badge variant="default" className="text-xs">ENV</Badge>
      case 'override':
        return <Badge variant="secondary" className="text-xs">DEV</Badge>
      case 'default':
        return <Badge variant="outline" className="text-xs">DEFAULT</Badge>
    }
  }

  const getFlagsForCategory = (category: FlagCategory): FlagCategoryMap[FlagCategory] => {
    switch (category) {
      case 'navigation':
        return envFeatureFlags.getNavigationFlags()
      case 'premium':
        return envFeatureFlags.getPremiumFlags()
      case 'core':
        return envFeatureFlags.getCoreFlags()
    }
  }

  const renderFlagSection = (category: FlagCategory) => {
    const flagsToShow = getFlagsForCategory(category)
    const entries = Object.entries(flagsToShow) as Array<[keyof FlagCategoryMap[FlagCategory], boolean]>

    return (
      <div className="space-y-4">
        {entries.map(([flag, value]) => (
          <div key={String(flag)} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="space-y-1">
              <div className="font-medium">{String(flag)}</div>
              <p className="text-sm text-muted-foreground">
                {getFlagDescription(flag as keyof AllFeatureFlags)}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {getFlagSource(flag as keyof AllFeatureFlags)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={value}
                onCheckedChange={() => handleToggleFeature(flag as keyof AllFeatureFlags)}
              />
              <Button
                onClick={() => handleResetFlag(flag as keyof AllFeatureFlags)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-4 left-4 z-50", className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="bg-black/80 text-white border-white/20 hover:bg-black/90 backdrop-blur-sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Debug Panel
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-white dark:bg-gray-950",
      "flex flex-col",
      className
    )}>
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="container max-w-7xl mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h1 className="text-lg font-medium">Debug Settings</h1>
              <Badge variant="outline" className="ml-2">Development Mode</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleClearCache}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Overrides
              </Button>
              <Button
                onClick={updateFlags}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={() => debugFeatureFlags()}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Bug className="h-4 w-4" />
                Debug Console
              </Button>
              <Button
                onClick={handleReset}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 container max-w-7xl mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="flex h-full gap-6">
            <div className="w-64 flex flex-col">
              <TabsList className="flex flex-col h-auto gap-2 bg-transparent">
                <TabsTrigger 
                  value="features" 
                  className="w-full justify-start gap-2 h-9"
                >
                  <Flag className="h-4 w-4" />
                  Feature Flags
                </TabsTrigger>
                <TabsTrigger 
                  value="debug" 
                  className="w-full justify-start gap-2 h-9"
                >
                  <Bug className="h-4 w-4" />
                  Debug Categories
                </TabsTrigger>
                <TabsTrigger 
                  value="performance" 
                  className="w-full justify-start gap-2 h-9"
                >
                  <Activity className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger 
                  value="console" 
                  className="w-full justify-start gap-2 h-9"
                >
                  <Terminal className="h-4 w-4" />
                  Environment
                </TabsTrigger>
              </TabsList>

              {activeTab === 'features' && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-1">
                    <div className="px-3 text-sm font-medium text-muted-foreground mb-2">
                      Categories
                    </div>
                    <Button
                      variant={selectedFlagCategory === 'navigation' ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => setSelectedFlagCategory('navigation')}
                    >
                      <Navigation className="h-4 w-4" />
                      Navigation
                    </Button>
                    <Button
                      variant={selectedFlagCategory === 'premium' ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => setSelectedFlagCategory('premium')}
                    >
                      <Crown className="h-4 w-4" />
                      Premium
                    </Button>
                    <Button
                      variant={selectedFlagCategory === 'core' ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => setSelectedFlagCategory('core')}
                    >
                      <Cog className="h-4 w-4" />
                      Core
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 border rounded-lg border-gray-200 dark:border-gray-800">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                {activeTab === 'features' && (
                  <div className="p-4">
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-medium mb-1">
                            {selectedFlagCategory.charAt(0).toUpperCase() + selectedFlagCategory.slice(1)} Features
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {flagCategoryDescriptions[selectedFlagCategory]}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="default" className="text-xs">ENV</Badge>
                            <span className="text-xs text-muted-foreground">Environment variable</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">DEV</Badge>
                            <span className="text-xs text-muted-foreground">Development override</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">DEFAULT</Badge>
                            <span className="text-xs text-muted-foreground">Default value</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {renderFlagSection(selectedFlagCategory)}
                  </div>
                )}

                {activeTab === 'debug' && (
                  <div className="p-4">
                    <div className="mb-6">
                      <h2 className="text-lg font-medium mb-1">Debug Categories</h2>
                      <p className="text-sm text-muted-foreground">
                        Control debug logging for different parts of the application
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Debug Enabled</div>
                          <Switch
                            checked={config.enabled}
                            onCheckedChange={() => {
                              debug.toggle()
                              updateConfig()
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Master toggle for all debug messages
                        </p>
                      </div>

                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Minimized Logs</div>
                          <Switch
                            checked={config.minimized}
                            onCheckedChange={handleToggleMinimized}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Show condensed debug information
                        </p>
                      </div>

                      {Object.entries(categoryDescriptions).map(([category, description]) => (
                        <div 
                          key={category}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{category}</div>
                            <Switch
                              checked={config.categories[category as keyof typeof config.categories]}
                              onCheckedChange={() => handleToggleCategory(category as DebugCategory)}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="p-4">
                    <div className="mb-6">
                      <h2 className="text-lg font-medium mb-1">Performance Monitoring</h2>
                      <p className="text-sm text-muted-foreground">
                        Real-time Core Web Vitals and performance optimization suggestions
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Core Web Vitals Display */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Core Web Vitals
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <CoreWebVitalsTracker />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Metrics are collected automatically and logged to console with color-coded ratings.
                            <br />
                            (Good) (Needs Improvement) (Poor)
                          </div>
                        </CardContent>
                      </Card>

                      {/* Performance Optimization Suggestions */}
                      {performanceOptimizations.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Optimization Suggestions ({performanceOptimizations.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {performanceOptimizations.map((suggestion, index) => (
                                <div 
                                  key={index}
                                  className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30"
                                >
                                  <div className="text-sm text-orange-800 dark:text-orange-200">
                                    - {suggestion}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground">
                              These suggestions are automatically detected based on current page analysis.
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Performance Tips */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Performance Guidelines</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 text-sm">
                            <div>
                              <div className="font-medium mb-1">Core Web Vitals Targets:</div>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">LCP (Largest Contentful Paint):</span>
                                  <div className="font-mono">Good: &lt;2.5s</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">FID (First Input Delay):</span>
                                  <div className="font-mono">Good: &lt;100ms</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">CLS (Cumulative Layout Shift):</span>
                                  <div className="font-mono">Good: &lt;0.1</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">FCP (First Contentful Paint):</span>
                                  <div className="font-mono">Good: &lt;1.8s</div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="font-medium mb-1">Quick Tips:</div>
                              <ul className="text-xs space-y-1 text-muted-foreground">
                                <li>- Add width/height to images to prevent layout shifts</li>
                                <li>- Use Next.js Image component for optimization</li>
                                <li>- Minimize render-blocking JavaScript</li>
                                <li>- Implement proper font loading strategies</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'console' && (
                  <div className="p-4">
                    <div className="mb-6">
                      <h2 className="text-lg font-medium mb-1">Environment Information</h2>
                      <p className="text-sm text-muted-foreground">
                        Environment variables and system status
                      </p>
                    </div>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Feature Flag System Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Environment:</span>
                              <div className="font-mono text-xs mt-1 p-1 bg-gray-100 dark:bg-gray-800 rounded">
                                {process.env.NODE_ENV}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Override Storage:</span>
                              <div className="mt-1">
                                {typeof window !== 'undefined' && localStorage.getItem('civicsense-feature-flags-overrides') 
                                  ? <span className="text-blue-600 dark:text-blue-400">(Active)</span>
                                  : <span className="text-gray-600 dark:text-gray-400">(None)</span>
                                }
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">Current Overrides ({Object.keys(overrides).length}):</span>
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded border text-xs font-mono max-h-32 overflow-y-auto">
                              <pre>{Object.keys(overrides).length > 0 ? JSON.stringify(overrides, null, 2) : 'No development overrides'}</pre>
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">All Current Values:</span>
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded border text-xs font-mono max-h-40 overflow-y-auto">
                              <pre>{JSON.stringify(flags, null, 2)}</pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Console Access</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            Access debugging tools in browser console:
                          </p>
                          <div className="space-y-2">
                            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono">
                              window.debug
                            </div>
                            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono">
                              window.envFeatureFlags
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}