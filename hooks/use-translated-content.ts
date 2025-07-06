import { useLanguage } from '@/components/providers/language-provider'

interface TranslationEntry {
  text: string
  lastUpdated?: string
  autoTranslated?: boolean
  contributor?: string
}

interface TranslationStructure {
  [field: string]: {
    [languageCode: string]: TranslationEntry
  }
}

/**
 * Hook to get translated content from JSONB translations field
 * Follows the structure established in migration 043_add_jsonb_translations.sql
 */
export function useTranslatedContent<T extends Record<string, any>>(
  item: T | null | undefined,
  fallbackLanguage: string = 'en'
) {
  const { currentLanguage } = useLanguage()

  const getTranslatedField = (
    fieldName: keyof T,
    originalValue: any
  ): any => {
    if (!item || !item.translations || currentLanguage === fallbackLanguage) {
      return originalValue
    }

    try {
      const translations = item.translations as TranslationStructure
      const fieldTranslations = translations[fieldName as string]
      
      if (!fieldTranslations) {
        return originalValue
      }

      // Try current language first
      const currentTranslation = fieldTranslations[currentLanguage]
      if (currentTranslation?.text) {
        return currentTranslation.text
      }

      // Fallback to original value
      return originalValue
    } catch (error) {
      console.warn('Error accessing translations:', error)
      return originalValue
    }
  }

  const getTranslatedItem = (): T | null => {
    if (!item) return null

    const translatedItem = { ...item }

    // Common translatable fields for questions
    const translatableFields = [
      'question',
      'text', 
      'explanation',
      'title',
      'description',
      'content'
    ]

    translatableFields.forEach(field => {
      if (field in item) {
        translatedItem[field as keyof T] = getTranslatedField(field, item[field])
      }
    })

    return translatedItem
  }

  const hasTranslation = (fieldName: keyof T): boolean => {
    if (!item?.translations || currentLanguage === fallbackLanguage) {
      return false
    }

    try {
      const translations = item.translations as TranslationStructure
      const fieldTranslations = translations[fieldName as string]
      return !!(fieldTranslations?.[currentLanguage]?.text)
    } catch {
      return false
    }
  }

  const getAvailableLanguages = (): string[] => {
    if (!item?.translations) {
      return [fallbackLanguage]
    }

    try {
      const translations = item.translations as TranslationStructure
      const languages = new Set([fallbackLanguage])

      Object.values(translations).forEach(fieldTranslations => {
        Object.keys(fieldTranslations).forEach(lang => {
          if (fieldTranslations[lang]?.text) {
            languages.add(lang)
          }
        })
      })

      return Array.from(languages)
    } catch {
      return [fallbackLanguage]
    }
  }

  const getMissingTranslations = (): Array<{
    key: string
    label: string
    originalText: string
    placeholder: string
    maxLength?: number
  }> => {
    if (!item || currentLanguage === fallbackLanguage) {
      return []
    }

    const missingFields: Array<{
      key: string
      label: string
      originalText: string
      placeholder: string
      maxLength?: number
    }> = []

    // Define translatable fields based on content type
    const translatableFields = getTranslatableFields()

    translatableFields.forEach(field => {
      if (!hasTranslation(field.key as keyof T)) {
        missingFields.push({
          key: field.key,
          label: field.label,
          originalText: item[field.key] || '',
          placeholder: field.placeholder,
          maxLength: field.maxLength
        })
      }
    })

    return missingFields
  }

  const getTranslatableFields = () => {
    if (!item) return []

    // Detect if this is a question or topic based on available fields
    if ('question' in item && 'option_a' in item) {
      // This is a question
      return [
        { key: 'question', label: 'Question', placeholder: 'Translate the question...', maxLength: 500 },
        { key: 'option_a', label: 'Option A', placeholder: 'Translate option A...', maxLength: 200 },
        { key: 'option_b', label: 'Option B', placeholder: 'Translate option B...', maxLength: 200 },
        { key: 'option_c', label: 'Option C', placeholder: 'Translate option C...', maxLength: 200 },
        { key: 'option_d', label: 'Option D', placeholder: 'Translate option D...', maxLength: 200 },
        { key: 'explanation', label: 'Explanation', placeholder: 'Translate the explanation...', maxLength: 1000 },
        ...('hint' in item && item.hint ? [{ key: 'hint', label: 'Hint', placeholder: 'Translate the hint...', maxLength: 300 }] : [])
      ].filter(field => field.key in item && item[field.key])
    } else if ('topic_title' in item) {
      // This is a topic
      return [
        { key: 'topic_title', label: 'Topic Title', placeholder: 'Translate the title...', maxLength: 200 },
        { key: 'description', label: 'Description', placeholder: 'Translate the description...', maxLength: 500 },
        { key: 'why_this_matters', label: 'Why This Matters', placeholder: 'Translate why this matters...', maxLength: 2000 }
      ].filter(field => field.key in item && item[field.key])
    }
    
    return []
  }

  return {
    getTranslatedField,
    getTranslatedItem,
    hasTranslation,
    getAvailableLanguages,
    getMissingTranslations,
    getTranslatableFields,
    currentLanguage,
    isTranslated: currentLanguage !== fallbackLanguage && !!item?.translations,
    needsTranslation: currentLanguage !== fallbackLanguage && getMissingTranslations().length > 0
  }
} 