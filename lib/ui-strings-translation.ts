/**
 * UI Strings Translation System for CivicSense
 * This extends the base ui-strings.ts with translation capabilities
 */

import { uiStrings, type UIStrings } from './ui-strings'
import { createClient } from '@/utils/supabase/client'

// Translation storage interface for UI strings
export interface UIStringTranslations {
  [languageCode: string]: {
    [stringPath: string]: {
      text: string
      lastUpdated: string
      autoTranslated: boolean
      reviewedBy?: string
      reviewedAt?: string
    }
  }
}

// Cache for translated UI strings
const uiTranslationCache = new Map<string, Map<string, string>>()

/**
 * Get a cache for a specific language
 */
function getLanguageCache(language: string): Map<string, string> {
  if (!uiTranslationCache.has(language)) {
    uiTranslationCache.set(language, new Map())
  }
  return uiTranslationCache.get(language)!
}

/**
 * Get a translated UI string with fallback logic
 */
export function getTranslatedString(
  path: string,
  language: string,
  fallbackLanguage: string = 'en'
): string {
  // If English, return original
  if (language === 'en') {
    return getStringByPath(path) || path
  }

  // Check cache first
  const cache = getLanguageCache(language)
  if (cache.has(path)) {
    return cache.get(path)!
  }

  // If no translation available, return original
  return getStringByPath(path) || path
}

/**
 * Helper to get string value by dot notation path
 */
function getStringByPath(path: string): string | undefined {
  const keys = path.split('.')
  let result: any = uiStrings

  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) {
      return undefined
    }
  }

  return typeof result === 'string' ? result : undefined
}

/**
 * Extract all translatable strings from the UI strings object
 */
export function extractTranslatableStrings(): Array<{ path: string; text: string }> {
  const strings: Array<{ path: string; text: string }> = []

  function traverse(obj: any, currentPath: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${key}` : key

      if (typeof value === 'string') {
        strings.push({ path, text: value })
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, path)
      }
    }
  }

  traverse(uiStrings)
  return strings
}

/**
 * UI String Translation Service
 */
export class UIStringTranslationService {
  private supabase = createClient()

  /**
   * Load UI string translations from database
   */
  async loadTranslations(language: string): Promise<void> {
    if (language === 'en') return

    try {
      const { data, error } = await this.supabase
        .from('ui_string_translations')
        .select('translations')
        .eq('language_code', language)
        .single()

      if (error || !data?.translations) {
        console.log(`No UI translations found for ${language}`)
        return
      }

      // Populate cache
      const cache = getLanguageCache(language)
      const translations = data.translations as Record<string, any>

      for (const [path, translation] of Object.entries(translations)) {
        if (typeof translation === 'object' && translation !== null && 'text' in translation && typeof translation.text === 'string') {
          cache.set(path, translation.text)
        }
      }

      console.log(`Loaded ${cache.size} UI string translations for ${language}`)
    } catch (error) {
      console.error(`Failed to load UI translations for ${language}:`, error)
    }
  }

  /**
   * Generate and save UI string translations for a language
   */
  async generateUITranslations(
    targetLanguage: string,
    translateFunction: (texts: string[], language: string) => Promise<string[]>
  ): Promise<boolean> {
    if (targetLanguage === 'en') return true

    try {
      console.log(`🌐 Generating UI translations for ${targetLanguage}...`)

      // Extract all translatable strings
      const translatableStrings = extractTranslatableStrings()
      console.log(`Found ${translatableStrings.length} UI strings to translate`)

      // Check what's already translated
      const { data: existingData } = await this.supabase
        .from('ui_string_translations')
        .select('translations')
        .eq('language_code', targetLanguage)
        .single()

      const existingTranslations = existingData?.translations || {}
      const stringsToTranslate: typeof translatableStrings = []

      // Filter out already translated strings
      for (const stringItem of translatableStrings) {
        if (!existingTranslations[stringItem.path]?.text) {
          stringsToTranslate.push(stringItem)
        }
      }

      if (stringsToTranslate.length === 0) {
        console.log(`All UI strings already translated for ${targetLanguage}`)
        return true
      }

      console.log(`Translating ${stringsToTranslate.length} new UI strings...`)

      // Translate in batches
      const batchSize = 50
      const updatedTranslations = { ...existingTranslations }

      for (let i = 0; i < stringsToTranslate.length; i += batchSize) {
        const batch = stringsToTranslate.slice(i, i + batchSize)
        const textsToTranslate = batch.map(item => item.text)

        try {
          const translations = await translateFunction(textsToTranslate, targetLanguage)

          // Store translations
          batch.forEach((item, index) => {
            updatedTranslations[item.path] = {
              text: translations[index] || item.text,
              lastUpdated: new Date().toISOString(),
              autoTranslated: true
            }
          })

          console.log(`✅ Translated batch ${Math.floor(i/batchSize) + 1}`)
          
          // Rate limiting
          if (i + batchSize < stringsToTranslate.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`Failed to translate batch ${i}-${i + batchSize}:`, error)
          
          // Store originals for failed translations
          batch.forEach(item => {
            updatedTranslations[item.path] = {
              text: item.text,
              lastUpdated: new Date().toISOString(),
              autoTranslated: false
            }
          })
        }
      }

      // Save to database
      const { error } = await this.supabase
        .from('ui_string_translations')
        .upsert({
          language_code: targetLanguage,
          translations: updatedTranslations,
          last_updated: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to save UI translations:', error)
        return false
      }

      // Update cache
      const cache = getLanguageCache(targetLanguage)
      for (const [path, translation] of Object.entries(updatedTranslations)) {
        if (typeof translation === 'object' && translation !== null && 'text' in translation && typeof translation.text === 'string') {
          cache.set(path, translation.text)
        }
      }

      console.log(`🎉 Generated ${Object.keys(updatedTranslations).length} UI translations for ${targetLanguage}`)
      return true

    } catch (error) {
      console.error(`Failed to generate UI translations for ${targetLanguage}:`, error)
      return false
    }
  }

  /**
   * Get translation statistics
   */
  async getTranslationStats(): Promise<Array<{
    language_code: string
    total_strings: number
    translated_strings: number
    completion_percentage: number
  }>> {
    try {
      const totalStrings = extractTranslatableStrings().length

      const { data, error } = await this.supabase
        .from('ui_string_translations')
        .select('language_code, translations')

      if (error || !data) return []

      return data.map(row => {
        const translatedCount = Object.keys(row.translations || {}).length
        return {
          language_code: row.language_code,
          total_strings: totalStrings,
          translated_strings: translatedCount,
          completion_percentage: Math.round((translatedCount / totalStrings) * 100)
        }
      })
    } catch (error) {
      console.error('Failed to get translation stats:', error)
      return []
    }
  }

  /**
   * Clear translation cache
   */
  clearCache(language?: string): void {
    if (language) {
      uiTranslationCache.delete(language)
    } else {
      uiTranslationCache.clear()
    }
  }
}

// Global instance
export const uiTranslationService = new UIStringTranslationService() 