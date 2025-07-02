import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@civicsense/shared/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Filter params
    const congress = searchParams.get('congress');
    const billType = searchParams.get('billType');
    const status = searchParams.get('status');
    const hasAnalysis = searchParams.get('hasAnalysis') === 'true';
    
    // Build query
    let query = supabase
      .from('congressional_bills')
      .select(`
        id,
        congress_api_id,
        congress_number,
        bill_type,
        bill_number,
        title,
        short_title,
        current_status,
        introduced_date,
        last_action_date,
        last_action_text,
        has_placeholder_text,
        primary_sponsor:public_figures!primary_sponsor_id (
          id,
          full_name,
          display_name,
          party_affiliation,
          current_state,
          congress_member_type,
          official_photo_url
        ),
        bill_content_analysis (
          plain_english_summary,
          uncomfortable_truths,
          stake_analysis,
          content_quality_score
        )
      `)
      .eq('has_placeholder_text', false) // Only show bills with real content
      .order('last_action_date', { ascending: false });
    
    // Apply filters
    if (congress) {
      query = query.eq('congress_number', parseInt(congress));
    }
    
    if (billType) {
      query = query.eq('bill_type', billType.toLowerCase());
    }
    
    if (status) {
      query = query.ilike('current_status', `%${status}%`);
    }
    
    if (hasAnalysis) {
      query = query.not('bill_content_analysis', 'is', null);
    }
    
    // Execute query with pagination
    const { data: bills, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      success: true,
      data: bills || [],
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
    console.error('Error fetching congressional bills:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bills',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 