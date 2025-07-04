import { NextRequest, NextResponse } from 'next/server'

interface DeepLSuggestionRequest {
  texts: string[]
  targetLanguage: string
  sourceLanguage: string
}

export async function POST(request: NextRequest) {
  try {
    const body: DeepLSuggestionRequest = await request.json()
    const { texts, targetLanguage, sourceLanguage } = body

    // Validate input
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid texts array' },
        { status: 400 }
      )
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { error: 'Missing target language' },
        { status: 400 }
      )
    }

    // Check if DeepL is configured
    if (!process.env.DEEPL_API_KEY) {
      console.warn('DeepL API key not configured, skipping suggestions')
      return NextResponse.json({
        success: false,
        error: 'Translation service not available'
      })
    }

    // Map language codes for DeepL
    const deeplLanguageMap: Record<string, string> = {
      'es': 'ES',
      'it': 'IT',
      'zh': 'ZH',
      'vi': 'VI',
      'ar': 'AR',
      'hi': 'HI'
    }

    const deeplTargetLang = deeplLanguageMap[targetLanguage] || targetLanguage.toUpperCase()

    try {
      // Prepare request to DeepL API
      const formData = new URLSearchParams()
      texts.forEach(text => formData.append('text', text))
      formData.append('target_lang', deeplTargetLang)
      formData.append('source_lang', sourceLanguage.toUpperCase())
      formData.append('preserve_formatting', '1')
      formData.append('formality', 'more') // Use formal tone for civic education

      // Use DeepL Pro endpoint if available, otherwise use Free
      const deeplBaseUrl = process.env.DEEPL_API_KEY.includes(':fx') 
        ? 'https://api-free.deepl.com' 
        : 'https://api.deepl.com'

      const response = await fetch(`${deeplBaseUrl}/v2/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('DeepL API error:', response.status, errorText)
        return NextResponse.json({
          success: false,
          error: `Translation service error: ${response.status}`
        })
      }

      const deeplResult = await response.json()

      if (deeplResult.translations && Array.isArray(deeplResult.translations)) {
        const translations = deeplResult.translations.map((t: any) => t.text)
        
        return NextResponse.json({
          success: true,
          translations,
          sourceLanguage: deeplResult.translations[0]?.detected_source_language || sourceLanguage
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid response from translation service'
        })
      }

    } catch (deeplError) {
      console.error('DeepL translation failed:', deeplError)
      
      // Return a graceful fallback response
      return NextResponse.json({
        success: false,
        error: 'Translation suggestions temporarily unavailable'
      })
    }

  } catch (error) {
    console.error('DeepL suggestion API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process translation request' 
      },
      { status: 500 }
    )
  }
} 