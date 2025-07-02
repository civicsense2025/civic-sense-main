import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { extractTranslatableStrings } from '@civicsense/shared/lib/ui-strings-extractor'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')

    const supabase = await createClient()

    if (language) {
      // Get translations for specific language
      const { data, error } = await supabase
        .from('ui_string_translations')
        .select('*')
        .eq('language_code', language)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        language_code: language,
        translations: data?.translations || {},
        last_updated: data?.last_updated || null
      })
    } else {
      // Get translation stats for all languages
      const { data, error } = await supabase.rpc('get_ui_translation_stats')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        stats: data || []
      })
    }
  } catch (error) {
    console.error('UI translations API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, language_code, translations } = body

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'generate') {
      // Generate translations using DeepL
      if (!process.env.DEEPL_API_KEY) {
        return NextResponse.json({ error: 'DeepL API not configured' }, { status: 500 })
      }

      // Extract all translatable strings
      const translatableStrings = extractTranslatableStrings()
      
      // Check existing translations
      const { data: existingData } = await supabase
        .from('ui_string_translations')
        .select('translations')
        .eq('language_code', language_code)
        .single()

      const existingTranslations = existingData?.translations || {}
      const stringsToTranslate = translatableStrings.filter(
        item => !existingTranslations[item.path]?.text
      )

      if (stringsToTranslate.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All strings already translated',
          translated_count: 0
        })
      }

      // Translate in batches using DeepL API
      const batchSize = 50
      const updatedTranslations = { ...existingTranslations }
      let totalTranslated = 0

      for (let i = 0; i < stringsToTranslate.length; i += batchSize) {
        const batch = stringsToTranslate.slice(i, i + batchSize)
        const textsToTranslate = batch.map(item => item.text)

        try {
          // Call DeepL API
          const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
              'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              ...textsToTranslate.reduce((acc, text, index) => {
                acc[`text`] = text
                return acc
              }, {} as Record<string, string>),
              target_lang: language_code.toUpperCase(),
              preserve_formatting: '1'
            })
          })

          if (!response.ok) {
            throw new Error(`DeepL API error: ${response.status}`)
          }

          const data = await response.json()
          
          if (data.translations && Array.isArray(data.translations)) {
            // Store translations
            batch.forEach((item, index) => {
              const translatedText = data.translations[index]?.text || item.text
              updatedTranslations[item.path] = {
                text: translatedText,
                lastUpdated: new Date().toISOString(),
                autoTranslated: true
              }
              totalTranslated++
            })
          }

          // Rate limiting
          if (i + batchSize < stringsToTranslate.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error(`Translation batch failed:`, error)
          // Store originals for failed translations
          batch.forEach(item => {
            updatedTranslations[item.path] = {
              text: item.text,
              lastUpdated: new Date().toISOString(),
              autoTranslated: false
            }
          })
        }
      }

      // Save to database
      const { error } = await supabase
        .from('ui_string_translations')
        .upsert({
          language_code,
          translations: updatedTranslations,
          last_updated: new Date().toISOString()
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Generated ${totalTranslated} translations`,
        translated_count: totalTranslated,
        total_strings: Object.keys(updatedTranslations).length
      })

    } else if (action === 'update') {
      // Update specific translations
      const { error } = await supabase
        .from('ui_string_translations')
        .upsert({
          language_code,
          translations,
          last_updated: new Date().toISOString()
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Translations updated successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('UI translations POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')

    if (!language) {
      return NextResponse.json({ error: 'Language parameter required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('ui_string_translations')
      .delete()
      .eq('language_code', language)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Deleted translations for ${language}`
    })

  } catch (error) {
    console.error('UI translations DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete translations' },
      { status: 500 }
    )
  }
} 