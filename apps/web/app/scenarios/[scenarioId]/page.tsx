import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { ScenarioClient } from './client'

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// =============================================================================
// METADATA GENERATION
// =============================================================================

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ scenarioId: string }> 
}): Promise<Metadata> {
  const { scenarioId } = await params
  const supabase = await createClient()
  
  // Try to find scenario by ID first (if valid UUID), then by slug
  let scenario = null
  
  if (isValidUUID(scenarioId)) {
    const { data } = await supabase
      .from('scenarios')
      .select('scenario_title, description')
      .eq('id', scenarioId)
      .eq('is_active', true)
      .single()
    
    scenario = data
  }
  
  if (!scenario) {
    const { data: scenarioBySlug } = await supabase
      .from('scenarios')
      .select('scenario_title, description')
      .eq('scenario_slug', scenarioId)
      .eq('is_active', true)
      .single()
    
    scenario = scenarioBySlug
  }
  
  if (!scenario) {
    return {
      title: 'Scenario Not Found - CivicSense',
      description: 'The requested civic scenario could not be found.'
    }
  }
  
  return {
    title: `${scenario.scenario_title} - CivicSense Scenarios`,
    description: scenario.description || `Experience interactive civic education through the ${scenario.scenario_title} scenario.`,
    openGraph: {
      title: `${scenario.scenario_title} - CivicSense Scenarios`,
      description: scenario.description || `Experience interactive civic education through the ${scenario.scenario_title} scenario.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${scenario.scenario_title} - CivicSense Scenarios`,
      description: scenario.description || `Experience interactive civic education through the ${scenario.scenario_title} scenario.`,
    }
  }
}

// =============================================================================
// MAIN SCENARIO PAGE
// =============================================================================

export default async function ScenarioPage({ 
  params 
}: { 
  params: Promise<{ scenarioId: string }> 
}) {
  const { scenarioId } = await params
  const supabase = await createClient()
  
  // Get user authentication status
  const { data: { user } } = await supabase.auth.getUser()
  
  // Verify scenario exists and is active (check both ID and slug)
  let scenario = null
  
  if (isValidUUID(scenarioId)) {
    const { data } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('is_active', true)
      .single()
    
    scenario = data
  }
  
  // If not found by ID or not a UUID, try by slug
  if (!scenario) {
    const { data: scenarioBySlug } = await supabase
      .from('scenarios')
      .select('*')
      .eq('scenario_slug', scenarioId)
      .eq('is_active', true)
      .single()
    
    scenario = scenarioBySlug
  }
  
  if (!scenario) {
    notFound()
  }
  
  // Get user's previous attempts for this scenario
  let previousAttempts: any[] = []
  if (user) {
    const { data: attempts } = await supabase
      .from('user_scenario_attempts')
      .select(`
        id,
        attempt_number,
        started_at,
        completed_at,
        final_outcome,
        total_time_spent_seconds,
        difficulty_rating
      `)
      .eq('user_id', user.id)
      .eq('scenario_id', scenario.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    previousAttempts = attempts || []
  }
  
  return (
    <ScenarioClient 
      scenarioId={scenarioId}
      user={user}
      previousAttempts={previousAttempts}
    />
  )
} 