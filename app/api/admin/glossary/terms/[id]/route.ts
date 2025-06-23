import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Enhanced glossary term schema for updates
const UpdateGlossaryTermSchema = z.object({
  term: z.string().min(1).max(200).optional(),
  definition: z.string().min(1).max(2000).optional(),
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

// GET - Fetch individual term
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: term, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Term not found' }, { status: 404 })
      }
      console.error('Error fetching glossary term:', error)
      return NextResponse.json({ error: 'Failed to fetch term' }, { status: 500 })
    }

    // Transform data to include proper arrays
    const transformedTerm = {
      ...term,
      examples: Array.isArray(term.examples) ? term.examples : [],
      synonyms: Array.isArray(term.synonyms) ? term.synonyms : [],
      power_dynamics: Array.isArray(term.power_dynamics) ? term.power_dynamics : [],
      action_steps: Array.isArray(term.action_steps) ? term.action_steps : []
    }

    return NextResponse.json({
      success: true,
      term: transformedTerm
    })

  } catch (error) {
    console.error('Error in glossary term fetch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update term
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateGlossaryTermSchema.parse(body)

    // Check if term exists
    const { data: existingTerm, error: fetchError } = await supabase
      .from('glossary_terms')
      .select('id, term')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Term not found' }, { status: 404 })
      }
      console.error('Error fetching term for update:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch term' }, { status: 500 })
    }

    // If term name is being changed, check for duplicates
    if (validatedData.term && validatedData.term !== existingTerm.term) {
      const { data: duplicateTerm } = await supabase
        .from('glossary_terms')
        .select('id')
        .eq('term', validatedData.term)
        .neq('id', params.id)
        .single()

      if (duplicateTerm) {
        return NextResponse.json({ 
          error: 'Term name already exists',
          details: 'Another glossary term with this name already exists'
        }, { status: 400 })
      }
    }

    // Update term
    const { data: updatedTerm, error } = await supabase
      .from('glossary_terms')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating glossary term:', error)
      return NextResponse.json({ error: 'Failed to update term' }, { status: 500 })
    }

    // Transform response data
    const transformedTerm = {
      ...updatedTerm,
      examples: Array.isArray(updatedTerm.examples) ? updatedTerm.examples : [],
      synonyms: Array.isArray(updatedTerm.synonyms) ? updatedTerm.synonyms : [],
      power_dynamics: Array.isArray(updatedTerm.power_dynamics) ? updatedTerm.power_dynamics : [],
      action_steps: Array.isArray(updatedTerm.action_steps) ? updatedTerm.action_steps : []
    }

    return NextResponse.json({
      success: true,
      term: transformedTerm,
      message: 'Glossary term updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in glossary term update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete term
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if term exists
    const { data: existingTerm, error: fetchError } = await supabase
      .from('glossary_terms')
      .select('id, term')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Term not found' }, { status: 404 })
      }
      console.error('Error fetching term for deletion:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch term' }, { status: 500 })
    }

    // Delete term
    const { error } = await supabase
      .from('glossary_terms')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting glossary term:', error)
      return NextResponse.json({ error: 'Failed to delete term' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Glossary term deleted successfully',
      deleted_term: existingTerm.term
    })

  } catch (error) {
    console.error('Error in glossary term deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 