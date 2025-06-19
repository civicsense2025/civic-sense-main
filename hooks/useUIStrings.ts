/**
 * Hook for accessing translated UI strings
 * Integrates with the language provider and UI string translation system
 */

import React, { useEffect, useCallback, useMemo } from 'react'
import { useLanguage } from '@/components/providers/language-provider'
import { getTranslatedString, uiTranslationService } from '@/lib/ui-strings-translation'
import { uiStrings } from '@/lib/ui-strings'

/**
 * Hook to get a single translated UI string
 */
export function useUIString(path: string): string {
  const { currentLanguage } = useLanguage()
  
  // Load translations for current language on mount/language change
  useEffect(() => {
    if (currentLanguage !== 'en') {
      uiTranslationService.loadTranslations(currentLanguage)
    }
  }, [currentLanguage])

  return useMemo(() => {
    return getTranslatedString(path, currentLanguage)
  }, [path, currentLanguage])
}

/**
 * Hook to get multiple translated UI strings at once
 */
export function useUIStrings<T extends Record<string, string>>(
  paths: T
): { [K in keyof T]: string } {
  const { currentLanguage } = useLanguage()
  
  // Load translations for current language
  useEffect(() => {
    if (currentLanguage !== 'en') {
      uiTranslationService.loadTranslations(currentLanguage)
    }
  }, [currentLanguage])

  return useMemo(() => {
    const result = {} as { [K in keyof T]: string }
    
    for (const [key, path] of Object.entries(paths)) {
      result[key as keyof T] = getTranslatedString(path, currentLanguage)
    }
    
    return result
  }, [paths, currentLanguage])
}

/**
 * Hook to get all strings from a specific section (e.g., 'auth', 'quiz')
 */
export function useUISection<K extends keyof typeof uiStrings>(
  section: K
): typeof uiStrings[K] {
  const { currentLanguage } = useLanguage()
  
  useEffect(() => {
    if (currentLanguage !== 'en') {
      uiTranslationService.loadTranslations(currentLanguage)
    }
  }, [currentLanguage])

  return useMemo(() => {
    if (currentLanguage === 'en') {
      return uiStrings[section]
    }

    // For non-English, build translated version
    const originalSection = uiStrings[section]
    
    function translateSection(obj: any, pathPrefix: string = section as string): any {
      if (typeof obj === 'string') {
        return getTranslatedString(pathPrefix, currentLanguage)
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const translated: any = {}
        for (const [key, value] of Object.entries(obj)) {
          const newPath = `${pathPrefix}.${key}`
          translated[key] = translateSection(value, newPath)
        }
        return translated
      }
      
      return obj
    }

    return translateSection(originalSection)
  }, [section, currentLanguage])
}

/**
 * Administrative hook for managing UI string translations
 */
export function useUITranslationAdmin() {
  const { translateBatch } = useLanguage()

  const generateTranslations = useCallback(async (targetLanguage: string): Promise<boolean> => {
    return await uiTranslationService.generateUITranslations(
      targetLanguage,
      (texts, language) => translateBatch(texts, language)
    )
  }, [translateBatch])

  const getStats = useCallback(async () => {
    return await uiTranslationService.getTranslationStats()
  }, [])

  const clearCache = useCallback((language?: string) => {
    uiTranslationService.clearCache(language)
  }, [])

  return {
    generateTranslations,
    getStats,
    clearCache
  }
}

/**
 * Typed helper for common UI string paths
 * This provides better IDE support and prevents typos
 */
export const ui = {
  // Common actions
  actions: {
    continue: () => useUIString('actions.continue'),
    cancel: () => useUIString('actions.cancel'),
    save: () => useUIString('actions.save'),
    delete: () => useUIString('actions.delete'),
    loading: () => useUIString('actions.loading'),
    retry: () => useUIString('actions.retry'),
  },
  
  // Navigation
  nav: {
    home: () => useUIString('navigation.home'),
    dashboard: () => useUIString('navigation.dashboard'),
    categories: () => useUIString('navigation.categories'),
    quizzes: () => useUIString('navigation.quizzes'),
    multiplayer: () => useUIString('navigation.multiplayer'),
    settings: () => useUIString('navigation.settings'),
  },
  
  // Authentication
  auth: {
    signIn: () => useUIString('auth.signIn.title'),
    signUp: () => useUIString('auth.signUp.title'),
    email: () => useUIString('auth.signIn.emailLabel'),
    password: () => useUIString('auth.signIn.passwordLabel'),
    forgotPassword: () => useUIString('auth.signIn.forgotPassword'),
  },
  
  // Quiz
  quiz: {
    startQuiz: () => useUIString('quiz.startQuiz'),
    nextQuestion: () => useUIString('quiz.nextQuestion'),
    explanation: () => useUIString('quiz.explanation'),
    score: () => useUIString('quiz.score'),
    complete: () => useUIString('quiz.complete'),
  },
  
  // Errors
  errors: {
    generic: () => useUIString('errors.generic'),
    network: () => useUIString('errors.network'),
    tryAgain: () => useUIString('errors.tryAgain'),
  },
  
  // Messages
  messages: {
    success: () => useUIString('messages.success'),
    saved: () => useUIString('messages.saved'),
    welcome: () => useUIString('messages.welcome'),
  }
} as const

/**
 * Component helper to create localized text components
 */
export function UIText({ path, className }: { path: string; className?: string }) {
  const text = useUIString(path)
  return React.createElement('span', { className }, text)
} 