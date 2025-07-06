"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Languages, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  RotateCcw,
  Zap,
  Globe
} from 'lucide-react'
import { LanguageSwitcher } from './language-switcher'
import { useLanguage, Language } from './providers/language-provider'
import { cn } from '@/lib/utils'

interface TranslationState {
  isTranslating: boolean
  isTranslated: boolean
  targetLanguage: Language | null
  originalContent: Map<string, string>
  translatedContent: Map<string, string>
  error: string | null
  usage?: {
    charactersProcessed: number
    charactersRemaining?: number
  }
}

interface PageTranslatorProps {
  className?: string
  autoTranslate?: boolean
  showUsage?: boolean
}

export function PageTranslator({ 
  className,
  autoTranslate = false,
  showUsage = true 
}: PageTranslatorProps) {
  const [state, setState] = useState<TranslationState>({
    isTranslating: false,
    isTranslated: false,
    targetLanguage: null,
    originalContent: new Map(),
    translatedContent: new Map(),
    error: null
  })
  
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<MutationObserver | null>(null)

  // Elements to translate (can be customized based on needs)
  const translatableSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'span', 'div[data-translatable]',
    'button:not([data-no-translate])',
    'label', 'a:not([data-no-translate])',
    '[data-translate]'
  ]

  const { supportedLanguages, currentLanguage, setLanguage } = useLanguage()

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('civicsense-language')
    if (savedLanguage && savedLanguage !== 'EN') {
      const language = supportedLanguages.find(lang => lang.code === savedLanguage)
      if (language) {
        setState(prev => ({ ...prev, targetLanguage: language }))
        if (autoTranslate) {
          handleTranslate(language)
        }
      }
    }
  }, [autoTranslate, supportedLanguages])

  const getTranslatableElements = (): Element[] => {
    const elements: Element[] = []
    
    translatableSelectors.forEach(selector => {
      const found = document.querySelectorAll(selector)
      found.forEach(element => {
        // Skip if already processed or marked as no-translate
        if (element.hasAttribute('data-translation-id') || 
            element.hasAttribute('data-no-translate') ||
            element.closest('[data-no-translate]')) {
          return
        }
        
        // Only include elements with meaningful text content
        const textContent = element.textContent?.trim()
        if (textContent && textContent.length > 2) {
          elements.push(element)
        }
      })
    })
    
    return elements
  }

  const generateTranslationId = (element: Element): string => {
    // Create a unique ID based on element content and position
    const text = element.textContent?.trim().substring(0, 50) || ''
    const tagName = element.tagName.toLowerCase()
    const classList = Array.from(element.classList).join('-')
    return `${tagName}-${classList}-${btoa(text).substring(0, 10)}`
  }

  const handleTranslate = async (targetLanguage: Language) => {
    if (state.isTranslating) return

    setState(prev => ({ 
      ...prev, 
      isTranslating: true, 
      error: null,
      targetLanguage 
    }))

    try {
      const elements = getTranslatableElements()
      
      if (elements.length === 0) {
        throw new Error('No translatable content found on this page')
      }

      // Store original content and assign IDs
      const originalContent = new Map<string, string>()
      const textsToTranslate: string[] = []
      const elementIds: string[] = []

      elements.forEach(element => {
        const id = generateTranslationId(element)
        const text = element.textContent?.trim() || ''
        
        element.setAttribute('data-translation-id', id)
        originalContent.set(id, text)
        textsToTranslate.push(text)
        elementIds.push(id)
      })

      // Batch translate all texts
      const combinedText = textsToTranslate.join('\n\n---SEPARATOR---\n\n')
      
      console.log(`Translating ${textsToTranslate.length} elements to ${targetLanguage.code}`)
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: combinedText,
          targetLanguage: targetLanguage.code,
          preserveFormatting: true,
          splitSentences: 'default'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Translation failed')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Translation failed')
      }

      // Split translated text back into individual translations
      const translatedTexts = result.translatedText.split('\n\n---SEPARATOR---\n\n')
      const translatedContent = new Map<string, string>()

      elementIds.forEach((id, index) => {
        if (translatedTexts[index]) {
          translatedContent.set(id, translatedTexts[index].trim())
        }
      })

      // Apply translations to elements
      elements.forEach(element => {
        const id = element.getAttribute('data-translation-id')
        if (id && translatedContent.has(id)) {
          const translatedText = translatedContent.get(id)!
          element.textContent = translatedText
          element.setAttribute('data-translated', 'true')
        }
      })

      setState(prev => ({
        ...prev,
        isTranslating: false,
        isTranslated: true,
        originalContent,
        translatedContent,
        usage: result.usage
      }))

      // Save language preference
      localStorage.setItem('civicsense-language', targetLanguage.code)

    } catch (error) {
      console.error('Translation error:', error)
      setState(prev => ({
        ...prev,
        isTranslating: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      }))
    }
  }

  const handleRestore = () => {
    // Restore original content
    const elements = document.querySelectorAll('[data-translation-id]')
    elements.forEach(element => {
      const id = element.getAttribute('data-translation-id')
      if (id && state.originalContent.has(id)) {
        element.textContent = state.originalContent.get(id)!
        element.removeAttribute('data-translated')
      }
    })

    setState(prev => ({
      ...prev,
      isTranslated: false,
      targetLanguage: null,
      translatedContent: new Map(),
      error: null
    }))

    localStorage.setItem('civicsense-language', 'EN')
  }

  const handleLanguageChange = (language: Language) => {
    if (language.code === 'EN') {
      handleRestore()
    } else {
      handleTranslate(language)
    }
  }

  if (!isVisible) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700"
        >
          <Globe className="h-4 w-4 mr-2" />
          Translate
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <Card className="w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Languages className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <CardTitle className="text-sm">Page Translator</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs">
            Translate this page using DeepL
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Language Switcher */}
          <div className="space-y-2">
            <LanguageSwitcher
              variant="compact"
            />
          </div>

          {/* Status */}
          {state.isTranslating && (
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Translating page...</span>
            </div>
          )}

          {state.isTranslated && state.targetLanguage && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  Translated to {state.targetLanguage.emoji} {state.targetLanguage.name}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleRestore}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore Original
                </Button>
              </div>
            </div>
          )}

          {state.error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-xs text-red-800 dark:text-red-200">
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Usage Information */}
          {showUsage && state.usage && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Zap className="h-3 w-3 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Translation Usage
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div>Characters: {state.usage.charactersProcessed.toLocaleString()}</div>
                  {state.usage.charactersRemaining !== undefined && (
                    <div>Remaining: {state.usage.charactersRemaining.toLocaleString()}</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Current Language Badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              {state.isTranslated && state.targetLanguage ? (
                <>
                  {state.targetLanguage.emoji} {state.targetLanguage.name}
                </>
              ) : (
                <>🇺🇸 English (Original)</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 