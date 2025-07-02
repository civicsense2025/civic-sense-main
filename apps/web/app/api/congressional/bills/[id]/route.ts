import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@civicsense/shared/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    // Fetch bill with all related data
    const { data: bill, error } = await supabase
      .from('congressional_bills')
      .select(`
        *,
        primary_sponsor:public_figures!primary_sponsor_id (
          id,
          full_name,
          display_name,
          party_affiliation,
          current_state,
          current_district,
          congress_member_type,
          official_photo_url,
          bioguide_id
        ),
        bill_content_analysis (
          id,
          plain_english_summary,
          uncomfortable_truths,
          stake_analysis,
          key_provisions,
          affected_populations,
          economic_impact,
          power_dynamics,
          action_items,
          content_quality_score,
          fact_check_status,
          last_human_review
        ),
        bill_summaries (
          id,
          version_code,
          summary_text,
          action_date,
          action_description
        ),
        bill_actions (
          id,
          action_date,
          action_text,
          action_code,
          action_type,
          chamber,
          significance_score,
          ai_interpretation
        ),
        bill_subjects (
          id,
          subject_name,
          is_primary_subject
        ),
        bill_cosponsors!inner (
          id,
          date_cosponsored,
          is_original_cosponsor,
          cosponsor:public_figures!cosponsor_id (
            id,
            full_name,
            display_name,
            party_affiliation,
            current_state,
            congress_member_type,
            official_photo_url
          )
        ),
        bill_relationships!bill_id (
          id,
          relationship_type,
          related_bill:congressional_bills!related_bill_id (
            id,
            congress_number,
            bill_type,
            bill_number,
            title,
            current_status
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Bill not found'
        }, { status: 404 });
      }
      throw error;
    }
    
    // Format the response for easier consumption
    const formattedBill = {
      ...bill,
      // Sort actions by date (most recent first)
      bill_actions: bill.bill_actions?.sort((a: any, b: any) => 
        new Date(b.action_date).getTime() - new Date(a.action_date).getTime()
      ),
      // Group subjects by primary/secondary
      primary_subjects: bill.bill_subjects?.filter((s: any) => s.is_primary_subject),
      secondary_subjects: bill.bill_subjects?.filter((s: any) => !s.is_primary_subject),
      // Count cosponsors by party
      cosponsor_counts: {
        total: bill.bill_cosponsors?.length || 0,
        democrat: bill.bill_cosponsors?.filter((c: any) => 
          c.cosponsor?.party_affiliation?.includes('Democrat')
        ).length || 0,
        republican: bill.bill_cosponsors?.filter((c: any) => 
          c.cosponsor?.party_affiliation?.includes('Republican')
        ).length || 0,
        independent: bill.bill_cosponsors?.filter((c: any) => 
          c.cosponsor?.party_affiliation?.includes('Independent')
        ).length || 0
      }
    };
    
    return NextResponse.json({
      success: true,
      data: formattedBill
    });
    
  } catch (error) {
    console.error('Error fetching congressional bill:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bill',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 