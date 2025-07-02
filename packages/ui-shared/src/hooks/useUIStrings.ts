/**
 * Hook for accessing translated UI strings
 * Integrates with the language provider and UI string translation system
 */

import React, { useEffect, useCallback, useMemo } from 'react'
import { uiStrings, type UIStrings, type SupportedLanguageCode, languageStrings } from '../strings'

// Temporary fallback for language functionality until we integrate with the main apps
const useLanguage = () => ({ 
  currentLanguage: 'en' as SupportedLanguageCode,
  translateBatch: (texts: string[], language: string): Promise<string[]> => Promise.resolve(texts)
})

/**
 * Get a nested value from an object using a dot-separated path
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }
  return typeof current === 'string' ? current : undefined
}

/**
 * Get translated string for a given path and language
 */
async function getTranslatedString(path: string, language: SupportedLanguageCode): Promise<string> {
  if (language === 'en') {
    return getNestedValue(uiStrings, path) || path
  }
  
  try {
    const langStrings = await languageStrings[language]()
    const translatedValue = typeof langStrings === 'object' && 'default' in langStrings 
      ? getNestedValue(langStrings.default, path)
      : getNestedValue(langStrings, path)
    
    return translatedValue || getNestedValue(uiStrings, path) || path
  } catch (error) {
    // Fallback to English if translation fails
    return getNestedValue(uiStrings, path) || path
  }
}

/**
 * Hook to get a single translated UI string
 */
export function useUIString(path: string): string {
  const { currentLanguage } = useLanguage()
  const [translatedString, setTranslatedString] = React.useState<string>(
    getNestedValue(uiStrings, path) || path
  )
  
  useEffect(() => {
    let mounted = true
    
    getTranslatedString(path, currentLanguage).then(translated => {
      if (mounted) {
        setTranslatedString(translated)
      }
    })
    
    return () => { mounted = false }
  }, [path, currentLanguage])

  return translatedString
}

/**
 * Hook to get multiple translated UI strings at once
 */
export function useUIStrings<T extends Record<string, string>>(
  paths: T
): { [K in keyof T]: string } {
  const { currentLanguage } = useLanguage()
  const [translatedStrings, setTranslatedStrings] = React.useState<{ [K in keyof T]: string }>(() => {
    const result = {} as { [K in keyof T]: string }
    for (const [key, path] of Object.entries(paths)) {
      result[key as keyof T] = getNestedValue(uiStrings, path) || path
    }
    return result
  })
  
  useEffect(() => {
    let mounted = true
    
    const translateAll = async () => {
      const result = {} as { [K in keyof T]: string }
      
      for (const [key, path] of Object.entries(paths)) {
        result[key as keyof T] = await getTranslatedString(path, currentLanguage)
      }
      
      if (mounted) {
        setTranslatedStrings(result)
      }
    }
    
    translateAll()
    
    return () => { mounted = false }
  }, [paths, currentLanguage])

  return translatedStrings
}

/**
 * Hook to get all strings from a specific section (e.g., 'navigation', 'quiz')
 */
export function useUISection<K extends keyof UIStrings>(
  section: K
): UIStrings[K] {
  const { currentLanguage } = useLanguage()
  const [sectionStrings, setSectionStrings] = React.useState<UIStrings[K]>(uiStrings[section])
  
  useEffect(() => {
    let mounted = true
    
    const translateSection = async () => {
      if (currentLanguage === 'en') {
        if (mounted) setSectionStrings(uiStrings[section])
        return
      }

      try {
        const langStrings = await languageStrings[currentLanguage]()
        const translatedSection = typeof langStrings === 'object' && 'default' in langStrings 
          ? langStrings.default[section]
          : (langStrings as UIStrings)[section]
        
        if (mounted) {
          setSectionStrings(translatedSection || uiStrings[section])
        }
      } catch (error) {
        if (mounted) setSectionStrings(uiStrings[section])
      }
    }
    
    translateSection()
    
    return () => { mounted = false }
  }, [section, currentLanguage])

  return sectionStrings
}

/**
 * Enhanced typed helper for CivicSense UI string paths with better IDE support
 */
export const ui = {
  // Navigation
  nav: {
    back: () => useUIString('navigation.back'),
    home: () => useUIString('navigation.home'),
    topics: () => useUIString('navigation.topics'),
    learn: () => useUIString('navigation.learn'),
    profile: () => useUIString('navigation.profile'),
    settings: () => useUIString('navigation.settings'),
  },
  
  // Common actions
  actions: {
    continue: () => useUIString('actions.continue'),
    cancel: () => useUIString('actions.cancel'),
    save: () => useUIString('actions.save'),
    delete: () => useUIString('actions.delete'),
    back: () => useUIString('actions.back'),
    next: () => useUIString('actions.next'),
    submit: () => useUIString('actions.submit'),
    retry: () => useUIString('actions.retry'),
    share: () => useUIString('actions.share'),
  },
  
  // Quiz specific helpers
  quiz: {
    startQuiz: () => useUIString('quiz.startQuiz'),
    nextQuestion: () => useUIString('quiz.nextQuestion'),
    previousQuestion: () => useUIString('quiz.previousQuestion'),
    submitAnswer: () => useUIString('quiz.submitAnswer'),
    finishQuiz: () => useUIString('quiz.finishQuiz'),
    retakeQuiz: () => useUIString('quiz.retakeQuiz'),
    explanation: () => useUIString('quiz.explanation'),
    score: () => useUIString('quiz.score'),
    complete: () => useUIString('quiz.complete'),
  },
  
  // Common status messages
  status: {
    loading: () => useUIString('status.loading'),
    saving: () => useUIString('status.saving'),
    saved: () => useUIString('status.saved'),
    error: () => useUIString('status.error'),
    success: () => useUIString('status.success'),
  },
  
  // Error handling
  errors: {
    networkError: () => useUIString('errors.networkError'),
    serverError: () => useUIString('errors.serverError'),
    unknownError: () => useUIString('errors.unknownError'),
    tryAgain: () => useUIString('actions.tryAgain'),
  },
} as const

/**
 * Specialized hooks for common CivicSense patterns
 */
export function useQuizStrings() {
  return useUISection('quiz')
}

export function useNavigationStrings() {
  return useUISection('navigation')
}

export function useCommonStrings() {
  return {
    actions: useUISection('actions'),
    status: useUISection('status'),
    errors: useUISection('errors'),
  }
}

/**
 * Component helper to create localized text components
 */
export function UIText({ path, className }: { path: string; className?: string }) {
  const text = useUIString(path)
  return React.createElement('span', { className }, text)
}

/**
 * Replace parameters in a string template
 */
export function replaceParams(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match
  })
}

/**
 * Hook for parameterized strings
 */
export function useUIStringWithParams(
  path: string, 
  params: Record<string, string | number>
): string {
  const template = useUIString(path)
  return useMemo(() => replaceParams(template, params), [template, params])
} 