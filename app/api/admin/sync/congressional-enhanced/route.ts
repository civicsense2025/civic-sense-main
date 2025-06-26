import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-access';
import { EnhancedCongressSyncService } from '@/lib/services/enhanced-congress-sync-service';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication using the proper admin access system
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    // Parse sync options from request body
    const body = await request.json();
    const { 
      syncBills = true, 
      syncMembers = true, 
      syncHearings = true,
      syncCommitteeDocuments = true,
      generateEvents = true,
      extractEntities = true,
      generateQuizContent = true,
      congressNumbers = [117, 118, 119], // Support multiple congresses
      limit = 50 
    } = body;
    
    // Initialize enhanced sync service
    const enhancedSyncService = new EnhancedCongressSyncService();
    
    console.log(`🚀 Starting enhanced congressional sync for congresses: ${congressNumbers.join(', ')}`);
    
    // Perform comprehensive sync
    const results = await enhancedSyncService.performComprehensiveSync({
      syncBills,
      syncMembers,
      syncHearings,
      syncCommitteeDocuments,
      generateEvents,
      extractEntities,
      generateQuizContent,
      congressNumbers,
      limit
    });
    
    // Calculate totals
    const totalSynced = Object.values(results).reduce((sum, result) => sum + result.synced, 0);
    const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors, 0);
    
    // Save enhanced sync log to database
    const supabase = await createClient();
    await supabase
      .from('admin_sync_logs')
      .insert({
        sync_type: 'congressional_enhanced_govinfo',
        sync_options: { 
          syncBills, 
          syncMembers, 
          syncHearings, 
          syncCommitteeDocuments, 
          generateEvents, 
          extractEntities,
          generateQuizContent,
          congressNumbers,
          limit 
        },
        results: {
          ...results,
          totals: {
            synced: totalSynced,
            errors: totalErrors
          },
          completed_at: new Date().toISOString()
        },
        initiated_by: adminCheck.user!.id
      });
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced congressional sync with GovInfo integration completed',
      results: {
        ...results,
        totals: {
          synced: totalSynced,
          errors: totalErrors
        }
      }
    });
    
  } catch (error) {
    console.error('Enhanced congressional sync error:', error);
    return NextResponse.json({
      success: false,
      error: 'Enhanced sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get enhanced sync status and recent runs
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication using the proper admin access system
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    const supabase = await createClient();
    
    // Get recent enhanced sync logs
    const { data: syncLogs, error } = await supabase
      .from('admin_sync_logs')
      .select('*')
      .eq('sync_type', 'congressional_enhanced_govinfo')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    // Get current data counts
    const [
      { count: govInfoDocCount },
      { count: hearingCount },
      { count: witnessCount },
      { count: qaExchangeCount },
      { count: committeeDocCount },
      { count: eventCount },
      { count: billCount },
      { count: memberCount },
      { count: photoCount },
      { count: topicCount },
      { count: questionCount }
    ] = await Promise.all([
      supabase.from('govinfo_documents').select('*', { count: 'exact', head: true }),
      supabase.from('congressional_hearings').select('*', { count: 'exact', head: true }),
      supabase.from('hearing_witnesses').select('*', { count: 'exact', head: true }),
      supabase.from('hearing_qa_exchanges').select('*', { count: 'exact', head: true }),
      supabase.from('committee_documents').select('*', { count: 'exact', head: true }),
      supabase.from('civic_events').select('*', { count: 'exact', head: true }).eq('auto_generated', true),
      supabase.from('congressional_bills').select('*', { count: 'exact', head: true }),
      supabase.from('public_figures').select('*', { count: 'exact', head: true }).not('bioguide_id', 'is', null),
      supabase.from('congressional_photos').select('*', { count: 'exact', head: true }),
      supabase.from('question_topics').select('*', { count: 'exact', head: true }).eq('auto_generated', true),
      supabase.from('questions').select('*', { count: 'exact', head: true }).eq('auto_generated', true)
    ]);
    
    // Get recent activity summaries
    const { data: recentHearings } = await supabase
      .from('congressional_hearings')
      .select('hearing_title, hearing_date, committee_name, civic_education_value, congress_number')
      .order('hearing_date', { ascending: false })
      .limit(5);
    
    const { data: recentEvents } = await supabase
      .from('civic_events')
      .select('event_title, event_date, civic_significance, auto_generated, status')
      .eq('auto_generated', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    const { data: recentQuizTopics } = await supabase
      .from('question_topics')
      .select('topic_title, difficulty_level, civic_focus, document_source')
      .eq('auto_generated', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    return NextResponse.json({
      success: true,
      data: {
        currentCounts: {
          govInfoDocuments: govInfoDocCount || 0,
          hearings: hearingCount || 0,
          witnesses: witnessCount || 0,
          qaExchanges: qaExchangeCount || 0,
          committeeDocuments: committeeDocCount || 0,
          autoGeneratedEvents: eventCount || 0,
          bills: billCount || 0,
          members: memberCount || 0,
          localPhotos: photoCount || 0,
          autoGeneratedTopics: topicCount || 0,
          autoGeneratedQuestions: questionCount || 0
        },
        recentActivity: {
          hearings: recentHearings || [],
          events: recentEvents || [],
          quizTopics: recentQuizTopics || []
        },
        recentSyncs: syncLogs || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching enhanced sync status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 