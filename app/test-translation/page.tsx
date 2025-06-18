"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { PageTranslator } from '@/components/page-translator'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslation } from '@/hooks/useTranslation'
import { 
  Languages, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Database,
  Zap,
  Globe,
  MessageSquare
} from 'lucide-react'

export default function TestTranslationPage() {
  const [testText, setTestText] = useState('Hello! This is a test of the DeepL translation system. How are you doing today?')
  const [translationResult, setTranslationResult] = useState<any>(null)
  const [batchTexts, setBatchTexts] = useState<string[]>([
    'Welcome to CivicSense',
    'Learn about democracy and civic engagement',
    'Take quizzes to test your knowledge',
    'Connect with other learners in pods'
  ])
  const [batchResults, setBatchResults] = useState<any[]>([])
  
  const { 
    currentLanguage, 
    isTranslating, 
    error, 
    translate, 
    translateBatch, 
    changeLanguage,
    clearCache,
    getCacheStats
  } = useTranslation()

  const handleSingleTranslation = async () => {
    try {
      const result = await translate(testText)
      setTranslationResult(result)
    } catch (error) {
      console.error('Translation failed:', error)
    }
  }

  const handleBatchTranslation = async () => {
    try {
      const results = await translateBatch(batchTexts)
      setBatchResults(results)
    } catch (error) {
      console.error('Batch translation failed:', error)
    }
  }

  const cacheStats = getCacheStats()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
                Translation System Test
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Test the DeepL API integration and page translation features
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>{currentLanguage.emoji} {currentLanguage.name}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Translation Tests */}
          <div className="space-y-6">
            {/* Language Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Languages className="h-5 w-5" />
                  <span>Language Selection</span>
                </CardTitle>
                <CardDescription>
                  Choose the target language for translations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSwitcher 
                  variant="full" 
                  currentLanguage={currentLanguage.code}
                  onLanguageChange={changeLanguage}
                />
              </CardContent>
            </Card>

            {/* Single Text Translation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Single Text Translation</span>
                </CardTitle>
                <CardDescription>
                  Test translating a single piece of text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Text to translate:</label>
                  <Textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Enter text to translate..."
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleSingleTranslation}
                  disabled={isTranslating || !testText.trim() || currentLanguage.code === 'EN'}
                  className="w-full"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="h-4 w-4 mr-2" />
                      Translate to {currentLanguage.name}
                    </>
                  )}
                </Button>

                {translationResult && (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Translation Result</span>
                      {translationResult.fromCache && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Cached
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Translated Text:</div>
                      <div className="p-3 bg-white dark:bg-slate-800 rounded border">
                        {translationResult.translatedText}
                      </div>
                    </div>
                    {translationResult.detectedLanguage && (
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Detected source language: {translationResult.detectedLanguage}
                      </div>
                    )}
                    {translationResult.usage && (
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Characters processed: {translationResult.usage.charactersProcessed.toLocaleString()}
                        {translationResult.usage.charactersRemaining && (
                          <> • Remaining: {translationResult.usage.charactersRemaining.toLocaleString()}</>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Batch Translation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Batch Translation</span>
                </CardTitle>
                <CardDescription>
                  Test translating multiple texts at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Texts to translate:</label>
                  {batchTexts.map((text, index) => (
                    <Input
                      key={index}
                      value={text}
                      onChange={(e) => {
                        const newTexts = [...batchTexts]
                        newTexts[index] = e.target.value
                        setBatchTexts(newTexts)
                      }}
                      placeholder={`Text ${index + 1}...`}
                    />
                  ))}
                </div>
                
                <Button 
                  onClick={handleBatchTranslation}
                  disabled={isTranslating || currentLanguage.code === 'EN'}
                  className="w-full"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Translating Batch...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Translate All to {currentLanguage.name}
                    </>
                  )}
                </Button>

                {batchResults.length > 0 && (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Batch Translation Results</span>
                    </div>
                    {batchResults.map((result, index) => (
                      <div key={index} className="text-sm space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Text {index + 1}:</span>
                          {result.fromCache && (
                            <Badge variant="secondary" className="text-xs">
                              <Database className="h-3 w-3 mr-1" />
                              Cached
                            </Badge>
                          )}
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-800 rounded border text-xs">
                          {result.translatedText}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Demo Content & Stats */}
          <div className="space-y-6">
            {/* Demo Content for Page Translation */}
            <Card data-translatable>
              <CardHeader>
                <CardTitle data-translate>
                  Demo Content for Page Translation
                </CardTitle>
                <CardDescription data-translate>
                  This content will be translated when using the page translator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" data-translatable>
                <h3 className="text-lg font-semibold" data-translate>
                  About CivicSense
                </h3>
                <p data-translate>
                  CivicSense transforms passive observers into confident, informed participants in democracy. 
                  We bridge the gap between civic knowledge and meaningful action through accessible, 
                  engaging digital learning.
                </p>
                
                <h4 className="font-medium" data-translate>
                  Key Features
                </h4>
                <ul className="space-y-2 text-sm">
                  <li data-translate>• Interactive quizzes on civic topics</li>
                  <li data-translate>• Learning pods for collaborative education</li>
                  <li data-translate>• Multiplayer civic games</li>
                  <li data-translate>• Progress tracking and achievements</li>
                </ul>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-translate>
                    This is a demonstration of how page content can be automatically translated 
                    using the DeepL API integration.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Cache Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Translation Cache</span>
                </CardTitle>
                <CardDescription>
                  Performance statistics and cache management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Cache Entries</div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {cacheStats.totalEntries}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Total Translations</div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {cacheStats.totalTranslations}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Cache Size</div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {cacheStats.cacheSizeKB} KB
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Current Language</div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {currentLanguage.emoji} {currentLanguage.code}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <Button 
                  onClick={clearCache}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Clear Translation Cache
                </Button>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      {/* Page Translator Component */}
      <PageTranslator showUsage={true} />
    </div>
  )
} 