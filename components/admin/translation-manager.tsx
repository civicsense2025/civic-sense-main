"use client"

import React, { useState, useEffect } from 'react'
import { useUITranslationAdmin } from '@/hooks/useUIStrings'
import { useJSONBTranslation } from '@/hooks/useJSONBTranslation'
import { useLanguage } from '@/components/providers/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Globe, 
  Download, 
  Upload, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Activity,
  TrendingUp,
  Languages,
  FileText,
  Users
} from 'lucide-react'

interface TranslationStats {
  language_code: string
  total_strings: number
  translated_strings: number
  completion_percentage: number
}

export function TranslationManager() {
  const [uiStats, setUIStats] = useState<TranslationStats[]>([])
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { generateTranslations, getStats, clearCache } = useUITranslationAdmin()
  const { supportedLanguages } = useLanguage()

  // Load translation statistics
  const loadStats = async () => {
    try {
      const stats = await getStats()
      setUIStats(stats)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load translation stats:', error)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  // Generate UI translations for a language
  const handleGenerateUITranslations = async (languageCode: string) => {
    setIsGenerating(prev => ({ ...prev, [languageCode]: true }))
    
    try {
      const success = await generateTranslations(languageCode)
      if (success) {
        await loadStats()
        console.log(`✅ Generated UI translations for ${languageCode}`)
      } else {
        console.error(`❌ Failed to generate UI translations for ${languageCode}`)
      }
    } catch (error) {
      console.error(`Translation generation failed for ${languageCode}:`, error)
    } finally {
      setIsGenerating(prev => ({ ...prev, [languageCode]: false }))
    }
  }

  // Generate all missing UI translations
  const handleGenerateAllTranslations = async () => {
    const languagesToTranslate = supportedLanguages
      .filter(lang => lang.code !== 'en')
      .slice(0, 5) // Limit to first 5 languages to avoid API overload

    for (const lang of languagesToTranslate) {
      await handleGenerateUITranslations(lang.code)
      // Small delay between languages
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Clear translation cache
  const handleClearCache = () => {
    clearCache()
    console.log('Translation cache cleared')
  }

  // Get completion color based on percentage
  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  // Get completion badge variant
  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 90) return 'default'
    if (percentage >= 70) return 'secondary'
    return 'destructive'
  }

  const totalLanguages = supportedLanguages.length - 1 // Exclude English
  const translatedLanguages = uiStats.filter(stat => stat.completion_percentage > 0).length
  const averageCompletion = uiStats.length > 0 
    ? Math.round(uiStats.reduce((sum, stat) => sum + stat.completion_percentage, 0) / uiStats.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Translation Management</h1>
          <p className="text-gray-600 mt-1">
            Manage UI strings and content translations across all supported languages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearCache}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadStats}
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{translatedLanguages}/{totalLanguages}</div>
            <p className="text-xs text-gray-600">With translations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCompletionColor(averageCompletion)}`}>
              {averageCompletion}%
            </div>
            <p className="text-xs text-gray-600">Across all languages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              UI Strings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uiStats[0]?.total_strings || 0}
            </div>
            <p className="text-xs text-gray-600">Total translatable strings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Last Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
            </div>
            <p className="text-xs text-gray-600">
              {lastUpdate ? lastUpdate.toLocaleDateString() : 'No updates yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ui-strings">UI Strings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Translation Progress Overview</CardTitle>
              <CardDescription>
                Current status of translations across all supported languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uiStats.map((stat) => {
                  const langInfo = supportedLanguages.find(l => l.code === stat.language_code)
                  return (
                    <div key={stat.language_code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{langInfo?.emoji}</span>
                        <div>
                          <div className="font-medium">{langInfo?.nativeName}</div>
                          <div className="text-sm text-gray-500">
                            {stat.translated_strings}/{stat.total_strings} strings
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={stat.completion_percentage} 
                          className="w-24"
                        />
                        <Badge variant={getCompletionBadge(stat.completion_percentage)}>
                          {stat.completion_percentage}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Batch operations for translation management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleGenerateAllTranslations}
                  disabled={Object.values(isGenerating).some(Boolean)}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Generate All Missing Translations
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Translations
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Translations
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Batch translation operations consume DeepL API credits. Monitor usage to avoid unexpected costs.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI Strings Tab */}
        <TabsContent value="ui-strings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>UI String Translations</CardTitle>
              <CardDescription>
                Manage translations for interface text and labels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {supportedLanguages
                  .filter(lang => lang.code !== 'en')
                  .slice(0, 10) // Show top 10 languages
                  .map((lang) => {
                    const stat = uiStats.find(s => s.language_code === lang.code)
                    const isGeneratingLang = isGenerating[lang.code]
                    
                    return (
                      <div 
                        key={lang.code} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{lang.emoji}</span>
                          <div>
                            <div className="font-medium">{lang.nativeName}</div>
                            <div className="text-sm text-gray-500">{lang.name}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {stat ? (
                            <div className="text-right">
                              <div className={`font-medium ${getCompletionColor(stat.completion_percentage)}`}>
                                {stat.completion_percentage}% complete
                              </div>
                              <div className="text-sm text-gray-500">
                                {stat.translated_strings}/{stat.total_strings} strings
                              </div>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="font-medium text-gray-400">Not started</div>
                              <div className="text-sm text-gray-500">0 strings</div>
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            onClick={() => handleGenerateUITranslations(lang.code)}
                            disabled={isGeneratingLang}
                            className="min-w-[120px]"
                          >
                            {isGeneratingLang ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                Translating...
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3 mr-2" />
                                {stat?.completion_percentage === 100 ? 'Update' : 'Generate'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 