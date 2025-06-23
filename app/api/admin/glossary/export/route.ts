import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const category = searchParams.get('category')
    const quality_min = searchParams.get('quality_min')
    const game_ready = searchParams.get('game_ready')

    // Build query
    let query = supabase
      .from('glossary_terms')
      .select('*')
      .eq('is_active', true)
      .order('term', { ascending: true })

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (quality_min) {
      query = query.gte('quality_score', parseInt(quality_min))
    }

    if (game_ready === 'true') {
      // Game ready terms should have examples and good quality
      query = query.gte('quality_score', 70)
    }

    const { data: terms, error } = await query

    if (error) {
      console.error('Error fetching terms for export:', error)
      return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 })
    }

    if (!terms || terms.length === 0) {
      return NextResponse.json({ error: 'No terms found for export' }, { status: 404 })
    }

    // Transform data for export
    const exportData = terms.map(term => ({
      id: term.id,
      term: term.term,
      definition: term.definition,
      category: term.category,
      part_of_speech: term.part_of_speech,
      examples: Array.isArray(term.examples) ? term.examples : [],
      synonyms: Array.isArray(term.synonyms) ? term.synonyms : [],
      uncomfortable_truth: term.uncomfortable_truth,
      power_dynamics: Array.isArray(term.power_dynamics) ? term.power_dynamics : [],
      action_steps: Array.isArray(term.action_steps) ? term.action_steps : [],
      quality_score: term.quality_score,
      ai_generated: term.ai_generated,
      source_content: term.source_content,
      created_at: term.created_at,
      updated_at: term.updated_at
    }))

    const timestamp = new Date().toISOString().split('T')[0]

    // Handle different export formats
    switch (format) {
      case 'json':
        return new Response(JSON.stringify({
          metadata: {
            exported_at: new Date().toISOString(),
            total_terms: exportData.length,
            filters: {
              category: category || 'all',
              quality_min: quality_min || 'none',
              game_ready: game_ready === 'true'
            },
            civicsense_standards: {
              truth_over_comfort: true,
              specific_naming: true,
              active_voice: true,
              power_dynamics_revealed: true,
              action_oriented: true
            }
          },
          terms: exportData
        }, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="civicsense-glossary-${timestamp}.json"`
          }
        })

      case 'csv':
        const csvHeaders = [
          'term', 'definition', 'category', 'part_of_speech', 
          'uncomfortable_truth', 'quality_score', 'ai_generated',
          'examples', 'synonyms', 'power_dynamics', 'action_steps'
        ]
        
        const csvRows = exportData.map(term => [
          term.term,
          term.definition,
          term.category || '',
          term.part_of_speech || '',
          term.uncomfortable_truth || '',
          term.quality_score || '',
          term.ai_generated || false,
          term.examples.join('; '),
          term.synonyms.join('; '),
          term.power_dynamics.join('; '),
          term.action_steps.join('; ')
        ])

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        return new Response(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="civicsense-glossary-${timestamp}.csv"`
          }
        })

      case 'game-matching':
        // Export for matching games - term/definition pairs
        const matchingPairs = exportData
          .filter(term => term.examples.length > 0 || term.quality_score >= 80)
          .map(term => ({
            id: term.id,
            term: term.term,
            definition: term.definition,
            difficulty: term.quality_score >= 90 ? 'easy' : term.quality_score >= 70 ? 'medium' : 'hard',
            category: term.category,
            distractors: term.examples.slice(0, 3) // Use examples as distractors
          }))

        return new Response(JSON.stringify({
          game_type: 'matching',
          exported_at: new Date().toISOString(),
          total_pairs: matchingPairs.length,
          terms: matchingPairs
        }, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="civicsense-matching-game-${timestamp}.json"`
          }
        })

      case 'game-lightning':
        // Export for lightning round - quick Q&A format
        const lightningQuestions = exportData
          .filter(term => term.quality_score >= 75)
          .map(term => ({
            id: term.id,
            question: `What is ${term.term}?`,
            answer: term.definition,
            category: term.category,
            difficulty: term.quality_score >= 90 ? 1 : term.quality_score >= 80 ? 2 : 3,
            time_limit: term.quality_score >= 90 ? 10 : 15, // seconds
            hints: term.examples.slice(0, 2)
          }))

        return new Response(JSON.stringify({
          game_type: 'lightning_practice',
          exported_at: new Date().toISOString(),
          total_questions: lightningQuestions.length,
          questions: lightningQuestions
        }, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="civicsense-lightning-game-${timestamp}.json"`
          }
        })

      case 'game-crossword':
        // Export for crossword puzzles
        const crosswordClues = exportData
          .filter(term => 
            term.term.length >= 3 && 
            term.term.length <= 15 && 
            !term.term.includes(' ') &&
            term.quality_score >= 70
          )
          .map(term => ({
            id: term.id,
            answer: term.term.toUpperCase(),
            clue: term.definition,
            length: term.term.length,
            category: term.category,
            difficulty: term.quality_score >= 90 ? 'easy' : term.quality_score >= 80 ? 'medium' : 'hard'
          }))

        return new Response(JSON.stringify({
          game_type: 'crossword',
          exported_at: new Date().toISOString(),
          total_clues: crosswordClues.length,
          clues: crosswordClues
        }, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="civicsense-crossword-${timestamp}.json"`
          }
        })

      default:
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in glossary export:', error)
    return NextResponse.json({ 
      error: 'Failed to export glossary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 