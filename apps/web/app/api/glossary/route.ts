import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@civicsense/shared/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim() || ''
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  // Cast supabase as any to bypass missing table types
  const supa = supabase as any
  let supaQuery = supa
    .from('glossary_terms')
    .select('*')
    .order('term', { ascending: true })
    .limit(limit)

  if (query) {
    // Simple full-text search across term and definition
    supaQuery = supaQuery.textSearch('term', query, {
      type: 'websearch',
      config: 'english'
    })
    .textSearch('definition', query, {
      type: 'websearch',
      config: 'english'
    })
  }

  const { data, error } = await supaQuery

  if (error) {
    console.error('Glossary API error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ terms: data })
} 