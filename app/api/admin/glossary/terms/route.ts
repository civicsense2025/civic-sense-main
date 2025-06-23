import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Enhanced glossary term schema for CivicSense
const GlossaryTermSchema = z.object({
  term: z.string().min(1).max(200),
  definition: z.string().min(1).max(2000),
  part_of_speech: z.string().optional(),
  category: z.string().optional(),
  examples: z.array(z.string()).optional(),
  synonyms: z.array(z.string()).optional(),
  difficulty_level: z.number().min(1).max(5).optional(),
  civicsense_priority: z.number().min(1).max(10).optional(),
  uncomfortable_truth: z.string().optional(),
  power_dynamics: z.array(z.string()).optional(),
  action_steps: z.array(z.string()).optional(),
  source_content: z.string().optional(),
  ai_generated: z.boolean().optional(),
  quality_score: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional()
})

// GET - Fetch all terms with enhanced CivicSense fields
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const quality_min = searchParams.get('quality_min')
    const ai_generated = searchParams.get('ai_generated')

    let query = supabase
      .from('glossary_terms')
      .select('*')
      .order('term', { ascending: true })

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (quality_min) {
      query = query.gte('quality_score', parseInt(quality_min))
    }

    if (ai_generated === 'true') {
      query = query.eq('ai_generated', true)
    }

    const { data: terms, error } = await query

    if (error) {
      console.error('Error fetching glossary terms:', error)
      return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 })
    }

    // Transform data to include proper arrays for examples, synonyms, power_dynamics, action_steps
    const transformedTerms = terms?.map(term => ({
      ...term,
      examples: Array.isArray(term.examples) ? term.examples : [],
      synonyms: Array.isArray(term.synonyms) ? term.synonyms : [],
      power_dynamics: Array.isArray(term.power_dynamics) ? term.power_dynamics : [],
      action_steps: Array.isArray(term.action_steps) ? term.action_steps : []
    })) || []

    return NextResponse.json({
      success: true,
      terms: transformedTerms,
      total: transformedTerms.length
    })

  } catch (error) {
    console.error('Error in glossary terms API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new term
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = GlossaryTermSchema.parse(body)

    // Check if term already exists
    const { data: existingTerm } = await supabase
      .from('glossary_terms')
      .select('id')
      .eq('term', validatedData.term)
      .single()

    if (existingTerm) {
      return NextResponse.json({ 
        error: 'Term already exists',
        details: 'A glossary term with this name already exists'
      }, { status: 400 })
    }

    // Create new term
    const { data: newTerm, error } = await supabase
      .from('glossary_terms')
      .insert([{
        ...validatedData,
        examples: validatedData.examples || [],
        synonyms: validatedData.synonyms || [],
        power_dynamics: validatedData.power_dynamics || [],
        action_steps: validatedData.action_steps || [],
        is_active: validatedData.is_active ?? true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating glossary term:', error)
      return NextResponse.json({ error: 'Failed to create term' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      term: newTerm,
      message: 'Glossary term created successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in glossary terms creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 