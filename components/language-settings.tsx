"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  Globe, 
  Check, 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Languages,
  Database,
  Sparkles
} from 'lucide-react'

interface LanguageSettings {
  uiLanguage: string
  autoTranslateContent: boolean
  preserveCivicTerms: boolean
  autoSaveTranslations: boolean
  translationQuality: 'basic' | 'enhanced' | 'premium'
  fallbackLanguage: string
}

interface SupportedLanguage {
  code: string
  name: string
  nativeName: string
  coverage: number
  isComplete: boolean
  contributors: number
}

interface TranslationStats {
  totalContent: number
  translatedContent: number
  pendingTranslations: number
  lastUpdated: string
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', coverage: 100, isComplete: true, contributors: 15 },
  { code: 'es', name: 'Spanish', nativeName: 'Español', coverage: 87, isComplete: false, contributors: 8 },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', coverage: 72, isComplete: false, contributors: 4 },
  { code: 'zh', name: 'Chinese', nativeName: '中文', coverage: 65, isComplete: false, contributors: 6 },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', coverage: 58, isComplete: false, contributors: 3 },
  { code: 'fr', name: 'French', nativeName: 'Français', coverage: 82, isComplete: false, contributors: 7 },
  { code: 'de', name: 'German', nativeName: 'Deutsch', coverage: 79, isComplete: false, contributors: 5 },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', coverage: 71, isComplete: false, contributors: 4 },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', coverage: 68, isComplete: false, contributors: 3 },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', coverage: 45, isComplete: false, contributors: 2 },
  { code: 'ko', name: 'Korean', nativeName: '한국어', coverage: 38, isComplete: false, contributors: 2 },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', coverage: 83, isComplete: false, contributors: 6 },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', coverage: 42, isComplete: false, contributors: 2 }
]

