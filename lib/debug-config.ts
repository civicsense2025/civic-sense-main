/**
 * Centralized debug configuration for development
 * Allows toggling debug messages by category
 */

interface DebugConfig {
  enabled: boolean
  categories: {
    quiz: boolean
    multiplayer: boolean
    pwa: boolean
    storage: boolean
    analytics: boolean
    auth: boolean
    api: boolean
    premium: boolean
    general: boolean
    'pattern-recognition': boolean
  }
  minimized: boolean // Show condensed logs when true
}

class DebugManager {
  private static instance: DebugManager
  private config: DebugConfig
  private storageKey = 'civicSenseDebugConfig'

  constructor() {
    if (typeof window === 'undefined') {
      // Server-side default
      this.config = this.getDefaultConfig()
      return
    }

    // Load from localStorage or use defaults
    const stored = localStorage.getItem(this.storageKey)
    if (stored) {
      try {
        this.config = { ...this.getDefaultConfig(), ...JSON.parse(stored) }
      } catch {
        this.config = this.getDefaultConfig()
      }
    } else {
      this.config = this.getDefaultConfig()
    }

    // Make debug manager available globally for easy access
    if (process.env.NODE_ENV === 'development') {
      ;(window as any).debug = this
    }
  }

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager()
    }
    return DebugManager.instance
  }

  private getDefaultConfig(): DebugConfig {
    return {
      enabled: process.env.NODE_ENV === 'development',
      categories: {
        quiz: true,
        multiplayer: true,
        pwa: false, // Disabled by default since these can be noisy
        storage: false,
        analytics: false,
        auth: false,
        api: false,
        premium: true, // Enabled by default for subscription debugging
        general: true,
        'pattern-recognition': true // Enabled by default for pattern recognition debugging
      },
      minimized: false
    }
  }

  private saveConfig() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config))
    }
  }

  // Public API methods
  isEnabled(category?: keyof DebugConfig['categories']): boolean {
    if (!this.config.enabled || process.env.NODE_ENV !== 'development') {
      return false
    }
    
    if (category) {
      return this.config.categories[category]
    }
    
    return true
  }

  log(category: keyof DebugConfig['categories'], message: string, data?: any) {
    if (!this.isEnabled(category)) return

    const prefix = this.getCategoryPrefix(category)
    
    if (this.config.minimized) {
      // Condensed logging
      console.log(`${prefix} ${message}`, data ? '(+data)' : '')
    } else {
      // Full logging
      console.log(`${prefix} ${message}`, data || '')
    }
  }

  warn(category: keyof DebugConfig['categories'], message: string, data?: any) {
    if (!this.isEnabled(category)) return

    const prefix = this.getCategoryPrefix(category)
    console.warn(`${prefix} ${message}`, data || '')
  }

  error(category: keyof DebugConfig['categories'], message: string, data?: any) {
    if (!this.isEnabled(category)) return

    const prefix = this.getCategoryPrefix(category)
    console.error(`${prefix} ${message}`, data || '')
  }

  private getCategoryPrefix(category: keyof DebugConfig['categories']): string {
    const prefixes = {
      quiz: '[Q]',
      multiplayer: '[MP]',
      pwa: '[PWA]',
      storage: '[STORE]',
      analytics: '[ANALYTICS]',
      auth: '[AUTH]',
      api: '[API]',
      premium: '[PREMIUM]',
      general: '[GEN]',
      'pattern-recognition': '[PATTERN]'
    }
    return `${prefixes[category]} [${category.toUpperCase()}]`
  }

  // Configuration methods
  toggle(category?: keyof DebugConfig['categories']) {
    if (category) {
      this.config.categories[category] = !this.config.categories[category]
    } else {
      this.config.enabled = !this.config.enabled
    }
    this.saveConfig()
  }

  toggleMinimized() {
    this.config.minimized = !this.config.minimized
    this.saveConfig()
    console.log(`[DEBUG] Debug messages ${this.config.minimized ? 'minimized' : 'expanded'}`)
  }

  enable(category?: keyof DebugConfig['categories']) {
    if (category) {
      this.config.categories[category] = true
    } else {
      this.config.enabled = true
    }
    this.saveConfig()
  }

  disable(category?: keyof DebugConfig['categories']) {
    if (category) {
      this.config.categories[category] = false
    } else {
      this.config.enabled = false
    }
    this.saveConfig()
  }

  getConfig(): DebugConfig {
    return { ...this.config }
  }

  showStatus() {
    console.group('[DEBUG] Debug Configuration')
    console.log('Enabled:', this.config.enabled)
    console.log('Minimized:', this.config.minimized)
    console.log('Categories:')
    Object.entries(this.config.categories).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? 'ENABLED' : 'DISABLED'}`)
    })
    console.groupEnd()
  }

  help() {
    console.group('[DEBUG] Debug Manager Help')
    console.log('Available commands (use window.debug in dev console):')
    console.log('  .toggle()           - Toggle all debug messages')
    console.log('  .toggle("quiz")     - Toggle quiz debug messages')
    console.log('  .toggleMinimized()  - Toggle minimized/expanded logs')
    console.log('  .enable()           - Enable all debug messages')
    console.log('  .disable()          - Disable all debug messages')
    console.log('  .showStatus()       - Show current configuration')
    console.log('  .testPremium()      - Test premium subscription debugging')
    console.log('  .help()             - Show this help')
    console.log('')
    console.log('Available categories:', Object.keys(this.config.categories).join(', '))
    console.groupEnd()
  }

  testPremium() {
    console.group('[PREMIUM] Testing Premium Debugging')
    this.log('premium', 'Test message: Premium debugging is working!')
    this.warn('premium', 'Test warning: This is a premium warning message')
    this.error('premium', 'Test error: This is a premium error message')
    console.log('Premium debugging enabled:', this.isEnabled('premium'))
    console.groupEnd()
  }
}

// Create singleton instance
const debugManager = DebugManager.getInstance()

// Export convenience functions
export const debug = {
  log: (category: keyof DebugConfig['categories'], message: string, data?: any) => 
    debugManager.log(category, message, data),
  warn: (category: keyof DebugConfig['categories'], message: string, data?: any) => 
    debugManager.warn(category, message, data),
  error: (category: keyof DebugConfig['categories'], message: string, data?: any) => 
    debugManager.error(category, message, data),
  isEnabled: (category?: keyof DebugConfig['categories']) => 
    debugManager.isEnabled(category),
  toggle: (category?: keyof DebugConfig['categories']) => 
    debugManager.toggle(category),
  toggleMinimized: () => debugManager.toggleMinimized(),
  enable: (category?: keyof DebugConfig['categories']) => 
    debugManager.enable(category),
  disable: (category?: keyof DebugConfig['categories']) => 
    debugManager.disable(category),
  getConfig: () => debugManager.getConfig(),
  showStatus: () => debugManager.showStatus(),
  help: () => debugManager.help(),
  testPremium: () => debugManager.testPremium()
}

export default debug 