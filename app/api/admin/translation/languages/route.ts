/**
 * ============================================================================
 * TRANSLATION LANGUAGES MANAGEMENT API
 * ============================================================================
 * Handles language configuration and translation completion statistics.
 * Supports enabling/disabling languages and tracking translation progress.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

interface Language {
  code: string
  name: string
  native: string
  enabled: boolean
  completion_percentage: number
  total_strings: number
  translated_strings: number
}

interface EnabledLanguagesConfig {
  enabled_languages: string[]
  last_updated: string
  updated_by: string
}

// ============================================================================
// SUPPORTED LANGUAGES CONFIGURATION
// ============================================================================

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

// ============================================================================
// GET HANDLER - Retrieve Language Settings
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get enabled languages from settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'enabled_languages')
      .single()

    let enabledLanguageCodes: string[] = []
    if (settings?.setting_value) {
      enabledLanguageCodes = Array.isArray(settings.setting_value) 
        ? settings.setting_value 
        : JSON.parse(settings.setting_value)
    } else {
      // Default enabled languages if no setting exists
      enabledLanguageCodes = ['es', 'fr', 'de']
    }

    // Calculate completion statistics for each language
    const languagesWithStats = await Promise.all(
      SUPPORTED_LANGUAGES.map(async (lang) => {
        const completionStats = await calculateLanguageCompletionStats(supabase, lang.code)
        
        return {
          ...lang,
          enabled: enabledLanguageCodes.includes(lang.code),
          completion_percentage: completionStats.completion_percentage,
          total_strings: completionStats.total_strings,
          translated_strings: completionStats.translated_strings
        }
      })
    )

    return NextResponse.json({
      success: true,
      languages: languagesWithStats,
      enabled_count: enabledLanguageCodes.length,
      supported_count: SUPPORTED_LANGUAGES.length
    })

  } catch (error) {
    console.error('Error fetching translation languages:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch translation languages',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

// ============================================================================
// POST HANDLER - Update Language Settings
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
    const { action, language_code, enabled } = body

    if (action === 'toggle' && language_code) {
      // Validate language code
      const isValidLanguage = SUPPORTED_LANGUAGES.some(lang => lang.code === language_code)
      if (!isValidLanguage) {
        return NextResponse.json({
          error: 'Invalid language code',
          success: false
        }, { status: 400 })
      }

      // Get current enabled languages
      const { data: currentSettings } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'enabled_languages')
        .single()

      let currentEnabledLanguages: string[] = []
      if (currentSettings?.setting_value) {
        currentEnabledLanguages = Array.isArray(currentSettings.setting_value) 
          ? currentSettings.setting_value 
          : JSON.parse(currentSettings.setting_value)
      }

      // Update enabled languages list
      let updatedEnabledLanguages: string[]
      if (enabled) {
        // Add language if not already enabled
        updatedEnabledLanguages = currentEnabledLanguages.includes(language_code)
          ? currentEnabledLanguages
          : [...currentEnabledLanguages, language_code]
      } else {
        // Remove language from enabled list
        updatedEnabledLanguages = currentEnabledLanguages.filter(code => code !== language_code)
      }

      // Update or insert settings
      const { error: settingsError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'enabled_languages',
          setting_value: updatedEnabledLanguages,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })

      if (settingsError) {
        throw new Error(`Failed to update language settings: ${settingsError.message}`)
      }

      const languageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === language_code)
      
      return NextResponse.json({
        success: true,
        message: `${enabled ? 'Enabled' : 'Disabled'} ${languageInfo?.native || language_code} translations`,
        language_code,
        enabled,
        total_enabled: updatedEnabledLanguages.length
      })
    }

    return NextResponse.json({
      error: 'Invalid action or missing parameters',
      success: false
    }, { status: 400 })

  } catch (error) {
    console.error('Error updating translation languages:', error)
    
    return NextResponse.json({ 
      error: 'Failed to update translation languages',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function calculateLanguageCompletionStats(supabase: any, languageCode: string) {
  try {
    // This would need to be implemented based on your actual translation schema
    // For now, returning mock data that varies by language
    
    const mockStats = {
      'es': { completion_percentage: 85, total_strings: 1247, translated_strings: 1060 },
      'fr': { completion_percentage: 72, total_strings: 1247, translated_strings: 898 },
      'de': { completion_percentage: 58, total_strings: 1247, translated_strings: 723 },
      'it': { completion_percentage: 45, total_strings: 1247, translated_strings: 561 },
      'pt': { completion_percentage: 67, total_strings: 1247, translated_strings: 835 },
      'vi': { completion_percentage: 32, total_strings: 1247, translated_strings: 399 },
      'zh': { completion_percentage: 28, total_strings: 1247, translated_strings: 349 },
      'ja': { completion_percentage: 24, total_strings: 1247, translated_strings: 299 },
      'ko': { completion_percentage: 19, total_strings: 1247, translated_strings: 237 },
      'ru': { completion_percentage: 41, total_strings: 1247, translated_strings: 511 },
      'pl': { completion_percentage: 36, total_strings: 1247, translated_strings: 449 },
      'nl': { completion_percentage: 53, total_strings: 1247, translated_strings: 661 },
      'sv': { completion_percentage: 47, total_strings: 1247, translated_strings: 586 }
    }

    return mockStats[languageCode as keyof typeof mockStats] || {
      completion_percentage: 0,
      total_strings: 1247,
      translated_strings: 0
    }

    /* TODO: Implement real translation completion tracking
    // Count translated strings from various content tables
    const [topicsResult, questionsResult, glossaryResult, uiResult] = await Promise.allSettled([
      // Question topics with translations
      supabase
        .from('question_topics')
        .select('id')
        .not('translations->' + languageCode, 'is', null),
        
      // Questions with translations  
      supabase
        .from('questions')
        .select('id')
        .not('translations->' + languageCode, 'is', null),
        
      // Glossary terms with translations
      supabase
        .from('glossary_terms')
        .select('id')
        .not('translations->' + languageCode, 'is', null),
        
      // UI strings with translations
      supabase
        .from('ui_string_translations')
        .select('translations')
        .eq('language_code', languageCode)
    ])

    // Calculate totals and translated counts
    const translatedCount = [topicsResult, questionsResult, glossaryResult]
      .reduce((total, result) => {
        return total + (result.status === 'fulfilled' ? (result.value.data?.length || 0) : 0)
      }, 0)

    // Get total content count
    const totalResult = await Promise.allSettled([
      supabase.from('question_topics').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('glossary_terms').select('id', { count: 'exact', head: true })
    ])

    const totalCount = totalResult.reduce((total, result) => {
      return total + (result.status === 'fulfilled' ? (result.value.count || 0) : 0)
    }, 0)

    const completion_percentage = totalCount > 0 ? Math.round((translatedCount / totalCount) * 100) : 0

    return {
      completion_percentage,
      total_strings: totalCount,
      translated_strings: translatedCount
    }
    */

  } catch (error) {
    console.error(`Error calculating completion stats for ${languageCode}:`, error)
    return {
      completion_percentage: 0,
      total_strings: 0,
      translated_strings: 0
    }
  }
} 