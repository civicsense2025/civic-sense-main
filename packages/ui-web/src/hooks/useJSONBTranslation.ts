import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from './useTranslation'
import { supabase } from '../lib/supabase/client'
import { useLanguage } from '@/components/providers/language-provider'

/**
 * Translation metadata for a single translation
 */
export interface TranslationData {
  text: string
  lastUpdated?: string
  autoTranslated?: boolean
  reviewedBy?: string
  reviewedAt?: string
}

/**
 * Language-specific translations
 */
export interface LanguageTranslations {
  [languageCode: string]: TranslationData
}

/**
 * JSONB Translation Structure
 * This is the structure we'll use for storing translations in the database
 * Can be used at both field level and entity level
 */
export interface JSONBTranslations {
  [fieldOrLanguageCode: string]: LanguageTranslations | TranslationData
}

/**
 * Translatable Entity Interface
 * Any database entity that supports translations should implement this
 */
export interface TranslatableEntity {
  id: string
  translations?: JSONBTranslations | null
  [key: string]: any
}

/**
 * Translation Field Configuration
 * Defines which fields of an entity can be translated
 */
export interface TranslationFieldConfig {
  fieldName: string
  defaultLanguage?: string
  required?: boolean
  maxLength?: number
}

/**
 * Hook Options
 */
export interface UseJSONBTranslationOptions {
  tableName?: string
  fields?: TranslationFieldConfig[]
  autoTranslate?: boolean
  cacheTimeout?: number
  fallbackToRuntime?: boolean
}

/**
 * Translation Result
 */
export interface TranslationResult<T = any> {
  translatedEntity: T
  isTranslating: boolean
  error: string | null
  hasTranslation: boolean
  translationSource: 'jsonb' | 'runtime' | 'cache' | 'original'
  missingTranslations: string[]
}

// Local cache for JSONB translations
const jsonbTranslationCache = new Map<string, {
  translations: JSONBTranslations
  timestamp: number
}>()

/**
 * Comprehensive JSONB Translation Hook
 * 
 * This hook provides a unified interface for working with translations:
 * 1. Reads JSONB translations from database entities
 * 2. Falls back to runtime translation using the existing system
 * 3. Provides utilities for saving translations back to the database
 * 4. Manages translation state and caching
 */
