"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/providers/language-provider'

// Hide this page in production
export default function TestTranslationPage() {
  // Early return for production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Page Not Available</h1>
          <p className="text-muted-foreground">This test page is only available in development mode.</p>
        </div>
      </div>
    )
  }

  const { 
    currentLanguage, 
    isTranslating, 
    isPageTranslated,
    translate,
    translateBatch,
    translatePage,
    restoreOriginalPage,
    getLanguageInfo
  } = useLanguage()

  // Get the current language info object
  const currentLanguageInfo = getLanguageInfo(currentLanguage)

  const [singleText, setSingleText] = useState('Hello, this is a test sentence for translation.')
  const [singleResult, setSingleResult] = useState('')
  const [singleLoading, setSingleLoading] = useState(false)

  const [batchTexts, setBatchTexts] = useState('Line 1: This is the first test sentence.\nLine 2: This is the second test sentence.\nLine 3: This is the third test sentence.')
  const [batchResults, setBatchResults] = useState<string[]>([])
  const [batchLoading, setBatchLoading] = useState(false)

  const [translationStats, setTranslationStats] = useState({
    singleTranslations: 0,
    batchTranslations: 0,
    pageTranslations: 0,
    lastTranslationTime: null as Date | null
  })

  // Test single translation
  const testSingleTranslation = async () => {
    if (!singleText.trim()) return
    
    setSingleLoading(true)
    setSingleResult('')
    
    try {
      const startTime = Date.now()
      const result = await translate(singleText, currentLanguage)
      const endTime = Date.now()
      
      setSingleResult(result)
      setTranslationStats(prev => ({
        ...prev,
        singleTranslations: prev.singleTranslations + 1,
        lastTranslationTime: new Date()
      }))
      
      console.log(`Single translation took ${endTime - startTime}ms`)
    } catch (error) {
      console.error('Single translation failed:', error)
      setSingleResult('Translation failed')
    } finally {
      setSingleLoading(false)
    }
  }

  // Test batch translation
  const testBatchTranslation = async () => {
    if (!batchTexts.trim()) return
    
    setBatchLoading(true)
    setBatchResults([])
    
    try {
      const texts = batchTexts.split('\n').filter(line => line.trim())
      const startTime = Date.now()
      const results = await translateBatch(texts, currentLanguage)
      const endTime = Date.now()
      
      setBatchResults(results)
      setTranslationStats(prev => ({
        ...prev,
        batchTranslations: prev.batchTranslations + 1,
        lastTranslationTime: new Date()
      }))
      
      console.log(`Batch translation (${texts.length} texts) took ${endTime - startTime}ms`)
    } catch (error) {
      console.error('Batch translation failed:', error)
      setBatchResults(['Translation failed'])
    } finally {
      setBatchLoading(false)
    }
  }

  // Test page translation
  const testPageTranslation = async () => {
    if (currentLanguage === 'en') {
      alert('Please select a non-English language to test page translation')
      return
    }
    
    try {
      const startTime = Date.now()
      await translatePage(currentLanguage)
      const endTime = Date.now()
      
      setTranslationStats(prev => ({
        ...prev,
        pageTranslations: prev.pageTranslations + 1,
        lastTranslationTime: new Date()
      }))
      
      console.log(`Page translation took ${endTime - startTime}ms`)
    } catch (error) {
      console.error('Page translation failed:', error)
    }
  }

  // Loading state
  if (!currentLanguageInfo) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading language information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Translation System Test</h1>
        <p className="text-lg text-muted-foreground">
          Test the DeepL translation integration with single text, batch processing, and full page translation
        </p>
        
        {/* Language Info Display */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
          <div className="text-sm">
            <strong>Current Language:</strong> {currentLanguageInfo.emoji} {currentLanguageInfo.name} ({currentLanguageInfo.code})
          </div>
          <LanguageSwitcher />
        </div>
        
        {/* Translation Status */}
        <div className="flex items-center justify-center gap-4">
          {isTranslating && (
            <Badge variant="secondary" className="animate-pulse">
              🔄 Translating...
            </Badge>
          )}
          {isPageTranslated && (
            <Badge variant="default">
              ✅ Page Translated
            </Badge>
          )}
          {currentLanguage === 'en' && (
            <Badge variant="outline">
              🇺🇸 Original Language
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Translation Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Translation Statistics</CardTitle>
          <CardDescription>Track translation usage and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{translationStats.singleTranslations}</div>
              <div className="text-sm text-muted-foreground">Single Translations</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{translationStats.batchTranslations}</div>
              <div className="text-sm text-muted-foreground">Batch Translations</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{translationStats.pageTranslations}</div>
              <div className="text-sm text-muted-foreground">Page Translations</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {translationStats.lastTranslationTime ? 
                  translationStats.lastTranslationTime.toLocaleTimeString() : 
                  'Never'
                }
              </div>
              <div className="text-sm text-muted-foreground">Last Translation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Single Text Translation */}
      <Card>
        <CardHeader>
          <CardTitle>Single Text Translation</CardTitle>
          <CardDescription>Test translating individual pieces of text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Text to Translate:</label>
            <Textarea
              value={singleText}
              onChange={(e) => setSingleText(e.target.value)}
              placeholder="Enter text to translate..."
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={testSingleTranslation}
            disabled={singleLoading || !singleText.trim() || currentLanguage === 'en'}
            className="w-full"
          >
            {singleLoading ? '🔄 Translating...' : `🌐 Translate to ${currentLanguageInfo.name}`}
          </Button>
          
          {singleResult && (
            <div>
              <label className="text-sm font-medium">Translation Result:</label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                {singleResult}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Translation */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Translation</CardTitle>
          <CardDescription>Test translating multiple texts at once for better performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Texts to Translate (one per line):</label>
            <Textarea
              value={batchTexts}
              onChange={(e) => setBatchTexts(e.target.value)}
              placeholder="Enter multiple lines of text to translate..."
              className="mt-1 min-h-[120px]"
            />
          </div>
          
          <Button 
            onClick={testBatchTranslation}
            disabled={batchLoading || !batchTexts.trim() || currentLanguage === 'en'}
            className="w-full"
          >
            {batchLoading ? '🔄 Translating Batch...' : `🚀 Batch Translate to ${currentLanguageInfo.name}`}
          </Button>
          
          {batchResults.length > 0 && (
            <div>
              <label className="text-sm font-medium">Batch Translation Results:</label>
              <div className="mt-1 space-y-2">
                {batchResults.map((result, index) => (
                  <div key={index} className="p-3 bg-muted rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">Result {index + 1}:</div>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page Translation */}
      <Card>
        <CardHeader>
          <CardTitle>Page Translation</CardTitle>
          <CardDescription>Test translating the entire page content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Page translation will automatically translate all readable content on this page. 
              {currentLanguage === 'en' ? 
                ' Please select a non-English language to test this feature.' :
                ` It will translate to ${currentLanguageInfo.name}.`
              }
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-4">
            <Button 
              onClick={testPageTranslation}
              disabled={isTranslating || currentLanguage === 'en'}
              className="flex-1"
            >
              {isTranslating ? '🔄 Translating Page...' : `🌍 Translate Page to ${currentLanguageInfo.name}`}
            </Button>
            
            <Button 
              onClick={restoreOriginalPage}
              disabled={!isPageTranslated}
              variant="outline"
              className="flex-1"
            >
              🔄 Restore Original
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sample Content for Page Translation */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Content for Translation Testing</CardTitle>
          <CardDescription>This content will be translated when you use page translation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-xl font-semibold">About Civic Education</h3>
          <p>
            Civic education is the cornerstone of a healthy democracy. It empowers citizens with the knowledge 
            and skills necessary to participate effectively in democratic processes and hold their representatives accountable.
          </p>
          
          <h4 className="text-lg font-medium">Key Components:</h4>
          <ul className="list-disc list-inside space-y-2">
            <li>Understanding constitutional principles and the rule of law</li>
            <li>Learning about government structure and political processes</li>
            <li>Developing critical thinking skills for evaluating information</li>
            <li>Practicing civic engagement and community participation</li>
            <li>Building skills for constructive dialogue and debate</li>
          </ul>
          
          <blockquote className="border-l-4 border-primary pl-4 italic">
            "The best way to enhance freedom in other lands is to demonstrate here that our democratic 
            system is worthy of emulation." - Jimmy Carter
          </blockquote>
          
          <p>
            Modern civic education must address contemporary challenges including misinformation, 
            political polarization, and digital citizenship. Citizens need tools to navigate complex 
            information landscapes and engage constructively in democratic discourse.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}