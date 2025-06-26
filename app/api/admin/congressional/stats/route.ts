import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    console.log('📊 Fetching congressional statistics...')

    const supabase = await createClient()
    
    const stats = {
      legislative_documents: 0,
      congressional_proceedings: 0,
      civic_analyses: 0,
      extracted_entities: 0,
      total_photos: 0,
      quiz_topics_generated: 0,
      quiz_questions_generated: 0,
      total_sources: 0
    }

    // Get legislative documents count (bills)
    const { count: billsCount } = await supabase
      .from('congressional_bills')
      .select('*', { count: 'exact', head: true })

    stats.legislative_documents = billsCount || 0

    // Get congressional proceedings count (hearings)
    const { count: hearingsCount } = await supabase
      .from('congressional_hearings')
      .select('*', { count: 'exact', head: true })

    stats.congressional_proceedings = hearingsCount || 0

    // Get civic analyses count (processed documents with AI analysis)
    const { count: analysesCount } = await supabase
      .from('congressional_bills')
      .select('*', { count: 'exact', head: true })
      .not('ai_generated_summary', 'is', null)

    stats.civic_analyses = analysesCount || 0

    // Get extracted entities count (people and organizations)
    const { count: entitiesCount } = await supabase
      .from('public_figures')
      .select('*', { count: 'exact', head: true })
      .not('bioguide_id', 'is', null)

    stats.extracted_entities = entitiesCount || 0

    // Get total photos count
    const { count: photosCount } = await supabase
      .from('congressional_photos')
      .select('*', { count: 'exact', head: true })

    stats.total_photos = photosCount || 0

    // Get quiz topics generated count
    const { count: topicsCount } = await supabase
      .from('question_topics')
      .select('*', { count: 'exact', head: true })
      .eq('ai_generated', true)

    stats.quiz_topics_generated = topicsCount || 0

    // Get quiz questions generated count
    const { count: questionsCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('ai_generated', true)

    stats.quiz_questions_generated = questionsCount || 0

    // Total sources (GovInfo, Congress.gov, unitedstates/images)
    stats.total_sources = 3

    console.log('✅ Congressional statistics fetched:', stats)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching congressional statistics:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 