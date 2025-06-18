import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from './useTranslation'
import { useLanguage } from '@/components/providers/language-provider'
import { createClient } from '@/utils/supabase/client'

/**
 * Simplified quiz-specific translation hook
 * This provides an easy-to-use interface for translating quiz questions
 */

interface TranslatedQuestion {
  id: string
  question: string
  explanation: string
  hint: string
  option_a?: string | null
  option_b?: string | null
  option_c?: string | null
  option_d?: string | null
  options?: Array<{ id: string; text: string }>
  [key: string]: any
}

interface UseQuizTranslationOptions {
  autoTranslate?: boolean
  cacheResults?: boolean
}

export function useQuizTranslation(options: UseQuizTranslationOptions = {}) {
  const { autoTranslate = true, cacheResults = true } = options
  const { currentLanguage } = useLanguage()
  const { translateBatch } = useTranslation()
  const supabase = createClient()
  
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationCache] = useState(new Map<string, any>())

  /**
   * Translate a single question
   */
  const translateQuestion = useCallback(async (
    question: any,
    targetLanguage: string = currentLanguage
  ): Promise<TranslatedQuestion> => {
    // If English, return original
    if (targetLanguage === 'en') {
      return question
    }

    // Check cache
    const cacheKey = `${question.id}-${targetLanguage}`
    if (cacheResults && translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)
    }

    setIsTranslating(true)
    try {
      // First check if question has JSONB translations
      if (question.translations) {
        const translated = { ...question }
        
        // Check for field-level translations
        const fields = ['question', 'explanation', 'hint', 'option_a', 'option_b', 'option_c', 'option_d']
        let hasTranslations = false
        
        for (const field of fields) {
          const fieldTranslations = question.translations[field]
          if (fieldTranslations?.[targetLanguage]?.text) {
            translated[field] = fieldTranslations[targetLanguage].text
            hasTranslations = true
          }
        }
        
        if (hasTranslations) {
          // Also handle options array if present
          if (question.options && Array.isArray(question.options)) {
            translated.options = question.options.map((opt: any, idx: number) => {
              const optionField = `option_${String.fromCharCode(97 + idx)}`
              const optionTranslation = question.translations[optionField]?.[targetLanguage]?.text
              return {
                ...opt,
                text: optionTranslation || opt.text
              }
            })
          }
          
          if (cacheResults) {
            translationCache.set(cacheKey, translated)
          }
          return translated
        }
      }

      // Fall back to runtime translation
      if (autoTranslate) {
        const textsToTranslate: string[] = []
        const fieldMap: { [key: number]: string } = {}
        let index = 0

        // Collect texts to translate
        if (question.question) {
          textsToTranslate.push(question.question)
          fieldMap[index++] = 'question'
        }
        if (question.explanation) {
          textsToTranslate.push(question.explanation)
          fieldMap[index++] = 'explanation'
        }
        if (question.hint) {
          textsToTranslate.push(question.hint)
          fieldMap[index++] = 'hint'
        }
        
        // Handle multiple choice options
        const optionFields = ['option_a', 'option_b', 'option_c', 'option_d']
        for (const field of optionFields) {
          if (question[field]) {
            textsToTranslate.push(question[field])
            fieldMap[index++] = field
          }
        }

        // Handle options array
        const optionStartIndex = index
        if (question.options && Array.isArray(question.options)) {
          question.options.forEach((opt: any) => {
            textsToTranslate.push(opt.text || opt.label || opt)
            index++
          })
        }

        if (textsToTranslate.length > 0) {
          const translations = await translateBatch(textsToTranslate, targetLanguage)
          const translated = { ...question }

          // Apply translations
          translations.forEach((translatedText, idx) => {
            if (idx < optionStartIndex) {
              const field = fieldMap[idx]
              translated[field] = translatedText
            } else if (question.options) {
              const optionIndex = idx - optionStartIndex
              if (!translated.options) {
                translated.options = [...question.options]
              }
              translated.options[optionIndex] = {
                ...question.options[optionIndex],
                text: translatedText
              }
            }
          })

          if (cacheResults) {
            translationCache.set(cacheKey, translated)
          }
          return translated
        }
      }

      return question
    } finally {
      setIsTranslating(false)
    }
  }, [currentLanguage, autoTranslate, cacheResults, translateBatch, translationCache])

  /**
   * Translate multiple questions efficiently
   */
  const translateQuestions = useCallback(async (
    questions: any[],
    targetLanguage: string = currentLanguage
  ): Promise<TranslatedQuestion[]> => {
    if (targetLanguage === 'en' || questions.length === 0) {
      return questions
    }

    setIsTranslating(true)
    try {
      // Process in parallel for better performance
      const translatedQuestions = await Promise.all(
        questions.map(q => translateQuestion(q, targetLanguage))
      )
      return translatedQuestions
    } finally {
      setIsTranslating(false)
    }
  }, [currentLanguage, translateQuestion])

  /**
   * Save translations back to the database
   */
  const saveQuestionTranslation = useCallback(async (
    questionId: string,
    field: string,
    languageCode: string,
    translatedText: string,
    tableName: string = 'questions'
  ): Promise<boolean> => {
    try {
      // Fetch current translations
      const { data: question, error: fetchError } = await supabase
        .from(tableName)
        .select('translations')
        .eq('id', questionId)
        .single()

      if (fetchError) {
        console.error('Failed to fetch question:', fetchError)
        return false
      }

      // Update translations
      const currentTranslations = question.translations || {}
      if (!currentTranslations[field]) {
        currentTranslations[field] = {}
      }
      
      currentTranslations[field][languageCode] = {
        text: translatedText,
        lastUpdated: new Date().toISOString(),
        autoTranslated: true
      }

      // Save back to database
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ translations: currentTranslations })
        .eq('id', questionId)

      if (updateError) {
        console.error('Failed to save translation:', updateError)
        return false
      }

      // Clear cache for this question
      const cacheKey = `${questionId}-${languageCode}`
      translationCache.delete(cacheKey)

      return true
    } catch (error) {
      console.error('Error saving translation:', error)
      return false
    }
  }, [supabase, translationCache])

  /**
   * Batch save translations for a question
   */
  const saveQuestionTranslations = useCallback(async (
    questionId: string,
    translations: { [field: string]: { [language: string]: string } },
    tableName: string = 'questions'
  ): Promise<boolean> => {
    try {
      // Fetch current translations
      const { data: question, error: fetchError } = await supabase
        .from(tableName)
        .select('translations')
        .eq('id', questionId)
        .single()

      if (fetchError) {
        console.error('Failed to fetch question:', fetchError)
        return false
      }

      // Build updated translations
      const currentTranslations = question.translations || {}
      
      for (const [field, fieldTranslations] of Object.entries(translations)) {
        if (!currentTranslations[field]) {
          currentTranslations[field] = {}
        }
        
        for (const [language, text] of Object.entries(fieldTranslations)) {
          currentTranslations[field][language] = {
            text,
            lastUpdated: new Date().toISOString(),
            autoTranslated: true
          }
        }
      }

      // Save back to database
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ translations: currentTranslations })
        .eq('id', questionId)

      if (updateError) {
        console.error('Failed to save translations:', updateError)
        return false
      }

      // Clear cache
      translationCache.clear()

      return true
    } catch (error) {
      console.error('Error saving translations:', error)
      return false
    }
  }, [supabase, translationCache])

  return {
    translateQuestion,
    translateQuestions,
    saveQuestionTranslation,
    saveQuestionTranslations,
    isTranslating,
    currentLanguage,
    clearCache: () => translationCache.clear()
  }
}

/**
 * Hook to automatically translate quiz questions when language changes
 */
export function useTranslatedQuiz(
  questions: any[],
  options?: UseQuizTranslationOptions
) {
  const { currentLanguage } = useLanguage()
  const { translateQuestions, isTranslating } = useQuizTranslation(options)
  const [translatedQuestions, setTranslatedQuestions] = useState<any[]>(questions)

  useEffect(() => {
    if (currentLanguage === 'en') {
      setTranslatedQuestions(questions)
      return
    }

    translateQuestions(questions, currentLanguage).then(setTranslatedQuestions)
  }, [questions, currentLanguage, translateQuestions])

  return {
    questions: translatedQuestions,
    isTranslating
  }
} 