/**
 * ============================================================================
 * TRANSLATION CONTENT TYPES API ENDPOINT
 * ============================================================================
 * Provides information about available content types for translation
 * with their item counts and translatable field definitions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

interface ContentType {
  key: string
  name: string
  description: string
  total_items: number
  translatable_fields: string[]
  table_name: string
  sample_content?: any
}

// ============================================================================
// CONTENT TYPE DEFINITIONS
// ============================================================================

const CONTENT_TYPE_DEFINITIONS = [
  {
    key: 'question_topics',
    name: 'Question Topics',
    description: 'Quiz topic titles and descriptions for civic education',
    table_name: 'question_topics',
    translatable_fields: ['topic_title', 'description', 'why_this_matters'],
    icon: 'Target'
  },
  {
    key: 'quiz_questions', 
    name: 'Quiz Questions',
    description: 'Individual quiz questions with multiple choice answers',
    table_name: 'questions',
    translatable_fields: ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'explanation', 'hint'],
    icon: 'MessageSquare'
  },
  {
    key: 'glossary_terms',
    name: 'Glossary Terms',
    description: 'Civic education terminology and definitions',
    table_name: 'glossary_terms',
    translatable_fields: ['term', 'definition', 'examples', 'synonyms'],
    icon: 'BookOpen'
  },
  {
    key: 'ui_strings',
    name: 'UI Strings',
    description: 'User interface text and labels throughout the application',
    table_name: 'translations',
    translatable_fields: ['value', 'description'],
    icon: 'FileText'
  }
]

// ============================================================================
// GET HANDLER - Retrieve Content Types
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeCounts = searchParams.get('counts') === 'true'
    const includeSamples = searchParams.get('samples') === 'true'

    // Process each content type
    const contentTypesWithData = await Promise.all(
      CONTENT_TYPE_DEFINITIONS.map(async (contentTypeDef) => {
        const contentType: ContentType = {
          key: contentTypeDef.key,
          name: contentTypeDef.name,
          description: contentTypeDef.description,
          table_name: contentTypeDef.table_name,
          translatable_fields: contentTypeDef.translatable_fields,
          total_items: 0
        }

        if (includeCounts) {
          // Get item count for this content type
          const itemCount = await getContentItemCount(supabase, contentTypeDef.table_name)
          contentType.total_items = itemCount
        }

        if (includeSamples) {
          // Get sample content
          const sampleContent = await getSampleContent(supabase, contentTypeDef.table_name, contentTypeDef.translatable_fields)
          contentType.sample_content = sampleContent
        }

        return contentType
      })
    )

    // Calculate totals
    const totalItems = contentTypesWithData.reduce((sum, ct) => sum + ct.total_items, 0)
    const totalTranslatableFields = contentTypesWithData.reduce((sum, ct) => sum + ct.translatable_fields.length, 0)

    return NextResponse.json({
      success: true,
      content_types: contentTypesWithData,
      totals: {
        types: contentTypesWithData.length,
        items: totalItems,
        translatable_fields: totalTranslatableFields
      },
      metadata: {
        includes_counts: includeCounts,
        includes_samples: includeSamples,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching content types:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch content types',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getContentItemCount(supabase: any, tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.warn(`Could not get count for table ${tableName}:`, error.message)
      return 0
    }

    return count || 0
  } catch (error) {
    console.warn(`Error counting items in ${tableName}:`, error)
    return 0
  }
}

async function getSampleContent(supabase: any, tableName: string, translatableFields: string[]): Promise<any> {
  try {
    // Get a sample record to show what translatable content looks like
    const { data, error } = await supabase
      .from(tableName)
      .select(translatableFields.join(', '))
      .limit(1)
      .single()

    if (error) {
      console.warn(`Could not get sample content from ${tableName}:`, error.message)
      return null
    }

    // Filter out null/empty fields
    const filteredSample = Object.fromEntries(
      Object.entries(data || {}).filter(([_, value]) => value != null && value !== '')
    )

    return Object.keys(filteredSample).length > 0 ? filteredSample : null
  } catch (error) {
    console.warn(`Error getting sample content from ${tableName}:`, error)
    return null
  }
} 