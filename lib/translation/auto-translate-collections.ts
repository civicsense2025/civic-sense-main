/**
 * Automatic Collection Translation Utility
 * Extends automatic translation to collections/lessons beyond just quiz questions
 */

// import { deepLTranslationService } from './deepl-service' // Temporarily removed - file doesn't exist in web app

// Temporary stub for deepL service to fix build
const deepLTranslationService = {
  isReady: () => false,
  initialize: async () => Promise.resolve(),
  translateText: async (text: string, targetLanguage: string, options?: any) => {
    console.warn('DeepL service not available in web app, returning original text')
    return text
  }
}

export interface CollectionContent {
  id: string
  title: string
  description?: string
  content?: any // JSONB content structure
  translations?: {
    title?: { [lang: string]: { text: string; lastUpdated?: string; autoTranslated?: boolean } }
    description?: { [lang: string]: { text: string; lastUpdated?: string; autoTranslated?: boolean } }
    content?: { [lang: string]: { text: string; lastUpdated?: string; autoTranslated?: boolean } }
    [key: string]: { [lang: string]: { text: string; lastUpdated?: string; autoTranslated?: boolean } } | undefined
  }
}

interface TranslatedCollection extends CollectionContent {
  originalTitle?: string
  originalDescription?: string
  originalContent?: any
  isTranslated?: boolean
}

class CollectionTranslationService {
  private translationCache = new Map<string, TranslatedCollection>()

  /**
   * Translate collection content automatically
   */
  async translateCollection(
    collection: CollectionContent,
    targetLanguage: string
  ): Promise<TranslatedCollection> {
    // Return original if target is English
    if (targetLanguage === 'en') {
      return { ...collection, isTranslated: false }
    }

    const cacheKey = `${collection.id}-${targetLanguage}`
    
    // Check cache first
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!
    }

