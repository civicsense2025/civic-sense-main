import { useState, useEffect, useCallback } from 'react'

interface Language {
  code: string
  name: string
  nativeName: string
  emoji: string
}

interface TranslationCache {
  [key: string]: {
    [targetLang: string]: {
      text: string
      timestamp: number
    }
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
    charactersRemaining?: number
  }
}

// Default language for the hook
const DEFAULT_LANGUAGE: Language = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
  emoji: '🇺🇸'
}

// Improved rate limiting constants
const RATE_LIMIT_DELAY = 1200 // 1.2 seconds between requests (more conservative)
const MAX_RETRIES = 2 // Reduced retries to avoid excessive API calls
const RETRY_DELAY = 3000 // 3 seconds between retries

// Global rate limiting state
let lastRequestTime = 0
let requestQueue: Array<() => void> = []
let isProcessingQueue = false
let activeRequests = 0
const MAX_CONCURRENT_REQUESTS = 2 // Limit concurrent requests

// Process request queue with improved rate limiting
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) return
  
  isProcessingQueue = true
  
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest))
    }
    
    const nextRequest = requestQueue.shift()
    if (nextRequest) {
      lastRequestTime = Date.now()
      activeRequests++
      nextRequest()
    }
  }
  
  isProcessingQueue = false
}

