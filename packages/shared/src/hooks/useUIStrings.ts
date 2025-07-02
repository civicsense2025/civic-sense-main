/**
 * Hook for accessing translated UI strings
 * Integrates with the language provider and UI string translation system
 */

import React, { useEffect, useCallback, useMemo } from 'react'
import { useLanguage } from '@/components/providers/language-provider'
import { getTranslatedString, uiTranslationService } from '../lib/ui-strings-translation'
import { uiStrings } from '../lib/ui-strings'

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
 * Enhanced typed helper for CivicSense UI string paths with better IDE support
 */
export const ui = {
  // Common actions with CivicSense context
  actions: {
    continue: () => useUIString('actions.continue'),
    continueQuiz: () => useUIString('quiz.continueQuiz'), 
    continueLearning: () => useUIString('actions.continue'), // Reuse for consistency
    cancel: () => useUIString('actions.cancel'),
    save: () => useUIString('actions.save'),
    delete: () => useUIString('actions.delete'),
    loading: () => useUIString('actions.loading'),
    retry: () => useUIString('actions.retry'),
    back: () => useUIString('actions.back'),
    next: () => useUIString('actions.next'),
    submit: () => useUIString('actions.submit'),
    share: () => useUIString('actions.share'),
  },
  
  // Navigation
  nav: {
    home: () => useUIString('navigation.home'),
    dashboard: () => useUIString('navigation.dashboard'),
    categories: () => useUIString('navigation.categories'),
    quizzes: () => useUIString('navigation.quizzes'),
    multiplayer: () => useUIString('navigation.multiplayer'),
    settings: () => useUIString('navigation.settings'),
    signIn: () => useUIString('navigation.login'),
    signUp: () => useUIString('navigation.signUp'),
  },
  
  // Authentication
  auth: {
    signIn: () => useUIString('auth.signIn.title'),
    signUp: () => useUIString('auth.signUp.title'),
    email: () => useUIString('auth.signIn.emailLabel'),
    password: () => useUIString('auth.signIn.passwordLabel'),
    forgotPassword: () => useUIString('auth.signIn.forgotPassword'),
    continueWithGoogle: () => useUIString('auth.signIn.continueWithGoogle'),
    signingIn: () => useUIString('auth.signIn.signingIn'),
    creatingAccount: () => useUIString('auth.signUp.creatingAccount'),
  },
  
  // Quiz specific helpers
  quiz: {
    startQuiz: () => useUIString('quiz.startQuiz'),
    continueQuiz: () => useUIString('quiz.continueQuiz'),
    retakeQuiz: () => useUIString('quiz.retakeQuiz'),
    nextQuestion: () => useUIString('quiz.nextQuestion'),
    previousQuestion: () => useUIString('quiz.previousQuestion'),
    submitAnswer: () => useUIString('quiz.submitAnswer'),
    skipQuestion: () => useUIString('quiz.skipQuestion'),
    explanation: () => useUIString('quiz.explanation'),
    score: () => useUIString('quiz.score'),
    complete: () => useUIString('quiz.complete'),
    loading: () => useUIString('quiz.loading'),
    comingSoon: () => useUIString('messages.comingSoon'),
    signInToContinue: () => 'Sign In to Continue', // Common pattern
  },
  
  // Results and achievements
  results: {
    continueLearning: () => useUIString('results.continueLearning'), // Very common CivicSense pattern
    shareResults: () => useUIString('results.share'),
    tryAgain: () => useUIString('results.tryAgain'),
    backToHome: () => useUIString('results.backToHome'),
    viewDetails: () => useUIString('results.viewDetails'),
    retakeQuiz: () => useUIString('results.retakeQuiz'),
  },
  
  // Error handling
  errors: {
    generic: () => useUIString('errors.generic'),
    network: () => useUIString('errors.network'),
    tryAgain: () => useUIString('errors.tryAgain'),
    loading: () => 'Loading...', // Very common
  },
  
  // Messages and feedback
  messages: {
    success: () => useUIString('messages.success'),
    saved: () => useUIString('messages.saved'),
    welcome: () => useUIString('messages.welcome'),
    goodJob: () => useUIString('messages.goodJob'),
    wellDone: () => useUIString('messages.wellDone'),
    congratulations: () => useUIString('messages.congratulations'),
  },

  // CivicSense brand specific
  brand: {
    name: () => useUIString('brand.name'),
    tagline: () => useUIString('brand.tagline'),
    description: () => useUIString('brand.description'),
  }
} as const

/**
 * Higher-order component for UI strings context
 */
export function withUIStrings<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    // Use a simple hook approach rather than the generic useUIStrings
    const { currentLanguage } = useLanguage()
    const uiStringsSection = useUISection('brand') // Just an example section
    return React.createElement(Component, { ...props, uiStrings: uiStringsSection })
  }
}

/**
 * Component helper for common CivicSense button patterns
 */
export function UIButton({ 
  stringPath, 
  variant = 'default',
  className, 
  children,
  ...props 
}: { 
  stringPath?: string;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const text = stringPath ? useUIString(stringPath) : children
  
  return React.createElement('button', { 
    className: `btn btn-${variant} ${className || ''}`,
    ...props 
  }, text)
}

/**
 * Specialized hooks for CivicSense patterns
 */
export function useQuizStrings() {
  return {
    startQuiz: useUIString('quiz.startQuiz'),
    continueQuiz: useUIString('quiz.continueQuiz'),
    retakeQuiz: useUIString('quiz.retakeQuiz'),
    nextQuestion: useUIString('quiz.nextQuestion'),
    previousQuestion: useUIString('quiz.previousQuestion'),
    submitAnswer: useUIString('quiz.submitAnswer'),
    skipQuestion: useUIString('quiz.skipQuestion'),
    complete: useUIString('quiz.complete'),
    loading: useUIString('quiz.loading'),
    // Common civic patterns
    continueLearning: useUIString('results.continueLearning'),
    signInToContinue: 'Sign In to Continue',
    comingSoon: useUIString('messages.comingSoon'),
  }
}

export function useAuthStrings() {
  return {
    signIn: useUIString('auth.signIn.title'),
    signUp: useUIString('auth.signUp.title'),
    email: useUIString('auth.signIn.emailLabel'),
    password: useUIString('auth.signIn.passwordLabel'),
    continueWithGoogle: useUIString('auth.signIn.continueWithGoogle'),
    forgotPassword: useUIString('auth.signIn.forgotPassword'),
    signingIn: useUIString('auth.signIn.signingIn'),
    creatingAccount: useUIString('auth.signUp.creatingAccount'),
  }
}

export function useCommonActionStrings() {
  return {
    continue: useUIString('actions.continue'),
    cancel: useUIString('actions.cancel'),
    save: useUIString('actions.save'),
    back: useUIString('actions.back'),
    next: useUIString('actions.next'),
    submit: useUIString('actions.submit'),
    retry: useUIString('actions.retry'),
    loading: useUIString('actions.loading'),
    share: useUIString('actions.share'),
  }
}

/**
 * Component helper to create localized text components
 */
export function UIText({ path, className }: { path: string; className?: string }) {
  const text = useUIString(path)
  return React.createElement('span', { className }, text)
} 