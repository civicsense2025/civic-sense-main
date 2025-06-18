import { NextRequest, NextResponse } from 'next/server'

interface TranslateRequest {
  text: string
  targetLanguage: string
  sourceLanguage?: string
  preserveFormatting?: boolean
  splitSentences?: '0' | '1' | 'nonewlines'
  formality?: 'default' | 'more' | 'less' | 'prefer_more' | 'prefer_less'
}

interface TranslateResponse {
  success: boolean
  translatedText?: string
  detectedLanguage?: string
  usage?: {
    charactersProcessed: number
    charactersRemaining?: number
  }
  error?: string
}

interface DeepLTranslation {
  detected_source_language: string
  text: string
}

interface DeepLResponse {
  translations: DeepLTranslation[]
}

interface DeepLUsage {
  character_count: number
  character_limit: number
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json()
    const { 
      text, 
      targetLanguage, 
      sourceLanguage,
      preserveFormatting = true,
      splitSentences = '1',
      formality = 'default'
    } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Text is required'
      }, { status: 400 })
    }

    if (!targetLanguage || targetLanguage.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Target language is required'
      }, { status: 400 })
    }

    // Skip translation if target is English
    if (targetLanguage.toLowerCase() === 'en' || targetLanguage.toLowerCase() === 'english') {
      return NextResponse.json({
        success: true,
        translatedText: text,
        detectedLanguage: 'EN'
      })
    }

    const deeplApiKey = process.env.DEEPL_API_KEY
    if (!deeplApiKey) {
      return NextResponse.json({
        success: false,
        error: 'DeepL API not configured'
      }, { status: 500 })
    }

    // Determine if we're using the free or pro API
    const isFreeApi = deeplApiKey.endsWith(':fx')
    const baseUrl = isFreeApi 
      ? 'https://api-free.deepl.com/v2'
      : 'https://api.deepl.com/v2'

    // Map common language codes to DeepL format
    const languageMap: Record<string, string> = {
      'en': 'EN',
      'es': 'ES', 
      'fr': 'FR',
      'de': 'DE',
      'it': 'IT',
      'pt': 'PT',
      'ru': 'RU',
      'ja': 'JA',
      'ko': 'KO',
      'zh': 'ZH',
      'nl': 'NL',
      'pl': 'PL',
      'sv': 'SV',
      'da': 'DA',
      'fi': 'FI',
      'no': 'NB',
      'cs': 'CS',
      'hu': 'HU',
      'et': 'ET',
      'lv': 'LV',
      'lt': 'LT',
      'sk': 'SK',
      'sl': 'SL',
      'bg': 'BG',
      'ro': 'RO',
      'el': 'EL',
      'tr': 'TR',
      'uk': 'UK',
      'ar': 'AR',
      'hi': 'HI',
      'id': 'ID',
      'ms': 'MS',
      'th': 'TH',
      'vi': 'VI'
    }

    const normalizedTarget = targetLanguage.toLowerCase()
    const deeplTargetLang = languageMap[normalizedTarget] || targetLanguage.toUpperCase()
    
    // Validate text length (DeepL has limits)
    if (text.length > 5000) {
      return NextResponse.json({
        success: false,
        error: 'Text too long (maximum 5000 characters)'
      }, { status: 400 })
    }

    // Prepare the translation request
    const formData = new URLSearchParams()
    formData.append('text', text)
    formData.append('target_lang', deeplTargetLang)
    
    if (sourceLanguage) {
      const normalizedSource = sourceLanguage.toLowerCase()
      const deeplSourceLang = languageMap[normalizedSource] || sourceLanguage.toUpperCase()
      formData.append('source_lang', deeplSourceLang)
    }
    
    formData.append('preserve_formatting', preserveFormatting ? '1' : '0')
    formData.append('split_sentences', splitSentences)
    
    // Add formality if target language supports it
    const formalitySupported = ['DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'PT-PT', 'PT-BR', 'RU', 'JA']
    if (formality !== 'default' && formalitySupported.includes(deeplTargetLang)) {
      formData.append('formality', formality)
    }

    console.log('Sending translation request to DeepL:', {
      textLength: text.length,
      targetLanguage: deeplTargetLang,
      sourceLanguage: sourceLanguage || 'auto-detect'
    })

    // Make the translation request
    const translationResponse = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    if (!translationResponse.ok) {
      const errorText = await translationResponse.text()
      console.error('DeepL API error:', translationResponse.status, errorText)
      
      // Handle specific DeepL error codes
      if (translationResponse.status === 400) {
        return NextResponse.json({
          success: false,
          error: `Invalid request parameters: ${errorText}`
        }, { status: 400 })
      } else if (translationResponse.status === 403) {
        return NextResponse.json({
          success: false,
          error: 'DeepL API key invalid or quota exceeded'
        }, { status: 403 })
      } else if (translationResponse.status === 456) {
        return NextResponse.json({
          success: false,
          error: 'Character limit exceeded'
        }, { status: 429 })
      } else if (translationResponse.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Too many requests'
        }, { status: 429 })
      }
      
      throw new Error(`DeepL API error: ${translationResponse.status} - ${errorText}`)
    }

    const translationData: DeepLResponse = await translationResponse.json()
    
    if (!translationData.translations || translationData.translations.length === 0) {
      throw new Error('No translation returned from DeepL')
    }

    const translation = translationData.translations[0]

    // Get usage information
    let usage: { charactersProcessed: number; charactersRemaining?: number } = {
      charactersProcessed: text.length
    }

    try {
      const usageResponse = await fetch(`${baseUrl}/usage`, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
        }
      })

      if (usageResponse.ok) {
        const usageData: DeepLUsage = await usageResponse.json()
        usage.charactersRemaining = usageData.character_limit - usageData.character_count
      }
    } catch (error) {
      console.warn('Could not fetch usage data:', error)
    }

    const result: TranslateResponse = {
      success: true,
      translatedText: translation.text,
      detectedLanguage: translation.detected_source_language,
      usage
    }

    console.log(`Translation successful: ${text.length} characters, detected: ${translation.detected_source_language}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in translation API:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// GET endpoint to list supported languages
export async function GET() {
  try {
    const deeplApiKey = process.env.DEEPL_API_KEY
    if (!deeplApiKey) {
      return NextResponse.json({
        success: false,
        error: 'DeepL API not configured',
        languages: []
      })
    }

    const isFreeApi = deeplApiKey.endsWith(':fx')
    const baseUrl = isFreeApi 
      ? 'https://api-free.deepl.com/v2'
      : 'https://api.deepl.com/v2'

    // Get source languages
    const sourceResponse = await fetch(`${baseUrl}/languages?type=source`, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
      }
    })

    // Get target languages
    const targetResponse = await fetch(`${baseUrl}/languages?type=target`, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
      }
    })

    if (!sourceResponse.ok || !targetResponse.ok) {
      throw new Error('Failed to fetch supported languages')
    }

    const sourceLanguages = await sourceResponse.json()
    const targetLanguages = await targetResponse.json()

    return NextResponse.json({
      success: true,
      sourceLanguages,
      targetLanguages
    })

  } catch (error) {
    console.error('Error fetching languages:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      languages: []
    }, { status: 500 })
  }
} 