// Safe base64 encoding that handles Unicode characters
const safeBase64Encode = (str: string): string => {
  try {
    // First encode as UTF-8, then to base64
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16))
    }))
  } catch (error) {
    // Fallback: use a simple hash for non-Latin characters
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

// Global cache to persist across hook instances
const globalTranslationCache: TranslationCache = {}

export function useTranslation(options: UseTranslationOptions = {}) {
  const {
    cacheTimeout = 24 * 60 * 60 * 1000, // 24 hours
    autoDetectLanguage = true,
    preserveFormatting = true,
    formality = 'default'
  } = options

  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE)
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate cache key safely
  const getCacheKey = useCallback((text: string): string => {
    return safeBase64Encode(text.trim().toLowerCase())
  }, [])

  // Get cached translation
  const getCachedTranslation = useCallback((text: string, targetLanguage: string): string | null => {
    const key = getCacheKey(text)
    const cached = globalTranslationCache[key]?.[targetLanguage]
    
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.text
    }
    
    return null
  }, [cacheTimeout, getCacheKey])

  // Store translation in cache
  const setCachedTranslation = useCallback((text: string, targetLanguage: string, translatedText: string) => {
    const key = getCacheKey(text)
    if (!globalTranslationCache[key]) {
      globalTranslationCache[key] = {}
    }
    globalTranslationCache[key][targetLanguage] = {
      text: translatedText,
      timestamp: Date.now()
    }
  }, [getCacheKey])

  // Clean expired cache entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      
      Object.keys(globalTranslationCache).forEach(key => {
        const languages = globalTranslationCache[key]
        
        Object.keys(languages).forEach(lang => {
          if (now - languages[lang].timestamp >= cacheTimeout) {
            delete languages[lang]
          }
        })
        
        if (Object.keys(languages).length === 0) {
          delete globalTranslationCache[key]
        }
      })
    }

    const interval = setInterval(cleanup, 60 * 60 * 1000) // Clean every hour
    return () => clearInterval(interval)
  }, [cacheTimeout])

  // Make API request with improved retry logic and request tracking
  const makeTranslationRequest = useCallback(async (
    text: string, 
    targetLanguage: string, 
    retryCount = 0
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const makeRequest = async () => {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              targetLanguage,
              preserveFormatting,
              splitSentences: '1',
              formality
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            
            // Handle rate limiting with exponential backoff
            if (response.status === 429 && retryCount < MAX_RETRIES) {
              const delay = RETRY_DELAY * Math.pow(2, retryCount)
              console.log(`🌐 Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)
              setTimeout(() => {
                makeTranslationRequest(text, targetLanguage, retryCount + 1)
                  .then(resolve)
                  .catch(reject)
              }, delay)
              return
            }
            
            throw new Error(errorData.error || `HTTP ${response.status}`)
          }

          const data = await response.json()
          resolve(data.translatedText || text)
        } catch (error) {
          if (retryCount < MAX_RETRIES && (error as Error).message.includes('429')) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount)
            setTimeout(() => {
              makeTranslationRequest(text, targetLanguage, retryCount + 1)
                .then(resolve)
                .catch(reject)
            }, delay)
          } else {
            reject(error)
          }
        } finally {
          activeRequests--
          // Process any queued requests
          if (requestQueue.length > 0) {
            setTimeout(processQueue, 100)
          }
        }
      }

      // Add to queue for rate limiting
      requestQueue.push(makeRequest)
      processQueue()
    })
  }, [preserveFormatting, formality])

  // Single text translation with improved caching
  const translate = useCallback(async (text: string, targetLanguage?: string): Promise<TranslationResult> => {
    const target = targetLanguage || currentLanguage.code
    
    if (!text?.trim()) {
      return {
        translatedText: text,
        fromCache: false
      }
    }

    if (target === 'en') {
      return {
        translatedText: text,
        fromCache: false
      }
    }

    // Check cache first
    const cached = getCachedTranslation(text, target)
    if (cached) {
      return {
        translatedText: cached,
        fromCache: true
      }
    }

    setIsTranslating(true)
    setError(null)

    try {
      const translatedText = await makeTranslationRequest(text, target)
      
      // Cache the result
      setCachedTranslation(text, target, translatedText)
      
      return {
        translatedText,
        fromCache: false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed'
      setError(errorMessage)
      console.error('🌐 Translation failed:', errorMessage)
      
      // Cache the original text to avoid retrying the same failed translation
      setCachedTranslation(text, target, text)
      
      return {
        translatedText: text,
        fromCache: false
      }
    } finally {
      setIsTranslating(false)
    }
  }, [currentLanguage.code, getCachedTranslation, setCachedTranslation, makeTranslationRequest])

  // Improved batch translation with better error handling and caching
  const translateBatch = useCallback(async (texts: string[], targetLanguage?: string): Promise<string[]> => {
    const target = targetLanguage || currentLanguage.code
    
    if (target === 'en') {
      return texts
    }

    if (!texts.length) {
      return []
    }

    // Filter out empty texts and check cache first
    const results: string[] = new Array(texts.length)
    const uncachedIndices: number[] = []
    const uncachedTexts: string[] = []

    texts.forEach((text, index) => {
      if (!text?.trim()) {
        results[index] = text
        return
      }

      const cached = getCachedTranslation(text, target)
      if (cached) {
        results[index] = cached
      } else {
        uncachedIndices.push(index)
        uncachedTexts.push(text)
      }
    })

    // If everything was cached, return immediately
    if (uncachedTexts.length === 0) {
      return results
    }

    setIsTranslating(true)
    setError(null)

    try {
      // Process uncached texts in smaller batches to avoid overwhelming the API
      const batchSize = 5 // Smaller batches for better reliability
      
      for (let i = 0; i < uncachedTexts.length; i += batchSize) {
        const batch = uncachedTexts.slice(i, i + batchSize)
        const batchIndices = uncachedIndices.slice(i, i + batchSize)
        
        try {
          // Translate each text individually to avoid batch failures
          const batchResults = await Promise.allSettled(
            batch.map(text => makeTranslationRequest(text, target))
          )
          
          batchResults.forEach((result, batchIndex) => {
            const originalIndex = batchIndices[batchIndex]
            const originalText = batch[batchIndex]
            
            if (result.status === 'fulfilled') {
              results[originalIndex] = result.value
              setCachedTranslation(originalText, target, result.value)
            } else {
              console.error(`🌐 Translation failed for text ${originalIndex}:`, result.reason)
              results[originalIndex] = originalText
              setCachedTranslation(originalText, target, originalText) // Cache as failed
            }
          })
          
          // Add delay between batches
          if (i + batchSize < uncachedTexts.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`🌐 Batch translation failed:`, error)
          // Fill remaining results with original texts
          batchIndices.forEach((originalIndex, batchIndex) => {
            results[originalIndex] = batch[batchIndex]
          })
        }
      }

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch translation failed'
      setError(errorMessage)
      console.error('🌐 Batch translation failed:', errorMessage)
      
      // Return original texts on error
      return texts
    } finally {
      setIsTranslating(false)
    }
  }, [currentLanguage.code, getCachedTranslation, setCachedTranslation, makeTranslationRequest])

  return {
    translate,
    translateBatch,
    isTranslating,
    error,
    currentLanguage,
    setCurrentLanguage,
    clearCache: () => {
      Object.keys(globalTranslationCache).forEach(key => {
        delete globalTranslationCache[key]
      })
    },
    getCacheStats: () => ({
      totalEntries: Object.keys(globalTranslationCache).length,
      totalTranslations: Object.values(globalTranslationCache).reduce((sum, langs) => sum + Object.keys(langs).length, 0)
    })
  }
} 