/**
 * CivicSense Translation Types
 * Types for managing translations and localization
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko'

export interface TranslationStrings {
  [key: string]: string | TranslationStrings
}

export type UIStringPath = string

export interface TranslationConfig {
  defaultLocale: string
  supportedLocales: string[]
  fallbackLocale: string
  loadPath: string
  debug?: boolean
}

export interface TranslationService {
  init(config: TranslationConfig): Promise<void>
  loadTranslations(locale: string): Promise<TranslationStrings>
  setLocale(locale: string): void
  getLocale(): string
  getString(path: UIStringPath, params?: Record<string, string>): string
  formatString(template: string, params: Record<string, string>): string
} 