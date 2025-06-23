import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DeepL supported languages for civic education
const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' }
]

class DeepLLanguageService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.DEEPL_API_KEY || ''
    this.baseUrl = this.apiKey.endsWith(':fx') 
      ? 'https://api-free.deepl.com/v2' 
      : 'https://api.deepl.com/v2'
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async getSupportedLanguages(): Promise<typeof SUPPORTED_LANGUAGES> {
    if (!this.apiKey) {
      // Return limited fallback list if no API key
      return SUPPORTED_LANGUAGES.slice(0, 5)
    }

    try {
      const response = await fetch(`${this.baseUrl}/languages?type=target`, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`
        }
      })
      
      if (!response.ok) {
        console.warn('DeepL API not responding, using fallback languages')
        return SUPPORTED_LANGUAGES
      }
      
      const deepLLanguages = await response.json()
      
      // Map DeepL response to our format and filter for supported languages
      const supportedByDeepL = deepLLanguages.map((lang: any) => ({
        code: lang.language.toLowerCase(),
        name: lang.name,
        native: lang.name,
        supportsFormality: lang.supports_formality || false
      }))
      
      // Return intersection of our supported languages and DeepL's available languages
      return SUPPORTED_LANGUAGES.filter(lang => 
        supportedByDeepL.some((deepLLang: { code: string }) => deepLLang.code === lang.code)
      )
      
    } catch (error) {
      console.error('Error fetching DeepL languages:', error)
      return SUPPORTED_LANGUAGES
    }
  }

  async checkUsage(): Promise<{ character_count: number; character_limit: number; available: boolean }> {
    if (!this.apiKey) {
      return { character_count: 0, character_limit: 0, available: false }
    }

    try {
      const response = await fetch(`${this.baseUrl}/usage`, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`
        }
      })
      
      if (!response.ok) {
        return { character_count: 0, character_limit: 0, available: false }
      }
      
      const usage = await response.json()
      return {
        character_count: usage.character_count || 0,
        character_limit: usage.character_limit || 500000,
        available: true
      }
      
    } catch (error) {
      console.error('Error checking DeepL usage:', error)
      return { character_count: 0, character_limit: 0, available: false }
    }
  }
}

const deepLService = new DeepLLanguageService()

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeUsage = searchParams.get('usage') === 'true'

    // Get supported languages
    const languages = await deepLService.getSupportedLanguages()
    const isAvailable = await deepLService.isAvailable()

    let usage = null
    if (includeUsage && isAvailable) {
      usage = await deepLService.checkUsage()
    }

    return NextResponse.json({
      success: true,
      available: isAvailable,
      languages,
      usage,
      provider: 'deepl',
      message: isAvailable 
        ? `DeepL API available with ${languages.length} supported languages`
        : 'DeepL API not configured - add DEEPL_API_KEY to environment'
    })

  } catch (error) {
    console.error('Error fetching translation languages:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch translation languages',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      available: false,
      languages: SUPPORTED_LANGUAGES.slice(0, 3), // Basic fallback
      provider: 'fallback'
    }, { status: 500 })
  }
} 