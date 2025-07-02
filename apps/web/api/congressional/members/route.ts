import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@civicsense/shared/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Filter params
    const chamber = searchParams.get('chamber'); // 'house', 'senate'
    const state = searchParams.get('state');
    const district = searchParams.get('district');
    const party = searchParams.get('party');
    const search = searchParams.get('search');
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('public_figures')
      .select(`
        id,
        bioguide_id,
        full_name,
        display_name,
        slug,
        congress_member_type,
        current_state,
        current_district,
        party_affiliation,
        congressional_tenure_start,
        congressional_tenure_end,
        official_photo_url,
        photo_source,
        current_positions,
        office,
        description,
        congressional_terms!inner (
          id,
          congress_number,
          chamber,
          state_code,
          district,
          start_year,
          end_year,
          party_affiliation,
          member_type
        )
      `, { count: 'exact' })
      .not('bioguide_id', 'is', null) // Only congressional members
      .is('congressional_tenure_end', null) // Only current members by default
      .order('current_state', { ascending: true })
      .order('congress_member_type', { ascending: false }) // Senators first
      .order('current_district', { ascending: true, nullsFirst: true });
    
    // Apply filters
    if (chamber) {
      const memberType = chamber === 'house' ? 'representative' : 'senator';
      query = query.eq('congress_member_type', memberType);
    }
    
    if (state) {
      query = query.eq('current_state', state.toUpperCase());
    }
    
    if (district) {
      query = query.eq('current_district', parseInt(district));
    }
    
    if (party) {
      query = query.ilike('party_affiliation', `%${party}%`);
    }
    
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,display_name.ilike.%${search}%`);
    }
    
    // Execute query with pagination
    const { data: members, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    // Group members by state for easier display
    const membersByState = members?.reduce((acc: any, member: any) => {
      const state = member.current_state;
      if (!acc[state]) {
        acc[state] = {
          state,
          senators: [],
          representatives: []
        };
      }
      
      if (member.congress_member_type === 'senator') {
        acc[state].senators.push(member);
      } else {
        acc[state].representatives.push(member);
      }
      
      return acc;
    }, {}) || {};
    
    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        members: members || [],
        byState: Object.values(membersByState),
        summary: {
          total: count || 0,
          senators: members?.filter((m: any) => m.congress_member_type === 'senator').length || 0,
          representatives: members?.filter((m: any) => m.congress_member_type === 'representative').length || 0,
          democrats: members?.filter((m: any) => m.party_affiliation?.includes('Democrat')).length || 0,
          republicans: members?.filter((m: any) => m.party_affiliation?.includes('Republican')).length || 0,
          independents: members?.filter((m: any) => m.party_affiliation?.includes('Independent')).length || 0
        }
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching congressional members:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch members',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 