    try {
      // Check if collection has database translations first
      if (collection.translations) {
        const titleTranslation = collection.translations.title?.[targetLanguage]?.text
        const descriptionTranslation = collection.translations.description?.[targetLanguage]?.text
        const contentTranslation = collection.translations.content?.[targetLanguage]?.text

        if (titleTranslation) {
          const translatedCollection: TranslatedCollection = {
            ...collection,
            title: titleTranslation,
            description: descriptionTranslation || collection.description,
            content: contentTranslation ? JSON.parse(contentTranslation) : collection.content,
            originalTitle: collection.title,
            originalDescription: collection.description,
            originalContent: collection.content,
            isTranslated: true
          }

          this.translationCache.set(cacheKey, translatedCollection)
          return translatedCollection
        }
      }

      // Fallback to runtime translation with automatic saving
      if (!deepLTranslationService.isReady()) {
        await deepLTranslationService.initialize()
      }

      const textsToTranslate: string[] = []
      const fieldMapping: string[] = []

      // Collect texts to translate
      if (collection.title) {
        textsToTranslate.push(collection.title)
        fieldMapping.push('title')
      }

      if (collection.description) {
        textsToTranslate.push(collection.description)
        fieldMapping.push('description')
      }

      // Extract translatable text from content structure
      let contentText = ''
      if (collection.content) {
        contentText = this.extractTextFromContent(collection.content)
        if (contentText) {
          textsToTranslate.push(contentText)
          fieldMapping.push('content')
        }
      }

      if (textsToTranslate.length === 0) {
        return { ...collection, isTranslated: false }
      }

      // Translate all texts
      const translations = await Promise.all(
        textsToTranslate.map(text => 
          deepLTranslationService.translateText(text, targetLanguage, { preserveCivicTerms: true })
        )
      )

      // Build translated collection
      const translatedCollection: TranslatedCollection = {
        ...collection,
        originalTitle: collection.title,
        originalDescription: collection.description,
        originalContent: collection.content,
        isTranslated: true
      }

      // Apply translations
      fieldMapping.forEach((field, index) => {
        const translation = translations[index]
        if (translation) {
          switch (field) {
            case 'title':
              translatedCollection.title = translation
              break
            case 'description':
              translatedCollection.description = translation
              break
            case 'content':
              // Reconstruct content with translated text
              translatedCollection.content = this.applyTranslationToContent(
                collection.content,
                translation
              )
              break
          }
        }
      })

      this.translationCache.set(cacheKey, translatedCollection)

      // Auto-save translations to database
      await this.saveCollectionTranslations(
        collection.id,
        targetLanguage,
        fieldMapping,
        translations
      )

      return translatedCollection

    } catch (error) {
      console.error('Failed to translate collection:', error)
      // Return original collection if translation fails
      return { ...collection, isTranslated: false }
    }
  }

  /**
   * Extract translatable text from JSONB content structure
   */
  private extractTextFromContent(content: any): string {
    if (!content) return ''

    const texts: string[] = []

    const extractText = (obj: any) => {
      if (typeof obj === 'string') {
        texts.push(obj)
      } else if (Array.isArray(obj)) {
        obj.forEach(extractText)
      } else if (typeof obj === 'object' && obj !== null) {
        // Common content fields that need translation
        const translatableFields = [
          'text', 'title', 'description', 'content', 'body',
          'summary', 'explanation', 'label', 'caption'
        ]

        for (const [key, value] of Object.entries(obj)) {
          if (translatableFields.includes(key.toLowerCase()) && typeof value === 'string') {
            texts.push(value)
          } else {
            extractText(value)
          }
        }
      }
    }

    extractText(content)
    return texts.join('\n\n') // Separate sections with double newlines
  }

  /**
   * Apply translated text back to content structure
   */
  private applyTranslationToContent(originalContent: any, translatedText: string): any {
    if (!originalContent || !translatedText) return originalContent

    // For now, store translated text as a special field
    // In the future, this could be enhanced to map back to specific content fields
    return {
      ...originalContent,
      _translatedText: translatedText,
      _isTranslated: true
    }
  }

  /**
   * Save collection translations to database
   */
  private async saveCollectionTranslations(
    collectionId: string,
    targetLanguage: string,
    fields: string[],
    translations: string[]
  ): Promise<void> {
    try {
      const translationsToSave: { [field: string]: { [language: string]: string } } = {}

      fields.forEach((field, index) => {
        const translation = translations[index]
        if (translation) {
          translationsToSave[field] = { [targetLanguage]: translation }
        }
      })

      const response = await fetch('/api/translations/auto-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'collection',
          contentId: collectionId,
          targetLanguage,
          translations: translationsToSave,
          source: 'automatic_collection_translation'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Automatically saved collection translations for ${collectionId} in ${targetLanguage}:`, result.fieldsUpdated)
      } else {
        const errorData = await response.json()
        console.warn(`⚠️ Failed to save collection translations for ${collectionId}:`, errorData.error)
      }
    } catch (error) {
      console.warn('Failed to save collection translations:', error)
      // Don't block user experience
    }
  }

  /**
   * Clear translation cache
   */
  clearCache(collectionId?: string): void {
    if (collectionId) {
      // Clear cache for specific collection across all languages
      for (const key of this.translationCache.keys()) {
        if (key.startsWith(`${collectionId}-`)) {
          this.translationCache.delete(key)
        }
      }
    } else {
      // Clear entire cache
      this.translationCache.clear()
    }
  }

  /**
   * Check if collection has translations available
   */
  hasTranslations(collection: CollectionContent, targetLanguage: string): boolean {
    return !!(
      collection.translations &&
      (
        collection.translations.title?.[targetLanguage]?.text ||
        collection.translations.description?.[targetLanguage]?.text ||
        collection.translations.content?.[targetLanguage]?.text
      )
    )
  }
}

// Export singleton instance
export const collectionTranslationService = new CollectionTranslationService()

// Export types for use in other parts of the app
export type { TranslatedCollection } 