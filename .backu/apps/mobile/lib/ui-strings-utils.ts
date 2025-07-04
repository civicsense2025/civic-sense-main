import type { UIStrings } from './ui-strings'

/**
 * Type-safe helper to access nested UI strings with autocomplete
 */
export type UIStringPath<T = UIStrings> = T extends string
  ? never
  : {
      [K in keyof T]: K extends string
        ? T[K] extends string
          ? K
          : T[K] extends object
          ? `${K}.${UIStringPath<T[K]>}`
          : never
        : never
    }[keyof T]

/**
 * Get value from nested object using dot notation path
 */
export function getNestedValue<T>(obj: T, path: string): string | undefined {
  return path.split('.').reduce((current: any, key: string) => {
    return current && typeof current === 'object' ? current[key] : undefined
  }, obj)
}

/**
 * Replace template parameters in a string
 * Supports both {{param}} and {param} formats
 */
export function replaceParams(
  template: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce((str, [key, value]) => {
    // Support both {{key}} and {key} formats
    return str
      .replace(new RegExp(`{{${key}}}`, 'g'), String(value))
      .replace(new RegExp(`{${key}}`, 'g'), String(value))
  }, template)
}

/**
 * Format plural strings based on count
 * Examples:
 * - "You have {count} item{plural}" -> "You have 1 item" or "You have 2 items"
 * - "{count} question{plural} remaining" -> "1 question remaining" or "5 questions remaining"
 */
export function formatPlural(
  template: string,
  count: number,
  pluralSuffix: string = 's'
): string {
  const params = {
    count,
    plural: count === 1 ? '' : pluralSuffix,
  }
  return replaceParams(template, params)
}

/**
 * Format time-based strings
 */
