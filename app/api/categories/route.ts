import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "example-anon-key"
)

export async function GET() {
  try {
    // Check if we have valid environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured, returning mock data')
      return NextResponse.json({ 
        categories: [], 
        synonyms: [],
        error: 'Database not configured'
      })
    }

    // Get canonical categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, emoji, description')
      .eq('is_active', true)
      .order('display_order')

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Get category synonyms
    const { data: synonyms, error: synonymsError } = await supabase
      .from('category_synonyms')
      .select('alias, category_id')

    if (synonymsError) {
      console.error('Error fetching synonyms:', synonymsError)
      return NextResponse.json({ error: 'Failed to fetch synonyms' }, { status: 500 })
    }

    return NextResponse.json({ 
      categories: categories || [], 
      synonyms: synonyms || [] 
    })
  } catch (error) {
    console.error('Unexpected error in categories API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 