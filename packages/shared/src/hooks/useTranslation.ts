import { useState, useEffect, useCallback } from 'react'

interface Language {
  code: string
  name: string
  nativeName: string
  emoji: string
}

interface TranslationCache {
  [key: string]: {
    text: string
    timestamp: number
  }
}

interface UseTranslationOptions {
  cacheTimeout?: number // in milliseconds
  autoDetectLanguage?: boolean
  preserveFormatting?: boolean
  formality?: 'default' | 'more' | 'less' | 'prefer_more' | 'prefer_less'
}

interface TranslationResult {
  translatedText: string
  detectedLanguage?: string
  fromCache: boolean
  usage?: {
    charactersProcessed: number
    charactersRemaining: number | null
  }
}

// Global cache to persist across hook instances
const globalTranslationCache: TranslationCache = {}

// Rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1200 // 1.2 seconds between requests

function createSafeCacheKey(text: string, targetLanguage: string): string {
  try {
    // Create a simple hash-based key
    const combined = `${text}|${targetLanguage}`
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  } catch (error) {
    // Fallback to simple concatenation
    return `${text.slice(0, 50)}_${targetLanguage}`
  }
}

async function rateLimiter() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  lastRequestTime = Date.now()
}

export function useTranslation(options: UseTranslationOptions = {}) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simple single text translation
  const translate = useCallback(async (
    text: string, 
    targetLanguage: string = 'en'
  ): Promise<TranslationResult> => {
    if (!text || !text.trim()) {
      return {
        translatedText: text,
        fromCache: false
      }
    }

    // If target is English, return original
    if (targetLanguage.toLowerCase() === 'en' || targetLanguage.toLowerCase() === 'english') {
      return {
        translatedText: text,
        fromCache: false
      }
    }

    const cacheTimeout = options.cacheTimeout || 24 * 60 * 60 * 1000 // 24 hours
    const cacheKey = createSafeCacheKey(text, targetLanguage)
    
    // Check cache first
    const cached = globalTranslationCache[cacheKey]
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return {
        translatedText: cached.text,
        fromCache: true
      }
    }

    setIsTranslating(true)
    setError(null)

    try {
      await rateLimiter()

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          preserveFormatting: options.preserveFormatting ?? true,
          splitSentences: '1',
          formality: options.formality || 'default'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.translatedText) {
        // Cache the result
        globalTranslationCache[cacheKey] = {
          text: data.translatedText,
          timestamp: Date.now()
        }

        return {
          translatedText: data.translatedText,
          detectedLanguage: data.detectedLanguage,
          fromCache: false,
          usage: data.usage
        }
      } else {
        throw new Error(data.error || 'Translation failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed'
      setError(errorMessage)
      console.error('Translation error:', errorMessage)
      
      return {
        translatedText: text, // Return original on error
        fromCache: false
      }
    } finally {
      setIsTranslating(false)
    }
  }, [options.cacheTimeout, options.preserveFormatting, options.formality])

  // Batch translation - much more efficient
  const translateBatch = useCallback(async (
    texts: string[], 
    targetLanguage: string = 'en',
    batchOptions: UseTranslationOptions = {}
  ): Promise<string[]> => {
    if (texts.length === 0) return []
    
    // If target is English, return original texts
    if (targetLanguage.toLowerCase() === 'en' || targetLanguage.toLowerCase() === 'english') {
      return texts
    }

    const cacheTimeout = batchOptions.cacheTimeout || options.cacheTimeout || 24 * 60 * 60 * 1000
    const results: string[] = []
    const textsToTranslate: string[] = []
    const indexMap: number[] = []

    // Check cache for each text
    texts.forEach((text, index) => {
      if (!text || !text.trim()) {
        results[index] = text
        return
      }

      const cacheKey = createSafeCacheKey(text, targetLanguage)
      const cached = globalTranslationCache[cacheKey]
      
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        results[index] = cached.text
      } else {
        textsToTranslate.push(text)
        indexMap.push(index)
      }
    })

    // If all texts were cached, return immediately
    if (textsToTranslate.length === 0) {
      return results
    }

    console.log(`🚀 Batch translating ${textsToTranslate.length} texts to ${targetLanguage}`)

    setIsTranslating(true)
    setError(null)

    try {
      // Use large batch size for efficiency - DeepL supports up to 50 texts per request
      const maxBatchSize = 50
      const allTranslations: string[] = []

      for (let i = 0; i < textsToTranslate.length; i += maxBatchSize) {
        const batch = textsToTranslate.slice(i, i + maxBatchSize)
        
        // Apply rate limiting between batches only
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1200))
        }

        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              texts: batch, // Send all texts in one request
              targetLanguage,
              preserveFormatting: batchOptions.preserveFormatting ?? options.preserveFormatting ?? true,
              splitSentences: '1',
              formality: batchOptions.formality || options.formality || 'default'
            }),
          })

          if (!response.ok) {
            if (response.status === 429) {
              console.warn('Rate limited, waiting longer...')
              await new Promise(resolve => setTimeout(resolve, 5000))
              i -= maxBatchSize // Retry this batch
              continue
            }
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.json()
          
          if (data.success && data.translations) {
            // Handle batch response
            const batchTranslations = data.translations.map((t: any) => t.translatedText || t.text || '')
            allTranslations.push(...batchTranslations)
            
            // Cache all translations from this batch
            batch.forEach((originalText, batchIndex) => {
              const translatedText = batchTranslations[batchIndex]
              if (translatedText) {
                const cacheKey = createSafeCacheKey(originalText, targetLanguage)
                globalTranslationCache[cacheKey] = {
                  text: translatedText,
                  timestamp: Date.now()
                }
              }
            })
            
            console.log(`✅ Batch ${Math.floor(i/maxBatchSize) + 1} completed: ${batchTranslations.length} translations`)
          } else {
            throw new Error(data.error || 'Translation failed')
          }
        } catch (error) {
          console.error(`Batch translation error for batch starting at ${i}:`, error)
          
          // For failed batches, use original text
          const fallbackTranslations = batch.map(text => text)
          allTranslations.push(...fallbackTranslations)
        }
      }

      // Map translations back to original positions
      allTranslations.forEach((translation, i) => {
        const originalIndex = indexMap[i]
        results[originalIndex] = translation
      })

      // Fill any remaining slots with original text
      texts.forEach((text, index) => {
        if (results[index] === undefined) {
          results[index] = text
        }
      })

      return results

    } catch (error) {
      console.error('Batch translation failed:', error)
      setError(error instanceof Error ? error.message : 'Batch translation failed')
      // Return original texts on failure
      return texts
    } finally {
      setIsTranslating(false)
    }
  }, [options.cacheTimeout, options.preserveFormatting, options.formality])

  // Clear cache function
  const clearCache = useCallback(() => {
    Object.keys(globalTranslationCache).forEach(key => {
      delete globalTranslationCache[key]
    })
  }, [])

  return {
    translate,
    translateBatch,
    isTranslating,
    error,
    clearCache
  }
} 