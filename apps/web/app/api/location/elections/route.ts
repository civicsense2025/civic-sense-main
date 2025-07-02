import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { CivicElectionsService } from '@civicsense/shared/lib/services/location-civic-apis'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get request body
    const body = await request.json()
    const { address } = body

    if (!address || typeof address !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Address is required'
      }, { status: 400 })
    }

    const civicAPI = new CivicElectionsService()

    try {
      // Get upcoming elections
      const electionsResponse = await civicAPI.getElections()
      const elections = electionsResponse.elections || []

      // Get voter info for the specific address
      let voterInfo = null
      const upcomingElection = elections.find((e: any) => new Date(e.electionDay) > new Date())

      if (upcomingElection) {
        try {
          voterInfo = await civicAPI.getVoterInfo(address, upcomingElection.id)
        } catch (voterError) {
          console.warn('Failed to get voter info:', voterError)
        }
      }

      // Process and enhance election data
      const processedElections = elections.map((election: any) => ({
        id: election.id,
        name: election.name,
        electionDay: election.electionDay,
        isUpcoming: new Date(election.electionDay) > new Date(),
        isPast: new Date(election.electionDay) < new Date(),
        ocdDivisionId: election.ocdDivisionId
      }))

      // Process voter info
      let processedVoterInfo = null
      if (voterInfo) {
        processedVoterInfo = {
          election: voterInfo.election,
          normalizedInput: voterInfo.normalizedInput,
          pollingLocations: voterInfo.pollingLocations || [],
          earlyVoteSites: voterInfo.earlyVoteSites || [],
          dropOffLocations: voterInfo.dropOffLocations || [],
          contests: voterInfo.contests || [],
          state: voterInfo.state?.[0] || null
        }
      }

      // If user is authenticated, save/update election tracking
      if (user && upcomingElection) {
        try {
          // First, ensure the election exists in our database
          await supabase
            .from('election_info')
            .upsert({
              election_id: upcomingElection.id,
              election_name: upcomingElection.name,
              election_date: upcomingElection.electionDay,
              election_type: upcomingElection.name.toLowerCase().includes('federal') ? 'federal' : 'local',
              ocd_ids: [upcomingElection.ocdDivisionId],
              voting_locations: processedVoterInfo?.pollingLocations || [],
              ballot_info: { contests: processedVoterInfo?.contests || [] },
              data_source: 'google_civic',
              last_synced: new Date().toISOString(),
              is_active: true
            }, {
              onConflict: 'election_id'
            })

          // Get the election record
          const { data: electionRecord } = await supabase
            .from('election_info')
            .select('id')
            .eq('election_id', upcomingElection.id)
            .single()

          if (electionRecord) {
            // Update user election tracking
            await supabase
              .from('user_election_tracking')
              .upsert({
                user_id: user.id,
                election_id: electionRecord.id,
                viewed_ballot_info: true,
                wants_reminders: true
              }, {
                onConflict: 'user_id,election_id'
              })
          }

        } catch (saveError) {
          console.error('Failed to save election data:', saveError)
          // Don't fail the request if save fails
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          address,
          elections: processedElections,
          upcomingElection: upcomingElection ? {
            ...upcomingElection,
            voterInfo: processedVoterInfo
          } : null,
          voterGuidance: {
            registrationDeadlines: voterInfo?.state?.[0]?.registrationDeadlines || null,
            absenteeVotingInfo: voterInfo?.state?.[0]?.absenteeVotingInfo || null,
            votingLocationFinderUrl: voterInfo?.state?.[0]?.votingLocationFinderUrl || null
          }
        }
      })

    } catch (apiError) {
      console.error('Civic API error:', apiError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch election information',
        details: 'Election data temporarily unavailable'
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Error fetching election info:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch election information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { searchParams } = new URL(request.url)
    
    const upcoming = searchParams.get('upcoming') === 'true'
    const state = searchParams.get('state')

    // Build query for elections
    let query = supabase
      .from('election_info')
      .select('*')
      .eq('is_active', true)
      .order('election_date', { ascending: false })

    if (upcoming) {
      query = query.gte('election_date', new Date().toISOString().split('T')[0])
    }

    if (state) {
      query = query.eq('state', state.toUpperCase())
    }

    const { data: elections, error } = await query

    if (error) {
      throw error
    }

    // If user is authenticated, include their tracking data
    let userTracking = null
    if (user && elections?.length) {
      const electionIds = elections.map(e => e.id)
      const { data: tracking } = await supabase
        .from('user_election_tracking')
        .select('*')
        .eq('user_id', user.id)
        .in('election_id', electionIds)

      userTracking = tracking || []
    }

    // Enhance elections with user tracking data
    const enhancedElections = elections?.map(election => ({
      ...election,
      userTracking: userTracking?.find(t => t.election_id === election.id) || null,
      isUpcoming: new Date(election.election_date) > new Date(),
      daysUntilElection: Math.ceil(
        (new Date(election.election_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        elections: enhancedElections,
        upcoming: enhancedElections.filter(e => e.isUpcoming),
        totalCount: enhancedElections.length
      }
    })

  } catch (error) {
    console.error('Error fetching elections:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch elections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 