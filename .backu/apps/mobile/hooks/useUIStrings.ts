import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { uiStrings as uiStringsEN } from '../lib/ui-strings'
import { uiStringsES } from '../lib/ui-strings-es'
import { uiStringsAR } from '../lib/ui-strings-ar'
import { uiStringsIT } from '../lib/ui-strings-it'
import type { UIStrings } from '../lib/ui-strings'

export type SupportedLanguage = 'en' | 'es' | 'ar' | 'it'

interface LanguageInfo {
  code: SupportedLanguage
  name: string
  nativeName: string
  rtl?: boolean
}

const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
]

const UI_STRINGS_MAP: Record<SupportedLanguage, UIStrings> = {
  en: uiStringsEN,
  es: uiStringsES,
  ar: uiStringsAR,
  it: uiStringsIT,
}

const STORAGE_KEY = 'civicsense-mobile-language'

export function useUIStrings() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en')
  const [strings, setStrings] = useState<UIStrings>(uiStringsEN)
  const [isLoading, setIsLoading] = useState(true)

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (saved && saved in UI_STRINGS_MAP) {
          const language = saved as SupportedLanguage
          setCurrentLanguage(language)
          setStrings(UI_STRINGS_MAP[language])
        }
      } catch (error) {
        console.error('Failed to load language preference:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguage()
  }, [])

  // Change language
  const changeLanguage = useCallback(async (languageCode: SupportedLanguage) => {
    try {
      setCurrentLanguage(languageCode)
      setStrings(UI_STRINGS_MAP[languageCode])
      await AsyncStorage.setItem(STORAGE_KEY, languageCode)
    } catch (error) {
      console.error('Failed to save language preference:', error)
    }
  }, [])

  // Get string with fallback to English
  const getString = useCallback((
    path: string,
    fallback?: string,
    params?: Record<string, string | number>
  ): string => {
    try {
      // Navigate through the nested object using the path
      const pathParts = path.split('.')
      let value: any = strings
      
      for (const part of pathParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part]
        } else {
          // Fallback to English if path doesn't exist
          let fallbackValue: any = uiStringsEN
          for (const fallbackPart of pathParts) {
            if (fallbackValue && typeof fallbackValue === 'object' && fallbackPart in fallbackValue) {
              fallbackValue = fallbackValue[fallbackPart]
            } else {
              fallbackValue = undefined
              break
            }
          }
          value = fallbackValue || fallback || path
          break
        }
      }

      if (typeof value !== 'string') {
        return fallback || path
      }

      // Replace parameters in the string
      if (params) {
        return Object.entries(params).reduce((str, [key, val]) => {
          return str.replace(new RegExp(`{{${key}}}`, 'g'), String(val))
        }, value)
      }

      return value
    } catch (error) {
      console.error('Error getting string:', error)
      return fallback || path
    }
  }, [strings])

  // Helper function to check if current language is RTL
  const isRTL = useCallback(() => {
    const languageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage)
    return languageInfo?.rtl || false
  }, [currentLanguage])

  // Get available languages
  const getAvailableLanguages = useCallback(() => {
    return SUPPORTED_LANGUAGES
  }, [])

  // Get current language info
  const getCurrentLanguageInfo = useCallback(() => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0]
  }, [currentLanguage])

  return {
    // Current state
    currentLanguage,
    strings,
    isLoading,
    isRTL: isRTL(),
    
    // Actions
    changeLanguage,
    getString,
    
    // Metadata
    availableLanguages: getAvailableLanguages(),
    currentLanguageInfo: getCurrentLanguageInfo(),
    
    // Convenience getters for common sections
    nav: strings.navigation,
    quiz: strings.quiz,
    topic: strings.topic,
    actions: strings.actions,
    status: strings.status,
    errors: strings.errors,
    time: strings.time,
    translation: strings.translation,
    sources: strings.sources,
    languages: strings.languages,
    onboarding: strings.onboarding,
    multiplayer: strings.multiplayer,
    analytics: strings.analytics,
    news: strings.news,
    collections: strings.collections,
    accessibility: strings.accessibility,
    settings: strings.settings,
    survey: strings.survey,
    audio: strings.audio,
  }
}

// Hook for specific UI string sections
export function useUISection<K extends keyof UIStrings>(section: K) {
  const { strings } = useUIStrings()
  return strings[section]
}

// Hook for getting translated strings with parameters
export function useTranslation() {
  const { getString, currentLanguage, isRTL } = useUIStrings()
  
  const t = useCallback((
    key: string, 
    params?: Record<string, string | number>,
    fallback?: string
  ) => {
    return getString(key, fallback, params)
  }, [getString])
  
  return {
    t,
    language: currentLanguage,
    isRTL,
  }
} 