export function formatTimeString(
  template: string,
  minutes: number,
  options: {
    showSeconds?: boolean
    longFormat?: boolean
  } = {}
): string {
  const { showSeconds = false, longFormat = false } = options
  
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  const secs = Math.floor((minutes % 1) * 60)
  
  if (longFormat) {
    if (hours > 0) {
      return `${hours}h ${mins}m`
    } else if (mins > 0) {
      return showSeconds ? `${mins}m ${secs}s` : `${mins}m`
    } else {
      return `${secs}s`
    }
  } else {
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}`
    } else {
      return showSeconds 
        ? `${mins}:${secs.toString().padStart(2, '0')}`
        : `${mins}m`
    }
  }
}

/**
 * Common UI string patterns for consistent usage
 */
export const UI_PATTERNS = {
  // Loading states
  LOADING: (item: string = 'content') => `loading.${item}` as const,
  
  // Error states
  ERROR: (type: string = 'unknown') => `errors.${type}Error` as const,
  
  // Actions
  ACTION: (action: string) => `actions.${action}` as const,
  
  // Quiz related
  QUIZ: {
    QUESTION_PROGRESS: (current: number, total: number) => 
      formatPlural(`Question ${current} of ${total}`, current),
    SCORE: (correct: number, total: number) => 
      `${correct}/${total} correct`,
    TIME_REMAINING: (minutes: number) => 
      formatTimeString('time_remaining', minutes, { showSeconds: true }),
  },
  
  // Onboarding
  ONBOARDING: {
    STEP: (current: number, total: number) => 
      `Step ${current} of ${total}`,
  },
  
  // Multiplayer
  MULTIPLAYER: {
    PLAYERS: (count: number) => 
      formatPlural(`{count} player{plural}`, count),
    WAITING: (count: number) => 
      formatPlural(`Waiting for {count} player{plural}`, count),
  },
} as const

/**
 * Accessibility helpers for UI strings
 */
export const A11Y_HELPERS = {
  /**
   * Create accessible labels for interactive elements
   */
  createLabel: (
    action: string,
    target: string,
    context?: string
  ): string => {
    const base = `${action} ${target}`
    return context ? `${base}, ${context}` : base
  },
  
  /**
   * Create screen reader announcements
   */
  announce: (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): { text: string; priority: string } => ({
    text: message,
    priority,
  }),
  
  /**
   * Format progress announcements
   */
  announceProgress: (
    current: number,
    total: number,
    context: string = 'items'
  ): string => {
    const percentage = Math.round((current / total) * 100)
    return `Progress: ${current} of ${total} ${context} completed, ${percentage}%`
  },
}

/**
 * Validation helpers for UI strings
 */
export const VALIDATION = {
  /**
   * Check if a string path exists in the UI strings object
   */
  hasPath: (strings: UIStrings, path: string): boolean => {
    return getNestedValue(strings, path) !== undefined
  },
  
  /**
   * Get missing string paths by comparing against a reference
   */
  getMissingPaths: (
    reference: UIStrings,
    target: Partial<UIStrings>,
    prefix: string = ''
  ): string[] => {
    const missing: string[] = []
    
    for (const [key, value] of Object.entries(reference)) {
      const currentPath = prefix ? `${prefix}.${key}` : key
      const targetValue = (target as any)[key]
      
      if (targetValue === undefined) {
        missing.push(currentPath)
      } else if (typeof value === 'object' && typeof targetValue === 'object') {
        missing.push(...VALIDATION.getMissingPaths(value, targetValue, currentPath))
      }
    }
    
    return missing
  },
  
  /**
   * Validate that all required paths exist in a UI strings object
   */
  validateCompleteness: (
    reference: UIStrings,
    target: Partial<UIStrings>
  ): { isComplete: boolean; missingPaths: string[] } => {
    const missingPaths = VALIDATION.getMissingPaths(reference, target)
    return {
      isComplete: missingPaths.length === 0,
      missingPaths,
    }
  },
}

/**
 * Development helpers for building UI strings
 */
export const DEV_HELPERS = {
  /**
   * Log missing translations for development
   */
  logMissingTranslations: (
    language: string,
    reference: UIStrings,
    target: Partial<UIStrings>
  ) => {
    if (__DEV__) {
      const { isComplete, missingPaths } = VALIDATION.validateCompleteness(reference, target)
      if (!isComplete) {
        console.warn(`Missing translations for ${language}:`, missingPaths)
      } else {
        console.log(`✅ All translations complete for ${language}`)
      }
    }
  },
  
  /**
   * Generate a template for missing translations
   */
  generateTranslationTemplate: (
    reference: UIStrings,
    target: Partial<UIStrings>
  ): Record<string, string> => {
    const missing = VALIDATION.getMissingPaths(reference, target)
    const template: Record<string, string> = {}
    
    missing.forEach(path => {
      const value = getNestedValue(reference, path)
      if (typeof value === 'string') {
        template[path] = `[TRANSLATE] ${value}`
      }
    })
    
    return template
  },
}

/**
 * Type guards for UI strings
 */
export const TYPE_GUARDS = {
  isStringValue: (value: any): value is string => {
    return typeof value === 'string'
  },
  
  isUIStringsObject: (value: any): value is UIStrings => {
    return value && typeof value === 'object' && 'navigation' in value
  },
}

/**
 * Export commonly used string getters for convenience
 */
export const COMMON_STRINGS = {
  // Navigation
  BACK: 'navigation.back',
  CLOSE: 'navigation.close',
  MENU: 'navigation.menu',
  HOME: 'navigation.home',
  
  // Actions
  SAVE: 'actions.save',
  CANCEL: 'actions.cancel',
  DELETE: 'actions.delete',
  EDIT: 'actions.edit',
  SHARE: 'actions.share',
  CONTINUE: 'actions.continue',
  NEXT: 'actions.next',
  PREVIOUS: 'actions.previous',
  
  // Status
  LOADING: 'status.loading',
  ERROR: 'status.error',
  SUCCESS: 'status.success',
  
  // Quiz
  QUIZ_START: 'quiz.startQuiz',
  QUIZ_NEXT: 'quiz.nextQuestion',
  QUIZ_FINISH: 'quiz.finishQuiz',
  QUIZ_RESULTS: 'quiz.results',
} as const 