import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// Server-side analytics function since useAnalytics is for client-side only
const trackServerAnalytics = async (eventName: string, metadata: Record<string, any>) => {
  try {
    // In a real implementation, you'd send this to your analytics service
    // For now, just log it in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Server Analytics: ${eventName}`, metadata)
    }
    
    // You could integrate with services like PostHog, Mixpanel, etc. here
    // await fetch('your-analytics-endpoint', { method: 'POST', body: JSON.stringify({ eventName, metadata }) })
  } catch (error) {
    console.warn('Failed to track server analytics:', error)
    // Don't fail the request for analytics errors
  }
}

interface AutoSaveTranslationRequest {
  contentType: 'question' | 'topic' | 'collection'
  contentId: string
  targetLanguage: string
  translations: {
    [field: string]: {
      [language: string]: string
    }
  }
  source: 'automatic_game_translation' | 'automatic_collection_translation' | 'manual_contribution'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: AutoSaveTranslationRequest = await request.json()
    
    const { contentType, contentId, targetLanguage, translations, source } = body

    // Validate required fields
    if (!contentType || !contentId || !targetLanguage || !translations || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType, contentId, targetLanguage, translations, source' },
        { status: 400 }
      )
    }

    // Validate content type
    if (!['question', 'topic', 'collection'].includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid contentType. Must be: question, topic, or collection' },
        { status: 400 }
      )
    }

    // Determine the correct table based on content type
    let tableName: 'questions' | 'question_topics' | 'collections'
    let idField: string
    
    switch (contentType) {
      case 'question':
        tableName = 'questions'
        idField = 'id'
        break
      case 'topic':
        tableName = 'question_topics'
        idField = 'topic_id'
        break
      case 'collection':
        tableName = 'collections'
        idField = 'id'
        break
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    // Fetch current translations from the database
    const { data: currentRecord, error: fetchError } = await supabase
      .from(tableName)
      .select('translations')
      .eq(idField, contentId)
      .single()

    if (fetchError) {
      console.error(`Error fetching ${contentType}:`, fetchError)
      return NextResponse.json(
        { error: `Failed to fetch ${contentType}`, details: fetchError.message },
        { status: 500 }
      )
    }

    // Check if currentRecord exists and has translations property
    if (!currentRecord) {
      return NextResponse.json(
        { error: `${contentType} not found` },
        { status: 404 }
      )
    }

    // Merge existing translations with new ones
    const existingTranslations = (currentRecord as any)?.translations || {}
    const updatedTranslations = { ...existingTranslations }

    // Process each field's translations
    for (const [field, fieldTranslations] of Object.entries(translations)) {
      if (!updatedTranslations[field]) {
        updatedTranslations[field] = {}
      }

      for (const [language, text] of Object.entries(fieldTranslations)) {
        updatedTranslations[field][language] = {
          text: text,
          lastUpdated: new Date().toISOString(),
          autoTranslated: source.includes('automatic'),
          source: source
        }
      }
    }

    // Update the record with merged translations
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ 
        translations: updatedTranslations,
        updated_at: new Date().toISOString()
      })
      .eq(idField, contentId)

    if (updateError) {
      console.error(`Error updating ${contentType} translations:`, updateError)
      return NextResponse.json(
        { error: `Failed to save translations`, details: updateError.message },
        { status: 500 }
      )
    }

    // Track analytics for automatic translations
    if (source.includes('automatic')) {
      try {
        const fieldsCount = Object.keys(translations).length
        await trackServerAnalytics('automatic_translation_saved', {
          contentType,
          contentId,
          targetLanguage,
          fieldsTranslated: fieldsCount,
          source,
          timestamp: new Date().toISOString()
        })
      } catch (analyticsError) {
        console.warn('Failed to track translation analytics:', analyticsError)
        // Don't fail the request for analytics errors
      }
    }

    return NextResponse.json({
      success: true,
      message: `Translations saved successfully for ${contentType} ${contentId}`,
      fieldsUpdated: Object.keys(translations),
      targetLanguage,
      source
    })

  } catch (error) {
    console.error('Error in auto-save translations endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 