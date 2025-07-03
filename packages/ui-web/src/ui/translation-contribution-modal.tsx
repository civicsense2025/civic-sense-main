import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/components/providers/language-provider'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from './dialog'
import { Button } from './button'
import { Textarea } from './textarea'
import { Label } from './label'
import { Input } from './input'
import { useToast } from "../components/ui/use-toast"
import { Badge } from './badge'
import { Languages, Heart, CheckCircle, Sparkles, RefreshCw } from 'lucide-react'

interface TranslationField {
  key: string
  label: string
  originalText: string
  placeholder: string
  maxLength?: number
}

interface TranslationContributionModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: 'question' | 'topic'
  contentId: string
  fields: TranslationField[]
  targetLanguage: string
  targetLanguageName: string
}

export function TranslationContributionModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  fields,
  targetLanguage,
  targetLanguageName
}: TranslationContributionModalProps) {
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [contributorName, setContributorName] = useState('')
  const [contributorEmail, setContributorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [autoSuggestions, setAutoSuggestions] = useState<Record<string, string>>({})
  const [suggestionUsed, setSuggestionUsed] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Load DeepL suggestions when modal opens
  useEffect(() => {
    if (isOpen && fields.length > 0) {
      loadDeepLSuggestions()
    }
  }, [isOpen, fields, targetLanguage])

  const loadDeepLSuggestions = async () => {
    setIsLoadingSuggestions(true)
    try {
      const textsToTranslate = fields.map(field => field.originalText)
      
      const response = await fetch('/api/translations/deepl-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage,
          sourceLanguage: 'en'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.translations) {
          const suggestions: Record<string, string> = {}
          fields.forEach((field, index) => {
            if (data.translations[index]) {
              suggestions[field.key] = data.translations[index]
            }
          })
          setAutoSuggestions(suggestions)
        }
      }
    } catch (error) {
      console.error('Failed to load DeepL suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleTranslationChange = (fieldKey: string, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  const useSuggestion = (fieldKey: string) => {
    const suggestion = autoSuggestions[fieldKey]
    if (suggestion) {
      setTranslations(prev => ({
        ...prev,
        [fieldKey]: suggestion
      }))
      setSuggestionUsed(prev => ({
        ...prev,
        [fieldKey]: true
      }))
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    const missingTranslations = fields.filter(field => !translations[field.key]?.trim())
    if (missingTranslations.length > 0) {
      toast({
        title: "Missing translations",
        description: `Please provide translations for: ${missingTranslations.map(f => f.label).join(', ')}`,
        variant: "destructive"
      })
      return
    }

    if (!contributorName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide your name so we can credit your contribution",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/translations/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          contentId,
          targetLanguage,
          translations,
          contributor: {
            name: contributorName,
            email: contributorEmail
          },
          metadata: {
            usedDeepLSuggestions: Object.keys(suggestionUsed).filter(key => suggestionUsed[key]),
            hasDeepLSuggestions: Object.keys(autoSuggestions).length > 0
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit translation')
      }

      setIsSubmitted(true)
      toast({
        title: "Translation submitted! 🎉",
        description: "Thank you for helping make CivicSense accessible to more people. We'll review your contribution and add it soon.",
      })

    } catch (error) {
      console.error('Translation submission error:', error)
      toast({
        title: "Submission failed",
        description: "Sorry, there was an error submitting your translation. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTranslations({})
    setContributorName('')
    setContributorEmail('')
    setIsSubmitted(false)
    setAutoSuggestions({})
    setSuggestionUsed({})
    onClose()
  }

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle>Thank you! 🙏</DialogTitle>
            <DialogDescription className="text-center">
              Your translation has been submitted for review. We'll add it to CivicSense soon so other {targetLanguageName} speakers can benefit from your contribution.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Help Translate to {targetLanguageName}</DialogTitle>
              <DialogDescription>
                Help make civic education accessible to {targetLanguageName} speakers
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contributor Info */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Contributor Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contributor-name">Your Name *</Label>
                <Input
                  id="contributor-name"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="How should we credit you?"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contributor-email">Email (optional)</Label>
                <Input
                  id="contributor-email"
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="For questions about your translation"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Translation Fields */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Content to Translate</h4>
              {isLoadingSuggestions && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading AI suggestions...
                </div>
              )}
            </div>
            
            {fields.map((field) => (
              <div key={field.key} className="space-y-3">
                <Label htmlFor={`field-${field.key}`} className="text-sm font-medium">
                  {field.label} *
                  {suggestionUsed[field.key] && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI-assisted
                    </Badge>
                  )}
                </Label>
                
                {/* Original English Text */}
                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-md">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    English (original):
                  </div>
                  <div className="text-sm">{field.originalText}</div>
                </div>

                {/* DeepL Suggestion */}
                {autoSuggestions[field.key] && !translations[field.key] && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Suggestion (DeepL)
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => useSuggestion(field.key)}
                        className="h-6 px-2 text-xs"
                      >
                        Use as starting point
                      </Button>
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      {autoSuggestions[field.key]}
                    </div>
                  </div>
                )}

                {/* Translation Input */}
                <Textarea
                  id={`field-${field.key}`}
                  value={translations[field.key] || ''}
                  onChange={(e) => handleTranslationChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  rows={3}
                  className="w-full"
                />
                {field.maxLength && (
                  <div className="text-xs text-slate-500 text-right">
                    {(translations[field.key] || '').length}/{field.maxLength}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Translation Guidelines
            </h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Keep the meaning and tone of the original text</li>
              <li>• Use formal language appropriate for civic education</li>
              <li>• Maintain any proper nouns (like "Constitution", "Congress")</li>
              <li>• Ask yourself: would this help someone understand American government?</li>
              <li>• Feel free to use AI suggestions as a starting point, but review and improve them</li>
              <li>• Your human expertise is valuable - correct any errors in the AI suggestions</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="min-w-24"
          >
            {isSubmitting ? "Submitting..." : "Submit Translation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 