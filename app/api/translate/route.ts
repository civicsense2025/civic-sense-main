import { NextRequest, NextResponse } from 'next/server'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100 // Increased for batch processing

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(key)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }

  limit.count++
  return false
}

// DeepL language code mapping
const DEEPL_LANGUAGE_MAP: Record<string, string> = {
  'en': 'EN-US',
  'es': 'ES',
  'fr': 'FR', 
  'de': 'DE',
  'it': 'IT',
  'pt': 'PT-PT',
  'ru': 'RU',
  'ja': 'JA',
  'ko': 'KO',
  'zh': 'ZH',
  'ar': 'AR',
  'hi': 'HI',
  'tr': 'TR',
  'pl': 'PL',
  'nl': 'NL',
  'sv': 'SV',
  'da': 'DA',
  'no': 'NB',
  'fi': 'FI',
  'el': 'EL',
  'cs': 'CS',
  'sk': 'SK',
  'sl': 'SL',
  'et': 'ET',
  'lv': 'LV',
  'lt': 'LT',
  'bg': 'BG',
  'ro': 'RO',
  'hu': 'HU',
  'uk': 'UK',
  'id': 'ID'
}

function mapLanguageCode(code: string): string {
  return DEEPL_LANGUAGE_MAP[code.toLowerCase()] || code.toUpperCase()
}

function createSafeBase64(text: string): string {
  try {
    // Handle Unicode characters properly
    const encoder = new TextEncoder()
    const uint8Array = encoder.encode(text)
    return btoa(String.fromCharCode(...uint8Array))
  } catch (error) {
    // Fallback: use a simple hash if base64 fails
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { text, texts, targetLanguage, preserveFormatting = true, splitSentences = '1', formality = 'default' } = body

    if (!process.env.DEEPL_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'DeepL API key not configured' },
        { status: 500 }
      )
    }

    // Handle both single text and batch requests
    const textsToTranslate: string[] = texts || (text ? [text] : [])
    
    if (textsToTranslate.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No text provided' },
        { status: 400 }
      )
    }

    // Validate text length (DeepL has limits)
    const totalLength = textsToTranslate.join('').length
    if (totalLength > 128000) { // DeepL's character limit per request
      return NextResponse.json(
        { success: false, error: 'Text too long for translation' },
        { status: 400 }
      )
    }

    // Filter out empty texts
    const validTexts = textsToTranslate.filter(t => t && t.trim().length > 0)
    if (validTexts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid text to translate' },
        { status: 400 }
      )
    }

    const deeplTargetLang = mapLanguageCode(targetLanguage)
    
    console.log(`Sending batch translation request to DeepL: { 
      textCount: ${validTexts.length}, 
      totalLength: ${totalLength}, 
      targetLanguage: '${deeplTargetLang}', 
      sourceLanguage: 'auto-detect' 
    }`)

    // Prepare form data for DeepL API
    const formData = new URLSearchParams()
    
    // Add all texts
    validTexts.forEach(t => {
      formData.append('text', t)
    })
    
    formData.append('target_lang', deeplTargetLang)
    formData.append('preserve_formatting', preserveFormatting ? '1' : '0')
    formData.append('split_sentences', splitSentences)
    
    if (formality !== 'default') {
      formData.append('formality', formality)
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`DeepL API error: ${response.status} - ${errorText}`)
      
      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Translation service rate limited' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: `Translation service error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (!data.translations || !Array.isArray(data.translations)) {
      console.error('Invalid response from DeepL:', data)
      return NextResponse.json(
        { success: false, error: 'Invalid response from translation service' },
        { status: 500 }
      )
    }

    console.log(`✅ Batch translation successful: ${data.translations.length} texts translated`)

    // For single text requests, return the old format for compatibility
    if (text && !texts) {
      const translation = data.translations[0]
      return NextResponse.json({
        success: true,
        translatedText: translation.text,
        detectedLanguage: translation.detected_source_language,
        usage: {
          charactersProcessed: totalLength,
          charactersRemaining: null
        }
      })
    }

    // For batch requests, return all translations
    return NextResponse.json({
      success: true,
      translations: data.translations.map((t: any) => ({
        translatedText: t.text,
        detectedLanguage: t.detected_source_language
      })),
      usage: {
        charactersProcessed: totalLength,
        charactersRemaining: null
      }
    })

  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Translation failed' 
      },
      { status: 500 }
    )
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