export function LanguageSettings() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<LanguageSettings>({
    uiLanguage: 'en',
    autoTranslateContent: true,
    preserveCivicTerms: true,
    autoSaveTranslations: true,
    translationQuality: 'enhanced',
    fallbackLanguage: 'en'
  })
  
  const [translationStats, setTranslationStats] = useState<TranslationStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
  
  useEffect(() => {
    loadLanguageSettings()
    loadTranslationStats()
  }, [])

  const loadLanguageSettings = async () => {
    try {
      // Load from localStorage for immediate response
      const stored = localStorage.getItem('civicsense-language-settings')
      if (stored) {
        setSettings(JSON.parse(stored))
      }

      // Load from database for persistent settings
      const { data: userSettings } = await supabase
        .from('user_preferences')
        .select('language_settings')
        .single()

      if (userSettings?.language_settings) {
        const langSettings = userSettings.language_settings as LanguageSettings
        setSettings(langSettings)
        localStorage.setItem('civicsense-language-settings', JSON.stringify(langSettings))
      }
    } catch (error) {
      console.error('Error loading language settings:', error)
    }
  }

  const loadTranslationStats = async () => {
    try {
      const { data } = await supabase.rpc('get_translation_stats', {
        target_language: settings.uiLanguage
      })
      
      if (data) {
        setTranslationStats(data)
      }
    } catch (error) {
      console.error('Error loading translation stats:', error)
    }
  }

  const saveLanguageSettings = async () => {
    setIsLoading(true)
    try {
      // Save to localStorage immediately
      localStorage.setItem('civicsense-language-settings', JSON.stringify(settings))
      
      // Save to database
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          language_settings: settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Update UI language in the app
      document.documentElement.lang = settings.uiLanguage
      
      toast({
        title: 'Language settings saved',
        description: 'Your language preferences have been updated successfully.'
      })

      // Refresh the page to apply new UI language
      if (settings.uiLanguage !== 'en') {
        router.refresh()
      }

    } catch (error) {
      console.error('Error saving language settings:', error)
      toast({
        title: 'Error saving settings',
        description: 'There was a problem saving your language preferences.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearTranslationCache = async () => {
    setIsClearingCache(true)
    try {
      const { error } = await supabase.rpc('clear_translation_cache', {
        target_language: settings.uiLanguage
      })

      if (error) throw error

      // Also clear browser cache
      localStorage.removeItem('civicsense-translations-cache')
      
      toast({
        title: 'Translation cache cleared',
        description: 'All cached translations have been removed. Content will be re-translated as needed.'
      })

      // Reload stats
      await loadTranslationStats()

    } catch (error) {
      console.error('Error clearing translation cache:', error)
      toast({
        title: 'Error clearing cache',
        description: 'There was a problem clearing the translation cache.',
        variant: 'destructive'
      })
    } finally {
      setIsClearingCache(false)
    }
  }

  const triggerContentTranslation = async () => {
    try {
      const response = await fetch('/api/translations/bulk-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: settings.uiLanguage,
          contentTypes: ['question_topics', 'questions', 'news_articles', 'collections'],
          preserveCivicTerms: settings.preserveCivicTerms,
          quality: settings.translationQuality
        })
      })

      if (!response.ok) throw new Error('Translation request failed')

      toast({
        title: 'Translation started',
        description: 'Content translation has been queued. This may take a few minutes.',
      })

      // Refresh stats after a delay
      setTimeout(() => loadTranslationStats(), 5000)

    } catch (error) {
      console.error('Error triggering translation:', error)
      toast({
        title: 'Translation failed',
        description: 'There was a problem starting the translation process.',
        variant: 'destructive'
      })
    }
  }

  const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === settings.uiLanguage)

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Interface Language
          </CardTitle>
          <CardDescription>
            Choose your preferred language for the CivicSense interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ui-language">UI Language</Label>
            <Select 
              value={settings.uiLanguage} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, uiLanguage: value }))}
            >
              <SelectTrigger id="ui-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span>{lang.nativeName}</span>
                        <span className="text-muted-foreground">({lang.name})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={lang.isComplete ? 'default' : 'secondary'}>
                          {lang.coverage}%
                        </Badge>
                        {lang.isComplete && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLanguage && !selectedLanguage.isComplete && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This language is {selectedLanguage.coverage}% complete. Some content may fall back to English.
                <Button variant="link" className="h-auto p-0 ml-2">
                  Help translate →
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Translation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Content Translation
          </CardTitle>
          <CardDescription>
            Configure how content is translated and displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-translate content</Label>
              <p className="text-sm text-muted-foreground">
                Automatically translate quiz questions, articles, and other content
              </p>
            </div>
            <Switch
              checked={settings.autoTranslateContent}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoTranslateContent: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Preserve civic terms</Label>
              <p className="text-sm text-muted-foreground">
                Keep important civic and political terms in their original language
              </p>
            </div>
            <Switch
              checked={settings.preserveCivicTerms}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, preserveCivicTerms: checked }))
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Translation Quality</Label>
            <Select
              value={settings.translationQuality}
              onValueChange={(value: 'basic' | 'enhanced' | 'premium') => 
                setSettings(prev => ({ ...prev, translationQuality: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - Fast, automated</SelectItem>
                <SelectItem value="enhanced">Enhanced - Context-aware</SelectItem>
                <SelectItem value="premium">Premium - Human-reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Fallback Language</Label>
            <Select
              value={settings.fallbackLanguage}
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, fallbackLanguage: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== settings.uiLanguage).map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Language to use when translations are not available
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Translation Stats */}
      {translationStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Translation Coverage
            </CardTitle>
            <CardDescription>
              Current translation status for {selectedLanguage?.nativeName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {translationStats.translatedContent}
                </div>
                <div className="text-sm text-muted-foreground">Translated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {translationStats.pendingTranslations}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {translationStats.totalContent}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={triggerContentTranslation}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Translate Missing Content
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearTranslationCache}
                disabled={isClearingCache}
                className="flex-1"
              >
                {isClearingCache ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Clear Cache
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(translationStats.lastUpdated).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button onClick={saveLanguageSettings} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Language Settings'
          )}
        </Button>
      </div>
    </div>
  )
} 