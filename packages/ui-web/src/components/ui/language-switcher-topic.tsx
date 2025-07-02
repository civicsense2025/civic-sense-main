import React, { useState } from 'react'
import { useLanguage } from '@/components/providers/language-provider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { Globe, Languages, Plus } from 'lucide-react'
import { TranslationContributionModal } from './translation-contribution-modal'

interface TopicLanguageSwitcherProps {
  availableLanguages?: string[]
  className?: string
  // For translation contribution
  contentType?: 'question' | 'topic'
  contentId?: string
  contentData?: any
}

export function TopicLanguageSwitcher({ 
  availableLanguages = ['en', 'es', 'fr', 'de'], 
  className,
  contentType,
  contentId,
  contentData
}: TopicLanguageSwitcherProps) {
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage()
  const [showContributionModal, setShowContributionModal] = useState(false)

  // Filter to only show languages that are both supported and available for this topic
  const displayLanguages = supportedLanguages.filter(lang => 
    availableLanguages.includes(lang.code)
  )

  // Check if current language needs translation
  const currentLangData = supportedLanguages.find(lang => lang.code === currentLanguage)
  const needsTranslation = currentLanguage !== 'en' && 
    contentType && 
    contentId && 
    contentData &&
    !availableLanguages.includes(currentLanguage)

  const handleContributeTranslation = () => {
    setShowContributionModal(true)
  }

  if (displayLanguages.length <= 1 && !needsTranslation) {
    return null // Don't show switcher if only one language available and no translation needed
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 text-muted-foreground" />
        
        {displayLanguages.length > 1 && (
          <Select value={currentLanguage} onValueChange={setLanguage}>
            <SelectTrigger className="w-auto min-w-[100px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {displayLanguages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{language.emoji}</span>
                    <span>{language.nativeName}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {needsTranslation && currentLangData && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleContributeTranslation}
            className="h-8 text-xs gap-1.5 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <Languages className="w-3 h-3" />
            Help Translate to {currentLangData.nativeName}
          </Button>
        )}
      </div>

      {showContributionModal && needsTranslation && currentLangData && contentType && contentId && contentData && (
        <TranslationContributionModal
          isOpen={showContributionModal}
          onClose={() => setShowContributionModal(false)}
          contentType={contentType}
          contentId={contentId}
          fields={getTranslatableFields(contentData, contentType)}
          targetLanguage={currentLanguage}
          targetLanguageName={currentLangData.nativeName}
        />
      )}
    </>
  )
}

// Helper function to get translatable fields based on content type
function getTranslatableFields(contentData: any, contentType: 'question' | 'topic') {
  if (contentType === 'question') {
    return [
      { key: 'question', label: 'Question', originalText: contentData.question || '', placeholder: 'Translate the question...', maxLength: 500 },
      { key: 'option_a', label: 'Option A', originalText: contentData.option_a || '', placeholder: 'Translate option A...', maxLength: 200 },
      { key: 'option_b', label: 'Option B', originalText: contentData.option_b || '', placeholder: 'Translate option B...', maxLength: 200 },
      { key: 'option_c', label: 'Option C', originalText: contentData.option_c || '', placeholder: 'Translate option C...', maxLength: 200 },
      { key: 'option_d', label: 'Option D', originalText: contentData.option_d || '', placeholder: 'Translate option D...', maxLength: 200 },
      { key: 'explanation', label: 'Explanation', originalText: contentData.explanation || '', placeholder: 'Translate the explanation...', maxLength: 1000 },
      ...(contentData.hint ? [{ key: 'hint', label: 'Hint', originalText: contentData.hint, placeholder: 'Translate the hint...', maxLength: 300 }] : [])
    ].filter(field => field.originalText)
  } else {
    return [
      { key: 'topic_title', label: 'Topic Title', originalText: contentData.topic_title || '', placeholder: 'Translate the title...', maxLength: 200 },
      { key: 'description', label: 'Description', originalText: contentData.description || '', placeholder: 'Translate the description...', maxLength: 500 },
      { key: 'why_this_matters', label: 'Why This Matters', originalText: contentData.why_this_matters || '', placeholder: 'Translate why this matters...', maxLength: 2000 }
    ].filter(field => field.originalText)
  }
} 