export function useJSONBTranslation<T extends TranslatableEntity>(
  options: UseJSONBTranslationOptions = {}
) {
  const {
    tableName,
    fields = [],
    autoTranslate = true,
    cacheTimeout = 24 * 60 * 60 * 1000, // 24 hours
    fallbackToRuntime = true
  } = options

  const { translate: runtimeTranslate, translateBatch } = useTranslation({ cacheTimeout })
  const { currentLanguage } = useLanguage()
  // Using singleton supabase client

  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get translation from JSONB field
   */
  const getJSONBTranslation = useCallback((
    translations: JSONBTranslations | LanguageTranslations | null | undefined,
    language: string,
    fallbackLanguage: string = 'en'
  ): { text: string | null, metadata: any } => {
    if (!translations) return { text: null, metadata: null }

    // Check if this is a LanguageTranslations object (has language codes as keys)
    const trans = translations as LanguageTranslations
    
    // Try requested language
    if (trans[language] && typeof trans[language] === 'object' && 'text' in trans[language]) {
      const langData = trans[language] as TranslationData
      return {
        text: langData.text,
        metadata: langData
      }
    }

    // Try fallback language
    if (trans[fallbackLanguage] && typeof trans[fallbackLanguage] === 'object' && 'text' in trans[fallbackLanguage]) {
      const langData = trans[fallbackLanguage] as TranslationData
      return {
        text: langData.text,
        metadata: langData
      }
    }

    return { text: null, metadata: null }
  }, [])

  /**
   * Translate a single entity with JSONB support
   */
  const translateEntity = useCallback(async (
    entity: T,
    targetLanguage: string = currentLanguage,
    fieldsToTranslate?: string[]
  ): Promise<TranslationResult<T>> => {
    // If target language is English (default), return original
    if (targetLanguage === 'en') {
      return {
        translatedEntity: entity,
        isTranslating: false,
        error: null,
        hasTranslation: true,
        translationSource: 'original',
        missingTranslations: []
      }
    }

    const result: TranslationResult<T> = {
      translatedEntity: { ...entity },
      isTranslating: false,
      error: null,
      hasTranslation: false,
      translationSource: 'original',
      missingTranslations: []
    }

    try {
      setIsTranslating(true)
      setError(null)

      // Determine which fields to translate
      const translatableFields = fieldsToTranslate || 
        (fields.length > 0 ? fields.map(f => f.fieldName) : 
         ['question', 'explanation', 'hint', 'title', 'description', 'content'])

      // Check cache first
      const cacheKey = `${entity.id}-${targetLanguage}`
      const cached = jsonbTranslationCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        // Apply cached translations
        for (const field of translatableFields) {
          const translation = getJSONBTranslation(cached.translations, targetLanguage)
          if (translation.text && entity[field]) {
            (result.translatedEntity as any)[field] = translation.text
            result.hasTranslation = true
            result.translationSource = 'cache'
          }
        }
        if (result.hasTranslation) {
          return result
        }
      }

      // Check JSONB translations
      if (entity.translations) {
        let hasAnyTranslation = false
        
                 for (const field of translatableFields) {
           // Look for field-specific translations
           const fieldTranslations = entity.translations[field]
           if (fieldTranslations && typeof fieldTranslations === 'object') {
             const translation = getJSONBTranslation(fieldTranslations as LanguageTranslations, targetLanguage)
             if (translation.text) {
               (result.translatedEntity as any)[field] = translation.text
               hasAnyTranslation = true
             } else if (entity[field]) {
               result.missingTranslations.push(field)
             }
           } else if (entity[field]) {
             result.missingTranslations.push(field)
           }
         }

        if (hasAnyTranslation) {
          result.hasTranslation = true
          result.translationSource = 'jsonb'
        }
      }

      // Fall back to runtime translation if enabled and needed
      if (fallbackToRuntime && result.missingTranslations.length > 0) {
        const textsToTranslate: { field: string; text: string }[] = []
        
        for (const field of result.missingTranslations) {
          if (entity[field] && typeof entity[field] === 'string') {
            textsToTranslate.push({ field, text: entity[field] })
          }
        }

        if (textsToTranslate.length > 0) {
          // Batch translate all missing fields
          const translations = await translateBatch(
            textsToTranslate.map(t => t.text),
            targetLanguage
          )

          // Apply runtime translations
          textsToTranslate.forEach((item, index) => {
            if (translations[index] && translations[index] !== item.text) {
              (result.translatedEntity as any)[item.field] = translations[index]
              result.hasTranslation = true
              result.translationSource = 'runtime'
            }
          })
        }
      }

      // Cache the result
      if (result.hasTranslation) {
        const translationsToCache: JSONBTranslations = {}
        for (const field of translatableFields) {
          if ((result.translatedEntity as any)[field] !== entity[field]) {
            translationsToCache[field] = {
              [targetLanguage]: {
                text: (result.translatedEntity as any)[field],
                lastUpdated: new Date().toISOString(),
                autoTranslated: result.translationSource === 'runtime'
              }
            }
          }
        }
        jsonbTranslationCache.set(cacheKey, {
          translations: translationsToCache,
          timestamp: Date.now()
        })
      }

      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed'
      setError(errorMessage)
      return {
        ...result,
        error: errorMessage
      }
    } finally {
      setIsTranslating(false)
    }
  }, [currentLanguage, fields, cacheTimeout, fallbackToRuntime, getJSONBTranslation, translateBatch])

  /**
   * Translate multiple entities efficiently
   */
  const translateEntities = useCallback(async (
    entities: T[],
    targetLanguage: string = currentLanguage,
    fieldsToTranslate?: string[]
  ): Promise<TranslationResult<T>[]> => {
    if (entities.length === 0) return []

    try {
      setIsTranslating(true)
      setError(null)

      // Process entities in parallel for better performance
      const results = await Promise.all(
        entities.map(entity => translateEntity(entity, targetLanguage, fieldsToTranslate))
      )

      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch translation failed'
      setError(errorMessage)
      return entities.map(entity => ({
        translatedEntity: entity,
        isTranslating: false,
        error: errorMessage,
        hasTranslation: false,
        translationSource: 'original' as const,
        missingTranslations: []
      }))
    } finally {
      setIsTranslating(false)
    }
  }, [currentLanguage, translateEntity])

  /**
   * Save translations back to the database
   */
  const saveTranslations = useCallback(async (
    entityId: string,
    translations: JSONBTranslations,
    merge: boolean = true
  ): Promise<boolean> => {
    if (!tableName) {
      setError('Table name is required to save translations')
      return false
    }

    try {
      const { data: existingData, error: fetchError } = await supabase
        .from(tableName)
        .select('translations')
        .eq('id', entityId)
        .single()

      if (fetchError) {
        setError(`Failed to fetch existing translations: ${fetchError.message}`)
        return false
      }

      let updatedTranslations = translations
      if (merge && existingData?.translations) {
        // Deep merge existing translations with new ones
        updatedTranslations = deepMergeTranslations(
          existingData.translations as JSONBTranslations,
          translations
        )
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ translations: updatedTranslations })
        .eq('id', entityId)

      if (updateError) {
        setError(`Failed to save translations: ${updateError.message}`)
        return false
      }

      // Update cache
      const cacheKey = `${entityId}-${currentLanguage}`
      jsonbTranslationCache.set(cacheKey, {
        translations: updatedTranslations,
        timestamp: Date.now()
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save translations'
      setError(errorMessage)
      return false
    }
  }, [tableName, currentLanguage, supabase])

  /**
   * Generate translations for an entity and save to database
   */
  const generateAndSaveTranslations = useCallback(async (
    entity: T,
    targetLanguages: string[],
    fieldsToTranslate?: string[]
  ): Promise<boolean> => {
    try {
      setIsTranslating(true)
      setError(null)

      const translations: JSONBTranslations = entity.translations || {}
      const translatableFields = fieldsToTranslate || 
        (fields.length > 0 ? fields.map(f => f.fieldName) : 
         ['question', 'explanation', 'hint', 'title', 'description', 'content'])

      // Generate translations for each language
      for (const language of targetLanguages) {
        if (language === 'en') continue // Skip English

        for (const field of translatableFields) {
          if (!entity[field] || typeof entity[field] !== 'string') continue

          // Check if translation already exists
          const existingTranslation = translations[field]?.[language]
          if (existingTranslation?.text) continue

          // Generate new translation
          const result = await runtimeTranslate(entity[field], language)
          
          if (!translations[field]) {
            translations[field] = {}
          }
          
          translations[field][language] = {
            text: result.translatedText,
            lastUpdated: new Date().toISOString(),
            autoTranslated: true
          }
        }
      }

      // Save translations
      return await saveTranslations(entity.id, translations, true)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate translations'
      setError(errorMessage)
      return false
    } finally {
      setIsTranslating(false)
    }
  }, [fields, runtimeTranslate, saveTranslations])

  /**
   * Clear translation cache
   */
  const clearCache = useCallback(() => {
    jsonbTranslationCache.clear()
  }, [])

  /**
   * Get available languages for an entity
   */
  const getAvailableLanguages = useCallback((entity: T): string[] => {
    if (!entity.translations) return ['en']
    
    const languages = new Set<string>(['en'])
    
    // Check all fields for available languages
    Object.values(entity.translations).forEach(fieldTranslations => {
      if (typeof fieldTranslations === 'object' && fieldTranslations !== null) {
        Object.keys(fieldTranslations).forEach(lang => languages.add(lang))
      }
    })

    return Array.from(languages)
  }, [])

  /**
   * Check if entity has translations for a specific language
   */
  const hasTranslationsForLanguage = useCallback((
    entity: T,
    language: string,
    requiredFields?: string[]
  ): boolean => {
    if (language === 'en') return true
    if (!entity.translations) return false

    const fieldsToCheck = requiredFields || 
      (fields.length > 0 ? fields.map(f => f.fieldName) : 
       ['question', 'explanation', 'hint', 'title', 'description', 'content'])

    return fieldsToCheck.every(field => {
      const fieldTranslations = entity.translations?.[field]
      return fieldTranslations?.[language]?.text != null
    })
  }, [fields])

  return {
    // Core translation functions
    translateEntity,
    translateEntities,
    saveTranslations,
    generateAndSaveTranslations,
    
    // Utility functions
    getJSONBTranslation,
    getAvailableLanguages,
    hasTranslationsForLanguage,
    clearCache,
    
    // State
    isTranslating,
    error,
    currentLanguage
  }
}

