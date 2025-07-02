import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { locationCivicService, geocodingService } from '@civicsense/shared/lib/services/location-civic-apis'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get request body
    const body = await request.json()
    const { address, saveToProfile = false } = body

    if (!address || typeof address !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Address is required'
      }, { status: 400 })
    }

    // Try to geocode the address first for better results
    let lat: number | undefined
    let lng: number | undefined
    let formattedAddress = address

    try {
      const geoResult = await geocodingService.geocodeAddress(address)
      lat = geoResult.lat
      lng = geoResult.lng
      formattedAddress = geoResult.formattedAddress
    } catch (geoError) {
      console.warn('Geocoding failed, proceeding without coordinates:', geoError)
    }

    // Get representatives from all sources
    const results = await locationCivicService.getAllRepresentatives(address, lat, lng)

    // If user is authenticated and wants to save, store the data
    if (user && saveToProfile) {
      try {
        // Create location hash for tracking
        const locationHash = Buffer.from(formattedAddress.toLowerCase()).toString('base64').slice(0, 20)
        
        // Combine all representatives for saving
        const allRepresentatives = [
          ...results.federal,
          ...results.state,
          ...results.local
        ]

        // Save representatives to user profile
        await locationCivicService.saveRepresentatives(user.id, allRepresentatives, locationHash)

        // Save user location if geocoding was successful
        if (lat && lng) {
          const addressParts = formattedAddress.split(',').map(p => p.trim())
          await supabase
            .from('user_locations')
            .upsert({
              user_id: user.id,
              formatted_address: formattedAddress,
              latitude: lat,
              longitude: lng,
              city: addressParts[0] || '',
              state: addressParts[addressParts.length - 2] || '',
              zip_code: addressParts[addressParts.length - 1]?.match(/\d{5}/)?.[0] || '',
              is_primary: true,
              location_type: 'home'
            }, {
              onConflict: 'user_id,is_primary'
            })
        }

      } catch (saveError) {
        console.error('Failed to save user data:', saveError)
        // Don't fail the request if save fails
      }
    }

    // Return results with helpful guidance for missing data
    const response = {
      success: true,
      data: {
        address: formattedAddress,
        coordinates: lat && lng ? { lat, lng } : null,
        representatives: results,
        helpfulLinks: results.coverage.local === 'manual_lookup_required' 
          ? locationCivicService.generateLocalLookupGuide(address)
          : null
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching representatives:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch representatives',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

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

    // Get user's saved representatives
    const { data: representatives, error } = await supabase
      .from('user_representatives')
      .select(`
        id,
        name,
        office,
        level,
        party,
        phone,
        email,
        website_url,
        office_address,
        district_name,
        data_source,
        last_verified,
        needs_manual_verification
      `)
      .eq('user_id', user.id)
      .order('level', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    // Group by level for easier display
    const groupedReps = {
      federal: representatives?.filter(r => r.level === 'federal') || [],
      state: representatives?.filter(r => r.level === 'state') || [],
      local: representatives?.filter(r => r.level === 'local' || r.level === 'county' || r.level === 'municipal') || []
    }

    // Get user's primary location
    const { data: location } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        representatives: groupedReps,
        location,
        totalCount: representatives?.length || 0,
        lastUpdated: representatives?.[0]?.last_verified || null
      }
    })

  } catch (error) {
    console.error('Error fetching saved representatives:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch saved representatives',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 