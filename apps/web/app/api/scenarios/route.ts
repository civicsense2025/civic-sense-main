import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters for filtering
    const type = searchParams.get('type')
    const difficulty = searchParams.get('difficulty')
    const premium = searchParams.get('premium')
    const search = searchParams.get('search')
    
    // Build query
    let query = supabase
      .from('scenarios')
      .select(`
        id,
        scenario_title,
        scenario_slug,
        description,
        scenario_type,
        difficulty_level,
        estimated_duration_minutes,
        learning_objectives,
        key_concepts,
        is_active,
        is_premium,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('scenario_type', type)
    }
    
    if (difficulty && difficulty !== 'all') {
      const difficultyMap: Record<string, [number, number]> = {
        'beginner': [1, 2],
        'intermediate': [3, 3],
        'advanced': [4, 4],
        'expert': [5, 5]
      }
      const range = difficultyMap[difficulty]
      if (range) {
        query = query.gte('difficulty_level', range[0]).lte('difficulty_level', range[1])
      }
    }
    
    if (premium && premium !== 'all') {
      query = query.eq('is_premium', premium === 'premium')
    }

    const { data: scenarios, error } = await query

    if (error) {
      console.error('Error fetching scenarios:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scenarios' },
        { status: 500 }
      )
    }

    // Apply text search filter on the client side for more flexible matching
    let filteredScenarios = scenarios || []
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredScenarios = filteredScenarios.filter(scenario => 
        scenario.scenario_title.toLowerCase().includes(searchLower) ||
        scenario.description.toLowerCase().includes(searchLower) ||
        scenario.learning_objectives?.some((obj: string) => 
          obj.toLowerCase().includes(searchLower)
        ) ||
        scenario.key_concepts?.some((concept: string) => 
          concept.toLowerCase().includes(searchLower)
        )
      )
    }

    // Add computed fields for the UI
    const enhancedScenarios = await Promise.all(
      filteredScenarios.map(async (scenario) => {
        // Get character count for compatible characters
        const { data: allCharacters } = await supabase
          .from('scenario_characters')
          .select('usable_in_scenario_types')
        
        const characterCount = allCharacters?.filter(char => 
          !char.usable_in_scenario_types || 
          char.usable_in_scenario_types.includes(scenario.scenario_type)
        ).length || 0

        // Get situation count
        const { count: situationCount } = await supabase
          .from('scenario_situations')
          .select('*', { count: 'exact', head: true })
          .eq('scenario_id', scenario.id)

        // Get outcome count (approximate by counting decisions for this scenario)
        const { data: situationIds } = await supabase
          .from('scenario_situations')
          .select('id')
          .eq('scenario_id', scenario.id)
        
        const situationIdList = situationIds?.map(s => s.id) || []
        
        const { count: outcomeCount } = await supabase
          .from('scenario_decisions')
          .select('*', { count: 'exact', head: true })
          .in('situation_id', situationIdList)

        return {
          ...scenario,
          character_count: characterCount || 0,
          situation_count: situationCount || 0,
          outcome_count: outcomeCount || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      scenarios: enhancedScenarios,
      total: enhancedScenarios.length
    })

  } catch (error) {
    console.error('Unexpected error in scenarios API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 