/**
 * ============================================================================
 * DEEPL CONNECTION TEST ENDPOINT
 * ============================================================================
 * Tests DeepL API connectivity and validates API keys.
 * Provides usage information and supported languages.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// DEEPL CONNECTION TEST SERVICE
// ============================================================================

class DeepLConnectionTester {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = apiKey.endsWith(':fx') 
      ? 'https://api-free.deepl.com/v2' 
      : 'https://api.deepl.com/v2'
  }

  async testConnection(): Promise<{
    valid: boolean
    usage?: any
    languages?: any[]
    account_type?: 'free' | 'pro'
    error?: string
  }> {
    try {
      // Test API key with usage endpoint
      const usageResponse = await fetch(`${this.baseUrl}/usage`, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`
        }
      })

      if (!usageResponse.ok) {
        if (usageResponse.status === 403) {
          return { valid: false, error: 'Invalid API key' }
        }
        if (usageResponse.status === 429) {
          return { valid: false, error: 'Rate limit exceeded' }
        }
        return { valid: false, error: `HTTP ${usageResponse.status}: ${usageResponse.statusText}` }
      }

      const usage = await usageResponse.json()
      
      // Get supported languages
      const languagesResponse = await fetch(`${this.baseUrl}/languages?type=target`, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`
        }
      })

      let languages: any[] = []
      if (languagesResponse.ok) {
        languages = await languagesResponse.json()
      }

      // Determine account type
      const accountType = this.apiKey.endsWith(':fx') ? 'free' : 'pro'

      return {
        valid: true,
        usage: {
          character_count: usage.character_count || 0,
          character_limit: usage.character_limit || 500000,
          usage_percentage: usage.character_limit > 0 
            ? Math.round((usage.character_count / usage.character_limit) * 100 * 100) / 100
            : 0
        },
        languages: languages.map(lang => ({
          code: lang.language,
          name: lang.name,
          supports_formality: lang.supports_formality || false
        })),
        account_type: accountType
      }

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  async testTranslation(): Promise<{ success: boolean; translation?: string; error?: string }> {
    try {
      const testText = 'Hello, world!'
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: [testText],
          target_lang: 'ES' // Spanish
        })
      })

      if (!response.ok) {
        return { success: false, error: `Translation test failed: ${response.status}` }
      }

      const result = await response.json()
      return {
        success: true,
        translation: result.translations?.[0]?.text || 'No translation returned'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation test failed'
      }
    }
  }
}

// ============================================================================
// POST HANDLER - Test Connection
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { api_key } = body

    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({
        valid: false,
        error: 'API key is required',
        success: false
      }, { status: 400 })
    }

    // Initialize connection tester
    const tester = new DeepLConnectionTester(api_key)
    
    // Test connection
    const connectionResult = await tester.testConnection()
    
    if (!connectionResult.valid) {
      return NextResponse.json({
        valid: false,
        error: connectionResult.error,
        success: false
      })
    }

    // Test a sample translation
    const translationTest = await tester.testTranslation()

    return NextResponse.json({
      valid: true,
      success: true,
      connection_details: {
        account_type: connectionResult.account_type,
        usage: connectionResult.usage,
        supported_languages: connectionResult.languages?.length || 0,
        languages: connectionResult.languages?.slice(0, 5) // First 5 languages as sample
      },
      translation_test: translationTest,
      message: `DeepL API connection successful (${connectionResult.account_type} account)`
    })

  } catch (error) {
    console.error('Error testing DeepL connection:', error)
    
    return NextResponse.json({ 
      valid: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
} 