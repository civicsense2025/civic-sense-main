import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get representatives with user counts
    const { data: representatives, error: repsError } = await supabase
      .from('user_representatives')
      .select(`
        id,
        name,
        office,
        level,
        party,
        data_source,
        last_verified,
        needs_manual_verification,
        user_id
      `)

    if (repsError) {
      throw repsError
    }

    // Get location coverage data
    const { data: locationCoverage, error: coverageError } = await supabase
      .from('location_coverage')
      .select('*')

    if (coverageError) {
      console.warn('Failed to fetch location coverage:', coverageError)
    }

    // Process representatives data
    const processedReps = representatives?.reduce((acc: any[], rep) => {
      const existingRep = acc.find(r => r.name === rep.name && r.office === rep.office)
      if (existingRep) {
        existingRep.user_count = (existingRep.user_count || 0) + 1
      } else {
        acc.push({
          ...rep,
          user_count: 1
        })
      }
      return acc
    }, []) || []

    // Calculate stats
    const stats = {
      totalRepresentatives: processedReps.length,
      federalCount: processedReps.filter(r => r.level === 'federal').length,
      stateCount: processedReps.filter(r => r.level === 'state').length,
      localCount: processedReps.filter(r => ['local', 'county', 'municipal'].includes(r.level)).length,
      needsVerification: processedReps.filter(r => r.needs_manual_verification).length,
      locationsNeedingAttention: locationCoverage?.filter(l => l.needs_attention).length || 0,
      dataSourceBreakdown: processedReps.reduce((acc: Record<string, number>, rep) => {
        acc[rep.data_source] = (acc[rep.data_source] || 0) + 1
        return acc
      }, {})
    }

    // Process location coverage for display
    const processedCoverage = locationCoverage?.map(location => ({
      ...location,
      user_count: representatives?.filter(r => 
        // This is a simplified count - in reality you'd need to track which users use which locations
        true
      ).length || 0
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        representatives: processedReps,
        locationCoverage: processedCoverage,
        stats
      }
    })

  } catch (error) {
    console.error('Error fetching admin representatives data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

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
    const { action, representativeData } = body

    switch (action) {
      case 'create': {
        if (!representativeData) {
          return NextResponse.json({
            success: false,
            error: 'Representative data required'
          }, { status: 400 })
        }

        const { error } = await supabase
          .from('user_representatives')
          .insert({
            user_id: user.id, // Admin user creates it
            name: representativeData.name,
            office: representativeData.office,
            level: representativeData.level,
            party: representativeData.party,
            phone: representativeData.phone,
            email: representativeData.email,
            website_url: representativeData.website_url,
            office_address: representativeData.office_address,
            district_name: representativeData.district_name,
            data_source: 'manual',
            needs_manual_verification: false,
            last_verified: new Date().toISOString()
          })

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          message: 'Representative created successfully'
        })
      }

      case 'verify': {
        const { representativeIds } = body
        
        if (!representativeIds || !Array.isArray(representativeIds)) {
          return NextResponse.json({
            success: false,
            error: 'Representative IDs required'
          }, { status: 400 })
        }

        const { error } = await supabase
          .from('user_representatives')
          .update({
            needs_manual_verification: false,
            last_verified: new Date().toISOString()
          })
          .in('id', representativeIds)

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          message: `${representativeIds.length} representatives verified`
        })
      }

      case 'delete': {
        const { representativeIds } = body
        
        if (!representativeIds || !Array.isArray(representativeIds)) {
          return NextResponse.json({
            success: false,
            error: 'Representative IDs required'
          }, { status: 400 })
        }

        const { error } = await supabase
          .from('user_representatives')
          .delete()
          .in('id', representativeIds)

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          message: `${representativeIds.length} representatives deleted`
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing representatives:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to manage representatives',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 