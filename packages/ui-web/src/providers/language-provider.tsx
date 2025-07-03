"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@civicsense/shared/useTranslation'

// Comprehensive language list with proper codes, names, and emojis
const SUPPORTED_LANGUAGES = [
  // Popular languages (shown first in switcher)
  { code: 'en', name: 'English', nativeName: 'English', emoji: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', emoji: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', emoji: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', emoji: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', emoji: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', emoji: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', emoji: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', emoji: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', emoji: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', emoji: '🇨🇳' },
  
  // Additional languages
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', emoji: '🇸🇦' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', emoji: '🇧🇬' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', emoji: '🇨🇿' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', emoji: '🇩🇰' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', emoji: '🇬🇷' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', emoji: '🇪🇪' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', emoji: '🇫🇮' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', emoji: '🇭🇺' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', emoji: '🇮🇩' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', emoji: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', emoji: '🇱🇹' },
  { code: 'nb', name: 'Norwegian', nativeName: 'Norsk', emoji: '🇳🇴' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', emoji: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', emoji: '🇵🇱' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', emoji: '🇷🇴' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', emoji: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', emoji: '🇸🇮' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', emoji: '🇸🇪' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', emoji: '🇹🇷' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', emoji: '🇺🇦' },
  { code: 'zh-hans', name: 'Chinese (Simplified)', nativeName: '简体中文', emoji: '🇨🇳' },
  { code: 'zh-hant', name: 'Chinese (Traditional)', nativeName: '繁體中文', emoji: '🇹🇼' },
] as const

export interface Language {
  code: string
  name: string
  nativeName: string
  emoji: string
}

interface LanguageContextType {
  currentLanguage: string
  setLanguage: (languageCode: string) => void
  isTranslating: boolean
  isPageTranslated: boolean
  supportedLanguages: readonly Language[]
  translate: (text: string, targetLanguage?: string) => Promise<string>
  translateBatch: (texts: string[], targetLanguage?: string) => Promise<string[]>
  translatePage: (targetLanguage: string) => Promise<void>
  restoreOriginalPage: () => void
  getLanguageInfo: (code: string) => Language | undefined
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Page-level translation cache to avoid re-translating the same content
const pageTranslationCache = new Map<string, Map<string, string>>()

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en')
  const [isPageTranslated, setIsPageTranslated] = useState<boolean>(false)
  const [originalContent, setOriginalContent] = useState<Map<Element, string>>(new Map())
  const [isTranslating, setIsTranslating] = useState<boolean>(false)

  // Use the translation hook
  const { translate: hookTranslate, translateBatch: hookTranslateBatch } = useTranslation()

  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language')
    if (savedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  // Get page cache for current language
  const getPageCache = useCallback((targetLanguage: string) => {
    if (!pageTranslationCache.has(targetLanguage)) {
      pageTranslationCache.set(targetLanguage, new Map())
    }
    return pageTranslationCache.get(targetLanguage)!
  }, [])

  // More intelligent element filtering - only get elements that contain actual readable text
  const getTranslatableElements = useCallback(() => {
    const elements: { element: Element; text: string }[] = []
    
    // More specific selectors that are likely to contain readable content
    const contentSelectors = [
      'h1, h2, h3, h4, h5, h6', // Headings
      'p', // Paragraphs
      'li', // List items
      'td, th', // Table cells
      'figcaption', // Figure captions
      'blockquote', // Quotes
      'div[class*="content"]', // Content divs
      'div[class*="text"]', // Text divs
      'span:not([class*="icon"]):not([class*="emoji"])', // Text spans (exclude icons)
      'label:not([for])', // Standalone labels
      'button:not([aria-label]):not([title])', // Buttons with text content
      'a:not([aria-label]):not([title])', // Links with text content
    ]
    
    // Elements to always skip
    const skipSelectors = [
      '[data-no-translate]',
      '.no-translate',
      '.language-switcher',
      'script',
      'style',
      'code',
      'pre',
      'noscript',
      '[contenteditable="true"]',
      'input',
      'textarea',
      'select',
      '[role="button"]',
      '[aria-hidden="true"]',
      '.sr-only',
      '[class*="icon"]',
      '[class*="emoji"]',
      '[data-translated="true"]'
    ]
    
    contentSelectors.forEach(selector => {
      try {
        const nodeList = document.querySelectorAll(selector)
        nodeList.forEach(element => {
          // Skip if element matches any skip selector
          if (skipSelectors.some(skipSelector => {
            try {
              return element.matches(skipSelector) || element.closest(skipSelector)
            } catch {
              return false
            }
          })) {
            return
          }
          
          // Get direct text content (not from child elements)
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                // Only accept text nodes that are direct children or in simple inline elements
                const parent = node.parentElement
                if (!parent) return NodeFilter.FILTER_REJECT
                
                // Skip if parent has skip attributes
                if (parent.hasAttribute('data-no-translate') || 
                    parent.classList.contains('no-translate') ||
                    parent.hasAttribute('data-translated')) {
                  return NodeFilter.FILTER_REJECT
                }
                
                const text = node.textContent?.trim()
                if (!text || text.length < 3) return NodeFilter.FILTER_REJECT
                
                // Skip pure numbers, symbols, or single words that look like UI
                if (/^[0-9\s\.,\-\+\(\)\[\]{}%$€£¥]+$/.test(text)) return NodeFilter.FILTER_REJECT
                if (/^[A-Z]{2,}$/.test(text)) return NodeFilter.FILTER_REJECT // Skip all-caps abbreviations
                
                return NodeFilter.FILTER_ACCEPT
              }
            }
          )
          
          let textNode
          const textNodes: Text[] = []
          while (textNode = walker.nextNode()) {
            textNodes.push(textNode as Text)
          }
          
          // Combine text nodes from the same element
          if (textNodes.length > 0) {
            const combinedText = textNodes.map(node => node.textContent || '').join(' ').trim()
            if (combinedText.length >= 3) {
              elements.push({ element, text: combinedText })
            }
          }
        })
      } catch (error) {
        console.warn(`Error processing selector ${selector}:`, error)
      }
    })
    
    // Remove duplicates and sort by text length (longer texts first for better batching)
    const uniqueElements = Array.from(
      new Map(elements.map(item => [item.element, item])).values()
    ).sort((a, b) => b.text.length - a.text.length)
    
    return uniqueElements
  }, [])

  // Ultra-fast page translation - collect ALL text and translate in one shot
  const translatePage = useCallback(async (targetLanguage: string) => {
    if (targetLanguage === 'en' || isTranslating) return
    
    setIsTranslating(true)
    console.log(`🚀 Starting ultra-fast page translation to ${targetLanguage}...`)
    
    try {
      // Step 1: Collect ALL translatable text in one pass
      const elementsToTranslate = getTranslatableElements()
      
      if (elementsToTranslate.length === 0) {
        console.log('🌐 No translatable content found')
        setIsTranslating(false)
        return
      }
      
      console.log(`🌐 Found ${elementsToTranslate.length} elements to translate`)
      
      const cache = getPageCache(targetLanguage)
      const originalContentMap = new Map<Element, string>()
      const textsToTranslate: string[] = []
      const elementTextMap = new Map<string, Element[]>()
      
      // Step 2: Prepare all texts for translation, group identical texts
      elementsToTranslate.forEach(({ element, text }) => {
        originalContentMap.set(element, text)
        
        // Check cache first
        if (cache.has(text)) {
          const cachedTranslation = cache.get(text)!
          if (cachedTranslation !== text) {
            element.textContent = cachedTranslation
            element.setAttribute('data-translated', 'true')
          }
          return
        }
        
        // Group elements with identical text to avoid duplicate translations
        if (!elementTextMap.has(text)) {
          elementTextMap.set(text, [])
          textsToTranslate.push(text)
        }
        elementTextMap.get(text)!.push(element)
      })
      
      setOriginalContent(originalContentMap)
      
      if (textsToTranslate.length === 0) {
        console.log('🌐 All content was already cached')
        setIsPageTranslated(true)
        setIsTranslating(false)
        return
      }
      
      console.log(`🚀 Translating ${textsToTranslate.length} unique texts in large batches...`)
      
      // Step 3: Translate in LARGE batches (up to 50 texts per request as per DeepL API)
      const maxBatchSize = 50 // DeepL API limit
      const allTranslations: string[] = []
      
      for (let i = 0; i < textsToTranslate.length; i += maxBatchSize) {
        const batch = textsToTranslate.slice(i, i + maxBatchSize)
        
        try {
          console.log(`🚀 Translating batch ${Math.floor(i/maxBatchSize) + 1}: ${batch.length} texts`)
          const translations = await hookTranslateBatch(batch, targetLanguage)
          allTranslations.push(...translations)
          
          // Step 4: Apply translations immediately to ALL elements with the same text
          batch.forEach((originalText, index) => {
            const translatedText = translations[index]
            const elements = elementTextMap.get(originalText) || []
            
            if (translatedText && translatedText !== originalText) {
              // Apply to ALL elements with this text
              elements.forEach(element => {
                element.textContent = translatedText
                element.setAttribute('data-translated', 'true')
              })
              cache.set(originalText, translatedText)
            }
          })
          
          // Much shorter delay between large batches
          if (i + maxBatchSize < textsToTranslate.length) {
            await new Promise(resolve => setTimeout(resolve, 200)) // Just 200ms between batches
          }
          
        } catch (error) {
          console.error(`🌐 Translation batch failed:`, error)
          // Apply original text to failed elements
          batch.forEach(originalText => {
            const elements = elementTextMap.get(originalText) || []
            elements.forEach(element => {
              cache.set(originalText, originalText) // Cache as untranslated
            })
          })
        }
      }
      
      setIsPageTranslated(true)
      console.log(`🎉 Ultra-fast translation completed! Translated ${allTranslations.length} unique texts in ${Math.ceil(textsToTranslate.length / maxBatchSize)} API calls.`)
      
    } catch (error) {
      console.error('🌐 Page translation failed:', error)
    } finally {
      setIsTranslating(false)
    }
  }, [isTranslating, hookTranslateBatch, getTranslatableElements, getPageCache])

  // Improved restoreOriginalPage function
  const restoreOriginalPage = useCallback(() => {
    console.log('🌐 Restoring original page content...')
    
    // Restore all elements that have been translated
    document.querySelectorAll('[data-translated="true"]').forEach(element => {
      const originalText = originalContent.get(element)
      if (originalText) {
        element.textContent = originalText
      }
      element.removeAttribute('data-translated')
    })
    
    setIsPageTranslated(false)
    setOriginalContent(new Map())
    console.log('🌐 Original content restored')
  }, [originalContent])

  // Auto-translate when language changes (with better debouncing)
  useEffect(() => {
    if (currentLanguage === 'en') {
      if (isPageTranslated) {
        restoreOriginalPage()
      }
    } else {
      // Longer debounce to prevent rapid API calls
      const timeoutId = setTimeout(() => {
        translatePage(currentLanguage)
      }, 1000) // 1 second debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [currentLanguage, isPageTranslated, translatePage, restoreOriginalPage])

  const translate = useCallback(async (text: string, targetLanguage?: string): Promise<string> => {
    const target = targetLanguage || currentLanguage
    
    try {
      const result = await hookTranslate(text, target)
      return result.translatedText
    } catch (error) {
      console.error('🌐 Single translation failed:', error)
      return text
    }
  }, [hookTranslate, currentLanguage])

  const translateBatch = useCallback(async (texts: string[], targetLanguage?: string): Promise<string[]> => {
    const target = targetLanguage || currentLanguage
    
    try {
      return await hookTranslateBatch(texts, target)
    } catch (error) {
      console.error('🌐 Batch translation failed:', error)
      return texts
    }
  }, [hookTranslateBatch, currentLanguage])

  const setLanguage = useCallback((languageCode: string) => {
    if (SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode)) {
      setCurrentLanguage(languageCode)
      localStorage.setItem('preferred-language', languageCode)
    }
  }, [])

  const getLanguageInfo = useCallback((code: string): Language | undefined => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
  }, [])

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isTranslating,
    isPageTranslated,
    supportedLanguages: SUPPORTED_LANGUAGES,
    translate,
    translateBatch,
    translatePage,
    restoreOriginalPage,
    getLanguageInfo,
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
} 