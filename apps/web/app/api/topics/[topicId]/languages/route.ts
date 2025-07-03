import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the topic with its translations
    const { data: topic, error } = await supabase
      .from('question_topics')
      .select('topic_id, translations')
      .eq('topic_id', params.topicId)
      .single()
    
    if (error) {
      console.error('Error fetching topic:', error)
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }
    
    // Extract available languages from translations
    const availableLanguages = new Set(['en']) // English is always available
    
    if (topic.translations && typeof topic.translations === 'object') {
      try {
        const translations = topic.translations as Record<string, any>
        
        // Check each translatable field for available languages
        Object.values(translations).forEach((fieldTranslations) => {
          if (fieldTranslations && typeof fieldTranslations === 'object') {
            Object.keys(fieldTranslations).forEach((langCode) => {
              if (fieldTranslations[langCode]?.text) {
                availableLanguages.add(langCode)
              }
            })
          }
        })
      } catch (error) {
        console.warn('Error parsing translations:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      topicId: params.topicId,
      availableLanguages: Array.from(availableLanguages).sort()
    })
    
  } catch (error) {
    console.error('Error in topics languages API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 