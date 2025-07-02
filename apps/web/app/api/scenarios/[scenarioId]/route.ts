import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

// =============================================================================
// GET SCENARIO DATA
// =============================================================================

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const { scenarioId } = await params
    const supabase = await createClient()
    
    let scenario = null
    let scenarioError = null
    
    // If scenarioId looks like a UUID, try ID lookup first
    if (isValidUUID(scenarioId)) {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .eq('is_active', true)
        .single()
      
      scenario = data
      scenarioError = error
    }
    
    // If not found by ID or not a UUID, try by slug
    if (!scenario) {
      const { data: scenarioBySlug, error: slugError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('scenario_slug', scenarioId)
        .eq('is_active', true)
        .single()
      
      scenario = scenarioBySlug
      scenarioError = slugError
    }
    
    if (scenarioError || !scenario) {
      console.error('Error fetching scenario:', scenarioError)
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      )
    }
    
    // Get scenario situations (ordered) - use the actual scenario ID
    const { data: situations, error: situationsError } = await supabase
      .from('scenario_situations')
      .select('*')
      .eq('scenario_id', scenario.id)
      .order('situation_order', { ascending: true })
    
    if (situationsError) {
      console.error('Error fetching situations:', situationsError)
      return NextResponse.json(
        { error: 'Failed to load scenario situations' },
        { status: 500 }
      )
    }
    
    // Get compatible characters
    const { data: allCharacters, error: charactersError } = await supabase
      .from('scenario_characters')
      .select('*')
      .order('character_name', { ascending: true })
    
    if (charactersError) {
      console.error('Error fetching characters:', charactersError)
      return NextResponse.json(
        { error: 'Failed to load characters' },
        { status: 500 }
      )
    }
    
    // Filter characters compatible with this scenario type
    const compatibleCharacters = allCharacters?.filter(character => {
      if (!character.usable_in_scenario_types) return true
      return character.usable_in_scenario_types.includes(scenario.scenario_type)
    }) || []
    
    // Get decisions for all situations
    const situationIds = situations?.map(s => s.id) || []
    const { data: allDecisions, error: decisionsError } = await supabase
      .from('scenario_decisions')
      .select('*')
      .in('situation_id', situationIds)
      .order('created_at', { ascending: true })
    
    if (decisionsError) {
      console.error('Error fetching decisions:', decisionsError)
      return NextResponse.json(
        { error: 'Failed to load scenario decisions' },
        { status: 500 }
      )
    }
    
    // Group decisions by situation_id
    const decisionsBySituation = (allDecisions || []).reduce((acc, decision) => {
      if (!acc[decision.situation_id]) {
        acc[decision.situation_id] = []
      }
      acc[decision.situation_id].push(decision)
      return acc
    }, {} as Record<string, any[]>)
    
    return NextResponse.json({
      scenario,
      situations: situations || [],
      characters: compatibleCharacters,
      decisions: decisionsBySituation
    })
    
  } catch (error) {
    console.error('Unexpected error in scenario API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// UPDATE SCENARIO (ADMIN ONLY)
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const { scenarioId } = await params
    const supabase = await createClient()
    
    // Check if user is authenticated and has admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check admin status
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    const isAdmin = userRoles?.some(role => role.role === 'admin')
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Update scenario
    const { data: updatedScenario, error: updateError } = await supabase
      .from('scenarios')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', scenarioId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating scenario:', updateError)
      return NextResponse.json(
        { error: 'Failed to update scenario' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      scenario: updatedScenario
    })
    
  } catch (error) {
    console.error('Unexpected error updating scenario:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE SCENARIO (ADMIN ONLY)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const { scenarioId } = await params
    const supabase = await createClient()
    
    // Check if user is authenticated and has admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check admin status
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    const isAdmin = userRoles?.some(role => role.role === 'admin')
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('scenarios')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', scenarioId)
    
    if (deleteError) {
      console.error('Error deleting scenario:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete scenario' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Scenario deactivated successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error deleting scenario:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 