/**
 * Helper function to deep merge translation objects
 */
function deepMergeTranslations(
  existing: JSONBTranslations,
  updates: JSONBTranslations
): JSONBTranslations {
  const merged = { ...existing }

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      merged[key] = merged[key] ? { ...merged[key], ...value } : value
    } else {
      merged[key] = value
    }
  }

  return merged
}

/**
 * React component helper to automatically translate entity props
 */
export function useTranslatedEntity<T extends TranslatableEntity>(
  entity: T | null | undefined,
  options?: UseJSONBTranslationOptions
): {
  entity: T | null
  isTranslating: boolean
  error: string | null
} {
  const { translateEntity, isTranslating, error } = useJSONBTranslation<T>(options)
  const { currentLanguage } = useLanguage()
  const [translatedEntity, setTranslatedEntity] = useState<T | null>(null)

  useEffect(() => {
    if (!entity) {
      setTranslatedEntity(null)
      return
    }

    if (currentLanguage === 'en') {
      setTranslatedEntity(entity)
      return
    }

    // Translate entity
    translateEntity(entity, currentLanguage).then(result => {
      setTranslatedEntity(result.translatedEntity)
    })
  }, [entity, currentLanguage, translateEntity])

  return {
    entity: translatedEntity,
    isTranslating,
    error
  }
}

/**
 * Batch translation helper for lists of entities
 */
export function useTranslatedEntities<T extends TranslatableEntity>(
  entities: T[],
  options?: UseJSONBTranslationOptions
): {
  entities: T[]
  isTranslating: boolean
  error: string | null
} {
  const { translateEntities, isTranslating, error } = useJSONBTranslation<T>(options)
  const { currentLanguage } = useLanguage()
  const [translatedEntities, setTranslatedEntities] = useState<T[]>([])

  useEffect(() => {
    if (!entities || entities.length === 0) {
      setTranslatedEntities([])
      return
    }

    if (currentLanguage === 'en') {
      setTranslatedEntities(entities)
      return
    }

    // Translate all entities
    translateEntities(entities, currentLanguage).then(results => {
      setTranslatedEntities(results.map(r => r.translatedEntity))
    })
  }, [entities, currentLanguage, translateEntities])

  return {
    entities: translatedEntities,
    isTranslating,
    error
  }
} 