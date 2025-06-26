import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  CongressGovService, 
  OpenStatesService, 
  CivicElectionsService 
} from '@/lib/services/location-civic-apis'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { refreshAll = false, sources = [] } = body

    const results = {
      success: true,
      synced: {
        congress: 0,
        openstates: 0,
        elections: 0
      },
      errors: [] as string[],
      warnings: [] as string[]
    }

    // Initialize API services
    const congressAPI = new CongressGovService()
    const openStatesAPI = new OpenStatesService()
    const civicAPI = new CivicElectionsService()

    // Sync Congressional data
    if (refreshAll || sources.includes('congress')) {
      try {
        console.log('🔄 Syncing Congressional data...')
        
        // Get current Congress members
        const membersResponse = await congressAPI.getMembers()
        const members = membersResponse.members || []

        let congressSynced = 0
        for (const member of members.slice(0, 50)) { // Limit for demo
          try {
            // Check if representative already exists for any user
            const { data: existing } = await supabase
              .from('user_representatives')
              .select('id')
              .eq('source_id', member.bioguideId)
              .eq('data_source', 'congress_gov')
              .limit(1)
              .single()

            if (!existing) {
              // Insert as template that users can adopt
              await supabase
                .from('user_representatives')
                .insert({
                  user_id: user.id, // Admin user as owner
                  name: `${member.firstName} ${member.lastName}`,
                  office: member.terms?.[0]?.chamber === 'House of Representatives' ? 'Representative' : 'Senator',
                  level: 'federal',
                  party: member.partyName,
                  data_source: 'congress_gov',
                  source_id: member.bioguideId,
                  last_verified: new Date().toISOString(),
                  needs_manual_verification: false
                })

              congressSynced++
            }
          } catch (memberError) {
            console.warn(`Failed to sync member ${member.bioguideId}:`, memberError)
          }
        }

        results.synced.congress = congressSynced
        console.log(`✅ Synced ${congressSynced} Congressional members`)

      } catch (error) {
        const errorMsg = `Congress API error: ${error}`
        results.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Sync state data for major states
    if (refreshAll || sources.includes('openstates')) {
      try {
        console.log('🔄 Syncing state legislator data...')
        
        const majorStates = ['TX', 'CA', 'FL', 'NY', 'PA'] // Sample states
        let statesSynced = 0

        for (const state of majorStates) {
          try {
            const legislatorsResponse = await openStatesAPI.getLegislatorsByState(state)
            const legislators = (legislatorsResponse.results || []).slice(0, 10) // Limit per state

            for (const legislator of legislators) {
              try {
                // Check if legislator already exists
                const { data: existing } = await supabase
                  .from('user_representatives')
                  .select('id')
                  .eq('source_id', legislator.id)
                  .eq('data_source', 'openstates')
                  .limit(1)
                  .single()

                if (!existing) {
                  await supabase
                    .from('user_representatives')
                    .insert({
                      user_id: user.id,
                      name: legislator.name,
                      office: legislator.current_role?.title || 'State Legislator',
                      level: 'state',
                      party: legislator.party,
                      data_source: 'openstates',
                      source_id: legislator.id,
                      district_name: legislator.current_role?.district,
                      last_verified: new Date().toISOString(),
                      needs_manual_verification: false
                    })

                  statesSynced++
                }
              } catch (legislatorError) {
                console.warn(`Failed to sync legislator ${legislator.id}:`, legislatorError)
              }
            }

            // Small delay between states to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 1000))

          } catch (stateError) {
            console.warn(`Failed to sync state ${state}:`, stateError)
          }
        }

        results.synced.openstates = statesSynced
        console.log(`✅ Synced ${statesSynced} state legislators`)

      } catch (error) {
        const errorMsg = `OpenStates API error: ${error}`
        results.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Sync election data
    if (refreshAll || sources.includes('elections')) {
      try {
        console.log('🔄 Syncing election data...')
        
        const electionsResponse = await civicAPI.getElections()
        const elections = electionsResponse.elections || []

        let electionsSynced = 0
        for (const election of elections) {
          try {
            // Update or insert election
            await supabase
              .from('election_info')
              .upsert({
                election_id: election.id,
                election_name: election.name,
                election_date: election.electionDay,
                election_type: election.name.toLowerCase().includes('federal') ? 'federal' : 'local',
                ocd_ids: [election.ocdDivisionId],
                data_source: 'google_civic',
                last_synced: new Date().toISOString(),
                is_active: new Date(election.electionDay) > new Date()
              }, {
                onConflict: 'election_id'
              })

            electionsSynced++
          } catch (electionError) {
            console.warn(`Failed to sync election ${election.id}:`, electionError)
          }
        }

        results.synced.elections = electionsSynced
        console.log(`✅ Synced ${electionsSynced} elections`)

      } catch (error) {
        const errorMsg = `Google Civic API error: ${error}`
        results.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Update location coverage analysis
    try {
      console.log('🔄 Updating location coverage analysis...')
      
      // This is a simplified version - in reality you'd analyze actual user locations
      const { data: coverageData } = await supabase
        .from('location_coverage')
        .select('*')

      // Sample update to mark locations that might need attention
      if (coverageData && coverageData.length > 0) {
        for (const location of coverageData) {
          const needsAttention = 
            location.coverage_level.local === 'manual' || 
            location.coverage_level.federal === 'missing'

          await supabase
            .from('location_coverage')
            .update({
              needs_attention: needsAttention,
              last_updated: new Date().toISOString()
            })
            .eq('id', location.id)
        }
      }

    } catch (coverageError) {
      results.warnings.push(`Failed to update coverage analysis: ${coverageError}`)
    }

    // Final response
    const totalSynced = results.synced.congress + results.synced.openstates + results.synced.elections
    
    return NextResponse.json({
      ...results,
      message: `Sync completed. ${totalSynced} records updated.`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error during sync:', error)
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Get sync status information
    const [
      { data: congressReps },
      { data: stateReps },
      { data: elections },
      { data: coverage }
    ] = await Promise.all([
      supabase
        .from('user_representatives')
        .select('last_verified')
        .eq('data_source', 'congress_gov')
        .order('last_verified', { ascending: false })
        .limit(1),
      supabase
        .from('user_representatives')
        .select('last_verified')
        .eq('data_source', 'openstates')
        .order('last_verified', { ascending: false })
        .limit(1),
      supabase
        .from('election_info')
        .select('last_synced')
        .order('last_synced', { ascending: false })
        .limit(1),
      supabase
        .from('location_coverage')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
    ])

    return NextResponse.json({
      success: true,
      data: {
        lastSync: {
          congress: congressReps?.[0]?.last_verified || null,
          openstates: stateReps?.[0]?.last_verified || null,
          elections: elections?.[0]?.last_synced || null,
          coverage: coverage?.[0]?.last_updated || null
        },
        apiStatus: {
          congress_gov: process.env.CONGRESS_GOV_API_KEY ? 'configured' : 'missing_key',
          openstates: process.env.OPENSTATES_API_KEY ? 'configured' : 'missing_key',
          google_civic: process.env.GOOGLE_CIVIC_API_KEY ? 'configured' : 'missing_key',
          google_maps: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'missing_key'
        }
      }
    })

  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 