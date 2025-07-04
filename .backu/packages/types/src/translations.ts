/**
 * CivicSense Translation Types
 * Types for managing translations and localization
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko'

export interface TranslationStrings {
  [key: string]: string | TranslationStrings
}

export type UIStringPath = string

export interface TranslationConfig {
  defaultLocale: SupportedLanguage
  supportedLocales: string[]
  fallbackLocale: SupportedLanguage
  loadPath: string
  debug?: boolean
}

export interface TranslationService {
  init(config: TranslationConfig): Promise<void>
  loadTranslations(locale: string): Promise<TranslationStrings>
  setLocale(locale: SupportedLanguage): Promise<void>
  getLocale(): SupportedLanguage
  getString(path: UIStringPath, params?: Record<string, string>): string
  formatString(template: string, params: Record<string, string>): string
  translate(key: string, params?: Record<string, any>): string
}

export interface TranslationModule {
  [key: string]: string | TranslationModule
}

export interface TranslationContext {
  locale: SupportedLanguage
  setLocale: (locale: SupportedLanguage) => Promise<void>
  translate: (key: string, params?: Record<string, any>) => string
}

export interface TranslationProviderProps {
  children: React.ReactNode
  initialLocale?: SupportedLanguage
}

export interface Translations {
  [locale: string]: {
    common: {
      [key: string]: string
    }
  }
} 